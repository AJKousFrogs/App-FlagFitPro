-- Phase 1D: Seed RTP Functional Criteria for 20 Common Sports Injuries
-- Evidence-based criteria for phase advancement (strength, functional tests, psychological readiness, pain, ROM)

WITH protocols AS (
  SELECT id, injury_type FROM rtp_protocol_definitions
)

INSERT INTO rtp_functional_criteria (
  protocol_id, criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required
)

-- LATERAL ANKLE SPRAIN (5 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Peroneal Strength (Eversion)', 'strength', '≥80% LSI', 'Isokinetic dynamometer (eversion torque)', '80', 3),
  ('Plantarflexor Strength', 'strength', '≥90% LSI', 'Isokinetic dynamometer (plantarflexion)', '90', 3),
  ('Modified SEBT (Anterior)', 'functional_test', '≥90% LSI', 'Star Excursion Balance Test', '90', 3),
  ('Y-Balance Test', 'functional_test', '≥90% LSI', 'Y-Balance Test (composite score)', '90', 4),
  ('Pain-Free Figure-8 Running', 'pain', 'Pain-free at sport-specific speed', 'Symptom observation during sport-specific drill', 'Pain ≤1/10', 4)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'lateral_ankle_sprain'

UNION ALL

-- HAMSTRING STRAIN (6 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Hamstring Strength (Isokinetic)', 'strength', '≥90% LSI', 'Isokinetic dynamometer (hip extension)', '90', 3),
  ('Nordic Hamstring Curl Strength', 'strength', '≥80% LSI at Phase 3, ≥95% at Phase 5', 'Eccentric testing / manual assessment', '80', 3),
  ('Hip Extension ROM', 'range_of_motion', 'Full ROM pain-free', 'Goniometer measurement (supine)', 'Full ROM', 2),
  ('Sprint Speed Test (0-10m)', 'functional_test', '≥95% LSI', 'Timed sprint or force plate', '95', 4),
  ('Pain-Free Kicking Mechanics', 'pain', 'Pain-free at sport-specific speed', 'Simulated sport kicking assessment', 'Pain ≤1/10', 4),
  ('Psychological Readiness to RTP', 'psychological', 'ACL-RSI ≥56 (adapted)', 'ACL-RSI or sport-specific readiness questionnaire', '56', 5)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'hamstring_strain'

UNION ALL

-- PATELLAR TENDINOPATHY (6 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Quadriceps Strength', 'strength', '≥90% LSI', 'Isokinetic dynamometer (knee extension)', '90', 3),
  ('Eccentric Quadriceps Loading Tolerance', 'strength', 'Step-down load ≥75% BW per leg', 'Resistance step-down or eccentric leg press', '75', 3),
  ('Double-Leg Hop Test', 'functional_test', '≥90% LSI', 'Hop distance or single-leg hop time', '90', 4),
  ('Single-Leg Hop for Distance', 'functional_test', '≥90% LSI', 'Single-leg hop distance measurement', '90', 4),
  ('Pain-Free Landing Control', 'pain', 'Pain-free during plyometric landing', 'Controlled landing assessment from 30cm box', 'Pain ≤1/10', 4),
  ('Sport-Specific Jumping Tolerance', 'functional_test', 'Sport-specific jumping at competition intensity', 'Sport-specific plyometric test (CMJ, broad jump)', 'CMJ ≥95% LSI', 5)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'patellar_tendinopathy'

UNION ALL

-- MEDIAL TIBIAL STRESS SYNDROME (5 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Tibialis Posterior Strength', 'strength', '≥90% LSI', 'Isokinetic dynamometer (foot inversion)', '90', 2),
  ('Calf Strength (Plantarflexion)', 'strength', '≥90% LSI', 'Isokinetic dynamometer or heel raise test', '90', 3),
  ('Single-Leg Hop Test', 'functional_test', '≥90% LSI', 'Single-leg hop for distance', '90', 3),
  ('Pain-Free Continuous Running', 'pain', 'Pain-free running 30+ minutes', 'Timed running test or symptom log', 'Pain ≤1/10 during/after 30 min run', 4),
  ('Sport-Specific Running Tolerance', 'functional_test', 'Sport-specific running pace and duration', 'Sport simulation test or interval running', 'Sport pace ≥95% LSI', 5)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'medial_tibial_stress_syndrome'

UNION ALL

-- ACHILLES TENDINOPATHY/RUPTURE (6 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Plantarflexor Strength (Isokinetic)', 'strength', '≥90% LSI', 'Isokinetic dynamometer (plantarflexion)', '90', 3),
  ('Eccentric Calf Strength', 'strength', '≥90% LSI', 'Eccentric calf raise load capacity', '90', 3),
  ('Dorsiflexor Strength', 'strength', '≥90% LSI', 'Isokinetic dynamometer (dorsiflexion)', '90', 3),
  ('Single-Leg Hop Test', 'functional_test', '≥90% LSI', 'Single-leg hop for distance', '90', 4),
  ('Pain-Free Walking Distance', 'pain', 'Pain-free walking ≥2 km', 'Timed/distance walking test', 'Pain ≤1/10 at 2 km', 2),
  ('Single-Leg Calf Raise Reps', 'functional_test', '≥15 reps at 90% LSI', 'Single-leg calf raise repetition test', '15', 4)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'achilles_tendinopathy'

UNION ALL

-- ADDUCTOR/GROIN STRAIN (6 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Hip Adduction Strength', 'strength', '≥90% LSI', 'Isokinetic dynamometer (hip adduction)', '90', 3),
  ('Copenhagen Device Tolerance', 'strength', 'Light load pain-free progression to ≥10 kg', 'Copenhagen adductor test device', '10', 2),
  ('Eccentric Hip Adduction Load', 'strength', 'Eccentric load ≥80% of concentric', 'Eccentric adduction testing', '80', 3),
  ('Adductor Oriented Strengthening (AOS) Compliance', 'functional_test', '≥90% session adherence + pain reduction ≥35.6%', 'AOS exercise protocol log + pain scale', '35.6', 3),
  ('Single-Leg Balance (Groin-Engaged)', 'functional_test', 'Single-leg stance ≥30 sec with adductor tension', 'Adductor-engaged single-leg stance test', '30', 3),
  ('Sport-Specific Cutting Tolerance', 'pain', 'Pain-free at sport-specific cutting intensity', 'Sport-specific lateral movement drill', 'Pain ≤1/10', 4)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'adductor_groin_strain'

UNION ALL

-- MENISCUS TEAR (6 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Quadriceps Strength', 'strength', '≥90% LSI', 'Isokinetic dynamometer (knee extension)', '90', 3),
  ('Hamstring Strength', 'strength', '≥90% LSI', 'Isokinetic dynamometer (knee flexion)', '90', 3),
  ('Knee ROM Control (Repair)', 'range_of_motion', 'Surgeon-approved ROM achieved pain-free', 'Goniometer measurement + pain assessment', 'Surgeon approval', 2),
  ('Double-Leg Hop Test', 'functional_test', '≥90% LSI', 'Hop distance measurement', '90', 4),
  ('Single-Leg Hop for Distance', 'functional_test', '≥90% LSI', 'Single-leg hop distance', '90', 4),
  ('Closed-Chain Exercise Tolerance (Mini-Squat)', 'functional_test', 'Pain-free mini-squat ≥15 reps', 'Supervised mini-squat test', '15', 3)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'meniscus_tear'

UNION ALL

-- IT BAND SYNDROME (5 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Hip Abductor Strength', 'strength', '≥95% LSI', 'Isokinetic dynamometer (hip abduction)', '95', 3),
  ('Single-Leg Stance Balance', 'functional_test', 'Single-leg stance ≥30 sec on firm surface', 'Timed single-leg balance test', '30', 2),
  ('Modified SEBT (Frontal Plane)', 'functional_test', '≥95% LSI', 'Star Excursion Balance Test (medial reaches)', '95', 3),
  ('Pain-Free Continuous Running', 'pain', 'Pain-free running 30+ minutes', 'Timed distance running test', 'Pain ≤1/10 at 30 min', 4),
  ('Gait Mechanics Assessment', 'functional_test', 'Normalized hip abduction during gait', 'Video gait analysis or therapist assessment', 'Normal gait', 3)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'it_band_syndrome'

UNION ALL

-- PLANTAR FASCIITIS (5 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Calf Flexibility (Ankle ROM)', 'range_of_motion', 'Dorsiflexion ≥10° (weight-bearing)', 'Lunge test or weight-bearing dorsiflexion', '10', 2),
  ('Eccentric Calf Strength', 'strength', '≥95% LSI', 'Eccentric calf raise load capacity', '95', 3),
  ('Plantar Fascia Stretch Tolerance', 'pain', 'Sustained stretch 60 sec pain-free', 'Towel curl or plantar stretch hold test', '60', 2),
  ('Pain-Free Standing Duration', 'pain', 'Pain-free standing ≥2 hours', 'Timed standing test or activity log', 'Pain ≤1/10 after 2 hours standing', 3),
  ('Gait Assessment (Heel Strike)', 'functional_test', 'Normalized heel strike pattern', 'Video gait analysis or therapist assessment', 'Normal gait', 3)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'plantar_fasciitis'

UNION ALL

-- STRESS FRACTURES (6 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Bone Healing Status', 'range_of_motion', 'Imaging confirmation (CT/MRI)', 'Physician imaging assessment', 'Imaging clearance', 1),
  ('Weight-Bearing Progression', 'functional_test', 'Full pain-free weight-bearing achieved', 'Clinical assessment + pain log', 'Pain ≤1/10 on foot', 2),
  ('Lower Limb Strength Asymmetry', 'strength', '≥90% LSI', 'Isokinetic testing (injured limb muscles)', '90', 3),
  ('Pain-Free Walking Distance', 'pain', 'Pain-free walking 1-2 km', 'Timed distance test', 'Pain ≤1/10 at 2 km', 2),
  ('Pain-Free Running Initiation', 'pain', 'Pain-free light jogging 15-20 min', 'Timed running test + symptom log', 'Pain ≤1/10 during 20 min jog', 4),
  ('Sport-Specific Loading Tolerance', 'functional_test', 'Sport-specific movement patterns pain-free', 'Sport simulation or interval program', 'Sport pace ≥95% LSI', 5)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'stress_fracture'

UNION ALL

-- MCL INJURY (5 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Valgus Stress Resistance', 'strength', '≥90% LSI', 'Isokinetic dynamometer (valgus/varus resistance)', '90', 3),
  ('Single-Leg Balance', 'functional_test', 'Single-leg stance ≥30 sec on firm surface', 'Timed single-leg balance test', '30', 2),
  ('Dynamic Proprioceptive Control', 'functional_test', 'Modified SEBT ≥90% LSI', 'Star Excursion Balance Test', '90', 3),
  ('Sport-Specific Cutting', 'functional_test', 'Pain-free cutting at sport-specific intensity', 'Controlled 45° cutting drill', 'Pain ≤1/10', 4),
  ('Knee ROM Control', 'range_of_motion', 'Full ROM pain-free (extension/flexion)', 'Goniometer measurement', 'Full ROM', 2)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'mcl_injury'

UNION ALL

-- HIP FLEXOR STRAIN (5 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Hip Flexor Strength (Isokinetic)', 'strength', '≥90% LSI', 'Isokinetic dynamometer (hip flexion)', '90', 2),
  ('Eccentric Hip Flexion Load', 'strength', '≥80% of concentric capacity', 'Eccentric hip flexion testing', '80', 2),
  ('Hip Flexor ROM', 'range_of_motion', 'Full flexion and extension ROM', 'Supine hip ROM measurement', 'Full ROM', 2),
  ('Kicking Mechanics Assessment', 'functional_test', 'Sport-specific kicking technique normalized', 'Video kicking analysis or therapist assessment', 'Normal mechanics', 3),
  ('Sport-Specific Kicking Speed', 'functional_test', '≥95% LSI kick velocity', 'Radar gun or biomechanical assessment', '95', 4)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'hip_flexor_strain'

UNION ALL

-- HIP LABRAL TEAR (6 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Hip Stability (Isokinetic)', 'strength', '≥90% LSI', 'Isokinetic hip abduction/adduction', '90', 3),
  ('Core Stability (Plank Test)', 'functional_test', 'Prone plank ≥90 sec with neutral spine', 'Timed prone plank hold', '90', 2),
  ('Single-Leg Stance Balance', 'functional_test', 'Single-leg stance ≥45 sec eyes open', 'Timed single-leg balance test', '45', 2),
  ('Hip ROM Control (Non-Painful)', 'range_of_motion', 'ROM within surgical restrictions, pain-free', 'Passive/active ROM goniometer + pain assessment', 'Surgeon approval', 3),
  ('Proprioceptive Training Proficiency', 'functional_test', 'Modified SEBT ≥95% LSI', 'Star Excursion Balance Test', '95', 3),
  ('Sport-Specific Loading Tolerance', 'functional_test', 'Sport-specific movement patterns pain-free', 'Sport simulation test or agility drill', 'Sport pace ≥95% LSI', 4)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'hip_labral_tear'

UNION ALL

-- SHOULDER INSTABILITY/DISLOCATION (6 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Rotator Cuff Strength (Isokinetic)', 'strength', '≥90% LSI', 'Isokinetic dynamometer (internal/external rotation)', '90', 3),
  ('Scapular Stability Test', 'functional_test', 'Prone Y-T raises ≥90% LSI', 'Scapular muscle strength assessment', '90', 2),
  ('Proprioceptive Training Proficiency', 'functional_test', 'Advanced proprioceptive exercises ≥85% competency', 'Therapist-rated proprioceptive skill assessment', '85', 3),
  ('Overhead ROM Control', 'range_of_motion', 'Overhead reach pain-free through full ROM', 'Overhead motion assessment + pain log', 'Pain ≤1/10', 3),
  ('Interval Overhead Program Progress', 'functional_test', '100% compliance with phase-specific program', 'Interval overhead program log (overhead athletes)', '100', 4),
  ('Psychological Readiness (Confidence)', 'psychological', 'Sport-Confidence Scale ≥80% or ACL-RSI ≥56', 'Psychological readiness questionnaire', '80', 5)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'shoulder_instability'

UNION ALL

-- SHOULDER LABRAL TEAR (6 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Rotator Cuff Strength (Isokinetic)', 'strength', '≥90% LSI', 'Isokinetic dynamometer (internal/external rotation)', '90', 3),
  ('Annual Strength Testing ≥90% LSI', 'strength', 'Isokinetic testing maintains ≥90% LSI annually', 'Annual isokinetic assessment', '90', 5),
  ('Scapular Stability', 'functional_test', 'Prone Y-T raises ≥95% LSI', 'Scapular muscle strength assessment', '95', 2),
  ('Overhead ROM Control', 'range_of_motion', 'Overhead reach pain-free through full ROM', 'Overhead motion assessment + pain log', 'Pain ≤1/10', 3),
  ('Interval Throwing Program Progress (Overhead Athletes)', 'functional_test', '100% compliance with phase-specific throwing protocol', 'Interval throwing program log', '100', 4),
  ('Psychological Readiness (Confidence)', 'psychological', 'Sport-Confidence Scale ≥85% or ACL-RSI ≥60', 'Psychological readiness questionnaire', '85', 5)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'shoulder_labral_tear'

UNION ALL

-- LATERAL EPICONDYLITIS (5 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Wrist Extension Strength (Isokinetic)', 'strength', '≥95% LSI', 'Isokinetic dynamometer (wrist extension)', '95', 3),
  ('Eccentric Wrist Extension Load', 'strength', 'Eccentric load ≥75% of concentric (critical: 1×/week maintenance)', 'Eccentric wrist extension testing', '75', 2),
  ('Grip Strength (Functional)', 'strength', '≥95% LSI', 'Hand dynamometer measurement', '95', 3),
  ('Racquet Technique Assessment', 'functional_test', 'Sport-specific technique normalized (no pain)', 'Video analysis or therapist observation', 'Normal technique', 4),
  ('Pain-Free Gripping at Sport Intensity', 'pain', 'Pain-free gripping at competition intensity', 'Simulated racquet play or grip strength endurance test', 'Pain ≤1/10 after 30 min play', 4)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'lateral_epicondylitis'

UNION ALL

-- ACL RUPTURE/RECONSTRUCTION (5 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Quadriceps/Hamstring Strength ≥90%', 'strength', '≥90% LSI bilateral symmetry', 'Isokinetic dynamometer (bilateral knee extension/flexion)', '90', 4),
  ('Hop Test Battery (4 tests)', 'functional_test', '≥90% LSI composite score', 'Single-hop, triple-hop, crossover hop, 6-meter timed hop', '90', 4),
  ('ACL-RSI (Psychological Readiness)', 'psychological', 'ACL-RSI ≥56', 'ACL Return to Sport after Injury Scale questionnaire', '56', 4),
  ('Isokinetic Testing (Quarterly Post-RTP)', 'strength', 'Maintain ≥90% LSI (quarterly surveillance)', 'Isokinetic dynamometer quarterly testing', '90', 5),
  ('Psychological Readiness Assessment', 'psychological', 'Sport-specific confidence ≥85%', 'Psychological readiness + confidence assessment', '85', 5)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'acl_rupture'

UNION ALL

-- CALF STRAIN (6 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Calf Strength (Isokinetic)', 'strength', '≥90% LSI', 'Isokinetic dynamometer (plantarflexion)', '90', 3),
  ('Plantarflexor Strength (Single-Leg Calf Raise)', 'strength', '≥90% LSI (≥15 reps)', 'Single-leg calf raise test', '15', 3),
  ('Eccentric Calf Load Tolerance', 'strength', '≥85% of concentric capacity', 'Eccentric calf raise testing', '85', 2),
  ('Single-Leg Hop Test', 'functional_test', '≥90% LSI', 'Single-leg hop for distance', '90', 4),
  ('Pain-Free Sprint Test (0-20m)', 'functional_test', '≥95% LSI sprint speed', 'Timed sprint or force plate measurement', '95', 4),
  ('Sport-Specific Running Tolerance', 'pain', 'Sport-specific running pain-free', 'Timed running test or sport simulation', 'Pain ≤1/10', 5)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'calf_strain'

UNION ALL

-- ROTATOR CUFF TEAR/TENDINOPATHY (6 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Rotator Cuff Strength (Isokinetic)', 'strength', '≥90% LSI', 'Isokinetic dynamometer (internal/external rotation)', '90', 3),
  ('Scapular Stability', 'functional_test', 'Prone Y-T raises ≥95% LSI', 'Scapular muscle strength assessment', '95', 2),
  ('PT Session Compliance (≥20 sessions for nonsurgical)', 'functional_test', '≥20 PT sessions completed (nonsurgical)', 'PT attendance log (achieves 53.7% RTS nonsurgical)', '20', 3),
  ('Overhead ROM Control', 'range_of_motion', 'Overhead reach pain-free through full ROM', 'Overhead motion assessment + pain log', 'Pain ≤1/10', 3),
  ('Proprioceptive Training Progress', 'functional_test', 'Advanced proprioceptive exercises ≥90% competency', 'Therapist-rated proprioceptive skill assessment', '90', 3),
  ('Sport-Specific Overhead Tolerance', 'functional_test', 'Sport-specific overhead activities pain-free (80-90% RTS surgical)', 'Sport simulation test or overhead activity assessment', 'Sport overhead ≥95% LSI', 4)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'rotator_cuff_tear'

UNION ALL

-- BICEPS TENDINOPATHY (6 criteria)
SELECT p.id, criterion_data.*
FROM protocols p, (VALUES
  ('Biceps Strength (Isokinetic)', 'strength', '≥90% LSI', 'Isokinetic dynamometer (elbow flexion)', '90', 2),
  ('Eccentric Biceps Load Tolerance', 'strength', '≥80% of concentric capacity', 'Eccentric biceps curl testing', '80', 2),
  ('Supination/Pronation ROM', 'range_of_motion', 'Full ROM pain-free', 'Goniometer measurement of forearm rotation', 'Full ROM', 2),
  ('Interval Throwing Program Compliance (Overhead Athletes)', 'functional_test', '100% compliance with phase-specific throwing protocol', 'Interval throwing program log (overhead athletes)', '100', 3),
  ('Overhead Range Control', 'range_of_motion', 'Pain-free overhead reach through full ROM', 'Overhead motion assessment + pain log', 'Pain ≤1/10', 3),
  ('Sport-Specific Overhead Tolerance (90%+ Nonsurgical Success)', 'functional_test', 'Sport-specific overhead activities pain-free (4-9 months overhead athletes)', 'Sport simulation or overhead activity assessment', 'Sport overhead ≥95% LSI', 5)
) AS criterion_data(criteria_name, criteria_type, target_value, measurement_method, pass_threshold, phase_required)
WHERE p.injury_type = 'biceps_tendinopathy';

COMMENT ON TABLE rtp_functional_criteria IS
  'Evidence-based functional criteria for all 20 injury protocols.
   5-7 criteria per injury covering strength (LSI %), functional tests, psychological readiness, pain, and ROM.
   Criteria-based RTP replaces time-based advancement: "3 months post-injury" → "90% strength + hop tests + psychological readiness".
   Each criterion specifies phase_required (minimum phase for this test to apply) for staged advancement.';
