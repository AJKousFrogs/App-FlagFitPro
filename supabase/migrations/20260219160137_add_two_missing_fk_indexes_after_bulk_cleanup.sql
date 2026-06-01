CREATE INDEX IF NOT EXISTS idx_coach_athlete_assignments_athlete_id_fk_cov2
ON public.coach_athlete_assignments(athlete_id);

CREATE INDEX IF NOT EXISTS idx_parent_guardian_links_parent_id_fk_cov2
ON public.parent_guardian_links(parent_id);
