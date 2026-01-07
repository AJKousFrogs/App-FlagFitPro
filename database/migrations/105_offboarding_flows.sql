-- =============================================================================
-- OFFBOARDING FLOWS MIGRATION
-- Migration: 105_offboarding_flows.sql
-- Purpose: Implement season end archiving, inactive player detection, account pause, and long-term injury exclusion
-- Created: 2026-01-XX
-- =============================================================================

-- =============================================================================
-- 1. SEASONS TABLE
-- Track seasons for archiving and analytics freezing
-- =============================================================================

CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- "2025-2026 Season"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_seasons_team_id ON seasons(team_id);
CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);

-- =============================================================================
-- 2. DATA ARCHIVE TABLES
-- Archive tables for season-end data preservation
-- =============================================================================

CREATE TABLE IF NOT EXISTS archived_wellness_checkins (
    LIKE daily_wellness_checkin INCLUDING ALL,
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    season_id UUID REFERENCES seasons(id),
    PRIMARY KEY (id, archived_at)
);

CREATE TABLE IF NOT EXISTS archived_training_sessions (
    LIKE training_sessions INCLUDING ALL,
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    season_id UUID REFERENCES seasons(id),
    PRIMARY KEY (id, archived_at)
);

CREATE TABLE IF NOT EXISTS archived_game_events (
    LIKE game_events INCLUDING ALL,
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    season_id UUID REFERENCES seasons(id),
    PRIMARY KEY (id, archived_at)
);

CREATE TABLE IF NOT EXISTS archived_acwr_history (
    LIKE acwr_history INCLUDING ALL,
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    season_id UUID REFERENCES seasons(id),
    PRIMARY KEY (id, archived_at)
);

-- =============================================================================
-- 3. ACCOUNT PAUSE TABLE
-- Track account pause status and ACWR freezing
-- =============================================================================

CREATE TABLE IF NOT EXISTS account_pause_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    paused_at TIMESTAMPTZ DEFAULT NOW(),
    paused_until TIMESTAMPTZ, -- NULL = indefinite pause
    reason TEXT,
    acwr_frozen BOOLEAN DEFAULT TRUE, -- ACWR calculations paused
    is_active BOOLEAN DEFAULT TRUE,
    resumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_pause_dates CHECK (paused_until IS NULL OR paused_until > paused_at)
);

CREATE INDEX IF NOT EXISTS idx_account_pause_user_id ON account_pause_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_pause_active ON account_pause_requests(is_active) WHERE is_active = TRUE;

-- Add pause status to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'account_status'
    ) THEN
        ALTER TABLE users ADD COLUMN account_status VARCHAR(50) DEFAULT 'active' 
            CHECK (account_status IN ('active', 'paused', 'inactive', 'deleted'));
    END IF;
END $$;

-- =============================================================================
-- 4. INACTIVE PLAYER TRACKING
-- Track player inactivity and notifications
-- =============================================================================

CREATE TABLE IF NOT EXISTS player_activity_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    last_activity_date DATE NOT NULL, -- Last wellness check-in or training log
    days_inactive INTEGER DEFAULT 0,
    notification_sent_30d BOOLEAN DEFAULT FALSE,
    notification_sent_90d BOOLEAN DEFAULT FALSE,
    excluded_from_analytics BOOLEAN DEFAULT FALSE, -- Excluded after 90 days
    reactivated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_activity_user_id ON player_activity_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_player_activity_team_id ON player_activity_tracking(team_id);
CREATE INDEX IF NOT EXISTS idx_player_activity_inactive ON player_activity_tracking(days_inactive) WHERE days_inactive >= 30;
CREATE INDEX IF NOT EXISTS idx_player_activity_excluded ON player_activity_tracking(excluded_from_analytics) WHERE excluded_from_analytics = TRUE;

-- =============================================================================
-- 5. LONG-TERM INJURY TRACKING
-- Track long-term injuries for analytics exclusion
-- =============================================================================

CREATE TABLE IF NOT EXISTS long_term_injury_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    injury_id UUID REFERENCES injuries(id) ON DELETE CASCADE,
    injury_start_date DATE NOT NULL,
    days_injured INTEGER DEFAULT 0,
    excluded_from_analytics BOOLEAN DEFAULT FALSE, -- Excluded after 90 days
    excluded_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_long_term_injury_user_id ON long_term_injury_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_long_term_injury_excluded ON long_term_injury_tracking(excluded_from_analytics) WHERE excluded_from_analytics = TRUE;

-- =============================================================================
-- 6. SEASON END SUMMARY REPORTS
-- Store generated summary reports
-- =============================================================================

CREATE TABLE IF NOT EXISTS season_summary_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('player', 'coach', 'team')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for team reports
    report_data JSONB NOT NULL, -- Full report data
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_season_reports_season_id ON season_summary_reports(season_id);
CREATE INDEX IF NOT EXISTS idx_season_reports_team_id ON season_summary_reports(team_id);
CREATE INDEX IF NOT EXISTS idx_season_reports_user_id ON season_summary_reports(user_id) WHERE user_id IS NOT NULL;

-- =============================================================================
-- 7. FUNCTIONS
-- =============================================================================

-- Function: Archive season data
CREATE OR REPLACE FUNCTION archive_season_data(p_season_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_season RECORD;
    v_archived_count INTEGER := 0;
BEGIN
    -- Get season details
    SELECT * INTO v_season FROM seasons WHERE id = p_season_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Season not found: %', p_season_id;
    END IF;
    
    -- Archive wellness check-ins
    INSERT INTO archived_wellness_checkins
    SELECT *, NOW(), p_season_id
    FROM daily_wellness_checkin
    WHERE checkin_date >= v_season.start_date 
      AND checkin_date <= v_season.end_date;
    
    GET DIAGNOSTICS v_archived_count = ROW_COUNT;
    RAISE NOTICE 'Archived % wellness check-ins', v_archived_count;
    
    -- Archive training sessions
    INSERT INTO archived_training_sessions
    SELECT *, NOW(), p_season_id
    FROM training_sessions
    WHERE session_date >= v_season.start_date 
      AND session_date <= v_season.end_date;
    
    GET DIAGNOSTICS v_archived_count = ROW_COUNT;
    RAISE NOTICE 'Archived % training sessions', v_archived_count;
    
    -- Archive game events
    INSERT INTO archived_game_events
    SELECT ge.*, NOW(), p_season_id
    FROM game_events ge
    JOIN games g ON ge.game_id = g.game_id
    WHERE g.game_date >= v_season.start_date 
      AND g.game_date <= v_season.end_date;
    
    GET DIAGNOSTICS v_archived_count = ROW_COUNT;
    RAISE NOTICE 'Archived % game events', v_archived_count;
    
    -- Archive ACWR history
    INSERT INTO archived_acwr_history
    SELECT *, NOW(), p_season_id
    FROM acwr_history
    WHERE calculation_date >= v_season.start_date 
      AND calculation_date <= v_season.end_date;
    
    GET DIAGNOSTICS v_archived_count = ROW_COUNT;
    RAISE NOTICE 'Archived % ACWR history records', v_archived_count;
    
    -- Mark season as archived
    UPDATE seasons
    SET is_archived = TRUE,
        archived_at = NOW(),
        is_active = FALSE,
        updated_at = NOW()
    WHERE id = p_season_id;
    
    RETURN TRUE;
END;
$$;

-- Function: Update player activity tracking
CREATE OR REPLACE FUNCTION update_player_activity(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_last_activity DATE;
    v_days_inactive INTEGER;
    v_team_id UUID;
    v_tracking RECORD;
BEGIN
    -- Get player's team
    SELECT team_id INTO v_team_id
    FROM team_members
    WHERE user_id = p_user_id AND role = 'player'
    LIMIT 1;
    
    IF v_team_id IS NULL THEN
        RETURN; -- Not a player or no team
    END IF;
    
    -- Find last activity (wellness check-in or training session)
    SELECT GREATEST(
        COALESCE(MAX(checkin_date), '1970-01-01'::DATE),
        COALESCE(MAX(session_date), '1970-01-01'::DATE)
    ) INTO v_last_activity
    FROM (
        SELECT checkin_date FROM daily_wellness_checkin WHERE user_id = p_user_id
        UNION ALL
        SELECT session_date FROM training_sessions WHERE user_id = p_user_id
    ) activities;
    
    -- Calculate days inactive
    v_days_inactive := CURRENT_DATE - v_last_activity;
    
    -- Get or create tracking record
    SELECT * INTO v_tracking
    FROM player_activity_tracking
    WHERE user_id = p_user_id AND team_id = v_team_id;
    
    IF NOT FOUND THEN
        INSERT INTO player_activity_tracking (
            user_id, team_id, last_activity_date, days_inactive
        ) VALUES (
            p_user_id, v_team_id, v_last_activity, v_days_inactive
        );
    ELSE
        UPDATE player_activity_tracking
        SET last_activity_date = v_last_activity,
            days_inactive = v_days_inactive,
            updated_at = NOW()
        WHERE id = v_tracking.id;
    END IF;
    
    -- Auto-exclude from analytics after 90 days
    IF v_days_inactive >= 90 AND NOT v_tracking.excluded_from_analytics THEN
        UPDATE player_activity_tracking
        SET excluded_from_analytics = TRUE,
            excluded_at = NOW(),
            updated_at = NOW()
        WHERE user_id = p_user_id AND team_id = v_team_id;
    END IF;
END;
$$;

-- Function: Check and update long-term injuries
CREATE OR REPLACE FUNCTION update_long_term_injuries()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_injury RECORD;
    v_days_injured INTEGER;
    v_team_id UUID;
BEGIN
    -- Find injuries older than 90 days that are still active
    FOR v_injury IN
        SELECT i.id, i.user_id, i.injury_date, i.status, i.resolved_date,
               tm.team_id
        FROM injuries i
        JOIN team_members tm ON i.user_id = tm.user_id AND tm.role = 'player'
        WHERE i.status IN ('active', 'recovering')
          AND i.injury_date <= CURRENT_DATE - INTERVAL '90 days'
          AND (i.resolved_date IS NULL OR i.resolved_date > CURRENT_DATE)
    LOOP
        v_days_injured := CURRENT_DATE - v_injury.injury_date;
        
        -- Insert or update tracking
        INSERT INTO long_term_injury_tracking (
            user_id, team_id, injury_id, injury_start_date, days_injured, excluded_from_analytics
        )
        VALUES (
            v_injury.user_id, v_injury.team_id, v_injury.id, 
            v_injury.injury_date, v_days_injured, TRUE
        )
        ON CONFLICT (user_id, injury_id) DO UPDATE
        SET days_injured = v_days_injured,
            excluded_from_analytics = TRUE,
            excluded_at = COALESCE(long_term_injury_tracking.excluded_at, NOW()),
            updated_at = NOW();
    END LOOP;
END;
$$;

-- Function: Pause account
CREATE OR REPLACE FUNCTION pause_account(
    p_user_id UUID,
    p_paused_until TIMESTAMPTZ DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pause_id UUID;
BEGIN
    -- Create pause request
    INSERT INTO account_pause_requests (
        user_id, paused_until, reason, acwr_frozen, is_active
    )
    VALUES (
        p_user_id, p_paused_until, p_reason, TRUE, TRUE
    )
    RETURNING id INTO v_pause_id;
    
    -- Update user status
    UPDATE users
    SET account_status = 'paused',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN v_pause_id;
END;
$$;

-- Function: Resume account
CREATE OR REPLACE FUNCTION resume_account(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pause_id UUID;
BEGIN
    -- Get active pause request
    SELECT id INTO v_pause_id
    FROM account_pause_requests
    WHERE user_id = p_user_id AND is_active = TRUE
    ORDER BY paused_at DESC
    LIMIT 1;
    
    IF v_pause_id IS NULL THEN
        RETURN FALSE; -- No active pause
    END IF;
    
    -- Mark pause as inactive
    UPDATE account_pause_requests
    SET is_active = FALSE,
        resumed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_pause_id;
    
    -- Update user status
    UPDATE users
    SET account_status = 'active',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$;

-- Function: Check if ACWR should be frozen (account paused or season ended)
CREATE OR REPLACE FUNCTION should_freeze_acwr(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_account_paused BOOLEAN;
    v_season_active BOOLEAN;
BEGIN
    -- Check if account is paused
    SELECT EXISTS (
        SELECT 1 FROM account_pause_requests
        WHERE user_id = p_user_id 
          AND is_active = TRUE 
          AND acwr_frozen = TRUE
    ) INTO v_account_paused;
    
    IF v_account_paused THEN
        RETURN TRUE;
    END IF;
    
    -- Check if current season is active
    SELECT EXISTS (
        SELECT 1 FROM seasons s
        JOIN team_members tm ON s.team_id = tm.team_id
        WHERE tm.user_id = p_user_id
          AND s.is_active = TRUE
          AND CURRENT_DATE BETWEEN s.start_date AND s.end_date
    ) INTO v_season_active;
    
    -- Freeze ACWR if season is not active
    RETURN NOT v_season_active;
END;
$$;

-- =============================================================================
-- 8. TRIGGERS
-- =============================================================================

-- Trigger: Update player activity on wellness check-in
CREATE OR REPLACE FUNCTION trigger_update_player_activity_wellness()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM update_player_activity(NEW.user_id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_activity_on_wellness
    AFTER INSERT OR UPDATE ON daily_wellness_checkin
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_player_activity_wellness();

-- Trigger: Update player activity on training session
CREATE OR REPLACE FUNCTION trigger_update_player_activity_training()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM update_player_activity(NEW.user_id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_activity_on_training
    AFTER INSERT OR UPDATE ON training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_player_activity_training();

-- =============================================================================
-- 9. RLS POLICIES
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_pause_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_activity_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_term_injury_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_summary_reports ENABLE ROW LEVEL SECURITY;

-- Seasons: Team members can view their team's seasons
CREATE POLICY "Users can view their team seasons"
    ON seasons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_id = seasons.team_id AND user_id = auth.uid()
        )
    );

-- Account pause: Users can view their own pause requests
CREATE POLICY "Users can view their own pause requests"
    ON account_pause_requests FOR SELECT
    USING (user_id = auth.uid());

-- Player activity: Coaches can view their team's activity
CREATE POLICY "Coaches can view team activity"
    ON player_activity_tracking FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_id = player_activity_tracking.team_id 
              AND user_id = auth.uid()
              AND role IN ('coach', 'head_coach', 'assistant_coach')
        )
    );

-- Long-term injury: Coaches can view their team's injuries
CREATE POLICY "Coaches can view team long-term injuries"
    ON long_term_injury_tracking FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_id = long_term_injury_tracking.team_id 
              AND user_id = auth.uid()
              AND role IN ('coach', 'head_coach', 'assistant_coach')
        )
    );

-- Season reports: Users can view their own reports
CREATE POLICY "Users can view their own season reports"
    ON season_summary_reports FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_id = season_summary_reports.team_id 
              AND user_id = auth.uid()
              AND role IN ('coach', 'head_coach', 'assistant_coach')
        )
    );

