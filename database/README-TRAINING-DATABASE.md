# FlagFit Pro Training Database

## Overview

This is a comprehensive, flexible training database designed for flag football athletes across all positions (QB, WR, DB, Center, LB, Blitzer). The schema supports:

- **Periodization**: Macrocycles, mesocycles (phases), and microcycles (weeks)
- **Progressive Overload**: Track load progression (20% BW → 30% BW → 40% BW)
- **ACWR Monitoring**: Automatic Acute:Chronic Workload Ratio calculation for injury prevention
- **RPE Tracking**: Rate of Perceived Exertion (1-10 scale) per session
- **Position-Specific Metrics**: Flexible JSONB fields for unique metrics (QB throwing volume, WR route completion, etc.)
- **Video Library**: Exercise demonstrations and technique videos
- **Coach-Player Collaboration**: Role-based access control

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

#### 6. **training_sessions**
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

#### 7. **session_exercises**
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

#### 8. **workout_logs**
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

#### 9. **exercise_logs**
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

#### 10. **load_monitoring**
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

#### 11. **position_specific_metrics**
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

#### 12. **player_programs**
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

#### 13. **training_videos**
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

## Database Functions

### ACWR Calculation Functions

#### 1. `calculate_daily_load(player_uuid, log_date)`
Calculates total training load for a day (sum of RPE × duration).

```sql
SELECT calculate_daily_load('player-uuid', '2026-01-15');
-- Returns: 480 (e.g., 8 RPE × 60 min workout)
```

#### 2. `calculate_acute_load(player_uuid, reference_date)`
Calculates 7-day rolling average load.

```sql
SELECT calculate_acute_load('player-uuid', '2026-01-15');
-- Returns: 420.5 (average daily load over 7 days)
```

#### 3. `calculate_chronic_load(player_uuid, reference_date)`
Calculates 28-day rolling average load.

```sql
SELECT calculate_chronic_load('player-uuid', '2026-01-15');
-- Returns: 380.2 (average daily load over 28 days)
```

#### 4. `get_injury_risk_level(acwr_value)`
Determines injury risk based on ACWR.

```sql
SELECT get_injury_risk_level(1.45);
-- Returns: 'Moderate'
```

---

## Automatic Triggers

### `trigger_update_load_monitoring`
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
- **View**: Positions, training videos, exercises

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
-- Check positions
SELECT * FROM positions;

-- Check QB program
SELECT * FROM training_programs WHERE position_id = (SELECT id FROM positions WHERE name = 'QB');

-- Check Foundation phase
SELECT * FROM training_phases WHERE program_id = '11111111-1111-1111-1111-111111111111';

-- Check Week 1 sessions
SELECT * FROM training_sessions
WHERE week_id = '33333331-3333-3333-3333-333333333331'
ORDER BY day_of_week, session_order;
```

---

## Usage Examples

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

| Day | Session | Type | Duration | Key Exercises |
|-----|---------|------|----------|---------------|
| Monday AM | QB Routine | Position-Specific | 30 min | Mobility, arm care |
| Monday PM | Lower Body | Strength | 60 min | Trap bar DL, Front squat, Single-leg RDL |
| Tuesday AM | QB Routine | Position-Specific | 30 min | Mobility, arm care |
| Tuesday PM | Speed & Throwing | Skill | 90 min | 3-step accel, 40m sprints, 100 throws |
| Wednesday AM | QB Routine | Position-Specific | 30 min | Mobility, arm care |
| Wednesday PM | Upper Body | Strength | 60 min | Landmine press, Pallof press, Arm care |
| Thursday | Active Recovery | Recovery | 45 min | Light movement, foam rolling |
| Friday AM | QB Routine | Position-Specific | 30 min | Mobility, arm care |
| Friday PM | Power & Throwing | Power | 90 min | Med ball, Jumps, 100 throws |

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

### For Players

1. **Accurate RPE**: Be honest with RPE ratings. This affects ACWR calculations.
2. **Log Consistently**: Log every workout, even if partial.
3. **Track Position Metrics**: QB? Log throwing volume. WR? Log route completion.
4. **Follow the Program**: Trust the periodization. Don't skip recovery days.
5. **Communication**: Add notes to workout logs about how you felt.

### For Developers

1. **Use Indexes**: All foreign keys are indexed. Use them in WHERE clauses.
2. **JSONB for Flexibility**: Use `position_specific_params` in `session_exercises` for position-unique data.
3. **RLS is Enabled**: All queries automatically filtered by RLS policies.
4. **Triggers are Active**: ACWR auto-updates. Don't manually calculate.
5. **UUID Primary Keys**: Use `gen_random_uuid()` for new records.

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

---

## Support

For issues or questions:
- Create an issue in the GitHub repository
- Check Supabase logs for RLS/trigger issues
- Verify JWT claims for authentication problems

**Database Version**: 1.0.0
**Last Updated**: 2025-12-12
