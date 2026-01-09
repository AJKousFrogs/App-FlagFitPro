-- ============================================================================
-- Migration: Fix send_notification Function Search Path
-- Date: 2026-01-09
-- Purpose: Fix the second overload of send_notification that was missing search_path
-- ============================================================================

-- There are two overloads of send_notification in the database.
-- The first overload (6 params) already has SET search_path = public
-- The second overload (11 params) was missing it, causing the security warning

CREATE OR REPLACE FUNCTION public.send_notification(
    p_user_id uuid,
    p_notification_type character varying,
    p_title character varying,
    p_message text,
    p_category character varying DEFAULT 'general'::character varying,
    p_severity character varying DEFAULT 'info'::character varying,
    p_action_url text DEFAULT NULL::text,
    p_data jsonb DEFAULT '{}'::jsonb,
    p_sender_id uuid DEFAULT NULL::uuid,
    p_related_entity_type character varying DEFAULT NULL::character varying,
    p_related_entity_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    user_id_uuid,
    notification_type,
    title,
    message,
    category,
    severity,
    action_url,
    data,
    sender_id,
    related_entity_type,
    related_entity_id,
    is_read,
    dismissed,
    expires_at,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_user_id,
    p_notification_type,
    p_title,
    p_message,
    p_category,
    p_severity,
    p_action_url,
    p_data,
    p_sender_id,
    p_related_entity_type,
    p_related_entity_id,
    FALSE,
    FALSE,
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$function$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.send_notification(
    uuid, character varying, character varying, text,
    character varying, character varying, text, jsonb,
    uuid, character varying, uuid
) TO authenticated, service_role;

-- Add comment
COMMENT ON FUNCTION public.send_notification(
    uuid, character varying, character varying, text,
    character varying, character varying, text, jsonb,
    uuid, character varying, uuid
) IS 'Sends a notification to a user. SECURITY DEFINER with search_path = public for security.';
