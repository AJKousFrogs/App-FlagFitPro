# Setup Teams - Quick Start

## Step 1: Create All Teams

You have **2 options** to create the teams:

### Option A: Node.js Script (Easiest)

```bash
node scripts/create-all-teams.cjs
```

This will create all 4 teams in your database.

### Option B: SQL Migration (Alternative)

1. Go to **Supabase Dashboard → SQL Editor**
2. Open file: `database/migrations/056_create_all_teams.sql`
3. Copy entire contents
4. Paste in SQL Editor
5. Click **Run**

---

## Step 2: Verify Teams Were Created

Run the diagnostic:

```bash
node scripts/diagnose-real-issue.cjs
```

You should see all 4 teams listed.

---

## Step 3: Test the Settings Page

1. Go to **Settings page** in your app
2. Look at the **Team dropdown** - you should see:
   - ✅ Ljubljana Frogs - International
   - ✅ Ljubljana Frogs - Domestic
   - ✅ American Samoa National Team - Men
   - ✅ American Samoa National Team - Women

3. Select your team (e.g., "Ljubljana Frogs - International")
4. Set your jersey number (e.g., 55)
5. Set your position (e.g., Center)
6. Click **"Save Changes"**

7. **Open browser console (F12)** and verify:
   - ✅ "Settings saved successfully" toast appears
   - ✅ No red error messages
   - ✅ Console shows: "Services refreshed successfully"

8. **Hard refresh the page** (Cmd/Ctrl + Shift + R)
9. Verify your changes persisted

---

## Troubleshooting

### Teams don't appear in dropdown

**Check 1:** Are they in the database?
```bash
node scripts/diagnose-real-issue.cjs
```

**Check 2:** Are they approved?
- Teams need `approval_status = 'approved'` to appear in the dropdown
- The script sets this automatically

**Check 3:** Check the `loadAvailableTeams()` function:
```typescript
// settings.component.ts lines 1349-1377
.eq("approval_status", "approved")  // <- Only shows approved teams
```

### Changes don't save

**Open browser console (F12) when clicking Save:**

1. **Check for errors:**
   - Look for red error messages
   - Check Network tab for failed requests

2. **Check logs:**
   - Should see: "Saving settings for user: [id]"
   - Should see: "Upserting users table with: [data]"
   - Should see: "Updating team membership: [team-id]"
   - Should see: "Services refreshed successfully"

3. **Common issues:**
   - Database RLS policies blocking insert/update
   - Missing service role key
   - Team ID not found
   - Validation error

### Changes save but revert after refresh

**This means the save worked, but the load is reading old data.**

Run diagnostic to see current database state:
```bash
node scripts/diagnose-real-issue.cjs
```

Check:
- Does `team_members` table show correct jersey number?
- Does it show correct team_id?
- Is the status = 'active'?

**If database shows correct data but UI shows old:**
- Hard refresh (Cmd/Ctrl + Shift + R)
- Clear browser cache
- Check browser console for errors during page load

---

## Understanding the Data Flow

### When page loads:
```
1. Load from users table → jersey: 50, team: null
2. Load from team_members table → jersey: 55, team: "Frogs Domestic"
3. Override form with team_members data ← This is what you see!
```

### When you click Save:
```
1. Update users table → jersey: 47
2. Update team_members table → jersey: 47, team: "Frogs International"
3. Refresh team_members service → Reload from database
4. Form should now show jersey: 47, team: "Frogs International"
```

### The `team_members` table is authoritative!

Whatever is in `team_members` will override the `users` table when the form loads.

---

## Files Created

| File | Purpose |
|------|---------|
| `scripts/create-all-teams.cjs` | Creates all 4 teams |
| `scripts/diagnose-real-issue.cjs` | Shows current database state |
| `database/migrations/056_create_all_teams.sql` | SQL alternative |
| `SETTINGS_ISSUE_README.md` | Detailed troubleshooting |
| `SETUP_TEAMS_QUICKSTART.md` | This file |

---

## Quick Commands

```bash
# Create all teams
node scripts/create-all-teams.cjs

# Check current state
node scripts/diagnose-real-issue.cjs

# If you need to test, you can directly check Supabase:
# Go to Supabase Dashboard → Table Editor → teams
```

---

## Next Steps After Creating Teams

1. ✅ Teams are created
2. ✅ Go to Settings page
3. ✅ Select your team from dropdown
4. ✅ Set jersey number and position
5. ✅ Click Save Changes
6. ✅ Verify with hard refresh

If issues persist, run the diagnostic and check browser console! 🎯
