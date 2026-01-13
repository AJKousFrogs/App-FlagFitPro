# TODAY State → Behavior Resolution Contract — v1

**Contract Version:** 1.0  
**Date:** January 6, 2026  
**Status:** Normative (Binding)  
**Scope:** TODAY screen state resolution logic (all platforms)  
**Supersedes:** None  
**Depends On:** TODAY Screen UX Authority Contract v1, Backend Truthfulness Contract

---

## Preamble

This contract defines the **deterministic mapping** from system state to TODAY screen behavior.

- **No interpretation is permitted.** Given identical inputs, all implementations MUST produce identical outputs.
- **No conditional logic is permitted.** Each state combination has exactly one resolution path.
- **No fallbacks are permitted.** Undefined state combinations are system errors, not runtime decisions.

---

## SECTION 1 — Resolution Priority Stack (Hard Rules)

### Absolute Priority Order (1–9)

#### 1. Session Resolution Failure
- **Input:** `sessionResolution.success === false`
- **Why:** Cannot show training if backend cannot resolve session. System integrity failure.

#### 2. No Active Program
- **Input:** `confidenceMetadata.hasActiveProgram === false`
- **Why:** Training surface requires program. Blocker B enforcement.

#### 3. Injury Protocol Active
- **Input:** `confidenceMetadata.injuryProtocolActive === true`
- **Why:** Medical safety overrides all training decisions. Non-negotiable.

#### 4. Coach Alert Active
- **Input:** `coachAlertActive === true`
- **Why:** Coach has real-time information system cannot anticipate. Human authority.

#### 5. Weather Override
- **Input:** `sessionResolution.override === "weather_override"`
- **Why:** Environmental safety. Prevents injury from unsafe conditions.

#### 6. Flag Football Practice
- **Input:** `sessionResolution.override === "flag_practice"`
- **Why:** Team commitment is non-negotiable. Training adjusts to practice schedule.

#### 7. Film Room / Team Activity
- **Input:** `sessionResolution.override === "film_room"`
- **Why:** Coach-scheduled team event. Training adjusts to team calendar.

#### 8. Taper Period
- **Input:** `sessionResolution.override === "taper"`
- **Why:** Competition prep protocol. Overrides normal volume progression.

#### 9. Wellness State + ACWR Confidence
- **Input:** `confidenceMetadata.readiness.confidence`, `confidenceMetadata.acwr.confidence`
- **Why:** Personalization layer. Adjusts intensity within session, doesn't replace it.

### Why This Order Cannot Change

This priority order reflects increasing specificity from **system integrity → medical safety → coaching authority → operational context → personalization**. Higher priorities are binary gates (system can/cannot function); lower priorities are intensity modifiers (how to execute). Inverting the order would allow personalization to override safety, or operations to override coaching—both unacceptable.

---

## SECTION 2 — Resolution Matrix (Core)

### Canonical Scenarios (12 Required States)

#### Scenario 1: Missing Readiness + Baseline ACWR + Normal Day

**Inputs:**
- `readinessScore: null`
- `confidenceMetadata.readiness.confidence: "none"`
- `confidenceMetadata.acwr.confidence: "building_baseline"`
- `sessionResolution.success: true`
- `sessionResolution.override: null`
- `confidenceMetadata.hasActiveProgram: true`

**Resolution:**
- **Training Allowed:** ✅ Yes
- **Main Session Source:** Program template
- **Blocks Shown:** Morning mobility, foam roll, warm-up, main session, cool-down, recovery
- **Banner Type:** Info (blue)
- **Banner Text:** "Check-in not logged yet. Your plan uses program defaults until you update."
- **Primary CTA:** "2-min Check-in"
- **Secondary CTA:** "Start Training Anyway"
- **Merlin Posture:** Explanatory (available if athlete asks about readiness/ACWR)

**Forbidden Actions:**
- Blocking training access
- Showing fake readiness value
- Hiding ACWR baseline progress
- Suggesting alternative workouts
- Intensity modifications beyond program defaults

---

#### Scenario 2: Stale Readiness + Practice Day

**Inputs:**
- `readinessScore: 78` (timestamp: 36 hours ago)
- `confidenceMetadata.readiness.confidence: "stale"`
- `sessionResolution.success: true`
- `sessionResolution.override: "flag_practice"`
- `confidenceMetadata.hasActiveProgram: true`

**Resolution:**
- **Training Allowed:** ✅ Yes (modified)
- **Main Session Source:** Practice preparation protocol (practice override wins)
- **Blocks Shown:** Morning mobility, foam roll, pre-practice activation, flag practice (external), post-practice recovery
- **Banner Type:** Two banners (warning + info):
  - Warning: "Last check-in was 1.5 days ago. Update recommended."
  - Info: "🏈 Flag Practice Today — 18:00. Training adjusted."
- **Primary CTA:** "Update Check-in"
- **Secondary CTA:** "View Practice Details"
- **Merlin Posture:** Explanatory (can explain practice adjustments, encourage check-in)

**Forbidden Actions:**
- Showing normal main session
- Hiding practice time/location
- Suggesting "skip practice to train"
- Using stale readiness to calculate practice load
- Allowing heavy volume before practice

---

#### Scenario 3: Rehab Protocol + Team Practice (Conflict)

**Inputs:**
- `confidenceMetadata.injuryProtocolActive: true`
- `sessionResolution.success: true`
- `sessionResolution.override: "rehab_protocol"` (higher priority than "flag_practice")
- `teamPracticeScheduled: true` (contextual, not override)

**Resolution:**
- **Training Allowed:** ✅ Yes (restricted)
- **Main Session Source:** Return-to-play protocol (rehab wins conflict)
- **Blocks Shown:** Morning mobility, rehab exercises (phase-based), recovery
- **Banner Type:** Alert (amber)
- **Banner Text:** "🏥 Return-to-Play Protocol Active. Team practice today, but you're following rehab plan. Pain > 3/10? Stop immediately."
- **Primary CTA:** "View Rehab Phase Details"
- **Secondary CTA:** "Contact Physio"
- **Merlin Posture:** Refusal (must refuse practice participation requests)

**Forbidden Actions:**
- Showing team practice exercises
- Suggesting "light participation" in practice
- Allowing athlete to override rehab protocol
- Hiding practice from schedule (athlete should see context)
- Providing return timeline estimates (physio's domain)

---

#### Scenario 4: Weather Override + No Wellness

**Inputs:**
- `readinessScore: null`
- `sessionResolution.override: "weather_override"`
- `coachModifiedSession: true`
- `weatherCondition: "rain"` (contextual)

**Resolution:**
- **Training Allowed:** ✅ Yes (modified)
- **Main Session Source:** Coach-provided modified session OR film room default
- **Blocks Shown:** Morning mobility, film room session OR coach-modified indoor work, recovery
- **Banner Type:** Alert (amber)
- **Banner Text:** "🌧️ Weather Alert: Practice moved indoors. Updated plan from Coach [Name] at [Time]."
- **Primary CTA:** "View Coach Note"
- **Secondary CTA:** "2-min Check-in" (wellness still valuable)
- **Merlin Posture:** Explanatory (can explain weather modification, cannot suggest outdoor alternatives)

**Forbidden Actions:**
- Auto-generating replacement workout (wait for coach)
- Suggesting outdoor training anyway
- Hiding original plan
- Removing weather override after viewed
- Assuming indoor = easy (coach decides intensity)

---

#### Scenario 5: External Program + Baseline ACWR

**Inputs:**
- `usesOwnProgram: true`
- `confidenceMetadata.acwr.confidence: "building_baseline"`
- `sessionResolution.success: false` (expected—no internal program)

**Resolution:**
- **Training Allowed:** ✅ Yes (self-managed)
- **Main Session Source:** None (athlete's external coach provides)
- **Blocks Shown:** Morning mobility, foam roll, [manual session log area], recovery
- **Banner Type:** Info (blue, persistent)
- **Banner Text:** "📋 Following External Program. You manage your main training. We'll track readiness, load, and recovery."
- **Primary CTA:** "Log Today's Session"
- **Secondary CTA:** "2-min Check-in"
- **Merlin Posture:** Explanatory (can discuss readiness, recovery, ACWR—not programming)

**Forbidden Actions:**
- Auto-generating any main session exercises
- Suggesting switching to internal program
- Asking for exercise details (respect external coach)
- Hiding ACWR baseline progress (still tracks load)
- Blocking features that don't require program (readiness, recovery)

---

#### Scenario 6: Taper + Fresh Readiness

**Inputs:**
- `readinessScore: 85`
- `confidenceMetadata.readiness.confidence: "measured"`
- `sessionResolution.override: "taper"`
- `taperDaysUntil: 4`
- `tournamentName: "Regional Championship"`

**Resolution:**
- **Training Allowed:** ✅ Yes (reduced)
- **Main Session Source:** Taper-modified program template
- **Blocks Shown:** Morning mobility, foam roll, taper session (reduced volume), recovery
- **Banner Type:** Info (blue)
- **Banner Text:** "🎯 Tapering for Regional Championship — 4 days out. Volume reduced to 65%. Trust the process."
- **Primary CTA:** "View Taper Plan"
- **Secondary CTA:** None (no check-in CTA—already logged)
- **Merlin Posture:** Warning (must refuse volume increase requests)

**Forbidden Actions:**
- Allowing athlete to add sets/exercises
- Suggesting "you feel good, push harder"
- Hiding taper reduction rationale
- Showing normal session intensity
- Letting readiness override taper protocol (both respected, taper limits ceiling)

---

#### Scenario 7: Coach Alert + Anything Else

**Inputs:**
- `coachAlertActive: true`
- `coachAlertType: "session_modified"`
- `coachAlertPriority: "high"`
- Any other state (readiness, ACWR, etc.)

**Resolution:**
- **Training Allowed:** ⚠️ Conditional (depends on alert content)
- **Main Session Source:** Coach-modified session (alert content)
- **Blocks Shown:** Alert banner (blocking overlay), then modified blocks per coach instruction
- **Banner Type:** Alert (amber, must-acknowledge)
- **Banner Text:** "🔔 Coach Alert: [Coach Message]. Acknowledged required before training."
- **Primary CTA:** "Read Coach Message"
- **Secondary CTA:** "Acknowledge" (after reading)
- **Merlin Posture:** Silent until alert acknowledged (then explanatory)

**Forbidden Actions:**
- Allowing training before alert acknowledged
- Hiding alert after first view (sticky until acknowledged)
- Showing original plan if coach modified it
- Auto-acknowledging alert
- Letting athlete dismiss without reading

---

#### Scenario 8: Session Resolution Failure

**Inputs:**
- `sessionResolution.success: false`
- `sessionResolution.status: "no_template"`
- `sessionResolution.reason: "No training week found for this date"`
- `confidenceMetadata.hasActiveProgram: true`

**Resolution:**
- **Training Allowed:** ❌ No
- **Main Session Source:** None (system failure)
- **Blocks Shown:** Error state only (no training blocks)
- **Banner Type:** Error (red)
- **Banner Text:** "No session found for today. Program not configured for this date. Contact your coach."
- **Primary CTA:** "Contact Coach"
- **Secondary CTA:** "View Program Details"
- **Merlin Posture:** Explanatory (can explain error, cannot generate replacement)

**Forbidden Actions:**
- Generating any workout content
- Showing generic exercises
- Suggesting "rest day" if not intended
- Hiding error from athlete
- Pretending session exists

---

#### Scenario 9: No Active Program

**Inputs:**
- `confidenceMetadata.hasActiveProgram: false`
- `sessionResolution.success: false`
- `sessionResolution.status: "no_program"`

**Resolution:**
- **Training Allowed:** ❌ No
- **Main Session Source:** None (program assignment required)
- **Blocks Shown:** Error state only
- **Banner Type:** Error (red)
- **Banner Text:** "No training program assigned. Complete onboarding or contact your coach to get started."
- **Primary CTA:** "Contact Coach"
- **Secondary CTA:** "Complete Onboarding" (if incomplete)
- **Merlin Posture:** Refusal (cannot provide training advice without program)

**Forbidden Actions:**
- Generating any training content
- Suggesting exercises
- Showing mobility/recovery (requires program context)
- Hiding error state
- Proceeding with setup wizard (coach must assign)

---

#### Scenario 10: Film Room Day (No Field Training)

**Inputs:**
- `sessionResolution.override: "film_room"`
- `readinessScore: 82`
- `confidenceMetadata.readiness.confidence: "measured"`
- `filmRoomTime: "10:00"`

**Resolution:**
- **Training Allowed:** ✅ Yes (light)
- **Main Session Source:** Film room protocol + optional skill work
- **Blocks Shown:** Morning mobility, foam roll, mental training / film room, optional skill drills, recovery
- **Banner Type:** Info (blue)
- **Banner Text:** "📽️ Film Room Today — 10:00. No field training scheduled. Recovery and mental prep day."
- **Primary CTA:** "View Film Room Details"
- **Secondary CTA:** None (readiness already logged)
- **Merlin Posture:** Explanatory (can discuss mental training, cannot suggest adding field work)

**Forbidden Actions:**
- Showing high-intensity session
- Suggesting "make up" training
- Hiding film room from schedule
- Allowing athlete to skip film room
- Treating as rest day (it's active mental training)

---

#### Scenario 11: Practice Day + Stale Readiness (2+ days)

**Inputs:**
- `readinessScore: 72` (timestamp: 52 hours ago)
- `confidenceMetadata.readiness.confidence: "stale"`
- `sessionResolution.override: "flag_practice"`
- `daysStale: 2.2`

**Resolution:**
- **Training Allowed:** ✅ Yes (modified)
- **Main Session Source:** Practice preparation protocol
- **Blocks Shown:** Morning mobility, foam roll, pre-practice activation, flag practice, post-practice recovery
- **Banner Type:** Two banners (warning + info, stacked):
  - Warning: "⚠️ Last check-in was 2 days ago. Plan uses program defaults for practice prep."
  - Info: "🏈 Flag Practice Today — 18:00. Training adjusted."
- **Primary CTA:** "Update Check-in" (prominently styled)
- **Secondary CTA:** "Continue to Practice Prep"
- **Merlin Posture:** Warning (encourages check-in, won't modify practice prep without it)

**Forbidden Actions:**
- Using 2-day-old readiness for intensity calculations
- Hiding staleness indicator
- Blocking practice prep (practice is mandatory)
- Suggesting skip practice to update check-in
- Assuming athlete is "fine" (may be fatigued/injured)

---

#### Scenario 12: Rehab Protocol + Practice Day (Detailed)

**Inputs:**
- `confidenceMetadata.injuryProtocolActive: true`
- `sessionResolution.override: "rehab_protocol"`
- `injuryAreas: ["hamstring", "lower_back"]`
- `rehabPhase: 2` (light loading)
- `teamPracticeScheduled: true`
- `painLevel: 2` (from last check-in)

**Resolution:**
- **Training Allowed:** ✅ Yes (restricted to rehab)
- **Main Session Source:** Return-to-play Phase 2 protocol
- **Blocks Shown:** Morning mobility (injury-safe), rehab exercises (phase 2), pain-free conditioning, recovery
- **Banner Type:** Alert (amber, high priority)
- **Banner Text:** "🏥 Return-to-Play Protocol Active (Phase 2). Team practice today at 18:00, but you're excluded for rehab. Pain > 3/10? Stop and contact physio immediately."
- **Primary CTA:** "View Rehab Phase 2"
- **Secondary CTA:** "Contact Physio"
- **Merlin Posture:** Refusal (must refuse any practice participation or progression requests)

**Forbidden Actions:**
- Showing team practice exercises
- Suggesting "ask coach if you can participate"
- Providing timeline for return ("when can I practice again?")
- Hiding practice from calendar (context awareness)
- Allowing any exercises not in rehab protocol
- Letting athlete self-progress to Phase 3

---

## SECTION 3 — Merlin Behavior Binding

### State Category: Normal Training Day

**When Merlin MUST Be Silent:**
- Athlete hasn't engaged Merlin (no proactive interruptions on TODAY)
- Athlete is mid-exercise execution (don't distract)
- Athlete is logging RPE/duration (don't interrupt data entry)

**When Merlin MAY Explain:**
- Athlete asks about exercise form/cues
- Athlete asks why specific exercise today
- Athlete asks about program phase/progression
- Athlete asks about readiness/ACWR impact

**When Merlin MUST Refuse:**
- Athlete asks to modify prescribed sets/reps (escalate to coach)
- Athlete asks to substitute exercises (escalate to coach)
- Athlete asks for medical diagnosis (escalate to physio)

**When Merlin MUST Escalate:**
- Never required (normal training day, no safety concerns)

---

### State Category: Active Injury/Rehab Protocol

**When Merlin MUST Be Silent:**
- During rehab exercise execution (athlete should focus on pain-free movement)
- When physio has provided instructions (don't contradict professional)

**When Merlin MAY Explain:**
- What rehab phase means (Phase 1 vs 2 vs 3)
- Why specific exercises are in protocol (mechanism explanation)
- What "pain-free" means (education, not diagnosis)

**When Merlin MUST Refuse:**
- Athlete asks to add exercises: "I can't add exercises during rehab. You're in Phase 2 (light loading). Additions require physio clearance."
- Athlete asks to skip rehab exercises: "I can't modify rehab protocol. These exercises are prescribed by your physio for safe return."
- Athlete asks when they can return: "I can't estimate return timelines. Your physio will clear you based on pain-free progress."
- Athlete asks if pain is normal: "I can't assess your pain. If pain > 3/10 or increasing, stop and contact your physio immediately."

**When Merlin MUST Escalate:**
- Pain level reported > 3/10 during exercise
- Athlete reports pain in new area (spread)
- Athlete expresses frustration wanting to return faster
- Athlete asks about pain medication/treatment

---

### State Category: Taper Period

**When Merlin MUST Be Silent:**
- Athlete completing taper session normally (no need to intervene)

**When Merlin MAY Explain:**
- Why volume is reduced (fatigue dissipation, glycogen supercompensation)
- What happens physiologically during taper
- Why athlete might feel "too fresh" (expected taper response)

**When Merlin MUST Refuse:**
- Athlete asks to add volume: "I can't increase volume during taper. You're 4 days from [Tournament]. Your coach designed this for peak performance."
- Athlete says "I feel great, can I do more?": "I can't override taper protocol. Feeling fresh is exactly the goal—trust the process."
- Athlete asks to skip taper session: "I can't recommend skipping taper sessions. Even reduced volume maintains neuromuscular readiness."

**When Merlin MUST Escalate:**
- Athlete reports feeling unusually fatigued during taper (may indicate overtraining)
- Athlete expresses anxiety about performance (mental prep concern)
- Athlete wants to change taper plan significantly (coach decision)

---

### State Category: Practice Day (Flag Football)

**When Merlin MUST Be Silent:**
- During pre-practice preparation (athlete should focus)
- When practice instructions differ from training plan (coach has authority)

**When Merlin MAY Explain:**
- Why training is adjusted for practice (load management)
- What pre-practice prep accomplishes (injury prevention)
- How practice affects weekly load (ACWR context)

**When Merlin MUST Refuse:**
- Athlete asks to do full training before practice: "I can't recommend full training before practice. QB protocol limits arm work to preserve you for team session."
- Athlete asks to skip practice for training: "I can't suggest skipping team practice. Practice is non-negotiable; training adjusts around it."

**When Merlin MUST Escalate:**
- Athlete reports injury from previous practice (needs physio)
- Athlete says coach wants different practice prep (coach authority conflict)
- Athlete wants to discuss practice performance (beyond Merlin's scope)

---

### Refusal Examples (4 Required)

#### Refusal Example 1: Adding Exercises During Taper

**Athlete:** "Can I add extra sprint work? I feel too fresh."

**Merlin:** "I can't add exercises during taper.

You're 3 days from Regional Championship. Your coach designed this taper to dissipate fatigue while maintaining sharpness.

Feeling fresh is the goal—it means the taper is working.

Extra work now would compromise your recovery and peak performance on game day.

Trust the taper. Your fitness is already built."

---

#### Refusal Example 2: Exercise Substitution Request

**Athlete:** "Can I do deadlifts instead of RDLs today?"

**Merlin:** "I can't modify your coach's prescribed exercises.

Your program includes RDLs today because:
- You're in the strength phase (eccentric focus)
- RDLs target hamstring flexibility + hip hinge
- Deadlifts would add fatigue before tomorrow's power day

Want to discuss this modification with your coach?

[Send Modification Request] [Keep RDLs as Prescribed]"

---

#### Refusal Example 3: Rehab Protocol Progression

**Athlete:** "My hamstring feels good. Can I progress to Phase 3?"

**Merlin:** "I can't clear you for rehab progression.

You're in Return-to-Play Phase 2 (light loading). Progression to Phase 3 requires:
1. Pain-free completion of Phase 2 exercises (in progress)
2. Full pain-free range of motion (needs assessment)
3. Physio clearance (required)

Only your physio can clear progression. They'll assess based on:
- Pain levels during loading
- Movement quality
- Tissue healing timeline

Continue Phase 2 as prescribed. Your next physio session is [Date].

Want to schedule an earlier assessment?"

---

#### Refusal Example 4: Training Advice Without Check-in Data

**Athlete:** "Should I train hard today or take it easy?"

**Merlin:** "I can't provide personalized intensity advice without today's check-in.

Your program shows Lower Body Power today, but intensity should be adjusted based on:
- Sleep quality
- Muscle soreness
- Stress level
- Energy level

Without check-in data, I can only say: Follow prescribed sets/reps, but listen to your body.

Want to do a 2-minute check-in now? It takes 30 seconds and I can give you better guidance.

[2-min Check-in] [Start Training with Program Defaults]"

---

## SECTION 4 — Forbidden UX Patterns (Hard Bans)

### Absolute Prohibitions (10 Required)

#### 1. Showing Multiple Plans Simultaneously

**Forbidden:**
- TODAY screen showing "Option A: Program workout" and "Option B: Recovery day"
- "Choose your session" picker
- "Switch to taper plan" toggle when taper not active

**Rationale:** ONE execution plan. Decision has been made by coach/system. TODAY is execution, not strategy.

---

#### 2. Suggesting Alternatives on TODAY

**Forbidden:**
- "Can't do squats? Try goblet squats instead"
- "Modify this session" button
- "Easier option" / "Harder option" toggles
- AI-generated substitutions

**Rationale:** Exercise selection is coach's domain. Modifications require coach approval. System does not have authority to suggest alternatives.

---

#### 3. Optimistic Language During Rehab

**Forbidden:**
- "You'll be back soon!"
- "Just a few more weeks"
- "This injury is minor"
- "Light work today, full training tomorrow"

**Rationale:** Rehab timelines are unpredictable. False optimism creates disappointment. Only physio can estimate return.

---

#### 4. "Low Confidence" Wording for Baseline ACWR

**Forbidden:**
- "Low confidence ACWR"
- "Insufficient training data"
- "Not enough history"
- "Unreliable load tracking"

**Rationale:** Baseline phase is progress, not deficiency. Must use "Building baseline" language.

---

#### 5. Hiding Coach Overrides

**Forbidden:**
- Applying coach modification without notification
- Showing modified session as if it were original
- Omitting "Updated by Coach [Name]" attribution
- Hiding modification timestamp

**Rationale:** Athlete must know when plan changes. Coach authority must be visible. Version confusion is dangerous.

---

#### 6. Generating Replacement Workouts

**Forbidden:**
- Auto-generating session when template missing
- AI creating "similar workout" when original unavailable
- Substituting random exercises when session fails
- "Here's something to do today" fallback

**Rationale:** Violates "no generic sessions" contract. If session resolution fails, fail explicitly—don't mask with fake content.

---

#### 7. Silent Intensity Changes

**Forbidden:**
- Reducing volume without explaining why
- Adjusting prescribed reps without notation
- Changing weights based on readiness without disclosure
- Modifying rest periods invisibly

**Rationale:** Athlete must understand what they're executing and why. Silent changes break trust and prevent learning.

---

#### 8. Fake Readiness Values

**Forbidden:**
- Showing "75" when `readinessScore === null`
- Displaying "0" or "50" as placeholder
- Using "average" or "typical" when data missing
- Imputing readiness from other metrics

**Rationale:** Truthfulness contract violation. Missing data is information. Faking data is lying.

---

#### 9. Skipping Blocks Without Explanation

**Forbidden:**
- Removing foam roll from TODAY without note
- Hiding warm-up section silently
- Omitting recovery block without reason
- "Simplified view" that removes mandatory prep

**Rationale:** Every block has purpose. If block is removed (e.g., practice day override), athlete must understand why.

---

#### 10. Letting Merlin Negotiate Safety

**Forbidden:**
- Merlin saying "Let me check if we can add this exercise"
- Merlin offering "compromise" during rehab
- Merlin suggesting "try it and see how you feel"
- Merlin saying "maybe just one set?"

**Rationale:** Safety boundaries are non-negotiable. Merlin cannot soften refusals. Clear boundaries are kind boundaries.

---

#### 11. Showing Future Sessions on TODAY

**Forbidden:**
- "Tomorrow: Lower Body"
- "Next 7 days" preview on TODAY screen
- "Upcoming this week" section
- Date picker allowing future selection

**Rationale:** TODAY is today only. Future is Calendar/Week view. Mixing timeframes creates confusion about what to execute now.

---

#### 12. Blocking Training for Non-Safety Reasons

**Forbidden:**
- "Complete check-in to unlock training"
- "Subscription required to view session"
- "Watch ad to continue"
- "Rate the app to access workout"

**Rationale:** Training access is athlete's right. Gates only for safety (rehab limits, session resolution failure). Never monetization or engagement manipulation.

---

## SECTION 5 — Auditability Rules

### What MUST Be Logged When TODAY Is Viewed

**Required Log Entry Fields:**
- `athlete_id` (who)
- `timestamp` (when)
- `date_viewed` (which day's protocol)
- `readinessScore` (null or number)
- `confidenceMetadata` (complete object)
- `sessionResolution.status` (success/failure state)
- `sessionResolution.override` (null or override type)
- `blocks_displayed` (array of block types shown)
- `banners_shown` (array of banner types displayed)
- `primary_cta` (what action was offered)
- `merlin_posture` (silent/explanatory/warning/refusal)

**Log Purpose:** Reconstruct athlete's view at any moment. Enable coach to see what athlete saw. Support debugging/disputes.

---

### What MUST Be Logged When Athlete Overrides Recommendation

**Triggering Events:**
- Athlete clicks "Start Anyway" (without check-in)
- Athlete skips recommended foam roll
- Athlete modifies prescribed sets/reps during session
- Athlete marks exercise as "skipped" with reason

**Required Log Entry Fields:**
- `athlete_id`
- `timestamp`
- `override_type` (started_without_checkin | skipped_block | modified_prescription | exercise_skipped)
- `recommendation_given` (what system advised)
- `athlete_action` (what athlete chose instead)
- `reason` (if athlete provided one)
- `context` (readiness state, ACWR state, override active, etc.)

**Log Purpose:** Identify patterns (athlete always skips foam roll → coach intervention). Support injury investigation (athlete ignored readiness warnings → root cause). Respect athlete autonomy while maintaining accountability.

---

### What MUST Be Visible to Coaches Later

**Coach Dashboard — Athlete Compliance View:**

**Access Granted:**
- Athlete viewed TODAY: Yes/No (daily)
- Check-in completion: Yes/No (daily)
- Training blocks completed: X/Y (by block type)
- Session logged with RPE: Yes/No (required for ACWR)
- Override actions taken: List (if any)
- Readiness trend: 7-day graph
- ACWR trend: 7-day or baseline progress
- Days since last check-in: Counter

**Access Denied (Privacy Boundaries):**
- Specific check-in responses (sleep quality number, stress level)
- Merlin conversation content (unless athlete shares)
- Exercise modification reasons (unless athlete chooses "notify coach")
- Non-training app usage (Dashboard views, profile edits)

**Alert Triggers (Notify Coach):**
- Athlete skips 3+ consecutive check-ins
- Athlete logs RPE 9-10 three days in a row
- Athlete reports pain > 3/10 during training
- Athlete's ACWR enters danger zone (>1.5)
- Athlete hasn't logged training in 5+ days

**Rationale:** Coaches need compliance visibility for program effectiveness. Athletes retain privacy for personal wellness data. Alert thresholds balance autonomy with safety.

---

### Audit Trail Retention

**Minimum Retention Period:**
- View logs: 90 days
- Override logs: 1 year
- Session completion logs: Permanent (ACWR depends on history)
- Coach alert acknowledgments: Permanent (liability protection)

**Access Controls:**
- Athlete: Full access to own logs
- Coach: Compliance view only (per consent)
- Admin: Full access (for support/debugging)
- Physio: Injury-related logs only (if athlete consents)

---

## SECTION 6 — Conflict Resolution Rules

### When Multiple Conditions Apply Simultaneously

**Resolution Process:**
1. Identify all active conditions from input state
2. Sort by priority stack (Section 1)
3. Apply highest priority condition's resolution
4. Lower priority conditions become contextual notes, not primary drivers

**Example:**

Active conditions:
- Taper (priority 8)
- Fresh readiness (priority 9)
- Practice day (priority 6)

Resolution: Practice day wins (priority 6 > 8 > 9)

Display: 
- Practice prep as main content
- Context notes: "Tapering for [Tournament] in 5 days" (info banner below practice banner)
- "Readiness: 85 ✓" (header stat)

---

### When Input State Is Ambiguous

If ANY required input is undefined/invalid:
1. Log error with complete state snapshot
2. Show error screen to athlete: "We're having trouble loading your training plan. Contact support."
3. Do NOT attempt fallback/guess
4. Do NOT show partial/incomplete state
5. Surface error to engineering (system bug)

**Rationale:** Ambiguous state is system failure, not runtime condition. Better to fail explicitly than show incorrect content.

---

## SECTION 7 — Testing Determinism Guarantee

### Acceptance Criteria for Implementation

Given identical input state, the system MUST produce:
- Identical `training_allowed` decision
- Identical `main_session_source`
- Identical `blocks_shown` list (order and content)
- Identical `banner_type` and `banner_text`
- Identical `primary_cta` and `secondary_cta`
- Identical `merlin_posture`

**Across:**
- Multiple runs (time-independent)
- Multiple platforms (web/iOS/Android)
- Multiple users (user-independent)
- Multiple environments (dev/staging/prod)

---

### Test Harness Requirements

**Minimum Test Coverage:**
- All 12 canonical scenarios (Section 2)
- All priority conflicts (Section 6)
- All forbidden patterns (Section 4)
- All Merlin refusals (Section 3)

**Test Format:**

```
Test: Scenario_3_Rehab_Plus_Practice
Input:
  confidenceMetadata.injuryProtocolActive: true
  sessionResolution.override: "rehab_protocol"
  teamPracticeScheduled: true
Expected:
  training_allowed: true
  main_session_source: "rehab_protocol"
  banner_type: "alert"
  primary_cta: "View Rehab Phase Details"
  merlin_posture: "refusal"
  forbidden: ["show_team_practice", "allow_practice_participation"]
```

---

## Appendix A: Quick Reference Matrix

| Priority | Condition | Training | Banner | Main Session | Merlin |
|----------|-----------|----------|--------|--------------|--------|
| 1 | Session fail | ❌ No | Error | None | Explanatory |
| 2 | No program | ❌ No | Error | None | Refusal |
| 3 | Rehab active | ✅ Restricted | Alert | RTP protocol | Refusal |
| 4 | Coach alert | ⚠️ Conditional | Alert | Per alert | Silent until ack |
| 5 | Weather override | ✅ Modified | Alert | Coach/film | Explanatory |
| 6 | Practice day | ✅ Modified | Info | Practice prep | Explanatory |
| 7 | Film room | ✅ Light | Info | Film/skill | Explanatory |
| 8 | Taper | ✅ Reduced | Info | Taper session | Warning |
| 9 | Wellness/ACWR | ✅ Adjusted | Info/Warn/None | Program template | Explanatory |

---

## Document Metadata

**Maintained By:** Product Architecture + Engineering  
**Enforcement:** All TODAY implementations MUST comply exactly  
**Testing:** QA must verify all 12 canonical scenarios deterministically  
**Review Cycle:** Quarterly or on contract breach  

**Related Documents:**
- TODAY Screen UX Authority Contract v1 (parent)
- Backend Truthfulness Contract (foundation)
- Merlin Safety Guardrails (AI constraints)

**Version History:**
- v1.0 (2026-01-06): Initial state resolution contract

---

## End of Document

**This contract is law. Deviation is system failure.**


