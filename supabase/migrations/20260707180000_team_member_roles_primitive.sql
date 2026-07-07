-- Team-member ROLE primitive (additive, one concern, unwired).
-- team_members already carries membership but its UNIQUE (team_id, user_id)
-- index (team_members_team_id_user_id_key) permits only ONE role per person
-- per team — it cannot express a member who holds several roles (e.g. a physio
-- who also plays, or a head coach who also runs S&C). This table sits BESIDE
-- team_members. Nothing is altered; nothing is wired to it yet.
--
-- Reversal (nothing depends on it):
--   DROP FUNCTION IF EXISTS public.has_team_role(uuid, text);
--   DROP FUNCTION IF EXISTS public.team_roles_for(uuid);
--   DROP TABLE IF EXISTS public.team_member_roles;

CREATE TABLE IF NOT EXISTS public.team_member_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES public.teams(id)  ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE, -- = auth.uid()
  role       text NOT NULL CHECK (role IN ('athlete','head_coach','sc_coach','physio')),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- multiple roles per (team,user) are allowed; each role only once.
  UNIQUE (team_id, user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_team_member_roles_user
  ON public.team_member_roles (user_id, team_id);

ALTER TABLE public.team_member_roles ENABLE ROW LEVEL SECURITY;

-- A member may read only their OWN role rows. Granting roles to others is a
-- later, deliberate concern — not part of this primitive.
CREATE POLICY team_member_roles_self_read ON public.team_member_roles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Caller's roles on a team, as a text[] (empty array if none). SECURITY INVOKER:
-- it only ever reads the caller's own rows, which the self_read policy already
-- permits — so no elevated privilege and no security-advisor flag. Safe to call
-- from inside other tables' RLS policies later.
CREATE OR REPLACE FUNCTION public.team_roles_for(p_team uuid)
RETURNS text[]
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role ORDER BY role), ARRAY[]::text[])
  FROM team_member_roles
  WHERE team_id = p_team AND user_id = (SELECT auth.uid());
$$;
REVOKE ALL ON FUNCTION public.team_roles_for(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.team_roles_for(uuid) TO authenticated;

-- Convenience predicate for future policies: does the caller hold p_role here?
CREATE OR REPLACE FUNCTION public.has_team_role(p_team uuid, p_role text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_member_roles
    WHERE team_id = p_team AND user_id = (SELECT auth.uid()) AND role = p_role
  );
$$;
REVOKE ALL ON FUNCTION public.has_team_role(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_team_role(uuid, text) TO authenticated;
