import type { LoadedManifest } from "../config/manifest.js";
import { decodeRawEvent, normalizeContractValue } from "../contracts/codecs.js";
import { DikeContractClient } from "../contracts/client.js";
import type { StateRepository } from "../db/repositories/state-repository.js";
import type { Outcome } from "../domain/types.js";
import type { Logger } from "../observability/logger.js";
import type { MetricsStore } from "../observability/metrics.js";

const OUTCOMES: Outcome[] = ["Yes", "No", "Invalid"];

function contractOutcome(outcome: Outcome) {
  return { tag: outcome, values: undefined } as never;
}

function toAmount(value: unknown, fallback = "0") {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string" && value.length) {
    return value;
  }
  return fallback;
}

type ApprovalRecord = {
  address: string;
  approved: boolean;
};

export class ReconciliationService {
  constructor(
    private readonly manifest: LoadedManifest,
    private readonly contracts: DikeContractClient,
    private readonly repository: StateRepository,
    private readonly logger: Logger,
    private readonly metrics: MetricsStore,
  ) {}

  private async fetchRecentApprovalEvents(
    contractId: string,
    topic: string,
    latestLedger: number,
  ): Promise<ApprovalRecord[]> {
    const startLedger = Math.max(1, latestLedger - 5_000);
    const approvals = new Map<string, ApprovalRecord>();
    let cursor: string | undefined;

    for (let page = 0; page < 10; page += 1) {
      const response = await this.contracts.getEvents(
        cursor
          ? {
              cursor,
              filters: [{ type: "contract", contractIds: [contractId] }],
              limit: 100,
            }
          : {
              startLedger,
              endLedger: latestLedger,
              filters: [{ type: "contract", contractIds: [contractId] }],
              limit: 100,
            },
      );

      for (const event of response.events) {
        const decoded = decodeRawEvent(event);
        if (decoded.topic !== topic) continue;
        const address = typeof decoded.topicValues[1] === "string" ? decoded.topicValues[1] : null;
        if (!address) continue;
        approvals.set(address, {
          address,
          approved: decoded.payload === true,
        });
      }

      if (!response.cursor || response.events.length < 100) {
        break;
      }
      cursor = response.cursor;
    }

    return [...approvals.values()];
  }

  async reconcileGovernance(latestLedger: number) {
    const network = this.manifest.data.network;
    const governanceContractId = this.manifest.data.contracts.dike_governance;
    const marketFactoryContractId = this.manifest.data.contracts.market_factory;
    const councilContractId = this.manifest.data.contracts.council_of_dike;

    const [treasury, timelock, pauseAuthority, feeConfig] = await Promise.all([
      this.contracts.getTreasury().catch(() => null),
      this.contracts.getTimelock().catch(() => null),
      this.contracts.getPauseAuthority().catch(() => null),
      this.contracts.getFeeConfig().catch(() => null),
    ]);

    await this.repository.upsertGovernanceConfig(network, {
      treasury,
      timelock: timelock ?? this.manifest.data.contracts.dike_timelock,
      fee_config_json: normalizeContractValue(feeConfig ?? {}),
      pause_authority: pauseAuthority,
    });

    let [creatorApprovals, councilApprovals] = await Promise.all([
      this.repository.getLatestGovernanceApprovals(network, marketFactoryContractId, "creator"),
      this.repository.getLatestGovernanceApprovals(network, councilContractId, "member"),
    ]);

    if (creatorApprovals.length === 0) {
      creatorApprovals = await this.fetchRecentApprovalEvents(
        marketFactoryContractId,
        "creator",
        latestLedger,
      );
    }

    if (councilApprovals.length === 0) {
      councilApprovals = await this.fetchRecentApprovalEvents(
        councilContractId,
        "member",
        latestLedger,
      );
    }

    for (const approval of creatorApprovals) {
      await this.repository.upsertGovernanceList(
        network,
        "creator",
        approval.address,
        approval.approved,
      );
    }

    for (const approval of councilApprovals) {
      await this.repository.upsertGovernanceList(
        network,
        "member",
        approval.address,
        approval.approved,
      );
    }

    const roles = [
      "factory",
      "registry",
      "tokens",
      "vault",
      "amm",
      "oracle",
      "council",
      "gov",
      "timelock",
    ];

    for (const role of roles) {
      try {
        const moduleAddress = await this.contracts.getModule(role);
        await this.repository.upsertGovernanceModule(
          network,
          role,
          String(moduleAddress),
        );
      } catch (error) {
        this.logger.debug({ error, role }, "Unable to reconcile governance module");
      }
    }

    const [mismatchCount, persistentMismatchCount] = await Promise.all([
      this.repository.getMismatchCount(),
      this.repository.getPersistentMismatchCount(2),
    ]);
    this.metrics.setReconciliationMismatchCount(mismatchCount);
    this.metrics.setPersistentReconciliationMismatchCount(persistentMismatchCount);
    if (persistentMismatchCount > 0) {
      this.logger.warn(
        { persistentMismatchCount, latestLedger },
        "Reconciliation mismatches have persisted across at least two passes",
      );
    }
    this.logger.debug({ latestLedger }, "Governance reconciliation complete");
  }

  async reconcileMarket(marketId: number, latestLedger: number) {
    const market = await this.contracts.getMarket(marketId);
    const tradeable = await this.contracts.isTradeable(marketId).catch(() => null);
    const normalized = normalizeContractValue(market) as Record<string, unknown>;

    await this.repository.upsertMarketSummary({
      network: this.manifest.data.network,
      market_id: marketId,
      question: normalized.question ?? null,
      question_hash: normalized.question_hash ?? null,
      rules_uri: normalized.rules_uri ?? null,
      rules_hash: normalized.rules_hash ?? null,
      creator: normalized.creator ?? null,
      category: normalized.category ?? null,
      collateral: normalized.collateral ?? null,
      yes_token_id: normalized.yes_token_id ?? null,
      no_token_id: normalized.no_token_id ?? null,
      expiry: normalized.expiry ?? null,
      status: market.status.tag,
      has_final_outcome: normalized.has_final_outcome ?? false,
      final_outcome: market.final_outcome.tag,
      pool_id: normalized.pool_id ?? null,
      bond_amount: normalized.bond_amount ?? "0",
      dispute_window: normalized.dispute_window ?? null,
      has_request: normalized.has_request ?? false,
      request_id: normalized.request_id ?? null,
      created_at_unix: normalized.created_at ?? null,
      fee_config_json: JSON.stringify(normalizeContractValue(market.fee_config)),
      last_reconciled_ledger: latestLedger,
      reconciled_at: new Date().toISOString(),
    });

    if (typeof market.pool_id === "bigint" || typeof market.pool_id === "number") {
      await this.reconcilePool(Number(market.pool_id), latestLedger);
    }

    if (market.has_request) {
      await this.reconcileRequest(Number(market.request_id), latestLedger);
    }

    if (tradeable === false && market.status.tag === "Live") {
      await this.repository.noteMismatch(
        this.manifest.data.network,
        "market_registry",
        String(marketId),
        "Registry reports non-tradeable while projection is live",
      );
    }
  }

  async reconcilePool(poolId: number, latestLedger: number) {
    const pool = await this.contracts.getPool(poolId);
    const normalized = normalizeContractValue(pool) as Record<string, unknown>;
    await this.repository.upsertPool({
      network: this.manifest.data.network,
      pool_id: poolId,
      market_id: normalized.market_id ?? null,
      yes_reserve: normalized.yes_reserve ?? "0",
      no_reserve: normalized.no_reserve ?? "0",
      total_lp_shares: normalized.total_lp_shares ?? "0",
      accumulated_lp_fees: normalized.accumulated_lp_fees ?? "0",
      accumulated_protocol_fees: normalized.accumulated_protocol_fees ?? "0",
      accumulated_cod_fees: normalized.accumulated_cod_fees ?? "0",
      fee_per_share_scaled: normalized.fee_per_share_scaled ?? "0",
      live: normalized.live ?? false,
      last_reconciled_ledger: latestLedger,
      reconciled_at: new Date().toISOString(),
    });
    return {
      pool,
      normalized,
      marketId: typeof normalized.market_id === "string" || typeof normalized.market_id === "number"
        ? Number(normalized.market_id)
        : undefined,
    };
  }

  async reconcileRequest(requestId: number, latestLedger: number) {
    const request = await this.contracts.getRequest(requestId);
    const normalized = normalizeContractValue(request) as Record<string, unknown>;

    await this.repository.upsertResolutionRequest({
      network: this.manifest.data.network,
      request_id: requestId,
      market_id: normalized.market_id ?? null,
      status: request.status.tag,
      requested_at: normalized.requested_at ?? null,
      bond_amount: normalized.bond_amount ?? "0",
      dispute_window: normalized.dispute_window ?? null,
      has_proposal: normalized.has_proposal ?? false,
      proposer: normalized.proposer ?? null,
      proposed_outcome: request.proposed_outcome.tag,
      proposal_evidence_uri: normalized.proposal_evidence_uri ?? null,
      proposed_at: normalized.proposed_at ?? null,
      has_dispute: normalized.has_dispute ?? false,
      disputer: normalized.disputer ?? null,
      disputed_outcome: request.disputed_outcome.tag,
      dispute_evidence_uri: normalized.dispute_evidence_uri ?? null,
      disputed_at: normalized.disputed_at ?? null,
      has_final_outcome: normalized.has_final_outcome ?? false,
      final_outcome: request.final_outcome.tag,
      last_reconciled_ledger: latestLedger,
      reconciled_at: new Date().toISOString(),
    });

    try {
      const caseId = await this.contracts.getCaseForRequest(requestId);
      await this.reconcileCase(Number(caseId), latestLedger);
    } catch (error) {
      this.logger.debug({ error, requestId }, "No council case for request");
    }
  }

  async reconcileCase(caseId: number, latestLedger: number) {
    const councilCase = await this.contracts.getCase(caseId);
    const normalized = normalizeContractValue(councilCase) as Record<string, unknown>;
    const rewardPool = await this.contracts.getCaseRewardPool(caseId).catch(() => 0n);

    await this.repository.upsertCouncilCase({
      network: this.manifest.data.network,
      case_id: caseId,
      request_id: normalized.request_id ?? null,
      market_id: normalized.market_id ?? null,
      status: councilCase.status.tag,
      proposer: normalized.proposer ?? null,
      proposer_outcome: councilCase.proposer_outcome.tag,
      disputer: normalized.disputer ?? null,
      disputer_outcome: councilCase.disputer_outcome.tag,
      voting_start: normalized.voting_start ?? null,
      commit_end: normalized.commit_end ?? null,
      reveal_end: normalized.reveal_end ?? null,
      has_final_outcome: normalized.has_final_outcome ?? false,
      final_outcome: councilCase.final_outcome.tag,
      yes_votes: normalized.yes_votes ?? 0,
      no_votes: normalized.no_votes ?? 0,
      invalid_votes: normalized.invalid_votes ?? 0,
      total_valid_votes: normalized.total_valid_votes ?? 0,
      reward_pool: toAmount(rewardPool),
      last_reconciled_ledger: latestLedger,
      reconciled_at: new Date().toISOString(),
    });
  }

  async reconcileVault(marketId: number, latestLedger: number) {
    const vault = await this.contracts.getVaultAccounting(marketId);
    const normalized = normalizeContractValue(vault) as Record<string, unknown>;
    await this.repository.upsertVaultSnapshot({
      network: this.manifest.data.network,
      market_id: marketId,
      ...normalized,
      last_reconciled_ledger: latestLedger,
      reconciled_at: new Date().toISOString(),
    });
  }

  async reconcileUserPosition(
    marketId: number,
    owner: string,
    latestLedger: number,
    outcomes: Outcome[] = OUTCOMES,
  ) {
    for (const outcome of outcomes) {
      const balance = await this.contracts
        .getPositionBalance(owner, marketId, contractOutcome(outcome))
        .catch((error) => {
          this.logger.debug({ error, marketId, owner, outcome }, "Unable to reconcile user position");
          return null;
        });

      if (balance === null) {
        continue;
      }

      await this.repository.upsertUserPosition({
        network: this.manifest.data.network,
        market_id: marketId,
        owner,
        outcome,
        balance: toAmount(balance),
        last_reconciled_ledger: latestLedger,
        reconciled_at: new Date().toISOString(),
      });
    }
  }

  async reconcileLpPosition(poolId: number, owner: string, latestLedger: number) {
    const [shares, checkpoint, claimable] = await Promise.all([
      this.contracts.getLpBalance(poolId, owner),
      this.contracts.getLpFeeCheckpoint(poolId, owner).catch(() => 0n),
      this.contracts.getClaimableLpFees(poolId, owner).catch(() => 0n),
    ]);
    await this.repository.upsertLpPosition({
      network: this.manifest.data.network,
      pool_id: poolId,
      owner,
      shares: toAmount(shares),
      fee_checkpoint: toAmount(checkpoint),
      claimable_fees: toAmount(claimable),
      last_reconciled_ledger: latestLedger,
      reconciled_at: new Date().toISOString(),
    });
  }

  async recordLpFeesClaimed(poolId: number, owner: string, amount: string, latestLedger: number) {
    await this.reconcileLpPosition(poolId, owner, latestLedger);
    await this.repository.addLpFeesClaimed(this.manifest.data.network, poolId, owner, amount);
  }

  async reconcileUserVaultState(marketId: number, owner: string, latestLedger: number) {
    const [
      userDeposit,
      rootStakeYes,
      rootStakeNo,
      childUsedTotal,
      childUsedYes,
      childUsedNo,
      childDebt,
      parentDebtYes,
      parentDebtNo,
      redeemedYes,
      redeemedNo,
      redeemedInvalid,
    ] = await Promise.all([
      this.contracts.getUserDeposit(marketId, owner).catch(() => 0n),
      this.contracts.getRootStake(marketId, owner, contractOutcome("Yes")).catch(() => 0n),
      this.contracts.getRootStake(marketId, owner, contractOutcome("No")).catch(() => 0n),
      this.contracts.getChildCollateralUsed(marketId, owner).catch(() => 0n),
      this.contracts.getChildUsedForOutcome(marketId, owner, contractOutcome("Yes")).catch(() => 0n),
      this.contracts.getChildUsedForOutcome(marketId, owner, contractOutcome("No")).catch(() => 0n),
      this.contracts.getChildDebt(marketId, owner).catch(() => 0n),
      this.contracts.getParentDebt(marketId, owner, contractOutcome("Yes")).catch(() => 0n),
      this.contracts.getParentDebt(marketId, owner, contractOutcome("No")).catch(() => 0n),
      this.contracts.getRedeemed(marketId, owner, contractOutcome("Yes")).catch(() => 0n),
      this.contracts.getRedeemed(marketId, owner, contractOutcome("No")).catch(() => 0n),
      this.contracts.getRedeemed(marketId, owner, contractOutcome("Invalid")).catch(() => 0n),
    ]);

    await this.repository.upsertUserVaultState({
      network: this.manifest.data.network,
      market_id: marketId,
      owner,
      user_deposit: toAmount(userDeposit),
      root_stake_yes: toAmount(rootStakeYes),
      root_stake_no: toAmount(rootStakeNo),
      child_used_total: toAmount(childUsedTotal),
      child_used_yes: toAmount(childUsedYes),
      child_used_no: toAmount(childUsedNo),
      child_debt: toAmount(childDebt),
      parent_debt_yes: toAmount(parentDebtYes),
      parent_debt_no: toAmount(parentDebtNo),
      redeemed_yes: toAmount(redeemedYes),
      redeemed_no: toAmount(redeemedNo),
      redeemed_invalid: toAmount(redeemedInvalid),
      last_reconciled_ledger: latestLedger,
      reconciled_at: new Date().toISOString(),
    });
  }

  async reconcileTimelockAction(actionId: number, latestLedger: number) {
    const action = await this.contracts.getTimelockAction(actionId);
    const normalized = normalizeContractValue(action) as Record<string, unknown>;
    await this.repository.upsertTimelockAction({
      network: this.manifest.data.network,
      action_id: actionId,
      kind: action.kind.tag,
      target: normalized.target ?? null,
      payload_json: JSON.stringify(action.payload, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
      execute_after: normalized.execute_after ?? null,
      expires_at: normalized.expires_at ?? null,
      executed: normalized.executed ?? false,
      cancelled: normalized.cancelled ?? false,
      payload_hash: normalized.payload_hash ?? null,
      last_reconciled_ledger: latestLedger,
      reconciled_at: new Date().toISOString(),
    });
    this.logger.debug({ actionId, latestLedger }, "Timelock action reconciliation complete");
  }
}
