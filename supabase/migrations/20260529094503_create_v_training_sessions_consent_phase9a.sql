-- Phase 9a (additive, reversible): consent view over training_sessions, mirroring the
-- audited v_workout_logs_consent gating. Coaches see performance columns ONLY with
-- can_view_player_performance consent; athlete sees own data. Nothing reads it yet —
-- created first so the gating can be verified before any repoint/drop.
create or replace view public.v_training_sessions_consent with (security_invoker = true) as
select
  id, user_id, athlete_id, team_id,
  session_date, session_type, drill_type, status, session_state, title, location,
  case when can_view_player_performance((select auth.uid()), user_id) then completed_at else null end as completed_at,
  case when can_view_player_performance((select auth.uid()), user_id) then rpe else null end as rpe,
  case when can_view_player_performance((select auth.uid()), user_id) then duration_minutes else null end as duration_minutes,
  case when can_view_player_performance((select auth.uid()), user_id) then intensity_level else null end as intensity_level,
  case when can_view_player_performance((select auth.uid()), user_id) then workload else null end as workload,
  case when can_view_player_performance((select auth.uid()), user_id) then performance_score else null end as performance_score,
  case when can_view_player_performance((select auth.uid()), user_id) then completion_rate else null end as completion_rate,
  case when can_view_player_performance((select auth.uid()), user_id) then notes else null end as notes,
  created_at, updated_at,
  not can_view_player_performance((select auth.uid()), user_id) as consent_blocked,
  case
    when user_id = (select auth.uid()) then 'own_data'
    when can_view_player_performance((select auth.uid()), user_id) then 'team_consent'
    else 'no_consent'
  end as access_reason
from public.training_sessions;
