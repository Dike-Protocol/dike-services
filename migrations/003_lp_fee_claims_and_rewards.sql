ALTER TABLE pools
  ADD COLUMN IF NOT EXISTS fee_per_share_scaled TEXT DEFAULT '0';

ALTER TABLE lp_positions
  ADD COLUMN IF NOT EXISTS fee_checkpoint TEXT DEFAULT '0',
  ADD COLUMN IF NOT EXISTS claimable_fees TEXT DEFAULT '0',
  ADD COLUMN IF NOT EXISTS fees_claimed TEXT DEFAULT '0';

ALTER TABLE council_cases
  ADD COLUMN IF NOT EXISTS reward_pool TEXT DEFAULT '0';

ALTER TABLE council_votes
  ADD COLUMN IF NOT EXISTS reward_amount TEXT DEFAULT '0';

ALTER TABLE timelock_actions
  ADD COLUMN IF NOT EXISTS payload_json JSONB DEFAULT '{}'::jsonb;
