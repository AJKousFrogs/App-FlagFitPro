# Enforcement Verification Checklist

**Date:** 2026-01-06  
**Purpose:** Step-by-step verification of all implemented enforcement

---

## PRE-DEPLOYMENT CHECKLIST

### Database Migrations Applied
- [ ] `20260106_consent_enforcement.sql` applied
- [ ] `20260106_wellness_privacy_rls.sql` applied
- [ ] `20260106_safety_override_system.sql` applied
- [ ] `20260106_merlin_readonly_role.sql` applied
- [ ] `20260106_complete_privacy_rls.sql` applied
- [ ] `20260106_session_versioning.sql` applied
- [ ] `20260106_append_only_execution_logs.sql` applied

### API Middleware Deployed
- [ ] `consent-guard.cjs` deployed to Netlify functions
- [ ] `safety-override.cjs` deployed to Netlify functions
- [ ] `merlin-guard.cjs` deployed to Netlify functions
- [ ] API endpoints updated to use guards

### Environment Variables Set
- [ ] `MERLIN_READONLY_KEY` configured (read-only Supabase key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `SUPABASE_URL` configured

---

## VERIFICATION TESTS

### Test 1: Consent Enforcement

**Step 1:** Create athlete without consent
```sql
INSERT INTO athlete_consent_settings (athlete_id)
VALUES ('<athlete_id>')
ON CONFLICT DO NOTHING;
```

**Step 2:** Coach tries to read readiness
```sql
SET ROLE authenticated;
SET request.jwt.claim.sub = '<coach_id>';

SELECT score FROM readiness_scores WHERE athlete_id = '<athlete_id>';
-- Expected: RLS allows SELECT, but API returns NULL for score
```

**Step 3:** Athlete grants consent
```sql
UPDATE athlete_consent_settings
SET share_readiness_with_coach = true
WHERE athlete_id = '<athlete_id>';
```

**Step 4:** Coach reads readiness again
```sql
SELECT score FROM readiness_scores WHERE athlete_id = '<athlete_id>';
-- Expected: Returns actual score
```

**Result:** ✅ PASS / ❌ FAIL

---

### Test 2: Safety Override

**Step 1:** Athlete reports pain >3/10
```sql
SELECT detect_pain_trigger('<athlete_id>', 7, 'knee', 'worse');
-- Expected: Returns override_id
```

**Step 2:** Check override log
```sql
SELECT * FROM safety_override_log
WHERE athlete_id = '<athlete_id>'
ORDER BY override_timestamp DESC
LIMIT 1;
-- Expected: Row with trigger_type = 'worsening_pain'
```

**Step 3:** Coach reads wellness (without consent)
```sql
-- Should bypass consent due to safety override
SELECT * FROM wellness_entries
WHERE athlete_id = '<athlete_id>'
AND has_active_safety_override(athlete_id, 'pain') = true;
-- Expected: Returns data despite no consent
```

**Result:** ✅ PASS / ❌ FAIL

---

### Test 3: Merlin Write Prevention

**Step 1:** Attempt write with Merlin credentials
```bash
curl -X PUT https://api.example.com/api/training-sessions/123 \
  -H "X-API-Key: merlin_readonly_key" \
  -H "User-Agent: Merlin-AI/1.0" \
  -d '{"duration_minutes": 60}'
-- Expected: 403 { error: 'MERLIN_WRITE_FORBIDDEN' }
```

**Step 2:** Check violation log
```sql
SELECT * FROM merlin_violation_log
WHERE violation_type = 'MUTATION_ATTEMPT'
ORDER BY timestamp DESC
LIMIT 1;
-- Expected: Violation logged
```

**Step 3:** Verify database role
```sql
SET ROLE merlin_readonly;
UPDATE training_sessions SET duration_minutes = 60 WHERE id = '<session_id>';
-- Expected: ERROR: permission denied
```

**Result:** ✅ PASS / ❌ FAIL

---

### Test 4: Session Versioning

**Step 1:** Modify session structure
```sql
UPDATE training_sessions
SET prescribed_duration = 90
WHERE id = '<session_id>';
```

**Step 2:** Check version created
```sql
SELECT version_number, session_structure
FROM session_version_history
WHERE session_id = '<session_id>'
ORDER BY version_number DESC
LIMIT 1;
-- Expected: New version with updated duration
```

**Step 3:** Log execution with version
```sql
INSERT INTO execution_logs (
    session_id, session_version, athlete_id, exercise_name, rpe
) VALUES (
    '<session_id>', 2, '<athlete_id>', 'Squats', 7
);
```

**Step 4:** Reconstruct timeline
```sql
SELECT 
    svh.version_number,
    svh.modified_at,
    el.logged_at,
    el.exercise_name
FROM session_version_history svh
LEFT JOIN execution_logs el ON (
    el.session_id = svh.session_id
    AND el.session_version = svh.version_number
)
WHERE svh.session_id = '<session_id>'
ORDER BY svh.version_number;
-- Expected: Shows version executed
```

**Result:** ✅ PASS / ❌ FAIL

---

### Test 5: Append-Only Execution Logs

**Step 1:** Insert execution log
```sql
INSERT INTO execution_logs (
    session_id, session_version, athlete_id, exercise_name, rpe
) VALUES (
    '<session_id>', 1, '<athlete_id>', 'Bench Press', 6
) RETURNING log_id;
```

**Step 2:** Attempt UPDATE
```sql
UPDATE execution_logs
SET rpe = 8
WHERE log_id = '<log_id_from_step_1>';
-- Expected: ERROR: Execution logs are append-only
```

**Step 3:** Attempt DELETE
```sql
DELETE FROM execution_logs WHERE log_id = '<log_id_from_step_1>';
-- Expected: ERROR: Execution logs are append-only
```

**Result:** ✅ PASS / ❌ FAIL

---

## FINAL VERIFICATION

**All Tests Pass:** ✅ YES / ❌ NO

**Enforcement Status:**
- Consent Enforcement: ✅ / ❌
- Safety Override: ✅ / ❌
- Merlin Guards: ✅ / ❌
- Privacy RLS: ✅ / ❌
- Session Versioning: ✅ / ❌
- Append-Only Logs: ✅ / ❌

**Contract Compliance:** ✅ VERIFIED / ❌ VIOLATIONS FOUND

---

**END OF CHECKLIST**

