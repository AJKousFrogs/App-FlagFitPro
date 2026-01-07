# PROMPT 2.10 — STEP B: DATA MODEL PROPOSAL

## Proposed Schema

### 1. `team_activities` Table (Canonical Source of Truth)

```sql
CREATE TABLE IF NOT EXISTS public.team_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    
    -- Date/time (athlete local day reference)
    date DATE NOT NULL,
    start_time_local TIME,
    end_time_local TIME,
    timezone TEXT NOT NULL DEFAULT 'America/New_York', -- Store club timezone OR event timezone
    
    -- Activity details
    type VARCHAR(50) NOT NULL CHECK (type IN ('practice', 'film_room', 'cancelled', 'other')),
    location TEXT,
    replaces_session BOOLEAN DEFAULT TRUE, -- If true, replaces normal training session
    
    -- Coach attribution (REQUIRED)
    created_by_coach_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Metadata
    note TEXT, -- Coach note/instructions
    weather_override JSONB, -- If coach used weather to justify (e.g., {"reason": "rain", "original_type": "practice", "new_type": "film_room"})
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(team_id, date, type) -- One activity type per team per day
);

CREATE INDEX idx_team_activities_team_date ON public.team_activities(team_id, date DESC);
CREATE INDEX idx_team_activities_date ON public.team_activities(date DESC);
CREATE INDEX idx_team_activities_created_by ON public.team_activities(created_by_coach_id);
```

### 2. `team_activity_attendance` Table (Athlete Participation Mapping)

```sql
CREATE TABLE IF NOT EXISTS public.team_activity_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.team_activities(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Participation status
    participation VARCHAR(50) NOT NULL CHECK (participation IN ('required', 'optional', 'excluded')),
    exclusion_reason TEXT, -- If excluded, why (e.g., "rehab_protocol", "injury", "coach_decision")
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(activity_id, athlete_id)
);

CREATE INDEX idx_attendance_activity ON public.team_activity_attendance(activity_id);
CREATE INDEX idx_attendance_athlete ON public.team_activity_attendance(athlete_id);
CREATE INDEX idx_attendance_athlete_date ON public.team_activity_attendance(athlete_id, created_at DESC);
```

### 3. `team_activity_audit` Table (Append-Only Audit Log)

```sql
CREATE TABLE IF NOT EXISTS public.team_activity_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.team_activities(id) ON DELETE CASCADE,
    
    -- Action details
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'attendance_changed')),
    performed_by_coach_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Change details
    old_values JSONB, -- Snapshot of old values (for updates/deletes)
    new_values JSONB, -- Snapshot of new values (for creates/updates)
    
    -- Timestamp (immutable)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_activity ON public.team_activity_audit(activity_id);
CREATE INDEX idx_audit_coach ON public.team_activity_audit(performed_by_coach_id);
CREATE INDEX idx_audit_created ON public.team_activity_audit(created_at DESC);
```

## Design Justifications

### 1. Why `team_activities` instead of per-athlete schedule?
- **Single source of truth**: One team activity per day, not N athlete schedules
- **Coach authority**: Only coaches can create/modify (enforced by RLS)
- **Auditability**: All changes tracked in audit table
- **Deterministic**: Same inputs => same output (no player self-declaration)

### 2. Why separate `team_activity_attendance` table?
- **Flexibility**: Allows per-athlete participation overrides
- **Rehab protocol support**: Athlete can be `excluded` even if team has practice
- **Future features**: Can track RSVP, attendance, notes per athlete

### 3. Why `weather_override` JSONB?
- **Transparency**: Coach can document why practice was moved/cancelled
- **Non-authoritative**: Weather API can suggest, but coach must explicitly create override
- **Audit trail**: Shows coach decision-making process

### 4. Why `replaces_session` boolean?
- **Clarity**: Explicitly states if team activity replaces normal training
- **Film room**: May not replace session (additive)
- **Cancelled**: Replaces session but with no activity

### 5. Why `timezone` field?
- **Athlete local day**: Date is stored as DATE, but timezone determines "local day"
- **Multi-timezone teams**: Supports teams with athletes in different timezones
- **Event-specific**: Can override team timezone for away games/travel

## Migration Priority

1. **Create tables** (team_activities, team_activity_attendance, team_activity_audit)
2. **Add RLS policies** (coaches can create/update, athletes can read)
3. **Create audit trigger** (auto-log all changes)
4. **Create resolver function** (resolveTeamActivityForAthleteDay)
5. **Update API** (daily-protocol endpoint)

## Data Flow

```
Coach creates team_activity
  ↓
Trigger logs to team_activity_audit
  ↓
Coach optionally sets team_activity_attendance (default: all athletes required)
  ↓
Athlete requests /api/daily-protocol
  ↓
Resolver checks team_activities for athlete's team + date
  ↓
Resolver checks team_activity_attendance for participation status
  ↓
Resolver checks rehab_protocol (if excluded, participation = excluded)
  ↓
Returns teamActivity object or null
```

