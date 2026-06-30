ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS event_id TEXT;

ALTER TABLE liquidity_events
  ADD COLUMN IF NOT EXISTS event_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS trades_event_identity_idx
  ON trades (network, event_id)
  WHERE event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS liquidity_events_event_identity_idx
  ON liquidity_events (network, event_id)
  WHERE event_id IS NOT NULL;
