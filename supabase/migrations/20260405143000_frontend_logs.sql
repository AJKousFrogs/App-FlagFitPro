-- Frontend remote telemetry: browser logs correlated with Supabase requests via trace_id.
-- Authenticated users may INSERT their own rows only; no SELECT for end users.

CREATE TABLE IF NOT EXISTS public.frontend_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL,
  trace_id uuid,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  message text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_frontend_logs_trace_id ON public.frontend_logs (trace_id);
CREATE INDEX IF NOT EXISTS idx_frontend_logs_user_time ON public.frontend_logs (user_id, "timestamp" DESC);

ALTER TABLE public.frontend_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS frontend_logs_insert_own ON public.frontend_logs;
CREATE POLICY frontend_logs_insert_own
  ON public.frontend_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

COMMENT ON TABLE public.frontend_logs IS 'Client-side telemetry; insert-only for authenticated users (no client read).';
