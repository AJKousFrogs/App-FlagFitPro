-- Migration: Nutrition System
-- Description: Complete nutrition tracking, meal planning, and dietary recommendations
-- Created: 2024-10-15

-- Food Database with comprehensive nutritional information
CREATE TABLE food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    barcode VARCHAR(50), -- UPC/EAN codes for scanning
    category VARCHAR(100) NOT NULL, -- proteins, carbs, fats, fruits, vegetables, dairy, etc.
    
    -- Nutritional information per 100g
    calories_per_100g DECIMAL(6,2) NOT NULL,
    protein_per_100g DECIMAL(6,2) NOT NULL,
    carbs_per_100g DECIMAL(6,2) NOT NULL,
    fat_per_100g DECIMAL(6,2) NOT NULL,
    fiber_per_100g DECIMAL(6,2) DEFAULT 0,
    sugar_per_100g DECIMAL(6,2) DEFAULT 0,
    sodium_per_100g DECIMAL(6,2) DEFAULT 0, -- in mg
    
    -- Micronutrients (per 100g)
    vitamin_c_per_100g DECIMAL(6,2) DEFAULT 0, -- in mg
    vitamin_d_per_100g DECIMAL(6,2) DEFAULT 0, -- in mcg
    calcium_per_100g DECIMAL(6,2) DEFAULT 0, -- in mg
    iron_per_100g DECIMAL(6,2) DEFAULT 0, -- in mg
    potassium_per_100g DECIMAL(6,2) DEFAULT 0, -- in mg
    
    -- Serving information
    default_serving_size DECIMAL(6,2) DEFAULT 100, -- in grams
    default_serving_description VARCHAR(100), -- "1 cup", "1 medium apple", etc.
    
    -- Athletic performance factors
    glycemic_index INTEGER, -- 0-100 scale
    performance_category VARCHAR(50), -- pre_workout, post_workout, recovery, hydration
    digestibility_rating INTEGER CHECK (digestibility_rating BETWEEN 1 AND 5),
    
    -- Metadata
    source VARCHAR(100), -- usda, manual_entry, barcode_scan
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User daily nutrition targets based on position, training intensity, goals
CREATE TABLE user_nutrition_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Date range for these targets
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Daily caloric needs
    daily_calories_target INTEGER NOT NULL,
    daily_calories_min INTEGER NOT NULL,
    daily_calories_max INTEGER NOT NULL,
    
    -- Macronutrient targets (grams)
    protein_target DECIMAL(6,2) NOT NULL,
    carbs_target DECIMAL(6,2) NOT NULL,
    fat_target DECIMAL(6,2) NOT NULL,
    fiber_target DECIMAL(6,2) DEFAULT 25,
    
    -- Hydration (liters)
    water_target DECIMAL(4,2) DEFAULT 3.0,
    
    -- Training day adjustments
    training_day_calorie_bonus INTEGER DEFAULT 0,
    training_day_carb_bonus DECIMAL(6,2) DEFAULT 0,
    
    -- Meal timing preferences
    meals_per_day INTEGER DEFAULT 3,
    snacks_per_day INTEGER DEFAULT 2,
    pre_workout_timing_hours DECIMAL(3,2) DEFAULT 2.0, -- eat 2 hours before training
    post_workout_timing_minutes INTEGER DEFAULT 30, -- eat within 30 min after training
    
    -- Goals and restrictions
    goal VARCHAR(50), -- muscle_gain, fat_loss, maintenance, peak_performance
    dietary_restrictions TEXT[], -- vegetarian, vegan, gluten_free, dairy_free, etc.
    allergies TEXT[], -- nuts, shellfish, eggs, etc.
    
    -- Metadata
    calculated_by VARCHAR(50), -- ai_recommendation, coach_input, user_preference
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meal planning and templates
CREATE TABLE meal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    meal_type VARCHAR(50) NOT NULL, -- breakfast, lunch, dinner, snack, pre_workout, post_workout
    
    -- Nutritional summary (calculated from ingredients)
    total_calories DECIMAL(7,2),
    total_protein DECIMAL(6,2),
    total_carbs DECIMAL(6,2),
    total_fat DECIMAL(6,2),
    
    -- Timing and suitability
    prep_time_minutes INTEGER,
    suitable_for_game_day BOOLEAN DEFAULT false,
    suitable_for_training_day BOOLEAN DEFAULT true,
    suitable_for_rest_day BOOLEAN DEFAULT true,
    
    -- Athletic performance
    performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 5),
    energy_level VARCHAR(50), -- high, moderate, low
    digestibility VARCHAR(50), -- easy, moderate, heavy
    
    -- Sharing and visibility
    is_public BOOLEAN DEFAULT false,
    is_team_template BOOLEAN DEFAULT false,
    
    -- Tags for filtering
    tags TEXT[], -- quick, budget_friendly, vegetarian, high_protein, etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ingredients for meal templates
CREATE TABLE meal_template_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_template_id UUID NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
    food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    
    quantity DECIMAL(8,2) NOT NULL, -- in grams
    serving_description VARCHAR(100), -- "1 cup chopped", "2 slices", etc.
    
    -- Optional modifiers
    cooking_method VARCHAR(50), -- grilled, baked, raw, steamed
    preparation_notes TEXT,
    
    -- Order for recipe instructions
    order_index INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User meal logging (what they actually ate)
CREATE TABLE user_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL, -- breakfast, lunch, dinner, snack, pre_workout, post_workout
    meal_time TIMESTAMP NOT NULL,
    
    -- Reference to template if used
    meal_template_id UUID REFERENCES meal_templates(id) ON DELETE SET NULL,
    
    -- Overall meal data
    total_calories DECIMAL(7,2),
    total_protein DECIMAL(6,2),
    total_carbs DECIMAL(6,2),
    total_fat DECIMAL(6,2),
    
    -- Meal context
    eaten_before_training BOOLEAN DEFAULT false,
    eaten_after_training BOOLEAN DEFAULT false,
    training_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    
    -- User ratings and notes
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    energy_level_after INTEGER CHECK (energy_level_after BETWEEN 1 AND 5), -- how energized after eating
    notes TEXT,
    
    -- Tracking method
    logged_via VARCHAR(50), -- manual, barcode_scan, photo, template, ai_estimate
    photo_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual food items within a meal
CREATE TABLE user_meal_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_meal_id UUID NOT NULL REFERENCES user_meals(id) ON DELETE CASCADE,
    food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    
    quantity DECIMAL(8,2) NOT NULL, -- in grams
    serving_description VARCHAR(100),
    
    -- Calculated nutritional values for this quantity
    calories DECIMAL(7,2),
    protein DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fat DECIMAL(6,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Water and hydration tracking
CREATE TABLE user_hydration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    amount_ml INTEGER NOT NULL, -- milliliters consumed
    beverage_type VARCHAR(50) DEFAULT 'water', -- water, sports_drink, tea, coffee, etc.
    
    -- Context
    consumed_during_training BOOLEAN DEFAULT false,
    training_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    
    -- For sports drinks
    electrolyte_content DECIMAL(6,2), -- sodium content in mg
    sugar_content DECIMAL(6,2), -- sugar in grams
    
    -- Tracking method
    logged_via VARCHAR(50) DEFAULT 'manual', -- manual, smart_bottle, estimate
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nutrition recommendations and AI suggestions
CREATE TABLE nutrition_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Recommendation context
    date_generated DATE NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL, -- daily_plan, pre_workout, post_workout, recovery
    
    -- Training context
    upcoming_training_type VARCHAR(100),
    training_intensity VARCHAR(50),
    training_duration_minutes INTEGER,
    
    -- Recommendations
    meal_template_ids UUID[], -- suggested meal templates
    priority_nutrients TEXT[], -- what to focus on: protein, carbs, hydration, etc.
    
    -- Specific guidance
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    timing_guidance TEXT, -- "eat 2 hours before training"
    
    -- AI confidence and reasoning
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    reasoning TEXT, -- why this recommendation was made
    
    -- User interaction
    viewed BOOLEAN DEFAULT false,
    followed BOOLEAN DEFAULT false,
    user_feedback INTEGER CHECK (user_feedback BETWEEN 1 AND 5),
    
    -- Effectiveness tracking
    performance_impact_tracked BOOLEAN DEFAULT false,
    performance_improvement DECIMAL(5,2), -- percentage improvement if tracked
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Supplement tracking
CREATE TABLE user_supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    supplement_name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    dosage VARCHAR(100), -- "1 scoop", "500mg", etc.
    
    -- Timing
    frequency VARCHAR(50), -- daily, pre_workout, post_workout, as_needed
    time_of_day TIME[], -- when during day to take
    
    -- Purpose and effects
    purpose VARCHAR(100), -- protein, creatine, vitamin, pre_workout, recovery
    expected_benefits TEXT[],
    
    -- Tracking
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Cost tracking
    cost_per_serving DECIMAL(6,2),
    servings_per_container INTEGER,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily supplement intake logging
CREATE TABLE user_supplement_intake (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_supplement_id UUID NOT NULL REFERENCES user_supplements(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    time_taken TIMESTAMP NOT NULL,
    dosage_taken VARCHAR(100),
    
    -- Context
    taken_before_training BOOLEAN DEFAULT false,
    taken_after_training BOOLEAN DEFAULT false,
    training_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
    
    -- User feedback
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    side_effects TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_food_items_category ON food_items(category);
CREATE INDEX idx_food_items_barcode ON food_items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_food_items_performance_category ON food_items(performance_category) WHERE performance_category IS NOT NULL;

CREATE INDEX idx_user_nutrition_targets_user_date ON user_nutrition_targets(user_id, start_date, end_date);

CREATE INDEX idx_meal_templates_type ON meal_templates(meal_type);
CREATE INDEX idx_meal_templates_team ON meal_templates(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_meal_templates_public ON meal_templates(is_public) WHERE is_public = true;

CREATE INDEX idx_user_meals_user_date ON user_meals(user_id, date);
CREATE INDEX idx_user_meals_training ON user_meals(training_session_id) WHERE training_session_id IS NOT NULL;

CREATE INDEX idx_user_hydration_user_date ON user_hydration(user_id, date);

CREATE INDEX idx_nutrition_recommendations_user_date ON nutrition_recommendations(user_id, date_generated);
CREATE INDEX idx_nutrition_recommendations_active ON nutrition_recommendations(user_id, expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_user_supplements_user_active ON user_supplements(user_id, start_date, end_date);

-- Note: TimescaleDB hypertables commented out for standard PostgreSQL
-- SELECT create_hypertable('user_meals', 'meal_time');
-- SELECT create_hypertable('user_hydration', 'timestamp');
-- SELECT create_hypertable('user_supplement_intake', 'time_taken');

-- Add update triggers
CREATE TRIGGER update_food_items_updated_at
    BEFORE UPDATE ON food_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_nutrition_targets_updated_at
    BEFORE UPDATE ON user_nutrition_targets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_templates_updated_at
    BEFORE UPDATE ON meal_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_meals_updated_at
    BEFORE UPDATE ON user_meals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_supplements_updated_at
    BEFORE UPDATE ON user_supplements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();