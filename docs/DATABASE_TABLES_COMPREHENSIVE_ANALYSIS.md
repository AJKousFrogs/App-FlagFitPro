# FlagFit Pro - Database Tables Comprehensive Analysis

> **Database Provider:** Supabase (PostgreSQL)  
> **Last Updated:** December 26, 2025  
> **Total Tables:** 108 tables across public schema

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Database Architecture Overview](#database-architecture-overview)
3. [Core Domain Tables](#core-domain-tables)
4. [Training System Tables](#training-system-tables)
5. [Wellness & Recovery Tables](#wellness--recovery-tables)
6. [Analytics & Performance Tables](#analytics--performance-tables)
7. [Knowledge Base & Research Tables](#knowledge-base--research-tables)
8. [Chatbot & AI System Tables](#chatbot--ai-system-tables)
9. [Gamification & Rewards Tables](#gamification--rewards-tables)
10. [International Competition Tables](#international-competition-tables)
11. [Budget & Equipment Tables](#budget--equipment-tables)
12. [Row Level Security (RLS) Status](#row-level-security-rls-status)
13. [Foreign Key Relationships](#foreign-key-relationships)
14. [Database Functions](#database-functions)
15. [Security Recommendations](#security-recommendations)

---

## Executive Summary

The FlagFit Pro database is a comprehensive PostgreSQL schema hosted on **Supabase** [[memory:12543532]] designed to support a flag football training and performance management application. The database covers:

- **User Management & Authentication** - Core user profiles with Supabase Auth integration
- **Team Management** - Domestic and international team structures
- **Training Programs** - Periodized training with phases, weeks, and sessions
- **Load Monitoring** - ACWR (Acute:Chronic Workload Ratio) for injury prevention
- **Wellness Tracking** - Daily wellness logs, sleep, recovery protocols
- **Performance Testing** - NFL Combine-style benchmarks adapted for flag football
- **Knowledge Base** - Evidence-based research, supplements, hydration protocols
- **AI Chatbot** - Role-aware conversational AI with user context
- **Gamification** - Sponsor rewards, achievements, Olympic qualification tracking

---

## Database Architecture Overview

### Schema Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLIC SCHEMA (108 Tables)                    │
├─────────────────────────────────────────────────────────────────┤
│  Core Domain (12)     │  Training System (18)  │  Wellness (12) │
│  Analytics (5)        │  Knowledge Base (25)   │  Chatbot (5)   │
│  Gamification (8)     │  International (15)    │  Budget (18)   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

1. **UUID Primary Keys** - All tables use `gen_random_uuid()` for distributed-friendly IDs
2. **Soft Timestamps** - `created_at` and `updated_at` on most tables
3. **RLS Enabled** - Row Level Security on all tables for multi-tenant security
4. **JSONB for Flexibility** - Complex nested data stored as JSONB
5. **Array Types** - PostgreSQL arrays for lists (tags, skills, etc.)
6. **Check Constraints** - Data validation at database level

---

## Core Domain Tables

### 1. `users` (8 rows)
**Purpose:** Core user profiles linked to Supabase Auth

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (matches auth.users.id) |
| `email` | VARCHAR(255) | Unique email for login |
| `password_hash` | VARCHAR(255) | Hashed password |
| `first_name` | VARCHAR(100) | First name |
| `last_name` | VARCHAR(100) | Last name |
| `position` | VARCHAR(20) | Player position (QB, WR, DB, etc.) |
| `experience_level` | VARCHAR(20) | beginner/intermediate/advanced |
| `height_cm` | DECIMAL | Height in centimeters |
| `weight_kg` | DECIMAL | Weight in kilograms |
| `birth_date` | DATE | Date of birth |
| `username` | VARCHAR | Unique username |
| `email_verified` | BOOLEAN | Email verification status |
| `verification_token` | VARCHAR | Email verification token |
| `notification_last_opened_at` | TIMESTAMPTZ | Last notification check |

**Key Relationships:**
- Referenced by 13+ tables (training_sessions, wellness_logs, chatbot_conversations, etc.)

---

### 2. `teams` (0 rows)
**Purpose:** Team management for domestic and international teams

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Team name |
| `team_type` | VARCHAR | 'domestic' or 'international' |
| `region` | VARCHAR | Geographic region |
| `country_code` | VARCHAR(3) | ISO 3166-1 alpha-3 code |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update |

**Constraints:**
- `team_type` CHECK: Must be 'domestic' or 'international'

---

### 3. `user_teams` (0 rows)
**Purpose:** Many-to-many relationship between users and teams

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | FK to auth.users |
| `team_id` | UUID | FK to teams |
| `role` | TEXT | User's role in team |
| `created_at` | TIMESTAMPTZ | Join timestamp |

**Primary Key:** Composite (`team_id`, `user_id`)

---

### 4. `positions` (6 rows)
**Purpose:** Flag football position definitions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Position code (QB, WR, DB, etc.) |
| `display_name` | TEXT | Full name (Quarterback, etc.) |
| `description` | TEXT | Position description |

**Seeded Data:** QB, WR, DB, Center, LB, Blitzer

---

### 5. `notifications` (0 rows)
**Purpose:** User notification system

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | UUID | FK to auth.users |
| `notification_type` | VARCHAR | Type of notification |
| `message` | TEXT | Notification content |
| `is_read` | BOOLEAN | Read status (default: false) |
| `priority` | VARCHAR | low/medium/high |

---

### 6. `user_notification_preferences` (0 rows)
**Purpose:** Per-user notification settings

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | FK to users |
| `notification_type` | ENUM | training, achievement, team, wellness, etc. |
| `muted` | BOOLEAN | Mute this type |
| `push_enabled` | BOOLEAN | Push notifications |
| `in_app_enabled` | BOOLEAN | In-app notifications |

**Notification Types:** training, achievement, team, wellness, general, game, tournament, injury_risk, weather

---

## Training System Tables

### 7. `training_sessions` (0 rows)
**Purpose:** Individual training sessions with periodization support

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `athlete_id` | UUID | FK to users |
| `team_id` | UUID | FK to teams (optional) |
| `week_id` | UUID | FK to training_weeks |
| `session_date` | DATE | Date of session |
| `session_name` | VARCHAR | Session title |
| `session_type` | VARCHAR | Strength, Speed, Skill, etc. |
| `training_type` | VARCHAR | Training category |
| `duration_minutes` | INTEGER | Expected duration |
| `rpe` | INTEGER | Rate of Perceived Exertion (1-10) |
| `status` | ENUM | planned, in_progress, completed, cancelled |
| `intensity_level` | SMALLINT | Intensity rating |
| `readiness_modifier` | DECIMAL | Adjustment based on readiness |
| `adjusted_duration` | INTEGER | Modified duration |

**Status Enum:** `training_session_status` (planned, in_progress, completed, cancelled)

---

### 8. `exercise_logs` (0 rows)
**Purpose:** Detailed exercise performance tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `session_id` | UUID | FK to training_sessions |
| `exercise_id` | UUID | Reference to exercise |
| `exercise_name` | VARCHAR | Exercise name |
| `exercise_category` | VARCHAR | Category |
| `set_number` | INTEGER | Set number |
| `reps_completed` | INTEGER | Reps done |
| `weight_kg` | DECIMAL | Weight used |
| `perceived_effort` | INTEGER | RPE (1-10) |
| `form_quality` | INTEGER | Form rating (1-10) |
| `pain_during_exercise` | BOOLEAN | Pain flag |
| `pain_location` | VARCHAR | Where pain occurred |
| `pain_level` | INTEGER | Pain intensity (0-10) |

---

### 9. `session_summaries` (0 rows)
**Purpose:** Aggregated session statistics

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `session_id` | UUID | FK to training_sessions |
| `planned_duration_minutes` | INTEGER | Planned time |
| `actual_duration_minutes` | INTEGER | Actual time |
| `total_sets_completed` | INTEGER | Sets done |
| `total_reps_completed` | INTEGER | Reps done |
| `total_weight_lifted_kg` | DECIMAL | Total volume |
| `average_rpe` | DECIMAL | Average effort |
| `session_load` | INTEGER | Load score (RPE × duration) |
| `pain_reported` | BOOLEAN | Any pain flagged |

---

### 10. `practice_participation` (0 rows)
**Purpose:** Team practice rep tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `team_id` | UUID | FK to teams |
| `practice_date` | DATE | Practice date |
| `unit_assignment` | VARCHAR | Offense/Defense |
| `total_reps_taken` | INTEGER | Total reps |
| `first_team_reps` | INTEGER | First team reps |
| `competitive_reps` | INTEGER | Live reps |
| `passing_reps` | INTEGER | Pass plays |
| `rushing_reps` | INTEGER | Run plays |
| `defensive_reps` | INTEGER | Defensive snaps |

---

### 11. `workout_modifications` (0 rows)
**Purpose:** Auto-adjustments based on readiness/injuries

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `active_injury_ids` | UUID[] | Current injuries |
| `readiness_score` | INTEGER | Readiness at time |
| `volume_adjustment` | DECIMAL | Volume multiplier |
| `intensity_adjustment` | DECIMAL | Intensity multiplier |
| `modification_rationale` | TEXT | Why modified |
| `auto_generated` | BOOLEAN | System-generated |
| `coach_approved` | BOOLEAN | Coach sign-off |

---

### 12. `injury_details` (0 rows)
**Purpose:** Comprehensive injury tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `anatomical_location` | VARCHAR | Body part |
| `injury_mechanism` | VARCHAR | How it happened |
| `severity_level` | INTEGER | 1-10 scale |
| `diagnosis` | TEXT | Medical diagnosis |
| `pain_level_current` | INTEGER | Current pain (0-10) |
| `rom_measurements` | JSONB | Range of motion data |
| `contraindicated_exercises` | UUID[] | Exercises to avoid |
| `return_to_sport_phase` | VARCHAR | acute/subacute/return |
| `expected_return_date` | DATE | Expected return |
| `status` | VARCHAR | active/recovered |

---

### 13. `rehab_protocols` (0 rows)
**Purpose:** Evidence-based rehabilitation protocols

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `protocol_name` | VARCHAR | Protocol name |
| `injury_type` | VARCHAR | Type of injury |
| `phase_number` | INTEGER | Phase in protocol |
| `phase_name` | VARCHAR | Phase description |
| `progression_criteria` | JSONB | Criteria to advance |
| `recommended_exercises` | UUID[] | Exercises for phase |
| `evidence_level` | VARCHAR | Research backing |

---

### 14. `exercise_substitutions` (0 rows)
**Purpose:** Alternative exercises for injuries

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `injury_type` | VARCHAR | Injury category |
| `body_part_affected` | VARCHAR | Affected area |
| `exercise_name` | VARCHAR | Original exercise |
| `alternative_name` | VARCHAR | Substitute exercise |
| `modification_description` | TEXT | How to modify |
| `intensity_adjustment` | DECIMAL | Intensity change |

---

## Wellness & Recovery Tables

### 15. `wellness_logs` (0 rows)
**Purpose:** Daily wellness check-ins for readiness calculation

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `athlete_id` | UUID | FK to users |
| `log_date` | DATE | Date of log |
| `fatigue` | INTEGER | Fatigue (1-10, 10=exhausted) |
| `sleep_quality` | INTEGER | Sleep rating (1-10) |
| `soreness` | INTEGER | Muscle soreness (1-10) |
| `sleep_hours` | DECIMAL | Hours slept |
| `energy` | INTEGER | Energy level (1-10) |
| `stress` | INTEGER | Stress level (1-10) |
| `mood` | INTEGER | Mood rating (1-10) |

**Check Constraints:** All ratings between 1-10

---

### 16. `wellness_entries` (0 rows)
**Purpose:** Extended wellness tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `athlete_id` | UUID | FK to auth.users |
| `date` | DATE | Entry date |
| `sleep_quality` | INTEGER | 0-10 scale |
| `energy_level` | INTEGER | 0-10 scale |
| `stress_level` | INTEGER | 0-10 (higher = more stress) |
| `muscle_soreness` | INTEGER | 0-10 scale |
| `motivation_level` | INTEGER | 0-10 scale |
| `mood` | INTEGER | 0-10 scale |
| `hydration_level` | INTEGER | 0-10 scale |
| `notes` | TEXT | Free-form notes |

---

### 17. `readiness_scores` (1 row)
**Purpose:** Composite daily readiness scores

| Column | Type | Description |
|--------|------|-------------|
| `athlete_id` | UUID | FK to users (part of PK) |
| `day` | DATE | Date (part of PK) |
| `score` | INTEGER | Overall score (0-100) |
| `level` | TEXT | low/moderate/high |
| `suggestion` | TEXT | deload/maintain/push |
| `acwr` | DECIMAL | Acute:Chronic ratio |
| `acute_load` | DECIMAL | 7-day load |
| `chronic_load` | DECIMAL | 28-day load |
| `workload_score` | INTEGER | Workload component (0-100) |
| `wellness_score` | INTEGER | Wellness component (0-100) |
| `sleep_score` | INTEGER | Sleep component (0-100) |
| `proximity_score` | INTEGER | Game proximity (0-100) |
| `injury_risk` | TEXT | Risk assessment |

**Primary Key:** Composite (`athlete_id`, `day`)

---

### 18. `fixtures` (0 rows)
**Purpose:** Game schedule for proximity calculations

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `team_id` | UUID | FK to teams |
| `athlete_id` | UUID | FK to users |
| `opponent` | TEXT | Opponent name |
| `game_start` | TIMESTAMPTZ | Game date/time |
| `location` | TEXT | Venue |
| `game_type` | VARCHAR | Game category |

---

### 19. `recovery_sessions` (0 rows)
**Purpose:** Recovery protocol tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `athlete_id` | UUID | FK to auth.users |
| `protocol_id` | VARCHAR | Protocol reference |
| `protocol_name` | VARCHAR | Protocol name |
| `started_at` | TIMESTAMPTZ | Start time |
| `completed_at` | TIMESTAMPTZ | Completion time |
| `stopped_at` | TIMESTAMPTZ | If stopped early |
| `duration_planned` | INTEGER | Planned minutes |
| `duration_actual` | INTEGER | Actual minutes |
| `status` | VARCHAR | in_progress/completed/stopped |

---

### 20. `sleep_optimization_protocols` (3 rows)
**Purpose:** Evidence-based sleep recommendations

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `recommended_sleep_duration_hours` | DECIMAL | Target hours |
| `sleep_efficiency_target_percentage` | INTEGER | Efficiency goal |
| `deep_sleep_target_percentage` | INTEGER | Deep sleep goal |
| `bedroom_temperature_celsius` | DECIMAL | Optimal temp |
| `caffeine_cutoff_hours` | INTEGER | Hours before bed |
| `electronic_device_cutoff_hours` | DECIMAL | Screen cutoff |
| `performance_improvement_with_optimization` | DECIMAL | Expected gain |

---

### 21. `sleep_guidelines` (6 rows)
**Purpose:** Research-backed sleep recommendations

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `evidence_level` | VARCHAR | Research quality |
| `recommendation` | TEXT | The guideline |
| `citation_id` | VARCHAR | Reference ID |
| `citation_title` | TEXT | Study title |
| `citation_authors` | TEXT[] | Authors |
| `citation_journal` | VARCHAR | Journal name |
| `citation_doi` | VARCHAR | DOI reference |

---

## Analytics & Performance Tables

### 22. `analytics_events` (0 rows)
**Purpose:** User interaction tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | UUID | FK to auth.users |
| `event_type` | VARCHAR | Event category |
| `event_data` | JSONB | Event payload |
| `session_id` | VARCHAR | Browser session |
| `page_url` | TEXT | Page where event occurred |
| `device_type` | VARCHAR | Device category |
| `browser` | VARCHAR | Browser name |
| `os` | VARCHAR | Operating system |

---

### 23. `performance_metrics` (0 rows)
**Purpose:** Web vitals and app performance

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | UUID | FK to auth.users |
| `page_url` | TEXT | Page measured |
| `load_time` | DECIMAL | Page load (ms) |
| `fcp` | DECIMAL | First Contentful Paint |
| `lcp` | DECIMAL | Largest Contentful Paint |
| `fid` | DECIMAL | First Input Delay |
| `cls` | DECIMAL | Cumulative Layout Shift |
| `memory_usage` | DECIMAL | Memory (MB) |

---

### 24. `user_behavior` (0 rows)
**Purpose:** Session and journey analytics

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | UUID | FK to auth.users |
| `session_id` | VARCHAR | Session identifier |
| `page_sequence` | TEXT[] | Pages visited |
| `session_duration` | INTEGER | Duration (seconds) |
| `features_used` | TEXT[] | Features accessed |
| `funnel_stage` | VARCHAR | Conversion stage |
| `entry_page` | TEXT | Landing page |
| `exit_page` | TEXT | Last page |

---

### 25. `training_analytics` (0 rows)
**Purpose:** Training-specific analytics

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | UUID | FK to auth.users |
| `training_type` | VARCHAR | Training category |
| `duration_minutes` | INTEGER | Session length |
| `performance_score` | DECIMAL | Performance rating |
| `personal_best` | BOOLEAN | New record |
| `improvement_percentage` | DECIMAL | Progress |

---

### 26. `performance_tests` (0 rows)
**Purpose:** Athletic performance test results

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `test_type` | VARCHAR | Test name (40YardDash, etc.) |
| `result_value` | DECIMAL | Test result |
| `target_value` | DECIMAL | Goal value |
| `test_date` | TIMESTAMPTZ | When tested |
| `conditions` | JSONB | Test conditions |

**Test Types:** 40YardDash, VerticalJump, BroadJump, ThreeCone, Shuttle, BenchPress, Squat, PowerClean

---

### 27. `performance_benchmarks` (0 rows)
**Purpose:** Reference benchmarks by gender and level

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `test_name` | VARCHAR | Test identifier |
| `test_category` | VARCHAR | Category |
| `elite_male` | DECIMAL | Elite male benchmark |
| `good_male` | DECIMAL | Good male benchmark |
| `average_male` | DECIMAL | Average male |
| `elite_female` | DECIMAL | Elite female |
| `good_female` | DECIMAL | Good female |
| `average_female` | DECIMAL | Average female |
| `most_important_for_positions` | VARCHAR[] | Relevant positions |

---

## Knowledge Base & Research Tables

### 28. `supplements` (3 rows)
**Purpose:** Supplement information database

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `name` | VARCHAR | Supplement name |
| `category` | VARCHAR | Category |
| `active_ingredients` | JSONB | Ingredients |
| `evidence_level` | VARCHAR | Research backing |
| `safety_rating` | VARCHAR | Safety assessment |
| `banned_substance_risk` | VARCHAR | WADA risk |
| `performance_benefits` | TEXT[] | Benefits |
| `side_effects` | TEXT[] | Side effects |
| `contraindications` | TEXT[] | Who shouldn't use |

---

### 29. `supplement_research` (6 rows)
**Purpose:** Research studies on supplements

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `supplement_id` | INTEGER | FK to supplements |
| `study_title` | TEXT | Study name |
| `authors` | TEXT[] | Researchers |
| `journal` | VARCHAR | Publication |
| `publication_year` | INTEGER | Year published |
| `doi` | VARCHAR | DOI reference |
| `sample_size` | INTEGER | Participants |
| `effect_size` | DECIMAL | Effect magnitude |
| `p_value` | DECIMAL | Statistical significance |
| `evidence_level` | VARCHAR | Quality rating |

---

### 30. `supplement_protocols` (0 rows)
**Purpose:** User-specific supplement plans

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | UUID | FK to auth.users |
| `supplement_id` | INTEGER | FK to supplements |
| `goal` | VARCHAR | Purpose |
| `recommended_dose_mg_per_kg` | DECIMAL | Dosage |
| `timing_relative_to_exercise` | VARCHAR | When to take |
| `wada_compliance_status` | VARCHAR | WADA status |
| `evidence_strength` | VARCHAR | Research support |

---

### 31. `supplement_wada_compliance` (5 rows)
**Purpose:** WADA compliance tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `supplement_name` | VARCHAR | Product name |
| `wada_status` | VARCHAR | Compliance status |
| `contamination_risk_percentage` | DECIMAL | Risk level |
| `third_party_tested` | BOOLEAN | Independent testing |
| `flag_football_safe` | BOOLEAN | Safe for competition |

---

### 32. `wada_prohibited_substances` (5 rows)
**Purpose:** Banned substance reference

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `substance_name` | VARCHAR | Substance |
| `substance_category` | VARCHAR | Category |
| `prohibited_status` | VARCHAR | Ban status |
| `wada_code` | VARCHAR | WADA reference |
| `risk_level` | VARCHAR | Risk assessment |
| `detection_window_days` | INTEGER | Detection period |

---

### 33. `hydration_research_studies` (2 rows)
**Purpose:** Hydration science research

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `study_title` | TEXT | Study name |
| `authors` | TEXT[] | Researchers |
| `publication_year` | INTEGER | Year |
| `evidence_level` | VARCHAR | Quality |
| `key_findings` | TEXT[] | Main results |
| `practical_applications` | TEXT[] | How to apply |
| `sport_specific` | VARCHAR | Sport focus |

---

### 34-38. Hydration Protocol Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `training_hydration_protocols` | 2 | Training hydration guidelines |
| `ifaf_hydration_protocols` | 2 | Competition hydration |
| `european_championship_protocols` | 2 | European competition specific |
| `world_championship_protocols` | 2 | World championship specific |
| `olympic_games_protocols` | 1 | Olympic preparation |

---

## Chatbot & AI System Tables

### 39. `chatbot_conversations` (0 rows)
**Purpose:** Conversation history storage

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `conversation_id` | UUID | Conversation thread |
| `message_order` | INTEGER | Message sequence |
| `role` | VARCHAR | user/assistant/system |
| `message` | TEXT | Message content |

**Role Constraint:** Must be 'user', 'assistant', or 'system'

---

### 40. `chatbot_user_context` (0 rows)
**Purpose:** User context for personalized responses

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users (unique) |
| `user_role` | VARCHAR | player/coach/admin |
| `primary_team_id` | UUID | FK to teams |
| `team_type` | VARCHAR | domestic/international |
| `preferred_topics` | TEXT[] | Frequent topics |
| `expertise_level` | VARCHAR | beginner/intermediate/advanced |
| `total_queries` | INTEGER | Query count |

---

### 41. `chatbot_user_state` (0 rows)
**Purpose:** Current user training state for AI

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Primary key (FK to users) |
| `current_training_program_id` | UUID | Active program |
| `current_training_phase` | VARCHAR | Current phase |
| `active_injury_ids` | UUID[] | Current injuries |
| `latest_readiness_score` | INTEGER | Recent readiness |
| `short_term_goals` | TEXT[] | Near-term goals |
| `long_term_goals` | TEXT[] | Long-term goals |
| `equipment_available` | TEXT[] | Available equipment |

---

### 42. `chatbot_response_filters` (1 row)
**Purpose:** User preferences for AI responses

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Primary key |
| `hide_injured_exercises` | BOOLEAN | Filter injured exercises |
| `show_only_current_phase` | BOOLEAN | Phase filter |
| `show_research_citations` | BOOLEAN | Include citations |
| `show_video_links` | BOOLEAN | Include videos |
| `max_response_length` | VARCHAR | Response length pref |
| `technical_terminology_level` | VARCHAR | Complexity level |

---

## Gamification & Rewards Tables

### 43. `sponsor_rewards` (0 rows)
**Purpose:** User reward points and tiers

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | UUID | FK to auth.users |
| `available_points` | INTEGER | Current points (default: 2847) |
| `current_tier` | VARCHAR | Tier level (default: GOLD) |
| `products_available` | INTEGER | Redeemable products |
| `tier_progress_percentage` | INTEGER | Progress to next tier |

---

### 44. `sponsor_products` (4 rows)
**Purpose:** Products available for redemption

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `product_name` | VARCHAR | Product name |
| `points_cost` | INTEGER | Points required |
| `relevance_score` | INTEGER | Relevance to user |
| `category` | VARCHAR | Product category |
| `is_featured` | BOOLEAN | Featured product |

---

### 45. `olympic_qualification` (0 rows)
**Purpose:** Olympic pathway tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | UUID | FK to auth.users |
| `qualification_probability` | INTEGER | Probability % |
| `world_ranking` | INTEGER | Current ranking |
| `days_until_championship` | INTEGER | Days to event |
| `european_championship_date` | DATE | EC date |
| `world_championship_date` | DATE | WC date |
| `olympic_date` | DATE | Olympics date |

---

### 46. `team_chemistry` (0 rows)
**Purpose:** Team dynamics tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | UUID | FK to auth.users |
| `team_id` | UUID | FK to teams |
| `overall_chemistry` | DECIMAL | Overall score |
| `communication_score` | DECIMAL | Communication |
| `trust_score` | DECIMAL | Trust level |
| `cohesion_score` | DECIMAL | Team cohesion |
| `leadership_score` | DECIMAL | Leadership |

---

### 47. `daily_quotes` (3 rows)
**Purpose:** Motivational quotes

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `quote_text` | TEXT | The quote |
| `author` | VARCHAR | Attribution |
| `category` | VARCHAR | Quote category |
| `is_active` | BOOLEAN | Active status |

---

## International Competition Tables

### 48. `ifaf_flag_rankings` (10 rows)
**Purpose:** IFAF world rankings

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `country` | VARCHAR | Country name |
| `gender` | VARCHAR | Men/Women |
| `category` | VARCHAR | Age category |
| `rank` | INTEGER | Current rank |
| `points` | DECIMAL | Ranking points |
| `previous_rank` | INTEGER | Last rank |
| `matches_played` | INTEGER | Games played |
| `wins` | INTEGER | Wins |
| `losses` | INTEGER | Losses |

---

### 49. `ifaf_elo_ratings` (5 rows)
**Purpose:** ELO rating system

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `country` | VARCHAR | Country |
| `elo_rating` | DECIMAL | ELO score |
| `k_factor` | DECIMAL | K-factor (default: 32) |
| `win_streak` | INTEGER | Current streak |

---

### 50. `national_team_profiles` (3 rows)
**Purpose:** National team information

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `team_id` | UUID | FK to teams |
| `federation` | VARCHAR | Federation name |
| `country_code` | VARCHAR | ISO code |
| `coaching_staff` | JSONB | Staff info |
| `play_style` | TEXT[] | Team style |
| `key_players` | TEXT[] | Star players |
| `world_ranking_history` | JSONB | Ranking history |

---

## Budget & Equipment Tables

### 51-68. Budget and Equipment Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `affordable_brand_products` | 9 | Budget-friendly products |
| `affordable_equipment` | 7 | Low-cost equipment |
| `budget_categories` | 7 | Spending categories |
| `budget_friendly_alternatives` | 8 | Cheaper alternatives |
| `budget_nutrition_plans` | 2 | Affordable meal plans |
| `cost_effective_alternatives` | 5 | Cost comparisons |
| `diy_protocols` | 4 | DIY training methods |
| `equipment_alternatives_comparison` | 9 | Equipment comparisons |
| `equipment_price_tracking` | 1 | Price monitoring |
| `local_premium_alternatives` | 11 | Local alternatives |
| `premium_brand_analysis` | 5 | Premium brand info |
| `premium_product_alternatives` | 13 | Premium vs budget |
| `realistic_budget_categories` | 7 | Realistic spending |
| `realistic_performance_plans` | 3 | Budget performance plans |
| `team_resources` | 6 | Shared team resources |
| `amateur_training_programs` | 3 | Amateur programs |
| `performance_plan_templates` | 6 | Plan templates |

---

## Sprint & Agility Training Tables

### 69-76. Speed Development Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `sprint_training_categories` | 4 | Sprint categories |
| `sprint_training_phases` | 4 | Periodization phases |
| `sprint_workouts` | 8 | Sprint workout library |
| `sprint_recovery_protocols` | 4 | Sprint recovery |
| `agility_patterns` | 5 | Agility drill patterns |
| `player_archetypes` | 5 | Player type definitions |
| `position_requirements` | 5 | Position physical needs |
| `sports_crossover_analysis` | 3 | Transfer from other sports |

---

## NFL Combine Reference Tables

### 77-79. Combine Benchmarks

| Table | Rows | Purpose |
|-------|------|---------|
| `nfl_combine_benchmarks` | 10 | Elite benchmarks |
| `nfl_combine_performances` | 7 | Historical performances |
| `flag_football_performance_levels` | 20 | FF-specific targets |

---

## Nutrition Tables

### 80-82. Nutrition Tracking

| Table | Rows | Purpose |
|-------|------|---------|
| `nutrition_logs` | 0 | Food intake tracking |
| `nutrition_goals` | 0 | Daily macro targets |
| `supplement_logs` | 0 | Supplement compliance |

---

## Wearables & Device Integration

### 83. `wearables_data` (0 rows)
**Purpose:** Wearable device data integration

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | UUID | FK to auth.users |
| `device_type` | VARCHAR | Device (Apple Watch, etc.) |
| `heart_rate` | INTEGER | Current HR |
| `hrv` | INTEGER | Heart rate variability |
| `sleep_score` | INTEGER | Sleep quality |
| `training_load` | INTEGER | Load metric |
| `connection_status` | VARCHAR | Device status |
| `last_sync` | TIMESTAMPTZ | Last sync time |

---

## Row Level Security (RLS) Status

**All 108 tables have RLS enabled** ✅

### RLS Policy Patterns

1. **User-owned data:** Users can only access their own records
2. **Team-based access:** Team members can access team data
3. **Public reference data:** Research/knowledge tables readable by all authenticated users
4. **Admin access:** Service role bypasses RLS for admin operations

### Recent RLS Optimizations (Dec 2025)

- Consolidated duplicate policies
- Added `(SELECT auth.uid())` wrapper for performance
- Fixed national_team_profiles, practice_participation, team_chemistry, user_teams policies

---

## Foreign Key Relationships

### Core Relationship Map

```
auth.users (Supabase Auth)
    │
    ├── users (public.users.id references auth.users.id)
    │       │
    │       ├── training_sessions (athlete_id)
    │       ├── wellness_logs (athlete_id)
    │       ├── readiness_scores (athlete_id)
    │       ├── exercise_logs (user_id)
    │       ├── injury_details (user_id)
    │       ├── chatbot_conversations (user_id)
    │       ├── chatbot_user_context (user_id)
    │       ├── chatbot_user_state (user_id)
    │       └── ... (13+ more tables)
    │
    └── teams
            │
            ├── user_teams (team_id)
            ├── team_chemistry (team_id)
            ├── fixtures (team_id)
            ├── training_sessions (team_id)
            └── chatbot_user_context (primary_team_id)
```

### Key Foreign Keys

| Source Table | Column | Target Table | Target Column |
|--------------|--------|--------------|---------------|
| training_sessions | athlete_id | users | id |
| wellness_logs | athlete_id | users | id |
| readiness_scores | athlete_id | users | id |
| fixtures | team_id | teams | id |
| fixtures | athlete_id | users | id |
| chatbot_user_context | user_id | users | id |
| chatbot_user_context | primary_team_id | teams | id |
| team_chemistry | team_id | teams | id |
| user_teams | user_id | auth.users | id |

---

## Database Functions

### ACWR Calculation Functions

```sql
-- Calculate daily training load (RPE × Duration)
calculate_daily_load(player_uuid UUID, log_date DATE) → INTEGER

-- Calculate 7-day rolling average
calculate_acute_load(player_uuid UUID, reference_date DATE) → DECIMAL

-- Calculate 28-day rolling average  
calculate_chronic_load(player_uuid UUID, reference_date DATE) → DECIMAL

-- Determine injury risk level
get_injury_risk_level(acwr_value DECIMAL) → VARCHAR
-- Returns: 'Low', 'Optimal', 'Moderate', 'High'

-- Safe ACWR calculation with baseline checks
calculate_acwr_safe(player_uuid UUID, reference_date DATE) 
→ TABLE(acwr, risk_level, baseline_days)
```

### Triggers

```sql
-- Auto-update load_monitoring when workout logged
trigger_update_load_monitoring ON workout_logs
    AFTER INSERT OR UPDATE
    EXECUTE FUNCTION update_load_monitoring()

-- Auto-update updated_at timestamps
update_users_updated_at ON users
update_teams_updated_at ON teams
update_training_sessions_updated_at ON training_sessions
```

---

## Security Recommendations

### Current Security Advisories

⚠️ **Leaked Password Protection Disabled**
- Supabase Auth can check passwords against HaveIBeenPwned.org
- **Recommendation:** Enable in Supabase Dashboard → Auth → Settings

### Security Best Practices Implemented

✅ Row Level Security on all tables  
✅ UUID primary keys (non-sequential)  
✅ Foreign key constraints  
✅ Check constraints for data validation  
✅ Separate auth.users from public.users  

### Recommended Improvements

1. **Enable leaked password protection** in Supabase Auth settings
2. **Add rate limiting** for chatbot endpoints
3. **Implement audit logging** for sensitive operations
4. **Review RLS policies** quarterly for optimization

---

## Data Statistics Summary

| Category | Tables | Total Rows |
|----------|--------|------------|
| Core Domain | 6 | 14 |
| Training System | 14 | 0 |
| Wellness & Recovery | 8 | 10 |
| Analytics | 5 | 0 |
| Knowledge Base | 25 | ~60 |
| Chatbot | 5 | 1 |
| Gamification | 6 | 7 |
| International | 5 | 21 |
| Budget/Equipment | 18 | ~100 |
| Sprint/Agility | 8 | 33 |
| NFL Reference | 3 | 37 |
| Nutrition | 3 | 0 |
| Wearables | 1 | 0 |
| **TOTAL** | **108** | **~280** |

---

## Applied Migrations

| Version | Name | Description |
|---------|------|-------------|
| 20250108000000 | chatbot_role_aware_system | Role-based chatbot context |
| 20250108000001 | knowledge_base_governance | KB management |
| 20251208154517 | remote_schema | Schema sync |
| 20251208164957 | latest_schema_updates | Recent updates |
| 20251223151409 | add_service_migration_tables | Service tables |
| 20251223151926 | fix_rls_performance_new_tables_v2 | RLS optimization |
| 20251223152139 | fix_duplicate_policies_simple_tables | Policy cleanup |
| 20251223152153 | fix_duplicate_policies_all_command_tables | Policy cleanup |
| 20251223152209 | fix_duplicate_policies_team_and_public_tables | Policy cleanup |
| 20251226122734 | consolidate_national_team_profiles_rls_policies | RLS consolidation |
| 20251226122746 | consolidate_practice_participation_rls_policies | RLS consolidation |
| 20251226122800 | consolidate_team_chemistry_rls_policies | RLS consolidation |
| 20251226122813 | consolidate_user_teams_rls_policies | RLS consolidation |
| 20251226122849 | optimize_rls_policies_with_select_wrapper | RLS performance |

---

## Appendix: Entity Relationship Diagram (Simplified)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐
│  auth.users │────▶│    users    │────▶│  training_sessions  │
└─────────────┘     └─────────────┘     └─────────────────────┘
                          │                       │
                          │                       ▼
                          │              ┌─────────────────┐
                          │              │  exercise_logs  │
                          │              └─────────────────┘
                          │
                          ▼
                    ┌───────────┐
                    │   teams   │
                    └───────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────────┐  ┌──────────┐
    │user_teams│   │team_chemistry│  │ fixtures │
    └──────────┘   └──────────────┘  └──────────┘
```

---

*Document generated: December 26, 2025*  
*Database: Supabase PostgreSQL*  
*Project: FlagFit Pro - Flag Football Training Application*

