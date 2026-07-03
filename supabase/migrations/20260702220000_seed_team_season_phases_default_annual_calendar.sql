-- Seeds team_season_phases with the club's real annual calendar for any team
-- that doesn't yet have one configured. team_season_phases is the
-- server-side DB-authority calendar (netlify/functions/daily-protocol.js
-- reads it ahead of the client's calendar-derived seasonPhase and the
-- month-switch fallback) -- coach-managed, RLS-writable only by
-- coach/head_coach/assistant_coach team members.
--
-- Confirmed real dates (2026-07-03), replacing the earlier proposed-default
-- version of this migration:
--   1. Pre-season              Mar 1 - Mar 31
--   2. Mid-season #1           Apr 1 - Jul 7
--   3. First off-season break  Jul 8 - Aug 14
--   4. Mid-season #2           Aug 15 - Sep 30
--   5. Peak season             Oct 1 - Oct 31 (whole October)
--   6. Recovery season         Nov 1 - Nov 30
--   7. Winter off-season       Dec 1 - Feb 28/29 (Dec, Jan, Feb)
--
-- Maps onto the richer phase_key taxonomy (tsp_phase_key_check) where the
-- extra resolution earns its keep -- pre-season splits into early/late, and
-- the 3-month winter off-season progresses off_season_rest -> foundation ->
-- strength_accumulation -> power_development instead of one flat block:
--   3. First off-season break -> mid_season_reload (this phase_key exists
--      for exactly this concept: a mid-year gap between two competitive
--      blocks in the same year, distinct from a full winter rebuild)
--
-- Uses concrete 2026-2027 dates (this table has no recurring "MM-DD" concept
-- like athlete_training_config.season_calendar -- it's real start_date/
-- end_date rows). Coaches must renew/extend the calendar for subsequent
-- years; this seed only covers one full cycle.
--
-- Idempotent per team: only seeds teams with zero currently-active phase
-- rows, so it never touches a team a coach has already configured, and is
-- safe to re-run (a team seeded once is skipped on subsequent applies).

INSERT INTO public.team_season_phases (team_id, phase_key, phase_label, start_date, end_date)
SELECT t.id, v.phase_key, v.phase_label, v.start_date::date, v.end_date::date
FROM public.teams t
CROSS JOIN (VALUES
  ('pre_season_early',      'Pre-season -- technical & aerobic base',        '2026-03-01', '2026-03-15'),
  ('pre_season_late',       'Pre-season -- intensification',                 '2026-03-16', '2026-03-31'),
  ('in_season_maintenance', 'Mid-season #1',                                 '2026-04-01', '2026-07-07'),
  ('mid_season_reload',     'First off-season break -- mid-year reload',     '2026-07-08', '2026-08-14'),
  ('in_season_maintenance', 'Mid-season #2',                                 '2026-08-15', '2026-09-30'),
  ('peak',                  'Peak season -- October',                       '2026-10-01', '2026-10-31'),
  ('active_recovery',       'Recovery season -- November',                  '2026-11-01', '2026-11-30'),
  ('off_season_rest',       'Winter off-season -- full deload',              '2026-12-01', '2026-12-14'),
  ('foundation',            'Winter off-season -- foundation (GPP)',         '2026-12-15', '2027-01-04'),
  ('strength_accumulation', 'Winter off-season -- strength accumulation',    '2027-01-05', '2027-01-25'),
  ('power_development',     'Winter off-season -- power development',       '2027-01-26', '2027-02-28')
) AS v(phase_key, phase_label, start_date, end_date)
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_season_phases tsp
  WHERE tsp.team_id = t.id AND tsp.is_active = true
);
