# Wireframe: Game Day Readiness

**Route:** `/game/readiness`  
**Users:** Players (complete before competition), Coaches (receive alerts)  
**Status:** ✅ Fully Implemented  
**Source:** `angular/src/app/features/game/game-day-readiness/game-day-readiness.component.ts`

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  GAME DAY READINESS                                                                  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🚩 Game Day Readiness                                    ┌───────────────────┐│  │
│  │     Pre-Competition Check-in for Regional Tournament      │ ACWR    1.12      ││  │
│  │                                                           │ (Sweet Spot)      ││  │
│  │                                                           └───────────────────┘│  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🌙 Sleep Quality                                                     8/10    │  │
│  │  ───────────────────────────────────────────────────────────────────────────  │  │
│  │  ○────────────────────────────●──────────────────────                         │  │
│  │  1                            8                         10                    │  │
│  │  How well did you sleep last night?                                          │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ⚡ Energy Level                                                      7/10    │  │
│  │  ───────────────────────────────────────────────────────────────────────────  │  │
│  │  ○────────────────────────●────────────────────────────                       │  │
│  │  Rate your current energy level                                               │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  💪 Muscle Soreness                                                   4/10 ⚠️│  │
│  │  ───────────────────────────────────────────────────────────────────────────  │  │
│  │  ○──────────────●──────────────────────────────────────                       │  │
│  │  Rate your muscle soreness (1 = none, 10 = severe)                           │  │
│  │                                                                                │  │
│  │  ⚠️ Consider extended dynamic warm-up                                         │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  💧 Hydration                                                         6/10    │  │
│  │  ───────────────────────────────────────────────────────────────────────────  │  │
│  │  ○────────────────────●────────────────────────────────                       │  │
│  │  How hydrated do you feel?                                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🧠 Mental Focus                                                      8/10    │  │
│  │  ───────────────────────────────────────────────────────────────────────────  │  │
│  │  ○────────────────────────────●──────────────────────                         │  │
│  │  Rate your mental focus and alertness                                        │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  💚 Confidence                                                        9/10    │  │
│  │  ───────────────────────────────────────────────────────────────────────────  │  │
│  │  ○──────────────────────────────────●────────────────                         │  │
│  │  How confident do you feel about today's competition?                        │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📝 Any concerns or notes for today?                                          │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ E.g., slight tightness in hamstring, nervous about opponent...           ││  │
│  │  │                                                                          ││  │
│  │  │                                                                          ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  READINESS SCORE PREVIEW                                                      │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │        ┌─────────────────────┐         Good                                   │  │
│  │        │         78          │         Good to Compete                        │  │
│  │        │        / 100        │         You're prepared for competition        │  │
│  │        │     🔵 GOOD         │                                                │  │
│  │        └─────────────────────┘                                                │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ⚠️ COACH ALERT WARNING (shows if score < 70)                                 │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │  🔔 Coach will be notified                                                    │  │
│  │     Your readiness score is below 70%. Your coach will receive an alert      │  │
│  │     to discuss modifications.                                                 │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│                           ┌──────────────────────────────┐                          │
│                           │  ✓ Submit Readiness Check    │                          │
│                           └──────────────────────────────┘                          │
│                                                                                      │
│           📋 Complete at least 2 hours before your competition                       │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Post-Submission View

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  ✅ CHECK-IN COMPLETE                                                          │
│ ──────────────────────────────────────────────────────────────────────────────│
│                                                                                │
│        ┌─────────────────────┐                                                 │
│        │         78          │                                                 │
│        │    Readiness Score  │                                                 │
│        │     🔵 GOOD         │                                                 │
│        └─────────────────────┘                                                 │
│                                                                                │
│  📋 PERSONALIZED RECOMMENDATIONS                                              │
│  ─────────────────────────────────────────────────────────────────────────────│
│                                                                                │
│  Based on your check-in:                                                       │
│  • ✅ Standard dynamic warmup protocol                                         │
│  • ✅ Stay hydrated throughout competition                                     │
│  • ✅ Trust your preparation and compete with confidence                       │
│  • 💧 Drink 500ml water in the next hour (hydration < 7)                       │
│  • 💪 Extended dynamic warmup (15-20 min) for muscle soreness                  │
│                                                                                │
│  🔔 Coach Notification: Sent (if score < 70)                                   │
│                                                                                │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────────┐ │
│  │ 🍎 Tournament Nutrition │  │ 📋 View Game Plan                          │ │
│  └─────────────────────────┘  └─────────────────────────────────────────────┘ │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Readiness Metrics

| Metric | Icon | Weight | Scale | Inverted? |
|--------|------|--------|-------|-----------|
| Sleep Quality | 🌙 | 20% | 1-10 | No |
| Energy Level | ⚡ | 15% | 1-10 | No |
| Muscle Soreness | 💪 | 20% | 1-10 | Yes (lower is better) |
| Hydration | 💧 | 15% | 1-10 | No |
| Mental Focus | 🧠 | 15% | 1-10 | No |
| Confidence | 💚 | 15% | 1-10 | No |

---

## Readiness Score Categories

| Score Range | Label | Color | Message |
|-------------|-------|-------|---------|
| 85-100 | Excellent | 🟢 Green | Competition Ready |
| 70-84 | Good | 🔵 Blue | Good to Compete |
| 55-69 | Caution | 🟡 Yellow | Proceed with Caution |
| 0-54 | Concern | 🔴 Red | Concerns Identified |

---

## Business Logic

### Readiness Score Calculation
```typescript
function calculateReadinessScore(metrics, acwr): number {
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

### Recommendation Engine
```typescript
function generateRecommendations(metrics, acwr): string[] {
  const recs = [];

  if (metrics.sleep.value < 6) {
    recs.push("Consider a 20-minute power nap before warmup");
    recs.push("Increase caffeine intake moderately (200-300mg)");
  }

  if (metrics.soreness.value > 6) {
    recs.push("Extended dynamic warmup (15-20 minutes)");
    recs.push("Focus on mobility work for affected areas");
  }

  if (metrics.hydration.value < 6) {
    recs.push("Drink 500ml water in the next hour");
    recs.push("Add electrolytes to pre-game hydration");
  }

  if (acwr > 1.3) {
    recs.push("Monitor fatigue levels closely during competition");
  }

  return recs;
}
```

---

## Features Implemented

| Feature | Status |
|---------|--------|
| 6 readiness sliders | ✅ |
| Real-time score preview | ✅ |
| ACWR badge display | ✅ |
| Low score warnings (per metric) | ✅ |
| Notes/concerns text field | ✅ |
| Coach notification warning | ✅ |
| Post-submission recommendations | ✅ |
| Links to Tournament Nutrition | ✅ |
| Links to Game Plan | ✅ |

---

## Data Sources

| Data | Service | Method |
|------|---------|--------|
| ACWR value | `UnifiedTrainingService` | Current ACWR |
| Submission | `SupabaseService` | `game_day_readiness` table |
| Coach notification | Auto-triggered | On score < 70 |
