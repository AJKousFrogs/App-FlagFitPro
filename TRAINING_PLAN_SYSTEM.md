# Training Plan Generation System

## Overview

This document describes the comprehensive training plan generation system that uses real, stored data up to and including "today" to generate evidence-based training plans respecting periodization phases, ACWR, and domestic vs international schedules.

## Core Principles

### 1. Real Data Only
- ✅ Always uses stored training sessions up to and including today
- ✅ Never mixes future/planned sessions into completed statistics
- ✅ History queries filter: `session_date <= TODAY (23:59:59)`

### 2. Periodization Respect
- ✅ Detects current phase from training programs or seasonal calendar
- ✅ Phases: `off_season`, `pre_season`, `in_season`, `mid_season`, `deload`
- ✅ Adjusts volume/intensity based on phase

### 3. ACWR-Based Load Management
- ✅ Calculates ACWR from last 7 days (acute) vs 28 days (chronic)
- ✅ Risk zones: `safe` (0.8-1.3), `caution` (1.3-1.5), `danger` (1.5-1.8), `critical` (>1.8), `detraining` (<0.8)
- ✅ Automatically adjusts load based on ACWR

### 4. Domestic vs International Separation
- ✅ Tracks domestic games and international tournaments separately
- ✅ Prioritizes based on proximity (closer game = higher priority)
- ✅ Handles both calendars without mixing

### 5. Game Proximity Logic
- ✅ Game day: Only mobility/recovery
- ✅ 1 day before game: Active recovery only
- ✅ 2 days before game: Light session
- ✅ 3 days before game: Moderate taper
- ✅ 4+ days before game: Normal training

## Architecture

### Backend: `training-plan.cjs`

**Endpoint**: `/.netlify/functions/training-plan`

**GET Request**:
```
GET /.netlify/functions/training-plan?date=2025-12-15
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "date": "2025-12-15",
    "sessions": [
      {
        "timeOfDay": "morning",
        "type": "mobility",
        "title": "Morning Mobility & Foam Rolling",
        "duration": 10,
        "content": [
          {
            "exercise": "10-minute mobility routine",
            "type": "video",
            "link": "https://www.youtube.com/watch?v=mobility-routine",
            "description": "Full body mobility and activation"
          }
        ],
        "intensity": "low",
        "rpe": 2
      },
      {
        "timeOfDay": "afternoon",
        "type": "gym",
        "title": "Strength & Conditioning",
        "duration": 60,
        "content": [...],
        "intensity": "high",
        "rpe": 7
      }
    ],
    "explanation": "ACWR is 1.15 (safe zone) - optimal training load. Current phase: in_season - maintaining fitness while prioritizing recovery. 3 days until next domestic game - taper applied.",
    "tomorrowGuidance": {
      "recommendation": "light_session",
      "guidance": "Game day in 2 days - light training session. Focus on skill work and low-intensity conditioning.",
      "sessions": [...]
    },
    "context": {
      "acwr": 1.15,
      "riskZone": "safe",
      "phase": "in_season",
      "phaseFocus": ["Strength", "Recovery"],
      "nextDomesticGame": {
        "date": "2025-12-18",
        "opponent": "Vienna Vikings",
        "daysAway": 3
      },
      "nextInternationalGame": null,
      "gameToday": false
    }
  }
}
```

## Key Functions

### 1. `calculateACWR(userId, date)`
- Calculates acute load (7 days) and chronic load (28 days)
- Only includes sessions up to and including `date`
- Returns ACWR, risk zone, and recommendations

### 2. `determinePeriodizationPhase(userId, date)`
- Checks active training program for current phase
- Falls back to seasonal calendar if no program
- Returns phase name, order, and focus areas

### 3. `getUpcomingGames(userId, date, daysAhead)`
- Gets games from `date` to `date + daysAhead`
- Separates domestic and international
- Returns structured game objects

### 4. `getTodaySessions(userId, date)`
- Gets all sessions scheduled for specific date
- Returns real stored sessions only

### 5. `getTrainingHistory(userId, daysBack)`
- Gets sessions from `TODAY - daysBack` to `TODAY`
- Only includes completed/in_progress sessions
- Used for ACWR and workload calculations

### 6. `generateTrainingPlan(userId, date)`
- Main function that orchestrates plan generation
- Combines ACWR, phase, games, and history
- Returns complete plan with explanation

### 7. `generateSessionsForDay({...})`
- Generates sessions based on constraints
- Applies multipliers: ACWR × Phase × Game Proximity
- Creates morning/afternoon/evening sessions

### 8. `generateTomorrowGuidance({...})`
- Provides recommendations for next day
- Considers game schedule and ACWR
- Returns rest/recovery/training guidance

## Load Calculation Logic

### Multipliers Applied

1. **ACWR Multiplier**:
   - Critical/Danger: 0.5 (50% load)
   - Caution: 0.75 (75% load)
   - Safe: 1.0 (100% load)
   - Detraining: 1.2 (120% load)

2. **Phase Multiplier**:
   - Deload: 0.6
   - Off-season: 0.8
   - Pre-season: 1.1
   - In-season/Mid-season: 1.0

3. **Game Proximity Multiplier**:
   - 1 day before: 0.3
   - 2 days before: 0.6
   - 3 days before: 0.8
   - 4+ days before: 1.0

**Final Load** = Base Load × ACWR Multiplier × Phase Multiplier × Game Proximity Multiplier

## Example Scenarios

### Scenario 1: Game Day
**Date**: Monday, 15 December 2025  
**Game**: Domestic game vs Vienna Vikings

**Plan**:
- Morning: 10-minute mobility only
- Afternoon: None (game day)
- Explanation: "Game day - light mobility only. Focus on activation and preparation."

### Scenario 2: High ACWR, 2 Days Before Game
**Date**: Saturday, 13 December 2025  
**ACWR**: 1.6 (danger zone)  
**Next Game**: Monday, 15 December (2 days away)

**Plan**:
- Morning: Mobility (10 min)
- Afternoon: Light field work (30 min, RPE 4)
- Explanation: "ACWR is 1.6 (danger zone) - load reduced significantly. 2 days until next domestic game - taper applied."

### Scenario 3: Normal Training Day
**Date**: Wednesday, 10 December 2025  
**ACWR**: 1.1 (safe zone)  
**Phase**: In-season  
**Next Game**: Saturday, 13 December (3 days away)

**Plan**:
- Morning: Mobility & foam rolling (10 min)
- Afternoon: Gym session (60 min, RPE 7)
- Explanation: "ACWR is 1.1 (safe zone) - optimal training load. Current phase: in_season - maintaining fitness while prioritizing recovery. 3 days until next domestic game - taper applied."

## Updated Functions

### `training-sessions.cjs`
- Now filters to "up to and including today" by default
- Optional `includeFuture=true` parameter to see planned sessions
- Ensures statistics only include completed data

## Frontend Integration

### API Configuration
```javascript
// Get today's plan
const plan = await apiClient.get(API_ENDPOINTS.trainingPlan.today);

// Get plan for specific date
const plan = await apiClient.get(API_ENDPOINTS.trainingPlan.date('2025-12-15'));
```

### Usage Example
```javascript
import { apiClient } from './api-client.js';
import { API_ENDPOINTS } from './api-config.js';

async function loadTrainingPlan(date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  const response = await apiClient.get(
    API_ENDPOINTS.trainingPlan.date(dateStr)
  );
  
  if (response.success) {
    const plan = response.data;
    
    // Display sessions
    plan.sessions.forEach(session => {
      console.log(`${session.timeOfDay}: ${session.title}`);
      console.log(`Duration: ${session.duration} min, RPE: ${session.rpe}`);
    });
    
    // Show explanation
    console.log(plan.explanation);
    
    // Show tomorrow guidance
    console.log(`Tomorrow: ${plan.tomorrowGuidance.recommendation}`);
    console.log(plan.tomorrowGuidance.guidance);
  }
}
```

## Data Flow

```
1. User requests training plan for date
   ↓
2. Backend calculates ACWR (using sessions ≤ date)
   ↓
3. Backend determines periodization phase
   ↓
4. Backend gets upcoming games (domestic + international)
   ↓
5. Backend gets today's sessions (if any)
   ↓
6. Backend gets training history (for context)
   ↓
7. Backend applies multipliers and generates plan
   ↓
8. Backend generates tomorrow guidance
   ↓
9. Returns complete plan with explanation
```

## Constraints Enforced

### ✅ Never Violates Basic Principles
- No high load days immediately before important tournaments
- Rest days after heavy game days/tournaments
- ACWR-based load reduction when risk is high

### ✅ Respects Periodization
- Phase-appropriate volume and intensity
- Deload weeks reduce load automatically
- Pre-season builds intensity gradually

### ✅ Handles Schedules Separately
- Domestic games prioritized by proximity
- International tournaments tracked separately
- Both influence total load but don't mix

## Benefits

1. **Consistency**: Same logic everywhere
2. **Safety**: ACWR prevents overtraining
3. **Performance**: Periodization optimizes adaptation
4. **Flexibility**: Adapts to game schedule automatically
5. **Transparency**: Clear explanations for every plan

## Future Enhancements

- Add position-specific training content
- Integrate with exercise library
- Add video recommendations from YouTube
- Track plan adherence and adjust
- Machine learning for load prediction
