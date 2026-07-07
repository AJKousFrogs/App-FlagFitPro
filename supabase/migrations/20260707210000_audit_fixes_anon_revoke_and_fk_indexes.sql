-- Schema audit fixes (advisor-driven, additive/safe).
--
-- (a) Revoke anon EXECUTE on SECURITY DEFINER RLS-helper functions. anon never
--     needs them — they key on auth.uid() (null for anon) — and the advisor flags
--     anon-executable security-definer functions. EXECUTE stays for authenticated
--     (RLS policies call them) + service_role.
-- (b) Add covering indexes for unindexed foreign keys (slow deletes/joins).
--
-- Reversal: DROP the indexes; the REVOKEs are re-granted by Supabase default
-- privileges on the next function replace (or GRANT ... TO anon).

-- (a) anon revokes ---------------------------------------------------------------
REVOKE ALL ON FUNCTION public.auth_user_team_ids() FROM public, anon;
REVOKE ALL ON FUNCTION public.can_view_player_performance(uuid, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.ff_can_access_channel(uuid, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.ff_can_manage_channel(uuid, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.ff_can_post_to_channel(uuid, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.ff_is_active_team_member(uuid, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.ff_is_team_staff(uuid, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.ff_share_active_team(uuid, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.has_role(text) FROM public, anon;
REVOKE ALL ON FUNCTION public.is_active_superadmin() FROM public, anon;

-- (b) covering indexes for unindexed FKs ----------------------------------------
CREATE INDEX IF NOT EXISTS idx_athlete_travel_log_team ON public.athlete_travel_log (team_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_baselines_source_panel ON public.bloodwork_baselines (source_panel_id);
CREATE INDEX IF NOT EXISTS idx_device_pairings_provider ON public.device_pairings (provider_id);
CREATE INDEX IF NOT EXISTS idx_device_pairings_team ON public.device_pairings (team_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_exercise ON public.execution_logs (exercise_id);
CREATE INDEX IF NOT EXISTS idx_external_load_metrics_training_session ON public.external_load_metrics (training_session_id);
CREATE INDEX IF NOT EXISTS idx_ff_exercise_mappings_exercisedb ON public.ff_exercise_mappings (exercisedb_exercise_id);
CREATE INDEX IF NOT EXISTS idx_flag_pull_stats_game_event ON public.flag_pull_stats (game_event_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_reports_team ON public.nutrition_reports (team_id);
CREATE INDEX IF NOT EXISTS idx_passing_stats_game_event ON public.passing_stats (game_event_id);
CREATE INDEX IF NOT EXISTS idx_physio_blocks_injury ON public.physio_blocks (injury_id);
CREATE INDEX IF NOT EXISTS idx_receiving_stats_game_event ON public.receiving_stats (game_event_id);
CREATE INDEX IF NOT EXISTS idx_session_load_training_session ON public.session_load (training_session_id);
