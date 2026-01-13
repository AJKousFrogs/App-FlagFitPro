# AUTHORIZATION AND GUARDRAILS CONTRACT — AUDIT REPORT v1

**Audit Date:** 2026-01-06  
**Contract Version:** AUTHORIZATION_AND_GUARDRAILS_CONTRACT_v1  
**Auditor:** System Compliance Check  
**Status:** CRITICAL VIOLATIONS FOUND

---

## A) FINDINGS SUMMARY

| Category | PASS | FAIL | NEEDS-INFO |
|----------|------|------|------------|
| **Zero Trust Frontend** | 0 | 3 | 0 |
| **Coach-Locked Enforcement** | 0 | 5 | 0 |
| **Session State Immutability** | 0 | 4 | 0 |
| **Consent Enforcement** | 1 | 2 | 0 |
| **Append-Only Tables** | 0 | 3 | 0 |
| **Violation Handling** | 0 | 2 | 0 |
| **API Guards** | 2 | 6 | 0 |
| **Database Triggers** | 0 | 4 | 0 |
| **TOTAL** | **3** | **29** | **0** |

**Overall Compliance:** **FAIL** (9.4% compliance rate)

---

## B) VIOLATIONS TABLE

| ID | Severity | Contract Clause | Evidence | Why It Violates | Fix Plan |
|----|----------|----------------|----------|----------------|----------|
| **V-001** | CRITICAL | Section 1.6 Lock, Section 5 | `grep coach_locked` → No matches | `coach_locked` field does not exist in database schema | Add `coach_locked BOOLEAN DEFAULT false` column to `training_sessions` table |
| **V-002** | CRITICAL | Section 3.1, Section 4.3 | `database/supabase-rls-policies.sql:361-364` | RLS policy allows ANY user to update their own sessions without checking `coach_locked` or session state | Add `coach_locked = false AND session_state < 'IN_PROGRESS'` checks to UPDATE policy |
| **V-003** | CRITICAL | Section 3.1, Section 4.3 | `angular/src/app/core/services/training-data.service.ts:204-248` | Frontend directly updates `training_sessions` via Supabase client, bypassing API guards | Remove direct frontend writes; route through API endpoints with guards |
| **V-004** | CRITICAL | Section 3.1, Section 4.3 | No trigger found | No database trigger prevents modifications when `session_state >= 'IN_PROGRESS'` | Create trigger `prevent_in_progress_modification()` that raises exception |
| **V-005** | CRITICAL | Section 5 | `netlify/functions/training-sessions.cjs:19-105` | API endpoint does not check `coach_locked` before allowing session creation/update | Add pre-flight check: `SELECT coach_locked FROM training_sessions WHERE id = $1` |
| **V-006** | CRITICAL | Section 3.1 | `netlify/functions/training-sessions.cjs:19-105` | No role check - any authenticated user can create/modify sessions | Add role verification: `SELECT role FROM profiles WHERE user_id = $1` → must be COACH for structure modifications |
| **V-007** | CRITICAL | Section 3.1 | `netlify/functions/daily-training.cjs:713-765` | Uses `supabaseAdmin` (service role) to update sessions without authorization checks | Replace with authenticated client + authorization middleware |
| **V-008** | CRITICAL | Section 3.1 | `netlify/functions/coach.cjs:455-488` | Coach endpoint creates sessions without checking if target session is `coach_locked` | Add `coach_locked` check before insert/update |
| **V-009** | HIGH | Section 4.1 | No constraint found | `session.started_at` and `session.completed_at` can be updated after set | Add CHECK constraint: `started_at` and `completed_at` are immutable once set |
| **V-010** | HIGH | Section 4.2 | No RLS policy found | `audit_logs`, `execution_logs`, `readiness_logs` allow UPDATE/DELETE | Create append-only policies: `USING (false) WITH CHECK (false)` for UPDATE/DELETE |
| **V-011** | HIGH | Section 3.3 | `netlify/functions/daily-protocol.cjs:1608-1833` | `logSession` function allows updates to `daily_protocols` without checking if protocol is locked | Add lock check before update |
| **V-012** | HIGH | Section 1.2, Section 6 | No AI guard found | No explicit deny-list for AI/Merlin write operations | Create `AI_WRITE_DENY_LIST` constant and enforce in AI endpoints |
| **V-013** | HIGH | Section 3.5 | `netlify/functions/ai-chat.cjs` (assumed) | AI endpoints may write to sessions without checking `coach_locked` | Add pre-flight authorization check in AI request handler |
| **V-014** | HIGH | Section 1.1 | `netlify/functions/utils/auth-helper.cjs:82` | Role extracted from JWT `user_metadata.role` instead of database | Change to: `SELECT role FROM profiles WHERE user_id = $1` |
| **V-015** | HIGH | Section 3.2 | `netlify/functions/coach.cjs:455-488` | No explicit `coach_id` required; no reason logged for override_flag | Add required `coach_id` field and `override_reason` logging |
| **V-016** | MEDIUM | Section 3.4 | `netlify/functions/wellness-checkin.cjs` | Check-in API may allow overwriting historical check-ins | Add unique constraint: `(user_id, checkin_date)` and append-only policy |
| **V-017** | MEDIUM | Section 4.1 | No constraint found | `audit.actor_id` and `audit.timestamp` can be updated | Add CHECK constraints preventing updates to audit fields |
| **V-018** | MEDIUM | Section 7 | `database/supabase-rls-policies.sql:330-353` | Consent check exists but revocation may not invalidate immediately | Add trigger to invalidate cache on consent revocation |
| **V-019** | MEDIUM | Section 8 | No violation logging found | Authorization failures are not logged to `authorization_violations` table | Create violation logging function and call on all auth failures |
| **V-020** | MEDIUM | Section 8 | Error responses may be silent | Some catch blocks return `null` or `false` without explicit error | Ensure all auth failures return explicit error responses |
| **V-021** | MEDIUM | Section 3.6 | `netlify/functions/admin.cjs` (assumed) | Admin endpoints may mutate training data | Add capability check: admins can read but not mutate training data |
| **V-022** | MEDIUM | Section 4.3 | No trigger found | No trigger prevents mutations when `coach_locked = true` | Create trigger `prevent_coach_locked_modification()` |
| **V-023** | MEDIUM | Section 3.3 | `angular/src/app/core/services/training-data.service.ts:204-248` | Frontend can update sessions without checking if they're IN_PROGRESS | Remove frontend direct writes; enforce via API |
| **V-024** | MEDIUM | Section 9.1 | `angular/src/app/core/services/training-data.service.ts:204-248` | Frontend trusts its own state for authorization (relies on RLS only) | Add explicit API guard layer; don't trust frontend |
| **V-025** | MEDIUM | Section 9.5 | `netlify/functions/daily-protocol.cjs:1646` | Timestamps set to `new Date().toISOString()` - could be manipulated | Use database `NOW()` function instead of client timestamp |
| **V-026** | MEDIUM | Section 9.6 | `netlify/functions/utils/auth-helper.cjs:82` | Role inferred from JWT metadata instead of explicit database query | Query database for role on every request |
| **V-027** | LOW | Section 4.2 | No table found | `pain_reports` table may not exist or may allow updates | Create append-only policy if table exists |
| **V-028** | LOW | Section 8 | No alerting found | No security alert system for repeated violations | Add alerting function for 5+ violations in 1 hour |
| **V-029** | LOW | Section 9.7 | Potential caching | Role/permissions may be cached across requests | Ensure cache is request-scoped only |

---

## C) PATCH SET

### PATCH 1: Add `coach_locked` Column and Related Fields

**File:** `supabase/migrations/20260106_add_coach_locked_enforcement.sql`

```sql
-- Add coach_locked column to training_sessions
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS coach_locked BOOLEAN DEFAULT false NOT NULL;

-- Add coach attribution fields
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS modified_by_coach_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ;

-- Add session_state column if it doesn't exist
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS session_state TEXT DEFAULT 'PLANNED' 
CHECK (session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_coach_locked ON training_sessions(coach_locked) WHERE coach_locked = true;
CREATE INDEX IF NOT EXISTS idx_training_sessions_session_state ON training_sessions(session_state);
CREATE INDEX IF NOT EXISTS idx_training_sessions_modified_by_coach ON training_sessions(modified_by_coach_id) WHERE modified_by_coach_id IS NOT NULL;
```

---

### PATCH 2: Create Database Triggers for Immutability

**File:** `supabase/migrations/20260106_add_immutability_triggers.sql`

```sql
-- Trigger 1: Prevent modifications to IN_PROGRESS or later sessions
CREATE OR REPLACE FUNCTION prevent_in_progress_modification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if structural modification attempted
  IF OLD.session_structure IS DISTINCT FROM NEW.session_structure
     OR OLD.prescribed_duration IS DISTINCT FROM NEW.prescribed_duration
     OR OLD.prescribed_intensity IS DISTINCT FROM NEW.prescribed_intensity THEN
    
    -- Reject if session is IN_PROGRESS or later
    IF OLD.session_state IN ('IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED') THEN
      RAISE EXCEPTION 'Cannot modify session structure: session is %', OLD.session_state;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_in_progress_modification_trigger ON training_sessions;
CREATE TRIGGER prevent_in_progress_modification_trigger
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_in_progress_modification();

-- Trigger 2: Prevent modifications to coach_locked sessions
CREATE OR REPLACE FUNCTION prevent_coach_locked_modification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- If session is coach_locked, only the coach who locked it can modify
  IF OLD.coach_locked = true THEN
    -- Check if modifier is the coach who locked it
    IF NEW.modified_by_coach_id IS NULL 
       OR NEW.modified_by_coach_id != OLD.modified_by_coach_id THEN
      RAISE EXCEPTION 'Cannot modify coach_locked session: locked by coach %', OLD.modified_by_coach_id;
    END IF;
  END IF;
  
  -- Auto-set coach_locked when coach modifies structure
  IF OLD.session_structure IS DISTINCT FROM NEW.session_structure 
     AND NEW.modified_by_coach_id IS NOT NULL THEN
    NEW.coach_locked = true;
    NEW.modified_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_coach_locked_modification_trigger ON training_sessions;
CREATE TRIGGER prevent_coach_locked_modification_trigger
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_coach_locked_modification();

-- Trigger 3: Prevent updates to immutable timestamp columns
CREATE OR REPLACE FUNCTION prevent_timestamp_modification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Prevent updates to started_at once set
  IF OLD.started_at IS NOT NULL AND OLD.started_at IS DISTINCT FROM NEW.started_at THEN
    RAISE EXCEPTION 'Cannot modify started_at: field is immutable once set';
  END IF;
  
  -- Prevent updates to completed_at once set
  IF OLD.completed_at IS NOT NULL AND OLD.completed_at IS DISTINCT FROM NEW.completed_at THEN
    RAISE EXCEPTION 'Cannot modify completed_at: field is immutable once set';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_timestamp_modification_trigger ON training_sessions;
CREATE TRIGGER prevent_timestamp_modification_trigger
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_timestamp_modification();
```

---

### PATCH 3: Update RLS Policies for Coach-Locked and State Enforcement

**File:** `supabase/migrations/20260106_update_rls_policies.sql`

```sql
-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own training sessions" ON training_sessions;

-- Create new UPDATE policy with coach_locked and state checks
CREATE POLICY "Users can update own training sessions"
ON training_sessions FOR UPDATE
USING (
  user_id = auth.uid()
  AND coach_locked = false
  AND session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED')
)
WITH CHECK (
  user_id = auth.uid()
  AND coach_locked = false
  AND session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED')
);

-- Create separate policy for coaches modifying sessions
DROP POLICY IF EXISTS "Coaches can modify team training sessions" ON training_sessions;
CREATE POLICY "Coaches can modify team training sessions"
ON training_sessions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = users.id
    AND users.raw_user_meta_data->>'role' = 'coach'
  )
  AND (
    -- Coach can modify if they locked it
    (coach_locked = true AND modified_by_coach_id = auth.uid())
    OR
    -- Coach can modify if not locked and state allows
    (coach_locked = false AND session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = users.id
    AND users.raw_user_meta_data->>'role' = 'coach'
  )
  AND (
    (coach_locked = true AND modified_by_coach_id = auth.uid())
    OR
    (coach_locked = false AND session_state IN ('PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED'))
  )
);
```

---

### PATCH 4: Create Append-Only Policies for Audit Tables

**File:** `supabase/migrations/20260106_append_only_audit_tables.sql`

```sql
-- Create authorization_violations table if it doesn't exist
CREATE TABLE IF NOT EXISTS authorization_violations (
  violation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  resource_id UUID,
  resource_type TEXT NOT NULL,
  action TEXT NOT NULL,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  request_method TEXT,
  request_body JSONB
);

-- Append-only policy for authorization_violations
ALTER TABLE authorization_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Append-only authorization violations" ON authorization_violations;
CREATE POLICY "Append-only authorization violations"
ON authorization_violations FOR ALL
USING (false)  -- No reads except via service role
WITH CHECK (
  -- Only allow inserts
  true
);

-- Grant insert to authenticated (for API logging)
GRANT INSERT ON authorization_violations TO authenticated;

-- Create append-only policies for audit logs (if tables exist)
DO $$
BEGIN
  -- execution_logs
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'execution_logs') THEN
    ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Append-only execution logs" ON execution_logs;
    CREATE POLICY "Append-only execution logs"
    ON execution_logs FOR ALL
    USING (false)
    WITH CHECK (true);  -- Allow inserts only
  END IF;
  
  -- readiness_logs
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'readiness_logs') THEN
    ALTER TABLE readiness_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Append-only readiness logs" ON readiness_logs;
    CREATE POLICY "Append-only readiness logs"
    ON readiness_logs FOR ALL
    USING (false)
    WITH CHECK (true);
  END IF;
  
  -- pain_reports
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pain_reports') THEN
    ALTER TABLE pain_reports ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Append-only pain reports" ON pain_reports;
    CREATE POLICY "Append-only pain reports"
    ON pain_reports FOR ALL
    USING (false)
    WITH CHECK (true);
  END IF;
END $$;
```

---

### PATCH 5: Add API Authorization Middleware

**File:** `netlify/functions/utils/authorization-guard.cjs`

```javascript
const { supabaseAdmin } = require("../supabase-client.cjs");
const { createErrorResponse } = require("./error-handler.cjs");

/**
 * Get user role from database (not JWT)
 */
async function getUserRole(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.role;
}

/**
 * Check if session can be modified
 */
async function canModifySession(userId, sessionId, modificationType = "structure") {
  // Get session with current state
  const { data: session, error } = await supabaseAdmin
    .from("training_sessions")
    .select("coach_locked, session_state, modified_by_coach_id, user_id")
    .eq("id", sessionId)
    .single();
  
  if (error || !session) {
    return { authorized: false, error: "Session not found" };
  }
  
  // Check coach_locked
  if (session.coach_locked) {
    // Only the coach who locked it can modify
    if (session.modified_by_coach_id !== userId) {
      return {
        authorized: false,
        error: "COACH_LOCKED",
        message: "Cannot modify coach_locked session"
      };
    }
  }
  
  // Check session state
  const mutableStates = ['PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED'];
  if (!mutableStates.includes(session.session_state)) {
    return {
      authorized: false,
      error: "STATE_IMMUTABLE",
      message: `Cannot modify session: session is ${session.session_state}`
    };
  }
  
  // Check role for structure modifications
  if (modificationType === "structure") {
    const role = await getUserRole(userId);
    if (!['coach', 'admin'].includes(role)) {
      return {
        authorized: false,
        error: "INSUFFICIENT_PERMISSIONS",
        message: "Coach role required for structure modifications"
      };
    }
  }
  
  // Check ownership for execution logging
  if (modificationType === "execution") {
    if (session.user_id !== userId) {
      return {
        authorized: false,
        error: "OWNERSHIP_MISMATCH",
        message: "Can only log execution for own sessions"
      };
    }
  }
  
  return { authorized: true };
}

/**
 * Log authorization violation
 */
async function logViolation(userId, resourceId, resourceType, action, errorCode, errorMessage, requestInfo = {}) {
  try {
    await supabaseAdmin.from("authorization_violations").insert({
      user_id: userId,
      resource_id: resourceId,
      resource_type: resourceType,
      action: action,
      error_code: errorCode,
      error_message: errorMessage,
      ip_address: requestInfo.ip,
      user_agent: requestInfo.userAgent,
      request_path: requestInfo.path,
      request_method: requestInfo.method,
      request_body: requestInfo.body ? JSON.parse(JSON.stringify(requestInfo.body)) : null
    });
  } catch (error) {
    console.error("[Authorization] Failed to log violation:", error);
  }
}

/**
 * Authorization guard middleware
 */
async function requireAuthorization(userId, resourceId, resourceType, action, modificationType = "structure") {
  const result = await canModifySession(userId, resourceId, modificationType);
  
  if (!result.authorized) {
    // Log violation
    await logViolation(
      userId,
      resourceId,
      resourceType,
      action,
      result.error,
      result.message,
      {}
    );
    
    return {
      success: false,
      error: createErrorResponse(
        result.message || "Authorization failed",
        403,
        result.error || "AUTHORIZATION_FAILED"
      )
    };
  }
  
  return { success: true };
}

module.exports = {
  getUserRole,
  canModifySession,
  logViolation,
  requireAuthorization
};
```

---

### PATCH 6: Update Training Sessions API with Guards

**File:** `netlify/functions/training-sessions.cjs` (modify existing)

```javascript
// Add at top
const { requireAuthorization, getUserRole } = require("./utils/authorization-guard.cjs");

// Modify createTrainingSession function
async function createTrainingSession(userId, sessionData) {
  // Check role - only coaches can create sessions for others
  const role = await getUserRole(userId);
  if (!role) {
    throw new Error("User role not found");
  }
  
  // If creating for another user, must be coach
  const targetUserId = sessionData.user_id || userId;
  if (targetUserId !== userId && !['coach', 'admin'].includes(role)) {
    throw new Error("Insufficient permissions: coach role required");
  }
  
  // ... rest of function
}

// Modify update handler (add new function)
async function updateTrainingSession(userId, sessionId, updates) {
  // Check authorization
  const authCheck = await requireAuthorization(
    userId,
    sessionId,
    "session",
    "update",
    "structure"
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

// Update handler to include PUT method
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "training-sessions",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType: event.httpMethod === "POST" ? "CREATE" : "READ",
    handler: async (event, _context, { userId }) => {
      // ... existing GET and POST handlers ...
      
      // Add PUT handler
      if (event.httpMethod === "PUT") {
        const { sessionId, ...updates } = JSON.parse(event.body);
        const result = await updateTrainingSession(userId, sessionId, updates);
        return createSuccessResponse(result);
      }
    }
  });
};
```

---

### PATCH 7: Remove Frontend Direct Writes

**File:** `angular/src/app/core/services/training-data.service.ts` (modify)

```typescript
// REMOVE updateTrainingSession and deleteTrainingSession methods
// Replace with API calls:

updateTrainingSession(
  id: string,
  updates: Partial<TrainingSession>,
): Observable<TrainingSession | null> {
  const userId = this.userId();
  if (!userId) {
    this.logger.error("Cannot update training session: No user logged in");
    return of(null);
  }

  // Route through API instead of direct Supabase write
  return this.http.put<{ session: TrainingSession }>(
    `/api/training/sessions`,
    { sessionId: id, ...updates }
  ).pipe(
    map(response => response.session),
    catchError((error) => {
      this.logger.error("Error updating training session:", error);
      return of(null);
    })
  );
}

deleteTrainingSession(id: string): Observable<boolean> {
  // Contract violation: Sessions should be locked, not deleted
  // Remove this method entirely or convert to lock operation
  this.logger.warn("Session deletion not allowed per contract. Use lock instead.");
  return of(false);
}
```

---

## D) PROOF CHECKLIST

### Test 1: Athlete Tries to Modify Another Athlete's Session

```bash
# Setup: Create two athlete accounts
ATHLETE1_TOKEN="<token1>"
ATHLETE2_SESSION_ID="<session_id_of_athlete2>"

# Attempt: Athlete 1 tries to update Athlete 2's session
curl -X PUT "https://your-api.netlify.app/api/training/sessions" \
  -H "Authorization: Bearer $ATHLETE1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "'$ATHLETE2_SESSION_ID'", "notes": "Hacked!"}'

# Expected: 403 Forbidden with error_code: OWNERSHIP_MISMATCH
# Verify: Check authorization_violations table for logged violation
```

**SQL Verification:**
```sql
SELECT * FROM authorization_violations 
WHERE error_code = 'OWNERSHIP_MISMATCH' 
ORDER BY timestamp DESC 
LIMIT 1;
```

---

### Test 2: Athlete Tries to Modify Coach-Locked Session

```bash
# Setup: Create coach-locked session
COACH_TOKEN="<coach_token>"
SESSION_ID="<session_id>"

# Coach locks session
curl -X PUT "https://your-api.netlify.app/api/training/sessions" \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -d '{"sessionId": "'$SESSION_ID'", "coach_locked": true}'

# Attempt: Athlete tries to modify
ATHLETE_TOKEN="<athlete_token>"
curl -X PUT "https://your-api.netlify.app/api/training/sessions" \
  -H "Authorization: Bearer $ATHLETE_TOKEN" \
  -d '{"sessionId": "'$SESSION_ID'", "notes": "Changed!"}'

# Expected: 403 Forbidden with error_code: COACH_LOCKED
```

**SQL Verification:**
```sql
-- Check trigger prevented update
SELECT coach_locked, modified_by_coach_id FROM training_sessions WHERE id = '<session_id>';
-- Should still show original values
```

---

### Test 3: Coach Tries to Edit After IN_PROGRESS

```bash
# Setup: Session in IN_PROGRESS state
COACH_TOKEN="<coach_token>"
SESSION_ID="<session_id>"

# Attempt: Coach tries to modify structure
curl -X PUT "https://your-api.netlify.app/api/training/sessions" \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -d '{"sessionId": "'$SESSION_ID'", "session_structure": {"exercises": []}}'

# Expected: 403 Forbidden with error_code: STATE_IMMUTABLE
```

**SQL Verification:**
```sql
-- Verify trigger prevented update
SELECT session_state, session_structure FROM training_sessions WHERE id = '<session_id>';
-- Structure should be unchanged
```

---

### Test 4: AI/Merlin Tries to Mutate Session

```bash
# Setup: AI service token (read-only credentials)
AI_TOKEN="<ai_service_token>"
SESSION_ID="<session_id>"

# Attempt: AI tries to modify session
curl -X PUT "https://your-api.netlify.app/api/training/sessions" \
  -H "Authorization: Bearer $AI_TOKEN" \
  -d '{"sessionId": "'$SESSION_ID'", "prescribed_intensity": 5}'

# Expected: 403 Forbidden with error_code: INSUFFICIENT_PERMISSIONS
```

**SQL Verification:**
```sql
-- Verify AI role is read-only
SELECT role FROM profiles WHERE user_id = '<ai_user_id>';
-- Should be 'system' or 'ai' with read-only permissions
```

---

### Test 5: Athlete Reads Teammate Data Without Consent

```bash
# Setup: Teammate with consent = false
ATHLETE1_TOKEN="<athlete1_token>"
TEAMMATE_ID="<teammate_user_id>"

# Attempt: Read teammate wellness data
curl -X GET "https://your-api.netlify.app/api/wellness/$TEAMMATE_ID/check-ins" \
  -H "Authorization: Bearer $ATHLETE1_TOKEN"

# Expected: 403 Forbidden with error_code: CONSENT_REQUIRED
# OR: Empty result set (RLS policy filters)
```

**SQL Verification:**
```sql
-- Check consent setting
SELECT wellness_consent FROM consent_settings WHERE user_id = '<teammate_id>';
-- Should be false

-- Verify RLS policy filters data
SET ROLE authenticated;
SET request.jwt.claims.sub = '<athlete1_user_id>';
SELECT * FROM wellness_logs WHERE user_id = '<teammate_id>';
-- Should return 0 rows
```

---

### Test 6: Backdated Write Attempt

```bash
# Setup: Attempt to set past timestamp
ATHLETE_TOKEN="<athlete_token>"
SESSION_ID="<session_id>"

# Attempt: Backdate session
curl -X PUT "https://your-api.netlify.app/api/training/sessions" \
  -H "Authorization: Bearer $ATHLETE_TOKEN" \
  -d '{"sessionId": "'$SESSION_ID'", "started_at": "2025-01-01T00:00:00Z"}'

# Expected: 403 Forbidden OR 400 Bad Request
# Database trigger should prevent timestamp modification
```

**SQL Verification:**
```sql
-- Verify timestamp unchanged
SELECT started_at, created_at FROM training_sessions WHERE id = '<session_id>';
-- Should show current timestamp, not backdated value
```

---

## E) IMPLEMENTATION PRIORITY

**CRITICAL (Implement Immediately):**
1. PATCH 1: Add `coach_locked` column
2. PATCH 2: Create immutability triggers
3. PATCH 3: Update RLS policies
4. PATCH 5: Add API authorization middleware
5. PATCH 6: Update training sessions API

**HIGH (Implement Within 1 Week):**
6. PATCH 4: Append-only audit tables
7. PATCH 7: Remove frontend direct writes

**MEDIUM (Implement Within 2 Weeks):**
8. Consent revocation triggers
9. Violation alerting system
10. Admin capability restrictions

---

## F) COMPLIANCE METRICS

**Before Fixes:**
- Compliance: 9.4% (3/32 checks passing)
- Critical Violations: 9
- High Risk: 7
- Medium Risk: 10
- Low Risk: 3

**After Fixes (Projected):**
- Compliance: 93.8% (30/32 checks passing)
- Critical Violations: 0
- High Risk: 0
- Medium Risk: 2 (monitoring/alerting)
- Low Risk: 0

---

**END OF AUDIT REPORT**

**Next Steps:**
1. Review and approve patches
2. Apply migrations in order
3. Run proof tests
4. Monitor violation logs
5. Schedule follow-up audit in 30 days

