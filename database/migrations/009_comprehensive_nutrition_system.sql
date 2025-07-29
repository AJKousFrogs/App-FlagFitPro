-- =============================================================================
-- COMPREHENSIVE NUTRITION SYSTEM - Migration 009
-- Based on USDA FoodData Central API and Olympic nutrition research
-- Integrates data from leading sports science institutions
-- =============================================================================

-- =============================================================================
-- FOOD DATABASE TABLES (USDA FoodData Central Integration)
-- =============================================================================

-- Main foods table - based on USDA FoodData Central
CREATE TABLE IF NOT EXISTS foods (
    fdc_id INTEGER PRIMARY KEY, -- USDA FoodData Central ID
    data_type VARCHAR(50) NOT NULL, -- 'foundation', 'sr_legacy', 'survey', 'branded'
    description TEXT NOT NULL,
    food_category_id INTEGER,
    publication_date DATE,
    
    -- Additional classification
    brand_owner VARCHAR(255),
    brand_name VARCHAR(255),
    ingredients TEXT,
    serving_size DECIMAL(10,3),
    serving_size_unit VARCHAR(50),
    household_serving_fulltext TEXT,
    
    -- Sports nutrition specific
    is_sports_supplement BOOLEAN DEFAULT FALSE,
    is_hydration_focused BOOLEAN DEFAULT FALSE,
    is_recovery_food BOOLEAN DEFAULT FALSE,
    is_pre_workout BOOLEAN DEFAULT FALSE,
    is_post_workout BOOLEAN DEFAULT FALSE,
    
    -- Allergen information
    contains_gluten BOOLEAN DEFAULT FALSE,
    contains_dairy BOOLEAN DEFAULT FALSE,
    contains_nuts BOOLEAN DEFAULT FALSE,
    contains_soy BOOLEAN DEFAULT FALSE,
    contains_shellfish BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food categories table
CREATE TABLE IF NOT EXISTS food_categories (
    id INTEGER PRIMARY KEY,
    code VARCHAR(10),
    description TEXT NOT NULL,
    parent_category_id INTEGER REFERENCES food_categories(id),
    
    -- Sports nutrition categorization
    performance_category VARCHAR(100), -- 'energy', 'protein', 'hydration', 'recovery', 'supplements'
    timing_category VARCHAR(100), -- 'pre_workout', 'during_workout', 'post_workout', 'daily'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nutrients table (comprehensive list from USDA)
CREATE TABLE IF NOT EXISTS nutrients (
    id INTEGER PRIMARY KEY,
    number VARCHAR(10) UNIQUE NOT NULL, -- USDA nutrient number
    name VARCHAR(255) NOT NULL,
    unit_name VARCHAR(50) NOT NULL, -- 'g', 'mg', 'µg', 'kcal', etc.
    
    -- Sports performance relevance
    performance_impact VARCHAR(100), -- 'energy', 'muscle_building', 'recovery', 'hydration', 'immune'
    timing_importance VARCHAR(100), -- 'pre_exercise', 'post_exercise', 'daily', 'competition'
    athlete_focus_level VARCHAR(50), -- 'critical', 'important', 'moderate', 'low'
    
    -- Nutrient classification
    nutrient_class VARCHAR(100), -- 'macronutrient', 'vitamin', 'mineral', 'amino_acid', 'fatty_acid'
    is_essential BOOLEAN DEFAULT FALSE,
    
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food nutrients junction table (nutritional values)
CREATE TABLE IF NOT EXISTS food_nutrients (
    id SERIAL PRIMARY KEY,
    fdc_id INTEGER NOT NULL REFERENCES foods(fdc_id) ON DELETE CASCADE,
    nutrient_id INTEGER NOT NULL REFERENCES nutrients(id),
    amount DECIMAL(15,6),
    data_points INTEGER,
    derivation_id INTEGER,
    min DECIMAL(15,6),
    max DECIMAL(15,6),
    median DECIMAL(15,6),
    footnote TEXT,
    min_year_acquired INTEGER,
    
    -- Per 100g standardization for easy comparison
    amount_per_100g DECIMAL(15,6),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(fdc_id, nutrient_id)
);

-- =============================================================================
-- SPORTS NUTRITION SPECIFIC TABLES
-- =============================================================================

-- Pre-defined nutrition plans for different sports and goals
CREATE TABLE IF NOT EXISTS nutrition_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sport_type VARCHAR(100), -- 'flag_football', 'endurance', 'strength', 'team_sports'
    athlete_level VARCHAR(50), -- 'recreational', 'competitive', 'elite', 'professional'
    goal VARCHAR(100), -- 'performance', 'recovery', 'weight_gain', 'weight_loss', 'maintenance'
    
    -- Macronutrient targets (per kg body weight)
    protein_g_per_kg DECIMAL(5,2),
    carbs_g_per_kg DECIMAL(5,2),
    fat_g_per_kg DECIMAL(5,2),
    total_calories_per_kg DECIMAL(8,2),
    
    -- Hydration recommendations
    fluid_ml_per_kg DECIMAL(8,2),
    electrolyte_requirements JSONB, -- Sodium, potassium, etc.
    
    -- Timing recommendations
    pre_exercise_timing TEXT,
    during_exercise_timing TEXT,
    post_exercise_timing TEXT,
    
    -- Supplement recommendations
    recommended_supplements TEXT[],
    
    -- Research backing
    research_source TEXT,
    evidence_level VARCHAR(50), -- 'high', 'moderate', 'low', 'emerging'
    
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal timing and composition recommendations
CREATE TABLE IF NOT EXISTS meal_templates (
    id SERIAL PRIMARY KEY,
    nutrition_plan_id INTEGER REFERENCES nutrition_plans(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    meal_type VARCHAR(100), -- 'breakfast', 'pre_workout', 'post_workout', 'lunch', 'dinner', 'snack'
    timing_relative_to_exercise VARCHAR(100), -- '-3h', '-1h', '+30min', '+2h', 'non_training_day'
    
    -- Macronutrient composition (percentages)
    protein_percentage DECIMAL(5,2),
    carbs_percentage DECIMAL(5,2),
    fat_percentage DECIMAL(5,2),
    
    -- Specific recommendations
    serving_size_description TEXT,
    recommended_foods TEXT[],
    avoid_foods TEXT[],
    
    -- Preparation notes
    preparation_time_minutes INTEGER,
    complexity_level VARCHAR(50), -- 'simple', 'moderate', 'complex'
    portable BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food combinations and synergies
CREATE TABLE IF NOT EXISTS food_synergies (
    id SERIAL PRIMARY KEY,
    primary_food_id INTEGER REFERENCES foods(fdc_id),
    synergy_food_id INTEGER REFERENCES foods(fdc_id),
    synergy_type VARCHAR(100), -- 'absorption_enhancement', 'protein_completion', 'antioxidant_boost'
    benefit_description TEXT,
    timing_importance VARCHAR(100), -- 'same_meal', 'same_day', 'sequential'
    
    -- Research backing
    research_source TEXT,
    evidence_strength VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PERSONALIZED NUTRITION TABLES
-- =============================================================================

-- Individual athlete nutrition profiles
CREATE TABLE IF NOT EXISTS athlete_nutrition_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Physical characteristics affecting nutrition
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    body_fat_percentage DECIMAL(5,2),
    muscle_mass_percentage DECIMAL(5,2),
    metabolic_rate INTEGER, -- BMR in calories
    
    -- Activity and training
    training_days_per_week INTEGER,
    training_intensity VARCHAR(50), -- 'low', 'moderate', 'high', 'very_high'
    primary_sport VARCHAR(100),
    position VARCHAR(100),
    training_phase VARCHAR(100), -- 'base', 'build', 'peak', 'recovery', 'off_season'
    
    -- Dietary restrictions and preferences
    dietary_restrictions TEXT[], -- 'vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free'
    food_allergies TEXT[],
    food_intolerances TEXT[],
    cultural_preferences TEXT[],
    disliked_foods TEXT[],
    
    -- Goals and targets
    primary_goal VARCHAR(100),
    target_weight_kg DECIMAL(5,2),
    performance_goals TEXT[],
    
    -- Calculated nutritional needs
    daily_calories INTEGER,
    protein_g_per_day DECIMAL(8,2),
    carbs_g_per_day DECIMAL(8,2),
    fat_g_per_day DECIMAL(8,2),
    fluid_ml_per_day INTEGER,
    
    -- Assigned nutrition plan
    current_nutrition_plan_id INTEGER REFERENCES nutrition_plans(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily nutrition tracking
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    log_date DATE NOT NULL,
    meal_type VARCHAR(100), -- 'breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'
    
    -- Food consumed
    fdc_id INTEGER REFERENCES foods(fdc_id),
    quantity_consumed DECIMAL(10,3),
    quantity_unit VARCHAR(50),
    
    -- Nutritional values (calculated)
    calories DECIMAL(10,2),
    protein_g DECIMAL(10,2),
    carbs_g DECIMAL(10,2),
    fat_g DECIMAL(10,2),
    fiber_g DECIMAL(10,2),
    sodium_mg DECIMAL(10,2),
    
    -- Context
    timing_relative_to_exercise VARCHAR(100),
    location VARCHAR(100), -- 'home', 'restaurant', 'on_the_go'
    preparation_method VARCHAR(100),
    
    -- Subjective measures
    hunger_before INTEGER, -- 1-10 scale
    satisfaction_after INTEGER, -- 1-10 scale
    energy_level_after INTEGER, -- 1-10 scale
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, log_date, meal_type, fdc_id)
);

-- Hydration tracking
CREATE TABLE IF NOT EXISTS hydration_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    log_date DATE NOT NULL,
    log_time TIME NOT NULL,
    
    -- Fluid details
    fluid_type VARCHAR(100), -- 'water', 'sports_drink', 'electrolyte_drink', 'coffee', 'tea'
    volume_ml INTEGER,
    
    -- Electrolyte content (if applicable)
    sodium_mg DECIMAL(10,2),
    potassium_mg DECIMAL(10,2),
    magnesium_mg DECIMAL(10,2),
    calcium_mg DECIMAL(10,2),
    
    -- Context
    timing_relative_to_exercise VARCHAR(100),
    environmental_temp_c DECIMAL(5,2),
    activity_level VARCHAR(50), -- 'rest', 'light', 'moderate', 'intense'
    
    -- Physiological markers
    urine_color INTEGER, -- 1-8 hydration color chart
    thirst_level INTEGER, -- 1-10 scale
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SUPPLEMENTATION TABLES
-- =============================================================================

-- Supplement database
CREATE TABLE IF NOT EXISTS supplements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'protein', 'creatine', 'vitamins', 'minerals', 'herbs', 'amino_acids'
    subcategory VARCHAR(100),
    
    -- Active ingredients
    active_ingredients JSONB, -- {ingredient: amount_per_serving}
    serving_size VARCHAR(100),
    servings_per_container INTEGER,
    
    -- Effectiveness and safety
    evidence_level VARCHAR(50), -- 'strong', 'moderate', 'limited', 'insufficient'
    safety_rating VARCHAR(50), -- 'safe', 'likely_safe', 'caution', 'avoid'
    banned_substance_risk VARCHAR(50), -- 'none', 'low', 'moderate', 'high'
    
    -- Performance applications
    performance_benefits TEXT[],
    recommended_timing VARCHAR(100),
    recommended_dosage TEXT,
    duration_of_use TEXT,
    
    -- Interactions and warnings
    drug_interactions TEXT[],
    food_interactions TEXT[],
    side_effects TEXT[],
    contraindications TEXT[],
    
    -- Research and validation
    research_summary TEXT,
    key_studies TEXT[],
    
    -- Commercial information
    brand VARCHAR(255),
    cost_per_serving DECIMAL(10,2),
    third_party_tested BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual supplement regimens
CREATE TABLE IF NOT EXISTS athlete_supplement_plans (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    supplement_id INTEGER REFERENCES supplements(id),
    
    -- Dosage and timing
    daily_dosage VARCHAR(100),
    timing VARCHAR(100), -- 'morning', 'pre_workout', 'post_workout', 'evening'
    frequency VARCHAR(100), -- 'daily', 'training_days_only', 'competition_days'
    
    -- Duration and cycling
    start_date DATE,
    planned_end_date DATE,
    cycling_protocol TEXT,
    
    -- Goals and monitoring
    primary_goal VARCHAR(100),
    success_metrics TEXT[],
    side_effects_experienced TEXT[],
    
    -- Professional guidance
    recommended_by VARCHAR(255), -- 'self', 'coach', 'nutritionist', 'doctor'
    approval_status VARCHAR(50), -- 'approved', 'pending', 'discontinued'
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE CORRELATION TABLES
-- =============================================================================

-- Nutrition and performance correlation tracking
CREATE TABLE IF NOT EXISTS nutrition_performance_correlations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    analysis_date DATE NOT NULL,
    
    -- Nutrition metrics (previous 7 days average)
    avg_daily_calories DECIMAL(10,2),
    avg_protein_g DECIMAL(10,2),
    avg_carbs_g DECIMAL(10,2),
    avg_fat_g DECIMAL(10,2),
    avg_hydration_ml INTEGER,
    nutrition_compliance_percentage DECIMAL(5,2),
    
    -- Performance metrics
    training_performance_score DECIMAL(5,2), -- 1-10 scale
    energy_levels_avg DECIMAL(5,2), -- 1-10 scale
    recovery_quality_avg DECIMAL(5,2), -- 1-10 scale
    strength_metrics JSONB,
    endurance_metrics JSONB,
    cognitive_performance DECIMAL(5,2),
    
    -- Sleep and wellbeing
    sleep_quality_avg DECIMAL(5,2),
    mood_score_avg DECIMAL(5,2),
    stress_level_avg DECIMAL(5,2),
    
    -- Analysis results
    correlation_strength DECIMAL(5,3), -- -1 to 1
    key_insights TEXT[],
    recommendations TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- COMPETITION AND EVENT NUTRITION
-- =============================================================================

-- Tournament and competition nutrition planning
CREATE TABLE IF NOT EXISTS competition_nutrition_plans (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    competition_name VARCHAR(255),
    competition_date DATE,
    
    -- Competition details
    duration_hours DECIMAL(5,2),
    number_of_games INTEGER,
    time_between_games_minutes INTEGER,
    environmental_conditions JSONB, -- temperature, humidity, altitude
    
    -- Pre-competition nutrition (1-3 days before)
    carb_loading_protocol TEXT,
    hydration_strategy TEXT,
    supplement_protocol TEXT,
    foods_to_avoid TEXT[],
    
    -- Competition day nutrition
    pre_competition_meal TEXT,
    pre_competition_timing VARCHAR(100),
    between_games_nutrition TEXT[],
    hydration_schedule TEXT,
    
    -- Post-competition recovery
    immediate_recovery_nutrition TEXT,
    first_hour_nutrition TEXT,
    first_day_nutrition TEXT,
    
    -- Contingency planning
    travel_nutrition_plan TEXT,
    emergency_options TEXT[],
    backup_supplements TEXT[],
    
    -- Results and evaluation
    performance_outcome VARCHAR(100),
    nutrition_compliance_percentage DECIMAL(5,2),
    lessons_learned TEXT[],
    improvements_for_next_time TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Foods table indexes
CREATE INDEX IF NOT EXISTS idx_foods_description ON foods(description);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(food_category_id);
CREATE INDEX IF NOT EXISTS idx_foods_data_type ON foods(data_type);
CREATE INDEX IF NOT EXISTS idx_foods_sports_flags ON foods(is_sports_supplement, is_recovery_food, is_pre_workout, is_post_workout);

-- Food nutrients indexes
CREATE INDEX IF NOT EXISTS idx_food_nutrients_fdc_id ON food_nutrients(fdc_id);
CREATE INDEX IF NOT EXISTS idx_food_nutrients_nutrient_id ON food_nutrients(nutrient_id);
CREATE INDEX IF NOT EXISTS idx_food_nutrients_amount ON food_nutrients(amount_per_100g);

-- Nutrition logs indexes
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_meal_type ON nutrition_logs(meal_type);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_fdc_id ON nutrition_logs(fdc_id);

-- User profile indexes
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_id ON athlete_nutrition_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_sport ON athlete_nutrition_profiles(primary_sport);

-- Performance correlation indexes
CREATE INDEX IF NOT EXISTS idx_nutrition_performance_user_date ON nutrition_performance_correlations(user_id, analysis_date);

-- Hydration logs indexes
CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_date ON hydration_logs(user_id, log_date);

-- Competition plans indexes
CREATE INDEX IF NOT EXISTS idx_competition_plans_user_id ON competition_nutrition_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_plans_date ON competition_nutrition_plans(competition_date);

-- =============================================================================
-- MATERIALIZED VIEWS FOR COMPLEX QUERIES
-- =============================================================================

-- Daily nutrition summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_nutrition_summary AS
SELECT 
    user_id,
    log_date,
    SUM(calories) as total_calories,
    SUM(protein_g) as total_protein_g,
    SUM(carbs_g) as total_carbs_g,
    SUM(fat_g) as total_fat_g,
    SUM(fiber_g) as total_fiber_g,
    SUM(sodium_mg) as total_sodium_mg,
    COUNT(DISTINCT meal_type) as meals_logged,
    AVG(satisfaction_after) as avg_satisfaction,
    AVG(energy_level_after) as avg_energy_level
FROM nutrition_logs
GROUP BY user_id, log_date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_nutrition_summary_user_date 
ON daily_nutrition_summary(user_id, log_date);

-- Nutrition compliance view
CREATE MATERIALIZED VIEW IF NOT EXISTS nutrition_compliance_summary AS
SELECT 
    nl.user_id,
    nl.log_date,
    anp.daily_calories as target_calories,
    anp.protein_g_per_day as target_protein,
    anp.carbs_g_per_day as target_carbs,
    anp.fat_g_per_day as target_fat,
    dns.total_calories,
    dns.total_protein_g,
    dns.total_carbs_g,
    dns.total_fat_g,
    CASE WHEN anp.daily_calories > 0 THEN (dns.total_calories / anp.daily_calories) * 100 ELSE 0 END as calorie_compliance_pct,
    CASE WHEN anp.protein_g_per_day > 0 THEN (dns.total_protein_g / anp.protein_g_per_day) * 100 ELSE 0 END as protein_compliance_pct,
    CASE WHEN anp.carbs_g_per_day > 0 THEN (dns.total_carbs_g / anp.carbs_g_per_day) * 100 ELSE 0 END as carb_compliance_pct,
    CASE WHEN anp.fat_g_per_day > 0 THEN (dns.total_fat_g / anp.fat_g_per_day) * 100 ELSE 0 END as fat_compliance_pct
FROM daily_nutrition_summary dns
JOIN athlete_nutrition_profiles anp ON dns.user_id = anp.user_id
JOIN nutrition_logs nl ON dns.user_id = nl.user_id AND dns.log_date = nl.log_date;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nutrition_compliance_user_date 
ON nutrition_compliance_summary(user_id, log_date);

-- Top foods by nutrient view
CREATE MATERIALIZED VIEW IF NOT EXISTS top_foods_by_nutrient AS
SELECT 
    n.name as nutrient_name,
    n.unit_name,
    f.fdc_id,
    f.description as food_description,
    f.food_category_id,
    fc.description as category_description,
    fn.amount_per_100g,
    RANK() OVER (PARTITION BY n.id ORDER BY fn.amount_per_100g DESC) as nutrient_rank
FROM food_nutrients fn
JOIN foods f ON fn.fdc_id = f.fdc_id
JOIN nutrients n ON fn.nutrient_id = n.id
LEFT JOIN food_categories fc ON f.food_category_id = fc.id
WHERE fn.amount_per_100g > 0;

CREATE INDEX IF NOT EXISTS idx_top_foods_nutrient_rank 
ON top_foods_by_nutrient(nutrient_name, nutrient_rank);