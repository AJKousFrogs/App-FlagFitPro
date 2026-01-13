# Step 2.4: Coach Authority & Visibility Contract (v1)

**Contract Version:** 1.0  
**Status:** FINAL  
**Effective Date:** 2025-01-06  
**Author:** Product Architecture  
**Dependencies:** CONTRACT 2.1, 2.2, 2.3, Backend Truthfulness Contract  
**Next Review:** Upon implementation or material system change

---

## Preamble

This contract defines the **absolute authority model** for coaching decisions within the system. It is legally binding in system behavior: no component, AI, or user action may violate these rules. This contract exists to eliminate ambiguity in responsibility, preserve coaching intent, and ensure athletes understand who decided what.

**Governing Principle:**  
When a coach acts, the system executes the coach's intent — not AI inference, not algorithmic suggestion, not athlete preference.

---

## SECTION 1 — Coach Authority Definition (Binding)

### 1.1 Definition of Coach Authority

**Coach authority** is the exclusive right to:
- Modify, cancel, or replace any planned training session
- Override algorithmic recommendations (readiness, ACWR, weather, AI suggestions)
- Assign practice, film room, taper, or rest in place of planned training
- Communicate binding instructions that supersede all athlete preferences

### 1.2 Coach Authority Scope

Coaches MAY override:
- Session type, duration, intensity
- Exercise selection and structure
- Readiness-based recommendations
- ACWR safety boundaries (with explicit acknowledgment required)
- Weather API recommendations
- Merlin suggestions
- Athlete-requested modifications

Coaches MAY NOT override:
- Medical rehabilitation protocols prescribed by licensed clinicians
- System-enforced safety lockouts (e.g., medical flag requiring clearance)
- Athlete account suspension or deletion
- Guardian-enforced restrictions for minors

### 1.3 Authority Hierarchy (Canonical Order)

When conflicts arise, resolution follows this order (highest to lowest):

1. **Medical/Rehab Protocol** (clinician-prescribed)
2. **Coach Direct Instruction** (explicit modification)
3. **System Safety Lockouts** (medical flags, guardian restrictions)
4. **ACWR Safety Boundaries** (unless coach explicitly overrides)
5. **Readiness Recommendations**
6. **Weather API Recommendations**
7. **AI Personalization (Merlin)**
8. **Athlete Preference**

### 1.4 Binding Execution Rule

> **If a coach modifies a plan, the system executes the coach's intent — not AI inference.**

The system MUST NOT:
- Interpret coach intent
- Infer unstated coach preferences
- Apply personalization on top of coach decisions
- Allow Merlin to modify coach instructions
- Permit athletes to bypass coach decisions via dialogue

---

## SECTION 2 — Coach Action Types (Canonical)

### 2.1 SESSION_MODIFICATION

**Definition:** Coach changes session parameters (duration, intensity, exercises, structure).

**Required Data:**
- `coach_id` (UUID)
- `session_id` (UUID)
- `modification_type` (enum: duration, intensity, exercise_swap, structure_change)
- `original_value` (JSON)
- `new_value` (JSON)
- `reason` (string, optional but recommended)
- `timestamp` (ISO 8601)

**Behavior:** REPLACES original session with modified version.

**Athlete Acknowledgment:** REQUIRED if modification increases intensity >10% or changes session type.

**Merlin Posture:** Silent until athlete acknowledges. If asked, Merlin states: "Coach [Name] modified this session on [Date]. I cannot change coach decisions."

---

### 2.2 PRACTICE_SCHEDULING

**Definition:** Coach assigns team practice in place of individual training.

**Required Data:**
- `coach_id` (UUID)
- `athlete_ids` (UUID[])
- `practice_date` (ISO 8601 date)
- `practice_time` (ISO 8601 time)
- `location` (string)
- `replaces_session_id` (UUID, nullable)
- `notes` (string, optional)

**Behavior:** REPLACES individual session with practice attendance requirement.

**Athlete Acknowledgment:** REQUIRED.

**Merlin Posture:** Must inform athlete that attendance is mandatory. Cannot suggest alternatives.

---

### 2.3 FILM_ROOM_ASSIGNMENT

**Definition:** Coach assigns film study in place of physical training.

**Required Data:**
- `coach_id` (UUID)
- `athlete_id` (UUID)
- `session_date` (ISO 8601 date)
- `film_topic` (string)
- `duration_minutes` (integer)
- `replaces_session_id` (UUID)
- `notes` (string, optional)

**Behavior:** REPLACES training session with cognitive session.

**Athlete Acknowledgment:** NOT REQUIRED (informational).

**Merlin Posture:** Cannot suggest physical training instead. Can discuss film topic if athlete asks.

---

### 2.4 WEATHER_OVERRIDE

**Definition:** Coach overrides weather-based recommendation (proceed despite warning, or cancel despite clear conditions).

**Required Data:**
- `coach_id` (UUID)
- `session_id` (UUID)
- `weather_recommendation` (enum: proceed, caution, cancel)
- `coach_decision` (enum: proceed, modify, cancel)
- `override_reason` (string, required)
- `timestamp` (ISO 8601)

**Behavior:** REPLACES weather API decision with coach judgment.

**Athlete Acknowledgment:** REQUIRED if coach proceeds against "cancel" recommendation.

**Merlin Posture:** Must state weather conditions factually but defer to coach decision. Cannot recommend disobeying coach.

---

### 2.5 TAPER_ACTIVATION

**Definition:** Coach activates pre-competition taper, reducing training load systematically.

**Required Data:**
- `coach_id` (UUID)
- `athlete_id` (UUID)
- `taper_start_date` (ISO 8601 date)
- `competition_date` (ISO 8601 date)
- `taper_strategy` (enum: linear, exponential, step)
- `notes` (string, optional)

**Behavior:** MODIFIES all sessions between start and competition date according to taper strategy.

**Athlete Acknowledgment:** REQUIRED (athlete must confirm competition date).

**Merlin Posture:** Cannot suggest increasing intensity during taper. Can explain taper rationale if asked.

---

### 2.6 ATHLETE_SPECIFIC_ADJUSTMENT

**Definition:** Coach makes individualized change based on athlete circumstances (injury caution, skill focus, positional need).

**Required Data:**
- `coach_id` (UUID)
- `athlete_id` (UUID)
- `adjustment_category` (enum: injury_caution, skill_focus, position_specific, load_reduction)
- `session_ids_affected` (UUID[])
- `adjustment_description` (string, required)
- `duration_days` (integer, nullable for indefinite)
- `timestamp` (ISO 8601)

**Behavior:** MODIFIES affected sessions per adjustment description.

**Athlete Acknowledgment:** REQUIRED if adjustment is safety-related (injury_caution, load_reduction).

**Merlin Posture:** Must reference adjustment context if athlete questions plan. Cannot override.

---

### 2.7 ADVISORY_NOTE

**Definition:** Coach leaves guidance without modifying session structure.

**Required Data:**
- `coach_id` (UUID)
- `athlete_id` (UUID)
- `session_id` (UUID, nullable)
- `note_content` (string, required)
- `note_priority` (enum: info, attention, urgent)
- `timestamp` (ISO 8601)

**Behavior:** ANNOTATES session without changing structure.

**Athlete Acknowledgment:** NOT REQUIRED unless `note_priority === urgent`.

**Merlin Posture:** Must surface note verbatim if athlete asks about session. Cannot paraphrase or reinterpret.

---

## SECTION 3 — Coach Override Visibility Rules

### 3.1 Attribution Requirement

ALL coach actions MUST display attribution:

**Format:**  
```
Updated by Coach [Full Name] at [Time] on [Date]
```

**Placement:**  
- TOP of TODAY screen session card (above session title)
- Persistent until athlete acknowledges (if acknowledgment required)
- Remains visible for 7 days after acknowledgment or session completion

### 3.2 Timestamp Precision

Timestamps MUST include:
- Date (YYYY-MM-DD)
- Time (HH:MM in athlete's local timezone)
- Relative time for changes <24h old ("2 hours ago")

### 3.3 Modified vs Original Plan Distinction

When coach modifies a session, TODAY MUST show:

**Original Plan Indicator:**  
```
Original: [Session Type] • [Duration] • [Intensity Level]
```

**Modified Plan Indicator:**  
```
Coach Update: [New Session Type] • [New Duration] • [New Intensity Level]
```

Visual distinction: Original plan in dimmed text, Modified plan in primary text.

### 3.4 Change Visibility Duration

- **Active Changes:** Visible until session completed or athlete acknowledges
- **Completed Changes:** Visible in session history for 30 days
- **Urgent Changes:** Sticky banner until acknowledged (cannot be dismissed)

### 3.5 Multiple Coach Changes Handling

If coach modifies same session >1 time:

- Show ONLY most recent change on TODAY
- Show change count: "Updated 3 times by Coach [Name]"
- Full change history available via "View Change Log" link
- Change log displays chronological list with timestamps and reasons

---

## SECTION 4 — Conflict Resolution Rules (Coach vs Everything)

### 4.1 Conflict: Coach Change vs Readiness

**Scenario:** Coach assigns high-intensity session. Readiness score = 35 (red zone).

**Inputs:**
- `coach_session_intensity`: 8/10
- `readiness_score`: 35/100
- `readiness_recommendation`: "Rest or very light activity"

**Resolution:**  
Coach decision takes precedence. System executes high-intensity session.

**Athlete-Visible Outcome:**
```
Coach [Name] assigned this session on [Date].
Your readiness is low today (35/100), but your coach has a specific training goal.
If you feel unwell, contact your coach before training.
```

**Merlin Posture:**  
"Your coach assigned this session knowing your readiness is low. I trust their judgment. If you're concerned, you should message your coach."

---

### 4.2 Conflict: Coach Change vs ACWR Safety Boundary

**Scenario:** Coach increases volume, pushing ACWR to 1.6 (system threshold = 1.5).

**Inputs:**
- `coach_session_volume`: 450 arbitrary units
- `current_acwr`: 1.55
- `projected_acwr_after_session`: 1.68
- `system_safety_threshold`: 1.50

**Resolution:**  
System displays warning but allows coach decision. Logs override for audit.

**Athlete-Visible Outcome:**
```
⚠️ Coach [Name] increased training volume on [Date].
This exceeds your typical load progression.
Your coach is monitoring your training closely. Follow their guidance.
```

**Merlin Posture:**  
"Your coach increased today's volume beyond typical progression guidelines. They're aware of this and are monitoring you. Let your coach know immediately if anything feels wrong."

---

### 4.3 Conflict: Coach Change vs Taper

**Scenario:** Athlete in taper period (3 days before competition). Coach assigns high-intensity session.

**Inputs:**
- `taper_active`: true
- `days_until_competition`: 3
- `taper_strategy`: exponential
- `coach_session_intensity`: 9/10

**Resolution:**  
Coach decision overrides taper strategy. System logs deviation.

**Athlete-Visible Outcome:**
```
Coach [Name] assigned high-intensity training on [Date].
This is outside your normal taper plan.
Your coach has a specific reason. Trust the process.
```

**Merlin Posture:**  
"Your coach modified your taper plan. This is intentional. Elite athletes sometimes do high-intensity work close to competition for specific physiological reasons. Your coach knows your body and the plan."

---

### 4.4 Conflict: Coach Change vs Athlete Preference

**Scenario:** Athlete requested rest day via Merlin. Coach assigns practice.

**Inputs:**
- `athlete_request`: "I need a rest day"
- `athlete_request_timestamp`: 2025-01-06T08:00:00Z
- `coach_action`: PRACTICE_SCHEDULING
- `coach_action_timestamp`: 2025-01-06T09:30:00Z

**Resolution:**  
Coach decision overrides athlete request. Athlete request is voided.

**Athlete-Visible Outcome:**
```
Practice scheduled by Coach [Name] at 9:30 AM today.
Location: [Field Name] • Time: 3:00 PM
Your rest day request has been superseded by team practice.
```

**Merlin Posture:**  
"I know you requested rest, but Coach [Name] scheduled practice after your request. Team commitments take priority. You should attend unless you're injured — in that case, contact your coach immediately."

---

### 4.5 Conflict: Coach Change vs Weather API Recommendation

**Scenario:** Weather API recommends cancellation (heat index 105°F). Coach overrides and proceeds.

**Inputs:**
- `weather_heat_index`: 105°F
- `weather_api_recommendation`: CANCEL
- `coach_decision`: PROCEED
- `coach_override_reason`: "Modified practice: shade only, hydration stations, 50% duration"

**Resolution:**  
Coach decision takes precedence. System surfaces weather data and coach modification.

**Athlete-Visible Outcome:**
```
🌡️ Heat Index: 105°F
Coach [Name] modified practice for safety:
• Shade only • Hydration stations • 50% duration
Monitor yourself closely. Stop if you feel dizzy or nauseated.
```

**Merlin Posture:**  
"Coach [Name] is aware of the heat and has modified practice to keep you safe. Follow their hydration and rest instructions carefully. If you feel any heat illness symptoms, stop immediately and tell your coach."

---

## SECTION 5 — Athlete Acknowledgment Rules

### 5.1 Acknowledgment Requirement Triggers

Acknowledgment REQUIRED when:
- Coach increases intensity >10% from original plan
- Coach changes session type (e.g., speed → strength)
- Coach schedules mandatory practice
- Coach overrides ACWR safety boundary
- Coach proceeds against weather cancellation recommendation
- Coach activates taper
- Coach makes safety-related athlete-specific adjustment
- Coach note has `note_priority: urgent`

### 5.2 Acknowledgment Definition

Acknowledgment constitutes:
- Explicit button press: "I Understand" or "Acknowledged"
- Cannot be dismissed via swipe or back navigation
- Must include athlete timestamp

Acknowledgment does NOT constitute:
- Viewing the session
- Opening TODAY screen
- Reading coach note without explicit action

### 5.3 Non-Acknowledgment Behavior

If athlete does NOT acknowledge before session start:

**Blocking Actions (cannot proceed with training):**
- ACWR safety boundary override
- Weather cancellation override
- Mandatory practice attendance

**Non-Blocking Actions (training can proceed):**
- Intensity increase <20%
- Session type change (same load category)
- Advisory notes

### 5.4 Acknowledgment Logging

System MUST log:
- `athlete_id`
- `coach_action_id`
- `acknowledgment_timestamp`
- `acknowledgment_method` (button press, voice confirmation via Merlin)
- `time_to_acknowledge` (seconds between coach action and acknowledgment)

### 5.5 Persistent Acknowledgment

Once acknowledged, athlete CANNOT un-acknowledge. Acknowledgment is permanent and auditable.

---

## SECTION 6 — Coach Notes & Communication Scope

### 6.1 Coach Note Categories

Coaches MAY write notes about:
- Session-specific guidance (technique focus, intensity targets)
- Positional or skill development priorities
- Injury caution or modification instructions
- Competition preparation mindset
- Team dynamics or leadership focus
- Recovery or nutrition emphasis

### 6.2 Coach Note Appearance on TODAY

Coach notes appear:
- Below session title and attribution
- In distinct visual container (border, background color)
- With coach name and timestamp
- With priority indicator (info, attention, urgent)

Format:
```
📝 Coach Note (Priority: Attention)
From Coach [Name] • [Date] at [Time]
[Note content verbatim]
```

### 6.3 Merlin Handling of Coach Notes

Merlin MUST:
- Quote coach notes verbatim (no paraphrasing)
- Attribute notes to coach by name
- Surface notes when athlete asks about session rationale
- Defer to coach notes when athlete requests conflict with notes

Merlin MUST NOT:
- Reinterpret coach intent
- Summarize or shorten coach notes
- Contradict coach notes
- Suggest actions that violate coach notes

**Example:**  
Athlete: "Why is today so hard?"  
Merlin: "Coach [Name] wrote: '[exact note text]'. They have a specific reason for this session."

### 6.4 Coach Note vs Athlete Request Conflict

If coach note contradicts athlete request:

**Resolution:** Coach note takes precedence.

**Example:**  
Coach Note: "Focus on explosion today, no endurance work"  
Athlete Request: "Can I add a long run?"

Merlin Response: "Coach [Name] specifically said to focus on explosion today with no endurance work. I can't add a long run. If you want to discuss this, message your coach."

### 6.5 Forbidden Coach Behaviors (System-Enforced)

The system MUST prevent or flag:

1. **Vague Instructions Without Context**  
   - Coach notes <20 characters rejected (except "See me before practice")
   - Required: actionable guidance or clear rationale

2. **Unsafe Modifications During Rehab**  
   - If athlete has active rehab protocol, system warns coach before allowing modification
   - Coach must confirm override with reason

3. **Silent Plan Changes Without Attribution**  
   - IMPOSSIBLE: all changes require coach_id and timestamp
   - System rejects anonymous modifications

4. **Contradictory Simultaneous Instructions**  
   - If coach assigns both "rest" and "high-intensity session" on same day, system alerts coach to resolve conflict

5. **Retroactive Attribution Changes**  
   - Coach cannot change who modified a past session
   - Audit log is immutable

---

## SECTION 7 — Auditability & Responsibility

### 7.1 Coach Action Logging (Required Fields)

When coach performs ANY action, system MUST log:

**Core Fields:**
- `log_id` (UUID, unique)
- `coach_id` (UUID)
- `athlete_id` (UUID)
- `action_type` (enum: SESSION_MODIFICATION, PRACTICE_SCHEDULING, etc.)
- `session_id` (UUID, nullable for global actions)
- `timestamp_utc` (ISO 8601)
- `timestamp_local_athlete` (ISO 8601)

**Modification Fields:**
- `original_state` (JSON snapshot before change)
- `new_state` (JSON snapshot after change)
- `modification_reason` (string, nullable)

**Context Fields:**
- `athlete_readiness_at_time` (integer 0-100)
- `athlete_acwr_at_time` (float)
- `weather_conditions_at_time` (JSON from weather API)
- `override_flags` (array: ACWR_OVERRIDE, WEATHER_OVERRIDE, READINESS_OVERRIDE, etc.)

**Outcome Fields:**
- `athlete_acknowledged` (boolean)
- `acknowledgment_timestamp` (ISO 8601, nullable)
- `session_completed` (boolean)
- `session_completion_timestamp` (ISO 8601, nullable)
- `athlete_feedback_rating` (integer 1-5, nullable)

### 7.2 Visibility Tiers

**Visible to Athlete:**
- Coach name
- Timestamp (local timezone)
- What changed (original vs new)
- Coach note/reason (if provided)
- Acknowledgment status

**Visible to Coach:**
- All athlete-visible fields
- Athlete acknowledgment timestamp
- Time-to-acknowledge
- Athlete feedback rating (post-session)
- Athlete readiness/ACWR at time of modification

**Visible to Admin/Support:**
- All coach-visible fields
- Full audit log with immutable history
- Override flags
- System-generated warnings (ACWR, weather, readiness)
- Cross-athlete pattern analysis (coach safety compliance)

### 7.3 Liability Protection

Audit logs serve to establish:
- **Who decided:** Coach ID + timestamp
- **What they knew:** Readiness, ACWR, weather data at decision time
- **What they changed:** Immutable before/after snapshots
- **How athlete responded:** Acknowledgment + completion + feedback

If injury or adverse event occurs:
- System can reconstruct decision context
- Coach's rationale (if provided) is preserved
- Athlete's acknowledgment proves informed consent
- Override flags show coach awareness of risk factors

### 7.4 Audit Log Retention

- **Active Athlete:** Retain all logs for lifetime of account + 7 years post-deletion
- **Minor Athlete:** Retain until age 25 or account deletion + 7 years (whichever is longer)
- **Deleted Account:** Anonymize but retain logs for 7 years (for legal compliance)

### 7.5 Audit Export

Coaches and admins can export audit logs as:
- JSON (machine-readable)
- CSV (spreadsheet analysis)
- PDF (human-readable report with timestamps and signatures)

Athletes can request their own audit history via "My Coach History" feature.

---

## SECTION 8 — Merlin Boundaries with Coaches

### 8.1 Merlin Coach Reference Protocol

Merlin MUST reference coach intent by:
- Using coach's full name
- Citing timestamp of coach action
- Quoting coach notes verbatim (no paraphrasing)
- Stating confidence in coach judgment

Merlin MUST NOT:
- Interpret what coach "probably meant"
- Suggest coach made a mistake
- Imply AI knows better than coach
- Offer workarounds to coach decisions

### 8.2 Mandatory Deferral Triggers

Merlin MUST defer when:
- Athlete requests change to coach-modified session
- Athlete asks "why" about coach decision
- Athlete questions safety of coach decision
- Athlete wants to skip coach-scheduled practice
- Athlete proposes different training than coach assigned

### 8.3 Refusal Protocol

When athlete requests coach override, Merlin MUST refuse with:
- Clear statement: "I cannot change what Coach [Name] assigned"
- Rationale: "Your coach made this decision for a reason"
- Escalation path: "If you have concerns, message your coach directly"

### 8.4 Escalation to Coach

Merlin MUST escalate to coach when:
- Athlete reports injury or illness before coach-assigned session
- Athlete repeatedly questions coach decision safety
- Athlete requests rest due to exhaustion despite coach plan
- Athlete cannot attend coach-scheduled practice

Escalation format:
```
"This is important enough that you should talk to Coach [Name] directly. 
I've flagged this conversation for their review. 
Do not proceed with training until you've spoken with them."
```

### 8.5 Example Dialogues

**Dialogue 1: Correct Deferral**

Athlete: "Can you make today's workout lighter? I'm tired."

Merlin: "Coach [Name] assigned today's session this morning. I can't change coach decisions. Your coach knows your training plan and has a reason for today's intensity. If you're unusually tired or feel unwell, you should message your coach before training."

---

**Dialogue 2: Refusal to Override Coach**

Athlete: "I want to do a long run instead of what my coach planned."

Merlin: "I cannot change what Coach [Name] assigned. Your coach designed today's session to fit your overall training progression. If you want to discuss alternatives, talk to your coach directly. I can't override their plan."

---

**Dialogue 3: Facilitating Coach Communication**

Athlete: "My knee hurts but coach scheduled high-intensity today."

Merlin: "This is important — you should talk to Coach [Name] immediately before training. I'm flagging this conversation for their review. Do not proceed with high-intensity training if you're injured. Your health comes first. Message your coach now."

---

## SECTION 9 — Forbidden Patterns (Hard Bans)

The system MUST prevent the following patterns through technical enforcement:

### 9.1 AI Silently Changing Coach Plans

**Forbidden:** Any AI algorithm (personalization, readiness, ACWR) modifying a coach-assigned session without explicit coach re-approval.

**Enforcement:** Coach-modified sessions flagged as `coach_locked: true`. AI cannot write to these records.

---

### 9.2 Coach Changes Without Attribution

**Forbidden:** Any session modification without coach_id and timestamp.

**Enforcement:** Database constraints require non-null `modified_by_coach_id` and `modified_at_timestamp` for any session edit.

---

### 9.3 AI Personalization Overriding Coach Decisions

**Forbidden:** Merlin or backend algorithms adjusting intensity, duration, or structure of coach-assigned sessions.

**Enforcement:** `coach_locked` flag blocks all AI modification APIs.

---

### 9.4 Athletes Bypassing Coach Instructions via Merlin

**Forbidden:** Merlin accepting athlete requests that contradict active coach instructions.

**Enforcement:** Before processing athlete modification requests, Merlin checks for `coach_locked` sessions and refuses.

---

### 9.5 "Soft" Overrides Blurring Responsibility

**Forbidden:** System making "suggestions" that effectively change coach plans (e.g., "Coach said 60 minutes, but maybe do 45?").

**Enforcement:** Merlin cannot propose modifications to coach-locked sessions. Must execute exactly as assigned.

---

### 9.6 Retroactive Coach Attribution Changes

**Forbidden:** Changing who is credited with past session modifications.

**Enforcement:** `modified_by_coach_id` is immutable after initial write. Audit log is append-only.

---

### 9.7 Coach Actions Without Timestamps

**Forbidden:** Any coach modification logged without exact UTC and local timestamps.

**Enforcement:** Database rejects writes missing timestamp fields.

---

### 9.8 Athlete Proceeding Without Required Acknowledgment

**Forbidden:** Athlete starting blocking-category coach-modified session without acknowledgment.

**Enforcement:** TODAY screen locks session UI until acknowledgment button pressed.

---

### 9.9 Merlin Paraphrasing Coach Notes

**Forbidden:** Merlin summarizing, shortening, or reinterpreting coach notes.

**Enforcement:** When Merlin references coach notes, system injects verbatim text from database. Merlin cannot generate alternative phrasing.

---

### 9.10 Anonymous or System-Generated Coach Actions

**Forbidden:** System making changes and attributing them to "your coach" generically or to "the system."

**Enforcement:** All coach actions require real coach account UUID. System-generated recommendations (readiness, ACWR) cannot masquerade as coach decisions.

---

### 9.11 Coach Overrides Without Reason During High-Risk Scenarios

**Forbidden:** Coach overriding ACWR or weather safety boundaries without providing `modification_reason`.

**Enforcement:** If override_flag present and `modification_reason` is null/empty, system prompts coach to provide reason before allowing action.

---

### 9.12 Athlete Feedback Influencing Past Coach Attribution

**Forbidden:** Athlete rating session negatively and system retroactively changing "who decided" this session.

**Enforcement:** Audit log is immutable. Athlete feedback stored separately and cannot alter historical records.

---

## SECTION 10 — Contract Enforcement & Violations

### 10.1 Enforcement Mechanisms

This contract is enforced via:
- Database constraints (non-null fields, immutable columns, foreign key integrity)
- API middleware (rejecting coach_locked modifications from AI)
- UI logic (blocking session start without acknowledgment)
- Audit triggers (logging all state changes)

### 10.2 Violation Handling

If system detects contract violation:
- Log error with full context (attempted action, violating component, timestamp)
- Block action immediately (no partial execution)
- Alert engineering team (critical violation)
- Notify affected coach (if athlete-facing component violated their authority)

### 10.3 Contract Updates

This contract may be updated ONLY via:
- Formal versioning (v1 → v2)
- Explicit changelog documenting what changed
- Stakeholder review (product, engineering, coaching staff, legal)
- Migration plan for in-flight sessions

Versioning follows semantic versioning: MAJOR.MINOR (e.g., v1.0, v1.1, v2.0).

---

## SECTION 11 — Success Criteria

This contract is successful when:

1. **Zero Ambiguity:** Athletes always know who decided what
2. **Zero Bypass:** AI cannot circumvent coach authority
3. **Zero Attribution Loss:** Every modification is traceable to a person
4. **Zero Paraphrasing:** Coach words appear exactly as written
5. **Zero Retroactive Edits:** History is immutable and auditable
6. **Zero Silent Changes:** All coach actions are visible and timestamped
7. **Zero Liability Gaps:** System can reconstruct decision context for any session

---

## END OF CONTRACT

**Status:** FINAL (v1.0)  
**Effective Date:** 2025-01-06  
**Next Review:** Upon implementation or material system change  
**Authority:** Product Architecture, endorsed by Engineering and Coaching  

This contract is now binding for all system components, UI flows, AI behavior, and backend logic.

