# FlagFit Pro - Database Flow Documentation

**Version**: 2.1  
**Last Updated**: January 2026  
**Status**: ✅ Cross-Reference Ready

---

## Purpose

This document maps **user actions to database operations** for every feature in FlagFit Pro. Use this to:

- Cross-reference with [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md) (business logic)
- Verify data persistence matches UI behavior
- Debug data flow issues
- Onboard new developers

---

## Quick Navigation

| Domain                        | Features                                                         |
| ----------------------------- | ---------------------------------------------------------------- |
| [Authentication](#1-authentication--user-management) | Login, Registration, Profile                    |
| [Training](#2-training-system)                        | Schedule, Today, Workout Logs                   |
| [Load Monitoring](#3-load-monitoring--acwr)           | ACWR, Load Metrics, Alerts                      |
| [Wellness](#4-wellness--recovery)                     | Check-ins, Sleep, Readiness                     |
| [AI Coaching](#5-ai-coaching-merlin)                  | Chat, Recommendations, Safety                   |
| [Team Management](#6-team-management)                 | Roster, Depth Chart, Attendance                 |
| [Competition](#7-competition--tournaments)            | Games, Tournaments, Stats                       |
| [Nutrition](#8-nutrition-system)                      | Logs, Profiles, Hydration                       |
| [Analytics](#9-analytics--reporting)                  | Performance, Trends, Reports                    |

---

## Data Flow Legend

```
┌──────────────────────────────────────────────────────────────────┐
│  LEGEND                                                          │
├──────────────────────────────────────────────────────────────────┤
│  [UI]     → User interface action                                │
│  (API)    → Netlify function / API endpoint                      │
│  {DB}     → Database table                                       │
│  →        → Data flow direction                                  │
│  ↔        → Bidirectional (read + write)                         │
│  C/R/U/D  → Create/Read/Update/Delete operations                 │
│  RLS      → Row Level Security applies                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1. Authentication & User Management

### 1.1 User Registration

**User Flow**: New user signs up → Creates account → Completes onboarding

```
[Sign Up Form]
    │
    ├──(Supabase Auth)─→ {auth.users} [C] (Supabase managed)
    │
    └──(POST /api/auth/register)
           │
           ├──→ {users} [C] - Core user record
           │    • id (from auth.users)
           │    • email
           │    • role ('player' | 'coach')
           │    • created_at
           │
           ├──→ {user_profiles} [C] - Extended profile
           │    • user_id (FK)
           │    • display_name
           │    • avatar_url
           │    • position_id
           │    • date_of_birth
           │
           ├──→ {user_preferences} [C] - App preferences
           │    • user_id (FK)
           │    • theme ('dark' | 'light')
           │    • language
           │    • notifications_enabled
           │
           └──→ {notification_preferences} [C] - Notification settings
                • user_id (FK)
                • email_notifications
                • push_notifications
                • sms_notifications
```

**Tables Involved**: `users`, `user_profiles`, `user_preferences`, `notification_preferences`  
**RLS**: User can only access own data  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §23 Onboarding](#)

---

### 1.2 User Login

**User Flow**: User logs in → Session created → Dashboard loaded

```
[Login Form]
    │
    ├──(Supabase Auth)─→ {auth.users} [R] - Verify credentials
    │
    └──(Session Created)
           │
           ├──→ {users} [R] - Get user record + role
           ├──→ {user_profiles} [R] - Get profile data
           ├──→ {user_preferences} [R] - Get app settings
           ├──→ {team_members} [R] - Get team associations
           └──→ {gdpr_consent} [R] - Check consent status
```

**Tables Involved**: `users`, `user_profiles`, `user_preferences`, `team_members`, `gdpr_consent`  
**RLS**: All queries filtered by `auth.uid() = user_id`

---

### 1.3 Profile Update

**User Flow**: User edits profile → Saves changes

```
[Profile Form]
    │
    └──(PUT /api/user/profile)
           │
           ├──→ {user_profiles} [U]
           │    • display_name
           │    • avatar_url
           │    • bio
           │    • position_id
           │    • height_cm, weight_kg
           │    • date_of_birth
           │
           ├──→ {physical_measurements} [C] (if weight changed)
           │    • user_id
           │    • weight_kg
           │    • height_cm
           │    • measured_at
           │
           └──→ {privacy_settings} [U] (if privacy changed)
                • profile_visibility
                • stats_visibility
```

**Tables Involved**: `user_profiles`, `physical_measurements`, `privacy_settings`

---

## 2. Training System

### 2.1 View Training Schedule

**User Flow**: User opens Training Schedule → Views calendar → Sees sessions

```
[Training Page Load]
    │
    └──(GET /api/training-stats)
           │
           ├──→ {training_sessions} [R] - All user sessions
           │    • Filtered by user_id + date range
           │    • Status: planned/completed/cancelled
           │
           ├──→ {training_session_templates} [R] - Template data
           │    • Exercise details
           │    • Sets/reps/duration
           │
           ├──→ {training_programs} [R] - Current program
           │    • Program name, phase
           │
           ├──→ {training_phases} [R] - Current phase
           │    • Phase type (base/build/peak/taper)
           │
           └──→ {training_weeks} [R] - Week structure
                • Week number
                • Focus area
```

**Data Aggregation**:
```typescript
// Calendar data structure
{
  date: Date,
  sessions: TrainingSession[],
  status: 'planned' | 'in_progress' | 'completed' | 'missed',
  load: number // Calculated from duration × RPE
}
```

**Tables Involved**: `training_sessions`, `training_session_templates`, `training_programs`, `training_phases`, `training_weeks`

---

### 2.2 Log Training Session

**User Flow**: User completes workout → Logs session → Updates stats

```
[Training Log Form]
    │
    └──(POST /api/training/log)
           │
           ├──→ {workout_logs} [C] - Main workout entry
           │    • user_id
           │    • session_type
           │    • duration_minutes
           │    • rpe (1-10)
           │    • notes
           │    • completed_at
           │
           ├──→ {exercise_logs} [C] - Per-exercise data
           │    • workout_log_id (FK)
           │    • exercise_id (FK)
           │    • sets_completed
           │    • reps_completed
           │    • weight_kg
           │    • notes
           │
           ├──→ {load_monitoring} [C/U] - Daily load entry
           │    • user_id
           │    • date
           │    • session_load (duration × RPE × multiplier)
           │    • session_type
           │
           ├──→ {training_load_metrics} [U] - Running calculations
           │    • acute_load (7-day)
           │    • chronic_load (28-day)
           │    • acwr_ratio
           │    • monotony
           │    • strain
           │
           ├──→ {player_streaks} [U] - Streak tracking
           │    • current_streak
           │    • longest_streak
           │    • last_training_date
           │
           └──→ {player_training_stats} [U] - Aggregate stats
                • total_sessions
                • total_duration
                • avg_rpe
                • sessions_this_week
```

**Load Calculation (per FEATURE_DOCUMENTATION.md §2)**:
```typescript
Session Load (AU) = Duration (min) × RPE × Type Multiplier

Type Multipliers:
- High Intensity Training: 1.2
- Speed/Agility: 1.1
- Strength Training: 1.0
- Technical/Skills: 0.8
- Recovery/Mobility: 0.5
```

**Tables Involved**: `workout_logs`, `exercise_logs`, `load_monitoring`, `training_load_metrics`, `player_streaks`, `player_training_stats`  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §2 Training Schedule](#)

---

### 2.3 Today's Practice

**User Flow**: User opens Today → Sees daily protocol → Marks exercises complete

```
[Today Page Load]
    │
    ├──(GET /api/today/schedule)
    │      │
    │      ├──→ {daily_training_schedule} [R] - Today's plan
    │      │    • user_id + date filter
    │      │
    │      ├──→ {training_session_templates} [R] - Session details
    │      │
    │      ├──→ {exercises} [R] - Exercise library
    │      │
    │      ├──→ {training_videos} [R] - YouTube links
    │      │
    │      └──→ {daily_protocols} [R] - Recovery protocols
    │
    └──(User Marks Exercise Complete)
           │
           └──→ {exercise_logs} [C] - Track completion
                • exercise_id
                • completed_at
                • actual_sets/reps
```

**Tables Involved**: `daily_training_schedule`, `training_session_templates`, `exercises`, `training_videos`, `daily_protocols`, `exercise_logs`

---

### 2.4 Exercise Library Access

**User Flow**: User browses exercises → Filters by type/position → Views details

```
[Exercise Library]
    │
    └──(GET /api/exercises)
           │
           ├──→ {exercises} [R] - Core exercises (21)
           │    • name, description
           │    • category, difficulty
           │    • equipment_required
           │
           ├──→ {plyometrics_exercises} [R] - Plyometric library (90)
           │    • exercise_name
           │    • intensity_level
           │    • primary_muscles
           │    • position_relevance
           │
           ├──→ {isometrics_exercises} [R] - Isometric library (23)
           │    • exercise_name
           │    • hold_duration
           │    • target_muscles
           │
           ├──→ {exercise_progressions} [R] - Progression paths
           │
           └──→ {exercise_substitutions} [R] - Alternative exercises
```

**Tables Involved**: `exercises`, `plyometrics_exercises`, `isometrics_exercises`, `exercise_progressions`, `exercise_substitutions`  
**RLS**: Public read for exercise libraries

---

## 3. Load Monitoring & ACWR

### 3.1 ACWR Dashboard View

**User Flow**: User opens ACWR Dashboard → Views current ratio → Sees risk zone

```
[ACWR Dashboard Load]
    │
    └──(GET /api/load-management/acwr)
           │
           ├──→ {load_monitoring} [R] - Last 28 days of load
           │    • user_id
           │    • date
           │    • session_load
           │
           ├──→ {training_load_metrics} [R] - Calculated metrics
           │    • acute_load (7-day sum)
           │    • chronic_load (28-day avg)
           │    • acwr_ratio
           │    • monotony
           │    • strain
           │
           ├──→ {readiness_scores} [R] - Latest readiness
           │    • readiness_score
           │    • factors
           │
           └──→ {injury_risk_flags} [R] - Active risk flags
                • flag_type
                • severity
                • created_at
```

**ACWR Calculation (per FEATURE_DOCUMENTATION.md §5)**:
```typescript
// Standard Rolling Average
Acute Load = Sum(last 7 days load) / 7
Chronic Load = Sum(last 28 days load) / 28
ACWR = Acute Load / Chronic Load

// EWMA Variant (used in app)
λ = 2 / (N + 1), where N = 28
EWMA Chronic = (Today's Load × λ) + ((1 - λ) × Yesterday's EWMA)
```

**Risk Zones**:
| ACWR Range | Zone | Color | Injury Risk |
|------------|------|-------|-------------|
| < 0.80 | Under-training | Blue | Deconditioning |
| 0.80-1.30 | Sweet Spot | Green | Minimal |
| 1.30-1.50 | Caution | Yellow | +25-50% |
| > 1.50 | Danger | Red | +200-400% |

**Tables Involved**: `load_monitoring`, `training_load_metrics`, `readiness_scores`, `injury_risk_flags`  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §5 ACWR Dashboard](#)

---

### 3.2 Load Alert Generation

**System Flow**: After each training log → Check thresholds → Generate alerts

```
[Training Logged] ─→ (Trigger)
    │
    └──(Background Job)
           │
           ├──→ {training_load_metrics} [R] - Get current ACWR
           │
           ├──→ {load_caps} [R] - User's load limits
           │    • max_daily_load
           │    • max_weekly_load
           │
           └──(If threshold exceeded)
                  │
                  ├──→ {injury_risk_flags} [C] - Create flag
                  │    • user_id
                  │    • flag_type ('acwr_high' | 'monotony_high' | 'strain_high')
                  │    • severity ('warning' | 'critical')
                  │    • acwr_value
                  │
                  └──→ {notifications} [C] - Alert notification
                       • user_id
                       • type: 'load_alert'
                       • title, message
                       • priority: 'high'
```

**Tables Involved**: `training_load_metrics`, `load_caps`, `injury_risk_flags`, `notifications`

---

## 4. Wellness & Recovery

### 4.1 Daily Wellness Check-in

**User Flow**: User completes wellness form → Scores calculated → Readiness updated

```
[Wellness Check-in Form]
    │
    └──(POST /api/wellness/checkin)
           │
           ├──→ {wellness_entries} [C] - Raw wellness data
           │    • user_id
           │    • date
           │    • sleep_hours
           │    • sleep_quality (1-10)
           │    • energy_level (1-10)
           │    • muscle_soreness (1-10)
           │    • mood (1-10)
           │    • stress_level (1-10)
           │    • motivation (1-10)
           │    • hydration_glasses
           │    • resting_heart_rate
           │
           ├──→ {readiness_scores} [C/U] - Calculated readiness
           │    • user_id
           │    • date
           │    • readiness_score (0-100)
           │    • status ('excellent' | 'good' | 'moderate' | 'poor')
           │    • factors (JSON breakdown)
           │
           ├──→ {daily_wellness_checkin} [C] - Daily snapshot
           │    • Aggregated wellness state
           │
           └──→ {hrv_readings} [C] (if HRV provided)
                • user_id
                • hrv_value
                • measured_at
```

**Wellness Score Calculation (per FEATURE_DOCUMENTATION.md §4)**:
```typescript
Wellness Score = Weighted Average of:
  - Sleep Hours: 20% (normalized to 7-9 optimal)
  - Sleep Quality: 15%
  - Energy: 15%
  - Soreness: 15% (inverted)
  - Mood: 10%
  - Stress: 10% (inverted)
  - Motivation: 10%
  - Hydration: 5% (normalized to 8+ glasses)
```

**Tables Involved**: `wellness_entries`, `readiness_scores`, `daily_wellness_checkin`, `hrv_readings`  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §4 Wellness & Recovery](#)

---

### 4.2 Sleep Tracking

**User Flow**: User logs sleep → Trends analyzed → Recommendations generated

```
[Sleep Log Entry]
    │
    └──(POST /api/wellness/sleep)
           │
           ├──→ {wellness_entries} [C/U] - Sleep fields
           │    • sleep_hours
           │    • sleep_quality
           │    • bedtime
           │    • wake_time
           │
           └──(Background Analysis)
                  │
                  ├──→ {sleep_guidelines} [R] - Evidence-based targets
                  │
                  └──→ {sleep_optimization_protocols} [R] - Recommendations
```

**Tables Involved**: `wellness_entries`, `sleep_guidelines`, `sleep_optimization_protocols`

---

### 4.3 Recovery Session Logging

**User Flow**: User completes recovery → Logs protocol → Progress tracked

```
[Recovery Log Form]
    │
    └──(POST /api/recovery/log)
           │
           ├──→ {recovery_sessions} [C]
           │    • user_id
           │    • protocol_type
           │    • duration_minutes
           │    • perceived_effectiveness (1-10)
           │    • notes
           │
           ├──→ {protocol_completions} [C] - Track completion
           │    • protocol_id
           │    • completed_at
           │
           └──→ {athlete_recovery_profiles} [U] - Update preferences
                • preferred_protocols
                • recovery_history
```

**Tables Involved**: `recovery_sessions`, `protocol_completions`, `athlete_recovery_profiles`

---

## 5. AI Coaching (Merlin)

### 5.1 AI Chat Session

**User Flow**: User asks Merlin → Safety check → Response generated → Saved

```
[AI Chat Input]
    │
    └──(POST /api/ai/chat)
           │
           ├──(STEP 1: Safety Classification)
           │    │
           │    ├──→ {chatbot_response_filters} [R] - Keyword filters
           │    │
           │    └──→ Risk Tier Assignment:
           │         • Tier 1 (Low): technique, warm-up, drills
           │         • Tier 2 (Medium): injury, recovery, pain
           │         • Tier 3 (High): supplements, dosage, medical
           │
           ├──(STEP 2: ACWR Safety Override)
           │    │
           │    ├──→ {training_load_metrics} [R] - Current ACWR
           │    │
           │    └──→ If ACWR > 1.5 AND high-intensity query:
           │         • BLOCK recommendation
           │         • Return safety message
           │
           ├──(STEP 3: Context Building)
           │    │
           │    ├──→ {chatbot_user_context} [R] - User history
           │    ├──→ {chatbot_user_state} [R] - Current state
           │    └──→ {ai_chat_sessions} [R] - Previous messages
           │
           ├──(STEP 4: Knowledge Search)
           │    │
           │    └──→ {knowledge_base_entries} [R] - 27 entries
           │         • topic, category
           │         • content, source
           │         • evidence_grade
           │
           ├──(STEP 5: LLM Generation)
           │    │
           │    └──→ Groq API (Llama 3.1 70B)
           │
           ├──(STEP 6: Save Interaction)
           │    │
           │    ├──→ {ai_chat_sessions} [C/U] - Session
           │    │    • user_id
           │    │    • started_at
           │    │    • context_snapshot (JSON)
           │    │
           │    ├──→ {ai_messages} [C] - Message pair
           │    │    • session_id
           │    │    • role ('user' | 'assistant')
           │    │    • content
           │    │    • safety_tier (1-3)
           │    │    • created_at
           │    │
           │    └──→ {ai_recommendations} [C] (if actionable)
           │         • user_id
           │         • recommendation_type
           │         • content
           │         • status ('pending' | 'accepted' | 'dismissed')
           │
           └──(STEP 7: Coach Visibility)
                  │
                  └──→ {ai_coach_visibility} [C] (if Tier 2/3)
                       • coach_user_id
                       • athlete_user_id
                       • message_id
                       • reason ('safety_tier_2' | 'safety_tier_3')
```

**Tables Involved**: `chatbot_response_filters`, `training_load_metrics`, `chatbot_user_context`, `chatbot_user_state`, `ai_chat_sessions`, `knowledge_base_entries`, `ai_messages`, `ai_recommendations`, `ai_coach_visibility`  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §17 AI Coach (Merlin)](#)

---

### 5.2 AI Feedback Submission

**User Flow**: User rates AI response → Feedback saved → ML training data

```
[Feedback UI]
    │
    └──(POST /api/ai/feedback)
           │
           ├──→ {ai_feedback} [C]
           │    • message_id (FK)
           │    • user_id
           │    • rating (1-5)
           │    • helpful (boolean)
           │    • feedback_text
           │    • created_at
           │
           └──→ {ml_training_data} [C] (if helpful for training)
                • input_text
                • output_text
                • quality_score
```

**Tables Involved**: `ai_feedback`, `ml_training_data`

---

## 6. Team Management

### 6.1 Roster Management

**User Flow**: Coach views roster → Adds/edits players → Manages positions

```
[Roster Page Load]
    │
    └──(GET /api/team/roster)
           │
           ├──→ {teams} [R] - Team info
           │    • team_name
           │    • season
           │    • record
           │
           ├──→ {team_members} [R] - Membership
           │    • user_id
           │    • role ('player' | 'coach' | 'staff')
           │    • joined_at
           │
           ├──→ {team_players} [R] - Player details
           │    • jersey_number
           │    • position_id
           │    • status ('active' | 'injured' | 'inactive')
           │
           ├──→ {user_profiles} [R] - Player profiles
           │
           ├──→ {positions} [R] - Position definitions (7)
           │
           └──→ {player_position_history} [R] - Position changes
```

**Adding Player**:
```
[Add Player Form]
    │
    └──(POST /api/team/players)
           │
           ├──→ {team_invitations} [C] - Send invite
           │    • team_id
           │    • invited_email
           │    • role
           │    • expires_at
           │
           └──(When Accepted)
                  │
                  ├──→ {team_members} [C]
                  ├──→ {team_players} [C]
                  └──→ {roster_audit_log} [C] - Track change
```

**Tables Involved**: `teams`, `team_members`, `team_players`, `user_profiles`, `positions`, `player_position_history`, `team_invitations`, `roster_audit_log`  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §11 Roster Management](#)

---

### 6.2 Depth Chart Management

**User Flow**: Coach opens depth chart → Assigns positions → Saves configuration

```
[Depth Chart Page]
    │
    ├──(GET /api/team/depth-chart)
    │      │
    │      ├──→ {depth_chart_templates} [R] - Position slots
    │      │    • position_id
    │      │    • string_number (1st, 2nd, 3rd)
    │      │
    │      └──→ {depth_chart_entries} [R] - Current assignments
    │           • template_id
    │           • player_id
    │           • rank
    │
    └──(Save Changes)
           │
           ├──→ {depth_chart_entries} [U] - Update assignments
           │
           └──→ {depth_chart_history} [C] - Track changes
                • changed_by
                • previous_state
                • new_state
                • reason
```

**Tables Involved**: `depth_chart_templates`, `depth_chart_entries`, `depth_chart_history`  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §12 Depth Chart](#)

---

### 6.3 Attendance Tracking

**User Flow**: Coach creates event → Players RSVP → Attendance recorded

```
[Create Event]
    │
    └──(POST /api/team/events)
           │
           └──→ {team_events} [C]
                • team_id
                • event_type ('practice' | 'game' | 'meeting')
                • title
                • start_time, end_time
                • location
                • required (boolean)

[Player RSVP]
    │
    └──(POST /api/attendance/rsvp)
           │
           └──→ {attendance_records} [C/U]
                • event_id
                • user_id
                • status ('confirmed' | 'declined' | 'maybe')
                • responded_at

[Coach Takes Attendance]
    │
    └──(POST /api/attendance/record)
           │
           ├──→ {attendance_records} [U]
           │    • actual_status ('present' | 'late' | 'absent' | 'excused')
           │    • arrived_at
           │    • notes
           │
           └──→ {player_attendance_stats} [U] - Aggregate stats
                • attendance_rate
                • total_events
                • absences
```

**Tables Involved**: `team_events`, `attendance_records`, `player_attendance_stats`  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §13 Attendance Tracking](#)

---

## 7. Competition & Tournaments

### 7.1 Game Tracking

**User Flow**: Coach creates game → Logs plays → Records stats

```
[Create Game]
    │
    └──(POST /api/games)
           │
           └──→ {games} [C]
                • team_id
                • opponent_name
                • game_date
                • location
                • game_type ('regular' | 'playoff' | 'tournament')
                • status ('scheduled' | 'in_progress' | 'completed')

[Log Play]
    │
    └──(POST /api/games/{id}/plays)
           │
           ├──→ {game_plays} [C]
           │    • game_id
           │    • play_number
           │    • play_type
           │    • down, distance
           │    • result
           │    • yards_gained
           │    • players_involved (array)
           │
           └──→ {game_events} [C]
                • game_id
                • event_type ('touchdown' | 'interception' | 'flag_pull')
                • player_id
                • quarter, time

[Game Complete]
    │
    └──(PUT /api/games/{id}/complete)
           │
           ├──→ {games} [U]
           │    • status: 'completed'
           │    • final_score_us
           │    • final_score_them
           │    • result ('win' | 'loss' | 'tie')
           │
           └──→ {player_game_stats_aggregated} [C] - Per-player stats
                • player_id
                • game_id
                • passing_yards, rushing_yards
                • touchdowns, interceptions
                • flag_pulls, sacks
```

**Tables Involved**: `games`, `game_plays`, `game_events`, `player_game_stats_aggregated`  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §9 Game Tracker](#)

---

### 7.2 Tournament Management

**User Flow**: Coach registers for tournament → Manages logistics → Tracks results

```
[Tournament Registration]
    │
    └──(POST /api/tournaments/register)
           │
           ├──→ {tournaments} [C/R] - Tournament record
           │    • tournament_name
           │    • location
           │    • start_date, end_date
           │    • format
           │
           ├──→ {tournament_participation} [C]
           │    • tournament_id
           │    • team_id
           │    • registration_status
           │    • seed
           │
           ├──→ {tournament_budgets} [C] - Financial planning
           │    • tournament_id
           │    • team_id
           │    • estimated_cost
           │    • actual_cost
           │
           └──→ {player_tournament_availability} [C bulk] - Per-player
                • player_id
                • tournament_id
                • available (boolean)
                • notes
```

**Tables Involved**: `tournaments`, `tournament_participation`, `tournament_budgets`, `player_tournament_availability`  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §10 Tournaments](#)

---

## 8. Nutrition System

### 8.1 Nutrition Profile Setup

**User Flow**: User sets up nutrition profile → Goals calculated → Plan generated

```
[Nutrition Profile Form]
    │
    └──(POST /api/nutrition/profile)
           │
           ├──→ {athlete_nutrition_profiles} [C/U]
           │    • user_id
           │    • weight_kg, height_cm
           │    • body_fat_percentage
           │    • activity_level
           │    • goal ('maintain' | 'lose_fat' | 'gain_muscle')
           │    • calculated_bmr
           │    • calculated_tdee
           │    • protein_target_g
           │    • carbs_target_g
           │    • fat_target_g
           │
           └──→ {nutrition_goals} [C/U]
                • user_id
                • daily_calories
                • protein_g
                • carbs_g
                • fat_g
```

**Calculation (Athletes Plate Method)**:
```typescript
// Based on training day type
Easy Day: 50% vegetables, 25% protein, 25% carbs
Moderate Day: 33% each category
Hard Day: 50% carbs, 25% protein, 25% vegetables

// Macro calculations
BMR = Mifflin-St Jeor formula
TDEE = BMR × Activity Multiplier
Protein = 1.6-2.2g per kg body weight
```

**Tables Involved**: `athlete_nutrition_profiles`, `nutrition_goals`  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §8 Tournament Nutrition](#)

---

### 8.2 Food Logging

**User Flow**: User logs meal → Searches USDA database → Nutrients calculated

```
[Food Search]
    │
    └──(GET /api/nutrition/search?q=chicken)
           │
           └──→ {usda_foods} [R] - USDA FoodData Central
                • fdc_id
                • description
                • calories_per_100g
                • protein_g, carbs_g, fat_g
                • fiber_g, sugar_g

[Log Meal]
    │
    └──(POST /api/nutrition/log)
           │
           └──→ {nutrition_logs} [C]
                • user_id
                • meal_type ('breakfast' | 'lunch' | 'dinner' | 'snack')
                • food_name
                • fdc_id (optional FK)
                • serving_size
                • serving_unit
                • calories
                • protein_g, carbs_g, fat_g
                • logged_at
```

**Tables Involved**: `usda_foods`, `nutrition_logs`

---

### 8.3 Hydration Tracking

**User Flow**: User logs water intake → Progress tracked → Alerts if low

```
[Log Hydration]
    │
    └──(POST /api/nutrition/hydration-log)
           │
           ├──→ {hydration_logs} [C]
           │    • user_id
           │    • date
           │    • amount_ml
           │    • source ('water' | 'sports_drink' | 'other')
           │    • logged_at
           │
           └──(Check Daily Total)
                  │
                  └──(If below target)
                         │
                         └──→ {notifications} [C]
                              • type: 'hydration_reminder'
```

**Tables Involved**: `hydration_logs`, `notifications`

---

### 8.4 Supplement Tracking

**User Flow**: User logs supplements → Safety checked → WADA compliance verified

```
[Log Supplement]
    │
    └──(POST /api/nutrition/supplements)
           │
           ├──→ {supplements} [R] - Supplement database (8)
           │    • name
           │    • category
           │    • ais_grade ('A' | 'B' | 'C' | 'D')
           │
           ├──→ {supplement_wada_compliance} [R] - WADA status
           │    • supplement_id
           │    • wada_status ('permitted' | 'prohibited' | 'check')
           │    • last_verified
           │
           ├──→ {supplement_interactions} [R] - Drug interactions
           │
           └──→ {supplement_logs} [C]
                • user_id
                • supplement_id
                • dosage_mg
                • time_taken
                • notes
```

**Tables Involved**: `supplements`, `supplement_wada_compliance`, `supplement_interactions`, `supplement_logs`  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §25 Supplement Tracker](#)

---

## 9. Analytics & Reporting

### 9.1 Performance Analytics Dashboard

**User Flow**: User views analytics → Selects date range → Sees trends

```
[Analytics Page Load]
    │
    └──(GET /api/analytics/performance)
           │
           ├──→ {workout_logs} [R] - Training history
           │
           ├──→ {load_monitoring} [R] - Load data
           │
           ├──→ {wellness_entries} [R] - Wellness trends
           │
           ├──→ {player_game_stats_aggregated} [R] - Game performance
           │
           ├──→ {performance_metrics} [R] - Calculated metrics
           │    • weekly_volume
           │    • intensity_distribution
           │    • recovery_quality
           │
           └──→ {training_analytics} [R] - Pre-calculated aggregates
                • period (week/month/year)
                • total_load
                • avg_rpe
                • completion_rate
```

**Tables Involved**: `workout_logs`, `load_monitoring`, `wellness_entries`, `player_game_stats_aggregated`, `performance_metrics`, `training_analytics`  
**Cross-ref**: [FEATURE_DOCUMENTATION.md §16 Analytics](#)

---

### 9.2 Coach Team Analytics

**User Flow**: Coach views team dashboard → Sees at-risk players → Drills down

```
[Coach Dashboard Load]
    │
    └──(GET /api/coach/team-analytics)
           │
           ├──→ {team_members} [R] - All team players
           │
           ├──→ {training_load_metrics} [R] - Per-player ACWR
           │
           ├──→ {readiness_scores} [R] - Per-player readiness
           │
           ├──→ {injury_risk_flags} [R] - Active alerts
           │
           ├──→ {team_readiness_dashboard} [R] - Team aggregate
           │    • team_avg_readiness
           │    • players_at_risk_count
           │    • injured_count
           │
           └──→ {team_chemistry_metrics} [R] - Team health
```

**Tables Involved**: `team_members`, `training_load_metrics`, `readiness_scores`, `injury_risk_flags`, `team_readiness_dashboard`, `team_chemistry_metrics`

---

## 10. Notifications System

### 10.1 Notification Delivery Flow

```
[Event Trigger]
    │
    ├──(Training Logged)
    ├──(ACWR Threshold)
    ├──(Wellness Reminder)
    ├──(Team Event)
    ├──(AI Coach Alert)
    │
    └──(Notification Service)
           │
           ├──→ {notifications} [C] - In-app notification
           │    • user_id
           │    • type
           │    • title, message
           │    • priority ('low' | 'medium' | 'high')
           │    • read (boolean)
           │    • action_url
           │    • created_at
           │
           ├──→ {push_notification_queue} [C] - Push queue
           │    • notification_id
           │    • status ('pending' | 'sent' | 'failed')
           │
           └──→ {push_notification_tokens} [R] - Device tokens
                • user_id
                • token
                • platform ('ios' | 'android' | 'web')
```

**Tables Involved**: `notifications`, `push_notification_queue`, `push_notification_tokens`, `notification_preferences`

---

## 11. Privacy & Compliance

### 11.1 GDPR Consent Flow

```
[User Registration/Settings]
    │
    └──(Consent Collection)
           │
           ├──→ {gdpr_consent} [C/U]
           │    • user_id
           │    • consent_type
           │    • consented (boolean)
           │    • consent_date
           │    • ip_address
           │    • consent_text_version
           │
           └──→ {gdpr_data_processing_log} [C] - Audit trail
                • user_id
                • operation_type
                • data_categories
                • legal_basis
                • processed_at
```

### 11.2 Data Export (GDPR Right to Portability)

```
[User Requests Export]
    │
    └──(GET /api/user/export-data)
           │
           ├──→ {users} [R]
           ├──→ {user_profiles} [R]
           ├──→ {workout_logs} [R]
           ├──→ {wellness_entries} [R]
           ├──→ {nutrition_logs} [R]
           ├──→ {ai_messages} [R] (user's messages only)
           └──→ {game_plays} [R] (where user involved)
```

### 11.3 Account Deletion

```
[User Requests Deletion]
    │
    └──(POST /api/user/delete-account)
           │
           ├──→ {account_deletion_requests} [C]
           │    • user_id
           │    • requested_at
           │    • scheduled_deletion_date (30 days)
           │    • status ('pending' | 'completed' | 'cancelled')
           │
           └──(After 30 days - Background Job)
                  │
                  ├──→ {users} [D] - Cascade delete
                  ├──→ {user_profiles} [D]
                  ├──→ {workout_logs} [D]
                  ├──→ {wellness_entries} [D]
                  ├──→ {nutrition_logs} [D]
                  ├──→ {ai_messages} [Anonymize]
                  └──→ {gdpr_data_processing_log} [C] - Record deletion
```

**Tables Involved**: `gdpr_consent`, `gdpr_data_processing_log`, `account_deletion_requests`  
**Cross-ref**: [RUNBOOKS/ACCOUNT_DELETION.md](#)

---

## 12. Row Level Security (RLS) Summary

### Access Patterns by Role

| Table Category | Player Access | Coach Access | Admin Access |
|---------------|---------------|--------------|--------------|
| Own user data | ✅ Full CRUD | ✅ Full CRUD | ✅ Full CRUD |
| Own training data | ✅ Full CRUD | ✅ Full CRUD | ✅ Full CRUD |
| Own wellness data | ✅ Full CRUD | ✅ Full CRUD | ✅ Full CRUD |
| Team roster | ✅ Read own team | ✅ Full CRUD own team | ✅ All teams |
| Other player's training | ❌ Denied | ✅ Read (team members) | ✅ All |
| Other player's wellness | ❌ Denied | ✅ Read (with consent) | ✅ All |
| AI chat (own) | ✅ Full CRUD | ✅ Full CRUD | ✅ Full CRUD |
| AI chat (other) | ❌ Denied | ✅ Read (Tier 2/3 only) | ✅ All |
| Exercise libraries | ✅ Read only | ✅ Read only | ✅ Full CRUD |
| Research studies | ✅ Read only | ✅ Read only | ✅ Full CRUD |

### Key RLS Policies

```sql
-- User owns data
CREATE POLICY "Users can manage own data" ON wellness_entries
  FOR ALL USING (auth.uid() = user_id);

-- Coach can view team data
CREATE POLICY "Coaches can view team wellness" ON wellness_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm1
      JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
      AND tm1.role = 'coach'
      AND tm2.user_id = wellness_entries.user_id
    )
    AND EXISTS (
      SELECT 1 FROM athlete_consent_settings
      WHERE user_id = wellness_entries.user_id
      AND coach_can_view_wellness = true
    )
  );

-- Public reference data
CREATE POLICY "Public read for exercises" ON exercises
  FOR SELECT USING (true);
```

**Cross-ref**: [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md)

---

## 13. Data Validation Summary

### Frontend Validation → Backend Validation → Database Constraints

| Field | Frontend | Backend | Database |
|-------|----------|---------|----------|
| `rpe` | 1-10 slider | `parseInt`, range check | `CHECK (rpe >= 1 AND rpe <= 10)` |
| `sleep_hours` | 0-24 input | `parseFloat`, range check | `CHECK (sleep_hours >= 0 AND sleep_hours <= 24)` |
| `email` | HTML5 email | Regex validation | `UNIQUE`, format constraint |
| `user_id` | From auth | JWT validation | `REFERENCES auth.users(id)` |
| `acwr_ratio` | Calculated | Business logic | `CHECK (acwr_ratio >= 0)` |

---

## 14. Cross-Reference Checklist

### Features → Database Mapping

| # | Feature | Primary Tables | Verified |
|---|---------|----------------|----------|
| 1 | Dashboard | `users`, `training_load_metrics`, `readiness_scores` | ✅ |
| 2 | Training Schedule | `training_sessions`, `training_programs`, `workout_logs` | ✅ |
| 3 | Today's Practice | `daily_training_schedule`, `exercises`, `training_videos` | ✅ |
| 4 | Wellness | `wellness_entries`, `readiness_scores` | ✅ |
| 5 | ACWR Dashboard | `load_monitoring`, `training_load_metrics`, `injury_risk_flags` | ✅ |
| 6 | Travel Recovery | `athlete_travel_log`, `travel_protocols` | ✅ |
| 7 | Game Day Readiness | `competition_readiness`, `game_day_workflows` | ✅ |
| 8 | Tournament Nutrition | `tournament_nutrition_protocols`, `meal_templates` | ✅ |
| 9 | Game Tracker | `games`, `game_plays`, `game_events` | ✅ |
| 10 | Tournaments | `tournaments`, `tournament_participation` | ✅ |
| 11 | Roster | `teams`, `team_members`, `team_players` | ✅ |
| 12 | Depth Chart | `depth_chart_templates`, `depth_chart_entries` | ✅ |
| 13 | Attendance | `team_events`, `attendance_records` | ✅ |
| 14 | Equipment | `equipment_inventory`, `equipment_assignments` | ✅ |
| 15 | Officials | `officials`, `game_official_assignments` | ✅ |
| 16 | Analytics | `performance_metrics`, `training_analytics` | ✅ |
| 17 | AI Coach | `ai_chat_sessions`, `ai_messages`, `knowledge_base_entries` | ✅ |
| 18 | Global Search | N/A (client-side + API) | ✅ |
| 19 | Notifications | `notifications`, `push_notification_tokens` | ✅ |
| 20 | Achievements | `achievement_definitions`, `user_achievements` | ✅ |
| 21 | User Profile | `users`, `user_profiles` | ✅ |
| 22 | Settings | `user_preferences`, `notification_preferences` | ✅ |
| 23 | Onboarding | `users`, `user_profiles`, `gdpr_consent` | ✅ |
| 24 | Body Composition | `physical_measurements`, `athlete_nutrition_profiles` | ✅ |
| 25 | Supplement Tracker | `supplements`, `supplement_logs`, `supplement_wada_compliance` | ✅ |

---

## Appendix A: Table Count Summary

| Category | Table Count | Key Tables |
|----------|-------------|------------|
| Users & Auth | 15 | `users`, `user_profiles`, `gdpr_consent` |
| Training | 25 | `workout_logs`, `training_programs`, `exercises` |
| Load Monitoring | 8 | `load_monitoring`, `training_load_metrics` |
| Wellness | 12 | `wellness_entries`, `readiness_scores` |
| AI Coaching | 10 | `ai_chat_sessions`, `ai_messages`, `knowledge_base_entries` |
| Teams | 20 | `teams`, `team_members`, `depth_chart_entries` |
| Competition | 15 | `games`, `tournaments`, `game_plays` |
| Nutrition | 18 | `nutrition_logs`, `usda_foods`, `supplements` |
| Research | 8 | `research_studies`, `research_topics` |
| **Total** | **300+** | |

---

## Related Documentation

- [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md) - Complete business logic
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database setup guide
- [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md) - Security policies
- [API.md](./API.md) - API reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

---

**Last Updated**: January 2026  
**Maintainer**: Development Team
