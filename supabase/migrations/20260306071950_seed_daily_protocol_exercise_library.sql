-- Seed the baseline exercise library needed by daily-protocol generation.
-- This is intentionally compact: it covers the categories and slugs that the
-- runtime queries directly without trying to backfill the entire historic library.

DELETE FROM public.exercises
WHERE slug IN (
  'morning-mobility-day-1',
  'morning-mobility-day-2',
  'morning-mobility-day-3',
  'morning-mobility-day-4',
  'morning-mobility-day-5',
  'morning-mobility-day-6',
  'morning-mobility-day-7',
  'hip-90-90-stretch',
  'ankle-circles',
  'cat-cow-stretch',
  'worlds-greatest-stretch',
  'quad-foam-roll',
  'hamstring-foam-roll',
  'calf-foam-roll',
  'upper-back-foam-roll',
  'leg-swings-front-back',
  'a-skips',
  'lateral-shuffles',
  'arm-circles',
  'walking-cool-down',
  'standing-calf-stretch',
  'childs-pose'
);

INSERT INTO public.exercises (
  name,
  slug,
  category,
  subcategory,
  how_text,
  feel_text,
  compensation_text,
  default_sets,
  default_reps,
  default_hold_seconds,
  default_duration_seconds,
  target_muscles,
  difficulty_level,
  load_contribution_au,
  equipment_needed,
  active
)
VALUES
  ('Morning Mobility - Monday', 'morning-mobility-day-1', 'mobility', 'morning_routine', 'Follow the guided Monday mobility flow: hips, ankles, thoracic rotation, and breathing reset.', 'You should feel looser through the hips and trunk before training.', 'Move deliberately and stop forcing range when quality drops.', 1, NULL, NULL, 480, ARRAY['hips', 'ankles', 'thoracic_spine'], 'beginner', 5, ARRAY['None'], true),
  ('Morning Mobility - Tuesday', 'morning-mobility-day-2', 'mobility', 'morning_routine', 'Follow the guided Tuesday mobility flow: hips, hamstrings, calves, and thoracic rotation.', 'You should feel ready for sprint mechanics and field work.', 'Do not rush the positions just to finish the routine.', 1, NULL, NULL, 480, ARRAY['hips', 'hamstrings', 'calves'], 'beginner', 5, ARRAY['None'], true),
  ('Morning Mobility - Wednesday', 'morning-mobility-day-3', 'mobility', 'morning_routine', 'Follow the guided Wednesday mobility flow: ankles, adductors, and trunk control.', 'The lower body should feel less stiff before strength training.', 'Keep the rib cage stacked and avoid compensating through the low back.', 1, NULL, NULL, 480, ARRAY['ankles', 'adductors', 'core'], 'beginner', 5, ARRAY['None'], true),
  ('Morning Mobility - Thursday', 'morning-mobility-day-4', 'mobility', 'morning_routine', 'Follow the guided Thursday recovery flow: diaphragmatic breathing, hips, and thoracic mobility.', 'The goal is recovery, not fatigue.', 'Stay relaxed and avoid turning recovery into conditioning.', 1, NULL, NULL, 480, ARRAY['hips', 'thoracic_spine'], 'beginner', 4, ARRAY['None'], true),
  ('Morning Mobility - Friday', 'morning-mobility-day-5', 'mobility', 'morning_routine', 'Follow the guided Friday mobility flow: ankles, hips, and sprint-prep trunk rotation.', 'You should feel springy and ready for speed or power work.', 'Keep the transitions smooth rather than chasing end range.', 1, NULL, NULL, 480, ARRAY['ankles', 'hips', 'thoracic_spine'], 'beginner', 5, ARRAY['None'], true),
  ('Morning Mobility - Saturday', 'morning-mobility-day-6', 'mobility', 'morning_routine', 'Follow the guided Saturday mobility flow: light tissue prep and full-body reset.', 'The body should feel restored instead of worked.', 'Keep intensity low on recovery-focused days.', 1, NULL, NULL, 420, ARRAY['hips', 'spine'], 'beginner', 4, ARRAY['None'], true),
  ('Morning Mobility - Sunday', 'morning-mobility-day-7', 'mobility', 'morning_routine', 'Follow the guided Sunday mobility flow: easy breathing, ankle mobility, and hip rotation.', 'The body should feel relaxed and ready for the next week.', 'Stay patient and avoid forcing sore areas.', 1, NULL, NULL, 420, ARRAY['ankles', 'hips'], 'beginner', 4, ARRAY['None'], true),
  ('Hip 90/90 Stretch', 'hip-90-90-stretch', 'mobility', 'hip_mobility', 'Sit in a 90/90 position and rotate between sides under control.', 'You should feel the hips opening without pinching.', 'Do not twist through the lower back to fake more range.', 2, 1, 30, NULL, ARRAY['hips', 'glutes', 'groin'], 'beginner', 5, ARRAY['None'], true),
  ('Ankle Circles', 'ankle-circles', 'mobility', 'ankle_mobility', 'Lift one foot and make controlled circles through the full ankle range in both directions.', 'You should feel the ankle joint moving more freely.', 'Do not rush or shorten the circle.', 1, 10, NULL, NULL, ARRAY['ankles', 'calves'], 'beginner', 2, ARRAY['None'], true),
  ('Cat-Cow Stretch', 'cat-cow-stretch', 'mobility', 'spine_mobility', 'Move slowly between spinal flexion and extension while breathing deeply.', 'You should feel gentle movement through the full spine.', 'Do not dump into the lower back or hold your breath.', 1, 10, NULL, NULL, ARRAY['spine', 'core'], 'beginner', 3, ARRAY['None'], true),
  ('World''s Greatest Stretch', 'worlds-greatest-stretch', 'mobility', 'full_body_mobility', 'Move through lunge, hamstring, and thoracic rotation positions on both sides.', 'You should feel a global mobility reset from hips through upper back.', 'Do not rush the transitions or let the front knee cave in.', 1, 5, NULL, NULL, ARRAY['hips', 'hamstrings', 'thoracic_spine'], 'beginner', 6, ARRAY['None'], true),
  ('Quad Foam Roll', 'quad-foam-roll', 'foam_roll', 'lower_body', 'Roll slowly from above the knee to the hip while breathing steadily.', 'Expect moderate tissue pressure across the quads.', 'Do not rush over tight areas or hold your breath.', 1, NULL, NULL, 60, ARRAY['quadriceps'], 'beginner', 3, ARRAY['foam_roller'], true),
  ('Hamstring Foam Roll', 'hamstring-foam-roll', 'foam_roll', 'lower_body', 'Roll from just above the knee to the glute fold with controlled pressure.', 'Expect moderate pressure through the hamstrings.', 'Do not roll directly behind the knee joint.', 1, NULL, NULL, 60, ARRAY['hamstrings'], 'beginner', 3, ARRAY['foam_roller'], true),
  ('Calf Foam Roll', 'calf-foam-roll', 'foam_roll', 'lower_body', 'Roll from the Achilles upward toward the knee and pause on tight spots.', 'Expect steady pressure in the calf complex.', 'Do not grind directly on the Achilles tendon.', 1, NULL, NULL, 45, ARRAY['calves'], 'beginner', 2, ARRAY['foam_roller'], true),
  ('Upper Back Foam Roll', 'upper-back-foam-roll', 'foam_roll', 'upper_body', 'Roll across the thoracic spine with the neck supported and hips lightly elevated.', 'Expect pressure through the upper back and rib cage musculature.', 'Do not roll the lower back or jam the neck backward.', 1, NULL, NULL, 60, ARRAY['thoracic_spine', 'upper_back'], 'beginner', 3, ARRAY['foam_roller'], true),
  ('Leg Swings (Front-to-Back)', 'leg-swings-front-back', 'warm_up', 'dynamic_stretch', 'Use a wall for support and swing one leg front to back under control.', 'You should feel the hips and hamstrings opening dynamically.', 'Do not turn this into a ballistic kick.', 2, 10, NULL, NULL, ARRAY['hip_flexors', 'hamstrings'], 'beginner', 5, ARRAY['None'], true),
  ('A-Skips', 'a-skips', 'warm_up', 'running_drills', 'Skip forward with tall posture, quick contacts, and active knee drive.', 'You should feel coordinated rhythm and front-side mechanics.', 'Do not lean back or overstride.', 2, 20, NULL, NULL, ARRAY['hip_flexors', 'calves', 'core'], 'beginner', 8, ARRAY['None'], true),
  ('Lateral Shuffles', 'lateral-shuffles', 'warm_up', 'agility', 'Shuffle laterally in an athletic stance while keeping the feet apart.', 'You should feel the glutes and adductors waking up.', 'Do not click the feet together or rise tall through the hips.', 2, 20, NULL, NULL, ARRAY['glutes', 'adductors', 'quads'], 'beginner', 8, ARRAY['None'], true),
  ('Arm Circles', 'arm-circles', 'warm_up', 'upper_body', 'Move from small to larger circles in both directions while keeping ribs stacked.', 'You should feel the shoulders warming without strain.', 'Do not shrug or crank into painful end range.', 1, 10, NULL, NULL, ARRAY['shoulders', 'rotator_cuff'], 'beginner', 3, ARRAY['None'], true),
  ('Walking Cool-Down', 'walking-cool-down', 'cool_down', 'recovery', 'Walk at an easy pace and use long exhales to downshift after training.', 'Heart rate and breathing should settle gradually.', 'Do not stop abruptly after intense work.', 1, NULL, NULL, 120, ARRAY['cardiovascular'], 'beginner', 2, ARRAY['None'], true),
  ('Standing Calf Stretch', 'standing-calf-stretch', 'cool_down', 'static_stretch', 'Lean into a wall with the back heel planted and knee straight.', 'You should feel a steady stretch through the calf.', 'Do not let the heel lift or the foot turn out.', 1, 1, 30, NULL, ARRAY['calves'], 'beginner', 2, ARRAY['None'], true),
  ('Child''s Pose', 'childs-pose', 'recovery', 'relaxation', 'Sit back on the heels, reach long through the arms, and breathe slowly.', 'You should feel a gentle reset through the back, lats, and hips.', 'Do not force depth if the knees or hips feel restricted.', 1, 1, 60, NULL, ARRAY['back', 'lats', 'hips'], 'beginner', 2, ARRAY['None'], true);
