-- =============================================================================
-- DATABASE UPGRADE: CONSISTENCY AND FIXES
-- Migration: 043_database_upgrade_consistency.sql
-- Purpose: Fix inconsistencies, ensure functions exist, standardize patterns
-- Created: 2025-01-XX
-- =============================================================================

-- =============================================================================
-- 1. ENSURE CORE FUNCTIONS EXIST (MUST BE FIRST)
-- =============================================================================

-- Ensure update_updated_at_column() function exists (required by migration 001)
-- This function is used by many triggers across the database
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Standard function to update updated_at timestamp on row updates. Used by triggers across the database.';

-- =============================================================================
-- 2. FIX MISSING FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Ensure training_sessions has proper foreign key to users
-- Check for both user_id and athlete_id columns
DO $$
DECLARE
    has_user_id BOOLEAN;
    has_athlete_id BOOLEAN;
    user_id_is_uuid BOOLEAN;
    athlete_id_is_uuid BOOLEAN;
BEGIN
    -- Check if user_id exists and is UUID
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'user_id'
        AND data_type = 'uuid'
    ) INTO has_user_id;
    
    -- Check if athlete_id exists and is UUID or text
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'athlete_id'
    ) INTO has_athlete_id;
    
    -- Add foreign key for user_id if it exists and doesn't have constraint
    IF has_user_id THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'training_sessions_user_id_fkey'
            AND table_name = 'training_sessions'
        ) THEN
            ALTER TABLE training_sessions 
            ADD CONSTRAINT training_sessions_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
    
    -- Add foreign key for athlete_id if it exists and doesn't have constraint
    IF has_athlete_id THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'training_sessions_athlete_id_fkey'
            AND table_name = 'training_sessions'
        ) THEN
            -- Check if athlete_id is UUID or text
            SELECT data_type = 'uuid' INTO user_id_is_uuid
            FROM information_schema.columns 
            WHERE table_name = 'training_sessions' 
            AND column_name = 'athlete_id';
            
            IF user_id_is_uuid THEN
                ALTER TABLE training_sessions 
                ADD CONSTRAINT training_sessions_athlete_id_fkey 
                FOREIGN KEY (athlete_id) REFERENCES users(id) ON DELETE CASCADE;
            END IF;
        END IF;
    END IF;
END $$;

-- =============================================================================
-- 3. ENSURE CRITICAL INDEXES EXIST
-- =============================================================================

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified) WHERE email_verified = true;

-- Indexes for training_sessions (performance critical)
-- Check which columns exist and create appropriate indexes
DO $$
DECLARE
    has_user_id BOOLEAN;
    has_athlete_id BOOLEAN;
    has_status BOOLEAN;
    has_session_date BOOLEAN;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'user_id'
    ) INTO has_user_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'athlete_id'
    ) INTO has_athlete_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'status'
    ) INTO has_status;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'session_date'
    ) INTO has_session_date;
    
    -- Create user + status index if both exist
    IF has_status THEN
        IF has_user_id THEN
            CREATE INDEX IF NOT EXISTS idx_training_sessions_user_status 
                ON training_sessions(user_id, status) 
                WHERE status IN ('completed', 'in_progress');
        ELSIF has_athlete_id THEN
            CREATE INDEX IF NOT EXISTS idx_training_sessions_athlete_status 
                ON training_sessions(athlete_id, status) 
                WHERE status IN ('completed', 'in_progress');
        END IF;
    END IF;
    
    -- Create date index if session_date exists
    IF has_session_date THEN
        CREATE INDEX IF NOT EXISTS idx_training_sessions_date_range 
            ON training_sessions(session_date) 
            WHERE session_date IS NOT NULL;
    END IF;
END $$;

-- Indexes for team_members
-- Only create status index if table and status column exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'team_members'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_members' 
        AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_team_members_user_status 
            ON team_members(user_id, status) 
            WHERE status = 'active';
    END IF;
END $$;

-- =============================================================================
-- 4. FIX DATA TYPE CONSISTENCIES WHERE POSSIBLE
-- =============================================================================

-- Note: We cannot change VARCHAR(255) to UUID for existing tables with data
-- without data migration. Instead, we'll document the pattern and ensure
-- new tables follow the UUID pattern.

-- Add helper function to convert VARCHAR user_id to UUID safely
CREATE OR REPLACE FUNCTION user_id_to_uuid(p_user_id VARCHAR(255))
RETURNS UUID AS $$
BEGIN
    -- Try to cast directly if it's already a UUID string
    BEGIN
        RETURN p_user_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        -- If conversion fails, try to find UUID from users table
        RETURN (SELECT id FROM users WHERE id::text = p_user_id LIMIT 1);
    END;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION user_id_to_uuid IS 'Helper function to convert VARCHAR user_id to UUID. Returns NULL if conversion fails.';

-- =============================================================================
-- 5. ENSURE RLS IS ENABLED ON CRITICAL TABLES
-- =============================================================================

-- Enable RLS on training_sessions if not already enabled
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'training_sessions'
        AND rowsecurity = false
    ) THEN
        ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Enable RLS on team_members if not already enabled
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'team_members'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'team_members'
            AND rowsecurity = false
        ) THEN
            ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
        END IF;
    END IF;
END $$;

-- Enable RLS on positions table (reference/lookup data)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'positions'
        AND rowsecurity = false
    ) THEN
        ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =============================================================================
-- 6. CREATE MISSING RLS POLICIES FOR TRAINING_SESSIONS
-- =============================================================================
-- Note: training_sessions may use user_id, athlete_id, or neither
-- Only create policies if a user identifier column exists

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS training_sessions_select_policy ON training_sessions;
DROP POLICY IF EXISTS training_sessions_insert_policy ON training_sessions;
DROP POLICY IF EXISTS training_sessions_update_policy ON training_sessions;
DROP POLICY IF EXISTS training_sessions_delete_policy ON training_sessions;

-- Policy for SELECT: Users can view their own training sessions
-- Check which user column exists and create appropriate policy
DO $$
DECLARE
    has_user_id BOOLEAN;
    has_athlete_id BOOLEAN;
    athlete_id_type TEXT;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'user_id'
    ) INTO has_user_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'athlete_id'
    ) INTO has_athlete_id;
    
    -- Get athlete_id data type if it exists
    IF has_athlete_id THEN
        SELECT data_type INTO athlete_id_type
        FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'athlete_id';
    END IF;
    
    -- Only create policies if a user identifier column exists
    IF has_user_id THEN
        CREATE POLICY training_sessions_select_policy
        ON training_sessions
        FOR SELECT
        TO authenticated
        USING (
            user_id = (SELECT auth.uid())
            OR
            (SELECT auth.role()) = 'admin'
        );
        
        CREATE POLICY training_sessions_insert_policy
        ON training_sessions
        FOR INSERT
        TO authenticated
        WITH CHECK (
            user_id = (SELECT auth.uid())
            OR
            (SELECT auth.role()) = 'admin'
        );
        
        CREATE POLICY training_sessions_update_policy
        ON training_sessions
        FOR UPDATE
        TO authenticated
        USING (
            user_id = (SELECT auth.uid())
            OR
            (SELECT auth.role()) = 'admin'
        )
        WITH CHECK (
            user_id = (SELECT auth.uid())
            OR
            (SELECT auth.role()) = 'admin'
        );
        
        CREATE POLICY training_sessions_delete_policy
        ON training_sessions
        FOR DELETE
        TO authenticated
        USING (
            user_id = (SELECT auth.uid())
            OR
            (SELECT auth.role()) = 'admin'
        );
    ELSIF has_athlete_id THEN
        -- Check if athlete_id is UUID or text
        IF athlete_id_type = 'uuid' THEN
            -- athlete_id is UUID, compare directly
            CREATE POLICY training_sessions_select_policy
            ON training_sessions
            FOR SELECT
            TO authenticated
            USING (
                athlete_id = (SELECT auth.uid())
                OR
                (SELECT auth.role()) = 'admin'
            );
            
            CREATE POLICY training_sessions_insert_policy
            ON training_sessions
            FOR INSERT
            TO authenticated
            WITH CHECK (
                athlete_id = (SELECT auth.uid())
                OR
                (SELECT auth.role()) = 'admin'
            );
            
            CREATE POLICY training_sessions_update_policy
            ON training_sessions
            FOR UPDATE
            TO authenticated
            USING (
                athlete_id = (SELECT auth.uid())
                OR
                (SELECT auth.role()) = 'admin'
            )
            WITH CHECK (
                athlete_id = (SELECT auth.uid())
                OR
                (SELECT auth.role()) = 'admin'
            );
            
            CREATE POLICY training_sessions_delete_policy
            ON training_sessions
            FOR DELETE
            TO authenticated
            USING (
                athlete_id = (SELECT auth.uid())
                OR
                (SELECT auth.role()) = 'admin'
            );
        ELSE
            -- athlete_id is text/varchar, cast auth.uid() to text
            CREATE POLICY training_sessions_select_policy
            ON training_sessions
            FOR SELECT
            TO authenticated
            USING (
                athlete_id = (SELECT auth.uid())::text
                OR
                (SELECT auth.role()) = 'admin'
            );
            
            CREATE POLICY training_sessions_insert_policy
            ON training_sessions
            FOR INSERT
            TO authenticated
            WITH CHECK (
                athlete_id = (SELECT auth.uid())::text
                OR
                (SELECT auth.role()) = 'admin'
            );
            
            CREATE POLICY training_sessions_update_policy
            ON training_sessions
            FOR UPDATE
            TO authenticated
            USING (
                athlete_id = (SELECT auth.uid())::text
                OR
                (SELECT auth.role()) = 'admin'
            )
            WITH CHECK (
                athlete_id = (SELECT auth.uid())::text
                OR
                (SELECT auth.role()) = 'admin'
            );
            
            CREATE POLICY training_sessions_delete_policy
            ON training_sessions
            FOR DELETE
            TO authenticated
            USING (
                athlete_id = (SELECT auth.uid())::text
                OR
                (SELECT auth.role()) = 'admin'
            );
        END IF;
    END IF;
    -- If neither column exists, skip RLS policies (table may not need user-level access control)
END $$;

-- =============================================================================
-- 7. CREATE MISSING RLS POLICIES FOR TEAM_MEMBERS
-- =============================================================================
-- Only create policies if team_members table exists

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'team_members'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS team_members_select_policy ON team_members;
        DROP POLICY IF EXISTS team_members_insert_policy ON team_members;
        DROP POLICY IF EXISTS team_members_update_policy ON team_members;
        DROP POLICY IF EXISTS team_members_delete_policy ON team_members;
        
        -- Policy for SELECT: Users can view their own memberships and team members
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'team_members' 
            AND policyname = 'team_members_select_policy'
        ) THEN
            CREATE POLICY team_members_select_policy
            ON team_members
            FOR SELECT
            TO authenticated
            USING (
                -- Users can view their own memberships
                user_id = (SELECT auth.uid())
                OR
                -- Users can view other members of teams they belong to
                team_id IN (
                    SELECT team_id FROM team_members 
                    WHERE user_id = (SELECT auth.uid()) 
                    AND (status = 'active' OR status IS NULL)
                )
                OR
                -- Admins can view all memberships
                (SELECT auth.role()) = 'admin'
            );
        END IF;
        
        -- Policy for INSERT: Users can join teams (with approval if required)
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'team_members' 
            AND policyname = 'team_members_insert_policy'
        ) THEN
            CREATE POLICY team_members_insert_policy
            ON team_members
            FOR INSERT
            TO authenticated
            WITH CHECK (
                -- Users can create their own membership requests
                user_id = (SELECT auth.uid())
                OR
                -- Admins can add any members
                (SELECT auth.role()) = 'admin'
            );
        END IF;
        
        -- Policy for UPDATE: Team admins and users can update memberships
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'team_members' 
            AND policyname = 'team_members_update_policy'
        ) THEN
            CREATE POLICY team_members_update_policy
            ON team_members
            FOR UPDATE
            TO authenticated
            USING (
                -- Users can update their own membership
                user_id = (SELECT auth.uid())
                OR
                -- Team admins can update memberships
                team_id IN (
                    SELECT team_id FROM team_members 
                    WHERE user_id = (SELECT auth.uid()) 
                    AND role IN ('admin', 'coach')
                )
                OR
                -- Admins can update any membership
                (SELECT auth.role()) = 'admin'
            )
            WITH CHECK (
                -- Same check for new values
                user_id = (SELECT auth.uid())
                OR
                team_id IN (
                    SELECT team_id FROM team_members 
                    WHERE user_id = (SELECT auth.uid()) 
                    AND role IN ('admin', 'coach')
                )
                OR
                (SELECT auth.role()) = 'admin'
            );
        END IF;
        
        -- Policy for DELETE: Users can leave teams, admins can remove members
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'team_members' 
            AND policyname = 'team_members_delete_policy'
        ) THEN
            CREATE POLICY team_members_delete_policy
            ON team_members
            FOR DELETE
            TO authenticated
            USING (
                -- Users can delete their own membership
                user_id = (SELECT auth.uid())
                OR
                -- Team admins can remove members
                team_id IN (
                    SELECT team_id FROM team_members 
                    WHERE user_id = (SELECT auth.uid()) 
                    AND role IN ('admin', 'coach')
                )
                OR
                -- Admins can delete any membership
                (SELECT auth.role()) = 'admin'
            );
        END IF;
    END IF;
END $$;

-- =============================================================================
-- 7B. CREATE RLS POLICIES FOR POSITIONS TABLE
-- =============================================================================
-- Positions is a reference/lookup table (QB, WR, DB, etc.)
-- Public read access, admin-only write access

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'positions'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS positions_select_public ON positions;
        DROP POLICY IF EXISTS positions_write_admin ON positions;
        
        -- Policy for SELECT: Public read access (anyone can read positions)
        CREATE POLICY positions_select_public
        ON positions
        FOR SELECT
        TO public
        USING (true);
        
        -- Policy for INSERT/UPDATE/DELETE: Admin-only write access
        CREATE POLICY positions_write_admin
        ON positions
        FOR ALL
        TO authenticated
        USING ((SELECT auth.role()) = 'admin')
        WITH CHECK ((SELECT auth.role()) = 'admin');
    END IF;
END $$;

-- =============================================================================
-- 8. ENSURE TRIGGERS ARE PROPERLY SET UP
-- =============================================================================

-- Recreate triggers for updated_at columns (using IF NOT EXISTS pattern)
DO $$
BEGIN
    -- Users table trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Teams table trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_teams_updated_at'
    ) THEN
        CREATE TRIGGER update_teams_updated_at
        BEFORE UPDATE ON teams
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Training sessions trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_training_sessions_updated_at'
    ) THEN
        CREATE TRIGGER update_training_sessions_updated_at
        BEFORE UPDATE ON training_sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================================================
-- 9. ADD MISSING COLUMNS FOR CONSISTENCY
-- =============================================================================

-- Ensure teams table has all standard columns
DO $$
BEGIN
    -- Add created_by if it doesn't exist (useful for tracking team creators)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE teams ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
    END IF;
END $$;

-- =============================================================================
-- 10. CREATE VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View for active team memberships
-- Only create if team_members table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'team_members'
    ) THEN
        EXECUTE '
        CREATE OR REPLACE VIEW active_team_memberships AS
        SELECT 
            tm.id,
            tm.user_id,
            tm.team_id,
            tm.role,
            tm.position,
            tm.jersey_number,
            tm.joined_at,
            t.name as team_name,
            t.is_public,
            u.email as user_email,
            u.first_name,
            u.last_name
        FROM team_members tm
        INNER JOIN teams t ON tm.team_id = t.id
        INNER JOIN users u ON tm.user_id = u.id
        WHERE (tm.status = ''active'' OR tm.status IS NULL)
        AND t.is_active = true';
        
        EXECUTE 'COMMENT ON VIEW active_team_memberships IS ''View of all active team memberships with team and user details''';
    END IF;
END $$;

-- View for user training summary
-- Handle both user_id and athlete_id columns, only create if table exists
DO $$
DECLARE
    has_user_id BOOLEAN;
    has_athlete_id BOOLEAN;
    has_status BOOLEAN;
    has_session_date BOOLEAN;
BEGIN
    -- Check if training_sessions table exists
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'training_sessions'
    ) THEN
        -- Check which columns exist
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'training_sessions' 
            AND column_name = 'user_id'
        ) INTO has_user_id;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'training_sessions' 
            AND column_name = 'athlete_id'
        ) INTO has_athlete_id;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'training_sessions' 
            AND column_name = 'status'
        ) INTO has_status;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'training_sessions' 
            AND column_name = 'session_date'
        ) INTO has_session_date;
        
        -- Only create view if we have a user identifier column
        IF has_user_id OR has_athlete_id THEN
            IF has_user_id AND has_athlete_id THEN
                -- Both exist, use COALESCE
                EXECUTE '
                CREATE OR REPLACE VIEW user_training_summary AS
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
                CREATE OR REPLACE VIEW user_training_summary AS
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
                CREATE OR REPLACE VIEW user_training_summary AS
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
            
            EXECUTE 'COMMENT ON VIEW user_training_summary IS ''Summary statistics for each user''''s training sessions''';
        END IF;
    END IF;
END $$;

-- =============================================================================
-- 11. VALIDATION QUERIES (FOR VERIFICATION)
-- =============================================================================

-- Create function to check database consistency
CREATE OR REPLACE FUNCTION check_database_consistency()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'update_updated_at_column function exists'::TEXT,
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'update_updated_at_column'
        ) THEN 'PASS' ELSE 'FAIL' END,
        'Function required by many triggers'::TEXT
    
    UNION ALL
    
    SELECT 
        'RLS enabled on training_sessions'::TEXT,
        CASE WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'training_sessions' 
            AND rowsecurity = true
        ) THEN 'PASS' ELSE 'FAIL' END,
        'Row Level Security should be enabled'::TEXT
    
    UNION ALL
    
    SELECT 
        'RLS enabled on team_members'::TEXT,
        CASE 
            WHEN NOT EXISTS (
                SELECT 1 FROM pg_tables 
                WHERE tablename = 'team_members'
            ) THEN 'SKIP'
            WHEN EXISTS (
                SELECT 1 FROM pg_tables 
                WHERE tablename = 'team_members' 
                AND rowsecurity = true
            ) THEN 'PASS' 
            ELSE 'FAIL' 
        END,
        'Row Level Security should be enabled (or table does not exist)'::TEXT
    
    UNION ALL
    
    SELECT 
        'RLS enabled on positions'::TEXT,
        CASE 
            WHEN NOT EXISTS (
                SELECT 1 FROM pg_tables 
                WHERE tablename = 'positions'
            ) THEN 'SKIP'
            WHEN EXISTS (
                SELECT 1 FROM pg_tables 
                WHERE tablename = 'positions' 
                AND rowsecurity = true
            ) THEN 'PASS' 
            ELSE 'FAIL' 
        END,
        'Row Level Security should be enabled (or table does not exist)'::TEXT
    
    UNION ALL
    
    SELECT 
        'Foreign key: training_sessions.user_id -> users.id'::TEXT,
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'training_sessions_user_id_fkey'
        ) THEN 'PASS' ELSE 'FAIL' END,
        'Foreign key constraint should exist'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_database_consistency IS 'Validates database consistency and returns status of critical checks';

-- =============================================================================
-- 12. GRANT PERMISSIONS
-- =============================================================================

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION user_id_to_uuid TO authenticated;
GRANT EXECUTE ON FUNCTION check_database_consistency TO authenticated;

-- Grant select on views (only if they exist)
DO $$
BEGIN
    -- Grant on active_team_memberships if it exists
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'active_team_memberships'
    ) THEN
        GRANT SELECT ON active_team_memberships TO authenticated;
    END IF;
    
    -- Grant on user_training_summary if it exists
    IF EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'user_training_summary'
    ) THEN
        GRANT SELECT ON user_training_summary TO authenticated;
    END IF;
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Run consistency check
SELECT * FROM check_database_consistency();

