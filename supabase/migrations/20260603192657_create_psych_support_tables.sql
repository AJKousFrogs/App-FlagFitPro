-- Real-data QA: the psych lane's getMentalPerformanceLogs does `if (error) throw`,
-- and generateMentalWellnessReport inserts mental_wellness_reports — both tables
-- were never migrated, so the psych athlete-detail GET 500'd. (Unlike the physio
-- readers which tolerate missing tables via `data ?? []`.) Create them to complete
-- the clinical data layer. Health data → RLS on, athlete self-read; staff access
-- is via the service role inside the functions.
-- Applied via Supabase MCP (schema_migrations version 20260603192657); mirrored here.

CREATE TABLE IF NOT EXISTS public.mental_performance_logs (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date                  date NOT NULL DEFAULT CURRENT_DATE,
  confidence_level          integer,
  focus_level               integer,
  motivation_level          integer,
  anxiety_level             integer,
  pre_game_nerves           integer,
  visualization_completed   boolean,
  mental_rehearsal_minutes  integer,
  decision_making_clarity   integer,
  reaction_time_feeling     integer,
  life_stress_level         integer,
  mental_readiness_score    integer,
  context                   text,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mental_perf_logs_user
  ON public.mental_performance_logs (user_id, log_date DESC);
ALTER TABLE public.mental_performance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY mental_perf_logs_own_read ON public.mental_performance_logs
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.mental_wellness_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type   text NOT NULL DEFAULT 'wellness',
  report_data   jsonb NOT NULL DEFAULT '{}',
  generated_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mental_wellness_reports_user
  ON public.mental_wellness_reports (user_id, generated_at DESC);
ALTER TABLE public.mental_wellness_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY mental_wellness_reports_own_read ON public.mental_wellness_reports
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
