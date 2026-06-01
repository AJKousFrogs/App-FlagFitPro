-- Cluster 7 (final identity cluster): attendance/payments/coach/game tables → user_id.
-- Pure renames (RLS/views/FK/indexes/constraint NAMES auto-update; FK constraint names are
-- unchanged by a column rename, so PostgREST hints like team_members!player_payments_player_id_fkey
-- still resolve). coach_id (actor/author) stays role-qualified.
ALTER TABLE public.game_participations            RENAME COLUMN player_id TO user_id;
ALTER TABLE public.player_tournament_availability  RENAME COLUMN player_id TO user_id;
ALTER TABLE public.attendance_records              RENAME COLUMN player_id TO user_id;
ALTER TABLE public.player_payments                 RENAME COLUMN player_id TO user_id;
ALTER TABLE public.coach_activity_log              RENAME COLUMN player_id TO user_id;  -- keep coach_id
ALTER TABLE public.coach_alert_acknowledgments     RENAME COLUMN player_id TO user_id;  -- keep coach_id
ALTER TABLE public.coach_inbox_items               RENAME COLUMN player_id TO user_id;  -- keep coach_id
ALTER TABLE public.template_assignments            RENAME COLUMN player_id TO user_id;
