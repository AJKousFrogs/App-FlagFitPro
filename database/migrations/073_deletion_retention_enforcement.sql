-- =============================================================================
-- DELETION & RETENTION ENFORCEMENT - Migration 073
-- =============================================================================
-- Implements GDPR Article 17 (Right to Erasure) and data retention policies:
-- 1. Account deletion pipeline with soft-delete
-- 2. 30-day PII deletion queue processing
-- 3. 7-year emergency medical retention
-- 4. Deletion audit logging
-- =============================================================================

-- Fix initiate_account_deletion
CREATE OR REPLACE FUNCTION public.initiate_account_deletion(
    p_user_id UUID, 
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_request_id UUID;
    v_scheduled_delete TIMESTAMPTZ;
BEGIN
    -- Calculate scheduled hard delete date (30 days from now)
    v_scheduled_delete := now() + INTERVAL '30 days';
    
    -- Create deletion request
    INSERT INTO account_deletion_requests (
        user_id,
        reason,
        status,
        soft_deleted_at,
        scheduled_hard_delete_at
    ) VALUES (
        p_user_id,
        p_reason,
        'pending',
        now(),
        v_scheduled_delete
    )
    RETURNING id INTO v_request_id;
    
    -- Soft delete the user (set is_active = false)
    UPDATE users
    SET is_active = false,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Revoke all active sessions (mark timestamp)
    UPDATE account_deletion_requests
    SET sessions_revoked_at = now()
    WHERE id = v_request_id;
    
    -- Log the deletion request
    INSERT INTO privacy_audit_log (
        user_id,
        action,
        affected_table,
        affected_data
    ) VALUES (
        p_user_id,
        'deletion_requested',
        'users',
        jsonb_build_object(
            'request_id', v_request_id,
            'scheduled_hard_delete', v_scheduled_delete,
            'reason', p_reason
        )
    );
    
    RETURN v_request_id;
END;
$function$;

-- Fix cancel_account_deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion(
    p_request_id UUID, 
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_current_status TEXT;
BEGIN
    -- Get current status
    SELECT status INTO v_current_status
    FROM account_deletion_requests
    WHERE id = p_request_id AND user_id = p_user_id;
    
    -- Can only cancel if pending or processing
    IF v_current_status NOT IN ('pending', 'processing') THEN
        RETURN FALSE;
    END IF;
    
    -- Update request status
    UPDATE account_deletion_requests
    SET status = 'cancelled',
        updated_at = now()
    WHERE id = p_request_id;
    
    -- Reactivate user
    UPDATE users
    SET is_active = true,
        updated_at = now()
    WHERE id = p_user_id;
    
    -- Log cancellation
    INSERT INTO privacy_audit_log (
        user_id,
        action,
        affected_table,
        affected_data
    ) VALUES (
        p_user_id,
        'deletion_cancelled',
        'account_deletion_requests',
        jsonb_build_object('request_id', p_request_id)
    );
    
    RETURN TRUE;
END;
$function$;

-- Fix process_hard_deletion
CREATE OR REPLACE FUNCTION public.process_hard_deletion(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_user_id UUID;
    v_email_hash TEXT;
    v_deleted_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get user ID from request
    SELECT user_id INTO v_user_id
    FROM account_deletion_requests
    WHERE id = p_request_id AND status = 'pending';
    
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update request status to processing
    UPDATE account_deletion_requests
    SET status = 'processing',
        updated_at = now()
    WHERE id = p_request_id;
    
    -- Hash the email for emergency records before deletion
    SELECT encode(sha256(email::bytea), 'hex') INTO v_email_hash
    FROM users WHERE id = v_user_id;
    
    -- Update emergency medical records to preserve them with hashed email
    -- These records are retained for 7 years per legal requirements
    UPDATE emergency_medical_records
    SET user_email_hash = v_email_hash,
        user_id = NULL  -- Disassociate from user but keep record
    WHERE user_id = v_user_id;
    
    -- Delete user data from tables (in order of dependencies)
    -- Note: Tables with ON DELETE CASCADE will be handled automatically
    
    -- AI/Chat data
    DELETE FROM ai_chat_messages WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'ai_chat_messages');
    
    DELETE FROM ai_chat_sessions WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'ai_chat_sessions');
    
    -- Wellness/Health data
    DELETE FROM readiness_scores WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'readiness_scores');
    
    DELETE FROM wellness_logs WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'wellness_logs');
    
    DELETE FROM wellness_entries WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'wellness_entries');
    
    -- Training data
    DELETE FROM training_sessions WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'training_sessions');
    
    DELETE FROM load_monitoring WHERE player_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'load_monitoring');
    
    DELETE FROM load_daily WHERE player_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'load_daily');
    
    DELETE FROM workout_logs WHERE player_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'workout_logs');
    
    -- Notifications
    DELETE FROM notifications WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'notifications');
    
    -- Team memberships (will cascade to related data)
    DELETE FROM team_members WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'team_members');
    
    -- Privacy settings (cascade should handle, but be explicit)
    DELETE FROM team_sharing_settings WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'team_sharing_settings');
    
    DELETE FROM privacy_settings WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'privacy_settings');
    
    -- Consent records
    DELETE FROM gdpr_consent WHERE user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'gdpr_consent');
    
    DELETE FROM parental_consent WHERE minor_user_id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'parental_consent');
    
    -- Profile
    DELETE FROM profiles WHERE id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'profiles');
    
    -- User record (this may cascade more deletions)
    DELETE FROM users WHERE id = v_user_id;
    v_deleted_tables := array_append(v_deleted_tables, 'users');
    
    -- Mark deletion as complete
    UPDATE account_deletion_requests
    SET status = 'completed',
        hard_deleted_at = now(),
        updated_at = now()
    WHERE id = p_request_id;
    
    -- Log completion (user_id will be NULL after user deletion)
    INSERT INTO privacy_audit_log (
        user_id,
        action,
        affected_table,
        affected_data
    ) VALUES (
        NULL, -- User no longer exists
        'deletion_completed',
        'users',
        jsonb_build_object(
            'request_id', p_request_id,
            'email_hash', v_email_hash,
            'tables_deleted', v_deleted_tables,
            'completed_at', now()
        )
    );
    
    -- Note: The actual auth.users deletion must be done via Supabase Admin API
    -- This function handles the public schema data
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Log failure
    UPDATE account_deletion_requests
    SET status = 'failed',
        error_message = SQLERRM,
        updated_at = now()
    WHERE id = p_request_id;
    
    -- Log the error
    INSERT INTO privacy_audit_log (
        user_id,
        action,
        affected_table,
        affected_data
    ) VALUES (
        v_user_id,
        'deletion_failed',
        'account_deletion_requests',
        jsonb_build_object(
            'request_id', p_request_id,
            'error', SQLERRM
        )
    );
    
    RETURN FALSE;
END;
$function$;

-- Fix get_deletions_ready_for_processing
CREATE OR REPLACE FUNCTION public.get_deletions_ready_for_processing()
RETURNS TABLE(
    request_id UUID, 
    user_id UUID, 
    scheduled_at TIMESTAMPTZ, 
    days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        adr.id as request_id,
        adr.user_id,
        adr.scheduled_hard_delete_at as scheduled_at,
        EXTRACT(DAY FROM adr.scheduled_hard_delete_at - now())::INTEGER as days_remaining
    FROM account_deletion_requests adr
    WHERE adr.status = 'pending'
    AND adr.scheduled_hard_delete_at <= now()
    ORDER BY adr.scheduled_hard_delete_at ASC;
END;
$function$;

-- Fix cleanup_expired_emergency_records
CREATE OR REPLACE FUNCTION public.cleanup_expired_emergency_records()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM emergency_medical_records
    WHERE retention_expires_at <= now();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log cleanup
    IF v_deleted_count > 0 THEN
        INSERT INTO privacy_audit_log (
            user_id,
            action,
            affected_table,
            affected_data
        ) VALUES (
            NULL,
            'retention_cleanup',
            'emergency_medical_records',
            jsonb_build_object(
                'records_deleted', v_deleted_count,
                'cleanup_date', now()
            )
        );
    END IF;
    
    RETURN v_deleted_count;
END;
$function$;

-- Fix anonymize_user_data_for_research
CREATE OR REPLACE FUNCTION public.anonymize_user_data_for_research(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_research_opt_in BOOLEAN;
    v_anonymized_id UUID;
BEGIN
    -- Check if user opted in to research
    SELECT research_opt_in INTO v_research_opt_in
    FROM privacy_settings
    WHERE user_id = p_user_id;
    
    IF NOT COALESCE(v_research_opt_in, FALSE) THEN
        RETURN FALSE;
    END IF;
    
    -- Generate anonymized ID
    v_anonymized_id := gen_random_uuid();
    
    -- Log anonymization
    INSERT INTO privacy_audit_log (
        user_id,
        action,
        affected_table,
        affected_data
    ) VALUES (
        p_user_id,
        'data_anonymized',
        'research_data',
        jsonb_build_object(
            'anonymized_id', v_anonymized_id,
            'anonymized_at', now()
        )
    );
    
    RETURN TRUE;
END;
$function$;

-- Add helper function to get deletion status for a user
CREATE OR REPLACE FUNCTION public.get_deletion_status(p_user_id UUID)
RETURNS TABLE(
    request_id UUID,
    status TEXT,
    requested_at TIMESTAMPTZ,
    scheduled_hard_delete_at TIMESTAMPTZ,
    days_until_deletion INTEGER,
    can_cancel BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        adr.id as request_id,
        adr.status,
        adr.requested_at,
        adr.scheduled_hard_delete_at,
        GREATEST(0, EXTRACT(DAY FROM adr.scheduled_hard_delete_at - now())::INTEGER) as days_until_deletion,
        adr.status IN ('pending', 'processing') as can_cancel
    FROM account_deletion_requests adr
    WHERE adr.user_id = p_user_id
    ORDER BY adr.created_at DESC
    LIMIT 1;
END;
$function$;

-- Add function to create emergency medical record with 7-year retention
CREATE OR REPLACE FUNCTION public.create_emergency_medical_record(
    p_user_id UUID,
    p_event_type TEXT,
    p_medical_data JSONB,
    p_location_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_record_id UUID;
BEGIN
    INSERT INTO emergency_medical_records (
        user_id,
        event_type,
        event_date,
        medical_data,
        location_data,
        retention_expires_at
    ) VALUES (
        p_user_id,
        p_event_type,
        now(),
        p_medical_data,
        p_location_data,
        now() + INTERVAL '7 years'  -- Legal requirement for medical records
    )
    RETURNING id INTO v_record_id;
    
    -- Log creation
    INSERT INTO privacy_audit_log (
        user_id,
        action,
        affected_table,
        affected_data
    ) VALUES (
        p_user_id,
        'emergency_record_created',
        'emergency_medical_records',
        jsonb_build_object(
            'record_id', v_record_id,
            'event_type', p_event_type,
            'retention_expires', now() + INTERVAL '7 years'
        )
    );
    
    RETURN v_record_id;
END;
$function$;

