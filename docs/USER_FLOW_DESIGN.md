# FlagFit Pro - User Flow Design Document

## Complete User Journey & Navigation Architecture

_Version 2.1 | January 2026 | Status audit completed - implementation statuses updated to reflect current codebase state_

---

## Table of Contents

1. [User Roles & Entry Points](#1-user-roles--entry-points)
2. [Primary Navigation Structure](#2-primary-navigation-structure)
3. [User Flows by Role](#3-user-flows-by-role)
4. [Feature-to-Page Mapping](#4-feature-to-page-mapping)
5. [Critical User Journeys](#5-critical-user-journeys)
6. [Data Dependencies](#6-data-dependencies)
7. [Cross-Feature Connections](#7-cross-feature-connections)
8. [Ownership & Decision Authority](#8-ownership--decision-authority)
9. [Exception & Failure Flows](#9-exception--failure-flows)
10. [Consent & Privacy UX Flow](#10-consent--privacy-ux-flow)
11. [Cross-Day Continuity](#11-cross-day-continuity)
12. [Multi-Role Collaboration Workflows](#12-multi-role-collaboration-workflows)
13. [Exit, Pause & Offboarding Flows](#13-exit-pause--offboarding-flows)
14. [Additional UX Enhancements](#14-additional-ux-enhancements)

---

## 1. User Roles & Entry Points

### Role Definitions

| Role                | Description             | Entry Point         | Primary Focus                            |
| ------------------- | ----------------------- | ------------------- | ---------------------------------------- |
| **Player/Athlete**  | Individual athletes     | `/player-dashboard` | Personal training, wellness, performance |
| **Coach**           | Team coaches            | `/coach/dashboard`  | Team management, player monitoring       |
| **Assistant Coach** | Support coaching staff  | `/coach/dashboard`  | Limited team management                  |
| **Admin**           | Team administrator      | `/coach/dashboard`  | Team settings, roster                    |
| **Superadmin**      | Platform administrator  | `/superadmin`       | System-wide management                   |
| **Nutritionist**    | Nutrition specialist    | `/nutritionist`     | Nutrition reports, meal plans            |
| **Physiotherapist** | Physical therapist      | `/physiotherapist`  | Injury management, RTP                   |
| **Psychologist**    | Mental performance      | `/psychology`       | Mental wellness reports                  |
| **Official**        | Game official/referee   | `/officials`        | Game assignments, certifications         |

### Authentication Flow

```
┌─────────────────┐
│   App Launch    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No      ┌─────────────────┐
│  Has Session?   │────────────▶│    Login Page   │
└────────┬────────┘             └────────┬────────┘
         │ Yes                           │
         │                               ▼
         │                    ┌─────────────────┐
         │                    │  Onboarding?    │
         │                    └────────┬────────┘
         │                             │ First time
         │                             ▼
         │                    ┌─────────────────┐
         │                    │   Onboarding    │
         │                    │   Wizard        │
         │                    └────────┬────────┘
         │                             │
         ▼                             ▼
┌─────────────────────────────────────────────┐
│           Role-Based Redirect               │
├─────────────────────────────────────────────┤
│ Player      → /player-dashboard             │
│ Coach       → /coach/dashboard              │
│ Superadmin  → /superadmin                   │
│ Official    → /officials                    │
└─────────────────────────────────────────────┘
```

---

## 2. Primary Navigation Structure

### Sidebar Navigation (All Roles)

```
┌────────────────────────────────────────┐
│  🏈 FlagFit Pro                        │
├────────────────────────────────────────┤
│                                        │
│  📊 Dashboard        [role-specific]   │
│  📅 Training         [player/coach]    │
│  🏃 Today            [player]          │
│  💚 Wellness         [player]          │
│  📈 Analytics        [all]             │
│  👥 Roster           [coach]           │
│  🏆 Tournaments      [coach/player]    │
│  🎮 Game Tracker     [coach]           │
│  🤖 AI Coach         [all]             │
│  💬 Chat             [all]             │
│  🌐 Community        [all]             │
│  📚 Exercise Library [all]             │
│  ⚙️ Settings         [all]             │
│                                        │
├────────────────────────────────────────┤
│  [User Avatar]  [Notifications 🔔]     │
│  [Search 🔍]    [Help ❓]              │
└────────────────────────────────────────┘
```

### Header Quick Actions

```
┌──────────────────────────────────────────────────────────────────┐
│  [☰ Menu]  FlagFit Pro           [🔍 Search] [🔔 Notif] [Avatar] │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. User Flows by Role

### 3.1 Player Daily Flow

```
Morning Routine
───────────────
1. Open App
   │
   ▼
2. Player Dashboard
   ├── View Readiness Score
   ├── View ACWR Status
   ├── View Today's Schedule Preview
   │
   ▼
3. Morning Check-in (if not done)
   ├── Sleep Quality (1-5)
   ├── Muscle Soreness (1-5)
   ├── Stress Level (1-5)
   ├── Energy Level (1-5)
   ├── Mood (1-5)
   │
   ▼
4. Today's Practice (/today)
   ├── View Scheduled Sessions
   ├── Watch Exercise Videos
   ├── Mark Exercises Complete
   │
   ▼
5. Log Training Session
   ├── Duration
   ├── RPE (1-10)
   ├── Session Type
   ├── Notes
   │
   ▼
6. Post-Training
   ├── View Updated ACWR
   ├── Recovery Recommendations
   └── Tomorrow's Preview
```

### 3.2 Coach Daily Flow

```
Morning Routine
───────────────
1. Open App
   │
   ▼
2. Coach Dashboard
   ├── View Team Briefing (AI)
   ├── Review Priority Athletes (at-risk)
   ├── Check Team Readiness %
   │
   ▼
3. Risk Assessment
   ├── Filter: At Risk Players
   ├── Review Individual ACWR
   ├── Adjust Training Plans
   │
   ▼
4. Practice Planning
   ├── View Today's Schedule
   ├── Assign Drills/Exercises
   ├── Set Attendance
   │
   ▼
5. During Practice
   ├── Live Attendance Tracking
   ├── Game Tracker (if game day)
   │
   ▼
6. Post-Practice
   ├── Review Logged Sessions
   ├── Update Player Notes
   ├── Send Team Updates
   └── Plan Tomorrow
```

### 3.3 Game Day Flow (Coach)

```
Pre-Game
────────
1. Game Day Readiness (/game-day-readiness)
   ├── Review Team Readiness Scores
   ├── Check Individual Status
   ├── Make Lineup Decisions
   │
   ▼
2. Tournament Nutrition (if tournament)
   ├── Review Meal Schedule
   ├── Check Hydration Targets
   │
   ▼
3. Depth Chart (/depth-chart)
   ├── Finalize Positions
   ├── Set Rotation Plan

During Game
───────────
4. Game Tracker (/games/tracker)
   ├── Live Score Tracking
   ├── Play-by-Play Logging
   ├── Substitution Tracking
   ├── Timeout Management

Post-Game
─────────
5. Analytics Review
   ├── Game Statistics
   ├── Player Performance
   ├── Team Metrics
   │
   ▼
6. Recovery Planning
   ├── Set Recovery Protocols
   ├── Update ACWR Impact
   └── Schedule Debrief
```


---

## 4. Feature-to-Page Mapping

### Core Features

| #   | Feature             | Route                                   | Primary Users | Status         |
| --- | ------------------- | --------------------------------------- | ------------- | -------------- |
| 1   | Dashboard           | `/player-dashboard`, `/coach/dashboard` | All           | ✅ Implemented |
| 2   | Training Schedule   | `/training`                             | Player, Coach | ✅ Implemented |
| 3   | Today's Practice    | `/today`                                | Player        | ✅ Implemented |
| 4   | Wellness & Recovery | `/wellness`                             | Player        | ✅ Implemented |
| 5   | ACWR Dashboard      | `/acwr-dashboard`                       | Player, Coach | ✅ Implemented |

### Competition Features

| #   | Feature              | Route                           | Primary Users | Status         |
| --- | -------------------- | ------------------------------- | ------------- | -------------- |
| 6   | Travel Recovery      | `/travel-recovery`              | Player, Coach | ✅ Implemented |
| 7   | Game Day Readiness   | `/game-day-readiness`           | Coach         | ✅ Implemented |
| 8   | Tournament Nutrition | `/tournament-nutrition`         | Player, Coach | ✅ Implemented |
| 9   | Game Tracker         | `/games/tracker`, `/games/live` | Coach         | ✅ Implemented |
| 10  | Tournaments          | `/tournaments`                  | Coach         | ✅ Implemented |

### Team Management

| #   | Feature              | Route          | Primary Users   | Status         |
| --- | -------------------- | -------------- | --------------- | -------------- |
| 11  | Roster Management    | `/roster`      | Coach           | ✅ Implemented |
| 12  | Depth Chart          | `/depth-chart` | Coach           | ✅ Implemented |
| 13  | Attendance Tracking  | `/attendance`  | Coach           | ✅ Implemented |
| 14  | Equipment Management | `/equipment`   | Coach           | ✅ Implemented |
| 15  | Officials Management | `/officials`   | Official, Admin | ✅ Implemented |

### Analytics & Intelligence

| #   | Feature           | Route                | Primary Users | Status         |
| --- | ----------------- | -------------------- | ------------- | -------------- |
| 16  | Analytics         | `/analytics`         | All           | ✅ Implemented |
| 17  | AI Coach (Merlin) | `/chat`, `/ai-coach` | All           | ✅ Implemented |

### User Experience

| #   | Feature             | Route                | Primary Users | Status         |
| --- | ------------------- | -------------------- | ------------- | -------------- |
| 18  | Global Search       | Header Component     | All           | ✅ Implemented |
| 19  | Notification Center | Header Component     | All           | ✅ Implemented |
| 20  | Achievements System | `/profile` (section) | Player        | ✅ Implemented |

### Account & Settings

| #   | Feature      | Route         | Primary Users | Status         |
| --- | ------------ | ------------- | ------------- | -------------- |
| 21  | User Profile | `/profile`    | All           | ✅ Implemented |
| 22  | Settings     | `/settings`   | All           | ✅ Implemented |
| 23  | Onboarding   | `/onboarding` | New Users     | ✅ Implemented |

### Physical & Supplement Tracking

| #   | Feature            | Route                   | Primary Users | Status         |
| --- | ------------------ | ----------------------- | ------------- | -------------- |
| 24  | Body Composition   | `/wellness` (section)   | Player        | ✅ Implemented |
| 25  | Supplement Tracker | `/wellness` (section)   | Player        | ✅ Implemented |
| 26  | Sprint Benchmarks  | `/performance-tracking` | Player        | ✅ Implemented |

### Position-Specific Training

| #   | Feature           | Route                  | Primary Users     | Status         |
| --- | ----------------- | ---------------------- | ----------------- | -------------- |
| 27  | QB Hub            | `/qb-hub`              | QB Players, Coach | ✅ Implemented |
| 28  | Position Stats    | `/analytics` (section) | All               | ✅ Implemented |
| 29  | Position Training | `/training` (filtered) | Player            | ✅ Implemented |

### Professional Reports

| #   | Feature                   | Route              | Primary Users   | Status     |
| --- | ------------------------- | ------------------ | --------------- | ---------- |
| 30  | Nutritionist Dashboard    | `/nutritionist`    | Nutritionist    | ✅ Implemented |
| 31  | Physiotherapist Dashboard | `/physiotherapist` | Physiotherapist | ✅ Implemented |
| 32  | Psychology Reports        | `/psychology`      | Psychologist    | ✅ Implemented |

### Data Exchange

| #   | Feature            | Route                 | Primary Users | Status             |
| --- | ------------------ | --------------------- | ------------- | ------------------ |
| 33  | Data Import/Export | `/settings` (section) | Coach, Admin  | ✅ Implemented |
| 34  | Knowledge Drop-In  | `/coach/knowledge` | Coach         | ✅ Implemented |

### Communication

| #   | Feature        | Route        | Primary Users | Status         |
| --- | -------------- | ------------ | ------------- | -------------- |
| 35  | Team Chat      | `/chat`      | All           | ✅ Implemented |
| 36  | Community Feed | `/community` | All           | ✅ Implemented |

### Recovery & Injury

| #   | Feature            | Route                 | Primary Users   | Status     |
| --- | ------------------ | --------------------- | --------------- | ---------- |
| 37  | Return-to-Play     | `/rtp-protocol`       | Coach, Physio   | ✅ Implemented |
| 38  | Sleep Debt         | `/wellness` (section) | Player          | ✅ Implemented |
| 39  | Hydration Tracker  | `/wellness` (section) | Player          | ✅ Implemented |
| 40  | Menstrual Tracking | `/cycle-tracking`, `/wellness` (link) | Female Athletes | ✅ Implemented |

### Administration

| #   | Feature              | Route         | Primary Users | Status         |
| --- | -------------------- | ------------- | ------------- | -------------- |
| 41  | Superadmin Dashboard | `/superadmin` | Superadmin    | ✅ Implemented |

### Playbook & Strategy

| #   | Feature           | Route                                 | Primary Users | Status             |
| --- | ----------------- | ------------------------------------- | ------------- | ------------------ |
| 42  | Playbook Library  | `/playbook`                           | Coach         | ✅ Implemented |
| 43  | Video Analysis    | `/video-analysis`, `/training/videos` | Coach, Player | ✅ Implemented     |
| 44  | Scouting Reports  | `/coach/scouting`                           | Coach         | ✅ Implemented |
| 45  | Practice Planning | `/practice-planning`                  | Coach         | ✅ Implemented |

### Scheduling & Logistics

| #   | Feature             | Route              | Primary Users | Status             |
| --- | ------------------- | ------------------ | ------------- | ------------------ |
| 46  | Team Calendar       | `/calendar`        | All           | ✅ Implemented |
| 47  | Financial Tracking  | `/payments`, `/coach/payments` | All (Player view), Coach/Admin (Management) | ✅ Implemented |
| 48  | Weather Integration | Dashboard (widget) | All           | ✅ Implemented |

### Specialized

| #   | Feature          | Route               | Primary Users | Status         |
| --- | ---------------- | ------------------- | ------------- | -------------- |
| 49  | Exercise Library | `/exercise-library` | All           | ✅ Implemented |

---

## 5. Critical User Journeys

### Journey 1: New User Onboarding

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Sign Up    │───▶│  Role       │───▶│  Profile    │───▶│  Team       │
│  (Email)    │    │  Selection  │    │  Setup      │    │  Join/Create│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                 │
                   ┌─────────────┐    ┌─────────────┐           │
                   │  Dashboard  │◀───│  Feature    │◀──────────┘
                   │  (Home)     │    │  Tour       │
                   └─────────────┘    └─────────────┘

Steps:
1. Email/Password registration
2. Role selection (Player/Coach)
3. Profile info (name, position, age)
4. Team join code OR create new team
5. Feature walkthrough tour
6. Land on role-appropriate dashboard
```

### Journey 2: Daily Wellness Check-in (Player)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Dashboard  │───▶│  Wellness   │───▶│  Check-in   │───▶│  Results    │
│  Prompt     │    │  Page       │    │  Form       │    │  + Tips     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘

Form Fields:
- Sleep Quality (1-5 stars)
- Muscle Soreness (1-5 body map)
- Stress Level (1-5 slider)
- Energy Level (1-5 slider)
- Mood (1-5 emoji)
- Notes (optional)

Outputs:
- Wellness Score (0-100)
- Training Recommendation
- Recovery Suggestions
```

### Journey 3: Training Session Logging (Player)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Today's    │───▶│  Start      │───▶│  Complete   │───▶│  Log        │
│  Practice   │    │  Session    │    │  Exercises  │    │  Session    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                 │
                   ┌─────────────┐    ┌─────────────┐           │
                   │  Dashboard  │◀───│  ACWR       │◀──────────┘
                   │  Updated    │    │  Updated    │
                   └─────────────┘    └─────────────┘

Log Form:
- Duration (minutes)
- RPE (1-10 scale)
- Session Type (dropdown)
- Movement counts (sprints, throws, cuts)
- Notes

Result:
- Session Load calculated
- ACWR recalculated
- Streak updated
```

### Journey 4: Risk Assessment (Coach)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Coach      │───▶│  At-Risk    │───▶│  Player     │───▶│  Adjust     │
│  Dashboard  │    │  Filter     │    │  Detail     │    │  Training   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘

Risk Indicators:
- ACWR > 1.3 (Yellow warning)
- ACWR > 1.5 (Red critical)
- Readiness < 50%
- Missed 3+ days
- Injury flag

Actions Available:
- Modify training load
- Assign recovery day
- Send message
- Schedule check-in
- Update injury status
```

### Journey 5: Game Day Preparation (Coach)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Game Day   │───▶│  Review     │───▶│  Depth      │───▶│  Pre-Game   │
│  Readiness  │    │  Individual │    │  Chart      │    │  Checklist  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                 │
                   ┌─────────────┐    ┌─────────────┐           │
                   │  Post-Game  │◀───│  Game       │◀──────────┘
                   │  Analytics  │    │  Tracker    │
                   └─────────────┘    └─────────────┘

Readiness Factors:
- Sleep (last 3 nights)
- Wellness score
- ACWR status
- Injury status
- Travel fatigue
```

### Journey 6: Tournament Management (Coach)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Create     │───▶│  Add        │───▶│  Assign     │───▶│  Set        │
│  Tournament │    │  Games      │    │  Players    │    │  Nutrition  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                 │
                   ┌─────────────┐    ┌─────────────┐           │
                   │  Review     │◀───│  Track      │◀──────────┘
                   │  Results    │    │  Live Games │
                   └─────────────┘    └─────────────┘

Tournament Setup:
- Name, dates, location
- Game schedule
- Team roster selection
- Hotel/travel info
- Budget tracking
```

---

## 6. Data Dependencies

### Dashboard Data Requirements

```
Player Dashboard
├── User Profile (name, role, team)
├── Latest Wellness Check-in
├── Training Stats (7 days)
├── ACWR Calculation
├── Upcoming Events (calendar)
├── Achievement Progress
└── AI Insight Generation

Coach Dashboard
├── Team Info (name, record)
├── All Player Wellness Data
├── All Player ACWR Data
├── Risk Assessment Results
├── Today's Schedule
├── Team Performance Metrics
└── AI Team Briefing
```

### Real-time Data Flows

```
Wellness Check-in
       │
       ▼
┌──────────────┐
│ Wellness     │───▶ Dashboard Updates
│ Score Calc   │───▶ ACWR Recalculation
│              │───▶ Risk Assessment
└──────────────┘───▶ Coach Notifications

Training Log
       │
       ▼
┌──────────────┐
│ Load         │───▶ ACWR Update
│ Calculation  │───▶ Streak Update
│              │───▶ Analytics Update
└──────────────┘───▶ Achievement Check
```

---

## 7. Cross-Feature Connections

### Feature Integration Map

```
                    ┌─────────────────┐
                    │    Dashboard    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Wellness     │ │    Training     │ │    Analytics    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └─────────┬─────────┴─────────┬─────────┘
                   │                   │
                   ▼                   ▼
         ┌─────────────────┐ ┌─────────────────┐
         │  ACWR Dashboard │ │   AI Coach      │
         └────────┬────────┘ └────────┬────────┘
                  │                   │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │  Game Day       │
                  │  Readiness      │
                  └─────────────────┘
```

### Shared Components

| Component          | Used By Features                              |
| ------------------ | --------------------------------------------- |
| `WellnessScore`    | Dashboard, Wellness, ACWR, Game Day Readiness |
| `ACWRIndicator`    | Dashboard, ACWR, Training, Analytics          |
| `PlayerCard`       | Roster, Depth Chart, Coach Dashboard          |
| `TrainingCalendar` | Training Schedule, Today, Calendar            |
| `SessionLogger`    | Training Log, Today's Practice                |
| `NotificationBell` | All pages (header)                            |
| `SearchPanel`      | All pages (header)                            |
| `AIInsight`        | Dashboard, Wellness, Training                 |

### Navigation Shortcuts

| From         | To             | Trigger                  |
| ------------ | -------------- | ------------------------ |
| Dashboard    | Wellness       | "Check-in" button        |
| Dashboard    | Today          | "Today's Training" card  |
| Dashboard    | Training       | "Schedule" quick action  |
| Dashboard    | Chat           | "AI Coach" quick action  |
| Wellness     | ACWR Dashboard | "View Load Details" link |
| Training     | Today          | Date click (today)       |
| Roster       | Player Profile | Player row click         |
| Game Tracker | Analytics      | "View Stats" button      |

---

## 8. Ownership & Decision Authority

### Responsibility Handoff Matrix

Critical moments where data ownership and decision authority transfer between roles:

| Trigger | Ownership Before | Ownership After | Notification Target | Action Required |
|---------|----------------|-----------------|-------------------|----------------|
| **Wellness < 40%** | Player | Coach notified | Coach Dashboard | Coach reviews player status |
| **ACWR > 1.3** | Player | Coach action required | Coach Dashboard + Notification | Coach adjusts training load |
| **ACWR > 1.5** (Critical) | Player | Coach action required (urgent) | Coach Dashboard + Push Notification | Coach must intervene within 24h |
| **Injury flag added** | Coach | Physio lead | Physiotherapist Dashboard | Physio creates RTP protocol |
| **RTP Phase started** | Physio | Player execution | Player Dashboard | Player follows protocol |
| **RTP Phase completed** | Player | Coach approval | Coach Dashboard | Coach reviews & approves next phase |
| **Game Day Readiness < 60%** | System | Coach decision | Coach Dashboard | Coach makes lineup decision |
| **Missing wellness 3+ days** | Player | Coach follow-up | Coach Dashboard | Coach contacts player |
| **Tournament nutrition deviation** | Player | Nutritionist review | Nutritionist Dashboard | Nutritionist provides guidance |
| **Mental fatigue flag** | Player | Psychologist (if consented) | Psychologist Dashboard | Psychologist provides support |

### Decision Authority Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    Decision Authority                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Player Decisions                                       │
│  ├── Daily wellness check-in                            │
│  ├── Training session logging                           │
│  ├── Data sharing consent                               │
│  └── Personal recovery actions                          │
│                                                         │
│  Coach Decisions                                        │
│  ├── Training load adjustments                          │
│  ├── Lineup decisions                                  │
│  ├── Team-wide protocol changes                         │
│  ├── RTP phase approval                                 │
│  └── Player status changes                              │
│                                                         │
│  Professional Decisions                                 │
│  ├── Physio: RTP protocol creation                     │
│  ├── Nutritionist: Meal plan modifications              │
│  └── Psychologist: Mental health interventions          │
│                                                         │
│  System Decisions (Automated)                           │
│  ├── ACWR calculations                                  │
│  ├── Risk flagging                                      │
│  ├── Data confidence scoring                            │
│  └── Recovery recommendations                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Ownership Transition Flow Examples

#### Example 1: Wellness Risk Escalation

```
Player logs wellness < 40%
         │
         ▼
┌────────────────────┐
│ System flags risk  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐     ┌────────────────────┐
│ Coach notified     │────▶│ Coach Dashboard    │
│ (within 1 hour)    │     │ Priority Alert     │
└─────────┬──────────┘     └────────────────────┘
          │
          ▼
┌────────────────────┐
│ Coach reviews      │
│ player status      │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Coach takes action │
│ (adjust load,      │
│  contact player)   │
└────────────────────┘
```

#### Example 2: Injury → RTP Protocol

```
Coach flags injury
         │
         ▼
┌────────────────────┐
│ Ownership: Coach   │
│ Status: Injury     │
│ Flagged            │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐     ┌────────────────────┐
│ Physio notified    │────▶│ Physio Dashboard   │
│ (immediate)        │     │ New Injury Case    │
└─────────┬──────────┘     └────────────────────┘
          │
          ▼
┌────────────────────┐
│ Ownership: Physio  │
│ Creates RTP        │
│ Protocol           │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐     ┌────────────────────┐
│ Player notified    │────▶│ Player Dashboard   │
│ RTP Phase 1        │     │ RTP Protocol       │
│ Assigned           │     │ Active             │
└─────────┬──────────┘     └────────────────────┘
          │
          ▼
┌────────────────────┐
│ Ownership: Player  │
│ Executes protocol  │
│ Logs compliance    │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐     ┌────────────────────┐
│ Phase Complete     │────▶│ Coach Dashboard    │
│ Ownership: Coach   │     │ Approval Required  │
│ Approval Required  │     └────────────────────┘
└────────────────────┘
```

### Accountability Tracking

Each ownership transition is logged with:
- **Timestamp**: When ownership changed
- **Trigger**: What caused the transition
- **From Role**: Previous owner
- **To Role**: New owner
- **Action Required**: What the new owner must do
- **Status**: Pending / In Progress / Completed / Overdue

### Notification Rules

**Implementation Status Note:** Push and email notification infrastructure exists but is NOT currently connected to ACWR alerts. Only database/dashboard notifications are implemented. See `acwr-alerts.service.ts` for current implementation.

| Priority | Trigger | Notification Method (Design) | Current Implementation | Escalation |
|----------|---------|-------------------|------------------------|------------|
| **Critical** | ACWR > 1.5, Injury flag | Push + Email + Dashboard | Dashboard notification only | After 24h → Superadmin |
| **High** | ACWR > 1.3, Wellness < 40% | Push + Dashboard | Dashboard notification only | After 48h → Email reminder |
| **Medium** | Missing wellness 3+ days | Dashboard badge | Dashboard badge | After 7 days → Push notification |
| **Low** | RTP phase complete | Dashboard only | Dashboard only | None |

---

## 9. Exception & Failure Flows

### Failure-State Flow Patterns

The system must gracefully handle scenarios where:
- Data is missing or incomplete
- Users don't comply with expected behaviors
- Conflicting inputs occur
- System calculations become unreliable

### Missing Data Scenarios

#### Scenario 1: Player Skips Wellness Check-in

```
Day 1: Wellness logged ✅
Day 2: Wellness skipped ❌
Day 3: Wellness skipped ❌
         │
         ▼
┌────────────────────┐
│ System detects     │
│ missing data        │
└─────────┬──────────┘
          │
          ├─────────────────┬─────────────────┐
          ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Player Dashboard│ │ Coach Dashboard │ │ AI Coach        │
│ Warning Badge   │ │ "Data           │ │ Switches to     │
│ "Complete       │ │ Incomplete"     │ │ Conservative    │
│ wellness"       │ │ Badge           │ │ Advice          │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │
          ▼
┌────────────────────┐
│ Day 4: Still      │
│ missing → Push     │
│ notification sent │
└────────────────────┘
```

**Data Confidence Impact:**
- 1 day missing: Confidence 90% (uses last known value)
- 2 days missing: Confidence 70% (uses trend estimate)
- 3+ days missing: Confidence 50% (reduced analytics reliability)

#### Scenario 2: Late or Retroactive Training Logging

```
Player logs training session
         │
         ▼
┌────────────────────┐
│ Check timestamp    │
│ vs. session time   │
└─────────┬──────────┘
          │
          ├── Within 24h ──▶ Normal processing
          │
          ├── 24-48h late ──▶
          │                  ▼
          │         ┌────────────────────┐
          │         │ Flag as "Late Log" │
          │         │ ACWR recalculated  │
          │         │ with timestamp     │
          │         └────────────────────┘
          │
          └── >48h late ──▶
                         ▼
              ┌────────────────────┐
              │ Requires Coach     │
              │ Approval           │
              │ "Retroactive Log"  │
              │ Badge              │
              └────────────────────┘
```

#### Scenario 3: Conflicting Inputs

```
Player logs: RPE = 8 (High intensity)
Coach marked: Session Type = "Recovery" (Light)
         │
         ▼
┌────────────────────┐
│ System detects     │
│ conflict           │
└─────────┬──────────┘
          │
          ├─────────────────┬─────────────────┐
          ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Player sees     │ │ Coach sees      │ │ System uses     │
│ "Discrepancy    │ │ "Input          │ │ Player RPE      │
│ Detected"       │ │ Conflict"       │ │ (primary)       │
│ notification    │ │ Badge           │ │ Coach can       │
│                 │ │                 │ │ override        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Data Confidence Indicators

#### Confidence Levels

| Confidence | Meaning | Visual Indicator | Impact on Analytics |
|------------|---------|------------------|---------------------|
| **95-100%** | Complete, recent data | Green badge ✅ | Full analytics available |
| **80-94%** | Minor gaps, estimated values | Yellow badge ⚠️ | Analytics with confidence intervals |
| **60-79%** | Significant gaps | Orange badge ⚠️⚠️ | Reduced analytics, conservative recommendations |
| **<60%** | Major data gaps | Red badge ❌ | Minimal analytics, manual review required |

#### Where Confidence Indicators Appear

1. **Dashboard**
   - Player: "Your data confidence: 85%"
   - Coach: Per-player confidence badges on roster

2. **ACWR Dashboard**
   - "ACWR calculated with 78% confidence"
   - Confidence interval shown: "1.2 - 1.4 (estimated)"

3. **Game Day Readiness**
   - "Readiness score: 72% (confidence: 65%)"
   - Warning: "Limited data available"

4. **AI Coach Responses**
   - "Based on available data (82% confidence)..."
   - Switches to conservative advice when confidence < 70%

### Partial Data Handling

#### ACWR with Missing Training Data

```
Missing 1 day of training logs
         │
         ▼
┌────────────────────┐
│ System estimates  │
│ load based on:    │
│ - Historical avg  │
│ - Session type    │
│ - Calendar events │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ ACWR shown with    │
│ confidence range   │
│ "1.3 (est. 1.2-1.4)│
│ Confidence: 75%"   │
└────────────────────┘
```

#### Wellness Score with Missing Metrics

```
Player logs 3/5 wellness metrics
         │
         ▼
┌────────────────────┐
│ System calculates │
│ partial score      │
│ Uses available     │
│ metrics only       │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Wellness: 65%      │
│ (3/5 metrics)      │
│ Confidence: 60%    │
│ "Complete check-in │
│ for better insights"│
└────────────────────┘
```

### Coach Override Transparency

When coaches override AI recommendations, the system tracks and displays:

```
Coach adjusts training load
         │
         ▼
┌────────────────────┐
│ Override Log       │
│ Created            │
└─────────┬──────────┘
          │
          ├─────────────────┬─────────────────┐
          ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Player sees     │ │ Coach sees      │ │ System learns   │
│ "AI suggested:  │ │ Override        │ │ from pattern    │
│ 60% load        │ │ history         │ │ (if repeated)   │
│ Coach set:      │ │ "You've         │ │                 │
│ 80% load"       │ │ overridden      │ │                 │
│                 │ │ 3x this week"   │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Override Display Format:**
- Original AI recommendation
- Coach's decision
- Reason (optional, coach can add note)
- Timestamp
- Impact on ACWR (if applicable)

### Error Recovery Flows

#### Data Entry Errors

```
User enters invalid data
         │
         ▼
┌────────────────────┐
│ Validation error  │
│ shown immediately │
└─────────┬──────────┘
          │
          ├── Corrects immediately ──▶ Success
          │
          └── Saves anyway (if allowed) ──▶
                                         ▼
                              ┌────────────────────┐
                              │ Data flagged       │
                              │ "Needs review"     │
                              │ Coach notified     │
                              └────────────────────┘
```

#### System Calculation Errors

```
ACWR calculation fails
         │
         ▼
┌────────────────────┐
│ Fallback to        │
│ last known value   │
│ + warning badge    │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ User sees:         │
│ "ACWR unavailable │
│ (using last value) │
│ Contact support"   │
└────────────────────┘
          │
          ▼
┌────────────────────┐
│ Error logged       │
│ Support notified   │
│ (if critical)      │
└────────────────────┘
```

---

## 10. Consent & Privacy UX Flow

### Privacy & Consent Journey

#### Player Onboarding: Consent Choices

```
New Player Registration
         │
         ▼
┌────────────────────┐
│ Onboarding Step 5: │
│ Data Sharing       │
│ Preferences        │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Granular Controls   │            │ Quick Options       │
│                     │            │                     │
│ ☑ Wellness Data     │            │ [ ] Share All       │
│ ☑ Training Logs     │            │ [ ] Share Partial   │
│ ☑ ACWR Data         │            │ [ ] Share Minimal   │
│ ☑ Performance Stats  │            │                     │
│ ☐ Mental Health     │            │                     │
│ ☐ Body Composition  │            │                     │
└─────────────────────┘            └─────────────────────┘
          │
          ▼
┌────────────────────┐
│ Explanation:       │
│ "Coaches see:      │
│ - Your wellness    │
│ - Training load    │
│ - ACWR status      │
│                    │
│ They DON'T see:    │
│ - Mental health    │
│ - Body composition │
│ - Personal notes"  │
└────────────────────┘
```

#### Player Dashboard: Privacy Status

```
Player Dashboard Header
┌────────────────────────────────────────────┐
│ [Avatar] John Doe                          │
│                                            │
│ 🔒 Privacy Status                          │
│ ─────────────────                          │
│ Sharing: 4/6 metrics                       │
│ ✅ Wellness, Training, ACWR, Performance   │
│ ⛔ Mental Health, Body Composition         │
│                                            │
│ [Manage Privacy] →                         │
└────────────────────────────────────────────┘
```

#### One-Tap Privacy Management

```
Player clicks "Manage Privacy"
         │
         ▼
┌────────────────────┐
│ Privacy Settings   │
│ Modal Opens        │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Toggle Switches     │            │ Preview View         │
│                     │            │                      │
│ Wellness Data       │ [ON]       │ "Coach sees:"        │
│ Training Logs       │ [ON]       │ ✅ Wellness score    │
│ ACWR Data           │ [ON]       │ ✅ Training load     │
│ Performance Stats   │ [ON]       │ ✅ ACWR status       │
│ Mental Health       │ [OFF]      │ ⛔ Mental health      │
│ Body Composition    │ [OFF]      │ ⛔ Body composition   │
│                     │            │                      │
│ [Save Changes]      │            │                      │
└─────────────────────┘            └─────────────────────┘
```

### Coach View: Data Sharing Status

#### Player Card with Privacy Indicators

```
Coach Dashboard - Player Card
┌────────────────────────────────────────────┐
│ [Avatar] John Doe                          │
│                                            │
│ Wellness: 72% ✅                           │
│ ACWR: 1.2 ✅                               │
│                                            │
│ Data Status:                                │
│ ✅ Fully Shared                             │
│                                            │
│ [View Details] →                           │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ [Avatar] Jane Smith                        │
│                                            │
│ Wellness: -- ⚠️                            │
│ ACWR: -- ⚠️                                │
│                                            │
│ Data Status:                                │
│ ⚠️ Partially Shared                        │
│ (Wellness: ✅, ACWR: ✅,                    │
│  Performance: ⛔)                            │
│                                            │
│ [View Details] →                           │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ [Avatar] Mike Johnson                      │
│                                            │
│ Wellness: -- ⛔                            │
│ ACWR: -- ⛔                                │
│                                            │
│ Data Status:                                │
│ ⛔ Not Shared                               │
│                                            │
│ [Request Access] →                         │
└────────────────────────────────────────────┘
```

#### Coach Player Detail View

```
Player Detail Page
┌────────────────────────────────────────────┐
│ John Doe - Player Profile                  │
│                                            │
│ Data Availability:                         │
│ ─────────────────                          │
│ ✅ Wellness Data        [View]             │
│ ✅ Training Logs        [View]             │
│ ✅ ACWR Data            [View]             │
│ ✅ Performance Stats    [View]             │
│ ⛔ Mental Health        [Not Shared]       │
│ ⛔ Body Composition     [Not Shared]       │
│                                            │
│ [Request Additional Access]                │
│ (Non-pushy CTA, explains why)             │
└────────────────────────────────────────────┘
```

### Data Not Shared States

#### Coach View: Limited Data Available

```
Coach Dashboard - Player with Limited Sharing
┌────────────────────────────────────────────┐
│ John Doe                                   │
│                                            │
│ ⚠️ Limited Data Available                  │
│ ─────────────────                          │
│                                            │
│ Available:                                 │
│ • ACWR: 1.2 ✅                            │
│ • Training: Last 7 days ✅                 │
│                                            │
│ Not Available:                             │
│ • Wellness scores ⛔                       │
│ • Performance metrics ⛔                    │
│                                            │
│ [Request Access] →                        │
│ (Opens non-intrusive request modal)       │
└────────────────────────────────────────────┘
```

#### Request Access Flow (Non-Pushy)

```
Coach clicks "Request Access"
         │
         ▼
┌────────────────────┐
│ Request Modal      │
│                    │
│ "I'd like to see   │
│ your wellness data │
│ to better          │
│ understand your    │
│ recovery needs."   │
│                    │
│ [ ] Wellness Data  │
│ [ ] Performance    │
│                    │
│ [Cancel] [Send]    │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Player receives    │
│ notification:      │
│ "Coach requested   │
│ access to wellness │
│ data"              │
│                    │
│ [View Request] →   │
└────────────────────┘
```

### Privacy Recovery Flows

#### Player Changes Privacy Settings

```
Player turns OFF "Wellness Data" sharing
         │
         ▼
┌────────────────────┐
│ Confirmation       │
│ Dialog             │
│                    │
│ "Coaches will no   │
│ longer see your    │
│ wellness scores.   │
│ Continue?"         │
│                    │
│ [Cancel] [Confirm] │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐     ┌────────────────────┐
│ Coach Dashboard    │────▶│ Player card shows  │
│ Updates            │     │ "Wellness: -- ⛔"  │
│                    │     │ Badge updated      │
└────────────────────┘     └────────────────────┘
```

#### Partial Sharing Scenarios

```
Player shares Wellness but not ACWR
         │
         ▼
┌────────────────────┐
│ Coach sees:        │
│                    │
│ Wellness: 72% ✅   │
│ ACWR: -- ⛔         │
│                    │
│ System shows:      │
│ "ACWR unavailable  │
│ (privacy settings)"│
│                    │
│ Coach can still:   │
│ - View wellness    │
│ - Adjust training  │
│ - Contact player   │
│                    │
│ Coach cannot:      │
│ - See load trends  │
│ - Calculate risk   │
│   from ACWR        │
└────────────────────┘
```

### Consent Audit Trail

All consent changes are logged:

| Timestamp | Player | Change | From | To | Triggered By |
|-----------|--------|--------|------|-----|-------------|
| 2026-01-15 10:30 | John Doe | Wellness sharing | ON | OFF | Player |
| 2026-01-15 14:20 | Jane Smith | Performance sharing | OFF | ON | Player (after coach request) |

---

## 11. Cross-Day Continuity

### Temporal Continuity Layer

The system connects days through automatic follow-up actions and protocols.

### Automatic Follow-up Events

| Event | Automatic Follow-up | Duration | Visibility |
|-------|-------------------|----------|------------|
| **Game Day** | 48h recovery block injected | 2 days | Player dashboard, Coach view |
| **ACWR Spike (>1.5)** | Next 3 sessions capped at 70% load | 3 sessions | Training schedule, Player alert |
| **Tournament End** | Sleep + hydration emphasis | 7 days | Wellness dashboard, Notifications |
| **Travel Recovery** | Training intensity gate (max 60%) | 2-3 days | Training schedule, Coach override available |
| **Injury Flag** | RTP protocol activation | Until cleared | Physio dashboard, Player protocol |
| **Wellness < 40%** | Next day auto-recovery focus | 1 day | Today's practice, Recovery recommendations |
| **Missing Wellness 3+ Days** | Coach follow-up reminder | Until resolved | Coach dashboard, Escalation |

### Cross-Day Flow Examples

#### Example 1: Game Day → Recovery Protocol

```
Game Day (Saturday)
         │
         ▼
┌────────────────────┐
│ Game completed     │
│ Load logged        │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ System triggers    │
│ Recovery Protocol  │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Day 1 (Sunday)     │            │ Day 2 (Monday)      │
│                     │            │                     │
│ Recovery Block      │            │ Recovery Block      │
│ Active              │            │ Active              │
│                     │            │                     │
│ • Max load: 30%     │            │ • Max load: 50%     │
│ • Sleep focus       │            │ • Active recovery   │
│ • Hydration targets │            │ • Light movement    │
│ • No intense work   │            │ • No contact        │
└─────────────────────┘            └─────────────────────┘
          │
          ▼
┌────────────────────┐
│ Day 3 (Tuesday)   │
│ Normal training    │
│ resumes            │
│ (if wellness OK)   │
└────────────────────┘
```

#### Example 2: ACWR Spike → Load Capping

```
Monday: ACWR spikes to 1.6
         │
         ▼
┌────────────────────┐
│ Critical Alert     │
│ Coach notified     │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ System auto-caps   │
│ next 3 sessions    │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Tuesday Session     │            │ Wednesday Session   │
│                     │            │                     │
│ Original: 80% load  │            │ Original: 75% load  │
│ Capped: 70% load    │            │ Capped: 70% load    │
│                     │            │                     │
│ [Override Available]│            │ [Override Available]│
│ (Coach can adjust)  │            │ (Coach can adjust)  │
└─────────────────────┘            └─────────────────────┘
          │
          ▼
┌────────────────────┐
│ Thursday Session   │
│ Original: 85% load │
│ Capped: 70% load   │
│                    │
│ After 3 sessions:  │
│ Cap removed        │
│ (if ACWR improved) │
└────────────────────┘
```

#### Example 3: Tournament Fatigue → Recovery Emphasis

```
Tournament ends (Sunday)
         │
         ▼
┌────────────────────┐
│ System calculates  │
│ cumulative fatigue │
│ (games + travel)   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Recovery Protocol  │
│ Activated          │
│ (7 days)           │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Days 1-3            │            │ Days 4-7            │
│                     │            │                     │
│ • Sleep emphasis    │            │ • Gradual return    │
│ • Hydration targets │            │ • Load monitoring   │
│ • Light movement    │            │ • Wellness checks    │
│ • No intense work   │            │ • ACWR tracking     │
│                     │            │                     │
│ Notifications:      │            │ Notifications:      │
│ "Focus on recovery" │            │ "Monitor load"      │
└─────────────────────┘            └─────────────────────┘
```

### Travel Recovery Protocol

```
Travel event logged
         │
         ▼
┌────────────────────┐
│ System detects:    │
│ - Travel duration  │
│ - Time zone change │
│ - Arrival time     │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Recovery Protocol  │
│ Calculated         │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Day 1 (Arrival)     │            │ Day 2-3            │
│                     │            │                     │
│ • No training       │            │ • Max 60% load      │
│ • Hydration focus   │            │ • Sleep monitoring  │
│ • Sleep adjustment  │            │ • Light sessions    │
│                     │            │                     │
│ Auto-scheduled:     │            │ Auto-scheduled:     │
│ Recovery day        │            │ Reduced intensity   │
└─────────────────────┘            └─────────────────────┘
```

### Continuity Indicators

#### Player Dashboard: "What's Next"

```
Player Dashboard - Continuity Section
┌────────────────────────────────────────────┐
│ What's Next                                │
│ ─────────────────                          │
│                                            │
│ 🏈 Game Day Recovery                       │
│ Active for 1 more day                      │
│ • Focus: Sleep & hydration                 │
│ • Training: Light movement only            │
│                                            │
│ 📊 ACWR Monitoring                         │
│ Load cap active (2 sessions remaining)     │
│ • Next session: Max 70%                    │
│                                            │
│ 🛫 Travel Recovery                         │
│ Complete in 1 day                          │
│ • Normal training resumes tomorrow         │
└────────────────────────────────────────────┘
```

#### Coach Dashboard: Team Continuity

```
Coach Dashboard - Team Continuity
┌────────────────────────────────────────────┐
│ Active Protocols                           │
│ ─────────────────                          │
│                                            │
│ 🏈 Game Day Recovery (5 players)           │
│ • 3 players: Day 1                         │
│ • 2 players: Day 2                        │
│                                            │
│ ⚠️ ACWR Load Caps (2 players)              │
│ • John Doe: 2 sessions remaining           │
│ • Jane Smith: 1 session remaining          │
│                                            │
│ 🛫 Travel Recovery (3 players)              │
│ • All complete tomorrow                    │
└────────────────────────────────────────────┘
```

### Temporal Context in AI Coach

```
AI Coach considers cross-day context:

"Based on your game yesterday and current
wellness score, I recommend:
• Light movement today (recovery day)
• Focus on sleep tonight
• Tomorrow: Gradual return to training

Your ACWR is being monitored - we'll
automatically adjust if needed."
```

---

## 12. Multi-Role Collaboration Workflows

### Shared Insight Feed Architecture

A role-filtered feed where professionals contribute insights that cascade appropriately to other roles.

### Insight Flow Model

```
Player Insight / Data
         │
         ▼
┌────────────────────┐
│ Professional       │
│ Comment/Insight    │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Coach Summary       │            │ Action Required     │
│ (Auto-generated)    │            │ (If flagged)        │
│                     │            │                     │
│ "Physio notes:     │            │ Coach sees:         │
│ Player cleared for │            │ "Action Required"   │
│ light training"     │            │ badge               │
└─────────────────────┘            └─────────────────────┘
```

### Collaboration Workflow Examples

#### Example 1: Physio → Coach Communication

```
Physio adds RTP note
         │
         ▼
┌────────────────────┐
│ Physio Dashboard   │
│                    │
│ Player: John Doe   │
│ Status: RTP Phase 2│
│                    │
│ Note: "Cleared for │
│ light running,     │
│ no cutting yet"    │
│                    │
│ Visibility:        │
│ ☑ Coach            │
│ ☑ Player            │
│ ☐ Nutritionist      │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐     ┌────────────────────┐
│ Coach Dashboard    │────▶│ Coach sees:        │
│ Updates            │     │                    │
│                    │     │ "Physio Update:    │
│                    │     │ John Doe cleared   │
│                    │     │ for light running" │
│                    │     │                    │
│                    │     │ Training plan      │
│                    │     │ auto-updated       │
└────────────────────┘     └────────────────────┘
```

#### Example 2: Nutritionist → Tournament Days → Player Compliance

```
Tournament starts
         │
         ▼
┌────────────────────┐
│ Nutritionist       │
│ creates meal plan  │
│ for tournament     │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐     ┌────────────────────┐
│ Players notified   │────▶│ Player Dashboard  │
│                    │     │                    │
│                    │     │ "Tournament        │
│                    │     │ Nutrition Plan"    │
│                    │     │                    │
│                    │     │ Meal schedule      │
│                    │     │ Hydration targets  │
└────────────────────┘     └────────────────────┘
          │
          ▼
┌────────────────────┐
│ Player logs meals  │
│ (or doesn't)       │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐     ┌────────────────────┐
│ Nutritionist sees │────▶│ Coach Summary:     │
│ compliance status  │     │                    │
│                    │     │ "5/8 players       │
│                    │     │ following plan"    │
│                    │     │                    │
│                    │     │ Coach can see:     │
│                    │     │ - Compliance %     │
│                    │     │ - Not individual   │
│                    │     │   meal details     │
└────────────────────┘     └────────────────────┘
```

#### Example 3: Psychologist → Mental Fatigue → Coach Awareness

```
Player flags mental fatigue
         │
         ▼
┌────────────────────┐
│ System routes to   │
│ Psychologist       │
│ (if consented)     │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Psychologist       │
│ reviews & adds     │
│ insight            │
│                    │
│ "Player showing    │
│ signs of mental    │
│ fatigue.           │
│ Recommend:         │
│ - Reduced pressure  │
│ - Recovery focus"  │
│                    │
│ Share with Coach:  │
│ ☑ Summary only     │
│ ☐ Detailed notes   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐     ┌────────────────────┐
│ Coach sees:       │────▶│ Coach Dashboard   │
│                    │     │                    │
│ "Mental Health     │     │ "John Doe:        │
│ Update:            │     │ Mental fatigue    │
│                    │     │ detected.         │
│ Player may benefit │     │ Consider reduced  │
│ from reduced       │     │ pressure."        │
│ training pressure" │     │                    │
│                    │     │ (No privacy       │
│ (No specific       │     │ violation)        │
│ details shared)    │     └────────────────────┘
└────────────────────┘
```

### Shared Insight Feed Structure

```
Insight Feed (Role-Filtered)
┌────────────────────────────────────────────┐
│ Recent Insights                            │
│ ─────────────────                          │
│                                            │
│ 🏥 Physio - 2 hours ago                   │
│ "John Doe cleared for Phase 2"            │
│ [View Details] →                          │
│                                            │
│ 🥗 Nutritionist - 5 hours ago             │
│ "Tournament meal plan updated"             │
│ [View Plan] →                             │
│                                            │
│ 🧠 Psychologist - 1 day ago                │
│ "Team mental wellness check complete"      │
│ [View Summary] →                          │
│                                            │
│ [Filter by: All | Physio | Nutrition |     │
│            Psychology]                     │
└────────────────────────────────────────────┘
```

### Role Permissions Matrix

| Insight Type | Creator | Coach Sees | Player Sees | Other Pros See |
|--------------|---------|------------|-------------|----------------|
| **RTP Protocol** | Physio | Full details | Full details | Summary only |
| **Nutrition Plan** | Nutritionist | Compliance % | Full plan | Summary only |
| **Mental Health** | Psychologist | Summary only | Full (if consented) | None |
| **Injury Assessment** | Physio | Full details | Full details | Summary only |
| **Performance Note** | Coach | Full details | Full details | Summary only |

### Collaboration Notification Rules

| Event | Notify Coach | Notify Player | Notify Other Pros |
|-------|-------------|---------------|-------------------|
| RTP phase change | ✅ Immediate | ✅ Immediate | ⚠️ Summary only |
| Nutrition plan update | ✅ Summary | ✅ Full | ❌ No |
| Mental health flag | ✅ Summary only | ✅ Full (if consented) | ❌ No |
| Injury assessment | ✅ Immediate | ✅ Immediate | ⚠️ Summary only |
| Performance note | ✅ Immediate | ✅ Immediate | ⚠️ Summary only |

### Write-Once, Multi-Role Visibility

```
Professional writes insight once
         │
         ▼
┌────────────────────┐
│ Insight created    │
│ with visibility    │
│ settings           │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Coach View          │            │ Player View         │
│ (Filtered)          │            │ (Filtered)          │
│                     │            │                     │
│ Sees appropriate    │            │ Sees appropriate    │
│ level of detail     │            │ level of detail     │
│ based on role       │            │ based on consent    │
│                     │            │                     │
│ Can take action     │            │ Can follow          │
│ if needed           │            │ recommendations     │
└─────────────────────┘            └─────────────────────┘
```

---

## 13. Exit, Pause & Offboarding Flows

### Season End Flow

```
Season ends (coach marks season complete)
         │
         ▼
┌────────────────────┐
│ System triggers    │
│ Season End Process │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Data Archiving      │            │ Summary Report      │
│                     │            │                     │
│ • All data moved    │            │ Generated for:      │
│   to archive        │            │ • Each player       │
│ • Analytics frozen  │            │ • Coach             │
│ • ACWR calculations │            │ • Team              │
│   stopped           │            │                     │
│ • Read-only access  │            │ Includes:           │
│   maintained        │            │ • Season stats      │
│                     │            │ • Performance       │
│                     │            │   trends            │
│                     │            │ • Injury summary    │
│                     │            │ • Recommendations   │
└─────────────────────┘            └─────────────────────┘
          │
          ▼
┌────────────────────┐
│ Players notified:  │
│ "Season archived.  │
│ View your summary  │
│ report"            │
└────────────────────┘
```

### Player Transfer Flow

```
Player leaves team / transfers
         │
         ▼
┌────────────────────┐
│ Coach initiates    │
│ "Remove Player"     │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Confirmation       │
│ Dialog             │
│                    │
│ "Remove John Doe   │
│ from team?         │
│                    │
│ Options:           │
│ [ ] Archive data   │
│ [ ] Delete data    │
│ [ ] Transfer data   │
│                    │
│ [Cancel] [Confirm] │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Archive Path        │            │ Transfer Path       │
│                     │            │                     │
│ • Data archived     │            │ • Data scope reset  │
│ • Player can        │            │ • Player joins      │
│   download export   │            │   new team          │
│ • Coach retains     │            │ • Historical data   │
│   read-only access  │            │   preserved         │
│ • Analytics         │            │ • New team sees     │
│   excluded from     │            │   only new data     │
│   team metrics      │            │   (unless           │
│                     │            │   explicitly        │
│                     │            │   shared)          │
└─────────────────────┘            └─────────────────────┘
```

### Inactive Player Flow

```
Player inactive for 30+ days
         │
         ▼
┌────────────────────┐
│ System detects     │
│ inactivity          │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Player Notification │            │ Coach Dashboard     │
│                     │            │                     │
│ "We haven't seen    │            │ Player badge:       │
│ you in a while.     │            │ "Inactive"          │
│                    │            │                     │
│ [ ] Still active    │            │ Analytics:          │
│ [ ] Taking a break  │            │ Excluded from       │
│ [ ] Left team       │            │ team metrics        │
│                     │            │                     │
│ [Update Status]     │            │ Can reactivate      │
└─────────────────────┘            └─────────────────────┘
          │
          ▼
┌────────────────────┐
│ After 90 days:     │
│ • Analytics        │
│   excluded         │
│ • Data archived    │
│ • Read-only access │
│ • Can reactivate   │
│   anytime          │
└────────────────────┘
```

### Account Pause Flow

```
User requests account pause
         │
         ▼
┌────────────────────┐
│ Pause Options      │
│                    │
│ Duration:          │
│ [ ] 1 week         │
│ [ ] 1 month        │
│ [ ] Indefinite     │
│                    │
│ What happens:      │
│ • ACWR frozen      │
│ • No new data      │
│ • Read-only access │
│ • Can resume       │
│   anytime          │
│                    │
│ [Cancel] [Pause]   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Account Paused     │
│                    │
│ • Dashboard shows  │
│   "Account Paused" │
│ • Last ACWR        │
│   displayed        │
│ • Historical data  │
│   accessible       │
│ • [Resume Account] │
│   button           │
└────────────────────┘
```

### Long-Term Injury Flow

```
Player marked "Long-term injury"
         │
         ▼
┌────────────────────┐
│ System adjusts     │
│ analytics          │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Player Dashboard    │            │ Coach Dashboard     │
│                     │            │                     │
│ • ACWR frozen       │            │ • Player excluded   │
│ • Recovery focus    │            │   from team         │
│ • RTP protocol      │            │   readiness %       │
│   active            │            │ • Injury status     │
│ • Wellness tracking │            │   visible           │
│   continues         │            │ • Can reactivate    │
│                     │            │   when cleared      │
└─────────────────────┘            └─────────────────────┘
```

### Data Retention & Deletion

```
User requests account deletion
         │
         ▼
┌────────────────────┐
│ Deletion Warning   │
│                    │
│ "This will:        │
│ • Delete all data  │
│ • Cannot be undone │
│ • Team analytics   │
│   will be affected │
│                    │
│ Options:           │
│ [ ] Download data  │
│     first (export) │
│ [ ] Delete         │
│     immediately    │
│                    │
│ [Cancel] [Delete]  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ If export chosen:  │
│ • Full data export │
│   generated        │
│ • Download link    │
│   sent (7 days)    │
│ • Deletion         │
│   scheduled        │
└────────────────────┘
```

### Offboarding Checklist

#### For Players Leaving Team

- [ ] Data archived or transferred
- [ ] Export available (if requested)
- [ ] Team analytics updated (player excluded)
- [ ] Coach notified
- [ ] Account status updated
- [ ] Historical data preserved (if archived)

#### For Season End

- [ ] All data archived
- [ ] Summary reports generated
- [ ] Analytics frozen
- [ ] Players notified
- [ ] Coaches notified
- [ ] Read-only access maintained
- [ ] New season can begin (fresh start)

#### For Account Deletion

- [ ] Data export offered
- [ ] 7-day grace period
- [ ] All data deleted
- [ ] Team analytics updated
- [ ] Confirmation sent

---

## 14. Additional UX Enhancements

### Offline-First Behavior

#### Critical Scenarios for Offline Support

**Game Day Priority:**
- Game Tracker must work offline
- Training session logging available offline
- Wellness check-ins cached locally
- Data syncs when connection restored

#### Offline Flow Pattern

```
User opens app (no connection)
         │
         ▼
┌────────────────────┐
│ System detects     │
│ offline status     │
└─────────┬──────────┘
          │
          ├─────────────────────────────────────┐
          │                                     │
          ▼                                     ▼
┌─────────────────────┐            ┌─────────────────────┐
│ Offline Mode        │            │ Cached Data         │
│ Activated           │            │ Available            │
│                     │            │                     │
│ • Local storage     │            │ • Last wellness     │
│   enabled           │            │ • Last ACWR          │
│ • Queue actions     │            │ • Training schedule  │
│   for sync          │            │ • Exercise library   │
│ • Show "Offline"    │            │                     │
│   badge             │            │ • Read-only views   │
│                     │            │   work              │
└─────────────────────┘            └─────────────────────┘
          │
          ▼
┌────────────────────┐
│ User performs      │
│ actions (logged    │
│ locally)           │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Connection         │
│ restored           │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Auto-sync queued   │
│ actions            │
│                    │
│ "3 items synced"   │
│ notification       │
└────────────────────┘
```

#### Offline Capabilities by Feature

| Feature | Offline Capable | Sync Priority | Cached Data |
|---------|----------------|---------------|-------------|
| **Game Tracker** | ✅ Full | Critical | Last game template |
| **Training Log** | ✅ Full | High | Today's schedule |
| **Wellness Check-in** | ✅ Full | High | Last check-in |
| **ACWR Dashboard** | ⚠️ View only | Medium | Last calculation |
| **Coach Dashboard** | ⚠️ View only | Medium | Last sync data |
| **AI Coach** | ❌ No | N/A | N/A |
| **Analytics** | ⚠️ View only | Low | Last report |

#### Offline Indicators

```
App Header (Offline Mode)
┌────────────────────────────────────────────┐
│ 🏈 FlagFit Pro        [📴 Offline]         │
│                                            │
│ "Working offline. Changes will sync        │
│ when connection is restored."              │
└────────────────────────────────────────────┘
```

### User Education Checkpoints

#### Contextual Hints (Not Intrusive Tours)

**First-Time Feature Discovery:**
- Subtle tooltips on hover
- "New" badges on features
- One-time contextual hints
- Dismissible help cards

#### Education Checkpoint Examples

**Wellness Check-in (First Time):**
```
Player opens Wellness page (first time)
         │
         ▼
┌────────────────────┐
│ Contextual Hint    │
│ Card appears       │
│                    │
│ "💡 Tip: Complete  │
│ your wellness      │
│ check-in daily for │
│ better training    │
│ recommendations"   │
│                    │
│ [Got it] [Learn    │
│ More]              │
└────────────────────┘
```

**ACWR Dashboard (First Time):**
```
Player opens ACWR Dashboard (first time)
         │
         ▼
┌────────────────────┐
│ Contextual Hint    │
│                    │
│ "💡 Your ACWR      │
│ (Acute:Chronic     │
│ Workload Ratio)    │
│ helps prevent      │
│ injury. Keep it    │
│ between 0.8-1.3"   │
│                    │
│ [Got it] [Read     │
│ Guide]             │
└────────────────────┘
```

**Coach Override (First Override):**
```
Coach overrides AI recommendation (first time)
         │
         ▼
┌────────────────────┐
│ Contextual Hint    │
│                    │
│ "💡 Your overrides │
│ are logged and     │
│ help improve AI    │
│ recommendations.   │
│ Consider adding a  │
│ note explaining    │
│ your decision."    │
│                    │
│ [Got it] [Add Note]│
└────────────────────┘
```

#### Progressive Disclosure

- **Level 1**: Basic tooltips (always available)
- **Level 2**: Contextual hints (first-time use)
- **Level 3**: Detailed guides (on-demand via "Learn More")
- **Level 4**: Full documentation (Help Center)


---

## Status Legend

- ✅ **Implemented**: Feature is fully functional
- ⚠️ **Partial**: Core functionality exists, some documented features missing
- ❌ **Not Implemented**: Feature does not exist in codebase

---

## Appendix: Route Registry

### Player Routes

```
/player-dashboard     - Main dashboard
/training             - Training schedule
/training/log         - Log training session
/training/videos      - Video feed
/today                - Today's practice
/wellness             - Wellness & recovery
/acwr-dashboard       - Load monitoring
/analytics            - Performance analytics
/profile              - User profile
/settings             - User settings
/chat                 - AI Coach & team chat
/community            - Community feed
/exercise-library     - Exercise database
```

### Coach Routes

```
/coach/dashboard      - Coach dashboard
/coach/analytics      - Team analytics
/coach/inbox          - Coach inbox
/roster               - Roster management
/depth-chart          - Depth chart
/attendance           - Attendance tracking
/equipment            - Equipment management
/tournaments          - Tournament management
/games/tracker        - Game tracker
/games/live           - Live game tracking
/game-day-readiness   - Game day prep
/travel-recovery      - Travel protocols
/tournament-nutrition - Nutrition planning
/qb-hub               - QB training hub
```

### Admin Routes

```
/superadmin           - Superadmin dashboard
/officials            - Officials management
```

### Auth Routes

```
/login                - Login page
/register             - Registration
/forgot-password      - Password reset
/update-password      - Password update
/onboarding           - New user onboarding
```
