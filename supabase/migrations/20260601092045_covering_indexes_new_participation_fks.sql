-- Covering indexes for the FKs on the new participation tables (perf advisor:
-- unindexed_foreign_keys). Cheap + clearly correct; the broader policy/initplan/security
-- advisor pass is handled separately.
CREATE INDEX IF NOT EXISTS idx_event_availability_event ON public.event_availability(competition_event_id);
CREATE INDEX IF NOT EXISTS idx_event_participation_team ON public.event_participation(team_id);
CREATE INDEX IF NOT EXISTS idx_event_participation_session ON public.event_participation(training_session_id);
