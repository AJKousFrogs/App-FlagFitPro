# Wireframe: Playbook (Player View)

**Route:** `/playbook`  
**Users:** Players (read-only, study plays)  
**Status:** ⚠️ Needs Implementation  
**Source:** Referenced in `FEATURE_DOCUMENTATION.md` §42

---

## Purpose

Allows players to study team plays, memorize their assignments, and track their playbook knowledge - helping them prepare for games and practices.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📖 Playbook                                                                   │  │
│  │     Study your plays and assignments                                          │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              MY PLAYBOOK PROGRESS                                    │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 📚 Total Plays  │  │ ✅ Memorized    │  │ 📊 Progress     │  │ 🔄 Need Review  │  │
│  │                 │  │                 │  │                 │  │                 │  │
│  │      24         │  │      18         │  │      75%        │  │       4         │  │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │  │    ─────────    │  │
│  │  Team playbook  │  │  You've learned │  │  ████████░░░░░░ │  │  Haven't studied│  │
│  │                 │  │                 │  │                 │  │  in 7+ days     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                 FILTER PLAYS                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  Formation:  [All ▼]     Situation:  [All ▼]     Status:  [All ▼]             │  │
│  │                                                                                │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │  │
│  │  │ Trips Right │ │ Trips Left  │ │ Stack       │ │ Spread      │              │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘              │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                              │  │
│  │  │ Bunch Right │ │ Bunch Left  │ │ Empty       │                              │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                              │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                    PLAYS                                             │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐     │  │
│  │  │ ┌─────────────────────────────┐ │  │ ┌─────────────────────────────┐ │     │  │
│  │  │ │                             │ │  │ │                             │ │     │  │
│  │  │ │    ┌───┐                    │ │  │ │    ┌───┐                    │ │     │  │
│  │  │ │    │ C │                    │ │  │ │    │ C │                    │ │     │  │
│  │  │ │    └───┘                    │ │  │ │    └───┘                    │ │     │  │
│  │  │ │  ┌───┐  ┌───┐  ┌───┐       │ │  │ │  ┌───┐  ┌───┐  ┌───┐       │ │     │  │
│  │  │ │  │WR1│  │QB │  │WR2│       │ │  │ │  │WR1│  │QB │  │WR2│       │ │     │  │
│  │  │ │  └─│─┘  └───┘  └─│─┘       │ │  │ │  └─│─┘  └───┘  └─│─┘       │ │     │  │
│  │  │ │    │             │         │ │  │ │    │             │         │ │     │  │
│  │  │ │    ↓             ↓         │ │  │ │    ↘             ↙         │ │     │  │
│  │  │ │                            │ │  │ │                            │ │     │  │
│  │  │ │  [PLAY DIAGRAM]            │ │  │ │  [PLAY DIAGRAM]            │ │     │  │
│  │  │ └─────────────────────────────┘ │  │ └─────────────────────────────┘ │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  │ Mesh Right                      │  │ Trips Left Go                   │     │  │
│  │  │ Formation: Trips Right          │  │ Formation: Trips Left           │     │  │
│  │  │ Situation: Base Offense         │  │ Situation: Deep Shot            │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  │ ✅ Memorized                    │  │ 🔄 Needs Review                 │     │  │
│  │  │ Last studied: 2 days ago        │  │ Last studied: 8 days ago        │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  └─────────────────────────────────┘  └─────────────────────────────────┘     │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐     │  │
│  │  │ ┌─────────────────────────────┐ │  │ ┌─────────────────────────────┐ │     │  │
│  │  │ │  [PLAY DIAGRAM]             │ │  │ │  [PLAY DIAGRAM]             │ │     │  │
│  │  │ └─────────────────────────────┘ │  │ └─────────────────────────────┘ │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  │ Bunch Slant                     │  │ Red Zone Fade                   │     │  │
│  │  │ Formation: Bunch Right          │  │ Formation: Spread               │     │  │
│  │  │ Situation: 3rd & Short          │  │ Situation: Red Zone             │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  │ ✅ Memorized                    │  │ ❌ Not Studied                  │     │  │
│  │  │ Last studied: Today             │  │ New play added 3 days ago       │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  └─────────────────────────────────┘  └─────────────────────────────────┘     │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Play Detail View (Click on Play Card)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [← Back to Playbook]                                                               │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📖 MESH RIGHT                                            ✅ Mark as Memorized │  │
│  │  Formation: Trips Right • Situation: Base Offense                             │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                                                                          │ │  │
│  │  │                          ┌───┐                                           │ │  │
│  │  │                          │ C │                                           │ │  │
│  │  │                          └───┘                                           │ │  │
│  │  │                                                                          │ │  │
│  │  │        ┌───┐         ┌───┐         ┌───┐                                │ │  │
│  │  │        │WR1│ ---→    │QB │         │WR2│                                │ │  │
│  │  │        └───┘  5yd    └───┘         └───┘                                │ │  │
│  │  │          │             │             │                                   │ │  │
│  │  │          ↓ slant       │             ↘ mesh 5yd                         │ │  │
│  │  │                        │                                                 │ │  │
│  │  │                     ┌───┐                                                │ │  │
│  │  │                     │WR3│ ---→ out 7yd                                  │ │  │
│  │  │                     └───┘                                                │ │  │
│  │  │                                                                          │ │  │
│  │  │  [FULL PLAY DIAGRAM WITH ALL ROUTES]                                    │ │  │
│  │  │                                                                          │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              YOUR ASSIGNMENT (WR2)                                   │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🎯 YOUR ROUTE: Mesh (5 yards)                                                  │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Route Type: Mesh / Shallow Cross                                             │  │
│  │  Depth: 5 yards                                                               │  │
│  │  Direction: Inside (crossing face of QB)                                      │  │
│  │  Timing: 3-step drop timing                                                   │  │
│  │                                                                                │  │
│  │  📋 KEY POINTS                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 1. Release inside at the snap                                            ││  │
│  │  │ 2. Run flat at 5 yards - DO NOT drift                                    ││  │
│  │  │ 3. Find the window between defenders                                     ││  │
│  │  │ 4. Be ready for quick throw - ball comes fast                            ││  │
│  │  │ 5. After catch: turn upfield for YAC                                     ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ⚠️ COMMON MISTAKES                                                           │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ • Running too deep (past 5 yards)                                        ││  │
│  │  │ • Drifting upfield instead of staying flat                               ││  │
│  │  │ • Not maintaining speed through the mesh point                           ││  │
│  │  │ • Looking for the ball too early                                         ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              ALL ASSIGNMENTS                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  Position │ Player      │ Assignment                      │ Depth            │  │
│  │  ─────────────────────────────────────────────────────────────────────────────│  │
│  │  QB       │ Marcus      │ 3-step drop, read mesh/slant    │ -                │  │
│  │  C        │ Jake        │ Block rusher                    │ -                │  │
│  │  WR1      │ Sarah       │ Slant route                     │ 5 yards          │  │
│  │  ⭐ WR2   │ You         │ Mesh / Shallow cross            │ 5 yards          │  │
│  │  WR3      │ Emily       │ Out route (clear out)           │ 7 yards          │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏈 QB READS (For Understanding)                                                │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  1st Read: WR1 on slant (if defender plays outside)                          │  │
│  │  2nd Read: WR2 on mesh (you!) - primary target                               │  │
│  │  3rd Read: WR3 on out route                                                  │  │
│  │  Check Down: Center if nothing open                                          │  │
│  │                                                                                │  │
│  │  💡 This play is designed to get YOU the ball!                               │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📝 COACH'S NOTES                                                               │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  "This is our bread-and-butter play. Run it until you can do it in your      │  │
│  │   sleep. The mesh concept works against any coverage if you run the          │  │
│  │   routes precisely. Stay disciplined on depth."                              │  │
│  │                                                                                │  │
│  │  When to call: Use against man coverage, 2nd & medium, 3rd & short           │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐ │  │
│  │  │ 🧠 Take Quiz         │  │ ✅ Mark Memorized    │  │ 🔄 Need More Review  │ │  │
│  │  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘ │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Play Quiz (Optional Study Tool)

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 🧠 PLAY QUIZ: MESH RIGHT                                           Question 2/5   │
│ ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                    │
│  What is your route depth on Mesh Right?                                          │
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ ( ) 3 yards                                                                │   │
│  │ (●) 5 yards                                                                │   │
│  │ ( ) 7 yards                                                                │   │
│  │ ( ) 10 yards                                                               │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  ✅ Correct! The mesh route is run at 5 yards depth.                             │
│                                                                                    │
│                                              [Next Question →]                    │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature           | Description                             |
| ----------------- | --------------------------------------- |
| Play Cards        | Visual diagram + formation + situation  |
| Progress Tracking | Memorized count, % complete             |
| Position Filter   | See only plays for your position        |
| My Assignment     | Highlighted view of your specific route |
| Key Points        | Coach-provided tips for execution       |
| Common Mistakes   | What to avoid                           |
| QB Reads          | Understand where you fit in progression |
| Quiz Mode         | Test your knowledge                     |
| Review Reminders  | Plays not studied in 7+ days            |

---

## Features to Implement

| Feature               | Status | Priority |
| --------------------- | ------ | -------- |
| Play Card Grid        | ❌     | HIGH     |
| Progress Stats        | ❌     | HIGH     |
| Play Detail View      | ❌     | HIGH     |
| My Assignment Section | ❌     | HIGH     |
| All Assignments Table | ❌     | MEDIUM   |
| QB Reads Display      | ❌     | MEDIUM   |
| Coach Notes           | ❌     | MEDIUM   |
| Quiz Mode             | ❌     | LOW      |
| Mark as Memorized     | ❌     | HIGH     |
| Review Reminders      | ❌     | MEDIUM   |
| Formation Filters     | ❌     | MEDIUM   |

---

## Data Sources

| Data            | Service           | Table                      |
| --------------- | ----------------- | -------------------------- |
| Plays           | `PlaybookService` | `playbook_plays`           |
| Assignments     | `PlaybookService` | `play_assignments`         |
| Player progress | `PlaybookService` | `player_playbook_progress` |
| Quiz scores     | `PlaybookService` | `playbook_quiz_scores`     |

---

## Related Pages

| Page             | Route     | Relationship                        |
| ---------------- | --------- | ----------------------------------- |
| Training Videos  | `/videos` | Position-specific technique videos  |
| Today's Practice | `/today`  | Practice may include specific plays |
