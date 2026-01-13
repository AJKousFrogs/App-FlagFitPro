# PROOF PROMPT 2.10 — TEAM ACTIVITY SOURCE OF TRUTH

## Contract Version: v1
## Date: 2025-01-30
## Purpose: Proof tests for deterministic team activity resolution

---

## Test Setup

### Prerequisites
1. Database migration `20250130000000_team_activities_sot.sql` applied
2. Test team exists with ID: `00000000-0000-0000-0000-000000000001`
3. Test coach exists with ID: `00000000-0000-0000-0000-000000000002`
4. Test athlete exists with ID: `00000000-0000-0000-0000-000000000003`
5. Athlete is member of test team

---

## Test Scenario 1: Practice Day → Override `flag_practice`

### SQL Setup

```sql
-- Create team activity: Practice on 2025-02-01
INSERT INTO public.team_activities (
    team_id,
    date,
    start_time_local,
    end_time_local,
    timezone,
    type,
    location,
    replaces_session,
    created_by_coach_id,
    note
) VALUES (
    '00000000-0000-0000-0000-000000000001', -- team_id
    '2025-02-01', -- date
    '18:00:00', -- start_time_local
    '20:00:00', -- end_time_local
    'America/New_York', -- timezone
    'practice', -- type
    'Central Park Field', -- location
    TRUE, -- replaces_session
    '00000000-0000-0000-0000-000000000002', -- created_by_coach_id
    'Red zone offense focus' -- note
) RETURNING id;

-- Set athlete participation (default: required)
INSERT INTO public.team_activity_attendance (
    activity_id,
    athlete_id,
    participation
) VALUES (
    (SELECT id FROM public.team_activities WHERE date = '2025-02-01' AND type = 'practice'),
    '00000000-0000-0000-0000-000000000003', -- athlete_id
    'required' -- participation
);
```

### API Call

```bash
curl -X GET "https://your-api.com/api/daily-protocol?date=2025-02-01" \
  -H "Authorization: Bearer <athlete_token>" \
  -H "Content-Type: application/json"
```

### Expected JSON Response Fragment

```json
{
  "success": true,
  "data": {
    "id": "...",
    "protocol_date": "2025-02-01",
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
    }
  }
}
```

### DB Verification Query

```sql
-- Verify audit entry was created
SELECT 
    action,
    performed_by_coach_id,
    new_values->>'type' as activity_type,
    created_at
FROM public.team_activity_audit
WHERE activity_id = (SELECT id FROM public.team_activities WHERE date = '2025-02-01' AND type = 'practice')
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
- `action` = `'created'`
- `activity_type` = `'practice'`
- `performed_by_coach_id` = coach ID

---

## Test Scenario 2: Film Room Day → Override `film_room`

### SQL Setup

```sql
-- Create team activity: Film room on 2025-02-02
INSERT INTO public.team_activities (
    team_id,
    date,
    start_time_local,
    end_time_local,
    timezone,
    type,
    location,
    replaces_session,
    created_by_coach_id,
    note
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '2025-02-02',
    '10:00:00',
    '11:30:00',
    'America/New_York',
    'film_room',
    'Team Meeting Room',
    TRUE,
    '00000000-0000-0000-0000-000000000002',
    'Review last game footage'
) RETURNING id;

-- Set athlete participation
INSERT INTO public.team_activity_attendance (
    activity_id,
    athlete_id,
    participation
) VALUES (
    (SELECT id FROM public.team_activities WHERE date = '2025-02-02' AND type = 'film_room'),
    '00000000-0000-0000-0000-000000000003',
    'required'
);
```

### API Call

```bash
curl -X GET "https://your-api.com/api/daily-protocol?date=2025-02-02" \
  -H "Authorization: Bearer <athlete_token>" \
  -H "Content-Type: application/json"
```

### Expected JSON Response Fragment

```json
{
  "success": true,
  "data": {
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
      "override": {
        "type": "film_room",
        "reason": "Film room scheduled at 10:00:00",
        "replaceSession": true
      }
    }
  }
}
```

---

## Test Scenario 3: Rehab Athlete on Practice Day → Override `rehab_protocol` AND `teamActivity.participation=excluded`

### SQL Setup

```sql
-- Create team activity: Practice on 2025-02-03
INSERT INTO public.team_activities (
    team_id,
    date,
    start_time_local,
    type,
    created_by_coach_id
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '2025-02-03',
    '18:00:00',
    'practice',
    '00000000-0000-0000-0000-000000000002'
) RETURNING id;

-- Set athlete participation to required (but rehab will override)
INSERT INTO public.team_activity_attendance (
    activity_id,
    athlete_id,
    participation
) VALUES (
    (SELECT id FROM public.team_activities WHERE date = '2025-02-03' AND type = 'practice'),
    '00000000-0000-0000-0000-000000000003',
    'required'
);

-- Create active rehab protocol (wellness checkin with injuries)
INSERT INTO public.daily_wellness_checkin (
    user_id,
    checkin_date,
    soreness_areas,
    pain_level,
    overall_soreness
) VALUES (
    '00000000-0000-0000-0000-000000000003',
    '2025-02-03',
    ARRAY['knee', 'ankle'],
    3,
    4
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
    "teamActivity": {
      "type": "practice",
      "startTimeLocal": "18:00:00",
      "participation": "excluded", // ← Rehab override applied
      "createdByCoachName": "Coach Smith"
    },
    "sessionResolution": {
      "override": {
        "type": "rehab_protocol", // ← Rehab wins (highest priority)
        "reason": "Active injury protocol: knee, ankle"
      }
    }
  }
}
```

**Key Assertions:**
1. `teamActivity` exists (team has practice)
2. `teamActivity.participation` = `"excluded"` (rehab override)
3. `sessionResolution.override.type` = `"rehab_protocol"` (rehab wins)
4. Team activity is included as context but does NOT override rehab

---

## Test Scenario 4: No Activity → `teamActivity` null

### SQL Setup

```sql
-- No team activity created for 2025-02-04
-- (This is the default state)
```

### API Call

```bash
curl -X GET "https://your-api.com/api/daily-protocol?date=2025-02-04" \
  -H "Authorization: Bearer <athlete_token>" \
  -H "Content-Type: application/json"
```

### Expected JSON Response Fragment

```json
{
  "success": true,
  "data": {
    "teamActivity": null, // ← Explicit null, not "rest" or "practice?"
    "sessionResolution": {
      "success": true,
      "status": "resolved",
      "override": null // ← No override
    }
  }
}
```

**Key Assertions:**
1. `teamActivity` = `null` (explicit, not missing)
2. No override applied
3. Normal session resolution proceeds

---

## Test Scenario 5: Weather Override (Coach Action)

### SQL Setup

```sql
-- Create team activity with weather override
INSERT INTO public.team_activities (
    team_id,
    date,
    start_time_local,
    type,
    created_by_coach_id,
    weather_override
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '2025-02-05',
    '10:00:00',
    'film_room', -- Changed from practice due to weather
    '00000000-0000-0000-0000-000000000002',
    '{"reason": "rain", "original_type": "practice", "new_type": "film_room", "forecast_date": "2025-02-04"}'::jsonb
) RETURNING id;
```

### Expected JSON Response Fragment

```json
{
  "success": true,
  "data": {
    "teamActivity": {
      "type": "film_room",
      "weatherOverride": {
        "reason": "rain",
        "original_type": "practice",
        "new_type": "film_room",
        "forecast_date": "2025-02-04"
      },
      "createdByCoachName": "Coach Smith"
    }
  }
}
```

**Key Assertions:**
1. Weather override is stored as JSONB (coach decision, not AI auto-replace)
2. Original intent preserved in `weather_override` field
3. Coach attribution maintained

---

## Test Scenario 6: Audit Trail Verification

### SQL Verification

```sql
-- Verify all changes are logged
SELECT 
    a.id as activity_id,
    a.type,
    a.date,
    audit.action,
    audit.performed_by_coach_id,
    audit.created_at,
    audit.old_values,
    audit.new_values
FROM public.team_activities a
LEFT JOIN public.team_activity_audit audit ON audit.activity_id = a.id
WHERE a.date >= '2025-02-01'
ORDER BY audit.created_at DESC;
```

**Expected Results:**
- Every `INSERT` → `action = 'created'` with `new_values`
- Every `UPDATE` → `action = 'updated'` with `old_values` and `new_values`
- Every `DELETE` → `action = 'deleted'` with `old_values`
- All actions attributed to `performed_by_coach_id`

---

## Test Scenario 7: RLS Policy Verification

### Test: Athlete Cannot Create Team Activity

```bash
# Attempt to create team activity as athlete (should fail)
curl -X POST "https://your-api.com/api/team-activities" \
  -H "Authorization: Bearer <athlete_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "team_id": "00000000-0000-0000-0000-000000000001",
    "date": "2025-02-06",
    "type": "practice",
    "start_time_local": "18:00:00"
  }'
```

**Expected Response:**
```json
{
  "error": "Forbidden",
  "message": "Only coaches can create team activities"
}
```

### Test: Athlete Can Read Team Activity

```bash
# Athlete should be able to read team activities for their team
curl -X GET "https://your-api.com/api/team-activities?team_id=00000000-0000-0000-0000-000000000001&date=2025-02-01" \
  -H "Authorization: Bearer <athlete_token>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "type": "practice",
    "date": "2025-02-01",
    ...
  }
}
```

---

## Summary of Test Assertions

### Deterministic Resolution
- ✅ Same inputs (athleteId, teamId, date) → same output
- ✅ No fallbacks or guessing
- ✅ Explicit `null` when no activity exists

### Coach Authority
- ✅ Only coaches can create/update team activities
- ✅ All changes attributed to `created_by_coach_id`
- ✅ All changes logged to audit table

### Priority Rules
- ✅ Rehab protocol → `participation = excluded` (highest priority)
- ✅ Team activity → authoritative when participation ≠ excluded
- ✅ Weather override → coach action flag only, never AI auto-replace
- ✅ No record → `null` (not "rest", not "practice?")

### API Integration
- ✅ `/api/daily-protocol` includes `teamActivity` field
- ✅ `sessionResolution.override` set correctly based on team activity
- ✅ Rehab protocol wins over team activity when active

---

## File Paths Changed/Created

1. **Migration**: `supabase/migrations/20250130000000_team_activities_sot.sql`
2. **Resolver**: `netlify/functions/utils/team-activity-resolver.cjs`
3. **API Update**: `netlify/functions/daily-protocol.cjs`
4. **Proof Tests**: `docs/contracts/PROOF_PROMPT_2_10_TEAM_ACTIVITY_SOT_v1.md`
5. **Data Model**: `docs/contracts/PROMPT_2_10_STEP_B_DATA_MODEL.md`
6. **Inventory**: `docs/contracts/PROMPT_2_10_STEP_A_INVENTORY.md`

---

## Resolver Function Code Path

**Function**: `resolveTeamActivityForAthleteDay()`
**Location**: `netlify/functions/utils/team-activity-resolver.cjs`
**Signature**: `(supabase, athleteId, teamId, dateLocal) => Promise<ResolutionResult>`

**Return Type**:
```typescript
{
  exists: boolean;
  activity: TeamActivity | null;
  participation: 'required' | 'optional' | 'excluded' | null;
  source: 'coach_calendar' | 'none';
  audit: AuditTrail;
}
```

---

## Migration SQL Paths

- **Main Migration**: `supabase/migrations/20250130000000_team_activities_sot.sql`
- **Tables Created**: `team_activities`, `team_activity_attendance`, `team_activity_audit`
- **RLS Policies**: Included in migration
- **Triggers**: Auto-audit trigger included

---

## Updated API Response Examples

### Example 1: Practice Day
```json
{
  "success": true,
  "data": {
    "teamActivity": {
      "type": "practice",
      "startTimeLocal": "18:00:00",
      "participation": "required"
    },
    "sessionResolution": {
      "override": {
        "type": "flag_practice"
      }
    }
  }
}
```

### Example 2: Rehab Athlete on Practice Day
```json
{
  "success": true,
  "data": {
    "teamActivity": {
      "type": "practice",
      "participation": "excluded" // ← Rehab override
    },
    "sessionResolution": {
      "override": {
        "type": "rehab_protocol" // ← Rehab wins
      }
    }
  }
}
```

---

## DB Verification Queries

### Check Team Activity Exists
```sql
SELECT * FROM public.team_activities 
WHERE team_id = '<team_id>' AND date = '2025-02-01';
```

### Check Attendance Records
```sql
SELECT * FROM public.team_activity_attendance 
WHERE activity_id = '<activity_id>' AND athlete_id = '<athlete_id>';
```

### Check Audit Entries
```sql
SELECT * FROM public.team_activity_audit 
WHERE activity_id = '<activity_id>' 
ORDER BY created_at DESC;
```

---

## Contract Compliance Checklist

- ✅ No WhatsApp polls
- ✅ No player self-declared schedule as authority
- ✅ Player input exists ONLY as "availability / note", never as session authority
- ✅ Coach authority is explicit, attributed, timestamped, auditable
- ✅ Deterministic resolution: same inputs => same output, no fallbacks
- ✅ If no team activity exists, state is explicit: `teamActivity = null`
- ✅ Rehab protocol wins (highest priority)
- ✅ Weather override is ONLY a coach action flag, never AI auto-replace
- ✅ All writes logged to append-only audit table

