# Wireframe: ACWR Dashboard

**Route:** `/acwr-dashboard`  
**Users:** Players/Athletes, Coaches  
**Status:** ✅ Implemented  
**Source:** `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts`

---

## Skeleton Wireframe - With Data

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📊 Load Monitoring & Injury Prevention                                        │  │
│  │  Acute:Chronic Workload Ratio (ACWR) Analysis                                  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚠️ WARNING: Your ACWR is elevated                                        [✕]  │  │
│  │    Consider reducing training intensity today to lower injury risk.            │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ↑ Alert Banner (severity: critical/warning/info) - dismissable                     │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │                        ╭───────────────────╮                                   │  │
│  │                        │                   │                                   │  │
│  │                        │       1.24        │    ← ACWR value to 2 decimals    │  │
│  │                        │       ────        │                                   │  │
│  │                        │       ACWR        │                                   │  │
│  │                        │                   │                                   │  │
│  │                        ╰───────────────────╯                                   │  │
│  │                        ↑ Border color = risk zone                              │  │
│  │                                                                                │  │
│  │                   ┌──────────────────────────────┐                             │  │
│  │                   │  ✓  SWEET SPOT               │                             │  │
│  │                   │  ─────────────────────────── │                             │  │
│  │                   │  Optimal workload balance.   │                             │  │
│  │                   │  Lowest injury risk.         │                             │  │
│  │                   └──────────────────────────────┘                             │  │
│  │                   ↑ Risk zone indicator (color-coded background)               │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────┐        ┌─────────────────────────┐               │  │
│  │  │ Acute Load (7-day)      │   ÷    │ Chronic Load (28-day)   │               │  │
│  │  │ ─────────────────────── │        │ ─────────────────────── │               │  │
│  │  │       850 AU            │        │       685 AU            │               │  │
│  │  │ Current fatigue level   │        │ Training fitness base   │               │  │
│  │  └─────────────────────────┘        └─────────────────────────┘               │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Understanding Risk Zones                                                       │  │
│  │ ────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │ ● < 0.80    │  │ ● 0.80-1.30 │  │ ● 1.30-1.50 │  │ ● > 1.50    │           │  │
│  │  │ ──────────  │  │ ──────────  │  │ ──────────  │  │ ──────────  │           │  │
│  │  │ Under-      │  │ Sweet Spot  │  │ Elevated    │  │ Danger      │           │  │
│  │  │ Training    │  │             │  │ Risk        │  │ Zone        │           │  │
│  │  │             │  │ Optimal     │  │             │  │             │           │  │
│  │  │ Gradually   │  │ workload.   │  │ Caution     │  │ Highest     │           │  │
│  │  │ increase    │  │ Lowest      │  │ needed.     │  │ injury      │           │  │
│  │  │ load 5-10%  │  │ injury risk │  │ Reduce high │  │ risk.       │           │  │
│  │  │             │  │             │  │ intensity   │  │ Reduce 20-  │           │  │
│  │  │             │  │             │  │             │  │ 30%, skip   │           │  │
│  │  │             │  │             │  │             │  │ sprints     │           │  │
│  │  │ (Blue)      │  │ (Green)     │  │ (Yellow)    │  │ (Red)       │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Weekly Load Progression                                                        │  │
│  │ ────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐             │  │
│  │  │ Current Week     │  │ Previous Week    │  │ Change           │             │  │
│  │  │ ──────────────── │  │ ──────────────── │  │ ──────────────── │             │  │
│  │  │    1,250 AU      │  │    1,180 AU      │  │    +5.9%         │             │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘             │  │
│  │                                                                                │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │ ✓ Weekly progression is within safe limits (<10%)                      │   │  │
│  │  └────────────────────────────────────────────────────────────────────────┘   │  │
│  │  OR (if unsafe):                                                              │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │ ⚠ Week-over-week increase exceeds 10% safe threshold                   │   │  │
│  │  └────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Training Recommendations                                                       │  │
│  │ ────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  💡 Sweet Spot Guidance                                                        │  │
│  │  ────────────────────────────────────────────────────────────────────────────  │  │
│  │  Optimal workload balance. Maintain current training intensity.               │  │
│  │                                                                                │  │
│  │  Recommended Modifications:                                                    │  │
│  │  • Maintain current training load                                             │  │
│  │  • Continue balanced progression                                              │  │
│  │  • Keep monitoring ACWR trends                                                │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Quick Actions                                                                  │  │
│  │                                                                                │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐ │  │
│  │  │ + Log Training       │  │ 📊 View Load History │  │ ⬇ Export Report      │ │  │
│  │  │   Session            │  │                      │  │                      │ │  │
│  │  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘ │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Last updated: 1/3/2026, 10:30 AM                                               │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Skeleton Wireframe - Insufficient Data (New Athletes)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📊 Load Monitoring & Injury Prevention                                        │  │
│  │  Acute:Chronic Workload Ratio (ACWR) Analysis                                  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │                        ┌───────────────────────┐                               │  │
│  │                        │                       │                               │  │
│  │                        │     📊                │                               │  │
│  │                        │                       │                               │  │
│  │                        │  Building Your ACWR   │                               │  │
│  │                        │                       │                               │  │
│  │                        └───────────────────────┘                               │  │
│  │                                                                                │  │
│  │        We need more training data to calculate your injury risk profile.      │  │
│  │                                                                                │  │
│  │        Data Progress:                                                          │  │
│  │                                                                                │  │
│  │        Days with data:                                                         │  │
│  │        ███████░░░░░░░░░░░░░░░░░░░░░░░░  7 / 21                                │  │
│  │                                                                                │  │
│  │        Sessions logged:                                                        │  │
│  │        █████░░░░░░░░░░░░░░░░░░░░░░░░░░  3 / 10                                │  │
│  │                                                                                │  │
│  │        💡 Olympic Tip: Consistent training logging helps prevent              │  │
│  │           overtraining injuries during your LA28 preparation.                 │  │
│  │                                                                                │  │
│  │                ┌──────────────────────────────────┐                            │  │
│  │                │  + Log Your First Session        │                            │  │
│  │                └──────────────────────────────────┘                            │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Understanding Risk Zones                                                       │  │
│  │ ... (same as above)                                                            │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Page Header ✅

| Element                                     | Status | Notes                                          |
| ------------------------------------------- | ------ | ---------------------------------------------- |
| Title "Load Monitoring & Injury Prevention" | ✅     | With activity icon                             |
| Subtitle                                    | ✅     | "Acute:Chronic Workload Ratio (ACWR) Analysis" |

---

### 2. Alert Banner ✅

| Element             | Status | Notes                              |
| ------------------- | ------ | ---------------------------------- |
| Severity icon       | ✅     | 🚨 critical / ⚠️ warning / ℹ️ info |
| Alert message       | ✅     | Dynamic from alerts service        |
| Recommendation text | ✅     | Action guidance                    |
| Dismiss button      | ✅     | Acknowledges alert                 |

**Alert Severities:**

- `critical` - Red background
- `warning` - Yellow background
- `info` - Blue background

---

### 3. Main ACWR Display ✅

#### With Data State

| Element                 | Status | Notes                    |
| ----------------------- | ------ | ------------------------ |
| ACWR ratio circle       | ✅     | Border color = risk zone |
| ACWR value (2 decimals) | ✅     | e.g., "1.24"             |
| Risk zone indicator     | ✅     | Background color + icon  |
| Risk zone label         | ✅     | e.g., "Sweet Spot"       |
| Risk zone description   | ✅     | Short explanation        |

#### Insufficient Data State

| Element               | Status | Notes                    |
| --------------------- | ------ | ------------------------ |
| Empty state icon      | ✅     | Chart icon               |
| Title                 | ✅     | "Building Your ACWR"     |
| Reason text           | ✅     | Centralized UX copy      |
| Days progress bar     | ✅     | X/21 with visual fill    |
| Sessions progress bar | ✅     | X/10 with visual fill    |
| Olympic tip           | ✅     | Motivational message     |
| Action button         | ✅     | "Log Your First Session" |

---

### 4. Load Breakdown ✅

| Element               | Status | Notes                              |
| --------------------- | ------ | ---------------------------------- |
| Acute Load (7-day)    | ✅     | Value in AU (Arbitrary Units)      |
| Divider symbol (÷)    | ✅     | Visual formula                     |
| Chronic Load (28-day) | ✅     | Value in AU                        |
| Descriptions          | ✅     | "Current fatigue" / "Fitness base" |

---

### 5. Risk Zones Guide ✅

| Zone           | Range     | Color  | Label          | Status |
| -------------- | --------- | ------ | -------------- | ------ |
| Under-Training | < 0.80    | Blue   | Under-Training | ✅     |
| Sweet Spot     | 0.80-1.30 | Green  | Sweet Spot     | ✅     |
| Elevated Risk  | 1.30-1.50 | Yellow | Elevated Risk  | ✅     |
| Danger Zone    | > 1.50    | Red    | Danger Zone    | ✅     |

---

### 6. Weekly Load Progression ✅

| Element           | Status | Notes                             |
| ----------------- | ------ | --------------------------------- |
| Current week AU   | ✅     | Number format                     |
| Previous week AU  | ✅     | Number format                     |
| Change percentage | ✅     | With +/- sign                     |
| Safety indicator  | ✅     | Green ✓ if safe, Yellow ⚠ if >10% |
| Warning message   | ✅     | If progression exceeds 10%        |

---

### 7. Training Recommendations ✅

| Element               | Status | Notes                         |
| --------------------- | ------ | ----------------------------- |
| Recommendation card   | ✅     | Color-coded by risk zone      |
| Zone-specific heading | ✅     | e.g., "Sweet Spot Guidance"   |
| Guidance text         | ✅     | From risk zone data           |
| Modifications list    | ✅     | Bullet points if shouldModify |

---

### 8. Quick Actions ✅

| Action               | Route                  | Status |
| -------------------- | ---------------------- | ------ |
| Log Training Session | `/training/smart-form` | ✅     |
| View Load History    | `/training/schedule`   | ✅     |
| Export Report        | Downloads JSON         | ✅     |

---

### 9. Footer ✅

| Element                | Status | Notes             |
| ---------------------- | ------ | ----------------- |
| Last updated timestamp | ✅     | Short date format |

---

## Business Logic

### ACWR Calculation (Documented)

```typescript
// Standard ACWR Formula
ACWR = Acute Load (7-day) / Chronic Load (28-day)

// Example:
Acute Load = 850 AU
Chronic Load = 685 AU
ACWR = 850 / 685 = 1.24
```

### Risk Zone Definitions (Implemented)

```typescript
const RISK_ZONES = {
  "under-training": { range: [0, 0.8], color: "blue", label: "Under-Training" },
  "sweet-spot": { range: [0.8, 1.3], color: "green", label: "Sweet Spot" },
  elevated: { range: [1.3, 1.5], color: "yellow", label: "Elevated Risk" },
  "danger-zone": { range: [1.5, Infinity], color: "red", label: "Danger Zone" },
};
```

### Weekly Progression Safety (Implemented)

```typescript
// Safe if week-over-week change is <10%
isSafe = Math.abs(changePercent) < 10;
```

### Data Quality Requirements (Implemented)

```typescript
// Minimum requirements for reliable ACWR
- Days with data: 21 minimum
- Sessions in chronic window: 10 minimum

// Quality levels:
- "insufficient" or "low" → Show empty state
- "good" or "excellent" → Show full ACWR display
```

### Report Recommendations by Zone (Implemented)

```typescript
switch (riskZoneLabel) {
  case "Danger Zone (High)":
    return [
      "Immediately reduce training load by 30-40%",
      "Focus on recovery activities",
      "Consider active recovery sessions only",
      "Monitor for signs of overtraining",
    ];
  case "Warning (High)":
    return [
      "Reduce training intensity by 15-20%",
      "Add an extra rest day this week",
      // ...
    ];
  case "Optimal Zone":
    return [
      "Maintain current training load",
      "Continue balanced progression",
      // ...
    ];
  // ... etc
}
```

---

## Data Sources

| Data               | Service                  | Signal/Method               |
| ------------------ | ------------------------ | --------------------------- |
| ACWR ratio         | `UnifiedTrainingService` | `acwrRatio` signal          |
| Risk zone          | `UnifiedTrainingService` | `acwrRiskZone` signal       |
| Acute load         | `UnifiedTrainingService` | `acuteLoad` signal          |
| Chronic load       | `UnifiedTrainingService` | `chronicLoad` signal        |
| Weekly progression | `UnifiedTrainingService` | `weeklyProgression` signal  |
| Data quality       | `UnifiedTrainingService` | `acwrData().dataQuality`    |
| Alerts             | `AcwrAlertsService`      | `getActiveAlerts()`         |
| Training mods      | `UnifiedTrainingService` | `getTrainingModification()` |
| Last updated       | `UnifiedTrainingService` | `acwrData().lastUpdated`    |

---

## Navigation Paths

| From           | To                  | Trigger                       |
| -------------- | ------------------- | ----------------------------- |
| ACWR Dashboard | Smart Training Form | "Log Training Session" button |
| ACWR Dashboard | Training Schedule   | "View Load History" button    |
| ACWR Dashboard | (Download)          | "Export Report" → JSON file   |
| ACWR Dashboard | Smart Training Form | Empty state CTA               |

---

## Feature Comparison: Documented vs Implemented

| Documented Feature             | Status | Notes                              |
| ------------------------------ | ------ | ---------------------------------- |
| Main ACWR Display (circular)   | ✅     | Color-coded border                 |
| ACWR value (2 decimals)        | ✅     | Number pipe formatting             |
| Risk Zone Indicator            | ✅     | Color + icon + label + description |
| Load Breakdown (Acute/Chronic) | ✅     | With AU units                      |
| Visual formula (÷)             | ✅     | Between load cards                 |
| Alert Banner                   | ✅     | Critical/Warning/Info severities   |
| Dismissable alerts             | ✅     | Acknowledges via service           |
| Data Quality Indicator         | ✅     | Days + Sessions progress bars      |
| Risk Zones Guide (4 zones)     | ✅     | Color-coded cards                  |
| Training Recommendations       | ✅     | Zone-specific bullet points        |
| Weekly Progression Check       | ✅     | Current vs Previous with %         |
| 10% safety threshold           | ✅     | Visual indicator                   |
| Export Report                  | ✅     | JSON download                      |
| Trend charts                   | ⚠️     | Not visible in this component      |

---

## UX Notes

### ✅ What Works Well

- Clear visual hierarchy with large ACWR circle
- Color coding is consistent across all elements
- Risk zone guide provides education inline
- Weekly progression gives actionable context
- Export feature for coaches/physiotherapists
- Good empty state for new athletes

### ⚠️ Friction Points

- No historical trend chart visible in current component
- Export is JSON only (not PDF or shareable format)
- No comparison to team averages

### 🔧 Suggested Improvements

1. Add 7-day/28-day trend mini-charts
2. Add PDF export option for medical reports
3. Show comparison to optimal zone (how far off)
4. Add "Talk to Coach" quick action if in danger zone
5. Consider adding push notifications for critical alerts

---

## Related Pages

| Page                | Route                  | Relationship               |
| ------------------- | ---------------------- | -------------------------- |
| Training Schedule   | `/training`            | Log sessions, view history |
| Smart Training Form | `/training/smart-form` | Log new session            |
| Wellness            | `/wellness`            | Related health metrics     |
| Analytics           | `/analytics`           | Broader performance data   |

---

## Implementation Checklist

- [x] Page header
- [x] Alert banner (critical/warning/info)
- [x] Alert dismiss functionality
- [x] Main ACWR ratio display
- [x] Color-coded risk zone indicator
- [x] Load breakdown (Acute ÷ Chronic)
- [x] Insufficient data empty state
- [x] Data quality progress bars
- [x] Risk zones guide (4 zones)
- [x] Weekly load progression
- [x] 10% safety threshold check
- [x] Training recommendations
- [x] Zone-specific modifications list
- [x] Quick actions (3 buttons)
- [x] Log session navigation
- [x] View history navigation
- [x] Export JSON report
- [x] Last updated footer
- [x] Loading state
- [x] Error state with retry
- [ ] Trend charts integration
- [ ] PDF export option
- [ ] Team comparison view
