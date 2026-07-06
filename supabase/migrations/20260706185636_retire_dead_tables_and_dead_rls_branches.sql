-- Cleanup 2026-07-06: retire dead schema surface.
-- Evidence (verified in-session): every dropped table had 0 rows, zero references in
-- app code (netlify/functions, angular/src, scripts, supabase/functions, tests),
-- zero references in any view definition or function body. DDL snapshot for the 10
-- tables lacking a local CREATE TABLE migration: backups/20260706_dropped_dead_tables_ddl.json
--
-- CORRECTION (same day): event_games + athlete_travel_log were dropped here on
-- main-only evidence, but the unmerged Tournament Mode v2.x branch
-- (claude/codebase-audit-v2-proposal-d81ayk) uses both — restored verbatim in
-- 20260706190823_restore_v2_4_tables_event_games_athlete_travel_log.sql.
-- Net retired: 19 tables.

-- 1) Remove the dead coach_athlete_assignments OR-branch from 3 policies on live tables.
-- Behavior-neutral: coach_athlete_assignments had 0 rows and nothing anywhere inserts into it,
-- so the branch could never grant access. Real staff access uses team_members (getCoachTeamId path).
drop policy "merged_select_execution_logs_public" on public.execution_logs;
create policy "merged_select_execution_logs_public" on public.execution_logs
  for select using (user_id = (select auth.uid()));

drop policy "merged_select_readiness_scores_public" on public.readiness_scores;
create policy "merged_select_readiness_scores_public" on public.readiness_scores
  for select using (
    (user_id = (select auth.uid()))
    or exists (
      select 1 from public.team_members tm
      where tm.user_id = (select auth.uid())
        and tm.status::text = 'active'
        and tm.role::text = any (array['physiotherapist','medical_staff','admin','owner'])
    )
  );

drop policy "merged_select_session_version_history_public" on public.session_version_history;
create policy "merged_select_session_version_history_public" on public.session_version_history
  for select using (
    exists (
      select 1 from public.training_sessions
      where training_sessions.id = session_version_history.session_id
        and training_sessions.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.team_members tm
      where tm.user_id = (select auth.uid())
        and tm.status::text = 'active'
        and tm.role::text = any (array['physiotherapist','medical_staff','admin','owner'])
    )
  );

-- 2) Drop the dead event_participation.game_id column (FK into event_games).
-- (Restored by 20260706190823 together with event_games.)
alter table public.event_participation drop column game_id;

-- 3) Drop the dead tables in one statement (intra-set FKs resolve without CASCADE).
drop table
  public.video_assignments,
  public.video_bookmarks,
  public.video_curation_status,
  public.video_watch_history,
  public.video_playlists,
  public.event_games,
  public.athlete_travel_log,
  public.weekly_training_analysis,
  public.player_game_summary,
  public.coach_film_sessions,
  public.coach_film_tags,
  public.coach_playbook_plays,
  public.player_development_goals,
  public.player_development_notes,
  public.player_skill_assessments,
  public.ai_feedback,
  public.ai_review_queue,
  public.consent_change_log,
  public.event_lineups,
  public.team_preferences,
  public.coach_athlete_assignments;
