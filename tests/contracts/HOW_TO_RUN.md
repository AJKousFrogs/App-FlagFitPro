# How to Run Contract Tests

## ✅ I Can Run Tests For You!

I've created a simple test runner that doesn't require Jest. Here's how to run it:

### Option 1: Run with Environment Variables (Recommended)

```bash
cd /Users/aljosakous/Documents/GitHub/app-new-flag

# Set your Supabase credentials
export SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key-here"

# Run tests
npm run test:contracts
```

### Option 2: Run Directly

```bash
cd /Users/aljosakous/Documents/GitHub/app-new-flag

export SUPABASE_URL="https://pvziciccwxgftcielknm.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key-here"

node tests/contracts/run-contracts-test.js
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

The test runner checks:

1. ✅ **Database Schema**
   - `state_transition_history` table exists
   - `session_state` column exists
   - `coach_locked` column exists

2. ✅ **Consent Views**
   - `v_readiness_scores_consent` view exists
   - `v_wellness_entries_consent` view exists
   - `v_injury_tracking_consent` view exists

3. ✅ **Immutability**
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

- ✅ Simple test runner created (`run-contracts-test.js`)
- ✅ NPM script added (`npm run test:contracts`)
- ✅ Tests verify database schema and immutability
- ⏭️ **Ready to run** - Just need your service role key!

---

**Next Step:** Export your `SUPABASE_SERVICE_KEY` and run `npm run test:contracts`
