-- Phase 2b: drop the legacy tournaments table (0 rows; no FK/view/fn deps after the Phase 2a
-- repoints). The schedule lives on the spine (competitions/competition_events); availability,
-- lineups and participation are all spine-keyed. In-app tournament management is rebuilt later
-- as a competition_events screen during the UI rebuild (user decision: retire tournaments.js).
DROP TABLE public.tournaments;
