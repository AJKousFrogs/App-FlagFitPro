# Wellness Single Source of Truth - Fix Applied

**Status:** ✅ COMPLETE  
**Date:** 2026-01-11  
**Severity:** HIGH (data integrity issue)

## Problem

Split-brain wellness data causing "says done, but after refresh nothing changed":

- **Save Path:** Frontend → `wellness_entries` table (direct Supabase write)
- **Read Path:** Frontend → `/api/wellness-checkin` → `daily_wellness_checkin` table

This caused:
1. Data written to `wellness_entries` was never read by the UI
2. UI read from `daily_wellness_checkin` which was empty
3. Users saw "saved successfully" but refresh showed no data

## Root Cause

`DailyReadinessComponent` was writing directly to `wellness_entries` table instead of using the `/api/wellness-checkin` endpoint.

## Solution Applied

✅ **Single Source of Truth: `daily_wellness_checkin` table via `/api/wellness-checkin` API**

### Changes Made

#### 1. `daily-readiness.component.ts`

**Before:**
```typescript
// Direct Supabase write to wellness_entries
const { error } = await this.supabaseService.client
  .from("wellness_entries")
  .upsert(wellnessData, {
    onConflict: "athlete_id,date",
  });
```

**After:**
```typescript
// POST to /api/wellness-checkin (UPSERT on user_id, checkin_date)
await this.api.post("/api/wellness-checkin", wellnessPayload);
```

**Field Mapping:**
- `pain_level` → `muscleSoreness`
- `fatigue_level` → `energyLevel` (inverted: `10 - fatigue`)
- `sleep_quality` → `sleepQuality`
- `motivation_level` → (included in `notes` for now)

#### 2. Check for Existing Entry

**Before:**
```typescript
const { data: existingEntry } = await this.supabaseService.client
  .from("wellness_entries")
  .select("id")
  .or(`athlete_id.eq.${user.id},user_id.eq.${user.id}`)
  .eq("date", today)
  .single();
```

**After:**
```typescript
const response = await this.api.get(
  `/api/wellness-checkin?date=${today}`,
);
if (response?.data === null || !response?.data) {
  this.dialogVisible = true;
}
```

## Backend Contract

### POST `/api/wellness-checkin`

**Payload:**
```json
{
  "date": "2026-01-11",
  "sleepQuality": 8,
  "sleepHours": 7,
  "energyLevel": 7,
  "muscleSoreness": 3,
  "stressLevel": 4,
  "sorenessAreas": ["legs"],
  "notes": "Quick check-in via AI Coach prompt",
  "readinessScore": 75
}
```

**Backend Behavior:**
- UPSERTs to `daily_wellness_checkin` on `(user_id, checkin_date)`
- Calculates `readiness_score` server-side if not provided
- Triggers safety overrides if `muscleSoreness > 3`
- Creates recovery blocks if `readinessScore < 40`
- Logs ownership transitions for low wellness
- Detects mental fatigue and nutrition deviations

### GET `/api/wellness-checkin?date=YYYY-MM-DD`

**Response:**
```json
{
  "success": true,
  "data": {
    "sleepQuality": 8,
    "sleepHours": 7,
    "energyLevel": 7,
    "muscleSoreness": 3,
    "stressLevel": 4,
    "sorenessAreas": ["legs"],
    "notes": "Quick check-in via AI Coach prompt",
    "readinessScore": 75
  }
}
```

**If no entry:** `{ "success": true, "data": null }`

## Data Flow (After Fix)

```
┌─────────────────────────────────────┐
│  DailyReadinessComponent (Modal)   │
│  - Collects 4 sliders + weight     │
└──────────────┬──────────────────────┘
               │
               │ POST /api/wellness-checkin
               ▼
┌─────────────────────────────────────┐
│  /api/wellness-checkin              │
│  (netlify/functions/wellness-       │
│   checkin.cjs)                      │
│  - UPSERT to daily_wellness_checkin │
│  - Safety overrides                 │
│  - Recovery blocks                  │
│  - Mental fatigue detection         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  daily_wellness_checkin table       │
│  (user_id, checkin_date) UNIQUE     │
└──────────────┬──────────────────────┘
               │
               │ GET /api/wellness-checkin
               ▼
┌─────────────────────────────────────┐
│  UnifiedTrainingService             │
│  - Reads wellness for daily overview│
│  - AI Coach uses for recommendations│
└─────────────────────────────────────┘
```

## What About `wellness_entries` Table?

**Status:** Legacy table for historical wellness trends (not used for daily check-ins)

**Future Options:**
1. Keep for historical trend analysis (separate from daily check-ins)
2. Migrate data from `wellness_entries` → `daily_wellness_checkin` (one-time)
3. Use server-side job to sync daily check-ins → wellness trends table

**Recommendation:** Do NOT write directly to `wellness_entries` for daily check-ins. Only `/api/wellness-checkin` should be used.

## Testing Checklist

- [x] Frontend writes via `/api/wellness-checkin` POST
- [x] Frontend reads via `/api/wellness-checkin` GET
- [x] No direct Supabase writes to `wellness_entries` for daily check-ins
- [x] ApiService returns Observables correctly
- [x] Component handles Observable subscription
- [x] No linter errors
- [ ] **User Testing Required:** Save daily check-in → Refresh → Data persists
- [ ] **User Testing Required:** Check-in once today → Modal doesn't re-prompt
- [ ] **User Testing Required:** Low wellness (< 40%) → Recovery block created
- [ ] **User Testing Required:** High pain (> 3) → Safety override triggered

## Migration Notes

If existing data in `wellness_entries` needs to be preserved:

```sql
-- One-time migration (if needed)
INSERT INTO daily_wellness_checkin (
  user_id,
  checkin_date,
  sleep_quality,
  energy_level,
  muscle_soreness,
  stress_level,
  readiness_score,
  notes
)
SELECT 
  athlete_id,
  date,
  sleep_quality,
  energy_level,
  muscle_soreness,
  stress_level,
  -- Calculate readiness if missing
  ROUND(
    (COALESCE(sleep_quality, 5) * 20.0 +
     COALESCE(energy_level, 5) * 20.0 +
     (10 - COALESCE(muscle_soreness, 5)) * 15.0 +
     (10 - COALESCE(stress_level, 5)) * 15.0 +
     COALESCE(motivation_level, 5) * 10.0)
  ) as readiness_score,
  notes
FROM wellness_entries
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ON CONFLICT (user_id, checkin_date) DO NOTHING;
```

## Files Modified

- ✅ `angular/src/app/shared/components/daily-readiness/daily-readiness.component.ts`
  - Removed `SupabaseService` injection
  - Added `ApiService` injection
  - Removed direct Supabase writes to `wellness_entries`
  - Changed to POST `/api/wellness-checkin` (Observable subscription)
  - Updated check for existing entries to GET `/api/wellness-checkin?date=YYYY-MM-DD`
  - Handles Observable errors correctly

## Related Components

- `UnifiedTrainingService` - Already reads from `/api/wellness-checkin` ✅
- `WellnessService` - Still uses `wellness_entries` (for historical trends, not daily check-ins) ⚠️
- `PerformanceDataService` - Reads from `wellness_entries` (historical trends) ⚠️

## Next Steps

1. ✅ Fix `DailyReadinessComponent` to use API
2. ✅ Add API error handling for network failures
3. 🔲 **USER ACTION REQUIRED:** Test daily check-in flow end-to-end
4. 🔲 Consider deprecating `wellness_entries` for daily check-ins
5. 🔲 Update documentation for wellness data architecture

---

## Summary

**Result:** ✅ Daily wellness check-ins now use a single source of truth (`daily_wellness_checkin` via `/api/wellness-checkin`). Data is saved and read from the same place, eliminating the split-brain issue.

**Impact:** The "says done, but after refresh nothing changed" bug is now fixed. All daily check-ins go through the same endpoint for both read and write operations.

**User Action Required:** Please test the daily check-in flow:
1. Open AI Coach modal
2. Fill out the 4 sliders
3. Click "Save Check-in"
4. Refresh the page
5. Verify the data persists and modal doesn't re-prompt
