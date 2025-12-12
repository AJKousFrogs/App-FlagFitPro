# Readiness Score System Guide

## Overview

Evidence-based readiness scoring system that combines:
- **Session-RPE** (RPE × duration) for training load
- **ACWR** (Acute:Chronic Workload Ratio) from 7-day/28-day rolling averages
- **Wellness metrics** (fatigue, sleep quality, soreness)
- **Game proximity** (time until next game)

Outputs a **0-100 readiness score** with actionable suggestions (deload/maintain/push).

## Database Schema

### Migration: `033_readiness_score_system.sql`

**Tables Created:**

1. **`wellness_logs`** - Daily wellness data for readiness calculation
   - `fatigue` (1-10): 1 = very fresh, 10 = exhausted
   - `sleep_quality` (1-10): 1 = poor, 10 = excellent
   - `soreness` (1-10): 1 = none, 10 = very sore
   - `sleep_hours` (optional)

2. **`fixtures`** - Game fixtures for proximity calculation
   - `game_start`: Timestamp of game
   - `athlete_id` or `team_id`: Links to athlete/team

3. **`readiness_scores`** - Materialized daily readiness scores
   - `score` (0-100): Composite readiness score
   - `level`: 'low', 'moderate', or 'high'
   - `suggestion`: 'deload', 'maintain', or 'push'
   - Component scores: workload, wellness, sleep, proximity

**Modifications:**

- Adds `rpe` column to `training_sessions` table if missing
- Creates sync trigger from `wellness_data` to `wellness_logs` (if wellness_data exists)

## Backend (Netlify Functions)

### `calc-readiness.cjs`

**Endpoint:** `POST /api/calc-readiness`

**Request:**
```json
{
  "athleteId": "uuid",
  "day": "2024-01-15" // optional, defaults to today
}
```

**Response:**
```json
{
  "score": 75,
  "level": "high",
  "suggestion": "push",
  "acwr": 1.15,
  "acuteLoad": 450,
  "chronicLoad": 390,
  "componentScores": {
    "workload": 85,
    "wellness": 70,
    "sleep": 90,
    "proximity": 100
  }
}
```

**Scoring Logic:**

1. **Workload Score (40% weight)**
   - ACWR > 1.8: -40 points
   - ACWR > 1.5: -30 points
   - ACWR > 1.3: -15 points
   - ACWR < 0.7: -10 points

2. **Wellness Score (25% weight)**
   - Fatigue penalty: (fatigue - 3) × 6
   - Soreness penalty: (soreness - 3) × 5
   - Minimum score: 40

3. **Sleep Score (20% weight)**
   - sleep_quality ≤ 4: -25 points
   - sleep_quality ≤ 6: -15 points
   - sleep_hours < 6: -10 points

4. **Proximity Score (15% weight)**
   - ≤ 24 hours to game: -25 points
   - ≤ 48 hours: -15 points
   - ≤ 72 hours: -5 points

### `readiness-history.cjs`

**Endpoint:** `GET /api/readiness-history?athleteId=uuid&days=7`

Returns historical readiness scores for the specified number of days.

## Frontend (Angular)

### Service: `ReadinessService`

**Location:** `angular/src/app/core/services/readiness.service.ts`

**Methods:**
- `calculateToday(athleteId)`: Calculate readiness for today
- `calculateForDay(athleteId, day)`: Calculate for specific day
- `getHistory(athleteId, days)`: Get historical scores
- `getSeverity(level)`: Get PrimeNG tag severity
- `getSuggestionText(suggestion)`: Get human-readable suggestion

### Component: `ReadinessWidgetComponent`

**Location:** `angular/src/app/shared/components/readiness-widget/readiness-widget.component.ts`

**Usage:**
```typescript
<app-readiness-widget [athleteId]="'athlete-uuid'"></app-readiness-widget>
```

**Features:**
- Large score display (0-100)
- Color-coded level badge
- ACWR metrics breakdown
- Component scores breakdown
- Refresh button
- Loading and error states

## Evidence Base

### Session-RPE
- **Foster et al. (2001)**: Validated method for internal load
- Formula: RPE (1-10) × Duration (minutes) = Training Load (AU)

### ACWR
- **Gabbett (2016)**: ACWR > 1.5 linked to higher injury risk
- **Sweet spot**: 0.8-1.3 range (though recent work questions rigid thresholds)
- Uses 7-day acute and 28-day chronic rolling averages

### Wellness Markers
- **Fatigue & Soreness**: Track training load across weekly cycle
- **Sleep Quality**: Associates with perceived fatigue
- **Post-Match Recovery**: Worst 1-2 days after, improves by day 3-4

### Game Proximity
- Post-match fatigue peaks immediately after games
- Recovery improves over 3-4 days
- Deload recommended close to game day

## Setup Instructions

1. **Run Database Migration:**
   ```bash
   psql $DATABASE_URL -f database/migrations/033_readiness_score_system.sql
   ```

2. **Add RPE to Training Sessions:**
   - Ensure `training_sessions` table has `rpe` column (migration adds it)
   - Log RPE (1-10) after each session

3. **Log Wellness Data:**
   - Use `wellness_logs` table or sync from `wellness_data`
   - Required fields: `fatigue`, `sleep_quality`, `soreness`

4. **Add Game Fixtures:**
   - Insert into `fixtures` table with `game_start` timestamp

5. **Use in Angular:**
   ```typescript
   import { ReadinessWidgetComponent } from './shared/components/readiness-widget/readiness-widget.component';
   
   <app-readiness-widget [athleteId]="currentAthleteId"></app-readiness-widget>
   ```

## Integration Points

- **Training Sessions**: Uses `training_sessions.rpe` and `duration_minutes`
- **Wellness**: Uses `wellness_logs` (syncs from `wellness_data` if exists)
- **ACWR**: Calculates from session-RPE loads
- **Fixtures**: Uses `fixtures` table for game proximity

## Customization

The scoring weights are tunable in `calc-readiness.cjs`:
- Workload: 40%
- Wellness: 25%
- Sleep: 20%
- Proximity: 15%

Adjust thresholds and penalties based on your team's data and preferences.

