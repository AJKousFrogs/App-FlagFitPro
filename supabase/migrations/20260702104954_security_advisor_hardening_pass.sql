-- Security-advisor hardening (2026-07-02 v2.0 clean-slate audit):
--
-- 1. increment_training_points was executable by anon AND authenticated via
--    /rest/v1/rpc — a SECURITY DEFINER write that grants arbitrary points to
--    any user id. Zero app-code callers, zero RLS-policy references (verified);
--    server-side callers use the service role, which bypasses grants. Revoke
--    client-role EXECUTE entirely.
-- 2. athlete_events_set_updated_at had a role-mutable search_path (the last
--    function flagged by the advisor) — pin it like every other function
--    (see 20260529101627's search_path pass).

REVOKE EXECUTE ON FUNCTION public.increment_training_points(uuid, integer) FROM anon, authenticated;
ALTER FUNCTION public.athlete_events_set_updated_at() SET search_path = pg_catalog, public;
