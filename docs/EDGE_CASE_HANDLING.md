# Edge Case Handling Specification

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Implementation Guide

---

## Overview

This document defines handling for edge cases, error scenarios, and business rule exceptions across all domains.

---

## Authentication Edge Cases

### Email Verification Required Before Login

**Scenario**: User attempts to login before verifying email

**Current Behavior**: Supabase blocks login if `email_verified = false`

**Handling:**
```typescript
// Frontend: Check verification status
const { data: { user } } = await supabase.auth.getUser();
if (!user?.email_confirmed_at) {
  // Show resend verification UI
  return { error: 'EMAIL_NOT_VERIFIED' };
}
```

**Edge Cases:**
1. **Resend verification**: User can request new verification email
2. **Changing email while unverified**: 
   - Old verification token invalidated
   - New verification email sent
   - User must verify new email
3. **Verified but profile missing**:
   - Auto-create profile on first login
   - Use default role 'player'
   - Set `email_normalized` from auth email

**Implementation:**
```sql
-- Trigger to auto-create profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email_normalized, role_global)
  VALUES (
    NEW.id,
    LOWER(TRIM(NEW.email)),
    'player'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

### Password Reset Edge Cases

**Scenario**: Password reset flow edge cases

**Handling:**

1. **Token Storage**: 
   - Tokens stored as hashed values in database
   - Never store raw tokens
   - Use `bcrypt` or `argon2` for hashing

2. **Token Expiration**:
   - Tokens expire after 1 hour
   - Expired tokens rejected
   - User must request new reset

3. **Rate Limiting**:
   - Max 3 reset requests per email per hour
   - Max 5 reset requests per IP per hour
   - Lockout after 10 failed attempts

4. **Token Reuse**:
   - Tokens are single-use
   - Mark token as used after successful reset
   - Reject used tokens

5. **Audit Events**:
   - Log reset request (email, IP, timestamp)
   - Log reset completion (email, timestamp)
   - Log reset failures (email, IP, reason)

**Implementation:**
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens(expires_at);
```

---

## Team Management Edge Cases

### Team Name Uniqueness

**Decision**: **Enforce unique team names per active team**

**Handling:**
```sql
-- Unique constraint on active teams only
CREATE UNIQUE INDEX idx_teams_name_unique 
ON teams(name) 
WHERE deleted_at IS NULL;
```

**Edge Cases:**
1. **Duplicate name after soft delete**: Allowed (team can reuse name)
2. **Case sensitivity**: Normalize to lowercase for comparison
3. **Whitespace**: Trim whitespace before comparison

**Implementation:**
```typescript
// Backend validation
const normalizedName = name.trim().toLowerCase();
const existing = await supabase
  .from('teams')
  .select('id')
  .eq('name_normalized', normalizedName)
  .is('deleted_at', null)
  .single();

if (existing) {
  throw new Error('TEAM_NAME_EXISTS');
}
```

---

### Invitation Acceptance Edge Cases

**Scenario**: User accepts team invitation

**Handling:**

1. **Email Mismatch**:
   - Invitation bound to `email_normalized`
   - Acceptance must match `auth.users.email`
   - Reject if emails don't match

2. **User Not Registered**:
   - Show signup page with pre-filled email
   - After signup, auto-accept invitation
   - Store invitation token in session

3. **Duplicate Membership**:
   - Check if user already team member
   - If active member: Mark invitation as accepted, no duplicate
   - If inactive member: Reactivate membership, mark invitation as accepted

4. **Expired Invitation**:
   - Check `expires_at` before acceptance
   - Reject expired invitations
   - Offer to request new invitation

5. **Revoked Invitation**:
   - Check `status = 'revoked'`
   - Reject revoked invitations
   - Inform user invitation was cancelled

**Implementation:**
```typescript
async function acceptInvitation(token: string) {
  // 1. Validate token
  const invitation = await getInvitationByToken(token);
  if (!invitation) throw new Error('INVITATION_NOT_FOUND');
  if (invitation.status !== 'pending') throw new Error('INVITATION_INVALID_STATUS');
  if (invitation.expires_at < new Date()) throw new Error('INVITATION_EXPIRED');
  
  // 2. Verify email match
  const user = await getCurrentUser();
  if (invitation.email_normalized !== normalizeEmail(user.email)) {
    throw new Error('INVITATION_EMAIL_MISMATCH');
  }
  
  // 3. Check existing membership
  const existing = await getTeamMember(invitation.team_id, user.id);
  if (existing && existing.deleted_at === null) {
    // Already member, just mark invitation as accepted
    await updateInvitation(invitation.id, { status: 'accepted', accepted_at: new Date() });
    return { success: true, alreadyMember: true };
  }
  
  // 4. Create or reactivate membership
  if (existing) {
    await reactivateTeamMember(existing.id);
  } else {
    await createTeamMember({
      team_id: invitation.team_id,
      user_id: user.id,
      role_team: invitation.role_team,
      position: invitation.position,
      jersey_number: invitation.jersey_number
    });
  }
  
  // 5. Mark invitation as accepted
  await updateInvitation(invitation.id, { 
    status: 'accepted', 
    accepted_at: new Date() 
  });
  
  return { success: true };
}
```

---

### Invitation Uniqueness

**Constraint**: One pending invitation per email per team

**Implementation:**
```sql
CREATE UNIQUE INDEX idx_team_invitations_pending 
ON team_invitations(team_id, email_normalized) 
WHERE status = 'pending';
```

**Edge Cases:**
1. **Multiple invitations for same email**: Only one pending allowed
2. **Resending invitation**: Revoke old, create new
3. **Invitation after acceptance**: Allowed (new invitation)

---

## Training System Edge Cases

### ACWR Baseline < 28 Days

**Scenario**: User has less than 28 days of training data

**Handling:**

**Rule**: Show "insufficient baseline" until day 28

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION calculate_acwr_safe(
  player_uuid UUID,
  reference_date DATE
)
RETURNS TABLE (
  acwr DECIMAL(5,2),
  risk_level VARCHAR(20),
  baseline_days INTEGER,
  acute_7 DECIMAL(10,2),
  chronic_28 DECIMAL(10,2)
) AS $$
DECLARE
  baseline_count INTEGER;
  acute_val DECIMAL(10,2);
  chronic_val DECIMAL(10,2);
  acwr_val DECIMAL(5,2);
  risk VARCHAR(20);
BEGIN
  -- Count baseline days
  SELECT COUNT(*) INTO baseline_count
  FROM load_daily
  WHERE player_id = player_uuid
    AND date <= reference_date
    AND date > reference_date - INTERVAL '28 days';
  
  -- Calculate acute (always possible if >= 7 days)
  SELECT COALESCE(AVG(daily_load), 0) INTO acute_val
  FROM load_daily
  WHERE player_id = player_uuid
    AND date <= reference_date
    AND date > reference_date - INTERVAL '6 days';
  
  -- Calculate chronic (requires 28 days)
  SELECT COALESCE(AVG(daily_load), 0) INTO chronic_val
  FROM load_daily
  WHERE player_id = player_uuid
    AND date <= reference_date
    AND date > reference_date - INTERVAL '27 days';
  
  -- Determine risk level
  IF baseline_count < 21 THEN
    -- Insufficient baseline
    RETURN QUERY SELECT 
      NULL::DECIMAL(5,2) as acwr,
      'baseline_building'::VARCHAR(20) as risk_level,
      baseline_count as baseline_days,
      acute_val as acute_7,
      chronic_val as chronic_28;
  ELSIF chronic_val < 50 THEN
    -- Baseline too low
    RETURN QUERY SELECT 
      NULL::DECIMAL(5,2) as acwr,
      'baseline_low'::VARCHAR(20) as risk_level,
      baseline_count as baseline_days,
      acute_val as acute_7,
      chronic_val as chronic_28;
  ELSE
    -- Calculate ACWR
    acwr_val := acute_val / chronic_val;
    risk := get_injury_risk_level(acwr_val);
    
    RETURN QUERY SELECT 
      acwr_val as acwr,
      risk as risk_level,
      baseline_count as baseline_days,
      acute_val as acute_7,
      chronic_val as chronic_28;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

**UI Display:**
- Days 1-20: "Building baseline (X/28 days)"
- Days 21-27: "Baseline almost ready (X/28 days)"
- Day 28+: Show ACWR and risk level

---

### Zero/Near-Zero Chronic Load Division

**Scenario**: Chronic load is 0 or very small, causing ACWR explosion

**Handling:**

**Rule**: Minimum denominator threshold

**Implementation:**
```sql
-- In calculate_acwr_safe function
IF chronic_val < 50 THEN
  -- Baseline too low, don't calculate ACWR
  RETURN QUERY SELECT 
    NULL::DECIMAL(5,2) as acwr,
    'baseline_low'::VARCHAR(20) as risk_level,
    baseline_count as baseline_days,
    acute_val as acute_7,
    chronic_val as chronic_28;
ELSE
  -- Safe to calculate ACWR
  acwr_val := acute_val / chronic_val;
  -- ... rest of logic
END IF;
```

**Alternative**: Use EWMA (Exponentially Weighted Moving Average) instead of simple rolling average

---

### Session Editing After Submission

**Decision**: **Allow editing with recalculation**

**Handling:**

1. **Edit Window**: 
   - Allow edits within 24 hours of completion
   - After 24 hours, require coach/admin approval

2. **Recalculation**:
   - Recalculate `load_daily` for that day
   - Recalculate `load_metrics` for affected date range (next 28 days)
   - Update ACWR and risk level

3. **Audit Trail**:
   - Log original values
   - Log edited values
   - Log editor and timestamp

**Implementation:**
```sql
CREATE TABLE workout_log_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  original_rpe DECIMAL(3,1),
  original_duration INTEGER,
  new_rpe DECIMAL(3,1),
  new_duration INTEGER,
  reason TEXT,
  amended_by UUID NOT NULL REFERENCES auth.users(id),
  amended_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to recalculate load on update
CREATE OR REPLACE FUNCTION recalculate_load_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate daily load
  PERFORM update_load_monitoring_for_date(NEW.player_id, DATE(NEW.completed_at));
  
  -- Recalculate metrics for affected range
  PERFORM recalculate_load_metrics_range(
    NEW.player_id,
    DATE(NEW.completed_at),
    DATE(NEW.completed_at) + INTERVAL '28 days'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_load_on_update
  AFTER UPDATE ON workout_logs
  FOR EACH ROW
  WHEN (OLD.rpe IS DISTINCT FROM NEW.rpe OR OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes)
  EXECUTE FUNCTION recalculate_load_on_update();
```

---

### Planned vs Completed Session Entities

**Current Issue**: `/api/training/sessions` used for both creation and completion

**Solution**: **Separate entities**

**Schema:**
```sql
-- Planned sessions (templates)
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES training_weeks(id),
  -- ... existing fields
);

-- Completed sessions (logs)
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id),
  source_session_id UUID REFERENCES training_sessions(id), -- Optional link to planned session
  planned_date DATE, -- When session was supposed to happen
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- ... existing fields
);
```

**API Endpoints:**
- `POST /api/training/sessions` → Creates planned session
- `POST /api/training/workout-logs` → Creates completed session
- `GET /api/training/today` → Returns planned sessions for today
- `GET /api/training/history` → Returns completed sessions

---

### Periodization Constraints

**Constraints**: Phases sequential, weeks sequential

**Enforcement:**

1. **Database Constraints**:
```sql
-- Phases must be sequential within program
CREATE UNIQUE INDEX idx_phases_sequential 
ON training_phases(program_id, phase_order) 
WHERE deleted_at IS NULL;

-- Weeks must be sequential within phase
CREATE UNIQUE INDEX idx_weeks_sequential 
ON training_weeks(phase_id, week_number) 
WHERE deleted_at IS NULL;

-- Date ranges must not overlap
CREATE OR REPLACE FUNCTION check_phase_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Check no overlap with other phases in same program
  IF EXISTS (
    SELECT 1 FROM training_phases
    WHERE program_id = NEW.program_id
      AND id != NEW.id
      AND deleted_at IS NULL
      AND (
        (NEW.start_date BETWEEN start_date AND end_date)
        OR (NEW.end_date BETWEEN start_date AND end_date)
        OR (NEW.start_date <= start_date AND NEW.end_date >= end_date)
      )
  ) THEN
    RAISE EXCEPTION 'Phase dates overlap with existing phase';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_phase_dates
  BEFORE INSERT OR UPDATE ON training_phases
  FOR EACH ROW
  EXECUTE FUNCTION check_phase_dates();
```

2. **Application Validation**:
```typescript
async function createPhase(programId: string, phase: PhaseInput) {
  // Check sequential order
  const existingPhases = await getPhases(programId);
  const maxOrder = Math.max(...existingPhases.map(p => p.phase_order), 0);
  if (phase.phase_order !== maxOrder + 1) {
    throw new Error('Phases must be sequential');
  }
  
  // Check date ranges
  if (existingPhases.length > 0) {
    const lastPhase = existingPhases[existingPhases.length - 1];
    if (phase.start_date <= lastPhase.end_date) {
      throw new Error('Phase start date must be after previous phase end date');
    }
  }
  
  // Create phase
  return await createPhaseRecord(programId, phase);
}
```

**Edge Case**: Coach edits dates mid-season

**Handling:**
- Allow date edits if no sessions completed yet
- If sessions completed: Require admin approval or create new phase
- Notify affected players of schedule changes

---

## Tournament Edge Cases

### Tournament Formats

**Supported Formats:**
1. **Round Robin**: All teams play each other
2. **Single Elimination**: Bracket format
3. **Pools + Playoffs**: Group stage then knockout

**Implementation:**
```sql
CREATE TABLE tournaments (
  -- ... existing fields
  format VARCHAR(50) NOT NULL CHECK (format IN ('round_robin', 'single_elimination', 'pools_playoffs')),
  bracket_metadata JSONB -- Format-specific data
);
```

**Bracket Metadata Examples:**
```json
// Single Elimination
{
  "rounds": [
    { "round": 1, "matches": [...] },
    { "round": 2, "matches": [...] }
  ]
}

// Pools + Playoffs
{
  "pools": [
    { "pool": "A", "teams": [...] },
    { "pool": "B", "teams": [...] }
  ],
  "playoff_format": "single_elimination"
}
```

---

### Tie Breakers

**Rules:**
1. Head-to-head record
2. Point differential
3. Points scored
4. Coin flip (last resort)

**Implementation:**
```sql
CREATE TABLE tournament_standings (
  tournament_id UUID NOT NULL REFERENCES tournaments(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  points_for INTEGER DEFAULT 0,
  points_against INTEGER DEFAULT 0,
  point_differential INTEGER GENERATED ALWAYS AS (points_for - points_against) STORED,
  head_to_head_wins INTEGER DEFAULT 0,
  rank INTEGER,
  PRIMARY KEY (tournament_id, team_id)
);

-- Function to calculate standings
CREATE OR REPLACE FUNCTION calculate_tournament_standings(tournament_uuid UUID)
RETURNS TABLE (
  team_id UUID,
  wins INTEGER,
  losses INTEGER,
  point_differential INTEGER,
  rank INTEGER
) AS $$
BEGIN
  -- Calculate wins/losses
  -- Calculate point differential
  -- Apply tie breakers
  -- Assign ranks
  RETURN QUERY SELECT ...;
END;
$$ LANGUAGE plpgsql;
```

---

### Match Editing Rules

**Rules:**
1. **Before match start**: Free editing
2. **After match start**: Locked (only organizer can edit)
3. **After match complete**: Locked (only organizer with reason)

**Implementation:**
```sql
CREATE TABLE tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id),
  team1_id UUID NOT NULL REFERENCES teams(id),
  team2_id UUID NOT NULL REFERENCES teams(id),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  team1_score INTEGER CHECK (team1_score >= 0),
  team2_score INTEGER CHECK (team2_score >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  edited_at TIMESTAMPTZ,
  edit_reason TEXT,
  edited_by UUID REFERENCES auth.users(id)
);

-- Trigger to prevent editing completed matches
CREATE OR REPLACE FUNCTION prevent_match_editing()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    -- Only organizer can edit completed matches
    IF NOT EXISTS (
      SELECT 1 FROM tournaments
      WHERE id = NEW.tournament_id
        AND created_by = auth.user_id()
    ) THEN
      RAISE EXCEPTION 'Only tournament organizer can edit completed matches';
    END IF;
    
    -- Require edit reason
    IF NEW.edit_reason IS NULL OR NEW.edit_reason = '' THEN
      RAISE EXCEPTION 'Edit reason required for completed matches';
    END IF;
    
    NEW.edited_at = NOW();
    NEW.edited_by = auth.user_id();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_match_editing
  BEFORE UPDATE ON tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION prevent_match_editing();
```

---

### Team Withdrawal Rules

**Rules:**
1. **Before tournament start**: Free withdrawal, refund if applicable
2. **After tournament start**: Withdrawal allowed, no refund, affects bracket
3. **After first match**: Withdrawal requires organizer approval

**Implementation:**
```typescript
async function withdrawFromTournament(tournamentId: string, teamId: string) {
  const tournament = await getTournament(tournamentId);
  const registration = await getRegistration(tournamentId, teamId);
  
  // Check withdrawal rules
  if (tournament.start_date > new Date()) {
    // Before start: free withdrawal
    await updateRegistration(registration.id, { status: 'withdrawn' });
    if (tournament.entry_fee > 0) {
      await processRefund(registration.id);
    }
  } else if (tournament.start_date <= new Date() && !hasPlayedMatch(teamId, tournamentId)) {
    // After start, before first match: withdrawal allowed
    await updateRegistration(registration.id, { status: 'withdrawn' });
    await updateBracket(tournamentId); // Remove from bracket
  } else {
    // After first match: require approval
    throw new Error('WITHDRAWAL_REQUIRES_APPROVAL');
  }
}
```

---

## Analytics Edge Cases

### Event Schema & Retention

**Event Schema:**
```typescript
interface AnalyticsEvent {
  user_id?: UUID;
  event_type: string;
  event_data: {
    feature?: string;
    action?: string;
    [key: string]: any;
  };
  session_id: string;
  page_url?: string;
  user_agent?: string;
  created_at: Timestamp;
}
```

**Retention Policy:**
- **Raw events**: 90 days
- **Aggregates**: Indefinite
- **PII minimization**: Hash user_id for long-term storage

**Implementation:**
```sql
-- Automated cleanup job
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron (if available)
-- SELECT cron.schedule('cleanup-analytics', '0 2 * * *', 'SELECT cleanup_old_analytics_events()');
```

---

## Related Documentation

- [DATABASE_SCHEMA_CONSTRAINTS.md](./DATABASE_SCHEMA_CONSTRAINTS.md) - Schema details
- [WORKFLOW_AND_BUSINESS_LOGIC.md](../WORKFLOW_AND_BUSINESS_LOGIC.md) - Business logic

