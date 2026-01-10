# Settings Save Issue - Visual Flow

## ❌ BEFORE (Broken Flow)

```
User Changes Jersey Number in Settings
              ↓
       Click "Save" Button
              ↓
   ┌──────────────────────┐
   │  Save to Database    │
   └──────────────────────┘
              ↓
   ┌──────────────────────────────────────┐
   │ 1. Update `users` table              │
   │    ✅ Succeeds (RLS allows)          │
   │                                      │
   │ 2. Update `team_members` table       │
   │    ❌ FAILS SILENTLY (RLS blocks)    │
   │       Player role = no permission    │
   └──────────────────────────────────────┘
              ↓
    "✅ Settings Saved" Message
    (User thinks it worked!)
              ↓
       User Refreshes Page
              ↓
   ┌──────────────────────────────────────┐
   │ Load Settings from Database          │
   │                                      │
   │ 1. Load from `users` table           │
   │    → Gets new jersey number          │
   │                                      │
   │ 2. Load from `team_members` table    │
   │    → Gets OLD jersey number          │
   │    → OVERRIDES users table ⚠️        │
   └──────────────────────────────────────┘
              ↓
    ❌ Jersey number reverts to old value
```

## ✅ AFTER (Fixed Flow)

```
User Changes Jersey Number in Settings
              ↓
       Click "Save" Button
              ↓
   ┌──────────────────────┐
   │  Save to Database    │
   └──────────────────────┘
              ↓
   ┌──────────────────────────────────────┐
   │ 1. Update `users` table              │
   │    ✅ Succeeds (RLS allows)          │
   │                                      │
   │ 2. Update `team_members` table       │
   │    ✅ SUCCEEDS! (New RLS policy)     │
   │       Player can update own record   │
   └──────────────────────────────────────┘
              ↓
    "✅ Settings Saved" Message
    (Actually worked this time!)
              ↓
       User Refreshes Page
              ↓
   ┌──────────────────────────────────────┐
   │ Load Settings from Database          │
   │                                      │
   │ 1. Load from `users` table           │
   │    → Gets new jersey number          │
   │                                      │
   │ 2. Load from `team_members` table    │
   │    → Gets NEW jersey number ✅       │
   │    → Confirms the change             │
   └──────────────────────────────────────┘
              ↓
    ✅ Jersey number shows new value!
```

## The Fix Explained

### What Was Wrong?
**RLS Policy** on `team_members` table:
```sql
-- OLD POLICY (too restrictive)
WHERE tm.role IN ('coach', 'head_coach')  -- ❌ Only coaches!
```

### What We Added?
**New RLS Policy** that also allows players:
```sql
-- NEW POLICY (allows player self-update)
CREATE POLICY "team_members_players_self_update"
ON team_members FOR UPDATE
USING (
    user_id = auth.uid()  -- ✅ Player can update own record
)
```

## Apply the Fix

### 1️⃣ Run This SQL (2 minutes)
Open: `FIX_SETTINGS_SAVE_RLS_POLICY.sql`
Run in: Supabase Dashboard → SQL Editor

### 2️⃣ Test (1 minute)
- Go to Settings
- Change jersey number
- Click Save
- Refresh page
- ✅ Number should persist!

### 3️⃣ Verify (30 seconds)
Check browser console (F12) for:
```
✅ "Updating team_members with position/jersey:"
✅ "Successfully updated team membership:"
```

## Why This Happened

The database has **Row Level Security** (RLS) policies that control who can read/write data.

The `team_members` table had a policy that said:
- ✅ Coaches can update any team member
- ❌ Players **cannot** update anyone (including themselves)

This was an oversight - players need to update their own position and jersey number!

## Files to Check

1. **`QUICK_FIX_CHECKLIST.md`** - Step-by-step instructions
2. **`FIX_SETTINGS_SAVE_RLS_POLICY.sql`** - SQL to run
3. **`SETTINGS_SAVE_FIX_EXPLANATION.md`** - Detailed technical explanation

---

**Bottom Line**: Run the SQL fix in Supabase Dashboard, and your settings will save correctly! 🎉
