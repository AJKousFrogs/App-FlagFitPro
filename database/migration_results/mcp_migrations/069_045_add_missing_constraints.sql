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

