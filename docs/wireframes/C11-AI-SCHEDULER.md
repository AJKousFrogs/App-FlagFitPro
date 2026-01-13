# Wireframe: AI Training Scheduler

**Route:** `/coach/ai-scheduler`  
**Users:** Head Coach, Assistant Coach  
**Status:** ⚠️ Needs Implementation  
**Source:** `FEATURE_DOCUMENTATION.md` §17

---

## Purpose

AI-powered training schedule generator that creates optimized training programs based on team events, player readiness, periodization principles, and competition calendar.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🤖 AI Training Scheduler                                                      │  │
│  │     Let Merlin optimize your training plan                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              GENERATE NEW SCHEDULE                                   │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ 🤖 MERLIN - Training Scheduler                                           │ │  │
│  │  │ ────────────────────────────────────────────────────────────────────────│ │  │
│  │  │                                                                          │ │  │
│  │  │ "I'll create an optimized training schedule based on your team's        │ │  │
│  │  │  calendar, player readiness, and your goals. Just tell me what you      │ │  │
│  │  │  need to prepare for."                                                   │ │  │
│  │  │                                                                          │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  STEP 1: Target Event                                                         │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │ What are you preparing for?                                             │   │  │
│  │  │                                                                          │   │  │
│  │  │ ( ) Regular season game                                                  │   │  │
│  │  │ (●) Tournament                                                           │   │  │
│  │  │ ( ) Tryouts / Combine                                                    │   │  │
│  │  │ ( ) Off-season training                                                  │   │  │
│  │  │ ( ) Return from break                                                    │   │  │
│  │  │                                                                          │   │  │
│  │  │ Select event: [Spring Championship - Jan 18-19, 2026 ▼]                 │   │  │
│  │  │                                                                          │   │  │
│  │  │ Time until event: 15 days                                               │   │  │
│  │  └────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                │  │
│  │  STEP 2: Training Focus                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │ What should we prioritize? (Select up to 3)                             │   │  │
│  │  │                                                                          │   │  │
│  │  │ ☑ Speed & Explosiveness                                                  │   │  │
│  │  │ ☑ Game Tactics & Plays                                                   │   │  │
│  │  │ ☐ Strength & Power                                                       │   │  │
│  │  │ ☑ Team Chemistry & Communication                                         │   │  │
│  │  │ ☐ Endurance & Conditioning                                               │   │  │
│  │  │ ☐ Position-Specific Skills                                               │   │  │
│  │  │ ☐ Recovery & Injury Prevention                                           │   │  │
│  │  └────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                │  │
│  │  STEP 3: Constraints                                                          │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │ Practice days available:                                                │   │  │
│  │  │ ☑ Monday   ☑ Tuesday   ☐ Wednesday   ☑ Thursday   ☐ Friday             │   │  │
│  │  │ ☑ Saturday ☐ Sunday                                                     │   │  │
│  │  │                                                                          │   │  │
│  │  │ Practice duration: [2 hours ▼]                                          │   │  │
│  │  │                                                                          │   │  │
│  │  │ Facility: [Central Park Field ▼]  ☑ Backup: North Field                 │   │  │
│  │  │                                                                          │   │  │
│  │  │ Special considerations:                                                  │   │  │
│  │  │ ☑ 2 players in RTP (Alex, Emily)                                        │   │  │
│  │  │ ☑ 3 players with elevated ACWR (reduce their load)                      │   │  │
│  │  │ ☐ Weather-adjusted (indoor alternatives)                                 │   │  │
│  │  └────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                │  │
│  │                                              [Generate Schedule]              │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Generated Schedule View

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [← Back]  AI-Generated Schedule                               [Regenerate] [Edit]  │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🤖 MERLIN'S RECOMMENDATION                                                     │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │ "Based on 15 days until Spring Championship, I've designed a 2-phase plan:   │  │
│  │  Week 1 focuses on high-intensity game prep, Week 2 tapers for peak          │  │
│  │  performance. I've reduced load for Chris, Morgan, and Riley (high ACWR)     │  │
│  │  and created modified sessions for Alex and Emily (RTP)."                    │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              PERIODIZATION OVERVIEW                                  │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Jan 3-5       │    Jan 6-12         │    Jan 13-17     │   Jan 18-19   │  │  │
│  │  │  CURRENT       │    PEAK INTENSITY   │    TAPER         │   COMPETE     │  │  │
│  │  │  ░░░░░░░░░░    │    ████████████████ │    ████████░░░░  │   🏆          │  │  │
│  │  │  0%            │    100% Load        │    60% Load      │   Tournament  │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              WEEK 1: PEAK INTENSITY (Jan 6-12)                       │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────┬────────────────────────────────────────────────────────────────┐ │  │
│  │  │ MON     │ 🏃 Speed & Explosiveness                              2 hrs   │ │  │
│  │  │ Jan 6   │ ─────────────────────────────────────────────────────────────│ │  │
│  │  │ 6:00 PM │ • Warm-up (15 min)                                           │ │  │
│  │  │         │ • Sprint mechanics & acceleration (30 min)                    │ │  │
│  │  │         │ • Agility ladder & cone drills (25 min)                       │ │  │
│  │  │         │ • Position-specific explosive work (30 min)                   │ │  │
│  │  │         │ • Cool down (10 min)                                          │ │  │
│  │  │         │                                                               │ │  │
│  │  │         │ Target RPE: 8    Load: High    Focus: Speed                   │ │  │
│  │  │         │ 📍 Central Park Field                                        │ │  │
│  │  │         │                                                  [Edit] [×]  │ │  │
│  │  └─────────┴────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────┬────────────────────────────────────────────────────────────────┐ │  │
│  │  │ TUE     │ 🏈 Game Tactics - Offense                             2 hrs   │ │  │
│  │  │ Jan 7   │ ─────────────────────────────────────────────────────────────│ │  │
│  │  │ 6:00 PM │ • Warm-up (15 min)                                           │ │  │
│  │  │         │ • Red zone offense 7v7 (40 min)                              │ │  │
│  │  │         │ • New plays installation (30 min)                            │ │  │
│  │  │         │ • Live scrimmage - offense focus (25 min)                    │ │  │
│  │  │         │ • Team talk (10 min)                                          │ │  │
│  │  │         │                                                               │ │  │
│  │  │         │ Target RPE: 8    Load: High    Focus: Tactics                │ │  │
│  │  │         │ 📍 Central Park Field                                        │ │  │
│  │  │         │                                                  [Edit] [×]  │ │  │
│  │  └─────────┴────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────┬────────────────────────────────────────────────────────────────┐ │  │
│  │  │ THU     │ 🛡️ Game Tactics - Defense + Communication             2 hrs   │ │  │
│  │  │ Jan 9   │ ─────────────────────────────────────────────────────────────│ │  │
│  │  │ 6:00 PM │ • Warm-up (15 min)                                           │ │  │
│  │  │         │ • Defensive rotations & coverage (40 min)                    │ │  │
│  │  │         │ • Communication drills (20 min)                              │ │  │
│  │  │         │ • Live scrimmage - defense focus (25 min)                    │ │  │
│  │  │         │ • Film preview: opponent tendencies (10 min)                 │ │  │
│  │  │         │                                                               │ │  │
│  │  │         │ Target RPE: 8    Load: High    Focus: Defense                │ │  │
│  │  │         │                                                  [Edit] [×]  │ │  │
│  │  └─────────┴────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────┬────────────────────────────────────────────────────────────────┐ │  │
│  │  │ SAT     │ ⚔️ Full Game Simulation                               2 hrs   │ │  │
│  │  │ Jan 11  │ ─────────────────────────────────────────────────────────────│ │  │
│  │  │ 10:00AM │ • Warm-up (15 min)                                           │ │  │
│  │  │         │ • Full scrimmage with tournament rules (75 min)              │ │  │
│  │  │         │ • Special situations practice (20 min)                       │ │  │
│  │  │         │ • Cool down & team chemistry (10 min)                        │ │  │
│  │  │         │                                                               │ │  │
│  │  │         │ Target RPE: 9    Load: Max     Focus: Game Sim               │ │  │
│  │  │         │                                                  [Edit] [×]  │ │  │
│  │  └─────────┴────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              WEEK 2: TAPER (Jan 13-17)                               │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────┬────────────────────────────────────────────────────────────────┐ │  │
│  │  │ MON     │ 🔄 Light Skills & Recovery                            90 min  │ │  │
│  │  │ Jan 13  │ Target RPE: 5    Load: Low     Focus: Maintenance            │ │  │
│  │  │         │                                                  [Edit] [×]  │ │  │
│  │  └─────────┴────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────┬────────────────────────────────────────────────────────────────┐ │  │
│  │  │ TUE     │ 📋 Walkthrough & Film                                 90 min  │ │  │
│  │  │ Jan 14  │ Target RPE: 3    Load: Min     Focus: Mental Prep            │ │  │
│  │  │         │                                                  [Edit] [×]  │ │  │
│  │  └─────────┴────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────┬────────────────────────────────────────────────────────────────┐ │  │
│  │  │ THU     │ ⚡ Light Activation & Final Prep                      60 min  │ │  │
│  │  │ Jan 16  │ Target RPE: 4    Load: Min     Focus: Activation             │ │  │
│  │  │         │                                                  [Edit] [×]  │ │  │
│  │  └─────────┴────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────┬────────────────────────────────────────────────────────────────┐ │  │
│  │  │ FRI     │ 😴 REST DAY - Travel if needed                                │ │  │
│  │  │ Jan 17  │                                                               │ │  │
│  │  └─────────┴────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐    │  │
│  │  │ 📥 Export to PDF    │  │ 📅 Add to Calendar  │  │ ✅ Apply Schedule   │    │  │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘    │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Player-Specific Modifications

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ PLAYER-SPECIFIC MODIFICATIONS                                                   │
│ ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                    │
│  🔴 HIGH ACWR - Load Reduction                                                    │
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Chris Martinez (ACWR: 1.42)                                                │   │
│  │ Modification: -25% load. Skip Saturday max-intensity scrimmage.            │   │
│  │ Instead: Light position work + film study                                  │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Morgan Davis (ACWR: 1.35)                                                  │   │
│  │ Modification: -20% load. Limit full-speed sprints.                         │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Riley Brown (ACWR: 1.32)                                                   │   │
│  │ Modification: -15% load. Extra recovery time between drills.               │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  🏥 RETURN-TO-PLAY - Modified Activities                                          │
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Alex Thompson (RTP Stage 4)                                                │   │
│  │ Modification: Non-contact drills only. 60% intensity cap.                  │   │
│  │ Cleared for: Position drills, walkthrough, film                            │   │
│  │ NOT cleared: Live scrimmage, full-speed contact                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Emily Chen (RTP Stage 2)                                                   │   │
│  │ Modification: Light activity only. 20% intensity cap.                      │   │
│  │ Cleared for: Walkthrough, film, light stretching                           │   │
│  │ NOT cleared: Running, drills, any intensity work                           │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature                | Description                       |
| ---------------------- | --------------------------------- |
| Target Event Selection | Prepare for specific competition  |
| Focus Priority         | Select training emphasis          |
| Constraint Input       | Practice days, duration, facility |
| Player Considerations  | Auto-adjust for ACWR/RTP          |
| Periodization          | AI-designed load progression      |
| Session Details        | Full practice plans               |
| Player Mods            | Individual adjustments            |
| Export                 | PDF, calendar integration         |

---

## AI Considerations

| Factor         | How AI Uses It                |
| -------------- | ----------------------------- |
| Days to Event  | Determines phase structure    |
| Player ACWR    | Reduces load for high-risk    |
| RTP Status     | Limits activities for injured |
| Focus Areas    | Weights session content       |
| Available Days | Distributes load across days  |
| Facility       | Adjusts for indoor/outdoor    |

---

## Data Sources

| Data        | Service                 | Table               |
| ----------- | ----------------------- | ------------------- |
| Events      | `CalendarService`       | `team_events`       |
| Player ACWR | `LoadMonitoringService` | `acwr_calculations` |
| RTP Status  | `InjuryService`         | `rtp_protocols`     |
| Facilities  | `FacilityService`       | `team_facilities`   |
| Sessions    | `TrainingService`       | `training_sessions` |
