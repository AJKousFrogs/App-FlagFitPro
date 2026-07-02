-- upsert_wellness_checkin is SECURITY DEFINER and was anon-executable, outside
-- the documented ~10-fn RLS-helper allowlist. It self-guards (raises unless
-- auth.role() IN ('authenticated','service_role') and auth.uid()=p_user_id),
-- so this was not exploitable, but per the project's own rule any new/existing
-- non-RLS-helper definer fn should be REVOKE FROM PUBLIC/anon, GRANT to the
-- roles that actually need it.
REVOKE EXECUTE ON FUNCTION public.upsert_wellness_checkin(
  uuid, date, integer, numeric, integer, integer, integer, text[], text, numeric, integer, integer, integer, integer
) FROM anon;
