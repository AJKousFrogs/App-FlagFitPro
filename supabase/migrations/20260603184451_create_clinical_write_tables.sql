-- Real-data QA finding: the clinical staff WRITE flows (physio log-injury / RTP
-- update, psych log-assessment — all shipped this session) target tables that were
-- never migrated, so every write 500s. The READ handlers tolerate missing tables
-- (data ?? []), so only the two core write tables are needed. Health data →
-- RLS on, athlete self-read; staff write/read happens via the service role
-- (supabaseAdmin) inside the functions, which bypasses RLS.
-- Applied via Supabase MCP (schema_migrations version 20260603184451); mirrored here.

CREATE TABLE IF NOT EXISTS public.athlete_injuries (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  injury_type           text,
  injury_location       text,
  injury_grade          text,
  injury_date           date,
  injury_mechanism      text,
  activity_at_injury    text,
  diagnosis             text,
  recovery_status       text NOT NULL DEFAULT 'active',
  current_phase         text DEFAULT 'Phase 1',
  rtp_progress          integer DEFAULT 0,
  expected_return_date  date,
  activity_restrictions text[] DEFAULT '{}',
  medical_notes         text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_athlete_injuries_user
  ON public.athlete_injuries (user_id, recovery_status);
ALTER TABLE public.athlete_injuries ENABLE ROW LEVEL SECURITY;
CREATE POLICY athlete_injuries_own_read ON public.athlete_injuries
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.psychological_assessments (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id                      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assessment_type               text,
  questions                     jsonb,
  responses                     jsonb,
  score                         integer,
  interpretation                text,
  recommendations               jsonb,
  requires_professional_review  boolean NOT NULL DEFAULT false,
  completed_at                  timestamptz,
  created_at                    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_psych_assessments_user
  ON public.psychological_assessments (user_id, created_at DESC);
ALTER TABLE public.psychological_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY psych_assessments_own_read ON public.psychological_assessments
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
