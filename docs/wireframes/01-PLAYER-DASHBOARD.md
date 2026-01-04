# Wireframe: Player Dashboard

**Route:** `/player-dashboard`  
**Users:** Players/Athletes  
**Status:** ✅ Implemented  
**Source:** `angular/src/app/features/dashboard/player-dashboard.component.ts`

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📢 TEAM ANNOUNCEMENT                                                     [×]  │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │ ⚠️ Practice tomorrow moved to 6PM due to field availability. - Coach Mike     │  │
│  │                                                        Posted 2 hours ago     │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ╭─────╮                                                                       │  │
│  │  │ ✨  │   Good morning, [Name]!                                               │  │
│  │  │     │   ────────────────────────────────────────────────────────────────    │  │
│  │  ╰─────╯   [AI Merlin Insight: "Your readiness is great! Perfect for          │  │
│  │            high-intensity today." or contextual message based on metrics]      │  │
│  │                                                                                │  │
│  │            ┌─────────────────────┐   ┌─────────────────────┐                   │  │
│  │            │ ▶ Start Training    │   │ 💬 Ask Merlin       │                   │  │
│  │            └─────────────────────┘   └─────────────────────┘                   │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 💚 READINESS    │  │ 📈 ACWR         │  │ ⚡ STREAK       │  │ 📅 THIS WEEK   │  │
│  │                 │  │                 │  │                 │  │                 │  │
│  │    ██ 78%       │  │    ██ 0.92      │  │    ██ 12        │  │    ██ 4/7      │  │
│  │    ─────        │  │    ─────        │  │    ─────        │  │    ─────        │  │
│  │   [Good ●]      │  │   [Optimal ●]   │  │   Day Streak    │  │   Sessions      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│       ↓ Color: Green if ≥70%   ↓ Green if ≤1.0                                       │
│         Yellow if 50-69%         Yellow if 1.0-1.3                                   │
│         Red if <50%              Red if >1.3                                         │
│                                                                                      │
│  ┌────────────────────────────────────────┐  ┌────────────────────────────────────┐  │
│  │ 📊 Weekly Progress                     │  │ ⏰ Today's Schedule                │  │
│  │ ──────────────────────────────────────│  │ ──────────────────────────────────│  │
│  │                                        │  │                                    │  │
│  │   ╭───╮ ╭───╮ ╭───╮ ╭───╮ ╭───╮ ╭───╮ ╭───╮  │  07:00  Morning Mobility   15m ✓ │  │
│  │   │ ✓ │ │ ✓ │ │ ✓ │ │ ○ │ │   │ │   │ │   │  │  09:00  Speed & Agility    45m   │  │
│  │   ╰───╯ ╰───╯ ╰───╯ ╰───╯ ╰───╯ ╰───╯ ╰───╯  │  14:00  Position Drills    30m   │  │
│  │    Mon   Tue   Wed   Thu   Fri   Sat   Sun   │                                    │  │
│  │                         ↑ Today              │  (+1 more item)                    │  │
│  │                                        │  │                                    │  │
│  │   ████████████████░░░░░░░░░  57%       │  │  ┌────────────────────────────────┐│  │
│  │                                        │  │  │      View Full Day →           ││  │
│  └────────────────────────────────────────┘  │  └────────────────────────────────┘│  │
│                                              └────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────┐  ┌────────────────────────────────────┐  │
│  │ ⚡ Quick Actions                       │  │ 📈 Performance Trend (7 days)     │  │
│  │ ──────────────────────────────────────│  │ ──────────────────────────────────│  │
│  │                                        │  │                                    │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐   │  │      ╱╲                            │  │
│  │  │  ➕    │  │  🎬    │  │  💚    │   │  │     ╱  ╲    ╱╲                     │  │
│  │  │  Log   │  │ Videos │  │Wellness│   │  │    ╱    ╲  ╱  ╲                    │  │
│  │  └────────┘  └────────┘  └────────┘   │  │   ╱      ╲╱    ╲___               │  │
│  │                                        │  │  ╱                   ╲             │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐   │  │  Mon Tue Wed Thu Fri Sat Sun       │  │
│  │  │  📅    │  │  📊    │  │  🤖    │   │  │                                    │  │
│  │  │Schedule│  │Analytics│ │AI Coach│   │  │  ┌────────────────────────────────┐│  │
│  │  └────────┘  └────────┘  └────────┘   │  │  │   View Detailed Analytics →    ││  │
│  │                                        │  │  └────────────────────────────────┘│  │
│  └────────────────────────────────────────┘  └────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📅 Coming Up                                                                   │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│  │
│  │  │  05  │ Team     │  │  08  │ vs       │  │  12  │ Sprint  │  │  15  │ Weekend ││  │
│  │  │ JAN  │ Practice │  │ JAN  │ Eagles   │  │ JAN  │ Drills  │  │ JAN  │ Tourney ││  │
│  │  │      │ Training │  │      │ Game Day │  │      │ Training│  │      │ Tourna. ││  │
│  │  │ ──── │          │  │ ──── │          │  │ ──── │         │  │ ──── │         ││  │
│  │  │ green│          │  │ red  │          │  │ green│         │  │orange│         ││  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘│  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 0. Announcements Banner (NEW) ✅
| Element | Status | Notes |
|---------|--------|-------|
| Pinned announcement | ⚠️ Needs Implementation | Shows latest important announcement |
| Priority icon | ⚠️ Needs Implementation | ⚠️ for important, 📢 for regular |
| Coach name | ⚠️ Needs Implementation | Who posted |
| Timestamp | ⚠️ Needs Implementation | "2 hours ago" |
| Dismiss button | ⚠️ Needs Implementation | [×] to hide temporarily |
| Empty state | ⚠️ Needs Implementation | Hidden when no announcements |

**Business Logic:**
```typescript
// Show banner if:
// 1. There's a pinned announcement in Announcements channel
// 2. OR an announcement marked "Important" from last 24h
// 3. AND user hasn't dismissed it

interface AnnouncementBanner {
  message: string;
  coachName: string;
  postedAt: Date;
  priority: 'normal' | 'important';
  dismissed: boolean;
}
```

---

### 1. Welcome Section with AI Insight ✅
| Element | Status | Notes |
|---------|--------|-------|
| Merlin avatar (sparkle icon) | ✅ | Gradient background |
| Time-based greeting | ✅ | "Good morning/afternoon/evening" |
| User first name | ✅ | Extracted from user profile |
| AI contextual insight | ✅ | Dynamic based on readiness + ACWR |
| "Start Training" CTA | ✅ | Links to `/today` |
| "Ask Merlin" button | ✅ | Links to `/chat` |

**Business Logic (Implemented):**
```typescript
// Merlin insight generation:
if (readiness < 50) → "Low readiness, lighter session recommended"
if (acwr > 1.3) → "Elevated load, avoid overtraining"
if (readiness >= 80 && acwr <= 1.0) → "Perfect for high-intensity"
default → "Stick to your plan"
```

---

### 2. Key Stats Overview (4 Cards) ✅
| Card | Value | Indicator | Status |
|------|-------|-----------|--------|
| Readiness Score | 0-100% | Green ≥70%, Yellow 50-69%, Red <50% | ✅ |
| ACWR Ratio | Decimal (e.g., 0.92) | Green ≤1.0, Yellow 1.0-1.3, Red >1.3 | ✅ |
| Current Streak | Days count | No color coding | ✅ |
| Weekly Sessions | X/Y format | No color coding | ✅ |

---

### 3. Weekly Progress ✅
| Element | Status | Notes |
|---------|--------|-------|
| 7-day strip (Mon-Sun) | ✅ | Visual circles |
| Completed days (checkmark) | ✅ | Green fill |
| Today indicator | ✅ | Border highlight |
| Future days (muted) | ✅ | Grayed out |
| Progress bar | ✅ | Shows % complete |
| Progress percentage text | ✅ | "57% completed" |

---

### 4. Today's Schedule Preview ✅
| Element | Status | Notes |
|---------|--------|-------|
| Time column | ✅ | 24h format |
| Activity title | ✅ | Session name |
| Duration | ✅ | Minutes |
| Completion indicator | ✅ | Checkmark if done |
| Max 3 items shown | ✅ | "+X more" if overflow |
| Empty state | ✅ | "No training scheduled" |
| "View Full Day" link | ✅ | Links to `/today` |

---

### 5. Quick Actions Grid (6 buttons) ✅
| Action | Icon | Route | Status |
|--------|------|-------|--------|
| Log Training | ➕ | `/training/log` | ✅ |
| Videos | 🎬 | `/training/videos` | ✅ |
| Wellness | 💚 | `/wellness` | ✅ |
| Schedule | 📅 | `/training` | ✅ |
| Analytics | 📊 | `/analytics` | ✅ |
| AI Coach | ✨ | `/chat` | ✅ |

---

### 6. Performance Trend Chart ✅
| Element | Status | Notes |
|---------|--------|-------|
| 7-day line chart | ✅ | Training load visualization |
| Empty state | ✅ | "Complete more sessions..." |
| "View Detailed Analytics" link | ✅ | Links to `/analytics` |

---

### 7. Upcoming Events ✅
| Element | Status | Notes |
|---------|--------|-------|
| Event cards (max 4) | ✅ | Grid layout |
| Date display (day + month) | ✅ | "05 JAN" format |
| Event title | ✅ | e.g., "Team Practice" |
| Event type label | ✅ | "Training", "Game Day", "Tournament" |
| Color-coded left border | ✅ | Green=training, Red=game, Orange=tournament |

---

## Data Sources

| Data | Service | Method |
|------|---------|--------|
| User name | `AuthService` | `getUser()` |
| Training stats | `TrainingStatsCalculationService` | `getTrainingStats()` |
| Readiness score | Derived from wellness check-in | Via stats service |
| ACWR | Calculated | Via stats service |
| Today's schedule | Training service | (Currently mocked) |
| Upcoming events | Calendar/Events service | (Currently mocked) |

---

## Navigation Paths

| From | To | Trigger |
|------|-----|---------|
| Dashboard | Today's Practice | "Start Training" button |
| Dashboard | AI Chat | "Ask Merlin" button |
| Dashboard | Today | "View Full Day" link |
| Dashboard | Analytics | "View Detailed Analytics" link |
| Dashboard | Training Log | Quick Action: Log Training |
| Dashboard | Videos | Quick Action: Videos |
| Dashboard | Wellness | Quick Action: Wellness |
| Dashboard | Training Schedule | Quick Action: Schedule |
| Dashboard | Analytics | Quick Action: Analytics |
| Dashboard | AI Coach | Quick Action: AI Coach |

---

## Responsive Behavior

| Breakpoint | Stats Grid | Dashboard Grid | Events Grid |
|------------|------------|----------------|-------------|
| Desktop (>1024px) | 4 columns | 2 columns | 4 columns |
| Tablet (640-1024px) | 2 columns | 1 column | 2 columns |
| Mobile (<640px) | 1 column | 1 column | 1 column |

---

## UX Notes

### ✅ What Works Well
- Clear information hierarchy
- AI insight provides personalized value immediately
- Quick actions reduce navigation friction
- Color-coded indicators for at-a-glance status
- Weekly progress gamification (streaks)

### ⚠️ Friction Points
- Today's schedule data is mocked (needs real integration)
- Upcoming events data is mocked (needs calendar service)
- No wellness check-in prompt if not done today

### 🔧 Suggested Improvements
1. Add wellness check-in CTA if not completed today
2. Integrate real calendar data for upcoming events
3. Add tap-to-expand on stat cards for more detail
4. Consider adding "Last trained: X hours ago" indicator

---

## Implementation Checklist

- [x] Welcome section with greeting
- [x] Merlin AI avatar
- [x] Dynamic AI insight
- [x] 4 stat cards with color coding
- [x] Weekly progress visualization
- [x] Today's schedule preview
- [x] Quick actions grid (6 items)
- [x] Performance trend chart
- [x] Upcoming events section
- [x] Responsive layout
- [x] Loading state
- [x] Error state with retry
- [ ] Announcements banner (NEW)
- [ ] Real today's schedule data (uses mock)
- [ ] Real upcoming events data (uses mock)
- [ ] Wellness check-in prompt
