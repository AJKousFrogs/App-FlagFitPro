# Calculation Consolidation Audit

## Overview

This document audits all readiness and ACWR calculations across the codebase. The goal is to identify opportunities for consolidation to ensure consistent calculations using a single source of truth.

**Date:** January 18, 2026  
**Status:** Fixed - No more mock data defaults

---

## Critical Fixes Applied

### 1. Removed Default/Mock Values

All calculations now return `null` when required data is missing instead of using fake defaults:

| File | Before | After |
|------|--------|-------|
| `direct-supabase-api.service.ts` | Used defaults like `sleep ?? 5` | Returns `null` if missing sleep/energy |
| `unified-training.service.ts` | Used `0` and `10` as defaults | Returns `null` if missing data |
| `wellness-checkin.cjs` | Used `sleepQuality \|\| 3` | Returns `null` if missing data |
| `load-monitoring.service.ts` | Assumed all values present | Returns `null` if missing data |
| `player-metrics.service.ts` | Generated random mock values | Returns `null` - no fake data |
| `athlete-performance-data.js` | Used `\|\| 5` defaults | Returns `null` if missing data |
| `coach.cjs` | Default readiness 75, ACWR 1.0 | Uses `null` when no data |
| `user-context.cjs` | Default ACWR 1.0 | Uses `null` when no data |
| `exercise-progression.cjs` | Default readiness 70, ACWR 1.0 | Uses `null`, conservative adjustment |

---

## Readiness Calculation Locations

### Frontend (Angular)

| Location | Purpose | Formula | Status |
|----------|---------|---------|--------|
| `wellness.constants.ts` - `computeQuickReadiness()` | Quick Check-in (1-5 scale) | feeling×0.4 + energy×0.35 + soreness×0.25 | **KEEP** - Used by UI |
| `wellness.constants.ts` - `computeDailyReadiness()` | Full Check-in (0-10 scale) | pain×0.3 + fatigue×0.25 + sleep×0.25 + motivation×0.2 | **KEEP** - Different inputs |
| `direct-supabase-api.service.ts` - `calculateReadiness()` | Wellness submission | sleep×0.3 + energy×0.25 + stress×0.25 + soreness×0.2 | **CONSOLIDATE** |
| `unified-training.service.ts` - `calculateReadinessScore()` | Wellness check processing | sleep×0.3 + energy×0.25 + stress×0.25 + soreness×0.2 | **CONSOLIDATE** |
| `load-monitoring.service.ts` - `calculateReadinessScore()` | Load management | sleep×0.3 + energy×0.25 + stress×0.25 + soreness×0.2 | **CONSOLIDATE** |
| `player-metrics.service.ts` - `calculateReadiness()` | Player metrics | Returns stored value or null | **FIXED** - No calculation |

### Backend (Netlify Functions)

| Location | Purpose | Formula | Status |
|----------|---------|---------|--------|
| `calc-readiness.cjs` | **CANONICAL** Full readiness | ACWR×0.35 + wellness×0.30 + sleep×0.20 + proximity×0.15 | **CANONICAL** |
| `wellness-checkin.cjs` - `calculateReadiness()` | Quick calculation on submit | sleep×0.3 + energy×0.25 + stress×0.25 + soreness×0.2 | **CONSOLIDATE** |
| `coach.cjs` | Coach dashboard | wellness avg - ACWR penalty | **FIXED** - Proper formula |

---

## ACWR Calculation Locations

### Frontend (Angular)

| Location | Purpose | Status |
|----------|---------|--------|
| `acwr.service.ts` | **CANONICAL** ACWR calculation | **KEEP** - Single source |
| `dashboard.view-model.ts` | Dashboard display | **FIXED** - Returns null when no data |
| `training-stats-calculation.service.ts` | Stats aggregation | **FIXED** - Passes through from service |

### Backend (Netlify Functions)

| Location | Purpose | Formula | Status |
|----------|---------|---------|--------|
| `calc-readiness.cjs` | Part of readiness calc | session-RPE based acute/chronic | **KEEP** |
| `coach.cjs` | Coach dashboard | acute(7d) / chronic(14d avg) | **CONSOLIDATE** |
| `user-context.cjs` | User context | acute / chronic weekly avg | **CONSOLIDATE** |

---

## Recommended Consolidation

### Phase 1: Immediate (Completed)
- [x] Remove all mock/default values
- [x] Return `null` when data is missing
- [x] UI handles null by showing "No data" or prompting for check-in

### Phase 2: Create Canonical Calculations (Recommended)

#### 2.1 Readiness Service Consolidation

Create a single `readiness-calculation.ts` module that all services import:

```typescript
// core/calculations/readiness-calculation.ts

export interface ReadinessInput {
  sleepQuality: number | null;  // Required
  energyLevel: number | null;   // Required
  stressLevel?: number | null;  // Optional
  muscleSoreness?: number | null; // Optional
}

export interface ReadinessResult {
  score: number | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  missingFields: string[];
}

/**
 * Evidence-based readiness calculation
 * 
 * Weights (team-sport optimized):
 * - Sleep Quality: 30% (Halson 2014, Fullagar et al. 2015)
 * - Energy Level: 25%
 * - Stress Level: 25% (inverted)
 * - Muscle Soreness: 20% (inverted)
 */
export function calculateReadiness(input: ReadinessInput): ReadinessResult {
  // Implementation...
}
```

#### 2.2 ACWR Service Consolidation

The `acwr.service.ts` should be the only ACWR calculation source. Backend functions should call it via API or use shared calculation module.

---

## Evidence Base

All readiness calculations use evidence-based weights:

1. **Sleep Quality (30%)** - Strong evidence linking sleep to readiness (Halson 2014, Fullagar et al. 2015)
2. **Energy Level (25%)** - Correlates with perceived performance
3. **Stress Level (25%)** - Inverted; lower stress = better readiness (Saw et al. 2016)
4. **Muscle Soreness (20%)** - Inverted; lower soreness = better readiness

### Cut-Points (Starting Points)
- < 55: Low readiness → Deload
- 55-75: Moderate readiness → Maintain
- > 75: High readiness → Push

**Note:** These thresholds are starting points. Teams should calibrate using their own injury/performance history over time.

---

## Files Modified in This Audit

1. `angular/src/app/core/services/direct-supabase-api.service.ts`
2. `angular/src/app/core/services/unified-training.service.ts`
3. `angular/src/app/core/services/load-monitoring.service.ts`
4. `angular/src/app/features/roster/services/player-metrics.service.ts`
5. `angular/src/app/features/dashboard/athlete-dashboard.component.ts`
6. `angular/src/app/core/services/team-statistics.service.ts`
7. `angular/src/app/core/view-models/dashboard.view-model.ts`
8. `angular/src/app/features/staff/physiotherapist/physiotherapist-dashboard.component.ts`
9. `netlify/functions/wellness-checkin.cjs`
10. `netlify/functions/exercise-progression.cjs`
11. `netlify/functions/coach.cjs`
12. `netlify/functions/user-context.cjs`
13. `src/athlete-performance-data.js`

---

## Next Steps

1. **Create shared calculation module** - Extract canonical formulas to a shared module
2. **Remove duplicate calculations** - Point all callers to the canonical module
3. **Add unit tests** - Ensure calculations produce consistent results
4. **Monitor for regressions** - Track any places where mock data might slip back in
