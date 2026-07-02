-- Close the KB↔exercise-library gap: the knowledge base's isometrics→plyometrics
-- progression content references box jumps, broad jumps, and depth jumps, but the
-- Power category only had unilateral/lateral work (bounds, skater jumps, hops).
-- Adds the standard bilateral plyo progression: Box Jump (entry) → Standing Broad
-- Jump (intermediate) → Depth Jump (advanced, shock method — Verkhoshansky).
-- video_id intentionally NULL — no fabricated video references; add real curated
-- videos via the normal content flow.

INSERT INTO public.exercises
  (name, slug, category, movement_pattern, description, equipment_needed,
   metrics_tracked, how_text, feel_text, compensation_text, load_contribution_au,
   difficulty_level, default_sets, default_reps, active, is_high_intensity)
SELECT v.* FROM (VALUES
  ('Box Jump', 'box-jump', 'Power', 'Vertical',
   'Bilateral vertical plyometric onto a box — explosive hip extension with a low-impact landing. The entry point of the bilateral plyo progression.',
   '{"Plyo Box"}'::text[], '{Sets,Reps,Height}'::text[],
   'Stand a short step from the box. Swing the arms and jump onto the box, landing softly in a quarter squat with the whole foot on the surface. Step down — never jump down.',
   'Explosive push through the floor with a quiet, controlled landing on top.',
   'Do not land in a deep squat or let the knees cave — lower the box height instead.',
   12, 'moderate', 3, 5, true, true),
  ('Standing Broad Jump', 'standing-broad-jump', 'Power', 'Horizontal',
   'Bilateral horizontal jump for hip power and landing absorption — the horizontal step of the plyo progression.',
   '{None}'::text[], '{Sets,Reps,Distance}'::text[],
   'Load the hips with an arm swing and jump forward for maximal distance, landing softly with knees tracking over toes. Stick each landing before resetting.',
   'Powerful hip extension into a stable, absorbed landing.',
   'Do not let the knees collapse inward or rebound immediately out of the landing.',
   12, 'moderate', 3, 5, true, true),
  ('Depth Jump', 'depth-jump', 'Power', 'Reactive',
   'Advanced shock-method plyometric: step off a low box and rebound immediately for maximal reactive stiffness. Progress here only after mastering box and broad jumps.',
   '{"Plyo Box"}'::text[], '{Sets,Reps,"Contact Time"}'::text[],
   'Step (do not jump) off a low box, land on both feet, and rebound upward as fast as possible with minimal ground contact time.',
   'A crisp, springy rebound — ground contact should feel like a bounce, not a squat.',
   'If contacts feel slow or heavy, lower the box or return to box jumps — fatigue kills the training effect and raises injury risk.',
   16, 'advanced', 3, 4, true, true)
) AS v(name, slug, category, movement_pattern, description, equipment_needed,
       metrics_tracked, how_text, feel_text, compensation_text, load_contribution_au,
       difficulty_level, default_sets, default_reps, active, is_high_intensity)
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises e WHERE e.name = v.name AND e.category = v.category
);
