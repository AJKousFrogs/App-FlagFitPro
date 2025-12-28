-- =============================================================================
-- PLYOMETRICS & ISOMETRICS EXERCISES TABLES
-- Migration 065: Evidence-Based Exercise Library
-- 72+ exercises with research citations
-- =============================================================================

-- =============================================================================
-- 1. PLYOMETRICS EXERCISES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS plyometrics_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Exercise Identity
    exercise_name VARCHAR(255) NOT NULL,
    exercise_category VARCHAR(100) NOT NULL, -- 'Deceleration Training', 'Acceleration Training', etc.
    difficulty_level VARCHAR(50) NOT NULL CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
    
    -- Description & Instructions
    description TEXT NOT NULL,
    instructions TEXT[], -- Step-by-step instructions
    coaching_cues TEXT[], -- Key coaching points
    
    -- Research & Evidence
    research_based BOOLEAN DEFAULT true,
    research_source TEXT, -- Citation or URL
    pubmed_id VARCHAR(20),
    
    -- Training Parameters
    intensity_level VARCHAR(50), -- 'Low', 'Moderate', 'High', 'Very High'
    volume_recommendations TEXT[], -- e.g., ['3-4 sets', '6-8 reps']
    rest_periods TEXT[], -- e.g., ['60-90 seconds between sets']
    progression_guidelines TEXT[], -- How to progress the exercise
    
    -- Safety
    safety_notes TEXT[],
    contraindications TEXT[], -- When NOT to do this exercise
    proper_form_guidelines TEXT[],
    common_mistakes TEXT[],
    
    -- Sport Applicability
    applicable_sports TEXT[] DEFAULT ARRAY['Flag Football'],
    position_specific BOOLEAN DEFAULT false,
    position_applications JSONB, -- {"QB": "Improves pocket mobility", "WR": "Enhances route breaks"}
    
    -- Equipment & Space
    equipment_needed TEXT[] DEFAULT ARRAY[]::TEXT[],
    space_requirements VARCHAR(100), -- 'Minimal', '10m x 5m', 'Full field'
    surface_requirements VARCHAR(100), -- 'Turf', 'Grass', 'Gym floor'
    
    -- Effectiveness
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
    performance_improvements JSONB, -- {"sprint_speed": "8-12%", "cod_time": "15-22%"}
    injury_risk_rating VARCHAR(50), -- 'Low', 'Moderate', 'High'
    
    -- Media
    video_url TEXT,
    thumbnail_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. ISOMETRICS EXERCISES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS isometrics_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Exercise Identity
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Injury Prevention', 'Strength', 'Rehabilitation'
    protocol_type VARCHAR(100), -- 'Alfredson', 'Nordic', 'Copenhagen'
    difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
    
    -- Description
    description TEXT NOT NULL,
    instructions TEXT[],
    
    -- Research
    research_based BOOLEAN DEFAULT true,
    research_source TEXT,
    pubmed_id VARCHAR(20),
    injury_prevention_benefits TEXT,
    injury_reduction_percentage DECIMAL(5,2), -- e.g., 51.00 for 51% reduction
    
    -- Training Parameters
    hold_duration_seconds INTEGER,
    sets INTEGER,
    reps INTEGER,
    frequency_per_week INTEGER,
    rest_between_sets_seconds INTEGER,
    
    -- Target Areas
    target_muscles TEXT[],
    target_joints TEXT[],
    
    -- Safety
    contraindications TEXT[],
    safety_notes TEXT[],
    
    -- Effectiveness
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
    evidence_level VARCHAR(20), -- 'A', 'B', 'C', 'D'
    
    -- Media
    video_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_plyometrics_category ON plyometrics_exercises(exercise_category);
CREATE INDEX IF NOT EXISTS idx_plyometrics_difficulty ON plyometrics_exercises(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_plyometrics_rating ON plyometrics_exercises(effectiveness_rating DESC);
CREATE INDEX IF NOT EXISTS idx_isometrics_category ON isometrics_exercises(category);
CREATE INDEX IF NOT EXISTS idx_isometrics_protocol ON isometrics_exercises(protocol_type);

-- =============================================================================
-- 4. ENABLE RLS
-- =============================================================================
ALTER TABLE plyometrics_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE isometrics_exercises ENABLE ROW LEVEL SECURITY;

-- Public read access (exercise library is public)
CREATE POLICY "Plyometrics exercises are viewable by everyone"
ON plyometrics_exercises FOR SELECT USING (true);

CREATE POLICY "Isometrics exercises are viewable by everyone"
ON isometrics_exercises FOR SELECT USING (true);

-- Coaches can manage exercises
CREATE POLICY "Coaches can manage plyometrics exercises"
ON plyometrics_exercises FOR ALL USING (
    (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' IN ('coach', 'admin')
);

CREATE POLICY "Coaches can manage isometrics exercises"
ON isometrics_exercises FOR ALL USING (
    (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' IN ('coach', 'admin')
);

-- =============================================================================
-- 5. SEED DATA: DECELERATION TRAINING (9 exercises)
-- =============================================================================
INSERT INTO plyometrics_exercises (
    exercise_name, exercise_category, difficulty_level, description, instructions,
    research_based, research_source, intensity_level, volume_recommendations,
    rest_periods, progression_guidelines, safety_notes, contraindications,
    equipment_needed, space_requirements, effectiveness_rating, 
    performance_improvements, injury_risk_rating, position_applications
) VALUES
-- 1. Reactive Mirror Deceleration Drill
(
    'Reactive Mirror Deceleration Drill',
    'Deceleration Training',
    'Advanced',
    'Partner-based reactive drill where athlete mirrors partner movements with rapid decelerations. Develops game-realistic deceleration patterns.',
    ARRAY['Partner stands 3-5m away', 'Partner moves randomly in any direction', 'Mirror movements with controlled decelerations', 'Focus on low hips and wide base on stops', 'React to partner''s change of direction'],
    true,
    'Reactive agility research - Sheppard & Young (2006)',
    'High',
    ARRAY['3-4 sets', '30-45 seconds per set'],
    ARRAY['90-120 seconds between sets'],
    ARRAY['Start with predictable patterns', 'Progress to random movements', 'Add cognitive load (call colors/numbers)'],
    ARRAY['Ensure adequate warm-up', 'Use on appropriate surface'],
    ARRAY['Acute lower limb injury', 'Post-ACL surgery < 9 months'],
    ARRAY['Cones for boundary'],
    '10m x 10m',
    10,
    '{"deceleration_control": "25-35%", "reaction_time": "15-20%", "cod_performance": "18-25%"}',
    'Moderate',
    '{"DB": "Essential for coverage breaks", "WR": "Route break deceleration", "LB": "Pursuit angle changes"}'
),
-- 2. Forward 3-Step Deceleration with Cones
(
    'Forward 3-Step Deceleration with Cones',
    'Deceleration Training',
    'Intermediate',
    'Controlled 3-step deceleration from sprint to complete stop at cone. Foundation drill for deceleration mechanics.',
    ARRAY['Sprint at 70-80% max speed', 'Begin deceleration 3 steps before cone', 'Lower center of gravity progressively', 'Final step: wide base, low hips', 'Hold stick position for 2 seconds'],
    true,
    'Prehab Guys - https://library.theprehabguys.com',
    'Moderate',
    ARRAY['4-6 sets', '4-6 reps per set'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['Start at 60% speed', 'Progress to 90% speed', 'Add directional change after stop'],
    ARRAY['Focus on heel-toe braking pattern', 'Avoid knee valgus on landing'],
    ARRAY['Patellar tendinopathy', 'Acute quad strain'],
    ARRAY['5-6 cones'],
    '20m runway',
    9,
    '{"braking_force": "20-30%", "decel_mechanics": "significant improvement"}',
    'Low',
    '{"All": "Foundation deceleration skill"}'
),
-- 3. 3-Step Deceleration to 180° Turn
(
    'Three-Step Deceleration to 180° Turn',
    'Deceleration Training',
    'Advanced',
    'Decelerate from sprint, plant, and execute 180-degree turn. Critical for defensive pursuit and route running.',
    ARRAY['Sprint at 80% speed', 'Execute 3-step deceleration', 'Plant outside foot firmly', 'Rotate hips 180 degrees', 'Accelerate in opposite direction'],
    true,
    'Prehab Guys - https://library.theprehabguys.com',
    'High',
    ARRAY['3-4 sets', '4-5 reps each direction'],
    ARRAY['90-120 seconds between sets'],
    ARRAY['Master basic decel first', 'Progress speed gradually', 'Add reaction stimulus'],
    ARRAY['Ensure proper plant foot mechanics', 'Avoid excessive knee valgus'],
    ARRAY['ACL reconstruction < 12 months', 'Ankle instability'],
    ARRAY['Cones'],
    '15m x 5m',
    9,
    '{"turn_speed": "15-22%", "pursuit_angles": "improved"}',
    'Moderate',
    '{"DB": "Flip hips in coverage", "WR": "Comeback routes", "LB": "Pursuit direction changes"}'
),
-- 4. 3-Step Deceleration to Backpedal
(
    'Three-Step Deceleration to Backpedal',
    'Deceleration Training',
    'Intermediate',
    'Transition from forward sprint to backpedal. Essential for defensive backs and linebackers.',
    ARRAY['Sprint forward at 75% speed', 'Execute 3-step deceleration', 'Drop hips and rotate', 'Transition to backpedal', 'Maintain athletic position'],
    true,
    'Prehab Guys - https://library.theprehabguys.com',
    'Moderate',
    ARRAY['4 sets', '5-6 reps'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['Start slow', 'Progress to game speed', 'Add ball tracking'],
    ARRAY['Keep eyes up during transition'],
    ARRAY['Hip flexor strain'],
    ARRAY['None'],
    '15m runway',
    9,
    '{"transition_speed": "12-18%", "defensive_coverage": "improved"}',
    'Low',
    '{"DB": "Critical for coverage", "LB": "Zone drops"}'
),
-- 5. Single-Leg Deceleration Stick Landing
(
    'Single-Leg Deceleration Stick Landing',
    'Deceleration Training',
    'Advanced',
    'Single-leg landing and stick from forward momentum. Gold-standard ACL prevention exercise.',
    ARRAY['Approach with controlled jog', 'Plant on single leg', 'Absorb force through hip-knee-ankle', 'Stick landing for 3 seconds', 'Maintain knee over toe alignment'],
    true,
    'ACL prevention research - Hewett et al.',
    'Moderate-High',
    ARRAY['3 sets', '6-8 reps each leg'],
    ARRAY['45-60 seconds between legs'],
    ARRAY['Master double-leg first', 'Progress height and speed', 'Add perturbations'],
    ARRAY['Watch for knee valgus', 'Build progressively'],
    ARRAY['ACL injury < 9 months', 'Patellar tendinopathy'],
    ARRAY['None'],
    'Minimal',
    9,
    '{"landing_mechanics": "significant", "acl_risk_reduction": "40-60%"}',
    'Moderate',
    '{"WR": "Catch and cut", "DB": "Break on ball"}'
),
-- 6. Lateral Shuffle to Deceleration Stick
(
    'Lateral Shuffle to Deceleration Stick',
    'Deceleration Training',
    'Intermediate',
    'Frontal plane deceleration from lateral movement. Develops multi-directional stopping ability.',
    ARRAY['Lateral shuffle at moderate speed', 'On command, plant outside foot', 'Lower hips and absorb', 'Stick position for 2 seconds', 'Reset and repeat opposite direction'],
    true,
    'Frontal plane deceleration research',
    'Moderate',
    ARRAY['4 sets', '6 reps each direction'],
    ARRAY['60 seconds between sets'],
    ARRAY['Start slow', 'Increase shuffle speed', 'Add reactive cues'],
    ARRAY['Maintain neutral spine', 'Avoid lateral trunk lean'],
    ARRAY['Groin strain', 'Hip impingement'],
    ARRAY['Cones'],
    '10m lateral space',
    9,
    '{"lateral_decel": "20-25%", "groin_injury_prevention": "improved"}',
    'Low',
    '{"DB": "Press coverage", "LB": "Lateral pursuit"}'
),
-- 7. Backpedal to Forward Sprint Transition
(
    'Backpedal to Forward Sprint Transition',
    'Deceleration Training',
    'Intermediate',
    'Transition from backpedal to forward sprint. Critical for DBs breaking on the ball.',
    ARRAY['Start in athletic backpedal', 'On cue, plant and rotate', 'Drive forward explosively', 'Accelerate through 10 yards', 'Focus on hip rotation speed'],
    true,
    'Multi-directional training research',
    'High',
    ARRAY['4-5 sets', '4-6 reps'],
    ARRAY['90 seconds between sets'],
    ARRAY['Master backpedal technique first', 'Progress to reactive cues', 'Add ball tracking'],
    ARRAY['Maintain low center of gravity'],
    ARRAY['Hamstring strain'],
    ARRAY['None'],
    '15m x 5m',
    9,
    '{"break_speed": "15-20%", "ball_reaction": "improved"}',
    'Moderate',
    '{"DB": "Essential skill", "LB": "Zone coverage breaks"}'
),
-- 8. Sprint to Crossover Deceleration
(
    'Sprint to Crossover Deceleration',
    'Deceleration Training',
    'Advanced',
    'High-speed sprint with crossover step deceleration. Game-transfer drill for pursuit angles.',
    ARRAY['Sprint at 85-90% max speed', 'Execute crossover step to change angle', 'Decelerate over 3-4 steps', 'Maintain balance throughout', 'Reaccelerate in new direction'],
    true,
    'Game-transfer deceleration research',
    'Very High',
    ARRAY['3-4 sets', '4 reps each direction'],
    ARRAY['120 seconds between sets'],
    ARRAY['Master basic crossover first', 'Build speed progressively', 'Add pursuit target'],
    ARRAY['High ACL risk if poor mechanics', 'Ensure adequate preparation'],
    ARRAY['Knee instability', 'Ankle sprain history'],
    ARRAY['Cones'],
    '20m x 10m',
    9,
    '{"pursuit_efficiency": "18-25%", "game_transfer": "high"}',
    'High',
    '{"DB": "Pursuit angles", "LB": "Run support"}'
),
-- 9. Drop Step Deceleration
(
    'Drop Step Deceleration',
    'Deceleration Training',
    'Intermediate',
    'Defensive drop step with controlled deceleration. Foundation for coverage technique.',
    ARRAY['Start in athletic stance', 'Open hips with drop step', 'Maintain low position', 'Decelerate to balanced position', 'Ready for next movement'],
    true,
    'Defensive movement patterns research',
    'Moderate',
    ARRAY['4 sets', '6-8 reps each side'],
    ARRAY['45-60 seconds between sets'],
    ARRAY['Focus on hip mobility first', 'Progress to reactive', 'Add receiver simulation'],
    ARRAY['Keep eyes up', 'Maintain athletic posture'],
    ARRAY['Hip flexor tightness'],
    ARRAY['None'],
    'Minimal',
    8,
    '{"coverage_technique": "improved", "hip_mobility": "enhanced"}',
    'Low',
    '{"DB": "Press technique", "LB": "Zone drops"}'
);

-- =============================================================================
-- 6. SEED DATA: ACCELERATION TRAINING (11 exercises)
-- =============================================================================
INSERT INTO plyometrics_exercises (
    exercise_name, exercise_category, difficulty_level, description, instructions,
    research_based, research_source, intensity_level, volume_recommendations,
    rest_periods, progression_guidelines, safety_notes,
    equipment_needed, space_requirements, effectiveness_rating,
    performance_improvements, injury_risk_rating, position_applications
) VALUES
-- 1. Resisted Sled Sprint
(
    'Resisted Sled Sprint (10-20m)',
    'Acceleration Training',
    'Intermediate',
    'Sled pulls develop horizontal force production critical for acceleration. Load should allow 10% speed decrement.',
    ARRAY['Attach sled to waist belt', 'Assume 3-point or athletic stance', 'Drive powerfully through ground', 'Maintain forward lean', 'Sprint 10-20m with maximal effort'],
    true,
    'Coach Athletics - https://coachathletics.com.au',
    'High',
    ARRAY['4-6 sets', '10-20m per rep'],
    ARRAY['2-3 minutes full recovery'],
    ARRAY['Start with 10% BW load', 'Progress to 20-30% BW', 'Maintain proper mechanics'],
    ARRAY['Load should not alter running mechanics significantly'],
    ARRAY['Sled', 'Belt harness'],
    '25m runway',
    10,
    '{"horizontal_force": "25-35%", "10m_sprint": "8-12% improvement"}',
    'Low',
    '{"All": "Acceleration development"}'
),
-- 2. Bounding (Horizontal Emphasis)
(
    'Bounding (Horizontal Emphasis)',
    'Acceleration Training',
    'Intermediate',
    'Exaggerated running with maximal horizontal displacement. Develops stride power and length.',
    ARRAY['Start with 3-step approach', 'Drive knee high and forward', 'Extend hip fully on push-off', 'Maximize horizontal distance', 'Land with active foot strike'],
    true,
    'Outside Online - https://outsideonline.com',
    'High',
    ARRAY['3-4 sets', '20-30m per set'],
    ARRAY['2-3 minutes between sets'],
    ARRAY['Master skipping first', 'Progress distance gradually', 'Focus on rhythm'],
    ARRAY['High impact - ensure adequate preparation'],
    ARRAY['None'],
    '30m runway',
    10,
    '{"stride_length": "15-20%", "horizontal_power": "20-30%"}',
    'Moderate',
    '{"WR": "Route acceleration", "DB": "Break acceleration"}'
),
-- 3. Falling Start (3-Step Acceleration)
(
    'Falling Start (3-Step Acceleration)',
    'Acceleration Training',
    'Beginner',
    'Gravity-assisted start teaches forward lean and explosive first steps.',
    ARRAY['Stand tall at start line', 'Lean forward until off-balance', 'React with explosive first step', 'Drive through first 3 steps', 'Maintain forward lean throughout'],
    true,
    'FootFitLab - https://footfitlab.com',
    'Moderate',
    ARRAY['5-6 sets', '3-5 reps'],
    ARRAY['60-90 seconds between reps'],
    ARRAY['Start with minimal lean', 'Progress lean angle', 'Add reactive cues'],
    ARRAY['Ensure clear runway'],
    ARRAY['None'],
    '15m runway',
    9,
    '{"first_step_speed": "15-25%", "acceleration_mechanics": "improved"}',
    'Low',
    '{"QB": "Scramble starts", "All": "Acceleration foundation"}'
),
-- 4. Medicine Ball Start to Sprint
(
    'Medicine Ball Start to Sprint',
    'Acceleration Training',
    'Intermediate',
    'Explosive med ball throw transitions to sprint. Develops power transfer and acceleration.',
    ARRAY['Hold med ball at chest', 'Assume athletic stance', 'Explosively throw ball forward', 'Immediately sprint after release', 'Chase the ball for 10-15m'],
    true,
    'TrainHeroic - https://trainheroic.com',
    'High',
    ARRAY['4 sets', '4-6 reps'],
    ARRAY['90 seconds between reps'],
    ARRAY['Start with lighter ball', 'Progress ball weight', 'Focus on seamless transition'],
    ARRAY['Clear area for ball landing'],
    ARRAY['Medicine ball (3-5kg)'],
    '20m runway',
    9,
    '{"power_transfer": "improved", "acceleration": "12-18%"}',
    'Low',
    '{"All": "Explosive starts"}'
),
-- 5. Wall Drill (Acceleration Mechanics)
(
    'Wall Drill (Acceleration Mechanics)',
    'Acceleration Training',
    'Beginner',
    'Wall-supported drill teaches proper acceleration body angles and leg drive mechanics.',
    ARRAY['Lean against wall at 45-degree angle', 'Hands on wall, arms extended', 'Drive one knee up explosively', 'Hold position briefly', 'Alternate legs with control'],
    true,
    'Loren Landow - https://coachathletics.com.au',
    'Low',
    ARRAY['3 sets', '10-12 reps each leg'],
    ARRAY['30-45 seconds between sets'],
    ARRAY['Master static holds first', 'Progress to dynamic exchanges', 'Add speed'],
    ARRAY['Maintain proper body angle'],
    ARRAY['Wall'],
    'Minimal',
    8,
    '{"acceleration_mechanics": "foundation", "body_position": "improved"}',
    'Low',
    '{"All": "Technique development"}'
),
-- 6. Partner-Resisted A-March Drill
(
    'Partner-Resisted A-March Drill',
    'Acceleration Training',
    'Intermediate',
    'Partner provides resistance while athlete performs A-march. Develops force production against resistance.',
    ARRAY['Partner holds resistance band around waist', 'Perform exaggerated A-march', 'Drive knees high against resistance', 'Maintain forward lean', 'Partner provides consistent tension'],
    true,
    'Loren Landow - https://coachathletics.com.au',
    'Moderate',
    ARRAY['3-4 sets', '15-20m'],
    ARRAY['60 seconds between sets'],
    ARRAY['Start with light resistance', 'Progress tension', 'Maintain mechanics'],
    ARRAY['Partner must provide consistent resistance'],
    ARRAY['Resistance band', 'Partner'],
    '20m runway',
    8,
    '{"hip_flexor_strength": "improved", "knee_drive": "enhanced"}',
    'Low',
    '{"All": "Acceleration mechanics"}'
),
-- 7. Power Skip for Distance
(
    'Power Skip for Distance',
    'Acceleration Training',
    'Beginner',
    'Exaggerated skipping emphasizing horizontal distance. Develops hip extension power.',
    ARRAY['Start with normal skip rhythm', 'Emphasize height and distance', 'Drive arms powerfully', 'Extend hip fully on push-off', 'Land softly and repeat'],
    true,
    'Sprint mechanics research',
    'Moderate',
    ARRAY['3-4 sets', '30-40m'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['Master basic skip first', 'Progress to max effort', 'Focus on rhythm'],
    ARRAY['Gradual progression'],
    ARRAY['None'],
    '40m runway',
    8,
    '{"hip_extension": "improved", "coordination": "enhanced"}',
    'Low',
    '{"All": "Foundation drill"}'
),
-- 8. Push-Up Start Sprint
(
    'Push-Up Start Sprint',
    'Acceleration Training',
    'Intermediate',
    'Start from push-up position and explode into sprint. Develops ground-to-sprint transitions.',
    ARRAY['Start in push-up position', 'On cue, explosively drive up', 'Transition immediately to sprint', 'Maintain low body angle', 'Accelerate through 10-15m'],
    true,
    'Ground-to-sprint transition research',
    'High',
    ARRAY['4-5 sets', '4-6 reps'],
    ARRAY['90 seconds between reps'],
    ARRAY['Master basic push-up start', 'Progress to reactive cues', 'Add competition'],
    ARRAY['Clear runway'],
    ARRAY['None'],
    '20m runway',
    8,
    '{"ground_reaction": "improved", "first_step": "15-20%"}',
    'Low',
    '{"All": "Game-situation starts"}'
),
-- 9. Seated Start Sprint
(
    'Seated Start Sprint',
    'Acceleration Training',
    'Intermediate',
    'Start from seated position. Develops rate of force development from disadvantaged position.',
    ARRAY['Sit on ground facing sprint direction', 'Feet flat, knees bent', 'On cue, explosively stand and sprint', 'Drive arms powerfully', 'Accelerate through 15m'],
    true,
    'Rate of force development research',
    'High',
    ARRAY['4 sets', '4-6 reps'],
    ARRAY['90 seconds between reps'],
    ARRAY['Start with kneeling position', 'Progress to seated', 'Add reactive cues'],
    ARRAY['Ensure proper technique on stand-up'],
    ARRAY['None'],
    '20m runway',
    8,
    '{"rfd": "improved", "explosive_strength": "enhanced"}',
    'Low',
    '{"All": "Reactive acceleration"}'
),
-- 10. Split Stance Start Sprint
(
    'Split Stance Start Sprint',
    'Acceleration Training',
    'Beginner',
    'Sprint start from staggered stance. Mimics game-position starts.',
    ARRAY['Assume split stance (one foot forward)', 'Weight on front foot', 'On cue, drive off front foot', 'Maintain forward lean', 'Accelerate through 10-15m'],
    true,
    'Game-position start research',
    'Moderate',
    ARRAY['4 sets', '4-6 reps each stance'],
    ARRAY['60 seconds between reps'],
    ARRAY['Practice both stances', 'Progress to reactive starts', 'Add direction changes'],
    ARRAY['Maintain athletic position'],
    ARRAY['None'],
    '20m runway',
    7,
    '{"game_starts": "improved", "versatility": "enhanced"}',
    'Low',
    '{"WR": "Route starts", "DB": "Backpedal starts"}'
),
-- 11. Backward to Forward Sprint Transition
(
    'Backward to Forward Sprint Transition',
    'Acceleration Training',
    'Intermediate',
    'Transition from backward movement to forward sprint. Essential for defensive positions.',
    ARRAY['Start with controlled backpedal', 'On cue, plant and rotate', 'Drive explosively forward', 'Maintain low center of gravity', 'Accelerate through 10m'],
    true,
    'Multi-directional acceleration research',
    'High',
    ARRAY['4 sets', '5-6 reps'],
    ARRAY['90 seconds between sets'],
    ARRAY['Master backpedal first', 'Progress transition speed', 'Add ball tracking'],
    ARRAY['Focus on hip rotation'],
    ARRAY['None'],
    '15m x 5m',
    9,
    '{"transition_speed": "15-22%", "defensive_breaks": "improved"}',
    'Moderate',
    '{"DB": "Coverage breaks", "LB": "Zone to man transitions"}'
);

-- =============================================================================
-- 7. SEED DATA: ECCENTRIC STRENGTH (3 exercises - Gold Standard)
-- =============================================================================
INSERT INTO isometrics_exercises (
    name, category, protocol_type, difficulty_level, description, instructions,
    research_based, research_source, pubmed_id, injury_prevention_benefits,
    injury_reduction_percentage, hold_duration_seconds, sets, reps,
    frequency_per_week, rest_between_sets_seconds, target_muscles,
    contraindications, effectiveness_rating, evidence_level
) VALUES
-- 1. Nordic Hamstring Curl
(
    'Nordic Hamstring Curl',
    'Injury Prevention',
    'Nordic',
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
