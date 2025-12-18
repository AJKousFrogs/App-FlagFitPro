# Database Migration Upgrade Summary

## Overview
This document summarizes the database upgrade performed to fix inconsistencies, ensure proper function dependencies, and standardize patterns across all migrations.

## Migration Created: `043_database_upgrade_consistency.sql`

### Key Fixes and Improvements

#### 1. **Function Dependencies Fixed**
- **Issue**: Migration `001_base_tables.sql` referenced `update_updated_at_column()` function before it was created
- **Fix**: 
  - Added function creation to the beginning of `001_base_tables.sql`
  - Ensured function exists in upgrade migration (idempotent)

#### 2. **Row Level Security (RLS) Policies**
- **Added RLS policies for `training_sessions`**:
  - Users can only view/insert/update/delete their own sessions
  - Admins have full access
  - Policies use optimized subquery pattern for performance

- **Added RLS policies for `team_members`**:
  - Users can view their own memberships
  - Users can view other members of teams they belong to
  - Team admins/coaches can manage team memberships
  - Admins have full access

#### 3. **Missing Indexes Added**
- `idx_users_email_lower` - Case-insensitive email lookups
- `idx_users_active` - Filter active users efficiently
- `idx_users_email_verified` - Filter verified users
- `idx_training_sessions_user_status` - Filter by user and status
- `idx_training_sessions_date_range` - Date range queries
- `idx_team_members_user_status` - Active memberships lookup

#### 4. **Foreign Key Constraints**
- Ensured `training_sessions.user_id` has proper foreign key to `users.id`
- Added constraint only if it doesn't already exist (idempotent)

#### 5. **Helper Functions**
- `user_id_to_uuid()` - Converts VARCHAR user_id to UUID safely
  - Useful for tables that use VARCHAR(255) for user_id
  - Handles conversion errors gracefully

- `check_database_consistency()` - Validation function
  - Checks critical database components
  - Returns status of key checks
  - Useful for monitoring and verification

#### 6. **Database Views**
- `active_team_memberships` - View of all active team memberships with team/user details
- `user_training_summary` - Summary statistics for each user's training sessions

#### 7. **Data Type Consistency**
- **Note**: Cannot change existing VARCHAR(255) user_id columns to UUID without data migration
- Documented pattern: New tables should use UUID for user_id
- Created helper function for conversion where needed

#### 8. **Missing Columns**
- Added `created_by` column to `teams` table (if not exists)
- Useful for tracking team creators

#### 9. **Trigger Setup**
- Ensured all `updated_at` triggers are properly configured
- Uses idempotent pattern (IF NOT EXISTS)

## Files Modified

### `001_base_tables.sql`
- Added `update_updated_at_column()` function at the beginning
- Ensures function exists before triggers that use it

### `043_database_upgrade_consistency.sql` (NEW)
- Comprehensive upgrade migration
- Fixes all identified inconsistencies
- Adds missing RLS policies
- Adds performance indexes
- Creates helper functions and views

## Data Type Patterns

### UUID Pattern (Preferred)
- `users.id` - UUID
- `team_members.user_id` - UUID
- `training_sessions.user_id` - UUID
- `training_load_metrics.user_id` - UUID

### VARCHAR(255) Pattern (Legacy)
- `wellness_data.user_id` - VARCHAR(255)
- `supplements_data.user_id` - VARCHAR(255)
- `injuries.user_id` - VARCHAR(255)
- `user_notification_preferences.user_id` - VARCHAR(255)

**Note**: These tables use VARCHAR(255) for backward compatibility. New tables should use UUID.

## Security Improvements

1. **RLS Enabled** on critical tables:
   - `training_sessions`
   - `team_members`

2. **Optimized RLS Policies**:
   - Auth functions wrapped in subqueries
   - Prevents per-row re-evaluation
   - Better performance at scale

3. **Consistent Security Model**:
   - Users see only their own data
   - Team members can see team data
   - Admins have full access

## Performance Improvements

1. **New Indexes**:
   - Email lookups (case-insensitive)
   - Status filtering
   - Date range queries
   - User + status combinations

2. **Views**:
   - Pre-computed aggregations
   - Faster common queries
   - Consistent data access patterns

## Verification

After running the upgrade migration, verify consistency:

```sql
-- Check database consistency
SELECT * FROM check_database_consistency();

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('training_sessions', 'team_members');

-- Verify policies exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('training_sessions', 'team_members')
ORDER BY tablename, cmd;
```

## Migration Order

The upgrade migration (`043_database_upgrade_consistency.sql`) should be run:
1. After all other migrations (001-042)
2. It's idempotent - safe to run multiple times
3. Uses `CREATE OR REPLACE` and `IF NOT EXISTS` patterns

## Next Steps

1. **Run the upgrade migration**:
   ```bash
   psql -d your_database -f database/migrations/043_database_upgrade_consistency.sql
   ```

2. **Verify consistency**:
   ```sql
   SELECT * FROM check_database_consistency();
   ```

3. **Test RLS policies**:
   - Test as regular user (should see only own data)
   - Test as admin (should see all data)
   - Test team member access

4. **Monitor performance**:
   - Check query performance with new indexes
   - Monitor RLS policy execution times

## Breaking Changes

**None** - This upgrade is backward compatible:
- All changes are additive
- Existing data is preserved
- Existing queries continue to work
- New functionality is optional

## Future Considerations

1. **Data Migration**: Consider migrating VARCHAR(255) user_id columns to UUID
   - Requires careful planning
   - Update all foreign keys
   - Update application code

2. **Additional RLS Policies**: Review other tables for RLS needs
   - `games` table
   - `game_events` table
   - Other user-specific tables

3. **Performance Monitoring**: Monitor new indexes and views
   - Query execution times
   - Index usage statistics
   - View refresh times

