import { describe, expect, it } from "vitest";
import {
  derivePrices,
  deriveRedeemability,
  deriveResolutionNextActions,
  deriveTradeability,
} from "./derived-state.js";

describe("derived state rules", () => {
  it("derives tradeability from live status and expiry", () => {
    expect(
      deriveTradeability({
        status: "Live",
        expiry: 200,
        now: 100,
      }),
    ).toBe(true);

    expect(
      deriveTradeability({
        status: "Resolved",
        expiry: 200,
        now: 100,
      }),
    ).toBe(false);
  });

  it("derives prices from AMM reserves", () => {
    expect(derivePrices("40", "60")).toEqual({
      yesPrice: 0.4,
      noPrice: 0.6,
    });
  });

  it("derives resolution next actions across lifecycle states", () => {
    expect(
      deriveResolutionNextActions({
        status: "TradingClosed",
        expiry: 100,
        now: 101,
      }),
    ).toContain("request_resolution");

    expect(
      deriveResolutionNextActions({
        status: "Proposed",
        expiry: 100,
        now: 105,
        proposedAt: 100,
        disputeWindow: 10,
      }),
    ).toContain("dispute");

    expect(
      deriveResolutionNextActions({
        status: "Resolved",
        expiry: 100,
        now: 200,
      }),
    ).toContain("redeem");
  });

  it("derives redeemability for resolved and cancelled markets", () => {
    expect(deriveRedeemability("Resolved", "Yes")).toBe(true);
    expect(deriveRedeemability("Cancelled", "Invalid")).toBe(true);
    expect(deriveRedeemability("Live", "Yes")).toBe(false);
  });
});
