import * as StellarSdk from "@stellar/stellar-sdk";
import type { Env } from "../config/env.js";
import type { LoadedManifest } from "../config/manifest.js";
import { scValToNative } from "./codecs.js";
import * as Amm from "./generated/amm.js";
import * as CodOracle from "./generated/cod_oracle.js";
import * as CollateralVault from "./generated/collateral_vault.js";
import * as ConditionalTokens from "./generated/conditional_tokens.js";
import * as CouncilOfDike from "./generated/council_of_dike.js";
import * as DikeGovernance from "./generated/dike_governance.js";
import * as DikeTimelock from "./generated/dike_timelock.js";
import * as FeeManager from "./generated/fee_manager.js";
import * as MarketRegistry from "./generated/market_registry.js";
import type { Logger } from "../observability/logger.js";

type ContractClientMap = {
  amm: Amm.Client;
  codOracle: CodOracle.Client;
  collateralVault: CollateralVault.Client;
  conditionalTokens: ConditionalTokens.Client;
  councilOfDike: CouncilOfDike.Client;
  dikeGovernance: DikeGovernance.Client;
  dikeTimelock: DikeTimelock.Client;
  feeManager: FeeManager.Client;
  marketRegistry: MarketRegistry.Client;
};

function unwrap<T>(value: T | { unwrap: () => T; isErr?: () => boolean; unwrapErr?: () => unknown }): T {
  if (value && typeof value === "object" && "unwrap" in value && typeof value.unwrap === "function") {
    if ("isErr" in value && typeof value.isErr === "function" && value.isErr()) {
      throw new Error(`Contract call failed: ${JSON.stringify(value.unwrapErr?.() ?? {})}`);
    }
    return value.unwrap();
  }
  return value as T;
}

async function readPlain<T>(invocation: Promise<{ result: T }>) {
  const tx = await invocation;
  return tx.result;
}

async function readOk<T>(invocation: Promise<{ result: { unwrap: () => T; isErr?: () => boolean; unwrapErr?: () => unknown } }>) {
  const tx = await invocation;
  return unwrap(tx.result);
}

export class DikeContractClient {
  readonly rpc: StellarSdk.rpc.Server;
  readonly horizon: StellarSdk.Horizon.Server;
  readonly clients: ContractClientMap;

  constructor(
    private readonly env: Env,
    private readonly manifest: LoadedManifest,
    private readonly logger: Logger,
  ) {
    this.rpc = new StellarSdk.rpc.Server(env.STELLAR_RPC_URL);
    this.horizon = new StellarSdk.Horizon.Server(env.STELLAR_HORIZON_URL);
    const options = {
      rpcUrl: env.STELLAR_RPC_URL,
      networkPassphrase: env.STELLAR_NETWORK_PASSPHRASE,
      allowHttp: env.STELLAR_RPC_URL.startsWith("http://"),
    };

    this.clients = {
      amm: new Amm.Client({
        contractId: manifest.data.contracts.amm,
        ...options,
      }),
      codOracle: new CodOracle.Client({
        contractId: manifest.data.contracts.cod_oracle,
        ...options,
      }),
      collateralVault: new CollateralVault.Client({
        contractId: manifest.data.contracts.collateral_vault,
        ...options,
      }),
      conditionalTokens: new ConditionalTokens.Client({
        contractId: manifest.data.contracts.conditional_tokens,
        ...options,
      }),
      councilOfDike: new CouncilOfDike.Client({
        contractId: manifest.data.contracts.council_of_dike,
        ...options,
      }),
      dikeGovernance: new DikeGovernance.Client({
        contractId: manifest.data.contracts.dike_governance,
        ...options,
      }),
      dikeTimelock: new DikeTimelock.Client({
        contractId: manifest.data.contracts.dike_timelock,
        ...options,
      }),
      feeManager: new FeeManager.Client({
        contractId: manifest.data.contracts.fee_manager,
        ...options,
      }),
      marketRegistry: new MarketRegistry.Client({
        contractId: manifest.data.contracts.market_registry,
        ...options,
      }),
    };
  }

  async getLatestLedger() {
    return this.rpc.getLatestLedger();
  }

  async getHealth() {
    return this.rpc.getHealth();
  }

  private async simulateContractRead(contractId: string, method: string, args: StellarSdk.xdr.ScVal[] = []) {
    const account = await this.rpc.getAccount(this.manifest.data.admin);
    const contract = new StellarSdk.Contract(contractId);
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.env.STELLAR_NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(300)
      .build();

    const simulation = await this.rpc.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
      throw new Error(`Read simulation failed: ${simulation.error}`);
    }
    const success = simulation as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse;
    if (!success.result?.retval) {
      throw new Error(`No return value for ${method}`);
    }
    return scValToNative(success.result.retval);
  }

  async getEvents(request: StellarSdk.rpc.Api.GetEventsRequest) {
    return this.rpc._getEvents(request);
  }

  async getMarket(marketId: number) {
    return readOk(this.clients.marketRegistry.get_market({ market_id: BigInt(marketId) }));
  }

  async getMarketStatus(marketId: number) {
    return readOk(this.clients.marketRegistry.get_status({ market_id: BigInt(marketId) }));
  }

  async getFinalOutcome(marketId: number) {
    return readOk(this.clients.marketRegistry.get_final_outcome({ market_id: BigInt(marketId) }));
  }

  async isTradeable(marketId: number) {
    return readOk(this.clients.marketRegistry.is_tradeable({ market_id: BigInt(marketId) }));
  }

  async getPool(poolId: number) {
    return readOk(this.clients.amm.pool({ pool_id: BigInt(poolId) }));
  }

  async getLpBalance(poolId: number, owner: string) {
    return readPlain(this.clients.amm.lp_balance({ pool_id: BigInt(poolId), owner }));
  }

  async getClaimableLpFees(poolId: number, owner: string) {
    return readOk(this.clients.amm.claimable_lp_fees({ pool_id: BigInt(poolId), owner }));
  }

  async getLpFeeCheckpoint(poolId: number, owner: string) {
    return readPlain(this.clients.amm.lp_fee_checkpoint({ pool_id: BigInt(poolId), owner }));
  }

  async getPositionBalance(owner: string, marketId: number, outcome: ConditionalTokens.Outcome) {
    return readPlain(
      this.clients.conditionalTokens.balance({
        owner,
        market_id: BigInt(marketId),
        outcome,
      }),
    );
  }

  async getBacking(marketId: number) {
    return readPlain(this.clients.conditionalTokens.backing({ market_id: BigInt(marketId) }));
  }

  async getVaultAccounting(marketId: number) {
    return readPlain(this.clients.collateralVault.accounting({ market_id: BigInt(marketId) }));
  }

  async getUserDeposit(marketId: number, owner: string) {
    return readPlain(this.clients.collateralVault.user_deposit({ market_id: BigInt(marketId), user: owner }));
  }

  async getRootStake(marketId: number, owner: string, outcome: CollateralVault.Outcome) {
    return readPlain(
      this.clients.collateralVault.root_stake({
        market_id: BigInt(marketId),
        user: owner,
        outcome,
      }),
    );
  }

  async getChildAvailForOutcome(parentMarketId: number, owner: string, outcome: CollateralVault.Outcome) {
    return readOk(
      this.clients.collateralVault.child_avail_for_outcome({
        parent_market_id: BigInt(parentMarketId),
        user: owner,
        outcome,
      }),
    );
  }

  async getChildDebt(childMarketId: number, owner: string) {
    return readPlain(this.clients.collateralVault.child_debt({ child_market_id: BigInt(childMarketId), user: owner }));
  }

  async getChildCollateralUsed(parentMarketId: number, owner: string) {
    return readPlain(this.clients.collateralVault.child_collateral_used({ parent_market_id: BigInt(parentMarketId), user: owner }));
  }

  async getChildUsedForOutcome(parentMarketId: number, owner: string, outcome: CollateralVault.Outcome) {
    return readPlain(this.clients.collateralVault.child_used_for_outcome({ parent_market_id: BigInt(parentMarketId), user: owner, outcome }));
  }

  async getParentDebt(parentMarketId: number, owner: string, outcome: CollateralVault.Outcome) {
    return readPlain(
      this.clients.collateralVault.parent_debt({
        parent_market_id: BigInt(parentMarketId),
        user: owner,
        outcome,
      }),
    );
  }

  async getRedeemed(marketId: number, owner: string, outcome: CollateralVault.Outcome) {
    return readPlain(this.clients.collateralVault.redeemed({ market_id: BigInt(marketId), user: owner, outcome }));
  }

  async getRequest(requestId: number) {
    return readOk(this.clients.codOracle.request({ request_id: BigInt(requestId) }));
  }

  async getMarketRequest(marketId: number) {
    return readOk(this.clients.codOracle.market_request({ market_id: BigInt(marketId) }));
  }

  async getCase(caseId: number) {
    return readOk(this.clients.councilOfDike.case({ case_id: BigInt(caseId) }));
  }

  async getCaseForRequest(requestId: number) {
    return readOk(this.clients.councilOfDike.case_for_request({ request_id: BigInt(requestId) }));
  }

  async getCaseRewardPool(caseId: number) {
    return readPlain(this.clients.councilOfDike.case_reward_pool({ case_id: BigInt(caseId) }));
  }

  async getTreasury() {
    return readOk(this.clients.dikeGovernance.treasury());
  }

  async getTimelock() {
    return this.simulateContractRead(
      this.manifest.data.contracts.dike_governance,
      "timelock",
    ) as Promise<string>;
  }

  async getPauseAuthority() {
    return this.simulateContractRead(
      this.manifest.data.contracts.dike_governance,
      "pause_authority",
    ) as Promise<string>;
  }

  async getFeeConfig() {
    return readPlain(this.clients.dikeGovernance.fee_config());
  }

  async getModule(role: string) {
    return readOk(this.clients.dikeGovernance.module({ role }));
  }

  async getSupportedCollateral(collateral: string) {
    return readPlain(this.clients.dikeGovernance.is_supported_collateral({ collateral }));
  }

  async getTimelockAction(actionId: number) {
    return readOk(this.clients.dikeTimelock.action({ action_id: BigInt(actionId) }));
  }

  async getFeeManagerConfig() {
    try {
      return {
        feeConfig: await readPlain(this.clients.feeManager.config()),
        proposalBond: await readOk(this.clients.feeManager.required_bond({ market_liquidity: 0n })),
      };
    } catch (error) {
      this.logger.debug({ error }, "Unable to read fee manager config");
      return null;
    }
  }
}
