# FlagFit Pro - Feature Documentation

## Complete Technical & Business Logic Guide

*Version 2.0 | Last Updated: January 2026*

---

## Table of Contents

### Core Features
1. [Dashboard](#1-dashboard)
2. [Training Schedule](#2-training-schedule)
3. [Today's Practice](#3-todays-practice)
4. [Wellness & Recovery](#4-wellness--recovery)
5. [ACWR Dashboard](#5-acwr-dashboard-load-monitoring)

### Competition Features
6. [Travel Recovery](#6-travel-recovery)
7. [Game Day Readiness](#7-game-day-readiness)
8. [Tournament Nutrition](#8-tournament-nutrition)
9. [Game Tracker](#9-game-tracker)
10. [Tournaments](#10-tournaments)

### Team Management
11. [Roster Management](#11-roster-management)
12. [Depth Chart](#12-depth-chart)
13. [Attendance Tracking](#13-attendance-tracking)
14. [Equipment Management](#14-equipment-management)
15. [Officials Management](#15-officials-management)

### Analytics & Intelligence
16. [Analytics](#16-analytics)
17. [AI Coach (Merlin)](#17-ai-coach-merlin)

### User Experience
18. [Global Search](#18-global-search)
19. [Notification Center](#19-notification-center)
20. [Achievements System](#20-achievements-system)

### Account & Settings
21. [User Profile](#21-user-profile)
22. [Settings](#22-settings)
23. [Onboarding](#23-onboarding)

### Physical & Supplement Tracking
24. [Body Composition & Weight Tracking](#24-body-composition--weight-tracking)
25. [Supplement Tracker](#25-supplement-tracker)
26. [Sprint & Performance Benchmarks](#26-sprint--performance-benchmarks)

### Position-Specific Training
27. [QB Hub (Quarterback Training)](#27-qb-hub-quarterback-training)
28. [Position-Specific Statistics Tracking](#28-position-specific-statistics-tracking)
29. [Position-Specific Training System](#29-position-specific-training-system)

### Professional Reports & Integrations
30. [Nutritionist Dashboard & Reports](#30-nutritionist-dashboard--reports)
31. [Physiotherapist Dashboard & Reports](#31-physiotherapist-dashboard--reports)
32. [Psychology/Mental Performance Reports](#32-psychologymental-performance-reports)

### Data Exchange & Knowledge Sharing
33. [Data Import/Export System](#33-data-importexport-system)
34. [Knowledge Drop-In System](#34-knowledge-drop-in-system)

### Communication & Community
35. [Team Chat & Channels](#35-team-chat--channels)
36. [Community Feed](#36-community-feed)

### Recovery & Injury Management
37. [Return-to-Play Protocol](#37-return-to-play-protocol)
38. [Sleep Debt Tracking](#38-sleep-debt-tracking)
39. [Hydration Tracker](#39-hydration-tracker)
40. [Menstrual Cycle Tracking (Female Athletes)](#40-menstrual-cycle-tracking-female-athletes)

### Administration
41. [Superadmin Dashboard](#41-superadmin-dashboard)

### Playbook & Strategy
42. [Playbook Library](#42-playbook-library)
43. [Video Analysis / Film Room](#43-video-analysis--film-room)
44. [Scouting Reports](#44-scouting-reports)
45. [Practice Planning / Play Designer](#45-practice-planning--play-designer)

### Scheduling & Logistics
46. [Team Calendar & RSVP](#46-team-calendar--rsvp)
47. [Financial / Payment Tracking](#47-financial--payment-tracking)
48. [Weather Integration](#48-weather-integration)

### Specialized Dashboards
49. [Exercise Library](#49-exercise-library)

---

## 1. Dashboard

### Purpose
The **Dashboard** serves as the central hub and primary entry point for all users after login. It provides a personalized overview based on user role (Player/Coach).

### Who Uses It
- **Players/Athletes**: Personal performance overview, quick actions, daily status
- **Coaches**: Team-wide overview, player risk alerts, performance trends

---

### Player Dashboard (`/player-dashboard`)

#### Functionality
1. **Welcome Section with AI Insight**
   - Personalized greeting based on time of day
   - AI Coach Merlin provides contextual insight based on:
     - Current readiness score
     - ACWR ratio status
     - Recent training patterns

2. **Key Stats Overview** (4 cards)
   - **Readiness Score** (0-100%)
     - Derived from latest wellness check-in
     - Color-coded indicator: Green (≥70%), Yellow (50-69%), Red (<50%)
   - **ACWR Ratio**
     - Real-time Acute:Chronic Workload Ratio
     - Green (≤1.0), Yellow (1.0-1.3), Red (>1.3)
   - **Current Streak**
     - Consecutive days with logged training
   - **Weekly Progress**
     - Sessions completed vs planned this week

3. **Weekly Progress Visualization**
   - 7-day strip showing completed/pending training days
   - Overall progress percentage bar

4. **Today's Schedule Preview**
   - Top 3 scheduled activities for today
   - Time, title, duration for each
   - Completion status indicators

5. **Quick Actions Grid**
   - Log Training → `/training/log`
   - Videos → `/training/videos`
   - Wellness → `/wellness`
   - Schedule → `/training`
   - Analytics → `/analytics`
   - AI Coach → `/chat`

6. **Performance Trend Chart**
   - 7-day line chart of training load/performance
   - Links to detailed analytics

7. **Upcoming Events**
   - Next 4 scheduled events (games, tournaments, practices)

#### Business Logic
- Dashboard loads training stats from `TrainingStatsCalculationService`
- Merlin insight is dynamically generated based on:
  ```typescript
  if (readiness < 50) → "Low readiness, lighter session recommended"
  if (acwr > 1.3) → "Elevated load, avoid overtraining"
  if (readiness >= 80 && acwr <= 1.0) → "Perfect for high-intensity"
  default → "Stick to your plan"
  ```

---

### Coach Dashboard (`/coach/dashboard`)

#### Functionality
1. **Merlin's Team Briefing**
   - AI-generated team status summary
   - Priority alerts for at-risk athletes

2. **Priority Athletes Strip**
   - Athletes needing immediate attention
   - Sorted by severity (critical → warning → info)
   - Click to view player details

3. **Team Overview Stats**
   - Team name, season record, streak
   - Team readiness percentage
   - Players at risk count
   - Injured players count
   - Team chemistry score

4. **Roster Workspace**
   - Filterable player table (All, At Risk, Injured)
   - Per-player metrics: Performance %, ACWR, Readiness, Status
   - Click row to navigate to player profile

5. **Performance Analytics Tab**
   - Team performance trend chart
   - Historical comparison

6. **Schedule Sidebar**
   - Today's games and practices
   - Quick navigation to full calendar

7. **Quick Command Grid**
   - New Practice → Create training session modal
   - Message Team → Send team notification
   - Injuries → View injury report
   - Roster → Manage roster

#### Business Logic - Risk Alerts
```typescript
// Risk assessment criteria:
- ACWR > 1.5 → Critical risk
- ACWR > 1.3 → Warning
- Readiness < 50 → Warning
- Missed 3+ days → Attention needed
- Injury status → Critical
```

---

## 2. Training Schedule

### Purpose
The **Training Schedule** (`/training`) provides a calendar-based view for athletes to:
- View their full training plan (weekly/monthly)
- Log completed sessions
- Track training history
- Manage upcoming workouts

### Who Uses It
- **Players**: View assigned workouts, log sessions, track consistency
- **Coaches**: Assign training plans, monitor compliance, adjust loads

### Functionality

1. **Calendar View**
   - Monthly calendar with training markers
   - Color-coded by session type (strength, speed, recovery, etc.)
   - Click date to see detailed schedule

2. **Session Details**
   - Session type, duration, intensity
   - Exercises included
   - Completion status (planned/in-progress/completed/missed)

3. **Training Log**
   - Quick log form for completed sessions
   - Fields: Duration, RPE (1-10), Session Type, Notes
   - Movement volume tracking (sprints, cuts, throws)

4. **Historical View**
   - Past sessions with logged data
   - Completion rate statistics
   - Load progression over time

### Business Logic

#### Session Status Mapping
```typescript
DB Status → UI Status:
- 'planned' → 'scheduled'
- 'in_progress' → 'in_progress'
- 'completed' → 'completed'
- 'cancelled' → 'missed'
```

#### Training Load Calculation
```typescript
Session Load (AU) = Duration (min) × RPE × Type Multiplier

Type Multipliers:
- High Intensity Training: 1.2
- Speed/Agility: 1.1
- Strength Training: 1.0
- Technical/Skills: 0.8
- Recovery/Mobility: 0.5
```

---

## 3. Today's Practice

### Purpose
**Today's Practice** (`/today`) shows athletes exactly what they need to do today - their daily training protocol with embedded YouTube videos for exercise demonstrations.

### Who Uses It
- **Players**: Execute daily training with video guidance
- **Coaches**: Monitor athlete completion

### Functionality

1. **Morning Check-in Prompt**
   - Wellness check-in reminder if not completed
   - Direct link to wellness form
   - AI Coach greeting

2. **Week Progress Strip**
   - Visual 7-day progress (Mon-Sun)
   - Today highlighted
   - Completed days marked with checkmark

3. **Readiness Summary**
   - Current ACWR ratio
   - Training days this week (X/7)
   - Required status indicator

4. **Today's Schedule Timeline**
   - Chronological list of today's activities:
     - Wake up time
     - Mobility routine
     - Training sessions
     - Recovery protocols
     - Sleep time
   - Each item shows: Time, Duration, Type, Status

5. **Training Blocks**
   - Expandable protocol blocks
   - Each block contains:
     - Exercise list with sets/reps
     - Embedded YouTube video demos
     - Timer for timed exercises
     - Completion checkboxes

6. **Post-Training Recovery**
   - Recovery recommendations based on session intensity
   - Nutrition suggestions
   - Sleep optimization tips

### Business Logic

#### Protocol Generation
Daily protocols are generated based on:
```typescript
1. Periodization phase (base/build/peak/taper)
2. Days until next competition
3. Previous day's training load
4. Current ACWR status
5. Wellness check-in scores
```

#### Video Integration
- YouTube videos linked to exercises in database
- Fallback to category-based video if specific not found
- Autoplay disabled for bandwidth optimization

---

## 4. Wellness & Recovery

### Purpose
**Wellness** (`/wellness`) enables comprehensive tracking of athlete health metrics to optimize training and prevent injuries.

### Who Uses It
- **Players**: Daily wellness logging, recovery monitoring
- **Coaches**: Monitor team wellness trends, identify at-risk athletes

### Functionality

1. **Wellness Metrics Dashboard**
   - Sleep Quality (hours + quality score)
   - Recovery Score (calculated)
   - Energy Level (1-10)
   - Stress Level (1-10 inverted)

2. **Wellness Charts**
   - 7-day sleep quality trend (line chart)
   - 7-day recovery score trend (bar chart)

3. **Daily Check-in Form**

   **Sleep & Recovery Section:**
   - Sleep Hours (0-24, decimal)
   - Sleep Quality (1-10)

   **Physical State Section:**
   - Energy Level (1-10)
   - Muscle Soreness (1-10, inverted: 1=none, 10=severe)
   - Hydration (glasses of water, target: 8+)
   - Resting Heart Rate (optional, 1-120 BPM)

   **Mental State Section:**
   - Mood (1-10)
   - Stress Level (1-10, inverted)
   - Training Motivation (1-10)
   - Readiness to Train (1-10)

### Business Logic

#### Wellness Score Calculation
```typescript
function calculateWellnessScore(data: WellnessCheckIn): number {
  // Weights for each metric
  const weights = {
    sleepHours: 0.20,      // Target: 7-9 hours
    sleepQuality: 0.15,
    energy: 0.15,
    soreness: 0.15,        // Inverted
    mood: 0.10,
    stress: 0.10,          // Inverted
    motivation: 0.10,
    hydration: 0.05
  };

  // Normalize sleep hours (7-9 optimal = 10, <5 or >10 = lower)
  const sleepScore = normalizedSleep(data.sleepHours);
  
  // Invert soreness and stress (lower is better)
  const sorenessScore = 11 - data.soreness;
  const stressScore = 11 - data.stress;

  // Weighted average
  return (
    sleepScore * weights.sleepHours +
    data.sleepQuality * weights.sleepQuality +
    data.energy * weights.energy +
    sorenessScore * weights.soreness +
    data.mood * weights.mood +
    stressScore * weights.stress +
    data.motivation * weights.motivation +
    normalizedHydration(data.hydration) * weights.hydration
  ) / 10 * 100;
}
```

#### Recovery Status Categories
```typescript
Score 80-100%: "Excellent" (Green) - Ready for high intensity
Score 60-79%:  "Good" (Blue) - Normal training OK
Score 40-59%:  "Moderate" (Yellow) - Consider reduced load
Score 0-39%:   "Poor" (Red) - Recovery day recommended
```

#### Elevated Heart Rate Detection
```typescript
// If resting HR is 10+ BPM above athlete's baseline
if (todayHR - baselineHR >= 10) {
  alert: "Elevated resting heart rate may indicate fatigue or illness"
  recommendation: "Consider lighter training today"
}
```

---

## 5. ACWR Dashboard (Load Monitoring)

### Purpose
The **ACWR Dashboard** (`/acwr`) displays real-time Acute:Chronic Workload Ratio analysis to prevent overtraining injuries - critical for Olympic preparation.

### Who Uses It
- **Players**: Monitor personal training load balance
- **Coaches**: Track team-wide injury risk patterns

### Functionality

1. **Main ACWR Display**
   - Large circular ACWR ratio indicator
   - Color-coded by risk zone
   - Current value to 2 decimal places

2. **Risk Zone Indicator**
   - Visual status badge
   - Zone label and description
   - Injury risk percentage

3. **Load Breakdown**
   - **Acute Load (7-day)**: Current fatigue level in Arbitrary Units (AU)
   - **Chronic Load (28-day)**: Fitness base in AU
   - Visual representation: Acute ÷ Chronic = ACWR

4. **Alert Banner**
   - Critical/Warning/Info alerts
   - Specific recommendations
   - Dismissable notifications

5. **Data Quality Indicator**
   - Days with logged data (X/21 minimum)
   - Sessions in chronic window (X/10 minimum)
   - Progress toward reliable ACWR

6. **Training Recommendations**
   - Based on current ACWR zone
   - Specific intensity guidelines
   - Activity suggestions

### Business Logic

#### ACWR Calculation
```typescript
// Standard ACWR Formula
ACWR = Acute Load / Chronic Load

// Acute Load (Rolling 7-day average)
Acute Load = Sum of last 7 days' training load / 7

// Chronic Load (Rolling 28-day average)
Chronic Load = Sum of last 28 days' training load / 28

// Exponentially Weighted Moving Average (EWMA) variant
// Better for accounting for recent training emphasis
EWMA Chronic = (Today's Load × λ) + ((1 - λ) × Yesterday's EWMA)
where λ = 2 / (N + 1), N = 28 days
```

#### Risk Zones
```typescript
const RISK_ZONES = {
  'very-low': {
    range: [0, 0.8],
    color: '#3B82F6',  // Blue
    label: 'Undertrained',
    description: 'Training load too low - fitness declining',
    injuryRisk: 'Low but deconditioning risk'
  },
  'sweet-spot': {
    range: [0.8, 1.3],
    color: '#22C55E',  // Green
    label: 'Optimal Zone',
    description: 'Training load balanced for adaptation',
    injuryRisk: 'Minimal (baseline)'
  },
  'caution': {
    range: [1.3, 1.5],
    color: '#F59E0B',  // Yellow
    label: 'Caution Zone',
    description: 'Elevated load - monitor closely',
    injuryRisk: 'Moderate (+25-50%)'
  },
  'danger-zone': {
    range: [1.5, Infinity],
    color: '#EF4444',  // Red
    label: 'Danger Zone',
    description: 'High injury risk - reduce load immediately',
    injuryRisk: 'High (+200-400%)'
  }
};
```

#### Minimum Data Requirements
```typescript
// For reliable ACWR calculation:
const MIN_REQUIREMENTS = {
  daysWithData: 21,           // At least 21 days of logging
  sessionsInChronicWindow: 10 // At least 10 sessions in 28 days
};

// If not met, show "Insufficient Data" state with progress
```

#### Training Load Calculation
```typescript
// Per session load
Session Load (AU) = Duration (min) × RPE (1-10) × Intensity Multiplier

// Daily load = sum of all sessions
// Weekly acute = rolling 7-day sum
// Monthly chronic = rolling 28-day average
```

---

## 6. Travel Recovery

### Purpose
**Travel Recovery** (`/travel/recovery`) provides evidence-based protocols for managing jet lag (flights) and blood circulation (long car trips) - essential for Olympic athletes traveling to LA 2028 and Brisbane 2032.

### Who Uses It
- **Players**: Plan travel, follow recovery protocols
- **Coaches**: Ensure team arrives competition-ready

### Functionality

#### Flight Travel (Jet Lag Protocols)

1. **Olympic Quick Select**
   - Pre-configured destinations: LA 2028 (UTC-8), Brisbane 2032 (UTC+10)
   - Auto-calculates timezone difference from home
   - Shows estimated recovery days

2. **Trip Planning Form**
   - Trip name
   - Home timezone / Destination timezone
   - Departure / Arrival dates
   - Competition date (optional)
   - Flight duration, layovers

3. **Jet Lag Severity Assessment**
   ```typescript
   Jet Lag Score = |Timezone Difference| × Direction Multiplier

   Direction Multipliers:
   - Eastward travel: 1.5 (harder to adjust)
   - Westward travel: 1.0 (easier to adjust)

   Estimated Recovery Days = Timezone Difference × 0.5 (east) or × 0.33 (west)
   ```

4. **Daily Protocol (Per Day)**
   - **Sleep Window**: Optimal bedtime and wake time
   - **Light Exposure**: When to seek/avoid light
   - **Training Guidelines**: Allowed intensity, max duration, recommended/avoid activities
   - **Hydration Target**: Daily ml goal (elevated during travel)
   - **Key Recommendations**: Time-stamped actions with priority
   - **Supplements**: Melatonin timing, caffeine windows, electrolytes

5. **Full Recovery Timeline**
   - Pre-travel (2-3 days before)
   - Travel day
   - Post-arrival (daily until adapted)
   - Competition-ready confirmation

6. **Travel Checklist**
   - Essential items (passport, compression socks, melatonin)
   - Recommended items (eye mask, earplugs, snacks)
   - Tech items (phone charger, headphones)

#### Car Travel (Circulation Protocols)

1. **Trip Setup**
   - Trip name
   - Duration (hours)
   - Driver or passenger
   - Competition date (optional)

2. **Blood Circulation Risk Assessment**
   ```typescript
   Risk Score = Base Score + Duration Factor + Mobility Factor

   Risk Levels:
   - Low (4-6 hours): Score 1-3
   - Moderate (6-8 hours): Score 4-6
   - High (8-12 hours): Score 7-8
   - Very High (12+ hours): Score 9-10

   Risk Factors:
   - Duration > 6 hours
   - No movement for > 2 hours
   - Dehydration
   - Previous DVT history (if known)
   ```

3. **Compression Garment Guidelines**
   - Recommended type: Graduated compression socks (15-20 mmHg)
   - When to wear: Put on before departure
   - When to remove: Only at rest stops, overnight
   - Cautions: Don't fold tops, check for numbness

4. **Massage Gun Protocol**
   - Pre-travel routine (calves, quads, glutes)
   - Rest stop routine (quick 2-minute protocol)
   - Post-arrival routine (full lower body)
   - Target muscles, duration, technique

5. **Seated Circulation Exercises**
   Every 30 minutes while seated:
   - Ankle circles (2 sets × 10 reps each direction)
   - Toe raises (2 sets × 15 reps)
   - Knee lifts (2 sets × 10 reps)
   - Glute squeezes (2 sets × 10 reps, hold 3s)

6. **Rest Stop Protocol**
   Every 2 hours (10-15 minutes):
   - Stand and walk for 5 minutes minimum
   - Calf raises (20 reps)
   - Leg swings (10 each leg)
   - Hydrate (250-500ml)

7. **Warning Symptoms**
   Stop immediately and seek help if:
   - Leg swelling or warmth
   - Chest pain or shortness of breath
   - Calf pain or tenderness
   - Skin discoloration

### Business Logic - Jet Lag Protocol Generation

```typescript
function generateProtocol(plan: TravelPlan): RecoveryProtocol[] {
  const protocols: RecoveryProtocol[] = [];
  const tzDiff = calculateTimezoneDiff(plan.departureTimezone, plan.arrivalTimezone);
  const direction = tzDiff > 0 ? 'eastward' : 'westward';
  const recoveryDays = Math.ceil(Math.abs(tzDiff) * (direction === 'eastward' ? 0.5 : 0.33));

  // Pre-travel days (start adjusting 2-3 days before)
  for (let day = -2; day <= 0; day++) {
    protocols.push(generateDayProtocol(day, 'pre-travel', tzDiff, direction));
  }

  // Post-arrival days
  for (let day = 1; day <= recoveryDays; day++) {
    const phase = day <= recoveryDays / 2 ? 'post-arrival' : 'competition-ready';
    protocols.push(generateDayProtocol(day, phase, tzDiff, direction));
  }

  return protocols;
}

function calculateSleepWindow(day: number, tzDiff: number, direction: string) {
  const baseTime = direction === 'eastward' ? '22:00' : '23:00';
  const adjustment = Math.min(Math.abs(day) * 30, 120); // 30 min/day, max 2 hours

  return {
    bedTime: adjustTime(baseTime, direction === 'eastward' ? -adjustment : adjustment),
    wakeTime: adjustTime('07:00', direction === 'eastward' ? -adjustment : adjustment)
  };
}
```

---

## 7. Game Day Readiness

### Purpose
**Game Day Readiness** (`/game/readiness`) is a pre-competition wellness check-in that calculates an athlete's readiness score and alerts coaches if intervention is needed.

### Who Uses It
- **Players**: Complete 2+ hours before competition
- **Coaches**: Receive alerts for low-readiness athletes, adjust lineup

### Functionality

1. **Readiness Metrics Form** (6 sliders, 1-10 scale)
   - Sleep Quality (weight: 20%)
   - Energy Level (weight: 15%)
   - Muscle Soreness (weight: 20%, inverted)
   - Hydration (weight: 15%)
   - Mental Focus (weight: 15%)
   - Confidence (weight: 15%)

2. **ACWR Badge**
   - Current ACWR displayed
   - Color-coded status

3. **Real-time Score Preview**
   - Shows score as athlete adjusts sliders
   - Updates label and message dynamically

4. **Low-Score Warning**
   - Displays at <70 score
   - Warns that coach will be notified

5. **Notes Field**
   - Free text for concerns
   - E.g., "slight hamstring tightness"

6. **Post-Submission View**
   - Final score display
   - Personalized recommendations
   - Coach notification confirmation
   - Links to Tournament Nutrition and Game Plan

### Business Logic

#### Readiness Score Calculation
```typescript
function calculateReadinessScore(metrics: ReadinessMetric[], acwr: number): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  metrics.forEach(metric => {
    let normalizedValue = metric.value;
    
    // Invert soreness (lower is better for competition)
    if (metric.key === 'soreness') {
      normalizedValue = 11 - metric.value;
    }

    totalWeightedScore += (normalizedValue / 10) * metric.weight;
    totalWeight += metric.weight;
  });

  // ACWR penalty for danger zones
  let acwrPenalty = 0;
  if (acwr > 1.5) acwrPenalty = 15;       // Severe overtraining
  else if (acwr > 1.3) acwrPenalty = 5;   // Elevated load
  else if (acwr < 0.8 && acwr > 0) acwrPenalty = 10;  // Undertrained

  const baseScore = Math.round((totalWeightedScore / totalWeight) * 100);
  return Math.max(0, baseScore - acwrPenalty);
}
```

#### Readiness Categories
```typescript
Score 85-100: "Excellent" - Competition Ready 🟢
Score 70-84:  "Good" - Good to Compete 🔵
Score 55-69:  "Caution" - Proceed with Caution 🟡
Score 0-54:   "Concern" - Concerns Identified 🔴

// Coach notification triggered at <70
```

#### Recommendation Engine
```typescript
function generateRecommendations(metrics, acwr): string[] {
  const recs: string[] = [];

  // Sleep < 6
  if (metrics.sleep.value < 6) {
    recs.push("Consider a 20-minute power nap before warmup");
    recs.push("Increase caffeine intake moderately (200-300mg)");
  }

  // Soreness > 6
  if (metrics.soreness.value > 6) {
    recs.push("Extended dynamic warmup (15-20 minutes)");
    recs.push("Focus on mobility work for affected areas");
    recs.push("Consider reduced sprint volume during competition");
  }

  // Hydration < 6
  if (metrics.hydration.value < 6) {
    recs.push("Drink 500ml water in the next hour");
    recs.push("Add electrolytes to pre-game hydration");
  }

  // Mental Focus < 6
  if (metrics.mental.value < 6) {
    recs.push("5-minute visualization exercise before warmup");
    recs.push("Review game plan and key assignments");
  }

  // ACWR elevated
  if (acwr > 1.3) {
    recs.push("Monitor fatigue levels closely during competition");
    recs.push("Consider rotation strategy with coach");
  }

  return recs.length > 0 ? recs : [
    "Standard dynamic warmup protocol",
    "Stay hydrated throughout competition",
    "Trust your preparation and compete with confidence"
  ];
}
```

---

## 8. Tournament Nutrition

### Purpose
**Tournament Nutrition** (`/game/nutrition`) provides personalized nutrition and hydration timing for multi-game tournament days, crucial for maintaining energy across 3-5 games.

### Who Uses It
- **Players**: Follow nutrition windows, track hydration
- **Coaches**: Ensure team is properly fueled

### Functionality

1. **Tournament Overview Banner**
   - Tournament name
   - Number of games
   - Duration (first to last game)
   - Today's hydration total
   - Nutrition windows completed
   - Time until next game

2. **Game Schedule Editor**
   - Add/edit game times
   - Mark referee duties
   - Set opponent names

3. **Quick Hydration Logger**
   - One-tap buttons: Water (250ml), Electrolyte (350ml), Sports Drink (500ml)
   - Progress bar toward daily target
   - Hydration history

4. **Nutrition Windows** (auto-generated from schedule)
   Types:
   - **Morning**: Pre-tournament breakfast
   - **Pre-game**: 60-90 min before each game
   - **Halftime**: 10-15 min window
   - **Post-game**: 30 min after each game
   - **Between-games**: Recovery window
   - **Referee-duty**: Modified fueling

5. **Per-Window Recommendations**
   - Food recommendations with portions
   - Drink recommendations
   - Supplements (if applicable)
   - Timing guidance
   - Alternatives for dietary restrictions

6. **Cramp Prevention Protocol**
   - Electrolyte loading schedule
   - Sodium/potassium balance
   - Warning signs

### Business Logic

#### Hydration Target Calculation
```typescript
function calculateDailyHydrationTarget(
  athleteWeight: number,  // kg
  numberOfGames: number,
  temperature: number,    // °C
  humidity: number        // %
): number {
  // Base: 35ml per kg body weight
  let baseHydration = athleteWeight * 35;

  // Add 500ml per game
  baseHydration += numberOfGames * 500;

  // Temperature adjustment
  if (temperature > 25) {
    baseHydration += (temperature - 25) * 50;  // +50ml per degree above 25°C
  }

  // Humidity adjustment
  if (humidity > 60) {
    baseHydration *= 1.15;  // +15% for high humidity
  }

  return Math.round(baseHydration);
}

// Example: 70kg athlete, 4 games, 30°C, 70% humidity
// Base: 2450ml + 2000ml (games) + 250ml (temp) = 4700ml × 1.15 = 5405ml
```

#### Nutrition Window Generation
```typescript
function generateNutritionWindows(games: GameSchedule[]): NutritionWindow[] {
  const windows: NutritionWindow[] = [];
  const sortedGames = games.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  // Morning window (always)
  windows.push({
    type: 'morning',
    startTime: '06:00',
    endTime: '08:00',
    title: 'Tournament Day Breakfast',
    priority: 'critical',
    hydrationTarget: 500,
    recommendations: getMorningRecommendations()
  });

  sortedGames.forEach((game, index) => {
    const gameTime = timeToMinutes(game.time);

    // Pre-game window (90-60 min before)
    windows.push({
      type: 'pre-game',
      startTime: minutesToTime(gameTime - 90),
      endTime: minutesToTime(gameTime - 60),
      title: `Pre-Game ${index + 1} Fuel`,
      priority: 'critical',
      hydrationTarget: 300,
      recommendations: getPreGameRecommendations(minutesUntilGame)
    });

    // Post-game window (immediately after, ~30 min)
    const estimatedEndTime = gameTime + 45;  // Assume 45 min game
    windows.push({
      type: 'post-game',
      startTime: minutesToTime(estimatedEndTime),
      endTime: minutesToTime(estimatedEndTime + 30),
      title: `Recovery After Game ${index + 1}`,
      priority: 'high',
      hydrationTarget: 500,
      recommendations: getPostGameRecommendations()
    });

    // Between-games window (if next game > 90 min away)
    if (index < sortedGames.length - 1) {
      const nextGameTime = timeToMinutes(sortedGames[index + 1].time);
      const gap = nextGameTime - estimatedEndTime;
      
      if (gap > 90) {
        windows.push({
          type: 'between-games',
          startTime: minutesToTime(estimatedEndTime + 30),
          endTime: minutesToTime(nextGameTime - 90),
          title: 'Recovery & Reload',
          priority: 'medium',
          hydrationTarget: 400,
          recommendations: getBetweenGamesRecommendations(gap)
        });
      }
    }
  });

  return windows.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}
```

#### Nutrition Recommendations by Window
```typescript
const NUTRITION_RECOMMENDATIONS = {
  morning: [
    { category: 'food', item: 'Oatmeal with banana', amount: '1 cup', reason: 'Complex carbs for sustained energy' },
    { category: 'food', item: 'Eggs or Greek yogurt', amount: '2 eggs / 150g', reason: 'Protein for muscle preparation' },
    { category: 'drink', item: 'Water', amount: '500ml', reason: 'Start hydrated' },
    { category: 'supplement', item: 'Electrolyte tablet', amount: '1 tab', reason: 'Pre-load sodium/potassium' }
  ],
  preGame: [
    { category: 'food', item: 'Banana or energy bar', amount: '1 medium', reason: 'Quick carbs, easy to digest' },
    { category: 'drink', item: 'Sports drink', amount: '300ml', reason: 'Carbs + electrolytes' },
    { category: 'action', item: 'Avoid high-fat foods', reason: 'Slow digestion affects performance' }
  ],
  halftime: [
    { category: 'food', item: 'Orange slices or energy gel', amount: '2-3 slices', reason: 'Quick glucose' },
    { category: 'drink', item: 'Electrolyte drink', amount: '200ml', reason: 'Replace sweat losses' }
  ],
  postGame: [
    { category: 'drink', item: 'Chocolate milk or protein shake', amount: '400ml', reason: 'Optimal 3:1 carb:protein ratio' },
    { category: 'food', item: 'Banana + handful of nuts', reason: 'Replenish glycogen + healthy fats' }
  ],
  betweenGames: [
    { category: 'food', item: 'PB&J sandwich (half)', reason: 'Balanced macros, familiar food' },
    { category: 'food', item: 'Trail mix', amount: 'small handful', reason: 'Sustained energy release' },
    { category: 'drink', item: 'Water + electrolytes', amount: '400ml', reason: 'Continue hydration' }
  ]
};
```

---

## 9. Game Tracker

### Purpose
**Game Tracker** (`/game-tracker`) enables real-time game statistics tracking and post-game analysis for flag football games.

### Who Uses It
- **Coaches**: Live stat tracking during games
- **Players**: Post-game review
- **Spectators**: Watch statistics in real-time

### Functionality

1. **Live Tracking Mode**
   - Real-time score tracking (home vs away)
   - Play-by-play logging with timestamps
   - Stat attribution to specific players
   - Timeout and flag penalty tracking
   - Quarter/half management

2. **Statistics Categories**
   - **Passing**: Completions, attempts, yards, touchdowns, interceptions
   - **Rushing**: Carries, yards, touchdowns, fumbles
   - **Receiving**: Catches, yards, touchdowns
   - **Defense**: Flag pulls, interceptions, sacks, pass breakups
   - **Special Teams**: Returns, punt/kick stats

3. **Post-Game Analysis**
   - Game summary with final score
   - Player stat leaders
   - Team comparison metrics
   - Play efficiency analysis
   - Highlight plays review

4. **Historical Games**
   - Season record tracking
   - Complete game history
   - Cumulative player statistics
   - Opponent analysis

### Business Logic

#### Stat Calculation
```typescript
// Quarterback Rating (simplified for flag football)
QBR = ((Completions/Attempts × 100) + (Yards/Attempts × 10) + (TDs × 20) - (INTs × 25)) / 4

// Defensive Efficiency
DefenseScore = (FlagPulls × 2) + (Interceptions × 6) + (Sacks × 3)
```

---

## 10. Tournaments

### Purpose
**Tournaments** (`/tournaments`) manages tournament schedules, team availability, player confirmations, and budget tracking for competition events.

### Who Uses It
- **Coaches**: Create tournaments, track availability, manage logistics
- **Players**: Confirm attendance, view schedules
- **Team Managers**: Handle budgets and payments

### Functionality

1. **Tournament Overview**
   - Upcoming tournaments list
   - Next tournament quick-access
   - Tournament status badges (upcoming/in-progress/completed)

2. **Tournament Creation** (Coaches)
   - Name, location, dates
   - Entry fee and budget
   - Visibility scope (team only/public)
   - Number of games expected

3. **Player Availability Tracking**
   - Confirmation status per player:
     - Confirmed ✓
     - Declined ✗
     - Tentative ?
     - Pending (no response)
   - Decline reason tracking
   - Payment status tracking

4. **Budget Management**
   - Total estimated cost
   - Team contribution amount
   - Sponsor contributions
   - Per-player cost calculation
   - Payment tracking per player

5. **Tournament Details**
   - Game schedule within tournament
   - Venue information
   - Accommodation details
   - Travel arrangements

### Business Logic

#### Per-Player Cost Calculation
```typescript
function calculatePerPlayerCost(tournament: Tournament): number {
  const totalCost = tournament.entryFee + tournament.travelCost + 
                    tournament.accommodationCost + tournament.miscCost;
  
  const teamContribution = tournament.sponsorAmount + tournament.teamFund;
  const remainingCost = totalCost - teamContribution;
  
  const confirmedPlayers = tournament.availability.filter(p => p.status === 'confirmed').length;
  
  return confirmedPlayers > 0 ? Math.ceil(remainingCost / confirmedPlayers) : 0;
}
```

---

## 11. Roster Management

### Purpose
**Roster** (`/roster`) enables team management with player profiles, injury tracking, and performance overview.

### Who Uses It
- **Coaches**: Manage team, track injuries, view player status
- **Players**: View teammates, contact information

### Functionality

1. **Team Overview**
   - Total players, active count
   - Position breakdown
   - Injury status summary

2. **Player Cards**
   - Photo/avatar
   - Name, position, jersey number
   - Status badge (Active/Injured/Inactive)
   - Quick stats (ACWR, readiness)

3. **Filters & Search**
   - By position
   - By status
   - By name search

4. **Player Detail Modal**
   - Full profile information
   - Performance history
   - Injury history
   - Notes from coach

5. **Injury Management**
   - Log new injury
   - Recovery timeline
   - Return-to-play protocol

---

## 12. Depth Chart

### Purpose
**Depth Chart** (`/depth-chart`) allows coaches to manage player positions and create visual team formations for offense, defense, and special teams.

### Who Uses It
- **Coaches**: Set lineup, manage positions, plan formations
- **Players**: View their position assignments

### Functionality

1. **Chart Types**
   - Offense depth chart
   - Defense depth chart
   - Special teams depth chart

2. **Position Management**
   - Drag-and-drop player ordering
   - 1st string, 2nd string, 3rd string assignments
   - Position abbreviations (QB, WR, CB, etc.)

3. **Position Groups**
   - Group by position (all quarterbacks, all receivers, etc.)
   - Visual card display per player
   - Player depth ranking (1, 2, 3...)

4. **Initialization**
   - Auto-create charts from roster
   - Template-based setup
   - Import from previous season

### Business Logic

#### Position Templates
```typescript
const FLAG_FOOTBALL_POSITIONS = {
  offense: ['QB', 'C', 'WR1', 'WR2', 'WR3', 'RB'],
  defense: ['DL', 'LB', 'CB1', 'CB2', 'S'],
  specialTeams: ['Rusher', 'Blocker', 'Returner']
};
```

---

## 13. Attendance Tracking

### Purpose
**Attendance** (`/attendance`) tracks team event attendance for practices, games, meetings, and conditioning sessions.

### Who Uses It
- **Coaches**: Take attendance, create events, view reports
- **Players**: Mark their attendance, view history

### Functionality

1. **Event Types**
   - Practice
   - Game
   - Team meeting
   - Film session
   - Conditioning
   - Other

2. **Stats Overview**
   - Upcoming events count
   - Team attendance rate percentage
   - Players tracked count

3. **Event Management** (Coaches)
   - Create new events with date/time
   - Set event type and location
   - Add event notes
   - Mark mandatory/optional

4. **Attendance Status Options**
   - Present ✓
   - Absent ✗
   - Late (with time)
   - Excused (with reason)

5. **Player Statistics**
   - Individual attendance rate
   - Attendance history
   - Excuse tracking

### Business Logic

#### Attendance Rate Calculation
```typescript
function calculateAttendanceRate(records: AttendanceRecord[]): number {
  const totalEvents = records.length;
  const presentOrExcused = records.filter(r => 
    r.status === 'present' || r.status === 'excused'
  ).length;
  
  return totalEvents > 0 ? Math.round((presentOrExcused / totalEvents) * 100) : 0;
}
```

---

## 14. Equipment Management

### Purpose
**Equipment** (`/equipment`) tracks team gear inventory, assignments to players, and replacement needs.

### Who Uses It
- **Coaches/Managers**: Manage inventory, assign equipment
- **Players**: View their assigned gear

### Functionality

1. **Inventory Summary**
   - Total items count
   - Available quantity
   - Assigned quantity
   - Items needing replacement

2. **Equipment Types**
   - Jerseys (home/away)
   - Shorts
   - Flag belts
   - Flags
   - Cleats
   - Balls
   - Cones
   - Other gear

3. **Condition Tracking**
   - New
   - Good
   - Fair
   - Poor
   - Needs replacement

4. **Assignment Management**
   - Assign items to specific players
   - Track jersey numbers
   - Size tracking
   - Return tracking

5. **Alerts**
   - Low inventory warnings
   - Replacement reminders
   - Overdue returns

### Business Logic

#### Replacement Alert Logic
```typescript
function needsReplacement(item: EquipmentItem): boolean {
  return item.condition === 'poor' || 
         item.condition === 'needs_replacement' ||
         (item.purchaseDate && daysSince(item.purchaseDate) > 730); // 2 years
}
```

---

## 15. Officials Management

### Purpose
**Officials** (`/officials`) manages referee scheduling, contact directory, and game assignments.

### Who Uses It
- **Coaches/League Admins**: Schedule referees, manage assignments
- **Officials**: View their assignments

### Functionality

1. **Officials Directory**
   - Name and contact info
   - Certification level
   - Experience (years)
   - Availability status

2. **Certification Levels**
   - Junior (16-17)
   - High School
   - College
   - Professional

3. **Game Assignments**
   - Assign officials to games
   - Role assignment:
     - Head Referee
     - Line Judge
     - Field Judge
     - Back Judge
     - Scorekeeper
     - Timekeeper

4. **Assignment Status**
   - Scheduled
   - Confirmed
   - Declined
   - No-show

5. **Payment Tracking** (Optional)
   - Rate per game
   - Payment status
   - Total owed

---

## 16. Analytics

### Purpose
**Analytics** (`/analytics`) provides comprehensive performance tracking with visualizations, trend analysis, and insights for continuous improvement.

### Who Uses It
- **Players**: Track personal progress, identify areas for improvement
- **Coaches**: Monitor team performance, compare players

### Functionality

1. **Performance Dashboard**
   - Overall performance score
   - Trend indicator (up/down/stable)
   - Period selector (7d/30d/90d/All)

2. **Key Metrics Cards**
   - Training consistency %
   - Average session RPE
   - Total training hours
   - ACWR average

3. **Charts & Visualizations**
   - Training load over time (line chart)
   - Session type distribution (pie chart)
   - Weekly volume comparison (bar chart)
   - Performance vs Load scatter plot

4. **Comparison Features**
   - Personal best tracking
   - Week-over-week comparison
   - Periodic averages

5. **Export & Sharing**
   - PDF report generation
   - Share with coach functionality

### Business Logic

#### Performance Score Calculation
```typescript
function calculatePerformanceScore(data: AnalyticsData): number {
  const weights = {
    consistency: 0.25,      // Training adherence
    loadProgression: 0.20,  // Progressive overload
    recoveryQuality: 0.20,  // Wellness scores
    acwrOptimality: 0.20,   // Time in sweet spot
    skillProgress: 0.15     // Position-specific metrics
  };

  const consistency = data.completedSessions / data.plannedSessions * 100;
  const loadProgression = calculateLoadProgression(data.weeklyLoads);
  const recoveryQuality = averageWellnessScore(data.wellnessEntries);
  const acwrOptimality = percentTimeInSweetSpot(data.acwrHistory);
  const skillProgress = calculateSkillProgress(data.assessments);

  return Math.round(
    consistency * weights.consistency +
    loadProgression * weights.loadProgression +
    recoveryQuality * weights.recoveryQuality +
    acwrOptimality * weights.acwrOptimality +
    skillProgress * weights.skillProgress
  );
}
```

---

## 17. AI Coach (Merlin)

### Purpose
**AI Coach** (`/chat`) provides 24/7 AI-powered coaching assistance via conversational interface.

### Who Uses It
- **Players**: Get training advice, ask questions, mental preparation
- **Coaches**: Strategy assistance, research support

### Functionality

1. **Chat Interface**
   - Message history
   - Real-time responses
   - Context awareness (knows user's data)

2. **Capabilities**
   - Answer training questions
   - Provide exercise recommendations
   - Mental preparation techniques
   - Nutrition guidance
   - Recovery advice
   - Rule clarifications

3. **Context Integration**
   - Knows current ACWR
   - Knows recent wellness
   - Knows upcoming schedule
   - Personalizes responses

---

## 18. Global Search

### Purpose
**Global Search** provides unified search functionality across all application content with real-time results, recent searches, and intelligent suggestions.

### Who Uses It
- **All Users**: Quick navigation, find content, locate players/exercises

### Functionality

1. **Search Panel**
   - Slide-out search overlay (Cmd/Ctrl + K)
   - Real-time results as you type
   - Keyboard navigation (↑↓ to navigate, Enter to select)

2. **Search Categories**
   - **Exercises**: Find exercises by name, muscle group, equipment
   - **Programs**: Training programs and templates
   - **Players**: Team members by name
   - **Videos**: Training video content
   - **Articles**: Help content and guides

3. **Search Features**
   - **Debounced Input**: 300ms delay to prevent excessive API calls
   - **Instant Suggestions**: 150ms for quick autocomplete
   - **Result Highlighting**: Matched text shown with `<mark>` tags
   - **Recent Searches**: Last 10 searches saved locally

4. **Quick Links**
   - Today's Practice
   - Wellness Check-in
   - Training Schedule
   - Analytics

### Business Logic

#### Search Caching
```typescript
// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000;  // 5 minute TTL
const MAX_CACHE_SIZE = 50;           // Max cached queries

// Search with caching
function search(query: string) {
  const cacheKey = query.toLowerCase().trim();
  const cached = searchCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.results;  // Return cached results
  }
  
  // Otherwise fetch from API...
}
```

#### Relevance Scoring
```typescript
function calculateRelevance(result: SearchResult, query: string): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  const titleLower = result.title.toLowerCase();
  
  // Exact match in title: highest score
  if (titleLower === queryLower) score += 100;
  // Title starts with query
  else if (titleLower.startsWith(queryLower)) score += 75;
  // Title contains query
  else if (titleLower.includes(queryLower)) score += 50;
  // Description contains query
  else if (result.description?.toLowerCase().includes(queryLower)) score += 25;
  
  return score;
}
```

---

## 19. Notification Center

### Purpose
**Notification Center** provides a centralized panel for all user notifications with real-time updates, grouping by date, and action handling.

### Who Uses It
- **All Users**: Stay informed of important events, alerts, and updates

### Functionality

1. **Notification Panel**
   - Slide-out panel from header bell icon
   - Unread count badge
   - Mark all as read button
   - Dismiss individual notifications

2. **Notification Types**
   - **Training**: Session reminders, completions
   - **Achievement**: Badge unlocks, milestones
   - **Team**: Team announcements, roster changes
   - **Wellness**: Check-in reminders, recovery alerts
   - **Game**: Game day reminders, score updates
   - **Tournament**: Registration, schedule updates
   - **Injury Risk**: ACWR alerts, wellness concerns
   - **Weather**: Training weather advisories

3. **Grouping**
   - Today
   - Yesterday
   - This Week
   - Older

4. **Actions**
   - Click to navigate to related content
   - Automatic mark as read on click
   - Dismiss without reading

### Business Logic

#### Notification Priority
```typescript
type NotificationPriority = 'low' | 'medium' | 'high';

// High priority triggers push notification
// Medium priority shows badge increase
// Low priority only visible when panel opened
```

#### Real-time Updates
```typescript
// Notifications sync on:
// 1. Panel open
// 2. Every 5 minutes in background
// 3. Real-time via Supabase subscription
```

---

## 20. Achievements System

### Purpose
**Achievements** gamifies the training experience by awarding badges and points for completing training milestones, wellness streaks, and performance goals.

### Who Uses It
- **Players**: Earn achievements, track progress, compete with teammates
- **Coaches**: View team achievement leaderboard

### Functionality

1. **Achievement Categories**
   - **Wellness**: Streak achievements (7-day, 30-day check-ins)
   - **Training**: Volume and consistency achievements
   - **Performance**: Personal records, improvement milestones
   - **Social**: Team participation, helping others
   - **Special**: Event-specific, seasonal achievements

2. **Achievement Display**
   - Unlocked vs Locked visual differentiation
   - Points value per achievement
   - Unlock date and time
   - Progress toward locked achievements

3. **Stats Overview**
   - Total points earned
   - Achievements unlocked / total
   - Progress percentage
   - Recent unlocks

4. **Leaderboard** (Optional)
   - Team rankings by points
   - Weekly/monthly top achievers

### Business Logic

#### Achievement Unlock Triggers
```typescript
// Automatic unlock checks:
const ACHIEVEMENT_TRIGGERS = {
  'wellness-streak-7': () => consecutiveWellnessCheckIns >= 7,
  'wellness-streak-30': () => consecutiveWellnessCheckIns >= 30,
  'training-volume-100': () => totalTrainingSessions >= 100,
  'first-game-win': () => gamesWon >= 1,
  'acwr-sweet-spot-7': () => consecutiveDaysInSweetSpot >= 7,
  'early-bird': () => checkInsBeforeTime('06:00') >= 10,
  'night-owl': () => checkInsAfterTime('22:00') >= 10,
};
```

#### Points System
```typescript
const ACHIEVEMENT_POINTS = {
  wellness: { small: 10, medium: 25, large: 50 },
  training: { small: 15, medium: 35, large: 75 },
  performance: { small: 20, medium: 50, large: 100 },
  social: { small: 10, medium: 20, large: 40 },
  special: { small: 25, medium: 75, large: 150 }
};
```

---

## 21. User Profile

### Purpose
**Profile** (`/profile`) displays and manages user account information, personal stats, team memberships, and pending invitations.

### Who Uses It
- **All Users**: View/edit personal information, manage account

### Functionality

1. **Profile Header**
   - Avatar image (uploadable)
   - Name and email
   - Role badge (Player/Coach/Admin)
   - Team membership

2. **Tabs**
   - **Overview**: Quick stats, recent activity
   - **Teams**: Team memberships, pending invitations
   - **Stats**: Personal performance metrics
   - **Settings**: Quick links to settings

3. **Pending Invitations**
   - Team name and inviting coach
   - Role offered
   - Accept/Decline buttons
   - Expiration countdown

4. **Account Actions**
   - Edit profile
   - Upload avatar
   - View deletion status (if pending)
   - Cancel deletion

### Business Logic

#### Avatar Upload
```typescript
// Max file size: 2MB
// Supported formats: JPEG, PNG, WebP
// Auto-resize to 256x256
// Stored in Supabase Storage
```

---

## 22. Settings

### Purpose
**Settings** (`/settings`) provides comprehensive account configuration including profile, notifications, privacy, appearance, and security.

### Who Uses It
- **All Users**: Customize experience, manage security

### Functionality

1. **Profile Settings**
   - Name, email (read-only)
   - Phone number
   - Date of birth
   - Position preferences

2. **Notification Preferences**
   - Training reminders (on/off)
   - Wellness check-in reminders
   - Team announcements
   - Game reminders
   - Achievement notifications
   - Push notification toggle

3. **Privacy Settings**
   - Profile visibility (Public/Private/Coaches Only)
   - Stats visibility
   - Activity visibility
   - Data export request

4. **Appearance**
   - Theme: Light / Dark / Auto (System)
   - Language selection (10 languages supported)

5. **Security**
   - Change password
   - Two-factor authentication (2FA)
   - Active sessions management
   - Account deletion

### Business Logic

#### Two-Factor Authentication
```typescript
// 2FA Setup Flow:
// 1. Generate TOTP secret
// 2. Display QR code for authenticator app
// 3. Verify 6-digit code
// 4. Generate and display backup codes
// 5. Enable 2FA on account

// Login with 2FA:
// 1. Email/password login
// 2. 2FA code prompt
// 3. Verify TOTP or backup code
// 4. Grant access
```

#### Session Management
```typescript
interface Session {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

// Actions: View all sessions, Revoke individual, Revoke all others
```

---

## 23. Onboarding

### Purpose
**Onboarding** (`/onboarding`) guides new users through profile setup, training preferences, and initial configuration with a multi-step wizard.

### Who Uses It
- **New Users**: Complete initial setup after registration

### Functionality

1. **Progress Tracking**
   - Visual progress bar
   - Step indicators
   - Auto-save drafts
   - Resume from where left off

2. **Step 1: Personal Information**
   - Full name
   - Date of birth (with age calculation)
   - Profile photo upload

3. **Step 2: Athletic Profile**
   - Primary position
   - Secondary position(s)
   - Experience level (years playing)
   - Current team (if any)

4. **Step 3: Physical Profile**
   - Height and weight
   - Dominant hand/foot
   - Current fitness level

5. **Step 4: Training Preferences**
   - Available training days
   - Preferred training times
   - Training goals
   - Equipment access

6. **Step 5: Medical/Injury History** (Optional)
   - Previous injuries
   - Current limitations
   - Medical conditions

7. **Step 6: Consent & Completion**
   - Terms acceptance
   - Privacy policy
   - Data usage consent
   - AI coaching consent

### Business Logic

#### Age Category Assignment
```typescript
function getAgeCategory(birthDate: Date): AgeCategory {
  const age = calculateAge(birthDate);
  
  // App is designed for athletes 16+
  if (age < 18) return 'junior';        // 16-17 years
  if (age < 25) return 'adult-open';    // 18-24 years
  if (age < 35) return 'adult-masters'; // 25-34 years
  return 'adult-seniors';               // 35+ years
}

// Age category affects:
// - Training load recommendations
// - Recovery time calculations
// - Competition eligibility
```

---

## 24. Body Composition & Weight Tracking

### Purpose
**Body Composition** tracks daily weight, body fat percentage, muscle mass, and other metrics from smart scales - essential for injury prevention and load normalization calculations.

### Who Uses It
- **Players**: Log daily weight, track body composition trends
- **Coaches**: Monitor athlete weight changes for injury risk assessment

### Functionality

1. **Body Composition Card** (Dashboard Widget)
   - Current weight with trend indicator (↑↓→)
   - Body fat percentage with visual bar
   - Muscle mass (kg)
   - Body water percentage
   - Basal Metabolic Rate (BMR)
   - Last measurement date

2. **Smart Scale Integration**
   - Automatic sync with compatible smart scales
   - Manual entry fallback
   - Historical data import

3. **Metrics Tracked**
   - Weight (kg)
   - Body Fat (%)
   - Muscle Mass (kg)
   - Body Water (%)
   - Visceral Fat Rating
   - BMI (calculated)
   - Basal Metabolic Rate (BMR)

4. **Trend Analysis**
   - Weight trend (gaining/stable/losing)
   - Fat percentage trend
   - Weekly and monthly comparisons

5. **Alerts & Warnings**
   - Rapid weight loss alert (>2kg/week = injury risk)
   - Dehydration risk (>1.5kg loss in 24 hours)
   - Rapid weight gain alert

### Business Logic

#### Weight Change Analysis
```typescript
const WEIGHT_CHANGE_THRESHOLDS = {
  rapidLossWeekly: -2,      // kg per week → DANGER
  rapidLossPercent: -3,     // % per week → WARNING
  rapidGainWeekly: 2,       // kg per week → WARNING
  dehydrationRisk: -1.5,    // kg in 24 hours → WARNING
  competitionBuffer: 2      // kg above competition weight
};

function analyzeWeightChanges(history: WeightEntry[]): WeightChangeAnalysis {
  const weeklyChange = currentWeight - weekAgoWeight;
  const weeklyChangePercent = (weeklyChange / weekAgoWeight) * 100;
  
  if (weeklyChange < -2) {
    alerts.push({
      severity: 'danger',
      type: 'rapid_loss',
      message: 'Rapid weight loss detected - injury risk elevated',
      recommendation: 'Check for dehydration, illness, or undereating'
    });
  }
}
```

#### Load Normalization by Body Weight
```typescript
// Heavier athletes experience more absolute stress
const REFERENCE_WEIGHT = 80; // kg baseline

function normalizeLoad(rawLoad: number, athleteWeight: number): number {
  const weightFactor = athleteWeight / REFERENCE_WEIGHT;
  return rawLoad * weightFactor;
}

// Example: 95kg athlete with 500 AU raw load
// Normalized: 500 × (95/80) = 594 AU
```

#### Joint Stress Calculation
```typescript
// Joint stress multipliers by activity (times bodyweight)
const JOINT_STRESS_MULTIPLIERS = {
  walking: 1.5,
  jogging: 3.0,
  running: 4.0,
  sprinting: 5.5,
  cutting: 6.0,
  jumping_landing: 7.0,
  single_leg_landing: 9.0
};

function estimateJointStress(activity: string, bodyWeight: number): number {
  const multiplier = JOINT_STRESS_MULTIPLIERS[activity];
  return bodyWeight * 9.81 * multiplier; // Force in Newtons
}
```

#### Position-Specific BMI Recommendations
```typescript
const POSITION_WEIGHT_PROFILES = {
  QB:      { minBMI: 22, maxBMI: 27, notes: 'Moderate build for mobility + arm strength' },
  WR:      { minBMI: 20, maxBMI: 25, notes: 'Lean for speed and agility' },
  DB:      { minBMI: 20, maxBMI: 25, notes: 'Lean for coverage speed' },
  Rusher:  { minBMI: 21, maxBMI: 26, notes: 'Balance of power and speed' },
  Center:  { minBMI: 22, maxBMI: 27, notes: 'Can carry slightly more mass' }
};
```

---

## 25. Supplement Tracker

### Purpose
**Supplement Tracker** logs daily supplement intake for athletes to track compliance and correlate with fatigue/recovery data.

### Who Uses It
- **Players**: Track daily supplement intake by timing (morning, pre/post-workout, evening)
- **Coaches**: Review supplement compliance for fatigue management

### Functionality

1. **Supplement Dashboard**
   - Progress bar (X/Y supplements taken today)
   - Grouped by timing window
   - Check-off interface

2. **Default Athletic Supplements**
   - **Performance**: Creatine (5g), Beta Alanine (3.2g), Caffeine (200mg)
   - **Vitamins**: Vitamin D (2000 IU), Vitamin C (500mg), Multivitamin
   - **Minerals**: Magnesium (400mg), Iron (18mg), Calcium (1000mg), Zinc (15mg)
   - **Amino Acids**: BCAAs (5g), L-Glutamine (5g)
   - **Recovery**: Omega-3 Fish Oil (1000mg), Protein Powder (25g), Electrolytes

3. **Timing Categories**
   - Morning (Vitamin D, Iron, Multivitamin)
   - Pre-Workout (Caffeine, Beta Alanine, BCAAs)
   - Post-Workout (Protein, Glutamine)
   - Evening (Magnesium, Zinc)
   - Anytime (Creatine)

4. **Custom Supplements**
   - Add custom supplements with name, dosage, timing, category
   - Remove supplements not taken

5. **Compliance Tracking**
   - Daily completion rate
   - Historical compliance data
   - Correlation with wellness scores

### Business Logic

#### Supplement Categories
```typescript
interface Supplement {
  id: string;
  name: string;
  dosage: string;
  timing: 'morning' | 'pre-workout' | 'post-workout' | 'evening' | 'anytime';
  category: 'vitamin' | 'mineral' | 'amino' | 'performance' | 'recovery' | 'other';
  taken: boolean;
  takenAt?: Date;
}

// Default supplements pre-configured for athletes
const DEFAULT_SUPPLEMENTS: Supplement[] = [
  { id: 'magnesium', name: 'Magnesium', dosage: '400mg', timing: 'evening', category: 'mineral' },
  { id: 'iron', name: 'Iron', dosage: '18mg', timing: 'morning', category: 'mineral' },
  { id: 'creatine', name: 'Creatine', dosage: '5g', timing: 'anytime', category: 'performance' },
  // ... more supplements
];
```

#### Fatigue Correlation (Magnesium/Iron)
```typescript
// Low magnesium → muscle cramps, fatigue
// Low iron → reduced oxygen transport, fatigue

function assessSupplementImpact(wellness: WellnessData, supplements: SupplementLog[]): string[] {
  const recommendations: string[] = [];
  
  // Check magnesium compliance if muscle soreness is high
  if (wellness.soreness >= 7) {
    const magnesiumTaken = supplements.find(s => s.id === 'magnesium')?.taken;
    if (!magnesiumTaken) {
      recommendations.push('Consider magnesium supplementation for muscle recovery');
    }
  }
  
  // Check iron compliance if energy is consistently low
  if (wellness.energy <= 4) {
    const ironTaken = supplements.find(s => s.id === 'iron')?.taken;
    if (!ironTaken) {
      recommendations.push('Iron supplementation may help with low energy levels');
    }
  }
  
  return recommendations;
}
```

---

## 26. Sprint & Performance Benchmarks

### Purpose
**Performance Benchmarks** track key athletic metrics like 40-yard dash, vertical jump, and agility tests to guide training intensity and prevent injury.

### Who Uses It
- **Players**: Log performance test results, track progress
- **Coaches**: Assess athlete readiness, compare to position standards

### Functionality

1. **Sprint Metrics**
   - 10m sprint time (acceleration)
   - 20m sprint time
   - 40-yard (36.6m) dash time
   - Flying sprint speed (m/s)

2. **Agility Metrics**
   - Pro Agility (5-10-5) time
   - L-Drill time
   - Reactive agility test

3. **Power Metrics**
   - Vertical jump (cm)
   - Broad jump (cm)
   - Reactive Strength Index (RSI)

4. **Strength Metrics**
   - Back squat 1RM
   - Trap bar deadlift 1RM
   - Bench press 1RM
   - Relative strength (1RM / bodyweight)

5. **Position Benchmarks Comparison**
   - Visual comparison to position standards
   - Gap analysis (strengths/weaknesses)
   - Training priority recommendations

### Business Logic

#### Position-Specific Sprint Benchmarks
```typescript
const POSITION_BENCHMARKS = {
  QB: {
    sprint40: { elite: 4.6, good: 4.8, average: 5.0 },
    proAgility: { elite: 4.0, good: 4.2, average: 4.4 },
    verticalJump: { elite: 86, good: 76, average: 66 } // cm
  },
  WR: {
    sprint40: { elite: 4.4, good: 4.6, average: 4.8 },
    proAgility: { elite: 3.9, good: 4.1, average: 4.3 },
    verticalJump: { elite: 91, good: 81, average: 71 }
  },
  DB: {
    sprint40: { elite: 4.4, good: 4.6, average: 4.8 },
    proAgility: { elite: 3.9, good: 4.1, average: 4.3 },
    verticalJump: { elite: 89, good: 79, average: 69 }
  },
  Rusher: {
    sprint40: { elite: 4.5, good: 4.7, average: 4.9 },
    proAgility: { elite: 4.0, good: 4.2, average: 4.4 },
    verticalJump: { elite: 84, good: 74, average: 64 }
  }
};
```

#### Relative Strength Standards
```typescript
// Flag football requires relative strength (strength/bodyweight)
// NOT absolute bulk
const RELATIVE_STRENGTH_STANDARDS = {
  squat: {
    beginner: 1.0,      // 1x bodyweight
    intermediate: 1.5,  // 1.5x bodyweight
    advanced: 2.0,      // 2x bodyweight
    elite: 2.5          // 2.5x bodyweight
  },
  deadlift: {
    beginner: 1.25,
    intermediate: 1.75,
    advanced: 2.25,
    elite: 2.75
  }
};

function getStrengthLevel(exercise: string, oneRepMax: number, bodyWeight: number): string {
  const relative = oneRepMax / bodyWeight;
  const standards = RELATIVE_STRENGTH_STANDARDS[exercise];
  
  if (relative >= standards.elite) return 'elite';
  if (relative >= standards.advanced) return 'advanced';
  if (relative >= standards.intermediate) return 'intermediate';
  return 'beginner';
}
```

#### Training Intensity Recommendations Based on 40-Yard
```typescript
// 40-yard dash informs sprint training zones
function getSprintTrainingZones(fortyTime: number) {
  const maxSpeed = 36.6 / fortyTime; // m/s
  
  return {
    zone1_recovery: { speed: maxSpeed * 0.50, description: 'Recovery jogs' },
    zone2_aerobic: { speed: maxSpeed * 0.65, description: 'Aerobic base' },
    zone3_tempo: { speed: maxSpeed * 0.80, description: 'Tempo runs' },
    zone4_threshold: { speed: maxSpeed * 0.90, description: 'High intensity' },
    zone5_max: { speed: maxSpeed * 1.00, description: 'Maximum sprints' }
  };
}
```

---

## 27. QB Hub (Quarterback Training)

### Purpose
**QB Hub** (`/qb`) provides quarterback-specific training tools including throw tracking, arm care protocols, and QB-specific periodization - critical because flag football QBs throw **8x more** than NFL QBs in tournament play.

### Who Uses It
- **Quarterbacks**: Track throwing volume, arm care compliance
- **Coaches**: Monitor QB arm health, adjust training load

### Functionality

#### 1. Throwing Tracker
**Purpose**: Track throwing sessions to build toward 320-throw tournament capacity without injury.

**Session Logging**:
- Session type (Practice/Warm-up/Drill Work/Game/Tournament/320 Simulation)
- Total throws
- Throw breakdown by distance:
  - Short (0-10 yards)
  - Medium (10-20 yards)
  - Long (20+ yards)
- Arm feeling before/after (1-10 scale)
- Compliance checkboxes:
  - Pre-throwing warm-up (30 min) ✓
  - Post-throwing arm care ✓
  - Ice applied (for 100+ throws) ✓
- Notes/mechanics focus

**Progression Status Dashboard**:
- Current phase (Foundation → Building → Tournament Ready)
- Average throws per session
- Target throws for current phase
- Weekly compliance percentage
- Days since last session
- Personalized recommendation

**Weekly Stats Chart**:
- Bar chart of weekly throw totals
- Sessions count per week
- Average arm feeling
- Warm-up compliance %
- Arm care compliance %
- Ice sessions count

#### 2. QB Assessments
- Throwing accuracy tests
- Footwork assessments
- Decision-making drills

#### 3. QB-Specific Schedule
- Periodized throwing program
- Arm care days
- Rest protocols

### Business Logic

#### Tournament Throw Capacity Building
```typescript
// Flag Football QBs throw 320+ throws in a tournament day
// vs NFL QBs: ~40 throws/game
// That's 8x more volume

interface QBProgressionPhase {
  name: string;
  targetThrowsPerSession: number;
  durationWeeks: number;
  armCareRequired: boolean;
}

const QB_PROGRESSION_PHASES: QBProgressionPhase[] = [
  { name: 'Foundation', targetThrowsPerSession: 100, durationWeeks: 4, armCareRequired: true },
  { name: 'Building', targetThrowsPerSession: 150, durationWeeks: 4, armCareRequired: true },
  { name: 'Peak Load', targetThrowsPerSession: 200, durationWeeks: 3, armCareRequired: true },
  { name: 'Tournament Ready', targetThrowsPerSession: 250, durationWeeks: 2, armCareRequired: true },
  { name: 'Tournament Simulation', targetThrowsPerSession: 320, durationWeeks: 1, armCareRequired: true }
];
```

#### Arm Care Protocol
```typescript
interface ArmCareProtocol {
  preThrowingWarmup: {
    duration: '30 min',
    activities: ['Band work', 'Shoulder mobility', 'Core activation', 'Light throws']
  };
  postThrowingCare: {
    duration: '15-20 min',
    activities: ['Stretching', 'Band deceleration work', 'Massage', 'Ice (if 100+ throws)']
  };
  iceRecommendation: {
    threshold: 100, // throws
    duration: '15-20 min'
  };
}

// Arm feeling interpretation
function interpretArmFeeling(score: number): string {
  if (score <= 3) return '🟢 Fresh - good to throw';
  if (score <= 6) return '🟡 Moderate fatigue - monitor';
  return '🔴 Significant fatigue - rest recommended';
}
```

#### Weekly Throw Volume Limits
```typescript
const QB_WEEKLY_LIMITS = {
  inSeason: {
    maxThrows: 600,
    maxSessions: 5,
    minRestDays: 2
  },
  offSeason: {
    maxThrows: 400,
    maxSessions: 4,
    minRestDays: 2
  },
  tournamentWeek: {
    preTournament: 150, // 2 days before
    tournamentDay: 320  // Expected max
  }
};
```

---

## 28. Position-Specific Statistics Tracking

### Purpose
**Position-Specific Statistics** tracks performance metrics tailored to each flag football position during games and practices, enabling detailed analysis and player development.

### Who Uses It
- **Coaches**: Track team and individual performance, identify strengths/weaknesses
- **Players**: Review personal statistics, track improvement
- **Team Staff**: Monitor player game contributions

### Statistics by Position

#### QB (Quarterback) Statistics
| Statistic | Description | Abbreviation |
|-----------|-------------|--------------|
| Pass Attempts | Total passes thrown | PA |
| Completions | Successfully caught passes | COMP |
| Incompletions | Passes not caught | INC |
| Completion % | Completions ÷ Attempts × 100 | COMP% |
| Passing TDs | Touchdown passes | PASS TD |
| PA1 Conversions | 1-point conversions (pass) | PA1 |
| PA2 Conversions | 2-point conversions (pass) | PA2 |
| Rushing TDs | Touchdowns on QB runs | RUSH TD |
| Times Sacked | Flag pulled behind line | SCKD |
| Interceptions Thrown | Passes intercepted | INT |
| First Downs | Passes resulting in first down | 1st |

```typescript
interface QBStatistics {
  passAttempts: number;
  completions: number;
  incompletions: number;  // Calculated: attempts - completions
  completionPercentage: number;  // Calculated: (completions / attempts) * 100
  passingTouchdowns: number;
  pa1Conversions: number;  // 1-point after TD
  pa2Conversions: number;  // 2-point after TD
  rushingTouchdowns: number;
  timesSacked: number;
  interceptionsThrown: number;
  firstDowns: number;
}
```

#### DB (Defensive Back) Statistics
| Statistic | Description | Abbreviation |
|-----------|-------------|--------------|
| Tackles | Successful flag pulls | TCKL |
| Pass Deflections | Passes knocked away | PD |
| Missed Flag Pulls | Failed tackle attempts | MFP |
| Interceptions | Passes caught by defense | INT |
| Sacks | QB flag pulls behind line | SCK |
| TDs Allowed | Touchdowns given up in coverage | TD ALLOW |

```typescript
interface DBStatistics {
  tackles: number;  // Successful flag pulls
  passDeflections: number;  // Passes knocked down
  missedFlagPulls: number;  // Failed tackle attempts
  interceptions: number;  // Turnovers created
  sacks: number;  // QB flag pulls behind line
  touchdownsAllowed: number;  // TDs given up when covering
}
```

#### WR (Wide Receiver) Statistics
| Statistic | Description | Abbreviation |
|-----------|-------------|--------------|
| Catches | Receptions completed | REC |
| Targets | Passes thrown their way | TGT |
| Drops | Catchable passes dropped | DROP |
| Receiving TDs | Touchdowns caught | REC TD |
| PA1 Catches | 1-point conversion catches | PA1 |
| PA2 Catches | 2-point conversion catches | PA2 |
| Catch Rate | Catches ÷ Targets × 100 | CATCH% |

```typescript
interface WRStatistics {
  catches: number;  // Receptions
  targets: number;  // Times thrown to
  drops: number;  // Catchable balls dropped
  receivingTouchdowns: number;
  pa1Catches: number;  // 1-point conversion receptions
  pa2Catches: number;  // 2-point conversion receptions
  catchRate: number;  // Calculated: (catches / targets) * 100
}
```

#### Blitzer/Rusher Statistics
| Statistic | Description | Abbreviation |
|-----------|-------------|--------------|
| Pass Deflections | Passes knocked down at line | PD |
| Sacks | QB flag pulls behind line | SCK |
| Tackles | Successful flag pulls | TCKL |
| Missed Flags | Failed tackle attempts | MFP |
| QB Run - Successful | Contain on scrambles (stopped) | QBR-S |
| QB Run - Unsuccessful | QB escaped contain | QBR-U |

```typescript
interface BlitzerStatistics {
  passDeflections: number;  // Batted balls at the line
  sacks: number;  // QB flag pulls for loss
  tackles: number;  // Flag pulls on rushers/receivers
  missedFlags: number;  // Failed flag pull attempts
  qbRunContainSuccessful: number;  // Stopped QB scrambles
  qbRunContainUnsuccessful: number;  // QB escaped
  containRate: number;  // Calculated: successful / (successful + unsuccessful) * 100
}
```

### Business Logic

#### Completion Percentage Calculation
```typescript
function calculateCompletionPercentage(completions: number, attempts: number): number {
  if (attempts === 0) return 0;
  return Math.round((completions / attempts) * 1000) / 10;  // One decimal place
}
```

#### Catch Rate Calculation
```typescript
function calculateCatchRate(catches: number, targets: number): number {
  if (targets === 0) return 0;
  return Math.round((catches / targets) * 1000) / 10;
}
```

#### Defensive Efficiency Rating
```typescript
function calculateDefensiveEfficiency(db: DBStatistics): number {
  // Higher is better
  const positiveActions = db.tackles + db.passDeflections + (db.interceptions * 2) + (db.sacks * 2);
  const negativeActions = db.missedFlagPulls + (db.touchdownsAllowed * 3);
  
  if (positiveActions + negativeActions === 0) return 50;  // Neutral
  return Math.round((positiveActions / (positiveActions + negativeActions)) * 100);
}
```

#### Rusher Pressure Rate
```typescript
function calculatePressureRate(blitzer: BlitzerStatistics): number {
  // Measures how often the rusher affects the play
  const totalRushes = blitzer.sacks + blitzer.passDeflections + blitzer.qbRunContainSuccessful + blitzer.qbRunContainUnsuccessful;
  const successfulPressures = blitzer.sacks + blitzer.passDeflections + blitzer.qbRunContainSuccessful;
  
  if (totalRushes === 0) return 0;
  return Math.round((successfulPressures / totalRushes) * 100);
}
```

#### Game Score Summary
```typescript
interface GameStatsSummary {
  // Team totals
  teamScore: number;
  totalFirstDowns: number;
  totalTouchdowns: number;
  turnovers: number;
  
  // Position group summaries
  qbRating: number;
  receivingYards: number;  // If tracking yards
  defensiveStops: number;
  sacks: number;
  interceptions: number;
}
```

---

## 29. Position-Specific Training System

### Purpose
The **Position-Specific Training System** provides tailored training protocols, benchmarks, and injury prevention based on flag football position (QB, WR, DB, Rusher, Center).

### Who Uses It
- **All Players**: Receive position-appropriate training recommendations
- **Coaches**: Assign position-specific drills and benchmarks

### Functionality

1. **Position Profiles**
   - Primary and secondary attributes
   - Position-specific benchmarks
   - Training priorities
   - Common injuries and prevention focus

2. **Position-Specific Drills**
   - QB: Throwing mechanics, footwork, scramble drills
   - WR: Route running, releases, catching drills
   - DB: Backpedal, hip turns, coverage drills
   - Rusher: Get-off, pass rush moves, contain drills
   - Center: Snap mechanics, blocking, protection drills

3. **Position-Specific Video Playlists**
   - Curated YouTube videos for each position
   - Professional athlete examples
   - Drill demonstrations

4. **Training Load Adjustments by Position**
   - Sprint volume recommendations
   - Jump/landing volume limits
   - Position-specific recovery protocols

### Business Logic

#### Flag Football Athlete Profile Model
```typescript
// The Flag Football Athlete - A Unique Hybrid
const FLAG_FOOTBALL_ATHLETE_PROFILE = {
  durability: 'Like soccer players (60+ games/year)',
  strength: 'Like basketball players (explosive power)',
  leanness: 'Like volleyball players (vertical leap)',
  speed: 'Like sprinters (acceleration & top speed)',
  agility: 'Elite change of direction & sudden stops',
  bodyType: 'Lean muscles, NOT bulked'
};
```

#### Position Requirements
```typescript
interface PositionRequirements {
  position: 'QB' | 'WR' | 'DB' | 'Rusher' | 'Center' | 'Hybrid';
  primaryAttributes: string[];
  secondaryAttributes: string[];
  benchmarks: PositionBenchmarks;
  trainingPriorities: string[];
  commonInjuries: string[];
  preventionFocus: string[];
}

const QB_REQUIREMENTS: PositionRequirements = {
  position: 'QB',
  primaryAttributes: ['Arm strength', 'Accuracy', 'Decision-making', 'Pocket mobility'],
  secondaryAttributes: ['Running ability', 'Vision', 'Leadership'],
  benchmarks: {
    sprint40: { elite: 4.6, good: 4.8 },
    proAgility: { elite: 4.0, good: 4.2 },
    throwingVelocity: { elite: 55, good: 50 } // mph
  },
  trainingPriorities: ['Arm care', 'Core stability', 'Hip mobility', 'Footwork'],
  commonInjuries: ['Shoulder strain', 'Elbow tendinitis', 'Hip flexor strain'],
  preventionFocus: ['Arm care protocol', 'Rotator cuff strengthening', 'Core stability']
};

const WR_REQUIREMENTS: PositionRequirements = {
  position: 'WR',
  primaryAttributes: ['Speed', 'Route running', 'Hands', 'Separation ability'],
  secondaryAttributes: ['Vertical jump', 'Body control', 'RAC ability'],
  trainingPriorities: ['Sprint mechanics', 'Agility', 'Vertical leap', 'Hand-eye coordination'],
  commonInjuries: ['Hamstring strain', 'Ankle sprain', 'Knee ligament'],
  preventionFocus: ['Hamstring strength', 'Ankle stability', 'Landing mechanics']
};

const DB_REQUIREMENTS: PositionRequirements = {
  position: 'DB',
  primaryAttributes: ['Coverage speed', 'Hip fluidity', 'Ball skills', 'Tackling (flag pull)'],
  secondaryAttributes: ['Vertical jump', 'Instincts', 'Communication'],
  trainingPriorities: ['Backpedal speed', 'Hip turns', 'Reactive agility', 'Ball tracking'],
  commonInjuries: ['Hamstring strain', 'Hip flexor strain', 'Ankle sprain'],
  preventionFocus: ['Hip mobility', 'Hamstring eccentric strength', 'Ankle stability']
};

const RUSHER_REQUIREMENTS: PositionRequirements = {
  position: 'Rusher',
  primaryAttributes: ['First-step quickness', 'Pass rush moves', 'Contain discipline'],
  secondaryAttributes: ['Power', 'Hand technique', 'Pursuit angles'],
  trainingPriorities: ['Explosive starts', 'Lateral agility', 'Power development'],
  commonInjuries: ['Shoulder strain', 'Knee ligament', 'Ankle sprain'],
  preventionFocus: ['Shoulder stability', 'Knee strengthening', 'Ankle mobility']
};
```

#### Universal Requirements (All Positions)
```typescript
const UNIVERSAL_REQUIREMENTS = {
  reactiveReadiness: {
    description: 'Ability to quickly respond to game situations',
    exercises: ['Reaction drills', 'Mirror drills', 'Ball drops'],
    frequency: '2-3x per week'
  },
  coreStability: {
    description: 'Trunk control for all movements',
    exercises: ['Planks', 'Dead bugs', 'Pallof press', 'Anti-rotation'],
    frequency: 'Daily'
  },
  hipFlexorStrength: {
    description: 'Critical for sprinting and cutting',
    exercises: ['Hip flexor marches', 'Psoas holds', 'High knees'],
    frequency: '3x per week',
    evidenceBase: 'Hip flexor weakness linked to hamstring injuries'
  },
  ankleComplex: {
    description: 'Foundation for all movement',
    exercises: ['Calf raises', 'Ankle circles', 'Balance work'],
    frequency: 'Daily pre-practice',
    components: ['Mobility', 'Stability', 'Strength']
  }
};
```

---

## 30. Nutritionist Dashboard & Reports

### Purpose
**Nutritionist Dashboard** provides sports nutritionists with comprehensive data to create personalized nutrition plans based on training load, body composition, supplement compliance, and tournament schedules.

### Who Uses It
- **Sports Nutritionists**: Create evidence-based nutrition plans
- **Dietitians**: Monitor athlete nutrition compliance
- **Players**: Share data with their nutritionist

### Functionality

#### 1. Nutritionist View (Read-Only Access)
Nutritionists can be granted read-only access to specific athlete data:

**Body Composition Data**
- Weight history (daily/weekly trends)
- Body fat percentage trends
- Muscle mass changes
- BMR (Basal Metabolic Rate)
- Body water percentage

**Training Load Data**
- Weekly training volume (AU)
- ACWR ratio (injury risk context)
- Training intensity distribution
- Tournament schedule (high-demand periods)

**Supplement Compliance**
- Current supplement stack
- Daily compliance rates
- Missed supplements (which, how often)
- Timing adherence

**Wellness Metrics**
- Sleep quality/duration patterns
- Energy level trends
- Soreness patterns (inflammation indicators)
- Hydration status

#### 2. Downloadable Reports for Nutritionist

**Weekly Nutrition Context Report**
```typescript
interface NutritionistWeeklyReport {
  reportPeriod: { start: Date; end: Date };
  athlete: {
    name: string;
    position: string;
    age: number;
    currentWeight: number;
    targetWeight?: number;
    bodyFatPercentage?: number;
  };
  
  trainingContext: {
    weeklyTrainingLoad: number;  // AU
    acwrRatio: number;
    upcomingTournament?: { name: string; daysUntil: number };
    trainingPhase: 'off-season' | 'pre-season' | 'in-season' | 'tournament';
  };
  
  bodyComposition: {
    weightTrend: 'gaining' | 'stable' | 'losing';
    weeklyWeightChange: number;  // kg
    measurementsThisWeek: number;
    alerts: string[];  // e.g., "Rapid weight loss detected"
  };
  
  supplementCompliance: {
    overallComplianceRate: number;  // percentage
    missedSupplements: { name: string; missedDays: number }[];
    timingIssues: string[];  // e.g., "Iron often taken with calcium"
  };
  
  wellnessIndicators: {
    avgSleepHours: number;
    avgEnergyLevel: number;  // 1-10
    avgSoreness: number;  // 1-10
    hydrationStatus: 'poor' | 'adequate' | 'good' | 'optimal';
  };
  
  recommendations: string[];  // AI-generated suggestions
}
```

**Tournament Nutrition Brief**
```typescript
interface TournamentNutritionBrief {
  tournament: {
    name: string;
    dates: { start: Date; end: Date };
    location: string;
    expectedGames: number;
    climate: { temperature: number; humidity: number };
  };
  
  athleteProfile: {
    weight: number;
    position: string;
    knownAllergies: string[];
    dietaryRestrictions: string[];
  };
  
  calculatedNeeds: {
    dailyCalories: number;
    dailyProtein: number;  // grams
    dailyCarbs: number;  // grams
    dailyHydration: number;  // ml
    electrolyteServings: number;
  };
  
  gameDay: {
    preGameMealTiming: string;  // e.g., "3 hours before"
    preGameMealSuggestions: string[];
    betweenGameSnacks: string[];
    hydrationSchedule: { time: string; amount: string }[];
    postGameRecovery: string[];
  };
}
```

---

## 31. Physiotherapist Dashboard & Reports

### Purpose
**Physiotherapist Dashboard** provides physical therapists with injury history, movement data, training load patterns, and recovery metrics to guide treatment and return-to-play decisions.

### Who Uses It
- **Physiotherapists**: Treatment planning and progress tracking
- **Athletic Trainers**: Injury prevention and rehabilitation
- **Team Medical Staff**: Return-to-play clearance
- **Players**: Share injury/recovery data with their physio

### Functionality

#### 1. Physiotherapist View (Read-Only Access)

**Injury History**
- Past injuries (type, date, severity, recovery time)
- Current injuries/limitations
- Injury recurrence patterns
- Position-specific injury risk factors

**Training Load & Recovery**
- ACWR history (spikes correlated with injuries)
- Training load trends
- Recovery scores over time
- Readiness scores

**Movement & Physical Data**
- Body weight trends (sudden changes = red flag)
- 40-yard dash times (speed regression = possible compensation)
- Agility test results
- Strength benchmarks (asymmetries)

**Wellness Data**
- Sleep patterns (recovery indicator)
- Soreness locations and trends
- Energy levels
- Stress indicators

**Position-Specific Risk Factors**
```typescript
const POSITION_INJURY_RISK = {
  QB: {
    commonInjuries: ['Shoulder strain', 'Elbow tendinitis', 'Hip flexor strain', 'Oblique strain'],
    riskFactors: ['High throw volume', 'Poor arm care compliance', 'Throwing through fatigue'],
    screeningFocus: ['Shoulder ROM', 'Thoracic mobility', 'Hip internal rotation']
  },
  WR: {
    commonInjuries: ['Hamstring strain', 'Ankle sprain', 'Knee ligament', 'Hip flexor'],
    riskFactors: ['Sprint volume spikes', 'Inadequate warm-up', 'Surface changes'],
    screeningFocus: ['Hamstring flexibility', 'Single-leg balance', 'Hip mobility']
  },
  DB: {
    commonInjuries: ['Hamstring strain', 'Hip flexor', 'Ankle sprain', 'Groin strain'],
    riskFactors: ['High backpedal volume', 'Sudden direction changes', 'Reactive movements'],
    screeningFocus: ['Hip mobility', 'Ankle stability', 'Core stability']
  },
  Rusher: {
    commonInjuries: ['Shoulder strain', 'Knee ligament', 'Ankle sprain'],
    riskFactors: ['Explosive starts', 'Contact frequency', 'Lateral movements'],
    screeningFocus: ['Shoulder stability', 'Knee stability', 'First-step mechanics']
  }
};
```

#### 2. Downloadable Reports for Physiotherapist

**Injury Risk Assessment Report**
```typescript
interface PhysioInjuryRiskReport {
  athlete: {
    name: string;
    position: string;
    age: number;
    yearsPlaying: number;
  };
  
  currentStatus: {
    activeInjuries: Injury[];
    restrictions: string[];
    clearanceStatus: 'full' | 'limited' | 'not_cleared';
  };
  
  injuryHistory: {
    totalInjuries: number;
    injuriesByType: { type: string; count: number; avgRecoveryDays: number }[];
    recurrentInjuries: string[];
    lastInjuryDate: Date;
    daysSinceLastInjury: number;
  };
  
  riskIndicators: {
    acwrRisk: 'low' | 'moderate' | 'high';  // Based on ACWR > 1.3
    acwrValue: number;
    trainingLoadSpike: boolean;
    sleepDeficit: boolean;  // <7 hours avg
    weightFluctuation: boolean;  // >2kg in week
    soreness: number;  // Avg 1-10
    asymmetries: { test: string; leftRight: string; concern: boolean }[];
  };
  
  recommendations: {
    screeningPriorities: string[];
    preventionFocus: string[];
    loadModifications: string[];
  };
}
```

**Return-to-Play Progress Report**
```typescript
interface ReturnToPlayReport {
  injury: {
    type: string;
    dateOccurred: Date;
    severity: 'mild' | 'moderate' | 'severe';
    expectedRecoveryWeeks: number;
  };
  
  currentPhase: {
    phase: number;  // 1-5 RTP phases
    phaseName: string;
    startDate: Date;
    daysInPhase: number;
    criteria: { requirement: string; met: boolean }[];
  };
  
  progressMetrics: {
    painLevel: number[];  // Daily pain 0-10
    functionScore: number;  // % of baseline
    strengthRecovery: number;  // % of pre-injury
    confidenceLevel: number;  // Athlete's confidence 1-10
  };
  
  trainingLog: {
    date: Date;
    activity: string;
    intensity: string;
    tolerance: 'good' | 'moderate' | 'poor';
    notes: string;
  }[];
  
  clearanceRecommendation: {
    status: 'not_ready' | 'limited_return' | 'full_clearance';
    rationale: string[];
    restrictions: string[];
    followUpDate: Date;
  };
}
```

---

## 32. Psychology/Mental Performance Reports

### Purpose
**Psychology Reports** allow athletes to download comprehensive mental wellness data to share with sports psychologists, counselors, or mental performance coaches.

### Who Uses It
- **Players**: Download reports to share with mental health professionals
- **Sports Psychologists**: Understand training context affecting mental state
- **Mental Performance Coaches**: Track confidence and motivation patterns

### Functionality

#### 1. Player-Downloaded Reports (Privacy First)
Athletes control what data is included and can download reports to share externally.

**Mental Wellness Report**
```typescript
interface MentalWellnessReport {
  reportPeriod: { start: Date; end: Date };
  generatedBy: 'athlete';  // Self-generated, athlete controls sharing
  
  athlete: {
    name: string;
    age: number;
    position: string;
    teamRole: string;
  };
  
  // WELLNESS TRENDS (from daily check-ins)
  wellnessTrends: {
    avgMoodScore: number;  // 1-10
    moodTrend: 'improving' | 'stable' | 'declining';
    avgStressLevel: number;  // 1-10
    stressTrend: 'improving' | 'stable' | 'declining';
    avgMotivation: number;  // 1-10
    avgConfidence: number;  // 1-10
    anxietyIndicators: number;  // Count of high-stress days
  };
  
  // SLEEP PATTERNS (strong correlation with mental health)
  sleepPatterns: {
    avgSleepHours: number;
    sleepQualityAvg: number;  // 1-10
    consistentBedtime: boolean;
    sleepDebtDays: number;  // Days with <7 hours
    weekendOversleep: boolean;  // Possible weekday deficit compensation
  };
  
  // TRAINING CONTEXT (external stressors)
  trainingContext: {
    avgTrainingLoad: number;
    highLoadDays: number;
    restDays: number;
    upcomingCompetitions: { name: string; daysUntil: number }[];
    recentGamePerformance: 'good' | 'average' | 'poor' | 'no_games';
  };
  
  // RECOVERY BEHAVIORS
  recoveryBehaviors: {
    avgRecoveryScore: number;
    recoveryActivitiesLogged: string[];
    socialRecoveryActivities: number;  // Count of social activities logged
    screenTimeBeforeBed: 'low' | 'moderate' | 'high';
  };
  
  // SIGNIFICANT EVENTS (athlete can add notes)
  significantEvents: {
    injuries: { date: Date; type: string; impact: string }[];
    performanceHighlights: { date: Date; description: string }[];
    performanceChallenges: { date: Date; description: string }[];
    lifeEvents: { date: Date; description: string }[];  // Optional, athlete-entered
  };
  
  // AI-GENERATED PATTERNS (no diagnosis, just observations)
  observedPatterns: {
    stressTriggers: string[];  // e.g., "Mood tends to drop before tournaments"
    positiveCorrelations: string[];  // e.g., "Higher mood when sleep > 8 hours"
    concerningPatterns: string[];  // e.g., "3 consecutive weeks of declining motivation"
  };
  
  // ATHLETE NOTES (self-reflection space)
  athleteNotes: string;
}
```

**Pre-Competition Mental State Report**
```typescript
interface PreCompetitionReport {
  competition: {
    name: string;
    date: Date;
    significance: 'regular' | 'important' | 'championship';
  };
  
  // 7-day lead-up mental state
  leadUpPeriod: {
    avgConfidence: number;
    confidenceTrend: 'rising' | 'stable' | 'falling';
    avgAnxiety: number;
    anxietyTrend: 'rising' | 'stable' | 'falling';
    avgSleep: number;
    sleepQuality: number;
    appetiteChanges: boolean;
    focusRating: number;
  };
  
  // Historical comparison
  historicalComparison: {
    previousSimilarEvents: number;
    avgPerformanceInSimilar: string;
    mentalStateCorrelation: string;  // e.g., "Performed best when confidence > 7"
  };
  
  // Athlete's self-assessment
  selfAssessment: {
    readinessRating: number;  // 1-10
    biggestConcern: string;
    copingStrategies: string[];
    supportNeeded: string[];
  };
}
```

**Season Mental Health Summary**
```typescript
interface SeasonMentalHealthSummary {
  season: { start: Date; end: Date; name: string };
  
  overallMetrics: {
    avgMood: number;
    avgStress: number;
    avgMotivation: number;
    avgConfidence: number;
    avgSleep: number;
  };
  
  monthlyBreakdown: {
    month: string;
    avgMood: number;
    avgStress: number;
    significantEvents: string[];
  }[];
  
  correlations: {
    moodVsPerformance: number;  // Correlation coefficient
    stressVsInjury: string;  // Narrative
    sleepVsMood: number;
    trainingLoadVsStress: number;
  };
  
  growthAreas: {
    improvements: string[];
    challenges: string[];
    recommendedFocus: string[];
  };
  
  athleteReflection: string;  // End-of-season self-reflection
}
```

### Business Logic

#### Report Generation Privacy Controls
```typescript
interface ReportPrivacySettings {
  // Athlete controls exactly what's included
  includeWellnessScores: boolean;
  includeSleepData: boolean;
  includeTrainingLoad: boolean;
  includePerformanceData: boolean;
  includeInjuryHistory: boolean;
  includeAINotes: boolean;
  includePersonalNotes: boolean;
  
  // Anonymization options
  anonymizeTeamName: boolean;
  anonymizeCoachNames: boolean;
  removeDates: boolean;  // Show only relative time
}
```

#### Mental Wellness Flags (Internal Use)
```typescript
// These flags trigger gentle check-ins, NOT shared externally without consent
const WELLNESS_FLAGS = {
  concerningPattern: {
    trigger: 'mood_declining_3_weeks',
    action: 'Show supportive message + mental health resources',
    notification: 'none'  // No alerts to coaches unless athlete requests
  },
  sleepDeficit: {
    trigger: 'avg_sleep_under_6_hours_1_week',
    action: 'Sleep improvement tips + recovery suggestions',
    notification: 'none'
  },
  highStress: {
    trigger: 'stress_above_8_for_5_days',
    action: 'Stress management resources + optional check-in',
    notification: 'none'
  }
};
```

### Data Export Formats
All reports can be downloaded in:
- **PDF**: Formatted for printing/sharing with professionals
- **JSON**: For import into other health tracking systems
- **CSV**: For athletes who want raw data

---

## 33. Data Import/Export System

### Purpose
**Data Import/Export** allows athletes, coaches, and teams to move data in and out of the application - supporting data portability, backup, integration with other tools, and sharing with professionals.

### Who Uses It
- **Players**: Export personal data, import from wearables/other apps
- **Coaches**: Export team reports, import roster data
- **Admins**: Bulk data management, backups
- **Professionals**: Receive exported reports (nutritionists, physios, psychologists)

---

### DOWNLOADABLE EXPORTS (What Players/Coaches Can Export)

#### 1. Personal Data Exports

| Export Type | Format | Contents | Use Case |
|-------------|--------|----------|----------|
| **Full Data Export** | JSON | All personal data | Data portability, backup, switching apps |
| **Training History** | JSON/CSV | All logged training sessions | Share with new coach, analysis |
| **Wellness History** | JSON/CSV | Daily check-ins, scores | Share with doctor/psychologist |
| **Body Composition** | CSV | Weight, body fat over time | Share with nutritionist |
| **Performance Benchmarks** | JSON/CSV | Sprint times, strength tests | Share with trainer |
| **Game Statistics** | CSV | Per-game stats by position | Analysis, recruitment |

```typescript
interface PersonalDataExport {
  exportDate: string;
  format: 'json' | 'csv' | 'pdf';
  athlete: {
    id: string;
    name: string;
    email: string;
    position: string;
    dateJoined: string;
  };
  
  // Optional sections (user selects what to include)
  sections: {
    profile: boolean;
    trainingHistory: boolean;
    wellnessHistory: boolean;
    bodyComposition: boolean;
    performanceBenchmarks: boolean;
    gameStatistics: boolean;
    supplementLog: boolean;
    injuryHistory: boolean;
    achievements: boolean;
  };
  
  dateRange?: {
    start: string;
    end: string;
  };
}
```

#### 2. Professional Reports (PDF)

| Report | For Whom | Contents |
|--------|----------|----------|
| **Nutritionist Report** | Dietitian | Body comp, training load, supplements, wellness |
| **Physiotherapy Report** | Physio | Injuries, ACWR, movement data, RTP progress |
| **Psychology Report** | Psychologist | Mood, stress, sleep, motivation trends |
| **Medical Summary** | Doctor | Injury history, medications, wellness overview |
| **Performance Report** | Scout/College | Stats, benchmarks, achievements |

#### 3. Team/Coach Exports

| Export Type | Format | Contents |
|-------------|--------|----------|
| **Roster Export** | CSV/JSON | All players with contact info, positions |
| **Team Statistics** | CSV | Aggregated team stats by game |
| **Attendance Report** | CSV | Practice/game attendance by player |
| **Training Compliance** | CSV | Who completed training, wellness check-ins |
| **ACWR Team Report** | PDF | Risk levels for all players |
| **Depth Chart** | JSON | Current depth chart configuration |

---

### UPLOADABLE IMPORTS (What Can Be Imported)

#### 1. Wearable Device Data

| Source | Data Type | Format | How It's Used |
|--------|-----------|--------|---------------|
| **Garmin** | Training load, HR, sleep | JSON/FIT | Populates training sessions, sleep data |
| **Whoop** | Strain, recovery, sleep | JSON | Wellness scores, readiness |
| **Apple Watch** | Workouts, HR, sleep | JSON | Training sessions, wellness |
| **Fitbit** | Activity, sleep, HR | JSON | Wellness, activity tracking |
| **Oura Ring** | Sleep, readiness | JSON | Sleep quality, recovery scores |
| **Polar** | Training sessions, HR | JSON | Training load calculation |

```typescript
interface WearableImport {
  source: 'garmin' | 'whoop' | 'apple_health' | 'fitbit' | 'oura' | 'polar';
  dataType: 'training' | 'sleep' | 'heart_rate' | 'recovery' | 'all';
  fileFormat: 'json' | 'fit' | 'csv' | 'xml';
  dateRange: { start: string; end: string };
  
  // Mapping rules
  fieldMapping: {
    duration: string;  // Which field maps to duration
    intensity: string;  // Which field maps to RPE/intensity
    heartRate: string;
    calories: string;
  };
  
  // Conflict resolution
  onDuplicate: 'skip' | 'overwrite' | 'merge';
}
```

#### 2. Roster/Player Imports

| Format | Required Fields | Optional Fields |
|--------|-----------------|-----------------|
| **CSV** | name, email, position | phone, jersey_number, birthdate |
| **JSON** | name, email, position | All profile fields |
| **Excel** | name, email, position | All profile fields |

```csv
# Example roster import CSV
name,email,position,jersey_number,birthdate
"John Smith",john@email.com,QB,12,2000-05-15
"Maria Garcia",maria@email.com,WR,88,1998-03-22
```

#### 3. Historical Data Import

| Data Type | Format | Use Case |
|-----------|--------|----------|
| **Past Training Sessions** | CSV/JSON | Import from previous app/spreadsheet |
| **Historical Weight** | CSV | Import from scale app or spreadsheet |
| **Previous Injuries** | JSON | Import injury history |
| **Game Statistics** | CSV | Import past season stats |

---

### HOW IMPORTS AFFECT APPLICATION FUNCTIONALITY

#### Training Data Import Effects
```typescript
// When training data is imported, it affects:
interface TrainingImportEffects {
  // ACWR Calculation
  acwr: {
    chronicLoadRecalculated: true,  // 28-day average updated
    acuteLoadRecalculated: true,    // 7-day average updated
    injuryRiskUpdated: true         // Risk zones recalculated
  };
  
  // Recommendations
  aiRecommendations: {
    trainingIntensityAdjusted: true,  // Based on new load history
    recoveryRecommendationsUpdated: true,
    periodizationSuggestionsUpdated: true
  };
  
  // Analytics
  analytics: {
    trainingVolumeChartsUpdated: true,
    trendsRecalculated: true,
    comparisonDataEnriched: true
  };
}
```

#### Body Composition Import Effects
```typescript
// When weight/body comp data is imported:
interface BodyCompImportEffects {
  // Load Normalization
  loadCalculations: {
    bodyWeightNormalizationUpdated: true,  // Training load adjusted for weight
    jointStressEstimatesUpdated: true
  };
  
  // Nutrition
  nutrition: {
    calorieRecommendationsUpdated: true,
    hydrationTargetsRecalculated: true,
    bmiPositionComparisonUpdated: true
  };
  
  // Alerts
  alerts: {
    weightTrendAlertsRecalculated: true,
    dehydrationRiskAssessed: true
  };
}
```

#### Wearable Sleep Data Import Effects
```typescript
// When sleep data is imported from wearables:
interface SleepImportEffects {
  // Wellness Score
  wellness: {
    sleepQualityScoreUpdated: true,
    readinessScoreRecalculated: true,
    fatigueEstimateUpdated: true
  };
  
  // Recovery
  recovery: {
    recoveryRecommendationsUpdated: true,
    trainingIntensitySuggestionAdjusted: true
  };
  
  // AI Coach
  aiCoach: {
    contextEnriched: true,  // AI knows about sleep patterns
    personalizationImproved: true
  };
}
```

---

## 34. Knowledge Drop-In System

### Purpose
**Knowledge Drop-In** allows users to upload documents (PDF, articles, research papers) that get transformed into structured knowledge the AI can reference - creating a personalized or team knowledge base.

### Who Uses It
- **Players**: Upload personal training plans, medical reports
- **Coaches**: Upload playbooks, team protocols, research
- **Admins**: Curate approved knowledge for all users
- **Teams**: Build shared team knowledge base

---

### How It Works

#### 1. Document Upload Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Upload    │ ──► │   Process    │ ──► │   Review    │ ──► │   Activate   │
│   PDF/Doc   │     │   (Parse +   │     │   (Admin    │     │   (AI Can    │
│             │     │   Transform) │     │   Approval) │     │   Reference) │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

#### 2. Document Processing Pipeline
```typescript
interface DocumentUpload {
  // Upload metadata
  uploadedBy: string;  // User ID
  uploadDate: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md' | 'html';
  fileSize: number;
  
  // Sharing scope
  scope: 'personal' | 'team' | 'public';
  shareWithCoach: boolean;
  shareWithTeam: boolean;
  submitForPublicApproval: boolean;
  
  // Categorization
  category: DocumentCategory;
  tags: string[];
  description: string;
}

type DocumentCategory =
  | 'training_methodology'
  | 'nutrition_guide'
  | 'injury_prevention'
  | 'position_specific'
  | 'playbook'
  | 'medical_report'
  | 'research_paper'
  | 'protocol'
  | 'other';
```

#### 3. PDF to Knowledge Transformation
```typescript
interface KnowledgeTransformation {
  // Step 1: Extract text from PDF
  textExtraction: {
    method: 'ocr' | 'pdf_parse';
    rawText: string;
    pageCount: number;
    extractedTables: Table[];
    extractedImages: Image[];
  };
  
  // Step 2: Structure the content
  structuredContent: {
    title: string;
    summary: string;  // AI-generated summary
    sections: {
      heading: string;
      content: string;
      keyPoints: string[];
    }[];
    citations: string[];
    terminology: { term: string; definition: string }[];
  };
  
  // Step 3: Generate embeddings for AI retrieval
  embeddings: {
    chunks: {
      id: string;
      text: string;
      embedding: number[];  // Vector embedding for semantic search
      metadata: {
        section: string;
        pageNumber: number;
        importance: 'high' | 'medium' | 'low';
      };
    }[];
  };
  
  // Step 4: Create knowledge entries
  knowledgeEntries: KnowledgeEntry[];
}

interface KnowledgeEntry {
  id: string;
  sourceDocument: string;
  category: DocumentCategory;
  topic: string;
  content: string;
  keyPoints: string[];
  relatedTopics: string[];
  evidenceLevel: 'research' | 'expert_opinion' | 'anecdotal';
  searchableText: string;
  embedding: number[];
}
```

---

### Knowledge Scopes & Approval

#### Personal Knowledge (No Approval Needed)
```typescript
interface PersonalKnowledge {
  scope: 'personal';
  visibility: 'owner_only';
  approvalRequired: false;
  
  // Examples:
  examples: [
    'Personal medical reports',
    'Individual training plans from private coach',
    'Personal nutrition plan from dietitian',
    'Therapy notes (for own AI context)'
  ];
  
  // AI behavior
  aiUsage: {
    visibleTo: ['owner'],
    contextFor: ['personal AI chat'],
    citationPrefix: 'Based on your personal documents...'
  };
}
```

#### Team Knowledge (Coach Approval)
```typescript
interface TeamKnowledge {
  scope: 'team';
  visibility: 'team_members';
  approvalRequired: true;
  approver: 'coach' | 'team_admin';
  
  // Examples:
  examples: [
    'Team playbook',
    'Team-specific protocols',
    'Scouting reports',
    'Team nutrition guidelines'
  ];
  
  // AI behavior
  aiUsage: {
    visibleTo: ['team_members'],
    contextFor: ['team AI chat', 'individual chat for team members'],
    citationPrefix: 'According to team resources...'
  };
  
  // Approval workflow
  approvalWorkflow: {
    submittedBy: string;
    reviewedBy: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewNotes: string;
    approvalDate: string;
  };
}
```

#### Public Knowledge (Admin Approval)
```typescript
interface PublicKnowledge {
  scope: 'public';
  visibility: 'all_users';
  approvalRequired: true;
  approver: 'system_admin';
  
  // Examples:
  examples: [
    'Peer-reviewed research papers',
    'Official flag football rules',
    'Recognized training methodologies',
    'Validated nutrition guidelines'
  ];
  
  // AI behavior
  aiUsage: {
    visibleTo: ['all_users'],
    contextFor: ['all AI chat contexts'],
    citationPrefix: 'Based on verified research...'
  };
  
  // Strict approval criteria
  approvalCriteria: {
    sourceVerified: boolean;  // Is the source legitimate?
    contentAccurate: boolean;  // Has content been fact-checked?
    noConflicts: boolean;  // Doesn't contradict existing evidence base
    appropriateForAll: boolean;  // Safe for all athletes
    legalClear: boolean;  // No copyright issues
  };
}
```

---

### AI Integration: How Knowledge Affects Responses

#### Knowledge Retrieval Flow
```typescript
// When user asks AI a question:
async function handleAIQuestion(userId: string, question: string): Promise<AIResponse> {
  // 1. Generate embedding for the question
  const questionEmbedding = await generateEmbedding(question);
  
  // 2. Search knowledge bases in priority order
  const relevantKnowledge = await searchKnowledge({
    embedding: questionEmbedding,
    sources: [
      { type: 'system_evidence_base', weight: 1.0 },  // Built-in research
      { type: 'public_knowledge', weight: 0.9 },      // Admin-approved
      { type: 'team_knowledge', userId, weight: 0.8 }, // Team docs
      { type: 'personal_knowledge', userId, weight: 0.7 } // Personal docs
    ],
    limit: 10,
    minSimilarity: 0.7
  });
  
  // 3. Build context for AI
  const context = buildContext(relevantKnowledge);
  
  // 4. Generate response with citations
  const response = await generateAIResponse(question, context);
  
  // 5. Include source citations
  return {
    answer: response.text,
    sources: relevantKnowledge.map(k => ({
      title: k.sourceDocument,
      type: k.scope,
      relevance: k.similarityScore
    })),
    confidence: calculateConfidence(relevantKnowledge)
  };
}
```

#### Example AI Response with Knowledge Sources
```typescript
// User question: "How should I prepare for a tournament in hot weather?"

const aiResponse = {
  answer: `
    Based on the research and your team's protocols, here's how to prepare:
    
    1. **Hydration**: Start hydrating 2-3 days before (35ml per kg body weight)
    2. **Acclimatization**: Your team protocol recommends 10-14 days of heat exposure
    3. **Nutrition**: Based on your personal nutrition plan, increase sodium intake
    4. **Cooling strategies**: Use ice towels between games (per tournament guide)
  `,
  sources: [
    { title: "Heat Adaptation in Athletes (Périard 2015)", type: "system_evidence_base" },
    { title: "Team Summer Tournament Protocol", type: "team_knowledge" },
    { title: "Personal Nutrition Plan from Dr. Smith", type: "personal_knowledge" },
    { title: "Tournament Best Practices Guide", type: "public_knowledge" }
  ],
  confidence: 0.92
};
```

---

### Data Formats Supported

#### Import Formats
| Format | Extension | Use Case | Processing |
|--------|-----------|----------|------------|
| **PDF** | .pdf | Research papers, reports, protocols | OCR + text extraction |
| **Word** | .docx | Training plans, playbooks | Direct text extraction |
| **Markdown** | .md | Structured documentation | Direct parse |
| **Plain Text** | .txt | Simple notes, lists | Direct parse |
| **HTML** | .html | Web articles | Strip tags + extract |
| **JSON** | .json | Structured data, exports from other apps | Direct import |
| **CSV** | .csv | Tabular data (rosters, stats, logs) | Column mapping |
| **XML** | .xml | Wearable exports, structured data | Schema-based parse |
| **FIT** | .fit | Garmin activity files | Specialized parser |

#### Export Formats
| Format | Best For | Features |
|--------|----------|----------|
| **JSON** | Data portability, backups | Complete data, re-importable |
| **CSV** | Spreadsheet analysis | Tabular, Excel-compatible |
| **PDF** | Professional reports | Formatted, printable |
| **XML** | System integrations | Structured, schema-defined |

---

### Security & Privacy

#### Document Security
```typescript
interface DocumentSecurity {
  // Encryption
  encryption: {
    atRest: 'AES-256';
    inTransit: 'TLS 1.3';
    personalDocsExtraEncryption: true;  // Additional layer for medical/personal
  };
  
  // Access control
  accessControl: {
    personalDocs: ['owner_only'],
    teamDocs: ['team_members', 'coach'],
    publicDocs: ['all_authenticated_users']
  };
  
  // Audit trail
  auditLog: {
    trackUploads: true,
    trackViews: true,
    trackAIUsage: true,  // When AI references the document
    retentionDays: 365
  };
  
  // Deletion
  deletion: {
    userCanDelete: true,
    gdprCompliant: true,
    cascadeToEmbeddings: true  // Also delete AI embeddings
  };
}
```

#### Medical Document Handling
```typescript
interface MedicalDocumentPolicy {
  // Extra protections for medical data
  classification: 'medical';
  extraEncryption: true;
  
  // AI usage restrictions
  aiRestrictions: {
    canSummarize: true,
    canProvideContext: true,
    cannotDiagnose: true,  // AI will not interpret medical results
    cannotRecommendTreatment: true,
    mustSuggestProfessional: true  // Always recommend consulting doctor
  };
  
  // Sharing restrictions
  sharingRestrictions: {
    canShareWithCoach: false,  // Must be explicit opt-in
    canShareWithTeam: false,
    canMakePublic: false,
    canExportForDoctor: true  // Primary use case
  };
}
```

---

### Impact on Application Functionality

#### When Knowledge is Added
```typescript
interface KnowledgeAdditionEffects {
  // AI becomes smarter
  aiCapabilities: {
    newTopicsCovered: string[];
    answerQualityImproved: boolean;
    citationsAvailable: boolean;
    personalizationEnhanced: boolean;
  };
  
  // Search improved
  search: {
    newSearchableContent: true,
    relatedContentSuggestions: true
  };
  
  // Recommendations enhanced
  recommendations: {
    contextualRecommendationsImproved: true,
    protocolsEnriched: true
  };
}
```

#### When Knowledge is Removed
```typescript
interface KnowledgeRemovalEffects {
  // AI forgets
  aiCapabilities: {
    topicsNoLongerCovered: string[];
    fallbackToSystemKnowledge: true
  };
  
  // Cascade effects
  cascadeEffects: {
    embeddingsDeleted: true,
    citationsRemoved: true,
    searchIndexUpdated: true
  };
}
```

---

## 35. Team Chat & Channels

### Purpose
**Team Chat** provides real-time communication between team members with channel-based messaging, role-based permissions, @mentions, and read receipts.

### Who Uses It
- **Coaches**: Create channels, pin messages, post announcements
- **Players**: Communicate with teammates, receive team updates

### Functionality

#### 1. Channel Types
| Channel Type | Who Can See | Who Can Post | Example |
|--------------|-------------|--------------|---------|
| **Announcements** | All team | Coaches only | "Practice cancelled tomorrow" |
| **General** | All team | All team | Day-to-day chat |
| **Coaches Only** | Coaches | Coaches | Strategy discussion |
| **Position Groups** | Position members | Position members | "QB Room", "WR Room" |
| **Direct Messages** | 2 people | Both | Private conversations |

#### 2. Features
- **@Mentions**: Tag specific players for notifications
- **Message Pinning**: Coaches can pin important messages
- **Read Receipts**: See who has viewed announcements
- **Real-time Updates**: Messages appear instantly
- **Message Search**: Find past conversations
- **File Sharing**: Share images, videos, documents

#### 3. Role Permissions
```typescript
const CHAT_PERMISSIONS = {
  coach: {
    canCreateChannels: true,
    canPinMessages: true,
    canMarkImportant: true,
    canDeleteAnyMessage: true,
    canViewAllChannels: true
  },
  player: {
    canCreateChannels: false,
    canPinMessages: false,
    canMarkImportant: false,
    canDeleteOwnMessages: true,
    canViewAllChannels: false  // Only assigned channels
  },
  guest: {  // For approved guests (trainers, nutritionists, etc.)
    canCreateChannels: false,
    canPinMessages: false,
    canPost: false,  // View only in most channels
    canViewAllChannels: false
  }
};
```

### Business Logic

#### Notification Priority
```typescript
function getMessagePriority(message: ChatMessage): 'high' | 'normal' | 'low' {
  if (message.channel === 'announcements') return 'high';
  if (message.mentions.includes(currentUserId)) return 'high';
  if (message.isMarkedImportant) return 'high';
  if (message.channel === 'general') return 'normal';
  return 'low';
}
```

---

## 36. Community Feed

### Purpose
**Community Feed** provides a social media-style feed for team engagement with posts, comments, likes, polls, and media sharing.

### Who Uses It
- **All Team Members**: Share updates, celebrate achievements
- **Coaches**: Post team updates, create polls
- **Players**: Share training highlights, interact with teammates

### Functionality

#### 1. Post Types
- **Text Posts**: Simple updates and thoughts
- **Media Posts**: Photos and videos
- **Polls**: Team voting (e.g., "Best practice location?")
- **Achievement Shares**: Automatically posted achievements
- **Game Recaps**: Post-game summaries

#### 2. Interactions
- **Likes**: React to posts
- **Comments**: Threaded discussions
- **Shares**: Share posts to other channels
- **Bookmarks**: Save posts for later

#### 3. Features
- **Virtual Scroll**: Efficient loading for long feeds
- **Real-time Updates**: New posts appear instantly
- **Content Moderation**: Coach approval for certain content
- **Media Gallery**: View all shared photos/videos

### Business Logic

#### Feed Algorithm
```typescript
function sortFeedPosts(posts: Post[]): Post[] {
  return posts.sort((a, b) => {
    // Pinned posts first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Recent engagement boosts visibility
    const aEngagement = a.likes + (a.comments * 2);
    const bEngagement = b.likes + (b.comments * 2);
    
    // Time decay - recent posts preferred
    const aAge = (Date.now() - new Date(a.timestamp).getTime()) / 3600000; // hours
    const bAge = (Date.now() - new Date(b.timestamp).getTime()) / 3600000;
    
    const aScore = aEngagement / (1 + aAge * 0.1);
    const bScore = bEngagement / (1 + bAge * 0.1);
    
    return bScore - aScore;
  });
}
```

---

## 37. Return-to-Play Protocol

### Purpose
**Return-to-Play (RTP)** provides evidence-based graduated protocols for athletes returning from injury or extended absence, minimizing re-injury risk.

### Who Uses It
- **Injured Players**: Follow structured return protocols
- **Coaches**: Monitor player progress, clear for return
- **Medical Staff**: Set protocols, approve stage transitions

### Functionality

#### 1. Injury Types Supported
- Muscle Strain
- Ligament Sprain
- Tendinopathy
- Bone Stress
- Concussion
- Illness
- General Absence

#### 2. Return Stages (7-Stage Protocol)
| Stage | Name | Load % | Activities |
|-------|------|--------|------------|
| 1 | Rest | 0% | Complete rest, medical treatment |
| 2 | Light Activity | 20% | Walking, light stretching |
| 3 | Sport-Specific Low | 40% | Position drills at low intensity |
| 4 | Sport-Specific Moderate | 60% | Drills at moderate intensity |
| 5 | Sport-Specific High | 80% | Full drills, non-contact |
| 6 | Full Training | 100% | Full team training |
| 7 | Full Competition | 100% | Cleared for games |

#### 3. Progression Criteria
- Minimum days at each stage
- Pain-free completion of activities
- Objective strength/mobility tests
- Medical clearance where required

### Business Logic

#### Muscle Strain Protocol Example
```typescript
const MUSCLE_STRAIN_PROTOCOL: ReturnProtocol = {
  injuryType: 'muscle_strain',
  stages: [
    {
      stage: 'rest',
      name: 'Initial Rest',
      minimumDays: 2,
      activities: ['Rest', 'Ice', 'Compression', 'Elevation'],
      restrictions: ['No running', 'No sport activity'],
      progressionCriteria: ['Pain at rest < 2/10', 'Swelling reduced'],
      loadPercentage: 0,
      intensityLimit: 0
    },
    {
      stage: 'light_activity',
      name: 'Light Activity',
      minimumDays: 3,
      activities: ['Walking', 'Gentle stretching', 'Pool walking'],
      restrictions: ['No sprinting', 'No cutting'],
      progressionCriteria: ['Pain-free walking', 'ROM 90% of normal'],
      loadPercentage: 20,
      intensityLimit: 40
    },
    // ... more stages
  ],
  totalMinimumDays: 14,
  evidenceBase: 'Blanch & Gabbett 2016'
};
```

#### Progress Calculation
```typescript
function calculateRTPProgress(injury: InjuryRecord): number {
  const protocol = getProtocol(injury.type);
  const currentStageIndex = protocol.stages.findIndex(s => s.stage === injury.currentStage);
  const totalStages = protocol.stages.length;
  
  // Base progress from stage completion
  const stageProgress = (currentStageIndex / totalStages) * 100;
  
  // Add partial progress within current stage
  const currentStage = protocol.stages[currentStageIndex];
  const daysInStage = getDaysInStage(injury);
  const stageCompletion = Math.min(1, daysInStage / currentStage.minimumDays);
  const withinStageProgress = (1 / totalStages) * stageCompletion * 100;
  
  return Math.round(stageProgress + withinStageProgress);
}
```

#### Re-injury Risk Assessment
```typescript
function assessReinjuryRisk(injury: InjuryRecord, trainingData: TrainingData): RiskLevel {
  const factors = {
    rushingReturn: injury.daysInRecovery < injury.protocol.totalMinimumDays * 0.8,
    previousReinjury: injury.reinjuryCount > 0,
    highACWR: trainingData.acwr > 1.3,
    poorSleep: trainingData.avgSleep < 7,
    incompleteCriteria: !allCriteriaMet(injury)
  };
  
  const riskScore = Object.values(factors).filter(Boolean).length;
  
  if (riskScore >= 3) return 'high';
  if (riskScore >= 2) return 'moderate';
  return 'low';
}
```

---

## 38. Sleep Debt Tracking

### Purpose
**Sleep Debt Tracking** monitors cumulative sleep deficit and its impact on training capacity, recovery, and injury risk.

### Who Uses It
- **Players**: Log sleep, understand impact on performance
- **Coaches**: Monitor team sleep patterns, adjust training

### Functionality

#### 1. Sleep Logging
- Hours slept
- Sleep quality (1-10)
- Bed time / Wake time
- Interruptions
- Notes

#### 2. Sleep Debt Analysis
- 7-day and 14-day averages
- Cumulative debt calculation
- Debt severity levels
- Recovery timeline

#### 3. Impact Calculations
- Training capacity multiplier
- Recovery rate multiplier
- Injury risk multiplier

### Business Logic

#### Optimal Sleep by Age
```typescript
const SLEEP_REQUIREMENTS = {
  junior: { optimal: 9, minimum: 8 },     // 16-17 years
  youngAdult: { optimal: 8, minimum: 7 }, // 18-25
  adult: { optimal: 7.5, minimum: 7 }     // 26+
};
```

#### Sleep Debt Calculation
```typescript
function calculateSleepDebt(sleepHistory: SleepEntry[], optimalHours: number): SleepDebtAnalysis {
  const last7Days = sleepHistory.slice(-7);
  
  // Calculate cumulative debt
  let cumulativeDebt = 0;
  for (const entry of last7Days) {
    const deficit = optimalHours - entry.hoursSlept;
    if (deficit > 0) {
      cumulativeDebt += deficit;
    }
  }
  
  // Determine debt level
  let debtLevel: DebtLevel;
  if (cumulativeDebt === 0) debtLevel = 'none';
  else if (cumulativeDebt < 5) debtLevel = 'mild';
  else if (cumulativeDebt < 10) debtLevel = 'moderate';
  else if (cumulativeDebt < 15) debtLevel = 'severe';
  else debtLevel = 'critical';
  
  // Calculate impact multipliers
  const trainingImpact = Math.max(0.5, 1 - (cumulativeDebt * 0.03));
  const recoveryImpact = Math.max(0.4, 1 - (cumulativeDebt * 0.04));
  const injuryRiskMultiplier = 1 + (cumulativeDebt * 0.1);  // 10% increase per hour of debt
  
  return {
    cumulativeDebt,
    debtLevel,
    trainingImpact,
    recoveryImpact,
    injuryRiskMultiplier,
    // ...
  };
}
```

#### Research-Based Impact
```typescript
// Based on Mah et al. (2011), Halson (2014), Simpson et al. (2017)
const SLEEP_IMPACT = {
  reactionTime: {
    // Reaction time decreases 300% with sleep deprivation
    formula: (debtHours: number) => 1 + (debtHours * 0.15)  // 15% slower per hour of debt
  },
  injuryRisk: {
    // Injury risk increases 1.7x with <8 hours sleep
    threshold: 8,
    multiplier: 1.7
  },
  performance: {
    // Basketball players gained 9% sprint speed with sleep extension
    optimalBoost: 1.09
  }
};
```

---

## 39. Hydration Tracker

### Purpose
**Hydration Tracker** logs daily water intake with visual progress toward personalized hydration goals based on body weight and activity level.

### Who Uses It
- **Players**: Quick-log water intake throughout the day
- **Coaches**: Monitor team hydration compliance

### Functionality

#### 1. Quick Logging
- Preset amounts: 250ml, 500ml, 750ml
- Custom amount entry
- Drink type: Water, Sports drink, Other
- Timestamp tracking

#### 2. Visual Display
- Animated water bottle fill level
- Progress bar toward daily goal
- Color coding: Red (<30%), Yellow (30-70%), Green (>70%)

#### 3. Smart Goals
- Personalized based on body weight
- Adjusted for training days
- Temperature/weather adjustments

### Business Logic

#### Daily Goal Calculation
```typescript
function calculateDailyHydrationGoal(
  bodyWeight: number,  // kg
  isTrainingDay: boolean,
  trainingDurationMinutes: number,
  temperature: 'cool' | 'moderate' | 'hot'
): number {
  // Base: 35ml per kg body weight
  let goal = bodyWeight * 35;
  
  // Training adjustment: +500ml per hour of training
  if (isTrainingDay) {
    goal += (trainingDurationMinutes / 60) * 500;
  }
  
  // Temperature adjustment
  if (temperature === 'hot') {
    goal *= 1.25;  // +25% in hot weather
  } else if (temperature === 'cool') {
    goal *= 0.9;   // -10% in cool weather
  }
  
  return Math.round(goal);
}
```

#### Dehydration Risk
```typescript
function assessDehydrationRisk(
  currentIntake: number,
  dailyGoal: number,
  timeOfDay: number  // 0-24
): 'low' | 'moderate' | 'high' {
  const expectedByNow = (timeOfDay / 18) * dailyGoal;  // Assume 18 waking hours
  const deficit = expectedByNow - currentIntake;
  
  if (deficit > dailyGoal * 0.3) return 'high';
  if (deficit > dailyGoal * 0.15) return 'moderate';
  return 'low';
}
```

---

## 40. Menstrual Cycle Tracking (Female Athletes)

### Purpose
**Menstrual Cycle Tracking** enables female athletes to log and track their menstrual cycles, with the app automatically adapting training recommendations, recovery protocols, and nutrition guidance based on cycle phases. Research shows cycle-aware training can improve performance by 5-15% and reduce injury risk.

### Who Uses It
- **Female Players**: Log cycle data, receive phase-adapted recommendations
- **Coaches**: Understand team readiness patterns (aggregated/anonymized only)

### Functionality

#### 1. Cycle Logging
- Period start/end dates
- Flow intensity (light/moderate/heavy)
- Symptom tracking (cramps, fatigue, mood, bloating, headache)
- Cycle length history
- Prediction of upcoming periods

#### 2. Phase Detection
```typescript
type CyclePhase = 
  | 'menstrual'      // Days 1-5: Period
  | 'follicular'     // Days 6-13: Post-period, rising estrogen
  | 'ovulation'      // Days 14-16: Peak fertility, peak performance
  | 'luteal_early'   // Days 17-22: Post-ovulation
  | 'luteal_late';   // Days 23-28: Pre-menstrual (PMS)

interface CycleData {
  currentPhase: CyclePhase;
  dayOfCycle: number;
  cycleLength: number;  // Average (typically 28 days)
  predictedNextPeriod: Date;
  symptoms: string[];
}
```

#### 3. Training Adaptations by Phase
```typescript
const PHASE_TRAINING_ADAPTATIONS = {
  menstrual: {
    // Days 1-5: Lower energy, higher injury risk
    intensityModifier: 0.7,  // Reduce intensity by 30%
    focusAreas: ['recovery', 'mobility', 'light_cardio'],
    avoid: ['high_intensity', 'heavy_lifting', 'plyometrics'],
    recoveryMultiplier: 1.3,
    recommendations: [
      'Focus on low-intensity movement',
      'Prioritize recovery and stretching',
      'Listen to your body - rest if needed',
      'Iron-rich foods recommended'
    ]
  },
  
  follicular: {
    // Days 6-13: Rising energy, estrogen building
    intensityModifier: 1.0,
    focusAreas: ['strength', 'skill_work', 'endurance'],
    avoid: [],
    recoveryMultiplier: 0.9,
    recommendations: [
      'Great time for strength gains',
      'Body adapts well to high-intensity work',
      'Build training volume',
      'Focus on technique and skill development'
    ]
  },
  
  ovulation: {
    // Days 14-16: Peak performance window
    intensityModifier: 1.1,  // Can push 10% harder
    focusAreas: ['power', 'speed', 'max_strength', 'competition'],
    avoid: [],
    recoveryMultiplier: 0.85,
    recommendations: [
      '🔥 Peak performance window',
      'Best time for PRs and max efforts',
      'Schedule competitions here if possible',
      'High pain tolerance - be careful not to overdo it',
      '⚠️ Slightly higher ACL injury risk - proper warm-up essential'
    ]
  },
  
  luteal_early: {
    // Days 17-22: Progesterone rising, steady energy
    intensityModifier: 0.95,
    focusAreas: ['endurance', 'moderate_strength', 'conditioning'],
    avoid: ['extreme_heat_training'],
    recoveryMultiplier: 1.0,
    recommendations: [
      'Body temperature slightly elevated',
      'Good for steady-state endurance work',
      'Hydration even more important',
      'Moderate intensity well-tolerated'
    ]
  },
  
  luteal_late: {
    // Days 23-28: PMS phase, energy declining
    intensityModifier: 0.8,
    focusAreas: ['technique', 'flexibility', 'light_conditioning'],
    avoid: ['high_intensity', 'heavy_plyometrics'],
    recoveryMultiplier: 1.2,
    recommendations: [
      'Energy may be lower - adjust expectations',
      'Focus on technique over intensity',
      'Magnesium may help with symptoms',
      'Gentle movement better than complete rest',
      'Prepare mentally for next cycle'
    ]
  }
};
```

#### 4. Nutrition Adaptations
```typescript
const PHASE_NUTRITION = {
  menstrual: {
    calorieModifier: 1.0,
    priorityNutrients: ['iron', 'vitamin_c', 'magnesium'],
    hydrationMultiplier: 1.1,
    notes: 'Iron loss during period - increase iron-rich foods with vitamin C for absorption'
  },
  
  follicular: {
    calorieModifier: 0.95,  // Slightly lower metabolism
    priorityNutrients: ['protein', 'complex_carbs'],
    hydrationMultiplier: 1.0,
    notes: 'Insulin sensitivity higher - good time for carb-focused fueling'
  },
  
  ovulation: {
    calorieModifier: 1.0,
    priorityNutrients: ['antioxidants', 'omega3', 'protein'],
    hydrationMultiplier: 1.05,
    notes: 'Support peak performance with quality protein and anti-inflammatory foods'
  },
  
  luteal_early: {
    calorieModifier: 1.05,  // Metabolism increasing
    priorityNutrients: ['complex_carbs', 'magnesium', 'b_vitamins'],
    hydrationMultiplier: 1.15,  // Higher body temp
    notes: 'Metabolism speeds up - may need slightly more calories'
  },
  
  luteal_late: {
    calorieModifier: 1.1,  // Peak metabolism
    priorityNutrients: ['magnesium', 'calcium', 'omega3', 'vitamin_b6'],
    hydrationMultiplier: 1.1,
    notes: 'Cravings common - satisfy with nutrient-dense options. Magnesium helps PMS symptoms.'
  }
};
```

#### 5. ACWR & Load Adjustments
```typescript
function adjustACWRForCycle(
  baseACWR: number, 
  phase: CyclePhase, 
  symptoms: string[]
): { adjustedACWR: number; recommendation: string } {
  const phaseConfig = PHASE_TRAINING_ADAPTATIONS[phase];
  let adjustedACWR = baseACWR;
  
  // Phase-based adjustment
  adjustedACWR *= phaseConfig.intensityModifier;
  
  // Symptom-based adjustments
  if (symptoms.includes('severe_cramps')) adjustedACWR *= 0.8;
  if (symptoms.includes('fatigue')) adjustedACWR *= 0.9;
  if (symptoms.includes('headache')) adjustedACWR *= 0.9;
  
  // Sweet spot shifts based on phase
  const adjustedSweetSpot = {
    menstrual: { min: 0.6, max: 1.0 },      // More conservative
    follicular: { min: 0.8, max: 1.3 },     // Standard
    ovulation: { min: 0.9, max: 1.5 },      // Can push harder
    luteal_early: { min: 0.75, max: 1.2 },  // Slightly conservative
    luteal_late: { min: 0.65, max: 1.1 }    // Conservative
  };
  
  return {
    adjustedACWR,
    recommendation: generatePhaseRecommendation(phase, adjustedACWR, symptoms)
  };
}
```

#### 6. Injury Risk Awareness
```typescript
const CYCLE_INJURY_RISK = {
  ovulation: {
    aclRisk: 'elevated',  // 3-6x higher ACL injury risk around ovulation
    reason: 'Estrogen peak affects ligament laxity',
    precautions: [
      'Extended warm-up (15+ minutes)',
      'Neuromuscular activation exercises',
      'Avoid cold starts',
      'Extra focus on landing mechanics'
    ]
  },
  luteal_late: {
    coordinationRisk: 'moderate',
    reason: 'Fatigue and PMS can affect reaction time',
    precautions: [
      'Adequate sleep crucial',
      'Longer recovery between drills',
      'Mindful of contact situations'
    ]
  }
};
```

### Privacy Controls
```typescript
// Menstrual data is HIGHLY private
const CYCLE_PRIVACY = {
  defaultVisibility: 'self_only',  // Only the athlete can see
  
  coachVisibility: {
    canSeeIndividualData: false,
    canSeeAggregatedTeamPatterns: true,  // Only if athlete opts in
    seesOnly: 'readiness_score'  // Coach sees "recovery day recommended" not "period"
  },
  
  optionalSharing: {
    shareWithCoach: false,  // Athlete must explicitly enable
    shareWithTrainer: false,
    shareAnonymouslyForTeamStats: false
  },
  
  dataRetention: '12_months',  // Auto-delete older data
  exportable: true  // Athlete can download their data
};
```

### Business Logic

#### Cycle Prediction Algorithm
```typescript
function predictNextPeriod(cycleHistory: CycleEntry[]): Date {
  if (cycleHistory.length < 3) {
    // Default to 28-day cycle
    const lastPeriod = cycleHistory[cycleHistory.length - 1].startDate;
    return addDays(lastPeriod, 28);
  }
  
  // Calculate average cycle length from last 6 cycles
  const recentCycles = cycleHistory.slice(-6);
  const avgCycleLength = recentCycles.reduce(
    (sum, cycle) => sum + cycle.length, 0
  ) / recentCycles.length;
  
  // Calculate standard deviation for confidence
  const stdDev = calculateStdDev(recentCycles.map(c => c.length));
  
  const lastPeriod = cycleHistory[cycleHistory.length - 1].startDate;
  const predictedDate = addDays(lastPeriod, Math.round(avgCycleLength));
  
  return {
    predictedDate,
    confidenceWindow: Math.round(stdDev),  // +/- days
    avgCycleLength: Math.round(avgCycleLength)
  };
}
```

#### Integration with Other Features
```typescript
// Cycle data integrates with:
const CYCLE_INTEGRATIONS = {
  wellness: 'Auto-adjusts expected wellness scores',
  training: 'Modifies daily training recommendations',
  nutrition: 'Adjusts macro/micro targets by phase',
  acwr: 'Shifts sweet spot ranges',
  recovery: 'Extends recovery recommendations in certain phases',
  sleep: 'Accounts for sleep disruption patterns',
  aiCoach: 'AI aware of cycle phase for personalized advice',
  calendar: 'Can show predicted periods on team calendar (private)'
};
```

### Research Basis
- **ACL Injury Risk**: Wojtys et al. (1998), Hewett et al. (2007) - 3-6x higher ACL injury risk during ovulation
- **Performance Variation**: McNulty et al. (2020) - Meta-analysis showing phase-dependent performance
- **Training Adaptations**: Wikström-Frisén et al. (2017) - Follicular phase strength training more effective
- **Iron Needs**: DellaValle & Haas (2014) - Female athletes need 70% more iron

---

## 41. Superadmin Dashboard

### Purpose
**Superadmin Dashboard** provides platform-wide administration including team approvals, role management, and system monitoring.

### Who Uses It
- **Platform Administrators**: Manage all teams and users

### Functionality

#### 1. Approval Workflow
- **Team Registration Approvals**: Review and approve new team signups
- **Coach Role Requests**: Verify and approve coach role requests
- **Public Knowledge Approvals**: Review content for public knowledge base

#### 2. Platform Statistics
- Total active teams
- Total registered athletes
- Pending approvals count
- System health metrics

#### 3. User Management
- Search all users across teams
- Role assignments
- Account suspension/deletion
- Audit logs

#### 4. System Settings
- Feature flags
- Rate limits
- Maintenance mode
- API keys management

### Business Logic

#### Approval Process
```typescript
interface ApprovalRequest {
  id: string;
  type: 'team_registration' | 'coach_role' | 'public_content';
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
}

async function processApproval(
  request: ApprovalRequest,
  decision: 'approve' | 'reject',
  adminNotes: string
): Promise<void> {
  if (decision === 'approve') {
    switch (request.type) {
      case 'team_registration':
        await activateTeam(request.teamId);
        await sendWelcomeEmail(request.requestedBy);
        break;
      case 'coach_role':
        await assignCoachRole(request.userId);
        await notifyTeam(request.teamId, 'New coach added');
        break;
      case 'public_content':
        await publishContent(request.contentId);
        await indexForAI(request.contentId);
        break;
    }
  }
  
  await updateRequest(request.id, {
    status: decision === 'approve' ? 'approved' : 'rejected',
    reviewedBy: currentAdmin.id,
    reviewedAt: new Date(),
    notes: adminNotes
  });
}
```

---

## 42. Playbook Library

### Purpose
**Playbook Library** allows coaches to create, organize, and share plays with detailed assignments for each position, route depths, reads, and coaching notes - so players can study and memorize their responsibilities.

### Who Uses It
- **Coaches**: Create plays, add notes, assign routes, organize by formation/situation
- **Players**: Study plays, memorize assignments, review before practice/games

### Functionality

#### 1. Play Structure
Each play contains:
- Play name and formation
- Visual diagram (field view)
- Position-by-position assignments
- Route trees with exact yardage
- Reads and progressions (for QB)
- Coaching notes and keys
- Tags (situation, formation, play type)

#### 2. Position Assignments
For each position in a play:
```typescript
interface PositionAssignment {
  position: 'QB' | 'WR1' | 'WR2' | 'WR3' | 'Center';
  playerName?: string;  // Optional - assign specific player
  
  // Route/Assignment details
  assignment: {
    type: 'route' | 'block' | 'read' | 'protection';
    description: string;
    
    // For routes
    route?: {
      name: string;  // 'Slant', 'Out', 'Go', 'Curl', etc.
      depth: number;  // yards
      breakDirection?: 'in' | 'out' | 'up' | 'back';
      timing?: string;  // e.g., "3-step drop"
    };
    
    // For blocking
    blockAssignment?: {
      target: string;  // "Rusher left", "Zone right"
      technique: string;
    };
  };
  
  // What coach expects
  keyPoints: string[];  // ["Sell the go route first", "Sharp break at 5 yards"]
  commonMistakes: string[];  // ["Don't round your route", "Stay low on break"]
  
  // Visual positioning
  startPosition: { x: number; y: number };
  routePath?: { x: number; y: number }[];  // Array of points for route drawing
}
```

#### 3. Play Categories
```typescript
interface PlaybookOrganization {
  formations: [
    'Trips Right',
    'Trips Left', 
    'Stack',
    'Spread',
    'Bunch Right',
    'Bunch Left',
    'Empty'
  ];
  
  situations: [
    'Base Offense',
    'Red Zone',
    'Goal Line',
    'Two-Point Conversion',
    '3rd and Short',
    '3rd and Long',
    'Hurry Up',
    '2-Minute Drill'
  ];
  
  playTypes: [
    'Quick Pass',
    'Intermediate',
    'Deep Shot',
    'Screen',
    'QB Run',
    'Motion Play'
  ];
}
```

#### 4. Play Card View (What Players See)
```typescript
interface PlayCard {
  playName: string;
  formation: string;
  diagram: string;  // SVG or image URL
  
  // Player's specific view
  myAssignment: PositionAssignment;
  
  // Full play context
  allAssignments: PositionAssignment[];
  
  // QB reads (if applicable)
  reads?: {
    progression: string[];  // ["1st read: X on slant", "2nd read: Z on out", "Check down: Center"]
    hotRoute?: string;
    protectionCall?: string;
  };
  
  // Coaching notes
  situationNotes: string;  // When to call this play
  coachingKeys: string[];
  
  // Study tools
  isMemorized: boolean;  // Player marks when they've learned it
  lastStudied?: Date;
  quizScore?: number;
}
```

### Business Logic

#### Play Memorization Tracking
```typescript
interface PlaybookProgress {
  playerId: string;
  totalPlays: number;
  memorizedPlays: number;
  memorizedPercentage: number;
  
  byCategory: {
    formation: string;
    total: number;
    memorized: number;
  }[];
  
  recentlyAdded: Play[];  // New plays to learn
  needsReview: Play[];    // Haven't studied in 7+ days
}

function getPlayerPlaybookStatus(playerId: string): PlaybookProgress {
  const allPlays = getTeamPlaybook();
  const playerProgress = getPlayerProgress(playerId);
  
  return {
    totalPlays: allPlays.length,
    memorizedPlays: playerProgress.filter(p => p.isMemorized).length,
    memorizedPercentage: (memorizedPlays / totalPlays) * 100,
    needsReview: playerProgress.filter(p => 
      p.isMemorized && daysSince(p.lastStudied) > 7
    )
  };
}
```

#### Play Quiz Feature
```typescript
interface PlayQuiz {
  playId: string;
  questions: [
    {
      type: 'route_depth',
      question: 'What is your route depth on Mesh Right?',
      correctAnswer: '5 yards',
      options: ['3 yards', '5 yards', '7 yards', '10 yards']
    },
    {
      type: 'assignment',
      question: 'What is WR2\'s assignment on Trips Left Go?',
      correctAnswer: 'Clear out route - run a go',
      options: [...]
    },
    {
      type: 'read_progression',
      question: 'What is the 2nd read on Bunch Slant?',
      correctAnswer: 'Z receiver on the out route',
      options: [...]
    }
  ];
}
```

---

## 43. Video Analysis / Film Room

### Purpose
**Film Room** allows coaches to share game footage via YouTube links, add timestamps with notes, tag specific players or plays, and connect discussions to team chat for collaborative review.

### Who Uses It
- **Coaches**: Upload/link videos, add timestamps, tag plays, assign film to watch
- **Players**: Watch assigned film, see their tagged moments, add questions

### Functionality

#### 1. Video Library
```typescript
interface FilmSession {
  id: string;
  title: string;  // "Week 3 vs Panthers - Offense"
  videoSource: {
    type: 'youtube' | 'vimeo' | 'uploaded';
    url: string;
    embedUrl: string;
  };
  
  category: 'game_film' | 'practice' | 'opponent_scout' | 'technique' | 'highlight';
  opponent?: string;
  gameDate?: Date;
  
  // Access control
  visibility: 'team' | 'coaches_only' | 'position_group';
  positionGroups?: string[];  // e.g., ['QB', 'WR'] for offensive skill players
  
  createdBy: string;
  createdAt: Date;
  
  // Engagement tracking
  viewCount: number;
  requiredFor: string[];  // Player IDs who must watch
  completedBy: string[];  // Players who finished watching
}
```

#### 2. Timestamped Notes & Tags
```typescript
interface VideoTimestamp {
  id: string;
  filmSessionId: string;
  
  // Timestamp
  startTime: number;  // seconds
  endTime?: number;   // seconds (for clips)
  
  // Content
  title: string;      // "Great route by Marcus"
  notes: string;      // Detailed breakdown
  
  // Tags
  taggedPlayers: string[];  // Player IDs
  taggedPlay?: string;      // Link to playbook play
  type: 'positive' | 'correction' | 'teaching_point' | 'opponent_tendency';
  
  // For specific plays
  playCall?: string;
  formation?: string;
  result?: 'touchdown' | 'first_down' | 'incomplete' | 'interception' | 'sack';
  
  // Discussion
  chatThreadId?: string;  // Links to team chat for discussion
  comments: Comment[];
  
  createdBy: string;
  createdAt: Date;
}
```

#### 3. Player View
```typescript
interface PlayerFilmView {
  // Required watching
  assignedFilm: {
    session: FilmSession;
    deadline?: Date;
    watched: boolean;
    watchProgress: number;  // percentage
  }[];
  
  // Moments tagged for this player
  myTaggedMoments: {
    timestamp: VideoTimestamp;
    session: FilmSession;
    feedbackType: 'positive' | 'correction';
  }[];
  
  // Stats
  totalWatchTime: number;  // minutes
  filmCompletionRate: number;
}
```

#### 4. Integration with Team Chat
```typescript
// When coach creates a timestamp with discussion
async function createFilmDiscussion(timestamp: VideoTimestamp): Promise<void> {
  // Create a chat thread
  const thread = await chatService.createThread({
    channel: 'film-room',
    title: `Film: ${timestamp.title}`,
    linkedContent: {
      type: 'film_timestamp',
      filmSessionId: timestamp.filmSessionId,
      timestampId: timestamp.id,
      videoUrl: getEmbedUrlAtTime(timestamp.filmSessionId, timestamp.startTime)
    }
  });
  
  // Update timestamp with thread link
  timestamp.chatThreadId = thread.id;
  
  // Notify tagged players
  for (const playerId of timestamp.taggedPlayers) {
    await notifyPlayer(playerId, {
      type: 'film_tag',
      message: `Coach tagged you in film: "${timestamp.title}"`,
      link: `/film/${timestamp.filmSessionId}?t=${timestamp.startTime}`
    });
  }
}
```

### Business Logic

#### Film Completion Tracking
```typescript
function getFilmComplianceReport(teamId: string): FilmComplianceReport {
  const requiredFilm = getRequiredFilm(teamId);
  const players = getTeamPlayers(teamId);
  
  return {
    overallCompletion: calculateTeamCompletion(requiredFilm, players),
    
    byPlayer: players.map(player => ({
      playerId: player.id,
      name: player.name,
      assignedFilm: requiredFilm.length,
      completedFilm: getCompletedCount(player.id, requiredFilm),
      completionRate: getCompletionRate(player.id, requiredFilm),
      overdue: getOverdueFilm(player.id, requiredFilm)
    })),
    
    bySession: requiredFilm.map(session => ({
      sessionId: session.id,
      title: session.title,
      assignedTo: session.requiredFor.length,
      completedBy: session.completedBy.length,
      completionRate: (session.completedBy.length / session.requiredFor.length) * 100
    }))
  };
}
```

---

## 44. Scouting Reports

### Purpose
**Scouting Reports** provide structured opponent analysis including team tendencies, key players, and strategic notes - integrated with team communication for pre-game preparation.

### Who Uses It
- **Coaches**: Create scouting reports, analyze opponents
- **Players**: Study upcoming opponents, understand game plan

### Functionality

#### 1. Opponent Profile
```typescript
interface OpponentProfile {
  id: string;
  teamName: string;
  teamLogo?: string;
  conference?: string;
  
  // Record
  record: { wins: number; losses: number; ties: number };
  lastMeetingResult?: string;
  headToHeadRecord?: { wins: number; losses: number };
  
  // Coaching staff
  headCoach?: string;
  offensiveStyle?: string;  // "Pass-heavy", "Balanced", "QB-run focused"
  defensiveStyle?: string;  // "Man coverage", "Zone", "Aggressive blitz"
  
  // Key players to watch
  keyPlayers: OpponentPlayer[];
  
  // Game history we've scouted
  scoutedGames: ScoutedGame[];
  
  // Notes
  generalNotes: string;
  lastUpdated: Date;
  updatedBy: string;
}

interface OpponentPlayer {
  name: string;
  number: string;
  position: string;
  notes: string;
  threatLevel: 'high' | 'medium' | 'low';
  tendencies: string[];
  // e.g., ["Always goes left on scrambles", "Favorite target in red zone"]
}
```

#### 2. Tendency Tracking
```typescript
interface TeamTendencies {
  opponentId: string;
  
  offensive: {
    formationFrequency: { formation: string; percentage: number }[];
    playTypeDistribution: {
      quickPass: number;
      deepPass: number;
      qbRun: number;
      screen: number;
    };
    redZoneTendencies: string[];
    thirdDownTendencies: string[];
    favoriteTargets: { player: string; targetShare: number }[];
  };
  
  defensive: {
    coverageFrequency: { coverage: string; percentage: number }[];
    blitzRate: number;
    blitzTendencies: string[];
    weaknesses: string[];
  };
  
  specialSituations: {
    twoPointPlays: string[];
    hurryUpOffense: string[];
    endOfHalfStrategy: string[];
  };
}
```

#### 3. Scouting Report Document
```typescript
interface ScoutingReport {
  id: string;
  opponentId: string;
  gameDate: Date;
  createdBy: string;
  
  // Summary
  executiveSummary: string;  // 2-3 paragraph overview
  
  // Detailed sections
  offensiveBreakdown: {
    overview: string;
    formations: FormationAnalysis[];
    keyPlays: PlayAnalysis[];
    qbAnalysis: string;
    receiverAnalysis: string;
  };
  
  defensiveBreakdown: {
    overview: string;
    coverages: CoverageAnalysis[];
    blitzPackages: string[];
    rushAnalysis: string;
  };
  
  // Game plan
  offensiveGamePlan: {
    attackPoints: string[];  // Where to attack
    playsToRun: string[];    // Specific plays from playbook
    avoidAreas: string[];    // What not to do
  };
  
  defensiveGamePlan: {
    coverageAdjustments: string[];
    blitzPlan: string[];
    playerMatchups: { ourPlayer: string; theirPlayer: string; notes: string }[];
  };
  
  // Linked resources
  linkedFilmSessions: string[];  // Film room session IDs
  chatDiscussionId?: string;     // Team chat thread for questions
  
  // Distribution
  sharedWith: 'team' | 'coaches_only';
  requiredReading: boolean;
  readBy: string[];
}
```

#### 4. Integration with Team Chat
```typescript
// Share scouting report to team chat
async function shareScoutingReport(reportId: string): Promise<void> {
  const report = await getScoutingReport(reportId);
  
  // Create announcement in team chat
  await chatService.postAnnouncement({
    channel: 'announcements',
    title: `🏈 Scouting Report: ${report.opponentName}`,
    content: report.executiveSummary,
    linkedContent: {
      type: 'scouting_report',
      reportId: reportId
    },
    requiresRead: report.requiredReading,
    readByTracking: true
  });
  
  // Create discussion thread
  const thread = await chatService.createThread({
    channel: 'game-prep',
    title: `Questions: ${report.opponentName} Scout`,
    linkedContent: { type: 'scouting_report', reportId }
  });
  
  report.chatDiscussionId = thread.id;
}
```

---

## 45. Practice Planning / Play Designer

### Purpose
**Practice Planning** allows coaches to create structured practice scripts, design plays visually, and organize drills - exportable to PDF for field use.

### Who Uses It
- **Coaches**: Design practices, create plays visually, manage drill library
- **Assistant Coaches**: View practice plan, run assigned stations

### Functionality

#### 1. Practice Script Builder
```typescript
interface PracticeScript {
  id: string;
  date: Date;
  title: string;  // "Tuesday Practice - Red Zone Focus"
  duration: number;  // Total minutes
  
  // Practice structure
  periods: PracticePeriod[];
  
  // Focus areas
  emphasis: string[];  // ["Red zone offense", "2-point conversions"]
  installNotes: string;  // What's being installed this week
  
  // Logistics
  location: string;
  equipmentNeeded: string[];
  
  // Staff assignments
  staffAssignments: { coach: string; station: string }[];
  
  createdBy: string;
  createdAt: Date;
}

interface PracticePeriod {
  periodNumber: number;
  name: string;  // "Team Red Zone"
  duration: number;  // minutes
  startTime: string;  // "4:15 PM"
  
  type: 'warm_up' | 'individual' | 'group' | 'team' | 'special_teams' | 'conditioning';
  
  // What's being done
  description: string;
  drills?: Drill[];
  plays?: string[];  // Play IDs from playbook to run
  
  // Field location
  fieldArea?: 'full_field' | 'red_zone' | 'end_zone' | 'sideline';
  
  // Personnel
  offensivePersonnel?: string;  // "1st team offense"
  defensivePersonnel?: string;
  
  notes: string;
}
```

#### 2. Visual Play Designer
```typescript
interface PlayDesigner {
  // Canvas settings
  fieldView: 'full' | 'half' | 'red_zone' | 'goal_line';
  formation: string;
  
  // Player positions
  players: {
    position: string;
    x: number;
    y: number;
    label: string;
  }[];
  
  // Routes and movements
  routes: {
    playerId: string;
    type: 'route' | 'block' | 'motion';
    path: { x: number; y: number }[];
    style: 'solid' | 'dashed' | 'wavy';
    color: string;
    endMarker?: 'arrow' | 'circle' | 'square';
  }[];
  
  // Defensive look (optional)
  defense?: {
    coverage: string;
    players: { position: string; x: number; y: number }[];
  };
  
  // Labels and annotations
  annotations: {
    type: 'text' | 'arrow' | 'circle' | 'highlight';
    content: string;
    position: { x: number; y: number };
  }[];
}

// Export functions
function exportPlayAsSVG(play: PlayDesigner): string;
function exportPlayAsPNG(play: PlayDesigner): Blob;
function exportPlaybookAsPDF(plays: PlayDesigner[]): Blob;
```

#### 3. Drill Library
```typescript
interface Drill {
  id: string;
  name: string;
  category: 'warm_up' | 'position_specific' | 'team' | 'conditioning';
  positions: string[];  // Which positions this is for
  
  description: string;
  setup: string;
  execution: string[];  // Step by step
  coachingPoints: string[];
  commonErrors: string[];
  
  duration: number;  // Typical duration in minutes
  playersNeeded: number;
  equipmentNeeded: string[];
  
  // Visual
  diagramUrl?: string;
  videoUrl?: string;
  
  // Usage
  usageCount: number;  // How often this drill is used
  lastUsed?: Date;
}
```

#### 4. PDF Export for Field Use
```typescript
interface PracticePDF {
  generate(script: PracticeScript): Promise<Blob> {
    return generatePDF({
      header: {
        teamLogo: true,
        date: script.date,
        title: script.title,
        duration: script.duration
      },
      
      sections: [
        // Overview page
        {
          type: 'overview',
          emphasis: script.emphasis,
          installNotes: script.installNotes,
          staffAssignments: script.staffAssignments
        },
        
        // Period-by-period breakdown
        ...script.periods.map(period => ({
          type: 'period',
          periodNumber: period.periodNumber,
          time: `${period.startTime} (${period.duration} min)`,
          name: period.name,
          description: period.description,
          plays: period.plays,  // Include play diagrams
          notes: period.notes
        })),
        
        // Play diagrams appendix
        {
          type: 'play_diagrams',
          plays: getAllPlaysFromScript(script)
        }
      ],
      
      footer: {
        pageNumbers: true,
        confidential: true
      }
    });
  }
}
```

---

## 46. Team Calendar & RSVP

### Purpose
**Team Calendar** centralizes all team events with RSVP functionality for logistics planning, conflict detection, and attendance confirmation.

### Who Uses It
- **Coaches**: Create events, view RSVPs, manage logistics
- **Players**: View schedule, RSVP to events, sync with personal calendar
- **Team Managers**: Coordinate logistics based on RSVP counts

### Functionality

#### 1. Event Types
```typescript
type EventType = 
  | 'practice'
  | 'game'
  | 'tournament'
  | 'team_meeting'
  | 'film_session'
  | 'team_event'      // Team dinner, bonding, etc.
  | 'travel'
  | 'fundraiser'
  | 'tryout';

interface TeamEvent {
  id: string;
  title: string;
  type: EventType;
  
  // Timing
  startDateTime: Date;
  endDateTime: Date;
  allDay: boolean;
  timezone: string;
  
  // Location
  location: {
    name: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
    mapUrl?: string;
    fieldNumber?: string;  // "Field 3"
  };
  
  // Details
  description: string;
  agenda?: string;
  whatToBring?: string[];
  uniform?: string;  // "Home jersey" or "Practice gear"
  
  // For games/tournaments
  opponent?: string;
  gameType?: 'league' | 'tournament' | 'scrimmage' | 'friendly';
  
  // RSVP settings
  rsvpRequired: boolean;
  rsvpDeadline?: Date;
  maxAttendees?: number;
  guestsAllowed: boolean;
  maxGuestsPerPerson?: number;
  
  // Recurrence
  recurring: boolean;
  recurrenceRule?: string;  // RRULE format
  
  // Notifications
  reminderTimes: number[];  // Hours before event [24, 2]
  
  createdBy: string;
  createdAt: Date;
}
```

#### 2. RSVP System
```typescript
interface EventRSVP {
  eventId: string;
  playerId: string;
  
  response: 'yes' | 'no' | 'maybe' | 'pending';
  respondedAt: Date;
  
  // Guest info (for social events, tournaments)
  bringingGuests: boolean;
  guestCount: number;
  guestNames?: string[];
  
  // Logistics
  needsRide: boolean;
  canGiveRides: boolean;
  seatsAvailable?: number;
  
  // Arrival
  estimatedArrivalTime?: string;
  arrivingFrom?: string;
  
  notes?: string;  // "Will be 10 min late"
}

interface RSVPSummary {
  eventId: string;
  totalInvited: number;
  
  responses: {
    yes: number;
    no: number;
    maybe: number;
    pending: number;
  };
  
  responseRate: number;  // percentage who responded
  
  // For logistics
  totalAttending: number;  // yes + guests
  guestCount: number;
  needRides: number;
  availableSeats: number;
  
  // Who hasn't responded
  pendingResponses: { playerId: string; name: string; lastReminder?: Date }[];
}
```

#### 3. Logistics Planning
```typescript
interface EventLogistics {
  eventId: string;
  
  // Transportation
  transportation: {
    carpoolGroups: {
      driver: string;
      passengers: string[];
      departureTime: string;
      departureLocation: string;
      vehicleCapacity: number;
    }[];
    needsArrangement: string[];  // Players still needing rides
  };
  
  // Accommodation (for tournaments)
  accommodation?: {
    hotelName: string;
    address: string;
    checkIn: Date;
    checkOut: Date;
    roomAssignments: { room: string; players: string[] }[];
    bookingReference?: string;
  };
  
  // Costs (links to financial tracking)
  estimatedCosts?: {
    perPlayer: number;
    perGuest: number;
    breakdown: { item: string; cost: number }[];
  };
  
  // Equipment
  equipmentList: { item: string; responsible: string; packed: boolean }[];
  
  // Contacts
  emergencyContact: string;
  venueContact?: string;
}
```

#### 4. Calendar Integration
```typescript
// Sync with external calendars
interface CalendarSync {
  exportToICS(events: TeamEvent[]): string;  // iCal format
  
  generateGoogleCalendarLink(event: TeamEvent): string;
  generateOutlookLink(event: TeamEvent): string;
  generateAppleCalendarLink(event: TeamEvent): string;
  
  // Subscribe link for ongoing sync
  getSubscriptionUrl(teamId: string, playerId: string): string;
  // Returns: webcal://app.flagfit.com/calendar/team123/player456.ics
}
```

### Business Logic

#### RSVP Reminders
```typescript
async function sendRSVPReminders(eventId: string): Promise<void> {
  const event = await getEvent(eventId);
  const summary = await getRSVPSummary(eventId);
  
  // Only remind those who haven't responded
  for (const pending of summary.pendingResponses) {
    const hoursUntilEvent = getHoursUntil(event.startDateTime);
    const hoursUntilDeadline = getHoursUntil(event.rsvpDeadline);
    
    // Don't spam - check last reminder
    if (pending.lastReminder && hoursSince(pending.lastReminder) < 24) {
      continue;
    }
    
    await sendNotification(pending.playerId, {
      type: 'rsvp_reminder',
      title: `RSVP needed: ${event.title}`,
      message: `Please respond by ${formatDate(event.rsvpDeadline)}`,
      action: { type: 'open_event', eventId }
    });
  }
}
```

#### Conflict Detection
```typescript
function detectConflicts(newEvent: TeamEvent, existingEvents: TeamEvent[]): Conflict[] {
  const conflicts: Conflict[] = [];
  
  for (const existing of existingEvents) {
    if (eventsOverlap(newEvent, existing)) {
      conflicts.push({
        type: 'time_overlap',
        existingEvent: existing,
        message: `Conflicts with "${existing.title}" at ${formatTime(existing.startDateTime)}`
      });
    }
    
    // Check travel time between events
    if (eventsSameDay(newEvent, existing) && !eventsOverlap(newEvent, existing)) {
      const travelTime = estimateTravelTime(existing.location, newEvent.location);
      const gapMinutes = getGapMinutes(existing, newEvent);
      
      if (travelTime > gapMinutes) {
        conflicts.push({
          type: 'travel_time',
          existingEvent: existing,
          message: `Only ${gapMinutes} min between events but ${travelTime} min travel needed`
        });
      }
    }
  }
  
  return conflicts;
}
```

---

## 47. Financial / Payment Tracking

### Purpose
**Financial Tracking** manages team dues, tournament costs, equipment fees, and travel expenses - with tracking for who has paid, payment reminders, and cost splitting for partners/guests.

### Who Uses It
- **Team Managers/Treasurers**: Track payments, send reminders, manage budgets
- **Coaches**: View payment status, approve expenses
- **Players**: View their balance, make payments, split costs with guests

### Functionality

#### 1. Fee Types
```typescript
type FeeType = 
  | 'team_dues'         // Regular season dues
  | 'tournament_fee'    // Tournament registration
  | 'equipment'         // Jersey, gear
  | 'travel'            // Hotel, flights
  | 'team_event'        // Team dinner, activities
  | 'fundraiser'        // Fundraiser contribution
  | 'other';

interface Fee {
  id: string;
  type: FeeType;
  name: string;  // "Summer Nationals 2026 - Tournament Fee"
  description: string;
  
  // Amount
  amount: number;
  currency: string;
  
  // Who owes
  appliesTo: 'all_players' | 'attending_only' | 'specific_players';
  specificPlayerIds?: string[];
  
  // Guest pricing (for tournaments with partners)
  guestFee?: number;  // Additional per guest
  guestFeeDescription?: string;
  
  // Timing
  dueDate: Date;
  lateFeeAmount?: number;
  lateFeeStartDate?: Date;
  
  // Payment options
  paymentMethods: ('cash' | 'check' | 'venmo' | 'paypal' | 'bank_transfer')[];
  paymentInstructions?: string;
  
  // Linked event
  linkedEventId?: string;
  
  createdBy: string;
  createdAt: Date;
}
```

#### 2. Player Balance & Payments
```typescript
interface PlayerBalance {
  playerId: string;
  
  // Current status
  totalOwed: number;
  totalPaid: number;
  currentBalance: number;  // Positive = owes money, Negative = credit
  
  // Breakdown
  fees: {
    feeId: string;
    feeName: string;
    amount: number;
    guestAmount: number;  // If bringing guests
    totalDue: number;
    amountPaid: number;
    remainingBalance: number;
    dueDate: Date;
    status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  }[];
  
  // Payment history
  payments: Payment[];
}

interface Payment {
  id: string;
  playerId: string;
  feeId?: string;  // If payment for specific fee
  
  amount: number;
  method: string;
  reference?: string;  // Check number, Venmo ID, etc.
  
  // For cash/check - who received it
  receivedBy?: string;
  receivedDate: Date;
  
  notes?: string;
  
  // Guest payments
  forGuests: boolean;
  guestNames?: string[];
  
  recordedBy: string;
  recordedAt: Date;
}
```

#### 3. Tournament Cost Splitting
```typescript
interface TournamentCostBreakdown {
  tournamentId: string;
  
  // Total costs
  totalCost: number;
  breakdown: {
    category: string;  // "Hotel", "Registration", "Meals"
    amount: number;
    notes: string;
  }[];
  
  // Per-person calculation
  attendingPlayers: number;
  totalGuests: number;
  
  costPerPlayer: number;
  costPerGuest: number;
  
  // Individual breakdowns
  playerCosts: {
    playerId: string;
    playerName: string;
    baseCost: number;
    guestCount: number;
    guestCost: number;
    totalCost: number;
    amountPaid: number;
    balance: number;
  }[];
}

// Calculate tournament costs
function calculateTournamentCosts(
  tournament: Tournament,
  rsvps: EventRSVP[],
  totalExpenses: number
): TournamentCostBreakdown {
  const attendingPlayers = rsvps.filter(r => r.response === 'yes').length;
  const totalGuests = rsvps.reduce((sum, r) => sum + (r.guestCount || 0), 0);
  
  // Players pay more, guests pay less (players subsidize shared costs)
  const playerShare = 0.7;  // Players cover 70% of costs
  const guestShare = 0.3;   // Guests cover 30%
  
  const playerPool = totalExpenses * playerShare;
  const guestPool = totalExpenses * guestShare;
  
  const costPerPlayer = playerPool / attendingPlayers;
  const costPerGuest = totalGuests > 0 ? guestPool / totalGuests : 0;
  
  return {
    tournamentId: tournament.id,
    totalCost: totalExpenses,
    attendingPlayers,
    totalGuests,
    costPerPlayer: Math.round(costPerPlayer * 100) / 100,
    costPerGuest: Math.round(costPerGuest * 100) / 100,
    // ...
  };
}
```

#### 4. Payment Reminders
```typescript
async function sendPaymentReminders(): Promise<void> {
  const overdueFees = await getOverdueFees();
  const upcomingFees = await getFeesWithinDays(7);
  
  // Overdue reminders
  for (const fee of overdueFees) {
    const playersOwing = await getPlayersOwing(fee.id);
    
    for (const player of playersOwing) {
      await sendNotification(player.playerId, {
        type: 'payment_overdue',
        title: `Payment Overdue: ${fee.name}`,
        message: `$${player.remainingBalance} was due on ${formatDate(fee.dueDate)}`,
        priority: 'high'
      });
    }
  }
  
  // Upcoming due date reminders
  for (const fee of upcomingFees) {
    const playersOwing = await getPlayersOwing(fee.id);
    const daysUntilDue = getDaysUntil(fee.dueDate);
    
    for (const player of playersOwing) {
      await sendNotification(player.playerId, {
        type: 'payment_reminder',
        title: `Payment Due Soon: ${fee.name}`,
        message: `$${player.remainingBalance} due in ${daysUntilDue} days`,
        priority: 'normal'
      });
    }
  }
}
```

---

## 48. Weather Integration

### Purpose
**Weather Integration** provides real-time weather data for practice/game locations including heat index warnings, lightning detection, and automatic alerts for dangerous conditions.

### Who Uses It
- **Coaches**: Check conditions before practice, receive safety alerts
- **Players**: Know what to expect, hydration recommendations
- **Team Managers**: Make weather-based schedule decisions

### Functionality

#### 1. Weather Dashboard
```typescript
interface WeatherData {
  location: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
  
  current: {
    temperature: number;  // Celsius
    feelsLike: number;
    humidity: number;     // percentage
    windSpeed: number;    // km/h
    windDirection: string;
    uvIndex: number;
    conditions: string;   // "Sunny", "Cloudy", "Rain"
    icon: string;
  };
  
  // Calculated safety metrics
  heatIndex: number;
  wetBulbGlobeTemp?: number;  // WBGT for athletic safety
  
  // Alerts
  activeAlerts: WeatherAlert[];
  
  // Forecast
  hourlyForecast: HourlyForecast[];
  dailyForecast: DailyForecast[];
}

interface WeatherAlert {
  type: 'heat' | 'lightning' | 'severe_storm' | 'rain' | 'wind' | 'air_quality';
  severity: 'watch' | 'warning' | 'emergency';
  title: string;
  description: string;
  recommendations: string[];
  expiresAt?: Date;
}
```

#### 2. Heat Safety System
```typescript
// Based on OSHA and athletic organization guidelines
interface HeatSafetyAssessment {
  heatIndex: number;
  wbgt?: number;
  
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high' | 'extreme';
  
  activityGuidelines: {
    fullPracticeAllowed: boolean;
    maxDuration?: number;  // minutes
    requiredBreaks: { every: number; duration: number };  // e.g., every 20 min, 5 min break
    helmetsPadsRestriction?: string;  // "Helmets off" or "No pads"
  };
  
  hydrationGuidelines: {
    fluidIntakePerHour: number;  // ml
    electrolyteRecommended: boolean;
    preActivityHydration: string;
  };
  
  warningFlags: string[];  // ["Monitor players closely", "Have ice towels ready"]
  
  recommendation: string;
}

const HEAT_INDEX_GUIDELINES = {
  low: { max: 26.7, color: 'green', message: 'Normal activity' },
  moderate: { max: 32.2, color: 'yellow', message: 'Use caution - increase rest breaks' },
  high: { max: 39.4, color: 'orange', message: 'Reduce intensity and duration' },
  veryHigh: { max: 46.1, color: 'red', message: 'Limit outdoor activity' },
  extreme: { max: Infinity, color: 'purple', message: 'Cancel outdoor activity' }
};

function assessHeatSafety(weather: WeatherData): HeatSafetyAssessment {
  const heatIndex = weather.heatIndex;
  
  if (heatIndex >= 46.1) {
    return {
      heatIndex,
      riskLevel: 'extreme',
      activityGuidelines: {
        fullPracticeAllowed: false,
        maxDuration: 0
      },
      recommendation: '🚫 CANCEL outdoor practice. Heat index is dangerous.'
    };
  }
  
  if (heatIndex >= 39.4) {
    return {
      heatIndex,
      riskLevel: 'very_high',
      activityGuidelines: {
        fullPracticeAllowed: false,
        maxDuration: 30,
        requiredBreaks: { every: 10, duration: 5 }
      },
      hydrationGuidelines: {
        fluidIntakePerHour: 1000,
        electrolyteRecommended: true
      },
      recommendation: '⚠️ Significantly reduce practice. Max 30 minutes with frequent breaks.'
    };
  }
  
  // ... more conditions
}
```

#### 3. Lightning Detection
```typescript
interface LightningStatus {
  detected: boolean;
  distance?: number;  // km
  lastStrikeTime?: Date;
  movingToward: boolean;
  
  status: 'clear' | 'monitor' | 'suspend' | 'dangerous';
  
  // 30-30 Rule: If thunder within 30 seconds of lightning, seek shelter
  // Wait 30 minutes after last lightning before resuming
  shelterRequired: boolean;
  resumeActivityAt?: Date;  // 30 min after last strike
  
  recommendation: string;
}

const LIGHTNING_PROTOCOL = {
  // Distance in km where we take action
  monitorDistance: 16,   // Start monitoring
  suspendDistance: 10,   // Suspend activity
  dangerDistance: 5,     // Immediate shelter
  
  // Resume protocol
  waitTimeMinutes: 30,   // After last detected lightning
  
  recommendations: {
    clear: 'No lightning detected. Safe for outdoor activity.',
    monitor: 'Lightning detected within 10 miles. Monitor conditions.',
    suspend: 'Lightning within 6 miles. Move to shelter immediately.',
    dangerous: 'Lightning very close! Seek shelter NOW. Avoid open fields.'
  }
};

async function monitorLightning(location: Coordinates): Promise<LightningStatus> {
  const lightningData = await fetchLightningData(location);
  
  if (!lightningData.detected) {
    return { detected: false, status: 'clear', shelterRequired: false };
  }
  
  const distance = lightningData.nearestStrikeDistance;
  
  if (distance <= LIGHTNING_PROTOCOL.dangerDistance) {
    return {
      detected: true,
      distance,
      status: 'dangerous',
      shelterRequired: true,
      resumeActivityAt: addMinutes(new Date(), 30),
      recommendation: LIGHTNING_PROTOCOL.recommendations.dangerous
    };
  }
  
  // ... more conditions
}
```

#### 4. Automatic Practice Alerts
```typescript
async function checkWeatherForUpcomingEvents(): Promise<void> {
  const upcomingEvents = await getEventsWithinHours(48);
  
  for (const event of upcomingEvents) {
    if (!event.location?.coordinates) continue;
    
    const weather = await getWeatherForecast(event.location.coordinates, event.startDateTime);
    const heatAssessment = assessHeatSafety(weather);
    const lightningStatus = await getLightningForecast(event.location.coordinates, event.startDateTime);
    
    // Send alerts for concerning conditions
    if (heatAssessment.riskLevel === 'very_high' || heatAssessment.riskLevel === 'extreme') {
      await sendCoachAlert({
        type: 'weather_heat',
        eventId: event.id,
        title: `🌡️ Heat Warning: ${event.title}`,
        message: `Heat index expected to be ${weather.heatIndex}°C. ${heatAssessment.recommendation}`,
        severity: 'high',
        actions: [
          { label: 'Reschedule', action: 'reschedule_event' },
          { label: 'Move Indoors', action: 'update_location' },
          { label: 'Acknowledge', action: 'dismiss' }
        ]
      });
    }
    
    if (weather.activeAlerts.some(a => a.type === 'severe_storm')) {
      await sendTeamAlert({
        type: 'weather_storm',
        eventId: event.id,
        title: `⛈️ Severe Weather Alert: ${event.title}`,
        message: `Severe weather expected. Practice may be cancelled or moved.`,
        severity: 'high'
      });
    }
    
    // Rain probability
    if (weather.precipitationProbability > 70) {
      await sendCoachAlert({
        type: 'weather_rain',
        eventId: event.id,
        title: `🌧️ Rain Expected: ${event.title}`,
        message: `${weather.precipitationProbability}% chance of rain. Consider backup plans.`,
        severity: 'medium'
      });
    }
  }
}
```

#### 5. Practice Time Recommendations
```typescript
interface OptimalPracticeTime {
  date: Date;
  recommendedTimes: {
    time: string;
    score: number;  // 0-100, higher is better
    temperature: number;
    humidity: number;
    uvIndex: number;
    conditions: string;
    warnings: string[];
  }[];
  
  bestTimeSlot: string;
  avoidTimes: { time: string; reason: string }[];
}

function findOptimalPracticeTime(
  date: Date,
  hourlyForecast: HourlyForecast[],
  preferredDuration: number
): OptimalPracticeTime {
  const timeSlots = generateTimeSlots(date, 6, 21);  // 6 AM to 9 PM
  
  const recommendations = timeSlots.map(slot => {
    const forecast = getForecastForTime(hourlyForecast, slot);
    const heatAssessment = assessHeatSafety(forecast);
    
    let score = 100;
    const warnings: string[] = [];
    
    // Deduct for heat
    if (heatAssessment.riskLevel === 'moderate') { score -= 20; warnings.push('Warm'); }
    if (heatAssessment.riskLevel === 'high') { score -= 40; warnings.push('Hot'); }
    if (heatAssessment.riskLevel === 'very_high') { score -= 70; warnings.push('Very hot'); }
    if (heatAssessment.riskLevel === 'extreme') { score = 0; warnings.push('Dangerous heat'); }
    
    // Deduct for UV
    if (forecast.uvIndex > 7) { score -= 15; warnings.push('High UV'); }
    if (forecast.uvIndex > 10) { score -= 25; warnings.push('Extreme UV'); }
    
    // Deduct for rain
    if (forecast.precipProbability > 50) { score -= 30; warnings.push('Rain likely'); }
    
    return {
      time: formatTime(slot),
      score: Math.max(0, score),
      temperature: forecast.temperature,
      humidity: forecast.humidity,
      uvIndex: forecast.uvIndex,
      conditions: forecast.conditions,
      warnings
    };
  });
  
  return {
    date,
    recommendedTimes: recommendations.sort((a, b) => b.score - a.score),
    bestTimeSlot: recommendations[0].time,
    avoidTimes: recommendations
      .filter(r => r.score < 30)
      .map(r => ({ time: r.time, reason: r.warnings.join(', ') }))
  };
}
```

---

## 49. Exercise Library

### Purpose
**Exercise Library** (`/exercise-library`) provides a searchable database of evidence-based exercises with categorization, difficulty levels, and detailed instructions.

### Who Uses It
- **Players**: Browse and learn exercises
- **Coaches**: Build training programs, assign exercises

### Functionality

1. **Library Overview**
   - Total exercise count
   - Category count
   - Search and filter

2. **Categories**
   - Speed & Agility
   - Strength Training
   - Flexibility & Mobility
   - Recovery
   - Position-Specific
   - Conditioning

3. **Exercise Cards**
   - Exercise name
   - Category badge
   - Difficulty level (Beginner/Intermediate/Advanced)
   - Muscle groups targeted
   - Equipment needed

4. **Exercise Details**
   - Full description
   - Step-by-step instructions
   - Video demonstration (YouTube embed)
   - Sets/reps recommendations
   - Coaching cues
   - Common mistakes

5. **Filtering**
   - By category
   - By difficulty
   - By muscle group
   - By equipment
   - Full-text search

### Business Logic

#### Exercise Difficulty Assignment
```typescript
const DIFFICULTY_CRITERIA = {
  beginner: {
    description: 'Basic movement patterns, no equipment needed',
    prerequisiteExperience: '0-6 months'
  },
  intermediate: {
    description: 'Compound movements, some equipment',
    prerequisiteExperience: '6-18 months'
  },
  advanced: {
    description: 'Complex patterns, high load/intensity',
    prerequisiteExperience: '18+ months'
  }
};
```

---

## Appendix A: Data Models

### Key Database Tables

```sql
-- Wellness tracking
wellness_entries (
  id, athlete_id, date, sleep_hours, sleep_quality,
  energy, soreness, hydration, mood, stress, 
  motivation, readiness, resting_hr, notes
)

-- Training sessions
training_sessions (
  id, athlete_id, date, session_type, duration_minutes,
  rpe, load_au, notes, completed
)

-- ACWR calculations (materialized or computed)
acwr_metrics (
  athlete_id, date, acute_load, chronic_load, 
  acwr_ratio, risk_zone
)

-- Game day readiness
game_day_readiness (
  id, athlete_id, date, check_in_time,
  sleep_quality, energy_level, muscle_soreness,
  hydration_level, mental_focus, confidence_level,
  readiness_score, acwr_at_checkin, notes
)

-- Notifications
notifications (
  id, user_id, type, title, message, 
  read, priority, action_url, 
  created_at, updated_at
)

-- Achievements
achievements (
  id, name, description, icon, category,
  points, criteria_type, criteria_value
)

user_achievements (
  id, user_id, achievement_id, unlocked_at,
  progress_current, progress_target
)

-- Team events & attendance
team_events (
  id, team_id, event_type, title,
  start_time, end_time, location, notes
)

attendance_records (
  id, event_id, player_id, status,
  check_in_time, notes
)

-- Equipment inventory
equipment_items (
  id, team_id, item_type, name,
  quantity, condition, purchase_date,
  notes
)

equipment_assignments (
  id, item_id, player_id, assigned_date,
  returned_date, notes
)

-- Tournaments
tournaments (
  id, team_id, name, location,
  start_date, end_date, entry_fee,
  visibility, status
)

tournament_availability (
  id, tournament_id, player_id,
  status, payment_status, amount_paid, notes
)
```

---

## Appendix B: Calculation Formulas Summary

### Training & Load
| Formula | Description |
|---------|-------------|
| `Session Load = Duration × RPE × Type Multiplier` | Per-session training load in AU |
| `ACWR = Acute Load / Chronic Load` | Injury risk indicator |
| `Acute Load = 7-day rolling sum / 7` | Current fatigue |
| `Chronic Load = 28-day rolling sum / 28` | Fitness base |

### Wellness & Readiness
| Formula | Description |
|---------|-------------|
| `Wellness Score = Σ(metric × weight) / 10 × 100` | Overall wellness percentage |
| `Readiness Score = Weighted metrics - ACWR penalty` | Competition readiness |
| `Recovery Status = Based on wellness score brackets` | Recovery recommendation |

### Hydration & Nutrition
| Formula | Description |
|---------|-------------|
| `Daily Target = (Weight × 35ml) + (Games × 500ml) + adjustments` | Tournament hydration target |
| `Temperature Adj = (temp - 25) × 50ml` | Heat adjustment |
| `Humidity Adj = ×1.15 if humidity > 60%` | Humidity adjustment |

### Travel
| Formula | Description |
|---------|-------------|
| `Jet Lag Score = |TZ Diff| × Direction Multiplier` | Jet lag severity |
| `Recovery Days = TZ Diff × 0.5 (east) or 0.33 (west)` | Adaptation time |
| `Circulation Risk = Base + Duration + Mobility factors` | Car travel DVT risk |

---

## Appendix C: Role Permissions

| Feature | Player | Coach | Admin |
|---------|--------|-------|-------|
| View own dashboard | ✓ | ✓ | ✓ |
| View team dashboard | - | ✓ | ✓ |
| Log wellness | ✓ | ✓ | ✓ |
| Log training | ✓ | ✓ | ✓ |
| Create events | - | ✓ | ✓ |
| Manage roster | - | ✓ | ✓ |
| View player data | Own | All | All |
| Track game stats | - | ✓ | ✓ |
| AI Coach access | ✓ | ✓ | ✓ |
| System settings | - | - | ✓ |

---

## Appendix D: Notification Types

| Type | Description | Priority | Push? |
|------|-------------|----------|-------|
| `training` | Session reminders, completions | Medium | Yes |
| `wellness` | Check-in reminders | Medium | Yes |
| `achievement` | Badge unlocks | Low | No |
| `team` | Announcements, changes | Medium | Yes |
| `game` | Game day reminders | High | Yes |
| `tournament` | Registration, schedules | Medium | Yes |
| `injury_risk` | ACWR alerts | High | Yes |
| `weather` | Training weather | Low | No |
| `readiness_alert` | Low readiness (coach) | High | Yes |
| `menstrual_cycle` | Phase reminders, injury risk alerts | Medium | Optional |

---

## Appendix E: Menstrual Cycle Considerations for Female Athletes

### Overview

The menstrual cycle significantly impacts athletic performance, injury risk, recovery, and overall well-being. This appendix provides evidence-based guidance for female flag football athletes to optimize training and game day performance based on their cycle phase.

**Target Users:** Female athletes, coaches, parents, and sports medicine staff.

### Evidence-Based Research Summary

#### Performance Variations Across Phases

| Study | Year | Key Finding | Source |
|-------|------|-------------|--------|
| BMC Sports Science | 2024 | Performance metrics (back squat, jumping) vary across menstrual phases | [BMC Sports Sci Med Rehabil](https://bmcsportsscimedrehabil.biomedcentral.com/articles/10.1186/s13102-024-01010-4) |
| Sports Medicine Open | 2025 | Reaction times faster during ovulation, slower during luteal phase | [Sports Med Open](https://sportsmedicine-open.springeropen.com/articles/10.1186/s40798-025-00924-8) |
| Frontiers in Physiology | 2025 | Menstrual symptoms associated with impaired sleep and decreased recovery in elite basketball players | [Frontiers](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2025.1663657/abstract) |
| Acta Scientiae | 2025 | Hormonal fluctuations influence energy metabolism, neuromuscular control, thermoregulation, and recovery | [Acta Scientiae](https://www.actaint.com/index.php/pub/article/view/295) |

#### Injury Risk Research

| Study | Year | Key Finding | Source |
|-------|------|-------------|--------|
| UCL/Women's Super League | 2024 | Muscle injuries 6x more likely in late luteal phase (pre-menstruation) | [UCL News](https://www.ucl.ac.uk/news/2024/may/female-athletes-more-likely-get-injured-certain-points-their-menstrual-cycle) |
| Systematic Review | 2017 | Pre-ovulatory phase (days 9-14) associated with higher ACL injury risk | [PubMed](https://pubmed.ncbi.nlm.nih.gov/28717621/) |
| Relaxin Study | 2024 | Relaxin peaks during luteal phase (days 21-24), may compromise ligament integrity | [PubMed](https://pubmed.ncbi.nlm.nih.gov/38919370/) |

#### Support Gap in Elite Sports

- **Kitman Labs Global Study (2025):** 88% of practitioners acknowledge menstrual cycle affects performance, but only 15% of athletes receive support to mitigate impact.

---

### Phase-by-Phase Training & Game Day Recommendations

#### Phase 1: Menstrual Phase (Days 1-5)

**Hormonal Profile:** Estrogen and progesterone at lowest levels.

| Aspect | Recommendation |
|--------|----------------|
| **Training Intensity** | Low to moderate; prioritize recovery |
| **Recommended Activities** | Light cardio, yoga, mobility work, skill drills (non-contact) |
| **Avoid** | Max-effort sprints, high-impact plyometrics |
| **Game Day Strategy** | Focus on technique over intensity; stay warm; extended warm-up recommended |
| **Recovery Focus** | Sleep 8+ hours; gentle stretching; heat therapy for cramps |

**Nutrition Focus:**
- Anti-inflammatory foods (salmon, turmeric, ginger)
- Iron-rich foods (spinach, lentils, lean red meat)
- Hydration with electrolytes
- Avoid excessive caffeine and processed foods

**Flag Football Specific:**
- Shorter practice duration acceptable
- Focus on route running technique, not speed
- QB: Work on decision-making drills, not arm velocity

---

#### Phase 2: Follicular Phase (Days 6-14)

**Hormonal Profile:** Rising estrogen; peak energy and strength potential.

| Aspect | Recommendation |
|--------|----------------|
| **Training Intensity** | HIGH - optimal window for gains |
| **Recommended Activities** | Strength training, HIIT, sprint work, skill acquisition |
| **Ideal For** | Learning new plays, max-effort testing, competition |
| **Game Day Strategy** | Peak performance window; aggressive play calling appropriate |
| **Recovery Focus** | Standard protocols; body handles stress well |

**Nutrition Focus:**
- Complex carbohydrates for sustained energy
- Lean protein for muscle building (elevated anabolic response)
- Balanced meals; can handle higher caloric intake

**Flag Football Specific:**
- Schedule important games/tournaments if possible
- Ideal time for 40-yard dash testing, 1RM testing
- QB: High-velocity throwing sessions, deep ball work
- WR/DB: Explosive route running, aggressive cuts

---

#### Phase 3: Ovulation Phase (Around Day 14)

**Hormonal Profile:** Estrogen and LH peak; testosterone also elevated.

| Aspect | Recommendation |
|--------|----------------|
| **Training Intensity** | HIGH - but monitor joint stability |
| **Recommended Activities** | Strength, speed, power training |
| **⚠️ CAUTION** | Increased joint laxity = higher ACL/ligament injury risk |
| **Game Day Strategy** | High energy; include extra neuromuscular warm-up |
| **Recovery Focus** | Emphasis on proper form over max weight |

**Injury Prevention Protocol:**
- Extended dynamic warm-up (15+ minutes)
- Neuromuscular activation exercises before practice/games
- Focus on proper landing mechanics
- Consider reducing cutting drill volume on artificial surfaces

**Nutrition Focus:**
- Slightly higher caloric intake to match energy expenditure
- Protein timing important for recovery
- Stay well-hydrated (estrogen affects fluid retention)

**Flag Football Specific:**
- Great for agility drills WITH proper warm-up
- Emphasize controlled deceleration in route running
- Avoid cold starts - always fully warmed up before cuts

---

#### Phase 4: Luteal Phase (Days 15-28)

**Hormonal Profile:** Rising progesterone; elevated core body temperature; PMS symptoms may appear.

| Aspect | Recommendation |
|--------|----------------|
| **Training Intensity** | Moderate; listen to body signals |
| **Recommended Activities** | Endurance work, steady-state cardio, maintenance lifting |
| **Challenges** | Higher perceived exertion, mood fluctuations, fatigue |
| **Game Day Strategy** | Longer warm-up; mental preparation critical; manage expectations |
| **Recovery Focus** | Prioritize sleep; magnesium supplementation may help |

**Late Luteal (Days 21-28) - Highest Injury Risk Period:**
- UCL study showed 6x higher muscle injury risk
- Relaxin peaks days 21-24, compromising ligament stability
- Consider reducing training volume 20-30%
- Avoid introducing new high-risk movements

**Nutrition Focus:**
- Increase complex carbs (body burns more calories)
- Magnesium-rich foods (dark chocolate, nuts, bananas)
- Vitamin B6 for mood support
- Reduce sodium to minimize bloating
- Anti-inflammatory foods continue to be beneficial

**Flag Football Specific:**
- Reduce sprint volume; maintain technique work
- Extra rest between high-intensity drills
- Hydration critical (body runs hotter)
- Mental preparation for game day focus

---

### Game Day Protocol by Phase

| Phase | Warm-Up Duration | Intensity Potential | Key Considerations |
|-------|------------------|---------------------|-------------------|
| Menstrual | Standard (10-15 min) | 70-85% | Energy management; stay warm |
| Follicular | Standard (10-15 min) | 100% | Peak window; capitalize |
| Ovulation | Extended (15-20 min) | 95-100% | Joint stability focus |
| Early Luteal | Standard (10-15 min) | 85-95% | Higher RPE; pace yourself |
| Late Luteal | Extended (15-20 min) | 70-85% | Injury prevention priority |

---

### Tracking Integration

**Recommended Tracking Data Points:**
- Cycle day/phase
- Energy level (1-10)
- Sleep quality
- Pain/discomfort level
- Performance RPE
- Mood

**Integration with Existing Features:**
- Wellness Check-In: Add optional menstrual cycle questions
- ACWR Dashboard: Factor cycle phase into injury risk calculations
- Game Day Readiness: Include phase-based recommendations
- Recovery Dashboard: Adjust recovery targets by phase

---

### Communication Guidelines

**For Athletes:**
- Track your cycle for 2-3 months to identify personal patterns
- Communicate with coaches about high-symptom days
- Don't let cycle stop you - adapt and compete

**For Coaches:**
- Create open, supportive environment for discussion
- Never require disclosure; offer as optional resource
- Adjust practice plans when athletes report concerns
- Include cycle phase in injury prevention programs

**For Parents:**
- Support tracking conversations
- Help identify patterns in performance and mood
- Normalize discussion without pressure

---

### Quick Reference Card

| If You Feel... | Consider This Phase | Training Adjustment |
|----------------|--------------------|--------------------|
| Low energy, cramps | Menstrual (1-5) | Reduce intensity; prioritize recovery |
| High energy, strong | Follicular (6-14) | Push hard; ideal for gains |
| Peak energy, joints feel loose | Ovulation (~14) | Go hard WITH extra warm-up |
| Tired, moody, bloated | Luteal (15-28) | Moderate intensity; self-compassion |
| Very fatigued, sore | Late Luteal (21-28) | Reduce volume; injury prevention mode |

---

### References

1. BMC Sports Science, Medicine and Rehabilitation (2024). "Effect of menstrual cycle phases on physical performance and psychological state."
2. Sports Medicine - Open (2025). "Cognitive performance, mood, and symptoms across menstrual phases."
3. Frontiers in Physiology (2025). "Influence of menstrual cycle phases on sleep quality, recovery, and stress in elite female basketball players."
4. UCL/University College London (2024). "Female athletes more likely to get injured at certain points in their menstrual cycle."
5. PubMed Systematic Review (2017). "ACL injury risk in relation to menstrual cycle phase."
6. Kitman Labs Global Study (2025). "Systemic gaps in how elite sport manages menstrual health."
7. Frontiers in Sports and Active Living (2025). "Athlete perceptions of menstrual cycle-related symptoms."
8. Acta Scientiae et Intellectus (2025). "Training performance variations across menstrual cycle phases."

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.1 | Jan 2026 | Added Appendix E: Menstrual Cycle Considerations for Female Athletes (evidence-based research, phase-specific training recommendations, injury risk data) |
| 3.0 | Jan 2026 | Added Playbook Library, Film Room, Scouting Reports, Practice Planner, Team Calendar/RSVP, Financial Tracking, Weather Integration |
| 2.5 | Jan 2026 | Added Team Chat, Community Feed, Return-to-Play, Sleep Debt, Hydration, Superadmin documentation |
| 2.4 | Jan 2026 | Added Data Import/Export System, Knowledge Drop-In System documentation |
| 2.3 | Jan 2026 | Added Position-Specific Statistics, Nutritionist/Physio/Psychology Reports documentation |
| 2.2 | Jan 2026 | Added Body Composition, Supplement Tracker, Sprint Benchmarks, QB Hub, Position-Specific Training documentation |
| 2.1 | Jan 2026 | Added Global Search, Notifications, Achievements, full feature audit |
| 2.0 | Jan 2026 | Added Travel Recovery, Tournament Nutrition, complete ACWR system |
| 1.5 | Dec 2025 | Player Dashboard, Game Day Readiness |
| 1.0 | Nov 2025 | Initial release with core features |

---

## Quick Reference: Routes

| Route | Feature | Component |
|-------|---------|-----------|
| `/dashboard` | Dashboard Switcher | `DashboardComponent` |
| `/player-dashboard` | Player Dashboard | `PlayerDashboardComponent` |
| `/coach/dashboard` | Coach Dashboard | `CoachDashboardComponent` |
| `/training` | Training Schedule | `TrainingScheduleComponent` |
| `/today` | Today's Practice | `TodayComponent` |
| `/wellness` | Wellness & Recovery | `WellnessComponent` |
| `/acwr` | ACWR Dashboard | `AcwrDashboardComponent` |
| `/travel/recovery` | Travel Recovery | `TravelRecoveryComponent` |
| `/game/readiness` | Game Day Readiness | `GameDayReadinessComponent` |
| `/game/nutrition` | Tournament Nutrition | `TournamentNutritionComponent` |
| `/game-tracker` | Game Tracker | `GameTrackerComponent` |
| `/tournaments` | Tournaments | `TournamentsComponent` |
| `/roster` | Roster Management | `RosterComponent` |
| `/depth-chart` | Depth Chart | `DepthChartComponent` |
| `/attendance` | Attendance | `AttendanceComponent` |
| `/equipment` | Equipment | `EquipmentComponent` |
| `/officials` | Officials | `OfficialsComponent` |
| `/analytics` | Analytics | `AnalyticsComponent` |
| `/chat` | AI Coach | `ChatComponent` |
| `/profile` | User Profile | `ProfileComponent` |
| `/settings` | Settings | `SettingsComponent` |
| `/onboarding` | Onboarding | `OnboardingComponent` |
| `/exercise-library` | Exercise Library | `ExerciseLibraryComponent` |
| `/qb` | QB Hub | `QbHubComponent` |
| `/performance/body-composition` | Body Composition | `BodyCompositionCardComponent` |

---

*This documentation is maintained by the FlagFit Pro development team. For questions, contact the product team.*

**Document Statistics:**
- Total Features Documented: 49
- Core Features: 5 (#1-5)
- Competition Features: 5 (#6-10)
- Team Management: 5 (#11-15)
- Analytics & Intelligence: 2 (#16-17)
- User Experience: 3 (#18-20)
- Account & Settings: 3 (#21-23)
- Physical & Supplement Tracking: 3 (#24-26)
- Position-Specific Training: 3 (#27-29)
- Professional Reports & Integrations: 3 (#30-32)
- Data Exchange & Knowledge Sharing: 2 (#33-34)
- Communication & Community: 2 (#35-36)
- Recovery & Injury Management: 4 (#37-40) ← includes Menstrual Cycle Tracking
- Administration: 1 (#41)
- Playbook & Strategy: 4 (#42-45)
- Scheduling & Logistics: 3 (#46-48)
- Specialized Dashboards: 1 (#49)

- Female Athlete Support: 1 (Appendix E)

**Target Audience:** Athletes 16+ years old (male and female competitive flag football players)
