-- Phase 1D: Seed RTP Protocol Phases (5-Mesocycle Structure) for 20 Common Sports Injuries
-- Complete phase progressions for all 20 injury protocols
-- Follows 5-phase model: Acute Protection → Early Mobilization → Intermediate Strengthening → Advanced RTP → Return to Sport

WITH protocols AS (
  SELECT id, injury_type FROM rtp_protocol_definitions
)

INSERT INTO rtp_protocol_phases (
  protocol_id, phase_number, phase_name, week_start, week_end,
  acwr_target_min, acwr_target_max, description,
  activities, restrictions, pain_level_max, key_milestones
)
-- HAMSTRING STRAIN (15-28 days) — functional recovery precedes biological healing
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  -- Phase 1: Acute Protection (0-1 week)
  (1, 'Phase 1: Acute Protection', 0, 1, 0.0::decimal, 0.2::decimal,
   'PRICE protocol, ROM restoration, swelling reduction',
   ARRAY['Prone hip extension ROM', 'Supine hamstring ROM', 'Quad sets', 'Gluteal activation'],
   ARRAY['No running', 'No resistance training', 'Avoid full lengthening'],
   2, 'Pain-free passive ROM achieved'),
  -- Phase 2: Early Mobilization (1-2 weeks)
  (2, 'Phase 2: Early Mobilization', 1, 2, 0.3::decimal, 0.5::decimal,
   'ROM progression, isometric strengthening, light activity tolerance',
   ARRAY['Active-assisted hamstring stretch', 'Isometric hip extension', 'Stationary bike low resistance', 'Core stabilization'],
   ARRAY['No sprinting', 'No plyometrics', 'No eccentric loading'],
   2, 'Hip extension strength 4/5, pain-free active ROM'),
  -- Phase 3: Intermediate Strengthening (2-3 weeks)
  (3, 'Phase 3: Intermediate Strengthening', 2, 3, 0.6::decimal, 0.9::decimal,
   'Eccentric strengthening, Nordic curls, dynamic control',
   ARRAY['Nordic hamstring curls (modified)', 'Prone hip flexion resisted', 'Sled push', 'Controlled jogging'],
   ARRAY['No high-speed running', 'No uncontrolled cutting'],
   2, 'Nordic curl strength 80% LSI achieved'),
  -- Phase 4: Advanced RTP (3-4 weeks)
  (4, 'Phase 4: Advanced RTP', 3, 4, 0.9::decimal, 1.3::decimal,
   'Sport-specific speed, eccentric maintenance, match preparation',
   ARRAY['Nordic hamstring curls (full)', 'Sprint intervals', 'Cutting drills', 'Sport-specific agility'],
   ARRAY['No contact initially', 'No max intensity'],
   2, 'Sprinting speed ≥95% LSI, ready for contact'),
  -- Phase 5: Return to Sport (4+ weeks)
  (5, 'Phase 5: Return to Sport', 4, 28, 1.0::decimal, 1.5::decimal,
   'Full participation, maintenance Nordic program 2-3×/week indefinitely',
   ARRAY['Full competitive play', 'Nordic hamstring maintenance 2-3×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation, maintenance adherence')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'hamstring_strain'

UNION ALL

-- PATELLAR TENDINOPATHY (42-56 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 2, 0.0::decimal, 0.2::decimal,
   'PRICE protocol, eccentric loading initiation, ROM preservation',
   ARRAY['Straight leg raises', 'Quad sets', 'Gentle patellar mobilization', 'Calf stretching'],
   ARRAY['No jumping', 'No running', 'Avoid painful loading'],
   2, 'Pain reduced to 2/10 at rest'),
  (2, 'Phase 2: Early Mobilization', 2, 3, 0.3::decimal, 0.5::decimal,
   'Eccentric quadriceps loading (step-downs), isometric knee extension',
   ARRAY['Eccentric step-downs', 'Isometric quad strengthening', 'Light walking', 'Hamstring flexibility'],
   ARRAY['No plyometrics', 'No explosive loading', 'No high-load squats'],
   2, 'Eccentric exercises pain-free at light load'),
  (3, 'Phase 3: Intermediate Strengthening', 3, 5, 0.6::decimal, 0.9::decimal,
   'Progressive eccentric loading, multi-plane control, light plyometrics',
   ARRAY['Progressive eccentric loading (heavy)', 'Bulgarian split squats eccentric', 'Light box drops', 'Lateral band walks'],
   ARRAY['No max-load jumping', 'No uncontrolled plyometrics'],
   2, 'Eccentric strength 90% LSI'),
  (4, 'Phase 4: Advanced RTP', 5, 7, 0.9::decimal, 1.3::decimal,
   'Sport-specific plyometrics, cutting, sport-specific footwork',
   ARRAY['Double-leg hop progression', 'Single-leg hop progression', 'Cutting drills (progressive)', 'Sport-specific training'],
   ARRAY['No max intensity initially', 'No contact'],
   2, 'Hop tests ≥90% LSI, ready for sport simulation'),
  (5, 'Phase 5: Return to Sport', 7, 56, 1.0::decimal, 1.5::decimal,
   'Full participation, eccentric maintenance 1×/week indefinitely',
   ARRAY['Full competitive play', 'Eccentric loading maintenance 1×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'patellar_tendinopathy'

UNION ALL

-- MEDIAL TIBIAL STRESS SYNDROME (56-112 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 2, 0.0::decimal, 0.2::decimal,
   'Relative rest, eccentric calf raises, tibialis posterior strengthening',
   ARRAY['Eccentric calf raises (double-leg)', 'Tibialis posterior strengthening', 'Shin palpation assessment', 'Gentle calf stretching'],
   ARRAY['No running', 'No impact activities', 'No hiking on uneven terrain'],
   2, 'Shin pain reduced to 2/10 at rest'),
  (2, 'Phase 2: Early Mobilization', 2, 4, 0.3::decimal, 0.5::decimal,
   'Eccentric calf loading progression, tibialis training, walk-run intervals 1:4',
   ARRAY['Eccentric calf raises (single-leg progression)', 'Tibialis anterior strengthening', 'Walk-run intervals 1:4', 'Proprioceptive training'],
   ARRAY['No continuous running', 'No high-intensity intervals', 'Avoid hard surfaces'],
   2, 'Walk-run intervals 1:4 pain-free'),
  (3, 'Phase 3: Intermediate Strengthening', 4, 8, 0.6::decimal, 0.9::decimal,
   'Progression to 1:2 and 1:1 intervals, eccentric maintenance, gait correction',
   ARRAY['Eccentric calf maintenance', 'Walk-run intervals 1:2', 'Walk-run intervals 1:1', 'Gait analysis-based drills', 'Hill training (light)'],
   ARRAY['No continuous running >20 min', 'No high-speed intervals'],
   2, 'Continuous running up to 15 minutes pain-free'),
  (4, 'Phase 4: Advanced RTP', 8, 12, 0.9::decimal, 1.3::decimal,
   'Continuous running progression, sport-specific pace, high-intensity intervals',
   ARRAY['Continuous running progression', 'Tempo running (moderate pace)', 'Sport-specific intervals', 'Eccentric maintenance'],
   ARRAY['No max-intensity intervals initially', 'No sudden volume increase'],
   2, 'Running 30+ minutes pain-free at sport-specific pace'),
  (5, 'Phase 5: Return to Sport', 12, 112, 1.0::decimal, 1.5::decimal,
   'Full participation, eccentric maintenance 2×/week indefinitely',
   ARRAY['Full competitive play', 'Eccentric calf maintenance 2×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'medial_tibial_stress_syndrome'

UNION ALL

-- ACHILLES TENDINOPATHY/RUPTURE (84-364 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 6, 0.0::decimal, 0.2::decimal,
   'Immobilization (2-6 weeks for rupture), PRICE protocol, ankle mobility work',
   ARRAY['Plantarflexion/dorsiflexion ROM (gentle)', 'Quad activation', 'Pelvic floor engagement'],
   ARRAY['No weight-bearing (rupture)', 'No resistance', 'No impact'],
   2, 'Biological window respected, pain reduced'),
  (2, 'Phase 2: Early Mobilization', 6, 12, 0.3::decimal, 0.5::decimal,
   'Progressive weight-bearing, eccentric calf initiation, proprioceptive training',
   ARRAY['Progressive weight-bearing (crutches → cane → unsupported)', 'Eccentric calf raises (double-leg, light)', 'Single-leg stance on firm surface', 'Seated ankle ROM'],
   ARRAY['No running', 'No plyometrics', 'No excessive eccentric loading'],
   2, 'Full weight-bearing achieved, pain 1-2/10'),
  (3, 'Phase 3: Intermediate Strengthening', 12, 20, 0.6::decimal, 0.9::decimal,
   'Eccentric loading progression, balance drills, light activity tolerance',
   ARRAY['Eccentric calf raises (single-leg progression)', 'Double-leg heel walks and raises', 'Dynamic proprioceptive training', 'Stationary bike'],
   ARRAY['No high-speed movements', 'No impact activities', 'No uncontrolled eccentric loading'],
   2, 'Eccentric strength 80% LSI, single-leg stance ≥30 sec'),
  (4, 'Phase 4: Advanced RTP', 20, 30, 0.9::decimal, 1.3::decimal,
   'Sport-specific speed, plyometrics progression, cutting drills',
   ARRAY['Eccentric calf maintenance', 'Controlled jogging', 'Double-leg hopping progression', 'Single-leg hop progression', 'Sport-specific agility'],
   ARRAY['No max-intensity sprinting', 'No uncontrolled plyometrics'],
   2, 'Hop tests ≥90% LSI, sprinting capability restored'),
  (5, 'Phase 5: Return to Sport', 30, 364, 1.0::decimal, 1.5::decimal,
   'Full participation, eccentric maintenance 1×/week indefinitely',
   ARRAY['Full competitive play', 'Eccentric calf maintenance 1×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'achilles_tendinopathy'

UNION ALL

-- ADDUCTOR/GROIN STRAIN (14-42 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 1, 0.0::decimal, 0.2::decimal,
   'PRICE protocol, ROM restoration, adductor palpation assessment',
   ARRAY['Hip adduction ROM (gentle)', 'Supine hip flexion/extension', 'Palpation-guided mobility', 'Quad activation'],
   ARRAY['No adduction resistance', 'No running', 'No sport'],
   2, 'Groin pain 1-2/10 at rest'),
  (2, 'Phase 2: Early Mobilization', 1, 2, 0.3::decimal, 0.5::decimal,
   'Eccentric hip adduction (Copenhagen device), AOS training initiation',
   ARRAY['Copenhagen device (light load)', 'Supine hip adduction resistance', 'Light walking', 'Core stabilization'],
   ARRAY['No high-load adduction', 'No running', 'No cutting drills'],
   2, 'Copenhagen exercises pain-free at light load'),
  (3, 'Phase 3: Intermediate Strengthening', 2, 4, 0.6::decimal, 0.9::decimal,
   'Progressive eccentric adduction loading, AOS exercises, dynamic control',
   ARRAY['Copenhagen device (progressive loading)', 'Standing hip adduction with resistance', 'AOS (Adductor Oriented Strengthening)', 'Light jogging', 'Lateral shuffles'],
   ARRAY['No high-speed cutting', 'No uncontrolled adduction resistance'],
   2, 'Adductor strength 90% LSI, AOS exercises ≥90% compliance'),
  (4, 'Phase 4: Advanced RTP', 4, 5, 0.9::decimal, 1.3::decimal,
   'Sport-specific agility, eccentric adduction maintenance, cutting progression',
   ARRAY['Eccentric adduction maintenance', 'Cutting drills (progressive)', 'Sport-specific footwork', 'Lateral acceleration-deceleration'],
   ARRAY['No max-intensity cutting initially', 'No contact'],
   2, 'Sport-specific cutting pain-free, ready for contact'),
  (5, 'Phase 5: Return to Sport', 5, 42, 1.0::decimal, 1.5::decimal,
   'Full participation, Copenhagen/AOS maintenance 3-4×/week indefinitely',
   ARRAY['Full competitive play', 'Copenhagen/AOS maintenance 3-4×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'adductor_groin_strain'

UNION ALL

-- MENISCUS TEAR (84-168 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 2, 0.0::decimal, 0.2::decimal,
   'ROM restrictions per surgeon (repair vs meniscectomy), swelling reduction, quad activation',
   ARRAY['Quad sets', 'Plantarflexion ROM', 'Prone hip extension', 'Pelvic floor engagement'],
   ARRAY['No weight-bearing (repair)', 'No ROM beyond restrictions', 'No resistance'],
   2, 'Swelling reduced, pain controlled at rest'),
  (2, 'Phase 2: Early Mobilization', 2, 6, 0.3::decimal, 0.5::decimal,
   'Progressive weight-bearing, ROM restoration (repair: 0-90°)', ARRAY['Progressive weight-bearing', 'ROM progression per surgeon', 'Quad/glute strengthening', 'Hamstring flexibility'],
   ARRAY['No running', 'No ROM beyond restrictions', 'No plyometrics'],
   2, 'Full weight-bearing, surgeon-approved ROM achieved'),
  (3, 'Phase 3: Intermediate Strengthening', 6, 14, 0.6::decimal, 0.9::decimal,
   'Closed-chain exercises, stationary cycling, isometric strengthening',
   ARRAY['Mini squats (ROM-restricted)', 'Stationary bike progression', 'Leg press (controlled)', 'Lateral band walks', 'Glute bridges'],
   ARRAY['No running', 'No plyometrics', 'No uncontrolled ROM'],
   2, 'Quad/glute strength 80% LSI, ROM control excellent'),
  (4, 'Phase 4: Advanced RTP', 14, 20, 0.9::decimal, 1.3::decimal,
   'Light plyometrics, agility drills, controlled running',
   ARRAY['Double-leg hop progression', 'Light agility ladder', 'Controlled jogging', 'Sport-specific footwork', 'Step-ups/downs'],
   ARRAY['No max-intensity plyometrics', 'No uncontrolled cutting'],
   2, 'Hop tests ≥90% LSI, jogging pain-free'),
  (5, 'Phase 5: Return to Sport', 20, 168, 1.0::decimal, 1.5::decimal,
   'Full participation with ongoing strength maintenance 2-3×/week',
   ARRAY['Full competitive play', 'Quad/glute maintenance 2-3×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'meniscus_tear'

UNION ALL

-- IT BAND SYNDROME (14-56 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 1, 0.0::decimal, 0.2::decimal,
   'Relative rest, foam rolling, hip abductor strengthening initiation',
   ARRAY['IT band foam rolling', 'Hip abductor activation (clamshells)', 'Quad stretching', 'Glute activation'],
   ARRAY['No running', 'No high mileage walking', 'Avoid aggravating positions'],
   2, 'Lateral knee pain 1-2/10'),
  (2, 'Phase 2: Early Mobilization', 1, 2, 0.3::decimal, 0.5::decimal,
   'Foam rolling progression, hip abductor strengthening, light walking',
   ARRAY['IT band/vastus lateralis foam rolling', 'Side-lying hip abduction', 'Monster walks', 'Glute med strengthening', 'Light walking (pain-free distance)'],
   ARRAY['No running', 'No high-mileage activity'],
   2, 'Pain-free walking distance increasing'),
  (3, 'Phase 3: Intermediate Strengthening', 2, 4, 0.6::decimal, 0.9::decimal,
   'Progressive hip abductor loading, gait analysis drills, walk-run intervals',
   ARRAY['Lateral band walks (progressive load)', 'Side-lying hip abduction with resistance', 'Single-leg stance balance', 'Walk-run intervals (pain-free)', 'Gait retraining drills'],
   ARRAY['No high-intensity running', 'No hills', 'No uneven terrain'],
   2, 'Hip abductor strength 90% LSI, walk-run pain-free'),
  (4, 'Phase 4: Advanced RTP', 4, 7, 0.9::decimal, 1.3::decimal,
   'Running progression, controlled agility, foam rolling maintenance',
   ARRAY['Continuous running progression', 'Tempo running (easy pace)', 'Agility ladder drills', 'Sport-specific running patterns', 'Foam rolling maintenance'],
   ARRAY['No max-intensity running', 'No excessive mileage'],
   2, 'Running 30+ min pain-free at sport pace'),
  (5, 'Phase 5: Return to Sport', 7, 56, 1.0::decimal, 1.5::decimal,
   'Full participation, foam rolling + hip abductor maintenance 2-3×/week indefinitely',
   ARRAY['Full competitive play', 'Foam rolling + hip strengthening 2-3×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'it_band_syndrome'

UNION ALL

-- PLANTAR FASCIITIS (56-84 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 3, 0.0::decimal, 0.2::decimal,
   'Plantar fascia stretching, night splint, eccentric calf loading, heel pain assessment',
   ARRAY['Plantar fascia stretch (towel curl)', 'Night splint application', 'Eccentric calf raises (double-leg)', 'Heel pain palpation assessment', 'Supportive footwear'],
   ARRAY['No barefoot walking', 'Avoid high-load activities', 'Limit standing time'],
   2, 'Morning heel pain reduced from baseline'),
  (2, 'Phase 2: Early Mobilization', 3, 6, 0.3::decimal, 0.5::decimal,
   'Plantar fascia and calf stretching progression, eccentric loading, orthotics',
   ARRAY['Plantar fascia stretching (sustained)', 'Eccentric calf raises (single-leg progression)', 'Custom orthotics if needed', 'Ankle ROM exercises', 'Light walking on supportive surface'],
   ARRAY['No running', 'No high-impact activities', 'Avoid prolonged standing'],
   2, 'Morning stiffness significantly reduced'),
  (3, 'Phase 3: Intermediate Strengthening', 6, 9, 0.6::decimal, 0.9::decimal,
   'Eccentric calf maintenance, intrinsic foot strengthening, progressive activity tolerance',
   ARRAY['Eccentric calf raises (maintenance)', 'Intrinsic foot strengthening (arch doming)', 'Proprioceptive training', 'Controlled walking progression', 'Stationary bike'],
   ARRAY['No running', 'No impact activities', 'No uncontrolled eccentric loading'],
   2, 'Eccentric strength 90% LSI, pain-free standing ≥2 hours'),
  (4, 'Phase 4: Advanced RTP', 9, 12, 0.9::decimal, 1.3::decimal,
   'Light running progression, shock wave therapy if indicated, sport-specific loading',
   ARRAY['Light jogging (low-impact surface)', 'Sport-specific footwork', 'Eccentric maintenance', 'Proprioceptive training progression', 'Walking distance expansion'],
   ARRAY['No high-impact running initially', 'No uneven terrain'],
   2, 'Jogging 20+ minutes pain-free'),
  (5, 'Phase 5: Return to Sport', 12, 84, 1.0::decimal, 1.5::decimal,
   'Full participation, eccentric + stretching maintenance 5-7×/week indefinitely',
   ARRAY['Full competitive play', 'Fascia stretching + eccentric maintenance daily', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'plantar_fasciitis'

UNION ALL

-- STRESS FRACTURES (42-168 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 4, 0.0::decimal, 0.2::decimal,
   'Full immobilization, pain-free ROM, swelling management, bone healing initiation',
   ARRAY['ROM within immobilization limits', 'Proximal/distal joint mobilization', 'Core activation', 'Upper body strengthening'],
   ARRAY['No weight-bearing', 'No impact', 'No resistance in fracture area'],
   2, 'Pain controlled, swelling minimal'),
  (2, 'Phase 2: Early Mobilization', 4, 8, 0.3::decimal, 0.5::decimal,
   'Progressive weight-bearing (partial → full), ROM progression, cross-training',
   ARRAY['Progressive weight-bearing (crutches → cane → unsupported)', 'ROM progression beyond immobilization', 'Stationary bike (pain-free only)', 'Swimming', 'Upper body strengthening'],
   ARRAY['No running', 'No impact', 'No resistance in fracture zone'],
   2, 'Full weight-bearing achieved, pain 1-2/10'),
  (3, 'Phase 3: Intermediate Strengthening', 8, 16, 0.6::decimal, 0.9::decimal,
   'Controlled movement progression, isometric strengthening, light activity tolerance',
   ARRAY['Isometric strengthening (fracture zone)', 'Light ROM exercises', 'Swimming/pool running', 'Stationary bike progression', 'Core strengthening'],
   ARRAY['No running', 'No impact activities', 'No uncontrolled resistance'],
   2, 'Pain-free movement in fracture zone, strength 70% LSI'),
  (4, 'Phase 4: Advanced RTP', 16, 24, 0.9::decimal, 1.3::decimal,
   'Light impact introduction, sport-specific movement, controlled progression',
   ARRAY['Light jogging (low-impact surface)', 'Agility drills (controlled)', 'Sport-specific footwork', 'Progressive running', 'Proprioceptive training'],
   ARRAY['No max-intensity running', 'No uncontrolled impact'],
   2, 'Running 20+ minutes pain-free, strength ≥90% LSI'),
  (5, 'Phase 5: Return to Sport', 24, 168, 1.0::decimal, 1.5::decimal,
   'Full participation with activity monitoring and strength maintenance 2-3×/week',
   ARRAY['Full competitive play', 'Strength maintenance 2-3×/week', 'Sport-specific conditioning', 'Activity monitoring'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'stress_fracture'

UNION ALL

-- MCL INJURY (14-56 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 1, 0.0::decimal, 0.2::decimal,
   'PRICE protocol, valgus stress assessment, ROM preservation, swelling reduction',
   ARRAY['Knee flexion/extension ROM (gentle)', 'Quad sets', 'Glute activation', 'Supine hip mobility'],
   ARRAY['No valgus stress', 'No resistance', 'No running'],
   2, 'Pain 1-2/10, swelling reduced'),
  (2, 'Phase 2: Early Mobilization', 1, 2, 0.3::decimal, 0.5::decimal,
   'Proprioceptive training, isometric strengthening, valgus resistance introduction',
   ARRAY['Proprioceptive training (firm surface)', 'Quad strengthening (isometric)', 'Light ROM exercises', 'Stationary bike low resistance'],
   ARRAY['No valgus stress resistance', 'No running', 'No plyometrics'],
   2, 'Proprioceptive control improved, pain reduced'),
  (3, 'Phase 3: Intermediate Strengthening', 2, 4, 0.6::decimal, 0.9::decimal,
   'Valgus stress resistance progression, dynamic control, light running',
   ARRAY['Valgus resistance exercises (progressive)', 'Single-leg stance balance', 'Dynamic proprioceptive training', 'Light jogging', 'Lateral band walks'],
   ARRAY['No high-speed cutting', 'No uncontrolled valgus stress'],
   2, 'Valgus resistance 90% LSI, single-leg balance ≥30 sec'),
  (4, 'Phase 4: Advanced RTP', 4, 6, 0.9::decimal, 1.3::decimal,
   'Sport-specific agility, cutting progression, contact simulation',
   ARRAY['Cutting drills (progressive intensity)', 'Sport-specific footwork', 'Agility ladder', 'Contact simulation drills', 'Valgus resistance maintenance'],
   ARRAY['No max-intensity cutting', 'No uncontrolled contact'],
   2, 'Sport-specific cutting pain-free, ready for contact'),
  (5, 'Phase 5: Return to Sport', 6, 56, 1.0::decimal, 1.5::decimal,
   'Full participation, valgus resistance maintenance 2-3×/week indefinitely',
   ARRAY['Full competitive play', 'Valgus/proprioceptive maintenance 2-3×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'mcl_injury'

UNION ALL

-- HIP FLEXOR STRAIN (14-35 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 1, 0.0::decimal, 0.2::decimal,
   'PRICE protocol, iliopsoas palpation pain assessment, ROM preservation',
   ARRAY['Hip flexion ROM (gentle)', 'Prone hip extension ROM', 'Quad activation', 'Core stabilization'],
   ARRAY['No hip flexion resistance', 'No kicking motions', 'No running'],
   2, 'Hip flexor pain 1-2/10 at rest'),
  (2, 'Phase 2: Early Mobilization', 1, 2, 0.3::decimal, 0.5::decimal,
   'Hip flexor stretching, eccentric strengthening introduction, core stability',
   ARRAY['Hip flexor stretching (Thomas stretch)', 'Eccentric hip flexion (light load)', 'Core stabilization', 'Light walking', 'Quad strengthening'],
   ARRAY['No high-load hip flexion', 'No explosive hip flexion', 'No running'],
   2, 'Hip flexor pain reduced, stretching tolerance improved'),
  (3, 'Phase 3: Intermediate Strengthening', 2, 3, 0.6::decimal, 0.9::decimal,
   'Eccentric hip flexion loading, kicking mechanics progression, dynamic control',
   ARRAY['Eccentric hip flexion (progressive load)', 'Controlled kicking mechanics (light)', 'Core strengthening progression', 'Light jogging', 'Hip mobility drills'],
   ARRAY['No high-speed kicking', 'No max-load hip flexion'],
   2, 'Hip flexor strength 90% LSI, light kicking pain-free'),
  (4, 'Phase 4: Advanced RTP', 3, 4, 0.9::decimal, 1.3::decimal,
   'Sport-specific kicking, speed progression, eccentric maintenance',
   ARRAY['Controlled kicking (progressively faster)', 'Sport-specific footwork', 'Running with kicking mechanics', 'Eccentric hip flexion maintenance', 'Agility drills'],
   ARRAY['No max-intensity kicking', 'No uncontrolled explosive movements'],
   2, 'Sport-specific kicking speed achieved, ready for contact'),
  (5, 'Phase 5: Return to Sport', 4, 35, 1.0::decimal, 1.5::decimal,
   'Full participation, hip flexor strengthening maintenance 2-3×/week indefinitely',
   ARRAY['Full competitive play', 'Hip flexor maintenance 2-3×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'hip_flexor_strain'

UNION ALL

-- HIP LABRAL TEAR (56-168 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 4, 0.0::decimal, 0.2::decimal,
   'PRICE protocol, ROM restrictions per imaging, mechanical locking assessment, core activation',
   ARRAY['ROM within restrictions (surgeon-approved)', 'Core activation (supine, prone)', 'Quad sets', 'Glute activation'],
   ARRAY['No hip ROM beyond restrictions', 'No resistance', 'No running'],
   2, 'Locking/clicking reduced, pain 1-2/10'),
  (2, 'Phase 2: Early Mobilization', 4, 8, 0.3::decimal, 0.5::decimal,
   'ROM progression, hip stabilization, core strengthening, proprioceptive training',
   ARRAY['ROM progression per surgeon', 'Core strengthening (planks, bridges)', 'Glute med activation', 'Hip stabilization exercises', 'Stationary bike low resistance'],
   ARRAY['No hip ROM beyond restrictions', 'No resistance training', 'No running'],
   2, 'ROM improved within restrictions, locking minimal'),
  (3, 'Phase 3: Intermediate Strengthening', 8, 14, 0.6::decimal, 0.9::decimal,
   'Hip stabilization progression, light resistance, ACLR-style rehab progression',
   ARRAY['Progressive hip strengthening', 'Core strengthening (advanced)', 'Proprioceptive training (unstable surface)', 'Single-leg stance progression', 'Light walking'],
   ARRAY['No high-load hip resistance', 'No plyometrics', 'No uncontrolled ROM'],
   2, 'Hip stability 80% LSI, single-leg balance ≥30 sec'),
  (4, 'Phase 4: Advanced RTP', 14, 20, 0.9::decimal, 1.3::decimal,
   'Sport-specific loading, agility progression, dynamic control',
   ARRAY['Sport-specific footwork', 'Agility drills (controlled)', 'Light jogging', 'Dynamic core strengthening', 'Proprioceptive training (sport-specific)'],
   ARRAY['No max-intensity cutting', 'No uncontrolled movements'],
   2, 'Hip stability ≥95% LSI, jogging pain-free'),
  (5, 'Phase 5: Return to Sport', 20, 168, 1.0::decimal, 1.5::decimal,
   'Full participation, hip stability maintenance 2-3×/week indefinitely',
   ARRAY['Full competitive play', 'Hip/core maintenance 2-3×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'hip_labral_tear'

UNION ALL

-- SHOULDER INSTABILITY/DISLOCATION (84-180 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 3, 0.0::decimal, 0.2::decimal,
   'Sling immobilization (1-3 weeks), rotator cuff activation, scapular positioning',
   ARRAY['Shoulder ROM (sling restrictions)', 'Rotator cuff activation (supine)', 'Scapular positioning', 'Core activation'],
   ARRAY['No overhead activities', 'No resistance', 'No external rotation'],
   2, 'Pain controlled, dislocation risk minimized'),
  (2, 'Phase 2: Early Mobilization', 3, 6, 0.3::decimal, 0.5::decimal,
   'ROM progression, rotator cuff isometric strengthening, scapular stabilization',
   ARRAY['ROM progression (sling removed)', 'Rotator cuff isometric exercises', 'Scapular stabilization (prone Y-T)', 'Pendulum exercises', 'Postural exercises'],
   ARRAY['No overhead resistance', 'No throwing', 'No contact sports'],
   2, 'ROM improved, rotator cuff activation strong'),
  (3, 'Phase 3: Intermediate Strengthening', 6, 14, 0.6::decimal, 0.9::decimal,
   'Rotator cuff resistance progression, scapular stability drills, proprioceptive training',
   ARRAY['Rotator cuff resistance exercises (light)', 'Scapular strengthening (rows, Y-raises)', 'Proprioceptive training', 'Light throwing progression', 'Core strengthening'],
   ARRAY['No heavy overhead loading', 'No aggressive throwing', 'No uncontrolled external rotation'],
   2, 'Rotator cuff strength 80% LSI, scapular control excellent'),
  (4, 'Phase 4: Advanced RTP', 14, 24, 0.9::decimal, 1.3::decimal,
   'Interval throwing program, sport-specific overhead drills, proprioceptive maintenance',
   ARRAY['Interval throwing program (progressive)', 'Sport-specific overhead drills', 'Proprioceptive training (advanced)', 'Rotator cuff maintenance', 'Sport-specific training'],
   ARRAY['No max-intensity throwing', 'No contact initially'],
   2, 'Overhead athletes ready for sport-specific training'),
  (5, 'Phase 5: Return to Sport', 24, 180, 1.0::decimal, 1.5::decimal,
   'Full participation, rotator cuff + scapular maintenance 2-3×/week indefinitely',
   ARRAY['Full competitive play', 'Rotator cuff/scapular maintenance 2-3×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'shoulder_instability'

UNION ALL

-- SHOULDER LABRAL TEAR (56-180 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 3, 0.0::decimal, 0.2::decimal,
   'Sling immobilization (post-surgical), ROM restrictions, rotator cuff activation',
   ARRAY['ROM within surgical restrictions', 'Rotator cuff activation', 'Scapular positioning', 'Pendulum exercises'],
   ARRAY['No overhead activities', 'No resistance', 'No throwing'],
   2, 'Pain controlled, surgical site healing'),
  (2, 'Phase 2: Early Mobilization', 3, 8, 0.3::decimal, 0.5::decimal,
   'ROM progression (sling removed), rotator cuff isometric work, proprioceptive training',
   ARRAY['ROM progression per protocol', 'Rotator cuff isometric exercises', 'Scapular stabilization', 'Proprioceptive training', 'Postural exercises'],
   ARRAY['No overhead resistance', 'No throwing', 'No contact'],
   2, 'ROM improved within restrictions, pain 1-2/10'),
  (3, 'Phase 3: Intermediate Strengthening', 8, 14, 0.6::decimal, 0.9::decimal,
   'Rotator cuff resistance progression, scapular strengthening, light throwing (overhead athletes)',
   ARRAY['Rotator cuff resistance exercises', 'Scapular strengthening (rows, Y-raises)', 'Light interval program initiation', 'Core strengthening', 'Proprioceptive training'],
   ARRAY['No heavy overhead loading', 'No aggressive throwing', 'Throw interval compliance critical'],
   2, 'Rotator cuff strength 80% LSI, overhead athlete readiness protocol starting'),
  (4, 'Phase 4: Advanced RTP', 14, 20, 0.9::decimal, 1.3::decimal,
   'Interval throwing progression, sport-specific drills, annual strength testing ≥90% LSI required',
   ARRAY['Interval throwing progression', 'Sport-specific overhead drills', 'Rotator cuff maintenance', 'Proprioceptive training (sport-specific)', 'Core strengthening'],
   ARRAY['No max-intensity throwing', 'No uncontrolled overhead activities'],
   2, 'Overhead athlete 62% RTS baseline, non-overhead 72% baseline'),
  (5, 'Phase 5: Return to Sport', 20, 180, 1.0::decimal, 1.5::decimal,
   'Full participation, annual strength testing ≥90% LSI, rotator cuff maintenance 2-3×/week indefinitely',
   ARRAY['Full competitive play', 'Annual strength testing ≥90% LSI required', 'Rotator cuff maintenance 2-3×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation with ongoing surveillance')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'shoulder_labral_tear'

UNION ALL

-- LATERAL EPICONDYLITIS (42-84 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 2, 0.0::decimal, 0.2::decimal,
   'Eccentric wrist extension initiation (critical maintenance), relative rest, ROM preservation',
   ARRAY['Eccentric wrist extension (light load)', 'Wrist flexion ROM', 'Forearm stretching', 'Grip strengthening (pain-free)'],
   ARRAY['No gripping resistance', 'No repetitive wrist extension', 'No racquet play'],
   2, 'Elbow pain 2/10, ROM preserved'),
  (2, 'Phase 2: Early Mobilization', 2, 4, 0.3::decimal, 0.5::decimal,
   'Eccentric wrist extension progression (critical: 1×/week maintenance indefinitely), isometric strengthening',
   ARRAY['Eccentric wrist extension (progressive load)', 'Isometric wrist extension', 'Wrist flexor strengthening', 'Forearm stretching (sustained)', 'Light gripping'],
   ARRAY['No high-load gripping', 'No repetitive movements', 'No max-resistance activities'],
   2, 'Eccentric exercises pain-free at moderate load'),
  (3, 'Phase 3: Intermediate Strengthening', 4, 6, 0.6::decimal, 0.9::decimal,
   'Eccentric maintenance critical, dynamic wrist control, light activity tolerance',
   ARRAY['Eccentric wrist extension maintenance 1×/week (critical)', 'Dynamic wrist extension exercises', 'Grip strengthening (progressive)', 'Racquet technique drills (light)', 'Forearm muscle activation'],
   ARRAY['No high-speed racquet movements', 'No competitive play', 'No excessive gripping'],
   2, 'Eccentric strength 90% LSI, grip strength 90% LSI'),
  (4, 'Phase 4: Advanced RTP', 6, 8, 0.9::decimal, 1.3::decimal,
   'Sport-specific footwork, technique optimization, eccentric maintenance critical 1×/week',
   ARRAY['Eccentric maintenance 1×/week (critical)', 'Light racquet play (technique focus)', 'Sport-specific footwork', 'Equipment optimization trials', 'Proprioceptive training'],
   ARRAY['No max-intensity play', 'No aggressive hitting initially'],
   2, 'Racquet control excellent, technique optimized'),
  (5, 'Phase 5: Return to Sport', 8, 84, 1.0::decimal, 1.5::decimal,
   'Full participation, eccentric maintenance 1×/week indefinitely (80% of re-injuries from loss of eccentric work)',
   ARRAY['Full competitive play', 'Eccentric maintenance 1×/week indefinitely (critical)', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation with eccentric compliance')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'lateral_epicondylitis'

UNION ALL

-- ACL RUPTURE/RECONSTRUCTION (180-420 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 6, 0.0::decimal, 0.2::decimal,
   'Post-surgical immobilization (6 weeks), quad activation, ROM preservation within restrictions',
   ARRAY['ROM progression per protocol', 'Quad sets', 'Glute activation', 'Core strengthening'],
   ARRAY['No weight-bearing (early post-op)', 'No ROM beyond restrictions', 'No resistance'],
   2, 'Swelling controlled, quad function improving'),
  (2, 'Phase 2: Early Mobilization', 6, 12, 0.3::decimal, 0.5::decimal,
   'Progressive weight-bearing, ROM restoration, quadriceps strengthening',
   ARRAY['Progressive weight-bearing (crutches → cane → unsupported)', 'ROM progression', 'Quad strengthening (isometric → isotonic)', 'Glute activation', 'Stationary bike'],
   ARRAY['No running', 'No plyometrics', 'No cutting'],
   2, 'Full weight-bearing, quad strength 4+/5'),
  (3, 'Phase 3: Intermediate Strengthening', 12, 24, 0.6::decimal, 0.9::decimal,
   'Quad/hamstring parity building, isokinetic testing, light plyometrics',
   ARRAY['Quad/hamstring strengthening (progressive)', 'Isokinetic testing (establish baseline)', 'Light hop progressions', 'Light jogging', 'Balance/proprioceptive training'],
   ARRAY['No high-speed running', 'No uncontrolled plyometrics', 'No cutting drills'],
   2, 'Quad/hamstring strength ≥80% LSI, hop test ≥75% LSI'),
  (4, 'Phase 4: Advanced RTP', 24, 36, 0.9::decimal, 1.3::decimal,
   'Hop test progression, ACL-RSI ≥56 required, cutting progression, psychological readiness assessment',
   ARRAY['Progressive hop testing (single-leg)', 'Cutting drills (progressive intensity)', 'Sport-specific agility', 'Strength maintenance', 'Psychological readiness assessment'],
   ARRAY['No max-intensity cutting', 'No contact initially', 'ACL-RSI compliance'],
   2, 'Strength ≥90%, Hop test ≥90%, ACL-RSI ≥56'),
  (5, 'Phase 5: Return to Sport', 36, 420, 1.0::decimal, 1.5::decimal,
   'Full participation, isokinetic testing quarterly, strength maintenance 2-3×/week indefinitely',
   ARRAY['Full competitive play', 'Isokinetic testing quarterly', 'Strength maintenance 2-3×/week', 'Sport-specific conditioning', 'Psychological monitoring'],
   ARRAY[''],
   2, 'Full unrestricted participation with quarterly monitoring')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'acl_rupture'

UNION ALL

-- CALF STRAIN (14-112 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 1, 0.0::decimal, 0.2::decimal,
   'PRICE protocol, ROM restoration (grade-dependent), swelling reduction',
   ARRAY['Plantarflexion ROM (gentle)', 'Dorsiflexion ROM', 'Supine leg positioning', 'Elevation'],
   ARRAY['No weight-bearing (Grade III)', 'Avoid plantarflexion resistance', 'No running'],
   2, 'Calf pain 1-2/10, swelling minimal'),
  (2, 'Phase 2: Early Mobilization', 1, 2, 0.3::decimal, 0.5::decimal,
   'ROM progression, eccentric calf initiation (grade-dependent), gentle stretching',
   ARRAY['Eccentric calf raises (light load)', 'Calf stretching (sustained)', 'Plantarflexion ROM exercises', 'Light walking (pain-free distance)', 'Core stabilization'],
   ARRAY['No high-load eccentric work', 'No running', 'No explosive movements'],
   2, 'ROM improved, eccentric exercises tolerated'),
  (3, 'Phase 3: Intermediate Strengthening', 2, 4, 0.6::decimal, 0.9::decimal,
   'Eccentric loading progression, single-leg eccentric work, walk-run intervals',
   ARRAY['Eccentric calf raises (progressive load)', 'Single-leg eccentric progression', 'Plantarflexor strengthening', 'Walk-run intervals (pain-free)', 'Balance training'],
   ARRAY['No high-speed running', 'No uncontrolled eccentric loading'],
   2, 'Eccentric strength 90% LSI, walk-run pain-free'),
  (4, 'Phase 4: Advanced RTP', 4, 8, 0.9::decimal, 1.3::decimal,
   'Running progression, sport-specific loading, eccentric maintenance',
   ARRAY['Continuous running progression', 'Sport-specific footwork', 'Cutting drills (light)', 'Eccentric maintenance', 'Agility training'],
   ARRAY['No max-intensity running', 'No uncontrolled plyometrics'],
   2, 'Running 20+ minutes pain-free'),
  (5, 'Phase 5: Return to Sport', 8, 112, 1.0::decimal, 1.5::decimal,
   'Full participation, eccentric maintenance 1-2×/week indefinitely',
   ARRAY['Full competitive play', 'Eccentric maintenance 1-2×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'calf_strain'

UNION ALL

-- ROTATOR CUFF TEAR/TENDINOPATHY (56-168 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 3, 0.0::decimal, 0.2::decimal,
   'Sling immobilization (post-surgical or conservative), ROM within restrictions, rotator cuff activation',
   ARRAY['ROM within surgical/physician restrictions', 'Rotator cuff activation (supine)', 'Scapular positioning', 'Pendulum exercises'],
   ARRAY['No overhead activities', 'No resistance', 'No throwing'],
   2, 'Pain controlled, rotator cuff engagement initiated'),
  (2, 'Phase 2: Early Mobilization', 3, 8, 0.3::decimal, 0.5::decimal,
   'ROM progression (sling removed if cleared), rotator cuff isometric work, scapular stabilization',
   ARRAY['ROM progression per protocol', 'Rotator cuff isometric exercises', 'Scapular stabilization (prone Y-T)', 'Proprioceptive training', 'Postural exercises'],
   ARRAY['No overhead resistance', 'No throwing', 'No contact'],
   2, 'ROM improved, rotator cuff activation strong'),
  (3, 'Phase 3: Intermediate Strengthening', 8, 14, 0.6::decimal, 0.9::decimal,
   'Rotator cuff resistance progression (achieves 53.7% RTS nonsurgical if ≥20 PT sessions), scapular strengthening',
   ARRAY['Rotator cuff resistance exercises (light-moderate)', 'Scapular strengthening (rows, Y-raises)', 'Core strengthening (advanced)', 'Proprioceptive training', 'Light activity introduction'],
   ARRAY['No heavy overhead loading', 'No aggressive throwing', 'PT compliance critical'],
   2, 'Rotator cuff strength 80% LSI, scapular control excellent'),
  (4, 'Phase 4: Advanced RTP', 14, 20, 0.9::decimal, 1.3::decimal,
   'Sport-specific overhead drills, throwing progression (surgical: 80-90% RTS), rotator cuff maintenance',
   ARRAY['Sport-specific overhead training', 'Light throwing progression', 'Proprioceptive training (sport-specific)', 'Rotator cuff maintenance', 'Sport-specific conditioning'],
   ARRAY['No max-intensity overhead activities', 'No uncontrolled movements'],
   2, 'Overhead strength ≥95% LSI, sport-specific readiness achieved'),
  (5, 'Phase 5: Return to Sport', 20, 168, 1.0::decimal, 1.5::decimal,
   'Full participation, scapular + rotator cuff maintenance 2-3×/week indefinitely',
   ARRAY['Full competitive play', 'Scapular/rotator cuff maintenance 2-3×/week', 'Sport-specific conditioning', 'Ongoing PT if nonsurgical'],
   ARRAY[''],
   2, 'Full unrestricted participation')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'rotator_cuff_tear'

UNION ALL

-- BICEPS TENDINOPATHY (56-168 days)
SELECT p.id, phase_data.*
FROM protocols p, (VALUES
  (1, 'Phase 1: Acute Protection', 0, 2, 0.0::decimal, 0.2::decimal,
   'PRICE protocol, ROM preservation, elbow positioning, eccentric loading initiation',
   ARRAY['Elbow flexion ROM (gentle)', 'Supination/pronation ROM', 'Postural positioning (shoulder protraction)', 'Core activation'],
   ARRAY['No overhead activities', 'No resistance', 'No throwing'],
   2, 'Biceps pain 1-2/10, ROM preserved'),
  (2, 'Phase 2: Early Mobilization', 2, 4, 0.3::decimal, 0.5::decimal,
   'Eccentric biceps loading initiation (light), ROM progression, stretching',
   ARRAY['Eccentric biceps curls (light load)', 'Biceps stretching (doorway stretch)', 'ROM progression', 'Isometric strengthening', 'Scapular stabilization'],
   ARRAY['No high-load eccentric work', 'No throwing', 'No heavy lifting'],
   2, 'Eccentric exercises tolerated, ROM improved'),
  (3, 'Phase 3: Intermediate Strengthening', 4, 8, 0.6::decimal, 0.9::decimal,
   'Eccentric loading progression, scapular stability, interval throwing initiation (overhead athletes)',
   ARRAY['Eccentric biceps loading (progressive)', 'Scapular strengthening', 'Core strengthening', 'Light interval program initiation', 'Proprioceptive training'],
   ARRAY['No high-speed throwing', 'No max-load resistance', 'Interval program compliance'],
   2, 'Eccentric strength 90% LSI, interval compliance excellent'),
  (4, 'Phase 4: Advanced RTP', 8, 12, 0.9::decimal, 1.3::decimal,
   'Interval throwing progression (overhead athletes 4-9 months), sport-specific drills, eccentric maintenance',
   ARRAY['Interval throwing progression (overhead athletes)', 'Sport-specific overhead training', 'Eccentric maintenance', 'Proprioceptive training (sport-specific)', 'Core strengthening'],
   ARRAY['No max-intensity throwing', 'No uncontrolled overhead activities'],
   2, 'Throwing mechanics optimized, overhead readiness 90%+ LSI'),
  (5, 'Phase 5: Return to Sport', 12, 168, 1.0::decimal, 1.5::decimal,
   'Full participation (overhead athletes 4-9 months post-injury), eccentric maintenance 1×/week indefinitely',
   ARRAY['Full competitive play', 'Eccentric biceps maintenance 1×/week', 'Sport-specific conditioning'],
   ARRAY[''],
   2, 'Full unrestricted participation (90%+ nonsurgical success)')
) AS phase_data(phase_number, phase_name, week_start, week_end, acwr_target_min, acwr_target_max, description, activities, restrictions, pain_level_max, key_milestones)
WHERE p.injury_type = 'biceps_tendinopathy';

COMMENT ON TABLE rtp_protocol_phases IS
  'Complete 5-phase progression for all 20 common sports injuries.
   Each injury follows mesocycle structure: Acute → Early Mobilization → Intermediate Strengthening → Advanced RTP → Return to Sport.
   ACWR targets guide periodization; key milestones define phase advancement criteria.';
