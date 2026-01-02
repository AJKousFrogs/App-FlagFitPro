-- ============================================================================
-- Migration 104: Seed Protocol Exercises
-- ============================================================================
-- Initial exercise data for the Daily Protocol system
-- Includes Morning Mobility, Foam Rolling, Warm-up, and Recovery exercises
-- with HOW/FEEL/COMPENSATION instruction format
-- ============================================================================

-- ============================================================================
-- MORNING MOBILITY EXERCISES
-- ============================================================================

INSERT INTO exercises (
    name, slug, category, subcategory,
    how_text, feel_text, compensation_text,
    default_sets, default_reps, default_hold_seconds,
    target_muscles, difficulty_level, load_contribution_au, active
) VALUES
-- Hip 90/90 Stretch
(
    'Hip 90/90 Stretch',
    'hip-90-90-stretch',
    'mobility',
    'hip_mobility',
    'Sit with one leg bent in front at 90 degrees, other leg behind at 90 degrees. Keep your chest tall and lean forward gently over your front leg. Hold, then rotate to switch legs.',
    'Deep stretch in the front hip (external rotation) and glute of the back leg (internal rotation). You may also feel it in your groin.',
    'Don''t let your back round. Keep your chest lifted. Don''t force the stretch - ease into it gradually.',
    2,
    1,
    30,
    ARRAY['hip_flexors', 'glutes', 'groin'],
    'beginner',
    5,
    true
),

-- World's Greatest Stretch
(
    'World''s Greatest Stretch',
    'worlds-greatest-stretch',
    'mobility',
    'full_body_mobility',
    'Start in a lunge position with your right foot forward. Place both hands inside your right foot. Rotate your torso and reach your right arm to the ceiling. Return and repeat on the other side.',
    'Stretch in hip flexor of back leg, groin of front leg, and thoracic spine rotation. Full-body mobility activation.',
    'Keep your back knee off the ground. Engage your core throughout. Don''t rush the rotation.',
    1,
    5,
    NULL,
    ARRAY['hip_flexors', 'groin', 'thoracic_spine', 'hamstrings'],
    'beginner',
    8,
    true
),

-- Supine Hip Flexion + External Rotation
(
    'Supine Hip Flexion + External Rotation',
    'supine-hip-flexion-external-rotation',
    'mobility',
    'hip_mobility',
    'While laying on your back, bring one knee to your chest. Grab the inside of that knee and pull your knee up and out as far as it can, letting your knee slowly fall to the side. Keep your hips level on the ground.',
    'You should feel a stretch in your groin and hip region.',
    'Don''t let the other side of your hips come off of the ground. Stay flat.',
    1,
    5,
    40,
    ARRAY['hip_flexors', 'groin', 'glutes'],
    'beginner',
    5,
    true
),

-- Cat-Cow Stretch
(
    'Cat-Cow Stretch',
    'cat-cow-stretch',
    'mobility',
    'spine_mobility',
    'Start on hands and knees. For Cat: Round your spine up toward the ceiling, tucking chin to chest. For Cow: Drop your belly toward the floor, lifting chest and tailbone. Flow between positions.',
    'Gentle stretch through the entire spine. Mobility in each vertebra.',
    'Move slowly and controlled. Don''t force the range of motion. Breathe deeply with each position.',
    1,
    10,
    NULL,
    ARRAY['spine', 'core'],
    'beginner',
    3,
    true
),

-- Thoracic Rotation
(
    'Thoracic Rotation (Thread the Needle)',
    'thoracic-rotation-thread-needle',
    'mobility',
    'thoracic_mobility',
    'Start on hands and knees. Take one arm and reach it under your body, threading it through to the opposite side. Follow the movement with your eyes and rotate your upper back. Return and reach that arm to the ceiling.',
    'Rotation and stretch through your mid-back (thoracic spine). May feel a stretch in your shoulder.',
    'Keep your hips stable - the rotation should come from your upper back only. Don''t rush.',
    2,
    8,
    NULL,
    ARRAY['thoracic_spine', 'shoulders'],
    'beginner',
    5,
    true
),

-- Ankle Circles
(
    'Ankle Circles',
    'ankle-circles',
    'mobility',
    'ankle_mobility',
    'Sit or stand with one foot off the ground. Slowly rotate your ankle in a full circle, making the biggest circle possible. Do both clockwise and counterclockwise directions.',
    'Movement through the entire ankle joint. May feel slight stretch in calf and shin.',
    'Make controlled, deliberate circles. Don''t just wiggle your foot randomly.',
    1,
    10,
    NULL,
    ARRAY['ankles', 'calves'],
    'beginner',
    2,
    true
)

ON CONFLICT (slug) DO UPDATE SET
    how_text = EXCLUDED.how_text,
    feel_text = EXCLUDED.feel_text,
    compensation_text = EXCLUDED.compensation_text,
    default_sets = EXCLUDED.default_sets,
    default_reps = EXCLUDED.default_reps,
    default_hold_seconds = EXCLUDED.default_hold_seconds,
    updated_at = NOW();

-- ============================================================================
-- FOAM ROLLING EXERCISES
-- ============================================================================

INSERT INTO exercises (
    name, slug, category, subcategory,
    how_text, feel_text, compensation_text,
    default_sets, default_duration_seconds,
    target_muscles, difficulty_level, load_contribution_au,
    equipment_needed, active
) VALUES
-- Quad Foam Roll
(
    'Quad Foam Roll',
    'quad-foam-roll',
    'foam_roll',
    'lower_body',
    'Lie face down with the foam roller under your thighs. Support yourself on your forearms. Roll from just above the knee to your hip. Rotate your leg inward and outward to target different quad muscles.',
    'Pressure and mild discomfort on tight spots. Should feel like a deep tissue massage.',
    'Don''t roll directly over your knee cap. Avoid holding your breath - breathe through the discomfort.',
    1,
    60,
    ARRAY['quadriceps'],
    'beginner',
    3,
    ARRAY['foam_roller'],
    true
),

-- IT Band Foam Roll
(
    'IT Band Foam Roll',
    'it-band-foam-roll',
    'foam_roll',
    'lower_body',
    'Lie on your side with the foam roller under your outer thigh. Support yourself with your hands and opposite foot. Roll from just above the knee to your hip. Stack or stagger your legs to control pressure.',
    'Intense pressure along the outer thigh. This is often the most sensitive area to roll.',
    'Don''t roll too fast - use slow, deliberate passes. Breathe through the discomfort. Can reduce pressure by putting more weight on your supporting foot.',
    1,
    60,
    ARRAY['it_band', 'tfl'],
    'intermediate',
    3,
    ARRAY['foam_roller'],
    true
),

-- Hamstring Foam Roll
(
    'Hamstring Foam Roll',
    'hamstring-foam-roll',
    'foam_roll',
    'lower_body',
    'Sit with the foam roller under your thighs. Support yourself with your hands behind you. Roll from just above the knee to your glutes. Cross one leg over the other to increase pressure on a single leg.',
    'Pressure along the back of your thigh. May find tender spots especially near the glute attachment.',
    'Don''t rush. Pause on tender spots for 20-30 seconds. Avoid rolling directly behind the knee.',
    1,
    60,
    ARRAY['hamstrings'],
    'beginner',
    3,
    ARRAY['foam_roller'],
    true
),

-- Glute Foam Roll
(
    'Glute Foam Roll',
    'glute-foam-roll',
    'foam_roll',
    'lower_body',
    'Sit on the foam roller with one ankle crossed over the opposite knee (figure-4 position). Lean toward the crossed leg side and roll your glute. Use your hands for support and control.',
    'Deep pressure in your glute muscles. May find very tender spots, especially in the piriformis.',
    'Go slowly and breathe. Can use a lacrosse ball for more targeted pressure if the roller isn''t enough.',
    1,
    60,
    ARRAY['glutes', 'piriformis'],
    'beginner',
    3,
    ARRAY['foam_roller'],
    true
),

-- Calf Foam Roll
(
    'Calf Foam Roll',
    'calf-foam-roll',
    'foam_roll',
    'lower_body',
    'Sit with the foam roller under your calves. Support yourself with your hands. Roll from ankle to knee. Cross one leg over the other for more pressure. Rotate foot in/out to hit different calf muscles.',
    'Pressure along the calf muscles. May be especially tender near the Achilles attachment.',
    'Don''t roll directly on the Achilles tendon. Take your time on tight spots.',
    1,
    45,
    ARRAY['calves', 'soleus'],
    'beginner',
    2,
    ARRAY['foam_roller'],
    true
),

-- Upper Back Foam Roll
(
    'Upper Back (Thoracic) Foam Roll',
    'upper-back-foam-roll',
    'foam_roll',
    'upper_body',
    'Lie on your back with the foam roller across your upper back, just below your shoulder blades. Support your head with your hands. Lift hips and roll from mid-back to upper back. Extend over the roller at tight spots.',
    'Pressure and extension through your thoracic spine. May hear some gentle pops as the spine mobilizes.',
    'Don''t roll your lower back - keep the roller in the thoracic region. Support your neck throughout.',
    1,
    60,
    ARRAY['thoracic_spine', 'rhomboids'],
    'beginner',
    3,
    ARRAY['foam_roller'],
    true
),

-- Lat Foam Roll
(
    'Lat Foam Roll',
    'lat-foam-roll',
    'foam_roll',
    'upper_body',
    'Lie on your side with the foam roller under your armpit area. Extend your bottom arm overhead. Roll from armpit to mid-back, staying on the lat muscle.',
    'Pressure along the side of your back (lats). May feel tender, especially if you''ve been throwing.',
    'Don''t roll into your armpit or over your ribs. Keep the pressure on the muscle tissue.',
    1,
    45,
    ARRAY['lats', 'teres_major'],
    'intermediate',
    3,
    ARRAY['foam_roller'],
    true
)

ON CONFLICT (slug) DO UPDATE SET
    how_text = EXCLUDED.how_text,
    feel_text = EXCLUDED.feel_text,
    compensation_text = EXCLUDED.compensation_text,
    default_sets = EXCLUDED.default_sets,
    default_duration_seconds = EXCLUDED.default_duration_seconds,
    updated_at = NOW();

-- ============================================================================
-- WARM-UP EXERCISES (Dynamic)
-- ============================================================================

INSERT INTO exercises (
    name, slug, category, subcategory,
    how_text, feel_text, compensation_text,
    default_sets, default_reps, default_duration_seconds,
    target_muscles, difficulty_level, load_contribution_au, active
) VALUES
-- Leg Swings (Front-to-Back)
(
    'Leg Swings (Front-to-Back)',
    'leg-swings-front-back',
    'warm_up',
    'dynamic_stretch',
    'Stand sideways to a wall or fence for balance. Swing one leg forward and backward in a controlled arc. Keep your torso upright and core engaged. Gradually increase the range of motion.',
    'Dynamic stretch in hip flexors and hamstrings. Increased blood flow to legs.',
    'Don''t swing so hard that you lose balance. Keep the movement controlled, not ballistic.',
    2,
    10,
    NULL,
    ARRAY['hip_flexors', 'hamstrings', 'glutes'],
    'beginner',
    5,
    true
),

-- Leg Swings (Side-to-Side)
(
    'Leg Swings (Side-to-Side)',
    'leg-swings-side-to-side',
    'warm_up',
    'dynamic_stretch',
    'Face a wall or fence for balance. Swing one leg across your body and then out to the side. Keep your hips facing forward throughout.',
    'Dynamic stretch in groin (adductors) and outer hip (abductors).',
    'Don''t rotate your hips with the swing. Keep the movement in the frontal plane.',
    2,
    10,
    NULL,
    ARRAY['adductors', 'abductors', 'glutes'],
    'beginner',
    5,
    true
),

-- A-Skips
(
    'A-Skips',
    'a-skips',
    'warm_up',
    'running_drills',
    'Skip forward while driving one knee up to hip height. Focus on quick, rhythmic ground contacts. Pump your arms in opposition to your legs. Stay tall with good posture.',
    'Activation in hip flexors and calves. Increased heart rate. Coordination between arms and legs.',
    'Don''t lean back. Keep your core tight and posture tall. Focus on quick ground contact, not height.',
    2,
    NULL,
    NULL,
    ARRAY['hip_flexors', 'calves', 'core'],
    'beginner',
    8,
    true
),

-- High Knees
(
    'High Knees',
    'high-knees',
    'warm_up',
    'running_drills',
    'Run in place or moving forward, driving your knees up to hip height with each step. Pump your arms and maintain quick, light foot contacts.',
    'Elevated heart rate. Hip flexor activation. Full-body warm-up.',
    'Don''t lean back. Stay on the balls of your feet. Keep the tempo quick.',
    2,
    NULL,
    20,
    ARRAY['hip_flexors', 'calves', 'core'],
    'beginner',
    10,
    true
),

-- Butt Kicks
(
    'Butt Kicks',
    'butt-kicks',
    'warm_up',
    'running_drills',
    'Run in place or moving forward, kicking your heels up toward your glutes with each step. Keep your thighs relatively vertical.',
    'Stretch and activation in quadriceps. Elevated heart rate.',
    'Don''t let your knees come forward. Focus on quick heel recovery.',
    2,
    NULL,
    20,
    ARRAY['quadriceps', 'hamstrings'],
    'beginner',
    8,
    true
),

-- Lateral Shuffles
(
    'Lateral Shuffles',
    'lateral-shuffles',
    'warm_up',
    'agility',
    'Get in an athletic stance with knees bent. Shuffle sideways, pushing off with the trailing leg. Keep your hips low and feet apart - don''t let them click together.',
    'Activation in glutes and outer hips. Elevated heart rate. Lateral movement pattern warm-up.',
    'Stay low throughout. Don''t cross your feet. Keep your chest up.',
    2,
    NULL,
    NULL,
    ARRAY['glutes', 'abductors', 'quads'],
    'beginner',
    10,
    true
),

-- Arm Circles
(
    'Arm Circles',
    'arm-circles',
    'warm_up',
    'upper_body',
    'Stand tall with arms extended to the sides. Make small circles, gradually increasing to larger circles. Do both forward and backward directions.',
    'Warming of shoulder joints. Increased blood flow to upper body.',
    'Keep your core engaged. Don''t shrug your shoulders up.',
    1,
    10,
    NULL,
    ARRAY['shoulders', 'rotator_cuff'],
    'beginner',
    3,
    true
),

-- Torso Twists
(
    'Torso Twists',
    'torso-twists',
    'warm_up',
    'core',
    'Stand with feet shoulder-width apart, arms extended in front or hands on shoulders. Rotate your torso left and right in a controlled manner. Keep your hips facing forward.',
    'Rotation and warming of the spine. Core activation.',
    'Don''t rotate your hips - the movement should come from your thoracic spine. Keep it controlled, not ballistic.',
    1,
    NULL,
    30,
    ARRAY['obliques', 'thoracic_spine'],
    'beginner',
    3,
    true
)

ON CONFLICT (slug) DO UPDATE SET
    how_text = EXCLUDED.how_text,
    feel_text = EXCLUDED.feel_text,
    compensation_text = EXCLUDED.compensation_text,
    default_sets = EXCLUDED.default_sets,
    default_reps = EXCLUDED.default_reps,
    default_duration_seconds = EXCLUDED.default_duration_seconds,
    updated_at = NOW();

-- ============================================================================
-- COOL-DOWN / RECOVERY EXERCISES
-- ============================================================================

INSERT INTO exercises (
    name, slug, category, subcategory,
    how_text, feel_text, compensation_text,
    default_sets, default_hold_seconds, default_duration_seconds,
    target_muscles, difficulty_level, load_contribution_au, active
) VALUES
-- Walking Cool-Down
(
    'Walking Cool-Down with Deep Breathing',
    'walking-cool-down',
    'cool_down',
    'recovery',
    'Walk at an easy pace. Focus on deep belly breaths - inhale for 4 counts, exhale for 6-8 counts. Gradually bring your heart rate down.',
    'Gradual decrease in heart rate. Activation of parasympathetic nervous system (rest and digest).',
    'Don''t stop moving abruptly after intense exercise. Keep the walking pace easy.',
    1,
    NULL,
    120,
    ARRAY['cardiovascular'],
    'beginner',
    2,
    true
),

-- Static Quad Stretch
(
    'Static Quad Stretch',
    'static-quad-stretch',
    'cool_down',
    'static_stretch',
    'Stand on one leg (hold something for balance if needed). Grab your opposite ankle and pull your heel toward your glute. Keep your knees together and push your hips forward slightly.',
    'Stretch along the front of your thigh (quadriceps).',
    'Don''t arch your lower back excessively. Keep your core engaged and standing knee slightly bent.',
    1,
    30,
    NULL,
    ARRAY['quadriceps'],
    'beginner',
    2,
    true
),

-- Static Hamstring Stretch
(
    'Static Hamstring Stretch',
    'static-hamstring-stretch',
    'cool_down',
    'static_stretch',
    'Stand with one foot slightly forward, heel on ground, toes up. Keep that leg straight and hinge at your hips to lean forward. Reach toward your toes.',
    'Stretch along the back of your thigh (hamstrings).',
    'Don''t round your back to reach further. Keep a flat back and hinge from the hips.',
    1,
    30,
    NULL,
    ARRAY['hamstrings'],
    'beginner',
    2,
    true
),

-- Hip Flexor Stretch (Kneeling)
(
    'Kneeling Hip Flexor Stretch',
    'kneeling-hip-flexor-stretch',
    'cool_down',
    'static_stretch',
    'Kneel on one knee with the other foot flat in front (90-degree angle at both knees). Keep your torso upright and gently push your hips forward. Raise the same-side arm as your back knee for a deeper stretch.',
    'Deep stretch in the front of your hip (hip flexor and psoas).',
    'Don''t arch your lower back excessively. Tuck your pelvis under slightly and engage your glute.',
    1,
    30,
    NULL,
    ARRAY['hip_flexors', 'psoas'],
    'beginner',
    2,
    true
),

-- Calf Stretch
(
    'Standing Calf Stretch',
    'standing-calf-stretch',
    'cool_down',
    'static_stretch',
    'Stand facing a wall with hands on the wall. Step one foot back, keeping it straight with heel on the ground. Lean forward into the wall until you feel a stretch in your calf.',
    'Stretch in the calf muscle (gastrocnemius).',
    'Keep your back heel on the ground. Don''t let your back foot turn out.',
    1,
    30,
    NULL,
    ARRAY['calves', 'gastrocnemius'],
    'beginner',
    2,
    true
),

-- Child's Pose
(
    'Child''s Pose',
    'childs-pose',
    'recovery',
    'relaxation',
    'Kneel on the floor, sit back on your heels, then fold forward with arms extended in front or alongside your body. Rest your forehead on the ground.',
    'Gentle stretch in back, hips, and shoulders. Deep relaxation and calming of the nervous system.',
    'If knees are uncomfortable, place a pillow between your calves and thighs.',
    1,
    60,
    NULL,
    ARRAY['back', 'hips', 'shoulders'],
    'beginner',
    2,
    true
)

ON CONFLICT (slug) DO UPDATE SET
    how_text = EXCLUDED.how_text,
    feel_text = EXCLUDED.feel_text,
    compensation_text = EXCLUDED.compensation_text,
    default_sets = EXCLUDED.default_sets,
    default_hold_seconds = EXCLUDED.default_hold_seconds,
    default_duration_seconds = EXCLUDED.default_duration_seconds,
    updated_at = NOW();

-- ============================================================================
-- Add progression rules for key exercises
-- ============================================================================

INSERT INTO exercise_progressions (exercise_id, progression_type, increment_value, min_value, max_value)
SELECT e.id, 'linear_hold', 5, 20, 60
FROM exercises e WHERE e.slug = 'hip-90-90-stretch'
ON CONFLICT (exercise_id, progression_type) DO NOTHING;

INSERT INTO exercise_progressions (exercise_id, progression_type, increment_value, min_value, max_value)
SELECT e.id, 'linear_reps', 1, 3, 10
FROM exercises e WHERE e.slug = 'worlds-greatest-stretch'
ON CONFLICT (exercise_id, progression_type) DO NOTHING;

INSERT INTO exercise_progressions (exercise_id, progression_type, increment_value, min_value, max_value)
SELECT e.id, 'linear_hold', 5, 30, 60
FROM exercises e WHERE e.slug = 'supine-hip-flexion-external-rotation'
ON CONFLICT (exercise_id, progression_type) DO NOTHING;
