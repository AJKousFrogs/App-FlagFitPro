# Settings Page - Team Selection Issue

## What You're Experiencing

When you try to:
1. Select "Ljubljana Frogs - International" team from the dropdown
2. Change your jersey number (e.g., from 55 to 47)
3. Click "Save Changes"

**Expected:** The changes should save and persist when you refresh the page.

**Actual:** The data either doesn't save or reverts back to the old values.

## Quick Diagnosis

Run this to see what's currently in your database:

```bash
node scripts/diagnose-real-issue.cjs
```

This will show you:
- What teams exist in your database
- Your current team membership
- What's preventing the save from working

## Most Likely Issues

### Issue 1: Teams Don't Exist

The required teams might not exist in your database yet. Users should be able to choose from:
- Ljubljana Frogs - International
- Ljubljana Frogs - Domestic
- American Samoa National Team - Men
- American Samoa National Team - Women

**Fix:**
```bash
node scripts/create-all-teams.cjs
```

Then go to Settings and try saving again.

### Issue 2: Team Membership Not Updating

The `saveSettings()` function updates your team membership in the `team_members` table, but there might be:
- Database permissions issue
- Validation error
- Network error

**Debug:**
1. Open browser console (F12)
2. Go to Settings page
3. Change jersey number and click Save
4. Look for:
   - Red error messages
   - Failed network requests (Network tab)
   - JavaScript errors (Console tab)

### Issue 3: Page Not Refreshing Data

After save, the page reloads data from the database. If it shows old values:
- Hard refresh (Cmd/Ctrl + Shift + R)
- Check if "Settings saved successfully" toast appeared
- Check browser console for errors during data refresh

## Understanding the Code Flow

When you click "Save Changes":

```typescript
saveSettings() {
  // 1. Update users table (lines 654-695)
  await supabase.from('users').upsert({
    jersey_number: parseInt(jerseyNumber)
  });
  
  // 2. Update team_members table (lines 698-706)
  if (teamId) {
    await updateTeamMembership(userId, teamId, position, jerseyNumber);
  }
  
  // 3. Refresh services (lines 789-794)
  await teamMembershipService.refresh(); // <- Reloads from database
}
```

The `team_members` table is the **authoritative source** for position and jersey number. When the page loads, it reads from there and overrides any values from the `users` table (lines 558-572).

## How to Test the Fix

1. **Make a change:**
   - Change jersey from 55 to 47
   - Select different team if desired
   - Click "Save Changes"

2. **Verify immediately:**
   - Check for success toast message
   - Open browser console - look for these logs:
     ```
     Saving settings for user: [your-id]
     Upserting users table with: [data]
     Updating team membership: [team-id]
     Services refreshed successfully
     ```

3. **Hard refresh page:**
   - Press Cmd/Ctrl + Shift + R
   - Check if jersey number shows 47
   - Check if team selection persists

4. **Check database directly (optional):**
   ```bash
   node scripts/diagnose-real-issue.cjs
   ```
   Should show jersey_number: 47

## Need More Help?

If the above doesn't fix it, we need to see:

1. **Browser console errors** - Screenshot or copy the error messages
2. **Network tab** - Check if the Supabase API calls are failing
3. **Diagnostic output** - Run `node scripts/diagnose-real-issue.cjs` and share the output

The issue is likely one of:
- Missing teams in database → Run create-ljubljana-teams script
- Database permission issue → Check RLS policies
- Frontend validation error → Check browser console
- Network/API error → Check Network tab

## Files

- `scripts/diagnose-real-issue.cjs` - Check current state
- `scripts/create-all-teams.cjs` - Create all 4 teams
- `SETTINGS_ISSUE_README.md` - This file

## Available Teams

After running `create-all-teams.cjs`, users can select from:
1. **Ljubljana Frogs - International**
2. **Ljubljana Frogs - Domestic**
3. **American Samoa National Team - Men**
4. **American Samoa National Team - Women**
