-- Migration: Enhanced Sponsor Catalog for Brand Integration
-- Description: Add brand-specific fields and improve sponsor product management
-- Created: 2025-08-03
-- Supports: External product IDs, brand-specific attributes, automated sync, relevance scoring

-- =============================================================================
-- ENHANCE EXISTING SPONSOR_REWARD_CATALOG TABLE
-- =============================================================================

-- Add new columns for enhanced sponsor integration
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS external_product_id VARCHAR(255);
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS product_handle VARCHAR(255);
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS product_tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS product_variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS availability_status VARCHAR(50) DEFAULT 'in_stock';
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS flag_football_relevance_score DECIMAL(3,2) DEFAULT 0.50;
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS reward_tier_auto_assigned VARCHAR(50);
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'synced';
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS sync_error_message TEXT;
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS brand_specific_attributes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS product_url VARCHAR(500);
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS original_currency VARCHAR(10) DEFAULT 'EUR';
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS price_last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS auto_point_calculation BOOLEAN DEFAULT true;
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS manual_review_required BOOLEAN DEFAULT false;
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS featured_product BOOLEAN DEFAULT false;
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS seasonal_availability JSONB;
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS min_athlete_tier VARCHAR(50);
ALTER TABLE sponsor_reward_catalog ADD COLUMN IF NOT EXISTS max_redemptions_per_user INTEGER DEFAULT 0;

-- =============================================================================
-- BRAND-SPECIFIC PRODUCT ATTRIBUTES TABLE
-- =============================================================================

-- Store brand-specific product attributes that don't fit in the main catalog
CREATE TABLE IF NOT EXISTS sponsor_product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_item_id UUID NOT NULL REFERENCES sponsor_reward_catalog(id) ON DELETE CASCADE,
    
    -- Attribute details
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT,
    attribute_type VARCHAR(50) DEFAULT 'text', -- 'text', 'number', 'boolean', 'json', 'date'
    
    -- Brand context
    brand_specific BOOLEAN DEFAULT false,
    attribute_category VARCHAR(100), -- 'size', 'color', 'material', 'specification', 'compatibility'
    
    -- Display and ordering
    display_order INTEGER DEFAULT 0,
    is_searchable BOOLEAN DEFAULT false,
    is_filterable BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(catalog_item_id, attribute_name)
);

-- =============================================================================
-- PRODUCT SYNC HISTORY TABLE
-- =============================================================================

-- Track synchronization history for audit and debugging
CREATE TABLE IF NOT EXISTS sponsor_product_sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Sync operation details
    sync_operation_id UUID NOT NULL, -- Groups related sync operations
    sponsor_id UUID NOT NULL REFERENCES sponsor_partners(id),
    sync_type VARCHAR(50) NOT NULL, -- 'full_sync', 'incremental', 'single_product', 'webhook'
    sync_method VARCHAR(50) NOT NULL, -- 'api', 'scraping', 'manual', 'webhook'
    
    -- Sync timing
    sync_started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Sync results
    products_processed INTEGER DEFAULT 0,
    products_added INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    products_removed INTEGER DEFAULT 0,
    products_failed INTEGER DEFAULT 0,
    
    -- Error tracking
    sync_status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed', 'partial'
    error_count INTEGER DEFAULT 0,
    error_summary TEXT,
    detailed_errors JSONB,
    
    -- Data quality metrics
    data_quality_score DECIMAL(3,2),
    duplicate_products_found INTEGER DEFAULT 0,
    invalid_products_skipped INTEGER DEFAULT 0,
    
    -- Performance metrics
    api_calls_made INTEGER DEFAULT 0,
    rate_limit_hits INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    data_transferred_mb DECIMAL(8,2),
    
    -- Configuration used
    sync_configuration JSONB,
    filters_applied JSONB,
    
    -- Follow-up actions
    requires_manual_review BOOLEAN DEFAULT false,
    follow_up_actions TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PRODUCT RELEVANCE SCORING TABLE
-- =============================================================================

-- Store detailed flag football relevance scoring breakdown
CREATE TABLE IF NOT EXISTS product_relevance_scoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_item_id UUID NOT NULL REFERENCES sponsor_reward_catalog(id) ON DELETE CASCADE,
    
    -- Scoring details
    overall_relevance_score DECIMAL(5,3) NOT NULL CHECK (overall_relevance_score BETWEEN 0 AND 1),
    scoring_algorithm_version VARCHAR(50) NOT NULL,
    scored_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Component scores
    name_relevance_score DECIMAL(5,3) DEFAULT 0,
    category_relevance_score DECIMAL(5,3) DEFAULT 0,
    tags_relevance_score DECIMAL(5,3) DEFAULT 0,
    description_relevance_score DECIMAL(5,3) DEFAULT 0,
    
    -- Keyword analysis
    high_relevance_keywords TEXT[],
    medium_relevance_keywords TEXT[],
    negative_relevance_keywords TEXT[],
    
    -- Scoring factors
    sport_specific_bonus DECIMAL(4,3) DEFAULT 0,
    training_equipment_bonus DECIMAL(4,3) DEFAULT 0,
    recovery_product_bonus DECIMAL(4,3) DEFAULT 0,
    apparel_relevance_factor DECIMAL(4,3) DEFAULT 0,
    
    -- Manual adjustments
    manual_override_applied BOOLEAN DEFAULT false,
    manual_override_score DECIMAL(5,3),
    manual_override_reason TEXT,
    override_applied_by UUID REFERENCES users(id),
    override_applied_at TIMESTAMP,
    
    -- Usage in recommendations
    used_in_recommendations BOOLEAN DEFAULT true,
    recommendation_weight DECIMAL(4,3) DEFAULT 1.0,
    
    -- Quality indicators
    confidence_level DECIMAL(3,2) CHECK (confidence_level BETWEEN 0 AND 1),
    scoring_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- AUTOMATED SYNC CONFIGURATION TABLE
-- =============================================================================

-- Configuration for automated synchronization processes
CREATE TABLE IF NOT EXISTS sponsor_sync_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES sponsor_partners(id) ON DELETE CASCADE,
    
    -- Sync scheduling
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency_hours INTEGER DEFAULT 24, -- How often to sync
    last_sync_attempt TIMESTAMP,
    next_sync_scheduled TIMESTAMP,
    
    -- Sync methods
    preferred_sync_method VARCHAR(50) DEFAULT 'api', -- 'api', 'scraping', 'hybrid'
    fallback_sync_method VARCHAR(50) DEFAULT 'scraping',
    api_available BOOLEAN DEFAULT false,
    scraping_available BOOLEAN DEFAULT true,
    
    -- Sync scope and filters
    sync_all_products BOOLEAN DEFAULT true,
    category_filters TEXT[], -- Only sync specific categories
    minimum_price_threshold DECIMAL(8,2) DEFAULT 0,
    maximum_price_threshold DECIMAL(8,2),
    relevance_threshold DECIMAL(3,2) DEFAULT 0.3, -- Only sync products above this relevance
    
    -- Data processing rules
    auto_assign_tiers BOOLEAN DEFAULT true,
    auto_calculate_points BOOLEAN DEFAULT true,
    require_manual_review BOOLEAN DEFAULT false,
    auto_publish_products BOOLEAN DEFAULT false,
    
    -- Quality control
    max_products_per_sync INTEGER DEFAULT 1000,
    duplicate_detection_enabled BOOLEAN DEFAULT true,
    data_validation_enabled BOOLEAN DEFAULT true,
    
    -- Error handling
    max_retry_attempts INTEGER DEFAULT 3,
    retry_delay_minutes INTEGER DEFAULT 15,
    stop_on_repeated_failures BOOLEAN DEFAULT true,
    max_consecutive_failures INTEGER DEFAULT 5,
    
    -- Notification settings
    notify_on_sync_completion BOOLEAN DEFAULT true,
    notify_on_sync_failure BOOLEAN DEFAULT true,
    notification_recipients TEXT[],
    
    -- Performance settings
    batch_size INTEGER DEFAULT 50,
    request_delay_ms INTEGER DEFAULT 1000,
    concurrent_requests INTEGER DEFAULT 1,
    
    -- Webhook configuration
    webhook_enabled BOOLEAN DEFAULT false,
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255),
    
    -- Status and metadata
    configuration_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(sponsor_id)
);

-- =============================================================================
-- ENHANCED INDEXES
-- =============================================================================

-- Enhanced indexes for the updated catalog table
CREATE INDEX IF NOT EXISTS idx_sponsor_catalog_external_id ON sponsor_reward_catalog(external_product_id, sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_catalog_relevance ON sponsor_reward_catalog(flag_football_relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_catalog_availability ON sponsor_reward_catalog(availability_status);
CREATE INDEX IF NOT EXISTS idx_sponsor_catalog_sync_status ON sponsor_reward_catalog(sync_status, last_synced_at);
CREATE INDEX IF NOT EXISTS idx_sponsor_catalog_tier_assigned ON sponsor_reward_catalog(reward_tier_auto_assigned);
CREATE INDEX IF NOT EXISTS idx_sponsor_catalog_featured ON sponsor_reward_catalog(featured_product) WHERE featured_product = true;
CREATE INDEX IF NOT EXISTS idx_sponsor_catalog_review_required ON sponsor_reward_catalog(manual_review_required) WHERE manual_review_required = true;

-- Product attributes indexes
CREATE INDEX IF NOT EXISTS idx_product_attributes_catalog ON sponsor_product_attributes(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_searchable ON sponsor_product_attributes(attribute_name) WHERE is_searchable = true;
CREATE INDEX IF NOT EXISTS idx_product_attributes_filterable ON sponsor_product_attributes(attribute_name, attribute_value) WHERE is_filterable = true;

-- Sync history indexes
CREATE INDEX IF NOT EXISTS idx_sync_history_sponsor_date ON sponsor_product_sync_history(sponsor_id, sync_started_at);
CREATE INDEX IF NOT EXISTS idx_sync_history_operation ON sponsor_product_sync_history(sync_operation_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_status ON sponsor_product_sync_history(sync_status);

-- Relevance scoring indexes
CREATE INDEX IF NOT EXISTS idx_relevance_scoring_catalog ON product_relevance_scoring(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_relevance_scoring_score ON product_relevance_scoring(overall_relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_relevance_scoring_scored_at ON product_relevance_scoring(scored_at);

-- Sync configuration indexes
CREATE INDEX IF NOT EXISTS idx_sync_config_sponsor ON sponsor_sync_configuration(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sync_config_next_sync ON sponsor_sync_configuration(next_sync_scheduled) WHERE sync_enabled = true;

-- =============================================================================
-- ENHANCED VIEWS
-- =============================================================================

-- Enhanced sponsor product catalog view with all new fields
CREATE OR REPLACE VIEW enhanced_sponsor_catalog_view AS
SELECT 
    src.id,
    src.product_name,
    src.product_description,
    src.product_category,
    src.product_subcategory,
    src.points_cost,
    src.cash_equivalent_value,
    src.original_price,
    src.original_currency,
    src.product_image_url,
    src.product_url,
    src.external_product_id,
    src.availability_status,
    src.flag_football_relevance_score,
    src.reward_tier_auto_assigned,
    src.data_source,
    src.last_synced_at,
    src.sync_status,
    src.featured_product,
    src.manual_review_required,
    
    -- Sponsor details
    sp.company_name as sponsor_name,
    sp.partnership_tier as sponsor_tier,
    
    -- Relevance scoring details
    prs.overall_relevance_score,
    prs.high_relevance_keywords,
    prs.confidence_level as relevance_confidence,
    
    -- Product attributes count
    (SELECT COUNT(*) FROM sponsor_product_attributes spa WHERE spa.catalog_item_id = src.id) as attributes_count,
    
    -- Recent sync performance
    CASE 
        WHEN src.last_synced_at IS NULL THEN 'never_synced'
        WHEN src.last_synced_at < CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'sync_outdated'
        WHEN src.sync_status = 'failed' THEN 'sync_failed'
        ELSE 'sync_current'
    END as sync_health_status
    
FROM sponsor_reward_catalog src
JOIN sponsor_partners sp ON src.sponsor_id = sp.id
LEFT JOIN LATERAL (
    SELECT overall_relevance_score, high_relevance_keywords, confidence_level
    FROM product_relevance_scoring 
    WHERE catalog_item_id = src.id 
    ORDER BY scored_at DESC 
    LIMIT 1
) prs ON true
WHERE src.is_active = true
ORDER BY src.flag_football_relevance_score DESC, src.featured_product DESC;

-- Sync performance dashboard view
CREATE OR REPLACE VIEW sponsor_sync_dashboard AS
SELECT 
    sp.company_name,
    sp.partnership_tier,
    ssc.sync_enabled,
    ssc.sync_frequency_hours,
    ssc.last_sync_attempt,
    ssc.next_sync_scheduled,
    ssc.preferred_sync_method,
    
    -- Recent sync performance
    recent_sync.sync_status as last_sync_status,
    recent_sync.products_processed as last_sync_products,
    recent_sync.duration_seconds as last_sync_duration,
    recent_sync.error_count as last_sync_errors,
    
    -- Overall statistics
    (SELECT COUNT(*) FROM sponsor_reward_catalog WHERE sponsor_id = sp.id AND is_active = true) as total_active_products,
    (SELECT COUNT(*) FROM sponsor_reward_catalog WHERE sponsor_id = sp.id AND manual_review_required = true) as products_needing_review,
    (SELECT AVG(flag_football_relevance_score) FROM sponsor_reward_catalog WHERE sponsor_id = sp.id AND is_active = true) as avg_relevance_score,
    
    -- Health indicators
    CASE 
        WHEN ssc.last_sync_attempt IS NULL THEN 'never_synced'
        WHEN ssc.last_sync_attempt < CURRENT_TIMESTAMP - INTERVAL '48 hours' THEN 'sync_overdue'
        WHEN recent_sync.sync_status = 'failed' THEN 'sync_failing'
        WHEN recent_sync.error_count > 0 THEN 'sync_errors'
        ELSE 'healthy'
    END as sync_health
    
FROM sponsor_partners sp
LEFT JOIN sponsor_sync_configuration ssc ON sp.id = ssc.sponsor_id
LEFT JOIN LATERAL (
    SELECT sync_status, products_processed, duration_seconds, error_count
    FROM sponsor_product_sync_history 
    WHERE sponsor_id = sp.id 
    ORDER BY sync_started_at DESC 
    LIMIT 1
) recent_sync ON true
WHERE sp.is_active = true
ORDER BY sp.partnership_tier, sp.company_name;

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

-- Update trigger for sponsor_reward_catalog
CREATE OR REPLACE FUNCTION update_sponsor_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sponsor_catalog_updated_at
    BEFORE UPDATE ON sponsor_reward_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_sponsor_catalog_updated_at();

-- Update trigger for sponsor_product_attributes
CREATE TRIGGER trigger_update_product_attributes_updated_at
    BEFORE UPDATE ON sponsor_product_attributes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for sponsor_sync_configuration
CREATE TRIGGER trigger_update_sync_config_updated_at
    BEFORE UPDATE ON sponsor_sync_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SAMPLE ENHANCED DATA
-- =============================================================================

-- Insert sample sync configurations for existing sponsors
INSERT INTO sponsor_sync_configuration (
    sponsor_id, sync_enabled, sync_frequency_hours, preferred_sync_method,
    auto_assign_tiers, auto_calculate_points, relevance_threshold
) VALUES 
((SELECT id FROM sponsor_partners WHERE company_name = 'Nike Inc.' LIMIT 1), 
 true, 12, 'api', true, true, 0.4),
((SELECT id FROM sponsor_partners WHERE company_name = 'Under Armour' LIMIT 1), 
 true, 24, 'scraping', true, true, 0.3)
ON CONFLICT (sponsor_id) DO NOTHING;

-- Insert sample relevance scoring for demonstration
INSERT INTO product_relevance_scoring (
    catalog_item_id, overall_relevance_score, scoring_algorithm_version,
    name_relevance_score, category_relevance_score, high_relevance_keywords
) 
SELECT 
    src.id,
    0.75,
    'v1.0',
    0.8,
    0.7,
    ARRAY['football', 'training', 'performance']
FROM sponsor_reward_catalog src 
WHERE src.product_name ILIKE '%football%' OR src.product_name ILIKE '%training%'
ON CONFLICT (catalog_item_id) DO NOTHING;