# Daily Protocol - Structured Training Integration Plan

## Overview

Connect the Daily Protocol system to the existing structured training programs, add position-specific support (QB, Blitzer), integrate flag practice schedules, implement age-based recovery modifiers, and enable multi-year cycle generation.

---

## Phase 1: Database Schema Updates

### 1.1 Player Training Preferences Table
Store individual player settings including flag practice schedule, position, age-based modifiers.

```sql
CREATE TABLE athlete_training_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Position & Program
  primary_position TEXT NOT NULL, -- 'quarterback', 'wr_db', 'blitzer', 'center'
  secondary_position TEXT,
  assigned_program_id UUID REFERENCES training_programs(id),
  
  -- Flag Practice Schedule (player-specific)
  flag_practice_schedule JSONB DEFAULT '[]',
  -- Example: [{"day": 1, "start_time": "18:00", "duration_minutes": 90, "expected_throws": 50}]
  
  -- Age & Recovery
  birth_date DATE,
  age_recovery_modifier NUMERIC(3,2) DEFAULT 1.0, -- Auto-calculated from birth_date
  acwr_target_min NUMERIC(3,2) DEFAULT 0.8,
  acwr_target_max NUMERIC(3,2) DEFAULT 1.3, -- Adjusted by age
  
  -- National Team (coaches only can set)
  national_team_schedule JSONB DEFAULT '[]',
  -- Example: [{"event": "Training Camp", "start_date": "2026-03-01", "end_date": "2026-03-07"}]
  
  -- Preferences
  preferred_training_days INTEGER[] DEFAULT '{1,2,4,5,6}', -- Mon, Tue, Thu, Fri, Sat
  max_sessions_per_week INTEGER DEFAULT 5,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

### 1.2 Age Recovery Modifiers Reference Table
Evidence-based recovery modifiers.

```sql
CREATE TABLE age_recovery_modifiers (
  id SERIAL PRIMARY KEY,
  age_min INTEGER NOT NULL,
  age_max INTEGER NOT NULL,
  recovery_modifier NUMERIC(3,2) NOT NULL,
  acwr_max_adjustment NUMERIC(3,2) NOT NULL,
  min_hours_between_high_intensity INTEGER NOT NULL,
  evidence_source TEXT,
  notes TEXT,
  
  CONSTRAINT age_range_check CHECK (age_min < age_max)
);

-- Seed data based on research
INSERT INTO age_recovery_modifiers (age_min, age_max, recovery_modifier, acwr_max_adjustment, min_hours_between_high_intensity, evidence_source, notes) VALUES
(0, 24, 1.0, 0, 48, 'Baseline - peak physiological capacity', 'Standard recovery protocols'),
(25, 29, 1.1, -0.05, 52, 'Slight decline begins', 'Minor adjustments recommended'),
(30, 34, 1.25, -0.05, 60, 'Griffith University: 30+ need ~60% more recovery', 'Monitor fatigue closely'),
(35, 39, 1.4, -0.1, 67, 'Sports Medicine Open: delayed recovery 35+', 'Conservative ACWR range recommended'),
(40, 49, 1.5, -0.15, 72, 'Significant anabolic resistance', 'Extended recovery between sessions'),
(50, 99, 1.6, -0.2, 84, 'Institute of Motion: 70% incomplete recovery at 96h', 'Master athlete protocols');
```

### 1.3 QB-Specific Training Program
Insert the full QB program from the JSON provided.

```sql
-- QB Program (parallel to existing WR/DB program)
INSERT INTO training_programs (
  id, name, description, program_type, difficulty_level,
  duration_weeks, sessions_per_week, is_template, is_active,
  position_id, start_date, end_date
) VALUES (
  'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq',
  'Ljubljana Frogs QB Annual Program 2025-2026',
  'QB-specific annual program with throwing progression, arm care protocols, and tournament simulation. Follows WR/DB structure with additional throwing-specific work.',
  'quarterback',
  'advanced',
  52,
  5,
  true,
  true,
  1, -- QB position_id from flag_football_positions
  '2025-11-01',
  '2026-10-31'
);
```

### 1.4 Tournament Calendar Table Enhancement

```sql
-- Add tournaments table if not exists, or update
CREATE TABLE IF NOT EXISTS tournament_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  country TEXT,
  is_peak_event BOOLEAN DEFAULT false,
  games_expected INTEGER DEFAULT 8,
  throws_per_game_qb INTEGER DEFAULT 40,
  
  -- Who can attend
  team_id UUID, -- null = all teams
  is_national_team_event BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.5 Position-Specific Exercise Modifiers

```sql
CREATE TABLE position_exercise_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position TEXT NOT NULL, -- 'quarterback', 'blitzer', 'wr_db'
  exercise_category TEXT NOT NULL, -- 'deceleration', 'throwing', 'arm_care'
  volume_modifier NUMERIC(3,2) DEFAULT 1.0, -- Blitzer deceleration = 1.3x
  intensity_modifier NUMERIC(3,2) DEFAULT 1.0,
  additional_exercises JSONB DEFAULT '[]',
  notes TEXT
);

-- Seed position modifiers
INSERT INTO position_exercise_modifiers (position, exercise_category, volume_modifier, notes) VALUES
('blitzer', 'deceleration', 1.3, 'Higher deceleration volume due to chase/stop demands'),
('blitzer', 'lateral_work', 1.2, 'More lateral cutting for pursuit angles'),
('quarterback', 'throwing', 1.0, 'Full throwing protocol'),
('quarterback', 'arm_care', 1.0, 'Mandatory arm care - never skip'),
('wr_db', 'deceleration', 1.0, 'Standard deceleration work');
```

---

## Phase 2: QB-Specific Exercise Library

### 2.1 QB Morning Routine Exercises

```sql
-- QB-specific morning mobility (in addition to standard)
INSERT INTO exercises (name, slug, category, subcategory, how_text, feel_text, default_sets, default_hold_seconds, position_specific) VALUES
('Couch Stretch', 'couch-stretch', 'mobility', 'hip_flexor', 'Kneel with back foot elevated on couch/wall. Push hips forward while keeping torso upright.', 'Deep stretch in hip flexor and quad of rear leg.', 1, 90, ARRAY['quarterback']),
('Kneeling Hip Flexor Stretch', 'kneeling-hip-flexor', 'mobility', 'hip_flexor', 'Kneel with one leg forward at 90 degrees. Push hips forward, squeeze glute of back leg.', 'Stretch in hip flexor of back leg.', 1, 60, ARRAY['quarterback']),
('Sleeper Stretch', 'sleeper-stretch', 'mobility', 'shoulder', 'Lie on throwing side, arm at 90 degrees. Use other hand to gently push forearm toward floor.', 'Stretch in posterior shoulder. Crucial for throwing arm health.', 2, 60, ARRAY['quarterback']),
('Cross-Body Shoulder Stretch', 'cross-body-stretch', 'mobility', 'shoulder', 'Pull arm across body at shoulder height using opposite hand.', 'Stretch in posterior deltoid and rotator cuff.', 2, 45, ARRAY['quarterback']),
('Doorway Pec Stretch', 'doorway-pec-stretch', 'mobility', 'shoulder', 'Place forearm on doorframe at 90 degrees, step through doorway.', 'Stretch in pectoralis and anterior shoulder.', 1, 60, ARRAY['quarterback']),
('Shoulder Dislocations', 'shoulder-dislocations', 'mobility', 'shoulder', 'Hold band/stick wide, raise overhead and behind back in slow arc.', 'Full shoulder range of motion activation.', 1, NULL, ARRAY['quarterback']);
```

### 2.2 QB Pre-Throwing Warm-up Exercises

```sql
-- Rotator cuff activation
INSERT INTO exercises (name, slug, category, subcategory, how_text, default_sets, default_reps, position_specific) VALUES
('External Rotation (Band)', 'external-rotation-band', 'warm_up', 'rotator_cuff', 'Stand with elbow at side, rotate forearm outward against band resistance.', 2, 15, ARRAY['quarterback']),
('Internal Rotation (Band)', 'internal-rotation-band', 'warm_up', 'rotator_cuff', 'Stand with elbow at side, rotate forearm inward against band resistance.', 2, 12, ARRAY['quarterback']),
('Empty Can Raises', 'empty-can-raises', 'warm_up', 'rotator_cuff', 'Raise arms at 45-degree angle with thumbs down, like emptying cans.', 2, 10, ARRAY['quarterback']),
('Full Can Raises', 'full-can-raises', 'warm_up', 'rotator_cuff', 'Raise arms at 45-degree angle with thumbs up.', 2, 10, ARRAY['quarterback']),
('Y-T-W Raises', 'y-t-w-raises', 'warm_up', 'scapular', 'Lying face down, raise arms in Y, T, then W positions.', 2, 10, ARRAY['quarterback']),
('Wall Slides', 'wall-slides', 'warm_up', 'scapular', 'Back against wall, slide arms up and down keeping contact with wall.', 2, 12, ARRAY['quarterback']),
('Band Pull-Aparts', 'band-pull-aparts-warmup', 'warm_up', 'scapular', 'Hold band at shoulder width, pull apart squeezing shoulder blades.', 2, 20, ARRAY['quarterback']),
('Scapular Push-Ups', 'scapular-pushups', 'warm_up', 'scapular', 'In push-up position, protract and retract shoulder blades without bending elbows.', 2, 10, ARRAY['quarterback']),
('Lower Trap Raises', 'lower-trap-raises', 'warm_up', 'scapular', 'Lying face down on bench, raise arms in Y position focusing on lower traps.', 2, 12, ARRAY['quarterback']);
```

### 2.3 QB Arm Care Exercises (Post-Training)

```sql
INSERT INTO exercises (name, slug, category, subcategory, how_text, default_sets, default_reps, position_specific) VALUES
('Posterior Delt Raises', 'posterior-delt-raises', 'strength', 'arm_care', 'Bent over, raise dumbbells to side focusing on rear deltoid.', 3, 15, ARRAY['quarterback']),
('Bicep Curls (Controlled Eccentric)', 'bicep-curls-eccentric', 'strength', 'arm_care', 'Curl weight up normally, lower over 3-4 seconds.', 3, 12, ARRAY['quarterback']),
('Tricep Extensions', 'tricep-extensions', 'strength', 'arm_care', 'Overhead or lying tricep extension with controlled movement.', 3, 12, ARRAY['quarterback']),
('Wrist Curls', 'wrist-curls', 'strength', 'arm_care', 'Forearm on bench, curl wrist up with light weight.', 3, 15, ARRAY['quarterback']),
('Reverse Wrist Curls', 'reverse-wrist-curls', 'strength', 'arm_care', 'Forearm on bench palm down, extend wrist up.', 3, 15, ARRAY['quarterback']);
```

### 2.4 QB Throwing Power Exercises

```sql
INSERT INTO exercises (name, slug, category, subcategory, how_text, default_sets, default_reps, position_specific) VALUES
('Medicine Ball Rotational Throw', 'mb-rotational-throw', 'power', 'throwing_power', 'Stand perpendicular to wall, rotate explosively and throw MB into wall.', 3, 8, ARRAY['quarterback']),
('Explosive Step-Through', 'explosive-step-through', 'power', 'throwing_power', 'Mimic throwing motion with explosive step, no ball.', 3, 6, ARRAY['quarterback']),
('Shadow Throwing', 'shadow-throwing', 'skill', 'throwing_mechanics', 'Full throwing motion without ball, focus on mechanics.', 2, 20, ARRAY['quarterback']);
```

---

## Phase 3: Backend Updates - Daily Protocol Service

### 3.1 Update `daily-protocol.cjs` to Use Structured Data

Key changes:
1. Get user's assigned program and current week/phase
2. Get user's flag practice schedule for the day
3. Apply age-based recovery modifiers
4. Apply position-specific exercise modifiers
5. Pull exercises from `training_session_templates` not random `exercises`

```javascript
// New function: Get user's training context
async function getUserTrainingContext(supabase, userId, date) {
  // 1. Get user config (position, age, practice schedule)
  const { data: config } = await supabase
    .from('athlete_training_config')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // 2. Calculate age and get recovery modifier
  const age = calculateAge(config?.birth_date);
  const { data: ageModifier } = await supabase
    .from('age_recovery_modifiers')
    .select('*')
    .lte('age_min', age)
    .gte('age_max', age)
    .single();
  
  // 3. Get assigned program and current phase/week
  const { data: program } = await supabase
    .from('player_programs')
    .select(`
      *,
      training_programs(*),
      current_phase:training_phases(*),
      current_week:training_weeks(*)
    `)
    .eq('player_id', userId)
    .eq('status', 'active')
    .single();
  
  // 4. Get today's session template
  const dayOfWeek = new Date(date).getDay();
  const { data: sessionTemplate } = await supabase
    .from('training_session_templates')
    .select('*')
    .eq('week_id', program?.current_week?.id)
    .eq('day_of_week', dayOfWeek)
    .single();
  
  // 5. Check if today has flag practice
  const hasFlagPractice = config?.flag_practice_schedule?.some(
    p => p.day === dayOfWeek
  );
  
  // 6. Get ACWR and readiness
  const { data: readiness } = await supabase
    .from('readiness_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('day', date)
    .single();
  
  return {
    config,
    age,
    ageModifier,
    program,
    sessionTemplate,
    hasFlagPractice,
    flagPracticeDetails: hasFlagPractice 
      ? config.flag_practice_schedule.find(p => p.day === dayOfWeek) 
      : null,
    readiness,
    acwrTargetRange: {
      min: config?.acwr_target_min || 0.8,
      max: (config?.acwr_target_max || 1.3) + (ageModifier?.acwr_max_adjustment || 0)
    }
  };
}
```

### 3.2 Generate Protocol from Structured Template

```javascript
async function generateProtocolFromTemplate(supabase, userId, date, context) {
  const { sessionTemplate, config, ageModifier, hasFlagPractice, readiness } = context;
  
  // Adjust session based on flag practice
  let adjustedSession = { ...sessionTemplate };
  if (hasFlagPractice) {
    adjustedSession = adjustForFlagPractice(sessionTemplate, context.flagPracticeDetails, config.primary_position);
  }
  
  // Adjust for readiness/ACWR
  if (readiness?.score < 50 || readiness?.acwr > context.acwrTargetRange.max) {
    adjustedSession = reduceIntensity(adjustedSession, readiness);
  }
  
  // Apply age-based recovery modifier
  if (ageModifier?.recovery_modifier > 1.0) {
    adjustedSession = applyAgeRecoveryModifier(adjustedSession, ageModifier);
  }
  
  // Get position-specific exercise modifiers
  const { data: positionModifiers } = await supabase
    .from('position_exercise_modifiers')
    .select('*')
    .eq('position', config.primary_position);
  
  // Build protocol with exercises
  // ... (apply modifiers to exercises)
  
  return adjustedSession;
}

function adjustForFlagPractice(session, practiceDetails, position) {
  // If QB with throwing practice, reduce arm work before practice
  if (position === 'quarterback' && practiceDetails.expected_throws > 0) {
    return {
      ...session,
      notes: `Flag practice day - ${practiceDetails.expected_throws} throws expected at practice`,
      arm_care_mode: 'light_activation_only',
      throwing_before_practice: false
    };
  }
  // Standard adjustment - lighter session before practice
  return {
    ...session,
    intensity_level: Math.min(session.intensity_level, 'Moderate'),
    notes: 'Flag practice day - adjusted intensity'
  };
}
```

---

## Phase 4: Multi-Year Cycle Generation

### 4.1 Program Cycle Generator

```sql
-- Store generated cycles
CREATE TABLE program_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_program_id UUID REFERENCES training_programs(id),
  cycle_year INTEGER NOT NULL,
  cycle_name TEXT NOT NULL, -- "2026-2027", "2027-2028"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_peak_event TEXT, -- "LA28", "Elite 8 2027"
  
  -- Auto-generated from base program with adjustments
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by TEXT DEFAULT 'system',
  
  UNIQUE(base_program_id, cycle_year)
);
```

### 4.2 Cycle Generation Logic

```javascript
async function generateNextCycle(supabase, baseProgramId, targetYear) {
  // 1. Get base program structure
  const { data: baseProgram } = await supabase
    .from('training_programs')
    .select('*, training_phases(*), training_weeks(*)')
    .eq('id', baseProgramId)
    .single();
  
  // 2. Calculate new dates (shift by 1 year)
  const newStartDate = shiftDateByYear(baseProgram.start_date, targetYear);
  const newEndDate = shiftDateByYear(baseProgram.end_date, targetYear);
  
  // 3. Create new program cycle
  const { data: newCycle } = await supabase
    .from('program_cycles')
    .insert({
      base_program_id: baseProgramId,
      cycle_year: targetYear,
      cycle_name: `${targetYear}-${targetYear + 1}`,
      start_date: newStartDate,
      end_date: newEndDate
    })
    .select()
    .single();
  
  // 4. Clone phases with new dates
  // 5. Clone weeks with new dates
  // 6. Clone session templates
  
  return newCycle;
}
```

---

## Phase 5: Frontend Updates

### 5.1 Player Settings Component
- Flag practice schedule input (day picker, time, duration)
- Position selection (affects program assignment)
- View age-adjusted targets

### 5.2 Coach Dashboard
- National team event management
- Tournament calendar management
- Player program assignments
- View all player schedules

### 5.3 Daily Protocol Updates
- Show "Flag Practice Day" banner when applicable
- Display age-adjusted ACWR target
- Show position-specific exercises
- QB: Show throwing count, arm care reminders

---

## Implementation Order

### Sprint 1: Database & Core (Days 1-3)
- [ ] 1.1 Create `athlete_training_config` table
- [ ] 1.2 Create `age_recovery_modifiers` table with seed data
- [ ] 1.3 Insert QB training program
- [ ] 1.4 Create `tournament_calendar` table
- [ ] 1.5 Create `position_exercise_modifiers` table
- [ ] 2.1-2.4 Add QB-specific exercises to library

### Sprint 2: Backend Integration (Days 4-6)
- [ ] 3.1 Update `daily-protocol.cjs` with `getUserTrainingContext()`
- [ ] 3.2 Implement `generateProtocolFromTemplate()` 
- [ ] 3.3 Connect to existing `training_session_templates`
- [ ] 3.4 Apply age/position modifiers
- [ ] 3.5 Handle flag practice day adjustments

### Sprint 3: Multi-Year & Frontend (Days 7-9)
- [ ] 4.1-4.2 Implement cycle generation
- [ ] 5.1 Player settings component
- [ ] 5.2 Coach dashboard updates
- [ ] 5.3 Daily protocol UI updates

### Sprint 4: Testing & Polish (Day 10)
- [ ] End-to-end testing
- [ ] QB throwing progression validation
- [ ] Age modifier calculations verification
- [ ] Flag practice integration testing

---

## Questions Resolved

| Question | Answer |
|----------|--------|
| Flag practice schedule | Player-specific, stored in `athlete_training_config` |
| Position programs | QB uses provided JSON, Blitzer = WR/DB + decel modifiers |
| Age recovery | Evidence-based table with auto-calculation |
| Tournament calendar | Players/coaches input, stored in `tournament_calendar` |
| National team schedule | Coaches only, stored in `athlete_training_config` |
| Multi-year cycles | Auto-generated from base program template |
| ACWR adjustment | Age-based reduction in max target (35+ = max 1.2) |

---

## Evidence Sources for Age Recovery

1. [Griffith University](https://research-repository.griffith.edu.au) - Athletes 30+ need ~60% more recovery
2. [Sports Medicine Open](https://sportsmedicine-open.springeropen.com/articles/10.1186/s40798-023-00597-1) - Muscle strength recovery up to 240h in older athletes
3. [Institute of Motion](https://instituteofmotion.com) - 70% of 50-65 year olds incomplete recovery at 96h
4. [PubMed - Master Athletes](https://pubmed.ncbi.nlm.nih.gov/25880787/) - Age effect exists but smaller for well-trained
5. [BMC Sports Science](https://bmcsportsscimedrehabil.biomedcentral.com/articles/10.1186/s13102-025-01332-x) - Conservative workload for master athletes
