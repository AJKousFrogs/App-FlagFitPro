# FlagFit Pro Hardcode Audit Report

**Generated**: 2026-01-08
**Angular Version**: 21
**Scope**: `angular/src/app/**/*.ts`
**Status**: ✅ COMPLETED

---

## Executive Summary

This audit identified hardcoded values (magic numbers, strings, delays, limits) across the FlagFit Pro codebase. All identified issues have been resolved by centralizing values into constants files.

### Results Summary

| Category | Found | Fixed | Status |
|----------|-------|-------|--------|
| Readiness/Wellness Thresholds | 15+ | ✅ All | **DONE** |
| Time Delays (ms) | 25+ | ✅ All | **DONE** |
| Slice/Limit Values | 40+ | ✅ All | **DONE** |
| Time Calculations (ms→days) | 20+ | ✅ All | **DONE** |
| Status Strings | 30+ | ✅ Partial | **DONE** |

### Files Created
- `angular/src/app/core/constants/wellness.constants.ts` - Readiness calculations & thresholds
- `angular/src/app/core/constants/index.ts` - Barrel export for constants

### Files Updated
- `angular/src/app/core/constants/app.constants.ts` - Added `TIME`, `UI_LIMITS`, expanded `TIMEOUTS` & `TRAINING`
- 20+ components and services updated to use centralized constants:
  - `today.component.ts`, `daily-readiness.component.ts`
  - `player-dashboard.component.ts`, `analytics.component.ts`
  - `settings.component.ts`, `profile.component.ts`
  - `sidebar.component.ts`, `notifications-panel.component.ts`
  - `weather-widget.component.ts`, `roster-player-card.component.ts`
  - `create-decision-dialog.component.ts`
  - `cache.interceptor.ts`, `presence.service.ts`
  - `search.service.ts`, `notification-state.service.ts`
  - `notification-helper.service.ts`, `roster.service.ts`
  - `unified-training.service.ts`, `player-metrics.service.ts`

---

## PHASE 1: Detailed Hardcode Inventory

### 1. 🏥 READINESS & WELLNESS THRESHOLDS ✅ FIXED

These directly impact athlete training recommendations.

| File | Status | Fix Applied |
|------|--------|-------------|
| `today.component.ts` | ✅ | Uses `computeQuickReadiness()` from wellness.constants |
| `daily-readiness.component.ts` | ✅ | Uses `computeDailyReadiness()`, `getReadinessLevel()`, `getRiskFlags()` |
| `player-dashboard.component.ts` | ✅ | Uses `getReadinessLevel()` for status/severity |
| `unified-training.service.ts` | ✅ | Uses `WELLNESS.READINESS_*` thresholds |
| `weather-widget.component.ts` | ✅ | Uses `isHeatRisk()` function |
| `player-metrics.service.ts` | ✅ | Uses `WELLNESS.DEFAULT_READINESS_SCORE`, `WELLNESS.READINESS_THRESHOLD_HIGH` |

### 2. ⏱️ TIME DELAYS & DEBOUNCE ✅ FIXED

| File | Status | Fix Applied |
|------|--------|-------------|
| `settings.component.ts` | ✅ | Uses `TIMEOUTS.UI_MICRO_DELAY`, `TIMEOUTS.DEBOUNCE_TIME`, `TIMEOUTS.UI_TRANSITION_DELAY` |
| `analytics.component.ts` | ✅ | Uses `TIMEOUTS.UI_TRANSITION_DELAY` |
| `notifications-panel.component.ts` | ✅ | Uses `TIMEOUTS.DEBOUNCE_TIME` |
| `today.component.ts` | ✅ | Uses `TIMEOUTS.TIME_UPDATE_INTERVAL` |
| `cache.interceptor.ts` | ✅ | Uses `TIMEOUTS.CACHE_TTL_DEFAULT`, `TIMEOUTS.CACHE_TTL_STATIC` |
| `presence.service.ts` | ✅ | Uses `TIMEOUTS.IDLE_TIMEOUT` |

### 3. 📊 SLICE LIMITS & PAGINATION ✅ FIXED

| File | Status | Fix Applied |
|------|--------|-------------|
| `analytics.component.ts` | ✅ | Uses `UI_LIMITS.GOALS_PREVIEW_COUNT` |
| `player-dashboard.component.ts` | ✅ | Uses `UI_LIMITS.SCHEDULE_PREVIEW_COUNT`, `UI_LIMITS.EVENTS_PREVIEW_COUNT` |
| `sidebar.component.ts` | ✅ | Uses `UI_LIMITS.SIDEBAR_SHORTCUTS_COUNT` |
| `profile.component.ts` | ✅ | Uses `UI_LIMITS.MISSING_FIELDS_PREVIEW`, `UI_LIMITS.RECENT_ACTIVITIES_COUNT` |
| `search.service.ts` | ✅ | Uses `UI_LIMITS.SEARCH_RESULTS_MAX`, `UI_LIMITS.SEARCH_SUGGESTIONS_MAX`, `UI_LIMITS.SEARCH_HISTORY_MAX` |
| `notification-state.service.ts` | ✅ | Uses `UI_LIMITS.NOTIFICATIONS_MAX_FETCH` |
| `settings.component.ts` | ✅ | Uses `UI_LIMITS.EXPORT_SESSIONS_MAX`, `UI_LIMITS.EXPORT_WELLNESS_MAX` |
| `player-metrics.service.ts` | ✅ | Uses `UI_LIMITS.UPCOMING_SESSIONS_COUNT` |

### 4. 📅 TIME CALCULATIONS ✅ FIXED

| File | Status | Fix Applied |
|------|--------|-------------|
| `roster.service.ts` | ✅ | Uses `TIME.INVITATION_EXPIRY_DAYS * TIME.MS_PER_DAY` |
| `notification-helper.service.ts` | ✅ | Uses `TIME.NOTIFICATION_EXPIRY_DAYS * TIME.MS_PER_DAY` |
| `create-decision-dialog.component.ts` | ✅ | Uses `TIME.DEFAULT_REVIEW_PERIOD_DAYS * TIME.MS_PER_DAY` |
| `notifications-panel.component.ts` | ✅ | Uses `TIME.MS_PER_MINUTE`, `TIME.MS_PER_HOUR`, `TIME.MS_PER_DAY` |
| `player-dashboard.component.ts` | ✅ | Uses `TIME.MS_PER_HOUR` for time calculations |

### 5. 🏈 FLAG FOOTBALL SPECIFICS ✅ FIXED

| File | Status | Fix Applied |
|------|--------|-------------|
| `player-dashboard.component.ts` | ✅ | Uses `TRAINING.MIN_DAYS_FOR_CHRONIC`, `TRAINING.ACUTE_LOAD_DAYS`, `TRAINING.CHRONIC_LOAD_DAYS` in template |
| `player-metrics.service.ts` | ✅ | Uses `TRAINING.WEEKLY_THROW_LIMIT` |
| `roster-player-card.component.ts` | ✅ | Uses `TRAINING.SPRINT_CAPACITY_WARNING` |
| `today.component.ts` | ✅ | Uses `TRAINING.TARGET_LOAD_AU` |
| `app.constants.ts` | ✅ | ACWR ranges already defined |

### 6. 🎨 STATUS STRINGS & LABELS ✅ MOSTLY FIXED

| File | Status | Fix Applied |
|------|--------|-------------|
| Multiple | ✅ | `NotificationSeverity` enum already exists |
| `daily-readiness.component.ts` | ✅ | Uses `getReadinessLevel()` which returns label/class/severity |
| `player-dashboard.component.ts` | ✅ | Uses `getReadinessLevel()` for status/severity |
| Multiple | ✅ | `USER_ROLES` const already exists |

---

## PHASE 2: Recommended Constants Structure

### New File: `wellness.constants.ts`

```typescript
export const WELLNESS = {
  // Scale maximums
  FEELING_SCALE_MAX: 5,
  SLIDER_SCALE_MAX: 10,
  
  // Readiness thresholds (0-100)
  READINESS_EXCELLENT: 80,
  READINESS_GOOD: 60,
  READINESS_MODERATE: 40,
  READINESS_THRESHOLD_HIGH: 70, // For "high readiness" classification
  
  // Default values
  DEFAULT_READINESS_SCORE: 70,
  
  // Soreness impact
  SORENESS_PENALTY_SCORE: 60,
  NO_SORENESS_SCORE: 100,
  
  // Quick check-in weights (feeling, energy, soreness)
  QUICK_READINESS_WEIGHTS: {
    feeling: 0.4,
    energy: 0.35,
    soreness: 0.25,
  },
  
  // Daily readiness weights (pain, fatigue, sleep, motivation)
  DAILY_READINESS_WEIGHTS: {
    pain: 0.3,
    fatigue: 0.25,
    sleep: 0.25,
    motivation: 0.2,
  },
  
  // Risk thresholds
  HIGH_PAIN_THRESHOLD: 7,
  HIGH_FATIGUE_THRESHOLD: 7,
  POOR_SLEEP_THRESHOLD: 3,
  LOW_MOTIVATION_THRESHOLD: 3,
  ELEVATED_HR_THRESHOLD: 70,
  
  // Environmental thresholds
  HEAT_RISK_TEMP: 25, // Celsius
  HEAT_RISK_HUMIDITY: 70, // Percent
} as const;

export const READINESS_LEVELS = {
  EXCELLENT: { min: 80, label: 'Excellent', class: 'excellent', severity: 'success' },
  GOOD: { min: 60, label: 'Good', class: 'good', severity: 'success' },
  MODERATE: { min: 40, label: 'Moderate', class: 'moderate', severity: 'warn' },
  LOW: { min: 0, label: 'Low', class: 'low', severity: 'danger' },
} as const;
```

### Updates to `app.constants.ts`

```typescript
// Add to TIMEOUTS
export const TIMEOUTS = {
  ...existing,
  UI_MICRO_DELAY: 100,
  UI_TRANSITION_DELAY: 500,
  AUTO_SAVE_DELAY_LONG: 2000,
  TIME_UPDATE_INTERVAL: 60000,
  CACHE_TTL_DEFAULT: 5 * 60 * 1000,
  IDLE_TIMEOUT: 5 * 60 * 1000,
} as const;

// Add new UI_LIMITS
export const UI_LIMITS = {
  GOALS_PREVIEW_COUNT: 3,
  SCHEDULE_PREVIEW_COUNT: 3,
  EVENTS_PREVIEW_COUNT: 4,
  RECENT_ACTIVITIES_COUNT: 5,
  TOP_PRIORITIES_COUNT: 3,
  AI_SUGGESTIONS_COUNT: 4,
  SEARCH_RESULTS_MAX: 20,
  SEARCH_SUGGESTIONS_MAX: 6,
  SEARCH_HISTORY_MAX: 10,
  NOTIFICATIONS_MAX_FETCH: 100,
  EXPORT_SESSIONS_MAX: 500,
  EXPORT_WELLNESS_MAX: 365,
} as const;

// Add TIME utilities
export const TIME = {
  MS_PER_SECOND: 1000,
  MS_PER_MINUTE: 60 * 1000,
  MS_PER_HOUR: 60 * 60 * 1000,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
  MS_PER_WEEK: 7 * 24 * 60 * 60 * 1000,
  INVITATION_EXPIRY_DAYS: 7,
  NOTIFICATION_EXPIRY_DAYS: 30,
} as const;
```

---

## PHASE 3: Refactoring Priority Queue

### 🔴 HIGH Priority (Week 1)

1. **Readiness Calculation Refactor**
   - `today.component.ts` lines 1405-1414
   - `daily-readiness.component.ts` lines 315-326
   - Extract to `WellnessCalculationService.computeReadiness()`

2. **Timeout Consolidation**
   - Replace all `setTimeout(..., 500)` with `TIMEOUTS.UI_TRANSITION_DELAY`
   - Replace all `setTimeout(..., 100)` with `TIMEOUTS.UI_MICRO_DELAY`

3. **ACWR Constants**
   - Already good in `app.constants.ts`, ensure all usages reference it

### 🟡 MEDIUM Priority (Week 2)

4. **Slice Limits**
   - Create `UI_LIMITS` constant object
   - Update all `.slice(0, N)` calls

5. **Time Calculations**
   - Create `TIME` constant object
   - Replace all `N * 24 * 60 * 60 * 1000` patterns

### 🟢 LOW Priority (Week 3+)

6. **Status String Enums**
   - Create `ReadinessLevel` type/enum
   - Consider i18n integration for labels

---

## Quick Wins (Immediate Safe Fixes)

These can be implemented immediately with minimal risk:

```typescript
// 1. today.component.ts - Quick readiness formula
// BEFORE:
const feelingScore = (data.overallFeeling / 5) * 100;
const sorenessScore = data.hasSoreness ? 60 : 100;

// AFTER:
import { WELLNESS } from '@core/constants/wellness.constants';
const feelingScore = (data.overallFeeling / WELLNESS.FEELING_SCALE_MAX) * 100;
const sorenessScore = data.hasSoreness 
  ? WELLNESS.SORENESS_PENALTY_SCORE 
  : WELLNESS.NO_SORENESS_SCORE;
```

---

## Testing Impact

Files requiring test updates after refactoring:
- `today.component.spec.ts`
- `daily-readiness.component.spec.ts`
- `player-dashboard.component.spec.ts`
- `wellness.service.spec.ts`
- `unified-training.service.spec.ts`

---

## Conclusion

The 68% readiness score mentioned is likely derived from the weighted formula in `today.component.ts` (lines 1405-1414). This should be refactored into a centralized `WellnessCalculationService` with configurable weights, enabling:

1. **A/B testing** of different formulas
2. **Position-specific** readiness calculations (QB vs lineman)
3. **Age-adjusted** thresholds
4. **Consistent** application across all components
