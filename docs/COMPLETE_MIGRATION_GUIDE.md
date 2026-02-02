# Complete Migration Guide: grfjmnjpzvknmsxrwesx

## Current Status

- **Target Project**: `grfjmnjpzvknmsxrwesx`
- **Current State**: 0 tables, 0 functions (empty project)
- **Goal**: Migrate all schema and data from old project

## Step 1: Apply Schema Migrations

Your project currently has **0 tables**. You need to apply all migrations first.

### Option A: Supabase Dashboard (Recommended - Easiest)

1. **Open SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/grfjmnjpzvknmsxrwesx/sql
   - Click **"New query"**

2. **Apply Consolidated Migration**:
   - Open the file: `database/migration_results/all_migrations_consolidated.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **"Run"** (or press Cmd/Ctrl + Enter)
   - Wait for completion (may take a few minutes)

3. **Verify**:
   - Check that tables count increased from 0
   - You should see ~353 tables after migration

### Option B: Supabase CLI

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Link to your project
supabase link --project-ref grfjmnjpzvknmsxrwesx

# Push all migrations
supabase db push
```

### Option C: MCP execute_sql (For smaller batches)

If the consolidated file is too large, you can split it into batches and use MCP `execute_sql` tool.

## Step 2: Migrate Data from Old Project

After schema migrations are complete, migrate data:

### Prerequisites

1. **Get Old Project Service Key**:
   - Go to: https://supabase.com/dashboard/project/pvzicicwxgftcielnm/settings/api
   - Copy the **service_role** key (not anon key)

2. **Set Environment Variables**:

```bash
export OLD_SUPABASE_URL="https://pvzicicwxgftcielnm.supabase.co"
export OLD_SUPABASE_SERVICE_KEY="your_old_service_key_here"
export NEW_SUPABASE_URL="https://grfjmnjpzvknmsxrwesx.supabase.co"
export NEW_SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMjg5OSwiZXhwIjoyMDg1MDc4ODk5fQ.GIETcsbB9U_CRoeOhONwykUgMWzdWdU--QuyDr2BPaw"
```

### Run Data Migration

```bash
node scripts/migrate-supabase-data.js
```

This script will:

- ✅ Connect to both old and new projects
- ✅ Export all data from old project
- ✅ Import data to new project in correct order
- ✅ Handle foreign key dependencies
- ✅ Provide detailed progress and statistics

## Step 3: Verify Migration

After both schema and data migrations:

1. **Check Tables**:

   ```bash
   node scripts/list-supabase-tables.js
   ```

   Should show ~353 tables

2. **Check Data**:
   - Go to Supabase Dashboard → Table Editor
   - Verify key tables have data (users, teams, etc.)

3. **Test Application**:

   ```bash
   npm run dev
   ```

   - Test authentication
   - Verify data loads correctly
   - Test key features

## Troubleshooting

### Migration Fails

- **Check Error Messages**: Look for specific SQL errors
- **Verify Service Keys**: Ensure both old and new service keys are correct
- **Check Permissions**: Service keys should have full database access

### Data Migration Issues

- **Foreign Key Violations**: The script handles this automatically, but check logs
- **Duplicate Keys**: Script uses upsert, but verify if needed
- **Missing Tables**: Ensure schema migrations completed successfully

### Connection Issues

- Verify both project URLs are correct
- Check service keys are valid
- Ensure network connectivity to Supabase

## Files Created

- `database/migration_results/all_migrations_consolidated.sql` - All migrations in one file (1.4 MB)
- `database/migration_results/migrations_for_mcp.json` - Migration metadata
- `database/migration_results/apply_migrations_instructions.md` - Detailed instructions

## Quick Reference

**Apply Schema**:

```bash
# Via Dashboard (easiest)
# Go to: https://supabase.com/dashboard/project/grfjmnjpzvknmsxrwesx/sql
# Copy/paste: database/migration_results/all_migrations_consolidated.sql
```

**Migrate Data**:

```bash
export OLD_SUPABASE_SERVICE_KEY="your_key"
node scripts/migrate-supabase-data.js
```

## Support

If you encounter issues:

1. Check migration logs in `database/migration_results/`
2. Review Supabase Dashboard logs
3. Verify environment variables are set correctly
