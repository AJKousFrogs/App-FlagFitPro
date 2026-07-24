-- Harden the 6 Alert Engine functions added by
-- 20260721130000_phase_3_alerts_and_automation.sql, per the Supabase security
-- advisor run immediately after that migration was applied:
--
-- 1. Function Search Path Mutable: none of the 6 pinned search_path, so a
--    malicious schema earlier in a caller's search_path could shadow
--    unqualified references (alert_rules, team_members, athlete_injuries,
--    generated_alerts, rtp_phase_progress) inside these SECURITY DEFINER
--    functions. Pin to `public` (not empty -- the function bodies use
--    unqualified names throughout, so an empty search_path would break them).
-- 2. Public/Signed-In Users Can Execute SECURITY DEFINER Function: this
--    Supabase project's default privileges grant EXECUTE on every new
--    function to anon and authenticated (in addition to the PUBLIC default),
--    so any authenticated (or even anon) user could call e.g.
--    generate_acwr_alert(...) directly via a Supabase RPC call and forge an
--    alert for an arbitrary user_id -- these are meant to be called only
--    internally, from the trigger_* functions in the same migration. Revoke
--    from PUBLIC, anon, and authenticated; nothing legitimate calls these by
--    name from the API. service_role keeps EXECUTE (trusted backend-only).

ALTER FUNCTION public.generate_acwr_alert(UUID, NUMERIC, NUMERIC, VARCHAR, UUID, NUMERIC, NUMERIC, NUMERIC)
  SET search_path = public;
ALTER FUNCTION public.generate_phase_advancement_alert(UUID, UUID, INT, INT)
  SET search_path = public;
ALTER FUNCTION public.generate_psych_readiness_alert(UUID, UUID, INT, INT)
  SET search_path = public;
ALTER FUNCTION public.trigger_acwr_alert()
  SET search_path = public;
ALTER FUNCTION public.trigger_phase_advancement_alert()
  SET search_path = public;
ALTER FUNCTION public.trigger_psych_readiness_alert()
  SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.generate_acwr_alert(UUID, NUMERIC, NUMERIC, VARCHAR, UUID, NUMERIC, NUMERIC, NUMERIC)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_phase_advancement_alert(UUID, UUID, INT, INT)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_psych_readiness_alert(UUID, UUID, INT, INT)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_acwr_alert()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_phase_advancement_alert()
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_psych_readiness_alert()
  FROM PUBLIC, anon, authenticated;
