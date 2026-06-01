ALTER TABLE public.player_programs
  ALTER COLUMN modifications SET DEFAULT '{}'::jsonb;

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
