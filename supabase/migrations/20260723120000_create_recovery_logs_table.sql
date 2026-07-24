-- Recovery Modality Effectiveness Logging
-- recovery-effectiveness.js (GET/POST /api/recovery-effectiveness) has queried
-- and inserted into public.recovery_logs since it was written, but no migration
-- ever created that table -- every call has 500'd since the endpoint shipped.
-- Found auditing the Alert Engine's athlete_recovery_logs (which duplicated this
-- same concept with a different, FK-broken design -- see the note in
-- 20260721120000_phase_2a_acwr_calculator_tables.sql). This is the real,
-- already-integrated table: free-text modality_name (the 13 evidence-graded
-- modalities from the Phase 1 research are athlete-facing labels, not FK'd to
-- a catalog table), matching exactly what recovery-effectiveness.js reads/writes.
--
-- Distinct from recovery_sessions/recovery_protocols (physio-prescribed
-- structured protocol assignments, a different existing feature).

CREATE TABLE IF NOT EXISTS public.recovery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  modality_name text NOT NULL,
  effectiveness_score numeric(3, 1) NOT NULL CHECK (effectiveness_score >= 0 AND effectiveness_score <= 10),
  domain text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recovery_logs_athlete_created
  ON public.recovery_logs(athlete_id, created_at DESC);

ALTER TABLE public.recovery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recovery_logs_athlete_read_write" ON public.recovery_logs
  FOR ALL
  USING (auth.uid() = athlete_id)
  WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "recovery_logs_staff_read" ON public.recovery_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      INNER JOIN public.team_members athlete_tm
        ON tm.team_id = athlete_tm.team_id
      WHERE tm.user_id = auth.uid()
        AND athlete_tm.user_id = recovery_logs.athlete_id
        AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'assistant_coach', 'physiotherapist')
        AND tm.status = 'active'
        AND athlete_tm.status = 'active'
    )
  );
