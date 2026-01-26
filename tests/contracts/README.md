# Contract Compliance Tests

This directory contains automated tests that verify codebase compliance against binding contracts.

## Contracts Tested

1. **Session Lifecycle & Immutability** (`session-lifecycle-immutability.test.js`)
   - Authority leaks (AI/athlete cannot modify coach-locked sessions)
   - Immutability enforcement (no writes after IN_PROGRESS/COMPLETED/LOCKED)
   - Coach attribution enforcement
   - State transition validation

2. **Data Consent & Visibility** (`data-consent-visibility.test.js`)
   - Consent filtering on coach reads
   - Safety override triggers
   - Default visibility rules
   - Merlin privacy rules

3. **TODAY Screen UX Authority** (`today-screen-ux.test.js`)
   - Information priority order
   - Acknowledgment blocking
   - Wellness check-in authority rules
   - 5-second comprehension requirement

## Running Tests

### Prerequisites

1. Test database set up (Supabase local or test instance)
2. Environment variables configured:
   ```bash
   SUPABASE_URL=http://localhost:54321
   SUPABASE_SERVICE_KEY=your-test-service-key
   ```

### Run All Contract Tests

```bash
npm test -- tests/contracts/
```

### Run Specific Contract Tests

```bash
# Session lifecycle tests
npm test -- tests/contracts/session-lifecycle-immutability.test.js

# Consent tests
npm test -- tests/contracts/data-consent-visibility.test.js

# TODAY screen tests
npm test -- tests/contracts/today-screen-ux.test.js
```

## Test Structure

Each test file follows this structure:

```javascript
describe("Contract: [Contract Name]", () => {
  describe("Authority Tests", () => {
    // Tests for authority enforcement
  });

  describe("Immutability Tests", () => {
    // Tests for immutability rules
  });

  // ... other test groups
});
```

## Adding New Tests

When adding new contract tests:

1. **Reference the contract section** in test comments
2. **Use descriptive test names** that match contract clauses
3. **Test both positive and negative cases** (should allow, should reject)
4. **Clean up test data** in `afterAll` hooks

Example:

```javascript
/**
 * Test: [Contract Clause Description]
 * Contract: STEP_2_6 §2.3 Ban 1
 */
it("should prevent [forbidden action]", async () => {
  // Setup
  // Action
  // Assert
});
```

## Test Data

Tests use mock/test data:

- Test user IDs: `test-coach-id`, `test-athlete-id`
- Test sessions created in `beforeAll`
- Cleanup in `afterAll`

**Note:** Adjust test data setup based on your test fixtures.

## Continuous Integration

These tests should run in CI/CD:

1. **On every PR** - Verify no contract violations introduced
2. **Before merge** - Block if critical tests fail
3. **Nightly** - Full test suite against staging

## Compliance Matrix

Test results feed into the compliance matrix:

- `docs/contracts/CONTRACT_COMPLIANCE_AUDIT_MATRIX_v1.md`

Update the matrix when:

- Tests pass/fail
- New tests added
- Contract violations fixed

## Troubleshooting

### Tests Fail: Database Connection

**Issue:** Cannot connect to test database  
**Fix:** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set

### Tests Fail: Missing Tables

**Issue:** Tables don't exist in test database  
**Fix:** Run migrations on test database:

```bash
supabase db reset --db-url $TEST_DATABASE_URL
```

### Tests Fail: RLS Policies

**Issue:** RLS policies blocking test operations  
**Fix:** Use service role key for tests (bypasses RLS)

## Related Documentation

- [Contract Compliance Audit Matrix](../../docs/contracts/CONTRACT_COMPLIANCE_AUDIT_MATRIX_v1.md)
- [Contract Audit Summary](../../docs/contracts/CONTRACT_AUDIT_SUMMARY_v1.md)
- [Session Lifecycle Contract](../../docs/contracts/STEP_2_6_SESSION_LIFECYCLE_IMMUTABILITY_CONTRACT_V1.md)
- [Data Consent Contract](../../docs/contracts/STEP_2_5_DATA_CONSENT_VISIBILITY_CONTRACT_V1.md)
- [TODAY Screen Contract](../../docs/contracts/STEP_2_1_TODAY_SCREEN_UX_AUTHORITY_CONTRACT_V1.md)
