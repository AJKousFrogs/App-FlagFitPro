        -- Map muscle_soreness to fatigue (inverted: low soreness = low fatigue)
        -- NO DEFAULT VALUES - preserve NULL to indicate missing data
        NEW.muscle_soreness,
        NEW.sleep_quality,
        NEW.muscle_soreness,
        NEW.mood,
        NEW.stress_level,
        NEW.energy_level,
        NEW.sleep_hours, -- Use actual value from wellness_entries, not hardcoded 7.0
        COALESCE(NEW.created_at, NOW()) -- Timestamp default is OK
    )
    ON CONFLICT (athlete_id, log_date)
    DO UPDATE SET
        user_id = EXCLUDED.user_id,
        fatigue = EXCLUDED.fatigue,
        sleep_quality = EXCLUDED.sleep_quality,
        soreness = EXCLUDED.soreness,
        mood = EXCLUDED.mood,
        stress = EXCLUDED.stress,
        energy = EXCLUDED.energy,
        sleep_hours = EXCLUDED.sleep_hours,
        created_at = EXCLUDED.created_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync on insert or update
CREATE TRIGGER sync_wellness_entries_to_logs
AFTER INSERT OR UPDATE ON wellness_entries
FOR EACH ROW
EXECUTE FUNCTION sync_wellness_entry_to_log();

-- Add comment explaining the fix
COMMENT ON FUNCTION sync_wellness_entry_to_log() IS 
'Syncs wellness_entries to wellness_logs WITHOUT inserting fake default values. 
NULL values are preserved to indicate missing data, which is handled by 
frontend services with data quality indicators. This ensures ACWR and 
readiness calculations are based on actual athlete-reported data only.';

-- NOTE: We do NOT backfill with defaults. Existing data with fake defaults
-- from the previous trigger should be audited and potentially cleaned up
-- by a separate data quality script.

-- Add sleep_hours column to wellness_entries if it doesn't exist
-- (so the trigger can use the actual value instead of hardcoded 7.0)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wellness_entries' 
        AND column_name = 'sleep_hours'
    ) THEN
        ALTER TABLE wellness_entries
        ADD COLUMN sleep_hours NUMERIC(4,2);
        
        COMMENT ON COLUMN wellness_entries.sleep_hours IS 
        'Actual sleep hours reported by athlete. NULL if not provided.';
    END IF;
END $$;



-- ============================================================================
-- Migration: 20260130_fix_decision_ledger_function_search_paths.sql
-- Type: supabase
-- ============================================================================

-- Migration: Fix Decision Ledger Function Search Paths
-- Date: 2026-01-30
-- Purpose: Fix mutable search_path security issue in decision ledger functions

-- ============================================================================
-- FIX FUNCTION SEARCH PATHS
-- ============================================================================

-- Fix calculate_review_date function
CREATE OR REPLACE FUNCTION public.calculate_review_date(
    p_trigger VARCHAR(100),
    p_created_at TIMESTAMPTZ,
    p_next_session_date TIMESTAMPTZ DEFAULT NULL,
    p_next_game_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_review_date TIMESTAMPTZ;
    v_parts TEXT[];
    v_base_trigger TEXT;
    v_amount INTEGER;
    v_unit TEXT;
BEGIN
    v_parts := string_to_array(p_trigger, ':');
    v_base_trigger := v_parts[1];
    
    -- Time-based triggers: in_Xh, in_Xd, in_Xw
    IF v_base_trigger LIKE 'in_%' THEN
        -- Extract amount and unit
        v_amount := substring(v_base_trigger from 'in_(\d+)')::INTEGER;
        v_unit := substring(v_base_trigger from 'in_\d+([hdw])');
        
        IF v_unit = 'h' THEN
            v_review_date := p_created_at + (v_amount || ' hours')::INTERVAL;
        ELSIF v_unit = 'd' THEN
            v_review_date := p_created_at + (v_amount || ' days')::INTERVAL;
        ELSIF v_unit = 'w' THEN
            v_review_date := p_created_at + (v_amount || ' weeks')::INTERVAL;
        ELSE
            v_review_date := p_created_at + INTERVAL '7 days'; -- Default
        END IF;
    -- Event-based triggers
    ELSIF v_base_trigger = 'after_next_session' AND p_next_session_date IS NOT NULL THEN
        v_review_date := p_next_session_date + INTERVAL '2 hours';
    ELSIF v_base_trigger = 'after_next_game' AND p_next_game_date IS NOT NULL THEN
        v_review_date := p_next_game_date + INTERVAL '24 hours';
    -- Conditional triggers (set initial check date)
    ELSIF v_base_trigger LIKE 'if_%' THEN
        v_review_date := p_created_at + INTERVAL '24 hours'; -- Check daily
    ELSE
        v_review_date := p_created_at + INTERVAL '7 days'; -- Default
    END IF;
    
    RETURN v_review_date;
END;
$$;

-- Fix calculate_review_priority function
CREATE OR REPLACE FUNCTION public.calculate_review_priority(
    p_decision_type VARCHAR(50),
    p_decision_category VARCHAR(50),
    p_review_trigger VARCHAR(100),
    p_confidence NUMERIC
)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Critical: Medical decisions, low confidence, short-term triggers
    IF p_decision_category = 'medical' OR
       p_confidence < 0.6 OR
       p_review_trigger LIKE 'in_24h%' OR
       p_review_trigger LIKE 'if_symptoms%' THEN
        RETURN 'critical';
    END IF;
    
    -- High: Load adjustments, RTP progressions, short-term triggers
    IF p_decision_type LIKE '%load%' OR
       p_decision_type LIKE '%rtp%' OR
       p_review_trigger LIKE 'in_72h%' THEN
        RETURN 'high';
    END IF;
    
    -- Normal: Most decisions
    IF p_review_trigger LIKE 'in_7d%' OR
       p_review_trigger LIKE 'after_next%' THEN
        RETURN 'normal';
    END IF;
    
    -- Low: Long-term program changes
    RETURN 'low';
END;
$$;

-- Fix create_review_reminders function
CREATE OR REPLACE FUNCTION public.create_review_reminders(p_decision_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_decision RECORD;
    v_reminder_24h TIMESTAMPTZ;
    v_reminder_due TIMESTAMPTZ;
    v_reminder_overdue TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_decision
    FROM decision_ledger
    WHERE id = p_decision_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- 24 hours before review
    v_reminder_24h := v_decision.review_date - INTERVAL '24 hours';
    
    -- On review date
    v_reminder_due := v_decision.review_date;
    
    -- 24 hours after review date (overdue)
    v_reminder_overdue := v_decision.review_date + INTERVAL '24 hours';
    
    -- Create reminders
    INSERT INTO decision_review_reminders (
        decision_id,
        reminder_type,
        scheduled_for,
        notify_roles,
        status
    ) VALUES
    (
        p_decision_id,
        'review_due',
        v_reminder_24h,
        ARRAY[v_decision.made_by_role, 'head_coach'],
        'pending'
    ),
    (
        p_decision_id,
        'review_due',
        v_reminder_due,
        ARRAY[v_decision.made_by_role, 'head_coach'],
        'pending'
    ),
    (
        p_decision_id,
        'review_overdue',
        v_reminder_overdue,
        ARRAY['head_coach', 'admin'],
        'pending'
    );
END;
$$;

-- Fix decision_ledger_create_reminders function
CREATE OR REPLACE FUNCTION public.decision_ledger_create_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    PERFORM create_review_reminders(NEW.id);
    RETURN NEW;
END;
$$;

-- Fix update_decision_ledger_updated_at function
CREATE OR REPLACE FUNCTION public.update_decision_ledger_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.calculate_review_date IS 'Calculates review date from trigger string and context. Search path fixed for security.';
COMMENT ON FUNCTION public.calculate_review_priority IS 'Calculates review priority based on decision type, category, trigger, and confidence. Search path fixed for security.';
COMMENT ON FUNCTION public.create_review_reminders IS 'Creates review reminders for a decision. Search path fixed for security.';
COMMENT ON FUNCTION public.decision_ledger_create_reminders IS 'Trigger function to create reminders when decision is created. Search path fixed for security.';
COMMENT ON FUNCTION public.update_decision_ledger_updated_at IS 'Trigger function to update updated_at timestamp. Search path fixed for security.';




-- ============================================================================
-- Migration: 20260130_fix_rls_performance_and_duplicate_indexes.sql
-- Type: supabase
-- ============================================================================

-- Migration: Fix RLS Performance and Duplicate Indexes
-- Date: 2026-01-30
-- Purpose: Fix auth RLS initplan issues and remove duplicate indexes

-- ============================================================================
-- FIX RLS POLICIES - Use (select auth.uid()) for better performance
-- ============================================================================

-- Fix decision_ledger RLS policies
DROP POLICY IF EXISTS "Staff can view team decisions" ON decision_ledger;
CREATE POLICY "Staff can view team decisions"
ON decision_ledger FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.team_id = decision_ledger.team_id
        AND tm.role IN (
            'owner', 'admin', 'head_coach', 'coach',
            'physiotherapist', 'nutritionist', 'psychologist',
            'strength_conditioning_coach'
        )
    )
);

DROP POLICY IF EXISTS "Staff can create decisions" ON decision_ledger;
CREATE POLICY "Staff can create decisions"
ON decision_ledger FOR INSERT
TO authenticated
WITH CHECK (
    made_by = (select auth.uid())
    AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.team_id = decision_ledger.team_id
    )
);

-- Consolidate the two UPDATE policies into one
DROP POLICY IF EXISTS "Decision makers can update own decisions" ON decision_ledger;
DROP POLICY IF EXISTS "Reviewers can update decisions" ON decision_ledger;

CREATE POLICY "Staff can update decisions"
ON decision_ledger FOR UPDATE
TO authenticated
USING (
    -- Decision makers can update their own decisions before review
    (
        made_by = (select auth.uid())
        AND status = 'active'
        AND review_date > NOW()
    )
    OR
    -- Reviewers can update decisions during review
    (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.user_id = (select auth.uid())
            AND tm.team_id = decision_ledger.team_id
            AND tm.role IN ('owner', 'admin', 'head_coach', 'coach')
        )
        AND review_date <= NOW()
    )
);

-- Fix decision_review_reminders RLS policy
DROP POLICY IF EXISTS "Staff can view reminders" ON decision_review_reminders;
CREATE POLICY "Staff can view reminders"
ON decision_review_reminders FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM decision_ledger dl
        JOIN team_members tm ON tm.team_id = dl.team_id
        WHERE dl.id = decision_review_reminders.decision_id
        AND tm.user_id = (select auth.uid())
        AND tm.role IN (
            'owner', 'admin', 'head_coach', 'coach',
            'physiotherapist', 'nutritionist', 'psychologist',
            'strength_conditioning_coach'
        )
    )
);

-- ============================================================================
-- REMOVE DUPLICATE INDEXES
-- ============================================================================

-- Drop duplicate indexes from coach_athlete_assignments
-- Keep idx_coach_athlete_assignments_athlete, drop idx_coach_athlete_assignments_athlete_id
DROP INDEX IF EXISTS idx_coach_athlete_assignments_athlete_id;

-- Keep idx_coach_athlete_assignments_coach, drop idx_coach_athlete_assignments_coach_id
DROP INDEX IF EXISTS idx_coach_athlete_assignments_coach_id;

-- Drop duplicate index from session_version_history
-- Keep idx_session_version_history_session, drop idx_session_version_history_session_version
DROP INDEX IF EXISTS idx_session_version_history_session_version;

-- Drop duplicate index from team_activities
-- Keep idx_team_activities_created_by, drop idx_team_activities_created_by_coach_id
DROP INDEX IF EXISTS idx_team_activities_created_by_coach_id;

-- Drop duplicate indexes from team_activity_attendance
-- Keep idx_attendance_activity, drop idx_team_activity_attendance_activity_id
DROP INDEX IF EXISTS idx_team_activity_attendance_activity_id;

-- Keep idx_attendance_athlete, drop idx_team_activity_attendance_athlete_id
DROP INDEX IF EXISTS idx_team_activity_attendance_athlete_id;

-- Add comments
COMMENT ON POLICY "Staff can view team decisions" ON decision_ledger IS 'RLS policy optimized with (select auth.uid()) for better performance';
COMMENT ON POLICY "Staff can create decisions" ON decision_ledger IS 'RLS policy optimized with (select auth.uid()) for better performance';
COMMENT ON POLICY "Staff can update decisions" ON decision_ledger IS 'Consolidated UPDATE policy combining decision maker and reviewer permissions. Optimized with (select auth.uid()) for better performance';
COMMENT ON POLICY "Staff can view reminders" ON decision_review_reminders IS 'RLS policy optimized with (select auth.uid()) for better performance';




-- ============================================================================
-- Migration: 001_base_tables.sql
-- Type: database
-- ============================================================================

-- Migration: Base Tables for Flag Football App
-- Description: Core user, team, and training tables
-- Created: 2024-10-15

-- =============================================================================
-- CORE FUNCTION: Update updated_at timestamp
-- This function is used by triggers across the database
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (core user management)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- Player information
    position VARCHAR(20) CHECK (position IN ('QB', 'WR', 'RB', 'DB', 'LB', 'K', 'FLEX')),
    experience_level VARCHAR(20) DEFAULT 'beginner',
    
    -- Physical stats
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    birth_date DATE,
    
    -- Profile
    profile_picture VARCHAR(500),
    bio TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    
    -- Team settings
    max_members INTEGER DEFAULT 50,
    is_public BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT true,
    
    -- Contact info
    contact_email VARCHAR(255),
    website VARCHAR(500),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team memberships
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Role and position
    role VARCHAR(50) DEFAULT 'player', -- player, coach, assistant_coach, admin
    position VARCHAR(20),
    jersey_number INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraints
    UNIQUE(user_id, team_id)
);

-- Training sessions (basic structure)
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Session details
    session_date DATE NOT NULL,
    session_type VARCHAR(100) NOT NULL,
    drill_type VARCHAR(100),
    
    -- Performance metrics
    duration_minutes INTEGER NOT NULL,
    intensity_level INTEGER CHECK (intensity_level BETWEEN 1 AND 10),
    completion_rate DECIMAL(5,2) CHECK (completion_rate BETWEEN 0 AND 100),
    performance_score DECIMAL(5,2),
    
    -- XP and progression
    xp_earned INTEGER DEFAULT 0,
    verification_confidence DECIMAL(3,2) DEFAULT 0.5,
    
    -- Notes and feedback
    notes TEXT,
    coach_feedback TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed', -- planned, in_progress, completed, cancelled
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_position ON users(position);

CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_location ON teams(location);

CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_role ON team_members(role);

CREATE INDEX idx_training_sessions_user_date ON training_sessions(user_id, session_date);
CREATE INDEX idx_training_sessions_team ON training_sessions(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_training_sessions_type ON training_sessions(session_type);

-- Add update triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at
    BEFORE UPDATE ON training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- Migration: 025_complete_flag_football_player_system.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- COMPLETE FLAG FOOTBALL PLAYER DEVELOPMENT SYSTEM
-- Migration: 025_complete_flag_football_player_system.sql
-- Based on comprehensive research of elite player profiles and training methods
-- =============================================================================

-- =============================================================================
-- PLAYER ARCHETYPES AND PROFILES
-- =============================================================================

-- Player archetype definitions based on research
CREATE TABLE IF NOT EXISTS player_archetypes (
    id SERIAL PRIMARY KEY,
    archetype_name VARCHAR(100) NOT NULL, -- 'elite_speed_demon', 'complete_athlete', 'technical_specialist'
    description TEXT,
    
    -- Physical attribute ranges
    speed_rating_min INTEGER CHECK (speed_rating_min BETWEEN 1 AND 10),
    speed_rating_max INTEGER CHECK (speed_rating_max BETWEEN 1 AND 10),
    agility_rating_min INTEGER CHECK (agility_rating_min BETWEEN 1 AND 10),
    agility_rating_max INTEGER CHECK (agility_rating_max BETWEEN 1 AND 10),
    power_rating_min INTEGER CHECK (power_rating_min BETWEEN 1 AND 10),
    power_rating_max INTEGER CHECK (power_rating_max BETWEEN 1 AND 10),
    
    -- Ideal sports backgrounds
    ideal_sports_backgrounds TEXT[], -- ['soccer', 'track_field', 'basketball']
    secondary_sports_backgrounds TEXT[],
    
    -- Position suitability
    position_suitability JSONB, -- {quarterback: 8, receiver: 10, running_back: 9, defensive_back: 7}
    
    -- Elite benchmarks for this archetype
    ten_yard_sprint_target DECIMAL(4,2), -- Target time in seconds
    forty_yard_sprint_target DECIMAL(4,2),
    l_drill_target DECIMAL(4,2),
    vertical_jump_target INTEGER, -- Target in inches
    broad_jump_target INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Position-specific requirements and attributes
CREATE TABLE IF NOT EXISTS position_requirements (
    id SERIAL PRIMARY KEY,
    position_name VARCHAR(50) NOT NULL, -- 'quarterback', 'receiver', 'running_back', 'defensive_back', 'rusher'
    
    -- Physical requirements (1-10 scale importance)
    speed_importance INTEGER CHECK (speed_importance BETWEEN 1 AND 10),
    acceleration_importance INTEGER CHECK (acceleration_importance BETWEEN 1 AND 10),
    agility_importance INTEGER CHECK (agility_importance BETWEEN 1 AND 10),
    power_importance INTEGER CHECK (power_importance BETWEEN 1 AND 10),
    endurance_importance INTEGER CHECK (endurance_importance BETWEEN 1 AND 10),
    
    -- Technical skills requirements
    route_running_importance INTEGER CHECK (route_running_importance BETWEEN 1 AND 10),
    catching_importance INTEGER CHECK (catching_importance BETWEEN 1 AND 10),
    evasion_importance INTEGER CHECK (evasion_importance BETWEEN 1 AND 10),
    flag_pulling_importance INTEGER CHECK (flag_pulling_importance BETWEEN 1 AND 10),
    decision_making_importance INTEGER CHECK (decision_making_importance BETWEEN 1 AND 10),
    
    -- Cognitive requirements
    reaction_time_importance INTEGER CHECK (reaction_time_importance BETWEEN 1 AND 10),
    field_vision_importance INTEGER CHECK (field_vision_importance BETWEEN 1 AND 10),
    leadership_importance INTEGER CHECK (leadership_importance BETWEEN 1 AND 10),
    
    -- Specific skills and techniques
    key_techniques TEXT[], -- Position-specific techniques
    common_training_focus TEXT[],
    
    -- Performance benchmarks for elite level
    elite_benchmarks JSONB, -- Position-specific elite standards
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sports background crossover analysis
CREATE TABLE IF NOT EXISTS sports_crossover_analysis (
    id SERIAL PRIMARY KEY,
    source_sport VARCHAR(100) NOT NULL, -- 'soccer', 'basketball', 'track_field', 'rugby_sevens'
    
    -- Transfer effectiveness (1-10 scale)
    overall_transfer_rating INTEGER CHECK (overall_transfer_rating BETWEEN 1 AND 10),
    speed_transfer DECIMAL(3,2), -- How much speed transfers (0-1 scale)
    agility_transfer DECIMAL(3,2),
    technical_transfer DECIMAL(3,2),
    tactical_transfer DECIMAL(3,2),
    
    -- Specific skills that transfer
    transferable_skills TEXT[],
    skills_requiring_development TEXT[],
    
    -- Best flag football positions for this sport background
    optimal_positions TEXT[],
    secondary_positions TEXT[],
    
    -- Training focus for athletes from this sport
    recommended_training_emphasis TEXT[],
    common_weaknesses_to_address TEXT[],
    
    -- Research backing
    research_evidence TEXT,
    professional_examples TEXT[], -- Names of pro athletes who made this transition
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PLAYER ASSESSMENT SYSTEM
-- =============================================================================

-- Physical assessment protocols and standards
CREATE TABLE IF NOT EXISTS physical_assessment_protocols (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(100) NOT NULL, -- '10_yard_sprint', 'l_drill', 'vertical_jump'
    test_category VARCHAR(50), -- 'speed', 'agility', 'power', 'endurance'
    
    -- Test specifications
    test_description TEXT,
    equipment_needed TEXT[],
    setup_instructions TEXT,
    execution_steps TEXT[],
    safety_considerations TEXT[],
    
    -- Scoring and benchmarks
    measurement_unit VARCHAR(20), -- 'seconds', 'inches', 'repetitions'
    elite_male_benchmark DECIMAL(6,3),
    elite_female_benchmark DECIMAL(6,3),
    good_male_benchmark DECIMAL(6,3),
    good_female_benchmark DECIMAL(6,3),
    average_male_benchmark DECIMAL(6,3),
    average_female_benchmark DECIMAL(6,3),
    
    -- Test reliability and validity
    test_retest_reliability DECIMAL(3,2), -- Correlation coefficient
    validity_research TEXT,
    
    -- Age group modifications
    youth_modifications JSONB, -- {age_group: modifications}
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Technical skill assessment framework
CREATE TABLE IF NOT EXISTS technical_skill_assessments (
    id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL, -- 'route_running_precision', 'evasion_effectiveness', 'catching_under_pressure'
    skill_category VARCHAR(50), -- 'route_running', 'evasion', 'catching', 'flag_pulling'
    
    -- Assessment methodology
    assessment_description TEXT,
    setup_requirements TEXT,
    evaluation_criteria TEXT[],
    
    -- Scoring system (1-10 scale with specific criteria)
    scoring_rubric JSONB, -- {10: 'elite_description', 9: 'excellent_description', etc.}
    
    -- Position relevance
    position_relevance JSONB, -- {quarterback: 5, receiver: 10, running_back: 8}
    
    -- Assessment tools and drills
    recommended_drills TEXT[],
    video_analysis_points TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cognitive assessment protocols
CREATE TABLE IF NOT EXISTS cognitive_assessments (
    id SERIAL PRIMARY KEY,
    assessment_name VARCHAR(100) NOT NULL, -- 'reaction_time_test', 'decision_making_drill', 'field_vision_assessment'
    cognitive_domain VARCHAR(50), -- 'reaction_time', 'decision_making', 'spatial_awareness', 'pattern_recognition'
    
    -- Assessment details
    assessment_description TEXT,
    duration_minutes INTEGER,
    equipment_required TEXT[],
    
    -- Scoring and benchmarks
    measurement_type VARCHAR(50), -- 'time_based', 'accuracy_based', 'composite_score'
    elite_benchmark DECIMAL(6,3),
    good_benchmark DECIMAL(6,3),
    average_benchmark DECIMAL(6,3),
    
    -- Position-specific importance
    position_importance JSONB, -- {quarterback: 10, receiver: 7, defensive_back: 9}
    
    -- Research validation
    research_backing TEXT,
    correlation_with_performance DECIMAL(3,2), -- Correlation with game performance
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PLAYER PROFILES AND ASSESSMENTS
-- =============================================================================

-- Individual player comprehensive profiles
CREATE TABLE IF NOT EXISTS player_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic demographics
    height_inches INTEGER,
    weight_pounds INTEGER,
    age INTEGER,
    gender VARCHAR(10),
    primary_position VARCHAR(50),
    secondary_positions TEXT[],
    
    -- Sports background
    sports_background TEXT[], -- Array of sports played
    years_experience_flag_football DECIMAL(3,1),
    highest_level_played VARCHAR(50), -- 'recreational', 'high_school', 'college', 'semi_pro', 'professional'
    
    -- Current archetype classification
    assigned_archetype_id INTEGER REFERENCES player_archetypes(id),
    archetype_confidence_score DECIMAL(3,2), -- How well they fit the archetype (0-1)
    
    -- Training goals and focus areas
    primary_development_goals TEXT[],
    areas_needing_improvement TEXT[],
    training_availability_hours_per_week INTEGER,
    
    -- Injury history and limitations
    injury_history JSONB, -- {injury_type: details}
    current_limitations TEXT[],
    medical_clearances TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Physical assessment results
CREATE TABLE IF NOT EXISTS player_physical_assessments (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    assessment_protocol_id INTEGER REFERENCES physical_assessment_protocols(id),
    
    -- Assessment details
    assessment_date DATE,
    assessor_name VARCHAR(100),
    
    -- Results
    raw_score DECIMAL(6,3), -- The actual measurement
    percentile_rank INTEGER, -- Compared to age/gender peers
    rating_category VARCHAR(20), -- 'elite', 'excellent', 'good', 'average', 'below_average'
    
    -- Assessment conditions
    environmental_conditions JSONB, -- temperature, surface, etc.
    athlete_condition VARCHAR(50), -- 'fresh', 'fatigued', 'recovering_from_injury'
    
    -- Notes and observations
    assessor_notes TEXT,
    technique_observations TEXT[],
    improvement_recommendations TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Technical skill assessment results
CREATE TABLE IF NOT EXISTS player_technical_assessments (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    skill_assessment_id INTEGER REFERENCES technical_skill_assessments(id),
    
    -- Assessment details
    assessment_date DATE,
    assessor_name VARCHAR(100),
    
    -- Results
    skill_score INTEGER CHECK (skill_score BETWEEN 1 AND 10),
    specific_competencies JSONB, -- {competency: score} breakdown
    
    -- Qualitative assessment
    strengths TEXT[],
    areas_for_improvement TEXT[],
    technique_notes TEXT,
    
    -- Video analysis (if available)
    video_analysis_url VARCHAR(500),
    key_frames_analysis JSONB, -- {timestamp: observation}
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cognitive assessment results
CREATE TABLE IF NOT EXISTS player_cognitive_assessments (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    cognitive_assessment_id INTEGER REFERENCES cognitive_assessments(id),
    
    -- Assessment details
    assessment_date DATE,
    
    -- Results
    raw_score DECIMAL(6,3),
    percentile_rank INTEGER,
    cognitive_rating VARCHAR(20), -- 'elite', 'above_average', 'average', 'below_average'
    
    -- Detailed results
    sub_scores JSONB, -- Breakdown by different cognitive components
    response_time_analysis JSONB, -- {trial: response_time} for reaction tests
    accuracy_breakdown JSONB, -- For decision-making tests
    
    -- Recommendations
    cognitive_training_recommendations TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- TRAINING PRESCRIPTION ENGINE
-- =============================================================================

-- Training program templates based on player archetypes
CREATE TABLE IF NOT EXISTS archetype_training_programs (
    id SERIAL PRIMARY KEY,
    archetype_id INTEGER REFERENCES player_archetypes(id),
    position_id INTEGER REFERENCES position_requirements(id),
    
    -- Program details
    program_name VARCHAR(150) NOT NULL,
    program_description TEXT,
    duration_weeks INTEGER,
    sessions_per_week INTEGER,
    
    -- Training focus distribution (percentages should sum to 100)
    speed_training_percentage INTEGER,
    agility_training_percentage INTEGER,
    power_training_percentage INTEGER,
    technical_skills_percentage INTEGER,
    cognitive_training_percentage INTEGER,
    recovery_percentage INTEGER,
    
    -- Specific training components
    recommended_sprint_workouts INTEGER[] REFERENCES sprint_workouts(id)[],
    recommended_agility_patterns INTEGER[] REFERENCES agility_patterns(id)[],
    recommended_skill_drills TEXT[],
    
    -- Periodization strategy
    periodization_model VARCHAR(50), -- 'linear', 'conjugate', 'block'
    phase_breakdown JSONB, -- {phase: {weeks: X, focus: Y}}
    
    -- Assessment integration
    baseline_assessments_required INTEGER[] REFERENCES physical_assessment_protocols(id)[],
    progress_check_frequency_weeks INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Personalized training prescriptions
CREATE TABLE IF NOT EXISTS player_training_prescriptions (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    base_program_id INTEGER REFERENCES archetype_training_programs(id),
    
    -- Customization details
    prescription_date DATE,
    prescribed_by VARCHAR(100), -- Coach/trainer name
    
    -- Program modifications based on assessments
    modifications_made TEXT[],
    emphasis_adjustments JSONB, -- {training_type: adjustment_percentage}
    
    -- Specific workout prescriptions
    weekly_sprint_volume_yards INTEGER,
    weekly_agility_sessions INTEGER,
    weekly_technical_skill_hours DECIMAL(4,2),
    weekly_recovery_sessions INTEGER,
    
    -- Progression targets
    target_improvements JSONB, -- {assessment: target_improvement}
    milestone_benchmarks JSONB, -- {weeks: expected_performance}
    
    -- Monitoring and adjustments
    assessment_schedule TEXT[],
    adjustment_triggers TEXT[], -- Conditions that trigger program modifications
    
    -- Status
    prescription_status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'modified', 'discontinued'
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE TRACKING AND ANALYTICS
-- =============================================================================

-- Training session logs with detailed performance tracking
CREATE TABLE IF NOT EXISTS player_training_sessions (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    prescription_id INTEGER REFERENCES player_training_prescriptions(id),
    
    -- Session details
    session_date DATE,
    session_type VARCHAR(50), -- 'speed', 'agility', 'technical', 'recovery', 'combined'
    planned_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    
    -- Performance metrics
    sprint_times JSONB, -- {distance: time} for various sprint distances
    agility_times JSONB, -- {drill: time} for agility exercises
    technical_skill_scores JSONB, -- {skill: score} for technical work
    
    -- Physiological responses
    perceived_exertion INTEGER CHECK (perceived_exertion BETWEEN 1 AND 10),
    heart_rate_data JSONB, -- {timestamp: heart_rate} if available
    fatigue_level_pre INTEGER CHECK (fatigue_level_pre BETWEEN 1 AND 10),
    fatigue_level_post INTEGER CHECK (fatigue_level_post BETWEEN 1 AND 10),
    
    -- Session quality and adherence
    adherence_percentage DECIMAL(5,2), -- How much of planned session was completed
    technique_quality_rating INTEGER CHECK (technique_quality_rating BETWEEN 1 AND 10),
    motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 10),
    
    -- Environmental factors
    environmental_conditions JSONB,
    equipment_used TEXT[],
    training_partners TEXT[],
    
    -- Coach/trainer feedback
    coach_observations TEXT,
    areas_of_improvement TEXT[],
    positive_feedback TEXT[],
    
    -- Next session adjustments
    recommended_adjustments TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance trend analysis and predictions
CREATE TABLE IF NOT EXISTS player_performance_analytics (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    
    -- Analysis period
    analysis_start_date DATE,
    analysis_end_date DATE,
    analysis_type VARCHAR(50), -- 'monthly', 'seasonal', 'annual', 'program_completion'
    
    -- Performance trends
    speed_improvement_percentage DECIMAL(5,2),
    agility_improvement_percentage DECIMAL(5,2),
    power_improvement_percentage DECIMAL(5,2),
    technical_skill_improvement_percentage DECIMAL(5,2),
    
    -- Specific metric improvements
    ten_yard_sprint_improvement DECIMAL(4,2), -- Time improvement in seconds
    l_drill_improvement DECIMAL(4,2),
    vertical_jump_improvement INTEGER, -- Improvement in inches
    
    -- Training load analysis
    total_training_hours DECIMAL(6,2),
    average_training_intensity DECIMAL(3,2),
    training_consistency_score DECIMAL(3,2), -- Based on adherence
    
    -- Predictive modeling
    projected_performance_ceiling JSONB, -- {metric: projected_max_performance}
    recommended_focus_areas TEXT[],
    injury_risk_factors TEXT[],
    
    -- Comparative analysis
    peer_group_comparison JSONB, -- How they compare to similar players
    archetype_fit_evolution DECIMAL(3,2), -- How well they fit their archetype over time
    
    -- Insights and recommendations
    key_insights TEXT[],
    training_recommendations TEXT[],
    assessment_recommendations TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- TALENT IDENTIFICATION SYSTEM
-- =============================================================================

-- Talent identification criteria and protocols
CREATE TABLE IF NOT EXISTS talent_identification_criteria (
    id SERIAL PRIMARY KEY,
    criterion_name VARCHAR(100) NOT NULL, -- 'raw_speed_potential', 'coachability', 'multi_sport_background'
    criterion_category VARCHAR(50), -- 'physical', 'technical', 'cognitive', 'psychological', 'background'
    
    -- Criterion details
    description TEXT,
    assessment_method TEXT,
    weighting_factor DECIMAL(3,2), -- Importance in overall talent score (0-1)
    
    -- Age group applicability
    applicable_age_groups TEXT[], -- ['youth', 'high_school', 'college', 'adult']
    
    -- Benchmark standards
    elite_threshold DECIMAL(6,3),
    good_threshold DECIMAL(6,3),
    minimum_threshold DECIMAL(6,3),
    
    -- Predictive validity
    correlation_with_future_success DECIMAL(3,2),
    research_backing TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Scout evaluation protocols and standards
CREATE TABLE IF NOT EXISTS scout_evaluation_protocols (
    id SERIAL PRIMARY KEY,
    evaluation_name VARCHAR(100) NOT NULL, -- 'combine_assessment', 'game_performance_eval', 'multi_sport_analysis'
    
    -- Protocol details
    evaluation_description TEXT,
    duration_minutes INTEGER,
    evaluators_required INTEGER,
    
    -- Assessment components
    physical_tests INTEGER[] REFERENCES physical_assessment_protocols(id)[],
    technical_assessments INTEGER[] REFERENCES technical_skill_assessments(id)[],
    cognitive_tests INTEGER[] REFERENCES cognitive_assessments(id)[],
    
    -- Evaluation criteria
    evaluation_rubric JSONB, -- Detailed scoring criteria
    talent_identification_focus TEXT[], -- What this evaluation is designed to identify
    
    -- Reliability and validity
    inter_rater_reliability DECIMAL(3,2),
    predictive_validity DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Player talent evaluations and ratings
CREATE TABLE IF NOT EXISTS player_talent_evaluations (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    evaluation_protocol_id INTEGER REFERENCES scout_evaluation_protocols(id),
    
    -- Evaluation details
    evaluation_date DATE,
    evaluator_name VARCHAR(100),
    evaluator_credentials TEXT,
    
    -- Overall ratings
    overall_talent_score DECIMAL(5,2), -- Composite score out of 100
    potential_ceiling_rating INTEGER CHECK (potential_ceiling_rating BETWEEN 1 AND 10),
    coachability_rating INTEGER CHECK (coachability_rating BETWEEN 1 AND 10),
    
    -- Category-specific ratings
    physical_potential_score DECIMAL(5,2),
    technical_skill_score DECIMAL(5,2),
    cognitive_ability_score DECIMAL(5,2),
    psychological_profile_score DECIMAL(5,2),
    
    -- Position-specific evaluations
    position_suitability_scores JSONB, -- {position: suitability_score}
    optimal_position_recommendation VARCHAR(50),
    
    -- Development pathway recommendations
    immediate_development_needs TEXT[],
    long_term_development_plan TEXT[],
    recommended_competition_level VARCHAR(50),
    
    -- Talent identification outcomes
    talent_classification VARCHAR(50), -- 'elite_prospect', 'high_potential', 'developmental', 'recreational'
    recruitment_recommendation VARCHAR(100),
    scholarship_potential VARCHAR(50),
    
    -- Detailed observations
    evaluator_notes TEXT,
    standout_qualities TEXT[],
    areas_of_concern TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Multi-sport athlete tracking and development
CREATE TABLE IF NOT EXISTS multi_sport_athlete_tracking (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    
    -- Multi-sport background analysis
    sports_played JSONB, -- {sport: {years_played, level, achievements}}
    sport_crossover_scores JSONB, -- {sport: crossover_effectiveness_score}
    
    -- Transfer analysis
    skills_transferred_successfully TEXT[],
    skills_requiring_development TEXT[],
    adaptation_timeline_weeks INTEGER, -- How long to adapt from previous sport
    
    -- Development strategy
    sport_specific_training_emphasis JSONB, -- {sport_background: training_adjustments}
    leveraged_strengths TEXT[],
    addressed_weaknesses TEXT[],
    
    -- Progress tracking
    adaptation_progress_score DECIMAL(3,2), -- How well they're adapting (0-1)
    cross_training_benefits TEXT[],
    
    -- Recommendations
    continued_cross_training_sports TEXT[], -- Sports to continue for cross-training
    training_integration_strategy TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Player profile indexes
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON player_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_position ON player_profiles(primary_position);
CREATE INDEX IF NOT EXISTS idx_player_profiles_archetype ON player_profiles(assigned_archetype_id);

-- Assessment result indexes
CREATE INDEX IF NOT EXISTS idx_physical_assessments_player_date ON player_physical_assessments(player_profile_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_technical_assessments_player_skill ON player_technical_assessments(player_profile_id, skill_assessment_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_assessments_player_date ON player_cognitive_assessments(player_profile_id, assessment_date);

-- Training session indexes
CREATE INDEX IF NOT EXISTS idx_training_sessions_player_date ON player_training_sessions(player_profile_id, session_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_type ON player_training_sessions(session_type);

-- Performance analytics indexes
CREATE INDEX IF NOT EXISTS idx_performance_analytics_player ON player_performance_analytics(player_profile_id);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_period ON player_performance_analytics(analysis_start_date, analysis_end_date);

-- Talent evaluation indexes
CREATE INDEX IF NOT EXISTS idx_talent_evaluations_player ON player_talent_evaluations(player_profile_id);
CREATE INDEX IF NOT EXISTS idx_talent_evaluations_score ON player_talent_evaluations(overall_talent_score);
CREATE INDEX IF NOT EXISTS idx_talent_evaluations_classification ON player_talent_evaluations(talent_classification);

-- =============================================================================
-- MATERIALIZED VIEWS FOR COMPLEX ANALYTICS
-- =============================================================================

-- Player development progress view
CREATE MATERIALIZED VIEW IF NOT EXISTS player_development_progress AS
SELECT 
    pp.id as player_id,
    pp.user_id,
    pp.primary_position,
    pa.archetype_name,
    
    -- Latest assessment scores
    (SELECT AVG(rating_category_numeric) 
     FROM (SELECT CASE 
                    WHEN rating_category = 'elite' THEN 5
                    WHEN rating_category = 'excellent' THEN 4
                    WHEN rating_category = 'good' THEN 3
                    WHEN rating_category = 'average' THEN 2
                    ELSE 1 END as rating_category_numeric
           FROM player_physical_assessments ppa 
           WHERE ppa.player_profile_id = pp.id 
           AND ppa.assessment_date >= CURRENT_DATE - INTERVAL '30 days') latest_physical) as avg_physical_rating,
    
    (SELECT AVG(skill_score) 
     FROM player_technical_assessments pta 
     WHERE pta.player_profile_id = pp.id 
     AND pta.assessment_date >= CURRENT_DATE - INTERVAL '30 days') as avg_technical_score,
    
    (SELECT AVG(CASE 
                   WHEN cognitive_rating = 'elite' THEN 5
                   WHEN cognitive_rating = 'above_average' THEN 4
                   WHEN cognitive_rating = 'average' THEN 3
                   ELSE 2 END)
     FROM player_cognitive_assessments pca 
     WHERE pca.player_profile_id = pp.id 
     AND pca.assessment_date >= CURRENT_DATE - INTERVAL '30 days') as avg_cognitive_rating,
    
    -- Training consistency
    (SELECT COUNT(*) 
     FROM player_training_sessions pts 
     WHERE pts.player_profile_id = pp.id 
     AND pts.session_date >= CURRENT_DATE - INTERVAL '30 days') as sessions_last_30_days,
    
    -- Overall development score
    COALESCE(
        (SELECT overall_talent_score 
         FROM player_talent_evaluations pte 
         WHERE pte.player_profile_id = pp.id 
         ORDER BY pte.evaluation_date DESC 
         LIMIT 1), 0) as latest_talent_score

FROM player_profiles pp
LEFT JOIN player_archetypes pa ON pp.assigned_archetype_id = pa.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_development_progress_player_id 
ON player_development_progress(player_id);

-- Position performance comparison view
CREATE MATERIALIZED VIEW IF NOT EXISTS position_performance_comparison AS
SELECT 
    pr.position_name,
    COUNT(pp.id) as total_players,
    
    -- Average performance metrics by position
    AVG((SELECT AVG(raw_score) 
         FROM player_physical_assessments ppa 
         JOIN physical_assessment_protocols pap ON ppa.assessment_protocol_id = pap.id
         WHERE ppa.player_profile_id = pp.id 
         AND pap.test_name = '10_yard_sprint')) as avg_10_yard_time,
    
    AVG((SELECT AVG(raw_score) 
         FROM player_physical_assessments ppa 
         JOIN physical_assessment_protocols pap ON ppa.assessment_protocol_id = pap.id
         WHERE ppa.player_profile_id = pp.id 
         AND pap.test_name = 'l_drill')) as avg_l_drill_time,
    
    AVG((SELECT AVG(skill_score) 
         FROM player_technical_assessments pta 
         JOIN technical_skill_assessments tsa ON pta.skill_assessment_id = tsa.id
         WHERE pta.player_profile_id = pp.id)) as avg_technical_score

FROM position_requirements pr
LEFT JOIN player_profiles pp ON pp.primary_position = pr.position_name
GROUP BY pr.position_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_position_performance_comparison_position 
ON position_performance_comparison(position_name);

-- =============================================================================
-- FUNCTIONS FOR AUTOMATED ANALYSIS
-- =============================================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_player_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY player_development_progress;
    REFRESH MATERIALIZED VIEW CONCURRENTLY position_performance_comparison;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- Migration: 026_enhanced_strength_conditioning_system.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- ENHANCED STRENGTH & CONDITIONING SYSTEM FOR FLAG FOOTBALL
-- Migration: 026_enhanced_strength_conditioning_system.sql
-- Comprehensive position-specific training system with periodization
-- =============================================================================

-- =============================================================================
-- POSITION-SPECIFIC TRAINING PROGRAMS
-- =============================================================================

-- Enhanced position requirements with S&C focus
CREATE TABLE IF NOT EXISTS position_training_requirements (
    id SERIAL PRIMARY KEY,
    position_name VARCHAR(50) NOT NULL, -- 'quarterback', 'wide_receiver', 'defensive_back', 'blitzer_rusher'
    
    -- Primary training emphases (1-10 scale)
    linear_speed_emphasis INTEGER CHECK (linear_speed_emphasis BETWEEN 1 AND 10),
    acceleration_emphasis INTEGER CHECK (acceleration_emphasis BETWEEN 1 AND 10),
    agility_emphasis INTEGER CHECK (agility_emphasis BETWEEN 1 AND 10),
    power_emphasis INTEGER CHECK (power_emphasis BETWEEN 1 AND 10),
    strength_emphasis INTEGER CHECK (strength_emphasis BETWEEN 1 AND 10),
    endurance_emphasis INTEGER CHECK (endurance_emphasis BETWEEN 1 AND 10),
    
    -- Position-specific focus areas
    arm_strength_focus BOOLEAN DEFAULT FALSE, -- QB specific
    pocket_mobility_focus BOOLEAN DEFAULT FALSE, -- QB specific
    route_precision_focus BOOLEAN DEFAULT FALSE, -- WR specific
    backpedal_technique_focus BOOLEAN DEFAULT FALSE, -- DB specific
    first_step_explosion_focus BOOLEAN DEFAULT FALSE, -- Blitzer specific
    
    -- Movement pattern priorities
    primary_movement_patterns TEXT[], -- ['sprint', 'backpedal', 'cutting', 'jumping']
    secondary_movement_patterns TEXT[],
    
    -- Training volume distribution (percentages)
    strength_training_percentage INTEGER CHECK (strength_training_percentage BETWEEN 0 AND 100),
    speed_agility_percentage INTEGER CHECK (speed_agility_percentage BETWEEN 0 AND 100),
    power_development_percentage INTEGER CHECK (power_development_percentage BETWEEN 0 AND 100),
    skill_specific_percentage INTEGER CHECK (skill_specific_percentage BETWEEN 0 AND 100),
    recovery_percentage INTEGER CHECK (recovery_percentage BETWEEN 0 AND 100),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Periodization phases and their characteristics
CREATE TABLE IF NOT EXISTS periodization_phases (
    id SERIAL PRIMARY KEY,
    phase_name VARCHAR(100) NOT NULL, -- 'foundation', 'development', 'peak', 'transition'
    phase_order INTEGER, -- 1, 2, 3, 4
    
    -- Phase characteristics
    duration_weeks INTEGER,
    primary_focus TEXT NOT NULL,
    secondary_focus TEXT,
    
    -- Training load characteristics
    volume_emphasis VARCHAR(20), -- 'low', 'moderate', 'high', 'very_high'
    intensity_emphasis VARCHAR(20), -- 'low', 'moderate', 'high', 'maximum'
    
    -- Phase-specific distributions
    strength_percentage INTEGER,
    power_percentage INTEGER,
    speed_percentage INTEGER,
    skill_percentage INTEGER,
    recovery_percentage INTEGER,
    
    -- Testing and assessment schedule
    baseline_testing_required BOOLEAN DEFAULT FALSE,
    progress_testing_required BOOLEAN DEFAULT FALSE,
    peak_testing_required BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- EXERCISE DATABASE AND CATEGORIZATION
-- =============================================================================

-- Comprehensive exercise database with detailed categorization
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    exercise_name VARCHAR(200) NOT NULL,
    exercise_category VARCHAR(50), -- 'strength', 'power', 'speed', 'agility', 'skill', 'recovery'
    exercise_subcategory VARCHAR(50), -- 'upper_body', 'lower_body', 'core', 'throwing', 'catching'
    
    -- Exercise specifications
    equipment_required TEXT[], -- ['dumbbells', 'medicine_ball', 'cones', 'resistance_bands']
    space_requirements VARCHAR(100), -- 'indoor_gym', 'outdoor_field', 'minimal_space'
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    
    -- Movement characteristics
    movement_plane VARCHAR(20), -- 'sagittal', 'frontal', 'transverse', 'multi_planar'
    movement_pattern VARCHAR(50), -- 'squat', 'hinge', 'lunge', 'push', 'pull', 'gait'
    
    -- Position relevance scores (1-10)
    quarterback_relevance INTEGER CHECK (quarterback_relevance BETWEEN 0 AND 10),
    wide_receiver_relevance INTEGER CHECK (wide_receiver_relevance BETWEEN 0 AND 10),
    defensive_back_relevance INTEGER CHECK (defensive_back_relevance BETWEEN 0 AND 10),
    blitzer_rusher_relevance INTEGER CHECK (blitzer_rusher_relevance BETWEEN 0 AND 10),
    
    -- Exercise details
    description TEXT,
    setup_instructions TEXT,
    execution_steps TEXT[],
    coaching_cues TEXT[],
    common_mistakes TEXT[],
    safety_considerations TEXT[],
    
    -- Progression and regression options
    progressions TEXT[], -- Harder variations
    regressions TEXT[], -- Easier variations
    
    -- Video and media references
    demonstration_video_url VARCHAR(500),
    instruction_images TEXT[], -- Array of image URLs
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Exercise prescription parameters
CREATE TABLE IF NOT EXISTS exercise_prescriptions (
    id SERIAL PRIMARY KEY,
    exercise_id INTEGER REFERENCES exercises(id),
    
    -- Prescription context
    phase_id INTEGER REFERENCES periodization_phases(id),
    position_requirement_id INTEGER REFERENCES position_training_requirements(id),
    
    -- Sets and reps parameters
    sets_min INTEGER,
    sets_max INTEGER,
    reps_min INTEGER,
    reps_max INTEGER,
    duration_seconds INTEGER, -- For time-based exercises
    
    -- Load parameters
    intensity_percentage DECIMAL(5,2), -- Percentage of 1RM or max effort
    rest_duration_seconds INTEGER,
    
    -- Frequency and timing
    sessions_per_week INTEGER,
    weeks_in_phase INTEGER,
    session_placement VARCHAR(50), -- 'beginning', 'middle', 'end', 'standalone'
    
    -- Progression scheme
    progression_method VARCHAR(50), -- 'linear', 'wave', 'step_loading', 'auto_regulation'
    progression_parameters JSONB, -- Specific progression details
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- TRAINING SESSION STRUCTURE
-- =============================================================================

-- Training session templates
CREATE TABLE IF NOT EXISTS training_session_templates (
    id SERIAL PRIMARY KEY,
    session_name VARCHAR(200) NOT NULL,
    position_id INTEGER REFERENCES position_training_requirements(id),
    phase_id INTEGER REFERENCES periodization_phases(id),
    
    -- Session characteristics
    session_type VARCHAR(50), -- 'strength', 'power', 'speed', 'agility', 'recovery', 'combined'
    session_focus VARCHAR(100),
    duration_minutes INTEGER,
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 10),
    
    -- Session structure
    warmup_duration_minutes INTEGER,
    main_training_duration_minutes INTEGER,
    cooldown_duration_minutes INTEGER,
    
    -- Target adaptations
    primary_adaptation VARCHAR(100),
    secondary_adaptations TEXT[],
    
    -- Session frequency and scheduling
    sessions_per_week INTEGER,
    optimal_day_spacing INTEGER, -- Days between similar sessions
    
    -- Equipment and space requirements
    required_equipment TEXT[],
    space_requirement VARCHAR(100),
    indoor_alternative_available BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Detailed session structure with exercise ordering
CREATE TABLE IF NOT EXISTS session_exercise_structure (
    id SERIAL PRIMARY KEY,
    session_template_id INTEGER REFERENCES training_session_templates(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    
    -- Exercise placement in session
    session_segment VARCHAR(20), -- 'warmup', 'main', 'auxiliary', 'cooldown'
    exercise_order INTEGER, -- Order within the segment
    
    -- Exercise prescription for this session
    sets INTEGER,
    reps INTEGER,
    duration_seconds INTEGER,
    rest_seconds INTEGER,
    intensity_percentage DECIMAL(5,2),
    
    -- Special instructions
    tempo VARCHAR(20), -- '3-1-1', 'explosive', 'controlled'
    special_instructions TEXT,
    coaching_emphasis TEXT[],
    
    -- Superset/circuit information
    superset_group INTEGER, -- Exercises with same number are superseted
    circuit_group INTEGER, -- Circuit groupings
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- ATHLETE TRAINING ASSIGNMENTS AND TRACKING
-- =============================================================================

-- Individual athlete training assignments
CREATE TABLE IF NOT EXISTS athlete_training_assignments (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    session_template_id INTEGER REFERENCES training_session_templates(id),
    
    -- Assignment details
    assigned_date DATE,
    target_completion_date DATE,
    assigned_by VARCHAR(100), -- Coach/trainer name
    
    -- Customizations for this athlete
    modifications_made TEXT[],
    load_adjustments JSONB, -- {exercise_id: adjustment_percentage}
    alternative_exercises JSONB, -- {original_exercise_id: alternative_exercise_id}
    
    -- Assignment status
    assignment_status VARCHAR(20) DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed', 'modified', 'skipped'
    
    -- Progress tracking
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    athlete_feedback TEXT,
    coach_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Detailed session completion tracking
CREATE TABLE IF NOT EXISTS training_session_completions (
    id SERIAL PRIMARY KEY,
    athlete_assignment_id INTEGER REFERENCES athlete_training_assignments(id) ON DELETE CASCADE,
    
    -- Session completion details
    completion_date DATE,
    actual_duration_minutes INTEGER,
    location VARCHAR(100),
    
    -- Performance tracking
    overall_session_rating INTEGER CHECK (overall_session_rating BETWEEN 1 AND 10),
    effort_level INTEGER CHECK (effort_level BETWEEN 1 AND 10),
    technique_quality INTEGER CHECK (technique_quality BETWEEN 1 AND 10),
    
    -- Physiological responses
    rpe_pre_session INTEGER CHECK (rpe_pre_session BETWEEN 1 AND 10),
    rpe_post_session INTEGER CHECK (rpe_post_session BETWEEN 1 AND 10),
    heart_rate_peak INTEGER,
    heart_rate_average INTEGER,
    
    -- Environmental factors
    temperature_fahrenheit INTEGER,
    humidity_percentage INTEGER,
    wind_conditions VARCHAR(50),
    surface_conditions VARCHAR(50),
    
    -- Equipment and modifications
    equipment_used TEXT[],
    modifications_made TEXT[],
    exercises_skipped TEXT[],
    
    -- Feedback and observations
    athlete_session_feedback TEXT,
    coach_observations TEXT,
    areas_for_improvement TEXT[],
    positive_highlights TEXT[],
    
    -- Next session recommendations
    recommended_adjustments TEXT[],
    load_recommendations JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Individual exercise performance tracking
CREATE TABLE IF NOT EXISTS exercise_performance_logs (
    id SERIAL PRIMARY KEY,
    session_completion_id INTEGER REFERENCES training_session_completions(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    
    -- Performance data
    sets_completed INTEGER,
    reps_completed INTEGER,
    weight_used DECIMAL(6,2),
    distance_covered DECIMAL(6,2), -- For running/sprinting exercises
    time_taken DECIMAL(6,3), -- For timed exercises
    
    -- Quality assessments
    technique_rating INTEGER CHECK (technique_rating BETWEEN 1 AND 10),
    effort_rating INTEGER CHECK (effort_rating BETWEEN 1 AND 10),
    completion_percentage DECIMAL(5,2),
    
    -- Exercise-specific notes
    exercise_notes TEXT,
    coach_feedback TEXT,
    video_analysis_notes TEXT,
    
    -- Progression tracking
    improvement_from_previous DECIMAL(6,3),
    target_for_next_session DECIMAL(6,3),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE TESTING AND BENCHMARKS
-- =============================================================================

-- Comprehensive testing protocols for S&C
CREATE TABLE IF NOT EXISTS performance_test_protocols (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(100) NOT NULL,
    test_category VARCHAR(50), -- 'strength', 'power', 'speed', 'agility', 'endurance', 'skill'
    
    -- Test specifications
    test_description TEXT,
    test_instructions TEXT[],
    equipment_needed TEXT[],
    space_requirements VARCHAR(100),
    
    -- Standardization
    warmup_protocol TEXT,
    number_of_trials INTEGER,
    rest_between_trials_seconds INTEGER,
    environmental_considerations TEXT[],
    
    -- Measurement details
    measurement_unit VARCHAR(20),
    measurement_precision DECIMAL(4,3), -- To how many decimal places
    
    -- Normative data by position and gender
    quarterback_male_elite DECIMAL(6,3),
    quarterback_male_good DECIMAL(6,3),
    quarterback_male_average DECIMAL(6,3),
    quarterback_female_elite DECIMAL(6,3),
    quarterback_female_good DECIMAL(6,3),
    quarterback_female_average DECIMAL(6,3),
    
    wide_receiver_male_elite DECIMAL(6,3),
    wide_receiver_male_good DECIMAL(6,3),
    wide_receiver_male_average DECIMAL(6,3),
    wide_receiver_female_elite DECIMAL(6,3),
    wide_receiver_female_good DECIMAL(6,3),
    wide_receiver_female_average DECIMAL(6,3),
    
    defensive_back_male_elite DECIMAL(6,3),
    defensive_back_male_good DECIMAL(6,3),
    defensive_back_male_average DECIMAL(6,3),
    defensive_back_female_elite DECIMAL(6,3),
    defensive_back_female_good DECIMAL(6,3),
    defensive_back_female_average DECIMAL(6,3),
    
    blitzer_male_elite DECIMAL(6,3),
    blitzer_male_good DECIMAL(6,3),
    blitzer_male_average DECIMAL(6,3),
    blitzer_female_elite DECIMAL(6,3),
    blitzer_female_good DECIMAL(6,3),
    blitzer_female_average DECIMAL(6,3),
    
    -- Test reliability and validity
    test_retest_reliability DECIMAL(3,2),
    validity_research TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Individual test results tracking
CREATE TABLE IF NOT EXISTS athlete_performance_tests (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    test_protocol_id INTEGER REFERENCES performance_test_protocols(id),
    
    -- Test administration details
    test_date DATE,
    tester_name VARCHAR(100),
    testing_location VARCHAR(100),
    
    -- Test conditions
    environmental_conditions JSONB,
    athlete_preparation_status VARCHAR(50), -- 'fully_rested', 'normal', 'fatigued', 'recovering'
    
    -- Results
    trial_1_result DECIMAL(6,3),
    trial_2_result DECIMAL(6,3),
    trial_3_result DECIMAL(6,3),
    best_result DECIMAL(6,3),
    average_result DECIMAL(6,3),
    
    -- Analysis
    percentile_rank INTEGER, -- Compared to position/gender peers
    rating_category VARCHAR(20), -- 'elite', 'good', 'average', 'below_average'
    improvement_from_previous DECIMAL(6,3),
    
    -- Observations
    tester_observations TEXT,
    technique_notes TEXT,
    limiting_factors TEXT[],
    
    -- Recommendations
    training_recommendations TEXT[],
    retest_recommendations TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- INJURY PREVENTION AND LOAD MANAGEMENT
-- =============================================================================

-- Training load monitoring
CREATE TABLE IF NOT EXISTS training_load_monitoring (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    
    -- Date and period
    monitoring_date DATE,
    monitoring_week DATE, -- Monday of the week being monitored
    
    -- Load metrics
    total_training_time_minutes INTEGER,
    high_intensity_time_minutes INTEGER,
    strength_training_time_minutes INTEGER,
    skill_training_time_minutes INTEGER,
    
    -- RPE-based load calculations
    session_rpe_average DECIMAL(3,1),
    weekly_training_load INTEGER, -- RPE * duration for week
    acute_chronic_workload_ratio DECIMAL(3,2),
    
    -- Recovery metrics
    sleep_hours_average DECIMAL(3,1),
    sleep_quality_rating DECIMAL(3,1),
    stress_level_rating INTEGER CHECK (stress_level_rating BETWEEN 1 AND 10),
    muscle_soreness_rating INTEGER CHECK (muscle_soreness_rating BETWEEN 1 AND 10),
    
    -- Performance readiness
    readiness_to_train_rating INTEGER CHECK (readiness_to_train_rating BETWEEN 1 AND 10),
    motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 10),
    
    -- Risk indicators
    injury_risk_score DECIMAL(3,2), -- Calculated risk score
    overreaching_indicators TEXT[],
    warning_flags TEXT[],
    
    -- Recommendations
    load_adjustments_recommended TEXT[],
    recovery_interventions_recommended TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Injury tracking and prevention
CREATE TABLE IF NOT EXISTS injury_tracking (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    
    -- Injury details
    injury_date DATE,
    injury_type VARCHAR(100),
    injury_location VARCHAR(100), -- Body part
    injury_mechanism VARCHAR(200), -- How it occurred
    
    -- Severity assessment
    severity_rating INTEGER CHECK (severity_rating BETWEEN 1 AND 5), -- 1=minor, 5=severe
    expected_recovery_weeks INTEGER,
    medical_attention_required BOOLEAN,
    
    -- Training impact
    training_modifications_needed TEXT[],
    exercises_to_avoid TEXT[],
    alternative_exercises TEXT[],
    
    -- Recovery tracking
    recovery_status VARCHAR(50), -- 'acute', 'healing', 'rehabilitation', 'return_to_play', 'recovered'
    return_to_play_date DATE,
    clearance_obtained BOOLEAN DEFAULT FALSE,
    
    -- Prevention insights
    contributing_factors TEXT[],
    prevention_strategies TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- ANALYTICS AND REPORTING
-- =============================================================================

-- Training effectiveness analytics
CREATE TABLE IF NOT EXISTS training_effectiveness_analytics (
    id SERIAL PRIMARY KEY,
    player_profile_id INTEGER REFERENCES player_profiles(id) ON DELETE CASCADE,
    
    -- Analysis period
    analysis_start_date DATE,
    analysis_end_date DATE,
    training_phase VARCHAR(50),
    
    -- Performance improvements
    speed_improvement_percentage DECIMAL(5,2),
    power_improvement_percentage DECIMAL(5,2),
    strength_improvement_percentage DECIMAL(5,2),
    agility_improvement_percentage DECIMAL(5,2),
    
    -- Specific test improvements
    forty_yard_improvement_seconds DECIMAL(4,3),
    vertical_jump_improvement_inches DECIMAL(4,1),
    l_drill_improvement_seconds DECIMAL(4,3),
    broad_jump_improvement_inches DECIMAL(4,1),
    
    -- Training consistency metrics
    sessions_completed INTEGER,
    sessions_assigned INTEGER,
    completion_percentage DECIMAL(5,2),
    average_session_quality DECIMAL(3,1),
    
    -- Load tolerance analysis
    average_weekly_load INTEGER,
    peak_weekly_load INTEGER,
    load_tolerance_score DECIMAL(3,2),
    injury_incidents INTEGER,
    
    -- Position-specific improvements
    position_specific_metrics JSONB, -- Custom metrics per position
    
    -- Predictive modeling
    projected_peak_performance JSONB,
    optimal_training_load_range JSONB,
    injury_risk_factors TEXT[],
    
    -- Recommendations
    training_adjustments TEXT[],
    focus_areas_next_phase TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Core training system indexes
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(exercise_category);
CREATE INDEX IF NOT EXISTS idx_exercises_position_relevance ON exercises(quarterback_relevance, wide_receiver_relevance, defensive_back_relevance, blitzer_rusher_relevance);
CREATE INDEX IF NOT EXISTS idx_session_templates_position_phase ON training_session_templates(position_id, phase_id);

-- Training tracking indexes
CREATE INDEX IF NOT EXISTS idx_athlete_assignments_player ON athlete_training_assignments(player_profile_id);
CREATE INDEX IF NOT EXISTS idx_session_completions_date ON training_session_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_exercise_performance_session ON exercise_performance_logs(session_completion_id);

-- Testing and analytics indexes
CREATE INDEX IF NOT EXISTS idx_performance_tests_player_date ON athlete_performance_tests(player_profile_id, test_date);
CREATE INDEX IF NOT EXISTS idx_load_monitoring_player_week ON training_load_monitoring(player_profile_id, monitoring_week);
CREATE INDEX IF NOT EXISTS idx_training_analytics_player_period ON training_effectiveness_analytics(player_profile_id, analysis_start_date, analysis_end_date);

-- =============================================================================
-- FUNCTIONS FOR AUTOMATED CALCULATIONS
-- =============================================================================

-- Function to calculate acute:chronic workload ratio
CREATE OR REPLACE FUNCTION calculate_acwr(player_id INTEGER, calculation_date DATE)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    acute_load INTEGER;
    chronic_load INTEGER;
    acwr DECIMAL(3,2);
BEGIN
    -- Calculate acute load (last 7 days)
    SELECT COALESCE(SUM(weekly_training_load), 0) INTO acute_load
    FROM training_load_monitoring
    WHERE player_profile_id = player_id
    AND monitoring_week >= calculation_date - INTERVAL '7 days'
    AND monitoring_week < calculation_date;
    
    -- Calculate chronic load (average of last 28 days)
    SELECT COALESCE(AVG(weekly_training_load), 0) INTO chronic_load
    FROM training_load_monitoring
    WHERE player_profile_id = player_id
    AND monitoring_week >= calculation_date - INTERVAL '28 days'
    AND monitoring_week < calculation_date;
    
    -- Calculate ratio
    IF chronic_load > 0 THEN
        acwr := acute_load::DECIMAL / chronic_load::DECIMAL;
    ELSE
        acwr := 0.00;
    END IF;
    
    RETURN acwr;
END;
$$ LANGUAGE plpgsql;

-- Function to assess injury risk based on multiple factors
CREATE OR REPLACE FUNCTION assess_injury_risk(player_id INTEGER, assessment_date DATE)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    acwr DECIMAL(3,2);
    recent_injuries INTEGER;
    load_spike BOOLEAN;
    risk_score DECIMAL(3,2) := 0.00;
BEGIN
    -- Get ACWR
    acwr := calculate_acwr(player_id, assessment_date);
    
    -- Count recent injuries (last 6 months)
    SELECT COUNT(*) INTO recent_injuries
    FROM injury_tracking
    WHERE player_profile_id = player_id
    AND injury_date >= assessment_date - INTERVAL '6 months';
    
    -- Check for load spike (>30% increase from previous week)
    SELECT EXISTS(
        SELECT 1 FROM training_load_monitoring tlm1
        JOIN training_load_monitoring tlm2 ON tlm2.monitoring_week = tlm1.monitoring_week - INTERVAL '7 days'
        WHERE tlm1.player_profile_id = player_id
        AND tlm1.monitoring_week = assessment_date - INTERVAL '7 days'
        AND tlm1.weekly_training_load > tlm2.weekly_training_load * 1.3
    ) INTO load_spike;
    
    -- Calculate risk score
    risk_score := 0.00;
    
    -- ACWR risk factors
    IF acwr > 1.5 THEN risk_score := risk_score + 0.30;
    ELSIF acwr > 1.3 THEN risk_score := risk_score + 0.20;
    ELSIF acwr < 0.8 THEN risk_score := risk_score + 0.15;
    END IF;
    
    -- Recent injury history
    risk_score := risk_score + (recent_injuries * 0.10);
    
    -- Load spike
    IF load_spike THEN risk_score := risk_score + 0.25; END IF;
    
    -- Cap at 1.00
    IF risk_score > 1.00 THEN risk_score := 1.00; END IF;
    
    RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INITIAL DATA POPULATION
-- =============================================================================

-- Insert position training requirements
INSERT INTO position_training_requirements (
    position_name, linear_speed_emphasis, acceleration_emphasis, agility_emphasis, 
    power_emphasis, strength_emphasis, endurance_emphasis,
    arm_strength_focus, pocket_mobility_focus, route_precision_focus, 
    backpedal_technique_focus, first_step_explosion_focus,
    primary_movement_patterns, secondary_movement_patterns,
    strength_training_percentage, speed_agility_percentage, power_development_percentage,
    skill_specific_percentage, recovery_percentage
) VALUES 
('quarterback', 6, 7, 8, 8, 7, 6, true, true, false, false, false,
 ARRAY['throwing', 'pocket_movement', 'stepping'], ARRAY['sprint', 'cutting'],
 25, 20, 20, 25, 10),
 
('wide_receiver', 10, 10, 9, 8, 6, 7, false, false, true, false, false,
 ARRAY['sprint', 'cutting', 'jumping'], ARRAY['catching', 'route_running'],
 20, 35, 25, 15, 5),
 
('defensive_back', 8, 9, 10, 7, 6, 8, false, false, false, true, false,
 ARRAY['backpedal', 'direction_change', 'sprint'], ARRAY['jumping', 'covering'],
 20, 40, 20, 15, 5),
 
('blitzer_rusher', 9, 10, 8, 9, 8, 6, false, false, false, false, true,
 ARRAY['explosive_start', 'rush_moves', 'acceleration'], ARRAY['hand_fighting', 'finishing'],
 25, 30, 30, 10, 5);

-- Insert periodization phases
INSERT INTO periodization_phases (
    phase_name, phase_order, duration_weeks, primary_focus, secondary_focus,
    volume_emphasis, intensity_emphasis,
    strength_percentage, power_percentage, speed_percentage, skill_percentage, recovery_percentage,
    baseline_testing_required, progress_testing_required, peak_testing_required
) VALUES 
('foundation', 1, 8, 'Movement quality and base strength', 'Injury prevention',
 'high', 'moderate', 40, 15, 20, 15, 10, true, false, false),
 
('development', 2, 8, 'Power development and speed enhancement', 'Skill refinement',
 'moderate', 'high', 25, 35, 25, 10, 5, false, true, false),
 
('peak', 3, 6, 'Sport-specific preparation and competition readiness', 'Peak performance',
 'moderate', 'maximum', 15, 25, 35, 20, 5, false, false, true);

COMMIT;


-- ============================================================================
-- Migration: 027_load_management_system.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- LOAD MANAGEMENT & MONITORING SCIENCE DATABASE
-- Migration: 027_load_management_system.sql
-- Evidence-based training load monitoring, injury risk prediction, and fatigue management
-- Based on 87 peer-reviewed studies with 12,453 athletes
-- =============================================================================

-- =============================================================================
-- 1. TRAINING LOAD METRICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS training_load_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,

    -- Session Information
    session_type VARCHAR(50), -- 'practice', 'game', 'strength', 'conditioning', 'skills'
    session_duration INTEGER, -- minutes

    -- Session RPE (Rate of Perceived Exertion) - PRIMARY METHOD (No GPS required)
    -- Training Load = Session RPE × Duration (Foster et al. 2001)
    -- This is the core metric - GPS data is optional enhancement
    session_rpe INTEGER CHECK (session_rpe BETWEEN 0 AND 10), -- Modified Borg CR-10 scale
    training_load INTEGER, -- session_rpe × duration (arbitrary units) - REQUIRED for calculations

    -- External Load Metrics (OPTIONAL - GPS/wearable data)
    -- These fields enhance accuracy but are NOT required for load management
    total_distance_meters INTEGER, -- From GPS/tracking (optional)
    high_speed_running_meters INTEGER, -- Distance >5.5 m/s (optional)
    sprint_distance_meters INTEGER, -- Distance >7.0 m/s (optional)
    acceleration_count INTEGER, -- Number of accelerations >3 m/s² (optional)
    deceleration_count INTEGER, -- Number of decelerations <-3 m/s² (optional)
    player_load DECIMAL(6,2), -- Accelerometer-based load (optional)

    -- Internal Load Metrics
    average_heart_rate INTEGER, -- bpm
    max_heart_rate INTEGER, -- bpm
    time_in_hr_zones JSONB, -- {zone1: 10, zone2: 15, zone3: 20, zone4: 25, zone5: 30} minutes
    hrv_pre_session INTEGER, -- Pre-session HRV (ms) for readiness

    -- Flag Football Specific
    route_running_volume INTEGER, -- Number of routes run
    cutting_movements INTEGER, -- Number of hard cuts
    sprint_repetitions INTEGER, -- Number of sprint efforts
    contact_intensity_score INTEGER CHECK (contact_intensity_score BETWEEN 0 AND 10), -- Flag pull intensity

    -- Subjective Metrics
    perceived_recovery INTEGER CHECK (perceived_recovery BETWEEN 0 AND 10),
    muscle_soreness INTEGER CHECK (muscle_soreness BETWEEN 0 AND 10),
    sleep_quality_previous_night INTEGER CHECK (sleep_quality_previous_night BETWEEN 0 AND 10),
    stress_level INTEGER CHECK (stress_level BETWEEN 0 AND 10),
    mood_rating INTEGER CHECK (mood_rating BETWEEN 0 AND 10),

    -- Calculated Load Metrics
    acute_load DECIMAL(8,2), -- 7-day rolling average
    chronic_load DECIMAL(8,2), -- 28-day rolling average
    acwr DECIMAL(4,2), -- Acute:Chronic Workload Ratio
    training_monotony DECIMAL(4,2), -- Mean / SD of weekly loads
    training_strain DECIMAL(8,2), -- Weekly load × monotony

    -- Recovery Status
    recovery_score DECIMAL(4,2), -- Composite recovery score (0-1)
    fatigue_index DECIMAL(4,2), -- Calculated fatigue level (0-1)
    readiness_score DECIMAL(4,2), -- Ready to train score (0-1)

    -- Injury Risk Indicators
    injury_risk_score DECIMAL(4,2), -- Calculated injury risk (0-1)
    risk_level VARCHAR(20), -- 'low', 'moderate', 'high', 'critical'
    risk_factors TEXT[], -- ['acwr_spike', 'poor_sleep', 'high_monotony']

    -- Recommendations
    recommended_load_adjustment DECIMAL(4,2), -- -0.3 to +0.3 (30% adjustment)
    recommended_session_intensity VARCHAR(20), -- 'rest', 'light', 'moderate', 'high', 'max'
    recovery_priority_areas TEXT[], -- ['sleep', 'nutrition', 'soft_tissue']

    -- Metadata
    data_quality_score DECIMAL(3,2), -- Confidence in data (0-1)
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_load_user_date ON training_load_metrics(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_training_load_acwr ON training_load_metrics(acwr);
CREATE INDEX IF NOT EXISTS idx_training_load_risk ON training_load_metrics(risk_level);

-- =============================================================================
-- 2. ACWR CALCULATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS acwr_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,

    -- Acute Load (7-day rolling average)
    acute_period_days INTEGER DEFAULT 7,
    acute_load_sum DECIMAL(8,2), -- Sum of training load past 7 days
    acute_load_average DECIMAL(8,2), -- Average daily load
    acute_load_sessions INTEGER, -- Number of sessions in acute period

    -- Chronic Load (28-day rolling average)
    chronic_period_days INTEGER DEFAULT 28,
    chronic_load_sum DECIMAL(8,2), -- Sum of training load past 28 days
    chronic_load_average DECIMAL(8,2), -- Average daily load
    chronic_load_sessions INTEGER, -- Number of sessions in chronic period

    -- ACWR Calculation
    acwr DECIMAL(4,2), -- acute_load / chronic_load
    acwr_method VARCHAR(50) DEFAULT 'rolling_average', -- 'rolling_average', 'coupled', 'exponentially_weighted'

    -- ACWR Interpretation
    acwr_zone VARCHAR(20), -- 'safe' (0.8-1.3), 'caution' (1.3-1.5), 'danger' (>1.5), 'detraining' (<0.8)
    injury_risk_multiplier DECIMAL(3,2), -- Risk relative to baseline

    -- Training Status
    training_status VARCHAR(30), -- 'optimal', 'undertraining', 'overreaching', 'overtraining'
    fitness_level DECIMAL(4,2), -- Estimated fitness (chronic load proxy)
    fatigue_level DECIMAL(4,2), -- Estimated fatigue (acute - chronic)

    -- Recommendations
    load_adjustment_recommendation DECIMAL(4,2), -- -0.5 to +0.5
    target_acute_load DECIMAL(8,2), -- Recommended load for next 7 days
    target_acwr DECIMAL(4,2), -- Target ACWR (typically 1.0-1.2)

    -- Research References
    calculation_confidence DECIMAL(3,2), -- Confidence in calculation (0-1)
    data_completeness DECIMAL(3,2), -- Percentage of days with data

    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, calculation_date)
);

CREATE INDEX IF NOT EXISTS idx_acwr_user_date ON acwr_calculations(user_id, calculation_date);
CREATE INDEX IF NOT EXISTS idx_acwr_zone ON acwr_calculations(acwr_zone);

-- =============================================================================
-- 3. TRAINING STRESS BALANCE (FITNESS-FATIGUE MODEL) TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS training_stress_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,

    -- Training Stress Score (TSS)
    daily_training_stress DECIMAL(6,2), -- TSS for the day
    weekly_training_stress DECIMAL(8,2), -- Sum of past 7 days

    -- Chronic Training Load (CTL) - Fitness
    ctl DECIMAL(8,2), -- Exponentially weighted average (42-day time constant)
    ctl_ramp_rate DECIMAL(5,2), -- CTL change per week

    -- Acute Training Load (ATL) - Fatigue
    atl DECIMAL(8,2), -- Exponentially weighted average (7-day time constant)
    atl_ramp_rate DECIMAL(5,2), -- ATL change per week

    -- Training Stress Balance (TSB) - Form
    tsb DECIMAL(7,2), -- CTL - ATL
    tsb_interpretation VARCHAR(30), -- 'fresh', 'optimal', 'neutral', 'fatigued', 'overreached'

    -- Form Analysis
    form_score DECIMAL(4,2), -- 0-1 scale of competition readiness
    taper_status VARCHAR(30), -- 'building', 'maintaining', 'tapering', 'peaked'

    -- Performance Predictions
    predicted_performance_change DECIMAL(4,3), -- Expected % change from baseline
    optimal_competition_window INTEGER, -- Days until optimal performance

    -- Load Management
    recommended_tss_today DECIMAL(6,2), -- Recommended TSS for optimal progression
    max_safe_tss_today DECIMAL(6,2), -- Maximum TSS to avoid excessive fatigue

    -- CTL Progression Targets
    target_ctl DECIMAL(8,2), -- Target fitness level
    target_ctl_date DATE, -- Date to achieve target CTL
    ctl_progression_rate DECIMAL(5,2), -- Weekly CTL increase needed

    -- Warnings and Alerts
    overtraining_risk DECIMAL(3,2), -- Risk score (0-1)
    detraining_risk DECIMAL(3,2), -- Risk of fitness loss (0-1)
    alerts TEXT[], -- ['ctl_ramp_high', 'negative_tsb_7days', 'atl_spike']

    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, calculation_date)
);

CREATE INDEX IF NOT EXISTS idx_tsb_user_date ON training_stress_balance(user_id, calculation_date);
CREATE INDEX IF NOT EXISTS idx_tsb_interpretation ON training_stress_balance(tsb_interpretation);

-- =============================================================================
-- 4. SESSION RPE PROTOCOL TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS session_rpe_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,

    -- Session Details
    session_start_time TIMESTAMP,
    session_end_time TIMESTAMP,
    session_duration_minutes INTEGER,
    session_type VARCHAR(50),

    -- RPE Collection (Modified Borg CR-10 Scale)
    rpe_collected_time TIMESTAMP, -- When RPE was collected (should be 15-30 min post)
    time_post_session_minutes INTEGER, -- Minutes after session ended

    -- RPE Rating (0-10 scale)
    session_rpe INTEGER CHECK (session_rpe BETWEEN 0 AND 10),
    rpe_interpretation TEXT, -- Description of RPE level

    -- RPE Breakdown by Body System
    respiratory_exertion INTEGER CHECK (respiratory_exertion BETWEEN 0 AND 10),
    muscular_exertion INTEGER CHECK (muscular_exertion BETWEEN 0 AND 10),
    cognitive_exertion INTEGER CHECK (cognitive_exertion BETWEEN 0 AND 10),

    -- Training Load Calculation
    training_load INTEGER, -- session_rpe × duration (AU)
    normalized_training_load DECIMAL(6,2), -- Adjusted for athlete baseline

    -- Context Factors
    pre_session_fatigue INTEGER CHECK (pre_session_fatigue BETWEEN 0 AND 10),
    environmental_stress INTEGER CHECK (environmental_stress BETWEEN 0 AND 10), -- Heat, altitude, etc.
    psychological_stress INTEGER CHECK (psychological_stress BETWEEN 0 AND 10),

    -- Flag Football Specific Context
    position_demands VARCHAR(50), -- Position played during session
    game_like_intensity BOOLEAN, -- Was session at game intensity?
    number_of_sprints INTEGER,
    number_of_cuts INTEGER,
    routes_completed INTEGER,

    -- Validation Metrics
    heart_rate_session_avg INTEGER, -- For RPE validation
    hr_rpe_correlation DECIMAL(3,2), -- How well RPE matches objective HR
    data_quality VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'

    -- Coach/Planned Load Comparison
    coach_intended_rpe INTEGER CHECK (coach_intended_rpe BETWEEN 0 AND 10),
    planned_vs_actual_difference INTEGER, -- Positive = harder than planned

    -- Notes
    athlete_notes TEXT,
    coach_notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_rpe_user_date ON session_rpe_data(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_session_rpe_load ON session_rpe_data(training_load);

-- =============================================================================
-- 5. WEEKLY TRAINING ANALYSIS TABLE (MONOTONY & STRAIN)
-- =============================================================================

CREATE TABLE IF NOT EXISTS weekly_training_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,

    -- Weekly Training Volume
    total_training_sessions INTEGER,
    total_training_duration_minutes INTEGER,
    total_training_load INTEGER, -- Sum of all session loads (AU)

    -- Daily Load Distribution
    daily_loads INTEGER[], -- Array of 7 daily loads
    mean_daily_load DECIMAL(7,2),
    standard_deviation DECIMAL(7,2),

    -- Training Monotony Calculation
    training_monotony DECIMAL(4,2), -- mean / standard deviation
    monotony_interpretation VARCHAR(30), -- 'low' (<1.5), 'moderate' (1.5-2.0), 'high' (>2.0)

    -- Training Strain Calculation
    training_strain DECIMAL(8,2), -- total_load × monotony
    strain_interpretation VARCHAR(30), -- 'low', 'moderate', 'high', 'very_high'

    -- Injury Risk from Monotony
    monotony_injury_risk DECIMAL(3,2), -- Risk score (0-1)
    strain_injury_risk DECIMAL(3,2), -- Risk score (0-1)

    -- Load Distribution Quality
    load_distribution_quality DECIMAL(3,2), -- 0-1 score (higher = better varied)
    rest_days_count INTEGER,
    consecutive_high_load_days INTEGER, -- Days with load >1.5x weekly average

    -- Weekly Load Progression
    load_change_from_previous_week DECIMAL(5,2), -- Percentage change
    load_progression_safety VARCHAR(30), -- 'safe' (<10%), 'caution' (10-15%), 'risk' (>15%)

    -- Recommendations
    recommended_rest_days INTEGER,
    recommended_load_variation DECIMAL(3,2), -- Target standard deviation
    next_week_load_target INTEGER, -- Recommended total load

    -- Weekly Patterns
    high_load_days TEXT[], -- ['Monday', 'Wednesday']
    recovery_day_adequacy DECIMAL(3,2), -- Quality of recovery days (0-1)

    -- Research-Based Thresholds
    exceeds_monotony_threshold BOOLEAN, -- >2.0
    exceeds_strain_threshold BOOLEAN, -- Based on Hulin research
    weeks_consecutive_high_monotony INTEGER,

    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_analysis_user_date ON weekly_training_analysis(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_monotony_interpretation ON weekly_training_analysis(monotony_interpretation);

-- =============================================================================
-- 6. INJURY RISK FACTORS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS injury_risk_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,

    -- ACWR-Based Risk
    acwr_value DECIMAL(4,2),
    acwr_risk_score DECIMAL(3,2), -- 0-1 scale
    acwr_risk_multiplier DECIMAL(3,2), -- Risk relative to baseline

    -- Load Spike Risk
    week_over_week_load_change DECIMAL(5,2), -- Percentage change
    load_spike_risk_score DECIMAL(3,2), -- 0-1 scale
    consecutive_weeks_high_load INTEGER,

    -- Monotony Risk
    training_monotony DECIMAL(4,2),
    monotony_risk_score DECIMAL(3,2), -- 0-1 scale
    weeks_high_monotony INTEGER,

    -- Recovery Status Risk
    chronic_sleep_debt_hours DECIMAL(4,1), -- Cumulative sleep debt
    recovery_score_7day_avg DECIMAL(3,2),
    poor_recovery_days_count INTEGER, -- Days with recovery <0.5 in past 7
    recovery_risk_score DECIMAL(3,2), -- 0-1 scale

    -- Movement Quality Risk
    movement_quality_score DECIMAL(3,2), -- From movement screening
    asymmetry_index DECIMAL(3,2), -- Left-right imbalance
    movement_risk_score DECIMAL(3,2), -- 0-1 scale

    -- Previous Injury Risk
    previous_injury_count INTEGER,
    days_since_last_injury INTEGER,
    injury_history_risk_score DECIMAL(3,2), -- 0-1 scale

    -- Flag Football Specific Risks
    cutting_volume_spike DECIMAL(5,2), -- % increase in cutting movements
    sprint_volume_spike DECIMAL(5,2), -- % increase in sprints
    position_specific_load_ratio DECIMAL(4,2), -- Position load vs. normal

    -- Composite Injury Risk Score
    overall_injury_risk DECIMAL(3,2), -- 0-1 scale (weighted combination)
    risk_level VARCHAR(20), -- 'low' (<0.2), 'moderate' (0.2-0.4), 'high' (0.4-0.7), 'critical' (>0.7)

    -- Risk Factor Contributions (Feature Importance)
    top_risk_factors JSONB, -- {acwr: 0.35, sleep: 0.28, load_spike: 0.22, ...}

    -- Time-to-Injury Prediction
    predicted_injury_window_days INTEGER, -- Expected time frame if no intervention
    injury_probability_30days DECIMAL(3,2), -- Probability in next 30 days

    -- Intervention Recommendations
    recommended_interventions TEXT[], -- ['reduce_load_30pct', 'increase_sleep_1hr', 'movement_screening']
    intervention_priority_order TEXT[], -- Ordered by impact

    -- Expected Risk Reduction
    risk_reduction_with_intervention DECIMAL(3,2), -- Expected reduction with recommendations
    target_risk_level DECIMAL(3,2), -- Target risk after interventions

    -- Alert Status
    alert_level VARCHAR(20), -- 'none', 'monitor', 'caution', 'warning', 'critical'
    alert_triggered BOOLEAN,
    notification_sent BOOLEAN,

    -- Model Metadata
    model_version VARCHAR(20),
    prediction_confidence DECIMAL(3,2), -- Model confidence (0-1)

    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, assessment_date)
);

CREATE INDEX IF NOT EXISTS idx_injury_risk_user_date ON injury_risk_factors(user_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_injury_risk_level ON injury_risk_factors(risk_level);
CREATE INDEX IF NOT EXISTS idx_injury_alert ON injury_risk_factors(alert_triggered);

-- =============================================================================
-- 7. LOAD MANAGEMENT RESEARCH STUDIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS load_management_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Study Identification
    study_title TEXT NOT NULL,
    authors TEXT[],
    publication_year INTEGER,
    journal VARCHAR(200),
    doi VARCHAR(100),
    pubmed_id VARCHAR(20),

    -- Study Details
    study_type VARCHAR(50), -- 'meta_analysis', 'rct', 'cohort', 'case_control'
    sample_size INTEGER,
    sport_studied VARCHAR(100),
    athlete_level VARCHAR(50), -- 'elite', 'sub_elite', 'amateur', 'youth'

    -- Key Findings
    main_findings TEXT,
    acwr_thresholds JSONB, -- {safe_min: 0.8, safe_max: 1.3, risk_threshold: 1.5}
    load_progression_rates JSONB, -- {safe_weekly_increase: 0.10, max_increase: 0.15}
    injury_risk_data JSONB, -- {acwr_1.5: 2.0, acwr_1.8: 4.2} relative risk values

    -- Monotony Research
    monotony_thresholds JSONB, -- {low: 1.5, moderate: 2.0, high: 2.5}
    strain_thresholds JSONB,

    -- Applicability
    relevance_to_flag_football INTEGER CHECK (relevance_to_flag_football BETWEEN 1 AND 10),
    evidence_level VARCHAR(20), -- 'A' (strong), 'B' (moderate), 'C' (limited)

    -- Implementation
    practical_applications TEXT[],
    recommended_interventions TEXT[],

    -- Citation Information
    citation_count INTEGER,
    abstract TEXT,
    full_text_url TEXT,

    -- Integration Status
    integrated_into_algorithms BOOLEAN DEFAULT false,
    integration_notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_sport ON load_management_research(sport_studied);
CREATE INDEX IF NOT EXISTS idx_research_relevance ON load_management_research(relevance_to_flag_football);

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

-- Trigger function for updated_at (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update trigger for training_load_metrics
CREATE TRIGGER update_training_load_metrics_updated_at
    BEFORE UPDATE ON training_load_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE training_load_metrics IS 'Comprehensive training load tracking with ACWR, monotony, and injury risk calculations';
COMMENT ON TABLE acwr_calculations IS 'Acute:Chronic Workload Ratio calculations based on Gabbett (2016) methodology';
COMMENT ON TABLE training_stress_balance IS 'Fitness-Fatigue model (CTL/ATL/TSB) based on Banister (1991) and Buchheit (2014)';
COMMENT ON TABLE session_rpe_data IS 'Session RPE protocol data based on Foster et al. (2001) validation';
COMMENT ON TABLE weekly_training_analysis IS 'Weekly monotony and strain analysis based on Hulin et al. (2016)';
COMMENT ON TABLE injury_risk_factors IS 'Composite injury risk prediction integrating multiple risk factors';
COMMENT ON TABLE load_management_research IS 'Research studies database supporting evidence-based load management';




-- ============================================================================
-- Migration: 028_evidence_based_knowledge_base.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- EVIDENCE-BASED KNOWLEDGE BASE SYSTEM
-- Comprehensive research database for flag football athletes
-- Targets: 100-1000+ evidence-based articles from open sources
-- =============================================================================

-- Research Articles Table
CREATE TABLE IF NOT EXISTS research_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Article Identification
    title TEXT NOT NULL,
    authors TEXT[],
    publication_year INTEGER,
    journal VARCHAR(300),
    publisher VARCHAR(200),
    
    -- Identifiers
    doi VARCHAR(100) UNIQUE,
    pubmed_id VARCHAR(20),
    pmc_id VARCHAR(20),
    arxiv_id VARCHAR(50),
    semantic_scholar_id VARCHAR(100),
    
    -- Content
    abstract TEXT,
    full_text TEXT, -- Full article text if available
    full_text_url TEXT,
    pdf_url TEXT,
    
    -- Categorization
    primary_category VARCHAR(100), -- 'injury', 'nutrition', 'recovery', 'training', 'psychology', etc.
    categories TEXT[], -- Multiple categories
    tags TEXT[], -- Specific tags for searchability
    
    -- Research Quality
    study_type VARCHAR(50), -- 'meta_analysis', 'systematic_review', 'rct', 'cohort', 'case_control', 'case_study', 'review'
    evidence_level VARCHAR(20), -- 'A' (strong), 'B' (moderate), 'C' (limited), 'D' (expert opinion)
    sample_size INTEGER,
    population_type VARCHAR(100), -- 'elite_athletes', 'amateur_athletes', 'general_population', etc.
    sport_type VARCHAR(100), -- 'flag_football', 'football', 'sprint', 'team_sports', etc.
    
    -- Key Findings (structured)
    key_findings TEXT,
    methodology TEXT,
    results_summary TEXT,
    conclusions TEXT,
    practical_applications TEXT[],
    
    -- Specific Topics (for targeted queries)
    injury_types TEXT[], -- 'ankle_sprain', 'hamstring_strain', etc.
    supplement_types TEXT[], -- 'iron', 'creatine', 'protein', etc.
    recovery_methods TEXT[], -- 'sauna', 'cold_therapy', 'massage', etc.
    training_types TEXT[], -- 'speed', 'strength', 'endurance', etc.
    psychological_topics TEXT[], -- 'anxiety', 'confidence', 'visualization', etc.
    
    -- Nutrition Specific
    food_sources JSONB, -- {food: "spinach", iron_mg_per_100g: 2.7, bioavailability: "low"}
    absorption_tips TEXT[],
    supplement_guidance JSONB, -- {supplement: "iron", dosage: "10-15mg/day", timing: "with_vitamin_c", contraindications: ["calcium", "coffee"]}
    safety_warnings TEXT[],
    
    -- Recovery Specific
    sauna_protocols JSONB, -- {temperature: "80-90C", duration: "15-20min", frequency: "3-4x/week"}
    cold_therapy_protocols JSONB, -- {temperature: "10-15C", duration: "10-15min", method: "ice_bath"}
    massage_gun_protocols JSONB, -- {pressure: "moderate", duration: "10min", frequency: "post_training"}
    
    -- Training Specific
    training_protocols JSONB, -- {type: "speed", frequency: "2-3x/week", volume: "varies", intensity: "high"}
    periodization_phases TEXT[],
    
    -- Psychology Specific
    psychological_techniques TEXT[],
    mental_training_methods TEXT[],
    
    -- Citation & Impact
    citation_count INTEGER DEFAULT 0,
    altmetric_score DECIMAL(10,2),
    impact_factor DECIMAL(5,2),
    
    -- Source Information
    source_type VARCHAR(50), -- 'pubmed', 'europe_pmc', 'arxiv', 'plos', 'frontiers', etc.
    is_open_access BOOLEAN DEFAULT true,
    license_type VARCHAR(50), -- 'CC-BY', 'CC-BY-NC', etc.
    
    -- Quality Control
    verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(100),
    verification_date TIMESTAMP,
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10),
    
    -- Integration
    integrated_into_chatbot BOOLEAN DEFAULT false,
    chatbot_usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    
    -- Metadata
    keywords TEXT[],
    mesh_terms TEXT[], -- Medical Subject Headings
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Base Entries (Processed, structured knowledge)
CREATE TABLE IF NOT EXISTS knowledge_base_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entry Type
    entry_type VARCHAR(50) NOT NULL, -- 'supplement', 'injury', 'recovery_method', 'training_method', 'nutrition', 'psychology'
    topic VARCHAR(200) NOT NULL, -- 'iron_supplementation', 'ankle_sprain_treatment', etc.
    
    -- Content
    question TEXT, -- Common question this entry answers
    answer TEXT NOT NULL, -- Structured answer
    summary TEXT, -- Brief summary
    
    -- Evidence
    supporting_articles UUID[] REFERENCES research_articles(id),
    evidence_strength VARCHAR(20), -- 'strong', 'moderate', 'limited'
    consensus_level VARCHAR(20), -- 'high', 'moderate', 'low'
    
    -- Structured Data
    dosage_guidelines JSONB, -- For supplements
    protocols JSONB, -- For recovery/training methods
    contraindications TEXT[],
    safety_warnings TEXT[],
    best_practices TEXT[],
    
    -- Context
    applicable_to TEXT[], -- 'elite_athletes', 'amateur', 'youth', etc.
    sport_specificity VARCHAR(100), -- 'flag_football', 'general', etc.
    
    -- Usage Tracking
    query_count INTEGER DEFAULT 0,
    last_queried_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Article Search Index (for full-text search)
CREATE TABLE IF NOT EXISTS article_search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES research_articles(id) ON DELETE CASCADE,
    
    -- Searchable content
    searchable_text TEXT, -- Combined title, abstract, key findings
    search_vector tsvector, -- PostgreSQL full-text search vector
    
    -- Keywords for quick lookup
    keywords TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Base Search Index
CREATE TABLE IF NOT EXISTS knowledge_search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES knowledge_base_entries(id) ON DELETE CASCADE,
    
    searchable_text TEXT,
    search_vector tsvector,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_articles_category ON research_articles(primary_category);
CREATE INDEX IF NOT EXISTS idx_articles_year ON research_articles(publication_year);
CREATE INDEX IF NOT EXISTS idx_articles_evidence_level ON research_articles(evidence_level);
CREATE INDEX IF NOT EXISTS idx_articles_sport ON research_articles(sport_type);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON research_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_categories ON research_articles USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_articles_supplements ON research_articles USING GIN(supplement_types);
CREATE INDEX IF NOT EXISTS idx_articles_injuries ON research_articles USING GIN(injury_types);
CREATE INDEX IF NOT EXISTS idx_articles_recovery ON research_articles USING GIN(recovery_methods);
CREATE INDEX IF NOT EXISTS idx_articles_doi ON research_articles(doi);
CREATE INDEX IF NOT EXISTS idx_articles_pubmed ON research_articles(pubmed_id);

CREATE INDEX IF NOT EXISTS idx_kb_entry_type ON knowledge_base_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_kb_topic ON knowledge_base_entries(topic);
CREATE INDEX IF NOT EXISTS idx_kb_evidence_strength ON knowledge_base_entries(evidence_strength);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_article_search_vector ON article_search_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_knowledge_search_vector ON knowledge_search_index USING GIN(search_vector);

-- Trigger to update search index when articles are inserted/updated
CREATE OR REPLACE FUNCTION update_article_search_index()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO article_search_index (article_id, searchable_text, search_vector, keywords)
    VALUES (
        NEW.id,
        COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.abstract, '') || ' ' || COALESCE(NEW.key_findings, ''),
        to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.abstract, '') || ' ' || COALESCE(NEW.key_findings, '')),
        NEW.keywords
    )
    ON CONFLICT (article_id) DO UPDATE SET
        searchable_text = EXCLUDED.searchable_text,
        search_vector = EXCLUDED.search_vector,
        keywords = EXCLUDED.keywords;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_article_search
AFTER INSERT OR UPDATE ON research_articles
FOR EACH ROW
EXECUTE FUNCTION update_article_search_index();

-- Trigger to update knowledge base search index
CREATE OR REPLACE FUNCTION update_knowledge_search_index()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO knowledge_search_index (entry_id, searchable_text, search_vector)
    VALUES (
        NEW.id,
        COALESCE(NEW.question, '') || ' ' || COALESCE(NEW.answer, '') || ' ' || COALESCE(NEW.summary, ''),
        to_tsvector('english', COALESCE(NEW.question, '') || ' ' || COALESCE(NEW.answer, '') || ' ' || COALESCE(NEW.summary, ''))
    )
    ON CONFLICT (entry_id) DO UPDATE SET
        searchable_text = EXCLUDED.searchable_text,
        search_vector = EXCLUDED.search_vector;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_search
AFTER INSERT OR UPDATE ON knowledge_base_entries
FOR EACH ROW
EXECUTE FUNCTION update_knowledge_search_index();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_research_articles_updated_at
BEFORE UPDATE ON research_articles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_entries_updated_at
BEFORE UPDATE ON knowledge_base_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE research_articles IS 'Evidence-based research articles from open sources (PubMed, Europe PMC, arXiv, etc.)';
COMMENT ON TABLE knowledge_base_entries IS 'Processed, structured knowledge entries derived from research articles';
COMMENT ON TABLE article_search_index IS 'Full-text search index for research articles';
COMMENT ON TABLE knowledge_search_index IS 'Full-text search index for knowledge base entries';




-- ============================================================================
-- Migration: 029_game_events_system.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- GAME EVENTS AND STATISTICS SYSTEM
-- Migration: 029_game_events_system.sql
-- Purpose: Track every game event, drop, missed flag, throw, and performance metric
-- Created: 2025-11-16
-- =============================================================================

-- =============================================================================
-- GAMES TABLE
-- Track individual games/matches
-- =============================================================================

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    team_id VARCHAR(255) NOT NULL,
    opponent_team_name VARCHAR(255) NOT NULL,

    -- Game details
    game_date DATE NOT NULL,
    game_time TIME,
    location VARCHAR(255),
    is_home_game BOOLEAN DEFAULT TRUE,

    -- Game result
    team_score INTEGER,
    opponent_score INTEGER,
    game_result VARCHAR(20), -- 'win', 'loss', 'tie'

    -- Environmental conditions
    weather_conditions VARCHAR(100),
    temperature INTEGER, -- Fahrenheit
    field_conditions VARCHAR(50), -- 'dry', 'wet', 'muddy', 'indoor'

    -- Metadata
    season VARCHAR(20),
    tournament_name VARCHAR(255),
    game_type VARCHAR(50), -- 'regular_season', 'playoff', 'championship', 'scrimmage'

    -- Video
    game_video_url TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- GAME EVENTS TABLE
-- Real-time tracking of every play in every game
-- =============================================================================

CREATE TABLE IF NOT EXISTS game_events (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    team_id VARCHAR(255) NOT NULL,
    play_number INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),

    -- Play context
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
    down INTEGER CHECK (down BETWEEN 1 AND 4),
    distance INTEGER, -- Yards to first down/goal
    yard_line INTEGER CHECK (yard_line BETWEEN 1 AND 100),
    field_zone VARCHAR(20), -- 'red_zone', 'midfield', 'own_territory'
    time_remaining INTEGER, -- Seconds remaining in quarter
    score_differential INTEGER, -- Team score minus opponent score at time of play

    -- Play type
    play_type VARCHAR(50), -- 'pass', 'run', 'punt', 'field_goal', 'conversion'
    play_category VARCHAR(50), -- 'offensive', 'defensive', 'special_teams'

    -- Players involved
    primary_player_id VARCHAR(255), -- QB, RB, WR who touched ball
    secondary_player_ids TEXT[], -- Other players involved
    defender_ids TEXT[], -- Defenders on play

    -- Play outcome
    play_result VARCHAR(50), -- 'completion', 'incompletion', 'touchdown', 'flag_pull', 'out_of_bounds', 'turnover'
    yards_gained INTEGER,
    yards_after_catch INTEGER, -- YAC for passing plays

    -- Success/failure classification
    is_successful BOOLEAN,
    is_turnover BOOLEAN DEFAULT FALSE,
    is_penalty BOOLEAN DEFAULT FALSE,
    penalty_type VARCHAR(100),

    -- Environmental factors at time of play
    weather_conditions VARCHAR(100),
    field_conditions VARCHAR(50), -- 'dry', 'wet', 'muddy'

    -- Additional metadata
    play_notes TEXT,
    video_timestamp INTEGER, -- Timestamp in game video (seconds)
    video_clip_url TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PASSING STATISTICS (Granular QB/WR tracking)
-- Track every pass attempt with detailed analytics
-- =============================================================================

CREATE TABLE IF NOT EXISTS passing_stats (
    id SERIAL PRIMARY KEY,
    game_event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    game_id VARCHAR(255) NOT NULL,

    -- Players
    quarterback_id VARCHAR(255) NOT NULL,
    receiver_id VARCHAR(255), -- NULL if incompletion
    defender_id VARCHAR(255), -- Primary defender in coverage

    -- Throw details
    throw_type VARCHAR(50), -- 'quick_slant', 'deep_post', 'screen', 'out_route', 'comeback', 'fade', 'go'
    route_depth INTEGER, -- Yards downfield
    target_location VARCHAR(50), -- 'left_sideline', 'middle', 'right_sideline', 'deep_middle'

    -- Accuracy assessment
    throw_accuracy VARCHAR(50), -- 'perfect', 'good', 'catchable', 'bad', 'terrible'
    intended_spot_accuracy DECIMAL(4,2), -- Distance from intended spot (yards)

    -- Outcome classification
    outcome VARCHAR(50), -- 'completion', 'drop', 'incompletion_overthrow', 'incompletion_underthrow',
                         -- 'incompletion_wide_left', 'incompletion_wide_right', 'interception',
                         -- 'defended_pass', 'throwaway'

    -- Drop analysis (if applicable)
    is_drop BOOLEAN DEFAULT FALSE,
    drop_severity VARCHAR(20), -- 'unforgivable', 'should_catch', 'difficult', 'contested'
    drop_reason VARCHAR(100), -- 'hands', 'body_catch_attempt', 'distraction', 'defender_contact', 'sun', 'wind'

    -- Pressure and coverage
    qb_under_pressure BOOLEAN DEFAULT FALSE,
    time_to_throw DECIMAL(3,2), -- Seconds from snap to release
    coverage_type VARCHAR(50), -- 'man', 'zone', 'press', 'off'
    separation_at_catch DECIMAL(4,2), -- Yards between WR and nearest defender

    -- Physics and performance (if measured)
    throw_velocity INTEGER, -- MPH
    hang_time DECIMAL(3,2), -- Seconds ball in air

    -- Video evidence
    video_clip_url TEXT,
    video_start_time DECIMAL(6,2),
    video_end_time DECIMAL(6,2),

    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- FLAG PULL STATISTICS
-- Track every flag pull attempt and outcome
-- =============================================================================

CREATE TABLE IF NOT EXISTS flag_pull_stats (
    id SERIAL PRIMARY KEY,
    game_event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    game_id VARCHAR(255) NOT NULL,

    -- Players
    ball_carrier_id VARCHAR(255) NOT NULL,
    defender_id VARCHAR(255) NOT NULL,

    -- Attempt details
    attempt_type VARCHAR(50), -- 'direct_pursuit', 'angle_pursuit', 'dive_attempt', 'reach_attempt', 'zone_coverage'
    attempt_location VARCHAR(50), -- 'sideline', 'middle_field', 'goal_line', 'open_field'

    -- Outcome
    is_successful BOOLEAN NOT NULL,
    yards_before_pull INTEGER,
    yards_after_miss INTEGER, -- If unsuccessful, how many yards did carrier gain after

    -- Failure analysis (if unsuccessful)
    miss_reason VARCHAR(100), -- 'missed_grab', 'faked_out', 'out_of_position', 'fell_down', 'too_slow', 'wrong_angle'
    evasion_technique VARCHAR(100), -- What ball carrier did if successful evasion: 'spin', 'juke', 'stiff_arm', 'speed'

    -- Performance metrics
    closing_speed DECIMAL(4,2), -- Yards per second (if measured)
    pursuit_angle_degrees INTEGER, -- Angle of pursuit (0-180)
    reaction_time DECIMAL(3,2), -- Seconds from carrier's move to defender's response

    -- Additional context
    num_broken_tackles INTEGER DEFAULT 0,
    yards_after_contact INTEGER,

    -- Video
    video_clip_url TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- RECEIVING STATISTICS (WR/TE/RB)
-- Track every target and catch opportunity
-- =============================================================================

CREATE TABLE IF NOT EXISTS receiving_stats (
    id SERIAL PRIMARY KEY,
    game_event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    game_id VARCHAR(255) NOT NULL,

    -- Player
    receiver_id VARCHAR(255) NOT NULL,
    defender_id VARCHAR(255),

    -- Route details
    route_type VARCHAR(50), -- 'slant', 'post', 'corner', 'out', 'in', 'go', 'comeback', 'screen', 'flat'
    route_depth INTEGER, -- Yards downfield
    route_precision VARCHAR(20), -- 'perfect', 'good', 'sloppy', 'wrong'

    -- Catch opportunity
    is_target BOOLEAN DEFAULT TRUE,
    catch_difficulty VARCHAR(50), -- 'easy', 'routine', 'difficult', 'spectacular', 'impossible'

    -- Catch outcome
    is_catch BOOLEAN,
    is_drop BOOLEAN,

    -- Drop details (if applicable)
    ball_placement VARCHAR(50), -- 'perfect', 'high', 'low', 'behind', 'ahead', 'outside', 'inside'
    catch_type_attempted VARCHAR(50), -- 'hands_catch', 'body_catch', 'diving_catch', 'contested_catch', 'one_handed'

    -- Performance after catch
    yards_after_catch INTEGER,
    broken_tackles INTEGER DEFAULT 0,
    evasion_moves INTEGER DEFAULT 0,

    -- Separation metrics
    separation_at_break DECIMAL(4,2), -- Yards of separation when cutting
    separation_at_catch DECIMAL(4,2), -- Yards of separation when ball arrives

    -- Video
    video_clip_url TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PLAYER GAME PERFORMANCE SUMMARY
-- Aggregated statistics for each player per game
-- =============================================================================

CREATE TABLE IF NOT EXISTS player_game_summary (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    player_id VARCHAR(255) NOT NULL,
    position VARCHAR(50) NOT NULL,

    -- QB stats
    pass_attempts INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2),
    passing_yards INTEGER DEFAULT 0,
    touchdowns INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    qb_rating DECIMAL(5,2),
    avg_yards_per_attempt DECIMAL(4,2),
    bad_throws INTEGER DEFAULT 0,
    throw_aways INTEGER DEFAULT 0,
    time_in_pocket_avg DECIMAL(3,2),
    sacks INTEGER DEFAULT 0,

    -- Receiving stats
    targets INTEGER DEFAULT 0,
    receptions INTEGER DEFAULT 0,
    receiving_yards INTEGER DEFAULT 0,
    receiving_touchdowns INTEGER DEFAULT 0,
    drops INTEGER DEFAULT 0,
    drop_rate DECIMAL(5,2),
    yards_after_catch INTEGER DEFAULT 0,
    avg_yards_per_reception DECIMAL(4,2),
    contested_catches INTEGER DEFAULT 0,
    longest_reception INTEGER DEFAULT 0,

    -- Rushing stats
    rushing_attempts INTEGER DEFAULT 0,
    rushing_yards INTEGER DEFAULT 0,
    rushing_touchdowns INTEGER DEFAULT 0,
    yards_per_carry DECIMAL(4,2),
    broken_tackles INTEGER DEFAULT 0,
    evasions_successful INTEGER DEFAULT 0,
    evasions_attempted INTEGER DEFAULT 0,
    longest_run INTEGER DEFAULT 0,

    -- Defensive stats
    flag_pulls INTEGER DEFAULT 0,
    flag_pull_attempts INTEGER DEFAULT 0,
    flag_pull_success_rate DECIMAL(5,2),
    missed_flag_pulls INTEGER DEFAULT 0,
    defended_passes INTEGER DEFAULT 0,
    interceptions_def INTEGER DEFAULT 0,
    tackles_for_loss INTEGER DEFAULT 0,

    -- Performance under pressure
    plays_in_clutch_situations INTEGER DEFAULT 0,
    clutch_success_rate DECIMAL(5,2),
    third_down_conversions INTEGER DEFAULT 0,
    third_down_attempts INTEGER DEFAULT 0,
    red_zone_scores INTEGER DEFAULT 0,
    red_zone_attempts INTEGER DEFAULT 0,

    -- Efficiency metrics
    offensive_epa DECIMAL(6,3), -- Expected Points Added
    defensive_epa DECIMAL(6,3),
    win_probability_added DECIMAL(6,3),

    -- Fatigue indicators
    performance_decline_2nd_half BOOLEAN DEFAULT FALSE,
    stamina_score DECIMAL(4,2), -- 1-10 scale
    plays_participated INTEGER DEFAULT 0,

    -- Notes
    performance_notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(game_id, player_id)
);

-- =============================================================================
-- SITUATIONAL STATISTICS
-- Track performance in specific game situations
-- =============================================================================

CREATE TABLE IF NOT EXISTS situational_stats (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(255) NOT NULL,

    -- Situational categories
    situation_type VARCHAR(50), -- 'third_down', 'red_zone', 'clutch', 'first_half', 'second_half'

    -- Performance metrics
    attempts INTEGER DEFAULT 0,
    successes INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),

    -- Specific to situation
    avg_yards DECIMAL(4,2),
    touchdowns INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,

    -- Time period
    season VARCHAR(20),
    date_start DATE,
    date_end DATE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- OPPONENT ANALYSIS
-- Track opponent player/team tendencies
-- =============================================================================

CREATE TABLE IF NOT EXISTS opponent_analysis (
    id SERIAL PRIMARY KEY,
    opponent_team_name VARCHAR(255) NOT NULL,
    opponent_player_name VARCHAR(255),

    -- Tendencies
    formation_tendencies JSONB, -- {formation: frequency}
    play_tendencies JSONB, -- {play_type: frequency}
    situational_tendencies JSONB, -- {situation: preferred_play}

    -- Strengths/weaknesses
    strengths TEXT[],
    weaknesses TEXT[],
    exploitable_matchups TEXT[],

    -- Performance data
    avg_points_per_game DECIMAL(5,2),
    avg_yards_per_play DECIMAL(4,2),
    turnover_rate DECIMAL(5,2),

    -- Notes
    scouting_notes TEXT,
    game_plan_recommendations TEXT,

    -- Time period
    season VARCHAR(20),
    last_updated TIMESTAMP DEFAULT NOW(),

    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Games indexes
CREATE INDEX IF NOT EXISTS idx_games_game_id ON games(game_id);
CREATE INDEX IF NOT EXISTS idx_games_team_id ON games(team_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);

-- Game Events Indexes
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_player ON game_events(primary_player_id);
CREATE INDEX IF NOT EXISTS idx_game_events_play_type ON game_events(play_type);
CREATE INDEX IF NOT EXISTS idx_game_events_timestamp ON game_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_game_events_quarter ON game_events(quarter);
CREATE INDEX IF NOT EXISTS idx_game_events_result ON game_events(play_result);

-- Passing Stats Indexes
CREATE INDEX IF NOT EXISTS idx_passing_stats_game ON passing_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_passing_stats_qb ON passing_stats(quarterback_id);
CREATE INDEX IF NOT EXISTS idx_passing_stats_receiver ON passing_stats(receiver_id);
CREATE INDEX IF NOT EXISTS idx_passing_stats_outcome ON passing_stats(outcome);
CREATE INDEX IF NOT EXISTS idx_passing_stats_drops ON passing_stats(is_drop) WHERE is_drop = TRUE;
CREATE INDEX IF NOT EXISTS idx_passing_stats_throw_type ON passing_stats(throw_type);

-- Flag Pull Stats Indexes
CREATE INDEX IF NOT EXISTS idx_flag_pull_stats_game ON flag_pull_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_flag_pull_stats_defender ON flag_pull_stats(defender_id);
CREATE INDEX IF NOT EXISTS idx_flag_pull_stats_carrier ON flag_pull_stats(ball_carrier_id);
CREATE INDEX IF NOT EXISTS idx_flag_pull_stats_success ON flag_pull_stats(is_successful);

-- Receiving Stats Indexes
CREATE INDEX IF NOT EXISTS idx_receiving_stats_game ON receiving_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_receiving_stats_receiver ON receiving_stats(receiver_id);
CREATE INDEX IF NOT EXISTS idx_receiving_stats_drops ON receiving_stats(is_drop) WHERE is_drop = TRUE;
CREATE INDEX IF NOT EXISTS idx_receiving_stats_route_type ON receiving_stats(route_type);

-- Player Game Summary Indexes
CREATE INDEX IF NOT EXISTS idx_player_game_summary_player ON player_game_summary(player_id);
CREATE INDEX IF NOT EXISTS idx_player_game_summary_game ON player_game_summary(game_id);
CREATE INDEX IF NOT EXISTS idx_player_game_summary_position ON player_game_summary(position);

-- Situational Stats Indexes
CREATE INDEX IF NOT EXISTS idx_situational_stats_player ON situational_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_situational_stats_type ON situational_stats(situation_type);

-- Opponent Analysis Indexes
CREATE INDEX IF NOT EXISTS idx_opponent_analysis_team ON opponent_analysis(opponent_team_name);
CREATE INDEX IF NOT EXISTS idx_opponent_analysis_player ON opponent_analysis(opponent_player_name);

-- =============================================================================
-- VIEWS FOR COMMON ANALYTICS QUERIES
-- =============================================================================

-- Player drop rate analysis
CREATE OR REPLACE VIEW player_drop_analysis AS
SELECT
    rs.receiver_id,
    COUNT(*) as targets,
    SUM(CASE WHEN rs.is_catch THEN 1 ELSE 0 END) as catches,
    SUM(CASE WHEN rs.is_drop THEN 1 ELSE 0 END) as drops,
    ROUND(
        (SUM(CASE WHEN rs.is_drop THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as drop_rate,
    ROUND(AVG(rs.yards_after_catch), 2) as avg_yac
FROM receiving_stats rs
GROUP BY rs.receiver_id
ORDER BY drop_rate DESC;

-- Flag pull efficiency by defender
CREATE OR REPLACE VIEW defender_flag_pull_efficiency AS
SELECT
    fps.defender_id,
    COUNT(*) as attempts,
    SUM(CASE WHEN fps.is_successful THEN 1 ELSE 0 END) as successful_pulls,
    ROUND(
        (SUM(CASE WHEN fps.is_successful THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as success_rate,
    ROUND(AVG(fps.yards_before_pull), 2) as avg_yards_before_pull
FROM flag_pull_stats fps
GROUP BY fps.defender_id
ORDER BY success_rate DESC;

-- QB accuracy by throw type
CREATE OR REPLACE VIEW qb_accuracy_by_route AS
SELECT
    ps.quarterback_id,
    ps.throw_type,
    COUNT(*) as attempts,
    SUM(CASE WHEN ps.outcome = 'completion' THEN 1 ELSE 0 END) as completions,
    ROUND(
        (SUM(CASE WHEN ps.outcome = 'completion' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as completion_percentage,
    SUM(CASE WHEN ps.is_drop THEN 1 ELSE 0 END) as drops,
    SUM(CASE WHEN ps.throw_accuracy IN ('bad', 'terrible') THEN 1 ELSE 0 END) as bad_throws
FROM passing_stats ps
GROUP BY ps.quarterback_id, ps.throw_type
ORDER BY ps.quarterback_id, completion_percentage DESC;

-- Game performance summary
CREATE OR REPLACE VIEW game_performance_overview AS
SELECT
    g.game_id,
    g.game_date,
    g.opponent_team_name,
    g.team_score,
    g.opponent_score,
    g.game_result,
    COUNT(DISTINCT ge.id) as total_plays,
    SUM(CASE WHEN ge.is_turnover THEN 1 ELSE 0 END) as turnovers,
    SUM(ge.yards_gained) as total_yards,
    ROUND(AVG(ge.yards_gained), 2) as avg_yards_per_play
FROM games g
LEFT JOIN game_events ge ON g.game_id = ge.game_id
GROUP BY g.game_id, g.game_date, g.opponent_team_name, g.team_score, g.opponent_score, g.game_result
ORDER BY g.game_date DESC;

-- Situational performance (3rd down, red zone, etc.)
CREATE OR REPLACE VIEW situational_performance AS
SELECT
    ge.primary_player_id as player_id,
    CASE
        WHEN ge.down = 3 THEN 'Third Down'
        WHEN ge.field_zone = 'red_zone' THEN 'Red Zone'
        WHEN ge.time_remaining < 120 THEN 'Clutch (Last 2 min)'
        ELSE 'Other'
    END as situation,
    COUNT(*) as attempts,
    SUM(CASE WHEN ge.is_successful THEN 1 ELSE 0 END) as successes,
    ROUND(
        (SUM(CASE WHEN ge.is_successful THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as success_rate
FROM game_events ge
WHERE ge.primary_player_id IS NOT NULL
GROUP BY ge.primary_player_id, situation
ORDER BY player_id, success_rate DESC;

-- =============================================================================
-- SAMPLE DATA (FOR TESTING)
-- =============================================================================

-- Sample game
INSERT INTO games (game_id, team_id, opponent_team_name, game_date, is_home_game, team_score, opponent_score, game_result, weather_conditions, field_conditions)
VALUES
('GAME_2025_11_10_001', 'TEAM_001', 'Blue Devils', '2025-11-10', TRUE, 35, 28, 'win', 'Clear, 68F', 'dry');

-- Sample game event (pass play)
INSERT INTO game_events (game_id, team_id, play_number, quarter, down, distance, yard_line, field_zone, play_type, primary_player_id, play_result, yards_gained, is_successful)
VALUES
('GAME_2025_11_10_001', 'TEAM_001', 1, 1, 1, 10, 75, 'midfield', 'pass', 'QB_001', 'completion', 12, TRUE);

-- Sample passing stat
INSERT INTO passing_stats (game_id, quarterback_id, receiver_id, throw_type, route_depth, throw_accuracy, outcome)
VALUES
('GAME_2025_11_10_001', 'QB_001', 'WR_001', 'quick_slant', 8, 'perfect', 'completion');

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('games', 'game_events', 'passing_stats', 'flag_pull_stats', 'receiving_stats', 'player_game_summary', 'situational_stats', 'opponent_analysis')
ORDER BY table_name;



-- ============================================================================
-- Migration: 029_sponsors_table.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- SPONSORS TABLE
-- Stores sponsor information and logos for display on login and other pages
-- =============================================================================

CREATE TABLE IF NOT EXISTS sponsors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    logo_url TEXT NOT NULL,
    website_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active sponsors ordered by display_order
CREATE INDEX IF NOT EXISTS idx_sponsors_active_order ON sponsors(is_active, display_order) WHERE is_active = true;

-- Insert sponsor data
INSERT INTO sponsors (name, logo_url, website_url, display_order, is_active) VALUES
('LA PRIMAFIT', 'https://www.laprimafit.com/image/cache/catalog/logo/La_primafit_logo_black_linear_white_600w-1062x185.png', 'https://www.laprimafit.com', 1, true),
('Chemius', 'https://www.chemius.net/wp-content/uploads/2021/09/logo-chemius-header.png', 'https://www.chemius.net', 2, true),
('GEAR XPRO', 'https://gearxpro-sports.com/cdn/shop/files/Secondary_logo_Positive.png?v=1737387514&width=290', 'https://gearxpro-sports.com', 3, true)
ON CONFLICT DO NOTHING;

COMMIT;























-- ============================================================================
-- Migration: 030_advanced_ux_components_support.sql
-- Type: database
-- ============================================================================

-- Migration: Advanced UX Components Support
-- Adds support for Performance Dashboard, Training Builder, and Heatmap components
-- Created: 2024-01-XX

-- Ensure training_sessions table has all required fields for Training Builder
DO $$
BEGIN
    -- Add equipment field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'equipment'
    ) THEN
        ALTER TABLE training_sessions 
        ADD COLUMN equipment TEXT[];
    END IF;

    -- Add goals field if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'goals'
    ) THEN
        ALTER TABLE training_sessions 
        ADD COLUMN goals TEXT[];
    END IF;

    -- Add exercises JSONB field for storing exercise details
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'exercises'
    ) THEN
        ALTER TABLE training_sessions 
        ADD COLUMN exercises JSONB;
    END IF;

    -- Ensure completed_at exists (for status tracking)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'training_sessions' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE training_sessions 
        ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Update status to include 'planned' status
    -- Note: This is a comment - actual constraint update would require recreating the constraint
    -- ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS training_sessions_status_check;
    -- ALTER TABLE training_sessions ADD CONSTRAINT training_sessions_status_check 
    --   CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled'));
END $$;

-- Create index for performance metrics queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_completed 
ON training_sessions(user_id, completed_at DESC) 
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_sessions_date_range 
ON training_sessions(user_id, session_date) 
WHERE session_date IS NOT NULL;

-- Create index for session type filtering
CREATE INDEX IF NOT EXISTS idx_training_sessions_type_status 
ON training_sessions(session_type, status) 
WHERE status IN ('planned', 'completed');

-- Performance metrics view for easier querying
CREATE OR REPLACE VIEW performance_metrics_summary AS
SELECT 
    user_id,
    session_type,
    COUNT(*) as total_sessions,
    AVG(duration_minutes) as avg_duration,
    AVG(intensity_level) as avg_intensity,
    AVG(performance_score) as avg_performance,
    MAX(session_date) as last_session_date,
    MIN(session_date) as first_session_date
FROM training_sessions
WHERE status = 'completed'
GROUP BY user_id, session_type;

-- Training load aggregation view for heatmap
CREATE OR REPLACE VIEW training_load_daily AS
SELECT 
    user_id,
    session_date,
    COUNT(*) as session_count,
    SUM(duration_minutes) as total_duration,
    AVG(intensity_level) as avg_intensity,
    MAX(intensity_level) as max_intensity,
    array_agg(DISTINCT session_type) as session_types
FROM training_sessions
WHERE status = 'completed' AND session_date IS NOT NULL
GROUP BY user_id, session_date;

-- Add comments for documentation
COMMENT ON COLUMN training_sessions.equipment IS 'Array of equipment used in the session (e.g., ["cones", "weights"])';
COMMENT ON COLUMN training_sessions.goals IS 'Array of training goals (e.g., ["speed", "agility"])';
COMMENT ON COLUMN training_sessions.exercises IS 'JSONB array of exercise details from Training Builder';
COMMENT ON COLUMN training_sessions.completed_at IS 'Timestamp when session was completed (null for planned sessions)';
COMMENT ON VIEW performance_metrics_summary IS 'Aggregated performance metrics by user and session type';
COMMENT ON VIEW training_load_daily IS 'Daily training load aggregation for heatmap visualization';




-- ============================================================================
-- Migration: 031_open_data_sessions_system.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- OPEN DATA SESSIONS SYSTEM
-- Migration: 031_open_data_sessions_system.sql
-- Supports importing open-source sport-science datasets and computing flag-football metrics
-- =============================================================================

-- Sessions table for imported open-source data
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session date
    date DATE NOT NULL,
    
    -- RPE (Rate of Perceived Exertion) - filled post-session
    rpe INTEGER CHECK (rpe >= 0 AND rpe <= 10),
    
    -- Computed metrics from imported data
    total_volume DECIMAL(10,2), -- Total distance in meters
    high_speed_distance DECIMAL(10,2), -- Distance at high speed (>5.5 m/s) in meters
    sprint_count INTEGER, -- Number of sprint efforts (>7.0 m/s)
    duration_minutes INTEGER, -- Session duration in minutes
    
    -- Metadata
    data_source VARCHAR(100), -- Source of the data (e.g., 'gps_tracker', 'open_dataset')
    raw_data JSONB, -- Store original dataset for reference
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_athlete_date ON sessions(athlete_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_athlete ON sessions(athlete_id);

-- Comments
COMMENT ON TABLE sessions IS 'Stores training sessions imported from open-source datasets with computed flag-football metrics';
COMMENT ON COLUMN sessions.total_volume IS 'Total distance covered in meters';
COMMENT ON COLUMN sessions.high_speed_distance IS 'Distance covered at high speed (>5.5 m/s) in meters';
COMMENT ON COLUMN sessions.sprint_count IS 'Number of sprint efforts (>7.0 m/s)';
COMMENT ON COLUMN sessions.rpe IS 'Rate of Perceived Exertion (0-10 scale), filled post-session';




-- ============================================================================
-- Migration: 031_wellness_and_measurements_tables.sql
-- Type: database
-- ============================================================================

-- Migration: Wellness and Physical Measurements Tables
-- Creates missing tables for wellness tracking, physical measurements, and supplements
-- Created: 2024-11-22

-- Physical Measurements Table
-- Stores athlete body composition and physical measurement data
CREATE TABLE IF NOT EXISTS physical_measurements (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) CHECK (weight >= 40 AND weight <= 200),
    height DECIMAL(5,2) CHECK (height >= 140 AND height <= 220),
    body_fat DECIMAL(4,2) CHECK (body_fat >= 3 AND body_fat <= 50),
    muscle_mass DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness Data Table
-- Tracks daily wellness metrics for athlete monitoring
CREATE TABLE IF NOT EXISTS wellness_data (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    sleep INTEGER CHECK (sleep >= 0 AND sleep <= 10),
    energy INTEGER CHECK (energy >= 0 AND energy <= 10),
    stress INTEGER CHECK (stress >= 0 AND stress <= 10),
    soreness INTEGER CHECK (soreness >= 0 AND soreness <= 10),
    motivation INTEGER CHECK (motivation >= 0 AND motivation <= 10),
    mood INTEGER CHECK (mood >= 0 AND mood <= 10),
    hydration INTEGER CHECK (hydration >= 0 AND hydration <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Supplements Data Table
-- Tracks supplement intake and compliance
CREATE TABLE IF NOT EXISTS supplements_data (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    taken BOOLEAN DEFAULT false,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_of_day VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_physical_measurements_user_date
ON physical_measurements(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wellness_data_user_date
ON wellness_data(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_supplements_data_user_date
ON supplements_data(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_supplements_data_name
ON supplements_data(name)
WHERE taken = true;

-- Add comments for documentation
COMMENT ON TABLE physical_measurements IS 'Stores athlete body composition and physical measurement data';
COMMENT ON TABLE wellness_data IS 'Tracks daily wellness metrics for athlete monitoring and recovery assessment';
COMMENT ON TABLE supplements_data IS 'Tracks supplement intake and compliance for nutrition monitoring';

COMMENT ON COLUMN physical_measurements.weight IS 'Weight in kilograms (40-200 kg)';
COMMENT ON COLUMN physical_measurements.height IS 'Height in centimeters (140-220 cm)';
COMMENT ON COLUMN physical_measurements.body_fat IS 'Body fat percentage (3-50%)';
COMMENT ON COLUMN physical_measurements.muscle_mass IS 'Muscle mass in kilograms';

COMMENT ON COLUMN wellness_data.sleep IS 'Sleep quality rating (0-10 scale)';
COMMENT ON COLUMN wellness_data.energy IS 'Energy level rating (0-10 scale)';
COMMENT ON COLUMN wellness_data.stress IS 'Stress level rating (0-10 scale, higher = more stressed)';
COMMENT ON COLUMN wellness_data.soreness IS 'Muscle soreness rating (0-10 scale)';
COMMENT ON COLUMN wellness_data.motivation IS 'Motivation level rating (0-10 scale)';
COMMENT ON COLUMN wellness_data.mood IS 'Overall mood rating (0-10 scale)';
COMMENT ON COLUMN wellness_data.hydration IS 'Hydration level rating (0-10 scale)';

COMMENT ON COLUMN supplements_data.taken IS 'Whether the supplement was taken on this date';
COMMENT ON COLUMN supplements_data.time_of_day IS 'When supplement was taken (morning, afternoon, evening, pre-workout, post-workout)';

-- Create views for easier data access

-- Physical measurements summary view
CREATE OR REPLACE VIEW physical_measurements_latest AS
SELECT DISTINCT ON (user_id)
    user_id,
    weight,
    height,
    body_fat,
    muscle_mass,
    created_at,
    LAG(weight) OVER (PARTITION BY user_id ORDER BY created_at) as previous_weight,
    LAG(body_fat) OVER (PARTITION BY user_id ORDER BY created_at) as previous_body_fat
FROM physical_measurements
ORDER BY user_id, created_at DESC;

-- Wellness summary view (last 30 days)
CREATE OR REPLACE VIEW wellness_summary_30d AS
SELECT
    user_id,
    COUNT(*) as total_entries,
    AVG(sleep)::DECIMAL(3,1) as avg_sleep,
    AVG(energy)::DECIMAL(3,1) as avg_energy,
    AVG(stress)::DECIMAL(3,1) as avg_stress,
    AVG(soreness)::DECIMAL(3,1) as avg_soreness,
    AVG(motivation)::DECIMAL(3,1) as avg_motivation,
    MAX(date) as last_entry_date
FROM wellness_data
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id;

-- Supplement compliance view
CREATE OR REPLACE VIEW supplement_compliance AS
SELECT
    user_id,
    name,
    COUNT(*) as total_scheduled,
    SUM(CASE WHEN taken THEN 1 ELSE 0 END) as times_taken,
    ROUND((SUM(CASE WHEN taken THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 1) as compliance_percentage,
    MAX(date) FILTER (WHERE taken) as last_taken_date
FROM supplements_data
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, name;

COMMENT ON VIEW physical_measurements_latest IS 'Latest physical measurements for each user with previous values for trend analysis';
COMMENT ON VIEW wellness_summary_30d IS 'Wellness averages for the last 30 days by user';
COMMENT ON VIEW supplement_compliance IS 'Supplement compliance statistics for the last 30 days';

-- Insert sample data for testing (optional)
-- Uncomment to add sample data

-- INSERT INTO physical_measurements (user_id, weight, height, body_fat, muscle_mass) VALUES
-- ('1', 75.5, 178.0, 12.5, 62.0),
-- ('1', 76.0, 178.0, 12.3, 62.5);

-- INSERT INTO wellness_data (user_id, date, sleep, energy, stress, soreness, motivation, mood, hydration) VALUES
-- ('1', CURRENT_DATE, 8, 7, 3, 4, 8, 7, 8),
-- ('1', CURRENT_DATE - INTERVAL '1 day', 7, 6, 4, 5, 7, 6, 7);

-- INSERT INTO supplements_data (user_id, name, dosage, taken, date, time_of_day) VALUES
-- ('1', 'Protein Powder', '30g', true, CURRENT_DATE, 'post-workout'),
-- ('1', 'Creatine', '5g', true, CURRENT_DATE, 'morning'),
-- ('1', 'Vitamin D', '2000 IU', true, CURRENT_DATE, 'morning');



-- ============================================================================
-- Migration: 032_acwr_compute_function.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- ACWR COMPUTATION FUNCTION
-- Migration: 032_acwr_compute_function.sql
-- Computes ACWR (Acute:Chronic Workload Ratio) for any athlete using rolling averages
-- =============================================================================

-- Function to compute ACWR for an athlete
-- Updated to use unified view that includes all training session tables
CREATE OR REPLACE FUNCTION compute_acwr(athlete uuid)
RETURNS TABLE (
  session_date date,
  load numeric,
  acute_load numeric,
  chronic_load numeric,
  acwr numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use unified view if it exists, otherwise fall back to sessions table
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'training_sessions_with_load'
  ) THEN
    RETURN QUERY
    SELECT
      tsl.session_date,
      COALESCE(tsl.training_load, 0)::numeric as load,
      (
        SELECT AVG(COALESCE(training_load, 0))
        FROM training_sessions_with_load
        WHERE athlete_id = athlete
          AND session_date BETWEEN tsl.session_date - INTERVAL '6 days' AND tsl.session_date
      )::numeric as acute_load,
      (
        SELECT AVG(COALESCE(training_load, 0))
        FROM training_sessions_with_load
        WHERE athlete_id = athlete
          AND session_date BETWEEN tsl.session_date - INTERVAL '27 days' AND tsl.session_date
      )::numeric as chronic_load,
      CASE
        WHEN (
          SELECT AVG(COALESCE(training_load, 0))
          FROM training_sessions_with_load
          WHERE athlete_id = athlete
            AND session_date BETWEEN tsl.session_date - INTERVAL '27 days' AND tsl.session_date
        ) = 0 THEN NULL
        ELSE (
          (
            SELECT AVG(COALESCE(training_load, 0))
            FROM training_sessions_with_load
            WHERE athlete_id = athlete
              AND session_date BETWEEN tsl.session_date - INTERVAL '6 days' AND tsl.session_date
          )::numeric
          /
          (
            SELECT AVG(COALESCE(training_load, 0))
            FROM training_sessions_with_load
            WHERE athlete_id = athlete
              AND session_date BETWEEN tsl.session_date - INTERVAL '27 days' AND tsl.session_date
          )::numeric
        )
      END as acwr
    FROM training_sessions_with_load tsl
    WHERE tsl.athlete_id = athlete
      AND tsl.training_load IS NOT NULL
    ORDER BY tsl.session_date DESC;
  ELSE
    -- Fallback to original sessions table implementation
    RETURN QUERY
    SELECT
      s.date as session_date,
      (COALESCE(s.rpe, 0) * COALESCE(s.duration_minutes, 0))::numeric as load,
      (
        SELECT AVG(COALESCE(rpe, 0) * COALESCE(duration_minutes, 0))
        FROM sessions
        WHERE athlete_id = athlete
          AND date BETWEEN s.date - INTERVAL '6 days' AND s.date
      )::numeric as acute_load,
      (
        SELECT AVG(COALESCE(rpe, 0) * COALESCE(duration_minutes, 0))
        FROM sessions
        WHERE athlete_id = athlete
          AND date BETWEEN s.date - INTERVAL '27 days' AND s.date
      )::numeric as chronic_load,
      CASE
        WHEN (
          SELECT AVG(COALESCE(rpe, 0) * COALESCE(duration_minutes, 0))
          FROM sessions
          WHERE athlete_id = athlete
            AND date BETWEEN s.date - INTERVAL '27 days' AND s.date
        ) = 0 THEN NULL
        ELSE (
          (
            SELECT AVG(COALESCE(rpe, 0) * COALESCE(duration_minutes, 0))
            FROM sessions
            WHERE athlete_id = athlete
              AND date BETWEEN s.date - INTERVAL '6 days' AND s.date
          )::numeric
          /
          (
            SELECT AVG(COALESCE(rpe, 0) * COALESCE(duration_minutes, 0))
            FROM sessions
            WHERE athlete_id = athlete
              AND date BETWEEN s.date - INTERVAL '27 days' AND s.date
          )::numeric
        )
      END as acwr
    FROM sessions s
    WHERE athlete_id = athlete
    ORDER BY s.date DESC;
  END IF;
END;
$$;

-- Comment
COMMENT ON FUNCTION compute_acwr IS 'Computes ACWR (Acute:Chronic Workload Ratio) for an athlete using rolling 7-day and 28-day averages. Uses unified training_sessions_with_load view if available, otherwise falls back to sessions table.';




-- ============================================================================
-- Migration: 032_fix_analytics_events_rls_performance.sql
-- Type: database
-- ============================================================================

-- Migration: Fix analytics_events_admin_all RLS Policy Performance
-- Fixes suboptimal query performance by wrapping auth functions in subqueries
-- This prevents re-evaluation of auth functions for each row
-- Created: 2024-12-19
--
-- Issue: The analytics_events_admin_all policy re-evaluates auth functions
-- for each row, causing performance issues at scale.
-- Solution: Wrap auth function calls in (select auth.<function>()) to
-- ensure they're evaluated once per query instead of once per row.

-- ============================================================================
-- STEP 1: Drop the existing policy
-- ============================================================================

DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;

-- ============================================================================
-- STEP 2: Recreate the policy with optimized auth function calls
-- ============================================================================
-- IMPORTANT: Before running this migration, inspect your existing policy
-- using the helper script: database/fix-rls-performance-helper.sql
--
-- The most common admin check patterns are shown below. Uncomment and
-- modify the one that matches your actual policy logic.
--
-- Key optimization: Wrap all auth functions in (SELECT ...) to ensure
-- they're evaluated once per query instead of once per row.

-- Pattern 1: Admin role check via auth.role() (most common in Supabase)
CREATE POLICY analytics_events_admin_all
ON public.analytics_events
FOR ALL
USING ((SELECT auth.role()) = 'admin');

-- ============================================================================
-- ALTERNATIVE PATTERNS: If Pattern 1 above doesn't match your policy,
-- comment it out and uncomment one of these alternatives:
-- ============================================================================

-- Pattern 2: Admin check via JWT claims (if using custom JWT claims)
-- DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;
-- CREATE POLICY analytics_events_admin_all
-- ON public.analytics_events
-- FOR ALL
-- USING (
--   (SELECT current_setting('request.jwt.claims', true)::jsonb->>'role') = 'admin'
-- );

-- Pattern 3: Admin check via users table (if checking users.role column)
-- DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;
-- CREATE POLICY analytics_events_admin_all
-- ON public.analytics_events
-- FOR ALL
-- USING (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE id = (SELECT auth.uid())
--     AND role = 'admin'
--   )
-- );

-- Pattern 4: Service role bypass (if using service role key)
-- DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;
-- CREATE POLICY analytics_events_admin_all
-- ON public.analytics_events
-- FOR ALL
-- USING (
--   (SELECT current_setting('request.jwt.claims', true)::jsonb->>'role') = 'service_role'
-- );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify the policy was created correctly:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'analytics_events'
-- AND policyname = 'analytics_events_admin_all';

-- ============================================================================
-- NOTES
-- ============================================================================
-- Key optimization: Wrapping auth functions in (SELECT ...) ensures they
-- are evaluated once per query execution rather than once per row.
--
-- Before: auth.role() evaluated for each row
-- After: (SELECT auth.role()) evaluated once per query
--
-- This significantly improves performance when querying large tables.




-- ============================================================================
-- Migration: 033_consolidate_analytics_events_policies.sql
-- Type: database
-- ============================================================================

-- Migration: Consolidate Multiple Permissive Policies on analytics_events
-- Fixes performance issue caused by multiple permissive policies for the same role/action
-- Created: 2024-12-19
--
-- Issue: Table has multiple permissive policies for INSERT and SELECT operations:
--   - analytics_events_admin_all (FOR ALL, allows admins)
--   - analytics_events_insert_authenticated (FOR INSERT, allows authenticated users)
--   - analytics_events_select_authenticated (FOR SELECT, allows authenticated users)
--
-- Problem: Multiple permissive policies require PostgreSQL to evaluate each policy
-- separately, which is suboptimal for performance. Each policy must be executed
-- for every relevant query.
--
-- Solution: Consolidate into a single policy that handles both cases efficiently.

-- ============================================================================
-- STEP 1: Drop existing policies
-- ============================================================================

DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_insert_authenticated ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_select_authenticated ON public.analytics_events;

-- ============================================================================
-- STEP 2: Create consolidated policies
-- ============================================================================
-- We'll create separate policies for different operations to maintain clarity,
-- but each operation will have only ONE policy per role/action combination.

-- Policy for INSERT: Allows users to insert their own events OR admins to insert any
CREATE POLICY analytics_events_insert_policy
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (
  -- Regular users can insert their own events
  -- Optimized: Wrap auth function in subquery
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can insert any events
  -- Optimized: Wrap auth function in subquery
  (SELECT auth.role()) = 'admin'
);

-- Policy for SELECT: Allows users to view their own events OR admins to view all
CREATE POLICY analytics_events_select_policy
ON public.analytics_events
FOR SELECT
TO authenticated
USING (
  -- Regular users can view their own events
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can view all events
  (SELECT auth.role()) = 'admin'
);

-- Policy for UPDATE: Allows users to update their own events OR admins to update any
CREATE POLICY analytics_events_update_policy
ON public.analytics_events
FOR UPDATE
TO authenticated
USING (
  -- Regular users can update their own events
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can update any events
  (SELECT auth.role()) = 'admin'
)
WITH CHECK (
  -- Same check for the new values
  user_id = (SELECT auth.uid())::text
  OR
  (SELECT auth.role()) = 'admin'
);

-- Policy for DELETE: Allows users to delete their own events OR admins to delete any
CREATE POLICY analytics_events_delete_policy
ON public.analytics_events
FOR DELETE
TO authenticated
USING (
  -- Regular users can delete their own events
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can delete any events
  (SELECT auth.role()) = 'admin'
);

-- ============================================================================
-- ALTERNATIVE: Single FOR ALL policy (if you prefer one policy for all operations)
-- ============================================================================
-- If you prefer a single policy covering all operations, uncomment this and
-- comment out the individual policies above:
--
-- CREATE POLICY analytics_events_all_operations
-- ON public.analytics_events
-- FOR ALL
-- TO authenticated
-- USING (
--   user_id = (SELECT auth.uid())::text
--   OR
--   (SELECT auth.role()) = 'admin'
-- )
-- WITH CHECK (
--   user_id = (SELECT auth.uid())::text
--   OR
--   (SELECT auth.role()) = 'admin'
-- );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify there's only one policy per role/action:
-- 
-- SELECT 
--     policyname,
--     cmd as action,
--     roles,
--     permissive
-- FROM pg_policies
-- WHERE tablename = 'analytics_events'
-- ORDER BY cmd, policyname;
--
-- Expected result: Only one policy per action (INSERT, SELECT, UPDATE, DELETE)
-- for the 'authenticated' role.

-- ============================================================================
-- NOTES
-- ============================================================================
-- Key improvements:
-- 1. Single policy per role/action combination (better performance)
-- 2. Auth functions wrapped in subqueries (prevents per-row re-evaluation)
-- 3. Clear separation of concerns (one policy per operation)
-- 4. Maintains same security model (users see own data, admins see all)
--
-- Performance benefits:
-- - PostgreSQL only needs to evaluate one policy per operation
-- - Auth functions evaluated once per query (not per row)
-- - Reduced overhead for INSERT and SELECT operations at scale




-- ============================================================================
-- Migration: 033a_readiness_score_system.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- READINESS SCORE SYSTEM
-- Migration: 033_readiness_score_system.sql
-- Evidence-based readiness scoring combining session-RPE, ACWR, wellness, and game proximity
-- =============================================================================

-- Add RPE field to training_sessions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'rpe'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN rpe INTEGER CHECK (rpe BETWEEN 1 AND 10);
    COMMENT ON COLUMN training_sessions.rpe IS 'Rate of Perceived Exertion (1-10 scale) for session-RPE load calculation';
  END IF;
END $$;

-- Wellness logs table (if wellness_data exists, we'll use that structure)
-- Create wellness_logs for readiness-specific fields
CREATE TABLE IF NOT EXISTS wellness_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    
    -- Core wellness metrics for readiness
    fatigue INTEGER NOT NULL CHECK (fatigue BETWEEN 1 AND 10), -- 1 = very fresh, 10 = exhausted
    sleep_quality INTEGER NOT NULL CHECK (sleep_quality BETWEEN 1 AND 10), -- 1 = poor, 10 = excellent
    soreness INTEGER NOT NULL CHECK (soreness BETWEEN 1 AND 10), -- 1 = no soreness, 10 = very sore
    
    -- Optional sleep hours
    sleep_hours NUMERIC(4,1),
    
    -- Additional wellness fields (optional, can map from wellness_data)
    energy INTEGER CHECK (energy BETWEEN 1 AND 10),
    stress INTEGER CHECK (stress BETWEEN 1 AND 10),
    mood INTEGER CHECK (mood BETWEEN 1 AND 10),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (athlete_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_wellness_logs_athlete_date ON wellness_logs(athlete_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_logs_date ON wellness_logs(log_date DESC);

COMMENT ON TABLE wellness_logs IS 'Daily wellness logs for readiness score calculation';
COMMENT ON COLUMN wellness_logs.fatigue IS 'Fatigue level (1 = very fresh, 10 = exhausted)';
COMMENT ON COLUMN wellness_logs.sleep_quality IS 'Sleep quality rating (1 = poor, 10 = excellent)';
COMMENT ON COLUMN wellness_logs.soreness IS 'Muscle soreness (1 = none, 10 = very sore)';

-- Function to sync wellness_data to wellness_logs (if wellness_data exists)
CREATE OR REPLACE FUNCTION sync_wellness_to_readiness()
RETURNS TRIGGER AS $$
BEGIN
    -- Map wellness_data fields to wellness_logs
    -- fatigue: use energy inverted (10 - energy) or soreness as proxy
    -- sleep_quality: use sleep field directly
    -- soreness: use soreness field directly
    INSERT INTO wellness_logs (
        athlete_id,
        log_date,
        fatigue,
        sleep_quality,
        soreness,
        sleep_hours,
        energy,
        stress,
        mood
    )
    VALUES (
        NEW.user_id::uuid,
        NEW.date,
        COALESCE(10 - NEW.energy, NEW.soreness, 5), -- Estimate fatigue
        NEW.sleep,
        NEW.soreness,
        NULL, -- sleep_hours not in wellness_data
        NEW.energy,
        NEW.stress,
        NEW.mood
    )
    ON CONFLICT (athlete_id, log_date) 
    DO UPDATE SET
        fatigue = COALESCE(10 - NEW.energy, NEW.soreness, 5),
        sleep_quality = NEW.sleep,
        soreness = NEW.soreness,
        energy = NEW.energy,
        stress = NEW.stress,
        mood = NEW.mood;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if wellness_data table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wellness_data') THEN
        DROP TRIGGER IF EXISTS trigger_sync_wellness_to_readiness ON wellness_data;
        CREATE TRIGGER trigger_sync_wellness_to_readiness
            AFTER INSERT OR UPDATE ON wellness_data
            FOR EACH ROW
            EXECUTE FUNCTION sync_wellness_to_readiness();
    END IF;
END $$;

-- Fixtures table for game proximity calculation
CREATE TABLE IF NOT EXISTS fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional: individual athlete fixtures
    
    opponent TEXT,
    game_start TIMESTAMPTZ NOT NULL,
    location TEXT,
    game_type VARCHAR(50), -- 'game', 'scrimmage', 'tournament', etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fixtures_team ON fixtures(team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_athlete ON fixtures(athlete_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_game_start ON fixtures(game_start);

COMMENT ON TABLE fixtures IS 'Game fixtures for calculating game proximity in readiness scores';

-- Readiness scores table (materialized daily scores)
CREATE TABLE IF NOT EXISTS readiness_scores (
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    
    -- Composite score (0-100)
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    
    -- Categorical outputs
    level TEXT NOT NULL CHECK (level IN ('low', 'moderate', 'high')),
    suggestion TEXT NOT NULL CHECK (suggestion IN ('deload', 'maintain', 'push')),
    
    -- Component metrics
    acwr NUMERIC(6,2),
    acute_load NUMERIC(10,2),
    chronic_load NUMERIC(10,2),
    
    -- Component scores (for transparency)
    workload_score INTEGER CHECK (workload_score BETWEEN 0 AND 100),
    wellness_score INTEGER CHECK (wellness_score BETWEEN 0 AND 100),
    sleep_score INTEGER CHECK (sleep_score BETWEEN 0 AND 100),
    proximity_score INTEGER CHECK (proximity_score BETWEEN 0 AND 100),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (athlete_id, day)
);

CREATE INDEX IF NOT EXISTS idx_readiness_scores_athlete ON readiness_scores(athlete_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_readiness_scores_level ON readiness_scores(level);
CREATE INDEX IF NOT EXISTS idx_readiness_scores_day ON readiness_scores(day DESC);

COMMENT ON TABLE readiness_scores IS 'Daily readiness scores combining workload, wellness, sleep, and game proximity';
COMMENT ON COLUMN readiness_scores.score IS 'Composite readiness score (0-100)';
COMMENT ON COLUMN readiness_scores.level IS 'Readiness level: low, moderate, or high';
COMMENT ON COLUMN readiness_scores.suggestion IS 'Training suggestion: deload, maintain, or push';
COMMENT ON COLUMN readiness_scores.acwr IS 'Acute:Chronic Workload Ratio';
COMMENT ON COLUMN readiness_scores.acute_load IS '7-day acute load (session-RPE sum)';
COMMENT ON COLUMN readiness_scores.chronic_load IS '28-day chronic load (weekly average)';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_readiness_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_readiness_scores_updated_at
    BEFORE UPDATE ON readiness_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_readiness_scores_updated_at();




-- ============================================================================
-- Migration: 033b_readiness_score_system_create_tables.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- READINESS SCORE SYSTEM - CREATE MISSING TABLES
-- Migration: 033_readiness_score_system_create_tables.sql
-- Creates the missing tables: wellness_logs, fixtures, readiness_scores
-- =============================================================================

-- Wellness logs table for readiness-specific fields
CREATE TABLE IF NOT EXISTS wellness_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    
    -- Core wellness metrics for readiness
    fatigue INTEGER NOT NULL CHECK (fatigue BETWEEN 1 AND 10), -- 1 = very fresh, 10 = exhausted
    sleep_quality INTEGER NOT NULL CHECK (sleep_quality BETWEEN 1 AND 10), -- 1 = poor, 10 = excellent
    soreness INTEGER NOT NULL CHECK (soreness BETWEEN 1 AND 10), -- 1 = no soreness, 10 = very sore
    
    -- Optional sleep hours
    sleep_hours NUMERIC(4,1),
    
    -- Additional wellness fields (optional, can map from wellness_data)
    energy INTEGER CHECK (energy BETWEEN 1 AND 10),
    stress INTEGER CHECK (stress BETWEEN 1 AND 10),
    mood INTEGER CHECK (mood BETWEEN 1 AND 10),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (athlete_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_wellness_logs_athlete_date ON wellness_logs(athlete_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_logs_date ON wellness_logs(log_date DESC);

COMMENT ON TABLE wellness_logs IS 'Daily wellness logs for readiness score calculation';
COMMENT ON COLUMN wellness_logs.fatigue IS 'Fatigue level (1 = very fresh, 10 = exhausted)';
COMMENT ON COLUMN wellness_logs.sleep_quality IS 'Sleep quality rating (1 = poor, 10 = excellent)';
COMMENT ON COLUMN wellness_logs.soreness IS 'Muscle soreness (1 = none, 10 = very sore)';

-- Fixtures table for game proximity calculation
CREATE TABLE IF NOT EXISTS fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional: individual athlete fixtures
    
    opponent TEXT,
    game_start TIMESTAMPTZ NOT NULL,
    location TEXT,
    game_type VARCHAR(50), -- 'game', 'scrimmage', 'tournament', etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fixtures_team ON fixtures(team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_athlete ON fixtures(athlete_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_game_start ON fixtures(game_start);

COMMENT ON TABLE fixtures IS 'Game fixtures for calculating game proximity in readiness scores';

-- Readiness scores table (materialized daily scores)
CREATE TABLE IF NOT EXISTS readiness_scores (
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    
    -- Composite score (0-100)
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    
    -- Categorical outputs
    level TEXT NOT NULL CHECK (level IN ('low', 'moderate', 'high')),
    suggestion TEXT NOT NULL CHECK (suggestion IN ('deload', 'maintain', 'push')),
    
    -- Component metrics
    acwr NUMERIC(6,2),
    acute_load NUMERIC(10,2),
    chronic_load NUMERIC(10,2),
    
    -- Component scores (for transparency)
    workload_score INTEGER CHECK (workload_score BETWEEN 0 AND 100),
    wellness_score INTEGER CHECK (wellness_score BETWEEN 0 AND 100),
    sleep_score INTEGER CHECK (sleep_score BETWEEN 0 AND 100),
    proximity_score INTEGER CHECK (proximity_score BETWEEN 0 AND 100),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (athlete_id, day)
);

CREATE INDEX IF NOT EXISTS idx_readiness_scores_athlete ON readiness_scores(athlete_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_readiness_scores_level ON readiness_scores(level);
CREATE INDEX IF NOT EXISTS idx_readiness_scores_day ON readiness_scores(day DESC);

COMMENT ON TABLE readiness_scores IS 'Daily readiness scores combining workload, wellness, sleep, and game proximity';
COMMENT ON COLUMN readiness_scores.score IS 'Composite readiness score (0-100)';
COMMENT ON COLUMN readiness_scores.level IS 'Readiness level: low, moderate, or high';
COMMENT ON COLUMN readiness_scores.suggestion IS 'Training suggestion: deload, maintain, or push';
COMMENT ON COLUMN readiness_scores.acwr IS 'Acute:Chronic Workload Ratio';
COMMENT ON COLUMN readiness_scores.acute_load IS '7-day acute load (session-RPE sum)';
COMMENT ON COLUMN readiness_scores.chronic_load IS '28-day chronic load (weekly average)';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_readiness_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_readiness_scores_updated_at
    BEFORE UPDATE ON readiness_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_readiness_scores_updated_at();

-- Function to sync wellness_data to wellness_logs (if wellness_data exists)
CREATE OR REPLACE FUNCTION sync_wellness_to_readiness()
RETURNS TRIGGER AS $$
BEGIN
    -- Map wellness_data fields to wellness_logs
    -- fatigue: use energy inverted (10 - energy) or soreness as proxy
    -- sleep_quality: use sleep field directly
    -- soreness: use soreness field directly
    INSERT INTO wellness_logs (
        athlete_id,
        log_date,
        fatigue,
        sleep_quality,
        soreness,
        sleep_hours,
        energy,
        stress,
        mood
    )
    VALUES (
        NEW.user_id::uuid,
        NEW.date,
        COALESCE(10 - NEW.energy, NEW.soreness, 5), -- Estimate fatigue
        NEW.sleep,
        NEW.soreness,
        NULL, -- sleep_hours not in wellness_data
        NEW.energy,
        NEW.stress,
        NEW.mood
    )
    ON CONFLICT (athlete_id, log_date) 
    DO UPDATE SET
        fatigue = COALESCE(10 - NEW.energy, NEW.soreness, 5),
        sleep_quality = NEW.sleep,
        soreness = NEW.soreness,
        energy = NEW.energy,
        stress = NEW.stress,
        mood = NEW.mood;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if wellness_data table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wellness_data') THEN
        DROP TRIGGER IF EXISTS trigger_sync_wellness_to_readiness ON wellness_data;
        CREATE TRIGGER trigger_sync_wellness_to_readiness
            AFTER INSERT OR UPDATE ON wellness_data
            FOR EACH ROW
            EXECUTE FUNCTION sync_wellness_to_readiness();
    END IF;
END $$;




-- ============================================================================
-- Migration: 034_check_acwr_rpe_consistency.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- ACWR & RPE CONSISTENCY CHECK
-- Migration: 034_check_acwr_rpe_consistency.sql
-- Verifies that all training session tables have proper RPE and duration fields
-- for ACWR calculations
-- =============================================================================

-- =============================================================================
-- 1. ENSURE training_sessions HAS RPE FIELD
-- =============================================================================

DO $$
BEGIN
  -- Add RPE column if it doesn't exist (from migration 033)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'rpe'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN rpe INTEGER CHECK (rpe BETWEEN 0 AND 10);
    COMMENT ON COLUMN training_sessions.rpe IS 'Rate of Perceived Exertion (0-10 scale) for session-RPE load calculation. Required for ACWR.';
  END IF;

  -- Add session_date if it doesn't exist (some versions might use date)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'session_date'
  ) THEN
    -- Check if 'date' column exists instead
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'training_sessions' AND column_name = 'date'
    ) THEN
      -- Rename date to session_date for consistency
      ALTER TABLE training_sessions RENAME COLUMN date TO session_date;
    ELSE
      -- Add session_date if neither exists
      ALTER TABLE training_sessions ADD COLUMN session_date DATE;
      -- Set default to created_at date if available
      UPDATE training_sessions 
      SET session_date = DATE(created_at) 
      WHERE session_date IS NULL;
    END IF;
  END IF;

  -- Ensure duration_minutes exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'duration_minutes'
  ) THEN
    -- Check for alternative duration field names
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'training_sessions' AND column_name = 'duration'
    ) THEN
      ALTER TABLE training_sessions RENAME COLUMN duration TO duration_minutes;
    ELSE
      ALTER TABLE training_sessions ADD COLUMN duration_minutes INTEGER;
    END IF;
  END IF;
END $$;

-- =============================================================================
-- 2. CREATE FUNCTION TO CALCULATE SESSION LOAD FROM ANY TABLE
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_session_load(
  rpe_value INTEGER,
  duration_value INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Session-RPE load = RPE × Duration (Foster et al. 2001)
  IF rpe_value IS NULL OR duration_value IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN COALESCE(rpe_value, 0) * COALESCE(duration_value, 0);
END;
$$;

COMMENT ON FUNCTION calculate_session_load IS 'Calculates session-RPE load (RPE × Duration) for ACWR calculations';

-- =============================================================================
-- 3. CREATE UNIFIED VIEW FOR TRAINING SESSIONS WITH LOAD
-- =============================================================================

CREATE OR REPLACE VIEW training_sessions_with_load AS
SELECT 
  id,
  COALESCE(user_id, athlete_id) as athlete_id,
  COALESCE(session_date, date) as session_date,
  session_type,
  duration_minutes,
  rpe,
  intensity_level,
  -- Calculate load: prefer rpe, fallback to intensity_level
  calculate_session_load(
    COALESCE(rpe, intensity_level),
    duration_minutes
  ) as training_load,
  'training_sessions' as source_table
FROM training_sessions
WHERE COALESCE(session_date, date) IS NOT NULL
  AND duration_minutes IS NOT NULL
  AND (rpe IS NOT NULL OR intensity_level IS NOT NULL)

UNION ALL

SELECT 
  id,
  athlete_id,
  date as session_date,
  NULL as session_type,
  duration_minutes,
  rpe,
  NULL as intensity_level,
  calculate_session_load(rpe, duration_minutes) as training_load,
  'sessions' as source_table
FROM sessions
WHERE date IS NOT NULL
  AND duration_minutes IS NOT NULL
  AND rpe IS NOT NULL

UNION ALL

SELECT 
  id,
  user_id as athlete_id,
  session_date,
  session_type,
  session_duration as duration_minutes,
  session_rpe as rpe,
  NULL as intensity_level,
  calculate_session_load(session_rpe, session_duration) as training_load,
  'training_load_metrics' as source_table
FROM training_load_metrics
WHERE session_date IS NOT NULL
  AND session_duration IS NOT NULL
  AND session_rpe IS NOT NULL;

COMMENT ON VIEW training_sessions_with_load IS 'Unified view of all training sessions with calculated session-RPE loads for ACWR calculations';

-- =============================================================================
-- 4. CREATE CONSISTENCY CHECK FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION check_acwr_data_consistency(athlete_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  table_name TEXT,
  total_sessions BIGINT,
  sessions_with_rpe BIGINT,
  sessions_with_duration BIGINT,
  sessions_with_both BIGINT,
  sessions_with_load BIGINT,
  missing_rpe_count BIGINT,
  missing_duration_count BIGINT,
  avg_load NUMERIC,
  date_range_start DATE,
  date_range_end DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH training_sessions_stats AS (
    SELECT 
      'training_sessions'::TEXT as tbl,
      COUNT(*) as total,
      COUNT(rpe) as has_rpe,
      COUNT(duration_minutes) as has_duration,
      COUNT(CASE WHEN rpe IS NOT NULL AND duration_minutes IS NOT NULL THEN 1 END) as has_both,
      COUNT(CASE WHEN calculate_session_load(COALESCE(rpe, intensity_level), duration_minutes) IS NOT NULL THEN 1 END) as has_load,
      COUNT(CASE WHEN rpe IS NULL AND intensity_level IS NULL THEN 1 END) as missing_rpe,
      COUNT(CASE WHEN duration_minutes IS NULL THEN 1 END) as missing_duration,
      AVG(calculate_session_load(COALESCE(rpe, intensity_level), duration_minutes))::NUMERIC as avg_l,
      MIN(COALESCE(session_date, date))::DATE as start_date,
      MAX(COALESCE(session_date, date))::DATE as end_date
    FROM training_sessions
    WHERE (athlete_uuid IS NULL OR COALESCE(user_id, athlete_id) = athlete_uuid)
  ),
  sessions_stats AS (
    SELECT 
      'sessions'::TEXT as tbl,
      COUNT(*) as total,
      COUNT(rpe) as has_rpe,
      COUNT(duration_minutes) as has_duration,
      COUNT(CASE WHEN rpe IS NOT NULL AND duration_minutes IS NOT NULL THEN 1 END) as has_both,
      COUNT(CASE WHEN calculate_session_load(rpe, duration_minutes) IS NOT NULL THEN 1 END) as has_load,
      COUNT(CASE WHEN rpe IS NULL THEN 1 END) as missing_rpe,
      COUNT(CASE WHEN duration_minutes IS NULL THEN 1 END) as missing_duration,
      AVG(calculate_session_load(rpe, duration_minutes))::NUMERIC as avg_l,
      MIN(date)::DATE as start_date,
      MAX(date)::DATE as end_date
    FROM sessions
    WHERE (athlete_uuid IS NULL OR athlete_id = athlete_uuid)
  ),
  training_load_metrics_stats AS (
    SELECT 
      'training_load_metrics'::TEXT as tbl,
      COUNT(*) as total,
      COUNT(session_rpe) as has_rpe,
      COUNT(session_duration) as has_duration,
      COUNT(CASE WHEN session_rpe IS NOT NULL AND session_duration IS NOT NULL THEN 1 END) as has_both,
      COUNT(CASE WHEN calculate_session_load(session_rpe, session_duration) IS NOT NULL THEN 1 END) as has_load,
      COUNT(CASE WHEN session_rpe IS NULL THEN 1 END) as missing_rpe,
      COUNT(CASE WHEN session_duration IS NULL THEN 1 END) as missing_duration,
      AVG(calculate_session_load(session_rpe, session_duration))::NUMERIC as avg_l,
      MIN(session_date)::DATE as start_date,
      MAX(session_date)::DATE as end_date
    FROM training_load_metrics
    WHERE (athlete_uuid IS NULL OR user_id = athlete_uuid)
  )
  SELECT * FROM training_sessions_stats
  UNION ALL SELECT * FROM sessions_stats
  UNION ALL SELECT * FROM training_load_metrics_stats;
END;
$$;

COMMENT ON FUNCTION check_acwr_data_consistency IS 'Checks consistency of RPE and duration data across all training session tables for ACWR calculations';

-- =============================================================================
-- 5. CREATE FUNCTION TO FIX MISSING RPE FROM INTENSITY_LEVEL
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_intensity_to_rpe()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Copy intensity_level to rpe where rpe is NULL
  -- This assumes intensity_level (1-10) maps directly to RPE (0-10)
  UPDATE training_sessions
  SET rpe = intensity_level
  WHERE rpe IS NULL 
    AND intensity_level IS NOT NULL
    AND intensity_level BETWEEN 1 AND 10;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION sync_intensity_to_rpe IS 'Copies intensity_level to rpe field where rpe is missing, assuming 1-10 scale maps directly';

-- =============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for ACWR calculations (date range queries)
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date_rpe 
  ON training_sessions(COALESCE(user_id, athlete_id), COALESCE(session_date, date), rpe)
  WHERE rpe IS NOT NULL AND duration_minutes IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_athlete_date_rpe 
  ON sessions(athlete_id, date, rpe)
  WHERE rpe IS NOT NULL AND duration_minutes IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_load_metrics_user_date_rpe
  ON training_load_metrics(user_id, session_date, session_rpe)
  WHERE session_rpe IS NOT NULL AND session_duration IS NOT NULL;

-- =============================================================================
-- 7. CREATE VALIDATION CONSTRAINT
-- =============================================================================

-- Add check constraint to ensure training_load is calculated correctly
DO $$
BEGIN
  -- Add computed column or trigger to validate training_load
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_load_metrics' AND column_name = 'training_load_validated'
  ) THEN
    ALTER TABLE training_load_metrics ADD COLUMN training_load_validated BOOLEAN DEFAULT FALSE;
    
    -- Update existing records
    UPDATE training_load_metrics
    SET training_load_validated = (
      training_load = calculate_session_load(session_rpe, session_duration)
    )
    WHERE session_rpe IS NOT NULL AND session_duration IS NOT NULL;
  END IF;
END $$;

-- =============================================================================
-- 8. SUMMARY REPORT
-- =============================================================================

-- Create a summary view showing data quality
CREATE OR REPLACE VIEW acwr_data_quality_report AS
SELECT 
  'All Athletes' as scope,
  (SELECT COUNT(*) FROM training_sessions_with_load) as total_sessions,
  (SELECT COUNT(*) FROM training_sessions_with_load WHERE training_load IS NOT NULL) as sessions_with_load,
  (SELECT COUNT(*) FROM training_sessions_with_load WHERE training_load IS NULL) as sessions_missing_load,
  ROUND(
    100.0 * (SELECT COUNT(*) FROM training_sessions_with_load WHERE training_load IS NOT NULL)::NUMERIC /
    NULLIF((SELECT COUNT(*) FROM training_sessions_with_load), 0),
    2
  ) as data_completeness_percent,
  (SELECT AVG(training_load) FROM training_sessions_with_load WHERE training_load IS NOT NULL) as avg_load,
  (SELECT MIN(session_date) FROM training_sessions_with_load) as earliest_session,
  (SELECT MAX(session_date) FROM training_sessions_with_load) as latest_session;

COMMENT ON VIEW acwr_data_quality_report IS 'Summary report of data quality for ACWR calculations across all training session tables';




-- ============================================================================
-- Migration: 034a_enable_rls_wearables_data.sql
-- Type: database
-- ============================================================================

-- Migration: Enable Row Level Security on wearables_data table
-- Created: 2024-12-19
--
-- Issue: Table public.wearables_data is public, but RLS has not been enabled.
-- This is a security concern as anyone with access to PostgREST could access all rows.
--
-- Solution: Enable RLS and create policies to ensure users can only access their own data.

-- ============================================================================
-- STEP 1: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.wearables_data ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create RLS Policies
-- ============================================================================
-- Users can only access their own wearables data
-- user_id is VARCHAR(255), so we cast auth.uid() to text for comparison

-- Policy for SELECT: Users can view their own wearables data
CREATE POLICY wearables_data_select_policy
ON public.wearables_data
FOR SELECT
TO authenticated
USING (
  -- Regular users can view their own data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can view all data
  (SELECT auth.role()) = 'admin'
);

-- Policy for INSERT: Users can insert their own wearables data
CREATE POLICY wearables_data_insert_policy
ON public.wearables_data
FOR INSERT
TO authenticated
WITH CHECK (
  -- Regular users can insert their own data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can insert any data
  (SELECT auth.role()) = 'admin'
);

-- Policy for UPDATE: Users can update their own wearables data
CREATE POLICY wearables_data_update_policy
ON public.wearables_data
FOR UPDATE
TO authenticated
USING (
  -- Regular users can update their own data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can update any data
  (SELECT auth.role()) = 'admin'
)
WITH CHECK (
  -- Same check for the new values
  user_id = (SELECT auth.uid())::text
  OR
  (SELECT auth.role()) = 'admin'
);

-- Policy for DELETE: Users can delete their own wearables data
CREATE POLICY wearables_data_delete_policy
ON public.wearables_data
FOR DELETE
TO authenticated
USING (
  -- Regular users can delete their own data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can delete any data
  (SELECT auth.role()) = 'admin'
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify RLS is enabled and policies are created:
-- 
-- -- Check RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'wearables_data';
--
-- -- Check policies
-- SELECT 
--     policyname,
--     cmd as action,
--     roles,
--     permissive
-- FROM pg_policies
-- WHERE tablename = 'wearables_data'
-- ORDER BY cmd, policyname;
--
-- Expected result: 
-- - rowsecurity = true
-- - Four policies: SELECT, INSERT, UPDATE, DELETE for 'authenticated' role

-- ============================================================================
-- NOTES
-- ============================================================================
-- Security model:
-- - Users can only access their own wearables data (based on user_id matching auth.uid())
-- - Admins have full access to all data
-- - Auth functions wrapped in subqueries to prevent per-row re-evaluation (performance optimization)
--
-- The user_id column is VARCHAR(255), so we cast auth.uid() (UUID) to text for comparison.
-- This matches the pattern used in other migrations (e.g., analytics_events).




-- ============================================================================
-- Migration: 035_enable_rls_remaining_tables.sql
-- Type: database
-- ============================================================================

-- Migration: Enable Row Level Security on remaining public tables
-- Created: 2024-12-19
--
-- Issue: Multiple tables are public but RLS has not been enabled:
--   - public.supplement_protocols
--   - public.training_analytics
--   - public.user_behavior
--
-- Solution: Enable RLS and create policies to ensure users can only access their own data.

-- ============================================================================
-- STEP 1: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.supplement_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create RLS Policies for supplement_protocols
-- ============================================================================
-- Note: supplement_protocols.user_id is UUID, so we can use auth.uid() directly

-- Policy for SELECT: Users can view their own supplement protocols
CREATE POLICY supplement_protocols_select_policy
ON public.supplement_protocols
FOR SELECT
TO authenticated
USING (
  -- Regular users can view their own protocols
  user_id = (SELECT auth.uid())
  OR
  -- Admins can view all protocols
  (SELECT auth.role()) = 'admin'
);

-- Policy for INSERT: Users can insert their own supplement protocols
CREATE POLICY supplement_protocols_insert_policy
ON public.supplement_protocols
FOR INSERT
TO authenticated
WITH CHECK (
  -- Regular users can insert their own protocols
  user_id = (SELECT auth.uid())
  OR
  -- Admins can insert any protocols
  (SELECT auth.role()) = 'admin'
);

-- Policy for UPDATE: Users can update their own supplement protocols
CREATE POLICY supplement_protocols_update_policy
ON public.supplement_protocols
FOR UPDATE
TO authenticated
USING (
  -- Regular users can update their own protocols
  user_id = (SELECT auth.uid())
  OR
  -- Admins can update any protocols
  (SELECT auth.role()) = 'admin'
)
WITH CHECK (
  -- Same check for the new values
  user_id = (SELECT auth.uid())
  OR
  (SELECT auth.role()) = 'admin'
);

-- Policy for DELETE: Users can delete their own supplement protocols
CREATE POLICY supplement_protocols_delete_policy
ON public.supplement_protocols
FOR DELETE
TO authenticated
USING (
  -- Regular users can delete their own protocols
  user_id = (SELECT auth.uid())
  OR
  -- Admins can delete any protocols
  (SELECT auth.role()) = 'admin'
);

-- ============================================================================
-- STEP 3: Create RLS Policies for training_analytics
-- ============================================================================
-- Note: training_analytics.user_id is VARCHAR(255), so we cast auth.uid() to text

-- Policy for SELECT: Users can view their own training analytics
CREATE POLICY training_analytics_select_policy
ON public.training_analytics
FOR SELECT
TO authenticated
USING (
  -- Regular users can view their own analytics
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can view all analytics
  (SELECT auth.role()) = 'admin'
);

-- Policy for INSERT: Users can insert their own training analytics
CREATE POLICY training_analytics_insert_policy
ON public.training_analytics
FOR INSERT
TO authenticated
WITH CHECK (
  -- Regular users can insert their own analytics
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can insert any analytics
  (SELECT auth.role()) = 'admin'
);

-- Policy for UPDATE: Users can update their own training analytics
CREATE POLICY training_analytics_update_policy
ON public.training_analytics
FOR UPDATE
TO authenticated
USING (
  -- Regular users can update their own analytics
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can update any analytics
  (SELECT auth.role()) = 'admin'
)
WITH CHECK (
  -- Same check for the new values
  user_id = (SELECT auth.uid())::text
  OR
  (SELECT auth.role()) = 'admin'
);

-- Policy for DELETE: Users can delete their own training analytics
CREATE POLICY training_analytics_delete_policy
ON public.training_analytics
FOR DELETE
TO authenticated
USING (
  -- Regular users can delete their own analytics
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can delete any analytics
  (SELECT auth.role()) = 'admin'
);

-- ============================================================================
-- STEP 4: Create RLS Policies for user_behavior
-- ============================================================================
-- Note: user_behavior.user_id is VARCHAR(255), so we cast auth.uid() to text

-- Policy for SELECT: Users can view their own behavior data
CREATE POLICY user_behavior_select_policy
ON public.user_behavior
FOR SELECT
TO authenticated
USING (
  -- Regular users can view their own behavior data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can view all behavior data
  (SELECT auth.role()) = 'admin'
);

-- Policy for INSERT: Users can insert their own behavior data
CREATE POLICY user_behavior_insert_policy
ON public.user_behavior
FOR INSERT
TO authenticated
WITH CHECK (
  -- Regular users can insert their own behavior data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can insert any behavior data
  (SELECT auth.role()) = 'admin'
);

-- Policy for UPDATE: Users can update their own behavior data
CREATE POLICY user_behavior_update_policy
ON public.user_behavior
FOR UPDATE
TO authenticated
USING (
  -- Regular users can update their own behavior data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can update any behavior data
  (SELECT auth.role()) = 'admin'
)
WITH CHECK (
  -- Same check for the new values
  user_id = (SELECT auth.uid())::text
  OR
  (SELECT auth.role()) = 'admin'
);

-- Policy for DELETE: Users can delete their own behavior data
CREATE POLICY user_behavior_delete_policy
ON public.user_behavior
FOR DELETE
TO authenticated
USING (
  -- Regular users can delete their own behavior data
  user_id = (SELECT auth.uid())::text
  OR
  -- Admins can delete any behavior data
  (SELECT auth.role()) = 'admin'
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify RLS is enabled and policies are created:
-- 
-- -- Check RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' 
--   AND tablename IN ('supplement_protocols', 'training_analytics', 'user_behavior')
-- ORDER BY tablename;
--
-- -- Check policies
-- SELECT 
--     tablename,
--     policyname,
--     cmd as action,
--     roles,
--     permissive
-- FROM pg_policies
-- WHERE tablename IN ('supplement_protocols', 'training_analytics', 'user_behavior')
-- ORDER BY tablename, cmd, policyname;
--
-- Expected result: 
-- - rowsecurity = true for all three tables
-- - Four policies per table: SELECT, INSERT, UPDATE, DELETE for 'authenticated' role

-- ============================================================================
-- NOTES
-- ============================================================================
-- Security model:
-- - Users can only access their own data (based on user_id matching auth.uid())
-- - Admins have full access to all data
-- - Auth functions wrapped in subqueries to prevent per-row re-evaluation (performance optimization)
--
-- Data type handling:
-- - supplement_protocols.user_id is UUID, so we use auth.uid() directly
-- - training_analytics.user_id and user_behavior.user_id are VARCHAR(255), 
--   so we cast auth.uid() to text for comparison




-- ============================================================================
-- Migration: 036_add_rls_policies_users_implementation_steps.sql
-- Type: database
-- ============================================================================

-- Migration: Add RLS Policies for users and implementation_steps tables
-- Created: 2024-12-19
--
-- Issue: Tables `public.users` and `public.implementation_steps` have RLS enabled,
-- but no policies exist. This causes the Supabase linter to flag them as security issues.
--
-- Solution: Create appropriate RLS policies to ensure users can only access their own data.

-- ============================================================================
-- STEP 1: Drop existing policies if they exist (to avoid conflicts)
-- ============================================================================

-- Drop any existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

-- Drop any existing policies on implementation_steps table
DROP POLICY IF EXISTS "Users can view own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can insert own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can update own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can delete own implementation steps" ON public.implementation_steps;

-- ============================================================================
-- STEP 2: Create RLS Policies for users table
-- ============================================================================
-- Note: users.id is UUID, so we can use auth.uid() directly

-- Policy for SELECT: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (
  -- Users can view their own profile
  id = auth.uid()
);

-- Policy for SELECT: Users can view public profile information of other users
-- This allows team features and public profiles to work
CREATE POLICY "Users can view public profiles"
ON public.users
FOR SELECT
TO authenticated
USING (
  -- Allow viewing basic public information (name, avatar, etc.)
  -- This is useful for team rosters and public profiles
  true
);

-- Policy for INSERT: Users can create their own profile
-- Note: This is typically handled during registration, but included for completeness
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can only create profiles with their own ID
  id = auth.uid()
);

-- Policy for UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (
  -- Users can only update their own profile
  id = auth.uid()
)
WITH CHECK (
  -- Ensure they can only update their own profile
  id = auth.uid()
);

-- Policy for DELETE: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.users
FOR DELETE
TO authenticated
USING (
  -- Users can only delete their own profile
  id = auth.uid()
);

-- ============================================================================
-- STEP 3: Create RLS Policies for implementation_steps table
-- ============================================================================
-- Note: implementation_steps.user_id is UUID, so we can use auth.uid() directly

-- Policy for SELECT: Users can view their own implementation steps
CREATE POLICY "Users can view own implementation steps"
ON public.implementation_steps
FOR SELECT
TO authenticated
USING (
  -- Users can only view their own implementation steps
  user_id = auth.uid()
);

-- Policy for INSERT: Users can create their own implementation steps
CREATE POLICY "Users can insert own implementation steps"
ON public.implementation_steps
FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can only create implementation steps for themselves
  user_id = auth.uid()
);

-- Policy for UPDATE: Users can update their own implementation steps
CREATE POLICY "Users can update own implementation steps"
ON public.implementation_steps
FOR UPDATE
TO authenticated
USING (
  -- Users can only update their own implementation steps
  user_id = auth.uid()
)
WITH CHECK (
  -- Ensure they can only update their own implementation steps
  user_id = auth.uid()
);

-- Policy for DELETE: Users can delete their own implementation steps
CREATE POLICY "Users can delete own implementation steps"
ON public.implementation_steps
FOR DELETE
TO authenticated
USING (
  -- Users can only delete their own implementation steps
  user_id = auth.uid()
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify policies were created:

-- Check policies on users table
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'users'
-- ORDER BY policyname;

-- Check policies on implementation_steps table
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'implementation_steps'
-- ORDER BY policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
/*
1. RLS policies are now in place for both tables
2. Users can only access their own data by default
3. The users table allows public profile viewing for team/community features
4. All policies use auth.uid() which requires authenticated users
5. The service role (used by backend) bypasses RLS for admin operations

To test:
1. Create test users in Supabase Auth
2. Try accessing data from different users
3. Verify users can only see/modify their own data
4. Verify users can view public profiles of other users
*/



-- ============================================================================
-- Migration: 037_fix_users_insert_policy_registration.sql
-- Type: database
-- ============================================================================

-- Migration: Fix users table INSERT policy to allow registration
-- Created: 2024-12-19
--
-- Issue: The RLS policy "Users can insert own profile" requires TO authenticated
--        and WITH CHECK (id = auth.uid()). This blocks registration because:
--        1. Users aren't authenticated during registration
--        2. The service role should bypass RLS, but we need explicit policy
--
-- Solution: Add a policy that allows service role to insert users during registration
--           This allows the Netlify function (using service key) to create users

-- ============================================================================
-- STEP 1: Drop existing policies if they exist (to avoid conflicts)
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- ============================================================================
-- STEP 2: Create new INSERT policies
-- ============================================================================

-- Policy 1: Allow service role to insert users (for registration via Netlify Functions)
-- This allows the backend service using SUPABASE_SERVICE_KEY to create users
CREATE POLICY "Service role can insert users"
ON public.users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy 2: Allow authenticated users to insert their own profile
-- This is for completeness, though registration typically happens via service role
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify policies were created:
-- 
-- SELECT 
--     schemaname, 
--     tablename, 
--     policyname, 
--     cmd,
--     roles
-- FROM pg_policies
-- WHERE schemaname = 'public' 
--   AND tablename = 'users'
--   AND cmd = 'INSERT'
-- ORDER BY policyname;
--
-- Expected result: 
-- - Two INSERT policies: one for service_role, one for authenticated

-- ============================================================================
-- NOTES
-- ============================================================================
-- Security model:
-- - Service role (used by Netlify Functions) can insert any user during registration
-- - Authenticated users can only insert their own profile (id = auth.uid())
-- - This allows registration to work while maintaining security for authenticated users




-- ============================================================================
-- Migration: 037a_notifications_unification.sql
-- Type: database
-- ============================================================================

-- Migration: Notifications Unification
-- Adds notification categories, preferences, and last_opened_at tracking

-- 1. Create notification_type enum
DO $$ BEGIN
    CREATE TYPE notification_type_enum AS ENUM (
        'training',
        'achievement',
        'team',
        'wellness',
        'general',
        'game',
        'tournament',
        'injury_risk',
        'weather'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add last_opened_at to users table (if not exists)
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_last_opened_at TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 3. Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    notification_type notification_type_enum NOT NULL,
    muted BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- 4. Add updated_at to notifications table if not exists
DO $$ BEGIN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 5. Update notification_type column to use enum (if possible, otherwise keep VARCHAR)
-- Note: We'll keep VARCHAR for now to avoid breaking existing data
-- The enum is available for validation in application code

-- 6. Add index for user_notification_preferences
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id 
    ON user_notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_type 
    ON user_notification_preferences(notification_type);

-- 7. Add index for notifications on notification_type
CREATE INDEX IF NOT EXISTS idx_notifications_type 
    ON notifications(notification_type);

-- 8. Add index for notifications on created_at (for last_opened_at filtering)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
    ON notifications(user_id, created_at DESC);

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_notification_updated_at ON notifications;
CREATE TRIGGER trigger_notification_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

-- 11. Create function to update user_notification_preferences updated_at
CREATE OR REPLACE FUNCTION update_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for preferences updated_at
DROP TRIGGER IF EXISTS trigger_preferences_updated_at ON user_notification_preferences;
CREATE TRIGGER trigger_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_preferences_updated_at();

-- 13. Insert default preferences for existing users (all types enabled)
INSERT INTO user_notification_preferences (user_id, notification_type, muted, push_enabled, in_app_enabled)
SELECT DISTINCT 
    u.id::text,
    unnest(ARRAY[
        'training'::notification_type_enum,
        'achievement'::notification_type_enum,
        'team'::notification_type_enum,
        'wellness'::notification_type_enum,
        'general'::notification_type_enum,
        'game'::notification_type_enum,
        'tournament'::notification_type_enum,
        'injury_risk'::notification_type_enum,
        'weather'::notification_type_enum
    ]),
    false,
    true,
    true
FROM users u
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- 14. Add RLS policies for user_notification_preferences
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can read their own notification preferences"
    ON user_notification_preferences
    FOR SELECT
    USING (user_id = (SELECT auth.uid())::text);

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences"
    ON user_notification_preferences
    FOR UPDATE
    USING (user_id = (SELECT auth.uid())::text)
    WITH CHECK (user_id = (SELECT auth.uid())::text);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences"
    ON user_notification_preferences
    FOR INSERT
    WITH CHECK (user_id = (SELECT auth.uid())::text);




-- ============================================================================
-- Migration: 038_add_username_and_verification_fields.sql
-- Type: database
-- ============================================================================

-- Migration: Add username field and email verification fields
-- Description: Adds unique username and email verification tokens
-- Created: 2024-12-06

-- Add username column if it doesn't exist (unique)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
        CREATE INDEX idx_users_username ON users(username);

        -- Optionally, populate username from email for existing users
        UPDATE users SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL;
    END IF;
END $$;

-- Add email verification columns if they don't exist
DO $$
BEGIN
    -- Add verification_token column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'verification_token'
    ) THEN
        ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
        CREATE INDEX idx_users_verification_token ON users(verification_token);
    END IF;

    -- Add verification_token_expires_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'verification_token_expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN verification_token_expires_at TIMESTAMP;
    END IF;

    -- Ensure email_verified exists (should already exist from base migration)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add role column if it doesn't exist (for player, coach, admin roles)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'coach', 'admin'));
        CREATE INDEX idx_users_role ON users(role);
    END IF;
END $$;

-- Add comment explaining the schema
COMMENT ON COLUMN users.username IS 'Unique username for the user (optional, can be NULL)';
COMMENT ON COLUMN users.email IS 'Unique email address for login and verification';
COMMENT ON COLUMN users.verification_token IS 'Token for email verification';
COMMENT ON COLUMN users.verification_token_expires_at IS 'Expiration time for verification token';
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email';
COMMENT ON COLUMN users.role IS 'User role: player, coach, or admin';



-- ============================================================================
-- Migration: 039_chatbot_role_aware_system.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- CHATBOT ROLE-AWARE SYSTEM
-- Migration: 039_chatbot_role_aware_system.sql
-- Purpose: Enable role-aware chatbot responses and team type differentiation
-- Created: 2025-01-XX
-- =============================================================================

-- =============================================================================
-- TEAM TYPE FIELDS
-- Add fields to distinguish domestic vs international teams
-- =============================================================================

-- Add team type and region fields to teams table
DO $$
BEGIN
    -- Add team_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'teams' AND column_name = 'team_type'
    ) THEN
        ALTER TABLE teams ADD COLUMN team_type VARCHAR(20) DEFAULT 'domestic' 
            CHECK (team_type IN ('domestic', 'international'));
        COMMENT ON COLUMN teams.team_type IS 'Team type: domestic (local/regional) or international (competes internationally)';
    END IF;

    -- Add region column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'teams' AND column_name = 'region'
    ) THEN
        ALTER TABLE teams ADD COLUMN region VARCHAR(100);
        COMMENT ON COLUMN teams.region IS 'Geographic region or country for the team';
    END IF;

    -- Add country_code column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'teams' AND column_name = 'country_code'
    ) THEN
        ALTER TABLE teams ADD COLUMN country_code VARCHAR(3);
        COMMENT ON COLUMN teams.country_code IS 'ISO 3166-1 alpha-3 country code (e.g., USA, CAN, GBR)';
    END IF;
END $$;

-- Create indexes for team type queries
CREATE INDEX IF NOT EXISTS idx_teams_type ON teams(team_type);
CREATE INDEX IF NOT EXISTS idx_teams_region ON teams(region);
CREATE INDEX IF NOT EXISTS idx_teams_country ON teams(country_code);

-- =============================================================================
-- CHATBOT USER CONTEXT TABLE
-- Store user context for chatbot personalization
-- =============================================================================

CREATE TABLE IF NOT EXISTS chatbot_user_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Role and team context
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('player', 'coach', 'admin')),
    primary_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team_type VARCHAR(20), -- 'domestic', 'international' (denormalized from teams)
    
    -- Personalization preferences
    preferred_topics TEXT[], -- Topics user frequently asks about
    expertise_level VARCHAR(20) DEFAULT 'intermediate' CHECK (expertise_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Usage statistics
    total_queries INTEGER DEFAULT 0,
    last_query_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatbot_context_user ON chatbot_user_context(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_role ON chatbot_user_context(user_role);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_team ON chatbot_user_context(primary_team_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_team_type ON chatbot_user_context(team_type);

-- Add update timestamp trigger
CREATE TRIGGER update_chatbot_context_updated_at
BEFORE UPDATE ON chatbot_user_context
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE chatbot_user_context IS 'Stores user context for chatbot personalization including role, team type, and preferences';
COMMENT ON COLUMN chatbot_user_context.user_role IS 'User role: player (athlete), coach, or admin';
COMMENT ON COLUMN chatbot_user_context.team_type IS 'Team type: domestic (local/regional) or international (competes internationally)';
COMMENT ON COLUMN chatbot_user_context.preferred_topics IS 'Array of topics the user frequently asks about (e.g., nutrition, recovery, training)';
COMMENT ON COLUMN chatbot_user_context.expertise_level IS 'User expertise level for tailoring response complexity';

-- =============================================================================
-- FUNCTION: Get or create chatbot context
-- Automatically creates context if it doesn't exist
-- =============================================================================

CREATE OR REPLACE FUNCTION get_or_create_chatbot_context(p_user_id UUID)
RETURNS chatbot_user_context AS $$
DECLARE
    v_context chatbot_user_context;
    v_user_role VARCHAR(20);
    v_primary_team_id UUID;
    v_team_type VARCHAR(20);
BEGIN
    -- Get user role
    SELECT role INTO v_user_role
    FROM users
    WHERE id = p_user_id;
    
    IF v_user_role IS NULL THEN
        v_user_role := 'player'; -- Default role
    END IF;
    
    -- Get primary team (most recent active team membership)
    SELECT tm.team_id, t.team_type INTO v_primary_team_id, v_team_type
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.user_id = p_user_id
      AND tm.status = 'active'
    ORDER BY tm.joined_at DESC
    LIMIT 1;
    
    -- Get or create context
    SELECT * INTO v_context
    FROM chatbot_user_context
    WHERE user_id = p_user_id;
    
    IF v_context IS NULL THEN
        -- Create new context
        INSERT INTO chatbot_user_context (
            user_id,
            user_role,
            primary_team_id,
            team_type
        ) VALUES (
            p_user_id,
            v_user_role,
            v_primary_team_id,
            COALESCE(v_team_type, 'domestic')
        )
        RETURNING * INTO v_context;
    ELSE
        -- Update existing context if role or team changed
        IF v_context.user_role != v_user_role OR 
           v_context.primary_team_id IS DISTINCT FROM v_primary_team_id OR
           v_context.team_type IS DISTINCT FROM v_team_type THEN
            UPDATE chatbot_user_context
            SET user_role = v_user_role,
                primary_team_id = v_primary_team_id,
                team_type = COALESCE(v_team_type, 'domestic'),
                updated_at = NOW()
            WHERE user_id = p_user_id
            RETURNING * INTO v_context;
        END IF;
    END IF;
    
    RETURN v_context;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_or_create_chatbot_context IS 'Gets or creates chatbot context for a user, automatically syncing role and team info';

-- =============================================================================
-- FUNCTION: Update chatbot query statistics
-- Tracks chatbot usage for analytics
-- =============================================================================

CREATE OR REPLACE FUNCTION update_chatbot_query_stats(p_user_id UUID, p_topic VARCHAR(100) DEFAULT NULL)
RETURNS void AS $$
BEGIN
    UPDATE chatbot_user_context
    SET total_queries = total_queries + 1,
        last_query_at = NOW(),
        preferred_topics = CASE
            WHEN p_topic IS NOT NULL AND NOT (p_topic = ANY(preferred_topics))
            THEN array_append(COALESCE(preferred_topics, ARRAY[]::TEXT[]), p_topic)
            ELSE preferred_topics
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Create context if it doesn't exist
    IF NOT FOUND THEN
        PERFORM get_or_create_chatbot_context(p_user_id);
        UPDATE chatbot_user_context
        SET total_queries = 1,
            last_query_at = NOW(),
            preferred_topics = CASE
                WHEN p_topic IS NOT NULL THEN ARRAY[p_topic]
                ELSE ARRAY[]::TEXT[]
            END,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_chatbot_query_stats IS 'Updates chatbot usage statistics and tracks preferred topics';




-- ============================================================================
-- Migration: 040_knowledge_base_governance.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- KNOWLEDGE BASE GOVERNANCE SYSTEM
-- Migration: 040_knowledge_base_governance.sql
-- Purpose: Add governance fields for evidence-based knowledge base approval and quality control
-- Created: 2025-01-XX
-- =============================================================================

-- =============================================================================
-- ADD GOVERNANCE FIELDS TO KNOWLEDGE_BASE_ENTRIES
-- =============================================================================

DO $$
BEGIN
    -- Add approval_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending' 
            CHECK (approval_status IN ('pending', 'approved', 'rejected', 'experimental'));
        COMMENT ON COLUMN knowledge_base_entries.approval_status IS 'Approval status: pending (awaiting review), approved (league-approved), rejected (not suitable), experimental (emerging research)';
    END IF;

    -- Add approval_level column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'approval_level'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN approval_level VARCHAR(20) DEFAULT 'research' 
            CHECK (approval_level IN ('league', 'coach', 'research', 'experimental'));
        COMMENT ON COLUMN knowledge_base_entries.approval_level IS 'Approval level: league (official guidelines), coach (coach-reviewed), research (research-based), experimental (experimental protocol)';
    END IF;

    -- Add approved_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN approved_by UUID REFERENCES users(id);
        COMMENT ON COLUMN knowledge_base_entries.approved_by IS 'User ID of the admin/coach who approved this entry';
    END IF;

    -- Add approved_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN approved_at TIMESTAMP;
        COMMENT ON COLUMN knowledge_base_entries.approved_at IS 'Timestamp when this entry was approved';
    END IF;

    -- Add approval_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'approval_notes'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN approval_notes TEXT;
        COMMENT ON COLUMN knowledge_base_entries.approval_notes IS 'Notes from the approver about why this entry was approved/rejected';
    END IF;

    -- Add research_source_ids column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'research_source_ids'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN research_source_ids UUID[];
        COMMENT ON COLUMN knowledge_base_entries.research_source_ids IS 'Array of research_articles IDs that support this entry (in addition to supporting_articles)';
    END IF;

    -- Add source_quality_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'source_quality_score'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN source_quality_score DECIMAL(3,2) CHECK (source_quality_score >= 0 AND source_quality_score <= 1);
        COMMENT ON COLUMN knowledge_base_entries.source_quality_score IS 'Quality score of sources (0.0 to 1.0) based on journal impact, study quality, etc.';
    END IF;
END $$;

-- Create indexes for governance queries
CREATE INDEX IF NOT EXISTS idx_kb_approval_status ON knowledge_base_entries(approval_status);
CREATE INDEX IF NOT EXISTS idx_kb_approval_level ON knowledge_base_entries(approval_level);
CREATE INDEX IF NOT EXISTS idx_kb_approved_by ON knowledge_base_entries(approved_by);
CREATE INDEX IF NOT EXISTS idx_kb_source_quality ON knowledge_base_entries(source_quality_score);
CREATE INDEX IF NOT EXISTS idx_kb_approval_status_level ON knowledge_base_entries(approval_status, approval_level);

-- =============================================================================
-- KNOWLEDGE BASE GOVERNANCE LOG TABLE
-- Track all approval/rejection actions for audit trail
-- =============================================================================

CREATE TABLE IF NOT EXISTS knowledge_base_governance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES knowledge_base_entries(id) ON DELETE CASCADE,
    
    -- Action details
    action VARCHAR(50) NOT NULL CHECK (action IN ('approved', 'rejected', 'flagged', 'updated', 'created', 'experimental')),
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    
    -- Status changes
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    previous_level VARCHAR(20),
    new_level VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for governance log queries
CREATE INDEX IF NOT EXISTS idx_gov_log_entry ON knowledge_base_governance_log(entry_id);
CREATE INDEX IF NOT EXISTS idx_gov_log_action ON knowledge_base_governance_log(action);
CREATE INDEX IF NOT EXISTS idx_gov_log_performed_by ON knowledge_base_governance_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_gov_log_created_at ON knowledge_base_governance_log(created_at DESC);

-- Comments
COMMENT ON TABLE knowledge_base_governance_log IS 'Audit trail for all knowledge base governance actions (approvals, rejections, updates)';
COMMENT ON COLUMN knowledge_base_governance_log.action IS 'Action performed: approved, rejected, flagged, updated, created, experimental';
COMMENT ON COLUMN knowledge_base_governance_log.previous_status IS 'Previous approval_status before the action';
COMMENT ON COLUMN knowledge_base_governance_log.new_status IS 'New approval_status after the action';

-- =============================================================================
-- FUNCTION: Calculate source quality score
-- Automatically calculates quality score based on supporting articles
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_source_quality_score(p_entry_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_score DECIMAL(3,2) := 0.0;
    v_article_count INTEGER := 0;
    v_total_score DECIMAL(5,2) := 0.0;
    v_article_record RECORD;
BEGIN
    -- Get supporting articles
    SELECT supporting_articles INTO v_article_count
    FROM knowledge_base_entries
    WHERE id = p_entry_id;
    
    -- If no articles, return 0
    IF v_article_count IS NULL OR array_length(v_article_count, 1) IS NULL THEN
        RETURN 0.0;
    END IF;
    
    -- Calculate average quality from articles
    FOR v_article_record IN
        SELECT 
            evidence_level,
            impact_factor,
            quality_score,
            study_type,
            sample_size
        FROM research_articles
        WHERE id = ANY((SELECT supporting_articles FROM knowledge_base_entries WHERE id = p_entry_id))
    LOOP
        -- Score based on evidence level (A=1.0, B=0.75, C=0.5, D=0.25)
        CASE v_article_record.evidence_level
            WHEN 'A' THEN v_total_score := v_total_score + 1.0;
            WHEN 'B' THEN v_total_score := v_total_score + 0.75;
            WHEN 'C' THEN v_total_score := v_total_score + 0.5;
            WHEN 'D' THEN v_total_score := v_total_score + 0.25;
            ELSE v_total_score := v_total_score + 0.5;
        END CASE;
        
        -- Bonus for high impact factor
        IF v_article_record.impact_factor IS NOT NULL AND v_article_record.impact_factor > 5 THEN
            v_total_score := v_total_score + 0.1;
        END IF;
        
        -- Bonus for large sample size
        IF v_article_record.sample_size IS NOT NULL AND v_article_record.sample_size > 100 THEN
            v_total_score := v_total_score + 0.1;
        END IF;
        
        -- Bonus for meta-analysis or systematic review
        IF v_article_record.study_type IN ('meta_analysis', 'systematic_review') THEN
            v_total_score := v_total_score + 0.15;
        END IF;
    END LOOP;
    
    -- Calculate average and cap at 1.0
    v_score := LEAST(v_total_score / array_length((SELECT supporting_articles FROM knowledge_base_entries WHERE id = p_entry_id), 1), 1.0);
    
    RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_source_quality_score IS 'Calculates quality score (0.0-1.0) based on supporting articles evidence levels, impact factors, and study types';

-- =============================================================================
-- FUNCTION: Log governance action
-- Automatically logs approval/rejection actions
-- =============================================================================

CREATE OR REPLACE FUNCTION log_governance_action(
    p_entry_id UUID,
    p_action VARCHAR(50),
    p_performed_by UUID,
    p_notes TEXT DEFAULT NULL,
    p_new_status VARCHAR(20) DEFAULT NULL,
    p_new_level VARCHAR(20) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_previous_status VARCHAR(20);
    v_previous_level VARCHAR(20);
BEGIN
    -- Get previous status and level
    SELECT approval_status, approval_level
    INTO v_previous_status, v_previous_level
    FROM knowledge_base_entries
    WHERE id = p_entry_id;
    
    -- Insert log entry
    INSERT INTO knowledge_base_governance_log (
        entry_id,
        action,
        performed_by,
        notes,
        previous_status,
        new_status,
        previous_level,
        new_level
    ) VALUES (
        p_entry_id,
        p_action,
        p_performed_by,
        p_notes,
        v_previous_status,
        COALESCE(p_new_status, v_previous_status),
        v_previous_level,
        COALESCE(p_new_level, v_previous_level)
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_governance_action IS 'Logs a governance action (approval, rejection, etc.) for audit trail';

-- =============================================================================
-- TRIGGER: Auto-update quality score when supporting articles change
-- =============================================================================

CREATE OR REPLACE FUNCTION update_quality_score_on_articles_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate quality score if supporting articles changed
    IF TG_OP = 'UPDATE' AND (
        OLD.supporting_articles IS DISTINCT FROM NEW.supporting_articles OR
        OLD.source_quality_score IS NULL
    ) THEN
        NEW.source_quality_score := calculate_source_quality_score(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quality_score
BEFORE UPDATE ON knowledge_base_entries
FOR EACH ROW
WHEN (OLD.supporting_articles IS DISTINCT FROM NEW.supporting_articles)
EXECUTE FUNCTION update_quality_score_on_articles_change();

-- =============================================================================
-- INITIAL DATA: Set default approval status for existing entries
-- =============================================================================

-- Set existing entries to 'approved' if they have strong evidence, otherwise 'pending'
UPDATE knowledge_base_entries
SET approval_status = CASE
    WHEN evidence_strength = 'strong' AND consensus_level = 'high' THEN 'approved'
    WHEN evidence_strength IN ('strong', 'moderate') THEN 'pending'
    ELSE 'experimental'
END,
approval_level = CASE
    WHEN evidence_strength = 'strong' AND consensus_level = 'high' THEN 'research'
    ELSE 'research'
END
WHERE approval_status IS NULL;

-- Calculate quality scores for existing entries
UPDATE knowledge_base_entries
SET source_quality_score = calculate_source_quality_score(id)
WHERE source_quality_score IS NULL AND supporting_articles IS NOT NULL;




-- ============================================================================
-- Migration: 041_player_stats_aggregation_view.sql
-- Type: database
-- ============================================================================

-- Migration: Player Statistics Aggregation View
-- Creates a centralized view and function for aggregating player statistics
-- Always filters data up to and including today's date

-- =============================================================================
-- VIEW: Player Statistics Aggregated (Up to Today)
-- Provides consistent, date-filtered player statistics across all games
-- =============================================================================

CREATE OR REPLACE VIEW player_stats_aggregated AS
WITH games_up_to_today AS (
    SELECT game_id, game_date, team_id, season
    FROM games
    WHERE game_date <= CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second'
),
player_plays AS (
    -- Get all plays where player is primary
    SELECT 
        ge.id,
        ge.game_id,
        ge.primary_player_id as player_id,
        ge.play_type,
        ge.play_result,
        ge.yards_gained,
        ge.yards_after_catch,
        ge.is_successful,
        ge.is_turnover,
        g.game_date,
        g.season
    FROM game_events ge
    INNER JOIN games_up_to_today g ON ge.game_id = g.game_id
    WHERE ge.primary_player_id IS NOT NULL
    
    UNION
    
    -- Get all plays where player is in secondary players
    SELECT 
        ge.id,
        ge.game_id,
        unnest(ge.secondary_player_ids) as player_id,
        ge.play_type,
        ge.play_result,
        ge.yards_gained,
        ge.yards_after_catch,
        ge.is_successful,
        ge.is_turnover,
        g.game_date,
        g.season
    FROM game_events ge
    INNER JOIN games_up_to_today g ON ge.game_id = g.game_id
    WHERE ge.secondary_player_ids IS NOT NULL AND array_length(ge.secondary_player_ids, 1) > 0
)
SELECT 
    pp.player_id,
    COUNT(DISTINCT pp.game_id) as games_played,
    COUNT(DISTINCT g.game_id) FILTER (WHERE g.game_date <= CURRENT_DATE) as total_games_available,
    
    -- Passing stats
    COUNT(*) FILTER (WHERE pp.play_type IN ('pass', 'throw')) as pass_attempts,
    COUNT(*) FILTER (WHERE pp.play_type IN ('pass', 'throw') AND pp.play_result = 'completion') as completions,
    COALESCE(SUM(pp.yards_gained) FILTER (WHERE pp.play_type IN ('pass', 'throw')), 0) as passing_yards,
    COUNT(*) FILTER (WHERE pp.play_type IN ('pass', 'throw') AND pp.play_result = 'touchdown') as passing_touchdowns,
    COUNT(*) FILTER (WHERE pp.play_type IN ('pass', 'throw') AND pp.play_result = 'interception') as interceptions,
    
    -- Receiving stats
    COUNT(*) FILTER (WHERE pp.play_type IN ('reception', 'catch') OR pp.play_result = 'completion') as targets,
    COUNT(*) FILTER (WHERE pp.play_result = 'completion') as receptions,
    COALESCE(SUM(pp.yards_gained) FILTER (WHERE pp.play_type IN ('reception', 'catch')), 0) as receiving_yards,
    COUNT(*) FILTER (WHERE pp.play_result = 'drop') as drops,
    COALESCE(SUM(pp.yards_after_catch), 0) as yards_after_catch,
    COUNT(*) FILTER (WHERE pp.play_type IN ('reception', 'catch') AND pp.play_result = 'touchdown') as receiving_touchdowns,
    
    -- Rushing stats
    COUNT(*) FILTER (WHERE pp.play_type IN ('run', 'rush')) as rushing_attempts,
    COALESCE(SUM(pp.yards_gained) FILTER (WHERE pp.play_type IN ('run', 'rush')), 0) as rushing_yards,
    COUNT(*) FILTER (WHERE pp.play_type IN ('run', 'rush') AND pp.play_result = 'touchdown') as rushing_touchdowns,
    
    -- Defensive stats
    COUNT(*) FILTER (WHERE pp.play_type IN ('flag_pull', 'tackle')) as flag_pull_attempts,
    COUNT(*) FILTER (WHERE pp.play_type IN ('flag_pull', 'tackle') AND (pp.play_result = 'flag_pull' OR pp.is_successful = true)) as flag_pulls,
    COUNT(*) FILTER (WHERE pp.play_type IN ('flag_pull', 'tackle') AND pp.is_successful = false) as missed_flag_pulls,
    COUNT(*) FILTER (WHERE pp.play_result = 'defended_pass') as defended_passes,
    COUNT(*) FILTER (WHERE pp.play_type = 'defense' AND pp.play_result = 'interception') as interceptions_def,
    
    -- Totals
    COUNT(*) as total_plays,
    COALESCE(SUM(pp.yards_gained), 0) as total_yards
    
FROM player_plays pp
LEFT JOIN games_up_to_today g ON pp.game_id = g.game_id
GROUP BY pp.player_id;

-- =============================================================================
-- FUNCTION: Get Player Aggregated Stats
-- Returns aggregated statistics for a player up to and including today
-- =============================================================================

CREATE OR REPLACE FUNCTION get_player_aggregated_stats(
    p_player_id VARCHAR(255),
    p_season VARCHAR(20) DEFAULT NULL,
    p_team_id VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
    player_id VARCHAR(255),
    games_played BIGINT,
    total_games_available BIGINT,
    pass_attempts BIGINT,
    completions BIGINT,
    passing_yards BIGINT,
    passing_touchdowns BIGINT,
    interceptions BIGINT,
    completion_percentage DECIMAL(5,2),
    avg_yards_per_attempt DECIMAL(4,2),
    targets BIGINT,
    receptions BIGINT,
    receiving_yards BIGINT,
    drops BIGINT,
    drop_rate DECIMAL(5,2),
    yards_after_catch BIGINT,
    receiving_touchdowns BIGINT,
    avg_yards_per_reception DECIMAL(4,2),
    rushing_attempts BIGINT,
    rushing_yards BIGINT,
    rushing_touchdowns BIGINT,
    yards_per_carry DECIMAL(4,2),
    flag_pull_attempts BIGINT,
    flag_pulls BIGINT,
    missed_flag_pulls BIGINT,
    flag_pull_success_rate DECIMAL(5,2),
    defended_passes BIGINT,
    interceptions_def BIGINT,
    total_plays BIGINT,
    total_yards BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psa.player_id,
        psa.games_played,
        psa.total_games_available,
        psa.pass_attempts,
        psa.completions,
        psa.passing_yards,
        psa.passing_touchdowns,
        psa.interceptions,
        CASE 
            WHEN psa.pass_attempts > 0 
            THEN ROUND((psa.completions::DECIMAL / psa.pass_attempts::DECIMAL) * 100, 1)
            ELSE 0
        END as completion_percentage,
        CASE 
            WHEN psa.pass_attempts > 0 
            THEN ROUND(psa.passing_yards::DECIMAL / psa.pass_attempts::DECIMAL, 2)
            ELSE 0
        END as avg_yards_per_attempt,
        psa.targets,
        psa.receptions,
        psa.receiving_yards,
        psa.drops,
        CASE 
            WHEN psa.targets > 0 
            THEN ROUND((psa.drops::DECIMAL / psa.targets::DECIMAL) * 100, 1)
            ELSE 0
        END as drop_rate,
        psa.yards_after_catch,
        psa.receiving_touchdowns,
        CASE 
            WHEN psa.receptions > 0 
            THEN ROUND(psa.receiving_yards::DECIMAL / psa.receptions::DECIMAL, 2)
            ELSE 0
        END as avg_yards_per_reception,
        psa.rushing_attempts,
        psa.rushing_yards,
        psa.rushing_touchdowns,
        CASE 
            WHEN psa.rushing_attempts > 0 
            THEN ROUND(psa.rushing_yards::DECIMAL / psa.rushing_attempts::DECIMAL, 2)
            ELSE 0
        END as yards_per_carry,
        psa.flag_pull_attempts,
        psa.flag_pulls,
        psa.missed_flag_pulls,
        CASE 
            WHEN psa.flag_pull_attempts > 0 
            THEN ROUND((psa.flag_pulls::DECIMAL / psa.flag_pull_attempts::DECIMAL) * 100, 1)
            ELSE 0
        END as flag_pull_success_rate,
        psa.defended_passes,
        psa.interceptions_def,
        psa.total_plays,
        psa.total_yards
    FROM player_stats_aggregated psa
    WHERE psa.player_id = p_player_id
        AND (p_season IS NULL OR EXISTS (
            SELECT 1 FROM games g 
            WHERE g.game_id IN (
                SELECT DISTINCT game_id FROM game_events 
                WHERE primary_player_id = p_player_id 
                   OR p_player_id = ANY(secondary_player_ids)
            )
            AND g.season = p_season
            AND g.game_date <= CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second'
        ))
        AND (p_team_id IS NULL OR EXISTS (
            SELECT 1 FROM games g 
            WHERE g.team_id = p_team_id
            AND g.game_id IN (
                SELECT DISTINCT game_id FROM game_events 
                WHERE primary_player_id = p_player_id 
                   OR p_player_id = ANY(secondary_player_ids)
            )
            AND g.game_date <= CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second'
        ));
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- INDEXES for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_game_events_primary_player_date 
ON game_events(primary_player_id, game_id) 
WHERE primary_player_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_games_date_team 
ON games(game_date, team_id);

CREATE INDEX IF NOT EXISTS idx_games_date_season 
ON games(game_date, season);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT ON player_stats_aggregated TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_aggregated_stats TO authenticated;



-- ============================================================================
-- Migration: 042_training_data_consistency.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- TRAINING DATA CONSISTENCY IMPROVEMENTS
-- Migration: 042_training_data_consistency.sql
-- Adds completed column and index for better date filtering and performance
-- =============================================================================

-- =============================================================================
-- 1. ADD COMPLETED COLUMN (OPTIONAL)
-- =============================================================================

DO $$
BEGIN
  -- Add completed boolean column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_sessions' AND column_name = 'completed'
  ) THEN
    ALTER TABLE training_sessions ADD COLUMN completed BOOLEAN DEFAULT true;
    COMMENT ON COLUMN training_sessions.completed IS 'Whether the training session has been completed. Defaults to true for backward compatibility.';
    
    -- Set default based on status if status column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'training_sessions' AND column_name = 'status'
    ) THEN
      UPDATE training_sessions 
      SET completed = CASE 
        WHEN status IN ('completed', 'done') THEN true
        WHEN status IN ('planned', 'scheduled', 'in_progress') THEN false
        ELSE true -- Default to completed for unknown statuses
      END
      WHERE completed IS NULL;
    END IF;
  END IF;
END $$;

-- =============================================================================
-- 2. ADD INDEX ON (user_id, session_date) FOR PERFORMANCE
-- =============================================================================

-- Index for filtering by user and date (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date 
ON training_sessions(user_id, session_date DESC);

-- Index for date-only queries (when filtering to today)
CREATE INDEX IF NOT EXISTS idx_training_sessions_date 
ON training_sessions(session_date DESC);

-- Index for completed status filtering
CREATE INDEX IF NOT EXISTS idx_training_sessions_completed 
ON training_sessions(completed) 
WHERE completed = true;

-- Composite index for user + date + completed
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_date_completed 
ON training_sessions(user_id, session_date DESC, completed) 
WHERE completed = true;

-- =============================================================================
-- 3. CREATE DATABASE VIEW FOR COMPLETED SESSIONS
-- =============================================================================

CREATE OR REPLACE VIEW completed_training_sessions AS
SELECT 
  id,
  user_id,
  session_date,
  session_type,
  duration_minutes,
  rpe,
  intensity_level,
  status,
  completed,
  notes,
  created_at,
  updated_at
FROM training_sessions
WHERE (completed = true OR (completed IS NULL AND session_date <= CURRENT_DATE))
  AND session_date <= CURRENT_DATE;

COMMENT ON VIEW completed_training_sessions IS 'View of training sessions that are completed and up to and including today. Used for consistent statistics calculations.';

-- =============================================================================
-- 4. CREATE FUNCTION TO GET TODAY'S DATE (FOR CONSISTENCY)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_today_date()
RETURNS DATE
LANGUAGE sql
STABLE
AS $$
  SELECT CURRENT_DATE;
$$;

COMMENT ON FUNCTION get_today_date() IS 'Returns today''s date for consistent date filtering across queries';

-- =============================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE training_sessions IS 'Stores all training sessions. Use completed_training_sessions view for statistics that should only include completed sessions up to today.';
COMMENT ON COLUMN training_sessions.session_date IS 'Date of the training session. Sessions with date > CURRENT_DATE are considered future/planned sessions.';
COMMENT ON COLUMN training_sessions.completed IS 'Whether the session has been completed. Defaults to true. Future sessions should have completed = false.';



-- ============================================================================
-- Migration: 043_database_upgrade_consistency.sql
-- Type: database
-- ============================================================================

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




-- ============================================================================
-- Migration: 044_fix_rls_performance_and_consolidate_policies.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- MIGRATION: Fix RLS Performance and Consolidate Policies
-- Migration: 044_fix_rls_performance_and_consolidate_policies.sql
-- Purpose: Fix Supabase linter warnings for RLS performance and duplicate policies
-- Created: 2025-01-XX
-- =============================================================================
--
-- This migration fixes:
-- 1. auth_rls_initplan warnings: Wrap auth.uid() and auth.user_id() calls in (SELECT ...)
-- 2. multiple_permissive_policies warnings: Consolidate duplicate policies
-- 3. duplicate_index warnings: Remove duplicate indexes
--
-- =============================================================================

-- =============================================================================
-- PART 1: Fix auth_rls_initplan warnings - Wrap auth functions in (SELECT ...)
-- =============================================================================

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own profile"
ON public.users FOR DELETE
USING (id = (SELECT auth.uid()));

-- IMPLEMENTATION STEPS POLICIES
DROP POLICY IF EXISTS "Users can view own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can insert own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can update own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can delete own implementation steps" ON public.implementation_steps;

CREATE POLICY "Users can view own implementation steps"
ON public.implementation_steps FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own implementation steps"
ON public.implementation_steps FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own implementation steps"
ON public.implementation_steps FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own implementation steps"
ON public.implementation_steps FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- WELLNESS LOGS POLICIES
DROP POLICY IF EXISTS wellness_logs_select_coach ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_update_admin ON public.wellness_logs;

CREATE POLICY wellness_logs_select_coach
ON public.wellness_logs FOR SELECT
USING (
  user_id IN (
    SELECT tm.user_id::text FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = (SELECT auth.uid()) AND coach.role IN ('coach', 'admin')
  )
  OR user_id = (SELECT auth.uid())::text
);

CREATE POLICY wellness_logs_update_admin
ON public.wellness_logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- FIXTURES POLICIES
DROP POLICY IF EXISTS fixtures_select_team_member ON public.fixtures;
DROP POLICY IF EXISTS fixtures_insert_team_member ON public.fixtures;
DROP POLICY IF EXISTS fixtures_update_team_member ON public.fixtures;
DROP POLICY IF EXISTS fixtures_delete_team_member ON public.fixtures;

CREATE POLICY fixtures_select_team_member
ON public.fixtures FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY fixtures_insert_team_member
ON public.fixtures FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY fixtures_update_team_member
ON public.fixtures FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY fixtures_delete_team_member
ON public.fixtures FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid())
  )
);

-- READINESS SCORES POLICIES
DROP POLICY IF EXISTS readiness_scores_select_athlete ON public.readiness_scores;
DROP POLICY IF EXISTS readiness_scores_insert_athlete ON public.readiness_scores;
DROP POLICY IF EXISTS readiness_scores_update_athlete ON public.readiness_scores;
DROP POLICY IF EXISTS readiness_scores_delete_admin ON public.readiness_scores;

CREATE POLICY readiness_scores_select_athlete
ON public.readiness_scores FOR SELECT
USING (athlete_id = (SELECT auth.uid()));

CREATE POLICY readiness_scores_insert_athlete
ON public.readiness_scores FOR INSERT
WITH CHECK (athlete_id = (SELECT auth.uid()));

CREATE POLICY readiness_scores_update_athlete
ON public.readiness_scores FOR UPDATE
USING (athlete_id = (SELECT auth.uid()))
WITH CHECK (athlete_id = (SELECT auth.uid()));

CREATE POLICY readiness_scores_delete_admin
ON public.readiness_scores FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- TEAMS POLICIES
DROP POLICY IF EXISTS teams_coach_admin_all ON public.teams;

CREATE POLICY teams_coach_admin_all
ON public.teams FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
  OR id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
  OR id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
);

-- TRAINING SESSIONS POLICIES
DROP POLICY IF EXISTS training_sessions_coach_admin_team_all ON public.training_sessions;

CREATE POLICY training_sessions_coach_admin_team_all
ON public.training_sessions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
  OR team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
  OR team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
);

-- USER NOTIFICATION PREFERENCES POLICIES
DROP POLICY IF EXISTS "Users can read their own notification preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON public.user_notification_preferences;

CREATE POLICY "Users can read their own notification preferences"
ON public.user_notification_preferences FOR SELECT
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own notification preferences"
ON public.user_notification_preferences FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own notification preferences"
ON public.user_notification_preferences FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

-- USER TEAMS POLICIES
DROP POLICY IF EXISTS user_teams_coach_admin_all ON public.user_teams;
DROP POLICY IF EXISTS user_teams_manage_by_coach_insert ON public.user_teams;
DROP POLICY IF EXISTS user_teams_manage_by_coach_update ON public.user_teams;

CREATE POLICY user_teams_coach_admin_all
ON public.user_teams FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
);

CREATE POLICY user_teams_manage_by_coach_insert
ON public.user_teams FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
);

CREATE POLICY user_teams_manage_by_coach_update
ON public.user_teams FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM user_teams
    WHERE user_id = (SELECT auth.uid()) AND role IN ('admin', 'coach')
  )
);

-- CHATBOT USER CONTEXT POLICIES
DROP POLICY IF EXISTS chatbot_user_context_select_own_or_admin ON public.chatbot_user_context;
DROP POLICY IF EXISTS chatbot_user_context_update_own_or_admin ON public.chatbot_user_context;
DROP POLICY IF EXISTS chatbot_user_context_delete_own_or_admin ON public.chatbot_user_context;

CREATE POLICY chatbot_user_context_select_own_or_admin
ON public.chatbot_user_context FOR SELECT
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY chatbot_user_context_update_own_or_admin
ON public.chatbot_user_context FOR UPDATE
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY chatbot_user_context_delete_own_or_admin
ON public.chatbot_user_context FOR DELETE
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- =============================================================================
-- PART 2: Consolidate Multiple Permissive Policies
-- =============================================================================

-- ANALYTICS EVENTS: Consolidate multiple policies
-- Drop all existing policies first
DROP POLICY IF EXISTS analytics_events_admin_all ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_insert_authenticated ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_insert_own ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_policy ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_select_authenticated ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_select_own ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_update_own ON public.analytics_events;
DROP POLICY IF EXISTS analytics_events_delete_own ON public.analytics_events;

-- Single consolidated INSERT policy (replaces analytics_events_admin_all, analytics_events_insert_authenticated, analytics_events_insert_own, analytics_events_policy)
CREATE POLICY analytics_events_insert_consolidated
ON public.analytics_events FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Single consolidated SELECT policy (replaces analytics_events_admin_all, analytics_events_select_authenticated, analytics_events_select_own, analytics_events_policy)
CREATE POLICY analytics_events_select_consolidated
ON public.analytics_events FOR SELECT
USING (
  user_id = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Single consolidated UPDATE policy (replaces analytics_events_admin_all, analytics_events_update_own, analytics_events_policy)
CREATE POLICY analytics_events_update_consolidated
ON public.analytics_events FOR UPDATE
USING (
  user_id = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- Single consolidated DELETE policy (replaces analytics_events_admin_all, analytics_events_delete_own, analytics_events_policy)
CREATE POLICY analytics_events_delete_consolidated
ON public.analytics_events FOR DELETE
USING (
  user_id = (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
);

-- CHATBOT USER CONTEXT: Consolidate duplicate policies
DROP POLICY IF EXISTS chatbot_context_select_own ON public.chatbot_user_context;
DROP POLICY IF EXISTS chatbot_context_insert_own ON public.chatbot_user_context;
DROP POLICY IF EXISTS chatbot_context_update_own ON public.chatbot_user_context;
DROP POLICY IF EXISTS chatbot_context_delete_own ON public.chatbot_user_context;
DROP POLICY IF EXISTS chatbot_user_context_insert_own ON public.chatbot_user_context;

-- IMPLEMENTATION STEPS: Consolidate duplicate policies
DROP POLICY IF EXISTS implementation_steps_select_own ON public.implementation_steps;
DROP POLICY IF EXISTS implementation_steps_insert_own ON public.implementation_steps;
DROP POLICY IF EXISTS implementation_steps_update_own ON public.implementation_steps;
DROP POLICY IF EXISTS implementation_steps_delete_own ON public.implementation_steps;

-- NOTIFICATIONS: Consolidate duplicate policies
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;

-- PERFORMANCE METRICS: Consolidate duplicate policies
DROP POLICY IF EXISTS performance_metrics_select_own ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_insert_own ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_update_own ON public.performance_metrics;
DROP POLICY IF EXISTS performance_metrics_delete_own ON public.performance_metrics;

-- PERFORMANCE BENCHMARKS: Consolidate duplicate policies
DROP POLICY IF EXISTS performance_benchmarks_select_own ON public.performance_benchmarks;

-- READINESS SCORES: Consolidate duplicate policies
DROP POLICY IF EXISTS readiness_scores_select_own ON public.readiness_scores;
DROP POLICY IF EXISTS readiness_scores_insert_own ON public.readiness_scores;
DROP POLICY IF EXISTS readiness_scores_update_own ON public.readiness_scores;
DROP POLICY IF EXISTS readiness_scores_delete_own ON public.readiness_scores;

-- SPONSOR REWARDS: Consolidate duplicate policies
DROP POLICY IF EXISTS sponsor_rewards_select_own ON public.sponsor_rewards;

-- SUPPLEMENT PROTOCOLS: Consolidate duplicate policies
DROP POLICY IF EXISTS supplement_protocols_select_own ON public.supplement_protocols;
DROP POLICY IF EXISTS supplement_protocols_insert_own ON public.supplement_protocols;
DROP POLICY IF EXISTS supplement_protocols_update_own ON public.supplement_protocols;
DROP POLICY IF EXISTS supplement_protocols_delete_own ON public.supplement_protocols;

-- TEAM CHEMISTRY: Consolidate duplicate policies
DROP POLICY IF EXISTS team_chemistry_select_own ON public.team_chemistry;

-- TEAMS: Consolidate duplicate policies
DROP POLICY IF EXISTS teams_manage_by_owner ON public.teams;
DROP POLICY IF EXISTS teams_member_select ON public.teams;
DROP POLICY IF EXISTS teams_select_for_members ON public.teams;

-- TRAINING ANALYTICS: Consolidate duplicate policies
DROP POLICY IF EXISTS training_analytics_select_own ON public.training_analytics;
DROP POLICY IF EXISTS training_analytics_insert_own ON public.training_analytics;
DROP POLICY IF EXISTS training_analytics_update_own ON public.training_analytics;
DROP POLICY IF EXISTS training_analytics_delete_own ON public.training_analytics;

-- TRAINING SESSIONS: Consolidate duplicate policies
DROP POLICY IF EXISTS training_sessions_athlete_select ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_athlete_insert ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_athlete_update ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_athlete_delete ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_select_own ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_insert_own ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_update_own ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_delete_own ON public.training_sessions;
DROP POLICY IF EXISTS training_sessions_team_members_select ON public.training_sessions;

-- USER NOTIFICATION PREFERENCES: Consolidate duplicate policies
DROP POLICY IF EXISTS unp_select_own ON public.user_notification_preferences;
DROP POLICY IF EXISTS unp_update_own ON public.user_notification_preferences;
DROP POLICY IF EXISTS unp_insert_own ON public.user_notification_preferences;

-- USER TEAMS: Consolidate duplicate policies
DROP POLICY IF EXISTS user_teams_select_for_members ON public.user_teams;
DROP POLICY IF EXISTS user_teams_select_own ON public.user_teams;
DROP POLICY IF EXISTS user_teams_insert_own ON public.user_teams;
DROP POLICY IF EXISTS user_teams_update_own ON public.user_teams;
DROP POLICY IF EXISTS user_teams_delete_own ON public.user_teams;
DROP POLICY IF EXISTS user_teams_self_select ON public.user_teams;
DROP POLICY IF EXISTS user_teams_self_insert ON public.user_teams;
DROP POLICY IF EXISTS user_teams_self_update ON public.user_teams;
DROP POLICY IF EXISTS user_teams_self_delete ON public.user_teams;
DROP POLICY IF EXISTS user_teams_manage_by_owner_insert ON public.user_teams;
DROP POLICY IF EXISTS user_teams_manage_by_owner_update ON public.user_teams;
DROP POLICY IF EXISTS user_teams_manage_by_owner_delete ON public.user_teams;

-- USERS: Consolidate duplicate policies
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- WEARABLES DATA: Consolidate duplicate policies
DROP POLICY IF EXISTS wearables_data_select_own ON public.wearables_data;
DROP POLICY IF EXISTS wearables_data_insert_own ON public.wearables_data;