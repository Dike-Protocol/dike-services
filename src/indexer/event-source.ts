import type { LoadedManifest } from "../config/manifest.js";
import { decodeRawEvent } from "../contracts/codecs.js";
import type { DikeContractClient } from "../contracts/client.js";
import type { StateRepository } from "../db/repositories/state-repository.js";
import type { EventRecord } from "../db/repositories/state-repository.js";
import type { Logger } from "../observability/logger.js";
import type { MetricsStore } from "../observability/metrics.js";

export class EventSource {
  constructor(
    private readonly manifest: LoadedManifest,
    private readonly contracts: DikeContractClient,
    private readonly repository: StateRepository,
    private readonly logger: Logger,
    private readonly metrics: MetricsStore,
    private readonly ledgerWindow: number,
  ) {}

  async pollContract(contractId: string, module: string, startLedger?: number) {
    const checkpoint = await this.repository.getCheckpoint(this.manifest.data.network, contractId);
    const latestLedger = await this.contracts.getLatestLedger();
    this.metrics.setLatestLedger(latestLedger.sequence);

    if (checkpoint.lastProcessedLedger <= 0 && startLedger === undefined) {
      this.metrics.setContractLag(contractId, module, 0, latestLedger.sequence);
      throw new Error(
        `Missing INDEXER_START_LEDGER for initial ${module} indexing. Set it to a retained deployment ledger before starting with an empty checkpoint.`,
      );
    }

    const fromLedger =
      checkpoint.lastProcessedLedger > 0
        ? checkpoint.lastProcessedLedger + 1
        : startLedger;

    if (fromLedger === undefined) {
      throw new Error("Unable to determine indexer start ledger");
    }

    if (fromLedger > latestLedger.sequence) {
      this.metrics.setContractLag(contractId, module, checkpoint.lastProcessedLedger, latestLedger.sequence);
      return {
        events: [],
        checkpointLedger: latestLedger.sequence,
        cursor: checkpoint.lastProcessedCursor,
        complete: true,
        resetCheckpoint: true,
      };
    }

    const endLedger = Math.min(fromLedger + this.ledgerWindow - 1, latestLedger.sequence);
    const filters = [
      {
        type: "contract" as const,
        contractIds: [contractId],
      },
    ];
    const limit = 100;
    const events: EventRecord[] = [];
    let cursor: string | undefined;
    let exhaustedPageLimit = true;
    let complete = true;
    let request:
      | {
          startLedger: number;
          endLedger: number;
          filters: typeof filters;
          limit: number;
        }
      | {
          cursor: string;
          filters: typeof filters;
          limit: number;
        } = {
      startLedger: fromLedger,
      endLedger,
      filters,
      limit,
    };

    for (let page = 0; page < 100; page += 1) {
      exhaustedPageLimit = page === 99;
      const response = await this.contracts.getEvents(request);
      cursor = response.cursor;

      for (const event of response.events) {
        if (event.ledger > endLedger) {
          continue;
        }
        const decoded = decodeRawEvent(event);
        events.push({
          network: this.manifest.data.network,
          contractId,
          ledger: event.ledger,
          txHash: event.txHash,
          eventId: event.id,
          topic: decoded.topic,
          topicValues: decoded.topicValues,
          payload: decoded.payload,
          rawEvent: event,
          cursor,
        });
      }

      if (response.events.length < limit) {
        break;
      }

      if (!response.cursor) {
        this.logger.warn({ contractId, module }, "Stellar RPC returned a full page without a cursor");
        complete = false;
        break;
      }

      request = {
        cursor: response.cursor,
        filters,
        limit,
      };
    }

    if (exhaustedPageLimit) {
      complete = false;
      this.logger.warn(
        { contractId, module, fromLedger, endLedger, pageLimit: 100 },
        "Event pagination hit the page limit; checkpoint will not advance",
      );
    }

    this.metrics.setContractLag(contractId, module, endLedger, latestLedger.sequence);
    this.logger.debug(
      { contractId, module, fromLedger, endLedger, count: events.length },
      "Fetched contract events",
    );
    return {
      events,
      checkpointLedger: endLedger,
      cursor,
      complete,
    };
  }
}
