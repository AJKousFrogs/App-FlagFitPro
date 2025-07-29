-- =============================================================================
-- AI COACHES & SPORT PSYCHOLOGY SYSTEM - Migration 011
-- Based on research from leading sport psychology institutions
-- Integrates mental training, performance psychology, and AI coaching methodologies
-- =============================================================================

-- =============================================================================
-- COACH PROFILES AND EXPERTISE
-- =============================================================================

-- AI Coach profiles with specializations and credentials
CREATE TABLE IF NOT EXISTS ai_coaches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100) NOT NULL, -- 'performance_psychology', 'mental_toughness', 'anxiety_management', 'motivation', 'focus_concentration'
    coaching_style VARCHAR(100), -- 'supportive', 'challenging', 'analytical', 'motivational', 'calming'
    
    -- Credentials and background (simulated based on real institutions)
    education_background TEXT[], -- Universities and degrees
    certifications TEXT[], -- Professional certifications
    research_affiliations TEXT[], -- Affiliated institutions
    years_experience INTEGER,
    
    -- Expertise areas
    primary_expertise TEXT[], -- Main areas of focus
    secondary_expertise TEXT[], -- Supporting areas
    sport_specializations TEXT[], -- Specific sports knowledge
    athlete_level_focus TEXT[], -- 'youth', 'high_school', 'collegiate', 'professional', 'olympic'
    
    -- Coaching philosophy and approach
    coaching_philosophy TEXT,
    methodology_description TEXT,
    preferred_techniques TEXT[],
    evidence_based_approaches TEXT[],
    
    -- AI personality traits
    communication_style VARCHAR(100), -- 'direct', 'encouraging', 'analytical', 'empathetic'
    personality_traits TEXT[], -- 'patient', 'energetic', 'methodical', 'intuitive'
    
    -- Performance metrics
    success_rate_percentage DECIMAL(5,2),
    client_satisfaction_rating DECIMAL(3,2), -- 1-10 scale
    specialization_effectiveness JSONB, -- {area: effectiveness_rating}
    
    -- Language and cultural competency
    languages_spoken TEXT[],
    cultural_competencies TEXT[],
    
    -- Research and publication background
    publications_count INTEGER,
    research_contributions TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SPORT PSYCHOLOGY RESEARCH AND TECHNIQUES
-- =============================================================================

-- Mental training techniques and interventions
CREATE TABLE IF NOT EXISTS mental_training_techniques (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'visualization', 'goal_setting', 'self_talk', 'relaxation', 'concentration', 'confidence_building'
    subcategory VARCHAR(100),
    
    -- Technique description and implementation
    description TEXT,
    detailed_instructions TEXT,
    session_duration_minutes INTEGER,
    frequency_recommendations TEXT,
    
    -- Learning requirements
    skill_level_required VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
    learning_curve_sessions INTEGER,
    practice_requirements TEXT,
    
    -- Research foundation
    research_evidence_level VARCHAR(50), -- 'strong', 'moderate', 'emerging', 'theoretical'
    key_research_findings TEXT[],
    meta_analysis_effect_size DECIMAL(4,3), -- Effect size from meta-analyses
    
    -- Applications and benefits
    performance_benefits TEXT[],
    psychological_benefits TEXT[],
    physiological_benefits TEXT[],
    target_issues TEXT[], -- What problems this technique addresses
    
    -- Implementation context
    optimal_timing VARCHAR(100), -- 'pre_competition', 'during_competition', 'post_competition', 'training', 'daily'
    equipment_needed TEXT[],
    environment_requirements TEXT[],
    
    -- Effectiveness factors
    individual_differences_impact TEXT[],
    contraindications TEXT[],
    potential_barriers TEXT[],
    
    -- Integration with other techniques
    synergistic_techniques TEXT[], -- Other techniques that work well together
    complementary_approaches TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- MENTAL TOUGHNESS AND RESILIENCE PROTOCOLS
-- =============================================================================

-- Mental toughness development programs
CREATE TABLE IF NOT EXISTS mental_toughness_protocols (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Protocol structure
    total_duration_weeks INTEGER,
    sessions_per_week INTEGER,
    session_duration_minutes INTEGER,
    
    -- Core components (based on elite athlete research)
    focus_areas TEXT[], -- 'staying_present', 'positive_self_talk', 'visualization', 'goal_setting', 'flow_state'
    progressive_challenges TEXT[],
    skill_building_sequence TEXT[],
    
    -- Research foundation (based on elite athlete strategies)
    evidence_base TEXT[],
    success_metrics TEXT[],
    validation_studies TEXT[],
    
    -- Week-by-week breakdown
    weekly_focus JSONB, -- {week: focus_area, techniques, goals}
    milestone_assessments JSONB, -- {week: assessment_criteria}
    
    -- Personalization factors
    athlete_level_adaptations TEXT[],
    sport_specific_modifications TEXT[],
    personality_based_adjustments TEXT[],
    
    -- Expected outcomes
    confidence_improvement_expected INTEGER, -- 1-10 scale improvement
    stress_management_improvement INTEGER,
    focus_improvement INTEGER,
    resilience_improvement INTEGER,
    
    -- Supporting materials
    homework_assignments TEXT[],
    practice_exercises TEXT[],
    monitoring_tools TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PSYCHOLOGICAL ASSESSMENT AND PROFILING
-- =============================================================================

-- Psychological assessment tools and questionnaires
CREATE TABLE IF NOT EXISTS psychological_assessments (
    id SERIAL PRIMARY KEY,
    assessment_name VARCHAR(255) NOT NULL,
    assessment_type VARCHAR(100), -- 'personality', 'motivation', 'anxiety', 'confidence', 'mental_toughness', 'flow_state'
    
    -- Assessment details
    description TEXT,
    number_of_questions INTEGER,
    estimated_completion_time_minutes INTEGER,
    
    -- Validity and reliability
    reliability_coefficient DECIMAL(4,3), -- Cronbach's alpha or similar
    validity_evidence TEXT[],
    normative_data_available BOOLEAN DEFAULT FALSE,
    
    -- Scoring and interpretation
    scoring_method TEXT,
    score_ranges JSONB, -- {range: interpretation}
    interpretation_guidelines TEXT,
    
    -- Research background
    development_institution VARCHAR(255),
    validation_studies TEXT[],
    populations_validated_on TEXT[],
    
    -- Administration requirements
    administrator_qualifications TEXT[],
    supervision_required BOOLEAN DEFAULT FALSE,
    
    -- Questions and structure
    question_categories JSONB, -- {category: question_count}
    response_format VARCHAR(100), -- 'likert_scale', 'yes_no', 'multiple_choice', 'free_text'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment questions
CREATE TABLE IF NOT EXISTS assessment_questions (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES psychological_assessments(id) ON DELETE CASCADE,
    question_number INTEGER,
    question_text TEXT NOT NULL,
    question_category VARCHAR(100),
    
    -- Response options
    response_type VARCHAR(50), -- 'likert_5', 'likert_7', 'yes_no', 'multiple_choice'
    response_options JSONB, -- For multiple choice questions
    
    -- Scoring
    scoring_key JSONB, -- {response: points}
    reverse_scored BOOLEAN DEFAULT FALSE,
    weight_factor DECIMAL(4,3) DEFAULT 1.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ATHLETE PSYCHOLOGICAL PROFILES
-- =============================================================================

-- Individual athlete psychological profiles
CREATE TABLE IF NOT EXISTS athlete_psychological_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Personality assessment results
    personality_type VARCHAR(100), -- Based on validated sports psychology assessments
    primary_motivators TEXT[],
    stress_response_patterns TEXT[],
    communication_preferences TEXT[],
    
    -- Mental skills assessment
    current_mental_toughness_score INTEGER, -- 1-100 scale
    confidence_level INTEGER, -- 1-10 scale
    anxiety_management_ability INTEGER, -- 1-10 scale
    focus_concentration_ability INTEGER, -- 1-10 scale
    goal_orientation_strength INTEGER, -- 1-10 scale
    
    -- Performance psychology factors
    optimal_arousal_level VARCHAR(50), -- 'low', 'moderate', 'high'
    preferred_feedback_style VARCHAR(100), -- 'detailed', 'brief', 'positive_focused', 'constructive'
    motivation_sources TEXT[], -- 'intrinsic', 'achievement', 'social', 'external_rewards'
    competitive_anxiety_level VARCHAR(50), -- 'low', 'moderate', 'high'
    
    -- Coping strategies and preferences
    preferred_coping_strategies TEXT[],
    effective_self_talk_patterns TEXT[],
    visualization_ability INTEGER, -- 1-10 scale
    relaxation_technique_preferences TEXT[],
    
    -- Goals and development areas
    mental_training_goals TEXT[],
    priority_development_areas TEXT[],
    psychological_barriers TEXT[],
    
    -- Historical factors
    previous_mental_training_experience BOOLEAN DEFAULT FALSE,
    significant_psychological_events TEXT[],
    support_system_strength INTEGER, -- 1-10 scale
    
    -- Assigned coaching approach
    recommended_coaching_style VARCHAR(100),
    assigned_ai_coach_id INTEGER REFERENCES ai_coaches(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COACHING SESSIONS AND INTERACTIONS
-- =============================================================================

-- AI coaching sessions and conversations
CREATE TABLE IF NOT EXISTS coaching_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    ai_coach_id INTEGER REFERENCES ai_coaches(id),
    session_date DATE NOT NULL,
    session_time TIME,
    
    -- Session context
    session_type VARCHAR(100), -- 'regular_check_in', 'pre_competition', 'post_competition', 'crisis_intervention', 'skill_development'
    trigger_event VARCHAR(100), -- What prompted this session
    athlete_initiated BOOLEAN DEFAULT FALSE,
    
    -- Pre-session state
    athlete_mood_pre INTEGER, -- 1-10 scale
    stress_level_pre INTEGER, -- 1-10 scale
    confidence_level_pre INTEGER, -- 1-10 scale
    motivation_level_pre INTEGER, -- 1-10 scale
    specific_concerns TEXT[],
    
    -- Session content and techniques used
    primary_focus_area VARCHAR(100),
    techniques_employed TEXT[],
    exercises_assigned TEXT[],
    homework_given TEXT[],
    
    -- Conversation flow and key insights
    key_discussion_points TEXT[],
    breakthrough_moments TEXT[],
    resistance_encountered TEXT[],
    coach_observations TEXT[],
    
    -- Post-session outcomes
    athlete_mood_post INTEGER, -- 1-10 scale
    stress_level_post INTEGER, -- 1-10 scale
    confidence_level_post INTEGER, -- 1-10 scale
    clarity_achieved INTEGER, -- 1-10 scale
    
    -- Session effectiveness
    athlete_satisfaction_rating INTEGER, -- 1-10 scale
    coach_effectiveness_rating INTEGER, -- 1-10 scale (self-assessment)
    goals_achieved TEXT[],
    follow_up_needed BOOLEAN DEFAULT FALSE,
    
    -- Action items and next steps
    immediate_action_items TEXT[],
    practice_assignments TEXT[],
    next_session_focus TEXT,
    
    -- Duration and engagement
    session_duration_minutes INTEGER,
    athlete_engagement_level INTEGER, -- 1-10 scale
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- MENTAL TRAINING PROGRESS TRACKING
-- =============================================================================

-- Mental skills development tracking
CREATE TABLE IF NOT EXISTS mental_skills_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    skill_category VARCHAR(100), -- 'confidence', 'focus', 'anxiety_management', 'motivation', 'goal_setting'
    
    -- Progress measurements
    assessment_date DATE NOT NULL,
    skill_level_rating INTEGER, -- 1-10 scale
    improvement_from_baseline DECIMAL(5,2), -- Percentage improvement
    consistency_rating INTEGER, -- 1-10 scale (how consistently they apply the skill)
    
    -- Specific skill metrics
    technique_proficiency JSONB, -- {technique: proficiency_level}
    application_success_rate DECIMAL(5,2), -- Success rate in applying skills during performance
    transfer_to_competition INTEGER, -- 1-10 scale (how well skills transfer to actual competition)
    
    -- Evidence of progress
    observable_behaviors TEXT[],
    performance_improvements TEXT[],
    feedback_from_others TEXT[],
    self_reported_changes TEXT[],
    
    -- Challenges and barriers
    current_challenges TEXT[],
    barriers_to_progress TEXT[],
    support_needed TEXT[],
    
    -- Goals and targets
    next_milestone_goal TEXT,
    target_achievement_date DATE,
    success_metrics TEXT[],
    
    -- Context factors
    recent_performances JSONB, -- {event: performance_rating, mental_factor_impact}
    life_stress_factors TEXT[],
    environmental_influences TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE PSYCHOLOGY CORRELATIONS
-- =============================================================================

-- Mental factors impact on athletic performance
CREATE TABLE IF NOT EXISTS mental_performance_correlations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    analysis_period_start DATE,
    analysis_period_end DATE,
    
    -- Mental state variables
    average_confidence_level DECIMAL(4,2),
    average_anxiety_level DECIMAL(4,2),
    average_motivation_level DECIMAL(4,2),
    average_focus_quality DECIMAL(4,2),
    mental_training_compliance_rate DECIMAL(5,2),
    
    -- Performance variables
    performance_ratings_average DECIMAL(4,2), -- 1-10 scale
    consistency_rating DECIMAL(4,2), -- How consistent performance was
    peak_performance_frequency INTEGER, -- Number of peak performances
    choking_incidents INTEGER, -- Number of underperformances due to mental factors
    
    -- Correlation analysis results
    confidence_performance_correlation DECIMAL(5,3), -- -1 to 1
    anxiety_performance_correlation DECIMAL(5,3),
    motivation_performance_correlation DECIMAL(5,3),
    focus_performance_correlation DECIMAL(5,3),
    
    -- Situational factors
    pressure_situation_performance DECIMAL(4,2), -- Performance under pressure
    routine_situation_performance DECIMAL(4,2), -- Performance in low-pressure situations
    team_vs_individual_performance JSONB, -- {situation: performance_rating}
    
    -- Key insights and patterns
    strongest_mental_predictors TEXT[], -- Which mental factors best predict performance
    weakest_areas TEXT[], -- Areas needing most attention
    optimal_mental_state_description TEXT,
    performance_improvement_recommendations TEXT[],
    
    -- Trend analysis
    mental_development_trend VARCHAR(50), -- 'improving', 'stable', 'declining'
    performance_trend VARCHAR(50), -- 'improving', 'stable', 'declining'
    correlation_trend VARCHAR(50), -- 'strengthening', 'stable', 'weakening'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SPORT PSYCHOLOGY RESEARCH DATABASE
-- =============================================================================

-- Research studies and evidence base for sport psychology interventions
CREATE TABLE IF NOT EXISTS sport_psychology_research (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    authors TEXT[],
    journal VARCHAR(255),
    publication_year INTEGER,
    doi VARCHAR(255),
    pmid INTEGER,
    
    -- Study characteristics
    study_type VARCHAR(100), -- 'experimental', 'correlational', 'meta_analysis', 'systematic_review', 'case_study'
    methodology VARCHAR(100), -- 'randomized_controlled_trial', 'quasi_experimental', 'longitudinal', 'cross_sectional'
    sample_size INTEGER,
    population_description TEXT,
    
    -- Research focus
    primary_intervention VARCHAR(100), -- Main psychological intervention studied
    secondary_interventions TEXT[],
    outcome_measures TEXT[],
    psychological_constructs TEXT[], -- What psychological factors were measured
    
    -- Results and findings
    primary_findings TEXT,
    effect_sizes JSONB, -- {outcome: effect_size}
    statistical_significance_results TEXT[],
    practical_significance_assessment TEXT,
    
    -- Quality assessment
    study_quality_rating VARCHAR(50), -- 'high', 'moderate', 'low'
    limitations TEXT[],
    bias_assessment TEXT[],
    ecological_validity VARCHAR(50), -- How well results apply to real-world settings
    
    -- Practical applications
    clinical_applications TEXT[],
    coaching_applications TEXT[],
    athlete_development_implications TEXT[],
    
    -- Institutional information
    lead_institution VARCHAR(255),
    institution_ranking INTEGER, -- Based on sport psychology program rankings
    research_lab VARCHAR(255),
    funding_source VARCHAR(255),
    
    -- Follow-up and citations
    follow_up_studies TEXT[],
    citation_count INTEGER,
    influential_citations TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- AI COACHING ALGORITHMS AND DECISION TREES
-- =============================================================================

-- AI coaching decision trees and algorithms
CREATE TABLE IF NOT EXISTS coaching_decision_trees (
    id SERIAL PRIMARY KEY,
    ai_coach_id INTEGER REFERENCES ai_coaches(id),
    decision_tree_name VARCHAR(255) NOT NULL,
    scenario_type VARCHAR(100), -- 'pre_competition_anxiety', 'motivation_decline', 'confidence_issues', 'focus_problems'
    
    -- Decision tree structure
    tree_structure JSONB, -- Nested JSON representing the decision tree
    decision_criteria JSONB, -- Criteria for each decision point
    intervention_mappings JSONB, -- What interventions to suggest based on paths
    
    -- Validation and effectiveness
    validation_data JSONB, -- Historical data used to train/validate the tree
    success_rate DECIMAL(5,2), -- How often this decision tree leads to positive outcomes
    confidence_threshold DECIMAL(3,2), -- Minimum confidence required to use this tree
    
    -- Usage tracking
    times_used INTEGER DEFAULT 0,
    successful_outcomes INTEGER DEFAULT 0,
    athlete_satisfaction_avg DECIMAL(3,2),
    
    -- Continuous learning
    learning_data JSONB, -- Data collected from usage to improve the tree
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version_number DECIMAL(4,2) DEFAULT 1.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- AI coaches indexes
CREATE INDEX IF NOT EXISTS idx_ai_coaches_specialization ON ai_coaches(specialization);
CREATE INDEX IF NOT EXISTS idx_ai_coaches_style ON ai_coaches(coaching_style);
CREATE INDEX IF NOT EXISTS idx_ai_coaches_success_rate ON ai_coaches(success_rate_percentage);

-- Mental training techniques indexes
CREATE INDEX IF NOT EXISTS idx_mental_techniques_category ON mental_training_techniques(category);
CREATE INDEX IF NOT EXISTS idx_mental_techniques_evidence ON mental_training_techniques(research_evidence_level);

-- Coaching sessions indexes
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_user_date ON coaching_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach ON coaching_sessions(ai_coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_type ON coaching_sessions(session_type);

-- Athlete profiles indexes
CREATE INDEX IF NOT EXISTS idx_athlete_psychological_profiles_user ON athlete_psychological_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_athlete_psychological_profiles_coach ON athlete_psychological_profiles(assigned_ai_coach_id);

-- Mental skills progress indexes
CREATE INDEX IF NOT EXISTS idx_mental_skills_progress_user_skill ON mental_skills_progress(user_id, skill_category);
CREATE INDEX IF NOT EXISTS idx_mental_skills_progress_date ON mental_skills_progress(assessment_date);

-- Performance correlations indexes
CREATE INDEX IF NOT EXISTS idx_mental_performance_correlations_user ON mental_performance_correlations(user_id);
CREATE INDEX IF NOT EXISTS idx_mental_performance_correlations_period ON mental_performance_correlations(analysis_period_start, analysis_period_end);

-- Research indexes
CREATE INDEX IF NOT EXISTS idx_sport_psychology_research_year ON sport_psychology_research(publication_year);
CREATE INDEX IF NOT EXISTS idx_sport_psychology_research_intervention ON sport_psychology_research(primary_intervention);
CREATE INDEX IF NOT EXISTS idx_sport_psychology_research_quality ON sport_psychology_research(study_quality_rating);

-- =============================================================================
-- MATERIALIZED VIEWS FOR AI COACHING ANALYTICS
-- =============================================================================

-- Coach effectiveness summary
CREATE MATERIALIZED VIEW IF NOT EXISTS coach_effectiveness_summary AS
SELECT 
    ac.id as coach_id,
    ac.name as coach_name,
    ac.specialization,
    COUNT(cs.id) as total_sessions,
    COUNT(DISTINCT cs.user_id) as unique_athletes,
    AVG(cs.athlete_satisfaction_rating) as avg_satisfaction,
    AVG(cs.coach_effectiveness_rating) as avg_effectiveness,
    AVG(cs.athlete_mood_post - cs.athlete_mood_pre) as avg_mood_improvement,
    AVG(cs.confidence_level_post - cs.confidence_level_pre) as avg_confidence_improvement,
    COUNT(CASE WHEN cs.follow_up_needed = false THEN 1 END)::FLOAT / COUNT(cs.id) * 100 as resolution_rate
FROM ai_coaches ac
LEFT JOIN coaching_sessions cs ON ac.id = cs.ai_coach_id
WHERE cs.session_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY ac.id, ac.name, ac.specialization;

CREATE UNIQUE INDEX IF NOT EXISTS idx_coach_effectiveness_coach_id 
ON coach_effectiveness_summary(coach_id);

-- Mental skills development summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mental_skills_development_summary AS
SELECT 
    user_id,
    skill_category,
    COUNT(*) as assessment_count,
    MIN(skill_level_rating) as initial_rating,
    MAX(skill_level_rating) as current_rating,
    MAX(skill_level_rating) - MIN(skill_level_rating) as total_improvement,
    AVG(improvement_from_baseline) as avg_improvement_rate,
    MAX(assessment_date) as last_assessment_date,
    AVG(consistency_rating) as avg_consistency,
    AVG(transfer_to_competition) as avg_transfer_to_competition
FROM mental_skills_progress
WHERE assessment_date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY user_id, skill_category;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mental_skills_development_user_skill 
ON mental_skills_development_summary(user_id, skill_category);

-- Intervention effectiveness summary
CREATE MATERIALIZED VIEW IF NOT EXISTS intervention_effectiveness_summary AS
SELECT 
    UNNEST(techniques_employed) as technique,
    COUNT(*) as usage_count,
    AVG(athlete_satisfaction_rating) as avg_satisfaction,
    AVG(athlete_mood_post - athlete_mood_pre) as avg_mood_impact,
    AVG(confidence_level_post - confidence_level_pre) as avg_confidence_impact,
    COUNT(DISTINCT user_id) as unique_athletes_helped,
    COUNT(CASE WHEN follow_up_needed = false THEN 1 END)::FLOAT / COUNT(*) * 100 as success_rate
FROM coaching_sessions
WHERE session_date >= CURRENT_DATE - INTERVAL '3 months'
  AND techniques_employed IS NOT NULL
GROUP BY UNNEST(techniques_employed);

CREATE UNIQUE INDEX IF NOT EXISTS idx_intervention_effectiveness_technique 
ON intervention_effectiveness_summary(technique);

-- =============================================================================
-- FUNCTIONS FOR AI COACHING SYSTEM
-- =============================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_coaching_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY coach_effectiveness_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mental_skills_development_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY intervention_effectiveness_summary;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate mental readiness score
CREATE OR REPLACE FUNCTION calculate_mental_readiness_score(
    p_user_id VARCHAR(255),
    p_assessment_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(4,2) AS $$
DECLARE
    confidence_score DECIMAL(4,2);
    anxiety_score DECIMAL(4,2);
    motivation_score DECIMAL(4,2);
    focus_score DECIMAL(4,2);
    mental_readiness DECIMAL(4,2);
BEGIN
    -- Get latest scores for each mental skill category
    SELECT COALESCE(AVG(CASE WHEN skill_category = 'confidence' THEN skill_level_rating END), 5.0),
           COALESCE(AVG(CASE WHEN skill_category = 'anxiety_management' THEN skill_level_rating END), 5.0),
           COALESCE(AVG(CASE WHEN skill_category = 'motivation' THEN skill_level_rating END), 5.0),
           COALESCE(AVG(CASE WHEN skill_category = 'focus' THEN skill_level_rating END), 5.0)
    INTO confidence_score, anxiety_score, motivation_score, focus_score
    FROM mental_skills_progress
    WHERE user_id = p_user_id
      AND assessment_date <= p_assessment_date
      AND assessment_date >= p_assessment_date - INTERVAL '30 days';
    
    -- Calculate weighted mental readiness score
    mental_readiness := (confidence_score * 0.3 + 
                        anxiety_score * 0.25 + 
                        motivation_score * 0.25 + 
                        focus_score * 0.2);
    
    RETURN mental_readiness;
END;
$$ LANGUAGE plpgsql;