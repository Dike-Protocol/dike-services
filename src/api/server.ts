import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import IORedis from "ioredis";
import { loadEnv } from "../config/env.js";
import { loadManifest } from "../config/manifest.js";
import { DikeContractClient } from "../contracts/client.js";
import { createPgPool } from "../db/client.js";
import { StateRepository } from "../db/repositories/state-repository.js";
import { derivePrices, deriveResolutionNextActions, deriveTradeability } from "../domain/derived-state.js";
import { IndexerWorker } from "../indexer/worker.js";
import { ReconciliationService } from "../jobs/reconciliation.js";
import { ScheduledJobs } from "../jobs/scheduled.js";
import { collectHealth } from "../observability/health.js";
import { createLogger } from "../observability/logger.js";
import { MetricsStore } from "../observability/metrics.js";
import { jsonReplacer } from "../contracts/codecs.js";
import { parseMarketId, parseMarketListQuery } from "./request-validation.js";

declare module "fastify" {
  interface FastifyInstance {
    services: Awaited<ReturnType<typeof createServices>>;
  }
}

function sendJson(reply: { send: (payload: unknown) => void }, payload: unknown) {
  reply.send(JSON.parse(JSON.stringify(payload, jsonReplacer)));
}

function normalizeAddress(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

async function createServices() {
  const env = loadEnv();
  const logger = createLogger(env);
  const manifest = await loadManifest(env);
  const db = createPgPool(env);
  const RedisCtor = IORedis as unknown as { new (url: string): { ping: () => Promise<unknown>; quit: () => Promise<unknown> } };
  const redis = new RedisCtor(env.REDIS_URL);
  const metrics = new MetricsStore();
  const repository = new StateRepository(db);
  const contracts = new DikeContractClient(env, manifest, logger);
  const reconciliation = new ReconciliationService(manifest, contracts, repository, logger, metrics);
  const indexer = new IndexerWorker(env, manifest, contracts, repository, reconciliation, logger, metrics);
  const scheduledJobs = new ScheduledJobs(env, repository, reconciliation, contracts, logger);

  await repository.bootstrapManifest(
    manifest,
    env.STELLAR_RPC_URL,
    env.STELLAR_NETWORK_PASSPHRASE,
  );

  return {
    env,
    logger,
    manifest,
    db,
    redis,
    metrics,
    repository,
    contracts,
    reconciliation,
    indexer,
    scheduledJobs,
  };
}

export async function buildApp() {
  const services = await createServices();
  const app = Fastify({
    loggerInstance: services.logger as never,
  });

  app.services = services;

  await app.register(cors);
  await app.register(sensible);

  app.get("/health", async (_, reply) => {
    const health = await collectHealth(
      services.repository,
      services.redis,
      services.contracts,
      services.metrics,
    );
    sendJson(reply, health);
  });

  app.get("/metrics", async (_, reply) => {
    sendJson(reply, services.metrics.snapshot());
  });

  app.get("/markets", async (request, reply) => {
    const query = parseMarketListQuery(request.query);
    const result = await services.repository.listMarkets(
      query.limit,
      query.cursor,
      query.status,
      query.creator,
      query.collateral,
    );
    const now = Math.floor(Date.now() / 1000);
    const items = result.rows.map((row: any) => ({
      ...row,
      prices: derivePrices(row.yes_reserve, row.no_reserve),
      tradeable: deriveTradeability({
        status: row.status as any,
        expiry: row.expiry ? Number(row.expiry) : null,
        now,
      }),
    })) as Array<Record<string, unknown>>;
    const lastItem = items.at(-1) as { market_id?: unknown } | undefined;
    sendJson(reply, {
      items,
      nextCursor: lastItem?.market_id ?? null,
    });
  });

  app.get("/markets/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const marketId = parseMarketId(params.id);
    const detail = await services.repository.getMarketDetail(
      services.manifest.data.network,
      marketId,
    );
    const now = Math.floor(Date.now() / 1000);
    sendJson(reply, {
      ...detail,
      market:
        detail.market == null
          ? null
          : {
              ...detail.market,
              prices: derivePrices(detail.market.yes_reserve, detail.market.no_reserve),
              tradeable: deriveTradeability({
                status: detail.market.status as any,
                expiry: detail.market.expiry ? Number(detail.market.expiry) : null,
                now,
              }),
            },
    });
  });

  app.get("/users/:address/portfolio", async (request, reply) => {
    const params = request.params as { address: string };
    const portfolio = await services.repository.getPortfolio(
      services.manifest.data.network,
      params.address,
    );
    sendJson(reply, portfolio);
  });

  app.get("/authz/:address", async (request, reply) => {
    const params = request.params as { address: string };
    const address = normalizeAddress(params.address);
    const governance = await services.repository.getAdminGovernance(
      services.manifest.data.network,
    );

    const approvedLists = (governance.lists as Array<Record<string, unknown>>).filter(
      (entry) => entry.approved === true,
    );
    const approvedCreators = approvedLists
      .filter((entry) => entry.kind === "creator")
      .map((entry) => normalizeAddress(entry.address));
    const councilMembers = approvedLists
      .filter((entry) => entry.kind === "member")
      .map((entry) => normalizeAddress(entry.address));

    const config = (governance.config ?? {}) as Record<string, unknown>;
    const adminAddresses = [
      services.manifest.data.admin,
      services.manifest.data.governance_authority,
      config.timelock,
      config.pause_authority,
    ]
      .map(normalizeAddress)
      .filter(Boolean);

    const isApprovedCreator = approvedCreators.includes(address);
    const isCouncilMember = councilMembers.includes(address);
    const isAdmin = adminAddresses.includes(address);

    sendJson(reply, {
      address,
      canCreate: isApprovedCreator,
      canResolve: Boolean(address),
      canCouncil: isCouncilMember,
      canAdmin: isAdmin,
      isApprovedCreator,
      isCouncilMember,
      isAdmin,
    });
  });

  app.get("/markets/:id/resolution", async (request, reply) => {
    const params = request.params as { id: string };
    const marketId = parseMarketId(params.id);
    const resolution = await services.repository.getResolution(
      services.manifest.data.network,
      marketId,
    );
    const now = Math.floor(Date.now() / 1000);
    sendJson(reply, {
      ...resolution,
      nextActions: deriveResolutionNextActions({
        status: resolution.market?.status,
        expiry: resolution.market?.expiry ? Number(resolution.market.expiry) : null,
        now,
        hasProposal: resolution.request?.has_proposal,
        hasDispute: resolution.request?.has_dispute,
        proposedAt: resolution.request?.proposed_at
          ? Number(resolution.request.proposed_at)
          : null,
        disputeWindow: resolution.request?.dispute_window
          ? Number(resolution.request.dispute_window)
          : null,
      }),
    });
  });

  app.get("/council/cases", async (request, reply) => {
    const query = request.query as { status?: string };
    const result = await services.repository.getCouncilCases(
      services.manifest.data.network,
      query.status,
    );
    sendJson(reply, result.rows);
  });

  app.get("/admin/governance", async (_, reply) => {
    const governance = await services.repository.getAdminGovernance(
      services.manifest.data.network,
    );
    sendJson(reply, governance);
  });

  app.get("/admin/timelock", async (_, reply) => {
    const actions = await services.repository.getTimelockActions(
      services.manifest.data.network,
    );
    sendJson(reply, actions.rows);
  });

  app.addHook("onReady", async () => {
    services.indexer.start();
    services.scheduledJobs.start();
  });

  app.addHook("onClose", async () => {
    services.indexer.stop();
    services.scheduledJobs.stop();
    await Promise.all([
      services.db.end(),
      services.redis.quit(),
    ]);
  });

  return app;
}
