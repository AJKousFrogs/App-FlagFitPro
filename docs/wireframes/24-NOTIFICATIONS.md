# Wireframe: Notification Center

**Route:** Slide-out panel from header bell icon  
**Users:** All users  
**Status:** ⚠️ Needs Implementation  
**Source:** Referenced in `FEATURE_DOCUMENTATION.md` §19

---

## Purpose

Centralized panel for all user notifications with real-time updates, grouping by date, and action handling.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔(3)  [Avatar ▼]  │
│                                                                   ↓                  │
│                                                    ┌──────────────────────────────┐  │
│                                                    │ 🔔 NOTIFICATIONS            ×│  │
│                                                    │ ────────────────────────────│  │
│                                                    │                              │  │
│                                                    │ [Mark All Read]              │  │
│                                                    │                              │  │
│                                                    │ ── TODAY ─────────────────── │  │
│                                                    │                              │  │
│                                                    │ ┌──────────────────────────┐│  │
│                                                    │ │ 🔴 ACWR Alert            ││  │
│                                                    │ │ Your ACWR is 1.45 -      ││  │
│                                                    │ │ consider reducing today's││  │
│                                                    │ │ training load.           ││  │
│                                                    │ │ 10 minutes ago       [×] ││  │
│                                                    │ └──────────────────────────┘│  │
│                                                    │                              │  │
│                                                    │ ┌──────────────────────────┐│  │
│                                                    │ │ 💚 Wellness Reminder     ││  │
│                                                    │ │ Don't forget your        ││  │
│                                                    │ │ morning check-in!        ││  │
│                                                    │ │ 2 hours ago          [×] ││  │
│                                                    │ └──────────────────────────┘│  │
│                                                    │                              │  │
│                                                    │ ┌──────────────────────────┐│  │
│                                                    │ │ 🏆 Achievement Unlocked! ││  │
│                                                    │ │ "7-Day Streak" - You     ││  │
│                                                    │ │ logged wellness for 7    ││  │
│                                                    │ │ consecutive days! +25pts ││  │
│                                                    │ │ 3 hours ago          [×] ││  │
│                                                    │ └──────────────────────────┘│  │
│                                                    │                              │  │
│                                                    │ ── YESTERDAY ────────────── │  │
│                                                    │                              │  │
│                                                    │ ┌──────────────────────────┐│  │
│                                                    │ │ 📅 Training Complete     ││  │
│                                                    │ │ Great job! You completed ││  │
│                                                    │ │ "Speed & Agility" session││  │
│                                                    │ │ Yesterday 6:45 PM    [×] ││  │
│                                                    │ └──────────────────────────┘│  │
│                                                    │                              │  │
│                                                    │ ┌──────────────────────────┐│  │
│                                                    │ │ 👥 Team Announcement     ││  │
│                                                    │ │ Coach posted: "Practice  ││  │
│                                                    │ │ moved to 5pm tomorrow"   ││  │
│                                                    │ │ Yesterday 2:30 PM    [×] ││  │
│                                                    │ └──────────────────────────┘│  │
│                                                    │                              │  │
│                                                    │ ── THIS WEEK ────────────── │  │
│                                                    │                              │  │
│                                                    │ ┌──────────────────────────┐│  │
│                                                    │ │ 🎮 Game Reminder         ││  │
│                                                    │ │ Game vs Eagles tomorrow  ││  │
│                                                    │ │ at 10:00 AM. Complete    ││  │
│                                                    │ │ Game Day Readiness check.││  │
│                                                    │ │ 2 days ago           [×] ││  │
│                                                    │ └──────────────────────────┘│  │
│                                                    │                              │  │
│                                                    │ ┌──────────────────────────┐│  │
│                                                    │ │ 🏆 Tournament Reg Open   ││  │
│                                                    │ │ Spring Championship      ││  │
│                                                    │ │ registration is now open.││  │
│                                                    │ │ RSVP required by Jan 15. ││  │
│                                                    │ │ 3 days ago           [×] ││  │
│                                                    │ └──────────────────────────┘│  │
│                                                    │                              │  │
│                                                    │ ── OLDER ───────────────── │  │
│                                                    │                              │  │
│                                                    │ ┌──────────────────────────┐│  │
│                                                    │ │ ☁️ Weather Advisory      ││  │
│                                                    │ │ (read) Rain expected for ││  │
│                                                    │ │ Friday's practice.       ││  │
│                                                    │ │ Dec 30              [×]  ││  │
│                                                    │ └──────────────────────────┘│  │
│                                                    │                              │  │
│                                                    │ ┌────────────────────────────┐│
│                                                    │ │    View All Notifications →││
│                                                    │ └────────────────────────────┘│
│                                                    └──────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Notification Types

| Type        | Icon | Priority | Example                             |
| ----------- | ---- | -------- | ----------------------------------- |
| Training    | 📅   | Medium   | Session reminders, completions      |
| Achievement | 🏆   | Medium   | Badge unlocks, milestones           |
| Team        | 👥   | High     | Announcements, roster changes       |
| Wellness    | 💚   | Medium   | Check-in reminders, recovery alerts |
| Game        | 🎮   | High     | Game day reminders, score updates   |
| Tournament  | 🏆   | High     | Registration, schedule updates      |
| Injury Risk | 🔴   | High     | ACWR alerts, wellness concerns      |
| Weather     | ☁️   | Low      | Training weather advisories         |

---

## Notification Priority Logic

```typescript
type NotificationPriority = "low" | "medium" | "high";

interface NotificationBehavior {
  high: {
    triggersPush: true;
    showsBadge: true;
    sound: true;
  };
  medium: {
    triggersPush: false;
    showsBadge: true;
    sound: false;
  };
  low: {
    triggersPush: false;
    showsBadge: false;
    sound: false;
  };
}
```

---

## Date Grouping

| Group     | Time Range                              |
| --------- | --------------------------------------- |
| Today     | Same calendar day                       |
| Yesterday | Previous calendar day                   |
| This Week | Past 7 days (excluding today/yesterday) |
| Older     | More than 7 days ago                    |

---

## Notification Actions

| Action             | Behavior                                  |
| ------------------ | ----------------------------------------- |
| Click notification | Navigate to related content, mark as read |
| Click dismiss (×)  | Remove notification without navigating    |
| Mark All Read      | Mark all unread notifications as read     |

---

## Real-time Updates

```typescript
// Notifications sync on:
// 1. Panel open
// 2. Every 5 minutes in background
// 3. Real-time via Supabase subscription

const notificationSubscription = supabase
  .channel("notifications")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${userId}`,
    },
    handleNewNotification,
  )
  .subscribe();
```

---

## Features to Implement

| Feature               | Status | Priority |
| --------------------- | ------ | -------- |
| Notification Panel    | ❌     | HIGH     |
| Unread Count Badge    | ❌     | HIGH     |
| Mark All Read         | ❌     | HIGH     |
| Dismiss Individual    | ❌     | HIGH     |
| Date Grouping         | ❌     | MEDIUM   |
| Click to Navigate     | ❌     | HIGH     |
| Auto Mark as Read     | ❌     | MEDIUM   |
| Real-time Updates     | ❌     | MEDIUM   |
| Push Notifications    | ❌     | LOW      |
| Notification Settings | ❌     | LOW      |

---

## Data Sources

| Data             | Service               | Table           |
| ---------------- | --------------------- | --------------- |
| Notifications    | `NotificationService` | `notifications` |
| User preferences | `SettingsService`     | `user_settings` |

---

## Related Components

| Component | Location                   | Relationship               |
| --------- | -------------------------- | -------------------------- |
| Header    | `shared/components/header` | Contains bell icon trigger |
| Settings  | `/settings`                | Notification preferences   |
