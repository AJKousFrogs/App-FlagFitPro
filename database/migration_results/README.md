# Migration Results Directory

This directory contains the results of running SQL migrations on Supabase.

## Files Generated

- `*_result.txt` - Output from each migration execution
- `*_errors.txt` - Error messages (if migration failed)
- `migration_run_*.log` - Complete execution log with timestamps
- `migration_summary_*.md` - Summary of all migrations run

## Running Migrations

To run all migrations and save results:

```bash
./scripts/run-all-migrations-supabase.sh
```

Or manually via Supabase Dashboard:

1. Go to https://supabase.com/dashboard
2. Select project: Flagfootballapp (`pvziciccwxgftcielknm`)
3. Click **SQL Editor** → **New query**
4. Copy/paste migration file contents
5. Click **Run**

## Migration Order

Migrations should be run in numerical order:

1. `001_base_tables.sql`
2. `025_complete_flag_football_player_system.sql`
3. ... (continues numerically)
4. `046_fix_acwr_baseline_checks_supabase.sql`

## Notes

- All migrations are idempotent (safe to run multiple times)
- Use `*_supabase.sql` versions for Supabase (uses `auth.users`)
- Use regular versions for Neon DB (uses `users`)
