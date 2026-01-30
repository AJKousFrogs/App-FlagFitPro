-- Add JSONB field for optional session metrics (sprints/cuts/throws/jumps)
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS session_metrics JSONB;

COMMENT ON COLUMN training_sessions.session_metrics IS
  'Optional session metrics (sprint_reps, cutting_movements, throw_count, jump_count).';
