# Complete List of SQL Files for Supabase Migration

**Generated**: $(date)  
**Project**: Flagfootballapp (`pvziciccwxgftcielknm`)  
**Database**: Supabase PostgreSQL

---

## Migration Files (Run in Order)

### Core Migrations

1. ✅ `database/migrations/001_base_tables.sql`
   - Base tables for the application
   - **Status**: Needs to be run

2. ✅ `database/migrations/025_complete_flag_football_player_system.sql`
   - Complete player system tables
   - **Status**: Needs to be run

3. ✅ `database/migrations/026_enhanced_strength_conditioning_system.sql`
   - Strength and conditioning tables
   - **Status**: Needs to be run

4. ✅ `database/migrations/027_load_management_system.sql`
   - Load management and ACWR system
   - **Status**: Needs to be run

5. ✅ `database/migrations/028_evidence_based_knowledge_base.sql`
   - Knowledge base tables
   - **Status**: Needs to be run

6. ✅ `database/migrations/029_game_events_system.sql`
   - Game events tracking
   - **Status**: Needs to be run

7. ✅ `database/migrations/029_sponsors_table.sql`
   - Sponsors table
   - **Status**: Needs to be run

8. ✅ `database/migrations/030_advanced_ux_components_support.sql`
   - UX components support tables
   - **Status**: Needs to be run

9. ✅ `database/migrations/031_open_data_sessions_system.sql`
   - Open data sessions
   - **Status**: Needs to be run

10. ✅ `database/migrations/031_wellness_and_measurements_tables.sql`
    - Wellness and measurements
    - **Status**: Needs to be run

11. ✅ `database/migrations/032_acwr_compute_function.sql`
    - ACWR computation functions
    - **Status**: Needs to be run

12. ✅ `database/migrations/032_fix_analytics_events_rls_performance.sql`
    - Analytics RLS performance fixes
    - **Status**: Needs to be run

13. ✅ `database/migrations/033_consolidate_analytics_events_policies.sql`
    - Analytics policies consolidation
    - **Status**: Needs to be run

14. ✅ `database/migrations/033_readiness_score_system.sql`
    - Readiness score system
    - **Status**: Needs to be run

15. ✅ `database/migrations/033_readiness_score_system_create_tables.sql`
    - Readiness score tables
    - **Status**: Needs to be run

16. ✅ `database/migrations/034_check_acwr_rpe_consistency.sql`
    - ACWR/RPE consistency checks
    - **Status**: Needs to be run

17. ✅ `database/migrations/034_enable_rls_wearables_data.sql`
    - Wearables RLS policies
    - **Status**: Needs to be run

18. ✅ `database/migrations/035_enable_rls_remaining_tables.sql`
    - Enable RLS on remaining tables
    - **Status**: Needs to be run

19. ✅ `database/migrations/036_add_rls_policies_users_implementation_steps.sql`
    - Users RLS policies
    - **Status**: Needs to be run

20. ✅ `database/migrations/037_fix_users_insert_policy_registration.sql`
    - Fix users insert policy
    - **Status**: Needs to be run

21. ✅ `database/migrations/037_notifications_unification.sql`
    - Notifications unification
    - **Status**: Needs to be run

22. ✅ `database/migrations/038_add_username_and_verification_fields.sql`
    - Username and verification fields
    - **Status**: Needs to be run

23. ✅ `database/migrations/039_chatbot_role_aware_system.sql`
    - Chatbot role-aware system
    - **Status**: Needs to be run

24. ✅ `database/migrations/040_knowledge_base_governance.sql`
    - Knowledge base governance
    - **Status**: Needs to be run

25. ✅ `database/migrations/041_player_stats_aggregation_view.sql`
    - Player stats aggregation views
    - **Status**: Needs to be run

26. ✅ `database/migrations/042_training_data_consistency.sql`
    - Training data consistency
    - **Status**: Needs to be run

27. ✅ `database/migrations/043_database_upgrade_consistency.sql`
    - Database upgrade consistency
    - **Status**: Needs to be run

28. ✅ `database/migrations/044_fix_rls_performance_and_consolidate_policies.sql`
    - RLS performance fixes
    - **Status**: Needs to be run

29. ✅ `database/migrations/045_add_missing_constraints.sql`
    - Add missing database constraints
    - **Status**: Needs to be run

30. ✅ `database/migrations/046_fix_acwr_baseline_checks_supabase.sql`
    - Fix ACWR calculation with baseline checks
    - **Status**: Needs to be run

31. ✅ `database/migrations/046_fix_acwr_baseline_checks.sql`
    - Fix ACWR calculation
    - **Status**: Needs to be run

32. ✅ `database/migrations/create-injuries-table.sql`
    - Injuries table creation
    - **Status**: Needs to be run

---

## Other SQL Files

### Schema Files

1. ✅ `database/schema.sql`
   - Complete database schema
   - **Status**: May contain duplicate definitions, review before running

2. ✅ `database/create-training-schema.sql`
   - Training schema creation
   - **Status**: Needs to be run

3. ✅ `database/create-auth-tables.sql`
   - Auth tables creation
   - **Status**: Needs to be run (if not using Supabase Auth)

4. ✅ `database/create-missing-tables.sql`
   - Missing tables creation
   - **Status**: Needs to be run

### RLS Policies

1. ✅ `database/supabase-rls-policies.sql`
   - Complete RLS policies
   - **Status**: Needs to be run

2. ✅ `database/apply-rls-policies-missing-tables.sql`
   - Apply RLS to missing tables
   - **Status**: Needs to be run

3. ✅ `database/apply-rls-policies-users-implementation-steps.sql`
   - Apply RLS to users/implementation_steps
   - **Status**: Needs to be run

4. ✅ `database/fix-rls-performance-helper.sql`
   - RLS performance helper functions
   - **Status**: Needs to be run

### Other Setup Files

1. ✅ `database/add_email_verification.sql`
   - Email verification setup
   - **Status**: Needs to be run

### Seed Data (Optional)

1. ⚠️ `database/seed-qb-annual-program.sql`
   - Seed QB program data
   - **Status**: Optional - run after migrations

2. ⚠️ `database/seed-qb-annual-program-corrected.sql`
   - Corrected QB program seed data
   - **Status**: Optional - use this instead of above

3. ⚠️ `database/seed-test-account.sql`
   - Test account creation
   - **Status**: Optional - for development/testing

---

## Execution Instructions

### Method 1: Supabase Dashboard SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard
2. Select project: **Flagfootballapp** (`pvziciccwxgftcielknm`)
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. For each file in order:
   - Open the SQL file
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run** (or Cmd+Enter)
   - Wait for completion
   - Check for errors
   - Save results if needed

### Method 2: Automated Script

Run the provided script (if connection works):

```bash
./scripts/run-all-migrations-supabase.sh
```

### Method 3: Supabase CLI

```bash
# Link to project
supabase link --project-ref pvziciccwxgftcielknm

# Run migrations one by one
supabase db push --file database/migrations/001_base_tables.sql
# ... continue for each file
```

---

## Important Notes

1. **Run in Order**: Migrations should be run in numerical order (001, 025, 026, etc.)

2. **Database**: Standard migrations use the `users` table.

3. **Idempotent**: Most migrations are idempotent (safe to run multiple times)

4. **RLS Policies**: Run RLS policy files after table creation

5. **Seed Data**: Run seed files last, after all migrations

6. **Backup**: Consider backing up database before running migrations

---

## Files Summary

- **Total SQL Files**: 44
- **Migration Files**: 32
- **Schema Files**: 4
- **RLS Policy Files**: 4
- **Seed Files**: 3
- **Other Files**: 1

---

## Next Steps After Running

1. Verify all tables were created:

   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

2. Verify RLS is enabled:

   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

3. Verify functions were created:

   ```sql
   SELECT proname FROM pg_proc
   WHERE proname LIKE '%acwr%' OR proname LIKE '%baseline%';
   ```

4. Test ACWR calculation:
   ```sql
   SELECT * FROM get_acwr_with_baseline('test-user-uuid', CURRENT_DATE);
   ```

---

## Results Location

All execution results will be saved to:

- `database/migration_results/`

Each migration generates:

- `*_result.txt` - Execution output
- `*_errors.txt` - Error messages (if any)
