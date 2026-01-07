# Decision Ledger Implementation — v1

**Contract Version:** 1.0  
**Date:** 2026-01-08  
**Status:** Normative (Binding)  
**Scope:** Decision accountability, review triggers, confidence scoring, UI design  
**Maintained By:** Product Architecture + Engineering

**Dependencies:**
- Staff Roles and Coordination Contract v1
- Coach Dashboard Authority Contract v1
- Data Consent & Visibility Contract v1

---

## SECTION 1 — Overview

### 1.1 Purpose

The Decision Ledger transforms the app from a monitoring system into an organizational brain. It captures:
- **What** decision was made
- **Who** made it (role, not ego)
- **Why** (data + constraints)
- **When** to review
- **What** happened

### 1.2 Core Principle

**High-performing teams don't argue less — they remember better.**

The Decision Ledger eliminates hindsight bias, prevents blame shifting, and builds institutional memory.

---

## SECTION 2 — Database Schema

### 2.1 Decision Ledger Table

```sql
CREATE TABLE decision_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Athlete context
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Decision details
    decision_type VARCHAR(50) NOT NULL CHECK (decision_type IN (
        'load_adjustment',
        'rtp_clearance',
        'rtp_progression',
        'nutrition_change',
        'hydration_adjustment',
        'mental_protocol',
        'tactical_modification',
        'recovery_intervention',
        'medical_constraint',
        'supplement_change',
        'training_program_assignment',
        'session_modification',
        'readiness_override',
        'acwr_override',
        'other'
    )),
    
    decision_summary TEXT NOT NULL, -- Human-readable summary
    decision_category VARCHAR(50) NOT NULL CHECK (decision_category IN (
        'medical',
        'load',
        'nutrition',
        'psychological',
        'tactical',
        'recovery'
    )),
    
    -- Decision maker
    made_by UUID NOT NULL REFERENCES auth.users(id),
    made_by_role VARCHAR(50) NOT NULL,
    made_by_name TEXT, -- Denormalized for audit trail
    
    -- Decision basis (structured data)
    decision_basis JSONB NOT NULL, -- {
        --   "data_points": ["ACWR: 1.45", "Readiness: 62", "Sleep debt: 3h"],
        --   "constraints": ["RTP Phase 2", "No sprinting >80%"],
        --   "rationale": "Elevated ACWR with sleep debt suggests recovery focus",
        --   "confidence": 0.85,
        --   "data_quality": {"completeness": 0.92, "stale_days": 0}
    -- }
    
    -- Review system
    intended_duration INTERVAL, -- How long this decision should last
    review_trigger VARCHAR(100) NOT NULL, -- See Section 3 for trigger types
    review_date TIMESTAMPTZ NOT NULL, -- Calculated from trigger
    review_priority VARCHAR(20) DEFAULT 'normal' CHECK (review_priority IN (
        'critical',
        'high',
        'normal',
        'low'
    )),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active',
        'reviewed',
        'superseded',
        'expired',
        'cancelled'
    )),
    
    -- Supersession chain
    superseded_by UUID REFERENCES decision_ledger(id),
    supersedes UUID[], -- Array of decision IDs this supersedes
    
    -- Review tracking
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    review_outcome VARCHAR(50), -- 'maintained', 'modified', 'reversed', 'extended'
    review_notes TEXT,
    
    -- Outcome tracking (filled after review or decision end)
    outcome_data JSONB, -- {
        --   "athlete_state_before": {...},
        --   "athlete_state_after": {...},
        --   "goal_achieved": true,
        --   "unintended_consequences": [],
        --   "lessons_learned": "..."
    -- }
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT review_date_future CHECK (review_date > created_at),
    CONSTRAINT decision_basis_not_empty CHECK (jsonb_typeof(decision_basis) = 'object')
);

-- Indexes
CREATE INDEX idx_decision_ledger_athlete ON decision_ledger(athlete_id, created_at DESC);
CREATE INDEX idx_decision_ledger_review ON decision_ledger(review_date, status) WHERE status = 'active';
CREATE INDEX idx_decision_ledger_made_by ON decision_ledger(made_by, created_at DESC);
CREATE INDEX idx_decision_ledger_team ON decision_ledger(team_id, created_at DESC);
CREATE INDEX idx_decision_ledger_type ON decision_ledger(decision_type, status);
CREATE INDEX idx_decision_ledger_category ON decision_ledger(decision_category, status);

-- RLS Policies
ALTER TABLE decision_ledger ENABLE ROW LEVEL SECURITY;

-- Staff can view decisions for athletes on their team
CREATE POLICY "Staff can view team decisions"
ON decision_ledger FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.team_id = decision_ledger.team_id
        AND tm.role IN (
            'owner', 'admin', 'head_coach', 'coach',
            'physiotherapist', 'nutritionist', 'psychologist',
            'strength_conditioning_coach'
        )
    )
);

-- Decision makers can create decisions
CREATE POLICY "Staff can create decisions"
ON decision_ledger FOR INSERT
TO authenticated
WITH CHECK (
    made_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.team_id = decision_ledger.team_id
    )
);

-- Decision makers can update their own decisions (before review)
CREATE POLICY "Decision makers can update own decisions"
ON decision_ledger FOR UPDATE
TO authenticated
USING (
    made_by = auth.uid()
    AND status = 'active'
    AND review_date > NOW()
);

-- Reviewers can update decisions during review
CREATE POLICY "Reviewers can update decisions"
ON decision_ledger FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.team_id = decision_ledger.team_id
        AND tm.role IN ('owner', 'admin', 'head_coach', 'coach')
    )
    AND review_date <= NOW()
);
```

### 2.2 Decision Review Reminders Table

```sql
CREATE TABLE decision_review_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES decision_ledger(id) ON DELETE CASCADE,
    
    -- Reminder scheduling
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN (
        'review_due',
        'review_overdue',
        'decision_expiring',
        'outcome_check'
    )),
    scheduled_for TIMESTAMPTZ NOT NULL,
    
    -- Notification
    notified_at TIMESTAMPTZ,
    notification_sent BOOLEAN DEFAULT FALSE,
    
    -- Recipients
    notify_user_ids UUID[], -- Specific users to notify
    notify_roles TEXT[], -- Roles to notify
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'sent',
        'acknowledged',
        'dismissed',
        'expired'
    )),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_review_reminders_due ON decision_review_reminders(scheduled_for, status) WHERE status = 'pending';
CREATE INDEX idx_review_reminders_decision ON decision_review_reminders(decision_id);
```

---

## SECTION 3 — Review Trigger System

### 3.1 Trigger Types

#### Time-Based Triggers

| Trigger | Format | Example | Use Case |
|---------|--------|---------|----------|
| `in_X_hours` | `in_24h`, `in_72h`, `in_168h` | `in_72h` | Short-term load adjustments |
| `in_X_days` | `in_3d`, `in_7d`, `in_14d` | `in_7d` | Medium-term interventions |
| `in_X_weeks` | `in_2w`, `in_4w` | `in_4w` | Long-term program changes |
| `after_X_sessions` | `after_3_sessions`, `after_5_sessions` | `after_3_sessions` | Session-based progression |
| `before_event` | `before_event:game_123`, `before_event:tournament_456` | `before_event:game_123` | Pre-competition decisions |

#### Event-Based Triggers

| Trigger | Format | Example | Use Case |
|---------|--------|---------|----------|
| `after_next_session` | `after_next_session` | `after_next_session` | Immediate post-session review |
| `after_next_game` | `after_next_game` | `after_next_game` | Post-competition assessment |
| `if_symptoms_worsen` | `if_symptoms_worsen` | `if_symptoms_worsen` | Medical monitoring |
| `if_acwr_exceeds` | `if_acwr_exceeds:1.5` | `if_acwr_exceeds:1.5` | Load threshold breach |
| `if_readiness_drops` | `if_readiness_drops:50` | `if_readiness_drops:50` | Readiness threshold breach |
| `if_compliance_fails` | `if_compliance_fails:3` | `if_compliance_fails:3` | Compliance monitoring |

#### Conditional Triggers

| Trigger | Format | Example | Use Case |
|---------|--------|---------|----------|
| `if_trend_continues` | `if_trend_continues:down:3d` | `if_trend_continues:down:3d` | Trend-based review |
| `if_no_improvement` | `if_no_improvement:7d` | `if_no_improvement:7d` | Intervention effectiveness |
| `if_goal_reached` | `if_goal_reached:rtp_phase_3` | `if_goal_reached:rtp_phase_3` | Milestone-based progression |

### 3.2 Review Date Calculation

```typescript
interface ReviewTrigger {
  type: string;
  value?: string | number;
  eventId?: string;
}

function calculateReviewDate(
  trigger: string,
  context: {
    createdAt: Date;
    athleteId: string;
    nextSessionDate?: Date;
    nextGameDate?: Date;
    currentMetrics?: Record<string, number>;
  }
): Date {
  const parts = trigger.split(':');
  const baseTrigger = parts[0];
  
  // Time-based triggers
  if (baseTrigger.startsWith('in_')) {
    const match = baseTrigger.match(/in_(\d+)([hdw])/);
    if (match) {
      const [, amount, unit] = match;
      const hours = unit === 'h' ? parseInt(amount) :
                   unit === 'd' ? parseInt(amount) * 24 :
                   parseInt(amount) * 24 * 7;
      return addHours(context.createdAt, hours);
    }
  }
  
  // Event-based triggers
  if (baseTrigger === 'after_next_session' && context.nextSessionDate) {
    return addHours(context.nextSessionDate, 2); // 2 hours after session
  }
  
  if (baseTrigger === 'after_next_game' && context.nextGameDate) {
    return addHours(context.nextGameDate, 24); // 24 hours after game
  }
  
  // Conditional triggers (require monitoring)
  if (baseTrigger.startsWith('if_')) {
    // These require active monitoring - set initial review to check trigger condition
    return addHours(context.createdAt, 24); // Check daily
  }
  
  // Default: 7 days
  return addDays(context.createdAt, 7);
}
```

### 3.3 Review Priority Calculation

```typescript
function calculateReviewPriority(
  decisionType: string,
  decisionCategory: string,
  reviewTrigger: string,
  confidence: number
): 'critical' | 'high' | 'normal' | 'low' {
  // Critical: Medical decisions, low confidence, short-term triggers
  if (
    decisionCategory === 'medical' ||
    confidence < 0.6 ||
    reviewTrigger.includes('in_24h') ||
    reviewTrigger.includes('if_symptoms')
  ) {
    return 'critical';
  }
  
  // High: Load adjustments, RTP progressions, short-term triggers
  if (
    decisionType.includes('load') ||
    decisionType.includes('rtp') ||
    reviewTrigger.includes('in_72h')
  ) {
    return 'high';
  }
  
  // Normal: Most decisions
  if (reviewTrigger.includes('in_7d') || reviewTrigger.includes('after_next')) {
    return 'normal';
  }
  
  // Low: Long-term program changes
  return 'low';
}
```

---

## SECTION 4 — Confidence Scoring Logic

### 4.1 Confidence Score Components

Confidence score (0.0 to 1.0) is calculated from:

1. **Data Completeness** (0.0 to 1.0)
   - How much required data is available
   - Formula: `available_data_points / required_data_points`

2. **Data Recency** (0.0 to 1.0)
   - How fresh the data is
   - Formula: `1 - (days_since_last_update / max_staleness_days)`
   - Max staleness: 7 days for wellness, 3 days for readiness

3. **Data Quality** (0.0 to 1.0)
   - Consistency, outliers, missing patterns
   - Based on statistical analysis

4. **Context Completeness** (0.0 to 1.0)
   - Are all relevant factors considered?
   - Medical constraints visible?
   - Recent changes accounted for?

### 4.2 Confidence Calculation

```typescript
interface ConfidenceMetadata {
  completeness: number; // 0.0 to 1.0
  recency: number; // 0.0 to 1.0
  quality: number; // 0.0 to 1.0
  context: number; // 0.0 to 1.0
  overall: number; // Weighted average
  missingInputs: string[];
  staleData: string[];
  lowQualityData: string[];
}

function calculateConfidence(
  decisionType: string,
  dataPoints: DataPoint[],
  constraints: Constraint[],
  context: DecisionContext
): ConfidenceMetadata {
  // Required data points by decision type
  const requiredData = getRequiredDataPoints(decisionType);
  
  // 1. Completeness
  const available = dataPoints.filter(dp => dp.value !== null).length;
  const completeness = available / requiredData.length;
  const missingInputs = requiredData.filter(
    req => !dataPoints.some(dp => dp.type === req && dp.value !== null)
  );
  
  // 2. Recency
  const now = new Date();
  const maxAge = getMaxDataAge(decisionType); // days
  const recentData = dataPoints.filter(dp => {
    const ageDays = differenceInDays(now, dp.timestamp);
    return ageDays <= maxAge;
  });
  const recency = recentData.length / dataPoints.length;
  const staleData = dataPoints
    .filter(dp => differenceInDays(now, dp.timestamp) > maxAge)
    .map(dp => dp.type);
  
  // 3. Quality (check for outliers, consistency)
  const quality = calculateDataQuality(dataPoints);
  const lowQualityData = dataPoints
    .filter(dp => dp.qualityScore < 0.7)
    .map(dp => dp.type);
  
  // 4. Context completeness
  const contextScore = evaluateContextCompleteness(
    decisionType,
    constraints,
    context
  );
  
  // Weighted average
  const weights = {
    completeness: 0.35,
    recency: 0.25,
    quality: 0.20,
    context: 0.20
  };
  
  const overall = (
    completeness * weights.completeness +
    recency * weights.recency +
    quality * weights.quality +
    contextScore * weights.context
  );
  
  return {
    completeness,
    recency,
    quality,
    context: contextScore,
    overall,
    missingInputs,
    staleData,
    lowQualityData
  };
}

function getRequiredDataPoints(decisionType: string): string[] {
  const requirements: Record<string, string[]> = {
    load_adjustment: ['acwr', 'readiness', 'session_rpe', 'sleep'],
    rtp_clearance: ['pain_score', 'mobility', 'strength', 'load_tolerance'],
    nutrition_change: ['training_load', 'hydration', 'energy_availability'],
    mental_protocol: ['stress', 'confidence', 'sleep', 'readiness'],
    // ... more mappings
  };
  return requirements[decisionType] || [];
}

function calculateDataQuality(dataPoints: DataPoint[]): number {
  // Check for outliers
  const outliers = detectOutliers(dataPoints);
  
  // Check consistency
  const consistency = checkConsistency(dataPoints);
  
  // Check missing patterns (systematic vs random)
  const missingPattern = analyzeMissingPattern(dataPoints);
  
  // Combine into quality score
  return (1 - outliers.ratio) * 0.4 + consistency * 0.4 + missingPattern * 0.2;
}
```

### 4.3 Confidence Display Rules

| Confidence Level | Display | Action Required |
|-----------------|---------|----------------|
| 0.9 - 1.0 | High confidence | None |
| 0.7 - 0.89 | Moderate confidence | Review data sources |
| 0.5 - 0.69 | Low confidence | Collect more data before decision |
| < 0.5 | Very low confidence | **Warn: Decision based on incomplete data** |

---

## SECTION 5 — UI Design

### 5.1 Decision Ledger Dashboard

**Location:** `/staff/decisions` (for all staff)  
**Location:** `/coach/dashboard/decisions` (coach-specific view)

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Decision Ledger                              [Filters]   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Active: 12   │  │ Due Review: 3 │  │ Low Conf: 2   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Due for Review (3)                    [View All]    │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ 🔴 Player: John Smith                                │ │
│  │    Decision: Reduced sprint volume                   │ │
│  │    Made by: S&C Coach (Sarah) - 3 days ago         │ │
│  │    Review due: Today                                │ │
│  │    [Review Now] [Snooze 24h]                        │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ 🟡 Player: Mike Johnson                             │ │
│  │    Decision: Cleared for modified training          │ │
│  │    Made by: Physio (Dr. Lee) - 5 days ago          │ │
│  │    Review due: Tomorrow                             │ │
│  │    [Review Now] [Snooze]                            │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Recent Decisions                        [View All]   │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ [Decision cards - see 5.2]                          │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Decision Card Component

**Component:** `<app-decision-card>`

```typescript
interface DecisionCardData {
  id: string;
  athleteName: string;
  athleteId: string;
  decisionType: string;
  decisionSummary: string;
  madeBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: Date;
  reviewDate: Date;
  status: 'active' | 'reviewed' | 'superseded' | 'expired';
  confidence: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  category: string;
}
```

**Template:**
```html
<app-card-shell
  [title]="decision.athleteName"
  headerIcon="pi-file-edit"
  [class.decision-card--critical]="decision.priority === 'critical'"
  [class.decision-card--low-confidence]="decision.confidence < 0.7"
>
  <ng-container header-actions>
    <p-badge
      [value]="decision.priority"
      [severity]="getPrioritySeverity(decision.priority)"
    ></p-badge>
  </ng-container>

  <div class="decision-card__content">
    <!-- Decision Summary -->
    <div class="decision-card__summary">
      <h4>{{ getDecisionTypeLabel(decision.decisionType) }}</h4>
      <p>{{ decision.decisionSummary }}</p>
    </div>

    <!-- Decision Maker -->
    <div class="decision-card__maker">
      <i class="pi pi-user"></i>
      <span>
        {{ decision.madeBy.name }}
        <span class="role-badge">{{ decision.madeBy.role }}</span>
      </span>
      <span class="time-ago">{{ formatTimeAgo(decision.createdAt) }}</span>
    </div>

    <!-- Confidence Indicator -->
    <div class="decision-card__confidence">
      <span>Confidence:</span>
      <app-confidence-indicator [score]="decision.confidence"></app-confidence-indicator>
      @if (decision.confidence < 0.7) {
        <p-tag severity="warning" value="Low Confidence"></p-tag>
      }
    </div>

    <!-- Review Date -->
    <div class="decision-card__review">
      <i class="pi pi-calendar"></i>
      <span>
        Review due: {{ formatReviewDate(decision.reviewDate) }}
        @if (isOverdue(decision.reviewDate)) {
          <p-tag severity="danger" value="Overdue"></p-tag>
        }
      </span>
    </div>

    <!-- Actions -->
    <div class="decision-card__actions">
      <p-button
        label="View Details"
        icon="pi pi-eye"
        [outlined]="true"
        (onClick)="viewDetails()"
      ></p-button>
      @if (canReview()) {
        <p-button
          label="Review Now"
          icon="pi pi-check"
          (onClick)="startReview()"
        ></p-button>
      }
    </div>
  </div>
</app-card-shell>
```

### 5.3 Decision Detail View

**Route:** `/staff/decisions/:decisionId`

**Sections:**

1. **Decision Overview**
   - Summary
   - Decision maker
   - Timestamps
   - Status

2. **Decision Basis** (Expandable)
   - Data points used
   - Constraints considered
   - Rationale
   - Confidence breakdown

3. **Review Information**
   - Review trigger
   - Review date
   - Review priority
   - Review history

4. **Outcome Tracking** (If reviewed)
   - Before/after comparison
   - Goal achievement
   - Unintended consequences
   - Lessons learned

5. **Related Decisions**
   - Superseded decisions
   - Superseding decisions
   - Related decisions

### 5.4 Create Decision Dialog

**Component:** `<app-create-decision-dialog>`

**Steps:**

1. **Select Athlete**
   - Search/select from roster
   - Show current athlete state

2. **Select Decision Type**
   - Dropdown with categories
   - Show required data points

3. **Enter Decision Summary**
   - Text area
   - Character limit: 500

4. **Select Data Points**
   - Checkboxes for available data
   - Show confidence for each
   - Warn if required data missing

5. **Set Constraints**
   - Show active constraints
   - Add new constraints if needed

6. **Set Review Trigger**
   - Dropdown with trigger types
   - Show calculated review date
   - Adjust if needed

7. **Review & Confirm**
   - Show decision preview
   - Show confidence score
   - Confirm creation

### 5.5 Review Decision Dialog

**Component:** `<app-review-decision-dialog>`

**Sections:**

1. **Decision Context**
   - Original decision
   - Current athlete state
   - Changes since decision

2. **Review Options**
   - Maintain decision
   - Modify decision
   - Reverse decision
   - Extend decision

3. **Outcome Tracking**
   - Goal achievement
   - Unintended consequences
   - Lessons learned

4. **Next Steps**
   - New review date (if extending)
   - Related actions

---

## SECTION 6 — Failure Scenario Simulations

### 6.1 Scenario: Decision Made Without Review

**Failure:** Decision created but never reviewed when due.

**Simulation:**
```typescript
// Day 0: Decision created
const decision = {
  reviewDate: addDays(now, 3),
  status: 'active'
};

// Day 3: Review date arrives
// System checks: No review action taken
// Day 4: Still no review
// Day 5: Still no review

// System Response:
// 1. Escalate to head coach
// 2. Mark decision as "review_overdue"
// 3. Send notifications
// 4. Flag in dashboard
```

**Prevention:**
- Automated reminders (24h before, on due date, 24h after)
- Escalation chain
- Dashboard alerts
- Email notifications

### 6.2 Scenario: Low Confidence Decision

**Failure:** Decision made with incomplete data.

**Simulation:**
```typescript
const decision = {
  confidence: 0.45, // Very low
  decisionBasis: {
    dataPoints: ['acwr'], // Only one data point
    missingInputs: ['readiness', 'sleep', 'wellness']
  }
};

// System Response:
// 1. Warn decision maker before creation
// 2. Require acknowledgment of low confidence
// 3. Set shorter review period
// 4. Flag in dashboard
// 5. Alert other staff
```

**Prevention:**
- Confidence threshold warnings
- Required data validation
- Shorter review periods for low confidence
- Multi-staff review for critical low-confidence decisions

### 6.3 Scenario: Conflicting Decisions

**Failure:** Two staff members make conflicting decisions.

**Simulation:**
```typescript
// Day 0: S&C reduces load
const decision1 = {
  type: 'load_adjustment',
  summary: 'Reduce sprint volume by 50%',
  category: 'load'
};

// Day 1: Coach increases intensity
const decision2 = {
  type: 'tactical_modification',
  summary: 'Increase sprint intensity for game prep',
  category: 'tactical'
};

// Conflict detected:
// - Decision 1 reduces load
// - Decision 2 increases intensity
// - Both affect same athlete
// - Both active simultaneously

// System Response:
// 1. Detect conflict on creation
// 2. Alert both decision makers
// 3. Require resolution
// 4. Escalate to head coach if unresolved
```

**Prevention:**
- Conflict detection on creation
- Real-time conflict alerts
- Resolution workflow
- Escalation to head coach

### 6.4 Scenario: Decision Supersession Chain

**Failure:** Decision chain becomes unclear.

**Simulation:**
```typescript
// Decision A (Day 0)
const decisionA = {
  id: 'a',
  status: 'superseded',
  supersededBy: 'b'
};

// Decision B (Day 2)
const decisionB = {
  id: 'b',
  status: 'superseded',
  supersededBy: 'c'
};

// Decision C (Day 4)
const decisionC = {
  id: 'c',
  status: 'active'
};

// Problem: Hard to trace back to original decision
// Problem: Multiple active decisions for same type
```

**Prevention:**
- Visual decision chain
- One active decision per type per athlete
- Clear supersession tracking
- Decision history view

### 6.5 Scenario: Review Trigger Failure

**Failure:** Conditional trigger never fires.

**Simulation:**
```typescript
const decision = {
  reviewTrigger: 'if_acwr_exceeds:1.5',
  reviewDate: addDays(now, 7), // Fallback date
  status: 'active'
};

// Problem: ACWR never exceeds 1.5
// Problem: Review date passes without trigger
// Problem: Decision remains active indefinitely
```

**Prevention:**
- Fallback review dates for conditional triggers
- Active monitoring of conditional triggers
- Automatic review if condition not met by fallback date
- Clear trigger status display

---

## SECTION 7 — Product Differentiation Narrative

### 7.1 The Problem Other Apps Don't Solve

**Other sports performance apps track data. They don't track decisions.**

When an athlete gets injured, teams ask:
- "Why did we push them?"
- "Who made that call?"
- "What data supported it?"
- "Why didn't we review it?"

**Most apps can't answer these questions.**

They show:
- ✅ Load metrics
- ✅ Readiness scores
- ✅ Compliance data

They don't show:
- ❌ Who decided to push through fatigue
- ❌ Why that decision was made
- ❌ When it should have been reviewed
- ❌ What happened as a result

### 7.2 The Decision Ledger Difference

**We don't just track what happened. We track why it happened.**

#### For Coaches

**Before Decision Ledger:**
- "I think we should reduce his load."
- "Why?"
- "He looks tired."
- "When did you decide that?"
- "I don't remember."

**With Decision Ledger:**
- "I'm reducing his load."
- System logs: Decision maker, data points, rationale, review date
- "Why?"
- System shows: ACWR 1.45, Readiness 62, Sleep debt 3h
- "When should we review?"
- System shows: Review due in 72h, or if readiness drops below 50

#### For Organizations

**Before Decision Ledger:**
- Blame shifting after injuries
- "I didn't know about that decision"
- "That wasn't my call"
- No institutional memory

**With Decision Ledger:**
- Clear accountability
- "Here's who made what decision and why"
- "Here's when it should have been reviewed"
- "Here's what we learned"

### 7.3 The Confidence Score Advantage

**Other apps show numbers. We show how reliable those numbers are.**

**Example:**

**Other App:**
```
ACWR: 1.18
```

**Our App:**
```
ACWR: 1.18 (Low confidence — only 12 of 28 days logged)
Missing: Sleep data (3 days), Wellness data (2 days)
```

**Why This Matters:**

A coach sees ACWR 1.18 and thinks: "He's fine."

But if only 12 of 28 days are logged, that ACWR is unreliable. The Decision Ledger shows this, preventing dangerous overconfidence.

### 7.4 The Review System Advantage

**Other apps don't remind you to review decisions.**

**Our App:**
- Automated review reminders
- Escalation if reviews are missed
- Outcome tracking after reviews
- Lessons learned capture

**Result:**
- Decisions don't get forgotten
- Reviews happen on time
- Teams learn from outcomes
- Institutional memory builds

### 7.5 The Coordination Advantage

**Other apps show data. We show how decisions coordinate.**

**Example:**

**Other App:**
- Shows athlete data
- Shows multiple staff can see it
- Doesn't show who owns what decisions

**Our App:**
- Shows domain ownership (Medical → Physical → Tactical)
- Shows decision coordination
- Prevents conflicts
- Enforces authority hierarchy

### 7.6 The Marketing Message

**"The only sports performance app that remembers why you made decisions — and reminds you when to review them."**

**Key Points:**
1. **Accountability:** Every decision is logged with who, what, why, when
2. **Confidence:** Know how reliable your data is before making decisions
3. **Review:** Never forget to review a decision — automated reminders and escalation
4. **Learning:** Track outcomes and build institutional memory
5. **Coordination:** See how decisions work together across staff roles

### 7.7 Competitive Positioning

| Feature | Other Apps | Our App |
|---------|-----------|---------|
| Track load metrics | ✅ | ✅ |
| Track readiness | ✅ | ✅ |
| Track compliance | ✅ | ✅ |
| **Track decisions** | ❌ | ✅ |
| **Show data confidence** | ❌ | ✅ |
| **Review reminders** | ❌ | ✅ |
| **Decision accountability** | ❌ | ✅ |
| **Outcome tracking** | ❌ | ✅ |
| **Institutional memory** | ❌ | ✅ |

**Differentiation:** We're the only app that transforms data into organizational intelligence.

---

## SECTION 8 — Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create database schema
- [ ] Implement RLS policies
- [ ] Create API endpoints
- [ ] Build confidence scoring logic
- [ ] Implement review trigger system

### Phase 2: UI Components
- [ ] Decision Ledger dashboard
- [ ] Decision card component
- [ ] Decision detail view
- [ ] Create decision dialog
- [ ] Review decision dialog
- [ ] Confidence indicator component

### Phase 3: Automation
- [ ] Review reminder system
- [ ] Escalation workflow
- [ ] Conflict detection
- [ ] Outcome tracking

### Phase 4: Integration
- [ ] Integrate with coach dashboard
- [ ] Integrate with athlete profile
- [ ] Integrate with staff dashboards
- [ ] Notification system

### Phase 5: Testing
- [ ] Unit tests for confidence scoring
- [ ] Unit tests for review triggers
- [ ] Integration tests for workflows
- [ ] Failure scenario tests
- [ ] User acceptance testing

---

**End of Contract**

