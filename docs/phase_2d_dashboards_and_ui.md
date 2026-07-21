# Phase 2d: ACWR Dashboards & UI Components

**Status:** Specification for Phase 2d dashboard implementation (5–6 weeks after Phase 2a deployment)  
**Design basis:** `docs/phase_2_schema_and_acwr_calculator.md`  
**Depends on:** Phase 2a schema + Phase 2b endpoints + Phase 2c recovery engine  

---

## Overview

Phase 2d delivers four connected dashboards and UI components to visualize ACWR data, RTP progress, and recovery modality effectiveness. All dashboards are real-time (via Supabase subscriptions) and role-gated (athletes see own data; staff see team).

---

## 1. Athlete RTP Progress Dashboard

**Route:** `/return-to-play/:injuryId`  
**Audience:** Athlete + coaching staff  
**Data source:** `rtp_phase_progress`, `athlete_injuries`, `psychological_assessments`

### Layout

```
┌─ Injury Summary Card ─────────────────────────────────────────┐
│ ACL Reconstruction (Right Knee)                               │
│ Injured: June 15, 2026 | Expected Return: June 30, 2027      │
│ Current Phase: 3 / Early Strength | Progress: 18 weeks       │
└───────────────────────────────────────────────────────────────┘

┌─ Phase Progression Timeline ──────────────────────────────────┐
│                                                               │
│ [Phase 0]──[Phase 1]──[Phase 2]──[Phase 3]-->[Phase 4]--...  │
│ Protect   6w  ROM    6w  Strength 8w  Power   12w  Sport    │
│ ✓        ✓         ✓          ✓         ⧖        —           │
│                                                               │
│ Current phase: 3 / Early Strength (Week 18 of 20 target)     │
│ Progress: 18 / 52 weeks (35%)                                │
└───────────────────────────────────────────────────────────────┘

┌─ Functional Criteria Compliance ──────────────────────────────┐
│                                                               │
│ Strength LSI              ████████░░  85%  (target: ≥90%)     │
│ Hop Test Battery          ███████░░░  75%  (target: ≥90%)     │
│ ACL-RSI (Psychological)   ███████░░░  72/100  (target: ≥56)  │
│ TSK-11 (Fear-Avoidance)   █████░░░░░  32/55  (target: <37)   │
│                                                               │
│ Overall Readiness: 78% (Not ready for next phase; 12% gap)  │
└───────────────────────────────────────────────────────────────┘

┌─ Weekly Progress Card ────────────────────────────────────────┐
│ Week ending June 25                                           │
│ Strength LSI: 85% (↑3% from last week)                       │
│ Pain Level: 2/10 (↓1 from last week)                         │
│ Athlete Confidence: 7/10 | Coach Confidence: 6/10            │
│ ACWR Target: 0.7–1.0 | Compliance: 82%                       │
│                                                               │
│ [Ready for Next Phase?]  Not yet – need hop tests ≥90%      │
└───────────────────────────────────────────────────────────────┘

┌─ Assessment History (Scrollable) ─────────────────────────────┐
│ Week    │ Strength LSI │ Hop Tests │ ACL-RSI │ TSK-11 │ Ready │
│ ────────┼──────────────┼───────────┼─────────┼────────┼───────│
│ Week 18 │ 85%          │ 75%       │ 72      │ 32     │ ⧖     │
│ Week 17 │ 82%          │ 72%       │ 70      │ 35     │ ⧖     │
│ Week 16 │ 79%          │ 68%       │ 65      │ 38     │ ⧖     │
│ ...     │ ...          │ ...       │ ...     │ ...    │ ...   │
└───────────────────────────────────────────────────────────────┘
```

### Components

- **InjurySummaryCard**: Title, injury type, dates, phase, progress %
- **PhaseProgressTimeline**: Visual 5-mesocycle progression + current phase marker
- **FunctionalCriteriaGrid**: Grouped bars for strength/hop/psych metrics with target lines
- **WeeklyProgressCard**: Editable form for coaches to log weekly snapshot + confidence
- **AssessmentHistoryTable**: Scrollable table of all weekly assessments with trend arrows
- **ReadinessGate**: Conditional button (disabled if criteria < targets) to advance phase

### Data Queries

```sql
-- Latest RTP progress
SELECT * FROM rtp_phase_progress
WHERE user_id = $1 AND injury_id = $2
ORDER BY week_ending DESC
LIMIT 1;

-- Assessment history
SELECT * FROM psychological_assessments
WHERE user_id = $1 AND injury_id = $2
ORDER BY assessment_date DESC
LIMIT 12;
```

---

## 2. Team ACWR Heatmap (Position-Based Load)

**Route:** `/coach/acwr-team-heatmap`  
**Audience:** Coaching staff (head coach, assistant coach)  
**Data source:** `acwr_snapshots`, `athlete_training_config` (positions), `team_members`

### Layout

```
┌─ Team ACWR Heatmap ───────────────────────────────────────────┐
│                                                                │
│ Date: [June 25, 2026] ◀ Today ▶  Zoom: [2 weeks ▼]          │
│                                                                │
│ Position │ Athlete          │ ACWR │ Status  │ Acute/Chronic  │
│ ─────────┼──────────────────┼──────┼─────────┼────────────────│
│ QB       │ Joe Smith        │ 2.1  │ 🔴 Red  │ 150 / 100 AU   │
│ QB       │ Backup QB        │ 0.9  │ 🟢 Safe │ 85 / 95 AU     │
│          │                  │      │         │                │
│ WR       │ FastBoi™         │ 1.4  │ 🟡 Yel  │ 135 / 95 AU    │
│ WR       │ SecureHands      │ 0.8  │ 🟢 Safe │ 75 / 95 AU     │
│ WR       │ InjuryLand       │ 0.3  │ 🟡 Undr │ 30 / 95 AU     │
│          │                  │      │         │                │
│ DB       │ ShutDown D       │ 1.1  │ 🟢 Safe │ 105 / 95 AU    │
│ DB       │ Coverage         │ 1.0  │ 🟢 Safe │ 95 / 95 AU     │
│ DB       │ SafetyNet        │ 0.7  │ 🟡 Undr │ 65 / 95 AU     │
│          │                  │      │         │                │
│ OL       │ BlockerA         │ 0.9  │ 🟢 Safe │ 85 / 95 AU     │
│ OL       │ BlockerB         │ 1.2  │ 🟢 Safe │ 110 / 95 AU    │
│                                                                │
│ Legend:   🔴 Red (ACWR > 1.8)  🟡 Yellow (> 1.3)              │
│           🟢 Safe (0.8–1.3)      🟡 Underload (< 0.8)         │
│                                                                │
│ Team Summary: 10 Safe | 2 Yellow | 1 Red | 1 Underload       │
└────────────────────────────────────────────────────────────────┘
```

### Components

- **TeamACWRHeatmap**: Table with position grouping, color-coded cells (red/yellow/green)
- **ACWRStatusBadge**: 🔴 🟡 🟢 indicators with tooltip (ratio, load components)
- **DateRangeSelector**: Drill into 1-day / 7-day / 2-week views
- **PositionFilter**: Checkbox filter by position
- **TeamSummaryBar**: Count of status buckets; click to drill

### Data Queries

```sql
-- Daily ACWR snapshot for all team members
SELECT
  tm.user_id,
  u.full_name,
  atc.position,
  acwr.acwr_ratio,
  acwr.acwr_status,
  acwr.acute_load_au,
  acwr.chronic_load_au,
  acwr.snapshot_date
FROM public.team_members tm
JOIN auth.users u ON tm.user_id = u.id
JOIN public.athlete_training_config atc ON tm.user_id = atc.user_id
LEFT JOIN public.acwr_snapshots acwr 
  ON tm.user_id = acwr.user_id AND acwr.snapshot_date = CURRENT_DATE
WHERE tm.team_id = $1 AND tm.status = 'active'
ORDER BY atc.position, u.full_name;
```

---

## 3. Recovery Modality Effectiveness Dashboard

**Route:** `/athlete/recovery-effectiveness` or `/coach/recovery-insights`  
**Audience:** Athlete + staff (physiotherapist, coach)  
**Data source:** `athlete_recovery_logs`, `recovery_modalities`, training/performance data

### Layout

```
┌─ Recovery Modality Effectiveness ─────────────────────────────┐
│                                                                │
│ Time Period: [Last 4 weeks ▼]  Filter: [All Modalities ▼]   │
│                                                                │
│ Modality            │ Count │ Avg Effectiveness │ Trend     │
│ ────────────────────┼───────┼───────────────────┼──────────│
│ Foam Rolling        │ 12    │ 7.2/10  ████████░ │ ↑ +0.3   │
│ Massage Gun         │ 8     │ 8.1/10  █████████░│ ↑ +0.5   │
│ Ice Bath            │ 6     │ 7.8/10  ████████░ │ ↔ 0.0    │
│ Compression Boots   │ 4     │ 6.9/10  ███████░░ │ ↓ -0.4   │
│ Sleep Optimization  │ 28    │ 8.7/10  █████████░│ ↑ +0.2   │
│ Yoga / Mobility     │ 5     │ 7.4/10  ████████░ │ ↑ +0.6   │
│ Stretching          │ 15    │ 6.8/10  ███████░░ │ ↓ -0.2   │
│                                                                │
│ [Details]  [Log Recovery]  [Export Report]                   │
└────────────────────────────────────────────────────────────────┘

┌─ Effectiveness by Recovery Domain ────────────────────────────┐
│                                                                │
│ Domain              │ Top Modality      │ Avg Score │ Trend  │
│ ────────────────────┼───────────────────┼───────────┼────────│
│ Sleep Recovery      │ Sleep Opt. (8.7)  │ 8.2/10    │ ↑      │
│ Soreness Reduction  │ Massage Gun (8.1) │ 7.8/10    │ ↑      │
│ Mobility            │ Yoga (7.4)        │ 7.1/10    │ ↑      │
│ Mental Recovery     │ Sleep Opt. (8.7)  │ 8.1/10    │ ↔      │
└────────────────────────────────────────────────────────────────┘

┌─ Correlation with ACWR Status ────────────────────────────────┐
│                                                                │
│ When ACWR was RED, top 3 effective modalities:                │
│   1. Sleep Optimization (8.9/10, n=12)                        │
│   2. Ice Bath (8.4/10, n=6)                                   │
│   3. Massage Gun (8.0/10, n=5)                                │
│                                                                │
│ When ACWR was YELLOW, top 3:                                  │
│   1. Massage Gun (8.3/10, n=8)                                │
│   2. Foam Rolling (7.5/10, n=10)                              │
│   3. Compression Boots (7.1/10, n=6)                          │
└────────────────────────────────────────────────────────────────┘
```

### Components

- **ModalityEffectivenessTable**: Sortable table (count, avg rating, trend arrow)
- **EffectivenessTrendChart**: Line chart (effectiveness over time per modality)
- **DomainBreakdown**: Grouped effectiveness by recovery category
- **ACWRCorrelation**: Conditional display of top modalities per ACWR status
- **RecoveryLogForm**: Quick-add form (modality, date, effectiveness 1–10)

### Data Queries

```sql
-- Effectiveness by modality (last 4 weeks)
SELECT
  rm.id,
  rm.name,
  COUNT(*) as usage_count,
  AVG(arl.perceived_effectiveness_1_10) as avg_effectiveness,
  STDDEV(arl.perceived_effectiveness_1_10) as std_dev
FROM public.athlete_recovery_logs arl
JOIN public.recovery_modalities rm ON arl.recovery_modality_id = rm.id
WHERE arl.user_id = $1
  AND arl.log_date >= CURRENT_DATE - 28
GROUP BY rm.id, rm.name
ORDER BY avg_effectiveness DESC;

-- Correlation with ACWR status
SELECT
  rm.name,
  acwr.acwr_status,
  AVG(arl.perceived_effectiveness_1_10) as avg_effectiveness,
  COUNT(*) as count
FROM public.athlete_recovery_logs arl
JOIN public.recovery_modalities rm ON arl.recovery_modality_id = rm.id
LEFT JOIN public.acwr_snapshots acwr 
  ON arl.user_id = acwr.user_id AND arl.log_date = acwr.snapshot_date
WHERE arl.user_id = $1 AND arl.log_date >= CURRENT_DATE - 28
GROUP BY rm.name, acwr.acwr_status
ORDER BY acwr.acwr_status, avg_effectiveness DESC;
```

---

## 4. Coach Analytics: Injury Timeline & RTP Rate

**Route:** `/coach/injury-analytics`  
**Audience:** Head coach, medical staff  
**Data source:** `athlete_injuries`, `rtp_phase_progress`, `training_sessions`, `readiness_scores`

### Layout

```
┌─ Injury Timeline (Season Overview) ────────────────────────────┐
│                                                                 │
│ May  Jun  Jul  Aug  Sep  Oct  Nov  Dec  Jan  Feb  Mar  Apr   │
│ ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼──  │
│ │    │ 🔴 │    │ 🔴 │    │ 🟢 │    │ 🔴 │    │ 🟢 │    │    │
│ │    │ 🔴 │    │ 🟠 │    │ 🟠 │    │ 🔴 │    │ 🟢 │    │    │
│ │    │ 🟠 │ 🟢 │    │ 🟠 │ 🟡 │ 🔴 │ 🟠 │ 🟠 │ 🟢 │    │    │
│ │    │ 🟢 │    │ 🟠 │    │ 🟠 │ 🟠 │ 🟢 │ 🟡 │ 🟠 │    │    │
│ │    │    │ 🟡 │ 🟠 │    │ 🔴 │ 🟡 │ 🟢 │ 🟢 │ 🟢 │    │    │
│ │    │    │    │ 🔴 │    │ 🟢 │ 🟢 │ 🟡 │ 🟠 │ 🟡 │    │    │
│ └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴──  │
│
│ Legend:   🔴 Active (recovery_status='active')
│           🟠 Recovering (recovery_status='recovering')
│           🟡 Rehab (recovery_status='rehab')
│           🟢 Returned (recovery_status='returned')
│
│ Hover: Shows athlete name, injury type, date
└──────────────────────────────────────────────────────────────┘

┌─ Injury Summary Statistics ───────────────────────────────────┐
│                                                                │
│ Total Injuries This Season: 18                                │
│ Currently Active: 3  |  Recovering: 5  |  Returned: 10        │
│                                                                │
│ Average RTP Timeline:  52 days (range: 14–180 days)          │
│ Avg RTP Rate (Complete Return): 89% (16/18 athletes)          │
│                                                                │
│ Most Common: Ankle Sprain (n=5), Hamstring (n=3), Knee (n=2) │
└──────────────────────────────────────────────────────────────┘

┌─ RTP Rate by Injury Type ─────────────────────────────────────┐
│                                                                │
│ Ankle Sprain        ███████████████░ 86% (6/7)  Avg 18 days  │
│ Hamstring Strain    ████████████░░░░ 80% (4/5)  Avg 22 days  │
│ ACL Reconstruction  ██████████░░░░░░ 67% (2/3)  Avg 120 days │
│ Shoulder           █████████████░░░░ 75% (3/4)  Avg 45 days  │
│ Knee / Patellar    ██████████████░░░ 83% (5/6)  Avg 56 days  │
│                                                                │
│ [Export Report]  [Adjust Protocols]                           │
└────────────────────────────────────────────────────────────────┘
```

### Components

- **InjuryTimeline**: Calendar heatmap (each row = athlete, columns = months, cells = status)
- **InjurySummaryStats**: KPI cards (total, active, avg RTP timeline, RTP rate %)
- **RTPRateByInjury**: Horizontal bar chart (injury type, RTP %, avg days)
- **InjuryDetailModal**: Click injury in timeline → detail card (athlete, dates, phase)
- **AverageRTPComparison**: Position/age/gender subgroups (optional drill-down)

### Data Queries

```sql
-- Injury timeline (all active + historical)
SELECT
  ai.id,
  u.full_name,
  ai.injury_type,
  ai.injury_date,
  ai.expected_return_date,
  ai.actual_return_date,
  ai.recovery_status,
  EXTRACT(EPOCH FROM (COALESCE(ai.actual_return_date, CURRENT_DATE) - ai.injury_date)) / 86400.0 as days_rtp
FROM public.athlete_injuries ai
JOIN auth.users u ON ai.user_id = u.id
JOIN public.team_members tm ON ai.user_id = tm.user_id
WHERE tm.team_id = $1
ORDER BY ai.injury_date DESC;

-- RTP rate by injury type
SELECT
  injury_type,
  COUNT(*) as total,
  SUM(CASE WHEN recovery_status = 'returned' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100 as rtp_rate,
  AVG(EXTRACT(EPOCH FROM (actual_return_date - injury_date)) / 86400.0) as avg_days_rtp
FROM public.athlete_injuries
WHERE team_id = $1
GROUP BY injury_type
ORDER BY total DESC;
```

---

## 5. Implementation Roadmap (Phase 2d)

### Week 1: Dashboard Scaffolding
- [ ] Create `analytics/` feature directory (standalone module)
- [ ] Route guards (role-check: `isCoach`, `isPhysio`, `isAthlete`)
- [ ] Supabase realtime subscriptions for `acwr_snapshots`, `rtp_phase_progress`
- [ ] Shared utilities (date range picker, ACWR status badge, trend arrow)

### Week 2: RTP Progress Dashboard
- [ ] InjurySummaryCard, PhaseProgressTimeline components
- [ ] FunctionalCriteriaGrid (animated progress bars, color-coded targets)
- [ ] WeeklyProgressForm (date picker, confidence sliders, coach notes)
- [ ] AssessmentHistoryTable (sortable, filterable by date range)
- [ ] Unit tests: phase advance gating, readiness computation

### Week 3: Team ACWR Heatmap
- [ ] TeamACWRHeatmap table component (position-grouped rows)
- [ ] ACWRStatusBadge (interactive, shows load components on hover)
- [ ] PositionFilter checkbox, date range drill-down
- [ ] Realtime subscription (auto-update when acwr_snapshots changes)
- [ ] e2e test: coach loads heatmap, sees all athletes, filters by position

### Week 4: Recovery Modality Dashboard
- [ ] ModalityEffectivenessTable (rank by avg rating, usage count)
- [ ] EffectivenessTrendChart (line chart, Recharts library)
- [ ] RecoveryLogForm (quick-add, date, modality dropdown, effectiveness 1–10 slider)
- [ ] ACWRCorrelationCard (conditional: show top 3 modalities per red/yellow/green status)
- [ ] Unit tests: aggregate effectiveness, correlation logic

### Week 5: Coach Injury Analytics
- [ ] InjuryTimeline heatmap (calendar grid, color-coded by recovery_status)
- [ ] InjurySummaryStats KPI cards
- [ ] RTPRateByInjury bar chart, sortable
- [ ] InjuryDetailModal (click timeline cell → detail card with player info)
- [ ] Export button (CSV: injury type, timeline, RTP rate, notes)

### Week 6: Polish & Testing
- [ ] Accessibility audit (WCAG 2.1 AA: focus visible, color contrast, screen reader)
- [ ] E2E tests (coach navigates dashboards, logs data, filters views)
- [ ] Performance: lazy-load charts, virtual scrolling for large athlete lists
- [ ] Mobile responsiveness (tablet-first, responsive grids)
- [ ] Data validation: no null crashes, graceful empty states

---

## 6. API Dependencies

All Phase 2d dashboards depend on Phase 2b–2c endpoints:

| Endpoint | Dashboard | Method | Query |
|----------|-----------|--------|-------|
| `/api/rtp/phase-progress` | RTP Progress | GET/POST | athleteId, injuryId |
| `/api/rtp/psychological-assessment` | RTP Progress | GET/POST | athleteId |
| `/api/recovery-recommendations` | Recovery Modality | GET | athleteId, date |
| `/api/acwr-snapshots` | Team Heatmap | GET | teamId, date |
| `/api/athlete-recovery-logs` | Recovery Modality | GET/POST | athleteId, date |

Realtime subscriptions (via `core/services/realtime.service.ts`):
- `acwr_snapshots` (team ACWR heatmap updates)
- `rtp_phase_progress` (RTP dashboard progress)
- `athlete_recovery_logs` (recovery modality log stream)

---

## 7. Design System & Tokens

All dashboards use FlagFit Pro's existing design tokens:

- **Colors:**
  - ACWR Red: `var(--danger)` (ACWR > 1.8)
  - ACWR Yellow: `var(--caution)` (1.3–1.8)
  - ACWR Green: `var(--good)` (0.8–1.3)
  - Underload: `var(--info)` (< 0.8)

- **Charts:** Recharts library (consistent with existing Stats dashboards)
- **Tables:** Angular Material matTable (consistent with rosters, schedules)
- **Icons:** FlagFit icon set + Material Design Icons
- **Spacing/Sizing:** CSS custom properties (--spacing-* variables)

---

## 8. Phase 2 Complete: Next Steps (Phase 3+)

After Phase 2d is shipped:

- **Phase 3:** Automated alerts + notifications
  - Real-time coach alert when athlete ACWR enters red zone
  - Low readiness alert triggers recovery-focus recommendation
  - Injury milestone notifications (gate unlock, RTP confirmation)

- **Phase 4:** AI-assisted periodization
  - Integration with daily-protocol engine
  - Automated phase advancement gating (bypass coach input on clear criteria)
  - Predictive re-injury risk scoring (ML model on prior injury + biomarkers)

- **Phase 5:** Wearable & external data integration
  - HRV-based recovery tracking (pull from Oura, WHOOP)
  - CMJ via smartphone camera (pose estimation, automated vs manual)
  - Blood biomarker sync (lab results auto-ingest)

---
