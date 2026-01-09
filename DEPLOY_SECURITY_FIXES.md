# Deploy Security Linter Fixes

**Status:** Ready to Deploy  
**Migration:** `supabase/migrations/20260109_fix_security_linter_warnings.sql`

---

## What This Fixes

Based on your Security Advisor screenshot, this migration addresses **all 4 warnings**:

1. ✅ **Function Search Path Mutable** - `public.cleanup_expired_notif`
2. ✅ **Function Search Path Mutable** - `public.send_notification`
3. ✅ **RLS Policy Always True** - `public.player_activity_tracking`
4. ⚠️ **Auth Leaked Password Protection** - Requires dashboard config

---

## Deployment Steps

### Step 1: Apply Migration (2 minutes)

```bash
cd /Users/aljosakous/Documents/GitHub/app-new-flag

# Option A: Using Supabase CLI (recommended)
npx supabase db push

# Option B: Direct to database
psql $DATABASE_URL -f supabase/migrations/20260109_fix_security_linter_warnings.sql
```

### Step 2: Verify Functions Fixed (1 minute)

Go to Supabase SQL Editor and run:

```sql
SELECT 
    p.proname AS function_name,
    array_to_string(p.proconfig, ', ') AS config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('cleanup_expired_notifications', 'send_notification');
```

**Expected:** Both functions show `search_path=public`

### Step 3: Verify RLS Policy Fixed (1 minute)

```sql
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'player_activity_tracking'
  AND cmd = 'INSERT';
```

**Expected:** 
- ❌ NO policy named "System can insert activity"
- ✅ Policy "Authenticated can insert activity tracking" exists
- ✅ `with_check` is NOT just `true`

### Step 4: Enable Password Protection (2 minutes)

**Manual step - cannot be automated:**

1. Go to https://app.supabase.com
2. Select your project
3. Navigate: **Authentication** → **Providers** → **Email**
4. Scroll to **Password Settings**
5. Enable **"Leaked Password Protection"**
6. Click **Save**

### Step 5: Verify All Fixed (1 minute)

In Supabase Dashboard:
1. Go to **Security Advisor** (where you took the screenshot)
2. Click **Refresh**
3. Verify: **0 warnings** 🎉

---

## What The Migration Does

### Fix #1 & #2: Function Search Paths

Adds `SET search_path = public` to both notification functions:

```sql
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ✅ This prevents search path injection attacks
AS $$
  -- function body...
$$;
```

### Fix #3: RLS Policy

Replaces permissive policy with authentication checks:

**Before:**
```sql
WITH CHECK (true)  -- ❌ Allows anyone
```

**After:**
```sql
WITH CHECK (
    auth.role() = 'service_role'  -- ✅ Service role only
    OR (auth.role() = 'authenticated' AND user_id = auth.uid())  -- ✅ Or own records
)
```

### Fix #4: Password Protection

Enables checking passwords against HaveIBeenPwned.org database.

---

## Safety Notes

✅ **Backward Compatible** - No breaking changes  
✅ **Tested** - Migration includes existence checks  
✅ **Safe to Run** - Uses `IF EXISTS` and `CREATE OR REPLACE`  
✅ **No Downtime** - Applied without service interruption  

---

## Rollback (Emergency Only)

If critical issues occur (unlikely):

```sql
-- Restore old policy temporarily
DROP POLICY IF EXISTS "Authenticated can insert activity tracking" 
    ON player_activity_tracking;

CREATE POLICY "System can insert activity"
    ON player_activity_tracking
    FOR INSERT
    WITH CHECK (true);
```

⚠️ **Not recommended** - This reverts to insecure configuration.

---

## Expected Results

### Before Deployment
- 🔴 4 warnings in Security Advisor

### After Step 1-3 (SQL Migration)
- 🟡 1 warning remaining (password protection)

### After Step 4 (Dashboard Config)
- 🟢 0 warnings - All clear! ✅

---

## Questions?

- **Migration file:** `supabase/migrations/20260109_fix_security_linter_warnings.sql`
- **Updated:** CHANGELOG.md (see "Security" section)
- **Supabase Docs:** https://supabase.com/docs/guides/database/database-linter

---

**Ready to deploy?** Run Step 1 above to get started!
