# Personalized Planning & Automation Guide

## Overview

Goal-based training plan system with automated periodization, game-day awareness, and ACWR-based progression rules.

## Features

### ✅ 1. Goal-Based Training Plans

**Service:** `TrainingPlanService` (`angular/src/app/core/services/training-plan.service.ts`)

Auto-generates weekly training templates based on athlete goals:

- **Speed**: Acceleration, top speed, mechanics
- **Change of Direction**: Lateral movement, deceleration, reactive COD
- **Agility**: Footwork, quickness, multi-directional movement
- **Route Running**: Route mechanics, separation, catch drills
- **Defense**: Backpedal, coverage, ball skills
- **Power**: Max strength, explosive movements, plyometrics
- **Endurance**: Aerobic base, VO2 max, lactate threshold

**Usage:**

```typescript
import { TrainingPlanService } from './core/services/training-plan.service';

constructor(private planService: TrainingPlanService) {}

generatePlan() {
  const plan = this.planService.generateWeeklyPlan({
    goal: 'speed',
    currentACWR: 1.2,
    readinessLevel: 'moderate',
    gameDays: [new Date('2024-01-20')],
    trainingDaysPerWeek: 5
  });
}
```

### ✅ 2. Enhanced Microcycle Planner

**Component:** `MicrocyclePlannerComponent` (enhanced)

**Game-Day Auto-Adjustments:**

- **48-72 hours before game**: Deload sprints (50% volume reduction)
- **24-48 hours before game**: Minimal sprint work (2-3 sprints)
- **<24 hours before game**: Rest or very light (20 min mobility)
- **Game day**: Complete rest

**ACWR-Based Progression:**

- **ACWR > 1.5**: Reduce volume 30%, target ACWR 1.2
- **ACWR > 1.3**: Reduce volume 15%, target ACWR 1.25
- **ACWR < 0.8**: Increase volume 10%, target ACWR 1.0
- **ACWR 0.8-1.3**: Maintain current load

### ✅ 3. ACWR Progression Rules

**Automatic Volume Adjustments:**

```typescript
// Progression logic in TrainingPlanService
if (acwr > 1.5) {
  volumeMultiplier = 0.6; // Reduce by 40%
  intensityAdjustment = -1; // Lower intensity
} else if (acwr > 1.3) {
  volumeMultiplier = 0.8; // Reduce by 20%
  intensityAdjustment = -1;
} else if (acwr < 0.8) {
  volumeMultiplier = 1.2; // Increase by 20%
  intensityAdjustment = 1; // Can increase intensity
}
```

**Readiness Integration:**

- Low readiness: Additional 30% volume reduction
- High readiness: 10% volume increase allowed

## Components

### GoalBasedPlannerComponent

**Location:** `angular/src/app/features/training/goal-based-planner.component.ts`

**Features:**

- Goal selection dropdown
- Real-time ACWR and readiness display
- Auto-generated weekly plan with exercises
- Plan summary with volume adjustments
- Traffic light risk indicator

**Usage:**

```typescript
<app-goal-based-planner [athleteId]="'athlete-uuid'"></app-goal-based-planner>
```

### Enhanced MicrocyclePlannerComponent

**Location:** `angular/src/app/features/training/microcycle-planner.component.ts`

**New Features:**

- Game proximity detection (48-72 hour deload)
- ACWR-based volume adjustments
- Readiness level integration
- Projected ACWR for each day

## Periodization Logic

### Phase Determination

Automatically determines training phase based on ACWR and readiness:

```typescript
determinePhase(acwr, readiness) {
  if (acwr > 1.5 || readiness === 'low') return 'foundation'; // Deload
  if (acwr < 0.8) return 'strength'; // Can push harder
  return 'foundation'; // Default
}
```

### Training Templates

Each goal has foundation and strength phase templates:

- **Foundation Phase**: Lower volume, technique focus
- **Strength Phase**: Higher volume, intensity focus

Templates include:

- Session type (speed, agility, strength, technique, etc.)
- Focus areas
- Specific exercises
- Duration, intensity, volume
- Rest periods
- Notes

## Game-Day Integration

### Fixtures Endpoint

**Function:** `fixtures.cjs`
**Endpoint:** `GET /api/fixtures?athleteId=uuid&days=14`

Returns upcoming game dates for game proximity calculations.

### Auto-Deload Logic

```typescript
// 48-72 hours before game
if (hoursUntilGame > 48 && hoursUntilGame <= 72) {
  // Reduce sprint volume by 50%
  volume = volume * 0.5;
  intensity = "low";
}

// 24-48 hours before game
if (hoursUntilGame > 24 && hoursUntilGame <= 48) {
  // Minimal sprint work (2-3 sprints)
  volume = 2 - 3;
  intensity = "low";
}

// <24 hours before game
if (hoursUntilGame <= 24) {
  // Rest or very light
  sessionType = "recovery";
  duration = 20;
}
```

## Progression Rules

### Volume Adjustments

Based on ACWR thresholds:

| ACWR Range | Volume Adjustment | Target ACWR | Reasoning                           |
| ---------- | ----------------- | ----------- | ----------------------------------- |
| > 1.5      | -30%              | 1.2         | Danger zone - significant reduction |
| 1.3 - 1.5  | -15%              | 1.25        | Elevated risk - moderate reduction  |
| 0.8 - 1.3  | Maintain          | Current     | Sweet spot - no change              |
| < 0.8      | +10%              | 1.0         | Under-training - can increase       |

### Intensity Adjustments

- **ACWR > 1.3**: Reduce intensity by one level (high → medium → low)
- **ACWR < 0.8**: Can increase intensity by one level
- **Readiness low**: Additional intensity reduction

## Integration Flow

1. **Athlete selects goal** → GoalBasedPlannerComponent
2. **System fetches**:
   - Current ACWR (from AcwrService)
   - Readiness level (from ReadinessService)
   - Upcoming games (from fixtures endpoint)
3. **Plan generation**:
   - Gets base template for goal + phase
   - Adjusts for ACWR (volume/intensity)
   - Adjusts for game proximity (deload rules)
   - Applies progression rules
4. **Output**: Weekly plan with daily sessions

## Database Requirements

- `training_sessions` table with `rpe` field
- `wellness_logs` table for readiness calculation
- `fixtures` table for game dates
- `readiness_scores` table (optional, for history)

## Usage Example

```typescript
// In your component
import { GoalBasedPlannerComponent } from './features/training/goal-based-planner.component';
import { MicrocyclePlannerComponent } from './features/training/microcycle-planner.component';

@Component({
  template: `
    <!-- Goal-based plan generator -->
    <app-goal-based-planner [athleteId]="athleteId"></app-goal-based-planner>

    <!-- Enhanced microcycle planner -->
    <app-microcycle-planner [athleteId]="athleteId"></app-microcycle-planner>
  `
})
```

## Key Benefits

1. **Automated Planning**: No manual plan creation needed
2. **Evidence-Based**: Uses ACWR, readiness, and game proximity
3. **Goal-Specific**: Tailored exercises for each training goal
4. **Auto-Adjustment**: Responds to ACWR and readiness changes
5. **Game-Aware**: Automatically deloads before games
6. **Progressive**: Maintains optimal workload band

## Files Created

- `angular/src/app/core/services/training-plan.service.ts` - Goal-based plan generation
- `angular/src/app/features/training/goal-based-planner.component.ts` - Goal selection UI
- `netlify/functions/fixtures.cjs` - Game fixtures endpoint

## Files Enhanced

- `angular/src/app/features/training/microcycle-planner.component.ts` - Added game-day awareness and ACWR progression
