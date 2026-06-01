BEGIN;

ALTER TABLE public.users
  ALTER COLUMN password_hash DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_public_user_from_auth_row(p_auth_user auth.users)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_meta jsonb := COALESCE(p_auth_user.raw_user_meta_data, '{}'::jsonb);
  v_email text := COALESCE(NULLIF(trim(p_auth_user.email), ''), NULLIF(trim(v_meta ->> 'email'), ''));
  v_full_name text := COALESCE(
    NULLIF(trim(v_meta ->> 'full_name'), ''),
    NULLIF(trim(v_meta ->> 'name'), ''),
    NULLIF(trim(p_auth_user.email), ''),
    'User'
  );
  v_first_name text;
  v_last_name text;
  v_position text := NULLIF(trim(v_meta ->> 'position'), '');
  v_email_verified boolean := COALESCE(p_auth_user.email_confirmed_at IS NOT NULL, false);
BEGIN
  v_first_name := COALESCE(
    NULLIF(trim(v_meta ->> 'first_name'), ''),
    NULLIF(trim(split_part(v_full_name, ' ', 1)), ''),
    'User'
  );

  v_last_name := COALESCE(
    NULLIF(trim(v_meta ->> 'last_name'), ''),
    NULLIF(trim(substring(v_full_name from '^[^ ]+\s+(.+)$')), ''),
    'Account'
  );

  INSERT INTO public.users (
    id,
    email,
    password_hash,
    first_name,
    last_name,
    position,
    full_name,
    name,
    email_verified,
    onboarding_completed,
    is_active,
    created_at,
    updated_at,
    last_login,
    avatar_url,
    profile_photo_url
  )
  VALUES (
    p_auth_user.id,
    v_email,
    NULL,
    v_first_name,
    v_last_name,
    v_position,
    v_full_name,
    v_full_name,
    v_email_verified,
    false,
    true,
    COALESCE(p_auth_user.created_at AT TIME ZONE 'UTC', now()::timestamp),
    now()::timestamp,
    COALESCE(p_auth_user.last_sign_in_at AT TIME ZONE 'UTC', NULL),
    NULLIF(trim(v_meta ->> 'avatar_url'), ''),
    NULLIF(trim(v_meta ->> 'avatar_url'), '')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.users.first_name),
      last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.users.last_name),
      position = COALESCE(EXCLUDED.position, public.users.position),
      full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.users.full_name),
      name = COALESCE(NULLIF(EXCLUDED.name, ''), public.users.name),
      email_verified = COALESCE(EXCLUDED.email_verified, public.users.email_verified),
      is_active = true,
      updated_at = now()::timestamp,
      last_login = COALESCE(EXCLUDED.last_login, public.users.last_login),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      profile_photo_url = COALESCE(EXCLUDED.profile_photo_url, public.users.profile_photo_url);

  INSERT INTO public.privacy_settings (user_id)
  VALUES (p_auth_user.id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_public_user_from_auth_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  PERFORM public.sync_public_user_from_auth_row(NEW);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_public_user_from_auth_trigger ON auth.users;
CREATE TRIGGER sync_public_user_from_auth_trigger
AFTER INSERT OR UPDATE OR DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_public_user_from_auth_trigger();

DO $$
DECLARE
  auth_user auth.users%ROWTYPE;
BEGIN
  FOR auth_user IN SELECT * FROM auth.users LOOP
    PERFORM public.sync_public_user_from_auth_row(auth_user);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_ai_processing_enabled(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_ai_enabled boolean;
BEGIN
  SELECT ai_processing_enabled
    INTO v_ai_enabled
  FROM public.privacy_settings
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_ai_enabled, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.require_ai_consent(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT public.check_ai_processing_enabled(p_user_id) THEN
    RAISE EXCEPTION 'AI_CONSENT_REQUIRED: User % has not enabled AI processing. Enable AI processing in Privacy Settings to use this feature.', p_user_id
      USING ERRCODE = 'P0001';
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ai_consent_status(p_user_id uuid)
RETURNS TABLE(
  ai_enabled boolean,
  consent_date timestamptz,
  can_process boolean,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ps.ai_processing_enabled, false) AS ai_enabled,
    ps.ai_processing_consent_date AS consent_date,
    COALESCE(ps.ai_processing_enabled, false) AS can_process,
    CASE
      WHEN ps.ai_processing_enabled = true THEN 'AI processing enabled by user consent'
      WHEN ps.ai_processing_enabled = false THEN 'AI processing disabled by user preference'
      WHEN ps.user_id IS NULL THEN 'No privacy settings configured - AI processing disabled by default'
      ELSE 'AI processing status unknown'
    END AS reason
  FROM (SELECT p_user_id AS uid) AS t
  LEFT JOIN public.privacy_settings ps ON ps.user_id = t.uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_ai_processing_enabled(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.require_ai_consent(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ai_consent_status(uuid) TO authenticated, service_role;

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

COMMIT;
