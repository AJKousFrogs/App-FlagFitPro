-- Cluster 1: Authority/Clinical identity standardization → user_id
-- RLS policies, FKs, indexes auto-update on RENAME (parsed deps). Function body fixed below.

ALTER TABLE public.injuries                     RENAME COLUMN player_id  TO user_id;
ALTER TABLE public.coach_overrides              RENAME COLUMN player_id  TO user_id;   -- keep coach_id (author)
ALTER TABLE public.coach_athlete_assignments    RENAME COLUMN athlete_id TO user_id;   -- keep coach_id
ALTER TABLE public.safety_override_log          RENAME COLUMN athlete_id TO user_id;
ALTER TABLE public.recovery_blocks              RENAME COLUMN player_id  TO user_id;
ALTER TABLE public.recovery_sessions            RENAME COLUMN athlete_id TO user_id;

-- return_to_play_protocols: athlete_id is the live key (in RLS), player_id is a dead dup
ALTER TABLE public.return_to_play_protocols     RENAME COLUMN athlete_id TO user_id;
ALTER TABLE public.return_to_play_protocols     DROP COLUMN player_id;

-- Function body referenced safety_override_log.athlete_id (text body, not auto-updated).
-- Keep param name p_athlete_id (callers pass it by that name); fix the column reference only.
CREATE OR REPLACE FUNCTION public.has_active_safety_override(p_athlete_id uuid, p_data_type text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.safety_override_log
        WHERE user_id = p_athlete_id
        AND override_timestamp >= NOW() - INTERVAL '7 days'
        AND (
            p_data_type IS NULL
            OR (
                p_data_type = 'pain' AND trigger_type IN ('pain_above_3', 'new_pain_area', 'worsening_pain')
                OR p_data_type = 'acwr' AND trigger_type = 'acwr_danger_zone'
            )
        )
    );
END;
$function$;
