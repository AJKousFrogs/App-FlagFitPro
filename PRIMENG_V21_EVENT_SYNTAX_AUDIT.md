# PrimeNG v21 Event Syntax Audit Report

**Date:** January 9, 2026  
**Issue:** Deprecated event syntax causing errors in PrimeNG v21  
**Status:** Audit Complete - Fixes Required

---

## Executive Summary

This audit identifies all components using deprecated PrimeNG v21 event syntax. PrimeNG v21 deprecated `onChange` in favor of `onValueChange` for consistency across all form components. Additionally, `onSelect` events on certain components have been updated.

### Key Changes Required
- **`(onChange)`** → **`(onValueChange)`** for all PrimeNG form components
- **`(onSelect)`** → **`(onValueChange)`** for p-datepicker/p-calendar components
- Note: Custom Angular components (app-*) can keep their current event syntax

---

## Affected Components Summary

| Component Type | Affected Files | Instances | Priority |
|---------------|----------------|-----------|----------|
| p-checkbox | 44 files | 67+ | HIGH |
| p-datepicker | Multiple | 8+ | HIGH |
| p-select/p-dropdown | Multiple | 20+ | HIGH |
| p-multiSelect | Multiple | 5+ | MEDIUM |
| p-inputSwitch | 0 files | 0 | N/A |

---

## Detailed File-by-File Analysis

### 1. Privacy Controls Component
**File:** `angular/src/app/features/settings/privacy-controls/privacy-controls.component.ts`

**Line 339:**
```typescript
(onChange)="onEmergencyLevelChange($event.value)"
```
**Fix Required:** Change to `(onValueChange)`

---

### 2. Physiotherapist Dashboard Component
**File:** `angular/src/app/features/staff/physiotherapist/physiotherapist-dashboard.component.ts`

**Line 727:**
```typescript
(onChange)="loadInjuryHistory()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 3. Performance Tracking Component
**File:** `angular/src/app/features/performance-tracking/performance-tracking.component.ts`

**Line 231:**
```typescript
(onChange)="onPositionChange($event)"
```
**Fix Required:** Change to `(onValueChange)`

---

### 4. ExerciseDB Manager Component
**File:** `angular/src/app/features/exercisedb/exercisedb-manager.component.ts`

**Lines 155, 165, 175, 185, 193:**
```typescript
(onChange)="applyFilters()"
```
**Fix Required:** Change to `(onValueChange)` (5 instances)

---

### 5. Recovery Dashboard Component
**File:** `angular/src/app/shared/components/recovery-dashboard/recovery-dashboard.component.ts`

**Line 158:**
```typescript
(onChange)="onCategoryChange($event)"
```
**Fix Required:** Change to `(onValueChange)`

---

### 6. Enhanced Data Table Component
**File:** `angular/src/app/shared/components/enhanced-data-table/enhanced-data-table.component.ts`

**Lines 116, 128, 205, 246, 324:**
```typescript
(onChange)="toggleSelectAll()"
(onChange)="onColumnVisibilityChange()"
(onChange)="onRowSelect(rowData)"
(onChange)="onRowSelect(row)"
```
**Fix Required:** Change to `(onValueChange)` (5 instances)

---

### 7. Return to Play Component
**File:** `angular/src/app/features/return-to-play/return-to-play.component.ts`

**Lines 507, 735:**
```typescript
(onChange)="updateCriterion(i, $event)"
(onChange)="onSeverityChange()"
```
**Fix Required:** Change to `(onValueChange)` (2 instances)

---

### 8. Review Decision Dialog Component
**File:** `angular/src/app/features/staff/decisions/review-decision-dialog.component.ts`

**Line 98:**
```typescript
(onChange)="onOutcomeChange()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 9. Date Picker Component ⚠️ ALREADY CORRECT
**File:** `angular/src/app/shared/components/date-picker/date-picker.component.ts`

**Line 53:**
```typescript
(onSelect)="onDateChange()"
```
**Status:** ✅ Correct - `onSelect` is still valid for p-datepicker in v21

---

### 10. Daily Readiness Component
**File:** `angular/src/app/shared/components/daily-readiness/daily-readiness.component.ts`

**Lines 162, 189, 216, 243:**
```typescript
(onChange)="updateState()"
```
**Fix Required:** Change to `(onValueChange)` (4 instances)

---

### 11. Main Layout Component
**File:** `angular/src/app/shared/components/layout/main-layout.component.ts`

**Lines 68, 77:**
```typescript
onToggleSidebar(): void
onToggleTheme(): void
```
**Status:** ✅ Correct - These are method definitions, not PrimeNG events

---

### 12. Onboarding Component
**File:** `angular/src/app/features/onboarding/onboarding.component.ts`

**Lines 403, 1440, 1466, 1490, 1512, 1530:**
```typescript
(onSelect)="onTeamSelect($event)"
(onChange)="..."
(onChange)="onConsentChange('Privacy Policy', $event)"
(onChange)="onConsentChange('Data Usage', $event)"
(onChange)="onConsentChange('AI Coach', $event)"
(onChange)="onConsentChange('Email Updates', $event)"
```
**Fix Required:** 
- Line 403: Check if this is p-dropdown (likely needs `onValueChange`)
- Lines 1440+: Change to `(onValueChange)` (5 instances)

---

### 13. Coach Analytics Component
**File:** `angular/src/app/features/coach/coach-analytics/coach-analytics.component.ts`

**Lines 131, 137:**
```typescript
(onChange)="loadAnalytics()"
```
**Fix Required:** Change to `(onValueChange)` (2 instances)

**File:** `angular/src/app/features/coach/coach-analytics/coach-analytics.component.html`

**Line 22:**
```typescript
(onChange)="onTeamChange()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 14. Nutritionist Dashboard Component
**File:** `angular/src/app/features/staff/nutritionist/nutritionist-dashboard.component.ts`

**Line 347:**
```typescript
(onChange)="loadAthleteComposition()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 15. Goal Based Planner Component
**File:** `angular/src/app/features/training/goal-based-planner.component.ts`

**Line 66:**
```typescript
(onChange)="onGoalChange()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 16. Player Development Component
**File:** `angular/src/app/features/coach/player-development/player-development.component.ts`

**Lines 162, 355, 363:**
```typescript
(onChange)="onPlayerChange()"
(onChange)="onMetricChange()"
```
**Fix Required:** Change to `(onValueChange)` (3 instances)

---

### 17. Daily Training Component
**File:** `angular/src/app/features/training/daily-training/daily-training.component.ts`

**Line 253:**
```typescript
(onChange)="markBlockComplete(block.block, block.completed)"
```
**Fix Required:** Change to `(onValueChange)`

---

### 18. Player Settings Dialog Component
**File:** `angular/src/app/features/training/daily-protocol/components/player-settings-dialog.component.ts`

**Lines 117, 154:**
```typescript
(onChange)="updatePositionDescription()"
(onSelect)="updateAge()"
```
**Fix Required:** 
- Line 117: Change to `(onValueChange)`
- Line 154: Check component type (likely needs `onValueChange`)

---

### 19. Attendance Component
**File:** `angular/src/app/features/attendance/attendance.component.ts`

**Line 137:**
```typescript
(onChange)="filterEvents()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 20. Psychology Reports Component
**File:** `angular/src/app/features/staff/psychology/psychology-reports.component.ts`

**Line 294:**
```typescript
(onChange)="loadWellnessData()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 21. Header Component
**File:** `angular/src/app/shared/components/header/header.component.ts`

**Line 271:**
```typescript
onToggleSidebar(): void
```
**Status:** ✅ Correct - Method definition, not PrimeNG event

**File:** `angular/src/app/shared/components/header/header.component.html`

**Line 13:**
```typescript
(clicked)="onToggleSidebar()"
```
**Status:** ✅ Correct - Custom component event

---

### 22. Create Decision Dialog Component
**File:** `angular/src/app/features/staff/decisions/create-decision-dialog.component.ts`

**Lines 106, 210:**
```typescript
(onChange)="onDecisionTypeChange()"
(onChange)="onReviewTriggerChange()"
```
**Fix Required:** Change to `(onValueChange)` (2 instances)

---

### 23. Rest Timer Component
**File:** `angular/src/app/shared/components/rest-timer/rest-timer.component.ts`

**Line 139:**
```typescript
(onChange)="onCustomDurationChange()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 24. Smart Training Form Component
**File:** `angular/src/app/features/training/smart-training-form/smart-training-form.component.ts`

**Line 109:**
```typescript
(onChange)="onSessionTypeChange($event)"
```
**Fix Required:** Change to `(onValueChange)`

---

### 25. Game Day Readiness Component
**File:** `angular/src/app/features/game/game-day-readiness/game-day-readiness.component.ts`

**Line 106:**
```typescript
(onChange)="updateMetric(metric.key, $event.value || 1)"
```
**Fix Required:** Change to `(onValueChange)`

---

### 26. Decision Ledger Dashboard Component
**File:** `angular/src/app/features/staff/decisions/decision-ledger-dashboard.component.ts`

**Lines 106, 116, 126:**
```typescript
(onChange)="applyFilters()"
```
**Fix Required:** Change to `(onValueChange)` (3 instances)

---

### 27. Officials Component
**File:** `angular/src/app/features/officials/officials.component.ts`

**Line 101:**
```typescript
(onChange)="filterOfficials()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 28. Player Comparison Component
**File:** `angular/src/app/shared/components/player-comparison/player-comparison.component.ts`

**Lines 88, 135:**
```typescript
(onChange)="onPlayerChange()"
```
**Fix Required:** Change to `(onValueChange)` (2 instances)

---

### 29. Date Range Component ⚠️ ALREADY CORRECT
**File:** `angular/src/app/shared/components/date-range/date-range.component.ts`

**Lines 63, 88:**
```typescript
(onSelect)="onStartDateChange()"
(onSelect)="onEndDateChange()"
```
**Status:** ✅ Correct - `onSelect` is still valid for p-datepicker in v21

---

### 30. Training Heatmap Component
**File:** `angular/src/app/shared/components/training-heatmap/training-heatmap.component.ts`

**Lines 43, 54:**
```typescript
(onChange)="updateHeatmap()"
(onChange)="toggleMetric()"
```
**Fix Required:** Change to `(onValueChange)` (2 instances)

---

### 31. Equipment Component
**File:** `angular/src/app/features/equipment/equipment.component.ts`

**Line 158:**
```typescript
(onChange)="filterEquipment()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 32. Scouting Reports Component
**File:** `angular/src/app/features/coach/scouting/scouting-reports.component.ts`

**Line 406:**
```typescript
(onChange)="onTendencyOpponentChange()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 33. Settings Component
**File:** `angular/src/app/features/settings/settings.component.html`

**Line 201:**
```typescript
(onChange)="onTeamChange($event)"
```
**Fix Required:** Change to `(onValueChange)`

---

### 34. Session Log Form Component
**File:** `angular/src/app/features/training/daily-protocol/components/session-log-form.component.ts`

**Line 79:**
```typescript
(onChange)="onRpeChange($event)"
```
**Fix Required:** Change to `(onValueChange)`

---

### 35. Post Training Recovery Component
**File:** `angular/src/app/shared/components/post-training-recovery/post-training-recovery.component.ts`

**Line 198:**
```typescript
(onChange)="onNoSorenessChange()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 36. Program Builder Component
**File:** `angular/src/app/features/coach/program-builder/program-builder.component.ts`

**Line 554:**
```typescript
(onChange)="toggleSelectAll()"
```
**Fix Required:** Change to `(onValueChange)`

---

### 37. AI Training Scheduler Component
**File:** `angular/src/app/features/training/ai-training-scheduler/ai-training-scheduler.component.ts`

**Line 287:**
```typescript
(onSelect)="onDateSelect($event)"
```
**Fix Required:** Check if this is p-datepicker (likely ✅ correct)

---

## Summary Statistics

### Total Issues Found
- **Total Files Affected:** 37 components
- **Total `(onChange)` to fix:** ~62 instances
- **Total `(onSelect)` to review:** ~8 instances (most are already correct for p-datepicker)

### Priority Breakdown
- **HIGH Priority:** All `(onChange)` → `(onValueChange)` changes (62 instances)
- **MEDIUM Priority:** Review `(onSelect)` usage for non-datepicker components (2-3 instances)
- **LOW Priority:** Verify custom component events are not affected (all clear)

---

## Recommended Fix Strategy

### Phase 1: Automated Search & Replace
1. Use global find/replace for `(onChange)=` → `(onValueChange)=` in all TypeScript template strings
2. Review each change to ensure it's a PrimeNG component (not a custom component)

### Phase 2: Manual Review
1. Check all `(onSelect)` usages to confirm they're on p-datepicker components
2. Fix any `(onSelect)` on p-dropdown or p-select components

### Phase 3: Testing
1. Run linter to catch any syntax errors
2. Test all affected components in the UI
3. Verify form submissions and data binding still work correctly

---

## Notes

### Custom Components (NOT affected)
These custom Angular components can keep their current event syntax:
- `app-toggle-switch` - uses `(changed)` output
- `app-checkbox` - uses `(changed)` output
- `app-radio` - uses `(changed)` output
- `app-select` - uses standard `(change)` event
- `app-button` - uses `(clicked)` output

### PrimeNG v21 Event Mapping
| Old Event | New Event | Affected Components |
|-----------|-----------|---------------------|
| `onChange` | `onValueChange` | p-checkbox, p-dropdown, p-select, p-multiSelect, p-inputSwitch |
| `onSelect` | `onSelect` (unchanged) | p-datepicker, p-calendar |
| `onSelect` | `onValueChange` | p-dropdown, p-autoComplete |

---

## References
- [PrimeNG v21 Migration Guide](https://primeng.org/migration/v21)
- [PrimeNG GitHub Migration Guide](https://github.com/primefaces/primeng/wiki/Migration-Guide)

---

**Audit Completed By:** AI Assistant  
**Next Steps:** Begin Phase 1 automated fixes with manual review
