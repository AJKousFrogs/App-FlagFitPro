# Wellness Deprecation - Immediate Action Plan

**Priority:** MEDIUM  
**Timeline:** This Week (Phase 1)  
**Effort:** ~4-6 hours  
**Risk:** LOW (incremental changes)

---

## ✅ Already Complete

- [x] `DailyReadinessComponent` routes to `/api/wellness-checkin` (not `wellness_entries`)
- [x] Documentation created for deprecation strategy

---

## 🔲 TODO This Week (Phase 1)

### 1. Deprecate `WellnessService.logWellness()` Method
**File:** `angular/src/app/core/services/wellness.service.ts`  
**Lines:** 295-384  
**Effort:** ~30 minutes  
**Risk:** LOW (method might not be used)

**Action:**
```typescript
// Add @deprecated JSDoc comment
/**
 * Log wellness entry for today or specific date
 * @deprecated Use /api/wellness-checkin endpoint instead
 * @see DailyReadinessComponent for example usage
 * 
 * This method writes directly to wellness_entries table.
 * NEW CODE SHOULD USE: this.api.post('/api/wellness-checkin', payload)
 */
logWellness(data: Partial<WellnessData>): Observable<...> {
  this.logger.warn('[Wellness] DEPRECATED: logWellness() writes to legacy table. Use /api/wellness-checkin instead.');
  
  // Keep existing implementation for now, but log warning
  // Will be removed in Phase 3
  ...existing code...
}
```

**Verification:**
```bash
# Check if this method is called anywhere
rg "\.logWellness\(" angular/src/app --type ts
```

---

### 2. Update Onboarding to Use API
**File:** `angular/src/app/features/onboarding/onboarding.component.ts`  
**Lines:** 3422-3440  
**Effort:** ~20 minutes  
**Risk:** LOW (onboarding already has error handling)

**Current Code:**
```typescript
const { error } = await this.supabaseService.client
  .from("wellness_entries")
  .upsert({
    athlete_id: userId,
    user_id: userId,
    date: today,
    notes: injuryHistoryNotes || null,
    sleep_quality: 5,
    energy_level: 5,
    muscle_soreness: injurySoreness || 0,
  }, {
    onConflict: "athlete_id,date",
  });
```

**New Code:**
```typescript
// Use API endpoint instead of direct DB write
this.api.post('/api/wellness-checkin', {
  date: today,
  notes: injuryHistoryNotes || null,
  sleepQuality: 5,
  sleepHours: 7,
  energyLevel: 5,
  muscleSoreness: injurySoreness || 0,
  stressLevel: 5,
  sorenessAreas: injurySoreness > 3 ? ['general'] : [],
}).subscribe({
  next: () => {
    this.logger.success('[Onboarding] Wellness entry created via API');
  },
  error: (err) => {
    this.logger.error('[Onboarding] Failed to create wellness entry:', err);
    // Non-fatal - continue with onboarding
  }
});
```

**Verification:**
```bash
# Test onboarding flow with injury history
# Should create entry in daily_wellness_checkin (not wellness_entries)
```

---

### 3. Migrate "Latest Wellness" Reads to API

Update 6 locations that read "latest wellness" from `wellness_entries`:

#### 3a. UnifiedTrainingService.checkWellnessForTraining()
**File:** `angular/src/app/core/services/unified-training.service.ts`  
**Lines:** 1018-1031  
**Effort:** ~15 minutes

**Current:**
```typescript
private async checkWellnessForTraining(userId: string) {
  const { data } = await this.supabase.client
    .from("wellness_entries")
    .select("*")
    .eq("athlete_id", userId)
    .order("date", { ascending: false })
    .limit(1)
    .single();
  
  if (!data) return { alert: null, readinessScore: 0 };
  // ...
}
```

**New:**
```typescript
private async checkWellnessForTraining(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await firstValueFrom(
      this.api.get(`/api/wellness-checkin?date=${today}`)
    );
    
    const data = response?.data;
    if (!data) return { alert: null, readinessScore: 0 };
    
    // Map API response to expected format
    const wellness = {
      sleep_quality: data.sleepQuality,
      energy_level: data.energyLevel,
      muscle_soreness: data.muscleSoreness,
      stress_level: data.stressLevel,
    };
    
    // ...rest of logic...
  } catch (error) {
    this.logger.error('[Training] Failed to get wellness:', error);
    return { alert: null, readinessScore: 0 };
  }
}
```

#### 3b. AiTrainingSchedulerComponent
**File:** `angular/src/app/features/training/ai-training-scheduler/ai-training-scheduler.component.ts`  
**Lines:** 413-421  
**Effort:** ~10 minutes

**Similar pattern:** Replace direct DB read with API call.

#### 3c. RecoveryService
**File:** `angular/src/app/core/services/recovery.service.ts`  
**Lines:** 342-354  
**Effort:** ~10 minutes

#### 3d. DirectSupabaseApiService
**File:** `angular/src/app/core/services/direct-supabase-api.service.ts`  
**Lines:** 245-258  
**Effort:** ~15 minutes  
**Note:** This checks wellness notes for injury keywords - needs special handling

#### 3e. TrainingSafetyComponent
**File:** `angular/src/app/features/training/training-safety/training-safety.component.ts`  
**Lines:** 515-528  
**Effort:** ~15 minutes  
**Note:** Calculates sleep debt from last 7 days - needs API to support date ranges

#### 3f. MissingDataDetectionService
**File:** `angular/src/app/core/services/missing-data-detection.service.ts`  
**Lines:** 41-54  
**Effort:** ~10 minutes

---

## Estimated Time Breakdown

| Task | Effort | Risk |
|------|--------|------|
| 1. Deprecate logWellness() | 30 min | LOW |
| 2. Update onboarding | 20 min | LOW |
| 3a. UnifiedTrainingService | 15 min | LOW |
| 3b. AiTrainingScheduler | 10 min | LOW |
| 3c. RecoveryService | 10 min | LOW |
| 3d. DirectSupabaseApi | 15 min | MEDIUM |
| 3e. TrainingSafety | 15 min | MEDIUM |
| 3f. MissingDataDetection | 10 min | LOW |
| Testing | 60 min | - |
| **TOTAL** | **3-4 hours** | **LOW-MEDIUM** |

---

## Testing Plan

### Test 1: Daily Check-in (Already Works)
✅ Open AI Coach → Fill sliders → Save → Refresh → Data persists

### Test 2: Onboarding with Injury History
1. Create new account
2. Go through onboarding
3. Add injury history with soreness
4. Complete onboarding
5. **Verify:** Entry created in `daily_wellness_checkin` (not `wellness_entries`)

### Test 3: Training Safety Check
1. Have wellness check-in for today
2. Try to schedule training
3. **Verify:** Training safety uses today's wellness data

### Test 4: Recovery Service
1. Have wellness check-in for today
2. View recovery metrics
3. **Verify:** Recovery service uses today's wellness data

### Test 5: Missing Data Detection
1. Skip wellness check-in for today
2. View missing data alerts
3. **Verify:** Service detects missing wellness

---

## Verification Commands

```bash
# 1. Check no NEW writes to wellness_entries (should be 0)
rg "wellness_entries.*insert" angular/src/app --type ts
rg "wellness_entries.*upsert" angular/src/app --type ts

# 2. Check deprecated method usage (should find the definition + maybe calls)
rg "\.logWellness\(" angular/src/app --type ts

# 3. Check "latest wellness" reads still using wellness_entries (should decrease)
rg "wellness_entries.*limit\(1\)" angular/src/app --type ts

# 4. Verify API usage increased
rg "/api/wellness-checkin" angular/src/app --type ts
```

---

## Rollback Plan

If issues arise:

```bash
# Revert specific files
git checkout HEAD -- angular/src/app/features/onboarding/onboarding.component.ts
git checkout HEAD -- angular/src/app/core/services/unified-training.service.ts

# Or revert entire Phase 1
git revert <commit-hash>
```

---

## Success Criteria

Phase 1 is complete when:
- ✅ No new writes to `wellness_entries` (except historical reads)
- ✅ `WellnessService.logWellness()` marked as deprecated
- ✅ Onboarding uses `/api/wellness-checkin`
- ✅ 5-6 "latest wellness" reads use `/api/wellness-checkin`
- ✅ All tests pass
- ✅ No regressions in production

---

## After Phase 1

Wait 1-2 weeks to monitor for issues, then proceed to:
- **Phase 2:** Add dual-write to backend (see `WELLNESS_MIGRATION_VISUAL_GUIDE.md`)

---

## Questions?

See full documentation:
- `docs/WELLNESS_ENTRIES_DEPRECATION_PLAN.md` - Complete strategy
- `docs/WELLNESS_MIGRATION_VISUAL_GUIDE.md` - Visual diagrams
- `docs/fixes/WELLNESS_SINGLE_SOURCE_OF_TRUTH.md` - Split-brain fix details

---

**Ready to start?** Begin with Task 1 (deprecate `logWellness()`) as it's the lowest risk.
