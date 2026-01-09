# Route Audit Test Suite

Complete testing infrastructure for validating API routes, security, performance, and database indexes.

---

## 📋 Overview

This test suite provides comprehensive validation for:

1. **CRUD Operations** - Create, Read, Update, Delete functionality
2. **Input Validation** - Boundary testing, type validation, sanitization
3. **Error Handling** - 400, 401, 403, 404, 429, 500, 503 responses
4. **Rate Limiting** - Per-route limits and enforcement
5. **Security** - SQL injection, XSS, authorization bypass
6. **Database Performance** - Index validation, concurrent operations
7. **Logging** - Request/response tracking

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
node >= 20.0.0
npm >= 10.0.0
curl

# Optional
jq  # For JSON parsing
```

### Environment Setup

Create `.env` file:

```bash
# API Configuration
API_BASE_URL=http://localhost:3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Test User Credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123

# Environment
NODE_ENV=development
```

### Run All Tests

```bash
# Master test runner (runs everything)
./scripts/run-route-audit.sh

# Or individual test suites
npm test -- tests/integration/route-audit-comprehensive.test.js
./scripts/security-scan.sh
```

---

## 📦 Test Files

### 1. Comprehensive Test Suite

**File**: `tests/integration/route-audit-comprehensive.test.js`

**Coverage**:

- ✅ CRUD operations on all routes
- ✅ Input validation (UUID, RPE, duration, dates)
- ✅ Error handling (all HTTP status codes)
- ✅ Rate limiting (READ, CREATE, AUTH)
- ✅ Security (SQL injection, XSS, authorization)
- ✅ Performance (concurrent operations, query speed)

**Run**:

```bash
npm test -- tests/integration/route-audit-comprehensive.test.js
```

**Expected Output**:

```
✅ CRUD Operations: 9 tests
✅ Input Validation: 15 tests
✅ Error Handling: 8 tests
✅ Rate Limiting: 4 tests
✅ Security: 10 tests
✅ Performance: 3 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 49 tests | Pass: 47 | Fail: 0 | Warnings: 2
```

### 2. Security Scan Script

**File**: `scripts/security-scan.sh`

**Tests**:

- SQL injection payloads
- XSS attempts
- Authorization bypass
- Over-fetching detection
- Request size limits
- Security headers
- Input validation boundaries

**Run**:

```bash
./scripts/security-scan.sh
```

**Output**: `security-scan-report-YYYYMMDD-HHMMSS.txt`

### 3. Database Index Validation

**File**: `database/validate_indexes.sql`

**Checks**:

- Critical indexes exist (`workout_logs`, `training_sessions`)
- Index usage statistics
- Missing indexes detection
- Sequential scan analysis
- Concurrent insert performance

**Run** (in Supabase SQL Editor):

```sql
-- Paste contents of validate_indexes.sql
-- Or use CLI:
supabase db execute < database/validate_indexes.sql
```

### 4. Master Test Runner

**File**: `scripts/run-route-audit.sh`

**Runs**:

1. Prerequisites check
2. Server connectivity check
3. Unit & integration tests
4. Security scan
5. Index validation prompt
6. Rate limiting tests
7. CRUD smoke tests
8. Report generation

**Run**:

```bash
./scripts/run-route-audit.sh
```

---

## 🔍 Test Categories

### CRUD Operations

Tests all Create, Read, Update, Delete endpoints:

```javascript
// Example test
test("should create a training session with valid data", async () => {
  const response = await request(API_BASE_URL)
    .post("/api/training/session")
    .set("Authorization", `Bearer ${authToken}`)
    .send({
      session_type: "agility",
      duration_minutes: 60,
      rpe: 7,
    });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

**Routes Tested**:

- `/api/training/*` - 9 endpoints
- `/api/analytics/*` - 4 endpoints
- `/api/wellness/*` - 9 endpoints

### Input Validation

Boundary testing for all input parameters:

```javascript
// RPE validation: 1-10 range
const validRPE = [1, 5, 10];
const invalidRPE = [0, -1, 11, 100, "abc"];

// Duration validation: positive integers
const validDurations = [1, 30, 60, 120];
const invalidDurations = [0, -1, -100, "abc"];
```

**Validations Tested**:

- UUID format
- Numeric ranges (RPE, duration, weeks)
- Date formats and boundaries
- String lengths
- Enum values (period, training_type)

### Error Handling

Validates standardized error responses:

```javascript
{
  "success": false,
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "timestamp": "2026-01-09T...",
  "details": "Additional info (dev only)"
}
```

**Status Codes Tested**:

- 400 - Bad Request (invalid input)
- 401 - Unauthorized (missing/invalid token)
- 403 - Forbidden (insufficient permissions)
- 404 - Not Found (missing resource)
- 429 - Too Many Requests (rate limited)
- 500 - Internal Server Error
- 503 - Service Unavailable

### Rate Limiting

Tests enforcement of per-route limits:

```javascript
// Rate limits
READ: 100 requests/minute
CREATE: 30 requests/minute
AUTH: 10 requests/minute
```

**Tests**:

- Normal usage (under limit)
- Exceed limit (get 429)
- Rate limit headers present
- Reset after window expires

### Security

Comprehensive security testing:

```javascript
// SQL Injection payloads
"'; DROP TABLE workout_logs--";
"1' OR '1'='1";
"1 UNION SELECT * FROM users--";

// XSS payloads
"<script>alert('xss')</script>";
"<img src=x onerror=alert('xss')>";
```

**Tests**:

- SQL injection prevention
- XSS sanitization
- Authorization checks
- CSRF protection
- Request size limits
- Security headers

### Database Performance

Tests query performance and concurrent operations:

```javascript
test("should handle concurrent writes", async () => {
  const requests = Array(10)
    .fill(null)
    .map(() =>
      request(API_BASE_URL)
        .post("/api/training/complete")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ rpe: 5, duration: 60 }),
    );

  const responses = await Promise.all(requests);
  // All should succeed without deadlocks
});
```

**Tests**:

- Query response time (< 1s)
- Concurrent reads (20 simultaneous)
- Concurrent writes (10 simultaneous)
- Index usage verification

---

## 📊 Running Individual Tests

### Test Specific Route

```bash
# Training routes only
npm test -- tests/integration/route-audit-comprehensive.test.js -t "Training"

# Analytics routes only
npm test -- tests/integration/route-audit-comprehensive.test.js -t "Analytics"

# Wellness routes only
npm test -- tests/integration/route-audit-comprehensive.test.js -t "Wellness"
```

### Test Specific Category

```bash
# CRUD operations only
npm test -- tests/integration/route-audit-comprehensive.test.js -t "CRUD"

# Input validation only
npm test -- tests/integration/route-audit-comprehensive.test.js -t "Input Validation"

# Security tests only
npm test -- tests/integration/route-audit-comprehensive.test.js -t "Security"
```

### Run with Coverage

```bash
npm test -- tests/integration/route-audit-comprehensive.test.js --coverage
```

---

## 🐛 Debugging Failed Tests

### Enable Verbose Logging

```bash
# Set log level
export LOG_LEVEL=debug

# Enable body logging
export LOG_BODIES=true

# Run tests
npm test
```

### Check Server Logs

```bash
# In separate terminal
tail -f server.log
```

### Test Single Endpoint

```bash
# Manual curl test
curl -v http://localhost:3001/api/training/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 Configuration

### Test Configuration

Edit `tests/integration/route-audit-comprehensive.test.js`:

```javascript
// API configuration
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "testpassword123";
```

### Security Scan Configuration

Edit `scripts/security-scan.sh`:

```bash
# API Base URL
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"

# Test credentials
TEST_USER_EMAIL="${TEST_USER_EMAIL:-test@example.com}"
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-testpassword123}"

# Report file
REPORT_FILE="security-scan-report-$(date +%Y%m%d-%H%M%S).txt"
```

### Database Validation Configuration

Edit `database/validate_indexes.sql` to add/remove tables:

```sql
WHERE tablename IN (
  'workout_logs',
  'training_sessions',
  'analytics_events',
  -- Add more tables here
)
```

---

## 📈 Interpreting Results

### Test Pass Criteria

✅ **Passing Test**: All assertions pass, no errors
⚠️ **Warning**: Test passes but has recommendations
❌ **Failing Test**: Assertion fails or error thrown

### Security Scan Report

```
Pass Rate: 95%
✅ 45 tests passed
❌ 2 tests failed
⚠️ 5 warnings

FAILED TESTS:
- SQL Injection: Exposed error message (payload: '; DROP TABLE)
- XSS: Unescaped script tag in response

WARNINGS:
- Missing X-Frame-Options header
- Invalid RPE accepted without validation
- Large payload accepted (2MB)
```

### Index Validation Report

```
✅ workout_logs: 4 indexes, all used
✅ training_sessions: 3 indexes, all used
⚠️ analytics_events: 5 indexes, 2 unused
⚠️ Missing composite index: (status, session_date)
```

---

## 🛠️ Troubleshooting

### Issue: Tests Fail with 401 Unauthorized

**Solution**: Check authentication credentials

```bash
# Verify test user exists
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'

# Create test user if needed (in Supabase dashboard)
```

### Issue: Tests Fail with 503 Service Unavailable

**Solution**: Check database connection

```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/

# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

### Issue: Rate Limit Tests Always Fail

**Solution**: Reset rate limiter or adjust timeouts

```bash
# Restart server to reset in-memory rate limiter
npm run dev

# Or wait 60 seconds for rate limit window to reset
sleep 60
npm test
```

### Issue: Slow Test Execution

**Solution**: Run tests in parallel or skip slow tests

```bash
# Skip rate limit tests (they take 30+ seconds)
npm test -- --testPathIgnorePatterns="rate-limit"

# Run only fast tests
npm test -- --testNamePattern="^(?!.*rate limit).*$"
```

---

## 📝 Adding New Tests

### Add New Route Test

```javascript
describe("New Route", () => {
  test("should handle new endpoint", async () => {
    const response = await request(API_BASE_URL)
      .get("/api/new-route")
      .set("Authorization", `Bearer ${authToken}`);

    expectStandardSuccess(response);
    expect(response.body.data).toHaveProperty("newField");
  });
});
```

### Add New Security Test

```javascript
test("should prevent new vulnerability", async () => {
  const payload = "malicious-input";
  const response = await request(API_BASE_URL)
    .post("/api/endpoint")
    .set("Authorization", `Bearer ${authToken}`)
    .send({ field: payload });

  // Verify payload is sanitized
  expect(response.body.data.field).not.toContain(payload);
});
```

---

## 📚 References

- [Validation Report](../docs/ROUTE_AUDIT_VALIDATION.md) - Full audit findings
- [Testing Guide](../docs/TESTING_GUIDE.md) - General testing guide
- [Security Best Practices](../docs/THREAT_MODEL.md) - Security documentation

---

## ✅ Checklist

Before deploying to production:

- [ ] All tests pass (0 failures)
- [ ] Security scan passes (0 critical issues)
- [ ] Database indexes validated
- [ ] Rate limiting verified
- [ ] Error handling consistent
- [ ] Logging enabled and reviewed
- [ ] Performance benchmarks met (< 1s response time)
- [ ] Concurrent load tested (10+ users)

---

**Last Updated**: January 9, 2026  
**Status**: ✅ Complete
