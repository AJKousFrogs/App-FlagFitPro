-- Fix C: covering indexes for the only two unindexed FKs (advisor: unindexed_foreign_keys).
CREATE INDEX IF NOT EXISTS idx_competitions_created_by ON public.competitions(created_by);
CREATE INDEX IF NOT EXISTS idx_competition_events_created_by ON public.competition_events(created_by);
