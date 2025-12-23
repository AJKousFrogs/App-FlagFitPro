# Database Migration Status: Local vs Supabase

**Date:** December 23, 2024  
**Status:** ⚠️ **MIGRATION PENDING** - Tables Not Yet Applied

## Executive Summary

The migration has been **CREATED** locally but **NOT YET APPLIED** to the Supabase database. The services are migrated in code, but the database tables they depend on don't exist yet.

## 🔴 Critical Findings

### Tables Created in Migration (Local) but **NOT in Supabase**:

1. ❌ **wellness_entries** - Required by `wellness.service.ts`
2. ❌ **recovery_sessions** - Required by `recovery.service.ts`
3. ❌ **nutrition_logs** - Required by `nutrition.service.ts`
4. ❌ **nutrition_goals** - Required by `nutrition.service.ts`
5. ❌ **supplement_logs** - Required by `performance-data.service.ts`
6. ❌ **performance_tests** - Required by `performance-data.service.ts`

### Tables That DO Exist in Supabase:

✅ **training_sessions** - Used by `training-data.service.ts` (WORKING)
✅ **wellness_logs** - Similar to `wellness_entries` but different schema
✅ **users** - User management table
✅ **workout_logs** - Not in migration (used by older services)

## Schema Conflicts

### Wellness Data

**Migration Creates:**
```sql
wellness_entries (
  id UUID,
  athlete_id UUID,
  date DATE,
  sleep_quality INTEGER,    -- Our naming
  energy_level INTEGER,     -- Our naming
  stress_level INTEGER,     -- Our naming
  muscle_soreness INTEGER,  -- Our naming
  motivation_level INTEGER, -- Our naming
  mood INTEGER,
  hydration_level INTEGER   -- Our naming
)
```

**Supabase Has:**
```sql
wellness_logs (
  athlete_id UUID,
  log_date DATE,
  fatigue INTEGER,          -- Different name
  sleep_quality INTEGER,    -- ✅ Same
  soreness INTEGER,         -- Different name
  sleep_hours NUMERIC,      -- Additional field
  energy INTEGER,           -- Different name
  stress INTEGER,           -- Different name
  mood INTEGER              -- ✅ Same
)
```

## Required Actions

### Immediate (Before Testing)

1. **Apply Migration to Supabase:**
   ```bash
   # Option 1: Via Supabase CLI
   cd /Users/aljosakous/Documents/GitHub/app-new-flag
   supabase db push
   
   # Option 2: Via Supabase Dashboard
   # Copy contents of database/migrations/051_add_service_migration_tables.sql
   # Paste into SQL Editor in Supabase Dashboard
   # Execute
   ```

2. **Verify Tables Created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'wellness_entries',
     'recovery_sessions',
     'nutrition_logs',
     'nutrition_goals',
     'supplement_logs',
     'performance_tests'
   );
   ```

3. **Test Services:**
   ```bash
   cd angular
   npm run start
   # Test each migrated service in the UI
   ```

### Optional (Performance Optimization)

#### Option A: Use Existing Tables (Recommended if they match)

If `wellness_logs` is similar enough to `wellness_entries`, we could:
1. Adapt services to use `wellness_logs` instead
2. Avoid migration conflicts
3. Reuse existing data structure

**Benefits:**
- ✅ No migration needed
- ✅ Works with existing data
- ✅ Faster deployment

**Trade-offs:**
- ❌ Different column names
- ❌ Services need refactoring again

#### Option B: Apply Migration (Current Plan)

Create new tables as designed:
1. Run migration SQL
2. Keep services as-is
3. Both tables coexist

**Benefits:**
- ✅ Services work as written
- ✅ Better column naming
- ✅ Clean separation

**Trade-offs:**
- ❌ Duplicate wellness tracking
- ❌ Data not consolidated

#### Option C: Update Migration to Use Existing Schema

Modify services to use existing table names/columns:
1. Change `wellness.service.ts` to query `wellness_logs`
2. Map column names (e.g., `energy_level` → `energy`)
3. No new migration needed

## Recommended Next Steps

### For Quick Testing:

```bash
# 1. Apply the migration
cd /Users/aljosakous/Documents/GitHub/app-new-flag
supabase db push

# 2. Verify it worked
supabase db diff

# 3. Test locally
cd angular && npm run start
```

### For Production:

1. **Review existing `wellness_logs` schema**
2. **Decide: Reuse or Create New?**
   - If reusing: Update services to use `wellness_logs`
   - If creating new: Apply migration as-is
3. **Test thoroughly in staging**
4. **Deploy to production**

## Table Mapping Matrix

| Service | Requires Table | Exists in Supabase? | Migration Status |
|---------|---------------|---------------------|------------------|
| `wellness.service.ts` | `wellness_entries` | ❌ No | Needs migration |
| | `wellness_logs` (alternative) | ✅ Yes | Could adapt |
| `recovery.service.ts` | `recovery_sessions` | ❌ No | Needs migration |
| `nutrition.service.ts` | `nutrition_logs` | ❌ No | Needs migration |
| `nutrition.service.ts` | `nutrition_goals` | ❌ No | Needs migration |
| `performance-data.service.ts` | `supplement_logs` | ❌ No | Needs migration |
| `performance-data.service.ts` | `performance_tests` | ❌ No | Needs migration |
| `training-data.service.ts` | `training_sessions` | ✅ Yes | ✅ Working |
| `acwr.service.ts` | `workout_logs` | ❌ No* | Needs investigation |
| `load-monitoring.service.ts` | `workout_logs` | ❌ No* | Needs investigation |

*Not visible in table list but may exist in different schema

## Why This Happened

The migration workflow is:
1. ✅ Create migration SQL file locally
2. ⏳ **Apply to Supabase database** ← We are here
3. ⏳ Test services
4. ⏳ Deploy to production

We completed step 1 but haven't done step 2 yet.

## Code vs Database Status

```
Angular Services (Code)          Supabase Database
─────────────────────            ─────────────────
✅ wellness.service.ts           ❌ wellness_entries (missing)
   ↓ queries                     ✅ wellness_logs (exists, different schema)
   ❌ Will error at runtime       
   
✅ recovery.service.ts           ❌ recovery_sessions (missing)
   ↓ queries                     
   ❌ Will error at runtime
   
✅ nutrition.service.ts          ❌ nutrition_logs (missing)
   ↓ queries                     ❌ nutrition_goals (missing)
   ❌ Will error at runtime
   
✅ performance-data.service.ts   ❌ supplement_logs (missing)
   ↓ queries                     ❌ performance_tests (missing)
   ❌ Will error at runtime
   
✅ training-data.service.ts      ✅ training_sessions (exists)
   ↓ queries                     
   ✅ WORKING
```

## SQL to Run Now

Copy this into Supabase SQL Editor:

```sql
-- Run the entire contents of:
-- /Users/aljosakous/Documents/GitHub/app-new-flag/database/migrations/051_add_service_migration_tables.sql

-- Or use Supabase CLI:
-- cd /Users/aljosakous/Documents/GitHub/app-new-flag
-- supabase db push
```

## Testing Checklist After Migration

Once tables are created:

- [ ] Wellness service can log entries
- [ ] Wellness service can fetch data
- [ ] Recovery service can start sessions
- [ ] Recovery service can complete sessions
- [ ] Nutrition service can log food
- [ ] Nutrition service can fetch goals
- [ ] Performance service can log measurements
- [ ] Performance service can log supplements
- [ ] Performance service can log tests
- [ ] All RLS policies work (users see only their data)

---

**Action Required:** Apply migration SQL to Supabase database before testing services.

**Priority:** 🔴 **HIGH** - Services will throw errors until tables exist.

**Estimated Time:** 5 minutes to apply migration, 15 minutes to test.

