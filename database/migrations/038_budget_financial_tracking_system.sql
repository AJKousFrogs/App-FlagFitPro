-- Migration: Budget & Financial Tracking System
-- This migration adds comprehensive budget management and financial tracking for the performance plan

-- 1. ANNUAL BUDGET SNAPSHOTS
CREATE TABLE IF NOT EXISTS annual_budget_snapshots (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    budget_year INTEGER NOT NULL,
    total_budget DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    budget_status VARCHAR(50) DEFAULT 'active', -- 'draft', 'active', 'completed', 'archived'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BUDGET CATEGORIES AND RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS budget_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_description TEXT NOT NULL,
    why_it_matters TEXT NOT NULL,
    recommended_min_spend DECIMAL(8,2),
    recommended_max_spend DECIMAL(8,2),
    priority_level VARCHAR(20) CHECK (priority_level IN ('critical', 'high', 'medium', 'low')),
    expected_roi_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BUDGET LINE ITEMS
CREATE TABLE IF NOT EXISTS budget_line_items (
    id SERIAL PRIMARY KEY,
    budget_snapshot_id INTEGER NOT NULL REFERENCES annual_budget_snapshots(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    item_description TEXT,
    estimated_cost DECIMAL(8,2) NOT NULL,
    actual_cost DECIMAL(8,2),
    purchase_date DATE,
    vendor VARCHAR(200),
    item_status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'purchased', 'cancelled', 'returned'
    priority_rank INTEGER CHECK (priority_rank >= 1 AND priority_rank <= 10),
    expected_benefits TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SPENDING TRACKING
CREATE TABLE IF NOT EXISTS spending_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    budget_line_item_id INTEGER REFERENCES budget_line_items(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    amount DECIMAL(8,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'refund', 'adjustment', 'transfer'
    payment_method VARCHAR(100),
    vendor VARCHAR(200),
    receipt_url TEXT,
    category VARCHAR(100),
    description TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BUDGET VS ACTUAL ANALYSIS
CREATE TABLE IF NOT EXISTS budget_vs_actual_analysis (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    budget_year INTEGER NOT NULL,
    category_id INTEGER NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
    budgeted_amount DECIMAL(8,2) NOT NULL,
    actual_spent DECIMAL(8,2) NOT NULL,
    variance_amount DECIMAL(8,2) NOT NULL,
    variance_percentage DECIMAL(5,2) NOT NULL,
    variance_status VARCHAR(20) CHECK (variance_status IN ('under_budget', 'on_budget', 'over_budget')),
    analysis_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. FINANCIAL GOALS AND TARGETS
CREATE TABLE IF NOT EXISTS financial_goals (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_name VARCHAR(200) NOT NULL,
    goal_description TEXT NOT NULL,
    target_amount DECIMAL(8,2) NOT NULL,
    current_amount DECIMAL(8,2) DEFAULT 0,
    target_date DATE NOT NULL,
    goal_type VARCHAR(50) NOT NULL, -- 'savings', 'spending_limit', 'investment', 'debt_reduction'
    priority_level VARCHAR(20) CHECK (priority_level IN ('critical', 'high', 'medium', 'low')),
    goal_status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. COST-BENEFIT ANALYSIS
CREATE TABLE IF NOT EXISTS cost_benefit_analysis (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    investment_item VARCHAR(200) NOT NULL,
    investment_cost DECIMAL(8,2) NOT NULL,
    expected_benefits TEXT[] NOT NULL,
    expected_roi_percentage DECIMAL(5,2),
    payback_period_months INTEGER,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    alternative_options TEXT[],
    decision_factors TEXT[],
    final_decision VARCHAR(50), -- 'approved', 'rejected', 'deferred', 'alternative_selected'
    decision_date DATE,
    decision_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. FINANCIAL REPORTS AND ANALYTICS
CREATE TABLE IF NOT EXISTS financial_reports (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(100) NOT NULL, -- 'monthly_summary', 'quarterly_analysis', 'annual_review', 'category_breakdown'
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    total_budgeted DECIMAL(10,2) NOT NULL,
    total_spent DECIMAL(10,2) NOT NULL,
    total_saved DECIMAL(10,2) NOT NULL,
    savings_rate_percentage DECIMAL(5,2),
    top_spending_categories JSONB,
    budget_compliance_score DECIMAL(5,2),
    recommendations TEXT[],
    report_data JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_annual_budget_snapshots_user_year ON annual_budget_snapshots(user_id, budget_year);
CREATE INDEX IF NOT EXISTS idx_budget_line_items_snapshot ON budget_line_items(budget_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_budget_line_items_category ON budget_line_items(category_id);
CREATE INDEX IF NOT EXISTS idx_spending_transactions_user_date ON spending_transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_spending_transactions_category ON spending_transactions(category);
CREATE INDEX IF NOT EXISTS idx_budget_vs_actual_user_year ON budget_vs_actual_analysis(user_id, budget_year);
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_status ON financial_goals(user_id, goal_status);
CREATE INDEX IF NOT EXISTS idx_cost_benefit_user_decision ON cost_benefit_analysis(user_id, final_decision);
CREATE INDEX IF NOT EXISTS idx_financial_reports_user_type ON financial_reports(user_id, report_type);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_annual_budget_snapshots_unique ON annual_budget_snapshots(user_id, budget_year);
CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_vs_actual_unique ON budget_vs_actual_analysis(user_id, budget_year, category_id);

-- Insert sample budget categories based on the performance plan
INSERT INTO budget_categories (category_name, category_description, why_it_matters, recommended_min_spend, recommended_max_spend, priority_level, expected_roi_percentage) VALUES
('Sleep & Recovery Tech', 'Technology and equipment for optimizing sleep quality and recovery', 'Accelerates muscle repair, boosts cognition, improves performance consistency', 1300.00, 2000.00, 'critical', 85.0),
('Nutrition & Meal Prep', 'Food services, supplements, and meal preparation tools', 'Fuels training, supports immunity, provides consistent energy levels', 1200.00, 1800.00, 'critical', 90.0),
('Training & Coaching', 'Flag-specific coaching, strength programs, and skill development', 'Reduces injury risk, optimizes progress, improves technique', 1000.00, 2000.00, 'high', 75.0),
('Preventive Medical & Bodywork', 'Physio check-ups, massage, mobility classes, and health screenings', 'Keeps athletes on the field, prevents injuries, maintains health', 700.00, 1500.00, 'high', 80.0),
('Sport-Science Tooling', 'GPS trackers, heart rate monitors, and analytics platforms', 'Provides objective data for smarter training decisions', 500.00, 900.00, 'medium', 70.0),
('Evidence-Based Supplements', 'Creatine, caffeine, beta-alanine, and other proven supplements', 'Small but meaningful performance edge with scientific backing', 300.00, 600.00, 'medium', 60.0),
('Competition & Travel Buffer', 'Tournament costs, travel expenses, and contingency funds', 'Ensures participation in competitions and handles unexpected costs', 0.00, 1000.00, 'low', 50.0);

-- Sample budget line items will be inserted after budget snapshots are created
-- INSERT INTO budget_line_items (budget_snapshot_id, category_id, item_name, item_description, estimated_cost, priority_rank, expected_benefits) VALUES
-- (1, 1, 'Smart Ring/Watch', 'Oura Ring or Apple Watch for sleep and recovery tracking', 300.00, 1, ARRAY['sleep_stage_tracking', 'hrv_monitoring', 'recovery_insights']),
-- (1, 1, 'High-End Mattress', 'Premium mattress for optimal sleep quality', 800.00, 2, ARRAY['better_sleep_quality', 'improved_recovery', 'reduced_back_pain']),
-- (1, 1, 'Blackout Kit', 'Complete blackout solution for bedroom', 200.00, 3, ARRAY['deeper_sleep', 'better_circadian_rhythm', 'improved_sleep_efficiency']),
-- (1, 1, 'Compression Boots', 'NormaTec or similar compression recovery system', 200.00, 4, ARRAY['faster_recovery', 'reduced_soreness', 'improved_circulation']),
-- (1, 1, 'Recovery Tools', 'Foam roller, massage gun, and mobility tools', 200.00, 5, ARRAY['self_massage', 'mobility_improvement', 'recovery_acceleration']);

-- Create function to calculate budget variance
CREATE OR REPLACE FUNCTION calculate_budget_variance(
    user_id_param UUID,
    budget_year_param INTEGER
) RETURNS JSONB AS $$
DECLARE
    variance_data JSONB;
    category_record RECORD;
BEGIN
    variance_data := '[]'::jsonb;
    
    FOR category_record IN 
        SELECT 
            bc.id as category_id,
            bc.category_name,
            bc.recommended_min_spend,
            bc.recommended_max_spend,
            COALESCE(SUM(bli.estimated_cost), 0) as budgeted_amount,
            COALESCE(SUM(st.amount), 0) as actual_spent
        FROM budget_categories bc
        LEFT JOIN budget_line_items bli ON bc.id = bli.category_id
        LEFT JOIN annual_budget_snapshots abs ON bli.budget_snapshot_id = abs.id
        LEFT JOIN spending_transactions st ON bli.id = st.budget_line_item_id
        WHERE abs.user_id = user_id_param 
        AND abs.budget_year = budget_year_param
        GROUP BY bc.id, bc.category_name, bc.recommended_min_spend, bc.recommended_max_spend
        ORDER BY bc.priority_level DESC
    LOOP
        variance_data := variance_data || jsonb_build_object(
            'category_id', category_record.category_id,
            'category_name', category_record.category_name,
            'budgeted_amount', category_record.budgeted_amount,
            'actual_spent', category_record.actual_spent,
            'variance_amount', category_record.budgeted_amount - category_record.actual_spent,
            'variance_percentage', CASE 
                WHEN category_record.budgeted_amount > 0 
                THEN ((category_record.budgeted_amount - category_record.actual_spent) / category_record.budgeted_amount) * 100
                ELSE 0 
            END,
            'recommended_range', jsonb_build_object(
                'min', category_record.recommended_min_spend,
                'max', category_record.recommended_max_spend
            )
        );
    END LOOP;
    
    RETURN variance_data;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate financial report
CREATE OR REPLACE FUNCTION generate_financial_report(
    user_id_param UUID,
    report_type_param VARCHAR,
    period_start DATE,
    period_end DATE
) RETURNS JSONB AS $$
DECLARE
    report_data JSONB;
    total_budgeted DECIMAL := 0;
    total_spent DECIMAL := 0;
    category_breakdown JSONB;
BEGIN
    -- Calculate totals
    SELECT 
        COALESCE(SUM(bli.estimated_cost), 0),
        COALESCE(SUM(st.amount), 0)
    INTO total_budgeted, total_spent
    FROM budget_line_items bli
    JOIN annual_budget_snapshots abs ON bli.budget_snapshot_id = abs.id
    LEFT JOIN spending_transactions st ON bli.id = st.budget_line_item_id
    WHERE abs.user_id = user_id_param
    AND abs.budget_year = EXTRACT(YEAR FROM period_start);
    
    -- Get category breakdown
    SELECT jsonb_agg(
        jsonb_build_object(
            'category_name', bc.category_name,
            'budgeted', COALESCE(SUM(bli.estimated_cost), 0),
            'spent', COALESCE(SUM(st.amount), 0),
            'variance', COALESCE(SUM(bli.estimated_cost), 0) - COALESCE(SUM(st.amount), 0)
        )
    ) INTO category_breakdown
    FROM budget_categories bc
    LEFT JOIN budget_line_items bli ON bc.id = bli.category_id
    LEFT JOIN annual_budget_snapshots abs ON bli.budget_snapshot_id = abs.id
    LEFT JOIN spending_transactions st ON bli.id = st.budget_line_item_id
    WHERE abs.user_id = user_id_param
    AND abs.budget_year = EXTRACT(YEAR FROM period_start)
    GROUP BY bc.id, bc.category_name;
    
    -- Build report
    report_data := jsonb_build_object(
        'report_type', report_type_param,
        'period_start', period_start,
        'period_end', period_end,
        'total_budgeted', total_budgeted,
        'total_spent', total_spent,
        'total_saved', total_budgeted - total_spent,
        'savings_rate_percentage', CASE 
            WHEN total_budgeted > 0 
            THEN ((total_budgeted - total_spent) / total_budgeted) * 100
            ELSE 0 
        END,
        'category_breakdown', category_breakdown,
        'budget_compliance_score', CASE 
            WHEN total_budgeted > 0 
            THEN LEAST(100, (total_spent / total_budgeted) * 100)
            ELSE 100 
        END,
        'recommendations', ARRAY[
            'Review over-budget categories for cost optimization',
            'Consider reallocating savings to high-priority items',
            'Track spending patterns to improve future budgeting'
        ]
    );
    
    -- Insert report record
    INSERT INTO financial_reports (
        user_id, report_type, report_period_start, report_period_end,
        total_budgeted, total_spent, total_saved, savings_rate_percentage,
        top_spending_categories, budget_compliance_score, report_data
    ) VALUES (
        user_id_param, report_type_param, period_start, period_end,
        total_budgeted, total_spent, total_budgeted - total_spent,
        CASE WHEN total_budgeted > 0 THEN ((total_budgeted - total_spent) / total_budgeted) * 100 ELSE 0 END,
        category_breakdown, 
        CASE WHEN total_budgeted > 0 THEN LEAST(100, (total_spent / total_budgeted) * 100) ELSE 100 END,
        report_data
    );
    
    RETURN report_data;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_annual_budget_snapshots_updated_at 
    BEFORE UPDATE ON annual_budget_snapshots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_line_items_updated_at 
    BEFORE UPDATE ON budget_line_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at 
    BEFORE UPDATE ON financial_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_benefit_analysis_updated_at 
    BEFORE UPDATE ON cost_benefit_analysis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE annual_budget_snapshots IS 'Annual budget planning and tracking for performance optimization';
COMMENT ON TABLE budget_categories IS 'Standardized budget categories with recommendations and ROI expectations';
COMMENT ON TABLE budget_line_items IS 'Individual budget items within each category';
COMMENT ON TABLE spending_transactions IS 'Actual spending transactions and receipts';
COMMENT ON TABLE budget_vs_actual_analysis IS 'Analysis of budget variance and spending patterns';
COMMENT ON TABLE financial_goals IS 'Financial goals and savings targets for performance investments';
COMMENT ON TABLE cost_benefit_analysis IS 'Cost-benefit analysis for major performance investments';
COMMENT ON TABLE financial_reports IS 'Generated financial reports and analytics';
COMMENT ON FUNCTION calculate_budget_variance IS 'Calculate budget variance analysis for user and year';
COMMENT ON FUNCTION generate_financial_report IS 'Generate comprehensive financial report for specified period';
