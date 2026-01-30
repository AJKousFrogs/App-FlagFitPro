-- Migration: Fix Function Search Paths
-- Date: 2026-01-07
-- Purpose: Fix mutable search_path security issue in trigger functions

-- ============================================================================
-- FIX FUNCTION SEARCH PATHS
-- ============================================================================

-- Fix update_team_activity_updated_at function
CREATE OR REPLACE FUNCTION public.update_team_activity_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix audit_team_activity_changes function
CREATE OR REPLACE FUNCTION public.audit_team_activity_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.team_activity_audit (
            activity_id,
            action,
            performed_by_coach_id,
            new_values
        ) VALUES (
            NEW.id,
            'created',
            NEW.created_by_coach_id,
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.team_activity_audit (
            activity_id,
            action,
            performed_by_coach_id,
            old_values,
            new_values
        ) VALUES (
            NEW.id,
            'updated',
            NEW.created_by_coach_id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.team_activity_audit (
            activity_id,
            action,
            performed_by_coach_id,
            old_values
        ) VALUES (
            OLD.id,
            'deleted',
            OLD.created_by_coach_id,
            row_to_json(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.update_team_activity_updated_at() IS 'Trigger function to update updated_at timestamp. Search path fixed for security.';
COMMENT ON FUNCTION public.audit_team_activity_changes() IS 'Trigger function to audit team activity changes. Search path fixed for security.';

