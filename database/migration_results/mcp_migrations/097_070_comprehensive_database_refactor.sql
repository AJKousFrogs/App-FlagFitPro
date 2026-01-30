-- =============================================================================
-- COMPREHENSIVE DATABASE REFACTOR - Migration 070
-- =============================================================================
-- This migration addresses 12 critical database design issues identified:
-- 1. Unified exercise catalog with proper type system
-- 2. Domain constraints with ENUMs and CHECK constraints
-- 3. Unique constraints and keys for data integrity
-- 4. ACWR versioning and deterministic behavior
-- 5. Computed compliance_rate replaced with view
-- 6. Position metrics with proper definitions
-- 7. Planned vs performed separation in logging
-- 8. Performance indexes for common queries
-- 9. Player program assignment semantics
-- 10. Video library ownership and rights
-- 11. Comprehensive RLS policies
-- 12. Bootstrap verification system
-- =============================================================================

-- =============================================================================
-- PART 1: CREATE ENUMS FOR DOMAIN CONSTRAINTS
-- =============================================================================

-- Difficulty levels (shared across all exercise types)
DO $$ BEGIN
    CREATE TYPE difficulty_level_enum AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Elite');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Session types
DO $$ BEGIN
    CREATE TYPE session_type_enum AS ENUM ('Strength', 'Speed', 'Skill', 'Recovery', 'Mobility', 'Conditioning', 'Position-Specific');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Risk levels for ACWR and injury monitoring
DO $$ BEGIN
    CREATE TYPE risk_level_enum AS ENUM ('Low', 'Optimal', 'Moderate', 'High', 'Critical', 'Baseline_Building', 'Baseline_Low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Exercise categories
DO $$ BEGIN
    CREATE TYPE exercise_category_enum AS ENUM (
        'Strength', 'Speed', 'Agility', 'Flexibility', 'Position-Specific',
        'Deceleration Training', 'Acceleration Training', 'First-Step Acceleration',
        'Fast-Twitch Development', 'Single-Leg Plyometrics', 'Reactive Eccentrics',
        'Rotational Power', 'Sprint Mechanics', 'Lateral Power',
        'Injury Prevention', 'Rehabilitation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Video source types
DO $$ BEGIN
    CREATE TYPE video_source_enum AS ENUM ('youtube', 'vimeo', 'supabase_storage', 'external');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Program status types
DO $$ BEGIN
    CREATE TYPE program_status_enum AS ENUM ('active', 'paused', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- PART 2: CREATE UNIFIED EXERCISE REGISTRY
-- =============================================================================

-- Exercise registry: Single source of truth for all exercises
CREATE TABLE IF NOT EXISTS exercise_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name VARCHAR(255) NOT NULL,
    exercise_type VARCHAR(50) NOT NULL CHECK (exercise_type IN ('plyometric', 'isometric', 'strength', 'skill', 'mobility')),
    category exercise_category_enum NOT NULL,
    difficulty_level difficulty_level_enum NOT NULL,
    
    -- Basic info
    description TEXT NOT NULL,
    instructions TEXT[],
    
    -- References to specialized tables
    plyometric_details_id UUID REFERENCES plyometrics_exercises(id) ON DELETE CASCADE,
    isometric_details_id UUID REFERENCES isometrics_exercises(id) ON DELETE CASCADE,
    general_exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    
    -- Common metadata
    video_url TEXT,
    thumbnail_url TEXT,
    equipment_needed TEXT[],
    position_specific BOOLEAN DEFAULT FALSE,
    applicable_positions UUID[],
    
    -- Research & Safety
    research_based BOOLEAN DEFAULT FALSE,
    research_source TEXT,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
    injury_risk_rating risk_level_enum DEFAULT 'Low',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: must reference at least one specialized table
    CONSTRAINT must_have_details CHECK (
        plyometric_details_id IS NOT NULL OR 
        isometric_details_id IS NOT NULL OR 
        general_exercise_id IS NOT NULL
    )
);

-- Index for exercise registry
CREATE INDEX IF NOT EXISTS idx_exercise_registry_type ON exercise_registry(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercise_registry_category ON exercise_registry(exercise_category);
CREATE INDEX IF NOT EXISTS idx_exercise_registry_difficulty ON exercise_registry(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_exercise_registry_active ON exercise_registry(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- PART 3: METRIC DEFINITIONS SYSTEM
-- =============================================================================

-- Metric definitions: Define all trackable metrics
CREATE TABLE IF NOT EXISTS metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    code VARCHAR(100) NOT NULL UNIQUE, -- 'qb_throwing_volume', 'wr_route_completion'
    display_name VARCHAR(255) NOT NULL, -- 'Weekly Throwing Volume', 'Route Completion %'
    
    -- Data type and constraints
    value_type VARCHAR(50) NOT NULL CHECK (value_type IN ('integer', 'decimal', 'percent', 'time', 'boolean')),
    unit VARCHAR(50), -- 'Throws', 'Routes', 'Yards', 'Seconds', '%'
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    
    -- Aggregation
    aggregation_method VARCHAR(50) CHECK (aggregation_method IN ('sum', 'avg', 'max', 'min', 'count')),
    
    -- Position specificity
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    is_position_specific BOOLEAN DEFAULT FALSE,
    
    -- Display and categorization
    category VARCHAR(100), -- 'Performance', 'Volume', 'Technique', 'Biometric'
    description TEXT,
    display_order INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metric entries: Actual metric data
CREATE TABLE IF NOT EXISTS metric_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    metric_definition_id UUID REFERENCES metric_definitions(id) ON DELETE CASCADE,
    
    -- Data
    date DATE NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate entries
    UNIQUE(player_id, metric_definition_id, workout_log_id)
);

-- Indexes for metric system
CREATE INDEX IF NOT EXISTS idx_metric_entries_player_date ON metric_entries(player_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_metric_entries_definition ON metric_entries(metric_definition_id);
CREATE INDEX IF NOT EXISTS idx_metric_entries_workout ON metric_entries(workout_log_id);

-- =============================================================================
-- PART 4: ADD CONSTRAINTS TO EXISTING TABLES
-- =============================================================================

-- Add unique constraint to positions.name (if not exists)
DO $$ BEGIN
    ALTER TABLE positions ADD CONSTRAINT positions_name_unique UNIQUE (name);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Add unique constraint to training_weeks (phase_id, week_number)
DO $$ BEGIN
    ALTER TABLE training_weeks ADD CONSTRAINT training_weeks_phase_week_unique UNIQUE (phase_id, week_number);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Add unique constraint to training_phases (program_id, phase_order)
DO $$ BEGIN
    ALTER TABLE training_phases ADD CONSTRAINT training_phases_program_order_unique UNIQUE (program_id, phase_order);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Add unique constraint to session_exercises (session_id, exercise_order)
DO $$ BEGIN
    ALTER TABLE session_exercises ADD CONSTRAINT session_exercises_order_unique UNIQUE (session_id, exercise_order);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Add CHECK constraints to existing tables
DO $$ BEGIN
    -- RPE constraint
    ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_rpe_check;
    ALTER TABLE workout_logs ADD CONSTRAINT workout_logs_rpe_check CHECK (rpe BETWEEN 1 AND 10);
    
    -- Duration constraint
    ALTER TABLE workout_logs DROP CONSTRAINT IF EXISTS workout_logs_duration_positive;
    ALTER TABLE workout_logs ADD CONSTRAINT workout_logs_duration_positive CHECK (duration_minutes > 0);
    
    -- Day of week constraint
    ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS training_sessions_day_of_week_check;
    ALTER TABLE training_sessions ADD CONSTRAINT training_sessions_day_of_week_check CHECK (day_of_week BETWEEN 0 AND 6);
    
    -- Load percentage constraint (0-200%)
    ALTER TABLE training_weeks DROP CONSTRAINT IF EXISTS training_weeks_load_percentage_check;
    ALTER TABLE training_weeks ADD CONSTRAINT training_weeks_load_percentage_check CHECK (load_percentage BETWEEN 0 AND 200);
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- =============================================================================
-- PART 5: ENHANCE WORKOUT_LOGS FOR PLANNED VS PERFORMED
-- =============================================================================

-- Add columns to workout_logs for better tracking
DO $$ BEGIN
    ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS program_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL;
    ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS workout_type VARCHAR(100) DEFAULT 'scheduled'; -- 'scheduled', 'ad-hoc', 'recovery'
    ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS was_modified BOOLEAN DEFAULT FALSE;
    ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS modification_notes TEXT;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Add columns to exercise_logs for substitutions
DO $$ BEGIN
    ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS prescribed_session_exercise_id UUID REFERENCES session_exercises(id) ON DELETE SET NULL;
    ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS actual_exercise_id UUID REFERENCES exercises(id);
    ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS is_substitution BOOLEAN DEFAULT FALSE;
    ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS substitution_reason TEXT;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- =============================================================================
-- PART 6: ENHANCE PLAYER_PROGRAMS TABLE
-- =============================================================================

-- Add missing columns to player_programs
DO $$ BEGIN
    ALTER TABLE player_programs ADD COLUMN IF NOT EXISTS assigned_position_id UUID REFERENCES positions(id);
    ALTER TABLE player_programs ADD COLUMN IF NOT EXISTS status program_status_enum DEFAULT 'active';
    ALTER TABLE player_programs ADD COLUMN IF NOT EXISTS paused_reason TEXT;
    ALTER TABLE player_programs ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
    ALTER TABLE player_programs ADD COLUMN IF NOT EXISTS assigned_timezone VARCHAR(50) DEFAULT 'UTC';
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Drop the compliance_rate column (will be replaced with view)
DO $$ BEGIN
    ALTER TABLE player_programs DROP COLUMN IF EXISTS compliance_rate;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Add partial unique index for active programs (one active program per player)
DROP INDEX IF EXISTS player_programs_one_active_per_player;
CREATE UNIQUE INDEX player_programs_one_active_per_player 
ON player_programs(player_id) 
WHERE status = 'active';

-- =============================================================================
-- PART 7: ENHANCE TRAINING_VIDEOS TABLE
-- =============================================================================

-- Add missing columns to training_videos
DO $$ BEGIN
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS source_type video_source_enum DEFAULT 'external';
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS license VARCHAR(255);
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS usage_rights TEXT;
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'removed', 'invalid', 'pending_review'));
    ALTER TABLE training_videos ADD COLUMN IF NOT EXISTS broken_link_checked_at TIMESTAMPTZ;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- =============================================================================
-- PART 8: ENHANCE LOAD_MONITORING FOR ACWR VERSIONING
-- =============================================================================

-- Add versioning and tracking to load_monitoring
DO $$ BEGIN
    ALTER TABLE load_monitoring ADD COLUMN IF NOT EXISTS calculation_version INTEGER DEFAULT 1;
    ALTER TABLE load_monitoring ADD COLUMN IF NOT EXISTS calculation_timestamp TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE load_monitoring ADD COLUMN IF NOT EXISTS data_sources JSONB; -- Store workout IDs used in calculation
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- =============================================================================
-- PART 9: CREATE VIEWS FOR COMPUTED VALUES
-- =============================================================================

-- View for program compliance rates
CREATE OR REPLACE VIEW v_player_program_compliance AS
SELECT 
    pp.id AS player_program_id,
    pp.player_id,
    pp.program_id,
    pp.start_date,
    pp.end_date,
    pp.status,
    COUNT(DISTINCT ts.id) AS total_planned_sessions,
    COUNT(DISTINCT wl.id) AS completed_sessions,
    CASE 
        WHEN COUNT(DISTINCT ts.id) > 0 
        THEN ROUND((COUNT(DISTINCT wl.id)::DECIMAL / COUNT(DISTINCT ts.id)::DECIMAL * 100), 2)
        ELSE 0 
    END AS compliance_rate,
    NOW() AS calculated_at
FROM player_programs pp
JOIN training_programs tp ON pp.program_id = tp.id
JOIN training_phases tph ON tph.program_id = tp.id
JOIN training_weeks tw ON tw.phase_id = tph.id
JOIN training_sessions ts ON ts.week_id = tw.id
    AND ts.day_of_week IS NOT NULL
    AND (pp.end_date IS NULL OR ts.week_id IN (
        SELECT tw2.id FROM training_weeks tw2 
        WHERE tw2.start_date BETWEEN pp.start_date AND COALESCE(pp.end_date, CURRENT_DATE)
    ))
LEFT JOIN workout_logs wl ON wl.player_id = pp.player_id 
    AND wl.session_id = ts.id
    AND DATE(wl.completed_at) BETWEEN pp.start_date AND COALESCE(pp.end_date, CURRENT_DATE)
WHERE pp.status IN ('active', 'completed')
GROUP BY pp.id, pp.player_id, pp.program_id, pp.start_date, pp.end_date, pp.status;

-- View for load monitoring with ACWR
CREATE OR REPLACE VIEW v_load_monitoring AS
SELECT 
    lm.*,
    CASE 
        WHEN lm.baseline_days < 7 THEN 'Baseline_Building'::risk_level_enum
        WHEN lm.baseline_days < 28 THEN 'Baseline_Low'::risk_level_enum
        WHEN lm.acwr IS NULL OR lm.acwr = 0 THEN 'Low'::risk_level_enum
        WHEN lm.acwr < 0.8 THEN 'Low'::risk_level_enum
        WHEN lm.acwr BETWEEN 0.8 AND 1.3 THEN 'Optimal'::risk_level_enum
        WHEN lm.acwr BETWEEN 1.3 AND 1.5 THEN 'Moderate'::risk_level_enum
        WHEN lm.acwr > 1.5 THEN 'High'::risk_level_enum
        ELSE 'Low'::risk_level_enum
    END AS computed_risk_level,
    lm.calculation_version,
    lm.calculation_timestamp
FROM load_monitoring lm;

-- =============================================================================
-- PART 10: PERFORMANCE INDEXES FOR COMMON QUERIES
-- =============================================================================

-- Workout logs indexes
CREATE INDEX IF NOT EXISTS idx_workout_logs_player_completed ON workout_logs(player_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_session_player ON workout_logs(session_id, player_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_workout_logs_completed_date ON workout_logs(DATE(completed_at));

-- Load monitoring indexes
CREATE INDEX IF NOT EXISTS idx_load_monitoring_player_date_desc ON load_monitoring(player_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_load_monitoring_date_recent ON load_monitoring(date DESC) WHERE date >= CURRENT_DATE - INTERVAL '90 days';

-- Training sessions indexes
CREATE INDEX IF NOT EXISTS idx_training_sessions_week_day ON training_sessions(week_id, day_of_week, session_order);

-- Session exercises indexes
CREATE INDEX IF NOT EXISTS idx_session_exercises_session_order ON session_exercises(session_id, exercise_order);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_plyometrics_position_apps_gin ON plyometrics_exercises USING GIN (position_applications);
CREATE INDEX IF NOT EXISTS idx_session_exercises_params_gin ON session_exercises USING GIN (position_specific_params);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_metrics_gin ON exercise_logs USING GIN (performance_metrics);

-- =============================================================================
-- PART 11: SEED METRIC DEFINITIONS
-- =============================================================================

-- Get position IDs (we'll need them for position-specific metrics)
DO $$
DECLARE
    qb_id UUID;
    wr_id UUID;
    db_id UUID;
BEGIN
    SELECT id INTO qb_id FROM positions WHERE name = 'QB' LIMIT 1;
    SELECT id INTO wr_id FROM positions WHERE name = 'WR' LIMIT 1;
    SELECT id INTO db_id FROM positions WHERE name = 'DB' LIMIT 1;

    -- QB Metrics
    INSERT INTO metric_definitions (code, display_name, value_type, unit, aggregation_method, position_id, is_position_specific, category, description, display_order)
    VALUES 
        ('qb_throwing_volume', 'Weekly Throwing Volume', 'integer', 'Throws', 'sum', qb_id, TRUE, 'Volume', 'Total number of throws per week', 1),
        ('qb_completion_rate', 'Completion Rate', 'percent', '%', 'avg', qb_id, TRUE, 'Performance', 'Percentage of completed passes', 2),
        ('qb_release_time', 'Average Release Time', 'time', 'seconds', 'avg', qb_id, TRUE, 'Technique', 'Time from snap to release', 3),
        ('qb_pocket_mobility', 'Pocket Mobility Score', 'integer', 'points', 'avg', qb_id, TRUE, 'Performance', 'Mobility rating in the pocket', 4)
    ON CONFLICT (code) DO NOTHING;

    -- WR Metrics
    INSERT INTO metric_definitions (code, display_name, value_type, unit, aggregation_method, position_id, is_position_specific, category, description, display_order)
    VALUES 
        ('wr_route_completion', 'Route Completion', 'percent', '%', 'avg', wr_id, TRUE, 'Performance', 'Percentage of routes run correctly', 1),
        ('wr_separation_distance', 'Average Separation', 'decimal', 'yards', 'avg', wr_id, TRUE, 'Performance', 'Average separation from defender', 2),
        ('wr_catch_rate', 'Catch Rate', 'percent', '%', 'avg', wr_id, TRUE, 'Performance', 'Percentage of catchable balls caught', 3)
    ON CONFLICT (code) DO NOTHING;

    -- DB Metrics
    INSERT INTO metric_definitions (code, display_name, value_type, unit, aggregation_method, position_id, is_position_specific, category, description, display_order)
    VALUES 
        ('db_coverage_reps', 'Coverage Repetitions', 'integer', 'reps', 'sum', db_id, TRUE, 'Volume', 'Number of coverage reps per session', 1),
        ('db_break_time', 'Break Time', 'time', 'seconds', 'avg', db_id, TRUE, 'Performance', 'Time to break on ball', 2),
        ('db_hip_flip_speed', 'Hip Flip Speed', 'time', 'seconds', 'avg', db_id, TRUE, 'Technique', 'Speed of hip flip transition', 3)
    ON CONFLICT (code) DO NOTHING;

    -- General Performance Metrics (not position-specific)
    INSERT INTO metric_definitions (code, display_name, value_type, unit, aggregation_method, is_position_specific, category, description, display_order)
    VALUES 
        ('sprint_40_yard', '40-Yard Dash Time', 'time', 'seconds', 'min', FALSE, 'Performance', '40-yard dash time', 1),
        ('vertical_jump', 'Vertical Jump', 'decimal', 'inches', 'max', FALSE, 'Performance', 'Vertical jump height', 2),
        ('pro_agility', 'Pro Agility (5-10-5)', 'time', 'seconds', 'min', FALSE, 'Performance', 'Pro agility shuttle time', 3),
        ('broad_jump', 'Broad Jump', 'decimal', 'inches', 'max', FALSE, 'Performance', 'Standing broad jump distance', 4)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- =============================================================================
-- PART 12: ENHANCED RLS POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE exercise_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_entries ENABLE ROW LEVEL SECURITY;

-- Exercise Registry Policies
CREATE POLICY "Exercise registry viewable by everyone" 
ON exercise_registry FOR SELECT 
USING (is_public = TRUE OR (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Coaches can manage exercise registry" 
ON exercise_registry FOR ALL 
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

-- Metric Definitions Policies
CREATE POLICY "Metric definitions viewable by authenticated users" 
ON metric_definitions FOR SELECT 
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Coaches can manage metric definitions" 
ON metric_definitions FOR ALL 
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

-- Metric Entries Policies
CREATE POLICY "Players can view own metric entries" 
ON metric_entries FOR SELECT 
USING (player_id = (SELECT auth.uid()));

CREATE POLICY "Coaches can view all metric entries" 
ON metric_entries FOR SELECT 
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

CREATE POLICY "Players can insert own metric entries" 
ON metric_entries FOR INSERT 
WITH CHECK (player_id = (SELECT auth.uid()));

CREATE POLICY "Coaches can manage all metric entries" 
ON metric_entries FOR ALL 
USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role') IN ('coach', 'admin'));

-- =============================================================================
-- PART 13: BOOTSTRAP VERIFICATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION verify_database_bootstrap()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check 1: ACWR functions exist
    RETURN QUERY
    SELECT 
        'ACWR Functions'::TEXT,
        CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' of 4 required ACWR functions'::TEXT
    FROM pg_proc
    WHERE proname IN ('calculate_daily_load', 'calculate_acute_load', 'calculate_chronic_load', 'calculate_acwr_safe');

    -- Check 2: ACWR trigger exists
    RETURN QUERY
    SELECT 
        'ACWR Trigger'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Trigger: ' || COALESCE(string_agg(tgname, ', '), 'MISSING')::TEXT
    FROM pg_trigger
    WHERE tgname = 'trigger_update_load_monitoring';

    -- Check 3: Exercise tables exist
    RETURN QUERY
    SELECT 
        'Exercise Tables'::TEXT,
        CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' of 4 required exercise tables'::TEXT
    FROM information_schema.tables
    WHERE table_name IN ('exercises', 'plyometrics_exercises', 'isometrics_exercises', 'exercise_registry')
    AND table_schema = 'public';

    -- Check 4: Metric system exists
    RETURN QUERY
    SELECT 
        'Metric System'::TEXT,
        CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' of 2 required metric tables'::TEXT
    FROM information_schema.tables
    WHERE table_name IN ('metric_definitions', 'metric_entries')
    AND table_schema = 'public';

    -- Check 5: Unique constraints exist
    RETURN QUERY
    SELECT 
        'Unique Constraints'::TEXT,
        CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' critical unique constraints'::TEXT
    FROM information_schema.table_constraints
    WHERE constraint_type = 'UNIQUE'
    AND constraint_name IN (
        'positions_name_unique',
        'training_weeks_phase_week_unique',
        'training_phases_program_order_unique',
        'session_exercises_order_unique'
    );

    -- Check 6: Views exist
    RETURN QUERY
    SELECT 
        'Computed Views'::TEXT,
        CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' of 2 required views'::TEXT
    FROM information_schema.views
    WHERE table_name IN ('v_player_program_compliance', 'v_load_monitoring')
    AND table_schema = 'public';

    -- Check 7: Performance indexes
    RETURN QUERY
    SELECT 
        'Performance Indexes'::TEXT,
        CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' performance indexes'::TEXT
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';

    -- Check 8: Seed data counts
    RETURN QUERY
    SELECT 
        'Exercise Library'::TEXT,
        CASE WHEN COUNT(*) >= 50 THEN 'PASS' ELSE 'WARN' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' exercises in library'::TEXT
    FROM plyometrics_exercises;

    -- Check 9: Metric definitions
    RETURN QUERY
    SELECT 
        'Metric Definitions'::TEXT,
        CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'WARN' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' metric definitions'::TEXT
    FROM metric_definitions;

    -- Check 10: RLS enabled
    RETURN QUERY
    SELECT 
        'RLS Enabled'::TEXT,
        CASE WHEN COUNT(*) >= 15 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'RLS enabled on ' || COUNT(*)::TEXT || ' tables'::TEXT
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = true;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_database_bootstrap() TO authenticated;

-- =============================================================================
-- PART 14: UPDATE TIMESTAMP TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that have updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Run verification check
SELECT * FROM verify_database_bootstrap();

-- =============================================================================
-- NOTES
-- =============================================================================
/*
This migration addresses all 12 issues identified:

1. ✅ Unified exercise catalog via exercise_registry table
2. ✅ Domain constraints via ENUMs and CHECK constraints
3. ✅ Unique constraints on critical tables
4. ✅ ACWR versioning with calculation_version and data_sources
5. ✅ Compliance rate replaced with v_player_program_compliance view
6. ✅ Position metrics via metric_definitions and metric_entries
7. ✅ Planned vs performed separation in workout_logs and exercise_logs
8. ✅ Performance indexes for all common query patterns
9. ✅ Player program assignment with status, position, timezone
10. ✅ Video library with source_type, ownership, rights, status
11. ✅ Comprehensive RLS policies for new tables
12. ✅ Bootstrap verification via verify_database_bootstrap() function

NEXT STEPS:
1. Run this migration on your Supabase instance
2. Execute: SELECT * FROM verify_database_bootstrap();
3. Address any FAIL or WARN results
4. Populate exercise_registry from existing exercise tables
5. Create metric entries for existing workout data
*/

