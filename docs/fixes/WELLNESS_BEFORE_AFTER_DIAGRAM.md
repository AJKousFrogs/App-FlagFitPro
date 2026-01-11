# Wellness Data Flow - Before vs After

## BEFORE (Split-Brain Issue) ❌

```
┌─────────────────────────────────────┐
│  DailyReadinessComponent            │
│  User fills 4 sliders               │
└──────────────┬──────────────────────┘
               │
               │ WRITE PATH
               │ Direct Supabase query
               ▼
┌─────────────────────────────────────┐
│  wellness_entries table             │
│  athlete_id, date, sleep_quality... │
│  ❌ Data saved here                 │
└─────────────────────────────────────┘


                    ❌ SPLIT-BRAIN ❌


┌─────────────────────────────────────┐
│  UnifiedTrainingService             │
│  Reads wellness for today           │
└──────────────┬──────────────────────┘
               │
               │ READ PATH
               │ GET /api/wellness-checkin
               ▼
┌─────────────────────────────────────┐
│  daily_wellness_checkin table       │
│  user_id, checkin_date...           │
│  ✅ Looking for data here           │
│  ❌ But data is in wellness_entries │
└─────────────────────────────────────┘

Result: User sees "Saved successfully!" but refresh shows nothing.
```

---

## AFTER (Single Source of Truth) ✅

```
┌─────────────────────────────────────┐
│  DailyReadinessComponent            │
│  User fills 4 sliders               │
└──────────────┬──────────────────────┘
               │
               │ WRITE PATH
               │ POST /api/wellness-checkin
               ▼
┌─────────────────────────────────────┐
│  /api/wellness-checkin              │
│  Netlify Function                   │
│  - Validates data                   │
│  - UPSERT daily_wellness_checkin    │
│  - Triggers safety overrides        │
│  - Creates recovery blocks          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  daily_wellness_checkin table       │
│  user_id, checkin_date...           │
│  ✅ Single source of truth          │
└──────────────▲──────────────────────┘
               │
               │ READ PATH
               │ GET /api/wellness-checkin
               │
┌──────────────┴──────────────────────┐
│  UnifiedTrainingService             │
│  AI Coach, Dashboard, etc.          │
└─────────────────────────────────────┘

Result: Data saved and read from same place. Refresh shows correct data.
```

---

## Key Changes

### 1. Component Level
**Before:**
```typescript
// Direct Supabase write
const { error } = await this.supabaseService.client
  .from("wellness_entries")
  .upsert(wellnessData);
```

**After:**
```typescript
// API endpoint (Observable)
this.api.post("/api/wellness-checkin", wellnessPayload).subscribe({
  next: () => { /* success */ },
  error: (err) => { /* handle error */ }
});
```

### 2. Check Existing Entry
**Before:**
```typescript
// Query wellness_entries
const { data } = await this.supabaseService.client
  .from("wellness_entries")
  .select("id")
  .eq("date", today)
  .single();
```

**After:**
```typescript
// Query via API (reads from daily_wellness_checkin)
this.api.get(`/api/wellness-checkin?date=${today}`).subscribe({
  next: (response) => {
    if (!response?.data) {
      this.dialogVisible = true;
    }
  }
});
```

### 3. Backend Contract
**Endpoint:** `POST /api/wellness-checkin`

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
  "notes": "Quick check-in via AI Coach prompt"
}
```

**Backend Action:**
```sql
-- UPSERT ensures one row per user per day
INSERT INTO daily_wellness_checkin (
  user_id, checkin_date, sleep_quality, ...
) VALUES (...)
ON CONFLICT (user_id, checkin_date) 
DO UPDATE SET ...
```

---

## What About `wellness_entries` Table?

| Table | Purpose | Used For |
|-------|---------|----------|
| `daily_wellness_checkin` | Daily check-ins | ✅ Single source of truth for today's wellness |
| `wellness_entries` | Historical trends | Legacy table for long-term analytics (optional) |

**Decision:** `wellness_entries` is now ONLY for historical trend analysis, NOT for daily check-ins.

**Future Options:**
1. Keep both tables (daily check-ins vs long-term trends)
2. Deprecate `wellness_entries` entirely
3. Server-side job to sync daily → trends

---

## Verification Steps

### 1. Check Frontend Never Writes to `wellness_entries`
```bash
# Should return NO results for daily check-ins
rg "wellness_entries.*insert" angular/src/app
rg "wellness_entries.*upsert" angular/src/app
```

### 2. Check All Reads Use API
```bash
# Should use /api/wellness-checkin
rg "wellness-checkin" angular/src/app
```

### 3. Check Backend UPSERT Logic
```bash
# netlify/functions/wellness-checkin.cjs line 285-305
# Should have onConflict: "user_id,checkin_date"
```

---

## Testing Scenarios

### Scenario 1: First Check-in of the Day
1. User opens AI Coach
2. Modal shows (no existing entry)
3. User fills 4 sliders
4. Clicks "Save Check-in"
5. **Expected:** Success toast, modal closes
6. User refreshes page
7. **Expected:** Modal does NOT re-appear (entry exists)

### Scenario 2: Second Check-in (Update)
1. User already checked in today
2. User opens AI Coach
3. **Expected:** Modal does NOT show (entry exists)
4. User manually opens daily check-in
5. Changes values, saves
6. **Expected:** UPSERT updates existing row (same user_id, checkin_date)

### Scenario 3: Low Wellness Triggers
1. User check-in with readiness < 40%
2. **Expected:** Backend creates recovery block for tomorrow
3. **Expected:** Notification sent to coach
4. **Expected:** Ownership transition logged

### Scenario 4: High Pain Triggers
1. User check-in with pain > 3/10
2. **Expected:** Safety override triggered
3. **Expected:** Pain flag logged

---

## Files Changed

| File | Change |
|------|--------|
| `daily-readiness.component.ts` | ✅ Removed SupabaseService, uses ApiService |
| `wellness-checkin.cjs` | ✅ Already has UPSERT logic |
| `netlify.toml` | ✅ Redirects already configured |

---

## Rollback Plan (if needed)

If this causes issues, revert by:

```bash
git checkout HEAD~1 -- angular/src/app/shared/components/daily-readiness/
```

Then investigate why `/api/wellness-checkin` is failing.

---

## Success Criteria

✅ User saves daily check-in  
✅ Refresh shows saved data  
✅ Modal doesn't re-prompt after save  
✅ No "says done, but after refresh nothing changed" bug  
✅ All wellness reads/writes use same table  

---

**Fix Applied:** 2026-01-11  
**Status:** Code complete, ready for user testing  
**Risk:** Low (API endpoint already tested, just routing component through it)
