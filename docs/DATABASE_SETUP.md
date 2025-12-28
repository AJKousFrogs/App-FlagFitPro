# FlagFit Pro Database Setup Guide

**Version**: 2.0  
**Last Updated**: December 2025  
**Last Verified Against Supabase**: 2025-12-28  
**Status**: ✅ Production Ready

---

## Overview

This guide covers the database setup for FlagFit Pro on Supabase. The database contains 250+ tables covering training, nutrition, recovery, team management, AI coaching, and sports science research.

## Database Architecture

The FlagFit Pro database is organized into the following systems:

### 1. Core Training System (✅ Implemented)
- **Training Programs**: `training_programs`, `training_phases`, `training_weeks`, `training_session_templates`
- **Exercises**: `exercises` (21 exercises), `session_exercises` (15 entries)
- **Plyometrics**: `plyometrics_exercises` (90 exercises), `plyometrics_training_programs`
- **Isometrics**: `isometrics_exercises` (23 exercises), `isometrics_training_programs`
- **Positions**: `positions` (7 positions)
- **Workout Logging**: `workout_logs`, `exercise_logs`, `session_summaries`

### 2. Load Monitoring & ACWR (✅ Implemented)
- **Load Tracking**: `load_monitoring`, `load_daily`, `training_load_metrics`
- **Wellness**: `wellness_entries`, `wellness_logs`, `readiness_scores`
- **Injury Tracking**: `injury_tracking`, `injury_details`, `athlete_injuries`

### 3. Nutrition System (✅ Partially Implemented)
**Implemented Tables:**
- `nutrition_logs` - Food intake logging with macronutrients
- `nutrition_goals` - User-specific daily nutrition targets
- `supplement_logs` - Supplement intake tracking

**NOT Implemented (documented but don't exist):**
- ~~`foods`~~ - No USDA FoodData Central integration
- ~~`nutrients`~~
- ~~`food_nutrients`~~
- ~~`nutrition_plans`~~
- ~~`meal_templates`~~
- ~~`athlete_nutrition_profiles`~~

### 4. Recovery System (✅ Partially Implemented)
**Implemented Tables:**
- `recovery_sessions` - Recovery protocol session tracking
- `sleep_optimization_protocols` (3 entries)
- `sprint_recovery_protocols` (4 entries)
- `environmental_recovery_protocols` (3 entries)
- `cognitive_recovery_protocols` (3 entries)
- `injury_recovery_protocols` (6 entries)

**NOT Implemented:**
- ~~`recovery_protocols`~~ (generic)
- ~~`cryotherapy_protocols`~~
- ~~`compression_protocols`~~
- ~~`manual_therapy_protocols`~~
- ~~`heat_therapy_protocols`~~
- ~~`athlete_recovery_profiles`~~

### 5. AI Coaching System (✅ Implemented)
**Implemented Tables:**
- `ai_chat_sessions` - AI chat sessions with context snapshots
- `ai_messages` - Individual messages with risk classification
- `ai_recommendations` - Actionable AI recommendations
- `ai_feedback` - User feedback on AI responses
- `ai_coach_visibility` - Coach visibility into player AI interactions
- `knowledge_base_entries` (7 entries) - Curated knowledge base
- `chatbot_user_context`, `chatbot_user_state`, `chatbot_response_filters`

**NOT Implemented:**
- ~~`ai_coaches`~~ (profiles)
- ~~`coaching_specializations`~~
- ~~`ai_coach_responses`~~
- ~~`mental_training_techniques`~~
- ~~`psychological_assessments`~~

### 6. Sports Science Research (✅ Implemented)
**Implemented Tables:**
- `hydration_research_studies` (2 entries)
- `supplement_research` (3 entries)
- `supplements` (8 entries)
- `supplement_interactions` (3 entries)
- `supplement_evidence_grades` (3 entries)
- `supplement_wada_compliance` (5 entries)
- `creatine_research` (2 entries)
- `sleep_guidelines` (6 entries)

**NOT Implemented:**
- ~~`research_institutions`~~
- ~~`research_studies`~~ (generic)
- ~~`performance_methodologies`~~
- ~~`evidence_based_protocols`~~
- ~~`research_collaborations`~~

### 7. Team Management (✅ Implemented)
- `teams`, `team_members`, `team_invitations`, `team_players`
- `team_events`, `attendance_records`, `absence_requests`
- `channels`, `channel_members`, `chat_messages`
- `depth_chart_templates`, `depth_chart_entries`
- `player_evaluations`, `coach_observations`
- `equipment_inventory`, `jersey_assignments`

### 8. Competition & Tournaments (✅ Implemented)
- `tournaments`, `tournament_participation`, `tournament_budgets`
- `games`, `game_events`, `game_plays`
- `officials`, `official_availability`, `game_official_assignments`

### 9. User & Authentication (✅ Implemented)
- `users` (8 users)
- `user_preferences`, `user_achievements`, `user_notification_preferences`
- `notification_preferences`, `push_notification_tokens`
- `gdpr_consent`, `gdpr_data_processing_log`

## Prerequisites

### Database Requirements
- Supabase PostgreSQL (production)
- All tables have Row Level Security (RLS) enabled

### Environment Variables

Create a `.env` file in the Angular project root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Installation Steps

### 1. Run Migrations

All database schema is managed through migration files in `database/migrations/`. There are 50+ migration files.

```bash
# Run all migrations via Supabase dashboard or CLI
# Or use the migration script:
./scripts/run-all-migrations-supabase.sh
```

### 2. Seed Data

Available seeding scripts in `scripts/`:

```bash
# Plyometrics (90 exercises)
node scripts/seedPlyometricsResearchDatabase.cjs

# Isometrics (23 exercises)
node scripts/seedIsometricsTrainingDatabase.cjs

# Hydration research
node scripts/seedHydrationResearchDatabase.cjs

# Supplement research
node scripts/seedSupplementResearchDatabase.cjs

# Recovery system
node scripts/seedRecoverySystem.cjs

# Nutrition system
node scripts/seedNutritionSystem.cjs

# Competition protocols
node scripts/seedCompetitionProtocolsFinal.cjs
```

### 3. Verify Installation

```sql
-- Check core tables
SELECT 
  'positions' as table_name, COUNT(*) as count FROM positions
UNION ALL SELECT 'training_programs', COUNT(*) FROM training_programs
UNION ALL SELECT 'plyometrics_exercises', COUNT(*) FROM plyometrics_exercises
UNION ALL SELECT 'isometrics_exercises', COUNT(*) FROM isometrics_exercises
UNION ALL SELECT 'exercises', COUNT(*) FROM exercises
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'supplements', COUNT(*) FROM supplements;
```

**Expected Results (as of 2025-12-28):**
| Table | Count |
|-------|-------|
| positions | 7 |
| training_programs | 1 |
| plyometrics_exercises | 90 |
| isometrics_exercises | 23 |
| exercises | 21 |
| users | 8 |
| supplements | 8 |

## Database Schema Details

### Key Tables with Row Counts

| Category | Table | Rows | RLS |
|----------|-------|------|-----|
| Training | `training_programs` | 1 | ✅ |
| Training | `training_phases` | 10 | ✅ |
| Training | `training_weeks` | 16 | ✅ |
| Training | `training_session_templates` | 112 | ✅ |
| Training | `session_exercises` | 15 | ✅ |
| Exercises | `exercises` | 21 | ✅ |
| Exercises | `plyometrics_exercises` | 90 | ✅ |
| Exercises | `isometrics_exercises` | 23 | ✅ |
| Positions | `positions` | 7 | ✅ |
| Load | `workout_logs` | 3 | ✅ |
| Load | `load_monitoring` | 0 | ✅ |
| Wellness | `wellness_entries` | 1 | ✅ |
| Wellness | `readiness_scores` | 1 | ✅ |
| Users | `users` | 8 | ✅ |
| Teams | `teams` | 0 | ✅ |
| Research | `hydration_research_studies` | 2 | ✅ |
| Research | `supplement_research` | 3 | ✅ |

### RLS Policies

All tables have Row Level Security enabled. Key policies:

- **User data**: Users can only access their own data
- **Team data**: Team members can access team data
- **Public reference data**: `plyometrics_exercises`, `isometrics_exercises`, `positions` are publicly readable
- **Coach visibility**: Coaches can see player data within their teams

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Ensure user is authenticated
   - Check team membership for team-related queries
   - Use service role key for admin operations

2. **Missing Tables**
   - Run all migrations in order
   - Check `database/migrations/` for latest migrations

3. **Empty Exercise Libraries**
   - Run seeding scripts for plyometrics/isometrics
   - Check `scripts/` folder for available seeders

### Reset Database

⚠️ **Warning**: This will delete all data

```bash
# Via Supabase Dashboard:
# 1. Go to Database > Tables
# 2. Use SQL Editor to truncate tables or reset schema

# Or run migrations fresh after clearing
```

## Scripts Reference

### Available Seeding Scripts

| Script | Purpose |
|--------|---------|
| `seedPlyometricsResearchDatabase.cjs` | 90 plyometric exercises |
| `seedIsometricsTrainingDatabase.cjs` | 23 isometric exercises |
| `seedHydrationResearchDatabase.cjs` | Hydration protocols |
| `seedSupplementResearchDatabase.cjs` | Supplement data |
| `seedRecoverySystem.cjs` | Recovery protocols |
| `seedNutritionSystem.cjs` | Nutrition data |
| `seedCompetitionProtocolsFinal.cjs` | Competition protocols |
| `seedDashboardData.js` | Dashboard sample data |

### Scripts That DON'T Exist

The following scripts mentioned in previous documentation do NOT exist:
- ~~`setupDatabase.js`~~
- ~~`runMigrations.js`~~
- ~~`seedComprehensiveNutritionDatabase.js`~~
- ~~`seedAICoachesDatabase.js`~~
- ~~`seedSportsScienceResearch.js`~~

## Related Documentation

- [README-TRAINING-DATABASE.md](../database/README-TRAINING-DATABASE.md) - Training schema details
- [LOAD_MANAGEMENT_QUICK_START.md](LOAD_MANAGEMENT_QUICK_START.md) - ACWR implementation
- [RLS_POLICY_SPECIFICATION.md](RLS_POLICY_SPECIFICATION.md) - Security policies
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

## Changelog

- **v2.0 (2025-12-28)**: Complete rewrite based on actual database audit
  - Removed references to non-existent tables and scripts
  - Added accurate table counts and implementation status
  - Updated seeding script references
- **v1.0 (2025-01)**: Initial documentation (largely inaccurate)

## License

This database setup is part of the FlagFit Pro application.
