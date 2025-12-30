-- =============================================================================
-- CREATE ML TRAINING DATA TABLE
-- Migration: 075_create_ml_training_data.sql
-- Stores performance predictions and actual outcomes for model refinement.
-- =============================================================================

CREATE TABLE IF NOT EXISTS ml_training_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    prediction_type text NOT NULL,
    data jsonb NOT NULL,
    actual_result jsonb,
    accuracy numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE ml_training_data ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own ML data"
    ON ml_training_data FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ML data"
    ON ml_training_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ML data"
    ON ml_training_data FOR UPDATE
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_ml_training_user_type ON ml_training_data(user_id, prediction_type);

COMMENT ON TABLE ml_training_data IS 'Stores performance predictions and actual outcomes for model refinement.';

