# Quick Fix Guide: Measurement & Nutrition Logging

## Problem
Users cannot:
- ❌ Log physical measurements (weight, body fat, etc.)
- ❌ Save nutrition logs (food intake)

## Root Cause
1. `physical_measurements` table has wrong structure or doesn't exist
2. `nutrition_logs` has RLS enabled but no INSERT policies

## Solution (3 Steps)

### Step 1: Apply Migrations

```bash
cd "/Users/aljosaursakous/Desktop/Flag football HTML - APP"

# Apply all 3 migrations to Supabase
npx supabase db push
```

The migrations will:
1. ✅ Create/fix `physical_measurements` table with all body composition columns
2. ✅ Add RLS policies so users can insert/view their own data
3. ✅ Ensure `nutrition_logs` and `nutrition_goals` tables exist
4. ✅ Add RLS policies for nutrition tables

### Step 2: Verify in Supabase Dashboard

Go to: https://pvziciccwxgftcielknm.supabase.co/project/_/database/tables

Check these tables exist:
- [ ] `physical_measurements` (UUID id, UUID user_id, weight, body_fat, etc.)
- [ ] `nutrition_logs` (UUID id, UUID user_id, food_name, calories, etc.)
- [ ] `nutrition_goals` (UUID id, UUID user_id, calories_target, etc.)

### Step 3: Verify RLS Policies

Go to: Authentication → Policies

Check these policies exist:

**physical_measurements**:
- [ ] "Users can insert their own measurements"
- [ ] "Users can view their own measurements"
- [ ] "Coaches can view team measurements"

**nutrition_logs**:
- [ ] "Users can insert their own nutrition logs"
- [ ] "Users can view their own nutrition logs"
- [ ] "Coaches can view team nutrition logs"

**nutrition_goals**:
- [ ] "Users can manage their own nutrition goals"

## Test User Flow

### Test 1: Log Physical Measurement
1. Login as regular user
2. Navigate to: `/wellness`
3. Scroll to "Daily Wellness Check-in"
4. Enter values in form fields
5. Click "Submit Check-in"
6. **Expected**: Success toast, no console errors
7. **Verify**: Check `physical_measurements` table in Supabase

### Test 2: Log Nutrition
1. Navigate to nutrition dashboard (if route exists)
2. Search for a food: "chicken breast"
3. Click "Add Food"
4. **Expected**: Food appears in "Today's Meals"
5. **Verify**: Check `nutrition_logs` table in Supabase

## What Changed

### Before
```typescript
// Console errors:
[Performance] Error logging measurement: relation "physical_measurements" does not exist
[Nutrition] Error adding food: new row violates row-level security policy
```

### After
```typescript
// Console success:
[Performance] Measurement logged: 123e4567-e89b-12d3-a456-426614174000
[Nutrition] Food logged: 550e8400-e29b-41d4-a716-446655440000
```

## Files Created
1. `supabase/migrations/20260111_fix_physical_measurements.sql`
2. `supabase/migrations/20260111_fix_nutrition_logs_policies.sql`
3. `supabase/migrations/20260111_create_nutrition_tables.sql`

## Rollback (If Needed)

If something breaks:

```sql
-- In Supabase SQL Editor:

-- Remove physical_measurements
DROP TABLE IF EXISTS physical_measurements CASCADE;

-- Remove policies from nutrition tables
DROP POLICY IF EXISTS "Users can insert their own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can view their own nutrition logs" ON nutrition_logs;
-- ... etc
```

## Common Issues

### Issue: "relation does not exist"
**Solution**: Migration didn't apply. Run `npx supabase db push` again.

### Issue: "violates row-level security policy"
**Solution**: RLS policies didn't create. Check Authentication → Policies in Supabase dashboard.

### Issue: "column does not exist"
**Solution**: Check `physical_measurements` table has all columns (body_fat, muscle_mass, etc.)

## Support

See full audit report: `MEASUREMENT_NUTRITION_AUDIT_REPORT.md`

For detailed schema and policies, review the 3 migration files.
