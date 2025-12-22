-- =====================================================
-- QB ANNUAL PROGRAM 2025-2026 SEED DATA (ORIGINAL)
-- =====================================================
-- NOTE: This is the ORIGINAL seed file. For the CORRECTED version
-- with proper throwing volume progression, use seed-qb-annual-program-corrected.sql
--
-- Based on Ljubljana Frogs QB Annual Program
-- November 2025 - October 2026
-- Progressive periodization with ACWR monitoring

-- =====================================================
-- STEP 1: Create the QB Annual Program
-- =====================================================

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
  'Comprehensive annual training program for quarterbacks. Includes periodized strength, speed, and throwing volume progression with ACWR monitoring for injury prevention.',
  '2025-11-01',
  '2026-10-31',
  true
);

-- =====================================================
-- STEP 2: Create Training Phases (Periodization)
-- =====================================================

-- Phase 1: Foundation (December 2025)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
  '22222221-2222-2222-2222-222222222221'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Foundation',
  'Base building phase focused on movement quality, core strength, and fundamental throwing mechanics. Progressive loading from 20% to 40% BW over 4 weeks.',
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
  'Power development phase emphasizing explosive movements, Olympic lift variations, and increased throwing volume. Progressive loading continues with emphasis on rate of force development.',
  '2026-01-01',
  '2026-02-28',
  2,
  ARRAY['Power Development', 'Explosive Movements', 'Throwing Volume', 'Speed Work']
);

-- Phase 3: Explosive (March 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
  '22222223-2222-2222-2222-222222222223'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Explosive',
  'Peak power and speed phase. Maximum throwing volume (320 throws), sprint work, and game-specific movements. Preparing for tournament season.',
  '2026-03-01',
  '2026-03-31',
  3,
  ARRAY['Explosive Power', 'Maximum Speed', 'Game Simulation', 'Peak Throwing Volume']
);

-- Phase 4: Tournament Maintenance (April - June 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
  '22222224-2222-2222-2222-222222222224'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Tournament Maintenance',
  'In-season maintenance and recovery. Focus on game performance, recovery protocols, and maintaining strength/power levels. ACWR monitoring critical during tournament play.',
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
  'Post-season recovery and regeneration. Low-intensity activities, mobility work, and gradual return to throwing. Mental recovery period.',
  '2026-07-01',
  '2026-08-31',
  5,
  ARRAY['Recovery', 'Mobility', 'Light Activity', 'Mental Refresh']
);

-- Phase 6: Pre-Season Preparation (September - October 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
  '22222226-2222-2222-2222-222222222226'::UUID,
  '11111111-1111-1111-1111-111111111111'::UUID,
  'Pre-Season Preparation',
  'Return to structured training. Re-establishing movement patterns, building back throwing volume, and preparing for next cycle.',
  '2026-09-01',
  '2026-10-31',
  6,
  ARRAY['Movement Re-patterning', 'Volume Build', 'Strength Return', 'Skill Refinement']
);

-- =====================================================
-- STEP 3: Create Training Weeks for Foundation Phase
-- =====================================================

-- Foundation Phase - Week 1 (20% BW)
INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES (
  '33333331-3333-3333-3333-333333333331'::UUID,
  '22222221-2222-2222-2222-222222222221'::UUID,
  1,
  '2025-12-01',
  '2025-12-07',
  20.00,
  1.0, -- 100 throws baseline
  'Introduction to program - Movement quality emphasis'
);

-- Foundation Phase - Week 2 (20% BW)
INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES (
  '33333332-3333-3333-3333-333333333332'::UUID,
  '22222221-2222-2222-2222-222222222221'::UUID,
  2,
  '2025-12-08',
  '2025-12-14',
  20.00,
  1.5, -- 150 throws
  'Volume increase - Refining mechanics'
);

-- Foundation Phase - Week 3 (30% BW)
INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES (
  '33333333-3333-3333-3333-333333333333'::UUID,
  '22222221-2222-2222-2222-222222222221'::UUID,
  3,
  '2025-12-15',
  '2025-12-21',
  30.00,
  2.0, -- 200 throws
  'Load progression - Building capacity'
);

-- Foundation Phase - Week 4 (40% BW)
INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES (
  '33333334-3333-3333-3333-333333333334'::UUID,
  '22222221-2222-2222-2222-222222222221'::UUID,
  4,
  '2025-12-22',
  '2025-12-31',
  40.00,
  3.2, -- 320 throws (peak volume)
  'Peak week - Maximum foundation load'
);

-- =====================================================
-- STEP 4: Create QB-Specific Exercises
-- =====================================================

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

-- Throwing Volume Exercises
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
  ('44444451-4444-4444-4444-444444444451'::UUID, 'Throwing Volume Session - 100 Throws', 'Position-Specific', 'Throwing', 'Structured throwing session with 100 total throws. Includes warm-up, mechanics work, and simulated routes.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Duration']),
  ('44444452-4444-4444-4444-444444444452'::UUID, 'Throwing Volume Session - 150 Throws', 'Position-Specific', 'Throwing', 'Structured throwing session with 150 total throws. Progressive volume increase.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Duration']),
  ('44444453-4444-4444-4444-444444444453'::UUID, 'Throwing Volume Session - 200 Throws', 'Position-Specific', 'Throwing', 'Structured throwing session with 200 total throws. Moderate volume.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Duration']),
  ('44444454-4444-4444-4444-444444444454'::UUID, 'Throwing Volume Session - 320 Throws', 'Position-Specific', 'Throwing', 'High-volume throwing session with 320 total throws. Peak volume week. Includes game simulation.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Duration']),
  ('44444455-4444-4444-4444-444444444455'::UUID, 'Tournament Simulation - 8 Games', 'Position-Specific', 'Game Simulation', 'Full tournament simulation: 320 throws + 32×40m sprints over 8 simulated games. Peak preparation.', true, ARRAY[(SELECT id FROM positions WHERE name = 'QB')], ARRAY['Throws', 'Sprints', 'Duration']);

-- =====================================================
-- STEP 5: Create Sample Training Sessions for Week 1
-- =====================================================

-- Monday - Foundation Week 1: Morning Routine + Lower Body Strength
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
  ('55555511-5555-5555-5555-555555555511'::UUID,
  '33333331-3333-3333-3333-333333333331'::UUID,
  'Monday Morning - QB Routine',
  'Position-Specific',
  0, -- Monday
  1, -- Morning session
  30,
  'QB Morning Routine protocol',
  'Daily routine - non-negotiable. Focus on movement quality.'
);

INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
  ('55555512-5555-5555-5555-555555555512'::UUID,
  '33333331-3333-3333-3333-333333333331'::UUID,
  'Monday Afternoon - Lower Body Strength',
  'Strength',
  0, -- Monday
  2, -- Afternoon session
  60,
  'Dynamic warm-up + activation',
  'Foundation week 1 - 20% BW loading. Focus on technique over load.'
);

-- Tuesday - Speed Work + Throwing Volume
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
  ('55555521-5555-5555-5555-555555555521'::UUID,
  '33333331-3333-3333-3333-333333333331'::UUID,
  'Tuesday Morning - QB Routine',
  'Position-Specific',
  1, -- Tuesday
  1,
  30,
  'QB Morning Routine protocol',
  'Daily routine'
);

INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
  ('55555522-5555-5555-5555-555555555522'::UUID,
  '33333331-3333-3333-3333-333333333331'::UUID,
  'Tuesday Afternoon - Speed & Throwing',
  'Skill',
  1, -- Tuesday
  2,
  90,
  'QB warm-up protocol + progressive throwing',
  '100 throws target for week 1. Include 3-step acceleration drills.'
);

-- Wednesday - Recovery + Upper Body
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
  ('55555531-5555-5555-5555-555555555531'::UUID,
  '33333331-3333-3333-3333-333333333331'::UUID,
  'Wednesday Morning - QB Routine',
  'Position-Specific',
  2, -- Wednesday
  1,
  30,
  'QB Morning Routine protocol',
  'Daily routine'
);

INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
  ('55555532-5555-5555-5555-555555555532'::UUID,
  '33333331-3333-3333-3333-333333333331'::UUID,
  'Wednesday Afternoon - Upper Body Strength',
  'Strength',
  2, -- Wednesday
  2,
  60,
  'Dynamic warm-up + scapular activation',
  'Focus on landmine press and anti-rotation core work. Light loads.'
);

-- Thursday - Active Recovery
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
  ('55555541-5555-5555-5555-555555555541'::UUID,
  '33333331-3333-3333-3333-333333333331'::UUID,
  'Thursday - Active Recovery',
  'Recovery',
  3, -- Thursday
  1,
  45,
  'Light mobility work',
  'Low-intensity movement, foam rolling, stretching. No heavy loads or high volume.'
);

-- Friday - Lower Body Power + Throwing
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
  ('55555551-5555-5555-5555-555555555551'::UUID,
  '33333331-3333-3333-3333-333333333331'::UUID,
  'Friday Morning - QB Routine',
  'Position-Specific',
  4, -- Friday
  1,
  30,
  'QB Morning Routine protocol',
  'Daily routine'
);

INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
  ('55555552-5555-5555-5555-555555555552'::UUID,
  '33333331-3333-3333-3333-333333333331'::UUID,
  'Friday Afternoon - Power & Throwing',
  'Power',
  4, -- Friday
  2,
  90,
  'QB warm-up protocol + med ball throws',
  'Unilateral jump series + 100 throws. Emphasis on explosive movements.'
);

-- =====================================================
-- STEP 6: Link Exercises to Monday Lower Body Session
-- =====================================================

-- Monday Afternoon - Lower Body Strength Session Exercises

-- 1. Trap Bar Deadlift - 3 sets x 8 reps @ 20% BW
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
  ('55555512-5555-5555-5555-555555555512'::UUID,
  '44444431-4444-4444-4444-444444444431'::UUID, -- Trap Bar Deadlift
  1,
  3,
  8,
  90,
  'Percentage BW',
  20.00,
  'Foundation week 1 - Focus on hip hinge pattern. Keep bar close to body.'
);

-- 2. Front Squat - 3 sets x 10 reps @ 20% BW
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
  ('55555512-5555-5555-5555-555555555512'::UUID,
  '44444432-4444-4444-4444-444444444432'::UUID, -- Front Squat
  2,
  3,
  10,
  90,
  'Percentage BW',
  20.00,
  'Maintain upright torso. Full depth if mobility allows.'
);

-- 3. Single-Leg RDL - 3 sets x 8 reps each leg @ Bodyweight
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
  ('55555512-5555-5555-5555-555555555512'::UUID,
  '44444434-4444-4444-4444-444444444434'::UUID, -- Single-Leg RDL
  3,
  3,
  8,
  60,
  'Bodyweight',
  0.00,
  'Balance emphasis. Can add light dumbbell if stable.'
);

-- 4. Bulgarian Split Squat - 3 sets x 10 reps each leg @ 20% BW
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
  ('55555512-5555-5555-5555-555555555512'::UUID,
  '44444435-4444-4444-4444-444444444435'::UUID, -- Bulgarian Split Squat
  4,
  3,
  10,
  60,
  'Percentage BW',
  20.00,
  'Front leg emphasis. Rear foot on bench 12-18 inches high.'
);

-- =====================================================
-- STEP 7: Link Exercises to Tuesday Speed & Throwing Session
-- =====================================================

-- 1. 3-Step Acceleration Drill - 6 reps
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, distance_meters, notes) VALUES
  ('55555522-5555-5555-5555-555555555522'::UUID,
  '44444421-4444-4444-4444-444444444421'::UUID, -- 3-Step Acceleration
  1,
  3,
  2,
  120,
  'Bodyweight',
  0.00,
  10,
  'Explosive first 3 steps from QB stance. Full recovery between reps.'
);

-- 2. Deceleration Drill - 6 reps
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, distance_meters, notes) VALUES
  ('55555522-5555-5555-5555-555555555522'::UUID,
  '44444422-4444-4444-4444-444444444422'::UUID, -- Deceleration
  2,
  3,
  2,
  120,
  'Bodyweight',
  0.00,
  15,
  'Build to sprint, then rapid deceleration. Maintain control.'
);

-- 3. 40-Meter Sprint - 4 reps
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, distance_meters, notes) VALUES
  ('55555522-5555-5555-5555-555555555522'::UUID,
  '44444441-4444-4444-4444-444444444441'::UUID, -- 40m Sprint
  3,
  4,
  1,
  180,
  'Bodyweight',
  0.00,
  40,
  'Full recovery. Time each rep. Track progress.'
);

-- 4. Throwing Volume Session - 100 Throws
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes, position_specific_params) VALUES
  ('55555522-5555-5555-5555-555555555522'::UUID,
  '44444451-4444-4444-4444-444444444451'::UUID, -- 100 Throws
  4,
  NULL,
  NULL,
  NULL,
  'Time-based',
  0.00,
  'Week 1 baseline throwing volume. Include progressive warm-up throws (not counted in 100). Focus on mechanics over velocity.',
  '{"total_throws": 100, "breakdown": {"warm_up": 20, "short_routes": 40, "medium_routes": 30, "deep_routes": 10}, "weekly_target": 100}'::JSONB
);

-- =====================================================
-- STEP 8: Link Exercises to Wednesday Upper Body Session
-- =====================================================

-- 1. Landmine Press - 3 sets x 10 reps @ 20% BW
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
  ('55555532-5555-5555-5555-555555555532'::UUID,
  '44444436-4444-4444-4444-444444444436'::UUID, -- Landmine Press
  1,
  3,
  10,
  75,
  'Percentage BW',
  20.00,
  'Angled pressing mimics throwing motion. Unilateral work.'
);

-- 2. Half-Kneeling Pallof Press - 3 sets x 12 reps each side
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
  ('55555532-5555-5555-5555-555555555532'::UUID,
  '44444437-4444-4444-4444-444444444437'::UUID, -- Pallof Press
  2,
  3,
  12,
  60,
  'Resistance Band',
  0.00,
  'Anti-rotation core. Critical for throwing power. Resist rotation, maintain neutral spine.'
);

-- 3. QB Arm Care Routine - 2 sets
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, duration_seconds, notes) VALUES
  ('55555532-5555-5555-5555-555555555532'::UUID,
  '44444406-4444-4444-4444-444444444406'::UUID, -- Arm Care
  3,
  2,
  NULL,
  90,
  'Light Dumbbells',
  0.00,
  600, -- 10 minutes
  'Rotator cuff work, shoulder stability. Use 2-5 lb dumbbells. High reps, low load.'
);

-- =====================================================
-- STEP 9: Link Exercises to Friday Power & Throwing Session
-- =====================================================

-- 1. Medicine Ball Throws - 3 sets x 8 reps
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
  ('55555552-5555-5555-5555-555555555552'::UUID,
  '44444413-4444-4444-4444-444444444413'::UUID, -- Med Ball Throws
  1,
  3,
  8,
  90,
  'Fixed Weight',
  4.00, -- 4kg med ball
  'Explosive throws. Chest pass, overhead, rotational. Power activation.'
);

-- 2. Unilateral Jump Series - 3 sets x 6 reps each leg
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
  ('55555552-5555-5555-5555-555555555552'::UUID,
  '44444423-4444-4444-4444-444444444423'::UUID, -- Unilateral Jumps
  2,
  3,
  6,
  90,
  'Bodyweight',
  0.00,
  'Single-leg hops forward, lateral. Focus on landing mechanics.'
);

-- 3. Lateral Shuffle Drill - 4 sets x 10 yards each direction
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, distance_meters, notes) VALUES
  ('55555552-5555-5555-5555-555555555552'::UUID,
  '44444424-4444-4444-4444-444444444424'::UUID, -- Lateral Shuffle
  3,
  4,
  2,
  60,
  'Bodyweight',
  0.00,
  9, -- ~10 yards
  'Pocket movement simulation. Stay low, quick feet.'
);

-- 4. Throwing Volume Session - 100 Throws
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes, position_specific_params) VALUES
  ('55555552-5555-5555-5555-555555555552'::UUID,
  '44444451-4444-4444-4444-444444444451'::UUID, -- 100 Throws
  4,
  NULL,
  NULL,
  NULL,
  'Time-based',
  0.00,
  'End of week 1 throwing session. Assess mechanics and arm health.',
  '{"total_throws": 100, "breakdown": {"warm_up": 20, "mechanics_work": 50, "route_simulation": 30}, "weekly_total_target": 100}'::JSONB
);

-- =====================================================
-- NOTES & USAGE INSTRUCTIONS
-- =====================================================
--
-- This seed data creates:
-- ✅ 1 QB Annual Program (Nov 2025 - Oct 2026)
-- ✅ 6 Training Phases (Foundation, Power, Explosive, Tournament, Recovery, Pre-Season)
-- ✅ 4 Training Weeks for Foundation Phase (progressive loading 20% → 40% BW)
-- ✅ 25+ QB-specific exercises (morning routine, warm-up, strength, speed, throwing)
-- ✅ 7 Training Sessions for Week 1 (Monday-Friday structure)
-- ✅ Complete exercise prescriptions with sets, reps, loads
-- ✅ Position-specific parameters for throwing volume tracking
--
-- TO USE THIS DATA:
-- 1. Run create-training-schema.sql first to create all tables
-- 2. Run this file to populate with QB program data
-- 3. Assign program to a player using player_programs table
-- 4. Players log workouts via workout_logs table
-- 5. ACWR automatically calculated via trigger
-- 6. Position-specific metrics (throwing volume) tracked in position_specific_metrics
--
-- NEXT STEPS TO COMPLETE THE PROGRAM:
-- - Create remaining weeks for Foundation Phase (already have Week 1-4 structure)
-- - Create weeks for Power Phase (Jan-Feb)
-- - Create weeks for Explosive Phase (March)
-- - Create weeks for Tournament Maintenance (Apr-Jun)
-- - Add more exercises for variety
-- - Create video library entries
--
