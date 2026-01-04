# Wireframe: Exercise Library

**Route:** `/exercise-library`  
**Users:** All Users (Players, Coaches)  
**Status:** ✅ Fully Implemented  
**Source:** `angular/src/app/features/exercise-library/exercise-library.component.ts`

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📚 EXERCISE LIBRARY                                                            │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Browse and discover 245 evidence-based         ┌───────────┐ ┌───────────┐   │  │
│  │  exercises for your training program            │    245    │ │     8     │   │  │
│  │                                                 │ Exercises │ │Categories │   │  │
│  │                                                 └───────────┘ └───────────┘   │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🔍 Search exercises...                                                         │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ CATEGORIES                                                                     │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │ 🏃 All      │  │ 💪 Strength │  │ ⚡ Speed    │  │ 🔄 Agility  │           │  │
│  │  │  [SELECTED] │  │             │  │             │  │             │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  │                                                                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │ 🏈 Flag FB  │  │ 🧘 Mobility │  │ 💚 Recovery │  │ 🔥 Warmup   │           │  │
│  │  │             │  │             │  │             │  │             │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                  EXERCISES GRID                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  ┌─────────────────┐
│  │ 🏋️ BARBELL BACK SQUAT       │  │ 🏃 BOX JUMPS                │  │ 🔄 PRO AGILITY  │
│  │ ─────────────────────────── │  │ ─────────────────────────── │  │ ───────────────│
│  │                             │  │                             │  │                 │
│  │ Category: Strength          │  │ Category: Speed             │  │ Category: Agil  │
│  │ Difficulty: Intermediate    │  │ Difficulty: Intermediate    │  │ Difficulty: Adv │
│  │                             │  │                             │  │                 │
│  │ Muscle Groups:              │  │ Muscle Groups:              │  │ Muscle Groups:  │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ │  │ ┌──────┐ ┌──────┐ ┌──────┐ │  │ ┌──────┐ ┌────┐│
│  │ │Quads │ │Glutes│ │Core  │ │  │ │Quads │ │Calves│ │Glutes│ │  │ │ Legs │ │Core││
│  │ └──────┘ └──────┘ └──────┘ │  │ └──────┘ └──────┘ └──────┘ │  │ └──────┘ └────┘│
│  │                             │  │                             │  │                 │
│  │ Equipment:                  │  │ Equipment:                  │  │ Equipment:      │
│  │ ┌────────┐ ┌─────────────┐ │  │ ┌──────┐                    │  │ ┌───────┐      │
│  │ │Barbell │ │Squat Rack   │ │  │ │ Box  │                    │  │ │ Cones │      │
│  │ └────────┘ └─────────────┘ │  │ └──────┘                    │  │ └───────┘      │
│  │                             │  │                             │  │                 │
│  │ Compound lower body lift    │  │ Explosive power for sprint  │  │ 5-10-5 shuttle  │
│  │ for leg strength...         │  │ acceleration and...         │  │ for direction...│
│  │                             │  │                             │  │                 │
│  │ [View Details]              │  │ [View Details]              │  │ [View Details]  │
│  └─────────────────────────────┘  └─────────────────────────────┘  └─────────────────┘
│                                                                                      │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  ┌─────────────────┐
│  │ 💪 RESISTANCE BAND PULLS    │  │ 🏈 ROUTE RUNNING DRILLS     │  │ 🧘 HIP FLEXOR   │
│  │ ─────────────────────────── │  │ ─────────────────────────── │  │    STRETCH      │
│  │                             │  │                             │  │ ───────────────│
│  │ Category: Strength          │  │ Category: Flag Football     │  │ Category: Mobil │
│  │ Difficulty: Beginner        │  │ Difficulty: Intermediate    │  │ Difficulty: Beg │
│  │                             │  │                             │  │                 │
│  │ ...                         │  │ ...                         │  │ ...             │
│  └─────────────────────────────┘  └─────────────────────────────┘  └─────────────────┘
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                             PAGINATION                                         │  │
│  │          ◀  1  2  3  4  5  ...  25  ▶       Showing 1-12 of 245               │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               EXERCISE DETAIL DIALOG                                 │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏋️ BARBELL BACK SQUAT                                                  [×]    │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Category: Strength          Difficulty: 🟡 Intermediate                      │  │
│  │                                                                                │  │
│  │  📝 DESCRIPTION                                                               │  │
│  │  ─────────────────────────────────────────────────────────────────────────────│  │
│  │  The barbell back squat is a compound lower body exercise that targets the    │  │
│  │  quadriceps, glutes, and core. It's essential for building leg strength and   │  │
│  │  power needed for explosive movements in flag football.                       │  │
│  │                                                                                │  │
│  │  💪 MUSCLE GROUPS                                                             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                         │  │
│  │  │  Quads   │ │  Glutes  │ │Hamstrings│ │   Core   │                         │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                         │  │
│  │                                                                                │  │
│  │  🔧 EQUIPMENT NEEDED                                                          │  │
│  │  ┌──────────┐ ┌──────────────┐                                               │  │
│  │  │ Barbell  │ │  Squat Rack  │                                               │  │
│  │  └──────────┘ └──────────────┘                                               │  │
│  │                                                                                │  │
│  │  📋 INSTRUCTIONS                                                              │  │
│  │  ─────────────────────────────────────────────────────────────────────────────│  │
│  │  1. Position barbell on upper back, feet shoulder-width apart                │  │
│  │  2. Brace core and descend by pushing hips back and bending knees            │  │
│  │  3. Lower until thighs are parallel to floor                                  │  │
│  │  4. Drive through heels to stand back up                                      │  │
│  │  5. Repeat for prescribed reps                                                │  │
│  │                                                                                │  │
│  │  ⚠️ COMMON MISTAKES                                                           │  │
│  │  • Knees caving inward                                                        │  │
│  │  • Rounding lower back                                                        │  │
│  │  • Heels lifting off ground                                                   │  │
│  │                                                                                │  │
│  │                                [Add to Workout]  [Close]                      │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Categories

| Category | Icon | Description |
|----------|------|-------------|
| All | 🏃 | All exercises |
| Strength | 💪 | Weight training, resistance |
| Speed | ⚡ | Sprint, acceleration |
| Agility | 🔄 | Direction change, footwork |
| Flag Football | 🏈 | Position-specific drills |
| Mobility | 🧘 | Flexibility, stretching |
| Recovery | 💚 | Foam rolling, stretching |
| Warmup | 🔥 | Dynamic warmup exercises |

---

## Difficulty Levels

| Level | Color |
|-------|-------|
| Beginner | 🟢 Green |
| Intermediate | 🟡 Yellow |
| Advanced | 🔴 Red |

---

## Exercise Card Data

| Field | Description |
|-------|-------------|
| Name | Exercise name |
| Category | One of the 8 categories |
| Difficulty | Beginner/Intermediate/Advanced |
| Muscle Groups | Tags (array) |
| Equipment | Tags (array) |
| Description | Short text |

---

## Features Implemented

| Feature | Status |
|---------|--------|
| Exercise count header | ✅ |
| Category count header | ✅ |
| Search input | ✅ |
| Category filter buttons | ✅ |
| Exercise cards grid | ✅ |
| Difficulty tags | ✅ |
| Muscle group tags | ✅ |
| Equipment tags | ✅ |
| Pagination | ✅ |
| Exercise detail dialog | ✅ |
| Add to workout button | ✅ |
| Responsive grid | ✅ |

---

## Data Sources

| Data | Service | Source |
|------|---------|--------|
| Exercises | `ApiService` | `exercises` table or ExerciseDB API |
| Workouts | `UnifiedTrainingService` | For "Add to Workout" |
