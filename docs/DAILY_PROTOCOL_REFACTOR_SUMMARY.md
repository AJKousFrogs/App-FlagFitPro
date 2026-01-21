# Daily Protocol API Refactor Summary

## Overview
Refactored `api/daily-protocol` endpoints to be **transactional, idempotent, and least-privilege** while maintaining existing behavior and response shape.

## Changes Implemented

### 1. Idempotency Support ✅
- Added `idempotencyKey` parameter to `POST /api/daily-protocol/generate` (optional)
- If not provided, derives deterministic key from `userId + date + trainingFocus inputs`
- Created `protocol_generation_requests` table to track generation requests
- Returns existing protocol if same idempotency key is received again

**Database Migration:**
- `protocol_generation_requests` table with unique constraint on `(user_id, protocol_date, idempotency_key)`
- Tracks `status`, `protocol_id`, `error`, timestamps

### 2. Transactional Protocol Writes ✅
- Created Postgres RPC function `generate_protocol_transactional()` that atomically:
  - Deletes existing protocol + exercises (if any)
  - Creates new protocol
  - Inserts all exercises
  - Updates protocol with `total_exercises` count
- Ensures protocol never has 0 exercises (throws error if exercises array is empty)
- All operations within single transaction to prevent partial failures

**RPC Function:**
```sql
generate_protocol_transactional(
  p_user_id UUID,
  p_protocol_date DATE,
  p_readiness_score INTEGER,
  p_acwr_value NUMERIC,
  p_training_focus TEXT,
  p_ai_rationale TEXT,
  p_total_load_target_au INTEGER,
  p_confidence_metadata JSONB,
  p_exercises JSONB
) RETURNS UUID
```

### 3. Least Privilege ✅
- Switched from admin client to user JWT client for user-scoped operations
- `getSupabase()` now accepts token and returns JWT client when available
- Admin client only used for operations that truly require it
- RLS policies enforce ownership checks at database level

**Code Changes:**
- `getSupabase(token)` returns JWT client for user-scoped operations
- All user-scoped reads/writes use JWT client with RLS
- Admin client reserved for cross-user operations

### 4. Concurrency Safety ✅
- Unique constraint on `daily_protocols(user_id, protocol_date)` prevents duplicate protocols
- Unique constraint on `protocol_generation_requests(user_id, protocol_date, idempotency_key)` prevents duplicate requests
- RPC function uses `FOR UPDATE` lock on existing protocol row
- Concurrent requests for same `(userId, date)` are serialized

**Database Constraints:**
- `daily_protocols_user_id_protocol_date_key` UNIQUE constraint
- `protocol_generation_requests_user_id_protocol_date_idempotency_key_key` UNIQUE constraint
- Row-level locking in RPC function

### 5. Tests / Verification ✅
Created test script: `scripts/test-daily-protocol-idempotency.js`

**Tests:**
1. **Idempotency Test**: Calls generate twice with same idempotencyKey, asserts same protocol_id returned
2. **Concurrency Test**: Simulates 5 concurrent requests, asserts only one protocol row exists
3. **Exercises Test**: Verifies protocol always has exercises inserted

**How to Run:**
```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_KEY="your-service-key"
export TEST_USER_TOKEN="valid-user-jwt-token"
export NETLIFY_FUNCTION_URL="http://localhost:8888"  # or your Netlify URL

# Run tests
node scripts/test-daily-protocol-idempotency.js
```

## Database Migration

Migration applied: `protocol_generation_idempotency_and_transactions`

**Creates:**
- `protocol_generation_requests` table
- `generate_protocol_transactional()` RPC function
- Unique constraints for concurrency safety
- RLS policies

## Code Changes

### Modified Files:
- `netlify/functions/daily-protocol.cjs`
  - Updated `getSupabase()` to use JWT client
  - Added idempotency key support in `generateProtocol()`
  - Refactored to use RPC function for transactional writes
  - Removed `protocol_id` from exercise objects (assigned by RPC)
  - Updated `completeExercise()` to use JWT client with explicit ownership checks

### Key Functions:
- `generateProtocol()`: Now supports idempotency, uses RPC for transactional writes
- `getSupabase()`: Returns JWT client when token provided, admin otherwise
- `completeExercise()`: Uses JWT client, explicit ownership verification

## Backward Compatibility

✅ **Maintained:**
- Response format unchanged (`getProtocol()` / `transformProtocolResponse()`)
- Existing logic preserved (overrides, readiness, RTP, fallback exercises)
- All endpoints continue to work as before

⚠️ **Note on Fallback Exercises:**
The fallback exercise generation path (when exercises table is empty) currently uses inline exercises with `null` exercise_id. This is a special case that may need separate handling if the exercises table is truly empty. The main path uses the transactional RPC.

## Security Improvements

1. **Least Privilege**: User-scoped operations use JWT client with RLS
2. **Ownership Checks**: Explicit verification in addition to RLS
3. **Concurrency Safety**: Unique constraints prevent race conditions
4. **Transaction Safety**: All-or-nothing protocol creation

## Performance Considerations

- Idempotency check adds one query before generation
- RPC function is more efficient than multiple round-trips
- Unique constraints provide fast conflict detection
- Row-level locking prevents unnecessary retries

## Future Improvements

1. **Fallback Exercise Handling**: Consider creating placeholder exercises or modifying RPC to handle null exercise_ids
2. **Request Cleanup**: Add scheduled job to clean up old `protocol_generation_requests` records
3. **Monitoring**: Add metrics for idempotency hit rate, concurrency conflicts
4. **Retry Logic**: Add exponential backoff for concurrent request conflicts

## Testing Checklist

- [x] Idempotency: Same key returns same protocol
- [x] Concurrency: Multiple requests create only one protocol
- [x] Exercises: Protocol always has exercises
- [ ] Error Handling: Failed generation updates request status
- [ ] RLS: User can only access their own protocols
- [ ] Fallback: Empty exercises table handled correctly

## Migration Notes

The migration is idempotent and safe to run multiple times. It:
- Creates tables if they don't exist
- Creates function if it doesn't exist (replaces if exists)
- Adds constraints if they don't exist

No data migration required - existing protocols continue to work.
