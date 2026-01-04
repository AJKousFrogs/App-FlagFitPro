# Wireframe: Knowledge Base

**Route:** `/coach/knowledge`  
**Users:** Head Coach, Assistant Coach, Players  
**Status:** ⚠️ Needs Implementation  
**Source:** `FEATURE_DOCUMENTATION.md` §34

---

## Purpose

Centralized repository of coaching resources, articles, drills, and flag football knowledge that can be searched, organized, and shared with the team.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  📚 Knowledge Base                                         [+ Add Resource]    │  │
│  │     Coaching resources and team knowledge                                     │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🔍 Search knowledge base...                                                   │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  [All]  [Drills]  [Articles]  [Videos]  [Rules]  [Position Guides]  [Saved]   │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               FEATURED RESOURCES                                     │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐     │  │
│  │  │ 📖 Red Zone Offense Concepts    │  │ 🎥 Rusher Technique Breakdown   │     │  │
│  │  │ ─────────────────────────────   │  │ ─────────────────────────────   │     │  │
│  │  │ Category: Tactics               │  │ Category: Video Guide           │     │  │
│  │  │ ⭐ Staff Pick                   │  │ 📺 12 min                        │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  │ Master red zone situations      │  │ Elite pass rush moves and       │     │  │
│  │  │ with these proven concepts.     │  │ techniques for flag football.   │     │  │
│  │  │                                 │  │                                 │     │  │
│  │  │ [Read →]              [⭐] [📤] │  │ [Watch →]             [⭐] [📤] │     │  │
│  │  └─────────────────────────────────┘  └─────────────────────────────────┘     │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                   CATEGORIES                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐│  │
│  │  │ 🏃 Drills       │ │ 📖 Tactics      │ │ 💪 Conditioning │ │ 🏥 Injury     ││  │
│  │  │ ─────────────   │ │ ─────────────   │ │ ─────────────   │ │ Prevention    ││  │
│  │  │ 48 resources    │ │ 32 resources    │ │ 24 resources    │ │ 18 resources  ││  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────┘│  │
│  │                                                                                │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐│  │
│  │  │ 📋 Rules        │ │ 🎯 Position     │ │ 🧠 Mental Game  │ │ 🍎 Nutrition  ││  │
│  │  │ ─────────────   │ │ Guides          │ │ ─────────────   │ │ ───────────── │ │ │
│  │  │ 12 resources    │ │ 15 resources    │ │ 8 resources     │ │ 14 resources  ││  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               RECENT ADDITIONS                                       │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 📖 Pre-Game Warm-Up Routine for Flag Football                          │  │  │
│  │  │ Added 2 days ago • Category: Conditioning • 5 min read                  │  │  │
│  │  │ "Optimal warm-up sequence to prepare athletes for game intensity..."    │  │  │
│  │  │                                                      [Read →] [⭐] [📤] │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🏃 5 Agility Drills for DBs                                             │  │  │
│  │  │ Added 4 days ago • Category: Drills • Includes videos                   │  │  │
│  │  │ "Essential backpedal and break drills for defensive backs..."           │  │  │
│  │  │                                                      [Read →] [⭐] [📤] │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 📋 2026 Flag Football Rule Changes Summary                              │  │  │
│  │  │ Added 1 week ago • Category: Rules • Official                           │  │  │
│  │  │ "Key rule changes for the 2026 season including new OT format..."       │  │  │
│  │  │                                                      [Read →] [⭐] [📤] │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │                                                         [View All →]          │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               TEAM RESOURCES                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Created by your team                                   [+ Add Team Resource]  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 📝 Panthers Playbook Terminology                      Coach-created     │  │  │
│  │  │ Our team's specific terminology and signals explained.                  │  │  │
│  │  │ Created by: Coach Mike • Last updated: 3 days ago                       │  │  │
│  │  │                                           [View] [Edit] [Share to Team] │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 📝 Post-Practice Recovery Protocol                    Coach-created     │  │  │
│  │  │ Team-specific recovery routine after training sessions.                 │  │  │
│  │  │ Created by: Coach Sarah • Last updated: 1 week ago                      │  │  │
│  │  │                                           [View] [Edit] [Share to Team] │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Article View

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [← Knowledge Base]  Red Zone Offense Concepts                    [⭐] [📤] [🖨️]   │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  📖 Red Zone Offense Concepts                                                 │  │
│  │  ─────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Category: Tactics • 8 min read • ⭐ Staff Pick                               │  │
│  │  Last updated: Dec 15, 2025                                                   │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ## Introduction                                                              │  │
│  │                                                                                │  │
│  │  Red zone offense is critical in flag football. With condensed field space,  │  │
│  │  traditional passing concepts must be adapted for the unique challenges of   │  │
│  │  scoring from inside the 10-yard line.                                        │  │
│  │                                                                                │  │
│  │  ## Key Concepts                                                              │  │
│  │                                                                                │  │
│  │  ### 1. Fade Routes                                                           │  │
│  │  The back-shoulder fade is highly effective against man coverage...          │  │
│  │                                                                                │  │
│  │  [DIAGRAM: Fade route illustration]                                           │  │
│  │                                                                                │  │
│  │  ### 2. Pick Plays (Legal)                                                    │  │
│  │  Creating natural rubs and picks within the rules...                          │  │
│  │                                                                                │  │
│  │  ### 3. Quick Slants with Motion                                              │  │
│  │  Using pre-snap motion to create advantageous matchups...                     │  │
│  │                                                                                │  │
│  │  ## Drills to Practice                                                        │  │
│  │                                                                                │  │
│  │  1. Red zone timing drill (linked below)                                      │  │
│  │  2. Back-shoulder catch practice                                              │  │
│  │  3. Compressed field 5v5                                                      │  │
│  │                                                                                │  │
│  │  ## Related Resources                                                         │  │
│  │                                                                                │  │
│  │  • [🏃 Red Zone Timing Drill]                                                 │  │
│  │  • [🎥 Back-Shoulder Fade Tutorial]                                           │  │
│  │  • [📖 Goal Line Defensive Coverages]                                         │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  💡 Share with team?                         [Share to All]  [Select Players] │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Add Resource Dialog

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 📚 ADD RESOURCE                                                            [×]    │
│ ──────────────────────────────────────────────────────────────────────────────────│
│                                                                                    │
│  Resource Type                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ (●) Article / Document                                                     │   │
│  │ ( ) External Link                                                          │   │
│  │ ( ) Video (YouTube/Vimeo)                                                  │   │
│  │ ( ) File Upload (PDF)                                                      │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  Title                                                                            │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Panthers Playbook Terminology                                              │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  Category                                                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ Tactics ▼                                                                  │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  Content (Markdown supported)                                                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ ## Our Terminology                                                         │   │
│  │                                                                            │   │
│  │ ### Formations                                                             │   │
│  │ - **Trips**: Three receivers on one side                                  │   │
│  │ - **Stack**: Receivers aligned vertically                                 │   │
│  │ ...                                                                        │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  Visibility                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ ( ) Team only (Panthers members)                                           │   │
│  │ (●) Coaches only                                                           │   │
│  │ ( ) Public (all users)                                                     │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  Tags (comma separated)                                                           │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ playbook, terminology, signals                                             │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│                                              [Cancel]  [Save Resource]           │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---------|-------------|
| Search | Full-text search across resources |
| Categories | Browse by topic |
| Resource Types | Articles, videos, links, PDFs |
| Team Resources | Coach-created content |
| Favorites | Save for quick access |
| Sharing | Share to team or individuals |
| Related Content | Linked resources |
| Staff Picks | Featured content |

---

## Resource Categories

| Category | Content Types |
|----------|---------------|
| Drills | Practice exercises |
| Tactics | Offensive/defensive concepts |
| Conditioning | Fitness, warm-ups |
| Rules | Official rules, updates |
| Position Guides | Role-specific info |
| Injury Prevention | Prehab, safety |
| Mental Game | Psychology, focus |
| Nutrition | Diet, hydration |

---

## Data Sources

| Data | Service | Table |
|------|---------|-------|
| Resources | `KnowledgeService` | `knowledge_resources` |
| Categories | `KnowledgeService` | `resource_categories` |
| Favorites | `KnowledgeService` | `user_favorites` |
| Team content | `KnowledgeService` | `team_resources` |
