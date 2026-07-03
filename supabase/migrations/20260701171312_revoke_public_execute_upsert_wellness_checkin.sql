-- The prior anon-only REVOKE was a no-op: this function still carried the
-- default PUBLIC EXECUTE grant (created 2026-03-28, before this project's
-- REVOKE-FROM-PUBLIC-at-creation convention), and anon inherits via PUBLIC
-- regardless of a role-specific revoke. Revoke from PUBLIC and re-grant only
-- to the roles that actually call it (authenticated client, service-role API).
REVOKE EXECUTE ON FUNCTION public.upsert_wellness_checkin(
  uuid, date, integer, numeric, integer, integer, integer, text[], text, numeric, integer, integer, integer, integer
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_wellness_checkin(
  uuid, date, integer, numeric, integer, integer, integer, text[], text, numeric, integer, integer, integer, integer
) TO authenticated, service_role;
