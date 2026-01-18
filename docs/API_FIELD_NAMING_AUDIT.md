# API Field Naming Audit Report

**Date:** 2026-01-18  
**Status:** Issues Identified - Fixes Needed

## Executive Summary

The codebase has significant inconsistency between API response field names and frontend expectations. The root cause is:

1. **Database** uses `snake_case` (e.g., `readiness_score`)
2. **Backend API** uses mixed naming (sometimes `camelCase`, sometimes `snake_case`)
3. **Frontend TypeScript** expects mixed naming depending on the service

This leads to silent failures where data exists but isn't displayed because of field name mismatches.

## Critical Issues Found

### 1. Daily Protocol API (PARTIALLY FIXED)

| Backend Returns | Frontend Expects | Status |
|----------------|------------------|--------|
| `confidenceMetadata` | `confidence_metadata` | ✅ FIXED |
| `readinessScore` | `readiness_score` | ⚠️ NEEDS FIX |
| `acwrValue` | `acwr_value` | ⚠️ NEEDS FIX |
| `protocolDate` | `protocol_date` | ⚠️ NEEDS FIX |
| `sessionResolution` | `session_resolution` | ⚠️ NEEDS FIX |
| `coachNote` | `coach_note` | ⚠️ NEEDS FIX |
| `aiRationale` | `ai_rationale` | ⚠️ NEEDS FIX |

**Impact:** "Check-in not logged" banner issue (now fixed for confidence_metadata)

### 2. Wellness Check-in API

| Backend Returns | Frontend Expects | Status |
|----------------|------------------|--------|
| `sleepQuality` | `sleep` | ⚠️ NEEDS FIX |
| `energyLevel` | `energy` | ⚠️ NEEDS FIX |
| `stressLevel` | `stress` | ⚠️ NEEDS FIX |
| `muscleSoreness` | `soreness` | ⚠️ NEEDS FIX |
| `checkinDate` | `date` | ⚠️ NEEDS FIX |

**Impact:** Wellness data may not display correctly in UI

### 3. Training Sessions API

| Backend Returns | Frontend Expects | Status |
|----------------|------------------|--------|
| `sessionType` | `session_type` | ⚠️ NEEDS FIX |
| `durationMinutes` | `duration_minutes` | ⚠️ NEEDS FIX |
| `sessionDate` | `session_date` | ⚠️ NEEDS FIX |

**Impact:** Training session data may not display or calculate correctly

### 4. Performance Data API

| Backend Returns | Frontend Expects | Status |
|----------------|------------------|--------|
| `bodyFat` | `body_fat` | ⚠️ NEEDS FIX |
| `muscleMass` | `muscle_mass` | ⚠️ NEEDS FIX |
| `resultValue` | `result_value` | ⚠️ NEEDS FIX |
| `testType` | `test_type` | ⚠️ NEEDS FIX |

**Impact:** Performance measurements may not save/display correctly

## Recommended Solutions

### Option A: Fix Backend to Return snake_case (Preferred)

Standardize ALL backend API responses to use `snake_case` to match database and frontend expectations.

**Pros:**
- Single source of truth
- No mapping needed in frontend
- Matches database columns directly

**Cons:**
- Requires updating all 106 Netlify functions
- Breaking change for any external API consumers

### Option B: Add Frontend Mapping Layer

Add a response interceptor or mapping functions to normalize API responses.

**Example:**
```typescript
// In api.service.ts or a dedicated mapper
function normalizeApiResponse<T>(data: unknown): T {
  if (!data || typeof data !== 'object') return data as T;
  
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    // Keep both versions for compatibility
    normalized[key] = value;
    normalized[snakeKey] = value;
  }
  return normalized as T;
}
```

**Pros:**
- Non-breaking change
- Can be done incrementally
- Frontend controls its own data format

**Cons:**
- Adds complexity
- Potential performance overhead
- Duplicated data in memory

### Option C: Standardize on camelCase Throughout (Long-term)

Convert frontend to expect camelCase and ensure backend always returns camelCase.

**Pros:**
- TypeScript convention
- Cleaner code

**Cons:**
- Major refactor
- Database queries would need transformations

## Immediate Action Items

1. **[HIGH]** Add field mapping to `today.component.ts` for remaining fields
2. **[HIGH]** Add field mapping to wellness service for GET responses  
3. **[MEDIUM]** Create shared API response types with both naming conventions
4. **[LOW]** Standardize backend response formatting over time

## Audit Scripts

Two audit scripts were created:

1. `scripts/audit-api-field-names.cjs` - Full codebase scan (found 2343 potential issues)
2. `scripts/audit-critical-apis.cjs` - Targeted scan of critical APIs

Run audits:
```bash
node scripts/audit-critical-apis.cjs
```

## Testing Checklist

After fixes, verify:

- [ ] Wellness check-in saves and banner disappears
- [ ] Readiness score displays correctly
- [ ] ACWR value displays correctly
- [ ] Training sessions load and display
- [ ] Performance measurements save/load
- [ ] Coach notes display
- [ ] Protocol date shows correctly

---

**Last Updated:** 2026-01-18
