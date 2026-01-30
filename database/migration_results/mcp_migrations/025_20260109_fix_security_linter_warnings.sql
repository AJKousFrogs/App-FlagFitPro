-- ============================================================================
-- Migration: Fix Supabase Security Linter Warnings
-- Date: 2026-01-09
-- Purpose: Address function search_path mutability and RLS policy issues
-- ============================================================================

-- ============================================================================
-- 1. FIX FUNCTION SEARCH PATHS
-- Functions need SET search_path = public for security
-- ============================================================================

-- Fix cleanup_expired_notifications function if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'cleanup_expired_notifications'
    ) THEN
        -- Drop and recreate with SET search_path
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
        RETURNS INTEGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $func$
        DECLARE
            v_deleted_count INTEGER;
        BEGIN
            -- Delete notifications older than 90 days
            DELETE FROM public.notifications
            WHERE created_at < NOW() - INTERVAL ''90 days'';
            
            GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
            
            RETURN v_deleted_count;
        END;
        $func$;
        ';
        
        RAISE NOTICE 'Fixed cleanup_expired_notifications function';
    END IF;
END $$;

-- Fix send_notification function if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'send_notification'
    ) THEN
        -- Drop and recreate with SET search_path
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.send_notification(
            p_user_id UUID,
            p_type VARCHAR(50),
            p_title VARCHAR(255),
            p_message TEXT,
            p_priority VARCHAR(20) DEFAULT ''medium'',
            p_data JSONB DEFAULT ''{}''::jsonb
        )
        RETURNS UUID
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $func$
        DECLARE
            v_notification_id UUID;
        BEGIN
            INSERT INTO public.notifications (
                user_id, type, title, message, priority, data, created_at
            )
            VALUES (
                p_user_id::text, p_type, p_title, p_message, p_priority, p_data, NOW()
            )
            RETURNING id INTO v_notification_id;
            
            RETURN v_notification_id;
        END;
        $func$;
        ';
        
        RAISE NOTICE 'Fixed send_notification function';
    END IF;
END $$;

-- ============================================================================
-- 2. FIX PLAYER_ACTIVITY_TRACKING RLS POLICY
-- Replace permissive WITH CHECK (true) with proper auth check
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert activity" ON public.player_activity_tracking;

-- Create a more secure policy that only allows authenticated users or service role
-- This is typically used by triggers, so authenticated context is appropriate
CREATE POLICY "Authenticated can insert activity tracking"
ON public.player_activity_tracking
FOR INSERT
WITH CHECK (
    -- Allow service role (used by background jobs/triggers)
    auth.role() = 'service_role'
    -- Allow authenticated users inserting their own records
    OR (auth.role() = 'authenticated' AND user_id = auth.uid())
);

-- Ensure players can view their own activity tracking
DROP POLICY IF EXISTS "Players can view own activity" ON public.player_activity_tracking;
CREATE POLICY "Players can view own activity"
ON public.player_activity_tracking
FOR SELECT
USING (user_id = auth.uid());

-- Ensure coaches can view their team's activity (may already exist)
DROP POLICY IF EXISTS "Coaches can view team activity" ON public.player_activity_tracking;
CREATE POLICY "Coaches can view team activity"
ON public.player_activity_tracking
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = player_activity_tracking.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('coach', 'head_coach', 'assistant_coach')
        AND tm.status = 'active'
    )
);

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

-- Grant execute on fixed functions to authenticated users if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'cleanup_expired_notifications'
    ) THEN
        GRANT EXECUTE ON FUNCTION public.cleanup_expired_notifications() TO service_role;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'send_notification'
    ) THEN
        GRANT EXECUTE ON FUNCTION public.send_notification(UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, JSONB) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.send_notification(UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, JSONB) TO service_role;
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================

COMMENT ON POLICY "Authenticated can insert activity tracking" ON public.player_activity_tracking IS 
'Secure policy: Only service role or authenticated users can insert activity tracking records';

-- ============================================================================
-- AUTH LEAKED PASSWORD PROTECTION NOTE
-- ============================================================================
-- WARNING 4: auth_leaked_password_protection
-- 
-- Leaked password protection is currently disabled in Supabase Auth settings.
-- This cannot be fixed via SQL migration - it must be enabled in the Supabase Dashboard:
--
-- Steps to enable:
-- 1. Go to Supabase Dashboard > Authentication > Providers
-- 2. Under "Email" provider, find "Password Settings"
-- 3. Enable "Leaked Password Protection"
-- 
-- This feature checks passwords against HaveIBeenPwned.org to prevent use of compromised passwords.
-- Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
-- ============================================================================
