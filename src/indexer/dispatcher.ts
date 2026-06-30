import type { LoadedManifest } from "../config/manifest.js";
import { DikeContractClient } from "../contracts/client.js";
import type { EventRecord } from "../db/repositories/state-repository.js";
import type { StateRepository } from "../db/repositories/state-repository.js";
import { outcomeTag, type Outcome } from "../domain/types.js";
import type { ReconciliationService } from "../jobs/reconciliation.js";
import type { Logger } from "../observability/logger.js";

function numericValue(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "string" && value.length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}

function hasNumericValue(value: number | undefined): value is number {
  return value !== undefined;
}

function indexedValue(value: unknown, indexes: number[]): unknown {
  if (!Array.isArray(value)) {
    return undefined;
  }

  for (const index of indexes) {
    if (value[index] !== undefined && value[index] !== null) {
      return value[index];
    }
  }
}

function recordValue(value: unknown, keys: string[], indexes: number[] = []): unknown {
  const indexed = indexedValue(value, indexes);
  if (indexed !== undefined) {
    return indexed;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.length) {
    return value;
  }
  if (typeof value === "bigint" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
}

function amountValue(value: unknown) {
  return stringValue(value) ?? "0";
}

function outcomeValue(value: unknown): Outcome | undefined {
  const tagged = outcomeTag(value);
  if (tagged) {
    return tagged;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
}

function valueAt(values: unknown[], index: number) {
  return values[index] === undefined || values[index] === null ? undefined : values[index];
}

function firstString(
  values: unknown[],
  payload: unknown,
  topicIndexes: number[],
  keys: string[],
  payloadIndexes: number[] = [],
) {
  for (const index of topicIndexes) {
    const value = stringValue(valueAt(values, index));
    if (value) {
      return value;
    }
  }
  return stringValue(recordValue(payload, keys, payloadIndexes));
}

function firstOutcome(
  values: unknown[],
  payload: unknown,
  topicIndexes: number[],
  keys: string[],
  payloadIndexes: number[] = [],
): Outcome | undefined {
  for (const index of topicIndexes) {
    const value = outcomeValue(valueAt(values, index));
    if (value) {
      return value;
    }
  }
  return outcomeValue(recordValue(payload, keys, payloadIndexes));
}

function contractModuleFor(manifest: LoadedManifest, contractId: string) {
  const found = Object.entries(manifest.data.contracts).find(
    ([, deployedId]) => deployedId === contractId,
  );
  return found?.[0];
}

export class EventDispatcher {
  constructor(
    private readonly manifest: LoadedManifest,
    private readonly repository: StateRepository,
    private readonly contracts: DikeContractClient,
    private readonly reconciliation: ReconciliationService,
    private readonly logger: Logger,
  ) {}

  async dispatch(event: EventRecord) {
    const module = contractModuleFor(this.manifest, event.contractId);
    const latestLedger = event.ledger;
    const topicValues = event.topicValues;
    const payload = event.payload;

    switch (module) {
      case "market_factory":
        await this.dispatchMarketFactory(event, latestLedger, topicValues);
        return;
      case "market_registry":
        await this.dispatchMarketRegistry(event, latestLedger, topicValues, payload);
        return;
      case "amm":
        await this.dispatchAmm(event, latestLedger, topicValues, payload);
        return;
      case "collateral_vault":
        await this.dispatchCollateralVault(event, latestLedger, topicValues, payload);
        return;
      case "conditional_tokens":
        await this.dispatchConditionalTokens(event, latestLedger, topicValues, payload);
        return;
      case "cod_oracle":
        await this.dispatchCodOracle(event, latestLedger, topicValues, payload);
        return;
      case "council_of_dike":
        await this.dispatchCouncil(event, latestLedger, topicValues, payload);
        return;
      case "dike_governance":
      case "fee_manager":
        await this.reconciliation.reconcileGovernance(latestLedger);
        return;
      case "dike_timelock":
        await this.dispatchTimelock(event, latestLedger, topicValues);
        return;
      default:
        this.logger.warn(
          { topic: event.topic, contractId: event.contractId },
          "Unknown contract id while dispatching event",
        );
    }
  }

  private async dispatchMarketFactory(event: EventRecord, latestLedger: number, topicValues: unknown[]) {
    switch (event.topic) {
      case "mkt_new": {
        const marketId = numericValue(topicValues[1]);
        if (hasNumericValue(marketId)) {
          await this.reconciliation.reconcileMarket(marketId, latestLedger);
        }
        return;
      }
      case "modules":
      case "creator":
      case "collat":
      case "pause":
        await this.reconciliation.reconcileGovernance(latestLedger);
        return;
      default:
        this.warnUnknown(event);
    }
  }

  private async dispatchMarketRegistry(
    event: EventRecord,
    latestLedger: number,
    topicValues: unknown[],
    payload: unknown,
  ) {
    switch (event.topic) {
      case "mkt_new":
      case "status":
      case "final":
      case "fee_cfg": {
        const marketId = numericValue(topicValues[1]);
        if (hasNumericValue(marketId)) {
          await this.reconciliation.reconcileMarket(marketId, latestLedger);
        }
        return;
      }
      case "res_req": {
        const marketId = numericValue(topicValues[1]);
        const requestId = numericValue(payload);
        if (hasNumericValue(marketId)) {
          await this.reconciliation.reconcileMarket(marketId, latestLedger);
        }
        if (hasNumericValue(requestId)) {
          await this.reconciliation.reconcileRequest(requestId, latestLedger);
        }
        return;
      }
      case "role":
      case "collat":
      case "pause":
        await this.reconciliation.reconcileGovernance(latestLedger);
        return;
      default:
        this.warnUnknown(event);
    }
  }

  private async dispatchAmm(event: EventRecord, latestLedger: number, topicValues: unknown[], payload: unknown) {
    switch (event.topic) {
      case "pool": {
        const marketId = numericValue(topicValues[1]);
        if (hasNumericValue(marketId)) {
          await this.reconciliation.reconcileMarket(marketId, latestLedger);
        }
        const poolId = numericValue(payload);
        if (hasNumericValue(poolId)) {
          await this.reconciliation.reconcilePool(poolId, latestLedger);
        }
        return;
      }
      case "seed":
      case "lp_add":
      case "lp_rm":
      case "buy":
      case "sell": {
        const poolId = numericValue(topicValues[1]);
        if (hasNumericValue(poolId)) {
          const poolState = await this.reconciliation.reconcilePool(poolId, latestLedger);
          const marketId = poolState.marketId;
          if (hasNumericValue(marketId)) {
            await this.recordAmmUserEffects(event, poolId, marketId, topicValues, payload);
          }
        }
        return;
      }
      case "role":
      case "pause":
        await this.reconciliation.reconcileGovernance(latestLedger);
        return;
      default:
        this.warnUnknown(event);
    }
  }

  private async dispatchCollateralVault(
    event: EventRecord,
    latestLedger: number,
    topicValues: unknown[],
    payload: unknown,
  ) {
    switch (event.topic) {
      case "deposit":
      case "release":
      case "redeem":
      case "fee": {
        const marketId = numericValue(topicValues[1]);
        if (hasNumericValue(marketId)) {
          await this.reconciliation.reconcileVault(marketId, latestLedger);
          await this.recordVaultUserEffects(event, marketId, topicValues, event.payload);
        }
        return;
      }
      case "cfund":
      case "cpay": {
        const parentMarketId = numericValue(topicValues[1]);
        const childMarketId = numericValue(topicValues[2]);
        const owner = firstString(topicValues, payload, [3], ["user", "owner"], [0]);
        if (hasNumericValue(parentMarketId)) {
          await this.reconciliation.reconcileVault(parentMarketId, latestLedger);
          if (owner) {
            await this.reconciliation.reconcileUserVaultState(parentMarketId, owner, latestLedger);
          }
        }
        if (hasNumericValue(childMarketId)) {
          await this.reconciliation.reconcileVault(childMarketId, latestLedger);
          if (owner) {
            await this.reconciliation.reconcileUserVaultState(childMarketId, owner, latestLedger);
          }
        }
        return;
      }
      case "role":
      case "treas":
      case "pause":
      case "bond":
      case "bond_rel":
        await this.reconciliation.reconcileGovernance(latestLedger);
        return;
      default:
        this.warnUnknown(event);
    }
  }

  private async dispatchConditionalTokens(
    event: EventRecord,
    latestLedger: number,
    topicValues: unknown[],
    payload: unknown,
  ) {
    switch (event.topic) {
      case "split":
      case "merge": {
        const marketId = numericValue(topicValues[1]);
        const owner = firstString(topicValues, payload, [2], ["user", "owner", "to"]);
        if (hasNumericValue(marketId) && owner) {
          await this.reconciliation.reconcileUserPosition(marketId, owner, latestLedger, ["Yes", "No"]);
        }
        return;
      }
      case "pos_xfer": {
        const marketId = numericValue(topicValues[1]);
        const from = firstString(topicValues, payload, [2], ["from"]);
        const to = firstString(topicValues, payload, [3], ["to"]);
        const outcome = firstOutcome(topicValues, payload, [], ["outcome"], [0]);
        if (hasNumericValue(marketId) && outcome) {
          if (from) {
            await this.reconciliation.reconcileUserPosition(marketId, from, latestLedger, [outcome]);
          }
          if (to) {
            await this.reconciliation.reconcileUserPosition(marketId, to, latestLedger, [outcome]);
          }
        }
        return;
      }
      case "burn":
      case "losebrn": {
        const marketId = numericValue(topicValues[1]);
        const owner = firstString(topicValues, payload, [2], ["owner", "user", "from"]);
        const outcome = firstOutcome(topicValues, payload, [], ["outcome"], [0]);
        if (hasNumericValue(marketId) && owner && outcome) {
          await this.reconciliation.reconcileUserPosition(marketId, owner, latestLedger, [outcome]);
        }
        return;
      }
      case "role":
      case "pause":
        await this.reconciliation.reconcileGovernance(latestLedger);
        return;
      default:
        this.warnUnknown(event);
    }
  }

  private async dispatchCodOracle(
    event: EventRecord,
    latestLedger: number,
    topicValues: unknown[],
    payload: unknown,
  ) {
    switch (event.topic) {
      case "res_req": {
        const marketId = numericValue(topicValues[1]);
        const requestId = numericValue(payload);
        if (hasNumericValue(marketId)) {
          await this.reconciliation.reconcileMarket(marketId, latestLedger);
        }
        if (hasNumericValue(requestId)) {
          await this.reconciliation.reconcileRequest(requestId, latestLedger);
        }
        return;
      }
      case "propose":
      case "dispute":
      case "final":
      case "cod_fin":
      case "escal": {
        const requestId = numericValue(topicValues[1]);
        if (hasNumericValue(requestId)) {
          await this.reconciliation.reconcileRequest(requestId, latestLedger);
        }
        return;
      }
      case "role":
      case "pause":
        await this.reconciliation.reconcileGovernance(latestLedger);
        return;
      default:
        this.warnUnknown(event);
    }
  }

  private async dispatchCouncil(event: EventRecord, latestLedger: number, topicValues: unknown[], payload: unknown) {
    switch (event.topic) {
      case "case": {
        const caseId = numericValue(payload);
        if (hasNumericValue(caseId)) {
          await this.reconciliation.reconcileCase(caseId, latestLedger);
        }
        return;
      }
      case "casefin":
      case "commit":
      case "reveal":
      case "reward": {
        const caseId = numericValue(topicValues[1]);
        if (hasNumericValue(caseId)) {
          await this.reconciliation.reconcileCase(caseId, latestLedger);
        }
        return;
      }
      case "role":
      case "member":
      case "pause":
        await this.reconciliation.reconcileGovernance(latestLedger);
        return;
      default:
        this.warnUnknown(event);
    }
  }

  private async dispatchTimelock(event: EventRecord, latestLedger: number, topicValues: unknown[]) {
    switch (event.topic) {
      case "roles":
        await this.reconciliation.reconcileGovernance(latestLedger);
        return;
      case "queued":
      case "cancel":
      case "execute": {
        await this.reconciliation.reconcileGovernance(latestLedger);
        const actionId = numericValue(topicValues[1]);
        if (hasNumericValue(actionId)) {
          try {
            const action = await this.contracts.getTimelockAction(actionId);
            await this.repository.upsertTimelockAction({
              network: this.manifest.data.network,
              action_id: actionId,
              kind: action.kind.tag,
              target: String(action.target),
              payload_hash: Buffer.from(action.payload_hash).toString("hex"),
              execute_after: Number(action.execute_after),
              expires_at: Number(action.expires_at),
              executed: action.executed,
              cancelled: action.cancelled,
              last_reconciled_ledger: latestLedger,
              reconciled_at: new Date().toISOString(),
            });
          } catch (error) {
            this.logger.debug({ error, actionId }, "Unable to reconcile timelock action");
          }
        }
        return;
      }
      default:
        this.warnUnknown(event);
    }
  }

  private warnUnknown(event: EventRecord) {
    this.logger.warn(
      { topic: event.topic, contractId: event.contractId },
      "Unknown event topic from known contract",
    );
  }

  private async recordAmmUserEffects(
    event: EventRecord,
    poolId: number,
    marketId: number,
    topicValues: unknown[],
    payload: unknown,
  ) {
    if (event.topic === "buy" || event.topic === "sell") {
      const trader = firstString(topicValues, payload, [2, 3], ["trader", "user", "buyer", "seller", "owner"]);
      const outcome = firstOutcome(topicValues, payload, [2, 3], ["outcome", "side", "yes"], [0]);
      if (trader) {
        await this.repository.insertTrade({
          event_id: event.eventId,
          network: this.manifest.data.network,
          market_id: marketId,
          pool_id: poolId,
          trader,
          side: outcome ?? "Unknown",
          direction: event.topic,
          amount_in: amountValue(recordValue(payload, ["amount_in", "amountIn", "in", "tokens_sold"], [1])),
          amount_out: amountValue(recordValue(payload, ["amount_out", "amountOut", "out", "tokens_bought", "payout"], [2])),
          fee: amountValue(recordValue(payload, ["fee", "trade_fee", "trading_fee"])),
          ledger: event.ledger,
          tx_hash: event.txHash,
        });

        const outcomes = outcome ? [outcome] : undefined;
        await this.reconciliation.reconcileUserPosition(marketId, trader, event.ledger, outcomes);
        await this.reconciliation.reconcileUserVaultState(marketId, trader, event.ledger);
      }
      return;
    }

    if (event.topic === "seed" || event.topic === "lp_add" || event.topic === "lp_rm") {
      const lp = firstString(topicValues, payload, [2, 3], ["lp", "provider", "user", "owner"]);
      if (!lp) {
        return;
      }

      await this.repository.insertLiquidityEvent({
        event_id: event.eventId,
        network: this.manifest.data.network,
        market_id: marketId,
        pool_id: poolId,
        lp,
        kind: event.topic,
        amount: event.topic === "lp_rm"
          ? "0"
          : amountValue(recordValue(payload, ["amount", "amount_in", "collateral", "collateral_in"], [0])),
        shares: amountValue(recordValue(payload, ["shares", "lp_shares", "shares_out", "shares_burned"], event.topic === "lp_rm" ? [0] : [1])),
        yes_out: amountValue(recordValue(payload, ["yes_out", "yesOut"], [1])),
        no_out: amountValue(recordValue(payload, ["no_out", "noOut"], [2])),
        ledger: event.ledger,
        tx_hash: event.txHash,
      });

      await this.reconciliation.reconcileLpPosition(poolId, lp, event.ledger);
      await this.reconciliation.reconcileUserPosition(marketId, lp, event.ledger);
      await this.reconciliation.reconcileUserVaultState(marketId, lp, event.ledger);
    }
  }

  private async recordVaultUserEffects(
    event: EventRecord,
    marketId: number,
    topicValues: unknown[],
    payload: unknown,
  ) {
    const owner = firstString(topicValues, payload, [2, 3], ["user", "owner", "recipient", "trader"]);
    if (!owner) {
      return;
    }

    const outcome = firstOutcome(topicValues, payload, [2, 3, 4], ["outcome", "redeemed_outcome", "final_outcome"], [0]);
    await this.reconciliation.reconcileUserVaultState(marketId, owner, event.ledger);
    await this.reconciliation.reconcileUserPosition(marketId, owner, event.ledger, outcome ? [outcome] : undefined);
  }
}
