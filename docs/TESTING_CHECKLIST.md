# Database Migration Testing Checklist

## 📋 Complete Testing & Deployment Checklist

This checklist ensures safe, thorough testing of all database migrations (069, 070, 071, 072).

---

## ✅ PRE-MIGRATION CHECKLIST

### 1. Environment Preparation

- [ ] **Staging database** exists and is accessible
- [ ] **Production database backup** is current (< 24 hours old)
- [ ] **Local development environment** is set up
- [ ] **Supabase CLI** installed (`npm i -g supabase` or via Homebrew)
- [ ] **PostgreSQL client** installed (`psql` command available)
- [ ] **Git branch** created for migration testing

### 2. Documentation Review

- [ ] Read `DATABASE_REFACTOR_README.md` (overview)
- [ ] Read `DB_REFACTOR_QUICK_CARD.md` (quick reference)
- [ ] Review migration 069 (prerequisites)
- [ ] Review migration 070 (core refactor)
- [ ] Review migration 071 (exercise registry)
- [ ] Review migration 072 (metric backfill)

### 3. Backup Strategy

- [ ] **Full database backup** taken
- [ ] **Backup file** tested (can restore from it)
- [ ] **Backup location** documented and secure
- [ ] **Rollback plan** documented
- [ ] **Backup retention policy** confirmed (keep for 30+ days)

**Commands:**

```bash
# Backup via Supabase CLI
cd /Users/aljosakous/Documents/GitHub/app-new-flag
supabase db dump -f backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Or via Supabase Dashboard
# Settings → Database → Backups → Create Backup
```

---

## 🧪 MIGRATION 069: PREREQUISITES TEST

### Purpose

Ensures base tables (player_programs, position_specific_metrics, exercise_logs) and ACWR functions exist before refactor.

### Execution

```bash
# Connect to STAGING database
psql -h your-staging-host -U postgres -d your_staging_db

# Or via Supabase
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Run migration 069
\i database/migrations/069_prerequisites_check_and_setup.sql
```

### Verification Tests

#### Test 1: Check Tables Created

```sql
-- Should return 3 rows
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('player_programs', 'position_specific_metrics', 'exercise_logs')
AND table_schema = 'public';
```

**Expected:** 3 rows returned  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 2: Check ACWR Functions Exist

```sql
-- Should return 5 rows
SELECT proname
FROM pg_proc
WHERE proname IN (
    'calculate_daily_load',
    'calculate_acute_load',
    'calculate_chronic_load',
    'calculate_acwr_safe',
    'get_injury_risk_level'
);
```

**Expected:** 5 rows  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 3: Check ACWR Trigger Exists

```sql
-- Should return 1 row
SELECT tgname
FROM pg_trigger
WHERE tgname = 'trigger_update_load_monitoring';
```

**Expected:** 1 row  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 4: Check Indexes Created

```sql
-- Should return at least 9 indexes
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('player_programs', 'position_specific_metrics', 'exercise_logs');
```

**Expected:** 9+ rows  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 5: Check RLS Enabled

```sql
-- Should return 3 rows (all TRUE)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('player_programs', 'position_specific_metrics', 'exercise_logs')
AND schemaname = 'public';
```

**Expected:** 3 rows, rowsecurity = TRUE  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 6: Test ACWR Function (Functional Test)

```sql
-- Create test player and workout
DO $$
DECLARE
    test_player_id UUID := gen_random_uuid();
BEGIN
    -- Insert test workout
    INSERT INTO workout_logs (player_id, completed_at, rpe, duration_minutes)
    VALUES (test_player_id, NOW(), 7.5, 60);

    -- Check if load_monitoring was created (trigger should fire)
    IF EXISTS (
        SELECT 1 FROM load_monitoring WHERE player_id = test_player_id
    ) THEN
        RAISE NOTICE '✅ ACWR trigger is working!';
    ELSE
        RAISE WARNING '❌ ACWR trigger did NOT fire!';
    END IF;

    -- Cleanup
    DELETE FROM workout_logs WHERE player_id = test_player_id;
    DELETE FROM load_monitoring WHERE player_id = test_player_id;
END $$;
```

**Expected:** "✅ ACWR trigger is working!"  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

### Migration 069 Summary

- [ ] All tables created
- [ ] All functions deployed
- [ ] Trigger active and working
- [ ] Indexes in place
- [ ] RLS enabled
- [ ] **Overall:** [ ] PASS / [ ] FAIL

---

## 🧪 MIGRATION 070: CORE REFACTOR TEST

### Purpose

Creates ENUMs, exercise_registry, metric_definitions, metric_entries, views, and enhances existing tables.

### Execution

```bash
\i database/migrations/070_comprehensive_database_refactor.sql
```

### Verification Tests

#### Test 1: Check ENUMs Created

```sql
-- Should return 6 rows
SELECT typname
FROM pg_type
WHERE typname IN (
    'difficulty_level_enum',
    'session_type_enum',
    'risk_level_enum',
    'exercise_category_enum',
    'video_source_enum',
    'program_status_enum'
);
```

**Expected:** 6 rows  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 2: Check New Tables Created

```sql
-- Should return 3 rows
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('exercise_registry', 'metric_definitions', 'metric_entries')
AND table_schema = 'public';
```

**Expected:** 3 rows  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 3: Check Views Created

```sql
-- Should return 2 rows
SELECT table_name
FROM information_schema.views
WHERE table_name IN ('v_player_program_compliance', 'v_load_monitoring')
AND table_schema = 'public';
```

**Expected:** 2 rows  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 4: Check Columns Added to Existing Tables

```sql
-- workout_logs should have new columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'workout_logs'
AND column_name IN ('program_session_id', 'workout_type', 'was_modified', 'modification_notes');

-- exercise_logs should have new columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'exercise_logs'
AND column_name IN ('prescribed_session_exercise_id', 'actual_exercise_id', 'is_substitution', 'substitution_reason');

-- player_programs should have new columns (and compliance_rate removed)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'player_programs'
AND column_name IN ('assigned_position_id', 'status', 'paused_reason', 'paused_at', 'assigned_timezone');

-- training_videos should have new columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'training_videos'
AND column_name IN ('source_type', 'owner_user_id', 'license', 'is_public', 'status');

-- load_monitoring should have new columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'load_monitoring'
AND column_name IN ('calculation_version', 'calculation_timestamp', 'data_sources');
```

**Expected:** All new columns exist  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 5: Check Unique Constraints Added

```sql
-- Should return at least 4 rows
SELECT constraint_name
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
AND constraint_name IN (
    'positions_name_unique',
    'training_weeks_phase_week_unique',
    'training_phases_program_order_unique',
    'session_exercises_order_unique'
);
```

**Expected:** 4+ rows  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 6: Run Bootstrap Verification

```sql
SELECT * FROM verify_database_bootstrap();
```

**Expected:** All checks return 'PASS' or acceptable 'WARN'  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 7: Check Performance Indexes

```sql
-- Should return 20+ new indexes
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
AND indexname NOT IN (
    SELECT indexname FROM pg_indexes_before_migration_070
);
```

**Expected:** 20+ new indexes  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 8: Test Metric Definitions Seeded

```sql
-- Should return 10+ metric definitions
SELECT code, display_name FROM metric_definitions;
```

**Expected:** 10+ rows (QB, WR, DB, general metrics)  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 9: Test View Queries

```sql
-- Test compliance view
SELECT * FROM v_player_program_compliance LIMIT 5;

-- Test load monitoring view
SELECT * FROM v_load_monitoring LIMIT 5;
```

**Expected:** Views return data without errors  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

### Migration 070 Summary

- [ ] All ENUMs created
- [ ] All tables created
- [ ] All views created
- [ ] All columns added
- [ ] All constraints added
- [ ] verify_database_bootstrap() passes
- [ ] Performance indexes added
- [ ] Metric definitions seeded
- [ ] **Overall:** [ ] PASS / [ ] FAIL

---

## 🧪 MIGRATION 071: EXERCISE REGISTRY POPULATION TEST

### Purpose

Populates exercise_registry from existing plyometrics_exercises, isometrics_exercises, and exercises tables.

### Execution

```bash
\i database/migrations/071_populate_exercise_registry.sql
```

### Verification Tests

#### Test 1: Check Total Exercises Migrated

```sql
-- Should return 100+ exercises
SELECT exercise_type, COUNT(*)
FROM exercise_registry
GROUP BY exercise_type;
```

**Expected:** 70+ plyometric, 3+ isometric, remaining general  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 2: Verify All Exercises Have Details

```sql
-- Should return 0 rows (all exercises should link to details)
SELECT id, name, exercise_type
FROM exercise_registry
WHERE plyometric_details_id IS NULL
  AND isometric_details_id IS NULL
  AND general_exercise_id IS NULL;
```

**Expected:** 0 rows  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 3: Test Exercise Details Joins

```sql
-- Should return exercises with joined details
SELECT
    er.name,
    er.exercise_type,
    pe.coaching_cues,
    ie.injury_prevention_benefits
FROM exercise_registry er
LEFT JOIN plyometrics_exercises pe ON er.plyometric_details_id = pe.id
LEFT JOIN isometrics_exercises ie ON er.isometric_details_id = ie.id
LIMIT 10;
```

**Expected:** 10 rows with appropriate details  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 4: Check Exercise Counts Match

```sql
-- Compare counts
SELECT
    'plyometrics_exercises' AS source,
    COUNT(*) AS count
FROM plyometrics_exercises
UNION ALL
SELECT
    'exercise_registry (plyometric)',
    COUNT(*)
FROM exercise_registry
WHERE exercise_type = 'plyometric';
```

**Expected:** Counts should match  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

### Migration 071 Summary

- [ ] All exercises migrated
- [ ] No orphaned exercises
- [ ] Joins work correctly
- [ ] Counts match source tables
- [ ] **Overall:** [ ] PASS / [ ] FAIL

---

## 🧪 MIGRATION 072: METRIC BACKFILL TEST

### Purpose

Migrates position_specific_metrics to new metric_definitions/metric_entries system.

### Execution

```bash
\i database/migrations/072_backfill_metric_entries.sql
```

### Verification Tests

#### Test 1: Check Metric Definitions Created

```sql
-- Should show metric definitions created from existing data
SELECT code, display_name, value_type
FROM metric_definitions
WHERE description ILIKE '%Migrated from position_specific_metrics%';
```

**Expected:** Definitions exist for all unique metric_name values  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 2: Check Metric Entries Migrated

```sql
-- Compare counts
SELECT
    'position_specific_metrics' AS source,
    COUNT(*) AS count
FROM position_specific_metrics
UNION ALL
SELECT
    'metric_entries',
    COUNT(*)
FROM metric_entries;
```

**Expected:** Counts should match or metric_entries >= position_specific_metrics  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 3: Test Legacy Compatibility View

```sql
-- Should work like old table
SELECT * FROM v_position_specific_metrics_legacy LIMIT 10;
```

**Expected:** 10 rows returned in old format  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

#### Test 4: Test Metric Aggregation

```sql
-- Test aggregation logic
SELECT
    md.display_name,
    md.aggregation_method,
    CASE md.aggregation_method
        WHEN 'sum' THEN SUM(me.value)
        WHEN 'avg' THEN AVG(me.value)
        WHEN 'max' THEN MAX(me.value)
    END AS aggregated_value
FROM metric_entries me
JOIN metric_definitions md ON me.metric_definition_id = md.id
GROUP BY md.id, md.display_name, md.aggregation_method
LIMIT 10;
```

**Expected:** Aggregations work without errors  
**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

### Migration 072 Summary

- [ ] Metric definitions created
- [ ] All metrics migrated
- [ ] Legacy view works
- [ ] Aggregations work
- [ ] **Overall:** [ ] PASS / [ ] FAIL

---

## 🔍 INTEGRATION TESTS

### Test 1: Full Exercise Workflow

```sql
-- 1. Get exercise from registry
WITH selected_exercise AS (
    SELECT id FROM exercise_registry WHERE name LIKE 'Nordic%' LIMIT 1
)
-- 2. Create workout log
INSERT INTO workout_logs (player_id, completed_at, rpe, duration_minutes)
SELECT
    (SELECT id FROM auth.users LIMIT 1),
    NOW(),
    8.0,
    60
RETURNING id;

-- 3. Log exercise (use workout_log_id from above)
-- INSERT INTO exercise_logs (workout_log_id, exercise_id, ...)

-- 4. Verify load_monitoring updated (ACWR trigger should fire)
-- SELECT * FROM load_monitoring WHERE player_id = ...
```

**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

### Test 2: Metric Tracking Workflow

```sql
-- 1. Get QB throwing volume metric definition
WITH qb_metric AS (
    SELECT id FROM metric_definitions WHERE code = 'qb_throwing_volume' LIMIT 1
)
-- 2. Insert metric entry
-- INSERT INTO metric_entries (player_id, metric_definition_id, value, date)

-- 3. Query weekly totals
-- SELECT ...
```

**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

### Test 3: Compliance Calculation

```sql
-- Test the compliance view with real data
SELECT
    pp.player_id,
    vpc.total_planned_sessions,
    vpc.completed_sessions,
    vpc.compliance_rate
FROM player_programs pp
JOIN v_player_program_compliance vpc ON pp.id = vpc.player_program_id
WHERE pp.is_active = TRUE
LIMIT 5;
```

**Result:** [ ] PASS / [ ] FAIL  
**Notes:** **\*\***\*\***\*\***\_\_\_\_**\*\***\*\***\*\***

---

## 🎯 PERFORMANCE TESTS

### Test 1: Exercise Library Query Performance

```sql
EXPLAIN ANALYZE
SELECT * FROM exercise_registry
WHERE difficulty_level = 'Intermediate'
AND is_active = TRUE
LIMIT 20;
```

**Expected:** < 50ms execution time  
**Actual:** **\_\_\_\_**ms  
**Result:** [ ] PASS / [ ] FAIL

### Test 2: Compliance View Performance

```sql
EXPLAIN ANALYZE
SELECT * FROM v_player_program_compliance
WHERE player_id = (SELECT id FROM auth.users LIMIT 1);
```

**Expected:** < 200ms execution time  
**Actual:** **\_\_\_\_**ms  
**Result:** [ ] PASS / [ ] FAIL

### Test 3: ACWR Calculation Performance

```sql
EXPLAIN ANALYZE
SELECT * FROM v_load_monitoring
WHERE player_id = (SELECT id FROM auth.users LIMIT 1)
ORDER BY date DESC
LIMIT 28;
```

**Expected:** < 100ms execution time  
**Actual:** **\_\_\_\_**ms  
**Result:** [ ] PASS / [ ] FAIL

---

## 🔐 SECURITY TESTS

### Test 1: RLS on New Tables

```sql
-- Test as non-authenticated user (should fail)
SET ROLE anon;
SELECT * FROM exercise_registry LIMIT 1;
SELECT * FROM metric_definitions LIMIT 1;
SELECT * FROM metric_entries LIMIT 1;
RESET ROLE;
```

**Expected:** Queries succeed (public read) or fail appropriately  
**Result:** [ ] PASS / [ ] FAIL

### Test 2: Player Can Only See Own Data

```sql
-- Test player can't see other player's metrics
-- (requires test users set up)
```

**Result:** [ ] PASS / [ ] FAIL

---

## ✅ FINAL CHECKS

### Overall Migration Status

- [ ] Migration 069: Prerequisites ✅
- [ ] Migration 070: Core Refactor ✅
- [ ] Migration 071: Exercise Registry ✅
- [ ] Migration 072: Metric Backfill ✅
- [ ] Integration Tests ✅
- [ ] Performance Tests ✅
- [ ] Security Tests ✅

### Database Health

- [ ] No errors in Supabase logs
- [ ] All verify_database_bootstrap() checks PASS
- [ ] No orphaned data
- [ ] All indexes in use
- [ ] Query performance meets expectations

### Application Readiness

- [ ] TypeScript types updated
- [ ] API queries updated
- [ ] Frontend components updated
- [ ] Tests pass
- [ ] No breaking changes unhandled

---

## 🚀 PRODUCTION DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All staging tests passed
- [ ] Backup created (< 1 hour old)
- [ ] Deployment window scheduled
- [ ] Team notified
- [ ] Rollback plan ready

### Deployment

- [ ] Maintenance mode enabled (if applicable)
- [ ] Run migration 069
- [ ] Verify 069 (check output)
- [ ] Run migration 070
- [ ] Verify 070 (bootstrap function)
- [ ] Run migration 071
- [ ] Verify 071 (exercise counts)
- [ ] Run migration 072
- [ ] Verify 072 (metric counts)
- [ ] Run integration tests
- [ ] Maintenance mode disabled

### Post-Deployment

- [ ] Monitor error logs (15 minutes)
- [ ] Test critical user flows
- [ ] Verify ACWR calculations
- [ ] Verify compliance rates
- [ ] Check performance metrics
- [ ] User feedback collected

---

## 📝 NOTES & ISSUES

**Date Tested:** **\*\***\_\_\_**\*\***  
**Tested By:** **\*\***\_\_\_**\*\***  
**Environment:** [ ] Local [ ] Staging [ ] Production

**Issues Found:**

1. ***
2. ***
3. ***

**Resolution:**

1. ***
2. ***
3. ***

---

## 🆘 ROLLBACK PROCEDURE

If critical issues occur:

```sql
-- 1. Restore from backup
-- Use Supabase dashboard or:
psql < backups/backup_YYYYMMDD_HHMMSS.sql

-- 2. Verify restoration
SELECT COUNT(*) FROM [critical_table];

-- 3. Check application still works

-- 4. Document what went wrong

-- 5. Fix issues before retrying
```

---

**Testing Complete:** [ ] YES / [ ] NO  
**Safe to Deploy to Production:** [ ] YES / [ ] NO  
**Sign-off:** **\*\*\*\***\_\_**\*\*\*\*** Date: \***\*\_\_\*\***
