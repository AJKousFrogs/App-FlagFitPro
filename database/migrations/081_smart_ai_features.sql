-- =============================================================================
-- SMART AI FEATURES - Comprehensive Intelligence Upgrade
-- 
-- Features:
-- 1. Semantic search with pgvector embeddings
-- 2. RAG (Retrieval-Augmented Generation) support
-- 3. Intent confidence routing
-- 4. Multi-turn conversation memory with summarization
-- 5. Proactive follow-up system
-- 6. Feedback learning loop
-- =============================================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- 1. SEMANTIC SEARCH WITH EMBEDDINGS
-- =============================================================================

-- Add embedding column to knowledge_base_entries
ALTER TABLE knowledge_base_entries
ADD COLUMN IF NOT EXISTS content_embedding vector(1536),
ADD COLUMN IF NOT EXISTS title VARCHAR(500),
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'curated',
ADD COLUMN IF NOT EXISTS evidence_grade VARCHAR(10) DEFAULT 'C',
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'low',
ADD COLUMN IF NOT EXISTS requires_professional BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_quality_score DECIMAL(3,2) DEFAULT 0.8,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_recovery_alternative BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS intensity_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS position_relevance TEXT[],
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(50),
ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ;

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_kb_content_embedding 
ON knowledge_base_entries 
USING ivfflat (content_embedding vector_cosine_ops)
WITH (lists = 100);

-- Create semantic search function
CREATE OR REPLACE FUNCTION search_knowledge_semantic(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5,
    filter_category TEXT DEFAULT NULL,
    filter_risk_level TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    content TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    source_type VARCHAR(50),
    evidence_grade VARCHAR(10),
    risk_level VARCHAR(20),
    source_url TEXT,
    source_quality_score DECIMAL(3,2),
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.title,
        kb.content,
        kb.category,
        kb.subcategory,
        kb.source_type,
        kb.evidence_grade,
        kb.risk_level,
        kb.source_url,
        kb.source_quality_score,
        1 - (kb.content_embedding <=> query_embedding) AS similarity
    FROM knowledge_base_entries kb
    WHERE kb.is_active = TRUE
        AND kb.content_embedding IS NOT NULL
        AND (filter_category IS NULL OR kb.category = filter_category)
        AND (filter_risk_level IS NULL OR kb.risk_level = filter_risk_level)
        AND 1 - (kb.content_embedding <=> query_embedding) > match_threshold
    ORDER BY kb.content_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Hybrid search function (combines semantic + keyword)
CREATE OR REPLACE FUNCTION search_knowledge_hybrid(
    query_text TEXT,
    query_embedding vector(1536) DEFAULT NULL,
    match_count INT DEFAULT 5,
    semantic_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    content TEXT,
    category VARCHAR(100),
    evidence_grade VARCHAR(10),
    source_url TEXT,
    combined_score FLOAT,
    semantic_score FLOAT,
    keyword_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH keyword_matches AS (
        SELECT
            kb.id,
            kb.title,
            kb.content,
            kb.category,
            kb.evidence_grade,
            kb.source_url,
            ts_rank(
                to_tsvector('english', COALESCE(kb.title, '') || ' ' || COALESCE(kb.content, '')),
                plainto_tsquery('english', query_text)
            ) AS kw_score
        FROM knowledge_base_entries kb
        WHERE kb.is_active = TRUE
            AND to_tsvector('english', COALESCE(kb.title, '') || ' ' || COALESCE(kb.content, '')) 
                @@ plainto_tsquery('english', query_text)
    ),
    semantic_matches AS (
        SELECT
            kb.id,
            1 - (kb.content_embedding <=> query_embedding) AS sem_score
        FROM knowledge_base_entries kb
        WHERE kb.is_active = TRUE
            AND kb.content_embedding IS NOT NULL
            AND query_embedding IS NOT NULL
    )
    SELECT
        COALESCE(km.id, sm_kb.id) AS id,
        COALESCE(km.title, sm_kb.title) AS title,
        COALESCE(km.content, sm_kb.content) AS content,
        COALESCE(km.category, sm_kb.category) AS category,
        COALESCE(km.evidence_grade, sm_kb.evidence_grade) AS evidence_grade,
        COALESCE(km.source_url, sm_kb.source_url) AS source_url,
        (COALESCE(sm.sem_score, 0) * semantic_weight + COALESCE(km.kw_score, 0) * (1 - semantic_weight)) AS combined_score,
        COALESCE(sm.sem_score, 0) AS semantic_score,
        COALESCE(km.kw_score, 0) AS keyword_score
    FROM keyword_matches km
    FULL OUTER JOIN semantic_matches sm ON km.id = sm.id
    LEFT JOIN knowledge_base_entries sm_kb ON sm.id = sm_kb.id
    WHERE COALESCE(sm.sem_score, 0) > 0.5 OR COALESCE(km.kw_score, 0) > 0
    ORDER BY combined_score DESC
    LIMIT match_count;
END;
$$;

-- =============================================================================
-- 2. INTENT CONFIDENCE ROUTING
-- =============================================================================

-- Store intent classifications with confidence for learning
CREATE TABLE IF NOT EXISTS intent_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES ai_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Classification results
    detected_intent VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(4,3) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
    confidence_level VARCHAR(20) NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
    
    -- Alternative intents considered
    alternative_intents JSONB, -- [{intent: "nutrition", confidence: 0.3}, ...]
    
    -- Routing decision
    routing_action VARCHAR(50) NOT NULL CHECK (routing_action IN ('answer_directly', 'answer_with_confirm', 'ask_clarification', 'escalate')),
    
    -- If clarification was asked
    clarification_asked TEXT,
    clarification_received TEXT,
    final_intent VARCHAR(100),
    
    -- Learning feedback
    was_correct BOOLEAN,
    corrected_by VARCHAR(20) CHECK (corrected_by IN ('user', 'coach', 'system')),
    correction_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intent_class_user ON intent_classifications(user_id);
CREATE INDEX idx_intent_class_intent ON intent_classifications(detected_intent);
CREATE INDEX idx_intent_class_confidence ON intent_classifications(confidence_level);

-- =============================================================================
-- 3. MULTI-TURN CONVERSATION MEMORY WITH SUMMARIZATION
-- =============================================================================

-- Store conversation summaries for long-term memory
CREATE TABLE IF NOT EXISTS conversation_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE SET NULL,
    
    -- Summary content
    summary_text TEXT NOT NULL,
    summary_type VARCHAR(50) NOT NULL CHECK (summary_type IN ('session', 'topic', 'weekly', 'goal')),
    
    -- Key information extracted
    topics_discussed TEXT[],
    goals_mentioned JSONB, -- [{goal: "improve speed", status: "active", mentioned_at: "..."}]
    injuries_mentioned JSONB, -- [{injury: "knee pain", severity: "mild", mentioned_at: "..."}]
    preferences_learned JSONB, -- [{preference: "morning_training", confidence: 0.8}]
    
    -- Embedding for semantic retrieval of past context
    summary_embedding vector(1536),
    
    -- Time range covered
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    message_count INT NOT NULL DEFAULT 0,
    
    -- Relevance tracking
    times_referenced INT DEFAULT 0,
    last_referenced_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conv_summary_user ON conversation_summaries(user_id);
CREATE INDEX idx_conv_summary_type ON conversation_summaries(summary_type);
CREATE INDEX idx_conv_summary_embedding ON conversation_summaries 
    USING ivfflat (summary_embedding vector_cosine_ops) WITH (lists = 50);

-- Function to get relevant conversation context
CREATE OR REPLACE FUNCTION get_relevant_conversation_context(
    p_user_id UUID,
    p_query_embedding vector(1536),
    p_max_results INT DEFAULT 5
)
RETURNS TABLE (
    summary_text TEXT,
    topics TEXT[],
    goals JSONB,
    injuries JSONB,
    relevance_score FLOAT,
    period_start TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.summary_text,
        cs.topics_discussed,
        cs.goals_mentioned,
        cs.injuries_mentioned,
        1 - (cs.summary_embedding <=> p_query_embedding) AS relevance_score,
        cs.period_start
    FROM conversation_summaries cs
    WHERE cs.user_id = p_user_id
        AND cs.summary_embedding IS NOT NULL
    ORDER BY cs.summary_embedding <=> p_query_embedding
    LIMIT p_max_results;
END;
$$;

-- =============================================================================
-- 4. PROACTIVE FOLLOW-UP SYSTEM (Enhanced)
-- =============================================================================

-- Enhance existing ai_followups table
ALTER TABLE ai_followups
ADD COLUMN IF NOT EXISTS trigger_conditions JSONB, -- Conditions that trigger this follow-up
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
ADD COLUMN IF NOT EXISTS followup_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS related_context_id UUID REFERENCES conversation_context(id),
ADD COLUMN IF NOT EXISTS times_shown INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_shown_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_engagement VARCHAR(20) CHECK (user_engagement IN ('engaged', 'dismissed', 'ignored', NULL));

-- Proactive check-ins based on patterns
CREATE TABLE IF NOT EXISTS proactive_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Check-in type
    checkin_type VARCHAR(50) NOT NULL CHECK (checkin_type IN (
        'injury_followup', 'goal_progress', 'training_reminder', 
        'game_prep', 'recovery_check', 'motivation_boost', 'milestone_celebration'
    )),
    
    -- Content
    message_template TEXT NOT NULL,
    personalization_data JSONB, -- Data to fill in the template
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,
    trigger_event VARCHAR(100), -- What triggered this checkin
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'engaged', 'dismissed', 'expired')),
    sent_at TIMESTAMPTZ,
    engaged_at TIMESTAMPTZ,
    
    -- Related data
    related_injury_id UUID,
    related_goal TEXT,
    related_game_id UUID,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proactive_checkins_user ON proactive_checkins(user_id);
CREATE INDEX idx_proactive_checkins_scheduled ON proactive_checkins(scheduled_for) WHERE status = 'pending';

-- Function to generate proactive check-ins
CREATE OR REPLACE FUNCTION generate_proactive_checkins(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    checkins_created INT := 0;
    injury_record RECORD;
    context_record RECORD;
BEGIN
    -- 1. Injury follow-ups (3 days after mention)
    FOR injury_record IN
        SELECT cc.id, cc.context_key, cc.context_summary, cc.created_at
        FROM conversation_context cc
        WHERE cc.user_id = p_user_id
            AND cc.context_type = 'injury'
            AND cc.created_at > NOW() - INTERVAL '7 days'
            AND NOT EXISTS (
                SELECT 1 FROM proactive_checkins pc
                WHERE pc.user_id = p_user_id
                    AND pc.related_injury_id = cc.id
                    AND pc.status IN ('pending', 'sent')
            )
    LOOP
        INSERT INTO proactive_checkins (
            user_id, checkin_type, message_template, personalization_data,
            scheduled_for, trigger_event, related_injury_id
        ) VALUES (
            p_user_id,
            'injury_followup',
            'Hey! You mentioned {injury_type} a few days ago. How''s it feeling now? Any improvement?',
            jsonb_build_object('injury_type', injury_record.context_key),
            injury_record.created_at + INTERVAL '3 days',
            'injury_context_created',
            injury_record.id
        );
        checkins_created := checkins_created + 1;
    END LOOP;

    -- 2. Goal progress check-ins (weekly)
    FOR context_record IN
        SELECT cc.id, cc.context_key, cc.context_summary
        FROM conversation_context cc
        WHERE cc.user_id = p_user_id
            AND cc.context_type = 'goal'
            AND cc.expires_at > NOW()
            AND NOT EXISTS (
                SELECT 1 FROM proactive_checkins pc
                WHERE pc.user_id = p_user_id
                    AND pc.related_goal = cc.context_key
                    AND pc.scheduled_for > NOW() - INTERVAL '5 days'
            )
    LOOP
        INSERT INTO proactive_checkins (
            user_id, checkin_type, message_template, personalization_data,
            scheduled_for, trigger_event, related_goal
        ) VALUES (
            p_user_id,
            'goal_progress',
            'Quick check-in on your goal: {goal}. How''s the progress going? Need any adjustments to your plan?',
            jsonb_build_object('goal', context_record.context_summary),
            NOW() + INTERVAL '7 days',
            'goal_context_active',
            context_record.context_key
        );
        checkins_created := checkins_created + 1;
    END LOOP;

    -- 3. Game prep reminders
    INSERT INTO proactive_checkins (
        user_id, checkin_type, message_template, personalization_data,
        scheduled_for, trigger_event, related_game_id
    )
    SELECT
        p_user_id,
        'game_prep',
        'Game day is {days_until}! Ready to dominate? Here''s a quick pre-game checklist if you need it.',
        jsonb_build_object(
            'days_until', 
            CASE 
                WHEN g.game_date = CURRENT_DATE THEN 'today'
                WHEN g.game_date = CURRENT_DATE + 1 THEN 'tomorrow'
                ELSE 'in ' || (g.game_date - CURRENT_DATE) || ' days'
            END,
            'opponent', g.opponent_team_name
        ),
        (g.game_date - 1)::TIMESTAMPTZ + INTERVAL '18 hours', -- Day before at 6pm
        'upcoming_game',
        g.game_id
    FROM games g
    WHERE g.game_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 3
        AND NOT EXISTS (
            SELECT 1 FROM proactive_checkins pc
            WHERE pc.user_id = p_user_id
                AND pc.related_game_id = g.game_id
        )
    LIMIT 1;

    IF FOUND THEN
        checkins_created := checkins_created + 1;
    END IF;

    RETURN checkins_created;
END;
$$;

-- =============================================================================
-- 5. FEEDBACK LEARNING LOOP
-- =============================================================================

-- Enhanced feedback tracking
ALTER TABLE ai_response_feedback
ADD COLUMN IF NOT EXISTS feedback_details JSONB, -- Detailed feedback structure
ADD COLUMN IF NOT EXISTS knowledge_sources_used UUID[], -- Which KB entries were used
ADD COLUMN IF NOT EXISTS response_quality_score DECIMAL(3,2), -- Computed quality
ADD COLUMN IF NOT EXISTS improvement_suggestions TEXT[],
ADD COLUMN IF NOT EXISTS processed_for_learning BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Knowledge entry performance tracking
CREATE TABLE IF NOT EXISTS knowledge_entry_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES knowledge_base_entries(id) ON DELETE CASCADE,
    
    -- Aggregated metrics
    times_retrieved INT DEFAULT 0,
    times_used_in_response INT DEFAULT 0,
    positive_feedback_count INT DEFAULT 0,
    negative_feedback_count INT DEFAULT 0,
    
    -- Computed scores
    helpfulness_score DECIMAL(4,3) DEFAULT 0.5, -- Rolling average
    retrieval_relevance_score DECIMAL(4,3) DEFAULT 0.5, -- How often retrieved vs used
    
    -- Quality indicators
    avg_similarity_when_retrieved DECIMAL(4,3),
    avg_position_in_results DECIMAL(4,2),
    
    -- Flags
    needs_review BOOLEAN DEFAULT FALSE,
    review_reason TEXT,
    last_reviewed_at TIMESTAMPTZ,
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_kb_performance_entry ON knowledge_entry_performance(entry_id);

-- Function to update knowledge entry performance from feedback
CREATE OR REPLACE FUNCTION update_knowledge_performance_from_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update performance for each knowledge source used
    IF NEW.knowledge_sources_used IS NOT NULL THEN
        UPDATE knowledge_entry_performance kep
        SET
            times_used_in_response = times_used_in_response + 1,
            positive_feedback_count = positive_feedback_count + CASE WHEN NEW.was_helpful THEN 1 ELSE 0 END,
            negative_feedback_count = negative_feedback_count + CASE WHEN NOT NEW.was_helpful THEN 1 ELSE 0 END,
            helpfulness_score = (
                (helpfulness_score * (positive_feedback_count + negative_feedback_count) + 
                 CASE WHEN NEW.was_helpful THEN 1.0 ELSE 0.0 END) /
                (positive_feedback_count + negative_feedback_count + 1)
            ),
            needs_review = CASE 
                WHEN negative_feedback_count > 3 AND helpfulness_score < 0.4 THEN TRUE 
                ELSE needs_review 
            END,
            review_reason = CASE
                WHEN negative_feedback_count > 3 AND helpfulness_score < 0.4 
                THEN 'High negative feedback rate'
                ELSE review_reason
            END,
            updated_at = NOW()
        WHERE kep.entry_id = ANY(NEW.knowledge_sources_used);
        
        -- Insert performance records for new entries
        INSERT INTO knowledge_entry_performance (entry_id, times_used_in_response, positive_feedback_count, negative_feedback_count)
        SELECT 
            unnest(NEW.knowledge_sources_used),
            1,
            CASE WHEN NEW.was_helpful THEN 1 ELSE 0 END,
            CASE WHEN NOT NEW.was_helpful THEN 1 ELSE 0 END
        ON CONFLICT (entry_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_kb_performance
AFTER INSERT ON ai_response_feedback
FOR EACH ROW
EXECUTE FUNCTION update_knowledge_performance_from_feedback();

-- User preference learning from interactions
CREATE TABLE IF NOT EXISTS learned_user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Preference type
    preference_type VARCHAR(50) NOT NULL CHECK (preference_type IN (
        'response_length', 'detail_level', 'tone', 'topic_interest',
        'learning_style', 'time_preference', 'communication_style'
    )),
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    
    -- Confidence in this preference
    confidence_score DECIMAL(4,3) NOT NULL DEFAULT 0.5,
    evidence_count INT NOT NULL DEFAULT 1, -- How many interactions support this
    
    -- Source of learning
    learned_from VARCHAR(50) NOT NULL CHECK (learned_from IN (
        'explicit_feedback', 'implicit_behavior', 'stated_preference', 'inferred'
    )),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, preference_type, preference_key)
);

CREATE INDEX idx_learned_prefs_user ON learned_user_preferences(user_id);

-- Function to learn preferences from interaction patterns
CREATE OR REPLACE FUNCTION learn_user_preferences(
    p_user_id UUID,
    p_interaction_data JSONB
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    preferences_updated INT := 0;
BEGIN
    -- Learn response length preference
    IF p_interaction_data ? 'response_was_helpful' AND p_interaction_data ? 'response_length' THEN
        INSERT INTO learned_user_preferences (
            user_id, preference_type, preference_key, preference_value,
            confidence_score, evidence_count, learned_from
        ) VALUES (
            p_user_id,
            'response_length',
            CASE 
                WHEN (p_interaction_data->>'response_length')::INT < 200 THEN 'brief'
                WHEN (p_interaction_data->>'response_length')::INT > 500 THEN 'detailed'
                ELSE 'moderate'
            END,
            jsonb_build_object('preferred_length', p_interaction_data->>'response_length'),
            CASE WHEN (p_interaction_data->>'response_was_helpful')::BOOLEAN THEN 0.6 ELSE 0.4 END,
            1,
            'implicit_behavior'
        )
        ON CONFLICT (user_id, preference_type, preference_key) DO UPDATE SET
            confidence_score = (
                learned_user_preferences.confidence_score * learned_user_preferences.evidence_count +
                CASE WHEN (p_interaction_data->>'response_was_helpful')::BOOLEAN THEN 0.7 ELSE 0.3 END
            ) / (learned_user_preferences.evidence_count + 1),
            evidence_count = learned_user_preferences.evidence_count + 1,
            updated_at = NOW();
        
        preferences_updated := preferences_updated + 1;
    END IF;

    -- Learn topic interests
    IF p_interaction_data ? 'topic' THEN
        INSERT INTO learned_user_preferences (
            user_id, preference_type, preference_key, preference_value,
            confidence_score, evidence_count, learned_from
        ) VALUES (
            p_user_id,
            'topic_interest',
            p_interaction_data->>'topic',
            jsonb_build_object('interest_level', 'high'),
            0.6,
            1,
            'implicit_behavior'
        )
        ON CONFLICT (user_id, preference_type, preference_key) DO UPDATE SET
            evidence_count = learned_user_preferences.evidence_count + 1,
            confidence_score = LEAST(0.95, learned_user_preferences.confidence_score + 0.05),
            updated_at = NOW();
        
        preferences_updated := preferences_updated + 1;
    END IF;

    RETURN preferences_updated;
END;
$$;

-- =============================================================================
-- 6. SMART QUERY UNDERSTANDING
-- =============================================================================

-- Query understanding cache (for common queries)
CREATE TABLE IF NOT EXISTS query_understanding_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Query identification
    query_hash VARCHAR(64) NOT NULL, -- Hash of normalized query
    query_normalized TEXT NOT NULL, -- Lowercase, trimmed query
    
    -- Understanding results
    detected_intent VARCHAR(100) NOT NULL,
    confidence DECIMAL(4,3) NOT NULL,
    entities JSONB, -- Extracted entities {injury: "knee", timeframe: "3 days"}
    query_type VARCHAR(50), -- question, request, statement, clarification
    
    -- Semantic info
    query_embedding vector(1536),
    
    -- Usage tracking
    hit_count INT DEFAULT 1,
    last_hit_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Quality
    avg_response_helpfulness DECIMAL(4,3),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_query_cache_hash ON query_understanding_cache(query_hash);
CREATE INDEX idx_query_cache_intent ON query_understanding_cache(detected_intent);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE intent_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entry_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_understanding_cache ENABLE ROW LEVEL SECURITY;

-- Users can see their own data
CREATE POLICY "Users view own intent classifications"
ON intent_classifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users view own conversation summaries"
ON conversation_summaries FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users view own proactive checkins"
ON proactive_checkins FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users view own learned preferences"
ON learned_user_preferences FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role can manage all
CREATE POLICY "Service manages intent classifications"
ON intent_classifications FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service manages conversation summaries"
ON conversation_summaries FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service manages proactive checkins"
ON proactive_checkins FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service manages knowledge performance"
ON knowledge_entry_performance FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service manages learned preferences"
ON learned_user_preferences FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service manages query cache"
ON query_understanding_cache FOR ALL
TO service_role
USING (true);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE intent_classifications IS 'Tracks intent classification with confidence for learning and routing';
COMMENT ON TABLE conversation_summaries IS 'Summarized conversation history for long-term memory';
COMMENT ON TABLE proactive_checkins IS 'Scheduled proactive check-ins based on user context';
COMMENT ON TABLE knowledge_entry_performance IS 'Tracks how well each knowledge entry performs in responses';
COMMENT ON TABLE learned_user_preferences IS 'Preferences learned from user interactions';
COMMENT ON TABLE query_understanding_cache IS 'Cache of query understanding for common questions';

COMMENT ON FUNCTION search_knowledge_semantic IS 'Semantic similarity search using vector embeddings';
COMMENT ON FUNCTION search_knowledge_hybrid IS 'Combined semantic + keyword search';
COMMENT ON FUNCTION get_relevant_conversation_context IS 'Retrieves relevant past conversation context';
COMMENT ON FUNCTION generate_proactive_checkins IS 'Creates proactive check-ins based on user context';
COMMENT ON FUNCTION learn_user_preferences IS 'Updates learned preferences from interaction data';
