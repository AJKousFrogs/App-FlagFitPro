# Step-by-Step Migration Guide

This guide walks you through migrating to the new Supabase project.

## ✅ Step 1: Update Local Environment

Update your `.env` file with the new Supabase credentials:

```bash
npm run update:env
```

Or manually edit `.env`:

```env
SUPABASE_URL=https://grfjmnjpzvknmsxrwesx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDI4OTksImV4cCI6MjA4NTA3ODg5OX0.63Do5rUEHBT7-pZEXzFFHB5LqFRaXWAt-YrH2v45vo0
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMjg5OSwiZXhwIjoyMDg1MDc4ODk5fQ.GIETcsbB9U_CRoeOhONwykUgMWzdWdU--QuyDr2BPaw
```

## ✅ Step 2: Verify Connection

Test that you can connect to the new Supabase project:

```bash
npm run verify:supabase
```

Expected output:
- ✅ Connection successful
- ⚠️ Tables don't exist yet (this is expected)

## ✅ Step 3: Run Database Migrations

The new Supabase project needs all database migrations applied. Choose one method:

### Method A: Using Migration Script (Recommended)

```bash
./scripts/run-all-migrations-supabase.sh
```

This will:
- Connect to the new Supabase project
- Run all migration files in order
- Save results to `database/migration_results/`

### Method B: Using Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/grfjmnjpzvknmsxrwesx
2. Click **SQL Editor** → **New query**
3. Copy and paste each migration file from `database/migrations/` in order
4. Run each migration

Migration files are in: `database/migrations/`

### Method C: Using Supabase CLI

```bash
# Link to project
supabase link --project-ref grfjmnjpzvknmsxrwesx

# Push migrations
supabase db push
```

## ✅ Step 4: Verify Migrations

After running migrations, verify again:

```bash
npm run verify:supabase
```

You should now see:
- ✅ Connection successful
- ✅ Core tables exist (6/6)

## ✅ Step 5: Migrate Data (If Needed)

If you have data in the old project that needs to be migrated:

### Prerequisites

1. Get the old project's service key:
   - Old project URL: `https://pvzicicwxgftcielnm.supabase.co`
   - Get service key from: https://supabase.com/dashboard/project/pvzicicwxgftcielnm/settings/api

2. Set environment variables:

```bash
export OLD_SUPABASE_URL="https://pvzicicwxgftcielnm.supabase.co"
export OLD_SUPABASE_SERVICE_KEY="your_old_service_key_here"
```

### Run Migration

```bash
npm run migrate:data
```

Or directly:

```bash
node scripts/migrate-supabase-data.js
```

The script will:
- Export all data from old project
- Import to new project in correct order
- Handle duplicates gracefully
- Provide detailed statistics

## ✅ Step 6: Update Netlify Environment Variables

Update environment variables in Netlify Dashboard:

1. Go to: https://app.netlify.com/sites/your-site/settings/deploys#environment-variables
2. Update these variables:
   - `SUPABASE_URL` → `https://grfjmnjpzvknmsxrwesx.supabase.co`
   - `SUPABASE_ANON_KEY` → (new anon key)
   - `SUPABASE_SERVICE_KEY` → (new service key)

## ✅ Step 7: Test Application

1. **Local Testing:**
   ```bash
   npm run dev
   ```
   - Verify authentication works
   - Check data loads correctly
   - Test key features

2. **Production Testing:**
   - Deploy to Netlify
   - Test in production environment
   - Verify all features work

## Troubleshooting

### Connection Issues

```bash
# Test connection manually
node scripts/verify-new-supabase.js
```

### Migration Errors

- Check migration logs in `database/migration_results/`
- Verify service key has proper permissions
- Check Supabase dashboard for error details

### Data Migration Issues

- Verify old project credentials are correct
- Check that new project has all migrations applied
- Review migration script output for specific errors

### Missing Tables

If tables are missing after migration:

1. Check migration logs
2. Re-run failed migrations manually
3. Verify RLS policies are applied

## Verification Checklist

After migration, verify:

- [ ] `.env` file updated with new credentials
- [ ] Connection to new project works
- [ ] All migrations applied successfully
- [ ] Core tables exist (users, teams, players, etc.)
- [ ] Data migrated (if applicable)
- [ ] Netlify environment variables updated
- [ ] Local app works with new project
- [ ] Production app works with new project

## Rollback Plan

If something goes wrong:

1. **Old project is unchanged** - migration only reads from it
2. **New project can be reset** - delete and recreate if needed
3. **Keep old project active** until migration is verified

## Support

For issues:
- Check migration logs
- Review Supabase dashboard logs
- Verify environment variables
- Check network connectivity
