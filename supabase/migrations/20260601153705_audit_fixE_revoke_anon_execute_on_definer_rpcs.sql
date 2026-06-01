-- Fix E: revoke EXECUTE FROM anon on SECURITY DEFINER application RPCs (security advisor:
-- anon_security_definer_function_executable). Targets only functions NOT referenced by any RLS
-- policy or view (those stay anon-executable so RLS/security_invoker-view evaluation as the anon
-- role still cleanly denies rather than erroring). authenticated + service_role EXECUTE kept:
-- the Netlify API calls these via service-role, the logged-in client as authenticated. Anon
-- (unauthenticated) can no longer invoke action/read RPCs directly. Idempotent.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.prokind = 'f'
      AND p.prorettype <> 'trigger'::regtype
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND NOT EXISTS (
        SELECT 1 FROM pg_policies pol WHERE pol.schemaname = 'public'
        AND ((pol.qual ~ ('\m' || p.proname || '\M'))
             OR (coalesce(pol.with_check, '') ~ ('\m' || p.proname || '\M'))))
      AND NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace vn ON vn.oid = c.relnamespace
        WHERE vn.nspname = 'public' AND c.relkind = 'v'
        AND pg_get_viewdef(c.oid) ~ ('\m' || p.proname || '\M'))
  LOOP
    EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || r.sig || ' FROM anon';
  END LOOP;
END $$;
