# Privacy & Safety Regression Tests

**Version:** 1.0.0  
**Last Updated:** 29. December 2025  
**Purpose:** Prove consent gating, AI opt-out, and deletion workflows keep working

---

## Test Matrix

| Scenario                                      | Expected Result                          | Test File                    | Priority |
| --------------------------------------------- | ---------------------------------------- | ---------------------------- | -------- |
| **Consent Gating**                            |                                          |                              |          |
| Coach queries player data without consent     | NULL values + `consent_blocked=true`     | `consent-gating.test.js`     | CRITICAL |
| Coach queries player data with consent        | Full data visible                        | `consent-gating.test.js`     | CRITICAL |
| Player queries own data                       | Full data visible (always)               | `consent-gating.test.js`     | CRITICAL |
| Coach queries via consent-aware view          | Correct filtering applied                | `consent-gating.test.js`     | HIGH     |
| **AI Opt-Out**                                |                                          |                              |          |
| AI chat with `ai_processing_enabled=false`    | HTTP 403 + remediation message           | `ai-opt-out.test.js`         | CRITICAL |
| AI chat with `ai_processing_enabled=true`     | Normal processing                        | `ai-opt-out.test.js`         | CRITICAL |
| DB function `require_ai_consent()` fails fast | Exception with clear message             | `ai-opt-out.test.js`         | HIGH     |
| **Deletion Lifecycle**                        |                                          |                              |          |
| Deletion requested                            | Access revoked immediately               | `deletion-lifecycle.test.js` | CRITICAL |
| Deletion cancelled                            | Access restored                          | `deletion-lifecycle.test.js` | CRITICAL |
| Deletion processed                            | PII deleted, audit log records           | `deletion-lifecycle.test.js` | CRITICAL |
| Emergency records NOT deleted before 7 years  | Records preserved                        | `deletion-lifecycle.test.js` | CRITICAL |
| **Data State Contract**                       |                                          |                              |          |
| < 28 days ACWR data                           | `metricValue=null` + `INSUFFICIENT_DATA` | `data-state.test.js`         | HIGH     |
| >= 28 days ACWR data                          | `REAL_DATA` + valid values               | `data-state.test.js`         | HIGH     |
| No data at all                                | `NO_DATA` state                          | `data-state.test.js`         | HIGH     |
| **16+ Age Gating**                            |                                          |                              |          |
| User under 16 without parental consent        | Features blocked server-side             | `age-gating.test.js`         | CRITICAL |
| User under 16 with parental consent           | Features enabled                         | `age-gating.test.js`         | HIGH     |
| User 16+                                      | Full access                              | `age-gating.test.js`         | HIGH     |

---

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Ensure Supabase connection is available
# Tests use SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from environment
```

### Run All Privacy Tests

```bash
# Run all privacy/safety tests
npm run test:privacy

# Or directly with vitest
npx vitest run tests/privacy-safety/
```

### Run Individual Test Suites

```bash
# Consent gating tests
npx vitest run tests/privacy-safety/consent-gating.test.js

# AI opt-out tests
npx vitest run tests/privacy-safety/ai-opt-out.test.js

# Deletion lifecycle tests
npx vitest run tests/privacy-safety/deletion-lifecycle.test.js

# Data state contract tests
npx vitest run tests/privacy-safety/data-state.test.js
```

### Run in CI

```bash
# CI mode with coverage
npm run test:privacy:ci
```

---

## Test Environment Setup

Tests simulate JWT claims using Supabase's `SET request.jwt.claims` for RLS testing:

```sql
-- Simulate authenticated user
SET request.jwt.claims = '{"sub": "user-uuid", "role": "authenticated"}';

-- Simulate coach role
SET request.jwt.claims = '{"sub": "coach-uuid", "role": "authenticated", "user_metadata": {"role": "coach"}}';
```

---

## CI Integration

Add to your CI workflow:

```yaml
- name: Run Privacy Tests
  run: npm run test:privacy:ci
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## Release Gate Checklist

Before any release, verify:

- [ ] All privacy tests pass (`npm run test:privacy`)
- [ ] DB objects verification passes (`npm run verify:db`)
- [ ] No new Sentry errors related to consent/privacy
- [ ] Deletion queue backlog is < 100
- [ ] AI opt-out rate is stable (no sudden spikes)

---

## Test Data Management

Tests create isolated test data with predictable UUIDs:

- Test Player: `11111111-1111-1111-1111-111111111111`
- Test Coach: `22222222-2222-2222-2222-222222222222`
- Test Team: `33333333-3333-3333-3333-333333333333`

All test data is cleaned up after tests complete.

---

**Document Version:** 1.0.0
