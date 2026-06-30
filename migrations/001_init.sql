CREATE TABLE IF NOT EXISTS networks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rpc_url TEXT NOT NULL,
  network_passphrase TEXT NOT NULL,
  manifest_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_deployments (
  network TEXT NOT NULL,
  module TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  manifest_key TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, module)
);

CREATE TABLE IF NOT EXISTS indexer_checkpoints (
  network TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  last_processed_ledger BIGINT NOT NULL DEFAULT 0,
  last_processed_cursor TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, contract_id)
);

CREATE TABLE IF NOT EXISTS raw_contract_events (
  network TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  ledger BIGINT NOT NULL,
  tx_hash TEXT NOT NULL,
  event_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  topic_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  payload JSONB NOT NULL,
  raw_event JSONB NOT NULL,
  cursor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, event_id)
);

CREATE TABLE IF NOT EXISTS markets (
  network TEXT NOT NULL,
  market_id BIGINT NOT NULL,
  question TEXT,
  question_hash TEXT,
  rules_uri TEXT,
  rules_hash TEXT,
  creator TEXT,
  category TEXT,
  collateral TEXT,
  yes_token_id BIGINT,
  no_token_id BIGINT,
  expiry BIGINT,
  status TEXT,
  has_final_outcome BOOLEAN NOT NULL DEFAULT FALSE,
  final_outcome TEXT,
  pool_id BIGINT,
  bond_amount TEXT,
  dispute_window BIGINT,
  has_request BOOLEAN NOT NULL DEFAULT FALSE,
  request_id BIGINT,
  created_at_unix BIGINT,
  fee_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_reconciled_ledger BIGINT,
  reconciled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, market_id)
);

CREATE TABLE IF NOT EXISTS pools (
  network TEXT NOT NULL,
  pool_id BIGINT NOT NULL,
  market_id BIGINT NOT NULL,
  yes_reserve TEXT NOT NULL DEFAULT '0',
  no_reserve TEXT NOT NULL DEFAULT '0',
  total_lp_shares TEXT NOT NULL DEFAULT '0',
  accumulated_lp_fees TEXT NOT NULL DEFAULT '0',
  accumulated_protocol_fees TEXT NOT NULL DEFAULT '0',
  accumulated_cod_fees TEXT NOT NULL DEFAULT '0',
  live BOOLEAN NOT NULL DEFAULT FALSE,
  last_reconciled_ledger BIGINT,
  reconciled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, pool_id)
);

CREATE TABLE IF NOT EXISTS trades (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT,
  network TEXT NOT NULL,
  market_id BIGINT NOT NULL,
  pool_id BIGINT NOT NULL,
  trader TEXT NOT NULL,
  side TEXT NOT NULL,
  direction TEXT NOT NULL,
  amount_in TEXT NOT NULL,
  amount_out TEXT NOT NULL,
  fee TEXT NOT NULL,
  ledger BIGINT NOT NULL,
  tx_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS liquidity_events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT,
  network TEXT NOT NULL,
  market_id BIGINT NOT NULL,
  pool_id BIGINT NOT NULL,
  lp TEXT NOT NULL,
  kind TEXT NOT NULL,
  amount TEXT NOT NULL,
  shares TEXT NOT NULL,
  yes_out TEXT NOT NULL DEFAULT '0',
  no_out TEXT NOT NULL DEFAULT '0',
  ledger BIGINT NOT NULL,
  tx_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lp_positions (
  network TEXT NOT NULL,
  pool_id BIGINT NOT NULL,
  owner TEXT NOT NULL,
  shares TEXT NOT NULL DEFAULT '0',
  last_reconciled_ledger BIGINT,
  reconciled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, pool_id, owner)
);

CREATE TABLE IF NOT EXISTS user_positions (
  network TEXT NOT NULL,
  market_id BIGINT NOT NULL,
  owner TEXT NOT NULL,
  outcome TEXT NOT NULL,
  balance TEXT NOT NULL DEFAULT '0',
  last_reconciled_ledger BIGINT,
  reconciled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, market_id, owner, outcome)
);

CREATE TABLE IF NOT EXISTS vault_snapshots (
  network TEXT NOT NULL,
  market_id BIGINT NOT NULL,
  total_deposited TEXT NOT NULL DEFAULT '0',
  collateral_backing TEXT NOT NULL DEFAULT '0',
  amm_collateral TEXT NOT NULL DEFAULT '0',
  child_collateral_issued TEXT NOT NULL DEFAULT '0',
  child_collateral_repaid TEXT NOT NULL DEFAULT '0',
  child_collateral_defaulted TEXT NOT NULL DEFAULT '0',
  redeemed TEXT NOT NULL DEFAULT '0',
  protocol_fees TEXT NOT NULL DEFAULT '0',
  lp_fees TEXT NOT NULL DEFAULT '0',
  cod_fees TEXT NOT NULL DEFAULT '0',
  proposal_bonds TEXT NOT NULL DEFAULT '0',
  dispute_bonds TEXT NOT NULL DEFAULT '0',
  refundable TEXT NOT NULL DEFAULT '0',
  last_reconciled_ledger BIGINT,
  reconciled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, market_id)
);

CREATE TABLE IF NOT EXISTS user_vault_state (
  network TEXT NOT NULL,
  market_id BIGINT NOT NULL,
  owner TEXT NOT NULL,
  user_deposit TEXT NOT NULL DEFAULT '0',
  root_stake_yes TEXT NOT NULL DEFAULT '0',
  root_stake_no TEXT NOT NULL DEFAULT '0',
  child_used_total TEXT NOT NULL DEFAULT '0',
  child_used_yes TEXT NOT NULL DEFAULT '0',
  child_used_no TEXT NOT NULL DEFAULT '0',
  child_debt TEXT NOT NULL DEFAULT '0',
  parent_debt_yes TEXT NOT NULL DEFAULT '0',
  parent_debt_no TEXT NOT NULL DEFAULT '0',
  redeemed_yes TEXT NOT NULL DEFAULT '0',
  redeemed_no TEXT NOT NULL DEFAULT '0',
  redeemed_invalid TEXT NOT NULL DEFAULT '0',
  last_reconciled_ledger BIGINT,
  reconciled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, market_id, owner)
);

CREATE TABLE IF NOT EXISTS resolution_requests (
  network TEXT NOT NULL,
  request_id BIGINT NOT NULL,
  market_id BIGINT NOT NULL,
  status TEXT,
  requested_at BIGINT,
  bond_amount TEXT,
  dispute_window BIGINT,
  has_proposal BOOLEAN NOT NULL DEFAULT FALSE,
  proposer TEXT,
  proposed_outcome TEXT,
  proposal_evidence_uri TEXT,
  proposed_at BIGINT,
  has_dispute BOOLEAN NOT NULL DEFAULT FALSE,
  disputer TEXT,
  disputed_outcome TEXT,
  dispute_evidence_uri TEXT,
  disputed_at BIGINT,
  has_final_outcome BOOLEAN NOT NULL DEFAULT FALSE,
  final_outcome TEXT,
  last_reconciled_ledger BIGINT,
  reconciled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, request_id)
);

CREATE TABLE IF NOT EXISTS council_cases (
  network TEXT NOT NULL,
  case_id BIGINT NOT NULL,
  request_id BIGINT NOT NULL,
  market_id BIGINT NOT NULL,
  status TEXT,
  proposer TEXT,
  proposer_outcome TEXT,
  disputer TEXT,
  disputer_outcome TEXT,
  voting_start BIGINT,
  commit_end BIGINT,
  reveal_end BIGINT,
  has_final_outcome BOOLEAN NOT NULL DEFAULT FALSE,
  final_outcome TEXT,
  yes_votes INTEGER NOT NULL DEFAULT 0,
  no_votes INTEGER NOT NULL DEFAULT 0,
  invalid_votes INTEGER NOT NULL DEFAULT 0,
  total_valid_votes INTEGER NOT NULL DEFAULT 0,
  last_reconciled_ledger BIGINT,
  reconciled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, case_id)
);

CREATE TABLE IF NOT EXISTS council_votes (
  network TEXT NOT NULL,
  case_id BIGINT NOT NULL,
  voter TEXT NOT NULL,
  has_commit BOOLEAN NOT NULL DEFAULT FALSE,
  has_reveal BOOLEAN NOT NULL DEFAULT FALSE,
  revealed_outcome TEXT,
  claimed_reward BOOLEAN NOT NULL DEFAULT FALSE,
  correct BOOLEAN,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, case_id, voter)
);

CREATE TABLE IF NOT EXISTS governance_config (
  network TEXT PRIMARY KEY,
  treasury TEXT,
  timelock TEXT,
  fee_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  pause_authority TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS governance_lists (
  network TEXT NOT NULL,
  kind TEXT NOT NULL,
  address TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, kind, address)
);

CREATE TABLE IF NOT EXISTS governance_modules (
  network TEXT NOT NULL,
  role TEXT NOT NULL,
  module_address TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, role)
);

CREATE TABLE IF NOT EXISTS timelock_actions (
  network TEXT NOT NULL,
  action_id BIGINT NOT NULL,
  kind TEXT,
  target TEXT,
  payload_hash TEXT,
  execute_after BIGINT,
  expires_at BIGINT,
  executed BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled BOOLEAN NOT NULL DEFAULT FALSE,
  last_reconciled_ledger BIGINT,
  reconciled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (network, action_id)
);

CREATE TABLE IF NOT EXISTS reconciliation_mismatches (
  id BIGSERIAL PRIMARY KEY,
  network TEXT NOT NULL,
  module TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  message TEXT NOT NULL,
  seen_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS reconciliation_mismatches_identity_idx
  ON reconciliation_mismatches (network, module, entity_id, message);

CREATE INDEX IF NOT EXISTS raw_contract_events_contract_ledger_idx
  ON raw_contract_events (network, contract_id, ledger);

CREATE UNIQUE INDEX IF NOT EXISTS trades_event_identity_idx
  ON trades (network, event_id)
  WHERE event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS liquidity_events_event_identity_idx
  ON liquidity_events (network, event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS markets_status_idx
  ON markets (network, status, market_id DESC);

CREATE INDEX IF NOT EXISTS resolution_requests_market_idx
  ON resolution_requests (network, market_id);

CREATE INDEX IF NOT EXISTS council_cases_request_idx
  ON council_cases (network, request_id);
