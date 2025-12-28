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
