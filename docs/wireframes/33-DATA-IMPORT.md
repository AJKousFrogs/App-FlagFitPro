# Wireframe: Data Import (Player Feature)

**Route:** `/settings/import` or `/import`  
**Users:** Players (import their training data from external sources)  
**Status:** ⚠️ Needs Implementation  
**Source:** Referenced in `FEATURE_DOCUMENTATION.md` §33 (Data Import/Export System)

---

## Purpose

Allows players to import training programs and historical data from external sources - including national team training plans (JSON/CSV), wearable device data (Garmin, Whoop, etc.), and past training logs. Imported data integrates with the app's analytics, ACWR calculations, and AI recommendations.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📥 Import Data                                                                │  │
│  │     Bring in training data from external sources                              │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                 IMPORT OPTIONS                                       │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐                   │  │
│  │  │                          │  │                          │                   │  │
│  │  │     📋                   │  │     📁                   │                   │  │
│  │  │                          │  │                          │                   │  │
│  │  │  Training Program        │  │  Training History        │                   │  │
│  │  │  ──────────────          │  │  ──────────────          │                   │  │
│  │  │  Import a structured     │  │  Import past sessions    │                   │  │
│  │  │  training plan (JSON)    │  │  from spreadsheet/app    │                   │  │
│  │  │                          │  │                          │                   │  │
│  │  │  Perfect for: National   │  │  Perfect for: Migrating  │                   │  │
│  │  │  team plans, coach       │  │  from another app,       │                   │  │
│  │  │  provided programs       │  │  your own Excel logs     │                   │  │
│  │  │                          │  │                          │                   │  │
│  │  └──────────────────────────┘  └──────────────────────────┘                   │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐                   │  │
│  │  │                          │  │                          │                   │  │
│  │  │     ⌚                   │  │     📊                   │                   │  │
│  │  │                          │  │                          │                   │  │
│  │  │  Wearable Devices        │  │  Performance Records     │                   │  │
│  │  │  ──────────────          │  │  ──────────────          │                   │  │
│  │  │  Connect Garmin, Whoop,  │  │  Import historical       │                   │  │
│  │  │  Apple Watch, Oura Ring  │  │  benchmarks (40yd, etc.) │                   │  │
│  │  │                          │  │                          │                   │  │
│  │  │  Syncs: HR, HRV, sleep,  │  │  Perfect for: Building   │                   │  │
│  │  │  activity data           │  │  your performance trend  │                   │  │
│  │  │                          │  │  history                 │                   │  │
│  │  │                          │  │                          │                   │  │
│  │  └──────────────────────────┘  └──────────────────────────┘                   │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐                   │  │
│  │  │                          │  │                          │                   │  │
│  │  │     ⚖️                   │  │     🏥                   │                   │  │
│  │  │                          │  │                          │                   │  │
│  │  │  Body Composition        │  │  Injury History          │                   │  │
│  │  │  ──────────────          │  │  ──────────────          │                   │  │
│  │  │  Import weight history,  │  │  Import past injuries    │                   │  │
│  │  │  body fat measurements   │  │  for RTP tracking        │                   │  │
│  │  │                          │  │                          │                   │  │
│  │  │  Perfect for: Building   │  │  Perfect for: Complete   │                   │  │
│  │  │  weight trend data       │  │  medical profile         │                   │  │
│  │  │                          │  │                          │                   │  │
│  │  └──────────────────────────┘  └──────────────────────────┘                   │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Import Training Program (JSON) Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [← Back]  Import Training Program                                                  │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                             STEP 1: UPLOAD FILE                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                                                                          │ │  │
│  │  │                                                                          │ │  │
│  │  │                           📥 DROP FILE HERE                              │ │  │
│  │  │                                                                          │ │  │
│  │  │                        or click to browse                                │ │  │
│  │  │                                                                          │ │  │
│  │  │                    Accepted: .json, .csv                                 │ │  │
│  │  │                    Max size: 5MB                                         │ │  │
│  │  │                                                                          │ │  │
│  │  │                                                                          │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ─────────────────────────── OR ──────────────────────────────                │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ 🔗 Import from URL                                                       │ │  │
│  │  │ ┌──────────────────────────────────────────────────────────────────────┐ │ │  │
│  │  │ │ https://coachingplatform.com/exports/my-program.json              │ │ │  │
│  │  │ └──────────────────────────────────────────────────────────────────────┘ │ │  │
│  │  │                                                     [Fetch from URL]    │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  💡 Tip: Ask your national team coach for a JSON export of your program       │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📋 Supported Formats                                                           │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  JSON Structure (Recommended)                                                 │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │ {                                                                      │   │  │
│  │  │   "programName": "National Team Spring Prep",                          │   │  │
│  │  │   "coach": "Coach Name",                                               │   │  │
│  │  │   "startDate": "2026-01-15",                                           │   │  │
│  │  │   "weeks": [                                                           │   │  │
│  │  │     {                                                                  │   │  │
│  │  │       "weekNumber": 1,                                                 │   │  │
│  │  │       "focus": "Foundation",                                           │   │  │
│  │  │       "sessions": [                                                    │   │  │
│  │  │         {                                                              │   │  │
│  │  │           "day": "Monday",                                             │   │  │
│  │  │           "type": "Speed",                                             │   │  │
│  │  │           "exercises": [...],                                          │   │  │
│  │  │           "targetRPE": 7                                               │   │  │
│  │  │         }                                                              │   │  │
│  │  │       ]                                                                │   │  │
│  │  │     }                                                                  │   │  │
│  │  │   ]                                                                    │   │  │
│  │  │ }                                                                      │   │  │
│  │  └────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                │  │
│  │  CSV Structure                                                                │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │ date,session_type,duration_min,target_rpe,exercises,notes             │   │  │
│  │  │ 2026-01-15,Speed,60,7,"40yd sprints, cone drills",Foundation week     │   │  │
│  │  │ 2026-01-17,Strength,75,8,"Squats, deadlifts",Build phase              │   │  │
│  │  └────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                │  │
│  │                                                       [Download Template →]   │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 2: Preview & Map Fields

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [← Back]  Import Training Program                              Step 2 of 3         │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                             FILE VALIDATED ✅                                        │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ✅ national_team_program.json (42 KB)                                          │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Program: National Team Spring Prep 2026                                       │  │
│  │  Coach: Coach Alexandra                                                        │  │
│  │  Duration: 8 weeks                                                             │  │
│  │  Sessions: 32 training sessions                                                │  │
│  │  Exercises: 156 total exercises                                                │  │
│  │  Start Date: January 15, 2026                                                  │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              FIELD MAPPING                                           │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  File Field              │ Maps To                │ Status                    │  │
│  │  ─────────────────────────────────────────────────────────────────────────────│  │
│  │  programName             │ Training Program Name   │ ✅ Auto-matched          │  │
│  │  startDate               │ Start Date              │ ✅ Auto-matched          │  │
│  │  weeks[].sessions[].day  │ Session Day             │ ✅ Auto-matched          │  │
│  │  weeks[].sessions[].type │ Session Type            │ ✅ Auto-matched          │  │
│  │  targetRPE               │ Target RPE              │ ✅ Auto-matched          │  │
│  │  exercises[].name        │ Exercise Name           │ ✅ Auto-matched          │  │
│  │  exercises[].sets        │ Sets                    │ ✅ Auto-matched          │  │
│  │  exercises[].reps        │ Reps                    │ ✅ Auto-matched          │  │
│  │  nationalTeamPhase       │ [Select mapping ▼]      │ ⚠️ Needs mapping         │  │
│  │                                                                                │  │
│  │  ⚠️ 1 field needs manual mapping                                              │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              PREVIEW (Week 1)                                        │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  Week 1: Foundation                                                           │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Monday - Speed Development                                   RPE 7       │ │  │
│  │  │ • 10m Sprints (6 × 2 reps)                                               │ │  │
│  │  │ • 40yd Dash (4 × 1 rep)                                                  │ │  │
│  │  │ • Cone Drills (3 × 5 reps)                                               │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Wednesday - Agility                                          RPE 6       │ │  │
│  │  │ • Pro Agility Shuttle (5 × 2 reps)                                       │ │  │
│  │  │ • L-Drill (4 × 2 reps)                                                   │ │  │
│  │  │ • Reactive Agility (3 × 4 reps)                                          │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Friday - Strength                                            RPE 8       │ │  │
│  │  │ • Back Squat (4 × 6 reps)                                                │ │  │
│  │  │ • Trap Bar Deadlift (4 × 5 reps)                                         │ │  │
│  │  │ • Bench Press (3 × 8 reps)                                               │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │                                              [View All Weeks →]               │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │                                    [Cancel]  [Import Program]                 │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 3: Import Complete

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [← Back]  Import Complete                                                          │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │                              ┌─────────────┐                                   │  │
│  │                              │     ✅      │                                   │  │
│  │                              │   SUCCESS   │                                   │  │
│  │                              └─────────────┘                                   │  │
│  │                                                                                │  │
│  │             National Team Spring Prep 2026 has been imported!                 │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📊 Import Summary                                                              │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ✅ 8 weeks imported                                                          │  │
│  │  ✅ 32 training sessions created                                              │  │
│  │  ✅ 156 exercises mapped                                                      │  │
│  │  ⚠️ 3 exercises not found - added as custom exercises                         │  │
│  │                                                                                │  │
│  │  📅 Program starts: January 15, 2026                                          │  │
│  │  📅 Program ends: March 8, 2026                                               │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 💡 What Happens Next                                                           │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  • Sessions appear in your Training Schedule                                  │  │
│  │  • Today's page will show your current session                                │  │
│  │  • ACWR will include these planned sessions                                   │  │
│  │  • AI recommendations will factor in your program intensity                   │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐                   │  │
│  │  │ 📅 View Training Schedule│  │ 📥 Import Another        │                   │  │
│  │  └──────────────────────────┘  └──────────────────────────┘                   │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Wearable Device Integration

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [← Back]  Connect Wearable Devices                                                 │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                            CONNECTED DEVICES                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │ ⌚ Garmin Forerunner 265                              [Connected ✅]    │   │  │
│  │  │ ────────────────────────────────────────────────────────────────────── │   │  │
│  │  │                                                                        │   │  │
│  │  │ Last sync: 2 hours ago                                                 │   │  │
│  │  │ Data imported: HR, HRV, Sleep, Activity                                │   │  │
│  │  │                                                                        │   │  │
│  │  │                        [Sync Now]  [Manage]  [Disconnect]              │   │  │
│  │  └────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                            AVAILABLE TO CONNECT                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐    │  │
│  │  │                     │  │                     │  │                     │    │  │
│  │  │        🟢           │  │        ⚪           │  │        🟠           │    │  │
│  │  │                     │  │                     │  │                     │    │  │
│  │  │  Whoop              │  │  Apple Watch        │  │  Oura Ring          │    │  │
│  │  │  ─────────────      │  │  ─────────────      │  │  ─────────────      │    │  │
│  │  │  HRV, Strain,       │  │  HR, Activity,      │  │  Sleep, HRV,        │    │  │
│  │  │  Recovery, Sleep    │  │  Workout data       │  │  Readiness          │    │  │
│  │  │                     │  │                     │  │                     │    │  │
│  │  │     [Connect]       │  │     [Connect]       │  │     [Connect]       │    │  │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘    │  │
│  │                                                                                │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐    │  │
│  │  │                     │  │                     │  │                     │    │  │
│  │  │        🟣           │  │        🔵           │  │        ⚫           │    │  │
│  │  │                     │  │                     │  │                     │    │  │
│  │  │  Polar              │  │  Fitbit             │  │  Samsung Health     │    │  │
│  │  │  ─────────────      │  │  ─────────────      │  │  ─────────────      │    │  │
│  │  │  HR, Training       │  │  Activity, Sleep,   │  │  Activity, Sleep,   │    │  │
│  │  │  Load, Recovery     │  │  HR zones           │  │  HR, Stress         │    │  │
│  │  │                     │  │                     │  │                     │    │  │
│  │  │     [Connect]       │  │     [Connect]       │  │     [Connect]       │    │  │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘    │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               DATA USAGE                                             │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 💡 How Wearable Data Is Used                                                   │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  • HRV → Wellness Score calculation, readiness assessment                     │  │
│  │  • Sleep → Sleep debt tracking, recovery recommendations                      │  │
│  │  • Activity → ACWR calculation, training load tracking                        │  │
│  │  • HR Zones → Workout intensity validation                                    │  │
│  │  • Strain/Recovery → AI training recommendations                              │  │
│  │                                                                                │  │
│  │  🔒 Your data is encrypted and never shared                                   │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Import Types Summary

| Import Type         | Formats   | Data Imported                   | Affects                         |
| ------------------- | --------- | ------------------------------- | ------------------------------- |
| Training Program    | JSON, CSV | Scheduled sessions, exercises   | Training Schedule, Today, ACWR  |
| Training History    | CSV, JSON | Past sessions with RPE/duration | Analytics, ACWR baseline        |
| Wearable Data       | API sync  | HR, HRV, sleep, activity        | Wellness, Recovery, AI          |
| Performance Records | CSV       | Historical benchmarks           | Performance Tracking, Analytics |
| Body Composition    | CSV       | Weight, body fat over time      | Wellness, Trends                |
| Injury History      | CSV, JSON | Past injuries, RTP records      | Return-to-Play, Medical         |

---

## Features to Implement

| Feature                    | Status | Priority |
| -------------------------- | ------ | -------- |
| File Upload (drag/drop)    | ❌     | HIGH     |
| JSON Parser                | ❌     | HIGH     |
| CSV Parser                 | ❌     | HIGH     |
| Field Auto-Mapping         | ❌     | MEDIUM   |
| Preview Before Import      | ❌     | HIGH     |
| Import Validation          | ❌     | HIGH     |
| Wearable OAuth Connections | ❌     | MEDIUM   |
| Template Downloads         | ❌     | MEDIUM   |
| URL Import                 | ❌     | LOW      |
| Duplicate Detection        | ❌     | MEDIUM   |
| Rollback/Undo Import       | ❌     | LOW      |

---

## JSON Schema for Training Programs

```typescript
interface TrainingProgramImport {
  programName: string;
  coach?: string;
  startDate: string; // ISO date
  endDate?: string;
  description?: string;
  weeks: {
    weekNumber: number;
    focus?: string; // e.g., "Foundation", "Build", "Peak"
    sessions: {
      day: string; // "Monday", "Tuesday", etc.
      date?: string; // Optional specific date
      type: "Speed" | "Agility" | "Strength" | "Position" | "Recovery" | "Game";
      targetRPE?: number; // 1-10
      durationMinutes?: number;
      exercises: {
        name: string;
        sets?: number;
        reps?: number | string; // Can be "30 seconds"
        weight?: number;
        rest?: number; // seconds
        notes?: string;
      }[];
      notes?: string;
    }[];
  }[];
}
```

---

## Data Sources

| Data                 | Service                  | Table                  |
| -------------------- | ------------------------ | ---------------------- |
| Import logs          | `DataImportService`      | `data_imports`         |
| Training sessions    | `UnifiedTrainingService` | `training_sessions`    |
| Wearable connections | `WearableService`        | `wearable_connections` |
| Wearable data        | `WearableService`        | `wearable_data`        |

---

## Related Pages

| Page              | Route       | Relationship                  |
| ----------------- | ----------- | ----------------------------- |
| Training Schedule | `/training` | Imported sessions appear here |
| Today             | `/today`    | Current session from import   |
| Wellness          | `/wellness` | Wearable data integrates      |
| Settings          | `/settings` | Access from settings > Import |
