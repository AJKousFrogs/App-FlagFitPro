-- The 7-day "glimpse" trial (per product decision 2026-07-23) needs an anchor
-- distinct from users.created_at: 12 of the 13 real users already using this
-- pilot signed up more than 7 days ago (oldest: 137 days) -- computing the
-- trial window from created_at would instantly lock out almost every
-- existing user the moment this ships. trial_started_at is a separate
-- column so existing users get a fresh 7-day window from deployment,
-- while every new signup gets their own real signup moment (DEFAULT now()
-- at INSERT time). now() is stable within a transaction, so this ALTER
-- backfills every existing row to the SAME timestamp (this migration's
-- execution time) -- all current pilot users get a synchronized fresh
-- trial-start, not one computed per-row from history.
--
-- Reversal: ALTER TABLE public.users DROP COLUMN IF EXISTS trial_started_at;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.users.trial_started_at IS
  'Anchor for the 7-day onboarding trial (utils/entitlements.js) -- distinct from created_at so a schema change never retroactively expires an existing user''s trial.';
