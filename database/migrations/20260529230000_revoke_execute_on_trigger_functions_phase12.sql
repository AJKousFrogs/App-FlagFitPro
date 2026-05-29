-- Backend cleanup — Phase 12 (security): revoke RPC EXECUTE on trigger functions.
--
-- Security-advisor finding: 32 PL/pgSQL trigger functions (RETURNS trigger) in `public`
-- granted EXECUTE to anon/authenticated, exposing them as PostgREST /rpc/ endpoints. Trigger
-- functions are invoked by the trigger system under the table's privileges — never via RPC —
-- so this is pure attack surface (several are SECURITY DEFINER). Revoking EXECUTE does NOT
-- affect trigger firing. This clears the trigger-function subset of the
-- anon/authenticated_security_definer_function_executable advisor findings (32 → 0 exposed).
--
-- NOT addressed here (deliberate follow-up): the non-trigger SECURITY DEFINER RPCs that code
-- legitimately calls need per-function judgment (which truly need anon vs authenticated-only),
-- and the auth "leaked password protection" toggle (Supabase dashboard / management API).
--
-- Applied via Supabase MCP on 2026-05-29 (project grfjmnjpzvknmsxrwesx).
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
