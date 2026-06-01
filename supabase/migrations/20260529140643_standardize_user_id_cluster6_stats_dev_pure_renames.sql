-- Cluster 6: stats/metrics + development tables → user_id. Pure renames — no code or
-- function references the columns (RLS/views/FK/indexes auto-update). coach_id (author)
-- stays role-qualified on the development tables.
ALTER TABLE public.player_game_summary       RENAME COLUMN player_id TO user_id;
ALTER TABLE public.situational_stats          RENAME COLUMN player_id TO user_id;
ALTER TABLE public.position_specific_metrics  RENAME COLUMN player_id TO user_id;
ALTER TABLE public.metric_entries             RENAME COLUMN player_id TO user_id;
ALTER TABLE public.player_development_goals    RENAME COLUMN player_id TO user_id;  -- keep coach_id
ALTER TABLE public.player_development_notes    RENAME COLUMN player_id TO user_id;  -- keep coach_id
ALTER TABLE public.player_skill_assessments    RENAME COLUMN player_id TO user_id;  -- keep coach_id
ALTER TABLE public.program_assignments         RENAME COLUMN player_id TO user_id;
