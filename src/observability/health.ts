import type { DikeContractClient } from "../contracts/client.js";
import type { StateRepository } from "../db/repositories/state-repository.js";
import type { MetricsStore } from "./metrics.js";

export async function collectHealth(
  repository: StateRepository,
  redis: { ping: () => Promise<unknown> },
  contracts: DikeContractClient,
  metrics: MetricsStore,
) {
  const [rpcHealth, latestLedger] = await Promise.all([
    contracts.getHealth(),
    contracts.getLatestLedger(),
    repository.ping(),
    redis.ping(),
  ]);

  return {
    service: "ok",
    db: "ok",
    redis: "ok",
    rpc: rpcHealth.status,
    latestLedger: latestLedger.sequence,
    metrics: metrics.snapshot(),
  };
}
