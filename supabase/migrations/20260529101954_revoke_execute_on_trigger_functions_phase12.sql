-- Backend cleanup Phase 12 (security): revoke RPC EXECUTE on trigger functions.
-- Trigger functions (RETURNS trigger) are invoked by the trigger system under the table's
-- privileges — never legitimately via PostgREST /rpc/. Granting anon/authenticated EXECUTE
-- exposes them as callable RPCs (a SECURITY DEFINER attack surface) with zero benefit.
-- Revoking EXECUTE does NOT affect trigger firing. Addresses the bulk of the security
-- advisor's "Public/Signed-In Can Execute SECURITY DEFINER Function" findings.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prorettype = 'pg_catalog.trigger'::regtype
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, public', r.sig);
  END LOOP;
END $$;
