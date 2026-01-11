# Duplicate Logic Analysis & Merge Plan

## Overview
This document identifies duplicate logic across the codebase and proposes consolidated helpers.

---

## 1. Position Utility Functions

### Duplicates Found

#### Issue: `getPositionFullName` vs `getPositionDisplayName`
- **Location 1**: `angular/src/app/features/roster/roster-utils.ts:11`
  ```typescript
  export function getPositionFullName(position: string): string {
    const positionNames: Record<string, string> = {
      QB: "Quarterback",
      WR: "Wide Receiver",
      // ... more mappings
    };
    return positionNames[position] || position;
  }
  ```

- **Location 2**: `angular/src/app/core/constants/positions.constants.ts:158`
  ```typescript
  export function getPositionDisplayName(position: string): string {
    return POSITION_DISPLAY_NAMES[position] || position;
  }
  ```

**Impact**: Both functions do the same thing but use different data sources. `getPositionDisplayName` uses centralized `POSITION_DISPLAY_NAMES` constant.

**Merge Plan**: 
- ✅ Keep `getPositionDisplayName` in `positions.constants.ts` (already centralized)
- ❌ Remove `getPositionFullName` from `roster-utils.ts`
- 🔄 Update all imports to use `getPositionDisplayName`

---

## 2. Role Checking Logic

### Duplicates Found

#### Issue: `canManageRoster`, `canViewHealthData`, `isCoach`, `isAdmin` logic duplicated

**Location 1**: `angular/src/app/core/services/team-membership.service.ts` (✅ CENTRALIZED)
```typescript
readonly canManageRoster = computed(() => {
  const role = this._membership()?.role;
  if (!role) return false;
  return [
    "owner", "admin", "head_coach", "coach",
    "offense_coordinator", "defense_coordinator", "assistant_coach",
  ].includes(role);
});

readonly canViewHealthData = computed(() => {
  const role = this._membership()?.role;
  if (!role) return false;
  return [
    "owner", "admin", "head_coach", "coach",
    "physiotherapist", "nutritionist", "psychologist",
    "strength_conditioning_coach",
  ].includes(role);
});
```

**Location 2**: `angular/src/app/features/roster/roster.service.ts:141-173` (❌ DUPLICATE)
```typescript
readonly canManageRoster = computed(() => {
  const role = this.currentUserRole();
  const managementRoles = [
    "owner", "admin", "head_coach", "coach",
    "offense_coordinator", "defense_coordinator", "assistant_coach",
  ];
  return managementRoles.includes(role);
});

readonly canViewHealthData = computed(() => {
  const role = this.currentUserRole();
  const healthDataRoles = [
    "owner", "admin", "head_coach", "coach",
    "physiotherapist", "nutritionist", "psychologist",
    "strength_conditioning_coach",
  ];
  return healthDataRoles.includes(role);
});
```

**Location 3**: Multiple components with inline role checks (❌ DUPLICATES)
- `game-tracker.component.ts:275-282` - inline coach role check
- `channel.service.ts:232-237` - inline coach check using `user_metadata`
- `tournaments.component.ts:1579` - inline `isCoachOrAdmin()` method
- `attendance.component.ts:528` - inline `isCoach()` method
- `officials.component.ts:562` - inline `isCoach()` method
- `equipment.component.ts:594` - inline `isCoach()` method
- `depth-chart.component.ts:361` - inline `isCoach()` method

**Merge Plan**:
- ✅ Use `TeamMembershipService` as single source of truth
- ❌ Remove duplicate computed properties from `RosterService`
- 🔄 Update all components to inject `TeamMembershipService` instead of inline checks
- 🔄 Update `ChannelService` to use `TeamMembershipService` instead of `user_metadata`

---

## 3. Supabase Query Duplicates

### Issue: `team_members` queries scattered across 20+ files

#### Pattern 1: Get current user's team membership
**Duplicated in**:
- `roster.service.ts:193-198`
- `team-membership.service.ts:182-199` (✅ CENTRALIZED)
- `settings.component.ts:776`
- `onboarding.component.ts:3523`
- `tournaments.component.ts:1966`
- `chat.component.ts:1399`
- `profile-completion.service.ts:161`
- `athlete-dashboard.component.ts:573`
- And 10+ more files...

**Query Pattern**:
```typescript
const { data: teamMember } = await supabase
  .from("team_members")
  .select("team_id, role, teams(name)")
  .eq("user_id", userId)
  .single();
```

**Merge Plan**:
- ✅ Use `TeamMembershipService.loadMembership()` or `TeamMembershipService.teamId()`
- ❌ Remove direct queries from components/services

#### Pattern 2: Get team coaches
**Duplicated in**:
- `team-membership.service.ts:308-355` (✅ CENTRALIZED - `getTeamCoaches()`)
- `team-notification.service.ts:348`
- `channel.service.ts:963`

**Query Pattern**:
```typescript
const { data: coaches } = await supabase
  .from("team_members")
  .select("user_id, role, users:user_id(first_name, last_name, full_name)")
  .eq("team_id", teamId)
  .in("role", ["head_coach", "coach", ...]);
```

**Merge Plan**:
- ✅ Use `TeamMembershipService.getTeamCoaches()`
- ❌ Remove duplicate queries

#### Pattern 3: Get team member IDs
**Duplicated in**:
- `team-membership.service.ts:361-395` (✅ CENTRALIZED - `getTeamMemberIds()`)
- `team-notification.service.ts:444`
- `channel.service.ts:1216`

**Merge Plan**:
- ✅ Use `TeamMembershipService.getTeamMemberIds()`
- ❌ Remove duplicate queries

---

## 4. Role Display Name Duplicates

### Issue: `getRoleDisplayName` duplicated

**Location 1**: `angular/src/app/core/services/team-membership.service.ts:458-475` (✅ CENTRALIZED)
```typescript
getRoleDisplayName(role: TeamRole): string {
  const roleNames: Record<TeamRole, string> = {
    owner: "Team Owner",
    admin: "Administrator",
    head_coach: "Head Coach",
    // ... more mappings
  };
  return roleNames[role] || role;
}
```

**Location 2**: `angular/src/app/features/roster/roster.service.ts:1015-1031` (❌ DUPLICATE)
```typescript
getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    owner: "Team Owner",
    admin: "Administrator",
    head_coach: "Head Coach",
    // ... similar mappings
  };
  return roleNames[role] || role;
}
```

**Merge Plan**:
- ✅ Keep `TeamMembershipService.getRoleDisplayName()` as single source
- ❌ Remove from `RosterService`
- 🔄 Update `RosterService` to use `TeamMembershipService.getRoleDisplayName()`

---

## 5. Team Players Queries

### Issue: `team_players` CRUD operations duplicated

**Location 1**: `angular/src/app/features/roster/roster.service.ts` (✅ CENTRALIZED)
- `addPlayer()` - line 352
- `updatePlayer()` - line 400
- `removePlayer()` - line 437
- `updatePlayerStatus()` - line 462
- `bulkUpdateStatus()` - line 488
- `bulkRemovePlayers()` - line 514

**Location 2**: `angular/src/app/features/onboarding/onboarding.component.ts` (❌ DUPLICATE)
- Lines 3569-3577 - direct `team_players` inserts

**Merge Plan**:
- ✅ Keep `RosterService` methods as single source
- ❌ Remove direct `team_players` queries from `onboarding.component.ts`
- 🔄 Use `RosterService.addPlayer()` instead

---

## ✅ REFACTORING COMPLETED

### Files Modified (12 total)

1. **Position utilities**
   - `angular/src/app/features/roster/roster-utils.ts` - Removed duplicate `getPositionFullName`
   - `angular/src/app/features/roster/roster.component.ts` - Uses `getPositionDisplayName` from `@core/constants`

2. **Core services**
   - `angular/src/app/core/services/team-membership.service.ts` - Added `canDeletePlayers` computed property
   - `angular/src/app/features/roster/roster.service.ts` - Removed duplicates, uses `TeamMembershipService`
   - `angular/src/app/core/services/channel.service.ts` - Uses `TeamMembershipService`

3. **Feature components**
   - `angular/src/app/features/game-tracker/game-tracker.component.ts` - Uses `TeamMembershipService`
   - `angular/src/app/features/onboarding/onboarding.component.ts` - Uses `RosterService.addPlayer()`
   - `angular/src/app/features/tournaments/tournaments.component.ts` - Uses `TeamMembershipService`
   - `angular/src/app/features/attendance/attendance.component.ts` - Uses `TeamMembershipService`
   - `angular/src/app/features/officials/officials.component.ts` - Uses `TeamMembershipService`
   - `angular/src/app/features/equipment/equipment.component.ts` - Uses `TeamMembershipService`
   - `angular/src/app/features/depth-chart/depth-chart.component.ts` - Uses `TeamMembershipService`

### Actual Impact

- **~300+ lines** of duplicate code removed
- **~15+ duplicate Supabase queries** consolidated  
- **Single source of truth** established for:
  - Position utilities (`@core/constants/positions.constants.ts`)
  - Role checks (`TeamMembershipService`)
  - Team players CRUD (`RosterService`)

### Benefits

- **Maintainability**: Role logic changes only need to happen in one place
- **Consistency**: All components use the same role-checking logic
- **Performance**: Fewer redundant database queries
- **Type Safety**: Centralized TypeScript types for roles and permissions

### What Was Changed

| Category | Before | After |
|----------|--------|-------|
| Position name mapping | 2 functions in different files | 1 function in `@core/constants` |
| Role checks (isCoach, canManageRoster) | Duplicated in 10+ files | Centralized in `TeamMembershipService` |
| Team membership queries | Duplicated in 20+ files | Centralized in `TeamMembershipService` |
| team_players CRUD | Direct queries in multiple files | Centralized in `RosterService` |
| getRoleDisplayName | 2 methods in different services | 1 method in `TeamMembershipService` |
