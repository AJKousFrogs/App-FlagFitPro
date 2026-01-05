# Wireframe: Tournament Nutrition

**Route:** `/game/nutrition`  
**Users:** Players (during tournament days)  
**Status:** ✅ Fully Implemented  
**Source:** `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.ts`

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  💚 Tournament Nutrition                                  ┌──────────────────┐│  │
│  │     Fuel your performance across all games                │ Edit Schedule    ││  │
│  │                                                           └──────────────────┘│  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏆 TOURNAMENT OVERVIEW BANNER                                                  │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  🏆  Regional Championship                     ┌───────────┐ ┌───────────┐    │  │
│  │      4 Games · 9:00 AM - 5:00 PM               │  2,450ml  │ │   3/7     │    │  │
│  │                                                │ Hydration │ │ Nutrition │    │  │
│  │                                                │   Today   │ │  Windows  │    │  │
│  │                                                └───────────┘ └───────────┘    │  │
│  │                                                                                │  │
│  │                                                ┌───────────────┐               │  │
│  │                                                │   45 min      │               │  │
│  │                                                │  Next Game    │               │  │
│  │                                                └───────────────┘               │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 💧 QUICK HYDRATION LOG                              72% ▓▓▓▓▓▓▓▓░░░ / 3500ml │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐│  │
│  │  │  💧 Water       │  │  ⚡ Electrolyte │  │  🍊 Sports      │  │  🥛 Protein ││
│  │  │    250ml        │  │    350ml        │  │    500ml        │  │  Shake     ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📅 GAME SCHEDULE EDITOR (Collapsible)                                         │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Game 1:  ┌──────────┐  Opponent: ┌──────────────┐  ☐ Referee duty           │  │
│  │           │  09:00   │            │ Team Alpha   │                           │  │
│  │           └──────────┘            └──────────────┘                           │  │
│  │                                                                                │  │
│  │  Game 2:  ┌──────────┐  Opponent: ┌──────────────┐  ☐ Referee duty           │  │
│  │           │  11:30   │            │ Team Beta    │                           │  │
│  │           └──────────┘            └──────────────┘                           │  │
│  │                                                                                │  │
│  │  Game 3:  ┌──────────┐  Opponent: ┌──────────────┐  ☑ Referee duty (before)  │  │
│  │           │  14:00   │            │ Team Gamma   │                           │  │
│  │           └──────────┘            └──────────────┘                           │  │
│  │                                                                                │  │
│  │                           [+ Add Game]   [Generate Nutrition Windows]         │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                          NUTRITION WINDOWS (Auto-generated)                          │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ☀️ MORNING FUELING                         07:00 - 08:00       🟢 CRITICAL    │  │
│  │    Pre-Tournament Breakfast                                                   │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  🍽️ FOOD:                                                                      │  │
│  │  • Oatmeal with banana (300g) - Slow-release carbs for sustained energy      │  │
│  │  • Eggs (2) - Protein for muscle support                                      │  │
│  │  • Toast with honey - Quick energy top-up                                     │  │
│  │                                                                                │  │
│  │  🥤 DRINK:                                                                     │  │
│  │  • Water (500ml) - Start hydrated                                             │  │
│  │  • Orange juice (200ml) - Vitamin C and quick carbs                           │  │
│  │                                                                                │  │
│  │  💊 SUPPLEMENTS:                                                               │  │
│  │  • Electrolyte tablet - Pre-load sodium/potassium                             │  │
│  │                                                                                │  │
│  │  Hydration Target: 600ml       ☐ Mark Complete                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚡ PRE-GAME 1                               07:45 - 08:30       🟡 HIGH       │  │
│  │    60-90 min before Game vs Team Alpha                                        │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  🍽️ FOOD:                                                                      │  │
│  │  • Banana - Fast energy, potassium for cramp prevention                       │  │
│  │  • Energy bar (small) - Portable carbs                                        │  │
│  │                                                                                │  │
│  │  🥤 DRINK:                                                                     │  │
│  │  • Water (250ml) - Stay hydrated                                              │  │
│  │  • Sports drink (150ml) - Electrolytes                                        │  │
│  │                                                                                │  │
│  │  Hydration Target: 400ml       ☐ Mark Complete                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⏱️ HALFTIME - GAME 1                       ~09:20               🔵 MEDIUM    │  │
│  │    10-15 min window                                                           │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  🥤 Quick sips of water/electrolyte                                            │  │
│  │  🍌 2-3 bites of banana or orange slices if energy dropping                   │  │
│  │  ❌ No heavy food - digestion diverts blood from muscles                       │  │
│  │                                                                                │  │
│  │  Hydration Target: 200ml                                                      │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🔄 POST-GAME 1 / BETWEEN GAMES              09:45 - 10:30       🟡 HIGH       │  │
│  │    Recovery window before Game 2                                              │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  🍽️ FOOD:                                                                      │  │
│  │  • Rice cake with peanut butter - Carbs + protein                             │  │
│  │  • Fruit (apple/grapes) - Quick carbs, hydration                              │  │
│  │                                                                                │  │
│  │  🥤 DRINK:                                                                     │  │
│  │  • Water (500ml) - Replace sweat losses                                       │  │
│  │  • Chocolate milk (250ml) - Optimal recovery ratio 4:1 carb:protein           │  │
│  │                                                                                │  │
│  │  Hydration Target: 750ml       ☐ Mark Complete                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🦺 REFEREE DUTY                             12:00 - 13:00       🔵 MEDIUM    │  │
│  │    Modified fueling during officiating                                        │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ⚠️ Keep snacks accessible - you're moving but can't eat freely               │  │
│  │  • Sip electrolytes between quarters                                          │  │
│  │  • Quick banana at halftime                                                   │  │
│  │  • Stay in shade when possible                                                │  │
│  │                                                                                │  │
│  │  Hydration Target: 400ml                                                      │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🔥 CRAMP PREVENTION PROTOCOL                                                   │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  Electrolyte Loading Schedule:                                                │  │
│  │  • Pre-tournament (night before): 1 electrolyte tablet with dinner            │  │
│  │  • Morning: 1 tablet with breakfast                                           │  │
│  │  • Between each game: Electrolyte drink                                       │  │
│  │  • If cramping starts: Pickle juice / mustard packet (sodium spike)           │  │
│  │                                                                                │  │
│  │  Sodium/Potassium Balance:                                                    │  │
│  │  • Add salt to morning meal                                                   │  │
│  │  • Bananas for potassium                                                      │  │
│  │  • Avoid caffeine excess (diuretic)                                           │  │
│  │                                                                                │  │
│  │  ⚠️ Warning Signs: Muscle twitches, stiffness, visible cramping               │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📊 HYDRATION HISTORY                                                           │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  07:15  │ 💧 Water           │ 500ml                                          │  │
│  │  08:30  │ ⚡ Electrolyte      │ 350ml                                          │  │
│  │  09:45  │ 💧 Water           │ 500ml                                          │  │
│  │  10:30  │ 🥛 Chocolate Milk  │ 250ml                                          │  │
│  │  11:45  │ ⚡ Electrolyte      │ 350ml                                          │  │
│  │                                                                                │  │
│  │  Today's Total: 2,450ml / 3,500ml (70%)                                       │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Nutrition Window Types

| Type          | Timing             | Priority | Purpose               |
| ------------- | ------------------ | -------- | --------------------- |
| Morning       | Pre-tournament     | Critical | Breakfast, pre-load   |
| Pre-game      | 60-90 min before   | High     | Energy loading        |
| Halftime      | 10-15 min          | Medium   | Quick sips/bites only |
| Post-game     | 30 min after       | High     | Recovery              |
| Between-games | Variable           | High     | Recovery + refuel     |
| Referee-duty  | During officiating | Medium   | Modified fueling      |

---

## Hydration Calculator Business Logic

```typescript
function calculateDailyHydrationTarget(
  athleteWeight: number, // kg
  numberOfGames: number,
  temperature: number, // °C
  humidity: number, // %
): number {
  // Base: 35ml per kg body weight
  let baseHydration = athleteWeight * 35;

  // Add 500ml per game
  baseHydration += numberOfGames * 500;

  // Temperature adjustment
  if (temperature > 25) {
    baseHydration += (temperature - 25) * 50;
  }

  // Humidity adjustment
  if (humidity > 60) {
    baseHydration += (humidity - 60) * 10;
  }

  return Math.round(baseHydration);
}

// Example: 80kg athlete, 4 games, 30°C, 70% humidity
// Base: 80 × 35 = 2,800ml
// Games: + 4 × 500 = 2,000ml
// Heat: + 5 × 50 = 250ml
// Humidity: + 10 × 10 = 100ml
// Total: 5,150ml
```

---

## Features Implemented

| Feature                          | Status |
| -------------------------------- | ------ |
| Tournament overview banner       | ✅     |
| Game schedule editor             | ✅     |
| Add/edit game times              | ✅     |
| Referee duty toggle              | ✅     |
| Auto-generate nutrition windows  | ✅     |
| Quick hydration logger (one-tap) | ✅     |
| Hydration progress bar           | ✅     |
| Morning window                   | ✅     |
| Pre-game window                  | ✅     |
| Halftime window                  | ✅     |
| Post-game window                 | ✅     |
| Between-games window             | ✅     |
| Referee-duty window              | ✅     |
| Food recommendations             | ✅     |
| Drink recommendations            | ✅     |
| Supplement timing                | ✅     |
| Per-window hydration target      | ✅     |
| Mark window complete             | ✅     |
| Cramp prevention protocol        | ✅     |
| Hydration history log            | ✅     |
| Daily target calculation         | ✅     |
| Next game countdown              | ✅     |

---

## Data Sources

| Data              | Service            | Method                    |
| ----------------- | ------------------ | ------------------------- |
| Hydration log     | `NutritionService` | Local state / Supabase    |
| Nutrition windows | Generated          | Based on game schedule    |
| Daily target      | Calculated         | From weight/games/weather |
