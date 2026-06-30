# Dike Services

Backend/indexing service for Dike Protocol on Stellar testnet.

## What Is Included

- Fastify API server
- Stellar RPC event polling and checkpointing
- Postgres-backed query state
- Redis connection for future queue/background coordination
- Testnet deployment manifest bundled in-repo at [deployments/testnet.json](/Users/sachplayz/Projects/Dike_Stellar/dike-services/deployments/testnet.json:1)

## Local Run

1. Create `.env` from [.env.example](/Users/sachplayz/Projects/Dike_Stellar/dike-services/.env.example:1)
2. Fill in `DATABASE_URL` and `REDIS_URL`
3. Run:

```bash
npm install
npm run migrate
npm run dev
```

## Required Environment

```env
NODE_ENV=development
PORT=4000

STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

DIKE_MANIFEST_PATH=./deployments/testnet.json

DATABASE_URL=postgresql://...
REDIS_URL=redis://...
INDEXER_START_LEDGER=...
```

`DIKE_CONTRACTS_ROOT` is optional and only useful if you want to regenerate bindings from a separate contracts checkout.

Set `INDEXER_START_LEDGER` before the first run against an empty database. Stellar RPC only retains recent `getEvents` history, so the service refuses to guess a ledger-1 backfill that cannot be replayed reliably.

## Docker

Build:

```bash
docker build -t dike-services .
```

Run:

```bash
docker run --rm -p 4000:4000 \
  -e NODE_ENV=production \
  -e PORT=4000 \
  -e STELLAR_NETWORK=testnet \
  -e STELLAR_RPC_URL=https://soroban-testnet.stellar.org \
  -e STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org \
  -e STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015" \
  -e DIKE_MANIFEST_PATH=./deployments/testnet.json \
  -e INDEXER_START_LEDGER=... \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  dike-services
```

The container runs migrations on startup via `npm run start:prod`.

## Cloud Notes

- The repo is now self-contained for testnet runtime deployment.
- No sibling repo path is required to load the testnet manifest.
- Generated contract bindings already live in [src/contracts/generated](/Users/sachplayz/Projects/Dike_Stellar/dike-services/src/contracts/generated:1).
- If credentials were shared in chat, rotate them before production.
