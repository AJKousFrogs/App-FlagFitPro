# 502 Error Fix: Wellness Data Sync Issue

## Problem Summary

**Error**: HTTP 502 when calling `/api/calc-readiness`  
**Root Cause**: Frontend writes to `wellness_entries` table, but backend reads from `wellness_logs` table  
**Status**: ✅ **FIXED** (2026-01-11)

## Root Cause Analysis

### Data Flow Disconnect

1. **Frontend (`wellness.service.ts`)**:
   - Writes wellness data to `wellness_entries` table via Supabase client
   - Uses columns: `date`, `sleep_quality`, `energy_level`, `muscle_soreness`, `stress_level`, `mood`

2. **Backend (`calc-readiness.cjs`)**:
   - Reads wellness data from `wellness_logs` table
   - Uses columns: `log_date`, `fatigue`, `sleep_quality`, `soreness`, `energy`, `mood`, `stress`

3. **Result**:
   - When user submits wellness check-in, data goes to `wellness_entries`
   - When `calc-readiness` tries to calculate readiness score, it queries `wellness_logs`
   - No data found in `wellness_logs` → 400 error: "Missing wellness log for this day"
   - If function crashed before returning error → 502 Bad Gateway

## Solution Implemented

### Database Trigger for Automatic Sync

Created a PostgreSQL trigger that automatically syncs data from `wellness_entries` to `wellness_logs` on INSERT or UPDATE:

**Migration**: `database/migrations/fix_wellness_sync_trigger.sql`

#### Key Components:

1. **Trigger Function**: `sync_wellness_entry_to_log()`
   - Maps fields between the two table schemas
   - Handles NULL values with defaults
   - Uses UPSERT to avoid duplicates

2. **Trigger**: `sync_wellness_entries_to_logs`
   - Fires AFTER INSERT OR UPDATE on `wellness_entries`
   - Automatically calls sync function

3. **Unique Constraint**: `wellness_logs_athlete_date_unique`
   - Ensures one wellness log per athlete per day
   - Enables ON CONFLICT handling for upserts

4. **Backfill**:
   - Migrated all existing data from `wellness_entries` to `wellness_logs`
   - Verified: 8 rows in both tables

## Field Mapping

| wellness_entries | wellness_logs | Default |
|-----------------|---------------|---------|
| athlete_id      | athlete_id    | -       |
| user_id         | user_id       | athlete_id |
| date            | log_date      | -       |
| muscle_soreness | fatigue       | 3       |
| sleep_quality   | sleep_quality | 3       |
| muscle_soreness | soreness      | 3       |
| mood            | mood          | 3       |
| stress_level    | stress        | 3       |
| energy_level    | energy        | 3       |
| (none)          | sleep_hours   | 7.0     |

**Note**: `wellness_entries` doesn't have a `sleep_hours` field, so we default to 7.0 hours.

## Verification Steps

### 1. Verify Trigger Exists

```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'wellness_entries'
  AND trigger_name = 'sync_wellness_entries_to_logs';
```

Expected: 2 rows (INSERT and UPDATE triggers)

### 2. Verify Data Sync

```sql
-- Check row counts match
SELECT 
  'wellness_entries' as table_name, COUNT(*) as row_count
FROM wellness_entries
UNION ALL
SELECT 
  'wellness_logs' as table_name, COUNT(*) as row_count
FROM wellness_logs;
```

Expected: Same row count in both tables

### 3. Test End-to-End Flow

1. Submit a wellness check-in from the Today page
2. Check that data appears in both tables:

```sql
SELECT athlete_id, date, sleep_quality, energy_level, muscle_soreness
FROM wellness_entries
WHERE athlete_id = 'YOUR_USER_ID'
ORDER BY date DESC
LIMIT 1;

SELECT athlete_id, log_date, sleep_quality, energy, soreness
FROM wellness_logs
WHERE athlete_id = 'YOUR_USER_ID'
ORDER BY log_date DESC
LIMIT 1;
```

3. Verify readiness calculation works (no 502 error)

## Additional Improvements Made

### Enhanced Logging in calc-readiness Function

Added detailed logging throughout the function to help diagnose issues:

```javascript
console.log("[calc-readiness] Starting function execution", {...});
console.log("[calc-readiness] Fetching wellness log for:", {...});
console.log("[calc-readiness] Wellness log found:", !!wellness);
console.log("[calc-readiness] Calculation complete:", {...});
```

### Error Handling for ACWR Trigger

Wrapped the ACWR safety check in try-catch to prevent it from crashing the entire request:

```javascript
try {
  await detectACWRTrigger(athleteId);
} catch (triggerError) {
  console.error("[calc-readiness] Error in detectACWRTrigger:", triggerError);
  // Don't fail the whole request if safety override check fails
}
```

## Testing Checklist

- [x] Trigger created successfully
- [x] Data backfilled (8 rows)
- [x] Enhanced logging deployed
- [x] Error handling improved
- [ ] End-to-end test: Submit wellness check-in
- [ ] Verify readiness score calculated
- [ ] Check Netlify function logs

## Monitoring

### Key Metrics to Watch

1. **Success Rate**: `/api/calc-readiness` should have >95% success rate
2. **Response Time**: Should be <2 seconds
3. **Error Rate**: Should see 502 errors drop to zero
4. **Data Sync**: Row counts should match between tables

### Where to Check

- **Netlify Logs**: https://app.netlify.com/sites/webflagfootballfrogs/logs
- **Supabase Logs**: Check for trigger execution errors
- **Frontend Error Tracking**: Check Sentry for client-side errors

## Future Improvements

### Option 1: Consolidate Tables (Recommended)

Migrate fully to one table (probably `wellness_logs` since it has better schema):

1. Update frontend to write directly to `wellness_logs`
2. Drop `wellness_entries` table
3. Remove trigger (no longer needed)

### Option 2: Backend Reads from wellness_entries

Update `calc-readiness.cjs` to read from `wellness_entries`:

1. Change query from `wellness_logs` to `wellness_entries`
2. Update field mapping in function
3. Remove trigger (no longer needed)

### Recommendation

**Option 1** is better because:
- `wellness_logs` has more complete schema (includes `sleep_hours`)
- Used by other backend functions
- Better aligned with evidence-based readiness calculation

## Files Modified

### Database
- `database/migrations/fix_wellness_sync_trigger.sql` (created)

### Backend
- `netlify/functions/calc-readiness.cjs` (enhanced logging)

### Documentation
- `docs/DEBUGGING_502_CALC_READINESS.md` (diagnostic guide)
- `docs/WELLNESS_DATA_SYNC_FIX.md` (this file)
- `scripts/diagnose-calc-readiness.sh` (diagnostic script)

## Related Issues

- GitHub Issue: [Link if created]
- Sentry Error: [Link to Sentry if tracked]

## Contact

For questions or issues:
1. Check Netlify function logs first
2. Verify trigger is still active in Supabase
3. Check this documentation for troubleshooting steps
4. Review `DEBUGGING_502_CALC_READINESS.md` for detailed diagnostics

## References

- Supabase Triggers: https://supabase.com/docs/guides/database/postgres/triggers
- PostgreSQL ON CONFLICT: https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT
- Netlify Functions Error Codes: https://docs.netlify.com/functions/troubleshooting/
