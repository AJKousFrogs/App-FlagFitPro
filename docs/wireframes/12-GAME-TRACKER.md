# Wireframe: Game Tracker

**Route:** `/game-tracker`  
**Users:** Coaches (team games), Players (personal/domestic league games)  
**Status:** ✅ Fully Implemented  
**Source:** `angular/src/app/features/game-tracker/game-tracker.component.ts`

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📊 Game Tracker                                          ┌──────────────────┐│  │
│  │     Track play-by-play stats for games                    │  + New Game      ││  │
│  │                                                           └──────────────────┘│  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📅 RECENT GAMES                                                                │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │  Date       │  Opponent        │  Location    │  Score   │  Result       ││  │
│  │  ├──────────────────────────────────────────────────────────────────────────┤│  │
│  │  │  Jan 1      │  Team Alpha      │  Home        │  28-21   │  🟢 WIN       ││  │
│  │  │  Dec 28     │  Team Beta       │  Away        │  14-21   │  🔴 LOSS      ││  │
│  │  │  Dec 21     │  Team Gamma      │  Home        │  21-21   │  🟡 TIE       ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  [Select game to view plays]                                                  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                NEW GAME FORM                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏈 CREATE NEW GAME                                                             │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Game Type:                                                                   │  │
│  │  ○ Team Game - Visible to all team members                                    │  │
│  │  ○ Personal/Domestic League - Only visible to you and coaches with consent   │  │
│  │                                                                                │  │
│  │  ┌─────────────────────┐    ┌─────────────────────┐                           │  │
│  │  │ Game Date           │    │ Home/Away           │                           │  │
│  │  │ 📅 Jan 5, 2026      │    │ ▼ Home              │                           │  │
│  │  └─────────────────────┘    └─────────────────────┘                           │  │
│  │                                                                                │  │
│  │  ┌─────────────────────┐    ┌─────────────────────┐                           │  │
│  │  │ Opponent            │    │ Location            │                           │  │
│  │  │ Team Name           │    │ Field Name          │                           │  │
│  │  └─────────────────────┘    └─────────────────────┘                           │  │
│  │                                                                                │  │
│  │  ┌─────────────────────┐    ┌─────────────────────┐                           │  │
│  │  │ Weather             │    │ Field Condition     │                           │  │
│  │  │ ▼ Clear             │    │ ▼ Dry               │                           │  │
│  │  └─────────────────────┘    └─────────────────────┘                           │  │
│  │                                                                                │  │
│  │  ┌─────────────────────┐                                                      │  │
│  │  │ Temperature         │  °F / °C toggle                                      │  │
│  │  │ 72                  │                                                      │  │
│  │  └─────────────────────┘                                                      │  │
│  │                                                                                │  │
│  │                         [Cancel]    [Create Game]                             │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              ACTIVE GAME - PLAY TRACKER                              │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏈 VS TEAM ALPHA (Active)                         Score: 21 - 14              │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────┐                                              │  │
│  │  │ Play Type                   │                                              │  │
│  │  │ ▼ Select...                 │                                              │  │
│  │  │   • Pass Play               │                                              │  │
│  │  │   • Run Play                │                                              │  │
│  │  │   • Flag Pull               │                                              │  │
│  │  │   • Interception            │                                              │  │
│  │  │   • Pass Deflection         │                                              │  │
│  │  └─────────────────────────────┘                                              │  │
│  │                                                                                │  │
│  │  ─────────────── PASS PLAY FORM (when selected) ───────────────                │  │
│  │                                                                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │  │
│  │  │ Half            │  │ Time Remaining  │  │ Down            │                │  │
│  │  │ ○ 1st  ● 2nd    │  │ [−] 5:30 [+]   │  │ ▼ 2nd           │                │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                │  │
│  │                                                                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                                     │  │
│  │  │ Distance        │  │ Yard Line       │                                     │  │
│  │  │ 8 yards         │  │ 35              │                                     │  │
│  │  └─────────────────┘  └─────────────────┘                                     │  │
│  │                                                                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                                     │  │
│  │  │ Quarterback     │  │ Receiver        │                                     │  │
│  │  │ ▼ John Smith    │  │ ▼ Maria Garcia  │                                     │  │
│  │  └─────────────────┘  └─────────────────┘                                     │  │
│  │                                                                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                                     │  │
│  │  │ Route Type      │  │ Route Depth     │                                     │  │
│  │  │ ▼ Slant         │  │ 8 yards         │                                     │  │
│  │  └─────────────────┘  └─────────────────┘                                     │  │
│  │                                                                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │  │
│  │  │ Outcome         │  │ Throw Accuracy  │  │ Snap Accuracy   │                │  │
│  │  │ ▼ Completion    │  │ ▼ On Target     │  │ ▼ Good          │                │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                │  │
│  │                                                                                │  │
│  │  If DROP:                                                                     │  │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐                         │  │
│  │  │ Drop Severity   │  │ Drop Reason                 │                         │  │
│  │  │ ▼ Bad           │  │ ▼ Concentration             │                         │  │
│  │  └─────────────────┘  └─────────────────────────────┘                         │  │
│  │                                                                                │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ Play Notes                                                                ││  │
│  │  │ Great route by receiver, QB hit in stride                                 ││  │
│  │  └───────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │                              [Record Play]                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📋 PLAYS RECORDED THIS GAME (15)                                               │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  # │ Half │ Time  │ Type    │ Players           │ Outcome     │ Notes        │  │
│  │  ─────────────────────────────────────────────────────────────────────────────│  │
│  │  15│  2   │ 5:30  │ Pass    │ Smith → Garcia    │ Completion  │ TD!          │  │
│  │  14│  2   │ 6:15  │ Flag    │ Jones             │ Success     │              │  │
│  │  13│  2   │ 7:00  │ Pass    │ Smith → Williams  │ Drop        │ Bad drop     │  │
│  │  12│  2   │ 7:45  │ Run     │ Johnson           │ 8 yards     │              │  │
│  │  ...                                                                          │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Play Types & Fields

### Pass Play

| Field          | Type    | Options                                                  |
| -------------- | ------- | -------------------------------------------------------- |
| Quarterback    | Select  | Team roster                                              |
| Receiver       | Select  | Team roster                                              |
| Route Type     | Select  | Slant, Out, In, Post, Corner, Go, Comeback, Screen, Flat |
| Route Depth    | Number  | Yards                                                    |
| Outcome        | Select  | Completion, Drop, Incompletion, Interception, Defended   |
| Throw Accuracy | Select  | On Target, High, Low, Behind, Overthrow                  |
| Snap Accuracy  | Select  | Good, Off target, Fumbled                                |
| Is Drop?       | Boolean |                                                          |
| Drop Severity  | Select  | (if drop) Bad, Okay                                      |
| Drop Reason    | Select  | (if drop) Concentration, Pressure, Bad throw             |

### Run Play

| Field        | Type   | Options     |
| ------------ | ------ | ----------- |
| Ball Carrier | Select | Team roster |
| Yards Gained | Number |             |

### Flag Pull

| Field        | Type    | Options                           |
| ------------ | ------- | --------------------------------- |
| Defender     | Select  | Team roster                       |
| Ball Carrier | Select  | (opponent)                        |
| Successful   | Boolean |                                   |
| Miss Reason  | Select  | (if missed) Grab, Position, Speed |

### Interception

| Field       | Type   | Options     |
| ----------- | ------ | ----------- |
| Interceptor | Select | Team roster |

### Pass Deflection

| Field        | Type   | Options     |
| ------------ | ------ | ----------- |
| Deflected By | Select | Team roster |

---

## Game Visibility

| Type          | Created By | Visible To                        |
| ------------- | ---------- | --------------------------------- |
| Team Game     | Coach      | All team members                  |
| Personal Game | Player     | Player only, coaches with consent |

---

## Features Implemented

| Feature                    | Status |
| -------------------------- | ------ |
| Create new game            | ✅     |
| Game type (team/personal)  | ✅     |
| Weather conditions         | ✅     |
| Field conditions           | ✅     |
| Temperature (F/C toggle)   | ✅     |
| Home/Away selection        | ✅     |
| Pass play tracking         | ✅     |
| Run play tracking          | ✅     |
| Flag pull tracking         | ✅     |
| Interception tracking      | ✅     |
| Pass deflection tracking   | ✅     |
| Half/time/down tracking    | ✅     |
| Route types                | ✅     |
| Drop tracking with reasons | ✅     |
| Play notes                 | ✅     |
| Score tracking             | ✅     |
| Play history table         | ✅     |
| Games list                 | ✅     |
| Result tagging (W/L/T)     | ✅     |

---

## Data Sources

| Data    | Service      | Table              |
| ------- | ------------ | ------------------ |
| Games   | `ApiService` | `games`            |
| Plays   | `ApiService` | `game_plays`       |
| Players | `ApiService` | `roster` / `users` |
