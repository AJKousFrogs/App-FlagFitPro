
-- Add missing columns to training_sessions (for log status tracking and coach session creation)
ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS log_status VARCHAR(20) DEFAULT 'on_time'
    CHECK (log_status IN ('on_time', 'late', 'retroactive'));

ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS requires_coach_approval BOOLEAN DEFAULT false;

ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS hours_delayed INTEGER;

ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS conflicts JSONB DEFAULT '[]';

ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS location TEXT;

CREATE INDEX IF NOT EXISTS idx_training_sessions_log_status
  ON public.training_sessions(log_status, created_at DESC);

-- Create acwr_reports table for persisting ACWR dashboard reports
CREATE TABLE IF NOT EXISTS public.acwr_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL DEFAULT '{}',
  acwr_value NUMERIC(5,2),
  risk_zone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acwr_reports_user_id
  ON public.acwr_reports(user_id, created_at DESC);

ALTER TABLE public.acwr_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ACWR reports"
  ON public.acwr_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ACWR reports"
  ON public.acwr_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
