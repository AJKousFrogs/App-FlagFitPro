-- Cluster 1 of the identity standardization: Authority / Clinical tables → user_id
-- (= auth.uid()), per docs/ATHLETE_ID_CONVENTION.md + docs/ENGINE_CONTRACT.md §1.
-- Applied via Supabase MCP on 2026-05-29 (project grfjmnjpzvknmsxrwesx).
--
-- Rule: the column identifying THE ATHLETE → user_id; coach_id (the author/actor)
-- is kept role-qualified. RLS policies, FK constraints and indexes auto-update on a
-- column RENAME (stored as parsed dependencies); only plpgsql function/trigger BODIES
-- (stored as text) and application code need manual repoint.
--
-- Latent bugs this fixes: the live code already queried injuries and recovery_sessions
-- with .eq("user_id", ...) while those tables were keyed player_id / athlete_id — so
-- every such read/write silently returned nothing or errored. The rename makes the
-- code correct. (Non-id column mismatches in dormant clinical features — e.g. injuries
-- select "type"/"start_date" vs schema injury_type/injury_date — are tracked separately
-- and fixed at port with real intent, not blind-guessed here.)

ALTER TABLE public.injuries                     RENAME COLUMN player_id  TO user_id;
ALTER TABLE public.coach_overrides              RENAME COLUMN player_id  TO user_id;   -- keep coach_id (author)
ALTER TABLE public.coach_athlete_assignments    RENAME COLUMN athlete_id TO user_id;   -- keep coach_id
ALTER TABLE public.safety_override_log          RENAME COLUMN athlete_id TO user_id;
ALTER TABLE public.recovery_blocks              RENAME COLUMN player_id  TO user_id;
ALTER TABLE public.recovery_sessions            RENAME COLUMN athlete_id TO user_id;

-- return_to_play_protocols carried BOTH athlete_id (the live key, used by RLS) and a
-- dead duplicate player_id, with no user_id. Promote athlete_id → user_id, drop the dup.
ALTER TABLE public.return_to_play_protocols     RENAME COLUMN athlete_id TO user_id;
ALTER TABLE public.return_to_play_protocols     DROP COLUMN player_id;

-- Function body referenced safety_override_log.athlete_id (text body, not auto-updated by
-- the rename). Keep the param name p_athlete_id (callers pass it by name); fix the column.
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
