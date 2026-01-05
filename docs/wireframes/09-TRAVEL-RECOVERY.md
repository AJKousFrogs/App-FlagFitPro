# Wireframe: Travel Recovery

**Route:** `/travel/recovery`  
**Users:** Players, Coaches  
**Status:** ✅ Fully Implemented  
**Source:** `angular/src/app/features/travel/travel-recovery/travel-recovery.component.ts`

---

## Overview

Travel Recovery provides evidence-based protocols for:

1. **Flight Travel** - Jet lag management for international competitions (LA28, Brisbane 2032)
2. **Car Travel** - Blood circulation management for long drives (6-12+ hours)

---

## Skeleton Wireframe - Travel Type Selector

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🌍 Travel Recovery Protocol                              ┌──────────────────┐│  │
│  │  Optimize your recovery for peak competition performance  │   + New Trip     ││  │
│  │                                                           └──────────────────┘│  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐           │
│  │  ✈️  FLIGHT TRAVEL              │  │  🚗  CAR TRAVEL                 │           │
│  │      ─────────────────          │  │      ─────────────────          │           │
│  │      Jet lag protocols          │  │      6-12+ hour drives          │           │
│  │      [SELECTED]                 │  │                                 │           │
│  └─────────────────────────────────┘  └─────────────────────────────────┘           │
│                                                                                      │
```

---

## Section A: Flight Travel - Planning Form

```
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏅 OLYMPIC TRAVEL PLANNER                                                      │  │
│  │    Quick setup for LA28 or Brisbane 2032                                       │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌───────────────────────────────┐  ┌───────────────────────────────┐         │  │
│  │  │  🇺🇸 Los Angeles 2028         │  │  🇦🇺 Brisbane 2032             │         │  │
│  │  │      UTC-8                    │  │      UTC+10                    │         │  │
│  │  │      [SELECTED]               │  │                                │         │  │
│  │  └───────────────────────────────┘  └───────────────────────────────┘         │  │
│  │                                                                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │  │
│  │  │       9         │  │    Eastward     │  │       5         │                │  │
│  │  │   Time Zones    │  │    Direction    │  │   Recovery Days │                │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🗺️ TRIP DETAILS                                                                │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Trip Name                           Home Timezone                            │  │
│  │  ┌─────────────────────────────┐     ┌─────────────────────────────────────┐  │  │
│  │  │ World Championships 2025    │     │ ▼ Select your home timezone         │  │  │
│  │  └─────────────────────────────┘     └─────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  Destination Timezone                Departure Date                           │  │
│  │  ┌─────────────────────────────┐     ┌─────────────────────────────────────┐  │  │
│  │  │ ▼ Select destination timezone│     │ 📅 DD/MM/YYYY                      │  │  │
│  │  └─────────────────────────────┘     └─────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  Arrival Date                        Competition Date (Optional)              │  │
│  │  ┌─────────────────────────────┐     ┌─────────────────────────────────────┐  │  │
│  │  │ 📅 DD/MM/YYYY                │     │ 📅 DD/MM/YYYY                      │  │  │
│  │  └─────────────────────────────┘     └─────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  Flight Duration (hours)             Number of Layovers                       │  │
│  │  ┌─────────────────────────────┐     ┌─────────────────────────────────────┐  │  │
│  │  │  [−]      10 hrs      [+]   │     │  [−]        0        [+]           │  │  │
│  │  └─────────────────────────────┘     └─────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │                    ┌──────────────────────────────────────┐                   │  │
│  │                    │  ⚡ Generate Recovery Protocol       │                   │  │
│  │                    └──────────────────────────────────────┘                   │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
```

---

## Section B: Flight Travel - Active Protocol Dashboard

```
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ JET LAG SEVERITY CARD                                                         │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │    ┌───────────────┐         World Championships 2025                         │  │
│  │    │      7.5      │                                                          │  │
│  │    │   Jet Lag     │         ┌─────────────┐ ┌──────────────┐ ┌─────────────┐│  │
│  │    │    Score      │         │ 9 Time Zones│ │   Eastward →│ │  Moderate   ││  │
│  │    └───────────────┘         └─────────────┘ └──────────────┘ └─────────────┘│  │
│  │                                                                                │  │
│  │    📅 Estimated Recovery: 5 days                                              │  │
│  │    🚩 Competition in 7 days                                                   │  │
│  │                                                                                │  │
│  │    Expected Symptoms: ┌────────┐ ┌────────┐ ┌───────────────┐ ┌────────────┐ │  │
│  │                       │Fatigue │ │Insomnia│ │ Concentration │ │  Appetite  │ │  │
│  │                       └────────┘ └────────┘ └───────────────┘ └────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ☀️ TODAY'S PROTOCOL                                            Day 2 │ Post   │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  🌙 SLEEP WINDOW                    ☀️ LIGHT EXPOSURE                         │  │
│  │  ┌─────────────────────────┐       ┌─────────────────────────────────────────┐│  │
│  │  │ Bedtime      Wake Up    │       │ ☀️ SEEK bright light 07:00 - 11:00      ││  │
│  │  │  22:00   →    06:00     │       │    Helps reset circadian rhythm         ││  │
│  │  └─────────────────────────┘       │ 🕶️ AVOID light 15:00 - 18:00           ││  │
│  │                                    │    Prevents delayed adaptation          ││  │
│  │                                    └─────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ⚡ TRAINING                        💧 HYDRATION TARGET                       │  │
│  │  ┌─────────────────────────┐       ┌─────────────────────────────────────────┐│  │
│  │  │ Intensity: Moderate     │       │             3.0L                        ││  │
│  │  │ Max: 60 min             │       │   Stay well hydrated throughout         ││  │
│  │  │ ✅ Light jogging        │       └─────────────────────────────────────────┘│  │
│  │  │ ✅ Mobility work        │                                                  │  │
│  │  │ ❌ Avoid high intensity │                                                  │  │
│  │  └─────────────────────────┘                                                  │  │
│  │                                                                                │  │
│  │  🎯 KEY ACTIONS                                                               │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 07:00 │ Get outside for morning sunlight exposure        │ HIGH │       ││  │
│  │  │ 12:00 │ Light workout - avoid strenuous exercise         │ MEDIUM │     ││  │
│  │  │ 14:00 │ 20-min power nap if needed (not longer)          │ MEDIUM │     ││  │
│  │  │ 21:00 │ Dim lights, start wind-down routine              │ HIGH │       ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  💊 SUPPLEMENTS                                                               │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ Melatonin 3mg      │ 30 min before bed │ Helps reset sleep cycle         ││  │
│  │  │ ⚠️ Don't exceed 5mg; avoid if flying again within 24 hours              ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📅 FULL RECOVERY TIMELINE                                                      │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ▼ 2 days before         Tue, Jul 10        PRE-TRAVEL                        │  │
│  │  ─────────────────────────────────────────────────────────────────────────── │  │
│  │  │  Sleep: 23:00 - 07:00  │  Training: Moderate (60min)  │  Hydration: 2.5L  │  │
│  │  │  • Start shifting sleep schedule                                          │  │
│  │  │  • Pack travel essentials                                                 │  │
│  │  └────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ▼ Travel Day            Thu, Jul 12        IN-FLIGHT                         │  │
│  │  ─────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ▼ Day 1                 Fri, Jul 13        POST-ARRIVAL          [TODAY]    │  │
│  │  ─────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ▶ Day 2                 Sat, Jul 14        POST-ARRIVAL                      │  │
│  │  ▶ Day 3                 Sun, Jul 15        POST-ARRIVAL                      │  │
│  │  ▶ Day 4                 Mon, Jul 16        COMPETITION-READY                 │  │
│  │  ▶ Day 5                 Tue, Jul 17        COMPETITION-READY                 │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ✅ TRAVEL CHECKLIST                                                            │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ▼ Essential Documents                                                        │  │
│  │     ☑ Passport                       [Essential]                              │  │
│  │     ☐ Travel insurance               [Essential]                              │  │
│  │     ☐ Competition credentials                                                 │  │
│  │                                                                                │  │
│  │  ▶ Recovery Items                                                             │  │
│  │  ▶ Tech Items                                                                 │  │
│  │  ▶ Comfort Items                                                              │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
```

---

## Section C: Car Travel - Planning Form

```
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🚗 LONG CAR TRAVEL PROTOCOL                                                   │  │
│  │    Evidence-based blood circulation management for 6-12+ hour drives          │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Trip Name                           Estimated Duration (hours)               │  │
│  │  ┌─────────────────────────────┐     ┌─────────────────────────────────────┐  │  │
│  │  │ Regional Tournament Drive   │     │  [−]      6 hrs      [+]            │  │  │
│  │  └─────────────────────────────┘     └─────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  Are you driving?                    Competition Date (Optional)              │  │
│  │  ┌─────────────────────────────┐     ┌─────────────────────────────────────┐  │  │
│  │  │ ☐ Yes, I'm driving          │     │ 📅 DD/MM/YYYY                      │  │  │
│  │  └─────────────────────────────┘     └─────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │                    ┌──────────────────────────────────────┐                   │  │
│  │                    │  ⚡ Generate Car Travel Protocol     │                   │  │
│  │                    └──────────────────────────────────────┘                   │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚠️ CIRCULATION RISK ASSESSMENT                                                │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │    ┌───────────────┐                                                          │  │
│  │    │      5        │      Risk Level: MODERATE                                │  │
│  │    │  Risk Score   │                                                          │  │
│  │    └───────────────┘                                                          │  │
│  │                                                                                │  │
│  │  Risk Factors:                       Key Recommendations:                     │  │
│  │  • Duration > 6 hours                ✓ Wear compression socks                 │  │
│  │  • Prolonged sitting                 ✓ Stop every 2 hours                     │  │
│  │  • Limited movement                  ✓ Do seated exercises every 30 min       │  │
│  │                                      ✓ Stay hydrated (3L+ water)              │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
```

---

## Section D: Car Travel - Active Protocol Dashboard

```
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ CAR TRAVEL RISK OVERVIEW                                                      │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌─────┐   Regional Tournament Drive                                          │  │
│  │  │  5  │   ┌────────────────┐ ┌─────────────┐ ┌────────────────┐              │  │
│  │  └─────┘   │ 8 Hour Drive   │ │  Passenger  │ │ Moderate Risk  │              │  │
│  │            └────────────────┘ └─────────────┘ └────────────────┘              │  │
│  │                                                                                │  │
│  │  ⚠️ STOP & SEEK HELP IF YOU EXPERIENCE:                                      │  │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │  │
│  │  │ Leg swelling  │ │ Chest pain    │ │ Calf pain     │ │ Skin changes  │     │  │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘     │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🦵 COMPRESSION GARMENTS                                                        │  │
│  │    Evidence-based blood flow enhancement                                       │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Recommended: Graduated Compression Socks        15-20 mmHg                   │  │
│  │                                                                                │  │
│  │  ▶ When to Wear: Put on before departure                                      │  │
│  │  ⏹ When to Remove: Only at rest stops, overnight                              │  │
│  │                                                                                │  │
│  │  ⚠️ Important Cautions:                                                        │  │
│  │  • Don't fold tops down                                                        │  │
│  │  • Check for numbness                                                          │  │
│  │  • Remove if skin irritation                                                   │  │
│  │                                                                                │  │
│  │  📚 Evidence: Multiple studies show graduated compression reduces DVT risk    │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 💆 MASSAGE GUN PROTOCOL                                                        │  │
│  │    Percussion therapy for circulation                                          │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ▼ 🚗 Before Departure                                                        │  │
│  │     5 min total │ Do once before leaving                                      │  │
│  │     • Calves: 60s - Slow sweeps from ankle to knee                            │  │
│  │     • Quads: 60s - Focus on outer thigh                                       │  │
│  │     • Glutes: 45s - Circular motions                                          │  │
│  │     ⚠️ Avoid bony prominences                                                 │  │
│  │                                                                                │  │
│  │  ▶ ⛽ At Rest Stops                                                           │  │
│  │  ▶ 🏁 After Arrival                                                           │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏃 CIRCULATION EXERCISES                                                       │  │
│  │    Do these every 30 minutes while seated                                      │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐    │  │
│  │  │ Ankle Circles       │  │ Toe Raises          │  │ Knee Lifts          │    │  │
│  │  │ ─────────────────── │  │ ─────────────────── │  │ ─────────────────── │    │  │
│  │  │ 2 sets × 10 reps    │  │ 2 sets × 15 reps    │  │ 2 sets × 10 reps    │    │  │
│  │  │ Target: Ankles      │  │ Target: Calves      │  │ Target: Thighs      │    │  │
│  │  │                     │  │                     │  │                     │    │  │
│  │  │ Rotate ankles in    │  │ Lift toes while     │  │ Lift knee toward    │    │  │
│  │  │ both directions     │  │ keeping heels down  │  │ chest alternately   │    │  │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘    │  │
│  │                                                                                │  │
│  │  ┌─────────────────────┐                                                      │  │
│  │  │ Glute Squeezes      │                                                      │  │
│  │  │ ─────────────────── │                                                      │  │
│  │  │ 2 sets × 10 reps    │                                                      │  │
│  │  │ Hold 3s each        │                                                      │  │
│  │  │ Target: Glutes      │                                                      │  │
│  │  └─────────────────────┘                                                      │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📍 REST STOP PROTOCOL                                                          │  │
│  │    Every 2 hours - take 10-15 minutes                                          │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌─────────┐  💚 Walk for 5 minutes minimum                         5 min     │  │
│  │  │ Hour 2  │  🦵 Calf raises (20 reps)                                        │  │
│  │  └─────────┘  🏃 Leg swings (10 each leg)                                     │  │
│  │               💧 Hydrate (250-500ml)                                          │  │
│  │                                                                                │  │
│  │  ┌─────────┐  💚 Walk for 5 minutes minimum                         5 min     │  │
│  │  │ Hour 4  │  🦵 Calf raises (20 reps)                                        │  │
│  │  └─────────┘  ...                                                             │  │
│  │                                                                                │  │
│  │  ┌─────────┐  ...                                                             │  │
│  │  │ Hour 6  │                                                                  │  │
│  │  └─────────┘                                                                  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📚 EVIDENCE-BASED RESEARCH                                                     │  │
│  │    Scientific backing for these protocols                                      │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ▼ DVT Prevention                                                             │  │
│  │     Finding: Graduated compression stockings reduce DVT risk by 50-60%        │  │
│  │     Source: Cochrane Review 2020                                              │  │
│  │     PubMed: 32123456                                                          │  │
│  │     Recommendation: Wear 15-20 mmHg compression for drives > 4 hours          │  │
│  │                                                                                │  │
│  │  ▶ Seated Exercise Benefits                                                   │  │
│  │  ▶ Massage Gun Circulation                                                    │  │
│  │  ▶ Hydration Impact                                                           │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ✅ CAR TRAVEL CHECKLIST                                                        │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ▼ Essential Items                                                            │  │
│  │     ☐ Compression socks                [Essential]                            │  │
│  │     ☐ Water bottles (3L minimum)       [Essential]                            │  │
│  │     ☐ Healthy snacks                                                          │  │
│  │                                                                                │  │
│  │  ▶ Recovery Items                                                             │  │
│  │  ▶ Comfort Items                                                              │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
```

---

## Feature Comparison: Documented vs Implemented

### Flight Travel Features

| Documented Feature                    | Status | Location            |
| ------------------------------------- | ------ | ------------------- |
| Olympic Quick Select (LA28, Brisbane) | ✅     | Planning form       |
| Timezone selector with filter         | ✅     | Planning form       |
| Departure/arrival dates               | ✅     | Planning form       |
| Competition date                      | ✅     | Planning form       |
| Flight duration input                 | ✅     | Planning form       |
| Layovers input                        | ✅     | Planning form       |
| Jet lag severity score                | ✅     | Active dashboard    |
| Time zones crossed display            | ✅     | Chips               |
| Travel direction (east/west)          | ✅     | Chips               |
| Estimated recovery days               | ✅     | Severity card       |
| Expected symptoms list                | ✅     | Severity card       |
| Days until competition countdown      | ✅     | Severity card       |
| Competition readiness warning         | ✅     | Severity card       |
| Today's protocol card                 | ✅     | Active dashboard    |
| Sleep window (bed/wake time)          | ✅     | Protocol section    |
| Light exposure windows (seek/avoid)   | ✅     | Protocol section    |
| Training guidelines                   | ✅     | Protocol section    |
| Recommended activities                | ✅     | Protocol section    |
| Avoid activities                      | ✅     | Protocol section    |
| Max training duration                 | ✅     | Protocol section    |
| Hydration target                      | ✅     | Protocol section    |
| Key actions timeline                  | ✅     | Recommendations     |
| Supplements (melatonin, caffeine)     | ✅     | Supplements section |
| Full recovery timeline accordion      | ✅     | Timeline card       |
| Day-by-day protocol expansion         | ✅     | Accordion panels    |
| Travel checklist                      | ✅     | Checklist card      |
| Essential items badge                 | ✅     | Checklist items     |
| Packed checkbox                       | ✅     | Checklist items     |

### Car Travel Features

| Documented Feature                  | Status | Location         |
| ----------------------------------- | ------ | ---------------- |
| Trip name input                     | ✅     | Planning form    |
| Duration input (hours)              | ✅     | Planning form    |
| Driver/passenger toggle             | ✅     | Planning form    |
| Competition date (optional)         | ✅     | Planning form    |
| Blood circulation risk score        | ✅     | Risk card        |
| Risk level tag                      | ✅     | Risk card        |
| Risk factors list                   | ✅     | Risk card        |
| Key recommendations                 | ✅     | Risk card        |
| Warning symptoms (stop & seek help) | ✅     | Active dashboard |
| Compression garment guidelines      | ✅     | Compression card |
| Garment type recommendation         | ✅     | Compression card |
| Pressure (mmHg)                     | ✅     | Compression card |
| When to wear/remove                 | ✅     | Compression card |
| Compression cautions                | ✅     | Compression card |
| Evidence base note                  | ✅     | Compression card |
| Massage gun protocol                | ✅     | Massage card     |
| Pre-travel routine                  | ✅     | Accordion        |
| Rest stop routine                   | ✅     | Accordion        |
| Post-arrival routine                | ✅     | Accordion        |
| Target muscles with duration        | ✅     | Protocol content |
| Technique description               | ✅     | Protocol content |
| Massage cautions                    | ✅     | Protocol content |
| Seated circulation exercises        | ✅     | Exercises card   |
| Exercise cards (4 exercises)        | ✅     | Grid layout      |
| Sets, reps, hold duration           | ✅     | Exercise details |
| Rest stop protocol timeline         | ✅     | Rest stop card   |
| Hour markers                        | ✅     | Timeline         |
| Actions per stop                    | ✅     | Rest stop items  |
| Research evidence accordion         | ✅     | Research card    |
| Topic/finding/source/recommendation | ✅     | Research items   |
| PubMed links                        | ✅     | Research items   |
| Car travel checklist                | ✅     | Checklist card   |

---

## Business Logic

### Jet Lag Severity Calculation

```typescript
// Jet Lag Score = |Timezone Difference| × Direction Multiplier
// Eastward: × 1.5 (harder)
// Westward: × 1.0 (easier)
// Recovery Days = Timezone Difference × 0.5 (east) or × 0.33 (west)
```

### Blood Circulation Risk Assessment

```typescript
// Risk Score = Base Score + Duration Factor + Mobility Factor
// Low: 4-6 hours, Score 1-3
// Moderate: 6-8 hours, Score 4-6
// High: 8-12 hours, Score 7-8
// Very High: 12+ hours, Score 9-10
```

---

## Data Sources

| Data                   | Service                 | Method                       |
| ---------------------- | ----------------------- | ---------------------------- |
| Timezones              | `TravelRecoveryService` | `getAvailableTimezones()`    |
| Travel plan            | `TravelRecoveryService` | `currentPlan` signal         |
| Recovery protocols     | `TravelRecoveryService` | `recoveryProtocol` signal    |
| Jet lag severity       | `TravelRecoveryService` | `jetLagSeverity` signal      |
| Today's protocol       | `TravelRecoveryService` | `getCurrentProtocolDay()`    |
| Olympic venue info     | `TravelRecoveryService` | `getOlympicVenueInfo()`      |
| Car travel risk        | `TravelRecoveryService` | `calculateCarTravelRisk()`   |
| Seated exercises       | `TravelRecoveryService` | `getSeatedExercises()`       |
| Massage protocols      | `TravelRecoveryService` | `getMassageGunProtocol()`    |
| Compression guidelines | `TravelRecoveryService` | `getCompressionGuidelines()` |
| Travel checklist       | `TravelRecoveryService` | `getTravelChecklist()`       |

---

## UX Notes

### ✅ What Works Well

- Clear flight/car toggle
- Olympic quick select for common destinations
- Comprehensive jet lag protocols with daily breakdown
- Evidence-based research citations for car travel
- Warning symptoms clearly displayed
- Expandable timeline for day-by-day details

### 🔧 Suggested Improvements

1. Add wearable integration for sleep tracking during recovery
2. Push notifications for protocol reminders
3. Integration with wellness check-in post-travel

---

## Implementation Checklist

- [x] Travel type selector (flight/car)
- [x] Olympic quick select buttons
- [x] Trip details form
- [x] Timezone dropdown with filter
- [x] Date pickers
- [x] Flight duration/layovers inputs
- [x] Generate protocol button
- [x] Jet lag severity card
- [x] Today's protocol card
- [x] Sleep window display
- [x] Light exposure windows
- [x] Training guidelines
- [x] Hydration target
- [x] Key actions list
- [x] Supplements section
- [x] Full timeline accordion
- [x] Travel checklist
- [x] Car trip form
- [x] Risk assessment card
- [x] Compression guidelines
- [x] Massage gun protocols
- [x] Seated exercises grid
- [x] Rest stop protocol
- [x] Research evidence
- [x] Car travel checklist
