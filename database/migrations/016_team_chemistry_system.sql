-- Migration: Advanced Team Chemistry Rating System
-- Description: Comprehensive teammate rating system with AI-powered interventions
-- Created: 2025-08-03
-- Supports: 5-category ratings, psychology AI, team building interventions, chemistry analytics

-- =============================================================================
-- TEAM CHEMISTRY RATING FRAMEWORK
-- =============================================================================

-- Team chemistry rating categories and definitions
CREATE TABLE chemistry_rating_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(50) NOT NULL UNIQUE, -- 'communication', 'teamwork', 'leadership', 'reliability', 'attitude'
    display_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    rating_guidance TEXT, -- Detailed guidance for raters
    
    -- Category weighting in overall chemistry score
    weight_percentage DECIMAL(5,2) DEFAULT 20.00, -- Default equal weighting
    
    -- Category-specific settings
    is_active BOOLEAN DEFAULT true,
    requires_comment BOOLEAN DEFAULT false,
    min_rating INTEGER DEFAULT 1,
    max_rating INTEGER DEFAULT 10,
    
    -- Thresholds for different performance levels
    excellent_threshold DECIMAL(3,1) DEFAULT 8.5,
    good_threshold DECIMAL(3,1) DEFAULT 7.0,
    needs_improvement_threshold DECIMAL(3,1) DEFAULT 5.0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual teammate ratings submitted by players
CREATE TABLE teammate_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rater_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES chemistry_rating_categories(id),
    
    -- Rating details
    rating_value DECIMAL(3,1) NOT NULL CHECK (rating_value BETWEEN 1.0 AND 10.0),
    rating_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Context and comments
    comments TEXT,
    specific_examples TEXT, -- Specific examples supporting the rating
    improvement_suggestions TEXT,
    
    -- Rating metadata
    is_anonymous BOOLEAN DEFAULT false,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5), -- How confident is the rater
    interaction_frequency VARCHAR(20), -- 'daily', 'weekly', 'occasionally', 'rarely'
    relationship_context VARCHAR(50), -- 'teammate', 'position_group', 'offense', 'defense'
    
    -- Temporal context
    rating_period_start DATE, -- Period this rating covers
    rating_period_end DATE,
    games_observed INTEGER DEFAULT 0,
    practices_observed INTEGER DEFAULT 0,
    
    -- Validation and quality control
    is_validated BOOLEAN DEFAULT false,
    validation_score DECIMAL(3,2), -- AI-calculated validity score
    flagged_for_review BOOLEAN DEFAULT false,
    review_reason TEXT,
    
    -- Change tracking
    previous_rating DECIMAL(3,1), -- Previous rating for this category
    rating_change DECIMAL(3,1), -- Calculated change
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(rater_user_id, rated_user_id, team_id, category_id, rating_date),
    CHECK(rater_user_id != rated_user_id) -- Cannot rate yourself
);

-- =============================================================================
-- TEAM CHEMISTRY ANALYTICS
-- =============================================================================

-- Aggregated team chemistry scores and trends
CREATE TABLE team_chemistry_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Overall chemistry metrics
    overall_chemistry_score DECIMAL(4,2) NOT NULL CHECK (overall_chemistry_score BETWEEN 1.00 AND 10.00),
    score_trend VARCHAR(20), -- 'improving', 'stable', 'declining'
    trend_percentage DECIMAL(5,2), -- +/- percentage change
    
    -- Category breakdown
    communication_score DECIMAL(4,2),
    teamwork_score DECIMAL(4,2),
    leadership_score DECIMAL(4,2),
    reliability_score DECIMAL(4,2),
    attitude_score DECIMAL(4,2),
    
    -- Chemistry health indicators
    chemistry_status VARCHAR(20) NOT NULL, -- 'excellent', 'good', 'average', 'needs_attention', 'critical'
    intervention_needed BOOLEAN DEFAULT false,
    threshold_breached BOOLEAN DEFAULT false,
    
    -- Statistical measures
    score_variance DECIMAL(5,3), -- How much individual ratings vary
    rating_participation_rate DECIMAL(5,2), -- Percentage of players who submitted ratings
    total_ratings_received INTEGER DEFAULT 0,
    average_confidence_level DECIMAL(3,2),
    
    -- Team dynamics insights
    leadership_clarity DECIMAL(4,2), -- How clear leadership structure is
    communication_effectiveness DECIMAL(4,2),
    conflict_indicators DECIMAL(4,2), -- Signs of team conflict
    cohesion_strength DECIMAL(4,2),
    
    -- Performance correlation
    recent_game_performance DECIMAL(4,2), -- Correlation with recent wins/losses
    practice_engagement DECIMAL(4,2),
    
    -- External factors
    roster_stability DECIMAL(4,2), -- How stable the roster has been
    coaching_changes BOOLEAN DEFAULT false,
    season_pressure_level VARCHAR(20), -- 'low', 'medium', 'high', 'playoffs'
    
    -- Calculation metadata
    calculation_algorithm VARCHAR(50) DEFAULT 'weighted_average_v1',
    data_quality_score DECIMAL(3,2),
    manual_adjustments JSONB, -- Any manual overrides
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual player chemistry profiles within teams
CREATE TABLE player_chemistry_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    profile_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Individual chemistry scores (how others rate this player)
    received_communication_score DECIMAL(4,2),
    received_teamwork_score DECIMAL(4,2),
    received_leadership_score DECIMAL(4,2),
    received_reliability_score DECIMAL(4,2),
    received_attitude_score DECIMAL(4,2),
    overall_received_score DECIMAL(4,2),
    
    -- Rating behavior (how this player rates others)
    given_ratings_count INTEGER DEFAULT 0,
    average_rating_given DECIMAL(4,2),
    rating_consistency DECIMAL(3,2), -- How consistent their ratings are
    critical_rating_tendency DECIMAL(3,2), -- Tendency to give low ratings
    
    -- Social network analysis
    strong_connections_count INTEGER DEFAULT 0, -- High mutual chemistry
    weak_connections_count INTEGER DEFAULT 0,
    conflict_indicators INTEGER DEFAULT 0,
    influence_score DECIMAL(4,2), -- How much this player influences team chemistry
    
    -- Position-specific metrics
    position_group_chemistry DECIMAL(4,2), -- Chemistry within position group
    cross_position_chemistry DECIMAL(4,2), -- Chemistry across positions
    veteran_newcomer_bridge DECIMAL(4,2), -- How well they bridge experience gaps
    
    -- Leadership characteristics
    formal_leadership_role VARCHAR(50), -- 'captain', 'assistant_captain', 'position_leader', 'none'
    informal_leadership_score DECIMAL(4,2), -- Natural leadership as rated by peers
    mentorship_activity DECIMAL(4,2), -- How much they mentor others
    
    -- Improvement tracking
    chemistry_trend VARCHAR(20), -- 'improving', 'stable', 'declining'
    areas_for_improvement TEXT[],
    strengths TEXT[],
    development_goals TEXT[],
    
    -- Risk factors
    chemistry_risk_score DECIMAL(4,2), -- Risk of being a chemistry problem
    early_warning_flags TEXT[], -- Potential chemistry issues
    intervention_recommendations TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- AI-POWERED TEAM BUILDING INTERVENTIONS
-- =============================================================================

-- Team building intervention triggers and rules
CREATE TABLE chemistry_intervention_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    
    -- Trigger conditions
    chemistry_threshold DECIMAL(4,2), -- Overall chemistry score threshold
    category_thresholds JSONB, -- {"communication": 6.0, "teamwork": 5.5}
    trend_trigger VARCHAR(50), -- 'declining_fast', 'below_threshold', 'conflict_detected'
    
    -- Trigger sensitivity
    is_active BOOLEAN DEFAULT true,
    trigger_priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    cooldown_days INTEGER DEFAULT 7, -- Days between triggering same intervention
    
    -- Intervention selection
    recommended_interventions TEXT[], -- Array of intervention types
    intervention_urgency VARCHAR(20) DEFAULT 'medium',
    
    -- Success criteria
    success_metrics TEXT[],
    expected_improvement_percentage DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Specific team building interventions and activities
CREATE TABLE team_building_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    trigger_id UUID REFERENCES chemistry_intervention_triggers(id),
    
    -- Intervention details
    intervention_type VARCHAR(100) NOT NULL, -- 'communication_workshop', 'trust_building', 'conflict_resolution'
    intervention_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Timing and scheduling
    scheduled_date DATE,
    scheduled_time TIME,
    duration_minutes INTEGER,
    location VARCHAR(255),
    
    -- Participants
    target_participants UUID[], -- Specific players if not whole team
    facilitator_id UUID REFERENCES users(id), -- Coach or external facilitator
    is_mandatory BOOLEAN DEFAULT true,
    
    -- Intervention content
    activities JSONB, -- Structured activity descriptions
    materials_needed TEXT[],
    preparation_requirements TEXT[],
    
    -- Goals and expected outcomes
    primary_objectives TEXT[],
    chemistry_targets JSONB, -- {"communication": "+1.5", "teamwork": "+1.0"}
    success_criteria TEXT[],
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    completion_percentage INTEGER DEFAULT 0,
    participant_attendance_rate DECIMAL(5,2),
    
    -- Results and effectiveness
    pre_intervention_scores JSONB, -- Chemistry scores before intervention
    post_intervention_scores JSONB, -- Chemistry scores after intervention
    immediate_feedback JSONB, -- Participant feedback right after
    long_term_effectiveness DECIMAL(4,2), -- Measured weeks later
    
    -- Follow-up requirements
    follow_up_needed BOOLEAN DEFAULT false,
    follow_up_activities TEXT[],
    next_check_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intervention outcomes and effectiveness tracking
CREATE TABLE intervention_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervention_id UUID NOT NULL REFERENCES team_building_interventions(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Outcome measurement timing
    measurement_date DATE NOT NULL,
    measurement_type VARCHAR(50) NOT NULL, -- 'immediate', '1_week', '1_month', '3_month'
    
    -- Chemistry score changes
    chemistry_score_before DECIMAL(4,2),
    chemistry_score_after DECIMAL(4,2),
    chemistry_improvement DECIMAL(5,2), -- Positive or negative change
    
    -- Category-specific improvements
    communication_improvement DECIMAL(5,2),
    teamwork_improvement DECIMAL(5,2),
    leadership_improvement DECIMAL(5,2),
    reliability_improvement DECIMAL(5,2),
    attitude_improvement DECIMAL(5,2),
    
    -- Behavioral observations
    observed_improvements TEXT[],
    ongoing_challenges TEXT[],
    unintended_consequences TEXT[],
    
    -- Participant feedback
    participant_satisfaction DECIMAL(3,1) CHECK (participant_satisfaction BETWEEN 1.0 AND 5.0),
    would_recommend BOOLEAN,
    feedback_comments TEXT,
    
    -- Performance correlation
    game_performance_change DECIMAL(5,2), -- Change in win rate or other metrics
    practice_engagement_change DECIMAL(5,2),
    conflict_incidents_change INTEGER, -- Change in number of conflicts
    
    -- Sustainability assessment
    improvement_sustainability VARCHAR(20), -- 'excellent', 'good', 'moderate', 'poor'
    refresher_training_needed BOOLEAN DEFAULT false,
    
    -- Data collection methodology
    data_collection_method VARCHAR(50), -- 'survey', 'observation', 'peer_rating', 'performance_data'
    data_quality_rating DECIMAL(3,1),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- CHEMISTRY ANALYTICS AND INSIGHTS
-- =============================================================================

-- Historical team chemistry trends and patterns
CREATE TABLE chemistry_trend_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    analysis_period_days INTEGER DEFAULT 30,
    
    -- Trend analysis
    overall_trend VARCHAR(20), -- 'strongly_improving', 'improving', 'stable', 'declining', 'strongly_declining'
    trend_confidence DECIMAL(3,2), -- Statistical confidence in trend
    rate_of_change DECIMAL(5,3), -- Points per day change
    
    -- Cyclical patterns
    seasonal_patterns JSONB, -- Patterns by season/month
    weekly_patterns JSONB, -- Patterns by day of week
    game_vs_practice_patterns JSONB,
    
    -- Correlation analysis
    performance_correlation DECIMAL(4,3), -- Chemistry vs game performance
    roster_change_impact DECIMAL(4,3), -- Impact of roster changes
    coaching_correlation DECIMAL(4,3), -- Chemistry vs coaching changes
    
    -- Predictive insights
    predicted_score_30_days DECIMAL(4,2),
    intervention_recommendations TEXT[],
    risk_factors TEXT[],
    
    -- Statistical measures
    score_volatility DECIMAL(5,3), -- How much scores fluctuate
    trend_acceleration DECIMAL(5,3), -- Is trend speeding up or slowing down
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Teammate ratings indexes
CREATE INDEX idx_teammate_ratings_team_date ON teammate_ratings(team_id, rating_date);
CREATE INDEX idx_teammate_ratings_rated_user ON teammate_ratings(rated_user_id, rating_date);
CREATE INDEX idx_teammate_ratings_category ON teammate_ratings(category_id, rating_date);
CREATE INDEX idx_teammate_ratings_rater ON teammate_ratings(rater_user_id);

-- Chemistry scores indexes
CREATE INDEX idx_chemistry_scores_team_date ON team_chemistry_scores(team_id, calculation_date);
CREATE INDEX idx_chemistry_scores_status ON team_chemistry_scores(chemistry_status, intervention_needed);

-- Player profiles indexes
CREATE INDEX idx_player_profiles_user_team ON player_chemistry_profiles(user_id, team_id);
CREATE INDEX idx_player_profiles_date ON player_chemistry_profiles(profile_date);

-- Interventions indexes
CREATE INDEX idx_interventions_team_status ON team_building_interventions(team_id, status);
CREATE INDEX idx_interventions_scheduled ON team_building_interventions(scheduled_date, status);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Current team chemistry status across all teams
CREATE OR REPLACE VIEW team_chemistry_dashboard AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    tcs.overall_chemistry_score,
    tcs.chemistry_status,
    tcs.intervention_needed,
    tcs.communication_score,
    tcs.teamwork_score,
    tcs.leadership_score,
    tcs.reliability_score,
    tcs.attitude_score,
    tcs.score_trend,
    tcs.trend_percentage,
    tcs.calculation_date,
    COUNT(tm.user_id) as team_size,
    COALESCE(intervention_count.active_interventions, 0) as active_interventions
FROM teams t
LEFT JOIN team_chemistry_scores tcs ON t.id = tcs.team_id 
    AND tcs.calculation_date = (
        SELECT MAX(calculation_date) 
        FROM team_chemistry_scores tcs2 
        WHERE tcs2.team_id = t.id
    )
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
LEFT JOIN (
    SELECT team_id, COUNT(*) as active_interventions
    FROM team_building_interventions
    WHERE status IN ('scheduled', 'in_progress')
    GROUP BY team_id
) intervention_count ON t.id = intervention_count.team_id
WHERE t.is_active = true
GROUP BY t.id, t.name, tcs.overall_chemistry_score, tcs.chemistry_status, 
         tcs.intervention_needed, tcs.communication_score, tcs.teamwork_score, 
         tcs.leadership_score, tcs.reliability_score, tcs.attitude_score, 
         tcs.score_trend, tcs.trend_percentage, tcs.calculation_date, 
         intervention_count.active_interventions;

-- Player chemistry rankings within teams
CREATE OR REPLACE VIEW player_chemistry_rankings AS
SELECT 
    pcp.user_id,
    u.first_name,
    u.last_name,
    pcp.team_id,
    t.name as team_name,
    pcp.overall_received_score,
    pcp.influence_score,
    pcp.formal_leadership_role,
    pcp.informal_leadership_score,
    pcp.chemistry_trend,
    RANK() OVER (PARTITION BY pcp.team_id ORDER BY pcp.overall_received_score DESC) as chemistry_rank,
    RANK() OVER (PARTITION BY pcp.team_id ORDER BY pcp.influence_score DESC) as influence_rank
FROM player_chemistry_profiles pcp
JOIN users u ON pcp.user_id = u.id
JOIN teams t ON pcp.team_id = t.id
WHERE pcp.profile_date = (
    SELECT MAX(profile_date) 
    FROM player_chemistry_profiles pcp2 
    WHERE pcp2.user_id = pcp.user_id AND pcp2.team_id = pcp.team_id
);

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert rating categories
INSERT INTO chemistry_rating_categories (category_name, display_name, description, rating_guidance) VALUES
('communication', 'Communication', 'How well this player communicates during games and practice', 'Consider clarity of play calls, listening skills, constructive feedback, and non-verbal communication'),
('teamwork', 'Teamwork', 'How well this player works with others and supports the team', 'Evaluate willingness to help teammates, sacrifice for team success, and collaborative problem-solving'),
('leadership', 'Leadership', 'How well this player leads by example and motivates others', 'Look for setting positive examples, encouraging teammates, taking initiative, and handling pressure'),
('reliability', 'Reliability', 'How reliable this player is in showing up and performing consistently', 'Consider attendance, punctuality, consistency in performance, and dependability in crucial moments'),
('attitude', 'Attitude', 'How positive and constructive this player''s attitude is', 'Assess positivity during challenges, sportsmanship, resilience after mistakes, and overall team spirit');

-- Insert sample intervention triggers
INSERT INTO chemistry_intervention_triggers (trigger_name, description, chemistry_threshold, trend_trigger, recommended_interventions) VALUES
('Low Overall Chemistry', 'Triggered when overall team chemistry falls below threshold', 6.5, 'below_threshold', ARRAY['communication_workshop', 'team_building_retreat']),
('Declining Communication', 'Triggered when communication scores show rapid decline', 7.0, 'declining_fast', ARRAY['communication_skills_training', 'active_listening_workshop']),
('Leadership Vacuum', 'Triggered when leadership scores are consistently low', 6.0, 'below_threshold', ARRAY['leadership_development', 'mentorship_program']),
('Conflict Detection', 'Triggered when conflict indicators rise above threshold', 8.0, 'conflict_detected', ARRAY['conflict_resolution_session', 'mediation_workshop']);