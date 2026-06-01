BEGIN;

DROP POLICY IF EXISTS "Append-only merlin violations" ON public.merlin_violation_log;
DROP POLICY IF EXISTS "Service role can log merlin violations" ON public.merlin_violation_log;

CREATE POLICY "Merlin/service can log violations"
ON public.merlin_violation_log
FOR INSERT
TO public
WITH CHECK (
  auth.role() = 'service_role' OR auth.role() = 'merlin_readonly'
);

REVOKE INSERT ON TABLE public.merlin_violation_log FROM authenticated;
REVOKE INSERT ON TABLE public.merlin_violation_log FROM anon;
GRANT INSERT ON TABLE public.merlin_violation_log TO merlin_readonly;

COMMIT;
