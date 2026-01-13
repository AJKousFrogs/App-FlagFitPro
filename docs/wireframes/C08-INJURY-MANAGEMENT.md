# Wireframe: Injury Management

**Route:** `/coach/injuries`  
**Users:** Head Coach, Assistant Coach  
**Status:** ⚠️ Needs Implementation  
**Source:** `FEATURE_DOCUMENTATION.md` §37

---

## Purpose

Track team injuries, manage return-to-play protocols, monitor recovery progress, and maintain injury history for prevention insights.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🏥 Injury Management                                   [+ Report Injury]      │  │
│  │     Track injuries and recovery                                               │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  [Active Injuries]  [In Recovery]  [Cleared]  [All History]                   │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               INJURY SUMMARY                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 🔴 Active       │  │ 🟡 In RTP       │  │ 🟢 Cleared      │  │ 📊 This Season  │  │
│  │    Injuries     │  │    Protocol     │  │    This Month   │  │                 │  │
│  │                 │  │                 │  │                 │  │                 │  │
│  │      1          │  │      2          │  │      3          │  │      8          │  │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │  │    ─────────    │  │
│  │  Needs eval     │  │  Progressing    │  │  Back to full   │  │  Total injuries │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               ACTIVE INJURIES                                        │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🔴 NEW INJURY - Needs Evaluation                                        │  │  │
│  │  │ ─────────────────────────────────────────────────────────────────────── │  │  │
│  │  │                                                                         │  │  │
│  │  │ ┌────────┐  Morgan Davis (#21)                                         │  │  │
│  │  │ │        │  Position: DB                                               │  │  │
│  │  │ │  [📷]  │                                                             │  │  │
│  │  │ │        │  Injury: Hamstring strain (suspected)                       │  │  │
│  │  │ └────────┘  Reported: Today, 4:30 PM (during practice)                 │  │  │
│  │  │                                                                         │  │  │
│  │  │  How it happened: "Felt pull during sprint drill"                      │  │  │
│  │  │  Initial Severity: Moderate (player's assessment)                       │  │  │
│  │  │                                                                         │  │  │
│  │  │  Status: ⚠️ Awaiting medical evaluation                                │  │  │
│  │  │                                                                         │  │  │
│  │  │                     [Evaluate & Start RTP]  [Request Medical Report]   │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                            IN RETURN-TO-PLAY PROTOCOL                                │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🟡 STAGE 4 OF 7 - Sport-Specific Drills (60% intensity)                 │  │  │
│  │  │ ─────────────────────────────────────────────────────────────────────── │  │  │
│  │  │                                                                         │  │  │
│  │  │ ┌────────┐  Alex Thompson (#99)                                        │  │  │
│  │  │ │        │  Position: Rusher                                           │  │  │
│  │  │ │  [📷]  │                                                             │  │  │
│  │  │ │        │  Injury: ACL Sprain (Grade 2)                               │  │  │
│  │  │ └────────┘  Injury Date: Dec 15, 2025                                  │  │  │
│  │  │             Days in Protocol: 19                                        │  │  │
│  │  │                                                                         │  │  │
│  │  │  RTP Progress:                                                          │  │  │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │  │  │
│  │  │  │  1  │ │  2  │ │  3  │ │  4  │ │  5  │ │  6  │ │  7  │              │  │  │
│  │  │  │ ✓   │ │ ✓   │ │ ✓   │ │ ◉   │ │     │ │     │ │     │              │  │  │
│  │  │  │Rest │ │Light│ │Sport│ │Sport│ │Sport│ │Full │ │Clear│              │  │  │
│  │  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │  │  │
│  │  │                                                                         │  │  │
│  │  │  Current Stage Requirements:                                            │  │  │
│  │  │  • Sport-specific drills at 60% intensity                               │  │  │
│  │  │  • No contact activities                                                │  │  │
│  │  │  • Pain level must stay ≤ 2/10                                          │  │  │
│  │  │  • Complete 3 consecutive symptom-free sessions                         │  │  │
│  │  │                                                                         │  │  │
│  │  │  Today's Check-in:                                                      │  │  │
│  │  │  Pain: 1/10 ✓    Function: 7/10 ✓    Confidence: 8/10 ✓                │  │  │
│  │  │                                                                         │  │  │
│  │  │  Est. Full Return: Week 8 (Jan 20, 2026)                               │  │  │
│  │  │                                                                         │  │  │
│  │  │               [View Full RTP]  [Update Progress]  [Advance Stage]      │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🟡 STAGE 2 OF 7 - Light Activity (20% intensity)                        │  │  │
│  │  │ ─────────────────────────────────────────────────────────────────────── │  │  │
│  │  │                                                                         │  │  │
│  │  │ ┌────────┐  Emily Chen (#23)                                           │  │  │
│  │  │ │        │  Position: DB                                               │  │  │
│  │  │ │  [📷]  │                                                             │  │  │
│  │  │ │        │  Injury: Hip Flexor Strain (Minor)                          │  │  │
│  │  │ └────────┘  Injury Date: Jan 1, 2026                                   │  │  │
│  │  │             Days in Protocol: 2                                         │  │  │
│  │  │                                                                         │  │  │
│  │  │  RTP Progress: ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 14%                       │  │  │
│  │  │                                                                         │  │  │
│  │  │  Today's Check-in: Pain: 3/10    Function: 5/10    Confidence: 6/10    │  │  │
│  │  │                                                                         │  │  │
│  │  │  Est. Full Return: Jan 12, 2026                                        │  │  │
│  │  │                                                                         │  │  │
│  │  │               [View Full RTP]  [Update Progress]  [Advance Stage]      │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              INJURY ANALYTICS                                        │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────┐  ┌────────────────────────────────────┐ │  │
│  │  │ INJURY BY TYPE (This Season)     │  │ INJURY BY POSITION                 │ │  │
│  │  │                                  │  │                                    │ │  │
│  │  │  Hamstring: ████████ 4           │  │  DB:     ████████ 4                │ │  │
│  │  │  Ankle:     ██████ 3             │  │  WR:     ██████ 3                  │ │  │
│  │  │  ACL/Knee:  ██ 1                 │  │  Rusher: ██ 1                      │ │  │
│  │  │                                  │  │                                    │ │  │
│  │  └──────────────────────────────────┘  └────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  💡 Insight: Hamstring injuries are 50% of total. Consider adding more        │  │
│  │     dynamic warm-up time and hamstring-specific prehab exercises.             │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Report Injury Dialog

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 🏥 REPORT INJURY                                                           [×]    │
│ ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                    │
│  Player                                                                           │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Morgan Davis ▼                                                             │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  Injury Date                            Time of Injury                            │
│  ┌─────────────────────────────┐       ┌──────────────────────────────────────┐   │
│  │ Jan 3, 2026    📅           │       │ 4:30 PM ▼                            │   │
│  └─────────────────────────────┘       └──────────────────────────────────────┘   │
│                                                                                    │
│  Body Part                              Injury Type                               │
│  ┌─────────────────────────────┐       ┌──────────────────────────────────────┐   │
│  │ Hamstring ▼                 │       │ Strain / Pull ▼                      │   │
│  └─────────────────────────────┘       └──────────────────────────────────────┘   │
│                                                                                    │
│  Side                                   Initial Severity (player assessment)      │
│  ┌─────────────────────────────┐       ┌──────────────────────────────────────┐   │
│  │ (●) Left  ( ) Right         │       │ ( ) Mild  (●) Moderate  ( ) Severe   │   │
│  └─────────────────────────────┘       └──────────────────────────────────────┘   │
│                                                                                    │
│  How did it happen?                                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ ( ) During practice                                                        │   │
│  │ (●) During drill (which: Sprint drill                                   )  │   │
│  │ ( ) During game                                                            │   │
│  │ ( ) Outside of team activities                                             │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  Description                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Player felt pull in left hamstring during sprint drill. Stopped            │   │
│  │ immediately. Some pain on walking. No visible swelling.                    │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  Immediate Action Taken                                                           │
│  ☑ Ice applied                                                                   │
│  ☑ Player removed from activity                                                  │
│  ☐ Medical professional contacted                                                │
│  ☐ Sent for imaging                                                              │
│                                                                                    │
│                                              [Cancel]  [Report & Start RTP]      │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## RTP Protocol Detail View

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [← Injuries]  Return-to-Play: Alex Thompson                                        │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏥 ACL Sprain (Grade 2)                                        Status: Stage 4 │  │
│  │ ─────────────────────────────────────────────────────────────────────────────  │  │
│  │ Injury Date: Dec 15, 2025    Days in Protocol: 19    Est. Return: Week 8      │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              7-STAGE PROTOCOL PROGRESS                               │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───┐│  │
│  │  │ STAGE 1 │ │ STAGE 2 │ │ STAGE 3 │ │ STAGE 4 │ │ STAGE 5 │ │ STAGE 6 │ │ 7 ││  │
│  │  │ ✓ DONE  │ │ ✓ DONE  │ │ ✓ DONE  │ │ ◉ NOW   │ │         │ │         │ │   ││  │
│  │  │ Rest    │ │ Light   │ │ Sport   │ │ Sport   │ │ Sport   │ │ Full    │ │Clr││  │
│  │  │ 0%      │ │ 20%     │ │ 40%     │ │ 60%     │ │ 80%     │ │ 100%    │ │   ││  │
│  │  │ 3 days  │ │ 4 days  │ │ 5 days  │ │ 4 days  │ │         │ │         │ │   ││  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              CURRENT STAGE: 4 - SPORT-SPECIFIC                       │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  Intensity: 60%                        Duration: 5-7 days typical             │  │
│  │                                                                                │  │
│  │  Allowed Activities:                                                          │  │
│  │  ✓ Sport-specific drills (non-contact)                                        │  │
│  │  ✓ Position-specific movements                                                │  │
│  │  ✓ Moderate-intensity cardio                                                  │  │
│  │  ✗ Full-speed sprinting                                                       │  │
│  │  ✗ Contact drills                                                             │  │
│  │  ✗ Live scrimmage                                                             │  │
│  │                                                                                │  │
│  │  Progression Criteria:                                                        │  │
│  │  ☑ Complete 3 symptom-free sessions                       3/3                 │  │
│  │  ☑ Pain level stays ≤ 2/10                                ✓ Currently 1/10    │  │
│  │  ☑ No swelling after activity                             ✓                   │  │
│  │  ☐ Coach approval                                         [Approve]           │  │
│  │                                                                                │  │
│  │  ⚠️ Ready to advance to Stage 5                         [Advance to Stage 5]  │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              DAILY CHECK-IN LOG                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  Date      │ Stage │ Pain │ Function │ Confidence │ Notes                     │  │
│  │  ─────────────────────────────────────────────────────────────────────────────│  │
│  │  Jan 3     │  4    │ 1/10 │   7/10   │    8/10    │ Good session today       │  │
│  │  Jan 2     │  4    │ 1/10 │   7/10   │    7/10    │ Slight stiffness AM      │  │
│  │  Jan 1     │  4    │ 2/10 │   6/10   │    7/10    │ First day at 60%         │  │
│  │  Dec 31    │  3    │ 2/10 │   6/10   │    6/10    │ Advanced to Stage 4      │  │
│  │  Dec 30    │  3    │ 3/10 │   5/10   │    6/10    │ Feeling stronger         │  │
│  │  ...                                                                          │  │
│  │                                                                                │  │
│  │                                                    [View Full History]        │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              MEDICAL NOTES                                           │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  Dec 20, 2025 - Dr. Smith (Team Physician)                                    │  │
│  │  "MRI confirms Grade 2 ACL sprain. No surgical intervention needed.           │  │
│  │   Cleared to begin RTP protocol. Estimate 4-6 weeks to full clearance."       │  │
│  │                                                                                │  │
│  │  Dec 15, 2025 - Initial Assessment                                            │  │
│  │  "Non-contact injury during practice. Positive anterior drawer test.          │  │
│  │   Ice, compression applied. Referred for imaging."                            │  │
│  │                                                                                │  │
│  │  [+ Add Medical Note]                                         [Upload Report] │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature           | Description                      |
| ----------------- | -------------------------------- |
| Injury Reporting  | Quick injury documentation       |
| RTP Protocol      | 7-stage return-to-play tracking  |
| Daily Check-ins   | Pain/function/confidence logging |
| Medical Notes     | Physician documentation          |
| Analytics         | Injury patterns and prevention   |
| Stage Advancement | Approve protocol progression     |
| History           | Full injury history per player   |

---

## RTP Stages

| Stage | Name                  | Intensity | Criteria                    |
| ----- | --------------------- | --------- | --------------------------- |
| 1     | Rest                  | 0%        | Symptom resolution          |
| 2     | Light Activity        | 20%       | Walking, light stretching   |
| 3     | Sport-Specific (Low)  | 40%       | Basic drills, no contact    |
| 4     | Sport-Specific (Med)  | 60%       | Complex drills, no contact  |
| 5     | Sport-Specific (High) | 80%       | Full-speed, limited contact |
| 6     | Full Training         | 100%      | Full participation          |
| 7     | Cleared               | 100%      | Competition cleared         |

---

## Data Sources

| Data          | Service               | Table            |
| ------------- | --------------------- | ---------------- |
| Injuries      | `InjuryService`       | `injury_records` |
| RTP           | `ReturnToPlayService` | `rtp_protocols`  |
| Daily logs    | `ReturnToPlayService` | `rtp_daily_log`  |
| Medical notes | `MedicalService`      | `medical_notes`  |
