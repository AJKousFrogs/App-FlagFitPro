-- Migration: Multilingual Support System
-- Description: Comprehensive multilingual support with dynamic translation management
-- Created: 2025-08-03
-- Supports: Dynamic translations, cultural adaptations, user preferences, automated translation quality

-- =============================================================================
-- SUPPORTED LANGUAGES AND LOCALES
-- =============================================================================

-- Supported languages and regional variations
CREATE TABLE supported_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Language identification
    language_code VARCHAR(10) NOT NULL UNIQUE, -- ISO 639-1 codes like 'en', 'es', 'zh'
    language_name_english VARCHAR(100) NOT NULL,
    language_name_native VARCHAR(100) NOT NULL,
    language_family VARCHAR(100), -- 'Indo-European', 'Sino-Tibetan', etc.
    
    -- Regional variations
    region_code VARCHAR(10), -- ISO 3166-1 codes like 'US', 'MX', 'CN'
    locale_code VARCHAR(20) NOT NULL UNIQUE, -- Combined like 'en-US', 'es-MX', 'zh-CN'
    locale_name VARCHAR(100) NOT NULL,
    
    -- Language characteristics
    writing_direction VARCHAR(10) DEFAULT 'ltr', -- 'ltr' (left-to-right), 'rtl' (right-to-left)
    writing_system VARCHAR(50), -- 'Latin', 'Chinese', 'Arabic', 'Cyrillic'
    pluralization_rules JSONB, -- Complex pluralization rules for the language
    
    -- Cultural context
    cultural_context JSONB, -- Cultural considerations for this locale
    date_format VARCHAR(50) DEFAULT 'MM/DD/YYYY',
    time_format VARCHAR(20) DEFAULT '12-hour',
    number_format JSONB, -- {"decimal_separator": ".", "thousands_separator": ","}
    currency_format JSONB, -- Default currency formatting for region
    
    -- Translation capabilities
    machine_translation_available BOOLEAN DEFAULT true,
    translation_quality_score DECIMAL(3,2) CHECK (translation_quality_score BETWEEN 0 AND 1),
    human_translator_available BOOLEAN DEFAULT false,
    
    -- Usage statistics
    total_users INTEGER DEFAULT 0,
    active_users_last_30_days INTEGER DEFAULT 0,
    content_completion_percentage DECIMAL(5,2) DEFAULT 0, -- % of content translated
    
    -- Priority and status
    priority_level INTEGER DEFAULT 3, -- 1=highest, 5=lowest priority for translation
    is_active BOOLEAN DEFAULT true,
    is_beta BOOLEAN DEFAULT false, -- Beta language support
    
    -- Quality indicators
    translation_accuracy_rating DECIMAL(3,2),
    user_satisfaction_score DECIMAL(3,2),
    native_speaker_validation BOOLEAN DEFAULT false,
    
    -- Technical specifications
    font_requirements TEXT[],
    keyboard_layout VARCHAR(50),
    input_method_requirements TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- TRANSLATION KEYS AND CONTENT MANAGEMENT
-- =============================================================================

-- Translation keys and source content
CREATE TABLE translation_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Key identification
    translation_key VARCHAR(500) NOT NULL UNIQUE, -- Hierarchical key like 'dashboard.training.session_complete'
    key_category VARCHAR(100) NOT NULL, -- 'ui', 'notifications', 'emails', 'error_messages', 'content'
    key_subcategory VARCHAR(100), -- 'buttons', 'labels', 'titles', 'descriptions'
    
    -- Source content (always in English)
    source_text TEXT NOT NULL,
    source_context TEXT, -- Context to help translators understand usage
    character_limit INTEGER, -- UI space limitations
    
    -- Content characteristics
    content_type VARCHAR(50) DEFAULT 'text', -- 'text', 'html', 'markdown', 'json'
    has_variables BOOLEAN DEFAULT false, -- Contains variables like {username}
    variable_names TEXT[], -- Array of variable names used
    pluralization_needed BOOLEAN DEFAULT false,
    
    -- Usage information
    used_in_components TEXT[], -- Which UI components use this key
    used_in_features TEXT[], -- Which app features use this key
    usage_frequency VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low', 'rare'
    
    -- Translation priority
    translation_priority INTEGER DEFAULT 3, -- 1=critical, 5=nice-to-have
    requires_cultural_adaptation BOOLEAN DEFAULT false,
    requires_technical_knowledge BOOLEAN DEFAULT false,
    
    -- Quality requirements
    requires_native_speaker BOOLEAN DEFAULT false,
    requires_professional_translator BOOLEAN DEFAULT false,
    accuracy_importance VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    
    -- Version control
    version INTEGER DEFAULT 1,
    last_modified_by UUID REFERENCES users(id),
    change_reason TEXT,
    
    -- Status and lifecycle
    is_active BOOLEAN DEFAULT true,
    is_deprecated BOOLEAN DEFAULT false,
    deprecation_reason TEXT,
    replacement_key VARCHAR(500),
    
    -- Analytics
    total_translations INTEGER DEFAULT 0,
    pending_translations INTEGER DEFAULT 0,
    completed_translations INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- TRANSLATIONS AND LOCALIZED CONTENT
-- =============================================================================

-- Actual translations for each language
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    translation_key_id UUID NOT NULL REFERENCES translation_keys(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES supported_languages(id) ON DELETE CASCADE,
    
    -- Translation content
    translated_text TEXT NOT NULL,
    translation_notes TEXT, -- Notes from translator about choices made
    alternative_translations TEXT[], -- Other possible translations
    
    -- Translation metadata
    translation_method VARCHAR(50) NOT NULL, -- 'human', 'machine', 'hybrid', 'community'
    translator_name VARCHAR(255),
    translator_credentials VARCHAR(255),
    translation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Quality assurance
    quality_score DECIMAL(3,2) CHECK (quality_score BETWEEN 0 AND 1),
    reviewed_by VARCHAR(255),
    review_date DATE,
    review_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'needs_revision'
    review_comments TEXT,
    
    -- Validation and testing
    native_speaker_validated BOOLEAN DEFAULT false,
    context_tested BOOLEAN DEFAULT false,
    ui_tested BOOLEAN DEFAULT false,
    cultural_appropriateness_checked BOOLEAN DEFAULT false,
    
    -- Usage and performance
    character_count INTEGER NOT NULL,
    fits_ui_constraints BOOLEAN DEFAULT true,
    readability_score DECIMAL(3,2),
    user_feedback_score DECIMAL(3,2),
    
    -- Pluralization support
    plural_forms JSONB, -- Different plural forms for languages that need them
    gender_variations JSONB, -- Gender-specific variations if needed
    formality_levels JSONB, -- Formal/informal variations
    
    -- Version control
    version INTEGER DEFAULT 1,
    parent_version_id UUID REFERENCES translations(id),
    is_current_version BOOLEAN DEFAULT true,
    
    -- Status and lifecycle
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending_review', 'approved', 'published', 'deprecated'
    published_at TIMESTAMP,
    deprecated_at TIMESTAMP,
    
    -- Analytics and optimization
    usage_count INTEGER DEFAULT 0,
    error_reports INTEGER DEFAULT 0,
    improvement_suggestions JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(translation_key_id, language_id, version)
);

-- =============================================================================
-- USER LANGUAGE PREFERENCES
-- =============================================================================

-- Individual user language and localization preferences
CREATE TABLE user_language_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Primary language settings
    primary_language_id UUID NOT NULL REFERENCES supported_languages(id),
    fallback_language_id UUID REFERENCES supported_languages(id), -- Fallback if primary not available
    auto_detect_language BOOLEAN DEFAULT true,
    
    -- Regional and cultural preferences
    timezone VARCHAR(50),
    date_format_preference VARCHAR(50),
    time_format_preference VARCHAR(20), -- '12-hour', '24-hour'
    number_format_preference JSONB,
    currency_preference VARCHAR(10), -- ISO currency code
    
    -- Content preferences
    content_formality_level VARCHAR(20) DEFAULT 'neutral', -- 'formal', 'neutral', 'casual'
    technical_language_level VARCHAR(20) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
    cultural_adaptation_level VARCHAR(20) DEFAULT 'moderate', -- 'minimal', 'moderate', 'high'
    
    -- Communication preferences
    notification_language_id UUID REFERENCES supported_languages(id),
    email_language_id UUID REFERENCES supported_languages(id),
    support_language_preference UUID REFERENCES supported_languages(id),
    
    -- Accessibility and assistance
    translation_assistance_enabled BOOLEAN DEFAULT false,
    show_original_text BOOLEAN DEFAULT false, -- Show original alongside translation
    pronunciation_guide_enabled BOOLEAN DEFAULT false,
    
    -- Learning and improvement
    language_learning_mode BOOLEAN DEFAULT false, -- Help user learn secondary language
    correction_suggestions_enabled BOOLEAN DEFAULT true,
    cultural_tips_enabled BOOLEAN DEFAULT true,
    
    -- Performance preferences
    preload_translations BOOLEAN DEFAULT true,
    offline_translation_priority BOOLEAN DEFAULT false,
    translation_caching_enabled BOOLEAN DEFAULT true,
    
    -- Quality feedback preferences
    provide_translation_feedback BOOLEAN DEFAULT true,
    participate_in_translation_quality BOOLEAN DEFAULT false,
    beta_translations_enabled BOOLEAN DEFAULT false,
    
    -- Usage analytics (aggregated, anonymous)
    language_switch_frequency INTEGER DEFAULT 0,
    most_used_features TEXT[],
    translation_quality_ratings JSONB,
    
    -- Status and metadata
    last_language_detection TIMESTAMP,
    preferences_locked BOOLEAN DEFAULT false, -- Prevent automatic changes
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- =============================================================================
-- DYNAMIC CONTENT LOCALIZATION
-- =============================================================================

-- Localized dynamic content (user-generated content, notifications, etc.)
CREATE TABLE dynamic_content_localization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content identification
    content_type VARCHAR(100) NOT NULL, -- 'notification', 'email_template', 'user_content', 'system_message'
    content_identifier VARCHAR(255) NOT NULL, -- Unique identifier for the content
    original_language_id UUID NOT NULL REFERENCES supported_languages(id),
    
    -- Original content
    original_content JSONB NOT NULL, -- Original content structure
    content_structure JSONB, -- Metadata about content structure
    extraction_rules JSONB, -- Rules for extracting translatable parts
    
    -- Localization metadata
    requires_localization BOOLEAN DEFAULT true,
    localization_priority INTEGER DEFAULT 3,
    cultural_sensitivity_level VARCHAR(20) DEFAULT 'medium',
    
    -- Content characteristics
    has_dynamic_variables BOOLEAN DEFAULT false,
    variable_mapping JSONB, -- How variables should be handled in translation
    personalization_level VARCHAR(20) DEFAULT 'standard',
    
    -- Audience targeting
    target_audience TEXT[], -- Who this content is for
    audience_language_preferences JSONB,
    geographic_targeting JSONB,
    
    -- Localization status
    localization_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
    languages_completed TEXT[],
    languages_pending TEXT[],
    
    -- Quality and performance
    localization_quality_score DECIMAL(3,2),
    user_engagement_by_language JSONB,
    conversion_rates_by_language JSONB,
    
    -- Automation and AI
    auto_translation_enabled BOOLEAN DEFAULT true,
    ai_quality_check_enabled BOOLEAN DEFAULT true,
    human_review_required BOOLEAN DEFAULT false,
    
    -- Version control and updates
    content_version INTEGER DEFAULT 1,
    last_content_update TIMESTAMP,
    translation_sync_required BOOLEAN DEFAULT false,
    
    -- Analytics and optimization
    view_counts_by_language JSONB,
    interaction_rates_by_language JSONB,
    feedback_scores_by_language JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(content_type, content_identifier, content_version)
);

-- =============================================================================
-- TRANSLATION QUALITY MONITORING
-- =============================================================================

-- Monitoring and quality assurance for translations
CREATE TABLE translation_quality_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    translation_id UUID NOT NULL REFERENCES translations(id) ON DELETE CASCADE,
    
    -- Quality assessment metadata
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    assessment_type VARCHAR(50) NOT NULL, -- 'automated', 'human_review', 'user_feedback', 'native_speaker_check'
    assessor_name VARCHAR(255),
    assessment_context VARCHAR(100),
    
    -- Quality metrics
    overall_quality_score DECIMAL(3,2) CHECK (overall_quality_score BETWEEN 0 AND 1),
    accuracy_score DECIMAL(3,2) CHECK (accuracy_score BETWEEN 0 AND 1),
    fluency_score DECIMAL(3,2) CHECK (fluency_score BETWEEN 0 AND 1),
    cultural_appropriateness_score DECIMAL(3,2) CHECK (cultural_appropriateness_score BETWEEN 0 AND 1),
    
    -- Specific quality indicators
    grammar_correctness DECIMAL(3,2),
    terminology_consistency DECIMAL(3,2),
    style_appropriateness DECIMAL(3,2),
    context_accuracy DECIMAL(3,2),
    
    -- Technical quality
    formatting_preserved BOOLEAN DEFAULT true,
    variables_handled_correctly BOOLEAN DEFAULT true,
    character_limits_respected BOOLEAN DEFAULT true,
    ui_compatibility BOOLEAN DEFAULT true,
    
    -- Cultural and linguistic quality
    cultural_sensitivity DECIMAL(3,2),
    register_appropriateness DECIMAL(3,2), -- Formal/informal level
    regional_appropriateness DECIMAL(3,2),
    idiomatic_expression_quality DECIMAL(3,2),
    
    -- User experience impact
    readability_score DECIMAL(3,2),
    comprehension_difficulty DECIMAL(3,2),
    user_satisfaction_predicted DECIMAL(3,2),
    
    -- Issues identified
    critical_issues TEXT[],
    moderate_issues TEXT[],
    minor_issues TEXT[],
    suggestions_for_improvement TEXT[],
    
    -- Comparison with alternatives
    alternative_translations_considered INTEGER DEFAULT 0,
    ranking_among_alternatives INTEGER,
    improvement_over_previous DECIMAL(5,2),
    
    -- Automated analysis results
    ai_confidence_score DECIMAL(3,2),
    automated_flags TEXT[],
    similarity_to_reference DECIMAL(3,2),
    
    -- Review outcomes
    requires_revision BOOLEAN DEFAULT false,
    revision_urgency VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    approval_recommendation VARCHAR(20), -- 'approve', 'conditional_approve', 'reject', 'needs_more_review'
    
    -- Follow-up tracking
    issues_addressed BOOLEAN DEFAULT false,
    recheck_required BOOLEAN DEFAULT false,
    next_review_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- CULTURAL ADAPTATION SETTINGS
-- =============================================================================

-- Cultural adaptation and localization beyond language
CREATE TABLE cultural_adaptation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID NOT NULL REFERENCES supported_languages(id) ON DELETE CASCADE,
    
    -- Cultural context identification
    cultural_region VARCHAR(100) NOT NULL,
    cultural_subgroup VARCHAR(100),
    cultural_characteristics JSONB,
    
    -- Visual and design adaptations
    color_preferences JSONB, -- Cultural color meanings and preferences
    imagery_guidelines JSONB, -- Appropriate imagery for culture
    layout_preferences JSONB, -- Reading patterns, layout preferences
    icon_adaptations JSONB, -- Icons that need cultural adaptation
    
    -- Content adaptations
    communication_style VARCHAR(50), -- 'direct', 'indirect', 'hierarchical', 'egalitarian'
    formality_expectations VARCHAR(50), -- Expected level of formality
    humor_appropriateness JSONB, -- What types of humor are appropriate
    taboo_topics TEXT[], -- Topics to avoid or handle carefully
    
    -- Functional adaptations
    measurement_system VARCHAR(20), -- 'metric', 'imperial', 'mixed'
    address_format JSONB, -- How addresses should be formatted
    phone_number_format VARCHAR(50),
    name_formatting_rules JSONB, -- How names should be displayed
    
    -- Business and legal considerations
    business_hours_format VARCHAR(100),
    holiday_calendar TEXT[], -- Important holidays and observances
    weekend_days TEXT[], -- Which days are weekends
    legal_disclaimers_required TEXT[],
    
    -- Sports and training specific adaptations
    training_schedule_preferences JSONB, -- Cultural preferences for training times
    coaching_communication_style VARCHAR(50),
    team_hierarchy_expectations JSONB,
    motivation_techniques JSONB, -- Culturally appropriate motivation methods
    
    -- Technology and accessibility
    preferred_input_methods TEXT[],
    assistive_technology_requirements TEXT[],
    internet_connectivity_considerations JSONB,
    
    -- Social and community aspects
    community_engagement_preferences JSONB,
    social_sharing_norms JSONB,
    privacy_expectations JSONB,
    family_involvement_expectations JSONB,
    
    -- Implementation guidelines
    implementation_priority INTEGER DEFAULT 3,
    requires_local_expertise BOOLEAN DEFAULT false,
    testing_requirements TEXT[],
    validation_methods TEXT[],
    
    -- Status and maintenance
    is_active BOOLEAN DEFAULT true,
    last_reviewed_date DATE,
    next_review_date DATE,
    requires_update BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Supported languages indexes
CREATE INDEX idx_supported_languages_code ON supported_languages(language_code);
CREATE INDEX idx_supported_languages_locale ON supported_languages(locale_code);
CREATE INDEX idx_supported_languages_active ON supported_languages(is_active);
CREATE INDEX idx_supported_languages_priority ON supported_languages(priority_level);

-- Translation keys indexes
CREATE INDEX idx_translation_keys_key ON translation_keys(translation_key);
CREATE INDEX idx_translation_keys_category ON translation_keys(key_category, key_subcategory);
CREATE INDEX idx_translation_keys_priority ON translation_keys(translation_priority);
CREATE INDEX idx_translation_keys_active ON translation_keys(is_active);

-- Translations indexes
CREATE INDEX idx_translations_key_language ON translations(translation_key_id, language_id);
CREATE INDEX idx_translations_language ON translations(language_id);
CREATE INDEX idx_translations_status ON translations(status);
CREATE INDEX idx_translations_current ON translations(is_current_version);
CREATE INDEX idx_translations_quality ON translations(quality_score);

-- User language preferences indexes
CREATE INDEX idx_user_language_prefs_user ON user_language_preferences(user_id);
CREATE INDEX idx_user_language_prefs_primary ON user_language_preferences(primary_language_id);

-- Dynamic content localization indexes
CREATE INDEX idx_dynamic_content_type ON dynamic_content_localization(content_type);
CREATE INDEX idx_dynamic_content_identifier ON dynamic_content_localization(content_identifier);
CREATE INDEX idx_dynamic_content_status ON dynamic_content_localization(localization_status);

-- Translation quality monitoring indexes
CREATE INDEX idx_quality_monitoring_translation ON translation_quality_monitoring(translation_id);
CREATE INDEX idx_quality_monitoring_date ON translation_quality_monitoring(assessment_date);
CREATE INDEX idx_quality_monitoring_score ON translation_quality_monitoring(overall_quality_score);

-- Cultural adaptation indexes
CREATE INDEX idx_cultural_adaptation_language ON cultural_adaptation_settings(language_id);
CREATE INDEX idx_cultural_adaptation_region ON cultural_adaptation_settings(cultural_region);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Translation completion status by language
CREATE OR REPLACE VIEW translation_completion_status AS
SELECT 
    sl.language_name_english,
    sl.locale_code,
    COUNT(tk.id) as total_keys,
    COUNT(t.id) as translated_keys,
    COUNT(t.id) FILTER (WHERE t.status = 'approved') as approved_translations,
    ROUND((COUNT(t.id)::DECIMAL / COUNT(tk.id)) * 100, 2) as completion_percentage,
    ROUND(AVG(t.quality_score), 3) as average_quality_score,
    sl.priority_level
FROM supported_languages sl
CROSS JOIN translation_keys tk
LEFT JOIN translations t ON tk.id = t.translation_key_id AND sl.id = t.language_id AND t.is_current_version = true
WHERE sl.is_active = true AND tk.is_active = true
GROUP BY sl.id, sl.language_name_english, sl.locale_code, sl.priority_level
ORDER BY sl.priority_level, completion_percentage DESC;

-- User language distribution
CREATE OR REPLACE VIEW user_language_distribution AS
SELECT 
    sl.language_name_english,
    sl.locale_code,
    COUNT(ulp.user_id) as user_count,
    ROUND((COUNT(ulp.user_id)::DECIMAL / (SELECT COUNT(*) FROM user_language_preferences)) * 100, 2) as percentage,
    COUNT(ulp.user_id) FILTER (WHERE u.last_login_at >= CURRENT_TIMESTAMP - INTERVAL '30 days') as active_users_30d
FROM supported_languages sl
LEFT JOIN user_language_preferences ulp ON sl.id = ulp.primary_language_id
LEFT JOIN users u ON ulp.user_id = u.id
WHERE sl.is_active = true
GROUP BY sl.id, sl.language_name_english, sl.locale_code
ORDER BY user_count DESC;

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert primary supported languages
INSERT INTO supported_languages (
    language_code, language_name_english, language_name_native, locale_code, 
    locale_name, writing_direction, priority_level, is_active
) VALUES
('en', 'English', 'English', 'en-US', 'English (United States)', 'ltr', 1, true),
('es', 'Spanish', 'Español', 'es-ES', 'Español (España)', 'ltr', 2, true),
('es', 'Spanish', 'Español', 'es-MX', 'Español (México)', 'ltr', 2, true),
('zh', 'Chinese', '中文', 'zh-CN', '中文 (简体)', 'ltr', 2, true),
('ja', 'Japanese', '日本語', 'ja-JP', '日本語 (日本)', 'ltr', 3, true),
('fr', 'French', 'Français', 'fr-FR', 'Français (France)', 'ltr', 3, true);

-- Insert sample translation keys
INSERT INTO translation_keys (
    translation_key, key_category, source_text, content_type, translation_priority
) VALUES
('app.name', 'ui', 'Flag Football Training Pro', 'text', 1),
('dashboard.welcome', 'ui', 'Welcome to your training dashboard', 'text', 1),
('training.session_complete', 'notifications', 'Training session completed successfully!', 'text', 2),
('navigation.dashboard', 'ui', 'Dashboard', 'text', 1),
('navigation.training', 'ui', 'Training', 'text', 1),
('navigation.community', 'ui', 'Community', 'text', 1),
('buttons.start_training', 'ui', 'Start Training', 'text', 1),
('buttons.save_progress', 'ui', 'Save Progress', 'text', 2);

-- Insert sample translations for Spanish
INSERT INTO translations (
    translation_key_id, language_id, translated_text, translation_method, quality_score, status
) VALUES
((SELECT id FROM translation_keys WHERE translation_key = 'app.name'), 
 (SELECT id FROM supported_languages WHERE locale_code = 'es-ES'),
 'Flag Football Training Pro', 'human', 0.95, 'approved'),
((SELECT id FROM translation_keys WHERE translation_key = 'dashboard.welcome'), 
 (SELECT id FROM supported_languages WHERE locale_code = 'es-ES'),
 'Bienvenido a tu panel de entrenamiento', 'human', 0.92, 'approved'),
((SELECT id FROM translation_keys WHERE translation_key = 'navigation.dashboard'), 
 (SELECT id FROM supported_languages WHERE locale_code = 'es-ES'),
 'Panel', 'human', 0.90, 'approved'),
((SELECT id FROM translation_keys WHERE translation_key = 'navigation.training'), 
 (SELECT id FROM supported_languages WHERE locale_code = 'es-ES'),
 'Entrenamiento', 'human', 0.93, 'approved');