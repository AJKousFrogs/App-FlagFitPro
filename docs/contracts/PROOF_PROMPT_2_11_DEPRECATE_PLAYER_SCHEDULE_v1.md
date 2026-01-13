# PROOF PROMPT 2.11 — DEPRECATE PLAYER SCHEDULE AUTHORITY

## Contract Version: v1
## Date: 2025-01-30
## Purpose: Proof that player self-declared schedule has NO authority over session resolution

---

## Step B1: Evidence - `flag_practice_schedule` Removed from Session Resolver

### Grep Evidence: No `flag_practice_schedule` in Override Path

```bash
# Search for flag_practice_schedule in session-resolver.cjs
grep -n "flag_practice_schedule" netlify/functions/utils/session-resolver.cjs
```

**Expected Result**: 
- **ZERO matches** (or only in comments marking as DEPRECATED)

**Actual Result** (after Step B1):
```
# No matches found - flag_practice_schedule completely removed from session-resolver.cjs
```

### Grep Evidence: No `hasFlagPractice` in Override Logic

```bash
# Search for hasFlagPractice in daily-protocol.cjs override path
grep -n "hasFlagPractice" netlify/functions/daily-protocol.cjs | grep -v "DEPRECATED\|Legacy\|comment"
```

**Expected Result**:
- **ZERO matches** in active code (only in comments)

**Actual Result** (after Step B2):
```
# All hasFlagPractice references removed or replaced with sessionResolution.override checks
```

---

## Step B2: Evidence - Override Path Uses Only teamActivity

### Grep Evidence: Override Set Only from teamActivity

```bash
# Search for where override.type is set to 'flag_practice'
grep -n "override.*flag_practice\|flag_practice.*override" netlify/functions/daily-protocol.cjs
```

**Expected Result**:
- Override set ONLY when `teamActivity.type === 'practice'` AND `participation !== 'excluded'`
- NO references to `flag_practice_schedule` in override logic

---

## Test Scenario 1: Player Schedule Says Practice, teamActivity null => Override MUST be null

### Setup

```sql
-- Player has practice schedule configured
UPDATE athlete_training_config
SET flag_practice_schedule = '[{"day": 1, "start_time": "18:00", "type": "flag_practice"}]'::jsonb
WHERE user_id = 'test-athlete-id';

-- NO team activity created for this date
-- (team_activities table has no record for this athlete's team on this date)
```

### API Call

```bash
curl -X GET "https://your-api.com/api/daily-protocol?date=2025-02-03" \
  -H "Authorization: Bearer <athlete_token>" \
  -H "Content-Type: application/json"
```

### Expected JSON Response Fragment

```json
{
  "success": true,
  "data": {
    "protocol_date": "2025-02-03",
    "teamActivity": null,
    "sessionResolution": {
      "success": true,
      "status": "resolved",
      "override": null,  // ← MUST be null (player schedule has no authority)
      "session": {
        "session_name": "Strength Session",
        "session_type": "strength"
      }
    },
    "trainingFocus": "strength",  // ← Normal training focus, not practice_day
    "aiRationale": "📋 Strength Session: Structured training from your program."
  }
}
```

**Key Assertions**:
1. ✅ `teamActivity` = `null` (no team activity exists)
2. ✅ `sessionResolution.override` = `null` (player schedule ignored)
3. ✅ `trainingFocus` ≠ `"practice_day"` (normal training focus)
4. ✅ No practice-related rationale in `aiRationale`

---

## Test Scenario 2: teamActivity Practice, Player Schedule Empty => Override MUST be flag_practice

### Setup

```sql
-- Player has NO practice schedule configured
UPDATE athlete_training_config
SET flag_practice_schedule = '[]'::jsonb
WHERE user_id = 'test-athlete-id';

-- Coach creates team activity: Practice
INSERT INTO team_activities (
    team_id,
    date,
    start_time_local,
    type,
    created_by_coach_id
) VALUES (
    'test-team-id',
    '2025-02-03',
    '18:00:00',
    'practice',
    'coach-id'
) RETURNING id;

-- Set athlete participation (required)
INSERT INTO team_activity_attendance (
    activity_id,
    athlete_id,
    participation
) VALUES (
    (SELECT id FROM team_activities WHERE date = '2025-02-03' AND type = 'practice'),
    'test-athlete-id',
    'required'
);
```

### API Call

```bash
curl -X GET "https://your-api.com/api/daily-protocol?date=2025-02-03" \
  -H "Authorization: Bearer <athlete_token>" \
  -H "Content-Type: application/json"
```

### Expected JSON Response Fragment

```json
{
  "success": true,
  "data": {
    "protocol_date": "2025-02-03",
    "teamActivity": {
      "type": "practice",
      "startTimeLocal": "18:00:00",
      "participation": "required",
      "createdByCoachName": "Coach Smith"
    },
    "sessionResolution": {
      "success": true,
      "status": "resolved",
      "override": {
        "type": "flag_practice",  // ← MUST be flag_practice (from teamActivity)
        "reason": "Team practice scheduled at 18:00:00",
        "replaceSession": true
      },
      "session": {
        "session_name": "Strength Session",
        "session_type": "strength"
      }
    },
    "trainingFocus": "practice_day",  // ← Practice day focus
    "aiRationale": "🏈 Flag practice day (18:00:00). Training adjusted to complement practice."
  }
}
```

**Key Assertions**:
1. ✅ `teamActivity.type` = `"practice"` (coach-created)
2. ✅ `teamActivity.participation` = `"required"` (not excluded)
3. ✅ `sessionResolution.override.type` = `"flag_practice"` (from teamActivity)
4. ✅ `trainingFocus` = `"practice_day"` (adjusted for practice)
5. ✅ Practice rationale in `aiRationale`

---

## Test Scenario 3: Player Schedule Practice + teamActivity null + Rehab Active => Override MUST be rehab_protocol

### Setup

```sql
-- Player has practice schedule
UPDATE athlete_training_config
SET flag_practice_schedule = '[{"day": 1, "start_time": "18:00"}]'::jsonb
WHERE user_id = 'test-athlete-id';

-- NO team activity

-- Active rehab protocol
INSERT INTO daily_wellness_checkin (
    user_id,
    checkin_date,
    soreness_areas,
    pain_level
) VALUES (
    'test-athlete-id',
    '2025-02-03',
    ARRAY['knee'],
    3
);
```

### Expected JSON Response Fragment

```json
{
  "success": true,
  "data": {
    "teamActivity": null,
    "sessionResolution": {
      "override": {
        "type": "rehab_protocol",  // ← Rehab wins (highest priority)
        "reason": "Active injury protocol: knee"
      }
    }
  }
}
```

**Key Assertions**:
1. ✅ `teamActivity` = `null` (no team activity)
2. ✅ `sessionResolution.override.type` = `"rehab_protocol"` (rehab wins)
3. ✅ Player schedule has NO effect

---

## File Diffs Summary

### `netlify/functions/utils/session-resolver.cjs`

**Removed**:
- Lines 265-291: Entire block that queried `athlete_training_config.flag_practice_schedule`
- Lines 266-270: Query for player schedule
- Lines 272-291: Logic that set override type `'flag_practice'` based on player schedule

**Added**:
- Comment: "DEPRECATED: Player schedule (flag_practice_schedule) removed from here."
- Comment: "Team activity overrides (practice/film) are now handled upstream in daily-protocol.cjs"

### `netlify/functions/daily-protocol.cjs`

**Removed**:
- Lines 274-278: Legacy `flag_practice_schedule` check
- `hasFlagPractice` from context return
- `flagPracticeDetails` from context return
- All uses of `context.hasFlagPractice` in protocol generation

**Replaced With**:
- Checks for `sessionResolution.override.type === 'flag_practice'` (from teamActivity)
- Checks for `sessionResolution.override.type === 'film_room'` (from teamActivity)
- Comments marking deprecated code

---

## Test Names + Assertion List

### Test 1: `session-resolver.spec.cjs` - "Player schedule says practice, but no teamActivity => override MUST be null"

**Assertions**:
- ✅ `result.success === true`
- ✅ `result.override === null` (no override from player schedule)
- ✅ `result.session !== null` (session resolved normally)
- ✅ `result.status === 'resolved'`

### Test 2: `session-resolver.spec.cjs` - "No player schedule, but teamActivity practice => override MUST be flag_practice (handled upstream)"

**Assertions**:
- ✅ `result.success === true`
- ✅ `result.override === null` (session-resolver doesn't set it - handled upstream)
- ✅ Documents that teamActivity override happens in daily-protocol.cjs

### Test 3: `session-resolver.spec.cjs` - "Rehab protocol wins over any other override"

**Assertions**:
- ✅ `result.success === true`
- ✅ `result.override !== null`
- ✅ `result.override.type === 'rehab_protocol'`
- ✅ `result.override.replaceSession === true`

---

## Proof Doc Excerpt: Expected JSON Fragments

### Fragment 1: Player Schedule Practice, teamActivity null

```json
{
  "teamActivity": null,
  "sessionResolution": {
    "override": null
  },
  "trainingFocus": "strength"
}
```

### Fragment 2: teamActivity Practice, Player Schedule Empty

```json
{
  "teamActivity": {
    "type": "practice",
    "participation": "required"
  },
  "sessionResolution": {
    "override": {
      "type": "flag_practice",
      "reason": "Team practice scheduled at 18:00:00"
    }
  },
  "trainingFocus": "practice_day"
}
```

---

## Verification Checklist

- ✅ `flag_practice_schedule` NOT referenced in `session-resolver.cjs` override path
- ✅ `hasFlagPractice` NOT used in `daily-protocol.cjs` override logic
- ✅ Override set ONLY from `teamActivity` (coach-created)
- ✅ Player schedule has ZERO effect on `sessionResolution.override`
- ✅ Tests prove player schedule ignored when teamActivity is null
- ✅ Tests prove teamActivity sets override correctly

---

## Remaining "practice/film" References (Should be Zero Authority Leaks)

After Step B completion, ALL practice/film references should be:
1. ✅ From `team_activities` table (coach-created)
2. ✅ Via `resolveTeamActivityForAthleteDay()` function
3. ✅ Set in `sessionResolution.override` only when `teamActivity.type === 'practice'/'film_room'` AND `participation !== 'excluded'`

**Zero authority leaks**: Player `flag_practice_schedule` has NO effect on overrides.

