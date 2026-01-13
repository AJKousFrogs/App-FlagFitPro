# PROOF: Database Enforcement — AUTHORIZATION_AND_GUARDRAILS_CONTRACT_v1

**Date:** 2026-01-06  
**Status:** VERIFICATION REQUIRED  
**Instructions:** Run these SQL queries in Supabase SQL Editor after applying migrations

---

## MIGRATION ORDER

Applied in this order:
1. ✅ `20260106_add_coach_locked_enforcement.sql`
2. ✅ `20260106_add_immutability_triggers.sql`
3. ✅ `20260106_append_only_audit_tables.sql`
4. ✅ `20260106_update_rls_policies.sql`

---

## VERIFICATION QUERIES

### 1. Column Existence Check

```sql
-- Verify coach_locked and related columns exist
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'training_sessions' 
  AND column_name IN (
    'coach_locked', 
    'modified_by_coach_id', 
    'modified_at', 
    'session_state'
  )
ORDER BY column_name;
```

**Expected Result:**
- `coach_locked` (boolean, default false, NOT NULL)
- `modified_by_coach_id` (uuid, nullable)
- `modified_at` (timestamptz, nullable)
- `session_state` (text, default 'PLANNED')

---

### 2. Index Existence Check

```sql
-- Verify indexes exist
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'training_sessions'
  AND indexname LIKE '%coach_locked%' 
     OR indexname LIKE '%session_state%'
     OR indexname LIKE '%modified_by_coach%'
ORDER BY indexname;
```

**Expected Result:**
- `idx_training_sessions_coach_locked`
- `idx_training_sessions_session_state`
- `idx_training_sessions_modified_by_coach`

---

### 3. Trigger Existence Check

```sql
-- Verify triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'training_sessions'
  AND trigger_name LIKE '%modification%'
ORDER BY trigger_name;
```

**Expected Result:**
- `prevent_in_progress_modification_trigger` (BEFORE UPDATE)
- `prevent_coach_locked_modification_trigger` (BEFORE UPDATE)
- `prevent_timestamp_modification_trigger` (BEFORE UPDATE)

---

### 4. Trigger Function Definitions

```sql
-- Verify trigger functions exist and are correct
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'prevent_in_progress_modification',
    'prevent_coach_locked_modification',
    'prevent_timestamp_modification'
  )
ORDER BY p.proname;
```

**Expected Result:**
- Three functions with SECURITY DEFINER
- Functions raise EXCEPTION on violations
- Functions check session_state and coach_locked

---

### 5. RLS Policies Check

```sql
-- Verify RLS policies for training_sessions
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'training_sessions'
ORDER BY policyname;
```

**Expected Result:**
- `Users can update own training sessions` (UPDATE) - checks coach_locked and session_state
- `Coaches can modify team training sessions` (UPDATE) - checks coach_locked and role
- `Athletes can log execution data` (UPDATE) - allows execution logging only

---

### 6. Audit Table Existence

```sql
-- Verify authorization_violations table exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'authorization_violations'
ORDER BY ordinal_position;
```

**Expected Result:**
- `violation_id` (uuid, PRIMARY KEY)
- `user_id` (uuid, NOT NULL)
- `resource_id` (uuid, nullable)
- `resource_type` (text, NOT NULL)
- `action` (text, NOT NULL)
- `error_code` (text, NOT NULL)
- `error_message` (text, NOT NULL)
- `timestamp` (timestamptz, NOT NULL, DEFAULT NOW())
- Plus other audit fields

---

### 7. Audit Table RLS Policy

```sql
-- Verify append-only policy on authorization_violations
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'authorization_violations';
```

**Expected Result:**
- `Append-only authorization violations` policy
- `USING (false)` - no reads via RLS
- `WITH CHECK (true)` - allows inserts

---

### 8. Audit Table Permissions

```sql
-- Verify grants on authorization_violations
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'authorization_violations'
ORDER BY grantee, privilege_type;
```

**Expected Result:**
- `authenticated` role has INSERT privilege
- `service_role` role has SELECT privilege

---

### 9. Append-Only Tables Check

```sql
-- Check if append-only tables have policies
SELECT 
  t.tablename,
  p.policyname,
  p.cmd,
  p.qual,
  p.with_check
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN ('execution_logs', 'readiness_logs', 'pain_reports')
ORDER BY t.tablename, p.policyname;
```

**Expected Result:**
- If tables exist, they should have append-only policies
- `USING (false)` for reads
- `WITH CHECK (true)` for inserts

---

### 10. Constraint Check

```sql
-- Verify session_state constraint exists
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'training_sessions'::regclass
  AND conname LIKE '%session_state%';
```

**Expected Result:**
- `check_session_state` constraint
- Checks that session_state is in allowed values list

---

## TEST TRIGGERS (Manual Verification)

### Test 1: Prevent IN_PROGRESS Modification

```sql
-- Create test session
INSERT INTO training_sessions (user_id, session_state, session_date)
VALUES (auth.uid(), 'IN_PROGRESS', CURRENT_DATE)
RETURNING id;

-- Try to modify structure (should fail)
UPDATE training_sessions
SET duration_minutes = 999
WHERE id = '<session_id_from_above>';

-- Expected: ERROR: Cannot modify session structure: session is IN_PROGRESS
```

### Test 2: Prevent Coach-Locked Modification

```sql
-- Create coach-locked session
INSERT INTO training_sessions (user_id, coach_locked, modified_by_coach_id, session_date)
VALUES (auth.uid(), true, '<coach_user_id>', CURRENT_DATE)
RETURNING id;

-- Try to modify as different user (should fail)
UPDATE training_sessions
SET notes = 'Hacked!'
WHERE id = '<session_id_from_above>';

-- Expected: ERROR: Cannot modify coach_locked session: locked by coach <coach_user_id>
```

### Test 3: Prevent Timestamp Modification

```sql
-- Create session with started_at
INSERT INTO training_sessions (user_id, started_at, session_date)
VALUES (auth.uid(), NOW(), CURRENT_DATE)
RETURNING id;

-- Try to modify started_at (should fail)
UPDATE training_sessions
SET started_at = NOW() - INTERVAL '1 day'
WHERE id = '<session_id_from_above>';

-- Expected: ERROR: Cannot modify started_at: field is immutable once set
```

---

## VERIFICATION CHECKLIST

- [ ] All columns exist with correct types
- [ ] All indexes created
- [ ] All triggers exist and fire correctly
- [ ] RLS policies enforce coach_locked and session_state
- [ ] Audit table exists and is append-only
- [ ] Permissions granted correctly
- [ ] Triggers prevent violations at DB layer

---

**END OF PROOF DOCUMENT**

**Next:** After verification, proceed to API guard integration (Phase 2)

