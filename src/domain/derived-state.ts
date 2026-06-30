import type { MarketStatus, Outcome } from "./types.js";

export function deriveTradeability(input: {
  status?: MarketStatus | null;
  expiry?: number | null;
  now: number;
  registryTradeable?: boolean | null;
}) {
  if (typeof input.registryTradeable === "boolean") {
    return input.registryTradeable;
  }

  return input.status === "Live" && Boolean(input.expiry && input.expiry > input.now);
}

export function derivePrices(yesReserve?: string | null, noReserve?: string | null) {
  const yes = Number(yesReserve ?? 0);
  const no = Number(noReserve ?? 0);
  const total = yes + no;
  if (!total) {
    return {
      yesPrice: null,
      noPrice: null,
    };
  }

  return {
    yesPrice: yes / total,
    noPrice: no / total,
  };
}

export function deriveResolutionNextActions(input: {
  status?: MarketStatus | null;
  expiry?: number | null;
  now: number;
  hasProposal?: boolean | null;
  hasDispute?: boolean | null;
  proposedAt?: number | null;
  disputeWindow?: number | null;
}) {
  if (!input.status) {
    return [];
  }
  if (input.expiry && input.now < input.expiry) {
    return [];
  }

  switch (input.status) {
    case "TradingClosed":
      return ["request_resolution"];
    case "ResolutionRequested":
      return ["propose_outcome"];
    case "Proposed":
      if (input.hasDispute) {
        return ["await_dispute_settlement"];
      }
      if ((input.proposedAt ?? 0) + (input.disputeWindow ?? 0) > input.now) {
        return ["dispute"];
      }
      return ["finalize_undisputed"];
    case "Disputed":
      return ["escalate_to_council"];
    case "CouncilVoting":
      return ["monitor_commit_reveal"];
    case "Resolved":
    case "Cancelled":
      return ["redeem"];
    default:
      return [];
  }
}

export function deriveRedeemability(status?: MarketStatus | null, outcome?: Outcome | null) {
  return Boolean(status && (status === "Resolved" || status === "Cancelled") && outcome);
}
