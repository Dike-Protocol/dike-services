# dike-services

The backend indexing and query layer for [Dike Protocol](https://github.com/Dike-Protocol) — a prediction market platform built on Stellar/Soroban.

This service polls Stellar RPC for Soroban contract events, indexes them into PostgreSQL, runs periodic reconciliation jobs against on-chain state, and exposes a read-only REST API consumed by `dike-web`.

## Architecture

```
Stellar RPC (getEvents)
        │
        ▼
  IndexerWorker ──► EventSource ──► EventDispatcher ──► StateRepository (PostgreSQL)
        │                                                        │
        └──► ReconciliationService ◄───────────────────────────┘
                       │
                       ▼
              Direct contract reads (Soroban RPC)
                       │
                       ▼
              Overwrite stale projections

REST API (Fastify) ──► StateRepository ──► dike-web
```

**Components:**

| Component | Responsibility |
|---|---|
| `IndexerWorker` | Polls Stellar RPC for events per contract, advances checkpoints after each committed batch |
| `EventDispatcher` | Routes decoded events to the correct reducer |
| `ReconciliationService` | Periodically reads contract state directly and overwrites indexed projections |
| `ScheduledJobs` | Orchestrates reconciliation on a configurable interval |
| Fastify API | Serves query-ready market, portfolio, resolution, council, and admin state |

## Indexed Contracts

| Contract | Manifest key |
|---|---|
| DikeMarketFactory | `market_factory` |
| DikeMarketRegistry | `market_registry` |
| DikeConditionalTokens | `conditional_tokens` |
| CollateralVault | `collateral_vault` |
| DikeAMM | `amm` |
| FeeManager | `fee_manager` |
| CODOracle | `cod_oracle` |
| CouncilOfDike | `council_of_dike` |
| DikeGovernance | `dike_governance` |
| DikeTimelock | `dike_timelock` |

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL and Redis)
- A deployment manifest from `dike-contracts` (bundled for testnet at `deployments/testnet.json`)

## Getting Started

**1. Install dependencies**

```bash
npm install
```

**2. Start infrastructure**

```bash
docker compose up -d
```

Starts PostgreSQL 16 on port `5432` and Redis 7 on port `6379`.

**3. Configure environment**

```bash
cp .env.example .env
```

Edit `.env` — at minimum set `STELLAR_RPC_URL`, `STELLAR_HORIZON_URL`, `DATABASE_URL`, and `REDIS_URL`. See [Configuration](#configuration) for all variables.

**4. Run migrations**

```bash
npm run migrate
```

**5. Start the dev server**

```bash
npm run dev
```

The API is available at `http://localhost:4000`.

### Docker

Build and run as a container:

```bash
docker build -t dike-services .

docker run --rm -p 4000:4000 \
  -e NODE_ENV=production \
  -e STELLAR_NETWORK=testnet \
  -e STELLAR_RPC_URL=https://soroban-testnet.stellar.org \
  -e STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org \
  -e STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015" \
  -e DIKE_MANIFEST_PATH=./deployments/testnet.json \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  dike-services
```

The container runs migrations automatically on startup via `npm run start:prod`.

### Production build

```bash
npm run build
npm run start:prod   # runs migrate:prod then starts the compiled server
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP port |
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `STELLAR_NETWORK` | `testnet` | `mainnet`, `testnet`, or `local` |
| `STELLAR_RPC_URL` | — | Soroban RPC endpoint |
| `STELLAR_HORIZON_URL` | — | Horizon REST endpoint |
| `STELLAR_NETWORK_PASSPHRASE` | — | Must match `STELLAR_NETWORK` exactly |
| `DIKE_MANIFEST_PATH` | `./deployments/testnet.json` | Path to contract deployment manifest |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_URL` | — | Redis connection string |
| `INDEXER_START_LEDGER` | _(latest)_ | Ledger to begin indexing from on first run |
| `INDEXER_POLL_INTERVAL_MS` | `5000` | How often the indexer polls for new events |
| `INDEXER_LEDGER_WINDOW` | `250` | Max ledgers fetched per poll |
| `RECONCILIATION_INTERVAL_MS` | `60000` | How often reconciliation runs |
| `INDEXER_LAG_ALERT_THRESHOLD` | `50` | Ledger lag before flagging in metrics |

> [!IMPORTANT]
> The service refuses to start if `STELLAR_NETWORK_PASSPHRASE` does not match the expected passphrase for the configured `STELLAR_NETWORK`. Set `INDEXER_START_LEDGER` before the first run against an empty database — Stellar RPC only retains recent event history and cannot backfill from ledger 1.

## API

All amounts are serialized as strings to preserve precision.

### `GET /health`

Service liveness, PostgreSQL, Redis, and Stellar RPC connectivity, plus indexer lag per contract.

### `GET /metrics`

Internal counters: event processing failures, RPC errors, reconciliation mismatches, and indexer lag.

### `GET /markets`

List markets with cursor-based pagination.

| Query param | Description |
|---|---|
| `status` | Filter by market status |
| `creator` | Filter by creator address |
| `collateral` | Filter by collateral contract |
| `limit` | Page size |
| `cursor` | Last `market_id` from the previous page |

Returns market summaries with derived YES/NO prices and tradeability state.

### `GET /markets/:id`

Full market detail including pool data, fee config, vault snapshot, resolution request, council case, and recent trades.

### `GET /markets/:id/resolution`

Resolution state with derived next actions (propose, dispute, escalate, finalize, redeem) based on market status, expiry, and dispute windows.

### `GET /users/:address/portfolio`

User positions grouped by market, LP shares, vault state, redeemable positions, and encumbered balances.

### `GET /council/cases`

Council of Dike cases with commit/reveal/finalize windows. Filter by `status`.

### `GET /admin/governance`

Current governance config: treasury, timelock, supported collateral, approved creators, council members, module addresses, and fee config.

### `GET /admin/timelock`

Queued, executable, cancelled, and executed timelock actions.

## Testing

```bash
npm test             # run all tests once
npm run test:watch   # watch mode
```

Tests cover manifest loading, ScVal codecs, event routing, reducer behavior, derived state rules (prices, tradeability, resolution next actions), repository idempotency, and migration correctness.

## Project Structure

```
src/
  api/            # Fastify server and request validation
  config/         # Env loader, manifest loader, network constants
  contracts/      # Contract client, ScVal codecs, generated bindings
  db/             # PostgreSQL client, migrations runner, repositories
  domain/         # Derived state logic (prices, tradeability, next actions)
  indexer/        # Event source, dispatcher, worker
  jobs/           # Reconciliation service, scheduled job orchestration
  observability/  # Logger (pino), metrics store, health checks
migrations/       # SQL migration files
deployments/      # Network deployment manifests (testnet bundled)
scripts/          # Contract binding generation utilities
```

## GitHub Actions CI/CD To EC2

This repo includes [deploy-ec2.yml](/Users/sachplayz/Projects/Dike_Stellar/dike-services/.github/workflows/deploy-ec2.yml:1). On every push to `main`, GitHub Actions runs `npm ci`, `npm run build`, `npm test`, then SSHes into EC2 and runs [deploy-ec2.sh](/Users/sachplayz/Projects/Dike_Stellar/dike-services/scripts/deploy-ec2.sh:1).

On the EC2 instance, the repo should already be cloned at:

```bash
~/dike-services
```

The server must also have:

```bash
sudo dnf update -y
sudo dnf install -y git nginx docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
```

Keep the production `.env` on EC2 at:

```bash
~/dike-services/.env
```

Add these GitHub repository secrets:

```text
EC2_HOST=your-ec2-public-ip
EC2_USER=ec2-user
EC2_SSH_KEY=the-private-key-content-for-ssh
EC2_APP_DIR=/home/ec2-user/dike-services
```

`EC2_APP_DIR` is optional. If omitted, the workflow uses `/home/ec2-user/dike-services`.

If the GitHub repo is private, make sure the EC2 instance can run `git pull`. The easiest setup is to add an SSH deploy key to GitHub and clone the repo on EC2 using the SSH URL.
