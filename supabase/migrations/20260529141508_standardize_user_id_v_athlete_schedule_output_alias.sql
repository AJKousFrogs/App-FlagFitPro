-- Final identity step: the schedule spine view output column was aliased athlete_id
-- (sourced from tm.user_id). Rename the output to user_id for full convention consistency.
-- CREATE OR REPLACE can't rename a view column → DROP + CREATE (security_invoker, re-GRANT).
DROP VIEW IF EXISTS public.v_athlete_schedule;
CREATE VIEW public.v_athlete_schedule
WITH (security_invoker = true) AS
SELECT ce.id,
    ce.competition_id, ce.team_id, ce.starts_at, ce.ends_at, ce.expected_game_count,
    ce.importance, ce.label, ce.location, ce.venue, ce.notes, ce.status, ce.external_id,
    ce.metadata, ce.created_at, ce.updated_at,
    c.name AS competition_name, c.short_name AS competition_short_name,
    c.kind AS competition_kind, c.level AS competition_level, c.country AS competition_country,
    c.season_year AS competition_season_year,
    t.name AS team_name,
    tm.user_id
   FROM public.competition_events ce
     JOIN public.competitions c ON c.id = ce.competition_id
     JOIN public.teams t ON t.id = ce.team_id
     JOIN public.team_members tm ON tm.team_id = ce.team_id AND tm.status::text = 'active'::text;

GRANT SELECT ON public.v_athlete_schedule TO anon, authenticated, service_role;
