# Frontend Table Mismatch Audit Report

**Date**: January 11, 2026  
**Issue**: Multiple tables exist for the same data type, causing inconsistency  
**Severity**: 🟡 **MEDIUM** - Data fragmentation across duplicate tables

---

## 🔴 Critical Findings: Duplicate Tables

The frontend is calling **different tables for the same type of data**, causing potential data inconsistency and fragmentation.

### Problem Summary

| Data Type | Tables in DB | Tables Used in Code | Files Affected | Issue |
|-----------|--------------|---------------------|----------------|-------|
| **Wellness Data** | 4 tables | 4 different refs | 16 files | 🔴 CRITICAL |
| **Body Measurements** | 2 tables | 2 different refs | 2 files | 🟡 MEDIUM |
| **Training Logs** | 2 tables | 2 different refs | 24 files | 🟡 MEDIUM |
| **Supplement Logs** | 2 tables | 1 used (correct) | 2 files | ✅ OK |

---

## 🔍 Detailed Analysis

### 1. 🔴 WELLNESS DATA - 4 Different Tables!

**Tables in Database:**
- `wellness_entries` (14 columns: athlete_id, date, sleep_quality, energy_level, etc.)
- `wellness_logs` (12 columns: athlete_id, log_date, fatigue, sleep_quality, etc.)
- `wellness_checkins` (14 columns: user_id, athlete_id, checkin_date, etc.)
- `daily_wellness_checkin` (21 columns: most comprehensive)

**Code References (16 files):**

| Table | Used By | Count |
|-------|---------|-------|
| `wellness_entries` | wellness.service.ts, recovery.service.ts, daily-readiness.component.ts, etc. | 8 files |
| `wellness_logs` | admin.service.ts, ai-training-scheduler.component.ts, performance-data.service.ts | 3 files |
| `wellness_checkins` | settings.component.ts, direct-supabase-api.service.ts, profile.component.ts, unified-training.service.ts | 4 files |
| `daily_wellness_checkin` | onboarding.component.ts | 1 file |

**Column Comparison:**

```
wellness_entries:
- athlete_id, date, sleep_quality, energy_level, stress_level
- muscle_soreness, motivation_level, mood, hydration_level

wellness_logs:
- athlete_id, log_date, fatigue, sleep_quality, soreness
- sleep_hours, energy, stress, mood

wellness_checkins:
- user_id, athlete_id, checkin_date, sleep_quality, energy_level
- mood, stress_level, soreness_level, hydration_level, motivation_level

daily_wellness_checkin:
- user_id, checkin_date, sleep_quality, sleep_hours
- muscle_soreness, energy_level, motivation, stress_level
- resting_hr, hrv_score, calculated_readiness, etc.
```

**Impact:**
- 🔴 **Data fragmentation**: Wellness data scattered across 4 tables
- 🔴 **Inconsistent queries**: Different services query different tables
- 🔴 **Missing data**: Data saved to one table won't appear in queries to another
- 🔴 **Analytics broken**: Cannot aggregate wellness trends properly

---

### 2. 🟡 BODY MEASUREMENTS - 2 Different Tables

**Tables in Database:**
- `physical_measurements` (22 columns: weight, height, body_fat, muscle_mass, etc.) - **JUST FIXED**
- `body_measurements` (13 columns: weight_kg, height_cm, body_fat_percentage, etc.) - **OLD**

**Code References:**

```typescript
// profile-completion.service.ts line 360:
.from("body_measurements")
.select("weight_kg")

// profile-completion.service.ts line 393:
.from("physical_measurements")
.upsert({
  user_id: user.id,
  measurement_date: today,
  weight_kg: weightKg,
})

// performance-data.service.ts (3 locations):
.from("physical_measurements")
.insert({ weight, height, body_fat, muscle_mass, ... })
```

**Column Name Mismatches:**

| Concept | body_measurements | physical_measurements |
|---------|-------------------|----------------------|
| Weight | `weight_kg` | `weight` |
| Height | `height_cm` | `height` |
| Body Fat | `body_fat_percentage` | `body_fat` |
| Muscle Mass | `muscle_mass_kg` | `muscle_mass` |

**Impact:**
- 🟡 **Two sources of truth**: Weight can be in either table
- 🟡 **Column name confusion**: Different field names for same data
- 🟡 **Incomplete data**: `physical_measurements` has 22 fields, `body_measurements` has 13

---

### 3. 🟡 TRAINING SESSIONS vs WORKOUT LOGS

**Tables in Database:**
- `training_sessions` (coach-planned sessions with schedules)
- `workout_logs` (actual completed workouts for ACWR)

**Code References:**
- `training_sessions`: 37 references across 17 files
- `workout_logs`: 7 references across 5 files

**Purpose Difference:**
```
training_sessions:
- Purpose: Planned training sessions by coaches
- Has: session_date, start_time, end_time, training_type, team_id
- Used for: Training schedules, planning, templates

workout_logs:
- Purpose: Actual completed workouts for load tracking
- Has: player_id, completed_at, rpe, duration_minutes
- Used for: ACWR calculations, load monitoring
```

**Impact:**
- ✅ **ACCEPTABLE**: These serve different purposes
- ⚠️ **BUT**: Some code may be confused about which to use
- 🔵 **INFO**: `workout_logs` should link to `training_sessions` via `session_id`

---

### 4. ✅ SUPPLEMENT LOGS - Correctly Handled

**Tables in Database:**
- `supplement_logs` (9 columns) - **USED**
- `supplements_logs` (appears to be empty/unused)

**Code References:**
- Only uses `supplement_logs` (correct!)
- No code references `supplements_logs`

**Status:** ✅ **OK** - No issues

---

## 🎯 Recommendations

### Priority 1: 🔴 CRITICAL - Fix Wellness Data Fragmentation

**Option A: Consolidate to `wellness_entries` (Recommended)**

1. Migrate all data from `wellness_logs`, `wellness_checkins`, `daily_wellness_checkin` → `wellness_entries`
2. Update all 16 code files to use only `wellness_entries`
3. Drop duplicate tables after migration

**Option B: Map all code to `daily_wellness_checkin`**

1. This table has the most complete schema (21 columns)
2. Update all services to use this table
3. Migrate data from other tables

**Implementation:**
```typescript
// Update ALL references from:
.from("wellness_logs")
.from("wellness_checkins")  
.from("daily_wellness_checkin")

// To:
.from("wellness_entries")
```

**Files to Update:**
1. ✅ `wellness.service.ts` (already uses `wellness_entries`)
2. ✅ `recovery.service.ts` (already uses `wellness_entries`)
3. ✅ `daily-readiness.component.ts` (already uses `wellness_entries`)
4. ✅ `missing-data-detection.service.ts` (already uses `wellness_entries`)
5. ✅ `data-export.service.ts` (already uses `wellness_entries`)
6. ✅ `training-safety.component.ts` (already uses `wellness_entries`)
7. ❌ `admin.service.ts` - Change `wellness_logs` → `wellness_entries`
8. ❌ `ai-training-scheduler.component.ts` - Change `wellness_logs` → `wellness_entries`
9. ❌ `performance-data.service.ts` - Change `wellness_logs` → `wellness_entries`
10. ❌ `settings.component.ts` - Change `wellness_checkins` → `wellness_entries`
11. ❌ `direct-supabase-api.service.ts` - Change `wellness_checkins` → `wellness_entries`
12. ❌ `profile.component.ts` - Change `wellness_checkins` → `wellness_entries`
13. ❌ `unified-training.service.ts` - Change `wellness_checkins` → `wellness_entries`
14. ❌ `onboarding.component.ts` - Change `daily_wellness_checkin` → `wellness_entries`

---

### Priority 2: 🟡 MEDIUM - Fix Body Measurements Duplication

**Consolidate to `physical_measurements`**

This table was just fixed and has the correct schema (22 columns).

1. Migrate data from `body_measurements` → `physical_measurements`
2. Update `profile-completion.service.ts` line 360 to use `physical_measurements`
3. Handle column name mapping:

```typescript
// OLD (profile-completion.service.ts:360):
.from("body_measurements")
.select("weight_kg")

// NEW:
.from("physical_measurements")
.select("weight")  // Note: column renamed
```

**Files to Update:**
1. ❌ `profile-completion.service.ts` line 360 - Change table and column names
2. ✅ `profile-completion.service.ts` line 393 - Already correct (but needs column name fix)
3. ✅ `performance-data.service.ts` - Already uses `physical_measurements`

---

### Priority 3: 🔵 INFO - Document Training Tables

**No code changes needed**, but document the distinction:

```typescript
/**
 * Table Usage:
 * - training_sessions: Coach-planned sessions (schedules, templates)
 * - workout_logs: Actual completed workouts (for ACWR calculations)
 * 
 * Relationship: workout_logs.session_id → training_sessions.id
 */
```

---

### Priority 4: 🗑️ Drop Unused Tables

After consolidation, drop these tables:
- `wellness_logs` (after migrating to `wellness_entries`)
- `wellness_checkins` (after migrating to `wellness_entries`)
- `daily_wellness_checkin` (after migrating to `wellness_entries`)
- `body_measurements` (after migrating to `physical_measurements`)
- `supplements_logs` (unused duplicate)

---

## 📊 Impact Analysis

### Current State

| Issue | Affected Users | Data Loss Risk | Performance Impact |
|-------|---------------|----------------|-------------------|
| Wellness fragmentation | All users | HIGH | Medium |
| Body measurements duplication | All users | MEDIUM | Low |
| Training table confusion | Coaches/Athletes | LOW | Low |

### After Fix

- ✅ Single source of truth for each data type
- ✅ Consistent queries across all services
- ✅ Complete data in analytics
- ✅ Reduced database complexity
- ✅ Faster queries (fewer tables)

---

## 🧪 Testing Plan

### After Wellness Consolidation

1. **Data Migration Verification:**
   ```sql
   -- Check all wellness data migrated
   SELECT COUNT(*) FROM wellness_entries;
   SELECT COUNT(*) FROM wellness_logs; -- Should be 0 or dropped
   ```

2. **Code Testing:**
   - Log wellness check-in via wellness page
   - View wellness history in profile
   - Check admin analytics show all wellness data
   - Verify AI training scheduler uses wellness data

3. **Cross-Service Testing:**
   - Recovery service uses wellness data correctly
   - Readiness calculations include all wellness entries
   - Data export includes all wellness records

### After Body Measurements Fix

1. **Data Migration:**
   ```sql
   -- Check measurements migrated
   SELECT COUNT(*) FROM physical_measurements;
   SELECT user_id, weight FROM physical_measurements ORDER BY created_at DESC LIMIT 10;
   ```

2. **Code Testing:**
   - Log weight via wellness check-in
   - View body composition card
   - Check profile shows correct weight
   - Verify trends display properly

---

## 📁 Migration SQL Scripts

### Wellness Data Consolidation

```sql
-- Step 1: Migrate wellness_logs → wellness_entries
INSERT INTO wellness_entries (
  id, athlete_id, date, sleep_quality, energy_level, 
  stress_level, muscle_soreness, mood, notes, created_at, user_id
)
SELECT 
  gen_random_uuid(), 
  athlete_id, 
  log_date as date,
  sleep_quality,
  energy as energy_level,
  stress as stress_level,
  soreness as muscle_soreness,
  mood,
  NULL as notes,
  created_at,
  user_id
FROM wellness_logs
WHERE athlete_id NOT IN (
  SELECT athlete_id FROM wellness_entries WHERE date = wellness_logs.log_date
);

-- Step 2: Migrate wellness_checkins → wellness_entries
INSERT INTO wellness_entries (
  id, athlete_id, date, sleep_quality, energy_level, 
  stress_level, muscle_soreness, motivation_level, mood, 
  hydration_level, notes, created_at, updated_at, user_id
)
SELECT 
  gen_random_uuid(),
  COALESCE(athlete_id, user_id) as athlete_id,
  checkin_date as date,
  sleep_quality,
  energy_level,
  stress_level,
  soreness_level as muscle_soreness,
  motivation_level,
  mood,
  hydration_level,
  notes,
  created_at,
  updated_at,
  user_id
FROM wellness_checkins
WHERE COALESCE(athlete_id, user_id) NOT IN (
  SELECT athlete_id FROM wellness_entries WHERE date = wellness_checkins.checkin_date
);

-- Step 3: Migrate daily_wellness_checkin → wellness_entries
INSERT INTO wellness_entries (
  id, athlete_id, date, sleep_quality, energy_level, 
  stress_level, muscle_soreness, motivation_level, mood, 
  hydration_level, notes, created_at, user_id
)
SELECT 
  gen_random_uuid(),
  user_id as athlete_id,
  checkin_date as date,
  sleep_quality,
  energy_level,
  stress_level,
  muscle_soreness,
  motivation,
  NULL as mood,
  NULL as hydration_level,
  notes,
  created_at,
  user_id
FROM daily_wellness_checkin
WHERE user_id NOT IN (
  SELECT athlete_id FROM wellness_entries WHERE date = daily_wellness_checkin.checkin_date
);

-- Step 4: Verify migration
SELECT 
  'wellness_entries' as table_name, COUNT(*) as count 
FROM wellness_entries
UNION ALL
SELECT 'wellness_logs', COUNT(*) FROM wellness_logs
UNION ALL
SELECT 'wellness_checkins', COUNT(*) FROM wellness_checkins
UNION ALL  
SELECT 'daily_wellness_checkin', COUNT(*) FROM daily_wellness_checkin;

-- Step 5: Drop old tables (ONLY after verification)
-- DROP TABLE wellness_logs CASCADE;
-- DROP TABLE wellness_checkins CASCADE;
-- DROP TABLE daily_wellness_checkin CASCADE;
```

### Body Measurements Consolidation

```sql
-- Migrate body_measurements → physical_measurements
-- Note: Column names are different!
INSERT INTO physical_measurements (
  id, user_id, weight, height, body_fat, muscle_mass, notes, created_at
)
SELECT 
  gen_random_uuid(),
  user_id,
  weight_kg as weight,
  height_cm as height,
  body_fat_percentage as body_fat,
  muscle_mass_kg as muscle_mass,
  notes,
  created_at
FROM body_measurements
WHERE user_id NOT IN (
  SELECT user_id FROM physical_measurements 
  WHERE DATE(created_at) = DATE(body_measurements.created_at)
);

-- Verify
SELECT COUNT(*) as total_measurements FROM physical_measurements;

-- Drop old table (after verification)
-- DROP TABLE body_measurements CASCADE;
```

---

## ✅ Summary

**Issues Found:** 4 areas of table duplication/mismatch  
**Critical Issues:** 1 (wellness data fragmentation)  
**Medium Issues:** 2 (body measurements, training logs)  
**Files to Update:** 14 files  
**Tables to Consolidate:** 4 tables → 2 canonical tables  

**Next Steps:**
1. 🔴 Run wellness data migration SQL
2. 🔴 Update 14 code files to use `wellness_entries`
3. 🟡 Run body measurements migration SQL
4. 🟡 Update 1 code file for body measurements
5. ✅ Test all user flows
6. 🗑️ Drop duplicate tables

**Timeline:** ~2-3 hours for complete fix and testing

---

**Report Generated:** January 11, 2026  
**Status:** 🟡 **ACTION REQUIRED** - Multiple table mismatches found
