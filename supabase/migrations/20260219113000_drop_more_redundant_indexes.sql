-- Additional conservative index cleanup:
-- Drop single-column indexes that are covered by existing multi-column indexes
-- with the same leading key on the same table.

DROP INDEX IF EXISTS public.idx_session_version_history_session_version_history_session_id_;
DROP INDEX IF EXISTS public.idx_team_members_team_id;
DROP INDEX IF EXISTS public.idx_team_members_user_id;
DROP INDEX IF EXISTS public.idx_notifications_user_id;
DROP INDEX IF EXISTS public.idx_training_sessions_training_sessions_athlete_id_fk_auto;
DROP INDEX IF EXISTS public.idx_training_sessions_training_sessions_modified_by_coach_id_fk;
DROP INDEX IF EXISTS public.idx_training_sessions_training_sessions_team_id_fk_auto;
DROP INDEX IF EXISTS public.idx_team_invitations_team_id;
