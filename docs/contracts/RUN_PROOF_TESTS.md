# Running Proof Tests

**Date:** 2026-01-06  
**Status:** ✅ Database Verification Complete

---

## Quick Start

### Database Proof Tests (Automated)

All database-level proof tests have been run and verified:

```bash
# Results are in PROOF_TEST_RESULTS_v1.md
# All critical checks PASSED ✅
```

**Verified:**
- ✅ Merlin readonly role has 0 write privileges
- ✅ Consent function queries current state (no cache)
- ✅ Safety override table structure correct
- ✅ RLS enabled on all wellness tables

---

## Manual Tests (Require Test Data)

### 1. Consent Read-Time Test

**Requires:** Test athlete and coach user IDs

```bash
# Set test user IDs
export ATHLETE_ID="<athlete-uuid>"
export COACH_ID="<coach-uuid>"

# Run test
psql $DATABASE_URL \
  -v athlete_id="'$ATHLETE_ID'" \
  -v coach_id="'$COACH_ID'" \
  -f docs/contracts/PROOF_CONSENT_READ_TIME.sql
```

**Expected Results:**
- Coach reads readiness → DENIED (no consent)
- Athlete grants consent → Coach reads ALLOWED
- Athlete revokes consent → Coach reads DENIED immediately

---

### 2. Safety Override Bypass Test

**Requires:** Test athlete and coach user IDs

```bash
# Set test user IDs
export ATHLETE_ID="<athlete-uuid>"
export COACH_ID="<coach-uuid>"

# Run test
psql $DATABASE_URL \
  -v athlete_id="'$ATHLETE_ID'" \
  -v coach_id="'$COACH_ID'" \
  -f docs/contracts/PROOF_SAFETY_OVERRIDE_BYPASS.sql
```

**Expected Results:**
- Consent OFF + Pain >3/10 → Coach visibility ALLOWED (override)
- Consent OFF + No trigger → Coach CANNOT read content
- ACWR danger zone → Override active

---

### 3. API Exploit Test

**Requires:** Merlin readonly key and API endpoint

```bash
# Set environment variables
export MERLIN_READONLY_KEY="<merlin-readonly-key-from-supabase>"
export API_BASE_URL="https://your-api.netlify.app"

# Run exploit test
./docs/contracts/EXPLOIT_TEST_MERLIN_WRITE.sh
```

**Expected Results:**
- All mutation endpoints return 403 FORBIDDEN
- No database writes occur
- Violations logged to `merlin_violation_log`

---

## Database Verification Results

### ✅ All Automated Checks Passed

**Merlin Hard Guard:**
- Database role: ✅ 0 write privileges
- Violation log: ✅ Append-only enforced
- Function privileges: ✅ Only read-only functions

**Consent Enforcement:**
- Function implementation: ✅ Queries current state
- RLS policies: ✅ Check consent OR override

**Safety Override:**
- Table structure: ✅ Correct schema
- Visibility columns: ✅ Uses `disclosed_to_roles` array

**RLS Status:**
- All wellness tables: ✅ RLS enabled

---

## Next Steps

1. ✅ Database verification - COMPLETE
2. ⚠️ Manual consent test - Requires test users
3. ⚠️ Manual safety override test - Requires test users
4. ⚠️ API exploit test - Requires API keys and endpoint

---

**Status:** ✅ DATABASE VERIFICATION COMPLETE

**END OF GUIDE**

