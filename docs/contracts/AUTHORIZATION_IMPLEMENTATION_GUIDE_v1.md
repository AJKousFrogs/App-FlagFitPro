# AUTHORIZATION AND GUARDRAILS CONTRACT — IMPLEMENTATION GUIDE v1

**Date:** 2026-01-06  
**Status:** READY FOR IMPLEMENTATION  
**Priority:** CRITICAL

---

## QUICK START

This guide provides step-by-step instructions to implement the fixes identified in `AUTHORIZATION_AUDIT_REPORT_v1.md`.

---

## IMPLEMENTATION ORDER

### Phase 1: Database Schema (CRITICAL - Do First)

**Files to Apply:**
1. `supabase/migrations/20260106_add_coach_locked_enforcement.sql`
2. `supabase/migrations/20260106_add_immutability_triggers.sql`
3. `supabase/migrations/20260106_update_rls_policies.sql`
4. `supabase/migrations/20260106_append_only_audit_tables.sql`

**Steps:**
```bash
# 1. Connect to Supabase SQL Editor
# 2. Run migrations in order (they are numbered)
# 3. Verify triggers are created:
```

**Verification SQL:**
```sql
-- Check coach_locked column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'training_sessions' 
AND column_name IN ('coach_locked', 'session_state', 'modified_by_coach_id');

-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'training_sessions'
AND trigger_name LIKE '%modification%';

-- Check RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'training_sessions';
```

---

### Phase 2: API Authorization Layer (CRITICAL)

**Files Created:**
- `netlify/functions/utils/authorization-guard.cjs` ✅ (Already created)

**Files to Modify:**
1. `netlify/functions/training-sessions.cjs`
2. `netlify/functions/coach.cjs`
3. `netlify/functions/daily-protocol.cjs`
4. `netlify/functions/daily-training.cjs`

**Example Integration:**

```javascript
// In training-sessions.cjs
const { requireAuthorization, getUserRole } = require("./utils/authorization-guard.cjs");

// Modify createTrainingSession
async function createTrainingSession(userId, sessionData) {
  const role = await getUserRole(userId);
  if (!role) {
    throw new Error("User role not found");
  }
  
  const targetUserId = sessionData.user_id || userId;
  if (targetUserId !== userId && !['coach', 'admin'].includes(role)) {
    throw new Error("Insufficient permissions: coach role required");
  }
  
  // ... rest of function
}

// Add update handler
async function updateTrainingSession(userId, sessionId, updates, requestInfo) {
  const authCheck = await requireAuthorization(
    userId,
    sessionId,
    "session",
    "update",
    "structure",
    requestInfo
  );
  
  if (!authCheck.success) {
    return authCheck.error;
  }
  
  // Proceed with update
  const { data: session, error } = await supabaseAdmin
    .from("training_sessions")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", sessionId)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return session;
}
```

---

### Phase 3: Remove Frontend Direct Writes (HIGH PRIORITY)

**Files to Modify:**
- `angular/src/app/core/services/training-data.service.ts`

**Changes:**
1. Remove `updateTrainingSession()` direct Supabase write
2. Remove `deleteTrainingSession()` (contract violation - sessions should be locked, not deleted)
3. Replace with HTTP calls to API endpoints

**Example:**
```typescript
// OLD (VIOLATION):
updateTrainingSession(id: string, updates: Partial<TrainingSession>) {
  return from(
    this.supabaseService.client
      .from("training_sessions")
      .update(updateData)
      .eq("id", id)
  );
}

// NEW (COMPLIANT):
updateTrainingSession(id: string, updates: Partial<TrainingSession>) {
  return this.http.put<{ session: TrainingSession }>(
    `/api/training/sessions`,
    { sessionId: id, ...updates }
  ).pipe(
    map(response => response.session)
  );
}
```

---

## TESTING CHECKLIST

After implementing each phase, run the proof tests from `AUTHORIZATION_AUDIT_REPORT_v1.md` Section D.

### Quick Smoke Test

```bash
# Test 1: Try to update session as athlete (should fail)
curl -X PUT "https://your-api.netlify.app/api/training/sessions" \
  -H "Authorization: Bearer $ATHLETE_TOKEN" \
  -d '{"sessionId": "test-id", "notes": "test"}'

# Expected: 403 Forbidden

# Test 2: Check violation was logged
# Run in Supabase SQL Editor:
SELECT * FROM authorization_violations ORDER BY timestamp DESC LIMIT 1;
```

---

## ROLLBACK PLAN

If issues occur:

1. **Database Rollback:**
```sql
-- Drop triggers
DROP TRIGGER IF EXISTS prevent_in_progress_modification_trigger ON training_sessions;
DROP TRIGGER IF EXISTS prevent_coach_locked_modification_trigger ON training_sessions;
DROP TRIGGER IF EXISTS prevent_timestamp_modification_trigger ON training_sessions;

-- Drop functions
DROP FUNCTION IF EXISTS prevent_in_progress_modification();
DROP FUNCTION IF EXISTS prevent_coach_locked_modification();
DROP FUNCTION IF EXISTS prevent_timestamp_modification();

-- Revert RLS policies (restore original)
-- (Keep original policy definitions in backup)
```

2. **API Rollback:**
   - Revert `authorization-guard.cjs` changes
   - Restore original API handlers

3. **Frontend Rollback:**
   - Restore direct Supabase writes (temporary, until API is fixed)

---

## MONITORING

After implementation, monitor:

1. **Violation Logs:**
```sql
-- Check violation rate
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  error_code,
  COUNT(*) as count
FROM authorization_violations
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour, error_code
ORDER BY hour DESC, count DESC;
```

2. **Alert Thresholds:**
   - 5+ violations/hour from same user → Security alert
   - 50+ violations/hour system-wide → System alert

---

## KNOWN ISSUES & WORKAROUNDS

1. **Column Name Variations:**
   - Some tables use `user_id`, others use `athlete_id`
   - Triggers handle both cases
   - Update triggers if your schema differs

2. **Session State Column:**
   - If `session_state` doesn't exist, migration creates it
   - Default value is `'PLANNED'`
   - Update existing sessions if needed:
   ```sql
   UPDATE training_sessions 
   SET session_state = CASE 
     WHEN status = 'completed' THEN 'COMPLETED'
     WHEN status = 'in_progress' THEN 'IN_PROGRESS'
     ELSE 'PLANNED'
   END
   WHERE session_state IS NULL;
   ```

3. **Backward Compatibility:**
   - Old sessions without `coach_locked` default to `false`
   - Old sessions without `session_state` default to `'PLANNED'`
   - System continues to work during migration

---

## SUPPORT

For questions or issues:
1. Review `AUTHORIZATION_AUDIT_REPORT_v1.md` for detailed violation explanations
2. Check contract: `AUTHORIZATION_AND_GUARDRAILS_CONTRACT_v1.md`
3. Verify database schema matches expected structure

---

**END OF IMPLEMENTATION GUIDE**

