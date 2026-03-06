-- Seed the minimum training catalog required by onboarding and program switching.

INSERT INTO public.positions (name, display_name, description)
VALUES
  ('QB', 'Quarterback', 'Field general responsible for passing, timing, and leadership.'),
  ('WR', 'Wide Receiver', 'Primary route runner and pass catcher.'),
  ('DB', 'Defensive Back', 'Coverage specialist focused on agility and ball skills.'),
  ('Center', 'Center', 'Snaps the ball and anchors the middle of the formation.'),
  ('LB', 'Linebacker', 'Hybrid defender responsible for coverage and pursuit.'),
  ('Blitzer', 'Blitzer', 'Pass-rush specialist for pressure packages.')
ON CONFLICT (name) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO public.training_programs (
  id,
  name,
  position_id,
  description,
  program_type,
  difficulty_level,
  duration_weeks,
  sessions_per_week,
  start_date,
  end_date,
  is_template,
  is_active
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'QB Annual Program 2025-2026',
    (SELECT id FROM public.positions WHERE name = 'QB'),
    'Annual quarterback development plan covering throwing workload progression, strength, and game-readiness.',
    'annual',
    'intermediate',
    52,
    4,
    DATE '2025-11-01',
    DATE '2026-10-31',
    false,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'WR/DB Speed & Agility Program 2025-2026',
    (SELECT id FROM public.positions WHERE name = 'WR'),
    'Annual wide receiver and defensive back plan focused on speed, change of direction, and reactive agility.',
    'annual',
    'intermediate',
    48,
    4,
    DATE '2025-12-01',
    DATE '2026-10-31',
    false,
    true
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  position_id = EXCLUDED.position_id,
  description = EXCLUDED.description,
  program_type = EXCLUDED.program_type,
  difficulty_level = EXCLUDED.difficulty_level,
  duration_weeks = EXCLUDED.duration_weeks,
  sessions_per_week = EXCLUDED.sessions_per_week,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  is_template = EXCLUDED.is_template,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
