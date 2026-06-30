# Dike Services Implementation Plan

## Summary

`dike-services` is the backend, indexing, and query layer for Dike Protocol. It should be a Node.js TypeScript service stack that consumes Stellar RPC, indexes Soroban contract events, reconciles critical state with direct contract reads, stores query-ready state in Postgres, and exposes APIs for `dike-web`.

The service must treat `/Users/sachplayz/Projects/Dike_Stellar/dike-contracts` as the canonical source for contract interfaces, deployment manifests, enum names, and market lifecycle rules. The initial target manifest is:

```text
/Users/sachplayz/Projects/Dike_Stellar/dike-contracts/deployments/testnet.json
```

The service does not custody user keys. It may build unsigned transaction payloads in a later phase, but user signing must remain in the browser wallet.

## Recommended Stack

- Runtime: Node.js 20+.
- Language: TypeScript.
- API: Fastify or NestJS. Prefer Fastify for a lean v1.
- DB: Postgres.
- Migrations: Drizzle, Prisma, or Kysely. Prefer Drizzle/Kysely for explicit SQL control.
- Queue: Redis + BullMQ.
- Chain client: `@stellar/stellar-sdk`.
- Testing: Vitest for unit/integration, Docker Compose for Postgres/Redis.
- Observability: structured logs, health endpoints, metrics for indexer lag and job failures.

Node TypeScript is the right v1 choice because the workload is RPC polling, event decoding, DB writes, API serving, and background orchestration. Performance should come from batching, indexes, worker parallelism, and reconciliation design rather than CPU-heavy application logic.

## Recommended Project Structure

```text
dike-services/
  package.json
  tsconfig.json
  .env.example
  docker-compose.yml
  migrations/
  src/
    api/
      server.ts
      routes/
      schemas/
    config/
      env.ts
      manifest.ts
      networks.ts
    contracts/
      clients/
      codecs/
      manifest-loader.ts
      types.ts
    db/
      client.ts
      schema.ts
      repositories/
    domain/
      admin/
      amm/
      council/
      governance/
      market/
      oracle/
      portfolio/
      vault/
    indexer/
      event-source.ts
      checkpoint.ts
      dispatcher.ts
      reducers/
      worker.ts
    jobs/
      queue.ts
      reconciliation.ts
      scheduled.ts
    observability/
      health.ts
      logger.ts
      metrics.ts
```

## Environment Configuration

Create `.env.example` with:

```text
NODE_ENV=development
PORT=4000

STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

DIKE_CONTRACTS_ROOT=/Users/sachplayz/Projects/Dike_Stellar/dike-contracts
DIKE_MANIFEST_PATH=/Users/sachplayz/Projects/Dike_Stellar/dike-contracts/deployments/testnet.json

DATABASE_URL=postgres://postgres:postgres@localhost:5432/dike_services
REDIS_URL=redis://localhost:6379

INDEXER_START_LEDGER=
INDEXER_POLL_INTERVAL_MS=5000
RECONCILIATION_INTERVAL_MS=60000
```

The service must fail fast if the manifest network does not match `STELLAR_NETWORK`.

## Contract Coverage

Index and reconcile these modules:

| Module | Manifest Key | Service Responsibility |
| --- | --- | --- |
| DikeMarketFactory | `market_factory` | Market creation event intake and factory-created market snapshots. |
| DikeMarketRegistry | `market_registry` | Canonical market data, status transitions, final outcomes, request id. |
| DikeConditionalTokens | `conditional_tokens` | Position transfers, burns, balances, backing reconciliation. |
| CollateralVault | `collateral_vault` | Deposits, redemptions, bond accounting, fees, child credit/debt snapshots. |
| DikeAMM | `amm` | Pool creation, liquidity changes, buy/sell trades, reserves, LP shares. |
| FeeManager | `fee_manager` | Fee config, bond config, bond split snapshots. |
| CODOracle | `cod_oracle` | Resolution requests, proposals, disputes, escalation, finalization. |
| CouncilOfDike | `council_of_dike` | Case lifecycle, commits, reveals, final outcomes, reward claims. |
| DikeGovernance | `dike_governance` | Treasury, supported collateral, creators, members, modules, upgrade hashes. |
| DikeTimelock | `dike_timelock` | Queued, cancelled, executed governance actions. |
| MockUSDC | `mock_usdc` | Local/dev only; exclude from production/testnet business logic unless explicitly configured. |

## Indexing Architecture

Use Stellar RPC `getEvents` with contract filters for each deployed contract id.

Indexer behavior:

- Maintain one checkpoint per network and contract, plus a global service watermark.
- Fetch events in bounded ledger windows.
- Decode topics and event payloads into typed domain events.
- Dispatch each decoded event to one reducer.
- Write DB changes transactionally with idempotency based on event id, ledger, tx hash, contract id, and topic.
- Advance checkpoints only after successful DB commit.
- Back off on RPC failures without skipping ledgers.
- Expose indexer lag in ledgers and seconds.

Recommended event groups:

```text
market_factory:
  modules, creator, collat, pause, mkt_new

market_registry:
  role, collat, pause, mkt_new, fee_cfg, status, res_req, final

amm:
  role, pause, pool, seed, lp_add, lp_rm, buy, sell

conditional_tokens:
  role, pause, split, merge, pos_xfer, burn, losebrn

collateral_vault:
  role, treas, pause, deposit, cfund, cpay, release, redeem, bond, bond_rel, fee

cod_oracle:
  role, pause, res_req, propose, dispute, final, escal, cod_fin

council_of_dike:
  role, member, pause, case, commit, reveal, casefin, reward

dike_governance:
  timelock, treas, creator, member, collat, module, pauser, fee_cfg, upgrade

dike_timelock:
  roles, queued, cancel, execute

fee_manager:
  fee_cfg, bondcfg, bondspl
```

## Database Model Plan

### Core Tables

`networks`

- `id`
- `name`
- `rpc_url`
- `network_passphrase`
- `manifest_hash`

`contract_deployments`

- `network`
- `module`
- `contract_id`
- `manifest_key`
- `active`

`indexer_checkpoints`

- `network`
- `contract_id`
- `last_processed_ledger`
- `last_processed_cursor`
- `updated_at`

`raw_contract_events`

- `network`
- `contract_id`
- `ledger`
- `tx_hash`
- `event_id`
- `topic`
- `payload`
- unique event identity for idempotency

### Market And AMM Tables

`markets`

- `network`
- `market_id`
- `question`
- `question_hash`
- `rules_uri`
- `rules_hash`
- `creator`
- `collateral`
- `yes_token_id`
- `no_token_id`
- `expiry`
- `status`
- `has_final_outcome`
- `final_outcome`
- `pool_id`
- `bond_amount`
- `dispute_window`
- `has_request`
- `request_id`
- `created_at`
- `fee_config_json`

`pools`

- `network`
- `pool_id`
- `market_id`
- `yes_reserve`
- `no_reserve`
- `total_lp_shares`
- `accumulated_lp_fees`
- `accumulated_protocol_fees`
- `accumulated_cod_fees`
- `live`
- `last_reconciled_ledger`

`trades`

- `network`
- `market_id`
- `pool_id`
- `trader`
- `side`
- `direction`
- `amount_in`
- `amount_out`
- `fee`
- `ledger`
- `tx_hash`
- `created_at`

`liquidity_events`

- `network`
- `market_id`
- `pool_id`
- `lp`
- `kind`
- `amount`
- `shares`
- `yes_out`
- `no_out`
- `ledger`
- `tx_hash`

`lp_positions`

- `network`
- `pool_id`
- `owner`
- `shares`
- `last_reconciled_ledger`

### User And Vault Tables

`user_positions`

- `network`
- `market_id`
- `owner`
- `outcome`
- `balance`
- `last_reconciled_ledger`

`vault_snapshots`

- `network`
- `market_id`
- `total_deposited`
- `collateral_backing`
- `amm_collateral`
- `child_collateral_issued`
- `child_collateral_repaid`
- `child_collateral_defaulted`
- `redeemed`
- `protocol_fees`
- `lp_fees`
- `cod_fees`
- `proposal_bonds`
- `dispute_bonds`
- `refundable`
- `last_reconciled_ledger`

`user_vault_state`

- `network`
- `market_id`
- `owner`
- `user_deposit`
- `root_stake_yes`
- `root_stake_no`
- `child_used_total`
- `child_used_yes`
- `child_used_no`
- `child_debt`
- `parent_debt_yes`
- `parent_debt_no`
- `redeemed_yes`
- `redeemed_no`
- `redeemed_invalid`
- `last_reconciled_ledger`

### Oracle, Council, Governance Tables

`resolution_requests`

- `network`
- `request_id`
- `market_id`
- `status`
- `requested_at`
- `bond_amount`
- `dispute_window`
- `has_proposal`
- `proposer`
- `proposed_outcome`
- `proposal_evidence_uri`
- `proposed_at`
- `has_dispute`
- `disputer`
- `disputed_outcome`
- `dispute_evidence_uri`
- `disputed_at`
- `has_final_outcome`
- `final_outcome`

`council_cases`

- `network`
- `case_id`
- `request_id`
- `market_id`
- `status`
- `proposer`
- `proposer_outcome`
- `disputer`
- `disputer_outcome`
- `voting_start`
- `commit_end`
- `reveal_end`
- `has_final_outcome`
- `final_outcome`
- `yes_votes`
- `no_votes`
- `invalid_votes`
- `total_valid_votes`

`council_votes`

- `network`
- `case_id`
- `voter`
- `has_commit`
- `has_reveal`
- `revealed_outcome`
- `claimed_reward`
- `correct`

`governance_config`

- `network`
- `treasury`
- `timelock`
- `fee_config_json`
- `pause_authority`
- `updated_at`

`governance_lists`

- `network`
- `kind`
- `address`
- `approved`

`governance_modules`

- `network`
- `role`
- `module_address`

`timelock_actions`

- `network`
- `action_id`
- `kind`
- `target`
- `payload_hash`
- `execute_after`
- `expires_at`
- `executed`
- `cancelled`

## API Surface

Use JSON responses with integer amounts serialized as strings.

### `GET /health`

Returns service, DB, Redis, and Stellar RPC health.

### `GET /markets`

Query params:

- `status`
- `category`
- `creator`
- `collateral`
- `limit`
- `cursor`

Returns:

- Market summary.
- Pool summary.
- Derived YES/NO prices.
- Resolution state.
- Tradeability state.

### `GET /markets/:id`

Returns:

- Full market data.
- Pool data.
- Fee config.
- Vault snapshot.
- Resolution request if present.
- Council case if present.
- Recent trades and liquidity events.

### `GET /users/:address/portfolio`

Returns:

- Position balances grouped by market.
- LP positions.
- User vault state.
- Redeemable resolved/cancelled positions.
- Encumbered positions from child/parent debt.

### `GET /markets/:id/resolution`

Returns:

- Market status.
- Request id and request details.
- Proposal/dispute details.
- Dispute deadline.
- Next available public actions.
- Council case if escalated.

### `GET /council/cases`

Query params:

- `status`
- `member`

Returns:

- Cases with commit/reveal/finalize windows.
- Vote status for a member when supplied.

### `GET /admin/governance`

Returns:

- Treasury.
- Timelock.
- Supported collateral.
- Approved creators.
- Council members.
- Module role addresses.
- Fee config.
- Upgrade hashes where indexed.

### `GET /admin/timelock`

Returns:

- Queued, executable, expired, cancelled, and executed actions.

## Reconciliation Jobs

Run scheduled jobs that compare indexed DB state with direct contract reads.

Market reconciliation:

- `market_registry.get_market(market_id)`
- `market_registry.get_status(market_id)`
- `market_registry.get_final_outcome(market_id)` when resolved

Pool reconciliation:

- `amm.pool(pool_id)`
- `amm.lp_balance(pool_id, owner)` for known LPs

Position reconciliation:

- `conditional_tokens.balance(owner, market_id, Outcome.Yes)`
- `conditional_tokens.balance(owner, market_id, Outcome.No)`
- `conditional_tokens.backing(market_id)`

Vault reconciliation:

- `collateral_vault.accounting(market_id)`
- `collateral_vault.user_deposit(market_id, owner)`
- `collateral_vault.root_stake(market_id, owner, outcome)`
- `collateral_vault.child_avail_for_outcome(parent_market_id, owner, outcome)`
- `collateral_vault.child_debt(child_market_id, owner)`
- `collateral_vault.parent_debt(parent_market_id, owner, outcome)`
- `collateral_vault.redeemed(market_id, owner, outcome)`

Oracle and council reconciliation:

- `cod_oracle.request(request_id)`
- `cod_oracle.market_request(market_id)`
- `council_of_dike.case(case_id)`
- `council_of_dike.case_for_request(request_id)`

Governance/timelock reconciliation:

- `dike_governance.treasury`
- `dike_governance.fee_config`
- `dike_governance.module(role)`
- `dike_timelock.action(action_id)`

Reconciliation rules:

- Direct contract reads override indexed projections.
- Keep raw events immutable.
- Record reconciliation timestamp and ledger.
- Alert if a critical mismatch persists after two reconciliation passes.

## Derived State Rules

Tradeability:

- A market is tradeable only if registry state is `Live`, system is not paused, and current time is before expiry.
- Confirm using `market_registry.is_tradeable` before the web submits an AMM transaction.

Prices:

- Derive implied YES/NO prices from AMM reserves.
- Do not call the UI data an orderbook; Dike v1 uses AMM pools.

Resolution next actions:

- Before expiry: no resolution action.
- After expiry and live/trading closed: allow request resolution.
- Requested: allow proposal.
- Proposed and inside dispute window: allow dispute.
- Proposed and after dispute window: allow undisputed finalization.
- Disputed: allow escalation to council.
- CouncilVoting: show council case phase.
- Resolved/Cancelled: show redemption availability.

Child credit:

- Child-market credit is one-level only.
- Available credit is based on 60% of parent root stake per outcome, less used credit.
- Positions with child or parent debt may be encumbered and blocked from transfer/sell.

Redemption:

- Resolved YES pays YES, resolved NO pays NO.
- Invalid pays half value for either side.
- Cancelled markets use invalid-style redemption.
- Child debt is repaid before user profit according to vault contract behavior.

## Operational Checks And Alerts

Expose metrics:

- Latest Stellar ledger.
- Last indexed ledger by contract.
- Indexer lag by contract.
- Event processing failures.
- RPC failure rate.
- Reconciliation mismatch count.
- Job queue depth.
- API latency and error rate.

Alert on:

- Indexer lag above configured threshold.
- Repeated RPC errors.
- Failed DB migrations.
- Manifest/network mismatch.
- Final outcome mismatch between DB and registry.
- Pool reserve mismatch after reconciliation.
- Vault accounting mismatch after reconciliation.
- Unknown event topic from a known contract.
- Contract module address changes.
- Paused market, AMM, vault, oracle, council, or registry modules.

## Testing Plan

Unit tests:

- Manifest loader and network validation.
- Dike enum decoding.
- ScVal codec round trips for Dike structs.
- Event topic routing.
- Reducer behavior for each event group.
- Derived state rules for tradeability, resolution next actions, child credit, and redemption.

Integration tests:

- Postgres repository writes are idempotent.
- Checkpoints advance only after reducer commit.
- Event replay produces expected market, pool, portfolio, resolution, council, and timelock state.
- Reconciliation overwrites stale projections.
- API endpoints return integer amounts as strings.

Local end-to-end tests:

- Start local Stellar, deploy contracts, load local manifest.
- Create market.
- Seed liquidity.
- Buy and sell YES/NO.
- Add and remove liquidity.
- Request resolution.
- Propose and finalize undisputed.
- Dispute, escalate, commit, reveal, finalize, report council outcome.
- Redeem resolved and cancelled positions.

Failure tests:

- RPC unavailable.
- Duplicate event replay.
- Out-of-order event fetch retry.
- Unknown contract id in manifest.
- Manifest network mismatch.
- Reconciliation mismatch persists.

## Rollout Order

1. Bootstrap TypeScript service, env loader, manifest loader, health endpoint, Postgres, and Redis.
2. Add contract ids and event polling using Stellar RPC `getEvents`.
3. Add raw event storage and checkpointing.
4. Implement market registry and factory reducers first.
5. Add AMM, vault, token, oracle, council, governance, timelock, and fee reducers.
6. Add read APIs for markets and market detail.
7. Add portfolio, resolution, council, and admin APIs.
8. Add reconciliation jobs for markets, pools, vault state, positions, oracle requests, and council cases.
9. Add observability and alert thresholds.
10. Add local end-to-end replay test coverage.

## Assumptions

- `dike-contracts` remains the canonical source for public interfaces and deployment manifests.
- The first supported network is Stellar testnet.
- The default collateral is the real testnet USDC SAC from `deployments/testnet.json`.
- `dike-services` stores and serves query state but does not sign user transactions.
- `dike-web` remains the only user-signing surface.
