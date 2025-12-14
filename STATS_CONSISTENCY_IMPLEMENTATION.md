# Statistics Consistency Implementation

## Overview

This document describes the implementation of a centralized statistics system that ensures all player statistics are consistent across the entire application, always showing data up to and including today's date.

## Key Requirements Met

✅ **Single Source of Truth**: All stats are stored in the database and queryable by player, team, season, game, and date  
✅ **Date Filtering**: All queries filter data up to and including today (e.g., on Sunday, 14 December 2025, shows everything up to that date)  
✅ **Consistent Calculations**: All derived metrics use the same mathematical formulas across the entire app  
✅ **No Caching Issues**: Screens always read from the latest stored data or centralized calculation layer  
✅ **Cross-Feature Consistency**: Numbers match identically across Analytics, Performance, and Game Tracker sections

## Architecture

### 1. Centralized Backend Function

**File**: `netlify/functions/player-stats.cjs`

- **Endpoint**: `/.netlify/functions/player-stats`
- **Routes**:
  - `GET /aggregated` - Get all stats up to and including today
  - `GET /date-range?startDate=X&endDate=Y` - Get stats for specific date range

**Key Features**:
- Always filters games by date: `game_date <= TODAY (23:59:59)`
- Aggregates stats from `game_events` table
- Uses consistent calculation formulas
- Supports filtering by season and team

### 2. Database View and Function

**File**: `database/migrations/041_player_stats_aggregation_view.sql`

- **View**: `player_stats_aggregated` - Materialized view of all player stats up to today
- **Function**: `get_player_aggregated_stats(player_id, season, team_id)` - SQL function for consistent aggregation

**Benefits**:
- Database-level aggregation for performance
- Automatic date filtering
- Consistent calculations at the database level

### 3. Updated Functions

#### `games.cjs`
- `getGames()` now filters by default to show only games up to and including today
- `getPlayerGameStats()` verifies game is not in the future before returning stats

#### `analytics.cjs`
- All date-based queries now include `.lte("completed_at", todayEndOfDay)`
- Ensures analytics always reflect data up to and including today

### 4. Frontend Integration

#### API Configuration
**File**: `src/api-config.js`

Added new endpoints:
```javascript
playerStats: {
  aggregated: "/player-stats/aggregated",
  dateRange: "/player-stats/date-range"
}
```

#### Game Stats Service
**File**: `src/js/services/gameStatsService.js`

- `getPlayerStats()` now uses centralized backend endpoint by default
- Falls back to local calculation if backend unavailable
- `getPlayerStatsByDateRange()` added for date range queries

## Usage Examples

### Backend: Get Player Aggregated Stats

```javascript
// Get all stats up to and including today
GET /.netlify/functions/player-stats/aggregated?playerId=PLAYER_ID

// With filters
GET /.netlify/functions/player-stats/aggregated?playerId=PLAYER_ID&season=2025&teamId=TEAM_ID

// Date range
GET /.netlify/functions/player-stats/date-range?playerId=PLAYER_ID&startDate=2025-01-01&endDate=2025-12-14
```

### Frontend: Using Game Stats Service

```javascript
import { gameStatsService } from './js/services/gameStatsService.js';

// Get all stats (uses backend, filtered to today)
const stats = await gameStatsService.getPlayerStats(playerId);

// Get stats for date range
const stats = await gameStatsService.getPlayerStatsByDateRange(
  playerId,
  new Date('2025-12-01'),
  new Date('2025-12-14')
);

// Force local calculation (for backward compatibility)
const stats = await gameStatsService.getPlayerStats(playerId, { forceLocal: true });
```

### Database: Using SQL Function

```sql
-- Get aggregated stats for a player
SELECT * FROM get_player_aggregated_stats('PLAYER_ID');

-- With season filter
SELECT * FROM get_player_aggregated_stats('PLAYER_ID', '2025');

-- With team filter
SELECT * FROM get_player_aggregated_stats('PLAYER_ID', NULL, 'TEAM_ID');
```

## Calculation Formulas

All calculations use consistent formulas:

### Completion Percentage
```
completion_percentage = (completions / pass_attempts) * 100
Rounded to 1 decimal place using banker's rounding
```

### Drop Rate
```
drop_rate = (drops / targets) * 100
Rounded to 1 decimal place
```

### Flag Pull Success Rate
```
flag_pull_success_rate = (flag_pulls / flag_pull_attempts) * 100
Rounded to 1 decimal place
```

### Average Yards Per Attempt
```
avg_yards_per_attempt = passing_yards / pass_attempts
Rounded to 2 decimal places
```

### Yards Per Carry
```
yards_per_carry = rushing_yards / rushing_attempts
Rounded to 2 decimal places
```

## Date Filtering Logic

All queries use the same date filtering pattern:

```javascript
// Get today at end of day (23:59:59.999)
const todayEndOfDay = new Date();
todayEndOfDay.setHours(23, 59, 59, 999);

// Filter games/events up to and including today
.lte("game_date", todayEndOfDay.toISOString())
```

This ensures:
- On Sunday, December 14, 2025, the app shows all data up to and including that date
- Future games/events are never included in statistics
- Data is always current and accurate

## Migration Steps

1. **Run Database Migration**:
   ```bash
   # Apply the new view and function
   psql -d your_database -f database/migrations/041_player_stats_aggregation_view.sql
   ```

2. **Deploy Backend Functions**:
   - Deploy `netlify/functions/player-stats.cjs`
   - Updated `games.cjs` and `analytics.cjs` are already deployed

3. **Update Frontend**:
   - Frontend services automatically use the new endpoints
   - No changes needed to existing pages (backward compatible)

## Testing

### Verify Date Filtering
1. Create a game with date in the future
2. Verify it doesn't appear in stats until that date arrives
3. On the game date, verify it's included in stats

### Verify Consistency
1. Check stats in Analytics page
2. Check stats in Performance page
3. Check stats in Game Tracker
4. All should show identical numbers

### Verify Calculations
1. Manually calculate stats for a player
2. Compare with API response
3. Verify formulas match exactly

## Benefits

1. **Consistency**: Same numbers everywhere in the app
2. **Accuracy**: Always up-to-date, never includes future data
3. **Performance**: Database-level aggregation is fast
4. **Maintainability**: Single source of truth for calculations
5. **Reliability**: No caching issues or stale data

## Future Enhancements

- Add caching layer with TTL for frequently accessed stats
- Add real-time updates via WebSockets
- Add historical snapshots for trend analysis
- Add export functionality for stats reports
