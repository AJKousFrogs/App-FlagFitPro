# SQL Migration Execution Plan

## Quick Reference

**Total Files**: 44 SQL files  
**Execution Method**: Supabase Dashboard SQL Editor  
**Project**: Flagfootballapp (`pvziciccwxgftcielknm`)

---

## Step-by-Step Execution

### Phase 1: Core Schema (Run First)

1. `database/migrations/001_base_tables.sql`
2. `database/create-auth-tables.sql` (if not using Supabase Auth)
3. `database/create-missing-tables.sql`
4. `database/create-training-schema.sql`

### Phase 2: Feature Migrations (Run in Order)

5. `database/migrations/025_complete_flag_football_player_system.sql`
6. `database/migrations/026_enhanced_strength_conditioning_system.sql`
7. `database/migrations/027_load_management_system.sql`
8. `database/migrations/028_evidence_based_knowledge_base.sql`
9. `database/migrations/029_game_events_system.sql`
10. `database/migrations/029_sponsors_table.sql`
11. `database/migrations/030_advanced_ux_components_support.sql`
12. `database/migrations/031_open_data_sessions_system.sql`
13. `database/migrations/031_wellness_and_measurements_tables.sql`
14. `database/migrations/032_acwr_compute_function.sql`
15. `database/migrations/033_readiness_score_system_create_tables.sql`
16. `database/migrations/033_readiness_score_system.sql`
17. `database/migrations/041_player_stats_aggregation_view.sql`

### Phase 3: RLS Policies (Run After Tables)

18. `database/supabase-rls-policies.sql`
19. `database/apply-rls-policies-missing-tables.sql`
20. `database/apply-rls-policies-users-implementation-steps.sql`
21. `database/fix-rls-performance-helper.sql`
22. `database/migrations/032_fix_analytics_events_rls_performance.sql`
23. `database/migrations/033_consolidate_analytics_events_policies.sql`
24. `database/migrations/034_enable_rls_wearables_data.sql`
25. `database/migrations/035_enable_rls_remaining_tables.sql`
26. `database/migrations/036_add_rls_policies_users_implementation_steps.sql`
27. `database/migrations/044_fix_rls_performance_and_consolidate_policies.sql`

### Phase 4: Fixes and Updates

28. `database/migrations/034_check_acwr_rpe_consistency.sql`
29. `database/migrations/037_fix_users_insert_policy_registration.sql`
30. `database/migrations/037_notifications_unification.sql`
31. `database/migrations/038_add_username_and_verification_fields.sql`
32. `database/migrations/039_chatbot_role_aware_system.sql`
33. `database/migrations/040_knowledge_base_governance.sql`
34. `database/migrations/042_training_data_consistency.sql`
35. `database/migrations/043_database_upgrade_consistency.sql`
36. `database/migrations/045_add_missing_constraints.sql`
37. `database/migrations/046_fix_acwr_baseline_checks_supabase.sql`
38. `database/migrations/create-injuries-table.sql`
39. `database/add_email_verification.sql`

### Phase 5: Seed Data (Optional - Run Last)

40. `database/seed-qb-annual-program-corrected.sql` (or seed-qb-annual-program.sql)
41. `database/seed-test-account.sql` (for development)

---

## Execution Checklist

- [ ] Phase 1: Core Schema
- [ ] Phase 2: Feature Migrations
- [ ] Phase 3: RLS Policies
- [ ] Phase 4: Fixes and Updates
- [ ] Phase 5: Seed Data (optional)

---

## Verification Queries

After running migrations, verify:

```sql
-- Check tables
SELECT COUNT(*) as table_count FROM information_schema.tables
WHERE table_schema = 'public';

-- Check functions
SELECT COUNT(*) as function_count FROM pg_proc
WHERE pronamespace = 'public'::regnamespace;

-- Check RLS enabled
SELECT COUNT(*) as rls_enabled_count FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

---

## Notes

- Save execution results for each migration
- Note any errors encountered
- Some migrations may fail if dependencies aren't met - run in order
- RLS policies should be run after table creation
