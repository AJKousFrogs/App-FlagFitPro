# Migration 047: PostgREST Exposure for Core Tables

**Created**: January 21, 2025  
**Purpose**: Ensure all 82 core tables are properly exposed via PostgREST API  
**Status**: Ready to run

---

## Overview

Based on today's database analysis, we discovered:

- **Total tables in database**: 247
- **Tables exposed via PostgREST**: 82 core tables
- **Coverage**: 33.1%

Migration 047 ensures these 82 tables have proper permissions for PostgREST API access.

---

## What This Migration Does

1. **Grants Permissions**: Grants SELECT, INSERT, UPDATE, DELETE permissions to `anon` and `authenticated` roles for all 82 core tables
2. **Creates Tracking View**: Creates `postgrest_exposed_tables` view to track which tables are core tables
3. **Documents Tables**: Provides a clear view of the 82 core tables vs. all tables

---

## How to Run

### Method 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: **Flagfootballapp** (`pvziciccwxgftcielknm`)
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Open file: `database/migrations/047_ensure_postgrest_exposure.sql`
6. **Copy the entire contents** and paste into SQL Editor
7. Click **Run** (or press Cmd+Enter)
8. Wait for completion (~5-10 seconds)

**Expected Result**:

```
NOTICE: Granted PostgREST permissions on 82 tables
Success. No rows returned
```

### Method 2: Supabase CLI

```bash
# Link to project (if not already linked)
supabase link --project-ref pvziciccwxgftcielknm

# Run migration
supabase db push --file database/migrations/047_ensure_postgrest_exposure.sql
```

---

## Verification

After running the migration, verify it worked:

```sql
-- Check the view was created
SELECT * FROM postgrest_exposed_tables
WHERE is_core_table = true
ORDER BY table_name;

-- Should return 82 rows

-- Check permissions
SELECT
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN (
    SELECT table_name FROM postgrest_exposed_tables WHERE is_core_table = true
  )
ORDER BY table_name, grantee, privilege_type;
```

---

## 82 Core Tables Covered

This migration ensures proper PostgREST exposure for:

1. affordable_brand_products
2. affordable_equipment
3. agility_patterns
4. altitude_environmental_factors
5. amateur_training_programs
6. analytics_events
7. budget_categories
8. budget_friendly_alternatives
9. budget_nutrition_plans
10. chatbot_user_context
11. cognitive_recovery_protocols
12. community_activation_events
13. cost_effective_alternatives
14. creatine_research
15. daily_quotes
16. defensive_schemes
17. digital_wellness_protocols
18. diy_protocols
19. environmental_adjustments
20. environmental_recovery_protocols
21. equipment_alternatives_comparison
22. equipment_price_tracking
23. european_championship_protocols
24. fixtures
25. flag_football_performance_levels
26. flag_football_positions
27. game_day_workflows
28. hydration_research_studies
29. ifaf_elo_ratings
30. ifaf_flag_rankings
31. ifaf_hydration_protocols
32. implementation_steps
33. local_premium_alternatives
34. national_team_profiles
35. nfl_combine_benchmarks
36. nfl_combine_performances
37. notifications
38. olympic_games_protocols
39. olympic_qualification
40. performance_benchmarks
41. performance_competencies
42. performance_metrics
43. performance_plan_templates
44. player_archetypes
45. position_requirements
46. positions
47. premium_brand_analysis
48. premium_product_alternatives
49. readiness_scores
50. realistic_budget_categories
51. realistic_performance_plans
52. sleep_guidelines
53. sleep_optimization_protocols
54. sponsor_products
55. sponsor_rewards
56. sports_crossover_analysis
57. sprint_recovery_protocols
58. sprint_training_categories
59. sprint_training_phases
60. sprint_workouts
61. success_indicators
62. supplement_evidence_grades
63. supplement_interactions
64. supplement_protocols
65. supplement_research
66. supplement_wada_compliance
67. supplements
68. team_chemistry
69. team_resources
70. teams
71. training_analytics
72. training_hydration_protocols
73. training_sessions
74. user_behavior
75. user_notification_preferences
76. user_teams
77. users
78. wada_prohibited_substances
79. wearables_data
80. wellness_logs
81. world_championship_protocols

---

## Related Files

- **Migration File**: `database/migrations/047_ensure_postgrest_exposure.sql`
- **Analysis Document**: `docs/DATABASE_TABLES_ANALYSIS.md`
- **Table List Script**: `scripts/list-all-tables-direct.js`
- **Supabase Client**: `src/js/utils/supabase-client.js`

---

## Notes

- This migration is **idempotent** (safe to run multiple times)
- It only grants permissions, doesn't modify table structure
- RLS policies still apply (this just ensures PostgREST can see the tables)
- The view `postgrest_exposed_tables` helps track which tables are core vs. all tables

---

## Next Steps After Running

1. ✅ Verify migration ran successfully
2. ✅ Test API access to core tables via Supabase REST API
3. ✅ Review RLS policies for these tables
4. ✅ Update TypeScript types if needed
5. ✅ Document API endpoints for these tables
