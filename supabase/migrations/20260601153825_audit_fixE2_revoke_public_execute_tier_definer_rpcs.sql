-- Fix E (corrected): the prior REVOKE FROM anon was a no-op because EXECUTE is granted to
-- PUBLIC (anon inherits it). Properly restrict: REVOKE FROM PUBLIC + anon, then GRANT back to
-- the right tier. Service-role-only set = cron/admin/internal fns that must never be client-
-- callable (account-deletion processing, cleanup, profile-sync, debug). Everything else in the
-- classified set → authenticated + service_role (the logged-in client + the Netlify API).
-- Untouched: fns referenced by RLS policies/views (kept PUBLIC so anon RLS eval cleanly denies).
DO $$
DECLARE
  r record;
  service_only text[] := ARRAY[
    'process_hard_deletion','get_deletions_ready_for_processing',
    'cleanup_expired_emergency_records','ensure_public_user_profile',
    'sync_public_user_from_auth_row','debug_count_public_user_refs'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.prokind = 'f'
      AND p.prorettype <> 'trigger'::regtype
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND NOT EXISTS (SELECT 1 FROM pg_policies pol WHERE pol.schemaname = 'public'
            AND ((pol.qual ~ ('\m' || p.proname || '\M'))
                 OR (coalesce(pol.with_check, '') ~ ('\m' || p.proname || '\M'))))
      AND NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace vn ON vn.oid = c.relnamespace
            WHERE vn.nspname = 'public' AND c.relkind = 'v'
            AND pg_get_viewdef(c.oid) ~ ('\m' || p.proname || '\M'))
  LOOP
    EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || r.sig || ' FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || r.sig || ' FROM anon';
    IF r.proname = ANY(service_only) THEN
      EXECUTE 'GRANT EXECUTE ON FUNCTION ' || r.sig || ' TO service_role';
    ELSE
      EXECUTE 'GRANT EXECUTE ON FUNCTION ' || r.sig || ' TO authenticated, service_role';
    END IF;
  END LOOP;
END $$;
