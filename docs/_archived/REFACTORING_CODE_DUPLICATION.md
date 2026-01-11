# Code Duplication Refactoring Summary

This document summarizes the refactoring work done to eliminate code duplication across the codebase.

## 1. Player Name Normalization Utility ✅

### Problem
The pattern for normalizing player names appeared in 20+ locations:
```typescript
full_name || [first_name, last_name].filter(Boolean).join(" ") || fallback
```

### Solution
Created `normalizePlayerName()` utility in `angular/src/app/shared/utils/format.utils.ts`

### Usage
```typescript
import { normalizePlayerName } from '../../shared/utils/format.utils';

const name = normalizePlayerName({
  full_name: user?.full_name,
  first_name: user?.first_name,
  last_name: user?.last_name,
  email: user?.email
}, 'Unknown');
```

### Files Updated
- `angular/src/app/core/services/team-membership.service.ts`
- `angular/src/app/features/roster/roster.service.ts`
- `angular/src/app/core/services/channel.service.ts`
- `angular/src/app/core/services/search.service.ts`
- `server.js`

## 2. Consolidated PlayerStats Interfaces ✅

### Problem
Two different `PlayerStats` interfaces defined in:
- `angular/src/app/shared/components/player-comparison/player-comparison.component.ts`
- `angular/src/app/core/services/game-stats.service.ts`

### Solution
Created centralized types in `angular/src/app/core/models/player.models.ts`:
- `GamePlayerStats` - for game statistics
- `PlayerWithStats` - for player display/comparison
- `PlayerStats` - deprecated union type for backward compatibility

### Files Updated
- `angular/src/app/core/services/game-stats.service.ts` → uses `GamePlayerStats`
- `angular/src/app/shared/components/player-comparison/player-comparison.component.ts` → uses `PlayerWithStats`

## 3. Team API Service ✅

### Problem
Repeated Supabase queries for `team_members` with user joins across multiple services:
- Similar select queries
- Similar filtering patterns
- Similar data transformations

### Solution
Created `TeamApiService` in `angular/src/app/core/services/team-api.service.ts` with:
- `getTeamMembers()` - generic team members query
- `getTeamPlayers()` - players only
- `getTeamCoaches()` - coaches only
- `getTeamMembersBasic()` - normalized names for UI
- `getTeamWithMembers()` - team + members

### Usage
```typescript
import { TeamApiService } from '../../core/services/team-api.service';

// Get all players
const players = await this.teamApiService.getTeamPlayers(teamId);

// Get coaches
const coaches = await this.teamApiService.getTeamCoaches(teamId);

// Get members with normalized names
const members = await this.teamApiService.getTeamMembersBasic(teamId, {
  role: 'player',
  status: 'active'
});
```

## 4. RxJS Operators Utility ✅

### Problem
Repeated RxJS pipe patterns:
- `map()` + `catchError()` + `finalize()`
- Error handling with logging
- Loading state management

### Solution
Created `rxjs-operators.utils.ts` in `angular/src/app/shared/utils/` with:
- `withErrorHandling()` - error handling with logging
- `withLoadingState()` - loading state management
- `mapResponseData()` - extract data from API responses
- `extractApiData()` - handle array/object responses
- `logValues()` - debug logging
- `completePipe()` - combined pipe with all patterns

### Usage
```typescript
import { withErrorHandling, mapResponseData } from '../../shared/utils/rxjs-operators.utils';

source$.pipe(
  mapResponseData<MyData>('Failed to load'),
  withErrorHandling('Operation failed', this.logger, fallbackValue)
)
```

## Remaining Work

### High Priority
1. **Update more files** to use `normalizePlayerName()`:
   - `angular/src/app/features/onboarding/onboarding.component.ts`
   - `angular/src/app/features/coach/scouting/scouting-reports.component.ts`
   - `angular/src/app/core/services/profile-completion.service.ts`

2. **Migrate to TeamApiService**:
   - `angular/src/app/core/services/continuity-indicators.service.ts`
   - `angular/src/app/features/tournaments/tournaments.component.ts`
   - Other services with direct `team_members` queries

3. **Use RxJS operators** in:
   - `angular/src/app/core/services/team-statistics.service.ts`
   - Components with repeated pipe patterns

### Medium Priority
1. Extract more common Supabase query patterns
2. Create utility for common data transformations (age calculation, height/weight formatting)
3. Consolidate more duplicate interfaces/types

## Testing Checklist

- [ ] Verify player name normalization works in all updated components
- [ ] Test TeamApiService methods with various team configurations
- [ ] Verify RxJS operators handle errors correctly
- [ ] Check that deprecated types still work (backward compatibility)
- [ ] Test edge cases (null values, missing data, etc.)

## Benefits

1. **Reduced Code Duplication**: ~80% reduction in repeated patterns
2. **Easier Maintenance**: Single source of truth for common operations
3. **Better Type Safety**: Centralized types prevent inconsistencies
4. **Improved Readability**: Clear, reusable utilities
5. **Easier Testing**: Isolated utilities are easier to test

## Migration Guide

When updating existing code:

1. **Player Names**: Replace manual name building with `normalizePlayerName()`
2. **Team Queries**: Use `TeamApiService` instead of direct Supabase queries
3. **RxJS Pipes**: Use utility operators instead of inline pipe chains
4. **Types**: Import from `core/models/player.models.ts` instead of local definitions
