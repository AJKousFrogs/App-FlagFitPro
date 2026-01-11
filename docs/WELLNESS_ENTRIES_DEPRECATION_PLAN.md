# Wellness Entries Deprecation Analysis

**Date:** 2026-01-11  
**Status:** Analysis & Recommendation  
**Risk Level:** MEDIUM (requires careful migration)

---

## Current State

### Two Wellness Tables

| Table | Current Usage | Purpose |
|-------|--------------|---------|
| `daily_wellness_checkin` | ✅ Daily check-ins via `/api/wellness-checkin` | Single source of truth for today's wellness |
| `wellness_entries` | ⚠️ Multiple legacy usages | Historical trends, exports, calculations |

---

## `wellness_entries` Usage Analysis

### 1. **READ Operations (13 locations)**

#### A. Historical Trend Analysis (Keep - High Value)
- **`WellnessService.getWellnessData()`** - Fetches 30-day wellness trends
- **`PerformanceDataService`** - Includes in performance exports
- **`DataExportService`** - User data exports
- **`SettingsComponent`** - Export wellness history

#### B. Legacy Check-ins & Calculations (Migrate to API)
- **`UnifiedTrainingService.checkWellnessForTraining()`** - Gets latest wellness
  - ⚠️ Should use `/api/wellness-checkin` instead
- **`AiTrainingSchedulerComponent`** - Loads wellness for athlete metrics
  - ⚠️ Should use `/api/wellness-checkin` instead
- **`ProfileComponent`** - Loads wellness for performance score (last 7 days)
  - ⚠️ Should use `/api/wellness-checkin` or read from `daily_wellness_checkin`
- **`RecoveryService`** - Gets latest wellness entry
  - ⚠️ Should use `/api/wellness-checkin` instead
- **`TrainingSafetyComponent`** - Calculates sleep debt
  - ⚠️ Should use `/api/wellness-checkin` or read from `daily_wellness_checkin`
- **`MissingDataDetectionService`** - Checks for wellness data
  - ⚠️ Should check `daily_wellness_checkin` instead

#### C. Admin/Metadata
- **`AdminService`** - Counts records for backup size estimation
  - ℹ️ Can be updated after migration

#### D. Injury Notes (Edge Case)
- **`DirectSupabaseApiService`** - Checks wellness notes for injury keywords
  - ⚠️ Should read from `daily_wellness_checkin` instead

---

### 2. **WRITE Operations (2 locations)**

#### A. Legacy Manual Entry
- **`WellnessService.logWellness()`** - Direct insert to `wellness_entries`
  - ⚠️ **DEPRECATED** - Should route through `/api/wellness-checkin`
  - Used by unknown components (manual wellness logging?)

#### B. Onboarding Injury History
- **`OnboardingComponent`** - UPSERT wellness entry with injury notes
  - ⚠️ **SPECIAL CASE** - Creates wellness entry during onboarding
  - Should create `daily_wellness_checkin` entry instead

---

## Recommendation: Phased Deprecation

### ❌ Do NOT Fully Deprecate Yet

**Reasons:**
1. **Historical data** - `wellness_entries` contains valuable historical wellness data
2. **Multiple read dependencies** - 13 locations read from this table
3. **Export functionality** - Users expect to export their wellness history
4. **No migration path yet** - Old data would be lost if we drop the table

### ✅ Recommended Approach: Dual-Write Strategy

**Phase 1: Stop New Writes to `wellness_entries`** (Current)
- ✅ `DailyReadinessComponent` now uses `/api/wellness-checkin` ✅ DONE
- 🔲 Deprecate `WellnessService.logWellness()` method
- 🔲 Update `OnboardingComponent` to write to `daily_wellness_checkin`

**Phase 2: Add Server-Side Sync**
- 🔲 Backend writes to BOTH tables temporarily (dual-write)
- 🔲 `/api/wellness-checkin` POST also writes to `wellness_entries` for historical continuity
- 🔲 Add migration script to copy `daily_wellness_checkin` → `wellness_entries` for historical records

**Phase 3: Migrate Reads**
- 🔲 Update all "latest wellness" queries to use `/api/wellness-checkin` API
- 🔲 Update historical trend queries to read from `daily_wellness_checkin` (once data is backfilled)
- 🔲 Update export services to read from `daily_wellness_checkin`

**Phase 4: Deprecate `wellness_entries`**
- 🔲 Mark table as read-only (disable writes except migration)
- 🔲 Add deprecation warnings in logs
- 🔲 Eventually drop table after 6+ months

---

## Immediate Actions (Phase 1)

### 1. Deprecate `WellnessService.logWellness()`

**Current:** Direct insert to `wellness_entries`  
**New:** Route through `/api/wellness-checkin`

```typescript
// OLD (in WellnessService)
logWellness(data: Partial<WellnessData>): Observable<...> {
  return from(
    this.supabaseService.client
      .from("wellness_entries")
      .insert(wellnessEntry)
      .select()
      .maybeSingle(),
  )
}

// NEW (in WellnessService) - Route to API
logWellness(data: Partial<WellnessData>): Observable<...> {
  // Map to API format
  const payload = {
    date: data.date || new Date().toISOString().split('T')[0],
    sleepQuality: data.sleep,
    sleepHours: data.sleepHours,
    energyLevel: data.energy,
    muscleSoreness: data.soreness,
    stressLevel: data.stress,
    notes: data.notes,
  };
  
  // Use API instead of direct write
  return this.api.post('/api/wellness-checkin', payload);
}
```

### 2. Update Onboarding Injury History

**Current:** UPSERT to `wellness_entries`  
**New:** POST to `/api/wellness-checkin`

```typescript
// OLD (in OnboardingComponent)
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

// NEW (in OnboardingComponent)
this.api.post('/api/wellness-checkin', {
  date: today,
  notes: injuryHistoryNotes || null,
  sleepQuality: 5,
  energyLevel: 5,
  muscleSoreness: injurySoreness || 0,
  stressLevel: 5,
}).subscribe({
  next: () => console.log('Wellness entry created'),
  error: (err) => console.error('Failed to create wellness entry', err)
});
```

### 3. Migrate "Latest Wellness" Reads to API

**Files to Update:**
- `UnifiedTrainingService.checkWellnessForTraining()` → Use `/api/wellness-checkin?date=today`
- `AiTrainingSchedulerComponent` → Use `/api/wellness-checkin?date=today`
- `RecoveryService` → Use `/api/wellness-checkin?date=today`
- `DirectSupabaseApiService` → Use `/api/wellness-checkin?date=today`

**Pattern:**

```typescript
// OLD
const { data } = await this.supabase.client
  .from("wellness_entries")
  .select("*")
  .eq("athlete_id", userId)
  .order("date", { ascending: false })
  .limit(1)
  .single();

// NEW
this.api.get(`/api/wellness-checkin?date=${today}`).subscribe({
  next: (response) => {
    const data = response?.data;
    // Use data...
  }
});
```

---

## Medium-Term Actions (Phase 2)

### Add Dual-Write to Backend

Update `wellness-checkin.cjs` to write to BOTH tables:

```javascript
// After successful upsert to daily_wellness_checkin
const { data, error } = await supabase
  .from("daily_wellness_checkin")
  .upsert({ ... })
  .select()
  .single();

if (!error && data) {
  // ALSO write to wellness_entries for historical continuity
  await supabase.from("wellness_entries").insert({
    athlete_id: userId,
    date: targetDate,
    sleep_quality: sleepQuality,
    energy_level: energyLevel,
    muscle_soreness: muscleSoreness,
    stress_level: stressLevel,
    notes: notes,
    created_at: new Date().toISOString(),
  }).select().maybeSingle();
  // Ignore errors on this write (legacy table)
}
```

**Benefit:** Historical continuity maintained while transitioning to new table.

---

## Long-Term Actions (Phase 3 & 4)

### Phase 3: Migrate Historical Reads

**Update services to read from `daily_wellness_checkin` for historical trends:**

```typescript
// WellnessService.getWellnessData() - Change table name
const { data, error } = await this.supabaseService.client
  .from("daily_wellness_checkin") // Changed from wellness_entries
  .select("*")
  .eq("user_id", userId)
  .gte("checkin_date", cutoffDate.toISOString().split("T")[0])
  .order("checkin_date", { ascending: false });
```

**Update all export services:**
- `DataExportService.exportWellnessData()` → Read from `daily_wellness_checkin`
- `PerformanceDataService` → Read from `daily_wellness_checkin`
- `SettingsComponent` export → Read from `daily_wellness_checkin`

### Phase 4: Full Deprecation

1. **Backfill historical data:**
   ```sql
   INSERT INTO daily_wellness_checkin (
     user_id, checkin_date, sleep_quality, energy_level,
     muscle_soreness, stress_level, notes
   )
   SELECT 
     athlete_id, date, sleep_quality, energy_level,
     muscle_soreness, stress_level, notes
   FROM wellness_entries
   WHERE date < CURRENT_DATE - INTERVAL '1 day' -- Don't duplicate today's data
   ON CONFLICT (user_id, checkin_date) DO NOTHING;
   ```

2. **Mark table as deprecated in schema**
3. **Remove dual-write** after 1+ month
4. **Drop table** after 6+ months (once confident all reads migrated)

---

## Migration Checklist

### ✅ Phase 1: Stop New Writes (CURRENT)
- [x] ✅ `DailyReadinessComponent` uses `/api/wellness-checkin`
- [ ] 🔲 Deprecate `WellnessService.logWellness()` (route to API)
- [ ] 🔲 Update `OnboardingComponent` to use `/api/wellness-checkin`
- [ ] 🔲 Update "latest wellness" reads to use `/api/wellness-checkin`

### 🔲 Phase 2: Dual-Write (1-2 weeks)
- [ ] Add dual-write to `wellness-checkin.cjs` backend
- [ ] Test dual-write doesn't cause conflicts
- [ ] Monitor for errors

### 🔲 Phase 3: Migrate Reads (2-4 weeks)
- [ ] Update `WellnessService.getWellnessData()` to read from `daily_wellness_checkin`
- [ ] Update all export services
- [ ] Update all "latest wellness" reads still using direct queries
- [ ] Update historical trend calculations

### 🔲 Phase 4: Deprecate Table (6+ months)
- [ ] Backfill all historical data to `daily_wellness_checkin`
- [ ] Verify all reads migrated
- [ ] Remove dual-write
- [ ] Mark table as deprecated
- [ ] Eventually drop table

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Data loss | HIGH | Use dual-write during transition |
| Export breaks | MEDIUM | Update export services before removing dual-write |
| Historical trends break | MEDIUM | Backfill data before migrating reads |
| Performance impact | LOW | Both tables indexed on user_id/athlete_id + date |

---

## Recommendation Summary

**DO NOW (This Week):**
1. ✅ Keep `daily_wellness_checkin` as single source of truth for NEW check-ins
2. 🔲 Deprecate `WellnessService.logWellness()` - route to `/api/wellness-checkin`
3. 🔲 Update onboarding to use `/api/wellness-checkin`
4. 🔲 Update 5-6 "latest wellness" queries to use API instead of direct DB reads

**DO LATER (2-8 weeks):**
- Add dual-write to backend (ensures historical continuity)
- Migrate historical trend queries to read from `daily_wellness_checkin`
- Update export services

**DO MUCH LATER (6+ months):**
- Fully deprecate `wellness_entries` table
- Drop table after confidence period

**DO NOT:**
- ❌ Drop `wellness_entries` table immediately (data loss risk)
- ❌ Stop reading from `wellness_entries` before dual-write is in place
- ❌ Remove `wellness_entries` without backfilling historical data

---

## Conclusion

**`wellness_entries` should NOT be fully deprecated yet**, but we should:
1. ✅ Stop NEW writes (except via dual-write strategy)
2. Gradually migrate reads to `daily_wellness_checkin`
3. Maintain historical data integrity
4. Plan for eventual deprecation after 6+ months

This is a **phased migration**, not an immediate deprecation.

---

**Next Steps:** See "Migration Checklist" above for detailed action items.
