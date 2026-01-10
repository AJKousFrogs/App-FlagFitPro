# Team Roster Bug - Root Cause Found & Fix Ready ✅

## Summary
**Problem**: Only you appear on the team roster, even though other players completed onboarding.

**Root Cause**: Missing INSERT policy on `team_members` table prevents new players from being added during onboarding.

**Status**: Fix created and ready to apply. Takes 30 seconds to fix.

---

## Root Cause Details

### What Happened
The RLS migration `20260109_fix_rls_performance_warnings.sql` removed the INSERT policy for the `team_members` table. This migration left only:
- ✅ UPDATE policy (coaches only)
- ✅ DELETE policy (head coaches only)  
- ✅ SELECT policy (existing members only)
- ❌ **INSERT policy (MISSING)**

### Impact on Onboarding
When players complete onboarding (`onboarding.component.ts` lines 3542-3558):
1. Code tries to insert the user into `team_members` table
2. RLS blocks the INSERT (no policy exists)
3. Insert silently fails
4. Player never appears on roster

Only you appear because you were added before this policy was removed or through a different path (like team creation).

---

## The Fix 🔧

I've created a migration that adds two INSERT policies:

1. **`team_members_insert_self`**: Allows users to insert themselves (enables onboarding & invitations)
2. **`team_members_insert_by_coach`**: Allows coaches to add members to their teams

**Files Created:**
- ✅ `supabase/migrations/20260110_fix_team_members_insert_policy.sql` - The migration
- ✅ `TEAM_ROSTER_FIX.md` - Detailed documentation
- ✅ `apply-team-members-fix.mjs` - Helper script (displays SQL to run)

---

## How to Apply (Choose One)

### Option 1: Supabase Dashboard (Easiest - 30 seconds)

1. **Open Supabase SQL Editor**:
   https://supabase.com/dashboard/project/pvziciccwxgftcielknm/sql

2. **Copy this SQL** (or copy from `supabase/migrations/20260110_fix_team_members_insert_policy.sql`):

```sql
-- Drop any existing INSERT policies
DROP POLICY IF EXISTS "team_members_insert_self" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_by_coach" ON team_members;

-- Allow users to insert themselves (for onboarding)
CREATE POLICY "team_members_insert_self"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Allow coaches to add members
CREATE POLICY "team_members_insert_by_coach"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = (SELECT auth.uid())
        AND tm.role IN ('coach', 'head_coach', 'admin', 'owner')
        AND tm.status = 'active'
    )
);
```

3. **Click "Run"**

4. **Verify** - Run this to confirm:
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'team_members' AND cmd = 'INSERT';
```

Should return:
- `team_members_insert_self` | INSERT
- `team_members_insert_by_coach` | INSERT

### Option 2: Using the Helper Script

```bash
cd /Users/aljosaursakous/Desktop/Flag\ football\ HTML\ -\ APP
node apply-team-members-fix.mjs
```

This will display the SQL to copy and run in the dashboard.

---

## After Applying the Fix

### Immediate Effect
- ✅ New players completing onboarding will appear on the roster
- ✅ Team invitations will work properly
- ✅ Players can join teams

### Existing Players (Who Already Completed Onboarding)

Players who completed onboarding **before** the fix may still be missing from `team_members`. To find them:

```sql
-- Find users who completed onboarding but aren't in team_members
SELECT u.id, u.email, u.full_name, u.position, u.team, u.onboarding_completed_at
FROM users u
WHERE u.onboarding_completed = true
AND NOT EXISTS (
    SELECT 1 FROM team_members tm WHERE tm.user_id = u.id
)
ORDER BY u.onboarding_completed_at DESC;
```

To add them manually:

```sql
-- Add missing users to their teams
-- Run this for each user found above, replacing <USER_ID> and <TEAM_NAME>
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

---

## Verification Steps

1. **Check the policies exist:**
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'team_members' 
ORDER BY cmd, policyname;
```

2. **Test with a new user:**
   - Have someone complete onboarding
   - Check if they appear in the roster
   - They should show up immediately

3. **Check roster loading:**
   - Open roster page
   - All team members should be visible
   - Check browser console for any RLS errors (should be none)

---

## Technical Details

### Code References

**Onboarding flow:**
- `angular/src/app/features/onboarding/onboarding.component.ts`
  - Line 3090: `completeOnboarding()` method
  - Line 3222: Calls `addPlayerToTeamRoster()`
  - Line 3477-3619: `addPlayerToTeamRoster()` implementation
  - Line 3542-3558: INSERT into `team_members` (was failing silently)

**Roster loading:**
- `angular/src/app/features/roster/roster.service.ts`
  - Line 178: `loadRosterData()` method
  - Line 242-246: Queries `team_members` with role='player'
  - Line 257-262: Joins with `users` table

**RLS Policies:**
- `supabase/migrations/20260109_fix_rls_performance_warnings.sql`
  - Line 467-504: Current policies (missing INSERT)
- `supabase/migrations/20260110_fix_team_members_insert_policy.sql` ← THE FIX

---

## Why This Happened

The performance optimization migration in January 2026 consolidated and optimized RLS policies but accidentally removed the INSERT policy. This is a common issue when refactoring security policies - easy to miss edge cases like onboarding flows.

---

## Next Steps

1. ✅ **Apply the fix** (30 seconds via Supabase dashboard)
2. ✅ **Test with a new user** completing onboarding
3. ⚠️ **Check for existing orphaned users** (users who completed onboarding but aren't in team_members)
4. ✅ **Manually add orphaned users** to their teams (if any)

---

## Questions?

Check these files for more details:
- `TEAM_ROSTER_FIX.md` - Comprehensive troubleshooting guide
- `supabase/migrations/20260110_fix_team_members_insert_policy.sql` - The actual SQL migration

The fix is ready to go - just needs to be applied via the Supabase dashboard!
