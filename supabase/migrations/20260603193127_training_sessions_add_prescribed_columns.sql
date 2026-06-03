-- Real-data QA: the BEFORE UPDATE trigger create_session_version() references
-- OLD/NEW.prescribed_duration and prescribed_intensity, but those columns were
-- never added to training_sessions — so EVERY update to a training_session errored
-- ("record old has no field prescribed_duration"), breaking session completion,
-- coach edits, and workload backfill. Add the two missing columns the
-- versioning feature expects (nullable); the trigger then versions only on real
-- structure/prescription changes, as designed.
-- Applied via Supabase MCP (schema_migrations version 20260603193127); mirrored here.
ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS prescribed_duration  integer,
  ADD COLUMN IF NOT EXISTS prescribed_intensity integer;
