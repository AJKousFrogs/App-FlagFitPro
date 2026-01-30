-- =============================================================================
-- EXERCISEDB API INTEGRATION - Migration 072
-- =============================================================================
-- Creates infrastructure for storing curated exercises from ExerciseDB API
-- tailored specifically for flag football training
-- =============================================================================

-- =============================================================================
-- PART 1: CREATE EXERCISEDB EXERCISES TABLE
-- =============================================================================

-- Table to store exercises imported from ExerciseDB API
CREATE TABLE IF NOT EXISTS exercisedb_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ExerciseDB API fields
    external_id VARCHAR(50) UNIQUE NOT NULL, -- Original ID from ExerciseDB
    name VARCHAR(255) NOT NULL,
    body_part VARCHAR(100) NOT NULL, -- 'back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'
    equipment VARCHAR(100) NOT NULL, -- 'barbell', 'body weight', 'cable', 'dumbbell', 'kettlebell', 'leverage machine', etc.
    target_muscle VARCHAR(100) NOT NULL, -- Primary target muscle
    secondary_muscles TEXT[], -- Array of secondary muscles
    gif_url TEXT, -- Animated GIF from ExerciseDB
    instructions TEXT[], -- Step-by-step instructions
    
    -- Flag Football Curation Fields
    is_curated BOOLEAN DEFAULT FALSE, -- Has been reviewed for flag football relevance
    flag_football_relevance INTEGER CHECK (flag_football_relevance BETWEEN 1 AND 10), -- 1-10 relevance score
    relevance_notes TEXT, -- Why this exercise is relevant for flag football
    
    -- Flag Football Categorization
    ff_category VARCHAR(100), -- Our internal category mapping
    ff_training_focus TEXT[], -- ['Speed', 'Agility', 'Strength', 'Injury Prevention', 'Position-Specific']
    applicable_positions TEXT[], -- ['QB', 'WR', 'RB', 'DB', 'Rusher', 'Center', 'All']
    
    -- Training Parameters (coach customizable)
    recommended_sets INTEGER,
    recommended_reps VARCHAR(50), -- '8-12' or '10' or 'AMRAP'
    recommended_rest_seconds INTEGER,
    difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
    
    -- Safety & Notes
    safety_notes TEXT[],
    coaching_cues TEXT[],
    common_mistakes TEXT[],
    progression_tips TEXT[],
    
    -- Integration with exercise_registry (can be added later when exercise_registry table exists)
    exercise_registry_id UUID, -- Will reference exercise_registry(id) when that table is created
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE, -- Coach approved for use
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 2: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_exercisedb_external_id ON exercisedb_exercises(external_id);
CREATE INDEX IF NOT EXISTS idx_exercisedb_body_part ON exercisedb_exercises(body_part);
CREATE INDEX IF NOT EXISTS idx_exercisedb_equipment ON exercisedb_exercises(equipment);
CREATE INDEX IF NOT EXISTS idx_exercisedb_target_muscle ON exercisedb_exercises(target_muscle);
CREATE INDEX IF NOT EXISTS idx_exercisedb_curated ON exercisedb_exercises(is_curated) WHERE is_curated = TRUE;
CREATE INDEX IF NOT EXISTS idx_exercisedb_approved ON exercisedb_exercises(is_approved) WHERE is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_exercisedb_ff_category ON exercisedb_exercises(ff_category);
CREATE INDEX IF NOT EXISTS idx_exercisedb_relevance ON exercisedb_exercises(flag_football_relevance DESC NULLS LAST);

-- =============================================================================
-- PART 3: CREATE FLAG FOOTBALL EXERCISE MAPPING TABLE
-- =============================================================================

-- Maps ExerciseDB body parts and targets to flag football training categories
CREATE TABLE IF NOT EXISTS ff_exercise_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source mapping
    body_part VARCHAR(100),
    target_muscle VARCHAR(100),
    equipment VARCHAR(100),
    
    -- Flag Football mapping
    ff_category VARCHAR(100) NOT NULL,
    ff_training_focus TEXT[] NOT NULL,
    default_relevance_score INTEGER DEFAULT 5 CHECK (default_relevance_score BETWEEN 1 AND 10),
    applicable_positions TEXT[] DEFAULT ARRAY['All'],
    
    -- Priority for auto-curation
    auto_curate BOOLEAN DEFAULT FALSE,
    priority_order INTEGER DEFAULT 100,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 4: SEED FLAG FOOTBALL EXERCISE MAPPINGS
-- =============================================================================

-- These mappings define which ExerciseDB exercises are most relevant for flag football
INSERT INTO ff_exercise_mappings (body_part, target_muscle, ff_category, ff_training_focus, default_relevance_score, applicable_positions, auto_curate, priority_order, notes)
VALUES
    -- LOWER BODY - Critical for flag football
    ('upper legs', 'glutes', 'Hip Power & Explosiveness', ARRAY['Speed', 'Agility', 'Acceleration'], 9, ARRAY['All'], TRUE, 1, 'Glute strength essential for sprinting and cutting'),
    ('upper legs', 'quads', 'Leg Strength', ARRAY['Speed', 'Acceleration', 'Deceleration'], 9, ARRAY['All'], TRUE, 2, 'Quad strength for explosive starts and stops'),
    ('upper legs', 'hamstrings', 'Posterior Chain', ARRAY['Speed', 'Injury Prevention'], 10, ARRAY['All'], TRUE, 3, 'Hamstring strength critical for sprint speed and injury prevention'),
    ('upper legs', 'adductors', 'Lateral Movement', ARRAY['Agility', 'Injury Prevention'], 8, ARRAY['All'], TRUE, 4, 'Adductor strength for lateral cuts and COD'),
    ('lower legs', 'calves', 'Ankle Stability', ARRAY['Speed', 'Agility', 'Injury Prevention'], 7, ARRAY['All'], TRUE, 5, 'Calf strength for push-off and ankle stability'),
    
    -- CORE - Essential for rotational power and stability
    ('waist', 'abs', 'Core Stability', ARRAY['Rotational Power', 'Stability'], 8, ARRAY['All'], TRUE, 6, 'Core strength for throwing, cutting, and balance'),
    ('waist', 'obliques', 'Rotational Core', ARRAY['Rotational Power', 'Throwing'], 9, ARRAY['QB', 'WR', 'RB'], TRUE, 7, 'Oblique strength for throwing power and route running'),
    
    -- UPPER BODY - Position specific
    ('shoulders', 'delts', 'Shoulder Stability', ARRAY['Throwing', 'Injury Prevention'], 8, ARRAY['QB', 'Center'], TRUE, 8, 'Shoulder strength for throwing and snapping'),
    ('back', 'lats', 'Upper Body Power', ARRAY['Throwing', 'Pulling'], 7, ARRAY['QB', 'Rusher'], TRUE, 9, 'Lat strength for throwing velocity'),
    ('chest', 'pectorals', 'Pushing Power', ARRAY['Blocking', 'Stiff Arm'], 6, ARRAY['RB', 'Rusher'], TRUE, 10, 'Chest strength for contact situations'),
    ('upper arms', 'triceps', 'Arm Extension', ARRAY['Throwing', 'Stiff Arm'], 7, ARRAY['QB', 'RB'], TRUE, 11, 'Tricep strength for throwing and arm extension'),
    ('upper arms', 'biceps', 'Arm Strength', ARRAY['Flag Pulling', 'Catching'], 6, ARRAY['DB', 'Rusher'], TRUE, 12, 'Bicep strength for flag pulls'),
    
    -- CARDIO - Conditioning
    ('cardio', NULL, 'Conditioning', ARRAY['Endurance', 'Recovery'], 6, ARRAY['All'], TRUE, 13, 'Cardiovascular conditioning for game stamina'),
    
    -- FLEXIBILITY/MOBILITY
    ('back', 'spine', 'Mobility', ARRAY['Flexibility', 'Injury Prevention'], 7, ARRAY['All'], TRUE, 14, 'Spinal mobility for athletic movement'),
    ('lower legs', 'tibialis', 'Ankle Mobility', ARRAY['Injury Prevention', 'Agility'], 6, ARRAY['All'], FALSE, 15, 'Tibialis strength for shin splint prevention')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- PART 5: CREATE IMPORT LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS exercisedb_import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    import_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'targeted'
    status VARCHAR(50) NOT NULL DEFAULT 'started', -- 'started', 'completed', 'failed'
    
    -- Statistics
    total_fetched INTEGER DEFAULT 0,
    total_imported INTEGER DEFAULT 0,
    total_updated INTEGER DEFAULT 0,
    total_skipped INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    
    -- Filters used
    body_parts_filter TEXT[],
    equipment_filter TEXT[],
    
    -- Error details
    error_message TEXT,
    error_details JSONB,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Who triggered
    triggered_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PART 6: ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE exercisedb_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE ff_exercise_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercisedb_import_logs ENABLE ROW LEVEL SECURITY;

-- ExerciseDB Exercises: Anyone can view approved exercises, coaches can manage
CREATE POLICY "Anyone can view approved exercisedb exercises"
ON exercisedb_exercises FOR SELECT
USING (is_approved = TRUE AND is_active = TRUE);

CREATE POLICY "Coaches can view all exercisedb exercises"
ON exercisedb_exercises FOR SELECT
USING (is_coach() OR is_admin());

CREATE POLICY "Coaches can manage exercisedb exercises"
ON exercisedb_exercises FOR ALL
USING (is_coach() OR is_admin());

-- FF Exercise Mappings: Coaches can manage
CREATE POLICY "Anyone can view ff exercise mappings"
ON ff_exercise_mappings FOR SELECT
USING (TRUE);

CREATE POLICY "Coaches can manage ff exercise mappings"
ON ff_exercise_mappings FOR ALL
USING (is_coach() OR is_admin());

-- Import Logs: Only coaches can view
CREATE POLICY "Coaches can view import logs"
ON exercisedb_import_logs FOR SELECT
USING (is_coach() OR is_admin());

CREATE POLICY "Coaches can manage import logs"
ON exercisedb_import_logs FOR ALL
USING (is_coach() OR is_admin());

-- =============================================================================
-- PART 7: HELPER FUNCTIONS
-- =============================================================================

-- Function to auto-categorize exercises based on mappings
CREATE OR REPLACE FUNCTION auto_categorize_exercisedb_exercise()
RETURNS TRIGGER AS $$
DECLARE
    mapping RECORD;
BEGIN
    -- Find best matching mapping
    SELECT * INTO mapping
    FROM ff_exercise_mappings
    WHERE (body_part IS NULL OR body_part = NEW.body_part)
    AND (target_muscle IS NULL OR target_muscle = NEW.target_muscle)
    AND (equipment IS NULL OR equipment = NEW.equipment)
    ORDER BY 
        CASE WHEN body_part IS NOT NULL AND target_muscle IS NOT NULL AND equipment IS NOT NULL THEN 1
             WHEN body_part IS NOT NULL AND target_muscle IS NOT NULL THEN 2
             WHEN body_part IS NOT NULL THEN 3
             ELSE 4 END,
        priority_order
    LIMIT 1;
    
    IF mapping IS NOT NULL THEN
        NEW.ff_category := mapping.ff_category;
        NEW.ff_training_focus := mapping.ff_training_focus;
        NEW.flag_football_relevance := mapping.default_relevance_score;
        NEW.applicable_positions := mapping.applicable_positions;
        
        IF mapping.auto_curate THEN
            NEW.is_curated := TRUE;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-categorize on insert
DROP TRIGGER IF EXISTS trigger_auto_categorize_exercisedb ON exercisedb_exercises;
CREATE TRIGGER trigger_auto_categorize_exercisedb
    BEFORE INSERT ON exercisedb_exercises
    FOR EACH ROW
    EXECUTE FUNCTION auto_categorize_exercisedb_exercise();

-- Function to get flag football relevant exercises
CREATE OR REPLACE FUNCTION get_ff_relevant_exercises(
    p_category VARCHAR DEFAULT NULL,
    p_position VARCHAR DEFAULT NULL,
    p_min_relevance INTEGER DEFAULT 5,
    p_equipment VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    body_part VARCHAR,
    equipment VARCHAR,
    target_muscle VARCHAR,
    gif_url TEXT,
    ff_category VARCHAR,
    ff_training_focus TEXT[],
    flag_football_relevance INTEGER,
    applicable_positions TEXT[],
    difficulty_level VARCHAR,
    instructions TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.body_part,
        e.equipment,
        e.target_muscle,
        e.gif_url,
        e.ff_category,
        e.ff_training_focus,
        e.flag_football_relevance,
        e.applicable_positions,
        e.difficulty_level,
        e.instructions
    FROM exercisedb_exercises e
    WHERE e.is_active = TRUE
    AND e.is_approved = TRUE
    AND e.flag_football_relevance >= p_min_relevance
    AND (p_category IS NULL OR e.ff_category = p_category)
    AND (p_position IS NULL OR p_position = ANY(e.applicable_positions) OR 'All' = ANY(e.applicable_positions))
    AND (p_equipment IS NULL OR e.equipment = p_equipment)
    ORDER BY e.flag_football_relevance DESC, e.name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PART 8: CREATE VIEW FOR EASY QUERYING
-- =============================================================================

-- View for ExerciseDB exercises only (exercise_registry integration can be added later)
CREATE OR REPLACE VIEW v_ff_exercise_library AS
SELECT 
    e.id,
    e.external_id,
    e.name,
    e.body_part,
    e.equipment,
    e.target_muscle,
    e.secondary_muscles,
    e.gif_url,
    e.instructions,
    e.ff_category,
    e.ff_training_focus,
    e.flag_football_relevance,
    e.applicable_positions,
    e.recommended_sets,
    e.recommended_reps,
    e.recommended_rest_seconds,
    e.difficulty_level,
    e.safety_notes,
    e.coaching_cues,
    e.is_approved,
    e.approved_at,
    'exercisedb' AS source
FROM exercisedb_exercises e
WHERE e.is_active = TRUE;

-- =============================================================================
-- PART 9: UPDATE TIMESTAMP TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS update_exercisedb_exercises_updated_at ON exercisedb_exercises;
CREATE TRIGGER update_exercisedb_exercises_updated_at
    BEFORE UPDATE ON exercisedb_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify tables created
DO $$
BEGIN
    RAISE NOTICE 'ExerciseDB Integration Migration Complete';
    RAISE NOTICE '- exercisedb_exercises table created';
    RAISE NOTICE '- ff_exercise_mappings table created with % mappings', (SELECT COUNT(*) FROM ff_exercise_mappings);
    RAISE NOTICE '- exercisedb_import_logs table created';
    RAISE NOTICE '- RLS policies applied';
    RAISE NOTICE '- Auto-categorization trigger created';
    RAISE NOTICE '- Helper functions created';
END $$;
