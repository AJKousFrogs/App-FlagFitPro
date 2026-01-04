# Wireframe: Sleep Debt Tracking

**Route:** Embedded in Wellness page OR `/sleep-debt`  
**Users:** All players  
**Status:** ⚠️ Needs Implementation  
**Source:** Referenced in `FEATURE_DOCUMENTATION.md` §38

---

## Purpose

Monitors cumulative sleep deficit and its impact on training capacity, recovery, and injury risk.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🌙 Sleep Debt Tracker                                                        │  │
│  │     Understanding your sleep deficit and its impact on performance            │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                            CURRENT SLEEP DEBT STATUS                                 │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                          SLEEP DEBT                                      │ │  │
│  │  │                                                                          │ │  │
│  │  │                        ┌─────────────┐                                   │ │  │
│  │  │                        │   7.5 hrs   │                                   │ │  │
│  │  │                        │   MODERATE  │                                   │ │  │
│  │  │                        │   🟡        │                                   │ │  │
│  │  │                        └─────────────┘                                   │ │  │
│  │  │                                                                          │ │  │
│  │  │  Accumulated over the past 7 days                                        │ │  │
│  │  │                                                                          │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 🌙 7-Day Avg    │  │ 📊 14-Day Avg   │  │ 🎯 Optimal      │  │ ⏳ Recovery     │  │
│  │    Sleep        │  │    Sleep        │  │    Target       │  │    Timeline     │  │
│  │                 │  │                 │  │                 │  │                 │  │
│  │    6.9 hrs      │  │    7.1 hrs      │  │    8.0 hrs      │  │    4 days       │  │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │  │    ─────────    │  │
│  │  🔴 Below opt.  │  │  🟡 Near target │  │  (for age 24)   │  │  to clear debt  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                             IMPACT ON PERFORMANCE                                    │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚡ Performance Impact Multipliers                                              │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Training Capacity                                                            │  │
│  │  ███████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 78%             │  │
│  │  Your body can only absorb 78% of planned training load effectively           │  │
│  │                                                                                │  │
│  │  Recovery Rate                                                                │  │
│  │  ██████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 70%             │  │
│  │  Recovery between sessions is 30% slower than optimal                         │  │
│  │                                                                                │  │
│  │  Injury Risk                                                                  │  │
│  │  ████████████████████████████████████████████░░░░░░░░░░░░░░░░ +75%            │  │
│  │  Injury risk increased by 75% compared to well-rested state                   │  │
│  │                                                                                │  │
│  │  Reaction Time                                                                │  │
│  │  ███████████████████████████████████████████░░░░░░░░░░░░░░░░░ +23%            │  │
│  │  Reaction time is 23% slower than baseline                                    │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 💡 AI RECOMMENDATION                                                           │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │ Your sleep debt is affecting your performance. To recover optimally:          │  │
│  │                                                                                │  │
│  │ • Add 30-60 minutes to your sleep time for the next 4 nights                  │  │
│  │ • Reduce training intensity to 80% until debt is cleared                      │  │
│  │ • Consider a 20-minute power nap between 1-3pm                                │  │
│  │ • Avoid caffeine after 2pm                                                    │  │
│  │ • Keep consistent bed/wake times (even weekends)                              │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               7-DAY SLEEP HISTORY                                    │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📊 Sleep vs Optimal (8 hrs)                                                    │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  8hrs │───────────────────────────────────────────── TARGET LINE              │  │
│  │       │                                                                        │  │
│  │  7hrs │      ████        ████        ████                                     │  │
│  │       │      ████        ████  ████  ████  ████                               │  │
│  │  6hrs │████  ████  ████  ████  ████  ████  ████                               │  │
│  │       │████  ████  ████  ████  ████  ████  ████                               │  │
│  │  5hrs │████  ████  ████  ████  ████  ████  ████                               │  │
│  │       │────────────────────────────────────────────                           │  │
│  │         Mon   Tue   Wed   Thu   Fri   Sat   Sun                               │  │
│  │        6.0h  7.0h  5.5h  7.2h  6.5h  7.5h  6.8h                               │  │
│  │                                                                                │  │
│  │  [BAR CHART - Daily sleep with 8hr target line]                              │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📈 Cumulative Debt Trend                                                       │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  10hrs│                                                                       │  │
│  │       │                                          ●                            │  │
│  │  8hrs │                               ●                                       │  │
│  │       │                    ●                     ●                            │  │
│  │  6hrs │         ●                                                             │  │
│  │       │    ●              ●                                                   │  │
│  │  4hrs │                                                                       │  │
│  │       │●                                                                      │  │
│  │  2hrs │                                                                       │  │
│  │       └──────────────────────────────────────────────────                     │  │
│  │        Mon   Tue   Wed   Thu   Fri   Sat   Sun                                │  │
│  │                                                                                │  │
│  │  [LINE CHART - Cumulative debt accumulation]                                 │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Sleep Requirements by Age

```typescript
const SLEEP_REQUIREMENTS = {
  junior:     { optimal: 9, minimum: 8 },   // 16-17 years
  youngAdult: { optimal: 8, minimum: 7 },   // 18-25 years
  adult:      { optimal: 7.5, minimum: 7 }  // 26+ years
};
```

---

## Sleep Debt Calculation

```typescript
function calculateSleepDebt(
  sleepHistory: SleepEntry[], 
  optimalHours: number
): SleepDebtAnalysis {
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
  
  return {
    cumulativeDebt,
    debtLevel,
    // ...
  };
}
```

---

## Debt Severity Levels

| Level | Hours | Color | Impact |
|-------|-------|-------|--------|
| None | 0 | 🟢 Green | 100% capacity |
| Mild | 1-4 | 🔵 Blue | 90% capacity |
| Moderate | 5-9 | 🟡 Yellow | 75-85% capacity |
| Severe | 10-14 | 🟠 Orange | 60-75% capacity |
| Critical | 15+ | 🔴 Red | <60% capacity |

---

## Impact Multipliers

```typescript
function calculateImpactMultipliers(cumulativeDebt: number): ImpactMultipliers {
  return {
    trainingCapacity: Math.max(0.5, 1 - (cumulativeDebt * 0.03)),
    recoveryRate: Math.max(0.4, 1 - (cumulativeDebt * 0.04)),
    injuryRiskMultiplier: 1 + (cumulativeDebt * 0.1),  // 10% increase per hour
    reactionTimeMultiplier: 1 + (cumulativeDebt * 0.03)  // 3% slower per hour
  };
}

// Example with 7.5 hours debt:
// Training: 78% (1 - 7.5 * 0.03)
// Recovery: 70% (1 - 7.5 * 0.04)
// Injury Risk: +75% (1 + 7.5 * 0.1)
// Reaction: +23% (1 + 7.5 * 0.03)
```

---

## Recovery Timeline

```typescript
function calculateRecoveryTimeline(
  debtHours: number, 
  extraSleepPerNight: number
): number {
  // Can't bank more than 1-2 hours extra per night
  const effectiveExtra = Math.min(extraSleepPerNight, 1.5);
  return Math.ceil(debtHours / effectiveExtra);
}

// Example: 7.5 hours debt, sleeping 1 hour extra per night
// Recovery: 8 nights
```

---

## Research Basis

```typescript
// Based on Mah et al. (2011), Halson (2014), Simpson et al. (2017)
const SLEEP_RESEARCH = {
  reactionTime: {
    finding: 'Reaction time decreases 300% with sleep deprivation',
    formula: (debtHours) => 1 + (debtHours * 0.15)
  },
  injuryRisk: {
    finding: 'Injury risk increases 1.7x with <8 hours sleep',
    threshold: 8,
    multiplier: 1.7
  },
  performance: {
    finding: 'Basketball players gained 9% sprint speed with sleep extension',
    optimalBoost: 1.09
  }
};
```

---

## Features to Implement

| Feature | Status | Priority |
|---------|--------|----------|
| Current Debt Display | ❌ | HIGH |
| 7-Day & 14-Day Averages | ❌ | HIGH |
| Optimal Target by Age | ❌ | MEDIUM |
| Recovery Timeline | ❌ | MEDIUM |
| Impact Multipliers | ❌ | HIGH |
| AI Recommendations | ❌ | MEDIUM |
| Sleep History Chart | ❌ | HIGH |
| Cumulative Debt Chart | ❌ | MEDIUM |

---

## Data Sources

| Data | Service | Table |
|------|---------|-------|
| Sleep entries | `WellnessService` | `wellness_checkins` |
| User age | `AuthService` | `profiles` |

---

## Integration Points

| Feature | Integration |
|---------|-------------|
| Wellness Check-in | Sleep hours logged daily |
| ACWR Dashboard | Adjusts sweet spot based on sleep |
| Training Recommendations | Reduces intensity when debt high |
| AI Coach | Provides sleep-aware advice |

---

## Related Pages

| Page | Route | Relationship |
|------|-------|--------------|
| Wellness | `/wellness` | Sleep logging |
| ACWR Dashboard | `/acwr-dashboard` | Load adjustments |
| Today's Practice | `/today` | Training modifications |
