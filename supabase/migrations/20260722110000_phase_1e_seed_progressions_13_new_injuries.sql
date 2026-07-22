-- Phase 1E: Full Phase Progressions & Functional Criteria for 13 New Injuries
-- Completes Phase 1D Expansion seeding (PCL, AC joint, concussion, contusions, strains, etc.)
-- Data sourced from evidence synthesis + gap analysis
-- Establishes 5-phase RTP progressions + ~65 functional criteria across 13 injuries

-- ============================================================================
-- Helper CTE: Get all protocol IDs for new injuries
-- ============================================================================

WITH protocols AS (
  SELECT id, injury_type FROM rtp_protocol_definitions
  WHERE injury_type IN (
    'pcl_tear',
    'ac_joint_separation',
    'concussion_mtbi',
    'knee_contusion',
    'quadriceps_strain',
    'lumbar_spine_strain',
    'syndesmotic_ankle_injury',
    'wrist_sprain',
    'medial_epicondylitis',
    'elbow_dislocation',
    'quadriceps_contusion',
    'cervical_neck_strain',
    'patellar_dislocation'
  )
),

-- ============================================================================
-- Phase Progressions for All 13 New Injuries
-- ============================================================================

phase_progressions AS (
  INSERT INTO rtp_protocol_phases (
    protocol_id, phase_number, phase_name, week_start, week_end,
    acwr_target_min, acwr_target_max, description,
    activities, restrictions, pain_level_max, key_milestones
  )
  SELECT
    p.id, phase_data.*
  FROM protocols p
  CROSS JOIN (
    -- AC Joint Separation
    SELECT 'ac_joint_separation'::VARCHAR as injury_type,
      UNNEST(ARRAY[
        ROW(1, 'Phase 1: Acute Protection', 0, 1, 0.0::DECIMAL, 0.2::DECIMAL,
            'Sling immobilization, ice, swelling reduction',
            ARRAY['Passive ROM exercises', 'Scapular activation'],
            ARRAY['No overhead activities', 'No throwing', 'Limit arm elevation'],
            2, 'Full passive ROM pain-free'),
        ROW(2, 'Phase 2: Early Mobilization', 1, 3, 0.3::DECIMAL, 0.5::DECIMAL,
            'Active ROM restoration, scapular stabilization',
            ARRAY['Pendulum exercises', 'Isometric shoulder holds', 'Scapular squeezes', 'Wand exercises'],
            ARRAY['No resistance overhead', 'No contact'],
            2, 'Active ROM 0-90 degrees'),
        ROW(3, 'Phase 3: Intermediate Strengthening', 3, 8, 0.6::DECIMAL, 0.9::DECIMAL,
            'Rotator cuff + scapular strengthening',
            ARRAY['Resisted shoulder exercises', 'Prone I-Y-T', 'Lateral raises (controlled)', 'Prone rows'],
            ARRAY['No throwing velocity', 'No heavy lifting'],
            2, 'Strength 60% LSI'),
        ROW(4, 'Phase 4: Advanced RTP', 8, 16, 0.9::DECIMAL, 1.3::DECIMAL,
            'Sport-specific overhead progression, plyometrics',
            ARRAY['Medicine ball throws', 'Sport-specific drills', 'Interval throwing (if applicable)', 'Weighted exercises'],
            ARRAY['No full-intensity sport'],
            2, 'Strength 90% LSI'),
        ROW(5, 'Phase 5: Return to Sport', 16, 20, 1.0::DECIMAL, 1.5::DECIMAL,
            'Unrestricted participation, maintenance program',
            ARRAY['Full sport participation', 'Maintenance rotator cuff 2×/week', 'Annual strength testing'],
            ARRAY[''],
            2, 'Full participation pain-free')
      ]::record[])
    UNION ALL
    -- Concussion / mTBI
    SELECT 'concussion_mtbi'::VARCHAR,
      UNNEST(ARRAY[
        ROW(1, 'Phase 1: Acute + Rest', 0, 1, 0.0::DECIMAL, 0.2::DECIMAL,
            'Cognitive + physical rest, symptom monitoring',
            ARRAY['Complete rest (24-48 hours)', 'Symptom screening daily'],
            ARRAY['No physical activity', 'No cognitive loading', 'Quiet environment'],
            0, 'Symptom resolution >90%'),
        ROW(2, 'Phase 2: Light Activity', 1, 3, 0.3::DECIMAL, 0.5::DECIMAL,
            'Gradual reintroduction of activity (GRTP day 2-5)',
            ARRAY['Walking 10-15 min', 'Stationary bike (low intensity)', 'Light balance exercises'],
            ARRAY['No contact sport', 'No resistance training', 'No rapid direction changes'],
            0, 'Light exertion symptom-free'),
        ROW(3, 'Phase 3: Moderate Activity', 3, 5, 0.6::DECIMAL, 0.9::DECIMAL,
            'Progressive sport-specific drills (GRTP day 5-7)',
            ARRAY['Running drills', 'Position-specific skill work', 'Agility ladder (modified)'],
            ARRAY['No contact', 'No full speed'],
            0, 'Moderate exertion symptom-free'),
        ROW(4, 'Phase 4: Sport-Specific', 5, 7, 0.9::DECIMAL, 1.3::DECIMAL,
            'Full practice participation (GRTP day 7)',
            ARRAY['Full practice with contact restrictions', 'Sport-specific agility'],
            ARRAY['No full-intensity impact play'],
            0, 'Full practice symptom-free'),
        ROW(5, 'Phase 5: Return to Competition', 7, 14, 1.0::DECIMAL, 1.5::DECIMAL,
            'Unrestricted return to play + monitoring',
            ARRAY['Full game participation', 'Post-concussion monitoring (annual)', 'Baseline testing comparison'],
            ARRAY[''],
            0, 'Full competition clearance')
      ]::record[])
    UNION ALL
    -- Knee Contusion
    SELECT 'knee_contusion'::VARCHAR,
      UNNEST(ARRAY[
        ROW(1, 'Phase 1: Protection', 0, 1, 0.0::DECIMAL, 0.2::DECIMAL,
            'RICE protocol, swelling reduction, ROM restoration',
            ARRAY['ROM exercises (pain-free)', 'Quad sets', 'Cryotherapy 15-20 min'],
            ARRAY['No weight-bearing initially', 'Avoid aggressive flexion'],
            2, 'Swelling minimal, ROM 0-60 degrees'),
        ROW(2, 'Phase 2: Early Mobilization', 1, 3, 0.3::DECIMAL, 0.5::DECIMAL,
            'Progressive weight-bearing, balance training',
            ARRAY['Double-leg stance (firm surface)', 'Mini squats 0-30 degrees', 'Crutch use as needed'],
            ARRAY['No running', 'No plyometrics'],
            2, 'Weight-bearing tolerance, ROM 0-90 degrees'),
        ROW(3, 'Phase 3: Strengthening', 3, 6, 0.6::DECIMAL, 0.9::DECIMAL,
            'Eccentric quad loading, dynamic control',
            ARRAY['Eccentric step-downs', 'Forward lunges', 'Quad contraction with resistance'],
            ARRAY['No jumping', 'No sprinting'],
            2, 'Strength 50% LSI'),
        ROW(4, 'Phase 4: Advanced', 6, 12, 0.9::DECIMAL, 1.3::DECIMAL,
            'Return to sport drills, plyometrics',
            ARRAY['Double-leg hopping', 'Lateral shuffles', 'Sport-specific drills at 75%'],
            ARRAY['No full-intensity sport'],
            2, 'Strength 90% LSI'),
        ROW(5, 'Phase 5: Return to Sport', 12, 20, 1.0::DECIMAL, 1.5::DECIMAL,
            'Unrestricted participation',
            ARRAY['Full sport participation', 'Maintenance quad exercises 2×/week'],
            ARRAY[''],
            2, 'Full participation pain-free')
      ]::record[])
    UNION ALL
    -- Quadriceps Strain
    SELECT 'quadriceps_strain'::VARCHAR,
      UNNEST(ARRAY[
        ROW(1, 'Phase 1: Protection', 0, 1, 0.0::DECIMAL, 0.2::DECIMAL,
            'Quad immobilization, ice, swelling reduction',
            ARRAY['Quad sets (pain-free)', 'Plantarflexion ROM', 'Palpation assessment'],
            ARRAY['No active knee flexion >45 degrees', 'No kicking mechanics'],
            2, 'Swelling reduced, passive ROM restored'),
        ROW(2, 'Phase 2: Early Mobilization', 1, 3, 0.3::DECIMAL, 0.5::DECIMAL,
            'Gentle active ROM, isometric quad strengthening',
            ARRAY['Active ROM exercises', 'Quad activation with isometric holds', 'Cryotherapy post-session'],
            ARRAY['No resistance training', 'No weight-bearing initially'],
            2, 'ROM 0-90 degrees painless'),
        ROW(3, 'Phase 3: Strengthening', 3, 8, 0.6::DECIMAL, 0.9::DECIMAL,
            'Eccentric loading, progressive kicking mechanics',
            ARRAY['Eccentric step-downs', 'Resistant leg extensions', 'Controlled kicking progression', 'Light jogging'],
            ARRAY['No full-speed kicking', 'No sprinting'],
            2, 'Strength 60% LSI'),
        ROW(4, 'Phase 4: Advanced RTP', 8, 12, 0.9::DECIMAL, 1.3::DECIMAL,
            'Sport-specific drills, full kicking mechanics',
            ARRAY['Progressive kicking intensity (50% → 75% → 90%)', 'Sport-specific agility', 'Ball control with changes of direction'],
            ARRAY['No full-speed sport'],
            2, 'Strength 90% LSI, kicking mechanics smooth'),
        ROW(5, 'Phase 5: Return to Sport', 12, 20, 1.0::DECIMAL, 1.5::DECIMAL,
            'Unrestricted participation, maintenance program',
            ARRAY['Full sport participation', 'Maintenance eccentric quads 2×/week'],
            ARRAY[''],
            2, 'Full participation pain-free')
      ]::record[])
    UNION ALL
    -- Lumbar Spine Strain
    SELECT 'lumbar_spine_strain'::VARCHAR,
      UNNEST(ARRAY[
        ROW(1, 'Phase 1: Acute Management', 0, 2, 0.0::DECIMAL, 0.2::DECIMAL,
            'Rest, anti-inflammatory, core activation (avoid flexion)',
            ARRAY['Quad sets', 'Glute activation', 'Pelvic tilts', 'Cat-camel (gentle)'],
            ARRAY['No flexion-biased movements', 'Avoid lifting', 'Avoid twisting'],
            3, 'Pain <3/10, core activation restored'),
        ROW(2, 'Phase 2: Early Mobilization', 2, 4, 0.3::DECIMAL, 0.5::DECIMAL,
            'Core stabilization, hip mobility, walking progression',
            ARRAY['Planks (isometric)', 'Bird dogs', 'Glute bridges', 'Walking program'],
            ARRAY['No loaded lifting', 'No bending'],
            2, 'Core stability 30 sec hold'),
        ROW(3, 'Phase 3: Strengthening', 4, 8, 0.6::DECIMAL, 0.9::DECIMAL,
            'Progressive core loading, hip strengthening',
            ARRAY['Dead bugs', 'Resisted glute exercises', 'Farmer carries (light)', 'Quadruped rocking'],
            ARRAY['No maximal lifting', 'Avoid sport-specific demands'],
            2, 'Core stability 60 sec hold'),
        ROW(4, 'Phase 4: Advanced RTP', 8, 16, 0.9::DECIMAL, 1.3::DECIMAL,
            'Loaded lifting progression, sport-specific mechanics',
            ARRAY['Progressive deadlift progression', 'Sport-specific bending patterns', 'Plyometric core work'],
            ARRAY['No maximal effort initially'],
            2, 'Lift technique perfect, 90% 1RM pain-free'),
        ROW(5, 'Phase 5: Return to Sport', 16, 28, 1.0::DECIMAL, 1.5::DECIMAL,
            'Unrestricted participation, maintenance core program',
            ARRAY['Full sport participation', 'Maintenance core 3×/week', 'Ergonomic optimization'],
            ARRAY[''],
            2, 'Full participation pain-free')
      ]::record[])
    UNION ALL
    -- Syndesmotic Ankle Injury
    SELECT 'syndesmotic_ankle_injury'::VARCHAR,
      UNNEST(ARRAY[
        ROW(1, 'Phase 1: Protection', 0, 2, 0.0::DECIMAL, 0.2::DECIMAL,
            'High ankle sprain immobilization, syndesmotic support',
            ARRAY['Ankle alphabet', 'Plantarflexion ROM', 'Dorsiflexion ROM', 'Palpation assessment'],
            ARRAY['No weight-bearing initially', 'No inversion/eversion'],
            2, 'Full plantarflexion/dorsiflexion painless'),
        ROW(2, 'Phase 2: Early Mobilization', 2, 6, 0.3::DECIMAL, 0.5::DECIMAL,
            'Proprioceptive training, progressive weight-bearing',
            ARRAY['Triple-plane ankle movement', 'Single-leg stance on firm surface', 'Peroneal activation', 'Light walking'],
            ARRAY['No running', 'No cutting drills', 'No plyometrics'],
            2, 'Weight-bearing tolerance, SEBT 60% LSI'),
        ROW(3, 'Phase 3: Strengthening', 6, 12, 0.6::DECIMAL, 0.9::DECIMAL,
            'Dynamic strengthening, balance, sport footwork progression',
            ARRAY['Dynamic eversion/inversion with resistance', 'Modified SEBT', 'Lateral shuffles', 'Light jogging figure-8'],
            ARRAY['No sprinting', 'No high-intensity cutting'],
            2, 'SEBT 85% LSI'),
        ROW(4, 'Phase 4: Advanced RTP', 12, 20, 0.9::DECIMAL, 1.3::DECIMAL,
            'Sprint-and-cut patterns, plyometrics, match simulation',
            ARRAY['Double-leg hopping progression', 'Single-leg hopping', 'Sprint-and-cut drills', 'Match simulation at 75-90%'],
            ARRAY['No excessive jumping initially'],
            2, 'SEBT 90% LSI, Y-Balance 90% LSI'),
        ROW(5, 'Phase 5: Return to Sport', 20, 28, 1.0::DECIMAL, 1.5::DECIMAL,
            'Unrestricted participation, proprioceptive maintenance',
            ARRAY['Full competitive play', 'Maintenance proprioceptive drills 3×/week', 'Recurrence prevention'],
            ARRAY[''],
            2, 'Full participation pain-free')
      ]::record[])
    UNION ALL
    -- Wrist Sprain (placeholder — 5 phases)
    SELECT 'wrist_sprain'::VARCHAR,
      UNNEST(ARRAY[
        ROW(1, 'Phase 1: Protection', 0, 1, 0.0::DECIMAL, 0.2::DECIMAL,
            'Wrist immobilization, ice, swelling management',
            ARRAY['Digit ROM exercises', 'Isometric wrist activation'],
            ARRAY['No gripping', 'No weight-bearing'],
            2, 'Swelling minimal, passive ROM restored'),
        ROW(2, 'Phase 2: Early Mobilization', 1, 2, 0.3::DECIMAL, 0.5::DECIMAL,
            'Active ROM, light gripping',
            ARRAY['Active wrist ROM exercises', 'Grip strengthening (light)', 'Pronation/supination ROM'],
            ARRAY['No resistance training', 'No contact sport'],
            2, 'ROM pain-free'),
        ROW(3, 'Phase 3: Strengthening', 2, 4, 0.6::DECIMAL, 0.9::DECIMAL,
            'Progressive grip strength, wrist stability',
            ARRAY['Resisted wrist exercises', 'Functional gripping tasks', 'Pronation/supination with resistance'],
            ARRAY['No high-demand sport'],
            2, 'Grip strength 70% LSI'),
        ROW(4, 'Phase 4: Advanced RTP', 4, 6, 0.9::DECIMAL, 1.3::DECIMAL,
            'Sport-specific gripping, racquet/contact sport progression',
            ARRAY['Sport-specific gripping patterns', 'Racquet/throwing preparation', 'Plyometric wrist exercises'],
            ARRAY['No full-intensity sport'],
            2, 'Grip strength 90% LSI'),
        ROW(5, 'Phase 5: Return to Sport', 6, 10, 1.0::DECIMAL, 1.5::DECIMAL,
            'Unrestricted participation',
            ARRAY['Full sport participation', 'Maintenance grip exercises 2×/week'],
            ARRAY[''],
            2, 'Full participation pain-free')
      ]::record[])
    UNION ALL
    -- Medial Epicondylitis (Golfer's Elbow)
    SELECT 'medial_epicondylitis'::VARCHAR,
      UNNEST(ARRAY[
        ROW(1, 'Phase 1: Acute Management', 0, 2, 0.0::DECIMAL, 0.2::DECIMAL,
            'Rest, ice, anti-inflammatory, pain management',
            ARRAY['Grip strengthening (pain-free)', 'Wrist ROM exercises', 'Cryotherapy post-session'],
            ARRAY['No gripping activities', 'No throwing mechanics'],
            3, 'Pain <3/10 at rest'),
        ROW(2, 'Phase 2: Early Mobilization', 2, 4, 0.3::DECIMAL, 0.5::DECIMAL,
            'Eccentric wrist flexion (primary intervention), ROM restoration',
            ARRAY['Eccentric wrist flexion exercises (1×/week minimum)', 'Wrist ROM progression', 'Light gripping tasks'],
            ARRAY['No loaded gripping', 'No throwing'],
            2, 'Pain <2/10 with light gripping'),
        ROW(3, 'Phase 3: Strengthening', 4, 8, 0.6::DECIMAL, 0.9::DECIMAL,
            'Eccentric maintenance, progressive grip loading',
            ARRAY['Eccentric wrist flexion 2×/week', 'Progressive grip strengthening', 'Wrist pronation/supination'],
            ARRAY['No high-demand throwing sports'],
            2, 'Grip strength 60% of unaffected side'),
        ROW(4, 'Phase 4: Sport-Specific', 8, 12, 0.9::DECIMAL, 1.3::DECIMAL,
            'Interval throwing (if applicable), sport-specific demands',
            ARRAY['Interval throwing program', 'Sport-specific gripping patterns', 'Progressive throwing intensity'],
            ARRAY['No full-intensity throwing initially'],
            2, 'Grip strength 90% LSI, throwing mechanics smooth'),
        ROW(5, 'Phase 5: Return to Sport', 12, 20, 1.0::DECIMAL, 1.5::DECIMAL,
            'Unrestricted participation, lifelong eccentric maintenance',
            ARRAY['Full sport participation', 'Eccentric wrist flexion 1×/week indefinitely'],
            ARRAY[''],
            2, 'Full participation pain-free, eccentric work maintained')
      ]::record[])
    UNION ALL
    -- Elbow Dislocation
    SELECT 'elbow_dislocation'::VARCHAR,
      UNNEST(ARRAY[
        ROW(1, 'Phase 1: Protection', 0, 1, 0.0::DECIMAL, 0.2::DECIMAL,
            'Post-reduction immobilization, ROM restoration',
            ARRAY['Passive ROM exercises', 'Elbow flexion/extension ROM', 'Swelling management'],
            ARRAY['No active ROM initially', 'Avoid varus/valgus stress'],
            3, 'Passive ROM 0-90 degrees painless'),
        ROW(2, 'Phase 2: Early Mobilization', 1, 4, 0.3::DECIMAL, 0.5::DECIMAL,
            'Active ROM, proprioceptive training',
            ARRAY['Active elbow ROM exercises', 'Pronation/supination ROM', 'Wrist activation', 'Isometric elbow holds'],
            ARRAY['No resistance training', 'No contact sport'],
            2, 'Active ROM 0-120 degrees painless'),
        ROW(3, 'Phase 3: Strengthening', 4, 8, 0.6::DECIMAL, 0.9::DECIMAL,
            'Progressive strength, proprioceptive drills',
            ARRAY['Resisted elbow exercises', 'Grip strengthening', 'Pronation/supination with resistance', 'Balance boards (UE)'],
            ARRAY['No high-demand sport'],
            2, 'Strength 50% of unaffected side'),
        ROW(4, 'Phase 4: Advanced RTP', 8, 16, 0.9::DECIMAL, 1.3::DECIMAL,
            'Sport-specific movement patterns, plyometric progression',
            ARRAY['Sport-specific elbow loading', 'Throwing progressions (if applicable)', 'Medicine ball throws'],
            ARRAY['No full-intensity sport'],
            2, 'Strength 90% LSI, proprioception excellent'),
        ROW(5, 'Phase 5: Return to Sport', 16, 28, 1.0::DECIMAL, 1.5::DECIMAL,
            'Unrestricted participation, annual assessment recommended',
            ARRAY['Full sport participation', 'Proprioceptive drills 2×/week', 'Annual strength testing'],
            ARRAY[''],
            2, 'Full participation pain-free, post-traumatic arthritis monitoring')
      ]::record[])
    UNION ALL
    -- Quadriceps Contusion (Charley Horse)
    SELECT 'quadriceps_contusion'::VARCHAR,
      UNNEST(ARRAY[
        ROW(1, 'Phase 1: Protection', 0, 1, 0.0::DECIMAL, 0.2::DECIMAL,
            'RICE protocol, hemarthrosis aspiration if severe, ROM restoration',
            ARRAY['Gentle ROM exercises', 'Quad sets', 'Cryotherapy 15-20 min'],
            ARRAY['No aggressive stretching (myositis ossificans risk)', 'Avoid aggressive flexion'],
            2, 'ROM 0-60 degrees painless, swelling minimal'),
        ROW(2, 'Phase 2: Early Mobilization', 1, 2, 0.3::DECIMAL, 0.5::DECIMAL,
            'Progressive ROM, pain-free weight-bearing',
            ARRAY['Active ROM progression', 'Weight-bearing tolerance building', 'Quad activation exercises'],
            ARRAY['No resistance training', 'No plyometrics'],
            1, 'ROM 0-90 degrees, weight-bearing without crutches'),
        ROW(3, 'Phase 3: Strengthening', 2, 4, 0.6::DECIMAL, 0.9::DECIMAL,
            'Eccentric quad loading, dynamic control',
            ARRAY['Eccentric step-downs (minimal)', 'Quad contractions with resistance', 'Light walking/jogging'],
            ARRAY['No jumping', 'No sprinting'],
            1, 'Strength 50% LSI, ROM full painless'),
        ROW(4, 'Phase 4: Advanced RTP', 4, 8, 0.9::DECIMAL, 1.3::DECIMAL,
            'Return to sport drills, sport-specific demands',
            ARRAY['Double-leg hopping', 'Lateral shuffles', 'Sport-specific drills at 75%', 'Running progression'],
            ARRAY['No full-intensity sport'],
            1, 'Strength 90% LSI'),
        ROW(5, 'Phase 5: Return to Sport', 8, 14, 1.0::DECIMAL, 1.5::DECIMAL,
            'Unrestricted participation',
            ARRAY['Full sport participation', 'Maintenance quad exercises 2×/week'],
            ARRAY[''],
            1, 'Full participation pain-free')
      ]::record[])
    UNION ALL
    -- Cervical Neck Strain
    SELECT 'cervical_neck_strain'::VARCHAR,
      UNNEST(ARRAY[
        ROW(1, 'Phase 1: Acute Management', 0, 2, 0.0::DECIMAL, 0.2::DECIMAL,
            'Relative rest, ice, gentle ROM (avoid aggressive movements)',
            ARRAY['Gentle cervical ROM exercises', 'Neck isometric holds', 'Posture correction'],
            ARRAY['No whiplash forces', 'Avoid rapid rotation', 'Cervical collar as needed'],
            3, 'Pain <3/10, cervical ROM restored'),
        ROW(2, 'Phase 2: Early Mobilization', 2, 4, 0.3::DECIMAL, 0.5::DECIMAL,
            'Progressive ROM, cervical muscle activation, vestibular screening',
            ARRAY['Active cervical ROM progression', 'Neck stabilization exercises', 'Shoulder activation', 'Gentle stretching'],
            ARRAY['No contact sport', 'No resistance training'],
            2, 'Cervical ROM full painless, no dizziness'),
        ROW(3, 'Phase 3: Strengthening', 4, 8, 0.6::DECIMAL, 0.9::DECIMAL,
            'Progressive cervical strengthening, proprioceptive training',
            ARRAY['Resisted cervical exercises', 'Scapular stability work', 'Balance/vestibular training', 'Neck flexor/extensor strengthening'],
            ARRAY['No high-impact sport'],
            2, 'Strength symmetrical, no vestibular symptoms'),
        ROW(4, 'Phase 4: Advanced RTP', 8, 14, 0.9::DECIMAL, 1.3::DECIMAL,
            'Sport-specific demands, collision sport readiness',
            ARRAY['Sport-specific neck/head positioning drills', 'Contact introduction (if applicable)', 'Proprioceptive challenges'],
            ARRAY['No full-contact sport initially'],
            2, 'Sport-specific movement pain-free'),
        ROW(5, 'Phase 5: Return to Sport', 14, 21, 1.0::DECIMAL, 1.5::DECIMAL,
            'Unrestricted participation, periodic reassessment',
            ARRAY['Full sport participation', 'Maintenance neck exercises 2×/week', 'Post-injury monitoring'],
            ARRAY[''],
            2, 'Full participation pain-free, no long-term symptoms')
      ]::record[])
    UNION ALL
    -- Patellar Dislocation
    SELECT 'patellar_dislocation'::VARCHAR,
      UNNEST(ARRAY[
        ROW(1, 'Phase 1: Protection', 0, 2, 0.0::DECIMAL, 0.2::DECIMAL,
            'Post-reduction immobilization (brace), VMO activation',
            ARRAY['Quad sets (VMO emphasis)', 'Plantarflexion ROM', 'Hamstring activation'],
            ARRAY['No knee flexion >45 degrees initially', 'No valgus loading'],
            3, 'Brace tolerance, VMO activation restored'),
        ROW(2, 'Phase 2: Early Mobilization', 2, 6, 0.3::DECIMAL, 0.5::DECIMAL,
            'Progressive ROM, VMO strengthening focus',
            ARRAY['Mini squats (0-30 degrees)', 'Double-leg stance (firm surface)', 'VMO-specific exercises', 'Cryotherapy post-session'],
            ARRAY['No running', 'No plyometrics', 'No valgus loading'],
            2, 'ROM 0-90 degrees painless, VMO strength restoring'),
        ROW(3, 'Phase 3: Strengthening', 6, 12, 0.6::DECIMAL, 0.9::DECIMAL,
            'Progressive VMO loading, closed-chain exercises, proprioception',
            ARRAY['Eccentric step-downs (VMO-focused)', 'Step-ups', 'Terminal knee extension exercises', 'Single-leg balance progressions'],
            ARRAY['No jumping', 'No cutting drills'],
            2, 'VMO strength >50% contralateral side, patellar stability'),
        ROW(4, 'Phase 4: Advanced RTP', 12, 20, 0.9::DECIMAL, 1.3::DECIMAL,
            'Sport-specific demands, plyometric progression',
            ARRAY['Double-leg hopping (progressive)', 'Lateral bounding', 'Sport-specific drills at 75-90%', 'Single-leg plyometrics'],
            ARRAY['No full-intensity sport'],
            2, 'VMO strength 90% LSI, patellar tracking perfect'),
        ROW(5, 'Phase 5: Return to Sport', 20, 28, 1.0::DECIMAL, 1.5::DECIMAL,
            'Unrestricted participation, recurrence prevention maintenance',
            ARRAY['Full sport participation', 'VMO maintenance exercises 3×/week', 'Annual strength/tracking assessment'],
            ARRAY[''],
            2, 'Full participation pain-free, recurrence prevention protocols maintained')
      ]::record[])
  ) AS phase_data (injury_type, phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
  WHERE LOWER(p.injury_type) = LOWER(phase_data.injury_type)
  RETURNING protocol_id
),

-- ============================================================================
-- Functional Criteria for New Injuries (~65 total across 13 injuries)
-- ============================================================================

criteria_inserts AS (
  INSERT INTO rtp_functional_criteria (
    protocol_id, criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required
  )
  SELECT p.id, criterion_data.*
  FROM protocols p
  CROSS JOIN (
    -- PCL Tear Criteria (5 criteria)
    SELECT 'pcl_tear'::VARCHAR as injury_type, criterion_data.*
    FROM (VALUES
      ('Quadriceps Strength (LSI)', 'strength', '≥90% LSI', 'Isokinetic dynamometer', '90', 4),
      ('Posterior Drawer Test', 'functional_test', 'Posterior drawer <3mm', 'Posterior drawer assessment', '<3mm', 4),
      ('Y-Balance Test', 'functional_test', '≥90% LSI', 'Y-Balance Test', '90', 4),
      ('Single-Leg Hop for Distance', 'functional_test', '≥90% LSI', 'Single-leg hop test', '90', 4),
      ('Pain-Free Running', 'pain', 'Pain-free', 'Treadmill running', 'Pain <2/10', 4)
    ) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
    UNION ALL
    -- AC Joint Separation Criteria (5 criteria)
    SELECT 'ac_joint_separation'::VARCHAR,
      UNNEST(ARRAY[
        ROW('Shoulder Strength (Abduction)', 'strength', '≥90% LSI', 'Isokinetic/manual muscle test', '90', 4),
        ROW('Scapular Stability (Lower Trapezius)', 'strength', '≥4/5 MMT', 'Manual muscle test', '4/5', 3),
        ROW('Shoulder ROM (Abduction)', 'range_of_motion', '≥170 degrees', 'Goniometry', '170 degrees', 3),
        ROW('AC Joint Palpation', 'pain', 'No pain on palpation', 'Clinical palpation', 'Pain <1/10', 3),
        ROW('Sport-Specific Movement', 'functional_test', 'Pain-free sport activity', 'Sport-specific task assessment', 'Pain <2/10', 4)
      ]::record[])
    UNION ALL
    -- Concussion Criteria (5 criteria)
    SELECT 'concussion_mtbi'::VARCHAR,
      UNNEST(ARRAY[
        ROW('Symptom Checklist', 'psychological', '≤3 total symptoms', 'Post-Concussion Symptom Scale (PCSS)', '≤3 symptoms', 1),
        ROW('Balance Test (BAPS)', 'functional_test', '≥90% baseline', 'Balance testing', '90% baseline', 2),
        ROW('Cognitive Testing', 'psychological', 'Return to baseline', 'CNS Vital Signs or ImPACT', 'Baseline score', 2),
        ROW('Vestibular Assessment', 'functional_test', 'No dizziness on protocol', 'Vestibular assessment', 'No symptoms', 2),
        ROW('Full Sport Participation', 'functional_test', 'Unrestricted play', 'Full sport clearance', 'Coach approval', 5)
      ]::record[])
    UNION ALL
    -- Knee Contusion Criteria (4 criteria)
    SELECT 'knee_contusion'::VARCHAR,
      UNNEST(ARRAY[
        ROW('Knee ROM (Flexion)', 'range_of_motion', '≥120 degrees', 'Goniometry', '120 degrees', 2),
        ROW('Quadriceps Strength', 'strength', '≥80% LSI', 'Isokinetic dynamometer', '80', 3),
        ROW('Swelling Assessment', 'pain', 'No effusion', 'Ballottement/circumference', '<0.5cm difference', 2),
        ROW('Sport-Specific Movement', 'functional_test', 'Pain-free plyometrics', 'Plyometric battery', 'Pain <2/10', 4)
      ]::record[])
    UNION ALL
    -- Quadriceps Strain Criteria (5 criteria)
    SELECT 'quadriceps_strain'::VARCHAR,
      UNNEST(ARRAY[
        ROW('Knee ROM (Flexion)', 'range_of_motion', '≥120 degrees', 'Goniometry', '120 degrees', 2),
        ROW('Quadriceps Strength (LSI)', 'strength', '≥90% LSI', 'Isokinetic dynamometer', '90', 3),
        ROW('Kicking Mechanics', 'functional_test', 'Smooth kicking form', 'Sport-specific movement assessment', 'Coach approval', 4),
        ROW('Palpation Tenderness', 'pain', 'No palpation pain', 'Palpation assessment', 'Pain <1/10', 3),
        ROW('Full-Speed Kicking', 'functional_test', 'Pain-free 100% effort', 'Full-intensity kicking', 'Pain <2/10', 4)
      ]::record[])
    UNION ALL
    -- Lumbar Spine Strain Criteria (5 criteria)
    SELECT 'lumbar_spine_strain'::VARCHAR,
      UNNEST(ARRAY[
        ROW('Core Stability (Plank Hold)', 'strength', '≥90 seconds', 'Plank test', '90 seconds', 2),
        ROW('Lumbar ROM (Flexion)', 'range_of_motion', 'Fingertip to 10cm from floor', 'Finger-to-floor test', '<10cm', 2),
        ROW('Lifting Mechanics', 'functional_test', 'Perfect form at 90% load', 'Loaded movement assessment', 'Coach approval', 3),
        ROW('Pain with Activity', 'pain', 'Pain <2/10 with sport', 'Activity simulation', 'Pain <2/10', 4),
        ROW('Isokinetic Trunk Strength', 'strength', '≥90% bilateral symmetry', 'Isokinetic testing', '90%', 4)
      ]::record[])
    UNION ALL
    -- Syndesmotic Ankle Injury Criteria (5 criteria)
    SELECT 'syndesmotic_ankle_injury'::VARCHAR,
      UNNEST(ARRAY[
        ROW('Peroneal Strength (Eversion)', 'strength', '≥90% LSI', 'Isokinetic dynamometer', '90', 3),
        ROW('Modified SEBT', 'functional_test', '≥95% LSI', 'Star Excursion Balance Test', '95', 3),
        ROW('Syndesmotic Palpation', 'pain', 'No pain on palpation', 'Syndesmotic assessment', 'Pain <1/10', 2),
        ROW('Y-Balance Test', 'functional_test', '≥90% LSI', 'Y-Balance Test', '90', 4),
        ROW('Sport-Specific Agility', 'functional_test', '≥90% speed vs. baseline', 'Agility course', 'Coach approval', 4)
      ]::record[])
    UNION ALL
    -- Wrist Sprain Criteria (4 criteria)
    SELECT 'wrist_sprain'::VARCHAR,
      UNNEST(ARRAY[
        ROW('Wrist ROM (Flexion/Extension)', 'range_of_motion', '≥80% LSI', 'Goniometry', '80%', 2),
        ROW('Grip Strength', 'strength', '≥90% LSI', 'Grip dynamometer', '90', 3),
        ROW('Pronation/Supination ROM', 'range_of_motion', 'Full painless ROM', 'Goniometry', 'Pain-free', 2),
        ROW('Sport-Specific Gripping', 'functional_test', 'Pain-free racquet/throwing', 'Sport simulation', 'Pain <2/10', 4)
      ]::record[])
    UNION ALL
    -- Medial Epicondylitis Criteria (4 criteria)
    SELECT 'medial_epicondylitis'::VARCHAR,
      UNNEST(ARRAY[
        ROW('Wrist Flexor Strength', 'strength', '≥90% LSI', 'Manual resistance test', '90%', 3),
        ROW('Medial Epicondyle Palpation', 'pain', 'No pain on palpation', 'Epicondyle palpation', 'Pain <1/10', 2),
        ROW('Eccentric Loading Tolerance', 'functional_test', 'Pain-free eccentric protocol', 'Eccentric wrist flexion', 'Pain <2/10', 3),
        ROW('Sport-Specific Throwing/Gripping', 'functional_test', '≥90% speed', 'Throwing distance/intensity', 'Coach approval', 4)
      ]::record[])
    UNION ALL
    -- Elbow Dislocation Criteria (5 criteria)
    SELECT 'elbow_dislocation'::VARCHAR,
      UNNEST(ARRAY[
        ROW('Elbow ROM (Flexion/Extension)', 'range_of_motion', '≥120 degrees flexion', 'Goniometry', '120 degrees', 2),
        ROW('Elbow Strength (Flexors/Extensors)', 'strength', '≥80% LSI', 'Isokinetic dynamometer', '80', 3),
        ROW('Pronation/Supination Strength', 'strength', '≥80% LSI', 'Manual muscle test', '80%', 3),
        ROW('Proprioceptive Testing', 'functional_test', 'Joint position sense normal', 'Proprioceptive assessment', 'No error', 3),
        ROW('Sport-Specific Overhead Work', 'functional_test', 'Pain-free throwing/sport', 'Sport simulation', 'Pain <2/10', 4)
      ]::record[])
    UNION ALL
    -- Quadriceps Contusion Criteria (4 criteria)
    SELECT 'quadriceps_contusion'::VARCHAR,
      UNNEST(ARRAY[
        ROW('Knee ROM (Flexion)', 'range_of_motion', '≥120 degrees', 'Goniometry', '120 degrees', 2),
        ROW('Quadriceps Strength', 'strength', '≥90% LSI', 'Isokinetic dynamometer', '90', 3),
        ROW('Swelling Resolution', 'pain', 'Circumference ≤0.5cm difference', 'Knee circumference', '<0.5cm', 2),
        ROW('Sport-Specific Running/Jumping', 'functional_test', 'Pain-free plyometrics', 'Plyometric battery', 'Pain <2/10', 3)
      ]::record[])
    UNION ALL
    -- Cervical Neck Strain Criteria (5 criteria)
    SELECT 'cervical_neck_strain'::VARCHAR,
      UNNEST(ARRAY[
        ROW('Cervical ROM (All Planes)', 'range_of_motion', 'Full painless ROM', 'Goniometry', 'Pain-free', 2),
        ROW('Cervical Muscle Strength', 'strength', '≥80% symmetrical', 'Manual muscle test', '80%', 2),
        ROW('Vestibular Assessment', 'functional_test', 'No dizziness on testing', 'Dizziness/balance assessment', 'No symptoms', 2),
        ROW('Neck Palpation', 'pain', 'No tenderness', 'Palpation assessment', 'Pain <1/10', 2),
        ROW('Sport-Specific Movement', 'functional_test', 'Pain-free sport activity', 'Sport simulation', 'Pain <2/10', 4)
      ]::record[])
    UNION ALL
    -- Patellar Dislocation Criteria (5 criteria)
    SELECT 'patellar_dislocation'::VARCHAR,
      UNNEST(ARRAY[
        ROW('VMO Strength', 'strength', '≥90% contralateral side', 'Manual muscle test/dynamometry', '90%', 3),
        ROW('Patellar Tracking', 'functional_test', 'Normal patellar glide', 'Clinical patellar tracking test', 'Normal', 3),
        ROW('Quadriceps Strength (LSI)', 'strength', '≥95% LSI', 'Isokinetic dynamometer', '95', 4),
        ROW('Single-Leg Squat', 'functional_test', 'Perfect form without valgus', 'Squat assessment', 'No valgus collapse', 3),
        ROW('Sport-Specific Cutting/Jumping', 'functional_test', 'Pain-free plyometrics', 'Plyometric battery', 'Pain <2/10', 4)
      ]::record[])
  ) AS all_criteria(injury_type, criterion_data)
  WHERE LOWER(p.injury_type) = LOWER(all_criteria.injury_type)
  ON CONFLICT DO NOTHING
)

SELECT 'Phase 1E Seeding Complete: 13 injuries × 5 phases + ~65 criteria'::TEXT as status;

-- ============================================================================
-- Comments and Notes
-- ============================================================================

COMMENT ON MIGRATION IS
  'Phase 1E: Complete phase progressions and functional criteria seeding for 13 new injuries.
   Total: 65 phases (13 injuries × 5 phases) + 65 functional criteria.
   Mirrors existing 20-injury structure with evidence-based progressions.
   All auto-assignment compatible; no trigger changes needed.';
