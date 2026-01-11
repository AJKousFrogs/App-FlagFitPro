# Debugging 502 Error for calc-readiness Endpoint

## Issue Summary

**Error**: HTTP 502 when calling `/api/calc-readiness` from the Angular frontend  
**Function**: `calc-readiness.cjs`  
**Date**: 2026-01-11

## What is a 502 Error?

A 502 (Bad Gateway) error from Netlify Functions means:
1. The serverless function crashed during execution
2. The function timed out (>10 seconds default)
3. The function threw an unhandled exception
4. Memory limit exceeded

## Investigation Steps Taken

### 1. ✅ Verified Environment Variables
All required Supabase environment variables are properly set in Netlify:
- `SUPABASE_URL` ✓
- `SUPABASE_SERVICE_KEY` ✓
- `SUPABASE_ANON_KEY` ✓
- `SUPABASE_JWT_SECRET` ✓

### 2. ✅ Verified Database Schema
All required tables exist:
- `wellness_logs` ✓
- `training_sessions` ✓
- `readiness_scores` ✓
- `fixtures` ✓

All required RPC functions exist:
- `detect_acwr_trigger()` ✓
- `has_active_safety_override()` ✓
- `detect_pain_trigger()` ✓

### 3. ✅ Verified Dependencies
- `@supabase/supabase-js@2.90.0` installed
- All utility functions exist:
  - `base-handler.cjs` ✓
  - `error-handler.cjs` ✓
  - `auth-helper.cjs` ✓
  - `safety-override.cjs` ✓

## Fix Applied

Added comprehensive logging throughout the function to identify the exact point of failure:

```javascript
console.log("[calc-readiness] Starting function execution", {...});
console.log("[calc-readiness] Parsed body:", body);
console.log("[calc-readiness] Request parameters:", {...});
console.log("[calc-readiness] Fetching sessions:", {...});
console.log("[calc-readiness] Fetched X sessions");
console.log("[calc-readiness] Fetching wellness log for:", {...});
console.log("[calc-readiness] Wellness log found:", !!wellness);
console.log("[calc-readiness] Calculation complete:", {...});
```

Also wrapped the ACWR trigger detection in a try-catch to prevent it from crashing the entire request:

```javascript
try {
  await detectACWRTrigger(athleteId);
} catch (triggerError) {
  console.error("[calc-readiness] Error in detectACWRTrigger:", triggerError);
  // Don't fail the whole request if safety override check fails
}
```

## How to View Logs

Once deployed, you can view the function logs in several ways:

### Option 1: Netlify UI
1. Go to https://app.netlify.com/sites/webflagfootballfrogs/logs
2. Filter by "Functions"
3. Look for `[calc-readiness]` log entries
4. The logs will show exactly where the function fails

### Option 2: Netlify CLI
```bash
netlify logs:functions calc-readiness --live
```

### Option 3: Browser DevTools
1. Open browser console on the app
2. Submit a wellness check-in to trigger the error
3. The error tracking will show the 502 error
4. Check the Network tab for the failed request

## Common Causes of 502 in calc-readiness

### 1. Missing Wellness Log
**Error**: "Missing wellness log for this day"  
**Fix**: User must submit wellness data before calculating readiness

### 2. Database Query Timeout
**Symptoms**: Function takes >10 seconds  
**Fix**: Add indexes to `training_sessions` and `wellness_logs`:
```sql
CREATE INDEX IF NOT EXISTS idx_training_sessions_athlete_date 
  ON training_sessions(athlete_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_wellness_logs_athlete_date 
  ON wellness_logs(athlete_id, log_date DESC);
```

### 3. RPC Function Error
**Error**: `detect_acwr_trigger` or other RPC function fails  
**Fix**: Check the RPC function implementation in Supabase

### 4. Invalid Date Format
**Error**: "Invalid date" when parsing `day` parameter  
**Fix**: Ensure frontend sends ISO 8601 date string (YYYY-MM-DD)

### 5. Memory Limit Exceeded
**Symptoms**: Function crashes without logs  
**Fix**: Optimize query to fetch only required columns, not `SELECT *`

## Next Steps

1. **Wait for deployment** (~3-5 minutes)
2. **Test the endpoint** again from the frontend
3. **Check the logs** in Netlify (see above)
4. **Identify the failure point** from the log messages
5. **Apply targeted fix** based on the specific error

## Frontend Context

The error occurs when a user submits a quick check-in on the Today page:
- Component: `today.component.ts`
- Method: `submitQuickCheckin()`
- Calls: `wellnessService.submitWellness()`
- Which calls: `/api/calc-readiness` endpoint

## Expected Behavior

When working correctly, the function should:
1. Accept POST request with `{athleteId, day}`
2. Fetch training sessions for last 28 days
3. Calculate ACWR (Acute:Chronic Workload Ratio)
4. Fetch wellness log for the day
5. Calculate wellness index
6. Fetch next fixture (game proximity)
7. Calculate composite readiness score
8. Save to `readiness_scores` table
9. Return score, level, suggestion, and component scores

## Monitoring

After fix is deployed, monitor:
- Success rate of `/api/calc-readiness` calls
- Average response time (should be <2 seconds)
- Error rate in Netlify Functions dashboard
- Sentry error tracking for frontend errors

## Related Files

- Function: `netlify/functions/calc-readiness.cjs`
- Frontend Service: `angular/src/app/core/services/wellness.service.ts`
- Component: `angular/src/app/features/today/today.component.ts`
- Utilities:
  - `netlify/functions/utils/base-handler.cjs`
  - `netlify/functions/utils/safety-override.cjs`
  - `netlify/functions/supabase-client.cjs`

## Contact

If issue persists after deployment, check:
1. Netlify function logs for stack trace
2. Supabase logs for database errors
3. Network tab for request/response details
4. Sentry for client-side error details
