import type { PoolClient, QueryResultRow } from "pg";
import type { LoadedManifest } from "../../config/manifest.js";
import { jsonReplacer } from "../../contracts/codecs.js";
import type { PgPool } from "../client.js";

export type EventRecord = {
  network: string;
  contractId: string;
  ledger: number;
  txHash: string;
  eventId: string;
  topic: string;
  topicValues: unknown[];
  payload: unknown;
  rawEvent: unknown;
  cursor?: string;
};

export type EventIdentity = Pick<EventRecord, "network" | "contractId" | "eventId">;

export class StateRepository {
  constructor(private readonly pool: PgPool) {}

  async withTransaction<T>(handler: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await handler(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async bootstrapManifest(manifest: LoadedManifest, rpcUrl: string, passphrase: string) {
    await this.pool.query(
      `INSERT INTO networks (id, name, rpc_url, network_passphrase, manifest_hash)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
       SET rpc_url = EXCLUDED.rpc_url,
           network_passphrase = EXCLUDED.network_passphrase,
           manifest_hash = EXCLUDED.manifest_hash,
           updated_at = NOW()`,
      [manifest.data.network, manifest.data.network, rpcUrl, passphrase, manifest.hash],
    );

    for (const [module, contractId] of Object.entries(manifest.data.contracts)) {
      if (!contractId) {
        continue;
      }
      await this.pool.query(
        `INSERT INTO contract_deployments (network, module, contract_id, manifest_key, active)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (network, module) DO UPDATE
         SET contract_id = EXCLUDED.contract_id,
             manifest_key = EXCLUDED.manifest_key,
             active = TRUE,
             updated_at = NOW()`,
        [manifest.data.network, module, contractId, module],
      );

      await this.pool.query(
        `INSERT INTO indexer_checkpoints (network, contract_id, last_processed_ledger)
         VALUES ($1, $2, 0)
         ON CONFLICT (network, contract_id) DO NOTHING`,
        [manifest.data.network, contractId],
      );
    }
  }

  async getDeployments(network: string) {
    const result = await this.pool.query<{
      module: string;
      contract_id: string;
    }>(
      `SELECT module, contract_id
       FROM contract_deployments
       WHERE network = $1 AND active = TRUE
       ORDER BY module`,
      [network],
    );
    return result.rows;
  }

  async getCheckpoint(network: string, contractId: string) {
    const result = await this.pool.query<{
      last_processed_ledger: string;
      last_processed_cursor: string | null;
    }>(
      `SELECT last_processed_ledger, last_processed_cursor
       FROM indexer_checkpoints
       WHERE network = $1 AND contract_id = $2`,
      [network, contractId],
    );

    return result.rows[0]
      ? {
          lastProcessedLedger: Number(result.rows[0].last_processed_ledger),
          lastProcessedCursor: result.rows[0].last_processed_cursor ?? undefined,
        }
      : {
          lastProcessedLedger: 0,
        };
  }

  async recordRawEvent(event: EventRecord) {
    await this.pool.query(
      `INSERT INTO raw_contract_events (
        network, contract_id, ledger, tx_hash, event_id, topic, topic_values, payload, raw_event, cursor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10)
      ON CONFLICT (network, event_id) DO NOTHING`,
      [
        event.network,
        event.contractId,
        event.ledger,
        event.txHash,
        event.eventId,
        event.topic,
        JSON.stringify(event.topicValues, jsonReplacer),
        JSON.stringify(event.payload, jsonReplacer),
        JSON.stringify(event.rawEvent, jsonReplacer),
        event.cursor ?? null,
      ],
    );
  }

  async advanceCheckpoint(network: string, contractId: string, lastProcessedLedger: number, lastProcessedCursor?: string) {
    await this.pool.query(
      `INSERT INTO indexer_checkpoints (network, contract_id, last_processed_ledger, last_processed_cursor)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (network, contract_id) DO UPDATE
       SET last_processed_ledger = GREATEST(indexer_checkpoints.last_processed_ledger, EXCLUDED.last_processed_ledger),
           last_processed_cursor = EXCLUDED.last_processed_cursor,
           updated_at = NOW()`,
      [network, contractId, lastProcessedLedger, lastProcessedCursor ?? null],
    );
  }

  async resetCheckpoint(network: string, contractId: string, lastProcessedLedger: number) {
    await this.pool.query(
      `INSERT INTO indexer_checkpoints (network, contract_id, last_processed_ledger, last_processed_cursor)
       VALUES ($1, $2, $3, NULL)
       ON CONFLICT (network, contract_id) DO UPDATE
       SET last_processed_ledger = EXCLUDED.last_processed_ledger,
           last_processed_cursor = NULL,
           updated_at = NOW()`,
      [network, contractId, lastProcessedLedger],
    );
  }

  async upsertMarketSummary(summary: Record<string, unknown>) {
    const entries = Object.entries(summary);
    const columns = entries.map(([key]) => key);
    const values = entries.map(([, value]) => value);
    const assignments = columns.map((column, index) => `${column} = EXCLUDED.${column}`);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    await this.pool.query(
      `INSERT INTO markets (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (network, market_id) DO UPDATE
       SET ${assignments.join(", ")}, updated_at = NOW()`,
      values,
    );
  }

  async upsertPool(summary: Record<string, unknown>) {
    const entries = Object.entries(summary);
    const columns = entries.map(([key]) => key);
    const values = entries.map(([, value]) => value);
    const assignments = columns.map((column) => `${column} = EXCLUDED.${column}`);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    await this.pool.query(
      `INSERT INTO pools (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (network, pool_id) DO UPDATE
       SET ${assignments.join(", ")}, updated_at = NOW()`,
      values,
    );
  }

  async upsertResolutionRequest(summary: Record<string, unknown>) {
    const entries = Object.entries(summary);
    const columns = entries.map(([key]) => key);
    const values = entries.map(([, value]) => value);
    const assignments = columns.map((column) => `${column} = EXCLUDED.${column}`);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    await this.pool.query(
      `INSERT INTO resolution_requests (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (network, request_id) DO UPDATE
       SET ${assignments.join(", ")}, updated_at = NOW()`,
      values,
    );
  }

  async upsertCouncilCase(summary: Record<string, unknown>) {
    const entries = Object.entries(summary);
    const columns = entries.map(([key]) => key);
    const values = entries.map(([, value]) => value);
    const assignments = columns.map((column) => `${column} = EXCLUDED.${column}`);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    await this.pool.query(
      `INSERT INTO council_cases (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (network, case_id) DO UPDATE
       SET ${assignments.join(", ")}, updated_at = NOW()`,
      values,
    );
  }

  async upsertGovernanceConfig(network: string, values: Record<string, unknown>) {
    await this.pool.query(
      `INSERT INTO governance_config (network, treasury, timelock, fee_config_json, pause_authority)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       ON CONFLICT (network) DO UPDATE
       SET treasury = EXCLUDED.treasury,
           timelock = EXCLUDED.timelock,
           fee_config_json = EXCLUDED.fee_config_json,
           pause_authority = EXCLUDED.pause_authority,
           updated_at = NOW()`,
      [
        network,
        values.treasury ?? null,
        values.timelock ?? null,
        JSON.stringify(values.fee_config_json ?? {}),
        values.pause_authority ?? null,
      ],
    );
  }

  async upsertGovernanceModule(network: string, role: string, moduleAddress: string) {
    await this.pool.query(
      `INSERT INTO governance_modules (network, role, module_address)
       VALUES ($1, $2, $3)
       ON CONFLICT (network, role) DO UPDATE
       SET module_address = EXCLUDED.module_address,
           updated_at = NOW()`,
      [network, role, moduleAddress],
    );
  }

  async upsertGovernanceList(network: string, kind: string, address: string, approved: boolean) {
    await this.pool.query(
      `INSERT INTO governance_lists (network, kind, address, approved)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (network, kind, address) DO UPDATE
       SET approved = EXCLUDED.approved,
           updated_at = NOW()`,
      [network, kind, address, approved],
    );
  }

  async upsertTimelockAction(summary: Record<string, unknown>) {
    const entries = Object.entries(summary);
    const columns = entries.map(([key]) => key);
    const values = entries.map(([, value]) => value);
    const assignments = columns.map((column) => `${column} = EXCLUDED.${column}`);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    await this.pool.query(
      `INSERT INTO timelock_actions (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (network, action_id) DO UPDATE
       SET ${assignments.join(", ")}, updated_at = NOW()`,
      values,
    );
  }

  async upsertVaultSnapshot(summary: Record<string, unknown>) {
    const entries = Object.entries(summary);
    const columns = entries.map(([key]) => key);
    const values = entries.map(([, value]) => value);
    const assignments = columns.map((column) => `${column} = EXCLUDED.${column}`);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    await this.pool.query(
      `INSERT INTO vault_snapshots (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (network, market_id) DO UPDATE
       SET ${assignments.join(", ")}, updated_at = NOW()`,
      values,
    );
  }

  async upsertUserPosition(summary: Record<string, unknown>) {
    const entries = Object.entries(summary);
    const columns = entries.map(([key]) => key);
    const values = entries.map(([, value]) => value);
    const assignments = columns.map((column) => `${column} = EXCLUDED.${column}`);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    await this.pool.query(
      `INSERT INTO user_positions (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (network, market_id, owner, outcome) DO UPDATE
       SET ${assignments.join(", ")}, updated_at = NOW()`,
      values,
    );
  }

  async upsertLpPosition(summary: Record<string, unknown>) {
    const entries = Object.entries(summary);
    const columns = entries.map(([key]) => key);
    const values = entries.map(([, value]) => value);
    const assignments = columns.map((column) => `${column} = EXCLUDED.${column}`);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    await this.pool.query(
      `INSERT INTO lp_positions (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (network, pool_id, owner) DO UPDATE
       SET ${assignments.join(", ")}, updated_at = NOW()`,
      values,
    );
  }

  async upsertUserVaultState(summary: Record<string, unknown>) {
    const entries = Object.entries(summary);
    const columns = entries.map(([key]) => key);
    const values = entries.map(([, value]) => value);
    const assignments = columns.map((column) => `${column} = EXCLUDED.${column}`);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    await this.pool.query(
      `INSERT INTO user_vault_state (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (network, market_id, owner) DO UPDATE
       SET ${assignments.join(", ")}, updated_at = NOW()`,
      values,
    );
  }

  async insertTrade(summary: Record<string, unknown>) {
    const entries = Object.entries(summary);
    const columns = entries.map(([key]) => key);
    const values = entries.map(([, value]) => value);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    await this.pool.query(
      `INSERT INTO trades (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (network, event_id) WHERE event_id IS NOT NULL DO NOTHING`,
      values,
    );
  }

  async insertLiquidityEvent(summary: Record<string, unknown>) {
    const entries = Object.entries(summary);
    const columns = entries.map(([key]) => key);
    const values = entries.map(([, value]) => value);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    await this.pool.query(
      `INSERT INTO liquidity_events (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (network, event_id) WHERE event_id IS NOT NULL DO NOTHING`,
      values,
    );
  }

  async listMarkets(limit: number, cursor?: number, status?: string, creator?: string, collateral?: string) {
    const values: Array<string | number> = [];
    const conditions: string[] = [];

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }
    if (creator) {
      values.push(creator);
      conditions.push(`creator = $${values.length}`);
    }
    if (collateral) {
      values.push(collateral);
      conditions.push(`collateral = $${values.length}`);
    }
    if (cursor) {
      values.push(cursor);
      conditions.push(`market_id < $${values.length}`);
    }

    values.push(limit);
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return this.pool.query(
      `SELECT m.*, p.yes_reserve, p.no_reserve, p.total_lp_shares, p.live AS pool_live
       FROM markets m
       LEFT JOIN pools p
         ON p.network = m.network AND p.pool_id = m.pool_id
       ${where}
       ORDER BY m.market_id DESC
       LIMIT $${values.length}`,
      values,
    );
  }

  async getMarketDetail(network: string, marketId: number) {
    const [market, vault, resolution, council, trades, liquidity] = await Promise.all([
      this.pool.query(`SELECT * FROM markets WHERE network = $1 AND market_id = $2`, [network, marketId]),
      this.pool.query(`SELECT * FROM vault_snapshots WHERE network = $1 AND market_id = $2`, [network, marketId]),
      this.pool.query(`SELECT * FROM resolution_requests WHERE network = $1 AND market_id = (SELECT market_id FROM markets WHERE network = $1 AND market_id = $2)`, [network, marketId]),
      this.pool.query(`SELECT * FROM council_cases WHERE network = $1 AND market_id = $2 ORDER BY case_id DESC LIMIT 1`, [network, marketId]),
      this.pool.query(`SELECT * FROM trades WHERE network = $1 AND market_id = $2 ORDER BY ledger DESC LIMIT 25`, [network, marketId]),
      this.pool.query(`SELECT * FROM liquidity_events WHERE network = $1 AND market_id = $2 ORDER BY ledger DESC LIMIT 25`, [network, marketId]),
    ]);

    return {
      market: market.rows[0] ?? null,
      vault: vault.rows[0] ?? null,
      resolution: resolution.rows[0] ?? null,
      council: council.rows[0] ?? null,
      trades: trades.rows,
      liquidity: liquidity.rows,
    };
  }

  async getPortfolio(network: string, address: string) {
    const [positions, lpPositions, vaultState] = await Promise.all([
      this.pool.query(`SELECT * FROM user_positions WHERE network = $1 AND owner = $2 ORDER BY market_id DESC`, [network, address]),
      this.pool.query(`SELECT * FROM lp_positions WHERE network = $1 AND owner = $2 ORDER BY pool_id DESC`, [network, address]),
      this.pool.query(`SELECT * FROM user_vault_state WHERE network = $1 AND owner = $2 ORDER BY market_id DESC`, [network, address]),
    ]);

    return {
      positions: positions.rows,
      lpPositions: lpPositions.rows,
      vaultState: vaultState.rows,
    };
  }

  async getResolution(network: string, marketId: number) {
    const [market, request, caseResult] = await Promise.all([
      this.pool.query(`SELECT * FROM markets WHERE network = $1 AND market_id = $2`, [network, marketId]),
      this.pool.query(`SELECT * FROM resolution_requests WHERE network = $1 AND market_id = $2 ORDER BY request_id DESC LIMIT 1`, [network, marketId]),
      this.pool.query(`SELECT * FROM council_cases WHERE network = $1 AND market_id = $2 ORDER BY case_id DESC LIMIT 1`, [network, marketId]),
    ]);

    return {
      market: market.rows[0] ?? null,
      request: request.rows[0] ?? null,
      councilCase: caseResult.rows[0] ?? null,
    };
  }

  async getCouncilCases(network: string, status?: string) {
    const values: string[] = [network];
    const where = status ? `WHERE network = $1 AND status = $2` : `WHERE network = $1`;
    if (status) {
      values.push(status);
    }
    return this.pool.query(`SELECT * FROM council_cases ${where} ORDER BY case_id DESC`, values);
  }

  async getAdminGovernance(network: string) {
    const [config, lists, modules] = await Promise.all([
      this.pool.query(`SELECT * FROM governance_config WHERE network = $1`, [network]),
      this.pool.query(`SELECT * FROM governance_lists WHERE network = $1 ORDER BY kind, address`, [network]),
      this.pool.query(`SELECT * FROM governance_modules WHERE network = $1 ORDER BY role`, [network]),
    ]);
    return {
      config: config.rows[0] ?? null,
      lists: lists.rows,
      modules: modules.rows,
    };
  }

  async getTimelockActions(network: string) {
    return this.pool.query(
      `SELECT * FROM timelock_actions WHERE network = $1 ORDER BY action_id DESC`,
      [network],
    );
  }

  async getMismatchCount() {
    const result = await this.pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM reconciliation_mismatches`);
    return Number(result.rows[0]?.count ?? 0);
  }

  async noteMismatch(network: string, module: string, entityId: string, message: string) {
    await this.pool.query(
      `INSERT INTO reconciliation_mismatches (network, module, entity_id, message)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (network, module, entity_id, message) DO UPDATE
       SET seen_count = reconciliation_mismatches.seen_count + 1,
           updated_at = NOW()`,
      [network, module, entityId, message],
    );
  }

  async ping() {
    await this.pool.query("SELECT 1");
  }
}

export function rows<T extends QueryResultRow>(rows: T[]) {
  return rows;
}
