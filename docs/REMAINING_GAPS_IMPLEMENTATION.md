# Remaining Gaps Implementation Status

**Date:** January 2026  
**Status:** Partially Complete - Critical Items Implemented

---

## ✅ Completed Implementations

### 1. Late Logging Detection ✅
- **Status:** Fully implemented
- **Location:** `angular/src/app/features/training/training-log/training-log.component.ts`
- **Features:**
  - Detects sessions logged 24-48h late (warning)
  - Detects sessions logged >48h late (retroactive, requires approval)
  - Shows UI warnings with severity indicators
  - Automatically notifies coach for retroactive logs
  - Database fields: `log_status`, `requires_coach_approval`, `hours_delayed`

### 2. Conflict Detection ✅
- **Status:** Fully implemented
- **Location:** `angular/src/app/features/training/training-log/training-log.component.ts`
- **Features:**
  - Detects RPE vs session type conflicts
  - Shows conflict warnings in UI
  - Validates recovery sessions (max RPE 4), light sessions (max RPE 5), etc.
  - Database field: `conflicts` (JSONB array)

---

## ⚠️ Partially Implemented (Backend Ready, UI Needed)

### 3. Data Confidence Indicators
- **Backend:** ✅ `DataConfidenceService` exists and calculates confidence scores
- **UI Integration:**
  - ✅ Player Dashboard ACWR card - Integrated
  - ❌ ACWR Dashboard - Not shown
  - ❌ Game Day Readiness - Not shown
  - ❌ AI Coach responses - Not shown

**Next Steps:**
- Add confidence indicator to ACWR dashboard component
- Add confidence indicator to game day readiness component
- Add confidence context to AI Coach prompt generation

### 4. Coach Override Transparency
- **Backend:** ✅ `coach_overrides` table exists with logging
- **UI:** ❌ No display component

**Next Steps:**
- Create override history component
- Display on coach dashboard player cards
- Show "AI suggested vs Coach set" comparison

### 5. Partial Wellness Score Confidence
- **Backend:** ✅ Wellness score calculation exists
- **UI:** ❌ No confidence indicator for partial scores

**Next Steps:**
- Add confidence calculation for partial wellness (3/5 metrics)
- Display confidence badge on wellness form
- Show impact of missing metrics

---

## ❌ Not Yet Implemented

### 6. AI Coach Conservative Mode
- **Status:** Not implemented
- **Requirement:** AI should check data confidence and switch to conservative advice
- **Location:** `netlify/functions/ai-chat.cjs`, `netlify/functions/utils/groq-client.cjs`

**Implementation Plan:**
1. Check data confidence in `buildAthleteContext`
2. Add conservative mode prompt when confidence < 70%
3. Use more cautious language and recommendations

### 7. Tomorrow Preview
- **Status:** Not implemented
- **Requirement:** Show next day schedule preview on player dashboard
- **Location:** `angular/src/app/features/dashboard/player-dashboard.component.ts`

**Implementation Plan:**
1. Load tomorrow's schedule from training service
2. Add "Tomorrow" section to dashboard
3. Show preview of sessions and protocols

### 8. ACWR Confidence Range
- **Status:** Not implemented
- **Requirement:** Show confidence range when data is incomplete (e.g., "1.3 (est. 1.2-1.4)")
- **Location:** `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts`

**Implementation Plan:**
1. Calculate confidence range based on missing data
2. Display range instead of single value when confidence < 80%
3. Show confidence percentage

---

## 📊 Implementation Priority

### High Priority (User-Facing)
1. ✅ Late logging detection - **COMPLETE**
2. ✅ Conflict detection - **COMPLETE**
3. ⚠️ Data confidence indicators (ACWR dashboard, game day) - **PARTIAL**
4. ⚠️ Coach override transparency UI - **BACKEND READY**

### Medium Priority (Data Quality)
5. ⚠️ Partial wellness score confidence - **BACKEND READY**
6. ❌ AI Coach conservative mode - **NOT STARTED**
7. ❌ Tomorrow preview - **NOT STARTED**

### Low Priority (Nice-to-Have)
8. ❌ ACWR confidence range - **NOT STARTED**

---

## 🎯 Quick Wins (Can be completed quickly)

1. **Add confidence indicator to ACWR dashboard** (30 min)
   - Import `ConfidenceIndicatorComponent`
   - Calculate ACWR confidence
   - Display next to ACWR value

2. **Add confidence indicator to game day readiness** (30 min)
   - Import `ConfidenceIndicatorComponent`
   - Calculate readiness confidence
   - Display next to readiness score

3. **Add AI Coach conservative mode** (1 hour)
   - Check data confidence in context builder
   - Add conservative prompt when confidence low
   - Use cautious language

4. **Add tomorrow preview** (1 hour)
   - Load tomorrow's schedule
   - Display in dashboard
   - Show sessions and protocols

---

## 📝 Notes

- Late logging and conflict detection are fully implemented with UI warnings
- Data confidence service exists and is partially integrated
- Coach override logging exists but needs UI display
- Most remaining items are UI additions to existing backend functionality

