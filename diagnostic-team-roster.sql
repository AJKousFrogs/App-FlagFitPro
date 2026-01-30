-- ============================================================================
-- DIAGNOSTIC SCRIPT: Check Team Roster Issues
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose roster problems
-- https://supabase.com/dashboard/project/grfjmnjpzvknmsxrwesx/sql
-- ============================================================================

-- ==========================================================================
-- PART 1: Check Current RLS Policies on team_members
-- ==========================================================================
SELECT 
    '1. Current team_members RLS Policies' as check_name,
    '─────────────────────────────────' as separator;

SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'INSERT' THEN '✅ INSERT policy exists'
        ELSE cmd || ' policy'
    END as status
FROM pg_policies 
WHERE tablename = 'team_members'
ORDER BY 
    CASE cmd
        WHEN 'SELECT' THEN 1
        WHEN 'INSERT' THEN 2
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
    END;

-- Expected: Should see at least one INSERT policy
-- If no INSERT policies, the fix needs to be applied

SELECT '' as blank_line;

-- ==========================================================================
-- PART 2: Find Users Who Completed Onboarding
-- ==========================================================================
SELECT 
    '2. Users Who Completed Onboarding' as check_name,
    '───────────────────────────────────' as separator;

SELECT 
    u.email,
    u.full_name,
    u.position,
    u.team,
    u.user_type,
    u.onboarding_completed,
    u.onboarding_completed_at,
    CASE 
        WHEN tm.id IS NOT NULL THEN '✅ In team_members'
        ELSE '❌ MISSING from team_members'
    END as roster_status
FROM users u
LEFT JOIN team_members tm ON u.id = tm.user_id
WHERE u.onboarding_completed = true
ORDER BY u.onboarding_completed_at DESC;

-- Anyone marked as "MISSING from team_members" needs to be manually added

SELECT '' as blank_line;

-- ==========================================================================
-- PART 3: Current Team Members Count
-- ==========================================================================
SELECT 
    '3. Team Members by Team' as check_name,
    '─────────────────────────' as separator;

SELECT 
    t.name as team_name,
    COUNT(DISTINCT tm.user_id) as total_members,
    COUNT(DISTINCT CASE WHEN tm.role = 'player' THEN tm.user_id END) as players,
    COUNT(DISTINCT CASE WHEN tm.role IN ('coach', 'head_coach') THEN tm.user_id END) as coaches,
    COUNT(DISTINCT CASE WHEN tm.role NOT IN ('player', 'coach', 'head_coach') THEN tm.user_id END) as staff
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
GROUP BY t.id, t.name
ORDER BY total_members DESC;

SELECT '' as blank_line;

-- ==========================================================================
-- PART 4: Orphaned Users (Onboarding Complete but No Team)
-- ==========================================================================
SELECT 
    '4. Orphaned Users - Need Manual Addition' as check_name,
    '──────────────────────────────────────────' as separator;

SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.position,
    u.jersey_number,
    u.team as intended_team,
    u.onboarding_completed_at
FROM users u
WHERE u.onboarding_completed = true
AND NOT EXISTS (
    SELECT 1 FROM team_members tm WHERE tm.user_id = u.id
)
ORDER BY u.onboarding_completed_at DESC;

-- If any users shown here, they need to be manually added to their teams

SELECT '' as blank_line;

-- ==========================================================================
-- PART 5: Teams and Their Members (Detailed View)
-- ==========================================================================
SELECT 
    '5. Detailed Team Roster' as check_name,
    '─────────────────────────' as separator;

SELECT 
    t.name as team_name,
    u.full_name as member_name,
    u.email,
    tm.role,
    tm.position,
    tm.jersey_number,
    tm.status,
    tm.joined_at
FROM teams t
JOIN team_members tm ON t.id = tm.team_id
JOIN users u ON tm.user_id = u.id
ORDER BY t.name, tm.role, u.full_name;

-- ==========================================================================
-- VERIFICATION QUERIES (Run after applying the fix)
-- ==========================================================================

-- After applying the INSERT policy fix, run this to verify:
-- SELECT 'Fix Applied - Testing INSERT' as test_result;
-- 
-- You should be able to run this without errors (replace with actual IDs):
-- INSERT INTO team_members (team_id, user_id, role, status)
-- VALUES (
--     '<TEAM_ID>',
--     '<USER_ID>',
--     'player',
--     'active'
-- );
