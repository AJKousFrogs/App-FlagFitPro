BEGIN;

DROP POLICY IF EXISTS "merged_select_team_invitations_public" ON public.team_invitations;
DROP POLICY IF EXISTS "merged_update_team_invitations_public" ON public.team_invitations;
DROP POLICY IF EXISTS "Coaches can view invitations for their teams" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.team_invitations;
DROP POLICY IF EXISTS "Coaches can create invitations for their teams" ON public.team_invitations;
DROP POLICY IF EXISTS "Coaches can update invitations for their teams" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON public.team_invitations;

CREATE POLICY "Coaches can view invitations for their teams"
    ON public.team_invitations
    FOR SELECT
    TO authenticated
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Invitees can view invitations sent to their email"
    ON public.team_invitations
    FOR SELECT
    TO authenticated
    USING (
        lower(email) = lower(
            COALESCE(
                (
                    SELECT users.email
                    FROM auth.users
                    WHERE users.id = (SELECT auth.uid())
                ),
                ''
            )
        )
    );

CREATE POLICY "Coaches can create invitations for their teams"
    ON public.team_invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
        AND invited_by = (SELECT auth.uid())
    );

CREATE POLICY "Coaches can update invitations for their teams"
    ON public.team_invitations
    FOR UPDATE
    TO authenticated
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = (SELECT auth.uid())
        )
    );

CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_invitation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_user_email text;
    v_invitation public.team_invitations%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
    END IF;

    SELECT users.email
    INTO v_user_email
    FROM auth.users
    WHERE users.id = v_user_id;

    IF COALESCE(trim(v_user_email), '') = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unable to verify invitation email');
    END IF;

    SELECT *
    INTO v_invitation
    FROM public.team_invitations
    WHERE id = p_invitation_id
      AND lower(email) = lower(v_user_email)
      AND status = 'pending'
      AND expires_at > now()
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
    END IF;

    UPDATE public.team_invitations
    SET status = 'accepted',
        accepted_at = now(),
        updated_at = now()
    WHERE id = v_invitation.id;

    INSERT INTO public.team_members (
        team_id,
        user_id,
        role,
        status,
        joined_at,
        created_at,
        updated_at
    )
    VALUES (
        v_invitation.team_id,
        v_user_id,
        COALESCE(v_invitation.role, 'player'),
        'active',
        now(),
        now(),
        now()
    )
    ON CONFLICT (user_id, team_id) DO UPDATE
    SET role = EXCLUDED.role,
        status = 'active',
        updated_at = now();

    RETURN jsonb_build_object(
        'success', true,
        'team_id', v_invitation.team_id,
        'role', COALESCE(v_invitation.role, 'player')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_team_invitation(p_invitation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_user_email text;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
    END IF;

    SELECT users.email
    INTO v_user_email
    FROM auth.users
    WHERE users.id = v_user_id;

    IF COALESCE(trim(v_user_email), '') = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unable to verify invitation email');
    END IF;

    UPDATE public.team_invitations
    SET status = 'declined',
        updated_at = now()
    WHERE id = p_invitation_id
      AND lower(email) = lower(v_user_email)
      AND status = 'pending'
      AND expires_at > now();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_team_invitation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decline_team_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_team_invitation(uuid) TO authenticated;

COMMENT ON FUNCTION public.accept_team_invitation(uuid) IS
'Accepts a pending invitation for the signed-in user and creates or reactivates their team membership.';

COMMENT ON FUNCTION public.decline_team_invitation(uuid) IS
'Declines a pending invitation for the signed-in user.';

COMMIT;
