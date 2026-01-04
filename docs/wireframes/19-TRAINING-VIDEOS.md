# Wireframe: Training Videos

**Route:** `/training/videos`  
**Users:** All Users  
**Status:** ✅ Fully Implemented  
**Source:** `angular/src/app/features/training/video-feed/video-feed.component.ts`

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🎬 TRAINING VIDEOS                                                             │  │
│  │    Evidence-based training content for flag football athletes                  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🔍 Search videos...                                                            │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ CATEGORIES                                                                     │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│  │
│  │  │   All    │ │   QB     │ │   WR     │ │   DB     │ │ Rushers  │ │ Recovery ││  │
│  │  │[SELECTED]│ │          │ │          │ │          │ │          │ │          ││  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│  │
│  │                                                                                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                                       │  │
│  │  │ Mobility │ │ Strength │ │  Speed   │                                       │  │
│  │  │          │ │          │ │          │                                       │  │
│  │  └──────────┘ └──────────┘ └──────────┘                                       │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                    VIDEO GRID                                        │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  ┌────────────────┐
│  │ ┌─────────────────────────┐│  │ ┌─────────────────────────┐│  │ ┌──────────────┐│
│  │ │                         ││  │ │                         ││  │ │              ││
│  │ │    [VIDEO THUMBNAIL]    ││  │ │    [VIDEO THUMBNAIL]    ││  │ │  [THUMBNAIL] ││
│  │ │                         ││  │ │                         ││  │ │              ││
│  │ │                   ▶     ││  │ │                   ▶     ││  │ │        ▶     ││
│  │ │             12:45       ││  │ │              8:30       ││  │ │        15:20 ││
│  │ └─────────────────────────┘│  │ └─────────────────────────┘│  │ └──────────────┘│
│  │                            │  │                            │  │                 │
│  │ QB Throwing Mechanics      │  │ WR Route Running Drills    │  │ DB Coverage    │
│  │ ─────────────────────────  │  │ ─────────────────────────  │  │ Techniques     │
│  │                            │  │                            │  │ ───────────────│
│  │ Master the fundamentals    │  │ Learn the 9 core routes    │  │ Man vs zone   │
│  │ of accurate passing        │  │ every receiver needs       │  │ coverage tips │
│  │                            │  │                            │  │                 │
│  │ ┌────────┐ ⭐ 4.8 │ 15.2K  │  │ ┌────────┐ ⭐ 4.9 │ 12.8K  │  │ ┌────────┐     │
│  │ │   QB   │ views          │  │ │   WR   │ views          │  │ │   DB   │     │
│  │ └────────┘                 │  │ └────────┘                 │  │ └────────┘     │
│  │                            │  │                            │  │                 │
│  │ [Watch] [Save] [Share]     │  │ [Watch] [Save] [Share]     │  │ [Watch][Save]  │
│  └─────────────────────────────┘  └─────────────────────────────┘  └────────────────┘
│                                                                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  ┌────────────────┐
│  │ ┌─────────────────────────┐│  │ ┌─────────────────────────┐│  │ ┌──────────────┐│
│  │ │                         ││  │ │                         ││  │ │              ││
│  │ │    [VIDEO THUMBNAIL]    ││  │ │    [VIDEO THUMBNAIL]    ││  │ │  [THUMBNAIL] ││
│  │ │                         ││  │ │                         ││  │ │              ││
│  │ │                   ▶     ││  │ │                   ▶     ││  │ │        ▶     ││
│  │ │              6:15       ││  │ │             10:00       ││  │ │         7:45 ││
│  │ └─────────────────────────┘│  │ └─────────────────────────┘│  │ └──────────────┘│
│  │                            │  │                            │  │                 │
│  │ Dynamic Warm-up Routine    │  │ Sprint Mechanics           │  │ Hip Mobility   │
│  │ ...                        │  │ ...                        │  │ Flow           │
│  └─────────────────────────────┘  └─────────────────────────────┘  └────────────────┘
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                   VIDEO PLAYER                                       │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🎬 VIDEO PLAYER (Full-width modal or inline)                                   │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │ ┌──────────────────────────────────────────────────────────────────────────┐  │  │
│  │ │                                                                          │  │  │
│  │ │                                                                          │  │  │
│  │ │                         [VIDEO PLAYER]                                   │  │  │
│  │ │                                                                          │  │  │
│  │ │                              ▶ / ⏸                                       │  │  │
│  │ │                                                                          │  │  │
│  │ │  ──●───────────────────────────────────────────────────  2:45 / 12:45   │  │  │
│  │ │                                                                          │  │  │
│  │ │  🔊 ─────●──────  ⏮  ⏭  1x  [HD]  [CC]  [⛶ Fullscreen]                │  │  │
│  │ └──────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │ QB Throwing Mechanics - Complete Guide                                        │  │
│  │ ─────────────────────────────────────────────────────────────────────────────│  │
│  │ ⭐ 4.8 │ 15.2K views │ Category: QB                                          │  │
│  │                                                                                │  │
│  │ [❤️ Save to Favorites] [📤 Share] [📋 Add to Training Plan]                   │  │
│  │                                                                                │  │
│  │ 📝 DESCRIPTION                                                                │  │
│  │ ─────────────────────────────────────────────────────────────────────────────│  │
│  │ In this comprehensive guide, learn the fundamentals of accurate passing      │  │
│  │ in flag football. Covers grip, stance, footwork, release, and follow-        │  │
│  │ through. Perfect for beginners and intermediate QBs.                         │  │
│  │                                                                                │  │
│  │ 📌 CHAPTERS                                                                   │  │
│  │ ─────────────────────────────────────────────────────────────────────────────│  │
│  │ 0:00  Introduction                                                           │  │
│  │ 1:30  Proper Grip                                                            │  │
│  │ 3:45  Stance and Setup                                                       │  │
│  │ 6:00  Footwork Fundamentals                                                  │  │
│  │ 8:30  Release Mechanics                                                      │  │
│  │ 10:45 Follow-through                                                         │  │
│  │ 12:00 Common Mistakes                                                        │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Video Categories

| Category | Description |
|----------|-------------|
| QB | Quarterback-specific drills |
| WR | Wide Receiver routes and catching |
| DB | Defensive Back coverage |
| Rushers | Pass rush techniques |
| Recovery | Stretching, foam rolling |
| Mobility | Flexibility drills |
| Strength | Gym and bodyweight exercises |
| Speed | Sprint mechanics and agility |

---

## Video Card Data

| Field | Description |
|-------|-------------|
| Thumbnail | Video preview image |
| Duration | Video length |
| Title | Video name |
| Description | Short summary |
| Category Tag | Position/category |
| Rating | Star rating (1-5) |
| Views | View count |

---

## Features Implemented

| Feature | Status |
|---------|--------|
| Video grid | ✅ |
| Category filters | ✅ |
| Search videos | ✅ |
| Video thumbnails | ✅ |
| Duration display | ✅ |
| Rating display | ✅ |
| View count | ✅ |
| Watch video (player) | ✅ |
| Save to favorites | ✅ |
| Share video | ✅ |
| Add to training plan | ✅ |
| Video description | ✅ |
| Chapters/timestamps | ✅ |
| Full-width player | ✅ |
| HD quality toggle | ✅ |
| Closed captions | ✅ |
| Fullscreen | ✅ |
| Playback speed | ✅ |

---

## Data Sources

| Data | Service | Source |
|------|---------|--------|
| Videos | `ApiService` | `training_videos` table or YouTube API |
| Favorites | `ApiService` | `user_video_favorites` |
| Watch history | `ApiService` | `video_watch_history` |
