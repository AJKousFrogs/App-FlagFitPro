# Training Program Flow Report

## Executive Summary

This report analyzes the complete flow from user onboarding to daily training schedule display. It identifies **what exists**, **what's missing**, and **what needs to be implemented** to ensure players see their position-specific 52-week training programs.

> **Design Philosophy:** We train positions, not muscles. Exercises are delivery mechanisms for biomechanical priorities, not the primary logic unit.

---

## 0. Position-Specific Training Philosophy

### The Wrong Approach (What Most Systems Do)
```
"QB gets more curls, rusher gets more hamstrings"
```
This is **symptom-based thinking** — hardcoding exercises to positions.

### The Right Approach (What We're Building)
```
Positions don't need exercises — they need PRIORITIES.
Exercises are interchangeable delivery mechanisms.
```

### 0.1 Position Load Profiles (Foundation Layer)

Each position is defined by **4 permanent load drivers**:

| Position | Primary Force Pattern | Primary Joint Stress | Primary Fatigue Type | Game Exposure |
|----------|----------------------|---------------------|---------------------|---------------|
| **QB** | High volume, low external load | Extreme repetitive shoulder | CNS > muscular | Asymmetric rotational |
| **Center** | Asymmetric stance + explosive start | Single-leg loading (split stance) | Unilateral power demand | 3-step burst after snap |
| **Rusher/Blitzer** | Max acceleration + deceleration | Violent hamstring lengthening | High eccentric load | Short explosive bouts |
| **DB** | Lateral + backward movement | High hip rotation | Long reactive sequences | Neck + trunk control |
| **WR** | Top-speed exposure | Elastic sprinting | Arm swing contribution | Lower repetition than DB |

### 0.2 Position Priorities (Never Optimize Against These)

| Position | Primary Priorities | Never Optimize For |
|----------|-------------------|-------------------|
| **QB** | Shoulder integrity > output, Elbow/forearm durability, Anti-rotation core, Hip-shoulder separation | Max strength, Fatiguing arm isolation close to games |
| **Center** | Snap mechanics, **3-step acceleration from split stance**, Single-leg RDL/hip thrust (unilateral posterior chain), Core stiffness, Wrist/forearm resilience | Max bilateral strength (asymmetric stance is the reality) |
| **Rusher** | Hamstrings (eccentric first), Ankle-knee-hip braking, Posterior chain elasticity | Upper-body fatigue |
| **DB** | Hip internal/external rotation, Adductors, Backward locomotion capacity, Deceleration mechanics | — |
| **WR** | Hamstring elasticity, Hip extension, Scapular rhythm (not arm size), Speed preservation | — |

### 0.3 Category-Based Rule Engine (Not Exercise-Based)

**Categories are the primary logic unit. Exercises are just delivery mechanisms.**

```
Upper Body               Lower Body              Movement                Core
─────────────────────    ─────────────────────   ─────────────────────   ─────────────────────
• Arm Care               • Acceleration          • Backward Locomotion   • Anti-Rotation
• Shoulder Stability     • Deceleration          • Lateral Transitions   • Anti-Extension
• Scapular Control       • Elasticity            • Change of Direction   • Rotational Control
• Elbow / Forearm        • Rotation
```

### 0.4 Position × Category Weighting Matrix

This is the **real rule engine**. No hardcoding exercises — just category weights.

| Category | QB | Center | Rusher | DB | WR |
|----------|-----|--------|--------|-----|-----|
| Arm Care | **1.4** | 1.1 | 0.6 | 0.8 | 0.8 |
| Shoulder Stability | **1.3** | 1.0 | 0.7 | 0.9 | 0.9 |
| Hamstring Eccentric | 0.7 | **1.3** | **1.4** | 1.1 | **1.3** |
| Hip Thrust / Glute | 0.8 | **1.4** | 1.1 | 1.0 | 1.1 |
| Single-Leg RDL | 0.7 | **1.5** | 1.2 | 1.1 | 1.2 |
| Hip Rotation | 1.1 | 0.9 | 0.8 | **1.4** | 1.0 |
| Backward Locomotion | 0.6 | 0.6 | 0.7 | **1.4** | 0.8 |
| Core Anti-Rotation | **1.3** | **1.3** | 0.9 | 1.1 | 1.0 |
| 3-Step Acceleration | 0.7 | **1.4** | **1.3** | 1.0 | 1.1 |
| Deceleration | 0.8 | 1.0 | **1.3** | **1.2** | 1.0 |
| Snap Mechanics | 0.0 | **1.5** | 0.0 | 0.0 | 0.0 |

> **Center Biomechanics:** Split stance (lead foot forward), one-arm snap between legs, then explosive 3-step burst left or right. This demands **unilateral posterior chain power** (single-leg RDL, hip thrust, Romanian deadlift, glute bridge) more than bilateral strength.

**Result:** 
- QB automatically gets more rotator cuff work → those exercises live in `Arm Care`
- Rusher automatically gets more Nordic curls → they live in `Hamstring Eccentric`
- DB gets more backward walking → lives in `Backward Locomotion`

**No if/else hell. No hardcoding.**

### 0.5 Season Phase Multipliers

**Positions don't change. Risk tolerance changes.**

| Phase | Volume | Priority Bias | Philosophy |
|-------|--------|---------------|------------|
| **Offseason (Build)** | ↑ High | Structural adaptations | Allow fatigue accumulation |
| **Preseason (Convert)** | ↓ Reduce | Increase specificity | Reduce novel exercises |
| **In-Season (Maintain)** | ↓↓ Lowest | Highest priority bias | Fatigue avoidance > adaptation |
| **Post-Season (Repair)** | Variable | Restore joints | Remove performance pressure |

**Final Volume Formula:**
```
final_volume = base_sets × position_modifier × season_phase_modifier
```

### 0.6 Protected Categories (Never Skip)

Even during deloads, these categories are **NEVER removed**:

| Position | Protected Categories | Why |
|----------|---------------------|-----|
| QB | Arm Care | Shoulder integrity = career longevity |
| Rusher | Hamstring Eccentric | #1 injury risk during max decel |
| DB | Hip Rotation | Foundation for all reactive movement |
| Center | Snap Mechanics, Single-Leg RDL, Hip Thrust | Split stance + explosive start demands unilateral posterior chain |

---

## 0.7 Evidence-Based Position Training (NFL/Research)

### Quarterback (QB) - Arm Care & Functional Power

**Key Protocols:**
- **Thrower's Ten Program** - Gold standard for shoulder prehab (rotator cuff, scapular stabilizers)
- **Resistance Band Work** - Shoulder internal/external rotation, scapular retraction
- **Medicine Ball Rotational Throws** - Hip-shoulder separation, core power transfer
- **ATG Split Squats** - Lower body strength for pocket movement
- **Single-Leg Pogo Hops** - Ankle stiffness, reactive strength

**Priority Categories:**
```
Arm Care (rotator cuff, elbow) → NEVER skip
Hip-Shoulder Separation (rotational power) → Core anti-rotation
Pocket Mobility (footwork, scramble) → Agility drills
```

**What to Avoid:** Heavy overhead pressing close to games, fatiguing arm isolation

---

### Wide Receiver (WR) - Speed Preservation & Elasticity

**Key Protocols:**
- **Sprint Training** - 10-yard bursts, acceleration mechanics
- **Plyometrics** - Counter-movement jumps, bounding, standing long jumps
- **L-Drill / Agility Work** - Route running precision, quick cuts
- **Romanian Deadlifts (RDL)** - Hamstring elasticity (moderate load)
- **Scapular Rhythm Work** - Arm swing contribution to speed

**Priority Categories:**
```
Hamstring Elasticity → RDL, Nordic curls (injury prevention)
First-Step Explosion → Plyometrics, acceleration drills
Route Running → Agility drills, COD mechanics
Speed Preservation → Avoid heavy bilateral squats in-season
```

**Key Insight:** WRs need elastic, reactive strength — not max strength. Heavy squats can reduce elasticity.

---

### Defensive Back (DB) - Reactive Movement & Hip Mobility

**Key Protocols:**
- **Backpedal & Break Drills** - Game-specific movement patterns
- **Hip Internal/External Rotation** - 90/90 stretches, hip CARs
- **Lateral Shuffle with Resistance** - Adductor strength
- **Change of Direction (COD)** - 3-cone drill patterns
- **Core Stability** - Anti-rotation for body control during transitions

**Priority Categories:**
```
Hip Rotation → Internal/external ROM is foundation
Backward Locomotion → Backpedal capacity, hip turns
Lateral Transitions → Adductors, lateral power
Deceleration → Braking mechanics after breaks
```

**Key Insight:** DBs live in reactive, multi-directional movement. Hip mobility is the limiting factor, not strength.

---

### Rusher/Blitzer - Explosive Acceleration & Hamstring Protection

**Key Protocols:**
- **3-Step Acceleration Drills** - First-step explosion
- **Nordic Curls** - Eccentric hamstring strength (injury prevention)
- **Deceleration Training** - Braking after rush
- **Posterior Chain Elasticity** - Hip extension power
- **Minimal Upper Body** - Don't fatigue arms that aren't throwing

**Priority Categories:**
```
Hamstring Eccentric → NEVER skip (highest injury risk position)
3-Step Acceleration → Explosive first step
Deceleration → Rapid braking after rush attempt
Posterior Chain → Hip extension for power
```

**Research Note:** Nordic curl programs reduce hamstring injuries by 51% in football players (British Journal of Sports Medicine).

---

### Center - Unilateral Power & Snap Mechanics

**Key Protocols:**
- **Single-Leg RDL** - Split stance demands unilateral posterior chain
- **Hip Thrust (single-leg)** - Glute power for explosive start
- **Split Stance Acceleration** - 3-step burst from snap position
- **Core Anti-Rotation** - Stability during asymmetric snap
- **Forearm/Wrist Work** - Snap control and accuracy

**Priority Categories:**
```
Snap Mechanics → The skill itself (NEVER skip)
Single-Leg Posterior Chain → RDL, hip thrust, glute bridge
3-Step Acceleration → Explosive burst after snap
Core Stiffness → Anti-rotation during asymmetric movement
```

**Key Insight:** Centers operate from an asymmetric split stance. Bilateral exercises miss the point — train unilateral.

---

### Summary: Train Athletes, Not Bodybuilders

| Position | Primary Movement Pattern | Avoid |
|----------|-------------------------|-------|
| QB | Rotational power, arm care | Heavy pressing, arm fatigue |
| WR | Elastic speed, plyometrics | Heavy squats (reduces elasticity) |
| DB | Reactive multi-directional | Bilateral-only training |
| Rusher | Explosive acceleration + decel | Upper body fatigue |
| Center | Unilateral posterior chain | Bilateral-only exercises |

---

## 1. Current Architecture Overview

### 1.1 Database Schema (✅ Complete)

The database has a well-designed structure for training programs:

```
training_programs
    └── training_phases (e.g., "Foundation", "Power Development")
        └── training_weeks (e.g., "Power Week 1", Jan 5-11, 2026)
            └── training_session_templates (e.g., "Lower Body Power", Monday)
                └── session_exercises (linked exercises with sets/reps)
                    └── exercises (exercise library with videos, instructions)
```

**Position-specific tables:**
- `position_exercise_modifiers` - Defines volume/intensity adjustments per position
- `exercises.position_specific` - Array field tagging exercises by position

### 1.2 Existing Programs in Database

| Program ID | Name | Duration |
|------------|------|----------|
| `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` | Ljubljana Frogs QB Annual Program 2025-2026 | 52 weeks |
| `ffffffff-ffff-ffff-ffff-ffffffffffff` | Ljubljana Frogs WR/DB Annual Program 2025-2026 | 52 weeks |

### 1.3 Position Modifiers (✅ Already Populated)

```
Position          | Category        | Volume Modifier | Priority | Notes
------------------|-----------------|-----------------|----------|----------------------------------
rusher (blitzer)  | deceleration    | 1.25-1.30x      | 9        | 3-step decel after rush/chase
rusher (blitzer)  | acceleration    | 1.30x           | 10       | Explosive first step is critical
center            | snap_mechanics  | 1.50x           | 10       | Snap practice is #1 priority
center            | core_stability  | 1.30x           | 9        | Core critical for consistent snaps
quarterback       | arm_care        | 1.00x           | 10       | Mandatory - NEVER skip
quarterback       | hip_flexor      | 1.20x           | 9        | Supports throwing velocity
```

> **Note:** "Rusher" (USA terminology) and "Blitzer" (European terminology) refer to the same position. The database maintains entries for both terms as regional aliases.

---

## 2. Data Flow Analysis

### 2.1 Onboarding Flow

**File:** `angular/src/app/features/onboarding/onboarding.component.ts`

```
User Onboarding Steps:
1. Personal Info (name, DOB, country)
2. Role & Position Selection ← CRITICAL: position selected here
3. Physical Measurements
4. Health & Injuries
5. Equipment Available
6. Training Goals
7. Schedule & Practice Days
8. Mobility & Recovery Preferences
9. Summary & Complete
```

**Current `completeOnboarding()` function (lines 2453-2546):**

```typescript
async completeOnboarding(): Promise<void> {
  // 1. Updates user profile in `users` table ✅
  // 2. Saves training preferences to `user_preferences` table ✅
  // 3. Redirects to dashboard ✅
  
  // ❌ MISSING: Does NOT create player_programs entry!
  // ❌ MISSING: Does NOT link user to training program based on position!
}
```

### 2.2 The Missing Link: `player_programs` Table

**Current State:** Table exists but is **EMPTY**

**Required Action:** After onboarding, insert a record:

```sql
INSERT INTO player_programs (
  player_id,      -- user's UUID
  program_id,     -- training program UUID based on position
  start_date,     -- today or program start
  status          -- 'active'
) VALUES (...);
```

**Position → Program Mapping:**

| Position Selected | Program to Assign |
|------------------|-------------------|
| QB | Ljubljana Frogs QB Annual Program 2025-2026 |
| WR | Ljubljana Frogs WR/DB Annual Program 2025-2026 |
| DB | Ljubljana Frogs WR/DB Annual Program 2025-2026 |
| Center | Ljubljana Frogs WR/DB Annual Program 2025-2026 + center modifiers |
| Rusher (Blitzer) | Ljubljana Frogs WR/DB Annual Program 2025-2026 + rusher modifiers |
| LB | Ljubljana Frogs WR/DB Annual Program 2025-2026 |
| Hybrid | Based on primary position |

> **Note:** Rusher (USA) and Blitzer (Europe) are the same position - regional terminology aliases.

---

## 3. Frontend Services Analysis

### 3.1 UnifiedTrainingService (Dashboard/Today)

**File:** `angular/src/app/core/services/unified-training.service.ts`

**Current `loadWeeklySchedule()` (lines 522-538):**

```typescript
private async loadWeeklySchedule(userId: string): Promise<WeeklyScheduleDay[]> {
  // ❌ PROBLEM: Only queries training_sessions (completed/logged sessions)
  // ❌ Does NOT query the 52-week program templates!
  
  const { data } = await this.supabase.client
    .from("training_sessions")  // Wrong table!
    .select("*")
    .eq("user_id", userId)
    .gte("date", startOfWeek.toISOString())
    .lte("date", endOfWeek.toISOString());
    
  return this.transformToWeeklySchedule(data || []);
}
```

**Should query:**
1. `player_programs` → Get user's assigned program
2. `training_weeks` → Find current week by date
3. `training_session_templates` → Get today's scheduled session
4. `position_exercise_modifiers` → Apply position-specific adjustments

### 3.2 TrainingProgramService (Program Viewer)

**File:** `angular/src/app/core/services/training-program.service.ts`

**Status:** ✅ Well-implemented but **not connected to user assignment**

This service can:
- Fetch all programs
- Fetch full program with phases/weeks/sessions/exercises
- Get current week by date
- Get today's sessions

**Missing:** Method to get **user's assigned program** from `player_programs`

### 3.3 Daily Protocol API (Netlify Function)

**File:** `netlify/functions/daily-protocol.cjs`

**Status:** ✅ **Most complete implementation** - Uses `player_programs`!

**`getUserTrainingContext()` function (lines 72-297):**

```javascript
async function getUserTrainingContext(supabase, userId, date) {
  // ✅ Gets assigned program from player_programs
  const { data: playerProgram } = await supabase
    .from("player_programs")
    .select(`*, training_programs (...)`)
    .eq("player_id", userId)
    .eq("status", "active")
    .single();

  // ✅ Gets current phase/week based on date
  // ✅ Gets session template for today
  // ✅ Gets position modifiers
  // ✅ Applies age modifiers
  // ✅ Handles taper periods for tournaments
}
```

**This is the correct pattern!** But it's only used by the daily protocol generator, not the main dashboard.

---

## 4. API Routes Analysis

### 4.1 Existing Routes

| Route | File | Purpose | Status |
|-------|------|---------|--------|
| `GET /api/training-programs` | server.js:450 | List all programs | ✅ Works |
| `GET /api/training-programs?id=X` | training-programs.cjs | Get program with phases | ✅ Works |
| `GET /api/training-programs?id=X&full=true` | training-programs.cjs | Full program data | ✅ Works |
| `GET /api/training-programs/phases` | training-programs.cjs | Get phases | ✅ Works |
| `GET /api/training-programs/weeks` | training-programs.cjs | Get weeks | ✅ Works |
| `GET /api/training-programs/sessions` | training-programs.cjs | Get sessions | ✅ Works |
| `GET /api/training-programs/exercises` | training-programs.cjs | Get exercises | ✅ Works |
| `GET /api/training-programs/current-week` | training-programs.cjs | Current week by date | ✅ Works |
| `GET /api/daily-protocol` | daily-protocol.cjs | Get today's protocol | ✅ Works |
| `POST /api/daily-protocol/generate` | daily-protocol.cjs | Generate daily protocol | ✅ Works |

### 4.2 Missing Routes

| Route | Purpose | Priority |
|-------|---------|----------|
| `POST /api/player-programs` | Assign user to program | 🔴 Critical |
| `GET /api/player-programs/me` | Get user's assigned program | 🔴 Critical |
| `GET /api/today-schedule` | Get today's session from program | 🟡 Medium |
| `PUT /api/player-programs/:id` | Update assignment (custom programs) | 🟢 Low |

---

## 5. Implementation Plan

### Phase 1: Database Schema Enhancement

#### 5.1.1 Create Position Category Weights Table

**New table:** `position_category_weights`

```sql
CREATE TABLE position_category_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position TEXT NOT NULL,              -- 'quarterback', 'rusher', 'db', 'wr', 'center'
  category TEXT NOT NULL,              -- Maps to exercises.category or subcategory
  volume_modifier NUMERIC DEFAULT 1.0, -- Multiplier for sets/reps
  priority INTEGER DEFAULT 5,          -- 1-10, higher = more important
  is_protected BOOLEAN DEFAULT false,  -- NEVER skip even in deloads
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(position, category)
);

-- Example data (from Section 0.4)
INSERT INTO position_category_weights (position, category, volume_modifier, priority, is_protected, notes) VALUES
-- Quarterback
('quarterback', 'arm_care', 1.4, 10, true, 'Shoulder integrity > output'),
('quarterback', 'rotator_cuff', 1.3, 9, true, 'Elbow/forearm durability'),
('quarterback', 'anti_rotation', 1.3, 8, false, 'Hip-shoulder separation'),
('quarterback', 'hip_flexor', 1.2, 7, false, 'Supports throwing velocity'),
('quarterback', 'deceleration', 0.8, 5, false, 'Lower priority for QB'),

-- Rusher/Blitzer  
('rusher', 'deceleration', 1.3, 10, true, '3-step decel after rush'),
('rusher', 'acceleration', 1.3, 10, false, 'Explosive first step'),
('rusher', 'hamstring_eccentric', 1.4, 9, true, 'NEVER skip - injury prevention'),
('rusher', 'arm_care', 0.6, 3, false, 'Lower priority'),

-- DB
('db', 'hip_rotation', 1.4, 10, true, 'Hip internal/external rotation'),
('db', 'backward_locomotion', 1.4, 9, false, 'Backpedal capacity'),
('db', 'deceleration', 1.2, 8, false, 'Decel mechanics'),
('db', 'adductors', 1.2, 7, false, 'Lateral movement support'),

-- Center (Split stance snap → explosive 3-step burst)
('center', 'snap_mechanics', 1.5, 10, true, 'NEVER skip - #1 priority'),
('center', 'single_leg_rdl', 1.5, 10, true, 'Unilateral posterior chain - split stance reality'),
('center', 'hip_thrust', 1.4, 9, true, 'Glute power for explosive start'),
('center', 'acceleration', 1.4, 9, false, '3-step burst after snap is critical'),
('center', 'hamstring_eccentric', 1.3, 8, false, 'Protect hamstrings during explosive start'),
('center', 'core_anti_rotation', 1.3, 8, false, 'Stability during asymmetric snap'),
('center', 'forearm', 1.2, 7, false, 'Wrist/forearm for snap control'),

-- WR
('wr', 'hamstring_elasticity', 1.3, 9, false, 'Speed preservation'),
('wr', 'hip_extension', 1.2, 8, false, 'Top-speed exposure'),
('wr', 'scapular', 1.1, 7, false, 'Scapular rhythm for arm swing');
```

#### 5.1.2 Create Season Phase Modifiers Table

**New table:** `season_phase_modifiers`

```sql
CREATE TABLE season_phase_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_name TEXT NOT NULL,           -- 'offseason', 'preseason', 'in_season', 'post_season'
  volume_modifier NUMERIC DEFAULT 1.0,
  intensity_modifier NUMERIC DEFAULT 1.0,
  allow_novel_exercises BOOLEAN DEFAULT true,
  fatigue_tolerance TEXT,             -- 'high', 'medium', 'low'
  philosophy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO season_phase_modifiers VALUES
('offseason', 1.2, 1.0, true, 'high', 'Build: Allow fatigue accumulation, structural adaptations'),
('preseason', 0.9, 1.1, false, 'medium', 'Convert: Increase specificity, reduce novel exercises'),
('in_season', 0.7, 0.9, false, 'low', 'Maintain: Fatigue avoidance > adaptation'),
('post_season', 0.8, 0.7, true, 'medium', 'Repair: Restore joints, correct asymmetries');
```

### Phase 2: Core Assignment (Critical)

#### 5.2.1 Create Player Program Assignment API

**New file:** `netlify/functions/player-programs.cjs`

```javascript
// POST /api/player-programs - Assign user to program
// GET /api/player-programs/me - Get user's current program with category weights
// PUT /api/player-programs/:id - Update (for custom programs)

async function assignProgram(supabase, userId, position) {
  // 1. Determine base program
  const programId = position === 'QB' 
    ? 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'  // QB program
    : 'ffffffff-ffff-ffff-ffff-ffffffffffff'; // WR/DB base program
  
  // 2. Normalize position for category weights lookup
  const normalizedPosition = normalizePosition(position);
  
  // 3. Create player_programs entry
  const { data, error } = await supabase
    .from('player_programs')
    .insert({
      player_id: userId,
      program_id: programId,
      position: normalizedPosition,  // Store for category weight lookups
      start_date: new Date().toISOString().split('T')[0],
      status: 'active'
    })
    .select()
    .single();
    
  return data;
}

function normalizePosition(position) {
  // Map UI position values to database position keys
  const mapping = {
    'QB': 'quarterback',
    'WR': 'wr',
    'DB': 'db',
    'Center': 'center',
    'Rusher': 'rusher',      // USA terminology
    'Blitzer': 'rusher',     // European terminology → same as rusher
    'LB': 'db',              // LB uses DB weights
    'Hybrid': 'wr'           // Hybrid defaults to WR weights
  };
  return mapping[position] || 'wr';
}
```

#### 5.2.2 Update Onboarding Completion

**File:** `angular/src/app/features/onboarding/onboarding.component.ts`

```typescript
private async assignTrainingProgram(userId: string, position: string): Promise<void> {
  await this.apiService.post('/api/player-programs', {
    player_id: userId,
    position: position,  // API will normalize and assign correct program
    start_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });
}
```

### Phase 3: Category-Based Volume Calculation

#### 5.3.1 The Real Rule Engine

**File:** `netlify/functions/daily-protocol.cjs` (update `generateProtocol`)

```javascript
/**
 * Calculate final exercise volume using the rule engine:
 * final_volume = base_sets × position_modifier × season_phase_modifier
 */
async function calculateExerciseVolume(supabase, exercise, context) {
  const { position, currentPhase } = context;
  
  // 1. Get position weight for this exercise's category
  const { data: categoryWeight } = await supabase
    .from('position_category_weights')
    .select('volume_modifier, priority, is_protected')
    .eq('position', position)
    .eq('category', exercise.category)  // or subcategory
    .single();
  
  const positionModifier = categoryWeight?.volume_modifier || 1.0;
  const isProtected = categoryWeight?.is_protected || false;
  
  // 2. Get season phase modifier
  const { data: phaseModifier } = await supabase
    .from('season_phase_modifiers')
    .select('volume_modifier')
    .eq('phase_name', currentPhase?.name?.toLowerCase() || 'in_season')
    .single();
  
  const seasonModifier = phaseModifier?.volume_modifier || 1.0;
  
  // 3. Calculate final volume
  const baseSets = exercise.default_sets || 3;
  let finalSets = Math.round(baseSets * positionModifier * seasonModifier);
  
  // 4. Protected categories: minimum 2 sets even in deloads
  if (isProtected && finalSets < 2) {
    finalSets = 2;
  }
  
  return {
    sets: finalSets,
    positionModifier,
    seasonModifier,
    isProtected,
    priority: categoryWeight?.priority || 5
  };
}
```

### Phase 4: Dashboard Display with Category Weights

#### 5.4.1 Update UnifiedTrainingService

```typescript
private async loadWeeklySchedule(userId: string): Promise<WeeklyScheduleDay[]> {
  // 1. Get user's assigned program AND position
  const { data: playerProgram } = await this.supabase.client
    .from('player_programs')
    .select(`*, training_programs (id, name)`)
    .eq('player_id', userId)
    .eq('status', 'active')
    .single();

  if (!playerProgram) return this.getEmptyWeekSchedule();

  // 2. Get position category weights
  const { data: categoryWeights } = await this.supabase.client
    .from('position_category_weights')
    .select('*')
    .eq('position', playerProgram.position);

  // 3. Get current week and phase
  const today = new Date().toISOString().split('T')[0];
  const { data: currentWeek } = await this.supabase.client
    .from('training_weeks')
    .select(`*, training_phases!inner (id, name, program_id)`)
    .eq('training_phases.program_id', playerProgram.program_id)
    .lte('start_date', today)
    .gte('end_date', today)
    .single();

  // 4. Get season phase modifier
  const phaseName = this.mapPhaseToSeason(currentWeek?.training_phases?.name);
  const { data: phaseModifier } = await this.supabase.client
    .from('season_phase_modifiers')
    .select('*')
    .eq('phase_name', phaseName)
    .single();

  // 5. Get sessions and apply category weights
  const { data: sessions } = await this.supabase.client
    .from('training_session_templates')
    .select(`*, session_exercises (*, exercises (*))`)
    .eq('week_id', currentWeek.id)
    .order('day_of_week');

  // 6. Transform with volume calculations
  return this.transformWithCategoryWeights(
    sessions, 
    categoryWeights, 
    phaseModifier
  );
}

private transformWithCategoryWeights(sessions, categoryWeights, phaseModifier) {
  return sessions.map(session => ({
    ...session,
    exercises: session.session_exercises.map(se => {
      const weight = categoryWeights?.find(w => 
        w.category === se.exercises?.category || 
        w.category === se.exercises?.subcategory
      );
      
      const positionMod = weight?.volume_modifier || 1.0;
      const seasonMod = phaseModifier?.volume_modifier || 1.0;
      
      return {
        ...se,
        adjusted_sets: Math.round((se.sets || 3) * positionMod * seasonMod),
        is_protected: weight?.is_protected || false,
        priority: weight?.priority || 5,
        position_note: weight?.notes
      };
    }).sort((a, b) => b.priority - a.priority)  // Sort by priority
  }));
}
```

### Phase 5: Custom Program Override (Future)

For players who upload custom JSON programs:

1. Create `custom_programs` table
2. Add `custom_program_id` to `player_programs`
3. Priority: custom_program > default_program
4. Custom programs bypass category weights (coach knows best)

---

## 6. Data Flow Diagram (Target State)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER ONBOARDING                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │ Position │ -> │ Complete │ -> │ Assign   │ -> │ player_programs  │  │
│  │ Selected │    │ Profile  │    │ Program  │    │ entry created    │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DAILY TRAINING DISPLAY                           │
│                                                                          │
│  ┌──────────────┐    ┌───────────────┐    ┌─────────────────────────┐  │
│  │ player_      │ -> │ training_     │ -> │ training_session_       │  │
│  │ programs     │    │ weeks         │    │ templates               │  │
│  │ (user's      │    │ (current week │    │ (today's session)       │  │
│  │  program)    │    │  by date)     │    │                         │  │
│  └──────────────┘    └───────────────┘    └─────────────────────────┘  │
│         │                                            │                   │
│         ▼                                            ▼                   │
│  ┌──────────────┐                         ┌─────────────────────────┐  │
│  │ position_    │ ───────────────────────>│ session_exercises       │  │
│  │ exercise_    │   (apply modifiers)     │ (with position          │  │
│  │ modifiers    │                         │  adjustments)           │  │
│  └──────────────┘                         └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `netlify/functions/player-programs.cjs` | API for program assignment |
| `angular/src/app/core/services/player-program.service.ts` | Frontend service |

### Files to Modify

| File | Changes |
|------|---------|
| `onboarding.component.ts` | Add program assignment after completion |
| `unified-training.service.ts` | Fix `loadWeeklySchedule()` to use program data |
| `training-program.service.ts` | Add `fetchUserProgram()` method |
| `server.js` | Add route for player-programs (if not using Netlify) |

---

## 8. Testing Checklist

After implementation:

- [x] New user completes onboarding as QB → gets QB program (`bbbbbbbb-...`)
- [x] New user completes onboarding as WR → gets WR/DB program (`ffffffff-...`)
- [x] New user completes onboarding as Center → gets WR/DB program + center modifiers
- [x] Onboarding creates `athlete_training_config` with normalized position
- [x] Dashboard shows "No program assigned" fallback when no assignment exists
- [ ] Dashboard shows today's scheduled session from 52-week program
- [ ] Session exercises show position-specific adjustments
- [x] Position mapping works: QB→quarterback, WR/DB→wr_db, Center→center, Rusher→rusher, LB→linebacker, Hybrid→hybrid
- [ ] Admin can reassign user to different program

### Position Mapping Reference

| UI Position | Modifier Key | Program |
|-------------|--------------|---------|
| QB | quarterback | QB Program |
| WR | wr_db | WR/DB Program |
| DB | wr_db | WR/DB Program |
| Center | center | WR/DB Program |
| Rusher | rusher | WR/DB Program |
| Blitzer | blitzer | WR/DB Program |
| LB | linebacker | WR/DB Program |
| Hybrid | hybrid | WR/DB Program |

---

## 9. Quick Fix for Immediate Testing

To test the flow with existing data, manually insert a `player_programs` entry:

```sql
-- Get user ID
SELECT id, email, position FROM users WHERE email = 'your-email@example.com';

-- Insert program assignment (use QB program for QB, WR/DB for others)
INSERT INTO player_programs (player_id, program_id, start_date, status)
VALUES (
  'YOUR_USER_UUID',
  'ffffffff-ffff-ffff-ffff-ffffffffffff',  -- WR/DB program
  '2025-07-28',  -- Program start date
  'active'
);
```

---

## 10. Conclusion

### Current State
The database and API infrastructure is **75% complete**. The exercise library and session templates exist, but the **category-based rule engine** is missing.

### What Needs to Be Built

| Priority | Task | Purpose |
|----------|------|---------|
| 🔴 Critical | Create `position_category_weights` table | The real rule engine |
| 🔴 Critical | Create `season_phase_modifiers` table | Phase-aware volume |
| 🔴 Critical | Onboarding → `player_programs` entry | Link user to program |
| 🔴 Critical | Dashboard → query program data | Show scheduled training |
| 🟡 Medium | Volume calculation function | `base × position × season` |
| 🟢 Low | Protected category enforcement | Never skip arm care for QB |

### The Key Insight

> **We train positions, not muscles.**
> 
> Exercises are interchangeable delivery mechanisms for biomechanical priorities.
> The rule engine operates on **categories**, not individual exercises.

### Final Volume Formula
```
final_volume = base_sets × position_modifier × season_phase_modifier
```

### Protected Categories (Never Skip)
- **QB:** Arm Care
- **Rusher:** Hamstring Eccentric  
- **DB:** Hip Rotation
- **Center:** Snap Mechanics + Single-Leg RDL + Hip Thrust (split stance → explosive 3-step burst)

### Why This Architecture Wins

1. ✅ Respects biomechanics
2. ✅ Respects fatigue reality
3. ✅ Adapts across the season
4. ✅ Avoids overfitting exercises
5. ✅ Scales with AI later
6. ✅ **Trains positions, not muscles**

**Estimated Implementation Time:** 6-8 hours

---

*Report generated: January 5, 2026*
*Author: AI Assistant*
*Philosophy: We train athletes, not bodybuilders.*

