import { describe, expect, it, vi } from "vitest";
import { StateRepository } from "./state-repository.js";

describe("StateRepository", () => {
  it("serializes raw events containing bigint values", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [],
      rowCount: 1,
    });
    const repository = new StateRepository({ query } as never);

    await repository.recordRawEvent({
      network: "testnet",
      contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
      ledger: 123,
      txHash: "hash",
      eventId: "event-1",
      topic: "mkt_new",
      topicValues: ["mkt_new", 1n],
      payload: {
        amount: 10n,
      },
      rawEvent: {
        ledger: 123,
      },
      cursor: "cursor-1",
    });

    const params = query.mock.calls[0]?.[1] as unknown[];
    expect(params[6]).toBe(JSON.stringify(["mkt_new", "1"]));
    expect(params[7]).toBe(JSON.stringify({ amount: "10" }));
  });

  it("can explicitly reset checkpoints without GREATEST", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [],
      rowCount: 1,
    });
    const repository = new StateRepository({ query } as never);

    await repository.resetCheckpoint("testnet", "CCONTRACT", 100);

    const sql = query.mock.calls[0]?.[0] as string;
    const params = query.mock.calls[0]?.[1] as unknown[];
    expect(sql).toContain("last_processed_ledger = EXCLUDED.last_processed_ledger");
    expect(sql).not.toContain("GREATEST");
    expect(params).toEqual(["testnet", "CCONTRACT", 100]);
  });
});
