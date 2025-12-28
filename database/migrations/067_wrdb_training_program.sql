-- =============================================================================
-- WR/DB TRAINING PROGRAM 2025-2026
-- Migration 067: Complete position-specific program for Wide Receivers and Defensive Backs
-- =============================================================================
-- Based on flag football WR/DB requirements:
-- - Route running precision and explosion
-- - Coverage skills and hip mobility
-- - Speed development (top-end and acceleration)
-- - Change of direction and reactive agility
-- - Ball skills and hand-eye coordination
-- =============================================================================

-- =============================================================================
-- 1. CREATE WR/DB ANNUAL PROGRAM
-- =============================================================================

INSERT INTO training_programs (
    id,
    name,
    position_id,
    description,
    start_date,
    end_date,
    is_active
) VALUES (
    '22222222-2222-2222-2222-222222222222'::UUID,
    'WR/DB Speed & Agility Program 2025-2026',
    (SELECT id FROM positions WHERE name = 'WR'),
    'Comprehensive annual training program for Wide Receivers and Defensive Backs. Focuses on route running precision, coverage skills, top-end speed, and reactive agility. Includes position-specific drills for both offensive and defensive skill positions.',
    '2025-12-01',
    '2026-10-31',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- =============================================================================
-- 2. CREATE TRAINING PHASES (6 Phases - Annual Periodization)
-- =============================================================================

-- Phase 1: Foundation (December 2025)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
    'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
    '22222222-2222-2222-2222-222222222222'::UUID,
    'Foundation',
    'Base building phase focused on movement quality, hip mobility, and fundamental speed mechanics. Establishes deceleration patterns and single-leg stability.',
    '2025-12-01',
    '2025-12-31',
    1,
    ARRAY['Movement Quality', 'Hip Mobility', 'Deceleration', 'Single-Leg Stability', 'Base Conditioning']
) ON CONFLICT (id) DO NOTHING;

-- Phase 2: Speed Development (January - February 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
    'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
    '22222222-2222-2222-2222-222222222222'::UUID,
    'Speed Development',
    'Primary speed phase emphasizing acceleration mechanics, top-end speed, and sprint technique. Includes resisted and assisted sprint training.',
    '2026-01-01',
    '2026-02-28',
    2,
    ARRAY['Acceleration', 'Top-End Speed', 'Sprint Mechanics', 'Resisted Sprints', 'Flying Sprints']
) ON CONFLICT (id) DO NOTHING;

-- Phase 3: Agility & Reactive (March 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
    'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
    '22222222-2222-2222-2222-222222222222'::UUID,
    'Agility & Reactive',
    'Peak agility phase. Maximum change of direction work, reactive drills, and position-specific route/coverage patterns.',
    '2026-03-01',
    '2026-03-31',
    3,
    ARRAY['Change of Direction', 'Reactive Agility', 'Route Running', 'Coverage Patterns', 'Ball Skills']
) ON CONFLICT (id) DO NOTHING;

-- Phase 4: Tournament Maintenance (April - June 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
    'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
    '22222222-2222-2222-2222-222222222222'::UUID,
    'Tournament Maintenance',
    'In-season maintenance and recovery. Focus on game performance, recovery protocols, and maintaining speed/agility levels.',
    '2026-04-01',
    '2026-06-30',
    4,
    ARRAY['Performance Maintenance', 'Recovery', 'Game Readiness', 'Injury Prevention']
) ON CONFLICT (id) DO NOTHING;

-- Phase 5: Active Recovery (July - August 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
    'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
    '22222222-2222-2222-2222-222222222222'::UUID,
    'Active Recovery',
    'Post-season recovery and regeneration. Low-intensity activities, mobility work, and cross-training.',
    '2026-07-01',
    '2026-08-31',
    5,
    ARRAY['Recovery', 'Mobility', 'Cross-Training', 'Mental Refresh']
) ON CONFLICT (id) DO NOTHING;

-- Phase 6: Pre-Season Preparation (September - October 2026)
INSERT INTO training_phases (id, program_id, name, description, start_date, end_date, phase_order, focus_areas) VALUES (
    'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
    '22222222-2222-2222-2222-222222222222'::UUID,
    'Pre-Season Preparation',
    'Return to structured training. Re-establishing movement patterns and preparing for next cycle.',
    '2026-09-01',
    '2026-10-31',
    6,
    ARRAY['Movement Re-patterning', 'Speed Return', 'Agility Rebuild', 'Skill Refinement']
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. CREATE TRAINING WEEKS FOR FOUNDATION PHASE
-- =============================================================================

-- Foundation Phase - Week 1
INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES (
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
    1,
    '2025-12-01',
    '2025-12-07',
    60.00, -- Intensity %
    1.0,
    'Introduction - Movement quality and deceleration fundamentals'
) ON CONFLICT (id) DO NOTHING;

-- Foundation Phase - Week 2
INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES (
    'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
    2,
    '2025-12-08',
    '2025-12-14',
    65.00,
    1.2,
    'Volume increase - Single-leg stability emphasis'
) ON CONFLICT (id) DO NOTHING;

-- Foundation Phase - Week 3
INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES (
    'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
    3,
    '2025-12-15',
    '2025-12-21',
    70.00,
    1.4,
    'Load progression - Hip mobility and COD introduction'
) ON CONFLICT (id) DO NOTHING;

-- Foundation Phase - Week 4 (Deload)
INSERT INTO training_weeks (id, phase_id, week_number, start_date, end_date, load_percentage, volume_multiplier, focus) VALUES (
    'bbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID,
    4,
    '2025-12-22',
    '2025-12-31',
    55.00,
    0.8,
    'Deload week - Recovery and consolidation'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. CREATE WR/DB-SPECIFIC EXERCISES
-- =============================================================================

-- Morning Routine & Warm-up
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
    ('cccccc01-cccc-cccc-cccc-cccccccccccc'::UUID, 'WR/DB Morning Routine - Full Protocol', 'Position-Specific', 'Mobility & Activation', '20-25 minute daily routine: hip mobility, ankle mobility, thoracic rotation, glute activation, and dynamic stretching. Critical for route running and coverage.', true, ARRAY[(SELECT id FROM positions WHERE name = 'WR'), (SELECT id FROM positions WHERE name = 'DB')], ARRAY['Duration', 'Completion']),
    ('cccccc02-cccc-cccc-cccc-cccccccccccc'::UUID, 'Hip 90/90 Stretch Sequence', 'Flexibility', 'Mobility', 'Internal and external hip rotation stretches. Essential for route breaks and hip flips. 5 minutes.', true, ARRAY[(SELECT id FROM positions WHERE name = 'WR'), (SELECT id FROM positions WHERE name = 'DB')], ARRAY['Duration', 'ROM']),
    ('cccccc03-cccc-cccc-cccc-cccccccccccc'::UUID, 'Glute Activation Circuit', 'Strength', 'Activation', 'Clamshells, fire hydrants, glute bridges, and band walks. 8 minutes.', false, NULL, ARRAY['Duration', 'Reps']),
    ('cccccc04-cccc-cccc-cccc-cccccccccccc'::UUID, 'WR/DB Dynamic Warm-up', 'Position-Specific', 'Warm-up', 'Position-specific warm-up including backpedal, shuffle, crossover, and sprint mechanics. 15 minutes.', true, ARRAY[(SELECT id FROM positions WHERE name = 'WR'), (SELECT id FROM positions WHERE name = 'DB')], ARRAY['Duration', 'Completion'])
ON CONFLICT (id) DO NOTHING;

-- Speed & Acceleration Exercises
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
    ('cccccc11-cccc-cccc-cccc-cccccccccccc'::UUID, '10-Yard Burst', 'Speed', '3-step acceleration', 'Explosive 10-yard sprint from 3-point stance. Focus on first-step explosion.', true, ARRAY[(SELECT id FROM positions WHERE name = 'WR'), (SELECT id FROM positions WHERE name = 'DB')], ARRAY['Reps', 'Time']),
    ('cccccc12-cccc-cccc-cccc-cccccccccccc'::UUID, 'Flying 30m Sprint', 'Speed', 'Top-End Speed', '10m build-up into 30m max velocity sprint. Develops top-end speed.', false, NULL, ARRAY['Reps', 'Time']),
    ('cccccc13-cccc-cccc-cccc-cccccccccccc'::UUID, 'Resisted Sprint (Band)', 'Speed', 'Acceleration', 'Partner-resisted sprint with band for horizontal force development.', false, NULL, ARRAY['Reps', 'Distance']),
    ('cccccc14-cccc-cccc-cccc-cccccccccccc'::UUID, 'Hill Sprint (Short)', 'Speed', 'Acceleration', '15-20m hill sprints on 6-10% grade. Develops acceleration power.', false, NULL, ARRAY['Reps', 'Time'])
ON CONFLICT (id) DO NOTHING;

-- Agility & COD Exercises
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
    ('cccccc21-cccc-cccc-cccc-cccccccccccc'::UUID, 'L-Drill (3-Cone)', 'Agility', 'Change of Direction', 'Classic 3-cone L-drill. Tests and develops multi-directional agility.', false, NULL, ARRAY['Reps', 'Time']),
    ('cccccc22-cccc-cccc-cccc-cccccccccccc'::UUID, 'Pro Agility (5-10-5)', 'Agility', 'Lateral', '5 yards right, 10 yards left, 5 yards right. Standard agility test.', false, NULL, ARRAY['Reps', 'Time']),
    ('cccccc23-cccc-cccc-cccc-cccccccccccc'::UUID, 'T-Drill', 'Agility', 'Multi-Directional', 'Forward sprint, lateral shuffle, backpedal. Multi-planar agility.', false, NULL, ARRAY['Reps', 'Time']),
    ('cccccc24-cccc-cccc-cccc-cccccccccccc'::UUID, 'Box Drill (4 Corners)', 'Agility', 'Multi-Directional', 'Sprint, shuffle, backpedal, crossover around 4 cones.', false, NULL, ARRAY['Reps', 'Time']),
    ('cccccc25-cccc-cccc-cccc-cccccccccccc'::UUID, 'Reactive Mirror Drill', 'Agility', 'Reactive', 'Partner-based reactive drill. Mirror movements with rapid transitions.', true, ARRAY[(SELECT id FROM positions WHERE name = 'WR'), (SELECT id FROM positions WHERE name = 'DB')], ARRAY['Duration', 'Reps'])
ON CONFLICT (id) DO NOTHING;

-- WR-Specific Route Running
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
    ('cccccc31-cccc-cccc-cccc-cccccccccccc'::UUID, 'Route Tree Practice - Slant/In', 'Position-Specific', 'Route Running', 'Slant and in-breaking routes. Focus on stem, break, and acceleration out of break.', true, ARRAY[(SELECT id FROM positions WHERE name = 'WR')], ARRAY['Routes', 'Completion Rate']),
    ('cccccc32-cccc-cccc-cccc-cccccccccccc'::UUID, 'Route Tree Practice - Out/Comeback', 'Position-Specific', 'Route Running', 'Out routes and comeback routes. Focus on deceleration and separation.', true, ARRAY[(SELECT id FROM positions WHERE name = 'WR')], ARRAY['Routes', 'Completion Rate']),
    ('cccccc33-cccc-cccc-cccc-cccccccccccc'::UUID, 'Route Tree Practice - Post/Corner', 'Position-Specific', 'Route Running', 'Deep routes: post and corner. Focus on stem, head fake, and break.', true, ARRAY[(SELECT id FROM positions WHERE name = 'WR')], ARRAY['Routes', 'Completion Rate']),
    ('cccccc34-cccc-cccc-cccc-cccccccccccc'::UUID, 'Release Drill Package', 'Position-Specific', 'Route Running', 'Press release techniques: swim, rip, chop, and speed release.', true, ARRAY[(SELECT id FROM positions WHERE name = 'WR')], ARRAY['Reps', 'Success Rate']),
    ('cccccc35-cccc-cccc-cccc-cccccccccccc'::UUID, 'Contested Catch Drill', 'Position-Specific', 'Ball Skills', 'Catching with defender in proximity. High-point catches and body positioning.', true, ARRAY[(SELECT id FROM positions WHERE name = 'WR')], ARRAY['Catches', 'Drops'])
ON CONFLICT (id) DO NOTHING;

-- DB-Specific Coverage
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
    ('cccccc41-cccc-cccc-cccc-cccccccccccc'::UUID, 'Backpedal Technique Drill', 'Position-Specific', 'Coverage', 'Backpedal mechanics: hip position, arm action, and eye discipline.', true, ARRAY[(SELECT id FROM positions WHERE name = 'DB')], ARRAY['Distance', 'Reps']),
    ('cccccc42-cccc-cccc-cccc-cccccccccccc'::UUID, 'Hip Flip Drill (Open/Close)', 'Position-Specific', 'Coverage', 'Transitioning from backpedal to sprint. Open hip and close hip techniques.', true, ARRAY[(SELECT id FROM positions WHERE name = 'DB')], ARRAY['Reps', 'Time']),
    ('cccccc43-cccc-cccc-cccc-cccccccccccc'::UUID, 'Break on Ball Drill', 'Position-Specific', 'Coverage', 'Reading QB eyes and breaking on the ball. Reaction and angle work.', true, ARRAY[(SELECT id FROM positions WHERE name = 'DB')], ARRAY['Reps', 'PBUs']),
    ('cccccc44-cccc-cccc-cccc-cccccccccccc'::UUID, 'Press Coverage Technique', 'Position-Specific', 'Coverage', 'Jam technique, hand placement, and mirroring through release.', true, ARRAY[(SELECT id FROM positions WHERE name = 'DB')], ARRAY['Reps', 'Success Rate']),
    ('cccccc45-cccc-cccc-cccc-cccccccccccc'::UUID, 'Zone Drop Drill', 'Position-Specific', 'Coverage', 'Zone coverage drops: spot drops, pattern matching, and collision points.', true, ARRAY[(SELECT id FROM positions WHERE name = 'DB')], ARRAY['Reps', 'Completion'])
ON CONFLICT (id) DO NOTHING;

-- Strength Training
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
    ('cccccc51-cccc-cccc-cccc-cccccccccccc'::UUID, 'Goblet Squat', 'Strength', 'Squat', 'Fundamental squat pattern with kettlebell or dumbbell. Hip mobility emphasis.', false, NULL, ARRAY['Sets', 'Reps', 'Weight']),
    ('cccccc52-cccc-cccc-cccc-cccccccccccc'::UUID, 'Single-Leg Romanian Deadlift', 'Strength', 'Hip Hinge', 'Unilateral posterior chain development. Balance and hamstring strength.', false, NULL, ARRAY['Sets', 'Reps', 'Weight']),
    ('cccccc53-cccc-cccc-cccc-cccccccccccc'::UUID, 'Lateral Lunge', 'Strength', 'Lateral', 'Frontal plane strength and hip mobility. Essential for COD.', false, NULL, ARRAY['Sets', 'Reps', 'Weight']),
    ('cccccc54-cccc-cccc-cccc-cccccccccccc'::UUID, 'Single-Leg Box Squat', 'Strength', 'Unilateral', 'Single-leg squat to box. Develops single-leg strength and control.', false, NULL, ARRAY['Sets', 'Reps', 'Weight']),
    ('cccccc55-cccc-cccc-cccc-cccccccccccc'::UUID, 'Copenhagen Plank', 'Strength', 'Adductor', 'Adductor strengthening for groin injury prevention. Side plank variation.', false, NULL, ARRAY['Sets', 'Duration'])
ON CONFLICT (id) DO NOTHING;

-- Plyometrics (Position-Specific Selection)
INSERT INTO exercises (id, name, category, movement_pattern, description, position_specific, applicable_positions, metrics_tracked) VALUES
    ('cccccc61-cccc-cccc-cccc-cccccccccccc'::UUID, 'Lateral Bound', 'Power', 'Lateral', 'Single-leg lateral bounds for frontal plane power.', false, NULL, ARRAY['Reps', 'Distance']),
    ('cccccc62-cccc-cccc-cccc-cccccccccccc'::UUID, 'Single-Leg Hop (Forward)', 'Power', 'Unilateral', 'Forward single-leg hops. Develops horizontal power.', false, NULL, ARRAY['Reps', 'Distance']),
    ('cccccc63-cccc-cccc-cccc-cccccccccccc'::UUID, 'Depth Jump to Sprint', 'Power', 'Reactive', 'Drop from box, land, immediately sprint 10 yards.', false, NULL, ARRAY['Reps', 'Time']),
    ('cccccc64-cccc-cccc-cccc-cccccccccccc'::UUID, 'Skater Jumps', 'Power', 'Lateral', 'Lateral bounding with arm swing. Develops lateral power.', false, NULL, ARRAY['Reps', 'Distance'])
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. CREATE TRAINING SESSIONS FOR WEEK 1
-- =============================================================================

-- Monday - Morning Routine + Speed Development
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('ddddddd1-dddd-dddd-dddd-dddddddddddd'::UUID,
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'Monday Morning - WR/DB Routine',
    'Position-Specific',
    0,
    1,
    25,
    'WR/DB Morning Routine protocol',
    'Daily routine - Focus on hip mobility and glute activation.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('ddddddd2-dddd-dddd-dddd-dddddddddddd'::UUID,
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'Monday PM - Speed & Acceleration',
    'Speed',
    0,
    2,
    60,
    'WR/DB Dynamic Warm-up',
    'Foundation week 1 - Acceleration mechanics and 10-yard bursts.'
) ON CONFLICT (id) DO NOTHING;

-- Tuesday - Agility & Position Skills
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('ddddddd3-dddd-dddd-dddd-dddddddddddd'::UUID,
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'Tuesday Morning - WR/DB Routine',
    'Position-Specific',
    1,
    1,
    25,
    'WR/DB Morning Routine protocol',
    'Daily routine'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('ddddddd4-dddd-dddd-dddd-dddddddddddd'::UUID,
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'Tuesday PM - Agility & Routes/Coverage',
    'Skill',
    1,
    2,
    75,
    'WR/DB Dynamic Warm-up',
    'COD fundamentals + WR route work OR DB coverage work.'
) ON CONFLICT (id) DO NOTHING;

-- Wednesday - Strength
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('ddddddd5-dddd-dddd-dddd-dddddddddddd'::UUID,
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'Wednesday Morning - WR/DB Routine',
    'Position-Specific',
    2,
    1,
    25,
    'WR/DB Morning Routine protocol',
    'Daily routine'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('ddddddd6-dddd-dddd-dddd-dddddddddddd'::UUID,
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'Wednesday PM - Lower Body Strength',
    'Strength',
    2,
    2,
    50,
    'Dynamic warm-up + glute activation',
    'Single-leg emphasis. Goblet squat, SLRDL, lateral lunge.'
) ON CONFLICT (id) DO NOTHING;

-- Thursday - Active Recovery
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('ddddddd7-dddd-dddd-dddd-dddddddddddd'::UUID,
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'Thursday - Active Recovery',
    'Recovery',
    3,
    1,
    40,
    'Light mobility work',
    'Low-intensity movement, foam rolling, stretching.'
) ON CONFLICT (id) DO NOTHING;

-- Friday - Speed & Plyometrics
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('ddddddd8-dddd-dddd-dddd-dddddddddddd'::UUID,
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'Friday Morning - WR/DB Routine',
    'Position-Specific',
    4,
    1,
    25,
    'WR/DB Morning Routine protocol',
    'Daily routine'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('ddddddd9-dddd-dddd-dddd-dddddddddddd'::UUID,
    'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID,
    'Friday PM - Speed & Plyometrics',
    'Power',
    4,
    2,
    60,
    'WR/DB Dynamic Warm-up',
    'Flying sprints + lateral plyometrics.'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. LINK EXERCISES TO SESSIONS
-- =============================================================================

-- Monday PM - Speed & Acceleration Session
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, notes) VALUES
    ('ddddddd2-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc11-cccc-cccc-cccc-cccccccccccc'::UUID, 1, 6, 1, 90, 'Bodyweight', '10-yard burst from 3-point stance'),
    ('ddddddd2-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc13-cccc-cccc-cccc-cccccccccccc'::UUID, 2, 4, 1, 120, 'Bodyweight', 'Resisted sprints with partner band'),
    ('ddddddd2-dddd-dddd-dddd-dddddddddddd'::UUID, (SELECT id FROM exercises WHERE name = 'Falling Start (3-Step Acceleration)' LIMIT 1), 3, 4, 2, 90, 'Bodyweight', 'Falling start drill')
ON CONFLICT DO NOTHING;

-- Tuesday PM - Agility & Routes/Coverage Session
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, notes) VALUES
    ('ddddddd4-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc21-cccc-cccc-cccc-cccccccccccc'::UUID, 1, 4, 2, 90, 'Bodyweight', 'L-Drill - focus on plant foot'),
    ('ddddddd4-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc22-cccc-cccc-cccc-cccccccccccc'::UUID, 2, 4, 2, 90, 'Bodyweight', 'Pro Agility - timed'),
    ('ddddddd4-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc31-cccc-cccc-cccc-cccccccccccc'::UUID, 3, 3, 6, 60, 'Bodyweight', 'WR: Slant/In routes'),
    ('ddddddd4-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc41-cccc-cccc-cccc-cccccccccccc'::UUID, 4, 3, 6, 60, 'Bodyweight', 'DB: Backpedal technique')
ON CONFLICT DO NOTHING;

-- Wednesday PM - Lower Body Strength Session
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
    ('ddddddd6-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc51-cccc-cccc-cccc-cccccccccccc'::UUID, 1, 3, 10, 90, 'Fixed Weight', 16.00, 'Goblet Squat - 16kg KB'),
    ('ddddddd6-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc52-cccc-cccc-cccc-cccccccccccc'::UUID, 2, 3, 8, 75, 'Fixed Weight', 8.00, 'SLRDL - 8kg each hand'),
    ('ddddddd6-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc53-cccc-cccc-cccc-cccccccccccc'::UUID, 3, 3, 8, 75, 'Bodyweight', 0.00, 'Lateral Lunge - bodyweight'),
    ('ddddddd6-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc55-cccc-cccc-cccc-cccccccccccc'::UUID, 4, 3, NULL, 60, 'Bodyweight', 0.00, 'Copenhagen Plank - 20 sec each side')
ON CONFLICT DO NOTHING;

-- Friday PM - Speed & Plyometrics Session
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, notes) VALUES
    ('ddddddd9-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc12-cccc-cccc-cccc-cccccccccccc'::UUID, 1, 4, 1, 180, 'Bodyweight', 'Flying 30m - max velocity'),
    ('ddddddd9-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc61-cccc-cccc-cccc-cccccccccccc'::UUID, 2, 3, 6, 90, 'Bodyweight', 'Lateral bounds - stick landing'),
    ('ddddddd9-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc64-cccc-cccc-cccc-cccccccccccc'::UUID, 3, 3, 8, 75, 'Bodyweight', 'Skater jumps - continuous'),
    ('ddddddd9-dddd-dddd-dddd-dddddddddddd'::UUID, 'cccccc62-cccc-cccc-cccc-cccccccccccc'::UUID, 4, 3, 5, 90, 'Bodyweight', 'Single-leg forward hops - each leg')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- SELECT * FROM training_programs WHERE name LIKE '%WR/DB%';
-- SELECT * FROM training_phases WHERE program_id = '22222222-2222-2222-2222-222222222222'::UUID;
-- SELECT * FROM training_weeks WHERE phase_id = 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::UUID;
-- SELECT * FROM training_sessions WHERE week_id = 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::UUID;
