DROP POLICY IF EXISTS wearables_data_update_own ON public.wearables_data;
DROP POLICY IF EXISTS wearables_data_delete_own ON public.wearables_data;

-- WELLNESS LOGS: Consolidate duplicate policies
DROP POLICY IF EXISTS wellness_logs_select_athlete ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_select_own ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_insert_athlete ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_insert_own ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_update_athlete ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_update_own ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_delete_athlete ON public.wellness_logs;
DROP POLICY IF EXISTS wellness_logs_delete_own ON public.wellness_logs;

-- =============================================================================
-- PART 3: Remove Duplicate Indexes
-- =============================================================================

-- chatbot_user_context: Remove duplicate indexes
DROP INDEX IF EXISTS idx_chatbot_context_user;
-- Keep idx_chatbot_user_context_user_id

-- user_notification_preferences: Remove duplicate indexes
DROP INDEX IF EXISTS idx_unp_user_id;
-- Keep idx_user_notification_preferences_user_id

-- user_teams: Remove duplicate indexes
DROP INDEX IF EXISTS idx_user_teams_user;
-- Keep idx_user_teams_user_id

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check remaining policies (should show no duplicates for same role/action)
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd, policyname;

-- Check remaining indexes (should show no duplicates)
-- SELECT tablename, indexname
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;




-- ============================================================================
-- Migration: 045_add_missing_constraints.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- Migration: Add Missing Database Constraints
-- Version: 045
-- Date: 2025-01-21
-- Description: Adds critical constraints identified in technical review
-- =============================================================================

-- =============================================================================
-- 1. PROFILES TABLE CONSTRAINTS
-- =============================================================================

-- Add email_normalized column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email_normalized'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_normalized VARCHAR(255);
    
    -- Populate from existing email or auth.users
    UPDATE profiles p
    SET email_normalized = LOWER(TRIM(COALESCE(
      (SELECT email FROM auth.users WHERE id = p.user_id),
      ''
    )))
    WHERE email_normalized IS NULL;
    
    -- Make NOT NULL after population
    ALTER TABLE profiles ALTER COLUMN email_normalized SET NOT NULL;
  END IF;
END $$;

-- Add unique constraint on email_normalized
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_normalized 
ON profiles(email_normalized);

-- Add role_global check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'profiles_role_global_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_global_check 
    CHECK (role_global IN ('player', 'coach', 'admin'));
  END IF;
END $$;

-- =============================================================================
-- 2. TEAMS TABLE CONSTRAINTS
-- =============================================================================

-- Add unique constraint on team name (active teams only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_name_unique 
ON teams(LOWER(TRIM(name))) 
WHERE deleted_at IS NULL;

-- =============================================================================
-- 3. TEAM_MEMBERS TABLE CONSTRAINTS
-- =============================================================================

-- Add unique constraint on (team_id, user_id) for active members
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_unique 
ON team_members(team_id, user_id) 
WHERE deleted_at IS NULL;

-- Add role_team check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'team_members_role_team_check'
  ) THEN
    ALTER TABLE team_members ADD CONSTRAINT team_members_role_team_check 
    CHECK (role_team IN ('coach', 'assistant_coach', 'player'));
  END IF;
END $$;

-- Add status check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'team_members_status_check'
  ) THEN
    ALTER TABLE team_members ADD CONSTRAINT team_members_status_check 
    CHECK (status IN ('active', 'inactive', 'suspended'));
  END IF;
END $$;

-- =============================================================================
-- 4. TEAM_INVITATIONS TABLE CONSTRAINTS
-- =============================================================================

-- Ensure team_invitations table exists with required columns
DO $$
BEGIN
  -- Add email_normalized if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_invitations' AND column_name = 'email_normalized'
  ) THEN
    ALTER TABLE team_invitations ADD COLUMN email_normalized VARCHAR(255);
    
    -- Populate from existing email
    UPDATE team_invitations 
    SET email_normalized = LOWER(TRIM(email))
    WHERE email_normalized IS NULL;
    
    ALTER TABLE team_invitations ALTER COLUMN email_normalized SET NOT NULL;
  END IF;
  
  -- Add token_hash if it doesn't exist (rename from token if exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_invitations' AND column_name = 'token' 
    AND column_name != 'token_hash'
  ) THEN
    -- If token exists but token_hash doesn't, rename
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'team_invitations' AND column_name = 'token_hash'
    ) THEN
      ALTER TABLE team_invitations RENAME COLUMN token TO token_hash;
    END IF;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_invitations' AND column_name = 'token_hash'
  ) THEN
    ALTER TABLE team_invitations ADD COLUMN token_hash VARCHAR(255) NOT NULL UNIQUE;
  END IF;
END $$;

-- Add unique constraint on (team_id, email_normalized) where status = 'pending'
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_pending 
ON team_invitations(team_id, email_normalized) 
WHERE status = 'pending';

-- Add status check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'team_invitations_status_check'
  ) THEN
    ALTER TABLE team_invitations ADD CONSTRAINT team_invitations_status_check 
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'));
  END IF;
END $$;

-- =============================================================================
-- 5. TOURNAMENT_REGISTRATIONS TABLE CONSTRAINTS
-- =============================================================================

-- Add unique constraint on (tournament_id, team_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_registrations_unique 
ON tournament_registrations(tournament_id, team_id);

-- Add status check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'tournament_registrations_status_check'
  ) THEN
    ALTER TABLE tournament_registrations ADD CONSTRAINT tournament_registrations_status_check 
    CHECK (status IN ('registered', 'withdrawn', 'disqualified'));
  END IF;
END $$;

-- =============================================================================
-- 6. TRAINING_PROGRAMS TABLE CONSTRAINTS
-- =============================================================================

-- Add version column if it doesn't exist (for immutability tracking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_programs' AND column_name = 'version'
  ) THEN
    ALTER TABLE training_programs ADD COLUMN version INTEGER DEFAULT 1;
  END IF;
END $$;

-- Add check constraint for end_date > start_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'training_programs_dates_check'
  ) THEN
    ALTER TABLE training_programs ADD CONSTRAINT training_programs_dates_check 
    CHECK (end_date > start_date);
  END IF;
END $$;

-- =============================================================================
-- 7. PROGRAM_ASSIGNMENTS TABLE CONSTRAINTS
-- =============================================================================

-- Ensure program_assignments table exists
CREATE TABLE IF NOT EXISTS program_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE RESTRICT,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_from DATE NOT NULL,
  active_to DATE CHECK (active_to IS NULL OR active_to > active_from),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint on active assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_assignments_active 
ON program_assignments(player_id, program_id) 
WHERE status = 'active' AND (active_to IS NULL OR active_to >= CURRENT_DATE);

-- =============================================================================
-- 8. LOAD_DAILY TABLE CONSTRAINTS
-- =============================================================================

-- Ensure load_daily table exists
CREATE TABLE IF NOT EXISTS load_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_load INTEGER NOT NULL CHECK (daily_load >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint on (player_id, date)
CREATE UNIQUE INDEX IF NOT EXISTS idx_load_daily_unique 
ON load_daily(player_id, date);

-- =============================================================================
-- 9. LOAD_METRICS TABLE CONSTRAINTS
-- =============================================================================

-- Ensure load_metrics table exists with required columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'load_metrics' AND column_name = 'baseline_days'
  ) THEN
    ALTER TABLE load_metrics ADD COLUMN baseline_days INTEGER 
    CHECK (baseline_days >= 0 AND baseline_days <= 28);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'load_metrics' AND column_name = 'risk_level'
  ) THEN
    ALTER TABLE load_metrics ADD COLUMN risk_level VARCHAR(20) 
    CHECK (risk_level IN ('baseline_building', 'baseline_low', 'low', 'optimal', 'moderate', 'high'));
  END IF;
END $$;

-- Add unique constraint on (player_id, date)
CREATE UNIQUE INDEX IF NOT EXISTS idx_load_metrics_unique 
ON load_metrics(player_id, date);

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'load_metrics_baseline_days_check'
  ) THEN
    ALTER TABLE load_metrics ADD CONSTRAINT load_metrics_baseline_days_check 
    CHECK (baseline_days >= 0 AND baseline_days <= 28);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'load_metrics_risk_level_check'
  ) THEN
    ALTER TABLE load_metrics ADD CONSTRAINT load_metrics_risk_level_check 
    CHECK (risk_level IN ('baseline_building', 'baseline_low', 'low', 'optimal', 'moderate', 'high'));
  END IF;
END $$;

-- =============================================================================
-- 10. EXERCISE_LIBRARY TABLE CONSTRAINTS
-- =============================================================================

-- Ensure exercise_library table exists with versioning
CREATE TABLE IF NOT EXISTS exercise_library (
  id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  default_params_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, version)
);

-- Add unique constraint on (id, version)
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_library_id_version 
ON exercise_library(id, version);

-- =============================================================================
-- 11. TOURNAMENTS TABLE CONSTRAINTS
-- =============================================================================

-- Add format column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournaments' AND column_name = 'format'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN format VARCHAR(50) 
    CHECK (format IN ('round_robin', 'single_elimination', 'pools_playoffs'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournaments' AND column_name = 'bracket_metadata'
  ) THEN
    ALTER TABLE tournaments ADD COLUMN bracket_metadata JSONB;
  END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'tournaments_dates_check'
  ) THEN
    ALTER TABLE tournaments ADD CONSTRAINT tournaments_dates_check 
    CHECK (end_date > start_date);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'tournaments_registration_deadline_check'
  ) THEN
    ALTER TABLE tournaments ADD CONSTRAINT tournaments_registration_deadline_check 
    CHECK (registration_deadline <= start_date);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'tournaments_status_check'
  ) THEN
    ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check 
    CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled'));
  END IF;
END $$;

-- =============================================================================
-- 12. WORKOUT_LOGS TABLE CONSTRAINTS
-- =============================================================================

-- Add source_session_id if it doesn't exist (link to planned session)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workout_logs' AND column_name = 'source_session_id'
  ) THEN
    ALTER TABLE workout_logs ADD COLUMN source_session_id UUID 
    REFERENCES training_sessions(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workout_logs' AND column_name = 'planned_date'
  ) THEN
    ALTER TABLE workout_logs ADD COLUMN planned_date DATE;
  END IF;
END $$;

-- =============================================================================
-- 13. EXERCISE_LOGS TABLE CONSTRAINTS
-- =============================================================================

-- Add exercise_version if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercise_logs' AND column_name = 'exercise_version'
  ) THEN
    ALTER TABLE exercise_logs ADD COLUMN exercise_version INTEGER DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exercise_logs' AND column_name = 'prescribed_json'
  ) THEN
    ALTER TABLE exercise_logs ADD COLUMN prescribed_json JSONB;
  END IF;
END $$;

-- =============================================================================
-- 14. ANALYTICS_AGGREGATES TABLE CONSTRAINTS
-- =============================================================================

-- Ensure analytics_aggregates table exists
CREATE TABLE IF NOT EXISTS analytics_aggregates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  aggregation_type VARCHAR(50) NOT NULL CHECK (aggregation_type IN ('daily', 'weekly', 'monthly')),
  aggregation_date DATE NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_aggregates_unique 
ON analytics_aggregates(user_id, team_id, aggregation_type, aggregation_date) 
WHERE user_id IS NOT NULL AND team_id IS NOT NULL;

-- =============================================================================
-- 15. AUDIT FIELDS
-- =============================================================================

-- Add created_by and updated_by columns to key tables
DO $$
DECLARE
  table_name TEXT;
  tables TEXT[] := ARRAY['teams', 'training_programs', 'tournaments'];
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    -- Add created_by if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = table_name AND column_name = 'created_by'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL', table_name);
    END IF;
    
    -- Add updated_by if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = table_name AND column_name = 'updated_by'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL', table_name);
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- 16. SOFT DELETE PATTERN
-- =============================================================================

-- Add deleted_at to tables that need soft delete
DO $$
DECLARE
  table_name TEXT;
  tables TEXT[] := ARRAY['teams', 'training_programs', 'tournaments', 'team_members'];
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = table_name AND column_name = 'deleted_at'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN deleted_at TIMESTAMPTZ', table_name);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_deleted_at ON %I(deleted_at) WHERE deleted_at IS NULL', table_name, table_name);
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- 17. UPDATE TRIGGER FUNCTION
-- =============================================================================

-- Create or replace update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- NOTES
-- =============================================================================
-- This migration adds critical constraints identified in the technical review:
-- 1. Unique constraints prevent duplicates
-- 2. Check constraints enforce business rules
-- 3. Foreign keys ensure referential integrity
-- 4. Soft delete pattern for data retention
-- 5. Audit fields for tracking changes
-- 
-- Run this migration after reviewing the changes and testing in development.
-- =============================================================================




-- ============================================================================
-- Migration: 046_fix_acwr_baseline_checks.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- Migration: Fix ACWR Calculation with Baseline Checks
-- Version: 046
-- Date: 2025-01-21
-- Description: Implements safe ACWR calculation with baseline requirements
-- =============================================================================

-- =============================================================================
-- 0. ENSURE WORKOUT_LOGS TABLE EXISTS (REQUIRED FOR TRIGGER)
-- =============================================================================

-- Create workout_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  rpe DECIMAL(3,1) CHECK (rpe >= 1 AND rpe <= 10),
  duration_minutes INTEGER,
  notes TEXT,
  coach_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_player ON workout_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(completed_at);

-- =============================================================================
-- 1. ENSURE LOAD_METRICS TABLE EXISTS WITH REQUIRED COLUMNS
-- =============================================================================

-- Create load_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS load_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  acute_7 DECIMAL(10,2) CHECK (acute_7 >= 0),
  chronic_28 DECIMAL(10,2) CHECK (chronic_28 >= 0),
  acwr DECIMAL(5,2) CHECK (acwr IS NULL OR acwr >= 0),
  risk_level VARCHAR(20) CHECK (risk_level IN ('baseline_building', 'baseline_low', 'low', 'optimal', 'moderate', 'high')),
  baseline_days INTEGER CHECK (baseline_days >= 0 AND baseline_days <= 28),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, date)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_load_metrics_player ON load_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_load_metrics_date ON load_metrics(date);
CREATE INDEX IF NOT EXISTS idx_load_metrics_acwr ON load_metrics(acwr) WHERE acwr IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_load_metrics_risk ON load_metrics(risk_level);
CREATE INDEX IF NOT EXISTS idx_load_metrics_player_date_range ON load_metrics(player_id, date);

-- =============================================================================
-- 2. UPDATE LOAD_MONITORING TABLE TO INCLUDE BASELINE_DAYS
-- =============================================================================

-- Ensure load_monitoring table exists first
CREATE TABLE IF NOT EXISTS load_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_load INTEGER NOT NULL,
  acute_load DECIMAL(10,2),
  chronic_load DECIMAL(10,2),
  acwr DECIMAL(5,2),
  injury_risk_level VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, date)
);

-- Add baseline_days column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'load_monitoring' AND column_name = 'baseline_days'
  ) THEN
    ALTER TABLE load_monitoring ADD COLUMN baseline_days INTEGER CHECK (baseline_days >= 0 AND baseline_days <= 28);
  END IF;
END $$;

-- =============================================================================
-- 3. SAFE ACWR CALCULATION FUNCTION WITH BASELINE CHECKS
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_acwr_safe(
  player_uuid UUID,
  reference_date DATE
)
RETURNS TABLE (
  acwr DECIMAL(5,2),
  risk_level VARCHAR(20),
  baseline_days INTEGER,
  acute_7 DECIMAL(10,2),
  chronic_28 DECIMAL(10,2),
  daily_load INTEGER
) AS $$
DECLARE
  baseline_count INTEGER;
  acute_val DECIMAL(10,2);
  chronic_val DECIMAL(10,2);
  acwr_val DECIMAL(5,2);
  risk VARCHAR(20);
  daily_load_val INTEGER;
  MIN_CHRONIC_THRESHOLD CONSTANT DECIMAL := 50.0;
  MIN_BASELINE_DAYS CONSTANT INTEGER := 21;
BEGIN
  -- Count baseline days (days with load data in last 28 days)
  SELECT COUNT(*) INTO baseline_count
  FROM load_daily
  WHERE player_id = player_uuid
    AND date <= reference_date
    AND date > reference_date - INTERVAL '28 days';
  
  -- Calculate daily load for reference date
  SELECT COALESCE(SUM(rpe * duration_minutes), 0) INTO daily_load_val
  FROM workout_logs
  WHERE player_id = player_uuid
    AND DATE(completed_at) = reference_date;
  
  -- Calculate acute load (7-day rolling average)
  SELECT COALESCE(AVG(daily_load), 0) INTO acute_val
  FROM load_daily
  WHERE player_id = player_uuid
    AND date <= reference_date
    AND date > reference_date - INTERVAL '6 days';
  
  -- Calculate chronic load (28-day rolling average)
  SELECT COALESCE(AVG(daily_load), 0) INTO chronic_val
  FROM load_daily
  WHERE player_id = player_uuid
    AND date <= reference_date
    AND date > reference_date - INTERVAL '27 days';
  
  -- Determine risk level based on baseline and chronic load
  IF baseline_count < MIN_BASELINE_DAYS THEN
    -- Insufficient baseline (< 21 days)
    RETURN QUERY SELECT 
      NULL::DECIMAL(5,2) as acwr,
      'baseline_building'::VARCHAR(20) as risk_level,
      baseline_count as baseline_days,
      acute_val as acute_7,
      chronic_val as chronic_28,
      daily_load_val as daily_load;
  ELSIF chronic_val < MIN_CHRONIC_THRESHOLD THEN
    -- Baseline too low (< 50)
    RETURN QUERY SELECT 
      NULL::DECIMAL(5,2) as acwr,
      'baseline_low'::VARCHAR(20) as risk_level,
      baseline_count as baseline_days,
      acute_val as acute_7,
      chronic_val as chronic_28,
      daily_load_val as daily_load;
  ELSE
    -- Safe to calculate ACWR
    acwr_val := acute_val / chronic_val;
    risk := get_injury_risk_level_safe(acwr_val);
    
    RETURN QUERY SELECT 
      acwr_val as acwr,
      risk as risk_level,
      baseline_count as baseline_days,
      acute_val as acute_7,
      chronic_val as chronic_28,
      daily_load_val as daily_load;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. UPDATED RISK LEVEL FUNCTION (HANDLES BASELINE STATES)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_injury_risk_level_safe(acwr_value DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
  IF acwr_value IS NULL THEN
    RETURN 'baseline_building';
  ELSIF acwr_value < 0.8 THEN
    RETURN 'low'; -- Detraining risk
  ELSIF acwr_value >= 0.8 AND acwr_value <= 1.3 THEN
    RETURN 'optimal'; -- Sweet spot
  ELSIF acwr_value > 1.3 AND acwr_value <= 1.5 THEN
    RETURN 'moderate';
  ELSE
    RETURN 'high'; -- Increased injury risk
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Keep old function for backward compatibility (deprecated)
CREATE OR REPLACE FUNCTION get_injury_risk_level(acwr_value DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
  -- Map old risk levels to new ones
  IF acwr_value IS NULL OR acwr_value = 0 THEN
    RETURN 'Unknown';
  ELSIF acwr_value < 0.8 THEN
    RETURN 'Low';
  ELSIF acwr_value >= 0.8 AND acwr_value <= 1.3 THEN
    RETURN 'Optimal';
  ELSIF acwr_value > 1.3 AND acwr_value <= 1.5 THEN
    RETURN 'Moderate';
  ELSE
    RETURN 'High';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. ENSURE LOAD_DAILY TABLE EXISTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS load_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_load INTEGER NOT NULL CHECK (daily_load >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, date)
);

CREATE INDEX IF NOT EXISTS idx_load_daily_player ON load_daily(player_id);
CREATE INDEX IF NOT EXISTS idx_load_daily_date ON load_daily(date);
CREATE INDEX IF NOT EXISTS idx_load_daily_player_date_range ON load_daily(player_id, date);

-- =============================================================================
-- 6. FUNCTION TO UPDATE LOAD_DAILY FROM WORKOUT_LOGS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_load_daily_for_date(
  player_uuid UUID,
  log_date DATE
)
RETURNS void AS $$
DECLARE
  total_load INTEGER;
BEGIN
  -- Calculate total daily load (RPE × Duration)
  SELECT COALESCE(SUM(rpe * duration_minutes), 0)
  INTO total_load
  FROM workout_logs
  WHERE player_id = player_uuid
    AND DATE(completed_at) = log_date;
  
  -- Insert or update load_daily
  INSERT INTO load_daily (player_id, date, daily_load)
  VALUES (player_uuid, log_date, total_load)
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    daily_load = EXCLUDED.daily_load,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. UPDATED TRIGGER FUNCTION WITH BASELINE CHECKS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_load_monitoring()
RETURNS TRIGGER AS $$
DECLARE
  log_date DATE;
  acwr_result RECORD;
BEGIN
  log_date := DATE(NEW.completed_at);
  
  -- Update load_daily first
  PERFORM update_load_daily_for_date(NEW.player_id, log_date);
  
  -- Calculate ACWR with baseline checks
  SELECT * INTO acwr_result
  FROM calculate_acwr_safe(NEW.player_id, log_date);
  
  -- Update load_monitoring table
  INSERT INTO load_monitoring (
    player_id, 
    date, 
    daily_load, 
    acute_load, 
    chronic_load, 
    acwr, 
    injury_risk_level,
    baseline_days
  )
  VALUES (
    NEW.player_id,
    log_date,
    acwr_result.daily_load,
    acwr_result.acute_7,
    acwr_result.chronic_28,
    acwr_result.acwr,
    acwr_result.risk_level,
    acwr_result.baseline_days
  )
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    daily_load = EXCLUDED.daily_load,
    acute_load = EXCLUDED.acute_load,
    chronic_load = EXCLUDED.chronic_load,
    acwr = EXCLUDED.acwr,
    injury_risk_level = EXCLUDED.injury_risk_level,
    baseline_days = EXCLUDED.baseline_days,
    updated_at = NOW();
  
  -- Also update load_metrics table (if using separate table)
  INSERT INTO load_metrics (
    player_id,
    date,
    acute_7,
    chronic_28,
    acwr,
    risk_level,
    baseline_days
  )
  VALUES (
    NEW.player_id,
    log_date,
    acwr_result.acute_7,
    acwr_result.chronic_28,
    acwr_result.acwr,
    acwr_result.risk_level,
    acwr_result.baseline_days
  )
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    acute_7 = EXCLUDED.acute_7,
    chronic_28 = EXCLUDED.chronic_28,
    acwr = EXCLUDED.acwr,
    risk_level = EXCLUDED.risk_level,
    baseline_days = EXCLUDED.baseline_days,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. FUNCTION TO RECALCULATE LOAD METRICS FOR DATE RANGE
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_load_metrics_range(
  player_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS void AS $$
DECLARE
  calc_date DATE;
  acwr_result RECORD;
BEGIN
  calc_date := start_date;
  
  WHILE calc_date <= end_date LOOP
    -- Update load_daily for this date
    PERFORM update_load_daily_for_date(player_uuid, calc_date);
    
    -- Calculate ACWR
    SELECT * INTO acwr_result
    FROM calculate_acwr_safe(player_uuid, calc_date);
    
    -- Update load_monitoring
    INSERT INTO load_monitoring (
      player_id,
      date,
      daily_load,
      acute_load,
      chronic_load,
      acwr,
      injury_risk_level,
      baseline_days
    )
    VALUES (
      player_uuid,
      calc_date,
      acwr_result.daily_load,
      acwr_result.acute_7,
      acwr_result.chronic_28,
      acwr_result.acwr,
      acwr_result.risk_level,
      acwr_result.baseline_days
    )
    ON CONFLICT (player_id, date)
    DO UPDATE SET
      daily_load = EXCLUDED.daily_load,
      acute_load = EXCLUDED.acute_load,
      chronic_load = EXCLUDED.chronic_load,
      acwr = EXCLUDED.acwr,
      injury_risk_level = EXCLUDED.injury_risk_level,
      baseline_days = EXCLUDED.baseline_days,
      updated_at = NOW();
    
    -- Update load_metrics
    INSERT INTO load_metrics (
      player_id,
      date,
      acute_7,
      chronic_28,
      acwr,
      risk_level,
      baseline_days
    )
    VALUES (
      player_uuid,
      calc_date,
      acwr_result.acute_7,
      acwr_result.chronic_28,
      acwr_result.acwr,
      acwr_result.risk_level,
      acwr_result.baseline_days
    )
    ON CONFLICT (player_id, date)
    DO UPDATE SET
      acute_7 = EXCLUDED.acute_7,
      chronic_28 = EXCLUDED.chronic_28,
      acwr = EXCLUDED.acwr,
      risk_level = EXCLUDED.risk_level,
      baseline_days = EXCLUDED.baseline_days,
      updated_at = NOW();
    
    calc_date := calc_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 9. FUNCTION TO GET ACWR WITH BASELINE STATUS (FOR API USE)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_acwr_with_baseline(
  player_uuid UUID,
  reference_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  acwr DECIMAL(5,2),
  risk_level VARCHAR(20),
  baseline_days INTEGER,
  acute_7 DECIMAL(10,2),
  chronic_28 DECIMAL(10,2),
  daily_load INTEGER,
  baseline_status TEXT,
  message TEXT
) AS $$
DECLARE
  result RECORD;
  status_text TEXT;
  message_text TEXT;
BEGIN
  -- Get ACWR calculation
  SELECT * INTO result
  FROM calculate_acwr_safe(player_uuid, reference_date);
  
  -- Determine baseline status message
  IF result.baseline_days < 21 THEN
    status_text := 'building';
    message_text := format('Building baseline (%s/28 days). ACWR will be calculated once sufficient data is available.', result.baseline_days);
  ELSIF result.chronic_28 < 50 THEN
    status_text := 'low';
    message_text := format('Baseline load is low (%s). Consider gradually increasing training volume.', result.chronic_28);
  ELSIF result.acwr IS NULL THEN
    status_text := 'unknown';
    message_text := 'Unable to calculate ACWR. Please ensure you have logged training sessions.';
  ELSE
    status_text := 'ready';
    message_text := format('ACWR: %s (Risk: %s)', result.acwr, result.risk_level);
  END IF;
  
  RETURN QUERY SELECT
    result.acwr,
    result.risk_level,
    result.baseline_days,
    result.acute_7,
    result.chronic_28,
    result.daily_load,
    status_text::TEXT as baseline_status,
    message_text as message;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 10. UPDATE EXISTING LOAD_MONITORING RECORDS (BACKFILL)
-- =============================================================================

-- Function to backfill baseline_days for existing records
CREATE OR REPLACE FUNCTION backfill_baseline_days()
RETURNS void AS $$
DECLARE
  player_record RECORD;
  date_record RECORD;
  baseline_count INTEGER;
BEGIN
  -- For each player
  FOR player_record IN 
    SELECT DISTINCT player_id FROM load_monitoring
  LOOP
    -- For each date
    FOR date_record IN
      SELECT DISTINCT date FROM load_monitoring
      WHERE player_id = player_record.player_id
      ORDER BY date
    LOOP
      -- Count baseline days
      SELECT COUNT(*) INTO baseline_count
      FROM load_daily
      WHERE player_id = player_record.player_id
        AND date <= date_record.date
        AND date > date_record.date - INTERVAL '28 days';
      
      -- Update baseline_days
      UPDATE load_monitoring
      SET baseline_days = baseline_count
      WHERE player_id = player_record.player_id
        AND date = date_record.date;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- NOTES
-- =============================================================================
-- This migration implements safe ACWR calculation with baseline checks:
-- 
-- 1. Baseline Requirements:
--    - Minimum 21 days of data required for reliable ACWR
--    - Status: 'baseline_building' if < 21 days
--
-- 2. Chronic Load Threshold:
--    - Minimum chronic load of 50 required
--    - Status: 'baseline_low' if chronic < 50
--
-- 3. Safe ACWR Calculation:
--    - Only calculates ACWR when baseline is sufficient
--    - Returns NULL for ACWR when baseline insufficient
--    - Tracks baseline_days for UI display
--
-- 4. Risk Levels:
--    - baseline_building: < 21 days of data
--    - baseline_low: Chronic load < 50
--    - low: ACWR < 0.8
--    - optimal: ACWR 0.8-1.3
--    - moderate: ACWR 1.3-1.5
--    - high: ACWR > 1.5
--
-- 5. Functions:
--    - calculate_acwr_safe(): Main calculation with baseline checks
--    - get_acwr_with_baseline(): API-friendly function with status messages
--    - recalculate_load_metrics_range(): Recalculate for date range (for edits)
--
-- After running this migration:
-- 1. Run backfill_baseline_days() to update existing records
-- 2. Update frontend to display baseline status
-- 3. Test ACWR calculation with various data scenarios
-- =============================================================================




-- ============================================================================
-- Migration: 046a_fix_acwr_baseline_checks_supabase.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- Migration: Fix ACWR Calculation with Baseline Checks (Supabase Version)
-- Version: 046 (Supabase)
-- Date: 2025-01-21
-- Description: Implements safe ACWR calculation with baseline requirements
-- NOTE: This version uses auth.users for Supabase compatibility
-- =============================================================================

-- =============================================================================
-- 0. ENSURE WORKOUT_LOGS TABLE EXISTS (REQUIRED FOR TRIGGER)
-- =============================================================================

-- Create workout_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  rpe DECIMAL(3,1) CHECK (rpe >= 1 AND rpe <= 10),
  duration_minutes INTEGER,
  notes TEXT,
  coach_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_player ON workout_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(completed_at);

-- =============================================================================
-- 1. ENSURE LOAD_METRICS TABLE EXISTS WITH REQUIRED COLUMNS
-- =============================================================================

-- Create load_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS load_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  acute_7 DECIMAL(10,2) CHECK (acute_7 >= 0),
  chronic_28 DECIMAL(10,2) CHECK (chronic_28 >= 0),
  acwr DECIMAL(5,2) CHECK (acwr IS NULL OR acwr >= 0),
  risk_level VARCHAR(20) CHECK (risk_level IN ('baseline_building', 'baseline_low', 'low', 'optimal', 'moderate', 'high')),
  baseline_days INTEGER CHECK (baseline_days >= 0 AND baseline_days <= 28),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, date)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_load_metrics_player ON load_metrics(player_id);
CREATE INDEX IF NOT EXISTS idx_load_metrics_date ON load_metrics(date);
CREATE INDEX IF NOT EXISTS idx_load_metrics_acwr ON load_metrics(acwr) WHERE acwr IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_load_metrics_risk ON load_metrics(risk_level);
CREATE INDEX IF NOT EXISTS idx_load_metrics_player_date_range ON load_metrics(player_id, date);

-- =============================================================================
-- 2. UPDATE LOAD_MONITORING TABLE TO INCLUDE BASELINE_DAYS
-- =============================================================================

-- Ensure load_monitoring table exists first
CREATE TABLE IF NOT EXISTS load_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_load INTEGER NOT NULL,
  acute_load DECIMAL(10,2),
  chronic_load DECIMAL(10,2),
  acwr DECIMAL(5,2),
  injury_risk_level VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, date)
);

-- Add baseline_days column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'load_monitoring' AND column_name = 'baseline_days'
  ) THEN
    ALTER TABLE load_monitoring ADD COLUMN baseline_days INTEGER CHECK (baseline_days >= 0 AND baseline_days <= 28);
  END IF;
END $$;

-- =============================================================================
-- 3. SAFE ACWR CALCULATION FUNCTION WITH BASELINE CHECKS
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_acwr_safe(
  player_uuid UUID,
  reference_date DATE
)
RETURNS TABLE (
  acwr DECIMAL(5,2),
  risk_level VARCHAR(20),
  baseline_days INTEGER,
  acute_7 DECIMAL(10,2),
  chronic_28 DECIMAL(10,2),
  daily_load INTEGER
) AS $$
DECLARE
  baseline_count INTEGER;
  acute_val DECIMAL(10,2);
  chronic_val DECIMAL(10,2);
  acwr_val DECIMAL(5,2);
  risk VARCHAR(20);
  daily_load_val INTEGER;
  MIN_CHRONIC_THRESHOLD CONSTANT DECIMAL := 50.0;
  MIN_BASELINE_DAYS CONSTANT INTEGER := 21;
BEGIN
  -- Count baseline days (days with load data in last 28 days)
  SELECT COUNT(*) INTO baseline_count
  FROM load_daily
  WHERE player_id = player_uuid
    AND date <= reference_date
    AND date > reference_date - INTERVAL '28 days';
  
  -- Calculate daily load for reference date
  SELECT COALESCE(SUM(rpe * duration_minutes), 0) INTO daily_load_val
  FROM workout_logs
  WHERE player_id = player_uuid
    AND DATE(completed_at) = reference_date;
  
  -- Calculate acute load (7-day rolling average)
  SELECT COALESCE(AVG(daily_load), 0) INTO acute_val
  FROM load_daily
  WHERE player_id = player_uuid
    AND date <= reference_date
    AND date > reference_date - INTERVAL '6 days';
  
  -- Calculate chronic load (28-day rolling average)
  SELECT COALESCE(AVG(daily_load), 0) INTO chronic_val
  FROM load_daily
  WHERE player_id = player_uuid
    AND date <= reference_date
    AND date > reference_date - INTERVAL '27 days';
  
  -- Determine risk level based on baseline and chronic load
  IF baseline_count < MIN_BASELINE_DAYS THEN
    -- Insufficient baseline (< 21 days)
    RETURN QUERY SELECT 
      NULL::DECIMAL(5,2) as acwr,
      'baseline_building'::VARCHAR(20) as risk_level,
      baseline_count as baseline_days,
      acute_val as acute_7,
      chronic_val as chronic_28,
      daily_load_val as daily_load;
  ELSIF chronic_val < MIN_CHRONIC_THRESHOLD THEN
    -- Baseline too low (< 50)
    RETURN QUERY SELECT 
      NULL::DECIMAL(5,2) as acwr,
      'baseline_low'::VARCHAR(20) as risk_level,
      baseline_count as baseline_days,
      acute_val as acute_7,
      chronic_val as chronic_28,
      daily_load_val as daily_load;
  ELSE
    -- Safe to calculate ACWR
    acwr_val := acute_val / chronic_val;
    risk := get_injury_risk_level_safe(acwr_val);
    
    RETURN QUERY SELECT 
      acwr_val as acwr,
      risk as risk_level,
      baseline_count as baseline_days,
      acute_val as acute_7,
      chronic_val as chronic_28,
      daily_load_val as daily_load;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. UPDATED RISK LEVEL FUNCTION (HANDLES BASELINE STATES)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_injury_risk_level_safe(acwr_value DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
  IF acwr_value IS NULL THEN
    RETURN 'baseline_building';
  ELSIF acwr_value < 0.8 THEN
    RETURN 'low'; -- Detraining risk
  ELSIF acwr_value >= 0.8 AND acwr_value <= 1.3 THEN
    RETURN 'optimal'; -- Sweet spot
  ELSIF acwr_value > 1.3 AND acwr_value <= 1.5 THEN
    RETURN 'moderate';
  ELSE
    RETURN 'high'; -- Increased injury risk
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. ENSURE LOAD_DAILY TABLE EXISTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS load_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_load INTEGER NOT NULL CHECK (daily_load >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, date)
);

CREATE INDEX IF NOT EXISTS idx_load_daily_player ON load_daily(player_id);
CREATE INDEX IF NOT EXISTS idx_load_daily_date ON load_daily(date);
CREATE INDEX IF NOT EXISTS idx_load_daily_player_date_range ON load_daily(player_id, date);

-- =============================================================================
-- 6. FUNCTION TO UPDATE LOAD_DAILY FROM WORKOUT_LOGS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_load_daily_for_date(
  player_uuid UUID,
  log_date DATE
)
RETURNS void AS $$
DECLARE
  total_load INTEGER;
BEGIN
  -- Calculate total daily load (RPE × Duration)
  SELECT COALESCE(SUM(rpe * duration_minutes), 0)
  INTO total_load
  FROM workout_logs
  WHERE player_id = player_uuid
    AND DATE(completed_at) = log_date;
  
  -- Insert or update load_daily
  INSERT INTO load_daily (player_id, date, daily_load)
  VALUES (player_uuid, log_date, total_load)
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    daily_load = EXCLUDED.daily_load,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. UPDATED TRIGGER FUNCTION WITH BASELINE CHECKS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_load_monitoring()
RETURNS TRIGGER AS $$
DECLARE
  log_date DATE;
  acwr_result RECORD;
BEGIN
  log_date := DATE(NEW.completed_at);
  
  -- Update load_daily first
  PERFORM update_load_daily_for_date(NEW.player_id, log_date);
  
  -- Calculate ACWR with baseline checks
  SELECT * INTO acwr_result
  FROM calculate_acwr_safe(NEW.player_id, log_date);
  
  -- Update load_monitoring table
  INSERT INTO load_monitoring (
    player_id, 
    date, 
    daily_load, 
    acute_load, 
    chronic_load, 
    acwr, 
    injury_risk_level,
    baseline_days
  )
  VALUES (
    NEW.player_id,
    log_date,
    acwr_result.daily_load,
    acwr_result.acute_7,
    acwr_result.chronic_28,
    acwr_result.acwr,
    acwr_result.risk_level,
    acwr_result.baseline_days
  )
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    daily_load = EXCLUDED.daily_load,
    acute_load = EXCLUDED.acute_load,
    chronic_load = EXCLUDED.chronic_load,
    acwr = EXCLUDED.acwr,
    injury_risk_level = EXCLUDED.injury_risk_level,
    baseline_days = EXCLUDED.baseline_days,
    updated_at = NOW();
  
  -- Also update load_metrics table (if using separate table)
  INSERT INTO load_metrics (
    player_id,
    date,
    acute_7,
    chronic_28,
    acwr,
    risk_level,
    baseline_days
  )
  VALUES (
    NEW.player_id,
    log_date,
    acwr_result.acute_7,
    acwr_result.chronic_28,
    acwr_result.acwr,
    acwr_result.risk_level,
    acwr_result.baseline_days
  )
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    acute_7 = EXCLUDED.acute_7,
    chronic_28 = EXCLUDED.chronic_28,
    acwr = EXCLUDED.acwr,
    risk_level = EXCLUDED.risk_level,
    baseline_days = EXCLUDED.baseline_days,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to workout_logs
DROP TRIGGER IF EXISTS trigger_update_load_monitoring ON workout_logs;
CREATE TRIGGER trigger_update_load_monitoring
AFTER INSERT OR UPDATE ON workout_logs
FOR EACH ROW
EXECUTE FUNCTION update_load_monitoring();

-- =============================================================================
-- 8. FUNCTION TO RECALCULATE LOAD METRICS FOR DATE RANGE
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_load_metrics_range(
  player_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS void AS $$
DECLARE
  calc_date DATE;
  acwr_result RECORD;
BEGIN
  calc_date := start_date;
  
  WHILE calc_date <= end_date LOOP
    -- Update load_daily for this date
    PERFORM update_load_daily_for_date(player_uuid, calc_date);
    
    -- Calculate ACWR
    SELECT * INTO acwr_result
    FROM calculate_acwr_safe(player_uuid, calc_date);
    
    -- Update load_monitoring
    INSERT INTO load_monitoring (
      player_id,
      date,
      daily_load,
      acute_load,
      chronic_load,
      acwr,
      injury_risk_level,
      baseline_days
    )
    VALUES (
      player_uuid,
      calc_date,
      acwr_result.daily_load,
      acwr_result.acute_7,
      acwr_result.chronic_28,
      acwr_result.acwr,
      acwr_result.risk_level,
      acwr_result.baseline_days
    )
    ON CONFLICT (player_id, date)
    DO UPDATE SET
      daily_load = EXCLUDED.daily_load,
      acute_load = EXCLUDED.acute_load,
      chronic_load = EXCLUDED.chronic_load,
      acwr = EXCLUDED.acwr,
      injury_risk_level = EXCLUDED.injury_risk_level,
      baseline_days = EXCLUDED.baseline_days,
      updated_at = NOW();
    
    -- Update load_metrics
    INSERT INTO load_metrics (
      player_id,
      date,
      acute_7,
      chronic_28,
      acwr,
      risk_level,
      baseline_days
    )
    VALUES (
      player_uuid,
      calc_date,
      acwr_result.acute_7,
      acwr_result.chronic_28,
      acwr_result.acwr,
      acwr_result.risk_level,
      acwr_result.baseline_days
    )
    ON CONFLICT (player_id, date)
    DO UPDATE SET
      acute_7 = EXCLUDED.acute_7,
      chronic_28 = EXCLUDED.chronic_28,
      acwr = EXCLUDED.acwr,
      risk_level = EXCLUDED.risk_level,
      baseline_days = EXCLUDED.baseline_days,
      updated_at = NOW();
    
    calc_date := calc_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 9. FUNCTION TO GET ACWR WITH BASELINE STATUS (FOR API USE)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_acwr_with_baseline(
  player_uuid UUID,
  reference_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  acwr DECIMAL(5,2),
  risk_level VARCHAR(20),
  baseline_days INTEGER,
  acute_7 DECIMAL(10,2),
  chronic_28 DECIMAL(10,2),
  daily_load INTEGER,
  baseline_status TEXT,
  message TEXT
) AS $$
DECLARE
  result RECORD;
  status_text TEXT;
  message_text TEXT;
BEGIN
  -- Get ACWR calculation
  SELECT * INTO result
  FROM calculate_acwr_safe(player_uuid, reference_date);
  
  -- Determine baseline status message
  IF result.baseline_days < 21 THEN
    status_text := 'building';
    message_text := format('Building baseline (%s/28 days). ACWR will be calculated once sufficient data is available.', result.baseline_days);
  ELSIF result.chronic_28 < 50 THEN
    status_text := 'low';
    message_text := format('Baseline load is low (%s). Consider gradually increasing training volume.', result.chronic_28);
  ELSIF result.acwr IS NULL THEN
    status_text := 'unknown';
    message_text := 'Unable to calculate ACWR. Please ensure you have logged training sessions.';
  ELSE
    status_text := 'ready';
    message_text := format('ACWR: %s (Risk: %s)', result.acwr, result.risk_level);
  END IF;
  
  RETURN QUERY SELECT
    result.acwr,
    result.risk_level,
    result.baseline_days,
    result.acute_7,
    result.chronic_28,
    result.daily_load,
    status_text::TEXT as baseline_status,
    message_text as message;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 10. UPDATE EXISTING LOAD_MONITORING RECORDS (BACKFILL)
-- =============================================================================

-- Function to backfill baseline_days for existing records
CREATE OR REPLACE FUNCTION backfill_baseline_days()
RETURNS void AS $$
DECLARE
  player_record RECORD;
  date_record RECORD;
  baseline_count INTEGER;
BEGIN
  -- For each player
  FOR player_record IN 
    SELECT DISTINCT player_id FROM load_monitoring
  LOOP
    -- For each date
    FOR date_record IN
      SELECT DISTINCT date FROM load_monitoring
      WHERE player_id = player_record.player_id
      ORDER BY date
    LOOP
      -- Count baseline days
      SELECT COUNT(*) INTO baseline_count
      FROM load_daily
      WHERE player_id = player_record.player_id
        AND date <= date_record.date
        AND date > date_record.date - INTERVAL '28 days';
      
      -- Update baseline_days
      UPDATE load_monitoring
      SET baseline_days = baseline_count
      WHERE player_id = player_record.player_id
        AND date = date_record.date;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;




-- ============================================================================
-- Migration: 047_ensure_postgrest_exposure.sql
-- Type: database
-- ============================================================================

-- Migration 047: Ensure PostgREST Exposure for 82 Core Tables
-- Based on analysis from 2025-01-21
-- Ensures all 82 tables identified are properly exposed via PostgREST API

-- This migration ensures tables are visible in PostgREST schema cache
-- Note: PostgREST automatically exposes tables in the 'public' schema
-- This migration verifies and documents the 82 core tables

-- Grant necessary permissions for PostgREST to access tables
-- PostgREST uses the 'anon' and 'authenticated' roles

DO $$
DECLARE
    table_record RECORD;
    tables_to_expose TEXT[] := ARRAY[
        'affordable_brand_products',
        'affordable_equipment',
        'agility_patterns',
        'altitude_environmental_factors',
        'amateur_training_programs',
        'analytics_events',
        'budget_categories',
        'budget_friendly_alternatives',
        'budget_nutrition_plans',
        'chatbot_user_context',
        'cognitive_recovery_protocols',
        'community_activation_events',
        'cost_effective_alternatives',
        'creatine_research',
        'daily_quotes',
        'defensive_schemes',
        'digital_wellness_protocols',
        'diy_protocols',
        'environmental_adjustments',
        'environmental_recovery_protocols',
        'equipment_alternatives_comparison',
        'equipment_price_tracking',
        'european_championship_protocols',
        'fixtures',
        'flag_football_performance_levels',
        'flag_football_positions',
        'game_day_workflows',
        'hydration_research_studies',
        'ifaf_elo_ratings',
        'ifaf_flag_rankings',
        'ifaf_hydration_protocols',
        'implementation_steps',
        'local_premium_alternatives',
        'national_team_profiles',
        'nfl_combine_benchmarks',
        'nfl_combine_performances',
        'notifications',
        'olympic_games_protocols',
        'olympic_qualification',
        'performance_benchmarks',
        'performance_competencies',
        'performance_metrics',
        'performance_plan_templates',
        'player_archetypes',
        'position_requirements',
        'positions',
        'premium_brand_analysis',
        'premium_product_alternatives',
        'readiness_scores',
        'realistic_budget_categories',
        'realistic_performance_plans',
        'sleep_guidelines',
        'sleep_optimization_protocols',
        'sponsor_products',
        'sponsor_rewards',
        'sports_crossover_analysis',
        'sprint_recovery_protocols',
        'sprint_training_categories',
        'sprint_training_phases',
        'sprint_workouts',
        'success_indicators',
        'supplement_evidence_grades',
        'supplement_interactions',
        'supplement_protocols',
        'supplement_research',
        'supplement_wada_compliance',
        'supplements',
        'team_chemistry',
        'team_resources',
        'teams',
        'training_analytics',
        'training_hydration_protocols',
        'training_sessions',
        'user_behavior',
        'user_notification_preferences',
        'user_teams',
        'users',
        'wada_prohibited_substances',
        'wearables_data',
        'wellness_logs',
        'world_championship_protocols'
    ];
BEGIN
    -- Grant usage on schema
    GRANT USAGE ON SCHEMA public TO anon, authenticated;
    
    -- Grant select on all existing tables
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = ANY(tables_to_expose)
    LOOP
        -- Grant select, insert, update, delete permissions
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated', table_record.tablename);
        
        -- Grant usage on sequences (for auto-increment columns)
        BEGIN
            EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated');
        EXCEPTION WHEN OTHERS THEN
            -- Sequences might not exist, continue
            NULL;
        END;
    END LOOP;
    
    RAISE NOTICE 'Granted PostgREST permissions on % tables', array_length(tables_to_expose, 1);
END $$;

-- Create a view to track PostgREST-exposed tables
-- SECURITY INVOKER ensures the view runs with the permissions of the querying user, not the creator
-- This respects RLS policies and is safer than SECURITY DEFINER
CREATE OR REPLACE VIEW postgrest_exposed_tables
WITH (security_invoker = true) AS
SELECT 
    t.table_name,
    CASE 
        WHEN t.table_name = ANY(ARRAY[
            'affordable_brand_products', 'affordable_equipment', 'agility_patterns',
            'altitude_environmental_factors', 'amateur_training_programs', 'analytics_events',
            'budget_categories', 'budget_friendly_alternatives', 'budget_nutrition_plans',
            'chatbot_user_context', 'cognitive_recovery_protocols', 'community_activation_events',
            'cost_effective_alternatives', 'creatine_research', 'daily_quotes',
            'defensive_schemes', 'digital_wellness_protocols', 'diy_protocols',
            'environmental_adjustments', 'environmental_recovery_protocols',
            'equipment_alternatives_comparison', 'equipment_price_tracking',
            'european_championship_protocols', 'fixtures',
            'flag_football_performance_levels', 'flag_football_positions',
            'game_day_workflows', 'hydration_research_studies',
            'ifaf_elo_ratings', 'ifaf_flag_rankings', 'ifaf_hydration_protocols',
            'implementation_steps', 'local_premium_alternatives',
            'national_team_profiles', 'nfl_combine_benchmarks', 'nfl_combine_performances',
            'notifications', 'olympic_games_protocols', 'olympic_qualification',
            'performance_benchmarks', 'performance_competencies', 'performance_metrics',
            'performance_plan_templates', 'player_archetypes', 'position_requirements',
            'positions', 'premium_brand_analysis', 'premium_product_alternatives',
            'readiness_scores', 'realistic_budget_categories', 'realistic_performance_plans',
            'sleep_guidelines', 'sleep_optimization_protocols',
            'sponsor_products', 'sponsor_rewards', 'sports_crossover_analysis',
            'sprint_recovery_protocols', 'sprint_training_categories',
            'sprint_training_phases', 'sprint_workouts', 'success_indicators',
            'supplement_evidence_grades', 'supplement_interactions', 'supplement_protocols',
            'supplement_research', 'supplement_wada_compliance', 'supplements',
            'team_chemistry', 'team_resources', 'teams',
            'training_analytics', 'training_hydration_protocols', 'training_sessions',
            'user_behavior', 'user_notification_preferences', 'user_teams',
            'users', 'wada_prohibited_substances', 'wearables_data',
            'wellness_logs', 'world_championship_protocols'
        ]) THEN true
        ELSE false
    END as is_core_table,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY is_core_table DESC, t.table_name;

-- Grant select on the view
GRANT SELECT ON postgrest_exposed_tables TO anon, authenticated;

-- Comment on the migration
COMMENT ON VIEW postgrest_exposed_tables IS 
'View tracking the 82 core tables that should be exposed via PostgREST API. Created 2025-01-21.';




-- ============================================================================
-- Migration: 047_improve_function_security.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- Migration 047: Improve Function Security and Performance
-- =============================================================================
-- This migration adds:
-- 1. SECURITY INVOKER to respect RLS policies
-- 2. STABLE volatility for read-only functions (helps query optimizer)
-- 3. PARALLEL SAFE where applicable
-- =============================================================================

-- Function to calculate daily training load (RPE × Duration)
-- STABLE: Function only reads data, doesn't modify
-- SECURITY INVOKER: Respects RLS policies of the calling user
CREATE OR REPLACE FUNCTION calculate_daily_load(player_uuid UUID, log_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
PARALLEL SAFE
AS $$
DECLARE
  total_load INTEGER;
BEGIN
  SELECT COALESCE(SUM(rpe * duration_minutes), 0)
  INTO total_load
  FROM workout_logs
  WHERE player_id = player_uuid
    AND DATE(completed_at) = log_date;

  RETURN total_load;
END;
$$;

-- Function to calculate acute load (7-day rolling average)
CREATE OR REPLACE FUNCTION calculate_acute_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
PARALLEL SAFE
AS $$
DECLARE
  acute_load DECIMAL(10,2);
BEGIN
  SELECT COALESCE(AVG(daily_load), 0)
  INTO acute_load
  FROM load_monitoring
  WHERE player_id = player_uuid
    AND date >= reference_date - INTERVAL '6 days'
    AND date <= reference_date;

  RETURN acute_load;
END;
$$;

-- Function to calculate chronic load (28-day rolling average)
CREATE OR REPLACE FUNCTION calculate_chronic_load(player_uuid UUID, reference_date DATE)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
PARALLEL SAFE
AS $$
DECLARE
  chronic_load DECIMAL(10,2);
BEGIN
  SELECT COALESCE(AVG(daily_load), 0)
  INTO chronic_load
  FROM load_monitoring
  WHERE player_id = player_uuid
    AND date >= reference_date - INTERVAL '27 days'
    AND date <= reference_date;

  RETURN chronic_load;
END;
$$;

-- Function to determine injury risk level based on ACWR
-- IMMUTABLE: Same input always produces same output (pure function)
CREATE OR REPLACE FUNCTION get_injury_risk_level(acwr_value DECIMAL)
RETURNS VARCHAR
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
BEGIN
  IF acwr_value IS NULL OR acwr_value = 0 THEN
    RETURN 'Unknown';
  ELSIF acwr_value < 0.8 THEN
    RETURN 'Low'; -- Detraining risk
  ELSIF acwr_value >= 0.8 AND acwr_value <= 1.3 THEN
    RETURN 'Optimal'; -- Sweet spot
  ELSIF acwr_value > 1.3 AND acwr_value <= 1.5 THEN
    RETURN 'Moderate';
  ELSE
    RETURN 'High'; -- Increased injury risk
  END IF;
END;
$$;

-- Helper function for VARCHAR user_id columns (for legacy tables)
-- STABLE: Depends on session state but doesn't modify data
CREATE OR REPLACE FUNCTION auth.user_id_text()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT COALESCE(
    auth.uid()::text,
    current_setting('request.jwt.claims', true)::jsonb->>'sub'
  );
$$;

-- Standard UUID user ID function
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT COALESCE(
    auth.uid(),
    (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid
  );
$$;

-- =============================================================================
-- Add comments for documentation
-- =============================================================================
COMMENT ON FUNCTION calculate_daily_load(UUID, DATE) IS 
  'Calculates total training load for a player on a specific date (RPE × duration). Used for ACWR calculations.';

COMMENT ON FUNCTION calculate_acute_load(UUID, DATE) IS 
  'Calculates 7-day rolling average of daily load for acute workload ratio.';

COMMENT ON FUNCTION calculate_chronic_load(UUID, DATE) IS 
  'Calculates 28-day rolling average of daily load for chronic workload baseline.';

COMMENT ON FUNCTION get_injury_risk_level(DECIMAL) IS 
  'Maps ACWR value to injury risk category: Unknown, Low, Optimal, Moderate, High.';

COMMENT ON FUNCTION auth.user_id() IS 
  'Returns current authenticated user ID as UUID. Respects RLS policies.';

COMMENT ON FUNCTION auth.user_id_text() IS 
  'Returns current authenticated user ID as TEXT. For legacy VARCHAR columns.';



-- ============================================================================
-- Migration: 048_fix_security_definer_views.sql
-- Type: database
-- ============================================================================

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




-- ============================================================================
-- Migration: 049_drop_unused_indexes.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- MIGRATION 049: Drop Unused Indexes
-- =============================================================================
-- Purpose: Remove indexes that have never been used according to database linter
-- 
-- Indexes being removed:
-- 1. idx_chatbot_user_context_primary_team_id on chatbot_user_context(primary_team_id)
--    - Queries filter by user_id (which has an index), not primary_team_id
-- 2. idx_fixtures_team_id on fixtures(team_id)
--    - Queries filter by athlete_id (which has an index), not team_id directly
--    - RLS policies use subqueries that don't benefit from this index
-- =============================================================================

-- Drop unused index on chatbot_user_context.primary_team_id
-- Note: PostgreSQL/Supabase may have auto-created this with a different name
DROP INDEX IF EXISTS public.idx_chatbot_user_context_primary_team_id;
DROP INDEX IF EXISTS public.idx_chatbot_context_team;

-- Drop unused index on fixtures.team_id
-- Note: PostgreSQL/Supabase may have auto-created this with a different name
DROP INDEX IF EXISTS public.idx_fixtures_team_id;
DROP INDEX IF EXISTS public.idx_fixtures_team;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After running this migration, verify the indexes are removed:
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('chatbot_user_context', 'fixtures')
--   AND indexname LIKE '%team%';
-- =============================================================================




-- ============================================================================
-- Migration: 050_add_missing_foreign_key_indexes.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- Migration 050: Add missing foreign key indexes
-- Fixes unindexed foreign keys identified by database linter
-- =============================================================================
-- Purpose: Add covering indexes for foreign key constraints to improve
--          referential integrity check performance and join operations.
--
-- Note: These indexes were previously dropped in migration 049 as "unused"
--       for query filtering, but they are required for foreign key performance.
--       Foreign keys should always have covering indexes for:
--       1. Efficient referential integrity checks (ON DELETE/UPDATE)
--       2. Faster JOIN operations
--       3. Better query planner optimization
-- =============================================================================

-- Fix unindexed foreign key: chatbot_user_context.primary_team_id
-- Foreign key: chatbot_user_context_primary_team_id_fkey
-- References: teams(id) ON DELETE SET NULL
-- 
-- This index is required for:
-- - Efficient CASCADE/SET NULL operations when teams are deleted
-- - Fast JOINs between chatbot_user_context and teams
-- - Query planner optimization for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_chatbot_user_context_primary_team_id 
ON chatbot_user_context(primary_team_id)
WHERE primary_team_id IS NOT NULL;

COMMENT ON INDEX idx_chatbot_user_context_primary_team_id IS 
'Index covering foreign key chatbot_user_context_primary_team_id_fkey. Required for referential integrity performance and JOIN optimization.';

-- Fix unindexed foreign key: fixtures.team_id
-- Foreign key: fixtures_team_id_fkey
-- References: teams(id) ON DELETE CASCADE
--
-- This index is required for:
-- - Efficient CASCADE operations when teams are deleted
-- - Fast JOINs between fixtures and teams
-- - Query planner optimization for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_fixtures_team_id 
ON fixtures(team_id)
WHERE team_id IS NOT NULL;

COMMENT ON INDEX idx_fixtures_team_id IS 
'Index covering foreign key fixtures_team_id_fkey. Required for referential integrity performance and JOIN optimization.';

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Verify indexes were created successfully
DO $$
DECLARE
    idx_count INTEGER;
BEGIN
    -- Check chatbot_user_context index
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'chatbot_user_context'
      AND indexname = 'idx_chatbot_user_context_primary_team_id';
    
    IF idx_count = 0 THEN
        RAISE WARNING 'Index idx_chatbot_user_context_primary_team_id was not created';
    ELSE
        RAISE NOTICE 'Index idx_chatbot_user_context_primary_team_id created successfully';
    END IF;
    
    -- Check fixtures index
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'fixtures'
      AND indexname = 'idx_fixtures_team_id';
    
    IF idx_count = 0 THEN
        RAISE WARNING 'Index idx_fixtures_team_id was not created';
    ELSE
        RAISE NOTICE 'Index idx_fixtures_team_id created successfully';
    END IF;
END $$;




-- ============================================================================
-- Migration: 050_create_video_tables.sql
-- Type: database
-- ============================================================================

-- ============================================================================
-- VIDEO BOOKMARKS AND CURATION TABLES
-- Migration: 050_create_video_tables.sql
-- Description: Tables for Instagram video integration, bookmarks, and curation
-- ============================================================================

-- ============================================================================
-- VIDEO BOOKMARKS TABLE
-- Stores user's saved/bookmarked training videos
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    video_title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    creator_username TEXT,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    -- Ensure unique bookmark per user per video
    UNIQUE(user_id, video_id)
);

-- Index for fast user bookmark lookups
CREATE INDEX IF NOT EXISTS idx_video_bookmarks_user_id ON video_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_video_bookmarks_saved_at ON video_bookmarks(saved_at DESC);

-- ============================================================================
-- VIDEO CURATION STATUS TABLE
-- Tracks approval/rejection status of videos for teams
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_curation_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One status per video per team
    UNIQUE(team_id, video_id)
);

-- Indexes for curation lookups
CREATE INDEX IF NOT EXISTS idx_video_curation_team_id ON video_curation_status(team_id);
CREATE INDEX IF NOT EXISTS idx_video_curation_status ON video_curation_status(status);

-- ============================================================================
-- TEAM VIDEO PLAYLISTS TABLE
-- Custom playlists created by coaches
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    position TEXT, -- Target position (QB, WR, DB, etc.)
    focus_areas TEXT[], -- Training focus areas
    video_ids TEXT[] NOT NULL DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for playlist lookups
CREATE INDEX IF NOT EXISTS idx_video_playlists_team_id ON video_playlists(team_id);
CREATE INDEX IF NOT EXISTS idx_video_playlists_created_by ON video_playlists(created_by);
CREATE INDEX IF NOT EXISTS idx_video_playlists_position ON video_playlists(position);

-- ============================================================================
-- VIDEO WATCH HISTORY TABLE
-- Tracks which videos users have watched
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    watched_at TIMESTAMPTZ DEFAULT NOW(),
    watch_duration_seconds INTEGER,
    completed BOOLEAN DEFAULT false,
    
    -- Allow multiple watches of same video
    CONSTRAINT unique_watch_session UNIQUE(user_id, video_id, watched_at)
);

-- Indexes for watch history
CREATE INDEX IF NOT EXISTS idx_video_watch_user_id ON video_watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_video_id ON video_watch_history(video_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_watched_at ON video_watch_history(watched_at DESC);

-- ============================================================================
-- VIDEO ASSIGNMENTS TABLE
-- Videos assigned to specific players by coaches
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    playlist_id UUID REFERENCES video_playlists(id) ON DELETE SET NULL,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for assignments
CREATE INDEX IF NOT EXISTS idx_video_assignments_team ON video_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_video_assignments_assigned_to ON video_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_video_assignments_status ON video_assignments(status);
CREATE INDEX IF NOT EXISTS idx_video_assignments_due_date ON video_assignments(due_date);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE video_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_curation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_assignments ENABLE ROW LEVEL SECURITY;

-- Video Bookmarks: Users can only access their own bookmarks
CREATE POLICY "Users can view own bookmarks"
    ON video_bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
    ON video_bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
    ON video_bookmarks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
    ON video_bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- Video Curation: Team members can view, coaches/admins can modify
CREATE POLICY "Team members can view curation status"
    ON video_curation_status FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_curation_status.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can manage curation status"
    ON video_curation_status FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_curation_status.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('coach', 'admin', 'owner')
        )
    );

-- Video Playlists: Team members can view, creators/coaches can modify
CREATE POLICY "Team members can view playlists"
    ON video_playlists FOR SELECT
    USING (
        is_public = true
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_playlists.team_id
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create playlists"
    ON video_playlists FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update own playlists"
    ON video_playlists FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete own playlists"
    ON video_playlists FOR DELETE
    USING (auth.uid() = created_by);

-- Video Watch History: Users can only access their own history
CREATE POLICY "Users can view own watch history"
    ON video_watch_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own watch history"
    ON video_watch_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch history"
    ON video_watch_history FOR UPDATE
    USING (auth.uid() = user_id);

-- Video Assignments: Assignees can view/update, coaches can manage
CREATE POLICY "Users can view their assignments"
    ON video_assignments FOR SELECT
    USING (
        assigned_to = auth.uid()
        OR assigned_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_assignments.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('coach', 'admin', 'owner')
        )
    );

CREATE POLICY "Coaches can create assignments"
    ON video_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_assignments.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('coach', 'admin', 'owner')
        )
    );

CREATE POLICY "Users can update their assignments"
    ON video_assignments FOR UPDATE
    USING (
        assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_assignments.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('coach', 'admin', 'owner')
        )
    );

CREATE POLICY "Coaches can delete assignments"
    ON video_assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.team_id = video_assignments.team_id
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('coach', 'admin', 'owner')
        )
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE video_bookmarks IS 'User saved/bookmarked training videos';
COMMENT ON TABLE video_curation_status IS 'Team approval status for training videos';
COMMENT ON TABLE video_playlists IS 'Custom video playlists created by coaches';
COMMENT ON TABLE video_watch_history IS 'Tracking of video views by users';
COMMENT ON TABLE video_assignments IS 'Videos assigned to players by coaches';



-- ============================================================================
-- Migration: 051_add_service_migration_tables.sql
-- Type: database
-- ============================================================================

-- Migration: Add Tables for Supabase Direct Service Integration
-- Creates tables needed for wellness, recovery, nutrition, and performance tracking services
-- Created: 2024-12-23
-- Purpose: Support direct Supabase queries from Angular services (migration from Netlify Functions)

-- ============================================================================
-- WELLNESS ENTRIES TABLE
-- ============================================================================
-- Enhanced wellness tracking with proper column naming for Angular service
CREATE TABLE IF NOT EXISTS wellness_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Wellness metrics (0-10 scale)
    sleep_quality INTEGER CHECK (sleep_quality >= 0 AND sleep_quality <= 10),
    energy_level INTEGER CHECK (energy_level >= 0 AND energy_level <= 10),
    stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 10),
    muscle_soreness INTEGER CHECK (muscle_soreness >= 0 AND muscle_soreness <= 10),
    motivation_level INTEGER CHECK (motivation_level >= 0 AND motivation_level <= 10),
    mood INTEGER CHECK (mood >= 0 AND mood <= 10),
    hydration_level INTEGER CHECK (hydration_level >= 0 AND hydration_level <= 10),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(athlete_id, date)
);

-- ============================================================================
-- RECOVERY SESSIONS TABLE
-- ============================================================================
-- Tracks recovery protocol sessions
CREATE TABLE IF NOT EXISTS recovery_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    protocol_id VARCHAR(100) NOT NULL,
    protocol_name VARCHAR(255) NOT NULL,
    
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    stopped_at TIMESTAMP WITH TIME ZONE,
    
    duration_planned INTEGER, -- in minutes
    duration_actual INTEGER, -- in minutes
    
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, stopped
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NUTRITION LOGS TABLE
-- ============================================================================
-- Logs individual food entries
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    food_name VARCHAR(255) NOT NULL,
    food_id INTEGER, -- USDA FoodData Central ID if available
    
    -- Macronutrients
    calories DECIMAL(8,2) DEFAULT 0,
    protein DECIMAL(6,2) DEFAULT 0,
    carbohydrates DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0,
    fiber DECIMAL(6,2) DEFAULT 0,
    
    meal_type VARCHAR(50), -- breakfast, lunch, dinner, snack
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NUTRITION GOALS TABLE
-- ============================================================================
-- Stores user-specific nutrition targets
CREATE TABLE IF NOT EXISTS nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    calories_target INTEGER DEFAULT 2500,
    protein_target INTEGER DEFAULT 150,
    carbs_target INTEGER DEFAULT 300,
    fat_target INTEGER DEFAULT 80,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ============================================================================
-- SUPPLEMENT LOGS TABLE
-- ============================================================================
-- Tracks supplement intake (renamed from supplements_data for consistency)
CREATE TABLE IF NOT EXISTS supplement_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    supplement_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    taken BOOLEAN DEFAULT false,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_of_day VARCHAR(50), -- morning, afternoon, evening, pre-workout, post-workout
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE TESTS TABLE
-- ============================================================================
-- Stores athletic performance test results
CREATE TABLE IF NOT EXISTS performance_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    test_type VARCHAR(100) NOT NULL, -- e.g., '40YardDash', 'VerticalJump', etc.
    result_value DECIMAL(8,2) NOT NULL,
    target_value DECIMAL(8,2),
    
    test_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    conditions JSONB, -- test conditions (weather, venue, etc.)
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wellness_entries_athlete_date
ON wellness_entries(athlete_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_sessions_athlete_status
ON recovery_sessions(athlete_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date
ON nutrition_logs(user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_nutrition_logs_meal_type
ON nutrition_logs(user_id, meal_type, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_date
ON supplement_logs(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_performance_tests_user_type_date
ON performance_tests(user_id, test_type, test_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE wellness_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_tests ENABLE ROW LEVEL SECURITY;

-- Wellness Entries Policies
CREATE POLICY "Users can view their own wellness entries"
ON wellness_entries FOR SELECT
USING (auth.uid() = athlete_id);

CREATE POLICY "Users can insert their own wellness entries"
ON wellness_entries FOR INSERT
WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Users can update their own wellness entries"
ON wellness_entries FOR UPDATE
USING (auth.uid() = athlete_id);

CREATE POLICY "Users can delete their own wellness entries"
ON wellness_entries FOR DELETE
USING (auth.uid() = athlete_id);

-- Recovery Sessions Policies
CREATE POLICY "Users can view their own recovery sessions"
ON recovery_sessions FOR SELECT
USING (auth.uid() = athlete_id);

CREATE POLICY "Users can insert their own recovery sessions"
ON recovery_sessions FOR INSERT
WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Users can update their own recovery sessions"
ON recovery_sessions FOR UPDATE
USING (auth.uid() = athlete_id);

CREATE POLICY "Users can delete their own recovery sessions"
ON recovery_sessions FOR DELETE
USING (auth.uid() = athlete_id);

-- Nutrition Logs Policies
CREATE POLICY "Users can view their own nutrition logs"
ON nutrition_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition logs"
ON nutrition_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition logs"
ON nutrition_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition logs"
ON nutrition_logs FOR DELETE
USING (auth.uid() = user_id);

-- Nutrition Goals Policies
CREATE POLICY "Users can view their own nutrition goals"
ON nutrition_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition goals"
ON nutrition_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition goals"
ON nutrition_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition goals"
ON nutrition_goals FOR DELETE
USING (auth.uid() = user_id);

-- Supplement Logs Policies
CREATE POLICY "Users can view their own supplement logs"
ON supplement_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own supplement logs"
ON supplement_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplement logs"
ON supplement_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplement logs"
ON supplement_logs FOR DELETE
USING (auth.uid() = user_id);

-- Performance Tests Policies
CREATE POLICY "Users can view their own performance tests"
ON performance_tests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance tests"
ON performance_tests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance tests"
ON performance_tests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance tests"
ON performance_tests FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE wellness_entries IS 'Daily wellness tracking for athlete monitoring and recovery assessment';
COMMENT ON TABLE recovery_sessions IS 'Recovery protocol session tracking with timing and status';
COMMENT ON TABLE nutrition_logs IS 'Individual food intake logs with macronutrient tracking';
COMMENT ON TABLE nutrition_goals IS 'User-specific daily nutrition targets';
COMMENT ON TABLE supplement_logs IS 'Supplement intake tracking for compliance monitoring';
COMMENT ON TABLE performance_tests IS 'Athletic performance test results over time';

COMMENT ON COLUMN wellness_entries.sleep_quality IS 'Sleep quality rating (0-10 scale)';
COMMENT ON COLUMN wellness_entries.energy_level IS 'Energy level rating (0-10 scale)';
COMMENT ON COLUMN wellness_entries.stress_level IS 'Stress level rating (0-10 scale, higher = more stressed)';
COMMENT ON COLUMN wellness_entries.muscle_soreness IS 'Muscle soreness rating (0-10 scale)';
COMMENT ON COLUMN wellness_entries.motivation_level IS 'Motivation level rating (0-10 scale)';
COMMENT ON COLUMN wellness_entries.mood IS 'Overall mood rating (0-10 scale)';
COMMENT ON COLUMN wellness_entries.hydration_level IS 'Hydration level rating (0-10 scale)';

COMMENT ON COLUMN recovery_sessions.status IS 'Session status: in_progress, completed, or stopped';
COMMENT ON COLUMN recovery_sessions.duration_planned IS 'Planned duration of recovery protocol in minutes';
COMMENT ON COLUMN recovery_sessions.duration_actual IS 'Actual duration completed in minutes';

COMMENT ON COLUMN nutrition_logs.meal_type IS 'Type of meal: breakfast, lunch, dinner, or snack';
COMMENT ON COLUMN nutrition_logs.food_id IS 'USDA FoodData Central ID if available';

COMMENT ON COLUMN supplement_logs.time_of_day IS 'When supplement was taken: morning, afternoon, evening, pre-workout, post-workout';
COMMENT ON COLUMN supplement_logs.taken IS 'Whether the supplement was actually taken on this date';

COMMENT ON COLUMN performance_tests.test_type IS 'Type of test: 40YardDash, VerticalJump, BroadJump, ThreeCone, Shuttle, BenchPress, Squat, PowerClean, etc.';
COMMENT ON COLUMN performance_tests.conditions IS 'JSON object with test conditions (weather, venue, equipment, etc.)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================




-- ============================================================================
-- Migration: 052_fix_rls_performance_new_tables.sql
-- Type: database
-- ============================================================================

-- Migration: Fix RLS Performance for New Tables
-- Optimizes RLS policies by using subqueries for auth.uid()
-- This prevents re-evaluation of auth.uid() for each row
-- Applied: 2024-12-23
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================================
-- WELLNESS_ENTRIES - Fix RLS Policies (uses athlete_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own wellness entries" ON wellness_entries;
DROP POLICY IF EXISTS "Users can insert their own wellness entries" ON wellness_entries;
DROP POLICY IF EXISTS "Users can update their own wellness entries" ON wellness_entries;
DROP POLICY IF EXISTS "Users can delete their own wellness entries" ON wellness_entries;

CREATE POLICY "Users can view their own wellness entries" 
ON wellness_entries FOR SELECT 
USING ((select auth.uid()) = athlete_id);

CREATE POLICY "Users can insert their own wellness entries" 
ON wellness_entries FOR INSERT 
WITH CHECK ((select auth.uid()) = athlete_id);

CREATE POLICY "Users can update their own wellness entries" 
ON wellness_entries FOR UPDATE 
USING ((select auth.uid()) = athlete_id);

CREATE POLICY "Users can delete their own wellness entries" 
ON wellness_entries FOR DELETE 
USING ((select auth.uid()) = athlete_id);

-- ============================================================================
-- RECOVERY_SESSIONS - Fix RLS Policies (uses athlete_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own recovery sessions" ON recovery_sessions;
DROP POLICY IF EXISTS "Users can insert their own recovery sessions" ON recovery_sessions;
DROP POLICY IF EXISTS "Users can update their own recovery sessions" ON recovery_sessions;
DROP POLICY IF EXISTS "Users can delete their own recovery sessions" ON recovery_sessions;

CREATE POLICY "Users can view their own recovery sessions" 
ON recovery_sessions FOR SELECT 
USING ((select auth.uid()) = athlete_id);

CREATE POLICY "Users can insert their own recovery sessions" 
ON recovery_sessions FOR INSERT 
WITH CHECK ((select auth.uid()) = athlete_id);

CREATE POLICY "Users can update their own recovery sessions" 
ON recovery_sessions FOR UPDATE 
USING ((select auth.uid()) = athlete_id);

CREATE POLICY "Users can delete their own recovery sessions" 
ON recovery_sessions FOR DELETE 
USING ((select auth.uid()) = athlete_id);

-- ============================================================================
-- NUTRITION_LOGS - Fix RLS Policies (uses user_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can insert their own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can update their own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can delete their own nutrition logs" ON nutrition_logs;

CREATE POLICY "Users can view their own nutrition logs" 
ON nutrition_logs FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own nutrition logs" 
ON nutrition_logs FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own nutrition logs" 
ON nutrition_logs FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own nutrition logs" 
ON nutrition_logs FOR DELETE 
USING ((select auth.uid()) = user_id);

-- ============================================================================
-- NUTRITION_GOALS - Fix RLS Policies (uses user_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can insert their own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can update their own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can delete their own nutrition goals" ON nutrition_goals;

CREATE POLICY "Users can view their own nutrition goals" 
ON nutrition_goals FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own nutrition goals" 
ON nutrition_goals FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own nutrition goals" 
ON nutrition_goals FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own nutrition goals" 
ON nutrition_goals FOR DELETE 
USING ((select auth.uid()) = user_id);

-- ============================================================================
-- SUPPLEMENT_LOGS - Fix RLS Policies (uses user_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own supplement logs" ON supplement_logs;
DROP POLICY IF EXISTS "Users can insert their own supplement logs" ON supplement_logs;
DROP POLICY IF EXISTS "Users can update their own supplement logs" ON supplement_logs;
DROP POLICY IF EXISTS "Users can delete their own supplement logs" ON supplement_logs;

CREATE POLICY "Users can view their own supplement logs" 
ON supplement_logs FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own supplement logs" 
ON supplement_logs FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own supplement logs" 
ON supplement_logs FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own supplement logs" 
ON supplement_logs FOR DELETE 
USING ((select auth.uid()) = user_id);

-- ============================================================================
-- PERFORMANCE_TESTS - Fix RLS Policies (uses user_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own performance tests" ON performance_tests;
DROP POLICY IF EXISTS "Users can insert their own performance tests" ON performance_tests;
DROP POLICY IF EXISTS "Users can update their own performance tests" ON performance_tests;
DROP POLICY IF EXISTS "Users can delete their own performance tests" ON performance_tests;

CREATE POLICY "Users can view their own performance tests" 
ON performance_tests FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own performance tests" 
ON performance_tests FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own performance tests" 
ON performance_tests FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own performance tests" 
ON performance_tests FOR DELETE 
USING ((select auth.uid()) = user_id);




-- ============================================================================
-- Migration: 053_ai_safety_tier_system.sql
-- Type: database
-- ============================================================================

-- Migration: AI Safety Tier System
-- Based on: AI_COACHING_SYSTEM_REVAMP.md
-- Creates tables for AI chat sessions, messages, recommendations, feedback, and coach visibility

-- =====================================================
-- AI CHAT SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  context_snapshot JSONB DEFAULT '{}',
  goal VARCHAR(500),
  time_horizon VARCHAR(50) CHECK (time_horizon IN ('immediate', 'weekly', 'monthly', 'seasonal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_team ON ai_chat_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_started ON ai_chat_sessions(started_at DESC);

-- =====================================================
-- AI MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
  intent VARCHAR(50),
  citations JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_risk ON ai_messages(risk_level);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_messages(created_at DESC);

-- =====================================================
-- AI RECOMMENDATIONS TABLE
-- Tracks actionable recommendations from AI
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE SET NULL,
  message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
  recommendation_type VARCHAR(50) NOT NULL CHECK (
    recommendation_type IN (
      'create_session', 
      'modify_plan', 
      'add_exercise', 
      'read_article', 
      'ask_coach',
      'schedule_recovery',
      'reduce_load',
      'increase_load'
    )
  ),
  reason TEXT NOT NULL,
  recommendation_data JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected', 'completed', 'expired')
  ),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_session ON ai_recommendations(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created ON ai_recommendations(created_at DESC);

-- =====================================================
-- AI FEEDBACK TABLE
-- User feedback on AI responses
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE SET NULL,
  message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL CHECK (
    feedback_type IN (
      'thumbs_up', 
      'thumbs_down', 
      'helpful', 
      'not_helpful', 
      'incorrect', 
      'unsafe',
      'too_generic',
      'too_specific'
    )
  ),
  feedback_reason TEXT,
  outcome TEXT,
  flagged_for_review BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_message ON ai_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_flagged ON ai_feedback(flagged_for_review) WHERE flagged_for_review = TRUE;

-- =====================================================
-- AI COACH VISIBILITY TABLE
-- Coach visibility into player AI interactions
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_coach_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES ai_recommendations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES ai_messages(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  visibility_type VARCHAR(50) NOT NULL CHECK (
    visibility_type IN ('risk_warning', 'recommendation', 'override', 'note')
  ),
  coach_notes TEXT,
  override_reason TEXT,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_coach_visibility_coach ON ai_coach_visibility(coach_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_visibility_player ON ai_coach_visibility(player_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_visibility_team ON ai_coach_visibility(team_id);
CREATE INDEX IF NOT EXISTS idx_ai_coach_visibility_type ON ai_coach_visibility(visibility_type);

-- =====================================================
-- KNOWLEDGE BASE TABLE (Create if not exists)
-- This table stores curated knowledge for AI responses
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_base_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  source_type VARCHAR(50) CHECK (source_type IN ('curated', 'trusted', 'web', 'internal')),
  source_url TEXT,
  source_title VARCHAR(500),
  publication_date DATE,
  evidence_grade VARCHAR(10) CHECK (evidence_grade IN ('A', 'B', 'C', 'D')),
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'low',
  requires_professional BOOLEAN DEFAULT FALSE,
  requires_labs BOOLEAN DEFAULT FALSE,
  source_quality_score DECIMAL(3,2) CHECK (source_quality_score >= 0 AND source_quality_score <= 1) DEFAULT 0.5,
  query_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base_entries(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_risk_level ON knowledge_base_entries(risk_level);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_evidence ON knowledge_base_entries(evidence_grade);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON knowledge_base_entries(is_active) WHERE is_active = TRUE;

-- Enable RLS on knowledge_base_entries
ALTER TABLE knowledge_base_entries ENABLE ROW LEVEL SECURITY;

-- Everyone can read knowledge base entries
CREATE POLICY "Anyone can read knowledge base"
  ON knowledge_base_entries FOR SELECT
  USING (is_active = TRUE);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_visibility ENABLE ROW LEVEL SECURITY;

-- AI Chat Sessions: Users can see their own sessions
CREATE POLICY "Users can view own chat sessions"
  ON ai_chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
  ON ai_chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON ai_chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- AI Messages: Users can see their own messages
CREATE POLICY "Users can view own messages"
  ON ai_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages"
  ON ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AI Recommendations: Users can see and update their own recommendations
CREATE POLICY "Users can view own recommendations"
  ON ai_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recommendations"
  ON ai_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON ai_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- AI Feedback: Users can manage their own feedback
CREATE POLICY "Users can view own feedback"
  ON ai_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own feedback"
  ON ai_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AI Coach Visibility: Coaches can see their players' data
CREATE POLICY "Coaches can view their players AI data"
  ON ai_coach_visibility FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "System can create coach visibility records"
  ON ai_coach_visibility FOR INSERT
  WITH CHECK (TRUE); -- Handled by backend

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'ai_chat_sessions_updated_at'
  ) THEN
    CREATE TRIGGER ai_chat_sessions_updated_at
      BEFORE UPDATE ON ai_chat_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE ai_chat_sessions IS 'Stores AI chat sessions with context snapshots';
COMMENT ON TABLE ai_messages IS 'Stores individual messages in AI chat sessions with risk classification';
COMMENT ON TABLE ai_recommendations IS 'Tracks actionable AI recommendations with acceptance/rejection status';
COMMENT ON TABLE ai_feedback IS 'User feedback on AI responses for continuous improvement';
COMMENT ON TABLE ai_coach_visibility IS 'Coach visibility into player AI interactions for team contexts';

COMMENT ON COLUMN ai_messages.risk_level IS 'Safety tier: low (general training), medium (injury/recovery), high (supplements/medical)';
COMMENT ON COLUMN ai_recommendations.recommendation_type IS 'Type of action recommended by AI';
COMMENT ON COLUMN ai_feedback.flagged_for_review IS 'TRUE if feedback indicates unsafe or incorrect response';




-- ============================================================================
-- Migration: 054_training_video_visibility_system.sql
-- Type: database
-- ============================================================================

-- Migration: Training Video Visibility System
-- Purpose: Create training_videos table with visibility rules for drills:
--   1. Players can add videos for themselves (private - only they can see)
--   2. Coaches/Admins can add videos visible to everyone (public)
--   3. Coaches/Admins/Physiotherapists can assign videos to specific athletes (assigned - only that athlete + staff can see)
--   4. Assigned drills trigger periodization recalculation for the target athlete
--
-- VISIBILITY RULES SUMMARY:
-- ┌─────────────────┬──────────────────────────────────────────────────────────────┐
-- │ visibility_type │ Who can see                                                  │
-- ├─────────────────┼──────────────────────────────────────────────────────────────┤
-- │ private         │ Only the player who created it (created_by = current_user)  │
-- │ public          │ Everyone (all authenticated users)                          │
-- │ assigned        │ Target player (target_player_id) + all staff members        │
-- └─────────────────┴──────────────────────────────────────────────────────────────┘
--
-- INSERTION RULES:
-- - Players can ONLY insert 'private' videos for themselves
-- - Staff (coach/admin/physiotherapist) can insert any type

-- =====================================================
-- STEP 1: CREATE TRAINING_VIDEOS TABLE WITH VISIBILITY
-- =====================================================

CREATE TABLE IF NOT EXISTS training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INTEGER,
  category VARCHAR(100), -- 'Exercise Demo', 'Technique', 'Position-Specific', 'Warm-up', 'Drill'
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  tags TEXT[], -- ['QB', 'Throwing Mechanics', 'Arm Care']
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Visibility system
  visibility_type VARCHAR(20) DEFAULT 'public' CHECK (visibility_type IN ('private', 'public', 'assigned')),
  target_player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignment_notes TEXT,
  assignment_date TIMESTAMPTZ,
  
  -- Periodization impact
  affects_periodization BOOLEAN DEFAULT FALSE,
  estimated_load INTEGER DEFAULT 0,
  
  -- Scheduling
  due_date DATE,
  completion_status VARCHAR(20) DEFAULT 'pending' CHECK (completion_status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_training_videos_position ON training_videos(position_id);
CREATE INDEX IF NOT EXISTS idx_training_videos_exercise ON training_videos(exercise_id);
CREATE INDEX IF NOT EXISTS idx_training_videos_category ON training_videos(category);
CREATE INDEX IF NOT EXISTS idx_training_videos_visibility ON training_videos(visibility_type);
CREATE INDEX IF NOT EXISTS idx_training_videos_target_player ON training_videos(target_player_id);
CREATE INDEX IF NOT EXISTS idx_training_videos_assigned_by ON training_videos(assigned_by);
CREATE INDEX IF NOT EXISTS idx_training_videos_created_by ON training_videos(created_by);
CREATE INDEX IF NOT EXISTS idx_training_videos_due_date ON training_videos(due_date);
CREATE INDEX IF NOT EXISTS idx_training_videos_completion ON training_videos(completion_status);

-- Composite index for common query pattern (player's visible videos)
CREATE INDEX IF NOT EXISTS idx_training_videos_player_visibility 
ON training_videos(target_player_id, visibility_type, created_by);

-- =====================================================
-- STEP 3: ENABLE RLS AND CREATE POLICIES
-- =====================================================

ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is staff (coach, admin, physiotherapist)
CREATE OR REPLACE FUNCTION is_staff_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' IN ('coach', 'admin', 'physiotherapist'),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, auth;

COMMENT ON FUNCTION is_staff_role() IS 'Returns true if the current user has a staff role (coach, admin, or physiotherapist)';

-- SELECT Policy: Complex visibility rules
-- Users can see:
--   1. PUBLIC videos (visibility_type = 'public')
--   2. Their OWN private videos (visibility_type = 'private' AND created_by = current_user)
--   3. Videos ASSIGNED to them (visibility_type = 'assigned' AND target_player_id = current_user)
--   4. Staff can see ALL videos
CREATE POLICY "training_videos_select_policy"
ON training_videos FOR SELECT
USING (
  -- Public videos are visible to everyone
  visibility_type = 'public'
  OR
  -- Private videos are only visible to the creator
  (visibility_type = 'private' AND created_by = (SELECT auth.uid()))
  OR
  -- Assigned videos are visible to the target player
  (visibility_type = 'assigned' AND target_player_id = (SELECT auth.uid()))
  OR
  -- Staff (coaches, admins, physiotherapists) can see all videos
  is_staff_role()
);

-- INSERT Policy: 
-- Players can only create private videos for themselves
-- Staff can create any type of video
CREATE POLICY "training_videos_insert_policy"
ON training_videos FOR INSERT
WITH CHECK (
  -- Staff can insert any video
  is_staff_role()
  OR
  -- Players can only insert private videos for themselves
  (
    visibility_type = 'private' 
    AND created_by = (SELECT auth.uid())
    AND target_player_id IS NULL
  )
);

-- UPDATE Policy:
-- Players can only update their own private videos
-- Staff can update any video
CREATE POLICY "training_videos_update_policy"
ON training_videos FOR UPDATE
USING (
  is_staff_role()
  OR
  (visibility_type = 'private' AND created_by = (SELECT auth.uid()))
)
WITH CHECK (
  is_staff_role()
  OR
  (visibility_type = 'private' AND created_by = (SELECT auth.uid()))
);

-- DELETE Policy:
-- Players can only delete their own private videos
-- Staff can delete any video
CREATE POLICY "training_videos_delete_policy"
ON training_videos FOR DELETE
USING (
  is_staff_role()
  OR
  (visibility_type = 'private' AND created_by = (SELECT auth.uid()))
);

-- =====================================================
-- STEP 4: CREATE ATHLETE DRILL ASSIGNMENTS TABLE
-- =====================================================
-- This table tracks drill/video assignments with more detail
-- and links to periodization recalculation

CREATE TABLE IF NOT EXISTS athlete_drill_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Assignment details
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  video_id UUID REFERENCES training_videos(id) ON DELETE SET NULL,
  
  -- Drill details (can be independent of video)
  drill_name VARCHAR(255) NOT NULL,
  drill_description TEXT,
  drill_category VARCHAR(100), -- 'Speed', 'Agility', 'Strength', 'Skills', 'Recovery'
  
  -- Load and periodization impact
  estimated_duration_minutes INTEGER DEFAULT 15,
  estimated_rpe INTEGER DEFAULT 5 CHECK (estimated_rpe >= 1 AND estimated_rpe <= 10),
  estimated_load INTEGER GENERATED ALWAYS AS (estimated_duration_minutes * estimated_rpe) STORED,
  affects_periodization BOOLEAN DEFAULT TRUE,
  
  -- Scheduling
  assigned_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  target_session_date DATE,
  
  -- Completion tracking
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'viewed', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  actual_rpe INTEGER CHECK (actual_rpe >= 1 AND actual_rpe <= 10),
  actual_load INTEGER,
  
  -- Feedback
  athlete_notes TEXT,
  coach_feedback TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_athlete_drill_assignments_athlete ON athlete_drill_assignments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_drill_assignments_assigned_by ON athlete_drill_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_athlete_drill_assignments_video ON athlete_drill_assignments(video_id);
CREATE INDEX IF NOT EXISTS idx_athlete_drill_assignments_status ON athlete_drill_assignments(status);
CREATE INDEX IF NOT EXISTS idx_athlete_drill_assignments_due_date ON athlete_drill_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_athlete_drill_assignments_date ON athlete_drill_assignments(target_session_date);

-- Enable RLS
ALTER TABLE athlete_drill_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for athlete_drill_assignments
-- Athletes can see their own assignments
CREATE POLICY "Athletes can view own drill assignments"
ON athlete_drill_assignments FOR SELECT
USING (
  athlete_id = (SELECT auth.uid())
  OR
  is_staff_role()
);

-- Only staff can create assignments
CREATE POLICY "Staff can create drill assignments"
ON athlete_drill_assignments FOR INSERT
WITH CHECK (is_staff_role());

-- Athletes can update their own (status, completion, notes)
-- Staff can update any
CREATE POLICY "Athletes and staff can update assignments"
ON athlete_drill_assignments FOR UPDATE
USING (
  athlete_id = (SELECT auth.uid())
  OR
  is_staff_role()
)
WITH CHECK (
  athlete_id = (SELECT auth.uid())
  OR
  is_staff_role()
);

-- Only staff can delete
CREATE POLICY "Staff can delete drill assignments"
ON athlete_drill_assignments FOR DELETE
USING (is_staff_role());

-- =====================================================
-- STEP 5: TRIGGERS FOR PERIODIZATION RECALCULATION
-- =====================================================

-- Function to notify periodization recalculation when drill is assigned
CREATE OR REPLACE FUNCTION notify_periodization_recalculation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if affects_periodization is true
  IF NEW.affects_periodization = TRUE THEN
    -- Insert a notification for the athlete
    INSERT INTO public.notifications (
      user_id, 
      notification_type, 
      message, 
      priority,
      created_at
    ) VALUES (
      NEW.athlete_id,
      'training',
      'New drill assigned: ' || NEW.drill_name || '. Your training load has been updated.',
      'medium',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Trigger on insert
DROP TRIGGER IF EXISTS trigger_periodization_on_drill_assignment ON athlete_drill_assignments;
CREATE TRIGGER trigger_periodization_on_drill_assignment
AFTER INSERT ON athlete_drill_assignments
FOR EACH ROW
EXECUTE FUNCTION notify_periodization_recalculation();

-- Function to update load when drill is completed
CREATE OR REPLACE FUNCTION update_load_on_drill_completion()
RETURNS TRIGGER AS $$
DECLARE
  load_value INTEGER;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate actual load
    IF NEW.actual_duration_minutes IS NOT NULL AND NEW.actual_rpe IS NOT NULL THEN
      load_value := NEW.actual_duration_minutes * NEW.actual_rpe;
    ELSE
      load_value := NEW.estimated_load;
    END IF;
    
    -- Update the actual_load field
    NEW.actual_load := load_value;
    NEW.completed_at := COALESCE(NEW.completed_at, NOW());
    
    -- If affects_periodization, update load_daily
    IF NEW.affects_periodization = TRUE THEN
      INSERT INTO public.load_daily (player_id, date, daily_load)
      VALUES (
        NEW.athlete_id, 
        COALESCE(NEW.target_session_date, CURRENT_DATE), 
        load_value
      )
      ON CONFLICT (player_id, date) 
      DO UPDATE SET 
        daily_load = public.load_daily.daily_load + EXCLUDED.daily_load,
        updated_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Trigger on update
DROP TRIGGER IF EXISTS trigger_load_on_drill_completion ON athlete_drill_assignments;
CREATE TRIGGER trigger_load_on_drill_completion
BEFORE UPDATE ON athlete_drill_assignments
FOR EACH ROW
EXECUTE FUNCTION update_load_on_drill_completion();

-- =====================================================
-- STEP 6: COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE training_videos IS 'Library of training videos with visibility controls (private/public/assigned)';

COMMENT ON COLUMN training_videos.visibility_type IS 
  'Video visibility: private (only creator), public (everyone), assigned (specific athlete + staff)';

COMMENT ON COLUMN training_videos.target_player_id IS 
  'For assigned videos, the specific athlete who should see this video';

COMMENT ON COLUMN training_videos.assigned_by IS 
  'Staff member who assigned this video to an athlete';

COMMENT ON COLUMN training_videos.affects_periodization IS 
  'Whether completing this drill should update the athlete''s training load';

COMMENT ON COLUMN training_videos.estimated_load IS 
  'Estimated training load contribution (RPE * duration)';

COMMENT ON TABLE athlete_drill_assignments IS 
  'Tracks drill/video assignments from staff to specific athletes with load tracking';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- 1. Created training_videos table with visibility_type column (private/public/assigned)
-- 2. Added target_player_id for assigned videos
-- 3. Created is_staff_role() helper function
-- 4. Created RLS policies enforcing visibility rules:
--    - Players see: public + their private + assigned to them
--    - Staff see: everything
--    - Players can only insert private videos
--    - Staff can insert any type
-- 5. Created athlete_drill_assignments table for detailed assignment tracking
-- 6. Created triggers to:
--    - Notify athlete when drill is assigned
--    - Update periodization (load_daily) when drill is completed



-- ============================================================================
-- Migration: 055_superadmin_approval_system.sql
-- Type: database
-- ============================================================================

-- Migration: Superadmin Approval System
-- Purpose: Restrict app access to approved teams and admins only
-- 
-- BUSINESS LOGIC:
-- 1. New teams require SUPERADMIN approval before becoming active
-- 2. Team admins/coaches require SUPERADMIN approval before gaining privileges
-- 3. Only approved teams and their approved admins can fully use the app
-- 4. This keeps the platform exclusive for serious Olympic-track athletes (LA28, Brisbane 2032)
--
-- APPROVAL WORKFLOW:
-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 1. User creates a team → Team status = 'pending_approval'              │
-- │ 2. Superadmin reviews → Approves/Rejects team                          │
-- │ 3. If approved → Team status = 'approved', creator becomes admin       │
-- │ 4. Admin invites members → Members join with 'player' role             │
-- │ 5. Admin promotes user to coach/admin → Requires superadmin approval   │
-- └─────────────────────────────────────────────────────────────────────────┘

-- =====================================================
-- STEP 1: ADD APPROVAL COLUMNS TO TEAMS TABLE
-- =====================================================

-- Add approval status to teams
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'pending_approval' 
  CHECK (approval_status IN ('pending_approval', 'approved', 'rejected', 'suspended'));

-- Add approval metadata
ALTER TABLE teams ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS application_notes TEXT; -- Notes from team creator

-- Add Olympic track indicator
ALTER TABLE teams ADD COLUMN IF NOT EXISTS olympic_track VARCHAR(30) 
  CHECK (olympic_track IN ('la_2028', 'brisbane_2032', 'both', 'domestic_only'));

-- =====================================================
-- STEP 2: ADD APPROVAL STATUS TO TEAM_MEMBERS FOR ADMIN ROLES
-- =====================================================

-- Add approval status for elevated roles (admin, coach)
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS role_approval_status VARCHAR(30) DEFAULT 'approved'
  CHECK (role_approval_status IN ('pending_approval', 'approved', 'rejected'));

-- Add approval metadata
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role_approved_at TIMESTAMPTZ;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role_rejection_reason TEXT;

-- Note: Players don't need approval, only admin/coach roles do

-- =====================================================
-- STEP 3: CREATE SUPERADMIN TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS superadmins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  
  UNIQUE(user_id)
);

-- Enable RLS on superadmins table
ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view the superadmins table
CREATE POLICY "Superadmins can view superadmin list"
ON superadmins FOR SELECT
USING (is_superadmin());

-- Only existing superadmins can add new superadmins
CREATE POLICY "Superadmins can manage superadmin list"
ON superadmins FOR ALL
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- =====================================================
-- STEP 4: CREATE APPROVAL REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request type
  request_type VARCHAR(30) NOT NULL CHECK (request_type IN ('team_creation', 'role_elevation', 'team_reinstatement')),
  
  -- What's being requested
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User requesting or being elevated
  requested_role VARCHAR(30), -- For role_elevation requests
  
  -- Request details
  request_reason TEXT,
  olympic_goals TEXT, -- Why they want to use the platform (Olympic preparation)
  experience_level TEXT,
  federation_affiliation TEXT, -- National federation they're affiliated with
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed')),
  
  -- Review
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_type ON approval_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_team ON approval_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_user ON approval_requests(user_id);

-- Enable RLS
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
CREATE POLICY "Users can view own approval requests"
ON approval_requests FOR SELECT
USING (user_id = (SELECT auth.uid()) OR is_superadmin());

-- Users can create requests
CREATE POLICY "Users can create approval requests"
ON approval_requests FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

-- Only superadmins can update (approve/reject)
CREATE POLICY "Superadmins can update approval requests"
ON approval_requests FOR UPDATE
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- =====================================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to check if current user is a superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.superadmins 
    WHERE user_id = (SELECT auth.uid()) 
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, auth;

COMMENT ON FUNCTION is_superadmin() IS 'Returns true if the current user is an active superadmin';

-- Function to check if a team is approved
CREATE OR REPLACE FUNCTION is_team_approved(p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = p_team_id 
    AND approval_status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

COMMENT ON FUNCTION is_team_approved(UUID) IS 'Returns true if the specified team is approved';

-- Function to check if user has approved admin role in team
CREATE OR REPLACE FUNCTION has_approved_admin_role(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = p_team_id 
    AND user_id = p_user_id
    AND role IN ('admin', 'coach')
    AND role_approval_status = 'approved'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

COMMENT ON FUNCTION has_approved_admin_role(UUID, UUID) IS 'Returns true if user has an approved admin/coach role in the team';

-- =====================================================
-- STEP 6: FUNCTION TO APPROVE A TEAM
-- =====================================================

CREATE OR REPLACE FUNCTION approve_team(
  p_team_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  -- Only superadmins can approve
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can approve teams';
  END IF;
  
  -- Update team status
  UPDATE public.teams
  SET 
    approval_status = 'approved',
    approved_by = (SELECT auth.uid()),
    approved_at = NOW()
  WHERE id = p_team_id AND approval_status = 'pending_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found or not in pending status';
  END IF;
  
  -- Get the team creator (coach_id)
  SELECT coach_id INTO v_creator_id FROM public.teams WHERE id = p_team_id;
  
  -- Auto-approve the creator's admin role
  IF v_creator_id IS NOT NULL THEN
    UPDATE public.team_members
    SET 
      role_approval_status = 'approved',
      role_approved_by = (SELECT auth.uid()),
      role_approved_at = NOW()
    WHERE team_id = p_team_id AND user_id = v_creator_id AND role IN ('admin', 'coach');
  END IF;
  
  -- Update the approval request
  UPDATE public.approval_requests
  SET 
    status = 'approved',
    reviewed_by = (SELECT auth.uid()),
    reviewed_at = NOW(),
    review_notes = p_notes,
    updated_at = NOW()
  WHERE team_id = p_team_id AND request_type = 'team_creation' AND status = 'pending';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- =====================================================
-- STEP 7: FUNCTION TO REJECT A TEAM
-- =====================================================

CREATE OR REPLACE FUNCTION reject_team(
  p_team_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only superadmins can reject
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can reject teams';
  END IF;
  
  -- Update team status
  UPDATE public.teams
  SET 
    approval_status = 'rejected',
    approved_by = (SELECT auth.uid()),
    approved_at = NOW(),
    rejection_reason = p_reason
  WHERE id = p_team_id AND approval_status = 'pending_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found or not in pending status';
  END IF;
  
  -- Update the approval request
  UPDATE public.approval_requests
  SET 
    status = 'rejected',
    reviewed_by = (SELECT auth.uid()),
    reviewed_at = NOW(),
    review_notes = p_reason,
    updated_at = NOW()
  WHERE team_id = p_team_id AND request_type = 'team_creation' AND status = 'pending';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- =====================================================
-- STEP 8: FUNCTION TO APPROVE ADMIN/COACH ROLE
-- =====================================================

CREATE OR REPLACE FUNCTION approve_admin_role(
  p_team_id UUID,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only superadmins can approve
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Only superadmins can approve admin roles';
  END IF;
  
  -- Update role approval status
  UPDATE public.team_members
  SET 
    role_approval_status = 'approved',
    role_approved_by = (SELECT auth.uid()),
    role_approved_at = NOW()
  WHERE team_id = p_team_id 
    AND user_id = p_user_id 
    AND role IN ('admin', 'coach')
    AND role_approval_status = 'pending_approval';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team member not found or not pending admin approval';
  END IF;
  
  -- Update the approval request
  UPDATE public.approval_requests
  SET 
    status = 'approved',
    reviewed_by = (SELECT auth.uid()),
    reviewed_at = NOW(),
    review_notes = p_notes,
    updated_at = NOW()
  WHERE team_id = p_team_id 
    AND user_id = p_user_id 
    AND request_type = 'role_elevation' 
    AND status = 'pending';
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- =====================================================
-- STEP 9: UPDATE RLS POLICIES FOR TEAMS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Teams are viewable by members" ON teams;
DROP POLICY IF EXISTS "Coaches can manage their teams" ON teams;
DROP POLICY IF EXISTS "Users can view teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;

-- SELECT: Users can see approved teams they're members of, OR pending teams they created
-- Superadmins can see all teams
CREATE POLICY "teams_select_policy"
ON teams FOR SELECT
USING (
  is_superadmin()
  OR
  (
    approval_status = 'approved' 
    AND EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_id = (SELECT auth.uid())
      AND team_members.status = 'active'
    )
  )
  OR
  (
    -- Creator can see their pending team
    coach_id = (SELECT auth.uid())
  )
);

-- INSERT: Anyone can create a team (but it starts as pending)
CREATE POLICY "teams_insert_policy"
ON teams FOR INSERT
WITH CHECK (
  -- Set creator as coach_id
  coach_id = (SELECT auth.uid())
  -- Must start as pending_approval
  AND approval_status = 'pending_approval'
);

-- UPDATE: Only approved admins of approved teams can update, OR superadmins
CREATE POLICY "teams_update_policy"
ON teams FOR UPDATE
USING (
  is_superadmin()
  OR
  (
    is_team_approved(id)
    AND has_approved_admin_role(id, (SELECT auth.uid()))
  )
)
WITH CHECK (
  is_superadmin()
  OR
  (
    is_team_approved(id)
    AND has_approved_admin_role(id, (SELECT auth.uid()))
    -- Non-superadmins cannot change approval_status
    AND approval_status = (SELECT approval_status FROM teams WHERE id = teams.id)
  )
);

-- DELETE: Only superadmins can delete teams
CREATE POLICY "teams_delete_policy"
ON teams FOR DELETE
USING (is_superadmin());

-- =====================================================
-- STEP 10: UPDATE RLS POLICIES FOR TEAM_MEMBERS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Team members viewable by team" ON team_members;
DROP POLICY IF EXISTS "Team admins can manage members" ON team_members;

-- SELECT: Members can see other members of approved teams they belong to
CREATE POLICY "team_members_select_policy"
ON team_members FOR SELECT
USING (
  is_superadmin()
  OR
  (
    is_team_approved(team_id)
    AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
    )
  )
);

-- INSERT: Approved admins of approved teams can add members
-- New admin/coach roles start as pending_approval
CREATE POLICY "team_members_insert_policy"
ON team_members FOR INSERT
WITH CHECK (
  is_superadmin()
  OR
  (
    is_team_approved(team_id)
    AND has_approved_admin_role(team_id, (SELECT auth.uid()))
    -- If adding admin/coach role, must be pending approval
    AND (
      role NOT IN ('admin', 'coach')
      OR role_approval_status = 'pending_approval'
    )
  )
);

-- UPDATE: Approved admins can update members, but role changes to admin/coach need approval
CREATE POLICY "team_members_update_policy"
ON team_members FOR UPDATE
USING (
  is_superadmin()
  OR
  (
    is_team_approved(team_id)
    AND has_approved_admin_role(team_id, (SELECT auth.uid()))
  )
)
WITH CHECK (
  is_superadmin()
  OR
  (
    is_team_approved(team_id)
    AND has_approved_admin_role(team_id, (SELECT auth.uid()))
    -- If changing role to admin/coach, must set pending approval
    AND (
      role NOT IN ('admin', 'coach')
      OR role_approval_status = 'pending_approval'
    )
  )
);

-- DELETE: Approved admins can remove members
CREATE POLICY "team_members_delete_policy"
ON team_members FOR DELETE
USING (
  is_superadmin()
  OR
  (
    is_team_approved(team_id)
    AND has_approved_admin_role(team_id, (SELECT auth.uid()))
  )
);

-- =====================================================
-- STEP 11: TRIGGER TO CREATE APPROVAL REQUEST ON TEAM CREATION
-- =====================================================

CREATE OR REPLACE FUNCTION create_team_approval_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Create an approval request when a new team is created
  INSERT INTO public.approval_requests (
    request_type,
    team_id,
    user_id,
    request_reason,
    olympic_goals,
    status
  ) VALUES (
    'team_creation',
    NEW.id,
    NEW.coach_id,
    NEW.application_notes,
    CASE 
      WHEN NEW.olympic_track IS NOT NULL THEN 'Olympic Track: ' || NEW.olympic_track
      ELSE NULL
    END,
    'pending'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trigger_team_approval_request ON teams;
CREATE TRIGGER trigger_team_approval_request
AFTER INSERT ON teams
FOR EACH ROW
WHEN (NEW.approval_status = 'pending_approval')
EXECUTE FUNCTION create_team_approval_request();

-- =====================================================
-- STEP 12: TRIGGER TO CREATE APPROVAL REQUEST ON ROLE ELEVATION
-- =====================================================

CREATE OR REPLACE FUNCTION create_role_elevation_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Create an approval request when someone is promoted to admin/coach
  IF NEW.role IN ('admin', 'coach') AND NEW.role_approval_status = 'pending_approval' THEN
    INSERT INTO public.approval_requests (
      request_type,
      team_id,
      user_id,
      requested_role,
      status
    ) VALUES (
      'role_elevation',
      NEW.team_id,
      NEW.user_id,
      NEW.role,
      'pending'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trigger_role_elevation_request ON team_members;
CREATE TRIGGER trigger_role_elevation_request
AFTER INSERT OR UPDATE OF role ON team_members
FOR EACH ROW
WHEN (NEW.role IN ('admin', 'coach') AND NEW.role_approval_status = 'pending_approval')
EXECUTE FUNCTION create_role_elevation_request();

-- =====================================================
-- STEP 13: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_teams_approval_status ON teams(approval_status);
CREATE INDEX IF NOT EXISTS idx_teams_approved_by ON teams(approved_by);
CREATE INDEX IF NOT EXISTS idx_teams_olympic_track ON teams(olympic_track);

CREATE INDEX IF NOT EXISTS idx_team_members_role_approval ON team_members(role_approval_status);
CREATE INDEX IF NOT EXISTS idx_team_members_role_approved_by ON team_members(role_approved_by);

CREATE INDEX IF NOT EXISTS idx_superadmins_user ON superadmins(user_id);
CREATE INDEX IF NOT EXISTS idx_superadmins_active ON superadmins(is_active);

-- =====================================================
-- STEP 14: SUPERADMIN DASHBOARD VIEW
-- =====================================================

CREATE OR REPLACE VIEW pending_approvals_dashboard AS
SELECT 
  ar.id,
  ar.request_type,
  ar.status,
  ar.created_at,
  ar.request_reason,
  ar.olympic_goals,
  ar.federation_affiliation,
  -- Team info
  t.name AS team_name,
  t.team_type,
  t.country_code,
  t.olympic_track,
  -- User info
  u.email AS requester_email,
  u.first_name || ' ' || u.last_name AS requester_name,
  -- For role elevation
  ar.requested_role
FROM approval_requests ar
LEFT JOIN teams t ON ar.team_id = t.id
LEFT JOIN users u ON ar.user_id = u.id
WHERE ar.status = 'pending'
ORDER BY ar.created_at ASC;

-- Only superadmins can access this view
GRANT SELECT ON pending_approvals_dashboard TO authenticated;

-- =====================================================
-- STEP 15: COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE superadmins IS 'Tracks users with superadmin privileges who can approve teams and admin roles';

COMMENT ON TABLE approval_requests IS 'Queue of pending approvals for teams and admin role elevations';

COMMENT ON COLUMN teams.approval_status IS 'Team approval status: pending_approval (default), approved, rejected, suspended';

COMMENT ON COLUMN teams.olympic_track IS 'Which Olympic games the team is preparing for: la_2028, brisbane_2032, both, or domestic_only';

COMMENT ON COLUMN team_members.role_approval_status IS 'For admin/coach roles, whether the role has been approved by superadmin';

COMMENT ON FUNCTION approve_team(UUID, TEXT) IS 'Superadmin function to approve a pending team';

COMMENT ON FUNCTION reject_team(UUID, TEXT) IS 'Superadmin function to reject a pending team with reason';

COMMENT ON FUNCTION approve_admin_role(UUID, UUID, TEXT) IS 'Superadmin function to approve an admin/coach role elevation';

-- =====================================================
-- STEP 16: SET EXISTING TEAMS TO APPROVED (MIGRATION)
-- =====================================================

-- Approve all existing teams (grandfathered in)
UPDATE teams 
SET approval_status = 'approved', approved_at = NOW()
WHERE approval_status IS NULL OR approval_status = 'pending_approval';

-- Approve all existing admin/coach roles
UPDATE team_members 
SET role_approval_status = 'approved', role_approved_at = NOW()
WHERE role IN ('admin', 'coach') 
AND (role_approval_status IS NULL OR role_approval_status = 'pending_approval');

-- =====================================================
-- STEP 17: ADD FOUNDING SUPERADMIN
-- =====================================================

-- IMPORTANT: Only aljosa@ljubljanafrogs.si is the founding superadmin.
-- Only existing superadmins can add new superadmins (enforced by RLS).
-- This ensures the platform remains exclusive for Olympic-track athletes.

-- Note: The actual INSERT is done via SQL after migration since we need the auth.users id.
-- Run this manually or via seed script:
-- INSERT INTO superadmins (user_id, notes)
-- SELECT id, 'Founding superadmin - aljosa@ljubljanafrogs.si'
-- FROM auth.users WHERE email = 'aljosa@ljubljanafrogs.si';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- 1. Added approval_status to teams (pending_approval → approved/rejected)
-- 2. Added role_approval_status to team_members for admin/coach roles
-- 3. Created superadmins table to track who has superadmin privileges
-- 4. Created approval_requests table for tracking approval workflow
-- 5. Created helper functions: is_superadmin(), is_team_approved(), has_approved_admin_role()
-- 6. Created approval functions: approve_team(), reject_team(), approve_admin_role()
-- 7. Updated RLS policies to enforce:
--    - Only approved teams are accessible
--    - Only approved admins can manage teams
--    - Superadmins can access everything
-- 8. Created triggers to auto-create approval requests
-- 9. Created pending_approvals_dashboard view for superadmin UI
-- 10. Grandfathered existing teams and admins as approved
-- 11. Founding superadmin: aljosa@ljubljanafrogs.si (only person who can add more superadmins)


-- ============================================================================
-- Migration: 056_create_all_teams.sql
-- Type: database
-- ============================================================================

-- =====================================================
-- Create All Teams
-- =====================================================
-- Purpose: Create all 4 teams that users can select
--          in the Settings page team dropdown
-- =====================================================

-- Create teams (idempotent - safe to run multiple times)
INSERT INTO teams (name, sport, approval_status, created_at, updated_at, description) VALUES
  (
    'Ljubljana Frogs - International',
    'flag_football',
    'approved',
    NOW(),
    NOW(),
    'Ljubljana Frogs international team'
  ),
  (
    'Ljubljana Frogs - Domestic',
    'flag_football',
    'approved',
    NOW(),
    NOW(),
    'Ljubljana Frogs domestic team'
  ),
  (
    'American Samoa National Team - Men',
    'flag_football',
    'approved',
    NOW(),
    NOW(),
    'American Samoa men''s national flag football team'
  ),
  (
    'American Samoa National Team - Women',
    'flag_football',
    'approved',
    NOW(),
    NOW(),
    'American Samoa women''s national flag football team'
  )
ON CONFLICT (name) 
DO UPDATE SET
  approval_status = 'approved',
  updated_at = NOW();

-- Verify teams were created
SELECT 
  name,
  sport,
  approval_status,
  created_at
FROM teams
WHERE name IN (
  'Ljubljana Frogs - International',
  'Ljubljana Frogs - Domestic',
  'American Samoa National Team - Men',
  'American Samoa National Team - Women'
)
ORDER BY name;

-- Show summary
DO $$
DECLARE
  team_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO team_count
  FROM teams
  WHERE name IN (
    'Ljubljana Frogs - International',
    'Ljubljana Frogs - Domestic',
    'American Samoa National Team - Men',
    'American Samoa National Team - Women'
  );
  
  RAISE NOTICE '✅ Successfully created/updated % teams', team_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Users can now select from:';
  RAISE NOTICE '  • Ljubljana Frogs - International';
  RAISE NOTICE '  • Ljubljana Frogs - Domestic';
  RAISE NOTICE '  • American Samoa National Team - Men';
  RAISE NOTICE '  • American Samoa National Team - Women';
END $$;



-- ============================================================================
-- Migration: 060_enhanced_chat_system.sql
-- Type: database
-- ============================================================================

-- ============================================================================
-- ENHANCED CHAT SYSTEM MIGRATION
-- Migration: 060_enhanced_chat_system.sql
-- Purpose: Complete chat/community system with channels, permissions, 
--          announcements, pinned messages, and notification triggers
-- Created: 2025-12-27
-- ============================================================================

-- ============================================================================
-- CHANNEL TYPES ENUM
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE channel_type_enum AS ENUM (
        'announcements',      -- Coach-only posting, all team can view
        'team_general',       -- All team members can post
        'coaches_only',       -- Only coaches can view and post
        'position_group',     -- Position-specific (QB room, WR room, etc.)
        'game_day',          -- Auto-created per game
        'direct_message'     -- 1:1 or group DMs
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CHANNELS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    
    -- Channel info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    channel_type channel_type_enum NOT NULL DEFAULT 'team_general',
    
    -- For position groups
    position_filter VARCHAR(50), -- 'QB', 'WR', 'RB', 'DB', etc.
    
    -- For game day channels
    game_id UUID REFERENCES public.games(game_id) ON DELETE CASCADE,
    
    -- For DMs (comma-separated user IDs or use channel_members)
    is_group_dm BOOLEAN DEFAULT false,
    
    -- Settings
    is_archived BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false, -- Auto-join for new team members
    allow_threads BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(team_id, name)
);

-- Indexes for channels
CREATE INDEX IF NOT EXISTS idx_channels_team_id ON public.channels(team_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_channels_game_id ON public.channels(game_id);
CREATE INDEX IF NOT EXISTS idx_channels_created_at ON public.channels(created_at DESC);

-- ============================================================================
-- CHANNEL MEMBERS TABLE (for DMs and explicit membership)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Permissions
    can_post BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false, -- Can manage channel settings
    is_muted BOOLEAN DEFAULT false,
    
    -- Status
    last_read_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(channel_id, user_id)
);

-- Indexes for channel_members
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON public.channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON public.channel_members(user_id);

-- ============================================================================
-- ENHANCED CHAT MESSAGES TABLE
-- ============================================================================
-- Add columns to existing chat_messages if they don't exist
DO $$ BEGIN
    -- Add channel_id reference
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add pinned status
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add pinned by
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES auth.users(id);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add pinned at
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add importance flag
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add mentions array
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS mentions UUID[] DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add attachments JSON
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add thread support
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.chat_messages(id);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    -- Add reply count for thread parents
    ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Additional indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON public.chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_pinned ON public.chat_messages(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_important ON public.chat_messages(is_important) WHERE is_important = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_mentions ON public.chat_messages USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id);

-- ============================================================================
-- MESSAGE READ RECEIPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(message_id, user_id)
);

-- Indexes for read receipts
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON public.message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON public.message_read_receipts(user_id);

-- ============================================================================
-- ANNOUNCEMENT READ STATUS TABLE
-- For tracking who has read important announcements
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT false, -- User explicitly acknowledged
    acknowledged_at TIMESTAMPTZ,
    
    UNIQUE(message_id, user_id)
);

-- Indexes for announcement reads
CREATE INDEX IF NOT EXISTS idx_announcement_reads_message_id ON public.announcement_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON public.announcement_reads(user_id);

-- ============================================================================
-- ENHANCED NOTIFICATIONS TABLE
-- Add new notification types for chat events
-- ============================================================================
DO $$ BEGIN
    -- Add notification_type enum if not exists, or add new values
    ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'chat_mention';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'chat_announcement';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'chat_important';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'stats_uploaded';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'player_activity';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add additional columns to notifications if not exists
DO $$ BEGIN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS source_type VARCHAR(50); -- 'chat', 'game', 'training', etc.
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS source_id UUID; -- Reference to source record
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- ============================================================================
-- COACH ACTIVITY LOG TABLE
-- Track player activities for coach dashboard
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coach_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES auth.users(id), -- Which coach this is for (null = all coaches)
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- 'stats_uploaded', 'training_completed', 'wellness_logged', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}',
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for coach activity log
CREATE INDEX IF NOT EXISTS idx_coach_activity_log_team_id ON public.coach_activity_log(team_id);
CREATE INDEX IF NOT EXISTS idx_coach_activity_log_coach_id ON public.coach_activity_log(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_activity_log_player_id ON public.coach_activity_log(player_id);
CREATE INDEX IF NOT EXISTS idx_coach_activity_log_created_at ON public.coach_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_activity_log_is_read ON public.coach_activity_log(is_read) WHERE is_read = false;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CHANNELS POLICIES
-- ============================================================================

-- Team members can view their team's channels
CREATE POLICY "Team members can view team channels"
ON public.channels FOR SELECT
USING (
    -- Team channels: user must be team member
    (team_id IS NOT NULL AND team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    ))
    -- DM channels: user must be a member
    OR (channel_type = 'direct_message' AND id IN (
        SELECT cm.channel_id FROM public.channel_members cm
        WHERE cm.user_id = auth.uid()
    ))
    -- Coaches-only channels: user must be coach
    OR (channel_type = 'coaches_only' AND team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
    ))
    -- Position group channels: user must match position or be coach
    OR (channel_type = 'position_group' AND (
        team_id IN (
            SELECT tm.team_id FROM public.team_members tm
            WHERE tm.user_id = auth.uid() 
            AND (tm.role IN ('coach', 'assistant_coach') OR tm.position = channels.position_filter)
        )
    ))
);

-- Coaches can create channels
CREATE POLICY "Coaches can create channels"
ON public.channels FOR INSERT
WITH CHECK (
    created_by = auth.uid()
    AND (
        -- Coaches can create team channels
        team_id IN (
            SELECT tm.team_id FROM public.team_members tm
            WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
        )
        -- Anyone can create DMs
        OR channel_type = 'direct_message'
    )
);

-- Coaches can update their team's channels
CREATE POLICY "Coaches can update channels"
ON public.channels FOR UPDATE
USING (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
    )
    OR (channel_type = 'direct_message' AND created_by = auth.uid())
);

-- Coaches can delete channels
CREATE POLICY "Coaches can delete channels"
ON public.channels FOR DELETE
USING (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role = 'coach'
    )
);

-- ============================================================================
-- CHANNEL MEMBERS POLICIES
-- ============================================================================

-- Users can view members of channels they're in
CREATE POLICY "Users can view channel members"
ON public.channel_members FOR SELECT
USING (
    channel_id IN (
        SELECT cm.channel_id FROM public.channel_members cm
        WHERE cm.user_id = auth.uid()
    )
    OR channel_id IN (
        SELECT c.id FROM public.channels c
        JOIN public.team_members tm ON c.team_id = tm.team_id
        WHERE tm.user_id = auth.uid()
    )
);

-- Coaches can add members to channels
CREATE POLICY "Coaches can add channel members"
ON public.channel_members FOR INSERT
WITH CHECK (
    channel_id IN (
        SELECT c.id FROM public.channels c
        JOIN public.team_members tm ON c.team_id = tm.team_id
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
    )
    -- Users can add themselves to DMs they're invited to
    OR (user_id = auth.uid() AND channel_id IN (
        SELECT c.id FROM public.channels c WHERE c.channel_type = 'direct_message'
    ))
);

-- Users can update their own membership (mute, etc.)
CREATE POLICY "Users can update own channel membership"
ON public.channel_members FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- ENHANCED CHAT MESSAGES POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Team members can view team chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send chat messages" ON public.chat_messages;

-- Users can view messages in channels they have access to
CREATE POLICY "Users can view channel messages"
ON public.chat_messages FOR SELECT
USING (
    -- Channel-based access
    channel_id IN (
        SELECT c.id FROM public.channels c
        WHERE 
            -- Team channels
            (c.team_id IN (
                SELECT tm.team_id FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND tm.status = 'active'
            ))
            -- DM channels
            OR (c.channel_type = 'direct_message' AND c.id IN (
                SELECT cm.channel_id FROM public.channel_members cm
                WHERE cm.user_id = auth.uid()
            ))
            -- Coaches-only
            OR (c.channel_type = 'coaches_only' AND c.team_id IN (
                SELECT tm.team_id FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
            ))
    )
    -- Legacy channel string support
    OR channel IN (
        SELECT CONCAT('team-', tm.team_id::text) FROM public.team_members tm
        WHERE tm.user_id = auth.uid()
    )
    OR user_id = auth.uid()
);

-- Users can send messages based on channel permissions
CREATE POLICY "Users can send channel messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND (
        -- Announcements: coaches only
        (channel_id IN (
            SELECT c.id FROM public.channels c
            WHERE c.channel_type = 'announcements'
            AND c.team_id IN (
                SELECT tm.team_id FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
            )
        ))
        -- Coaches-only channels
        OR (channel_id IN (
            SELECT c.id FROM public.channels c
            WHERE c.channel_type = 'coaches_only'
            AND c.team_id IN (
                SELECT tm.team_id FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
            )
        ))
        -- Team general, game day, position group: all members
        OR (channel_id IN (
            SELECT c.id FROM public.channels c
            WHERE c.channel_type IN ('team_general', 'game_day', 'position_group')
            AND c.team_id IN (
                SELECT tm.team_id FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND tm.status = 'active'
            )
        ))
        -- DMs: only members
        OR (channel_id IN (
            SELECT cm.channel_id FROM public.channel_members cm
            WHERE cm.user_id = auth.uid() AND cm.can_post = true
        ))
        -- Legacy channel support
        OR (channel IN (
            SELECT CONCAT('team-', tm.team_id::text) FROM public.team_members tm
            WHERE tm.user_id = auth.uid()
        ))
        OR channel LIKE 'dm-%'
    )
);

-- Coaches can pin/unpin messages
CREATE POLICY "Coaches can update message pins"
ON public.chat_messages FOR UPDATE
USING (
    -- Own messages
    user_id = auth.uid()
    -- Or coach updating pins in their team
    OR (channel_id IN (
        SELECT c.id FROM public.channels c
        WHERE c.team_id IN (
            SELECT tm.team_id FROM public.team_members tm
            WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
        )
    ))
)
WITH CHECK (
    user_id = auth.uid()
    OR (channel_id IN (
        SELECT c.id FROM public.channels c
        WHERE c.team_id IN (
            SELECT tm.team_id FROM public.team_members tm
            WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
        )
    ))
);

-- ============================================================================
-- MESSAGE READ RECEIPTS POLICIES
-- ============================================================================

-- Users can view read receipts for messages in their channels
CREATE POLICY "Users can view read receipts"
ON public.message_read_receipts FOR SELECT
USING (
    message_id IN (
        SELECT cm.id FROM public.chat_messages cm
        WHERE cm.channel_id IN (
            SELECT c.id FROM public.channels c
            JOIN public.team_members tm ON c.team_id = tm.team_id
            WHERE tm.user_id = auth.uid()
        )
    )
);

-- Users can create their own read receipts
CREATE POLICY "Users can create read receipts"
ON public.message_read_receipts FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- ANNOUNCEMENT READS POLICIES
-- ============================================================================

-- Users can view their own announcement reads
CREATE POLICY "Users can view own announcement reads"
ON public.announcement_reads FOR SELECT
USING (user_id = auth.uid());

-- Coaches can view all announcement reads for their team
CREATE POLICY "Coaches can view team announcement reads"
ON public.announcement_reads FOR SELECT
USING (
    message_id IN (
        SELECT cm.id FROM public.chat_messages cm
        WHERE cm.channel_id IN (
            SELECT c.id FROM public.channels c
            WHERE c.team_id IN (
                SELECT tm.team_id FROM public.team_members tm
                WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
            )
        )
    )
);

-- Users can create their own announcement reads
CREATE POLICY "Users can create announcement reads"
ON public.announcement_reads FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own announcement reads
CREATE POLICY "Users can update own announcement reads"
ON public.announcement_reads FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- COACH ACTIVITY LOG POLICIES
-- ============================================================================

-- Coaches can view activity for their teams
CREATE POLICY "Coaches can view team activity"
ON public.coach_activity_log FOR SELECT
USING (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
    )
    AND (coach_id IS NULL OR coach_id = auth.uid())
);

-- System can insert activity (via service role)
CREATE POLICY "System can insert activity"
ON public.coach_activity_log FOR INSERT
WITH CHECK (true);

-- Coaches can mark activity as read
CREATE POLICY "Coaches can update activity read status"
ON public.coach_activity_log FOR UPDATE
USING (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
    )
)
WITH CHECK (
    team_id IN (
        SELECT tm.team_id FROM public.team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('coach', 'assistant_coach')
    )
);

-- ============================================================================
-- FUNCTIONS FOR NOTIFICATION TRIGGERS
-- ============================================================================

-- Function to notify team members of announcements
CREATE OR REPLACE FUNCTION notify_announcement()
RETURNS TRIGGER AS $$
DECLARE
    channel_record RECORD;
    team_member RECORD;
BEGIN
    -- Only trigger for announcement channels or important messages
    IF NEW.is_important = true OR EXISTS (
        SELECT 1 FROM public.channels c 
        WHERE c.id = NEW.channel_id AND c.channel_type = 'announcements'
    ) THEN
        -- Get channel info
        SELECT * INTO channel_record FROM public.channels WHERE id = NEW.channel_id;
        
        -- Notify all team members
        IF channel_record.team_id IS NOT NULL THEN
            FOR team_member IN 
                SELECT tm.user_id FROM public.team_members tm
                WHERE tm.team_id = channel_record.team_id
                AND tm.user_id != NEW.user_id
                AND tm.status = 'active'
            LOOP
                INSERT INTO public.notifications (
                    user_id, type, title, message, priority, data, source_type, source_id
                ) VALUES (
                    team_member.user_id::text,
                    'team',
                    CASE WHEN NEW.is_important THEN '🔴 Important Message' ELSE '📢 Team Announcement' END,
                    LEFT(NEW.message, 100),
                    CASE WHEN NEW.is_important THEN 'high' ELSE 'medium' END,
                    jsonb_build_object(
                        'channel_id', NEW.channel_id,
                        'message_id', NEW.id,
                        'sender_id', NEW.user_id
                    ),
                    'chat',
                    NEW.id
                );
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify mentioned users
CREATE OR REPLACE FUNCTION notify_mentions()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_user UUID;
BEGIN
    -- Check if there are mentions
    IF NEW.mentions IS NOT NULL AND array_length(NEW.mentions, 1) > 0 THEN
        FOREACH mentioned_user IN ARRAY NEW.mentions
        LOOP
            -- Don't notify the sender
            IF mentioned_user != NEW.user_id THEN
                INSERT INTO public.notifications (
                    user_id, type, title, message, priority, data, source_type, source_id
                ) VALUES (
                    mentioned_user::text,
                    'team',
                    '💬 You were mentioned',
                    LEFT(NEW.message, 100),
                    'high',
                    jsonb_build_object(
                        'channel_id', NEW.channel_id,
                        'message_id', NEW.id,
                        'sender_id', NEW.user_id
                    ),
                    'chat',
                    NEW.id
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log coach activity on stats upload
CREATE OR REPLACE FUNCTION log_stats_upload_activity()
RETURNS TRIGGER AS $$
DECLARE
    player_record RECORD;
    team_record RECORD;
    coach_record RECORD;
BEGIN
    -- Get player info
    SELECT u.id, u.raw_user_meta_data->>'full_name' as full_name, u.email
    INTO player_record
    FROM auth.users u
    WHERE u.id = NEW.primary_player_id OR u.id = NEW.user_id;
    
    -- Get team info for the player
    FOR team_record IN
        SELECT tm.team_id, t.name as team_name
        FROM public.team_members tm
        JOIN public.teams t ON t.id = tm.team_id
        WHERE tm.user_id = COALESCE(NEW.primary_player_id, NEW.user_id)
        AND tm.status = 'active'
    LOOP
        -- Log activity for all coaches of this team
        FOR coach_record IN
            SELECT tm.user_id
            FROM public.team_members tm
            WHERE tm.team_id = team_record.team_id
            AND tm.role IN ('coach', 'assistant_coach')
        LOOP
            INSERT INTO public.coach_activity_log (
                team_id, player_id, coach_id, activity_type, title, description, data
            ) VALUES (
                team_record.team_id,
                COALESCE(NEW.primary_player_id, NEW.user_id),
                coach_record.user_id,
                'stats_uploaded',
                COALESCE(player_record.full_name, split_part(player_record.email, '@', 1)) || ' uploaded game stats',
                'New play recorded: ' || COALESCE(NEW.play_type::text, 'play'),
                jsonb_build_object(
                    'game_id', NEW.game_id,
                    'play_type', NEW.play_type,
                    'yards_gained', NEW.yards_gained,
                    'play_result', NEW.play_result
                )
            );
            
            -- Also create a notification
            INSERT INTO public.notifications (
                user_id, type, title, message, priority, data, source_type, source_id
            ) VALUES (
                coach_record.user_id::text,
                'game',
                '📊 Stats Uploaded',
                COALESCE(player_record.full_name, split_part(player_record.email, '@', 1)) || ' logged game stats',
                'medium',
                jsonb_build_object(
                    'player_id', COALESCE(NEW.primary_player_id, NEW.user_id),
                    'game_id', NEW.game_id,
                    'event_id', NEW.id
                ),
                'game_event',
                NEW.id
            );
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log training completion
CREATE OR REPLACE FUNCTION log_training_completion_activity()
RETURNS TRIGGER AS $$
DECLARE
    player_record RECORD;
    team_record RECORD;
    coach_record RECORD;
BEGIN
    -- Only trigger on completion
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        -- Get player info
        SELECT u.id, u.raw_user_meta_data->>'full_name' as full_name, u.email
        INTO player_record
        FROM auth.users u
        WHERE u.id = NEW.user_id;
        
        -- Get team info
        FOR team_record IN
            SELECT tm.team_id, t.name as team_name
            FROM public.team_members tm
            JOIN public.teams t ON t.id = tm.team_id
            WHERE tm.user_id = NEW.user_id
            AND tm.status = 'active'
        LOOP
            -- Log activity for coaches
            FOR coach_record IN
                SELECT tm.user_id
                FROM public.team_members tm
                WHERE tm.team_id = team_record.team_id
                AND tm.role IN ('coach', 'assistant_coach')
            LOOP
                INSERT INTO public.coach_activity_log (
                    team_id, player_id, coach_id, activity_type, title, description, data
                ) VALUES (
                    team_record.team_id,
                    NEW.user_id,
                    coach_record.user_id,
                    'training_completed',
                    COALESCE(player_record.full_name, split_part(player_record.email, '@', 1)) || ' completed training',
                    COALESCE(NEW.session_type, 'Training') || ' - ' || COALESCE(NEW.duration_minutes, 0) || ' min',
                    jsonb_build_object(
                        'session_id', NEW.id,
                        'session_type', NEW.session_type,
                        'duration', NEW.duration_minutes,
                        'rpe', NEW.rpe
                    )
                );
            END LOOP;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger for announcements
DROP TRIGGER IF EXISTS trigger_notify_announcement ON public.chat_messages;
CREATE TRIGGER trigger_notify_announcement
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_announcement();

-- Trigger for mentions
DROP TRIGGER IF EXISTS trigger_notify_mentions ON public.chat_messages;
CREATE TRIGGER trigger_notify_mentions
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_mentions();

-- Trigger for stats upload (on game_events table)
DROP TRIGGER IF EXISTS trigger_log_stats_upload ON public.game_events;
CREATE TRIGGER trigger_log_stats_upload
    AFTER INSERT ON public.game_events
    FOR EACH ROW
    EXECUTE FUNCTION log_stats_upload_activity();

-- Trigger for training completion
DROP TRIGGER IF EXISTS trigger_log_training_completion ON public.training_sessions;
CREATE TRIGGER trigger_log_training_completion
    AFTER INSERT OR UPDATE ON public.training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION log_training_completion_activity();

-- ============================================================================
-- DEFAULT CHANNEL CREATION FUNCTION
-- Auto-create default channels when a team is created
-- ============================================================================
CREATE OR REPLACE FUNCTION create_default_team_channels()
RETURNS TRIGGER AS $$
BEGIN
    -- Create announcements channel
    INSERT INTO public.channels (team_id, name, description, channel_type, is_default, created_by)
    VALUES (
        NEW.id,
        'announcements',
        'Important team announcements from coaches',
        'announcements',
        true,
        NEW.coach_id
    );
    
    -- Create general channel
    INSERT INTO public.channels (team_id, name, description, channel_type, is_default, created_by)
    VALUES (
        NEW.id,
        'general',
        'General team discussion',
        'team_general',
        true,
        NEW.coach_id
    );
    
    -- Create coaches-only channel
    INSERT INTO public.channels (team_id, name, description, channel_type, is_default, created_by)
    VALUES (
        NEW.id,
        'coaches',
        'Private channel for coaching staff',
        'coaches_only',
        true,
        NEW.coach_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default channels
DROP TRIGGER IF EXISTS trigger_create_default_channels ON public.teams;
CREATE TRIGGER trigger_create_default_channels
    AFTER INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION create_default_team_channels();

-- ============================================================================
-- ENABLE REALTIME FOR NEW TABLES
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_read_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcement_reads;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
COMMENT ON TABLE public.channels IS 'Team communication channels with type-based permissions';
COMMENT ON TABLE public.channel_members IS 'Explicit channel membership for DMs and permissions';
COMMENT ON TABLE public.message_read_receipts IS 'Track who has read which messages';
COMMENT ON TABLE public.announcement_reads IS 'Track acknowledgment of important announcements';
COMMENT ON TABLE public.coach_activity_log IS 'Activity feed for coaches showing player actions';



-- ============================================================================
-- Migration: 061_roster_management_tables.sql
-- Type: database
-- ============================================================================

-- ============================================================================
-- Migration: Roster Management Tables
-- Description: Creates team_players and team_invitations tables with RLS policies
-- Created: 2024-12-27
-- ============================================================================

-- =============================================================================
-- TEAM PLAYERS TABLE
-- Stores individual players on a team roster (separate from team_members which
-- tracks user accounts and their roles)
-- =============================================================================

CREATE TABLE IF NOT EXISTS team_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Player Information
    name VARCHAR(255) NOT NULL,
    position VARCHAR(50) NOT NULL,
    jersey_number VARCHAR(10),
    
    -- Demographics
    country VARCHAR(100),
    age INTEGER CHECK (age >= 0 AND age <= 100),
    height VARCHAR(20),
    weight VARCHAR(20),
    
    -- Contact (visible to coaches only)
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'injured', 'inactive')),
    
    -- Optional link to user account (if player has account)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Performance stats (JSONB for flexibility)
    stats JSONB DEFAULT '{}',
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TEAM INVITATIONS TABLE
-- Tracks pending invitations to join a team
-- =============================================================================

CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Invitation details
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'player' CHECK (role IN ('player', 'assistant_coach', 'coach')),
    message TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    
    -- Tracking
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate pending invitations
    UNIQUE(team_id, email, status)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Team Players indexes
CREATE INDEX IF NOT EXISTS idx_team_players_team ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_position ON team_players(position);
CREATE INDEX IF NOT EXISTS idx_team_players_status ON team_players(status);
CREATE INDEX IF NOT EXISTS idx_team_players_user ON team_players(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_players_created_by ON team_players(created_by);

-- Team Invitations indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires ON team_invitations(expires_at);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger for team_players
CREATE TRIGGER update_team_players_updated_at
    BEFORE UPDATE ON team_players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for team_invitations
CREATE TRIGGER update_team_invitations_updated_at
    BEFORE UPDATE ON team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTION: Check user's role in a team
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_team_role(p_user_id UUID, p_team_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Check if user is coach or higher
-- =============================================================================

CREATE OR REPLACE FUNCTION is_team_coach_or_higher(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    v_role := get_user_team_role(p_user_id, p_team_id);
    RETURN v_role IN ('coach', 'assistant_coach', 'owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Check if user is owner or admin
-- =============================================================================

CREATE OR REPLACE FUNCTION is_team_owner_or_admin(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    v_role := get_user_team_role(p_user_id, p_team_id);
    RETURN v_role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TEAM PLAYERS RLS POLICIES
-- =============================================================================

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "Team members can view team players" ON team_players;
DROP POLICY IF EXISTS "Coaches can insert team players" ON team_players;
DROP POLICY IF EXISTS "Coaches can update team players" ON team_players;
DROP POLICY IF EXISTS "Owners can delete team players" ON team_players;

-- SELECT: All team members can view players on their team
CREATE POLICY "Team members can view team players"
ON team_players FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT tm.team_id FROM team_members tm
        WHERE tm.user_id = (SELECT auth.uid())
    )
);

-- INSERT: Coaches, assistant coaches, owners, and admins can add players
CREATE POLICY "Coaches can insert team players"
ON team_players FOR INSERT
TO authenticated
WITH CHECK (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
);

-- UPDATE: Coaches, assistant coaches, owners, and admins can update players
CREATE POLICY "Coaches can update team players"
ON team_players FOR UPDATE
TO authenticated
USING (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
)
WITH CHECK (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
);

-- DELETE: Only owners and admins can delete players
CREATE POLICY "Owners can delete team players"
ON team_players FOR DELETE
TO authenticated
USING (
    is_team_owner_or_admin((SELECT auth.uid()), team_id)
);

-- =============================================================================
-- TEAM INVITATIONS RLS POLICIES
-- =============================================================================

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "Coaches can view team invitations" ON team_invitations;
DROP POLICY IF EXISTS "Invitees can view their invitations" ON team_invitations;
DROP POLICY IF EXISTS "Coaches can create invitations" ON team_invitations;
DROP POLICY IF EXISTS "Coaches can update invitations" ON team_invitations;
DROP POLICY IF EXISTS "Invitees can accept invitations" ON team_invitations;
DROP POLICY IF EXISTS "Owners can delete invitations" ON team_invitations;

-- SELECT: Coaches can view all team invitations
CREATE POLICY "Coaches can view team invitations"
ON team_invitations FOR SELECT
TO authenticated
USING (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
);

-- SELECT: Users can view invitations sent to their email
CREATE POLICY "Invitees can view their invitations"
ON team_invitations FOR SELECT
TO authenticated
USING (
    email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
);

-- INSERT: Coaches can create invitations
CREATE POLICY "Coaches can create invitations"
ON team_invitations FOR INSERT
TO authenticated
WITH CHECK (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
);

-- UPDATE: Coaches can update invitations (cancel, resend, etc.)
CREATE POLICY "Coaches can update invitations"
ON team_invitations FOR UPDATE
TO authenticated
USING (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
)
WITH CHECK (
    is_team_coach_or_higher((SELECT auth.uid()), team_id)
);

-- UPDATE: Invitees can accept/decline their invitations
CREATE POLICY "Invitees can accept invitations"
ON team_invitations FOR UPDATE
TO authenticated
USING (
    email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    AND status = 'pending'
)
WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    AND status IN ('accepted', 'declined')
);

-- DELETE: Only owners and admins can delete invitations
CREATE POLICY "Owners can delete invitations"
ON team_invitations FOR DELETE
TO authenticated
USING (
    is_team_owner_or_admin((SELECT auth.uid()), team_id)
);

-- =============================================================================
-- FUNCTION: Accept team invitation
-- =============================================================================

CREATE OR REPLACE FUNCTION accept_team_invitation(p_invitation_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_invitation team_invitations%ROWTYPE;
    v_user_id UUID;
    v_user_email TEXT;
BEGIN
    v_user_id := auth.uid();
    
    -- Get user email
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    
    -- Get invitation
    SELECT * INTO v_invitation
    FROM team_invitations
    WHERE id = p_invitation_id
      AND email = v_user_email
      AND status = 'pending'
      AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
    END IF;
    
    -- Update invitation status
    UPDATE team_invitations
    SET status = 'accepted',
        accepted_by = v_user_id,
        updated_at = NOW()
    WHERE id = p_invitation_id;
    
    -- Add user to team
    INSERT INTO team_members (team_id, user_id, role, status, joined_at)
    VALUES (v_invitation.team_id, v_user_id, v_invitation.role, 'active', NOW())
    ON CONFLICT (user_id, team_id) DO UPDATE
    SET role = v_invitation.role,
        status = 'active',
        updated_at = NOW();
    
    RETURN jsonb_build_object(
        'success', true,
        'team_id', v_invitation.team_id,
        'role', v_invitation.role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: Decline team invitation
-- =============================================================================

CREATE OR REPLACE FUNCTION decline_team_invitation(p_invitation_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
BEGIN
    v_user_id := auth.uid();
    
    -- Get user email
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    
    -- Update invitation status
    UPDATE team_invitations
    SET status = 'declined',
        updated_at = NOW()
    WHERE id = p_invitation_id
      AND email = v_user_email
      AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation');
    END IF;
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: Expire old invitations (run periodically)
-- =============================================================================

CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE team_invitations
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'pending'
      AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION get_user_team_role TO authenticated;
GRANT EXECUTE ON FUNCTION is_team_coach_or_higher TO authenticated;
GRANT EXECUTE ON FUNCTION is_team_owner_or_admin TO authenticated;
GRANT EXECUTE ON FUNCTION accept_team_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION decline_team_invitation TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE team_players IS 'Stores individual players on team rosters, separate from user accounts';
COMMENT ON TABLE team_invitations IS 'Tracks pending invitations to join teams';
COMMENT ON FUNCTION get_user_team_role IS 'Returns the role of a user in a specific team';
COMMENT ON FUNCTION is_team_coach_or_higher IS 'Checks if user has coach-level permissions or higher';
COMMENT ON FUNCTION is_team_owner_or_admin IS 'Checks if user has owner or admin permissions';
COMMENT ON FUNCTION accept_team_invitation IS 'Allows a user to accept a team invitation';
COMMENT ON FUNCTION decline_team_invitation IS 'Allows a user to decline a team invitation';
COMMENT ON FUNCTION expire_old_invitations IS 'Marks expired invitations as expired';



-- ============================================================================
-- Migration: 062_channel_member_count.sql
-- Type: database
-- ============================================================================

-- ============================================================================
-- CHANNEL MEMBER COUNT MIGRATION
-- Migration: 062_channel_member_count.sql
-- Purpose: Add member_count to channels table with auto-update trigger
--          Provides fast member counts without aggregate queries
-- Created: 2026-01-01
-- ============================================================================

-- ============================================================================
-- ADD MEMBER COUNT COLUMNS TO CHANNELS
-- ============================================================================
DO $$ BEGIN
    ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS online_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Index for quick sorting by member count
CREATE INDEX IF NOT EXISTS idx_channels_member_count ON public.channels(member_count DESC);

-- ============================================================================
-- FUNCTION: Calculate implicit members for a channel
-- Returns count based on channel_type visibility rules
-- ============================================================================
CREATE OR REPLACE FUNCTION get_channel_implicit_member_count(channel_record public.channels)
RETURNS INTEGER AS $$
DECLARE
    member_count INTEGER := 0;
BEGIN
    CASE channel_record.channel_type
        -- Announcements & Team General: All active team members
        WHEN 'announcements', 'team_general' THEN
            SELECT COUNT(*)::INTEGER INTO member_count
            FROM public.team_members tm
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active';
            
        -- Coaches Only: Only coaches and assistant coaches
        WHEN 'coaches_only' THEN
            SELECT COUNT(*)::INTEGER INTO member_count
            FROM public.team_members tm
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            AND tm.role IN ('coach', 'assistant_coach');
            
        -- Position Group: Coaches + athletes with matching position
        WHEN 'position_group' THEN
            SELECT COUNT(*)::INTEGER INTO member_count
            FROM public.team_members tm
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            AND (tm.role IN ('coach', 'assistant_coach') OR tm.position = channel_record.position_filter);
            
        -- Game Day: All active team members (same as team_general)
        WHEN 'game_day' THEN
            SELECT COUNT(*)::INTEGER INTO member_count
            FROM public.team_members tm
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active';
            
        -- Direct Message: Use explicit channel_members count
        WHEN 'direct_message' THEN
            SELECT COUNT(*)::INTEGER INTO member_count
            FROM public.channel_members cm
            WHERE cm.channel_id = channel_record.id;
            
        ELSE
            member_count := 0;
    END CASE;
    
    RETURN member_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: Update channel member count
-- Called by triggers when team_members or channel_members change
-- ============================================================================
CREATE OR REPLACE FUNCTION update_channel_member_count()
RETURNS TRIGGER AS $$
DECLARE
    channel_record public.channels%ROWTYPE;
    new_count INTEGER;
BEGIN
    -- For channel_members changes (DMs)
    IF TG_TABLE_NAME = 'channel_members' THEN
        -- Get the channel
        SELECT * INTO channel_record FROM public.channels WHERE id = COALESCE(NEW.channel_id, OLD.channel_id);
        
        IF channel_record.id IS NOT NULL THEN
            new_count := get_channel_implicit_member_count(channel_record);
            UPDATE public.channels SET member_count = new_count WHERE id = channel_record.id;
        END IF;
        
    -- For team_members changes (team channels)
    ELSIF TG_TABLE_NAME = 'team_members' THEN
        -- Update all channels for this team
        FOR channel_record IN 
            SELECT * FROM public.channels 
            WHERE team_id = COALESCE(NEW.team_id, OLD.team_id)
            AND channel_type != 'direct_message'
        LOOP
            new_count := get_channel_implicit_member_count(channel_record);
            UPDATE public.channels SET member_count = new_count WHERE id = channel_record.id;
        END LOOP;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Auto-update member counts
-- ============================================================================

-- Trigger on channel_members (for DMs)
DROP TRIGGER IF EXISTS trigger_update_channel_member_count_on_members ON public.channel_members;
CREATE TRIGGER trigger_update_channel_member_count_on_members
    AFTER INSERT OR UPDATE OR DELETE ON public.channel_members
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_member_count();

-- Trigger on team_members (for team channels)
DROP TRIGGER IF EXISTS trigger_update_channel_member_count_on_team ON public.team_members;
CREATE TRIGGER trigger_update_channel_member_count_on_team
    AFTER INSERT OR UPDATE OR DELETE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_member_count();

-- ============================================================================
-- FUNCTION: Get channel members with details
-- Returns all members who can see a channel with their info
-- ============================================================================
CREATE OR REPLACE FUNCTION get_channel_members(p_channel_id UUID)
RETURNS TABLE (
    user_id UUID,
    email VARCHAR,
    full_name VARCHAR,
    avatar_url VARCHAR,
    role VARCHAR,
    position VARCHAR,
    jersey_number INTEGER,
    is_explicit_member BOOLEAN,
    can_post BOOLEAN,
    joined_at TIMESTAMPTZ
) AS $$
DECLARE
    channel_record public.channels%ROWTYPE;
BEGIN
    -- Get the channel
    SELECT * INTO channel_record FROM public.channels WHERE id = p_channel_id;
    
    IF channel_record.id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    CASE channel_record.channel_type
        -- Announcements: All team members (can view, only coaches can post)
        WHEN 'announcements' THEN
            SELECT 
                tm.user_id,
                u.email::VARCHAR,
                (u.raw_user_meta_data->>'full_name')::VARCHAR,
                (u.raw_user_meta_data->>'avatar_url')::VARCHAR,
                tm.role::VARCHAR,
                tm.position::VARCHAR,
                tm.jersey_number,
                false AS is_explicit_member,
                (tm.role IN ('coach', 'assistant_coach')) AS can_post,
                tm.joined_at::TIMESTAMPTZ
            FROM public.team_members tm
            JOIN auth.users u ON u.id = tm.user_id
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            ORDER BY 
                CASE WHEN tm.role IN ('coach', 'assistant_coach') THEN 0 ELSE 1 END,
                u.raw_user_meta_data->>'full_name'
                
        -- Team General: All team members can view and post
        WHEN 'team_general' THEN
            SELECT 
                tm.user_id,
                u.email::VARCHAR,
                (u.raw_user_meta_data->>'full_name')::VARCHAR,
                (u.raw_user_meta_data->>'avatar_url')::VARCHAR,
                tm.role::VARCHAR,
                tm.position::VARCHAR,
                tm.jersey_number,
                false AS is_explicit_member,
                true AS can_post,
                tm.joined_at::TIMESTAMPTZ
            FROM public.team_members tm
            JOIN auth.users u ON u.id = tm.user_id
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            ORDER BY 
                CASE WHEN tm.role IN ('coach', 'assistant_coach') THEN 0 ELSE 1 END,
                u.raw_user_meta_data->>'full_name'
                
        -- Coaches Only: Only coaches
        WHEN 'coaches_only' THEN
            SELECT 
                tm.user_id,
                u.email::VARCHAR,
                (u.raw_user_meta_data->>'full_name')::VARCHAR,
                (u.raw_user_meta_data->>'avatar_url')::VARCHAR,
                tm.role::VARCHAR,
                tm.position::VARCHAR,
                tm.jersey_number,
                false AS is_explicit_member,
                true AS can_post,
                tm.joined_at::TIMESTAMPTZ
            FROM public.team_members tm
            JOIN auth.users u ON u.id = tm.user_id
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            AND tm.role IN ('coach', 'assistant_coach')
            ORDER BY 
                CASE WHEN tm.role = 'coach' THEN 0 ELSE 1 END,
                u.raw_user_meta_data->>'full_name'
                
        -- Position Group: Coaches + matching position athletes
        WHEN 'position_group' THEN
            SELECT 
                tm.user_id,
                u.email::VARCHAR,
                (u.raw_user_meta_data->>'full_name')::VARCHAR,
                (u.raw_user_meta_data->>'avatar_url')::VARCHAR,
                tm.role::VARCHAR,
                tm.position::VARCHAR,
                tm.jersey_number,
                false AS is_explicit_member,
                true AS can_post,
                tm.joined_at::TIMESTAMPTZ
            FROM public.team_members tm
            JOIN auth.users u ON u.id = tm.user_id
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            AND (tm.role IN ('coach', 'assistant_coach') OR tm.position = channel_record.position_filter)
            ORDER BY 
                CASE WHEN tm.role IN ('coach', 'assistant_coach') THEN 0 ELSE 1 END,
                u.raw_user_meta_data->>'full_name'
                
        -- Game Day: All team members
        WHEN 'game_day' THEN
            SELECT 
                tm.user_id,
                u.email::VARCHAR,
                (u.raw_user_meta_data->>'full_name')::VARCHAR,
                (u.raw_user_meta_data->>'avatar_url')::VARCHAR,
                tm.role::VARCHAR,
                tm.position::VARCHAR,
                tm.jersey_number,
                false AS is_explicit_member,
                true AS can_post,
                tm.joined_at::TIMESTAMPTZ
            FROM public.team_members tm
            JOIN auth.users u ON u.id = tm.user_id
            WHERE tm.team_id = channel_record.team_id
            AND tm.status = 'active'
            ORDER BY 
                CASE WHEN tm.role IN ('coach', 'assistant_coach') THEN 0 ELSE 1 END,
                u.raw_user_meta_data->>'full_name'
                
        -- Direct Message: Explicit members only
        WHEN 'direct_message' THEN
            SELECT 
                cm.user_id,
                u.email::VARCHAR,
                (u.raw_user_meta_data->>'full_name')::VARCHAR,
                (u.raw_user_meta_data->>'avatar_url')::VARCHAR,
                COALESCE(tm.role, 'member')::VARCHAR,
                tm.position::VARCHAR,
                tm.jersey_number,
                true AS is_explicit_member,
                cm.can_post,
                cm.joined_at
            FROM public.channel_members cm
            JOIN auth.users u ON u.id = cm.user_id
            LEFT JOIN public.team_members tm ON tm.user_id = cm.user_id AND tm.team_id = channel_record.team_id
            WHERE cm.channel_id = p_channel_id
            ORDER BY 
                CASE WHEN cm.is_admin THEN 0 ELSE 1 END,
                u.raw_user_meta_data->>'full_name'
                
        ELSE
            -- Return empty for unknown types
            SELECT 
                NULL::UUID,
                NULL::VARCHAR,
                NULL::VARCHAR,
                NULL::VARCHAR,
                NULL::VARCHAR,
                NULL::VARCHAR,
                NULL::INTEGER,
                NULL::BOOLEAN,
                NULL::BOOLEAN,
                NULL::TIMESTAMPTZ
            WHERE FALSE
    END CASE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- BACKFILL: Calculate member counts for existing channels
-- ============================================================================
DO $$
DECLARE
    channel_record public.channels%ROWTYPE;
    new_count INTEGER;
BEGIN
    FOR channel_record IN SELECT * FROM public.channels
    LOOP
        new_count := get_channel_implicit_member_count(channel_record);
        UPDATE public.channels SET member_count = new_count WHERE id = channel_record.id;
    END LOOP;
END $$;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_channel_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_channel_implicit_member_count(public.channels) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
COMMENT ON COLUMN public.channels.member_count IS 'Cached count of members who can view this channel';
COMMENT ON COLUMN public.channels.online_count IS 'Count of currently online members (updated by presence system)';
COMMENT ON FUNCTION get_channel_members(UUID) IS 'Returns all members who can see a channel with their details';



-- ============================================================================
-- Migration: 062_extended_staff_roles.sql
-- Type: database
-- ============================================================================

-- ============================================================================
-- Migration: Extended Staff Roles
-- Description: Updates team_members role constraint and helper functions
--              to support full coaching/medical/performance staff hierarchy
-- Created: 2024-12-27
-- ============================================================================

-- =============================================================================
-- STAFF ROLE HIERARCHY
-- =============================================================================
-- 
-- OWNERSHIP & ADMIN:
--   - owner: Team Owner (full permissions)
--   - admin: Administrator (full permissions)
--
-- COACHING STAFF:
--   - head_coach: Head Coach (can manage roster, delete players)
--   - offense_coordinator: Offense Coordinator (can manage roster)
--   - defense_coordinator: Defense Coordinator (can manage roster)
--   - assistant_coach: Assistant Coach (can manage roster)
--
-- MEDICAL STAFF:
--   - physiotherapist: Physiotherapist (can view health data)
--   - nutritionist: Nutritionist (can view health data)
--
-- PERFORMANCE STAFF:
--   - strength_conditioning_coach: S&C Coach (can view health data)
--
-- OTHER:
--   - manager: Team Manager
--   - player: Player (basic access)
--
-- =============================================================================

-- =============================================================================
-- UPDATE ROLE CONSTRAINT ON TEAM_MEMBERS
-- =============================================================================

-- First, drop the existing constraint if it exists
DO $$
BEGIN
    ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Add new constraint with all staff roles
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check 
CHECK (role IN (
    -- Players
    'player',
    -- Ownership & Admin
    'owner', 
    'admin',
    -- Coaching Staff
    'head_coach',
    'coach',  -- Legacy, maps to head_coach
    'offense_coordinator',
    'defense_coordinator',
    'assistant_coach',
    -- Medical Staff
    'physiotherapist',
    'nutritionist',
    -- Performance Staff
    'strength_conditioning_coach',
    -- Other
    'manager'
));

-- =============================================================================
-- UPDATE TEAM_INVITATIONS ROLE CONSTRAINT
-- =============================================================================

DO $$
BEGIN
    ALTER TABLE team_invitations DROP CONSTRAINT IF EXISTS team_invitations_role_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE team_invitations ADD CONSTRAINT team_invitations_role_check 
CHECK (role IN (
    'player',
    'head_coach',
    'coach',
    'offense_coordinator',
    'defense_coordinator',
    'assistant_coach',
    'physiotherapist',
    'nutritionist',
    'strength_conditioning_coach'
));

-- =============================================================================
-- UPDATE HELPER FUNCTIONS FOR ROLE CHECKING
-- =============================================================================

-- Function to check if user has coaching staff permissions (can manage roster)
CREATE OR REPLACE FUNCTION is_team_coach_or_higher(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1;
    
    -- Coaching staff roles that can manage roster
    RETURN v_role IN (
        'owner', 'admin',
        'head_coach', 'coach',
        'offense_coordinator', 'defense_coordinator',
        'assistant_coach'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is owner, admin, or head coach (can delete players)
CREATE OR REPLACE FUNCTION is_team_owner_or_admin(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1;
    
    RETURN v_role IN ('owner', 'admin', 'head_coach', 'coach');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view health/medical data
CREATE OR REPLACE FUNCTION can_view_health_data(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1;
    
    -- Medical/performance staff and head coaches can view health data
    RETURN v_role IN (
        'owner', 'admin',
        'head_coach', 'coach',
        'physiotherapist', 'nutritionist',
        'strength_conditioning_coach'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is any type of staff (non-player)
CREATE OR REPLACE FUNCTION is_team_staff(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1;
    
    RETURN v_role IN (
        'owner', 'admin',
        'head_coach', 'coach',
        'offense_coordinator', 'defense_coordinator',
        'assistant_coach',
        'physiotherapist', 'nutritionist',
        'strength_conditioning_coach',
        'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STAFF ROLES REFERENCE TABLE (for UI dropdowns)
-- =============================================================================

CREATE TABLE IF NOT EXISTS staff_roles (
    id VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('ownership', 'coaching', 'medical', 'performance', 'other')),
    can_manage_roster BOOLEAN DEFAULT FALSE,
    can_delete_players BOOLEAN DEFAULT FALSE,
    can_view_health_data BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert staff roles
INSERT INTO staff_roles (id, display_name, category, can_manage_roster, can_delete_players, can_view_health_data, sort_order) VALUES
    -- Ownership
    ('owner', 'Team Owner', 'ownership', true, true, true, 1),
    ('admin', 'Administrator', 'ownership', true, true, true, 2),
    -- Coaching
    ('head_coach', 'Head Coach', 'coaching', true, true, true, 10),
    ('coach', 'Head Coach', 'coaching', true, true, true, 11), -- Legacy
    ('offense_coordinator', 'Offense Coordinator', 'coaching', true, false, true, 12),
    ('defense_coordinator', 'Defense Coordinator', 'coaching', true, false, true, 13),
    ('assistant_coach', 'Assistant Coach', 'coaching', true, false, false, 14),
    -- Medical
    ('physiotherapist', 'Physiotherapist', 'medical', false, false, true, 20),
    ('nutritionist', 'Nutritionist', 'medical', false, false, true, 21),
    -- Performance
    ('strength_conditioning_coach', 'Strength & Conditioning Coach', 'performance', false, false, true, 30),
    -- Other
    ('manager', 'Team Manager', 'other', false, false, false, 40),
    ('player', 'Player', 'other', false, false, false, 50)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    category = EXCLUDED.category,
    can_manage_roster = EXCLUDED.can_manage_roster,
    can_delete_players = EXCLUDED.can_delete_players,
    can_view_health_data = EXCLUDED.can_view_health_data,
    sort_order = EXCLUDED.sort_order;

-- Enable RLS on staff_roles
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read staff roles
DROP POLICY IF EXISTS "Anyone can view staff roles" ON staff_roles;
CREATE POLICY "Anyone can view staff roles"
ON staff_roles FOR SELECT
TO authenticated
USING (true);

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_view_health_data TO authenticated;
GRANT EXECUTE ON FUNCTION is_team_staff TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE staff_roles IS 'Reference table for all available team staff roles';
COMMENT ON FUNCTION can_view_health_data IS 'Checks if user can view player health/medical data';
COMMENT ON FUNCTION is_team_staff IS 'Checks if user is any type of staff member (non-player)';



-- ============================================================================
-- Migration: 063_add_psychologist_role.sql
-- Type: database
-- ============================================================================

-- ============================================================================
-- Migration: Add Psychologist Role
-- Description: Adds psychologist role to support mental performance staff
-- Created: 2026-01-08
-- ============================================================================

-- =============================================================================
-- ADD PSYCHOLOGIST ROLE TO TEAM_MEMBERS CONSTRAINT
-- =============================================================================

-- Update team_members role constraint to include psychologist
DO $$
BEGIN
    -- Drop existing constraint
    ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
    
    -- Add new constraint with psychologist role
    ALTER TABLE team_members ADD CONSTRAINT team_members_role_check 
    CHECK (role IN (
        -- Players
        'player',
        -- Ownership & Admin
        'owner', 
        'admin',
        -- Coaching Staff
        'head_coach',
        'coach',  -- Legacy, maps to head_coach
        'offense_coordinator',
        'defense_coordinator',
        'assistant_coach',
        -- Medical Staff
        'physiotherapist',
        'nutritionist',
        'psychologist',  -- NEW: Mental performance staff
        -- Performance Staff
        'strength_conditioning_coach',
        -- Other
        'manager'
    ));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating team_members constraint: %', SQLERRM;
END $$;

-- =============================================================================
-- UPDATE TEAM_INVITATIONS ROLE CONSTRAINT
-- =============================================================================

DO $$
BEGIN
    -- Drop existing constraint
    ALTER TABLE team_invitations DROP CONSTRAINT IF EXISTS team_invitations_role_check;
    
    -- Add new constraint with psychologist role
    ALTER TABLE team_invitations ADD CONSTRAINT team_invitations_role_check 
    CHECK (role IN (
        'player',
        'head_coach',
        'coach',
        'offense_coordinator',
        'defense_coordinator',
        'assistant_coach',
        'physiotherapist',
        'nutritionist',
        'psychologist',  -- NEW
        'strength_conditioning_coach'
    ));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating team_invitations constraint: %', SQLERRM;
END $$;

-- =============================================================================
-- UPDATE HELPER FUNCTIONS TO INCLUDE PSYCHOLOGIST
-- =============================================================================

-- Update can_view_health_data to include psychologist
CREATE OR REPLACE FUNCTION can_view_health_data(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1;
    
    -- Medical/performance staff and head coaches can view health data
    -- Psychologist added for mental readiness data (with athlete consent)
    RETURN v_role IN (
        'owner', 'admin',
        'head_coach', 'coach',
        'physiotherapist', 'nutritionist', 'psychologist',
        'strength_conditioning_coach'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_team_staff to include psychologist
CREATE OR REPLACE FUNCTION is_team_staff(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role
    FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
    LIMIT 1;
    
    RETURN v_role IN (
        'owner', 'admin',
        'head_coach', 'coach',
        'offense_coordinator', 'defense_coordinator',
        'assistant_coach',
        'physiotherapist', 'nutritionist', 'psychologist',
        'strength_conditioning_coach',
        'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ADD PSYCHOLOGIST TO STAFF_ROLES TABLE
-- =============================================================================

-- Insert psychologist role into staff_roles reference table
INSERT INTO staff_roles (id, display_name, category, can_manage_roster, can_delete_players, can_view_health_data, sort_order) VALUES
    ('psychologist', 'Psychologist', 'medical', false, false, true, 22)
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    category = EXCLUDED.category,
    can_manage_roster = EXCLUDED.can_manage_roster,
    can_delete_players = EXCLUDED.can_delete_players,
    can_view_health_data = EXCLUDED.can_view_health_data,
    sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION can_view_health_data IS 'Checks if user can view player health/medical data. Includes psychologist for mental readiness data (with athlete consent).';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify psychologist role was added
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM staff_roles
    WHERE id = 'psychologist';
    
    IF v_count = 0 THEN
        RAISE EXCEPTION 'Failed to add psychologist role to staff_roles table';
    ELSE
        RAISE NOTICE 'Successfully added psychologist role';
    END IF;
END $$;




-- ============================================================================
-- Migration: 063_player_tournament_availability_and_finances.sql
-- Type: database
-- ============================================================================

-- ============================================================================
-- Migration: Player Tournament Availability & Financial Planning
-- Description: Adds tables for player tournament availability, cost tracking,
--              roster audit log, and invitation management improvements
-- Created: 2024-12-27
-- ============================================================================

-- =============================================================================
-- 1. PLAYER TOURNAMENT AVAILABILITY
-- =============================================================================
-- Players can indicate which tournaments they will/won't attend

CREATE TABLE IF NOT EXISTS player_tournament_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Availability status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'confirmed',      -- Player will attend
        'declined',       -- Player cannot attend
        'tentative',      -- Player unsure
        'pending'         -- Player hasn't responded
    )),
    
    -- Additional details
    reason TEXT,                           -- Reason if declined/tentative
    arrival_date DATE,                     -- When player arrives (if different from tournament start)
    departure_date DATE,                   -- When player leaves (if different from tournament end)
    accommodation_needed BOOLEAN DEFAULT true,
    transportation_needed BOOLEAN DEFAULT false,
    dietary_restrictions TEXT,
    
    -- Financial commitment
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
        'not_required',   -- No payment needed
        'pending',        -- Payment not yet made
        'partial',        -- Partial payment made
        'paid',           -- Fully paid
        'waived'          -- Fee waived
    )),
    amount_due DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    payment_deadline DATE,
    
    -- Timestamps
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint - one response per player per tournament
    UNIQUE(player_id, tournament_id)
);

-- =============================================================================
-- 2. TOURNAMENT COSTS/BUDGET
-- =============================================================================
-- Track costs associated with each tournament

CREATE TABLE IF NOT EXISTS tournament_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Registration & Entry
    registration_fee DECIMAL(10,2) DEFAULT 0,
    entry_fee_per_player DECIMAL(10,2) DEFAULT 0,
    
    -- Travel
    estimated_travel_cost DECIMAL(10,2) DEFAULT 0,
    actual_travel_cost DECIMAL(10,2),
    travel_notes TEXT,
    
    -- Accommodation
    accommodation_cost_per_night DECIMAL(10,2) DEFAULT 0,
    total_nights INTEGER DEFAULT 0,
    estimated_accommodation_total DECIMAL(10,2) DEFAULT 0,
    actual_accommodation_cost DECIMAL(10,2),
    accommodation_notes TEXT,
    
    -- Meals & Per Diem
    per_diem_per_player DECIMAL(10,2) DEFAULT 0,
    estimated_meals_total DECIMAL(10,2) DEFAULT 0,
    actual_meals_cost DECIMAL(10,2),
    
    -- Equipment & Other
    equipment_cost DECIMAL(10,2) DEFAULT 0,
    other_costs DECIMAL(10,2) DEFAULT 0,
    other_costs_description TEXT,
    
    -- Totals
    total_estimated_cost DECIMAL(10,2) GENERATED ALWAYS AS (
        COALESCE(registration_fee, 0) + 
        COALESCE(estimated_travel_cost, 0) + 
        COALESCE(estimated_accommodation_total, 0) + 
        COALESCE(estimated_meals_total, 0) + 
        COALESCE(equipment_cost, 0) + 
        COALESCE(other_costs, 0)
    ) STORED,
    
    -- Funding
    team_contribution DECIMAL(10,2) DEFAULT 0,
    sponsor_contribution DECIMAL(10,2) DEFAULT 0,
    player_share_per_person DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    budget_status VARCHAR(20) DEFAULT 'draft' CHECK (budget_status IN (
        'draft',
        'pending_approval',
        'approved',
        'finalized'
    )),
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tournament_id, team_id)
);

-- =============================================================================
-- 3. PLAYER PAYMENTS/TRANSACTIONS
-- =============================================================================
-- Track individual player payments

CREATE TABLE IF NOT EXISTS player_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    
    -- Payment details
    payment_type VARCHAR(30) NOT NULL CHECK (payment_type IN (
        'tournament_fee',
        'membership_fee',
        'equipment',
        'travel',
        'accommodation',
        'other'
    )),
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Payment method
    payment_method VARCHAR(20) CHECK (payment_method IN (
        'cash',
        'bank_transfer',
        'card',
        'paypal',
        'other'
    )),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'completed',
        'refunded',
        'cancelled'
    )),
    
    -- Reference
    reference_number VARCHAR(100),
    receipt_url TEXT,
    
    -- Timestamps
    due_date DATE,
    paid_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. SPONSOR CONTRIBUTIONS
-- =============================================================================
-- Track sponsor contributions for tournaments/team

CREATE TABLE IF NOT EXISTS sponsor_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    
    -- Sponsor info
    sponsor_name VARCHAR(255) NOT NULL,
    sponsor_contact_email VARCHAR(255),
    sponsor_contact_phone VARCHAR(50),
    
    -- Contribution details
    contribution_type VARCHAR(30) CHECK (contribution_type IN (
        'monetary',
        'equipment',
        'travel',
        'accommodation',
        'services',
        'other'
    )),
    monetary_value DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pledged' CHECK (status IN (
        'pledged',
        'confirmed',
        'received',
        'cancelled'
    )),
    
    -- Agreement
    agreement_date DATE,
    fulfillment_date DATE,
    contract_url TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 5. ROSTER AUDIT LOG
-- =============================================================================
-- Track all changes to roster for history/compliance

CREATE TABLE IF NOT EXISTS roster_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- What changed
    action VARCHAR(30) NOT NULL CHECK (action IN (
        'player_added',
        'player_removed',
        'player_updated',
        'status_changed',
        'role_changed',
        'jersey_changed',
        'invitation_sent',
        'invitation_accepted',
        'invitation_declined',
        'invitation_cancelled',
        'bulk_update'
    )),
    
    -- Who/what was affected
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN (
        'player',
        'staff',
        'invitation'
    )),
    target_id UUID,
    target_name VARCHAR(255),
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    
    -- Who made the change
    performed_by UUID REFERENCES auth.users(id),
    performed_by_name VARCHAR(255),
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 6. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_player_tournament_availability_player ON player_tournament_availability(player_id);
CREATE INDEX IF NOT EXISTS idx_player_tournament_availability_tournament ON player_tournament_availability(tournament_id);
CREATE INDEX IF NOT EXISTS idx_player_tournament_availability_team ON player_tournament_availability(team_id);
CREATE INDEX IF NOT EXISTS idx_player_tournament_availability_status ON player_tournament_availability(status);

CREATE INDEX IF NOT EXISTS idx_tournament_budgets_tournament ON tournament_budgets(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_budgets_team ON tournament_budgets(team_id);

CREATE INDEX IF NOT EXISTS idx_player_payments_player ON player_payments(player_id);
CREATE INDEX IF NOT EXISTS idx_player_payments_team ON player_payments(team_id);
CREATE INDEX IF NOT EXISTS idx_player_payments_tournament ON player_payments(tournament_id);
CREATE INDEX IF NOT EXISTS idx_player_payments_status ON player_payments(status);

CREATE INDEX IF NOT EXISTS idx_sponsor_contributions_team ON sponsor_contributions(team_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_contributions_tournament ON sponsor_contributions(tournament_id);

CREATE INDEX IF NOT EXISTS idx_roster_audit_log_team ON roster_audit_log(team_id);
CREATE INDEX IF NOT EXISTS idx_roster_audit_log_action ON roster_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_roster_audit_log_target ON roster_audit_log(target_id);
CREATE INDEX IF NOT EXISTS idx_roster_audit_log_created ON roster_audit_log(created_at DESC);

-- =============================================================================
-- 7. TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER update_player_tournament_availability_updated_at
    BEFORE UPDATE ON player_tournament_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_budgets_updated_at
    BEFORE UPDATE ON tournament_budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_payments_updated_at
    BEFORE UPDATE ON player_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsor_contributions_updated_at
    BEFORE UPDATE ON sponsor_contributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 8. RLS POLICIES
-- =============================================================================

ALTER TABLE player_tournament_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_audit_log ENABLE ROW LEVEL SECURITY;

-- Player Tournament Availability Policies
CREATE POLICY "Team members can view tournament availability"
    ON player_tournament_availability FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = player_tournament_availability.team_id 
        AND team_members.user_id = auth.uid()
    ));

CREATE POLICY "Players can update own availability"
    ON player_tournament_availability FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.id = player_tournament_availability.player_id 
        AND team_members.user_id = auth.uid()
    ));

CREATE POLICY "Coaches can manage all availability"
    ON player_tournament_availability FOR ALL
    USING (is_team_coach_or_higher(auth.uid(), team_id));

-- Tournament Budgets Policies
CREATE POLICY "Team members can view budgets"
    ON tournament_budgets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = tournament_budgets.team_id 
        AND team_members.user_id = auth.uid()
    ));

CREATE POLICY "Coaches can manage budgets"
    ON tournament_budgets FOR ALL
    USING (is_team_coach_or_higher(auth.uid(), team_id));

-- Player Payments Policies
CREATE POLICY "Players can view own payments"
    ON player_payments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.id = player_payments.player_id 
        AND team_members.user_id = auth.uid()
    ));

CREATE POLICY "Coaches can view all team payments"
    ON player_payments FOR SELECT
    USING (is_team_coach_or_higher(auth.uid(), team_id));

CREATE POLICY "Coaches can manage payments"
    ON player_payments FOR ALL
    USING (is_team_coach_or_higher(auth.uid(), team_id));

-- Sponsor Contributions Policies
CREATE POLICY "Team members can view sponsors"
    ON sponsor_contributions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = sponsor_contributions.team_id 
        AND team_members.user_id = auth.uid()
    ));

CREATE POLICY "Owners/admins can manage sponsors"
    ON sponsor_contributions FOR ALL
    USING (is_team_owner_or_admin(auth.uid(), team_id));

-- Roster Audit Log Policies
CREATE POLICY "Coaches can view audit log"
    ON roster_audit_log FOR SELECT
    USING (is_team_coach_or_higher(auth.uid(), team_id));

CREATE POLICY "System can insert audit log"
    ON roster_audit_log FOR INSERT
    WITH CHECK (true);

-- =============================================================================
-- 9. HELPER FUNCTIONS
-- =============================================================================

-- Function to get tournament availability summary
CREATE OR REPLACE FUNCTION get_tournament_availability_summary(p_tournament_id UUID, p_team_id UUID)
RETURNS TABLE (
    confirmed_count INTEGER,
    declined_count INTEGER,
    tentative_count INTEGER,
    pending_count INTEGER,
    total_players INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE pta.status = 'confirmed')::INTEGER as confirmed_count,
        COUNT(*) FILTER (WHERE pta.status = 'declined')::INTEGER as declined_count,
        COUNT(*) FILTER (WHERE pta.status = 'tentative')::INTEGER as tentative_count,
        COUNT(*) FILTER (WHERE pta.status = 'pending')::INTEGER as pending_count,
        COUNT(*)::INTEGER as total_players
    FROM team_members tm
    LEFT JOIN player_tournament_availability pta 
        ON tm.id = pta.player_id AND pta.tournament_id = p_tournament_id
    WHERE tm.team_id = p_team_id AND tm.role = 'player';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate tournament cost per player
CREATE OR REPLACE FUNCTION calculate_player_tournament_cost(p_tournament_id UUID, p_team_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_budget tournament_budgets%ROWTYPE;
    v_confirmed_players INTEGER;
    v_cost_per_player DECIMAL(10,2);
BEGIN
    -- Get budget
    SELECT * INTO v_budget 
    FROM tournament_budgets 
    WHERE tournament_id = p_tournament_id AND team_id = p_team_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Get confirmed player count
    SELECT COUNT(*) INTO v_confirmed_players
    FROM player_tournament_availability
    WHERE tournament_id = p_tournament_id 
    AND team_id = p_team_id 
    AND status = 'confirmed';
    
    IF v_confirmed_players = 0 THEN
        RETURN 0;
    END IF;
    
    -- Calculate cost per player
    v_cost_per_player := (
        v_budget.total_estimated_cost - 
        COALESCE(v_budget.team_contribution, 0) - 
        COALESCE(v_budget.sponsor_contribution, 0)
    ) / v_confirmed_players;
    
    RETURN GREATEST(v_cost_per_player, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log roster changes
CREATE OR REPLACE FUNCTION log_roster_change(
    p_team_id UUID,
    p_action VARCHAR(30),
    p_target_type VARCHAR(20),
    p_target_id UUID,
    p_target_name VARCHAR(255),
    p_old_values JSONB,
    p_new_values JSONB
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_performer_name VARCHAR(255);
BEGIN
    -- Get performer name
    SELECT COALESCE(raw_user_meta_data->>'full_name', email)
    INTO v_performer_name
    FROM auth.users
    WHERE id = auth.uid();
    
    INSERT INTO roster_audit_log (
        team_id, action, target_type, target_id, target_name,
        old_values, new_values, performed_by, performed_by_name
    ) VALUES (
        p_team_id, p_action, p_target_type, p_target_id, p_target_name,
        p_old_values, p_new_values, auth.uid(), v_performer_name
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_tournament_availability_summary TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_player_tournament_cost TO authenticated;
GRANT EXECUTE ON FUNCTION log_roster_change TO authenticated;



-- ============================================================================
-- Migration: 064_decision_ledger.sql
-- Type: database
-- ============================================================================

-- ============================================================================
-- Migration: Decision Ledger System
-- Description: Creates decision ledger tables for decision accountability,
--              review triggers, and confidence scoring
-- Created: 2026-01-08
-- ============================================================================

-- =============================================================================
-- DECISION LEDGER TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS decision_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Athlete context
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Decision details
    decision_type VARCHAR(50) NOT NULL CHECK (decision_type IN (
        'load_adjustment',
        'rtp_clearance',
        'rtp_progression',
        'nutrition_change',
        'hydration_adjustment',
        'mental_protocol',
        'tactical_modification',
        'recovery_intervention',
        'medical_constraint',
        'supplement_change',
        'training_program_assignment',
        'session_modification',
        'readiness_override',
        'acwr_override',
        'other'
    )),
    
    decision_summary TEXT NOT NULL,
    decision_category VARCHAR(50) NOT NULL CHECK (decision_category IN (
        'medical',
        'load',
        'nutrition',
        'psychological',
        'tactical',
        'recovery'
    )),
    
    -- Decision maker
    made_by UUID NOT NULL REFERENCES auth.users(id),
    made_by_role VARCHAR(50) NOT NULL,
    made_by_name TEXT, -- Denormalized for audit trail
    
    -- Decision basis (structured data)
    decision_basis JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "data_points": ["ACWR: 1.45", "Readiness: 62", "Sleep debt: 3h"],
    --   "constraints": ["RTP Phase 2", "No sprinting >80%"],
    --   "rationale": "Elevated ACWR with sleep debt suggests recovery focus",
    --   "confidence": 0.85,
    --   "data_quality": {"completeness": 0.92, "stale_days": 0}
    -- }
    
    -- Review system
    intended_duration INTERVAL,
    review_trigger VARCHAR(100) NOT NULL,
    review_date TIMESTAMPTZ NOT NULL,
    review_priority VARCHAR(20) DEFAULT 'normal' CHECK (review_priority IN (
        'critical',
        'high',
        'normal',
        'low'
    )),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active',
        'reviewed',
        'superseded',
        'expired',
        'cancelled'
    )),
    
    -- Supersession chain
    superseded_by UUID REFERENCES decision_ledger(id),
    supersedes UUID[], -- Array of decision IDs this supersedes
    
    -- Review tracking
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    review_outcome VARCHAR(50) CHECK (review_outcome IN (
        'maintained',
        'modified',
        'reversed',
        'extended'
    )),
    review_notes TEXT,
    
    -- Outcome tracking (filled after review or decision end)
    outcome_data JSONB DEFAULT '{}'::jsonb,
    -- Structure: {
    --   "athlete_state_before": {...},
    --   "athlete_state_after": {...},
    --   "goal_achieved": true,
    --   "unintended_consequences": [],
    --   "lessons_learned": "..."
    -- }
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT review_date_future CHECK (review_date > created_at),
    CONSTRAINT decision_basis_not_empty CHECK (jsonb_typeof(decision_basis) = 'object')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_decision_ledger_athlete ON decision_ledger(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_ledger_review ON decision_ledger(review_date, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_decision_ledger_made_by ON decision_ledger(made_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_ledger_team ON decision_ledger(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_ledger_type ON decision_ledger(decision_type, status);
CREATE INDEX IF NOT EXISTS idx_decision_ledger_category ON decision_ledger(decision_category, status);
CREATE INDEX IF NOT EXISTS idx_decision_ledger_superseded ON decision_ledger(superseded_by) WHERE superseded_by IS NOT NULL;

-- =============================================================================
-- DECISION REVIEW REMINDERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS decision_review_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES decision_ledger(id) ON DELETE CASCADE,
    
    -- Reminder scheduling
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN (
        'review_due',
        'review_overdue',
        'decision_expiring',
        'outcome_check'
    )),
    scheduled_for TIMESTAMPTZ NOT NULL,
    
    -- Notification
    notified_at TIMESTAMPTZ,
    notification_sent BOOLEAN DEFAULT FALSE,
    
    -- Recipients
    notify_user_ids UUID[], -- Specific users to notify
    notify_roles TEXT[], -- Roles to notify
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'sent',
        'acknowledged',
        'dismissed',
        'expired'
    )),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_reminders_due ON decision_review_reminders(scheduled_for, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_review_reminders_decision ON decision_review_reminders(decision_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE decision_ledger ENABLE ROW LEVEL SECURITY;

-- Staff can view decisions for athletes on their team
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

-- Decision makers can create decisions
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

-- Consolidated UPDATE policy: Decision makers can update their own decisions (before review)
-- OR Reviewers can update decisions during review
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

-- RLS for reminders
ALTER TABLE decision_review_reminders ENABLE ROW LEVEL SECURITY;

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

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate review date from trigger
CREATE OR REPLACE FUNCTION calculate_review_date(
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

-- Function to calculate review priority
CREATE OR REPLACE FUNCTION calculate_review_priority(
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

-- Function to create review reminders
CREATE OR REPLACE FUNCTION create_review_reminders(p_decision_id UUID)
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

-- Trigger to create reminders when decision is created
CREATE OR REPLACE FUNCTION decision_ledger_create_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    PERFORM create_review_reminders(NEW.id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_decision_ledger_create_reminders ON decision_ledger;
CREATE TRIGGER trigger_decision_ledger_create_reminders
AFTER INSERT ON decision_ledger
FOR EACH ROW
EXECUTE FUNCTION decision_ledger_create_reminders();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_decision_ledger_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_decision_ledger_updated_at ON decision_ledger;
CREATE TRIGGER trigger_update_decision_ledger_updated_at
BEFORE UPDATE ON decision_ledger
FOR EACH ROW
EXECUTE FUNCTION update_decision_ledger_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE decision_ledger IS 'Decision accountability ledger - tracks all staff decisions with review triggers and confidence scoring';
COMMENT ON COLUMN decision_ledger.decision_basis IS 'JSONB containing data points, constraints, rationale, confidence, and data quality metrics';
COMMENT ON COLUMN decision_ledger.review_trigger IS 'Trigger type: in_Xh/in_Xd/in_Xw, after_next_session, after_next_game, if_* conditions';
COMMENT ON COLUMN decision_ledger.outcome_data IS 'JSONB containing before/after state, goal achievement, unintended consequences, lessons learned';

COMMENT ON TABLE decision_review_reminders IS 'Automated reminders for decision reviews';
COMMENT ON FUNCTION calculate_review_date IS 'Calculates review date from trigger string and context';
COMMENT ON FUNCTION calculate_review_priority IS 'Calculates review priority based on decision type, category, trigger, and confidence';
COMMENT ON FUNCTION create_review_reminders IS 'Creates review reminders for a decision';




-- ============================================================================
-- Migration: 065_plyometrics_isometrics_exercises.sql
-- Type: database
-- ============================================================================

-- =============================================================================
-- PLYOMETRICS & ISOMETRICS EXERCISES TABLES
-- Migration 065: Evidence-Based Exercise Library
-- 72+ exercises with research citations
-- =============================================================================

-- =============================================================================
-- 1. PLYOMETRICS EXERCISES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS plyometrics_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Exercise Identity
    exercise_name VARCHAR(255) NOT NULL,
    exercise_category VARCHAR(100) NOT NULL, -- 'Deceleration Training', 'Acceleration Training', etc.
    difficulty_level VARCHAR(50) NOT NULL CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
    
    -- Description & Instructions
    description TEXT NOT NULL,
    instructions TEXT[], -- Step-by-step instructions
    coaching_cues TEXT[], -- Key coaching points
    
    -- Research & Evidence
    research_based BOOLEAN DEFAULT true,
    research_source TEXT, -- Citation or URL
    pubmed_id VARCHAR(20),
    
    -- Training Parameters
    intensity_level VARCHAR(50), -- 'Low', 'Moderate', 'High', 'Very High'
    volume_recommendations TEXT[], -- e.g., ['3-4 sets', '6-8 reps']
    rest_periods TEXT[], -- e.g., ['60-90 seconds between sets']
    progression_guidelines TEXT[], -- How to progress the exercise
    
    -- Safety
    safety_notes TEXT[],
    contraindications TEXT[], -- When NOT to do this exercise
    proper_form_guidelines TEXT[],
    common_mistakes TEXT[],
    
    -- Sport Applicability
    applicable_sports TEXT[] DEFAULT ARRAY['Flag Football'],
    position_specific BOOLEAN DEFAULT false,
    position_applications JSONB, -- {"QB": "Improves pocket mobility", "WR": "Enhances route breaks"}
    
    -- Equipment & Space
    equipment_needed TEXT[] DEFAULT ARRAY[]::TEXT[],
    space_requirements VARCHAR(100), -- 'Minimal', '10m x 5m', 'Full field'
    surface_requirements VARCHAR(100), -- 'Turf', 'Grass', 'Gym floor'
    
    -- Effectiveness
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
    performance_improvements JSONB, -- {"sprint_speed": "8-12%", "cod_time": "15-22%"}
    injury_risk_rating VARCHAR(50), -- 'Low', 'Moderate', 'High'
    
    -- Media
    video_url TEXT,
    thumbnail_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. ISOMETRICS EXERCISES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS isometrics_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Exercise Identity
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Injury Prevention', 'Strength', 'Rehabilitation'
    protocol_type VARCHAR(100), -- 'Alfredson', 'Nordic', 'Copenhagen'
    difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
    
    -- Description
    description TEXT NOT NULL,
    instructions TEXT[],
    
    -- Research
    research_based BOOLEAN DEFAULT true,
    research_source TEXT,
    pubmed_id VARCHAR(20),
    injury_prevention_benefits TEXT,
    injury_reduction_percentage DECIMAL(5,2), -- e.g., 51.00 for 51% reduction
    
    -- Training Parameters
    hold_duration_seconds INTEGER,
    sets INTEGER,
    reps INTEGER,
    frequency_per_week INTEGER,
    rest_between_sets_seconds INTEGER,
    
    -- Target Areas
    target_muscles TEXT[],
    target_joints TEXT[],
    
    -- Safety
    contraindications TEXT[],
    safety_notes TEXT[],
    
    -- Effectiveness
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
    evidence_level VARCHAR(20), -- 'A', 'B', 'C', 'D'
    
    -- Media
    video_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_plyometrics_category ON plyometrics_exercises(exercise_category);
CREATE INDEX IF NOT EXISTS idx_plyometrics_difficulty ON plyometrics_exercises(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_plyometrics_rating ON plyometrics_exercises(effectiveness_rating DESC);
CREATE INDEX IF NOT EXISTS idx_isometrics_category ON isometrics_exercises(category);
CREATE INDEX IF NOT EXISTS idx_isometrics_protocol ON isometrics_exercises(protocol_type);

-- =============================================================================
-- 4. ENABLE RLS
-- =============================================================================
ALTER TABLE plyometrics_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE isometrics_exercises ENABLE ROW LEVEL SECURITY;

-- Public read access (exercise library is public)
CREATE POLICY "Plyometrics exercises are viewable by everyone"
ON plyometrics_exercises FOR SELECT USING (true);

CREATE POLICY "Isometrics exercises are viewable by everyone"
ON isometrics_exercises FOR SELECT USING (true);

-- Coaches can manage exercises
CREATE POLICY "Coaches can manage plyometrics exercises"
ON plyometrics_exercises FOR ALL USING (
    (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' IN ('coach', 'admin')
);

CREATE POLICY "Coaches can manage isometrics exercises"
ON isometrics_exercises FOR ALL USING (
    (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' IN ('coach', 'admin')
);

-- =============================================================================
-- 5. SEED DATA: DECELERATION TRAINING (9 exercises)
-- =============================================================================
INSERT INTO plyometrics_exercises (
    exercise_name, exercise_category, difficulty_level, description, instructions,
    research_based, research_source, intensity_level, volume_recommendations,
    rest_periods, progression_guidelines, safety_notes, contraindications,
    equipment_needed, space_requirements, effectiveness_rating, 
    performance_improvements, injury_risk_rating, position_applications
) VALUES
-- 1. Reactive Mirror Deceleration Drill
(
    'Reactive Mirror Deceleration Drill',
    'Deceleration Training',
    'Advanced',
    'Partner-based reactive drill where athlete mirrors partner movements with rapid decelerations. Develops game-realistic deceleration patterns.',
    ARRAY['Partner stands 3-5m away', 'Partner moves randomly in any direction', 'Mirror movements with controlled decelerations', 'Focus on low hips and wide base on stops', 'React to partner''s change of direction'],
    true,
    'Reactive agility research - Sheppard & Young (2006)',
    'High',
    ARRAY['3-4 sets', '30-45 seconds per set'],
    ARRAY['90-120 seconds between sets'],
    ARRAY['Start with predictable patterns', 'Progress to random movements', 'Add cognitive load (call colors/numbers)'],
    ARRAY['Ensure adequate warm-up', 'Use on appropriate surface'],
    ARRAY['Acute lower limb injury', 'Post-ACL surgery < 9 months'],
    ARRAY['Cones for boundary'],
    '10m x 10m',
    10,
    '{"deceleration_control": "25-35%", "reaction_time": "15-20%", "cod_performance": "18-25%"}',
    'Moderate',
    '{"DB": "Essential for coverage breaks", "WR": "Route break deceleration", "LB": "Pursuit angle changes"}'
),
-- 2. Forward 3-Step Deceleration with Cones
(
    'Forward 3-Step Deceleration with Cones',
    'Deceleration Training',
    'Intermediate',
    'Controlled 3-step deceleration from sprint to complete stop at cone. Foundation drill for deceleration mechanics.',
    ARRAY['Sprint at 70-80% max speed', 'Begin deceleration 3 steps before cone', 'Lower center of gravity progressively', 'Final step: wide base, low hips', 'Hold stick position for 2 seconds'],
    true,
    'Prehab Guys - https://library.theprehabguys.com',
    'Moderate',
    ARRAY['4-6 sets', '4-6 reps per set'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['Start at 60% speed', 'Progress to 90% speed', 'Add directional change after stop'],
    ARRAY['Focus on heel-toe braking pattern', 'Avoid knee valgus on landing'],
    ARRAY['Patellar tendinopathy', 'Acute quad strain'],
    ARRAY['5-6 cones'],
    '20m runway',
    9,
    '{"braking_force": "20-30%", "decel_mechanics": "significant improvement"}',
    'Low',
    '{"All": "Foundation deceleration skill"}'
),
-- 3. 3-Step Deceleration to 180° Turn
(
    'Three-Step Deceleration to 180° Turn',
    'Deceleration Training',
    'Advanced',
    'Decelerate from sprint, plant, and execute 180-degree turn. Critical for defensive pursuit and route running.',
    ARRAY['Sprint at 80% speed', 'Execute 3-step deceleration', 'Plant outside foot firmly', 'Rotate hips 180 degrees', 'Accelerate in opposite direction'],
    true,
    'Prehab Guys - https://library.theprehabguys.com',
    'High',
    ARRAY['3-4 sets', '4-5 reps each direction'],
    ARRAY['90-120 seconds between sets'],
    ARRAY['Master basic decel first', 'Progress speed gradually', 'Add reaction stimulus'],
    ARRAY['Ensure proper plant foot mechanics', 'Avoid excessive knee valgus'],
    ARRAY['ACL reconstruction < 12 months', 'Ankle instability'],
    ARRAY['Cones'],
    '15m x 5m',
    9,
    '{"turn_speed": "15-22%", "pursuit_angles": "improved"}',
    'Moderate',
    '{"DB": "Flip hips in coverage", "WR": "Comeback routes", "LB": "Pursuit direction changes"}'
),
-- 4. 3-Step Deceleration to Backpedal
(
    'Three-Step Deceleration to Backpedal',
    'Deceleration Training',
    'Intermediate',
    'Transition from forward sprint to backpedal. Essential for defensive backs and linebackers.',
    ARRAY['Sprint forward at 75% speed', 'Execute 3-step deceleration', 'Drop hips and rotate', 'Transition to backpedal', 'Maintain athletic position'],
    true,
    'Prehab Guys - https://library.theprehabguys.com',
    'Moderate',
    ARRAY['4 sets', '5-6 reps'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['Start slow', 'Progress to game speed', 'Add ball tracking'],
    ARRAY['Keep eyes up during transition'],
    ARRAY['Hip flexor strain'],
    ARRAY['None'],
    '15m runway',
    9,
    '{"transition_speed": "12-18%", "defensive_coverage": "improved"}',
    'Low',
    '{"DB": "Critical for coverage", "LB": "Zone drops"}'
),
-- 5. Single-Leg Deceleration Stick Landing
(
    'Single-Leg Deceleration Stick Landing',
    'Deceleration Training',
    'Advanced',
    'Single-leg landing and stick from forward momentum. Gold-standard ACL prevention exercise.',
    ARRAY['Approach with controlled jog', 'Plant on single leg', 'Absorb force through hip-knee-ankle', 'Stick landing for 3 seconds', 'Maintain knee over toe alignment'],
    true,
    'ACL prevention research - Hewett et al.',
    'Moderate-High',
    ARRAY['3 sets', '6-8 reps each leg'],
    ARRAY['45-60 seconds between legs'],
    ARRAY['Master double-leg first', 'Progress height and speed', 'Add perturbations'],
    ARRAY['Watch for knee valgus', 'Build progressively'],
    ARRAY['ACL injury < 9 months', 'Patellar tendinopathy'],
    ARRAY['None'],
    'Minimal',
    9,
    '{"landing_mechanics": "significant", "acl_risk_reduction": "40-60%"}',
    'Moderate',
    '{"WR": "Catch and cut", "DB": "Break on ball"}'
),
-- 6. Lateral Shuffle to Deceleration Stick
(
    'Lateral Shuffle to Deceleration Stick',
    'Deceleration Training',
    'Intermediate',
    'Frontal plane deceleration from lateral movement. Develops multi-directional stopping ability.',
    ARRAY['Lateral shuffle at moderate speed', 'On command, plant outside foot', 'Lower hips and absorb', 'Stick position for 2 seconds', 'Reset and repeat opposite direction'],
    true,
    'Frontal plane deceleration research',
    'Moderate',
    ARRAY['4 sets', '6 reps each direction'],
    ARRAY['60 seconds between sets'],
    ARRAY['Start slow', 'Increase shuffle speed', 'Add reactive cues'],
    ARRAY['Maintain neutral spine', 'Avoid lateral trunk lean'],
    ARRAY['Groin strain', 'Hip impingement'],
    ARRAY['Cones'],
    '10m lateral space',
    9,
    '{"lateral_decel": "20-25%", "groin_injury_prevention": "improved"}',
    'Low',
    '{"DB": "Press coverage", "LB": "Lateral pursuit"}'
),
-- 7. Backpedal to Forward Sprint Transition
(
    'Backpedal to Forward Sprint Transition',
    'Deceleration Training',
    'Intermediate',
    'Transition from backpedal to forward sprint. Critical for DBs breaking on the ball.',
    ARRAY['Start in athletic backpedal', 'On cue, plant and rotate', 'Drive forward explosively', 'Accelerate through 10 yards', 'Focus on hip rotation speed'],
    true,
    'Multi-directional training research',
    'High',
    ARRAY['4-5 sets', '4-6 reps'],
    ARRAY['90 seconds between sets'],
    ARRAY['Master backpedal technique first', 'Progress to reactive cues', 'Add ball tracking'],
    ARRAY['Maintain low center of gravity'],
    ARRAY['Hamstring strain'],
    ARRAY['None'],
    '15m x 5m',
    9,
    '{"break_speed": "15-20%", "ball_reaction": "improved"}',
    'Moderate',
    '{"DB": "Essential skill", "LB": "Zone coverage breaks"}'
),
-- 8. Sprint to Crossover Deceleration
(
    'Sprint to Crossover Deceleration',
    'Deceleration Training',
    'Advanced',
    'High-speed sprint with crossover step deceleration. Game-transfer drill for pursuit angles.',
    ARRAY['Sprint at 85-90% max speed', 'Execute crossover step to change angle', 'Decelerate over 3-4 steps', 'Maintain balance throughout', 'Reaccelerate in new direction'],
    true,
    'Game-transfer deceleration research',
    'Very High',
    ARRAY['3-4 sets', '4 reps each direction'],
    ARRAY['120 seconds between sets'],
    ARRAY['Master basic crossover first', 'Build speed progressively', 'Add pursuit target'],
    ARRAY['High ACL risk if poor mechanics', 'Ensure adequate preparation'],
    ARRAY['Knee instability', 'Ankle sprain history'],
    ARRAY['Cones'],
    '20m x 10m',
    9,
    '{"pursuit_efficiency": "18-25%", "game_transfer": "high"}',
    'High',
    '{"DB": "Pursuit angles", "LB": "Run support"}'
),
-- 9. Drop Step Deceleration
(
    'Drop Step Deceleration',
    'Deceleration Training',
    'Intermediate',
    'Defensive drop step with controlled deceleration. Foundation for coverage technique.',
    ARRAY['Start in athletic stance', 'Open hips with drop step', 'Maintain low position', 'Decelerate to balanced position', 'Ready for next movement'],
    true,
    'Defensive movement patterns research',
    'Moderate',
    ARRAY['4 sets', '6-8 reps each side'],
    ARRAY['45-60 seconds between sets'],
    ARRAY['Focus on hip mobility first', 'Progress to reactive', 'Add receiver simulation'],
    ARRAY['Keep eyes up', 'Maintain athletic posture'],
    ARRAY['Hip flexor tightness'],
    ARRAY['None'],
    'Minimal',
    8,
    '{"coverage_technique": "improved", "hip_mobility": "enhanced"}',
    'Low',
    '{"DB": "Press technique", "LB": "Zone drops"}'
);

-- =============================================================================
-- 6. SEED DATA: ACCELERATION TRAINING (11 exercises)
-- =============================================================================
INSERT INTO plyometrics_exercises (
    exercise_name, exercise_category, difficulty_level, description, instructions,
    research_based, research_source, intensity_level, volume_recommendations,
    rest_periods, progression_guidelines, safety_notes,
    equipment_needed, space_requirements, effectiveness_rating,
    performance_improvements, injury_risk_rating, position_applications
) VALUES
-- 1. Resisted Sled Sprint
(
    'Resisted Sled Sprint (10-20m)',
    'Acceleration Training',
    'Intermediate',
    'Sled pulls develop horizontal force production critical for acceleration. Load should allow 10% speed decrement.',
    ARRAY['Attach sled to waist belt', 'Assume 3-point or athletic stance', 'Drive powerfully through ground', 'Maintain forward lean', 'Sprint 10-20m with maximal effort'],
    true,
    'Coach Athletics - https://coachathletics.com.au',
    'High',
    ARRAY['4-6 sets', '10-20m per rep'],
    ARRAY['2-3 minutes full recovery'],
    ARRAY['Start with 10% BW load', 'Progress to 20-30% BW', 'Maintain proper mechanics'],
    ARRAY['Load should not alter running mechanics significantly'],
    ARRAY['Sled', 'Belt harness'],
    '25m runway',
    10,
    '{"horizontal_force": "25-35%", "10m_sprint": "8-12% improvement"}',
    'Low',
    '{"All": "Acceleration development"}'
),
-- 2. Bounding (Horizontal Emphasis)
(
    'Bounding (Horizontal Emphasis)',
    'Acceleration Training',
    'Intermediate',
    'Exaggerated running with maximal horizontal displacement. Develops stride power and length.',
    ARRAY['Start with 3-step approach', 'Drive knee high and forward', 'Extend hip fully on push-off', 'Maximize horizontal distance', 'Land with active foot strike'],
    true,
    'Outside Online - https://outsideonline.com',
    'High',
    ARRAY['3-4 sets', '20-30m per set'],
    ARRAY['2-3 minutes between sets'],
    ARRAY['Master skipping first', 'Progress distance gradually', 'Focus on rhythm'],
    ARRAY['High impact - ensure adequate preparation'],
    ARRAY['None'],
    '30m runway',
    10,
    '{"stride_length": "15-20%", "horizontal_power": "20-30%"}',
    'Moderate',
    '{"WR": "Route acceleration", "DB": "Break acceleration"}'
),
-- 3. Falling Start (3-Step Acceleration)
(
    'Falling Start (3-Step Acceleration)',
    'Acceleration Training',
    'Beginner',
    'Gravity-assisted start teaches forward lean and explosive first steps.',
    ARRAY['Stand tall at start line', 'Lean forward until off-balance', 'React with explosive first step', 'Drive through first 3 steps', 'Maintain forward lean throughout'],
    true,
    'FootFitLab - https://footfitlab.com',
    'Moderate',
    ARRAY['5-6 sets', '3-5 reps'],
    ARRAY['60-90 seconds between reps'],
    ARRAY['Start with minimal lean', 'Progress lean angle', 'Add reactive cues'],
    ARRAY['Ensure clear runway'],
    ARRAY['None'],
    '15m runway',
    9,
    '{"first_step_speed": "15-25%", "acceleration_mechanics": "improved"}',
    'Low',
    '{"QB": "Scramble starts", "All": "Acceleration foundation"}'
),
-- 4. Medicine Ball Start to Sprint
(
    'Medicine Ball Start to Sprint',
    'Acceleration Training',
    'Intermediate',
    'Explosive med ball throw transitions to sprint. Develops power transfer and acceleration.',
    ARRAY['Hold med ball at chest', 'Assume athletic stance', 'Explosively throw ball forward', 'Immediately sprint after release', 'Chase the ball for 10-15m'],
    true,
    'TrainHeroic - https://trainheroic.com',
    'High',
    ARRAY['4 sets', '4-6 reps'],
    ARRAY['90 seconds between reps'],
    ARRAY['Start with lighter ball', 'Progress ball weight', 'Focus on seamless transition'],
    ARRAY['Clear area for ball landing'],
    ARRAY['Medicine ball (3-5kg)'],
    '20m runway',
    9,
    '{"power_transfer": "improved", "acceleration": "12-18%"}',
    'Low',
    '{"All": "Explosive starts"}'
),
-- 5. Wall Drill (Acceleration Mechanics)
(
    'Wall Drill (Acceleration Mechanics)',
    'Acceleration Training',
    'Beginner',
    'Wall-supported drill teaches proper acceleration body angles and leg drive mechanics.',
    ARRAY['Lean against wall at 45-degree angle', 'Hands on wall, arms extended', 'Drive one knee up explosively', 'Hold position briefly', 'Alternate legs with control'],
    true,
    'Loren Landow - https://coachathletics.com.au',
    'Low',
    ARRAY['3 sets', '10-12 reps each leg'],
    ARRAY['30-45 seconds between sets'],
    ARRAY['Master static holds first', 'Progress to dynamic exchanges', 'Add speed'],
    ARRAY['Maintain proper body angle'],
    ARRAY['Wall'],
    'Minimal',
    8,
    '{"acceleration_mechanics": "foundation", "body_position": "improved"}',
    'Low',
    '{"All": "Technique development"}'
),
-- 6. Partner-Resisted A-March Drill
(
    'Partner-Resisted A-March Drill',
    'Acceleration Training',
    'Intermediate',
    'Partner provides resistance while athlete performs A-march. Develops force production against resistance.',
    ARRAY['Partner holds resistance band around waist', 'Perform exaggerated A-march', 'Drive knees high against resistance', 'Maintain forward lean', 'Partner provides consistent tension'],
    true,
    'Loren Landow - https://coachathletics.com.au',
    'Moderate',
    ARRAY['3-4 sets', '15-20m'],
    ARRAY['60 seconds between sets'],
    ARRAY['Start with light resistance', 'Progress tension', 'Maintain mechanics'],
    ARRAY['Partner must provide consistent resistance'],
    ARRAY['Resistance band', 'Partner'],
    '20m runway',
    8,
    '{"hip_flexor_strength": "improved", "knee_drive": "enhanced"}',
    'Low',
    '{"All": "Acceleration mechanics"}'
),
-- 7. Power Skip for Distance
(
    'Power Skip for Distance',
    'Acceleration Training',
    'Beginner',
    'Exaggerated skipping emphasizing horizontal distance. Develops hip extension power.',
    ARRAY['Start with normal skip rhythm', 'Emphasize height and distance', 'Drive arms powerfully', 'Extend hip fully on push-off', 'Land softly and repeat'],
    true,
    'Sprint mechanics research',
    'Moderate',
    ARRAY['3-4 sets', '30-40m'],
    ARRAY['60-90 seconds between sets'],
    ARRAY['Master basic skip first', 'Progress to max effort', 'Focus on rhythm'],
    ARRAY['Gradual progression'],
    ARRAY['None'],
    '40m runway',
    8,
    '{"hip_extension": "improved", "coordination": "enhanced"}',
    'Low',
    '{"All": "Foundation drill"}'
),
-- 8. Push-Up Start Sprint
(
    'Push-Up Start Sprint',
    'Acceleration Training',
    'Intermediate',
    'Start from push-up position and explode into sprint. Develops ground-to-sprint transitions.',
    ARRAY['Start in push-up position', 'On cue, explosively drive up', 'Transition immediately to sprint', 'Maintain low body angle', 'Accelerate through 10-15m'],
    true,
    'Ground-to-sprint transition research',
    'High',
    ARRAY['4-5 sets', '4-6 reps'],
    ARRAY['90 seconds between reps'],
    ARRAY['Master basic push-up start', 'Progress to reactive cues', 'Add competition'],
    ARRAY['Clear runway'],
    ARRAY['None'],
    '20m runway',
    8,
    '{"ground_reaction": "improved", "first_step": "15-20%"}',
    'Low',
    '{"All": "Game-situation starts"}'
),
-- 9. Seated Start Sprint
(
    'Seated Start Sprint',
    'Acceleration Training',
    'Intermediate',
    'Start from seated position. Develops rate of force development from disadvantaged position.',
    ARRAY['Sit on ground facing sprint direction', 'Feet flat, knees bent', 'On cue, explosively stand and sprint', 'Drive arms powerfully', 'Accelerate through 15m'],
    true,
    'Rate of force development research',
    'High',
    ARRAY['4 sets', '4-6 reps'],
    ARRAY['90 seconds between reps'],
    ARRAY['Start with kneeling position', 'Progress to seated', 'Add reactive cues'],
    ARRAY['Ensure proper technique on stand-up'],
    ARRAY['None'],
    '20m runway',
    8,
    '{"rfd": "improved", "explosive_strength": "enhanced"}',
    'Low',
    '{"All": "Reactive acceleration"}'
),
-- 10. Split Stance Start Sprint
(
    'Split Stance Start Sprint',
    'Acceleration Training',
    'Beginner',
    'Sprint start from staggered stance. Mimics game-position starts.',
    ARRAY['Assume split stance (one foot forward)', 'Weight on front foot', 'On cue, drive off front foot', 'Maintain forward lean', 'Accelerate through 10-15m'],
    true,
    'Game-position start research',
    'Moderate',
    ARRAY['4 sets', '4-6 reps each stance'],
    ARRAY['60 seconds between reps'],
    ARRAY['Practice both stances', 'Progress to reactive starts', 'Add direction changes'],
    ARRAY['Maintain athletic position'],
    ARRAY['None'],
    '20m runway',
    7,
    '{"game_starts": "improved", "versatility": "enhanced"}',
    'Low',
    '{"WR": "Route starts", "DB": "Backpedal starts"}'
),
-- 11. Backward to Forward Sprint Transition
(
    'Backward to Forward Sprint Transition',
    'Acceleration Training',
    'Intermediate',
    'Transition from backward movement to forward sprint. Essential for defensive positions.',
    ARRAY['Start with controlled backpedal', 'On cue, plant and rotate', 'Drive explosively forward', 'Maintain low center of gravity', 'Accelerate through 10m'],
    true,
    'Multi-directional acceleration research',
    'High',
    ARRAY['4 sets', '5-6 reps'],
    ARRAY['90 seconds between sets'],
    ARRAY['Master backpedal first', 'Progress transition speed', 'Add ball tracking'],
    ARRAY['Focus on hip rotation'],
    ARRAY['None'],
    '15m x 5m',
    9,
    '{"transition_speed": "15-22%", "defensive_breaks": "improved"}',
    'Moderate',
    '{"DB": "Coverage breaks", "LB": "Zone to man transitions"}'
);

-- =============================================================================
-- 7. SEED DATA: ECCENTRIC STRENGTH (3 exercises - Gold Standard)
-- =============================================================================
INSERT INTO isometrics_exercises (
    name, category, protocol_type, difficulty_level, description, instructions,
    research_based, research_source, pubmed_id, injury_prevention_benefits,
    injury_reduction_percentage, hold_duration_seconds, sets, reps,
    frequency_per_week, rest_between_sets_seconds, target_muscles,
    contraindications, effectiveness_rating, evidence_level
) VALUES
-- 1. Nordic Hamstring Curl
(
    'Nordic Hamstring Curl',
    'Injury Prevention',
    'Nordic',