# Supabase Project Migration Guide

This guide explains how to migrate from the old Supabase project to the new one.

## New Supabase Project Details

- **Project ID**: `grfjmnjpzvknmsxrwesx`
- **URL**: `https://grfjmnjpzvknmsxrwesx.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDI4OTksImV4cCI6MjA4NTA3ODg5OX0.63Do5rUEHBT7-pZEXzFFHB5LqFRaXWAt-YrH2v45vo0`
- **Service Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMjg5OSwiZXhwIjoyMDg1MDc4ODk5fQ.GIETcsbB9U_CRoeOhONwykUgMWzdWdU--QuyDr2BPaw`

## Configuration Updates Completed

All configuration files have been updated with the new Supabase project credentials:

✅ **Angular Environment** (`angular/src/environments/environment.ts`)
✅ **Environment Files** (`.env.example`, `.env.netlify`)
✅ **Netlify Configuration** (`netlify.toml`)
✅ **Scripts** (`generate-env.js`, `add-supabase-config.js`, `setup-local-env.js`)
✅ **Test Files** (All privacy-safety tests now use environment variables)

## Data Migration

### Prerequisites

1. Ensure you have access to both the old and new Supabase projects
2. Get the service role keys for both projects
3. Ensure the new project has all migrations applied (run `./scripts/run-all-migrations-supabase.sh`)

### Migration Steps

1. **Set up environment variables:**

```bash
export OLD_SUPABASE_URL="https://pvzicicwxgftcielnm.supabase.co"
export OLD_SUPABASE_SERVICE_KEY="your_old_service_key"
export NEW_SUPABASE_URL="https://grfjmnjpzvknmsxrwesx.supabase.co"
export NEW_SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMjg5OSwiZXhwIjoyMDg1MDc4ODk5fQ.GIETcsbB9U_CRoeOhONwykUgMWzdWdU--QuyDr2BPaw"
```

2. **Run the migration script:**

```bash
node scripts/migrate-supabase-data.js
```

The script will:
- Connect to both Supabase projects
- Export all data from the old project
- Import data to the new project in the correct order (respecting foreign key dependencies)
- Handle duplicate entries gracefully
- Provide a summary of the migration

### Migration Order

The script migrates tables in the following order to respect foreign key dependencies:

1. Core reference data (positions, categories, etc.)
2. Users and authentication
3. Teams and rosters
4. Training system
5. Load monitoring
6. Wellness and health
7. Nutrition
8. Games and tournaments
9. Analytics
10. Notifications
11. Community
12. Knowledge base
13. Training analytics

### Manual Migration (Alternative)

If you prefer to migrate manually or the script encounters issues:

1. **Export from old project:**
   - Use Supabase Dashboard → SQL Editor
   - Or use `pg_dump` with connection string

2. **Import to new project:**
   - Use Supabase Dashboard → SQL Editor
   - Or use `psql` with connection string

3. **Verify data:**
   - Check row counts match
   - Test key functionality
   - Verify relationships

## Post-Migration Checklist

After migration, verify:

- [ ] All tables migrated successfully
- [ ] Row counts match between old and new projects
- [ ] User authentication works
- [ ] Team rosters are intact
- [ ] Training data is accessible
- [ ] Analytics are functioning
- [ ] Notifications are working
- [ ] Storage buckets (if any) are migrated

## Troubleshooting

### Migration Script Errors

If the script fails:

1. **Permission Errors**: Ensure service keys have proper permissions
2. **RLS Issues**: The script uses service keys to bypass RLS, but verify both projects allow service key access
3. **Foreign Key Violations**: Check migration order - the script handles this automatically
4. **Duplicate Keys**: The script handles duplicates by using `upsert` operations

### Connection Issues

- Verify both URLs are correct
- Check service keys are valid
- Ensure network connectivity to Supabase

### Data Verification

Run these queries on both projects to verify:

```sql
-- Count users
SELECT COUNT(*) FROM users;

-- Count teams
SELECT COUNT(*) FROM teams;

-- Count training sessions
SELECT COUNT(*) FROM training_sessions;

-- Count games
SELECT COUNT(*) FROM games;
```

## Rollback Plan

If migration fails and you need to rollback:

1. The old project remains unchanged (read-only export)
2. You can re-run migrations on the new project
3. Consider taking a backup of the new project before migration

## Support

For issues or questions:
- Check Supabase Dashboard logs
- Review migration script output
- Verify environment variables are set correctly
