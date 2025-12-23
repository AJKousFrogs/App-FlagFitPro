# RLS Performance Fixes Summary

## Issue 1: Multiple Permissive Policies

### Problem

The `public.analytics_events` table has multiple permissive policies for the same role (`authenticated`) and actions (`INSERT` and `SELECT`):

- `analytics_events_admin_all` (FOR ALL operations, allows admins)
- `analytics_events_insert_authenticated` (FOR INSERT, allows authenticated users)
- `analytics_events_select_authenticated` (FOR SELECT, allows authenticated users)

### Why This Is a Problem

When multiple permissive policies exist for the same role/action combination, PostgreSQL must evaluate **each policy separately** for every query. Permissive policies are combined with OR logic, meaning:

- Each INSERT operation evaluates both policies (`admin_all` + `insert_authenticated`)
- Each SELECT operation evaluates both policies (`admin_all` + `select_authenticated`)
- This creates unnecessary overhead, especially at scale
- Performance degrades as the number of policies increases

### Solution

Consolidate multiple policies into a **single policy per role/action combination**. The consolidated policies handle both cases:

- Regular users can perform operations on their own events (`user_id = auth.uid()`)
- Admins can perform operations on any events (`auth.role() = 'admin'`)

This applies to all operations: INSERT, SELECT, UPDATE, and DELETE.

### Migration

Run: `database/migrations/033_consolidate_analytics_events_policies.sql`

This migration:

1. Drops both existing policies
2. Creates separate optimized policies for each operation (INSERT, SELECT, UPDATE, DELETE)
3. Each policy handles both user and admin cases in a single condition
4. Uses optimized auth function calls (wrapped in subqueries)

---

## Issue 2: Auth Function Re-evaluation (Previous Fix)

### Problem

RLS policies were calling `auth.role()`, `auth.uid()`, or `current_setting()` directly, causing these functions to be re-evaluated for **each row** in the query.

### Solution

Wrap auth function calls in subqueries: `(SELECT auth.role())` instead of `auth.role()`

### Migration

Run: `database/migrations/032_fix_analytics_events_rls_performance.sql`

---

## Combined Benefits

After applying both migrations:

- ✅ Single policy per role/action (no redundant evaluations)
- ✅ Auth functions evaluated once per query (not per row)
- ✅ Better query performance at scale
- ✅ Same security model maintained

---

## Verification

After running the migrations, verify with:

```sql
-- Check for multiple policies per action
SELECT
    policyname,
    cmd as action,
    roles,
    permissive
FROM pg_policies
WHERE tablename = 'analytics_events'
ORDER BY cmd, policyname;

-- Should show only ONE policy per action for 'authenticated' role
```

---

## Notes

- Both migrations are idempotent (safe to run multiple times)
- The consolidated policies maintain the same security model
- Performance improvements are most noticeable with large datasets
- Consider applying similar fixes to other tables with multiple permissive policies
