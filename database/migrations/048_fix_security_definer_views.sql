-- Migration 048: Fix SECURITY DEFINER Views
-- Fixes security linter errors for views that use SECURITY DEFINER
-- SECURITY DEFINER views run with creator's permissions and can bypass RLS
-- SECURITY INVOKER views run with querying user's permissions (safer)

-- Fix user_training_summary view
-- This view was created in migration 043 and needs to be updated to use SECURITY INVOKER

DO $$
DECLARE
    has_user_id BOOLEAN;
    has_athlete_id BOOLEAN;
BEGIN
    -- Check if training_sessions table has user_id column
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'training_sessions' 
        AND column_name = 'user_id'
    ) INTO has_user_id;
    
    -- Check if training_sessions table has athlete_id column
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'training_sessions' 
        AND column_name = 'athlete_id'
    ) INTO has_athlete_id;
    
    -- Only recreate view if training_sessions table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'training_sessions'
    ) THEN
        -- Drop existing view first (required when changing security properties)
        EXECUTE 'DROP VIEW IF EXISTS user_training_summary CASCADE';
        
        IF has_user_id AND has_athlete_id THEN
            -- Both exist, use COALESCE
            EXECUTE '
            CREATE VIEW user_training_summary
            WITH (security_invoker = true) AS
            SELECT 
                COALESCE(user_id::text, athlete_id::text) as user_id,
                COUNT(*) as total_sessions,
                COUNT(*) FILTER (WHERE status = ''completed'') as completed_sessions,
                COUNT(*) FILTER (WHERE status = ''planned'') as planned_sessions,
                AVG(duration_minutes) FILTER (WHERE status = ''completed'') as avg_duration_minutes,
                AVG(intensity_level) FILTER (WHERE status = ''completed'') as avg_intensity,
                AVG(rpe) FILTER (WHERE status = ''completed'') as avg_rpe,
                MIN(session_date) as first_session_date,
                MAX(session_date) as last_session_date
            FROM training_sessions
            WHERE user_id IS NOT NULL OR athlete_id IS NOT NULL
            GROUP BY COALESCE(user_id::text, athlete_id::text)';
        ELSIF has_user_id THEN
            -- Only user_id exists
            EXECUTE '
            CREATE VIEW user_training_summary
            WITH (security_invoker = true) AS
            SELECT 
                user_id::text as user_id,
                COUNT(*) as total_sessions,
                COUNT(*) FILTER (WHERE status = ''completed'') as completed_sessions,
                COUNT(*) FILTER (WHERE status = ''planned'') as planned_sessions,
                AVG(duration_minutes) FILTER (WHERE status = ''completed'') as avg_duration_minutes,
                AVG(intensity_level) FILTER (WHERE status = ''completed'') as avg_intensity,
                AVG(rpe) FILTER (WHERE status = ''completed'') as avg_rpe,
                MIN(session_date) as first_session_date,
                MAX(session_date) as last_session_date
            FROM training_sessions
            WHERE user_id IS NOT NULL
            GROUP BY user_id::text';
        ELSIF has_athlete_id THEN
            -- Only athlete_id exists
            EXECUTE '
            CREATE VIEW user_training_summary
            WITH (security_invoker = true) AS
            SELECT 
                athlete_id::text as user_id,
                COUNT(*) as total_sessions,
                COUNT(*) FILTER (WHERE status = ''completed'') as completed_sessions,
                COUNT(*) FILTER (WHERE status = ''planned'') as planned_sessions,
                AVG(duration_minutes) FILTER (WHERE status = ''completed'') as avg_duration_minutes,
                AVG(intensity_level) FILTER (WHERE status = ''completed'') as avg_intensity,
                AVG(rpe) FILTER (WHERE status = ''completed'') as avg_rpe,
                MIN(session_date) as first_session_date,
                MAX(session_date) as last_session_date
            FROM training_sessions
            WHERE athlete_id IS NOT NULL
            GROUP BY athlete_id::text';
        END IF;
        
        -- Update comment
        EXECUTE 'COMMENT ON VIEW user_training_summary IS ''Summary statistics for each user''''s training sessions. Uses SECURITY INVOKER to respect RLS policies.''';
        
        RAISE NOTICE 'Fixed user_training_summary view to use SECURITY INVOKER';
    ELSE
        RAISE NOTICE 'training_sessions table does not exist, skipping user_training_summary view';
    END IF;
END $$;

-- Verify views are using SECURITY INVOKER
-- This query will show which views use SECURITY DEFINER (should be empty after this migration)
DO $$
DECLARE
    definer_views TEXT[];
BEGIN
    SELECT array_agg(viewname)
    INTO definer_views
    FROM pg_views
    WHERE schemaname = 'public'
    AND viewname IN ('user_training_summary', 'postgrest_exposed_tables')
    AND definition LIKE '%SECURITY DEFINER%';
    
    IF definer_views IS NOT NULL AND array_length(definer_views, 1) > 0 THEN
        RAISE WARNING 'Views still using SECURITY DEFINER: %', array_to_string(definer_views, ', ');
    ELSE
        RAISE NOTICE 'All views now use SECURITY INVOKER';
    END IF;
END $$;

-- Grant permissions on the fixed view
GRANT SELECT ON user_training_summary TO anon, authenticated;

-- Comment on migration
COMMENT ON VIEW user_training_summary IS 
'Summary statistics for each user''s training sessions. Uses SECURITY INVOKER to respect RLS policies. Fixed in migration 048.';

