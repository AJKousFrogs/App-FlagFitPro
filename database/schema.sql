-- FlagFit Pro - Neon PostgreSQL Database Schema
-- Hybrid Analytics System: Advanced analytics storage for complex queries and reporting
-- PocketBase handles real-time events, Neon handles advanced analytics

-- =============================================================================
-- ANALYTICS EVENTS TABLE
-- Stores all user interactions and events from the application
-- =============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(255) NOT NULL,
    page_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata
    referrer TEXT,
    viewport_width INTEGER,
    viewport_height INTEGER,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100)
);

-- =============================================================================
-- PERFORMANCE METRICS TABLE  
-- Stores application performance data for monitoring and optimization
-- =============================================================================

CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    page_url TEXT NOT NULL,
    
    -- Core performance metrics
    load_time DECIMAL(10,3), -- Page load time in milliseconds
    api_response_time DECIMAL(10,3), -- API response time in milliseconds
    bundle_size INTEGER, -- JavaScript bundle size in bytes
    memory_usage DECIMAL(10,3), -- Memory usage in MB
    
    -- Core Web Vitals
    fcp DECIMAL(10,3), -- First Contentful Paint
    lcp DECIMAL(10,3), -- Largest Contentful Paint
    fid DECIMAL(10,3), -- First Input Delay
    cls DECIMAL(10,6), -- Cumulative Layout Shift
    
    -- Network and device info
    connection_type VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- USER BEHAVIOR TABLE
-- Aggregated user behavior patterns and journey analysis
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_behavior (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    
    -- Journey tracking
    page_sequence TEXT[], -- Array of pages visited in order
    session_duration INTEGER, -- Session duration in seconds
    total_page_views INTEGER,
    bounce_rate BOOLEAN, -- True if single page session
    
    -- Feature usage
    features_used TEXT[], -- Array of features used in session
    training_sessions_completed INTEGER DEFAULT 0,
    goals_created INTEGER DEFAULT 0,
    
    -- Conversion tracking
    conversion_events TEXT[], -- Array of conversion events
    funnel_stage VARCHAR(100), -- Current stage in conversion funnel
    
    -- Device and context
    device_type VARCHAR(50),
    browser VARCHAR(100),
    entry_page TEXT,
    exit_page TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TRAINING ANALYTICS TABLE
-- Specific analytics for training sessions and performance
-- =============================================================================

CREATE TABLE IF NOT EXISTS training_analytics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    
    -- Training session data
    training_type VARCHAR(100), -- e.g., 'agility', 'passing', 'catching'
    duration_minutes INTEGER,
    exercises_completed INTEGER,
    difficulty_level VARCHAR(50),
    performance_score DECIMAL(5,2),
    
    -- Progress tracking
    goals_achieved INTEGER DEFAULT 0,
    personal_best BOOLEAN DEFAULT FALSE,
    improvement_percentage DECIMAL(5,2),
    
    -- Session metadata
    weather_conditions VARCHAR(100),
    location_type VARCHAR(100), -- e.g., 'indoor', 'outdoor', 'gym'
    equipment_used TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Analytics Events Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_url ON analytics_events(page_url);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time ON analytics_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time ON analytics_events(event_type, created_at);

-- JSONB indexes for event_data queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_feature ON analytics_events USING GIN ((event_data->>'feature'));
CREATE INDEX IF NOT EXISTS idx_analytics_events_action ON analytics_events USING GIN ((event_data->>'action'));

-- Performance Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_page_url ON performance_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_load_time ON performance_metrics(load_time);

-- User Behavior Indexes
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_session_id ON user_behavior(session_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_created_at ON user_behavior(created_at);
CREATE INDEX IF NOT EXISTS idx_user_behavior_funnel_stage ON user_behavior(funnel_stage);

-- Training Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_training_analytics_user_id ON training_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_training_analytics_type ON training_analytics(training_type);
CREATE INDEX IF NOT EXISTS idx_training_analytics_created_at ON training_analytics(created_at);

-- =============================================================================
-- SAMPLE DATA INSERTS (FOR TESTING)
-- =============================================================================

-- Sample analytics events
INSERT INTO analytics_events (user_id, event_type, event_data, session_id, page_url, user_agent) VALUES
('user_123', 'page_view', '{"referrer": "https://google.com"}', 'session_456', 'https://flagfit-pro.netlify.app/dashboard', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('user_123', 'feature_usage', '{"feature": "training_timer", "duration": 300}', 'session_456', 'https://flagfit-pro.netlify.app/training', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('user_456', 'goal_created', '{"goal_type": "agility", "target_value": 10}', 'session_789', 'https://flagfit-pro.netlify.app/goals', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');

-- Sample performance metrics
INSERT INTO performance_metrics (user_id, page_url, load_time, api_response_time, connection_type) VALUES
('user_123', 'https://flagfit-pro.netlify.app/dashboard', 1250.5, 85.2, '4g'),
('user_456', 'https://flagfit-pro.netlify.app/training', 980.3, 120.8, 'wifi'),
('user_789', 'https://flagfit-pro.netlify.app/goals', 1100.7, 95.5, '4g');

-- Sample user behavior
INSERT INTO user_behavior (user_id, session_id, page_sequence, session_duration, total_page_views, features_used) VALUES
('user_123', 'session_456', ARRAY['/dashboard', '/training', '/goals'], 1800, 5, ARRAY['training_timer', 'goal_tracker']),
('user_456', 'session_789', ARRAY['/landing', '/dashboard', '/training'], 1200, 3, ARRAY['signup', 'training_timer']);

-- Sample training analytics
INSERT INTO training_analytics (user_id, training_type, duration_minutes, exercises_completed, performance_score) VALUES
('user_123', 'agility', 30, 8, 85.5),
('user_456', 'passing', 25, 6, 92.3),
('user_789', 'catching', 20, 5, 78.9);

-- =============================================================================
-- VIEWS FOR COMMON ANALYTICS QUERIES
-- =============================================================================

-- Daily active users
CREATE OR REPLACE VIEW daily_active_users AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as active_users
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Popular features
CREATE OR REPLACE VIEW popular_features AS
SELECT 
    event_data->>'feature' as feature,
    COUNT(*) as usage_count,
    COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
WHERE event_type = 'feature_usage'
    AND event_data->>'feature' IS NOT NULL
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_data->>'feature'
ORDER BY usage_count DESC;

-- Performance summary
CREATE OR REPLACE VIEW performance_summary AS
SELECT 
    page_url,
    COUNT(*) as measurements,
    AVG(load_time) as avg_load_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY load_time) as p95_load_time,
    AVG(api_response_time) as avg_api_response
FROM performance_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY page_url
ORDER BY avg_load_time DESC;

-- User journey analysis
CREATE OR REPLACE VIEW user_journeys AS
SELECT 
    page_sequence,
    COUNT(*) as frequency,
    AVG(session_duration) as avg_duration,
    AVG(total_page_views) as avg_page_views
FROM user_behavior
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY page_sequence
ORDER BY frequency DESC;