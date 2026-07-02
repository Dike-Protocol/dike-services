import { describe, expect, it, vi } from "vitest";
import { EventDispatcher } from "./dispatcher.js";

function makeDispatcher() {
  const reconciliation = {
    reconcileMarket: vi.fn().mockResolvedValue(undefined),
    reconcileRequest: vi.fn().mockResolvedValue(undefined),
    reconcilePool: vi.fn().mockResolvedValue({ marketId: 42 }),
    reconcileVault: vi.fn().mockResolvedValue(undefined),
    reconcileCase: vi.fn().mockResolvedValue(undefined),
    reconcileGovernance: vi.fn().mockResolvedValue(undefined),
    reconcileUserPosition: vi.fn().mockResolvedValue(undefined),
    reconcileLpPosition: vi.fn().mockResolvedValue(undefined),
    reconcileUserVaultState: vi.fn().mockResolvedValue(undefined),
  };
  const repository = {
    upsertTimelockAction: vi.fn(),
    insertTrade: vi.fn().mockResolvedValue(undefined),
    insertLiquidityEvent: vi.fn().mockResolvedValue(undefined),
  };

  const logger = {
    warn: vi.fn(),
    debug: vi.fn(),
  };

  const dispatcher = new EventDispatcher(
    {
      data: {
        network: "testnet",
        contracts: {
          market_registry: "CREGISTRY",
          cod_oracle: "CORACLE",
          amm: "CAMM",
          collateral_vault: "CVAULT",
          council_of_dike: "CCOUNCIL",
          dike_governance: "CGOV",
          dike_timelock: "CTIMELOCK",
          fee_manager: "CFEE",
          market_factory: "CFACTORY",
          conditional_tokens: "CTOKENS",
          mock_usdc: "",
        },
      },
    } as never,
    repository as never,
    {
      getTimelockAction: vi.fn(),
    } as never,
    reconciliation as never,
    logger as never,
  );

  return {
    dispatcher,
    reconciliation,
    repository,
    logger,
  };
}

describe("EventDispatcher", () => {
  it("routes registry final events to markets", async () => {
    const { dispatcher, reconciliation } = makeDispatcher();

    await dispatcher.dispatch({
      network: "testnet",
      contractId: "CREGISTRY",
      ledger: 100,
      txHash: "tx",
      eventId: "event-1",
      topic: "final",
      topicValues: ["final", 7n],
      payload: { tag: "Yes" },
      rawEvent: {},
    });

    expect(reconciliation.reconcileMarket).toHaveBeenCalledWith(7, 100);
    expect(reconciliation.reconcileRequest).not.toHaveBeenCalled();
  });

  it("routes oracle final events to requests", async () => {
    const { dispatcher, reconciliation } = makeDispatcher();

    await dispatcher.dispatch({
      network: "testnet",
      contractId: "CORACLE",
      ledger: 100,
      txHash: "tx",
      eventId: "event-1",
      topic: "final",
      topicValues: ["final", 9n],
      payload: { tag: "No" },
      rawEvent: {},
    });

    expect(reconciliation.reconcileRequest).toHaveBeenCalledWith(9, 100);
    expect(reconciliation.reconcileMarket).not.toHaveBeenCalled();
  });

  it("routes zero-valued ids instead of treating them as absent", async () => {
    const { dispatcher, reconciliation } = makeDispatcher();

    await dispatcher.dispatch({
      network: "testnet",
      contractId: "CREGISTRY",
      ledger: 100,
      txHash: "tx",
      eventId: "event-1",
      topic: "status",
      topicValues: ["status", 0n],
      payload: { tag: "Live" },
      rawEvent: {},
    });

    expect(reconciliation.reconcileMarket).toHaveBeenCalledWith(0, 100);
  });

  it("records AMM trade history and reconciles the trader portfolio", async () => {
    const { dispatcher, reconciliation, repository } = makeDispatcher();

    await dispatcher.dispatch({
      network: "testnet",
      contractId: "CAMM",
      ledger: 100,
      txHash: "tx",
      eventId: "event-1",
      topic: "buy",
      topicValues: ["buy", 7n, "GTRADER"],
      payload: {
        outcome: { tag: "Yes" },
        amount_in: 100n,
        amount_out: 45n,
        fee: 1n,
      },
      rawEvent: {},
    });

    expect(reconciliation.reconcilePool).toHaveBeenCalledWith(7, 100);
    expect(repository.insertTrade).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: "event-1",
        market_id: 42,
        pool_id: 7,
        trader: "GTRADER",
        side: "Yes",
        direction: "buy",
        amount_in: "100",
        amount_out: "45",
        fee: "1",
      }),
    );
    expect(reconciliation.reconcileUserPosition).toHaveBeenCalledWith(42, "GTRADER", 100, ["Yes"]);
  });

  it("decodes AMM vec payloads for trade history", async () => {
    const { dispatcher, reconciliation, repository } = makeDispatcher();

    await dispatcher.dispatch({
      network: "testnet",
      contractId: "CAMM",
      ledger: 100,
      txHash: "tx",
      eventId: "event-vec-buy",
      topic: "buy",
      topicValues: ["buy", 7n, "GTRADER"],
      payload: [false, 100n, 45n],
      rawEvent: {},
    });

    expect(repository.insertTrade).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: "event-vec-buy",
        side: "No",
        amount_in: "100",
        amount_out: "45",
      }),
    );
    expect(reconciliation.reconcileUserPosition).toHaveBeenCalledWith(42, "GTRADER", 100, ["No"]);
  });

  it("decodes AMM liquidity removal vec payloads", async () => {
    const { dispatcher, reconciliation, repository } = makeDispatcher();

    await dispatcher.dispatch({
      network: "testnet",
      contractId: "CAMM",
      ledger: 100,
      txHash: "tx",
      eventId: "event-vec-lp-rm",
      topic: "lp_rm",
      topicValues: ["lp_rm", 7n, "GLP"],
      payload: [20n, 8n, 12n],
      rawEvent: {},
    });

    expect(repository.insertLiquidityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: "event-vec-lp-rm",
        amount: "0",
        shares: "20",
        yes_out: "8",
        no_out: "12",
      }),
    );
    expect(reconciliation.reconcileLpPosition).toHaveBeenCalledWith(7, "GLP", 100);
  });

  it("routes conditional token split events to both user outcomes", async () => {
    const { dispatcher, reconciliation } = makeDispatcher();

    await dispatcher.dispatch({
      network: "testnet",
      contractId: "CTOKENS",
      ledger: 101,
      txHash: "tx",
      eventId: "event-split",
      topic: "split",
      topicValues: ["split", 9n, "GALICE"],
      payload: 100n,
      rawEvent: {},
    });

    expect(reconciliation.reconcileUserPosition).toHaveBeenCalledWith(9, "GALICE", 101, ["Yes", "No"]);
  });

  it("routes conditional token transfer events to sender and recipient", async () => {
    const { dispatcher, reconciliation } = makeDispatcher();

    await dispatcher.dispatch({
      network: "testnet",
      contractId: "CTOKENS",
      ledger: 102,
      txHash: "tx",
      eventId: "event-transfer",
      topic: "pos_xfer",
      topicValues: ["pos_xfer", 9n, "GALICE", "GBOB"],
      payload: [{ tag: "Yes" }, 25n],
      rawEvent: {},
    });

    expect(reconciliation.reconcileUserPosition).toHaveBeenCalledWith(9, "GALICE", 102, ["Yes"]);
    expect(reconciliation.reconcileUserPosition).toHaveBeenCalledWith(9, "GBOB", 102, ["Yes"]);
  });

  it("routes conditional token burn events to the burned outcome", async () => {
    const { dispatcher, reconciliation } = makeDispatcher();

    await dispatcher.dispatch({
      network: "testnet",
      contractId: "CTOKENS",
      ledger: 103,
      txHash: "tx",
      eventId: "event-burn",
      topic: "losebrn",
      topicValues: ["losebrn", 9n, "GALICE"],
      payload: [{ tag: "No" }, 10n],
      rawEvent: {},
    });

    expect(reconciliation.reconcileUserPosition).toHaveBeenCalledWith(9, "GALICE", 103, ["No"]);
  });

  it("reconciles parent and child vault state for child funding events", async () => {
    const { dispatcher, reconciliation } = makeDispatcher();

    await dispatcher.dispatch({
      network: "testnet",
      contractId: "CVAULT",
      ledger: 104,
      txHash: "tx",
      eventId: "event-child-fund",
      topic: "cfund",
      topicValues: ["cfund", 1n, 2n],
      payload: ["GALICE", 50n],
      rawEvent: {},
    });

    expect(reconciliation.reconcileVault).toHaveBeenCalledWith(1, 104);
    expect(reconciliation.reconcileVault).toHaveBeenCalledWith(2, 104);
    expect(reconciliation.reconcileUserVaultState).toHaveBeenCalledWith(1, "GALICE", 104);
    expect(reconciliation.reconcileUserVaultState).toHaveBeenCalledWith(2, "GALICE", 104);
  });

  it("warns on unknown topics from known contracts", async () => {
    const { dispatcher, logger } = makeDispatcher();

    await dispatcher.dispatch({
      network: "testnet",
      contractId: "CREGISTRY",
      ledger: 105,
      txHash: "tx",
      eventId: "event-unknown-topic",
      topic: "mystery",
      topicValues: ["mystery", 9n],
      payload: null,
      rawEvent: {},
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ contractId: "CREGISTRY", topic: "mystery" }),
      "Unknown event topic from known contract",
    );
  });

  it("warns on unknown contract ids", async () => {
    const { dispatcher, logger } = makeDispatcher();

    await dispatcher.dispatch({
      network: "testnet",
      contractId: "CUNKNOWN",
      ledger: 106,
      txHash: "tx",
      eventId: "event-unknown-contract",
      topic: "whatever",
      topicValues: ["whatever"],
      payload: null,
      rawEvent: {},
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ contractId: "CUNKNOWN", topic: "whatever" }),
      "Unknown contract id while dispatching event",
    );
  });
});
