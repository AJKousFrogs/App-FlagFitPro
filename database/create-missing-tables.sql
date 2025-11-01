-- Create missing database tables for FlagFit Pro
-- This script creates the tables that are referenced in the API routes

-- Team Chemistry Table
CREATE TABLE IF NOT EXISTS team_chemistry (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    overall_chemistry DECIMAL(3,1) DEFAULT 8.4,
    communication_score DECIMAL(3,1) DEFAULT 9.1,
    trust_score DECIMAL(3,1) DEFAULT 8.7,
    cohesion_score DECIMAL(3,1) DEFAULT 8.2,
    leadership_score DECIMAL(3,1) DEFAULT 8.2,
    last_intervention TEXT DEFAULT 'Trust building exercise',
    intervention_effectiveness INTEGER DEFAULT 87,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Sessions Table
CREATE TABLE IF NOT EXISTS training_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_type VARCHAR(100) DEFAULT 'Olympic preparation training',
    session_date DATE DEFAULT CURRENT_DATE,
    scheduled_time TIME DEFAULT '16:00:00',
    duration_minutes INTEGER DEFAULT 120,
    status VARCHAR(50) DEFAULT 'scheduled',
    performance_score DECIMAL(3,1) DEFAULT 8.4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    performance_score DECIMAL(3,1) DEFAULT 8.4,
    load_time INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Olympic Qualification Table
CREATE TABLE IF NOT EXISTS olympic_qualification (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    qualification_probability INTEGER DEFAULT 73,
    world_ranking INTEGER DEFAULT 8,
    days_until_championship INTEGER DEFAULT 124,
    european_championship_date DATE DEFAULT '2025-09-24',
    world_championship_date DATE DEFAULT '2026-07-15',
    olympic_date DATE DEFAULT '2028-07-14',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Benchmarks Table
CREATE TABLE IF NOT EXISTS performance_benchmarks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    current_value DECIMAL(8,2) NOT NULL,
    target_value DECIMAL(8,2) NOT NULL,
    unit VARCHAR(20) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sponsor Rewards Table
CREATE TABLE IF NOT EXISTS sponsor_rewards (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    available_points INTEGER DEFAULT 2847,
    current_tier VARCHAR(50) DEFAULT 'GOLD',
    products_available INTEGER DEFAULT 236,
    tier_progress_percentage INTEGER DEFAULT 65,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sponsor Products Table
CREATE TABLE IF NOT EXISTS sponsor_products (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    points_cost INTEGER NOT NULL,
    relevance_score INTEGER DEFAULT 90,
    category VARCHAR(100) DEFAULT 'Gear',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wearables Data Table
CREATE TABLE IF NOT EXISTS wearables_data (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) DEFAULT 'Apple Watch',
    heart_rate INTEGER DEFAULT 142,
    hrv INTEGER DEFAULT 38,
    sleep_score INTEGER DEFAULT 87,
    training_load INTEGER DEFAULT 247,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    connection_status VARCHAR(50) DEFAULT 'connected',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Quotes Table
CREATE TABLE IF NOT EXISTS daily_quotes (
    id SERIAL PRIMARY KEY,
    quote_text TEXT NOT NULL,
    author VARCHAR(200) NOT NULL,
    category VARCHAR(100) DEFAULT 'motivation',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Analytics Table
CREATE TABLE IF NOT EXISTS training_analytics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    training_type VARCHAR(100) DEFAULT 'agility',
    duration_minutes INTEGER DEFAULT 45,
    performance_score DECIMAL(3,1) DEFAULT 8.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Chemistry Metrics Table
CREATE TABLE IF NOT EXISTS team_chemistry_metrics (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(255) NOT NULL,
    communication_score DECIMAL(3,1) DEFAULT 8.5,
    coordination_score DECIMAL(3,1) DEFAULT 7.8,
    trust_score DECIMAL(3,1) DEFAULT 9.1,
    cohesion_score DECIMAL(3,1) DEFAULT 8.2,
    overall_chemistry_score DECIMAL(3,1) DEFAULT 8.4,
    metric_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(255) NOT NULL,
    player_id VARCHAR(255) NOT NULL,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flag Football Positions Table
CREATE TABLE IF NOT EXISTS flag_football_positions (
    id SERIAL PRIMARY KEY,
    position_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Position History Table
CREATE TABLE IF NOT EXISTS player_position_history (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(255) NOT NULL,
    position_id INTEGER REFERENCES flag_football_positions(id),
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Position Specific Metrics Table
CREATE TABLE IF NOT EXISTS position_specific_metrics (
    id SERIAL PRIMARY KEY,
    position_id INTEGER REFERENCES flag_football_positions(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(8,2) NOT NULL,
    unit VARCHAR(20) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Game Status Table
CREATE TABLE IF NOT EXISTS player_game_status (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(255) NOT NULL,
    game_date DATE DEFAULT CURRENT_DATE,
    fatigue_score INTEGER DEFAULT 3,
    injury_risk_score INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(255) NOT NULL,
    page_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data for immediate functionality
INSERT INTO daily_quotes (quote_text, author, category) VALUES
('Champions aren''t made in comfort zones. Today''s training is tomorrow''s victory.', 'Coach Marcus Rivera', 'motivation'),
('The difference between ordinary and extraordinary is that little extra.', 'Jimmy Johnson', 'motivation'),
('Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.', 'Pelé', 'motivation')
ON CONFLICT DO NOTHING;

INSERT INTO flag_football_positions (position_name, description) VALUES
('Quarterback', 'Field general and play caller'),
('Wide Receiver', 'Primary pass catcher and route runner'),
('Running Back', 'Ball carrier and blocker'),
('Defensive Back', 'Pass coverage and run support'),
('Rusher', 'Pass rusher and run stopper')
ON CONFLICT DO NOTHING;

-- Insert sample sponsor products
INSERT INTO sponsor_products (product_name, points_cost, relevance_score, category, is_featured) VALUES
('Pro Grip Football Socks', 350, 92, 'Gear', true),
('Recovery Massage Gun', 1650, 78, 'Recovery', true),
('Elite Training Shorts', 780, 89, 'Gear', true),
('Recovery Band Set', 420, 94, 'Recovery', true)
ON CONFLICT DO NOTHING;

-- Insert sample performance benchmarks for user 1
INSERT INTO performance_benchmarks (user_id, metric_name, current_value, target_value, unit) VALUES
('1', '40-Yard Dash', 4.52, 4.40, 's'),
('1', 'Passing Accuracy', 82.5, 85, '%'),
('1', 'Agility Shuttle', 4.18, 4.00, 's'),
('1', 'Game IQ Score', 87, 90, '')
ON CONFLICT DO NOTHING;

-- Insert sample team chemistry data for user 1
INSERT INTO team_chemistry (user_id, overall_chemistry, communication_score, trust_score, cohesion_score, leadership_score) VALUES
('1', 8.4, 9.1, 8.7, 8.2, 8.2)
ON CONFLICT DO NOTHING;

-- Insert sample training session for user 1
INSERT INTO training_sessions (user_id, session_type, session_date, status, performance_score) VALUES
('1', 'Olympic preparation training', CURRENT_DATE, 'completed', 8.4)
ON CONFLICT DO NOTHING;

-- Insert sample performance metrics for user 1
INSERT INTO performance_metrics (user_id, performance_score, load_time) VALUES
('1', 8.4, 1000)
ON CONFLICT DO NOTHING;

-- Insert sample olympic qualification data for user 1
INSERT INTO olympic_qualification (user_id, qualification_probability, world_ranking, days_until_championship) VALUES
('1', 73, 8, 124)
ON CONFLICT DO NOTHING;

-- Insert sample sponsor rewards for user 1
INSERT INTO sponsor_rewards (user_id, available_points, current_tier, products_available, tier_progress_percentage) VALUES
('1', 2847, 'GOLD', 236, 65)
ON CONFLICT DO NOTHING;

-- Insert sample wearables data for user 1
INSERT INTO wearables_data (user_id, device_type, heart_rate, hrv, sleep_score, training_load) VALUES
('1', 'Apple Watch', 142, 38, 87, 247)
ON CONFLICT DO NOTHING;

-- Insert sample notifications for user 1
INSERT INTO notifications (user_id, notification_type, message, priority) VALUES
('1', 'injury_risk', 'Injury risk alert: Landing mechanics suboptimal', 'high'),
('1', 'weather', 'Weather alert: Tomorrow''s practice moved to 6PM', 'medium'),
('1', 'tournament', 'European Championship bracket updated', 'low')
ON CONFLICT DO NOTHING;

COMMIT;

