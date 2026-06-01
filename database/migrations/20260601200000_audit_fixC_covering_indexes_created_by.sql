-- Audit fix C: covering indexes for the 2 unindexed FKs. Applied via Supabase MCP 2026-06-01.
CREATE INDEX IF NOT EXISTS idx_competitions_created_by ON public.competitions(created_by);
CREATE INDEX IF NOT EXISTS idx_competition_events_created_by ON public.competition_events(created_by);
