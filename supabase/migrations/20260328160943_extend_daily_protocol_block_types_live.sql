ALTER TABLE public.protocol_exercises
DROP CONSTRAINT IF EXISTS protocol_exercises_block_type_check;

ALTER TABLE public.protocol_exercises
ADD CONSTRAINT protocol_exercises_block_type_check
CHECK (
  block_type IN (
    'morning_mobility',
    'foam_roll',
    'warm_up',
    'main_session',
    'cool_down',
    'evening_recovery',
    'isometrics',
    'plyometrics',
    'strength',
    'conditioning',
    'skill_drills',
    'rehab_exercises',
    'rehab_progression',
    'evening_mobility'
  )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'isometrics_status'
  ) THEN
    ALTER TABLE public.daily_protocols
      ADD COLUMN isometrics_status text DEFAULT 'pending'
      CHECK (isometrics_status IN ('pending', 'in_progress', 'complete', 'skipped'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'plyometrics_status'
  ) THEN
    ALTER TABLE public.daily_protocols
      ADD COLUMN plyometrics_status text DEFAULT 'pending'
      CHECK (plyometrics_status IN ('pending', 'in_progress', 'complete', 'skipped'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'strength_status'
  ) THEN
    ALTER TABLE public.daily_protocols
      ADD COLUMN strength_status text DEFAULT 'pending'
      CHECK (strength_status IN ('pending', 'in_progress', 'complete', 'skipped'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'conditioning_status'
  ) THEN
    ALTER TABLE public.daily_protocols
      ADD COLUMN conditioning_status text DEFAULT 'pending'
      CHECK (conditioning_status IN ('pending', 'in_progress', 'complete', 'skipped'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'skill_drills_status'
  ) THEN
    ALTER TABLE public.daily_protocols
      ADD COLUMN skill_drills_status text DEFAULT 'pending'
      CHECK (skill_drills_status IN ('pending', 'in_progress', 'complete', 'skipped'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'warm_up_status'
  ) THEN
    ALTER TABLE public.daily_protocols
      ADD COLUMN warm_up_status text DEFAULT 'pending'
      CHECK (warm_up_status IN ('pending', 'in_progress', 'complete', 'skipped'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'cool_down_status'
  ) THEN
    ALTER TABLE public.daily_protocols
      ADD COLUMN cool_down_status text DEFAULT 'pending'
      CHECK (cool_down_status IN ('pending', 'in_progress', 'complete', 'skipped'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'isometrics_completed_at'
  ) THEN
    ALTER TABLE public.daily_protocols ADD COLUMN isometrics_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'plyometrics_completed_at'
  ) THEN
    ALTER TABLE public.daily_protocols ADD COLUMN plyometrics_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'strength_completed_at'
  ) THEN
    ALTER TABLE public.daily_protocols ADD COLUMN strength_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'conditioning_completed_at'
  ) THEN
    ALTER TABLE public.daily_protocols ADD COLUMN conditioning_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'skill_drills_completed_at'
  ) THEN
    ALTER TABLE public.daily_protocols ADD COLUMN skill_drills_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'warm_up_completed_at'
  ) THEN
    ALTER TABLE public.daily_protocols ADD COLUMN warm_up_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_protocols' AND column_name = 'cool_down_completed_at'
  ) THEN
    ALTER TABLE public.daily_protocols ADD COLUMN cool_down_completed_at timestamptz;
  END IF;
END $$;
