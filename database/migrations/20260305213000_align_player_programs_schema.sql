-- Align player_programs with the application contract.
-- The live project skipped older structural migrations, so this table is missing
-- the program_id foreign key, user_id, and status-oriented fields expected by
-- the app and PostgREST relation cache.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'program_status_enum'
  ) THEN
    CREATE TYPE public.program_status_enum AS ENUM (
      'active',
      'paused',
      'completed',
      'inactive'
    );
  END IF;
END $$;

ALTER TABLE public.player_programs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_position_id uuid REFERENCES public.positions(id),
  ADD COLUMN IF NOT EXISTS status public.program_status_enum DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS paused_reason text,
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_timezone varchar(50) DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS current_week integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_phase_id uuid REFERENCES public.training_phases(id),
  ADD COLUMN IF NOT EXISTS completion_percentage numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS modifications jsonb;

ALTER TABLE public.player_programs
  ALTER COLUMN modifications SET DEFAULT '{}'::jsonb;

UPDATE public.player_programs
SET
  user_id = COALESCE(user_id, player_id),
  status = COALESCE(
    status,
    CASE
      WHEN COALESCE(is_active, false) THEN 'active'::public.program_status_enum
      ELSE 'inactive'::public.program_status_enum
    END
  ),
  current_week = COALESCE(current_week, 1),
  completion_percentage = COALESCE(completion_percentage, 0),
  modifications = COALESCE(modifications, '{}'::jsonb)
WHERE
  user_id IS NULL
  OR status IS NULL
  OR current_week IS NULL
  OR completion_percentage IS NULL
  OR modifications IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'player_programs_program_id_fkey'
      AND conrelid = 'public.player_programs'::regclass
  ) THEN
    ALTER TABLE public.player_programs
      ADD CONSTRAINT player_programs_program_id_fkey
      FOREIGN KEY (program_id)
      REFERENCES public.training_programs(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_player_programs_user_id
  ON public.player_programs(user_id);

CREATE INDEX IF NOT EXISTS idx_player_programs_status
  ON public.player_programs(status);

CREATE UNIQUE INDEX IF NOT EXISTS player_programs_one_active_per_player
  ON public.player_programs(player_id)
  WHERE is_active = true;

CREATE OR REPLACE FUNCTION public.sync_player_programs_activity_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  status_changed boolean := false;
  is_active_changed boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    status_changed := NEW.status IS DISTINCT FROM OLD.status;
    is_active_changed := NEW.is_active IS DISTINCT FROM OLD.is_active;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NULL AND NEW.is_active IS NULL THEN
      NEW.status := 'active'::public.program_status_enum;
      NEW.is_active := true;
    ELSIF NEW.status IS NULL THEN
      NEW.status := CASE
        WHEN COALESCE(NEW.is_active, false) THEN 'active'::public.program_status_enum
        ELSE 'inactive'::public.program_status_enum
      END;
    ELSIF NEW.is_active IS NULL THEN
      NEW.is_active := NEW.status = 'active'::public.program_status_enum;
    ELSIF NEW.is_active <> (NEW.status = 'active'::public.program_status_enum) THEN
      NEW.is_active := NEW.status = 'active'::public.program_status_enum;
    END IF;
  ELSE
    IF NEW.status IS NULL THEN
      NEW.status := CASE
        WHEN COALESCE(NEW.is_active, OLD.is_active, true) THEN 'active'::public.program_status_enum
        ELSE 'inactive'::public.program_status_enum
      END;
    END IF;

    IF NEW.is_active IS NULL THEN
      NEW.is_active := NEW.status = 'active'::public.program_status_enum;
    END IF;

    IF status_changed AND NOT is_active_changed THEN
      NEW.is_active := NEW.status = 'active'::public.program_status_enum;
    ELSIF is_active_changed AND NOT status_changed THEN
      NEW.status := CASE
        WHEN NEW.is_active THEN 'active'::public.program_status_enum
        ELSE 'inactive'::public.program_status_enum
      END;
    ELSIF status_changed AND is_active_changed THEN
      NEW.is_active := NEW.status = 'active'::public.program_status_enum;
    ELSIF NEW.is_active <> (NEW.status = 'active'::public.program_status_enum) THEN
      NEW.is_active := NEW.status = 'active'::public.program_status_enum;
    END IF;
  END IF;

  NEW.user_id := COALESCE(NEW.user_id, NEW.player_id);
  NEW.current_week := COALESCE(NEW.current_week, 1);
  NEW.completion_percentage := COALESCE(NEW.completion_percentage, 0);
  NEW.modifications := COALESCE(NEW.modifications, '{}'::jsonb);
  NEW.assigned_timezone := COALESCE(NEW.assigned_timezone, 'UTC');
  NEW.updated_at := COALESCE(NEW.updated_at, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_player_programs_activity_state
ON public.player_programs;

CREATE TRIGGER sync_player_programs_activity_state
BEFORE INSERT OR UPDATE
ON public.player_programs
FOR EACH ROW
EXECUTE FUNCTION public.sync_player_programs_activity_state();

NOTIFY pgrst, 'reload schema';
