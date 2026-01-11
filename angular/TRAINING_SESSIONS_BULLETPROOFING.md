# Training Sessions Query Bulletproofing

**Date:** 2026-01-11  
**Status:** ✅ Complete  
**File Modified:** `angular/src/app/core/services/unified-training.service.ts`

---

## Summary

Fixed 4 methods in `UnifiedTrainingService` to properly query the `training_sessions` table with correct column names, date formatting, and comprehensive error logging.

---

## Changes Made

### 1. **loadTrainingSessions()** - 30-Day Query (Lines 784-812)

**Issues Fixed:**
- ❌ Used `.gte("date", ...)` → ✅ Changed to `session_date`
- ❌ Used full ISO timestamp → ✅ Changed to `YYYY-MM-DD` format
- ❌ No error handling → ✅ Added comprehensive error logging

**Before:**
```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const { data } = await this.supabase.client
  .from("training_sessions")
  .select("*")
  .eq("user_id", userId)
  .gte("date", thirtyDaysAgo.toISOString()) // ❌ Wrong column + timestamp
  .order("date", { ascending: false });

return (data as TrainingSessionRecord[]) || [];
```

**After:**
```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const start = thirtyDaysAgo.toISOString().split("T")[0]; // YYYY-MM-DD

const { data, error } = await this.supabase.client
  .from("training_sessions")
  .select("*")
  .eq("user_id", userId)
  .gte("session_date", start) // ✅ Correct column + date format
  .order("session_date", { ascending: false });

if (error) {
  this.logger.error(
    "[UnifiedTrainingService] Failed to load training sessions",
    toLogContext({
      userId,
      dateRange: { start },
      error: error.message,
      code: error.code,
    }),
  );
  return [];
}

return (data as TrainingSessionRecord[]) || [];
```

---

### 2. **loadAvailableWorkouts()** - Today's Sessions (Lines 989-1017)

**Issues Fixed:**
- ❌ Used `athlete_id` → ✅ Changed to `user_id`
- ❌ Ordered by non-existent `start_time` → ✅ Changed to `created_at`
- ❌ No error handling → ✅ Added error logging

**Before:**
```typescript
const { data } = await this.supabase.client
  .from("training_sessions")
  .select("*")
  .eq("athlete_id", userId) // ❌ Wrong column
  .eq("session_date", today)
  .eq("status", "scheduled")
  .order("start_time", { ascending: true, nullsFirst: false }); // ❌ Column doesn't exist
```

**After:**
```typescript
const { data, error } = await this.supabase.client
  .from("training_sessions")
  .select("*")
  .eq("user_id", userId) // ✅ Correct column
  .eq("session_date", today)
  .eq("status", "scheduled")
  .order("created_at", { ascending: true }); // ✅ Use existing column

if (error) {
  this.logger.error(
    "[UnifiedTrainingService] Failed to load available workouts",
    toLogContext({
      userId,
      today,
      error: error.message,
      code: error.code,
    }),
  );
  return this.getDefaultWorkouts();
}
```

---

### 3. **markWorkoutComplete()** - Insert Workout (Lines 1339-1390)

**Issues Fixed:**
- ❌ Used `date` column → ✅ Changed to `session_date`
- ❌ Used full ISO timestamp → ✅ Changed to `YYYY-MM-DD` format
- ❌ Used `duration` → ✅ Changed to `duration_minutes`
- ❌ Used `intensity` → ✅ Changed to `intensity_level`
- ❌ Used `completed` flag → ✅ Changed to `status: "completed"`
- ❌ Silent error suppression → ✅ Added error logging

**Before:**
```typescript
const { error } = await this.supabase.client
  .from("training_sessions")
  .insert({
    user_id: userId,
    date: new Date().toISOString(), // ❌ Wrong column + timestamp
    session_type: workout.type,
    duration: parseInt(workout.duration) || 60, // ❌ Wrong column
    intensity: ..., // ❌ Wrong column
    completed: true, // ❌ Wrong column
    notes: `Completed: ${workout.title}`,
  });

if (error) return false; // ❌ Silent failure
```

**After:**
```typescript
const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
const { error } = await this.supabase.client
  .from("training_sessions")
  .insert({
    user_id: userId,
    session_date: today, // ✅ Correct column + format
    session_type: workout.type,
    duration_minutes: parseInt(workout.duration) || 60, // ✅ Correct column
    intensity_level: ..., // ✅ Correct column
    status: "completed", // ✅ Correct column
    notes: `Completed: ${workout.title}`,
  });

if (error) {
  this.logger.error(
    "[UnifiedTrainingService] Failed to mark workout complete",
    toLogContext({
      userId,
      workoutId: workout.id,
      workoutType: workout.type,
      error: error.message,
      code: error.code,
    }),
  );
  return false;
}
```

---

### 4. **postponeWorkout()** - Update Workout Date (Lines 1392-1433)

**Issues Fixed:**
- ❌ Inline date formatting → ✅ Extracted to variable for clarity
- ❌ Silent error suppression → ✅ Added error logging

**Before:**
```typescript
const { error } = await this.supabase.client
  .from("training_sessions")
  .update({
    session_date: tomorrow.toISOString().split("T")[0], // Mixed concerns
    notes: "[Postponed]",
  })
  .eq("id", workout.id);

if (error) return false; // ❌ Silent failure
```

**After:**
```typescript
const tomorrowDate = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD
const { error } = await this.supabase.client
  .from("training_sessions")
  .update({
    session_date: tomorrowDate, // ✅ Clear variable
    notes: "[Postponed]",
  })
  .eq("id", workout.id);

if (error) {
  this.logger.error(
    "[UnifiedTrainingService] Failed to postpone workout",
    toLogContext({
      workoutId: workout.id,
      newDate: tomorrowDate,
      error: error.message,
      code: error.code,
    }),
  );
  return false;
}
```

---

## Database Schema Reference

**Actual `training_sessions` columns** (from `database/migrations/001_base_tables.sql`):

```sql
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,           -- ✅ Not athlete_id
    team_id UUID,
    session_date DATE NOT NULL,      -- ✅ Not date
    session_type VARCHAR(100) NOT NULL,
    drill_type VARCHAR(100),
    duration_minutes INTEGER NOT NULL, -- ✅ Not duration
    intensity_level INTEGER,         -- ✅ Not intensity (1-10)
    completion_rate DECIMAL(5,2),
    performance_score DECIMAL(5,2),
    xp_earned INTEGER DEFAULT 0,
    verification_confidence DECIMAL(3,2) DEFAULT 0.5,
    notes TEXT,
    coach_feedback TEXT,
    status VARCHAR(20) DEFAULT 'completed', -- ✅ Not completed boolean
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Note:** `start_time` column does NOT exist in the schema.

---

## RLS Policy Verification

**Policy:** Users can select their own sessions

```sql
CREATE POLICY "Users can view own training sessions"
ON training_sessions FOR SELECT
USING (user_id = auth.user_id());
```

**Status:** ✅ Verified in `database/supabase-rls-policies.sql`

---

## Benefits of These Changes

### 1. **Timezone Safety**
Using `YYYY-MM-DD` format for DATE columns prevents timezone drift issues:
- User in Ljubljana (CET/CEST) at 23:50 local time
- ISO timestamp: `2026-01-11T22:50:00.000Z` (UTC)
- Without `.split("T")[0]`: Query might filter wrong day
- With `.split("T")[0]`: `2026-01-11` always matches correctly

### 2. **Error Visibility**
Previously, failed queries returned empty arrays with no indication of failure:
- RLS policy mismatch? Silent failure.
- Column name typo? Silent failure.
- Network error? Silent failure.

Now all failures are logged with context:
```typescript
{
  userId: "uuid-here",
  dateRange: { start: "2025-12-12" },
  error: "column 'date' does not exist",
  code: "42703"
}
```

### 3. **Schema Alignment**
All queries now match the actual database schema, preventing:
- `undefined` values in UI
- Broken filters/sorts
- Insert/update failures

### 4. **Maintainability**
- Clear variable names (`start`, `today`, `tomorrowDate`)
- Consistent date formatting pattern
- Comprehensive error context for debugging

---

## Testing Checklist

### Dashboard: 30-Day List
- [ ] Last 30 days populate correctly
- [ ] Count matches expectations
- [ ] Boundary test: sessions at exactly 30 days ago
- [ ] Empty state: user with no sessions shows fallback

### Today View
- [ ] Scheduled sessions show up
- [ ] Sessions ordered by creation time
- [ ] Multiple sessions on same day render correctly

### Workout Actions
- [ ] Mark as complete inserts correct columns
- [ ] Postpone updates date correctly
- [ ] Actions refresh dashboard state

### Error Scenarios
- [ ] RLS block logs error (test with wrong user_id)
- [ ] Column mismatch logs error
- [ ] Network error logs error
- [ ] All errors show graceful fallback UI

### Timezone Edge Cases
- [ ] User near midnight (23:00-01:00 local)
- [ ] User in different timezone than server
- [ ] DST transition dates

---

## Related Files

- **Interface:** `angular/src/app/core/models/api.models.ts` (TrainingSessionRecord)
- **Schema:** `database/migrations/001_base_tables.sql`
- **RLS:** `database/supabase-rls-policies.sql`
- **Backend API:** `routes/training.routes.js` (not used by these queries)

---

## Future Improvements

1. **Add `start_time` column** if scheduling by time is needed:
   ```sql
   ALTER TABLE training_sessions ADD COLUMN start_time TIME;
   ```

2. **Consider using `scheduled_time`** (exists in legacy schema) if available

3. **Add database indexes** for common queries:
   ```sql
   CREATE INDEX idx_training_sessions_user_date 
   ON training_sessions(user_id, session_date DESC);
   ```

4. **Centralize date formatting** in a utility:
   ```typescript
   export const toDateString = (date: Date): string => 
     date.toISOString().split("T")[0];
   ```

---

## Questions Answered

### Q: What endpoint does the frontend call?
**A:** Direct Supabase call from `UnifiedTrainingService` (not via `/api/training/*`)

### Q: Which columns are correct?
**A:** 
- ✅ `user_id` (not `athlete_id`)
- ✅ `session_date` (not `date`)
- ✅ `duration_minutes` (not `duration`)
- ✅ `intensity_level` (not `intensity`)
- ✅ `status` (not `completed`)

### Q: Why date-only strings?
**A:** Postgres DATE columns + timezone safety. Full ISO timestamps can drift across day boundaries in different timezones.

### Q: What if RLS blocks?
**A:** Error is now logged with full context. Previously it failed silently.

---

**Status:** ✅ All changes implemented and documented
