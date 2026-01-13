# PROOF PROMPT 2.11 — STEP C: FRONTEND CLEANUP

## Contract Version: v1
## Date: 2025-01-30
## Purpose: Proof that frontend uses ONLY teamActivity for practice/film authority

---

## Step C1: Grep Evidence - TODAY Resolver

### 1. Search for `practice_scheduled` in TODAY resolver

```bash
grep -n "practice_scheduled" angular/src/app/today/resolution/today-state.resolver.ts
```

**Expected Result**: 
- **ZERO matches** (or only in DEPRECATED comments)

**Actual Result** (after Step C1):
```
# No matches found - practice_scheduled completely removed from ProtocolJson interface
```

### 2. Search for `hasFlagPractice` in TODAY resolver

```bash
grep -n "hasFlagPractice" angular/src/app/today/resolution/today-state.resolver.ts
```

**Expected Result**:
- **ZERO matches**

**Actual Result**:
```
# No matches found
```

### 3. Search for `flag_practice_schedule` in TODAY resolver

```bash
grep -n "flag_practice_schedule" angular/src/app/today/resolution/today-state.resolver.ts
```

**Expected Result**:
- **ZERO matches**

**Actual Result**:
```
# No matches found
```

---

## Step C1: Grep Evidence - Practice Day Logic Uses teamActivity

### Search for practice day checks

```bash
grep -n "override.*flag_practice\|flag_practice.*override\|teamActivity.*practice" angular/src/app/today/resolution/today-state.resolver.ts
```

**Expected Result**:
- Practice day determined ONLY from `sessionResolution.override.type === 'flag_practice'`
- Film room determined ONLY from `sessionResolution.override.type === 'film_room'`
- `teamActivity` used for display data (time, location) but NOT for authority

**Actual Result**:
```
403:  if (sr.override?.type === 'flag_practice') {
462:  if (sr.override?.type === 'film_room') {
```

---

## Step C2: UI Screenshot/Text Evidence

### Player Settings Dialog - "Availability" Label

**Location**: `angular/src/app/features/training/daily-protocol/components/player-settings-dialog.component.ts`

**Updated Label**:
```html
<h4>Availability</h4>
<p class="section-description">
  This does not schedule team practice. Coaches schedule team activities.
</p>
<p class="section-description" style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
  Add your typical training times for reference. This information helps coaches understand your availability but does not create team practices.
</p>
```

**Previous Label** (removed):
```html
<h4>Flag Football Practice Schedule</h4>
<p class="section-description">
  Add your team practice times. Training will be adjusted on practice days.
</p>
```

---

## Step C3: Sample TodayViewModel JSON for Practice Day

### Input Protocol JSON (from backend)

```json
{
  "id": "protocol-123",
  "protocol_date": "2025-02-03",
  "readiness_score": 78,
  "confidence_metadata": {
    "readiness": {
      "hasData": true,
      "source": "wellness_checkin",
      "daysStale": 0,
      "confidence": "measured"
    },
    "sessionResolution": {
      "success": true,
      "status": "resolved",
      "hasProgram": true,
      "hasSessionTemplate": true,
      "override": "flag_practice"
    },
    "hasActiveProgram": true,
    "injuryProtocolActive": false
  },
  "session_resolution": {
    "success": true,
    "status": "resolved",
    "override": {
      "type": "flag_practice",
      "reason": "Team practice scheduled at 18:00:00"
    }
  },
  "teamActivity": {
    "type": "practice",
    "startTimeLocal": "18:00:00",
    "endTimeLocal": "20:00:00",
    "location": "Central Park Field",
    "participation": "required",
    "createdByCoachName": "Coach Smith",
    "updatedAtLocal": "2025-01-30T10:00:00Z",
    "note": "Red zone offense focus"
  }
}
```

### Output TodayViewModel JSON

```json
{
  "trainingAllowed": true,
  "banners": [
    {
      "type": "info",
      "style": "blue",
      "text": "🏈 Flag Practice Today — 18:00:00 at Central Park Field. Training adjusted.",
      "ctas": [
        {
          "label": "View Practice Details",
          "action": "view_practice",
          "variant": "secondary"
        }
      ]
    }
  ],
  "blocksDisplayed": [
    "morning_mobility",
    "foam_roll",
    "pre_practice_activation",
    "flag_practice",
    "post_practice_recovery"
  ],
  "primaryCta": {
    "label": "View Practice Details",
    "action": "view_practice"
  },
  "merlinPosture": "explanatory",
  "headerContext": {
    "practiceTime": "18:00:00"
  }
}
```

**Key Assertions**:
1. ✅ Practice banner text comes from `teamActivity.startTimeLocal` and `teamActivity.location`
2. ✅ Practice day determined by `sessionResolution.override.type === 'flag_practice'`
3. ✅ NO reference to `practice_scheduled` or `hasFlagPractice`
4. ✅ Practice time in header comes from `teamActivity.startTimeLocal`

---

## Step C2: API Response Evidence

### Player Settings API Response

**Endpoint**: `GET /api/player-settings`

**Response**:
```json
{
  "success": true,
  "data": {
    "primaryPosition": "wr_db",
    "birthDate": "2000-01-15",
    "availabilitySchedule": [
      {
        "day": 1,
        "start_time": "18:00",
        "type": "flag_practice"
      }
    ],
    "availabilityDisclaimer": "Availability does not schedule practice. Coaches schedule team activities.",
    "preferredTrainingDays": [1, 2, 4, 5, 6],
    "maxSessionsPerWeek": 5
  }
}
```

**Key Assertions**:
1. ✅ Field renamed from `flagPracticeSchedule` to `availabilitySchedule`
2. ✅ `availabilityDisclaimer` field added
3. ✅ Disclaimer text: "Availability does not schedule practice. Coaches schedule team activities."

---

## File Diffs Summary

### 1. `angular/src/app/today/resolution/today-state.resolver.ts`

**REMOVED**:
- `practice_scheduled?: boolean` from ProtocolJson interface
- `practice_time?: string` from ProtocolJson interface
- `film_room_scheduled?: boolean` from ProtocolJson interface
- `film_room_time?: string` from ProtocolJson interface
- All checks for `protocolJson.practice_scheduled`
- All checks for `protocolJson.film_room_scheduled`

**ADDED**:
- `teamActivity?: {...} | null` to ProtocolJson interface
- Practice day check: `sr.override?.type === 'flag_practice'`
- Film room check: `sr.override?.type === 'film_room'`
- Practice time/location from `teamActivity.startTimeLocal` and `teamActivity.location`

---

### 2. `netlify/functions/player-settings.cjs`

**CHANGED**:
- Response field: `flagPracticeSchedule` → `availabilitySchedule`
- Added: `availabilityDisclaimer` field in response
- Backward compatibility: Still accepts `flagPracticeSchedule` in POST (maps to `availabilitySchedule`)

**KEPT**:
- DB field name: `flag_practice_schedule` (no schema change)

---

### 3. `angular/src/app/features/training/daily-protocol/components/player-settings-dialog.component.ts`

**CHANGED**:
- Label: "Flag Football Practice Schedule" → "Availability"
- Description: "Add your team practice times..." → "This does not schedule team practice. Coaches schedule team activities."
- Added helper text explaining availability is informational only

**MAPPING**:
- Component uses `flagPracticeSchedule` internally (for backward compatibility)
- Maps to/from API's `availabilitySchedule` field

---

### 4. `angular/src/app/features/onboarding/onboarding.component.ts`

**CHANGED**:
- Comment: "Build practice schedule" → "Build availability schedule"
- Added deprecation comment: "This is for player availability notes only, NOT authority for team activities"

**KEPT**:
- Still sets `flag_practice_schedule` in DB (for backward compatibility)
- No UI changes (onboarding flow unchanged)

---

## Verification Checklist

- ✅ `practice_scheduled` NOT referenced in TODAY resolver
- ✅ `hasFlagPractice` NOT referenced in TODAY resolver
- ✅ `flag_practice_schedule` NOT referenced in TODAY resolver
- ✅ Practice day determined ONLY from `sessionResolution.override.type === 'flag_practice'`
- ✅ Film room determined ONLY from `sessionResolution.override.type === 'film_room'`
- ✅ `teamActivity` used for display data (time, location) but NOT for authority
- ✅ UI labels updated to "Availability" with disclaimer
- ✅ API response includes `availabilityDisclaimer` field

---

## Remaining "practice/film" References (Should be Zero Authority Leaks)

After Step C completion, ALL practice/film references in frontend should be:
1. ✅ From `protocol.teamActivity` (canonical source)
2. ✅ From `protocol.sessionResolution.override.type` (authority)
3. ✅ UI labels say "Availability" with disclaimer text
4. ✅ NO `practice_scheduled` or `hasFlagPractice` properties

**Zero authority leaks**: Player schedule has NO effect on TODAY screen rendering.

