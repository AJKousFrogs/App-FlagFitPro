# Wireframe: Training Schedule

**Route:** `/training`  
**Users:** Players/Athletes  
**Status:** ✅ Implemented  
**Source:** `angular/src/app/features/training/training-schedule/training-schedule.component.ts`

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📅 Training Schedule                                      ┌──────────────────┐│  │
│  │  View and manage your training sessions                    │ + New Session    ││  │
│  │                                                            └──────────────────┘│  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │ 📆 Training Calendar           │  │ 📋 Upcoming Sessions                       │  │
│  │ ──────────────────────────────│  │ ────────────────────────────────────────── │  │
│  │                                │  │                                            │  │
│  │     ◀  January 2026  ▶        │  │  ┌────────────────────────────────────────┐│  │
│  │  ─────────────────────────    │  │  │ Speed & Agility Training               ││  │
│  │  Wk  Su  Mo  Tu  We  Th  Fr  Sa│  │  │ Jan 6, 2026 at 9:00 AM                ││  │
│  │  01      30  31   1   2   3  4│  │  │ Duration: 45 min                       ││  │
│  │  02   5   6   7   8   9  10 11│  │  │                    ┌──────────┐  [✓]   ││  │
│  │  03  12  13  14  15  16  17 18│  │  │                    │scheduled │        ││  │
│  │  04  19  20  21  22  23  24 25│  │  │                    └──────────┘        ││  │
│  │  05  26  27  28  29  30  31   │  │  └────────────────────────────────────────┘│  │
│  │                                │  │                                            │  │
│  │  ○ Today: Jan 3               │  │  ┌────────────────────────────────────────┐│  │
│  │                                │  │  │ Strength Training                      ││  │
│  │  Legend:                       │  │  │ Jan 7, 2026 at 2:00 PM                ││  │
│  │  ● Completed                   │  │  │ Duration: 60 min                       ││  │
│  │  ○ Scheduled                   │  │  │                    ┌──────────┐  [✓]   ││  │
│  │  ◐ In Progress                 │  │  │                    │scheduled │        ││  │
│  │  ✗ Missed                      │  │  │                    └──────────┘        ││  │
│  │                                │  │  └────────────────────────────────────────┘│  │
│  │  [Show Week Numbers: ☑]        │  │                                            │  │
│  │                                │  │  ┌────────────────────────────────────────┐│  │
│  └────────────────────────────────┘  │  │ Recovery Session                       ││  │
│                                      │  │ Jan 8, 2026 at 6:00 PM                ││  │
│                                      │  │ Duration: 30 min                       ││  │
│                                      │  │                    ┌──────────┐  [✓]   ││  │
│                                      │  │                    │scheduled │        ││  │
│                                      │  │                    └──────────┘        ││  │
│                                      │  └────────────────────────────────────────┘│  │
│                                      │                                            │  │
│                                      └────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Empty State Wireframe

```
┌────────────────────────────────────────────┐
│ 📋 Upcoming Sessions                       │
│ ────────────────────────────────────────── │
│                                            │
│          ┌─────────────────────┐           │
│          │                     │           │
│          │    📅               │           │
│          │    No sessions      │           │
│          │    scheduled        │           │
│          │                     │           │
│          │  Click "New Session"│           │
│          │  to add one.        │           │
│          │                     │           │
│          └─────────────────────┘           │
│                                            │
└────────────────────────────────────────────┘
```

---

## Loading State Wireframe

```
┌────────────────────────────────────────────┐
│ 📋 Upcoming Sessions                       │
│ ────────────────────────────────────────── │
│                                            │
│  ┌────────────────────────────────────────┐│
│  │ ████████████████                       ││
│  │ ██████████████████████████             ││
│  │ ████████████                           ││
│  └────────────────────────────────────────┘│
│                                            │
│  ┌────────────────────────────────────────┐│
│  │ ████████████████                       ││
│  │ ██████████████████████████             ││
│  │ ████████████                           ││
│  └────────────────────────────────────────┘│
│                                            │
│  ┌────────────────────────────────────────┐│
│  │ ████████████████                       ││
│  │ ██████████████████████████             ││
│  │ ████████████                           ││
│  └────────────────────────────────────────┘│
│                                            │
└────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Page Header ✅

| Element                   | Status | Notes                                    |
| ------------------------- | ------ | ---------------------------------------- |
| Title "Training Schedule" | ✅     | With calendar icon                       |
| Subtitle                  | ✅     | "View and manage your training sessions" |
| "New Session" button      | ✅     | Navigates to `/training/smart-form`      |

---

### 2. Calendar Card ✅

| Element               | Status | Notes                       |
| --------------------- | ------ | --------------------------- |
| Monthly calendar view | ✅     | PrimeNG DatePicker inline   |
| Week numbers          | ✅     | `showWeek="true"`           |
| Date selection        | ✅     | Click to filter sessions    |
| Month navigation      | ✅     | Left/right arrows           |
| Today highlight       | ✅     | Built-in DatePicker feature |

---

### 3. Sessions List Card ✅

| Element                         | Status | Notes                            |
| ------------------------------- | ------ | -------------------------------- |
| Card header "Upcoming Sessions" | ✅     |                                  |
| Session items                   | ✅     | Clickable rows                   |
| Session type title              | ✅     | e.g., "Speed & Agility Training" |
| Date/time display               | ✅     | "Jan 6, 2026 at 9:00 AM"         |
| Duration                        | ✅     | "Duration: 45 min"               |
| Status tag                      | ✅     | Color-coded badge                |
| Mark complete button            | ✅     | Only for "scheduled" status      |

---

### 4. Status Tags ✅

| Status        | Color            | DB Status Mapping      |
| ------------- | ---------------- | ---------------------- |
| `scheduled`   | Info (blue)      | `planned`, `scheduled` |
| `completed`   | Success (green)  | `completed`            |
| `in_progress` | Warning (yellow) | `in_progress`          |
| `missed`      | Danger (red)     | `cancelled`            |

---

### 5. States ✅

| State         | Status | Notes                     |
| ------------- | ------ | ------------------------- |
| Loading state | ✅     | Skeleton placeholders     |
| Empty state   | ✅     | Icon + message + guidance |
| Error state   | ✅     | With retry button         |
| Data state    | ✅     | Session list              |

---

## Business Logic

### Session Status Mapping (Implemented)

```typescript
DB Status → UI Status:
- 'planned' → 'scheduled'
- 'scheduled' → 'scheduled'
- 'in_progress' → 'in_progress'
- 'completed' → 'completed'
- 'cancelled' → 'missed'
```

### Session Filtering (Implemented)

```typescript
// Shows sessions for selected week
const startOfWeek = new Date(selected);
startOfWeek.setDate(selected.getDate() - selected.getDay());

const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 7);

// Filter sessions within week range
```

### Training Load Calculation (Documented, Not in This Component)

```typescript
Session Load (AU) = Duration (min) × RPE × Type Multiplier

Type Multipliers:
- High Intensity Training: 1.2
- Speed/Agility: 1.1
- Strength Training: 1.0
- Technical/Skills: 0.8
- Recovery/Mobility: 0.5
```

---

## Data Sources

| Data              | Service           | Method                              |
| ----------------- | ----------------- | ----------------------------------- |
| User ID           | `AuthService`     | `getUser()`                         |
| Training sessions | `SupabaseService` | Direct query to `training_sessions` |

### Database Query

```typescript
supabaseService.client
  .from("training_sessions")
  .select(
    `id, scheduled_date, session_type, duration_minutes, status, notes, created_at`,
  )
  .eq("user_id", user.id)
  .gte("scheduled_date", sevenDaysAgo)
  .order("scheduled_date", { ascending: true });
```

---

## Navigation Paths

| From              | To                  | Trigger                       |
| ----------------- | ------------------- | ----------------------------- |
| Training Schedule | Smart Training Form | "New Session" button          |
| Training Schedule | Session Detail      | Click on session row          |
| Training Schedule | (Stay)              | Date selection (filters list) |

---

## Feature Comparison: Documented vs Implemented

| Documented Feature          | Status | Notes                               |
| --------------------------- | ------ | ----------------------------------- |
| Calendar View (monthly)     | ✅     | Inline DatePicker                   |
| Color-coded by session type | ⚠️     | Status colors only, not type colors |
| Click date for details      | ✅     | Filters to week view                |
| Session type display        | ✅     | In session cards                    |
| Duration display            | ✅     | In session cards                    |
| Completion status           | ✅     | Tag + checkmark button              |
| Training Log form           | ❌     | Separate page (`/training/log`)     |
| Historical View             | ⚠️     | Shows 7 days back only              |
| Load progression over time  | ❌     | Not in this component               |
| Movement volume tracking    | ❌     | In log form, not here               |

---

## UX Notes

### ✅ What Works Well

- Clean two-column layout (calendar + sessions)
- Week number display for planning
- Quick mark complete action
- Status badges are clear and color-coded
- Good loading/empty/error states

### ⚠️ Friction Points

- Only shows sessions for selected week (not full month view with markers)
- No visual indicators on calendar dates for scheduled sessions
- Limited historical view (7 days back only)
- No inline training log - requires navigation

### 🔧 Suggested Improvements

1. Add colored dots on calendar dates with sessions
2. Extend historical view beyond 7 days
3. Add inline session logging modal
4. Show session type colors (not just status colors)
5. Add "Today" quick-select button
6. Show weekly/monthly session summary stats

---

## Related Pages

| Page                | Route                   | Relationship              |
| ------------------- | ----------------------- | ------------------------- |
| Smart Training Form | `/training/smart-form`  | Create new sessions       |
| Session Detail      | `/training/session/:id` | View/edit session         |
| Training Log        | `/training/log`         | Log completed sessions    |
| Today's Practice    | `/today`                | Today's specific sessions |

---

## Implementation Checklist

- [x] Page header with title and action
- [x] Calendar view (inline DatePicker)
- [x] Week numbers display
- [x] Session list card
- [x] Session filtering by week
- [x] Status tags with colors
- [x] Mark complete action
- [x] Loading state (skeleton)
- [x] Empty state
- [x] Error state with retry
- [x] Navigation to new session form
- [x] Navigation to session detail
- [ ] Calendar date markers for sessions
- [ ] Session type color coding on calendar
- [ ] Extended historical view
- [ ] Monthly statistics summary
