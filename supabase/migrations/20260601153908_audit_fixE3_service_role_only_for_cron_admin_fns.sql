-- Fix E (tier hardening): the cron/admin/internal definer fns had a pre-existing direct
-- authenticated grant (so REVOKE FROM PUBLIC alone left them authenticated-callable). Revoke
-- authenticated too → service_role only. A logged-in user must not be able to run account-
-- deletion processing, emergency-record cleanup, profile-sync, or the debug counter.
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
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f' AND p.proname = ANY(service_only)
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  LOOP
    EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || r.sig || ' FROM authenticated';
  END LOOP;
END $$;
-- verify
select has_function_privilege('authenticated','public.process_hard_deletion(uuid)','EXECUTE') as authed_hard_delete,
       has_function_privilege('service_role','public.process_hard_deletion(uuid)','EXECUTE') as service_hard_delete;
