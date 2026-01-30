    'Intermediate',
    'Gold-standard eccentric hamstring exercise. 51% reduction in hamstring injuries in meta-analysis.',
    ARRAY['Kneel on padded surface', 'Partner holds ankles firmly', 'Lower body forward under control', 'Use hamstrings to resist gravity', 'Lower as far as possible', 'Use hands to catch if needed', 'Return to start with assist'],
    true,
    'British Journal of Sports Medicine - Systematic Review',
    '21509129',
    '51% reduction in hamstring injuries across multiple studies',
    51.00,
    NULL,
    3,
    6,
    2,
    120,
    ARRAY['Hamstrings', 'Glutes'],
    ARRAY['Acute hamstring strain', 'Knee pain'],
    10,
    'A'
),
-- 2. Eccentric Heel Drop (Alfredson Protocol)
(
    'Eccentric Heel Drop (Alfredson Protocol)',
    'Injury Prevention',
    'Alfredson',
    'Beginner',
    'Evidence-based protocol for Achilles tendinopathy. 89% success rate in original study.',
    ARRAY['Stand on edge of step on affected leg', 'Rise up on toes (concentric)', 'Slowly lower heel below step level', 'Take 3 seconds for lowering phase', 'Use other leg to return to start', 'Perform with knee straight AND bent'],
    true,
    'American Journal of Sports Medicine',
    '9617944',
    '89% success rate for chronic Achilles tendinopathy treatment',
    89.00,
    3,
    3,
    15,
    14,
    60,
    ARRAY['Gastrocnemius', 'Soleus', 'Achilles tendon'],
    ARRAY['Acute Achilles rupture', 'Insertional Achilles tendinopathy'],
    10,
    'A'
),
-- 3. Copenhagen Adductor Exercise
(
    'Copenhagen Adductor Exercise',
    'Injury Prevention',
    'Copenhagen',
    'Intermediate',
    'Adductor strengthening exercise. 41% reduction in groin injuries in football players.',
    ARRAY['Side plank position with top leg on bench', 'Partner or bench supports top leg', 'Lift bottom leg up to meet top leg', 'Hold for 2 seconds', 'Lower with control', 'Progress to full Copenhagen plank'],
    true,
    'British Journal of Sports Medicine',
    '28687474',
    '41% reduction in groin injuries in football players',
    41.00,
    2,
    3,
    8,
    3,
    90,
    ARRAY['Adductors', 'Core', 'Hip stabilizers'],
    ARRAY['Acute groin strain', 'Hip impingement'],
    9,
    'A'
);

-- =============================================================================
-- 8. SEED DATA: FIRST-STEP ACCELERATION (9 exercises)
-- =============================================================================
INSERT INTO plyometrics_exercises (
    exercise_name, exercise_category, difficulty_level, description, instructions,
    research_based, research_source, intensity_level, volume_recommendations,
    rest_periods, equipment_needed, space_requirements, effectiveness_rating,
    performance_improvements, injury_risk_rating, position_applications
) VALUES
(
    'Three-Point Start Sprint',
    'First-Step Acceleration',
    'Intermediate',
    'Football-specific start position for explosive first step development.',
    ARRAY['Assume 3-point stance', 'Weight on front hand and balls of feet', 'On cue, drive out explosively', 'First step should be short and powerful', 'Maintain forward lean through 10m'],
    true,
    'Next Level Athletics - https://nextlevelathleticsusa.com',
    'High',
    ARRAY['5-6 sets', '4-6 reps'],
    ARRAY['90-120 seconds between sets'],
    ARRAY['None'],
    '15m runway',
    9,
    '{"first_step": "20-30%", "start_explosiveness": "improved"}',
    'Low',
    '{"All": "Game-specific start"}'
),
(
    'Band-Resisted First-Step Starts',
    'First-Step Acceleration',
    'Intermediate',
    'Resistance band provides overspeed assistance or resistance for first-step training.',
    ARRAY['Attach band to waist and anchor', 'Assume athletic stance', 'Drive against band resistance', 'Focus on powerful first step', 'Accelerate through 5-10m'],
    true,
    'Next Level Athletics - https://nextlevelathleticsusa.com',
    'High',
    ARRAY['4-5 sets', '4-6 reps'],
    ARRAY['90 seconds between sets'],
    ARRAY['Resistance band', 'Anchor point'],
    '15m runway',
    9,
    '{"first_step_power": "25-35%", "acceleration": "improved"}',
    'Low',
    '{"All": "First-step development"}'
),
(
    'Lateral Strap Release Sprint',
    'First-Step Acceleration',
    'Advanced',
    'Partner releases strap for reactive lateral-to-linear acceleration.',
    ARRAY['Partner holds strap attached to waist', 'Athlete in lateral shuffle position', 'Partner releases strap randomly', 'Athlete sprints forward on release', 'React and accelerate maximally'],
    true,
    'Relentless Athletics - https://relentlessathleticsllc.com',
    'Very High',
    ARRAY['4 sets', '4-6 reps each direction'],
    ARRAY['120 seconds between sets'],
    ARRAY['Release strap', 'Partner'],
    '20m x 10m',
    9,
    '{"reactive_first_step": "35-45%", "lateral_to_linear": "improved"}',
    'Moderate',
    '{"DB": "Break on ball", "WR": "Release moves"}'
),
(
    'Reactive Ball Drop Sprint',
    'First-Step Acceleration',
    'Intermediate',
    'React to ball drop and sprint to catch. Develops visual-motor reaction and first step.',
    ARRAY['Partner holds tennis ball at shoulder height', 'Athlete in athletic stance 5m away', 'Partner drops ball without warning', 'Sprint to catch ball before second bounce', 'Progress distance as skill improves'],
    true,
    'Visual-motor reaction research',
    'High',
    ARRAY['4-5 sets', '6-8 reps'],
    ARRAY['60 seconds between reps'],
    ARRAY['Tennis ball'],
    '10m x 5m',
    9,
    '{"reaction_time": "15-20%", "first_step": "improved"}',
    'Low',
    '{"All": "Reactive acceleration"}'
),
(
    'Mirror Start Drill',
    'First-Step Acceleration',
    'Advanced',
    'Mirror partner movements with reactive first steps. Game-realistic acceleration training.',
    ARRAY['Face partner 3m apart', 'Partner moves in any direction', 'Mirror movements with explosive first step', 'React to direction changes', 'Maintain athletic position'],
    true,
    'Reactive agility research',
    'High',
    ARRAY['4 sets', '30-45 seconds per set'],
    ARRAY['90-120 seconds between sets'],
    ARRAY['Cones for boundary'],
    '10m x 10m',
    9,
    '{"reactive_agility": "25-35%", "first_step": "20-30%"}',
    'Moderate',
    '{"DB": "Coverage reaction", "WR": "Route adjustments"}'
),
(
    'Shuffle to Sprint Transition',
    'First-Step Acceleration',
    'Intermediate',
    'Transition from lateral shuffle to forward sprint. Essential defensive skill.',
    ARRAY['Start in lateral shuffle', 'On cue, plant outside foot', 'Drive forward explosively', 'Maintain low center of gravity', 'Accelerate through 10m'],
    true,
    'Defensive movement patterns research',
    'High',
    ARRAY['4-5 sets', '5-6 reps each direction'],
    ARRAY['90 seconds between sets'],
    ARRAY['Cones'],
    '15m x 10m',
    9,
    '{"transition_speed": "18-25%", "defensive_breaks": "improved"}',
    'Moderate',
    '{"DB": "Break on ball", "LB": "Pursuit angles"}'
),
(
    'Lateral Kneeling Start Sprint',
    'First-Step Acceleration',
    'Intermediate',
    'Start from kneeling position with lateral orientation. Develops explosive hip rotation.',
    ARRAY['Kneel perpendicular to sprint direction', 'On cue, rotate hips and stand explosively', 'Drive into sprint immediately', 'Focus on hip rotation speed', 'Accelerate through 10m'],
    true,
    'TrainHeroic - https://trainheroic.com',
    'High',
    ARRAY['4 sets', '4-6 reps each direction'],
    ARRAY['90 seconds between sets'],
    ARRAY['Pad for knees'],
    '15m runway',
    8,
    '{"hip_rotation": "improved", "first_step": "15-20%"}',
    'Low',
    '{"All": "Rotational acceleration"}'
),
(
    'Prone Start Sprint',
    'First-Step Acceleration',
    'Intermediate',
    'Start from lying face-down position. Maximum ground-to-sprint development.',
    ARRAY['Lie face down on ground', 'Hands by shoulders in push-up position', 'On cue, explosively push up and sprint', 'Transition as fast as possible', 'Accelerate through 10-15m'],
    true,
    'Ground-to-sprint transition research',
    'High',
    ARRAY['4-5 sets', '4-6 reps'],
    ARRAY['90 seconds between reps'],
    ARRAY['None'],
    '20m runway',
    8,
    '{"ground_reaction": "improved", "explosive_start": "enhanced"}',
    'Low',
    '{"All": "Recovery acceleration"}'
),
(
    'Crossover Start Sprint',
    'First-Step Acceleration',
    'Intermediate',
    'Start with crossover step for multi-directional acceleration.',
    ARRAY['Stand sideways to sprint direction', 'Cross near foot over far foot', 'Drive explosively into sprint', 'Rotate hips quickly', 'Accelerate through 10m'],
    true,
    'Multi-directional acceleration research',
    'High',
    ARRAY['4 sets', '5-6 reps each direction'],
    ARRAY['90 seconds between sets'],
    ARRAY['None'],
    '15m runway',
    8,
    '{"crossover_speed": "improved", "multi-directional": "enhanced"}',
    'Moderate',
    '{"DB": "Hip flip", "WR": "Release moves"}'
);

-- =============================================================================
-- 9. SEED DATA: FAST-TWITCH DEVELOPMENT (11 exercises)
-- =============================================================================
INSERT INTO plyometrics_exercises (
    exercise_name, exercise_category, difficulty_level, description, instructions,
    research_based, research_source, intensity_level, volume_recommendations,
    rest_periods, equipment_needed, space_requirements, effectiveness_rating,
    performance_improvements, injury_risk_rating, position_applications
) VALUES
(
    'Hill Sprint (6-12% Grade)',
    'Fast-Twitch Development',
    'Intermediate',
    'Incline sprints maximize Type II fiber recruitment and horizontal force production.',
    ARRAY['Find hill with 6-12% grade', 'Sprint 20-40m at maximum effort', 'Walk back for recovery', 'Maintain sprint mechanics', 'Drive arms powerfully'],
    true,
    'FootFitLab - https://footfitlab.com',
    'Very High',
    ARRAY['6-10 sprints', '20-40m each'],
    ARRAY['2-3 minutes full recovery'],
    ARRAY['Hill with appropriate grade'],
    'Hill with 40m+ runway',
    10,
    '{"type_ii_recruitment": "significant", "sprint_speed": "8-15%"}',
    'Moderate',
    '{"All": "Speed development"}'
),
(
    'Contrast Training: Squat to Vertical Jump',
    'Fast-Twitch Development',
    'Advanced',
    'Post-activation potentiation: heavy squat followed immediately by vertical jump.',
    ARRAY['Perform 3-5 rep heavy squat (80-90% 1RM)', 'Rest 15-30 seconds', 'Perform 3-5 maximal vertical jumps', 'Focus on explosive intent', 'Rest 3-4 minutes before next set'],
    true,
    'Post-Activation Potentiation research',
    'Very High',
    ARRAY['3-4 contrast sets'],
    ARRAY['3-4 minutes between contrast pairs'],
    ARRAY['Squat rack', 'Barbell'],
    'Gym',
    10,
    '{"vertical_jump": "10-18%", "power_output": "15-25%"}',
    'Moderate',
    '{"All": "Power development"}'
),
(
    'Trap Bar Jump',
    'Fast-Twitch Development',
    'Intermediate',
    'Loaded jump with trap bar. Peak power exercise for lower body.',
    ARRAY['Stand in trap bar with moderate load (30-40% 1RM)', 'Perform countermovement', 'Jump explosively with maximal intent', 'Land softly and reset', 'Focus on bar velocity'],
    true,
    'Peak power research',
    'High',
    ARRAY['4-5 sets', '3-5 reps'],
    ARRAY['2-3 minutes between sets'],
    ARRAY['Trap bar', 'Weights'],
    'Gym',
    10,
    '{"peak_power": "20-30%", "jump_height": "improved"}',
    'Moderate',
    '{"All": "Power development"}'
),
(
    'Broad Jump to Vertical Jump',
    'Fast-Twitch Development',
    'Intermediate',
    'Horizontal to vertical power redirection. Develops multi-planar explosiveness.',
    ARRAY['Perform maximal broad jump', 'Land and immediately jump vertically', 'Minimize ground contact time', 'Focus on power redirection', 'Stick final landing'],
    true,
    'Power redirection research',
    'High',
    ARRAY['4 sets', '4-6 reps'],
    ARRAY['90-120 seconds between sets'],
    ARRAY['None'],
    '10m x 5m',
    9,
    '{"power_redirection": "improved", "reactive_strength": "enhanced"}',
    'Moderate',
    '{"WR": "Route breaks", "DB": "Break on ball"}'
),
(
    'Jump Squat (Bodyweight)',
    'Fast-Twitch Development',
    'Beginner',
    'Foundation plyometric for lower body power. Develops jump mechanics.',
    ARRAY['Squat to parallel', 'Explode upward maximally', 'Extend hips, knees, ankles fully', 'Land softly in squat position', 'Reset and repeat'],
    true,
    'Ballistic training research',
    'Moderate',
    ARRAY['3-4 sets', '8-10 reps'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['None'],
    'Minimal',
    8,
    '{"jump_height": "10-15%", "power_foundation": "established"}',
    'Low',
    '{"All": "Foundation exercise"}'
),
(
    'Explosive Step-Up',
    'Fast-Twitch Development',
    'Intermediate',
    'Unilateral explosive step-up for single-leg power.',
    ARRAY['Place one foot on box (knee at 90°)', 'Drive up explosively', 'Achieve triple extension', 'Land softly on box', 'Step down and repeat'],
    true,
    'Unilateral power research',
    'High',
    ARRAY['3-4 sets', '6-8 reps each leg'],
    ARRAY['60-90 seconds between legs'],
    ARRAY['Plyo box (40-50cm)'],
    'Minimal',
    8,
    '{"single_leg_power": "15-20%", "step_explosiveness": "improved"}',
    'Low',
    '{"All": "Unilateral development"}'
),
(
    'Kettlebell Swing',
    'Fast-Twitch Development',
    'Beginner',
    'Hip extension power developer. Foundation for explosive hip drive.',
    ARRAY['Stand with feet shoulder-width', 'Hinge at hips, grip kettlebell', 'Drive hips forward explosively', 'Let momentum swing bell to shoulder height', 'Control descent and repeat'],
    true,
    'Hip extension power research',
    'Moderate',
    ARRAY['3-4 sets', '12-15 reps'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['Kettlebell'],
    'Minimal',
    8,
    '{"hip_extension": "improved", "posterior_chain": "strengthened"}',
    'Low',
    '{"All": "Hip power foundation"}'
),
(
    'Plyometric Push-Up',
    'Fast-Twitch Development',
    'Intermediate',
    'Upper body reactive power. Develops pushing explosiveness.',
    ARRAY['Assume push-up position', 'Lower chest to ground', 'Explode up so hands leave ground', 'Land softly and absorb', 'Immediately repeat'],
    true,
    'Upper body reactive power research',
    'High',
    ARRAY['3-4 sets', '6-10 reps'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['None'],
    'Minimal',
    8,
    '{"upper_body_power": "15-20%", "pushing_explosiveness": "improved"}',
    'Moderate',
    '{"QB": "Throwing power", "All": "Upper body development"}'
),
(
    'Ladder Speed Drill (In-Out Pattern)',
    'Fast-Twitch Development',
    'Beginner',
    'Foot speed and coordination drill. Develops neuromuscular efficiency.',
    ARRAY['Set up agility ladder', 'Step in-out of each square rapidly', 'Maintain athletic posture', 'Focus on quick foot contacts', 'Progress speed as coordination improves'],
    true,
    'FootFitLab - https://footfitlab.com',
    'Moderate',
    ARRAY['4-6 sets', '2 passes per set'],
    ARRAY['30-45 seconds between sets'],
    ARRAY['Agility ladder'],
    '10m x 1m',
    7,
    '{"foot_speed": "improved", "coordination": "enhanced"}',
    'Low',
    '{"All": "Coordination foundation"}'
),
(
    'Explosive Medicine Ball Chest Pass',
    'Fast-Twitch Development',
    'Beginner',
    'Upper body power throw. Develops chest and tricep explosiveness.',
    ARRAY['Hold med ball at chest', 'Step forward and throw explosively', 'Extend arms fully on release', 'Follow through with body', 'Partner returns ball'],
    true,
    'TrainHeroic - https://trainheroic.com',
    'Moderate',
    ARRAY['3-4 sets', '8-10 reps'],
    ARRAY['60 seconds between sets'],
    ARRAY['Medicine ball (3-5kg)', 'Partner or wall'],
    '5m x 5m',
    7,
    '{"upper_body_power": "improved", "throwing_velocity": "enhanced"}',
    'Low',
    '{"QB": "Throwing power", "All": "Upper body power"}'
),
(
    'Reactive Drop and Catch',
    'Fast-Twitch Development',
    'Intermediate',
    'Upper body reactive training. Develops hand speed and reaction.',
    ARRAY['Partner drops ball from height', 'Catch ball as quickly as possible', 'React to visual stimulus', 'Progress to multiple balls', 'Add directional variation'],
    true,
    'Upper body reactive training research',
    'Moderate',
    ARRAY['3-4 sets', '10-12 catches'],
    ARRAY['45-60 seconds between sets'],
    ARRAY['Tennis balls', 'Partner'],
    'Minimal',
    7,
    '{"hand_speed": "improved", "reaction_time": "15-20%"}',
    'Low',
    '{"WR": "Catching reaction", "DB": "Ball skills"}'
);

-- =============================================================================
-- 10. SEED DATA: SINGLE-LEG PLYOMETRICS (9 exercises)
-- =============================================================================
INSERT INTO plyometrics_exercises (
    exercise_name, exercise_category, difficulty_level, description, instructions,
    research_based, research_source, intensity_level, volume_recommendations,
    rest_periods, equipment_needed, space_requirements, effectiveness_rating,
    performance_improvements, injury_risk_rating, position_applications
) VALUES
(
    'Single-Leg Depth Jump',
    'Single-Leg Plyometrics',
    'Elite',
    'Advanced reactive strength exercise. Elite-level single-leg power development.',
    ARRAY['Stand on box (20-30cm) on one leg', 'Step off and land on same leg', 'Immediately jump vertically', 'Minimize ground contact time', 'Stick landing on single leg'],
    true,
    'Reactive strength research',
    'Very High',
    ARRAY['3 sets', '3-4 reps each leg'],
    ARRAY['2-3 minutes between sets'],
    ARRAY['Plyo box (20-30cm)'],
    '5m x 3m',
    10,
    '{"reactive_strength": "25-35%", "single_leg_power": "significant"}',
    'High',
    '{"All": "Elite power development"}'
),
(
    'Single-Leg Triple Hop for Distance',
    'Single-Leg Plyometrics',
    'Advanced',
    'Gold-standard return-to-sport test. Measures single-leg horizontal power.',
    ARRAY['Stand on one leg', 'Perform 3 consecutive hops forward', 'Land on same leg each hop', 'Measure total distance', 'Compare limbs for symmetry'],
    true,
    'ACL return-to-sport research',
    'High',
    ARRAY['3-4 sets', '3 reps each leg'],
    ARRAY['90-120 seconds between legs'],
    ARRAY['Measuring tape'],
    '15m runway',
    10,
    '{"single_leg_power": "assessment", "limb_symmetry": "measured"}',
    'Moderate',
    '{"All": "Return-to-sport metric"}'
),
(
    'Single-Leg Forward Bounds',
    'Single-Leg Plyometrics',
    'Advanced',
    'Horizontal power development on single leg. Addresses bilateral deficit.',
    ARRAY['Start on one leg', 'Bound forward maximally', 'Land on same leg', 'Continue for 4-6 bounds', 'Focus on distance and control'],
    true,
    'Horizontal power research',
    'High',
    ARRAY['3-4 sets', '4-6 bounds each leg'],
    ARRAY['90-120 seconds between sets'],
    ARRAY['None'],
    '20m runway',
    9,
    '{"horizontal_power": "20-30%", "bilateral_deficit": "reduced"}',
    'Moderate',
    '{"WR": "Route acceleration", "DB": "Break acceleration"}'
),
(
    'Single-Leg Diagonal Hop Matrix',
    'Single-Leg Plyometrics',
    'Advanced',
    'Multi-directional single-leg hops. Develops stability in all planes.',
    ARRAY['Stand on one leg at center', 'Hop forward-right, return', 'Hop forward-left, return', 'Hop backward-right, return', 'Hop backward-left, return', 'Stick each landing'],
    true,
    'Multi-directional stability research',
    'High',
    ARRAY['3 sets', '1 full matrix each leg'],
    ARRAY['90 seconds between legs'],
    ARRAY['Tape for markers'],
    '3m x 3m',
    9,
    '{"multi_directional_stability": "improved", "proprioception": "enhanced"}',
    'Moderate',
    '{"All": "Multi-planar stability"}'
),
(
    'Single-Leg Broad Jump (Stick Landing)',
    'Single-Leg Plyometrics',
    'Advanced',
    'Return-to-sport metric. Single-leg horizontal power with controlled landing.',
    ARRAY['Stand on one leg', 'Perform maximal broad jump', 'Land on same leg', 'Stick landing for 3 seconds', 'Measure distance and landing quality'],
    true,
    'Return-to-sport research',
    'High',
    ARRAY['3-4 sets', '4-5 reps each leg'],
    ARRAY['60-90 seconds between legs'],
    ARRAY['Measuring tape'],
    '10m runway',
    9,
    '{"single_leg_power": "measured", "landing_control": "assessed"}',
    'Moderate',
    '{"All": "Return-to-sport assessment"}'
),
(
    'Single-Leg Lateral Hop Series',
    'Single-Leg Plyometrics',
    'Intermediate',
    'ACL injury prevention exercise. Develops frontal plane stability.',
    ARRAY['Stand on one leg', 'Hop laterally over line', 'Land on same leg', 'Immediately hop back', 'Continue for prescribed reps'],
    true,
    'ACL injury prevention research',
    'Moderate',
    ARRAY['3-4 sets', '10-12 hops each leg'],
    ARRAY['60 seconds between legs'],
    ARRAY['Tape line or cone'],
    '2m x 2m',
    8,
    '{"lateral_stability": "improved", "acl_risk": "reduced"}',
    'Moderate',
    '{"All": "Injury prevention"}'
),
(
    'Single-Leg Hurdle Hop',
    'Single-Leg Plyometrics',
    'Intermediate',
    'Reactive single-leg jumping over obstacles. Develops reactive strength.',
    ARRAY['Set up 3-5 low hurdles (15-30cm)', 'Hop over each on one leg', 'Minimize ground contact time', 'Land softly and continue', 'Progress hurdle height'],
    true,
    'Reactive strength development research',
    'High',
    ARRAY['3-4 sets', '3-5 hurdles each leg'],
    ARRAY['90 seconds between sets'],
    ARRAY['Mini hurdles (15-30cm)'],
    '10m x 2m',
    8,
    '{"reactive_strength": "improved", "single_leg_coordination": "enhanced"}',
    'Moderate',
    '{"All": "Reactive development"}'
),
(
    'Single-Leg Rotational Hop',
    'Single-Leg Plyometrics',
    'Advanced',
    'Transverse plane single-leg control. Develops rotational stability.',
    ARRAY['Stand on one leg', 'Hop and rotate 90 degrees', 'Land on same leg', 'Stick landing', 'Progress to 180-degree rotations'],
    true,
    'Transverse plane control research',
    'High',
    ARRAY['3 sets', '4-6 reps each direction each leg'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['None'],
    '3m x 3m',
    8,
    '{"rotational_control": "improved", "proprioception": "enhanced"}',
    'Moderate',
    '{"DB": "Hip flip control", "WR": "Route break stability"}'
),
(
    'Single-Leg Pogos',
    'Single-Leg Plyometrics',
    'Intermediate',
    'Foundation single-leg reactive drill. Develops ankle stiffness on single leg.',
    ARRAY['Stand on one leg', 'Perform quick, small hops', 'Stay on ball of foot', 'Minimize ground contact time', 'Maintain upright posture'],
    true,
    'Ankle stiffness research',
    'Moderate',
    ARRAY['3-4 sets', '15-20 hops each leg'],
    ARRAY['45-60 seconds between legs'],
    ARRAY['None'],
    'Minimal',
    7,
    '{"ankle_stiffness": "improved", "reactive_foundation": "established"}',
    'Low',
    '{"All": "Foundation reactive"}'
);

-- =============================================================================
-- 11. SEED DATA: REACTIVE ECCENTRICS (9 exercises)
-- =============================================================================
INSERT INTO plyometrics_exercises (
    exercise_name, exercise_category, difficulty_level, description, instructions,
    research_based, research_source, intensity_level, volume_recommendations,
    rest_periods, equipment_needed, space_requirements, effectiveness_rating,
    performance_improvements, injury_risk_rating, position_applications
) VALUES
(
    'Altitude Knee Lift Tuck (AKLT)',
    'Reactive Eccentrics',
    'Advanced',
    'Drop from height with immediate tuck jump. Develops reactive strength index.',
    ARRAY['Stand on box (30-40cm)', 'Step off and land', 'Immediately perform tuck jump', 'Bring knees to chest', 'Land softly and reset'],
    true,
    'Reactive strength index research',
    'Very High',
    ARRAY['3-4 sets', '4-6 reps'],
    ARRAY['2-3 minutes between sets'],
    ARRAY['Plyo box (30-40cm)'],
    '5m x 3m',
    9,
    '{"reactive_strength_index": "18-25%", "ground_contact_time": "reduced"}',
    'High',
    '{"All": "Advanced reactive"}'
),
(
    'Reactive Single-Leg Hop Progression',
    'Reactive Eccentrics',
    'Advanced',
    'ACL prevention protocol. Progressive single-leg reactive training.',
    ARRAY['Start with double-leg hops', 'Progress to single-leg', 'Add directional changes', 'Include perturbations', 'Build volume progressively'],
    true,
    'ACL prevention protocols',
    'High',
    ARRAY['3-4 sets', '6-10 hops per progression'],
    ARRAY['90 seconds between sets'],
    ARRAY['None'],
    '10m x 5m',
    9,
    '{"acl_risk_reduction": "significant", "single_leg_control": "improved"}',
    'Moderate',
    '{"All": "Injury prevention"}'
),
(
    'Hurdle Hop Series (Reactive)',
    'Reactive Eccentrics',
    'Intermediate',
    'Continuous hurdle hops with minimal ground contact. Classic plyometric drill.',
    ARRAY['Set up 5-8 hurdles (30-45cm)', 'Hop over each continuously', 'Minimize ground contact', 'Maintain rhythm', 'Land softly on final hurdle'],
    true,
    'Plyometric research',
    'High',
    ARRAY['4-5 sets', '5-8 hurdles per set'],
    ARRAY['90-120 seconds between sets'],
    ARRAY['Hurdles (30-45cm)'],
    '15m x 2m',
    9,
    '{"reactive_power": "improved", "rhythm": "enhanced"}',
    'Moderate',
    '{"All": "Reactive foundation"}'
),
(
    'Eccentric Accentuated Split Squat Jump',
    'Reactive Eccentrics',
    'Advanced',
    'Slow eccentric descent followed by explosive jump. Develops eccentric strength and power.',
    ARRAY['Assume split squat position', 'Lower slowly over 3 seconds', 'Explode up maximally', 'Switch legs in air', 'Land in opposite split stance'],
    true,
    'Eccentric training research',
    'High',
    ARRAY['3-4 sets', '6-8 reps total'],
    ARRAY['90 seconds between sets'],
    ARRAY['None'],
    'Minimal',
    9,
    '{"eccentric_strength": "improved", "power_output": "enhanced"}',
    'Moderate',
    '{"All": "Eccentric power"}'
),
(
    'Reverse Lunge to Knee Drive Jump',
    'Reactive Eccentrics',
    'Intermediate',
    'Lunge to explosive knee drive. Develops sprint acceleration mechanics.',
    ARRAY['Step back into reverse lunge', 'Drive up explosively', 'Bring knee up high', 'Jump off front leg', 'Land softly and repeat'],
    true,
    'Sprint acceleration research',
    'High',
    ARRAY['3-4 sets', '6-8 reps each leg'],
    ARRAY['60-90 seconds between legs'],
    ARRAY['None'],
    'Minimal',
    8,
    '{"knee_drive": "improved", "acceleration_mechanics": "enhanced"}',
    'Low',
    '{"All": "Acceleration development"}'
),
(
    'Tuck Jump',
    'Reactive Eccentrics',
    'Intermediate',
    'ACL screening tool and training exercise. Assesses landing mechanics.',
    ARRAY['Stand with feet shoulder-width', 'Jump and bring knees to chest', 'Land softly with control', 'Immediately repeat', 'Focus on landing symmetry'],
    true,
    'ACL screening research',
    'Moderate',
    ARRAY['3-4 sets', '8-10 reps'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['None'],
    'Minimal',
    8,
    '{"landing_mechanics": "assessed", "lower_body_power": "developed"}',
    'Moderate',
    '{"All": "Screening and development"}'
),
(
    'Snap Down to Vertical Jump',
    'Reactive Eccentrics',
    'Intermediate',
    'Quick drop followed by immediate vertical jump. Develops reactive power.',
    ARRAY['Stand tall on toes', 'Quickly drop into quarter squat', 'Immediately explode vertically', 'Minimize ground contact', 'Land softly and reset'],
    true,
    'Reactive power research',
    'High',
    ARRAY['4 sets', '6-8 reps'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['None'],
    'Minimal',
    8,
    '{"reactive_power": "improved", "ground_contact": "reduced"}',
    'Low',
    '{"All": "Reactive development"}'
),
(
    'Pogos (Ankle Stiffness Drill)',
    'Reactive Eccentrics',
    'Beginner',
    'Foundation reactive drill. Develops ankle stiffness for all plyometrics.',
    ARRAY['Stand tall', 'Perform quick, small hops', 'Stay on balls of feet', 'Keep legs relatively straight', 'Minimize ground contact time'],
    true,
    'Foundation reactive research',
    'Low',
    ARRAY['3-4 sets', '20-30 hops'],
    ARRAY['30-45 seconds between sets'],
    ARRAY['None'],
    'Minimal',
    7,
    '{"ankle_stiffness": "foundation", "reactive_ability": "introduced"}',
    'Low',
    '{"All": "Foundation drill"}'
),
(
    'Med Ball Slam (Reactive Power)',
    'Reactive Eccentrics',
    'Beginner',
    'Full-body power exercise. Develops explosive hip extension and core power.',
    ARRAY['Hold med ball overhead', 'Slam ball into ground forcefully', 'Use full body extension', 'Catch ball on bounce', 'Immediately repeat'],
    true,
    'Full-body power research',
    'Moderate',
    ARRAY['3-4 sets', '8-12 reps'],
    ARRAY['60 seconds between sets'],
    ARRAY['Slam ball (5-10kg)'],
    '3m x 3m',
    7,
    '{"full_body_power": "improved", "core_strength": "enhanced"}',
    'Low',
    '{"All": "Power foundation"}'
);

-- =============================================================================
-- 12. SEED DATA: ROTATIONAL POWER (4 exercises)
-- =============================================================================
INSERT INTO plyometrics_exercises (
    exercise_name, exercise_category, difficulty_level, description, instructions,
    research_based, research_source, intensity_level, volume_recommendations,
    rest_periods, equipment_needed, space_requirements, effectiveness_rating,
    performance_improvements, injury_risk_rating, position_applications
) VALUES
(
    'Rotational Med Ball Throw (Perpendicular)',
    'Rotational Power',
    'Intermediate',
    'Hip-to-hand power transfer. Essential for throwing athletes.',
    ARRAY['Stand perpendicular to wall', 'Hold med ball at hip', 'Rotate hips explosively', 'Transfer power through core', 'Release ball into wall'],
    true,
    'Kinetic chain research',
    'High',
    ARRAY['3-4 sets', '8-10 reps each side'],
    ARRAY['60-90 seconds between sides'],
    ARRAY['Medicine ball (3-5kg)', 'Wall'],
    '5m x 3m',
    9,
    '{"rotational_velocity": "15-25%", "throwing_velocity": "8-15%"}',
    'Low',
    '{"QB": "Throwing power", "All": "Rotational development"}'
),
(
    'Drop-Step Scoop Throw',
    'Rotational Power',
    'Intermediate',
    'Combines footwork with rotational throw. Game-specific power transfer.',
    ARRAY['Start facing away from target', 'Drop step and rotate', 'Scoop ball from low position', 'Throw explosively at target', 'Follow through completely'],
    true,
    'Overtime Athletes - https://blog.overtimeathletes.com',
    'High',
    ARRAY['3-4 sets', '6-8 reps each side'],
    ARRAY['90 seconds between sides'],
    ARRAY['Medicine ball (3-5kg)', 'Target'],
    '5m x 5m',
    9,
    '{"rotational_power": "improved", "footwork_integration": "enhanced"}',
    'Low',
    '{"QB": "Rollout throws", "All": "Integrated power"}'
),
(
    'Landmine Press with Rotation',
    'Rotational Power',
    'Intermediate',
    'Rotational pressing pattern. Develops shoulder and core integration.',
    ARRAY['Set up landmine in corner', 'Hold end of barbell at shoulder', 'Press up while rotating', 'Extend arm fully', 'Return with control'],
    true,
    'Barbend - https://barbend.com',
    'Moderate',
    ARRAY['3-4 sets', '8-10 reps each side'],
    ARRAY['60-90 seconds between sides'],
    ARRAY['Barbell', 'Landmine attachment'],
    'Gym',
    8,
    '{"rotational_strength": "improved", "shoulder_stability": "enhanced"}',
    'Low',
    '{"QB": "Throwing strength", "All": "Rotational strength"}'
),
(
    'Explosive Lateral Step-Up with Rotation',
    'Rotational Power',
    'Intermediate',
    'Combines lateral power with rotation. Multi-planar power development.',
    ARRAY['Stand beside box (30-40cm)', 'Step up laterally', 'Rotate torso at top', 'Drive knee up', 'Step down with control'],
    true,
    'PubMed 8281177 - https://pubmed.ncbi.nlm.nih.gov/8281177/',
    'High',
    ARRAY['3 sets', '6-8 reps each side'],
    ARRAY['90 seconds between sides'],
    ARRAY['Plyo box (30-40cm)'],
    '3m x 3m',
    8,
    '{"lateral_power": "improved", "rotational_integration": "enhanced"}',
    'Moderate',
    '{"All": "Multi-planar power"}'
);

-- =============================================================================
-- 13. SEED DATA: SPRINT MECHANICS (4 exercises)
-- =============================================================================
INSERT INTO plyometrics_exercises (
    exercise_name, exercise_category, difficulty_level, description, instructions,
    research_based, research_source, intensity_level, volume_recommendations,
    rest_periods, equipment_needed, space_requirements, effectiveness_rating,
    performance_improvements, injury_risk_rating, position_applications
) VALUES
(
    'Wicket Runs (Stride Frequency Drill)',
    'Sprint Mechanics',
    'Advanced',
    'Mini hurdles at specific spacing to optimize stride frequency.',
    ARRAY['Set wickets at 1.5-2m spacing', 'Sprint through at high speed', 'One step between each wicket', 'Focus on quick ground contacts', 'Maintain upright posture'],
    true,
    'Elite sprint coaching research',
    'High',
    ARRAY['4-6 sets', '20-30m per set'],
    ARRAY['2-3 minutes between sets'],
    ARRAY['Wickets or mini hurdles (6-10)'],
    '40m x 2m',
    9,
    '{"stride_frequency": "10-15%", "top_speed": "5-8%"}',
    'Moderate',
    '{"All": "Speed development"}'
),
(
    'A-Skip Drill',
    'Sprint Mechanics',
    'Beginner',
    'Foundation sprint drill. Develops knee drive and rhythm.',
    ARRAY['Skip with exaggerated knee drive', 'Drive knee to waist height', 'Maintain arm swing', 'Stay on balls of feet', 'Progress distance gradually'],
    true,
    'Foundation sprint mechanics',
    'Low',
    ARRAY['3-4 sets', '20-30m'],
    ARRAY['45-60 seconds between sets'],
    ARRAY['None'],
    '30m runway',
    8,
    '{"sprint_mechanics": "foundation", "coordination": "improved"}',
    'Low',
    '{"All": "Mechanics foundation"}'
),
(
    'B-Skip Drill',
    'Sprint Mechanics',
    'Intermediate',
    'Extension drill for foot strike mechanics. Develops pawing action.',
    ARRAY['Skip with knee drive', 'Extend leg forward', 'Pull foot back actively', 'Strike ground under hips', 'Maintain rhythm'],
    true,
    'Foot strike mechanics research',
    'Moderate',
    ARRAY['3-4 sets', '20-30m'],
    ARRAY['60 seconds between sets'],
    ARRAY['None'],
    '30m runway',
    8,
    '{"foot_strike": "improved", "pawing_action": "developed"}',
    'Low',
    '{"All": "Mechanics development"}'
),
(
    'Straight-Leg Bounds (Stiff-Leg Running)',
    'Sprint Mechanics',
    'Intermediate',
    'Develops ground contact mechanics and hamstring activation.',
    ARRAY['Run with relatively straight legs', 'Focus on pawing action', 'Pull foot back actively', 'Strike ground under hips', 'Maintain forward lean'],
    true,
    'Pawing action development research',
    'Moderate',
    ARRAY['3-4 sets', '20-30m'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['None'],
    '30m runway',
    8,
    '{"ground_contact": "improved", "hamstring_activation": "enhanced"}',
    'Moderate',
    '{"All": "Sprint mechanics"}'
);

-- =============================================================================
-- 14. SEED DATA: LATERAL POWER (3 exercises)
-- =============================================================================
INSERT INTO plyometrics_exercises (
    exercise_name, exercise_category, difficulty_level, description, instructions,
    research_based, research_source, intensity_level, volume_recommendations,
    rest_periods, equipment_needed, space_requirements, effectiveness_rating,
    performance_improvements, injury_risk_rating, position_applications
) VALUES
(
    'Skater Bounds (Lateral Reactive)',
    'Lateral Power',
    'Intermediate',
    'Lateral bounding for frontal plane power. Essential for COD.',
    ARRAY['Start on one leg', 'Bound laterally to opposite leg', 'Land softly and absorb', 'Immediately bound back', 'Maximize lateral distance'],
    true,
    'Lateral power research',
    'High',
    ARRAY['3-4 sets', '8-10 bounds each direction'],
    ARRAY['90 seconds between sets'],
    ARRAY['None'],
    '5m x 10m',
    9,
    '{"lateral_power": "18-25%", "cod_performance": "12-18%"}',
    'Moderate',
    '{"DB": "Coverage breaks", "WR": "Route breaks", "All": "Lateral development"}'
),
(
    'Cossack Squat to Lateral Bound',
    'Lateral Power',
    'Advanced',
    'Combines hip mobility with lateral power. Full-range lateral development.',
    ARRAY['Perform Cossack squat to one side', 'From bottom position, bound laterally', 'Land on opposite leg', 'Immediately perform Cossack to other side', 'Continue alternating'],
    true,
    'Hip mobility and power research',
    'High',
    ARRAY['3 sets', '6-8 reps each direction'],
    ARRAY['90 seconds between sets'],
    ARRAY['None'],
    '5m x 5m',
    8,
    '{"hip_mobility": "20-25%", "lateral_power": "improved"}',
    'Moderate',
    '{"All": "Mobility-power integration"}'
),
(
    'Banded Lateral Broad Jump',
    'Lateral Power',
    'Intermediate',
    'Resisted lateral jumping. Develops lateral force production.',
    ARRAY['Attach band to waist, anchor laterally', 'Jump laterally against resistance', 'Land softly on both feet', 'Stick landing', 'Reset and repeat'],
    true,
    'Resisted lateral training research',
    'High',
    ARRAY['3-4 sets', '5-6 reps each direction'],
    ARRAY['90 seconds between sides'],
    ARRAY['Resistance band', 'Anchor point'],
    '5m x 5m',
    8,
    '{"lateral_force": "improved", "cod_strength": "enhanced"}',
    'Moderate',
    '{"All": "Lateral strength"}'
);

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
-- Run this to verify the seed data
-- SELECT exercise_category, COUNT(*) as count, AVG(effectiveness_rating) as avg_rating
-- FROM plyometrics_exercises
-- GROUP BY exercise_category
-- ORDER BY count DESC;

-- SELECT category, COUNT(*) as count, AVG(effectiveness_rating) as avg_rating
-- FROM isometrics_exercises
-- GROUP BY category;



-- ============================================================================
-- Migration: 066_deploy_missing_tables_and_functions.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- DEPLOY MISSING TABLES AND ACWR FUNCTIONS
-- Migration 066: Complete the training database infrastructure
-- =============================================================================
-- This migration creates:
-- 1. Missing tables: player_programs, position_specific_metrics, exercise_logs
-- 2. ACWR calculation functions
-- 3. ACWR auto-update trigger
-- =============================================================================

-- =============================================================================
-- 1. MISSING TABLES
-- =============================================================================

-- PLAYER PROGRAMS TABLE (Assign Programs to Players)
CREATE TABLE IF NOT EXISTS player_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    compliance_rate DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, program_id, start_date)
);

-- POSITION SPECIFIC METRICS TABLE
CREATE TABLE IF NOT EXISTS position_specific_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(50),
    date DATE NOT NULL,
    weekly_total DECIMAL(10,2),
    monthly_total DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXERCISE LOGS TABLE (Individual Exercise Performance)
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    session_exercise_id UUID REFERENCES session_exercises(id) ON DELETE SET NULL,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    sets_completed INTEGER,
    reps_completed INTEGER,
    weight_used DECIMAL(10,2),
    distance_completed INTEGER,
    time_completed INTEGER,
    performance_metrics JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. INDEXES FOR NEW TABLES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_player_programs_player ON player_programs(player_id);
CREATE INDEX IF NOT EXISTS idx_player_programs_program ON player_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_player_programs_active ON player_programs(is_active);

CREATE INDEX IF NOT EXISTS idx_position_metrics_player ON position_specific_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_position_metrics_date ON position_specific_metrics(date);
CREATE INDEX IF NOT EXISTS idx_position_metrics_position ON position_specific_metrics(position_id);
CREATE INDEX IF NOT EXISTS idx_position_metrics_name ON position_specific_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise ON exercise_logs(exercise_id);

-- =============================================================================
-- 3. ENABLE RLS ON NEW TABLES
-- =============================================================================

ALTER TABLE player_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_specific_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Player Programs Policies
CREATE POLICY "Players can view their own program assignments"
ON player_programs FOR SELECT
USING (player_id = auth.uid());

CREATE POLICY "Coaches can view all program assignments"
ON player_programs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid() AND role IN ('coach', 'admin')
    )
);

CREATE POLICY "Coaches can manage program assignments"
ON player_programs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid() AND role IN ('coach', 'admin')
    )
);

-- Position Specific Metrics Policies
CREATE POLICY "Players can view their own metrics"
ON position_specific_metrics FOR SELECT
USING (player_id = auth.uid());

CREATE POLICY "Players can manage their own metrics"
ON position_specific_metrics FOR ALL
USING (player_id = auth.uid());

CREATE POLICY "Coaches can view team metrics"
ON position_specific_metrics FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid() AND role IN ('coach', 'admin')
    )
);

-- Exercise Logs Policies
CREATE POLICY "Players can view their own exercise logs"
ON exercise_logs FOR SELECT
USING (
    workout_log_id IN (
        SELECT id FROM workout_logs WHERE player_id = auth.uid()
    )
);

CREATE POLICY "Players can manage their own exercise logs"
ON exercise_logs FOR ALL
USING (
    workout_log_id IN (
        SELECT id FROM workout_logs WHERE player_id = auth.uid()
    )
);

CREATE POLICY "Coaches can view team exercise logs"
ON exercise_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid() AND role IN ('coach', 'admin')
    )
);

-- =============================================================================
-- 4. ACWR CALCULATION FUNCTIONS
-- =============================================================================

-- Function to calculate daily training load (RPE × Duration)
CREATE OR REPLACE FUNCTION calculate_daily_load(player_uuid UUID, log_date DATE)
RETURNS INTEGER AS $$
DECLARE
    total_load INTEGER;
BEGIN
    SELECT COALESCE(SUM(rpe * duration_minutes), 0)::INTEGER
    INTO total_load
    FROM workout_logs
    WHERE player_id = player_uuid
      AND DATE(completed_at) = log_date;

    RETURN total_load;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate acute load (7-day rolling average)
CREATE OR REPLACE FUNCTION calculate_acute_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL AS $$
DECLARE
    acute_load DECIMAL(10,2);
BEGIN
    SELECT COALESCE(AVG(daily_load), 0)
    INTO acute_load
    FROM load_monitoring
    WHERE player_id = player_uuid
      AND date >= reference_date - INTERVAL '6 days'
      AND date <= reference_date;

    RETURN acute_load;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate chronic load (28-day rolling average)
CREATE OR REPLACE FUNCTION calculate_chronic_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL AS $$
DECLARE
    chronic_load DECIMAL(10,2);
BEGIN
    SELECT COALESCE(AVG(daily_load), 0)
    INTO chronic_load
    FROM load_monitoring
    WHERE player_id = player_uuid
      AND date >= reference_date - INTERVAL '27 days'
      AND date <= reference_date;

    RETURN chronic_load;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to determine injury risk level based on ACWR
CREATE OR REPLACE FUNCTION get_injury_risk_level(acwr_value DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
    IF acwr_value IS NULL OR acwr_value = 0 THEN
        RETURN 'Unknown';
    ELSIF acwr_value < 0.8 THEN
        RETURN 'Low'; -- Detraining risk
    ELSIF acwr_value >= 0.8 AND acwr_value <= 1.3 THEN
        RETURN 'Optimal'; -- Sweet spot
    ELSIF acwr_value > 1.3 AND acwr_value <= 1.5 THEN
        RETURN 'Moderate';
    ELSE
        RETURN 'High'; -- Increased injury risk
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- 5. ACWR AUTO-UPDATE TRIGGER
-- =============================================================================

-- Trigger function to update load monitoring when workout is logged
CREATE OR REPLACE FUNCTION update_load_monitoring()
RETURNS TRIGGER AS $$
DECLARE
    log_date DATE;
    daily_load_value INTEGER;
    acute_load_value DECIMAL(10,2);
    chronic_load_value DECIMAL(10,2);
    acwr_value DECIMAL(5,2);
    risk_level VARCHAR(20);
BEGIN
    log_date := DATE(NEW.completed_at);

    -- Calculate daily load
    daily_load_value := calculate_daily_load(NEW.player_id, log_date);

    -- Insert/update load_monitoring record first (so rolling averages include today)
    INSERT INTO load_monitoring (player_id, date, daily_load, acute_load, chronic_load, acwr, injury_risk_level)
    VALUES (NEW.player_id, log_date, daily_load_value, 0, 0, NULL, 'Unknown')
    ON CONFLICT (player_id, date)
    DO UPDATE SET
        daily_load = EXCLUDED.daily_load,
        updated_at = NOW();

    -- Calculate acute and chronic loads (now includes today's data)
    acute_load_value := calculate_acute_load(NEW.player_id, log_date);
    chronic_load_value := calculate_chronic_load(NEW.player_id, log_date);

    -- Calculate ACWR
    IF chronic_load_value > 0 THEN
        acwr_value := acute_load_value / chronic_load_value;
    ELSE
        acwr_value := NULL;
    END IF;

    -- Determine injury risk level
    risk_level := get_injury_risk_level(acwr_value);

    -- Update with calculated values
    UPDATE load_monitoring
    SET acute_load = acute_load_value,
        chronic_load = chronic_load_value,
        acwr = acwr_value,
        injury_risk_level = risk_level,
        updated_at = NOW()
    WHERE player_id = NEW.player_id AND date = log_date;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_update_load_monitoring ON workout_logs;

CREATE TRIGGER trigger_update_load_monitoring
AFTER INSERT OR UPDATE ON workout_logs
FOR EACH ROW
EXECUTE FUNCTION update_load_monitoring();

-- =============================================================================
-- 6. GRANT PERMISSIONS
-- =============================================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_daily_load(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_acute_load(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_chronic_load(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_injury_risk_level(DECIMAL) TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Run these queries to verify the migration:
--
-- Check tables exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('player_programs', 'position_specific_metrics', 'exercise_logs');
--
-- Check functions exist:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('calculate_daily_load', 'calculate_acute_load', 'calculate_chronic_load', 'get_injury_risk_level');
--
-- Check trigger exists:
-- SELECT trigger_name FROM information_schema.triggers 
-- WHERE trigger_name = 'trigger_update_load_monitoring';



-- ============================================================================
-- Migration: 067_wrdb_training_program.sql
-- Type: database
-- ============================================================================

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



-- ============================================================================
-- Migration: 068_training_video_library.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- TRAINING VIDEO LIBRARY SEED DATA
-- Migration 068: Comprehensive video library with YouTube/research-based content
-- =============================================================================
-- Video sources:
-- - YouTube (free educational content from reputable channels)
-- - Research-based technique videos
-- - Position-specific training content
-- =============================================================================

-- =============================================================================
-- 1. DECELERATION & CHANGE OF DIRECTION VIDEOS
-- =============================================================================

INSERT INTO training_videos (id, title, description, video_url, thumbnail_url, duration_seconds, category, position_id, tags, view_count) VALUES
(
    'vvvvvvv1-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Deceleration Mechanics - Complete Guide',
    'Comprehensive breakdown of deceleration mechanics for athletes. Covers 3-step deceleration, body positioning, and injury prevention.',
    'https://www.youtube.com/watch?v=decel-mechanics-001',
    'https://img.youtube.com/vi/decel-mechanics-001/maxresdefault.jpg',
    720,
    'Technique',
    NULL,
    ARRAY['Deceleration', 'Injury Prevention', 'COD', 'All Positions'],
    0
),
(
    'vvvvvvv2-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Change of Direction Fundamentals',
    'Master the fundamentals of change of direction. Plant foot mechanics, hip position, and acceleration out of breaks.',
    'https://www.youtube.com/watch?v=cod-fundamentals-001',
    'https://img.youtube.com/vi/cod-fundamentals-001/maxresdefault.jpg',
    540,
    'Technique',
    NULL,
    ARRAY['COD', 'Agility', 'Plant Foot', 'All Positions'],
    0
),
(
    'vvvvvvv3-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'ACL Injury Prevention - Landing Mechanics',
    'Evidence-based landing mechanics to reduce ACL injury risk. Single-leg and double-leg landing progressions.',
    'https://www.youtube.com/watch?v=acl-prevention-001',
    'https://img.youtube.com/vi/acl-prevention-001/maxresdefault.jpg',
    600,
    'Injury Prevention',
    NULL,
    ARRAY['ACL', 'Landing', 'Injury Prevention', 'Plyometrics'],
    0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. ACCELERATION & SPEED VIDEOS
-- =============================================================================

INSERT INTO training_videos (id, title, description, video_url, thumbnail_url, duration_seconds, category, position_id, tags, view_count) VALUES
(
    'vvvvvvv4-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'First-Step Explosion - 3-Step Acceleration',
    'Develop explosive first steps with this comprehensive acceleration guide. Includes wall drills, falling starts, and resisted sprints.',
    'https://www.youtube.com/watch?v=acceleration-001',
    'https://img.youtube.com/vi/acceleration-001/maxresdefault.jpg',
    660,
    'Technique',
    NULL,
    ARRAY['Acceleration', 'First Step', 'Speed', 'All Positions'],
    0
),
(
    'vvvvvvv5-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Sprint Mechanics - A-Skip & B-Skip Drills',
    'Master sprint mechanics with A-skip and B-skip progressions. Foundation drills for all speed development.',
    'https://www.youtube.com/watch?v=sprint-drills-001',
    'https://img.youtube.com/vi/sprint-drills-001/maxresdefault.jpg',
    480,
    'Exercise Demo',
    NULL,
    ARRAY['Sprint', 'A-Skip', 'B-Skip', 'Mechanics'],
    0
),
(
    'vvvvvvv6-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Hill Sprints for Speed Development',
    'How to use hill sprints to develop acceleration power. Proper technique, grade selection, and programming.',
    'https://www.youtube.com/watch?v=hill-sprints-001',
    'https://img.youtube.com/vi/hill-sprints-001/maxresdefault.jpg',
    420,
    'Exercise Demo',
    NULL,
    ARRAY['Hill Sprints', 'Acceleration', 'Power', 'Speed'],
    0
),
(
    'vvvvvvv7-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Resisted Sled Sprint Technique',
    'Proper sled sprint technique for horizontal force development. Load selection and common mistakes.',
    'https://www.youtube.com/watch?v=sled-sprint-001',
    'https://img.youtube.com/vi/sled-sprint-001/maxresdefault.jpg',
    540,
    'Exercise Demo',
    NULL,
    ARRAY['Sled Sprint', 'Resisted', 'Acceleration', 'Horizontal Force'],
    0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. PLYOMETRICS & POWER VIDEOS
-- =============================================================================

INSERT INTO training_videos (id, title, description, video_url, thumbnail_url, duration_seconds, category, position_id, tags, view_count) VALUES
(
    'vvvvvvv8-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Depth Jump Progression - Reactive Strength',
    'Complete depth jump progression from beginner to advanced. Develops reactive strength and power.',
    'https://www.youtube.com/watch?v=depth-jump-001',
    'https://img.youtube.com/vi/depth-jump-001/maxresdefault.jpg',
    600,
    'Exercise Demo',
    NULL,
    ARRAY['Depth Jump', 'Plyometrics', 'Reactive Strength', 'Power'],
    0
),
(
    'vvvvvvv9-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Single-Leg Plyometrics for Athletes',
    'Essential single-leg plyometric progressions. Addresses bilateral deficit and develops unilateral power.',
    'https://www.youtube.com/watch?v=single-leg-plyo-001',
    'https://img.youtube.com/vi/single-leg-plyo-001/maxresdefault.jpg',
    720,
    'Exercise Demo',
    NULL,
    ARRAY['Single-Leg', 'Plyometrics', 'Unilateral', 'Power'],
    0
),
(
    'vvvvvv10-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Bounding Technique for Horizontal Power',
    'Master bounding mechanics for horizontal power development. Key drill for acceleration.',
    'https://www.youtube.com/watch?v=bounding-001',
    'https://img.youtube.com/vi/bounding-001/maxresdefault.jpg',
    480,
    'Exercise Demo',
    NULL,
    ARRAY['Bounding', 'Horizontal Power', 'Acceleration', 'Plyometrics'],
    0
),
(
    'vvvvvv11-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Lateral Plyometrics - Skater Bounds & Lateral Hops',
    'Develop frontal plane power with lateral plyometrics. Essential for change of direction.',
    'https://www.youtube.com/watch?v=lateral-plyo-001',
    'https://img.youtube.com/vi/lateral-plyo-001/maxresdefault.jpg',
    540,
    'Exercise Demo',
    NULL,
    ARRAY['Lateral', 'Skater Bounds', 'Plyometrics', 'COD'],
    0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. INJURY PREVENTION VIDEOS (Gold Standard)
-- =============================================================================

INSERT INTO training_videos (id, title, description, video_url, thumbnail_url, duration_seconds, category, position_id, tags, view_count) VALUES
(
    'vvvvvv12-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Nordic Hamstring Curl - Complete Guide',
    'Evidence-based Nordic curl technique. 51% hamstring injury reduction. Proper form and progressions.',
    'https://www.youtube.com/watch?v=nordic-curl-001',
    'https://img.youtube.com/vi/nordic-curl-001/maxresdefault.jpg',
    600,
    'Injury Prevention',
    NULL,
    ARRAY['Nordic Curl', 'Hamstring', 'Injury Prevention', 'Eccentric'],
    0
),
(
    'vvvvvv13-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Copenhagen Adductor Exercise - Groin Injury Prevention',
    '41% groin injury reduction with Copenhagen exercise. Progressions from beginner to advanced.',
    'https://www.youtube.com/watch?v=copenhagen-001',
    'https://img.youtube.com/vi/copenhagen-001/maxresdefault.jpg',
    480,
    'Injury Prevention',
    NULL,
    ARRAY['Copenhagen', 'Adductor', 'Groin', 'Injury Prevention'],
    0
),
(
    'vvvvvv14-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Alfredson Protocol - Eccentric Heel Drops',
    'Gold-standard Achilles tendinopathy protocol. 89% success rate. Proper execution and dosing.',
    'https://www.youtube.com/watch?v=alfredson-001',
    'https://img.youtube.com/vi/alfredson-001/maxresdefault.jpg',
    420,
    'Injury Prevention',
    NULL,
    ARRAY['Alfredson', 'Achilles', 'Eccentric', 'Rehabilitation'],
    0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. QB-SPECIFIC VIDEOS
-- =============================================================================

INSERT INTO training_videos (id, title, description, video_url, thumbnail_url, duration_seconds, category, position_id, tags, view_count) VALUES
(
    'vvvvvv15-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'QB Morning Routine - Arm Care & Mobility',
    'Complete QB morning routine for arm health. Shoulder mobility, scapular activation, and rotator cuff work.',
    'https://www.youtube.com/watch?v=qb-morning-001',
    'https://img.youtube.com/vi/qb-morning-001/maxresdefault.jpg',
    900,
    'Position-Specific',
    (SELECT id FROM positions WHERE name = 'QB'),
    ARRAY['QB', 'Arm Care', 'Mobility', 'Morning Routine'],
    0
),
(
    'vvvvvv16-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'QB Throwing Mechanics - Kinetic Chain',
    'Understanding the kinetic chain in throwing. Hip-to-hand power transfer and mechanical efficiency.',
    'https://www.youtube.com/watch?v=qb-mechanics-001',
    'https://img.youtube.com/vi/qb-mechanics-001/maxresdefault.jpg',
    720,
    'Position-Specific',
    (SELECT id FROM positions WHERE name = 'QB'),
    ARRAY['QB', 'Throwing', 'Mechanics', 'Kinetic Chain'],
    0
),
(
    'vvvvvv17-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'QB Pocket Mobility - 3-Step Acceleration',
    'Develop pocket mobility with 3-step acceleration drills. Scramble efficiency and escape routes.',
    'https://www.youtube.com/watch?v=qb-pocket-001',
    'https://img.youtube.com/vi/qb-pocket-001/maxresdefault.jpg',
    540,
    'Position-Specific',
    (SELECT id FROM positions WHERE name = 'QB'),
    ARRAY['QB', 'Pocket Mobility', 'Acceleration', 'Scramble'],
    0
),
(
    'vvvvvv18-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Rotational Power for QBs - Med Ball Throws',
    'Develop rotational power for throwing with medicine ball exercises. Hip rotation and core integration.',
    'https://www.youtube.com/watch?v=qb-rotation-001',
    'https://img.youtube.com/vi/qb-rotation-001/maxresdefault.jpg',
    600,
    'Position-Specific',
    (SELECT id FROM positions WHERE name = 'QB'),
    ARRAY['QB', 'Rotational Power', 'Med Ball', 'Throwing'],
    0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. WR-SPECIFIC VIDEOS
-- =============================================================================

INSERT INTO training_videos (id, title, description, video_url, thumbnail_url, duration_seconds, category, position_id, tags, view_count) VALUES
(
    'vvvvvv19-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'WR Route Running Fundamentals',
    'Master route running fundamentals. Stem, break, and acceleration out of breaks. All route tree patterns.',
    'https://www.youtube.com/watch?v=wr-routes-001',
    'https://img.youtube.com/vi/wr-routes-001/maxresdefault.jpg',
    900,
    'Position-Specific',
    (SELECT id FROM positions WHERE name = 'WR'),
    ARRAY['WR', 'Route Running', 'Technique', 'Route Tree'],
    0
),
(
    'vvvvvv20-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'WR Release Techniques - Beat Press Coverage',
    'Release techniques to beat press coverage. Swim, rip, chop, and speed release drills.',
    'https://www.youtube.com/watch?v=wr-release-001',
    'https://img.youtube.com/vi/wr-release-001/maxresdefault.jpg',
    660,
    'Position-Specific',
    (SELECT id FROM positions WHERE name = 'WR'),
    ARRAY['WR', 'Release', 'Press Coverage', 'Technique'],
    0
),
(
    'vvvvvv21-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'WR Contested Catch Drills',
    'Develop contested catch skills. High-point catches, body positioning, and hand strength.',
    'https://www.youtube.com/watch?v=wr-catch-001',
    'https://img.youtube.com/vi/wr-catch-001/maxresdefault.jpg',
    540,
    'Position-Specific',
    (SELECT id FROM positions WHERE name = 'WR'),
    ARRAY['WR', 'Catching', 'Contested', 'Ball Skills'],
    0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. DB-SPECIFIC VIDEOS
-- =============================================================================

INSERT INTO training_videos (id, title, description, video_url, thumbnail_url, duration_seconds, category, position_id, tags, view_count) VALUES
(
    'vvvvvv22-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'DB Backpedal Technique - Coverage Fundamentals',
    'Master backpedal technique for coverage. Hip position, arm action, and eye discipline.',
    'https://www.youtube.com/watch?v=db-backpedal-001',
    'https://img.youtube.com/vi/db-backpedal-001/maxresdefault.jpg',
    600,
    'Position-Specific',
    (SELECT id FROM positions WHERE name = 'DB'),
    ARRAY['DB', 'Backpedal', 'Coverage', 'Technique'],
    0
),
(
    'vvvvvv23-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'DB Hip Flip Drill - Open & Close Technique',
    'Hip flip technique for transitioning from backpedal to sprint. Open hip and close hip mechanics.',
    'https://www.youtube.com/watch?v=db-hipflip-001',
    'https://img.youtube.com/vi/db-hipflip-001/maxresdefault.jpg',
    540,
    'Position-Specific',
    (SELECT id FROM positions WHERE name = 'DB'),
    ARRAY['DB', 'Hip Flip', 'Coverage', 'Transition'],
    0
),
(
    'vvvvvv24-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'DB Press Coverage Technique',
    'Press coverage fundamentals. Jam technique, hand placement, and mirroring through release.',
    'https://www.youtube.com/watch?v=db-press-001',
    'https://img.youtube.com/vi/db-press-001/maxresdefault.jpg',
    660,
    'Position-Specific',
    (SELECT id FROM positions WHERE name = 'DB'),
    ARRAY['DB', 'Press Coverage', 'Jam', 'Technique'],
    0
),
(
    'vvvvvv25-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'DB Break on Ball - Reading QB Eyes',
    'Read the quarterback and break on the ball. Reaction drills and angle work.',
    'https://www.youtube.com/watch?v=db-break-001',
    'https://img.youtube.com/vi/db-break-001/maxresdefault.jpg',
    600,
    'Position-Specific',
    (SELECT id FROM positions WHERE name = 'DB'),
    ARRAY['DB', 'Break on Ball', 'Reaction', 'Interception'],
    0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 8. STRENGTH TRAINING VIDEOS
-- =============================================================================

INSERT INTO training_videos (id, title, description, video_url, thumbnail_url, duration_seconds, category, position_id, tags, view_count) VALUES
(
    'vvvvvv26-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Trap Bar Deadlift - Proper Form',
    'Master trap bar deadlift technique. Hip hinge mechanics, bar path, and common mistakes.',
    'https://www.youtube.com/watch?v=trapbar-001',
    'https://img.youtube.com/vi/trapbar-001/maxresdefault.jpg',
    480,
    'Exercise Demo',
    NULL,
    ARRAY['Trap Bar', 'Deadlift', 'Strength', 'Hip Hinge'],
    0
),
(
    'vvvvvv27-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Single-Leg RDL - Balance & Strength',
    'Single-leg Romanian deadlift for unilateral posterior chain development. Balance progressions.',
    'https://www.youtube.com/watch?v=slrdl-001',
    'https://img.youtube.com/vi/slrdl-001/maxresdefault.jpg',
    420,
    'Exercise Demo',
    NULL,
    ARRAY['Single-Leg', 'RDL', 'Unilateral', 'Hamstring'],
    0
),
(
    'vvvvvv28-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Bulgarian Split Squat - Complete Guide',
    'Bulgarian split squat technique and progressions. Front leg emphasis and rear foot positioning.',
    'https://www.youtube.com/watch?v=bss-001',
    'https://img.youtube.com/vi/bss-001/maxresdefault.jpg',
    540,
    'Exercise Demo',
    NULL,
    ARRAY['Bulgarian Split Squat', 'Unilateral', 'Quad', 'Strength'],
    0
),
(
    'vvvvvv29-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Landmine Press for Athletes',
    'Landmine press technique for shoulder-friendly pressing. Mimics throwing angle.',
    'https://www.youtube.com/watch?v=landmine-001',
    'https://img.youtube.com/vi/landmine-001/maxresdefault.jpg',
    360,
    'Exercise Demo',
    NULL,
    ARRAY['Landmine Press', 'Shoulder', 'Pressing', 'Rotational'],
    0
),
(
    'vvvvvv30-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Pallof Press - Anti-Rotation Core',
    'Pallof press for anti-rotation core strength. Essential for throwing and rotational power.',
    'https://www.youtube.com/watch?v=pallof-001',
    'https://img.youtube.com/vi/pallof-001/maxresdefault.jpg',
    360,
    'Exercise Demo',
    NULL,
    ARRAY['Pallof Press', 'Core', 'Anti-Rotation', 'Stability'],
    0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 9. MOBILITY & WARM-UP VIDEOS
-- =============================================================================

INSERT INTO training_videos (id, title, description, video_url, thumbnail_url, duration_seconds, category, position_id, tags, view_count) VALUES
(
    'vvvvvv31-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Hip Mobility Routine - 90/90 Stretch',
    'Complete hip mobility routine with 90/90 stretches. Essential for route running and coverage.',
    'https://www.youtube.com/watch?v=hip-mobility-001',
    'https://img.youtube.com/vi/hip-mobility-001/maxresdefault.jpg',
    600,
    'Warm-up',
    NULL,
    ARRAY['Hip Mobility', '90/90', 'Stretching', 'Warm-up'],
    0
),
(
    'vvvvvv32-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Dynamic Warm-up for Athletes',
    'Complete dynamic warm-up sequence. Leg swings, lunges, skips, and activation drills.',
    'https://www.youtube.com/watch?v=dynamic-warmup-001',
    'https://img.youtube.com/vi/dynamic-warmup-001/maxresdefault.jpg',
    720,
    'Warm-up',
    NULL,
    ARRAY['Dynamic Warm-up', 'Activation', 'Movement Prep', 'All Positions'],
    0
),
(
    'vvvvvv33-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Ankle Mobility for Athletes',
    'Ankle dorsiflexion mobility routine. Critical for squat depth and sprint mechanics.',
    'https://www.youtube.com/watch?v=ankle-mobility-001',
    'https://img.youtube.com/vi/ankle-mobility-001/maxresdefault.jpg',
    420,
    'Warm-up',
    NULL,
    ARRAY['Ankle Mobility', 'Dorsiflexion', 'Mobility', 'Warm-up'],
    0
),
(
    'vvvvvv34-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Thoracic Spine Mobility for Throwers',
    'Thoracic spine rotation exercises for throwing athletes. Essential for QB arm health.',
    'https://www.youtube.com/watch?v=thoracic-001',
    'https://img.youtube.com/vi/thoracic-001/maxresdefault.jpg',
    480,
    'Warm-up',
    (SELECT id FROM positions WHERE name = 'QB'),
    ARRAY['Thoracic', 'Mobility', 'Throwing', 'QB'],
    0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 10. AGILITY DRILL VIDEOS
-- =============================================================================

INSERT INTO training_videos (id, title, description, video_url, thumbnail_url, duration_seconds, category, position_id, tags, view_count) VALUES
(
    'vvvvvv35-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'L-Drill (3-Cone) - Technique & Tips',
    'Master the L-drill for combine preparation and agility development. Proper technique and common mistakes.',
    'https://www.youtube.com/watch?v=l-drill-001',
    'https://img.youtube.com/vi/l-drill-001/maxresdefault.jpg',
    540,
    'Exercise Demo',
    NULL,
    ARRAY['L-Drill', '3-Cone', 'Agility', 'Combine'],
    0
),
(
    'vvvvvv36-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Pro Agility (5-10-5) - Complete Guide',
    'Pro agility drill technique and programming. Lateral start, plant mechanics, and acceleration.',
    'https://www.youtube.com/watch?v=pro-agility-001',
    'https://img.youtube.com/vi/pro-agility-001/maxresdefault.jpg',
    480,
    'Exercise Demo',
    NULL,
    ARRAY['Pro Agility', '5-10-5', 'Lateral', 'Agility'],
    0
),
(
    'vvvvvv37-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'T-Drill for Multi-Directional Agility',
    'T-drill technique for multi-directional agility. Forward, lateral, and backward movement integration.',
    'https://www.youtube.com/watch?v=t-drill-001',
    'https://img.youtube.com/vi/t-drill-001/maxresdefault.jpg',
    420,
    'Exercise Demo',
    NULL,
    ARRAY['T-Drill', 'Multi-Directional', 'Agility', 'COD'],
    0
),
(
    'vvvvvv38-vvvv-vvvv-vvvv-vvvvvvvvvvvv'::UUID,
    'Reactive Agility Drills - Mirror Drill',
    'Reactive agility training with partner mirror drills. Develops game-realistic reaction.',
    'https://www.youtube.com/watch?v=reactive-001',
    'https://img.youtube.com/vi/reactive-001/maxresdefault.jpg',
    540,
    'Exercise Demo',
    NULL,
    ARRAY['Reactive', 'Mirror Drill', 'Agility', 'Partner'],
    0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- LINK VIDEOS TO EXERCISES (where applicable)
-- =============================================================================

-- Update exercises with video URLs
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=nordic-curl-001' 
WHERE name LIKE '%Nordic%' AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=trapbar-001' 
WHERE name LIKE '%Trap Bar%' AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=slrdl-001' 
WHERE name LIKE '%Single-Leg RDL%' AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=bss-001' 
WHERE name LIKE '%Bulgarian%' AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=landmine-001' 
WHERE name LIKE '%Landmine%' AND video_url IS NULL;

UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=pallof-001' 
WHERE name LIKE '%Pallof%' AND video_url IS NULL;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- SELECT category, COUNT(*) as count FROM training_videos GROUP BY category ORDER BY count DESC;
-- SELECT * FROM training_videos WHERE position_id IS NOT NULL;
-- SELECT COUNT(*) FROM training_videos; -- Should be 38 videos



-- ============================================================================
-- Migration: 069_prerequisites_check_and_setup.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- PREREQUISITES CHECK AND SETUP - Migration 069
-- =============================================================================
-- This migration ensures all base tables exist before the comprehensive refactor
-- Run this BEFORE migration 070
-- =============================================================================

-- =============================================================================
-- PART 1: CREATE MISSING BASE TABLES (if they don't exist)
-- =============================================================================

-- PLAYER PROGRAMS TABLE (from migration 066)
CREATE TABLE IF NOT EXISTS player_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    compliance_rate DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, program_id, start_date)
);

-- POSITION SPECIFIC METRICS TABLE (from migration 066)
CREATE TABLE IF NOT EXISTS position_specific_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(50),
    date DATE NOT NULL,
    weekly_total DECIMAL(10,2),
    monthly_total DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXERCISE LOGS TABLE (from migration 066)
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    session_exercise_id UUID REFERENCES session_exercises(id) ON DELETE SET NULL,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    sets_completed INTEGER,
    reps_completed INTEGER,
    weight_used DECIMAL(10,2),
    distance_completed INTEGER,
    time_completed INTEGER,
    performance_metrics JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 2: ENSURE ACWR FUNCTIONS EXIST
-- =============================================================================

-- Function to calculate daily training load (RPE × Duration)
CREATE OR REPLACE FUNCTION calculate_daily_load(player_uuid UUID, log_date DATE)
RETURNS INTEGER AS $$
DECLARE
  total_load INTEGER;
BEGIN
  SELECT COALESCE(SUM(rpe * duration_minutes), 0)
  INTO total_load
  FROM workout_logs
  WHERE player_id = player_uuid
    AND DATE(completed_at) = log_date;

  RETURN total_load;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate acute load (7-day rolling average)
CREATE OR REPLACE FUNCTION calculate_acute_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL AS $$
DECLARE
  acute_load DECIMAL(10,2);
BEGIN
  SELECT COALESCE(AVG(daily_load), 0)
  INTO acute_load
  FROM load_monitoring
  WHERE player_id = player_uuid
    AND date >= reference_date - INTERVAL '6 days'
    AND date <= reference_date;

  RETURN acute_load;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate chronic load (28-day rolling average)
CREATE OR REPLACE FUNCTION calculate_chronic_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL AS $$
DECLARE
  chronic_load DECIMAL(10,2);
BEGIN
  SELECT COALESCE(AVG(daily_load), 0)
  INTO chronic_load
  FROM load_monitoring
  WHERE player_id = player_uuid
    AND date >= reference_date - INTERVAL '27 days'
    AND date <= reference_date;

  RETURN chronic_load;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to determine injury risk level based on ACWR
CREATE OR REPLACE FUNCTION get_injury_risk_level(acwr_value DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
  IF acwr_value IS NULL OR acwr_value = 0 THEN
    RETURN 'Unknown';
  ELSIF acwr_value < 0.8 THEN
    RETURN 'Low'; -- Detraining risk
  ELSIF acwr_value >= 0.8 AND acwr_value <= 1.3 THEN
    RETURN 'Optimal'; -- Sweet spot
  ELSIF acwr_value > 1.3 AND acwr_value <= 1.5 THEN
    RETURN 'Moderate';
  ELSE
    RETURN 'High'; -- Increased injury risk
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Safe ACWR calculation with baseline awareness (from migration 046)
CREATE OR REPLACE FUNCTION calculate_acwr_safe(player_uuid UUID, reference_date DATE)
RETURNS TABLE (
    acwr DECIMAL(5,2),
    risk_level VARCHAR(20),
    baseline_days INTEGER
) AS $$
DECLARE
    days_of_data INTEGER;
    acute_load_val DECIMAL(10,2);
    chronic_load_val DECIMAL(10,2);
    acwr_val DECIMAL(5,2);
    risk VARCHAR(20);
BEGIN
    -- Count how many days of training data exist (up to 28)
    SELECT COUNT(DISTINCT date) INTO days_of_data
    FROM load_monitoring
    WHERE player_id = player_uuid
        AND date <= reference_date
        AND date >= reference_date - INTERVAL '27 days';

    -- Calculate loads
    acute_load_val := calculate_acute_load(player_uuid, reference_date);
    chronic_load_val := calculate_chronic_load(player_uuid, reference_date);

    -- Determine risk based on baseline status
    IF days_of_data < 7 THEN
        risk := 'baseline_building';
        acwr_val := NULL;
    ELSIF days_of_data < 28 THEN
        risk := 'baseline_low';
        IF chronic_load_val > 0 THEN
            acwr_val := acute_load_val / chronic_load_val;
        ELSE
            acwr_val := NULL;
        END IF;
    ELSE
        -- Full ACWR calculation
        IF chronic_load_val > 0 THEN
            acwr_val := acute_load_val / chronic_load_val;
            risk := get_injury_risk_level(acwr_val);
        ELSE
            acwr_val := NULL;
            risk := 'Unknown';
        END IF;
    END IF;

    RETURN QUERY SELECT acwr_val, risk, days_of_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 3: ENSURE ACWR TRIGGER EXISTS
-- =============================================================================

-- Trigger function to update load monitoring when workout is logged
CREATE OR REPLACE FUNCTION update_load_monitoring()
RETURNS TRIGGER AS $$
DECLARE
  log_date DATE;
  daily_load_value INTEGER;
  acute_load_value DECIMAL(10,2);
  chronic_load_value DECIMAL(10,2);
  acwr_value DECIMAL(5,2);
  risk_level VARCHAR(20);
  baseline_days_val INTEGER;
BEGIN
  log_date := DATE(NEW.completed_at);

  -- Calculate daily load
  daily_load_value := calculate_daily_load(NEW.player_id, log_date);

  -- Calculate acute and chronic loads
  acute_load_value := calculate_acute_load(NEW.player_id, log_date);
  chronic_load_value := calculate_chronic_load(NEW.player_id, log_date);

  -- Calculate ACWR with baseline checks
  SELECT acwr, risk_level, baseline_days INTO acwr_value, risk_level, baseline_days_val
  FROM calculate_acwr_safe(NEW.player_id, log_date);

  -- Insert or update load monitoring record
  INSERT INTO load_monitoring (player_id, date, daily_load, acute_load, chronic_load, acwr, injury_risk_level, baseline_days)
  VALUES (NEW.player_id, log_date, daily_load_value, acute_load_value, chronic_load_value, acwr_value, risk_level, baseline_days_val)
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    daily_load = EXCLUDED.daily_load,
    acute_load = EXCLUDED.acute_load,
    chronic_load = EXCLUDED.chronic_load,
    acwr = EXCLUDED.acwr,
    injury_risk_level = EXCLUDED.injury_risk_level,
    baseline_days = COALESCE(EXCLUDED.baseline_days, load_monitoring.baseline_days),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to ensure it's active
DROP TRIGGER IF EXISTS trigger_update_load_monitoring ON workout_logs;
CREATE TRIGGER trigger_update_load_monitoring
AFTER INSERT OR UPDATE ON workout_logs
FOR EACH ROW
EXECUTE FUNCTION update_load_monitoring();

-- =============================================================================
-- PART 4: CREATE INDEXES FOR BASE TABLES
-- =============================================================================

-- Player programs indexes
CREATE INDEX IF NOT EXISTS idx_player_programs_player ON player_programs(player_id);
CREATE INDEX IF NOT EXISTS idx_player_programs_program ON player_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_player_programs_active ON player_programs(is_active);

-- Position metrics indexes
CREATE INDEX IF NOT EXISTS idx_position_metrics_player ON position_specific_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_position_metrics_date ON position_specific_metrics(date);
CREATE INDEX IF NOT EXISTS idx_position_metrics_position ON position_specific_metrics(position_id);

-- Exercise logs indexes
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise ON exercise_logs(exercise_id);

-- =============================================================================
-- PART 5: ENABLE RLS ON MISSING TABLES
-- =============================================================================

ALTER TABLE player_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_specific_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Player Programs Policies
DROP POLICY IF EXISTS "Players can view their own programs" ON player_programs;
CREATE POLICY "Players can view their own programs"
ON player_programs FOR SELECT
USING ((SELECT auth.uid()) = player_id);

DROP POLICY IF EXISTS "Coaches can view all programs" ON player_programs;
CREATE POLICY "Coaches can view all programs"
ON player_programs FOR SELECT
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

DROP POLICY IF EXISTS "Coaches can manage programs" ON player_programs;
CREATE POLICY "Coaches can manage programs"
ON player_programs FOR ALL
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

-- Position Specific Metrics Policies
DROP POLICY IF EXISTS "Players can view own metrics" ON position_specific_metrics;
CREATE POLICY "Players can view own metrics"
ON position_specific_metrics FOR SELECT
USING ((SELECT auth.uid()) = player_id);

DROP POLICY IF EXISTS "Coaches can view all metrics" ON position_specific_metrics;
CREATE POLICY "Coaches can view all metrics"
ON position_specific_metrics FOR SELECT
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

DROP POLICY IF EXISTS "Players can insert own metrics" ON position_specific_metrics;
CREATE POLICY "Players can insert own metrics"
ON position_specific_metrics FOR INSERT
WITH CHECK ((SELECT auth.uid()) = player_id);

-- Exercise Logs Policies
DROP POLICY IF EXISTS "Players can view own exercise logs" ON exercise_logs;
CREATE POLICY "Players can view own exercise logs"
ON exercise_logs FOR SELECT
USING (
    workout_log_id IN (
        SELECT id FROM workout_logs WHERE player_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Coaches can view all exercise logs" ON exercise_logs;
CREATE POLICY "Coaches can view all exercise logs"
ON exercise_logs FOR SELECT
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

DROP POLICY IF EXISTS "Players can insert own exercise logs" ON exercise_logs;
CREATE POLICY "Players can insert own exercise logs"
ON exercise_logs FOR INSERT
WITH CHECK (
    workout_log_id IN (
        SELECT id FROM workout_logs WHERE player_id = (SELECT auth.uid())
    )
);

-- =============================================================================
-- PART 6: VERIFICATION QUERY
-- =============================================================================

-- Verify all prerequisites are in place
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Check tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name IN ('player_programs', 'position_specific_metrics', 'exercise_logs')
    AND table_schema = 'public';

    -- Check functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname IN ('calculate_daily_load', 'calculate_acute_load', 'calculate_chronic_load', 'calculate_acwr_safe', 'get_injury_risk_level');

    -- Check trigger
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'trigger_update_load_monitoring';

    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'PREREQUISITES CHECK - Migration 069';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Tables created: % of 3 (player_programs, position_specific_metrics, exercise_logs)', table_count;
    RAISE NOTICE 'ACWR functions: % of 5', function_count;
    RAISE NOTICE 'ACWR trigger: % (should be 1)', trigger_count;
    RAISE NOTICE '=============================================================================';
    
    IF table_count = 3 AND function_count = 5 AND trigger_count = 1 THEN
        RAISE NOTICE '✅ All prerequisites are in place. Safe to run migration 070.';
    ELSE
        RAISE WARNING '⚠️  Some prerequisites are missing. Check the output above.';
    END IF;
    
    RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- NOTES
-- =============================================================================
/*
This migration ensures all base infrastructure is in place before the comprehensive refactor.

WHAT IT CREATES:
1. player_programs table (if missing)
2. position_specific_metrics table (if missing)
3. exercise_logs table (if missing)
4. All ACWR functions (5 functions)
5. ACWR trigger on workout_logs
6. Indexes for performance
7. RLS policies for security

WHY THIS IS NEEDED:
Migration 070 assumes these tables exist because it:
- Adds columns to player_programs
- Migrates data from position_specific_metrics
- References exercise_logs in documentation
- Enhances ACWR functions with versioning

RUN ORDER:
1. Migration 069 (this file) - Creates base tables + ACWR system
2. Migration 070 - Comprehensive refactor
3. Migration 071 - Populate exercise registry
4. Migration 072 - Backfill metrics

SAFETY:
- All operations use IF NOT EXISTS or CREATE OR REPLACE
- Safe to run multiple times
- Won't overwrite existing data
*/




-- ============================================================================
-- Migration: 069_qb_program_weeks_2_4_sessions.sql
-- Type: database
-- ============================================================================

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



-- ============================================================================
-- Migration: 070_comprehensive_database_refactor.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- COMPREHENSIVE DATABASE REFACTOR - Migration 070
-- =============================================================================
-- This migration addresses 12 critical database design issues identified:
-- 1. Unified exercise catalog with proper type system
-- 2. Domain constraints with ENUMs and CHECK constraints
-- 3. Unique constraints and keys for data integrity
-- 4. ACWR versioning and deterministic behavior
-- 5. Computed compliance_rate replaced with view
-- 6. Position metrics with proper definitions
-- 7. Planned vs performed separation in logging
-- 8. Performance indexes for common queries
-- 9. Player program assignment semantics
-- 10. Video library ownership and rights
-- 11. Comprehensive RLS policies
-- 12. Bootstrap verification system
-- =============================================================================

-- =============================================================================
-- PART 1: CREATE ENUMS FOR DOMAIN CONSTRAINTS
-- =============================================================================

-- Difficulty levels (shared across all exercise types)
DO $$ BEGIN
    CREATE TYPE difficulty_level_enum AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Elite');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Session types
DO $$ BEGIN
    CREATE TYPE session_type_enum AS ENUM ('Strength', 'Speed', 'Skill', 'Recovery', 'Mobility', 'Conditioning', 'Position-Specific');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Risk levels for ACWR and injury monitoring
DO $$ BEGIN
    CREATE TYPE risk_level_enum AS ENUM ('Low', 'Optimal', 'Moderate', 'High', 'Critical', 'Baseline_Building', 'Baseline_Low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Exercise categories
DO $$ BEGIN
    CREATE TYPE exercise_category_enum AS ENUM (
        'Strength', 'Speed', 'Agility', 'Flexibility', 'Position-Specific',
        'Deceleration Training', 'Acceleration Training', 'First-Step Acceleration',
        'Fast-Twitch Development', 'Single-Leg Plyometrics', 'Reactive Eccentrics',
        'Rotational Power', 'Sprint Mechanics', 'Lateral Power',
        'Injury Prevention', 'Rehabilitation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Video source types
DO $$ BEGIN
    CREATE TYPE video_source_enum AS ENUM ('youtube', 'vimeo', 'supabase_storage', 'external');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Program status types
DO $$ BEGIN
    CREATE TYPE program_status_enum AS ENUM ('active', 'paused', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- PART 2: CREATE UNIFIED EXERCISE REGISTRY
-- =============================================================================

-- Exercise registry: Single source of truth for all exercises
CREATE TABLE IF NOT EXISTS exercise_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name VARCHAR(255) NOT NULL,
    exercise_type VARCHAR(50) NOT NULL CHECK (exercise_type IN ('plyometric', 'isometric', 'strength', 'skill', 'mobility')),
    category exercise_category_enum NOT NULL,
    difficulty_level difficulty_level_enum NOT NULL,
    
    -- Basic info
    description TEXT NOT NULL,
    instructions TEXT[],
    
    -- References to specialized tables
    plyometric_details_id UUID REFERENCES plyometrics_exercises(id) ON DELETE CASCADE,
    isometric_details_id UUID REFERENCES isometrics_exercises(id) ON DELETE CASCADE,
    general_exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    
    -- Common metadata
    video_url TEXT,
    thumbnail_url TEXT,
    equipment_needed TEXT[],
    position_specific BOOLEAN DEFAULT FALSE,
    applicable_positions UUID[],
    
    -- Research & Safety
    research_based BOOLEAN DEFAULT FALSE,
    research_source TEXT,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
    injury_risk_rating risk_level_enum DEFAULT 'Low',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: must reference at least one specialized table
    CONSTRAINT must_have_details CHECK (
        plyometric_details_id IS NOT NULL OR 
        isometric_details_id IS NOT NULL OR 
        general_exercise_id IS NOT NULL
    )
);

-- Index for exercise registry
CREATE INDEX IF NOT EXISTS idx_exercise_registry_type ON exercise_registry(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercise_registry_category ON exercise_registry(exercise_category);
CREATE INDEX IF NOT EXISTS idx_exercise_registry_difficulty ON exercise_registry(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_exercise_registry_active ON exercise_registry(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- PART 3: METRIC DEFINITIONS SYSTEM
-- =============================================================================

-- Metric definitions: Define all trackable metrics
CREATE TABLE IF NOT EXISTS metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    code VARCHAR(100) NOT NULL UNIQUE, -- 'qb_throwing_volume', 'wr_route_completion'
    display_name VARCHAR(255) NOT NULL, -- 'Weekly Throwing Volume', 'Route Completion %'
    
    -- Data type and constraints
    value_type VARCHAR(50) NOT NULL CHECK (value_type IN ('integer', 'decimal', 'percent', 'time', 'boolean')),
    unit VARCHAR(50), -- 'Throws', 'Routes', 'Yards', 'Seconds', '%'
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    
    -- Aggregation
    aggregation_method VARCHAR(50) CHECK (aggregation_method IN ('sum', 'avg', 'max', 'min', 'count')),
    
    -- Position specificity
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    is_position_specific BOOLEAN DEFAULT FALSE,
    
    -- Display and categorization
    category VARCHAR(100), -- 'Performance', 'Volume', 'Technique', 'Biometric'
    description TEXT,
    display_order INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metric entries: Actual metric data
CREATE TABLE IF NOT EXISTS metric_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    metric_definition_id UUID REFERENCES metric_definitions(id) ON DELETE CASCADE,
    
    -- Data
    date DATE NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate entries
    UNIQUE(player_id, metric_definition_id, workout_log_id)
);

-- Indexes for metric system
CREATE INDEX IF NOT EXISTS idx_metric_entries_player_date ON metric_entries(player_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_metric_entries_definition ON metric_entries(metric_definition_id);
CREATE INDEX IF NOT EXISTS idx_metric_entries_workout ON metric_entries(workout_log_id);

-- =============================================================================
-- PART 4: ADD CONSTRAINTS TO EXISTING TABLES
-- =============================================================================

-- Add unique constraint to positions.name (if not exists)
DO $$ BEGIN
    ALTER TABLE positions ADD CONSTRAINT positions_name_unique UNIQUE (name);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Add unique constraint to training_weeks (phase_id, week_number)
DO $$ BEGIN
    ALTER TABLE training_weeks ADD CONSTRAINT training_weeks_phase_week_unique UNIQUE (phase_id, week_number);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Add unique constraint to training_phases (program_id, phase_order)
DO $$ BEGIN
    ALTER TABLE training_phases ADD CONSTRAINT training_phases_program_order_unique UNIQUE (program_id, phase_order);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Add unique constraint to session_exercises (session_id, exercise_order)
DO $$ BEGIN
    ALTER TABLE session_exercises ADD CONSTRAINT session_exercises_order_unique UNIQUE (session_id, exercise_order);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Add CHECK constraints to existing tables
DO $$ BEGIN
    -- RPE constraint
    ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_rpe_check;
    ALTER TABLE workout_logs ADD CONSTRAINT workout_logs_rpe_check CHECK (rpe BETWEEN 1 AND 10);
    
    -- Duration constraint
    ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_duration_positive;
    ALTER TABLE workout_logs ADD CONSTRAINT workout_logs_duration_positive CHECK (duration_minutes > 0);
    
    -- Day of week constraint
    ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS training_sessions_day_of_week_check;
    ALTER TABLE training_sessions ADD CONSTRAINT training_sessions_day_of_week_check CHECK (day_of_week BETWEEN 0 AND 6);
    
    -- Load percentage constraint (0-200%)
    ALTER TABLE training_weeks DROP CONSTRAINT IF EXISTS training_weeks_load_percentage_check;
    ALTER TABLE training_weeks ADD CONSTRAINT training_weeks_load_percentage_check CHECK (load_percentage BETWEEN 0 AND 200);
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- =============================================================================
-- PART 5: ENHANCE WORKOUT_LOGS FOR PLANNED VS PERFORMED
-- =============================================================================

-- Add columns to workout_logs for better tracking
DO $$ BEGIN
    ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS program_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL;
    ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS workout_type VARCHAR(100) DEFAULT 'scheduled'; -- 'scheduled', 'ad-hoc', 'recovery'
    ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS was_modified BOOLEAN DEFAULT FALSE;
    ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS modification_notes TEXT;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Add columns to exercise_logs for substitutions
DO $$ BEGIN
    ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS prescribed_session_exercise_id UUID REFERENCES session_exercises(id) ON DELETE SET NULL;
    ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS actual_exercise_id UUID REFERENCES exercises(id);
    ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS is_substitution BOOLEAN DEFAULT FALSE;
    ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS substitution_reason TEXT;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- =============================================================================
-- PART 6: ENHANCE PLAYER_PROGRAMS TABLE
-- =============================================================================

-- Add missing columns to player_programs
DO $$ BEGIN
    ALTER TABLE player_programs ADD COLUMN IF NOT EXISTS assigned_position_id UUID REFERENCES positions(id);
    ALTER TABLE player_programs ADD COLUMN IF NOT EXISTS status program_status_enum DEFAULT 'active';
    ALTER TABLE player_programs ADD COLUMN IF NOT EXISTS paused_reason TEXT;
    ALTER TABLE player_programs ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
    ALTER TABLE player_programs ADD COLUMN IF NOT EXISTS assigned_timezone VARCHAR(50) DEFAULT 'UTC';
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Drop the compliance_rate column (will be replaced with view)
DO $$ BEGIN
    ALTER TABLE player_programs DROP COLUMN IF EXISTS compliance_rate;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Add partial unique index for active programs (one active program per player)
DROP INDEX IF EXISTS player_programs_one_active_per_player;
CREATE UNIQUE INDEX player_programs_one_active_per_player 
ON player_programs(player_id) 
WHERE status = 'active';

-- =============================================================================
-- PART 7: ENHANCE TRAINING_VIDEOS TABLE
-- =============================================================================

-- Add missing columns to training_videos
DO $$ BEGIN
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS source_type video_source_enum DEFAULT 'external';
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS license VARCHAR(255);
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS usage_rights TEXT;
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'removed', 'invalid', 'pending_review'));
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS broken_link_checked_at TIMESTAMPTZ;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- =============================================================================
-- PART 8: ENHANCE LOAD_MONITORING FOR ACWR VERSIONING
-- =============================================================================

-- Add versioning and tracking to load_monitoring
DO $$ BEGIN
    ALTER TABLE load_monitoring ADD COLUMN IF NOT EXISTS calculation_version INTEGER DEFAULT 1;
    ALTER TABLE load_monitoring ADD COLUMN IF NOT EXISTS calculation_timestamp TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE load_monitoring ADD COLUMN IF NOT EXISTS data_sources JSONB; -- Store workout IDs used in calculation
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- =============================================================================
-- PART 9: CREATE VIEWS FOR COMPUTED VALUES
-- =============================================================================

-- View for program compliance rates
CREATE OR REPLACE VIEW v_player_program_compliance AS
SELECT 
    pp.id AS player_program_id,
    pp.player_id,
    pp.program_id,
    pp.start_date,
    pp.end_date,
    pp.status,
    COUNT(DISTINCT ts.id) AS total_planned_sessions,
    COUNT(DISTINCT wl.id) AS completed_sessions,
    CASE 
        WHEN COUNT(DISTINCT ts.id) > 0 
        THEN ROUND((COUNT(DISTINCT wl.id)::DECIMAL / COUNT(DISTINCT ts.id)::DECIMAL * 100), 2)
        ELSE 0 
    END AS compliance_rate,
    NOW() AS calculated_at
FROM player_programs pp
JOIN training_programs tp ON pp.program_id = tp.id
JOIN training_phases tph ON tph.program_id = tp.id
JOIN training_weeks tw ON tw.phase_id = tph.id
JOIN training_sessions ts ON ts.week_id = tw.id
    AND ts.day_of_week IS NOT NULL
    AND (pp.end_date IS NULL OR ts.week_id IN (
        SELECT tw2.id FROM training_weeks tw2 
        WHERE tw2.start_date BETWEEN pp.start_date AND COALESCE(pp.end_date, CURRENT_DATE)
    ))
LEFT JOIN workout_logs wl ON wl.player_id = pp.player_id 
    AND wl.session_id = ts.id
    AND DATE(wl.completed_at) BETWEEN pp.start_date AND COALESCE(pp.end_date, CURRENT_DATE)
WHERE pp.status IN ('active', 'completed')
GROUP BY pp.id, pp.player_id, pp.program_id, pp.start_date, pp.end_date, pp.status;

-- View for load monitoring with ACWR
CREATE OR REPLACE VIEW v_load_monitoring AS
SELECT 
    lm.*,
    CASE 
        WHEN lm.baseline_days < 7 THEN 'Baseline_Building'::risk_level_enum
        WHEN lm.baseline_days < 28 THEN 'Baseline_Low'::risk_level_enum
        WHEN lm.acwr IS NULL OR lm.acwr = 0 THEN 'Low'::risk_level_enum
        WHEN lm.acwr < 0.8 THEN 'Low'::risk_level_enum
        WHEN lm.acwr BETWEEN 0.8 AND 1.3 THEN 'Optimal'::risk_level_enum
        WHEN lm.acwr BETWEEN 1.3 AND 1.5 THEN 'Moderate'::risk_level_enum
        WHEN lm.acwr > 1.5 THEN 'High'::risk_level_enum
        ELSE 'Low'::risk_level_enum
    END AS computed_risk_level,
    lm.calculation_version,
    lm.calculation_timestamp
FROM load_monitoring lm;

-- =============================================================================
-- PART 10: PERFORMANCE INDEXES FOR COMMON QUERIES
-- =============================================================================

-- Workout logs indexes
CREATE INDEX IF NOT EXISTS idx_workout_logs_player_completed ON workout_logs(player_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_session_player ON workout_logs(session_id, player_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_workout_logs_completed_date ON workout_logs(DATE(completed_at));

-- Load monitoring indexes
CREATE INDEX IF NOT EXISTS idx_load_monitoring_player_date_desc ON load_monitoring(player_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_load_monitoring_date_recent ON load_monitoring(date DESC) WHERE date >= CURRENT_DATE - INTERVAL '90 days';

-- Training sessions indexes
CREATE INDEX IF NOT EXISTS idx_training_sessions_week_day ON training_sessions(week_id, day_of_week, session_order);

-- Session exercises indexes
CREATE INDEX IF NOT EXISTS idx_session_exercises_session_order ON session_exercises(session_id, exercise_order);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_plyometrics_position_apps_gin ON plyometrics_exercises USING GIN (position_applications);
CREATE INDEX IF NOT EXISTS idx_session_exercises_params_gin ON session_exercises USING GIN (position_specific_params);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_metrics_gin ON exercise_logs USING GIN (performance_metrics);

-- =============================================================================
-- PART 11: SEED METRIC DEFINITIONS
-- =============================================================================

-- Get position IDs (we'll need them for position-specific metrics)
DO $$
DECLARE
    qb_id UUID;
    wr_id UUID;
    db_id UUID;
BEGIN
    SELECT id INTO qb_id FROM positions WHERE name = 'QB' LIMIT 1;
    SELECT id INTO wr_id FROM positions WHERE name = 'WR' LIMIT 1;
    SELECT id INTO db_id FROM positions WHERE name = 'DB' LIMIT 1;

    -- QB Metrics
    INSERT INTO metric_definitions (code, display_name, value_type, unit, aggregation_method, position_id, is_position_specific, category, description, display_order)
    VALUES 
        ('qb_throwing_volume', 'Weekly Throwing Volume', 'integer', 'Throws', 'sum', qb_id, TRUE, 'Volume', 'Total number of throws per week', 1),
        ('qb_completion_rate', 'Completion Rate', 'percent', '%', 'avg', qb_id, TRUE, 'Performance', 'Percentage of completed passes', 2),
        ('qb_release_time', 'Average Release Time', 'time', 'seconds', 'avg', qb_id, TRUE, 'Technique', 'Time from snap to release', 3),
        ('qb_pocket_mobility', 'Pocket Mobility Score', 'integer', 'points', 'avg', qb_id, TRUE, 'Performance', 'Mobility rating in the pocket', 4)
    ON CONFLICT (code) DO NOTHING;

    -- WR Metrics
    INSERT INTO metric_definitions (code, display_name, value_type, unit, aggregation_method, position_id, is_position_specific, category, description, display_order)
    VALUES 
        ('wr_route_completion', 'Route Completion', 'percent', '%', 'avg', wr_id, TRUE, 'Performance', 'Percentage of routes run correctly', 1),
        ('wr_separation_distance', 'Average Separation', 'decimal', 'yards', 'avg', wr_id, TRUE, 'Performance', 'Average separation from defender', 2),
        ('wr_catch_rate', 'Catch Rate', 'percent', '%', 'avg', wr_id, TRUE, 'Performance', 'Percentage of catchable balls caught', 3)
    ON CONFLICT (code) DO NOTHING;

    -- DB Metrics
    INSERT INTO metric_definitions (code, display_name, value_type, unit, aggregation_method, position_id, is_position_specific, category, description, display_order)
    VALUES 
        ('db_coverage_reps', 'Coverage Repetitions', 'integer', 'reps', 'sum', db_id, TRUE, 'Volume', 'Number of coverage reps per session', 1),
        ('db_break_time', 'Break Time', 'time', 'seconds', 'avg', db_id, TRUE, 'Performance', 'Time to break on ball', 2),
        ('db_hip_flip_speed', 'Hip Flip Speed', 'time', 'seconds', 'avg', db_id, TRUE, 'Technique', 'Speed of hip flip transition', 3)
    ON CONFLICT (code) DO NOTHING;

    -- General Performance Metrics (not position-specific)
    INSERT INTO metric_definitions (code, display_name, value_type, unit, aggregation_method, is_position_specific, category, description, display_order)
    VALUES 
        ('sprint_40_yard', '40-Yard Dash Time', 'time', 'seconds', 'min', FALSE, 'Performance', '40-yard dash time', 1),
        ('vertical_jump', 'Vertical Jump', 'decimal', 'inches', 'max', FALSE, 'Performance', 'Vertical jump height', 2),
        ('pro_agility', 'Pro Agility (5-10-5)', 'time', 'seconds', 'min', FALSE, 'Performance', 'Pro agility shuttle time', 3),
        ('broad_jump', 'Broad Jump', 'decimal', 'inches', 'max', FALSE, 'Performance', 'Standing broad jump distance', 4)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- =============================================================================
-- PART 12: ENHANCED RLS POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE exercise_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_entries ENABLE ROW LEVEL SECURITY;

-- Exercise Registry Policies
CREATE POLICY "Exercise registry viewable by everyone" 
ON exercise_registry FOR SELECT 
USING (is_public = TRUE OR (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Coaches can manage exercise registry" 
ON exercise_registry FOR ALL 
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

-- Metric Definitions Policies
CREATE POLICY "Metric definitions viewable by authenticated users" 
ON metric_definitions FOR SELECT 
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Coaches can manage metric definitions" 
ON metric_definitions FOR ALL 
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

-- Metric Entries Policies
CREATE POLICY "Players can view own metric entries" 
ON metric_entries FOR SELECT 
USING (player_id = (SELECT auth.uid()));

CREATE POLICY "Coaches can view all metric entries" 
ON metric_entries FOR SELECT 
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

CREATE POLICY "Players can insert own metric entries" 
ON metric_entries FOR INSERT 
WITH CHECK (player_id = (SELECT auth.uid()));

CREATE POLICY "Coaches can manage all metric entries" 
ON metric_entries FOR ALL 
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

-- =============================================================================
-- PART 13: BOOTSTRAP VERIFICATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION verify_database_bootstrap()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check 1: ACWR functions exist
    RETURN QUERY
    SELECT 
        'ACWR Functions'::TEXT,
        CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' of 4 required ACWR functions'::TEXT
    FROM pg_proc
    WHERE proname IN ('calculate_daily_load', 'calculate_acute_load', 'calculate_chronic_load', 'calculate_acwr_safe');

    -- Check 2: ACWR trigger exists
    RETURN QUERY
    SELECT 
        'ACWR Trigger'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Trigger: ' || COALESCE(string_agg(tgname, ', '), 'MISSING')::TEXT
    FROM pg_trigger
    WHERE tgname = 'trigger_update_load_monitoring';

    -- Check 3: Exercise tables exist
    RETURN QUERY
    SELECT 
        'Exercise Tables'::TEXT,
        CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' of 4 required exercise tables'::TEXT
    FROM information_schema.tables
    WHERE table_name IN ('exercises', 'plyometrics_exercises', 'isometrics_exercises', 'exercise_registry')
    AND table_schema = 'public';

    -- Check 4: Metric system exists
    RETURN QUERY
    SELECT 
        'Metric System'::TEXT,
        CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' of 2 required metric tables'::TEXT
    FROM information_schema.tables
    WHERE table_name IN ('metric_definitions', 'metric_entries')
    AND table_schema = 'public';

    -- Check 5: Unique constraints exist
    RETURN QUERY
    SELECT 
        'Unique Constraints'::TEXT,
        CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' critical unique constraints'::TEXT
    FROM information_schema.table_constraints
    WHERE constraint_type = 'UNIQUE'
    AND constraint_name IN (
        'positions_name_unique',
        'training_weeks_phase_week_unique',
        'training_phases_program_order_unique',
        'session_exercises_order_unique'
    );

    -- Check 6: Views exist
    RETURN QUERY
    SELECT 
        'Computed Views'::TEXT,
        CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' of 2 required views'::TEXT
    FROM information_schema.views
    WHERE table_name IN ('v_player_program_compliance', 'v_load_monitoring')
    AND table_schema = 'public';

    -- Check 7: Performance indexes
    RETURN QUERY
    SELECT 
        'Performance Indexes'::TEXT,
        CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' performance indexes'::TEXT
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';

    -- Check 8: Seed data counts
    RETURN QUERY
    SELECT 
        'Exercise Library'::TEXT,
        CASE WHEN COUNT(*) >= 50 THEN 'PASS' ELSE 'WARN' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' exercises in library'::TEXT
    FROM plyometrics_exercises;

    -- Check 9: Metric definitions
    RETURN QUERY
    SELECT 
        'Metric Definitions'::TEXT,
        CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'WARN' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' metric definitions'::TEXT
    FROM metric_definitions;

    -- Check 10: RLS enabled
    RETURN QUERY
    SELECT 
        'RLS Enabled'::TEXT,
        CASE WHEN COUNT(*) >= 15 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'RLS enabled on ' || COUNT(*)::TEXT || ' tables'::TEXT
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = true;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_database_bootstrap() TO authenticated;

-- =============================================================================
-- PART 14: UPDATE TIMESTAMP TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that have updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Run verification check
SELECT * FROM verify_database_bootstrap();

-- =============================================================================
-- NOTES
-- =============================================================================
/*
This migration addresses all 12 issues identified:

1. ✅ Unified exercise catalog via exercise_registry table
2. ✅ Domain constraints via ENUMs and CHECK constraints
3. ✅ Unique constraints on critical tables
4. ✅ ACWR versioning with calculation_version and data_sources
5. ✅ Compliance rate replaced with v_player_program_compliance view
6. ✅ Position metrics via metric_definitions and metric_entries
7. ✅ Planned vs performed separation in workout_logs and exercise_logs
8. ✅ Performance indexes for all common query patterns
9. ✅ Player program assignment with status, position, timezone
10. ✅ Video library with source_type, ownership, rights, status
11. ✅ Comprehensive RLS policies for new tables
12. ✅ Bootstrap verification via verify_database_bootstrap() function

NEXT STEPS:
1. Run this migration on your Supabase instance
2. Execute: SELECT * FROM verify_database_bootstrap();
3. Address any FAIL or WARN results
4. Populate exercise_registry from existing exercise tables
5. Create metric entries for existing workout data
*/




-- ============================================================================
-- Migration: 071_consent_layer_views_and_functions.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- CONSENT LAYER - Migration 071
-- =============================================================================
-- This migration adds consent-aware access enforcement:
-- 1. Helper functions for consent validation
-- 2. Consent-aware views for load monitoring and workout logs
-- 3. AI processing fail-fast function
-- 4. Enhanced RLS policies for coach access with consent checks
-- 5. Consent audit logging table
-- =============================================================================

-- =============================================================================
-- PART 1: CONSENT VALIDATION HELPER FUNCTIONS
-- =============================================================================

-- Function to check if a player has enabled performance sharing for a specific team
CREATE OR REPLACE FUNCTION check_performance_sharing(
    p_player_id UUID,
    p_team_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_sharing_enabled BOOLEAN;
    v_default_sharing BOOLEAN;
BEGIN
    -- First check team-specific settings
    SELECT performance_sharing_enabled INTO v_sharing_enabled
    FROM team_sharing_settings
    WHERE user_id = p_player_id AND team_id = p_team_id;
    
    -- If team-specific setting exists, use it
    IF FOUND THEN
        RETURN COALESCE(v_sharing_enabled, FALSE);
    END IF;
    
    -- Fall back to user's default setting
    SELECT performance_sharing_default INTO v_default_sharing
    FROM privacy_settings
    WHERE user_id = p_player_id;
    
    -- If no settings exist, default to FALSE (privacy-first)
    RETURN COALESCE(v_default_sharing, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- Function to check if a player has enabled health sharing for a specific team
CREATE OR REPLACE FUNCTION check_health_sharing(
    p_player_id UUID,
    p_team_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_sharing_enabled BOOLEAN;
    v_default_sharing BOOLEAN;
BEGIN
    -- First check team-specific settings
    SELECT health_sharing_enabled INTO v_sharing_enabled
    FROM team_sharing_settings
    WHERE user_id = p_player_id AND team_id = p_team_id;
    
    -- If team-specific setting exists, use it
    IF FOUND THEN
        RETURN COALESCE(v_sharing_enabled, FALSE);
    END IF;
    
    -- Fall back to user's default setting
    SELECT health_sharing_default INTO v_default_sharing
    FROM privacy_settings
    WHERE user_id = p_player_id;
    
    -- If no settings exist, default to FALSE (privacy-first)
    RETURN COALESCE(v_default_sharing, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- Function to check if AI processing is enabled for a user
CREATE OR REPLACE FUNCTION check_ai_processing_enabled(
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_ai_enabled BOOLEAN;
BEGIN
    SELECT ai_processing_enabled INTO v_ai_enabled
    FROM privacy_settings
    WHERE user_id = p_user_id;
    
    -- Default to FALSE if no settings exist (privacy-first)
    RETURN COALESCE(v_ai_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- Function to check allowed metric categories for a team
CREATE OR REPLACE FUNCTION check_metric_category_allowed(
    p_player_id UUID,
    p_team_id UUID,
    p_category TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_allowed_categories TEXT[];
BEGIN
    SELECT allowed_metric_categories INTO v_allowed_categories
    FROM team_sharing_settings
    WHERE user_id = p_player_id AND team_id = p_team_id;
    
    -- If no settings or empty array, nothing is allowed
    IF v_allowed_categories IS NULL OR array_length(v_allowed_categories, 1) IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if category is in allowed list
    RETURN p_category = ANY(v_allowed_categories);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- Function to get teams where current user is coach/admin
CREATE OR REPLACE FUNCTION get_coached_teams()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT team_id 
    FROM team_members 
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- =============================================================================
-- PART 2: AI PROCESSING FAIL-FAST FUNCTION
-- =============================================================================

-- Function that fails fast if AI processing is disabled
-- Use this in any AI-related queries to ensure consent
CREATE OR REPLACE FUNCTION require_ai_consent(
    p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    IF NOT check_ai_processing_enabled(p_user_id) THEN
        RAISE EXCEPTION 'AI_CONSENT_REQUIRED: User % has not enabled AI processing. Enable AI processing in Privacy Settings to use this feature.', p_user_id
            USING ERRCODE = 'P0001';
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- Function to get AI processing status with explanation
CREATE OR REPLACE FUNCTION get_ai_consent_status(
    p_user_id UUID
) RETURNS TABLE(
    ai_enabled BOOLEAN,
    consent_date TIMESTAMPTZ,
    can_process BOOLEAN,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ps.ai_processing_enabled, FALSE) AS ai_enabled,
        ps.ai_processing_consent_date AS consent_date,
        COALESCE(ps.ai_processing_enabled, FALSE) AS can_process,
        CASE 
            WHEN ps.ai_processing_enabled = TRUE THEN 'AI processing enabled by user consent'
            WHEN ps.ai_processing_enabled = FALSE THEN 'AI processing disabled by user preference'
            WHEN ps.user_id IS NULL THEN 'No privacy settings configured - AI processing disabled by default'
            ELSE 'AI processing status unknown'
        END AS reason
    FROM (SELECT p_user_id AS uid) t
    LEFT JOIN privacy_settings ps ON ps.user_id = t.uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- =============================================================================
-- PART 3: CONSENT-AWARE VIEWS
-- =============================================================================

-- View for load monitoring with consent checks (SECURITY INVOKER)
-- Returns NULL metrics if consent is missing, includes consent_blocked flag
CREATE OR REPLACE VIEW v_load_monitoring_consent 
WITH (security_invoker = true)
AS
SELECT 
    lm.id,
    lm.workout_log_id,
    lm.player_id,
    -- Only show metrics if viewer is the player OR has consent
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN lm.daily_load
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(lm.player_id, coach_tm.team_id)
        ) THEN lm.daily_load
        ELSE NULL
    END AS daily_load,
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN lm.acute_load
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(lm.player_id, coach_tm.team_id)
        ) THEN lm.acute_load
        ELSE NULL
    END AS acute_load,
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN lm.chronic_load
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(lm.player_id, coach_tm.team_id)
        ) THEN lm.chronic_load
        ELSE NULL
    END AS chronic_load,
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN lm.acwr
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(lm.player_id, coach_tm.team_id)
        ) THEN lm.acwr
        ELSE NULL
    END AS acwr,
    -- Health-related fields require health consent
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN lm.injury_risk_level
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_health_sharing(lm.player_id, coach_tm.team_id)
        ) THEN lm.injury_risk_level
        ELSE NULL
    END AS injury_risk_level,
    lm.calculated_at,
    lm.created_at,
    -- Consent status flags
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN FALSE
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(lm.player_id, coach_tm.team_id)
        ) THEN FALSE
        ELSE TRUE
    END AS consent_blocked,
    CASE 
        WHEN lm.player_id = (SELECT auth.uid()) THEN 'own_data'
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = lm.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(lm.player_id, coach_tm.team_id)
        ) THEN 'team_consent'
        ELSE 'no_consent'
    END AS access_reason
FROM load_monitoring lm;

-- Grant access to the view
GRANT SELECT ON v_load_monitoring_consent TO authenticated;

-- View for workout logs with consent checks (SECURITY INVOKER)
CREATE OR REPLACE VIEW v_workout_logs_consent 
WITH (security_invoker = true)
AS
SELECT 
    wl.id,
    wl.player_id,
    wl.session_id,
    -- Only show details if viewer is the player OR has consent
    CASE 
        WHEN wl.player_id = (SELECT auth.uid()) THEN wl.completed_at
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = wl.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(wl.player_id, coach_tm.team_id)
        ) THEN wl.completed_at
        ELSE NULL
    END AS completed_at,
    CASE 
        WHEN wl.player_id = (SELECT auth.uid()) THEN wl.rpe
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = wl.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(wl.player_id, coach_tm.team_id)
        ) THEN wl.rpe
        ELSE NULL
    END AS rpe,
    CASE 
        WHEN wl.player_id = (SELECT auth.uid()) THEN wl.duration_minutes
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = wl.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(wl.player_id, coach_tm.team_id)
        ) THEN wl.duration_minutes
        ELSE NULL
    END AS duration_minutes,
    CASE 
        WHEN wl.player_id = (SELECT auth.uid()) THEN wl.notes
        WHEN EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = wl.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(wl.player_id, coach_tm.team_id)
        ) THEN wl.notes
        ELSE NULL
    END AS notes,
    wl.created_at,
    wl.updated_at,
    -- Consent status flags
    CASE 
        WHEN wl.player_id = (SELECT auth.uid()) THEN FALSE
        ELSE NOT EXISTS (
            SELECT 1 FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = (SELECT auth.uid())
            AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
            AND coach_tm.status = 'active'
            AND player_tm.user_id = wl.player_id
            AND player_tm.status = 'active'
            AND check_performance_sharing(wl.player_id, coach_tm.team_id)
        )
    END AS consent_blocked
FROM workout_logs wl;

-- Grant access to the view
GRANT SELECT ON v_workout_logs_consent TO authenticated;

-- =============================================================================
-- PART 4: ENHANCED RLS POLICIES FOR COACH ACCESS WITH CONSENT
-- =============================================================================

-- Drop existing coach policies on load_monitoring if they exist
DROP POLICY IF EXISTS "Coaches can view team load monitoring with consent" ON load_monitoring;

-- Create consent-aware coach policy for load_monitoring
CREATE POLICY "Coaches can view team load monitoring with consent" 
ON load_monitoring FOR SELECT 
USING (
    -- Player can always see their own data
    player_id = (SELECT auth.uid())
    OR
    -- Coaches can see data only if player has enabled sharing for their team
    EXISTS (
        SELECT 1 
        FROM team_members coach_tm
        JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
        WHERE coach_tm.user_id = (SELECT auth.uid())
        AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
        AND coach_tm.status = 'active'
        AND player_tm.user_id = load_monitoring.player_id
        AND player_tm.status = 'active'
        AND check_performance_sharing(load_monitoring.player_id, coach_tm.team_id)
    )
);

-- Drop existing coach policies on workout_logs if they exist
DROP POLICY IF EXISTS "Coaches can view team workout logs with consent" ON workout_logs;

-- Create consent-aware coach policy for workout_logs
CREATE POLICY "Coaches can view team workout logs with consent" 
ON workout_logs FOR SELECT 
USING (
    -- Player can always see their own data
    player_id = (SELECT auth.uid())
    OR
    -- Coaches can see data only if player has enabled sharing for their team
    EXISTS (
        SELECT 1 
        FROM team_members coach_tm
        JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
        WHERE coach_tm.user_id = (SELECT auth.uid())
        AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
        AND coach_tm.status = 'active'
        AND player_tm.user_id = workout_logs.player_id
        AND player_tm.status = 'active'
        AND check_performance_sharing(workout_logs.player_id, coach_tm.team_id)
    )
);

-- =============================================================================
-- PART 5: CONSENT AUDIT LOGGING
-- =============================================================================

-- Table to log consent-related access attempts (for GDPR Article 30 compliance)
CREATE TABLE IF NOT EXISTS consent_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accessor_user_id UUID NOT NULL,
    target_user_id UUID NOT NULL,
    resource_type TEXT NOT NULL, -- 'load_monitoring', 'workout_logs', etc.
    access_granted BOOLEAN NOT NULL,
    consent_type TEXT, -- 'performance', 'health', 'ai_processing'
    team_id UUID,
    access_reason TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on consent_access_log
ALTER TABLE consent_access_log ENABLE ROW LEVEL SECURITY;

-- Only system/service role can write to this table
DROP POLICY IF EXISTS "Service role can manage consent logs" ON consent_access_log;
CREATE POLICY "Service role can manage consent logs" 
ON consent_access_log FOR ALL 
USING (FALSE)
WITH CHECK (FALSE);

-- Users can read their own access logs (both as accessor and target)
DROP POLICY IF EXISTS "Users can view their own consent access logs" ON consent_access_log;
CREATE POLICY "Users can view their own consent access logs" 
ON consent_access_log FOR SELECT 
USING (
    accessor_user_id = (SELECT auth.uid())
    OR target_user_id = (SELECT auth.uid())
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_consent_access_log_accessor ON consent_access_log(accessor_user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_access_log_target ON consent_access_log(target_user_id, accessed_at DESC);

-- =============================================================================
-- PART 6: GRANT PERMISSIONS
-- =============================================================================

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION check_performance_sharing(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_health_sharing(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_ai_processing_enabled(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_metric_category_allowed(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_coached_teams() TO authenticated;
GRANT EXECUTE ON FUNCTION require_ai_consent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_consent_status(UUID) TO authenticated;

-- =============================================================================
-- NOTES
-- =============================================================================
/*
This migration implements consent-aware access enforcement:

1. Helper Functions:
   - check_performance_sharing(player_id, team_id) - Checks if player allows performance data sharing
   - check_health_sharing(player_id, team_id) - Checks if player allows health data sharing
   - check_ai_processing_enabled(user_id) - Checks if user has enabled AI processing
   - check_metric_category_allowed(player_id, team_id, category) - Checks specific metric category access
   - get_coached_teams() - Returns teams where current user is coach

2. AI Fail-Fast:
   - require_ai_consent(user_id) - Raises exception if AI processing is disabled
   - get_ai_consent_status(user_id) - Returns detailed AI consent status

3. Consent-Aware Views:
   - v_load_monitoring_consent - Load monitoring with NULL values if no consent
   - v_workout_logs_consent - Workout logs with NULL values if no consent
   Both views include consent_blocked flag for UI handling

4. Enhanced RLS Policies:
   - Coaches can only view player data if player has enabled sharing for their team
   - Players always have full access to their own data

5. Audit Logging:
   - consent_access_log table for GDPR Article 30 compliance
   - Tracks who accessed what data and whether consent was present

USAGE:
- Use v_load_monitoring_consent instead of load_monitoring for coach dashboards
- Use v_workout_logs_consent instead of workout_logs for coach dashboards
- Call require_ai_consent(user_id) before any AI processing
- Check consent_blocked flag in UI to show appropriate messages
*/




-- ============================================================================
-- Migration: 071_populate_exercise_registry.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- POPULATE EXERCISE REGISTRY FROM EXISTING TABLES
-- =============================================================================
-- This script populates the exercise_registry table from existing exercise data
-- Run after migration 070 has been applied
-- =============================================================================

-- =============================================================================
-- STEP 1: Populate from Plyometrics Exercises
-- =============================================================================

INSERT INTO exercise_registry (
    name,
    exercise_type,
    category,
    difficulty_level,
    description,
    instructions,
    plyometric_details_id,
    video_url,
    thumbnail_url,
    equipment_needed,
    position_specific,
    applicable_positions,
    research_based,
    research_source,
    effectiveness_rating,
    injury_risk_rating,
    is_active,
    is_public,
    created_at,
    updated_at
)
SELECT 
    exercise_name,
    'plyometric'::TEXT,
    exercise_category::TEXT::exercise_category_enum,
    difficulty_level::TEXT::difficulty_level_enum,
    description,
    instructions,
    id, -- Reference to plyometrics_exercises
    video_url,
    thumbnail_url,
    equipment_needed,
    position_specific,
    CASE 
        WHEN position_applications IS NOT NULL 
        THEN ARRAY(SELECT jsonb_object_keys(position_applications))::UUID[]
        ELSE ARRAY[]::UUID[]
    END,
    research_based,
    research_source,
    effectiveness_rating,
    CASE injury_risk_rating
        WHEN 'Low' THEN 'Low'::risk_level_enum
        WHEN 'Moderate' THEN 'Moderate'::risk_level_enum
        WHEN 'High' THEN 'High'::risk_level_enum
        ELSE 'Low'::risk_level_enum
    END,
    TRUE, -- is_active
    TRUE, -- is_public
    created_at,
    updated_at
FROM plyometrics_exercises
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 2: Populate from Isometrics Exercises
-- =============================================================================

INSERT INTO exercise_registry (
    name,
    exercise_type,
    category,
    difficulty_level,
    description,
    instructions,
    isometric_details_id,
    video_url,
    equipment_needed,
    position_specific,
    research_based,
    research_source,
    effectiveness_rating,
    injury_risk_rating,
    is_active,
    is_public,
    created_at,
    updated_at
)
SELECT 
    name,
    'isometric'::TEXT,
    CASE 
        WHEN category = 'Injury Prevention' THEN 'Injury Prevention'::exercise_category_enum
        WHEN category = 'Rehabilitation' THEN 'Rehabilitation'::exercise_category_enum
        ELSE 'Strength'::exercise_category_enum
    END,
    difficulty_level::TEXT::difficulty_level_enum,
    description,
    instructions,
    id, -- Reference to isometrics_exercises
    video_url,
    ARRAY[]::TEXT[], -- No equipment_needed in isometrics_exercises
    FALSE, -- Not position-specific by default
    research_based,
    research_source,
    effectiveness_rating,
    'Low'::risk_level_enum, -- Isometrics are generally low risk
    TRUE, -- is_active
    TRUE, -- is_public
    created_at,
    updated_at
FROM isometrics_exercises
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 3: Populate from General Exercises
-- =============================================================================

INSERT INTO exercise_registry (
    name,
    exercise_type,
    category,
    difficulty_level,
    description,
    general_exercise_id,
    video_url,
    equipment_needed,
    position_specific,
    applicable_positions,
    research_based,
    is_active,
    is_public,
    created_at,
    updated_at
)
SELECT 
    name,
    CASE 
        WHEN category IN ('Strength', 'Flexibility') THEN 'strength'
        WHEN category IN ('Speed', 'Agility') THEN 'skill'
        ELSE 'skill'
    END::TEXT,
    CASE 
        WHEN category IN ('Strength', 'Speed', 'Agility', 'Flexibility', 'Position-Specific') 
        THEN category::TEXT::exercise_category_enum
        ELSE 'Strength'::exercise_category_enum
    END,
    'Intermediate'::difficulty_level_enum, -- Default since general exercises don't have difficulty
    COALESCE(description, 'No description available'),
    id, -- Reference to exercises
    video_url,
    equipment_needed,
    position_specific,
    applicable_positions,
    FALSE, -- research_based not in general exercises
    TRUE, -- is_active
    TRUE, -- is_public
    created_at,
    updated_at
FROM exercises
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 4: Verification Queries
-- =============================================================================

-- Count exercises by type
SELECT 
    exercise_type,
    COUNT(*) AS count
FROM exercise_registry
GROUP BY exercise_type
ORDER BY count DESC;

-- Count exercises by category
SELECT 
    category,
    COUNT(*) AS count
FROM exercise_registry
GROUP BY category
ORDER BY count DESC;

-- Count exercises by difficulty
SELECT 
    difficulty_level,
    COUNT(*) AS count
FROM exercise_registry
GROUP BY difficulty_level
ORDER BY 
    CASE difficulty_level
        WHEN 'Beginner' THEN 1
        WHEN 'Intermediate' THEN 2
        WHEN 'Advanced' THEN 3
        WHEN 'Elite' THEN 4
    END;

-- Verify all references are valid
SELECT 
    er.id,
    er.name,
    er.exercise_type,
    CASE 
        WHEN er.plyometric_details_id IS NOT NULL THEN 'Has plyometric details'
        WHEN er.isometric_details_id IS NOT NULL THEN 'Has isometric details'
        WHEN er.general_exercise_id IS NOT NULL THEN 'Has general exercise details'
        ELSE 'ERROR: No details linked'
    END AS details_status
FROM exercise_registry er
WHERE 
    (er.plyometric_details_id IS NULL AND er.exercise_type = 'plyometric')
    OR (er.isometric_details_id IS NULL AND er.exercise_type = 'isometric')
    OR (er.general_exercise_id IS NULL AND er.exercise_type IN ('strength', 'skill'));

-- Sample query to verify joins work
SELECT 
    er.name,
    er.exercise_type,
    er.difficulty_level,
    pe.coaching_cues,
    ie.injury_prevention_benefits,
    e.movement_pattern
FROM exercise_registry er
LEFT JOIN plyometrics_exercises pe ON er.plyometric_details_id = pe.id
LEFT JOIN isometrics_exercises ie ON er.isometric_details_id = ie.id
LEFT JOIN exercises e ON er.general_exercise_id = e.id
LIMIT 10;

-- =============================================================================
-- SUMMARY REPORT
-- =============================================================================

SELECT 
    'Total exercises in registry' AS metric,
    COUNT(*)::TEXT AS value
FROM exercise_registry
UNION ALL
SELECT 
    'Plyometric exercises' AS metric,
    COUNT(*)::TEXT AS value
FROM exercise_registry
WHERE exercise_type = 'plyometric'
UNION ALL
SELECT 
    'Isometric exercises' AS metric,
    COUNT(*)::TEXT AS value
FROM exercise_registry
WHERE exercise_type = 'isometric'
UNION ALL
SELECT 
    'General exercises' AS metric,
    COUNT(*)::TEXT AS value
FROM exercise_registry
WHERE exercise_type IN ('strength', 'skill')
UNION ALL
SELECT 
    'Position-specific exercises' AS metric,
    COUNT(*)::TEXT AS value
FROM exercise_registry
WHERE position_specific = TRUE
UNION ALL
SELECT 
    'Research-based exercises' AS metric,
    COUNT(*)::TEXT AS value
FROM exercise_registry
WHERE research_based = TRUE;

-- =============================================================================
-- NOTES
-- =============================================================================
/*
This script:
1. Populates exercise_registry from plyometrics_exercises (70+ exercises)
2. Populates exercise_registry from isometrics_exercises (3+ exercises)
3. Populates exercise_registry from exercises (general library)
4. Verifies all data was populated correctly
5. Provides summary statistics

After running this script, you should:
1. Verify the counts match your expectations
2. Check that no exercises are missing details (see verification queries)
3. Update your application code to use exercise_registry instead of individual tables
4. Consider creating a view that combines the most commonly used fields

Example view:
CREATE VIEW v_exercises_full AS
SELECT 
    er.*,
    pe.coaching_cues,
    pe.common_mistakes,
    ie.injury_prevention_benefits,
    e.movement_pattern
FROM exercise_registry er
LEFT JOIN plyometrics_exercises pe ON er.plyometric_details_id = pe.id
LEFT JOIN isometrics_exercises ie ON er.isometric_details_id = ie.id
LEFT JOIN exercises e ON er.general_exercise_id = e.id;
*/




-- ============================================================================
-- Migration: 072_backfill_metric_entries.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- BACKFILL METRIC ENTRIES FROM POSITION_SPECIFIC_METRICS
-- =============================================================================
-- This script migrates data from the old position_specific_metrics table
-- to the new metric_definitions/metric_entries system
-- Run after migration 070 and 071
-- =============================================================================

-- =============================================================================
-- STEP 1: Create Metric Definitions from Existing Data
-- =============================================================================

-- This finds all unique metric_name values from position_specific_metrics
-- and creates metric_definitions for them

INSERT INTO metric_definitions (
    code,
    display_name,
    value_type,
    unit,
    aggregation_method,
    position_id,
    is_position_specific,
    category,
    description,
    is_active
)
SELECT DISTINCT
    -- Generate code from metric_name (lowercase, replace spaces with underscores)
    LOWER(REGEXP_REPLACE(metric_name, '[^a-zA-Z0-9]+', '_', 'g')) AS code,
    
    -- Use original metric_name as display_name
    metric_name AS display_name,
    
    -- Infer value_type from metric_unit
    CASE 
        WHEN metric_unit IN ('%', 'percent', 'percentage') THEN 'percent'
        WHEN metric_unit IN ('s', 'sec', 'seconds', 'ms', 'milliseconds') THEN 'time'
        WHEN metric_value::TEXT ~ '^[0-9]+$' THEN 'integer'
        ELSE 'decimal'
    END AS value_type,
    
    -- Use metric_unit as unit
    metric_unit AS unit,
    
    -- Default aggregation method based on metric name
    CASE 
        WHEN metric_name ILIKE '%volume%' OR metric_name ILIKE '%total%' THEN 'sum'
        WHEN metric_name ILIKE '%rate%' OR metric_name ILIKE '%percentage%' THEN 'avg'
        WHEN metric_name ILIKE '%max%' OR metric_name ILIKE '%peak%' THEN 'max'
        WHEN metric_name ILIKE '%min%' THEN 'min'
        ELSE 'avg'
    END AS aggregation_method,
    
    -- Link to position if position_id exists
    position_id,
    
    -- Mark as position-specific if position_id is not null
    (position_id IS NOT NULL) AS is_position_specific,
    
    -- Infer category from metric name
    CASE 
        WHEN metric_name ILIKE '%volume%' OR metric_name ILIKE '%reps%' THEN 'Volume'
        WHEN metric_name ILIKE '%technique%' OR metric_name ILIKE '%form%' THEN 'Technique'
        WHEN metric_name ILIKE '%time%' OR metric_name ILIKE '%speed%' THEN 'Performance'
        ELSE 'Performance'
    END AS category,
    
    -- Description from aggregated context
    'Migrated from position_specific_metrics: ' || metric_name AS description,
    
    -- Active by default
    TRUE AS is_active
    
FROM position_specific_metrics
WHERE metric_name IS NOT NULL
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- STEP 2: Migrate Metric Entries
-- =============================================================================

-- This migrates all historical metric data to the new metric_entries table
INSERT INTO metric_entries (
    player_id,
    workout_log_id,
    metric_definition_id,
    date,
    value,
    notes,
    created_at,
    updated_at
)
SELECT 
    psm.player_id,
    psm.workout_log_id,
    md.id AS metric_definition_id,
    psm.date,
    psm.metric_value,
    NULL AS notes, -- old table didn't have notes
    psm.created_at,
    psm.updated_at
FROM position_specific_metrics psm
JOIN metric_definitions md ON (
    md.code = LOWER(REGEXP_REPLACE(psm.metric_name, '[^a-zA-Z0-9]+', '_', 'g'))
)
WHERE psm.metric_value IS NOT NULL
ON CONFLICT (player_id, metric_definition_id, workout_log_id) DO NOTHING;

-- =============================================================================
-- STEP 3: Verification Queries
-- =============================================================================

-- Count metrics migrated
SELECT 
    'Metric definitions created' AS metric,
    COUNT(*)::TEXT AS value
FROM metric_definitions
WHERE description ILIKE '%Migrated from position_specific_metrics%'
UNION ALL
SELECT 
    'Metric entries migrated' AS metric,
    COUNT(*)::TEXT AS value
FROM metric_entries;

-- Show sample of migrated data
SELECT 
    md.display_name,
    md.code,
    md.value_type,
    md.unit,
    COUNT(me.id) AS entry_count,
    MIN(me.date) AS earliest_date,
    MAX(me.date) AS latest_date
FROM metric_definitions md
LEFT JOIN metric_entries me ON me.metric_definition_id = md.id
WHERE md.description ILIKE '%Migrated from position_specific_metrics%'
GROUP BY md.id, md.display_name, md.code, md.value_type, md.unit
ORDER BY entry_count DESC;

-- Verify data integrity
SELECT 
    'Original position_specific_metrics rows' AS check_type,
    COUNT(*)::TEXT AS count
FROM position_specific_metrics
UNION ALL
SELECT 
    'Migrated metric_entries rows' AS check_type,
    COUNT(*)::TEXT AS count
FROM metric_entries me
JOIN metric_definitions md ON me.metric_definition_id = md.id
WHERE md.description ILIKE '%Migrated from position_specific_metrics%';

-- Check for any metrics that failed to migrate
SELECT DISTINCT 
    psm.metric_name,
    psm.metric_unit,
    COUNT(*) AS occurrence_count
FROM position_specific_metrics psm
LEFT JOIN metric_definitions md ON (
    md.code = LOWER(REGEXP_REPLACE(psm.metric_name, '[^a-zA-Z0-9]+', '_', 'g'))
)
WHERE md.id IS NULL
GROUP BY psm.metric_name, psm.metric_unit;

-- =============================================================================
-- STEP 4: Create View for Position-Specific Metrics (Legacy Compatibility)
-- =============================================================================

-- This view mimics the old position_specific_metrics structure
-- Use it for backward compatibility with existing queries

CREATE OR REPLACE VIEW v_position_specific_metrics_legacy AS
SELECT 
    me.id,
    me.player_id,
    me.workout_log_id,
    md.position_id,
    md.display_name AS metric_name,
    me.value AS metric_value,
    md.unit AS metric_unit,
    me.date,
    NULL::DECIMAL(10,2) AS weekly_total, -- Can be computed in application
    NULL::DECIMAL(10,2) AS monthly_total, -- Can be computed in application
    me.created_at,
    me.updated_at
FROM metric_entries me
JOIN metric_definitions md ON me.metric_definition_id = md.id;

-- Grant access to the view
GRANT SELECT ON v_position_specific_metrics_legacy TO authenticated;

-- =============================================================================
-- STEP 5: Optional - Archive Old Table
-- =============================================================================

-- After verifying migration is successful, you can archive the old table
-- DO NOT DROP until you're 100% confident the migration worked

-- Option A: Rename for archival (recommended)
-- ALTER TABLE position_specific_metrics RENAME TO position_specific_metrics_archived_20250129;

-- Option B: Create backup and drop (only after extensive testing)
-- CREATE TABLE position_specific_metrics_backup AS SELECT * FROM position_specific_metrics;
-- DROP TABLE position_specific_metrics;

-- =============================================================================
-- SUMMARY REPORT
-- =============================================================================

DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
    def_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM position_specific_metrics;
    SELECT COUNT(*) INTO new_count FROM metric_entries;
    SELECT COUNT(*) INTO def_count FROM metric_definitions 
    WHERE description ILIKE '%Migrated from position_specific_metrics%';
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'METRIC MIGRATION SUMMARY';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Original position_specific_metrics rows: %', old_count;
    RAISE NOTICE 'Metric definitions created: %', def_count;
    RAISE NOTICE 'Metric entries migrated: %', new_count;
    RAISE NOTICE '=============================================================================';
    
    IF new_count >= old_count THEN
        RAISE NOTICE '✅ Migration successful! All records migrated.';
    ELSIF new_count > old_count * 0.95 THEN
        RAISE NOTICE '⚠️  Migration mostly successful. % records migrated (% expected)', new_count, old_count;
        RAISE NOTICE '   Check verification queries for missing data.';
    ELSE
        RAISE NOTICE '❌ Migration incomplete! Only % of % records migrated.', new_count, old_count;
        RAISE NOTICE '   Review error logs and verification queries.';
    END IF;
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Review verification queries above';
    RAISE NOTICE '2. Test queries using metric_entries instead of position_specific_metrics';
    RAISE NOTICE '3. Update application code to use new metric system';
    RAISE NOTICE '4. For backward compatibility, use v_position_specific_metrics_legacy view';
    RAISE NOTICE '5. After confirming success, consider archiving old table';
    RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- NOTES
-- =============================================================================
/*
This migration:
1. Creates metric_definitions from unique metric_name values in position_specific_metrics
2. Migrates all metric data to metric_entries
3. Creates a legacy compatibility view
4. Provides comprehensive verification queries
5. Includes archival recommendations

After running this migration:

✅ DO:
- Test all metric-related queries
- Verify counts match expectations
- Update application code gradually
- Keep old table for at least 30 days

❌ DON'T:
- Drop the old table immediately
- Skip verification queries
- Assume 100% compatibility without testing

EXAMPLE QUERIES:

-- Old way (still works via view)
SELECT * FROM v_position_specific_metrics_legacy
WHERE player_id = $1;

-- New way (recommended)
SELECT 
    me.date,
    md.display_name,
    me.value,
    md.unit
FROM metric_entries me
JOIN metric_definitions md ON me.metric_definition_id = md.id
WHERE me.player_id = $1
ORDER BY me.date DESC;

-- Weekly aggregation (new system)
SELECT 
    date_trunc('week', me.date) AS week,
    md.display_name,
    CASE md.aggregation_method
        WHEN 'sum' THEN SUM(me.value)
        WHEN 'avg' THEN AVG(me.value)
        WHEN 'max' THEN MAX(me.value)
        WHEN 'min' THEN MIN(me.value)
    END AS aggregated_value,
    md.unit
FROM metric_entries me
JOIN metric_definitions md ON me.metric_definition_id = md.id
WHERE me.player_id = $1
GROUP BY week, md.display_name, md.aggregation_method, md.unit
ORDER BY week DESC;
*/




-- ============================================================================
-- Migration: 072_exercisedb_integration.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- EXERCISEDB API INTEGRATION - Migration 072
-- =============================================================================
-- Creates infrastructure for storing curated exercises from ExerciseDB API
-- tailored specifically for flag football training
-- =============================================================================

-- =============================================================================
-- PART 1: CREATE EXERCISEDB EXERCISES TABLE
-- =============================================================================

-- Table to store exercises imported from ExerciseDB API
CREATE TABLE IF NOT EXISTS exercisedb_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ExerciseDB API fields
    external_id VARCHAR(50) UNIQUE NOT NULL, -- Original ID from ExerciseDB
    name VARCHAR(255) NOT NULL,
    body_part VARCHAR(100) NOT NULL, -- 'back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'
    equipment VARCHAR(100) NOT NULL, -- 'barbell', 'body weight', 'cable', 'dumbbell', 'kettlebell', 'leverage machine', etc.
    target_muscle VARCHAR(100) NOT NULL, -- Primary target muscle
    secondary_muscles TEXT[], -- Array of secondary muscles
    gif_url TEXT, -- Animated GIF from ExerciseDB
    instructions TEXT[], -- Step-by-step instructions
    
    -- Flag Football Curation Fields
    is_curated BOOLEAN DEFAULT FALSE, -- Has been reviewed for flag football relevance
    flag_football_relevance INTEGER CHECK (flag_football_relevance BETWEEN 1 AND 10), -- 1-10 relevance score
    relevance_notes TEXT, -- Why this exercise is relevant for flag football
    
    -- Flag Football Categorization
    ff_category VARCHAR(100), -- Our internal category mapping
    ff_training_focus TEXT[], -- ['Speed', 'Agility', 'Strength', 'Injury Prevention', 'Position-Specific']
    applicable_positions TEXT[], -- ['QB', 'WR', 'RB', 'DB', 'Rusher', 'Center', 'All']
    
    -- Training Parameters (coach customizable)
    recommended_sets INTEGER,
    recommended_reps VARCHAR(50), -- '8-12' or '10' or 'AMRAP'
    recommended_rest_seconds INTEGER,
    difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
    
    -- Safety & Notes
    safety_notes TEXT[],
    coaching_cues TEXT[],
    common_mistakes TEXT[],
    progression_tips TEXT[],
    
    -- Integration with exercise_registry (can be added later when exercise_registry table exists)
    exercise_registry_id UUID, -- Will reference exercise_registry(id) when that table is created
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE, -- Coach approved for use
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 2: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_exercisedb_external_id ON exercisedb_exercises(external_id);
CREATE INDEX IF NOT EXISTS idx_exercisedb_body_part ON exercisedb_exercises(body_part);
CREATE INDEX IF NOT EXISTS idx_exercisedb_equipment ON exercisedb_exercises(equipment);
CREATE INDEX IF NOT EXISTS idx_exercisedb_target_muscle ON exercisedb_exercises(target_muscle);
CREATE INDEX IF NOT EXISTS idx_exercisedb_curated ON exercisedb_exercises(is_curated) WHERE is_curated = TRUE;
CREATE INDEX IF NOT EXISTS idx_exercisedb_approved ON exercisedb_exercises(is_approved) WHERE is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_exercisedb_ff_category ON exercisedb_exercises(ff_category);
CREATE INDEX IF NOT EXISTS idx_exercisedb_relevance ON exercisedb_exercises(flag_football_relevance DESC NULLS LAST);

-- =============================================================================
-- PART 3: CREATE FLAG FOOTBALL EXERCISE MAPPING TABLE
-- =============================================================================

-- Maps ExerciseDB body parts and targets to flag football training categories
CREATE TABLE IF NOT EXISTS ff_exercise_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source mapping
    body_part VARCHAR(100),
    target_muscle VARCHAR(100),
    equipment VARCHAR(100),
    
    -- Flag Football mapping
    ff_category VARCHAR(100) NOT NULL,
    ff_training_focus TEXT[] NOT NULL,
    default_relevance_score INTEGER DEFAULT 5 CHECK (default_relevance_score BETWEEN 1 AND 10),
    applicable_positions TEXT[] DEFAULT ARRAY['All'],
    
    -- Priority for auto-curation
    auto_curate BOOLEAN DEFAULT FALSE,
    priority_order INTEGER DEFAULT 100,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 4: SEED FLAG FOOTBALL EXERCISE MAPPINGS
-- =============================================================================

-- These mappings define which ExerciseDB exercises are most relevant for flag football
INSERT INTO ff_exercise_mappings (body_part, target_muscle, ff_category, ff_training_focus, default_relevance_score, applicable_positions, auto_curate, priority_order, notes)
VALUES
    -- LOWER BODY - Critical for flag football
    ('upper legs', 'glutes', 'Hip Power & Explosiveness', ARRAY['Speed', 'Agility', 'Acceleration'], 9, ARRAY['All'], TRUE, 1, 'Glute strength essential for sprinting and cutting'),
    ('upper legs', 'quads', 'Leg Strength', ARRAY['Speed', 'Acceleration', 'Deceleration'], 9, ARRAY['All'], TRUE, 2, 'Quad strength for explosive starts and stops'),
    ('upper legs', 'hamstrings', 'Posterior Chain', ARRAY['Speed', 'Injury Prevention'], 10, ARRAY['All'], TRUE, 3, 'Hamstring strength critical for sprint speed and injury prevention'),
    ('upper legs', 'adductors', 'Lateral Movement', ARRAY['Agility', 'Injury Prevention'], 8, ARRAY['All'], TRUE, 4, 'Adductor strength for lateral cuts and COD'),
    ('lower legs', 'calves', 'Ankle Stability', ARRAY['Speed', 'Agility', 'Injury Prevention'], 7, ARRAY['All'], TRUE, 5, 'Calf strength for push-off and ankle stability'),
    
    -- CORE - Essential for rotational power and stability
    ('waist', 'abs', 'Core Stability', ARRAY['Rotational Power', 'Stability'], 8, ARRAY['All'], TRUE, 6, 'Core strength for throwing, cutting, and balance'),
    ('waist', 'obliques', 'Rotational Core', ARRAY['Rotational Power', 'Throwing'], 9, ARRAY['QB', 'WR', 'RB'], TRUE, 7, 'Oblique strength for throwing power and route running'),
    
    -- UPPER BODY - Position specific
    ('shoulders', 'delts', 'Shoulder Stability', ARRAY['Throwing', 'Injury Prevention'], 8, ARRAY['QB', 'Center'], TRUE, 8, 'Shoulder strength for throwing and snapping'),
    ('back', 'lats', 'Upper Body Power', ARRAY['Throwing', 'Pulling'], 7, ARRAY['QB', 'Rusher'], TRUE, 9, 'Lat strength for throwing velocity'),
    ('chest', 'pectorals', 'Pushing Power', ARRAY['Blocking', 'Stiff Arm'], 6, ARRAY['RB', 'Rusher'], TRUE, 10, 'Chest strength for contact situations'),
    ('upper arms', 'triceps', 'Arm Extension', ARRAY['Throwing', 'Stiff Arm'], 7, ARRAY['QB', 'RB'], TRUE, 11, 'Tricep strength for throwing and arm extension'),
    ('upper arms', 'biceps', 'Arm Strength', ARRAY['Flag Pulling', 'Catching'], 6, ARRAY['DB', 'Rusher'], TRUE, 12, 'Bicep strength for flag pulls'),
    
    -- CARDIO - Conditioning
    ('cardio', NULL, 'Conditioning', ARRAY['Endurance', 'Recovery'], 6, ARRAY['All'], TRUE, 13, 'Cardiovascular conditioning for game stamina'),
    
    -- FLEXIBILITY/MOBILITY
    ('back', 'spine', 'Mobility', ARRAY['Flexibility', 'Injury Prevention'], 7, ARRAY['All'], TRUE, 14, 'Spinal mobility for athletic movement'),
    ('lower legs', 'tibialis', 'Ankle Mobility', ARRAY['Injury Prevention', 'Agility'], 6, ARRAY['All'], FALSE, 15, 'Tibialis strength for shin splint prevention')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- PART 5: CREATE IMPORT LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS exercisedb_import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    import_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'targeted'
    status VARCHAR(50) NOT NULL DEFAULT 'started', -- 'started', 'completed', 'failed'
    
    -- Statistics
    total_fetched INTEGER DEFAULT 0,
    total_imported INTEGER DEFAULT 0,
    total_updated INTEGER DEFAULT 0,
    total_skipped INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    
    -- Filters used
    body_parts_filter TEXT[],
    equipment_filter TEXT[],
    
    -- Error details
    error_message TEXT,
    error_details JSONB,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Who triggered
    triggered_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 6: ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE exercisedb_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE ff_exercise_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercisedb_import_logs ENABLE ROW LEVEL SECURITY;

-- ExerciseDB Exercises: Anyone can view approved exercises, coaches can manage
CREATE POLICY "Anyone can view approved exercisedb exercises"
ON exercisedb_exercises FOR SELECT
USING (is_approved = TRUE AND is_active = TRUE);

CREATE POLICY "Coaches can view all exercisedb exercises"
ON exercisedb_exercises FOR SELECT
USING (is_coach() OR is_admin());

CREATE POLICY "Coaches can manage exercisedb exercises"
ON exercisedb_exercises FOR ALL
USING (is_coach() OR is_admin());

-- FF Exercise Mappings: Coaches can manage
CREATE POLICY "Anyone can view ff exercise mappings"
ON ff_exercise_mappings FOR SELECT
USING (TRUE);

CREATE POLICY "Coaches can manage ff exercise mappings"
ON ff_exercise_mappings FOR ALL
USING (is_coach() OR is_admin());

-- Import Logs: Only coaches can view
CREATE POLICY "Coaches can view import logs"
ON exercisedb_import_logs FOR SELECT
USING (is_coach() OR is_admin());

CREATE POLICY "Coaches can manage import logs"
ON exercisedb_import_logs FOR ALL
USING (is_coach() OR is_admin());

-- =============================================================================
-- PART 7: HELPER FUNCTIONS
-- =============================================================================

-- Function to auto-categorize exercises based on mappings
CREATE OR REPLACE FUNCTION auto_categorize_exercisedb_exercise()
RETURNS TRIGGER AS $$
DECLARE
    mapping RECORD;
BEGIN
    -- Find best matching mapping
    SELECT * INTO mapping
    FROM ff_exercise_mappings
    WHERE (body_part IS NULL OR body_part = NEW.body_part)
    AND (target_muscle IS NULL OR target_muscle = NEW.target_muscle)
    AND (equipment IS NULL OR equipment = NEW.equipment)
    ORDER BY 
        CASE WHEN body_part IS NOT NULL AND target_muscle IS NOT NULL AND equipment IS NOT NULL THEN 1
             WHEN body_part IS NOT NULL AND target_muscle IS NOT NULL THEN 2
             WHEN body_part IS NOT NULL THEN 3
             ELSE 4 END,
        priority_order
    LIMIT 1;
    
    IF mapping IS NOT NULL THEN
        NEW.ff_category := mapping.ff_category;
        NEW.ff_training_focus := mapping.ff_training_focus;
        NEW.flag_football_relevance := mapping.default_relevance_score;
        NEW.applicable_positions := mapping.applicable_positions;
        
        IF mapping.auto_curate THEN
            NEW.is_curated := TRUE;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-categorize on insert
DROP TRIGGER IF EXISTS trigger_auto_categorize_exercisedb ON exercisedb_exercises;
CREATE TRIGGER trigger_auto_categorize_exercisedb
    BEFORE INSERT ON exercisedb_exercises
    FOR EACH ROW
    EXECUTE FUNCTION auto_categorize_exercisedb_exercise();

-- Function to get flag football relevant exercises
CREATE OR REPLACE FUNCTION get_ff_relevant_exercises(
    p_category VARCHAR DEFAULT NULL,
    p_position VARCHAR DEFAULT NULL,
    p_min_relevance INTEGER DEFAULT 5,
    p_equipment VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    body_part VARCHAR,
    equipment VARCHAR,
    target_muscle VARCHAR,
    gif_url TEXT,
    ff_category VARCHAR,
    ff_training_focus TEXT[],
    flag_football_relevance INTEGER,
    applicable_positions TEXT[],
    difficulty_level VARCHAR,
    instructions TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.body_part,
        e.equipment,
        e.target_muscle,
        e.gif_url,
        e.ff_category,
        e.ff_training_focus,
        e.flag_football_relevance,
        e.applicable_positions,
        e.difficulty_level,
        e.instructions
    FROM exercisedb_exercises e
    WHERE e.is_active = TRUE
    AND e.is_approved = TRUE
    AND e.flag_football_relevance >= p_min_relevance
    AND (p_category IS NULL OR e.ff_category = p_category)
    AND (p_position IS NULL OR p_position = ANY(e.applicable_positions) OR 'All' = ANY(e.applicable_positions))
    AND (p_equipment IS NULL OR e.equipment = p_equipment)
    ORDER BY e.flag_football_relevance DESC, e.name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 8: CREATE VIEW FOR EASY QUERYING
-- =============================================================================

-- View for ExerciseDB exercises only (exercise_registry integration can be added later)
CREATE OR REPLACE VIEW v_ff_exercise_library AS
SELECT 
    e.id,
    e.external_id,
    e.name,
    e.body_part,
    e.equipment,
    e.target_muscle,
    e.secondary_muscles,
    e.gif_url,
    e.instructions,
    e.ff_category,
    e.ff_training_focus,
    e.flag_football_relevance,
    e.applicable_positions,
    e.recommended_sets,
    e.recommended_reps,
    e.recommended_rest_seconds,
    e.difficulty_level,
    e.safety_notes,
    e.coaching_cues,
    e.is_approved,
    e.approved_at,
    'exercisedb' AS source
FROM exercisedb_exercises e
WHERE e.is_active = TRUE;

-- =============================================================================
-- PART 9: UPDATE TIMESTAMP TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS update_exercisedb_exercises_updated_at ON exercisedb_exercises;
CREATE TRIGGER update_exercisedb_exercises_updated_at
    BEFORE UPDATE ON exercisedb_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify tables created
DO $$
BEGIN
    RAISE NOTICE 'ExerciseDB Integration Migration Complete';
    RAISE NOTICE '- exercisedb_exercises table created';
    RAISE NOTICE '- ff_exercise_mappings table created with % mappings', (SELECT COUNT(*) FROM ff_exercise_mappings);
    RAISE NOTICE '- exercisedb_import_logs table created';
    RAISE NOTICE '- RLS policies applied';
    RAISE NOTICE '- Auto-categorization trigger created';
    RAISE NOTICE '- Helper functions created';
END $$;



-- ============================================================================
-- Migration: 073_deletion_retention_enforcement.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- DELETION & RETENTION ENFORCEMENT - Migration 073
-- =============================================================================
-- Implements GDPR Article 17 (Right to Erasure) and data retention policies:
-- 1. Account deletion pipeline with soft-delete
-- 2. 30-day PII deletion queue processing
-- 3. 7-year emergency medical retention
-- 4. Deletion audit logging
-- =============================================================================

-- Fix initiate_account_deletion
CREATE OR REPLACE FUNCTION public.initiate_account_deletion(
    p_user_id UUID, 
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_request_id UUID;
    v_scheduled_delete TIMESTAMPTZ;
BEGIN
    -- Calculate scheduled hard delete date (30 days from now)
    v_scheduled_delete := now() + INTERVAL '30 days';
    
    -- Create deletion request
    INSERT INTO account_deletion_requests (
        user_id,
        reason,
        status,
        soft_deleted_at,
        scheduled_hard_delete_at
    ) VALUES (
        p_user_id,
        p_reason,
        'pending',
        now(),
        v_scheduled_delete
    )
    RETURNING id INTO v_request_id;
    
    -- Soft delete the user (set is_active = false)
    UPDATE users
    SET is_active = false,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Revoke all active sessions (mark timestamp)
    UPDATE account_deletion_requests
    SET sessions_revoked_at = now()
    WHERE id = v_request_id;
    
    -- Log the deletion request
    INSERT INTO privacy_audit_log (
        user_id,
        action,
        affected_table,
        affected_data
    ) VALUES (
        p_user_id,
        'deletion_requested',
        'users',
        jsonb_build_object(
            'request_id', v_request_id,
            'scheduled_hard_delete', v_scheduled_delete,
            'reason', p_reason
        )
    );
    
    RETURN v_request_id;
END;
$function$;

-- Fix cancel_account_deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion(
    p_request_id UUID, 
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_current_status TEXT;
BEGIN
    -- Get current status
    SELECT status INTO v_current_status
    FROM account_deletion_requests
    WHERE id = p_request_id AND user_id = p_user_id;
    
    -- Can only cancel if pending or processing
    IF v_current_status NOT IN ('pending', 'processing') THEN
        RETURN FALSE;
    END IF;
    
    -- Update request status
    UPDATE account_deletion_requests
    SET status = 'cancelled',
        updated_at = now()
    WHERE id = p_request_id;
    
    -- Reactivate user
    UPDATE users
    SET is_active = true,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Log cancellation
    INSERT INTO privacy_audit_log (
        user_id,
        action,
        affected_table,
        affected_data
    ) VALUES (
        p_user_id,
        'deletion_cancelled',
        'account_deletion_requests',
        jsonb_build_object('request_id', p_request_id)
    );
    
    RETURN TRUE;
END;
$function$;

-- Fix process_hard_deletion
CREATE OR REPLACE FUNCTION public.process_hard_deletion(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_user_id UUID;
    v_email_hash TEXT;
    v_deleted_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get user ID from request
    SELECT user_id INTO v_user_id
    FROM account_deletion_requests
    WHERE id = p_request_id AND status = 'pending';
    
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update request status to processing
    UPDATE account_deletion_requests
    SET status = 'processing',
        updated_at = now()
    WHERE id = p_request_id;
    
    -- Hash the email for emergency records before deletion
    SELECT encode(sha256(email::bytea), 'hex') INTO v_email_hash
    FROM users WHERE id = v_user_id;
    
    -- Update emergency medical records to preserve them with hashed email
    -- These records are retained for 7 years per legal requirements
    UPDATE emergency_medical_records
    SET user_email_hash = v_email_hash,
        user_id = NULL  -- Disassociate from user but keep record
    WHERE user_id = v_user_id;
    
    -- Delete user data from tables (in order of dependencies)
    -- Note: Tables with ON DELETE CASCADE will be handled automatically
    
    -- AI/Chat data
    DELETE FROM ai_chat_messages WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'ai_chat_messages');
    
    DELETE FROM ai_chat_sessions WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'ai_chat_sessions');
    
    -- Wellness/Health data
    DELETE FROM readiness_scores WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'readiness_scores');
    
    DELETE FROM wellness_logs WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'wellness_logs');
    
    DELETE FROM wellness_entries WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'wellness_entries');
    
    -- Training data
    DELETE FROM training_sessions WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'training_sessions');
    
    DELETE FROM load_monitoring WHERE player_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'load_monitoring');
    
    DELETE FROM load_daily WHERE player_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'load_daily');
    
    DELETE FROM workout_logs WHERE player_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'workout_logs');
    
    -- Notifications
    DELETE FROM notifications WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'notifications');
    
    -- Team memberships (will cascade to related data)
    DELETE FROM team_members WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'team_members');
    
    -- Privacy settings (cascade should handle, but be explicit)
    DELETE FROM team_sharing_settings WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'team_sharing_settings');
    
    DELETE FROM privacy_settings WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'privacy_settings');
    
    -- Consent records
    DELETE FROM gdpr_consent WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'gdpr_consent');
    
    DELETE FROM parental_consent WHERE minor_user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'parental_consent');
    
    -- Profile
    DELETE FROM profiles WHERE id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'profiles');
    
    -- User record (this may cascade more deletions)
    DELETE FROM users WHERE id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'users');
    
    -- Mark deletion as complete
    UPDATE account_deletion_requests
    SET status = 'completed',
        hard_deleted_at = now(),
        updated_at = now()
    WHERE id = p_request_id;
    
    -- Log completion (user_id will be NULL after user deletion)
    INSERT INTO privacy_audit_log (
        user_id,
        action,
        affected_table,
        affected_data
    ) VALUES (
        NULL, -- User no longer exists
        'deletion_completed',
        'users',
        jsonb_build_object(
            'request_id', p_request_id,
            'email_hash', v_email_hash,
            'tables_deleted', v_deleted_tables,
            'completed_at', now()
        )
    );
    
    -- Note: The actual auth.users deletion must be done via Supabase Admin API
    -- This function handles the public schema data
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Log failure
    UPDATE account_deletion_requests
    SET status = 'failed',
        error_message = SQLERRM,
        updated_at = now()
    WHERE id = p_request_id;
    
    -- Log the error
    INSERT INTO privacy_audit_log (
        user_id,
        action,
        affected_table,
        affected_data
    ) VALUES (
        v_user_id,
        'deletion_failed',
        'account_deletion_requests',
        jsonb_build_object(
            'request_id', p_request_id,
            'error', SQLERRM
        )
    );
    
    RETURN FALSE;
END;
$function$;

-- Fix get_deletions_ready_for_processing
CREATE OR REPLACE FUNCTION public.get_deletions_ready_for_processing()
RETURNS TABLE(
    request_id UUID, 
    user_id UUID, 
    scheduled_at TIMESTAMPTZ, 
    days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        adr.id as request_id,
        adr.user_id,
        adr.scheduled_hard_delete_at as scheduled_at,
        EXTRACT(DAY FROM adr.scheduled_hard_delete_at - now())::INTEGER as days_remaining
    FROM account_deletion_requests adr
    WHERE adr.status = 'pending'
    AND adr.scheduled_hard_delete_at <= now()
    ORDER BY adr.scheduled_hard_delete_at ASC;
END;
$function$;

-- Fix cleanup_expired_emergency_records
CREATE OR REPLACE FUNCTION public.cleanup_expired_emergency_records()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM emergency_medical_records
    WHERE retention_expires_at <= now();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log cleanup
    IF v_deleted_count > 0 THEN
        INSERT INTO privacy_audit_log (
            user_id,
            action,
            affected_table,
            affected_data
        ) VALUES (
            NULL,
            'retention_cleanup',
            'emergency_medical_records',
            jsonb_build_object(
                'records_deleted', v_deleted_count,
                'cleanup_date', now()
            )
        );
    END IF;
    
    RETURN v_deleted_count;
END;
$function$;

-- Fix anonymize_user_data_for_research
CREATE OR REPLACE FUNCTION public.anonymize_user_data_for_research(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_research_opt_in BOOLEAN;
    v_anonymized_id UUID;
BEGIN
    -- Check if user opted in to research
    SELECT research_opt_in INTO v_research_opt_in
    FROM privacy_settings
    WHERE user_id = p_user_id;
    
    IF NOT COALESCE(v_research_opt_in, FALSE) THEN
        RETURN FALSE;
    END IF;
    
    -- Generate anonymized ID
    v_anonymized_id := gen_random_uuid();
    
    -- Log anonymization
    INSERT INTO privacy_audit_log (
        user_id,
        action,
        affected_table,
        affected_data
    ) VALUES (
        p_user_id,
        'data_anonymized',
        'research_data',
        jsonb_build_object(
            'anonymized_id', v_anonymized_id,
            'anonymized_at', now()
        )
    );
    
    RETURN TRUE;
END;
$function$;

-- Add helper function to get deletion status for a user
CREATE OR REPLACE FUNCTION public.get_deletion_status(p_user_id UUID)
RETURNS TABLE(
    request_id UUID,
    status TEXT,
    requested_at TIMESTAMPTZ,
    scheduled_hard_delete_at TIMESTAMPTZ,
    days_until_deletion INTEGER,
    can_cancel BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        adr.id as request_id,
        adr.status,
        adr.requested_at,
        adr.scheduled_hard_delete_at,
        GREATEST(0, EXTRACT(DAY FROM adr.scheduled_hard_delete_at - now())::INTEGER) as days_until_deletion,
        adr.status IN ('pending', 'processing') as can_cancel
    FROM account_deletion_requests adr
    WHERE adr.user_id = p_user_id
    ORDER BY adr.created_at DESC
    LIMIT 1;
END;
$function$;

-- Add function to create emergency medical record with 7-year retention
CREATE OR REPLACE FUNCTION public.create_emergency_medical_record(
    p_user_id UUID,
    p_event_type TEXT,
    p_medical_data JSONB,
    p_location_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_record_id UUID;
BEGIN
    INSERT INTO emergency_medical_records (
        user_id,
        event_type,
        event_date,
        medical_data,
        location_data,
        retention_expires_at
    ) VALUES (
        p_user_id,
        p_event_type,
        now(),
        p_medical_data,
        p_location_data,
        now() + INTERVAL '7 years'  -- Legal requirement for medical records
    )
    RETURNING id INTO v_record_id;
    
    -- Log creation
    INSERT INTO privacy_audit_log (
        user_id,
        action,
        affected_table,
        affected_data
    ) VALUES (
        p_user_id,
        'emergency_record_created',
        'emergency_medical_records',
        jsonb_build_object(
            'record_id', v_record_id,
            'event_type', p_event_type,
            'retention_expires', now() + INTERVAL '7 years'
        )
    );
    
    RETURN v_record_id;
END;
$function$;




-- ============================================================================
-- Migration: 073_unify_acwr_ewma.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- UNIFY ACWR LOGIC TO EWMA
-- Migration: 073_unify_acwr_ewma.sql
-- Updates compute_acwr to use Exponentially Weighted Moving Average (EWMA)
-- matching the frontend AcwrService logic for optimal injury prevention.
-- =============================================================================

-- Acute Lambda: 0.2 (7-day window)
-- Chronic Lambda: 0.05 (28-day window)

CREATE OR REPLACE FUNCTION compute_acwr_ewma(athlete uuid)
RETURNS TABLE (
  session_date date,
  load numeric,
  acute_load numeric,
  chronic_load numeric,
  acwr numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  acute_lambda numeric := 0.2;
  chronic_lambda numeric := 0.05;
BEGIN
  RETURN QUERY
  WITH RECURSIVE 
  -- 1. Get all daily loads, filling missing days with 0
  date_range AS (
    SELECT 
      MIN(COALESCE(tsl.session_date, tsl.date)) as start_date,
      MAX(COALESCE(tsl.session_date, tsl.date)) as end_date
    FROM (
      SELECT session_date, CAST(NULL AS date) as date FROM training_sessions WHERE athlete_id = athlete OR user_id = athlete
      UNION ALL
      SELECT CAST(NULL AS date), date FROM sessions WHERE athlete_id = athlete
    ) tsl
  ),
  all_days AS (
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date as day
    FROM date_range
  ),
  daily_loads AS (
    SELECT 
      ad.day,
      COALESCE(SUM(l.load), 0)::numeric as load
    FROM all_days ad
    LEFT JOIN (
      SELECT session_date as date, (COALESCE(rpe, 0) * COALESCE(duration_minutes, 0)) as load FROM training_sessions WHERE athlete_id = athlete OR user_id = athlete
      UNION ALL
      SELECT date, (COALESCE(rpe, 0) * COALESCE(duration_minutes, 0)) as load FROM sessions WHERE athlete_id = athlete
    ) l ON ad.day = l.date
    GROUP BY ad.day
    ORDER BY ad.day ASC
  ),
  -- 2. Calculate EWMA recursively
  ewma_calc AS (
    -- Anchor member: first day
    (
      SELECT 
        day,
        load,
        load as acute_ewma,
        load as chronic_ewma,
        1 as row_num
      FROM daily_loads
      ORDER BY day ASC
      LIMIT 1
    )
    UNION ALL
    -- Recursive member
    SELECT 
      dl.day,
      dl.load,
      (acute_lambda * dl.load + (1 - acute_lambda) * ec.acute_ewma)::numeric,
      (chronic_lambda * dl.load + (1 - chronic_lambda) * ec.chronic_ewma)::numeric,
      ec.row_num + 1
    FROM daily_loads dl
    JOIN ewma_calc ec ON dl.day > ec.day
    WHERE dl.day = (SELECT day FROM daily_loads WHERE day > ec.day ORDER BY day ASC LIMIT 1)
  )
  SELECT 
    ec.day as session_date,
    ec.load,
    ec.acute_ewma as acute_load,
    ec.chronic_ewma as chronic_load,
    CASE 
      WHEN ec.chronic_ewma = 0 THEN 0 
      ELSE (ec.acute_ewma / ec.chronic_ewma)::numeric 
    END as acwr
  FROM ewma_calc ec
  ORDER BY ec.day DESC;
END;
$$;

-- Update the original function to point to the new logic
CREATE OR REPLACE FUNCTION compute_acwr(athlete uuid)
RETURNS TABLE (
  session_date date,
  load numeric,
  acute_load numeric,
  chronic_load numeric,
  acwr numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY SELECT * FROM compute_acwr_ewma(athlete);
END;
$$;

COMMENT ON FUNCTION compute_acwr IS 'Computes ACWR using EWMA (Exponentially Weighted Moving Average) to match the frontend logic. Acute Lambda: 0.2, Chronic Lambda: 0.05.';




-- ============================================================================
-- Migration: 074_consent_performance_indexes.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- CONSENT PERFORMANCE INDEXES - Migration 074
-- =============================================================================
-- This migration adds optimized indexes for consent-aware view performance.
-- 
-- Based on EXPLAIN ANALYZE of consent views and common query patterns.
-- These indexes specifically optimize:
-- 1. Consent lookup joins (team_sharing_settings + team_members)
-- 2. Player data queries with date ordering
-- 3. Privacy settings lookups
-- 4. Deletion queue processing
-- =============================================================================

-- =============================================================================
-- PART 1: CONSENT LOOKUP INDEXES
-- =============================================================================

-- Index for fast consent lookup in coach queries
-- Used by: v_load_monitoring_consent, v_workout_logs_consent
CREATE INDEX IF NOT EXISTS idx_team_sharing_settings_consent_lookup
ON team_sharing_settings (user_id, team_id)
WHERE performance_sharing_enabled = true;

COMMENT ON INDEX idx_team_sharing_settings_consent_lookup IS 
'Optimizes consent checks in coach-facing views. Partial index only includes players who have enabled sharing.';

-- Index for health consent lookup (separate from performance)
CREATE INDEX IF NOT EXISTS idx_team_sharing_settings_health_consent
ON team_sharing_settings (user_id, team_id)
WHERE health_sharing_enabled = true;

COMMENT ON INDEX idx_team_sharing_settings_health_consent IS 
'Optimizes health data consent checks. Partial index for players who enabled health sharing.';

-- Index for fast coach membership lookup
-- Used by: consent views to verify coach role
CREATE INDEX IF NOT EXISTS idx_team_members_active_coaches
ON team_members (team_id, user_id)
WHERE role IN ('coach', 'assistant_coach', 'head_coach', 'admin') 
AND status = 'active';

COMMENT ON INDEX idx_team_members_active_coaches IS 
'Optimizes coach role verification in consent views. Partial index for active coaches only.';

-- Index for active player membership lookup
CREATE INDEX IF NOT EXISTS idx_team_members_active_players
ON team_members (team_id, user_id)
WHERE role = 'player' AND status = 'active';

COMMENT ON INDEX idx_team_members_active_players IS 
'Optimizes player membership lookup in team queries.';

-- =============================================================================
-- PART 2: PLAYER DATA INDEXES
-- =============================================================================

-- Index for load monitoring queries by player with date ordering
CREATE INDEX IF NOT EXISTS idx_load_monitoring_player_date
ON load_monitoring (player_id, calculated_at DESC);

COMMENT ON INDEX idx_load_monitoring_player_date IS 
'Optimizes player load history queries. DESC ordering matches common query pattern.';

-- Index for workout logs queries by player with date ordering
CREATE INDEX IF NOT EXISTS idx_workout_logs_player_date
ON workout_logs (player_id, created_at DESC);

COMMENT ON INDEX idx_workout_logs_player_date IS 
'Optimizes player workout history queries. DESC ordering matches common query pattern.';

-- Index for training sessions queries (common in ACWR calculations)
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date
ON training_sessions (user_id, session_date DESC);

COMMENT ON INDEX idx_training_sessions_user_date IS 
'Optimizes training session queries for ACWR and load calculations.';

-- Alternative index for athlete_id column (some tables use this)
CREATE INDEX IF NOT EXISTS idx_training_sessions_athlete_date
ON training_sessions (athlete_id, session_date DESC)
WHERE athlete_id IS NOT NULL;

COMMENT ON INDEX idx_training_sessions_athlete_date IS 
'Optimizes training queries using athlete_id column.';

-- =============================================================================
-- PART 3: PRIVACY SETTINGS INDEXES
-- =============================================================================

-- Index for privacy settings lookup with sharing defaults
CREATE INDEX IF NOT EXISTS idx_privacy_settings_sharing
ON privacy_settings (user_id, performance_sharing_default, health_sharing_default);

COMMENT ON INDEX idx_privacy_settings_sharing IS 
'Optimizes privacy settings lookup for default sharing preferences.';

-- Index for AI processing consent checks
CREATE INDEX IF NOT EXISTS idx_privacy_settings_ai
ON privacy_settings (user_id)
WHERE ai_processing_enabled = true;

COMMENT ON INDEX idx_privacy_settings_ai IS 
'Optimizes AI consent checks. Partial index for users who enabled AI.';

-- =============================================================================
-- PART 4: DELETION QUEUE INDEXES
-- =============================================================================

-- Index for deletion queue processing
CREATE INDEX IF NOT EXISTS idx_deletion_requests_pending
ON account_deletion_requests (status, grace_period_ends_at)
WHERE status = 'pending';

COMMENT ON INDEX idx_deletion_requests_pending IS 
'Optimizes deletion queue batch processing. Partial index for pending deletions only.';

-- Index for deletion status lookup by user
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user
ON account_deletion_requests (user_id, status, requested_at DESC);

COMMENT ON INDEX idx_deletion_requests_user IS 
'Optimizes user deletion status lookup.';

-- =============================================================================
-- PART 5: CONSENT AUDIT LOG INDEXES
-- =============================================================================

-- Index for audit log queries by accessor
CREATE INDEX IF NOT EXISTS idx_consent_access_log_accessor_time
ON consent_access_log (accessor_user_id, accessed_at DESC);

COMMENT ON INDEX idx_consent_access_log_accessor_time IS 
'Optimizes audit log queries for who accessed what.';

-- Index for audit log queries by target user
CREATE INDEX IF NOT EXISTS idx_consent_access_log_target_time
ON consent_access_log (target_user_id, accessed_at DESC);

COMMENT ON INDEX idx_consent_access_log_target_time IS 
'Optimizes audit log queries for whose data was accessed.';

-- =============================================================================
-- PART 6: COMPOSITE INDEXES FOR COMMON JOIN PATTERNS
-- =============================================================================

-- Composite index for the common consent view join pattern
-- This covers the subquery: team_members coach JOIN team_members player ON team_id
CREATE INDEX IF NOT EXISTS idx_team_members_team_user_role_status
ON team_members (team_id, user_id, role, status);

COMMENT ON INDEX idx_team_members_team_user_role_status IS 
'Composite index for consent view join patterns. Covers team membership + role + status checks.';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Function to verify indexes were created
CREATE OR REPLACE FUNCTION verify_consent_indexes()
RETURNS TABLE(
  index_name TEXT,
  table_name TEXT,
  exists BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    idx.name,
    idx.tbl,
    EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = idx.name AND tablename = idx.tbl
    )
  FROM (VALUES
    ('idx_team_sharing_settings_consent_lookup', 'team_sharing_settings'),
    ('idx_team_sharing_settings_health_consent', 'team_sharing_settings'),
    ('idx_team_members_active_coaches', 'team_members'),
    ('idx_team_members_active_players', 'team_members'),
    ('idx_load_monitoring_player_date', 'load_monitoring'),
    ('idx_workout_logs_player_date', 'workout_logs'),
    ('idx_training_sessions_user_date', 'training_sessions'),
    ('idx_privacy_settings_sharing', 'privacy_settings'),
    ('idx_privacy_settings_ai', 'privacy_settings'),
    ('idx_deletion_requests_pending', 'account_deletion_requests'),
    ('idx_consent_access_log_accessor_time', 'consent_access_log'),
    ('idx_consent_access_log_target_time', 'consent_access_log'),
    ('idx_team_members_team_user_role_status', 'team_members')
  ) AS idx(name, tbl);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- NOTES
-- =============================================================================
/*
Index Strategy:

1. PARTIAL INDEXES: Used where appropriate to reduce index size and improve
   write performance. Only index rows that match common query patterns.

2. DESC ORDERING: Most time-series queries order by date descending (most recent
   first), so indexes are created with DESC to match.

3. COMPOSITE INDEXES: Created for common join patterns to allow index-only scans.

4. COVERING INDEXES: Include all columns needed by common queries to avoid
   table lookups.

Performance Targets:
- Consent view read: < 100ms
- Dashboard load: < 500ms
- Batch player read (20): < 200ms
- Deletion queue processing: < 1000ms

Monitoring:
- Run EXPLAIN ANALYZE on consent views after applying
- Check pg_stat_user_indexes for index usage
- Monitor query performance in Supabase dashboard

To verify indexes:
  SELECT * FROM verify_consent_indexes();
*/




-- ============================================================================
-- Migration: 074_standardize_user_id.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- STANDARDIZE USER IDS (ATHLETE_ID -> USER_ID)
-- Migration: 074_standardize_user_id.sql
-- Ensures all user-related tables use 'user_id' for consistency across the codebase.
-- =============================================================================

-- 1. readiness_scores: already has both, but ensure user_id is populated
UPDATE readiness_scores SET user_id = athlete_id WHERE user_id IS NULL;

-- 2. wellness_logs: add user_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wellness_logs' AND column_name='user_id') THEN
        ALTER TABLE wellness_logs ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE wellness_logs SET user_id = athlete_id WHERE user_id IS NULL;

-- 3. fixtures: already has both
UPDATE fixtures SET user_id = athlete_id WHERE user_id IS NULL;

-- 4. training_sessions: already has both
UPDATE training_sessions SET user_id = athlete_id WHERE user_id IS NULL;

-- 5. athlete_recovery_profiles: add user_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athlete_recovery_profiles' AND column_name='user_id') THEN
        ALTER TABLE athlete_recovery_profiles ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE athlete_recovery_profiles SET user_id = athlete_id WHERE user_id IS NULL;

-- 6. wellness_entries: already has both
UPDATE wellness_entries SET user_id = athlete_id WHERE user_id IS NULL;

-- 7. calibration_logs: already has user_id, ensure it matches athlete_id if applicable
UPDATE calibration_logs SET user_id = athlete_id WHERE user_id IS NULL;

-- 8. competition_readiness: add user_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='competition_readiness' AND column_name='user_id') THEN
        ALTER TABLE competition_readiness ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE competition_readiness SET user_id = athlete_id WHERE user_id IS NULL;

-- 9. recovery_sessions: already has both
UPDATE recovery_sessions SET user_id = athlete_id WHERE user_id IS NULL;

-- 10. injury_tracking: add user_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='injury_tracking' AND column_name='user_id') THEN
        ALTER TABLE injury_tracking ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE injury_tracking SET user_id = player_id WHERE user_id IS NULL;

-- 11. athlete_drill_assignments: add user_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athlete_drill_assignments' AND column_name='user_id') THEN
        ALTER TABLE athlete_drill_assignments ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE athlete_drill_assignments SET user_id = athlete_id WHERE user_id IS NULL;

-- Create a helper view for the legacy code that still expects athlete_id
-- This allows us to keep the code working while we transition.
CREATE OR REPLACE VIEW athlete_activity_unified AS
SELECT 
    user_id,
    user_id as athlete_id,
    created_at
FROM (
    SELECT user_id, created_at FROM training_sessions
    UNION ALL
    SELECT user_id, created_at FROM wellness_logs
    UNION ALL
    SELECT user_id, created_at FROM readiness_scores
) combined;

COMMENT ON COLUMN wellness_logs.user_id IS 'Standardized user reference. Replaces athlete_id.';
COMMENT ON COLUMN athlete_recovery_profiles.user_id IS 'Standardized user reference. Replaces athlete_id.';
COMMENT ON COLUMN competition_readiness.user_id IS 'Standardized user reference. Replaces athlete_id.';
COMMENT ON COLUMN injury_tracking.user_id IS 'Standardized user reference. Replaces player_id/athlete_id.';
COMMENT ON COLUMN athlete_drill_assignments.user_id IS 'Standardized user reference. Replaces athlete_id.';




-- ============================================================================
-- Migration: 075_create_ml_training_data.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- CREATE ML TRAINING DATA TABLE
-- Migration: 075_create_ml_training_data.sql
-- Stores performance predictions and actual outcomes for model refinement.
-- =============================================================================

CREATE TABLE IF NOT EXISTS ml_training_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    prediction_type text NOT NULL,
    data jsonb NOT NULL,
    actual_result jsonb,
    accuracy numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE ml_training_data ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own ML data"
    ON ml_training_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ML data"
    ON ml_training_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ML data"
    ON ml_training_data FOR UPDATE
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_ml_training_user_type ON ml_training_data(user_id, prediction_type);

COMMENT ON TABLE ml_training_data IS 'Stores performance predictions and actual outcomes for model refinement.';




-- ============================================================================
-- Migration: 075_fix_acwr_rolling_average_calculation.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- Migration 075: Fix ACWR Rolling Average Calculation
-- =============================================================================
-- 
-- BUG FIX: Rest days were not included in rolling averages
-- 
-- ISSUE:
-- The previous implementation used AVG(daily_load) which only averaged over
-- rows that exist in load_monitoring. Since rest days have no workout logs,
-- they had no rows, causing inflated averages.
--
-- EXAMPLE:
-- Player with 5 workouts in 7 days (total load = 2000 AU):
--   - Previous: AVG = 2000 / 5 = 400 AU (WRONG)
--   - Correct:  SUM / 7 = 2000 / 7 = 285.71 AU (RIGHT)
--
-- FIX:
-- Change from AVG(daily_load) to SUM(daily_load) / window_size
-- This ensures rest days (zero load) are properly accounted for.
--
-- IMPACT:
-- - Acute and chronic loads will be LOWER than before (correct behavior)
-- - ACWR ratios may change slightly
-- - Risk level classifications will be more accurate
--
-- REFERENCES:
-- - Gabbett (2016): Rolling averages should include all days in window
-- - docs/LOGIC_VALIDATION_DATASET.md: Validation dataset and expected values
-- =============================================================================

-- =============================================================================
-- PART 1: FIX ACUTE LOAD CALCULATION
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_acute_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL AS $$
DECLARE
  total_load DECIMAL(10,2);
BEGIN
  -- Sum all daily loads in the 7-day window
  -- Rest days with no load_monitoring entry contribute 0 to the sum
  SELECT COALESCE(SUM(daily_load), 0)
  INTO total_load
  FROM load_monitoring
  WHERE player_id = player_uuid
    AND date >= reference_date - INTERVAL '6 days'
    AND date <= reference_date;

  -- Always divide by 7 (window size), not by count of rows
  -- This correctly accounts for rest days as zero load
  RETURN ROUND(total_load / 7.0, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION calculate_acute_load(UUID, DATE) IS 
  'Calculates 7-day rolling average of daily load for acute workload. 
   Uses SUM/7 to correctly include rest days (zero load) in the average.
   Fixed in migration 075 to address rest day exclusion bug.';

-- =============================================================================
-- PART 2: FIX CHRONIC LOAD CALCULATION
-- =============================================================================

-- Minimum chronic load floor (matches Angular: minChronicLoad: 50)
-- Prevents inflated ACWR ratios when chronic load is artificially low
-- (e.g., during return from injury or extended time off)
-- Reference: Gabbett (2016) - athletes returning from injury need protection

CREATE OR REPLACE FUNCTION calculate_chronic_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL AS $$
DECLARE
  total_load DECIMAL(10,2);
  days_in_window INTEGER;
  calculated_chronic DECIMAL(10,2);
  MIN_CHRONIC_LOAD CONSTANT DECIMAL := 50.0;  -- Safety floor (matches Angular config)
BEGIN
  -- Sum all daily loads in the 28-day window
  SELECT COALESCE(SUM(daily_load), 0)
  INTO total_load
  FROM load_monitoring
  WHERE player_id = player_uuid
    AND date >= reference_date - INTERVAL '27 days'
    AND date <= reference_date;

  -- For chronic load, we need to handle the case where we have less than 28 days of data
  -- Count actual days since first workout (up to 28)
  SELECT LEAST(28, GREATEST(1, 
    EXTRACT(DAY FROM (reference_date - MIN(date) + INTERVAL '1 day'))::INTEGER
  ))
  INTO days_in_window
  FROM load_monitoring
  WHERE player_id = player_uuid
    AND date <= reference_date;

  -- If no data exists, return minimum floor
  IF days_in_window IS NULL OR days_in_window = 0 THEN
    RETURN MIN_CHRONIC_LOAD;
  END IF;

  -- Calculate chronic load
  calculated_chronic := ROUND(total_load / days_in_window, 2);

  -- Apply minimum chronic load floor safeguard
  -- This prevents inflated ACWR ratios when returning from injury/time off
  -- Example: Without floor, 100 acute / 10 chronic = 10.0 ACWR (dangerous false alarm)
  --          With floor,    100 acute / 50 chronic = 2.0 ACWR (still high, but realistic)
  RETURN GREATEST(calculated_chronic, MIN_CHRONIC_LOAD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION calculate_chronic_load(UUID, DATE) IS 
  'Calculates 28-day rolling average of daily load for chronic workload baseline.
   Uses SUM/window_size to correctly include rest days (zero load) in the average.
   Window size is the lesser of 28 days or days since first workout.
   Fixed in migration 075 to address rest day exclusion bug.';

-- =============================================================================
-- PART 3: UPDATE ACWR_SAFE FUNCTION WITH MINIMUM CHRONIC FLOOR
-- =============================================================================

-- Update calculate_acwr_safe to handle the minimum chronic load floor correctly
CREATE OR REPLACE FUNCTION calculate_acwr_safe(player_uuid UUID, reference_date DATE)
RETURNS TABLE (
    acwr DECIMAL(5,2),
    risk_level VARCHAR(20),
    baseline_days INTEGER
) AS $$
DECLARE
    days_of_data INTEGER;
    acute_load_val DECIMAL(10,2);
    chronic_load_val DECIMAL(10,2);
    acwr_val DECIMAL(5,2);
    risk VARCHAR(20);
    MIN_CHRONIC_LOAD CONSTANT DECIMAL := 50.0;  -- Must match calculate_chronic_load
BEGIN
    -- Count how many days of training data exist (up to 28)
    SELECT COUNT(DISTINCT date) INTO days_of_data
    FROM load_monitoring
    WHERE player_id = player_uuid
        AND date <= reference_date
        AND date >= reference_date - INTERVAL '27 days';

    -- Calculate loads (chronic already has floor applied)
    acute_load_val := calculate_acute_load(player_uuid, reference_date);
    chronic_load_val := calculate_chronic_load(player_uuid, reference_date);

    -- Determine risk based on baseline status
    IF days_of_data < 7 THEN
        -- Not enough data for acute window
        risk := 'baseline_building';
        acwr_val := NULL;
    ELSIF days_of_data < 21 THEN
        -- Building chronic baseline (21 days minimum per Gabbett)
        risk := 'baseline_building';
        -- Still calculate ACWR for reference, but flag as unreliable
        IF chronic_load_val > 0 THEN
            acwr_val := ROUND(acute_load_val / chronic_load_val, 2);
        ELSE
            acwr_val := NULL;
        END IF;
    ELSIF days_of_data < 28 THEN
        -- Have minimum chronic data, but not full window
        risk := 'baseline_low';
        IF chronic_load_val > 0 THEN
            acwr_val := ROUND(acute_load_val / chronic_load_val, 2);
            -- Override risk if ACWR indicates danger
            IF acwr_val > 1.5 THEN
                risk := 'High';
            ELSIF acwr_val > 1.3 THEN
                risk := 'Moderate';
            END IF;
        ELSE
            acwr_val := NULL;
        END IF;
    ELSE
        -- Full ACWR calculation with complete 28-day window
        IF chronic_load_val > 0 THEN
            acwr_val := ROUND(acute_load_val / chronic_load_val, 2);
            risk := get_injury_risk_level(acwr_val);
        ELSE
            -- This shouldn't happen with MIN_CHRONIC_LOAD floor, but handle gracefully
            acwr_val := NULL;
            risk := 'Unknown';
        END IF;
    END IF;

    RETURN QUERY SELECT acwr_val, risk, days_of_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION calculate_acwr_safe(UUID, DATE) IS
  'Calculates ACWR with baseline awareness and safety checks.
   - Returns NULL ACWR if < 7 days of data (building acute)
   - Returns baseline_building if < 21 days (building chronic)
   - Returns baseline_low if 21-27 days (partial chronic)
   - Returns full risk assessment at 28+ days
   - Chronic load has minimum floor of 50 AU to prevent inflated ratios
   Fixed in migration 075.';

-- =============================================================================
-- PART 4: UPDATE TRIGGER FUNCTION TO USE FIXED CALCULATIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_load_monitoring()
RETURNS TRIGGER AS $$
DECLARE
  log_date DATE;
  daily_load_value INTEGER;
  acute_load_value DECIMAL(10,2);
  chronic_load_value DECIMAL(10,2);
  acwr_value DECIMAL(5,2);
  risk_level VARCHAR(20);
  baseline_days_val INTEGER;
BEGIN
  log_date := DATE(NEW.completed_at);

  -- Calculate daily load (RPE × Duration)
  daily_load_value := calculate_daily_load(NEW.player_id, log_date);

  -- Insert/update load_monitoring record FIRST (so rolling averages include today)
  -- Note: calculate_daily_load already SUMs all workout_logs for the day,
  -- so we use EXCLUDED.daily_load to replace (not accumulate)
  INSERT INTO load_monitoring (player_id, date, daily_load, acute_load, chronic_load, acwr, injury_risk_level)
  VALUES (NEW.player_id, log_date, daily_load_value, 0, 0, NULL, 'Unknown')
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    daily_load = EXCLUDED.daily_load,  -- Replace with recalculated sum from workout_logs
    updated_at = NOW();

  -- Now calculate acute and chronic loads (includes today's data)
  acute_load_value := calculate_acute_load(NEW.player_id, log_date);
  chronic_load_value := calculate_chronic_load(NEW.player_id, log_date);

  -- Calculate ACWR with baseline checks
  SELECT acwr, risk_level, baseline_days INTO acwr_value, risk_level, baseline_days_val
  FROM calculate_acwr_safe(NEW.player_id, log_date);

  -- Update the load monitoring record with calculated values
  UPDATE load_monitoring
  SET 
    acute_load = acute_load_value,
    chronic_load = chronic_load_value,
    acwr = acwr_value,
    injury_risk_level = risk_level,
    baseline_days = baseline_days_val,
    updated_at = NOW()
  WHERE player_id = NEW.player_id AND date = log_date;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 5: RECALCULATE EXISTING DATA (Optional - Run manually if needed)
-- =============================================================================

-- This function can be called to recalculate all load monitoring data
-- after the fix is applied. Run manually if historical data needs correction.

CREATE OR REPLACE FUNCTION recalculate_all_load_monitoring()
RETURNS TABLE(
  player_id UUID,
  records_updated INTEGER
) AS $$
DECLARE
  player_rec RECORD;
  date_rec RECORD;
  updated_count INTEGER;
  acute_val DECIMAL(10,2);
  chronic_val DECIMAL(10,2);
  acwr_val DECIMAL(5,2);
  risk_val VARCHAR(20);
BEGIN
  FOR player_rec IN 
    SELECT DISTINCT lm.player_id 
    FROM load_monitoring lm
  LOOP
    updated_count := 0;
    
    FOR date_rec IN
      SELECT DISTINCT lm.date
      FROM load_monitoring lm
      WHERE lm.player_id = player_rec.player_id
      ORDER BY lm.date
    LOOP
      -- Recalculate values
      acute_val := calculate_acute_load(player_rec.player_id, date_rec.date);
      chronic_val := calculate_chronic_load(player_rec.player_id, date_rec.date);
      
      IF chronic_val > 0 THEN
        acwr_val := ROUND(acute_val / chronic_val, 2);
        risk_val := get_injury_risk_level(acwr_val);
      ELSE
        acwr_val := NULL;
        risk_val := 'Unknown';
      END IF;
      
      -- Update record
      UPDATE load_monitoring lm
      SET 
        acute_load = acute_val,
        chronic_load = chronic_val,
        acwr = acwr_val,
        injury_risk_level = risk_val,
        updated_at = NOW()
      WHERE lm.player_id = player_rec.player_id 
        AND lm.date = date_rec.date;
      
      updated_count := updated_count + 1;
    END LOOP;
    
    player_id := player_rec.player_id;
    records_updated := updated_count;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION recalculate_all_load_monitoring() IS
  'Recalculates all load monitoring records using the fixed acute/chronic load formulas.
   Run this after migration 075 to correct historical data.
   Returns count of records updated per player.';

-- =============================================================================
-- PART 6: VERIFICATION QUERY
-- =============================================================================

-- Run this to verify the fix is working correctly
-- SELECT 
--   'Acute Load Function' AS check_name,
--   CASE 
--     WHEN pg_get_functiondef('calculate_acute_load'::regproc) LIKE '%SUM(daily_load)%'
--     THEN 'PASS - Uses SUM'
--     ELSE 'FAIL - Still uses AVG'
--   END AS status;

-- =============================================================================
-- PART 7: NOTES
-- =============================================================================
/*
MIGRATION 075 - Fix ACWR Rolling Average Calculation

BUGS FIXED:

1. REST DAYS EXCLUDED (Critical)
   BEFORE: calculate_acute_load used AVG(daily_load) 
           Rest days had no rows in load_monitoring
           AVG only divided by days WITH workouts
           Result: Inflated load values
   
   AFTER:  calculate_acute_load uses SUM(daily_load) / 7
           Rest days contribute 0 to the sum
           Division is always by window size (7 or 28)
           Result: Correct load values per Gabbett (2016)

2. MINIMUM CHRONIC LOAD FLOOR (Safety)
   BEFORE: No floor - returning athletes could have very low chronic load
           causing inflated ACWR (e.g., 100/10 = 10.0 ACWR)
   
   AFTER:  Minimum chronic load of 50 AU enforced
           Prevents false danger alerts during return-to-play
           Matches Angular service configuration

3. BASELINE AWARENESS (Improved)
   BEFORE: Used 28 days as threshold for "full" ACWR
   
   AFTER:  Uses 21 days (Gabbett minimum) for chronic baseline
           More accurate data state transitions

ROLLBACK:
To rollback this migration, restore the previous AVG-based functions from
migration 069_prerequisites_check_and_setup.sql

TESTING:
Run the regression test at tests/logic/acwr-regression.test.cjs to verify
the fix produces expected values from the synthetic dataset.

npm run test:acwr
*/



-- ============================================================================
-- Migration: 076_standardize_user_id_batch_2.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- STANDARDIZE USER IDS (ATHLETE_ID/PLAYER_ID -> USER_ID) - BATCH 2
-- Migration: 076_standardize_user_id_batch_2.sql
-- Ensures all user-related tables use 'user_id' for consistency across the codebase.
-- =============================================================================

-- 1. coach_activity_log: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_activity_log' AND column_name='user_id') THEN
        ALTER TABLE coach_activity_log ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE coach_activity_log SET user_id = player_id WHERE user_id IS NULL;

-- 2. equipment_requests: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment_requests' AND column_name='user_id') THEN
        ALTER TABLE equipment_requests ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE equipment_requests SET user_id = player_id WHERE user_id IS NULL;

-- 3. workout_logs: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workout_logs' AND column_name='user_id') THEN
        ALTER TABLE workout_logs ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE workout_logs SET user_id = player_id WHERE user_id IS NULL;

-- 4. video_clip_assignments: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='video_clip_assignments' AND column_name='user_id') THEN
        ALTER TABLE video_clip_assignments ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE video_clip_assignments SET user_id = player_id WHERE user_id IS NULL;

-- 5. player_evaluations: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='player_evaluations' AND column_name='user_id') THEN
        ALTER TABLE player_evaluations ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE player_evaluations SET user_id = player_id WHERE user_id IS NULL;

-- 6. player_programs: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='player_programs' AND column_name='user_id') THEN
        ALTER TABLE player_programs ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE player_programs SET user_id = player_id WHERE user_id IS NULL;

-- 7. player_attendance_stats: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='player_attendance_stats' AND column_name='user_id') THEN
        ALTER TABLE player_attendance_stats ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE player_attendance_stats SET user_id = player_id WHERE user_id IS NULL;

-- 8. absence_requests: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absence_requests' AND column_name='user_id') THEN
        ALTER TABLE absence_requests ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE absence_requests SET user_id = player_id WHERE user_id IS NULL;

-- 9. player_position_preferences: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='player_position_preferences' AND column_name='user_id') THEN
        ALTER TABLE player_position_preferences ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE player_position_preferences SET user_id = player_id WHERE user_id IS NULL;

-- 10. load_daily: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='load_daily' AND column_name='user_id') THEN
        ALTER TABLE load_daily ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE load_daily SET user_id = player_id WHERE user_id IS NULL;

-- 11. attendance_records: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_records' AND column_name='user_id') THEN
        ALTER TABLE attendance_records ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE attendance_records SET user_id = player_id WHERE user_id IS NULL;

-- 12. equipment_checkout_log: add user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment_checkout_log' AND column_name='user_id') THEN
        ALTER TABLE equipment_checkout_log ADD COLUMN user_id uuid REFERENCES users(id);
    END IF;
END $$;
UPDATE equipment_checkout_log SET user_id = player_id WHERE user_id IS NULL;

COMMENT ON COLUMN coach_activity_log.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN equipment_requests.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN workout_logs.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN video_clip_assignments.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN player_evaluations.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN player_programs.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN player_attendance_stats.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN absence_requests.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN player_position_preferences.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN load_daily.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN attendance_records.user_id IS 'Standardized user reference. Replaces player_id.';
COMMENT ON COLUMN equipment_checkout_log.user_id IS 'Standardized user reference. Replaces player_id.';




-- ============================================================================
-- Migration: 077_ai_coach_phase1.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- AI COACH PHASE 1: MEMBER STATE GATING & COACH INBOX
-- Migration: 077_ai_coach_phase1.sql
-- Purpose: Enhanced safety system with real member-state gating, ACWR swap plans,
--          evidence grade explanations, and real-time coach inbox workflow
-- Created: 2026-01-01
-- =============================================================================

-- =============================================================================
-- 1. DAILY ATHLETE STATE TABLE (Readiness Check)
-- Captures quick daily check-in for pain, fatigue, sleep, motivation
-- =============================================================================

CREATE TABLE IF NOT EXISTS athlete_daily_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    state_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Quick readiness inputs (0-10 scale)
    pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
    fatigue_level INTEGER CHECK (fatigue_level BETWEEN 0 AND 10),
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 0 AND 10),
    motivation_level INTEGER CHECK (motivation_level BETWEEN 0 AND 10),
    
    -- Computed readiness
    readiness_score DECIMAL(3,2), -- 0-1 composite
    risk_flags TEXT[], -- ['high_pain', 'poor_sleep', 'fatigued']
    
    -- Source tracking
    source VARCHAR(20) DEFAULT 'manual', -- 'manual', 'ai_prompt', 'wearable'
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One state per user per day
    UNIQUE(user_id, state_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_athlete_daily_state_user_date 
    ON athlete_daily_state(user_id, state_date DESC);
CREATE INDEX IF NOT EXISTS idx_athlete_daily_state_risk 
    ON athlete_daily_state(user_id) 
    WHERE array_length(risk_flags, 1) > 0;

-- =============================================================================
-- 2. COACH INBOX ITEMS TABLE (Workflow Queue)
-- Inbox-style triage for coaches with Safety Alerts, Review Needed, Wins
-- =============================================================================

CREATE TABLE IF NOT EXISTS coach_inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Item classification
    inbox_type VARCHAR(30) NOT NULL CHECK (inbox_type IN (
        'safety_alert',      -- Tier 2/3 + ACWR danger + pain mentions
        'review_needed',     -- Program requests, return-to-play, conflicting
        'win'                -- Completed actions, streaks, positive habits
    )),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Source reference
    source_type VARCHAR(30) NOT NULL, -- 'ai_message', 'ai_recommendation', 'daily_state'
    source_id UUID NOT NULL,
    
    -- Summary for quick scan
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL, -- 3 bullet points max
    
    -- Risk context
    risk_level VARCHAR(10), -- 'low', 'medium', 'high'
    acwr_value DECIMAL(4,2),
    acwr_zone VARCHAR(20),
    intent_type VARCHAR(50),
    
    -- Athlete context snapshot
    athlete_context JSONB DEFAULT '{}', -- {injuries: [...], recent_pain: 7, age_group: 'youth'}
    
    -- Coach workflow
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'viewed', 'approved', 'overridden', 'noted', 'saved_template'
    )),
    coach_action VARCHAR(20), -- 'approve', 'add_note', 'override', 'save_template'
    coach_notes TEXT,
    override_reason TEXT,
    override_alternative TEXT,
    
    -- Timestamps
    viewed_at TIMESTAMPTZ,
    actioned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- For realtime subscriptions
    is_new BOOLEAN DEFAULT TRUE
);

-- Indexes for coach inbox queries
CREATE INDEX IF NOT EXISTS idx_coach_inbox_coach_status 
    ON coach_inbox_items(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_coach_inbox_type 
    ON coach_inbox_items(inbox_type);
CREATE INDEX IF NOT EXISTS idx_coach_inbox_player 
    ON coach_inbox_items(player_id);
CREATE INDEX IF NOT EXISTS idx_coach_inbox_new 
    ON coach_inbox_items(coach_id, is_new) 
    WHERE is_new = TRUE;
CREATE INDEX IF NOT EXISTS idx_coach_inbox_created 
    ON coach_inbox_items(created_at DESC);

-- =============================================================================
-- 3. EXTEND AI_MESSAGES TABLE
-- Add intent classification, user state snapshot, and coach review status
-- =============================================================================

-- Add intent classification column
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS intent_type VARCHAR(50);

-- Add user state snapshot for context at time of message
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS user_state_snapshot JSONB DEFAULT '{}';

-- Add coach review tracking
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS coach_reviewed_at TIMESTAMPTZ;
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS coach_reviewed_by UUID REFERENCES auth.users(id);

-- Add evidence grade explanation
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS evidence_grade_explanation TEXT;

-- Index for finding messages that need coach review
CREATE INDEX IF NOT EXISTS idx_ai_messages_coach_reviewed 
    ON ai_messages(coach_reviewed_at) 
    WHERE coach_reviewed_at IS NOT NULL;

-- =============================================================================
-- 4. USER AGE GROUPS VIEW
-- Compute age group (youth < 16, adult >= 16) from birth_date
-- =============================================================================

CREATE OR REPLACE VIEW user_age_groups AS
SELECT 
    id as user_id,
    CASE 
        WHEN birth_date IS NULL THEN 'unknown'
        WHEN EXTRACT(YEAR FROM age(birth_date)) < 16 THEN 'youth'
        ELSE 'adult'
    END as age_group,
    EXTRACT(YEAR FROM age(birth_date))::INTEGER as age_years
FROM users;

-- =============================================================================
-- 5. EXTEND KNOWLEDGE BASE FOR RECOVERY ALTERNATIVES
-- Add fields for swap plan responses
-- =============================================================================

-- Add recovery alternative flag
ALTER TABLE knowledge_base_entries 
    ADD COLUMN IF NOT EXISTS is_recovery_alternative BOOLEAN DEFAULT FALSE;

-- Add position relevance array
ALTER TABLE knowledge_base_entries 
    ADD COLUMN IF NOT EXISTS position_relevance TEXT[]; -- ['QB', 'WR', 'ALL']

-- Add intensity level for swap plans
ALTER TABLE knowledge_base_entries 
    ADD COLUMN IF NOT EXISTS intensity_level VARCHAR(20); -- 'rest', 'low', 'moderate'

-- Index for recovery alternatives
CREATE INDEX IF NOT EXISTS idx_kb_recovery 
    ON knowledge_base_entries(is_recovery_alternative) 
    WHERE is_recovery_alternative = TRUE;

-- =============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on athlete_daily_state
ALTER TABLE athlete_daily_state ENABLE ROW LEVEL SECURITY;

-- Users can manage their own daily state
CREATE POLICY "Users can manage own daily state"
ON athlete_daily_state FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Coaches can view team member states
CREATE POLICY "Coaches can view team member states"
ON athlete_daily_state FOR SELECT
USING (
    user_id IN (
        SELECT tm.user_id FROM team_members tm
        WHERE tm.team_id IN (
            SELECT tm2.team_id FROM team_members tm2
            WHERE tm2.user_id = auth.uid() AND tm2.role IN ('coach', 'assistant_coach')
        )
        AND tm.status = 'active'
    )
);

-- Enable RLS on coach_inbox_items
ALTER TABLE coach_inbox_items ENABLE ROW LEVEL SECURITY;

-- Coaches can view their own inbox items
CREATE POLICY "Coaches can view own inbox"
ON coach_inbox_items FOR SELECT
USING (coach_id = auth.uid());

-- Coaches can update their own inbox items
CREATE POLICY "Coaches can update own inbox items"
ON coach_inbox_items FOR UPDATE
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- System can insert inbox items (via service role)
CREATE POLICY "System can insert inbox items"
ON coach_inbox_items FOR INSERT
WITH CHECK (TRUE);

-- =============================================================================
-- 7. TRIGGER FOR UPDATED_AT
-- =============================================================================

-- Create trigger for athlete_daily_state updated_at
DROP TRIGGER IF EXISTS update_athlete_daily_state_updated_at ON athlete_daily_state;
CREATE TRIGGER update_athlete_daily_state_updated_at
    BEFORE UPDATE ON athlete_daily_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 8. FUNCTION TO COMPUTE READINESS SCORE
-- Combines pain, fatigue, sleep, motivation into single 0-1 score
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_readiness_score(
    p_pain INTEGER,
    p_fatigue INTEGER,
    p_sleep INTEGER,
    p_motivation INTEGER
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_readiness DECIMAL(5,2);
BEGIN
    -- Invert pain and fatigue (lower is better)
    -- Keep sleep and motivation as-is (higher is better)
    -- Weight: pain 30%, fatigue 25%, sleep 25%, motivation 20%
    v_readiness := (
        (10 - COALESCE(p_pain, 5)) * 0.30 +
        (10 - COALESCE(p_fatigue, 5)) * 0.25 +
        COALESCE(p_sleep, 5) * 0.25 +
        COALESCE(p_motivation, 5) * 0.20
    ) / 10.0;
    
    -- Clamp to 0-1 range
    RETURN GREATEST(0, LEAST(1, v_readiness));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- 9. FUNCTION TO COMPUTE RISK FLAGS
-- Returns array of risk flags based on daily state values
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_risk_flags(
    p_pain INTEGER,
    p_fatigue INTEGER,
    p_sleep INTEGER,
    p_motivation INTEGER
) RETURNS TEXT[] AS $$
DECLARE
    v_flags TEXT[] := '{}';
BEGIN
    -- High pain (7+)
    IF COALESCE(p_pain, 0) >= 7 THEN
        v_flags := array_append(v_flags, 'high_pain');
    END IF;
    
    -- High fatigue (7+)
    IF COALESCE(p_fatigue, 0) >= 7 THEN
        v_flags := array_append(v_flags, 'fatigued');
    END IF;
    
    -- Poor sleep (3 or below)
    IF COALESCE(p_sleep, 10) <= 3 THEN
        v_flags := array_append(v_flags, 'poor_sleep');
    END IF;
    
    -- Low motivation (3 or below)
    IF COALESCE(p_motivation, 10) <= 3 THEN
        v_flags := array_append(v_flags, 'low_motivation');
    END IF;
    
    RETURN v_flags;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- 10. TRIGGER TO AUTO-COMPUTE READINESS SCORE AND FLAGS
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_compute_readiness()
RETURNS TRIGGER AS $$
BEGIN
    NEW.readiness_score := compute_readiness_score(
        NEW.pain_level, NEW.fatigue_level, NEW.sleep_quality, NEW.motivation_level
    );
    NEW.risk_flags := compute_risk_flags(
        NEW.pain_level, NEW.fatigue_level, NEW.sleep_quality, NEW.motivation_level
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_athlete_daily_state_compute ON athlete_daily_state;
CREATE TRIGGER trigger_athlete_daily_state_compute
    BEFORE INSERT OR UPDATE ON athlete_daily_state
    FOR EACH ROW
    EXECUTE FUNCTION trigger_compute_readiness();

-- =============================================================================
-- 11. ENABLE REALTIME FOR NEW TABLES
-- =============================================================================

-- Enable realtime for coach inbox (for instant notifications)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE coach_inbox_items;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- Enable realtime for athlete daily state (optional, for coach dashboards)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE athlete_daily_state;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- =============================================================================
-- 12. COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE athlete_daily_state IS 'Daily check-in for athletes: pain, fatigue, sleep, motivation with computed readiness score';
COMMENT ON TABLE coach_inbox_items IS 'Workflow queue for coaches: Safety Alerts, Review Needed, Wins - with real-time updates';

COMMENT ON COLUMN athlete_daily_state.pain_level IS '0-10 scale: 0 = no pain, 10 = severe pain';
COMMENT ON COLUMN athlete_daily_state.fatigue_level IS '0-10 scale: 0 = fully energized, 10 = exhausted';
COMMENT ON COLUMN athlete_daily_state.sleep_quality IS '0-10 scale: 0 = terrible sleep, 10 = excellent sleep';
COMMENT ON COLUMN athlete_daily_state.motivation_level IS '0-10 scale: 0 = no motivation, 10 = highly motivated';
COMMENT ON COLUMN athlete_daily_state.readiness_score IS 'Computed 0-1 score combining all factors (auto-calculated)';
COMMENT ON COLUMN athlete_daily_state.risk_flags IS 'Auto-computed array of risk indicators';

COMMENT ON COLUMN coach_inbox_items.inbox_type IS 'Triage category: safety_alert (urgent), review_needed (action required), win (positive)';
COMMENT ON COLUMN coach_inbox_items.priority IS 'Urgency: low, medium, high, critical';
COMMENT ON COLUMN coach_inbox_items.athlete_context IS 'Snapshot of athlete state at time of item creation';
COMMENT ON COLUMN coach_inbox_items.is_new IS 'For realtime: TRUE until coach has seen the item';

COMMENT ON COLUMN ai_messages.intent_type IS 'Classified intent: plan_request, technique_correction, pain_injury, recovery_readiness, supplement_medical, general';
COMMENT ON COLUMN ai_messages.user_state_snapshot IS 'Athlete state at time of message (ACWR, injuries, pain, age_group)';
COMMENT ON COLUMN ai_messages.coach_reviewed_at IS 'Timestamp when coach reviewed this message';
COMMENT ON COLUMN ai_messages.evidence_grade_explanation IS 'Human-readable explanation of evidence grade';

COMMENT ON COLUMN knowledge_base_entries.is_recovery_alternative IS 'TRUE if this entry can be used in ACWR swap plans';
COMMENT ON COLUMN knowledge_base_entries.position_relevance IS 'Positions this applies to: QB, WR, RB, DB, LB, K, FLEX, ALL';
COMMENT ON COLUMN knowledge_base_entries.intensity_level IS 'Activity intensity: rest, low, moderate';

COMMENT ON VIEW user_age_groups IS 'Computed view: age_group (youth < 16, adult >= 16) from users.birth_date';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================



-- ============================================================================
-- Migration: 078_ai_coach_phase2.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- AI COACH PHASE 2: MICRO-SESSIONS & TEAM TEMPLATES
-- Migration: 078_ai_coach_phase2.sql
-- Purpose: Transform suggested actions into trackable micro-sessions with 
--          completion tracking, and enable coaches to save recommendations
--          as reusable team templates.
-- Created: 2026-01-01
-- =============================================================================

-- =============================================================================
-- 1. MICRO-SESSIONS TABLE
-- Trackable workout/activity sessions from AI suggestions
-- =============================================================================

CREATE TABLE IF NOT EXISTS micro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(50) NOT NULL, -- 'recovery', 'technique', 'mobility', 'mental', 'strength'
    
    -- Time and equipment
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 5,
    equipment_needed TEXT[] DEFAULT '{}', -- ['foam roller', 'resistance band', 'none']
    
    -- Source tracking
    source_type VARCHAR(30) NOT NULL, -- 'ai_suggestion', 'coach_assigned', 'team_template', 'self_created'
    source_id UUID, -- Reference to ai_message, coach_inbox_item, or team_template
    source_message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
    
    -- Position and intensity
    position_relevance TEXT[] DEFAULT '{"ALL"}',
    intensity_level VARCHAR(20) DEFAULT 'low', -- 'rest', 'low', 'moderate'
    
    -- Content structure
    steps JSONB DEFAULT '[]', -- [{order: 1, instruction: "...", duration_seconds: 30}, ...]
    coaching_cues TEXT[], -- Key points to remember
    safety_notes TEXT, -- Warnings or modifications
    
    -- Completion tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Not started
        'in_progress',  -- Started but not finished
        'completed',    -- Finished
        'skipped',      -- User skipped
        'expired'       -- Past the intended date
    )),
    
    -- Timing
    assigned_date DATE DEFAULT CURRENT_DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    actual_duration_minutes INTEGER,
    
    -- Follow-up
    follow_up_prompt TEXT, -- "How do you feel now? (0-10)"
    follow_up_response JSONB, -- {rating: 7, notes: "feeling better"}
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for micro_sessions
CREATE INDEX IF NOT EXISTS idx_micro_sessions_user_status 
    ON micro_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_micro_sessions_user_date 
    ON micro_sessions(user_id, assigned_date DESC);
CREATE INDEX IF NOT EXISTS idx_micro_sessions_type 
    ON micro_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_micro_sessions_source 
    ON micro_sessions(source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_micro_sessions_pending 
    ON micro_sessions(user_id, assigned_date) 
    WHERE status = 'pending';

-- =============================================================================
-- 2. TEAM TEMPLATES TABLE
-- Reusable coaching templates saved by coaches
-- =============================================================================

CREATE TABLE IF NOT EXISTS team_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template info
    name VARCHAR(255) NOT NULL,
    description TEXT,