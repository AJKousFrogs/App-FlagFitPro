-- FlagFit Pro Database Backup
-- Table: training_weeks
-- Backup Date: 2025-12-29
-- Records: 16

INSERT INTO training_weeks (id, phase_id, week_number, name, description, start_date, end_date, load_percentage, intensity_level, focus, notes, created_at, updated_at)
VALUES
  -- Foundation Phase (December)
  ('dddddddd-0001-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000002', 1, 'Foundation Week 1', 'Learning phase - establish movement patterns with 20% bodyweight loads. Focus on form over intensity.', '2025-12-01', '2025-12-07', 20.00, 'Low-Moderate', 'Movement quality, form establishment, 20% BW loads', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  ('dddddddd-0001-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000002', 2, 'Foundation Week 2', 'Continue learning phase at 20% BW. Increase sprint intensity to 80%. Add complexity to movement drills.', '2025-12-08', '2025-12-14', 20.00, 'Moderate', 'Increased sprint intensity, movement complexity, still 20% BW', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  ('dddddddd-0001-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000002', 3, 'Foundation Week 3', 'Building phase - increase to 30% bodyweight loads. Increase plyometric height/distance.', '2025-12-15', '2025-12-21', 30.00, 'Moderate-High', 'Load increase to 30% BW, increased plyometric demands', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  ('dddddddd-0001-0000-0000-000000000004', 'eeeeeeee-0000-0000-0000-000000000002', 4, 'Foundation Week 4 - Peak', 'Peak foundation phase - 40% bodyweight loads (maximum allowed). Assessment week: test all movements, record loads, video mechanics.', '2025-12-22', '2025-12-31', 40.00, 'High', 'Peak loads at 40% BW, sprint assessment, baseline testing', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  
  -- Power Development Phase (January)
  ('dddddddd-0002-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000003', 1, 'Power Week 1', 'Maintain 40% BW loads. Convert strength to explosive power. Flag practice integration begins.', '2026-01-05', '2026-01-11', 40.00, 'High', 'Power conversion, flag practice integration', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  ('dddddddd-0002-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000003', 2, 'Power Week 2', 'Increase sprint volume to 12x40m. Add complexity to movement drills. Introduce reactive elements.', '2026-01-12', '2026-01-18', 40.00, 'High', 'Increased sprint volume, reactive elements', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  ('dddddddd-0002-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000003', 3, 'Power Week 3', 'Peak power emphasis. 14x40m sprint capacity. Advanced COD combinations.', '2026-01-19', '2026-01-25', 40.00, 'Very High', 'Peak power, advanced COD, 14x40m sprints', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  ('dddddddd-0002-0000-0000-000000000004', 'eeeeeeee-0000-0000-0000-000000000003', 4, 'Power Week 4 - Assessment', 'Test sprint times (10m, 20m, 40m), test power (vertical jump, broad jump). Video all movements. Prepare for February.', '2026-01-26', '2026-02-01', 40.00, 'High', 'Assessment, testing, video analysis', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  
  -- Capacity Building Phase (February)
  ('dddddddd-0003-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000004', 1, 'Capacity Week 1', 'Sprint progression: 12x40m @ 90%. Maintain 40% BW. Continue critical movement drills.', '2026-02-02', '2026-02-08', 40.00, 'High', '12x40m sprints, capacity building', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  ('dddddddd-0003-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000004', 2, 'Capacity Week 2', 'Sprint progression: 14x40m @ 90%. Focus on speed of movement, not increasing load.', '2026-02-09', '2026-02-15', 40.00, 'High', '14x40m sprints, movement speed', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  ('dddddddd-0003-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000004', 3, 'Capacity Week 3', 'Sprint progression: 16x40m @ 90%. Near tournament capacity.', '2026-02-16', '2026-02-22', 40.00, 'Very High', '16x40m sprints, near tournament capacity', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  ('dddddddd-0003-0000-0000-000000000004', 'eeeeeeee-0000-0000-0000-000000000004', 4, 'Capacity Week 4', 'Maintain 16x40m @ 90%. Prepare for March explosive phase.', '2026-02-23', '2026-02-28', 40.00, 'High', 'Maintain 16x40m, prepare for explosive phase', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  
  -- Explosive & Tournament Prep Phase (March)
  ('dddddddd-0004-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000005', 1, 'Explosive Week 1', 'NEW: Explosive hamstring work 2x/week. Build to 2 sets x 8x40m capacity. Explosive ladder drills with bands.', '2026-03-01', '2026-03-07', 40.00, 'Very High', '2 sets x 8x40m, explosive hamstrings', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  ('dddddddd-0004-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000005', 2, 'Explosive Week 2', 'Progress to 3 sets x 8x40m (24 total 40m sprints in one day). Continue explosive hamstring work.', '2026-03-08', '2026-03-14', 40.00, 'Very High', '3 sets x 8x40m, 24 total sprints', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  ('dddddddd-0004-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000005', 3, 'Explosive Week 3', 'Progress to 4 sets x 8x40m (32 total 40m sprints - tournament simulation). Peak explosive capacity.', '2026-03-15', '2026-03-21', 40.00, 'Maximum', '4 sets x 8x40m, tournament simulation', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00'),
  ('dddddddd-0004-0000-0000-000000000004', 'eeeeeeee-0000-0000-0000-000000000005', 4, 'Explosive Week 4 - Taper', 'TAPER WEEK for Adria Bowl. Reduce volume, maintain intensity. Final prep for April 11-12 tournament.', '2026-03-22', '2026-03-31', 30.00, 'High', 'Taper for Adria Bowl, reduce volume', NULL, '2025-12-26 13:51:26.991297+00', '2025-12-26 13:51:26.991297+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  load_percentage = EXCLUDED.load_percentage,
  intensity_level = EXCLUDED.intensity_level,
  focus = EXCLUDED.focus,
  updated_at = NOW();

