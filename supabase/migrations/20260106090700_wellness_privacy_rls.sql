-- Migration: Wellness Data Privacy RLS
-- Date: 2026-01-06
-- Purpose: Enforce consent-based visibility for wellness data

-- ============================================================================
-- COACH-ATHLETE ASSIGNMENT TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_athlete_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(coach_id, athlete_id)
);

CREATE INDEX idx_coach_athlete_assignments_coach ON coach_athlete_assignments(coach_id);
CREATE INDEX idx_coach_athlete_assignments_athlete ON coach_athlete_assignments(athlete_id);

COMMENT ON TABLE coach_athlete_assignments IS 'Coach-athlete assignment relationships for authorization';

-- ============================================================================
-- RLS: wellness_logs
-- ============================================================================
ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY;

-- Athletes: Full access to own data
DROP POLICY IF EXISTS "Athletes full access wellness logs" ON wellness_logs;
CREATE POLICY "Athletes full access wellness logs"
ON wellness_logs
FOR ALL
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());

-- Coaches: Compliance only (check-in exists yes/no)
-- Content hidden unless consent or safety override
DROP POLICY IF EXISTS "Coaches compliance only wellness" ON wellness_logs;
CREATE POLICY "Coaches compliance only wellness"
ON wellness_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM coach_athlete_assignments
        WHERE coach_id = auth.uid()
        AND athlete_id = wellness_logs.athlete_id
    )
    -- Policy allows SELECT, but API filters columns based on consent
);

-- Medical: Full access
DROP POLICY IF EXISTS "Medical full access wellness" ON wellness_logs;
CREATE POLICY "Medical full access wellness"
ON wellness_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' IN ('physio', 'medical_staff', 'admin')
    )
);

-- Teammates: NO access (no policy = no access)

-- ============================================================================
-- RLS: readiness_scores
-- ============================================================================
ALTER TABLE readiness_scores ENABLE ROW LEVEL SECURITY;

-- Athletes: Full access to own scores
DROP POLICY IF EXISTS "Athletes can view own readiness scores" ON readiness_scores;
CREATE POLICY "Athletes can view own readiness scores"
ON readiness_scores
FOR SELECT
USING (athlete_id = auth.uid());

-- Coaches: ReadinessScore hidden unless consent or safety override
DROP POLICY IF EXISTS "Coaches can view readiness with consent" ON readiness_scores;
CREATE POLICY "Coaches can view readiness with consent"
ON readiness_scores
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM coach_athlete_assignments
        WHERE coach_id = auth.uid()
        AND athlete_id = readiness_scores.athlete_id
    )
    AND (
        -- Consent check: get_athlete_consent() returns true
        get_athlete_consent(readiness_scores.athlete_id, 'readiness') = true
        OR
        -- Safety override: ACWR danger zone
        readiness_scores.acwr > 1.5
        OR readiness_scores.acwr < 0.8
    )
);

-- Medical Staff: Full access
DROP POLICY IF EXISTS "Medical staff can view readiness scores" ON readiness_scores;
CREATE POLICY "Medical staff can view readiness scores"
ON readiness_scores
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' IN ('physio', 'medical_staff', 'admin')
    )
);

-- ============================================================================
-- RLS: wellness_entries (if table exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'wellness_entries'
    ) THEN
        ALTER TABLE wellness_entries ENABLE ROW LEVEL SECURITY;
        
        -- Athletes: Full access
        DROP POLICY IF EXISTS "Athletes can view own wellness entries" ON wellness_entries;
        EXECUTE 'CREATE POLICY "Athletes can view own wellness entries"
        ON wellness_entries
        FOR SELECT
        USING (athlete_id = auth.uid())';
        
        -- Coaches: Hidden unless consent or safety override
        DROP POLICY IF EXISTS "Coaches can view wellness with consent" ON wellness_entries;
        EXECUTE 'CREATE POLICY "Coaches can view wellness with consent"
        ON wellness_entries
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM coach_athlete_assignments
                WHERE coach_id = auth.uid()
                AND athlete_id = wellness_entries.athlete_id
            )
            AND (
                get_athlete_consent(wellness_entries.athlete_id, ''wellness'') = true
                OR
                has_active_safety_override(wellness_entries.athlete_id, ''pain'') = true
            )
        )';
    END IF;
END $$;

-- ============================================================================
-- RLS: training_sessions (execution notes)
-- ============================================================================
-- Add policy for training notes visibility
DROP POLICY IF EXISTS "Coaches can view training notes with consent" ON training_sessions;
CREATE POLICY "Coaches can view training notes with consent"
ON training_sessions
FOR SELECT
USING (
    -- Coach assigned to athlete
    EXISTS (
        SELECT 1 FROM coach_athlete_assignments
        WHERE coach_id = auth.uid()
        AND athlete_id = training_sessions.user_id
    )
    -- Notes column filtered at API layer based on consent
    -- Compliance data (sets/reps/RPE) always visible
);

