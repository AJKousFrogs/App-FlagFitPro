# Wireframe: User Profile

**Route:** `/profile`  
**Users:** All Users  
**Status:** ✅ Implemented  
**Source:** `angular/src/app/features/profile/profile.component.ts`

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚠️ ACCOUNT DELETION PENDING                                                    │  │
│  │ Your account will be permanently deleted in X days.                            │  │
│  │                                     [Cancel Deletion]  Learn More              │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│  ↑ Only shows if deletion is pending                                                │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ╭───────────────────────────────────────────────────────────────────────────╮  │  │
│  │ │                     ~~~~ Background Pattern ~~~~                          │  │  │
│  │ ╰───────────────────────────────────────────────────────────────────────────╯  │  │
│  │                                                                                │  │
│  │        ╭──────────╮                                                           │  │
│  │        │          │  ╭────╮                                                   │  │
│  │        │  Avatar  │  │#12 │  ← Jersey number badge                            │  │
│  │        │   📷     │  ╰────╯                                                   │  │
│  │        │          │                                                           │  │
│  │        ╰──────────╯                                                           │  │
│  │           ↑ Click to upload                                                   │  │
│  │                                                                                │  │
│  │        John Smith                         ┌───────────────┐  ┌───┐           │  │
│  │        ────────────────────               │ ⚙ Edit Profile│  │ ↗ │           │  │
│  │                                           └───────────────┘  └───┘           │  │
│  │        🏃 Wide Receiver    👥 Eagles                                          │  │
│  │                                                                                │  │
│  │        john.smith@email.com                                                   │  │
│  │                                                                                │  │
│  │        📅 Member since January 2024                                           │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              STATS GRID (4 CARDS)                               │ │
│  │                                                                                 │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  │ Training        │  │ Performance     │  │ Day Streak      │  │ Games Played   ││
│  │  │ Sessions        │  │ Score           │  │                 │  │                ││
│  │  │                 │  │                 │  │                 │  │                ││
│  │  │    28           │  │    82%          │  │    12           │  │    5           ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│  │                                                                                 │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ┌──────────────┬──────────────┬──────────────┬──────────────────────────────┐  │  │
│  │ │ 📈 Overview  │ 🏆 Achieve.. │ 📊 Statistics │ ✉️ Invitations (2)           │  │  │
│  │ └──────────────┴──────────────┴──────────────┴──────────────────────────────┘  │  │
│  │                                                                                │  │
│  │ ═══════════════════════════════════════════════════════════════════════════   │  │
│  │                                                                                │  │
│  │  OVERVIEW TAB:                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Recent Activity                                                          │ │  │
│  │  │ ────────────────────────────────────────────────────────────────────────│ │  │
│  │  │                                                                          │ │  │
│  │  │  ▶ Completed 45 min training                              2 hours ago    │ │  │
│  │  │  ▶ Completed 30 min training                              Yesterday      │ │  │
│  │  │  ▶ Completed 60 min training                              2 days ago     │ │  │
│  │  │  ▶ Completed 45 min training                              3 days ago     │ │  │
│  │  │                                                                          │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ACHIEVEMENTS TAB:                                                            │  │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │  │
│  │  │      ⚡       │  │      ▶       │  │      ⭐       │  │      🏆       │   │  │
│  │  │ 12-Day Streak │  │ 10 Sessions  │  │ 25 Sessions   │  │ Dedicated     │   │  │
│  │  │               │  │ Complete     │  │ Complete      │  │ Athlete       │   │  │
│  │  │  ──────────── │  │  ──────────  │  │  ──────────── │  │  ──────────── │   │  │
│  │  │  Current      │  │  Achieved    │  │  Achieved     │  │  Achieved     │   │  │
│  │  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘   │  │
│  │                                                                                │  │
│  │  STATISTICS TAB:                                                              │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Performance Statistics                                                   │ │  │
│  │  │ ────────────────────────────────────────────────────────────────────────│ │  │
│  │  │                                                                          │ │  │
│  │  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐│ │  │
│  │  │  │ Performance Score   │  │ Avg Session Length  │  │ Total Training Hrs  ││ │  │
│  │  │  │ ─────────────────── │  │ ─────────────────── │  │ ─────────────────── ││ │  │
│  │  │  │       82%           │  │       45 min        │  │       28.5h         ││ │  │
│  │  │  │  ┌──────────────┐   │  │  ┌──────────────┐   │  │  ┌──────────────┐   ││ │  │
│  │  │  │  │ Excellent    │   │  │  │ Great duration│  │  │  │Strong commit.│   ││ │  │
│  │  │  │  └──────────────┘   │  │  └──────────────┘   │  │  └──────────────┘   ││ │  │
│  │  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘│ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  INVITATIONS TAB:                                                             │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Titans                                           ┌────────┐              │ │  │
│  │  │ ────────────────────────────────────────────────│ Player │              │ │  │
│  │  │                                                  └────────┘              │ │  │
│  │  │ You've been invited to join this team as a player.                       │ │  │
│  │  │                                                                          │ │  │
│  │  │ 👤 Invited by Team Admin     📅 Dec 28, 2025                            │ │  │
│  │  │ Expires Jan 11, 2026                                                     │ │  │
│  │  │                                                                          │ │  │
│  │  │  ┌──────────────┐    ┌──────────────┐                                    │ │  │
│  │  │  │  ✓ Accept    │    │  ✕ Decline   │                                    │ │  │
│  │  │  └──────────────┘    └──────────────┘                                    │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Deletion Pending Banner (Conditional) ✅

| Element                | Status | Notes                      |
| ---------------------- | ------ | -------------------------- |
| Warning icon           | ✅     | From centralized UX copy   |
| Title                  | ✅     | "Account Deletion Pending" |
| Days remaining         | ✅     | Dynamic countdown          |
| Cancel Deletion button | ✅     | With loading state         |
| Learn More link        | ✅     | Links to help              |

---

### 2. Profile Header Card ✅

| Element               | Status | Notes                     |
| --------------------- | ------ | ------------------------- |
| Background pattern    | ✅     | Decorative gradient       |
| Avatar image/fallback | ✅     | User initials if no image |
| Camera upload button  | ✅     | With loading spinner      |
| Jersey number badge   | ✅     | Shows if set              |
| Display name          | ✅     | Large heading             |
| Position tag          | ✅     | With icon                 |
| Team name tag         | ✅     | With icon                 |
| Email                 | ✅     | Secondary text            |
| Member since          | ✅     | Calendar icon + date      |
| Edit Profile button   | ✅     | Links to `/settings`      |
| Share button          | ✅     | Native share or clipboard |

---

### 3. Stats Grid (4 Cards) ✅

| Stat              | Source                     | Status |
| ----------------- | -------------------------- | ------ |
| Training Sessions | Supabase training_sessions | ✅     |
| Performance Score | Calculated from wellness   | ✅     |
| Day Streak        | Calculated from sessions   | ✅     |
| Games Played      | Placeholder                | ⚠️     |

---

### 4. Tabbed Content ✅

#### Overview Tab

| Element              | Status | Notes                |
| -------------------- | ------ | -------------------- |
| Recent Activity card | ✅     |                      |
| Activity list        | ✅     | Last 5 sessions      |
| Empty state          | ✅     | "No Recent Activity" |

**Activity Item:**

- Icon (pi-play)
- Title ("Completed X min training")
- Time ago ("2 hours ago")

#### Achievements Tab

| Element                 | Status | Notes                   |
| ----------------------- | ------ | ----------------------- |
| Achievement cards grid  | ✅     |                         |
| Achievement icon        | ✅     |                         |
| Achievement title       | ✅     |                         |
| Achievement description | ✅     |                         |
| Achievement date        | ✅     | "Current" or "Achieved" |
| Empty state             | ✅     | "No Achievements Yet"   |

**Achievement Triggers:**

- Streak ≥ 7 days
- 10 sessions complete
- 25 sessions complete
- 50 sessions complete

#### Statistics Tab

| Element                     | Status | Notes          |
| --------------------------- | ------ | -------------- |
| Performance Statistics card | ✅     |                |
| Performance Score stat      | ✅     | With trend tag |
| Avg Session Length stat     | ✅     | With trend tag |
| Total Training Hours stat   | ✅     | With trend tag |

**Trend Types:**

- `success` - Green tag
- `info` - Blue tag
- `warn` - Yellow tag
- `secondary` - Gray tag

#### Invitations Tab

| Element               | Status | Notes                    |
| --------------------- | ------ | ------------------------ |
| Badge count on tab    | ✅     | Shows pending count      |
| Invitation cards list | ✅     |                          |
| Team name             | ✅     |                          |
| Role tag              | ✅     | Player/Coach/etc         |
| Invitation message    | ✅     | Or default text          |
| Invited by            | ✅     |                          |
| Created date          | ✅     |                          |
| Expiration date       | ✅     |                          |
| Expired tag           | ✅     | If past expiration       |
| Accept button         | ✅     | With loading state       |
| Decline button        | ✅     | With loading state       |
| Request New button    | ✅     | For expired invitations  |
| Empty state           | ✅     | "No Pending Invitations" |
| Loading state         | ✅     | Spinner                  |

---

### 5. States ✅

| State            | Status | Notes              |
| ---------------- | ------ | ------------------ |
| Loading state    | ✅     | Full page spinner  |
| Error state      | ✅     | With retry button  |
| Empty data state | ✅     | Graceful fallbacks |
| Avatar uploading | ✅     | Button spinner     |

---

## Business Logic

### Performance Score Calculation (Implemented)

```typescript
// From last 7 wellness checkins
const avgEnergy = sum(energy_levels) / count;
const avgMotivation = sum(motivation_levels) / count;
const avgSleep = sum(sleep_quality) / count;

// Score out of 100 (each metric is 1-10 scale)
performanceScore = Math.round(
  ((avgEnergy + avgMotivation + avgSleep) / 30) * 100,
);
```

### Streak Calculation (Implemented)

```typescript
// Count consecutive training days from today backward
let streak = 0;
let checkDate = new Date();

for (const session of sortedSessionsByDateDesc) {
  const sessionDate = new Date(session.completed_at);
  const daysDiff = floor((checkDate - sessionDate) / DAY_MS);

  if (daysDiff <= 1) {
    streak++;
    checkDate = sessionDate;
  } else {
    break;
  }
}
```

### Avatar Upload (Implemented)

```typescript
// Validation
- Max file size: 5MB
- Allowed types: JPEG, PNG, WebP

// Upload flow
1. Validate file type and size
2. Generate unique filename: {userId}/avatar-{timestamp}.{ext}
3. Upload to Supabase Storage "avatars" bucket
4. Get public URL
5. Update profiles table with avatar_url
6. Update local state
```

### Invitation Accept/Decline (Implemented)

```typescript
// Accept
await supabaseService.rpc("accept_team_invitation", { p_invitation_id });
// → Creates team_member record, updates invitation status

// Decline
await supabaseService.rpc("decline_team_invitation", { p_invitation_id });
// → Updates invitation status only
```

---

## Data Sources

| Data                | Service                  | Method                       |
| ------------------- | ------------------------ | ---------------------------- |
| User info           | `AuthService`            | `getUser()`                  |
| Training sessions   | `SupabaseService`        | Direct query                 |
| Wellness checkins   | `SupabaseService`        | Direct query                 |
| Team membership     | `SupabaseService`        | Query team_members table     |
| Pending invitations | `SupabaseService`        | Query team_invitations table |
| Deletion status     | `AccountDeletionService` | `hasPendingDeletion` signal  |

---

## Navigation Paths

| From    | To       | Trigger                                  |
| ------- | -------- | ---------------------------------------- |
| Profile | Settings | "Edit Profile" button                    |
| Profile | (Share)  | Share button → native share or clipboard |
| Profile | Team     | Accept invitation → refresh profile      |

---

## Feature Comparison: Documented vs Implemented

| Documented Feature     | Status | Notes                          |
| ---------------------- | ------ | ------------------------------ |
| Avatar image           | ✅     | With upload                    |
| Name and email         | ✅     |                                |
| Role badge             | ⚠️     | Position shown, not role       |
| Team membership        | ✅     | From team_members table        |
| Overview tab           | ✅     | Recent activity                |
| Teams tab              | ⚠️     | Invitations tab instead        |
| Stats tab              | ✅     | Performance statistics         |
| Settings tab           | ⚠️     | Edit button links to /settings |
| Pending invitations    | ✅     | Full CRUD                      |
| Accept/Decline buttons | ✅     | With loading states            |
| Expiration countdown   | ✅     | Shows date                     |
| Edit profile           | ✅     | Links to /settings             |
| Upload avatar          | ✅     | Full upload flow               |
| View deletion status   | ✅     | Banner with cancel             |
| Cancel deletion        | ✅     | With confirmation              |

---

## UX Notes

### ✅ What Works Well

- Clean profile header with jersey number badge
- Avatar upload with validation and feedback
- Tabbed organization reduces cognitive load
- Invitation badge count on tab
- Good empty states per section
- Deletion pending banner is prominent but not intrusive

### ⚠️ Friction Points

- Games Played always shows 0 (not connected to data)
- No way to edit position/jersey from profile
- Team name only shows one team (no multi-team support)
- Statistics tab is basic (only 3 metrics)

### 🔧 Suggested Improvements

1. Add "Quick Edit" for position/jersey number
2. Connect Games Played to actual game data
3. Support multiple team memberships view
4. Add more performance statistics (from Analytics page)
5. Add profile completion percentage indicator
6. Consider adding QR code for profile sharing

---

## Related Pages

| Page      | Route        | Relationship               |
| --------- | ------------ | -------------------------- |
| Settings  | `/settings`  | Edit profile details       |
| Analytics | `/analytics` | Detailed performance stats |
| Roster    | `/roster`    | Team member list           |

---

## Implementation Checklist

- [x] Deletion pending banner
- [x] Cancel deletion action
- [x] Profile header with gradient background
- [x] Avatar display (image or initials)
- [x] Avatar upload button
- [x] Avatar upload flow
- [x] Jersey number badge
- [x] User name display
- [x] Position tag
- [x] Team name tag
- [x] Email display
- [x] Member since date
- [x] Edit Profile button
- [x] Share profile button
- [x] Stats grid (4 cards)
- [x] Overview tab with recent activity
- [x] Achievements tab
- [x] Achievements based on real data
- [x] Statistics tab
- [x] Performance stats with trends
- [x] Invitations tab
- [x] Invitation cards
- [x] Accept/Decline/Request New actions
- [x] Loading states
- [x] Error state with retry
- [x] Empty states per section
- [ ] Games Played data connection
- [ ] Multi-team support
- [ ] Profile completion indicator
