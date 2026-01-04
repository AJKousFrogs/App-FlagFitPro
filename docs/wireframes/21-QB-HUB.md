# Wireframe: QB Hub (Quarterback Training)

**Route:** `/qb`  
**Users:** Quarterbacks only  
**Status:** ⚠️ Needs Implementation  
**Source:** Referenced in `FEATURE_DOCUMENTATION.md` §27

---

## Purpose

Flag football QBs throw **8x more** than NFL QBs in tournament play (320+ throws vs ~40). The QB Hub provides:
- Throwing volume tracking to build toward tournament capacity
- Arm care compliance monitoring
- QB-specific periodization

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🏈 QB Hub                                               ┌──────────────────┐ │  │
│  │     Quarterback-specific training & arm care tracking    │ + Log Throws     │ │  │
│  │                                                          └──────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                           PROGRESSION STATUS DASHBOARD                               │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🎯 Current Phase: BUILDING                              Week 3 of 4           │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░ 45% to Tournament Ready │  │
│  │                                                                                │  │
│  │  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐          │  │
│  │  │Foundation│ → │ Building│ → │Peak Load│ → │ Tourney │ → │ 320 Sim │          │  │
│  │  │   ✓     │   │  ◉      │   │         │   │  Ready  │   │         │          │  │
│  │  │ 100/day │   │ 150/day │   │ 200/day │   │ 250/day │   │ 320/day │          │  │
│  │  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘          │  │
│  │                                                                                │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 💡 AI RECOMMENDATION                                                      ││  │
│  │  │ ─────────────────────────────────────────────────────────────────────────││  │
│  │  │ You're on track! Avg 142 throws/session this week.                       ││  │
│  │  │ Target: 150 throws/session for Building phase.                           ││  │
│  │  │ Next milestone: Peak Load phase in 8 days.                               ││  │
│  │  └───────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                 WEEKLY STATS                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 🎯 Total Throws │  │ 📊 Sessions     │  │ 💪 Arm Feeling  │  │ ✅ Arm Care     │  │
│  │    This Week    │  │    This Week    │  │    Average      │  │    Compliance   │  │
│  │                 │  │                 │  │                 │  │                 │  │
│  │    568          │  │    4            │  │    3.2/10       │  │    87%          │  │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │  │    ─────────    │  │
│  │  Target: 600    │  │  Target: 4-5    │  │  🟢 Fresh       │  │  🟢 Good        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📈 Weekly Throw Volume                                                         │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │    200 │                      ████                                            │  │
│  │        │              ████    ████                                            │  │
│  │    150 │      ████    ████    ████    ████                                    │  │
│  │        │      ████    ████    ████    ████                                    │  │
│  │    100 │      ████    ████    ████    ████                                    │  │
│  │        │      ████    ████    ████    ████                                    │  │
│  │     50 │      ████    ████    ████    ████                                    │  │
│  │        │──────────────────────────────────────────────                        │  │
│  │          Mon    Tue    Wed    Thu    Fri    Sat    Sun                        │  │
│  │                                                                                │  │
│  │  [BAR CHART - Throws per day with target line]                               │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              THROW DISTANCE BREAKDOWN                                │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🎯 This Week's Throw Mix                                                       │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Short (0-10 yds)         ████████████████████████████████████ 312 (55%)      │  │
│  │                                                                                │  │
│  │  Medium (10-20 yds)       █████████████████████████ 185 (33%)                 │  │
│  │                                                                                │  │
│  │  Long (20+ yds)           ████████ 71 (12%)                                   │  │
│  │                                                                                │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 💡 TIP: Tournament games require 60% short, 25% medium, 15% long.         ││  │
│  │  │ Consider adding more long throws in your next session.                    ││  │
│  │  └───────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                ARM CARE COMPLIANCE                                   │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🛡️ Arm Care Protocol Status                                                    │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Pre-Throwing Warm-up (30 min)         ████████████████████░░░ 85% (4/5 days) │  │
│  │  • Band work, shoulder mobility, core activation, light throws                │  │
│  │                                                                                │  │
│  │  Post-Throwing Arm Care                ██████████████████████░░ 90% (4/5 days)│  │
│  │  • Stretching, band deceleration, massage                                     │  │
│  │                                                                                │  │
│  │  Ice Sessions (for 100+ throws)        █████████████████████████ 100% (3/3)   │  │
│  │  • 15-20 min ice application                                                  │  │
│  │                                                                                │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ ⚠️ Missed warm-up on Tuesday. Your arm feeling was 5/10 that day.         ││  │
│  │  │ Consistency in arm care prevents injury.                                  ││  │
│  │  └───────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               RECENT THROWING SESSIONS                               │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Date     │ Type        │ Throws │ Short │ Med │ Long │ Arm Feel │ Arm Care   │  │
│  │  ─────────────────────────────────────────────────────────────────────────────│  │
│  │  Today    │ Practice    │   142  │   82  │  45 │  15  │  3/10 🟢 │ ✓✓✓        │  │
│  │  Thu      │ Drill Work  │   156  │   90  │  50 │  16  │  4/10 🟢 │ ✓✓✓        │  │
│  │  Tue      │ Practice    │   138  │   78  │  45 │  15  │  5/10 🟡 │ ✗✓✓        │  │
│  │  Mon      │ Warm-up     │   132  │   72  │  45 │  15  │  3/10 🟢 │ ✓✓✓        │  │
│  │                                                                                │  │
│  │  Arm Care Legend: ✓✓✓ = Warm-up / Arm Care / Ice                              │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              LOG THROWING SESSION DIALOG                             │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏈 LOG THROWING SESSION                                               [×]     │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Session Type                                                                 │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐       │  │
│  │  │ [ ] Practice  [ ] Warm-up  [ ] Drill Work  [ ] Game  [ ] Tournament │       │  │
│  │  │ [ ] 320 Simulation                                                 │       │  │
│  │  └────────────────────────────────────────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │  ═══════════════ THROW COUNTS ═══════════════                                 │  │
│  │                                                                                │  │
│  │  Total Throws           Short (0-10 yds)          Medium (10-20 yds)          │  │
│  │  ┌───────────────┐      ┌───────────────┐         ┌───────────────┐           │  │
│  │  │ 142           │      │ 82            │         │ 45            │           │  │
│  │  └───────────────┘      └───────────────┘         └───────────────┘           │  │
│  │                                                                                │  │
│  │  Long (20+ yds)                                                               │  │
│  │  ┌───────────────┐                                                            │  │
│  │  │ 15            │                                                            │  │
│  │  └───────────────┘                                                            │  │
│  │                                                                                │  │
│  │  ═══════════════ ARM STATUS ═══════════════                                   │  │
│  │                                                                                │  │
│  │  Arm Feeling Before (1-10)              Arm Feeling After (1-10)              │  │
│  │  1 = Fresh, 10 = Fatigued               1 = Fresh, 10 = Fatigued              │  │
│  │  ┌───────────────────────────┐          ┌───────────────────────────┐         │  │
│  │  │  [−]     2     [+]        │          │  [−]     4     [+]        │         │  │
│  │  └───────────────────────────┘          └───────────────────────────┘         │  │
│  │                                                                                │  │
│  │  ═══════════════ ARM CARE COMPLIANCE ═══════════════                          │  │
│  │                                                                                │  │
│  │  ☑ Completed 30-min pre-throwing warm-up                                      │  │
│  │     (Band work, shoulder mobility, core activation, light throws)             │  │
│  │                                                                                │  │
│  │  ☑ Completed post-throwing arm care                                           │  │
│  │     (Stretching, band deceleration work, massage)                             │  │
│  │                                                                                │  │
│  │  ☑ Applied ice (15-20 min) - REQUIRED for 100+ throws                         │  │
│  │                                                                                │  │
│  │  Mechanics Focus / Notes                                                      │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐       │  │
│  │  │ Working on release point consistency                               │       │  │
│  │  └────────────────────────────────────────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │                                    [Cancel]  [Save Session]                   │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Progression Phases

```typescript
const QB_PROGRESSION_PHASES = [
  { 
    name: 'Foundation', 
    targetThrowsPerSession: 100, 
    durationWeeks: 4, 
    description: 'Build base throwing capacity'
  },
  { 
    name: 'Building', 
    targetThrowsPerSession: 150, 
    durationWeeks: 4, 
    description: 'Increase volume progressively'
  },
  { 
    name: 'Peak Load', 
    targetThrowsPerSession: 200, 
    durationWeeks: 3, 
    description: 'Approach competition volume'
  },
  { 
    name: 'Tournament Ready', 
    targetThrowsPerSession: 250, 
    durationWeeks: 2, 
    description: 'Near-competition volume'
  },
  { 
    name: '320 Simulation', 
    targetThrowsPerSession: 320, 
    durationWeeks: 1, 
    description: 'Full tournament simulation'
  }
];
```

---

## Arm Feeling Interpretation

```typescript
function interpretArmFeeling(score: number): ArmStatus {
  if (score <= 3) return { 
    status: 'Fresh',
    color: 'success',
    recommendation: 'Good to throw at full volume'
  };
  if (score <= 6) return { 
    status: 'Moderate',
    color: 'warn',
    recommendation: 'Monitor fatigue, consider reducing volume'
  };
  return { 
    status: 'Fatigued',
    color: 'danger',
    recommendation: 'Rest day recommended'
  };
}
```

---

## Weekly Volume Limits

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
    preTournament: 150,   // 2 days before
    tournamentDay: 320    // Expected max
  }
};
```

---

## Arm Care Protocol

```typescript
const ARM_CARE_PROTOCOL = {
  preThrowingWarmup: {
    duration: '30 min',
    required: true,
    activities: [
      'Band work (internal/external rotation)',
      'Shoulder mobility',
      'Core activation',
      'Light throws (50%)'
    ]
  },
  postThrowingCare: {
    duration: '15-20 min',
    required: true,
    activities: [
      'Stretching (shoulder, chest, lat)',
      'Band deceleration work',
      'Massage (forearm, bicep)',
      'Ice (if 100+ throws)'
    ]
  },
  iceRecommendation: {
    threshold: 100,
    duration: '15-20 min',
    required: true
  }
};
```

---

## Features to Implement

| Feature | Status | Priority |
|---------|--------|----------|
| Progression Status Dashboard | ❌ | HIGH |
| Current Phase Display | ❌ | HIGH |
| Phase Progress Bar | ❌ | HIGH |
| AI Recommendation | ❌ | MEDIUM |
| Weekly Stats Cards | ❌ | HIGH |
| Weekly Throw Volume Chart | ❌ | HIGH |
| Throw Distance Breakdown | ❌ | HIGH |
| Distance Mix Analysis | ❌ | MEDIUM |
| Arm Care Compliance Section | ❌ | HIGH |
| Compliance Progress Bars | ❌ | MEDIUM |
| Recent Sessions Table | ❌ | HIGH |
| Log Throwing Session Dialog | ❌ | HIGH |
| Session Type Selection | ❌ | HIGH |
| Throw Count by Distance | ❌ | HIGH |
| Arm Feeling Before/After | ❌ | HIGH |
| Arm Care Checkboxes | ❌ | HIGH |
| Notes Field | ❌ | LOW |

---

## Data Sources

| Data | Service | Table |
|------|---------|-------|
| Throwing sessions | `ApiService` | `qb_throwing_sessions` |
| Arm care compliance | `ApiService` | `qb_arm_care_log` |
| User progression | `ApiService` | `qb_progression` |

---

## Related Pages

| Page | Route | Relationship |
|------|-------|--------------|
| Performance Tracking | `/performance-tracking` | General metrics |
| Training Schedule | `/training` | Session planning |
| Wellness | `/wellness` | Recovery status |
