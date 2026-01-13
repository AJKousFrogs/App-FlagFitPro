# Wireframe: Global Search

**Route:** Slide-out panel (Cmd/Ctrl + K)  
**Users:** All users  
**Status:** ⚠️ Needs Implementation  
**Source:** Referenced in `FEATURE_DOCUMENTATION.md` §18

---

## Purpose

Unified search functionality across all application content with real-time results, recent searches, and intelligent suggestions.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
│                                                              ↓                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ 🔍 Search exercises, videos, players, programs...            ⌘K to close │ │  │
│  │  │ ┌──────────────────────────────────────────────────────────────────────┐ │ │  │
│  │  │ │ squats                                                            × │ │ │  │
│  │  │ └──────────────────────────────────────────────────────────────────────┘ │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ── RECENT SEARCHES ───────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐             │  │
│  │  │ 🕐 hamstring     │  │ 🕐 sprint drills │  │ 🕐 recovery      │             │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘             │  │
│  │                                                                                │  │
│  │  ── QUICK LINKS ───────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐             │  │
│  │  │ 📅 Today's       │  │ 💚 Wellness      │  │ 📊 Analytics     │             │  │
│  │  │    Practice      │  │    Check-in      │  │                  │             │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘             │  │
│  │                                                                                │  │
│  │  ══════════════════════════════════════════════════════════════════════════ │  │
│  │                          SEARCH RESULTS                                       │  │
│  │  ══════════════════════════════════════════════════════════════════════════ │  │
│  │                                                                                │  │
│  │  ── EXERCISES (4 results) ────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 🏋️ Back <mark>Squats</mark>                                              ││  │
│  │  │ Compound leg exercise targeting quads, glutes, hamstrings               ││  │
│  │  │ Category: Strength · Difficulty: Intermediate                           ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 🏋️ Goblet <mark>Squats</mark>                                            ││  │
│  │  │ Beginner-friendly squat variation with dumbbell                         ││  │
│  │  │ Category: Strength · Difficulty: Beginner                               ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 🏋️ Split <mark>Squats</mark>                                             ││  │
│  │  │ Single-leg exercise for balance and strength                            ││  │
│  │  │ Category: Strength · Difficulty: Intermediate                           ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 🏋️ Jump <mark>Squats</mark>                                              ││  │
│  │  │ Explosive plyometric variation for power                                ││  │
│  │  │ Category: Plyometrics · Difficulty: Advanced                            ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ── VIDEOS (2 results) ───────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 🎬 Perfect <mark>Squat</mark> Form Tutorial                              ││  │
│  │  │ Learn proper squat mechanics to maximize gains and prevent injury       ││  │
│  │  │ Duration: 8:24 · Category: Technique                                    ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 🎬 <mark>Squat</mark> Variations for Flag Football                       ││  │
│  │  │ Position-specific squat training for speed and power                    ││  │
│  │  │ Duration: 12:15 · Category: Training                                    ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ── PROGRAMS (1 result) ──────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 📋 Lower Body Strength (includes <mark>Squats</mark>)                    ││  │
│  │  │ 4-week program focused on leg strength and explosiveness                ││  │
│  │  │ Duration: 4 weeks · Level: Intermediate                                 ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ── PLAYERS (Coach only) ─────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ No players matching "squats"                                            ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ── HELP & ARTICLES (1 result) ───────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 📄 How <mark>Squats</mark> Improve Your Sprint Speed                     ││  │
│  │  │ The science behind squat strength and athletic performance              ││  │
│  │  │ Category: Training Science                                              ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│  │
│  │  │        ↑ ↓ to navigate  ⏎ to select  esc to close                       ││  │
│  │  └──────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Search Categories

| Category  | Icon | Who Can Search | What's Indexed                              |
| --------- | ---- | -------------- | ------------------------------------------- |
| Exercises | 🏋️   | All            | Name, description, muscle groups, equipment |
| Videos    | 🎬   | All            | Title, description, category                |
| Programs  | 📋   | All            | Name, description, exercises included       |
| Players   | 👤   | Coaches only   | Name, position, jersey number               |
| Articles  | 📄   | All            | Title, content, tags                        |

---

## Search Features

| Feature             | Behavior                                      |
| ------------------- | --------------------------------------------- |
| Debounced Input     | 300ms delay to prevent excessive API calls    |
| Instant Suggestions | 150ms for quick autocomplete                  |
| Result Highlighting | Matched text shown with `<mark>` tags         |
| Recent Searches     | Last 10 searches saved locally                |
| Keyboard Navigation | ↑↓ to navigate, Enter to select, Esc to close |

---

## Search Caching

```typescript
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute TTL
const MAX_CACHE_SIZE = 50; // Max cached queries

function search(query: string) {
  const cacheKey = query.toLowerCase().trim();
  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.results;
  }

  // Otherwise fetch from API...
}
```

---

## Relevance Scoring

```typescript
function calculateRelevance(result: SearchResult, query: string): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  const titleLower = result.title.toLowerCase();

  // Exact match in title: highest score
  if (titleLower === queryLower) score += 100;
  // Title starts with query
  else if (titleLower.startsWith(queryLower)) score += 75;
  // Title contains query
  else if (titleLower.includes(queryLower)) score += 50;
  // Description contains query
  else if (result.description?.toLowerCase().includes(queryLower)) score += 25;

  return score;
}
```

---

## Empty & No Results States

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ── EMPTY STATE (before typing) ────────────────────────────────────────────────── │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐│
│  │                         🔍                                                     ││
│  │                   Start typing to search                                       ││
│  │                                                                                ││
│  │     Try searching for: exercises, videos, training programs                   ││
│  └────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ── NO RESULTS STATE ───────────────────────────────────────────────────────────── │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐│
│  │                         🔍                                                     ││
│  │             No results found for "xyz123"                                      ││
│  │                                                                                ││
│  │     Suggestions:                                                              ││
│  │     • Check your spelling                                                     ││
│  │     • Try different keywords                                                  ││
│  │     • Use more general terms                                                  ││
│  └────────────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features to Implement

| Feature                | Status | Priority |
| ---------------------- | ------ | -------- |
| Search Panel           | ❌     | HIGH     |
| Keyboard Shortcut (⌘K) | ❌     | HIGH     |
| Real-time Results      | ❌     | HIGH     |
| Category Filtering     | ❌     | MEDIUM   |
| Recent Searches        | ❌     | MEDIUM   |
| Quick Links            | ❌     | LOW      |
| Result Highlighting    | ❌     | MEDIUM   |
| Keyboard Navigation    | ❌     | MEDIUM   |
| Search Caching         | ❌     | LOW      |
| Player Search (Coach)  | ❌     | LOW      |

---

## Data Sources

| Data      | Service         | Table/API               |
| --------- | --------------- | ----------------------- |
| Exercises | `SearchService` | `exercises`             |
| Videos    | `SearchService` | `training_videos`       |
| Programs  | `SearchService` | `training_programs`     |
| Players   | `SearchService` | `profiles` (coach only) |
| Articles  | `SearchService` | `help_articles`         |

---

## Related Components

| Component     | Location                   | Relationship                 |
| ------------- | -------------------------- | ---------------------------- |
| Header        | `shared/components/header` | Contains search icon trigger |
| SearchService | `core/services`            | Handles API calls            |
