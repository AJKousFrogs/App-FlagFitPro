# Supabase Security Linter Warnings - Resolution Guide

**Date:** January 9, 2026  
**Migration:** `supabase/migrations/20260109_fix_security_linter_warnings.sql`

## Overview

This document addresses the security warnings identified by the Supabase database linter. These warnings relate to function security and RLS policy configurations.

---

## Issues Identified

### 1. Function Search Path Mutable (WARN)

**Functions Affected:**
- `public.cleanup_expired_notifications`
- `public.send_notification`

**Issue:**  
These functions were created without a fixed `search_path` parameter. This is a security concern because attackers could potentially manipulate the search path to execute malicious code by creating schemas/functions with the same names that would be found first in the search path.

**Severity:** Medium (WARN)  
**Category:** SECURITY

**Fix Applied:**  
Added `SET search_path = public` to both functions. This ensures the functions always look for database objects in the `public` schema, preventing search path manipulation attacks.

```sql
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ✅ Added this line
AS $$
...
```

---

### 2. RLS Policy Always True (WARN)

**Table:** `public.player_activity_tracking`  
**Policy:** `System can insert activity`

**Issue:**  
The policy used `WITH CHECK (true)`, which allows unrestricted INSERT access. This effectively bypasses row-level security for INSERT operations, which is a security risk.

**Severity:** Medium (WARN)  
**Category:** SECURITY

**Original Policy:**
```sql
CREATE POLICY "System can insert activity"
ON public.player_activity_tracking
FOR INSERT
WITH CHECK (true);  -- ❌ Overly permissive
```

**Fix Applied:**  
Replaced with a more restrictive policy that only allows:
1. Service role (for background jobs and triggers)
2. Authenticated users inserting their own records

```sql
CREATE POLICY "Authenticated can insert activity tracking"
ON public.player_activity_tracking
FOR INSERT
WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.role() = 'authenticated' AND user_id = auth.uid())
);
```

**Additional Policies Added:**
- Players can view their own activity tracking
- Coaches can view their team's activity tracking

---

### 3. Auth Leaked Password Protection Disabled (WARN)

**Issue:**  
Supabase Auth's leaked password protection is currently disabled. This feature checks user passwords against the HaveIBeenPwned.org database to prevent use of compromised passwords.

**Severity:** Medium (WARN)  
**Category:** SECURITY

**Fix Required:**  
⚠️ **This cannot be fixed via SQL migration.** It requires manual configuration in the Supabase Dashboard.

**Steps to Enable:**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** > **Providers**
3. Under the **Email** provider, find **Password Settings**
4. Enable **Leaked Password Protection**
5. Save changes

**Benefits:**
- Prevents users from setting passwords that have been exposed in data breaches
- Enhances overall account security
- Protects against credential stuffing attacks

**Reference:**  
[Supabase Password Security Guide](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-security)

---

## Migration Deployment

### Automatic Deployment

The migration file will be automatically applied when:
- Running `npm run db:reset`
- Running `npx supabase db push`
- Deploying to production (if migrations are auto-applied)

### Manual Deployment

If you need to apply this migration manually:

```bash
# Using Supabase CLI
npx supabase db push

# Or apply directly to a specific database
psql $DATABASE_URL -f supabase/migrations/20260109_fix_security_linter_warnings.sql
```

---

## Verification

After applying the migration, verify the fixes:

### 1. Check Function Search Paths

```sql
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type,
    p.prosecdef AS is_security_definer,
    array_to_string(p.proconfig, ', ') AS function_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('cleanup_expired_notifications', 'send_notification');
```

Expected result: `function_config` column should contain `search_path=public`

### 2. Check RLS Policies

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'player_activity_tracking'
  AND policyname LIKE '%insert%';
```

Expected result: No policy with `WITH CHECK (true)` should be present.

### 3. Re-run Supabase Linter

In the Supabase Dashboard:
1. Go to **Database** > **Database Linter**
2. Run the linter
3. Verify that the three SQL-fixable warnings are resolved
4. Only the "Auth Leaked Password Protection" warning should remain (requires manual dashboard fix)

---

## Security Best Practices Applied

### Function Security

✅ **SET search_path = public**: All SECURITY DEFINER functions now have a fixed search path  
✅ **Explicit schema qualification**: Functions reference `public.` schema explicitly  
✅ **Proper grants**: Functions have appropriate EXECUTE permissions

### RLS Policies

✅ **Least privilege**: Policies now check user identity and roles  
✅ **No permissive policies**: Removed `WITH CHECK (true)` patterns  
✅ **Multi-layered access**: Separate policies for players and coaches  
✅ **Service role access**: Background jobs can still operate correctly

---

## Impact Assessment

### Breaking Changes
❌ **None** - The changes are backward compatible

### Affected Operations
✅ All existing operations continue to work  
✅ Triggers that insert into `player_activity_tracking` continue to work (via service role)  
✅ Notification functions remain functional

### Performance
- No performance impact expected
- RLS policies use indexed columns (`user_id`, `team_id`)

---

## Action Items

### For Developers
- [x] Review and apply the migration
- [x] Test player activity tracking functionality
- [x] Test notification sending
- [x] Verify triggers still work correctly

### For DevOps/Admin
- [ ] Enable "Leaked Password Protection" in Supabase Dashboard
- [ ] Verify migration applied successfully in production
- [ ] Monitor error logs for any RLS policy issues
- [ ] Run database linter to confirm fixes

### For Security Team
- [ ] Review the migration for completeness
- [ ] Verify all four warnings are addressed
- [ ] Update security audit documentation

---

## Related Documentation

- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL Search Path Security](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Password Security Best Practices](https://supabase.com/docs/guides/auth/password-security)

---

## Questions or Issues?

If you encounter any issues after applying this migration:

1. Check the migration logs for errors
2. Verify RLS policies with the SQL queries above
3. Test the affected functions manually
4. Review the Supabase logs in the Dashboard

For questions, contact the database team or create an issue in the repository.
