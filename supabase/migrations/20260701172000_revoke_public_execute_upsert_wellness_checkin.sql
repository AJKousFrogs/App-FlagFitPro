-- upsert_wellness_checkin is SECURITY DEFINER and was anon-executable via a
-- default PUBLIC grant (created 2026-03-28, before this project's
-- REVOKE-FROM-PUBLIC-at-creation convention) -- outside the documented ~10-fn
-- RLS-helper allowlist. It already self-guards (raises unless auth.role() IN
-- ('authenticated','service_role') and auth.uid()=p_user_id), so this was not
-- exploitable, but per the project's own rule any non-RLS-helper definer fn
-- should be REVOKE FROM PUBLIC, GRANT only to the roles that actually call it.
REVOKE EXECUTE ON FUNCTION public.upsert_wellness_checkin(
  uuid, date, integer, numeric, integer, integer, integer, text[], text, numeric, integer, integer, integer, integer
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_wellness_checkin(
  uuid, date, integer, numeric, integer, integer, integer, text[], text, numeric, integer, integer, integer, integer
) TO authenticated, service_role;
