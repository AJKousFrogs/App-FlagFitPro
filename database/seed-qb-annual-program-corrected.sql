-- =====================================================
-- QB ANNUAL PROGRAM 2025-2026 - CORRECTED PERIODIZATION
-- =====================================================
-- CRITICAL FIX: Proper throwing volume progression
-- November 2025 - October 2026
--
-- THROWING VOLUME PROGRESSION (over 5 months):
-- November:     50-80 throws/week   (return to throwing)
-- December:     80-120 throws/week  (foundation)
-- January:      120-160 throws/week (gradual build)
-- February:     160-240 throws/week (continued build)
-- March:        240-320 throws/week (approaching peak)
-- April Week 2: 320 throws/week     (SEASON STARTS - PEAK VOLUME)
-- Apr-Jun:      320 throws/week     (MAINTAIN through tournament season)
--
-- Weekly increases: 10-20 throws max (NOT 50+ throws!)
-- RPE monitoring is CRITICAL to prevent overload
-- =====================================================

-- =====================================================
-- PREREQUISITE: Ensure positions exist
-- =====================================================
-- Positions should already be seeded from schema.sql, but ensure they exist
INSERT INTO positions (name, display_name, description) VALUES
  ('QB', 'Quarterback', 'Field general, responsible for passing and leadership'),
  ('WR', 'Wide Receiver', 'Primary pass catchers and route runners'),
  ('DB', 'Defensive Back', 'Coverage specialists and ball hawks'),
  ('Center', 'Center', 'Snaps the ball and protects the QB'),
  ('LB', 'Linebacker', 'Versatile defenders, rush and coverage'),
  ('Blitzer', 'Blitzer', 'Specialized pass rushers')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STEP 1: Create the QB Annual Program
-- =====================================================

-- Delete existing program if re-running (idempotent)
DELETE FROM training_programs WHERE id = '11111111-1111-1111-1111-111111111111'::UUID;

INSERT INTO training_programs (
  id,
  name,
  position_id,
  description,
  start_date,
  end_date,
  is_active
) VALUES (
  '11111111-1111-1111-1111-111111111111'::UUID,
  'QB Annual Program 2025-2026',
  (SELECT id FROM positions WHERE name = 'QB'),
  'Comprehensive annual training program for quarterbacks. Features GRADUAL throwing volume progression over 5 months (50→320 throws), periodized strength training, and ACWR monitoring for injury prevention. Peak volume achieved by April Week 2 (season start).',
  '2025-11-01',
  '2026-10-31',
  true
);

-- =====================================================
-- STEP 2: Create Training Phases (Periodization)
-- =====================================================

-- Delete existing phases if re-running (idempotent)
DELETE FROM training_phases WHERE program_id = '11111111-1111-1111-1111-111111111111'::UUID;

-- Phase 0: Pre-Season Preparation (November 2025)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
  '22222220-2222-2222-2222-222222222220'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Pre-Season Preparation',
  'Return to structured training after off-season. Focus on movement re-patterning, gradual return to throwing (50-80 throws/week), and building base conditioning.',
  '2025-11-01',
  '2025-11-30',
  0,
  ARRAY['Movement Re-patterning', 'Return to Throwing', 'Base Conditioning', 'Skill Refresh']
);

-- Phase 1: Foundation (December 2025)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
  '22222221-2222-2222-2222-222222222221'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Foundation',
  'Base building phase. Throwing volume: 80-120 throws/week. Progressive strength loading from 20% to 40% BW over 4 weeks. Focus on movement quality and throwing mechanics.',
  '2025-12-01',
  '2025-12-31',
  1,
  ARRAY['Movement Quality', 'Core Strength', 'Throwing Mechanics', 'Base Conditioning']
);

-- Phase 2: Power (January - February 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
  '22222222-2222-2222-2222-222222222222'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Power',
  'Power development phase. Throwing volume: 120-240 throws/week (gradual 10-20 throw weekly increases). Olympic lift variations, explosive movements, and rate of force development emphasis.',
  '2026-01-01',
  '2026-02-28',
  2,
  ARRAY['Power Development', 'Explosive Movements', 'Gradual Volume Build', 'Speed Work']
);

-- Phase 3: Explosive (March 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
  '22222223-2222-2222-2222-222222222223'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Explosive',
  'Peak power and speed phase. Throwing volume: 240-320 throws/week (final push to peak). Sprint work and game-specific movements. Preparing for tournament season.',
  '2026-03-01',
  '2026-03-31',
  3,
  ARRAY['Explosive Power', 'Maximum Speed', 'Game Simulation', 'Final Volume Push']
);

-- Phase 4: Tournament Maintenance (April - June 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
  '22222224-2222-2222-2222-222222222224'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Tournament Maintenance',
  'IN-SEASON. Throwing volume: MAINTAIN 320 throws/week throughout entire tournament season. Focus on recovery, game performance, and ACWR monitoring. No further volume increases.',
  '2026-04-01',
  '2026-06-30',
  4,
  ARRAY['Performance Maintenance', 'Recovery', 'Game Readiness', 'Injury Prevention']
);

-- Phase 5: Active Recovery (July - August 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
  '22222225-2222-2222-2222-222222222225'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Active Recovery',
  'Post-season recovery. Throwing volume: 50-80 throws/week (return to baseline). Low-intensity activities, mobility work, mental refresh.',
  '2026-07-01',
  '2026-08-31',
  5,
  ARRAY['Recovery', 'Mobility', 'Light Activity', 'Mental Refresh']
);

-- Phase 6: Off-Season Prep (September - October 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
  '22222226-2222-2222-2222-222222222226'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Off-Season Preparation',
  'Preparing for next cycle. Throwing volume: 80-100 throws/week. Re-establishing movement patterns and skill work.',
  '2026-09-01',
  '2026-10-31',
  6,
  ARRAY['Movement Re-patterning', 'Volume Build', 'Strength Return', 'Skill Refinement']
);

-- =====================================================
-- STEP 3: Create CORRECTED Training Weeks
-- =====================================================
-- PROPER GRADUAL PROGRESSION OVER 5 MONTHS

-- Delete existing weeks if re-running (idempotent)
DELETE FROM training_weeks WHERE phase_id IN (
  SELECT id FROM training_phases WHERE program_id = '11111111-1111-1111-1111-111111111111'::UUID
);

-- ========== NOVEMBER 2025 (Pre-Season) ==========
-- Throwing volume: 50-80 throws/week

INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES
  ('33333301-3333-3333-3333-333333333301'::UUID, '22222220-2222-2222-2222-222222222220'::UUID, 1, '2025-11-01', '2025-11-07', 0.00, 0.50, 'Return to throwing - 50 throws'),
  ('33333302-3333-3333-3333-333333333302'::UUID, '22222220-2222-2222-2222-222222222220'::UUID, 2, '2025-11-08', '2025-11-14', 0.00, 0.60, 'Gradual increase - 60 throws'),
  ('33333303-3333-3333-3333-333333333303'::UUID, '22222220-2222-2222-2222-222222222220'::UUID, 3, '2025-11-15', '2025-11-21', 0.00, 0.70, 'Building comfort - 70 throws'),
  ('33333304-3333-3333-3333-333333333304'::UUID, '22222220-2222-2222-2222-222222222220'::UUID, 4, '2025-11-22', '2025-11-30', 0.00, 0.80, 'End of month - 80 throws');

-- ========== DECEMBER 2025 (Foundation Phase) ==========
-- Throwing volume: 80-120 throws/week
-- Strength loading: 20% BW → 40% BW

INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES
  ('33333311-3333-3333-3333-333333333311'::UUID, '22222221-2222-2222-2222-222222222221'::UUID, 1, '2025-12-01', '2025-12-07', 20.00, 0.80, 'Foundation Week 1 - 80 throws, 20% BW'),
  ('33333312-3333-3333-3333-333333333312'::UUID, '22222221-2222-2222-2222-222222222221'::UUID, 2, '2025-12-08', '2025-12-14', 20.00, 0.95, 'Foundation Week 2 - 95 throws, 20% BW'),
  ('33333313-3333-3333-3333-333333333313'::UUID, '22222221-2222-2222-2222-222222222221'::UUID, 3, '2025-12-15', '2025-12-21', 30.00, 1.10, 'Foundation Week 3 - 110 throws, 30% BW'),
  ('33333314-3333-3333-3333-333333333314'::UUID, '22222221-2222-2222-2222-222222222221'::UUID, 4, '2025-12-22', '2025-12-31', 40.00, 1.20, 'Foundation Week 4 - 120 throws, 40% BW');

-- ========== JANUARY 2026 (Power Phase - Month 1) ==========
-- Throwing volume: 120-160 throws/week (~10 throws increase per week)

INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES
  ('33333321-3333-3333-3333-333333333321'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 1, '2026-01-01', '2026-01-07', 30.00, 1.20, 'Power Week 1 - 120 throws'),
  ('33333322-3333-3333-3333-333333333322'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 2, '2026-01-08', '2026-01-14', 30.00, 1.30, 'Power Week 2 - 130 throws'),
  ('33333323-3333-3333-3333-333333333323'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 3, '2026-01-15', '2026-01-21', 35.00, 1.40, 'Power Week 3 - 140 throws'),
  ('33333324-3333-3333-3333-333333333324'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 4, '2026-01-22', '2026-01-31', 35.00, 1.55, 'Power Week 4 - 155 throws');

-- ========== FEBRUARY 2026 (Power Phase - Month 2) ==========
-- Throwing volume: 160-240 throws/week (~20 throws increase per week)

INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES
  ('33333325-3333-3333-3333-333333333325'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 5, '2026-02-01', '2026-02-07', 35.00, 1.70, 'Power Week 5 - 170 throws'),
  ('33333326-3333-3333-3333-333333333326'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 6, '2026-02-08', '2026-02-14', 35.00, 1.90, 'Power Week 6 - 190 throws'),
  ('33333327-3333-3333-3333-333333333327'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 7, '2026-02-15', '2026-02-21', 40.00, 2.10, 'Power Week 7 - 210 throws'),
  ('33333328-3333-3333-3333-333333333328'::UUID, '22222222-2222-2222-2222-222222222222'::UUID, 8, '2026-02-22', '2026-02-28', 40.00, 2.30, 'Power Week 8 - 230 throws');

-- ========== MARCH 2026 (Explosive Phase) ==========
-- Throwing volume: 240-320 throws/week (final push to peak)

INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES
  ('33333331-3333-3333-3333-333333333331'::UUID, '22222223-2222-2222-2222-222222222223'::UUID, 1, '2026-03-01', '2026-03-07', 40.00, 2.50, 'Explosive Week 1 - 250 throws'),
  ('33333332-3333-3333-3333-333333333332'::UUID, '22222223-2222-2222-2222-222222222223'::UUID, 2, '2026-03-08', '2026-03-14', 40.00, 2.70, 'Explosive Week 2 - 270 throws'),
  ('33333333-3333-3333-3333-333333333333'::UUID, '22222223-2222-2222-2222-222222222223'::UUID, 3, '2026-03-15', '2026-03-21', 40.00, 2.90, 'Explosive Week 3 - 290 throws'),
  ('33333334-3333-3333-3333-333333333334'::UUID, '22222223-2222-2222-2222-222222222223'::UUID, 4, '2026-03-22', '2026-03-31', 40.00, 3.10, 'Explosive Week 4 - 310 throws (pre-peak)');

-- ========== APRIL 2026 (Tournament Season - PEAK & MAINTAIN) ==========
-- Throwing volume: 320 throws/week (REACHED IN WEEK 2, MAINTAIN THROUGH SEASON)

INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES
  ('33333341-3333-3333-3333-333333333341'::UUID, '22222224-2222-2222-2222-222222222224'::UUID, 1, '2026-04-01', '2026-04-07', 30.00, 3.15, 'Tournament Week 1 - 315 throws (taper before season)'),
  ('33333342-3333-3333-3333-333333333342'::UUID, '22222224-2222-2222-2222-222222222224'::UUID, 2, '2026-04-08', '2026-04-14', 30.00, 3.20, '🎯 SEASON STARTS - 320 THROWS (PEAK VOLUME)'),
  ('33333343-3333-3333-3333-333333333343'::UUID, '22222224-2222-2222-2222-222222222224'::UUID, 3, '2026-04-15', '2026-04-21', 30.00, 3.20, 'Tournament Week 3 - MAINTAIN 320 throws'),
  ('33333344-3333-3333-3333-333333333344'::UUID, '22222224-2222-2222-2222-222222222224'::UUID, 4, '2026-04-22', '2026-04-30', 30.00, 3.20, 'Tournament Week 4 - MAINTAIN 320 throws');

-- MAY 2026 (Tournament Season - MAINTAIN)
INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES
  ('33333345-3333-3333-3333-333333333345'::UUID, '22222224-2222-2222-2222-222222222224'::UUID, 5, '2026-05-01', '2026-05-07', 30.00, 3.20, 'Tournament Week 5 - MAINTAIN 320 throws'),
  ('33333346-3333-3333-3333-333333333346'::UUID, '22222224-2222-2222-2222-222222222224'::UUID, 6, '2026-05-08', '2026-05-14', 30.00, 3.20, 'Tournament Week 6 - MAINTAIN 320 throws'),
  ('33333347-3333-3333-3333-333333333347'::UUID, '22222224-2222-2222-2222-222222222224'::UUID, 7, '2026-05-15', '2026-05-21', 30.00, 3.20, 'Tournament Week 7 - MAINTAIN 320 throws'),
  ('33333348-3333-3333-3333-333333333348'::UUID, '22222224-2222-2222-2222-222222222224'::UUID, 8, '2026-05-22', '2026-05-31', 30.00, 3.20, 'Tournament Week 8 - MAINTAIN 320 throws');

-- JUNE 2026 (Tournament Season - MAINTAIN)
INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES
  ('33333349-3333-3333-3333-333333333349'::UUID, '22222224-2222-2222-2222-222222222224'::UUID, 9, '2026-06-01', '2026-06-07', 30.00, 3.20, 'Tournament Week 9 - MAINTAIN 320 throws'),
  ('33333350-3333-3333-3333-333333333350'::UUID, '22222224-2222-2222-2222-222222222224'::UUID, 10, '2026-06-08', '2026-06-14', 30.00, 3.20, 'Tournament Week 10 - MAINTAIN 320 throws'),
  ('33333351-3333-3333-3333-333333333351'::UUID, '22222224-2222-2222-2222-222222222224'::UUID, 11, '2026-06-15', '2026-06-21', 30.00, 3.20, 'Tournament Week 11 - MAINTAIN 320 throws'),
  ('33333352-3333-3333-3333-333333333352'::UUID, '22222224-2222-2222-2222-222222222224'::UUID, 12, '2026-06-22', '2026-06-30', 30.00, 3.20, 'Tournament Week 12 - MAINTAIN 320 throws (season end)');

-- =====================================================
-- CORRECTED THROWING VOLUME EXERCISES
-- =====================================================
-- Insert/update throwing volume exercises to reflect gradual progression
-- Uses INSERT ... ON CONFLICT DO UPDATE for idempotency

-- 50 throws (November start)
INSERT INTO exercises (id, name, category, position_specific, applicable_positions, metrics_tracked, description) VALUES
  ('44444450-4444-4444-4444-444444444450'::UUID, 'Throwing Volume Session - 50 Throws', 'Position-Specific', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 'Return to throwing session. 50 total throws with focus on mechanics and arm health. Baseline volume for off-season.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 80 throws (Foundation phase)
INSERT INTO exercises (id, name, category, position_specific, applicable_positions, metrics_tracked, description) VALUES
  ('44444451-4444-4444-4444-444444444451'::UUID, 'Throwing Volume Session - 80 Throws', 'Position-Specific', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 'Foundation phase throwing session. 80 total throws. Gradual volume increase from 50. Focus on mechanics over velocity.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 120 throws (end of Foundation)
INSERT INTO exercises (id, name, category, position_specific, applicable_positions, metrics_tracked, description) VALUES
  ('44444456-4444-4444-4444-444444444456'::UUID, 'Throwing Volume Session - 120 Throws', 'Position-Specific', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 'End of Foundation phase. 120 total throws. Solid base established.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 160 throws (mid Power phase)
INSERT INTO exercises (id, name, category, position_specific, applicable_positions, metrics_tracked, description) VALUES
  ('44444457-4444-4444-4444-444444444457'::UUID, 'Throwing Volume Session - 160 Throws', 'Position-Specific', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 'Mid Power phase. 160 total throws. Volume steadily increasing.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 200 throws (Power phase)
INSERT INTO exercises (id, name, category, position_specific, applicable_positions, metrics_tracked, description) VALUES
  ('44444453-4444-4444-4444-444444444453'::UUID, 'Throwing Volume Session - 200 Throws', 'Position-Specific', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 'Power phase throwing session. 200 total throws. Approaching higher volumes. Monitor arm health and RPE closely.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 240 throws (early Explosive)
INSERT INTO exercises (id, name, category, position_specific, applicable_positions, metrics_tracked, description) VALUES
  ('44444458-4444-4444-4444-444444444458'::UUID, 'Throwing Volume Session - 240 Throws', 'Position-Specific', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 'Explosive phase. 240 total throws. Final push toward peak volume.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 280 throws (late Explosive)
INSERT INTO exercises (id, name, category, position_specific, applicable_positions, metrics_tracked, description) VALUES
  ('44444459-4444-4444-4444-444444444459'::UUID, 'Throwing Volume Session - 280 Throws', 'Position-Specific', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 'Late Explosive phase. 280 total throws. Nearly at peak volume.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 320 throws (PEAK - Tournament Season)
INSERT INTO exercises (id, name, category, position_specific, applicable_positions, metrics_tracked, description) VALUES
  ('44444454-4444-4444-4444-444444444454'::UUID, 'Throwing Volume Session - 320 Throws (PEAK)', 'Position-Specific', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 'PEAK VOLUME - Tournament Season. 320 total throws. MAINTAIN this volume throughout entire season (April-June). Includes game simulation and full route tree work. ACWR monitoring critical.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- =====================================================
-- VISUALIZATION: Throwing Volume Progression Chart
-- =====================================================
--
-- Week | Month    | Throws | Increase | Notes
-- -----|----------|--------|----------|------------------
-- 1    | Nov W1   | 50     | --       | Return to throwing
-- 2    | Nov W2   | 60     | +10      | Gradual increase
-- 3    | Nov W3   | 70     | +10      |
-- 4    | Nov W4   | 80     | +10      |
-- 5    | Dec W1   | 80     | 0        | Foundation starts
-- 6    | Dec W2   | 95     | +15      |
-- 7    | Dec W3   | 110    | +15      |
-- 8    | Dec W4   | 120    | +10      |
-- 9    | Jan W1   | 120    | 0        | Power phase starts
-- 10   | Jan W2   | 130    | +10      | Small weekly jumps
-- 11   | Jan W3   | 140    | +10      |
-- 12   | Jan W4   | 155    | +15      |
-- 13   | Feb W1   | 170    | +15      |
-- 14   | Feb W2   | 190    | +20      | Bigger jumps now
-- 15   | Feb W3   | 210    | +20      |
-- 16   | Feb W4   | 230    | +20      |
-- 17   | Mar W1   | 250    | +20      | Explosive phase
-- 18   | Mar W2   | 270    | +20      |
-- 19   | Mar W3   | 290    | +20      |
-- 20   | Mar W4   | 310    | +20      | Pre-peak
-- 21   | Apr W1   | 315    | +5       | Taper before season
-- 22   | Apr W2   | 320    | +5       | 🎯 SEASON STARTS (PEAK)
-- 23+  | Apr-Jun  | 320    | 0        | MAINTAIN through season
--
-- Total build time: 22 weeks (5 months)
-- Total increase: 50 → 320 throws (270 throw increase over 5 months)
-- Average weekly increase: ~12 throws/week
-- =====================================================

-- Note: Remaining exercises (Morning Routine, Warm-up, Strength, Speed, etc.)
-- from the original seed file should be included here.
-- For brevity, they are omitted but should be copied from seed-qb-annual-program.sql
-- starting from the QB-Specific Exercises section.

-- =====================================================
-- QB-SPECIFIC EXERCISES LIBRARY
-- =====================================================
-- Complete exercise library for QB training program

-- Morning Routine Exercises
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
  ('44444401-4444-4444-4444-444444444401'::UUID, 'QB Morning Routine - Full Protocol', 'Position-Specific', 'Mobility & Activation', '25-30 minute daily routine: ankle mobility, hip mobility, thoracic rotation, scapular activation, arm care. Critical for injury prevention and throwing readiness.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Duration', 'Completion']),
  ('44444402-4444-4444-4444-444444444402'::UUID, 'Ankle Mobility Sequence', 'Flexibility', 'Mobility', 'Ankle dorsiflexion, plantarflexion, and rotation exercises. 5 minutes.', false, ARRAY[(SELECT id FROM positions WHERE name = 'QB'), (SELECT id FROM positions WHERE name = 'WR')], ARRAY['Duration', 'ROM']),
  ('44444403-4444-4444-4444-444444444403'::UUID, 'Hip Mobility Sequence', 'Flexibility', 'Mobility', '90/90 stretches, hip flexor mobility, internal/external rotation. 8 minutes.', false, NULL, ARRAY['Duration', 'ROM']),
  ('44444404-4444-4444-4444-444444444404'::UUID, 'Thoracic Rotation Drills', 'Flexibility', 'Mobility', 'Thoracic spine rotation exercises critical for throwing mechanics. 5 minutes.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Duration', 'Rotations']),
  ('44444405-4444-4444-4444-444444444405'::UUID, 'Scapular Activation', 'Strength', 'Activation', 'Scapular retraction, protraction, elevation drills with bands. 5 minutes.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Duration', 'Reps']),
  ('44444406-4444-4444-4444-444444444406'::UUID, 'QB Arm Care Routine', 'Position-Specific', 'Arm Care', 'Rotator cuff strengthening, shoulder stability, elbow health exercises. 10 minutes.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Duration', 'Sets', 'Reps']);

-- Warm-up Protocol Exercises
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
  ('44444411-4444-4444-4444-444444444411'::UUID, 'QB Warm-up Protocol - Full', 'Position-Specific', 'Warm-up', '30-minute comprehensive warm-up before training. Includes dynamic mobility, activation, and progressive throwing.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Duration', 'Completion']),
  ('44444412-4444-4444-4444-444444444412'::UUID, 'Dynamic Warm-up Circuit', 'Agility', 'Movement Prep', 'Leg swings, walking lunges, high knees, butt kicks, A-skips, B-skips. 10 minutes.', false, NULL, ARRAY['Duration']),
  ('44444413-4444-4444-4444-444444444413'::UUID, 'Medicine Ball Throws', 'Power', 'Explosive', 'Chest pass, overhead throw, rotational throw. Power activation. 5 minutes.', false, NULL, ARRAY['Throws', 'Sets']),
  ('44444414-4444-4444-4444-444444444414'::UUID, 'Progressive Throwing Sequence', 'Position-Specific', 'Throwing', 'Start at 5 yards, progress to 10, 15, 20 yards. Gradual arm warming. 15 minutes.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Distance']);

-- Critical Movement Patterns
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
  ('44444421-4444-4444-4444-444444444421'::UUID, '3-Step Acceleration Drill', 'Speed', '3-step acceleration', 'Explosive first 3 steps from QB stance. Critical for pocket mobility and scramble efficiency.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Reps', 'Time', 'Distance']),
  ('44444422-4444-4444-4444-444444444422'::UUID, 'Deceleration Drill', 'Speed', 'Deceleration', 'Teaching proper deceleration mechanics to prevent injury and maintain control. Includes rapid stops from sprint.', false, NULL, ARRAY['Reps', 'Distance']),
  ('44444423-4444-4444-4444-444444444423'::UUID, 'Unilateral Jump Series', 'Power', 'Unilateral', 'Single-leg hops, bounds, lateral jumps. Develops single-leg power and stability.', false, NULL, ARRAY['Reps', 'Sets', 'Distance']),
  ('44444424-4444-4444-4444-444444444424'::UUID, 'Lateral Shuffle Drill', 'Agility', 'Lateral', 'Side-to-side movement patterns. Critical for pocket movement and avoiding rush.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB'), (SELECT id FROM positions WHERE name = 'DB')], ARRAY['Reps', 'Distance', 'Time']);

-- Strength Training Exercises
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
  ('44444431-4444-4444-4444-444444444431'::UUID, 'Trap Bar Deadlift', 'Strength', 'Hip Hinge', 'Primary posterior chain developer. Progressive load from 20% to 40% BW.', false, NULL, ARRAY['Sets', 'Reps', 'Weight']),
  ('44444432-4444-4444-4444-444444444432'::UUID, 'Front Squat', 'Strength', 'Squat', 'Quad-dominant squat variation. Maintains upright torso like throwing posture.', false, NULL, ARRAY['Sets', 'Reps', 'Weight']),
  ('44444433-4444-4444-4444-444444444433'::UUID, 'Romanian Deadlift (RDL)', 'Strength', 'Hip Hinge', 'Hamstring and glute developer. Eccentric emphasis.', false, NULL, ARRAY['Sets', 'Reps', 'Weight']),
  ('44444434-4444-4444-4444-444444444434'::UUID, 'Single-Leg RDL', 'Strength', 'Unilateral', 'Unilateral posterior chain work with balance component.', false, NULL, ARRAY['Sets', 'Reps', 'Weight']),
  ('44444435-4444-4444-4444-444444444435'::UUID, 'Bulgarian Split Squat', 'Strength', 'Unilateral', 'Rear foot elevated split squat. Quad and glute developer.', false, NULL, ARRAY['Sets', 'Reps', 'Weight']),
  ('44444436-4444-4444-4444-444444444436'::UUID, 'Landmine Press', 'Strength', 'Push', 'Angled pressing motion mimics throwing angle. Shoulder-friendly.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Sets', 'Reps', 'Weight']),
  ('44444437-4444-4444-4444-444444444437'::UUID, 'Half-Kneeling Pallof Press', 'Strength', 'Anti-Rotation', 'Core anti-rotation exercise. Critical for rotational power in throwing.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Sets', 'Reps', 'Resistance']);

-- Speed and Agility
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
  ('44444441-4444-4444-4444-444444444441'::UUID, '40-Meter Sprint', 'Speed', '3-step acceleration', 'Full sprint from standing start. 40 meters with timing.', false, NULL, ARRAY['Reps', 'Time', 'Distance']),
  ('44444442-4444-4444-4444-444444444442'::UUID, '20-Yard Shuttle', 'Agility', 'Lateral', 'Lateral agility drill. Tests change of direction speed.', false, NULL, ARRAY['Reps', 'Time']),
  ('44444443-4444-4444-4444-444444444443'::UUID, 'Pro Agility Drill (5-10-5)', 'Agility', 'Lateral', 'Classic agility test. 5 yards right, 10 yards left, 5 yards right.', false, NULL, ARRAY['Reps', 'Time']),
  ('44444444-4444-4444-4444-444444444444'::UUID, 'Flying 20m Sprint', 'Speed', '3-step acceleration', 'Build up to max velocity, then 20m sprint at max speed.', false, NULL, ARRAY['Reps', 'Time']);

-- Tournament Simulation
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
  ('44444455-4444-4444-4444-444444444455'::UUID, 'Tournament Simulation - 8 Games', 'Position-Specific', 'Game Simulation', 'Full tournament simulation: 320 throws + 32×40m sprints over 8 simulated games. Peak preparation for tournament season.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Sprints', 'Duration']);

-- =====================================================
-- INSTALLATION COMPLETE
-- =====================================================
-- Summary:
-- - 1 QB Annual Program (Nov 2025 - Oct 2026)
-- - 7 Training Phases (Pre-Season through Off-Season)
-- - 32 Training Weeks (Nov-Jun with correct throwing volume progression)
-- - 6 Positions (QB, WR, DB, Center, LB, Blitzer)
-- - 30+ Exercises (QB-specific and general)
-- - Proper periodization: 50 → 320 throws over 5 months
-- - Peak volume reached April Week 2 (season start)
-- - Maintain 320 throws through entire tournament season
-- 
-- Next step: Assign program to players via player_programs table
-- =====================================================
