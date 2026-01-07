# PROOF PROMPT 2.12 — AUTHORITY SOURCE OF TRUTH FINAL VERIFICATION

## Contract Version: v3 (PROMPT 2.14 - Real Proof Run Required)
## Date: 2026-01-06
## Purpose: Final end-to-end verification that team_activities is the ONLY authority

**Status**: ⏳ **PARTIALLY COMPLETE** - SQL executed ✅, Auth token obtained ✅, curl tests pending function deployment

---

## Migration Status

**Migration File**: `supabase/migrations/20250130000000_team_activities_sot.sql`

**Status**: ✅ **APPLIED** (ready for testing)

**Tables Created**:
- `team_activities` - Canonical source of truth
- `team_activity_attendance` - Athlete participation mapping
- `team_activity_audit` - Append-only audit log

---

## SECTION A: Real IDs Used

**TEAM_ID**: `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11` (Ljubljana Frogs)  
**COACH_ID**: `de655031-f414-4115-9be2-7b800ec7545d` (aljosa@flagfit.com)  
**ATHLETE_X_ID**: `de655031-f414-4115-9be2-7b800ec7545d` (aljosa@flagfit.com)  
**ATHLETE_Y_ID**: ⚠️ **NOTE**: Second athlete user needed for exclusion test. Using Athlete X for both practice and film room tests.

---

## SECTION B: Real Database Setup (EXECUTED)

### Executed SQL

```sql
-- Add user as coach to team_members (for testing)
INSERT INTO public.team_members (user_id, team_id, role)
VALUES ('de655031-f414-4115-9be2-7b800ec7545d', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'coach')
ON CONFLICT (user_id, team_id) DO UPDATE SET role = 'coach';

-- Insert practice activity for 2026-01-11
INSERT INTO public.team_activities (
    team_id, date, start_time_local, end_time_local, timezone,
    type, location, replaces_session, created_by_coach_id, note
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '2026-01-11',
    '18:00:00',
    '20:00:00',
    'America/New_York',
    'practice',
    'Central Park Field',
    TRUE,
    'de655031-f414-4115-9be2-7b800ec7545d',
    'Red zone offense focus'
) RETURNING id;
-- Result: practice_activity_id = cdb73eda-04ed-4013-b160-97ac1c97cf7f

-- Insert film room activity for 2026-01-12
INSERT INTO public.team_activities (
    team_id, date, start_time_local, end_time_local, timezone,
    type, location, replaces_session, created_by_coach_id, note
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '2026-01-12',
    '10:00:00',
    '11:30:00',
    'America/New_York',
    'film_room',
    'Team Meeting Room',
    TRUE,
    'de655031-f414-4115-9be2-7b800ec7545d',
    'Review last game footage'
) RETURNING id;
-- Result: film_activity_id = 10324800-d0f3-4afe-894c-7e3c486f8cbe

-- Athlete X attendance (required for both)
INSERT INTO public.team_activity_attendance (activity_id, athlete_id, participation)
VALUES 
    ('cdb73eda-04ed-4013-b160-97ac1c97cf7f', 'de655031-f414-4115-9be2-7b800ec7545d', 'required'),
    ('10324800-d0f3-4afe-894c-7e3c486f8cbe', 'de655031-f414-4115-9be2-7b800ec7545d', 'required');
```

### Verification Query Results

```sql
SELECT 
    ta.id as activity_id,
    ta.date,
    ta.type,
    ta.start_time_local,
    ta.location,
    taa.athlete_id,
    taa.participation,
    taa.exclusion_reason
FROM public.team_activities ta
LEFT JOIN public.team_activity_attendance taa ON ta.id = taa.activity_id
WHERE ta.team_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
AND ta.date IN ('2026-01-11', '2026-01-12')
ORDER BY ta.date, ta.type;
```

**Results**:
- **Practice (2026-01-11)**: activity_id=`cdb73eda-04ed-4013-b160-97ac1c97cf7f`, athlete_id=`de655031-f414-4115-9be2-7b800ec7545d`, participation=`required`
- **Film Room (2026-01-12)**: activity_id=`10324800-d0f3-4afe-894c-7e3c486f8cbe`, athlete_id=`de655031-f414-4115-9be2-7b800ec7545d`, participation=`required`

---

## SECTION C: Real Curl Tests (REQUIRED - AUTH TOKENS NEEDED)

**⚠️ NOTE**: Curl tests require authentication tokens. 

**Obtaining Tokens**:
- **Supabase MCP Limitation**: The Supabase MCP tools do not include authentication/login functions
- **Manual Token Acquisition Required**: Tokens must be obtained manually via one of these methods:
  1. **Via Supabase Auth API** (curl):
     ```bash
     curl -X POST 'https://pvziciccwxgftcielknm.supabase.co/auth/v1/token?grant_type=password' \
       -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWNjd3hnZnRjaWVsa25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MzcwNTgsImV4cCI6MjA3NTExMzA1OH0.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU' \
       -H 'Content-Type: application/json' \
       -d '{"email":"aljosa@flagfit.com","password":"<PASSWORD>"}'
     ```
     Extract `access_token` from the response.
  2. **Via Supabase Dashboard**: Login to Supabase Dashboard → Authentication → Users → Get user's access token
  3. **Via Application**: Login through the app and extract token from browser DevTools → Application → Local Storage

**User for Testing**: `aljkous@gmail.com` (user_id: `de655031-f414-4115-9be2-7b800ec7545d`)

**Auth Token Obtained**: ✅ Token successfully obtained via Supabase Auth API
- **Token**: `eyJhbGciOiJIUzI1NiIsImtpZCI6InAxbHB4eGxoSE5seTVld0UiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3B2emljaWNjd3hnZnRjaWVsa25tLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJkZTY1NTAzMS1mNDE0LTQxMTUtOWJlMi03YjgwMGVjNzU0NWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY3NzE5ODQyLCJpYXQiOjE3Njc3MTYyNDIsImVtYWlsIjoiYWxqa291c0BnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiYWxqa291c0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyc3RfbmFtZSI6IkFsam_FoWEiLCJmdWxsX25hbWUiOiJBbGpvc2EgVXNlciIsImxhc3RfbmFtZSI6ImtvdXMiLCJuYW1lIjoiQWxqb3NhIFVzZXIiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBvc2l0aW9uIjoiQ2VudGVyIiwicm9sZSI6InBsYXllciIsInN1YiI6ImRlNjU1MDMxLWY0MTQtNDExNS05YmUyLTdiODAwZWM3NTQ1ZCJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY3NzE2MjQyfV0sInNlc3Npb25faWQiOiI1MjRiY2VlYi0yMzgzLTQ3MGEtODEyMC02NTAxZTlkOWYyYzciLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.Wq7Wv_eWWLYSbGVo_Iu4xOBXVRjyyOSQ9-eJ1PSMfNI`
- **Note**: Token expires at `1767719842` (Unix timestamp). Regenerate if expired.

**Site URL**: 
- ⚠️ **Deployed Function Status**: The Netlify function `/api/daily-protocol` returned "Not Found" when tested. This may indicate:
  - Function not deployed to production
  - Function needs to be rebuilt/redeployed
  - Local dev server required for testing
- **Testing Options**:
  - Local: `http://localhost:8888` (requires `netlify dev` or local server running)
  - Production: `https://flagfit-pro.netlify.app` (requires function deployment)

### Test A: GET /api/daily-protocol?date=2026-01-11 as Athlete X

**Command to Execute**:
```bash
curl -s -X GET "https://<YOUR_SITE>/api/daily-protocol?date=2026-01-11" \
  -H "Authorization: Bearer <ATHLETE_X_TOKEN>" \
  -H "Content-Type: application/json" | jq '.data | {teamActivity, sessionResolution, confidenceMetadata}'
```

**Expected Response Structure**:
```json
{
  "success": true,
  "data": {
    "protocol_date": "2026-01-11",
    "teamActivity": {
      "type": "practice",
      "startTimeLocal": "18:00:00",
      "endTimeLocal": "20:00:00",
      "location": "Central Park Field",
      "participation": "required",
      "createdByCoachName": "Coach Smith",
      "updatedAtLocal": "2025-01-30T10:00:00Z",
      "note": "Red zone offense focus"
    },
    "sessionResolution": {
      "success": true,
      "status": "resolved",
      "override": {
        "type": "flag_practice",
        "reason": "Team practice scheduled at 18:00:00",
        "replaceSession": true
      }
    },
    "trainingFocus": "practice_day",
    "aiRationale": "🏈 Flag practice day (18:00:00). Training adjusted to complement practice."
  }
}
```

**Actual Response**:
```json
⏳ PENDING FUNCTION DEPLOYMENT: Function returned "Not Found" when tested against production.
Token obtained successfully. Once function is deployed/accessible, run:
TOKEN="<TOKEN_ABOVE>" && curl -s "https://flagfit-pro.netlify.app/api/daily-protocol?date=2026-01-11" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.data | {teamActivity, sessionResolution, confidenceMetadata}'
```

**Legacy Field Absence Check**:
```bash
curl -s -X GET "https://<YOUR_SITE>/api/daily-protocol?date=2026-01-11" \
  -H "Authorization: Bearer <ATHLETE_X_TOKEN>" \
  -H "Content-Type: application/json" | grep -E "practice_scheduled|hasFlagPractice|film_room_scheduled|practice_time|film_room_time|flag_practice_schedule" || echo "ABSENT_OK"
```

**Output**: ⏳ PENDING FUNCTION DEPLOYMENT: Run legacy field check once function is accessible:
```bash
TOKEN="<TOKEN_ABOVE>" && curl -s "https://flagfit-pro.netlify.app/api/daily-protocol?date=2026-01-11" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | grep -E "practice_scheduled|hasFlagPractice|film_room_scheduled|practice_time|film_room_time|flag_practice_schedule" || echo "ABSENT_OK"
```

---

### Test B: GET /api/daily-protocol?date=2026-01-12 as Athlete X

**Command to Execute**:
```bash
curl -s -X GET "https://<YOUR_SITE>/api/daily-protocol?date=2026-01-12" \
  -H "Authorization: Bearer <ATHLETE_X_TOKEN>" \
  -H "Content-Type: application/json" | jq '.data | {teamActivity, sessionResolution, confidenceMetadata}'
```

**Expected Response Structure**:
```json
{
  "success": true,
  "data": {
    "protocol_date": "2026-01-12",
    "teamActivity": {
      "type": "film_room",
      "startTimeLocal": "10:00:00",
      "endTimeLocal": "11:30:00",
      "location": "Team Meeting Room",
      "participation": "required",
      "createdByCoachName": "Coach Smith",
      "note": "Review last game footage"
    },
    "sessionResolution": {
      "success": true,
      "status": "resolved",
      "override": {
        "type": "film_room",
        "reason": "Film room scheduled at 10:00:00",
        "replaceSession": true
      }
    },
    "trainingFocus": "skill",
    "aiRationale": "📽️ Film room day. Recovery and mental prep focus."
  }
}
```

**Actual Response**:
```json
⏳ PENDING FUNCTION DEPLOYMENT: Same as Test A - function needs to be deployed/accessible
```

---

### Test C: GET /api/daily-protocol?date=2026-01-11 as Athlete Y (Excluded)

**⚠️ NOTE**: Athlete Y exclusion test requires a second user with excluded attendance. For now, this test is pending setup of a second test user.

**Command to Execute**:
```bash
curl -s -X GET "https://<YOUR_SITE>/api/daily-protocol?date=2026-01-11" \
  -H "Authorization: Bearer <ATHLETE_Y_TOKEN>" \
  -H "Content-Type: application/json" | jq '.data | {teamActivity, sessionResolution, confidenceMetadata}'
```

**Expected Response Structure**:
```json
{
  "success": true,
  "data": {
    "protocol_date": "2026-01-11",
    "teamActivity": {
      "type": "practice",
      "startTimeLocal": "18:00:00",
      "location": "Central Park Field",
      "participation": "excluded",
      "createdByCoachName": "Coach Smith"
    },
    "sessionResolution": {
      "success": true,
      "status": "resolved",
      "override": {
        "type": "rehab_protocol",
        "reason": "Active injury protocol: knee, ankle"
      }
    },
    "trainingFocus": "return_to_play_phase_1"
  }
}
```

**Actual Response**:
```json
⏳ PENDING: Requires second user setup + function deployment
```

---

## Step F1: Proof Doc Date + Verdict Integrity

**Date Fixed**: 2026-01-06 ✅
**Verdict Status**: ⏳ PENDING REAL RUN (until SQL and curl outputs are pasted)

---

## Step F2: Docs Cleanup (PATH 2 - Keep Historical, Code-Only Verification)

**Chosen Path**: PATH 2 - Keep docs historical (legacy strings may exist in historical documentation; codebase is clean)

**Note**: Historical documentation files may reference legacy field names for context. These are not active code references.

**Code-Only Grep (angular + netlify only - docs excluded)**:
```bash
$ grep -R "flag_practice_schedule" angular netlify | cat
```

**Actual Output**:
```
netlify/functions/player-settings.cjs:135:  // PROMPT 2.11: Rename flag_practice_schedule to availability (non-authority)
netlify/functions/player-settings.cjs:147:        availabilitySchedule: config.flag_practice_schedule || [], // Keep DB field name for now
netlify/functions/player-settings.cjs:212:        flag_practice_schedule: flagPracticeSchedule || [],
netlify/functions/player-settings.cjs:254:        availabilitySchedule: config.flag_practice_schedule, // PROMPT 2.11: Renamed
```

**Counts**:
- angular: **0 matches** ✅
- netlify: **4 matches** (ALL in `player-settings.cjs` - DB read/write layer only) ✅
- docs: **140+ matches** (historical documentation - excluded from verification)

**Verification**:
- ✅ Codebase clean: Zero legacy references in angular
- ✅ Only DB layer: `flag_practice_schedule` exists ONLY in `player-settings.cjs` (DB read/write)
- ✅ Historical docs: Legacy strings exist in docs for historical context (OK)

### Deprecated Field Counts

**practice_scheduled**:
```bash
$ grep -R "practice_scheduled" angular netlify | wc -l
=> 0
```
- angular: **0 matches** ✅
- netlify: **0 matches** ✅

**hasFlagPractice**:
```bash
$ grep -R "hasFlagPractice" angular netlify | wc -l
=> 0
```
- angular: **0 matches** ✅
- netlify: **0 matches** ✅

**film_room_scheduled**:
```bash
$ grep -R "film_room_scheduled" angular netlify | wc -l
=> 0
```
- angular: **0 matches** ✅
- netlify: **0 matches** ✅

**Summary**: Zero legacy references in active code. `flag_practice_schedule` exists ONLY in `player-settings.cjs` (DB read/write layer).

---

## Code Verification (Completed)

**Code-Only Grep Results**:
- ✅ angular: **0 matches** for `flag_practice_schedule`
- ✅ netlify: **4 matches** (ALL in `player-settings.cjs` - DB read/write layer only)
- ✅ Historical docs: Legacy strings exist for context (excluded from verification)

**Code Changes Verified**:
- ✅ `onboarding.component.ts`: Removed `flag_practice_schedule` assignment
- ✅ `session-resolver.spec.cjs`: Removed deprecated comment
- ✅ `player-settings.cjs`: ONLY remaining reference (DB layer - OK)

---

## Step F5: Final Verdict (Updated After Real Outputs)

### ⏳ PARTIALLY COMPLETE - SQL EXECUTED, CURL TESTS PENDING TOKENS

**Status**:
1. ✅ Step F2: Docs cleanup completed
2. ✅ Step F3: Real SQL executed and pasted (see SECTION B above)
3. ✅ Auth Token: Successfully obtained for `aljkous@gmail.com`
4. ⏳ Step F4: Real curl outputs pending (requires function deployment/accessibility)
   - Test A: Token ready, function returns "Not Found"
   - Test B: Token ready, function returns "Not Found"
   - Test C: Pending setup of Athlete Y user + token + function deployment

**Once real outputs are pasted, update verdict to**:
```markdown
## ✅ FINAL VERDICT

**✅ VERIFIED (real responses pasted)**

**team_activities is the ONLY authority for practice/film overrides.**

**Evidence**:
1. ✅ Zero legacy references in codebase (angular: 0, netlify: 4 in DB layer only)
2. ✅ Real SQL executed - team_activities table populated
3. ✅ Real curl tests executed - responses show `teamActivity` as source
4. ✅ Legacy fields ABSENT from all responses (ABSENT_OK confirmed)
5. ✅ Override resolution: `teamActivity` → `sessionResolution.override` (verified)

**No authority leaks detected.**
```

---

## Test Execution Notes

**To run actual curl tests**:
1. Apply migration in Supabase SQL Editor
2. Replace `<TEAM_A_ID>`, `<COACH_ID>`, `<ATHLETE_X_ID>`, `<ATHLETE_Y_ID>` with real UUIDs
3. Replace `<ATHLETE_X_TOKEN>`, `<ATHLETE_Y_TOKEN>` with real JWT tokens
4. Execute curl commands and verify JSON responses match expected fragments above

**Expected Response Format**:
- All responses should include `teamActivity` field (or `null`)
- All responses should include `sessionResolution.override` field
- NO responses should include `practice_scheduled`, `hasFlagPractice`, or `flag_practice_schedule` fields

---

## Files Changed in PROMPT 2.13 (Step E1)

1. ✅ `angular/src/app/features/onboarding/onboarding.component.ts` - Removed `flag_practice_schedule` assignment
2. ✅ `netlify/functions/utils/session-resolver.spec.cjs` - Removed deprecated comment
3. ✅ `docs/contracts/PROOF_PROMPT_2_12_AUTHORITY_SOT_FINAL_v1.md` - Updated with real evidence (v2)

---

## Summary

**Status**: ⏳ **PENDING REAL RUN**

**Current State**:
- ✅ Date fixed: 2026-01-06
- ✅ Verdict integrity: Removed false "real responses shown" claims
- ✅ Docs path chosen: PATH 2 (historical docs excluded from verification)
- ✅ Code-only grep: 0 matches in angular, 4 matches in netlify (DB layer only)
- ✅ SQL execution: **COMPLETED** - Real IDs used, activities inserted, attendance records created
- ⏳ Curl tests: Pending auth tokens (structure ready, need to obtain tokens via Supabase Auth)

**Next Steps**:
1. Execute SQL in Supabase SQL Editor (replace placeholders with real IDs)
2. Run curl commands A, B, C with real tokens
3. Paste actual outputs into proof doc
4. Update verdict to ✅ VERIFIED once real outputs are pasted

**team_activities is the ONLY authority for practice/film overrides** (pending verification with real outputs).

