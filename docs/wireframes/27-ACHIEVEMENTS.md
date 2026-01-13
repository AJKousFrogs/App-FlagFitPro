# Wireframe: Achievements System

**Route:** `/achievements`  
**Users:** All players, Coaches (view team leaderboard)  
**Status:** ⚠️ Needs Implementation  
**Source:** Referenced in `FEATURE_DOCUMENTATION.md` §20

---

## Purpose

Gamifies the training experience by awarding badges and points for completing training milestones, wellness streaks, and performance goals.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🏆 Achievements                                                               │  │
│  │     Earn badges and points for your training milestones                       │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                  STATS OVERVIEW                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 🏆 Total Points │  │ 🎖️ Achievements │  │ 📊 Progress     │  │ 🔥 Recent       │  │
│  │                 │  │    Unlocked     │  │                 │  │    Unlock       │  │
│  │                 │  │                 │  │                 │  │                 │  │
│  │    1,250        │  │    18 / 45      │  │    40%          │  │    2 days ago   │  │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │  │    ─────────    │  │
│  │  🔵 Top 15%     │  │                 │  │  ████████░░░░░░ │  │  "Speed Demon"  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                 RECENT UNLOCKS                                       │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🎉 Recently Unlocked                                                           │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐    │  │
│  │  │      ┌─────┐        │  │      ┌─────┐        │  │      ┌─────┐        │    │  │
│  │  │      │ ⚡  │        │  │      │ 💚  │        │  │      │ 🏃  │        │    │  │
│  │  │      │     │        │  │      │     │        │  │      │     │        │    │  │
│  │  │      └─────┘        │  │      └─────┘        │  │      └─────┘        │    │  │
│  │  │   Speed Demon       │  │   7-Day Streak      │  │   Century Club      │    │  │
│  │  │   ───────────       │  │   ───────────       │  │   ───────────       │    │  │
│  │  │   Beat your 40-yard │  │   7 consecutive     │  │   100 total         │    │  │
│  │  │   PR by 0.1s        │  │   wellness check-ins│  │   training sessions │    │  │
│  │  │                     │  │                     │  │                     │    │  │
│  │  │   +50 pts           │  │   +25 pts           │  │   +75 pts           │    │  │
│  │  │   Jan 1, 2026       │  │   Dec 28, 2025      │  │   Dec 20, 2025      │    │  │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘    │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              ACHIEVEMENT CATEGORIES                                  │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │ [💚 Wellness] [🏋️ Training] [🏆 Performance] [👥 Social] [⭐ Special]           │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ── 💚 WELLNESS ACHIEVEMENTS ───────────────────────────────────────────────────── │
│                                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │      ┌─────┐        │  │      ┌─────┐        │  │      ┌─────┐        │          │
│  │      │ 💚  │ ✓      │  │      │ 💚  │ ✓      │  │      │ 🔒  │        │          │
│  │      │     │ UNLOCKED│  │      │     │ UNLOCKED│  │      │     │ LOCKED │          │
│  │      └─────┘        │  │      └─────┘        │  │      └─────┘        │          │
│  │   First Check-in    │  │   7-Day Streak      │  │   30-Day Streak     │          │
│  │   ───────────       │  │   ───────────       │  │   ───────────       │          │
│  │   Complete your     │  │   7 consecutive     │  │   30 consecutive    │          │
│  │   first wellness    │  │   wellness check-ins│  │   wellness check-ins│          │
│  │   check-in          │  │                     │  │                     │          │
│  │                     │  │                     │  │   Progress: 7/30    │          │
│  │   +10 pts           │  │   +25 pts           │  │   ████░░░░░░░░░░ 23%│          │
│  │   ✓ Dec 1, 2025     │  │   ✓ Dec 28, 2025    │  │   +50 pts           │          │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘          │
│                                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │      ┌─────┐        │  │      ┌─────┐        │  │      ┌─────┐        │          │
│  │      │ 🔒  │ LOCKED │  │      │ 🔒  │ LOCKED │  │      │ 🔒  │ LOCKED │          │
│  │      └─────┘        │  │      └─────┘        │  │      └─────┘        │          │
│  │   ACWR Sweet Spot   │  │   Early Bird        │  │   Night Owl         │          │
│  │   ───────────       │  │   ───────────       │  │   ───────────       │          │
│  │   Stay in optimal   │  │   10 check-ins      │  │   10 check-ins      │          │
│  │   ACWR zone for     │  │   before 6:00 AM    │  │   after 10:00 PM    │          │
│  │   7 consecutive days│  │                     │  │                     │          │
│  │                     │  │                     │  │                     │          │
│  │   Progress: 3/7     │  │   Progress: 2/10    │  │   Progress: 0/10    │          │
│  │   ██████░░░░░░░ 43% │  │   ██░░░░░░░░░░ 20%  │  │   ░░░░░░░░░░░░ 0%   │          │
│  │   +50 pts           │  │   +25 pts           │  │   +25 pts           │          │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘          │
│                                                                                      │
│  ── 🏋️ TRAINING ACHIEVEMENTS ──────────────────────────────────────────────────── │
│                                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │      ┌─────┐        │  │      ┌─────┐        │  │      ┌─────┐        │          │
│  │      │ 🏋️  │ ✓      │  │      │ 🏋️  │ ✓      │  │      │ 🔒  │ LOCKED │          │
│  │      │     │ UNLOCKED│  │      │     │ UNLOCKED│  │      │     │        │          │
│  │      └─────┘        │  │      └─────┘        │  │      └─────┘        │          │
│  │   First Session     │  │   Century Club      │  │   Iron Warrior      │          │
│  │   ───────────       │  │   ───────────       │  │   ───────────       │          │
│  │   Log your first    │  │   Complete 100      │  │   Complete 500      │          │
│  │   training session  │  │   training sessions │  │   training sessions │          │
│  │                     │  │                     │  │                     │          │
│  │   +15 pts           │  │   +75 pts           │  │   Progress: 105/500 │          │
│  │   ✓ Dec 1, 2025     │  │   ✓ Dec 20, 2025    │  │   ██░░░░░░░░░░ 21%  │          │
│  │                     │  │                     │  │   +150 pts          │          │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘          │
│                                                                                      │
│  ── 🏆 PERFORMANCE ACHIEVEMENTS ────────────────────────────────────────────────── │
│                                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │      ┌─────┐        │  │      ┌─────┐        │  │      ┌─────┐        │          │
│  │      │ ⚡  │ ✓      │  │      │ 🔒  │ LOCKED │  │      │ 🔒  │ LOCKED │          │
│  │      │     │ UNLOCKED│  │      │     │        │  │      │     │        │          │
│  │      └─────┘        │  │      └─────┘        │  │      └─────┘        │          │
│  │   Speed Demon       │  │   Vertical King     │  │   First Game Win    │          │
│  │   ───────────       │  │   ───────────       │  │   ───────────       │          │
│  │   Beat your 40-yard │  │   Vertical jump     │  │   Win your first    │          │
│  │   PR by 0.1s        │  │   PR > 36 inches    │  │   game              │          │
│  │                     │  │                     │  │                     │          │
│  │   +50 pts           │  │   Current: 34"      │  │   +100 pts          │          │
│  │   ✓ Jan 1, 2026     │  │   ████████░░░░░ 94% │  │   No games yet      │          │
│  │                     │  │   +50 pts           │  │                     │          │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘          │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                TEAM LEADERBOARD                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏆 Team Leaderboard                              [This Week ▼] [All Time ▼]    │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Rank │ Player          │ Points │ Recent Achievement                        │  │
│  │  ─────────────────────────────────────────────────────────────────────────────│  │
│  │  🥇 1 │ Marcus Johnson  │  1,450 │ 30-Day Streak                             │  │
│  │  🥈 2 │ Sarah Williams  │  1,320 │ Speed Demon                               │  │
│  │  🥉 3 │ ⭐ You          │  1,250 │ Speed Demon                               │  │
│  │     4 │ Jake Thompson   │  1,180 │ Century Club                              │  │
│  │     5 │ Emily Chen      │  1,050 │ 7-Day Streak                              │  │
│  │                                                                                │  │
│  │  Your Rank: #3 of 15 players                                                  │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Achievement Categories

| Category    | Icon | Examples                                      |
| ----------- | ---- | --------------------------------------------- |
| Wellness    | 💚   | Streak achievements (7-day, 30-day check-ins) |
| Training    | 🏋️   | Volume and consistency (100 sessions, etc.)   |
| Performance | 🏆   | Personal records, improvement milestones      |
| Social      | 👥   | Team participation, helping teammates         |
| Special     | ⭐   | Event-specific, seasonal achievements         |

---

## Achievement Unlock Triggers

```typescript
const ACHIEVEMENT_TRIGGERS = {
  // Wellness
  "wellness-first": () => totalWellnessCheckIns >= 1,
  "wellness-streak-7": () => consecutiveWellnessCheckIns >= 7,
  "wellness-streak-30": () => consecutiveWellnessCheckIns >= 30,
  "acwr-sweet-spot-7": () => consecutiveDaysInSweetSpot >= 7,
  "early-bird": () => checkInsBeforeTime("06:00") >= 10,
  "night-owl": () => checkInsAfterTime("22:00") >= 10,

  // Training
  "training-first": () => totalTrainingSessions >= 1,
  "training-century": () => totalTrainingSessions >= 100,
  "training-iron": () => totalTrainingSessions >= 500,

  // Performance
  "speed-demon": () => improved40YardPR >= 0.1,
  "vertical-king": () => verticalJumpPR >= 36,
  "first-game-win": () => gamesWon >= 1,
};
```

---

## Points System

```typescript
const ACHIEVEMENT_POINTS = {
  wellness: {
    small: 10, // First check-in
    medium: 25, // 7-day streak
    large: 50, // 30-day streak
  },
  training: {
    small: 15, // First session
    medium: 35, // 50 sessions
    large: 75, // 100 sessions
  },
  performance: {
    small: 20, // Minor PR
    medium: 50, // Major PR
    large: 100, // Championship
  },
  social: {
    small: 10,
    medium: 20,
    large: 40,
  },
  special: {
    small: 25,
    medium: 75,
    large: 150,
  },
};
```

---

## Achievement States

| State    | Visual       | Description                                  |
| -------- | ------------ | -------------------------------------------- |
| Unlocked | ✓ with date  | Achievement earned, shows unlock date        |
| Locked   | 🔒           | Not yet earned, shows progress if applicable |
| Progress | Progress bar | Shows X/Y toward goal                        |
| Hidden   | ???          | Secret achievements (optional)               |

---

## Features to Implement

| Feature                      | Status | Priority |
| ---------------------------- | ------ | -------- |
| Stats Overview Cards         | ❌     | HIGH     |
| Recent Unlocks Display       | ❌     | HIGH     |
| Category Tabs                | ❌     | MEDIUM   |
| Achievement Cards (Unlocked) | ❌     | HIGH     |
| Achievement Cards (Locked)   | ❌     | HIGH     |
| Progress Tracking            | ❌     | HIGH     |
| Team Leaderboard             | ❌     | MEDIUM   |
| Unlock Notifications         | ❌     | MEDIUM   |
| Points Calculation           | ❌     | HIGH     |
| Automatic Trigger Checks     | ❌     | HIGH     |

---

## Data Sources

| Data                    | Service              | Table                          |
| ----------------------- | -------------------- | ------------------------------ |
| User achievements       | `AchievementService` | `user_achievements`            |
| Achievement definitions | `AchievementService` | `achievements`                 |
| Progress tracking       | `AchievementService` | Calculated from other tables   |
| Leaderboard             | `AchievementService` | Aggregated `user_achievements` |

---

## Related Pages

| Page          | Route               | Relationship          |
| ------------- | ------------------- | --------------------- |
| Profile       | `/profile`          | Achievement summary   |
| Dashboard     | `/player-dashboard` | Recent unlocks widget |
| Notifications | Header panel        | Unlock notifications  |
