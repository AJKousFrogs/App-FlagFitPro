# Wireframe: Team Chat

**Route:** `/chat`  
**Users:** Team Members (Players, Coaches)  
**Status:** ✅ Fully Implemented  
**Source:** `angular/src/app/features/chat/chat.component.ts`

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────────────┐  ┌───────────────────────────────────────────────────────┐ │
│  │ CHANNELS             │  │ 📢 ANNOUNCEMENTS                                      │ │
│  │ ────────────────────│  │ ─────────────────────────────────────────────────────│ │
│  │                      │  │ Official team announcements • Read-only for players  │ │
│  │ 📢 Announcements  🔴│  │                                                       │ │
│  │    [SELECTED]        │  │ ┌───────────────────────────────────────────────────┐│ │
│  │                      │  │ │ 👤 Online: 8 │ 👁️ Total: 15 │ 📩 Unread: 2      ││ │
│  │ 💬 General           │  │ └───────────────────────────────────────────────────┘│ │
│  │                      │  │                                                       │ │
│  │ 🏈 Game Day          │  │ ═══════════════════════════════════════════════════ │ │
│  │                      │  │                      MESSAGES                        │ │
│  │ 🔒 Coaches Only      │  │ ═══════════════════════════════════════════════════ │ │
│  │    (Coach role only) │  │                                                       │ │
│  │                      │  │ ┌───────────────────────────────────────────────────┐│ │
│  │ ─────────────────── │  │ │ 📌 PINNED                                         ││ │
│  │ POSITION GROUPS      │  │ │                                                   ││ │
│  │                      │  │ │ 👤 Coach Thompson                     Jan 2, 10AM ││ │
│  │ 🏈 QB Channel        │  │ │ ──────────────────────────────────────────────── ││ │
│  │ 🏃 WR Channel        │  │ │ Practice schedule change: Tomorrow's practice    ││ │
│  │ 🛡️ DB Channel        │  │ │ moved to 6PM due to field availability.          ││ │
│  │ 💪 Rushers           │  │ │                                                   ││ │
│  │                      │  │ │ ⚠️ IMPORTANT │ 👁️ Read by 12/15                  ││ │
│  │ ─────────────────── │  │ └───────────────────────────────────────────────────┘│ │
│  │ + Create Channel     │  │                                                       │ │
│  │   (Coach only)       │  │ ┌───────────────────────────────────────────────────┐│ │
│  │                      │  │ │ 👤 Coach Thompson                     Jan 1, 3PM  ││ │
│  │ ─────────────────── │  │ │ ──────────────────────────────────────────────── ││ │
│  │ DIRECT MESSAGES      │  │ │ 🏆 Great job at the tournament everyone! Final   ││ │
│  │                      │  │ │ standings: 3rd place! Let's keep building.       ││ │
│  │ 👤 John Smith        │  │ │                                                   ││ │
│  │ 👤 Maria Garcia   🔴│  │ │ 👁️ Read by 15/15                                  ││ │
│  │ 👤 Coach Lee         │  │ └───────────────────────────────────────────────────┘│ │
│  │                      │  │                                                       │ │
│  └──────────────────────┘  │ ┌───────────────────────────────────────────────────┐│ │
│                            │ │ 👤 Coach Lee                          Dec 31, 9AM ││ │
│                            │ │ ──────────────────────────────────────────────── ││ │
│                            │ │ Reminder: Bring your game jerseys to practice    ││ │
│                            │ │ on Thursday. We'll be doing team photos.         ││ │
│                            │ │                                                   ││ │
│                            │ │ 👁️ Read by 10/15                                  ││ │
│                            │ └───────────────────────────────────────────────────┘│ │
│                            │                                                       │ │
│                            │ ═══════════════════════════════════════════════════ │ │
│                            │                    MESSAGE INPUT                     │ │
│                            │ ═══════════════════════════════════════════════════ │ │
│                            │                                                       │ │
│                            │ ┌───────────────────────────────────────────────────┐│ │
│                            │ │ Type your message... @mention to notify           ││ │
│                            │ │                                                   ││ │
│                            │ │                                       [📎] [📤]  ││ │
│                            │ └───────────────────────────────────────────────────┘│ │
│                            │                                                       │ │
│                            │ (Announcements: Coach only can post)                 │ │
│                            └───────────────────────────────────────────────────────┘ │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Channel Types

| Type | Icon | Who Can Post | Who Can View |
|------|------|--------------|--------------|
| Announcements | 📢 | Coaches only | Everyone |
| General | 💬 | Everyone | Everyone |
| Game Day | 🏈 | Everyone | Everyone |
| Coaches Only | 🔒 | Coaches | Coaches only |
| Position Groups | 🏈🏃🛡️💪 | Position members | Position members |
| Direct Messages | 👤 | Participants | Participants |

---

## Message Features

| Feature | Who Can Use | Description |
|---------|-------------|-------------|
| Pin message | Coaches | Pin to top of channel |
| Mark important | Coaches | ⚠️ badge |
| Read receipts | Announcements | "Read by X/Y" |
| @mentions | Everyone | Notify specific user |
| Reactions | Everyone | Emoji reactions |

---

## Features Implemented

| Feature | Status |
|---------|--------|
| Channel list sidebar | ✅ |
| Announcements channel | ✅ |
| General channel | ✅ |
| Coaches-only channel | ✅ |
| Position group channels | ✅ |
| Direct messages | ✅ |
| Create channel (coach) | ✅ |
| Pin message | ✅ |
| Mark important | ✅ |
| Read receipts | ✅ |
| @mentions | ✅ |
| Online indicator | ✅ |
| Unread badge | ✅ |
| Real-time updates | ✅ |
| Message input | ✅ |
| Role-based permissions | ✅ |

---

## Data Sources

| Data | Service | Method |
|------|---------|--------|
| Channels | `ChannelService` | `getChannels()` |
| Messages | `ChannelService` | `getMessages()` |
| Presence | `PresenceService` | Online status |
| Notifications | `TeamNotificationService` | @mention alerts |
