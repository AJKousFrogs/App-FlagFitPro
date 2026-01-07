# Step 2.5: Data Consent & Visibility Contract (v1)

**Status:** BINDING  
**Authority:** Normative Contract  
**Effective:** 2026-01-06  
**Supersedes:** None  
**Dependencies:**
- Step 2.1: TODAY Screen UX Authority Contract v1 (FINAL)
- Step 2.2: TODAY State → Behavior Resolution Contract v1 (FINAL)
- Step 2.3: Merlin Dialogue Authority Contract v1 (FINAL)
- Step 2.4: Coach Authority & Visibility Contract v1 (FINAL)
- Backend Truthfulness Contract (ENFORCED)

---

## Preamble

This contract defines the **complete and enforceable consent and visibility model** for all personal data within the system. It establishes:
- What data exists and who owns it
- Who can see what, under which conditions
- What consent means and how it operates
- What safety overrides exist and when they trigger
- What is forbidden under all circumstances

This contract is **privacy-by-design law** for the system. All backend logic, frontend UI, coach tools, and Merlin dialogue behavior MUST comply.

**Core Principles:**
1. Athletes own their personal wellness and training data
2. Coaches need compliance visibility + safety signals, not private content by default
3. Safety-critical signals override privacy when athlete welfare is at risk
4. Medical data requires explicit consent or medical role authority
5. Teammates have minimal visibility into each other's private data
6. All visibility changes are logged and auditable
7. Consent changes take effect immediately
8. Merlin MUST NOT leak cross-athlete data

---

## SECTION 1 — Data Categories (Canonical)

All data in the system falls into one of the following categories. Each category has defined sensitivity, default visibility, and consent rules.

### 1.1 Identity & Membership

**Contents:**
- Full name
- Email (authentication)
- Team membership(s)
- Role(s) within team(s)
- Account creation date
- Last active timestamp

**Sensitivity:** LOW  
**Default Visibility:** Coach, Staff (within same team context)  
**Consent Override:** Athlete cannot hide identity from assigned coaches/staff  
**Retention:** Account lifetime + 90 days post-deletion (audit)

---

### 1.2 Training Plan Data

**Contents:**
- Assigned training program (name, phase, week)
- Session blocks (date, type, target duration)
- Exercise library assignments (exercise name, sets, reps, load prescription)
- Progression rules
- Plan modification history

**Sensitivity:** LOW  
**Default Visibility:** Athlete, Coach (prescriber), S&C Staff  
**Consent Override:** Athlete cannot hide assigned plan from coach who prescribed it  
**Retention:** 24 months (performance analysis)

---

### 1.3 Training Execution Logs

**Contents:**
- Session completion status (done/partial/skipped)
- Completed date/time
- Duration (actual)
- Sets/reps/load performed (numerical)
- RPE (1-10 scale)
- Athlete freeform notes/comments

**Sensitivity:** MEDIUM  
**Default Visibility:**
- Athlete: full access
- Coach: completion status, duration, sets/reps/load, RPE **only**
- Coach: athlete notes **hidden by default** (opt-in required)

**Consent Override:**
- Athlete can hide freeform notes from coach (default)
- Athlete can opt-in to share notes with coach
- Coach always sees numerical execution data (compliance)
- If RPE ≥ 9 for 3+ consecutive sessions → safety trigger (see Section 4)

**Retention:** 24 months

---

### 1.4 Load Metrics

**Contents:**
- Acute Load (7-day rolling)
- Chronic Load (28-day rolling)
- Acute:Chronic Workload Ratio (ACWR)
- Monotony index
- Strain index
- Training baseline status (establishing/complete)
- Load trend indicators (increasing/stable/decreasing)

**Sensitivity:** MEDIUM  
**Default Visibility:**
- Athlete: full access with educational context
- Coach: summary indicators (green/amber/red) during baseline establishment
- Coach: numerical values after baseline complete (28 days minimum)
- S&C Staff: full access

**Consent Override:**
- Athlete cannot hide ACWR danger zone (>1.5 or <0.8) from coach once baseline complete
- Safety override applies (see Section 4.3)

**Retention:** 24 months

---

### 1.5 Wellness Check-in Summary

**Contents:**
- ReadinessScore (0-100, derived from wellness answers)
- Check-in completion timestamp
- Days since last check-in
- Completion streak count
- Safety flags (boolean: has_pain_alert, has_stress_alert, has_sleep_alert)

**Sensitivity:** MEDIUM  
**Default Visibility:**
- Athlete: full access
- Coach: **compliance data only**:
  - Check-in completed: yes/no
  - Days since last check-in
  - Completion streak
  - Safety flags: **yes** (triggered) / no (triggered means coach sees flag exists, not detail)
- Coach: **readinessScore hidden by default** (opt-in required)

**Consent Override:**
- Athlete can opt-in to share readinessScore with coach
- Safety flags always visible to coach when triggered (flag existence, not detail)
- Individual wellness answers remain hidden unless athlete opts in (see 1.6)

**Retention:** 12 months (wellness trends)

---

### 1.6 Wellness Check-in Detail

**Contents:**
- Sleep quality (1-5 scale)
- Sleep hours (numerical)
- Stress level (1-5 scale)
- Muscle soreness (1-5 scale)
- Mood (1-5 scale)
- Energy level (1-5 scale)
- Freeform comments (athlete input)
- Individual question timestamps

**Sensitivity:** HIGH  
**Default Visibility:** Athlete ONLY  
**Consent Override:**
- Coach: **hidden by default**
- Athlete can opt-in to share aggregate wellness answers (not freeform comments)
- Staff (medical/S&C): hidden unless athlete opts in or safety trigger
- Safety trigger: if stress=5 for 3+ consecutive days → medical staff notified (see Section 4.4)

**Retention:** 12 months

---

### 1.7 Pain & Injury Flags

**Contents:**
- Pain score (0-10 scale)
- Pain location(s) (body map tags)
- Pain trend (new/same/worse/better)
- Injury report timestamp
- Linked to rehab protocol (boolean)
- Pain interference with training (yes/no)

**Sensitivity:** HIGH  
**Default Visibility:**
- Athlete: full access
- Coach: **flag only** (athlete has pain >0) by default
- Coach: detail **hidden** by default
- Physio/Medical Staff: **full access always** (role authority, non-negotiable)

**Consent Override:**
- Athlete cannot hide pain >3/10 from coach (safety trigger, see Section 4.1)
- Athlete cannot hide new pain area from medical staff (safety trigger, see Section 4.2)
- Athlete cannot hide worsening pain trend from medical staff (safety trigger, see Section 4.2)
- Coach sees minimum necessary: "Athlete has pain flag" + safety override details when triggered

**Retention:** 36 months (injury history, medical)

---

### 1.8 Rehab Protocol Content

**Contents:**
- Rehab program name
- Phase (e.g., acute, sub-acute, return-to-play)
- Protocol exercises (name, sets, reps, restrictions)
- Clinician notes (physio/doctor input)
- Clearance status (cleared/restricted/not cleared)
- Clearance date (when cleared)
- Medical provider name (if external)

**Sensitivity:** HIGH  
**Default Visibility:**
- Athlete: full access
- Physio/Medical Staff: full access (role authority)
- Coach: **rehab active status only** ("Athlete is in rehab protocol")
- Coach: **restrictions only** (e.g., "No overhead pressing, no running >5km")
- Coach: **clearance status only** (cleared/restricted/not cleared)
- Coach: **protocol content hidden** (exercise detail, clinician notes)

**Consent Override:**
- Athlete cannot hide active rehab status from coach (safety, compliance)
- Athlete cannot hide restrictions from coach (safety)
- Athlete can hide specific injury diagnosis from coach (medical privacy)
- S&C Staff: same visibility as coach unless athlete opts in for detail

**Retention:** 60 months (medical/legal)

---

### 1.9 Coach Notes & Coach Alerts

**Contents:**
- Coach freeform notes about athlete (coach-authored)
- Coach alert flags (coach sets reminder/flag on athlete)
- Note timestamp, author
- Acknowledgment log (if athlete views)

**Sensitivity:** MEDIUM  
**Default Visibility:**
- Coach (author): full access
- Athlete: **hidden by default**
- Other coaches (same team): visible if shared by author
- Admin: full access (audit)

**Consent Override:**
- Athlete can request to view coach notes about self (transparency opt-in)
- Coach cannot hide safety-related notes from admin/medical staff
- Coach cannot hide notes from other staff if athlete safety is involved

**Retention:** 24 months

---

### 1.10 Merlin Conversation Data

**Contents:**
- Message history (athlete ↔ Merlin)
- Conversation topics (detected by system)
- Safety trigger events (if Merlin detects distress, injury keywords)
- Timestamp, message author (athlete/Merlin)

**Sensitivity:** HIGH  
**Default Visibility:** Athlete ONLY  
**Consent Override:**
- Coach: **completely hidden** unless athlete explicitly opts in
- Medical Staff: hidden unless safety trigger (see Section 4.6)
- Admin: metadata only (conversation count, timestamps), not content
- Merlin **never** reveals athlete conversation content to coaches in Merlin's own responses

**Retention:** 12 months (conversation history for athlete continuity)

---

### 1.11 Audit Logs

**Contents:**
- View logs (who viewed what data, when)
- Consent change logs (what changed, who changed it, previous state, new state)
- Safety override logs (what trigger fired, what was disclosed, to whom)
- Acknowledgment logs (coach acknowledges alert, athlete acknowledges message)
- Data modification logs (who edited what, when, previous vs new value)

**Sensitivity:** LOW (system integrity)  
**Default Visibility:**
- Athlete: can view logs of who viewed their data
- Coach: cannot view audit logs of athlete's data access
- Admin: full access
- Support/Engineering (break-glass): full access with justification required

**Consent Override:** Athlete cannot delete or hide audit logs (non-repudiation)  
**Retention:** 7 years (compliance, legal)

---

## SECTION 2 — Roles & Visibility Tiers (Binding)

### 2.1 Role Definitions

#### Athlete
- Primary data owner
- Controls consent settings
- Receives all notifications about own data
- Can view own data access logs

#### Coach (Domestic)
- Assigned to athlete within club/domestic program
- Prescribes training plans
- Monitors compliance and safety signals
- **Does not** see detailed wellness or private content by default

#### Coach (National/International)
- Assigned to athlete for representative duties
- Needs to coordinate with domestic coach
- Sees team activity schedules and conflicts
- Same privacy constraints as domestic coach for individual athlete data

#### Physio / Medical Staff
- Licensed medical professional role
- Full access to pain, injury, rehab data (role authority)
- Can override athlete consent for medical necessity
- Bound by medical confidentiality

#### Strength & Conditioning (S&C) Staff
- Monitors load metrics and training execution
- Needs compliance visibility
- Does not see wellness detail by default
- Sees restrictions from rehab protocols

#### Team Admin / Club Admin
- Manages team roster, subscriptions, settings
- Can view aggregate team statistics
- Cannot view individual athlete wellness or medical data without role escalation
- Can access audit logs for system integrity

#### Support / Engineering (Break-Glass)
- Emergency access for system troubleshooting
- Must log justification for access
- Access logged and reviewed
- Cannot access data without incident ticket

#### Teammates (Peer Visibility)
- Other athletes on same team
- Minimal visibility by design
- Can see aggregate team stats (anonymized)
- **Cannot** see individual readiness, pain, wellness, or training logs

---

### 2.2 Visibility Matrix

| Data Category | Athlete | Coach | Physio | S&C | Admin | Teammates |
|--------------|---------|-------|--------|-----|-------|-----------|
| 1.1 Identity & Membership | Full | Full | Full | Full | Full | Name only |
| 1.2 Training Plan | Full | Full | Summary | Summary | Metadata | None |
| 1.3 Execution Logs | Full | Compliance¹ | Summary | Summary | Metadata | None |
| 1.4 Load Metrics | Full | Summary² | Full | Full | Metadata | None |
| 1.5 Wellness Summary | Full | Compliance³ | Full | Flags only | Metadata | None |
| 1.6 Wellness Detail | Full | **Opt-in only** | **Opt-in only** | **Opt-in only** | None | None |
| 1.7 Pain & Injury | Full | Flags⁴ | Full | Flags⁴ | None | None |
| 1.8 Rehab Protocol | Full | Restrictions⁵ | Full | Restrictions⁵ | None | None |
| 1.9 Coach Notes | **Opt-in only** | Full (own) | Full | Full | Full | None |
| 1.10 Merlin Conversations | Full | **Opt-in only** | **Safety trigger only** | None | Metadata | None |
| 1.11 Audit Logs | Own data | None | Own actions | Own actions | Full | None |

**Legend:**
1. **Compliance:** Completion status, numerical data (sets/reps/load/RPE), not freeform notes
2. **Summary:** Green/amber/red indicators during baseline; numerical after baseline complete
3. **Compliance:** Check-in done yes/no, days since last, safety flags (triggered yes/no), **not readinessScore**
4. **Flags:** Existence of pain/injury flag; detail hidden unless safety trigger or opt-in
5. **Restrictions:** Active rehab status, exercise restrictions, clearance status; **not** protocol detail or diagnosis

---

## SECTION 3 — Consent Defaults (Hard Rules)

### 3.1 New Athlete Account Defaults

When an athlete account is created, the following consent settings MUST be applied:

#### 3.1.1 Coach Visibility (Default)
- ✅ Coach sees: training plan, session completion status, sets/reps/load/RPE
- ✅ Coach sees: check-in completion status, days since last check-in
- ✅ Coach sees: safety flags when triggered (existence, not detail)
- ✅ Coach sees: rehab active status, restrictions, clearance status
- ❌ Coach **does not** see: readinessScore
- ❌ Coach **does not** see: individual wellness answers (sleep, stress, soreness, mood, energy)
- ❌ Coach **does not** see: wellness freeform comments
- ❌ Coach **does not** see: training log freeform notes
- ❌ Coach **does not** see: pain detail (unless safety trigger)
- ❌ Coach **does not** see: Merlin conversation content

#### 3.1.2 Medical Staff Visibility (Default)
- ✅ Physio sees: pain, injury flags, rehab protocols (role authority, always)
- ❌ Physio **does not** see: wellness detail unless athlete opts in or safety trigger
- ❌ Physio **does not** see: Merlin conversations unless safety trigger

#### 3.1.3 S&C Staff Visibility (Default)
- ✅ S&C sees: training plan summary, load metrics, rehab restrictions
- ❌ S&C **does not** see: wellness detail, pain detail, or medical notes

#### 3.1.4 Teammate Visibility (Default)
- ✅ Teammates see: athlete name (roster visibility)
- ❌ Teammates **do not** see: any personal training, wellness, pain, or performance data
- ❌ Teammates **do not** see: readiness scores or check-in status

#### 3.1.5 Admin Visibility (Default)
- ✅ Admin sees: metadata (account status, subscription, team membership)
- ❌ Admin **does not** see: individual athlete wellness, medical, or training detail

---

### 3.2 Compliance vs Content (Canonical Definitions)

#### Compliance Data (Always Visible to Coach)
- Check-in completed: yes/no
- Session logged: yes/no
- Days since last check-in (staleness counter)
- Days since last session log
- Completion streak count
- Safety flag triggered: yes/no (flag existence)
- Numerical execution: sets, reps, load, duration, RPE (numbers only)
- Rehab active: yes/no
- Restrictions: list of prohibited exercises/movements
- Clearance status: cleared/restricted/not cleared

**Rationale:** Coaches need to know if athlete is engaging with the program and if safety concerns exist. They do not need to know *why* athlete feels a certain way.

#### Content Data (Hidden by Default, Opt-in Required)
- ReadinessScore (0-100 derived value)
- Individual wellness answers (sleep, stress, soreness, mood, energy)
- Freeform comments (wellness, training logs)
- Pain score and location detail (unless safety trigger)
- Injury diagnosis or medical history
- Merlin conversation messages
- Clinician notes in rehab protocols
- Coach notes about athlete (unless athlete opts in to view)

**Rationale:** These are personal, subjective, or medically sensitive details that are not required for compliance monitoring.

---

### 3.3 Consent Setting Persistence
- Consent settings MUST persist across sessions
- Consent settings MUST survive app updates
- Consent changes take effect **immediately** (no delay)
- Previous consent state MUST be logged in audit trail before change

---

## SECTION 4 — Safety Overrides (Non-Negotiable)

Safety overrides are **automatic disclosures** that occur when athlete welfare is at risk. Athlete consent **does not prevent** these disclosures. However, disclosures MUST be:
- Minimum necessary for safety
- Logged in audit trail
- Accompanied by athlete-facing notice (factual, non-threatening)

---

### 4.1 Pain Score Safety Trigger

**Condition:** Pain score > 3/10 reported in wellness or injury check-in

**Disclosure:**
- **To Coach:** "Athlete has reported pain >3/10"
- **To Physio:** Full pain detail (score, location, trend, comments)
- **Not Disclosed:** Other wellness answers, unrelated medical history

**Athlete Notice:**
"Your coach has been notified that you reported pain above 3/10. This helps ensure you receive appropriate support. Your physio has full access to pain details."

**Logged:** Trigger event, disclosure recipients, timestamp

---

### 4.2 New or Worsening Pain Trigger

**Condition:** 
- Athlete reports pain in new body location (not reported in last 14 days)
- OR pain trend = "worse" compared to previous check-in

**Disclosure:**
- **To Coach:** "Athlete has reported new or worsening pain"
- **To Physio:** Full pain detail + trend history (last 30 days)
- **Not Disclosed:** Diagnosis speculation, unrelated wellness data

**Athlete Notice:**
"Your coach and physio have been notified about your new/worsening pain report. This is to ensure timely assessment and support."

**Logged:** Trigger event, disclosure recipients, timestamp

---

### 4.3 ACWR Danger Zone Trigger

**Condition:** 
- Acute:Chronic Workload Ratio > 1.5 (high spike risk)
- OR ACWR < 0.8 (detraining risk)
- AND baseline establishment complete (28+ days of data)

**Disclosure:**
- **To Coach:** "Athlete's training load ratio is outside safe range: [ACWR value]"
- **To S&C Staff:** Full load metrics (acute, chronic, ACWR, trend)
- **To Athlete:** Educational alert: "Your training load has spiked/dropped significantly. Your coach will help adjust your plan."
- **Not Disclosed:** Wellness data, pain data (unless separate trigger)

**Athlete Notice:**
"Your training load is outside the recommended range, which may increase injury risk. Your coach has been notified to help adjust your program."

**Logged:** Trigger event, ACWR value, disclosure recipients, timestamp

**Coach Action Required:** Coach MUST acknowledge alert within 48 hours

---

### 4.4 Sustained High Stress Trigger

**Condition:** 
- Stress level = 5/5 for 3 or more consecutive check-ins
- AND check-ins are within 7-day window

**Disclosure:**
- **To Physio/Medical Staff:** "Athlete has reported high stress (5/5) for [X] consecutive days. Wellness check recommended."
- **To Coach:** "Athlete wellness check recommended" (no stress detail disclosed to coach)
- **Not Disclosed:** Stress score to coach, other wellness answers

**Athlete Notice:**
"You've reported high stress for several days. A member of our support team may reach out to check in. Your specific answers remain private from your coach."

**Logged:** Trigger event, disclosure recipients, timestamp

**Staff Action:** Medical staff SHOULD contact athlete within 72 hours (not mandatory, clinical judgment)

---

### 4.5 Repeated High RPE Trigger

**Condition:** 
- RPE ≥ 9/10 for 3 or more consecutive logged sessions
- AND sessions are within 7-day window

**Disclosure:**
- **To Coach:** "Athlete has logged RPE ≥9 for [X] consecutive sessions. Program difficulty check recommended."
- **To S&C Staff:** RPE trend + load metrics
- **Not Disclosed:** Freeform training notes, wellness data

**Athlete Notice:**
"You've reported high effort (RPE 9+) for several sessions in a row. Your coach will check in to make sure your program is appropriate."

**Logged:** Trigger event, RPE values, disclosure recipients, timestamp

**Coach Action Required:** Coach SHOULD review program difficulty within 48 hours

---

### 4.6 Rehab Protocol Active + Restricted Action Attempt

**Condition:** 
- Athlete has active rehab protocol with restrictions
- AND athlete logs a session containing restricted exercise
- OR athlete attempts to modify program to include restricted exercise

**Disclosure:**
- **To Coach:** "Athlete attempted to log/plan restricted exercise: [exercise name]. Rehab restrictions apply."
- **To Physio:** Full event detail (what was attempted, when, current protocol status)
- **Not Disclosed:** Injury diagnosis, medical notes

**Athlete Notice (Blocking):**
"This exercise is currently restricted due to your active rehab protocol. Please consult your physio before attempting this movement."

**System Action:** 
- Exercise logging MUST be blocked (athlete cannot save restricted exercise)
- Athlete MUST be shown list of current restrictions

**Logged:** Trigger event, attempted exercise, disclosure recipients, timestamp

---

### 4.7 Merlin Safety Trigger

**Condition:** 
- Merlin detects keywords indicating: self-harm, severe distress, eating disorder language, abuse, emergency medical situation
- Detection via pattern matching (defined in Merlin Dialogue Authority Contract)

**Disclosure:**
- **To Medical Staff:** "Merlin has detected potential safety concern in athlete conversation. Immediate review recommended."
- **To Medical Staff:** Conversation snippet (relevant messages only, not full history)
- **To Coach:** "Athlete wellness check recommended" (no conversation detail)
- **Not Disclosed:** Full conversation history unless medical staff escalates

**Athlete Notice:**
"Your message suggests you might need support. A member of our care team will reach out shortly. If this is an emergency, please contact [emergency resources]."

**Staff Action Required:** Medical staff MUST review within 4 hours (urgent)

**Logged:** Trigger event, keyword(s) detected, disclosure recipients, timestamp

---

## SECTION 5 — Coach-to-Coach Visibility (Domestic vs National)

### 5.1 Scenario
An athlete plays for a domestic club and is selected for national team duty. Both coaches need to coordinate without duplicating load or missing safety signals.

---

### 5.2 Schedule & Activity Visibility

#### National Coach Can See (Always):
- Team activity blocks: "Domestic team has scheduled training [date/time]"
- Team activity type: "Domestic team has scheduled match [date/time]"
- Conflict indicators: "Athlete has national duty + domestic match on same weekend"

#### National Coach **Cannot** See (Unless Athlete Opts In):
- Individual training plan detail (exercise prescription)
- Athlete readiness scores
- Athlete wellness answers
- Athlete pain or injury flags (unless safety trigger + athlete opts in for cross-coach visibility)

**Rationale:** National coach needs to avoid scheduling conflicts and overtraining, but does not need full visibility into domestic program content.

---

### 5.3 Readiness & Load Visibility (Cross-Coach)

#### Default:
- Each coach sees **only** compliance data for sessions they prescribe
- Each coach sees safety flags (pain >3, ACWR danger) if athlete opts in for cross-coach visibility

#### Athlete Opt-In (Cross-Coach Sharing):
- Athlete can enable "Share readiness and load with all my coaches"
- When enabled:
  - Both coaches see readinessScore
  - Both coaches see ACWR and load metrics
  - Both coaches see safety flags
  - Both coaches see rehab restrictions
- When disabled (default):
  - Each coach sees only compliance for own prescribed sessions
  - Safety flags still shared if triggered (non-negotiable for athlete safety)

**Consent Setting Location:** Athlete profile → Privacy & Sharing → "Share readiness with all coaches"

---

### 5.4 Practice Schedule Coordination

#### National Coach Needs:
- "When is athlete available for national team camp?"
- "Does athlete have domestic commitments this weekend?"

#### Implementation Rule:
- National coach sees **team-level activity calendar** for athlete's domestic team:
  - Training session blocks (date/time/duration)
  - Match fixtures (date/time/location)
- National coach **does not** see:
  - Individual athlete attendance (whether athlete attended domestic session)
  - Individual athlete performance (how athlete performed in domestic match)
  - Individual athlete readiness before/after domestic activities

**Visibility:** Team calendar is **non-personal data** (team schedule is public within coaching staff)

---

### 5.5 Communication Between Coaches

#### Allowed:
- Coaches can message each other through system (if both assigned to same athlete)
- Coaches can flag scheduling conflicts: "National camp conflicts with your match on [date]"
- Coaches can share aggregate load data if athlete opts in

#### Forbidden:
- Coaches cannot share athlete wellness detail without athlete opt-in
- Coaches cannot share athlete pain/injury detail without athlete opt-in (unless safety trigger + medical involvement)
- Coaches cannot share athlete freeform comments or Merlin conversations

**Audit:** All coach-to-coach communication about shared athletes MUST be logged

---

## SECTION 6 — Teammate Visibility (Peer Model)

### 6.1 Default Peer Visibility
Teammates (athletes on same team) have **minimal visibility** by default.

#### Teammates Can See:
- Athlete name (roster)
- Athlete team role (if public: e.g., "Forward")
- Team-level aggregate statistics (see 6.2)

#### Teammates **Cannot** See:
- Individual readiness scores
- Individual wellness check-in status
- Individual pain or injury flags
- Individual training plan or execution logs
- Individual load metrics
- Individual rehab status
- Individual Merlin conversations
- Individual coach notes

**Rationale:** Training and wellness are personal. Peer visibility risks social comparison, pressure to hide injury, or privacy violations.

---

### 6.2 Team-Level Aggregates (Anonymized)

#### Allowed Team Stats (Visible to All Team Members):
- "% of team completed wellness check-in today: 85%"
- "Team average completion streak: 12 days"
- "% of team logged training this week: 90%"
- Team leaderboard: aggregate metrics (e.g., "Total team training hours this week: 240")

#### Calculation Rules:
- Aggregates MUST include **minimum 5 athletes** to prevent re-identification
- If team size < 5, no aggregates shown
- No ranking by individual name unless athlete explicitly opts in to leaderboard

**Consent Setting:** "Allow my data in team aggregate statistics" (default: **yes**, can opt out)

---

### 6.3 Athlete-Initiated Sharing (Peer to Peer)

#### Allowed:
- Athlete can choose to share own readiness, training log, or wellness data with specific teammate(s)
- Sharing MUST be explicit: "Share my readiness with [teammate name]"
- Sharing can be one-time or ongoing (athlete controls duration)

#### Forbidden:
- System cannot auto-share based on "team culture" or coach request
- Coach cannot enable peer visibility on behalf of athletes
- Teammates cannot request access to each other's data (must be athlete-initiated)

---

### 6.4 Hard Bans (Peer Context)

1. **MUST NOT** show individual readiness scores on team dashboard
2. **MUST NOT** show "who has pain" or "who is injured" lists
3. **MUST NOT** show "who skipped training" or "who missed check-in" lists
4. **MUST NOT** rank athletes by readiness, load, or wellness scores
5. **MUST NOT** allow teammates to view each other's Merlin conversations
6. **MUST NOT** create peer pressure mechanisms (e.g., "Your teammate has a 30-day streak, you only have 5")

---

## SECTION 7 — Merlin Privacy Rules

### 7.1 Merlin as Athlete-Private Assistant

**Principle:** Merlin conversations are **athlete-private by default**. Merlin acts as athlete's personal assistant and MUST NOT disclose athlete data to coaches or teammates without explicit athlete consent.

---

### 7.2 What Merlin Can Say to Athlete (About Self)

#### Allowed:
- Answer questions about athlete's own data:
  - "What's my readiness today?" → Merlin shows athlete's readinessScore
  - "How's my load looking?" → Merlin shows athlete's ACWR, acute/chronic load
  - "What did my coach say about yesterday?" → Merlin shows coach notes if athlete has opted in to view them
  - "Show me my pain trend" → Merlin shows athlete's pain history
- Provide educational context:
  - "Your ACWR is 1.3, which means your recent training load is 30% higher than your average. This is manageable but approaching the caution zone."
- Offer suggestions based on athlete's data:
  - "You've reported high stress for 3 days. Would you like tips for managing stress, or should I suggest your coach adjust your program?"

#### Forbidden:
- Merlin **MUST NOT** compare athlete to teammates:
  - ❌ "You're ranked 3rd on the team for readiness"
  - ❌ "Most of your teammates completed check-ins, you're behind"
- Merlin **MUST NOT** reveal coach's private notes unless athlete has opted in
- Merlin **MUST NOT** make medical diagnoses or override physio advice

---

### 7.3 What Merlin Can Say to Coaches (About Athlete)

#### Allowed (Compliance Context Only):
- "Athlete completed wellness check-in today" (if coach asks about compliance)
- "Athlete has logged 4/5 sessions this week" (compliance summary)
- "Athlete has a safety flag active" (if safety trigger fired)

#### Forbidden (No Content Disclosure):
- ❌ "Athlete's readiness is 45/100" (unless athlete opted in to share readiness with coach)
- ❌ "Athlete said they're stressed about exams" (conversation content)
- ❌ "Athlete reported 7 hours of sleep" (wellness detail)
- ❌ "Athlete asked me about injury prevention" (conversation topic)
- ❌ "Athlete has pain in left knee" (unless safety trigger + minimum necessary disclosure)

**Enforcement:** If coach asks Merlin for athlete content data, Merlin MUST respond:

**Refusal Template:**
> "I can't share [athlete name]'s personal wellness details. You can see their compliance status in the coach dashboard. If you have specific concerns about their safety, please reach out to them directly or consult medical staff."

---

### 7.4 What Merlin Can Say in Group/Team Contexts

#### Scenario: Coach asks Merlin in team chat, "How is the team's readiness today?"

#### Allowed:
- Aggregate statistics (if ≥5 athletes):
  - "85% of the team completed wellness check-ins today."
  - "Team average readiness: 72/100" (if all athletes have opted in to team aggregates)
- Compliance summaries:
  - "12/15 athletes logged training this week"

#### Forbidden:
- ❌ "Sarah has the lowest readiness at 40/100"
- ❌ "Three athletes have pain flags: Sarah, John, Emma"
- ❌ "Most athletes reported low sleep last night"

**Enforcement:** Merlin MUST anonymize and aggregate. If aggregation not possible (team too small), Merlin MUST refuse:

**Refusal Template:**
> "I can't provide team-level readiness data because it could reveal individual athletes' private information. Please check the coach dashboard for aggregate compliance metrics."

---

### 7.5 Explicit Refusal Templates for Teammate Data Requests

#### Scenario: Athlete asks Merlin, "How's Sarah's readiness today?"

**Merlin Response:**
> "I can't share Sarah's personal data. If you'd like to check in with her, you can message her directly through the team chat."

---

#### Scenario: Athlete asks Merlin, "Who on the team is injured?"

**Merlin Response:**
> "I can't share injury or pain information about your teammates. If you're concerned about someone, please reach out to them or speak with your coach."

---

#### Scenario: Coach asks Merlin, "Show me everyone who skipped training this week"

**Merlin Response:**
> "I can show you team compliance statistics in the coach dashboard. For individual athlete follow-up, please contact athletes directly or check the compliance report."

---

### 7.6 Safety Trigger Exception (Merlin to Staff)

#### Condition: Merlin detects safety keywords (see Section 4.7)

**Allowed:**
- Merlin flags conversation to medical staff (automated)
- Merlin provides relevant message snippet (not full history)
- Merlin logs safety trigger event

**Athlete Notice (Immediate):**
> "Your message suggests you might need support. A member of our care team will reach out shortly. If this is an emergency, please contact [emergency number]."

**Staff Action:** Medical staff reviews within 4 hours

---

## SECTION 8 — Consent Changes & Audit

### 8.1 How Consent Changes Work

#### Athlete-Initiated Changes
- Athlete accesses: Profile → Privacy & Sharing
- Athlete toggles setting (e.g., "Share readiness with coach": off → on)
- System prompts confirmation:
  - "You are about to share your readiness score with your coach. They will see your current score and future scores. Past scores will also become visible. Do you want to continue?"
- Athlete confirms
- Change takes effect **immediately**

#### Effect Timing:
- **Immediate:** New visibility applies instantly
- **Retroactive:** Historical data becomes visible/hidden based on new setting
  - Exception: Audit logs and safety trigger events cannot be retroactively hidden
- **Persistent:** Setting persists until athlete changes it again

---

### 8.2 What Cannot Be Retroactively Hidden

#### Non-Revocable Data (Audit Integrity):
1. **Safety Trigger Events:** Once a safety trigger fires and discloses data, athlete cannot undo that disclosure
   - Rationale: Staff took action based on that information; hiding it would create inconsistency
2. **Coach Acknowledgments:** If coach acknowledged an alert, that acknowledgment remains logged
3. **Audit Logs:** All view logs, consent change logs, data access logs remain permanently
4. **Completed Rehab Protocols:** If athlete was cleared from rehab, that clearance record remains (medical history)
5. **Historical Coach Notes:** If coach wrote notes when they had visibility, those notes remain (coach-authored, not athlete-owned)

#### Revocable Data (Athlete Can Hide):
- Future readiness scores (if athlete disables sharing)
- Future wellness answers (if athlete disables sharing)
- Future training log notes (if athlete disables sharing)
- Historical wellness detail (if athlete disables sharing and coach didn't previously view it)

---

### 8.3 What Must Be Logged (Audit Trail)

#### Required Audit Log Fields:
1. **Consent Change Event:**
   - Timestamp (ISO 8601)
   - Athlete ID
   - Setting changed (e.g., "share_readiness_with_coach")
   - Previous state (true/false)
   - New state (true/false)
   - Initiated by (athlete / admin / system)
   - Reason (if admin-initiated, must provide justification)

2. **Data Access Event:**
   - Timestamp
   - Accessor ID (who viewed data)
   - Accessor role (coach / physio / admin / etc.)
   - Data category accessed (e.g., "wellness_detail")
   - Athlete ID (whose data was viewed)
   - Access method (dashboard / Merlin query / API call)

3. **Safety Override Event:**
   - Timestamp
   - Trigger type (e.g., "pain_score_above_3")
   - Athlete ID
   - Data disclosed (minimum necessary detail)
   - Disclosure recipients (roles + IDs)
   - Athlete notified (yes/no, timestamp)

4. **Coach Acknowledgment Event:**
   - Timestamp
   - Coach ID
   - Alert type (e.g., "high_ACWR")
   - Athlete ID
   - Acknowledgment action (e.g., "reviewed", "plan_adjusted")

---

### 8.4 Athlete Visibility of Audit Logs

#### Athlete Can View:
- Who viewed their data (role + timestamp, not individual name unless athlete opts in)
  - "A coach viewed your readiness score on 2026-01-05 at 14:32"
- When consent settings were changed
  - "You changed 'share readiness with coach' from OFF to ON on 2026-01-03 at 09:15"
- When safety triggers fired
  - "Safety alert sent to coach on 2026-01-04 due to pain score >3"

#### Athlete **Cannot** View:
- What coaches wrote in notes about them (unless athlete opts in separately)
- Admin access logs (system integrity reasons)
- Other athletes' audit logs

**Access Method:** Profile → Privacy & Data → View Access Log

---

## SECTION 9 — Forbidden Patterns (Hard Bans)

The following behaviors are **absolutely forbidden** and MUST be prevented by system design:

---

### 9.1 Showing Detailed Wellness Answers to Coaches by Default
**Banned:** Coach sees individual wellness answers (sleep, stress, soreness, mood, energy) without athlete opt-in.

**Enforcement:** Backend MUST NOT return wellness detail to coach role unless `athlete_consent_wellness_detail = true`.

**Violation Detection:** If coach dashboard displays wellness detail for athlete who has not opted in, this is a **critical privacy bug**.

---

### 9.2 Allowing Athlete to Hide Safety Triggers from Medical Staff
**Banned:** Athlete consent settings cannot block physio/medical staff from viewing pain, injury, or rehab data.

**Enforcement:** Medical role MUST have **role authority** that overrides athlete consent for medical data categories (1.7, 1.8).

**Violation Detection:** If medical staff cannot access pain/injury data due to athlete privacy setting, this is a **critical safety bug**.

---

### 9.3 Sharing Rehab Protocol Details to Non-Medical Staff
**Banned:** Coach, S&C staff, admin, or teammates see rehab protocol exercises, clinician notes, or diagnosis.

**Enforcement:** Backend MUST filter rehab data for non-medical roles: only return `rehab_active`, `restrictions`, `clearance_status`.

**Violation Detection:** If coach sees "ACL reconstruction phase 2" or clinician notes, this is a **critical privacy bug**.

---

### 9.4 Sharing Merlin Chat Content to Coaches Without Explicit Athlete Opt-In
**Banned:** Coach sees Merlin conversation messages, topics, or content unless athlete explicitly enables "Share Merlin conversations with coach."

**Enforcement:** Backend MUST NOT return Merlin conversation data to coach role unless `athlete_consent_merlin_sharing = true`.

**Exception:** Safety trigger (Section 4.7) discloses **snippet only** to medical staff, not coach.

**Violation Detection:** If coach asks Merlin "What has Sarah been talking about?" and Merlin answers with conversation content, this is a **critical privacy bug**.

---

### 9.5 Showing Teammate Readiness or Pain Status
**Banned:** Athlete sees another athlete's readiness score, pain flag, or injury status.

**Enforcement:** Backend MUST enforce data isolation: athlete role can only query own data, not peers' data.

**Violation Detection:** If teammate list shows readiness scores or injury icons, this is a **critical privacy bug**.

---

### 9.6 "Dark Pattern" Consent Prompts
**Banned:** 
- Default-opt-in prompts: "Share your data with coach [YES] [no]" (capitalized yes, lowercase no)
- Shame-based prompts: "Don't you want your coach to help you? Share your data."
- Repeated nagging: Asking athlete to share data on every login
- Hiding opt-out: Burying "Don't share" option in submenus
- Confusing language: "Allow coach access to wellness support features" (euphemism for data sharing)

**Enforcement:** 
- Consent prompts MUST be neutral tone
- Consent prompts MUST present options equally (same font size, color, prominence)
- Consent prompts MUST use clear language: "Share readiness score with coach" not "Enable support features"
- Consent prompts MUST appear **once** at setup, not repeatedly

**Violation Detection:** UX audit of consent flows required before launch.

---

### 9.7 Athlete Hiding Active Rehab Status from Coach
**Banned:** Athlete cannot hide `rehab_active = true` from coach.

**Enforcement:** Backend MUST always return `rehab_active` and `restrictions` to coach, regardless of athlete consent settings.

**Rationale:** Coach needs to know athlete is restricted to avoid assigning contraindicated exercises.

**Violation Detection:** If athlete in rehab can hide this from coach, this is a **critical safety bug**.

---

### 9.8 Coach Viewing Athlete Data Without Assigned Relationship
**Banned:** Coach who is not assigned to athlete cannot view that athlete's data (even compliance data).

**Enforcement:** Backend MUST validate coach-athlete relationship before returning any data. Query: `SELECT * FROM coach_assignments WHERE coach_id = ? AND athlete_id = ?`. If no row, return 403 Forbidden.

**Exception:** Team admin can view aggregate data (not individual athlete detail).

**Violation Detection:** If coach accesses unassigned athlete's data, audit log MUST flag as unauthorized access attempt.

---

### 9.9 Admin Viewing Individual Athlete Wellness Without Justification
**Banned:** Team admin or club admin cannot view individual athlete wellness, medical, or training detail without logged justification.

**Enforcement:** If admin role requests athlete detail (not aggregate), system MUST prompt: "Reason for access: [text field]". Access + reason logged in audit trail.

**Violation Detection:** If admin accesses athlete detail without logged reason, audit review MUST flag for investigation.

---

### 9.10 Modifying Audit Logs
**Banned:** Any role (athlete, coach, admin, support) cannot edit or delete audit log entries.

**Enforcement:** Audit log table MUST have `INSERT` privilege only (no `UPDATE` or `DELETE`). Database-level constraint.

**Violation Detection:** If audit log row modified or deleted, this is a **critical security breach** requiring incident response.

---

### 9.11 Merlin Revealing Cross-Athlete Comparisons
**Banned:** Merlin cannot answer questions like:
- "How does my readiness compare to the team?"
- "Am I the only one who's tired?"
- "Who else has pain today?"
- "Rank the team by readiness"

**Enforcement:** Merlin dialogue logic MUST detect comparison queries and refuse with template (Section 7.5).

**Violation Detection:** If Merlin reveals individual teammate data in response to athlete query, this is a **critical privacy bug**.

---

### 9.12 Displaying Athlete Data in URLs or Logs
**Banned:** 
- URLs MUST NOT contain athlete wellness data: ❌ `/coach/dashboard?athlete_id=123&readiness=45`
- API response logs MUST NOT log sensitive data (pain scores, wellness answers, Merlin messages)
- Browser console MUST NOT display athlete data in plaintext

**Enforcement:** 
- Use POST requests with encrypted payloads for sensitive data
- Server logs MUST redact sensitive fields (log `[REDACTED]` instead of actual value)
- Frontend MUST NOT console.log wellness or medical data

**Violation Detection:** Code review + penetration testing required.

---

## SECTION 10 — Concrete Examples (Scenarios)

### 10.1 Example 1: New Athlete, Default Settings

**Athlete:** Emma (domestic club athlete)  
**Coach:** John (domestic club coach)  
**Consent State:** All defaults (new account)

#### Emma Completes Wellness Check-in:
- Sleep: 6 hours (3/5)
- Stress: 4/5 (high)
- Soreness: 2/5 (low)
- Mood: 3/5 (neutral)
- Energy: 3/5 (neutral)
- Pain: 0/10
- ReadinessScore: 58/100 (calculated)

#### What Coach John Sees:
- ✅ "Emma completed wellness check-in today" (compliance)
- ✅ Days since last check-in: 0
- ❌ ReadinessScore: **hidden**
- ❌ Sleep hours: **hidden**
- ❌ Stress level: **hidden**
- ❌ Other wellness answers: **hidden**

#### What Emma Sees:
- Full wellness detail
- ReadinessScore: 58/100 with explanation: "Your readiness is moderate. High stress and low sleep are impacting your score."

#### Rationale:
Emma's coach knows she's engaging (completed check-in) but doesn't see private content. Emma retains privacy.

---

### 10.2 Example 2: Athlete Opts In to Share Readiness

**Athlete:** Emma  
**Action:** Emma enables "Share readiness with coach"

#### What Changes:
- ✅ Coach John now sees: ReadinessScore: 58/100
- ❌ Coach John still **does not** see individual wellness answers (sleep, stress, etc.)
- ✅ Coach John sees readiness trend graph (last 14 days)

#### What Stays Same:
- Emma still sees full detail
- Wellness answers remain private unless Emma opts in separately

#### Rationale:
Emma gives coach insight into her overall state (readiness score) without revealing subjective details like stress or sleep hours.

---

### 10.3 Example 3: Safety Trigger (Pain > 3)

**Athlete:** Emma  
**Action:** Emma completes wellness check-in:
- Pain: 7/10
- Location: Right knee
- Trend: New (not reported before)
- Comments: "Sharp pain when landing from jumps"

#### Safety Trigger Fires (Section 4.1 + 4.2):

#### What Coach John Sees:
- 🚨 Alert: "Emma has reported pain >3/10 (knee). Please follow up."
- Pain score: 7/10
- Location: Right knee
- Trend: New
- **Does not see:** Emma's comment text, other wellness answers

#### What Physio Sarah Sees:
- Full pain detail:
  - Pain score: 7/10
  - Location: Right knee
  - Trend: New
  - Comments: "Sharp pain when landing from jumps"
  - Wellness context: Stress 4/5, Sleep 6 hours (if relevant for assessment)

#### What Emma Sees:
- Notification: "Your coach and physio have been notified about your pain report. This helps ensure you receive appropriate support."
- Emma can view audit log: "Coach John viewed pain alert on 2026-01-06 at 10:15"

#### Rationale:
Safety override ensures Emma gets help. Coach sees minimum necessary (pain exists, severity, location). Physio sees full detail for clinical assessment.

---

### 10.4 Example 4: Athlete in Rehab Protocol

**Athlete:** Emma  
**Physio:** Sarah assigns rehab protocol:
- Diagnosis: Patellar tendinopathy (private)
- Phase: Sub-acute strengthening
- Restrictions: No jumping, no running >5km, no heavy squats
- Exercises: Isometric holds, eccentric leg curls (3x10), etc.
- Clearance: Restricted

#### What Coach John Sees:
- ✅ "Emma is in active rehab protocol"
- ✅ Restrictions:
  - No jumping
  - No running >5km
  - No heavy squats
- ✅ Clearance status: Restricted
- ❌ Diagnosis: **hidden** ("patellar tendinopathy")
- ❌ Rehab exercises: **hidden**
- ❌ Physio notes: **hidden**

#### What Emma Sees:
- Full rehab protocol
- Exercises with instructions
- Clearance status
- Messages from physio

#### What Physio Sarah Sees:
- Full protocol
- Emma's compliance with rehab exercises
- Pain reports related to rehab

#### Rationale:
Coach knows Emma is restricted (safety, compliance) but doesn't see medical diagnosis or treatment detail (privacy).

---

### 10.5 Example 5: National Coach + Domestic Coach Coordination

**Athlete:** Emma (plays domestic club + selected for national team)  
**Domestic Coach:** John  
**National Coach:** Lisa

#### Default State:
- John sees Emma's domestic program compliance
- Lisa sees Emma's national program compliance
- Neither sees each other's prescribed sessions by default

#### Emma Opts In: "Share readiness with all coaches"

#### What Changes:
- ✅ John sees Emma's readinessScore (58/100)
- ✅ Lisa sees Emma's readinessScore (58/100)
- ✅ John sees Emma's ACWR: 1.2 (including national team load)
- ✅ Lisa sees Emma's ACWR: 1.2 (including domestic club load)
- ✅ Both coaches see safety flags (pain, high RPE, etc.)

#### Schedule Visibility:
- Lisa (national coach) sees: "Emma's domestic team has training Wed 6pm, match Sat 3pm"
- Lisa **does not** see: Emma's attendance, performance, or individual training logs from domestic sessions

#### Communication:
- Lisa messages John: "National camp is Fri-Sun. Can Emma skip your Saturday match?"
- John replies: "Emma has rehab restrictions (no jumping). Can national camp accommodate?"
- Both coaches coordinate without seeing Emma's medical diagnosis

#### Rationale:
Cross-coach visibility prevents overtraining and conflicts. Emma controls whether coaches see readiness/load. Schedule visibility is team-level (not personal data).

---

### 10.6 Example 6: Teammate Tries to View Peer Data

**Athlete:** Sarah (teammate of Emma)  
**Action:** Sarah asks Merlin: "How's Emma's readiness today?"

#### Merlin Response:
> "I can't share Emma's personal data. If you'd like to check in with her, you can message her directly through the team chat."

#### What Sarah Sees in UI:
- Team roster: Emma (name visible)
- Team aggregate: "85% of team completed check-ins today"
- **Does not see:** Emma's individual readiness, wellness, pain, or training data

#### What Emma Can Do:
- Emma can choose to message Sarah: "Hey, I'm feeling good today!" (self-disclosure)
- Emma can enable: "Share my readiness with Sarah" (explicit peer sharing)
- Once enabled, Sarah sees Emma's readiness (not wellness detail)

#### Rationale:
Teammates don't see each other's private data by default. Social sharing is athlete-initiated, not system-exposed.

---

## SECTION 11 — Enforcement & Compliance

### 11.1 Backend Validation
- All data access requests MUST pass through authorization layer
- Authorization MUST check:
  1. Requester role
  2. Requester-athlete relationship (coach assignment, team membership)
  3. Athlete consent settings for requested data category
  4. Safety override conditions (if applicable)
- If any check fails, return `403 Forbidden` (do not return data)

### 11.2 Frontend Enforcement
- UI MUST NOT display data fields that backend did not authorize
- UI MUST NOT rely on client-side consent checks (backend is source of truth)
- UI MUST display consent state to athlete: "Your coach can see [X], cannot see [Y]"

### 11.3 Audit & Review
- Monthly audit log review: Admin MUST review data access patterns for anomalies
- Quarterly consent review: Check % athletes who have modified defaults (detect dark patterns)
- Annual privacy audit: External review of consent flows, data access, and safety overrides

### 11.4 Incident Response
If privacy violation occurs (e.g., coach sees data they shouldn't):
1. Immediately revoke access
2. Log incident in audit trail
3. Notify affected athlete(s) within 24 hours
4. Investigate root cause (code bug, config error, malicious access)
5. Remediate and deploy fix
6. Report to privacy officer / legal if required

---

## SECTION 12 — Consent Setting UI Requirements

### 12.1 Consent Settings Location
**Path:** Athlete Profile → Privacy & Sharing

### 12.2 Required Settings (Minimum)
1. **Share readiness score with coach** (toggle: on/off, default: **off**)
2. **Share wellness answers with coach** (toggle: on/off, default: **off**)
3. **Share training log notes with coach** (toggle: on/off, default: **off**)
4. **Share readiness with all my coaches** (toggle: on/off, default: **off**, only visible if athlete has >1 coach)
5. **Allow my data in team aggregate statistics** (toggle: on/off, default: **on**)
6. **Share Merlin conversations with coach** (toggle: on/off, default: **off**)

### 12.3 Each Setting MUST Display:
- Clear label (what data is shared)
- Current state (on/off)
- Who will see it ("Your coach will see...")
- What they will NOT see ("Your coach will NOT see individual wellness answers")
- Safety override notice (if applicable): "Your coach will always be notified if you report pain >3/10, regardless of this setting."

### 12.4 Confirmation Prompt (When Enabling Sharing)
**Example:**
> **Share readiness score with coach?**
>
> If you enable this, your coach will see:
> - Your readiness score (0-100)
> - Your readiness trend (last 14 days)
>
> Your coach will NOT see:
> - Individual wellness answers (sleep, stress, mood, etc.)
> - Your freeform comments
>
> You can change this anytime in Privacy & Sharing settings.
>
> [Cancel] [Confirm]

### 12.5 Safety Override Notice (Always Visible)
At top of Privacy & Sharing settings:
> ℹ️ **Safety First:** Your coach and medical staff will always be notified if you report pain above 3/10, high training load risk, or other safety concerns, regardless of your privacy settings. This helps keep you safe.

---

## SECTION 13 — Open Questions & Future Iterations

### 13.1 Resolved in This Contract
- What coach sees by default (compliance only)
- What triggers safety overrides (pain >3, ACWR >1.5, etc.)
- What Merlin can/cannot say about teammates
- How consent changes work (immediate, logged)

### 13.2 Deferred to Future Contracts
- **Retention after account deletion:** How long does data persist after athlete deletes account? (Legal/GDPR requirement, needs legal review)
- **Parental consent (under-18 athletes):** Do parents/guardians have override authority? (Age-dependent, jurisdiction-specific)
- **Cross-organization visibility:** If athlete transfers teams, what data follows? (Transfer protocol needed)
- **Third-party integrations:** If athlete connects Strava/Whoop/etc., how does consent apply? (Integration security model needed)
- **Anonymized research use:** Can aggregate data be used for research? (Research ethics board review needed)

---

## SECTION 14 — Version History

| Version | Date       | Changes | Author |
|---------|------------|---------|--------|
| 1.0     | 2026-01-06 | Initial contract | System Architect |

---

## SECTION 15 — Signatures & Acceptance

This contract is **binding** upon:
- Backend engineering (data access control implementation)
- Frontend engineering (UI consent flows, data display)
- Product design (consent UX, coach dashboards)
- Merlin AI system (dialogue privacy rules)
- Medical/coaching staff (visibility boundaries)

**Acceptance Criteria:**
- All backend endpoints MUST enforce consent rules defined in Section 2.2 (Visibility Matrix)
- All frontend views MUST comply with visibility rules
- All consent setting changes MUST be logged per Section 8.3
- All safety overrides MUST follow Section 4 rules
- All forbidden patterns (Section 9) MUST be prevented

**Non-Compliance:**
- Any violation of this contract is a **critical bug** requiring immediate remediation
- Privacy violations MUST be reported to incident response team within 1 hour of discovery

---

**END OF CONTRACT**

---

## Appendix A — Quick Reference: "Can I See This?"

| Data | Athlete | Coach (Default) | Coach (Opt-In) | Physio | Teammates |
|------|---------|-----------------|----------------|--------|-----------|
| Readiness Score | ✅ | ❌ | ✅ | ❌ (unless opt-in or safety) | ❌ |
| Wellness Answers | ✅ | ❌ | ✅ (if athlete enables) | ❌ (unless opt-in or safety) | ❌ |
| Check-in Done (Yes/No) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pain Detail | ✅ | ❌ (flag only) | Pain >3 (safety override) | ✅ (always) | ❌ |
| Training Log Notes | ✅ | ❌ | ✅ (if athlete enables) | ❌ | ❌ |
| Sets/Reps/RPE | ✅ | ✅ | ✅ | ✅ | ❌ |
| ACWR | ✅ | Summary (baseline) / Full (post-baseline) | ✅ | ✅ | ❌ |
| Rehab Diagnosis | ✅ | ❌ | ❌ | ✅ (always) | ❌ |
| Rehab Restrictions | ✅ | ✅ (always) | ✅ | ✅ (always) | ❌ |
| Merlin Chat | ✅ | ❌ | ✅ (if athlete enables) | ❌ (unless safety trigger) | ❌ |
| Coach Notes | ❌ (unless opt-in) | ✅ (own notes) | ✅ | ✅ | ❌ |

---

## Appendix B — Consent Settings Cheat Sheet (For Athletes)

**Default (New Account):**
- ✅ Coach sees if you completed check-ins/sessions
- ✅ Coach sees your training numbers (sets/reps/RPE)
- ✅ Coach sees if you have a safety flag (pain, high load)
- ❌ Coach does NOT see your readiness score
- ❌ Coach does NOT see your wellness answers (sleep, stress, etc.)
- ❌ Coach does NOT see your freeform comments
- ❌ Coach does NOT see your Merlin chats

**To Give Coach More Insight:**
- Turn ON: "Share readiness score with coach"
- Turn ON: "Share wellness answers with coach" (if you want coach to see sleep, stress, etc.)
- Turn ON: "Share training log notes with coach" (if you want coach to see your comments)

**Safety Overrides (Always On):**
- If you report pain >3/10 → Coach + physio notified (helps keep you safe)
- If your training load spikes dangerously → Coach notified (prevents injury)
- If you're in rehab → Coach knows restrictions (prevents unsafe exercises)

---

**END OF DOCUMENT**

