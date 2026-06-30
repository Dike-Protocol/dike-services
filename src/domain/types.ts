export type Outcome = "Yes" | "No" | "Invalid";

export type MarketStatus =
  | "Created"
  | "Live"
  | "Paused"
  | "TradingClosed"
  | "ResolutionRequested"
  | "Proposed"
  | "Disputed"
  | "CouncilVoting"
  | "Resolved"
  | "Cancelled";

export function outcomeTag(value: unknown): Outcome | undefined {
  if (typeof value === "string" && (value === "Yes" || value === "No" || value === "Invalid")) {
    return value;
  }
  if (typeof value === "object" && value && "tag" in value) {
    const tag = String((value as { tag: string }).tag);
    if (tag === "Yes" || tag === "No" || tag === "Invalid") {
      return tag;
    }
  }
}

export function marketStatusTag(value: unknown): MarketStatus | undefined {
  const allowed = new Set<MarketStatus>([
    "Created",
    "Live",
    "Paused",
    "TradingClosed",
    "ResolutionRequested",
    "Proposed",
    "Disputed",
    "CouncilVoting",
    "Resolved",
    "Cancelled",
  ]);
  if (typeof value === "string" && allowed.has(value as MarketStatus)) {
    return value as MarketStatus;
  }
  if (typeof value === "object" && value && "tag" in value) {
    const tag = String((value as { tag: string }).tag);
    if (allowed.has(tag as MarketStatus)) {
      return tag as MarketStatus;
    }
  }
}
