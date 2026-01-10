# TEAM ROSTER FIX - QUICK START GUIDE 🚀

## Problem
Only you appear on the team roster. Other players who completed onboarding are missing.

## Root Cause
Missing INSERT policy on `team_members` table in database RLS (Row Level Security).

## Fix (Choose Your Path)

---

### 🎯 PATH 1: QUICK FIX (30 seconds)

**Go here:** https://supabase.com/dashboard/project/pvziciccwxgftcielknm/sql

**Paste this SQL and click "Run":**

```sql
DROP POLICY IF EXISTS "team_members_insert_self" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_by_coach" ON team_members;

CREATE POLICY "team_members_insert_self"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

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

**Done!** New players will now appear after onboarding.

---

### 🔍 PATH 2: DIAGNOSE FIRST (recommended)

**Step 1: Run diagnostic**
1. Go to: https://supabase.com/dashboard/project/pvziciccwxgftcielknm/sql
2. Copy all contents from: `diagnostic-team-roster.sql`
3. Paste and run
4. Review results to see:
   - Current policies (should be missing INSERT)
   - Users who completed onboarding
   - Which users are missing from team_members

**Step 2: Apply the fix**
Use PATH 1 above

**Step 3: Add orphaned users** (if diagnostic found any)
```sql
-- Replace <USER_ID> and <TEAM_NAME> with actual values from diagnostic
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

### 📚 PATH 3: FULL DOCUMENTATION

If you want all the details:
1. Read `TEAM_ROSTER_BUG_SUMMARY.md` - Complete explanation
2. Read `TEAM_ROSTER_FIX.md` - Detailed troubleshooting
3. Check migration file: `supabase/migrations/20260110_fix_team_members_insert_policy.sql`

---

## Verify It Worked

After applying the fix, run this in SQL Editor:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'team_members' AND cmd = 'INSERT';
```

Should return:
- ✅ `team_members_insert_self`
- ✅ `team_members_insert_by_coach`

Then test by having a new player complete onboarding - they should appear on roster immediately!

---

## Files Created

All located in: `/Users/aljosaursakous/Desktop/Flag football HTML - APP/`

- ✅ `QUICKSTART.md` ← **You are here**
- 📋 `TEAM_ROSTER_BUG_SUMMARY.md` - Detailed summary with code references
- 📋 `TEAM_ROSTER_FIX.md` - Full troubleshooting guide
- 🔧 `supabase/migrations/20260110_fix_team_members_insert_policy.sql` - The SQL fix
- 🔍 `diagnostic-team-roster.sql` - Diagnostic queries
- 🛠️ `apply-team-members-fix.mjs` - Helper script (displays SQL)

---

## TL;DR

1. Open: https://supabase.com/dashboard/project/pvziciccwxgftcielknm/sql
2. Copy SQL from PATH 1 above
3. Paste and click "Run"
4. Done! 🎉

New players completing onboarding will now appear on the roster.
