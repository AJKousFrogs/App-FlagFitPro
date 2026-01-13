# PROMPT 2.11 — STEP A: AUTHORITY LEAK ANALYSIS

## Files Using `flag_practice_schedule` or Practice Schedule Logic

### Backend Files

#### 1. `netlify/functions/daily-protocol.cjs`
**Lines**: 274-278, 401-402, 1024-1029, 1208, 1258, 1361

**Current Usage**:
- Reads `athlete_training_config.flag_practice_schedule`
- Sets `hasFlagPractice` and `flagPracticeDetails` in context
- Uses in `generateProtocol()` to adjust training focus and AI rationale
- Already has team_activities integration but still uses legacy fields

**Impact**: 
- `hasFlagPractice` affects `trainingFocus` in protocol generation
- `flagPracticeDetails` used for practice time in rationale

**Decision**: **(B) Replace with team_activities query**
- Remove lines 274-278 (legacy check)
- Remove `hasFlagPractice` and `flagPracticeDetails` from context return
- Update `generateProtocol()` to use `context.teamActivity` instead
- Add explicit comment marking legacy code as DEPRECATED

---

#### 2. `netlify/functions/utils/session-resolver.cjs`
**Lines**: 265-291

**Current Usage**:
- Reads `athlete_training_config.flag_practice_schedule`
- Checks day of week against schedule
- Returns override type `'flag_practice'` if practice found
- This is a CRITICAL authority leak - directly sets session override

**Impact**: 
- Sets `sessionResolution.override.type = 'flag_practice'`
- This affects TODAY screen banners and blocks
- **HIGH PRIORITY FIX**

**Decision**: **(B) Replace with team_activities query**
- Remove lines 265-291 (flag practice override)
- Replace with call to `resolveTeamActivityForAthleteDay()`
- Only set override if `teamActivity.type === 'practice'` AND `participation !== 'excluded'`
- Add explicit comment: "DEPRECATED: player schedule is not authority; use team_activities"

---

#### 3. `netlify/functions/player-settings.cjs`
**Lines**: 123, 143, 168, 204, 246

**Current Usage**:
- GET endpoint: Reads `flag_practice_schedule` from config
- POST endpoint: Writes `flag_practice_schedule` to config
- Returns `flagPracticeSchedule` in response

**Impact**: 
- Only affects settings API, not session resolution
- Used for UI display/editing

**Decision**: **(C) Keep but rename to "availability"**
- Rename field to `athlete_availability` (or keep `flag_practice_schedule` but mark deprecated)
- Add comment: "DEPRECATED: This is for player availability notes only, not authority"
- Ensure it has ZERO effect on overrides (already true - only used in settings API)
- Update API response to include deprecation notice

---

### Frontend Files

#### 4. `angular/src/app/features/onboarding/onboarding.component.ts`
**Lines**: 2998-3012

**Current Usage**:
- Sets `flag_practice_schedule` during onboarding flow
- Maps `practiceDays` from onboarding data to schedule format

**Impact**: 
- Only sets initial data, doesn't affect runtime resolution

**Decision**: **(C) Keep but rename to "availability"**
- Keep onboarding flow but rename to "availability" or "typical training times"
- Add UI text: "This does not schedule team practices. Coaches publish team activities."
- Mark as optional/note-only

---

#### 5. `angular/src/app/features/training/daily-protocol/components/player-settings-dialog.component.ts`
**Lines**: 165-220, 331, 410, 500, 511, 516

**Current Usage**:
- UI component for editing practice schedule
- Shows "Flag Football Practice Schedule" section
- Allows adding/removing practice slots

**Impact**: 
- Only affects settings UI, not runtime resolution

**Decision**: **(C) Keep but rename to "availability"**
- Rename section to "Availability / Typical Training Times"
- Add clear text: "This does not schedule team practices. Coaches publish team activities."
- Update labels and descriptions
- Keep functionality but make it clear it's informational only

---

#### 6. `angular/src/app/today/resolution/today-state.resolver.ts`
**Lines**: 71, 255, 272-273, 403, 425, 453

**Current Usage**:
- Checks `protocolJson.practice_scheduled` flag
- Uses `protocolJson.practice_time` for display
- Sets practice banners and blocks based on `practice_scheduled`

**Impact**: 
- Affects TODAY screen rendering
- Currently reads from protocol JSON (which comes from backend)

**Decision**: **(B) Replace with team_activities query**
- Remove `practice_scheduled` and `practice_time` from ProtocolJson interface
- Use `protocolJson.teamActivity` instead
- Update banner logic to check `teamActivity.type === 'practice'`
- Update blocks to use `teamActivity` data

---

### Documentation Files (No Action Needed)

- `docs/contracts/PROMPT_2_10_IMPLEMENTATION_SUMMARY.md` - Already notes deprecation
- `docs/contracts/PROMPT_2_10_STEP_A_INVENTORY.md` - Historical reference
- `docs/contracts/PROOF_PROMPT_2_10_TEAM_ACTIVITY_SOT_v1.md` - Test documentation

**Decision**: **(A) No action** - Documentation only

---

## Summary Table

| File | Lines | Current Usage | Impact | Decision | Priority |
|------|-------|---------------|--------|----------|----------|
| `daily-protocol.cjs` | 274-278, 401-402, 1024-1029, 1208, 1258, 1361 | Sets `hasFlagPractice`, affects protocol generation | HIGH - Affects training focus | **(B) Replace** | HIGH |
| `session-resolver.cjs` | 265-291 | Sets override type `flag_practice` | CRITICAL - Direct authority leak | **(B) Replace** | CRITICAL |
| `player-settings.cjs` | 123, 143, 168, 204, 246 | Reads/writes settings | LOW - Settings only | **(C) Keep + rename** | MEDIUM |
| `onboarding.component.ts` | 2998-3012 | Sets initial data | LOW - Initial data only | **(C) Keep + rename** | LOW |
| `player-settings-dialog.component.ts` | 165-220, 331, 410, 500, 511, 516 | UI for editing | LOW - UI only | **(C) Keep + rename** | MEDIUM |
| `today-state.resolver.ts` | 71, 255, 272-273, 403, 425, 453 | Reads from protocol JSON | HIGH - Affects TODAY screen | **(B) Replace** | HIGH |

---

## Action Plan

### Phase 1: Critical Backend Fixes (HIGH PRIORITY)
1. ✅ Fix `session-resolver.cjs` - Remove player schedule override
2. ✅ Fix `daily-protocol.cjs` - Remove legacy `hasFlagPractice` usage
3. ✅ Fix `today-state.resolver.ts` - Use `teamActivity` instead of `practice_scheduled`

### Phase 2: Settings Cleanup (MEDIUM PRIORITY)
4. ✅ Update `player-settings.cjs` - Add deprecation notice
5. ✅ Update `player-settings-dialog.component.ts` - Rename UI + add disclaimer
6. ✅ Update `onboarding.component.ts` - Rename + add disclaimer

### Phase 3: Testing & Documentation
7. ✅ Add unit tests proving player schedule has no effect
8. ✅ Update proof tests document
9. ✅ Add DB comment marking column deprecated

---

## Expected Outcome

After fixes:
- ✅ `sessionResolution.override` set ONLY by: rehab_protocol > coach_alert > weather_override (coach) > teamActivity.practice/film > taper > null
- ✅ Player `flag_practice_schedule` has ZERO effect on overrides
- ✅ UI clearly states "availability" is informational only
- ✅ All practice/film references use `team_activities` as authority

