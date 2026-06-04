-- The /api/calibration-logs feature (recommendation + outcome logging for readiness-model
-- calibration) was wired to a table that never existed, so the endpoint failed. Create it
-- from the columns the handler reads/writes so the endpoint works.
-- Applied via Supabase MCP (schema_migrations version 20260604142907); mirrored here.
CREATE TABLE IF NOT EXISTS public.calibration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  recommendation_type text,
  readiness_score numeric,
  acwr numeric,
  rationale text,
  preset_id text,
  preset_version text,
  phase text,
  days_until_event integer,
  event_importance text,
  injury_flagged boolean NOT NULL DEFAULT false,
  injury_date date,
  injury_type text,
  performance_rating numeric,
  session_quality numeric,
  subjective_feedback text,
  outcome_recorded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calibration_logs_athlete_timestamp
  ON public.calibration_logs (athlete_id, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_calibration_logs_user_id
  ON public.calibration_logs (user_id);

ALTER TABLE public.calibration_logs ENABLE ROW LEVEL SECURITY;

-- Owner (the athlete, or the staff user who logged it) can access their rows directly.
-- Cross-athlete staff access is enforced in the handler (verifyAthleteAccess) via the
-- service role, which bypasses RLS. (select auth.uid()) is the initplan-optimized form.
CREATE POLICY calibration_logs_own_access ON public.calibration_logs
  FOR ALL TO authenticated
  USING ((select auth.uid()) = athlete_id OR (select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = athlete_id OR (select auth.uid()) = user_id);
