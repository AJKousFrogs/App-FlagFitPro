# Real + Demo / Real + Partial Analysis

**Date:** January 29, 2026  
**Status:** Analysis Complete

---

## Summary

This document explains why certain routes are marked as "Real + Demo" or "Real + Partial" in `ROUTES_DATA_AUDIT.md`.

---

## Routes Marked as "Real + Demo" or "Real + Partial"

### 1. `/todays-practice` - `TodayComponent` - ✅ **Real + Demo**

**Why "Real + Demo":**

The component uses `resolveTodayState()` resolver which:
- ✅ **Real Data:** Loads protocol data from `daily-protocol.cjs` and `training-sessions.cjs` APIs
- ⚠️ **Demo Fallback:** When protocol generation fails or no data exists, the resolver creates a fallback `TodayViewModel` with:
  - Empty protocol blocks
  - Default state (check-in phase)
  - Demo/placeholder content structure

**Evidence:**
```typescript
// today.component.ts lines 1487, 1500, 1527, 1537
this.todayViewModel.set(resolveTodayState(null, this.currentTime()));
// When protocolJson is null, resolver creates fallback demo state
```

**Recommendation:** 
- The fallback is intentional for UX (shows empty state with "Generate Protocol" button)
- This is acceptable - it's not "demo data" per se, but a graceful fallback
- Consider updating audit to "Real + Fallback" instead of "Real + Demo"

---

### 2. `/player-dashboard` - `PlayerDashboardComponent` - ✅ **Real + Partial**

**Why "Real + Partial":**

The component loads real data from APIs but has **hardcoded defaults** for some values:

**Real Data:**
- ✅ ACWR from `TrainingStatsCalculationService` (real API)
- ✅ Training stats from `trainingStatsService.getTrainingStats()` (real API)
- ✅ Today's schedule from `UnifiedTrainingService` (real API)
- ✅ User name from `AuthService` (real)

**Partial/Hardcoded Values:**
- ⚠️ **Readiness Score:** Hardcoded to `75` (line 1723)
  ```typescript
  this.readinessScore.set(75); // Readiness comes from wellness service, not training stats
  ```
  - **Issue:** Should load from wellness service/API, not hardcoded
  
- ⚠️ **ACWR Default:** Falls back to `0.85` if API returns null (line 1722)
  ```typescript
  const acwrValue = stats?.acwr ?? 0.85;
  ```
  - **Issue:** This is acceptable fallback, but should be documented
  
- ⚠️ **Training Days Logged:** Hardcoded to `12` with demo comment (line 1538)
  ```typescript
  trainingDaysLogged = signal(12); // Number of days with training data (for demo: 12/21)
  ```
  - **Issue:** Should calculate from actual training data
  
- ⚠️ **Announcement:** Structure exists but values are null (lines 1702-1707)
  ```typescript
  this.announcement.set({
    message: null, // From backend: e.g., "Practice tomorrow moved to 6PM..."
    coachName: null, // From backend
    postedAt: null, // From backend
    priority: "info",
  });
  ```
  - **Issue:** Comment says "From backend" but not actually loading

**Recommendation:**
- Load readiness score from wellness API
- Calculate `trainingDaysLogged` from actual training sessions
- Load announcements from backend API
- Update to "Real" once these are connected

---

### 3. `/game/readiness` - `GameDayReadinessComponent` - ✅ **Real + Partial**

**Why "Real + Partial":**

**Real Data:**
- ✅ ACWR from `UnifiedTrainingService.acwrRatio` (real service)
- ✅ Submits readiness data to backend API (real)

**Partial/Hardcoded Values:**
- ⚠️ **Initial Metric Values:** All metrics start at `7` (lines 248-303)
  ```typescript
  metrics = signal<ReadinessMetric[]>([
    { key: "sleep", value: 7, ... },
    { key: "energy", value: 7, ... },
    { key: "soreness", value: 3, ... },
    // etc.
  ]);
  ```
  - **Issue:** Should load last known values from wellness API if available
  
- ⚠️ **Game Info:** Defaults to "Today's Competition" if not in route params (line 310)
  ```typescript
  gameInfo = signal("Today's Competition");
  ```
  - **Issue:** Should load actual game info from route or API

**Recommendation:**
- Load last wellness check-in values as defaults for metrics
- Load actual game info from route params or games API
- This is acceptable UX (form starts with neutral values), but could be improved

---

### 4. `/game/nutrition` - `TournamentNutritionComponent` - ✅ **Real + Partial**

**Why "Real + Partial":**

**Real Data:**
- ✅ Loads saved schedule from localStorage (user-entered data)
- ✅ Uses `NutritionService` for recommendations (real service)
- ✅ Saves nutrition logs to backend (real API)

**Partial/Hardcoded Values:**
- ⚠️ **Tournament Name:** Defaults to "Tournament Day" (line 533)
  ```typescript
  tournamentName = signal("Tournament Day");
  ```
  - **Issue:** Should load from tournament API if linked to a tournament
  
- ⚠️ **Games Array:** Starts empty, user must manually add games (line 530)
  ```typescript
  games = signal<GameSchedule[]>([]);
  ```
  - **Issue:** Should auto-load from tournament/games API if tournament ID provided
  
- ⚠️ **Nutrition Windows:** Generated algorithmically, not from backend (lines 531+)
  - **Issue:** Recommendations are real (from service), but schedule is user-entered

**Recommendation:**
- If accessed via tournament route, auto-load tournament games
- Load tournament name from API
- Keep manual entry as fallback for standalone use
- This is acceptable UX (works standalone), but could auto-populate from tournament data

---

## Summary Table

| Route | Component | Real Data | Partial/Demo Data | Status |
|-------|-----------|-----------|-------------------|--------|
| `/todays-practice` | `TodayComponent` | Protocol API, Training API | Fallback empty state | ✅ Acceptable (graceful fallback) |
| `/player-dashboard` | `PlayerDashboardComponent` | ACWR, Training Stats, Schedule | Readiness (hardcoded 75), Training days (hardcoded 12), Announcements (null) | ⚠️ Needs fixes |
| `/game/readiness` | `GameDayReadinessComponent` | ACWR, Submit API | Initial metrics (all 7), Game info (default text) | ✅ Acceptable (form defaults) |
| `/game/nutrition` | `TournamentNutritionComponent` | Nutrition Service, Save API | Tournament name (default), Games (manual entry) | ✅ Acceptable (standalone mode) |

---

## Recommendations

### High Priority (Fix These)

1. **PlayerDashboardComponent:**
   - Load readiness score from wellness API instead of hardcoding `75`
   - Calculate `trainingDaysLogged` from actual training sessions
   - Load announcements from backend API

### Medium Priority (Improve These)

2. **GameDayReadinessComponent:**
   - Load last wellness values as defaults for metrics
   - Load actual game info from route/API

3. **TournamentNutritionComponent:**
   - Auto-load tournament data if accessed via tournament route
   - Load tournament name from API

### Low Priority (Acceptable As-Is)

4. **TodayComponent:**
   - Fallback state is intentional UX design
   - Consider renaming to "Real + Fallback" instead of "Real + Demo"

---

## Conclusion

Most "Real + Partial" components are **functionally working** but have **hardcoded defaults** that should be replaced with real data. The "Real + Demo" for TodayComponent is actually a **graceful fallback** and is acceptable UX.

**Action Items:**
1. Fix PlayerDashboardComponent hardcoded values (high priority)
2. Improve GameDayReadinessComponent defaults (medium priority)
3. Enhance TournamentNutritionComponent auto-loading (medium priority)
4. Update audit terminology: "Real + Demo" → "Real + Fallback" for TodayComponent

