-- Restore script for the 4 test competition_events removed 2026-07-19.
--
-- WHY THEY WERE REMOVED: created 2026-07-10 by aljkous@gmail.com through the
-- coach event form while the events feature was being built. The owner did not
-- recognise "Elite Bowl 2026" and directed: "Never use test or mock data, only
-- the real data." All four carried ZERO attached activity (no event_games, no
-- event_availability, no event_participation).
--
-- WHY IT MATTERED (not just tidiness): `Elite Bowl` was importance='peak' with
-- 4 games, and was the athlete's `nextEvent`. Peak events drive the deepest
-- taper + post-event recovery in the periodization engine, so from late August
-- it would have shaped real training prescriptions toward a competition that
-- does not exist.
--
-- RUN THIS ONLY IF one of these turns out to be a genuine fixture. The parent
-- `competitions` rows are recreated first because the events reference them.
-- IDs are preserved so anything that referenced them still lines up.

BEGIN;

INSERT INTO competitions (id, name, kind, level, season_year, created_by)
VALUES
  ('33309072-9712-4b8f-98c1-34b7f49b3a5b', 'Elite Bowl 2026',        'tournament', 'international', 2026, '5459dbf2-9a0e-4874-ab43-d99380a7276e'),
  ('f205db7a-dde0-47dd-98b6-4bf11ebf508e', 'Autumn Flag League 2026','league',     'national',      2026, '5459dbf2-9a0e-4874-ab43-d99380a7276e')
ON CONFLICT (id) DO NOTHING;

INSERT INTO competition_events
  (id, competition_id, team_id, starts_at, ends_at, expected_game_count,
   importance, label, location, venue, surface, notes, status, created_by)
VALUES
  ('c0eef9c4-3088-4312-b411-8505f0ecdf68', '33309072-9712-4b8f-98c1-34b7f49b3a5b', '9af52bda-f98f-4765-b0ec-b5cf43275c11',
   '2026-09-06T08:00:00+00:00', '2026-09-06T18:00:00+00:00', 4, 'peak', 'Elite Bowl', 'Vienna, AT', NULL, NULL, NULL, 'scheduled', '5459dbf2-9a0e-4874-ab43-d99380a7276e'),
  ('b4616abc-a85f-4173-b7e6-abd502a385bc', 'f205db7a-dde0-47dd-98b6-4bf11ebf508e', '9af52bda-f98f-4765-b0ec-b5cf43275c11',
   '2026-10-03T08:00:00+00:00', '2026-10-03T15:00:00+00:00', 3, 'high', 'Gameday 1', 'Ljubljana', NULL, 'turf', NULL, 'scheduled', '5459dbf2-9a0e-4874-ab43-d99380a7276e'),
  ('76bff5f7-9ca0-46b3-95a5-4a21181d7547', 'f205db7a-dde0-47dd-98b6-4bf11ebf508e', '9af52bda-f98f-4765-b0ec-b5cf43275c11',
   '2026-10-17T08:00:00+00:00', '2026-10-17T15:00:00+00:00', 3, 'high', 'Gameday 2', 'Zagreb, HR', NULL, NULL, NULL, 'scheduled', '5459dbf2-9a0e-4874-ab43-d99380a7276e'),
  ('7732fdba-30ce-4dbd-99b0-70ab8e906a77', 'f205db7a-dde0-47dd-98b6-4bf11ebf508e', '9af52bda-f98f-4765-b0ec-b5cf43275c11',
   '2026-10-31T08:00:00+00:00', '2026-10-31T15:00:00+00:00', 3, 'high', 'Gameday 3', 'Ljubljana', NULL, 'turf', NULL, 'scheduled', '5459dbf2-9a0e-4874-ab43-d99380a7276e')
ON CONFLICT (id) DO NOTHING;

COMMIT;
