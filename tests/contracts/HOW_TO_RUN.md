# How to Run Contract Tests

## ✅ Contract Test Suite

This directory contains contract tests that verify FE/BE/DB alignment.

### Available Test Files

| Test File | Description | Requires DB |
|-----------|-------------|-------------|
| `run-contracts-test.js` | Database schema & immutability | Yes |
| `api-response-shapes.contract.test.js` | API response shapes, enums, dates | Yes |
| `acwr-calculation.contract.test.js` | ACWR calculation formulas | No |
| `missing-data-handling.contract.test.js` | Mock data removal verification | No |
| `session-lifecycle-immutability.test.js` | Session state transitions | Yes |
| `data-consent-visibility.test.js` | Data consent views | Yes |
| `today-screen-ux.test.js` | Today screen UX contracts | Yes |

### Option 1: Run All Contract Tests

```bash
cd /Users/aljosaursakous/Desktop/Flag\ football\ HTML\ -\ APP

# Set your Supabase credentials
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key-here"

# Run all contract tests
npm run test:contracts
```

### Option 2: Run Individual Tests

```bash
# API Response Shape Tests (requires Supabase)
node tests/contracts/api-response-shapes.contract.test.js

# ACWR Calculation Tests (no Supabase required)
node tests/contracts/acwr-calculation.contract.test.js

# Database Schema Tests
node tests/contracts/run-contracts-test.js
```

### Option 3: Run ACWR Tests Only (No DB Required)

```bash
# These tests verify calculation formulas without database access
node tests/contracts/acwr-calculation.contract.test.js
```

## 🔑 Getting Your Service Role Key

**Important:** The service role key bypasses RLS and has full database access. Keep it secret!

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `pvziciccwxgftcielknm`
3. Go to **Settings** → **API**
4. Find **Project API keys**
5. Copy the **`service_role`** key (starts with `eyJ...`)

**⚠️ Never commit this key to git!**

## 📋 What the Tests Verify

### 1. Database Schema Tests (`run-contracts-test.js`)
- `state_transition_history` table exists
- `session_state` column exists
- `coach_locked` column exists
- Consent views exist

### 2. API Response Shape Tests (`api-response-shapes.contract.test.js`)
- Training session response shape matches contract
- Status enums match DB values (`planned`, `in_progress`, `completed`, etc.)
- Session state enums match contract
- RPE values are in range 1-10
- Date fields use ISO 8601 format
- Wellness metrics are in valid ranges
- Load monitoring fields are present
- User ID field naming consistency

### 3. ACWR Calculation Tests (`acwr-calculation.contract.test.js`)
- Load calculation: `Load = RPE × Duration`
- EWMA formula: `EWMA = λ × load + (1 - λ) × EWMA_prev`
- Lambda values: acute=0.25, chronic=0.069
- Risk zone thresholds: 0.8/1.3/1.5
- Minimum chronic load floor (100)
- Configuration constants match contract

### 4. Missing Data Handling Tests (`missing-data-handling.contract.test.js`)
- Wellness form fields default to null (no pre-filled values)
- Training RPE is null when not provided (not defaulted to 5)
- ACWR returns 0 ratio when data is insufficient
- Database triggers preserve NULL values (no COALESCE with numeric defaults)
- Edge functions return empty arrays on error (no mock data)
- AI suggestions don't fall back to hardcoded suggestions
- Weather service returns error state, not fake "excellent" weather

### 5. Immutability Tests
- UPDATE on `state_transition_history` is blocked
- DELETE on `state_transition_history` is blocked

## 🎯 Expected Output

```
🧪 Contract Compliance Tests
==================================================
Supabase URL: https://pvziciccwxgftcielknm.supabase.co
Service Key: eyJhbGciOiJIUzI1NiI...

📋 Database Schema Verification
──────────────────────────────────────────────────
✅ state_transition_history table exists
✅ session_state column exists in training_sessions
✅ coach_locked column exists in training_sessions

📋 Consent Views Verification
──────────────────────────────────────────────────
✅ v_readiness_scores_consent view exists
✅ v_wellness_entries_consent view exists
✅ v_injury_tracking_consent view exists

📋 Immutability Enforcement
──────────────────────────────────────────────────
✅ state_transition_history blocks UPDATE

==================================================
📊 Test Results
==================================================
Total: 7
✅ Passed: 7
❌ Failed: 0

🎉 All tests passed!
```

## 🐛 Troubleshooting

### Error: SUPABASE_SERVICE_KEY not set

Make sure you've exported the environment variable:
```bash
export SUPABASE_SERVICE_KEY="your-key-here"
```

### Error: Table does not exist

The migrations haven't been applied. They were applied via Supabase MCP, but if you're testing against a different database, you'll need to run migrations there.

### Error: Permission denied

Make sure you're using the **service_role** key, not the **anon** key. The service role key bypasses RLS.

## 📝 Full Jest Tests (Optional)

If you want to run the full Jest test suite (more comprehensive), you'll need to:

1. Install Jest:
```bash
npm install --save-dev jest @jest/globals
```

2. Add to `package.json`:
```json
"test:contracts:jest": "jest tests/contracts/"
```

3. Run:
```bash
export SUPABASE_URL="..."
export SUPABASE_SERVICE_KEY="..."
npm run test:contracts:jest
```

## ✅ Current Status

- ✅ Database schema test runner (`run-contracts-test.js`)
- ✅ API response shape tests (`api-response-shapes.contract.test.js`)
- ✅ ACWR calculation tests (`acwr-calculation.contract.test.js`)
- ✅ NPM script added (`npm run test:contracts`)
- ✅ Tests verify database schema, response shapes, enums, and calculations

---

## 📚 Related Documentation

- **Contract Map**: `docs/contracts/CONTRACT_MAP.md` - Full FE/BE/DB alignment documentation
- **Findings**: P0/P1/P2 issues documented in Contract Map
- **ACWR Formulas**: Detailed in Contract Map Section "ACWR Calculation Details"

---

**Next Step:** Export your `SUPABASE_SERVICE_KEY` and run `npm run test:contracts`
