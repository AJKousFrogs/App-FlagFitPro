# Staff Roles and Coordination Contract — v1

**Contract Version:** 1.0  
**Date:** 2026-01-08  
**Status:** Normative (Binding)  
**Scope:** All staff roles, responsibilities, boundaries, and coordination mechanisms  
**Maintained By:** Product Architecture + Engineering  
**Supersedes:** None

**Dependencies (MUST Be Compatible With):**
- Coach Dashboard Authority Contract v1
- Data Consent & Visibility Contract v1
- Authorization & Guardrails Contract v1
- Session Lifecycle Authority Contract v1

---

## SECTION 1 — Scope + Definitions

### 1.1 Scope

This contract defines:
- What each staff role does (responsibilities)
- What each staff role does NOT do (boundaries)
- How staff roles coordinate (decision pathways)
- How conflicts are resolved (authority hierarchy)
- What data each role sees (visibility)
- What actions each role can take (permissions)
- Missing organizational features (Decision Ledger, Unknowns tracking, etc.)

This contract governs:
- All staff-facing interfaces
- All staff-to-staff interactions
- All staff-to-athlete interactions
- All decision accountability mechanisms

### 1.2 Core Principle

**No one owns the athlete alone. Everyone owns a domain. The app coordinates the domains.**

The app is not a collaboration tool. It is a coordination system.

---

## SECTION 2 — Role Definitions

### 2.1 Head Coach

#### Responsibilities (What They Do)

1. **See the team before problems appear**
   - See team readiness at a glance
   - Identify at-risk athletes (load, fatigue, injuries)
   - Understand who needs intervention today, not after an injury
   - View ACWR overview per player
   - See readiness trends, not just today's score
   - See clear flags: safe / caution / danger
   - No raw data overload — only what supports decisions

2. **Plan training without guessing**
   - Assign or adjust training programs
   - Control weekly and seasonal load
   - See how today's session affects next week's risk
   - Modify intensity based on real data, not intuition alone
   - See expected load impact when scheduling heavy sessions
   - See ACWR projection
   - See who crosses a risk threshold

3. **Monitor compliance without policing**
   - See who completed sessions
   - Identify missed or partially completed work
   - Understand patterns (consistently late, consistently skipping recovery)
   - Answer: "Is the plan being followed?"
   - Answer: "Where is discipline breaking down?"

4. **Intervene early, not emotionally**
   - Open a player profile
   - See why a warning exists (not just that it exists)
   - Decide between: reduced load, recovery focus, full rest, medical follow-up
   - See context, not orders
   - See AI recommendations (visible, explainable, always overridable)

5. **Communicate with clarity**
   - Send targeted messages (individual or group)
   - Share schedule changes
   - Flag important instructions tied to sessions or games
   - Ensure athletes see: what to do, when to do it, why it matters

6. **Prepare for competition, not chaos**
   - See game-day readiness submissions
   - See low-readiness alerts
   - Support lineup or rotation decisions
   - Track cumulative fatigue across multi-game days
   - Answer: "Who can give me their best today — and for how long?"

7. **Stay within trust and consent**
   - Never see more than a player has shared
   - See consent-based data visibility
   - See clear indicators when data is hidden
   - No backdoors, no assumptions

#### Boundaries (What They Do NOT Do)

- Override physiotherapy medical decisions
- Override nutritionist fuel strategies
- Override psychologist mental protocols
- Override S&C load architecture
- Modify medical constraints
- Act as administrators for non-coaching tasks

#### Authority Domain

**Tactical execution** — Final authority on how the game is played, player selection, tactical training content.

#### Data Visibility

- Compliance data (by default)
- Content data (with athlete opt-in)
- Safety flags (always visible)
- Medical status (summary only, not detail)
- Load metrics (summary during baseline, numerical after baseline)

---

### 2.2 Assistant Coaches (Offensive/Defensive Coordinators)

#### Responsibilities (What They Do)

1. **Translate game model into daily execution**
   - Define offensive or defensive principles
   - Link weekly objectives to formations, routes, coverage concepts, situational packages
   - Align practice focus with upcoming opponents
   - Answer: "What must be automatic by game day?"

2. **Design position-specific practice emphasis**
   - Tag drills and sessions with tactical purpose
   - Tag drills with position relevance
   - Adjust reps and complexity based on player role, experience, current readiness
   - Ensure practice is intentional, not generic

3. **Own film and playbook context**
   - Upload and annotate film
   - Tag clips to plays, concepts, errors, success patterns
   - Link video to playbook entries and practice corrections
   - Shorten the loop: mistake → explanation → correction

4. **Monitor cognitive load and clarity**
   - See indicators of confusion, mental overload, repeated assignment errors
   - Reduce decision branches, install complexity, verbal noise
   - Support simplification decisions, not ego-driven complexity

5. **Adjust tactics to availability, not fantasy lineups**
   - See injury restrictions, readiness limitations, fatigue trends
   - Adjust packages, tempo, player usage
   - Avoid: "The plan required players we didn't have."

6. **Support in-game and tournament decisions**
   - Track snap load or rep accumulation
   - Support rotation decisions
   - Flag players approaching execution drop-off
   - Use app as situational awareness tool, not distraction

7. **Communicate precisely with players and staff**
   - Push position-specific notes
   - Clarify responsibilities
   - Share quick corrections tied to film or practice
   - Prevent mixed messages, conflicting instructions, information overload

#### Boundaries (What They Do NOT Do)

- Override head coach strategy
- Modify medical or load constraints
- Redesign conditioning or rehab
- Act as data scientists
- Override physiotherapy or S&C decisions

#### Authority Domain

**Tactical execution** (under head coach authority) — Position-specific training, playbook management, film analysis.

#### Data Visibility

- Same as head coach for tactical data
- Position-specific execution data
- Cognitive readiness indicators (from psychologist)
- Availability constraints (from physio, S&C)

---

### 2.3 Physiotherapist

#### Responsibilities (What They Do)

1. **Own injury status — not training decisions**
   - Create and update injury records
   - Classify injuries (acute, overload, post-surgical, recurrent)
   - Set participation status: Full, Modified, Restricted, No training
   - Define medical constraints (what is not allowed)
   - Authority is medical readiness, not performance programming

2. **Define and manage return-to-play (RTP) protocols**
   - Assign structured RTP protocol
   - Progress athletes through phases: pain-free movement, load tolerance, sport-specific stress, full exposure
   - Gate progression with objective checks (not dates alone)
   - Answer: "Is the athlete ready for the next type of stress?"
   - Prevent premature clearance, skipped stages, "coach pressure" shortcuts

3. **Monitor rehab load separately from training load**
   - Log rehab sessions
   - Tag them as: mobility, isometric, eccentric, reconditioning
   - See how rehab load contributes to total stress
   - Avoid: "They weren't training, but still overloaded."
   - Show: rehab load vs training load, sudden spikes during rehab phases, risk when rehab + training overlap

4. **Track symptoms, not just outcomes**
   - Track pain trends (location, intensity, behavior)
   - Monitor swelling, stiffness, instability
   - Add clinical notes with timestamps
   - Flag concerning patterns early
   - Support trend visibility over time
   - Correlate with load increases
   - Show warnings when symptoms rise despite "good" readiness scores

5. **Set medical guardrails the system enforces**
   - Define hard boundaries: no sprinting above X intensity, no cutting drills, max session duration, mandatory rest days
   - Once set: coaches can see them, training plans must respect them, violations are flagged automatically
   - Remove: verbal misunderstandings, "I didn't know" excuses, silent rule breaking

6. **Communicate clinically, not constantly**
   - Leave structured notes for coaches
   - Add clearance comments
   - Flag athletes requiring discussion
   - Surface only relevant medical updates
   - Tie messages to injury or RTP status
   - Avoid chat-style overuse

7. **Support long-term injury prevention**
   - See recurring injury patterns
   - Identify risky load behaviors
   - Highlight systemic issues (too many soft-tissue injuries, poor recovery phases)
   - Provide actionable insight, not reports for the sake of reports

#### Boundaries (What They Do NOT Do)

- Modify team tactics
- Decide player selection
- Override consent boundaries
- Act as coaches or managers
- Schedule team training
- Override coaches on tactics or volume planning

#### Authority Domain

**Medical readiness & RTP** — Final authority on injury status, return-to-play protocols, medical constraints.

#### Data Visibility

- Full access to pain, injury, rehab data (role authority)
- Can override athlete consent for medical necessity (with audit trail)
- Bound by medical confidentiality
- See training load (to coordinate with rehab load)
- See compliance with rehab protocols

---

### 2.4 Strength & Conditioning Coach

#### Responsibilities (What They Do)

1. **Own physical load design**
   - Build strength, speed, power, and conditioning blocks
   - Define volume, intensity, density, recovery demands
   - Periodize training across microcycles (week), mesocycles (phase), season blocks
   - Answer: "What physical qualities are we developing now, and what are we protecting?"

2. **Control weekly and rolling load**
   - Monitor session RPE, volume trends, ACWR contribution
   - See how each session accumulates fatigue, builds capacity, interacts with sport practice
   - Make visible: acute vs chronic load, load spikes, overlapping stress from rehab or competitions
   - Intervene before the red zone appears

3. **Translate readiness into session adjustments**
   - Adjust intensity, volume, exercise selection based on wellness, sleep, fatigue markers, competition proximity
   - Support modification, not cancellation, whenever possible
   - Adapt training to the athlete — not force the athlete through training

4. **Design progression, not random workouts**
   - Track strength, speed, and power benchmarks
   - Ensure progression is gradual, respects injury history, resets after breaks or illness
   - Detect stagnation or regression early
   - Prevent: endless variation, plateau blindness, "hard for the sake of hard" programming

5. **Coordinate with physiotherapy constraints**
   - See physiotherapy restrictions clearly
   - Program around load caps, movement restrictions, RTP phases
   - Support rehab with controlled reloading, capacity rebuilding
   - Enforce: no violations of physio constraints, visibility of conflicts, clear accountability

6. **Support competition demands**
   - Adjust training near competitions
   - Manage tapering, priming, between-game conditioning
   - Reduce residual fatigue without losing sharpness
   - Answer: "Are we preparing them to perform — or just to train?"

7. **Monitor execution quality, not just completion**
   - See who completes sessions
   - Flag poor execution patterns
   - Identify athletes who consistently underperform prescribed intent
   - Identify athletes who accumulate fatigue without adaptation
   - Focus on training quality, not checkmarks

8. **Communicate precisely, not constantly**
   - Leave session notes
   - Adjust prescriptions
   - Flag fatigue concerns to coaches
   - Avoid: duplicate instructions, conflicting messages, information overload

#### Boundaries (What They Do NOT Do)

- Override physiotherapy medical decisions
- Decide tactical training content
- Act as head coaches
- Ignore consent and privacy boundaries

#### Authority Domain

**Physical load & capacity** — Final authority on strength, conditioning, and load architecture.

#### Data Visibility

- Load metrics (session RPE, volume, ACWR)
- Compliance data (completion, execution quality)
- Readiness indicators (to adjust load)
- Medical constraints (from physio)
- Rehab load (to coordinate with training load)

---

### 2.5 Nutritionist

#### Responsibilities (What They Do)

1. **Translate training and competition into fuel strategy**
   - See training load, intensity, and schedule
   - See competition formats (single game vs tournament day)
   - Adjust nutrition strategies based on high-load days, back-to-back sessions, travel and climate stress
   - Answer: "Given what this athlete will do, how should they eat and drink?"

2. **Own hydration strategy and execution**
   - Define daily hydration targets
   - Adjust targets for temperature, humidity, session density, tournament days
   - Monitor actual intake vs target
   - Flag dehydration trends before performance drops
   - Show: individual hydration compliance, risk alerts when intake lags behind demand, tournament-day hydration windows clearly

3. **Design competition-day fueling windows**
   - Build structured fueling windows: morning, pre-game, halftime, post-game, between games
   - Adjust recommendations based on game spacing, referee duties, weather, recovery status
   - Prevent: "They ate well — just at the wrong time."

4. **Monitor energy availability, not just weight**
   - Track signs of low energy availability: persistent fatigue, poor recovery, declining readiness
   - Cross-reference nutrition with training load, sleep, injury recurrence
   - Identify: under-fueling patterns, missed meals on heavy days, chronic deficits masked by "good discipline"

5. **Manage supplements conservatively and clearly**
   - Define approved supplements
   - Set timing and dosage ranges
   - Flag unnecessary or redundant products
   - Align supplements with training phases, competition demands, travel stress
   - No hype. No guessing. No excess.

6. **Communicate with clarity, not volume**
   - Send targeted nutrition instructions
   - Share tournament-day checklists
   - Add notes tied to specific sessions or games
   - Ensure: messages are contextual, instructions are timely, athletes are not overloaded with generic advice

7. **Support recovery between sessions and games**
   - Adjust post-session recovery fueling
   - Support glycogen restoration
   - Reduce cramping risk during congested schedules
   - Adapt plans when readiness or hydration drops
   - Goal: Train tomorrow without paying for today.

#### Boundaries (What They Do NOT Do)

- Prescribe medical treatments
- Override physiotherapy restrictions
- Plan training content
- Act as coaches

#### Authority Domain

**Fuel & recovery timing** — Final authority on nutrition strategy, hydration targets, supplement protocols.

#### Data Visibility

- Training load and schedule (to plan fueling)
- Hydration compliance
- Energy availability indicators
- Readiness trends (to correlate with nutrition)
- Competition schedules (to plan fueling windows)

---

### 2.6 Psychologist

#### Responsibilities (What They Do)

1. **Monitor mental readiness without turning it into therapy**
   - See mental readiness signals (focus, stress, confidence, motivation)
   - Track trends over time, not isolated scores
   - Identify destabilizing patterns: cognitive fatigue, pressure sensitivity, confidence volatility, emotional carryover from previous games
   - Answer: "Is the mind ready for today's demands?"
   - No diagnoses. No deep personal narratives. Only performance-relevant indicators.

2. **Own pre-competition mental protocols**
   - Define pre-game mental routines
   - Assign protocols based on role (starter, rotation, specialist), experience level, recent performance volatility
   - Adjust routines when stress indicators rise
   - Examples: focus resets, breathing sequences, visualization cues, attention anchors
   - Ensure routines are timed, repeatable, consistent across competition days

3. **Detect overload before it becomes collapse**
   - Correlate mental signals with training load, sleep disruption, injury periods, travel fatigue
   - Flag athletes who look "physically fine" but mentally brittle
   - Prevent: "They were cleared physically — and broke down mentally."
   - Support early detection through trend deviation, not crisis response

4. **Support confidence and role clarity**
   - Track confidence stability
   - Identify players with role uncertainty, performance anxiety, decision hesitation
   - Support clarity through structured interventions
   - Not reassurance — structure.
   - Keep confidence management grounded in behavior and preparation, not emotion alone

5. **Manage pressure during tournaments and high-stakes periods**
   - Monitor stress accumulation across multi-game days
   - Adjust mental routines between games
   - Support cognitive recovery, not just physical recovery
   - Goal: Decision quality in the last game should match the first.
   - Manage mental fatigue curves, not just mood

6. **Communicate selectively and with authority**
   - Flag athletes needing reduced cognitive load
   - Recommend simplified instructions
   - Suggest reduced decision burden when stress peaks
   - Communication is: targeted, contextual, tied to readiness or competition phases
   - Do not compete with coaches or staff for attention

7. **Protect psychological safety and consent**
   - Only see data athletes have consented to share
   - Sensitive inputs remain protected
   - Coaches see status and guidance, not inner narratives
   - Trust is not optional — it is the foundation

#### Boundaries (What They Do NOT Do)

- Provide clinical therapy
- Diagnose mental illness
- Override medical or coaching authority
- Act as emotional support for non-performance issues

#### Authority Domain

**Mental readiness & pressure control** — Final authority on mental protocols, cognitive load management, pre-competition routines.

#### Data Visibility

- Mental readiness signals (with athlete consent)
- Confidence trends
- Stress indicators
- Cognitive load patterns
- Performance-relevant psychological data only

---

## SECTION 3 — Coordination Model

### 3.1 The Golden Rule

**No one owns the athlete alone. Everyone owns a domain. The app coordinates the domains.**

The app is not a collaboration tool. It is a coordination system.

### 3.2 Domain Ownership (Non-Negotiable)

| Domain | Owner | Final Authority |
|--------|-------|----------------|
| Tactical execution | Head Coach / Coordinators | Head Coach |
| Physical load & capacity | Strength & Conditioning | S&C |
| Medical readiness & RTP | Physiotherapist | Physio |
| Fuel & recovery timing | Nutritionist | Nutrition |
| Mental readiness & pressure control | Psychologist | Psychology |

**Enforcement:**
- Clear permissions
- Clear visibility
- No silent overrides

### 3.3 Daily Coordination Flow

#### Step 1: Athlete State is Unified

The app creates one athlete state, not five opinions. It combines:
- Load (S&C)
- Medical status (Physio)
- Fuel & hydration (Nutrition)
- Mental readiness (Psych)
- Tactical availability (Coaches)

**No one edits this manually. Everyone responds to it.**

#### Step 2: Constraints Flow Upward, Not Sideways

**Medical → Physical → Tactical**

- Physio sets hard constraints
- S&C designs training inside constraints
- Coaches design execution inside availability

**The app blocks reverse pressure.**

This prevents:
- "Just push him through"
- "It's only a small tweak"
- "He'll be fine"

#### Step 3: Adjustments Are Visible, Not Emotional

Any adjustment is logged as:
- Who changed what
- Why
- For how long

This removes:
- Ego battles
- Memory disputes
- Quiet blame

### 3.4 Critical 1:1 Relationships

#### A. Head Coach ↔ Physiotherapist

**Trust over optimism**

**What flows:**
- Clearance status
- Risk flags
- RTP phase boundaries

**What does NOT flow:**
- Clinical detail
- Pain narratives

**Rule enforced by app:**
Head coach sees status and limits, not medical debate.

#### B. Strength & Conditioning ↔ Physiotherapist

**Precision over speed**

**What flows:**
- Load ceilings
- Movement restrictions
- Rehab-to-performance transition

**What the app enforces:**
- No training prescription that violates RTP phase
- Rehab load counted in total load

**This stops the most common failure:**
"Rehab + training quietly doubled the stress."

#### C. Coordinators ↔ Psychologist

**Clarity over complexity**

**What flows:**
- Cognitive readiness
- Decision load risk
- Recommendation to simplify or stabilize

**What does NOT flow:**
- Emotional detail
- Private disclosures

**Rule:**
Psychologist flags capacity, coordinators adjust complexity.

### 3.5 Conflict Prevention Mechanisms

#### 1. No Direct Overrides

Coaches cannot override medical.  
S&C cannot override psychology.  
Nutrition cannot override load.

**Overrides require:**
- Explicit escalation
- Logged decision
- Head coach sign-off

#### 2. One Message, One Authority

An athlete never receives:
- Conflicting instructions
- Parallel advice

**The app:**
- Merges inputs
- Pushes one instruction per domain
- Shows who owns it

#### 3. Shared Language, Not Shared Opinions

Everything is expressed as:
- Status
- Threshold
- Recommendation
- Constraint

**Not feelings. Not debates.**

### 3.6 Game Week & Tournament Mode

During competition phases:
- Physio locks RTP and availability
- S&C manages fatigue preservation
- Nutrition controls timing and hydration
- Psychologist stabilizes decision-making
- Coordinators adapt tactics to reality
- Head coach integrates all five

**The app becomes:**
A quiet co-pilot, not another voice.

### 3.7 What the Athlete Experiences

The athlete should feel:
- Aligned staff
- Clear expectations
- No mixed messages
- No staff tension

**If athletes sense disagreement, the system failed.**

---

## SECTION 4 — Missing Organizational Features

### 4.1 Decision Ledger (Critical Missing Feature)

#### What's Missing

You track data, states, and adjustments — but you don't capture decisions.

#### What to Add

A lightweight Decision Ledger that logs:
- What decision was made
- By whom (role, not ego)
- On what basis (data + constraints)
- Intended duration
- Review trigger

**Examples:**
- "Reduced sprint volume for Player X — S&C — due to elevated ACWR — review in 72h"
- "Cleared for modified training — Physio — RTP Phase 3 — reassess after next session"

#### Why It Matters

- Eliminates hindsight bias
- Prevents blame shifting
- Builds institutional memory
- High-performing teams don't argue less — they remember better

#### Implementation Requirements

**Database Schema:**
```sql
CREATE TABLE decision_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id),
    decision_type VARCHAR(50) NOT NULL, -- load_adjustment, rtp_clearance, nutrition_change, etc.
    decision_summary TEXT NOT NULL,
    made_by UUID NOT NULL REFERENCES auth.users(id),
    made_by_role VARCHAR(50) NOT NULL,
    decision_basis JSONB NOT NULL, -- {data_points: [...], constraints: [...], rationale: "..."}
    intended_duration INTERVAL,
    review_trigger VARCHAR(100), -- "after_next_session", "in_72h", "if_symptoms_worsen", etc.
    review_date TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'reviewed', 'superseded', 'expired')),
    superseded_by UUID REFERENCES decision_ledger(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_decision_ledger_athlete ON decision_ledger(athlete_id, created_at DESC);
CREATE INDEX idx_decision_ledger_review ON decision_ledger(review_date) WHERE status = 'active';
CREATE INDEX idx_decision_ledger_made_by ON decision_ledger(made_by, created_at DESC);
```

**UI Requirements:**
- Decision history view per athlete
- Active decisions dashboard
- Review reminders
- Decision context when viewing athlete profile

---

### 4.2 Explicit "Unknowns" and Data Confidence

#### What's Missing

The app currently shows numbers — but not how reliable they are.

#### What to Add

Every critical metric shows:
- Data completeness
- Confidence level
- Missing inputs

**Examples:**
- "ACWR: 1.18 (Low confidence — only 12 of 28 days logged)"
- "Readiness trending down (Wellness missing 3 days)"

#### Why It Matters

This stops the most dangerous sentence in sport:
"The data says he's fine."

**No — the app should say:**
"The data is incomplete."

#### Implementation Requirements

**Database Schema:**
```sql
-- Add confidence metadata to existing metrics tables
ALTER TABLE athlete_readiness ADD COLUMN IF NOT EXISTS confidence_metadata JSONB;
-- Example: {"completeness": 0.75, "missing_days": 3, "stale_data": false, "baseline_status": "building"}

ALTER TABLE athlete_acwr ADD COLUMN IF NOT EXISTS confidence_metadata JSONB;
-- Example: {"baseline_days": 12, "baseline_required": 21, "status": "building_baseline", "completeness": 0.57}
```

**UI Requirements:**
- Confidence indicators on all metrics
- Missing data warnings
- Incomplete baseline indicators
- Data quality badges

---

### 4.3 "Do Not Escalate" Flag

#### What's Missing

Not every issue needs staff-wide attention.

#### What to Add

A private, role-level flag:
- "Monitor only"
- "No action unless trend worsens"

**Used by:**
- Physios (minor soreness)
- Psychologists (temporary stress)
- Nutritionists (one-off underfueling)

#### Why It Matters

This prevents:
- Overreaction
- Staff noise
- Athlete anxiety

**Silence can be strategic — but only when intentional.**

#### Implementation Requirements

**Database Schema:**
```sql
CREATE TABLE staff_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id),
    flagged_by UUID NOT NULL REFERENCES auth.users(id),
    flagged_by_role VARCHAR(50) NOT NULL,
    flag_type VARCHAR(50) NOT NULL, -- monitor_only, no_escalate, private_note
    category VARCHAR(50) NOT NULL, -- medical, psychological, nutrition, load
    description TEXT,
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired', 'escalated')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_staff_flags_athlete ON staff_flags(athlete_id, status, created_at DESC);
CREATE INDEX idx_staff_flags_expires ON staff_flags(expires_at) WHERE status = 'active';
```

**UI Requirements:**
- Private flagging interface per role
- Flag expiration reminders
- Escalation pathway when flag expires or worsens

---

### 4.4 Recovery as a First-Class Citizen

#### What's Missing

Recovery is present — but not owned.

#### What to Add

A Recovery Load Index that includes:
- Sleep debt
- Travel stress
- Mental fatigue
- Consecutive high-intensity days

**Displayed alongside:**
- Training load
- Rehab load

#### Why It Matters

Teams often say:
"We reduced training."

**But forget:**
"Recovery was still insufficient."

**This closes that gap.**

#### Implementation Requirements

**Database Schema:**
```sql
CREATE TABLE recovery_load_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    sleep_debt_hours DECIMAL(4,2),
    travel_stress_score INTEGER CHECK (travel_stress_score BETWEEN 0 AND 10),
    mental_fatigue_score INTEGER CHECK (mental_fatigue_score BETWEEN 0 AND 10),
    consecutive_high_intensity_days INTEGER DEFAULT 0,
    recovery_load_score DECIMAL(5,2), -- Calculated composite score
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(athlete_id, date)
);

CREATE INDEX idx_recovery_load_athlete ON recovery_load_index(athlete_id, date DESC);
```

**UI Requirements:**
- Recovery load dashboard
- Recovery vs training load comparison
- Recovery trend visualization
- Recovery alerts

---

### 4.5 Role-Based "What Changed Since Yesterday?"

#### What's Missing

Staff open dashboards and hunt for changes.

#### What to Add

A daily delta view:
- What changed
- Why
- Who should care

**Filtered by role:**
- Coaches see availability changes
- S&C sees load deviations
- Physio sees symptom shifts
- Nutrition sees missed targets
- Psychology sees volatility

#### Why It Matters

This saves time and focuses attention.

#### Implementation Requirements

**Database Schema:**
```sql
CREATE TABLE daily_delta_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    delta_type VARCHAR(50) NOT NULL, -- availability_change, load_deviation, symptom_shift, etc.
    category VARCHAR(50) NOT NULL, -- medical, load, nutrition, psychological, tactical
    change_description TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    relevance_roles TEXT[], -- ['head_coach', 'physiotherapist', ...]
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(athlete_id, date, delta_type)
);

CREATE INDEX idx_daily_delta_athlete ON daily_delta_log(athlete_id, date DESC);
CREATE INDEX idx_daily_delta_roles ON daily_delta_log USING GIN(relevance_roles);
```

**UI Requirements:**
- Daily delta dashboard per role
- Change notifications
- "What changed" summary view
- Filter by relevance

---

### 4.6 Pre-Mortem Mode

#### What's Missing

You review after failures — but don't anticipate them.

#### What to Add

Before tournaments or congested weeks:
A pre-mortem checklist:
- Who is at highest risk?
- Where are assumptions weakest?
- What decision would we regret not making?

**This is not AI fantasy — it's structured humility.**

#### Implementation Requirements

**Database Schema:**
```sql
CREATE TABLE pre_mortem_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id),
    event_type VARCHAR(50) NOT NULL, -- tournament, congested_week, travel_week
    event_start_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    checklist_data JSONB NOT NULL -- {risks: [...], assumptions: [...], decisions: [...]}
);

CREATE INDEX idx_pre_mortem_team ON pre_mortem_checklists(team_id, event_start_date DESC);
```

**UI Requirements:**
- Pre-mortem checklist interface
- Risk identification workflow
- Assumption validation
- Decision planning

---

### 4.7 Consent Visibility for Staff

#### What's Missing

Consent exists — but staff may not always feel its boundaries.

#### What to Add

Explicit indicators:
- "Data partially hidden"
- "Psychological inputs restricted"
- "Health metrics unavailable"

#### Why It Matters

This prevents misinterpretation and overconfidence.

#### Implementation Requirements

**UI Requirements:**
- Consent status indicators on all athlete views
- "Data unavailable" badges
- Consent explanation tooltips
- Clear boundaries visualization

---

### 4.8 Staff Alignment Score (Internal, Not Marketing)

#### What's Missing

You assume alignment — but never measure it.

#### What to Add

A behind-the-scenes signal:
- Frequency of overrides
- Conflicting adjustments
- Late escalations

**Not to judge — to improve coordination.**

#### Implementation Requirements

**Database Schema:**
```sql
CREATE TABLE staff_alignment_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    override_count INTEGER DEFAULT 0,
    conflict_count INTEGER DEFAULT 0,
    late_escalation_count INTEGER DEFAULT 0,
    alignment_score DECIMAL(5,2), -- Calculated score
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(team_id, period_start, period_end)
);

CREATE INDEX idx_alignment_team ON staff_alignment_metrics(team_id, period_start DESC);
```

**UI Requirements:**
- Internal alignment dashboard (admin only)
- Trend visualization
- Coordination improvement recommendations

---

## SECTION 5 — Implementation Priority

### Priority 1: Critical (Implement First)

1. **Decision Ledger** — Transforms app from monitoring system to organizational brain
2. **Explicit Unknowns and Data Confidence** — Prevents dangerous overconfidence
3. **Consent Visibility for Staff** — Protects trust and prevents misinterpretation

### Priority 2: High Value (Implement Second)

4. **Recovery as First-Class Citizen** — Closes critical gap in load management
5. **Role-Based Daily Delta** — Saves time and focuses attention
6. **"Do Not Escalate" Flag** — Reduces noise and overreaction

### Priority 3: Organizational Learning (Implement Third)

7. **Pre-Mortem Mode** — Structured humility before high-stakes periods
8. **Staff Alignment Score** — Internal metric for coordination improvement

---

## SECTION 6 — Enforcement Rules

### 6.1 Domain Authority Enforcement

**Rule:** No role can override another role's domain authority without explicit escalation.

**Enforcement:**
- Database constraints prevent violations
- UI prevents override actions without escalation
- Audit logs capture all override attempts

### 6.2 Decision Accountability Enforcement

**Rule:** All significant decisions must be logged in Decision Ledger.

**Enforcement:**
- Required fields for decision-making actions
- Review triggers enforced by system
- Decision history visible to all authorized staff

### 6.3 Data Confidence Enforcement

**Rule:** All metrics must display confidence metadata.

**Enforcement:**
- Database requires confidence metadata
- UI displays confidence indicators
- Missing data warnings are mandatory

### 6.4 Coordination Flow Enforcement

**Rule:** Constraints flow upward (Medical → Physical → Tactical), not sideways.

**Enforcement:**
- System blocks reverse pressure
- Violations trigger alerts
- Escalation required for overrides

---

## SECTION 7 — Audit Requirements

### 7.1 Decision Ledger Audit

All decisions logged in Decision Ledger must include:
- Who made the decision
- What decision was made
- Why (data + constraints)
- When review is due
- Whether review occurred

### 7.2 Override Audit

All overrides must be logged with:
- Who overrode what
- Why override was necessary
- Who approved override
- Duration of override
- Outcome of override

### 7.3 Coordination Audit

All coordination actions must be logged:
- Who communicated what to whom
- What constraints were set
- What adjustments were made
- Whether conflicts occurred

---

## SECTION 8 — One Sentence Summary

**The app replaces meetings with structure, replaces opinions with domains, and replaces pressure with traceable decisions.**

---

## SECTION 9 — Next Steps

### Immediate Actions

1. **Create Decision Ledger database schema**
2. **Add confidence metadata to all metrics**
3. **Implement consent visibility indicators**
4. **Create role-specific dashboards**
5. **Build coordination workflow UI**

### Documentation Updates

1. **Update role permission matrices**
2. **Create staff coordination runbook**
3. **Document decision-making workflows**
4. **Create conflict resolution procedures**

### Testing Requirements

1. **Test domain authority enforcement**
2. **Test decision ledger logging**
3. **Test coordination workflows**
4. **Test conflict prevention mechanisms**

---

**End of Contract**

