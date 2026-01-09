-- Test Account Seed Script
-- Date: 2026-01-09
-- Purpose: Create test accounts for validation before UI refactor
-- 
-- IMPORTANT: Create auth.users entries via Supabase Dashboard first,
-- then replace the UUIDs below with the actual user IDs

-- ============================================================================
-- STEP 1: CREATE USERS VIA SUPABASE DASHBOARD
-- ============================================================================
-- 
-- Go to Supabase Dashboard → Authentication → Add User
-- Create these accounts (write down the UUIDs):
--
-- 1. test-athlete-full@example.com (password: TestPass123!)
-- 2. test-athlete-partial@example.com (password: TestPass123!)
-- 3. test-athlete-none@example.com (password: TestPass123!)
-- 4. test-coach@example.com (password: TestPass123!)
-- 5. test-staff-physio@example.com (password: TestPass123!)
-- 6. test-new-user@example.com (password: TestPass123!)
-- 7. test-inactive@example.com (password: TestPass123!)
-- 8. test-override@example.com (password: TestPass123!)

-- ============================================================================
-- STEP 2: REPLACE UUIDs BELOW WITH ACTUAL USER IDs
-- ============================================================================

DO $$
DECLARE
  -- Test team
  v_team_id UUID := gen_random_uuid();
  
  -- REPLACE THESE WITH ACTUAL UUIDS FROM SUPABASE AUTH
  v_athlete_full_id UUID := 'REPLACE-WITH-UUID-1';
  v_athlete_partial_id UUID := 'REPLACE-WITH-UUID-2';
  v_athlete_none_id UUID := 'REPLACE-WITH-UUID-3';
  v_coach_id UUID := 'REPLACE-WITH-UUID-4';
  v_staff_physio_id UUID := 'REPLACE-WITH-UUID-5';
  v_new_user_id UUID := 'REPLACE-WITH-UUID-6';
  v_inactive_id UUID := 'REPLACE-WITH-UUID-7';
  v_override_id UUID := 'REPLACE-WITH-UUID-8';
  
  -- Session dates
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_week_ago DATE := CURRENT_DATE - INTERVAL '7 days';
BEGIN
  RAISE NOTICE 'Creating test team...';
  
  -- Create test team
  INSERT INTO teams (id, name, sport, created_by, created_at)
  VALUES (v_team_id, 'Test Team - QA', 'flag_football', v_coach_id, NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE 'Creating users table entries...';
  
  -- Create users table entries with roles
  INSERT INTO users (id, email, role, created_at) VALUES
    (v_athlete_full_id, 'test-athlete-full@example.com', 'athlete', NOW()),
    (v_athlete_partial_id, 'test-athlete-partial@example.com', 'athlete', NOW()),
    (v_athlete_none_id, 'test-athlete-none@example.com', 'athlete', NOW()),
    (v_coach_id, 'test-coach@example.com', 'coach', NOW()),
    (v_staff_physio_id, 'test-staff-physio@example.com', 'staff', NOW()),
    (v_new_user_id, 'test-new-user@example.com', 'athlete', NOW()),
    (v_inactive_id, 'test-inactive@example.com', 'athlete', NOW() - INTERVAL '30 days'),
    (v_override_id, 'test-override@example.com', 'athlete', NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE 'Adding team members...';
  
  -- Add team members
  INSERT INTO team_members (team_id, user_id, role_team, status, jersey_number, position, created_at) VALUES
    (v_team_id, v_athlete_full_id, 'player', 'active', 10, 'WR', NOW()),
    (v_team_id, v_athlete_partial_id, 'player', 'active', 11, 'QB', NOW()),
    (v_team_id, v_athlete_none_id, 'player', 'active', 12, 'RB', NOW()),
    (v_team_id, v_inactive_id, 'player', 'active', 13, 'DB', NOW()),
    (v_team_id, v_override_id, 'player', 'active', 14, 'Rusher', NOW()),
    (v_team_id, v_coach_id, 'coach', 'active', NULL, NULL, NOW()),
    (v_team_id, v_staff_physio_id, 'staff', 'active', NULL, NULL, NOW())
  ON CONFLICT (team_id, user_id) DO NOTHING;
  
  RAISE NOTICE 'Setting consent preferences...';
  
  -- Set consent settings
  INSERT INTO athlete_consent_settings (
    athlete_id, 
    share_readiness_with_coach, 
    share_wellness_answers_with_coach,
    share_training_notes_with_coach,
    share_merlin_conversations_with_coach,
    share_readiness_with_all_coaches,
    created_at
  ) VALUES
    -- Full consent
    (v_athlete_full_id, true, true, true, true, true, NOW()),
    -- Partial consent (readiness only)
    (v_athlete_partial_id, true, false, false, false, false, NOW()),
    -- No consent
    (v_athlete_none_id, false, false, false, false, false, NOW()),
    -- New user (no consent record - will use defaults)
    -- v_new_user_id intentionally omitted
    -- Inactive user (full consent)
    (v_inactive_id, true, true, true, true, false, NOW()),
    -- Override user (full consent)
    (v_override_id, true, true, true, true, false, NOW())
  ON CONFLICT (athlete_id) DO NOTHING;
  
  RAISE NOTICE 'Creating sample wellness data...';
  
  -- Add wellness check-ins (last 7 days)
  INSERT INTO athlete_daily_state (user_id, date, sleep_hours, sleep_quality, muscle_soreness, stress_level, mood, energy_level, wellness_score, created_at)
  SELECT 
    user_id,
    date,
    7 + (random() * 2)::int,  -- 7-9 hours
    6 + (random() * 3)::int,  -- 6-9 quality
    3 + (random() * 4)::int,  -- 3-7 soreness
    3 + (random() * 4)::int,  -- 3-7 stress
    6 + (random() * 3)::int,  -- 6-9 mood
    6 + (random() * 3)::int,  -- 6-9 energy
    60 + (random() * 30)::int,  -- 60-90 wellness score
    date
  FROM (
    SELECT user_id FROM (VALUES 
      (v_athlete_full_id),
      (v_athlete_partial_id),
      (v_athlete_none_id),
      (v_override_id)
    ) AS t(user_id)
  ) users
  CROSS JOIN generate_series(v_today - INTERVAL '6 days', v_today, INTERVAL '1 day')::date AS date
  ON CONFLICT (user_id, date) DO NOTHING;
  
  RAISE NOTICE 'Creating sample training sessions...';
  
  -- Add training sessions
  INSERT INTO training_sessions (user_id, session_date, session_state, session_type, duration_minutes, created_at) VALUES
    -- Full consent athlete
    (v_athlete_full_id, v_today, 'VISIBLE', 'strength', 60, NOW()),
    (v_athlete_full_id, v_yesterday, 'COMPLETED', 'conditioning', 45, NOW() - INTERVAL '1 day'),
    -- Partial consent athlete
    (v_athlete_partial_id, v_today, 'IN_PROGRESS', 'speed', 30, NOW()),
    -- None consent athlete
    (v_athlete_none_id, v_today, 'PLANNED', 'mobility', 20, NOW()),
    -- Override athlete
    (v_override_id, v_today, 'VISIBLE', 'strength', 60, NOW())
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Creating readiness scores...';
  
  -- Add readiness scores
  INSERT INTO readiness_logs (user_id, date, readiness_score, acwr, created_at)
  SELECT 
    user_id,
    date,
    60 + (random() * 30)::int,  -- 60-90
    0.8 + (random() * 0.4),     -- 0.8-1.2
    date
  FROM (
    SELECT user_id FROM (VALUES 
      (v_athlete_full_id),
      (v_athlete_partial_id),
      (v_athlete_none_id),
      (v_override_id)
    ) AS t(user_id)
  ) users
  CROSS JOIN generate_series(v_today - INTERVAL '6 days', v_today, INTERVAL '1 day')::date AS date
  ON CONFLICT (user_id, date) DO NOTHING;
  
  RAISE NOTICE 'Creating safety override...';
  
  -- Add safety override for test-override account
  INSERT INTO safety_overrides (
    user_id,
    override_type,
    reason,
    expires_at,
    created_at,
    created_by
  ) VALUES (
    v_override_id,
    'injury_return',
    'Cleared by physiotherapist for return to play',
    NOW() + INTERVAL '7 days',
    NOW(),
    v_staff_physio_id
  ) ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Test accounts created successfully!';
  RAISE NOTICE 'Team ID: %', v_team_id;
  RAISE NOTICE 'Test with these accounts:';
  RAISE NOTICE '  - test-athlete-full@example.com (full consent)';
  RAISE NOTICE '  - test-athlete-partial@example.com (partial consent)';
  RAISE NOTICE '  - test-athlete-none@example.com (no consent)';
  RAISE NOTICE '  - test-coach@example.com (coach)';
  RAISE NOTICE '  - test-staff-physio@example.com (staff)';
  RAISE NOTICE '  - test-new-user@example.com (new user)';
  RAISE NOTICE '  - test-inactive@example.com (inactive)';
  RAISE NOTICE '  - test-override@example.com (has safety override)';
END $$;
