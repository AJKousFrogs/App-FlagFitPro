-- Migration: Sponsor Rewards System
-- Description: Comprehensive sponsor rewards and tier progression system
-- Created: 2025-08-03
-- Supports: Tier progression, physical rewards, brand partnerships, performance incentives

-- =============================================================================
-- SPONSOR PARTNERS AND BRANDS
-- =============================================================================

-- Partner organizations and sponsors
CREATE TABLE sponsor_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Company details
    company_name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    
    -- Contact information
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    
    -- Partnership details
    partnership_type VARCHAR(100) NOT NULL, -- 'equipment', 'nutrition', 'apparel', 'technology', 'financial'
    partnership_tier VARCHAR(50) NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum', 'title_sponsor'
    partnership_start_date DATE NOT NULL,
    partnership_end_date DATE,
    
    -- Brand information
    brand_colors JSONB, -- {"primary": "#FF0000", "secondary": "#000000"}
    brand_guidelines_url TEXT,
    approved_marketing_materials TEXT[],
    
    -- Reward contribution
    monthly_reward_budget DECIMAL(10,2),
    annual_reward_budget DECIMAL(10,2),
    reward_categories TEXT[], -- Categories they sponsor
    exclusive_product_access BOOLEAN DEFAULT false,
    
    -- Performance metrics
    athlete_engagement_score DECIMAL(5,2),
    brand_visibility_score DECIMAL(5,2),
    roi_metrics JSONB,
    
    -- Contract terms
    minimum_athlete_participation INTEGER,
    performance_bonus_triggers JSONB,
    termination_conditions TEXT[],
    
    -- Status and compliance
    is_active BOOLEAN DEFAULT true,
    compliance_status VARCHAR(50) DEFAULT 'compliant',
    last_compliance_check DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- REWARD TIERS AND PROGRESSION
-- =============================================================================

-- Sponsor reward tier definitions
CREATE TABLE sponsor_reward_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tier details
    tier_name VARCHAR(100) NOT NULL UNIQUE,
    tier_level INTEGER NOT NULL UNIQUE, -- 1=Bronze, 2=Silver, 3=Gold, 4=Platinum, 5=Elite
    display_name VARCHAR(100) NOT NULL,
    tier_color VARCHAR(7) NOT NULL, -- Hex color for UI
    tier_icon VARCHAR(50),
    
    -- Progression requirements
    points_required INTEGER NOT NULL,
    training_sessions_required INTEGER DEFAULT 0,
    la28_readiness_required DECIMAL(5,2) DEFAULT 0, -- Minimum LA28 qualification score
    team_chemistry_required DECIMAL(3,1) DEFAULT 0,
    consistency_required INTEGER DEFAULT 0, -- Days of consistent activity
    
    -- Special requirements
    special_achievements_required TEXT[], -- Specific achievements needed
    community_engagement_required INTEGER DEFAULT 0, -- Community activity points
    referral_requirements INTEGER DEFAULT 0, -- Number of referrals needed
    
    -- Tier benefits
    monthly_reward_allowance DECIMAL(8,2) NOT NULL,
    bonus_multiplier DECIMAL(3,2) DEFAULT 1.0, -- Point multiplier for this tier
    exclusive_rewards_access BOOLEAN DEFAULT false,
    priority_shipping BOOLEAN DEFAULT false,
    personal_account_manager BOOLEAN DEFAULT false,
    
    -- Tier privileges
    early_product_access BOOLEAN DEFAULT false,
    beta_feature_access BOOLEAN DEFAULT false,
    exclusive_events_access BOOLEAN DEFAULT false,
    custom_training_plans BOOLEAN DEFAULT false,
    
    -- Retention benefits
    tier_protection_days INTEGER DEFAULT 30, -- Days of protection after demotion
    grace_period_extensions INTEGER DEFAULT 0, -- Number of grace periods allowed
    
    -- Tier requirements maintenance
    monthly_maintenance_points INTEGER DEFAULT 0, -- Points needed to maintain tier
    activity_requirement_days INTEGER DEFAULT 0, -- Days of activity per month
    
    -- Display and marketing
    tier_description TEXT,
    marketing_copy TEXT,
    benefits_summary TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_publicly_visible BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- REWARD CATALOG AND PRODUCTS
-- =============================================================================

-- Available rewards and products
CREATE TABLE sponsor_reward_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID REFERENCES sponsor_partners(id) ON DELETE CASCADE,
    
    -- Product details
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT NOT NULL,
    product_category VARCHAR(100) NOT NULL, -- 'apparel', 'equipment', 'nutrition', 'technology', 'experience'
    product_subcategory VARCHAR(100), -- 'cleats', 'protein', 'training_camp', etc.
    
    -- Visual assets
    product_image_url TEXT,
    product_gallery_urls TEXT[],
    product_video_url TEXT,
    
    -- Reward costs
    points_cost INTEGER NOT NULL,
    cash_equivalent_value DECIMAL(8,2),
    tier_restrictions TEXT[], -- Which tiers can access this reward
    
    -- Product specifications
    available_sizes TEXT[], -- For apparel/equipment
    available_colors TEXT[],
    customization_options JSONB, -- Name printing, team logos, etc.
    
    -- Inventory management
    total_inventory INTEGER,
    available_inventory INTEGER,
    reserved_inventory INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    
    -- Shipping and fulfillment
    shipping_weight_kg DECIMAL(6,2),
    shipping_dimensions_cm JSONB, -- {"length": 30, "width": 20, "height": 10}
    fulfillment_time_days INTEGER DEFAULT 7,
    international_shipping BOOLEAN DEFAULT false,
    
    -- Availability rules
    available_from DATE,
    available_until DATE,
    seasonal_availability JSONB, -- Seasonal restrictions
    geographic_restrictions TEXT[], -- Countries/regions where not available
    
    -- Performance incentives
    performance_bonus_eligible BOOLEAN DEFAULT false,
    performance_multiplier DECIMAL(3,2) DEFAULT 1.0,
    achievement_unlock_required TEXT[], -- Specific achievements that unlock this reward
    
    -- Product popularity and ratings
    order_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    wishlist_count INTEGER DEFAULT 0,
    
    -- Status and compliance
    is_active BOOLEAN DEFAULT true,
    requires_age_verification BOOLEAN DEFAULT false,
    requires_shipping_address BOOLEAN DEFAULT true,
    
    -- Metadata
    sku VARCHAR(100),
    manufacturer_part_number VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- USER REWARD POINTS AND PROGRESSION
-- =============================================================================

-- User reward points and tier status
CREATE TABLE user_reward_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Current status
    current_tier_id UUID NOT NULL REFERENCES sponsor_reward_tiers(id),
    total_points_earned BIGINT DEFAULT 0,
    available_points BIGINT DEFAULT 0,
    points_spent BIGINT DEFAULT 0,
    
    -- Tier progression
    tier_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tier_protection_until DATE, -- Date until which tier is protected
    next_tier_points_needed INTEGER DEFAULT 0,
    tier_progression_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Monthly activity tracking
    current_month_points INTEGER DEFAULT 0,
    current_month_sessions INTEGER DEFAULT 0,
    current_month_active_days INTEGER DEFAULT 0,
    monthly_target_points INTEGER DEFAULT 0,
    
    -- Streak tracking
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    
    -- Bonus multipliers
    active_bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
    bonus_expiry_date DATE,
    referral_bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    -- Achievement tracking
    achievements_unlocked TEXT[],
    recent_achievements TEXT[],
    achievement_points_earned INTEGER DEFAULT 0,
    
    -- Tier history
    tier_promotion_count INTEGER DEFAULT 0,
    tier_demotion_count INTEGER DEFAULT 0,
    highest_tier_achieved INTEGER DEFAULT 1,
    
    -- Engagement metrics
    last_reward_redemption DATE,
    total_rewards_redeemed INTEGER DEFAULT 0,
    preferred_reward_categories TEXT[],
    
    -- Special status flags
    vip_status BOOLEAN DEFAULT false,
    beta_tester BOOLEAN DEFAULT false,
    community_ambassador BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- =============================================================================
-- POINT EARNING ACTIVITIES
-- =============================================================================

-- Point earning rules and activities
CREATE TABLE reward_point_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Activity details
    activity_name VARCHAR(255) NOT NULL UNIQUE,
    activity_category VARCHAR(100) NOT NULL, -- 'training', 'community', 'achievement', 'referral', 'special'
    activity_description TEXT NOT NULL,
    
    -- Point values
    base_points INTEGER NOT NULL,
    tier_multipliers JSONB, -- Different multipliers per tier
    daily_limit INTEGER DEFAULT 0, -- 0 = no limit
    weekly_limit INTEGER DEFAULT 0,
    monthly_limit INTEGER DEFAULT 0,
    
    -- Activity requirements
    minimum_duration_minutes INTEGER DEFAULT 0,
    minimum_quality_score DECIMAL(3,2) DEFAULT 0,
    required_data_points TEXT[], -- What data must be present
    
    -- Validation rules
    requires_verification BOOLEAN DEFAULT false,
    auto_validation_rules JSONB, -- Automated validation criteria
    manual_review_threshold INTEGER, -- Points above which manual review is required
    
    -- Bonus conditions
    streak_bonus_enabled BOOLEAN DEFAULT false,
    streak_bonus_points INTEGER DEFAULT 0,
    streak_bonus_days INTEGER DEFAULT 7,
    
    -- Time-based bonuses
    peak_hours_bonus JSONB, -- Extra points during certain hours
    weekend_bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
    holiday_bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    -- Team-based bonuses
    team_activity_bonus INTEGER DEFAULT 0,
    team_size_multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    -- Performance-based adjustments
    performance_scaling_enabled BOOLEAN DEFAULT false,
    performance_bonus_formula TEXT, -- Formula for calculating performance bonus
    
    -- Activity availability
    is_active BOOLEAN DEFAULT true,
    available_from DATE,
    available_until DATE,
    seasonal_restrictions JSONB,
    
    -- Analytics
    total_points_awarded BIGINT DEFAULT 0,
    total_activities_completed INTEGER DEFAULT 0,
    average_points_per_activity DECIMAL(8,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- POINT TRANSACTIONS AND HISTORY
-- =============================================================================

-- All point earning and spending transactions
CREATE TABLE reward_point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL, -- 'earned', 'spent', 'bonus', 'adjustment', 'expired'
    activity_id UUID REFERENCES reward_point_activities(id),
    
    -- Point amounts
    points_change INTEGER NOT NULL, -- Positive for earned, negative for spent
    points_balance_after BIGINT NOT NULL,
    bonus_points INTEGER DEFAULT 0,
    multiplier_applied DECIMAL(3,2) DEFAULT 1.0,
    
    -- Transaction context
    source_description TEXT NOT NULL,
    related_entity_type VARCHAR(100), -- 'training_session', 'reward_order', 'achievement', etc.
    related_entity_id UUID,
    
    -- Validation and approval
    validation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'under_review'
    validated_by UUID REFERENCES users(id),
    validation_date TIMESTAMP,
    validation_notes TEXT,
    
    -- Performance context
    session_quality_score DECIMAL(3,2),
    performance_metrics JSONB,
    achievement_context JSONB,
    
    -- Tier and bonus information
    user_tier_at_time VARCHAR(100),
    tier_bonus_applied DECIMAL(3,2),
    streak_bonus_applied INTEGER DEFAULT 0,
    special_bonus_applied INTEGER DEFAULT 0,
    
    -- Geographic and temporal context
    earned_location VARCHAR(255),
    earned_timezone VARCHAR(50),
    
    -- Expiration tracking
    expires_at TIMESTAMP,
    is_expired BOOLEAN DEFAULT false,
    
    -- Metadata
    transaction_reference VARCHAR(100), -- External reference if applicable
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- REWARD ORDERS AND FULFILLMENT
-- =============================================================================

-- User reward orders and redemptions
CREATE TABLE reward_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Order details
    order_number VARCHAR(100) NOT NULL UNIQUE,
    order_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
    total_points_cost INTEGER NOT NULL,
    
    -- Shipping information
    shipping_address JSONB NOT NULL,
    shipping_method VARCHAR(100) DEFAULT 'standard',
    shipping_cost_points INTEGER DEFAULT 0,
    estimated_delivery_date DATE,
    
    -- Order items
    order_items JSONB NOT NULL, -- Array of ordered items with quantities
    customization_requests JSONB, -- Custom name printing, team logos, etc.
    special_instructions TEXT,
    
    -- Fulfillment tracking
    processing_started_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    tracking_number VARCHAR(255),
    carrier VARCHAR(100),
    
    -- Customer service
    customer_notes TEXT,
    internal_notes TEXT,
    support_tickets UUID[], -- References to support tickets
    
    -- Quality control
    quality_check_passed BOOLEAN,
    quality_check_notes TEXT,
    return_requested BOOLEAN DEFAULT false,
    return_reason TEXT,
    
    -- Satisfaction tracking
    customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
    customer_feedback TEXT,
    would_recommend BOOLEAN,
    
    -- Financial tracking
    cost_to_sponsor DECIMAL(10,2),
    sponsor_id UUID REFERENCES sponsor_partners(id),
    profit_margin DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Sponsor partners indexes
CREATE INDEX idx_sponsor_partners_type ON sponsor_partners(partnership_type);
CREATE INDEX idx_sponsor_partners_tier ON sponsor_partners(partnership_tier);
CREATE INDEX idx_sponsor_partners_active ON sponsor_partners(is_active);

-- Reward tiers indexes
CREATE INDEX idx_reward_tiers_level ON sponsor_reward_tiers(tier_level);
CREATE INDEX idx_reward_tiers_points ON sponsor_reward_tiers(points_required);
CREATE INDEX idx_reward_tiers_active ON sponsor_reward_tiers(is_active);

-- Reward catalog indexes
CREATE INDEX idx_reward_catalog_category ON sponsor_reward_catalog(product_category, product_subcategory);
CREATE INDEX idx_reward_catalog_points ON sponsor_reward_catalog(points_cost);
CREATE INDEX idx_reward_catalog_sponsor ON sponsor_reward_catalog(sponsor_id);
CREATE INDEX idx_reward_catalog_active ON sponsor_reward_catalog(is_active);
CREATE INDEX idx_reward_catalog_inventory ON sponsor_reward_catalog(available_inventory);

-- User reward status indexes
CREATE INDEX idx_user_reward_status_user ON user_reward_status(user_id);
CREATE INDEX idx_user_reward_status_tier ON user_reward_status(current_tier_id);
CREATE INDEX idx_user_reward_status_points ON user_reward_status(total_points_earned);

-- Point activities indexes
CREATE INDEX idx_point_activities_category ON reward_point_activities(activity_category);
CREATE INDEX idx_point_activities_points ON reward_point_activities(base_points);
CREATE INDEX idx_point_activities_active ON reward_point_activities(is_active);

-- Point transactions indexes
CREATE INDEX idx_point_transactions_user_date ON reward_point_transactions(user_id, created_at);
CREATE INDEX idx_point_transactions_type ON reward_point_transactions(transaction_type);
CREATE INDEX idx_point_transactions_activity ON reward_point_transactions(activity_id);
CREATE INDEX idx_point_transactions_validation ON reward_point_transactions(validation_status);

-- Reward orders indexes
CREATE INDEX idx_reward_orders_user ON reward_orders(user_id);
CREATE INDEX idx_reward_orders_status ON reward_orders(order_status);
CREATE INDEX idx_reward_orders_date ON reward_orders(created_at);
CREATE INDEX idx_reward_orders_sponsor ON reward_orders(sponsor_id);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- User reward dashboard
CREATE OR REPLACE VIEW user_reward_dashboard AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    urs.total_points_earned,
    urs.available_points,
    srt.tier_name,
    srt.tier_level,
    srt.tier_color,
    srt.monthly_reward_allowance,
    urs.next_tier_points_needed,
    urs.tier_progression_percentage,
    urs.current_streak_days,
    urs.current_month_points,
    COALESCE(recent_orders.order_count, 0) as recent_orders_count,
    COALESCE(recent_points.points_earned_30d, 0) as points_earned_last_30_days
FROM users u
JOIN user_reward_status urs ON u.id = urs.user_id
JOIN sponsor_reward_tiers srt ON urs.current_tier_id = srt.id
LEFT JOIN (
    SELECT user_id, COUNT(*) as order_count
    FROM reward_orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND order_status != 'cancelled'
    GROUP BY user_id
) recent_orders ON u.id = recent_orders.user_id
LEFT JOIN (
    SELECT user_id, SUM(points_change) as points_earned_30d
    FROM reward_point_transactions
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND transaction_type = 'earned'
      AND validation_status = 'approved'
    GROUP BY user_id
) recent_points ON u.id = recent_points.user_id
WHERE u.is_active = true;

-- Top performers by tier
CREATE OR REPLACE VIEW tier_leaderboards AS
SELECT 
    srt.tier_name,
    srt.tier_level,
    u.first_name,
    u.last_name,
    urs.total_points_earned,
    urs.current_month_points,
    urs.current_streak_days,
    RANK() OVER (PARTITION BY srt.tier_level ORDER BY urs.total_points_earned DESC) as tier_rank,
    RANK() OVER (PARTITION BY srt.tier_level ORDER BY urs.current_month_points DESC) as monthly_rank
FROM users u
JOIN user_reward_status urs ON u.id = urs.user_id
JOIN sponsor_reward_tiers srt ON urs.current_tier_id = srt.id
WHERE u.is_active = true
ORDER BY srt.tier_level DESC, urs.total_points_earned DESC;

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample sponsor partners
INSERT INTO sponsor_partners (
    company_name, display_name, partnership_type, partnership_tier, 
    partnership_start_date, monthly_reward_budget, reward_categories
) VALUES
('Nike Inc.', 'Nike', 'apparel', 'platinum', '2025-01-01', 50000.00, ARRAY['apparel', 'equipment']),
('Under Armour', 'Under Armour', 'apparel', 'gold', '2025-01-01', 30000.00, ARRAY['apparel', 'technology']),
('Gatorade', 'Gatorade', 'nutrition', 'gold', '2025-01-01', 25000.00, ARRAY['nutrition', 'hydration']),
('Wilson Sports', 'Wilson', 'equipment', 'silver', '2025-01-01', 15000.00, ARRAY['equipment']);

-- Insert reward tiers
INSERT INTO sponsor_reward_tiers (
    tier_name, tier_level, display_name, tier_color, points_required, 
    monthly_reward_allowance, bonus_multiplier, tier_description
) VALUES
('Bronze', 1, 'Bronze Tier', '#CD7F32', 0, 100.00, 1.0, 'Entry level with basic rewards access'),
('Silver', 2, 'Silver Tier', '#C0C0C0', 5000, 250.00, 1.2, 'Enhanced rewards with priority support'),
('Gold', 3, 'Gold Tier', '#FFD700', 15000, 500.00, 1.5, 'Premium rewards with exclusive access'),
('Platinum', 4, 'Platinum Tier', '#E5E4E2', 50000, 1000.00, 2.0, 'Elite rewards with personal account manager'),
('Elite', 5, 'Elite Tier', '#FF6B35', 150000, 2500.00, 3.0, 'Ultimate tier with all benefits unlocked');

-- Insert sample reward activities
INSERT INTO reward_point_activities (
    activity_name, activity_category, activity_description, base_points, daily_limit
) VALUES
('Complete Training Session', 'training', 'Complete a full training session with minimum 30 minutes duration', 100, 300),
('Team Practice Attendance', 'training', 'Attend team practice session', 150, 150),
('Achieve Personal Best', 'achievement', 'Set a new personal record in any training metric', 500, 0),
('Refer New User', 'referral', 'Successfully refer a new user who completes onboarding', 1000, 0),
('Community Post Engagement', 'community', 'Create engaging content in community forums', 25, 100),
('Weekly Training Streak', 'achievement', 'Complete training sessions for 7 consecutive days', 750, 0);