# Wireframe: Performance Tracking

**Route:** `/performance-tracking`  
**Users:** Players (log data), Coaches (view team)  
**Status:** ✅ Core Implemented / ⚠️ Extended metrics needed  
**Source:** `angular/src/app/features/performance-tracking/performance-tracking.component.ts`

---

## Skeleton Wireframe - Full Page

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🎯 Performance Tracking                                 ┌──────────────────┐ │  │
│  │     Track and analyze your performance metrics over time │ + Log Performance│ │  │
│  │                                                          └──────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              SPEED METRICS (6 CARDS)                                 │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ ⚡ 10m Sprint   │  │ 🏃 20m Sprint   │  │ 🔥 40-Yard Dash │                       │
│  │                 │  │                 │  │                 │                       │
│  │    1.54s        │  │    2.89s        │  │    4.45s        │                       │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │                       │
│  │  -0.02s (PR!)   │  │  -0.05s         │  │  -0.05s         │                       │
│  │  Elite: 1.50s   │  │  Elite: 2.80s   │  │  Elite: 4.40s   │                       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                       │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ 🔄 Pro Agility  │  │ 🔀 L-Drill      │  │ ⚡ Reactive     │                       │
│  │    (5-10-5)     │  │                 │  │    Agility      │                       │
│  │                 │  │                 │  │                 │                       │
│  │    4.12s        │  │    6.85s        │  │    1.24s        │                       │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │                       │
│  │  -0.08s         │  │  First test     │  │  +0.02s         │                       │
│  │  Elite: 3.90s   │  │  Elite: 6.50s   │  │  Elite: 1.10s   │                       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                       │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              POWER METRICS (3 CARDS)                                 │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ ⬆️ Vertical     │  │ ➡️ Broad Jump   │  │ 📊 RSI          │                       │
│  │    Jump         │  │                 │  │    (Reactive    │                       │
│  │                 │  │                 │  │     Strength)   │                       │
│  │    38"          │  │    122"         │  │    2.45         │                       │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │                       │
│  │  +2" (PR!)      │  │  +6"            │  │  +0.15          │                       │
│  │  Elite: 40"     │  │  Elite: 130"    │  │  Elite: 2.60    │                       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                       │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                           STRENGTH METRICS (3 CARDS)                                 │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ 💪 Bench Press  │  │ 🏋️ Back Squat   │  │ 🔱 Trap Bar     │                       │
│  │    1RM          │  │    1RM          │  │    Deadlift 1RM │                       │
│  │                 │  │                 │  │                 │                       │
│  │    225 lbs      │  │    315 lbs      │  │    365 lbs      │                       │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │                       │
│  │  +10 lbs        │  │  +15 lbs        │  │  +20 lbs (PR!)  │                       │
│  │  1.35× BW       │  │  1.89× BW       │  │  2.19× BW       │                       │
│  │  [Intermediate] │  │  [Advanced]     │  │  [Advanced]     │                       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                       │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                        POSITION BENCHMARK COMPARISON                                 │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🎯 WR Position Benchmarks                            [Change Position ▼]       │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  40-Yard Dash                                                                 │  │
│  │  You: 4.45s    ████████████████████████████████░░░░░░░░  Elite: 4.40s        │  │
│  │                                                          (0.05s away)         │  │
│  │                                                                                │  │
│  │  Pro Agility                                                                  │  │
│  │  You: 4.12s    ██████████████████████████░░░░░░░░░░░░░░  Elite: 3.90s        │  │
│  │                                                          (0.22s away)         │  │
│  │                                                                                │  │
│  │  Vertical Jump                                                                │  │
│  │  You: 38"      █████████████████████████████████░░░░░░░  Elite: 40"          │  │
│  │                                                          (2" away)            │  │
│  │                                                                                │  │
│  │  Relative Squat (× bodyweight)                                                │  │
│  │  You: 1.89×    ████████████████████████████████░░░░░░░░  Elite: 2.0×         │  │
│  │                                                          (0.11× away)         │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              GAP ANALYSIS & PRIORITIES                               │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🔍 Your Training Priorities (Based on Gap Analysis)                            │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Priority #1: Pro Agility (5-10-5)                                            │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ Gap: 0.22s from elite  │  Current: 4.12s  │  Target: 3.90s               ││  │
│  │  │ ──────────────────────────────────────────────────────────────────────── ││  │
│  │  │ 🎯 Recommended Focus:                                                     ││  │
│  │  │ • Lateral change of direction drills (2x/week)                           ││  │
│  │  │ • Hip mobility work before training                                      ││  │
│  │  │ • Deceleration/re-acceleration mechanics                                 ││  │
│  │  │                                                                          ││  │
│  │  │ 📺 Related Videos: [View Agility Drills →]                               ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  Priority #2: Relative Squat Strength                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ Gap: 0.11× from elite  │  Current: 1.89×  │  Target: 2.0× BW             ││  │
│  │  │ ──────────────────────────────────────────────────────────────────────── ││  │
│  │  │ 🎯 Recommended Focus:                                                     ││  │
│  │  │ • Progressive squat program (3x/week, 85% 1RM)                           ││  │
│  │  │ • Single-leg variations (split squats, lunges)                           ││  │
│  │  │ • Core stability work                                                    ││  │
│  │  │                                                                          ││  │
│  │  │ 📺 Related Videos: [View Strength Programs →]                            ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  Priority #3: Vertical Jump                                                   │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ Gap: 2" from elite  │  Current: 38"  │  Target: 40"                      ││  │
│  │  │ ──────────────────────────────────────────────────────────────────────── ││  │
│  │  │ 🎯 Recommended Focus:                                                     ││  │
│  │  │ • Plyometric training (box jumps, depth jumps)                           ││  │
│  │  │ • Hip flexor strength & power                                            ││  │
│  │  │ • Reactive strength development                                          ││  │
│  │  │                                                                          ││  │
│  │  │ 📺 Related Videos: [View Jump Training →]                                ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────┐  ┌────────────────────────────────────┐  │
│  │ 📈 PERFORMANCE OVER TIME               │  │ 🏃 SPEED METRICS TREND             │  │
│  │ ────────────────────────────────────── │  │ ────────────────────────────────── │  │
│  │                                        │  │                                    │  │
│  │      ╱╲                                │  │   40-Yard ────                     │  │
│  │     ╱  ╲    ╱╲                         │  │   Pro Agility - - -                │  │
│  │    ╱    ╲  ╱  ╲___                    │  │   10m Sprint · · ·                 │  │
│  │   ╱      ╲╱                            │  │                                    │  │
│  │  Jan Feb Mar Apr May Jun               │  │      ╲___   ╱╲                     │  │
│  │                                        │  │          ╲_╱  ╲___                │  │
│  │  [LINE CHART - Overall Performance]    │  │  Week 1  Week 2  Week 3  Week 4   │  │
│  └────────────────────────────────────────┘  └────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📋 PERFORMANCE HISTORY                                                         │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Date   │ 10m  │ 20m  │ 40yd │ 5-10-5│ Vert │ Broad │ Squat │ Dead │ Score   │  │
│  │  ───────────────────────────────────────────────────────────────────────────── │  │
│  │  Jan 15 │ 1.56 │ 2.94 │ 4.50 │ 4.20  │ 36"  │ 116"  │ 300lb │ 345lb│ 🟢 85%  │  │
│  │  Feb 15 │ 1.55 │ 2.91 │ 4.48 │ 4.15  │ 37"  │ 119"  │ 305lb │ 355lb│ 🔵 87%  │  │
│  │  Mar 15 │ 1.54 │ 2.89 │ 4.45 │ 4.12  │ 38"  │ 122"  │ 315lb │ 365lb│ 🟢 89%  │  │
│  │                                                                                │  │
│  │  ◀  1  2  3  ...  ▶                                                           │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                            LOG PERFORMANCE DIALOG                                    │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📝 LOG PERFORMANCE                                                    [×]     │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ═══════════════ SPEED METRICS ═══════════════                                │  │
│  │                                                                                │  │
│  │  10m Sprint (sec)           20m Sprint (sec)          40-Yard Dash (sec)      │  │
│  │  ┌───────────────┐          ┌───────────────┐          ┌───────────────┐      │  │
│  │  │ 1.54          │          │ 2.89          │          │ 4.45          │      │  │
│  │  └───────────────┘          └───────────────┘          └───────────────┘      │  │
│  │                                                                                │  │
│  │  ═══════════════ AGILITY METRICS ═══════════════                              │  │
│  │                                                                                │  │
│  │  Pro Agility 5-10-5 (sec)   L-Drill (sec)             Reactive Agility (sec)  │  │
│  │  ┌───────────────┐          ┌───────────────┐          ┌───────────────┐      │  │
│  │  │ 4.12          │          │ 6.85          │          │ 1.24          │      │  │
│  │  └───────────────┘          └───────────────┘          └───────────────┘      │  │
│  │                                                                                │  │
│  │  ═══════════════ POWER METRICS ═══════════════                                │  │
│  │                                                                                │  │
│  │  Vertical Jump (in)         Broad Jump (in)           RSI (ratio)             │  │
│  │  ┌───────────────┐          ┌───────────────┐          ┌───────────────┐      │  │
│  │  │ 38            │          │ 122           │          │ 2.45          │      │  │
│  │  └───────────────┘          └───────────────┘          └───────────────┘      │  │
│  │                                                                                │  │
│  │  ═══════════════ STRENGTH METRICS ═══════════════                             │  │
│  │                                                                                │  │
│  │  Bench Press 1RM (lbs)      Back Squat 1RM (lbs)      Deadlift 1RM (lbs)      │  │
│  │  ┌───────────────┐          ┌───────────────┐          ┌───────────────┐      │  │
│  │  │ 225           │          │ 315           │          │ 365           │      │  │
│  │  └───────────────┘          └───────────────┘          └───────────────┘      │  │
│  │                                                                                │  │
│  │  Your Body Weight (lbs) - for relative strength calculation                   │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐       │  │
│  │  │ 167                                                                │       │  │
│  │  └────────────────────────────────────────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │  Notes (optional)                                                             │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐       │  │
│  │  │ Testing session at practice                                        │       │  │
│  │  └────────────────────────────────────────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │                                    [Cancel]  [Save Performance]               │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## All Performance Metrics

### Speed Metrics

| Metric | Input Type | Unit | Elite | Good | Average |
|--------|------------|------|-------|------|---------|
| 10m Sprint | Decimal | seconds | 1.50s | 1.60s | 1.70s |
| 20m Sprint | Decimal | seconds | 2.80s | 2.95s | 3.10s |
| 40-Yard Dash | Decimal | seconds | 4.40s | 4.60s | 4.80s |

### Agility Metrics

| Metric | Input Type | Unit | Elite | Good | Average |
|--------|------------|------|-------|------|---------|
| Pro Agility (5-10-5) | Decimal | seconds | 3.90s | 4.10s | 4.30s |
| L-Drill | Decimal | seconds | 6.50s | 7.00s | 7.50s |
| Reactive Agility | Decimal | seconds | 1.10s | 1.25s | 1.40s |

### Power Metrics

| Metric | Input Type | Unit | Elite | Good | Average |
|--------|------------|------|-------|------|---------|
| Vertical Jump | Integer | inches | 40" | 36" | 32" |
| Broad Jump | Integer | inches | 130" | 115" | 100" |
| RSI (Reactive Strength Index) | Decimal | ratio | 2.60 | 2.20 | 1.80 |

### Strength Metrics

| Metric | Input Type | Unit | Relative Strength Levels |
|--------|------------|------|-------------------------|
| Bench Press 1RM | Integer | lbs | Beginner: 0.75×, Int: 1.0×, Adv: 1.25×, Elite: 1.5× BW |
| Back Squat 1RM | Integer | lbs | Beginner: 1.0×, Int: 1.5×, Adv: 2.0×, Elite: 2.5× BW |
| Trap Bar Deadlift 1RM | Integer | lbs | Beginner: 1.25×, Int: 1.75×, Adv: 2.25×, Elite: 2.75× BW |

---

## Position-Specific Benchmarks

```typescript
const POSITION_BENCHMARKS = {
  QB: {
    sprint40: { elite: 4.6, good: 4.8, average: 5.0 },
    proAgility: { elite: 4.0, good: 4.2, average: 4.4 },
    verticalJump: { elite: 34, good: 30, average: 26 } // inches
  },
  WR: {
    sprint40: { elite: 4.4, good: 4.6, average: 4.8 },
    proAgility: { elite: 3.9, good: 4.1, average: 4.3 },
    verticalJump: { elite: 36, good: 32, average: 28 }
  },
  DB: {
    sprint40: { elite: 4.4, good: 4.6, average: 4.8 },
    proAgility: { elite: 3.9, good: 4.1, average: 4.3 },
    verticalJump: { elite: 35, good: 31, average: 27 }
  },
  Rusher: {
    sprint40: { elite: 4.5, good: 4.7, average: 4.9 },
    proAgility: { elite: 4.0, good: 4.2, average: 4.4 },
    verticalJump: { elite: 33, good: 29, average: 25 }
  }
};
```

---

## Relative Strength Calculations

```typescript
function calculateRelativeStrength(oneRepMax: number, bodyWeight: number): RelativeStrength {
  const ratio = oneRepMax / bodyWeight;
  
  return {
    ratio: ratio.toFixed(2),
    level: getStrengthLevel(ratio)
  };
}

function getStrengthLevel(ratio: number, exercise: 'squat' | 'deadlift' | 'bench'): string {
  const standards = {
    squat: { beginner: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
    deadlift: { beginner: 1.25, intermediate: 1.75, advanced: 2.25, elite: 2.75 },
    bench: { beginner: 0.75, intermediate: 1.0, advanced: 1.25, elite: 1.5 }
  };
  
  const levels = standards[exercise];
  
  if (ratio >= levels.elite) return 'Elite';
  if (ratio >= levels.advanced) return 'Advanced';
  if (ratio >= levels.intermediate) return 'Intermediate';
  return 'Beginner';
}
```

---

## Gap Analysis Algorithm

```typescript
interface GapAnalysis {
  metric: string;
  current: number;
  target: number;
  gap: number;
  gapPercentage: number;
  priority: number;
  recommendations: string[];
}

function analyzeGaps(
  metrics: PerformanceMetrics, 
  position: Position
): GapAnalysis[] {
  const benchmarks = POSITION_BENCHMARKS[position];
  const gaps: GapAnalysis[] = [];
  
  // Calculate gap for each metric
  Object.keys(benchmarks).forEach(metric => {
    const current = metrics[metric];
    const elite = benchmarks[metric].elite;
    
    if (current) {
      const gap = isTimeMetric(metric) 
        ? current - elite   // Lower is better
        : elite - current;  // Higher is better
      
      const gapPercentage = (gap / elite) * 100;
      
      gaps.push({
        metric,
        current,
        target: elite,
        gap: Math.abs(gap),
        gapPercentage: Math.abs(gapPercentage),
        priority: calculatePriority(gapPercentage, metric),
        recommendations: getRecommendations(metric, gap)
      });
    }
  });
  
  // Sort by priority (highest gap percentage first)
  return gaps.sort((a, b) => b.gapPercentage - a.gapPercentage);
}
```

---

## Training Priority Recommendations

```typescript
const TRAINING_RECOMMENDATIONS = {
  proAgility: {
    high: [
      'Lateral change of direction drills (2x/week)',
      'Hip mobility work before training',
      'Deceleration/re-acceleration mechanics',
      'Cone drills with tight cuts'
    ],
    medium: [
      'Maintain agility work (1x/week)',
      'Focus on other priority areas'
    ]
  },
  sprint40: {
    high: [
      'Sprint mechanics drills',
      'Acceleration work (10-20m)',
      'Hip flexor strength development',
      'Arm swing mechanics'
    ],
    medium: [
      'Weekly sprint maintenance',
      'Flying sprints for top-end speed'
    ]
  },
  verticalJump: {
    high: [
      'Plyometric training (box jumps, depth jumps)',
      'Hip flexor power development',
      'Reactive strength (RSI) training',
      'Single-leg jump variations'
    ],
    medium: [
      'Weekly plyometric maintenance',
      'Jump technique refinement'
    ]
  },
  squat: {
    high: [
      'Progressive squat program (3x/week, 85% 1RM)',
      'Single-leg variations (split squats, lunges)',
      'Core stability work',
      'Hip hinge pattern development'
    ],
    medium: [
      'Maintenance program (2x/week)',
      'Focus on other strength priorities'
    ]
  }
};
```

---

## Feature Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| 40-Yard Dash | ✅ | Implemented |
| Vertical Jump | ✅ | Implemented |
| Broad Jump | ✅ | Implemented |
| Bench Press | ✅ | Implemented |
| Performance History Table | ✅ | Implemented |
| Pagination | ✅ | Implemented |
| **10m Sprint** | ⚠️ | **ADD TO UI** |
| **20m Sprint** | ⚠️ | **ADD TO UI** |
| **Pro Agility (5-10-5)** | ⚠️ | **ADD TO UI** |
| **L-Drill** | ⚠️ | **ADD TO UI** |
| **Reactive Agility** | ⚠️ | **ADD TO UI** |
| **RSI (Reactive Strength Index)** | ⚠️ | **ADD TO UI** |
| **Back Squat 1RM** | ⚠️ | **ADD TO UI** |
| **Deadlift 1RM** | ⚠️ | **ADD TO UI** |
| **Body Weight input** | ⚠️ | **ADD TO UI** |
| **Relative Strength display** | ⚠️ | **ADD TO UI** |
| **Position Benchmark Comparison** | ⚠️ | **ADD TO UI** |
| **Gap Analysis section** | ⚠️ | **ADD TO UI** |
| **Training Recommendations** | ⚠️ | **ADD TO UI** |
| **Related Videos links** | ⚠️ | **ADD TO UI** |

---

## Data Sources

| Data | Service | Table |
|------|---------|-------|
| Performance records | `SupabaseService` | `performance_records` |
| User position | `AuthService` | `profiles` |
| Video recommendations | `ApiService` | `training_videos` |

---

## UX Notes

### ✅ What Works Well
- Core metrics (40yd, vert, broad, bench) implemented
- Trend indicators show progress
- History table with pagination
- Score calculation system

### ⚠️ Needs Implementation
- Extended speed metrics (10m, 20m sprints)
- All agility metrics (Pro Agility, L-Drill, Reactive)
- Power metrics (RSI)
- Strength metrics (Squat, Deadlift 1RM)
- Position benchmark comparison visualization
- Gap analysis with recommendations
- Training priority section
- Related video links

### 🔧 Implementation Priority
1. Add all metric inputs to Log Performance dialog
2. Add Position Benchmark Comparison section
3. Add Gap Analysis & Training Priorities section
4. Link to relevant Training Videos

---

## Related Pages

| Page | Route | Relationship |
|------|-------|--------------|
| Analytics | `/analytics` | Speed development charts |
| Training Videos | `/training/videos` | Skill improvement videos |
| Exercise Library | `/exercise-library` | Related exercises |
| QB Hub | `/qb` | QB-specific metrics |
