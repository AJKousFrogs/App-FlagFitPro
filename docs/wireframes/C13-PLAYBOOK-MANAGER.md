# Wireframe: Playbook Manager (Coach View)

**Route:** `/coach/playbook`  
**Users:** Head Coach, Assistant Coach  
**Status:** ⚠️ Needs Implementation  
**Source:** `FEATURE_DOCUMENTATION.md` §42

---

## Purpose

Create, manage, and organize team plays. Design formations, routes, and assignments. Track which plays players have memorized.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📚 Playbook Manager                                         [+ New Play]      │  │
│  │     Create and manage team plays                                              │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  [All Plays]  [Offense]  [Defense]  [Special]  [Archived]                     │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🔍 Search plays...      Formation: [All ▼]   Situation: [All ▼]              │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               PLAYBOOK STATS                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 📋 Total Plays  │  │ ⚔️ Offense      │  │ 🛡️ Defense      │  │ 📊 Team         │  │
│  │                 │  │                 │  │                 │  │    Memorized    │  │
│  │      28         │  │      18         │  │      8          │  │                 │  │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │  │      72%        │  │
│  │  In playbook    │  │  Offensive      │  │  Defensive      │  │  Average        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               OFFENSIVE PLAYS                                        │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐     │  │
│  │  │ ┌─────────────────────────────┐ │  │ ┌─────────────────────────────┐ │     │  │
│  │  │ │    ┌───┐                    │ │  │ │    ┌───┐                    │ │     │  │
│  │  │ │    │ C │                    │ │  │ │    │ C │                    │ │     │  │
│  │  │ │    └───┘                    │ │  │ │    └───┘                    │ │     │  │
│  │  │ │  ┌───┐  ┌───┐  ┌───┐       │ │  │ │  ┌───┐ ┌───┐ ┌───┐         │ │     │  │
│  │  │ │  │WR1│  │QB │  │WR2│       │ │  │ │  │WR │ │WR │ │WR │ │QB │   │ │     │  │
│  │  │ │  └─│─┘  └───┘  └─│─┘       │ │  │ │  └─│─┘ └─│─┘ └─│─┘ └───┘   │ │     │  │
│  │  │ │    ↓             ↓         │ │  │ │    ↓     ↓     ↘            │ │     │  │
│  │  │ └─────────────────────────────┘ │  │ └─────────────────────────────┘ │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  │ Mesh Right                      │  │ Trips Left Go                   │     │  │
│  │  │ Trips Right • Base              │  │ Trips Left • Deep Shot          │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  │ Team Memorized: 85%  ████████░░│  │ Team Memorized: 78%  ███████░░░ │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  │ [Edit] [View] [Stats] [Archive] │  │ [Edit] [View] [Stats] [Archive] │     │  │
│  │  └─────────────────────────────────┘  └─────────────────────────────────┘     │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐     │  │
│  │  │ ┌─────────────────────────────┐ │  │ ┌─────────────────────────────┐ │     │  │
│  │  │ │  [PLAY DIAGRAM]             │ │  │ │  [PLAY DIAGRAM]             │ │     │  │
│  │  │ └─────────────────────────────┘ │  │ └─────────────────────────────┘ │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  │ Bunch Slant                     │  │ Red Zone Fade                   │     │  │
│  │  │ Bunch Right • 3rd & Short      │  │ Spread • Red Zone               │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  │ Team Memorized: 92%  █████████░│  │ Team Memorized: 65%  ██████░░░░ │     │  │
│  │  │                                 │  │ ⚠️ Low memorization            │     │  │
│  │  │ [Edit] [View] [Stats] [Archive] │  │ [Edit] [View] [Stats] [Archive] │     │  │
│  │  └─────────────────────────────────┘  └─────────────────────────────────┘     │  │
│  │                                                                                │  │
│  │                                                      [Load More...]           │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Play Editor

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [← Playbook]  Edit Play: Mesh Right                                   [Save] [⋮]  │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────┐  ┌────────────────────────────────────┐│
│  │ PLAY DESIGNER                           │  │ PLAY DETAILS                       ││
│  │                                         │  │ ────────────────────────────────── ││
│  │  ┌─────────────────────────────────┐   │  │                                    ││
│  │  │                                 │   │  │ Play Name                          ││
│  │  │          END ZONE               │   │  │ ┌──────────────────────────────┐  ││
│  │  │  ════════════════════════════   │   │  │ │ Mesh Right                   │  ││
│  │  │                                 │   │  │ └──────────────────────────────┘  ││
│  │  │         ┌───┐                   │   │  │                                    ││
│  │  │         │ C │                   │   │  │ Formation                          ││
│  │  │         └───┘                   │   │  │ ┌──────────────────────────────┐  ││
│  │  │                                 │   │  │ │ Trips Right ▼                │  ││
│  │  │   ┌───┐   ┌───┐   ┌───┐        │   │  │ └──────────────────────────────┘  ││
│  │  │   │WR1│   │QB │   │WR2│        │   │  │                                    ││
│  │  │   └─│─┘   └───┘   └─│─┘        │   │  │ Situation                          ││
│  │  │     │               │          │   │  │ ┌──────────────────────────────┐  ││
│  │  │     ↓ slant         ↘ mesh     │   │  │ │ Base Offense ▼               │  ││
│  │  │                                 │   │  │ └──────────────────────────────┘  ││
│  │  │              ┌───┐              │   │  │                                    ││
│  │  │              │WR3│ → out       │   │  │ Type                               ││
│  │  │              └───┘              │   │  │ ┌──────────────────────────────┐  ││
│  │  │                                 │   │  │ │ (●) Offense  ( ) Defense     │  ││
│  │  │  ════════════════════════════   │   │  │ └──────────────────────────────┘  ││
│  │  │         LINE OF SCRIMMAGE       │   │  │                                    ││
│  │  │                                 │   │  └────────────────────────────────────┘│
│  │  └─────────────────────────────────┘   │                                        │
│  │                                         │  ┌────────────────────────────────────┐│
│  │  Tools: [👆 Select] [✏️ Draw] [📍 Add] │  │ ASSIGNMENTS                        ││
│  │         [🗑️ Delete] [↩️ Undo]          │  │ ────────────────────────────────── ││
│  │                                         │  │                                    ││
│  │  Players:                               │  │ QB (Marcus)                        ││
│  │  [QB] [WR1] [WR2] [WR3] [C]            │  │ • 3-step drop                      ││
│  │                                         │  │ • Read mesh/slant                  ││
│  │  Routes:                                │  │ • Quick release timing             ││
│  │  [→ Out] [↗ Corner] [↓ Slant]         │  │                                    ││
│  │  [↘ Mesh] [↑ Go] [↙ Curl]             │  │ WR1 (Sarah) - PRIMARY              ││
│  └─────────────────────────────────────────┘  │ • Slant route 5 yards              ││
│                                                │ • Find window in coverage          ││
│                                                │                                    ││
│                                                │ WR2 (Chris)                        ││
│                                                │ • Mesh 5 yards                     ││
│                                                │ • Cross face of QB                 ││
│                                                │                                    ││
│                                                │ WR3 (Jordan)                       ││
│                                                │ • Out route 7 yards                ││
│                                                │ • Clear out defender               ││
│                                                │                                    ││
│                                                │ C (Jake)                           ││
│                                                │ • Block rusher                     ││
│                                                │ • Check down option                ││
│                                                │                                    ││
│                                                │                    [Edit Details] ││
│                                                └────────────────────────────────────┘│
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ COACH NOTES                                                                    │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │ Bread-and-butter play. Run it until you can do it in your sleep. The mesh    │  │
│  │ concept works against any coverage if routes are run precisely.               │  │
│  │                                                                                │  │
│  │ When to call: Use against man coverage, 2nd & medium, 3rd & short            │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Play Memorization Stats

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 📊 MEMORIZATION STATS: Mesh Right                                          [×]    │
│ ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                    │
│  Team Memorization: 85% (11/13 players)                                           │
│                                                                                    │
│  ── MEMORIZED (11) ──                                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ ✅ Sarah Johnson    │ Memorized Dec 28  │ Quiz Score: 100%                 │   │
│  │ ✅ Marcus Williams  │ Memorized Dec 26  │ Quiz Score: 100%                 │   │
│  │ ✅ Chris Martinez   │ Memorized Dec 30  │ Quiz Score: 80%                  │   │
│  │ ✅ Jake Rodriguez   │ Memorized Dec 25  │ Quiz Score: 100%                 │   │
│  │ ✅ Jordan Lee       │ Memorized Dec 29  │ Quiz Score: 100%                 │   │
│  │ ✅ Taylor Smith     │ Memorized Dec 27  │ Quiz Score: 100%                 │   │
│  │ ✅ Riley Brown      │ Memorized Dec 28  │ Quiz Score: 80%                  │   │
│  │ ✅ Morgan Davis     │ Memorized Dec 30  │ Quiz Score: 100%                 │   │
│  │ ✅ Casey Wilson     │ Memorized Dec 26  │ Quiz Score: 100%                 │   │
│  │ ✅ Quinn Parker     │ Memorized Dec 29  │ Quiz Score: 80%                  │   │
│  │ ✅ Drew Anderson    │ Memorized Jan 1   │ Quiz Score: 100%                 │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  ── NEEDS REVIEW (2) ──                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ 🔄 Emily Chen       │ Last studied 10 days ago │ [Send Reminder]           │   │
│  │ 🔄 Avery Garcia     │ Never studied            │ [Send Reminder]           │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│                                              [Send Reminder to All Unmemorized]  │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature               | Description                |
| --------------------- | -------------------------- |
| Play Cards            | Visual play library        |
| Play Designer         | Draw routes and formations |
| Assignments           | Per-position instructions  |
| Formation Library     | Pre-built formations       |
| Route Library         | Drag-and-drop routes       |
| Memorization Tracking | Monitor player knowledge   |
| Quiz Integration      | Test player understanding  |
| Play Stats            | Usage and success data     |

---

## Formation Types

| Formation   | Description                  |
| ----------- | ---------------------------- |
| Trips Right | 3 receivers right            |
| Trips Left  | 3 receivers left             |
| Stack       | Receivers stacked vertically |
| Spread      | Even distribution            |
| Bunch Right | 3 receivers bunched right    |
| Bunch Left  | 3 receivers bunched left     |
| Empty       | No backs                     |

---

## Route Types

| Route  | Symbol | Description       |
| ------ | ------ | ----------------- |
| Out    | →      | Break to sideline |
| Corner | ↗      | Break to corner   |
| Slant  | ↓      | Break inside      |
| Mesh   | ↘      | Shallow cross     |
| Go     | ↑      | Straight upfield  |
| Curl   | ↙      | Turn back to QB   |
| Post   | ⬆️     | Break to post     |
| Drag   | ⬅️     | Shallow drag      |

---

## Data Sources

| Data         | Service           | Table                      |
| ------------ | ----------------- | -------------------------- |
| Plays        | `PlaybookService` | `playbook_plays`           |
| Assignments  | `PlaybookService` | `play_assignments`         |
| Memorization | `PlaybookService` | `player_playbook_progress` |
| Quiz scores  | `PlaybookService` | `playbook_quiz_scores`     |
