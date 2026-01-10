# Team Roster Issue - Root Cause & Fix

## Problem Statement
Only one player (you) appears on the team roster, even though other players completed onboarding.

## Root Cause Analysis

### Issue Identified
The Supabase migration `20260109_fix_rls_performance_warnings.sql` removed the INSERT policy for the `team_members` table, leaving only:
1. UPDATE policy (coaches only)
2. DELETE policy (head coaches only)
3. SELECT policy (existing members only)

### Impact
When players complete onboarding, the code attempts to:
1. Check if they're already a team member (lines 3534-3539 in onboarding.component.ts)
2. Insert them into `team_members` if not (lines 3542-3558)

**Problem**: The INSERT operation silently fails due to missing RLS policy, so players never get added to the team roster.

### Evidence
- Onboarding code: `angular/src/app/features/onboarding/onboarding.component.ts` lines 3477-3619
- Missing policy: `supabase/migrations/20260109_fix_rls_performance_warnings.sql` lines 467-504
- Old policies (removed): `database/supabase-rls-policies.sql` line 275

## Solution

### Migration Created
File: `supabase/migrations/20260110_fix_team_members_insert_policy.sql`

This migration adds two INSERT policies:
1. **team_members_insert_self**: Allows users to insert themselves (for onboarding/invitations)
2. **team_members_insert_by_coach**: Allows coaches to add members

### How to Apply

#### Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/pvziciccwxgftcielknm/sql
2. Copy the contents of `supabase/migrations/20260110_fix_team_members_insert_policy.sql`
3. Paste into the SQL Editor
4. Click "Run"

#### Option 2: Supabase CLI
```bash
cd /Users/aljosaursakous/Desktop/Flag\ football\ HTML\ -\ APP
npx supabase link --project-ref pvziciccwxgftcielknm
npx supabase db push
```

#### Option 3: Manual SQL (If dashboard not accessible)
Connect to your database and run the SQL from the migration file.

## Verification Steps

After applying the migration:

1. **Check policies were created:**
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'team_members' 
ORDER BY cmd, policyname;
```

Expected output should include:
- `team_members_insert_self` (INSERT)
- `team_members_insert_by_coach` (INSERT)

2. **Test onboarding flow:**
   - Have a test user complete onboarding
   - Check if they appear in the roster
   - Verify `team_members` table has their entry

3. **Check existing users:**
```sql
SELECT u.email, u.full_name, u.onboarding_completed, tm.id as member_id
FROM users u
LEFT JOIN team_members tm ON u.id = tm.user_id
WHERE u.onboarding_completed = true
ORDER BY u.created_at DESC;
```

This will show which users completed onboarding but are missing from `team_members`.

## Data Recovery (If Needed)

If users completed onboarding before the fix, you may need to manually add them to teams:

```sql
-- Find users who completed onboarding but aren't in team_members
SELECT u.id, u.email, u.full_name, u.position, u.team
FROM users u
WHERE u.onboarding_completed = true
AND NOT EXISTS (
    SELECT 1 FROM team_members tm WHERE tm.user_id = u.id
);

-- For each user found, insert them into team_members:
-- (Replace values with actual user data)
INSERT INTO team_members (team_id, user_id, role, position, jersey_number, status)
SELECT 
    t.id as team_id,
    u.id as user_id,
    'player' as role,
    u.position,
    u.jersey_number,
    'active' as status
FROM users u
CROSS JOIN teams t
WHERE u.id = '<USER_ID>'
AND t.name = '<TEAM_NAME>'
ON CONFLICT (user_id, team_id) DO NOTHING;
```

## Prevention

To prevent this in future:
1. Always include comprehensive INSERT policies when creating/migrating team-related tables
2. Test onboarding flows after RLS policy changes
3. Add integration tests for team membership operations

## Files Changed
- ✅ Created: `supabase/migrations/20260110_fix_team_members_insert_policy.sql`
- 📝 Documented: This file (`TEAM_ROSTER_FIX.md`)

## Next Steps
1. Apply the migration using one of the methods above
2. Verify policies are in place
3. Test with a new user onboarding
4. Check if existing users need manual team_members entries
