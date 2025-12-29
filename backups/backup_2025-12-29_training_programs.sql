-- FlagFit Pro Database Backup
-- Table: training_programs
-- Backup Date: 2025-12-29
-- Records: 1

INSERT INTO training_programs (id, name, description, created_by, team_id, program_type, difficulty_level, duration_weeks, sessions_per_week, program_structure, is_template, is_active, created_at, updated_at, position_id, start_date, end_date)
VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Ljubljana Frogs WR/DB Annual Program 2025-2026', 'Comprehensive annual training program for Wide Receivers and Defensive Backs. Prepares athletes for tournament demands: 8 games over 2 days, 320 minutes total game time, ~20km sprinting per tournament weekend. Includes periodized strength, speed, agility, and flag football integration.', NULL, NULL, 'general', 'advanced', 52, 5, NULL, true, true, '2025-12-26 13:50:52.36979+00', '2025-12-26 13:50:52.36979+00', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-11-01', '2026-10-31')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  program_type = EXCLUDED.program_type,
  difficulty_level = EXCLUDED.difficulty_level,
  duration_weeks = EXCLUDED.duration_weeks,
  sessions_per_week = EXCLUDED.sessions_per_week,
  is_template = EXCLUDED.is_template,
  is_active = EXCLUDED.is_active,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  updated_at = NOW();

