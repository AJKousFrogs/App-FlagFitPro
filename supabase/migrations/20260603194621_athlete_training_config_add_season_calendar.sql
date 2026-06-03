-- E2E audit P0: onboarding collects a season calendar and the periodization engine
-- reads season_calendar from GET /api/player-settings to set the macro phase — but
-- the column never existed (and saveSettings never persisted it), so macroPhaseFor
-- always ran on an empty calendar. Add the column so onboarding's calendar persists
-- and the engine can read it.
-- Applied via Supabase MCP (schema_migrations version 20260603194621); mirrored here.
ALTER TABLE public.athlete_training_config
  ADD COLUMN IF NOT EXISTS season_calendar jsonb NOT NULL DEFAULT '[]'::jsonb;
