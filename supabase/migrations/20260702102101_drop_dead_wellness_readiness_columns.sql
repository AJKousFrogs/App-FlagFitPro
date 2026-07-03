-- Dead-schema cleanup (2026-07-02 v2.0 clean-slate audit):
--
-- 1. daily_wellness_checkin.motivation — legacy duplicate of motivation_level,
--    kept mirrored by the trigger below (20260421115713). Zero code references
--    (netlify/functions + angular/src use only motivation_level); live check
--    confirmed 0 rows where the two columns diverge. Drop trigger + function +
--    column together.
-- 2. readiness_scores.wellness_score — written by a pre-rewrite calc-readiness
--    version; nothing reads or writes it today (verified: no function, view, or
--    app code references it). 6 legacy rows carried orphaned values; dropped with
--    the column.
-- 3. readiness_scores.notes — never written by anything; all NULL live.

DROP TRIGGER IF EXISTS trigger_sync_daily_wellness_motivation ON public.daily_wellness_checkin;
DROP FUNCTION IF EXISTS public.sync_daily_wellness_motivation();
ALTER TABLE public.daily_wellness_checkin DROP COLUMN IF EXISTS motivation;
ALTER TABLE public.readiness_scores DROP COLUMN IF EXISTS wellness_score;
ALTER TABLE public.readiness_scores DROP COLUMN IF EXISTS notes;
