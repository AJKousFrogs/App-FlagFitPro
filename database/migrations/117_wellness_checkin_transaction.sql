-- ============================================================================
-- Migration 117: Add Transactional Wellness Check-in Function
-- ============================================================================
-- Purpose: Create a database function for atomic wellness check-in that writes 
--          to both daily_wellness_checkin and wellness_entries tables
-- Date: January 2026
-- Impact: Ensures data consistency between wellness tables
-- ============================================================================

-- Create or replace the transactional wellness check-in function
CREATE OR REPLACE FUNCTION upsert_wellness_checkin(
    p_user_id UUID,
    p_checkin_date DATE,
    p_sleep_quality INTEGER DEFAULT NULL,
    p_sleep_hours NUMERIC(3,1) DEFAULT NULL,
    p_energy_level INTEGER DEFAULT NULL,
    p_muscle_soreness INTEGER DEFAULT NULL,
    p_stress_level INTEGER DEFAULT NULL,
    p_soreness_areas TEXT[] DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_calculated_readiness INTEGER DEFAULT NULL,
    p_motivation_level INTEGER DEFAULT NULL,
    p_mood INTEGER DEFAULT NULL,
    p_hydration_level INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id BIGINT,
    checkin_date DATE,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_checkin_id BIGINT;
BEGIN
    -- Begin atomic transaction
    
    -- 1. Upsert to daily_wellness_checkin (primary table)
    INSERT INTO daily_wellness_checkin (
        user_id,
        checkin_date,
        sleep_quality,
        sleep_hours,
        energy_level,
        muscle_soreness,
        stress_level,
        soreness_areas,
        notes,
        calculated_readiness,
        motivation_level,
        mood,
        hydration_level,
        overall_readiness_score,
        updated_at
    ) VALUES (
        p_user_id,
        p_checkin_date,
        p_sleep_quality,
        p_sleep_hours,
        p_energy_level,
        p_muscle_soreness,
        p_stress_level,
        COALESCE(p_soreness_areas, ARRAY[]::TEXT[]),
        p_notes,
        p_calculated_readiness,
        p_motivation_level,
        p_mood,
        p_hydration_level,
        p_calculated_readiness,
        NOW()
    )
    ON CONFLICT (user_id, checkin_date) 
    DO UPDATE SET
        sleep_quality = COALESCE(EXCLUDED.sleep_quality, daily_wellness_checkin.sleep_quality),
        sleep_hours = COALESCE(EXCLUDED.sleep_hours, daily_wellness_checkin.sleep_hours),
        energy_level = COALESCE(EXCLUDED.energy_level, daily_wellness_checkin.energy_level),
        muscle_soreness = COALESCE(EXCLUDED.muscle_soreness, daily_wellness_checkin.muscle_soreness),
        stress_level = COALESCE(EXCLUDED.stress_level, daily_wellness_checkin.stress_level),
        soreness_areas = COALESCE(EXCLUDED.soreness_areas, daily_wellness_checkin.soreness_areas),
        notes = COALESCE(EXCLUDED.notes, daily_wellness_checkin.notes),
        calculated_readiness = COALESCE(EXCLUDED.calculated_readiness, daily_wellness_checkin.calculated_readiness),
        motivation_level = COALESCE(EXCLUDED.motivation_level, daily_wellness_checkin.motivation_level),
        mood = COALESCE(EXCLUDED.mood, daily_wellness_checkin.mood),
        hydration_level = COALESCE(EXCLUDED.hydration_level, daily_wellness_checkin.hydration_level),
        overall_readiness_score = COALESCE(EXCLUDED.overall_readiness_score, daily_wellness_checkin.overall_readiness_score),
        updated_at = NOW()
    RETURNING daily_wellness_checkin.id INTO v_checkin_id;

    -- 2. Upsert to wellness_entries (legacy table for backward compatibility)
    INSERT INTO wellness_entries (
        athlete_id,
        user_id,
        date,
        sleep_quality,
        energy_level,
        stress_level,
        muscle_soreness,
        motivation_level,
        mood,
        hydration_level,
        notes,
        updated_at
    ) VALUES (
        p_user_id,
        p_user_id,
        p_checkin_date,
        p_sleep_quality,
        p_energy_level,
        p_stress_level,
        p_muscle_soreness,
        p_motivation_level,
        p_mood,
        p_hydration_level,
        p_notes,
        NOW()
    )
    ON CONFLICT (athlete_id, date) 
    DO UPDATE SET
        sleep_quality = COALESCE(EXCLUDED.sleep_quality, wellness_entries.sleep_quality),
        energy_level = COALESCE(EXCLUDED.energy_level, wellness_entries.energy_level),
        stress_level = COALESCE(EXCLUDED.stress_level, wellness_entries.stress_level),
        muscle_soreness = COALESCE(EXCLUDED.muscle_soreness, wellness_entries.muscle_soreness),
        motivation_level = COALESCE(EXCLUDED.motivation_level, wellness_entries.motivation_level),
        mood = COALESCE(EXCLUDED.mood, wellness_entries.mood),
        hydration_level = COALESCE(EXCLUDED.hydration_level, wellness_entries.hydration_level),
        notes = COALESCE(EXCLUDED.notes, wellness_entries.notes),
        updated_at = NOW();

    RETURN QUERY SELECT v_checkin_id, p_checkin_date, true, 'Wellness check-in saved successfully'::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        -- Transaction will be rolled back automatically
        RAISE EXCEPTION 'Failed to save wellness check-in: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_wellness_checkin TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION upsert_wellness_checkin IS 'Atomic wellness check-in that writes to both daily_wellness_checkin and wellness_entries tables';

-- ============================================================================
-- Similar function for training session logging (writes to training_sessions + workout_logs)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_training_session(
    p_user_id UUID,
    p_session_date DATE,
    p_session_type VARCHAR(50),
    p_duration_minutes INTEGER,
    p_rpe DECIMAL(3,1) DEFAULT NULL,
    p_load_au INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_external_load_data JSONB DEFAULT NULL,
    p_wellness_snapshot JSONB DEFAULT NULL,
    p_avg_heart_rate INTEGER DEFAULT NULL,
    p_max_heart_rate INTEGER DEFAULT NULL
)
RETURNS TABLE (
    session_id UUID,
    workout_log_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_session_id UUID;
    v_workout_log_id UUID;
    v_calculated_load INTEGER;
BEGIN
    -- Calculate load if not provided
    v_calculated_load := COALESCE(p_load_au, 
        CASE WHEN p_rpe IS NOT NULL AND p_duration_minutes IS NOT NULL 
             THEN ROUND(p_rpe * p_duration_minutes)::INTEGER
             ELSE NULL
        END
    );

    -- 1. Insert into training_sessions
    INSERT INTO training_sessions (
        user_id,
        session_date,
        session_type,
        duration_minutes,
        rpe,
        load_au,
        notes,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_session_date,
        p_session_type,
        p_duration_minutes,
        p_rpe,
        v_calculated_load,
        p_notes,
        'completed',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_session_id;

    -- 2. Insert into workout_logs
    INSERT INTO workout_logs (
        player_id,
        session_id,
        completed_at,
        rpe,
        duration_minutes,
        notes,
        load_au,
        session_type,
        external_load_data,
        wellness_snapshot,
        avg_heart_rate,
        max_heart_rate,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        v_session_id,
        (p_session_date::TIMESTAMP AT TIME ZONE 'UTC'),
        p_rpe,
        p_duration_minutes,
        p_notes,
        v_calculated_load,
        p_session_type,
        p_external_load_data,
        p_wellness_snapshot,
        p_avg_heart_rate,
        p_max_heart_rate,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_workout_log_id;

    RETURN QUERY SELECT v_session_id, v_workout_log_id, true, 'Training session logged successfully'::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        -- Transaction will be rolled back automatically
        RAISE EXCEPTION 'Failed to log training session: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_training_session TO authenticated;

COMMENT ON FUNCTION log_training_session IS 'Atomic training session logging that writes to both training_sessions and workout_logs tables';
