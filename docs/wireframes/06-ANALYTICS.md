# Wireframe: Analytics

**Route:** `/analytics`  
**Users:** Players/Athletes, Coaches  
**Status:** ✅ Implemented  
**Source:** `angular/src/app/features/analytics/analytics.component.ts`

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📊 FlagFit Pro Analytics                                                      │  │
│  │  Advanced Performance Analytics & Team Insights                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🎯 MY DEVELOPMENT GOALS (Coach Assigned)                          [View All →]│  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────┐  ┌──────────────────────────────┐           │  │
│  │  │ 🏃 40-Yard Dash              │  │ 💪 Pro Agility               │           │  │
│  │  │ ────────────────────────────│  │ ────────────────────────────│           │  │
│  │  │ Target: 4.45s by Feb 15     │  │ Target: 4.10s by Mar 1       │           │  │
│  │  │ Current: 4.52s              │  │ Current: 4.25s               │           │  │
│  │  │                              │  │                              │           │  │
│  │  │ ████████████████░░░░ 80%    │  │ ████████████░░░░░░░░ 60%    │           │  │
│  │  │                              │  │                              │           │  │
│  │  │ 📅 42 days remaining        │  │ 📅 56 days remaining        │           │  │
│  │  │ 📝 Coach: "Focus on start"  │  │ 📝 Coach: "Plant foot work" │           │  │
│  │  └──────────────────────────────┘  └──────────────────────────────┘           │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                          KEY METRICS OVERVIEW (4 CARDS)                         │ │
│  │                                                                                 │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  │ 📈 Training     │  │ 👥 Team Rank    │  │ ⚡ Top Speed    │  │ 📅 Training    ││
│  │  │    Load         │  │                 │  │                 │  │    Sessions    ││
│  │  │                 │  │                 │  │                 │  │                ││
│  │  │    850 AU       │  │    #3           │  │    4.46s        │  │    28          ││
│  │  │    ─────────    │  │    ─────────    │  │    ─────────    │  │    ─────────   ││
│  │  │  +12% vs week   │  │  ↑ 2 positions  │  │  -0.12s gain    │  │  +5 this week  ││
│  │  │  (positive)     │  │  (positive)     │  │  (positive)     │  │  (positive)    ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│  │                                                                                 │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ Load vs Performance                │  │ Skill Proficiency Radar               │  │
│  │ ──────────────────────────────────│  │ ──────────────────────────────────────│  │
│  │ Acute/Chronic Workload vs Wellness │  │ Comparative assessment across core    │  │
│  │                    [⟳] [⬇]        │  │ competencies                          │  │
│  │                                    │  │                                        │  │
│  │       ╱╲                           │  │          Speed                         │  │
│  │      ╱  ╲    ╱╲                    │  │            ╱╲                          │  │
│  │     ╱    ╲  ╱  ╲___               │  │    Agility/    \Strength               │  │
│  │    ╱      ╲╱        ╲             │  │          ╲    ╱                        │  │
│  │   ╱                    ╲           │  │    Power ─────── Endurance             │  │
│  │  W1  W2  W3  W4  W5  W6  W7        │  │           ╲╱                           │  │
│  │                                    │  │         Technique                      │  │
│  │  ┌────────────┐  ┌────────────┐   │  │                                        │  │
│  │  │ ACWR: 0.92 │  │ Zone:      │   │  │  [RADAR CHART - Skills comparison]     │  │
│  │  │            │  │ Optimal    │   │  │                                        │  │
│  │  └────────────┘  └────────────┘   │  │                                        │  │
│  └────────────────────────────────────┘  └────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ Training Mix                       │  │ Benchmark Comparison                   │  │
│  │ ──────────────────────────────────│  │ ──────────────────────────────────────│  │
│  │ Distribution over 30 days          │  │ Your metrics vs Olympic benchmarks     │  │
│  │                                    │  │                                        │  │
│  │         ╭─────────╮                │  │                                        │  │
│  │       ╱   Speed    ╲               │  │   You:      ████████░░  80%            │  │
│  │      │   35%        │              │  │   Target:   ██████████  100%           │  │
│  │       ╲─────────────╱              │  │                                        │  │
│  │        ╱ Strength ╲                │  │   You:      ██████░░░░  60%            │  │
│  │       │    25%     │               │  │   Target:   ██████████  100%           │  │
│  │        ╲──────────╱                │  │                                        │  │
│  │         ╱Recovery╲                 │  │   [BAR CHART - Metric comparisons]     │  │
│  │        │   20%    │                │  │                                        │  │
│  │         ╲────────╱                 │  │                                        │  │
│  │                                    │  │                                        │  │
│  │  [DOUGHNUT CHART - Session types]  │  │                                        │  │
│  └────────────────────────────────────┘  └────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Speed Development Progress                                                     │  │
│  │ ────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  Time Period: [Last 7 Weeks ▼]      Metrics: [40-Yard & 10-Yard ▼]            │  │
│  │                                                                                │  │
│  │       ╲                                                                        │  │
│  │        ╲    ╱╲                                                                 │  │
│  │         ╲  ╱  ╲___   ╱╲                                                        │  │
│  │          ╲╱        ╲╱  ╲_____                                                  │  │
│  │   Week 1   Week 2   Week 3   Week 4   Week 5   Week 6   Week 7                │  │
│  │                                                                                │  │
│  │  [LINE CHART - Speed progression over time]                                   │  │
│  │                                                                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │  │
│  │  │ Best 40-Yard │  │ Best 10-Yard │  │ Total        │  │ Olympic      │       │  │
│  │  │ ──────────── │  │ ──────────── │  │ Improvement  │  │ Target       │       │  │
│  │  │    4.46s     │  │    1.54s     │  │   -0.19s     │  │    4.40s     │       │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘       │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Player Statistics & Attendance                                                 │  │
│  │ ────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ┌─────────────────┬─────────────────┬─────────────────┐                      │  │
│  │  │ Per Game Stats  │ Season Stats    │ Multi-Season    │                      │  │
│  │  └─────────────────┴─────────────────┴─────────────────┘                      │  │
│  │                                                                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                         │  │
│  │  │ Games Played │  │ Games Missed │  │ Attendance % │                         │  │
│  │  │     12       │  │      2       │  │    85.7%     │                         │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                         │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ Date     │ Opponent │ Status  │ Pass │ Comp │ Pass │ Rush │ Rush │ Flag │  │  │
│  │  │          │          │         │ Att  │      │ Yds  │ Att  │ Yds  │ Pulls│  │  │
│  │  │──────────│──────────│─────────│──────│──────│──────│──────│──────│──────│  │  │
│  │  │ 12/15    │ Eagles   │ Present │  15  │  10  │  120 │   3  │  25  │   4  │  │  │
│  │  │ 12/08    │ Hawks    │ Present │  12  │   8  │   95 │   5  │  35  │   2  │  │  │
│  │  │ 12/01    │ Lions    │ Missed  │  --  │  --  │   -- │  --  │  --  │  --  │  │  │
│  │  │ 11/24    │ Bears    │ Present │  18  │  12  │  145 │   2  │  15  │   5  │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │  Page 1 of 2                                                    [< 1 2 >]     │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Page Header ✅

| Element                       | Status | Notes                                            |
| ----------------------------- | ------ | ------------------------------------------------ |
| Title "FlagFit Pro Analytics" | ✅     | With chart-bar icon                              |
| Subtitle                      | ✅     | "Advanced Performance Analytics & Team Insights" |

---

### 1.5. My Development Goals (NEW) ⚠️

| Element              | Status                  | Notes                                   |
| -------------------- | ----------------------- | --------------------------------------- |
| Section title        | ⚠️ Needs Implementation | "MY DEVELOPMENT GOALS (Coach Assigned)" |
| View All link        | ⚠️ Needs Implementation | Links to full goals page                |
| Goal cards (max 2-3) | ⚠️ Needs Implementation | Horizontal scroll on mobile             |
| Goal metric name     | ⚠️ Needs Implementation | e.g., "40-Yard Dash"                    |
| Target value         | ⚠️ Needs Implementation | "4.45s by Feb 15"                       |
| Current value        | ⚠️ Needs Implementation | "4.52s"                                 |
| Progress bar         | ⚠️ Needs Implementation | Visual % toward goal                    |
| Days remaining       | ⚠️ Needs Implementation | "42 days remaining"                     |
| Coach note           | ⚠️ Needs Implementation | Coach's guidance                        |
| Empty state          | ⚠️ Needs Implementation | "No goals assigned yet"                 |

**Business Logic:**

```typescript
interface DevelopmentGoal {
  id: string;
  playerId: string;
  metricType: "speed" | "agility" | "strength" | "power" | "skill";
  metricName: string; // "40-Yard Dash"
  targetValue: number; // 4.45
  targetUnit: string; // "s"
  currentValue: number; // 4.52
  deadline: Date; // Feb 15, 2026
  coachNote: string; // "Focus on start drill"
  createdBy: string; // Coach ID
  status: "active" | "achieved" | "missed";
}

// Progress calculation
function calculateProgress(goal: DevelopmentGoal): number {
  const startValue = goal.startValue || goal.currentValue * 1.1; // 10% worse
  const improvement = startValue - goal.currentValue;
  const totalNeeded = startValue - goal.targetValue;
  return Math.min(100, Math.round((improvement / totalNeeded) * 100));
}
```

**Data Source:**
| Data | Service | Table |
|------|---------|-------|
| Goals | `DevelopmentService` | `player_development_goals` |

---

### 2. Key Metrics Overview (4 Cards) ✅

| Metric            | Icon          | Value Example  | Trend           | Status |
| ----------------- | ------------- | -------------- | --------------- | ------ |
| Training Load     | 📈 chart-line | AU value       | vs week         | ✅     |
| Team Rank         | 👥 users      | Position #     | Position change | ✅     |
| Top Speed         | ⚡ bolt       | Time (seconds) | Improvement     | ✅     |
| Training Sessions | 📅 calendar   | Count          | This week       | ✅     |

**Trend Types:**

- `positive` - Green text
- `negative` - Red text
- `neutral` - Gray text

---

### 3. Charts Grid (4 Charts) ✅

#### Load vs Performance (Line Chart)

| Element             | Status | Notes                                           |
| ------------------- | ------ | ----------------------------------------------- |
| Title + subtitle    | ✅     | "Acute/Chronic Workload vs Subjective Wellness" |
| Reset zoom button   | ✅     | `⟳` icon                                        |
| Export button       | ✅     | `⬇` icon - Downloads PNG                        |
| Line chart          | ✅     | 7-week trend                                    |
| ACWR insight        | ✅     | Current value                                   |
| Safety zone insight | ✅     | Risk zone label                                 |
| Empty state         | ✅     | With CTA to log training                        |

#### Skill Proficiency Radar

| Element          | Status | Notes                                             |
| ---------------- | ------ | ------------------------------------------------- |
| Title + subtitle | ✅     | "Comparative assessment across core competencies" |
| Radar chart      | ✅     | Multi-axis skill comparison                       |
| Empty state      | ✅     | "Coming Soon" message                             |

#### Training Mix (Doughnut Chart)

| Element          | Status | Notes                                      |
| ---------------- | ------ | ------------------------------------------ |
| Title + subtitle | ✅     | "Distribution of focus areas over 30 days" |
| Doughnut chart   | ✅     | Session type distribution                  |
| Dynamic colors   | ✅     | Color-coded segments                       |
| Empty state      | ✅     | "Coming Soon" message                      |

#### Benchmark Comparison (Bar Chart)

| Element          | Status | Notes                                         |
| ---------------- | ------ | --------------------------------------------- |
| Title + subtitle | ✅     | "Your metrics vs Olympic standard benchmarks" |
| Bar chart        | ✅     | Horizontal comparison bars                    |
| Empty state      | ✅     | "Coming Soon" message                         |

---

### 4. Speed Development Progress (Full Width) ✅

| Element                    | Status | Notes                                     |
| -------------------------- | ------ | ----------------------------------------- |
| Title                      | ✅     | "Speed Development Progress"              |
| Time period selector       | ✅     | Dropdown: Last 7 Weeks / 30 Days / Season |
| Metrics selector           | ✅     | Dropdown: 40-Yard, All Sprints, Agility   |
| Line chart                 | ✅     | Multi-line comparison                     |
| Insight: Best 40-Yard      | ✅     | "4.46s"                                   |
| Insight: Best 10-Yard      | ✅     | "1.54s"                                   |
| Insight: Total Improvement | ✅     | "-0.19s"                                  |
| Insight: Olympic Target    | ✅     | "4.40s"                                   |

---

### 5. Player Statistics & Attendance (Tabbed) ✅

#### Tab 1: Per Game Stats

| Element                 | Status | Notes              |
| ----------------------- | ------ | ------------------ |
| Games Played summary    | ✅     | Count              |
| Games Missed summary    | ✅     | Count (red)        |
| Attendance Rate summary | ✅     | Percentage         |
| Data table              | ✅     | Paginated, 10 rows |

**Table Columns:**

- Date
- Opponent
- Status (Present/Missed tag)
- Pass Att
- Completions
- Pass Yds
- Rush Att
- Rush Yds
- Flag Pulls
- Interceptions

#### Tab 2: Season Stats

| Element              | Status | Notes                                   |
| -------------------- | ------ | --------------------------------------- |
| Season summary       | ✅     | Year, games played/missed, attendance   |
| Passing stats card   | ✅     | Attempts, Completions, Yards, %         |
| Receiving stats card | ✅     | Targets, Receptions, Yards, Drops       |
| Rushing stats card   | ✅     | Attempts, Yards, Avg                    |
| Defense stats card   | ✅     | Flag Pulls, Success Rate, Interceptions |

#### Tab 3: Multi-Season Stats

| Element                    | Status | Notes                                |
| -------------------------- | ------ | ------------------------------------ |
| Total seasons              | ✅     | Count                                |
| Career games played/missed | ✅     | Counts                               |
| Overall attendance         | ✅     | Percentage                           |
| Career totals (4 cards)    | ✅     | Passing, Receiving, Rushing, Defense |
| Season breakdown table     | ✅     | Paginated by season                  |

---

### 6. States ✅

| State              | Status | Notes                     |
| ------------------ | ------ | ------------------------- |
| Loading state      | ✅     | Skeleton loader           |
| Error state        | ✅     | With retry button         |
| Empty chart states | ✅     | Per-chart empty messaging |
| No user state      | ✅     | Fallback data             |

---

## Business Logic

### Stat Calculations (Documented)

```typescript
// Quarterback Rating (simplified for flag football)
QBR = ((Completions/Attempts × 100) + (Yards/Attempts × 10) + (TDs × 20) - (INTs × 25)) / 4

// Defensive Efficiency
DefenseScore = (FlagPulls × 2) + (Interceptions × 6) + (Sacks × 3)
```

### Attendance Rate (Implemented)

```typescript
attendanceRate(): number {
  const total = playerGameStats().length;
  if (total === 0) return 0;
  const played = playerGameStats().filter(g => g.present).length;
  return Math.round((played / total) * 100);
}
```

### Games Missed (Implemented)

```typescript
gamesMissed(): number {
  return playerGameStats().filter(g => !g.present).length;
}
```

### Chart Options (Implemented)

```typescript
// Enhanced chart configurations with:
- Zoom & pan support
- Custom tooltips
- Responsive font sizes
- Export to PNG capability
- Reset zoom functionality
```

---

## Data Sources

| Data                  | Service                           | Method                                 |
| --------------------- | --------------------------------- | -------------------------------------- |
| Analytics summary     | `ApiService`                      | `GET /analytics/summary`               |
| Performance trends    | `ApiService`                      | `GET /analytics/performance-trends`    |
| Team chemistry        | `ApiService`                      | `GET /analytics/team-chemistry`        |
| Training distribution | `ApiService`                      | `GET /analytics/training-distribution` |
| Position performance  | `ApiService`                      | `GET /analytics/position-performance`  |
| Speed development     | `ApiService`                      | `GET /analytics/speed-development`     |
| Player game stats     | `PlayerStatisticsService`         | `getPlayerAllGames()`                  |
| Season stats          | `PlayerStatisticsService`         | `getPlayerSeasonStats()`               |
| Multi-season stats    | `PlayerStatisticsService`         | `getPlayerMultiSeasonStats()`          |
| Training stats        | `TrainingStatsCalculationService` | `getTrainingStats()`                   |
| ACWR data             | `AcwrService`                     | `acwrData()`                           |

---

## Navigation Paths

| From      | To                 | Trigger              |
| --------- | ------------------ | -------------------- |
| Analytics | Training Log       | Empty chart CTA      |
| Analytics | Enhanced Analytics | Chart "View Details" |

---

## Chart Features

### Interactive Capabilities ✅

| Feature            | Status | Notes                       |
| ------------------ | ------ | --------------------------- |
| Zoom (mouse wheel) | ✅     | On line/bar charts          |
| Pan (Shift + drag) | ✅     | Horizontal panning          |
| Legend toggle      | ✅     | Click to show/hide datasets |
| Hover tooltips     | ✅     | Rich data display           |
| Export as PNG      | ✅     | Download button             |
| Reset zoom         | ✅     | Restore original view       |
| Responsive fonts   | ✅     | Auto-adjust on resize       |

---

## Feature Comparison: Documented vs Implemented

| Documented Feature       | Status | Notes                               |
| ------------------------ | ------ | ----------------------------------- |
| Key metrics overview     | ✅     | 4 metric cards                      |
| Performance trends chart | ✅     | Line chart with ACWR                |
| Skill proficiency radar  | ✅     | Radar chart                         |
| Training distribution    | ✅     | Doughnut chart                      |
| Benchmark comparison     | ✅     | Bar chart                           |
| Speed development        | ✅     | Full-width line chart               |
| Time period filters      | ✅     | Dropdown selectors                  |
| Per-game statistics      | ✅     | Tabbed table                        |
| Season statistics        | ✅     | Summary cards                       |
| Multi-season statistics  | ✅     | Career totals                       |
| Attendance tracking      | ✅     | Games played/missed                 |
| Chart export             | ✅     | PNG download                        |
| Chart zoom/pan           | ✅     | Interactive features                |
| QBR calculation          | ⚠️     | Formula documented, display unclear |
| Defensive efficiency     | ⚠️     | Formula documented, display unclear |

---

## UX Notes

### ✅ What Works Well

- Comprehensive data visualization
- Lazy-loaded charts for performance
- Interactive chart features (zoom, pan, export)
- Clear metric cards with trends
- Tabbed statistics organization
- Good empty states per chart

### ⚠️ Friction Points

- Many charts can feel overwhelming
- No quick summary/highlight section
- Filter changes don't persist
- No data comparison to previous periods

### 🔧 Suggested Improvements

1. Add "Key Insights" summary section at top
2. Add period-over-period comparison toggle
3. Persist filter selections
4. Add "Share Stats" functionality
5. Consider collapsible sections for mobile
6. Add "Goals" vs "Actual" overlay on charts

---

## Missing Features Wireframes

### Share & Export Section

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 📤 EXPORT & SHARE OPTIONS                                                          │
│ ────────────────────────────────────────────────────────────────────────────────── │
│                                                                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │ 📄 Export PDF       │  │ 📸 Export PNG       │  │ 📧 Share with Coach │        │
│  │    Full report      │  │    Screenshots      │  │    Send summary     │        │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘        │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Gap Analysis Section

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 📊 GAP ANALYSIS - PERFORMANCE VS POSITION BENCHMARKS                              │
│ ────────────────────────────────────────────────────────────────────────────────── │
│                                                                                    │
│  Position: [Rusher ▼]        Comparison: [Elite Benchmarks ▼]                     │
│                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                              ││
│  │  40-Yard Dash                                                                ││
│  │  You:     ████████████████████████░░░░░░░░░░  4.52s                         ││
│  │  Elite:   ██████████████████████████████████  4.40s                         ││
│  │  Gap: 0.12s (2.7% improvement needed)                           🔴 Priority ││
│  │                                                                              ││
│  │  Pro Agility                                                                 ││
│  │  You:     ██████████████████████████████░░░░  4.25s                         ││
│  │  Elite:   ██████████████████████████████████  4.00s                         ││
│  │  Gap: 0.25s (6.3% improvement needed)                           🔴 Priority ││
│  │                                                                              ││
│  │  Vertical Jump                                                               ││
│  │  You:     ██████████████████████████████████  34"                           ││
│  │  Elite:   ██████████████████████████████████  36"                           ││
│  │  Gap: 2" (5.6% improvement needed)                              🟡 On Track ││
│  │                                                                              ││
│  │  Relative Squat (BW multiplier)                                              ││
│  │  You:     ████████████████████████████████░░  1.8x                          ││
│  │  Elite:   ██████████████████████████████████  2.0x                          ││
│  │  Gap: 0.2x (10% improvement needed)                             🔴 Priority ││
│  │                                                                              ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                                                                                    │
│  💡 RECOMMENDATIONS                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────────┐│
│  │ 1. Focus on Pro Agility drills 2-3x/week                                    ││
│  │ 2. Add plyometric training for explosive power                              ││
│  │ 3. Increase squat volume in current training phase                          ││
│  │    [View Recommended Exercises →]                                           ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Status Updates

| Feature                       | Status     | Priority |
| ----------------------------- | ---------- | -------- |
| PDF Report Export             | ⚠️ **ADD** | MEDIUM   |
| Share with Coach              | ⚠️ **ADD** | MEDIUM   |
| Position Benchmarks Selection | ⚠️ **ADD** | HIGH     |
| Gap Analysis Visualization    | ⚠️ **ADD** | HIGH     |
| Training Recommendations      | ⚠️ **ADD** | MEDIUM   |

---

## Related Pages

| Page              | Route             | Relationship             |
| ----------------- | ----------------- | ------------------------ |
| ACWR Dashboard    | `/acwr-dashboard` | Detailed load monitoring |
| Training Schedule | `/training`       | Log sessions             |
| Profile           | `/profile`        | Personal records         |

---

## Implementation Checklist

- [x] Page header
- [ ] My Development Goals section (NEW - Coach-assigned goals)
- [x] 4 metric cards with trends
- [x] Load vs Performance line chart
- [x] Skill proficiency radar chart
- [x] Training mix doughnut chart
- [x] Benchmark comparison bar chart
- [x] Speed development line chart
- [x] Time period selector
- [x] Metrics selector
- [x] Speed insights (4 values)
- [x] Per-game stats tab
- [x] Per-game stats table (paginated)
- [x] Season stats tab
- [x] Season stats summary cards
- [x] Multi-season stats tab
- [x] Career totals cards
- [x] Season breakdown table
- [x] Chart zoom/pan
- [x] Chart export PNG
- [x] Chart reset zoom
- [x] Loading state
- [x] Error state with retry
- [x] Empty chart states
- [x] Responsive layout
- [ ] Key insights summary
- [ ] Period comparison toggle
- [ ] Share functionality
