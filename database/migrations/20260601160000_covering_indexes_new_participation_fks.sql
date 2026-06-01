-- Covering indexes for the new participation tables' FKs (perf advisor: unindexed_foreign_keys).
-- Applied via Supabase MCP 2026-06-01.
CREATE INDEX IF NOT EXISTS idx_event_availability_event ON public.event_availability(competition_event_id);
CREATE INDEX IF NOT EXISTS idx_event_participation_team ON public.event_participation(team_id);
CREATE INDEX IF NOT EXISTS idx_event_participation_session ON public.event_participation(training_session_id);
