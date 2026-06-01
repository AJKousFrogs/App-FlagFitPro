-- Consolidation Phase 2b: retire the legacy tournaments cluster. Applied via Supabase MCP
-- 2026-06-01. tournaments (0 rows) had no FK/view/fn deps after the Phase 2a repoints.
-- DROP TABLE tournaments. The CRUD handler tournaments.js + its /api/tournaments route/test
-- were retired (user decision); the schedule is canonical on the spine
-- (competitions/competition_events), with availability/lineups/participation spine-keyed.
-- In-app tournament management is rebuilt later as a competition_events screen (UI rebuild).
DROP TABLE public.tournaments;
