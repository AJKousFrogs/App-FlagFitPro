-- Class 2 / I6 — phase 2: DROP the *_deprecated columns renamed (reversibly) in
-- phase1 (20260610201500) on 2026-06-10. Now past many clean releases (dropped
-- 2026-06-24). Pre-drop verification (live): NO code reads/writes them, and NO
-- view / function / RLS policy / index depends on either column.
--
-- Recoverability snapshot of the dead data being dropped:
--   athlete_training_config.preferred_training_days_deprecated (2 rows, both
--     [1,2,4,5,6]) — superseded by team_training_days + season_calendar.
--   training_sessions.verification_confidence_deprecated (16 rows, ALL = 0.5) —
--     a masquerading default, never a real signal.
ALTER TABLE public.athlete_training_config
  DROP COLUMN IF EXISTS preferred_training_days_deprecated;
ALTER TABLE public.training_sessions
  DROP COLUMN IF EXISTS verification_confidence_deprecated;
