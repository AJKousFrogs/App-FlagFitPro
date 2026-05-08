-- =============================================================================
-- SAMPLE SEED: 2026 Spring Schedule (Aljosa / Ljubljana Frogs)
-- =============================================================================
--
-- This file is **NOT a deployed migration**. It is a sample seed for dev /
-- staging that loads one athlete's real 2026 spring schedule into the
-- competition_schedule_spine.
--
-- Usage:
--   1. Replace :primary_team_id with your team's UUID (see queries below).
--   2. Run via psql against your dev / staging Supabase, e.g.
--        psql "$SUPABASE_DB_URL" \
--          -v primary_team_id="'00000000-0000-0000-0000-000000000000'" \
--          -f database/seeds/sample_2026_spring_schedule.sql
--   3. To preview team UUIDs first:
--        SELECT id, name FROM public.teams ORDER BY name;
--
-- All competitions are created with source='manual'. Federation imports should
-- use source='federation_import' and an external_id.
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Competitions (shared registry)
-- ---------------------------------------------------------------------------
INSERT INTO public.competitions
  (name, short_name, kind, level, country, governing_body, format, season_year, source)
VALUES
  ('Slovenian Flag Football Cup 2026',     'SVN Cup 2026',   'cup',        'national',      'SI', 'SFFA',                                '5v5', 2026, 'manual'),
  ('Slovenian Flag Football League 2026',  'SVN League',     'league',     'national',      'SI', 'SFFA',                                '5v5', 2026, 'manual'),
  ('Austrian Flag Football League 2026',   'AT League',      'league',     'national',      'AT', 'AFBOe',                               '5v5', 2026, 'manual'),
  ('Copenhagen Bowl 2026',                 'CPH Bowl 2026',  'tournament', 'international', 'DK', 'IFAF Europe',                         '5v5', 2026, 'manual'),
  ('Big Bowl 2026',                        'Big Bowl 2026',  'tournament', 'international', 'AT', 'IFAF Europe',                         '5v5', 2026, 'manual')
ON CONFLICT (name, season_year) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Resolve competition IDs into a temp lookup
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _comp_ids AS
SELECT id, name
FROM public.competitions
WHERE name IN (
  'Slovenian Flag Football Cup 2026',
  'Slovenian Flag Football League 2026',
  'Austrian Flag Football League 2026',
  'Copenhagen Bowl 2026',
  'Big Bowl 2026'
);

-- ---------------------------------------------------------------------------
-- 3. Competition events (per-team calendar slots)
-- All times are stored as UTC; 08:00Z ≈ 10:00 CEST kickoff.
-- expected_game_count is the total games the team plays during the event.
-- importance: regular | high | peak (peaks become taper anchors).
-- ---------------------------------------------------------------------------
INSERT INTO public.competition_events
  (competition_id, team_id, starts_at, ends_at, expected_game_count, importance, label, location, venue, status)
VALUES
  -- 9.5  — Slovenian Cup, 4 games
  ((SELECT id FROM _comp_ids WHERE name = 'Slovenian Flag Football Cup 2026'),
   :primary_team_id,
   '2026-05-09 08:00:00+00', '2026-05-09 17:00:00+00', 4, 'high',
   'Slovenian Cup — Cup Day', 'Slovenia', NULL, 'scheduled'),

  -- 10.5 — Austrian league, 3 games
  ((SELECT id FROM _comp_ids WHERE name = 'Austrian Flag Football League 2026'),
   :primary_team_id,
   '2026-05-10 08:00:00+00', '2026-05-10 15:00:00+00', 3, 'regular',
   'AT League — Round 1', 'Austria', NULL, 'scheduled'),

  -- 17.5 — Slovenian league, 3 games
  ((SELECT id FROM _comp_ids WHERE name = 'Slovenian Flag Football League 2026'),
   :primary_team_id,
   '2026-05-17 08:00:00+00', '2026-05-17 15:00:00+00', 3, 'regular',
   'SVN League — Round 1', 'Slovenia', NULL, 'scheduled'),

  -- 23-24.5 — Copenhagen Bowl, 8 games over 2 days
  ((SELECT id FROM _comp_ids WHERE name = 'Copenhagen Bowl 2026'),
   :primary_team_id,
   '2026-05-23 07:00:00+00', '2026-05-24 18:00:00+00', 8, 'peak',
   'Copenhagen Bowl — Tournament', 'Copenhagen, Denmark', NULL, 'scheduled'),

  -- 30.5 — Austrian league, 3 games
  ((SELECT id FROM _comp_ids WHERE name = 'Austrian Flag Football League 2026'),
   :primary_team_id,
   '2026-05-30 08:00:00+00', '2026-05-30 15:00:00+00', 3, 'regular',
   'AT League — Round 2', 'Austria', NULL, 'scheduled'),

  -- 6-7.6 — Big Bowl, 8 games over 2 days
  ((SELECT id FROM _comp_ids WHERE name = 'Big Bowl 2026'),
   :primary_team_id,
   '2026-06-06 07:00:00+00', '2026-06-07 18:00:00+00', 8, 'peak',
   'Big Bowl — Tournament', 'Austria', NULL, 'scheduled'),

  -- 13.6 — Slovenian league, 3 games
  ((SELECT id FROM _comp_ids WHERE name = 'Slovenian Flag Football League 2026'),
   :primary_team_id,
   '2026-06-13 08:00:00+00', '2026-06-13 15:00:00+00', 3, 'regular',
   'SVN League — Round 2', 'Slovenia', NULL, 'scheduled'),

  -- 14.6 — Austrian league, 2 games
  ((SELECT id FROM _comp_ids WHERE name = 'Austrian Flag Football League 2026'),
   :primary_team_id,
   '2026-06-14 08:00:00+00', '2026-06-14 13:00:00+00', 2, 'regular',
   'AT League — Round 3', 'Austria', NULL, 'scheduled'),

  -- 21.6 — Austrian Finals, 2 games (peak)
  ((SELECT id FROM _comp_ids WHERE name = 'Austrian Flag Football League 2026'),
   :primary_team_id,
   '2026-06-21 08:00:00+00', '2026-06-21 13:00:00+00', 2, 'peak',
   'AT League — Finals', 'Austria', NULL, 'scheduled');

DROP TABLE _comp_ids;

COMMIT;

-- ---------------------------------------------------------------------------
-- Sanity check (run separately):
--   SELECT starts_at::date AS day,
--          competition_short_name,
--          expected_game_count,
--          importance,
--          label
--   FROM public.v_athlete_schedule
--   WHERE athlete_id = '<your-user-uuid>'
--     AND starts_at BETWEEN '2026-05-01' AND '2026-07-01'
--   ORDER BY starts_at;
--
-- Expected: 9 events, 36 total games, 3 peaks (CPH Bowl, Big Bowl, AT Finals).
-- ---------------------------------------------------------------------------
