import type { Env } from "../config/env.js";
import type { LoadedManifest } from "../config/manifest.js";
import type { StateRepository } from "../db/repositories/state-repository.js";
import type { ReconciliationService } from "../jobs/reconciliation.js";
import type { Logger } from "../observability/logger.js";
import type { MetricsStore } from "../observability/metrics.js";
import { DikeContractClient } from "../contracts/client.js";
import { EventDispatcher } from "./dispatcher.js";
import { EventSource } from "./event-source.js";

export class IndexerWorker {
  private timer: NodeJS.Timeout | undefined;
  private running = false;

  private readonly eventSource: EventSource;
  private readonly dispatcher: EventDispatcher;

  constructor(
    private readonly env: Env,
    private readonly manifest: LoadedManifest,
    private readonly contracts: DikeContractClient,
    private readonly repository: StateRepository,
    private readonly reconciliation: ReconciliationService,
    private readonly logger: Logger,
    private readonly metrics: MetricsStore,
  ) {
    this.eventSource = new EventSource(
      manifest,
      contracts,
      repository,
      logger,
      metrics,
      env.INDEXER_LEDGER_WINDOW,
    );
    this.dispatcher = new EventDispatcher(
      manifest,
      repository,
      contracts,
      reconciliation,
      logger,
    );
  }

  start() {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      void this.tick();
    }, this.env.INDEXER_POLL_INTERVAL_MS);
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
      const deployments = await this.repository.getDeployments(this.manifest.data.network);
      for (const deployment of deployments) {
        const batch = await this.eventSource.pollContract(
          deployment.contract_id,
          deployment.module,
          this.env.INDEXER_START_LEDGER,
        );

        for (const event of batch.events) {
          await this.repository.recordRawEvent(event);
          await this.dispatcher.dispatch(event);
        }

        if (batch.complete) {
          if (batch.resetCheckpoint) {
            await this.repository.resetCheckpoint(
              this.manifest.data.network,
              deployment.contract_id,
              batch.checkpointLedger,
            );
          } else {
            await this.repository.advanceCheckpoint(
              this.manifest.data.network,
              deployment.contract_id,
              batch.checkpointLedger,
              batch.cursor,
            );
          }
        } else {
          this.logger.warn(
            {
              contractId: deployment.contract_id,
              module: deployment.module,
              checkpointLedger: batch.checkpointLedger,
            },
            "Skipping checkpoint advance for incomplete event window",
          );
        }
      }
    } catch (error) {
      this.metrics.noteProcessingFailure();
      this.logger.error({ error }, "Indexer tick failed");
    } finally {
      this.running = false;
    }
  }
}
