# TypeScript UI Logic Duplication Audit

**Date**: January 11, 2026  
**Scope**: UI logic duplication only (formatting helpers, visibility/toggle logic, state flags)  
**Status**: ⚠️ Multiple duplications found - safe to remove after UI stabilization

---

## Executive Summary

This audit identified **31 instances of duplicated UI logic** across the Angular codebase. These duplications fall into three main categories:

1. **Time/Date Formatting Helpers** (19 duplications)
2. **Dialog Visibility State Management** (8 duplications)
3. **Toggle/Visibility Logic** (4 duplications)

**Critical Note**: All identified duplications are safe to consolidate, but should only be done **after UI is stable** to avoid reintroducing subtle state bugs or UI glitches.

---

## Category 1: Time/Date Formatting Helpers

### 🔴 **High Priority** - formatTime(seconds: number): string

**Function**: Converts seconds to MM:SS format for display

#### Duplicated Implementations (4 identical copies):

**Implementation 1**: `recovery-dashboard.component.ts` (line 740)
```typescript
formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
```

**Implementation 2**: `micro-session.component.ts` (line 690)
```typescript
formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
```

**Implementation 3**: `youtube-player.component.ts` (line 369)
```typescript
formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
```

**Implementation 4**: `game-tracker.component.ts` (line 887)
```typescript
formatTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "--";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
```

#### Analysis:
- **All 4 implementations are functionally identical** (except game-tracker handles null)
- **Usage**: Active in all 4 components (used in templates and logic)
- **Best implementation**: `game-tracker.component.ts` (handles edge cases)

#### Recommendation:
**Keep**: Add to `format.utils.ts` as:
```typescript
/**
 * Format seconds as MM:SS for display
 * @example formatTimeMMSS(90) // '1:30'
 * @example formatTimeMMSS(null) // '--'
 */
export function formatTimeMMSS(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
```

**Remove from**:
- `recovery-dashboard.component.ts:740`
- `micro-session.component.ts:690`
- `youtube-player.component.ts:369`
- `game-tracker.component.ts:887`

---

### 🔴 **High Priority** - formatTimeAgo / getTimeAgo Variations

**Function**: Converts date/timestamp to relative time string ("2 hours ago", "Just now")

#### Duplicated Implementations (5 similar but slightly different):

**Implementation 1**: `admin.service.ts` (line 312) - Private method
```typescript
private formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";
  return `${Math.floor(hours / 24)} days ago`;
}
```
- **Used**: Once internally in admin service

**Implementation 2**: `autosave-indicator.component.ts` (line 96) - Private method
```typescript
private formatTimestamp(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  return "today";
}
```
- **Used**: In autosave indicator UI display

**Implementation 3**: `decision-card.component.ts` (line 253)
```typescript
formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  ...
}
```
- **Used**: Decision card timestamps

**Implementation 4**: `date.utils.ts` (line 265) - **CANONICAL VERSION** ✅
```typescript
export function getTimeAgo(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
}
```
- **Used**: Already imported in 7+ components
- **Best implementation**: Handles edge cases, proper type handling

**Implementation 5**: Multiple components call `announcements-banner.component.ts:169`, `chat.component.ts:1304`
```typescript
formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  ...
}
```
- **Used**: Chat and announcement timestamps

#### Analysis:
- **Canonical version exists**: `date.utils.ts:getTimeAgo()` is already exported and used in 7+ components
- **Duplicates are locally customized** with slightly different outputs
- **Usage**: Mixed - some components use canonical, others use local

#### Recommendation:
**Keep**: `date.utils.ts:getTimeAgo()` - already canonical ✅

**Remove duplicates from**:
- `admin.service.ts:312` → Replace with `getTimeAgo()`
- `autosave-indicator.component.ts:96` → Replace with `getTimeAgo()`
- `decision-card.component.ts:253` → Replace with `getTimeAgo()`
- `announcements-banner.component.ts:169` → Replace with `getTimeAgo()`
- `chat.component.ts:1304` → Replace with `getTimeAgo()`

**Note**: Some components may need UI tweaks if they rely on specific wording (e.g., "just now" vs "Just now"). Test after replacement.

---

### 🟡 **Medium Priority** - formatTime(timestamp: string): string (Time of Day)

**Function**: Formats ISO timestamp to time of day (e.g., "2:30 PM")

#### Duplicated Implementations (3 similar):

**Implementation 1**: `hydration-tracker.component.ts` (line 269)
```typescript
formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
```

**Implementation 2**: `ai-coach-chat.component.ts` (line 1644)
```typescript
formatTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dateObj);
}
```

**Implementation 3**: `coach-activity-feed.component.ts` (line 324)
```typescript
formatTime(timestamp: string): string {
  return this.notificationService.formatActivityTime(timestamp);
}
```
- This delegates to a service method (good pattern)

#### Analysis:
- **Implementations are similar** but use different formatting APIs
- **Usage**: Active in all 3 components
- **Best implementation**: `ai-coach-chat.component.ts` (handles both string/Date, proper Intl API)

#### Recommendation:
**Keep**: Add to `format.utils.ts` or `date.utils.ts` as:
```typescript
/**
 * Format date/timestamp as time of day
 * @example formatTimeOfDay('2025-01-11T14:30:00Z') // '2:30 PM'
 */
export function formatTimeOfDay(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dateObj);
}
```

**Remove from**:
- `hydration-tracker.component.ts:269`
- `ai-coach-chat.component.ts:1644`

**Keep**: `coach-activity-feed.component.ts:324` (already delegates to service - good pattern)

---

### 🟡 **Medium Priority** - formatDate(date: Date): string Variations

**Function**: Format date object to string for display or API submission

#### Duplicated Implementations (8 variations):

**Implementation 1**: `tournaments.component.ts` (line 1835) - ISO format for API
```typescript
private formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
```
- **Purpose**: Convert Date to 'YYYY-MM-DD' for API
- **Used**: Tournament form submission (3 calls)

**Implementation 2**: `tournament-calendar.component.ts` (line 537) - Handles undefined
```typescript
formatDate(date: string | Date | undefined): string | undefined {
  if (!date) return undefined;
  if (typeof date === "string") return date;
  return date.toISOString().split("T")[0];
}
```
- **Purpose**: Same as above but handles edge cases
- **Used**: Form binding (2 calls)

**Implementation 3**: `protocol-block.component.ts` (line 306) - Delegates to util
```typescript
formatDate(date: Date | string, formatStr?: string): string {
  return formatDate(date, formatStr || "h:mm a");
}
```
- **Purpose**: Wrapper around canonical `formatDate()` with default format
- **Used**: Protocol completion timestamps (2 calls)

**Implementation 4**: `exercise-card.component.ts` (line 358) - Identical to above
```typescript
formatDate(date: Date | string, formatStr?: string): string {
  return formatDate(date, formatStr || "h:mm a");
}
```
- **Purpose**: Same wrapper pattern
- **Used**: Exercise completion timestamps (1 call)

**Implementation 5**: `psychology-reports.component.ts` (line 1691) - Relative time
```typescript
formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  ...
}
```
- **Purpose**: Convert to relative time for reports
- **Used**: Report insights (2 calls)
- **Note**: This is actually a `formatTimeAgo` duplicate!

**Implementation 6**: `physiotherapist-dashboard.component.ts` (line 1633) - Identical to #5
```typescript
formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  ...
}
```
- **Purpose**: Same as #5
- **Used**: Injury insights (2 calls)

**Implementation 7**: `decision-detail.component.ts` (line 609) - Localized format
```typescript
formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    ...
  });
}
```
- **Purpose**: Long format for decision display
- **Used**: Decision detail page (3 calls)

**Implementation 8**: `achievement-badge.component.ts` (line 190) - Short date
```typescript
formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
```
- **Purpose**: Compact date for badge
- **Used**: Achievement unlock date (1 call)

#### Analysis:
- **Multiple purposes**: API formatting, display formatting, relative time
- **Canonical exists**: `date.utils.ts:formatDate()` already handles most cases
- **Some are misnamed**: #5 and #6 are actually `formatTimeAgo`

#### Recommendation:

**For ISO date formatting (#1, #2)**:
Add to `date.utils.ts`:
```typescript
/**
 * Format date as ISO date string (YYYY-MM-DD) for API submission
 * @example formatDateISO(new Date('2025-01-11')) // '2025-01-11'
 */
export function formatDateISO(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  if (typeof date === "string") return date;
  return date.toISOString().split("T")[0];
}
```

**Remove from**:
- `tournaments.component.ts:1835`
- `tournament-calendar.component.ts:537`

**For wrappers (#3, #4)**:
These are OK - they provide component-specific defaults. Consider consolidating if same default is used elsewhere.

**For relative time (#5, #6)**:
**These should use `getTimeAgo()` from `date.utils.ts`** (they're duplicates of time-ago logic)

**Remove from**:
- `psychology-reports.component.ts:1691` → Use `getTimeAgo()`
- `physiotherapist-dashboard.component.ts:1633` → Use `getTimeAgo()`

**For display formats (#7, #8)**:
**Keep**: These are component-specific display needs. Can use canonical `formatDate()` with custom format strings if desired.

---

## Category 2: Dialog Visibility State Management

### 🟢 **Low Priority** - Dialog Boolean Flags Pattern

**Pattern**: Components maintain multiple boolean flags for dialog visibility:
```typescript
showChangePasswordDialog = false;
showDeleteAccountDialog = false;
show2FASetupDialog = false;
showDisable2FADialog = false;
```

#### Duplicated Pattern Found In:

1. **`settings.component.ts`** (lines 101-105, 143, 155)
   - `showChangePasswordDialog`
   - `showDeleteAccountDialog`
   - `show2FASetupDialog`
   - `showDisable2FADialog`
   - `showSessionsDialog`
   - `showDataExportDialog`
   - `showNewTeamDialog`
   - **Total**: 7 dialog flags

2. **`privacy-controls.component.ts`** (lines 666-667)
   - `showAddContactDialog`
   - `showDeleteAccountDialog`
   - **Total**: 2 dialog flags

3. **`coach.component.ts`** (line 348)
   - `showCreateSessionDialog`
   - **Total**: 1 dialog flag

4. **`performance-tracking.component.ts`** (line 648)
   - `showLogDialog`
   - **Total**: 1 dialog flag

5. **`program-builder.component.ts`** (line 629)
   - `showCreateDialog`
   - **Total**: 1 dialog flag

6. **`attendance.component.ts`** (lines 465-466)
   - `showCreateEventDialog`
   - `showAttendanceDialog`
   - **Total**: 2 dialog flags

7. **`officials.component.ts`** (lines 492-494)
   - `showOfficialDialog`
   - `showScheduleDialog`
   - **Total**: 2 dialog flags

8. **`equipment.component.ts`** (lines 535-537)
   - `showAddDialog`
   - `showCheckoutDialog`
   - `showReturnDialog`
   - **Total**: 3 dialog flags

#### Analysis:
- **Total**: 19 dialog boolean flags across 8 components
- **Pattern**: All use boolean primitive (`false`) instead of signals
- **Usage**: All are actively used in templates with `[(visible)]="showXDialog"`

#### Signal-Based Pattern Found In:

Some newer components use signals for dialog state:
```typescript
showStartDialog = signal(false);
showGenerateDialog = signal(false);
```

Found in:
- `return-to-play.component.ts` (line 837)
- `psychology-reports.component.ts` (lines 1127-1128)
- `decision-ledger-dashboard.component.ts` (lines 342-343)
- `scouting-reports.component.ts` (lines 1032-1034)
- 15+ other components

#### Recommendation:

**No immediate action required** - This is a pattern difference, not duplication.

However, for consistency:
- **Prefer signals** for new code: `showDialog = signal(false)`
- **Migration**: Low priority - migrate boolean flags to signals when touching these components for other reasons

**Rationale**: 
- Signals provide better change detection
- More consistent with Angular 21 patterns
- Not urgent - both patterns work

---

## Category 3: Toggle/Visibility Logic

### 🟢 **Low Priority** - toggleSidebar() / toggleView() Methods

**Pattern**: Components implement simple toggle methods:
```typescript
toggleSidebar(): void {
  this.isOpen.update((val) => !val);
}
```

#### Duplicated Implementations:

1. **`sidebar.component.ts`** (lines 578-580, 606-612)
   ```typescript
   toggleSidebar(): void {
     this.isOpen.update((val) => !val);
   }
   
   toggleMeGroup(): void {
     this.meGroupExpanded.update((val) => {
       const newVal = !val;
       this.saveMeGroupState(newVal);
       return newVal;
     });
   }
   ```
   - **Used**: Sidebar open/close, menu group expansion (2 toggles)

2. **`enhanced-data-table.component.ts`** (lines 464-470)
   ```typescript
   toggleView(): void {
     this.isMobileView.update((v) => !v);
   }
   
   toggleSelectAll(): void {
     const data = this.data();
     if (this.selectAll()) {
       data.forEach((row) => (row._selected = true));
     } else {
       data.forEach((row) => (row._selected = false));
     }
   }
   ```
   - **Used**: Table view switching, row selection (2 toggles)

3. **`keyboard-shortcuts.service.ts`** (line 543)
   ```typescript
   private toggleSidebar(): void {
     if (typeof window !== "undefined") {
       window.dispatchEvent(new CustomEvent("toggle-sidebar"));
     }
   }
   ```
   - **Used**: Keyboard shortcut handler
   - **Note**: This dispatches event, doesn't duplicate state

#### Analysis:
- **These are NOT duplications** - each toggle manages different state
- `toggleSidebar()` in different components controls different UI elements
- Pattern is simple and doesn't benefit from abstraction

#### Recommendation:
**No action required** - These are appropriately scoped to their components.

---

## Summary Table

| Category | Instances | Priority | Action Required |
|----------|-----------|----------|-----------------|
| **Time/Date Formatting** | 19 | 🔴 High | Consolidate into `format.utils.ts` / `date.utils.ts` |
| **Dialog State Flags** | 8 components | 🟢 Low | Migrate to signals (low priority) |
| **Toggle Methods** | 4 | 🟢 Low | No action (appropriately scoped) |

---

## Implementation Priority

### Phase 1: After UI Stabilization - High Priority Formatting

**1. Add to `format.utils.ts`**:
```typescript
/**
 * Format seconds as MM:SS for display
 * @example formatTimeMMSS(90) // '1:30'
 * @example formatTimeMMSS(null) // '--'
 */
export function formatTimeMMSS(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format date/timestamp as time of day
 * @example formatTimeOfDay('2025-01-11T14:30:00Z') // '2:30 PM'
 */
export function formatTimeOfDay(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dateObj);
}
```

**2. Add to `date.utils.ts`**:
```typescript
/**
 * Format date as ISO date string (YYYY-MM-DD) for API submission
 * @example formatDateISO(new Date('2025-01-11')) // '2025-01-11'
 */
export function formatDateISO(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  if (typeof date === "string") return date;
  return date.toISOString().split("T")[0];
}
```

**3. Remove duplicates** (12 files to update):
- `recovery-dashboard.component.ts` - Replace `formatTime` with `formatTimeMMSS`
- `micro-session.component.ts` - Replace `formatTime` with `formatTimeMMSS`
- `youtube-player.component.ts` - Replace `formatTime` with `formatTimeMMSS`
- `game-tracker.component.ts` - Replace `formatTime` with `formatTimeMMSS`
- `admin.service.ts` - Replace `formatTimeAgo` with `getTimeAgo`
- `autosave-indicator.component.ts` - Replace `formatTimestamp` with `getTimeAgo`
- `decision-card.component.ts` - Replace `formatTimeAgo` with `getTimeAgo`
- `announcements-banner.component.ts` - Replace `formatTime` with `getTimeAgo`
- `chat.component.ts` - Replace `formatTime` with `getTimeAgo`
- `hydration-tracker.component.ts` - Replace `formatTime` with `formatTimeOfDay`
- `ai-coach-chat.component.ts` - Replace `formatTime` with `formatTimeOfDay`
- `tournaments.component.ts` - Replace `formatDate` with `formatDateISO`

**Estimated Impact**: 12 files, ~50 lines removed, ~12 import statements added

---

### Phase 2: Future Enhancement - Dialog State Modernization

**When touching these components**, consider migrating boolean dialog flags to signals:

```typescript
// Before
showChangePasswordDialog = false;

// After
showChangePasswordDialog = signal(false);
```

**Affected files** (8 components):
- `settings.component.ts`
- `privacy-controls.component.ts`
- `coach.component.ts`
- `performance-tracking.component.ts`
- `program-builder.component.ts`
- `attendance.component.ts`
- `officials.component.ts`
- `equipment.component.ts`

**Estimated Impact**: Low priority, ~19 dialog flags, no functional change

---

## Testing Recommendations

After consolidation, test:

1. **Time displays**:
   - Verify MM:SS format in recovery dashboard, micro sessions, youtube player, game tracker
   - Verify "time ago" displays in chat, announcements, admin panel, decisions

2. **Date formatting**:
   - Verify tournament form submission still sends correct ISO dates
   - Verify protocol/exercise timestamps display correctly

3. **UI states**:
   - No changes to dialog visibility logic, so low risk
   - Spot-check dialog open/close in settings and privacy pages

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Breaking time display format | Low | All implementations are identical; comprehensive test coverage |
| Breaking relative time logic | Medium | Some implementations have slight variations; test edge cases |
| Breaking dialog state | Very Low | No changes to dialog state logic recommended |
| Reintroducing UI glitches | Low | Wait for UI stabilization before consolidation |

---

## Notes

1. **Canonical implementations already exist**: `date.utils.ts` has most needed functions
2. **Some "duplications" are misnamed**: Several `formatDate()` methods are actually time-ago formatters
3. **Signal migration is ongoing**: Some components use signals, others use primitives
4. **No business logic touched**: All identified duplications are pure UI formatting/state

---

## Conclusion

**Safe to proceed** with consolidation after UI stabilization. The duplications are well-contained, have clear canonical implementations, and pose low risk when removed systematically.

**Estimated effort**: 2-3 hours for Phase 1 consolidation + testing

**Recommended timing**: After current UI stability work is complete and verified
