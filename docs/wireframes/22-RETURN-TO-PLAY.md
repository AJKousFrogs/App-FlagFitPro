# Wireframe: Return-to-Play Protocol

**Route:** `/return-to-play`  
**Users:** Injured Players, Coaches, Medical Staff  
**Status:** ⚠️ Needs Implementation  
**Source:** Referenced in `FEATURE_DOCUMENTATION.md` §37

---

## Purpose

Evidence-based graduated protocols for athletes returning from injury or extended absence, minimizing re-injury risk.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🏥 Return-to-Play Protocol                             ┌──────────────────┐ │  │
│  │     Guided recovery from injury                         │ + Start Protocol │ │  │
│  │                                                          └──────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                            ACTIVE RECOVERY PROTOCOL                                  │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🦵 Left Hamstring Strain                            Started: Dec 20, 2025      │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Severity: Moderate (Grade II)                    Est. Recovery: 14-21 days   │  │
│  │  Day 12 of Recovery                               Target Return: Jan 5, 2026  │  │
│  │                                                                                │  │
│  │  Overall Progress:                                                            │  │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░ 65% Complete             │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              7-STAGE PROTOCOL PROGRESS                               │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐         │  │
│  │  │  1  │ → │  2  │ → │  3  │ → │  4  │ → │  5  │ → │  6  │ → │  7  │         │  │
│  │  │ ✓   │   │ ✓   │   │ ✓   │   │ ◉   │   │     │   │     │   │     │         │  │
│  │  │Rest │   │Light│   │Sport│   │Sport│   │Sport│   │Full │   │Full │         │  │
│  │  │     │   │Activ│   │Low  │   │Med  │   │High │   │Train│   │Comp │         │  │
│  │  │ 0%  │   │ 20% │   │ 40% │   │ 60% │   │ 80% │   │100% │   │100% │         │  │
│  │  └─────┘   └─────┘   └─────┘   └─────┘   └─────┘   └─────┘   └─────┘         │  │
│  │                           ↑                                                   │  │
│  │                       CURRENT                                                 │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                         CURRENT STAGE: SPORT-SPECIFIC MODERATE                       │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Stage 4: Sport-Specific Moderate                       Load: 60%              │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  📅 Day 3 of Stage 4 (Minimum: 3 days)                                       │  │
│  │                                                                                │  │
│  │  ✅ ALLOWED ACTIVITIES                                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ • Position-specific drills at 60% intensity                              ││  │
│  │  │ • Jogging with direction changes                                         ││  │
│  │  │ • Non-contact team drills                                                ││  │
│  │  │ • Agility work (controlled)                                              ││  │
│  │  │ • Sport-specific movements at moderate pace                              ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ❌ RESTRICTIONS                                                              │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ • No full-speed sprinting                                                ││  │
│  │  │ • No competition/scrimmage                                               ││  │
│  │  │ • No explosive cutting movements                                         ││  │
│  │  │ • No plyometrics                                                         ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  🎯 PROGRESSION CRITERIA (Complete ALL to advance)                            │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ ☑ Pain-free during all Stage 4 activities                                ││  │
│  │  │ ☑ No swelling or tenderness at injury site                               ││  │
│  │  │ ☐ Complete 3 consecutive pain-free sessions                              ││  │
│  │  │ ☐ ROM > 90% of uninjured side                                            ││  │
│  │  │ ☐ Strength > 80% of uninjured side                                       ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │                              [Ready to Advance →]                             │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                DAILY TRACKING                                        │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📝 Today's Check-in                                                           │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Pain Level (0-10)                    Function Score (%)                      │  │
│  │  0 = No pain, 10 = Severe             Compared to pre-injury baseline         │  │
│  │  ┌───────────────────────────┐        ┌───────────────────────────┐           │  │
│  │  │  [−]     2     [+]        │        │  [−]     75%    [+]       │           │  │
│  │  │  ●●○○○○○○○○               │        │  ████████████████░░░░     │           │  │
│  │  └───────────────────────────┘        └───────────────────────────┘           │  │
│  │                                                                                │  │
│  │  Confidence Level (1-10)              Activities Completed Today              │  │
│  │  Trust in injured area                                                        │  │
│  │  ┌───────────────────────────┐        ┌───────────────────────────┐           │  │
│  │  │  [−]     7     [+]        │        │ ☑ Morning mobility        │           │  │
│  │  │                           │        │ ☑ Position drills         │           │  │
│  │  └───────────────────────────┘        │ ☑ Jogging (10 min)        │           │  │
│  │                                        │ ☐ Agility work            │           │  │
│  │                                        └───────────────────────────┘           │  │
│  │                                                                                │  │
│  │  Notes                                                                        │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐       │  │
│  │  │ Felt slight tightness during direction changes. Stretched after.   │       │  │
│  │  └────────────────────────────────────────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │                                    [Save Check-in]                            │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📈 Recovery Progress Chart                                                     │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │     10 │  ●                                                                   │  │
│  │        │   ●                                                                  │  │
│  │ Pain   │    ●                                                                 │  │
│  │ Level  │     ●                                                                │  │
│  │      5 │      ●                                                               │  │
│  │        │       ●  ●                                                           │  │
│  │        │           ●  ●                                                       │  │
│  │      0 │               ●  ●  ●                                                │  │
│  │        └──────────────────────────────────────────                            │  │
│  │         Day 1  Day 3  Day 5  Day 7  Day 9  Day 11                             │  │
│  │                                                                                │  │
│  │  [LINE CHART - Pain level over time]                                         │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                            START NEW PROTOCOL DIALOG                                 │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏥 START RETURN-TO-PLAY PROTOCOL                                      [×]     │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Injury Type                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐       │  │
│  │  │ ( ) Muscle Strain                                                  │       │  │
│  │  │ ( ) Ligament Sprain                                                │       │  │
│  │  │ ( ) Tendinopathy                                                   │       │  │
│  │  │ ( ) Bone Stress                                                    │       │  │
│  │  │ ( ) Concussion                                                     │       │  │
│  │  │ ( ) Illness                                                        │       │  │
│  │  │ ( ) General Absence (2+ weeks)                                     │       │  │
│  │  └────────────────────────────────────────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │  Injury Location                      Severity                                │  │
│  │  ┌─────────────────────────┐          ┌─────────────────────────┐             │  │
│  │  │ Left Hamstring     ▼    │          │ Moderate (Grade II) ▼   │             │  │
│  │  └─────────────────────────┘          └─────────────────────────┘             │  │
│  │                                                                                │  │
│  │  Injury Date                          Expected Return Date                    │  │
│  │  ┌─────────────────────────┐          ┌─────────────────────────┐             │  │
│  │  │ Dec 20, 2025       📅   │          │ Jan 5, 2026 (auto)  📅  │             │  │
│  │  └─────────────────────────┘          └─────────────────────────┘             │  │
│  │                                                                                │  │
│  │  Medical Professional Notes (optional)                                        │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐       │  │
│  │  │ Diagnosed by team physio. MRI confirmed Grade II strain.           │       │  │
│  │  └────────────────────────────────────────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │  ☑ I understand this protocol and will follow it responsibly                  │  │
│  │  ☑ Coach will be notified of my recovery status                               │  │
│  │                                                                                │  │
│  │                                    [Cancel]  [Start Protocol]                 │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7-Stage Protocol

| Stage | Name                    | Load % | Min Days | Activities                         | Progression Criteria                    |
| ----- | ----------------------- | ------ | -------- | ---------------------------------- | --------------------------------------- |
| 1     | Rest                    | 0%     | 2        | Complete rest, medical treatment   | Pain at rest < 2/10, swelling reduced   |
| 2     | Light Activity          | 20%    | 3        | Walking, light stretching, pool    | Pain-free walking, ROM 90% normal       |
| 3     | Sport-Specific Low      | 40%    | 3        | Position drills low intensity      | Pain-free at 40%, light jogging OK      |
| 4     | Sport-Specific Moderate | 60%    | 3        | Drills moderate intensity, jogging | 3 pain-free sessions, ROM/strength 80%+ |
| 5     | Sport-Specific High     | 80%    | 3        | Full drills, non-contact           | Sprint pain-free, strength 90%+         |
| 6     | Full Training           | 100%   | 2        | Full team training                 | Complete full practice                  |
| 7     | Full Competition        | 100%   | N/A      | Cleared for games                  | Coach + medical clearance               |

---

## Muscle Strain Protocol Example

```typescript
const MUSCLE_STRAIN_PROTOCOL: ReturnProtocol = {
  injuryType: "muscle_strain",
  stages: [
    {
      stage: 1,
      name: "Initial Rest",
      minimumDays: 2,
      loadPercentage: 0,
      activities: ["Rest", "Ice", "Compression", "Elevation"],
      restrictions: ["No running", "No sport activity"],
      progressionCriteria: ["Pain at rest < 2/10", "Swelling reduced"],
    },
    {
      stage: 2,
      name: "Light Activity",
      minimumDays: 3,
      loadPercentage: 20,
      activities: ["Walking", "Gentle stretching", "Pool walking"],
      restrictions: ["No sprinting", "No cutting"],
      progressionCriteria: ["Pain-free walking", "ROM 90% of normal"],
    },
    // ... stages 3-7
  ],
  totalMinimumDays: 14,
  evidenceBase: "Blanch & Gabbett 2016",
};
```

---

## Re-injury Risk Assessment

```typescript
function assessReinjuryRisk(
  injury: InjuryRecord,
  trainingData: TrainingData,
): RiskLevel {
  const factors = {
    rushingReturn:
      injury.daysInRecovery < injury.protocol.totalMinimumDays * 0.8,
    previousReinjury: injury.reinjuryCount > 0,
    highACWR: trainingData.acwr > 1.3,
    poorSleep: trainingData.avgSleep < 7,
    incompleteCriteria: !allCriteriaMet(injury),
  };

  const riskScore = Object.values(factors).filter(Boolean).length;

  if (riskScore >= 3) return { level: "high", color: "danger" };
  if (riskScore >= 2) return { level: "moderate", color: "warn" };
  return { level: "low", color: "success" };
}
```

---

## Features to Implement

| Feature                          | Status | Priority |
| -------------------------------- | ------ | -------- |
| Active Recovery Protocol Display | ❌     | HIGH     |
| 7-Stage Visual Progress          | ❌     | HIGH     |
| Current Stage Details            | ❌     | HIGH     |
| Allowed Activities List          | ❌     | HIGH     |
| Restrictions List                | ❌     | HIGH     |
| Progression Criteria Checklist   | ❌     | HIGH     |
| Daily Check-in Form              | ❌     | HIGH     |
| Pain Level Tracking              | ❌     | HIGH     |
| Function Score                   | ❌     | MEDIUM   |
| Confidence Level                 | ❌     | MEDIUM   |
| Recovery Progress Chart          | ❌     | MEDIUM   |
| Start Protocol Dialog            | ❌     | HIGH     |
| Injury Type Selection            | ❌     | HIGH     |
| Severity Selection               | ❌     | HIGH     |
| Coach Notification               | ❌     | MEDIUM   |
| Re-injury Risk Warning           | ❌     | MEDIUM   |

---

## Data Sources

| Data               | Service               | Table            |
| ------------------ | --------------------- | ---------------- |
| Injury records     | `ReturnToPlayService` | `injury_records` |
| Daily check-ins    | `ReturnToPlayService` | `rtp_daily_log`  |
| Protocol templates | `ReturnToPlayService` | `rtp_protocols`  |

---

## Related Pages

| Page           | Route             | Relationship          |
| -------------- | ----------------- | --------------------- |
| Wellness       | `/wellness`       | Recovery metrics      |
| ACWR Dashboard | `/acwr-dashboard` | Load monitoring       |
| Roster         | `/roster`         | Injury status display |
