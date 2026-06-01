BEGIN;

DROP POLICY IF EXISTS "Merlin/service can log violations" ON public.merlin_violation_log;

CREATE POLICY "Merlin/service can log violations"
ON public.merlin_violation_log
FOR INSERT
TO public
WITH CHECK (
  (SELECT auth.role()) = 'service_role' OR (SELECT auth.role()) = 'merlin_readonly'
);

COMMIT;
