import type { DikeContractClient } from "../contracts/client.js";
import type { StateRepository } from "../db/repositories/state-repository.js";
import type { MetricsStore } from "./metrics.js";

export async function collectHealth(
  repository: StateRepository,
  redis: { ping: () => Promise<unknown> },
  contracts: DikeContractClient,
  metrics: MetricsStore,
) {
  const [rpcResult, latestLedgerResult, dbResult, redisResult] = await Promise.allSettled([
    contracts.getHealth(),
    contracts.getLatestLedger(),
    repository.ping(),
    redis.ping(),
  ]);

  const rpcOk = rpcResult.status === "fulfilled";
  const ledgerOk = latestLedgerResult.status === "fulfilled";
  const dbOk = dbResult.status === "fulfilled";
  const redisOk = redisResult.status === "fulfilled";
  const serviceOk = rpcOk && ledgerOk && dbOk && redisOk;

  return {
    service: serviceOk ? "ok" : "degraded",
    db: dbOk ? "ok" : "error",
    redis: redisOk ? "ok" : "error",
    rpc: rpcOk ? rpcResult.value.status : "error",
    latestLedger: ledgerOk ? latestLedgerResult.value.sequence : null,
    metrics: metrics.snapshot(),
  };
}
