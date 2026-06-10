-- ============================================================================
-- CLASS 2 / I6 — deprecate dead & legacy fields that LOOK authoritative.
-- AUTHORED FOR REVIEW — NOT EXECUTED. (Filename prefixed REVIEW_ so the CLI
-- migration runner ignores it until renamed to a normal timestamp.) Per the
-- audit, each column below has ZERO engine readers; they are renamed (not
-- dropped) with a _deprecated suffix so the change is reversible and nothing is
-- destroyed. The PAIRED CODE CHANGE (stop writing/echoing them in
-- player-settings.js) must land in the SAME commit when this is approved (I6:
-- excluded from all reads/writes in the same commit).
--
-- Confirmed-dead (audit citations in FlagFit-Coach-Guide-Internal-Appendix /
-- the Class 2 field map):
--   athlete_training_config.preferred_training_days  — 0 readers; team_training_days is the real one
--   athlete_training_config.daily_routine            — write-only, no reader
--   athlete_training_config.current_limitations      — no reader (would matter for exclusion, but unreachable)
--   athlete_training_config.flag_practice_schedule   — half-migrated; deprecated in comments, team_activities is authority
--   training_sessions.verification_confidence        — 0 readers
--
-- NOT touched here (need a product decision, not just cleanup):
--   max_sessions_per_week (default 5 looks chosen — may be intended-future)
--   motivation vs motivation_level (pick the survivor first)
--   secondary_position (duplicated to users — collapse with the position work)
-- ============================================================================

-- BEGIN;  -- uncomment to run as a transaction once approved

ALTER TABLE public.athlete_training_config
  RENAME COLUMN preferred_training_days TO preferred_training_days_deprecated;
ALTER TABLE public.athlete_training_config
  RENAME COLUMN daily_routine TO daily_routine_deprecated;
ALTER TABLE public.athlete_training_config
  RENAME COLUMN current_limitations TO current_limitations_deprecated;
ALTER TABLE public.athlete_training_config
  RENAME COLUMN flag_practice_schedule TO flag_practice_schedule_deprecated;

ALTER TABLE public.training_sessions
  RENAME COLUMN verification_confidence TO verification_confidence_deprecated;

-- Drop the now-meaningless NOT NULL defaults so the deprecated columns can't keep
-- masquerading as set values (they are write-frozen by the paired code change).
ALTER TABLE public.athlete_training_config
  ALTER COLUMN preferred_training_days_deprecated DROP DEFAULT;
ALTER TABLE public.athlete_training_config
  ALTER COLUMN daily_routine_deprecated DROP DEFAULT;

-- COMMIT;

-- A follow-up migration may DROP the *_deprecated columns after one release with
-- no errors referencing them.
