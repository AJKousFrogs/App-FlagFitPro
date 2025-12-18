# Database Schema Upgrade Summary

## Overview
The database schema has been upgraded to consolidate analytics and training systems into a single comprehensive schema file.

## Changes Made

### 1. `schema.sql` - Comprehensive Schema
**Upgraded to include:**
- ✅ Analytics tables (analytics_events, performance_metrics, user_behavior, training_analytics)
- ✅ Training system tables (positions, training_programs, training_phases, training_weeks, exercises, etc.)
- ✅ ACWR (Acute:Chronic Workload Ratio) functions and triggers
- ✅ Position seed data
- ✅ Analytics views
- ✅ All necessary indexes

**Key Features:**
- Single source of truth for database schema
- Positions are automatically seeded
- ACWR monitoring system included
- All indexes optimized for performance

### 2. `seed-qb-annual-program-corrected.sql` - Improved Seed File
**Upgrades:**
- ✅ Idempotent - safe to run multiple times
- ✅ Ensures positions exist before creating program
- ✅ Uses INSERT ... ON CONFLICT DO UPDATE for exercises
- ✅ Properly deletes and recreates program/phases/weeks on re-run
- ✅ Corrected throwing volume progression (50→320 throws over 5 months)

**Throwing Volume Progression:**
- November: 50-80 throws/week
- December: 80-120 throws/week
- January: 120-160 throws/week
- February: 160-240 throws/week
- March: 240-320 throws/week
- April Week 2+: 320 throws/week (PEAK - maintained through season)

### 3. `seed-test-account.sql` - Enhanced Documentation
**Improvements:**
- ✅ Added comprehensive header comments
- ✅ Documented prerequisites
- ✅ Usage instructions
- ✅ Already idempotent (safe to run multiple times)

### 4. `seed-qb-annual-program.sql` - Marked as Original
**Changes:**
- ✅ Added note that corrected version should be used
- ✅ Preserved for reference

## Installation Order

1. **Run `schema.sql`** - Creates all tables, functions, triggers, and seeds positions
2. **Run `seed-qb-annual-program-corrected.sql`** - Creates QB annual program with corrected periodization
3. **Run `seed-test-account.sql`** - Creates test accounts (optional, for development)

## Key Improvements

### Idempotency
All seed files are now idempotent - safe to run multiple times without errors:
- Uses `ON CONFLICT DO UPDATE` for exercises
- Deletes and recreates programs/phases/weeks on re-run
- Uses `ON CONFLICT DO NOTHING` for positions

### Data Integrity
- Positions are seeded in schema.sql
- Seed files verify positions exist before use
- Foreign key constraints ensure referential integrity

### Performance
- All indexes included in schema.sql
- Optimized for common query patterns
- JSONB indexes for analytics queries

## Migration Notes

If upgrading from previous schema:
1. Backup existing data
2. Run new `schema.sql` (will create missing tables/indexes)
3. Run `seed-qb-annual-program-corrected.sql` to update QB program
4. Verify data integrity

## Testing

Test accounts created by `seed-test-account.sql`:
- **Player**: test@flagfitpro.com / TestPassword123!
- **Coach**: coach.test@flagfitpro.com / TestPassword123!

## Next Steps

1. Enable RLS policies if using Supabase (see `create-training-schema.sql` for examples)
2. Assign QB program to players via `player_programs` table
3. Start logging workouts via `workout_logs` table
4. Monitor ACWR via `load_monitoring` table

