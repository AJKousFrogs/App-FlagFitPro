# FlagFit Pro - User Flow Design Document

## Complete User Journey & Navigation Architecture

*Version 1.0 | January 2026*

---

## Table of Contents

1. [User Roles & Entry Points](#1-user-roles--entry-points)
2. [Primary Navigation Structure](#2-primary-navigation-structure)
3. [User Flows by Role](#3-user-flows-by-role)
4. [Feature-to-Page Mapping](#4-feature-to-page-mapping)
5. [Critical User Journeys](#5-critical-user-journeys)
6. [Data Dependencies](#6-data-dependencies)
7. [Cross-Feature Connections](#7-cross-feature-connections)

---

## 1. User Roles & Entry Points

### Role Definitions

| Role | Description | Entry Point | Primary Focus |
|------|-------------|-------------|---------------|
| **Player/Athlete** | Individual athletes | `/player-dashboard` | Personal training, wellness, performance |
| **Coach** | Team coaches | `/coach/dashboard` | Team management, player monitoring |
| **Parent** | Parent of minor athlete | `/parent-dashboard` | Child monitoring, communication |
| **Assistant Coach** | Support coaching staff | `/coach/dashboard` | Limited team management |
| **Admin** | Team administrator | `/coach/dashboard` | Team settings, roster |
| **Superadmin** | Platform administrator | `/superadmin` | System-wide management |
| **Nutritionist** | Nutrition specialist | `/nutritionist` | Nutrition reports, meal plans |
| **Physiotherapist** | Physical therapist | `/physiotherapist` | Injury management, RTP |
| **Psychologist** | Mental performance | `/psychology` | Mental wellness reports |
| **Official** | Game official/referee | `/officials` | Game assignments, certifications |

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
│ Parent      → /parent-dashboard             │
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

### 3.4 Parent Flow

```
1. Parent Dashboard (/parent-dashboard)
   ├── View Child's Status
   ├── View Schedule
   ├── View Achievements
   │
   ▼
2. Monitor (Read-Only)
   ├── Wellness History
   ├── Training Compliance
   ├── Performance Trends
   │
   ▼
3. Communication
   ├── Team Chat (limited)
   ├── Coach Messages
   └── Event RSVPs
```

---

## 4. Feature-to-Page Mapping

### Core Features

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 1 | Dashboard | `/player-dashboard`, `/coach/dashboard` | All | ✅ Implemented |
| 2 | Training Schedule | `/training` | Player, Coach | ✅ Implemented |
| 3 | Today's Practice | `/today` | Player | ✅ Implemented |
| 4 | Wellness & Recovery | `/wellness` | Player | ✅ Implemented |
| 5 | ACWR Dashboard | `/acwr-dashboard` | Player, Coach | ✅ Implemented |

### Competition Features

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 6 | Travel Recovery | `/travel-recovery` | Player, Coach | ✅ Implemented |
| 7 | Game Day Readiness | `/game-day-readiness` | Coach | ✅ Implemented |
| 8 | Tournament Nutrition | `/tournament-nutrition` | Player, Coach | ✅ Implemented |
| 9 | Game Tracker | `/games/tracker`, `/games/live` | Coach | ✅ Implemented |
| 10 | Tournaments | `/tournaments` | Coach | ✅ Implemented |

### Team Management

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 11 | Roster Management | `/roster` | Coach | ✅ Implemented |
| 12 | Depth Chart | `/depth-chart` | Coach | ✅ Implemented |
| 13 | Attendance Tracking | `/attendance` | Coach | ✅ Implemented |
| 14 | Equipment Management | `/equipment` | Coach | ✅ Implemented |
| 15 | Officials Management | `/officials` | Official, Admin | ✅ Implemented |

### Analytics & Intelligence

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 16 | Analytics | `/analytics` | All | ✅ Implemented |
| 17 | AI Coach (Merlin) | `/chat`, `/ai-coach` | All | ✅ Implemented |

### User Experience

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 18 | Global Search | Header Component | All | ✅ Implemented |
| 19 | Notification Center | Header Component | All | ✅ Implemented |
| 20 | Achievements System | `/profile` (section) | Player | ⚠️ Partial |

### Account & Settings

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 21 | User Profile | `/profile` | All | ✅ Implemented |
| 22 | Settings | `/settings` | All | ✅ Implemented |
| 23 | Onboarding | `/onboarding` | New Users | ✅ Implemented |

### Physical & Supplement Tracking

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 24 | Body Composition | `/wellness` (section) | Player | ⚠️ Partial |
| 25 | Supplement Tracker | `/wellness` (section) | Player | ⚠️ Partial |
| 26 | Sprint Benchmarks | `/performance-tracking` | Player | ✅ Implemented |

### Position-Specific Training

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 27 | QB Hub | `/qb-hub` | QB Players, Coach | ✅ Implemented |
| 28 | Position Stats | `/analytics` (section) | All | ⚠️ Partial |
| 29 | Position Training | `/training` (filtered) | Player | ⚠️ Partial |

### Professional Reports

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 30 | Nutritionist Dashboard | `/nutritionist` | Nutritionist | ⚠️ Partial |
| 31 | Physiotherapist Dashboard | `/physiotherapist` | Physiotherapist | ⚠️ Partial |
| 32 | Psychology Reports | `/psychology` | Psychologist | ⚠️ Partial |

### Data Exchange

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 33 | Data Import/Export | `/settings` (section) | Coach, Admin | ⚠️ Partial |
| 34 | Knowledge Drop-In | `/settings` (section) | Coach | ❌ Not Implemented |

### Communication

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 35 | Team Chat | `/chat` | All | ✅ Implemented |
| 36 | Community Feed | `/community` | All | ✅ Implemented |

### Recovery & Injury

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 37 | Return-to-Play | `/rtp-protocol` | Coach, Physio | ⚠️ Partial |
| 38 | Sleep Debt | `/wellness` (section) | Player | ⚠️ Partial |
| 39 | Hydration Tracker | `/wellness` (section) | Player | ⚠️ Partial |
| 40 | Menstrual Tracking | `/wellness` (section) | Female Athletes | ⚠️ Partial |

### Administration

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 41 | Superadmin Dashboard | `/superadmin` | Superadmin | ✅ Implemented |

### Playbook & Strategy

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 42 | Playbook Library | `/playbook` | Coach | ⚠️ Partial |
| 43 | Video Analysis | `/video-analysis`, `/training/videos` | Coach, Player | ✅ Implemented |
| 44 | Scouting Reports | `/scouting` | Coach | ❌ Not Implemented |
| 45 | Practice Planning | `/practice-planning` | Coach | ⚠️ Partial |

### Scheduling & Logistics

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 46 | Team Calendar | `/calendar` | All | ⚠️ Partial |
| 47 | Financial Tracking | `/payments` | Admin | ❌ Not Implemented |
| 48 | Weather Integration | Dashboard (widget) | All | ⚠️ Partial |

### Specialized

| # | Feature | Route | Primary Users | Status |
|---|---------|-------|---------------|--------|
| 49 | Exercise Library | `/exercise-library` | All | ✅ Implemented |

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
2. Role selection (Player/Coach/Parent)
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

| Component | Used By Features |
|-----------|------------------|
| `WellnessScore` | Dashboard, Wellness, ACWR, Game Day Readiness |
| `ACWRIndicator` | Dashboard, ACWR, Training, Analytics |
| `PlayerCard` | Roster, Depth Chart, Coach Dashboard |
| `TrainingCalendar` | Training Schedule, Today, Calendar |
| `SessionLogger` | Training Log, Today's Practice |
| `NotificationBell` | All pages (header) |
| `SearchPanel` | All pages (header) |
| `AIInsight` | Dashboard, Wellness, Training |

### Navigation Shortcuts

| From | To | Trigger |
|------|-----|---------|
| Dashboard | Wellness | "Check-in" button |
| Dashboard | Today | "Today's Training" card |
| Dashboard | Training | "Schedule" quick action |
| Dashboard | Chat | "AI Coach" quick action |
| Wellness | ACWR Dashboard | "View Load Details" link |
| Training | Today | Date click (today) |
| Roster | Player Profile | Player row click |
| Game Tracker | Analytics | "View Stats" button |

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
