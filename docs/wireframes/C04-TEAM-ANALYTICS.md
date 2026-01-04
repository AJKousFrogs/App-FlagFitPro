# Wireframe: Team Analytics

**Route:** `/coach/analytics`  
**Users:** Head Coach, Assistant Coach  
**Status:** ⚠️ Needs Implementation  
**Source:** `FEATURE_DOCUMENTATION.md` §16

---

## Purpose

Comprehensive team-wide analytics dashboard showing aggregate performance metrics, trends, comparisons, and insights to inform coaching decisions.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📊 Team Analytics                                     [Export PDF] [Share]    │  │
│  │     Panthers • Season 2025-2026                                               │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Period: [Last 7 Days ▼]     Compare: [Previous Period ▼]                     │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               TEAM HEALTH OVERVIEW                                   │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 💚 Team         │  │ 📊 Avg ACWR     │  │ ✅ Check-in     │  │ 🏥 Availability │  │
│  │    Readiness    │  │                 │  │    Rate         │  │                 │  │
│  │                 │  │                 │  │                 │  │                 │  │
│  │      76%        │  │      1.12       │  │      89%        │  │      87%        │  │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │  │    ─────────    │  │
│  │  ▲ +4% vs last  │  │  ▼ -0.05 good   │  │  ▲ +5% vs last  │  │  13/15 healthy  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              TEAM READINESS TREND                                    │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  100% ┤                                                                        │  │
│  │       │         ●───●                                                          │  │
│  │   80% ┤     ●───●   ●───●───●                                                  │  │
│  │       │ ●───●               ●───●                                              │  │
│  │   60% ┤                                                                        │  │
│  │       │                                                                        │  │
│  │   40% ┤                                                                        │  │
│  │       └──────────────────────────────────────────────────────────────────────  │  │
│  │         Mon    Tue    Wed    Thu    Fri    Sat    Sun                         │  │
│  │                                                                                │  │
│  │  ── Team Readiness    ── Avg ACWR (inverted)    ── Check-in Rate              │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                            TRAINING LOAD DISTRIBUTION                                │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────┐  ┌──────────────────────────────────────┐   │  │
│  │  │ ACWR DISTRIBUTION            │  │ WEEKLY LOAD BY PLAYER                │   │  │
│  │  │                              │  │                                      │   │  │
│  │  │  🟢 Optimal (0.8-1.3): 10    │  │  Sarah J.    ████████████████  2,450 │   │  │
│  │  │  🟡 High (1.3-1.5):    3     │  │  Marcus W.   ██████████████████ 2,890│   │  │
│  │  │  🔴 Danger (>1.5):     1     │  │  Chris M.    ████████████████████ 3,200│  │  │
│  │  │  ⚪ Low (<0.8):        1     │  │  Emily C.    ████████████  1,890     │   │  │
│  │  │                              │  │  Jake R.     ███████████████  2,200  │   │  │
│  │  │  [PIE CHART]                 │  │  Taylor S.   █████████████  2,100    │   │  │
│  │  │                              │  │  ...                                 │   │  │
│  │  │                              │  │                                      │   │  │
│  │  └──────────────────────────────┘  └──────────────────────────────────────┘   │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                            PLAYER RISK MATRIX                                        │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  High Wellness │                        │  IDEAL ZONE    │                    │  │
│  │       (80%+)   │    ○ Taylor            │  ● Sarah       │    ○ Marcus        │  │
│  │                │    ○ Drew              │  ● Riley       │                    │  │
│  │  ──────────────┼────────────────────────┼────────────────┼────────────────────│  │
│  │  Med Wellness  │                        │  ○ Jake        │    ⚠ Chris         │  │
│  │    (60-79%)    │    ○ Morgan            │  ○ Jordan      │    (HIGH ACWR)     │  │
│  │                │                        │                │                    │  │
│  │  ──────────────┼────────────────────────┼────────────────┼────────────────────│  │
│  │  Low Wellness  │  ⚠ Emily               │                │                    │  │
│  │     (<60%)     │  (hip tightness)       │                │                    │  │
│  │                │                        │                │                    │  │
│  │  ──────────────┴────────────────────────┴────────────────┴────────────────────│  │
│  │                   Low ACWR (<0.8)     Optimal (0.8-1.3)    High ACWR (>1.3)   │  │
│  │                                                                                │  │
│  │  ● In optimal zone    ○ Monitor    ⚠ Action needed                           │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                           WELLNESS BREAKDOWN                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  Team Averages (Last 7 Days)                                                  │  │
│  │                                                                                │  │
│  │  Sleep Hours      ████████████████████░░░░░░░░░░ 7.2 hrs (Target: 8)         │  │
│  │  Sleep Quality    ██████████████████████░░░░░░░░ 7.5/10                       │  │
│  │  Energy           ███████████████████████░░░░░░░ 7.8/10                       │  │
│  │  Soreness         ██████████████░░░░░░░░░░░░░░░░ 4.2/10 (lower=better)       │  │
│  │  Stress           █████████████░░░░░░░░░░░░░░░░░ 3.8/10 (lower=better)       │  │
│  │  Motivation       █████████████████████████░░░░░ 8.2/10                       │  │
│  │                                                                                │  │
│  │  ⚠️ Sleep hours below target - consider earlier lights out                    │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                          PERFORMANCE COMPARISONS                                     │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  Position Group Performance                        vs League Avg              │  │
│  │                                                                                │  │
│  │  Quarterbacks                                                                 │  │
│  │  40-Yard: 4.68s avg    Pro Agility: 4.35s    QBR: 105.2       ▲ +8%          │  │
│  │                                                                                │  │
│  │  Wide Receivers                                                               │  │
│  │  40-Yard: 4.52s avg    Vertical: 33.5\"       Catch Rate: 78%  ▲ +12%         │  │
│  │                                                                                │  │
│  │  Defensive Backs                                                              │  │
│  │  40-Yard: 4.55s avg    Pro Agility: 4.15s    INT Rate: 8.5%   ▲ +5%          │  │
│  │                                                                                │  │
│  │  Rushers                                                                      │  │
│  │  10m Sprint: 1.58s     L-Drill: 7.2s         Sack Rate: 12%   ▼ -3%          │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                           AI INSIGHTS (MERLIN)                                       │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🤖 Team Analysis                                                               │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  💡 "Team readiness has improved 4% this week. Sleep quality is the main     │  │
│  │      driver - players averaging 7.5 hours vs 6.8 last week."                  │  │
│  │                                                                                │  │
│  │  ⚠️ "Chris Martinez is showing signs of overtraining (ACWR 1.42). Consider   │  │
│  │      reducing his load by 25% or giving him an extra rest day."               │  │
│  │                                                                                │  │
│  │  📈 "WR group is outperforming league average by 12%. Strong tournament       │  │
│  │      potential if current form is maintained."                                │  │
│  │                                                                                │  │
│  │  🎯 "Recommendation: Focus Thursday practice on rusher technique - sack       │  │
│  │      rate is 3% below league average."                                        │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---------|-------------|
| Team Health Cards | Readiness, ACWR, check-ins, availability |
| Trend Charts | 7/30/90 day performance trends |
| Load Distribution | ACWR pie chart, per-player bars |
| Risk Matrix | 2D plot of wellness vs ACWR |
| Wellness Breakdown | Team average by metric |
| Position Comparison | Group performance vs benchmarks |
| AI Insights | Merlin's team analysis |
| Export | PDF reports, shareable links |

---

## Time Period Options

| Period | Description |
|--------|-------------|
| Last 7 Days | Default view |
| Last 14 Days | Two-week trend |
| Last 30 Days | Monthly view |
| Last 90 Days | Quarterly view |
| This Season | Full season data |
| Custom Range | Date picker |

---

## Data Sources

| Data | Service | Table |
|------|---------|-------|
| Team metrics | `TeamAnalyticsService` | Aggregated |
| Player wellness | `WellnessService` | `wellness_checkins` |
| ACWR data | `LoadMonitoringService` | `acwr_calculations` |
| Performance | `PlayerMetricsService` | `performance_records` |
| AI insights | `AiCoachService` | Generated |
