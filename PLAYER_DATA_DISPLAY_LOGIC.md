# Player Data Display Logic - Comprehensive Guide

## Overview

This document provides comprehensive guidelines for displaying player data consistently across the entire application. It covers data fetching, filtering, calculation, formatting, and presentation rules to ensure a unified user experience.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Data Architecture](#data-architecture)
3. [Date Filtering Logic](#date-filtering-logic)
4. [Calculation Formulas](#calculation-formulas)
5. [Display Formatting Rules](#display-formatting-rules)
6. [UI Component Display Logic](#ui-component-display-logic)
7. [Consistency Checks](#consistency-checks)
8. [Error Handling & Edge Cases](#error-handling--edge-cases)
9. [Best Practices](#best-practices)
10. [Migration & Testing](#migration--testing)

---

## Core Principles

### 1. Single Source of Truth
- **All player statistics** originate from the database (`game_events` table)
- **Centralized backend endpoint**: `/.netlify/functions/player-stats`
- **No client-side aggregation** for production data
- **Database views** provide pre-aggregated stats for performance

### 2. Date Consistency
- **Always filter to "up to and including today"** by default
- **Never show future games** in statistics
- **Use consistent date boundaries**: `23:59:59.999` for end-of-day
- **Timezone handling**: All dates stored and compared in UTC

### 3. Calculation Consistency
- **Same formulas** used across backend, frontend, and database
- **Rounding rules** standardized (percentages: 1 decimal, averages: 2 decimals)
- **Division by zero** handled gracefully (returns 0, not NaN or Infinity)
- **Banker's rounding** for percentages

### 4. Display Consistency
- **Same numbers** shown across all pages (Analytics, Performance, Game Tracker, Roster)
- **Consistent formatting** (decimals, units, labels)
- **Unified empty states** when no data exists
- **Loading states** standardized

---

## Data Architecture

### Backend Layer

#### Centralized API Endpoint
**File**: `netlify/functions/player-stats.cjs`

**Endpoints**:
- `GET /aggregated` - Get all stats up to and including today
- `GET /date-range?startDate=X&endDate=Y` - Get stats for specific date range

**Query Parameters**:
- `playerId` (required) - Player identifier
- `season` (optional) - Filter by season (e.g., "2025")
- `teamId` (optional) - Filter by team
- `startDate` (optional) - ISO 8601 format (YYYY-MM-DD)
- `endDate` (optional) - ISO 8601 format (YYYY-MM-DD)

**Response Structure**:
```javascript
{
  gamesPlayed: number,
  totalGames: number,
  passAttempts: number,
  completions: number,
  passingYards: number,
  touchdowns: number,
  interceptions: number,
  completionPercentage: number,  // 1 decimal place
  avgYardsPerAttempt: number,    // 2 decimal places
  targets: number,
  receptions: number,
  receivingYards: number,
  drops: number,
  dropRate: number,              // 1 decimal place
  rushingAttempts: number,
  rushingYards: number,
  yardsPerCarry: number,         // 2 decimal places
  flagPullAttempts: number,
  flagPulls: number,
  flagPullSuccessRate: number,   // 1 decimal place
  totalPlays: number,
  totalYards: number
}
```

#### Database Layer

**View**: `player_stats_aggregated`
- Materialized view of all player stats up to today
- Automatically filters by date: `game_date <= CURRENT_DATE`
- Updated via database triggers or scheduled refresh

**Function**: `get_player_aggregated_stats(player_id, season, team_id)`
- SQL function for consistent aggregation
- Returns same structure as API endpoint
- Used for direct database queries

### Frontend Layer

#### Service: `GameStatsService`
**File**: `src/js/services/gameStatsService.js`

**Methods**:
- `getPlayerStats(playerId, options)` - Get aggregated stats (uses backend by default)
- `getPlayerStatsByDateRange(playerId, startDate, endDate)` - Get stats for date range
- `getPlayerGameStats(playerId, gameId)` - Get stats for specific game
- `getAllGames(options)` - Get all games (filtered to today by default)

**Fallback Strategy**:
1. Try backend API first
2. Fall back to localStorage if backend unavailable
3. Fall back to local calculation if no stored data

#### Service: `PlayerStatisticsService` (Angular)
**File**: `angular/src/app/core/services/player-statistics.service.ts`

**Methods**:
- `getPlayerGameStats(playerId, gameId)` - Observable for game-specific stats
- `getPlayerStats(playerId)` - Observable for aggregated stats
- `aggregateGameStats(games)` - Aggregates stats from multiple games

---

## Date Filtering Logic

### Standard Date Filter Pattern

All queries use the same date filtering pattern:

```javascript
// Get today at end of day (23:59:59.999)
const todayEndOfDay = new Date();
todayEndOfDay.setHours(23, 59, 59, 999);

// Filter games/events up to and including today
.lte("game_date", todayEndOfDay.toISOString())
```

### Date Filtering Rules

1. **Default Behavior**: Always filter to "up to and including today"
   - On Sunday, December 14, 2025, shows all data up to and including that date
   - Future games/events are never included in statistics

2. **Date Range Queries**: When querying specific ranges
   ```javascript
   // Start date: beginning of day (00:00:00.000)
   const startDate = new Date('2025-12-01');
   startDate.setHours(0, 0, 0, 0);
   
   // End date: end of day (23:59:59.999)
   const endDate = new Date('2025-12-14');
   endDate.setHours(23, 59, 59, 999);
   ```

3. **Game Date Validation**: Before returning stats for a game
   ```javascript
   // Verify game is not in the future
   const { data: game } = await supabaseAdmin
     .from("games")
     .select("game_id, game_date")
     .eq("game_id", gameId)
     .lte("game_date", todayEndOfDay.toISOString())
     .single();
   
   if (!game) {
     throw new Error("Game not found or is in the future");
   }
   ```

4. **Timezone Considerations**:
   - All dates stored in UTC
   - Client-side comparisons use local timezone
   - Backend always uses UTC for filtering

### Date Filtering Examples

**Example 1: Get All Stats (Default)**
```javascript
// Backend automatically filters to today
GET /.netlify/functions/player-stats/aggregated?playerId=PLAYER_ID

// Frontend service
const stats = await gameStatsService.getPlayerStats(playerId);
// Returns stats up to and including today
```

**Example 2: Get Stats for Date Range**
```javascript
// Backend with date range
GET /.netlify/functions/player-stats/date-range?playerId=PLAYER_ID&startDate=2025-12-01&endDate=2025-12-14

// Frontend service
const stats = await gameStatsService.getPlayerStatsByDateRange(
  playerId,
  new Date('2025-12-01'),
  new Date('2025-12-14')
);
```

**Example 3: Get Games List**
```javascript
// Backend filters to today by default
const games = await gameStatsService.getAllGames();
// Only includes games up to and including today
```

---

## Calculation Formulas

All calculations use consistent formulas across backend, frontend, and database.

### Passing Statistics

#### Completion Percentage
```
completion_percentage = (completions / pass_attempts) * 100
```
- **Rounding**: 1 decimal place using banker's rounding
- **Division by zero**: Returns 0 if `pass_attempts === 0`
- **Example**: `(15 / 20) * 100 = 75.0%`

#### Average Yards Per Attempt
```
avg_yards_per_attempt = passing_yards / pass_attempts
```
- **Rounding**: 2 decimal places
- **Division by zero**: Returns 0 if `pass_attempts === 0`
- **Example**: `250 / 20 = 12.50 yards`

### Receiving Statistics

#### Drop Rate
```
drop_rate = (drops / targets) * 100
```
- **Rounding**: 1 decimal place
- **Division by zero**: Returns 0 if `targets === 0`
- **Example**: `(2 / 15) * 100 = 13.3%`

#### Average Yards Per Reception
```
avg_yards_per_reception = receiving_yards / receptions
```
- **Rounding**: 2 decimal places
- **Division by zero**: Returns 0 if `receptions === 0`
- **Example**: `180 / 12 = 15.00 yards`

### Rushing Statistics

#### Yards Per Carry
```
yards_per_carry = rushing_yards / rushing_attempts
```
- **Rounding**: 2 decimal places
- **Division by zero**: Returns 0 if `rushing_attempts === 0`
- **Example**: `85 / 10 = 8.50 yards`

### Defensive Statistics

#### Flag Pull Success Rate
```
flag_pull_success_rate = (flag_pulls / flag_pull_attempts) * 100
```
- **Rounding**: 1 decimal place
- **Division by zero**: Returns 0 if `flag_pull_attempts === 0`
- **Example**: `(8 / 12) * 100 = 66.7%`

### Implementation Examples

#### Backend (JavaScript)
```javascript
if (stats.passAttempts > 0) {
  const completionPct = (stats.completions / stats.passAttempts) * 100;
  stats.completionPercentage = Number(
    (Math.round(completionPct * 10) / 10).toFixed(1)
  );
} else {
  stats.completionPercentage = 0;
}
```

#### Database (SQL)
```sql
CASE 
  WHEN pass_attempts > 0 THEN 
    ROUND((completions::numeric / pass_attempts::numeric) * 100, 1)
  ELSE 0
END as completion_percentage
```

#### Frontend (JavaScript)
```javascript
function calculateCompletionPercentage(completions, attempts) {
  if (attempts === 0) return 0;
  const percentage = (completions / attempts) * 100;
  return Number((Math.round(percentage * 10) / 10).toFixed(1));
}
```

---

## Display Formatting Rules

### Number Formatting

#### Percentages
- **Format**: `XX.X%` (1 decimal place)
- **Examples**: `75.0%`, `66.7%`, `0.0%`
- **Zero handling**: Show `0.0%` instead of `-` or empty

#### Averages (Yards Per Attempt, Yards Per Carry, etc.)
- **Format**: `XX.XX` (2 decimal places)
- **Examples**: `12.50`, `8.50`, `0.00`
- **Zero handling**: Show `0.00` instead of `-` or empty

#### Whole Numbers (Yards, Attempts, etc.)
- **Format**: Integer with thousand separators for large numbers
- **Examples**: `250`, `1,234`, `0`
- **Zero handling**: Show `0` instead of `-` or empty

### Stat Labels

#### Standard Labels
- **Completion %**: "Completion %" or "Comp %"
- **Avg Yds/Att**: "Avg Yds/Att" or "Yards/Attempt"
- **Drop Rate**: "Drop Rate" or "Drops %"
- **Yards/Carry**: "Yards/Carry" or "YPC"
- **Flag Pull %**: "Flag Pull %" or "Success Rate"

#### Position-Specific Labels
- **Quarterback**: Emphasize passing stats (Completion %, Avg Yds/Att)
- **Receiver**: Emphasize receiving stats (Receptions, Drop Rate, Avg Yds/Rec)
- **Running Back**: Emphasize rushing stats (Yards/Carry, Rushing Yards)
- **Defense**: Emphasize defensive stats (Flag Pull %, Interceptions)

### Empty State Display

#### No Data Available
```javascript
// Display "N/A" or "0" based on stat type
const displayValue = stats.passAttempts > 0 
  ? `${stats.completionPercentage}%` 
  : "N/A";
```

#### No Games Played
```javascript
// Show empty stats structure with zeros
if (stats.gamesPlayed === 0) {
  return {
    message: "No games played yet",
    stats: getEmptyStats() // All zeros
  };
}
```

### Loading States

#### Standard Loading Indicator
```javascript
if (loading) {
  return {
    display: "Loading...",
    showSpinner: true
  };
}
```

#### Skeleton Loading
```javascript
// Show skeleton placeholders while loading
<div class="stat-skeleton">
  <div class="skeleton-value"></div>
  <div class="skeleton-label"></div>
</div>
```

---

## UI Component Display Logic

### Player Card Component

**Location**: `src/js/pages/coach-page.js`, `roster.html`

**Display Rules**:
1. **Primary Stat**: Based on position
   - Quarterback: Completion %
   - Receiver: Receptions or Drop Rate
   - Running Back: Rushing Yards or Yards/Carry
   - Defense: Flag Pulls or Flag Pull %

2. **Secondary Stat**: Complementary to primary
   - Quarterback: Avg Yds/Att or Touchdowns
   - Receiver: Receiving Yards or Avg Yds/Rec
   - Running Back: Rushing Attempts or Touchdowns
   - Defense: Interceptions or Defended Passes

3. **Formatting**:
   ```javascript
   function getPlayerPrimaryStat(player) {
     const stats = player.stats;
     if (stats.completionPercentage !== undefined) {
       return {
         value: `${stats.completionPercentage}%`,
         label: "Completion %"
       };
     }
     // ... other position-specific logic
   }
   ```

### Stats Grid Component

**Location**: `angular/src/app/shared/components/stats-grid/stats-grid.component.ts`

**Display Rules**:
1. **Grid Layout**: 2 columns on mobile, 3-4 columns on desktop
2. **Stat Order**: 
   - Passing stats first (if applicable)
   - Receiving stats second (if applicable)
   - Rushing stats third (if applicable)
   - Defensive stats last (if applicable)

3. **Responsive Behavior**:
   ```typescript
   @media (max-width: 768px) {
     grid-template-columns: repeat(2, 1fr);
   }
   @media (min-width: 769px) {
     grid-template-columns: repeat(4, 1fr);
   }
   ```

### Progressive Stats Component

**Location**: `angular/src/app/shared/components/progressive-stats/progressive-stats.component.ts`

**Display Rules**:
1. **Trend Indicators**: Show up/down arrows for changes
2. **Comparison Period**: Compare current period vs previous period
3. **Color Coding**:
   - Green: Improvement (higher is better)
   - Red: Decline (higher is better) or Improvement (lower is better)
   - Gray: No change

### Roster Page

**Location**: `roster.html`, `angular/src/app/features/roster/roster.component.ts`

**Display Rules**:
1. **Group by Position**: Display players grouped by position
2. **Show Key Stats**: Display 2-3 most relevant stats per position
3. **Starter Badge**: Highlight primary players
4. **Empty States**: Show "No stats available" if player has no games

### Analytics Page

**Location**: `angular/src/app/features/analytics/analytics.component.ts`

**Display Rules**:
1. **Date Range Selection**: Allow users to select custom date ranges
2. **Aggregation**: Show totals, averages, and trends
3. **Charts**: Display visualizations for key metrics
4. **Comparison**: Compare players or time periods

### Performance Tracking Page

**Location**: `angular/src/app/features/performance-tracking/performance-tracking.component.ts`

**Display Rules**:
1. **Game-by-Game View**: Show stats for each game individually
2. **Progressive Totals**: Show running totals as games progress
3. **Highlights**: Highlight best/worst performances
4. **Trends**: Show performance trends over time

---

## Consistency Checks

### Cross-Page Validation

All pages displaying player stats must show identical numbers:

1. **Analytics Page** ↔ **Performance Page** ↔ **Game Tracker** ↔ **Roster**
2. **Player Profile** ↔ **Team Stats** ↔ **Game Details**

### Validation Rules

#### Rule 1: Same Data Source
```javascript
// ✅ CORRECT: Use centralized endpoint
const stats = await gameStatsService.getPlayerStats(playerId);

// ❌ WRONG: Calculate locally without backend
const stats = calculateStatsLocally(games);
```

#### Rule 2: Same Date Filter
```javascript
// ✅ CORRECT: Filter to today
const todayEndOfDay = new Date();
todayEndOfDay.setHours(23, 59, 59, 999);
.lte("game_date", todayEndOfDay.toISOString())

// ❌ WRONG: Include future games
.select("*") // No date filter
```

#### Rule 3: Same Calculation Formula
```javascript
// ✅ CORRECT: Use standardized formula
const completionPct = (completions / attempts) * 100;
const rounded = Number((Math.round(completionPct * 10) / 10).toFixed(1));

// ❌ WRONG: Different rounding or formula
const completionPct = Math.round((completions / attempts) * 100);
```

### Automated Consistency Tests

```javascript
// Test that all pages show same stats
async function testConsistency(playerId) {
  const analyticsStats = await getAnalyticsStats(playerId);
  const performanceStats = await getPerformanceStats(playerId);
  const rosterStats = await getRosterStats(playerId);
  
  assert.equal(analyticsStats.completionPercentage, 
               performanceStats.completionPercentage);
  assert.equal(analyticsStats.completionPercentage, 
               rosterStats.completionPercentage);
  // ... test all stats
}
```

---

## Error Handling & Edge Cases

### Error Scenarios

#### 1. Backend Unavailable
```javascript
try {
  const stats = await gameStatsService.getPlayerStats(playerId);
} catch (error) {
  // Fallback to localStorage
  console.warn("Backend unavailable, using cached data");
  const stats = gameStatsService.getPlayerStats(playerId, { forceLocal: true });
}
```

#### 2. No Games Played
```javascript
if (stats.gamesPlayed === 0) {
  return {
    ...getEmptyStats(),
    message: "No games played yet"
  };
}
```

#### 3. Division by Zero
```javascript
// Always check before division
const completionPercentage = stats.passAttempts > 0
  ? (stats.completions / stats.passAttempts) * 100
  : 0;
```

#### 4. Invalid Date Range
```javascript
if (startDate > endDate) {
  throw new Error("Start date must be before end date");
}

if (endDate > new Date()) {
  console.warn("End date is in the future, capping to today");
  endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
}
```

#### 5. Missing Player Data
```javascript
if (!playerId || !playerId.trim()) {
  throw new Error("Player ID is required");
}

// Validate player exists
const player = await getPlayer(playerId);
if (!player) {
  return getEmptyStats(); // Return zeros instead of error
}
```

### Edge Cases

#### Case 1: Player Played in Multiple Positions
```javascript
// Aggregate all plays regardless of position
const allPlays = [
  ...primaryPlays,
  ...secondaryPlays
];
// Deduplicate by play ID
const uniquePlays = Array.from(
  new Map(allPlays.map(p => [p.id, p])).values()
);
```

#### Case 2: Game Date Changed After Stats Recorded
```javascript
// Always re-validate game date when fetching stats
const game = await getGame(gameId);
if (game.game_date > todayEndOfDay) {
  // Don't include in stats, but don't error
  return getEmptyStats();
}
```

#### Case 3: Partial Game Data
```javascript
// Handle games where player only played part of the game
if (stats.totalPlays === 0 && stats.gamesPlayed > 0) {
  // Player was present but had no plays
  return {
    ...stats,
    note: "Player was present but had no recorded plays"
  };
}
```

#### Case 4: Negative Values (Data Corruption)
```javascript
// Validate stats are non-negative
function validateStats(stats) {
  Object.keys(stats).forEach(key => {
    if (typeof stats[key] === 'number' && stats[key] < 0) {
      console.warn(`Negative value detected for ${key}, setting to 0`);
      stats[key] = 0;
    }
  });
  return stats;
}
```

---

## Best Practices

### 1. Always Use Centralized Endpoints

```javascript
// ✅ DO: Use centralized service
const stats = await gameStatsService.getPlayerStats(playerId);

// ❌ DON'T: Query database directly from frontend
const stats = await supabase
  .from("game_events")
  .select("*")
  .eq("player_id", playerId);
```

### 2. Always Filter by Date

```javascript
// ✅ DO: Always filter to today
const todayEndOfDay = new Date();
todayEndOfDay.setHours(23, 59, 59, 999);
.lte("game_date", todayEndOfDay.toISOString())

// ❌ DON'T: Return all games including future
.select("*")
```

### 3. Use Consistent Rounding

```javascript
// ✅ DO: Use standardized rounding functions
function roundPercentage(value) {
  return Number((Math.round(value * 10) / 10).toFixed(1));
}

function roundAverage(value) {
  return Number(value.toFixed(2));
}

// ❌ DON'T: Use inconsistent rounding
const pct = Math.round(value); // Wrong: no decimals
const avg = value.toFixed(3); // Wrong: 3 decimals instead of 2
```

### 4. Handle Empty States Gracefully

```javascript
// ✅ DO: Return structured empty state
if (stats.gamesPlayed === 0) {
  return {
    ...getEmptyStats(),
    message: "No games played yet"
  };
}

// ❌ DON'T: Return null or undefined
if (stats.gamesPlayed === 0) {
  return null; // Wrong: breaks UI
}
```

### 5. Validate Input Parameters

```javascript
// ✅ DO: Validate before processing
function getPlayerStats(playerId, options = {}) {
  if (!playerId || typeof playerId !== 'string') {
    throw new Error("Invalid player ID");
  }
  
  if (options.season && !/^\d{4}$/.test(options.season)) {
    throw new Error("Invalid season format (expected YYYY)");
  }
  
  // ... rest of function
}

// ❌ DON'T: Assume inputs are valid
function getPlayerStats(playerId) {
  // No validation - can break with invalid input
  return queryDatabase(playerId);
}
```

### 6. Cache Strategically

```javascript
// ✅ DO: Cache with TTL and invalidation
const cacheKey = `player-stats-${playerId}`;
const cached = cache.get(cacheKey);
if (cached && !isExpired(cached)) {
  return cached.data;
}

const stats = await fetchStats(playerId);
cache.set(cacheKey, { data: stats, timestamp: Date.now() }, { ttl: 300 });

// ❌ DON'T: Cache indefinitely
const stats = cache.get(cacheKey) || await fetchStats(playerId);
cache.set(cacheKey, stats); // Wrong: never expires
```

### 7. Log Important Operations

```javascript
// ✅ DO: Log for debugging and monitoring
console.log(`Fetching stats for player ${playerId}`, {
  season: options.season,
  teamId: options.teamId,
  timestamp: new Date().toISOString()
});

// ❌ DON'T: Log sensitive data
console.log(`Player stats:`, stats); // Wrong: may contain sensitive info
```

### 8. Use TypeScript Types (Angular)

```typescript
// ✅ DO: Define and use types
interface PlayerStats {
  gamesPlayed: number;
  completionPercentage: number;
  // ... other stats
}

function getPlayerStats(playerId: string): Promise<PlayerStats> {
  // ...
}

// ❌ DON'T: Use any types
function getPlayerStats(playerId: any): Promise<any> {
  // Wrong: no type safety
}
```

---

## Migration & Testing

### Migration Checklist

When updating display logic, ensure:

1. ✅ **Backend Updated**: Date filtering implemented
2. ✅ **Frontend Updated**: Uses centralized endpoints
3. ✅ **Database Updated**: Views and functions created
4. ✅ **Tests Written**: Unit and integration tests
5. ✅ **Documentation Updated**: This document reflects changes
6. ✅ **Staging Tested**: Verified in staging environment
7. ✅ **Production Deployed**: Rolled out to production

### Testing Strategy

#### Unit Tests

```javascript
describe('Player Stats Calculations', () => {
  test('completion percentage calculation', () => {
    const stats = {
      completions: 15,
      passAttempts: 20
    };
    const result = calculateCompletionPercentage(stats);
    expect(result).toBe(75.0);
  });
  
  test('division by zero returns 0', () => {
    const stats = {
      completions: 0,
      passAttempts: 0
    };
    const result = calculateCompletionPercentage(stats);
    expect(result).toBe(0);
  });
});
```

#### Integration Tests

```javascript
describe('Player Stats API', () => {
  test('returns stats filtered to today', async () => {
    const response = await fetch('/.netlify/functions/player-stats/aggregated?playerId=TEST_PLAYER');
    const stats = await response.json();
    
    // Verify no future games included
    expect(stats.gamesPlayed).toBeGreaterThanOrEqual(0);
    // Verify calculations are correct
    expect(stats.completionPercentage).toBeLessThanOrEqual(100);
  });
});
```

#### Consistency Tests

```javascript
describe('Cross-Page Consistency', () => {
  test('all pages show same stats', async () => {
    const playerId = 'TEST_PLAYER';
    
    const analyticsStats = await getAnalyticsStats(playerId);
    const performanceStats = await getPerformanceStats(playerId);
    const rosterStats = await getRosterStats(playerId);
    
    expect(analyticsStats.completionPercentage)
      .toBe(performanceStats.completionPercentage);
    expect(analyticsStats.completionPercentage)
      .toBe(rosterStats.completionPercentage);
  });
});
```

### Manual Testing Checklist

- [ ] **Date Filtering**: Verify future games don't appear in stats
- [ ] **Calculations**: Manually verify percentages and averages
- [ ] **Cross-Page**: Check same player shows same stats on all pages
- [ ] **Empty States**: Verify graceful handling of no data
- [ ] **Error Handling**: Test with invalid player IDs, network errors
- [ ] **Performance**: Verify stats load quickly (< 2 seconds)
- [ ] **Mobile**: Test display on mobile devices
- [ ] **Timezone**: Test with different timezones

---

## Summary

This document provides comprehensive guidelines for displaying player data consistently across the application. Key takeaways:

1. **Always use centralized endpoints** for player statistics
2. **Always filter to "up to and including today"** by default
3. **Use consistent calculation formulas** across all layers
4. **Format numbers consistently** (percentages: 1 decimal, averages: 2 decimals)
5. **Handle edge cases gracefully** (no data, division by zero, etc.)
6. **Test consistency** across all pages displaying stats
7. **Follow best practices** for error handling, validation, and caching

By following these guidelines, we ensure a consistent, reliable, and accurate player statistics display across the entire application.

---

## Related Documents

- [Statistics Consistency Implementation](./STATS_CONSISTENCY_IMPLEMENTATION.md) - Implementation details
- [Training Data Display Logic](./TRAINING_DATA_DISPLAY_LOGIC.md) - Training session display logic
- [Refactoring Summary](./REFACTORING_SUMMARY.md) - Recent refactoring changes

---

**Last Updated**: December 2025  
**Version**: 1.0  
**Maintained By**: Development Team
