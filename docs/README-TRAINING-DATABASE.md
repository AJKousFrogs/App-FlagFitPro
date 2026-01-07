# FlagFit Pro Training Database

## Overview

This is a comprehensive, evidence-based training database designed for flag football athletes across all positions (QB, WR, DB, Center, LB, Blitzer). The schema supports:

- **Periodization**: Macrocycles, mesocycles (phases), and microcycles (weeks)
- **Progressive Overload**: Track load progression (20% BW → 30% BW → 40% BW)
- **ACWR Monitoring**: Automatic Acute:Chronic Workload Ratio calculation for injury prevention
- **RPE Tracking**: Rate of Perceived Exertion (1-10 scale) per session
- **Position-Specific Metrics**: Flexible JSONB fields for unique metrics (QB throwing volume, WR route completion, etc.)
- **Evidence-Based Exercise Library**: 72+ exercises with research citations
- **Video Library**: Exercise demonstrations and technique videos
- **Coach-Player Collaboration**: Role-based access control

---

## Implementation Status

> **Last Verified**: December 28, 2025  
> **Database Row Counts**: Based on actual Supabase query results

### ✅ Fully Implemented
| Component | Status | File | Data Count |
|-----------|--------|------|------------|
| Core Training Tables | ✅ Complete | Multiple migrations | See below |
| `positions` table | ✅ Complete | `create-training-schema.sql` | 7 positions |
| `training_programs` table | ✅ Complete | `create-training-schema.sql` | 1 program |
| `training_phases` table | ✅ Complete | `create-training-schema.sql` | 10 phases |
| `training_weeks` table | ✅ Complete | `create-training-schema.sql` | 16 weeks |
| `exercises` table | ✅ Complete | `create-training-schema.sql` | 21 exercises |
| `session_exercises` table | ✅ Complete | `create-training-schema.sql` | 15 links |
| `workout_logs` table | ✅ Complete | `create-training-schema.sql` | 3 logs |
| `load_monitoring` table | ✅ Complete | `create-training-schema.sql` | 0 records |
| `plyometrics_exercises` table | ✅ Complete | Migration files | 90 exercises |
| `isometrics_exercises` table | ✅ Complete | Migration files | 23 exercises |
| `training_videos` table | ✅ Complete | `create-training-schema.sql` | 0 videos |
| RLS Policies (Coach/Player/Admin) | ✅ Complete | `supabase-rls-policies.sql` | N/A |
| Angular Training Services | ✅ Complete | `training-program.service.ts` | N/A |
| Evidence Knowledge Base | ✅ Complete | Migration 028 | N/A |

### ⚠️ Partially Implemented
| Component | Status | Notes |
|-----------|--------|-------|
| `training_sessions` table | 🔶 Table exists, no data | 0 sessions seeded |
| QB Program Sessions | 🔶 Structure only | Sessions from seed file not applied |
| Video Library | 🔶 Table exists | 0 video URLs seeded |
| ACWR Functions | 🔶 Defined in schema file | **Not deployed to Supabase** |
| ACWR Trigger | 🔶 Defined in schema file | **Not deployed to Supabase** |
| `player_programs` table | ❌ Missing | Table does not exist |
| `position_specific_metrics` table | ❌ Missing | Table does not exist |
| `exercise_logs` table | ❌ Missing | Table does not exist |

### ❌ Not Yet Implemented
| Component | Priority | Notes |
|-----------|----------|-------|
| ACWR Functions (`calculate_daily_load`, etc.) | 🔴 HIGH | Functions defined but NOT in database |
| `trigger_update_load_monitoring` | 🔴 HIGH | Trigger defined but NOT in database |
| `player_programs` table | 🔴 HIGH | Table does not exist in database |
| `position_specific_metrics` table | 🔴 HIGH | Table does not exist in database |
| `exercise_logs` table | 🔴 HIGH | Table does not exist in database |
| WR/DB Training Program | 🟡 MEDIUM | Position-specific program needed |
| Center/LB/Blitzer Programs | 🟢 LOW | Can be added later |
| Training Sessions Seed Data | 🟡 MEDIUM | Seed file exists but not applied |

---

## Exercise Database Summary

### Total Evidence-Based Exercises: 113+ (90 plyometrics + 23 isometrics)

| Category | Total | Beginner | Intermediate | Advanced | Elite | Avg Rating |
|----------|-------|----------|--------------|----------|-------|------------|
| **Acceleration Training** | 11 | 4 | 7 | 0 | 0 | 8.5/10 |
| **Fast-Twitch Development** | 11 | 4 | 6 | 1 | 0 | 8.4/10 |
| **Deceleration Training** | 9 | 0 | 5 | 4 | 0 | 9.0/10 |
| **First-Step Acceleration** | 9 | 0 | 7 | 2 | 0 | 8.7/10 |
| **Single-Leg Plyometrics** | 9 | 0 | 3 | 5 | 1 | 8.7/10 |
| **Reactive Eccentrics** | 9 | 2 | 4 | 3 | 0 | 8.2/10 |
| **Rotational Power** | 4 | 0 | 4 | 0 | 0 | 8.5/10 |
| **Sprint Mechanics** | 4 | 1 | 2 | 1 | 0 | 8.3/10 |
| **Eccentric Strength** | 3 | 1 | 2 | 0 | 0 | 9.7/10 |
| **Lateral Power** | 3 | 0 | 2 | 1 | 0 | 8.3/10 |

---

## Exercise Categories & Evidence

### 🔴 Deceleration Training (9 Exercises)

Essential for injury prevention and change of direction performance.

| Exercise | Difficulty | Rating | Research Source |
|----------|------------|--------|-----------------|
| Reactive Mirror Deceleration Drill | Advanced | 10/10 | Reactive agility research |
| Forward 3-Step Deceleration with Cones | Intermediate | 9/10 | [Prehab Guys](https://library.theprehabguys.com) |
| 3-Step Deceleration to 180° Turn | Advanced | 9/10 | [Prehab Guys](https://library.theprehabguys.com) |
| 3-Step Deceleration to Backpedal | Intermediate | 9/10 | [Prehab Guys](https://library.theprehabguys.com) |
| Single-Leg Deceleration Stick Landing | Advanced | 9/10 | ACL prevention research |
| Lateral Shuffle to Deceleration Stick | Intermediate | 9/10 | Frontal plane deceleration |
| Backpedal to Forward Sprint Transition | Intermediate | 9/10 | Multi-directional training |
| Sprint to Crossover Deceleration | Advanced | 9/10 | Game-transfer research |
| Drop Step Deceleration | Intermediate | 8/10 | Defensive movement patterns |

**Key Benefits:**
- 25-35% improvement in deceleration control
- Significant ACL injury risk reduction
- 15-22% faster direction changes

---

### 🟢 Acceleration Training (11 Exercises)

Develops explosive starts and horizontal force production.

| Exercise | Difficulty | Rating | Research Source |
|----------|------------|--------|-----------------|
| Resisted Sled Sprint (10-20m) | Intermediate | 10/10 | [Coach Athletics](https://coachathletics.com.au) |
| Bounding (Horizontal Emphasis) | Intermediate | 10/10 | [Outside Online](https://outsideonline.com) |
| Falling Start (3-Step Acceleration) | Beginner | 9/10 | [FootFitLab](https://footfitlab.com) |
| Medicine Ball Start to Sprint | Intermediate | 9/10 | [TrainHeroic](https://trainheroic.com) |
| Backward to Forward Sprint Transition | Intermediate | 9/10 | Multi-directional research |
| Wall Drill (Acceleration Mechanics) | Beginner | 8/10 | [Loren Landow](https://coachathletics.com.au) |
| Partner-Resisted A-March Drill | Intermediate | 8/10 | [Loren Landow](https://coachathletics.com.au) |
| Power Skip for Distance | Beginner | 8/10 | Sprint mechanics research |
| Push-Up Start Sprint | Intermediate | 8/10 | Ground-to-sprint transitions |
| Seated Start Sprint | Intermediate | 8/10 | Rate of force development |
| Split Stance Start Sprint | Beginner | 7/10 | Game-position starts |

**Key Benefits:**
- 25-35% increase in horizontal force
- 8-12% faster 10m sprint times
- 15-25% improvement in first-step speed

---

### 🔵 First-Step Acceleration (9 Exercises)

Develops explosive reactive first steps for game situations.

| Exercise | Difficulty | Rating | Research Source |
|----------|------------|--------|-----------------|
| Three-Point Start Sprint | Intermediate | 9/10 | [Next Level Athletics](https://nextlevelathleticsusa.com) |
| Band-Resisted First-Step Starts | Intermediate | 9/10 | [Next Level Athletics](https://nextlevelathleticsusa.com) |
| Lateral Strap Release Sprint | Advanced | 9/10 | [Relentless Athletics](https://relentlessathleticsllc.com) |
| Reactive Ball Drop Sprint | Intermediate | 9/10 | Visual-motor reaction research |
| Mirror Start Drill | Advanced | 9/10 | Reactive agility research |
| Shuffle to Sprint Transition | Intermediate | 9/10 | Defensive movement patterns |
| Lateral Kneeling Start Sprint | Intermediate | 8/10 | [TrainHeroic](https://trainheroic.com) |
| Prone Start Sprint | Intermediate | 8/10 | Ground-to-sprint transitions |
| Crossover Start Sprint | Intermediate | 8/10 | Multi-directional acceleration |

**Key Benefits:**
- 20-30% improvement in first-step speed
- 35-45% improvement in reactive first step
- 15-20% faster reaction time

---

### 🟡 Single-Leg Plyometrics (9 Exercises)

Addresses bilateral deficits and develops unilateral power.

| Exercise | Difficulty | Rating | Research Source |
|----------|------------|--------|-----------------|
| Single-Leg Depth Jump | Elite | 10/10 | Reactive strength research |
| Single-Leg Triple Hop for Distance | Advanced | 10/10 | ACL return-to-sport gold standard |
| Single-Leg Forward Bounds | Advanced | 9/10 | Horizontal power research |
| Single-Leg Diagonal Hop Matrix | Advanced | 9/10 | Multi-directional stability |
| Single-Leg Broad Jump (Stick Landing) | Advanced | 9/10 | Return-to-sport metric |
| Single-Leg Lateral Hop Series | Intermediate | 8/10 | ACL injury prevention |
| Single-Leg Hurdle Hop | Intermediate | 8/10 | Reactive strength development |
| Single-Leg Rotational Hop | Advanced | 8/10 | Transverse plane control |
| Single-Leg Pogos | Intermediate | 7/10 | Ankle stiffness foundation |

**Key Benefits:**
- 25-35% improvement in single-leg power
- Significant reduction in bilateral deficit
- Gold-standard return-to-sport assessment tools

---

### ⚡ Fast-Twitch Development (11 Exercises)

Maximizes Type II muscle fiber recruitment and explosive power.

| Exercise | Difficulty | Rating | Research Source |
|----------|------------|--------|-----------------|
| Hill Sprint (6-12% Grade) | Intermediate | 10/10 | [FootFitLab](https://footfitlab.com) |
| Contrast Training: Squat to Vertical Jump | Advanced | 10/10 | PAP (Post-Activation Potentiation) |
| Trap Bar Jump | Intermediate | 10/10 | Peak power research |
| Broad Jump to Vertical Jump | Intermediate | 9/10 | Power redirection |
| Jump Squat (Bodyweight) | Beginner | 8/10 | Ballistic training research |
| Explosive Step-Up | Intermediate | 8/10 | Unilateral power |
| Kettlebell Swing | Beginner | 8/10 | Hip extension power |
| Plyometric Push-Up | Intermediate | 8/10 | Upper body reactive power |
| Ladder Speed Drill (In-Out Pattern) | Beginner | 7/10 | [FootFitLab](https://footfitlab.com) |
| Explosive Medicine Ball Chest Pass | Beginner | 7/10 | [TrainHeroic](https://trainheroic.com) |
| Reactive Drop and Catch | Intermediate | 7/10 | Upper body reactive training |

**Key Benefits:**
- Significant Type II fiber recruitment
- 10-18% vertical jump improvement (contrast training)
- 20-30% improvement in power output

---

### 🔄 Reactive Eccentrics (9 Exercises)

Develops stretch-shortening cycle efficiency and reactive strength.

| Exercise | Difficulty | Rating | Research Source |
|----------|------------|--------|-----------------|
| Altitude Knee Lift Tuck (AKLT) | Advanced | 9/10 | Reactive strength index research |
| Reactive Single-Leg Hop Progression | Advanced | 9/10 | ACL prevention protocols |
| Hurdle Hop Series (Reactive) | Intermediate | 9/10 | Plyometric research |
| Eccentric Accentuated Split Squat Jump | Advanced | 9/10 | Eccentric training research |
| Reverse Lunge to Knee Drive Jump | Intermediate | 8/10 | Sprint acceleration |
| Tuck Jump | Intermediate | 8/10 | ACL screening tool |
| Snap Down to Vertical Jump | Intermediate | 8/10 | Reactive power |
| Pogos (Ankle Stiffness Drill) | Beginner | 7/10 | Foundation reactive drill |
| Med Ball Slam (Reactive Power) | Beginner | 7/10 | Full-body power |

**Key Benefits:**
- 18-25% improvement in reactive strength index
- 15-20% reduction in ground contact time
- Foundation for all advanced plyometrics

---

### 🌀 Rotational Power (4 Exercises)

Develops hip-to-hand power transfer for throwing and cutting.

| Exercise | Difficulty | Rating | Research Source |
|----------|------------|--------|-----------------|
| Rotational Med Ball Throw (Perpendicular) | Intermediate | 9/10 | Kinetic chain research |
| Drop-Step Scoop Throw | Intermediate | 9/10 | [Overtime Athletes](https://blog.overtimeathletes.com) |
| Landmine Press with Rotation | Intermediate | 8/10 | [Barbend](https://barbend.com) |
| Explosive Lateral Step-Up with Rotation | Intermediate | 8/10 | [PubMed 8281177](https://pubmed.ncbi.nlm.nih.gov/8281177/) |

**Key Benefits:**
- 15-25% improvement in rotational velocity
- 8-15% increase in throwing velocity
- Essential for QB throwing mechanics

---

### 🏃 Sprint Mechanics (4 Exercises)

Develops proper running form and maximum velocity mechanics.

| Exercise | Difficulty | Rating | Research Source |
|----------|------------|--------|-----------------|
| Wicket Runs (Stride Frequency Drill) | Advanced | 9/10 | Elite sprint coaching |
| A-Skip Drill | Beginner | 8/10 | Foundation sprint mechanics |
| B-Skip Drill | Intermediate | 8/10 | Foot strike mechanics |
| Straight-Leg Bounds (Stiff-Leg Running) | Intermediate | 8/10 | Pawing action development |

**Key Benefits:**
- 10-15% improvement in stride frequency
- 5-8% improvement in top speed
- Foundation for all speed development

---

### 💪 Eccentric Strength (3 Exercises)

Gold-standard injury prevention exercises with extensive research.

| Exercise | Difficulty | Rating | Research Source |
|----------|------------|--------|-----------------|
| Nordic Hamstring Curl | Intermediate | 10/10 | [PubMed 21509129](https://pubmed.ncbi.nlm.nih.gov/21509129/) - **51% hamstring injury reduction** |
| Eccentric Heel Drop (Alfredson Protocol) | Beginner | 10/10 | [PubMed 9617944](https://pubmed.ncbi.nlm.nih.gov/9617944/) - **89% Achilles success rate** |
| Copenhagen Adductor Exercise | Intermediate | 9/10 | [PubMed 28687474](https://pubmed.ncbi.nlm.nih.gov/28687474/) - **41% groin injury reduction** |

**Key Benefits:**
- 51% reduction in hamstring injuries (Nordic Curl)
- 89% success rate for Achilles tendinopathy (Alfredson)
- 41% reduction in groin injuries (Copenhagen)

---

### ↔️ Lateral Power (3 Exercises)

Develops lateral explosion for change of direction.

| Exercise | Difficulty | Rating | Research Source |
|----------|------------|--------|-----------------|
| Skater Bounds (Lateral Reactive) | Intermediate | 9/10 | Lateral power research |
| Cossack Squat to Lateral Bound | Advanced | 8/10 | Hip mobility + power |
| Banded Lateral Broad Jump | Intermediate | 8/10 | Resisted lateral training |

**Key Benefits:**
- 18-25% improvement in lateral power
- 12-18% faster change of direction
- 20-25% improvement in hip mobility

---

## Database Architecture

### Core Tables

#### 1. **positions**

Defines available positions in flag football.

```sql
- id (UUID)
- name (VARCHAR) - 'QB', 'WR', 'DB', etc.
- display_name (VARCHAR) - 'Quarterback', 'Wide Receiver', etc.
- description (TEXT)
```

#### 2. **training_programs**

Annual or seasonal training programs (e.g., "QB Annual Program 2025-2026").

```sql
- id (UUID)
- name (VARCHAR)
- position_id (UUID) → positions
- description (TEXT)
- start_date, end_date (DATE)
- created_by (UUID) → auth.users (coach)
- is_active (BOOLEAN)
```

#### 3. **training_phases**

Mesocycles within a program (Foundation, Power, Explosive, Tournament Maintenance).

```sql
- id (UUID)
- program_id (UUID) → training_programs
- name (VARCHAR) - "Foundation", "Power", etc.
- start_date, end_date (DATE)
- phase_order (INTEGER) - 1, 2, 3, 4...
- focus_areas (TEXT[]) - ['Strength', 'Speed', 'Agility']
```

#### 4. **training_weeks**

Microcycles within a phase with progressive loading.

```sql
- id (UUID)
- phase_id (UUID) → training_phases
- week_number (INTEGER)
- start_date, end_date (DATE)
- load_percentage (DECIMAL) - 20.00, 30.00, 40.00 (% of body weight)
- volume_multiplier (DECIMAL) - 1.0 → 1.5 → 2.0 → 3.2 (for throwing volume)
- focus (VARCHAR) - "Foundation week", "Deload week"
```

#### 5. **exercises**

Exercise library with position-specific tagging.

```sql
- id (UUID)
- name (VARCHAR)
- category (VARCHAR) - 'Strength', 'Speed', 'Agility', 'Position-Specific'
- movement_pattern (VARCHAR) - '3-step acceleration', 'Deceleration', 'Lateral'
- description (TEXT)
- video_url (VARCHAR)
- equipment_needed (TEXT[])
- position_specific (BOOLEAN)
- applicable_positions (UUID[]) - Array of position IDs
- metrics_tracked (TEXT[]) - ['Reps', 'Sets', 'Weight', 'Throws']
```

#### 6. **plyometrics_exercises** ✅ IMPLEMENTED (90 exercises)

Comprehensive plyometric and speed exercise library with research citations.

```sql
- id (UUID)
- exercise_name (TEXT)
- exercise_category (TEXT) - 'Deceleration Training', 'Acceleration Training', etc.
- difficulty_level (TEXT) - 'Beginner', 'Intermediate', 'Advanced', 'Elite'
- description (TEXT)
- instructions (ARRAY TEXT[]) - Step-by-step instructions
- research_based (BOOLEAN)
- intensity_level (TEXT)
- volume_recommendations (ARRAY TEXT[])
- rest_periods (ARRAY TEXT[])
- progression_guidelines (ARRAY TEXT[])
- safety_notes (ARRAY TEXT[])
- contraindications (ARRAY TEXT[])
- proper_form_guidelines (ARRAY TEXT[])
- common_mistakes (ARRAY TEXT[])
- applicable_sports (ARRAY TEXT[])
- position_specific (BOOLEAN)
- position_applications (JSONB) - Position-specific benefits
- equipment_needed (ARRAY TEXT[])
- space_requirements (TEXT)
- surface_requirements (TEXT)
- effectiveness_rating (INTEGER) - 1-10
- performance_improvements (JSONB) - Expected improvements with percentages
- injury_risk_rating (TEXT)
- video_url (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 7. **isometrics_exercises** ✅ IMPLEMENTED (23 exercises)

Isometric exercise library for injury prevention and strength.

```sql
- id (UUID)
- name (TEXT)
- category (TEXT)
- protocol_type (TEXT)
- difficulty_level (TEXT)
- description (TEXT)
- injury_prevention_benefits (TEXT)
- duration_seconds (INTEGER)
- sets (INTEGER)
- rest_seconds (INTEGER)
- equipment_needed (ARRAY TEXT[])
- muscle_groups (ARRAY TEXT[])
- video_url (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 8. **training_sessions**

Individual training sessions within a week.

```sql
- id (UUID)
- week_id (UUID) → training_weeks
- session_name (VARCHAR) - "Morning Routine", "Speed Session"
- session_type (VARCHAR) - 'Strength', 'Speed', 'Skill', 'Recovery'
- day_of_week (INTEGER) - 0=Monday, 6=Sunday
- session_order (INTEGER) - 1=Morning, 2=Afternoon, 3=Evening
- duration_minutes (INTEGER)
- warm_up_protocol (TEXT)
- cool_down_protocol (TEXT)
```

#### 9. **session_exercises**

Links exercises to sessions with prescribed sets/reps/load (Many-to-Many).

```sql
- id (UUID)
- session_id (UUID) → training_sessions
- exercise_id (UUID) → exercises
- exercise_order (INTEGER)
- sets, reps (INTEGER)
- rest_seconds (INTEGER)
- load_type (VARCHAR) - 'Percentage BW', 'Fixed Weight', 'Bodyweight'
- load_value (DECIMAL) - 20.0 for 20% BW, or actual weight
- distance_meters, duration_seconds (INTEGER)
- position_specific_params (JSONB) - Flexible position-specific data
```

#### 10. **workout_logs**

Records of completed workouts by players.

```sql
- id (UUID)
- player_id (UUID) → auth.users
- session_id (UUID) → training_sessions
- completed_at (TIMESTAMPTZ)
- rpe (DECIMAL) - Rate of Perceived Exertion (1.0 - 10.0)
- duration_minutes (INTEGER)
- notes (TEXT) - Player's notes
- coach_feedback (TEXT) - Coach's feedback
```

#### 11. **exercise_logs**

Detailed logs of each exercise performed within a workout.

```sql
- id (UUID)
- workout_log_id (UUID) → workout_logs
- session_exercise_id (UUID) → session_exercises
- exercise_id (UUID) → exercises
- sets_completed, reps_completed (INTEGER)
- weight_used (DECIMAL)
- distance_completed, time_completed (INTEGER)
- performance_metrics (JSONB) - Flexible exercise-specific data
```

#### 12. **load_monitoring**

Tracks ACWR for injury prevention (auto-updated via trigger).

```sql
- id (UUID)
- player_id (UUID) → auth.users
- date (DATE)
- daily_load (INTEGER) - Total training load (RPE × duration)
- acute_load (DECIMAL) - 7-day rolling average
- chronic_load (DECIMAL) - 28-day rolling average
- acwr (DECIMAL) - Acute:Chronic Workload Ratio
- injury_risk_level (VARCHAR) - 'Low', 'Optimal', 'Moderate', 'High'
```

**ACWR Interpretation:**

- **< 0.8**: Low (detraining risk)
- **0.8 - 1.3**: Optimal (sweet spot)
- **1.3 - 1.5**: Moderate risk
- **> 1.5**: High injury risk

#### 13. **position_specific_metrics**

Flexible tracking for position-unique metrics.

```sql
- id (UUID)
- player_id (UUID) → auth.users
- workout_log_id (UUID) → workout_logs
- position_id (UUID) → positions
- metric_name (VARCHAR) - 'Throwing Volume', 'Route Completion', 'Tackles'
- metric_value (DECIMAL)
- metric_unit (VARCHAR) - 'Throws', 'Routes', 'Yards'
- date (DATE)
- weekly_total, monthly_total (DECIMAL)
```

**Example QB Metrics:**

- Throwing Volume: 100 throws, 320 throws
- Weekly Total: 310-400 throws
- Monthly Total: 1,320-1,600 throws

#### 14. **player_programs**

Assigns training programs to specific players.

```sql
- id (UUID)
- player_id (UUID) → auth.users
- program_id (UUID) → training_programs
- assigned_by (UUID) → auth.users (coach)
- start_date, end_date (DATE)
- is_active (BOOLEAN)
- compliance_rate (DECIMAL) - % of completed sessions
```

#### 15. **training_videos**

Library of training videos (exercise demos, technique, position-specific).

```sql
- id (UUID)
- title (VARCHAR)
- description (TEXT)
- video_url (VARCHAR)
- thumbnail_url (VARCHAR)
- duration_seconds (INTEGER)
- category (VARCHAR) - 'Exercise Demo', 'Technique', 'Position-Specific'
- position_id (UUID) → positions
- exercise_id (UUID) → exercises
- tags (TEXT[]) - ['QB', 'Throwing Mechanics', 'Arm Care']
- view_count (INTEGER)
```

---

## Research Sources & Citations

### Injury Prevention Research

| Study | Finding | Application |
|-------|---------|-------------|
| [PubMed 21509129](https://pubmed.ncbi.nlm.nih.gov/21509129/) | Nordic Curl: 51% hamstring injury reduction | Eccentric Strength category |
| [PubMed 28687474](https://pubmed.ncbi.nlm.nih.gov/28687474/) | Copenhagen: 41% groin injury reduction | Eccentric Strength category |
| [PubMed 9617944](https://pubmed.ncbi.nlm.nih.gov/9617944/) | Alfredson Protocol: 89% Achilles success | Eccentric Strength category |
| [PubMed 24505103](https://pubmed.ncbi.nlm.nih.gov/24505103/) | Eccentric training injury prevention | Multiple categories |

### Performance Research

| Source | Focus | Categories |
|--------|-------|------------|
| [Prehab Guys](https://library.theprehabguys.com) | Deceleration mechanics | Deceleration Training |
| [TrainHeroic](https://trainheroic.com) | Acceleration drills | Acceleration, First-Step |
| [Loren Landow](https://coachathletics.com.au) | Sprint mechanics | Acceleration Training |
| [Next Level Athletics](https://nextlevelathleticsusa.com) | First-step drills | First-Step Acceleration |
| [Relentless Athletics](https://relentlessathleticsllc.com) | Reactive training | First-Step Acceleration |
| [FootFitLab](https://footfitlab.com) | Fast-twitch development | Fast-Twitch, Acceleration |
| [STACK](https://stack.com) | Plyometrics | Multiple categories |
| [Outside Online](https://outsideonline.com) | Bounding mechanics | Acceleration Training |
| [Overtime Athletes](https://blog.overtimeathletes.com) | Rotational power | Rotational Power |
| [Barbend](https://barbend.com) | Strength training | Rotational Power |
| [PubMed 8281177](https://pubmed.ncbi.nlm.nih.gov/8281177/) | Lateral step-up research | Rotational Power |

---

## Database Functions

> ⚠️ **WARNING**: The ACWR functions below are defined in `create-training-schema.sql` but have **NOT been deployed** to the Supabase database. You need to run the migration to enable these functions.

### ACWR Calculation Functions (NOT YET DEPLOYED)

#### 1. `calculate_daily_load(player_uuid, log_date)` ❌ NOT IN DATABASE

Calculates total training load for a day (sum of RPE × duration).

```sql
SELECT calculate_daily_load('player-uuid', '2026-01-15');
-- Returns: 480 (e.g., 8 RPE × 60 min workout)
```

#### 2. `calculate_acute_load(player_uuid, reference_date)` ❌ NOT IN DATABASE

Calculates 7-day rolling average load.

```sql
SELECT calculate_acute_load('player-uuid', '2026-01-15');
-- Returns: 420.5 (average daily load over 7 days)
```

#### 3. `calculate_chronic_load(player_uuid, reference_date)` ❌ NOT IN DATABASE

Calculates 28-day rolling average load.

```sql
SELECT calculate_chronic_load('player-uuid', '2026-01-15');
-- Returns: 380.2 (average daily load over 28 days)
```

#### 4. `get_injury_risk_level(acwr_value)` ❌ NOT IN DATABASE

Determines injury risk based on ACWR.

```sql
SELECT get_injury_risk_level(1.45);
-- Returns: 'Moderate'
```

### To Deploy ACWR Functions

Run the following SQL in Supabase SQL Editor (from `create-training-schema.sql`):

```sql
-- See create-training-schema.sql for full function definitions
-- Or create a new migration: database/migrations/XXX_deploy_acwr_functions.sql
```

---

## Automatic Triggers

> ⚠️ **WARNING**: The trigger below is defined in `create-training-schema.sql` but has **NOT been deployed** to the Supabase database.

### `trigger_update_load_monitoring` ❌ NOT IN DATABASE

Automatically updates `load_monitoring` table when a workout is logged.

**What it does:**

1. Calculates daily load (RPE × duration)
2. Calculates acute load (7-day average)
3. Calculates chronic load (28-day average)
4. Calculates ACWR (acute ÷ chronic)
5. Determines injury risk level
6. Inserts/updates load_monitoring record

**Triggered by:**

- INSERT or UPDATE on `workout_logs` table

**Example:**

```sql
-- Player logs a workout
INSERT INTO workout_logs (player_id, session_id, completed_at, rpe, duration_minutes)
VALUES ('player-uuid', 'session-uuid', NOW(), 8.0, 60);

-- Trigger automatically:
-- 1. Calculates daily_load = 8.0 × 60 = 480
-- 2. Updates acute_load (7-day avg)
-- 3. Updates chronic_load (28-day avg)
-- 4. Calculates ACWR
-- 5. Determines risk level
-- 6. Inserts into load_monitoring
```

### To Deploy the Trigger

Run the trigger creation SQL from `create-training-schema.sql` in Supabase SQL Editor.

---

## Row Level Security (RLS)

### Players

- **View**: Own workout logs, assigned programs, own load data
- **Manage**: Own workout logs, exercise logs
- **Cannot**: View other players' data, modify programs

### Coaches

- **View**: All workout logs, all load data, all programs
- **Manage**: Programs, phases, weeks, sessions, exercises, videos
- **Update**: Coach feedback on workout logs
- **Cannot**: Modify player workout logs (except feedback)

### Public

- **View**: Positions, training videos, exercises, plyometrics_exercises, isometrics_exercises

> **Note**: RLS policies are defined in `supabase-rls-policies.sql` and have been applied to the database. The policies cover users, teams, training sessions, training programs, exercises, performance metrics, wellness logs, and more.

---

## Installation & Setup

### 1. Create Schema

Run in Supabase SQL Editor:

```bash
-- Step 1: Create all tables, indexes, and RLS policies
psql -f database/create-training-schema.sql

-- Step 2: Seed with QB Annual Program data
psql -f database/seed-qb-annual-program.sql
```

### 2. Verify Installation

```sql
-- Check positions (should return 7)
SELECT * FROM positions;

-- Check QB program (should return 1)
SELECT * FROM training_programs;

-- Check exercise categories in plyometrics (should return categories with 90 total)
SELECT exercise_category, COUNT(*) 
FROM plyometrics_exercises 
GROUP BY exercise_category 
ORDER BY COUNT(*) DESC;

-- Check isometrics exercises (should return 23)
SELECT COUNT(*) FROM isometrics_exercises;

-- Check training phases (should return 10)
SELECT * FROM training_phases;

-- Check training weeks (should return 16)
SELECT * FROM training_weeks;

-- NOTE: training_sessions table is currently empty (0 rows)
-- The seed file has not been applied
```

---

## Usage Examples

### Query Exercises by Category

```sql
-- Get all deceleration exercises
SELECT exercise_name, difficulty_level, effectiveness_rating, description
FROM plyometrics_exercises
WHERE exercise_category = 'Deceleration Training'
ORDER BY effectiveness_rating DESC;

-- Get beginner-friendly fast-twitch exercises
SELECT exercise_name, description, instructions
FROM plyometrics_exercises
WHERE exercise_category = 'Fast-Twitch Development'
  AND difficulty_level = 'Beginner'
ORDER BY effectiveness_rating DESC;

-- Get position-specific exercises for DB
SELECT exercise_name, exercise_category, position_applications
FROM plyometrics_exercises
WHERE position_applications ? 'DB'
ORDER BY effectiveness_rating DESC;
```

### Assign QB Program to Player

```sql
INSERT INTO player_programs (player_id, program_id, assigned_by, start_date, is_active)
VALUES (
  'player-uuid',
  '11111111-1111-1111-1111-111111111111', -- QB Annual Program
  'coach-uuid',
  '2025-12-01',
  true
);
```

### Player Logs a Workout

```sql
-- 1. Log the workout
INSERT INTO workout_logs (player_id, session_id, completed_at, rpe, duration_minutes, notes)
VALUES (
  'player-uuid',
  '55555512-5555-5555-5555-555555555512', -- Monday Lower Body
  NOW(),
  7.5, -- RPE
  65, -- minutes
  'Felt strong today. Trap bar deadlift felt easy at 20% BW.'
)
RETURNING id;

-- 2. Log individual exercises
INSERT INTO exercise_logs (workout_log_id, session_exercise_id, exercise_id, sets_completed, reps_completed, weight_used)
VALUES
  ('workout-log-uuid', 'session-ex-uuid', 'trap-bar-deadlift-uuid', 3, 8, 50.0),
  ('workout-log-uuid', 'session-ex-uuid', 'front-squat-uuid', 3, 10, 45.0);

-- 3. ACWR automatically calculated via trigger
```

### Track QB Throwing Volume

```sql
INSERT INTO position_specific_metrics (
  player_id,
  workout_log_id,
  position_id,
  metric_name,
  metric_value,
  metric_unit,
  date
)
VALUES (
  'player-uuid',
  'workout-log-uuid',
  (SELECT id FROM positions WHERE name = 'QB'),
  'Throwing Volume',
  100,
  'Throws',
  '2025-12-01'
);
```

### Coach Views Player's ACWR

```sql
SELECT
  date,
  daily_load,
  acute_load,
  chronic_load,
  acwr,
  injury_risk_level
FROM load_monitoring
WHERE player_id = 'player-uuid'
ORDER BY date DESC
LIMIT 30;
```

### Get Weekly Throwing Volume

```sql
SELECT
  DATE_TRUNC('week', date) AS week,
  SUM(metric_value) AS total_throws
FROM position_specific_metrics
WHERE player_id = 'player-uuid'
  AND metric_name = 'Throwing Volume'
GROUP BY week
ORDER BY week DESC;
```

---

## QB Annual Program Structure

### Phases

1. **Foundation** (December 2025)
   - Load: 20% → 40% BW over 4 weeks
   - Volume: 100 → 320 throws
   - Focus: Movement quality, base strength

2. **Power** (January - February 2026)
   - Emphasis on explosive movements
   - Olympic lift variations
   - Increased throwing volume

3. **Explosive** (March 2026)
   - Peak power and speed
   - Maximum throwing volume (320 throws)
   - Game simulation

4. **Tournament Maintenance** (April - June 2026)
   - In-season performance
   - Recovery protocols
   - ACWR monitoring critical

5. **Active Recovery** (July - August 2026)
   - Post-season regeneration
   - Low-intensity activities

6. **Pre-Season Preparation** (September - October 2026)
   - Return to structured training
   - Volume rebuild

### Sample Week 1 Schedule (Foundation Phase)

| Day          | Session          | Type              | Duration | Key Exercises                            |
| ------------ | ---------------- | ----------------- | -------- | ---------------------------------------- |
| Monday AM    | QB Routine       | Position-Specific | 30 min   | Mobility, arm care                       |
| Monday PM    | Lower Body       | Strength          | 60 min   | Trap bar DL, Front squat, Single-leg RDL |
| Tuesday AM   | QB Routine       | Position-Specific | 30 min   | Mobility, arm care                       |
| Tuesday PM   | Speed & Throwing | Skill             | 90 min   | 3-step accel, 40m sprints, 100 throws    |
| Wednesday AM | QB Routine       | Position-Specific | 30 min   | Mobility, arm care                       |
| Wednesday PM | Upper Body       | Strength          | 60 min   | Landmine press, Pallof press, Arm care   |
| Thursday     | Active Recovery  | Recovery          | 45 min   | Light movement, foam rolling             |
| Friday AM    | QB Routine       | Position-Specific | 30 min   | Mobility, arm care                       |
| Friday PM    | Power & Throwing | Power             | 90 min   | Med ball, Jumps, 100 throws              |

**Weekly Totals:**

- Training sessions: 7
- Throwing volume: 100 throws (Week 1 baseline)
- Strength load: 20% BW
- Total training time: ~7 hours

---

## Position-Specific Implementation

### Adding a New Position (e.g., Wide Receiver)

1. **Insert Position**

```sql
INSERT INTO positions (name, display_name, description)
VALUES ('WR', 'Wide Receiver', 'Primary pass catchers and route runners');
```

2. **Create WR-Specific Program**

```sql
INSERT INTO training_programs (name, position_id, description, start_date, end_date)
VALUES (
  'WR Speed & Route Development 2025-2026',
  (SELECT id FROM positions WHERE name = 'WR'),
  'Comprehensive WR program focusing on route precision, release technique, and top-end speed.',
  '2025-12-01',
  '2026-10-31'
);
```

3. **Create WR-Specific Exercises**

```sql
INSERT INTO exercises (name, category, position_specific, applicable_positions, metrics_tracked)
VALUES (
  'Route Tree Practice',
  'Position-Specific',
  true,
  ARRAY[(SELECT id FROM positions WHERE name = 'WR')],
  ARRAY['Routes Completed', 'Catch Rate', 'Separation Distance']
);
```

4. **Track WR-Specific Metrics**

```sql
INSERT INTO position_specific_metrics (player_id, position_id, metric_name, metric_value, metric_unit)
VALUES (
  'wr-player-uuid',
  (SELECT id FROM positions WHERE name = 'WR'),
  'Route Completion Rate',
  92.5,
  'Percentage'
);
```

---

## Best Practices

### For Coaches

1. **Progressive Loading**: Always follow periodization principles. Don't jump from 20% to 40% BW in one week.
2. **ACWR Monitoring**: Check player ACWR weekly. Keep players in 0.8-1.3 range.
3. **Position-Specific Focus**: Each position has unique demands. QB throwing volume ≠ WR route volume.
4. **Deload Weeks**: Include recovery weeks when ACWR approaches 1.5.
5. **Feedback Loop**: Provide coach feedback on workout logs regularly.
6. **Evidence-Based Selection**: Use exercises with high effectiveness ratings (8+/10) for key training goals.
7. **Injury Prevention First**: Include Nordic Curls, Copenhagen, and eccentric exercises in every program.

### For Players

1. **Accurate RPE**: Be honest with RPE ratings. This affects ACWR calculations.
2. **Log Consistently**: Log every workout, even if partial.
3. **Track Position Metrics**: QB? Log throwing volume. WR? Log route completion.
4. **Follow the Program**: Trust the periodization. Don't skip recovery days.
5. **Communication**: Add notes to workout logs about how you felt.
6. **Master Progressions**: Start with beginner exercises before advancing to intermediate/advanced.

### For Developers

1. **Use Indexes**: All foreign keys are indexed. Use them in WHERE clauses.
2. **JSONB for Flexibility**: Use `position_specific_params` in `session_exercises` for position-unique data.
3. **RLS is Enabled**: All queries automatically filtered by RLS policies.
4. **Triggers are Active**: ACWR auto-updates. Don't manually calculate.
5. **UUID Primary Keys**: Use `gen_random_uuid()` for new records.
6. **Query by Category**: Use `exercise_category` to filter plyometrics_exercises efficiently.

---

## API Integration Points

### Frontend Needs

1. **Dashboard**
   - Current ACWR status
   - Weekly training load chart
   - Upcoming sessions this week
   - Compliance rate

2. **Training Schedule** (`/training.html#schedule`)
   - Get sessions for current week
   - Filter by day of week
   - Show completed vs pending

3. **Training Programs** (`/training.html#programs`)
   - List programs for player's position
   - Show current phase and week
   - Display progress through program

4. **Training Videos** (`/training.html#videos`)
   - Browse by category
   - Filter by position
   - Link to exercises

5. **Exercise Library** (NEW)
   - Browse 72+ evidence-based exercises
   - Filter by category, difficulty, position
   - View research citations and effectiveness ratings

### Sample API Queries

#### Get Player's Current Week Sessions

```sql
SELECT
  ts.session_name,
  ts.day_of_week,
  ts.duration_minutes,
  ts.session_type,
  EXISTS(
    SELECT 1 FROM workout_logs wl
    WHERE wl.session_id = ts.id
      AND wl.player_id = 'player-uuid'
      AND DATE(wl.completed_at) = CURRENT_DATE
  ) AS completed
FROM training_sessions ts
JOIN training_weeks tw ON ts.week_id = tw.id
JOIN training_phases tp ON tw.phase_id = tp.id
JOIN training_programs prog ON tp.program_id = prog.id
JOIN player_programs pp ON pp.program_id = prog.id
WHERE pp.player_id = 'player-uuid'
  AND pp.is_active = true
  AND tw.start_date <= CURRENT_DATE
  AND tw.end_date >= CURRENT_DATE
ORDER BY ts.day_of_week, ts.session_order;
```

#### Get Session Details with Exercises

```sql
SELECT
  ts.session_name,
  ts.duration_minutes,
  ts.warm_up_protocol,
  e.name AS exercise_name,
  se.sets,
  se.reps,
  se.load_value,
  se.load_type,
  se.notes
FROM training_sessions ts
JOIN session_exercises se ON se.session_id = ts.id
JOIN exercises e ON e.id = se.exercise_id
WHERE ts.id = 'session-uuid'
ORDER BY se.exercise_order;
```

#### Get Exercises by Category with Full Details

```sql
SELECT
  exercise_name,
  exercise_category,
  difficulty_level,
  effectiveness_rating,
  description,
  instructions,
  volume_recommendations,
  rest_periods,
  progression_guidelines,
  safety_notes,
  contraindications,
  position_applications,
  performance_improvements
FROM plyometrics_exercises
WHERE exercise_category = 'Deceleration Training'
ORDER BY effectiveness_rating DESC;
```

---

## Troubleshooting

### ACWR Not Updating

**Issue**: `load_monitoring` table not updating after workout log.

**Solution**: Check trigger is enabled:

```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_update_load_monitoring';
```

Re-create trigger if needed:

```sql
DROP TRIGGER IF EXISTS trigger_update_load_monitoring ON workout_logs;
-- Then re-run trigger creation from schema file
```

### RLS Blocking Queries

**Issue**: Getting empty results when data exists.

**Solution**: Check your JWT role:

```sql
SELECT current_setting('request.jwt.claims', true)::json->>'role';
```

Ensure user has correct role in `user_metadata`:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "player"}'::jsonb
WHERE id = 'user-uuid';
```

### Throwing Volume Not Tracking

**Issue**: Position-specific metrics not saving.

**Solution**: Ensure position_id is correct:

```sql
SELECT id, name FROM positions WHERE name = 'QB';
```

Check workout_log_id exists:

```sql
SELECT id FROM workout_logs WHERE player_id = 'player-uuid' ORDER BY completed_at DESC LIMIT 1;
```

---

## Extending the Database

### Adding New Metrics

Example: Add "Release Time" for QBs

```sql
-- 1. Create exercise
INSERT INTO exercises (name, category, position_specific, applicable_positions, metrics_tracked)
VALUES (
  'Release Time Drill',
  'Position-Specific',
  true,
  ARRAY[(SELECT id FROM positions WHERE name = 'QB')],
  ARRAY['Release Time', 'Accuracy']
);

-- 2. Track metric
INSERT INTO position_specific_metrics (player_id, position_id, metric_name, metric_value, metric_unit, date)
VALUES (
  'player-uuid',
  (SELECT id FROM positions WHERE name = 'QB'),
  'Release Time',
  0.38, -- seconds
  'Seconds',
  CURRENT_DATE
);
```

### Adding New Exercise Categories

```sql
-- Add exercises to a new category
INSERT INTO plyometrics_exercises (
  id, exercise_name, exercise_category, difficulty_level, description,
  instructions, research_based, intensity_level, effectiveness_rating
)
VALUES (
  gen_random_uuid(),
  'New Exercise Name',
  'New Category',
  'Intermediate',
  'Evidence-based description with research citation.',
  ARRAY['Step 1', 'Step 2', 'Step 3'],
  true,
  'Moderate-High',
  8
);
```

### Creating Custom Views

```sql
-- View: Player Training Summary
CREATE VIEW player_training_summary AS
SELECT
  u.email,
  u.raw_user_meta_data->>'name' AS player_name,
  p.name AS position,
  prog.name AS program_name,
  COUNT(DISTINCT wl.id) AS total_workouts,
  AVG(wl.rpe) AS avg_rpe,
  MAX(lm.acwr) AS max_acwr,
  pp.compliance_rate
FROM auth.users u
JOIN player_programs pp ON pp.player_id = u.id
JOIN training_programs prog ON prog.id = pp.program_id
JOIN positions p ON p.id = prog.position_id
LEFT JOIN workout_logs wl ON wl.player_id = u.id
LEFT JOIN load_monitoring lm ON lm.player_id = u.id
WHERE pp.is_active = true
GROUP BY u.id, p.name, prog.name, pp.compliance_rate;
```

---

## License & Credits

**Database Schema**: FlagFit Pro
**Based on**: Ljubljana Frogs QB Annual Program (2025-2026)
**ACWR Research**: Gabbett TJ (2016), Malone et al. (2017)
**Periodization**: Bompa & Buzzichelli (2018)
**Exercise Research**: Multiple peer-reviewed sources (see Research Sources section)

---

## Support

For issues or questions:

- Create an issue in the GitHub repository
- Check Supabase logs for RLS/trigger issues
- Verify JWT claims for authentication problems

**Database Version**: 2.1.0
**Last Updated**: 29. December 2025
**Last Verified Against Supabase**: 2025-12-28
**Total Evidence-Based Exercises**: 113+ (90 plyometrics + 23 isometrics)

---

## Known Issues & Missing Components

### Missing Tables (Not in Database)
1. `player_programs` - For assigning programs to players
2. `position_specific_metrics` - For tracking QB throwing volume, WR routes, etc.
3. `exercise_logs` - For detailed exercise logging within workouts

### Missing Functions/Triggers (Defined but Not Deployed)
1. `calculate_daily_load()` - ACWR daily load calculation
2. `calculate_acute_load()` - 7-day rolling average
3. `calculate_chronic_load()` - 28-day rolling average
4. `get_injury_risk_level()` - Risk classification
5. `trigger_update_load_monitoring` - Auto-update trigger

### Seed Data Not Applied
1. `seed-qb-annual-program.sql` - QB program sessions and exercises
2. Training sessions table is empty (0 rows)

### To Fix These Issues
Run the following migrations in Supabase SQL Editor:
1. Create missing tables from `create-training-schema.sql`
2. Deploy ACWR functions from `create-training-schema.sql`
3. Apply seed data from `seed-qb-annual-program.sql`
