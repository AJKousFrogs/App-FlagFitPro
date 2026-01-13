# Wireframe: Menstrual Cycle Tracking (Female Athletes)

**Route:** `/cycle-tracking` (or embedded in Wellness)  
**Users:** Female Athletes only  
**Status:** ⚠️ Needs Implementation  
**Source:** Referenced in `FEATURE_DOCUMENTATION.md` §40

---

## Purpose

Enables female athletes to log and track their menstrual cycles, with the app automatically adapting:

- Training recommendations by phase
- Recovery protocols
- Nutrition guidance
- ACWR sweet spot adjustments

**Research shows cycle-aware training can improve performance by 5-15% and reduce injury risk.**

---

## Privacy Notice

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 🔒 PRIVACY FIRST                                                                   │
│ ──────────────────────────────────────────────────────────────────────────────────│
│ • This data is PRIVATE by default - only you can see it                           │
│ • Coaches only see "recovery day recommended" - never cycle details               │
│ • You control all sharing settings                                                │
│ • Data auto-deletes after 12 months                                               │
│ • You can export or delete your data anytime                                      │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🌸 Cycle Tracking                                       ┌──────────────────┐ │  │
│  │     Personalized training based on your cycle            │ + Log Period     │ │  │
│  │                                                          └──────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              CURRENT CYCLE STATUS                                    │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         CYCLE DAY 14                                     │ │  │
│  │  │                                                                          │ │  │
│  │  │                      ┌─────────────────┐                                 │ │  │
│  │  │                      │   OVULATION     │                                 │ │  │
│  │  │                      │   🔥 Peak       │                                 │ │  │
│  │  │                      │   Performance   │                                 │ │  │
│  │  │                      └─────────────────┘                                 │ │  │
│  │  │                                                                          │ │  │
│  │  │  [Menstrual]───[Follicular]───[●OVULATION●]───[Luteal Early]───[Luteal Late] │
│  │  │     Days 1-5      Days 6-13      Days 14-16       Days 17-22     Days 23-28  │
│  │  │                                                                          │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  Next Period Predicted: January 17 (±2 days)                                  │  │
│  │  Cycle Length: 28 days (avg based on 6 cycles)                                │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                          TODAY'S RECOMMENDATIONS                                     │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏋️ TRAINING RECOMMENDATIONS (Ovulation Phase)                                  │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Intensity Modifier: 110% (Can push 10% harder!)                              │  │
│  │                                                                                │  │
│  │  ✅ FOCUS AREAS                                                               │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ • Power & explosive movements                                            ││  │
│  │  │ • Speed work & sprints                                                   ││  │
│  │  │ • Max strength training                                                  ││  │
│  │  │ • Competition / game day                                                 ││  │
│  │  │ • Personal record attempts                                               ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  💡 KEY INSIGHTS                                                              │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 🔥 Peak performance window - best time for PRs!                          ││  │
│  │  │ 🎯 Schedule competitions here if possible                                ││  │
│  │  │ 💪 High pain tolerance - be careful not to overdo it                     ││  │
│  │  │ ⚠️ Slightly higher ACL injury risk - extended warm-up essential         ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ⚠️ INJURY AWARENESS                                                          │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ ACL Risk: ELEVATED (3-6x higher during ovulation)                        ││  │
│  │  │ Reason: Estrogen peak affects ligament laxity                            ││  │
│  │  │                                                                          ││  │
│  │  │ Precautions:                                                             ││  │
│  │  │ • Extended warm-up (15+ minutes)                                         ││  │
│  │  │ • Neuromuscular activation exercises                                     ││  │
│  │  │ • Avoid cold starts                                                      ││  │
│  │  │ • Extra focus on landing mechanics                                       ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🍎 NUTRITION RECOMMENDATIONS (Ovulation Phase)                                 │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Calorie Modifier: 100% (Standard)                                            │  │
│  │  Hydration: +5% (Slightly increased)                                          │  │
│  │                                                                                │  │
│  │  Priority Nutrients:                                                          │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │  │
│  │  │ 🐟 Omega-3      │  │ 🥩 Protein      │  │ 🫐 Antioxidants │                │  │
│  │  │   Anti-inflam.  │  │   Performance   │  │   Recovery      │                │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                │  │
│  │                                                                                │  │
│  │  💡 Support peak performance with quality protein and anti-inflammatory foods │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📊 ACWR ADJUSTMENT                                                             │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Your Base ACWR: 1.15                                                         │  │
│  │  Phase-Adjusted ACWR: 1.04 (adjusted for ovulation phase)                     │  │
│  │                                                                                │  │
│  │  Adjusted Sweet Spot Range: 0.9 - 1.5 (vs standard 0.8 - 1.3)                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ You're in the optimal zone! Good to train at full intensity.             ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               SYMPTOM TRACKING                                       │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📝 Today's Symptoms                                          [Log Symptoms]   │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Select any symptoms you're experiencing:                                     │  │
│  │                                                                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │ ☐ Cramps    │  │ ☐ Fatigue   │  │ ☐ Bloating  │  │ ☐ Headache  │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │ ☐ Mood      │  │ ☐ Back Pain │  │ ☐ Nausea    │  │ ☐ Other     │           │  │
│  │  │    Changes  │  │             │  │             │  │             │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  │                                                                                │  │
│  │  Symptom Severity:                                                            │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ ○ None  ○ Mild  ● Moderate  ○ Severe                                     ││  │
│  │  └───────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                CYCLE HISTORY                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📅 Recent Cycles                                                               │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Cycle        │ Start Date  │ Length │ Flow      │ Symptoms                   │  │
│  │  ─────────────────────────────────────────────────────────────────────────────│  │
│  │  Current      │ Jan 3, 2026 │ --     │ --        │ --                         │  │
│  │  December     │ Dec 6, 2025 │ 28 days│ Moderate  │ Cramps, Fatigue           │  │
│  │  November     │ Nov 8, 2025 │ 28 days│ Heavy     │ Cramps, Mood, Headache    │  │
│  │  October      │ Oct 11, 2025│ 28 days│ Moderate  │ Fatigue                   │  │
│  │  September    │ Sep 13, 2025│ 28 days│ Light     │ None                      │  │
│  │                                                                                │  │
│  │  Average Cycle Length: 28 days                                                │  │
│  │  Cycle Regularity: Very Regular (±1 day)                                      │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              LOG PERIOD DIALOG                                       │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🌸 LOG PERIOD                                                         [×]     │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Period Start Date                    Period End Date (optional)              │  │
│  │  ┌─────────────────────────┐          ┌─────────────────────────┐             │  │
│  │  │ January 3, 2026    📅   │          │ Select date        📅   │             │  │
│  │  └─────────────────────────┘          └─────────────────────────┘             │  │
│  │                                                                                │  │
│  │  Flow Intensity                                                               │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ ( ) Light   (●) Moderate   ( ) Heavy                                     ││  │
│  │  └───────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  Symptoms (select all that apply)                                             │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ ☑ Cramps   ☑ Fatigue   ☐ Bloating   ☐ Headache   ☐ Mood Changes         ││  │
│  │  │ ☐ Back Pain   ☐ Nausea   ☐ Breast Tenderness   ☐ Other                  ││  │
│  │  └───────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  Notes (optional)                                                             │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ Started in the evening                                                   ││  │
│  │  └───────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │                                    [Cancel]  [Save]                           │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               PRIVACY SETTINGS                                       │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🔒 Privacy Controls                                                            │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Who can see your cycle data?                                                 │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ (●) Only me (default)                                                    ││  │
│  │  │ ( ) Me + Athletic Trainer                                                ││  │
│  │  │ ( ) Me + Coach (anonymized as "recovery day")                            ││  │
│  │  └───────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  Data Retention                                                               │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ Auto-delete data older than: [12 months ▼]                               ││  │
│  │  └───────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                            │  │
│  │  │ 📥 Export My Data   │  │ 🗑️ Delete All Data  │                            │  │
│  │  └─────────────────────┘  └─────────────────────┘                            │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase Training Adaptations

| Phase        | Days  | Intensity | Focus Areas                                | Avoid                                | Recovery |
| ------------ | ----- | --------- | ------------------------------------------ | ------------------------------------ | -------- |
| Menstrual    | 1-5   | 70%       | Recovery, mobility, light cardio           | High intensity, heavy lifting, plyos | 130%     |
| Follicular   | 6-13  | 100%      | Strength, skill work, endurance            | None                                 | 90%      |
| Ovulation    | 14-16 | 110%      | Power, speed, max strength, competition    | None (but warm-up crucial)           | 85%      |
| Luteal Early | 17-22 | 95%       | Endurance, moderate strength               | Extreme heat training                | 100%     |
| Luteal Late  | 23-28 | 80%       | Technique, flexibility, light conditioning | High intensity, heavy plyos          | 120%     |

---

## Phase Nutrition Adaptations

| Phase        | Calories | Priority Nutrients                   | Hydration | Notes                                |
| ------------ | -------- | ------------------------------------ | --------- | ------------------------------------ |
| Menstrual    | 100%     | Iron, Vitamin C, Magnesium           | +10%      | Iron loss - increase iron-rich foods |
| Follicular   | 95%      | Protein, Complex Carbs               | 100%      | Higher insulin sensitivity           |
| Ovulation    | 100%     | Omega-3, Protein, Antioxidants       | +5%       | Support peak performance             |
| Luteal Early | 105%     | Complex Carbs, Magnesium, B Vitamins | +15%      | Metabolism increasing                |
| Luteal Late  | 110%     | Magnesium, Calcium, Omega-3, B6      | +10%      | Peak metabolism, cravings            |

---

## ACWR Sweet Spot Adjustments

```typescript
const adjustedSweetSpot = {
  menstrual: { min: 0.6, max: 1.0 }, // More conservative
  follicular: { min: 0.8, max: 1.3 }, // Standard
  ovulation: { min: 0.9, max: 1.5 }, // Can push harder
  luteal_early: { min: 0.75, max: 1.2 }, // Slightly conservative
  luteal_late: { min: 0.65, max: 1.1 }, // Conservative
};
```

---

## Features to Implement

| Feature                      | Status | Priority |
| ---------------------------- | ------ | -------- |
| Current Cycle Status Display | ❌     | HIGH     |
| Phase Visualization          | ❌     | HIGH     |
| Training Recommendations     | ❌     | HIGH     |
| Nutrition Recommendations    | ❌     | MEDIUM   |
| ACWR Adjustment Display      | ❌     | HIGH     |
| Injury Risk Awareness        | ❌     | HIGH     |
| Symptom Tracking             | ❌     | MEDIUM   |
| Log Period Dialog            | ❌     | HIGH     |
| Cycle History Table          | ❌     | MEDIUM   |
| Prediction Algorithm         | ❌     | MEDIUM   |
| Privacy Controls             | ❌     | HIGH     |
| Data Export                  | ❌     | LOW      |
| Data Delete                  | ❌     | LOW      |

---

## Research Basis

- **ACL Injury Risk**: Wojtys et al. (1998), Hewett et al. (2007) - 3-6x higher ACL injury risk during ovulation
- **Performance Variation**: McNulty et al. (2020) - Meta-analysis showing phase-dependent performance
- **Training Adaptations**: Wikström-Frisén et al. (2017) - Follicular phase strength training more effective
- **Iron Needs**: DellaValle & Haas (2014) - Female athletes need 70% more iron

---

## Data Sources

| Data             | Service           | Table              |
| ---------------- | ----------------- | ------------------ |
| Cycle entries    | `CycleService`    | `menstrual_cycles` |
| Symptom logs     | `CycleService`    | `cycle_symptoms`   |
| User preferences | `SettingsService` | `user_settings`    |

---

## Related Pages

| Page                 | Route             | Relationship                 |
| -------------------- | ----------------- | ---------------------------- |
| Wellness             | `/wellness`       | Recovery metrics integration |
| ACWR Dashboard       | `/acwr-dashboard` | Adjusted sweet spot          |
| Training Schedule    | `/training`       | Phase-based recommendations  |
| Tournament Nutrition | `/game/nutrition` | Cycle-aware hydration        |
