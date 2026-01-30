# FlagFit Pro Database Setup Guide

**Version**: 2.4  
**Last Updated**: 12 January 2026  
**Last Verified Against Supabase**: 12 January 2026  
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
- **Wellness**: `daily_wellness_checkin` (primary), `wellness_entries` (deprecated - dual-write only), `readiness_scores`
- **Injury Tracking**: `injury_tracking`, `injury_details`, `athlete_injuries`

### 3. Nutrition System (✅ Fully Implemented)

**Core Tracking Tables:**

- `nutrition_logs` - Food intake logging with macronutrients
- `nutrition_goals` - User-specific daily nutrition targets
- `supplement_logs` - Supplement intake tracking

**USDA Food Database (✅ Implemented Dec 2025):**

- `usda_foods` - Synced USDA FoodData Central database
- `sync_logs` - Data sync operation tracking

**Frogs Playbook Integration (✅ Implemented Dec 2025):**

- `athlete_nutrition_profiles` - Personalized nutrition profiles with body composition, goals, and calculated macro targets
- `nutrition_plans` - Day-type specific nutrition plans (Easy/Moderate/Hard days using Athletes Plate Method)
- `meal_templates` - Pre-built meal templates for different day types and timings (11 templates)
- `tournament_nutrition_protocols` - Multi-game day nutrition strategies (5 protocols)
- `hydration_logs` - Daily hydration intake tracking
- `sweat_rate_assessments` - Sweat rate testing for personalized hydration
- `supplement_calculations` - Calculated supplement dosages (caffeine, creatine, beta-alanine)

**API Endpoints (in `nutrition.cjs`):**

- `GET /api/nutrition/athletes-plate?dayType=moderate` - Athletes Plate recommendations
- `POST /api/nutrition/calculate-targets` - Calculate personalized macro targets
- `GET /api/nutrition/meal-templates?dayType=hard` - Get meal templates
- `GET /api/nutrition/tournament-protocol?type=single_day&games=2` - Tournament protocols
- `POST /api/nutrition/tournament-plan` - Generate personalized tournament plan
- `GET/POST /api/nutrition/hydration-log` - Log and view hydration
- `POST /api/nutrition/sweat-rate` - Save sweat rate assessment
- `GET/POST /api/nutrition/supplements` - Supplement calculations
- `GET/POST /api/nutrition/profile` - Athlete nutrition profile

### 4. Recovery System (✅ Fully Implemented)

**Implemented Tables:**

- `recovery_sessions` - Recovery protocol session tracking (with `protocol_id` FK)
- `recovery_protocols` - Generic recovery protocols (added Jan 2026)
- `sleep_optimization_protocols` (3 entries)
- `sprint_recovery_protocols` (4 entries)
- `environmental_recovery_protocols` (3 entries)
- `cognitive_recovery_protocols` (3 entries)
- `injury_recovery_protocols` (6 entries)

**NOT Implemented:**

- ~~`cryotherapy_protocols`~~
- ~~`compression_protocols`~~
- ~~`manual_therapy_protocols`~~
- ~~`heat_therapy_protocols`~~
- ~~`athlete_recovery_profiles`~~

### 5. AI Coaching System (✅ Fully Implemented)

**Implemented Tables:**

- `ai_chat_sessions` - AI chat sessions with context snapshots
- `ai_messages` - Individual messages with risk classification
- `ai_recommendations` - Actionable AI recommendations
- `ai_feedback` - User feedback on AI responses
- `ai_coach_visibility` - Coach visibility into player AI interactions
- `ai_followups` - AI scheduled follow-up messages (added Jan 2026)
- `ai_review_queue` - Queue for AI responses needing human review (added Jan 2026)
- `user_ai_preferences` - User preferences for AI interactions (added Jan 2026)
- `classification_history` - AI intent classification history (added Jan 2026)
- `conversation_context` - AI conversation context storage (added Jan 2026)
- `knowledge_base_entries` (27 entries) - Evidence-based knowledge base
- `chatbot_user_context`, `chatbot_user_state`, `chatbot_response_filters`

**Knowledge Base Categories (Updated Dec 2025):**

- Nutrition: Athletes Plate Method, hydration, tournament nutrition, supplements (caffeine, creatine, beta-alanine), macro calculator, USDA food database guide
- Training: Resisted sprints, plyometrics, isometrics, reactive agility, velocity-based training, research protocols
- Recovery: Sleep optimization, active recovery protocols
- Psychology: Pre-game mental prep, confidence building, focus techniques
- API Guides: USDA search, research database, training protocols

**NOT Implemented:**

- ~~`ai_coaches`~~ (profiles)
- ~~`coaching_specializations`~~
- ~~`ai_coach_responses`~~
- ~~`mental_training_techniques`~~
- ~~`psychological_assessments`~~

### 6. Sports Science Research (✅ Fully Implemented Dec 2025)

**Existing Research Tables:**

- `hydration_research_studies` (2 entries)
- `supplement_research` (3 entries)
- `supplements` (8 entries)
- `supplement_interactions` (3 entries)
- `supplement_evidence_grades` (3 entries)
- `supplement_wada_compliance` (5 entries)
- `creatine_research` (2 entries)
- `sleep_guidelines` (6 entries)

**New Research API Integration (✅ Implemented Dec 2025):**

- `research_studies` - Studies synced from PubMed, Europe PMC, OpenAlex APIs
- `research_topics` - Predefined topics (sprinting, plyometrics, isometrics, agility, recovery, sleep, muscle fiber, sports psychology, nutrition) with optimized search queries (10 topics)
- `training_protocols` - Evidence-based training protocols derived from research (5 protocols)
- `user_saved_research` - User bookmarked studies

**Data Sources (Free APIs - No Keys Required):**

- **PubMed/Entrez API** - Millions of biomedical studies
- **Europe PMC REST API** - Open access full-text papers
- **OpenAlex API** - No-key scholarly graph with institution search

**Top Sports Science Institutions (Shanghai Ranking 2024):**

- `research_institutions` table with 11 world-leading institutions
- Institution-specific searches via OpenAlex
- Priority scoring for flag football relevance

| Rank | Institution                        | Country     | Focus Areas                              |
| ---- | ---------------------------------- | ----------- | ---------------------------------------- |
| 1    | Deakin University (IPAN)           | Australia   | Nutrition, sprint protocols, recovery    |
| 2    | Univ. of Southern Denmark          | Denmark     | Plyometrics, isometrics, twitch research |
| 3    | Norwegian School of Sport Sciences | Norway      | Elite performance, psychology            |
| 4    | Univ. of Verona                    | Italy       | High-altitude training, endurance        |
| 5    | Univ. of Copenhagen                | Denmark     | Sports nutrition, supplements            |
| 6    | Victoria University (IHES)         | Australia   | Flag football conditioning               |
| 7    | Vrije Universiteit Amsterdam       | Netherlands | Motor control, mental training           |
| 8    | NTNU                               | Norway      | Sprint mechanics, elite sports           |
| 9    | KU Leuven                          | Belgium     | Kinesiology, injury prevention           |
| 10   | Univ. of Bath                      | UK          | Plyometrics, recovery protocols          |
| -    | Australian Institute of Sport      | Australia   | High performance, ABCD framework         |

**API Endpoints (in `research-sync.cjs`):**

- `POST /api/research/sync` - Trigger full research sync from all APIs
- `POST /api/research/sync-institutions` - Sync from top institutions
- `GET /api/research/search?q=sprint` - Search research studies
- `GET /api/research/topics` - Get research topics with study counts (15 topics)
- `GET /api/research/protocols?category=plyometrics` - Get training protocols
- `GET /api/research/featured` - Get featured/recommended research
- `GET /api/research/pubmed?q=sprint` - Direct PubMed search
- `GET /api/research/europepmc?q=recovery` - Direct Europe PMC search
- `GET /api/research/openalex?q=agility` - Direct OpenAlex search
- `GET /api/research/ais?topic=sprint` - Search AIS-affiliated research
- `GET /api/research/institution?institution=Deakin University&topic=nutrition` - Institution search
- `GET /api/research/institutions` - List all sports science institutions with details
- `GET /api/research/top-research?topic=sprint` - Get research from top-ranked institutions

### 7. Team Management (✅ Implemented)

- `teams`, `team_members`, `team_invitations` (with `message` column), `team_players`
- `team_events`, `attendance_records`, `absence_requests`
- `channels`, `channel_members`, `chat_messages`
- `depth_chart_templates`, `depth_chart_entries`
- `player_evaluations`, `coach_observations`
- `equipment_inventory`, `jersey_assignments`
- `team_templates` - Reusable training templates (added Jan 2026)
- `template_assignments` - Template assignments to players (added Jan 2026)
- `coach_inbox_items` - Coach alerts, recommendations, and requests (added Jan 2026)
- `coach_alert_acknowledgments` - Alert acknowledgment tracking (added Jan 2026)

### 8. Competition & Tournaments (✅ Implemented)

- `tournaments`, `tournament_participation`, `tournament_budgets`
- `games`, `game_events`, `game_plays`
- `officials`, `official_availability`, `game_official_assignments`

### 9. User & Authentication (✅ Implemented)

- `users` (8 users)
- `user_preferences`, `user_achievements`, `user_notification_preferences`
- `notification_preferences`, `push_notification_tokens`
- `gdpr_consent`, `gdpr_data_processing_log`
- `user_age_groups` - Age group classification (added Jan 2026)
- `youth_athlete_settings` - Youth athlete specific settings (added Jan 2026)
- `parent_guardian_links` - Parent/guardian to athlete links (added Jan 2026)
- `parent_notifications` - Notifications for parents (added Jan 2026)

### 10. Training Analytics (✅ Implemented - Jan 2026)

- `acwr_history` - Historical ACWR calculations
- `digest_history` - Daily/weekly training digest history
- `micro_sessions` - Short training/recovery sessions
- `micro_session_analytics` - Analytics for micro sessions

## Prerequisites

### Database Requirements

- Supabase PostgreSQL (production)
- All tables have Row Level Security (RLS) enabled

### Environment Variables

Create a `.env` file in the Angular project root:

```env
# Supabase Configuration
SUPABASE_URL=https://grfjmnjpzvknmsxrwesx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDI4OTksImV4cCI6MjA4NTA3ODg5OX0.63Do5rUEHBT7-pZEXzFFHB5LqFRaXWAt-YrH2v45vo0
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

| Category  | Table                        | Rows | RLS |
| --------- | ---------------------------- | ---- | --- |
| Training  | `training_programs`          | 1    | ✅  |
| Training  | `training_phases`            | 10   | ✅  |
| Training  | `training_weeks`             | 16   | ✅  |
| Training  | `training_session_templates` | 112  | ✅  |
| Training  | `session_exercises`          | 15   | ✅  |
| Exercises | `exercises`                  | 21   | ✅  |
| Exercises | `plyometrics_exercises`      | 90   | ✅  |
| Exercises | `isometrics_exercises`       | 23   | ✅  |
| Positions | `positions`                  | 7    | ✅  |
| Load      | `workout_logs`               | 3    | ✅  |
| Load      | `load_monitoring`            | 0    | ✅  |
| Wellness  | `wellness_entries`           | 1    | ✅  |
| Wellness  | `readiness_scores`           | 1    | ✅  |
| Users     | `users`                      | 8    | ✅  |
| Teams     | `teams`                      | 0    | ✅  |
| Research  | `hydration_research_studies` | 2    | ✅  |
| Research  | `supplement_research`        | 3    | ✅  |

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

| Script                                | Purpose                 |
| ------------------------------------- | ----------------------- |
| `seedPlyometricsResearchDatabase.cjs` | 90 plyometric exercises |
| `seedIsometricsTrainingDatabase.cjs`  | 23 isometric exercises  |
| `seedHydrationResearchDatabase.cjs`   | Hydration protocols     |
| `seedSupplementResearchDatabase.cjs`  | Supplement data         |
| `seedRecoverySystem.cjs`              | Recovery protocols      |
| `seedNutritionSystem.cjs`             | Nutrition data          |
| `seedCompetitionProtocolsFinal.cjs`   | Competition protocols   |
| `seedDashboardData.js`                | Dashboard sample data   |

### Scripts That DON'T Exist

The following scripts mentioned in previous documentation do NOT exist:

- ~~`setupDatabase.js`~~
- ~~`runMigrations.js`~~
- ~~`seedComprehensiveNutritionDatabase.js`~~
- ~~`seedAICoachesDatabase.js`~~
- ~~`seedSportsScienceResearch.js`~~

## Related Documentation

- [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md) - Complete feature & business logic (includes ACWR)
- [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md) - Row Level Security policies
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API.md](./API.md) - API reference

## Changelog

- **v2.4 (2026-01-12)**: Schema Alignment with Frontend
  - Added missing columns to `exercises`: `target_muscles`, `equipment_required`
  - Added missing columns to `isometrics_exercises`: `target_muscles`, `instructions`, `hold_duration_seconds`, `sets`, `reps`
  - Added missing columns to `plyometrics_exercises`: `target_muscles`, `coaching_cues`
  - Added missing columns to `training_sessions`: `is_outdoor`, `scheduled_date`, `intensity`
  - Added `message` column to `team_invitations`
  - Created `recovery_protocols` table and linked to `recovery_sessions`
  - Created 17 new tables for AI, coaching, youth athletes, and analytics:
    - AI System: `ai_followups`, `user_ai_preferences`, `classification_history`, `conversation_context`, `ai_review_queue`
    - Coach System: `coach_inbox_items`, `coach_alert_acknowledgments`, `team_templates`, `template_assignments`
    - Youth Athletes: `user_age_groups`, `youth_athlete_settings`, `parent_guardian_links`, `parent_notifications`
    - Analytics: `acwr_history`, `digest_history`, `micro_sessions`, `micro_session_analytics`
  - All new tables include RLS policies and proper indexes
- **v2.3 (2025-12-29)**: Knowledge Base Upgrade with API Integrations
  - Expanded `knowledge_base_entries` from 7 to 27 entries
  - Added nutrition knowledge: Athletes Plate Method, hydration, tournament protocols
  - Added AIS ABCD supplement framework: caffeine, creatine, beta-alanine
  - Added training protocols: resisted sprints, plyometrics, isometrics, agility
  - Added recovery knowledge: sleep optimization, active recovery
  - Added psychology knowledge: mental prep, confidence, focus
  - Added API integration guides: USDA search, research database, protocols
  - Updated `knowledge-search.cjs` to use correct schema with Supabase client
  - Added source types: research, ais, api, curated
- **v2.2 (2025-12-29)**: Sports Science Research API Integration
  - Added free scholarly API integrations: PubMed, Europe PMC, OpenAlex
  - Created `research_studies` table for synced research papers
  - Created `research_topics` table with 15 predefined topics including:
    - Core: sprinting, plyometrics, isometrics, agility, recovery, sleep, muscle fiber, sports psychology, nutrition, flag football
    - Advanced: AIS High Performance Science, Velocity-Based Training, Supplement Evidence (ABCD Framework), Acceleration Mechanics, Mental Performance
  - Created `training_protocols` table with 5 evidence-based protocols
  - Created `user_saved_research` for user bookmarks
  - Created `research_institutions` table with 11 top sports science institutions (Shanghai Ranking 2024)
  - Implemented `research-sync.cjs` Netlify function with search, sync, and institution endpoints
  - Added institution-specific searches for Deakin, SDU, NIH, Copenhagen, Victoria, VU Amsterdam, NTNU, KU Leuven, Bath, AIS
  - Included AIS Athlete Dataset (202 athletes) as featured study
  - Auto-calculates relevance scores for flag football applicability
- **v2.1 (2025-12-29)**: Nutrition System fully implemented
  - Added USDA FoodData Central integration (`usda_foods`, `sync_logs`)
  - Added Frogs Playbook integration (Athletes Plate Method)
  - Created 7 new nutrition tables: `athlete_nutrition_profiles`, `nutrition_plans`, `meal_templates`, `tournament_nutrition_protocols`, `hydration_logs`, `sweat_rate_assessments`, `supplement_calculations`
  - Added 11 meal templates and 5 tournament protocols
  - Implemented calorie/macro calculations based on body composition
  - Added hydration tracking with sweat rate calculator
  - Added supplement calculators (caffeine, creatine, beta-alanine)
- **v2.0 (2025-12-28)**: Complete rewrite based on actual database audit
  - Removed references to non-existent tables and scripts
  - Added accurate table counts and implementation status
  - Updated seeding script references
- **v1.0 (2025-01)**: Initial documentation (largely inaccurate)

## License

This database setup is part of the FlagFit Pro application.
