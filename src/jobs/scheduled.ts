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
    } catch (error) {
      this.logger.error({ error }, "Scheduled reconciliation failed");
    } finally {
      this.running = false;
    }
  }
}
