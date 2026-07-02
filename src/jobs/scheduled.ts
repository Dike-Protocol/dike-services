import type { Env } from "../config/env.js";
import type { StateRepository } from "../db/repositories/state-repository.js";
import type { ReconciliationService } from "./reconciliation.js";
import type { DikeContractClient } from "../contracts/client.js";
import type { Logger } from "../observability/logger.js";

export class ScheduledJobs {
  private timer: NodeJS.Timeout | undefined;
  private running = false;

  constructor(
    private readonly env: Env,
    private readonly network: string,
    private readonly repository: StateRepository,
    private readonly reconciliation: ReconciliationService,
    private readonly contracts: DikeContractClient,
    private readonly logger: Logger,
  ) {}

  start() {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      void this.tick();
    }, this.env.RECONCILIATION_INTERVAL_MS);
    void this.tick();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async tick() {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const latestLedger = await this.contracts.getLatestLedger();
      await this.reconciliation.reconcileGovernance(latestLedger.sequence);

      const marketIds = await this.repository.listKnownMarketIds(this.network);
      const marketPools = await this.repository.listKnownMarketPools(this.network);
      const poolByMarket = new Map(marketPools.map(({ marketId, poolId }) => [marketId, poolId]));

      for (const marketId of marketIds) {
        await this.reconciliation.reconcileMarket(marketId, latestLedger.sequence);
        await this.reconciliation.reconcileVault(marketId, latestLedger.sequence);

        const positionOwners = await this.repository.listKnownPositionOwners(this.network, marketId);
        for (const owner of positionOwners) {
          await this.reconciliation.reconcileUserPosition(marketId, owner, latestLedger.sequence);
        }
        for (const owner of positionOwners) {
          await this.reconciliation.reconcileUserVaultState(marketId, owner, latestLedger.sequence);
        }

        const poolId = poolByMarket.get(marketId);
        if (poolId !== undefined) {
          const lpOwners = await this.repository.listKnownLpOwners(this.network, poolId);
          for (const owner of lpOwners) {
            await this.reconciliation.reconcileLpPosition(poolId, owner, latestLedger.sequence);
          }
        }
      }

      const timelockActionIds = await this.repository.listKnownTimelockActionIds(this.network);
      for (const actionId of timelockActionIds) {
        await this.reconciliation.reconcileTimelockAction(actionId, latestLedger.sequence);
      }
    } catch (error) {
      this.logger.error({ error }, "Scheduled reconciliation failed");
    } finally {
      this.running = false;
    }
  }
}
