# Supabase Database Tables Analysis

**Generated**: January 2025  
**Total Tables in Database**: 247  
**Tables in Provided List**: 82  
**Coverage**: 33.2%

---

## Overview

This document analyzes the tables provided from your Supabase dashboard. The list contains **82 tables** out of the total **247 tables** in your database.

---

## Table Categories

### Core Application Tables (5)

- `users` - User accounts and profiles
- `teams` - Team information
- `user_teams` - User-team relationships
- `notifications` - User notifications
- `user_notification_preferences` - Notification settings

### Training & Performance (8)

- `training_sessions` - Training session records
- `training_analytics` - Training analytics data
- `training_hydration_protocols` - Hydration protocols for training
- `amateur_training_programs` - Training programs for amateur athletes
- `sprint_training_categories` - Sprint training categories
- `sprint_training_phases` - Sprint training phases
- `sprint_workouts` - Sprint workout definitions
- `sprint_recovery_protocols` - Recovery protocols for sprint training

### Positions & Player Management (4)

- `positions` - Player positions
- `flag_football_positions` - Flag football specific positions
- `flag_football_performance_levels` - Performance level definitions
- `player_archetypes` - Player archetype classifications
- `position_requirements` - Position-specific requirements

### Analytics & Performance Metrics (5)

- `analytics_events` - Application analytics events
- `performance_benchmarks` - Performance benchmark data
- `performance_competencies` - Performance competency definitions
- `performance_metrics` - Performance metric definitions
- `performance_plan_templates` - Performance plan templates
- `training_analytics` - Training-specific analytics

### Wellness & Health (6)

- `wellness_logs` - Wellness tracking logs
- `readiness_scores` - Athlete readiness scores
- `sleep_guidelines` - Sleep guidelines
- `sleep_optimization_protocols` - Sleep optimization protocols
- `cognitive_recovery_protocols` - Cognitive recovery protocols
- `environmental_recovery_protocols` - Environmental recovery protocols

### Hydration & Research (3)

- `hydration_research_studies` - Hydration research studies
- `ifaf_hydration_protocols` - IFAF hydration protocols
- `training_hydration_protocols` - Training hydration protocols

### Supplements & Compliance (7)

- `supplements` - Supplement catalog
- `supplement_research` - Supplement research data
- `supplement_protocols` - Supplement protocols
- `supplement_interactions` - Supplement interaction data
- `supplement_evidence_grades` - Evidence grading for supplements
- `supplement_wada_compliance` - WADA compliance information
- `wada_prohibited_substances` - WADA prohibited substances list

### Budget & Equipment (10)

- `budget_categories` - Budget category definitions
- `budget_friendly_alternatives` - Budget-friendly product alternatives
- `budget_nutrition_plans` - Budget-conscious nutrition plans
- `affordable_brand_products` - Affordable brand products
- `affordable_equipment` - Affordable equipment options
- `equipment_alternatives_comparison` - Equipment comparison data
- `equipment_price_tracking` - Equipment price tracking
- `premium_brand_analysis` - Premium brand analysis
- `premium_product_alternatives` - Premium product alternatives
- `local_premium_alternatives` - Local premium alternatives
- `realistic_budget_categories` - Realistic budget categories

### Competition & Championships (5)

- `ifaf_elo_ratings` - IFAF ELO rating system
- `ifaf_flag_rankings` - IFAF flag football rankings
- `nfl_combine_benchmarks` - NFL combine benchmark data
- `nfl_combine_performances` - NFL combine performance records
- `olympic_games_protocols` - Olympic games protocols
- `olympic_qualification` - Olympic qualification data
- `european_championship_protocols` - European championship protocols
- `world_championship_protocols` - World championship protocols

### Team & Strategy (5)

- `team_chemistry` - Team chemistry metrics
- `team_resources` - Team resource management
- `defensive_schemes` - Defensive scheme definitions
- `game_day_workflows` - Game day workflow definitions
- `sports_crossover_analysis` - Sports crossover analysis

### Environmental & Protocols (4)

- `altitude_environmental_factors` - Altitude environmental factors
- `environmental_adjustments` - Environmental adjustment protocols
- `environmental_recovery_protocols` - Environmental recovery protocols
- `diy_protocols` - DIY protocol definitions

### Research & Knowledge (2)

- `creatine_research` - Creatine research data
- `implementation_steps` - Implementation step definitions

### Community & Social (2)

- `community_activation_events` - Community activation events
- `user_behavior` - User behavior tracking

### Other (5)

- `agility_patterns` - Agility pattern definitions
- `chatbot_user_context` - Chatbot user context storage
- `daily_quotes` - Daily motivational quotes
- `digital_wellness_protocols` - Digital wellness protocols
- `fixtures` - Fixture/schedule data
- `national_team_profiles` - National team profiles
- `sponsor_products` - Sponsor product information
- `sponsor_rewards` - Sponsor reward system
- `success_indicators` - Success indicator definitions

---

## Tables NOT in This List (165 tables)

The following categories of tables exist in your database but are NOT in the provided list:

### Major Missing Categories:

1. **AI Coach System** (~15 tables)
   - `ai_coaches`, `ai_chat_conversations`, `ai_chat_messages`, etc.

2. **Advanced Training Systems** (~30 tables)
   - `isometrics_*`, `plyometrics_*`, `focus_training_sessions`, etc.

3. **Nutrition System** (~15 tables)
   - `nutrition_logs`, `nutrition_plans`, `food_items`, `meal_templates`, etc.

4. **Recovery System** (~20 tables)
   - `recovery_sessions`, `recovery_protocols`, `recovery_analytics`, etc.

5. **Injury Management** (~10 tables)
   - `injuries`, `injury_events`, `injury_monitoring`, `rtp_protocols`, etc.

6. **Sleep System** (~10 tables)
   - `sleep_logs`, `sleep_research_studies`, `user_sleep_sessions`, etc.

7. **Load Management** (~5 tables)
   - `load_daily`, `load_metrics`, `load_monitoring`, etc.

8. **Mental Performance** (~15 tables)
   - `mental_training_techniques`, `mental_toughness_protocols`, etc.

9. **Research & Knowledge Base** (~20 tables)
   - Various research tables, knowledge base tables, etc.

10. **Financial & Budget Tracking** (~10 tables)
    - `budget_line_items`, `spending_transactions`, `financial_reports`, etc.

---

## Recommendations

### 1. Table Exposure via PostgREST

Many tables in your database are not accessible via the Supabase REST API. Consider:

- Enabling PostgREST for frequently accessed tables
- Reviewing RLS policies to ensure proper access control
- Creating views for complex queries

### 2. Documentation Priority

Focus documentation on the 82 tables in your list as they appear to be:

- Core application tables
- Frequently accessed tables
- Tables exposed via your API

### 3. TypeScript Types

Generate TypeScript types for these 82 tables to ensure type safety in your Angular application.

### 4. API Endpoints

Ensure REST API endpoints exist for all 82 tables in this list.

---

## Next Steps

1. **Generate TypeScript Types**: Create types for all 82 tables
2. **Document Schema**: Create detailed schema documentation
3. **API Coverage**: Verify all tables have proper API access
4. **RLS Policies**: Review and document Row Level Security policies

---

## Table List (Alphabetical)

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

**Total: 82 tables**
