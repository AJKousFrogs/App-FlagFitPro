# Wireframe: Today's Practice

**Route:** `/today`  
**Users:** Players/Athletes  
**Status:** ✅ Implemented  
**Source:** `angular/src/app/features/today/today.component.ts`

---

## Skeleton Wireframe - Phase 1: Morning (Check-in)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ╭─────╮  Welcome, [Name]! I'm Merlin. To build your                           │  │
│  │  │ ✨  │  optimized training plan, I need to know how you're feeling.          │  │
│  │  ╰─────╯                                      ┌─────────────────────────────┐  │  │
│  │                                               │ ▼ Start Your First Check-in │  │  │
│  │                                               └─────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ↑ First-time user onboarding overlay (sticky)                                       │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  GOOD MORNING,                                                                  │ │
│  │  ████████████████████                                                           │ │
│  │  [Name]!                                                                        │ │
│  │  Let's start with your readiness check.                                         │ │
│  │                                                                                 │ │
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────┐              │ │
│  │  │ ACWR                        │  │ Readiness                   │              │ │
│  │  │ 0.92              [>]       │  │ 75%               [>]       │              │ │
│  │  └─────────────────────────────┘  └─────────────────────────────┘              │ │
│  │  ↑ Clickable - links to /acwr      ↑ Clickable - links to /wellness            │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  ╭─────────────────────────────────────────────────────────────────────────╮   │ │
│  │  │  Mon   Tue   Wed   Thu   Fri   Sat   Sun                                │   │ │
│  │  │  [✓]   [✓]   [○]   [ ]   [ ]   [ ]   [ ]     Completed: 2/7            │   │ │
│  │  │   1     2    3↑     4     5     6     7      Streak: 5 days            │   │ │
│  │  ╰─────────────────────────────────────────────────────────────────────────╯   │ │
│  │  ↑ Week Progress Strip component                                               │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  │ Morning Check-in                                        ┌─────────────┐     │ │
│  │  │ ────────────────────────────────────────────────────── │ Required    │     │ │
│  │  │                                                         └─────────────┘     │ │
│  │  │ Start your day by logging your readiness. This optimizes your training.     │ │
│  │  │                                                                             │ │
│  │  │ ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ │                    WELLNESS CHECK-IN COMPONENT                          │ │ │
│  │  │ │                                                                         │ │ │
│  │  │ │  Sleep Quality:    ☆  ☆  ☆  ☆  ☆                                       │ │ │
│  │  │ │  Muscle Soreness:  ☆  ☆  ☆  ☆  ☆                                       │ │ │
│  │  │ │  Stress Level:     ☆  ☆  ☆  ☆  ☆                                       │ │ │
│  │  │ │  Energy Level:     ☆  ☆  ☆  ☆  ☆                                       │ │ │
│  │  │ │  Mood:             😞  😐  🙂  😊  🤩                                    │ │ │
│  │  │ │                                                                         │ │ │
│  │  │ │                    ┌─────────────────────────┐                          │ │ │
│  │  │ │                    │      Submit Check-in    │                          │ │ │
│  │  │ │                    └─────────────────────────┘                          │ │ │
│  │  │ └─────────────────────────────────────────────────────────────────────────┘ │ │
│  │  │                                                                             │ │
│  └──┴─────────────────────────────────────────────────────────────────────────────┘ │
│  ↑ Green left border = highlight section                                            │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Skeleton Wireframe - Phase 2: Midday (Training Protocol)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  TIME TO TRAIN,                                                                 │ │
│  │  [Name]!                                                                        │ │
│  │  Follow your personalized protocol below.                                       │ │
│  │                                                                                 │ │
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────┐              │ │
│  │  │ ACWR                        │  │ Readiness                   │              │ │
│  │  │ 0.92 (optimal)    [>]       │  │ 82% (great)       [>]       │              │ │
│  │  └─────────────────────────────┘  └─────────────────────────────┘              │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  ╭───────────────────────────────────────────────────────────────────────────╮ │ │
│  │  │ ✨ Merlin's Insight                                                       │ │ │
│  │  │ ────────────────────────────────────────────────────────────────────────  │ │ │
│  │  │ "Your readiness is excellent today! This is a great opportunity for       │ │ │
│  │  │  high-intensity work. Push yourself in the main session."                 │ │ │
│  │  │                                                                           │ │ │
│  │  │  ┌──────────────────────────────┐                                         │ │ │
│  │  │  │ 💬 Discuss with Merlin       │                                         │ │ │
│  │  │  └──────────────────────────────┘                                         │ │ │
│  │  ╰───────────────────────────────────────────────────────────────────────────╯ │ │
│  │  ↑ AI Companion Card (gradient background)                                     │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  Today's Protocol                                                              │ │
│  │  ────────────────────────────────────────────────────────────────────────────  │ │
│  │                                                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐   │ │
│  │  │ ███████████████████████████░░░░░░░░░░░░░░░                              │   │ │
│  │  │ 4/8 Exercises                                                60%       │   │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                                 │ │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ 🌅 Morning Mobility                                          ▼ Expand    │ │ │
│  │  │ ─────────────────────────────────────────────────────────────────────────│ │ │
│  │  │  □ Hip Circles - 2 sets × 10 reps                         [▶ Video]     │ │ │
│  │  │  ☑ Cat-Cow Stretch - 2 sets × 10 reps                     [▶ Video]     │ │ │
│  │  │  □ Dynamic Lunges - 2 sets × 8 each                       [▶ Video]     │ │ │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                 │ │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ 💪 Main Session: Speed & Agility                             ▼ Expand    │ │ │
│  │  │ ─────────────────────────────────────────────────────────────────────────│ │ │
│  │  │  □ Ladder Drills - 3 sets × 30 sec                        [▶ Video]     │ │ │
│  │  │  □ Cone Drills - 3 sets × 4 reps                          [▶ Video]     │ │ │
│  │  │  □ Sprint Intervals - 5 sets × 20m                        [▶ Video]     │ │ │
│  │  │  □ Reaction Drills - 3 sets × 6 reps                      [▶ Video]     │ │ │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                 │ │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ 🧘 Evening Recovery                                          ▼ Expand    │ │ │
│  │  │ ─────────────────────────────────────────────────────────────────────────│ │ │
│  │  │  □ Foam Rolling - 10 min                                  [▶ Video]     │ │ │
│  │  │  □ Static Stretching - 10 min                             [▶ Video]     │ │ │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                 │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐   │ │
│  │  │              🔗 Advanced Training Workspace                             │   │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  Today Schedule                                                                │ │
│  │  ─────────────────────────────────────────────────────────────────────────────│ │
│  │                                                                                 │ │
│  │  07:00  ───●─── Morning Mobility (15 min)                         ✓ Done      │ │
│  │         │                                                                      │ │
│  │  09:00  ───○─── Speed & Agility (45 min)                          In Progress │ │
│  │         │                                                                      │ │
│  │  14:00  ───○─── Position Drills (30 min)                          Upcoming    │ │
│  │         │                                                                      │ │
│  │  18:00  ───○─── Evening Recovery (20 min)                         Upcoming    │ │
│  │                                                                                 │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Skeleton Wireframe - Phase 3: Evening (Wrap-up)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  GOOD EVENING,                                                                  │ │
│  │  [Name]!                                                                        │ │
│  │  Time to review and recover.                                                    │ │
│  │                                                                                 │ │
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────┐              │ │
│  │  │ ACWR                        │  │ Readiness                   │              │ │
│  │  │ 0.95              [>]       │  │ 78%               [>]       │              │ │
│  │  └─────────────────────────────┘  └─────────────────────────────┘              │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  │ Evening Wrap-up                                        ┌──────────────────┐ │ │
│  │  │ ─────────────────────────────────────────────────────  │ Recovery Time    │ │ │
│  │  │                                                        └──────────────────┘ │ │
│  │  │ Great job today! How did your training feel? Log your effort to keep       │ │
│  │  │ your ACWR accurate.                                                        │ │
│  │  │                                                                            │ │
│  │  │ ┌────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ │ ┌──────┐                                                               │ │ │
│  │  │ │ │  📖  │  Log Session Effort (RPE)                              [>]   │ │ │
│  │  │ │ └──────┘  Tell Merlin how hard you worked.                            │ │ │
│  │  │ └────────────────────────────────────────────────────────────────────────┘ │ │
│  │  │                                                                            │ │
│  │  │ ┌────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ │ ┌──────┐                                                               │ │ │
│  │  │ │ │  💚  │  Review Recovery Stats                                 [>]   │ │ │
│  │  │ │ └──────┘  Check your trends and sleep debt.                           │ │ │
│  │  │ └────────────────────────────────────────────────────────────────────────┘ │ │
│  │  │                                                                            │ │
│  └──┴────────────────────────────────────────────────────────────────────────────┘ │
│  ↑ Green left border = highlight section                                           │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Smart Header with Greeting ✅
| Element | Status | Notes |
|---------|--------|-------|
| Time-based greeting prefix | ✅ | "Good Morning" / "Time to Train" / "Good Evening" |
| User name | ✅ | From UnifiedTrainingService |
| Phase message | ✅ | Contextual based on check-in status & time |
| ACWR metric card | ✅ | Clickable → `/acwr` |
| Readiness metric card | ✅ | Clickable → `/wellness` |

---

### 2. Week Progress Strip ✅
| Element | Status | Notes |
|---------|--------|-------|
| 7-day visualization (Mon-Sun) | ✅ | Child component |
| Day status indicators | ✅ | Planned/Rest/Empty/Completed |
| Today highlight | ✅ | Visual emphasis |
| Completed days count | ✅ | X/7 format |
| Current streak | ✅ | Days count |

---

### 3. First-Time User Onboarding ✅
| Element | Status | Notes |
|---------|--------|-------|
| Sticky overlay banner | ✅ | Shows for first-time users |
| Merlin avatar (animated pulse) | ✅ | Gradient background |
| Welcome message | ✅ | Personalized with name |
| "Start Check-in" CTA | ✅ | Scrolls to wellness form |

---

### 4. Merlin's AI Insight Card ✅
| Element | Status | Notes |
|---------|--------|-------|
| Gradient background card | ✅ | Green gradient |
| Avatar icon | ✅ | Sparkles |
| Contextual insight text | ✅ | Based on readiness + ACWR |
| "Discuss with Merlin" button | ✅ | Links to `/chat` with query |

---

### 5. Phase-Based Content ✅

#### Phase 1: Morning Check-in
| Element | Status | Notes |
|---------|--------|-------|
| "Required" badge | ✅ | Red highlight |
| Green left border | ✅ | Visual emphasis |
| Wellness check-in component | ✅ | Embedded form |

#### Phase 2: Training Protocol
| Element | Status | Notes |
|---------|--------|-------|
| Progress bar | ✅ | X/Y exercises, percentage |
| Protocol blocks (expandable) | ✅ | Morning Mobility, Main Session, Recovery |
| Exercise list with checkboxes | ✅ | Mark complete |
| Video buttons | ✅ | YouTube embeds |
| Timer for timed exercises | ⚠️ | In ProtocolBlockComponent |
| "Done" tag when 100% | ✅ | Success badge |
| "Advanced Training Workspace" link | ✅ | Links to `/training/advanced` |

#### Phase 3: Evening Wrap-up
| Element | Status | Notes |
|---------|--------|-------|
| "Recovery Time" badge | ✅ | Info tag |
| Log RPE action card | ✅ | Opens recovery dialog |
| Review Recovery Stats card | ✅ | Links to `/wellness` |

---

### 6. Today's Schedule Timeline ✅
| Element | Status | Notes |
|---------|--------|-------|
| Timeline visualization | ✅ | `TodaysScheduleComponent` |
| Time markers | ✅ | 24h format |
| Activity titles | ✅ | Session names |
| Duration | ✅ | Minutes |
| Status indicators | ✅ | Done/In Progress/Upcoming |

---

### 7. Post-Training Recovery Dialog ✅
| Element | Status | Notes |
|---------|--------|-------|
| Modal dialog | ✅ | Triggered from wrap-up |
| RPE logging | ✅ | In PostTrainingRecoveryComponent |
| Save callback | ✅ | Updates ACWR |

---

## Business Logic

### Day Phase Detection (Implemented)
```typescript
const hour = currentTime.getHours();
if (hour < 11) return 'morning';
if (hour < 17) return 'midday';
return 'evening';
```

### Active Focus Logic (Implemented)
```typescript
// Determines which phase content to show
if (!hasCheckedInToday()) return 'checkin';
if (dayPhase() === 'evening') return 'wrapup';
return 'protocol';
```

### Greeting Prefix (Implemented)
```typescript
switch(dayPhase()) {
  case 'morning': return 'Good Morning,';
  case 'midday': return 'Time to Train,';
  case 'evening': return 'Good Evening,';
}
```

### Day Phase Message (Implemented)
```typescript
if (!hasCheckedInToday()) return "Let's start with your readiness check.";
if (dayPhase() === 'evening') return 'Time to review and recover.';
return 'Follow your personalized protocol below.';
```

---

## Data Sources

| Data | Service | Method |
|------|---------|--------|
| User name | `UnifiedTrainingService` | `userName` signal |
| ACWR value | `UnifiedTrainingService` | `acwrRatio` signal |
| ACWR risk zone | `UnifiedTrainingService` | `acwrRiskZone` signal |
| Readiness score | `UnifiedTrainingService` | `readinessScore` signal |
| AI insight | `UnifiedTrainingService` | `aiInsight` signal |
| Has checked in today | `UnifiedTrainingService` | `hasCheckedInToday` signal |
| Weekly schedule | `UnifiedTrainingService` | `weeklySchedule` signal |
| Training stats | `UnifiedTrainingService` | `trainingStats` signal |
| Protocol data | `UnifiedTrainingService` | `getTodayOverview()` |
| First time user | `DataSourceService` | `isFirstTimeUser()` |

---

## Navigation Paths

| From | To | Trigger |
|------|-----|---------|
| Today | ACWR Dashboard | ACWR metric card click |
| Today | Wellness | Readiness metric card click |
| Today | AI Chat | "Discuss with Merlin" button |
| Today | Wellness | "Review Recovery Stats" card |
| Today | Advanced Training | "Advanced Training Workspace" link |
| Today | (Dialog) | "Log RPE" → opens recovery dialog |

---

## Feature Comparison: Documented vs Implemented

| Documented Feature | Status | Notes |
|-------------------|--------|-------|
| Morning Check-in Prompt | ✅ | Phase-based display |
| Week Progress Strip | ✅ | Child component |
| Readiness Summary (ACWR, Training days) | ✅ | Status summary bar |
| Today's Schedule Timeline | ✅ | TodaysScheduleComponent |
| Training Blocks (expandable) | ✅ | ProtocolBlockComponent |
| Exercise list with sets/reps | ✅ | In protocol blocks |
| Embedded YouTube videos | ✅ | Video buttons in exercises |
| Timer for timed exercises | ⚠️ | Basic implementation |
| Completion checkboxes | ✅ | In protocol blocks |
| Post-Training Recovery | ✅ | Dialog component |
| Nutrition suggestions | ⚠️ | May be in recovery component |
| Sleep optimization tips | ⚠️ | May be in recovery component |

---

## UX Notes

### ✅ What Works Well
- Smart phase-based content (morning/midday/evening)
- Clear call-to-action hierarchy
- First-time user onboarding overlay
- AI insight feels personalized and actionable
- Week progress gamification
- Clickable metric cards for quick navigation

### ⚠️ Friction Points
- Protocol data may be empty (shows empty state)
- Time update only every minute (minor)
- No quick way to skip check-in if already feeling fine

### 🔧 Suggested Improvements
1. Add "Quick Check-in" option (3 taps max)
2. Show estimated completion time for protocol
3. Add celebration animation when day is 100% complete
4. Consider adding weather integration for outdoor training

---

## Related Pages

| Page | Route | Relationship |
|------|-------|--------------|
| Wellness | `/wellness` | Detailed wellness tracking |
| ACWR Dashboard | `/acwr` | Load monitoring details |
| AI Chat | `/chat` | Discuss with Merlin |
| Training Schedule | `/training` | Full schedule view |
| Advanced Training | `/training/advanced` | Power user features |

---

## Implementation Checklist

- [x] Smart header with greeting
- [x] Time-based greeting prefix
- [x] ACWR metric card (clickable)
- [x] Readiness metric card (clickable)
- [x] Week progress strip
- [x] First-time user onboarding
- [x] Morning check-in phase
- [x] Wellness check-in component
- [x] Merlin AI insight card
- [x] Midday protocol phase
- [x] Protocol progress bar
- [x] Protocol blocks (expandable)
- [x] Exercise checkboxes
- [x] Video links
- [x] Evening wrap-up phase
- [x] Log RPE action
- [x] Recovery stats link
- [x] Post-training recovery dialog
- [x] Today's schedule timeline
- [x] Loading state
- [ ] Quick check-in shortcut
- [ ] Completion celebration animation
