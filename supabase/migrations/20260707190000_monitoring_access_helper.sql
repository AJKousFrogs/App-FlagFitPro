-- Monitoring: role-scoped roster read helper (additive, one concern).
-- can_role_read_athlete(athlete, roles[]) = the caller holds one of `roles` on a
-- team where `athlete` is a roster athlete (role='athlete'), per the Prompt-2
-- team_member_roles primitive. SECURITY DEFINER so it can see the SUBJECT's
-- membership row (hidden from the caller by team_member_roles self-read RLS).
--
-- Reversal: DROP FUNCTION IF EXISTS public.can_role_read_athlete(uuid, text[]);

CREATE OR REPLACE FUNCTION public.can_role_read_athlete(p_athlete uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_member_roles caller
    JOIN team_member_roles subject
      ON subject.team_id = caller.team_id AND subject.role = 'athlete'
    WHERE caller.user_id = (SELECT auth.uid())
      AND caller.role = ANY (p_roles)
      AND subject.user_id = p_athlete
  );
$$;
REVOKE ALL ON FUNCTION public.can_role_read_athlete(uuid, text[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_role_read_athlete(uuid, text[]) TO authenticated;
