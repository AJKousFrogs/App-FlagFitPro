-- Migration: AI Coach Chat System
-- Description: Conversational AI coach with context, memory, and personalized interactions
-- Created: 2024-10-15

-- AI Coach personalities and configuration
CREATE TABLE ai_coach_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Coach personality
    coach_name VARCHAR(255) NOT NULL DEFAULT 'Coach AI',
    personality_type VARCHAR(50) NOT NULL, -- motivational, analytical, supportive, intense, friendly
    coaching_style VARCHAR(50) NOT NULL, -- drill_sergeant, mentor, teacher, buddy, professional
    
    -- Expertise areas
    specializations TEXT[] NOT NULL, -- route_running, quarterback, defense, fitness, nutrition, mental_game
    experience_level VARCHAR(50) DEFAULT 'expert', -- beginner, intermediate, advanced, expert, legendary
    
    -- Communication style
    formality_level VARCHAR(50) DEFAULT 'casual', -- formal, semi_formal, casual, very_casual
    encouragement_frequency VARCHAR(50) DEFAULT 'moderate', -- low, moderate, high, very_high
    humor_level VARCHAR(50) DEFAULT 'moderate', -- none, subtle, moderate, heavy
    
    -- Language and tone
    preferred_language VARCHAR(10) DEFAULT 'en',
    tone_keywords TEXT[], -- positive, direct, patient, energetic, calm, etc.
    
    -- Coaching philosophy
    philosophy_summary TEXT,
    key_principles TEXT[],
    motivational_quotes TEXT[],
    
    -- Response patterns
    greeting_messages TEXT[],
    encouragement_phrases TEXT[],
    correction_phrases TEXT[],
    celebration_phrases TEXT[],
    
    -- AI model configuration
    model_version VARCHAR(50) DEFAULT 'gpt-4',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_response_length INTEGER DEFAULT 500,
    
    -- Usage stats
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    average_session_length_minutes DECIMAL(6,2),
    user_satisfaction_avg DECIMAL(3,2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-specific AI coach customizations
CREATE TABLE user_ai_coach_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_coach_profile_id UUID NOT NULL REFERENCES ai_coach_profiles(id) ON DELETE CASCADE,
    
    -- Personalization
    preferred_name VARCHAR(100), -- what the coach should call the user
    communication_style VARCHAR(50), -- brief, detailed, conversational, technical
    
    -- Interaction preferences
    proactive_messages BOOLEAN DEFAULT true, -- should coach initiate conversations
    reminder_frequency VARCHAR(50) DEFAULT 'moderate', -- low, moderate, high, off
    
    -- Feedback preferences
    correction_style VARCHAR(50) DEFAULT 'constructive', -- direct, gentle, constructive, detailed
    praise_frequency VARCHAR(50) DEFAULT 'balanced', -- minimal, balanced, frequent
    
    -- Topics of interest
    focus_areas TEXT[], -- technique, nutrition, mental_game, strategy, fitness
    avoid_topics TEXT[], -- injury_details, personal_life, etc.
    
    -- Learning style
    learns_best_from VARCHAR(50), -- examples, explanations, practice, visual_aids
    information_depth VARCHAR(50) DEFAULT 'moderate', -- basic, moderate, detailed, expert
    
    -- Schedule and timing
    preferred_contact_times TIME[],
    timezone VARCHAR(50),
    do_not_disturb_start TIME DEFAULT '22:00',
    do_not_disturb_end TIME DEFAULT '07:00',
    
    -- Privacy settings
    share_performance_data BOOLEAN DEFAULT true,
    share_nutrition_data BOOLEAN DEFAULT true,
    share_recovery_data BOOLEAN DEFAULT true,
    share_team_data BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation sessions between user and AI coach
CREATE TABLE ai_chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_coach_profile_id UUID NOT NULL REFERENCES ai_coach_profiles(id) ON DELETE CASCADE,
    
    -- Session details
    conversation_title VARCHAR(255),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- Context and triggers
    initiated_by VARCHAR(50) NOT NULL, -- user, ai_proactive, scheduled, training_event, performance_alert
    conversation_trigger VARCHAR(100), -- manual_question, post_training, pre_game, weekly_checkin, performance_concern
    
    -- Session metadata
    total_messages INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    
    -- Related data context
    related_training_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    related_nutrition_day DATE,
    related_recovery_session_id UUID REFERENCES recovery_sessions(id) ON DELETE SET NULL,
    
    -- Conversation outcomes
    user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
    goals_achieved BOOLEAN,
    follow_up_needed BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    -- Summary and key points
    conversation_summary TEXT,
    key_insights TEXT[],
    action_items TEXT[],
    recommendations_given TEXT[],
    
    -- Technical details
    total_tokens_used INTEGER,
    cost_usd DECIMAL(8,4),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual messages within conversations
CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
    
    -- Message basics
    message_index INTEGER NOT NULL, -- order within conversation
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'ai')),
    
    -- Message content
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, audio, video, chart, drill_recommendation
    
    -- Rich content
    attachments JSONB, -- file references, images, charts, etc.
    embedded_data JSONB, -- drill data, performance charts, nutrition info
    
    -- AI-specific data (when sender_type = 'ai')
    ai_confidence DECIMAL(3,2), -- 0-1 confidence in response accuracy
    ai_reasoning TEXT, -- internal reasoning for the response
    knowledge_sources TEXT[], -- training_data, user_performance, nutrition_db, etc.
    
    -- User interaction (for AI messages)
    user_feedback INTEGER CHECK (user_feedback BETWEEN 1 AND 5),
    helpful_rating BOOLEAN,
    
    -- Message context
    referenced_data_points TEXT[], -- specific data the message references
    triggered_actions TEXT[], -- actions this message should trigger
    
    -- Technical metadata
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- AI coach knowledge base and learning
CREATE TABLE ai_coach_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_coach_profile_id UUID NOT NULL REFERENCES ai_coach_profiles(id) ON DELETE CASCADE,
    
    -- Knowledge categorization
    knowledge_type VARCHAR(50) NOT NULL, -- user_insight, training_principle, nutrition_fact, technique_tip, motivational_strategy
    category VARCHAR(100) NOT NULL, -- position_specific, general_fitness, mental_game, etc.
    
    -- Knowledge content
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    key_concepts TEXT[],
    
    -- Source and reliability
    source_type VARCHAR(50), -- scientific_study, coaching_experience, user_feedback, performance_data
    source_reference TEXT,
    confidence_level VARCHAR(50) DEFAULT 'high', -- low, medium, high, verified
    
    -- Applicability
    applies_to_positions TEXT[], -- QB, WR, DB, ALL, etc.
    applies_to_skill_levels TEXT[], -- beginner, intermediate, advanced, all
    
    -- Usage tracking
    times_referenced INTEGER DEFAULT 0,
    last_used TIMESTAMP,
    effectiveness_rating DECIMAL(3,2), -- based on user feedback when this knowledge is used
    
    -- Learning and updates
    learned_from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    needs_verification BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Context and memory for AI conversations
CREATE TABLE ai_coach_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_coach_profile_id UUID NOT NULL REFERENCES ai_coach_profiles(id) ON DELETE CASCADE,
    
    -- Context tracking
    context_type VARCHAR(50) NOT NULL, -- user_preference, performance_pattern, goal_progress, concern_area
    context_key VARCHAR(255) NOT NULL, -- specific identifier for this context
    context_value JSONB NOT NULL, -- the actual context data
    
    -- Importance and persistence
    importance_level VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
    should_persist BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    
    -- Usage in conversations
    times_referenced INTEGER DEFAULT 0,
    last_referenced TIMESTAMP,
    
    -- Learning source
    learned_from_conversation_id UUID REFERENCES ai_chat_conversations(id) ON DELETE SET NULL,
    learned_from_data_analysis BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled and proactive AI coach interactions
CREATE TABLE ai_coach_scheduled_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_coach_profile_id UUID NOT NULL REFERENCES ai_coach_profiles(id) ON DELETE CASCADE,
    
    -- Scheduling
    interaction_type VARCHAR(50) NOT NULL, -- weekly_checkin, pre_training_motivation, post_training_review, nutrition_reminder
    scheduled_for TIMESTAMP NOT NULL,
    
    -- Trigger conditions
    trigger_conditions JSONB, -- conditions that must be met for this interaction
    
    -- Interaction content template
    message_template TEXT,
    personalization_data JSONB,
    
    -- Execution tracking
    executed BOOLEAN DEFAULT false,
    executed_at TIMESTAMP,
    conversation_id UUID REFERENCES ai_chat_conversations(id) ON DELETE SET NULL,
    
    -- User response
    user_responded BOOLEAN DEFAULT false,
    user_response_sentiment VARCHAR(50), -- positive, neutral, negative, no_response
    
    -- Effectiveness
    achieved_goal BOOLEAN,
    user_engagement_score INTEGER CHECK (user_engagement_score BETWEEN 1 AND 10),
    
    -- Rescheduling
    rescheduled_from UUID REFERENCES ai_coach_scheduled_interactions(id) ON DELETE SET NULL,
    reschedule_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI coach performance analytics
CREATE TABLE ai_coach_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_coach_profile_id UUID NOT NULL REFERENCES ai_coach_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for aggregate analytics
    
    -- Time period
    analytics_date DATE NOT NULL,
    period_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly
    
    -- Conversation metrics
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    avg_conversation_length_minutes DECIMAL(6,2),
    avg_response_time_seconds DECIMAL(6,2),
    
    -- User engagement
    user_initiated_conversations INTEGER DEFAULT 0,
    ai_initiated_conversations INTEGER DEFAULT 0,
    user_satisfaction_avg DECIMAL(3,2),
    response_rate DECIMAL(3,2), -- percentage of AI messages that got user responses
    
    -- Effectiveness metrics
    goals_achieved INTEGER DEFAULT 0,
    recommendations_followed INTEGER DEFAULT 0,
    positive_feedback_count INTEGER DEFAULT 0,
    negative_feedback_count INTEGER DEFAULT 0,
    
    -- Knowledge utilization
    unique_knowledge_items_used INTEGER DEFAULT 0,
    most_referenced_topics TEXT[],
    
    -- Performance impact
    user_training_improvement_correlation DECIMAL(3,2),
    user_engagement_improvement DECIMAL(3,2),
    
    -- Technical performance
    avg_tokens_per_message DECIMAL(6,2),
    total_cost_usd DECIMAL(10,4),
    error_rate DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_ai_coach_profiles_team ON ai_coach_profiles(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_ai_coach_profiles_active ON ai_coach_profiles(is_active) WHERE is_active = true;

CREATE INDEX idx_user_ai_coach_preferences_user ON user_ai_coach_preferences(user_id);

CREATE INDEX idx_ai_chat_conversations_user ON ai_chat_conversations(user_id, started_at);
CREATE INDEX idx_ai_chat_conversations_coach ON ai_chat_conversations(ai_coach_profile_id, started_at);
CREATE INDEX idx_ai_chat_conversations_active ON ai_chat_conversations(user_id, ended_at) WHERE ended_at IS NULL;

CREATE INDEX idx_ai_chat_messages_conversation ON ai_chat_messages(conversation_id, message_index);
CREATE INDEX idx_ai_chat_messages_timestamp ON ai_chat_messages(timestamp);

CREATE INDEX idx_ai_coach_knowledge_type_category ON ai_coach_knowledge(knowledge_type, category);
CREATE INDEX idx_ai_coach_knowledge_coach ON ai_coach_knowledge(ai_coach_profile_id);

CREATE INDEX idx_ai_coach_context_user ON ai_coach_context(user_id, context_type);
CREATE INDEX idx_ai_coach_context_expires ON ai_coach_context(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_ai_coach_scheduled_pending ON ai_coach_scheduled_interactions(user_id, scheduled_for) WHERE executed = false;

CREATE INDEX idx_ai_coach_analytics_date ON ai_coach_analytics(analytics_date, period_type);

-- Note: TimescaleDB hypertables commented out for standard PostgreSQL
-- SELECT create_hypertable('ai_chat_conversations', 'started_at');
-- SELECT create_hypertable('ai_chat_messages', 'timestamp');
-- SELECT create_hypertable('ai_coach_analytics', 'analytics_date');

-- Add unique constraints
ALTER TABLE user_ai_coach_preferences 
ADD CONSTRAINT unique_user_coach_preference 
UNIQUE (user_id, ai_coach_profile_id);

ALTER TABLE ai_coach_context 
ADD CONSTRAINT unique_user_coach_context_key 
UNIQUE (user_id, ai_coach_profile_id, context_key);

-- Add update triggers
CREATE TRIGGER update_ai_coach_profiles_updated_at
    BEFORE UPDATE ON ai_coach_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ai_coach_preferences_updated_at
    BEFORE UPDATE ON user_ai_coach_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_chat_conversations_updated_at
    BEFORE UPDATE ON ai_chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_coach_knowledge_updated_at
    BEFORE UPDATE ON ai_coach_knowledge
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_coach_context_updated_at
    BEFORE UPDATE ON ai_coach_context
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_coach_scheduled_interactions_updated_at
    BEFORE UPDATE ON ai_coach_scheduled_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();