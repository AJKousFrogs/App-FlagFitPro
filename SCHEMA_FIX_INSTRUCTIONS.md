# Database Schema Fix - Step-by-Step Instructions

**Issue:** Profile saves fail because database schema doesn't match what the TypeScript/UI layer expects.

**Status:** 🔴 CRITICAL - Migration file exists but NOT applied to database

**Time Required:** 15-20 minutes

---

## ⚡ Quick Fix (For Immediate Resolution)

### Step 1: Apply Migration 112 to Database (5 minutes)

1. **Open Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Run Migration:**
   ```bash
   # Copy the entire contents of this file:
   database/migrations/112_fix_users_table_profile_fields.sql
   
   # Paste into SQL Editor
   # Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (Windows)
   ```

4. **Verify Migration Succeeded:**
   ```sql
   -- Run this query to verify columns were added:
   SELECT column_name, data_type, character_maximum_length 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = 'users' 
     AND column_name IN ('full_name', 'jersey_number', 'phone', 'team', 'date_of_birth')
   ORDER BY column_name;
   ```

   **Expected output:**
   ```
   column_name    | data_type            | character_maximum_length
   ---------------+---------------------+-------------------------
   date_of_birth  | date                | NULL
   full_name      | character varying   | 200
   jersey_number  | integer             | NULL
   phone          | character varying   | 20
   team           | character varying   | 100
   ```

   If you see all 5 columns, migration succeeded! ✅

### Step 2: Regenerate TypeScript Types (2 minutes)

```bash
# In your terminal, run:
cd "/Users/aljosaursakous/Desktop/Flag football HTML - APP"

# Generate fresh types from updated database schema:
npx supabase gen types typescript \
  --project-id <YOUR_PROJECT_ID> \
  --schema public > supabase-types.ts

# Or if you have Supabase CLI configured with linked project:
npx supabase gen types typescript --linked > supabase-types.ts
```

**Find your project ID:**
- Supabase Dashboard → Settings → General → Project ID

### Step 3: Test Profile Save (5 minutes)

1. **Restart dev server** (if running):
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   # Or whatever your dev command is
   ```

2. **Open app in browser:**
   - Navigate to Settings page
   - Open DevTools (F12) → Console tab
   - Open DevTools → Network tab

3. **Test save:**
   - Change: Display Name, Date of Birth, Position, Jersey Number, Phone
   - Click "Save Changes"

4. **Verify success:**
   - ✅ Console shows: "User profile saved successfully:"
   - ✅ Network tab shows: 200 OK response from Supabase
   - ✅ Success toast appears
   - ✅ No error messages

5. **Verify persistence:**
   - Refresh page (F5)
   - Verify your changes are still there ✅

6. **Verify in database (optional but recommended):**
   ```sql
   -- In Supabase SQL Editor:
   SELECT id, full_name, jersey_number, phone, date_of_birth, 
          created_at, updated_at
   FROM users 
   WHERE email = 'your-email@example.com';
   
   -- Check:
   -- ✅ full_name has your display name
   -- ✅ jersey_number has your number
   -- ✅ phone has your phone
   -- ✅ date_of_birth has your DOB (YYYY-MM-DD)
   -- ✅ created_at is ORIGINAL (NOT recent)
   -- ✅ updated_at is RECENT (when you saved)
   ```

---

## 📋 Detailed Explanation

### What Was Wrong?

The settings component tried to save these fields that didn't exist in the database:

| Field | Code Tried to Save | Database Had | Result |
|-------|-------------------|--------------|--------|
| `full_name` | ✅ Yes | ❌ Missing | Save failed |
| `jersey_number` | ✅ Yes | ❌ Missing | Save failed |
| `phone` | ✅ Yes | ❌ Missing | Save failed |
| `date_of_birth` | ✅ Yes | ❌ Named `birth_date` | Save failed |

**Result:** All profile changes were saved to `localStorage` only, not the database. On page refresh, changes disappeared.

### What Migration 112 Does

```sql
-- 1. Adds missing columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS jersey_number INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team VARCHAR(100);

-- 2. Fixes column name mismatch
ALTER TABLE public.users RENAME COLUMN birth_date TO date_of_birth;

-- 3. Backfills existing data
UPDATE public.users 
SET full_name = TRIM(CONCAT(first_name, ' ', last_name))
WHERE full_name IS NULL;

-- 4. Adds performance indexes
CREATE INDEX idx_users_full_name ON public.users(full_name);
CREATE INDEX idx_users_jersey_number ON public.users(jersey_number);
```

**Benefits:**
- ✅ All columns now exist
- ✅ Column names match code expectations
- ✅ Existing users get `full_name` populated automatically
- ✅ Queries are optimized with indexes
- ✅ Fully backwards-compatible (no data loss)

---

## 🔒 Safety Checks

### Before Running Migration

1. **Backup recommended** (if production):
   ```bash
   # From Supabase Dashboard → Database → Backups
   # Or via CLI:
   pg_dump $DATABASE_URL > backup_before_migration_112.sql
   ```

2. **Migration is safe because:**
   - ✅ All new columns are nullable (won't break existing rows)
   - ✅ Uses `IF NOT EXISTS` (can run multiple times safely)
   - ✅ Renames column atomically (no data loss)
   - ✅ Backfills data automatically
   - ✅ No breaking changes to existing code

### After Running Migration

1. **Verify no errors:**
   - Check Supabase Dashboard → Logs
   - Look for any SQL errors
   - All should be green ✅

2. **Test existing functionality:**
   - Login still works ✅
   - User profile loads ✅
   - No console errors ✅

3. **Test new functionality:**
   - Profile save works ✅
   - Changes persist ✅
   - Database updated ✅

---

## 🐛 Troubleshooting

### Issue: "column birth_date does not exist"

**Cause:** Migration 112 already ran partially, or `birth_date` was already renamed.

**Fix:**
```sql
-- Check current state:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('birth_date', 'date_of_birth');

-- If you see 'date_of_birth', that's correct! Skip the RENAME step.
-- If you see 'birth_date', run the rename:
ALTER TABLE public.users RENAME COLUMN birth_date TO date_of_birth;
```

### Issue: "column full_name already exists"

**Cause:** Migration 112 already ran, or column was added manually.

**Fix:** This is actually good! It means the column exists. Verify with:
```sql
SELECT full_name FROM users LIMIT 5;
```

If you see data, you're all set! ✅

### Issue: Profile save still fails after migration

**Checklist:**
1. ✅ Did you restart your dev server?
2. ✅ Did you regenerate TypeScript types?
3. ✅ Did you clear browser cache? (Hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
4. ✅ Check console for actual error message

**Debug query:**
```sql
-- Check what columns actually exist:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

Compare output with `DATABASE_SCHEMA_AUDIT_REPORT.md` → Section "Complete Column Inventory"

### Issue: TypeScript errors after regenerating types

**Cause:** Code references old field names.

**Fix:**
```bash
# Search for old field name usage:
grep -r "birth_date" angular/src/

# Replace with date_of_birth where needed
# (Most should already be date_of_birth from previous fixes)
```

---

## 📊 Verification Checklist

After applying fix, verify:

- [ ] Migration 112 ran successfully (no SQL errors)
- [ ] All 5 columns exist in database (`full_name`, `jersey_number`, `phone`, `team`, `date_of_birth`)
- [ ] TypeScript types regenerated (`supabase-types.ts` shows new fields)
- [ ] Dev server restarted
- [ ] Profile page loads without errors
- [ ] Can change profile information
- [ ] Save button works (200 OK in Network tab)
- [ ] Success toast shows (no error toast)
- [ ] Console shows "User profile saved successfully"
- [ ] Page refresh preserves changes
- [ ] Database query shows updated data
- [ ] `created_at` did NOT change
- [ ] `updated_at` DID change

---

## 📦 Committing the Fix

Once verified, commit the generated types:

```bash
git add supabase-types.ts
git commit -m "fix: regenerate types after migration 112 (add profile fields)"
git push
```

**Note:** Do NOT commit migration 112 changes - it's already created. Just apply it via Supabase Dashboard.

---

## 🚀 Production Deployment

### For Staging Environment

1. Apply migration 112 to staging database (same steps as above)
2. Deploy code to staging
3. Test thoroughly
4. Verify with real user account

### For Production Environment

1. **Announce maintenance window** (optional - migration is non-blocking)
2. **Backup production database**
3. **Apply migration 112** via Supabase Dashboard
4. **Verify migration succeeded** (run verification query)
5. **Deploy code** (if any changes needed)
6. **Test with test account** in production
7. **Monitor errors** for 24 hours
8. **Announce fix** to users

---

## 📞 Support

**If migration fails:**
1. Check Supabase Dashboard → Logs for error details
2. Screenshot the error
3. Check `DATABASE_SCHEMA_AUDIT_REPORT.md` for context
4. DO NOT run migration again until error is resolved

**If profile save still fails after migration:**
1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify TypeScript types were regenerated
4. Verify dev server was restarted
5. Try hard refresh (clear cache)

---

## Summary

**What:** Apply migration 112 to add missing database columns

**Where:** Supabase Dashboard → SQL Editor

**When:** Now (migration is safe and non-blocking)

**Why:** Profile saves are failing because database schema doesn't match code expectations

**How Long:** 15-20 minutes total

**Risk:** Low (migration is backwards-compatible)

**Result:** Profile saves will work correctly and persist to database ✅

---

**Created:** January 9, 2026  
**Related Files:**
- `database/migrations/112_fix_users_table_profile_fields.sql` (the migration to apply)
- `DATABASE_SCHEMA_AUDIT_REPORT.md` (detailed analysis)
- `PROFILE_SAVE_FIX_SUMMARY.md` (previous fix attempts)
- `angular/src/app/features/settings/settings.component.ts` (code that needs database)
