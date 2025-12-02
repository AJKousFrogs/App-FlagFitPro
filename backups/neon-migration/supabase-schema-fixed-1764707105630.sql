-- Supabase Schema Migration (FIXED)
-- Generated: 2025-12-02T20:24:57.693Z
-- Source: Neon Database
-- Tables: 72
-- Total Rows: 373

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- Table: analytics_events
-- Rows: 3
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP SEQUENCE IF EXISTS analytics_events_id_seq CASCADE;
CREATE SEQUENCE analytics_events_id_seq;
CREATE TABLE analytics_events (
  id SERIAL NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  session_id VARCHAR(255) NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  referrer TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  PRIMARY KEY (id)
);

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);


-- Table: performance_metrics
-- Rows: 3
DROP TABLE IF EXISTS performance_metrics CASCADE;
DROP SEQUENCE IF EXISTS performance_metrics_id_seq CASCADE;
CREATE SEQUENCE performance_metrics_id_seq;
CREATE TABLE performance_metrics (
  id SERIAL NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  page_url TEXT NOT NULL,
  load_time NUMERIC,
  api_response_time NUMERIC,
  bundle_size INTEGER,
  memory_usage NUMERIC,
  fcp NUMERIC,
  lcp NUMERIC,
  fid NUMERIC,
  cls NUMERIC,
  connection_type VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  performance_score NUMERIC DEFAULT 8.4,
  PRIMARY KEY (id)
);

-- Indexes for performance_metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);


-- Table: affordable_brand_products
-- Rows: 9
DROP TABLE IF EXISTS affordable_brand_products CASCADE;
DROP SEQUENCE IF EXISTS affordable_brand_products_id_seq CASCADE;
CREATE SEQUENCE affordable_brand_products_id_seq;
CREATE TABLE affordable_brand_products (
  id SERIAL NOT NULL,
  brand_name VARCHAR(100) NOT NULL,
  brand_website TEXT,
  product_name VARCHAR(200) NOT NULL,
  product_category VARCHAR(100) NOT NULL,
  price_euros NUMERIC NOT NULL,
  amateur_budget_tier VARCHAR(50) NOT NULL,
  affordability_rating INTEGER,
  quality_rating INTEGER,
  value_for_money INTEGER,
  best_for VARCHAR(200),
  considerations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for affordable_brand_products
CREATE INDEX IF NOT EXISTS idx_affordable_brand_products_created_at ON affordable_brand_products(created_at DESC);


-- Table: hydration_research_studies
-- Rows: 2
DROP TABLE IF EXISTS hydration_research_studies CASCADE;
DROP SEQUENCE IF EXISTS hydration_research_studies_id_seq CASCADE;
CREATE SEQUENCE hydration_research_studies_id_seq;
CREATE TABLE hydration_research_studies (
  id SERIAL NOT NULL,
  study_title TEXT NOT NULL,
  authors TEXT[] NOT NULL,
  publication_year INTEGER NOT NULL,
  journal VARCHAR(255),
  doi VARCHAR(255),
  pubmed_id VARCHAR(50),
  study_type VARCHAR(100),
  evidence_level VARCHAR(50),
  sample_size INTEGER,
  population_studied TEXT,
  key_findings TEXT[],
  effect_size NUMERIC,
  confidence_interval_lower NUMERIC,
  confidence_interval_upper NUMERIC,
  p_value NUMERIC,
  practical_applications TEXT[],
  limitations TEXT[],
  recommendations TEXT[],
  sport_specific VARCHAR(100),
  competition_level VARCHAR(100),
  citation_count INTEGER DEFAULT 0,
  impact_factor NUMERIC,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for hydration_research_studies
CREATE INDEX IF NOT EXISTS idx_hydration_research_studies_created_at ON hydration_research_studies(created_at DESC);


-- Table: user_behavior
-- Rows: 2
DROP TABLE IF EXISTS user_behavior CASCADE;
DROP SEQUENCE IF EXISTS user_behavior_id_seq CASCADE;
CREATE SEQUENCE user_behavior_id_seq;
CREATE TABLE user_behavior (
  id SERIAL NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  page_sequence TEXT[],
  session_duration INTEGER,
  total_page_views INTEGER,
  bounce_rate BOOLEAN,
  features_used TEXT[],
  training_sessions_completed INTEGER DEFAULT 0,
  goals_created INTEGER DEFAULT 0,
  conversion_events TEXT[],
  funnel_stage VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  entry_page TEXT,
  exit_page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for user_behavior
CREATE INDEX IF NOT EXISTS idx_user_behavior_created_at ON user_behavior(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior(user_id);


-- Table: ifaf_flag_rankings
-- Rows: 10
DROP TABLE IF EXISTS ifaf_flag_rankings CASCADE;
DROP SEQUENCE IF EXISTS ifaf_flag_rankings_id_seq CASCADE;
CREATE SEQUENCE ifaf_flag_rankings_id_seq;
CREATE TABLE ifaf_flag_rankings (
  id SERIAL NOT NULL,
  country VARCHAR(100) NOT NULL,
  gender VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  rank INTEGER NOT NULL,
  points NUMERIC NOT NULL,
  previous_rank INTEGER,
  points_change NUMERIC,
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  last_match_date DATE,
  ranking_period VARCHAR(20) NOT NULL,
  ranking_date DATE NOT NULL,
  update_date TIMESTAMPTZ DEFAULT NOW(),
  data_source VARCHAR(100) DEFAULT 'ifaf_official'::character varying,
  confidence_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for ifaf_flag_rankings
CREATE INDEX IF NOT EXISTS idx_ifaf_flag_rankings_created_at ON ifaf_flag_rankings(created_at DESC);


-- Table: implementation_steps
-- Rows: 6
DROP TABLE IF EXISTS implementation_steps CASCADE;
DROP SEQUENCE IF EXISTS implementation_steps_id_seq CASCADE;
CREATE SEQUENCE implementation_steps_id_seq;
CREATE TABLE implementation_steps (
  id SERIAL NOT NULL,
  user_id UUID NOT NULL,
  step_name VARCHAR(200) NOT NULL,
  step_description TEXT NOT NULL,
  step_category VARCHAR(100) NOT NULL,
  step_order INTEGER NOT NULL,
  estimated_duration_days INTEGER NOT NULL,
  dependencies TEXT[],
  required_resources TEXT[],
  success_criteria TEXT[] NOT NULL,
  step_status VARCHAR(50) DEFAULT 'pending'::character varying,
  start_date DATE,
  completion_date DATE,
  actual_duration_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for implementation_steps
CREATE INDEX IF NOT EXISTS idx_implementation_steps_created_at ON implementation_steps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_implementation_steps_user_id ON implementation_steps(user_id);


-- Table: users
-- Rows: 8
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  position VARCHAR(20),
  experience_level VARCHAR(20) DEFAULT 'beginner'::character varying,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  birth_date DATE,
  profile_picture VARCHAR(500),
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  full_name VARCHAR(255),
  PRIMARY KEY (id)
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);


-- Table: altitude_environmental_factors
-- Rows: 4
DROP TABLE IF EXISTS altitude_environmental_factors CASCADE;
DROP SEQUENCE IF EXISTS altitude_environmental_factors_id_seq CASCADE;
CREATE SEQUENCE altitude_environmental_factors_id_seq;
CREATE TABLE altitude_environmental_factors (
  id SERIAL NOT NULL,
  location_id VARCHAR(100) NOT NULL,
  location_name VARCHAR(200) NOT NULL,
  altitude_meters INTEGER NOT NULL,
  altitude_feet INTEGER,
  atmospheric_pressure_hpa NUMERIC,
  oxygen_saturation_percent NUMERIC,
  temperature_lapse_rate NUMERIC,
  humidity_variation_percent NUMERIC,
  wind_patterns JSONB,
  acclimatization_requirements_days INTEGER,
  performance_impact_percentage NUMERIC,
  health_considerations TEXT[],
  training_recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for altitude_environmental_factors
CREATE INDEX IF NOT EXISTS idx_altitude_environmental_factors_created_at ON altitude_environmental_factors(created_at DESC);


-- Table: wada_prohibited_substances
-- Rows: 5
DROP TABLE IF EXISTS wada_prohibited_substances CASCADE;
DROP SEQUENCE IF EXISTS wada_prohibited_substances_id_seq CASCADE;
CREATE SEQUENCE wada_prohibited_substances_id_seq;
CREATE TABLE wada_prohibited_substances (
  id SERIAL NOT NULL,
  substance_name VARCHAR(255) NOT NULL,
  substance_category VARCHAR(100),
  prohibited_status VARCHAR(50),
  wada_code VARCHAR(20),
  risk_level VARCHAR(50),
  prohibition_start_date DATE,
  prohibition_end_date DATE,
  prohibition_reason TEXT,
  exceptions TEXT[],
  detection_window_days INTEGER,
  common_sources TEXT[],
  cross_contamination_risk BOOLEAN DEFAULT false,
  flag_football_relevance VARCHAR(50),
  position_specific_risks TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for wada_prohibited_substances
CREATE INDEX IF NOT EXISTS idx_wada_prohibited_substances_created_at ON wada_prohibited_substances(created_at DESC);


-- Table: training_analytics
-- Rows: 3
DROP TABLE IF EXISTS training_analytics CASCADE;
DROP SEQUENCE IF EXISTS training_analytics_id_seq CASCADE;
CREATE SEQUENCE training_analytics_id_seq;
CREATE TABLE training_analytics (
  id SERIAL NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  training_type VARCHAR(100),
  duration_minutes INTEGER,
  exercises_completed INTEGER,
  difficulty_level VARCHAR(50),
  performance_score NUMERIC,
  goals_achieved INTEGER DEFAULT 0,
  personal_best BOOLEAN DEFAULT false,
  improvement_percentage NUMERIC,
  weather_conditions VARCHAR(100),
  location_type VARCHAR(100),
  equipment_used TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for training_analytics
CREATE INDEX IF NOT EXISTS idx_training_analytics_created_at ON training_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_analytics_user_id ON training_analytics(user_id);


-- Table: ifaf_elo_ratings
-- Rows: 5
DROP TABLE IF EXISTS ifaf_elo_ratings CASCADE;
DROP SEQUENCE IF EXISTS ifaf_elo_ratings_id_seq CASCADE;
CREATE SEQUENCE ifaf_elo_ratings_id_seq;
CREATE TABLE ifaf_elo_ratings (
  id SERIAL NOT NULL,
  country VARCHAR(100) NOT NULL,
  gender VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  elo_rating NUMERIC NOT NULL,
  rating_date DATE NOT NULL,
  previous_rating NUMERIC,
  rating_change NUMERIC,
  k_factor NUMERIC DEFAULT 32.0,
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  loss_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for ifaf_elo_ratings
CREATE INDEX IF NOT EXISTS idx_ifaf_elo_ratings_created_at ON ifaf_elo_ratings(created_at DESC);


-- Table: supplement_wada_compliance
-- Rows: 5
DROP TABLE IF EXISTS supplement_wada_compliance CASCADE;
DROP SEQUENCE IF EXISTS supplement_wada_compliance_id_seq CASCADE;
CREATE SEQUENCE supplement_wada_compliance_id_seq;
CREATE TABLE supplement_wada_compliance (
  id SERIAL NOT NULL,
  supplement_name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  wada_status VARCHAR(50),
  contamination_risk_percentage NUMERIC,
  banned_substances_detected TEXT[],
  testing_frequency VARCHAR(50),
  third_party_tested BOOLEAN DEFAULT false,
  testing_organization VARCHAR(255),
  last_test_date DATE,
  test_result VARCHAR(50),
  flag_football_safe BOOLEAN DEFAULT true,
  recommended_for_position TEXT[],
  usage_guidelines TEXT,
  compliance_notes TEXT,
  risk_mitigation_strategies TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for supplement_wada_compliance
CREATE INDEX IF NOT EXISTS idx_supplement_wada_compliance_created_at ON supplement_wada_compliance(created_at DESC);


-- Table: premium_brand_analysis
-- Rows: 5
DROP TABLE IF EXISTS premium_brand_analysis CASCADE;
DROP SEQUENCE IF EXISTS premium_brand_analysis_id_seq CASCADE;
CREATE SEQUENCE premium_brand_analysis_id_seq;
CREATE TABLE premium_brand_analysis (
  id SERIAL NOT NULL,
  brand_name VARCHAR(100) NOT NULL,
  brand_website TEXT,
  brand_category VARCHAR(100) NOT NULL,
  target_market VARCHAR(100) NOT NULL,
  price_positioning VARCHAR(50) NOT NULL,
  quality_rating INTEGER,
  amateur_accessibility INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for premium_brand_analysis
CREATE INDEX IF NOT EXISTS idx_premium_brand_analysis_created_at ON premium_brand_analysis(created_at DESC);


-- Table: supplement_evidence_grades
-- Rows: 3
DROP TABLE IF EXISTS supplement_evidence_grades CASCADE;
DROP SEQUENCE IF EXISTS supplement_evidence_grades_id_seq CASCADE;
CREATE SEQUENCE supplement_evidence_grades_id_seq;
CREATE TABLE supplement_evidence_grades (
  id SERIAL NOT NULL,
  supplement_id INTEGER NOT NULL,
  evidence_grade VARCHAR(10) NOT NULL,
  grade_calculation_date DATE NOT NULL,
  total_studies INTEGER NOT NULL,
  high_quality_studies INTEGER NOT NULL,
  positive_outcome_studies INTEGER NOT NULL,
  negative_outcome_studies INTEGER NOT NULL,
  neutral_outcome_studies INTEGER NOT NULL,
  overall_effect_size NUMERIC,
  consistency_score NUMERIC,
  publication_bias_assessment VARCHAR(50),
  sample_size_adequacy VARCHAR(50),
  study_duration_adequacy VARCHAR(50),
  population_relevance_score NUMERIC,
  flag_football_specific_score NUMERIC,
  final_grade_justification TEXT,
  grade_reviewer VARCHAR(200),
  next_review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for supplement_evidence_grades
CREATE INDEX IF NOT EXISTS idx_supplement_evidence_grades_created_at ON supplement_evidence_grades(created_at DESC);


-- Table: supplement_interactions
-- Rows: 3
DROP TABLE IF EXISTS supplement_interactions CASCADE;
DROP SEQUENCE IF EXISTS supplement_interactions_id_seq CASCADE;
CREATE SEQUENCE supplement_interactions_id_seq;
CREATE TABLE supplement_interactions (
  id SERIAL NOT NULL,
  supplement1_id INTEGER NOT NULL,
  supplement2_id INTEGER NOT NULL,
  interaction_type VARCHAR(100) NOT NULL,
  interaction_severity VARCHAR(50) NOT NULL,
  mechanism_of_interaction TEXT,
  clinical_evidence TEXT,
  recommendations TEXT[],
  contraindications TEXT[],
  monitoring_requirements TEXT[],
  evidence_level VARCHAR(50),
  citation_references TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for supplement_interactions
CREATE INDEX IF NOT EXISTS idx_supplement_interactions_created_at ON supplement_interactions(created_at DESC);


-- Table: supplement_research
-- Rows: 6
DROP TABLE IF EXISTS supplement_research CASCADE;
DROP SEQUENCE IF EXISTS supplement_research_id_seq CASCADE;
CREATE SEQUENCE supplement_research_id_seq;
CREATE TABLE supplement_research (
  id SERIAL NOT NULL,
  supplement_id INTEGER,
  study_reference VARCHAR(255) NOT NULL,
  study_title TEXT NOT NULL,
  authors TEXT[] NOT NULL,
  journal VARCHAR(255),
  publication_year INTEGER,
  doi VARCHAR(255),
  pmid INTEGER,
  population_description TEXT NOT NULL,
  sample_size INTEGER,
  study_duration_weeks INTEGER,
  dose_studied_mg_per_kg NUMERIC,
  dose_studied_mg_per_day NUMERIC,
  dosing_frequency VARCHAR(100),
  loading_phase_days INTEGER,
  maintenance_phase_days INTEGER,
  outcome_measures TEXT[] NOT NULL,
  primary_outcome TEXT NOT NULL,
  effect_size NUMERIC,
  statistical_significance BOOLEAN DEFAULT false,
  p_value NUMERIC,
  confidence_interval_lower NUMERIC,
  confidence_interval_upper NUMERIC,
  clinical_significance TEXT,
  adverse_events TEXT[],
  dropout_rate NUMERIC,
  study_quality_score INTEGER,
  risk_of_bias TEXT[],
  limitations TEXT[],
  practical_applications TEXT[],
  flag_football_relevance VARCHAR(50),
  position_specific_benefits TEXT[],
  evidence_level VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for supplement_research
CREATE INDEX IF NOT EXISTS idx_supplement_research_created_at ON supplement_research(created_at DESC);


-- Table: local_premium_alternatives
-- Rows: 11
DROP TABLE IF EXISTS local_premium_alternatives CASCADE;
DROP SEQUENCE IF EXISTS local_premium_alternatives_id_seq CASCADE;
CREATE SEQUENCE local_premium_alternatives_id_seq;
CREATE TABLE local_premium_alternatives (
  id SERIAL NOT NULL,
  premium_brand_id INTEGER,
  local_alternative_type VARCHAR(100) NOT NULL,
  local_alternative_name VARCHAR(200) NOT NULL,
  local_alternative_cost_euros NUMERIC NOT NULL,
  accessibility_rating INTEGER,
  effectiveness_comparison NUMERIC NOT NULL,
  location_requirements VARCHAR(100),
  availability_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for local_premium_alternatives
CREATE INDEX IF NOT EXISTS idx_local_premium_alternatives_created_at ON local_premium_alternatives(created_at DESC);


-- Table: affordable_equipment
-- Rows: 7
DROP TABLE IF EXISTS affordable_equipment CASCADE;
DROP SEQUENCE IF EXISTS affordable_equipment_id_seq CASCADE;
CREATE SEQUENCE affordable_equipment_id_seq;
CREATE TABLE affordable_equipment (
  id SERIAL NOT NULL,
  equipment_name VARCHAR(200) NOT NULL,
  equipment_category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  price_range_min NUMERIC NOT NULL,
  price_range_max NUMERIC NOT NULL,
  where_to_buy TEXT[],
  diy_alternatives TEXT[],
  expected_lifespan_months INTEGER,
  maintenance_requirements TEXT[],
  performance_benefit TEXT,
  priority_for_amateur VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for affordable_equipment
CREATE INDEX IF NOT EXISTS idx_affordable_equipment_created_at ON affordable_equipment(created_at DESC);


-- Table: team_resources
-- Rows: 6
DROP TABLE IF EXISTS team_resources CASCADE;
DROP SEQUENCE IF EXISTS team_resources_id_seq CASCADE;
CREATE SEQUENCE team_resources_id_seq;
CREATE TABLE team_resources (
  id SERIAL NOT NULL,
  resource_name VARCHAR(200) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  one_time_cost NUMERIC NOT NULL,
  per_athlete_share NUMERIC NOT NULL,
  total_athletes_capacity INTEGER NOT NULL,
  current_utilization_percentage NUMERIC DEFAULT 0,
  ownership_model VARCHAR(50) NOT NULL,
  location VARCHAR(200),
  availability_status VARCHAR(50) DEFAULT 'available'::character varying,
  maintenance_schedule TEXT[],
  insurance_coverage JSONB,
  depreciation_years INTEGER,
  expected_lifespan_years INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for team_resources
CREATE INDEX IF NOT EXISTS idx_team_resources_created_at ON team_resources(created_at DESC);


-- Table: environmental_adjustments
-- Rows: 5
DROP TABLE IF EXISTS environmental_adjustments CASCADE;
DROP SEQUENCE IF EXISTS environmental_adjustments_id_seq CASCADE;
CREATE SEQUENCE environmental_adjustments_id_seq;
CREATE TABLE environmental_adjustments (
  id SERIAL NOT NULL,
  protocol_id INTEGER NOT NULL,
  protocol_type VARCHAR(100) NOT NULL,
  environmental_parameter VARCHAR(100) NOT NULL,
  adjustment_factor NUMERIC NOT NULL,
  adjustment_type VARCHAR(50) NOT NULL,
  adjustment_description TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL,
  threshold_operator VARCHAR(10) NOT NULL,
  adjustment_magnitude NUMERIC,
  adjustment_unit VARCHAR(50),
  evidence_level VARCHAR(50),
  citation_references TEXT[],
  contraindications TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for environmental_adjustments
CREATE INDEX IF NOT EXISTS idx_environmental_adjustments_created_at ON environmental_adjustments(created_at DESC);


-- Table: realistic_budget_categories
-- Rows: 7
DROP TABLE IF EXISTS realistic_budget_categories CASCADE;
DROP SEQUENCE IF EXISTS realistic_budget_categories_id_seq CASCADE;
CREATE SEQUENCE realistic_budget_categories_id_seq;
CREATE TABLE realistic_budget_categories (
  id SERIAL NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  category_description TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  min_spend_euros NUMERIC NOT NULL,
  max_spend_euros NUMERIC NOT NULL,
  priority_level VARCHAR(20),
  expected_roi_percentage NUMERIC,
  diy_alternatives TEXT[],
  local_resource_options TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for realistic_budget_categories
CREATE INDEX IF NOT EXISTS idx_realistic_budget_categories_created_at ON realistic_budget_categories(created_at DESC);


-- Table: equipment_price_tracking
-- Rows: 1
DROP TABLE IF EXISTS equipment_price_tracking CASCADE;
DROP SEQUENCE IF EXISTS equipment_price_tracking_id_seq CASCADE;
CREATE SEQUENCE equipment_price_tracking_id_seq;
CREATE TABLE equipment_price_tracking (
  id SERIAL NOT NULL,
  equipment_name VARCHAR(200) NOT NULL,
  source_url TEXT,
  source_name VARCHAR(100),
  price_euros NUMERIC NOT NULL,
  date_found DATE NOT NULL,
  availability_status VARCHAR(50) DEFAULT 'available'::character varying,
  shipping_cost_euros NUMERIC,
  total_cost_euros NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for equipment_price_tracking
CREATE INDEX IF NOT EXISTS idx_equipment_price_tracking_created_at ON equipment_price_tracking(created_at DESC);


-- Table: equipment_alternatives_comparison
-- Rows: 9
DROP TABLE IF EXISTS equipment_alternatives_comparison CASCADE;
DROP SEQUENCE IF EXISTS equipment_alternatives_comparison_id_seq CASCADE;
CREATE SEQUENCE equipment_alternatives_comparison_id_seq;
CREATE TABLE equipment_alternatives_comparison (
  id SERIAL NOT NULL,
  primary_equipment_id INTEGER,
  alternative_name VARCHAR(200) NOT NULL,
  alternative_cost_euros NUMERIC NOT NULL,
  effectiveness_comparison NUMERIC NOT NULL,
  convenience_rating INTEGER,
  space_requirements VARCHAR(100),
  setup_time_minutes INTEGER,
  maintenance_effort VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for equipment_alternatives_comparison
CREATE INDEX IF NOT EXISTS idx_equipment_alternatives_comparison_created_at ON equipment_alternatives_comparison(created_at DESC);


-- Table: premium_product_alternatives
-- Rows: 13
DROP TABLE IF EXISTS premium_product_alternatives CASCADE;
DROP SEQUENCE IF EXISTS premium_product_alternatives_id_seq CASCADE;
CREATE SEQUENCE premium_product_alternatives_id_seq;
CREATE TABLE premium_product_alternatives (
  id SERIAL NOT NULL,
  premium_brand_id INTEGER,
  premium_product_name VARCHAR(200) NOT NULL,
  premium_product_price_euros NUMERIC NOT NULL,
  premium_product_features TEXT[],
  affordable_alternative_name VARCHAR(200) NOT NULL,
  affordable_alternative_price_euros NUMERIC NOT NULL,
  cost_savings_euros NUMERIC NOT NULL,
  effectiveness_comparison NUMERIC NOT NULL,
  alternative_source VARCHAR(100),
  alternative_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for premium_product_alternatives
CREATE INDEX IF NOT EXISTS idx_premium_product_alternatives_created_at ON premium_product_alternatives(created_at DESC);


-- Table: budget_friendly_alternatives
-- Rows: 8
DROP TABLE IF EXISTS budget_friendly_alternatives CASCADE;
DROP SEQUENCE IF EXISTS budget_friendly_alternatives_id_seq CASCADE;
CREATE SEQUENCE budget_friendly_alternatives_id_seq;
CREATE TABLE budget_friendly_alternatives (
  id SERIAL NOT NULL,
  affordable_brand_product_id INTEGER,
  alternative_name VARCHAR(200) NOT NULL,
  alternative_cost_euros NUMERIC NOT NULL,
  cost_savings_euros NUMERIC NOT NULL,
  effectiveness_comparison NUMERIC NOT NULL,
  alternative_source VARCHAR(100),
  best_for_budget_tier VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for budget_friendly_alternatives
CREATE INDEX IF NOT EXISTS idx_budget_friendly_alternatives_created_at ON budget_friendly_alternatives(created_at DESC);


-- Table: supplement_protocols
-- Rows: 3
DROP TABLE IF EXISTS supplement_protocols CASCADE;
DROP SEQUENCE IF EXISTS supplement_protocols_id_seq CASCADE;
CREATE SEQUENCE supplement_protocols_id_seq;
CREATE TABLE supplement_protocols (
  id SERIAL NOT NULL,
  user_id UUID NOT NULL,
  supplement_id INTEGER NOT NULL,
  goal VARCHAR(200) NOT NULL,
  recommended_dose_mg_per_kg NUMERIC,
  recommended_dose_mg_per_day NUMERIC,
  dosing_frequency VARCHAR(100) NOT NULL,
  loading_phase_days INTEGER,
  maintenance_phase_days INTEGER,
  timing_relative_to_exercise VARCHAR(100),
  administration_method VARCHAR(100),
  cycle_duration_weeks INTEGER,
  break_duration_weeks INTEGER,
  safety_flags TEXT[],
  contraindications TEXT[],
  drug_interactions TEXT[],
  wada_compliance_status VARCHAR(50) DEFAULT 'compliant'::character varying,
  evidence_strength VARCHAR(50),
  expected_benefits TEXT[],
  expected_timeline_weeks INTEGER,
  monitoring_parameters TEXT[],
  success_metrics TEXT[],
  risk_assessment_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for supplement_protocols
CREATE INDEX IF NOT EXISTS idx_supplement_protocols_created_at ON supplement_protocols(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplement_protocols_user_id ON supplement_protocols(user_id);


-- Table: amateur_training_programs
-- Rows: 3
DROP TABLE IF EXISTS amateur_training_programs CASCADE;
DROP SEQUENCE IF EXISTS amateur_training_programs_id_seq CASCADE;
CREATE SEQUENCE amateur_training_programs_id_seq;
CREATE TABLE amateur_training_programs (
  id SERIAL NOT NULL,
  program_name VARCHAR(200) NOT NULL,
  program_type VARCHAR(100) NOT NULL,
  skill_level VARCHAR(20),
  equipment_required TEXT[],
  space_requirements VARCHAR(100),
  time_per_session_minutes INTEGER NOT NULL,
  sessions_per_week INTEGER NOT NULL,
  program_duration_weeks INTEGER NOT NULL,
  exercises TEXT[] NOT NULL,
  progression_plan TEXT[],
  safety_guidelines TEXT[],
  expected_results TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for amateur_training_programs
CREATE INDEX IF NOT EXISTS idx_amateur_training_programs_created_at ON amateur_training_programs(created_at DESC);


-- Table: cost_effective_alternatives
-- Rows: 5
DROP TABLE IF EXISTS cost_effective_alternatives CASCADE;
DROP SEQUENCE IF EXISTS cost_effective_alternatives_id_seq CASCADE;
CREATE SEQUENCE cost_effective_alternatives_id_seq;
CREATE TABLE cost_effective_alternatives (
  id SERIAL NOT NULL,
  premium_solution VARCHAR(200) NOT NULL,
  premium_cost_euros NUMERIC NOT NULL,
  affordable_alternative VARCHAR(200) NOT NULL,
  alternative_cost_euros NUMERIC NOT NULL,
  cost_savings_euros NUMERIC NOT NULL,
  effectiveness_comparison TEXT NOT NULL,
  trade_offs TEXT[],
  when_to_consider_premium TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for cost_effective_alternatives
CREATE INDEX IF NOT EXISTS idx_cost_effective_alternatives_created_at ON cost_effective_alternatives(created_at DESC);


-- Table: budget_categories
-- Rows: 7
DROP TABLE IF EXISTS budget_categories CASCADE;
DROP SEQUENCE IF EXISTS budget_categories_id_seq CASCADE;
CREATE SEQUENCE budget_categories_id_seq;
CREATE TABLE budget_categories (
  id SERIAL NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  category_description TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  recommended_min_spend NUMERIC,
  recommended_max_spend NUMERIC,
  priority_level VARCHAR(20),
  expected_roi_percentage NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for budget_categories
CREATE INDEX IF NOT EXISTS idx_budget_categories_created_at ON budget_categories(created_at DESC);


-- Table: realistic_performance_plans
-- Rows: 3
DROP TABLE IF EXISTS realistic_performance_plans CASCADE;
DROP SEQUENCE IF EXISTS realistic_performance_plans_id_seq CASCADE;
CREATE SEQUENCE realistic_performance_plans_id_seq;
CREATE TABLE realistic_performance_plans (
  id SERIAL NOT NULL,
  plan_name VARCHAR(200) NOT NULL,
  budget_tier VARCHAR(50) NOT NULL,
  total_budget_euros NUMERIC NOT NULL,
  target_athlete_profile TEXT NOT NULL,
  plan_description TEXT NOT NULL,
  core_components TEXT[] NOT NULL,
  expected_outcomes TEXT[] NOT NULL,
  timeline_weeks INTEGER NOT NULL,
  equipment_requirements TEXT[],
  local_resource_needs TEXT[],
  diy_protocols_included TEXT[],
  cost_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for realistic_performance_plans
CREATE INDEX IF NOT EXISTS idx_realistic_performance_plans_created_at ON realistic_performance_plans(created_at DESC);


-- Table: diy_protocols
-- Rows: 4
DROP TABLE IF EXISTS diy_protocols CASCADE;
DROP SEQUENCE IF EXISTS diy_protocols_id_seq CASCADE;
CREATE SEQUENCE diy_protocols_id_seq;
CREATE TABLE diy_protocols (
  id SERIAL NOT NULL,
  protocol_name VARCHAR(200) NOT NULL,
  protocol_type VARCHAR(100) NOT NULL,
  target_outcome VARCHAR(200) NOT NULL,
  equipment_needed TEXT[],
  time_required_minutes INTEGER NOT NULL,
  difficulty_level VARCHAR(20),
  step_by_step_instructions TEXT[],
  video_tutorial_url TEXT,
  safety_considerations TEXT[],
  effectiveness_rating INTEGER,
  cost_savings_euros NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for diy_protocols
CREATE INDEX IF NOT EXISTS idx_diy_protocols_created_at ON diy_protocols(created_at DESC);


-- Table: ifaf_hydration_protocols
-- Rows: 2
DROP TABLE IF EXISTS ifaf_hydration_protocols CASCADE;
DROP SEQUENCE IF EXISTS ifaf_hydration_protocols_id_seq CASCADE;
CREATE SEQUENCE ifaf_hydration_protocols_id_seq;
CREATE TABLE ifaf_hydration_protocols (
  id SERIAL NOT NULL,
  competition_type VARCHAR(100),
  competition_level VARCHAR(50),
  games_per_day INTEGER,
  game_duration_minutes INTEGER,
  total_playing_time_minutes INTEGER,
  time_between_games_minutes INTEGER,
  typical_temperature_celsius NUMERIC,
  typical_humidity_percentage NUMERIC,
  indoor_outdoor VARCHAR(20),
  altitude_meters INTEGER,
  pre_game_hydration_ml_per_kg NUMERIC,
  pre_game_timing_hours NUMERIC,
  during_game_hydration_ml_per_15min NUMERIC,
  between_games_hydration_ml_per_kg NUMERIC,
  post_game_hydration_ml_per_kg NUMERIC,
  sodium_mg_per_liter NUMERIC,
  potassium_mg_per_liter NUMERIC,
  magnesium_mg_per_liter NUMERIC,
  calcium_mg_per_liter NUMERIC,
  urine_color_target INTEGER,
  body_weight_loss_limit_kg NUMERIC,
  cognitive_test_recommendations TEXT[],
  research_studies INT4[],
  evidence_strength VARCHAR(50),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for ifaf_hydration_protocols
CREATE INDEX IF NOT EXISTS idx_ifaf_hydration_protocols_created_at ON ifaf_hydration_protocols(created_at DESC);


-- Table: budget_nutrition_plans
-- Rows: 2
DROP TABLE IF EXISTS budget_nutrition_plans CASCADE;
DROP SEQUENCE IF EXISTS budget_nutrition_plans_id_seq CASCADE;
CREATE SEQUENCE budget_nutrition_plans_id_seq;
CREATE TABLE budget_nutrition_plans (
  id SERIAL NOT NULL,
  plan_name VARCHAR(200) NOT NULL,
  budget_per_month_euros NUMERIC NOT NULL,
  target_calories INTEGER,
  target_protein_g INTEGER,
  meal_plan_structure TEXT[],
  shopping_list TEXT[],
  cost_breakdown JSONB,
  time_saving_tips TEXT[],
  batch_cooking_instructions TEXT[],
  supplement_recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for budget_nutrition_plans
CREATE INDEX IF NOT EXISTS idx_budget_nutrition_plans_created_at ON budget_nutrition_plans(created_at DESC);


-- Table: european_championship_protocols
-- Rows: 2
DROP TABLE IF EXISTS european_championship_protocols CASCADE;
DROP SEQUENCE IF EXISTS european_championship_protocols_id_seq CASCADE;
CREATE SEQUENCE european_championship_protocols_id_seq;
CREATE TABLE european_championship_protocols (
  id SERIAL NOT NULL,
  championship_year INTEGER NOT NULL,
  host_country VARCHAR(100),
  climate_zone VARCHAR(100),
  teams_participating INTEGER,
  games_per_team INTEGER,
  tournament_duration_days INTEGER,
  average_temperature_celsius NUMERIC,
  average_humidity_percentage NUMERIC,
  altitude_variations_meters INT4[],
  pre_tournament_hydration_protocol TEXT,
  daily_hydration_targets_ml_per_kg NUMERIC,
  between_games_hydration_strategy TEXT,
  recovery_hydration_protocol TEXT,
  hydration_status_checks_per_day INTEGER,
  body_weight_monitoring_frequency VARCHAR(50),
  cognitive_testing_schedule TEXT[],
  hydration_related_injuries INTEGER,
  performance_consistency_score NUMERIC,
  athlete_feedback_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for european_championship_protocols
CREATE INDEX IF NOT EXISTS idx_european_championship_protocols_created_at ON european_championship_protocols(created_at DESC);


-- Table: world_championship_protocols
-- Rows: 2
DROP TABLE IF EXISTS world_championship_protocols CASCADE;
DROP SEQUENCE IF EXISTS world_championship_protocols_id_seq CASCADE;
CREATE SEQUENCE world_championship_protocols_id_seq;
CREATE TABLE world_championship_protocols (
  id SERIAL NOT NULL,
  championship_year INTEGER NOT NULL,
  host_country VARCHAR(100),
  climate_zone VARCHAR(100),
  teams_participating INTEGER,
  qualification_process TEXT,
  tournament_format VARCHAR(100),
  climate_variations_across_venues TEXT[],
  altitude_challenges TEXT[],
  travel_impact_on_hydration TEXT[],
  personalized_hydration_plans BOOLEAN,
  real_time_hydration_monitoring BOOLEAN,
  emergency_hydration_protocols TEXT[],
  data_collection_protocols TEXT[],
  performance_correlation_studies BOOLEAN,
  long_term_follow_up_studies BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for world_championship_protocols
CREATE INDEX IF NOT EXISTS idx_world_championship_protocols_created_at ON world_championship_protocols(created_at DESC);


-- Table: olympic_games_protocols
-- Rows: 1
DROP TABLE IF EXISTS olympic_games_protocols CASCADE;
DROP SEQUENCE IF EXISTS olympic_games_protocols_id_seq CASCADE;
CREATE SEQUENCE olympic_games_protocols_id_seq;
CREATE TABLE olympic_games_protocols (
  id SERIAL NOT NULL,
  olympic_year INTEGER NOT NULL,
  host_city VARCHAR(100),
  flag_football_status VARCHAR(50),
  anti_doping_compliance TEXT[],
  international_standards_application TEXT[],
  cultural_dietary_considerations TEXT[],
  wearable_technology_integration BOOLEAN,
  real_time_biometric_monitoring BOOLEAN,
  ai_powered_hydration_optimization BOOLEAN,
  research_collaborations TEXT[],
  knowledge_transfer_programs TEXT[],
  long_term_impact_studies BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for olympic_games_protocols
CREATE INDEX IF NOT EXISTS idx_olympic_games_protocols_created_at ON olympic_games_protocols(created_at DESC);


-- Table: performance_plan_templates
-- Rows: 6
DROP TABLE IF EXISTS performance_plan_templates CASCADE;
DROP SEQUENCE IF EXISTS performance_plan_templates_id_seq CASCADE;
CREATE SEQUENCE performance_plan_templates_id_seq;
CREATE TABLE performance_plan_templates (
  id SERIAL NOT NULL,
  template_name VARCHAR(200) NOT NULL,
  template_description TEXT NOT NULL,
  template_category VARCHAR(100) NOT NULL,
  target_athlete_type VARCHAR(100) NOT NULL,
  budget_range_min NUMERIC,
  budget_range_max NUMERIC,
  timeline_weeks INTEGER NOT NULL,
  core_pillars TEXT[] NOT NULL,
  recommended_resources TEXT[],
  success_metrics TEXT[],
  template_status VARCHAR(50) DEFAULT 'active'::character varying,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for performance_plan_templates
CREATE INDEX IF NOT EXISTS idx_performance_plan_templates_created_at ON performance_plan_templates(created_at DESC);


-- Table: creatine_research
-- Rows: 2
DROP TABLE IF EXISTS creatine_research CASCADE;
DROP SEQUENCE IF EXISTS creatine_research_id_seq CASCADE;
CREATE SEQUENCE creatine_research_id_seq;
CREATE TABLE creatine_research (
  id SERIAL NOT NULL,
  research_study_id INTEGER,
  creatine_form VARCHAR(100),
  dosage_mg_per_kg NUMERIC,
  loading_phase_days INTEGER,
  maintenance_dose_mg_per_day NUMERIC,
  strength_improvement_percentage NUMERIC,
  power_improvement_percentage NUMERIC,
  sprint_performance_improvement NUMERIC,
  muscle_mass_gain_kg NUMERIC,
  side_effects TEXT[],
  contraindications TEXT[],
  long_term_safety_data BOOLEAN,
  flag_football_relevance_score INTEGER,
  position_specific_benefits TEXT[],
  study_duration_weeks INTEGER,
  population_size INTEGER,
  control_group_used BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for creatine_research
CREATE INDEX IF NOT EXISTS idx_creatine_research_created_at ON creatine_research(created_at DESC);


-- Table: flag_football_positions
-- Rows: 10
DROP TABLE IF EXISTS flag_football_positions CASCADE;
DROP SEQUENCE IF EXISTS flag_football_positions_id_seq CASCADE;
CREATE SEQUENCE flag_football_positions_id_seq;
CREATE TABLE flag_football_positions (
  id SERIAL NOT NULL,
  position_name VARCHAR(100) NOT NULL,
  position_category VARCHAR(50) NOT NULL,
  primary_responsibilities TEXT[] NOT NULL,
  physical_requirements JSONB,
  technical_skills TEXT[] NOT NULL,
  tactical_understanding TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for flag_football_positions
CREATE INDEX IF NOT EXISTS idx_flag_football_positions_created_at ON flag_football_positions(created_at DESC);


-- Table: national_team_profiles
-- Rows: 3
DROP TABLE IF EXISTS national_team_profiles CASCADE;
DROP SEQUENCE IF EXISTS national_team_profiles_id_seq CASCADE;
CREATE SEQUENCE national_team_profiles_id_seq;
CREATE TABLE national_team_profiles (
  id SERIAL NOT NULL,
  team_id UUID NOT NULL,
  federation VARCHAR(200) NOT NULL,
  country_code VARCHAR(3) NOT NULL,
  contact_info JSONB,
  coaching_staff JSONB,
  play_style TEXT[] NOT NULL,
  formation_preferences TEXT[],
  key_players TEXT[],
  home_venue VARCHAR(200),
  training_facility VARCHAR(200),
  federation_established_year INTEGER,
  ifaf_member_since DATE,
  world_ranking_history JSONB,
  major_tournament_results JSONB,
  development_programs TEXT[],
  financial_resources VARCHAR(50),
  player_pool_size INTEGER,
  professional_league BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for national_team_profiles
CREATE INDEX IF NOT EXISTS idx_national_team_profiles_created_at ON national_team_profiles(created_at DESC);


-- Table: success_indicators
-- Rows: 20
DROP TABLE IF EXISTS success_indicators CASCADE;
DROP SEQUENCE IF EXISTS success_indicators_id_seq CASCADE;
CREATE SEQUENCE success_indicators_id_seq;
CREATE TABLE success_indicators (
  id SERIAL NOT NULL,
  indicator_name VARCHAR(200) NOT NULL,
  indicator_description TEXT NOT NULL,
  indicator_domain VARCHAR(100) NOT NULL,
  target_value NUMERIC,
  target_unit VARCHAR(50),
  baseline_value NUMERIC,
  current_value NUMERIC,
  improvement_target_percentage NUMERIC,
  measurement_frequency VARCHAR(50) NOT NULL,
  measurement_tool VARCHAR(200) NOT NULL,
  verification_method TEXT NOT NULL,
  priority_level VARCHAR(20),
  indicator_status VARCHAR(50) DEFAULT 'active'::character varying,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for success_indicators
CREATE INDEX IF NOT EXISTS idx_success_indicators_created_at ON success_indicators(created_at DESC);


-- Table: community_activation_events
-- Rows: 12
DROP TABLE IF EXISTS community_activation_events CASCADE;
DROP SEQUENCE IF EXISTS community_activation_events_id_seq CASCADE;
CREATE SEQUENCE community_activation_events_id_seq;
CREATE TABLE community_activation_events (
  id SERIAL NOT NULL,
  event_name VARCHAR(200) NOT NULL,
  event_description TEXT NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  event_format VARCHAR(100),
  prizes_awards TEXT[],
  success_criteria TEXT[],
  event_status VARCHAR(50) DEFAULT 'planned'::character varying,
  participation_rate_percentage NUMERIC DEFAULT 0,
  event_impact_score INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for community_activation_events
CREATE INDEX IF NOT EXISTS idx_community_activation_events_created_at ON community_activation_events(created_at DESC);


-- Table: training_hydration_protocols
-- Rows: 2
DROP TABLE IF EXISTS training_hydration_protocols CASCADE;
DROP SEQUENCE IF EXISTS training_hydration_protocols_id_seq CASCADE;
CREATE SEQUENCE training_hydration_protocols_id_seq;
CREATE TABLE training_hydration_protocols (
  id SERIAL NOT NULL,
  training_type VARCHAR(100),
  training_duration_minutes INTEGER,
  training_intensity VARCHAR(50),
  pre_training_hydration_ml_per_kg NUMERIC,
  pre_training_timing_hours NUMERIC,
  during_training_hydration_ml_per_15min NUMERIC,
  post_training_hydration_ml_per_kg NUMERIC,
  sodium_replacement_mg_per_hour NUMERIC,
  potassium_replacement_mg_per_hour NUMERIC,
  temperature_adjustment_factor NUMERIC,
  humidity_adjustment_factor NUMERIC,
  altitude_adjustment_factor NUMERIC,
  maintain_performance_threshold NUMERIC,
  cognitive_function_maintenance BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for training_hydration_protocols
CREATE INDEX IF NOT EXISTS idx_training_hydration_protocols_created_at ON training_hydration_protocols(created_at DESC);


-- Table: supplements
-- Rows: 3
DROP TABLE IF EXISTS supplements CASCADE;
DROP SEQUENCE IF EXISTS supplements_id_seq CASCADE;
CREATE SEQUENCE supplements_id_seq;
CREATE TABLE supplements (
  id SERIAL NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  active_ingredients JSONB,
  serving_size VARCHAR(100),
  servings_per_container INTEGER,
  evidence_level VARCHAR(50),
  safety_rating VARCHAR(50),
  banned_substance_risk VARCHAR(50),
  performance_benefits TEXT[],
  recommended_timing VARCHAR(100),
  recommended_dosage TEXT,
  duration_of_use TEXT,
  drug_interactions TEXT[],
  food_interactions TEXT[],
  side_effects TEXT[],
  contraindications TEXT[],
  research_summary TEXT,
  key_studies TEXT[],
  brand VARCHAR(255),
  cost_per_serving NUMERIC,
  third_party_tested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for supplements
CREATE INDEX IF NOT EXISTS idx_supplements_created_at ON supplements(created_at DESC);


-- Table: sleep_optimization_protocols
-- Rows: 3
DROP TABLE IF EXISTS sleep_optimization_protocols CASCADE;
DROP SEQUENCE IF EXISTS sleep_optimization_protocols_id_seq CASCADE;
CREATE SEQUENCE sleep_optimization_protocols_id_seq;
CREATE TABLE sleep_optimization_protocols (
  id SERIAL NOT NULL,
  recovery_protocol_id INTEGER,
  recommended_sleep_duration_hours NUMERIC,
  sleep_efficiency_target_percentage INTEGER,
  deep_sleep_target_percentage INTEGER,
  rem_sleep_target_percentage INTEGER,
  pre_sleep_routine_duration_minutes INTEGER,
  bedroom_temperature_celsius NUMERIC,
  light_exposure_guidelines TEXT[],
  electronic_device_cutoff_hours NUMERIC,
  pre_sleep_nutrition_guidelines TEXT[],
  sleep_promoting_supplements TEXT[],
  supplements_to_avoid TEXT[],
  caffeine_cutoff_hours INTEGER,
  alcohol_recommendations TEXT,
  room_darkness_requirements TEXT,
  noise_management TEXT[],
  bedding_recommendations TEXT[],
  air_quality_factors TEXT[],
  performance_improvement_with_optimization NUMERIC,
  injury_risk_reduction_percentage NUMERIC,
  cognitive_performance_benefits TEXT[],
  immune_function_benefits TEXT[],
  recommended_tracking_metrics TEXT[],
  tracking_devices TEXT[],
  travel_sleep_strategies TEXT[],
  competition_sleep_preparation TEXT[],
  training_camp_sleep_optimization TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for sleep_optimization_protocols
CREATE INDEX IF NOT EXISTS idx_sleep_optimization_protocols_created_at ON sleep_optimization_protocols(created_at DESC);


-- Table: sprint_training_categories
-- Rows: 4
DROP TABLE IF EXISTS sprint_training_categories CASCADE;
DROP SEQUENCE IF EXISTS sprint_training_categories_id_seq CASCADE;
CREATE SEQUENCE sprint_training_categories_id_seq;
CREATE TABLE sprint_training_categories (
  id SERIAL NOT NULL,
  name VARCHAR(100) NOT NULL,
  category_type VARCHAR(50),
  description TEXT,
  elite_method_origin VARCHAR(50),
  equipment_needed TEXT[],
  difficulty_level INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for sprint_training_categories
CREATE INDEX IF NOT EXISTS idx_sprint_training_categories_created_at ON sprint_training_categories(created_at DESC);


-- Table: sprint_workouts
-- Rows: 8
DROP TABLE IF EXISTS sprint_workouts CASCADE;
DROP SEQUENCE IF EXISTS sprint_workouts_id_seq CASCADE;
CREATE SEQUENCE sprint_workouts_id_seq;
CREATE TABLE sprint_workouts (
  id SERIAL NOT NULL,
  category_id INTEGER,
  phase_id INTEGER,
  name VARCHAR(200) NOT NULL,
  distance_yards INTEGER,
  intensity_percentage INTEGER,
  rest_duration_seconds INTEGER,
  sets INTEGER,
  reps_per_set INTEGER,
  recovery_between_sets_seconds INTEGER,
  surface_type VARCHAR(50),
  gradient_percentage INTEGER,
  coaching_cues TEXT[],
  elite_application_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for sprint_workouts
CREATE INDEX IF NOT EXISTS idx_sprint_workouts_created_at ON sprint_workouts(created_at DESC);


-- Table: sprint_training_phases
-- Rows: 4
DROP TABLE IF EXISTS sprint_training_phases CASCADE;
DROP SEQUENCE IF EXISTS sprint_training_phases_id_seq CASCADE;
CREATE SEQUENCE sprint_training_phases_id_seq;
CREATE TABLE sprint_training_phases (
  id SERIAL NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  intensity_focus VARCHAR(50),
  volume_percentage INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for sprint_training_phases
CREATE INDEX IF NOT EXISTS idx_sprint_training_phases_created_at ON sprint_training_phases(created_at DESC);


-- Table: agility_patterns
-- Rows: 5
DROP TABLE IF EXISTS agility_patterns CASCADE;
DROP SEQUENCE IF EXISTS agility_patterns_id_seq CASCADE;
CREATE SEQUENCE agility_patterns_id_seq;
CREATE TABLE agility_patterns (
  id SERIAL NOT NULL,
  name VARCHAR(100) NOT NULL,
  pattern_type VARCHAR(50),
  setup_description TEXT,
  cone_spacing_yards INTEGER,
  total_distance_yards INTEGER,
  direction_changes_count INTEGER,
  execution_instructions TEXT[],
  flag_football_application TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for agility_patterns
CREATE INDEX IF NOT EXISTS idx_agility_patterns_created_at ON agility_patterns(created_at DESC);


-- Table: sprint_recovery_protocols
-- Rows: 4
DROP TABLE IF EXISTS sprint_recovery_protocols CASCADE;
DROP SEQUENCE IF EXISTS sprint_recovery_protocols_id_seq CASCADE;
CREATE SEQUENCE sprint_recovery_protocols_id_seq;
CREATE TABLE sprint_recovery_protocols (
  id SERIAL NOT NULL,
  name VARCHAR(100) NOT NULL,
  recovery_type VARCHAR(50),
  duration_minutes INTEGER,
  temperature_fahrenheit INTEGER,
  instructions TEXT,
  effectiveness_percentage INTEGER,
  recommended_timing VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for sprint_recovery_protocols
CREATE INDEX IF NOT EXISTS idx_sprint_recovery_protocols_created_at ON sprint_recovery_protocols(created_at DESC);


-- Table: player_archetypes
-- Rows: 5
DROP TABLE IF EXISTS player_archetypes CASCADE;
DROP SEQUENCE IF EXISTS player_archetypes_id_seq CASCADE;
CREATE SEQUENCE player_archetypes_id_seq;
CREATE TABLE player_archetypes (
  id SERIAL NOT NULL,
  archetype_name VARCHAR(100) NOT NULL,
  description TEXT,
  speed_rating_min INTEGER,
  speed_rating_max INTEGER,
  agility_rating_min INTEGER,
  agility_rating_max INTEGER,
  power_rating_min INTEGER,
  power_rating_max INTEGER,
  ideal_sports_backgrounds TEXT[],
  secondary_sports_backgrounds TEXT[],
  position_suitability JSONB,
  ten_yard_sprint_target NUMERIC,
  forty_yard_sprint_target NUMERIC,
  l_drill_target NUMERIC,
  vertical_jump_target INTEGER,
  broad_jump_target INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for player_archetypes
CREATE INDEX IF NOT EXISTS idx_player_archetypes_created_at ON player_archetypes(created_at DESC);


-- Table: position_requirements
-- Rows: 5
DROP TABLE IF EXISTS position_requirements CASCADE;
DROP SEQUENCE IF EXISTS position_requirements_id_seq CASCADE;
CREATE SEQUENCE position_requirements_id_seq;
CREATE TABLE position_requirements (
  id SERIAL NOT NULL,
  position_name VARCHAR(50) NOT NULL,
  speed_importance INTEGER,
  acceleration_importance INTEGER,
  agility_importance INTEGER,
  power_importance INTEGER,
  endurance_importance INTEGER,
  route_running_importance INTEGER,
  catching_importance INTEGER,
  evasion_importance INTEGER,
  flag_pulling_importance INTEGER,
  decision_making_importance INTEGER,
  reaction_time_importance INTEGER,
  field_vision_importance INTEGER,
  leadership_importance INTEGER,
  key_techniques TEXT[],
  common_training_focus TEXT[],
  elite_benchmarks JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for position_requirements
CREATE INDEX IF NOT EXISTS idx_position_requirements_created_at ON position_requirements(created_at DESC);


-- Table: sports_crossover_analysis
-- Rows: 3
DROP TABLE IF EXISTS sports_crossover_analysis CASCADE;
DROP SEQUENCE IF EXISTS sports_crossover_analysis_id_seq CASCADE;
CREATE SEQUENCE sports_crossover_analysis_id_seq;
CREATE TABLE sports_crossover_analysis (
  id SERIAL NOT NULL,
  source_sport VARCHAR(100) NOT NULL,
  overall_transfer_rating INTEGER,
  speed_transfer NUMERIC,
  agility_transfer NUMERIC,
  technical_transfer NUMERIC,
  tactical_transfer NUMERIC,
  transferable_skills TEXT[],
  skills_requiring_development TEXT[],
  optimal_positions TEXT[],
  secondary_positions TEXT[],
  recommended_training_emphasis TEXT[],
  common_weaknesses_to_address TEXT[],
  research_evidence TEXT,
  professional_examples TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for sports_crossover_analysis
CREATE INDEX IF NOT EXISTS idx_sports_crossover_analysis_created_at ON sports_crossover_analysis(created_at DESC);


-- Table: defensive_schemes
-- Rows: 4
DROP TABLE IF EXISTS defensive_schemes CASCADE;
DROP SEQUENCE IF EXISTS defensive_schemes_id_seq CASCADE;
CREATE SEQUENCE defensive_schemes_id_seq;
CREATE TABLE defensive_schemes (
  id SERIAL NOT NULL,
  scheme_name VARCHAR(10) NOT NULL,
  description TEXT,
  blitzers_count INTEGER,
  defensive_backs_count INTEGER,
  scheme_strengths TEXT[],
  scheme_weaknesses TEXT[],
  ideal_situations TEXT[],
  player_requirements JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for defensive_schemes
CREATE INDEX IF NOT EXISTS idx_defensive_schemes_created_at ON defensive_schemes(created_at DESC);


-- Table: nfl_combine_benchmarks
-- Rows: 10
DROP TABLE IF EXISTS nfl_combine_benchmarks CASCADE;
DROP SEQUENCE IF EXISTS nfl_combine_benchmarks_id_seq CASCADE;
CREATE SEQUENCE nfl_combine_benchmarks_id_seq;
CREATE TABLE nfl_combine_benchmarks (
  id SERIAL NOT NULL,
  position VARCHAR(50),
  test_name VARCHAR(100),
  record_time NUMERIC,
  record_holder VARCHAR(100),
  record_year INTEGER,
  elite_threshold NUMERIC,
  good_threshold NUMERIC,
  average_nfl_threshold NUMERIC,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for nfl_combine_benchmarks
CREATE INDEX IF NOT EXISTS idx_nfl_combine_benchmarks_created_at ON nfl_combine_benchmarks(created_at DESC);


-- Table: flag_football_performance_levels
-- Rows: 20
DROP TABLE IF EXISTS flag_football_performance_levels CASCADE;
DROP SEQUENCE IF EXISTS flag_football_performance_levels_id_seq CASCADE;
CREATE SEQUENCE flag_football_performance_levels_id_seq;
CREATE TABLE flag_football_performance_levels (
  id SERIAL NOT NULL,
  level_name VARCHAR(50),
  position VARCHAR(50),
  test_name VARCHAR(100),
  male_target NUMERIC,
  female_target NUMERIC,
  percentage_of_nfl_elite NUMERIC,
  description TEXT,
  training_focus TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for flag_football_performance_levels
CREATE INDEX IF NOT EXISTS idx_flag_football_performance_levels_created_at ON flag_football_performance_levels(created_at DESC);


-- Table: nfl_combine_performances
-- Rows: 7
DROP TABLE IF EXISTS nfl_combine_performances CASCADE;
DROP SEQUENCE IF EXISTS nfl_combine_performances_id_seq CASCADE;
CREATE SEQUENCE nfl_combine_performances_id_seq;
CREATE TABLE nfl_combine_performances (
  id SERIAL NOT NULL,
  player_name VARCHAR(150) NOT NULL,
  position VARCHAR(50) NOT NULL,
  college VARCHAR(100),
  draft_year INTEGER,
  draft_round INTEGER,
  draft_pick INTEGER,
  height_inches INTEGER,
  weight_pounds INTEGER,
  forty_yard_dash NUMERIC,
  ten_yard_split NUMERIC,
  twenty_yard_split NUMERIC,
  three_cone_drill NUMERIC,
  twenty_yard_shuttle NUMERIC,
  vertical_jump NUMERIC,
  broad_jump INTEGER,
  bench_press_reps INTEGER,
  nfl_seasons_played INTEGER,
  career_achievements TEXT[],
  career_stats JSONB,
  success_rating INTEGER,
  combine_year INTEGER,
  notable_achievements TEXT[],
  current_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for nfl_combine_performances
CREATE INDEX IF NOT EXISTS idx_nfl_combine_performances_created_at ON nfl_combine_performances(created_at DESC);


-- Table: game_day_workflows
-- Rows: 6
DROP TABLE IF EXISTS game_day_workflows CASCADE;
DROP SEQUENCE IF EXISTS game_day_workflows_id_seq CASCADE;
CREATE SEQUENCE game_day_workflows_id_seq;
CREATE TABLE game_day_workflows (
  id SERIAL NOT NULL,
  workflow_name VARCHAR(200) NOT NULL,
  workflow_type VARCHAR(100) NOT NULL,
  workflow_steps JSONB NOT NULL,
  estimated_duration_minutes INTEGER,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for game_day_workflows
CREATE INDEX IF NOT EXISTS idx_game_day_workflows_created_at ON game_day_workflows(created_at DESC);


-- Table: sleep_guidelines
-- Rows: 6
DROP TABLE IF EXISTS sleep_guidelines CASCADE;
DROP SEQUENCE IF EXISTS sleep_guidelines_id_seq CASCADE;
CREATE SEQUENCE sleep_guidelines_id_seq;
CREATE TABLE sleep_guidelines (
  id SERIAL NOT NULL,
  evidence_level VARCHAR(50) NOT NULL,
  recommendation TEXT NOT NULL,
  citation_id VARCHAR(255),
  citation_title TEXT,
  citation_authors TEXT[],
  citation_journal VARCHAR(255),
  citation_year INTEGER,
  citation_doi VARCHAR(255),
  target_athlete_type VARCHAR(100),
  target_age_group VARCHAR(50),
  target_position VARCHAR(100),
  sleep_phase VARCHAR(50),
  implementation_steps TEXT[],
  expected_benefits TEXT[],
  contraindications TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for sleep_guidelines
CREATE INDEX IF NOT EXISTS idx_sleep_guidelines_created_at ON sleep_guidelines(created_at DESC);


-- Table: digital_wellness_protocols
-- Rows: 6
DROP TABLE IF EXISTS digital_wellness_protocols CASCADE;
DROP SEQUENCE IF EXISTS digital_wellness_protocols_id_seq CASCADE;
CREATE SEQUENCE digital_wellness_protocols_id_seq;
CREATE TABLE digital_wellness_protocols (
  id SERIAL NOT NULL,
  protocol_name VARCHAR(200) NOT NULL,
  protocol_description TEXT NOT NULL,
  target_cognitive_issue VARCHAR(100),
  evidence_level VARCHAR(50) NOT NULL,
  implementation_duration_weeks INTEGER NOT NULL,
  daily_digital_time_limit_hours NUMERIC,
  screen_free_blocks_hours NUMERIC[],
  app_usage_restrictions JSONB,
  notification_management JSONB,
  digital_detox_periods JSONB,
  alternative_activities TEXT[],
  cognitive_enhancement_exercises TEXT[],
  sleep_hygiene_guidelines TEXT[],
  stress_reduction_techniques TEXT[],
  success_metrics TEXT[],
  expected_improvements JSONB,
  contraindications TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for digital_wellness_protocols
CREATE INDEX IF NOT EXISTS idx_digital_wellness_protocols_created_at ON digital_wellness_protocols(created_at DESC);


-- Table: cognitive_recovery_protocols
-- Rows: 3
DROP TABLE IF EXISTS cognitive_recovery_protocols CASCADE;
DROP SEQUENCE IF EXISTS cognitive_recovery_protocols_id_seq CASCADE;
CREATE SEQUENCE cognitive_recovery_protocols_id_seq;
CREATE TABLE cognitive_recovery_protocols (
  id SERIAL NOT NULL,
  protocol_name VARCHAR(200) NOT NULL,
  protocol_description TEXT NOT NULL,
  recovery_type VARCHAR(100),
  recovery_duration_minutes INTEGER NOT NULL,
  recovery_intensity VARCHAR(50),
  digital_restrictions JSONB,
  cognitive_activities TEXT[],
  physical_activities TEXT[],
  environmental_requirements JSONB,
  recovery_metrics TEXT[],
  expected_outcomes TEXT[],
  contraindications TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for cognitive_recovery_protocols
CREATE INDEX IF NOT EXISTS idx_cognitive_recovery_protocols_created_at ON cognitive_recovery_protocols(created_at DESC);


-- Table: environmental_recovery_protocols
-- Rows: 3
DROP TABLE IF EXISTS environmental_recovery_protocols CASCADE;
DROP SEQUENCE IF EXISTS environmental_recovery_protocols_id_seq CASCADE;
CREATE SEQUENCE environmental_recovery_protocols_id_seq;
CREATE TABLE environmental_recovery_protocols (
  id SERIAL NOT NULL,
  protocol_name VARCHAR(200) NOT NULL,
  environmental_condition VARCHAR(100) NOT NULL,
  protocol_description TEXT NOT NULL,
  recovery_duration_minutes INTEGER NOT NULL,
  temperature_requirements_celsius JSONB,
  humidity_requirements_percent JSONB,
  altitude_requirements_meters JSONB,
  recovery_modalities TEXT[],
  hydration_protocols JSONB,
  nutrition_protocols JSONB,
  contraindications TEXT[],
  evidence_level VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for environmental_recovery_protocols
CREATE INDEX IF NOT EXISTS idx_environmental_recovery_protocols_created_at ON environmental_recovery_protocols(created_at DESC);


-- Table: performance_competencies
-- Rows: 8
DROP TABLE IF EXISTS performance_competencies CASCADE;
DROP SEQUENCE IF EXISTS performance_competencies_id_seq CASCADE;
CREATE SEQUENCE performance_competencies_id_seq;
CREATE TABLE performance_competencies (
  id SERIAL NOT NULL,
  competency_name VARCHAR(200) NOT NULL,
  competency_category VARCHAR(100) NOT NULL,
  competency_description TEXT NOT NULL,
  position_specific BOOLEAN DEFAULT false,
  applicable_positions TEXT[],
  competency_levels JSONB,
  assessment_methods TEXT[],
  development_activities TEXT[],
  benchmark_standards JSONB,
  evidence_level VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for performance_competencies
CREATE INDEX IF NOT EXISTS idx_performance_competencies_created_at ON performance_competencies(created_at DESC);


-- Table: team_chemistry
-- Rows: 1
DROP TABLE IF EXISTS team_chemistry CASCADE;
DROP SEQUENCE IF EXISTS team_chemistry_id_seq CASCADE;
CREATE SEQUENCE team_chemistry_id_seq;
CREATE TABLE team_chemistry (
  id SERIAL NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  overall_chemistry NUMERIC DEFAULT 8.4,
  communication_score NUMERIC DEFAULT 9.1,
  trust_score NUMERIC DEFAULT 8.7,
  cohesion_score NUMERIC DEFAULT 8.2,
  leadership_score NUMERIC DEFAULT 8.2,
  last_intervention TEXT DEFAULT 'Trust building exercise'::text,
  intervention_effectiveness INTEGER DEFAULT 87,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for team_chemistry
CREATE INDEX IF NOT EXISTS idx_team_chemistry_created_at ON team_chemistry(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_chemistry_user_id ON team_chemistry(user_id);


-- Table: notifications
-- Rows: 3
DROP TABLE IF EXISTS notifications CASCADE;
DROP SEQUENCE IF EXISTS notifications_id_seq CASCADE;
CREATE SEQUENCE notifications_id_seq;
CREATE TABLE notifications (
  id SERIAL NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'medium'::character varying,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);


-- Table: daily_quotes
-- Rows: 3
DROP TABLE IF EXISTS daily_quotes CASCADE;
DROP SEQUENCE IF EXISTS daily_quotes_id_seq CASCADE;
CREATE SEQUENCE daily_quotes_id_seq;
CREATE TABLE daily_quotes (
  id SERIAL NOT NULL,
  quote_text TEXT NOT NULL,
  author VARCHAR(200) NOT NULL,
  category VARCHAR(100) DEFAULT 'motivation'::character varying,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for daily_quotes
CREATE INDEX IF NOT EXISTS idx_daily_quotes_created_at ON daily_quotes(created_at DESC);


-- Table: olympic_qualification
-- Rows: 1
DROP TABLE IF EXISTS olympic_qualification CASCADE;
DROP SEQUENCE IF EXISTS olympic_qualification_id_seq CASCADE;
CREATE SEQUENCE olympic_qualification_id_seq;
CREATE TABLE olympic_qualification (
  id SERIAL NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  qualification_probability INTEGER DEFAULT 73,
  world_ranking INTEGER DEFAULT 8,
  days_until_championship INTEGER DEFAULT 124,
  european_championship_date DATE DEFAULT '2025-09-24'::date,
  world_championship_date DATE DEFAULT '2026-07-15'::date,
  olympic_date DATE DEFAULT '2028-07-14'::date,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for olympic_qualification
CREATE INDEX IF NOT EXISTS idx_olympic_qualification_created_at ON olympic_qualification(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_olympic_qualification_user_id ON olympic_qualification(user_id);


-- Table: performance_benchmarks
-- Rows: 4
DROP TABLE IF EXISTS performance_benchmarks CASCADE;
DROP SEQUENCE IF EXISTS performance_benchmarks_id_seq CASCADE;
CREATE SEQUENCE performance_benchmarks_id_seq;
CREATE TABLE performance_benchmarks (
  id SERIAL NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  current_value NUMERIC NOT NULL,
  target_value NUMERIC NOT NULL,
  unit VARCHAR(20) DEFAULT ''::character varying,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for performance_benchmarks
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_created_at ON performance_benchmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_user_id ON performance_benchmarks(user_id);


-- Table: sponsor_rewards
-- Rows: 1
DROP TABLE IF EXISTS sponsor_rewards CASCADE;
DROP SEQUENCE IF EXISTS sponsor_rewards_id_seq CASCADE;
CREATE SEQUENCE sponsor_rewards_id_seq;
CREATE TABLE sponsor_rewards (
  id SERIAL NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  available_points INTEGER DEFAULT 2847,
  current_tier VARCHAR(50) DEFAULT 'GOLD'::character varying,
  products_available INTEGER DEFAULT 236,
  tier_progress_percentage INTEGER DEFAULT 65,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for sponsor_rewards
CREATE INDEX IF NOT EXISTS idx_sponsor_rewards_created_at ON sponsor_rewards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_rewards_user_id ON sponsor_rewards(user_id);


-- Table: sponsor_products
-- Rows: 4
DROP TABLE IF EXISTS sponsor_products CASCADE;
DROP SEQUENCE IF EXISTS sponsor_products_id_seq CASCADE;
CREATE SEQUENCE sponsor_products_id_seq;
CREATE TABLE sponsor_products (
  id SERIAL NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  points_cost INTEGER NOT NULL,
  relevance_score INTEGER DEFAULT 90,
  category VARCHAR(100) DEFAULT 'Gear'::character varying,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for sponsor_products
CREATE INDEX IF NOT EXISTS idx_sponsor_products_created_at ON sponsor_products(created_at DESC);


-- Table: wearables_data
-- Rows: 1
DROP TABLE IF EXISTS wearables_data CASCADE;
DROP SEQUENCE IF EXISTS wearables_data_id_seq CASCADE;
CREATE SEQUENCE wearables_data_id_seq;
CREATE TABLE wearables_data (
  id SERIAL NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  device_type VARCHAR(100) DEFAULT 'Apple Watch'::character varying,
  heart_rate INTEGER DEFAULT 142,
  hrv INTEGER DEFAULT 38,
  sleep_score INTEGER DEFAULT 87,
  training_load INTEGER DEFAULT 247,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  connection_status VARCHAR(50) DEFAULT 'connected'::character varying,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Indexes for wearables_data
CREATE INDEX IF NOT EXISTS idx_wearables_data_created_at ON wearables_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wearables_data_user_id ON wearables_data(user_id);

