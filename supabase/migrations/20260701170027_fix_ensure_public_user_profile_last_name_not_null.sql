-- ensure_public_user_profile derived last_name via substring-after-first-space,
-- which is NULL whenever the source (full_name, or email fallback) has no space --
-- true for any email-only auth user. users.last_name is NOT NULL, so the INSERT
-- threw for such users, blocking every RPC that calls this first (upsert_wellness_checkin,
-- log_training_session, etc). Wrap with COALESCE(..., 'Account') so it never NULLs out.
CREATE OR REPLACE FUNCTION public.ensure_public_user_profile(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    full_name,
    name,
    email_verified,
    is_active,
    onboarding_completed,
    last_login,
    updated_at
  )
  SELECT
    au.id,
    au.email,
    NULL,
    COALESCE(NULLIF(split_part(COALESCE(au.raw_user_meta_data ->> 'full_name', au.email, 'User Account'), ' ', 1), ''), 'User'),
    COALESCE(
      NULLIF(
        btrim(
          substring(COALESCE(au.raw_user_meta_data ->> 'full_name', au.email, 'User Account')
          FROM length(split_part(COALESCE(au.raw_user_meta_data ->> 'full_name', au.email, 'User Account'), ' ', 1)) + 1)
        ),
        ''
      ),
      'Account'
    ),
    COALESCE(au.raw_user_meta_data ->> 'full_name', au.email, 'User Account'),
    COALESCE(au.raw_user_meta_data ->> 'full_name', au.email, 'User Account'),
    au.email_confirmed_at IS NOT NULL,
    true,
    false,
    au.last_sign_in_at,
    now()
  FROM auth.users au
  WHERE au.id = p_user_id
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = now();
END;
$$;
