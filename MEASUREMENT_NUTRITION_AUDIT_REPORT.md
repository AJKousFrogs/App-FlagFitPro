# Measurement & Nutrition Logging Audit Report

**Date**: January 10, 2026  
**Issue**: Users cannot log measurements or save nutrition logs  
**Severity**: 🔴 **CRITICAL** - Core functionality blocked

---

## Executive Summary

Users are unable to:
1. **Log physical measurements** (weight, body fat, muscle mass, etc.)
2. **Save nutrition logs** (food intake, meals)

The root cause is a **database schema mismatch** between the application code and the actual Supabase database tables.

---

## 🔍 Root Cause Analysis

### Issue #1: Physical Measurements Table Missing

#### What the Code Expects
The Angular service (`PerformanceDataService.logMeasurement()`) attempts to insert into `physical_measurements` table with these columns:

```typescript
// Location: angular/src/app/core/services/performance-data.service.ts:536-559
.from("physical_measurements")
.insert({
  user_id: userId,              // UUID
  weight: number,
  height: number,
  body_fat: number,
  muscle_mass: number,
  body_water_mass: number,
  fat_mass: number,
  protein_mass: number,
  bone_mineral_content: number,
  skeletal_muscle_mass: number,
  muscle_percentage: number,
  body_water_percentage: number,
  protein_percentage: number,
  bone_mineral_percentage: number,
  visceral_fat_rating: number,
  basal_metabolic_rate: number,
  waist_to_hip_ratio: number,
  body_age: number,
  notes: text,
  created_at: timestamp
})
```

#### What Actually Exists in Database
The database migration `031_wellness_and_measurements_tables.sql` creates a **minimal** table:

```sql
-- Location: database/migrations/031_wellness_and_measurements_tables.sql:7-17
CREATE TABLE IF NOT EXISTS physical_measurements (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,    -- ❌ Wrong type! Should be UUID
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    body_fat DECIMAL(4,2),
    muscle_mass DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### The Problems

1. **Type Mismatch**: `user_id` is `VARCHAR(255)` but code sends UUID
2. **Missing Columns**: 14+ body composition fields don't exist
3. **No RLS Policies**: Table has no Row Level Security configured
4. **No Foreign Key**: No reference to `auth.users(id)`
5. **Wrong Migration Applied**: This is from `database/migrations/` but Supabase uses `supabase/migrations/`

---

### Issue #2: Nutrition Logs Missing RLS Policies

#### What the Code Does
The Angular service (`NutritionService.addFoodToCurrentMeal()`) inserts nutrition data:

```typescript
// Location: angular/src/app/core/services/nutrition.service.ts:378-392
.from("nutrition_logs")
.insert({
  user_id: userId,          // UUID
  food_name: string,
  food_id: integer,
  calories: decimal,
  protein: decimal,
  carbohydrates: decimal,
  fat: decimal,
  fiber: decimal,
  logged_at: timestamp,
  meal_type: string
})
```

#### Database Table Structure
The table exists in migration `051_add_service_migration_tables.sql`:

```sql
-- Location: database/migrations/051_add_service_migration_tables.sql:59-78
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_name VARCHAR(255) NOT NULL,
    food_id INTEGER,
    calories DECIMAL(8,2) DEFAULT 0,
    protein DECIMAL(6,2) DEFAULT 0,
    carbohydrates DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0,
    fiber DECIMAL(6,2) DEFAULT 0,
    meal_type VARCHAR(50),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Line 165
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
```

#### The Problems

1. **RLS Enabled but No Policies**: RLS is ON but **no INSERT policy exists**
2. **Users Cannot Insert**: All inserts are blocked by default when RLS is enabled
3. **No SELECT Policy**: Users cannot even view their own data

---

## 📂 File Locations

### Services Attempting to Save Data
- **Measurements**: `angular/src/app/core/services/performance-data.service.ts` (lines 520-576)
- **Nutrition**: `angular/src/app/core/services/nutrition.service.ts` (lines 344-408)

### UI Components Affected
- **Body Composition Card**: `angular/src/app/shared/components/body-composition-card/body-composition-card.component.ts`
  - Shows "No measurements yet" because queries fail
  - Button links to `/wellness` page
  
- **Nutrition Dashboard**: `angular/src/app/shared/components/nutrition-dashboard/nutrition-dashboard.component.ts`
  - Food logger form exists (lines 67-99)
  - "Add Food" button calls `addFoodToMeal()` (line 295-304)
  - Fails silently when RLS blocks insert

- **Wellness Page**: `angular/src/app/features/wellness/wellness.component.ts`
  - Has comprehensive check-in form (lines 310-484)
  - Includes weight/hydration inputs but no explicit measurement save button
  - Route: `/wellness`

### Database Migrations
- **Old migrations** (not applied to Supabase):
  - `database/migrations/031_wellness_and_measurements_tables.sql`
  - `database/migrations/051_add_service_migration_tables.sql`
  
- **Supabase migrations folder**: `supabase/migrations/`
  - **None of these files contain `physical_measurements` or `nutrition_logs` tables**
  - The tables may not exist in Supabase at all, or have different structure

---

## 🔬 Verification Steps

### Step 1: Check if Tables Exist in Supabase

```sql
-- Run in Supabase SQL Editor
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('physical_measurements', 'nutrition_logs', 'nutrition_goals');
```

Expected outcome: Tables should exist. If they don't, they need to be created.

### Step 2: Check RLS Policies

```sql
-- Check nutrition_logs policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'nutrition_logs';

-- Check physical_measurements policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'physical_measurements';
```

Expected outcome: You'll likely see **zero policies** for both tables.

### Step 3: Check Column Definitions

```sql
-- Check nutrition_logs columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'nutrition_logs'
ORDER BY ordinal_position;

-- Check physical_measurements columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'physical_measurements'
ORDER BY ordinal_position;
```

---

## ✅ Solution

### Fix #1: Create/Update Physical Measurements Table

**File**: Create `supabase/migrations/20260111_fix_physical_measurements.sql`

```sql
-- Drop old table if exists (backup data first if needed!)
DROP TABLE IF EXISTS physical_measurements CASCADE;

-- Create proper physical_measurements table
CREATE TABLE physical_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic measurements
    weight DECIMAL(5,2) CHECK (weight >= 30 AND weight <= 300),
    height DECIMAL(5,2) CHECK (height >= 140 AND height <= 250),
    body_fat DECIMAL(4,2) CHECK (body_fat >= 3 AND body_fat <= 50),
    muscle_mass DECIMAL(5,2),
    
    -- Enhanced body composition fields
    body_water_mass DECIMAL(5,2),
    fat_mass DECIMAL(5,2),
    protein_mass DECIMAL(5,2),
    bone_mineral_content DECIMAL(5,2),
    skeletal_muscle_mass DECIMAL(5,2),
    muscle_percentage DECIMAL(4,2),
    body_water_percentage DECIMAL(4,2),
    protein_percentage DECIMAL(4,2),
    bone_mineral_percentage DECIMAL(4,2),
    visceral_fat_rating INTEGER,
    basal_metabolic_rate INTEGER,
    waist_to_hip_ratio DECIMAL(4,2),
    body_age INTEGER,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX idx_physical_measurements_user_date 
ON physical_measurements(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE physical_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own measurements"
ON physical_measurements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own measurements"
ON physical_measurements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own measurements"
ON physical_measurements
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Optional: Allow coaches to view player measurements
CREATE POLICY "Coaches can view team measurements"
ON physical_measurements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('coach', 'head_coach', 'admin')
    AND tm.team_id IN (
      SELECT team_id FROM team_members WHERE user_id = physical_measurements.user_id
    )
  )
);

COMMENT ON TABLE physical_measurements IS 'Stores athlete body composition and physical measurement data from smart scales';
```

---

### Fix #2: Add RLS Policies to Nutrition Logs

**File**: Create `supabase/migrations/20260111_fix_nutrition_logs_policies.sql`

```sql
-- Nutrition Logs Policies
CREATE POLICY "Users can insert their own nutrition logs"
ON nutrition_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own nutrition logs"
ON nutrition_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition logs"
ON nutrition_logs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Optional: Allow coaches/nutritionists to view player nutrition
CREATE POLICY "Coaches can view team nutrition logs"
ON nutrition_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('coach', 'head_coach', 'nutritionist', 'admin')
    AND tm.team_id IN (
      SELECT team_id FROM team_members WHERE user_id = nutrition_logs.user_id
    )
  )
);

-- Nutrition Goals Policies (if table exists)
CREATE POLICY "Users can manage their own nutrition goals"
ON nutrition_goals
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Nutritionists can view team nutrition goals"
ON nutrition_goals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('nutritionist', 'coach', 'head_coach', 'admin')
    AND tm.team_id IN (
      SELECT team_id FROM team_members WHERE user_id = nutrition_goals.user_id
    )
  )
);
```

---

### Fix #3: Ensure Tables Exist with Correct Structure

If `nutrition_logs` doesn't exist in Supabase, create it:

**File**: Create `supabase/migrations/20260111_create_nutrition_tables.sql`

```sql
-- Create nutrition_logs if not exists
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    food_name VARCHAR(255) NOT NULL,
    food_id INTEGER, -- USDA FoodData Central ID if available
    
    -- Macronutrients
    calories DECIMAL(8,2) DEFAULT 0,
    protein DECIMAL(6,2) DEFAULT 0,
    carbohydrates DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0,
    fiber DECIMAL(6,2) DEFAULT 0,
    
    meal_type VARCHAR(50), -- breakfast, lunch, dinner, snack
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date 
ON nutrition_logs(user_id, logged_at DESC);

-- Create nutrition_goals if not exists
CREATE TABLE IF NOT EXISTS nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    calories_target INTEGER DEFAULT 2500,
    protein_target INTEGER DEFAULT 150,
    carbs_target INTEGER DEFAULT 300,
    fat_target INTEGER DEFAULT 80,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
```

---

## 🚀 Deployment Steps

### 1. Apply Migrations to Supabase

```bash
cd /Users/aljosaursakous/Desktop/Flag\ football\ HTML\ -\ APP

# Create the migration files (already provided above)

# Apply to Supabase
npx supabase db push
```

### 2. Verify Tables in Supabase Dashboard

- Go to: https://pvziciccwxgftcielknm.supabase.co
- Navigate to: **Database** → **Tables**
- Check:
  - `physical_measurements` exists with all columns
  - `nutrition_logs` exists
  - `nutrition_goals` exists

### 3. Verify RLS Policies

- Go to: **Authentication** → **Policies**
- Check policies exist for:
  - `physical_measurements` (INSERT, SELECT, UPDATE)
  - `nutrition_logs` (INSERT, SELECT, DELETE)
  - `nutrition_goals` (ALL)

### 4. Test User Flow

1. **Test Measurement Logging**:
   - Login as regular user
   - Navigate to `/wellness`
   - Click "Log Check-in"
   - Enter weight and other metrics
   - Click "Submit Check-in"
   - Check browser console for errors
   - Verify data appears in `physical_measurements` table

2. **Test Nutrition Logging**:
   - Navigate to nutrition dashboard page
   - Search for a food (e.g., "chicken")
   - Click "Add Food"
   - Check if food appears in "Today's Meals"
   - Verify data in `nutrition_logs` table

---

## 🐛 Error Messages to Look For

### Before Fix
```typescript
// In browser console:
[Nutrition] Error adding food: {
  code: "42501",
  message: "new row violates row-level security policy for table \"nutrition_logs\""
}

[Performance] Error logging measurement: {
  code: "42P01", 
  message: "relation \"physical_measurements\" does not exist"
}
```

### After Fix
```typescript
[Nutrition] Food logged: 550e8400-e29b-41d4-a716-446655440000
[Performance] Measurement logged: 123e4567-e89b-12d3-a456-426614174000
```

---

## 📊 Impact Assessment

### Affected Features
1. ✅ Wellness page check-ins
2. ✅ Body composition tracking
3. ✅ Nutrition logging
4. ✅ Smart scale integrations
5. ✅ Weight trend analysis
6. ✅ Hydration tracking (if linked to measurements)

### User Experience Issues
- **Body Composition Card**: Always shows "No measurements yet"
- **Nutrition Dashboard**: "Add Food" button fails silently
- **Wellness Stats**: Weight/BMI stats missing or stale
- **Recovery Algorithms**: Cannot use weight/composition data for calculations

---

## 🔒 Security Considerations

### RLS Best Practices Applied
1. ✅ Users can only INSERT/UPDATE/DELETE their own data
2. ✅ Coaches can VIEW (but not modify) player data within their teams
3. ✅ No anonymous access
4. ✅ Policies use `auth.uid()` for secure user identification
5. ✅ Team-based access uses JOIN with `team_members` table

---

## 📝 Testing Checklist

After applying migrations:

- [ ] User can log weight in daily check-in
- [ ] Weight appears in Body Composition Card
- [ ] User can search and add food items
- [ ] Added food appears in "Today's Meals"
- [ ] Nutrition goals update when food is added
- [ ] Coach can view player measurements (if on same team)
- [ ] User cannot see other users' data
- [ ] No console errors when submitting forms
- [ ] Browser network tab shows 201 Created responses

---

## 📚 Additional Context

### Related Services
- `PerformanceDataService`: Handles measurement logging
- `NutritionService`: Handles food logging
- `WellnessService`: Handles daily check-ins
- `UnifiedTrainingService`: Aggregates measurement data for display

### Database Tables Involved
- `physical_measurements` - Body composition data
- `nutrition_logs` - Food intake logs  
- `nutrition_goals` - User nutrition targets
- `team_members` - For coach access permissions
- `auth.users` - User authentication

---

## ⚠️ Migration Risks

1. **Data Loss**: If old `physical_measurements` table exists with different schema, `DROP TABLE` will delete data
   - **Mitigation**: Export data first with `pg_dump` or Supabase backup
   
2. **User Disruption**: Users will lose access during migration (< 1 minute)
   - **Mitigation**: Apply during low-traffic hours

3. **API Breakage**: If other services use these tables differently
   - **Mitigation**: Audit all `from("physical_measurements")` and `from("nutrition_logs")` calls

---

## 📞 Contact

For questions about this audit or implementation:
- Review code locations in this document
- Check Angular service implementations for expected schema
- Verify Supabase migration files are applied in correct order

---

**Status**: 🔴 **BLOCKED** - Users cannot save measurements or nutrition data until migrations are applied.

**Next Steps**:
1. Create the 3 migration files provided above
2. Apply to Supabase with `npx supabase db push`
3. Test user flows as described in Testing section
4. Monitor for RLS policy errors in application logs
