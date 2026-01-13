# Wireframe: Team Calendar (Coach View)

**Route:** `/coach/calendar`  
**Users:** Head Coach, Assistant Coach  
**Status:** ⚠️ Needs Implementation  
**Source:** `FEATURE_DOCUMENTATION.md` §46

---

## Purpose

Create and manage team events (practices, games, tournaments), track RSVPs, handle logistics, and coordinate with team.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📅 Team Calendar                                           [+ Create Event]   │  │
│  │     Manage team schedule and RSVPs                                            │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  [◀ Previous]      JANUARY 2026       [Next ▶]     [Month ▼] [List] [Agenda]  │  │
│  │                                                                                │  │
│  │  ┌───────┬───────┬───────┬───────┬───────┬───────┬───────┐                   │  │
│  │  │  Mon  │  Tue  │  Wed  │  Thu  │  Fri  │  Sat  │  Sun  │                   │  │
│  │  ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤                   │  │
│  │  │       │       │   1   │   2   │   3   │   4   │   5   │                   │  │
│  │  │       │       │       │🏋️     │  ●    │🏈     │       │                   │  │
│  │  │       │       │       │13/15  │       │14/15  │       │                   │  │
│  │  ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤                   │  │
│  │  │   6   │   7   │   8   │   9   │  10   │  11   │  12   │                   │  │
│  │  │🏋️     │🏋️     │       │🏋️     │       │🏈     │       │                   │  │
│  │  │14/15  │13/15  │       │       │       │       │       │                   │  │
│  │  ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤                   │  │
│  │  │  13   │  14   │  15   │  16   │  17   │  18   │  19   │                   │  │
│  │  │🏋️     │📋     │       │🏋️     │       │🏆     │🏆     │                   │  │
│  │  │       │       │       │       │       │13/15  │13/15  │                   │  │
│  │  ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤                   │  │
│  │  │  20   │  21   │  22   │  23   │  24   │  25   │  26   │                   │  │
│  │  │🏋️     │🏋️     │       │🏋️     │       │🏈     │       │                   │  │
│  │  └───────┴───────┴───────┴───────┴───────┴───────┴───────┘                   │  │
│  │                                                                                │  │
│  │  Legend:  🏋️ Practice   🏈 Game   🏆 Tournament   📋 Meeting   ● Today        │  │
│  │           Numbers = RSVP count                                                │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              UPCOMING EVENTS                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🏋️ TUESDAY PRACTICE                              Jan 7  •  [Edit] [⋮]  │  │  │
│  │  │ ─────────────────────────────────────────────────────────────────────── │  │  │
│  │  │ 📍 Central Park Field  •  ⏰ 6:00 PM - 8:00 PM                          │  │  │
│  │  │                                                                         │  │  │
│  │  │ RSVPs:  ✅ 13 going   ❌ 1 can't   ❓ 1 pending                         │  │  │
│  │  │                                                                         │  │  │
│  │  │ Pending: Marcus Williams                    [Send Reminder]             │  │  │
│  │  │                                                                         │  │  │
│  │  │ 🚗 Rides: 2 need, 3 offered                                            │  │  │
│  │  │                                                                         │  │  │
│  │  │                      [View RSVPs]  [Edit Event]  [Cancel Event]        │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🏆 SPRING CHAMPIONSHIP                        Jan 18-19  •  [Edit] [⋮] │  │  │
│  │  │ ─────────────────────────────────────────────────────────────────────── │  │  │
│  │  │ 📍 City Sports Complex  •  ⏰ 8:00 AM - 6:00 PM                         │  │  │
│  │  │                                                                         │  │  │
│  │  │ RSVPs:  ✅ 13 going   ❌ 1 can't   ❓ 1 pending                         │  │  │
│  │  │ RSVP Deadline: Jan 10 (7 days)             ⚠️ Pending RSVPs            │  │  │
│  │  │                                                                         │  │  │
│  │  │ 💰 Payments: $1,040 / $1,170 (89%)                                     │  │  │
│  │  │                                                                         │  │  │
│  │  │                      [View RSVPs]  [Manage Payments]  [Set Lineup]     │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Create Event Dialog

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 📅 CREATE EVENT                                                            [×]    │
│ ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                    │
│  Event Type                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ (●) Practice                                                               │   │
│  │ ( ) Game                                                                   │   │
│  │ ( ) Tournament                                                             │   │
│  │ ( ) Team Meeting                                                           │   │
│  │ ( ) Team Event / Social                                                    │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  Event Title                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Tuesday Practice                                                           │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  Date                              Start Time           End Time                  │
│  ┌────────────────────────┐       ┌──────────────┐     ┌──────────────┐          │
│  │ Jan 7, 2026    📅      │       │ 6:00 PM ▼    │     │ 8:00 PM ▼    │          │
│  └────────────────────────┘       └──────────────┘     └──────────────┘          │
│                                                                                    │
│  ☐ Multi-day event (e.g., tournament)                                            │
│                                                                                    │
│  Location                                                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Central Park Field ▼                                                       │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│  ☐ Add backup location                                                           │
│                                                                                    │
│  Description / Notes                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Regular practice. Focus on red zone offense.                               │   │
│  │ Bring water and wear practice gear.                                        │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  Uniform / Attire                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Practice gear ▼                                                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  RSVP Settings                                                                    │
│  ☑ Require RSVP                                                                  │
│  ☐ Set RSVP deadline: [ Jan 5, 2026  📅 ]                                        │
│  ☑ Send automatic reminder 24h before                                            │
│                                                                                    │
│  Fee (optional)                                                                   │
│  ┌──────────────────────┐  Guest fee: ┌──────────────────────┐                   │
│  │ $ 0                  │             │ $ 0                  │                   │
│  └──────────────────────┘             └──────────────────────┘                   │
│                                                                                    │
│  Recurring                                                                        │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ ( ) One-time event                                                         │   │
│  │ (●) Recurring: [Weekly ▼] on [Tuesday ▼]                                  │   │
│  │     Until: [Mar 31, 2026  📅]                                              │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  Notify                                                                           │
│  ☑ Send notification to all players                                              │
│  ☑ Include parents/guardians                                                     │
│                                                                                    │
│                                              [Cancel]  [Create Event]            │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Event RSVP Management

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 📋 RSVP MANAGEMENT: Tuesday Practice                                       [×]    │
│ ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                    │
│  Jan 7, 2026 • 6:00 PM - 8:00 PM • Central Park Field                            │
│                                                                                    │
│  Total: 15 players    ✅ 13 going    ❌ 1 can't    ❓ 1 pending                   │
│                                                                                    │
│  ── GOING (13) ──                                              [Message All]     │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ ✅ Sarah Johnson    │ Arriving: 5:45 PM │ No notes                        │   │
│  │ ✅ Marcus Williams  │ Arriving: 6:00 PM │ Might be 5 min late             │   │
│  │ ✅ Emily Chen       │ Arriving: 5:50 PM │ Limited activity (hip)          │   │
│  │ ✅ Jake Rodriguez   │ Arriving: 6:00 PM │ Can give rides (3 seats)        │   │
│  │ ✅ Chris Martinez   │ Arriving: 6:00 PM │                                 │   │
│  │ ✅ Taylor Smith     │ Arriving: 5:45 PM │ Need a ride                     │   │
│  │ ✅ Jordan Lee       │ Arriving: 6:00 PM │                                 │   │
│  │ ✅ Riley Brown      │ Arriving: 6:00 PM │ Can give rides (2 seats)        │   │
│  │ ✅ Morgan Davis     │ Arriving: 5:55 PM │                                 │   │
│  │ ✅ Casey Wilson     │ Arriving: 6:00 PM │                                 │   │
│  │ ✅ Quinn Parker     │ Arriving: 6:00 PM │                                 │   │
│  │ ✅ Drew Anderson    │ Arriving: 6:00 PM │ Need a ride                     │   │
│  │ ✅ Avery Garcia     │ Arriving: 6:00 PM │                                 │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  ── CAN'T GO (1) ──                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ ❌ Alex Thompson    │ Reason: RTP - injury recovery                       │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  ── PENDING (1) ──                                             [Send Reminder]   │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ ❓ Jamie Foster     │ No response yet                                     │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  ── RIDE COORDINATION ──                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ 🚗 Offering rides:                                                         │   │
│  │    Jake Rodriguez - 3 seats from Downtown                                 │   │
│  │    Riley Brown - 2 seats from North Side                                  │   │
│  │                                                                            │   │
│  │ 🙋 Need rides:                                                             │   │
│  │    Taylor Smith                                                           │   │
│  │    Drew Anderson                                                          │   │
│  │                                                                            │   │
│  │ [Coordinate Rides - Auto-match]                                           │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│                                              [Export List]  [Close]              │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature             | Description             |
| ------------------- | ----------------------- |
| Calendar View       | Month/week/agenda views |
| Event Creation      | All event types         |
| RSVP Management     | Track attendance        |
| Recurring Events    | Weekly practices        |
| Ride Coordination   | Match drivers/riders    |
| Reminders           | Automatic notifications |
| Fee Collection      | Event-based payments    |
| Multi-day Events    | Tournaments             |
| Location Management | Saved locations         |

---

## Event Types

| Type       | Icon | Features               |
| ---------- | ---- | ---------------------- |
| Practice   | 🏋️   | Standard, recurring    |
| Game       | 🏈   | Opponent, uniform      |
| Tournament | 🏆   | Multi-day, fees        |
| Meeting    | 📋   | Film session, planning |
| Social     | 🎉   | Team bonding           |
| Travel     | ✈️   | Logistics              |

---

## Data Sources

| Data      | Service           | Table             |
| --------- | ----------------- | ----------------- |
| Events    | `CalendarService` | `team_events`     |
| RSVPs     | `CalendarService` | `event_rsvps`     |
| Rides     | `CalendarService` | `event_logistics` |
| Locations | `LocationService` | `team_locations`  |
