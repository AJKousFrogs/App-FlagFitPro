BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'merlin_readonly') THEN
    CREATE ROLE merlin_readonly;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.merlin_violation_log (
  violation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_type TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_body TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.merlin_violation_log ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON TABLE public.merlin_violation_log TO merlin_readonly;

DROP POLICY IF EXISTS "Append-only merlin violations" ON public.merlin_violation_log;
CREATE POLICY "Append-only merlin violations"
ON public.merlin_violation_log
FOR INSERT
TO merlin_readonly
WITH CHECK (true);

COMMIT;
