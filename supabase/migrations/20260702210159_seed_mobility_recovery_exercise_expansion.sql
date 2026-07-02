-- mobility_recovery: 5 new exercise-catalog rows.
-- Source: Ljubljana Frogs 2026 Summer Pre-Season Program (physio-approved
-- 9-week block) + standard flag-football S&C/technical drill taxonomy.
-- Idempotent on (name, category) via WHERE NOT EXISTS (no unique constraint
-- exists on exercises besides the id PK).

INSERT INTO public.exercises (name, slug, category, subcategory, movement_pattern, description, video_id,
   equipment_needed, position_specific, applicable_positions, metrics_tracked,
   how_text, feel_text, compensation_text, load_contribution_au, muscle_groups,
   target_muscles, difficulty_level, default_sets, default_reps, default_hold_seconds,
   active, is_high_intensity)
SELECT v.* FROM (VALUES
  ('Thoracic Rotation Drill (Standing)', 'thoracic-rotation-drill-standing', 'mobility', 'spine_mobility', 'Mobility', 'Standing rotational mobility drill for the upper back -- supports throwing mechanics and general trunk rotation range.', NULL, NULL::text[], NULL::text[], NULL::uuid[], '{"Reps"}'::text[], 'Stand with knees soft and hips facing forward, rotate the upper back and arms side to side as far as comfortable while keeping the hips still.', 'An opening stretch through the mid and upper back with the hips staying quiet.', 'Do not let the hips rotate along with the shoulders; isolate the movement to the thoracic spine.', 3, NULL::text[], NULL::text[], 'beginner', 1, 12, NULL::integer, true, false),
  ('90/90 Hip Switch', '90-90-hip-switch', 'mobility', 'hip_mobility', 'Mobility', 'Seated hip internal/external rotation switch -- builds the hip rotation range used in route breaks, hip flips, and backpedal transitions.', NULL, NULL::text[], NULL::text[], NULL::uuid[], '{"Reps"}'::text[], 'Sit with both knees bent at 90 degrees, one leg rotated in front and one to the side. Lift both knees and switch the leg positions, landing in the mirrored 90/90 position.', 'A deep hip rotation stretch on both sides as the legs switch position.', 'Do not use the hands to muscle the switch; let the hips do the rotating.', 4, NULL::text[], NULL::text[], 'moderate', 1, 10, NULL::integer, true, false),
  ('Deep Squat Hold (Mobility)', 'deep-squat-hold-mobility', 'mobility', 'hip_mobility', 'Mobility', 'Sustained bodyweight deep-squat hold -- opens the ankles, hips, and lower back as a mobility restorative, distinct from the Isometric-category strength squat holds.', NULL, NULL::text[], NULL::text[], NULL::uuid[], '{"Duration"}'::text[], 'Lower into the deepest comfortable squat with heels flat, and hold the position, using the elbows to gently press the knees outward if needed.', 'A deep, releasing stretch through the ankles, hips, and groin the longer the hold continues.', 'Do not let the heels lift off the ground; regress the depth until the heels can stay flat.', 2, NULL::text[], NULL::text[], 'beginner', 2, NULL::integer, 45, true, false),
  ('Foam Roll -- Glutes', 'foam-roll-glutes', 'foam_roll', 'lower_body', NULL, 'Self-myofascial release for the glutes -- complements the existing quad/hamstring/calf foam-roll set.', NULL, '{"Foam Roller"}'::text[], NULL::text[], NULL::uuid[], '{"Duration"}'::text[], 'Sit on the foam roller with one ankle crossed over the opposite knee, lean into the glute of the crossed leg, and roll slowly, pausing on tender spots.', 'Pressure and release through the glute, easing as you continue to roll and breathe.', 'Do not rush the roll; slow, sustained pressure works better than fast passes.', 1, NULL::text[], NULL::text[], 'beginner', 1, NULL::integer, 60, true, false),
  ('Foam Roll -- Thoracic Spine', 'foam-roll-thoracic-spine', 'foam_roll', 'upper_body', NULL, 'Self-myofascial release for the upper back -- complements the existing upper-back foam-roll entry with a distinct thoracic-extension focus.', NULL, '{"Foam Roller"}'::text[], NULL::text[], NULL::uuid[], '{"Duration"}'::text[], 'Lie with the foam roller under the shoulder blades, support the head with the hands, and gently extend back over the roller, rolling slowly up and down the upper back.', 'A releasing pressure through the upper back with a gentle opening feeling across the chest as you extend.', 'Do not roll onto the lower back or neck; keep the roller under the shoulder blade region only.', 1, NULL::text[], NULL::text[], 'beginner', 1, NULL::integer, 60, true, false)
) AS v (name, slug, category, subcategory, movement_pattern, description, video_id,
   equipment_needed, position_specific, applicable_positions, metrics_tracked,
   how_text, feel_text, compensation_text, load_contribution_au, muscle_groups,
   target_muscles, difficulty_level, default_sets, default_reps, default_hold_seconds,
   active, is_high_intensity)
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises e WHERE e.name = v.name AND e.category = v.category
);
