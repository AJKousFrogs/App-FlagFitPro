-- =============================================================================
-- QB PROGRAM WEEKS 2-4 SESSIONS
-- Migration 069: Complete the Foundation Phase with all sessions
-- =============================================================================
-- This migration adds training sessions and exercise links for:
-- - Week 2: Volume increase (150 throws, 20% BW)
-- - Week 3: Load progression (200 throws, 30% BW)
-- - Week 4: Peak week (320 throws, 40% BW)
-- =============================================================================

-- =============================================================================
-- WEEK 2 SESSIONS (Volume Increase - 150 throws, 20% BW)
-- =============================================================================

-- Monday Week 2 - Morning Routine
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666621-6666-6666-6666-666666666621'::UUID,
    '33333332-3333-3333-3333-333333333332'::UUID,
    'Monday Morning - QB Routine',
    'Position-Specific',
    0, 1, 30,
    'QB Morning Routine protocol',
    'Daily routine - Week 2 volume increase begins'
) ON CONFLICT (id) DO NOTHING;

-- Monday Week 2 - Lower Body Strength
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666622-6666-6666-6666-666666666622'::UUID,
    '33333332-3333-3333-3333-333333333332'::UUID,
    'Monday PM - Lower Body Strength',
    'Strength',
    0, 2, 60,
    'Dynamic warm-up + activation',
    'Week 2 - Maintain 20% BW loading. Increase volume slightly.'
) ON CONFLICT (id) DO NOTHING;

-- Tuesday Week 2 - Morning Routine
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666623-6666-6666-6666-666666666623'::UUID,
    '33333332-3333-3333-3333-333333333332'::UUID,
    'Tuesday Morning - QB Routine',
    'Position-Specific',
    1, 1, 30,
    'QB Morning Routine protocol',
    'Daily routine'
) ON CONFLICT (id) DO NOTHING;

-- Tuesday Week 2 - Speed & Throwing (150 throws)
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666624-6666-6666-6666-666666666624'::UUID,
    '33333332-3333-3333-3333-333333333332'::UUID,
    'Tuesday PM - Speed & Throwing',
    'Skill',
    1, 2, 90,
    'QB warm-up protocol + progressive throwing',
    '150 throws target for week 2. Include 3-step acceleration drills.'
) ON CONFLICT (id) DO NOTHING;

-- Wednesday Week 2 - Morning Routine
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666625-6666-6666-6666-666666666625'::UUID,
    '33333332-3333-3333-3333-333333333332'::UUID,
    'Wednesday Morning - QB Routine',
    'Position-Specific',
    2, 1, 30,
    'QB Morning Routine protocol',
    'Daily routine'
) ON CONFLICT (id) DO NOTHING;

-- Wednesday Week 2 - Upper Body Strength
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666626-6666-6666-6666-666666666626'::UUID,
    '33333332-3333-3333-3333-333333333332'::UUID,
    'Wednesday PM - Upper Body Strength',
    'Strength',
    2, 2, 60,
    'Dynamic warm-up + scapular activation',
    'Landmine press, Pallof press, arm care. Slight volume increase.'
) ON CONFLICT (id) DO NOTHING;

-- Thursday Week 2 - Active Recovery
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666627-6666-6666-6666-666666666627'::UUID,
    '33333332-3333-3333-3333-333333333332'::UUID,
    'Thursday - Active Recovery',
    'Recovery',
    3, 1, 45,
    'Light mobility work',
    'Low-intensity movement, foam rolling, stretching.'
) ON CONFLICT (id) DO NOTHING;

-- Friday Week 2 - Morning Routine
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666628-6666-6666-6666-666666666628'::UUID,
    '33333332-3333-3333-3333-333333333332'::UUID,
    'Friday Morning - QB Routine',
    'Position-Specific',
    4, 1, 30,
    'QB Morning Routine protocol',
    'Daily routine'
) ON CONFLICT (id) DO NOTHING;

-- Friday Week 2 - Power & Throwing
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666629-6666-6666-6666-666666666629'::UUID,
    '33333332-3333-3333-3333-333333333332'::UUID,
    'Friday PM - Power & Throwing',
    'Power',
    4, 2, 90,
    'QB warm-up protocol + med ball throws',
    'Unilateral jump series + 150 throws. Emphasis on explosive movements.'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- WEEK 3 SESSIONS (Load Progression - 200 throws, 30% BW)
-- =============================================================================

-- Monday Week 3 - Morning Routine
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666631-6666-6666-6666-666666666631'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID,
    'Monday Morning - QB Routine',
    'Position-Specific',
    0, 1, 30,
    'QB Morning Routine protocol',
    'Daily routine - Week 3 load progression'
) ON CONFLICT (id) DO NOTHING;

-- Monday Week 3 - Lower Body Strength (30% BW)
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666632-6666-6666-6666-666666666632'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID,
    'Monday PM - Lower Body Strength',
    'Strength',
    0, 2, 65,
    'Dynamic warm-up + activation',
    'Week 3 - Progress to 30% BW loading. Monitor RPE closely.'
) ON CONFLICT (id) DO NOTHING;

-- Tuesday Week 3 - Morning Routine
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666633-6666-6666-6666-666666666633'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID,
    'Tuesday Morning - QB Routine',
    'Position-Specific',
    1, 1, 30,
    'QB Morning Routine protocol',
    'Daily routine'
) ON CONFLICT (id) DO NOTHING;

-- Tuesday Week 3 - Speed & Throwing (200 throws)
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666634-6666-6666-6666-666666666634'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID,
    'Tuesday PM - Speed & Throwing',
    'Skill',
    1, 2, 100,
    'QB warm-up protocol + progressive throwing',
    '200 throws target for week 3. Include deceleration drills.'
) ON CONFLICT (id) DO NOTHING;

-- Wednesday Week 3 - Morning Routine
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666635-6666-6666-6666-666666666635'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID,
    'Wednesday Morning - QB Routine',
    'Position-Specific',
    2, 1, 30,
    'QB Morning Routine protocol',
    'Daily routine'
) ON CONFLICT (id) DO NOTHING;

-- Wednesday Week 3 - Upper Body Strength (30% BW)
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666636-6666-6666-6666-666666666636'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID,
    'Wednesday PM - Upper Body Strength',
    'Strength',
    2, 2, 65,
    'Dynamic warm-up + scapular activation',
    'Progress landmine press load. Add rotational power work.'
) ON CONFLICT (id) DO NOTHING;

-- Thursday Week 3 - Active Recovery
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666637-6666-6666-6666-666666666637'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID,
    'Thursday - Active Recovery',
    'Recovery',
    3, 1, 45,
    'Light mobility work',
    'Recovery focus. Monitor ACWR - should be approaching optimal range.'
) ON CONFLICT (id) DO NOTHING;

-- Friday Week 3 - Morning Routine
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666638-6666-6666-6666-666666666638'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID,
    'Friday Morning - QB Routine',
    'Position-Specific',
    4, 1, 30,
    'QB Morning Routine protocol',
    'Daily routine'
) ON CONFLICT (id) DO NOTHING;

-- Friday Week 3 - Power & Throwing
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666639-6666-6666-6666-666666666639'::UUID,
    '33333333-3333-3333-3333-333333333333'::UUID,
    'Friday PM - Power & Throwing',
    'Power',
    4, 2, 100,
    'QB warm-up protocol + med ball throws',
    'Power emphasis + 200 throws. Include 40m sprints.'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- WEEK 4 SESSIONS (Peak Week - 320 throws, 40% BW)
-- =============================================================================

-- Monday Week 4 - Morning Routine
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666641-6666-6666-6666-666666666641'::UUID,
    '33333334-3333-3333-3333-333333333334'::UUID,
    'Monday Morning - QB Routine',
    'Position-Specific',
    0, 1, 30,
    'QB Morning Routine protocol',
    'Daily routine - Week 4 PEAK WEEK'
) ON CONFLICT (id) DO NOTHING;

-- Monday Week 4 - Lower Body Strength (40% BW)
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666642-6666-6666-6666-666666666642'::UUID,
    '33333334-3333-3333-3333-333333333334'::UUID,
    'Monday PM - Lower Body Strength',
    'Strength',
    0, 2, 70,
    'Dynamic warm-up + activation',
    'PEAK WEEK - 40% BW loading. Maximum foundation load.'
) ON CONFLICT (id) DO NOTHING;

-- Tuesday Week 4 - Morning Routine
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666643-6666-6666-6666-666666666643'::UUID,
    '33333334-3333-3333-3333-333333333334'::UUID,
    'Tuesday Morning - QB Routine',
    'Position-Specific',
    1, 1, 30,
    'QB Morning Routine protocol',
    'Daily routine'
) ON CONFLICT (id) DO NOTHING;

-- Tuesday Week 4 - Speed & Throwing (320 throws)
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666644-6666-6666-6666-666666666644'::UUID,
    '33333334-3333-3333-3333-333333333334'::UUID,
    'Tuesday PM - Speed & Throwing',
    'Skill',
    1, 2, 120,
    'QB warm-up protocol + progressive throwing',
    'PEAK: 320 throws. Include game simulation routes. Monitor arm fatigue.'
) ON CONFLICT (id) DO NOTHING;

-- Wednesday Week 4 - Morning Routine
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666645-6666-6666-6666-666666666645'::UUID,
    '33333334-3333-3333-3333-333333333334'::UUID,
    'Wednesday Morning - QB Routine',
    'Position-Specific',
    2, 1, 30,
    'QB Morning Routine protocol',
    'Daily routine'
) ON CONFLICT (id) DO NOTHING;

-- Wednesday Week 4 - Upper Body Strength (40% BW)
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666646-6666-6666-6666-666666666646'::UUID,
    '33333334-3333-3333-3333-333333333334'::UUID,
    'Wednesday PM - Upper Body Strength',
    'Strength',
    2, 2, 70,
    'Dynamic warm-up + scapular activation',
    'Peak upper body session. Max rotational power work.'
) ON CONFLICT (id) DO NOTHING;

-- Thursday Week 4 - Active Recovery
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666647-6666-6666-6666-666666666647'::UUID,
    '33333334-3333-3333-3333-333333333334'::UUID,
    'Thursday - Active Recovery',
    'Recovery',
    3, 1, 50,
    'Light mobility work',
    'Extended recovery. Critical before peak Friday session.'
) ON CONFLICT (id) DO NOTHING;

-- Friday Week 4 - Morning Routine
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666648-6666-6666-6666-666666666648'::UUID,
    '33333334-3333-3333-3333-333333333334'::UUID,
    'Friday Morning - QB Routine',
    'Position-Specific',
    4, 1, 30,
    'QB Morning Routine protocol',
    'Daily routine'
) ON CONFLICT (id) DO NOTHING;

-- Friday Week 4 - Tournament Simulation
INSERT INTO training_sessions (id, week_id, session_name, session_type, day_of_week, session_order, duration_minutes, warm_up_protocol, notes) VALUES
    ('66666649-6666-6666-6666-666666666649'::UUID,
    '33333334-3333-3333-3333-333333333334'::UUID,
    'Friday PM - Tournament Simulation',
    'Power',
    4, 2, 150,
    'Full QB warm-up protocol',
    'PEAK: Tournament simulation - 320 throws + 32×40m sprints (8 games). Maximum preparation.'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- LINK EXERCISES TO WEEK 2 SESSIONS
-- =============================================================================

-- Week 2 Monday PM - Lower Body (same exercises, slight volume increase)
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
    ('66666622-6666-6666-6666-666666666622'::UUID, '44444431-4444-4444-4444-444444444431'::UUID, 1, 3, 10, 90, 'Percentage BW', 20.00, 'Trap bar DL - 20% BW, volume up'),
    ('66666622-6666-6666-6666-666666666622'::UUID, '44444432-4444-4444-4444-444444444432'::UUID, 2, 3, 12, 90, 'Percentage BW', 20.00, 'Front squat - 20% BW'),
    ('66666622-6666-6666-6666-666666666622'::UUID, '44444434-4444-4444-4444-444444444434'::UUID, 3, 3, 10, 60, 'Bodyweight', 0.00, 'Single-leg RDL - each leg'),
    ('66666622-6666-6666-6666-666666666622'::UUID, '44444435-4444-4444-4444-444444444435'::UUID, 4, 3, 12, 60, 'Percentage BW', 20.00, 'Bulgarian split squat')
ON CONFLICT DO NOTHING;

-- Week 2 Tuesday PM - Speed & Throwing (150 throws)
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, distance_meters, notes, position_specific_params) VALUES
    ('66666624-6666-6666-6666-666666666624'::UUID, '44444421-4444-4444-4444-444444444421'::UUID, 1, 4, 2, 120, 'Bodyweight', 10, '3-step acceleration - increased volume', NULL),
    ('66666624-6666-6666-6666-666666666624'::UUID, '44444422-4444-4444-4444-444444444422'::UUID, 2, 3, 2, 120, 'Bodyweight', 15, 'Deceleration drill', NULL),
    ('66666624-6666-6666-6666-666666666624'::UUID, '44444441-4444-4444-4444-444444444441'::UUID, 3, 5, 1, 180, 'Bodyweight', 40, '40m sprint - 5 reps', NULL),
    ('66666624-6666-6666-6666-666666666624'::UUID, '44444452-4444-4444-4444-444444444452'::UUID, 4, NULL, NULL, NULL, 'Time-based', NULL, '150 throws session', '{"total_throws": 150, "breakdown": {"warm_up": 25, "short_routes": 60, "medium_routes": 45, "deep_routes": 20}}'::JSONB)
ON CONFLICT DO NOTHING;

-- Week 2 Wednesday PM - Upper Body
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
    ('66666626-6666-6666-6666-666666666626'::UUID, '44444436-4444-4444-4444-444444444436'::UUID, 1, 3, 12, 75, 'Percentage BW', 20.00, 'Landmine press - 20% BW'),
    ('66666626-6666-6666-6666-666666666626'::UUID, '44444437-4444-4444-4444-444444444437'::UUID, 2, 3, 14, 60, 'Resistance Band', 0.00, 'Pallof press - each side'),
    ('66666626-6666-6666-6666-666666666626'::UUID, '44444406-4444-4444-4444-444444444406'::UUID, 3, 2, NULL, 90, 'Light Dumbbells', 0.00, 'Arm care routine - 12 min')
ON CONFLICT DO NOTHING;

-- Week 2 Friday PM - Power & Throwing
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes, position_specific_params) VALUES
    ('66666629-6666-6666-6666-666666666629'::UUID, '44444413-4444-4444-4444-444444444413'::UUID, 1, 4, 8, 90, 'Fixed Weight', 4.00, 'Med ball throws - 4kg', NULL),
    ('66666629-6666-6666-6666-666666666629'::UUID, '44444423-4444-4444-4444-444444444423'::UUID, 2, 3, 8, 90, 'Bodyweight', 0.00, 'Unilateral jump series - each leg', NULL),
    ('66666629-6666-6666-6666-666666666629'::UUID, '44444452-4444-4444-4444-444444444452'::UUID, 3, NULL, NULL, NULL, 'Time-based', 0.00, '150 throws session', '{"total_throws": 150, "breakdown": {"mechanics_work": 70, "route_simulation": 50, "deep_balls": 30}}'::JSONB)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- LINK EXERCISES TO WEEK 3 SESSIONS (30% BW)
-- =============================================================================

-- Week 3 Monday PM - Lower Body (30% BW)
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
    ('66666632-6666-6666-6666-666666666632'::UUID, '44444431-4444-4444-4444-444444444431'::UUID, 1, 4, 8, 90, 'Percentage BW', 30.00, 'Trap bar DL - 30% BW PROGRESSION'),
    ('66666632-6666-6666-6666-666666666632'::UUID, '44444432-4444-4444-4444-444444444432'::UUID, 2, 4, 10, 90, 'Percentage BW', 30.00, 'Front squat - 30% BW'),
    ('66666632-6666-6666-6666-666666666632'::UUID, '44444434-4444-4444-4444-444444444434'::UUID, 3, 3, 10, 60, 'Fixed Weight', 8.00, 'Single-leg RDL - 8kg each hand'),
    ('66666632-6666-6666-6666-666666666632'::UUID, '44444435-4444-4444-4444-444444444435'::UUID, 4, 3, 10, 60, 'Percentage BW', 30.00, 'Bulgarian split squat - 30% BW')
ON CONFLICT DO NOTHING;

-- Week 3 Tuesday PM - Speed & Throwing (200 throws)
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, distance_meters, notes, position_specific_params) VALUES
    ('66666634-6666-6666-6666-666666666634'::UUID, '44444421-4444-4444-4444-444444444421'::UUID, 1, 4, 3, 120, 'Bodyweight', 10, '3-step acceleration', NULL),
    ('66666634-6666-6666-6666-666666666634'::UUID, '44444422-4444-4444-4444-444444444422'::UUID, 2, 4, 2, 120, 'Bodyweight', 15, 'Deceleration drill - emphasis', NULL),
    ('66666634-6666-6666-6666-666666666634'::UUID, '44444441-4444-4444-4444-444444444441'::UUID, 3, 6, 1, 180, 'Bodyweight', 40, '40m sprint - 6 reps', NULL),
    ('66666634-6666-6666-6666-666666666634'::UUID, '44444453-4444-4444-4444-444444444453'::UUID, 4, NULL, NULL, NULL, 'Time-based', NULL, '200 throws session', '{"total_throws": 200, "breakdown": {"warm_up": 30, "short_routes": 70, "medium_routes": 60, "deep_routes": 40}}'::JSONB)
ON CONFLICT DO NOTHING;

-- Week 3 Wednesday PM - Upper Body (30% BW)
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
    ('66666636-6666-6666-6666-666666666636'::UUID, '44444436-4444-4444-4444-444444444436'::UUID, 1, 4, 10, 75, 'Percentage BW', 30.00, 'Landmine press - 30% BW PROGRESSION'),
    ('66666636-6666-6666-6666-666666666636'::UUID, '44444437-4444-4444-4444-444444444437'::UUID, 2, 4, 12, 60, 'Resistance Band', 0.00, 'Pallof press - heavier band'),
    ('66666636-6666-6666-6666-666666666636'::UUID, '44444406-4444-4444-4444-444444444406'::UUID, 3, 2, NULL, 90, 'Light Dumbbells', 0.00, 'Arm care routine - 12 min')
ON CONFLICT DO NOTHING;

-- Week 3 Friday PM - Power & Throwing (200 throws)
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, distance_meters, notes, position_specific_params) VALUES
    ('66666639-6666-6666-6666-666666666639'::UUID, '44444413-4444-4444-4444-444444444413'::UUID, 1, 4, 10, 90, 'Fixed Weight', 5.00, NULL, 'Med ball throws - 5kg progression', NULL),
    ('66666639-6666-6666-6666-666666666639'::UUID, '44444423-4444-4444-4444-444444444423'::UUID, 2, 4, 8, 90, 'Bodyweight', 0.00, NULL, 'Unilateral jump series', NULL),
    ('66666639-6666-6666-6666-666666666639'::UUID, '44444441-4444-4444-4444-444444444441'::UUID, 3, 4, 1, 180, 'Bodyweight', 0.00, 40, '40m sprints', NULL),
    ('66666639-6666-6666-6666-666666666639'::UUID, '44444453-4444-4444-4444-444444444453'::UUID, 4, NULL, NULL, NULL, 'Time-based', 0.00, NULL, '200 throws session', '{"total_throws": 200, "breakdown": {"game_simulation": 100, "deep_balls": 50, "scramble_throws": 50}}'::JSONB)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- LINK EXERCISES TO WEEK 4 SESSIONS (40% BW - PEAK)
-- =============================================================================

-- Week 4 Monday PM - Lower Body (40% BW - PEAK)
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
    ('66666642-6666-6666-6666-666666666642'::UUID, '44444431-4444-4444-4444-444444444431'::UUID, 1, 4, 6, 120, 'Percentage BW', 40.00, 'PEAK: Trap bar DL - 40% BW'),
    ('66666642-6666-6666-6666-666666666642'::UUID, '44444432-4444-4444-4444-444444444432'::UUID, 2, 4, 8, 120, 'Percentage BW', 40.00, 'PEAK: Front squat - 40% BW'),
    ('66666642-6666-6666-6666-666666666642'::UUID, '44444434-4444-4444-4444-444444444434'::UUID, 3, 4, 8, 75, 'Fixed Weight', 12.00, 'Single-leg RDL - 12kg each hand'),
    ('66666642-6666-6666-6666-666666666642'::UUID, '44444435-4444-4444-4444-444444444435'::UUID, 4, 4, 8, 75, 'Percentage BW', 40.00, 'PEAK: Bulgarian split squat - 40% BW')
ON CONFLICT DO NOTHING;

-- Week 4 Tuesday PM - Speed & Throwing (320 throws - PEAK)
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, distance_meters, notes, position_specific_params) VALUES
    ('66666644-6666-6666-6666-666666666644'::UUID, '44444421-4444-4444-4444-444444444421'::UUID, 1, 5, 3, 120, 'Bodyweight', 10, 'PEAK: 3-step acceleration', NULL),
    ('66666644-6666-6666-6666-666666666644'::UUID, '44444422-4444-4444-4444-444444444422'::UUID, 2, 4, 3, 120, 'Bodyweight', 15, 'Deceleration drill', NULL),
    ('66666644-6666-6666-6666-666666666644'::UUID, '44444441-4444-4444-4444-444444444441'::UUID, 3, 8, 1, 180, 'Bodyweight', 40, 'PEAK: 40m sprint - 8 reps', NULL),
    ('66666644-6666-6666-6666-666666666644'::UUID, '44444454-4444-4444-4444-444444444454'::UUID, 4, NULL, NULL, NULL, 'Time-based', NULL, 'PEAK: 320 throws session', '{"total_throws": 320, "breakdown": {"warm_up": 40, "short_routes": 100, "medium_routes": 100, "deep_routes": 80}}'::JSONB)
ON CONFLICT DO NOTHING;

-- Week 4 Wednesday PM - Upper Body (40% BW - PEAK)
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, notes) VALUES
    ('66666646-6666-6666-6666-666666666646'::UUID, '44444436-4444-4444-4444-444444444436'::UUID, 1, 4, 8, 90, 'Percentage BW', 40.00, 'PEAK: Landmine press - 40% BW'),
    ('66666646-6666-6666-6666-666666666646'::UUID, '44444437-4444-4444-4444-444444444437'::UUID, 2, 4, 10, 75, 'Resistance Band', 0.00, 'PEAK: Pallof press - max band'),
    ('66666646-6666-6666-6666-666666666646'::UUID, '44444406-4444-4444-4444-444444444406'::UUID, 3, 3, NULL, 90, 'Light Dumbbells', 0.00, 'Extended arm care - 15 min')
ON CONFLICT DO NOTHING;

-- Week 4 Friday PM - Tournament Simulation (320 throws + 32×40m sprints)
INSERT INTO session_exercises (session_id, exercise_id, exercise_order, sets, reps, rest_seconds, load_type, load_value, distance_meters, notes, position_specific_params) VALUES
    ('66666649-6666-6666-6666-666666666649'::UUID, '44444413-4444-4444-4444-444444444413'::UUID, 1, 4, 10, 90, 'Fixed Weight', 5.00, NULL, 'Med ball activation', NULL),
    ('66666649-6666-6666-6666-666666666649'::UUID, '44444455-4444-4444-4444-444444444455'::UUID, 2, NULL, NULL, NULL, 'Time-based', 0.00, NULL, 'TOURNAMENT SIMULATION', '{"total_throws": 320, "sprints": 32, "sprint_distance": 40, "simulated_games": 8, "throws_per_game": 40, "sprints_per_game": 4}'::JSONB)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- SELECT tw.week_number, ts.session_name, ts.day_of_week, ts.duration_minutes
-- FROM training_sessions ts
-- JOIN training_weeks tw ON ts.week_id = tw.id
-- WHERE tw.phase_id = '22222221-2222-2222-2222-222222222221'::UUID
-- ORDER BY tw.week_number, ts.day_of_week, ts.session_order;
--
-- SELECT COUNT(*) FROM training_sessions 
-- WHERE week_id IN (
--     '33333332-3333-3333-3333-333333333332'::UUID,
--     '33333333-3333-3333-3333-333333333333'::UUID,
--     '33333334-3333-3333-3333-333333333334'::UUID
-- );
-- Should return 27 sessions (9 per week × 3 weeks)
