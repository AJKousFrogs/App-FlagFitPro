-- Seed template-backed QB and WR/DB annual training catalogs.
-- This uses the app's current model:
--   training_programs -> training_phases -> training_weeks -> training_session_templates
-- and links exercises through session_exercises.session_template_id.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.training_programs
    WHERE id = '11111111-1111-1111-1111-111111111111'::uuid
  ) THEN
    RAISE EXCEPTION 'QB training program must exist before seeding templates';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.training_programs
    WHERE id = '22222222-2222-2222-2222-222222222222'::uuid
  ) THEN
    RAISE EXCEPTION 'WR/DB training program must exist before seeding templates';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Program phases
-- -----------------------------------------------------------------------------
INSERT INTO public.training_phases (
  id,
  program_id,
  name,
  description,
  start_date,
  end_date,
  phase_order,
  focus_areas
)
VALUES
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Pre-Season Preparation',
    'Return to structured training after the off-season with careful throwing reintroduction and base conditioning.',
    DATE '2025-11-01',
    DATE '2025-11-30',
    0,
    ARRAY['Movement Re-patterning', 'Return to Throwing', 'Base Conditioning', 'Skill Refresh']
  ),
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Foundation',
    'Build movement quality, core strength, and early throwing mechanics with controlled load progressions.',
    DATE '2025-12-01',
    DATE '2025-12-31',
    1,
    ARRAY['Movement Quality', 'Core Strength', 'Throwing Mechanics', 'Base Conditioning']
  ),
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Power',
    'Develop explosive force production while gradually increasing weekly throwing volume.',
    DATE '2026-01-01',
    DATE '2026-02-28',
    2,
    ARRAY['Power Development', 'Explosive Movements', 'Gradual Volume Build', 'Speed Work']
  ),
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Explosive',
    'Convert accumulated strength into maximum speed and game-specific quarterback power.',
    DATE '2026-03-01',
    DATE '2026-03-31',
    3,
    ARRAY['Explosive Power', 'Maximum Speed', 'Game Simulation', 'Final Volume Push']
  ),
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Tournament Maintenance',
    'Maintain peak throwing volume and power outputs through the competitive season.',
    DATE '2026-04-01',
    DATE '2026-06-30',
    4,
    ARRAY['Performance Maintenance', 'Recovery', 'Game Readiness', 'Injury Prevention']
  ),
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Active Recovery',
    'Reduce intensity, restore movement quality, and keep a low but consistent throwing dose.',
    DATE '2026-07-01',
    DATE '2026-08-31',
    5,
    ARRAY['Recovery', 'Mobility', 'Light Activity', 'Mental Refresh']
  ),
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Off-Season Preparation',
    'Rebuild the base for the next annual cycle with controlled strength and throwing increases.',
    DATE '2026-09-01',
    DATE '2026-10-31',
    6,
    ARRAY['Movement Re-patterning', 'Volume Build', 'Strength Return', 'Skill Refinement']
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Foundation',
    'Develop movement quality, deceleration skill, and single-leg stability for receivers and defensive backs.',
    DATE '2025-12-01',
    DATE '2025-12-31',
    1,
    ARRAY['Movement Quality', 'Hip Mobility', 'Deceleration', 'Single-Leg Stability', 'Base Conditioning']
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Speed Development',
    'Emphasize acceleration, top-end speed, and sprint mechanics for offensive and defensive skill players.',
    DATE '2026-01-01',
    DATE '2026-02-28',
    2,
    ARRAY['Acceleration', 'Top-End Speed', 'Sprint Mechanics', 'Resisted Sprints', 'Flying Sprints']
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Agility & Reactive',
    'Peak change-of-direction and reaction work with route-running and coverage emphasis.',
    DATE '2026-03-01',
    DATE '2026-03-31',
    3,
    ARRAY['Change of Direction', 'Reactive Agility', 'Route Running', 'Coverage Patterns', 'Ball Skills']
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Tournament Maintenance',
    'Maintain speed and agility while prioritizing recovery during competition blocks.',
    DATE '2026-04-01',
    DATE '2026-06-30',
    4,
    ARRAY['Performance Maintenance', 'Recovery', 'Game Readiness', 'Injury Prevention']
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Active Recovery',
    'Regenerate after competition with lighter mobility, tempo running, and restoration work.',
    DATE '2026-07-01',
    DATE '2026-08-31',
    5,
    ARRAY['Recovery', 'Mobility', 'Cross-Training', 'Mental Refresh']
  ),
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Pre-Season Preparation',
    'Re-establish movement patterns and rebuild speed before the next competition cycle.',
    DATE '2026-09-01',
    DATE '2026-10-31',
    6,
    ARRAY['Movement Re-patterning', 'Speed Return', 'Agility Rebuild', 'Skill Refinement']
  )
ON CONFLICT (program_id, phase_order) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  focus_areas = EXCLUDED.focus_areas,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 2. Program weeks
-- -----------------------------------------------------------------------------
WITH qb_phase_ids AS (
  SELECT phase_order, id
  FROM public.training_phases
  WHERE program_id = '11111111-1111-1111-1111-111111111111'::uuid
), qb_weeks AS (
  SELECT *
  FROM (
    VALUES
      (0, 1, DATE '2025-11-01', DATE '2025-11-07', 0.00::numeric, 0.50::numeric, 'Return to throwing - 50 throws'),
      (0, 2, DATE '2025-11-08', DATE '2025-11-14', 0.00::numeric, 0.60::numeric, 'Gradual increase - 60 throws'),
      (0, 3, DATE '2025-11-15', DATE '2025-11-21', 0.00::numeric, 0.70::numeric, 'Building comfort - 70 throws'),
      (0, 4, DATE '2025-11-22', DATE '2025-11-30', 0.00::numeric, 0.80::numeric, 'End of month - 80 throws'),
      (1, 1, DATE '2025-12-01', DATE '2025-12-07', 20.00::numeric, 0.80::numeric, 'Foundation Week 1 - 80 throws, 20% BW'),
      (1, 2, DATE '2025-12-08', DATE '2025-12-14', 20.00::numeric, 0.95::numeric, 'Foundation Week 2 - 95 throws, 20% BW'),
      (1, 3, DATE '2025-12-15', DATE '2025-12-21', 30.00::numeric, 1.10::numeric, 'Foundation Week 3 - 110 throws, 30% BW'),
      (1, 4, DATE '2025-12-22', DATE '2025-12-31', 40.00::numeric, 1.20::numeric, 'Foundation Week 4 - 120 throws, 40% BW'),
      (2, 1, DATE '2026-01-01', DATE '2026-01-07', 30.00::numeric, 1.20::numeric, 'Power Week 1 - 120 throws'),
      (2, 2, DATE '2026-01-08', DATE '2026-01-14', 30.00::numeric, 1.30::numeric, 'Power Week 2 - 130 throws'),
      (2, 3, DATE '2026-01-15', DATE '2026-01-21', 35.00::numeric, 1.40::numeric, 'Power Week 3 - 140 throws'),
      (2, 4, DATE '2026-01-22', DATE '2026-01-31', 35.00::numeric, 1.55::numeric, 'Power Week 4 - 155 throws'),
      (2, 5, DATE '2026-02-01', DATE '2026-02-07', 35.00::numeric, 1.70::numeric, 'Power Week 5 - 170 throws'),
      (2, 6, DATE '2026-02-08', DATE '2026-02-14', 35.00::numeric, 1.90::numeric, 'Power Week 6 - 190 throws'),
      (2, 7, DATE '2026-02-15', DATE '2026-02-21', 40.00::numeric, 2.10::numeric, 'Power Week 7 - 210 throws'),
      (2, 8, DATE '2026-02-22', DATE '2026-02-28', 40.00::numeric, 2.30::numeric, 'Power Week 8 - 230 throws'),
      (3, 1, DATE '2026-03-01', DATE '2026-03-07', 40.00::numeric, 2.50::numeric, 'Explosive Week 1 - 250 throws'),
      (3, 2, DATE '2026-03-08', DATE '2026-03-14', 40.00::numeric, 2.70::numeric, 'Explosive Week 2 - 270 throws'),
      (3, 3, DATE '2026-03-15', DATE '2026-03-21', 40.00::numeric, 2.90::numeric, 'Explosive Week 3 - 290 throws'),
      (3, 4, DATE '2026-03-22', DATE '2026-03-31', 40.00::numeric, 3.10::numeric, 'Explosive Week 4 - 310 throws'),
      (4, 1, DATE '2026-04-01', DATE '2026-04-07', 30.00::numeric, 3.15::numeric, 'Tournament Week 1 - 315 throws'),
      (4, 2, DATE '2026-04-08', DATE '2026-04-14', 30.00::numeric, 3.20::numeric, 'Tournament Week 2 - 320 throws'),
      (4, 3, DATE '2026-04-15', DATE '2026-04-21', 30.00::numeric, 3.20::numeric, 'Tournament Week 3 - Maintain peak volume'),
      (4, 4, DATE '2026-04-22', DATE '2026-04-30', 30.00::numeric, 3.20::numeric, 'Tournament Week 4 - Maintain peak volume'),
      (4, 5, DATE '2026-05-01', DATE '2026-05-07', 30.00::numeric, 3.20::numeric, 'Tournament Week 5 - Maintain peak volume'),
      (4, 6, DATE '2026-05-08', DATE '2026-05-14', 30.00::numeric, 3.20::numeric, 'Tournament Week 6 - Maintain peak volume'),
      (4, 7, DATE '2026-05-15', DATE '2026-05-21', 30.00::numeric, 3.20::numeric, 'Tournament Week 7 - Maintain peak volume'),
      (4, 8, DATE '2026-05-22', DATE '2026-05-31', 30.00::numeric, 3.20::numeric, 'Tournament Week 8 - Maintain peak volume'),
      (4, 9, DATE '2026-06-01', DATE '2026-06-07', 30.00::numeric, 3.20::numeric, 'Tournament Week 9 - Maintain peak volume'),
      (4, 10, DATE '2026-06-08', DATE '2026-06-14', 30.00::numeric, 3.20::numeric, 'Tournament Week 10 - Maintain peak volume'),
      (4, 11, DATE '2026-06-15', DATE '2026-06-21', 30.00::numeric, 3.20::numeric, 'Tournament Week 11 - Maintain peak volume'),
      (4, 12, DATE '2026-06-22', DATE '2026-06-30', 30.00::numeric, 3.20::numeric, 'Tournament Week 12 - Season end maintenance')
  ) AS rows(phase_order, week_number, start_date, end_date, load_percentage, volume_multiplier, focus)
)
INSERT INTO public.training_weeks (
  id,
  phase_id,
  week_number,
  start_date,
  end_date,
  load_percentage,
  volume_multiplier,
  focus
)
SELECT
  gen_random_uuid(),
  p.id,
  w.week_number,
  w.start_date,
  w.end_date,
  w.load_percentage,
  w.volume_multiplier,
  w.focus
FROM qb_weeks w
JOIN qb_phase_ids p USING (phase_order)
ON CONFLICT (phase_id, week_number) DO UPDATE
SET
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  load_percentage = EXCLUDED.load_percentage,
  volume_multiplier = EXCLUDED.volume_multiplier,
  focus = EXCLUDED.focus,
  updated_at = now();

WITH wrdb_phases AS (
  SELECT id, phase_order, name, start_date, end_date
  FROM public.training_phases
  WHERE program_id = '22222222-2222-2222-2222-222222222222'::uuid
), generated_weeks AS (
  SELECT
    p.id AS phase_id,
    p.phase_order,
    p.name AS phase_name,
    gs::date AS week_start,
    LEAST(p.end_date, (gs::date + 6)) AS week_end,
    row_number() OVER (PARTITION BY p.id ORDER BY gs) AS week_number
  FROM wrdb_phases p
  CROSS JOIN LATERAL generate_series(
    p.start_date::timestamp,
    p.end_date::timestamp,
    interval '7 day'
  ) AS gs
)
INSERT INTO public.training_weeks (
  id,
  phase_id,
  week_number,
  start_date,
  end_date,
  load_percentage,
  volume_multiplier,
  focus
)
SELECT
  gen_random_uuid(),
  phase_id,
  week_number,
  week_start,
  week_end,
  CASE phase_order
    WHEN 1 THEN CASE week_number WHEN 1 THEN 60 WHEN 2 THEN 65 WHEN 3 THEN 70 ELSE 55 END
    WHEN 2 THEN CASE WHEN week_number <= 2 THEN 70 WHEN week_number <= 4 THEN 75 WHEN week_number <= 6 THEN 80 WHEN week_number = 7 THEN 85 ELSE 70 END
    WHEN 3 THEN CASE week_number WHEN 1 THEN 80 WHEN 2 THEN 82 WHEN 3 THEN 85 ELSE 72 END
    WHEN 4 THEN 68
    WHEN 5 THEN 45
    WHEN 6 THEN CASE WHEN week_number <= 2 THEN 60 WHEN week_number <= 4 THEN 65 WHEN week_number <= 6 THEN 70 ELSE 62 END
    ELSE 60
  END::numeric,
  CASE phase_order
    WHEN 1 THEN CASE week_number WHEN 1 THEN 1.00 WHEN 2 THEN 1.15 WHEN 3 THEN 1.30 ELSE 0.85 END
    WHEN 2 THEN CASE WHEN week_number <= 2 THEN 1.20 WHEN week_number <= 4 THEN 1.35 WHEN week_number <= 6 THEN 1.50 WHEN week_number = 7 THEN 1.65 ELSE 1.10 END
    WHEN 3 THEN CASE week_number WHEN 1 THEN 1.40 WHEN 2 THEN 1.55 WHEN 3 THEN 1.70 ELSE 1.20 END
    WHEN 4 THEN 1.10
    WHEN 5 THEN 0.80
    WHEN 6 THEN CASE WHEN week_number <= 2 THEN 1.00 WHEN week_number <= 4 THEN 1.15 WHEN week_number <= 6 THEN 1.30 ELSE 1.05 END
    ELSE 1.00
  END::numeric,
  CASE phase_order
    WHEN 1 THEN format('Foundation Week %s - movement quality and deceleration mechanics', week_number)
    WHEN 2 THEN format('Speed Development Week %s - acceleration and sprint mechanics', week_number)
    WHEN 3 THEN format('Agility & Reactive Week %s - route breaks and coverage transitions', week_number)
    WHEN 4 THEN format('Tournament Maintenance Week %s - keep speed sharp and recover well', week_number)
    WHEN 5 THEN format('Active Recovery Week %s - low intensity restoration work', week_number)
    WHEN 6 THEN format('Pre-Season Preparation Week %s - rebuild speed and COD', week_number)
    ELSE format('%s Week %s', phase_name, week_number)
  END
FROM generated_weeks
ON CONFLICT (phase_id, week_number) DO UPDATE
SET
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  load_percentage = EXCLUDED.load_percentage,
  volume_multiplier = EXCLUDED.volume_multiplier,
  focus = EXCLUDED.focus,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 3. Exercise library used by template sessions
-- -----------------------------------------------------------------------------
INSERT INTO public.exercises (
  id,
  name,
  slug,
  category,
  movement_pattern,
  description,
  position_specific,
  applicable_positions,
  metrics_tracked,
  load_contribution_au,
  equipment_needed,
  difficulty_level,
  how_text,
  feel_text,
  compensation_text
)
VALUES
  ('44444402-4444-4444-4444-444444444402'::uuid, 'Ankle Mobility Sequence', 'ankle-mobility-sequence', 'Flexibility', 'Mobility', 'Restore ankle range of motion before training and on recovery days.', NULL, NULL, ARRAY['Duration', 'ROM'], 4, ARRAY['None'], 'low', 'Move through controlled dorsiflexion and rotation drills.', 'Looser ankles and easier shin angles.', 'Avoid collapsing the arch or rushing the range.'),
  ('44444403-4444-4444-4444-444444444403'::uuid, 'Hip Mobility Sequence', 'hip-mobility-sequence', 'Flexibility', 'Mobility', 'Open internal and external hip rotation for throwing and lower-body work.', NULL, NULL, ARRAY['Duration', 'ROM'], 4, ARRAY['None'], 'low', 'Use 90/90 transitions and hip flexor mobility.', 'Hips should feel freer through stance and stride.', 'Do not force end range or rotate through the lumbar spine.'),
  ('44444404-4444-4444-4444-444444444404'::uuid, 'Thoracic Rotation Drills', 'thoracic-rotation-drills', 'Flexibility', 'Mobility', 'Improve thoracic rotation to support efficient throwing mechanics.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Duration', 'Rotations'], 4, ARRAY['None'], 'low', 'Rotate through the upper back while keeping hips stable.', 'More torso rotation without shoulder strain.', 'Do not over-rotate through the lower back.'),
  ('44444405-4444-4444-4444-444444444405'::uuid, 'Scapular Activation', 'scapular-activation', 'Strength', 'Activation', 'Prime the shoulder girdle before upper-body work and throwing.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Duration', 'Reps'], 6, ARRAY['Resistance Band'], 'low', 'Control protraction and retraction with tempo.', 'Shoulders should feel stable and warm.', 'Avoid shrugging or rushing through the band tension.'),
  ('44444406-4444-4444-4444-444444444406'::uuid, 'QB Arm Care Routine', 'qb-arm-care-routine', 'Position-Specific', 'Arm Care', 'Rotator cuff and elbow-health sequence for quarterbacks.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Duration', 'Sets', 'Reps'], 6, ARRAY['Light Band'], 'low', 'Move slowly through cuff and forearm prep.', 'Arm should feel supported, not fatigued.', 'Stop if pain sharpens through the front of the shoulder.'),
  ('44444413-4444-4444-4444-444444444413'::uuid, 'Medicine Ball Throws', 'medicine-ball-throws', 'Power', 'Explosive', 'Rotational and chest-pass throws to build total-body power.', NULL, NULL, ARRAY['Throws', 'Sets'], 12, ARRAY['Medicine Ball'], 'moderate', 'Explode through the floor and finish the throw cleanly.', 'Crisp power transfer through hips and trunk.', 'Avoid overextending the low back on the finish.'),
  ('44444414-4444-4444-4444-444444444414'::uuid, 'Progressive Throwing Sequence', 'progressive-throwing-sequence', 'Position-Specific', 'Throwing', 'Structured throwing build-up from short to moderate distances.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Throws', 'Distance'], 16, ARRAY['Football'], 'moderate', 'Build distance gradually while keeping mechanics crisp.', 'Arm should feel hot but under control.', 'Do not jump to max velocity before the arm is ready.'),
  ('44444421-4444-4444-4444-444444444421'::uuid, '3-Step Acceleration Drill', '3-step-acceleration-drill', 'Speed', '3-step acceleration', 'Explosive first three steps for pocket movement and scramble efficiency.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Reps', 'Time', 'Distance'], 10, ARRAY['Cones'], 'moderate', 'Stay low and attack out of the first step.', 'Feel force into the ground with each projection.', 'Do not pop upright too early.'),
  ('44444422-4444-4444-4444-444444444422'::uuid, 'Deceleration Drill', 'deceleration-drill', 'Speed', 'Deceleration', 'Teach safe stopping mechanics after acceleration and sprint work.', NULL, NULL, ARRAY['Reps', 'Distance'], 8, ARRAY['Cones'], 'moderate', 'Own the final two steps and brake with control.', 'Balanced hips and quiet feet into the stop.', 'Do not crash into the stop or let knees cave in.'),
  ('44444423-4444-4444-4444-444444444423'::uuid, 'Unilateral Jump Series', 'unilateral-jump-series', 'Power', 'Unilateral', 'Single-leg hops and bounds for force production and landing control.', NULL, NULL, ARRAY['Reps', 'Sets', 'Distance'], 12, ARRAY['None'], 'high', 'Stick the landing before the next effort.', 'Powerful take-off with stable single-leg landings.', 'Avoid noisy landings and excessive trunk sway.'),
  ('44444431-4444-4444-4444-444444444431'::uuid, 'Trap Bar Deadlift', 'trap-bar-deadlift', 'Strength', 'Hip Hinge', 'Primary posterior-chain lift for force production.', NULL, NULL, ARRAY['Sets', 'Reps', 'Weight'], 18, ARRAY['Trap Bar'], 'moderate', 'Push the floor away and finish tall.', 'Leg drive and hip extension should carry the lift.', 'Do not round the upper back or jerk from the floor.'),
  ('44444432-4444-4444-4444-444444444432'::uuid, 'Front Squat', 'front-squat', 'Strength', 'Squat', 'Anterior-loaded squat that reinforces torso stiffness and leg drive.', NULL, NULL, ARRAY['Sets', 'Reps', 'Weight'], 16, ARRAY['Barbell'], 'moderate', 'Stay tall through the rack and drive knees over toes.', 'Upper back engagement with even foot pressure.', 'Avoid elbows dropping or chest collapsing.'),
  ('44444435-4444-4444-4444-444444444435'::uuid, 'Bulgarian Split Squat', 'bulgarian-split-squat', 'Strength', 'Unilateral', 'Single-leg strength builder for deceleration and lower-body resilience.', NULL, NULL, ARRAY['Sets', 'Reps', 'Weight'], 14, ARRAY['Bench', 'Dumbbells'], 'moderate', 'Descend under control and drive through the full foot.', 'Front leg should do the work.', 'Do not bounce out of the bottom or dump into the lower back.'),
  ('44444436-4444-4444-4444-444444444436'::uuid, 'Landmine Press', 'landmine-press', 'Strength', 'Push', 'Shoulder-friendly upper-body press for quarterbacks.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Sets', 'Reps', 'Weight'], 12, ARRAY['Landmine', 'Barbell'], 'moderate', 'Press up and out while keeping ribs stacked.', 'Smooth pressing path without shoulder pinch.', 'Do not flare the rib cage or shrug hard at lockout.'),
  ('44444437-4444-4444-4444-444444444437'::uuid, 'Half-Kneeling Pallof Press', 'half-kneeling-pallof-press', 'Strength', 'Anti-Rotation', 'Core anti-rotation drill supporting rotational power transfer.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Sets', 'Reps', 'Resistance'], 8, ARRAY['Cable', 'Band'], 'low', 'Brace before each press and own the return.', 'The trunk should resist rotation instead of twisting.', 'Do not let the band pull the torso off center.'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Flying 20m Sprint', 'flying-20m-sprint', 'Speed', 'Top-End Speed', 'Build to max velocity before entering a timed flying sprint zone.', NULL, NULL, ARRAY['Reps', 'Time'], 14, ARRAY['Cones'], 'high', 'Relax into the build and attack the fly zone.', 'Fast hips and elastic contacts at speed.', 'Avoid overstriding as speed rises.'),
  ('44444450-4444-4444-4444-444444444450'::uuid, 'Throwing Volume Session - 50 Throws', 'throwing-volume-50', 'Position-Specific', 'Throwing', 'Return-to-throwing session capped at 50 throws.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 18, ARRAY['Football'], 'moderate', 'Keep intent low and mechanics crisp.', 'Arm should finish fresher than it started.', 'Do not chase velocity during reintroduction weeks.'),
  ('44444451-4444-4444-4444-444444444451'::uuid, 'Throwing Volume Session - 80 Throws', 'throwing-volume-80', 'Position-Specific', 'Throwing', 'Foundation throwing session at 80 total throws.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 20, ARRAY['Football'], 'moderate', 'Stay rhythmic through each throw family.', 'Steady volume with stable mechanics.', 'Do not add extra throws once mechanics fade.'),
  ('44444456-4444-4444-4444-444444444456'::uuid, 'Throwing Volume Session - 120 Throws', 'throwing-volume-120', 'Position-Specific', 'Throwing', 'Controlled 120-throw workload for late-foundation and early-build weeks.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 24, ARRAY['Football'], 'moderate', 'Organize throws into quality blocks with short resets.', 'Notice repeatable footwork and release timing.', 'Do not let tempo outrun mechanics.'),
  ('44444457-4444-4444-4444-444444444457'::uuid, 'Throwing Volume Session - 160 Throws', 'throwing-volume-160', 'Position-Specific', 'Throwing', 'Mid-build throwing session at 160 total throws.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 28, ARRAY['Football'], 'high', 'Split volume into manageable series and monitor arm freshness.', 'Arm should stay fast without losing accuracy.', 'Stop the session if mechanics break down.'),
  ('44444453-4444-4444-4444-444444444453'::uuid, 'Throwing Volume Session - 200 Throws', 'throwing-volume-200', 'Position-Specific', 'Throwing', 'High-volume quarterback session at 200 total throws.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 32, ARRAY['Football'], 'high', 'Keep recovery breaks structured and consistent.', 'High output with controlled fatigue.', 'Do not compress rest just to finish faster.'),
  ('44444458-4444-4444-4444-444444444458'::uuid, 'Throwing Volume Session - 240 Throws', 'throwing-volume-240', 'Position-Specific', 'Throwing', 'Advanced throwing workload at 240 total throws.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 34, ARRAY['Football'], 'high', 'Work in blocks and maintain decision-making quality.', 'Fast arm with disciplined pacing.', 'Do not let footwork deteriorate late in the session.'),
  ('44444459-4444-4444-4444-444444444459'::uuid, 'Throwing Volume Session - 280 Throws', 'throwing-volume-280', 'Position-Specific', 'Throwing', 'Near-peak quarterback throwing session at 280 throws.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 36, ARRAY['Football'], 'high', 'Preserve mechanics through deliberate breaks and sequencing.', 'The arm should stay fast late into the session.', 'Do not add volume once accuracy drops.'),
  ('44444454-4444-4444-4444-444444444454'::uuid, 'Throwing Volume Session - 320 Throws (Peak)', 'throwing-volume-320', 'Position-Specific', 'Throwing', 'Peak-season throwing session capped at 320 throws.', ARRAY['quarterback']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'QB')], ARRAY['Throws', 'Duration'], 40, ARRAY['Football'], 'high', 'Treat this like a peak competition workload with planned recovery blocks.', 'High intent with game-specific precision.', 'Do not exceed the target volume.'),
  ('cccccc02-cccc-cccc-cccc-cccccccccccc'::uuid, 'Hip 90/90 Stretch Sequence', 'hip-90-90-stretch-sequence', 'Flexibility', 'Mobility', 'Restore hip internal and external rotation for sharp route breaks and hip flips.', ARRAY['wr_db']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'WR'), (SELECT id FROM public.positions WHERE name = 'DB')], ARRAY['Duration', 'ROM'], 4, ARRAY['None'], 'low', 'Transition smoothly between 90/90 positions.', 'Hips should open without pinching.', 'Do not force end range or twist through the low back.'),
  ('cccccc03-cccc-cccc-cccc-cccccccccccc'::uuid, 'Glute Activation Circuit', 'glute-activation-circuit', 'Strength', 'Activation', 'Activate the glutes before sprinting, cutting, and lower-body work.', NULL, NULL, ARRAY['Duration', 'Reps'], 5, ARRAY['Mini Band'], 'low', 'Control each rep and keep tension on the band.', 'Glutes should feel switched on before speed work.', 'Avoid using the lower back to cheat the range.'),
  ('cccccc04-cccc-cccc-cccc-cccccccccccc'::uuid, 'WR/DB Dynamic Warm-up', 'wrdb-dynamic-warmup', 'Position-Specific', 'Warm-up', 'Dynamic movement prep for acceleration, backpedal, shuffle, and crossover mechanics.', ARRAY['wr_db']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'WR'), (SELECT id FROM public.positions WHERE name = 'DB')], ARRAY['Duration', 'Completion'], 8, ARRAY['Cones'], 'low', 'Move from mobility into progressively faster mechanics.', 'Legs should feel springy and ready to cut.', 'Do not skip the slower prep reps.'),
  ('cccccc11-cccc-cccc-cccc-cccccccccccc'::uuid, '10-Yard Burst', '10-yard-burst', 'Speed', 'Acceleration', 'Short acceleration exposure focused on first-step violence and projection.', ARRAY['wr_db']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'WR'), (SELECT id FROM public.positions WHERE name = 'DB')], ARRAY['Reps', 'Time'], 10, ARRAY['Cones'], 'moderate', 'Drive low through the first three steps.', 'Feel powerful projection from the start.', 'Do not stand up too early.'),
  ('cccccc12-cccc-cccc-cccc-cccccccccccc'::uuid, 'Flying 30m Sprint', 'flying-30m-sprint', 'Speed', 'Top-End Speed', 'Build gradually before entering a maximal fly zone.', NULL, NULL, ARRAY['Reps', 'Time'], 14, ARRAY['Cones'], 'high', 'Stay relaxed into the fly zone and let speed rise.', 'Fast contacts and upright posture at speed.', 'Avoid reaching out with the front foot.'),
  ('cccccc13-cccc-cccc-cccc-cccccccccccc'::uuid, 'Resisted Sprint (Band)', 'resisted-sprint-band', 'Speed', 'Acceleration', 'Partner-resisted sprint to build horizontal force application.', NULL, NULL, ARRAY['Reps', 'Distance'], 12, ARRAY['Band'], 'moderate', 'Keep shin angles aggressive and steps decisive.', 'Feel force driving backward into the ground.', 'Do not let resistance pull you upright.'),
  ('cccccc14-cccc-cccc-cccc-cccccccccccc'::uuid, 'Hill Sprint (Short)', 'hill-sprint-short', 'Speed', 'Acceleration', 'Short hill sprint for horizontal projection and front-side mechanics.', NULL, NULL, ARRAY['Reps', 'Time'], 12, ARRAY['Hill'], 'high', 'Attack the hill with a powerful knee drive.', 'Projection and force should feel natural uphill.', 'Do not collapse at the hips on the slope.'),
  ('cccccc21-cccc-cccc-cccc-cccccccccccc'::uuid, 'L-Drill (3-Cone)', 'l-drill-3-cone', 'Agility', 'Change of Direction', 'Three-cone drill for deceleration, re-acceleration, and body control.', NULL, NULL, ARRAY['Reps', 'Time'], 12, ARRAY['Cones'], 'moderate', 'Sink hips and own each plant before accelerating out.', 'Sharp edges through each change of direction.', 'Do not overrun the cone and reach to recover.'),
  ('cccccc22-cccc-cccc-cccc-cccccccccccc'::uuid, 'Pro Agility (5-10-5)', 'pro-agility-5-10-5', 'Agility', 'Lateral', 'Classic lateral COD drill for offensive and defensive skill players.', NULL, NULL, ARRAY['Reps', 'Time'], 12, ARRAY['Cones'], 'moderate', 'Explode out of each plant with low hips.', 'Balanced cuts and aggressive re-acceleration.', 'Do not cross the feet or pop upright on the middle turn.'),
  ('cccccc25-cccc-cccc-cccc-cccccccccccc'::uuid, 'Reactive Mirror Drill', 'reactive-mirror-drill', 'Agility', 'Reactive', 'Partner-driven change-of-direction drill for live reactions.', ARRAY['wr_db']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'WR'), (SELECT id FROM public.positions WHERE name = 'DB')], ARRAY['Duration', 'Reps'], 10, ARRAY['None'], 'moderate', 'Stay square and react off the partner, not anticipation.', 'Quick feet with controlled posture.', 'Do not reach or cross over too early.'),
  ('cccccc31-cccc-cccc-cccc-cccccccccccc'::uuid, 'Route Tree Practice - Slant/In', 'route-tree-practice-slant-in', 'Position-Specific', 'Route Running', 'Route-running block for sharp inside breaks and acceleration out of cuts.', ARRAY['wr_db','wr']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'WR')], ARRAY['Routes', 'Completion Rate'], 10, ARRAY['Cones', 'Football'], 'moderate', 'Win the stem before attacking the break.', 'Explosive separation out of the cut.', 'Do not drift into the break or rise up too early.'),
  ('cccccc41-cccc-cccc-cccc-cccccccccccc'::uuid, 'Backpedal Technique Drill', 'backpedal-technique-drill', 'Position-Specific', 'Coverage', 'Backpedal and transition drill for defensive backs.', ARRAY['wr_db','db']::text[], ARRAY[(SELECT id FROM public.positions WHERE name = 'DB')], ARRAY['Distance', 'Reps'], 10, ARRAY['Cones'], 'moderate', 'Keep hips loaded and feet under the center of mass.', 'Smooth backward movement with ready hips.', 'Do not click the heels or let the chest drift back.'),
  ('cccccc51-cccc-cccc-cccc-cccccccccccc'::uuid, 'Goblet Squat', 'goblet-squat', 'Strength', 'Squat', 'Foundational squat for leg strength and trunk control.', NULL, NULL, ARRAY['Sets', 'Reps', 'Weight'], 12, ARRAY['Kettlebell'], 'moderate', 'Stay tall and sit between the hips.', 'Even pressure through the whole foot.', 'Do not collapse inward at the knees.'),
  ('cccccc52-cccc-cccc-cccc-cccccccccccc'::uuid, 'Single-Leg Romanian Deadlift', 'single-leg-romanian-deadlift', 'Strength', 'Hip Hinge', 'Single-leg posterior-chain builder for balance and hamstring strength.', NULL, NULL, ARRAY['Sets', 'Reps', 'Weight'], 12, ARRAY['Dumbbells'], 'moderate', 'Reach long through the rear leg and keep hips square.', 'Hamstrings and glutes should load cleanly.', 'Do not rotate open through the pelvis.'),
  ('cccccc53-cccc-cccc-cccc-cccccccccccc'::uuid, 'Lateral Lunge', 'lateral-lunge', 'Strength', 'Lateral', 'Frontal-plane strength builder for COD resilience.', NULL, NULL, ARRAY['Sets', 'Reps', 'Weight'], 10, ARRAY['None'], 'moderate', 'Sit back into the hip and own the return.', 'Inside thigh and glute should absorb the load.', 'Do not cave the knee or shift onto the toes.'),
  ('cccccc55-cccc-cccc-cccc-cccccccccccc'::uuid, 'Copenhagen Plank', 'copenhagen-plank', 'Strength', 'Adductor', 'Adductor-focused plank supporting groin resilience for COD athletes.', NULL, NULL, ARRAY['Sets', 'Duration'], 8, ARRAY['Bench'], 'moderate', 'Stay long through the body and breathe behind the brace.', 'Adductors should work steadily without hip dropping.', 'Do not twist or sag through the trunk.'),
  ('cccccc61-cccc-cccc-cccc-cccccccccccc'::uuid, 'Lateral Bound', 'lateral-bound', 'Power', 'Lateral', 'Single-leg lateral power exercise with controlled stick landings.', NULL, NULL, ARRAY['Reps', 'Distance'], 12, ARRAY['None'], 'high', 'Jump aggressively sideways and own the landing.', 'Powerful lateral push with stable landings.', 'Do not let the knee collapse on contact.'),
  ('cccccc62-cccc-cccc-cccc-cccccccccccc'::uuid, 'Single-Leg Hop (Forward)', 'single-leg-hop-forward', 'Power', 'Unilateral', 'Forward single-leg power and landing control drill.', NULL, NULL, ARRAY['Reps', 'Distance'], 12, ARRAY['None'], 'high', 'Project forward while landing quietly and balanced.', 'Strong elastic rebound from each leg.', 'Do not lose alignment through the landing knee.'),
  ('cccccc64-cccc-cccc-cccc-cccccccccccc'::uuid, 'Skater Jumps', 'skater-jumps', 'Power', 'Lateral', 'Continuous lateral power drill for frontal-plane explosiveness.', NULL, NULL, ARRAY['Reps', 'Distance'], 12, ARRAY['None'], 'high', 'Attack side-to-side jumps with clean rhythm.', 'Elastic lateral push and soft reception.', 'Do not rush the landing position.' )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  category = EXCLUDED.category,
  movement_pattern = EXCLUDED.movement_pattern,
  description = EXCLUDED.description,
  position_specific = EXCLUDED.position_specific,
  applicable_positions = EXCLUDED.applicable_positions,
  metrics_tracked = EXCLUDED.metrics_tracked,
  load_contribution_au = EXCLUDED.load_contribution_au,
  equipment_needed = EXCLUDED.equipment_needed,
  difficulty_level = EXCLUDED.difficulty_level,
  how_text = EXCLUDED.how_text,
  feel_text = EXCLUDED.feel_text,
  compensation_text = EXCLUDED.compensation_text,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 4. Movement patterns and warm-up protocols
-- -----------------------------------------------------------------------------
INSERT INTO public.movement_patterns (id, program_id, name, description)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'Pocket Acceleration', 'Short-range acceleration and deceleration work for pocket movement.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'Throwing Mechanics', 'Progressive throwing exposure with arm-care safeguards.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222'::uuid, 'Route Break Mechanics', 'Change-of-direction mechanics for offensive skill players.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222'::uuid, 'Coverage Transitions', 'Backpedal, hip flip, and reaction work for defensive backs.')
ON CONFLICT (program_id, name) DO UPDATE
SET description = EXCLUDED.description,
    updated_at = now();

INSERT INTO public.warmup_protocols (id, program_id, name, description)
VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'QB Morning Routine', 'Mobility, activation, and arm-care prep before quarterback work.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'QB Dynamic Warm-up', 'Dynamic lower-body prep followed by progressive throwing.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222'::uuid, 'WR/DB Morning Routine', 'Hip mobility, glute activation, and tissue prep for skill players.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222'::uuid, 'WR/DB Dynamic Warm-up', 'Dynamic sprint, backpedal, shuffle, and crossover prep.')
ON CONFLICT (program_id, name) DO UPDATE
SET description = EXCLUDED.description,
    updated_at = now();

-- -----------------------------------------------------------------------------
-- 5. Clear and reseed program-backed template sessions
-- -----------------------------------------------------------------------------
DELETE FROM public.session_exercises
WHERE session_template_id IN (
  SELECT id
  FROM public.training_session_templates
  WHERE program_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid
  )
);

DELETE FROM public.training_session_templates
WHERE program_id IN (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid
);

WITH qb_weeks AS (
  SELECT tw.id, tw.focus, tw.load_percentage, tw.volume_multiplier, tp.name AS phase_name
  FROM public.training_weeks tw
  JOIN public.training_phases tp ON tp.id = tw.phase_id
  WHERE tp.program_id = '11111111-1111-1111-1111-111111111111'::uuid
), template_rows AS (
  SELECT gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, qw.id, 'Monday - Lower Body Strength', 'strength', 1, 1, 65, 'moderate',
         'Lower-body force production and trunk stiffness for quarterback power.',
         'QB Morning Routine + Dynamic Warm-up',
         format('%s. Build lower-body strength before speed and throwing exposures.', qw.focus),
         ARRAY['Trap Bar', 'Barbell', 'Bench']::text[], false, false, false
  FROM qb_weeks qw
  UNION ALL
  SELECT gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, qw.id, 'Tuesday - Speed & Throwing', 'skill', 2, 1, 90, 'high',
         'Acceleration mechanics and structured throwing volume matched to the week target.',
         'QB Dynamic Warm-up + Progressive Throwing',
         format('%s. Target volume adapts to %s%% of baseline throwing volume.', qw.focus, round(qw.volume_multiplier * 100)),
         ARRAY['Football', 'Cones']::text[], false, true, true
  FROM qb_weeks qw
  UNION ALL
  SELECT gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, qw.id, 'Wednesday - Upper Body Strength', 'strength', 3, 1, 60, 'moderate',
         'Shoulder-friendly pressing, anti-rotation core work, and arm-care reinforcement.',
         'QB Morning Routine + Scapular Activation',
         format('%s. Reinforce trunk control and shoulder health.', qw.focus),
         ARRAY['Landmine', 'Band']::text[], false, false, false
  FROM qb_weeks qw
  UNION ALL
  SELECT gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, qw.id, 'Thursday - Active Recovery', 'recovery', 4, 1, 45, 'low',
         'Mobility restoration and arm-care to absorb the weekly throwing load.',
         'Light mobility flow',
         format('%s. Recovery emphasis to protect arm health and readiness.', qw.focus),
         ARRAY['Band', 'None']::text[], false, false, false
  FROM qb_weeks qw
  UNION ALL
  SELECT gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, qw.id, 'Friday - Power & Throwing', 'power', 5, 1, 85, 'high',
         'Explosive power work paired with the week''s primary throwing dose.',
         'QB Dynamic Warm-up + Med Ball Prep',
         format('%s. Finish the week with speed-power outputs and throwing quality.', qw.focus),
         ARRAY['Medicine Ball', 'Football', 'Cones']::text[], false, true, true
  FROM qb_weeks qw
  UNION ALL
  SELECT gen_random_uuid(), '22222222-2222-2222-2222-222222222222'::uuid, ww.id, 'Monday - Speed & Acceleration', 'speed', 1, 1, 60, 'moderate',
         'Short acceleration, band resistance, and front-side sprint mechanics.',
         'WR/DB Dynamic Warm-up',
         format('%s. Open the week with speed exposures and clean mechanics.', ww.focus),
         ARRAY['Cones', 'Band']::text[], false, true, true
  FROM (
    SELECT tw.id, tw.focus
    FROM public.training_weeks tw
    JOIN public.training_phases tp ON tp.id = tw.phase_id
    WHERE tp.program_id = '22222222-2222-2222-2222-222222222222'::uuid
  ) ww
  UNION ALL
  SELECT gen_random_uuid(), '22222222-2222-2222-2222-222222222222'::uuid, ww.id, 'Tuesday - Agility & Skills', 'skill', 2, 1, 75, 'high',
         'COD work followed by route-running and coverage-transition drills.',
         'WR/DB Dynamic Warm-up',
         format('%s. Route, coverage, and reaction work sit at the center of this session.', ww.focus),
         ARRAY['Cones', 'Football']::text[], false, true, true
  FROM (
    SELECT tw.id, tw.focus
    FROM public.training_weeks tw
    JOIN public.training_phases tp ON tp.id = tw.phase_id
    WHERE tp.program_id = '22222222-2222-2222-2222-222222222222'::uuid
  ) ww
  UNION ALL
  SELECT gen_random_uuid(), '22222222-2222-2222-2222-222222222222'::uuid, ww.id, 'Wednesday - Lower Body Strength', 'strength', 3, 1, 55, 'moderate',
         'Single-leg strength and groin resilience to support cutting, sprinting, and coverage.',
         'WR/DB Morning Routine + Activation',
         format('%s. Frontal-plane resilience and posterior-chain capacity.', ww.focus),
         ARRAY['Kettlebell', 'Bench', 'Dumbbells']::text[], false, false, false
  FROM (
    SELECT tw.id, tw.focus
    FROM public.training_weeks tw
    JOIN public.training_phases tp ON tp.id = tw.phase_id
    WHERE tp.program_id = '22222222-2222-2222-2222-222222222222'::uuid
  ) ww
  UNION ALL
  SELECT gen_random_uuid(), '22222222-2222-2222-2222-222222222222'::uuid, ww.id, 'Thursday - Active Recovery', 'recovery', 4, 1, 40, 'low',
         'Mobility, activation, and easy tempo work to preserve freshness.',
         'WR/DB Morning Routine',
         format('%s. Low-intensity recovery keeps the legs fresh for Friday speed.', ww.focus),
         ARRAY['Band', 'None']::text[], false, false, false
  FROM (
    SELECT tw.id, tw.focus
    FROM public.training_weeks tw
    JOIN public.training_phases tp ON tp.id = tw.phase_id
    WHERE tp.program_id = '22222222-2222-2222-2222-222222222222'::uuid
  ) ww
  UNION ALL
  SELECT gen_random_uuid(), '22222222-2222-2222-2222-222222222222'::uuid, ww.id, 'Friday - Speed & Plyometrics', 'power', 5, 1, 60, 'high',
         'Top-end sprinting and lateral plyometrics to finish the week with quality speed.',
         'WR/DB Dynamic Warm-up',
         format('%s. High-quality speed and elastic power before the weekend.', ww.focus),
         ARRAY['Cones']::text[], false, true, true
  FROM (
    SELECT tw.id, tw.focus
    FROM public.training_weeks tw
    JOIN public.training_phases tp ON tp.id = tw.phase_id
    WHERE tp.program_id = '22222222-2222-2222-2222-222222222222'::uuid
  ) ww
)
INSERT INTO public.training_session_templates (
  id,
  program_id,
  week_id,
  session_name,
  session_type,
  day_of_week,
  session_order,
  duration_minutes,
  intensity_level,
  description,
  warm_up_protocol,
  notes,
  equipment_needed,
  is_team_practice,
  is_outdoor,
  weather_sensitive
)
SELECT * FROM template_rows
ON CONFLICT (week_id, day_of_week, session_order) DO UPDATE
SET
  program_id = EXCLUDED.program_id,
  session_name = EXCLUDED.session_name,
  session_type = EXCLUDED.session_type,
  duration_minutes = EXCLUDED.duration_minutes,
  intensity_level = EXCLUDED.intensity_level,
  description = EXCLUDED.description,
  warm_up_protocol = EXCLUDED.warm_up_protocol,
  notes = EXCLUDED.notes,
  equipment_needed = EXCLUDED.equipment_needed,
  is_team_practice = EXCLUDED.is_team_practice,
  is_outdoor = EXCLUDED.is_outdoor,
  weather_sensitive = EXCLUDED.weather_sensitive,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 6. Template exercise links
-- -----------------------------------------------------------------------------
WITH qb_templates AS (
  SELECT t.id AS template_id, t.session_name, w.load_percentage, w.volume_multiplier, p.phase_order
  FROM public.training_session_templates t
  JOIN public.training_weeks w ON w.id = t.week_id
  JOIN public.training_phases p ON p.id = w.phase_id
  WHERE t.program_id = '11111111-1111-1111-1111-111111111111'::uuid
), qb_template_exercises AS (
  SELECT * FROM (
    SELECT
      gen_random_uuid() AS id,
      qt.template_id,
      '44444431-4444-4444-4444-444444444431'::uuid AS exercise_id,
      'Trap Bar Deadlift'::text AS exercise_name,
      1 AS exercise_order,
      4 AS sets,
      '5'::text AS reps,
      120 AS rest_seconds,
      NULL::integer AS duration_seconds,
      NULL::integer AS distance_meters,
      format('Lower-body strength at %s%% effort for the current week.', qt.load_percentage::int) AS load_description,
      qt.load_percentage,
      'controlled'::text AS tempo,
      'moderate'::text AS intensity,
      'Primary bilateral strength lift.'::text AS notes
    FROM qb_templates qt WHERE qt.session_name = 'Monday - Lower Body Strength'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444432-4444-4444-4444-444444444432'::uuid, 'Front Squat', 2, 3, '6', 90, NULL, NULL, 'Anterior-loaded squat for trunk stiffness.', qt.load_percentage, 'controlled', 'moderate', 'Keep torso tall and brace hard.' FROM qb_templates qt WHERE qt.session_name = 'Monday - Lower Body Strength'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444435-4444-4444-4444-444444444435'::uuid, 'Bulgarian Split Squat', 3, 3, '8/side', 75, NULL, NULL, 'Single-leg strength and pelvic control.', NULL, 'controlled', 'moderate', 'Unilateral leg strength for force absorption.' FROM qb_templates qt WHERE qt.session_name = 'Monday - Lower Body Strength'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444437-4444-4444-4444-444444444437'::uuid, 'Half-Kneeling Pallof Press', 4, 3, '10/side', 45, NULL, NULL, 'Anti-rotation trunk control.', NULL, 'paused', 'low', 'Finish Monday with core control work.' FROM qb_templates qt WHERE qt.session_name = 'Monday - Lower Body Strength'

    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444414-4444-4444-4444-444444444414'::uuid, 'Progressive Throwing Sequence', 1, 1, '1 block', 60, 900, NULL, 'Build from short to moderate distances before high-volume throws.', NULL, 'smooth', 'moderate', 'Prime the arm before the main throwing dose.' FROM qb_templates qt WHERE qt.session_name = 'Tuesday - Speed & Throwing'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444421-4444-4444-4444-444444444421'::uuid, '3-Step Acceleration Drill', 2, 5, '3 reps', 75, NULL, 10, 'Pocket acceleration mechanics.', NULL, 'explosive', 'high', 'Attack the first three steps.' FROM qb_templates qt WHERE qt.session_name = 'Tuesday - Speed & Throwing'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444422-4444-4444-4444-444444444422'::uuid, 'Deceleration Drill', 3, 4, '2 reps', 75, NULL, 12, 'Brake with control after acceleration.', NULL, 'controlled', 'moderate', 'Own the stop before the next rep.' FROM qb_templates qt WHERE qt.session_name = 'Tuesday - Speed & Throwing'
    UNION ALL SELECT gen_random_uuid(), qt.template_id,
      CASE
        WHEN qt.volume_multiplier <= 0.55 THEN '44444450-4444-4444-4444-444444444450'::uuid
        WHEN qt.volume_multiplier <= 0.85 THEN '44444451-4444-4444-4444-444444444451'::uuid
        WHEN qt.volume_multiplier <= 1.25 THEN '44444456-4444-4444-4444-444444444456'::uuid
        WHEN qt.volume_multiplier <= 1.75 THEN '44444457-4444-4444-4444-444444444457'::uuid
        WHEN qt.volume_multiplier <= 2.40 THEN '44444453-4444-4444-4444-444444444453'::uuid
        WHEN qt.volume_multiplier <= 2.80 THEN '44444458-4444-4444-4444-444444444458'::uuid
        WHEN qt.volume_multiplier < 3.20 THEN '44444459-4444-4444-4444-444444444459'::uuid
        ELSE '44444454-4444-4444-4444-444444444454'::uuid
      END,
      CASE
        WHEN qt.volume_multiplier <= 0.55 THEN 'Throwing Volume Session - 50 Throws'
        WHEN qt.volume_multiplier <= 0.85 THEN 'Throwing Volume Session - 80 Throws'
        WHEN qt.volume_multiplier <= 1.25 THEN 'Throwing Volume Session - 120 Throws'
        WHEN qt.volume_multiplier <= 1.75 THEN 'Throwing Volume Session - 160 Throws'
        WHEN qt.volume_multiplier <= 2.40 THEN 'Throwing Volume Session - 200 Throws'
        WHEN qt.volume_multiplier <= 2.80 THEN 'Throwing Volume Session - 240 Throws'
        WHEN qt.volume_multiplier < 3.20 THEN 'Throwing Volume Session - 280 Throws'
        ELSE 'Throwing Volume Session - 320 Throws (Peak)'
      END,
      4, 1, '1 block', 180, NULL, NULL,
      format('Weekly throwing dose matched to %s volume multiplier.', round(qt.volume_multiplier::numeric, 2)),
      NULL, 'smooth', 'high', 'Primary throwing workload for the week.'
    FROM qb_templates qt WHERE qt.session_name = 'Tuesday - Speed & Throwing'

    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444436-4444-4444-4444-444444444436'::uuid, 'Landmine Press', 1, 4, '6', 90, NULL, NULL, 'Shoulder-friendly pressing.', NULL, 'controlled', 'moderate', 'Drive smoothly through the angled press.' FROM qb_templates qt WHERE qt.session_name = 'Wednesday - Upper Body Strength'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444437-4444-4444-4444-444444444437'::uuid, 'Half-Kneeling Pallof Press', 2, 3, '10/side', 45, NULL, NULL, 'Anti-rotation core strength.', NULL, 'paused', 'low', 'Brace before each press.' FROM qb_templates qt WHERE qt.session_name = 'Wednesday - Upper Body Strength'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444405-4444-4444-4444-444444444405'::uuid, 'Scapular Activation', 3, 2, '12', 30, NULL, NULL, 'Shoulder prep and control.', NULL, 'controlled', 'low', 'Light band work for scapular rhythm.' FROM qb_templates qt WHERE qt.session_name = 'Wednesday - Upper Body Strength'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444406-4444-4444-4444-444444444406'::uuid, 'QB Arm Care Routine', 4, 2, '10', 30, NULL, NULL, 'Arm-care finisher.', NULL, 'controlled', 'low', 'Reinforce shoulder and elbow health.' FROM qb_templates qt WHERE qt.session_name = 'Wednesday - Upper Body Strength'

    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444402-4444-4444-4444-444444444402'::uuid, 'Ankle Mobility Sequence', 1, 2, '60 sec', 30, 240, NULL, 'Restore ankle range before the next speed day.', NULL, 'smooth', 'low', 'Move through controlled dorsiflexion and rotation.' FROM qb_templates qt WHERE qt.session_name = 'Thursday - Active Recovery'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444403-4444-4444-4444-444444444403'::uuid, 'Hip Mobility Sequence', 2, 2, '60 sec', 30, 360, NULL, 'Open the hips and relieve residual stiffness.', NULL, 'smooth', 'low', 'Spend time in positions that restore rotation.' FROM qb_templates qt WHERE qt.session_name = 'Thursday - Active Recovery'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444404-4444-4444-4444-444444444404'::uuid, 'Thoracic Rotation Drills', 3, 2, '8/side', 30, 240, NULL, 'Reclaim thoracic mobility for throwing mechanics.', NULL, 'controlled', 'low', 'Rotate through the upper back without lumbar compensation.' FROM qb_templates qt WHERE qt.session_name = 'Thursday - Active Recovery'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444406-4444-4444-4444-444444444406'::uuid, 'QB Arm Care Routine', 4, 2, '10', 30, NULL, NULL, 'Arm-care restoration.', NULL, 'controlled', 'low', 'Finish recovery day with cuff and forearm work.' FROM qb_templates qt WHERE qt.session_name = 'Thursday - Active Recovery'

    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444413-4444-4444-4444-444444444413'::uuid, 'Medicine Ball Throws', 1, 4, '4', 60, NULL, NULL, 'Explosive rotational power prep.', NULL, 'explosive', 'high', 'Throw with intent and reset between reps.' FROM qb_templates qt WHERE qt.session_name = 'Friday - Power & Throwing'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444423-4444-4444-4444-444444444423'::uuid, 'Unilateral Jump Series', 2, 3, '5/side', 75, NULL, NULL, 'Single-leg power and landing quality.', NULL, 'explosive', 'high', 'Stick each landing before the next jump.' FROM qb_templates qt WHERE qt.session_name = 'Friday - Power & Throwing'
    UNION ALL SELECT gen_random_uuid(), qt.template_id, '44444444-4444-4444-4444-444444444444'::uuid, 'Flying 20m Sprint', 3, 4, '1 sprint', 150, NULL, 20, 'Top-end speed exposure after power prep.', NULL, 'fast', 'high', 'Relax into max velocity.' FROM qb_templates qt WHERE qt.session_name = 'Friday - Power & Throwing'
    UNION ALL SELECT gen_random_uuid(), qt.template_id,
      CASE
        WHEN qt.volume_multiplier <= 0.55 THEN '44444450-4444-4444-4444-444444444450'::uuid
        WHEN qt.volume_multiplier <= 0.85 THEN '44444451-4444-4444-4444-444444444451'::uuid
        WHEN qt.volume_multiplier <= 1.25 THEN '44444456-4444-4444-4444-444444444456'::uuid
        WHEN qt.volume_multiplier <= 1.75 THEN '44444457-4444-4444-4444-444444444457'::uuid
        WHEN qt.volume_multiplier <= 2.40 THEN '44444453-4444-4444-4444-444444444453'::uuid
        WHEN qt.volume_multiplier <= 2.80 THEN '44444458-4444-4444-4444-444444444458'::uuid
        WHEN qt.volume_multiplier < 3.20 THEN '44444459-4444-4444-4444-444444444459'::uuid
        ELSE '44444454-4444-4444-4444-444444444454'::uuid
      END,
      CASE
        WHEN qt.volume_multiplier <= 0.55 THEN 'Throwing Volume Session - 50 Throws'
        WHEN qt.volume_multiplier <= 0.85 THEN 'Throwing Volume Session - 80 Throws'
        WHEN qt.volume_multiplier <= 1.25 THEN 'Throwing Volume Session - 120 Throws'
        WHEN qt.volume_multiplier <= 1.75 THEN 'Throwing Volume Session - 160 Throws'
        WHEN qt.volume_multiplier <= 2.40 THEN 'Throwing Volume Session - 200 Throws'
        WHEN qt.volume_multiplier <= 2.80 THEN 'Throwing Volume Session - 240 Throws'
        WHEN qt.volume_multiplier < 3.20 THEN 'Throwing Volume Session - 280 Throws'
        ELSE 'Throwing Volume Session - 320 Throws (Peak)'
      END,
      4, 1, '1 block', 180, NULL, NULL,
      'Weekly throwing dose attached to the Friday power session.',
      NULL, 'smooth', 'high', 'Finish the week with high-quality throwing output.'
    FROM qb_templates qt WHERE qt.session_name = 'Friday - Power & Throwing'
  ) rows
)
INSERT INTO public.session_exercises (
  id,
  session_template_id,
  exercise_id,
  exercise_name,
  exercise_order,
  sets,
  reps,
  rest_seconds,
  duration_seconds,
  distance_meters,
  load_description,
  load_percentage,
  tempo,
  intensity,
  notes
)
SELECT
  id,
  template_id,
  exercise_id,
  exercise_name,
  exercise_order,
  sets,
  reps,
  rest_seconds,
  duration_seconds,
  distance_meters,
  load_description,
  load_percentage,
  tempo,
  intensity,
  notes
FROM qb_template_exercises
ON CONFLICT (session_template_id, exercise_order) DO UPDATE
SET
  exercise_id = EXCLUDED.exercise_id,
  exercise_name = EXCLUDED.exercise_name,
  sets = EXCLUDED.sets,
  reps = EXCLUDED.reps,
  rest_seconds = EXCLUDED.rest_seconds,
  duration_seconds = EXCLUDED.duration_seconds,
  distance_meters = EXCLUDED.distance_meters,
  load_description = EXCLUDED.load_description,
  load_percentage = EXCLUDED.load_percentage,
  tempo = EXCLUDED.tempo,
  intensity = EXCLUDED.intensity,
  notes = EXCLUDED.notes,
  updated_at = now();

WITH wrdb_templates AS (
  SELECT t.id AS template_id, t.session_name
  FROM public.training_session_templates t
  WHERE t.program_id = '22222222-2222-2222-2222-222222222222'::uuid
), wrdb_template_exercises AS (
  SELECT * FROM (
    SELECT gen_random_uuid(), wt.template_id, 'cccccc11-cccc-cccc-cccc-cccccccccccc'::uuid, '10-Yard Burst', 1, 6, '1 sprint', 90, NULL::integer, 10, 'Accelerate with first-step violence.', NULL::numeric, 'explosive', 'high', 'Short acceleration exposure.' FROM wrdb_templates wt WHERE wt.session_name = 'Monday - Speed & Acceleration'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc13-cccc-cccc-cccc-cccccccccccc'::uuid, 'Resisted Sprint (Band)', 2, 4, '1 sprint', 120, NULL, 15, 'Resisted horizontal force development.', NULL, 'explosive', 'high', 'Partner or band-resisted acceleration.' FROM wrdb_templates wt WHERE wt.session_name = 'Monday - Speed & Acceleration'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc14-cccc-cccc-cccc-cccccccccccc'::uuid, 'Hill Sprint (Short)', 3, 4, '1 sprint', 150, NULL, 20, 'Use incline to reinforce force projection.', NULL, 'explosive', 'high', 'Drive through the hill with strong shin angles.' FROM wrdb_templates wt WHERE wt.session_name = 'Monday - Speed & Acceleration'

    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc21-cccc-cccc-cccc-cccccccccccc'::uuid, 'L-Drill (3-Cone)', 1, 4, '2 reps', 90, NULL, NULL, 'Own the plant and re-acceleration.', NULL, 'fast', 'moderate', 'COD quality first.' FROM wrdb_templates wt WHERE wt.session_name = 'Tuesday - Agility & Skills'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc22-cccc-cccc-cccc-cccccccccccc'::uuid, 'Pro Agility (5-10-5)', 2, 4, '2 reps', 90, NULL, NULL, 'Timed lateral COD exposure.', NULL, 'fast', 'moderate', 'Stay low through the middle turn.' FROM wrdb_templates wt WHERE wt.session_name = 'Tuesday - Agility & Skills'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc25-cccc-cccc-cccc-cccccccccccc'::uuid, 'Reactive Mirror Drill', 3, 4, '20 sec', 60, 80, NULL, 'Live reaction drill to sharpen mirror ability.', NULL, 'reactive', 'high', 'React instead of anticipating.' FROM wrdb_templates wt WHERE wt.session_name = 'Tuesday - Agility & Skills'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc31-cccc-cccc-cccc-cccccccccccc'::uuid, 'Route Tree Practice - Slant/In', 4, 3, '6 routes', 60, NULL, NULL, 'Receiver route-running emphasis.', NULL, 'smooth', 'moderate', 'Attack the break and finish the route.' FROM wrdb_templates wt WHERE wt.session_name = 'Tuesday - Agility & Skills'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc41-cccc-cccc-cccc-cccccccccccc'::uuid, 'Backpedal Technique Drill', 5, 3, '6 reps', 60, NULL, NULL, 'Coverage transition emphasis for DBs.', NULL, 'smooth', 'moderate', 'Load hips and keep the feet quiet.' FROM wrdb_templates wt WHERE wt.session_name = 'Tuesday - Agility & Skills'

    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc51-cccc-cccc-cccc-cccccccccccc'::uuid, 'Goblet Squat', 1, 3, '10', 90, NULL, NULL, 'Primary lower-body strength pattern.', NULL, 'controlled', 'moderate', 'Use full-foot pressure and stay tall.' FROM wrdb_templates wt WHERE wt.session_name = 'Wednesday - Lower Body Strength'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc52-cccc-cccc-cccc-cccccccccccc'::uuid, 'Single-Leg Romanian Deadlift', 2, 3, '8/side', 75, NULL, NULL, 'Single-leg posterior-chain strength.', NULL, 'controlled', 'moderate', 'Square the hips as you hinge.' FROM wrdb_templates wt WHERE wt.session_name = 'Wednesday - Lower Body Strength'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc53-cccc-cccc-cccc-cccccccccccc'::uuid, 'Lateral Lunge', 3, 3, '8/side', 75, NULL, NULL, 'Frontal-plane strength for COD resilience.', NULL, 'controlled', 'moderate', 'Sit into the hip and own the return.' FROM wrdb_templates wt WHERE wt.session_name = 'Wednesday - Lower Body Strength'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc55-cccc-cccc-cccc-cccccccccccc'::uuid, 'Copenhagen Plank', 4, 3, '20 sec/side', 60, 120, NULL, 'Adductor resilience for cutting athletes.', NULL, 'controlled', 'moderate', 'Maintain a straight line from shoulder to ankle.' FROM wrdb_templates wt WHERE wt.session_name = 'Wednesday - Lower Body Strength'

    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc02-cccc-cccc-cccc-cccccccccccc'::uuid, 'Hip 90/90 Stretch Sequence', 1, 2, '60 sec', 30, 240, NULL, 'Restore hip rotation.', NULL, 'smooth', 'low', 'Use recovery day to open the hips.' FROM wrdb_templates wt WHERE wt.session_name = 'Thursday - Active Recovery'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc03-cccc-cccc-cccc-cccccccccccc'::uuid, 'Glute Activation Circuit', 2, 2, '8 reps', 30, 300, NULL, 'Light activation without fatigue.', NULL, 'controlled', 'low', 'Wake the glutes up without turning recovery into work.' FROM wrdb_templates wt WHERE wt.session_name = 'Thursday - Active Recovery'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc04-cccc-cccc-cccc-cccccccccccc'::uuid, 'WR/DB Dynamic Warm-up', 3, 1, '1 flow', 30, 600, NULL, 'Gentle dynamic prep and tissue flush.', NULL, 'smooth', 'low', 'Keep this day easy and restorative.' FROM wrdb_templates wt WHERE wt.session_name = 'Thursday - Active Recovery'

    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc12-cccc-cccc-cccc-cccccccccccc'::uuid, 'Flying 30m Sprint', 1, 4, '1 sprint', 180, NULL, 30, 'Top-end speed exposure.', NULL, 'fast', 'high', 'Relax into max velocity.' FROM wrdb_templates wt WHERE wt.session_name = 'Friday - Speed & Plyometrics'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc61-cccc-cccc-cccc-cccccccccccc'::uuid, 'Lateral Bound', 2, 3, '6/side', 90, NULL, NULL, 'Lateral power with stick landings.', NULL, 'explosive', 'high', 'Power sideways and own the landing.' FROM wrdb_templates wt WHERE wt.session_name = 'Friday - Speed & Plyometrics'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc64-cccc-cccc-cccc-cccccccccccc'::uuid, 'Skater Jumps', 3, 3, '8/side', 75, NULL, NULL, 'Elastic lateral power.', NULL, 'explosive', 'high', 'Stay rhythmic and quiet on contact.' FROM wrdb_templates wt WHERE wt.session_name = 'Friday - Speed & Plyometrics'
    UNION ALL SELECT gen_random_uuid(), wt.template_id, 'cccccc62-cccc-cccc-cccc-cccccccccccc'::uuid, 'Single-Leg Hop (Forward)', 4, 3, '5/side', 90, NULL, NULL, 'Forward unilateral power and landing control.', NULL, 'explosive', 'high', 'Stick each landing before the next hop.' FROM wrdb_templates wt WHERE wt.session_name = 'Friday - Speed & Plyometrics'
  ) rows(id, template_id, exercise_id, exercise_name, exercise_order, sets, reps, rest_seconds, duration_seconds, distance_meters, load_description, load_percentage, tempo, intensity, notes)
)
INSERT INTO public.session_exercises (
  id,
  session_template_id,
  exercise_id,
  exercise_name,
  exercise_order,
  sets,
  reps,
  rest_seconds,
  duration_seconds,
  distance_meters,
  load_description,
  load_percentage,
  tempo,
  intensity,
  notes
)
SELECT * FROM wrdb_template_exercises
ON CONFLICT (session_template_id, exercise_order) DO UPDATE
SET
  exercise_id = EXCLUDED.exercise_id,
  exercise_name = EXCLUDED.exercise_name,
  sets = EXCLUDED.sets,
  reps = EXCLUDED.reps,
  rest_seconds = EXCLUDED.rest_seconds,
  duration_seconds = EXCLUDED.duration_seconds,
  distance_meters = EXCLUDED.distance_meters,
  load_description = EXCLUDED.load_description,
  load_percentage = EXCLUDED.load_percentage,
  tempo = EXCLUDED.tempo,
  intensity = EXCLUDED.intensity,
  notes = EXCLUDED.notes,
  updated_at = now();
