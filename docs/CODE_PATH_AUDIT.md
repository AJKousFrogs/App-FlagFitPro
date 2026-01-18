# Code Path Consistency Audit

## Executive Summary
This audit identifies patterns where data is handled differently between code paths (API vs Direct Supabase, production vs development), which can cause bugs where features work in one environment but fail in another.

---

## Critical Issues Found & Fixed

### 1. ✅ FIXED: `fullProtocolData` not set in API path
**File:** `angular/src/app/features/today/today.component.ts`

**Problem:** The `loadTodayData()` method (API path) was not setting `fullProtocolData`, causing protocol blocks to not render in production while working in local development.

**Root Cause:** The direct Supabase path set `this.fullProtocolData = response.data`, but the API path didn't.

**Fix Applied:** Added `this.fullProtocolData = response.data;` to the API path.

---

### 2. ✅ FIXED: `confidenceMetadata` vs `confidence_metadata` field naming
**Files:** 
- `netlify/functions/daily-protocol.cjs` (returns `confidenceMetadata`)
- `angular/src/app/today/resolution/today-state.resolver.ts` (expects `confidence_metadata`)

**Problem:** Backend returns camelCase, frontend resolver expects snake_case.

**Fix Applied:** Created `api-response-mapper.ts` utility that normalizes all API responses to snake_case.

---

## Patterns to Watch For

### Pattern A: Dual Data Loading Paths
Components that load data from both API and direct Supabase need to ensure:
1. Both paths set the same signals/variables
2. Both paths apply the same field name transformations
3. Error handling is consistent

**Example - today.component.ts:**
```typescript
// API path
if (response?.success && response.data) {
  this.fullProtocolData = response.data;  // MUST SET
  const protocolData = this.mapApiProtocolResponse(response.data);  // MUST MAP
  this.protocolJson.set(protocolData);
  // ...
}

// Direct Supabase path
if (response?.success && response.data) {
  this.fullProtocolData = response.data;  // MUST SET
  const protocolData = this.mapDirectResponseToProtocolJson(response.data);  // MUST MAP
  this.protocolJson.set(protocolData);
  // ...
}
```

### Pattern B: Signal Reset on Errors
When handling errors, ensure all related signals are reset consistently:

**Current files with signal resets:**
- `today.component.ts`: 141 `.set(null)` or `.set([])` calls
- Multiple feature components with similar patterns

**Checklist for error handlers:**
- [ ] Primary data signal reset
- [ ] Dependent/derived signals reset
- [ ] Loading states cleared
- [ ] Error message set appropriately

### Pattern C: API Response Field Name Transformation
Backend (Netlify functions) may return different field names than frontend expects.

**Use the mapper utility:**
```typescript
import { mapDailyProtocolResponse } from '../../core/utils/api-response-mapper';

// In API response handler:
const protocolData = mapDailyProtocolResponse(response.data);
```

**Field mappings handled:**
| Backend (camelCase) | Frontend (snake_case) |
|---------------------|----------------------|
| confidenceMetadata | confidence_metadata |
| readinessScore | readiness_score |
| acwrValue | acwr_value |
| protocolDate | protocol_date |
| sessionResolution | session_resolution |
| coachNote | coach_note |
| aiRationale | ai_rationale |
| coachAlertActive | coach_alert_active |
| modifiedByCoachId | modified_by_coach_id |
| taperActive | taper_active |
| weatherOverride | weather_override |

---

## Components Using Dual Paths (Audit Required)

### today.component.ts ✅ AUDITED
- Uses `useDirectSupabase` flag
- Has both `loadTodayData()` (API) and `loadTodayDataDirect()` (Supabase)
- Has both `generateAndLoadProtocol()` (API) and `generateAndLoadProtocolDirect()` (Supabase)
- Wellness submission uses conditional path

---

## Services to Monitor

### direct-supabase-api.service.ts
- Primary service for local development
- Maps database fields to frontend format
- Has `computeConfidenceMetadata()` that dynamically generates wellness state

### unified-training.service.ts
- Uses API for protocol generation
- Returns Observable typed as `unknown` - may need stronger typing

### wellness.service.ts
- Maps wellness data correctly in `getWellnessData()`
- `logWellness()` sends camelCase to API (correct)

### performance-data.service.ts
- Has transform functions for all data types
- Direct Supabase queries with explicit field mapping

---

## Recommended Actions

### Immediate
1. ✅ Done - Fixed fullProtocolData assignment
2. ✅ Done - Created api-response-mapper utility
3. ✅ Done - Applied mapper to today.component.ts

### Short-term
1. Add TypeScript interfaces for API responses
2. Create unit tests for field mapping transformations
3. Add integration tests that verify both code paths produce identical data shapes

### Long-term
1. Standardize on snake_case in backend responses to match database
2. Use OpenAPI/Swagger to document and validate API contracts
3. Consider using a code generator for API types

---

## Testing Checklist

When modifying data loading code:

- [ ] Test in local dev mode (`ng serve` on port 4200) - uses direct Supabase
- [ ] Test with Netlify Dev (`netlify dev` on port 8888) - uses API functions
- [ ] Test in production after deploy
- [ ] Verify data shows identically in all environments
- [ ] Check browser console for any field name warnings
- [ ] Verify all signals are properly set on success AND failure paths

---

## Related Documentation
- `docs/API_FIELD_NAMING_AUDIT.md` - Detailed field name mappings
- `angular/src/app/core/utils/api-response-mapper.ts` - Mapper utility source
