-- Align the training template and exercise library schema with the runtime model.
-- The app treats training_sessions as athlete logs and training_session_templates
-- as the scheduled program catalog.

CREATE TABLE IF NOT EXISTS public.training_session_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  week_id uuid NOT NULL REFERENCES public.training_weeks(id) ON DELETE CASCADE,
  session_name varchar(255) NOT NULL,
  session_type varchar(100),
  day_of_week integer NOT NULL,
  session_order integer NOT NULL DEFAULT 1,
  duration_minutes integer,
  intensity_level text,
  description text,
  warm_up_protocol text,
  notes text,
  equipment_needed text[],
  is_team_practice boolean DEFAULT false,
  is_outdoor boolean DEFAULT false,
  weather_sensitive boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT training_session_templates_day_of_week_check
    CHECK (day_of_week BETWEEN 0 AND 6)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_training_phases_program_phase_order
  ON public.training_phases(program_id, phase_order);

CREATE UNIQUE INDEX IF NOT EXISTS uq_training_weeks_phase_week_number
  ON public.training_weeks(phase_id, week_number);

CREATE UNIQUE INDEX IF NOT EXISTS uq_training_session_templates_week_day_order
  ON public.training_session_templates(week_id, day_of_week, session_order);

CREATE INDEX IF NOT EXISTS idx_training_session_templates_program
  ON public.training_session_templates(program_id);

CREATE INDEX IF NOT EXISTS idx_training_session_templates_week
  ON public.training_session_templates(week_id);

CREATE OR REPLACE FUNCTION public.set_training_session_templates_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'training_session_templates_set_updated_at'
  ) THEN
    CREATE TRIGGER training_session_templates_set_updated_at
      BEFORE UPDATE ON public.training_session_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.set_training_session_templates_updated_at();
  END IF;
END $$;

ALTER TABLE public.session_exercises
  ALTER COLUMN session_id DROP NOT NULL;

ALTER TABLE public.session_exercises
  ADD COLUMN IF NOT EXISTS session_template_id uuid REFERENCES public.training_session_templates(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS exercise_name text,
  ADD COLUMN IF NOT EXISTS load_type varchar(50),
  ADD COLUMN IF NOT EXISTS load_value numeric(10,2),
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS distance_meters integer,
  ADD COLUMN IF NOT EXISTS load_description text,
  ADD COLUMN IF NOT EXISTS load_percentage numeric(6,2),
  ADD COLUMN IF NOT EXISTS tempo text,
  ADD COLUMN IF NOT EXISTS intensity text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'session_exercises'
      AND column_name = 'reps'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.session_exercises
      ALTER COLUMN reps TYPE text USING reps::text;
  END IF;
END $$;

UPDATE public.session_exercises
SET
  distance_meters = COALESCE(distance_meters, distance),
  duration_seconds = COALESCE(duration_seconds, duration_minutes * 60),
  load_value = COALESCE(load_value, weight)
WHERE distance_meters IS NULL OR duration_seconds IS NULL OR load_value IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_session_exercises_template_order
  ON public.session_exercises(session_template_id, exercise_order);

CREATE INDEX IF NOT EXISTS idx_session_exercises_template_id
  ON public.session_exercises(session_template_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'session_exercises'
      AND constraint_name = 'session_exercises_requires_parent_session_check'
  ) THEN
    ALTER TABLE public.session_exercises
      ADD CONSTRAINT session_exercises_requires_parent_session_check
      CHECK (session_id IS NOT NULL OR session_template_id IS NOT NULL);
  END IF;
END $$;

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS video_id text,
  ADD COLUMN IF NOT EXISTS video_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS how_text text,
  ADD COLUMN IF NOT EXISTS feel_text text,
  ADD COLUMN IF NOT EXISTS compensation_text text,
  ADD COLUMN IF NOT EXISTS load_contribution_au integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS instructions text[],
  ADD COLUMN IF NOT EXISTS coaching_cues text[],
  ADD COLUMN IF NOT EXISTS muscle_groups text[],
  ADD COLUMN IF NOT EXISTS difficulty_level text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS default_sets integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS default_reps integer,
  ADD COLUMN IF NOT EXISTS default_hold_seconds integer,
  ADD COLUMN IF NOT EXISTS default_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS target_muscles text[],
  ADD COLUMN IF NOT EXISTS equipment_required text[],
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_high_intensity boolean DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exercises'
      AND column_name = 'position_specific'
      AND data_type = 'boolean'
  ) THEN
    ALTER TABLE public.exercises
      ALTER COLUMN position_specific DROP DEFAULT;

    ALTER TABLE public.exercises
      ALTER COLUMN position_specific TYPE text[]
      USING CASE
        WHEN position_specific IS TRUE THEN ARRAY['legacy']::text[]
        ELSE NULL
      END;
  END IF;
END $$;

UPDATE public.exercises
SET
  slug = COALESCE(
    slug,
    NULLIF(
      regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'),
      ''
    )
  ),
  equipment_required = COALESCE(equipment_required, equipment_needed),
  active = COALESCE(active, true),
  load_contribution_au = COALESCE(load_contribution_au, 0),
  default_sets = COALESCE(default_sets, 1),
  coaching_cues = COALESCE(coaching_cues, ARRAY[]::text[]),
  instructions = COALESCE(instructions, ARRAY[]::text[]),
  muscle_groups = COALESCE(muscle_groups, ARRAY[]::text[]),
  target_muscles = COALESCE(target_muscles, ARRAY[]::text[]);

CREATE UNIQUE INDEX IF NOT EXISTS uq_exercises_slug
  ON public.exercises(slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exercises_active_category
  ON public.exercises(category)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_exercises_position_specific
  ON public.exercises USING gin(position_specific);

CREATE TABLE IF NOT EXISTS public.exercise_progressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  progression_type text NOT NULL,
  increment_value numeric(5,2),
  min_value numeric(5,2),
  max_value numeric(5,2),
  reset_threshold numeric(5,2),
  requires_completion boolean DEFAULT true,
  acwr_adjustment_factor numeric(3,2) DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_exercise_progressions_exercise_type
  ON public.exercise_progressions(exercise_id, progression_type);

CREATE OR REPLACE FUNCTION public.set_exercise_progressions_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'exercise_progressions_set_updated_at'
  ) THEN
    CREATE TRIGGER exercise_progressions_set_updated_at
      BEFORE UPDATE ON public.exercise_progressions
      FOR EACH ROW
      EXECUTE FUNCTION public.set_exercise_progressions_updated_at();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.movement_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.training_programs(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.warmup_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.training_programs(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_movement_patterns_program_name
  ON public.movement_patterns(program_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS uq_warmup_protocols_program_name
  ON public.warmup_protocols(program_id, name);

GRANT SELECT ON public.training_session_templates TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.training_session_templates TO authenticated, service_role;
GRANT SELECT ON public.exercise_progressions TO anon, authenticated, service_role;
GRANT SELECT ON public.movement_patterns TO anon, authenticated, service_role;
GRANT SELECT ON public.warmup_protocols TO anon, authenticated, service_role;
