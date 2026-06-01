-- Legacy schedule consolidation: the `fixtures` table (0 rows, no FK/view/fn deps) is
-- superseded by the competition spine (competition_events / v_athlete_schedule). The
-- /api/fixtures handler + its games.js route + the Angular legacy fallback are retired in
-- the same change; calc-readiness already dropped its fixtures fallback (spine-only).
DROP TABLE public.fixtures;
