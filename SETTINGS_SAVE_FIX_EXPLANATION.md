# Settings Save Issue - Root Cause & Fix

## Problem
When you change your jersey number in Settings and click Save:
- ✅ Success message shows
- ✅ Changes appear to be saved
- ❌ **After refresh, changes revert to old value**

## Root Cause

The issue is caused by **Row Level Security (RLS) policies** on the `team_members` table.

### What's Happening:

1. **When you save settings**, the code updates TWO tables:
   - ✅ `users` table (succeeds)
   - ❌ `team_members` table (silently fails due to RLS)

2. **When you refresh the page**, the code loads data from:
   - First: `users` table (has outdated value)
   - Then: `team_members` table (has the old value - this is authoritative)
   
3. **The `team_members` table is authoritative** for position and jersey number, so it overrides the `users` table value.

### The RLS Policy Problem

Current policy in `supabase/migrations/20260109_fix_rls_performance_warnings.sql`:

```sql
CREATE POLICY "team_members_update_no_recursion"
ON team_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('coach', 'head_coach')  -- ❌ Only coaches can update!
        AND tm.status = 'active'
    )
);
```

**This policy only allows coaches to update `team_members`.** Since you're a player, your updates are rejected by the database.

## Solution

Apply the SQL fix in `FIX_SETTINGS_SAVE_RLS_POLICY.sql` to add a new policy that allows players to update their own records.

### How to Apply the Fix:

1. **Open Supabase Dashboard**: https://supabase.com/dashboard/project/YOUR_PROJECT
2. **Go to SQL Editor**: Click "SQL Editor" in the left sidebar
3. **Run the fix**:
   - Click "New query"
   - Copy the contents of `FIX_SETTINGS_SAVE_RLS_POLICY.sql`
   - Paste into the editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify the fix**:
   - The query should show 2 policies:
     - `team_members_coaches_can_update` (for coaches)
     - `team_members_players_self_update` (for players)

### What the Fix Does:

- **Keeps coach permissions**: Coaches can still update any team member
- **Adds player self-update**: Players can now update their own `team_members` record
- **Secure**: Players can only update their own record (`user_id = auth.uid()`)

## Code Improvements Made

I also improved the settings component to:

1. **Better error handling**: Now catches and shows RLS errors instead of failing silently
2. **Better logging**: Shows exactly what's being saved to which table
3. **Verification**: Confirms the `team_members` update succeeded before showing success

These changes are in:
- `angular/src/app/features/settings/settings.component.ts`

## Testing the Fix

After applying the SQL fix:

1. Navigate to Settings
2. Change your jersey number
3. Click Save
4. **Check the browser console** for logs:
   - Should see: "Updating team_members with position/jersey:"
   - Should see: "Successfully updated team membership:"
   - Should NOT see any error messages
5. Refresh the page
6. **Your changes should persist!**

## Files Modified

1. **supabase/migrations/20260110_allow_players_update_own_profile.sql** - Migration file (for version control)
2. **FIX_SETTINGS_SAVE_RLS_POLICY.sql** - Quick fix SQL (run this immediately)
3. **angular/src/app/features/settings/settings.component.ts** - Improved error handling and logging

## Next Steps

1. ✅ Run `FIX_SETTINGS_SAVE_RLS_POLICY.sql` in Supabase Dashboard
2. ✅ Test changing jersey number in Settings
3. ✅ Verify changes persist after refresh
4. ✅ Check console logs to confirm updates are working

---

**Note**: This same issue would affect ANY field in `team_members` that players try to update from Settings (like position). The fix resolves all of these issues.
