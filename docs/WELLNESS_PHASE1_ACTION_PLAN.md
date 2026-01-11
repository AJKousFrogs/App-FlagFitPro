# Wellness Deprecation - Phase 1 Action Plan

**Status:** ✅ COMPLETE (2026-01-11)  
**Effort:** ~4-6 hours  
**Risk:** LOW

---

## ✅ Phase 1 Complete

All Phase 1 tasks have been completed:

- [x] `DailyReadinessComponent` routes to `/api/wellness-checkin`
- [x] `WellnessService.logWellness()` now routes to `/api/wellness-checkin`
- [x] `OnboardingComponent` uses `/api/wellness-checkin`
- [x] `UnifiedTrainingService.checkWellnessForTraining()` uses API
- [x] `AiTrainingSchedulerComponent` uses API
- [x] `RecoveryService.getRecoveryMetrics()` uses API
- [x] `DirectSupabaseApiService` uses API
- [x] `TrainingSafetyComponent` reads from `daily_wellness_checkin`
- [x] `MissingDataDetectionService` reads from `daily_wellness_checkin`

---

## Result

- **0 writes** to `wellness_entries` from Angular app
- **6 reads** remaining from `wellness_entries` (historical/export data only)
- All daily wellness operations now use `/api/wellness-checkin` endpoint

---

## Verification

```bash
# Verify no writes to wellness_entries
rg "wellness_entries.*insert" angular/src/app --type ts
rg "wellness_entries.*upsert" angular/src/app --type ts
# Result: 0 matches

# Verify API usage
rg "/api/wellness-checkin" angular/src/app --type ts
# Result: 13 matches
```

---

## Next Steps

**Phase 2: Dual-Write** ✅ COMPLETE (2026-01-11)
- ✅ Added dual-write to `wellness-checkin.cjs` backend
- Both `daily_wellness_checkin` and `wellness_entries` now stay in sync

**Phase 3: Migrate Historical Reads** ✅ COMPLETE (2026-01-11)
- ✅ All 6 `wellness_entries` reads migrated to `daily_wellness_checkin`
- **0 reads/writes to `wellness_entries` from Angular app**

**Phase 4: Full Deprecation** (Future)
- Remove dual-write from backend
- Archive/drop `wellness_entries` table
- Timeline: 6+ months after Phase 3

See:
- `docs/WELLNESS_ENTRIES_DEPRECATION_PLAN.md` - Full migration strategy
- `docs/WELLNESS_DOCUMENTATION_INDEX.md` - Documentation index
