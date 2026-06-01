-- event_availability carried a second identical UNIQUE constraint
-- (player_tournament_availability_player_id_tournament_id_key) from its pre-Phase-2a
-- rename. Drop the legacy-named one; keep the canonical event_availability_user_event_key
-- on (user_id, competition_event_id), so onConflict targets still resolve.
alter table public.event_availability
  drop constraint player_tournament_availability_player_id_tournament_id_key;
