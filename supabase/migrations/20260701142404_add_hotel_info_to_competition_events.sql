ALTER TABLE public.competition_events
  ADD COLUMN IF NOT EXISTS hotel_name text,
  ADD COLUMN IF NOT EXISTS hotel_address text;

COMMENT ON COLUMN public.competition_events.hotel_name IS
  'Team lodging for this event (away tournaments). Player-visible.';
COMMENT ON COLUMN public.competition_events.hotel_address IS
  'Free-text address for hotel_name. Rendered client-side as a Google Maps search link — no geocoding.';

CREATE OR REPLACE VIEW public.v_athlete_schedule
WITH (security_invoker = true) AS
SELECT ce.id,
    ce.competition_id, ce.team_id, ce.starts_at, ce.ends_at, ce.expected_game_count,
    ce.importance, ce.label, ce.location, ce.venue, ce.notes, ce.status, ce.external_id,
    ce.metadata, ce.created_at, ce.updated_at,
    c.name AS competition_name, c.short_name AS competition_short_name,
    c.kind AS competition_kind, c.level AS competition_level, c.country AS competition_country,
    c.season_year AS competition_season_year,
    t.name AS team_name,
    tm.user_id,
    ce.hotel_name, ce.hotel_address
   FROM public.competition_events ce
     JOIN public.competitions c ON c.id = ce.competition_id
     JOIN public.teams t ON t.id = ce.team_id
     JOIN public.team_members tm ON tm.team_id = ce.team_id AND tm.status::text = 'active'::text;

GRANT SELECT ON public.v_athlete_schedule TO anon, authenticated, service_role;
