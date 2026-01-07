# Flow-to-Feature Fix Proposal

**Generated:** January 2026  
**Purpose:** Concrete implementation plans to fix broken promises identified in audit  
**Priority:** High → Medium → Low

---

## Executive Summary

This document provides actionable fixes for the **38 broken promises** identified in the Flow-to-Feature Audit. Each fix includes:
- **Problem**: What's broken
- **Solution**: How to fix it
- **Implementation**: Code changes required
- **Testing**: How to verify
- **Priority**: When to implement

---

## Priority 1: Data Confidence Indicators (Critical)

### Problem
Users see metrics (ACWR, readiness, wellness) without knowing data quality. Component exists but not integrated.

### Solution
Integrate `ConfidenceIndicatorComponent` into all metric displays and calculate confidence from missing data patterns.

### Implementation Plan

#### 1.1 Create Data Confidence Service

**File:** `angular/src/app/core/services/data-confidence.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class DataConfidenceService {
  /**
   * Calculate confidence score for wellness data
   * Returns 0.0 to 1.0 based on completeness and recency
   */
  calculateWellnessConfidence(
    wellnessData: WellnessData[],
    daysRequired: number = 7
  ): ConfidenceScore {
    const now = new Date();
    const cutoff = new Date(now.getTime() - daysRequired * 24 * 60 * 60 * 1000);
    
    const recentData = wellnessData.filter(d => new Date(d.date) >= cutoff);
    const completeness = recentData.length / daysRequired;
    
    // Check for missing metrics in recent entries
    const missingMetrics: string[] = [];
    recentData.forEach(entry => {
      if (!entry.sleep) missingMetrics.push('sleep');
      if (!entry.energy) missingMetrics.push('energy');
      if (!entry.soreness) missingMetrics.push('soreness');
      if (!entry.stress) missingMetrics.push('stress');
      if (!entry.mood) missingMetrics.push('mood');
    });
    
    // Calculate score (completeness * metric completeness)
    const metricCompleteness = 1 - (missingMetrics.length / (recentData.length * 5));
    const score = Math.min(completeness * metricCompleteness, 1.0);
    
    return {
      score,
      missingInputs: [...new Set(missingMetrics)],
      staleData: recentData.length < daysRequired ? ['wellness'] : []
    };
  }
  
  /**
   * Calculate confidence for ACWR calculation
   */
  calculateACWRConfidence(
    trainingDays: number,
    requiredDays: number = 21
  ): ConfidenceScore {
    const completeness = Math.min(trainingDays / requiredDays, 1.0);
    
    return {
      score: completeness,
      missingInputs: trainingDays < requiredDays ? ['training_data'] : [],
      staleData: []
    };
  }
}
```

#### 1.2 Integrate into Player Dashboard

**File:** `angular/src/app/features/dashboard/player-dashboard.component.ts`

**Changes:**
1. Inject `DataConfidenceService`
2. Calculate confidence for readiness score
3. Add `ConfidenceIndicatorComponent` to readiness card
4. Show confidence badge on ACWR card

```typescript
// Add to component
readinessConfidence = computed(() => {
  const wellness = this.wellnessService.wellnessData();
  return this.confidenceService.calculateWellnessConfidence(wellness);
});

acwrConfidence = computed(() => {
  const daysLogged = this.trainingDaysLogged();
  return this.confidenceService.calculateACWRConfidence(daysLogged || 0);
});
```

**Template changes:**
```html
<!-- Add to readiness card -->
<app-confidence-indicator
  [score]="readinessConfidence().score"
  [missingInputs]="readinessConfidence().missingInputs"
  [staleData]="readinessConfidence().staleData"
  [showDetails]="true"
></app-confidence-indicator>

<!-- Add to ACWR card -->
<app-confidence-indicator
  [score]="acwrConfidence().score"
  [missingInputs]="acwrConfidence().missingInputs"
  [showDetails]="true"
></app-confidence-indicator>
```

#### 1.3 Integrate into ACWR Dashboard

**File:** `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts`

**Changes:**
- Add confidence calculation
- Display confidence indicator above ACWR value
- Show confidence range if < 0.9

#### 1.4 Integrate into Game Day Readiness

**File:** `angular/src/app/features/game/game-day-readiness/game-day-readiness.component.ts`

**Changes:**
- Calculate confidence from available metrics
- Display confidence next to readiness score
- Warn if confidence < 0.7

#### 1.5 Integrate into AI Coach

**File:** `angular/src/app/core/services/ai-chat.service.ts` (or wherever AI responses are generated)

**Changes:**
- Check data confidence before generating response
- Include confidence in response: "Based on available data (82% confidence)..."
- Switch to conservative advice if confidence < 0.7

### Testing
- [ ] Confidence shows correctly when all data present (should be ~1.0)
- [ ] Confidence decreases when wellness missing (should be < 0.9)
- [ ] Confidence decreases when training data missing (should be < 0.7)
- [ ] Missing inputs list shows correct metrics
- [ ] AI Coach mentions confidence in responses

### Priority: **IMMEDIATE** (User trust critical)

---

## Priority 2: Missing Wellness Detection & Coach Alerts

### Problem
Coaches don't see prominent "Data Incomplete" badges when players skip wellness for 3+ days.

### Solution
Add data completeness detection service and prominent badges on coach dashboard and roster.

### Implementation Plan

#### 2.1 Create Missing Wellness Detection Service

**File:** `angular/src/app/core/services/missing-data-detection.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class MissingDataDetectionService {
  /**
   * Check if player has missing wellness data
   * Returns days since last check-in
   */
  async checkMissingWellness(playerId: string): Promise<MissingDataStatus> {
    const { data } = await this.supabase
      .from('wellness_checkins')
      .select('date')
      .eq('user_id', playerId)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    if (!data) {
      return { missing: true, daysMissing: 999, severity: 'critical' };
    }
    
    const lastCheckin = new Date(data.date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24));
    
    let severity: 'none' | 'warning' | 'critical' = 'none';
    if (daysDiff >= 7) severity = 'critical';
    else if (daysDiff >= 3) severity = 'warning';
    
    return {
      missing: daysDiff >= 3,
      daysMissing: daysDiff,
      severity,
      lastCheckin: data.date
    };
  }
  
  /**
   * Get all players with missing wellness data
   */
  async getPlayersWithMissingWellness(teamId: string): Promise<PlayerMissingData[]> {
    // Query team members and check each for missing wellness
    // Return array of players with missing data status
  }
}
```

#### 2.2 Add Badge to Coach Dashboard

**File:** `angular/src/app/features/coach/dashboard/coach-dashboard.component.ts`

**Changes:**
- Add "Data Incomplete" section showing players with missing wellness
- Display prominent badges on player cards
- Show days missing and confidence impact

**Template:**
```html
<!-- Add section for missing data -->
@if (playersWithMissingData().length > 0) {
  <section class="missing-data-alert">
    <h3>⚠️ Data Incomplete</h3>
    @for (player of playersWithMissingData(); track player.id) {
      <p-card>
        <div class="player-missing-data">
          <span>{{ player.name }}</span>
          <p-tag 
            [severity]="player.severity === 'critical' ? 'danger' : 'warning'"
            [value]="'Missing ' + player.daysMissing + ' days'"
          ></p-tag>
        </div>
      </p-card>
    }
  </section>
}
```

#### 2.3 Add Badge to Roster Player Cards

**File:** `angular/src/app/features/roster/components/roster-player-card.component.ts`

**Changes:**
- Check missing wellness status for each player
- Display badge on card if data incomplete
- Link to player detail page

#### 2.4 Create Backend Function for Missing Data Detection

**File:** `netlify/functions/missing-data-detection.cjs`

**Purpose:** Batch check all team members for missing wellness data

**Implementation:**
```javascript
async function checkTeamMissingData(teamId) {
  // Get all team members
  // Check last wellness check-in for each
  // Return players with 3+ days missing
  // Create notifications for coach if critical
}
```

### Testing
- [ ] Badge appears after 3 days missing wellness
- [ ] Badge severity increases after 7 days
- [ ] Coach dashboard shows section with missing data players
- [ ] Roster cards show badges
- [ ] Notifications sent when critical (7+ days)

### Priority: **IMMEDIATE** (Data quality critical)

---

## Priority 3: Cross-Day Continuity - Game Day Recovery

### Problem
System doesn't automatically inject 48h recovery protocol after game day.

### Solution
Create game day recovery trigger that auto-injects recovery blocks into training schedule.

### Implementation Plan

#### 3.1 Create Game Day Recovery Service

**File:** `angular/src/app/core/services/game-day-recovery.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class GameDayRecoveryService {
  /**
   * Check if player had game today and trigger recovery protocol
   */
  async checkAndTriggerRecovery(playerId: string, gameDate: Date): Promise<void> {
    // Check if game was logged
    const { data: game } = await this.supabase
      .from('games')
      .select('*')
      .eq('player_id', playerId)
      .eq('date', gameDate.toISOString().split('T')[0])
      .single();
    
    if (!game) return;
    
    // Create recovery protocol for next 48 hours
    await this.createRecoveryProtocol(playerId, gameDate);
  }
  
  /**
   * Create 48h recovery protocol
   */
  private async createRecoveryProtocol(playerId: string, gameDate: Date): Promise<void> {
    const day1 = new Date(gameDate);
    day1.setDate(day1.getDate() + 1);
    
    const day2 = new Date(gameDate);
    day2.setDate(day2.getDate() + 2);
    
    // Create recovery blocks for day 1 and day 2
    await Promise.all([
      this.createRecoveryBlock(playerId, day1, {
        maxLoad: 0.3,
        focus: 'sleep',
        restrictions: ['no_intense_work', 'hydration_focus']
      }),
      this.createRecoveryBlock(playerId, day2, {
        maxLoad: 0.5,
        focus: 'active_recovery',
        restrictions: ['light_movement_only', 'no_contact']
      })
    ]);
  }
}
```

#### 3.2 Integrate into Daily Protocol Resolver

**File:** `angular/src/app/today/resolution/today-state.resolver.ts`

**Changes:**
- Check if yesterday was game day
- If yes, inject recovery protocol override
- Show recovery blocks in today's schedule

#### 3.3 Add Recovery Protocol Display

**File:** `angular/src/app/features/today/today.component.ts`

**Changes:**
- Show recovery protocol banner if active
- Display recovery restrictions
- Show when protocol ends

### Testing
- [ ] Recovery protocol triggers after game day
- [ ] Day 1 shows 30% max load
- [ ] Day 2 shows 50% max load
- [ ] Day 3 returns to normal training
- [ ] Protocol visible on player dashboard

### Priority: **HIGH** (User experience)

---

## Priority 4: Cross-Day Continuity - ACWR Spike Load Capping

### Problem
When ACWR spikes >1.5, system doesn't automatically cap next 3 sessions at 70% load.

### Solution
Create ACWR spike detection that auto-caps training load for next sessions.

### Implementation Plan

#### 4.1 Create ACWR Spike Detection Service

**File:** `angular/src/app/core/services/acwr-spike-detection.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AcwrSpikeDetectionService {
  /**
   * Check for ACWR spike and create load cap if needed
   */
  async checkAndCapLoad(playerId: string, acwrValue: number): Promise<void> {
    if (acwrValue <= 1.5) return;
    
    // Check if cap already exists
    const existingCap = await this.getActiveLoadCap(playerId);
    if (existingCap) return;
    
    // Create load cap for next 3 sessions
    await this.createLoadCap(playerId, {
      maxLoad: 0.7,
      sessionsRemaining: 3,
      reason: `ACWR spike detected (${acwrValue.toFixed(2)})`,
      createdAt: new Date()
    });
  }
  
  /**
   * Create load cap record
   */
  private async createLoadCap(playerId: string, cap: LoadCap): Promise<void> {
    await this.supabase
      .from('load_caps')
      .insert({
        player_id: playerId,
        max_load_percent: cap.maxLoad * 100,
        sessions_remaining: cap.sessionsRemaining,
        reason: cap.reason,
        created_at: cap.createdAt.toISOString(),
        status: 'active'
      });
  }
  
  /**
   * Check if player has active load cap
   */
  async getActiveLoadCap(playerId: string): Promise<LoadCap | null> {
    const { data } = await this.supabase
      .from('load_caps')
      .select('*')
      .eq('player_id', playerId)
      .eq('status', 'active')
      .single();
    
    return data ? this.mapToLoadCap(data) : null;
  }
  
  /**
   * Decrement sessions remaining when session logged
   */
  async decrementLoadCap(playerId: string): Promise<void> {
    const cap = await this.getActiveLoadCap(playerId);
    if (!cap) return;
    
    const newRemaining = cap.sessionsRemaining - 1;
    
    if (newRemaining <= 0) {
      // Deactivate cap
      await this.supabase
        .from('load_caps')
        .update({ status: 'inactive' })
        .eq('player_id', playerId)
        .eq('status', 'active');
    } else {
      // Update remaining
      await this.supabase
        .from('load_caps')
        .update({ sessions_remaining: newRemaining })
        .eq('player_id', playerId)
        .eq('status', 'active');
    }
  }
}
```

#### 4.2 Create Database Table

**File:** `database/migrations/XXX_load_caps.sql`

```sql
CREATE TABLE load_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_load_percent INTEGER NOT NULL CHECK (max_load_percent BETWEEN 0 AND 100),
  sessions_remaining INTEGER NOT NULL DEFAULT 3,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'overridden')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_load_caps_player_active ON load_caps(player_id, status) WHERE status = 'active';
```

#### 4.3 Integrate into Training Session Logger

**File:** `netlify/functions/training-complete.cjs` or `daily-protocol.cjs`

**Changes:**
- After logging session, check for active load cap
- If cap exists, verify session load doesn't exceed cap
- Decrement sessions remaining
- Warn if coach tries to override cap

#### 4.4 Display Load Cap on Dashboard

**File:** `angular/src/app/features/dashboard/player-dashboard.component.ts`

**Changes:**
- Show load cap indicator if active
- Display sessions remaining
- Show reason for cap

### Testing
- [ ] Load cap created when ACWR > 1.5
- [ ] Next 3 sessions capped at 70%
- [ ] Sessions remaining decrements correctly
- [ ] Cap removed after 3 sessions
- [ ] Coach can override with reason logged

### Priority: **HIGH** (Safety critical)

---

## Priority 5: Coach Override Transparency

### Problem
No logging or display of when coaches override AI recommendations.

### Solution
Create override logging system and display override history on player cards.

### Implementation Plan

#### 5.1 Create Override Logging Service

**File:** `angular/src/app/core/services/override-logging.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class OverrideLoggingService {
  /**
   * Log coach override of AI recommendation
   */
  async logOverride(override: CoachOverride): Promise<void> {
    await this.supabase
      .from('coach_overrides')
      .insert({
        coach_id: override.coachId,
        player_id: override.playerId,
        override_type: override.type, // 'training_load', 'session_modification', 'acwr_override'
        ai_recommendation: override.aiRecommendation,
        coach_decision: override.coachDecision,
        reason: override.reason,
        context: override.context, // JSONB with ACWR, wellness, etc.
        created_at: new Date().toISOString()
      });
  }
  
  /**
   * Get override history for player
   */
  async getPlayerOverrides(playerId: string): Promise<CoachOverride[]> {
    const { data } = await this.supabase
      .from('coach_overrides')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    return data || [];
  }
}
```

#### 5.2 Create Database Table

**File:** `database/migrations/XXX_coach_overrides.sql`

```sql
CREATE TABLE coach_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  override_type VARCHAR(50) NOT NULL,
  ai_recommendation JSONB NOT NULL,
  coach_decision JSONB NOT NULL,
  reason TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coach_overrides_player ON coach_overrides(player_id, created_at DESC);
CREATE INDEX idx_coach_overrides_coach ON coach_overrides(coach_id, created_at DESC);
```

#### 5.3 Add Override Display to Player Cards

**File:** `angular/src/app/features/roster/components/roster-player-card.component.ts`

**Changes:**
- Load override history for player
- Show "X overrides this week" badge
- Link to override history modal

#### 5.4 Create Override History Modal

**File:** `angular/src/app/features/roster/components/override-history-modal.component.ts`

**Purpose:** Show full override history with AI recommendation vs coach decision

**Display:**
```
Override History for John Doe

Jan 15, 2026 - Training Load Override
AI Suggested: 60% load
Coach Set: 80% load
Reason: "Player feeling strong, increasing for tournament prep"
Context: ACWR 1.2, Wellness 75%

Jan 12, 2026 - Session Modification
AI Suggested: Recovery day
Coach Set: Light practice
Reason: "Team practice scheduled"
```

#### 5.5 Integrate into Training Plan Modifications

**File:** `netlify/functions/coach.cjs` (or wherever coach modifies training)

**Changes:**
- When coach modifies AI-recommended session, log override
- Capture AI recommendation before modification
- Store coach's final decision
- Require reason if override is significant (>20% change)

### Testing
- [ ] Override logged when coach modifies AI recommendation
- [ ] Override history visible on player card
- [ ] Modal shows AI vs Coach comparison
- [ ] Reason required for significant overrides
- [ ] Override count badge updates correctly

### Priority: **HIGH** (Accountability)

---

## Priority 6: Ownership Transition Logging

### Problem
No audit trail for ownership transitions (Player → Coach → Physio, etc.)

### Solution
Create ownership transition logging system with accountability tracking.

### Implementation Plan

#### 6.1 Create Ownership Transition Service

**File:** `angular/src/app/core/services/ownership-transition.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class OwnershipTransitionService {
  /**
   * Log ownership transition
   */
  async logTransition(transition: OwnershipTransition): Promise<void> {
    await this.supabase
      .from('ownership_transitions')
      .insert({
        trigger: transition.trigger,
        from_role: transition.fromRole,
        to_role: transition.toRole,
        player_id: transition.playerId,
        action_required: transition.actionRequired,
        status: 'pending',
        created_at: new Date().toISOString()
      });
  }
  
  /**
   * Update transition status
   */
  async updateStatus(
    transitionId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  ): Promise<void> {
    await this.supabase
      .from('ownership_transitions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', transitionId);
  }
}
```

#### 6.2 Create Database Table

**File:** `database/migrations/XXX_ownership_transitions.sql`

```sql
CREATE TABLE ownership_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger VARCHAR(100) NOT NULL, -- 'wellness_low', 'acwr_critical', 'injury_flag', etc.
  from_role VARCHAR(50) NOT NULL,
  to_role VARCHAR(50) NOT NULL,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_required TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ownership_transitions_player ON ownership_transitions(player_id, created_at DESC);
CREATE INDEX idx_ownership_transitions_status ON ownership_transitions(status, created_at DESC);
```

#### 6.3 Integrate into Wellness Check-in

**File:** `netlify/functions/wellness-checkin.cjs`

**Changes:**
- When wellness < 40%, log transition: Player → Coach
- Set action required: "Review player status"
- Create notification for coach

#### 6.4 Integrate into ACWR Alerts

**File:** `angular/src/app/core/services/acwr-alerts.service.ts`

**Changes:**
- When ACWR > 1.3, log transition: Player → Coach
- When ACWR > 1.5, log transition with urgent status
- Set action required based on severity

#### 6.5 Integrate into Injury Flagging

**File:** `netlify/functions/coach.cjs` (injury management)

**Changes:**
- When injury flagged, log transition: Coach → Physio
- Set action required: "Create RTP protocol"
- Notify physio

#### 6.6 Create Ownership Dashboard

**File:** `angular/src/app/features/staff/ownership-dashboard.component.ts`

**Purpose:** Show all pending ownership transitions with accountability

**Display:**
```
Pending Ownership Transitions

Wellness < 40% → Coach Review
Player: John Doe
Status: Pending (2 hours ago)
Action Required: Review player status
[View Player] [Mark In Progress]

ACWR > 1.5 → Coach Action Required
Player: Jane Smith
Status: Overdue (26 hours ago)
Action Required: Adjust training load immediately
[View Player] [Take Action]
```

### Testing
- [ ] Transition logged when wellness < 40%
- [ ] Transition logged when ACWR > 1.3
- [ ] Transition logged when injury flagged
- [ ] Status updates correctly
- [ ] Overdue detection works (24h for critical)
- [ ] Dashboard shows pending transitions

### Priority: **MEDIUM** (Governance)

---

## Priority 7: Exception Handling - Late Logging Detection

### Problem
No detection or flagging of late training logs (24-48h) or retroactive logs (>48h).

### Solution
Add timestamp checking to training log submission and flag late/retroactive entries.

### Implementation Plan

#### 7.1 Add Late Logging Detection

**File:** `netlify/functions/training-complete.cjs`

**Changes:**
```javascript
async function logSession(supabase, userId, payload, headers) {
  const sessionDate = new Date(payload.session_date || payload.completed_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
  
  let logStatus = 'on_time';
  let requiresApproval = false;
  
  if (hoursDiff > 48) {
    logStatus = 'retroactive';
    requiresApproval = true;
  } else if (hoursDiff > 24) {
    logStatus = 'late';
  }
  
  // Insert session with status
  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      ...payload,
      log_status: logStatus,
      requires_coach_approval: requiresApproval,
      hours_delayed: hoursDiff > 24 ? Math.floor(hoursDiff) : null
    });
  
  // If retroactive, notify coach for approval
  if (requiresApproval) {
    await notifyCoachForApproval(userId, data.id, hoursDiff);
  }
  
  return data;
}
```

#### 7.2 Add Database Fields

**File:** `database/migrations/XXX_training_session_log_status.sql`

```sql
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS log_status VARCHAR(20) DEFAULT 'on_time' 
CHECK (log_status IN ('on_time', 'late', 'retroactive'));

ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS requires_coach_approval BOOLEAN DEFAULT false;

ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS hours_delayed INTEGER;

CREATE INDEX idx_training_sessions_log_status ON training_sessions(log_status, created_at DESC);
```

#### 7.3 Display Late Log Badge

**File:** `angular/src/app/features/training/training.component.ts`

**Changes:**
- Show badge on late logs: "Logged 26h late"
- Show approval badge on retroactive: "Requires coach approval"
- Filter to show only pending approvals for coach

#### 7.4 Create Coach Approval Flow

**File:** `angular/src/app/features/coach/retroactive-log-approval.component.ts`

**Purpose:** Coach reviews and approves retroactive logs

**Display:**
```
Retroactive Log Approval

Player: John Doe
Session Date: Jan 14, 2026 (3 days ago)
Logged: Jan 17, 2026
Hours Delayed: 72

Session Details:
- Duration: 60 min
- RPE: 7
- Type: Practice

[Approve] [Reject] [Request More Info]
```

### Testing
- [ ] Late log detected (24-48h)
- [ ] Retroactive log detected (>48h)
- [ ] Badge shown on late logs
- [ ] Coach notified for retroactive logs
- [ ] Approval workflow works
- [ ] ACWR recalculated correctly with timestamp

### Priority: **MEDIUM** (Data quality)

---

## Priority 8: Exception Handling - Conflict Detection

### Problem
No detection when player logs high RPE but coach marked session as "Recovery".

### Solution
Add conflict detection comparing player RPE with coach session type.

### Implementation Plan

#### 8.1 Add Conflict Detection

**File:** `netlify/functions/training-complete.cjs`

**Changes:**
```javascript
async function detectConflict(sessionData) {
  const conflicts = [];
  
  // Check RPE vs Session Type
  if (sessionData.rpe && sessionData.session_type) {
    const sessionTypeIntensity = {
      'recovery': { max: 4 },
      'light': { max: 5 },
      'moderate': { max: 7 },
      'intense': { min: 7 }
    };
    
    const typeRules = sessionTypeIntensity[sessionData.session_type];
    if (typeRules) {
      if (typeRules.max && sessionData.rpe > typeRules.max) {
        conflicts.push({
          type: 'rpe_vs_session_type',
          message: `Player logged RPE ${sessionData.rpe} but session marked as ${sessionData.session_type}`,
          playerValue: sessionData.rpe,
          coachValue: sessionData.session_type
        });
      }
      if (typeRules.min && sessionData.rpe < typeRules.min) {
        conflicts.push({
          type: 'rpe_vs_session_type',
          message: `Player logged RPE ${sessionData.rpe} but session marked as ${sessionData.session_type}`,
          playerValue: sessionData.rpe,
          coachValue: sessionData.session_type
        });
      }
    }
  }
  
  return conflicts;
}
```

#### 8.2 Store Conflicts in Database

**File:** `database/migrations/XXX_training_session_conflicts.sql`

```sql
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS conflicts JSONB DEFAULT '[]';

CREATE INDEX idx_training_sessions_conflicts ON training_sessions 
USING GIN (conflicts) WHERE jsonb_array_length(conflicts) > 0;
```

#### 8.3 Display Conflict Badge

**File:** `angular/src/app/features/training/training.component.ts`

**Changes:**
- Show conflict badge on sessions with conflicts
- Display conflict details in tooltip
- Link to conflict resolution

#### 8.4 Create Conflict Resolution Flow

**File:** `angular/src/app/features/coach/conflict-resolution.component.ts`

**Purpose:** Coach reviews conflicts and resolves

**Display:**
```
Conflict Detected

Session: Jan 15, 2026 Practice
Player logged: RPE 8 (High intensity)
Coach marked: Recovery (Light)

Resolution Options:
[ ] Use Player RPE (recommended)
[ ] Use Coach Session Type
[ ] Contact Player for Clarification

[Resolve Conflict]
```

### Testing
- [ ] Conflict detected when RPE doesn't match session type
- [ ] Conflict badge shown on session
- [ ] Coach sees conflict in dashboard
- [ ] Resolution workflow works
- [ ] System uses player RPE by default

### Priority: **MEDIUM** (Data quality)

---

## Priority 9: Continuity Indicators - "What's Next" Section

### Problem
No visibility into active protocols, recovery blocks, or upcoming continuity events.

### Solution
Add "What's Next" section to player dashboard and "Active Protocols" to coach dashboard.

### Implementation Plan

#### 9.1 Create Continuity Service

**File:** `angular/src/app/core/services/continuity-indicators.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ContinuityIndicatorsService {
  /**
   * Get active continuity events for player
   */
  async getPlayerContinuity(playerId: string): Promise<ContinuityEvent[]> {
    const events: ContinuityEvent[] = [];
    
    // Check for active recovery protocol
    const recovery = await this.getActiveRecovery(playerId);
    if (recovery) {
      events.push({
        type: 'recovery_protocol',
        title: 'Game Day Recovery',
        description: `Active for ${recovery.daysRemaining} more day(s)`,
        status: 'active',
        endDate: recovery.endDate
      });
    }
    
    // Check for active load cap
    const loadCap = await this.getActiveLoadCap(playerId);
    if (loadCap) {
      events.push({
        type: 'load_cap',
        title: 'ACWR Load Cap',
        description: `${loadCap.sessionsRemaining} sessions remaining at 70% max`,
        status: 'active',
        endDate: null
      });
    }
    
    // Check for travel recovery
    const travel = await this.getActiveTravelRecovery(playerId);
    if (travel) {
      events.push({
        type: 'travel_recovery',
        title: 'Travel Recovery',
        description: `Complete in ${travel.daysRemaining} day(s)`,
        status: 'active',
        endDate: travel.endDate
      });
    }
    
    return events;
  }
}
```

#### 9.2 Add to Player Dashboard

**File:** `angular/src/app/features/dashboard/player-dashboard.component.ts`

**Template:**
```html
<!-- Add "What's Next" section -->
@if (continuityEvents().length > 0) {
  <section class="continuity-section">
    <h3>What's Next</h3>
    @for (event of continuityEvents(); track event.type) {
      <p-card>
        <div class="continuity-event">
          <span class="event-icon">{{ getEventIcon(event.type) }}</span>
          <div class="event-details">
            <h4>{{ event.title }}</h4>
            <p>{{ event.description }}</p>
          </div>
        </div>
      </p-card>
    }
  </section>
}
```

#### 9.3 Add to Coach Dashboard

**File:** `angular/src/app/features/coach/dashboard/coach-dashboard.component.ts`

**Template:**
```html
<!-- Add "Active Protocols" section -->
<section class="active-protocols">
  <h3>Active Protocols</h3>
  
  @if (gameDayRecovery().length > 0) {
    <div class="protocol-group">
      <h4>🏈 Game Day Recovery ({{ gameDayRecovery().length }} players)</h4>
      @for (player of gameDayRecovery(); track player.id) {
        <p>{{ player.name }}: Day {{ player.dayNumber }}</p>
      }
    </div>
  }
  
  @if (loadCaps().length > 0) {
    <div class="protocol-group">
      <h4>⚠️ ACWR Load Caps ({{ loadCaps().length }} players)</h4>
      @for (player of loadCaps(); track player.id) {
        <p>{{ player.name }}: {{ player.sessionsRemaining }} sessions remaining</p>
      }
    </div>
  }
</section>
```

### Testing
- [ ] "What's Next" shows active recovery protocols
- [ ] Shows load caps with sessions remaining
- [ ] Shows travel recovery status
- [ ] Coach dashboard shows team-wide protocols
- [ ] Events disappear when complete

### Priority: **MEDIUM** (User experience)

---

## Priority 10: Multi-Role Collaboration Feed

### Problem
No shared insight feed for professionals to communicate with role-filtered visibility.

### Solution
Create shared insight feed system with role-based filtering.

### Implementation Plan

#### 10.1 Create Insight Feed Service

**File:** `angular/src/app/core/services/insight-feed.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class InsightFeedService {
  /**
   * Create professional insight
   */
  async createInsight(insight: ProfessionalInsight): Promise<void> {
    await this.supabase
      .from('professional_insights')
      .insert({
        creator_role: insight.creatorRole,
        creator_id: insight.creatorId,
        player_id: insight.playerId,
        insight_type: insight.type,
        content: insight.content,
        visibility_rules: insight.visibilityRules, // JSONB with role permissions
        created_at: new Date().toISOString()
      });
  }
  
  /**
   * Get insights visible to current user
   */
  async getVisibleInsights(userId: string, role: string): Promise<Insight[]> {
    // Query insights with role-filtered visibility
    // Return only what user's role can see
  }
}
```

#### 10.2 Create Database Tables

**File:** `database/migrations/XXX_professional_insights.sql`

```sql
CREATE TABLE professional_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_role VARCHAR(50) NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- 'rtp_update', 'nutrition_note', 'mental_health', etc.
  content JSONB NOT NULL,
  visibility_rules JSONB NOT NULL, -- {coach: 'full', player: 'full', physio: 'summary'}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_professional_insights_player ON professional_insights(player_id, created_at DESC);
CREATE INDEX idx_professional_insights_creator ON professional_insights(creator_id, created_at DESC);
```

#### 10.3 Create Insight Feed Component

**File:** `angular/src/app/features/staff/insight-feed.component.ts`

**Purpose:** Display role-filtered feed of professional insights

**Display:**
```
Recent Insights
─────────────────

🏥 Physio - 2 hours ago
"John Doe cleared for Phase 2"
[View Details] →

🥗 Nutritionist - 5 hours ago
"Tournament meal plan updated"
[View Plan] →

🧠 Psychologist - 1 day ago
"Team mental wellness check complete"
[View Summary] →

[Filter: All | Physio | Nutrition | Psychology]
```

#### 10.4 Integrate into Dashboards

**File:** `angular/src/app/features/coach/dashboard/coach-dashboard.component.ts`
**File:** `angular/src/app/features/staff/physiotherapist-dashboard.component.ts`
**File:** `angular/src/app/features/staff/nutritionist-dashboard.component.ts`

**Changes:**
- Add insight feed section
- Show role-appropriate insights
- Allow creating new insights

### Testing
- [ ] Physio can create insight visible to coach
- [ ] Coach sees physio insights
- [ ] Player sees appropriate insights
- [ ] Role filtering works correctly
- [ ] Feed updates in real-time

### Priority: **MEDIUM** (Collaboration)

---

## Priority 11: Offboarding Flows

### Problem
No season end archiving, inactive player detection, or summary report generation.

### Solution
Create comprehensive offboarding system.

### Implementation Plan

#### 11.1 Create Season End Service

**File:** `angular/src/app/core/services/season-end.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class SeasonEndService {
  /**
   * Archive season data
   */
  async archiveSeason(teamId: string, seasonEndDate: Date): Promise<void> {
    // Move all data to archive tables
    // Generate summary reports
    // Freeze analytics
    // Notify players and coaches
  }
  
  /**
   * Generate summary report
   */
  async generateSummaryReport(playerId: string, seasonId: string): Promise<SummaryReport> {
    // Aggregate season stats
    // Performance trends
    // Injury summary
    // Recommendations
  }
}
```

#### 11.2 Create Inactive Player Detection

**File:** `netlify/functions/inactive-player-detection.cjs`

**Purpose:** Daily cron job to detect inactive players

**Implementation:**
```javascript
async function detectInactivePlayers() {
  // Find players with no activity for 30+ days
  // Send notification
  // After 90 days, exclude from analytics
  // Archive data
}
```

#### 11.3 Create Account Pause Feature

**File:** `angular/src/app/features/settings/account-pause.component.ts`

**Purpose:** Allow users to pause account

**Features:**
- Pause duration selection
- ACWR frozen during pause
- Read-only access
- Resume anytime

### Testing
- [ ] Season end archives data correctly
- [ ] Summary reports generated
- [ ] Analytics frozen
- [ ] Inactive players detected
- [ ] Account pause works
- [ ] Data preserved during pause

### Priority: **LOW** (Lifecycle management)

---

## Implementation Priority Summary

### Immediate (Week 1)
1. ✅ Data Confidence Indicators
2. ✅ Missing Wellness Detection
3. ✅ Coach Override Transparency

### High Priority (Week 2-3)
4. ✅ Cross-Day Continuity (Game Day Recovery)
5. ✅ ACWR Spike Load Capping
6. ✅ Continuity Indicators

### Medium Priority (Month 2)
7. ✅ Ownership Transition Logging
8. ✅ Late Logging Detection
9. ✅ Conflict Detection
10. ✅ Multi-Role Collaboration Feed

### Low Priority (Month 3+)
11. ✅ Offboarding Flows
12. ✅ Offline-First Support (if needed)

---

## Success Metrics

After implementing fixes:
- **Data Confidence**: 100% of metrics show confidence indicators
- **Missing Data Detection**: 100% of coaches see incomplete data badges
- **Cross-Day Continuity**: 100% of game days trigger recovery protocols
- **Override Transparency**: 100% of coach overrides logged and visible
- **Ownership Tracking**: 100% of transitions logged with accountability

---

## Next Steps

1. **Review this proposal** with team
2. **Prioritize** based on user impact
3. **Create tickets** for each fix
4. **Implement** in priority order
5. **Test** each fix thoroughly
6. **Update audit** as fixes are completed

