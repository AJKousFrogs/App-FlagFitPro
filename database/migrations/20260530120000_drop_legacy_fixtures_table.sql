-- Legacy schedule consolidation: drop the `fixtures` table (0 rows; no FK/view/fn deps).
-- Superseded by the competition spine (competition_events / v_athlete_schedule). Applied
-- via Supabase MCP 2026-05-30. The /api/fixtures handler + games.js route + Angular legacy
-- fallback are retired in the same commit.
DROP TABLE public.fixtures;
