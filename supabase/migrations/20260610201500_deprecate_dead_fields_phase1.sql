-- Class 2 / I6 — deprecate confirmed-legacy/dead fields. APPLIED live via Supabase
-- MCP 2026-06-10 (version 20260610201500). Scoped to TWO columns; the
-- built-but-unwired daily_routine / current_limitations / flag_practice_schedule
-- and the product-decision max_sessions_per_week are DEFERRED (a round-trip test
-- + validation infra showed they are intended features, not dead). Renamed (not
-- dropped) → reversible. Paired code change: player-settings.js stopped writing
-- preferred_training_days in the same commit. Verified before applying: no code
-- reads these columns, no view/function/RPC references them.

-- preferred_training_days: was NOT NULL with a default — now write-frozen, so the
-- default + NOT NULL are dropped or new inserts (which omit it) would fail.
ALTER TABLE public.athlete_training_config
  RENAME COLUMN preferred_training_days TO preferred_training_days_deprecated;
ALTER TABLE public.athlete_training_config
  ALTER COLUMN preferred_training_days_deprecated DROP DEFAULT;
ALTER TABLE public.athlete_training_config
  ALTER COLUMN preferred_training_days_deprecated DROP NOT NULL;

-- verification_confidence: already nullable; drop the masquerading 0.5 default.
ALTER TABLE public.training_sessions
  RENAME COLUMN verification_confidence TO verification_confidence_deprecated;
ALTER TABLE public.training_sessions
  ALTER COLUMN verification_confidence_deprecated DROP DEFAULT;

-- A follow-up migration may DROP the *_deprecated columns after one clean release.
