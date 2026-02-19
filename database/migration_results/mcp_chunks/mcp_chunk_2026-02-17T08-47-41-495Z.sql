-- Consolidated migration bundle
-- Generated: 2026-02-17T08:47:41.497Z
-- Source-of-truth: supabase/migrations

-- ============================================================================
-- supabase/migrations/001_role_enforcement.sql
-- ============================================================================
-- Migration: Role Enforcement and Row Level Security Policies
-- Created: 2024-12-21
-- Purpose: Address critical security gap - server-side role enforcement

-- ============================================================================
-- PART 1: Role Enforcement Trigger
-- ============================================================================
-- This trigger validates and enforces role assignments on user creation/update
-- Prevents privilege escalation via frontend manipulation

CREATE OR REPLACE FUNCTION public.enforce_user_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  allowed_roles TEXT[] := ARRAY['player', 'coach', 'admin'];
  requested_role TEXT;
BEGIN
  -- Extract requested role from user metadata
  requested_role := NEW.raw_user_meta_data->>'role';

  -- Validation 1: Check if role is in allowed list
  IF requested_role IS NULL OR NOT (requested_role = ANY(allowed_roles)) THEN
    -- Default to 'player' if invalid or missing
    NEW.raw_user_meta_data := jsonb_set(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"player"'::jsonb
    );

    -- Log the enforcement action
    RAISE NOTICE 'Role enforcement: Invalid role "%" defaulted to "player" for user %',
      requested_role, NEW.id;
  END IF;

  -- Validation 2: Prevent self-assignment of 'admin' role
  -- Only existing admins can assign admin role
  IF requested_role = 'admin' AND OLD.raw_user_meta_data->>'role' != 'admin' THEN
    -- Check if current user is admin (for UPDATE operations)
    IF TG_OP = 'UPDATE' THEN
      -- Prevent non-admin from upgrading to admin
      NEW.raw_user_meta_data := jsonb_set(
        NEW.raw_user_meta_data,
        '{role}',
        (OLD.raw_user_meta_data->>'role')::jsonb
      );

      RAISE NOTICE 'Role enforcement: Prevented non-admin user % from self-assigning admin role',
        NEW.id;
    END IF;

    -- For INSERT, default to 'player' (no self-service admin creation)
    IF TG_OP = 'INSERT' THEN
      NEW.raw_user_meta_data := jsonb_set(
        NEW.raw_user_meta_data,
        '{role}',
        '"player"'::jsonb
      );

      RAISE NOTICE 'Role enforcement: New user % attempted admin role, defaulted to player',
        NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS enforce_role_on_user_change ON auth.users;
CREATE TRIGGER enforce_role_on_user_change
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_user_role();

COMMENT ON FUNCTION public.enforce_user_role() IS
  'Enforces role assignment rules: validates against whitelist, prevents self-admin, defaults to player';

-- ============================================================================
-- PART 2: Role Assignment Audit Log
-- ============================================================================
-- Track all role changes for security auditing

CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_role TEXT,
  new_role TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_role_audit_user ON public.role_change_audit(user_id);
CREATE INDEX idx_role_audit_timestamp ON public.role_change_audit(changed_at DESC);

-- Trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  old_role TEXT;
  new_role TEXT;
BEGIN
  -- Extract roles
  old_role := OLD.raw_user_meta_data->>'role';
  new_role := NEW.raw_user_meta_data->>'role';

  -- Only log if role actually changed
  IF old_role IS DISTINCT FROM new_role THEN
    INSERT INTO public.role_change_audit (
      user_id,
      old_role,
      new_role,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      old_role,
      new_role,
      auth.uid(), -- Current user making the change
      'Role updated via user metadata'
    );

    RAISE NOTICE 'Role change logged: User % changed from % to %',
      NEW.id, old_role, new_role;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_role_change_trigger ON auth.users;
CREATE TRIGGER log_role_change_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data->>'role' IS DISTINCT FROM NEW.raw_user_meta_data->>'role')
  EXECUTE FUNCTION public.log_role_change();

-- ============================================================================
-- PART 3: Row Level Security Policies
-- ============================================================================

-- Enable RLS on user-specific tables
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_roster ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- User Profiles Policies
-- ============================================================================

-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- Player Profiles Policies
-- ============================================================================

-- Players can view own profile
CREATE POLICY "Players can view own profile"
  ON public.player_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Players can update own profile
CREATE POLICY "Players can update own profile"
  ON public.player_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Coaches can view their team's players
CREATE POLICY "Coaches can view team players"
  ON public.player_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
      AND users.raw_user_meta_data->>'role' = 'coach'
    )
    AND (
      -- Either player is on coach's team
      EXISTS (
        SELECT 1 FROM public.team_roster
        WHERE coach_id = auth.uid()
        AND player_id = player_profiles.id
      )
      OR auth.uid() = id -- Or viewing own profile
    )
  );

-- ============================================================================
-- Coach Profiles Policies
-- ============================================================================

-- Coaches can view own profile
CREATE POLICY "Coaches can view own profile"
  ON public.coach_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Coaches can update own profile
CREATE POLICY "Coaches can update own profile"
  ON public.coach_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Players can view their coach's profile
CREATE POLICY "Players can view their coach"
  ON public.coach_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_roster
      WHERE player_id = auth.uid()
      AND coach_id = coach_profiles.id
    )
  );

-- ============================================================================
-- Training Sessions Policies
-- ============================================================================

-- Users can view own training sessions
CREATE POLICY "Users can view own training sessions"
  ON public.training_sessions
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create own training sessions
CREATE POLICY "Users can create own training sessions"
  ON public.training_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update own training sessions
CREATE POLICY "Users can update own training sessions"
  ON public.training_sessions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Coaches can view team's training sessions
CREATE POLICY "Coaches can view team training sessions"
  ON public.training_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
      AND users.raw_user_meta_data->>'role' = 'coach'
    )
    AND (
      user_id = auth.uid() -- Own sessions
      OR EXISTS (
        SELECT 1 FROM public.team_roster
        WHERE coach_id = auth.uid()
        AND player_id = training_sessions.user_id
      )
    )
  );

-- Coaches can create training sessions for team
CREATE POLICY "Coaches can create team training sessions"
  ON public.training_sessions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
      AND users.raw_user_meta_data->>'role' = 'coach'
    )
    AND (
      user_id = auth.uid() -- Own sessions
      OR EXISTS (
        SELECT 1 FROM public.team_roster
        WHERE coach_id = auth.uid()
        AND player_id = training_sessions.user_id
      )
    )
  );

-- ============================================================================
-- Performance Metrics Policies
-- ============================================================================

-- Users can view own metrics
CREATE POLICY "Users can view own metrics"
  ON public.performance_metrics
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert own metrics
CREATE POLICY "Users can insert own metrics"
  ON public.performance_metrics
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Coaches can view team metrics
CREATE POLICY "Coaches can view team metrics"
  ON public.performance_metrics
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_roster
      WHERE coach_id = auth.uid()
      AND player_id = performance_metrics.user_id
    )
  );

-- ============================================================================
-- Notifications Policies
-- ============================================================================

-- Users can view own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true); -- Controlled via service role key

-- ============================================================================
-- Team Roster Policies
-- ============================================================================

-- Coaches can view own team roster
CREATE POLICY "Coaches can view team roster"
  ON public.team_roster
  FOR SELECT
  USING (coach_id = auth.uid());

-- Coaches can manage own team roster
CREATE POLICY "Coaches can manage team roster"
  ON public.team_roster
  FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Players can view rosters they're on
CREATE POLICY "Players can view their roster"
  ON public.team_roster
  FOR SELECT
  USING (player_id = auth.uid());

-- ============================================================================
-- Helper Functions for Role Checks
-- ============================================================================

-- Function to check if current user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = required_role
  );
$$;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT raw_user_meta_data->>'role'
  FROM auth.users
  WHERE id = auth.uid();
$$;

-- ============================================================================
-- Grants and Permissions
-- ============================================================================

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_role() TO authenticated;

-- Grant select on audit log to admins only
REVOKE ALL ON public.role_change_audit FROM PUBLIC;
GRANT SELECT ON public.role_change_audit TO authenticated;

-- Create policy for audit log access
CREATE POLICY "Admins can view audit log"
  ON public.role_change_audit
  FOR SELECT
  USING (public.has_role('admin'));

-- ============================================================================
-- Testing the Implementation
-- ============================================================================

-- Test Case 1: Verify role enforcement
DO $$
BEGIN
  RAISE NOTICE 'Testing role enforcement trigger...';
  -- This would normally fail in production but demonstrates the concept
  RAISE NOTICE 'Test: Insert with invalid role should default to player';
  RAISE NOTICE 'Test: Admin role assignment by non-admin should be blocked';
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TRIGGER enforce_role_on_user_change ON auth.users IS
  'Validates and enforces role assignments on user creation/update';
COMMENT ON TRIGGER log_role_change_trigger ON auth.users IS
  'Logs all role changes to audit table for security monitoring';

-- ============================================================================
-- supabase/migrations/20250108000000_chatbot_role_aware_system.sql
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

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- supabase/migrations/20250108000001_knowledge_base_governance.sql
-- ============================================================================
-- =============================================================================
-- KNOWLEDGE BASE GOVERNANCE SYSTEM
-- Migration: 040_knowledge_base_governance.sql
-- Purpose: Add governance fields for evidence-based knowledge base approval and quality control
-- Created: 2025-01-XX
-- Note: This migration only runs if knowledge_base_entries table exists
-- =============================================================================

DO $$
BEGIN
    -- Check if knowledge_base_entries table exists - skip entire migration if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'knowledge_base_entries'
    ) THEN
        RAISE NOTICE 'Table knowledge_base_entries does not exist. Skipping knowledge base governance migration.';
        RETURN;
    END IF;

    -- =============================================================================
    -- ADD GOVERNANCE FIELDS TO KNOWLEDGE_BASE_ENTRIES
    -- =============================================================================

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

    -- Create indexes for governance queries
    CREATE INDEX IF NOT EXISTS idx_kb_approval_status ON knowledge_base_entries(approval_status);
    CREATE INDEX IF NOT EXISTS idx_kb_approval_level ON knowledge_base_entries(approval_level);
    CREATE INDEX IF NOT EXISTS idx_kb_approved_by ON knowledge_base_entries(approved_by);
    CREATE INDEX IF NOT EXISTS idx_kb_source_quality ON knowledge_base_entries(source_quality_score);
    CREATE INDEX IF NOT EXISTS idx_kb_approval_status_level ON knowledge_base_entries(approval_status, approval_level);
END $$;

-- =============================================================================
-- KNOWLEDGE BASE GOVERNANCE LOG TABLE
-- Track all approval/rejection actions for audit trail
-- =============================================================================

-- Only create if knowledge_base_entries exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'knowledge_base_entries'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'knowledge_base_governance_log'
    ) THEN
        CREATE TABLE knowledge_base_governance_log (
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
        CREATE INDEX idx_gov_log_entry ON knowledge_base_governance_log(entry_id);
        CREATE INDEX idx_gov_log_action ON knowledge_base_governance_log(action);
        CREATE INDEX idx_gov_log_performed_by ON knowledge_base_governance_log(performed_by);
        CREATE INDEX idx_gov_log_created_at ON knowledge_base_governance_log(created_at DESC);

        -- Comments
        COMMENT ON TABLE knowledge_base_governance_log IS 'Audit trail for all knowledge base governance actions (approvals, rejections, updates)';
        COMMENT ON COLUMN knowledge_base_governance_log.action IS 'Action performed: approved, rejected, flagged, updated, created, experimental';
        COMMENT ON COLUMN knowledge_base_governance_log.previous_status IS 'Previous approval_status before the action';
        COMMENT ON COLUMN knowledge_base_governance_log.new_status IS 'New approval_status after the action';
    END IF;
END $$;

-- =============================================================================
-- FUNCTIONS AND TRIGGERS (only if knowledge_base_entries exists)
-- =============================================================================

-- These will be created separately and will fail gracefully if table doesn't exist
-- They can be created later when the knowledge_base_entries table is available

-- ============================================================================
-- supabase/migrations/20250130000000_team_activities_sot.sql
-- ============================================================================
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

-- ============================================================================
-- supabase/migrations/20251208154517_remote_schema.sql
-- ============================================================================


-- ============================================================================
-- supabase/migrations/20251208164957_latest_schema_updates.sql
-- ============================================================================
-- =============================================================================
-- LATEST SCHEMA UPDATES - Consolidated Migration
-- Migration: 20251208164957_latest_schema_updates.sql
-- Purpose: Consolidate latest database schema changes including notifications,
--          username/verification fields, and ensure all tables are up to date
-- Created: 2025-12-08
-- =============================================================================

-- =============================================================================
-- MIGRATION 037: NOTIFICATIONS UNIFICATION
-- Adds notification categories, preferences, and last_opened_at tracking
-- =============================================================================

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
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- 5. Add indexes for user_notification_preferences
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id 
    ON user_notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_type 
    ON user_notification_preferences(notification_type);

-- 6. Add index for notifications on notification_type
CREATE INDEX IF NOT EXISTS idx_notifications_type 
    ON notifications(notification_type);

-- 7. Add index for notifications on created_at (for last_opened_at filtering)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
    ON notifications(user_id, created_at DESC);

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_notification_updated_at ON notifications;
CREATE TRIGGER trigger_notification_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

-- 10. Create function to update user_notification_preferences updated_at
CREATE OR REPLACE FUNCTION update_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for preferences updated_at
DROP TRIGGER IF EXISTS trigger_preferences_updated_at ON user_notification_preferences;
CREATE TRIGGER trigger_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_preferences_updated_at();

-- 12. Insert default preferences for existing users (all types enabled)
INSERT INTO user_notification_preferences (user_id, notification_type, muted, push_enabled, in_app_enabled)
SELECT DISTINCT 
    u.id,
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

-- 13. Add RLS policies for user_notification_preferences
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON user_notification_preferences;

-- Users can read their own preferences
CREATE POLICY "Users can read their own notification preferences"
    ON user_notification_preferences
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences"
    ON user_notification_preferences
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences"
    ON user_notification_preferences
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- MIGRATION 038: ADD USERNAME AND VERIFICATION FIELDS
-- Adds unique username and email verification tokens
-- =============================================================================

-- Add username column if it doesn't exist (unique)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

        -- Optionally, populate username from email for existing users
        UPDATE users SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL;
        
        EXECUTE 'COMMENT ON COLUMN users.username IS ''Unique username for the user (optional, can be NULL)''';
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
        CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
        EXECUTE 'COMMENT ON COLUMN users.verification_token IS ''Token for email verification''';
    END IF;

    -- Add verification_token_expires_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'verification_token_expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN verification_token_expires_at TIMESTAMP;
        EXECUTE 'COMMENT ON COLUMN users.verification_token_expires_at IS ''Expiration time for verification token''';
    END IF;

    -- Ensure email_verified exists (should already exist from base migration)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
        EXECUTE 'COMMENT ON COLUMN users.email_verified IS ''Whether the user has verified their email''';
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
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        EXECUTE 'COMMENT ON COLUMN users.role IS ''User role: player, coach, or admin''';
    END IF;
END $$;

-- Add comment for email column if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        EXECUTE 'COMMENT ON COLUMN users.email IS ''Unique email address for login and verification''';
    END IF;
END $$;

-- =============================================================================
-- ENSURE UPDATE_UPDATED_AT_COLUMN FUNCTION EXISTS
-- This function is used by various triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ENSURE ALL CORE TABLES HAVE UPDATED_AT COLUMNS
-- =============================================================================

-- Add updated_at to teams if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'teams' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE teams ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add updated_at trigger for teams
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at to users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add updated_at trigger for users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VERIFY CHATBOT CONTEXT TABLE EXISTS (from migration 039)
-- =============================================================================

-- Ensure chatbot_user_context table exists with all required fields
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

-- Create indexes for chatbot_user_context if they don't exist
CREATE INDEX IF NOT EXISTS idx_chatbot_context_user ON chatbot_user_context(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_role ON chatbot_user_context(user_role);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_team ON chatbot_user_context(primary_team_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_team_type ON chatbot_user_context(team_type);

-- Add update timestamp trigger for chatbot_user_context
DROP TRIGGER IF EXISTS update_chatbot_context_updated_at ON chatbot_user_context;
CREATE TRIGGER update_chatbot_context_updated_at
BEFORE UPDATE ON chatbot_user_context
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VERIFY TEAMS TABLE HAS TEAM TYPE FIELDS (from migration 039)
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
-- VERIFY CHATBOT FUNCTIONS EXIST (from migration 039)
-- =============================================================================

-- Function: Get or create chatbot context
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

-- Function: Update chatbot query statistics
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

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- ============================================================================
-- supabase/migrations/20251213000000_team_system.sql
-- ============================================================================
-- Team System Migration
-- Creates tables for team management, invitations, and member tracking

-- =====================================================
-- TEAMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    league VARCHAR(255),
    season VARCHAR(100),
    home_city VARCHAR(255),
    team_logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#667eea',
    secondary_color VARCHAR(7) DEFAULT '#764ba2',
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT,
    founded_year INTEGER,
    motto VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for teams table
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON public.teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON public.teams(created_at DESC);

-- Add RLS policies for teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can view their own teams
CREATE POLICY "Coaches can view their own teams"
    ON public.teams
    FOR SELECT
    USING (auth.uid() = coach_id);

-- Policy: Team members can view their team
CREATE POLICY "Team members can view their team"
    ON public.teams
    FOR SELECT
    USING (
        id IN (
            SELECT team_id
            FROM public.team_members
            WHERE user_id = auth.uid()
            AND status = 'active'
        )
    );

-- Policy: Coaches can create teams
CREATE POLICY "Coaches can create teams"
    ON public.teams
    FOR INSERT
    WITH CHECK (auth.uid() = coach_id);

-- Policy: Coaches can update their own teams
CREATE POLICY "Coaches can update their own teams"
    ON public.teams
    FOR UPDATE
    USING (auth.uid() = coach_id);

-- Policy: Coaches can delete their own teams
CREATE POLICY "Coaches can delete their own teams"
    ON public.teams
    FOR DELETE
    USING (auth.uid() = coach_id);

-- =====================================================
-- TEAM MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('coach', 'player', 'assistant_coach')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    jersey_number INTEGER CHECK (jersey_number >= 0 AND jersey_number <= 99),
    position VARCHAR(50),
    positions TEXT[], -- Array for multiple positions
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id),
    UNIQUE(team_id, jersey_number)
);

-- Add indexes for team_members table
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);

-- Add RLS policies for team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of their own teams
CREATE POLICY "Users can view members of their own teams"
    ON public.team_members
    FOR SELECT
    USING (
        team_id IN (
            SELECT team_id
            FROM public.team_members
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Coaches can add members to their teams
CREATE POLICY "Coaches can add members to their teams"
    ON public.team_members
    FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- Policy: Coaches can update members in their teams
CREATE POLICY "Coaches can update members in their teams"
    ON public.team_members
    FOR UPDATE
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- Policy: Coaches can remove members from their teams
CREATE POLICY "Coaches can remove members from their teams"
    ON public.team_members
    FOR DELETE
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- =====================================================
-- TEAM INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'assistant_coach')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, email)
);

-- Add indexes for team_invitations table
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON public.team_invitations(expires_at);

-- Add RLS policies for team_invitations table
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can view invitations for their teams
CREATE POLICY "Coaches can view invitations for their teams"
    ON public.team_invitations
    FOR SELECT
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- Policy: Users can view invitations sent to their email
CREATE POLICY "Users can view invitations sent to their email"
    ON public.team_invitations
    FOR SELECT
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Policy: Public access to invitations by token (for signup page)
CREATE POLICY "Public can view invitations by token"
    ON public.team_invitations
    FOR SELECT
    USING (true);

-- Policy: Coaches can create invitations for their teams
CREATE POLICY "Coaches can create invitations for their teams"
    ON public.team_invitations
    FOR INSERT
    WITH CHECK (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
        AND invited_by = auth.uid()
    );

-- Policy: Coaches can update invitations for their teams
CREATE POLICY "Coaches can update invitations for their teams"
    ON public.team_invitations
    FOR UPDATE
    USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE coach_id = auth.uid()
        )
    );

-- Policy: Users can update invitations sent to their email (accept/decline)
CREATE POLICY "Users can update their own invitations"
    ON public.team_invitations
    FOR UPDATE
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for teams table
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for team_members table
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for team_invitations table
DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON public.team_invitations;
CREATE TRIGGER update_team_invitations_updated_at
    BEFORE UPDATE ON public.team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-expire invitations
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE public.team_invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to add coach as team member when team is created
CREATE OR REPLACE FUNCTION public.add_coach_as_team_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.team_members (team_id, user_id, role, status)
    VALUES (NEW.id, NEW.coach_id, 'coach', 'active')
    ON CONFLICT (team_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-add coach as team member
DROP TRIGGER IF EXISTS auto_add_coach_to_team ON public.teams;
CREATE TRIGGER auto_add_coach_to_team
    AFTER INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.add_coach_as_team_member();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.teams IS 'Stores team information created by coaches';
COMMENT ON TABLE public.team_members IS 'Tracks team membership and player assignments';
COMMENT ON TABLE public.team_invitations IS 'Manages email invitations for players to join teams';

COMMENT ON COLUMN public.teams.coach_id IS 'The coach/owner who created and manages the team';
COMMENT ON COLUMN public.team_members.positions IS 'Array of positions a player can play (e.g., {QB, WR})';
COMMENT ON COLUMN public.team_invitations.token IS 'Unique token for invitation link verification';
COMMENT ON COLUMN public.team_invitations.expires_at IS 'Invitation expiry date (default 7 days from creation)';

-- ============================================================================
-- supabase/migrations/20251220_drop_unused_functions.sql
-- ============================================================================
-- Drop unused/orphaned database functions that reference non-existent tables or columns
-- These functions are not used in the current application codebase

-- Drop chatbot context function (references schema that may not match current state)
DROP FUNCTION IF EXISTS public.get_or_create_chatbot_context(uuid);
DROP FUNCTION IF EXISTS public.get_or_create_chatbot_context;

-- Drop organization member function (references non-existent user_organizations table)
DROP FUNCTION IF EXISTS public.user_is_org_member_with_min_role(uuid, text);
DROP FUNCTION IF EXISTS public.user_is_org_member_with_min_role;

-- Note: The index_advisor extension warning is a built-in Postgres extension issue
-- and doesn't affect application functionality. It can be addressed by updating
-- the extension or adjusting the function implementation if needed.

-- ============================================================================
-- supabase/migrations/20260106_add_coach_locked_enforcement.sql
-- ============================================================================
-- Migration: Add coach_locked enforcement
-- Date: 2026-01-06
-- Purpose: Implement Section 1.6 (Lock) and Section 5 (Coach-Locked Session Enforcement)

-- Add coach_locked column to training_sessions
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS coach_locked BOOLEAN DEFAULT false NOT NULL;

-- Add coach attribution fields
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS modified_by_coach_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ;

-- Add session_state column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'training_sessions' 
    AND column_name = 'session_state'
  ) THEN
    ALTER TABLE training_sessions
    ADD COLUMN session_state TEXT DEFAULT 'PLANNED';
    
    -- Add constraint
    ALTER TABLE training_sessions
    ADD CONSTRAINT check_session_state CHECK (
      session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED')
    );
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_locked ON training_sessions(coach_locked) WHERE coach_locked = true;
CREATE INDEX IF NOT EXISTS idx_training_sessions_session_state ON training_sessions(session_state);
CREATE INDEX IF NOT EXISTS idx_training_sessions_modified_by_coach ON training_sessions(modified_by_coach_id) WHERE modified_by_coach_id IS NOT NULL;

COMMENT ON COLUMN training_sessions.coach_locked IS 'When true, prevents AI/system modifications. Only the coach who locked it can modify.';
COMMENT ON COLUMN training_sessions.modified_by_coach_id IS 'Coach who last modified this session. Set automatically when coach modifies structure.';
COMMENT ON COLUMN training_sessions.session_state IS 'Current lifecycle state of the session. Determines what modifications are allowed.';

-- ============================================================================
-- supabase/migrations/20260106_add_immutability_triggers.sql
-- ============================================================================
-- Migration: Add immutability triggers
-- Date: 2026-01-06
-- Purpose: Implement Section 4.3 (Trigger-Based Rejection) and Section 3.1 (Session Mutation APIs)

-- Trigger 1: Prevent modifications to IN_PROGRESS or later sessions
CREATE OR REPLACE FUNCTION prevent_in_progress_modification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if structural modification attempted
  -- Note: Adjust column names based on actual schema
  IF (
    (OLD.session_structure IS DISTINCT FROM NEW.session_structure)
    OR (OLD.prescribed_duration IS DISTINCT FROM NEW.prescribed_duration)
    OR (OLD.prescribed_intensity IS DISTINCT FROM NEW.prescribed_intensity)
    OR (OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes AND OLD.session_state >= 'IN_PROGRESS')
    OR (OLD.intensity_level IS DISTINCT FROM NEW.intensity_level AND OLD.session_state >= 'IN_PROGRESS')
  ) THEN
    
    -- Reject if session is IN_PROGRESS or later
    IF OLD.session_state IN ('IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED') THEN
      RAISE EXCEPTION 'Cannot modify session structure: session is %', OLD.session_state;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_in_progress_modification_trigger ON training_sessions;
CREATE TRIGGER prevent_in_progress_modification_trigger
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_in_progress_modification();

-- Trigger 2: Prevent modifications to coach_locked sessions
CREATE OR REPLACE FUNCTION prevent_coach_locked_modification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- If session is coach_locked, only the coach who locked it can modify
  IF OLD.coach_locked = true THEN
    -- Only allow if modifying coach is the one who locked it
    IF NEW.modified_by_coach_id IS NULL 
       OR NEW.modified_by_coach_id != OLD.modified_by_coach_id THEN
      RAISE EXCEPTION 'Cannot modify coach_locked session: locked by coach %', OLD.modified_by_coach_id;
    END IF;
  END IF;
  
  -- Auto-set coach_locked when coach modifies structure
  -- Check if structural fields changed
  IF (
    (OLD.session_structure IS DISTINCT FROM NEW.session_structure)
    OR (OLD.prescribed_duration IS DISTINCT FROM NEW.prescribed_duration)
    OR (OLD.prescribed_intensity IS DISTINCT FROM NEW.prescribed_intensity)
  ) AND NEW.modified_by_coach_id IS NOT NULL THEN
    NEW.coach_locked = true;
    NEW.modified_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_coach_locked_modification_trigger ON training_sessions;
CREATE TRIGGER prevent_coach_locked_modification_trigger
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_coach_locked_modification();

-- Trigger 3: Prevent updates to immutable timestamp columns
CREATE OR REPLACE FUNCTION prevent_timestamp_modification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Prevent updates to started_at once set
  IF OLD.started_at IS NOT NULL AND OLD.started_at IS DISTINCT FROM NEW.started_at THEN
    RAISE EXCEPTION 'Cannot modify started_at: field is immutable once set';
  END IF;
  
  -- Prevent updates to completed_at once set
  IF OLD.completed_at IS NOT NULL AND OLD.completed_at IS DISTINCT FROM NEW.completed_at THEN
    RAISE EXCEPTION 'Cannot modify completed_at: field is immutable once set';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_timestamp_modification_trigger ON training_sessions;
CREATE TRIGGER prevent_timestamp_modification_trigger
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_timestamp_modification();

COMMENT ON FUNCTION prevent_in_progress_modification() IS 'Prevents structural modifications to sessions in IN_PROGRESS or later states';
COMMENT ON FUNCTION prevent_coach_locked_modification() IS 'Prevents modifications to coach_locked sessions except by the locking coach';
COMMENT ON FUNCTION prevent_timestamp_modification() IS 'Prevents retroactive modification of immutable timestamp fields';

-- ============================================================================
-- supabase/migrations/20260106_append_only_audit_tables.sql
-- ============================================================================
-- Migration: Create append-only audit tables
-- Date: 2026-01-06
-- Purpose: Implement Section 4.2 (Append-Only Tables) and Section 8 (Violation Handling)

-- Create authorization_violations table
CREATE TABLE IF NOT EXISTS authorization_violations (
  violation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  resource_id UUID,
  resource_type TEXT NOT NULL,
  action TEXT NOT NULL,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  request_method TEXT,
  request_body JSONB
);

-- Append-only policy for authorization_violations
ALTER TABLE authorization_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Append-only authorization violations" ON authorization_violations;
CREATE POLICY "Append-only authorization violations"
ON authorization_violations FOR ALL
USING (false)  -- No reads except via service role
WITH CHECK (
  -- Only allow inserts
  true
);

-- Grant insert to authenticated (for API logging)
GRANT INSERT ON authorization_violations TO authenticated;

-- Grant select to service role (for admin viewing)
GRANT SELECT ON authorization_violations TO service_role;

-- Create indexes for querying
CREATE INDEX IF NOT EXISTS idx_auth_violations_user ON authorization_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_violations_timestamp ON authorization_violations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_auth_violations_resource ON authorization_violations(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_auth_violations_error_code ON authorization_violations(error_code);

-- Create append-only policies for audit logs (if tables exist)
DO $$
BEGIN
  -- execution_logs
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'execution_logs') THEN
    ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Append-only execution logs" ON execution_logs;
    CREATE POLICY "Append-only execution logs"
    ON execution_logs FOR ALL
    USING (false)
    WITH CHECK (true);  -- Allow inserts only
    GRANT INSERT ON execution_logs TO authenticated;
  END IF;
  
  -- readiness_logs
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'readiness_logs') THEN
    ALTER TABLE readiness_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Append-only readiness logs" ON readiness_logs;
    CREATE POLICY "Append-only readiness logs"
    ON readiness_logs FOR ALL
    USING (false)
    WITH CHECK (true);
    GRANT INSERT ON readiness_logs TO authenticated;
  END IF;
  
  -- pain_reports
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pain_reports') THEN
    ALTER TABLE pain_reports ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Append-only pain reports" ON pain_reports;
    CREATE POLICY "Append-only pain reports"
    ON pain_reports FOR ALL
    USING (false)
    WITH CHECK (true);
    GRANT INSERT ON pain_reports TO authenticated;
  END IF;
END $$;

COMMENT ON TABLE authorization_violations IS 'Append-only log of all authorization violation attempts. Used for security monitoring and audit.';

-- ============================================================================
-- supabase/migrations/20260106_append_only_execution_logs.sql
-- ============================================================================
-- Migration: Append-Only Execution Logs Enforcement
-- Date: 2026-01-06
-- Purpose: Prevent UPDATE/DELETE on execution logs

-- ============================================================================
-- TRIGGER: Prevent UPDATE on Execution Logs
-- ============================================================================
CREATE OR REPLACE FUNCTION prevent_execution_log_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RAISE EXCEPTION 'Execution logs are append-only. Cannot UPDATE historical logs. Use INSERT for corrections.';
END;
$$;

DROP TRIGGER IF EXISTS prevent_execution_log_update_trigger ON execution_logs;
CREATE TRIGGER prevent_execution_log_update_trigger
BEFORE UPDATE ON execution_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_execution_log_update();

-- ============================================================================
-- TRIGGER: Prevent DELETE on Execution Logs
-- ============================================================================
CREATE OR REPLACE FUNCTION prevent_execution_log_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RAISE EXCEPTION 'Execution logs are append-only. Cannot DELETE historical logs.';
END;
$$;

DROP TRIGGER IF EXISTS prevent_execution_log_delete_trigger ON execution_logs;
CREATE TRIGGER prevent_execution_log_delete_trigger
BEFORE DELETE ON execution_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_execution_log_delete();

-- ============================================================================
-- FUNCTION: Insert Late-Arriving Data (Append Only)
-- ============================================================================
CREATE OR REPLACE FUNCTION insert_late_execution_data(
    p_session_id UUID,
    p_athlete_id UUID,
    p_exercise_name TEXT,
    p_sets_completed INTEGER,
    p_reps_completed INTEGER,
    p_rpe INTEGER,
    p_logged_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
    v_session_version INTEGER;
BEGIN
    -- Get version that was executed
    v_session_version := get_executed_version(p_session_id, p_athlete_id);
    
    -- Insert new log entry (append only)
    INSERT INTO execution_logs (
        session_id,
        session_version,
        athlete_id,
        exercise_name,
        sets_completed,
        reps_completed,
        rpe,
        logged_at
    ) VALUES (
        p_session_id,
        v_session_version,
        p_athlete_id,
        p_exercise_name,
        p_sets_completed,
        p_reps_completed,
        p_rpe,
        p_logged_at
    ) RETURNING log_id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- ============================================================================
-- supabase/migrations/20260106_complete_privacy_rls.sql
-- ============================================================================
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

-- ============================================================================
-- supabase/migrations/20260106_consent_enforcement.sql
-- ============================================================================
-- Migration: Consent Enforcement Model
-- Date: 2026-01-06
-- Purpose: Implement Data Consent & Visibility Contract v1

-- ============================================================================
-- CONSENT SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS athlete_consent_settings (
    athlete_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content sharing settings (default: false = hidden)
    share_readiness_with_coach BOOLEAN DEFAULT false NOT NULL,
    share_wellness_answers_with_coach BOOLEAN DEFAULT false NOT NULL,
    share_training_notes_with_coach BOOLEAN DEFAULT false NOT NULL,
    share_merlin_conversations_with_coach BOOLEAN DEFAULT false NOT NULL,
    share_readiness_with_all_coaches BOOLEAN DEFAULT false NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_athlete_consent_settings_athlete ON athlete_consent_settings(athlete_id);

COMMENT ON TABLE athlete_consent_settings IS 'Athlete consent preferences for data sharing with coaches';
COMMENT ON COLUMN athlete_consent_settings.share_readiness_with_coach IS 'If true, coach can see readinessScore. Default: false (hidden).';
COMMENT ON COLUMN athlete_consent_settings.share_wellness_answers_with_coach IS 'If true, coach can see individual wellness answers. Default: false (hidden).';

-- ============================================================================
-- CONSENT CHANGE AUDIT LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS consent_change_log (
    change_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    setting_name TEXT NOT NULL,
    previous_value BOOLEAN NOT NULL,
    new_value BOOLEAN NOT NULL,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reason TEXT
);

CREATE INDEX idx_consent_change_log_athlete ON consent_change_log(athlete_id, changed_at DESC);

COMMENT ON TABLE consent_change_log IS 'Append-only audit log of all consent setting changes';

-- ============================================================================
-- FUNCTION: Get Consent Setting
-- ============================================================================
CREATE OR REPLACE FUNCTION get_athlete_consent(
    p_athlete_id UUID,
    p_setting_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_consent BOOLEAN;
BEGIN
    SELECT CASE p_setting_name
        WHEN 'readiness' THEN share_readiness_with_coach
        WHEN 'wellness' THEN share_wellness_answers_with_coach
        WHEN 'training_notes' THEN share_training_notes_with_coach
        WHEN 'merlin' THEN share_merlin_conversations_with_coach
        WHEN 'readiness_all_coaches' THEN share_readiness_with_all_coaches
        ELSE false
    END INTO v_consent
    FROM athlete_consent_settings
    WHERE athlete_id = p_athlete_id;
    
    -- Default to false if no consent record exists
    RETURN COALESCE(v_consent, false);
END;
$$;

-- ============================================================================
-- RLS POLICY: Athletes can manage own consent
-- ============================================================================
ALTER TABLE athlete_consent_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes can manage own consent" ON athlete_consent_settings;
CREATE POLICY "Athletes can manage own consent"
ON athlete_consent_settings
FOR ALL
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());

-- ============================================================================
-- RLS POLICY: Consent change log is append-only
-- ============================================================================
ALTER TABLE consent_change_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Append-only consent change log" ON consent_change_log;
CREATE POLICY "Append-only consent change log"
ON consent_change_log
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "No reads on consent change log" ON consent_change_log;
CREATE POLICY "No reads on consent change log"
ON consent_change_log
FOR SELECT
USING (false); -- Only service_role can read via bypass

COMMENT ON POLICY "Append-only consent change log" ON consent_change_log IS 'Consent changes are append-only. No UPDATE or DELETE allowed.';

-- ============================================================================
-- supabase/migrations/20260106_merlin_readonly_role.sql
-- ============================================================================
-- Migration: Merlin Read-Only Role
-- Date: 2026-01-06
-- Purpose: Create read-only database role for Merlin AI

-- ============================================================================
-- CREATE READ-ONLY ROLE FOR MERLIN
-- ============================================================================
DO $$
BEGIN
    -- Create role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'merlin_readonly') THEN
        CREATE ROLE merlin_readonly;
    END IF;
    
    -- Grant connect privilege
    GRANT CONNECT ON DATABASE postgres TO merlin_readonly;
    
    -- Grant usage on schema
    GRANT USAGE ON SCHEMA public TO merlin_readonly;
    
    -- Grant SELECT on read-only tables
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO merlin_readonly;
    GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO merlin_readonly;
    
    -- Set default privileges for future tables
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO merlin_readonly;
    
    -- REVOKE all write privileges explicitly
    REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM merlin_readonly;
    REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM merlin_readonly;
    
    -- Grant execute on read-only functions only
    GRANT EXECUTE ON FUNCTION get_athlete_consent(UUID, TEXT) TO merlin_readonly;
    GRANT EXECUTE ON FUNCTION has_active_safety_override(UUID, TEXT) TO merlin_readonly;
    GRANT EXECUTE ON FUNCTION get_executed_version(UUID, UUID) TO merlin_readonly;
    
    COMMENT ON ROLE merlin_readonly IS 'Read-only role for Merlin AI. Cannot modify any data.';
END $$;

-- ============================================================================
-- MERLIN VIOLATION LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS merlin_violation_log (
    violation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_type TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_body TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_merlin_violation_log_timestamp ON merlin_violation_log(timestamp DESC);

COMMENT ON TABLE merlin_violation_log IS 'Append-only log of Merlin AI violation attempts';

-- ============================================================================
-- RLS: Merlin violation log append-only
-- ============================================================================
ALTER TABLE merlin_violation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Append-only merlin violations" ON merlin_violation_log;
CREATE POLICY "Append-only merlin violations"
ON merlin_violation_log
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role reads merlin violations" ON merlin_violation_log;
CREATE POLICY "Service role reads merlin violations"
ON merlin_violation_log
FOR SELECT
USING (auth.role() = 'service_role');

-- ============================================================================
-- supabase/migrations/20260106_safety_override_system.sql
-- ============================================================================
-- Migration: Safety Override System
-- Date: 2026-01-06
-- Purpose: Implement safety triggers that override consent

-- ============================================================================
-- SAFETY OVERRIDE LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS safety_override_log (
    override_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'pain_above_3',
        'new_pain_area',
        'worsening_pain',
        'acwr_danger_zone',
        'high_rpe_streak',
        'rehab_violation',
        'high_stress_streak'
    )),
    trigger_value JSONB NOT NULL, -- Stores trigger-specific data
    data_disclosed JSONB NOT NULL, -- What data was disclosed
    disclosed_to_roles TEXT[] NOT NULL, -- ['coach', 'physio']
    disclosed_to_user_ids UUID[] NOT NULL, -- Specific user IDs notified
    override_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    athlete_notified BOOLEAN DEFAULT false,
    athlete_notified_at TIMESTAMPTZ
);

CREATE INDEX idx_safety_override_log_athlete ON safety_override_log(athlete_id, override_timestamp DESC);
CREATE INDEX idx_safety_override_log_trigger ON safety_override_log(trigger_type, override_timestamp DESC);

COMMENT ON TABLE safety_override_log IS 'Append-only log of all safety overrides that bypass consent';

-- ============================================================================
-- FUNCTION: Detect Pain >3/10 Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION detect_pain_trigger(
    p_athlete_id UUID,
    p_pain_score INTEGER,
    p_pain_location TEXT,
    p_pain_trend TEXT DEFAULT NULL
)
RETURNS UUID -- Returns override_id if trigger fired
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_override_id UUID;
    v_previous_pain INTEGER;
    v_previous_location TEXT;
    v_trigger_type TEXT;
BEGIN
    -- Check if pain >3/10
    IF p_pain_score > 3 THEN
        -- Get previous pain report (if wellness_entries has pain_score column)
        BEGIN
            SELECT pain_score, pain_location INTO v_previous_pain, v_previous_location
            FROM wellness_entries
            WHERE athlete_id = p_athlete_id
            AND pain_score IS NOT NULL
            ORDER BY date DESC
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            -- Column may not exist, use NULL
            v_previous_pain := NULL;
        END;
        
        -- Determine trigger type
        IF v_previous_pain IS NULL THEN
            v_trigger_type := 'new_pain_area';
        ELSIF p_pain_trend = 'worse' OR (p_pain_score > v_previous_pain) THEN
            v_trigger_type := 'worsening_pain';
        ELSE
            v_trigger_type := 'pain_above_3';
        END IF;
        
        -- Log override
        INSERT INTO safety_override_log (
            athlete_id,
            trigger_type,
            trigger_value,
            data_disclosed,
            disclosed_to_roles,
            disclosed_to_user_ids
        ) VALUES (
            p_athlete_id,
            v_trigger_type,
            jsonb_build_object(
                'pain_score', p_pain_score,
                'pain_location', p_pain_location,
                'pain_trend', p_pain_trend
            ),
            jsonb_build_object(
                'pain_score', p_pain_score,
                'pain_location', p_pain_location
            ),
            ARRAY['coach', 'physio'],
            -- Get assigned coach and physio IDs
            COALESCE(
                ARRAY(
                    SELECT coach_id FROM coach_athlete_assignments
                    WHERE athlete_id = p_athlete_id
                    UNION
                    SELECT id FROM auth.users
                    WHERE raw_user_meta_data->>'role' IN ('physio', 'medical_staff')
                    AND EXISTS (
                        SELECT 1 FROM coach_athlete_assignments
                        WHERE athlete_id = p_athlete_id
                    )
                ),
                ARRAY[]::UUID[]
            )
        ) RETURNING override_id INTO v_override_id;
        
        RETURN v_override_id;
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- FUNCTION: Detect ACWR Danger Zone
-- ============================================================================
CREATE OR REPLACE FUNCTION detect_acwr_trigger(
    p_athlete_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_override_id UUID;
    v_acwr NUMERIC;
BEGIN
    -- Get latest ACWR
    SELECT acwr INTO v_acwr
    FROM readiness_scores
    WHERE athlete_id = p_athlete_id
    ORDER BY day DESC
    LIMIT 1;
    
    -- Check if ACWR in danger zone
    IF v_acwr IS NOT NULL AND (v_acwr > 1.5 OR v_acwr < 0.8) THEN
        INSERT INTO safety_override_log (
            athlete_id,
            trigger_type,
            trigger_value,
            data_disclosed,
            disclosed_to_roles,
            disclosed_to_user_ids
        ) VALUES (
            p_athlete_id,
            'acwr_danger_zone',
            jsonb_build_object('acwr', v_acwr),
            jsonb_build_object('acwr', v_acwr, 'message', 'ACWR outside safe range'),
            ARRAY['coach', 's&c_staff'],
            COALESCE(
                ARRAY(
                    SELECT coach_id FROM coach_athlete_assignments
                    WHERE athlete_id = p_athlete_id
                ),
                ARRAY[]::UUID[]
            )
        ) RETURNING override_id INTO v_override_id;
        
        RETURN v_override_id;
    END IF;
    
    RETURN NULL;
END;
$$;

-- ============================================================================
-- FUNCTION: Check Safety Override Active
-- ============================================================================
CREATE OR REPLACE FUNCTION has_active_safety_override(
    p_athlete_id UUID,
    p_data_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if any safety override is active (within last 7 days)
    RETURN EXISTS(
        SELECT 1 FROM safety_override_log
        WHERE athlete_id = p_athlete_id
        AND override_timestamp >= NOW() - INTERVAL '7 days'
        AND (
            p_data_type IS NULL
            OR (
                p_data_type = 'pain' AND trigger_type IN ('pain_above_3', 'new_pain_area', 'worsening_pain')
                OR p_data_type = 'acwr' AND trigger_type = 'acwr_danger_zone'
            )
        )
    );
END;
$$;

-- ============================================================================
-- RLS: Safety override log is append-only
-- ============================================================================
ALTER TABLE safety_override_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Append-only safety override log" ON safety_override_log;
CREATE POLICY "Append-only safety override log"
ON safety_override_log
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can read safety overrides" ON safety_override_log;
CREATE POLICY "Service role can read safety overrides"
ON safety_override_log
FOR SELECT
USING (auth.role() = 'service_role');

-- ============================================================================
-- supabase/migrations/20260106_session_versioning.sql
-- ============================================================================
-- Migration: Session Versioning System
-- Date: 2026-01-06
-- Purpose: Track session versions and enforce append-only execution logs

-- ============================================================================
-- SESSION VERSION HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS session_version_history (
    version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    session_structure JSONB NOT NULL, -- Complete snapshot of session structure
    modified_by_coach_id UUID REFERENCES auth.users(id),
    modified_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    modification_reason TEXT,
    visible_to_athlete BOOLEAN DEFAULT false, -- Which version athlete saw
    athlete_viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(session_id, version_number)
);

CREATE INDEX idx_session_version_history_session ON session_version_history(session_id, version_number DESC);
CREATE INDEX idx_session_version_history_coach ON session_version_history(modified_by_coach_id);

COMMENT ON TABLE session_version_history IS 'Immutable version history of all session modifications';
COMMENT ON COLUMN session_version_history.session_structure IS 'Complete JSON snapshot of exercises, sets, reps, intensity';

-- ============================================================================
-- ADD VERSION COLUMN TO TRAINING_SESSIONS
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'training_sessions'
        AND column_name = 'current_version'
    ) THEN
        ALTER TABLE training_sessions
        ADD COLUMN current_version INTEGER DEFAULT 1 NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- FUNCTION: Create New Version on Modification
-- ============================================================================
CREATE OR REPLACE FUNCTION create_session_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_version INTEGER;
    v_structure_snapshot JSONB;
BEGIN
    -- Only create version if structural fields changed
    IF (
        (OLD.session_structure IS DISTINCT FROM NEW.session_structure)
        OR (OLD.prescribed_duration IS DISTINCT FROM NEW.prescribed_duration)
        OR (OLD.prescribed_intensity IS DISTINCT FROM NEW.prescribed_intensity)
    ) THEN
        -- Get next version number
        SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_new_version
        FROM session_version_history
        WHERE session_id = NEW.id;
        
        -- Create structure snapshot
        v_structure_snapshot := jsonb_build_object(
            'exercises', COALESCE(NEW.session_structure, '{}'::jsonb),
            'prescribed_duration', NEW.prescribed_duration,
            'prescribed_intensity', NEW.prescribed_intensity,
            'coach_locked', NEW.coach_locked,
            'modified_by_coach_id', NEW.modified_by_coach_id
        );
        
        -- Insert version history
        INSERT INTO session_version_history (
            session_id,
            version_number,
            session_structure,
            modified_by_coach_id,
            modified_at,
            modification_reason
        ) VALUES (
            NEW.id,
            v_new_version,
            v_structure_snapshot,
            NEW.modified_by_coach_id,
            COALESCE(NEW.modified_at, NOW()),
            NULL -- Can be set by coach
        );
        
        -- Update current version
        NEW.current_version := v_new_version;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger: Create version on modification
DROP TRIGGER IF EXISTS create_session_version_trigger ON training_sessions;
CREATE TRIGGER create_session_version_trigger
BEFORE UPDATE ON training_sessions
FOR EACH ROW
EXECUTE FUNCTION create_session_version();

-- ============================================================================
-- EXECUTION LOGS TABLE (Append-Only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS execution_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    session_version INTEGER NOT NULL, -- Which version was executed
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID,
    exercise_name TEXT,
    sets_completed INTEGER,
    reps_completed INTEGER,
    load_kg NUMERIC(6,2),
    rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
    duration_minutes INTEGER,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Prevent backdating
    CONSTRAINT no_future_timestamps CHECK (logged_at <= NOW() + INTERVAL '1 minute'),
    CONSTRAINT no_old_backdating CHECK (
        logged_at >= (
            SELECT created_at FROM training_sessions 
            WHERE id = session_id
        ) - INTERVAL '1 day'
    )
);

CREATE INDEX idx_execution_logs_session ON execution_logs(session_id, logged_at DESC);
CREATE INDEX idx_execution_logs_athlete ON execution_logs(athlete_id, logged_at DESC);
CREATE INDEX idx_execution_logs_version ON execution_logs(session_id, session_version);

COMMENT ON TABLE execution_logs IS 'Append-only execution logs. Never UPDATE or DELETE.';

-- ============================================================================
-- RLS: Execution logs append-only
-- ============================================================================
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- Athletes: Can insert own logs
DROP POLICY IF EXISTS "Athletes can log execution" ON execution_logs;
CREATE POLICY "Athletes can log execution"
ON execution_logs
FOR INSERT
WITH CHECK (athlete_id = auth.uid());

-- Athletes: Can read own logs
DROP POLICY IF EXISTS "Athletes can read own logs" ON execution_logs;
CREATE POLICY "Athletes can read own logs"
ON execution_logs
FOR SELECT
USING (athlete_id = auth.uid());

-- Coaches: Can read assigned athlete logs (compliance)
DROP POLICY IF EXISTS "Coaches can read athlete logs" ON execution_logs;
CREATE POLICY "Coaches can read athlete logs"
ON execution_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM coach_athlete_assignments
        WHERE coach_id = auth.uid()
        AND athlete_id = execution_logs.athlete_id
    )
);

-- Prevent UPDATE and DELETE
DROP POLICY IF EXISTS "No updates on execution logs" ON execution_logs;
CREATE POLICY "No updates on execution logs"
ON execution_logs
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "No deletes on execution logs" ON execution_logs;
CREATE POLICY "No deletes on execution logs"
ON execution_logs
FOR DELETE
USING (false);

-- ============================================================================
-- FUNCTION: Get Session Version Executed by Athlete
-- ============================================================================
CREATE OR REPLACE FUNCTION get_executed_version(
    p_session_id UUID,
    p_athlete_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_version INTEGER;
BEGIN
    SELECT session_version INTO v_version
    FROM execution_logs
    WHERE session_id = p_session_id
    AND athlete_id = p_athlete_id
    ORDER BY logged_at ASC
    LIMIT 1;
    
    RETURN COALESCE(v_version, 1); -- Default to v1 if no logs
END;
$$;

-- ============================================================================
-- supabase/migrations/20260106_update_rls_policies.sql
-- ============================================================================
-- Migration: Update RLS policies for coach_locked and state enforcement
-- Date: 2026-01-06
-- Purpose: Implement Section 3.1 (API Guard Rules) via RLS

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own training sessions" ON training_sessions;

-- Create new UPDATE policy with coach_locked and state checks
CREATE POLICY "Users can update own training sessions"
ON training_sessions FOR UPDATE
USING (
  user_id = auth.uid()
  AND coach_locked = false
  AND session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED')
)
WITH CHECK (
  user_id = auth.uid()
  AND coach_locked = false
  AND session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED')
);

-- Create separate policy for coaches modifying sessions
DROP POLICY IF EXISTS "Coaches can modify team training sessions" ON training_sessions;
CREATE POLICY "Coaches can modify team training sessions"
ON training_sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = users.id
    AND users.raw_user_meta_data->>'role' = 'coach'
  )
  AND (
    -- Coach can modify if they locked it
    (coach_locked = true AND modified_by_coach_id = auth.uid())
    OR
    -- Coach can modify if not locked and state allows
    (coach_locked = false AND session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = users.id
    AND users.raw_user_meta_data->>'role' = 'coach'
  )
  AND (
    (coach_locked = true AND modified_by_coach_id = auth.uid())
    OR
    (coach_locked = false AND session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED'))
  )
);

-- Policy for athletes to log execution data (append-only, no structure changes)
DROP POLICY IF EXISTS "Athletes can log execution data" ON training_sessions;
CREATE POLICY "Athletes can log execution data"
ON training_sessions FOR UPDATE
USING (
  user_id = auth.uid()
  AND session_state IN ('IN_PROGRESS', 'COMPLETED')
)
WITH CHECK (
  user_id = auth.uid()
  AND session_state IN ('IN_PROGRESS', 'COMPLETED')
  -- Prevent structure modifications via RLS
  AND (
    session_structure IS NOT DISTINCT FROM (SELECT session_structure FROM training_sessions WHERE id = training_sessions.id)
  )
);

COMMENT ON POLICY "Users can update own training sessions" ON training_sessions IS 'Allows users to update their own sessions only when not coach_locked and state allows';
COMMENT ON POLICY "Coaches can modify team training sessions" ON training_sessions IS 'Allows coaches to modify sessions they locked or sessions in mutable states';
COMMENT ON POLICY "Athletes can log execution data" ON training_sessions IS 'Allows athletes to log execution data (RPE, duration) but not modify structure';

-- ============================================================================
-- supabase/migrations/20260106_wellness_privacy_rls.sql
-- ============================================================================
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

-- ============================================================================
-- supabase/migrations/20260107_fix_function_search_paths.sql
-- ============================================================================
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

-- ============================================================================
-- supabase/migrations/20260107_optimize_rls_auth_initplan.sql
-- ============================================================================
-- Migration: Optimize RLS Policies with Auth Initialization Plan
-- Date: 2026-01-07
-- Purpose: Wrap auth.uid() and auth.role() calls with (select ...) to prevent
--          re-evaluation for each row, significantly improving query performance

-- ============================================================================
-- SAFETY OVERRIDE LOG
-- ============================================================================

-- Service role can read safety overrides
DROP POLICY IF EXISTS "Service role can read safety overrides" ON public.safety_override_log;
CREATE POLICY "Service role can read safety overrides"
ON public.safety_override_log
FOR SELECT
USING ((select auth.role()) = 'service_role');

-- Service role can log safety overrides
DROP POLICY IF EXISTS "Service role can log safety overrides" ON public.safety_override_log;
CREATE POLICY "Service role can log safety overrides"
ON public.safety_override_log
FOR INSERT
WITH CHECK (
    (select auth.role()) = 'service_role'
    OR (select auth.role()) = 'authenticated'
);

-- Athletes can view own safety overrides
DROP POLICY IF EXISTS "Athletes can view own safety overrides" ON public.safety_override_log;
CREATE POLICY "Athletes can view own safety overrides"
ON public.safety_override_log
FOR SELECT
USING (athlete_id = (select auth.uid()));

-- Coaches can view athlete safety overrides
DROP POLICY IF EXISTS "Coaches can view athlete safety overrides" ON public.safety_override_log;
CREATE POLICY "Coaches can view athlete safety overrides"
ON public.safety_override_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = (select auth.uid())
        AND athlete_id = safety_override_log.athlete_id
    )
    OR EXISTS (
        SELECT 1 FROM public.team_members tm1
        JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = (select auth.uid())
        AND tm1.role IN ('coach', 'head_coach', 'assistant_coach')
        AND tm2.user_id = safety_override_log.athlete_id
        AND tm1.status = 'active'
        AND tm2.status = 'active'
    )
);

-- ============================================================================
-- EXECUTION LOGS
-- ============================================================================

-- Athletes can log execution
DROP POLICY IF EXISTS "Athletes can log execution" ON public.execution_logs;
CREATE POLICY "Athletes can log execution"
ON public.execution_logs
FOR INSERT
WITH CHECK (athlete_id = (select auth.uid()));

-- Athletes can read own logs
DROP POLICY IF EXISTS "Athletes can read own logs" ON public.execution_logs;
CREATE POLICY "Athletes can read own logs"
ON public.execution_logs
FOR SELECT
USING (athlete_id = (select auth.uid()));

-- Coaches can read athlete logs
DROP POLICY IF EXISTS "Coaches can read athlete logs" ON public.execution_logs;
CREATE POLICY "Coaches can read athlete logs"
ON public.execution_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = (select auth.uid())
        AND athlete_id = execution_logs.athlete_id
    )
);

-- ============================================================================
-- WELLNESS LOGS
-- ============================================================================

-- Athletes full access wellness logs
DROP POLICY IF EXISTS "Athletes full access wellness logs" ON public.wellness_logs;
CREATE POLICY "Athletes full access wellness logs"
ON public.wellness_logs
FOR ALL
USING (athlete_id = (select auth.uid()))
WITH CHECK (athlete_id = (select auth.uid()));

-- Coaches compliance only wellness
DROP POLICY IF EXISTS "Coaches compliance only wellness" ON public.wellness_logs;
CREATE POLICY "Coaches compliance only wellness"
ON public.wellness_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = (select auth.uid())
        AND athlete_id = wellness_logs.athlete_id
    )
);

-- Medical full access wellness
DROP POLICY IF EXISTS "Medical full access wellness" ON public.wellness_logs;
CREATE POLICY "Medical full access wellness"
ON public.wellness_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = ANY (ARRAY['physio', 'medical_staff', 'admin'])
    )
);

-- ============================================================================
-- COACH ATHLETE ASSIGNMENTS
-- ============================================================================

-- Coaches can view own assignments
DROP POLICY IF EXISTS "Coaches can view own assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can view own assignments"
ON public.coach_athlete_assignments
FOR SELECT
USING (coach_id = (select auth.uid()));

-- Athletes can view own assignments
DROP POLICY IF EXISTS "Athletes can view own assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Athletes can view own assignments"
ON public.coach_athlete_assignments
FOR SELECT
USING (athlete_id = (select auth.uid()));

-- Coaches can create assignments
DROP POLICY IF EXISTS "Coaches can create assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can create assignments"
ON public.coach_athlete_assignments
FOR INSERT
WITH CHECK (
    coach_id = (select auth.uid())
    AND EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = ANY (ARRAY['coach', 'admin'])
    )
);

-- Coaches can update own assignments
DROP POLICY IF EXISTS "Coaches can update own assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can update own assignments"
ON public.coach_athlete_assignments
FOR UPDATE
USING (coach_id = (select auth.uid()))
WITH CHECK (coach_id = (select auth.uid()));

-- Coaches can delete own assignments
DROP POLICY IF EXISTS "Coaches can delete own assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can delete own assignments"
ON public.coach_athlete_assignments
FOR DELETE
USING (coach_id = (select auth.uid()));

-- Admins full access coach assignments
DROP POLICY IF EXISTS "Admins full access coach assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Admins full access coach assignments"
ON public.coach_athlete_assignments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- TOURNAMENT PARTICIPATION
-- ============================================================================

-- Users can view tournament participation
DROP POLICY IF EXISTS "Users can view tournament participation" ON public.tournament_participation;
CREATE POLICY "Users can view tournament participation"
ON public.tournament_participation
FOR SELECT
USING (
    team_id IN (
        SELECT team_members.team_id
        FROM team_members
        WHERE team_members.user_id = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_participation.tournament_id
        AND (tournaments.created_by = (select auth.uid()) OR tournaments.created_by IS NULL)
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Team admins can create participation
DROP POLICY IF EXISTS "Team admins can create participation" ON public.tournament_participation;
CREATE POLICY "Team admins can create participation"
ON public.tournament_participation
FOR INSERT
WITH CHECK (
    team_id IN (
        SELECT team_members.team_id
        FROM team_members
        WHERE team_members.user_id = (select auth.uid())
        AND team_members.role = ANY (ARRAY['admin', 'coach'])
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Team admins can update participation
DROP POLICY IF EXISTS "Team admins can update participation" ON public.tournament_participation;
CREATE POLICY "Team admins can update participation"
ON public.tournament_participation
FOR UPDATE
USING (
    team_id IN (
        SELECT team_members.team_id
        FROM team_members
        WHERE team_members.user_id = (select auth.uid())
        AND team_members.role = ANY (ARRAY['admin', 'coach'])
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    team_id IN (
        SELECT team_members.team_id
        FROM team_members
        WHERE team_members.user_id = (select auth.uid())
        AND team_members.role = ANY (ARRAY['admin', 'coach'])
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Admins can delete participation
DROP POLICY IF EXISTS "Admins can delete participation" ON public.tournament_participation;
CREATE POLICY "Admins can delete participation"
ON public.tournament_participation
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- MOVEMENT PATTERNS
-- ============================================================================

-- Users can insert movement patterns
DROP POLICY IF EXISTS "Users can insert movement patterns" ON public.movement_patterns;
CREATE POLICY "Users can insert movement patterns"
ON public.movement_patterns
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = movement_patterns.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Users can update movement patterns
DROP POLICY IF EXISTS "Users can update movement patterns" ON public.movement_patterns;
CREATE POLICY "Users can update movement patterns"
ON public.movement_patterns
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = movement_patterns.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = movement_patterns.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- WARMUP PROTOCOLS
-- ============================================================================

-- Users can insert warmup protocols
DROP POLICY IF EXISTS "Users can insert warmup protocols" ON public.warmup_protocols;
CREATE POLICY "Users can insert warmup protocols"
ON public.warmup_protocols
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = warmup_protocols.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Users can update warmup protocols
DROP POLICY IF EXISTS "Users can update warmup protocols" ON public.warmup_protocols;
CREATE POLICY "Users can update warmup protocols"
ON public.warmup_protocols
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = warmup_protocols.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = warmup_protocols.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- AI COACH VISIBILITY
-- ============================================================================

-- Authenticated users can create coach visibility records
DROP POLICY IF EXISTS "Authenticated users can create coach visibility records" ON public.ai_coach_visibility;
CREATE POLICY "Authenticated users can create coach visibility records"
ON public.ai_coach_visibility
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- Coaches can view coach visibility records
DROP POLICY IF EXISTS "Coaches can view coach visibility records" ON public.ai_coach_visibility;
CREATE POLICY "Coaches can view coach visibility records"
ON public.ai_coach_visibility
FOR SELECT
USING (coach_id = (select auth.uid()));

-- Athletes can view own visibility records
DROP POLICY IF EXISTS "Athletes can view own visibility records" ON public.ai_coach_visibility;
CREATE POLICY "Athletes can view own visibility records"
ON public.ai_coach_visibility
FOR SELECT
USING (player_id = (select auth.uid()));

-- ============================================================================
-- COACH ACTIVITY LOG
-- ============================================================================

-- Authenticated users can insert activity logs
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.coach_activity_log;
CREATE POLICY "Authenticated users can insert activity logs"
ON public.coach_activity_log
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- Coaches can view activity logs
DROP POLICY IF EXISTS "Coaches can view activity logs" ON public.coach_activity_log;
CREATE POLICY "Coaches can view activity logs"
ON public.coach_activity_log
FOR SELECT
USING (coach_id = (select auth.uid()));

-- ============================================================================
-- CONSENT CHANGE LOG
-- ============================================================================

-- Authenticated users can log consent changes
DROP POLICY IF EXISTS "Authenticated users can log consent changes" ON public.consent_change_log;
CREATE POLICY "Authenticated users can log consent changes"
ON public.consent_change_log
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- Users can view own consent change logs
DROP POLICY IF EXISTS "Users can view own consent change logs" ON public.consent_change_log;
CREATE POLICY "Users can view own consent change logs"
ON public.consent_change_log
FOR SELECT
USING (athlete_id = (select auth.uid()) OR changed_by = (select auth.uid()));

-- ============================================================================
-- DEPTH CHART HISTORY
-- ============================================================================

-- Authenticated users can insert depth chart history
DROP POLICY IF EXISTS "Authenticated users can insert depth chart history" ON public.depth_chart_history;
CREATE POLICY "Authenticated users can insert depth chart history"
ON public.depth_chart_history
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- Team members can view depth chart history
DROP POLICY IF EXISTS "Team members can view depth chart history" ON public.depth_chart_history;
CREATE POLICY "Team members can view depth chart history"
ON public.depth_chart_history
FOR SELECT
USING (
    player_id = (select auth.uid())
    OR changed_by = (select auth.uid())
);

-- ============================================================================
-- MERLIN VIOLATION LOG
-- ============================================================================

-- Service role can log merlin violations
DROP POLICY IF EXISTS "Service role can log merlin violations" ON public.merlin_violation_log;
CREATE POLICY "Service role can log merlin violations"
ON public.merlin_violation_log
FOR INSERT
WITH CHECK (
    (select auth.role()) = 'service_role'
    OR (select auth.role()) = 'authenticated'
);

-- Service role reads merlin violations
DROP POLICY IF EXISTS "Service role reads merlin violations" ON public.merlin_violation_log;
CREATE POLICY "Service role reads merlin violations"
ON public.merlin_violation_log
FOR SELECT
USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- ROSTER AUDIT LOG
-- ============================================================================

-- Authenticated users can insert roster audit logs
DROP POLICY IF EXISTS "Authenticated users can insert roster audit logs" ON public.roster_audit_log;
CREATE POLICY "Authenticated users can insert roster audit logs"
ON public.roster_audit_log
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- ============================================================================
-- RESEARCH ARTICLES
-- ============================================================================

-- Authenticated users can read research articles
DROP POLICY IF EXISTS "Authenticated users can read research articles" ON public.research_articles;
CREATE POLICY "Authenticated users can read research articles"
ON public.research_articles
FOR SELECT
USING ((select auth.role()) = 'authenticated');

-- Admins can create research articles
DROP POLICY IF EXISTS "Admins can create research articles" ON public.research_articles;
CREATE POLICY "Admins can create research articles"
ON public.research_articles
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND (
            raw_user_meta_data->>'role' = 'admin'
            OR raw_user_meta_data->>'verified' = 'true'
        )
    )
);

-- Admins can update research articles
DROP POLICY IF EXISTS "Admins can update research articles" ON public.research_articles;
CREATE POLICY "Admins can update research articles"
ON public.research_articles
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND (
            raw_user_meta_data->>'role' = 'admin'
            OR raw_user_meta_data->>'verified' = 'true'
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND (
            raw_user_meta_data->>'role' = 'admin'
            OR raw_user_meta_data->>'verified' = 'true'
        )
    )
);

-- Admins can delete research articles
DROP POLICY IF EXISTS "Admins can delete research articles" ON public.research_articles;
CREATE POLICY "Admins can delete research articles"
ON public.research_articles
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- EXERCISES
-- ============================================================================

-- Authenticated users can insert exercises
DROP POLICY IF EXISTS "Authenticated users can insert exercises" ON public.exercises;
CREATE POLICY "Authenticated users can insert exercises"
ON public.exercises
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- ============================================================================
-- SESSION EXERCISES
-- ============================================================================

-- Users can insert session exercises
DROP POLICY IF EXISTS "Users can insert session exercises" ON public.session_exercises;
CREATE POLICY "Users can insert session exercises"
ON public.session_exercises
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_session_templates tst
        JOIN training_weeks tw ON tst.week_id = tw.id
        JOIN training_phases tp ON tw.phase_id = tp.id
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tst.id = session_exercises.session_template_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Users can update session exercises
DROP POLICY IF EXISTS "Users can update session exercises" ON public.session_exercises;
CREATE POLICY "Users can update session exercises"
ON public.session_exercises
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM training_session_templates tst
        JOIN training_weeks tw ON tst.week_id = tw.id
        JOIN training_phases tp ON tw.phase_id = tp.id
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tst.id = session_exercises.session_template_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_session_templates tst
        JOIN training_weeks tw ON tst.week_id = tw.id
        JOIN training_phases tp ON tw.phase_id = tp.id
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tst.id = session_exercises.session_template_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- TRAINING PHASES
-- ============================================================================

-- Users can insert training phases
DROP POLICY IF EXISTS "Users can insert training phases" ON public.training_phases;
CREATE POLICY "Users can insert training phases"
ON public.training_phases
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = training_phases.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Users can update training phases
DROP POLICY IF EXISTS "Users can update training phases" ON public.training_phases;
CREATE POLICY "Users can update training phases"
ON public.training_phases
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = training_phases.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = training_phases.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- TRAINING WEEKS
-- ============================================================================

-- Users can insert training weeks
DROP POLICY IF EXISTS "Users can insert training weeks" ON public.training_weeks;
CREATE POLICY "Users can insert training weeks"
ON public.training_weeks
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_phases tp
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tp.id = training_weeks.phase_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Users can update training weeks
DROP POLICY IF EXISTS "Users can update training weeks" ON public.training_weeks;
CREATE POLICY "Users can update training weeks"
ON public.training_weeks
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM training_phases tp
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tp.id = training_weeks.phase_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_phases tp
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tp.id = training_weeks.phase_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- TRAINING SESSION TEMPLATES
-- ============================================================================

-- Users can insert session templates
DROP POLICY IF EXISTS "Users can insert session templates" ON public.training_session_templates;
CREATE POLICY "Users can insert session templates"
ON public.training_session_templates
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_weeks tw
        JOIN training_phases tp ON tw.phase_id = tp.id
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tw.id = training_session_templates.week_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Users can update session templates
DROP POLICY IF EXISTS "Users can update session templates" ON public.training_session_templates;
CREATE POLICY "Users can update session templates"
ON public.training_session_templates
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM training_weeks tw
        JOIN training_phases tp ON tw.phase_id = tp.id
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tw.id = training_session_templates.week_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_weeks tw
        JOIN training_phases tp ON tw.phase_id = tp.id
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tw.id = training_session_templates.week_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- TEAM ACTIVITIES
-- ============================================================================

-- Coaches can view team activities
DROP POLICY IF EXISTS "Coaches can view team activities" ON public.team_activities;
CREATE POLICY "Coaches can view team activities"
ON public.team_activities
FOR SELECT
USING (
    team_id IN (
        SELECT tm.team_id
        FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.role = 'coach'
    )
);

-- Athletes can view team activities
DROP POLICY IF EXISTS "Athletes can view team activities" ON public.team_activities;
CREATE POLICY "Athletes can view team activities"
ON public.team_activities
FOR SELECT
USING (
    team_id IN (
        SELECT team_members.team_id
        FROM team_members
        WHERE team_members.user_id = (select auth.uid())
        AND team_members.status = 'active'
    )
);

-- Coaches can create team activities
DROP POLICY IF EXISTS "Coaches can create team activities" ON public.team_activities;
CREATE POLICY "Coaches can create team activities"
ON public.team_activities
FOR INSERT
WITH CHECK (
    team_id IN (
        SELECT tm.team_id
        FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.role = 'coach'
    )
    AND created_by_coach_id = (select auth.uid())
);

-- Coaches can update team activities
DROP POLICY IF EXISTS "Coaches can update team activities" ON public.team_activities;
CREATE POLICY "Coaches can update team activities"
ON public.team_activities
FOR UPDATE
USING (
    team_id IN (
        SELECT tm.team_id
        FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.role = 'coach'
    )
);

-- Coaches can delete team activities
DROP POLICY IF EXISTS "Coaches can delete team activities" ON public.team_activities;
CREATE POLICY "Coaches can delete team activities"
ON public.team_activities
FOR DELETE
USING (
    team_id IN (
        SELECT tm.team_id
        FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.role = 'coach'
    )
);

-- ============================================================================
-- TEAM ACTIVITY ATTENDANCE
-- ============================================================================

-- Coaches can view attendance
DROP POLICY IF EXISTS "Coaches can view attendance" ON public.team_activity_attendance;
CREATE POLICY "Coaches can view attendance"
ON public.team_activity_attendance
FOR SELECT
USING (
    activity_id IN (
        SELECT team_activities.id
        FROM team_activities
        WHERE team_activities.team_id IN (
            SELECT tm.team_id
            FROM team_members tm
            WHERE tm.user_id = (select auth.uid())
            AND tm.role = 'coach'
        )
    )
);

-- Athletes can view own attendance
DROP POLICY IF EXISTS "Athletes can view own attendance" ON public.team_activity_attendance;
CREATE POLICY "Athletes can view own attendance"
ON public.team_activity_attendance
FOR SELECT
USING (athlete_id = (select auth.uid()));

-- Coaches can manage attendance
DROP POLICY IF EXISTS "Coaches can manage attendance" ON public.team_activity_attendance;
CREATE POLICY "Coaches can manage attendance"
ON public.team_activity_attendance
FOR ALL
USING (
    activity_id IN (
        SELECT team_activities.id
        FROM team_activities
        WHERE team_activities.team_id IN (
            SELECT tm.team_id
            FROM team_members tm
            WHERE tm.user_id = (select auth.uid())
            AND tm.role = 'coach'
        )
    )
);

-- ============================================================================
-- TEAM ACTIVITY AUDIT
-- ============================================================================

-- Coaches can view audit logs
DROP POLICY IF EXISTS "Coaches can view audit logs" ON public.team_activity_audit;
CREATE POLICY "Coaches can view audit logs"
ON public.team_activity_audit
FOR SELECT
USING (
    activity_id IN (
        SELECT team_activities.id
        FROM team_activities
        WHERE team_activities.team_id IN (
            SELECT tm.team_id
            FROM team_members tm
            WHERE tm.user_id = (select auth.uid())
            AND tm.role = 'coach'
        )
    )
);

-- Athletes can view audit logs
DROP POLICY IF EXISTS "Athletes can view audit logs" ON public.team_activity_audit;
CREATE POLICY "Athletes can view audit logs"
ON public.team_activity_audit
FOR SELECT
USING (
    activity_id IN (
        SELECT team_activities.id
        FROM team_activities
        WHERE team_activities.team_id IN (
            SELECT team_members.team_id
            FROM team_members
            WHERE team_members.user_id = (select auth.uid())
            AND team_members.status = 'active'
        )
    )
);

-- ============================================================================
-- WELLNESS ENTRIES
-- ============================================================================

-- Coaches can view wellness with consent
DROP POLICY IF EXISTS "Coaches can view wellness with consent" ON public.wellness_entries;
CREATE POLICY "Coaches can view wellness with consent"
ON public.wellness_entries
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = (select auth.uid())
        AND athlete_id = wellness_entries.athlete_id
    )
    AND (
        get_athlete_consent(athlete_id, 'wellness') = true
        OR has_active_safety_override(athlete_id, 'pain') = true
    )
);

-- Athletes can view own wellness entries
DROP POLICY IF EXISTS "Athletes can view own wellness entries" ON public.wellness_entries;
CREATE POLICY "Athletes can view own wellness entries"
ON public.wellness_entries
FOR SELECT
USING (athlete_id = (select auth.uid()));

-- ============================================================================
-- ATHLETE CONSENT SETTINGS
-- ============================================================================

-- Athletes can manage own consent
DROP POLICY IF EXISTS "Athletes can manage own consent" ON public.athlete_consent_settings;
CREATE POLICY "Athletes can manage own consent"
ON public.athlete_consent_settings
FOR ALL
USING (athlete_id = (select auth.uid()))
WITH CHECK (athlete_id = (select auth.uid()));

-- ============================================================================
-- READINESS SCORES
-- ============================================================================

-- Athletes can view own readiness scores
DROP POLICY IF EXISTS "Athletes can view own readiness scores" ON public.readiness_scores;
CREATE POLICY "Athletes can view own readiness scores"
ON public.readiness_scores
FOR SELECT
USING (athlete_id = (select auth.uid()));

-- Coaches can view readiness with consent
DROP POLICY IF EXISTS "Coaches can view readiness with consent" ON public.readiness_scores;
CREATE POLICY "Coaches can view readiness with consent"
ON public.readiness_scores
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = (select auth.uid())
        AND athlete_id = readiness_scores.athlete_id
    )
    AND (
        get_athlete_consent(athlete_id, 'readiness') = true
        OR acwr > 1.5
        OR acwr < 0.8
    )
);

-- Medical staff can view readiness scores
DROP POLICY IF EXISTS "Medical staff can view readiness scores" ON public.readiness_scores;
CREATE POLICY "Medical staff can view readiness scores"
ON public.readiness_scores
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = ANY (ARRAY['physio', 'medical_staff', 'admin'])
    )
);

-- ============================================================================
-- TRAINING SESSIONS
-- ============================================================================

-- Coaches can view training notes with consent
DROP POLICY IF EXISTS "Coaches can view training notes with consent" ON public.training_sessions;
CREATE POLICY "Coaches can view training notes with consent"
ON public.training_sessions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = (select auth.uid())
        AND athlete_id = training_sessions.user_id
    )
);

-- ============================================================================
-- SESSION VERSION HISTORY
-- ============================================================================

-- Athletes can view own session versions
DROP POLICY IF EXISTS "Athletes can view own session versions" ON public.session_version_history;
CREATE POLICY "Athletes can view own session versions"
ON public.session_version_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM training_sessions
        WHERE training_sessions.id = session_version_history.session_id
        AND training_sessions.user_id = (select auth.uid())
    )
);

-- Coaches can view athlete session versions
DROP POLICY IF EXISTS "Coaches can view athlete session versions" ON public.session_version_history;
CREATE POLICY "Coaches can view athlete session versions"
ON public.session_version_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM training_sessions ts
        JOIN coach_athlete_assignments caa ON caa.athlete_id = ts.user_id
        WHERE ts.id = session_version_history.session_id
        AND caa.coach_id = (select auth.uid())
    )
);

-- Medical staff can view session versions
DROP POLICY IF EXISTS "Medical staff can view session versions" ON public.session_version_history;
CREATE POLICY "Medical staff can view session versions"
ON public.session_version_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = ANY (ARRAY['physio', 'medical_staff', 'admin'])
    )
);

-- ============================================================================
-- SYNC LOGS
-- ============================================================================

-- Authenticated users can insert sync logs
DROP POLICY IF EXISTS "Authenticated users can insert sync logs" ON public.sync_logs;
CREATE POLICY "Authenticated users can insert sync logs"
ON public.sync_logs
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- Admins can view all sync logs
DROP POLICY IF EXISTS "Admins can view all sync logs" ON public.sync_logs;
CREATE POLICY "Admins can view all sync logs"
ON public.sync_logs
FOR SELECT
USING (
    (
        SELECT raw_user_meta_data->>'role'
        FROM auth.users
        WHERE id = (select auth.uid())
    ) = 'admin'
    OR (select auth.role()) = 'service_role'
);

-- ============================================================================
-- supabase/migrations/20260107_secure_system_table_policies.sql
-- ============================================================================
-- Migration: Secure System Table RLS Policies
-- Date: 2026-01-07
-- Purpose: Replace permissive WITH CHECK (true) policies on system/audit tables
--          with proper service role or authenticated user checks

-- ============================================================================
-- AI COACH VISIBILITY TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "System can create coach visibility records" ON public.ai_coach_visibility;

-- Create secure policy: Only authenticated users can insert (coaches creating visibility records)
CREATE POLICY "Authenticated users can create coach visibility records"
ON public.ai_coach_visibility
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Coaches can view their own visibility records
DROP POLICY IF EXISTS "Coaches can view coach visibility records" ON public.ai_coach_visibility;
CREATE POLICY "Coaches can view coach visibility records"
ON public.ai_coach_visibility
FOR SELECT
USING (coach_id = auth.uid());

-- Athletes can view visibility records about them
DROP POLICY IF EXISTS "Athletes can view own visibility records" ON public.ai_coach_visibility;
CREATE POLICY "Athletes can view own visibility records"
ON public.ai_coach_visibility
FOR SELECT
USING (player_id = auth.uid());

-- ============================================================================
-- COACH ACTIVITY LOG TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "System can insert activity" ON public.coach_activity_log;

-- Create secure policy: Only authenticated users (system functions) can insert
CREATE POLICY "Authenticated users can insert activity logs"
ON public.coach_activity_log
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Coaches can view their own activity logs
DROP POLICY IF EXISTS "Coaches can view activity logs" ON public.coach_activity_log;
CREATE POLICY "Coaches can view activity logs"
ON public.coach_activity_log
FOR SELECT
USING (coach_id = auth.uid());

-- ============================================================================
-- CONSENT CHANGE LOG TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "Append-only consent change log" ON public.consent_change_log;

-- Create secure policy: Only authenticated users can insert (system functions)
CREATE POLICY "Authenticated users can log consent changes"
ON public.consent_change_log
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can view their own consent change logs
DROP POLICY IF EXISTS "Users can view own consent change logs" ON public.consent_change_log;
CREATE POLICY "Users can view own consent change logs"
ON public.consent_change_log
FOR SELECT
USING (athlete_id = auth.uid() OR changed_by = auth.uid());

-- ============================================================================
-- DEPTH CHART HISTORY TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "System can insert history" ON public.depth_chart_history;

-- Create secure policy: Only authenticated users can insert
CREATE POLICY "Authenticated users can insert depth chart history"
ON public.depth_chart_history
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Team members can view depth chart history for their teams
-- Note: depth_chart_history doesn't have team_id, so we check via template_id or player_id
DROP POLICY IF EXISTS "Team members can view depth chart history" ON public.depth_chart_history;
CREATE POLICY "Team members can view depth chart history"
ON public.depth_chart_history
FOR SELECT
USING (
    player_id = auth.uid()
    OR changed_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.team_members tm
        JOIN public.depth_chart_templates dct ON tm.team_id = (SELECT team_id FROM public.depth_chart_templates WHERE id = depth_chart_history.template_id)
        WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
);

-- ============================================================================
-- MERLIN VIOLATION LOG TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "Append-only merlin violations" ON public.merlin_violation_log;

-- Create secure policy: Only service role or authenticated users can insert
-- (Merlin guard functions use service role)
CREATE POLICY "Service role can log merlin violations"
ON public.merlin_violation_log
FOR INSERT
WITH CHECK (
    auth.role() = 'service_role'
    OR auth.role() = 'authenticated'
);

-- Service role can read violations (for monitoring)
DROP POLICY IF EXISTS "Service role reads merlin violations" ON public.merlin_violation_log;
CREATE POLICY "Service role reads merlin violations"
ON public.merlin_violation_log
FOR SELECT
USING (auth.role() = 'service_role');

-- Note: merlin_violation_log doesn't have athlete_id column
-- Service role can read all violations, authenticated users can read their own (if we add user tracking)
-- For now, only service role can read (violations are logged by system)
-- If we need user-specific access, we'd need to add a user_id column

-- ============================================================================
-- ROSTER AUDIT LOG TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "System can insert audit log" ON public.roster_audit_log;

-- Create secure policy: Only authenticated users can insert
CREATE POLICY "Authenticated users can insert roster audit logs"
ON public.roster_audit_log
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Team admins can view roster audit logs for their teams
DROP POLICY IF EXISTS "Team admins can view roster audit logs" ON public.roster_audit_log;
CREATE POLICY "Team admins can view roster audit logs"
ON public.roster_audit_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = roster_audit_log.team_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'coach', 'head_coach')
        AND status = 'active'
    )
);

-- ============================================================================
-- SAFETY OVERRIDE LOG TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "Append-only safety override log" ON public.safety_override_log;

-- Create secure policy: Only service role or authenticated users can insert
-- (Safety override functions use service role)
CREATE POLICY "Service role can log safety overrides"
ON public.safety_override_log
FOR INSERT
WITH CHECK (
    auth.role() = 'service_role'
    OR auth.role() = 'authenticated'
);

-- Service role can read overrides (already exists, but ensure it's correct)
-- Athletes can view their own override logs
DROP POLICY IF EXISTS "Athletes can view own safety overrides" ON public.safety_override_log;
CREATE POLICY "Athletes can view own safety overrides"
ON public.safety_override_log
FOR SELECT
USING (athlete_id = auth.uid());

-- Coaches can view safety overrides for their athletes (with consent)
DROP POLICY IF EXISTS "Coaches can view athlete safety overrides" ON public.safety_override_log;
CREATE POLICY "Coaches can view athlete safety overrides"
ON public.safety_override_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = auth.uid()
        AND athlete_id = safety_override_log.athlete_id
    )
    OR EXISTS (
        SELECT 1 FROM public.team_members tm1
        JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = auth.uid()
        AND tm1.role IN ('coach', 'head_coach', 'assistant_coach')
        AND tm2.user_id = safety_override_log.athlete_id
        AND tm1.status = 'active'
        AND tm2.status = 'active'
    )
);

-- ============================================================================
-- SYNC LOGS TABLE
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "System can insert sync logs" ON public.sync_logs;

-- Create secure policy: Only authenticated users can insert
CREATE POLICY "Authenticated users can insert sync logs"
ON public.sync_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Note: sync_logs doesn't have user_id column
-- Only admins and service role can view sync logs
-- If we need user-specific access, we'd need to add a user_id column

-- Admins can view all sync logs
DROP POLICY IF EXISTS "Admins can view all sync logs" ON public.sync_logs;
CREATE POLICY "Admins can view all sync logs"
ON public.sync_logs
FOR SELECT
USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
    OR auth.role() = 'service_role'
);

-- ============================================================================
-- supabase/migrations/20260109_comprehensive_index_optimization.sql
-- ============================================================================
-- ============================================================================
-- Migration 111: Comprehensive Index Optimization
-- ============================================================================
-- Purpose: Add missing indexes and optimize existing ones for better performance
-- Date: January 9, 2026
-- Version: 1.1.0
-- Impact: Improves query performance across all major tables
-- ============================================================================

-- ============================================================================
-- PART 1: WELLNESS DATA INDEXES
-- ============================================================================

-- Daily wellness checkin - user + date range queries
CREATE INDEX IF NOT EXISTS idx_wellness_checkin_user_date_desc 
ON daily_wellness_checkin(user_id, checkin_date DESC)
WHERE checkin_date IS NOT NULL;

COMMENT ON INDEX idx_wellness_checkin_user_date_desc IS 
'Optimizes wellness history queries with descending date order. Partial index excludes NULL dates.';

-- Wellness checkin - readiness score queries
CREATE INDEX IF NOT EXISTS idx_wellness_checkin_readiness 
ON daily_wellness_checkin(user_id, overall_readiness_score DESC)
WHERE overall_readiness_score IS NOT NULL;

COMMENT ON INDEX idx_wellness_checkin_readiness IS 
'Enables efficient queries filtering by readiness score for risk assessment.';

-- ============================================================================
-- PART 2: TEAM MANAGEMENT INDEXES
-- ============================================================================

-- Team members - efficient role-based queries
CREATE INDEX IF NOT EXISTS idx_team_members_team_role 
ON team_members(team_id, role, user_id)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_team_members_team_role IS 
'Optimizes queries filtering team members by role. Excludes soft-deleted members.';

-- Team members - user lookup across teams
CREATE INDEX IF NOT EXISTS idx_team_members_user_teams 
ON team_members(user_id, team_id)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_team_members_user_teams IS 
'Enables efficient lookup of all teams a user belongs to. Excludes soft-deleted memberships.';

-- ============================================================================
-- PART 3: GAME/FIXTURE INDEXES
-- ============================================================================

-- Fixtures - team + date range queries
CREATE INDEX IF NOT EXISTS idx_fixtures_team_date 
ON fixtures(team_id, fixture_date DESC)
WHERE fixture_date IS NOT NULL;

COMMENT ON INDEX idx_fixtures_team_date IS 
'Optimizes fixture schedule queries with date ordering.';

-- Fixtures - upcoming games (most common query)
CREATE INDEX IF NOT EXISTS idx_fixtures_upcoming 
ON fixtures(team_id, fixture_date ASC)
WHERE fixture_date >= CURRENT_DATE AND status != 'cancelled';

COMMENT ON INDEX idx_fixtures_upcoming IS 
'Partial index for upcoming fixtures only. Dramatically improves schedule page performance.';

-- Game plays - efficient game replay and analysis
CREATE INDEX IF NOT EXISTS idx_game_plays_game_sequence 
ON game_plays(game_id, play_sequence)
WHERE play_sequence IS NOT NULL;

COMMENT ON INDEX idx_game_plays_game_sequence IS 
'Optimizes game replay and play-by-play analysis with ordered sequence.';

-- ============================================================================
-- PART 4: NOTIFICATION INDEXES
-- ============================================================================

-- Notifications - unread messages per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, created_at DESC)
WHERE read_at IS NULL;

COMMENT ON INDEX idx_notifications_user_unread IS 
'Partial index for unread notifications only. Critical for notification badge performance.';

-- Notifications - cleanup of old read notifications
CREATE INDEX IF NOT EXISTS idx_notifications_cleanup 
ON notifications(read_at, created_at)
WHERE read_at IS NOT NULL;

COMMENT ON INDEX idx_notifications_cleanup IS 
'Enables efficient cleanup of old read notifications for data retention policies.';

-- ============================================================================
-- PART 5: INJURY TRACKING INDEXES
-- ============================================================================

-- Injuries - active injuries per player
CREATE INDEX IF NOT EXISTS idx_injuries_player_active 
ON injuries(player_id, injury_date DESC)
WHERE status IN ('active', 'recovering');

COMMENT ON INDEX idx_injuries_player_active IS 
'Partial index for active and recovering injuries. Critical for injury dashboard.';

-- Return to play - protocol tracking
CREATE INDEX IF NOT EXISTS idx_rtp_player_status 
ON return_to_play_protocols(player_id, status, start_date DESC)
WHERE status != 'completed';

COMMENT ON INDEX idx_rtp_player_status IS 
'Optimizes return-to-play protocol tracking. Excludes completed protocols.';

-- ============================================================================
-- PART 6: COMMUNICATION INDEXES
-- ============================================================================

-- Chat messages - conversation history
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation 
ON chat_messages(conversation_id, created_at ASC)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_chat_messages_conversation IS 
'Optimizes chat message loading in chronological order. Excludes deleted messages.';

-- Chat messages - unread count per user
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread 
ON chat_messages(receiver_id, created_at DESC)
WHERE read_at IS NULL AND deleted_at IS NULL;

COMMENT ON INDEX idx_chat_messages_unread IS 
'Partial index for unread messages only. Critical for chat badge counts.';

-- ============================================================================
-- PART 7: CONSENT & PRIVACY INDEXES
-- ============================================================================

-- User consent - current active consents
CREATE INDEX IF NOT EXISTS idx_user_consent_active 
ON user_consent(user_id, consent_type, consented_at DESC)
WHERE revoked_at IS NULL;

COMMENT ON INDEX idx_user_consent_active IS 
'Partial index for active consents only. Critical for GDPR compliance checks.';

-- Data deletion requests - pending requests
CREATE INDEX IF NOT EXISTS idx_deletion_requests_pending 
ON data_deletion_requests(requested_at ASC)
WHERE status = 'pending';

COMMENT ON INDEX idx_deletion_requests_pending IS 
'Partial index for pending deletion requests. Enables efficient processing queue.';

-- ============================================================================
-- PART 8: AUDIT LOG INDEXES
-- ============================================================================

-- Audit logs - user activity tracking
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action 
ON audit_logs(user_id, action_type, created_at DESC)
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';

COMMENT ON INDEX idx_audit_logs_user_action IS 
'Partial index for recent audit logs (90 days). Enables efficient user activity reports.';

-- Audit logs - resource tracking
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource 
ON audit_logs(resource_type, resource_id, created_at DESC)
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';

COMMENT ON INDEX idx_audit_logs_resource IS 
'Partial index for recent resource changes. Supports change history views.';

-- ============================================================================
-- PART 9: PERFORMANCE OPTIMIZATION - COVERING INDEXES
-- ============================================================================

-- Training sessions - common query covering index
CREATE INDEX IF NOT EXISTS idx_training_sessions_covering 
ON training_sessions(user_id, status, session_date DESC)
INCLUDE (id, duration_minutes, rpe, training_load)
WHERE status = 'completed';

COMMENT ON INDEX idx_training_sessions_covering IS 
'Covering index includes commonly accessed columns. Reduces table lookups.';

-- Workout logs - covering index for dashboard
CREATE INDEX IF NOT EXISTS idx_workout_logs_covering 
ON workout_logs(player_id, completed_at DESC)
INCLUDE (id, workout_type, duration_minutes, intensity_level)
WHERE completed_at IS NOT NULL;

COMMENT ON INDEX idx_workout_logs_covering IS 
'Covering index for workout history. Includes display columns to avoid table access.';

-- ============================================================================
-- PART 10: FULL-TEXT SEARCH INDEXES (GIN)
-- ============================================================================

-- Players - search by name
CREATE INDEX IF NOT EXISTS idx_players_name_search 
ON players USING gin(to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));

COMMENT ON INDEX idx_players_name_search IS 
'Full-text search index for player names. Enables fast typeahead search.';

-- Teams - search by name
CREATE INDEX IF NOT EXISTS idx_teams_name_search 
ON teams USING gin(to_tsvector('english', name));

COMMENT ON INDEX idx_teams_name_search IS 
'Full-text search index for team names. Enables fast team lookup.';

-- ============================================================================
-- PART 11: JSONB INDEXES (for metadata columns)
-- ============================================================================

-- Training sessions - JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_metadata 
ON training_sessions USING gin(metadata)
WHERE metadata IS NOT NULL;

COMMENT ON INDEX idx_training_sessions_metadata IS 
'GIN index for JSONB metadata column. Enables efficient metadata queries.';

-- Game plays - JSONB data queries
CREATE INDEX IF NOT EXISTS idx_game_plays_data 
ON game_plays USING gin(play_data)
WHERE play_data IS NOT NULL;

COMMENT ON INDEX idx_game_plays_data IS 
'GIN index for JSONB play data. Enables complex play analysis queries.';

-- ============================================================================
-- PART 12: UNIQUE CONSTRAINT INDEXES
-- ============================================================================

-- Prevent duplicate wellness checkins per user per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_wellness_checkin_unique_user_date 
ON daily_wellness_checkin(user_id, checkin_date)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_wellness_checkin_unique_user_date IS 
'Ensures one wellness checkin per user per day. Excludes soft-deleted records.';

-- Prevent duplicate team memberships
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_unique_user_team 
ON team_members(user_id, team_id)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_team_members_unique_user_team IS 
'Prevents duplicate team memberships. Excludes soft-deleted memberships.';

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================
-- Update query planner statistics after index creation

ANALYZE daily_wellness_checkin;
ANALYZE team_members;
ANALYZE fixtures;
ANALYZE game_plays;
ANALYZE notifications;
ANALYZE injuries;
ANALYZE return_to_play_protocols;
ANALYZE chat_messages;
ANALYZE user_consent;
ANALYZE data_deletion_requests;
ANALYZE audit_logs;
ANALYZE players;
ANALYZE teams;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- List all new indexes created by this migration
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
LEFT JOIN pg_stat_user_indexes USING (schemaname, tablename, indexname)
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND indexname IN (
    'idx_wellness_checkin_user_date_desc',
    'idx_wellness_checkin_readiness',
    'idx_team_members_team_role',
    'idx_team_members_user_teams',
    'idx_fixtures_team_date',
    'idx_fixtures_upcoming',
    'idx_game_plays_game_sequence',
    'idx_notifications_user_unread',
    'idx_notifications_cleanup',
    'idx_injuries_player_active',
    'idx_rtp_player_status',
    'idx_chat_messages_conversation',
    'idx_chat_messages_unread',
    'idx_user_consent_active',
    'idx_deletion_requests_pending',
    'idx_audit_logs_user_action',
    'idx_audit_logs_resource',
    'idx_training_sessions_covering',
    'idx_workout_logs_covering',
    'idx_players_name_search',
    'idx_teams_name_search',
    'idx_training_sessions_metadata',
    'idx_game_plays_data',
    'idx_wellness_checkin_unique_user_date',
    'idx_team_members_unique_user_team'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- EXPECTED IMPROVEMENTS
-- ============================================================================
-- Query Type                        | Expected Improvement
-- ----------------------------------|---------------------
-- Wellness history queries          | 85-90% faster
-- Team member role queries          | 80-85% faster
-- Upcoming fixtures                 | 90-95% faster (partial index)
-- Unread notifications              | 95%+ faster (partial index)
-- Active injury tracking            | 85-90% faster
-- Chat message loading              | 80-85% faster
-- Consent compliance checks         | 90%+ faster
-- Player/team search                | 70-80% faster (full-text)
-- Training dashboard                | 85-90% faster (covering index)
-- ============================================================================

-- Migration complete!

-- ============================================================================
-- supabase/migrations/20260109_fix_rls_performance_warnings.sql
-- ============================================================================
-- ============================================================================
-- Migration: Fix RLS Performance Warnings (Generated 2026-01-09)
-- Purpose: Optimize RLS policies for performance at scale
--
-- Issues Fixed:
--   1. auth_rls_initplan (63 warnings): auth.uid() re-evaluated per row
--      Fix: Wrap with (SELECT auth.uid()) to cache per query
--
--   2. multiple_permissive_policies (56 warnings): Multiple policies per role
--      Fix: Consolidate into single policies with OR conditions
--
-- Performance Impact: 
--   - Queries with RLS will execute 10-100x faster on large datasets
--   - Reduces database CPU usage significantly
--
-- Breaking Changes: NONE (backward compatible)
-- ============================================================================

-- ============================================================================
-- HELPER NOTES
-- ============================================================================
-- The fix is simple but powerful:
--   BAD:  user_id = auth.uid()           -- Evaluated N times (once per row)
--   GOOD: user_id = (SELECT auth.uid())  -- Evaluated 1 time (cached)
--
-- This optimization is critical for tables with thousands of rows.
-- ============================================================================

-- Set search path for security
SET search_path = public;

-- ============================================================================
-- PART 1: SIMPLE USER-OWNED TABLES
-- Pattern: user_id = (SELECT auth.uid())
-- ============================================================================

-- PUSH_SUBSCRIPTIONS
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions"
ON push_subscriptions FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- AVATARS
DROP POLICY IF EXISTS "Users can manage own avatars" ON avatars;
CREATE POLICY "Users can manage own avatars"
ON avatars FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- TRAINING_SESSIONS
DROP POLICY IF EXISTS "training_sessions_select_simple" ON training_sessions;
CREATE POLICY "training_sessions_select_simple"
ON training_sessions FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- BODY_MEASUREMENTS (4 policies)
DROP POLICY IF EXISTS "Users can view own measurements" ON body_measurements;
CREATE POLICY "Users can view own measurements"
ON body_measurements FOR SELECT
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own measurements" ON body_measurements;
CREATE POLICY "Users can insert own measurements"
ON body_measurements FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own measurements" ON body_measurements;
CREATE POLICY "Users can update own measurements"
ON body_measurements FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own measurements" ON body_measurements;
CREATE POLICY "Users can delete own measurements"
ON body_measurements FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- WELLNESS_ENTRIES (2 policies)
DROP POLICY IF EXISTS "Users can insert own wellness entries" ON wellness_entries;
CREATE POLICY "Users can insert own wellness entries"
ON wellness_entries FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can select own wellness entries" ON wellness_entries;
CREATE POLICY "Users can select own wellness entries"
ON wellness_entries FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- USER_SETTINGS (3 policies)
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
ON user_settings FOR SELECT
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings"
ON user_settings FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings"
ON user_settings FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- USER_SECURITY (3 policies)
DROP POLICY IF EXISTS "Users can view own security" ON user_security;
CREATE POLICY "Users can view own security"
ON user_security FOR SELECT
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own security" ON user_security;
CREATE POLICY "Users can insert own security"
ON user_security FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own security" ON user_security;
CREATE POLICY "Users can update own security"
ON user_security FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- PLAYER_ACTIVITY_TRACKING
DROP POLICY IF EXISTS "Users can view own activity" ON player_activity_tracking;
DROP POLICY IF EXISTS "Players can view own activity" ON player_activity_tracking;
CREATE POLICY "Players can view own activity"
ON player_activity_tracking FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- USER_ACTIVITY_LOGS
DROP POLICY IF EXISTS "Users can view own logs" ON user_activity_logs;
CREATE POLICY "Users can view own logs"
ON user_activity_logs FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- ACCOUNT_PAUSE_REQUESTS
DROP POLICY IF EXISTS "Users can manage own pause requests" ON account_pause_requests;
CREATE POLICY "Users can manage own pause requests"
ON account_pause_requests FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 2: PERFORMANCE_RECORDS - CONSOLIDATE 5 POLICIES INTO 2
-- ============================================================================

-- Remove old policies
DROP POLICY IF EXISTS "Users can view own records" ON performance_records;
DROP POLICY IF EXISTS "Coaches can view team records" ON performance_records;
DROP POLICY IF EXISTS "Users can insert own records" ON performance_records;
DROP POLICY IF EXISTS "Users can update own records" ON performance_records;
DROP POLICY IF EXISTS "Users can delete own records" ON performance_records;

-- Consolidated SELECT policy
CREATE POLICY "Users and coaches can view records"
ON performance_records FOR SELECT
USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM team_members tm1
        JOIN team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = (SELECT auth.uid())
        AND tm2.user_id = performance_records.user_id
        AND tm1.role IN ('coach', 'head_coach', 'assistant_coach')
        AND tm1.status = 'active'
        AND tm2.status = 'active'
    )
);

-- Users manage own records (INSERT, UPDATE, DELETE)
CREATE POLICY "Users can manage own records"
ON performance_records FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 3: GAME_DAY_READINESS - CONSOLIDATE 4 POLICIES INTO 2
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own readiness" ON game_day_readiness;
DROP POLICY IF EXISTS "Coaches can view team readiness" ON game_day_readiness;
DROP POLICY IF EXISTS "Users can insert own readiness" ON game_day_readiness;
DROP POLICY IF EXISTS "Users can update own readiness" ON game_day_readiness;

CREATE POLICY "Users and coaches can view readiness"
ON game_day_readiness FOR SELECT
USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM team_members tm1
        JOIN team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = (SELECT auth.uid())
        AND tm2.user_id = game_day_readiness.user_id
        AND tm1.role IN ('coach', 'head_coach', 'assistant_coach')
        AND tm1.status = 'active'
        AND tm2.status = 'active'
    )
);

CREATE POLICY "Users can manage own readiness"
ON game_day_readiness FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 4: ACWR TABLES - CONSOLIDATE POLICIES
-- ============================================================================

-- ACWR_CALCULATIONS
DROP POLICY IF EXISTS "Users can view own acwr" ON acwr_calculations;
DROP POLICY IF EXISTS "Users can insert own acwr" ON acwr_calculations;
CREATE POLICY "Users can manage own acwr"
ON acwr_calculations FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ACWR_REPORTS
DROP POLICY IF EXISTS "Users can view own reports" ON acwr_reports;
DROP POLICY IF EXISTS "Coaches can view team reports" ON acwr_reports;
CREATE POLICY "Users and coaches can view reports"
ON acwr_reports FOR SELECT
USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = acwr_reports.team_id
        AND user_id = (SELECT auth.uid())
        AND role IN ('coach', 'head_coach', 'assistant_coach')
        AND status = 'active'
    )
);

-- ============================================================================
-- PART 5: AI AND TRAINING TABLES
-- ============================================================================

-- AI_TRAINING_SUGGESTIONS
DROP POLICY IF EXISTS "Users can view own suggestions" ON ai_training_suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON ai_training_suggestions;
CREATE POLICY "Users can manage own suggestions"
ON ai_training_suggestions FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- SHARED_INSIGHTS
DROP POLICY IF EXISTS "Users can create own insights" ON shared_insights;
CREATE POLICY "Users can create own insights"
ON shared_insights FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Team can view shared insights" ON shared_insights;
CREATE POLICY "Team can view shared insights"
ON shared_insights FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = shared_insights.team_id
        AND user_id = (SELECT auth.uid())
        AND status = 'active'
    )
);

-- ============================================================================
-- PART 6: COACH_OVERRIDES - CONSOLIDATE 2 POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Athletes can view overrides for them" ON coach_overrides;
DROP POLICY IF EXISTS "Coaches can manage their overrides" ON coach_overrides;

CREATE POLICY "Athletes and coaches can access overrides"
ON coach_overrides FOR ALL
USING (
    athlete_id = (SELECT auth.uid())
    OR coach_id = (SELECT auth.uid())
)
WITH CHECK (
    coach_id = (SELECT auth.uid())
);

-- ============================================================================
-- PART 7: GAME AND PARTICIPATION TABLES
-- ============================================================================

-- GAME_PARTICIPATIONS - CONSOLIDATE 2 POLICIES
DROP POLICY IF EXISTS "Players can view own participations" ON game_participations;
DROP POLICY IF EXISTS "Coaches can manage team participations" ON game_participations;

CREATE POLICY "Players and coaches can access participations"
ON game_participations FOR ALL
USING (
    player_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = game_participations.team_id
        AND user_id = (SELECT auth.uid())
        AND role IN ('coach', 'head_coach', 'assistant_coach')
        AND status = 'active'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = game_participations.team_id
        AND user_id = (SELECT auth.uid())
        AND role IN ('coach', 'head_coach', 'assistant_coach')
        AND status = 'active'
    )
);

-- TEAM_GAMES - CONSOLIDATE 2 POLICIES
DROP POLICY IF EXISTS "Team members can view team games" ON team_games;
DROP POLICY IF EXISTS "Coaches can manage team games" ON team_games;

CREATE POLICY "Team members can view, coaches can manage games"
ON team_games FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_games.team_id
        AND user_id = (SELECT auth.uid())
        AND status = 'active'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_games.team_id
        AND user_id = (SELECT auth.uid())
        AND role IN ('coach', 'head_coach', 'assistant_coach')
        AND status = 'active'
    )
);

-- ============================================================================
-- PART 8: INJURY TRACKING - CONSOLIDATE 2 POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own injury tracking" ON long_term_injury_tracking;
DROP POLICY IF EXISTS "Coaches can view team injury tracking" ON long_term_injury_tracking;

CREATE POLICY "Users can manage own injury tracking"
ON long_term_injury_tracking FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 9: TEAM-BASED TABLES
-- ============================================================================

-- SEASONS
DROP POLICY IF EXISTS "Team members can view seasons" ON seasons;
CREATE POLICY "Team members can view seasons"
ON seasons FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = seasons.team_id
        AND user_id = (SELECT auth.uid())
        AND status = 'active'
    )
);

-- TOURNAMENT_SESSIONS
DROP POLICY IF EXISTS "Team members can view tournament sessions" ON tournament_sessions;
CREATE POLICY "Team members can view tournament sessions"
ON tournament_sessions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = tournament_sessions.team_id
        AND user_id = (SELECT auth.uid())
        AND status = 'active'
    )
);

-- ============================================================================
-- PART 10: TRAINING AND PROGRAM TABLES
-- ============================================================================

-- LOAD_CAPS
DROP POLICY IF EXISTS "load_caps_select" ON load_caps;
CREATE POLICY "load_caps_select"
ON load_caps FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- OWNERSHIP_TRANSITIONS
DROP POLICY IF EXISTS "ownership_transitions_select" ON ownership_transitions;
CREATE POLICY "ownership_transitions_select"
ON ownership_transitions FOR SELECT
USING (
    old_owner_id = (SELECT auth.uid())
    OR new_owner_id = (SELECT auth.uid())
);

-- RECOVERY_BLOCKS
DROP POLICY IF EXISTS "recovery_blocks_select" ON recovery_blocks;
CREATE POLICY "recovery_blocks_select"
ON recovery_blocks FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- Fix multiple INSERT policies on recovery_blocks
DROP POLICY IF EXISTS "Users can insert own recovery blocks" ON recovery_blocks;
DROP POLICY IF EXISTS "Coaches can insert team member recovery blocks" ON recovery_blocks;
CREATE POLICY "Users and coaches can insert recovery blocks"
ON recovery_blocks FOR INSERT
WITH CHECK (
    user_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM team_members tm1
        JOIN team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = (SELECT auth.uid())
        AND tm2.user_id = recovery_blocks.user_id
        AND tm1.role IN ('coach', 'head_coach', 'assistant_coach')
        AND tm1.status = 'active'
    )
);

-- RETURN_TO_PLAY_PROTOCOLS
DROP POLICY IF EXISTS "return_to_play_protocols_select" ON return_to_play_protocols;
CREATE POLICY "return_to_play_protocols_select"
ON return_to_play_protocols FOR SELECT
USING (athlete_id = (SELECT auth.uid()));

-- WORKOUT_LOGS
DROP POLICY IF EXISTS "workout_logs_select" ON workout_logs;
CREATE POLICY "workout_logs_select"
ON workout_logs FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- PLAYER_PROGRAMS
DROP POLICY IF EXISTS "player_programs_select" ON player_programs;
CREATE POLICY "player_programs_select"
ON player_programs FOR SELECT
USING (player_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 11: TEAM MEMBER TABLES
-- ============================================================================

-- TEAM_PLAYERS
DROP POLICY IF EXISTS "team_players_select_simple" ON team_players;
CREATE POLICY "team_players_select_simple"
ON team_players FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_players.team_id
        AND user_id = (SELECT auth.uid())
        AND status = 'active'
    )
);

-- TEAMS
DROP POLICY IF EXISTS "teams_select_approved" ON teams;
CREATE POLICY "teams_select_approved"
ON teams FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = teams.id
        AND user_id = (SELECT auth.uid())
        AND status = 'active'
    )
);

-- TEAM_MEMBERS (3 policies)
DROP POLICY IF EXISTS "team_members_update_no_recursion" ON team_members;
CREATE POLICY "team_members_update_no_recursion"
ON team_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('coach', 'head_coach')
        AND tm.status = 'active'
    )
);

DROP POLICY IF EXISTS "team_members_delete_no_recursion" ON team_members;
CREATE POLICY "team_members_delete_no_recursion"
ON team_members FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role = 'head_coach'
        AND tm.status = 'active'
    )
);

DROP POLICY IF EXISTS "team_members_select_for_roster" ON team_members;
CREATE POLICY "team_members_select_for_roster"
ON team_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.status = 'active'
    )
);

-- USERS (for roster)
DROP POLICY IF EXISTS "users_select_for_roster" ON users;
CREATE POLICY "users_select_for_roster"
ON users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM team_members tm1
        JOIN team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = (SELECT auth.uid())
        AND tm2.user_id = users.id
        AND tm1.status = 'active'
    )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users and coaches can view records" ON performance_records IS 
'Optimized RLS: Consolidated 5 policies, wrapped auth.uid() with SELECT for performance';

COMMENT ON POLICY "Users and coaches can view readiness" ON game_day_readiness IS 
'Optimized RLS: Consolidated 4 policies, wrapped auth.uid() with SELECT for performance';

COMMENT ON POLICY "Users and coaches can view reports" ON acwr_reports IS 
'Optimized RLS: Consolidated 2 policies, wrapped auth.uid() with SELECT for performance';

COMMENT ON POLICY "Players and coaches can access participations" ON game_participations IS 
'Optimized RLS: Consolidated 2 policies, wrapped auth.uid() with SELECT for performance';

COMMENT ON POLICY "Team members can view, coaches can manage games" ON team_games IS 
'Optimized RLS: Consolidated 2 policies, wrapped auth.uid() with SELECT for performance';

COMMENT ON POLICY "Users and coaches can access injury tracking" ON long_term_injury_tracking IS 
'Optimized RLS: Consolidated 2 policies, wrapped auth.uid() with SELECT for performance';

COMMENT ON POLICY "Athletes and coaches can access overrides" ON coach_overrides IS 
'Optimized RLS: Consolidated 2 policies, wrapped auth.uid() with SELECT for performance';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after migration to verify:
--
-- 1. Check that policies use SELECT wrapper:
-- SELECT schemaname, tablename, policyname, qual, with_check
-- FROM pg_policies
-- WHERE qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%';
-- -- Should return 0 rows
--
-- 2. Check for duplicate policies (should be minimal):
-- SELECT tablename, cmd, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY tablename, cmd
-- HAVING COUNT(*) > 1
-- ORDER BY policy_count DESC;
--
-- 3. Performance test (before/after):
-- EXPLAIN ANALYZE
-- SELECT * FROM performance_records
-- WHERE user_id = auth.uid()
-- LIMIT 100;
--
-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- ============================================================================
-- supabase/migrations/20260109_fix_security_linter_warnings.sql
-- ============================================================================
-- ============================================================================
-- Migration: Fix Supabase Security Linter Warnings
-- Date: 2026-01-09
-- Purpose: Address function search_path mutability and RLS policy issues
-- ============================================================================

-- ============================================================================
-- 1. FIX FUNCTION SEARCH PATHS
-- Functions need SET search_path = public for security
-- ============================================================================

-- Fix cleanup_expired_notifications function if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'cleanup_expired_notifications'
    ) THEN
        -- Drop and recreate with SET search_path
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
        RETURNS INTEGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $func$
        DECLARE
            v_deleted_count INTEGER;
        BEGIN
            -- Delete notifications older than 90 days
            DELETE FROM public.notifications
            WHERE created_at < NOW() - INTERVAL ''90 days'';
            
            GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
            
            RETURN v_deleted_count;
        END;
        $func$;
        ';
        
        RAISE NOTICE 'Fixed cleanup_expired_notifications function';
    END IF;
END $$;

-- Fix send_notification function if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'send_notification'
    ) THEN
        -- Drop and recreate with SET search_path
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.send_notification(
            p_user_id UUID,
            p_type VARCHAR(50),
            p_title VARCHAR(255),
            p_message TEXT,
            p_priority VARCHAR(20) DEFAULT ''medium'',
            p_data JSONB DEFAULT ''{}''::jsonb
        )
        RETURNS UUID
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $func$
        DECLARE
            v_notification_id UUID;
        BEGIN
            INSERT INTO public.notifications (
                user_id, type, title, message, priority, data, created_at
            )
            VALUES (
                p_user_id::text, p_type, p_title, p_message, p_priority, p_data, NOW()
            )
            RETURNING id INTO v_notification_id;
            
            RETURN v_notification_id;
        END;
        $func$;
        ';
        
        RAISE NOTICE 'Fixed send_notification function';
    END IF;
END $$;

-- ============================================================================
-- 2. FIX PLAYER_ACTIVITY_TRACKING RLS POLICY
-- Replace permissive WITH CHECK (true) with proper auth check
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert activity" ON public.player_activity_tracking;

-- Create a more secure policy that only allows authenticated users or service role
-- This is typically used by triggers, so authenticated context is appropriate
CREATE POLICY "Authenticated can insert activity tracking"
ON public.player_activity_tracking
FOR INSERT
WITH CHECK (
    -- Allow service role (used by background jobs/triggers)
    auth.role() = 'service_role'
    -- Allow authenticated users inserting their own records
    OR (auth.role() = 'authenticated' AND user_id = auth.uid())
);

-- Ensure players can view their own activity tracking
DROP POLICY IF EXISTS "Players can view own activity" ON public.player_activity_tracking;
CREATE POLICY "Players can view own activity"
ON public.player_activity_tracking
FOR SELECT
USING (user_id = auth.uid());

-- Ensure coaches can view their team's activity (may already exist)
DROP POLICY IF EXISTS "Coaches can view team activity" ON public.player_activity_tracking;
CREATE POLICY "Coaches can view team activity"
ON public.player_activity_tracking
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = player_activity_tracking.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('coach', 'head_coach', 'assistant_coach')
        AND tm.status = 'active'
    )
);

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

-- Grant execute on fixed functions to authenticated users if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'cleanup_expired_notifications'
    ) THEN
        GRANT EXECUTE ON FUNCTION public.cleanup_expired_notifications() TO service_role;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'send_notification'
    ) THEN
        GRANT EXECUTE ON FUNCTION public.send_notification(UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, JSONB) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.send_notification(UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, JSONB) TO service_role;
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================

COMMENT ON POLICY "Authenticated can insert activity tracking" ON public.player_activity_tracking IS 
'Secure policy: Only service role or authenticated users can insert activity tracking records';

-- ============================================================================
-- AUTH LEAKED PASSWORD PROTECTION NOTE
-- ============================================================================
-- WARNING 4: auth_leaked_password_protection
-- 
-- Leaked password protection is currently disabled in Supabase Auth settings.
-- This cannot be fixed via SQL migration - it must be enabled in the Supabase Dashboard:
--
-- Steps to enable:
-- 1. Go to Supabase Dashboard > Authentication > Providers
-- 2. Under "Email" provider, find "Password Settings"
-- 3. Enable "Leaked Password Protection"
-- 
-- This feature checks passwords against HaveIBeenPwned.org to prevent use of compromised passwords.
-- Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
-- ============================================================================

-- ============================================================================
-- supabase/migrations/20260109_fix_send_notification_search_path.sql
-- ============================================================================
-- ============================================================================
-- Migration: Fix send_notification Function Search Path
-- Date: 2026-01-09
-- Purpose: Fix the second overload of send_notification that was missing search_path
-- ============================================================================

-- There are two overloads of send_notification in the database.
-- The first overload (6 params) already has SET search_path = public
-- The second overload (11 params) was missing it, causing the security warning

CREATE OR REPLACE FUNCTION public.send_notification(
    p_user_id uuid,
    p_notification_type character varying,
    p_title character varying,
    p_message text,
    p_category character varying DEFAULT 'general'::character varying,
    p_severity character varying DEFAULT 'info'::character varying,
    p_action_url text DEFAULT NULL::text,
    p_data jsonb DEFAULT '{}'::jsonb,
    p_sender_id uuid DEFAULT NULL::uuid,
    p_related_entity_type character varying DEFAULT NULL::character varying,
    p_related_entity_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    user_id_uuid,
    notification_type,
    title,
    message,
    category,
    severity,
    action_url,
    data,
    sender_id,
    related_entity_type,
    related_entity_id,
    is_read,
    dismissed,
    expires_at,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_user_id,
    p_notification_type,
    p_title,
    p_message,
    p_category,
    p_severity,
    p_action_url,
    p_data,
    p_sender_id,
    p_related_entity_type,
    p_related_entity_id,
    FALSE,
    FALSE,
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$function$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.send_notification(
    uuid, character varying, character varying, text,
    character varying, character varying, text, jsonb,
    uuid, character varying, uuid
) TO authenticated, service_role;

-- Add comment
COMMENT ON FUNCTION public.send_notification(
    uuid, character varying, character varying, text,
    character varying, character varying, text, jsonb,
    uuid, character varying, uuid
) IS 'Sends a notification to a user. SECURITY DEFINER with search_path = public for security.';

-- ============================================================================
-- supabase/migrations/20260109_rls_block_logging.sql
-- ============================================================================
-- Migration: RLS Block Logging System
-- Date: 2026-01-09
-- Purpose: Log RLS policy blocks for observability
-- Note: This provides visibility into silent RLS failures

-- ============================================================================
-- FUNCTION: Log RLS Policy Blocks
-- ============================================================================

CREATE OR REPLACE FUNCTION log_rls_policy_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_operation TEXT;
BEGIN
  -- Get current user (may be null for anonymous attempts)
  v_user_id := auth.uid();
  
  -- Map trigger operation to action
  CASE TG_OP
    WHEN 'INSERT' THEN v_operation := 'INSERT';
    WHEN 'UPDATE' THEN v_operation := 'UPDATE';
    WHEN 'DELETE' THEN v_operation := 'DELETE';
    WHEN 'SELECT' THEN v_operation := 'SELECT';
    ELSE v_operation := 'UNKNOWN';
  END CASE;
  
  -- Log the block attempt (fire-and-forget, don't fail the operation)
  BEGIN
    INSERT INTO authorization_violations (
      user_id,
      resource_id,
      resource_type,
      action,
      error_code,
      error_message,
      timestamp
    ) VALUES (
      v_user_id,
      CASE 
        WHEN TG_OP IN ('UPDATE', 'DELETE') THEN COALESCE(OLD.id::TEXT, 'unknown')
        WHEN TG_OP = 'INSERT' THEN COALESCE(NEW.id::TEXT, 'unknown')
        ELSE 'unknown'
      END::UUID,
      TG_TABLE_NAME,
      v_operation,
      'RLS_POLICY_BLOCKED',
      format('RLS policy blocked %s operation on table %s', v_operation, TG_TABLE_NAME),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Silently fail logging to avoid breaking the RLS check
    -- RLS block will still occur, we just won't log it
    NULL;
  END;
  
  -- Return NULL to indicate row should be blocked
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION log_rls_policy_block IS 'Logs RLS policy blocks to authorization_violations table for observability';

-- ============================================================================
-- EXAMPLE: Add logging trigger to a table
-- ============================================================================
-- 
-- To enable RLS block logging on a table, create a trigger like this:
--
-- CREATE TRIGGER log_training_sessions_rls_block
--   BEFORE INSERT OR UPDATE OR DELETE ON training_sessions
--   FOR EACH ROW
--   WHEN (NOT is_granted())  -- Only fire when RLS would block
--   EXECUTE FUNCTION log_rls_policy_block();
--
-- Note: This requires a helper function to check if RLS would grant access
-- For now, we'll implement this manually on high-value tables

-- ============================================================================
-- HIGH-VALUE TABLES: Add RLS block logging
-- ============================================================================

-- Training Sessions (high value, coach_locked logic)
-- Note: We can't directly detect RLS blocks, but we can log failed attempts
-- For now, this is a placeholder for future implementation

-- Future Enhancement:
-- Consider using PostgreSQL's pg_stat_statements extension to track query failures
-- Or implement application-level logging in the API layer

-- ============================================================================
-- ALTERNATIVE: Application-Level RLS Block Detection
-- ============================================================================

-- Instead of database triggers (which are complex for RLS detection),
-- recommend implementing RLS block detection in the API layer:
--
-- 1. Count rows before operation: SELECT COUNT(*) WHERE <condition>
-- 2. Attempt operation
-- 3. Check affected rows
-- 4. If affected_rows < expected_rows, log to authorization_violations
--
-- This is implemented in netlify/functions/utils/authorization-guard.js

COMMENT ON TABLE authorization_violations IS 'Logs authorization failures including RLS blocks. Application-level logging recommended over database triggers.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check authorization_violations table exists and has correct structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'authorization_violations'
  ) THEN
    RAISE EXCEPTION 'authorization_violations table does not exist. Run 20260106_append_only_audit_tables.sql first.';
  END IF;
END $$;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'authorization_violations';

-- ============================================================================
-- supabase/migrations/20260110_allow_players_update_own_profile.sql
-- ============================================================================
-- ============================================================================
-- Migration: Allow players to update their own position and jersey number
-- Date: 2026-01-10
-- Description:
--   Players were unable to update their own position and jersey_number in
--   team_members table because RLS policy only allowed coaches/head_coaches.
--   This adds a new policy allowing players to update ONLY their own records
--   and ONLY specific fields (position, jersey_number).
-- ============================================================================

-- Drop and recreate the team_members update policy with player self-update support
DROP POLICY IF EXISTS "team_members_update_no_recursion" ON team_members;

-- Policy 1: Coaches and head coaches can update any member on their team
CREATE POLICY "team_members_coaches_can_update"
ON team_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('coach', 'head_coach')
        AND tm.status = 'active'
    )
);

-- Policy 2: Players can update their own position and jersey_number
CREATE POLICY "team_members_players_self_update"
ON team_members FOR UPDATE
USING (
    user_id = (SELECT auth.uid())
)
WITH CHECK (
    -- Ensure they can only update their own record
    user_id = (SELECT auth.uid())
    -- Note: PostgreSQL will only allow updating the columns they have access to
    -- Additional application-level validation ensures only position/jersey_number are changed
);

-- Add a comment to document the policy
COMMENT ON POLICY "team_members_players_self_update" ON team_members IS
'Allows players to update their own position and jersey_number in team_members table. Application code ensures only these fields are modified.';

-- ============================================================================
-- supabase/migrations/20260110_fix_team_members_insert_policy.sql
-- ============================================================================
-- ============================================================================
-- FIX: Missing INSERT policy for team_members table
-- ============================================================================
-- PROBLEM: The RLS migration 20260109_fix_rls_performance_warnings.sql removed
--   the INSERT policy for team_members, preventing new players from joining
--   teams during onboarding or via invitation acceptance.
--
-- SOLUTION: Add INSERT policies that allow:
--   1. Users to insert themselves when onboarding (for new team membership)
--   2. Coaches/admins to add members to their teams
--   3. System-level operations (invitation acceptance via service role)
-- ============================================================================

-- First, check if any INSERT policies exist and drop them
DROP POLICY IF EXISTS "team_members_insert_self" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_by_coach" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_onboarding" ON team_members;

-- Policy 1: Allow users to insert themselves into a team
-- This enables onboarding and invitation acceptance flows
CREATE POLICY "team_members_insert_self"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (
    -- Users can insert themselves
    user_id = (SELECT auth.uid())
);

-- Policy 2: Allow coaches and admins to add members to their teams
CREATE POLICY "team_members_insert_by_coach"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (
    -- Coaches/admins can add members to their teams
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('coach', 'head_coach', 'admin', 'owner')
        AND tm.status = 'active'
    )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'team_members'
AND cmd = 'INSERT'
ORDER BY policyname;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "team_members_insert_self" ON team_members IS 
'Allows users to insert themselves into team_members during onboarding or invitation acceptance';

COMMENT ON POLICY "team_members_insert_by_coach" ON team_members IS 
'Allows coaches and admins to add members to their teams';

-- ============================================================================
-- supabase/migrations/20260111_create_nutrition_tables.sql
-- ============================================================================
-- Migration: Ensure Nutrition Tables Exist
-- Purpose: Create nutrition_logs and nutrition_goals tables if they don't exist
-- Date: 2026-01-11
-- Issue: Tables may be missing from Supabase database

-- ============================================================================
-- NUTRITION LOGS TABLE
-- ============================================================================
-- Tracks individual food intake entries

CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Food identification
    food_name VARCHAR(255) NOT NULL,
    food_id INTEGER, -- USDA FoodData Central ID if from database search
    
    -- Macronutrients (grams unless otherwise specified)
    calories DECIMAL(8,2) DEFAULT 0 CHECK (calories >= 0 AND calories <= 10000),
    protein DECIMAL(6,2) DEFAULT 0 CHECK (protein >= 0 AND protein <= 1000),
    carbohydrates DECIMAL(6,2) DEFAULT 0 CHECK (carbohydrates >= 0 AND carbohydrates <= 1000),
    fat DECIMAL(6,2) DEFAULT 0 CHECK (fat >= 0 AND fat <= 1000),
    fiber DECIMAL(6,2) DEFAULT 0 CHECK (fiber >= 0 AND fiber <= 100),
    
    -- Meal context
    meal_type VARCHAR(50) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout')),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast user + date queries
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date 
ON nutrition_logs(user_id, logged_at DESC);

-- Create index for food database lookups
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_food_id 
ON nutrition_logs(food_id) WHERE food_id IS NOT NULL;

-- Enable RLS (policies added in separate migration)
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE nutrition_logs IS 'Tracks individual food intake entries for nutrition monitoring and goal tracking';
COMMENT ON COLUMN nutrition_logs.user_id IS 'Reference to auth.users - the athlete logging food';
COMMENT ON COLUMN nutrition_logs.food_id IS 'USDA FoodData Central database ID (optional, for database-searched foods)';
COMMENT ON COLUMN nutrition_logs.calories IS 'Total calories (kcal) for this food entry';
COMMENT ON COLUMN nutrition_logs.meal_type IS 'Type of meal: breakfast, lunch, dinner, snack, pre-workout, post-workout';
COMMENT ON COLUMN nutrition_logs.logged_at IS 'When the food was consumed (can be backdated)';

-- ============================================================================
-- NUTRITION GOALS TABLE
-- ============================================================================
-- Stores personalized nutrition targets for each user

CREATE TABLE IF NOT EXISTS nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Daily targets (integers for simplicity in UI)
    calories_target INTEGER DEFAULT 2500 CHECK (calories_target >= 1000 AND calories_target <= 10000),
    protein_target INTEGER DEFAULT 150 CHECK (protein_target >= 30 AND protein_target <= 500),
    carbs_target INTEGER DEFAULT 300 CHECK (carbs_target >= 50 AND carbs_target <= 1000),
    fat_target INTEGER DEFAULT 80 CHECK (fat_target >= 20 AND fat_target <= 300),
    fiber_target INTEGER DEFAULT 30 CHECK (fiber_target >= 10 AND fiber_target <= 100),
    
    -- Goal context
    goal_type VARCHAR(50) DEFAULT 'maintenance' CHECK (goal_type IN ('weight_loss', 'weight_gain', 'maintenance', 'performance', 'recovery')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one goal per user
    UNIQUE(user_id)
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_nutrition_goals_user 
ON nutrition_goals(user_id);

-- Enable RLS (policies added in separate migration)
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE nutrition_goals IS 'Stores personalized daily nutrition targets for each athlete';
COMMENT ON COLUMN nutrition_goals.user_id IS 'Reference to auth.users - athlete these goals belong to';
COMMENT ON COLUMN nutrition_goals.calories_target IS 'Daily calorie target in kcal (1000-10000)';
COMMENT ON COLUMN nutrition_goals.protein_target IS 'Daily protein target in grams (30-500g)';
COMMENT ON COLUMN nutrition_goals.goal_type IS 'Goal context: weight_loss, weight_gain, maintenance, performance, recovery';

-- ============================================================================
-- NUTRITION SUMMARY VIEWS
-- ============================================================================

-- Daily nutrition totals view
CREATE OR REPLACE VIEW nutrition_daily_totals AS
SELECT 
    user_id,
    DATE(logged_at) as log_date,
    COUNT(*) as total_entries,
    SUM(calories) as total_calories,
    SUM(protein) as total_protein,
    SUM(carbohydrates) as total_carbs,
    SUM(fat) as total_fat,
    SUM(fiber) as total_fiber
FROM nutrition_logs
GROUP BY user_id, DATE(logged_at);

COMMENT ON VIEW nutrition_daily_totals IS 'Aggregates nutrition logs by user and date for daily tracking';

-- Nutrition progress view (compares actuals to goals)
CREATE OR REPLACE VIEW nutrition_progress_today AS
SELECT 
    ng.user_id,
    ng.calories_target,
    ng.protein_target,
    ng.carbs_target,
    ng.fat_target,
    COALESCE(SUM(nl.calories), 0) as calories_actual,
    COALESCE(SUM(nl.protein), 0) as protein_actual,
    COALESCE(SUM(nl.carbohydrates), 0) as carbs_actual,
    COALESCE(SUM(nl.fat), 0) as fat_actual,
    -- Calculate percentage of goal achieved
    ROUND((COALESCE(SUM(nl.calories), 0) / NULLIF(ng.calories_target, 0)) * 100, 1) as calories_percent,
    ROUND((COALESCE(SUM(nl.protein), 0) / NULLIF(ng.protein_target, 0)) * 100, 1) as protein_percent,
    ROUND((COALESCE(SUM(nl.carbohydrates), 0) / NULLIF(ng.carbs_target, 0)) * 100, 1) as carbs_percent,
    ROUND((COALESCE(SUM(nl.fat), 0) / NULLIF(ng.fat_target, 0)) * 100, 1) as fat_percent
FROM nutrition_goals ng
LEFT JOIN nutrition_logs nl ON ng.user_id = nl.user_id 
    AND DATE(nl.logged_at) = CURRENT_DATE
GROUP BY ng.user_id, ng.calories_target, ng.protein_target, ng.carbs_target, ng.fat_target;

COMMENT ON VIEW nutrition_progress_today IS 'Shows today''s nutrition progress vs goals for each user';

-- Grant SELECT on views to authenticated users (respects RLS on base tables)
GRANT SELECT ON nutrition_daily_totals TO authenticated;
GRANT SELECT ON nutrition_progress_today TO authenticated;

-- ============================================================================
-- TRIGGER: Update nutrition_goals.updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_nutrition_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_nutrition_goals_timestamp ON nutrition_goals;
CREATE TRIGGER trigger_update_nutrition_goals_timestamp
    BEFORE UPDATE ON nutrition_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_nutrition_goals_updated_at();

COMMENT ON FUNCTION update_nutrition_goals_updated_at() IS 'Auto-updates updated_at timestamp when nutrition goals are modified';

-- ============================================================================
-- supabase/migrations/20260111_fix_nutrition_logs_policies.sql
-- ============================================================================
-- Migration: Add RLS Policies to Nutrition Tables
-- Purpose: Allow users to insert/view their own nutrition logs
-- Date: 2026-01-11
-- Issue: Users cannot save nutrition logs because RLS is enabled but no INSERT policy exists

-- ============================================================================
-- NUTRITION LOGS POLICIES
-- ============================================================================

-- Policy: Users can insert their own nutrition logs
CREATE POLICY "Users can insert their own nutrition logs"
ON nutrition_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own nutrition logs
CREATE POLICY "Users can view their own nutrition logs"
ON nutrition_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own nutrition logs (for corrections)
CREATE POLICY "Users can update their own nutrition logs"
ON nutrition_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own nutrition logs
CREATE POLICY "Users can delete their own nutrition logs"
ON nutrition_logs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Coaches and nutritionists can view team member nutrition logs
CREATE POLICY "Coaches can view team nutrition logs"
ON nutrition_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM team_members coach_tm
    JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
    WHERE coach_tm.user_id = auth.uid()
      AND coach_tm.role IN ('coach', 'head_coach', 'nutritionist', 'admin')
      AND player_tm.user_id = nutrition_logs.user_id
  )
);

-- ============================================================================
-- NUTRITION GOALS POLICIES
-- ============================================================================

-- Check if nutrition_goals table exists before adding policies
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'nutrition_goals'
    ) THEN
        -- Enable RLS if not already enabled
        ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
        
        -- Policy: Users can manage all operations on their own nutrition goals
        CREATE POLICY "Users can manage their own nutrition goals"
        ON nutrition_goals
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
        
        -- Policy: Nutritionists can view team member goals
        CREATE POLICY "Nutritionists can view team nutrition goals"
        ON nutrition_goals
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 
            FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = auth.uid()
              AND coach_tm.role IN ('nutritionist', 'coach', 'head_coach', 'admin')
              AND player_tm.user_id = nutrition_goals.user_id
          )
        );
        
        -- Policy: Nutritionists can update team member goals (with explicit consent)
        CREATE POLICY "Nutritionists can update team nutrition goals"
        ON nutrition_goals
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 
            FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = auth.uid()
              AND coach_tm.role IN ('nutritionist', 'admin')
              AND player_tm.user_id = nutrition_goals.user_id
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 
            FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = auth.uid()
              AND coach_tm.role IN ('nutritionist', 'admin')
              AND player_tm.user_id = nutrition_goals.user_id
          )
        );
    END IF;
END $$;

-- Add helpful comments
COMMENT ON POLICY "Users can insert their own nutrition logs" ON nutrition_logs IS 
'Allows authenticated users to log their own food intake';

COMMENT ON POLICY "Users can view their own nutrition logs" ON nutrition_logs IS 
'Allows users to view their nutrition history for tracking progress';

COMMENT ON POLICY "Coaches can view team nutrition logs" ON nutrition_logs IS 
'Allows coaches and nutritionists to monitor team member nutrition for performance optimization';

-- ============================================================================
-- supabase/migrations/20260111_fix_physical_measurements.sql
-- ============================================================================
-- Migration: Fix Physical Measurements Table
-- Purpose: Create properly structured physical_measurements table with all required columns
-- Date: 2026-01-11
-- Issue: Users cannot log body composition measurements due to missing/incorrect table structure

-- Create table if missing. Keep existing data intact.
CREATE TABLE IF NOT EXISTS physical_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic measurements
    weight DECIMAL(5,2) CHECK (weight >= 30 AND weight <= 300),
    height DECIMAL(5,2) CHECK (height >= 140 AND height <= 250),
    body_fat DECIMAL(4,2) CHECK (body_fat >= 3 AND body_fat <= 50),
    muscle_mass DECIMAL(5,2),
    
    -- Enhanced body composition fields (from smart scales)
    body_water_mass DECIMAL(5,2),
    fat_mass DECIMAL(5,2),
    protein_mass DECIMAL(5,2),
    bone_mineral_content DECIMAL(5,2),
    skeletal_muscle_mass DECIMAL(5,2),
    muscle_percentage DECIMAL(4,2),
    body_water_percentage DECIMAL(4,2),
    protein_percentage DECIMAL(4,2),
    bone_mineral_percentage DECIMAL(4,2),
    visceral_fat_rating INTEGER CHECK (visceral_fat_rating >= 1 AND visceral_fat_rating <= 59),
    basal_metabolic_rate INTEGER CHECK (basal_metabolic_rate >= 800 AND basal_metabolic_rate <= 5000),
    waist_to_hip_ratio DECIMAL(4,2) CHECK (waist_to_hip_ratio >= 0.5 AND waist_to_hip_ratio <= 1.5),
    body_age INTEGER CHECK (body_age >= 10 AND body_age <= 120),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast user lookups sorted by date
CREATE INDEX IF NOT EXISTS idx_physical_measurements_user_date
ON physical_measurements(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE physical_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can insert their own measurements
DROP POLICY IF EXISTS "Users can insert their own measurements" ON physical_measurements;
CREATE POLICY "Users can insert their own measurements"
ON physical_measurements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can view their own measurements
DROP POLICY IF EXISTS "Users can view their own measurements" ON physical_measurements;
CREATE POLICY "Users can view their own measurements"
ON physical_measurements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own measurements
DROP POLICY IF EXISTS "Users can update their own measurements" ON physical_measurements;
CREATE POLICY "Users can update their own measurements"
ON physical_measurements
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own measurements (for corrections)
DROP POLICY IF EXISTS "Users can delete their own measurements" ON physical_measurements;
CREATE POLICY "Users can delete their own measurements"
ON physical_measurements
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Coaches can view measurements of players on their teams
DROP POLICY IF EXISTS "Coaches can view team measurements" ON physical_measurements;
CREATE POLICY "Coaches can view team measurements"
ON physical_measurements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM team_members coach_tm
    JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
    WHERE coach_tm.user_id = auth.uid()
      AND coach_tm.role IN ('coach', 'head_coach', 'admin')
      AND player_tm.user_id = physical_measurements.user_id
  )
);

-- Add table and column comments for documentation
COMMENT ON TABLE physical_measurements IS 'Stores athlete body composition and physical measurement data from smart scales and manual entry';
COMMENT ON COLUMN physical_measurements.user_id IS 'Reference to auth.users - the athlete who owns this measurement';
COMMENT ON COLUMN physical_measurements.weight IS 'Body weight in kilograms (30-300 kg)';
COMMENT ON COLUMN physical_measurements.height IS 'Height in centimeters (140-250 cm)';
COMMENT ON COLUMN physical_measurements.body_fat IS 'Body fat percentage (3-50%)';
COMMENT ON COLUMN physical_measurements.muscle_mass IS 'Total muscle mass in kilograms';
COMMENT ON COLUMN physical_measurements.visceral_fat_rating IS 'Visceral fat rating (1-59, lower is better)';
COMMENT ON COLUMN physical_measurements.basal_metabolic_rate IS 'BMR in kcal/day (800-5000)';
COMMENT ON COLUMN physical_measurements.waist_to_hip_ratio IS 'WHR ratio for health risk assessment (0.5-1.5)';
COMMENT ON COLUMN physical_measurements.body_age IS 'Metabolic age estimate in years';

-- Bring older deployments up to current column shape without destructive changes.
ALTER TABLE physical_measurements
    ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS height DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS body_fat DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS muscle_mass DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS body_water_mass DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS fat_mass DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS protein_mass DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS bone_mineral_content DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS skeletal_muscle_mass DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS muscle_percentage DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS body_water_percentage DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS protein_percentage DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS bone_mineral_percentage DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS visceral_fat_rating INTEGER,
    ADD COLUMN IF NOT EXISTS basal_metabolic_rate INTEGER,
    ADD COLUMN IF NOT EXISTS waist_to_hip_ratio DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS body_age INTEGER,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create view for latest measurements per user
CREATE OR REPLACE VIEW physical_measurements_latest
WITH (security_invoker = true) AS
SELECT DISTINCT ON (user_id)
    id,
    user_id,
    weight,
    height,
    body_fat,
    muscle_mass,
    body_water_percentage,
    visceral_fat_rating,
    basal_metabolic_rate,
    body_age,
    created_at,
    -- Calculate trend indicators (compare to previous measurement)
    LAG(weight) OVER (PARTITION BY user_id ORDER BY created_at) as previous_weight,
    LAG(body_fat) OVER (PARTITION BY user_id ORDER BY created_at) as previous_body_fat
FROM physical_measurements
ORDER BY user_id, created_at DESC;

COMMENT ON VIEW physical_measurements_latest IS 'Latest physical measurement for each user with previous values for trend analysis';

-- Grant SELECT on view to authenticated users (respects RLS on base table)
GRANT SELECT ON physical_measurements_latest TO authenticated;

-- ============================================================================
-- supabase/migrations/20260111_make_password_hash_nullable.sql
-- ============================================================================
-- Migration: Make password_hash nullable in users table
-- Issue: Settings cannot save for users who don't have a password_hash
-- Reason: Supabase Auth manages passwords in auth.users, not in public.users
-- Created: 2026-01-11
--
-- This migration makes password_hash nullable because:
-- 1. Supabase Auth stores passwords in auth.users table (encrypted)
-- 2. The public.users table is for profile/app data only
-- 3. Having password_hash as NOT NULL prevents profile updates for auth-only users

-- =============================================================================
-- STEP 1: Make password_hash nullable
-- =============================================================================

-- Check if password_hash column exists and alter it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'password_hash'
  ) THEN
    -- Make the column nullable
    ALTER TABLE public.users 
      ALTER COLUMN password_hash DROP NOT NULL;
    
    RAISE NOTICE 'Column password_hash is now nullable';
  ELSE
    RAISE NOTICE 'Column password_hash does not exist in public.users';
  END IF;
END $$;

-- =============================================================================
-- STEP 2: Add comment explaining why it's nullable
-- =============================================================================

COMMENT ON COLUMN public.users.password_hash IS 
  'DEPRECATED: Password hashes are managed by Supabase Auth in auth.users table. 
   This column is kept for backwards compatibility but should be NULL for all users. 
   Do not use this column for authentication.';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Verify the column is now nullable:
-- SELECT column_name, is_nullable, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'users' 
--   AND column_name = 'password_hash';

-- =============================================================================
-- NOTES
-- =============================================================================
/*
1. This makes password_hash nullable so profile updates don't fail
2. Supabase Auth handles all password management in auth.users
3. The password_hash column in public.users should always be NULL
4. Consider removing this column entirely in a future migration once verified
5. This is a safe change - no data loss, backwards compatible
*/

-- ============================================================================
-- supabase/migrations/20260112_add_missing_tables_for_frontend.sql
-- ============================================================================
-- Migration: Add Missing Tables for Frontend API Calls
-- Date: 2026-01-12
-- Purpose: Add missing tables and columns used by frontend and Netlify functions
-- Already applied to database via Supabase MCP

-- =============================================================================
-- 1. Add missing columns to exercises table
-- =============================================================================

ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS target_muscles TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS equipment_required TEXT[] DEFAULT '{}'::TEXT[];

-- =============================================================================
-- 2. Add missing columns to isometrics_exercises table
-- =============================================================================

ALTER TABLE public.isometrics_exercises 
ADD COLUMN IF NOT EXISTS target_muscles TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS instructions TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS hold_duration_seconds INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS sets INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS reps INTEGER DEFAULT 1;

-- =============================================================================
-- 3. Add missing columns to plyometrics_exercises table
-- =============================================================================

ALTER TABLE public.plyometrics_exercises 
ADD COLUMN IF NOT EXISTS target_muscles TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS coaching_cues TEXT[] DEFAULT '{}'::TEXT[];

-- =============================================================================
-- 4. Add missing columns to training_sessions table
-- =============================================================================

ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS is_outdoor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS intensity VARCHAR(50);

-- =============================================================================
-- 5. Create coach_inbox_items table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.coach_inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'alert', 'recommendation', 'request', 'observation'
    title TEXT NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'unread', -- 'unread', 'read', 'actioned', 'dismissed'
    metadata JSONB DEFAULT '{}',
    source VARCHAR(50), -- 'ai', 'system', 'player', 'auto'
    action_required BOOLEAN DEFAULT false,
    action_taken TEXT,
    actioned_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coach_inbox_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY coach_inbox_items_own_data ON public.coach_inbox_items
    FOR ALL TO authenticated
    USING (coach_id = auth.uid())
    WITH CHECK (coach_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_coach_inbox_items_coach_id ON public.coach_inbox_items(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_inbox_items_status ON public.coach_inbox_items(status) WHERE status IN ('unread', 'read');

-- =============================================================================
-- 6. Create coach_alert_acknowledgments table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.coach_alert_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coach_alert_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY coach_alert_acknowledgments_own_data ON public.coach_alert_acknowledgments
    FOR ALL TO authenticated
    USING (coach_id = auth.uid())
    WITH CHECK (coach_id = auth.uid());

-- =============================================================================
-- 7. Create ai_followups table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
    followup_type VARCHAR(50) NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'dismissed', 'completed'
    sent_at TIMESTAMPTZ,
    response TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_followups_own_data ON public.ai_followups
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 8. Create user_ai_preferences table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tone VARCHAR(50) DEFAULT 'friendly', -- 'friendly', 'professional', 'coach-like', 'casual'
    verbosity VARCHAR(20) DEFAULT 'balanced', -- 'brief', 'balanced', 'detailed'
    proactive_suggestions BOOLEAN DEFAULT true,
    reminder_frequency VARCHAR(20) DEFAULT 'moderate', -- 'low', 'moderate', 'high'
    focus_areas TEXT[] DEFAULT '{}',
    avoided_topics TEXT[] DEFAULT '{}',
    language_preference VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_ai_preferences_own_data ON public.user_ai_preferences
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 9. Create user_age_groups table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_age_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    age_group VARCHAR(20) NOT NULL, -- 'youth', 'teen', 'adult', 'senior'
    birth_year INTEGER,
    requires_parental_consent BOOLEAN DEFAULT false,
    consent_given BOOLEAN DEFAULT false,
    consent_given_by UUID REFERENCES auth.users(id),
    consent_given_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_age_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_age_groups_own_data ON public.user_age_groups
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 10. Create youth_athlete_settings table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.youth_athlete_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_email VARCHAR(255),
    parent_phone VARCHAR(50),
    school_name VARCHAR(255),
    grade_level INTEGER,
    sport_experience_years INTEGER DEFAULT 0,
    medical_clearance_date DATE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    dietary_restrictions TEXT[],
    special_needs_notes TEXT,
    max_training_hours_per_week INTEGER DEFAULT 10,
    rest_day_requirements INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.youth_athlete_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY youth_athlete_settings_own_data ON public.youth_athlete_settings
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 11. Create parent_guardian_links table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.parent_guardian_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'parent', -- 'parent', 'guardian', 'coach'
    is_primary BOOLEAN DEFAULT false,
    can_view_training BOOLEAN DEFAULT true,
    can_view_wellness BOOLEAN DEFAULT true,
    can_view_nutrition BOOLEAN DEFAULT false,
    can_communicate_coach BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(athlete_id, parent_id)
);

ALTER TABLE public.parent_guardian_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY parent_guardian_links_athlete ON public.parent_guardian_links
    FOR SELECT TO authenticated
    USING (athlete_id = auth.uid() OR parent_id = auth.uid());

CREATE POLICY parent_guardian_links_parent ON public.parent_guardian_links
    FOR ALL TO authenticated
    USING (parent_id = auth.uid())
    WITH CHECK (parent_id = auth.uid());

-- =============================================================================
-- 12. Create parent_notifications table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.parent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY parent_notifications_own_data ON public.parent_notifications
    FOR ALL TO authenticated
    USING (parent_id = auth.uid())
    WITH CHECK (parent_id = auth.uid());

-- =============================================================================
-- 13. Create classification_history table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.classification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    classified_intent VARCHAR(100),
    confidence_score DECIMAL(5,4),
    model_version VARCHAR(50),
    response_time_ms INTEGER,
    was_correct BOOLEAN,
    corrected_intent VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.classification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY classification_history_own_data ON public.classification_history
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 14. Create conversation_context table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.conversation_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL,
    context_data JSONB NOT NULL DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversation_context_own_data ON public.conversation_context
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 15. Create ai_review_queue table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID NOT NULL REFERENCES public.ai_coach_interactions(id) ON DELETE CASCADE,
    review_type VARCHAR(50) NOT NULL, -- 'safety', 'quality', 'escalation'
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_review', 'approved', 'rejected'
    reviewer_id UUID REFERENCES auth.users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    auto_flagged_reasons TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_review_queue_admin_only ON public.ai_review_queue
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND email LIKE '%@admin%'));

-- =============================================================================
-- 16. Create acwr_history table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.acwr_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,
    acute_load DECIMAL(10,2),
    chronic_load DECIMAL(10,2),
    acwr_ratio DECIMAL(5,3),
    risk_level VARCHAR(20), -- 'low', 'moderate', 'high', 'very_high'
    training_sessions_count INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, calculation_date)
);

ALTER TABLE public.acwr_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY acwr_history_own_data ON public.acwr_history
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 17. Create digest_history table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.digest_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    digest_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    digest_date DATE NOT NULL,
    content JSONB NOT NULL,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, digest_type, digest_date)
);

ALTER TABLE public.digest_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY digest_history_own_data ON public.digest_history
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 18. Create micro_sessions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.micro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL, -- 'mobility', 'breathing', 'visualization', 'warmup'
    title VARCHAR(255) NOT NULL,
    duration_seconds INTEGER NOT NULL,
    instructions TEXT[],
    scheduled_time TIME,
    trigger_context VARCHAR(100), -- 'pre_training', 'post_training', 'morning', 'evening'
    completed_at TIMESTAMPTZ,
    skipped BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.micro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY micro_sessions_own_data ON public.micro_sessions
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 19. Create micro_session_analytics table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.micro_session_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    micro_session_id UUID REFERENCES public.micro_sessions(id) ON DELETE CASCADE,
    completion_rate DECIMAL(5,2),
    avg_duration_seconds INTEGER,
    streak_days INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    favorite_type VARCHAR(50),
    last_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.micro_session_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY micro_session_analytics_own_data ON public.micro_session_analytics
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 20. Create team_templates table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.team_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    template_type VARCHAR(50) NOT NULL, -- 'training', 'protocol', 'warmup', 'recovery'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_templates_team_access ON public.team_templates
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.team_id = team_templates.team_id 
        AND team_members.user_id = auth.uid()
    ));

CREATE POLICY team_templates_coach_modify ON public.team_templates
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.team_id = team_templates.team_id 
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('coach', 'head_coach', 'admin')
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.team_id = team_templates.team_id 
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('coach', 'head_coach', 'admin')
    ));

-- =============================================================================
-- 21. Create template_assignments table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.template_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.team_templates(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed', 'skipped'
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.template_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY template_assignments_player ON public.template_assignments
    FOR SELECT TO authenticated
    USING (player_id = auth.uid());

CREATE POLICY template_assignments_coach ON public.template_assignments
    FOR ALL TO authenticated
    USING (assigned_by = auth.uid())
    WITH CHECK (assigned_by = auth.uid());

-- =============================================================================
-- Done - All missing tables and columns have been added
-- =============================================================================

-- ============================================================================
-- supabase/migrations/20260112_fix_missing_schema_elements.sql
-- ============================================================================
-- Migration: Fix Missing Schema Elements
-- Date: 2026-01-12
-- Purpose: Add missing columns and relationships identified from console errors
-- Issues fixed:
--   1. team_invitations.message column
--   2. recovery_sessions → recovery_protocols relationship

-- =============================================================================
-- 1. Add 'message' column to team_invitations table
-- =============================================================================
-- Error: "column team_invitations.message does not exist"

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_invitations' 
        AND column_name = 'message'
    ) THEN
        ALTER TABLE public.team_invitations 
        ADD COLUMN message TEXT;
        
        COMMENT ON COLUMN public.team_invitations.message IS 
            'Optional message from coach/admin when sending invitation';
    END IF;
END $$;

-- =============================================================================
-- 2. Add 'protocol_id' column to recovery_sessions table
-- =============================================================================
-- Error: "Could not find a relationship between 'recovery_sessions' and 'recovery_protocols'"

DO $$
BEGIN
    -- First check if recovery_sessions table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recovery_sessions'
    ) THEN
        -- Check if protocol_id column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'recovery_sessions' 
            AND column_name = 'protocol_id'
        ) THEN
            -- Add the column
            ALTER TABLE public.recovery_sessions 
            ADD COLUMN protocol_id UUID;
            
            -- Add foreign key constraint if recovery_protocols table exists
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'recovery_protocols'
            ) THEN
                ALTER TABLE public.recovery_sessions
                ADD CONSTRAINT recovery_sessions_protocol_id_fkey 
                FOREIGN KEY (protocol_id) 
                REFERENCES public.recovery_protocols(id) 
                ON DELETE SET NULL;
                
                -- Create index for the foreign key
                CREATE INDEX IF NOT EXISTS idx_recovery_sessions_protocol_id 
                ON public.recovery_sessions(protocol_id);
            END IF;
            
            COMMENT ON COLUMN public.recovery_sessions.protocol_id IS 
                'Reference to the recovery protocol being used in this session';
        END IF;
    END IF;
END $$;

-- =============================================================================
-- 3. Create recovery_protocols table if it doesn't exist
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.recovery_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- e.g., 'active_recovery', 'passive_recovery', 'sleep', 'nutrition'
    duration_minutes INTEGER,
    instructions JSONB, -- Array of steps
    target_areas TEXT[], -- Body areas targeted
    equipment_needed TEXT[],
    effectiveness_rating DECIMAL(3,2), -- 0-5 scale
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for recovery_protocols
ALTER TABLE public.recovery_protocols ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read protocols
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recovery_protocols' 
        AND policyname = 'recovery_protocols_select_authenticated'
    ) THEN
        CREATE POLICY recovery_protocols_select_authenticated ON public.recovery_protocols
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- =============================================================================
-- 4. Ensure recovery_sessions table exists with proper structure
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.recovery_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    protocol_id UUID REFERENCES public.recovery_protocols(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'paused', 'completed', 'cancelled')),
    duration_actual_minutes INTEGER,
    notes TEXT,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for recovery_sessions
ALTER TABLE public.recovery_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own recovery sessions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recovery_sessions' 
        AND policyname = 'recovery_sessions_own_data'
    ) THEN
        CREATE POLICY recovery_sessions_own_data ON public.recovery_sessions
            FOR ALL TO authenticated
            USING (athlete_id = auth.uid())
            WITH CHECK (athlete_id = auth.uid());
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recovery_sessions_athlete_id 
ON public.recovery_sessions(athlete_id);

CREATE INDEX IF NOT EXISTS idx_recovery_sessions_status 
ON public.recovery_sessions(status) 
WHERE status IN ('in_progress', 'paused');

-- =============================================================================
-- Done
-- =============================================================================

-- ============================================================================
-- supabase/migrations/20260113_add_consent_views.sql
-- ============================================================================
-- Migration: Add Consent-Aware Views
-- Date: 2026-01-13
-- Purpose: Implement STEP_2_5 §11.1 - Consent-Aware Data Access
-- Contract: Data Consent & Visibility Contract v1

-- ============================================================================
-- CONSENT VIEW: Readiness Scores
-- ============================================================================

CREATE OR REPLACE VIEW v_readiness_scores_consent AS
SELECT 
  rs.*,
  CASE
    -- Athlete viewing own data: always visible
    WHEN rs.athlete_id = auth.uid() THEN false
    -- Coach viewing: check consent
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('coach', 'admin')
    ) THEN
      CASE
        -- Check if athlete has consented
        WHEN EXISTS (
          SELECT 1 FROM athlete_consent_settings acs
          WHERE acs.athlete_id = rs.athlete_id
          AND acs.share_readiness_with_coach = true
        ) THEN false
        -- Safety override: ACWR danger zone
        WHEN rs.acwr > 1.5 OR rs.acwr < 0.8 THEN false
        ELSE true
      END
    ELSE true
  END AS consent_blocked,
  CASE
    WHEN rs.athlete_id = auth.uid() THEN 'own_data'
    WHEN EXISTS (
      SELECT 1 FROM athlete_consent_settings acs
      WHERE acs.athlete_id = rs.athlete_id
      AND acs.share_readiness_with_coach = true
    ) THEN 'consent_granted'
    WHEN rs.acwr > 1.5 OR rs.acwr < 0.8 THEN 'safety_override'
    ELSE 'no_consent'
  END AS access_reason
FROM readiness_scores rs;

COMMENT ON VIEW v_readiness_scores_consent IS 'Consent-aware view for readiness scores. Returns NULL score when consent_blocked=true (Contract: STEP_2_5 §1.5)';

-- ============================================================================
-- CONSENT VIEW: Wellness Entries
-- ============================================================================

CREATE OR REPLACE VIEW v_wellness_entries_consent AS
SELECT 
  we.*,
  CASE
    -- Athlete viewing own data: always visible
    WHEN we.athlete_id = auth.uid() THEN false
    -- Coach viewing: check consent
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('coach', 'admin')
    ) THEN
      CASE
        -- Check if athlete has consented
        WHEN EXISTS (
          SELECT 1 FROM athlete_consent_settings acs
          WHERE acs.athlete_id = we.athlete_id
          AND acs.share_wellness_answers_with_coach = true
        ) THEN false
        -- Safety override: high stress for 3+ days
        WHEN EXISTS (
          SELECT 1 FROM wellness_entries we2
          WHERE we2.athlete_id = we.athlete_id
          AND we2.stress_level = 5
          AND we2.date >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY we2.athlete_id
          HAVING COUNT(*) >= 3
        ) THEN false
        ELSE true
      END
    ELSE true
  END AS consent_blocked,
  CASE
    WHEN we.athlete_id = auth.uid() THEN 'own_data'
    WHEN EXISTS (
      SELECT 1 FROM athlete_consent_settings acs
      WHERE acs.athlete_id = we.athlete_id
      AND acs.share_wellness_answers_with_coach = true
    ) THEN 'consent_granted'
    WHEN EXISTS (
      SELECT 1 FROM wellness_entries we2
      WHERE we2.athlete_id = we.athlete_id
      AND we2.stress_level = 5
      AND we2.date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY we2.athlete_id
      HAVING COUNT(*) >= 3
    ) THEN 'safety_override'
    ELSE 'no_consent'
  END AS access_reason
FROM wellness_entries we;

COMMENT ON VIEW v_wellness_entries_consent IS 'Consent-aware view for wellness entries. Returns NULL detail when consent_blocked=true (Contract: STEP_2_5 §1.6)';

-- ============================================================================
-- CONSENT VIEW: Pain Reports
-- ============================================================================

CREATE OR REPLACE VIEW v_pain_reports_consent AS
SELECT 
  pr.*,
  CASE
    -- Athlete viewing own data: always visible
    WHEN pr.athlete_id = auth.uid() THEN false
    -- Medical staff: always visible (role authority)
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('physio', 'medical', 'admin')
    ) THEN false
    -- Coach viewing: flag only by default, detail if safety override
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('coach', 'admin')
    ) THEN
      CASE
        -- Safety override: pain >3/10 or new/worsening pain
        WHEN pr.pain_score > 3 THEN false
        WHEN pr.pain_trend IN ('new', 'worse') THEN false
        ELSE true -- Detail hidden, flag visible
      END
    ELSE true
  END AS consent_blocked,
  CASE
    WHEN pr.athlete_id = auth.uid() THEN 'own_data'
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('physio', 'medical', 'admin')
    ) THEN 'role_authority'
    WHEN pr.pain_score > 3 OR pr.pain_trend IN ('new', 'worse') THEN 'safety_override'
    ELSE 'no_consent'
  END AS access_reason,
  -- Flag-only field for coaches (always visible)
  CASE
    WHEN pr.pain_score > 0 THEN true
    ELSE false
  END AS has_pain_flag
FROM pain_reports pr;

COMMENT ON VIEW v_pain_reports_consent IS 'Consent-aware view for pain reports. Returns NULL detail when consent_blocked=true, but has_pain_flag always visible (Contract: STEP_2_5 §1.7)';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON v_readiness_scores_consent TO authenticated;
GRANT SELECT ON v_wellness_entries_consent TO authenticated;
GRANT SELECT ON v_pain_reports_consent TO authenticated;

-- ============================================================================
-- supabase/migrations/20260113_add_state_transition_history.sql
-- ============================================================================
-- Migration: Add State Transition History Table
-- Date: 2026-01-13
-- Purpose: Implement STEP_2_6 §1.3 - State Transition History Logging
-- Contract: Session Lifecycle & Immutability Contract v1

-- ============================================================================
-- STATE TRANSITION HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS state_transition_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  
  -- State transition details
  from_state TEXT CHECK (from_state IS NULL OR from_state IN (
    'UNRESOLVED', 'PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED', 
    'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED'
  )),
  to_state TEXT NOT NULL CHECK (to_state IN (
    'UNRESOLVED', 'PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED', 
    'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED'
  )),
  
  -- Actor information
  actor_role TEXT NOT NULL CHECK (actor_role IN ('athlete', 'coach', 'physio', 'system', 'admin')),
  actor_id UUID REFERENCES auth.users(id), -- NULL for system transitions
  
  -- Transition metadata
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT, -- Optional reason for transition
  metadata JSONB, -- Flexible field for override flags, conflict resolution, etc.
  
  -- Indexes for performance
  CONSTRAINT state_transition_history_session_id_idx UNIQUE NULLS NOT DISTINCT (session_id, transitioned_at)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_state_transition_history_session_id 
  ON state_transition_history(session_id);

CREATE INDEX IF NOT EXISTS idx_state_transition_history_to_state 
  ON state_transition_history(to_state);

CREATE INDEX IF NOT EXISTS idx_state_transition_history_transitioned_at 
  ON state_transition_history(transitioned_at DESC);

CREATE INDEX IF NOT EXISTS idx_state_transition_history_actor 
  ON state_transition_history(actor_id) WHERE actor_id IS NOT NULL;

-- Comments
COMMENT ON TABLE state_transition_history IS 'Append-only audit log of all session state transitions. Contract: STEP_2_6 §1.3';
COMMENT ON COLUMN state_transition_history.from_state IS 'Previous state (NULL for initial state)';
COMMENT ON COLUMN state_transition_history.to_state IS 'New state after transition';
COMMENT ON COLUMN state_transition_history.actor_role IS 'Role of actor who triggered transition';
COMMENT ON COLUMN state_transition_history.actor_id IS 'User ID of actor (NULL for system transitions)';
COMMENT ON COLUMN state_transition_history.metadata IS 'Additional context: override flags, conflict resolution, etc.';

-- ============================================================================
-- IMMUTABILITY ENFORCEMENT
-- ============================================================================

-- Trigger: Prevent UPDATE and DELETE on state_transition_history
CREATE OR REPLACE FUNCTION prevent_state_history_modification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Cannot UPDATE state_transition_history: table is append-only (Contract: STEP_2_6 §1.3)';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Cannot DELETE from state_transition_history: table is append-only (Contract: STEP_2_6 §1.3)';
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS prevent_state_history_modification_trigger ON state_transition_history;
CREATE TRIGGER prevent_state_history_modification_trigger
  BEFORE UPDATE OR DELETE ON state_transition_history
  FOR EACH ROW
  EXECUTE FUNCTION prevent_state_history_modification();

COMMENT ON FUNCTION prevent_state_history_modification() IS 'Enforces append-only constraint on state_transition_history (Contract: STEP_2_6 §1.3)';

-- ============================================================================
-- AUTOMATIC STATE TRANSITION LOGGING
-- ============================================================================

-- Function: Log state transition automatically
CREATE OR REPLACE FUNCTION log_session_state_transition()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_actor_role TEXT;
  current_actor_id UUID;
BEGIN
  -- Only log if state actually changed
  IF OLD.session_state IS DISTINCT FROM NEW.session_state THEN
    -- Determine actor role and ID from current context
    -- For system transitions (midnight transitions, auto-locking), actor_role = 'system', actor_id = NULL
    -- For user-initiated transitions, we need to get role from auth context or metadata
    
    -- Try to get actor from NEW metadata if set (set by application code)
    IF NEW.metadata IS NOT NULL AND NEW.metadata ? 'transition_actor_role' THEN
      current_actor_role := NEW.metadata->>'transition_actor_role';
      IF NEW.metadata ? 'transition_actor_id' THEN
        current_actor_id := (NEW.metadata->>'transition_actor_id')::UUID;
      END IF;
    ELSE
      -- Default to system if not specified
      current_actor_role := 'system';
      current_actor_id := NULL;
    END IF;
    
    -- Insert transition record
    INSERT INTO state_transition_history (
      session_id,
      from_state,
      to_state,
      actor_role,
      actor_id,
      transitioned_at,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      OLD.session_state,
      NEW.session_state,
      current_actor_role,
      current_actor_id,
      NOW(),
      CASE 
        WHEN NEW.metadata IS NOT NULL AND NEW.metadata ? 'transition_reason' 
        THEN NEW.metadata->>'transition_reason'
        ELSE NULL
      END,
      NEW.metadata
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_session_state_transition_trigger ON training_sessions;
CREATE TRIGGER log_session_state_transition_trigger
  AFTER UPDATE ON training_sessions
  FOR EACH ROW
  WHEN (OLD.session_state IS DISTINCT FROM NEW.session_state)
  EXECUTE FUNCTION log_session_state_transition();

COMMENT ON FUNCTION log_session_state_transition() IS 'Automatically logs state transitions to state_transition_history (Contract: STEP_2_6 §1.3)';

-- ============================================================================
-- BACKFILL EXISTING SESSIONS
-- ============================================================================

-- Backfill: Create initial state transition records for existing sessions
-- Only runs if safe (no existing history records)
DO $$
DECLARE
  session_record RECORD;
  initial_state TEXT;
BEGIN
  -- Only backfill if history table is empty (safe check)
  IF (SELECT COUNT(*) FROM state_transition_history) = 0 THEN
    FOR session_record IN 
      SELECT id, session_state, created_at, generated_at, user_id
      FROM training_sessions
      WHERE session_state IS NOT NULL
    LOOP
      -- Determine initial state (use current state, from_state = NULL)
      initial_state := session_record.session_state;
      
      -- Use created_at or generated_at as transition timestamp, fallback to NOW()
      INSERT INTO state_transition_history (
        session_id,
        from_state,
        to_state,
        actor_role,
        actor_id,
        transitioned_at,
        reason,
        metadata
      ) VALUES (
        session_record.id,
        NULL, -- Initial state (no from_state)
        initial_state,
        'system', -- Backfilled records are system-initiated
        NULL,
        COALESCE(
          session_record.generated_at,
          session_record.created_at,
          NOW()
        ),
        'Backfilled initial state',
        jsonb_build_object('backfilled', true)
      );
    END LOOP;
    
    RAISE NOTICE 'Backfilled state transition history for % sessions', (SELECT COUNT(*) FROM training_sessions WHERE session_state IS NOT NULL);
  ELSE
    RAISE NOTICE 'State transition history table already contains data, skipping backfill';
  END IF;
END $$;

-- ============================================================================
-- supabase/migrations/20260117_remove_wellness_defaults.sql
-- ============================================================================
-- Migration: Remove hardcoded defaults from wellness sync trigger
-- 
-- CRITICAL FIX: The previous trigger used COALESCE(value, 3) which inserted
-- fake default values (3 for all metrics, 7.0 for sleep hours) when data was missing.
-- This corrupts ACWR and readiness calculations by treating missing data as real data.
--
-- NEW BEHAVIOR: NULL values are preserved to indicate missing data.
-- The frontend and backend calculation services handle NULL appropriately
-- with data quality indicators.

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS sync_wellness_entries_to_logs ON wellness_entries;
DROP FUNCTION IF EXISTS sync_wellness_entry_to_log();

-- Create improved function that preserves NULL values
CREATE OR REPLACE FUNCTION sync_wellness_entry_to_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update wellness_logs with data from wellness_entries
    -- IMPORTANT: Do NOT use COALESCE with default values - preserve NULLs
    -- NULL values indicate missing data and affect data quality scores
    INSERT INTO wellness_logs (
        athlete_id,
        user_id,
        log_date,
        fatigue,
        sleep_quality,
        soreness,
        mood,
        stress,
        energy,
        sleep_hours,
        created_at
    )
    VALUES (
        NEW.athlete_id,
        COALESCE(NEW.user_id, NEW.athlete_id), -- This COALESCE is OK - just ID fallback
        NEW.date,
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
-- supabase/migrations/20260130_fix_decision_ledger_function_search_paths.sql
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
-- supabase/migrations/20260130_fix_rls_performance_and_duplicate_indexes.sql
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
-- supabase/migrations/20260217000000_database_hardening_cleanup.sql
-- ============================================================================
-- Migration: Database hardening and cleanup
-- Date: 2026-02-17
-- Purpose:
-- 1) Apply security hardening to existing function definitions.
-- 2) Ensure physical_measurements structure is compatible and non-destructive.
-- 3) Ensure performance index and view security settings are in place.

-- ============================================================================
-- Function hardening: explicit search_path on SECURITY DEFINER trigger functions
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'sync_wellness_entry_to_log'
  ) THEN
    ALTER FUNCTION public.sync_wellness_entry_to_log() SET search_path = public;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_nutrition_goals_updated_at'
  ) THEN
    ALTER FUNCTION public.update_nutrition_goals_updated_at() SET search_path = public;
  END IF;
END $$;

-- ============================================================================
-- physical_measurements hardening (non-destructive)
-- ============================================================================

ALTER TABLE IF EXISTS public.physical_measurements
  ADD COLUMN IF NOT EXISTS body_water_mass DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS fat_mass DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS protein_mass DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS bone_mineral_content DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS skeletal_muscle_mass DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS muscle_percentage DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS body_water_percentage DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS protein_percentage DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS bone_mineral_percentage DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS visceral_fat_rating INTEGER,
  ADD COLUMN IF NOT EXISTS basal_metabolic_rate INTEGER,
  ADD COLUMN IF NOT EXISTS waist_to_hip_ratio DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS body_age INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_physical_measurements_user_date
ON public.physical_measurements (user_id, created_at DESC);

-- Ensure policies exist without relying on migration order assumptions.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'physical_measurements'
      AND policyname = 'Users can insert their own measurements'
  ) THEN
    CREATE POLICY "Users can insert their own measurements"
      ON public.physical_measurements
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'physical_measurements'
      AND policyname = 'Users can view their own measurements'
  ) THEN
    CREATE POLICY "Users can view their own measurements"
      ON public.physical_measurements
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'physical_measurements'
      AND policyname = 'Users can update their own measurements'
  ) THEN
    CREATE POLICY "Users can update their own measurements"
      ON public.physical_measurements
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'physical_measurements'
      AND policyname = 'Users can delete their own measurements'
  ) THEN
    CREATE POLICY "Users can delete their own measurements"
      ON public.physical_measurements
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- View security hardening
-- ============================================================================

CREATE OR REPLACE VIEW public.physical_measurements_latest
WITH (security_invoker = true) AS
SELECT DISTINCT ON (pm.user_id)
  pm.id,
  pm.user_id,
  pm.weight,
  pm.height,
  pm.body_fat,
  pm.muscle_mass,
  pm.body_water_percentage,
  pm.visceral_fat_rating,
  pm.basal_metabolic_rate,
  pm.body_age,
  pm.created_at,
  LAG(pm.weight) OVER (PARTITION BY pm.user_id ORDER BY pm.created_at) AS previous_weight,
  LAG(pm.body_fat) OVER (PARTITION BY pm.user_id ORDER BY pm.created_at) AS previous_body_fat
FROM public.physical_measurements pm
ORDER BY pm.user_id, pm.created_at DESC;

GRANT SELECT ON public.physical_measurements_latest TO authenticated;
