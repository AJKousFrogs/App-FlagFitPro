-- Playing-surface awareness (2026-07-18). Optional per-event attribute:
-- 'grass' (natural) | 'turf' (artificial) | NULL (unknown → no advisory, the
-- safe/honest default). Drives a condition-aware game-day advisory: turf +
-- an active foot/ankle/Achilles/patellar restriction + a multi-game day →
-- extend the warm-up, monitor between games (Gould 2022: overall injury rate
-- similar grass vs turf, but foot/ankle load runs higher on artificial turf).
-- Additive/display-only — it changes NO training dose. Mirrors `venue`
-- everywhere venue already flows (schedule.js, athlete/competition event
-- write paths, v_athlete_schedule).

ALTER TABLE competition_events
  ADD COLUMN IF NOT EXISTS surface text
  CHECK (surface IN ('grass', 'turf'));

ALTER TABLE athlete_events
  ADD COLUMN IF NOT EXISTS surface text
  CHECK (surface IN ('grass', 'turf'));

COMMENT ON COLUMN competition_events.surface IS
  'Playing surface: grass | turf | NULL (unknown). Drives the condition-aware game-day surface advisory. Additive/display-only.';
COMMENT ON COLUMN athlete_events.surface IS
  'Playing surface: grass | turf | NULL (unknown). Drives the condition-aware game-day surface advisory. Additive/display-only.';

-- Expose surface on the athlete schedule view (append-only; all existing
-- columns preserved in order so dependents are unaffected).
CREATE OR REPLACE VIEW v_athlete_schedule AS
 SELECT ce.id,
    ce.competition_id,
    ce.team_id,
    ce.starts_at,
    ce.ends_at,
    ce.expected_game_count,
    ce.importance,
    ce.label,
    ce.location,
    ce.venue,
    ce.notes,
    ce.status,
    ce.external_id,
    ce.metadata,
    ce.created_at,
    ce.updated_at,
    c.name AS competition_name,
    c.short_name AS competition_short_name,
    c.kind AS competition_kind,
    c.level AS competition_level,
    c.country AS competition_country,
    c.season_year AS competition_season_year,
    t.name AS team_name,
    tm.user_id,
    ce.hotel_name,
    ce.hotel_address,
    ce.surface
   FROM competition_events ce
     JOIN competitions c ON c.id = ce.competition_id
     JOIN teams t ON t.id = ce.team_id
     JOIN team_members tm ON tm.team_id = ce.team_id AND tm.status::text = 'active'::text;
