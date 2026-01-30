-- Add warm-up focus override to athlete_training_config
-- Allows players to override warm-up position focus without changing primary position

ALTER TABLE IF EXISTS athlete_training_config
  ADD COLUMN IF NOT EXISTS warmup_focus TEXT;
