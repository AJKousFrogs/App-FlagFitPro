# Running Migration 046 on Supabase

Run the migration on Supabase using one of these methods:

---

## Method 1: Supabase Dashboard SQL Editor (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **Flagfootballapp** (`pvziciccwxgftcielknm`)
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Open `database/migrations/046_fix_acwr_baseline_checks.sql`
6. **Copy the entire contents** and paste into SQL Editor
7. Click **Run** (or press Cmd+Enter)
8. Wait for completion

**Note**: The migration has been fixed to use `users` table instead of `auth.users` for standard Supabase setups.

---

## Method 2: Supabase CLI

```bash
# Link to project (if not already linked)
supabase link --project-ref pvziciccwxgftcielknm

# Run migration
supabase db push --file database/migrations/046_fix_acwr_baseline_checks.sql
```

---

## Method 3: Direct psql Connection

Get the connection string from Supabase Dashboard:

1. Go to **Settings** → **Database**
2. Find **Connection string** → **URI**
3. Use the format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:5432/postgres`

Then run:

```bash
psql "postgresql://postgres.pvziciccwxgftcielknm:[SERVICE_KEY]@[HOST]:5432/postgres" \
  -f database/migrations/046_fix_acwr_baseline_checks.sql
```

---

## Verify Migration

After running, verify the functions were created:

```sql
-- Check functions
SELECT proname FROM pg_proc
WHERE proname LIKE '%acwr%' OR proname LIKE '%baseline%'
ORDER BY proname;

-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('load_monitoring', 'load_daily', 'load_metrics', 'workout_logs')
ORDER BY table_name;

-- Check baseline_days column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'load_monitoring'
AND column_name = 'baseline_days';
```

---

## What Was Fixed in the Migration

1. Changed `auth.users` → `users` (compatible with standard Supabase setups)
2. Fixed `current_date` variable name conflict → `calc_date`
3. Added `workout_logs` table creation if it doesn't exist
4. Added `load_monitoring` table creation if it doesn't exist

The migration will work correctly on Supabase.
