-- Security advisor finding (caught immediately after applying the V2.0/V2.4
-- migrations, via Supabase MCP get_advisors): event_games_sync_team_id()
-- and athlete_travel_log_sync_team_id() are SECURITY DEFINER trigger
-- functions but were left EXECUTE-able by anon/authenticated directly via
-- PostgREST RPC (/rest/v1/rpc/<fn>) — they only need to run as the trigger
-- mechanism invokes them, never as a direct user-callable RPC. Same fix
-- pattern SOURCE_OF_TRUTH.md's auth-hardening runbook already documents for
-- this exact class of finding: "any NEW definer fn that isn't an RLS helper
-- -> REVOKE FROM PUBLIC; GRANT service_role". Triggers keep firing — this
-- only blocks direct RPC invocation.
REVOKE EXECUTE ON FUNCTION public.event_games_sync_team_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.athlete_travel_log_sync_team_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.event_games_sync_team_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.athlete_travel_log_sync_team_id() TO service_role;
