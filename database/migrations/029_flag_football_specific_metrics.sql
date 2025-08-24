-- Migration: Flag Football Specific Metrics and Business Logic
-- This migration adds the critical missing components for flag football specific functionality

-- 1. POSITION-SPECIFIC METRICS AND PERFORMANCE TRACKING
CREATE TABLE IF NOT EXISTS flag_football_positions (
    id SERIAL PRIMARY KEY,
    position_name VARCHAR(100) NOT NULL UNIQUE,
    position_category VARCHAR(50) NOT NULL, -- 'offense', 'defense', 'special_teams'
    primary_responsibilities TEXT[] NOT NULL,
    physical_requirements JSONB, -- strength, speed, agility requirements
    technical_skills TEXT[] NOT NULL,
    tactical_understanding TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_position_history (
    id SERIAL PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position_id INTEGER NOT NULL REFERENCES flag_football_positions(id),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT true,
    performance_rating DECIMAL(3,2) CHECK (performance_rating >= 0 AND performance_rating <= 10),
    coach_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS position_specific_metrics (
    id SERIAL PRIMARY KEY,
    position_id INTEGER NOT NULL REFERENCES flag_football_positions(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_description TEXT,
    metric_unit VARCHAR(50), -- 'seconds', 'yards', 'percentage', 'count'
    target_value DECIMAL(10,2),
    minimum_value DECIMAL(10,2),
    maximum_value DECIMAL(10,2),
    is_critical BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. GAME DAY AND TOURNAMENT WORKFLOW LOGIC
CREATE TABLE IF NOT EXISTS game_day_workflows (
    id SERIAL PRIMARY KEY,
    workflow_name VARCHAR(200) NOT NULL,
    workflow_type VARCHAR(100) NOT NULL, -- 'pre_game', 'during_game', 'post_game', 'tournament_day'
    workflow_steps JSONB NOT NULL, -- ordered array of workflow steps
    estimated_duration_minutes INTEGER,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_game_status (
    id SERIAL PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL, -- references games table (to be created)
    game_date DATE NOT NULL,
    player_status VARCHAR(50) NOT NULL, -- 'available', 'questionable', 'out', 'injured'
    position_assignment INTEGER REFERENCES flag_football_positions(id),
    roster_spot VARCHAR(50), -- 'starter', 'backup', 'special_teams'
    fatigue_score INTEGER CHECK (fatigue_score >= 1 AND fatigue_score <= 10),
    injury_risk_score INTEGER CHECK (injury_risk_score >= 1 AND injury_risk_score <= 10),
    hydration_status VARCHAR(50), -- 'optimal', 'dehydrated', 'overhydrated'
    nutrition_status VARCHAR(50), -- 'optimal', 'needs_refuel', 'overfed'
    coach_notes TEXT,
    medical_clearance BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_day_checklists (
    id SERIAL PRIMARY KEY,
    checklist_name VARCHAR(200) NOT NULL,
    checklist_type VARCHAR(100) NOT NULL, -- 'player', 'coach', 'medical', 'equipment'
    checklist_items JSONB NOT NULL, -- array of checklist items with completion status
    assigned_to UUID REFERENCES users(id),
    due_before_game_minutes INTEGER,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TEAM CHEMISTRY AND COORDINATION METRICS
CREATE TABLE IF NOT EXISTS team_chemistry_metrics (
    id SERIAL PRIMARY KEY,
    team_id UUID NOT NULL, -- references teams table (to be created)
    metric_date DATE NOT NULL,
    communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 10),
    coordination_score INTEGER CHECK (coordination_score >= 1 AND coordination_score <= 10),
    trust_score INTEGER CHECK (trust_score >= 1 AND trust_score <= 10),
    cohesion_score INTEGER CHECK (cohesion_score >= 1 AND cohesion_score <= 10),
    overall_chemistry_score INTEGER CHECK (overall_chemistry_score >= 1 AND overall_chemistry_score <= 10),
    assessment_method VARCHAR(100), -- 'coach_evaluation', 'player_survey', 'performance_analysis'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_chemistry_relationships (
    id SERIAL PRIMARY KEY,
    player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL, -- 'teammate', 'position_partner', 'friend', 'rival'
    chemistry_score INTEGER CHECK (chemistry_score >= 1 AND chemistry_score <= 10),
    communication_quality INTEGER CHECK (communication_quality >= 1 AND communication_quality <= 10),
    coordination_effectiveness INTEGER CHECK (coordination_effectiveness >= 1 AND coordination_effectiveness <= 10),
    trust_level INTEGER CHECK (trust_level >= 1 AND trust_level <= 10),
    last_assessed DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (player1_id != player2_id)
);

CREATE TABLE IF NOT EXISTS coordination_drills (
    id SERIAL PRIMARY KEY,
    drill_name VARCHAR(200) NOT NULL,
    drill_description TEXT,
    drill_type VARCHAR(100) NOT NULL, -- 'passing', 'rushing', 'defense', 'special_teams'
    required_positions INTEGER[], -- Array of position IDs
    min_players INTEGER NOT NULL,
    max_players INTEGER,
    estimated_duration_minutes INTEGER,
    difficulty_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
    equipment_needed TEXT[],
    success_criteria JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TACTICAL ANALYTICS AND FORMATIONS
CREATE TABLE IF NOT EXISTS tactical_formations (
    id SERIAL PRIMARY KEY,
    formation_name VARCHAR(100) NOT NULL,
    formation_type VARCHAR(100) NOT NULL, -- 'offense', 'defense', 'special_teams'
    formation_diagram TEXT, -- SVG or description of formation
    player_positions JSONB NOT NULL, -- mapping of positions to field locations
    tactical_objectives TEXT[],
    strengths TEXT[],
    weaknesses TEXT[],
    when_to_use TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS formation_performance_analytics (
    id SERIAL PRIMARY KEY,
    formation_id INTEGER NOT NULL REFERENCES tactical_formations(id),
    game_id UUID NOT NULL, -- references games table
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2), -- percentage of successful plays
    yards_gained INTEGER,
    points_scored INTEGER,
    time_of_possession_minutes INTEGER,
    opponent_formation_id INTEGER REFERENCES tactical_formations(id),
    environmental_factors JSONB, -- weather, field conditions, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_combination_analytics (
    id SERIAL PRIMARY KEY,
    player_ids INTEGER[] NOT NULL, -- array of player IDs
    combination_type VARCHAR(100) NOT NULL, -- 'offensive_line', 'defensive_backfield', 'special_teams'
    games_played_together INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    average_performance_score DECIMAL(3,2),
    chemistry_score INTEGER CHECK (chemistry_score >= 1 AND chemistry_score <= 10),
    tactical_effectiveness INTEGER CHECK (tactical_effectiveness >= 1 AND tactical_effectiveness <= 10),
    last_assessed DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. LINEUP AND SUBSTITUTION WORKFLOWS
CREATE TABLE IF NOT EXISTS lineup_configurations (
    id SERIAL PRIMARY KEY,
    lineup_name VARCHAR(200) NOT NULL,
    formation_id INTEGER NOT NULL REFERENCES tactical_formations(id),
    player_assignments JSONB NOT NULL, -- mapping of positions to specific players
    is_starting_lineup BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS substitution_workflows (
    id SERIAL PRIMARY KEY,
    workflow_name VARCHAR(200) NOT NULL,
    trigger_conditions JSONB NOT NULL, -- conditions that trigger substitution
    player_out_id UUID NOT NULL REFERENCES users(id),
    player_in_id UUID NOT NULL REFERENCES users(id),
    position_id INTEGER NOT NULL REFERENCES flag_football_positions(id),
    substitution_type VARCHAR(100), -- 'tactical', 'injury', 'fatigue', 'performance'
    estimated_impact JSONB, -- expected impact on team performance
    approval_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PERFORMANCE PREDICTION AND RISK ASSESSMENT
CREATE TABLE IF NOT EXISTS performance_predictions (
    id SERIAL PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prediction_date DATE NOT NULL,
    prediction_type VARCHAR(100) NOT NULL, -- 'game_performance', 'injury_risk', 'fatigue_level'
    predicted_value DECIMAL(10,2),
    confidence_level DECIMAL(5,2) CHECK (confidence_level >= 0 AND confidence_level <= 100),
    factors_considered JSONB, -- array of factors used in prediction
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_assessments (
    id SERIAL PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    risk_type VARCHAR(100) NOT NULL, -- 'injury', 'fatigue', 'dehydration', 'overtraining'
    risk_level VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 10),
    contributing_factors JSONB,
    mitigation_strategies TEXT[],
    next_assessment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_player_position_history_player_id ON player_position_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_position_history_position_id ON player_position_history(position_id);
CREATE INDEX IF NOT EXISTS idx_player_game_status_player_id ON player_game_status(player_id);
CREATE INDEX IF NOT EXISTS idx_player_game_status_game_date ON player_game_status(game_date);
CREATE INDEX IF NOT EXISTS idx_team_chemistry_metrics_team_id ON team_chemistry_metrics(team_id);
CREATE INDEX IF NOT EXISTS idx_player_chemistry_relationships_player1 ON player_chemistry_relationships(player1_id);
CREATE INDEX IF NOT EXISTS idx_player_chemistry_relationships_player2 ON player_chemistry_relationships(player2_id);
CREATE INDEX IF NOT EXISTS idx_formation_performance_analytics_formation_id ON formation_performance_analytics(formation_id);
CREATE INDEX IF NOT EXISTS idx_player_combination_analytics_player_ids ON player_combination_analytics USING GIN(player_ids);

-- Insert default flag football positions
INSERT INTO flag_football_positions (position_name, position_category, primary_responsibilities, physical_requirements, technical_skills, tactical_understanding) VALUES
('Quarterback', 'offense', ARRAY['Pass the ball', 'Read defenses', 'Call plays', 'Lead offense'], 
 '{"arm_strength": "high", "decision_making": "critical", "leadership": "essential"}',
 ARRAY['Throwing accuracy', 'Footwork', 'Pocket presence', 'Reading defenses'],
 ARRAY['Defensive formations', 'Coverage schemes', 'Blitz recognition', 'Clock management']),

('Wide Receiver', 'offense', ARRAY['Run routes', 'Catch passes', 'Block for runners', 'Create separation'],
 '{"speed": "high", "agility": "high", "hand_eye_coordination": "critical"}',
 ARRAY['Route running', 'Hands', 'Speed', 'Blocking technique'],
 ARRAY['Route concepts', 'Coverage recognition', 'Field awareness', 'Timing']),

('Running Back', 'offense', ARRAY['Run the ball', 'Catch passes', 'Pass protection', 'Block for others'],
 '{"speed": "high", "power": "medium", "vision": "critical", "balance": "high"}',
 ARRAY['Ball security', 'Cutting ability', 'Pass catching', 'Pass protection'],
 ARRAY['Gap recognition', 'Defensive reading', 'Clock management', 'Field position']),

('Center', 'offense', ARRAY['Snap the ball', 'Block defenders', 'Call blocking assignments', 'Protect quarterback'],
 '{"strength": "high", "intelligence": "high", "communication": "critical"}',
 ARRAY['Snapping', 'Blocking technique', 'Line calls', 'Pass protection'],
 ARRAY['Defensive fronts', 'Blitz recognition', 'Gap assignments', 'Line communication']),

('Defensive End', 'defense', ARRAY['Rush the passer', 'Stop the run', 'Contain the edge', 'Pressure quarterback'],
 '{"speed": "medium", "power": "high", "agility": "medium", "strength": "high"}',
 ARRAY['Pass rush moves', 'Tackling', 'Block shedding', 'Edge setting'],
 ARRAY['Run fits', 'Pass rush lanes', 'Gap responsibility', 'Field awareness']),

('Linebacker', 'defense', ARRAY['Stop the run', 'Cover receivers', 'Blitz the quarterback', 'Tackle ball carriers'],
 '{"speed": "medium", "power": "medium", "agility": "high", "instincts": "critical"}',
 ARRAY['Tackling', 'Coverage', 'Blitzing', 'Block shedding'],
 ARRAY['Run fits', 'Coverage schemes', 'Blitz timing', 'Field awareness']),

('Cornerback', 'defense', ARRAY['Cover receivers', 'Tackle runners', 'Intercept passes', 'Support run defense'],
 '{"speed": "high", "agility": "high", "recovery_speed": "critical", "ball_skills": "high"}',
 ARRAY['Man coverage', 'Zone coverage', 'Tackling', 'Ball skills'],
 ARRAY['Coverage schemes', 'Route recognition', 'Field awareness', 'Tackling angles']),

('Safety', 'defense', ARRAY['Cover deep zones', 'Support run defense', 'Cover tight ends', 'Provide help coverage'],
 '{"speed": "high", "instincts": "critical", "tackling": "high", "coverage": "high"}',
 ARRAY['Zone coverage', 'Tackling', 'Ball skills', 'Communication'],
 ARRAY['Coverage schemes', 'Run fits', 'Communication', 'Field awareness']),

('Kicker', 'special_teams', ARRAY['Kick field goals', 'Kick extra points', 'Kick offs', 'Onside kicks'],
 '{"leg_strength": "high", "accuracy": "critical", "consistency": "essential"}',
 ARRAY['Kicking technique', 'Ball placement', 'Follow through', 'Mental focus'],
 ARRAY['Field position', 'Clock management', 'Weather conditions', 'Pressure situations']),

('Punter', 'special_teams', ARRAY['Punt the ball', 'Directional punting', 'Hang time', 'Field position'],
 '{"leg_strength": "high", "accuracy": "critical", "consistency": "essential"}',
 ARRAY['Punting technique', 'Ball placement', 'Directional control', 'Hang time'],
 ARRAY['Field position', 'Clock management', 'Weather conditions', 'Coverage support']);

-- Insert default game day workflows
INSERT INTO game_day_workflows (workflow_name, workflow_type, workflow_steps, estimated_duration_minutes, is_mandatory) VALUES
('Pre-Game Preparation', 'pre_game', 
 '[
   {"step": "Equipment Check", "duration": 15, "responsible": "player"},
   {"step": "Hydration Assessment", "duration": 10, "responsible": "medical_staff"},
   {"step": "Nutrition Review", "duration": 20, "responsible": "nutritionist"},
   {"step": "Warm-up Routine", "duration": 30, "responsible": "coach"},
   {"step": "Team Meeting", "duration": 15, "responsible": "head_coach"}
 ]', 90, true),

('During Game Monitoring', 'during_game',
 '[
   {"step": "Hydration Check", "duration": 5, "responsible": "medical_staff", "frequency": "every_quarter"},
   {"step": "Fatigue Assessment", "duration": 3, "responsible": "coach", "frequency": "every_quarter"},
   {"step": "Performance Review", "duration": 10, "responsible": "coach", "frequency": "halftime"},
   {"step": "Adjustment Planning", "duration": 15, "responsible": "coaching_staff", "frequency": "halftime"}
 ]', 240, true),

('Post-Game Recovery', 'post_game',
 '[
   {"step": "Immediate Hydration", "duration": 10, "responsible": "medical_staff"},
   {"step": "Cool Down", "duration": 20, "responsible": "player"},
   {"step": "Nutrition Replenishment", "duration": 30, "responsible": "nutritionist"},
   {"step": "Recovery Assessment", "duration": 15, "responsible": "medical_staff"},
   {"step": "Next Day Planning", "duration": 20, "responsible": "coach"}
 ]', 95, true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_player_game_status_updated_at 
    BEFORE UPDATE ON player_game_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for team chemistry summary
CREATE MATERIALIZED VIEW IF NOT EXISTS team_chemistry_summary AS
SELECT 
    tcm.team_id,
    tcm.metric_date,
    AVG(tcm.overall_chemistry_score) as avg_chemistry_score,
    AVG(tcm.communication_score) as avg_communication_score,
    AVG(tcm.coordination_score) as avg_coordination_score,
    AVG(tcm.trust_score) as avg_trust_score,
    AVG(tcm.cohesion_score) as avg_cohesion_score,
    COUNT(DISTINCT pcr.player1_id) as active_relationships,
    AVG(pcr.chemistry_score) as avg_player_chemistry
FROM team_chemistry_metrics tcm
LEFT JOIN player_chemistry_relationships pcr ON pcr.last_assessed >= tcm.metric_date - INTERVAL '30 days'
GROUP BY tcm.team_id, tcm.metric_date
ORDER BY tcm.team_id, tcm.metric_date DESC;

-- Create materialized view for position performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS position_performance_summary AS
SELECT 
    fp.position_name,
    fp.position_category,
    AVG(pph.performance_rating) as avg_performance_rating,
    COUNT(DISTINCT pph.player_id) as total_players,
    COUNT(DISTINCT CASE WHEN pph.is_current THEN pph.player_id END) as current_players,
    AVG(pgs.fatigue_score) as avg_fatigue_score,
    AVG(pgs.injury_risk_score) as avg_injury_risk_score
FROM flag_football_positions fp
LEFT JOIN player_position_history pph ON fp.id = pph.position_id
LEFT JOIN player_game_status pgs ON pph.player_id = pgs.player_id
GROUP BY fp.id, fp.position_name, fp.position_category
ORDER BY fp.position_category, fp.position_name;

COMMENT ON TABLE flag_football_positions IS 'Core flag football positions with requirements and skills';
COMMENT ON TABLE player_position_history IS 'Player position assignments and performance history';
COMMENT ON TABLE position_specific_metrics IS 'Performance metrics specific to each position';
COMMENT ON TABLE game_day_workflows IS 'Structured workflows for game day operations';
COMMENT ON TABLE player_game_status IS 'Real-time player status during games and tournaments';
COMMENT ON TABLE game_day_checklists IS 'Checklists for game day preparation and execution';
COMMENT ON TABLE team_chemistry_metrics IS 'Team chemistry and coordination measurements';
COMMENT ON TABLE player_chemistry_relationships IS 'Individual player chemistry and relationship quality';
COMMENT ON TABLE coordination_drills IS 'Drills to improve team coordination and chemistry';
COMMENT ON TABLE tactical_formations IS 'Tactical formations and strategic information';
COMMENT ON TABLE formation_performance_analytics IS 'Performance analytics for different formations';
COMMENT ON TABLE player_combination_analytics IS 'Analytics for player combinations and partnerships';
COMMENT ON TABLE lineup_configurations IS 'Specific lineup configurations for games';
COMMENT ON TABLE substitution_workflows IS 'Workflows for player substitutions';
COMMENT ON TABLE performance_predictions IS 'ML-based performance predictions for players';
COMMENT ON TABLE risk_assessments IS 'Risk assessment for various player factors';
