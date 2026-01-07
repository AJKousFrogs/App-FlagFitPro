-- =============================================================================
-- TEAM ACTIVITIES SOURCE OF TRUTH
-- Migration: 20250130000000_team_activities_sot.sql
-- Purpose: Create canonical team activity tables (practice/film/cancelled)
--          with coach authority, audit logging, and athlete participation mapping
-- Created: 2025-01-30
-- Contract: PROMPT_2_10_TEAM_ACTIVITY_SOT
-- =============================================================================

-- =============================================================================
-- TEAM_ACTIVITIES TABLE
-- Canonical source of truth for team activities (practice/film/cancelled)
-- Only coaches can create/update. Athletes can read.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.team_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    
    -- Date/time (athlete local day reference)
    date DATE NOT NULL,
    start_time_local TIME,
    end_time_local TIME,
    timezone TEXT NOT NULL DEFAULT 'America/New_York', -- Store club timezone OR event timezone
    
    -- Activity details
    type VARCHAR(50) NOT NULL CHECK (type IN ('practice', 'film_room', 'cancelled', 'other')),
    location TEXT,
    replaces_session BOOLEAN DEFAULT TRUE, -- If true, replaces normal training session
    
    -- Coach attribution (REQUIRED)
    created_by_coach_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Metadata
    note TEXT, -- Coach note/instructions
    weather_override JSONB, -- If coach used weather to justify (e.g., {"reason": "rain", "original_type": "practice", "new_type": "film_room"})
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(team_id, date, type) -- One activity type per team per day
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_activities_team_date ON public.team_activities(team_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_team_activities_date ON public.team_activities(date DESC);
CREATE INDEX IF NOT EXISTS idx_team_activities_created_by ON public.team_activities(created_by_coach_id);
CREATE INDEX IF NOT EXISTS idx_team_activities_type ON public.team_activities(type);

-- =============================================================================
-- TEAM_ACTIVITY_ATTENDANCE TABLE
-- Maps athletes to team activities with participation status
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.team_activity_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.team_activities(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Participation status
    participation VARCHAR(50) NOT NULL CHECK (participation IN ('required', 'optional', 'excluded')),
    exclusion_reason TEXT, -- If excluded, why (e.g., "rehab_protocol", "injury", "coach_decision")
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(activity_id, athlete_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_activity ON public.team_activity_attendance(activity_id);
CREATE INDEX IF NOT EXISTS idx_attendance_athlete ON public.team_activity_attendance(athlete_id);
CREATE INDEX IF NOT EXISTS idx_attendance_athlete_date ON public.team_activity_attendance(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_participation ON public.team_activity_attendance(participation);

-- =============================================================================
-- TEAM_ACTIVITY_AUDIT TABLE
-- Append-only audit log for all team activity changes
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.team_activity_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.team_activities(id) ON DELETE CASCADE,
    
    -- Action details
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'attendance_changed')),
    performed_by_coach_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Change details
    old_values JSONB, -- Snapshot of old values (for updates/deletes)
    new_values JSONB, -- Snapshot of new values (for creates/updates)
    
    -- Timestamp (immutable)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_activity ON public.team_activity_audit(activity_id);
CREATE INDEX IF NOT EXISTS idx_audit_coach ON public.team_activity_audit(performed_by_coach_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.team_activity_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.team_activity_audit(action);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.team_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_audit ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- TEAM_ACTIVITIES RLS POLICIES
-- =============================================================================

-- Policy: Coaches can view activities for their teams
CREATE POLICY "Coaches can view team activities"
    ON public.team_activities
    FOR SELECT
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- Policy: Athletes can view activities for teams they belong to
CREATE POLICY "Athletes can view team activities"
    ON public.team_activities
    FOR SELECT
    USING (
        team_id IN (
            SELECT team_id
            FROM public.team_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- Policy: Only coaches can create team activities
CREATE POLICY "Coaches can create team activities"
    ON public.team_activities
    FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
        AND created_by_coach_id = auth.uid()
    );

-- Policy: Only coaches can update team activities
CREATE POLICY "Coaches can update team activities"
    ON public.team_activities
    FOR UPDATE
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- Policy: Only coaches can delete team activities
CREATE POLICY "Coaches can delete team activities"
    ON public.team_activities
    FOR DELETE
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- =============================================================================
-- TEAM_ACTIVITY_ATTENDANCE RLS POLICIES
-- =============================================================================

-- Policy: Coaches can view all attendance records for their teams
CREATE POLICY "Coaches can view attendance"
    ON public.team_activity_attendance
    FOR SELECT
    USING (
        activity_id IN (
            SELECT id
            FROM public.team_activities
            WHERE team_id IN (
                SELECT id
                FROM public.teams
                WHERE coach_id = auth.uid()
            )
        )
    );

-- Policy: Athletes can view their own attendance records
CREATE POLICY "Athletes can view own attendance"
    ON public.team_activity_attendance
    FOR SELECT
    USING (athlete_id = auth.uid());

-- Policy: Only coaches can create/update attendance records
CREATE POLICY "Coaches can manage attendance"
    ON public.team_activity_attendance
    FOR ALL
    USING (
        activity_id IN (
            SELECT id
            FROM public.team_activities
            WHERE team_id IN (
                SELECT id
                FROM public.teams
                WHERE coach_id = auth.uid()
            )
        )
    );

-- =============================================================================
-- TEAM_ACTIVITY_AUDIT RLS POLICIES
-- =============================================================================

-- Policy: Coaches can view audit logs for their teams
CREATE POLICY "Coaches can view audit logs"
    ON public.team_activity_audit
    FOR SELECT
    USING (
        activity_id IN (
            SELECT id
            FROM public.team_activities
            WHERE team_id IN (
                SELECT id
                FROM public.teams
                WHERE coach_id = auth.uid()
            )
        )
    );

-- Policy: Athletes can view audit logs for their teams (read-only)
CREATE POLICY "Athletes can view audit logs"
    ON public.team_activity_audit
    FOR SELECT
    USING (
        activity_id IN (
            SELECT id
            FROM public.team_activities
            WHERE team_id IN (
                SELECT team_id
                FROM public.team_members
                WHERE user_id = auth.uid()
                AND status = 'active'
            )
        )
    );

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_team_activity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_team_activities_updated_at ON public.team_activities;
CREATE TRIGGER update_team_activities_updated_at
    BEFORE UPDATE ON public.team_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_team_activity_updated_at();

DROP TRIGGER IF EXISTS update_team_activity_attendance_updated_at ON public.team_activity_attendance;
CREATE TRIGGER update_team_activity_attendance_updated_at
    BEFORE UPDATE ON public.team_activity_attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_team_activity_updated_at();

-- Trigger: Auto-audit all changes to team_activities
CREATE OR REPLACE FUNCTION public.audit_team_activity_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_team_activities ON public.team_activities;
CREATE TRIGGER audit_team_activities
    AFTER INSERT OR UPDATE OR DELETE ON public.team_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_team_activity_changes();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.team_activities IS 'Canonical source of truth for team activities (practice/film/cancelled). Only coaches can create/update.';
COMMENT ON TABLE public.team_activity_attendance IS 'Maps athletes to team activities with participation status (required/optional/excluded)';
COMMENT ON TABLE public.team_activity_audit IS 'Append-only audit log for all team activity changes';

COMMENT ON COLUMN public.team_activities.created_by_coach_id IS 'REQUIRED: Coach who created this activity (for attribution)';
COMMENT ON COLUMN public.team_activities.replaces_session IS 'If true, this activity replaces the normal training session';
COMMENT ON COLUMN public.team_activities.weather_override IS 'JSONB: If coach used weather to justify change (e.g., {"reason": "rain", "original_type": "practice", "new_type": "film_room"})';
COMMENT ON COLUMN public.team_activity_attendance.exclusion_reason IS 'Reason for exclusion (e.g., "rehab_protocol", "injury", "coach_decision")';

