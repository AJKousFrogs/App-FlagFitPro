# Quick Fix Checklist - Settings Save Issue

## The Problem
- Jersey number changes don't persist after page refresh
- Root cause: RLS policy prevents players from updating `team_members` table

## Fix Steps (5 minutes)

### Step 1: Apply Database Fix
1. Open your Supabase Dashboard at: https://supabase.com/dashboard
2. Navigate to: **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Open the file: `FIX_SETTINGS_SAVE_RLS_POLICY.sql` from your project root
5. Copy all contents and paste into the SQL editor
6. Click **"Run"** (or press Cmd+Enter)
7. ✅ You should see output showing 2 policies created

### Step 2: Rebuild the App
```bash
cd /Users/aljosaursakous/Desktop/Flag\ football\ HTML\ -\ APP
npm run build
```

### Step 3: Test the Fix
1. Open your app and navigate to Settings
2. Change your jersey number (e.g., from current to a different number)
3. Click **Save**
4. ✅ Success message should appear
5. Open browser console (F12)
6. Look for these logs:
   - ✅ "Updating team_members with position/jersey:"
   - ✅ "Successfully updated team membership:"
7. **Refresh the page** (F5 or Cmd+R)
8. ✅ Your jersey number should persist!

## Verification
- [ ] SQL query ran successfully (2 policies created)
- [ ] App rebuilt without errors
- [ ] Jersey number change saves successfully
- [ ] Console shows successful update logs
- [ ] Jersey number persists after refresh

## If It Still Doesn't Work

Check browser console for error messages. Common issues:
- **RLS error still showing**: The SQL fix didn't apply correctly
- **"Failed to update team_members"**: Check the error details in console
- **No logs showing**: Clear browser cache and try again

## Files Changed
- ✅ `supabase/migrations/20260110_allow_players_update_own_profile.sql` - Migration
- ✅ `FIX_SETTINGS_SAVE_RLS_POLICY.sql` - Quick fix SQL
- ✅ `angular/src/app/features/settings/settings.component.ts` - Better error handling
- ✅ `SETTINGS_SAVE_FIX_EXPLANATION.md` - Detailed explanation

## Need Help?
Read the detailed explanation in: `SETTINGS_SAVE_FIX_EXPLANATION.md`
