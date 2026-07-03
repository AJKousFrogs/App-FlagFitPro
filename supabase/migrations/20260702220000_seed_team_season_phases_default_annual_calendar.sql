-- Seeds team_season_phases with a realistic default annual calendar for any
-- team that doesn't yet have one configured. team_season_phases is the
-- server-side DB-authority calendar (netlify/functions/daily-protocol.js
-- reads it ahead of the client's calendar-derived seasonPhase and the
-- month-switch fallback) -- coach-managed, RLS-writable only by
-- coach/head_coach/assistant_coach team members.
--
-- Maps the app's 7 named annual stages onto the richer phase_key taxonomy
-- (tsp_phase_key_check), using finer granularity than the athlete-level
-- 5-value SeasonPhase where the extra resolution earns its keep (pre-season
-- and the long winter off-season each get progressive sub-phases instead of
-- one flat block):
--   1. Pre-season          -> pre_season_early, pre_season_late
--   2. Mid-season #1       -> in_season_maintenance (spring block)
--   3. First off-season break -> mid_season_reload (mid-year gap between
--      the two competitive blocks -- this phase_key exists for exactly
--      this concept)
--   4. Mid-season #2       -> in_season_maintenance (late-summer block)
--   5. Peak season         -> peak
--   6. Recovery season     -> active_recovery
--   7. Winter off-season   -> off_season_rest, foundation,
--      strength_accumulation, power_development (progressive GPP->SPP
--      build back toward next year's pre-season)
--
-- Uses concrete 2026-2027 dates (this table has no recurring "MM-DD" concept
-- like athlete_training_config.season_calendar -- it's real start_date/
-- end_date rows). Coaches must renew/extend the calendar for subsequent
-- years; this seed only covers one full cycle from today's context forward.
--
-- Idempotent per team: only seeds teams with zero currently-active phase
-- rows, so it never touches a team a coach has already configured, and is
-- safe to re-run (a team seeded once is skipped on subsequent applies).

INSERT INTO public.team_season_phases (team_id, phase_key, phase_label, start_date, end_date)
SELECT t.id, v.phase_key, v.phase_label, v.start_date::date, v.end_date::date
FROM public.teams t
CROSS JOIN (VALUES
  ('pre_season_early',      'Pre-season -- technical & aerobic base',        '2026-02-15', '2026-03-07'),
  ('pre_season_late',       'Pre-season -- intensification',                 '2026-03-08', '2026-03-31'),
  ('in_season_maintenance', 'Mid-season #1 (spring)',                        '2026-04-01', '2026-06-15'),
  ('mid_season_reload',     'First off-season break -- mid-year reload',     '2026-06-16', '2026-07-31'),
  ('in_season_maintenance', 'Mid-season #2 (late summer)',                   '2026-08-01', '2026-10-15'),
  ('peak',                  'Peak season -- playoffs',                       '2026-10-16', '2026-11-15'),
  ('active_recovery',       'Recovery season -- active regeneration',        '2026-11-16', '2026-12-15'),
  ('off_season_rest',       'Winter off-season -- full deload',              '2026-12-16', '2026-12-31'),
  ('foundation',            'Winter off-season -- foundation (GPP)',         '2027-01-01', '2027-01-18'),
  ('strength_accumulation', 'Winter off-season -- strength accumulation',    '2027-01-19', '2027-02-01'),
  ('power_development',     'Winter off-season -- power development',       '2027-02-02', '2027-02-14')
) AS v(phase_key, phase_label, start_date, end_date)
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_season_phases tsp
  WHERE tsp.team_id = t.id AND tsp.is_active = true
);
