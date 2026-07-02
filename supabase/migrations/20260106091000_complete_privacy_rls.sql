-- Migration: Complete Privacy RLS Policies
-- Date: 2026-01-06
-- Purpose: Enforce privacy-by-design for all sensitive data

-- This migration ensures coach_athlete_assignments table exists
-- (Created in wellness_privacy_rls.sql, but included here for completeness)

-- ============================================================================
-- RLS: pain_reports (if table exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'pain_reports'
    ) THEN
        ALTER TABLE pain_reports ENABLE ROW LEVEL SECURITY;
        
        -- Athletes: Full access
        DROP POLICY IF EXISTS "Athletes full access pain" ON pain_reports;
        EXECUTE 'CREATE POLICY "Athletes full access pain"
        ON pain_reports
        FOR ALL
        USING (athlete_id = auth.uid())
        WITH CHECK (athlete_id = auth.uid())';
        
        -- Coaches: Flag only (pain exists yes/no) unless safety override
        DROP POLICY IF EXISTS "Coaches flag only pain" ON pain_reports;
        EXECUTE 'CREATE POLICY "Coaches flag only pain"
        ON pain_reports
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM coach_athlete_assignments
                WHERE coach_id = auth.uid()
                AND athlete_id = pain_reports.athlete_id
            )
            AND (
                -- Safety override: pain >3/10 always visible
                EXISTS (
                    SELECT 1 FROM safety_override_log
                    WHERE athlete_id = pain_reports.athlete_id
                    AND trigger_type IN (''pain_above_3'', ''new_pain_area'', ''worsening_pain'')
                    AND override_timestamp >= NOW() - INTERVAL ''7 days''
                )
                OR
                -- Consent granted
                get_athlete_consent(pain_reports.athlete_id, ''wellness'') = true
            )
        )';
        
        -- Medical: Full access always
        DROP POLICY IF EXISTS "Medical full access pain" ON pain_reports;
        EXECUTE 'CREATE POLICY "Medical full access pain"
        ON pain_reports
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM auth.users
                WHERE id = auth.uid()
                AND raw_user_meta_data->>''role'' IN (''physio'', ''medical_staff'', ''admin'')
            )
        )';
    END IF;
END $$;

-- ============================================================================
-- RLS: wellness_data (if table exists, legacy table)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'wellness_data'
    ) THEN
        ALTER TABLE wellness_data ENABLE ROW LEVEL SECURITY;
        
        -- Athletes: Full access
        DROP POLICY IF EXISTS "Athletes full access wellness_data" ON wellness_data;
        EXECUTE 'CREATE POLICY "Athletes full access wellness_data"
        ON wellness_data
        FOR ALL
        USING (user_id::text = auth.uid()::text)
        WITH CHECK (user_id::text = auth.uid()::text)';
        
        -- Coaches: Hidden unless consent or safety override
        DROP POLICY IF EXISTS "Coaches view wellness_data with consent" ON wellness_data;
        EXECUTE 'CREATE POLICY "Coaches view wellness_data with consent"
        ON wellness_data
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM coach_athlete_assignments
                WHERE coach_id = auth.uid()
                AND athlete_id::text = wellness_data.user_id::text
            )
            AND (
                get_athlete_consent(wellness_data.user_id::uuid, ''wellness'') = true
                OR
                has_active_safety_override(wellness_data.user_id::uuid, ''pain'') = true
            )
        )';
    END IF;
END $$;

