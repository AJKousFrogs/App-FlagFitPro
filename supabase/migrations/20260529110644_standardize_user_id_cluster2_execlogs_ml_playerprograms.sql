-- Cluster 2: execution_logs, ml_training_data, player_programs → user_id

-- 1) execution_logs: athlete_id → user_id (rename auto-updates RLS/index; fix fn bodies below)
ALTER TABLE public.execution_logs RENAME COLUMN athlete_id TO user_id;

CREATE OR REPLACE FUNCTION public.get_executed_version(p_session_id uuid, p_athlete_id uuid)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_version INTEGER;
BEGIN
    SELECT session_version INTO v_version
    FROM public.execution_logs
    WHERE session_id = p_session_id AND user_id = p_athlete_id
    ORDER BY logged_at ASC LIMIT 1;
    RETURN COALESCE(v_version, 1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_late_execution_data(p_session_id uuid, p_athlete_id uuid, p_exercise_name text, p_sets_completed integer, p_reps_completed integer, p_rpe integer, p_logged_at timestamp with time zone DEFAULT now())
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_log_id UUID; v_session_version INTEGER;
BEGIN
    v_session_version := public.get_executed_version(p_session_id, p_athlete_id);
    INSERT INTO public.execution_logs (session_id, session_version, user_id, exercise_name, sets_completed, reps_completed, rpe, logged_at)
    VALUES (p_session_id, v_session_version, p_athlete_id, p_exercise_name, p_sets_completed, p_reps_completed, p_rpe, p_logged_at)
    RETURNING log_id INTO v_log_id;
    RETURN v_log_id;
END;
$function$;

-- 2) ml_training_data: player_id → user_id (pure rename, no code/fn refs)
ALTER TABLE public.ml_training_data RENAME COLUMN player_id TO user_id;

-- 3) player_programs: drop the player_id duplicate (user_id is canonical), rewrite sync trigger fn
UPDATE public.player_programs SET user_id = COALESCE(user_id, player_id) WHERE user_id IS NULL;
ALTER TABLE public.player_programs DROP COLUMN player_id;

CREATE OR REPLACE FUNCTION public.sync_player_programs_activity_state()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
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
      NEW.status := CASE WHEN COALESCE(NEW.is_active, false) THEN 'active'::public.program_status_enum ELSE 'inactive'::public.program_status_enum END;
    ELSIF NEW.is_active IS NULL THEN
      NEW.is_active := NEW.status = 'active'::public.program_status_enum;
    ELSIF NEW.is_active <> (NEW.status = 'active'::public.program_status_enum) THEN
      NEW.is_active := NEW.status = 'active'::public.program_status_enum;
    END IF;
  ELSE
    IF NEW.status IS NULL THEN
      NEW.status := CASE WHEN COALESCE(NEW.is_active, OLD.is_active, true) THEN 'active'::public.program_status_enum ELSE 'inactive'::public.program_status_enum END;
    END IF;
    IF NEW.is_active IS NULL THEN
      NEW.is_active := NEW.status = 'active'::public.program_status_enum;
    END IF;
    IF status_changed AND NOT is_active_changed THEN
      NEW.is_active := NEW.status = 'active'::public.program_status_enum;
    ELSIF is_active_changed AND NOT status_changed THEN
      NEW.status := CASE WHEN NEW.is_active THEN 'active'::public.program_status_enum ELSE 'inactive'::public.program_status_enum END;
    ELSIF status_changed AND is_active_changed THEN
      NEW.is_active := NEW.status = 'active'::public.program_status_enum;
    ELSIF NEW.is_active <> (NEW.status = 'active'::public.program_status_enum) THEN
      NEW.is_active := NEW.status = 'active'::public.program_status_enum;
    END IF;
  END IF;

  -- (player_id dropped; user_id is the canonical owner column — no id coalesce needed)
  NEW.current_week := COALESCE(NEW.current_week, 1);
  NEW.completion_percentage := COALESCE(NEW.completion_percentage, 0);
  NEW.modifications := COALESCE(NEW.modifications, '{}'::jsonb);
  NEW.assigned_timezone := COALESCE(NEW.assigned_timezone, 'UTC');
  NEW.updated_at := COALESCE(NEW.updated_at, now());
  RETURN NEW;
END;
$function$;
