# Migration 048: Fix SECURITY DEFINER Views

**Created**: January 21, 2025  
**Purpose**: Fix security linter errors for views using SECURITY DEFINER  
**Status**: Ready to run

---

## Security Issue

Supabase database linter detected **2 views** using `SECURITY DEFINER`:

1. `user_training_summary` - Created in migration 043
2. `postgrest_exposed_tables` - Created in migration 047

### Why This Is a Problem

`SECURITY DEFINER` views execute with the **creator's permissions** (usually a superuser), which can:

- ❌ Bypass Row Level Security (RLS) policies
- ❌ Expose sensitive data to unauthorized users
- ❌ Create security vulnerabilities

### Solution

Use `SECURITY INVOKER` instead, which:

- ✅ Executes with the **querying user's permissions**
- ✅ Respects RLS policies
- ✅ Maintains proper security boundaries

---

## What This Migration Does

1. **Fixes `user_training_summary` view**: Recreates it with `SECURITY INVOKER`
2. **Verifies fix**: Checks that views no longer use SECURITY DEFINER
3. **Grants permissions**: Ensures proper access for `anon` and `authenticated` roles

---

## How to Run

### Method 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: **Flagfootballapp** (`pvziciccwxgftcielknm`)
3. Click **SQL Editor** → **New query**
4. Open file: `database/migrations/048_fix_security_definer_views.sql`
5. **Copy the entire contents** and paste into SQL Editor
6. Click **Run** (or press Cmd+Enter)
7. Wait for completion (~5 seconds)

**Expected Result**:

```
NOTICE: Fixed user_training_summary view to use SECURITY INVOKER
NOTICE: All views now use SECURITY INVOKER
Success. No rows returned
```

### Method 2: Supabase CLI

```bash
supabase link --project-ref pvziciccwxgftcielknm
supabase db push --file database/migrations/048_fix_security_definer_views.sql
```

---

## Verification

After running the migration, verify it worked:

```sql
-- Check view security settings
SELECT
    viewname,
    viewowner,
    definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('user_training_summary', 'postgrest_exposed_tables');

-- Verify views are accessible
SELECT * FROM user_training_summary LIMIT 1;
SELECT * FROM postgrest_exposed_tables WHERE is_core_table = true LIMIT 5;
```

---

## Related Migrations

- **Migration 047**: Created `postgrest_exposed_tables` view (already fixed with SECURITY INVOKER)
- **Migration 043**: Created `user_training_summary` view (fixed in this migration)

---

## Notes

- ✅ Migration is **idempotent** (safe to run multiple times)
- ✅ Only modifies view security settings, doesn't change data
- ✅ Maintains all existing functionality
- ✅ PostgreSQL 15+ required for `WITH (security_invoker = true)` syntax

---

## Next Steps

1. ✅ Run Migration 048
2. ✅ Verify linter errors are resolved
3. ✅ Test views still work correctly
4. ✅ Review other views for similar issues

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL View Security](https://www.postgresql.org/docs/current/sql-createview.html)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
