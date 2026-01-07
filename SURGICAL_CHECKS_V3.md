# Surgical Checks for v3 Confidence Implementation

## Status: CRITICAL ISSUES FOUND

### Check 1: Column Name Mismatch (`user_id` vs `athlete_id`) ✅ CONFIRMED ISSUE

**Finding**: The `training_sessions` table has:
- `athlete_id UUID NOT NULL` (canonical user reference)
- `user_id UUID NULL` (optional/legacy column)

**Current Code Issues**:

#### File: `netlify/functions/calc-readiness.cjs`
**Line 191**: Uses `.or(\`user_id.eq.${athleteId},athlete_id.eq.${athleteId}\`)`

```javascript
// CURRENT (INCORRECT - checks both columns):
let { data: sessions, error: sessErr } = await supabaseAdmin
  .from("training_sessions")
  .select("session_date, date, duration_minutes, rpe, intensity_level")
  .or(`user_id.eq.${athleteId},athlete_id.eq.${athleteId}`) // ❌ WRONG
  .gte("session_date", startChronic.toISOString().slice(0, 10))
  .lte("session_date", dayStr);
```

**REQUIRED FIX**:
```javascript
// CORRECTED (use athlete_id only):
let { data: sessions, error: sessErr } = await supabaseAdmin
  .from("training_sessions")
  .select("session_date, date, duration_minutes, rpe, intensity_level")
  .eq("athlete_id", athleteId) // ✅ CORRECT
  .gte("session_date", startChronic.toISOString().slice(0, 10))
  .lte("session_date", dayStr);
```

**Impact**: Without this fix, if training sessions are stored with `athlete_id` only (as per schema), the `.or()` query may return zero rows when `user_id` is NULL, causing:
- `acwrDaysLogged` = 0
- UI constantly showing "Need 21 days"
- Readiness calculations always showing insufficient data

**Other Files with Same Issue**:

#### File: `server.js`
**Line 2866**:
```javascript
// CURRENT:
.or(`user_id.eq.${userId},athlete_id.eq.${userId}`)

// FIX TO:
.eq("athlete_id", userId)
```

---

### Check 2: Readiness Check-in Table Consistency ⚠️ NEEDS VERIFICATION

**Issue**: The `daily_wellness_checkin` queries must be scoped to check-ins on/before the target date, not "latest ever", to prevent:
- Negative `readinessDaysSince` values
- Timezone edge cases where future check-ins are counted

**Requirement**: Add `.lte("checkin_date", date)` BEFORE ordering

**Files to Check**:

#### File: `netlify/functions/daily-protocol.cjs`
**Line 816-819**:
```javascript
// CURRENT:
const { data: wellnessCheckin } = await supabase
  .from("daily_wellness_checkin")
  .select("*")
  .eq("user_id", userId)
  .order("checkin_date", { ascending: false })

// NEEDS TO BE:
const { data: wellnessCheckin } = await supabase
  .from("daily_wellness_checkin")
  .select("*")
  .eq("user_id", userId)
  .lte("checkin_date", targetDate) // ✅ ADD THIS
  .order("checkin_date", { ascending: false })
```

**Note**: This file doesn't specify a target date parameter, so we need to determine what date scope should be used.

#### File: `netlify/functions/wellness-checkin.cjs`
**Lines 77-80**:
```javascript
// CURRENT (for getCheckin):
const { data, error } = await supabase
  .from("daily_wellness_checkin")
  .select("*")
  .eq("user_id", userId)
  .eq("checkin_date", date) // ✅ This one is OK - exact match
```
This query uses `.eq("checkin_date", date)` for exact match, which is correct for fetching a specific date's check-in.

#### File: `server.js`
**Lines 2323-2327**:
```javascript
// CURRENT:
const { data, error } = await supabase
  .from("daily_wellness_checkin")
  .select("*")
  .eq("user_id", targetUserId)
  .eq("checkin_date", date) // ✅ This one is OK - exact match
```
Also uses exact match, which is correct.

---

## v3 Confidence Implementation Status

**NOT FOUND**: No implementation exists yet with the following metrics:
- `acwrDaysLogged`
- `readinessDaysSince`

**Assumption**: The user is referring to a planned implementation that needs to:
1. Count days with ACWR data logged
2. Track days since last readiness check-in
3. Compute confidence metrics based on data completeness

**If v3 needs to be created**, it must:
- Use `.eq("athlete_id", userId)` for all `training_sessions` queries
- Use `.lte("checkin_date", targetDate)` when finding "latest check-in on/before date"
- Never use `.or()` with both `user_id` and `athlete_id`

---

## Actions Taken ✅

### Check 1: Column Name Fixes (COMPLETED)
Fixed all critical `training_sessions` queries to use `athlete_id` instead of `.or()`:

1. ✅ `netlify/functions/calc-readiness.cjs` (lines 191, 199-202)
2. ✅ `server.js` (lines 2866, 3000, 3015, 3079, 3093)
3. ✅ `angular/src/app/core/services/unified-training.service.ts` (line 768)
4. ✅ `netlify/functions/staff-psychology.cjs` (lines 84, 336) - for `wellness_entries`
5. ✅ `netlify/functions/ai-chat.cjs` (line 170)
6. ✅ `netlify/functions/smart-training-recommendations.cjs` (lines 95, 257)

**Note**: Also fixed `wellness_entries` table queries (same pattern: `athlete_id` NOT NULL, `user_id` NULL)

### Check 2: Readiness Check-in Date Scoping (COMPLETED)
Fixed wellness check-in queries to use `.lte("checkin_date", date)`:

1. ✅ `netlify/functions/daily-protocol.cjs` (line 820) - Added `.lte("checkin_date", date)` before ordering

**Files Not Needing Fix** (already using exact date match):
- `netlify/functions/wellness-checkin.cjs` (uses `.eq("checkin_date", date)`)
- `server.js` (uses `.eq("checkin_date", date)`)

## Remaining Actions

### Before v3 Implementation:
1. Document which column is canonical (`athlete_id`) in schema comments
2. Consider deprecating `user_id` column if not needed
3. Add database constraint/comment documenting `athlete_id` as primary user reference
4. Review other tables with dual columns (see list below)

### Testing Required (CRITICAL):
1. ✅ Test ACWR calculations return data after fix
2. ✅ Test readiness check-in queries don't return future dates
3. Test timezone handling for `checkin_date` queries
4. Test UI no longer shows "Need 21 days" when data exists

### Other Tables with Dual Columns (Lower Priority):
These tables also have both `user_id` (nullable) and `athlete_id`/`player_id` (NOT NULL):
- `wellness_entries` (fixed)
- `wellness_logs`
- `wellness_checkins`
- `readiness_scores`
- `recovery_sessions`
- `calibration_logs`
- `athlete_drill_assignments`
- `athlete_recovery_profiles`
- `competition_readiness`
- `fixtures`
- `workout_logs`
- And 14 more (see database query results above)

---

## Database Schema Reference

```sql
-- From public.training_sessions:
athlete_id UUID NOT NULL REFERENCES users(id)  -- ✅ Canonical
user_id UUID NULL                               -- ⚠️  Optional/Legacy
```

**Proof**: Query result from `information_schema.columns`:
```json
[
  {"column_name":"athlete_id","data_type":"uuid","is_nullable":"NO"},
  {"column_name":"user_id","data_type":"uuid","is_nullable":"YES"}
]
```

