import { describe, expect, it, vi } from "vitest";
import * as StellarSdk from "@stellar/stellar-sdk";
import { EventSource } from "./event-source.js";
import { IndexerWorker } from "./worker.js";

function makeWorker(overrides?: {
  checkpoint?: number;
  latestLedger?: number;
  startLedger?: number;
  events?: unknown[];
}) {
  const getEvents = vi.fn().mockResolvedValue({
    events: overrides?.events ?? [],
    cursor: "cursor-1",
  });
  const advanceCheckpoint = vi.fn().mockResolvedValue(undefined);
  const resetCheckpoint = vi.fn().mockResolvedValue(undefined);
  const recordRawEvent = vi.fn().mockResolvedValue(undefined);

  const repository = {
    getDeployments: vi.fn().mockResolvedValue([
      {
        contract_id: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
        module: "market_registry",
      },
    ]),
    getCheckpoint: vi.fn().mockResolvedValue({
      lastProcessedLedger: overrides?.checkpoint ?? 0,
    }),
    recordRawEvent,
    advanceCheckpoint,
    resetCheckpoint,
  };

  const contracts = {
    getLatestLedger: vi.fn().mockResolvedValue({
      sequence: overrides?.latestLedger ?? 100,
    }),
    getEvents,
  };

  const worker = new IndexerWorker(
    {
      INDEXER_LEDGER_WINDOW: 10,
      INDEXER_POLL_INTERVAL_MS: 1_000,
      INDEXER_START_LEDGER: overrides?.startLedger,
    } as never,
    {
      data: {
        network: "testnet",
      },
    } as never,
    contracts as never,
    repository as never,
    {
      reconcileGovernance: vi.fn(),
    } as never,
    {
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    } as never,
    {
      setLatestLedger: vi.fn(),
      setContractLag: vi.fn(),
      noteProcessingFailure: vi.fn(),
    } as never,
  );

  return {
    worker,
    repository,
    contracts,
    getEvents,
    advanceCheckpoint,
    resetCheckpoint,
    recordRawEvent,
  };
}

describe("IndexerWorker", () => {
  it("advances checkpoints for empty event windows", async () => {
    const { worker, advanceCheckpoint } = makeWorker({
      latestLedger: 100,
      startLedger: 90,
      events: [],
    });

    await worker.tick();

    expect(advanceCheckpoint).toHaveBeenCalledWith(
      "testnet",
      "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
      99,
      "cursor-1",
    );
  });

  it("uses INDEXER_START_LEDGER only before a checkpoint exists", async () => {
    const { worker, getEvents } = makeWorker({
      checkpoint: 50,
      latestLedger: 100,
      startLedger: 10,
      events: [],
    });

    await worker.tick();

    expect(getEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        startLedger: 51,
        endLedger: 60,
      }),
    );
  });

  it("requires an explicit start ledger before a checkpoint exists", async () => {
    const contracts = {
      getLatestLedger: vi.fn().mockResolvedValue({ sequence: 100 }),
      getEvents: vi.fn(),
    };
    const source = new EventSource(
      { data: { network: "testnet" } } as never,
      contracts as never,
      {
        getCheckpoint: vi.fn().mockResolvedValue({ lastProcessedLedger: 0 }),
      } as never,
      {
        warn: vi.fn(),
        debug: vi.fn(),
      } as never,
      {
        setLatestLedger: vi.fn(),
        setContractLag: vi.fn(),
      } as never,
      10,
    );

    await expect(source.pollContract("CREGISTRY", "market_registry")).rejects.toThrow(/INDEXER_START_LEDGER/);
    expect(contracts.getEvents).not.toHaveBeenCalled();
  });

  it("resets a checkpoint that is ahead of the current network ledger", async () => {
    const { worker, resetCheckpoint, advanceCheckpoint } = makeWorker({
      checkpoint: 150,
      latestLedger: 100,
      startLedger: 90,
      events: [],
    });

    await worker.tick();

    expect(resetCheckpoint).toHaveBeenCalledWith(
      "testnet",
      "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
      100,
    );
    expect(advanceCheckpoint).not.toHaveBeenCalled();
  });

  it("marks a window incomplete when pagination hits the page limit", async () => {
    const value = StellarSdk.nativeToScVal(0).toXDR("base64");
    const topic = [StellarSdk.nativeToScVal("status").toXDR("base64")];
    const events = Array.from({ length: 100 }, (_, index) => ({
      id: `event-${index}`,
      ledger: 1,
      txHash: "tx",
      topic,
      value,
    }));
    const contracts = {
      getLatestLedger: vi.fn().mockResolvedValue({ sequence: 10 }),
      getEvents: vi.fn().mockResolvedValue({
        events,
        cursor: "cursor-next",
      }),
    };
    const source = new EventSource(
      { data: { network: "testnet" } } as never,
      contracts as never,
      {
        getCheckpoint: vi.fn().mockResolvedValue({ lastProcessedLedger: 0 }),
      } as never,
      {
        warn: vi.fn(),
        debug: vi.fn(),
      } as never,
      {
        setLatestLedger: vi.fn(),
        setContractLag: vi.fn(),
      } as never,
      10,
    );

    const batch = await source.pollContract("CREGISTRY", "market_registry", 1);

    expect(contracts.getEvents).toHaveBeenCalledTimes(100);
    expect(batch.complete).toBe(false);
    expect(batch.checkpointLedger).toBe(10);
  });
});
