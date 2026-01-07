# Phase 2 — Functionality → UX Audit

**Generated:** January 2026  
**Updated:** January 2026 (Implementation Complete)  
**Purpose:** Identify confusing moments where logic exists but UX fails to communicate it  
**Method:** Scenario walkthroughs evaluating 5 key questions

---

## 🎯 Quick Status Summary

**Implementation Status:** ✅ **ALL PHASES COMPLETE**

- ✅ **Phase 2.1 — Trust Repair:** Complete (Coach Override Transparency, ACWR Explanations, Ownership Transitions)
- ✅ **Phase 2.2 — Data Literacy:** Complete (Data Confidence, Missing Data Explanation, Late Log Framing)
- ✅ **Phase 2.3 — Motivation & Safety:** Complete (RTP Celebration, AI Mode Explanation)

**5-Question Contract:** ✅ Implemented across all major state changes

**Components Created:** 5 new shared components + 6 enhanced components

**Impact:** System now provides full state narration, building trust and transparency

---

## Executive Verdict

**Phase 2 confirms that Phase 1 logic is correct.**

What is failing is **state narration**.

Your system:
- ✅ Detects correctly
- ✅ Decides correctly
- ✅ Acts correctly

But it does **not explain itself**.

This creates three dangerous outcomes:
1. **Players feel punished or confused** — Silent changes, unexplained warnings, missing context
2. **Coaches hesitate or ignore signals** — Unclear urgency, missing action paths, invisible ownership
3. **AI feels arbitrary rather than supportive** — Mode changes without explanation, conservative advice without reason

**This is not a UX "nice-to-have".**

**This is a safety and trust issue in a performance platform.**

---

## The Single Unifying Failure Pattern

Every scenario documented collapses into one root problem:

### **State transitions occur without a visible narrative.**

**More precisely:**

| What the system does well | What the user never sees |
|---------------------------|--------------------------|
| Computes ACWR | What changed |
| Detects thresholds | Why it changed |
| Switches AI modes | Who is responsible now |
| Transfers ownership | What happens next |
| Flags missing data | Whether this is normal or urgent |
| Logs overrides | |
| Advances RTP phases | |

**So users are left guessing intent.**

This is why:
- Silent overrides break trust
- Late logs feel like judgment
- ACWR spikes feel like ambushes
- RTP progress feels flat
- AI mode changes feel random

---

## The UX Contract You Are Missing

**You need to treat every system-level change as a first-class UX event.**

### Introduce a mandatory **System State Change Contract**

Any time the system:
- recalculates,
- escalates,
- overrides,
- downgrades confidence,
- transfers ownership,
- blocks autonomy,
- or unlocks a phase,

**the UI must answer five questions explicitly:**

### The 5-Question Contract (non-negotiable)

Every major change must surface:

1. **What changed**
   - "Your ACWR increased from 1.2 → 1.55"
   - "Your training plan was adjusted by your coach"
   - "Your data confidence dropped to 60%"

2. **Why it changed**
   - "Due to high-intensity sessions on Mon + Wed"
   - "Because wellness data is missing for 3 days"
   - "Because your physio cleared Phase 2"

3. **What this means**
   - "Injury risk is elevated"
   - "AI advice is now conservative"
   - "Training intensity is temporarily reduced"

4. **Who is responsible now**
   - "Coach has been notified and is reviewing"
   - "Physio controls RTP progression"
   - "You can restore confidence by checking in"

5. **What happens next**
   - Clear action or clear waiting state
   - Button, link, or reassurance

**If any of these five are missing → trust degrades.**

---

## Audit Questions

For each scenario, evaluate:
1. **Does the user know something changed?**
2. **Is the reason visible?**
3. **Is the next action obvious?**
4. **Is responsibility clear?**
5. **Is trust preserved?**

---

## Scenario 1: Player Skips Wellness for 3 Days

### System Behavior (What Happens)
- Day 1: Wellness logged ✅
- Day 2: Wellness skipped ❌
- Day 3: Wellness skipped ❌
- System detects missing data via `MissingDataDetectionService`
- Coach sees "Data Incomplete" badge on player card
- Player sees "Check-in Needed" tag on dashboard
- AI Coach switches to conservative mode
- Coach receives notification after 3 days

### UX Evaluation

| Question | Answer | Evidence |
|----------|--------|----------|
| **Does the user know something changed?** | ⚠️ **PARTIAL** | Player: "Check-in Needed" tag exists but may blend into dashboard. Coach: Badge exists but may not be prominent enough. |
| **Is the reason visible?** | ❌ **NO** | No explanation of WHY missing wellness matters (data confidence impact, ACWR reliability, etc.). Badge just says "Data Incomplete" without context. |
| **Is the next action obvious?** | ⚠️ **PARTIAL** | Player: "Check-in Needed" suggests action but no direct link or urgency. Coach: Badge visible but no clear "Follow up" button or action path. |
| **Is responsibility clear?** | ⚠️ **PARTIAL** | Player knows they should check in, but unclear if coach will follow up or if it's urgent. Coach sees badge but unclear if action is required vs. informational. |
| **Is trust preserved?** | ⚠️ **PARTIAL** | No explanation of data confidence impact. Player may not understand why skipping matters. Coach may not understand urgency. |

### Confusing Moments

1. **Silent Data Quality Degradation**
   - ACWR confidence drops from 90% → 70% → 50% as days pass, but this isn't communicated
   - Player sees same ACWR number but doesn't know it's becoming less reliable
   - **Impact:** Player makes decisions based on increasingly unreliable data without knowing

2. **Missing Context for Coach Badge**
   - Coach sees "Data Incomplete" but doesn't know:
     - How many days missing?
     - What data is missing (wellness vs. training)?
     - Impact on ACWR reliability?
     - Is this urgent or informational?
   - **Impact:** Coach may ignore badge or not prioritize appropriately

3. **No Escalation Visibility**
   - After 3 days, system creates notification but player doesn't see escalation
   - Player doesn't know coach has been notified
   - **Impact:** Player may feel blindsided when coach reaches out

4. **AI Coach Mode Change Not Explained**
   - AI switches to conservative mode but doesn't explain why
   - Player may notice advice is more cautious but doesn't understand it's due to missing data
   - **Impact:** Player loses trust in AI or doesn't understand the connection

### Required UX Changes (5-Question Contract)

**What changed:**
- Add Data Confidence Indicator next to ACWR (not buried)
- Show degradation visually: 90% → 70% → 50%
- Display prominently on dashboard: "Data confidence: 70% (was 90%)"

**Why it changed:**
- Tooltip / inline text: "ACWR reliability is reduced due to missing wellness data."
- Show days missing: "3 days without wellness check-in"
- Explain impact: "Missing data reduces ACWR calculation accuracy"

**What this means:**
- "AI advice is now conservative due to incomplete data"
- "ACWR values are less reliable until wellness data is restored"

**Who is responsible now:**
- After day 3: "Your coach has been notified due to continued missing data."
- Show escalation: "Coach will follow up if data remains missing"

**What happens next:**
- **Mandatory CTA for Player:** "Complete Wellness Check-in" (prominent button)
- **Mandatory CTA for Coach:** "View Missing Data Details" (link to player card)
- Show timeline: "Complete check-in to restore data confidence"

---

## Scenario 2: Player Logs Training Late

### System Behavior (What Happens)
- Player logs training session 30 hours after session occurred
- `TrainingDataService.detectLateLoggingAndConflicts()` flags as "late" (>24h)
- Session marked with `log_status: "late"` and `hours_delayed: 30`
- UI shows warning in training log component
- ACWR recalculated with correct timestamp
- If >48h late, requires coach approval

### UX Evaluation

| Question | Answer | Evidence |
|----------|--------|----------|
| **Does the user know something changed?** | ✅ **YES** | Warning shown in UI when logging late session |
| **Is the reason visible?** | ⚠️ **PARTIAL** | Warning says "late log" but doesn't explain why it matters (ACWR accuracy, historical record integrity) |
| **Is the next action obvious?** | ⚠️ **PARTIAL** | Warning shown but unclear if player needs to do anything. If >48h, coach approval required but flow unclear. |
| **Is responsibility clear?** | ⚠️ **PARTIAL** | Player knows they logged late, but unclear if this is just informational or requires action. Coach approval flow exists but not clearly communicated. |
| **Is trust preserved?** | ⚠️ **PARTIAL** | Warning may make player feel judged. No explanation that late logging is okay, just needs flagging for accuracy. |

### Confusing Moments

1. **ACWR Recalculation Not Communicated**
   - ACWR updates automatically when late log is submitted
   - Player doesn't see "ACWR updated" message or before/after comparison
   - **Impact:** Player may not realize their late log affected their ACWR, or may wonder why ACWR changed

2. **Warning Without Context**
   - Warning says "Late log detected" but doesn't explain:
     - Why late logging matters (data accuracy)
     - That it's okay to log late, just needs flagging
     - Impact on ACWR calculation
   - **Impact:** Player may feel shamed or avoid logging late sessions

3. **Coach Approval Flow Unclear**
   - If >48h late, requires coach approval but:
     - Player doesn't see "Pending approval" status
     - Coach doesn't see clear approval queue
     - No notification to coach about pending approval
   - **Impact:** Late logs may sit in limbo, player doesn't know if session was accepted

4. **No Historical Context**
   - Player can't see if this is their first late log or part of a pattern
   - Coach can't see late logging frequency per player
   - **Impact:** Patterns of late logging aren't visible, making it harder to address systemic issues

### Required UX Changes (5-Question Contract)

**Tone correction:** Late logging is not a fault — it's a data qualifier.

**What changed:**
- Replace warning language with neutral framing: "Logged 30 hours after session — flagged for accuracy."
- Show timestamp clearly: "Session date: Mon 9am | Logged: Tue 3pm"

**Why it changed:**
- Explain purpose: "Late logs are flagged to maintain ACWR calculation accuracy"
- Clarify it's okay: "You can log sessions late — this flag helps ensure accurate data"

**What this means:**
- Show impact inline before/after:
  - "ACWR before log: 1.25"
  - "ACWR after log: 1.28"
- Explain: "Your ACWR updated to reflect this session"

**Who is responsible now:**
- If >48h late:
  - **Player sees:** "Pending coach review" (status badge)
  - **Coach sees:** "Late log awaiting approval" (in approval queue)
- No invisible limbo states. Ever.

**What happens next:**
- If <48h: "Session logged successfully. ACWR updated."
- If >48h: "Coach will review within 24 hours. You'll be notified when approved."
- Show approval status clearly: "Pending" → "Approved" → "Rejected"

---

## Scenario 3: ACWR Goes from 1.2 → 1.55

### System Behavior (What Happens)
- ACWR calculated from 1.2 (sweet spot) to 1.55 (danger zone)
- `AcwrAlertsService` detects threshold crossing (>1.5)
- Creates critical alert: "CRITICAL: ACWR is 1.55 - in danger zone!"
- Logs ownership transition: player → coach
- Coach receives notification
- Dashboard shows alert banner
- Risk zone indicator changes color

### UX Evaluation

| Question | Answer | Evidence |
|----------|--------|----------|
| **Does the user know something changed?** | ✅ **YES** | Alert banner shown, risk zone color changes, notification sent |
| **Is the reason visible?** | ⚠️ **PARTIAL** | Alert says "danger zone" but doesn't explain what caused the spike (recent training load, missed recovery, etc.) |
| **Is the next action obvious?** | ⚠️ **PARTIAL** | Alert shows recommendation but no clear action buttons. Player may not know if they should adjust training or wait for coach. |
| **Is responsibility clear?** | ⚠️ **PARTIAL** | Ownership transition logged (player → coach) but not clearly communicated. Player may not know coach has been notified. |
| **Is trust preserved?** | ⚠️ **PARTIAL** | Critical alert may cause panic. No explanation of what led to spike or that it's manageable. |

### Confusing Moments

1. **Silent Threshold Crossing**
   - ACWR crosses from 1.2 → 1.3 → 1.55 but only 1.55 triggers alert
   - Player doesn't see gradual increase or 1.3 warning
   - **Impact:** Player may feel blindsided by critical alert when they could have been warned earlier

2. **No Cause Explanation**
   - Alert says "ACWR is 1.55" but doesn't explain:
     - What training sessions caused the spike?
     - Was it a single high-intensity session or cumulative?
     - Did missing recovery contribute?
   - **Impact:** Player can't understand what to change to prevent future spikes

3. **Ownership Transition Not Visible**
   - System logs transition (player → coach) but player doesn't see:
     - "Coach has been notified"
     - "Coach will review and adjust your plan"
     - Timeline for coach response
   - **Impact:** Player may not know coach is handling it, or may feel abandoned

4. **No Before/After Context**
   - Player sees current ACWR (1.55) but doesn't see:
     - Previous value (1.2)
     - Trend over time
     - How long it's been elevated
   - **Impact:** Player can't assess if this is a sudden spike or gradual increase

5. **Recommendation Without Action Path**
   - Alert shows recommendation ("Reduce load 20-30%") but no:
     - "Adjust Training Plan" button
     - Link to modify upcoming sessions
     - Clear steps to reduce load
   - **Impact:** Player knows what to do but not how to do it

### Required UX Changes (5-Question Contract)

**This is a critical trust moment.**

**What changed:**
- Show trend, not just value: "ACWR rose steadily over 5 days: 1.2 → 1.3 → 1.4 → 1.5 → 1.55"
- Display before/after prominently: "ACWR: 1.2 → 1.55"
- Show risk zone change: "Sweet Spot → Danger Zone"

**Why it changed:**
- Show cause attribution: "Main contributors: Sprint session (Wed), Strength overload (Fri)"
- List specific sessions: "High-intensity sessions this week: [list]"
- Explain cumulative vs. sudden: "Gradual increase over 5 days" or "Sudden spike from single session"

**What this means:**
- "Injury risk is elevated — danger zone threshold exceeded"
- "Training load exceeds safe range"
- "Immediate action recommended"

**Who is responsible now:**
- Show ownership shift: "Your coach has been notified and will adjust your plan."
- Display notification status: "Coach notified: [timestamp]"
- Show response timeline: "Coach typically responds within 24 hours"

**What happens next:**
- **Action clarity:** Either:
  - "Coach is reviewing — no action needed now" (waiting state)
  - OR "Reduce today's intensity → Modify session" (action button)
- **Never both.** Clear single path forward.
- If coach is handling: "Wait for coach's plan adjustment"
- If player can act: "Modify Today's Session" button

---

## Scenario 4: Coach Overrides Training

### System Behavior (What Happens)
- Coach modifies player's training plan (e.g., reduces load, changes session type)
- `OverrideLoggingService` logs override with AI recommendation vs. coach decision
- Override stored in `coach_overrides` table
- Override badges shown in coach dashboard roster table
- Player's training plan updates
- ACWR may recalculate based on new plan

### UX Evaluation

| Question | Answer | Evidence |
|----------|--------|----------|
| **Does the user know something changed?** | ❌ **NO** | Player doesn't receive notification when coach overrides. Training plan just changes silently. |
| **Is the reason visible?** | ❌ **NO** | Player doesn't see why coach made the change or what AI recommended. No explanation provided. |
| **Is the next action obvious?** | ⚠️ **PARTIAL** | Player sees updated plan but unclear if they should follow it or ask questions. No "Coach modified your plan" notice. |
| **Is responsibility clear?** | ⚠️ **PARTIAL** | Coach knows they overrode, but player may not realize coach made the change vs. automatic update. |
| **Is trust preserved?** | ❌ **NO** | Silent changes erode trust. Player may feel plan is arbitrary or not understand coach's reasoning. |

### Confusing Moments

1. **Silent Plan Changes**
   - Player opens app and sees different training plan
   - No notification, no explanation, no "Coach modified your plan" banner
   - **Impact:** Player may think it's a bug or automatic update, not a deliberate coach decision

2. **No Transparency on Override**
   - Coach sees override badges but player doesn't see:
     - "Coach adjusted your plan"
     - "AI recommended X, Coach set Y"
     - Reason for override
   - **Impact:** Player can't understand coach's reasoning or learn from the decision

3. **ACWR Impact Not Communicated**
   - Override may change ACWR calculation but player doesn't see:
     - "ACWR updated due to plan change"
     - Before/after ACWR values
     - Impact of override on load
   - **Impact:** Player may not understand why ACWR changed

4. **No Opportunity for Questions**
   - Player can't easily ask coach about the override
   - No "Why did my plan change?" button or comment thread
   - **Impact:** Player may follow plan blindly without understanding reasoning

5. **Override History Not Accessible**
   - Override logged but player can't see:
     - History of overrides
     - Frequency of coach adjustments
     - Pattern of AI vs. coach decisions
   - **Impact:** Player can't see if coach frequently adjusts or if this is unusual

### Required UX Changes (5-Question Contract)

**Silent overrides are unacceptable. This is highest priority.**

**What changed:**
- **Mandatory notification:** "Your coach adjusted your training plan."
- Show what changed: "Today's session: Intensity reduced from 8/10 → 6/10"
- Display change summary: "3 sessions modified this week"

**Why it changed:**
- **Transparency panel** (expandable):
  - "AI recommendation: [session details]"
  - "Coach decision: [session details]"
  - Coach rationale (short, optional note): "Reducing load due to ACWR spike"

**What this means:**
- "Training plan adjusted to reduce injury risk"
- "ACWR impact: Expected reduction from 1.55 → 1.4"
- "These changes are effective immediately"

**Who is responsible now:**
- "Coach made this adjustment"
- "Coach will monitor your response"
- Show override timestamp: "Adjusted [time] ago"

**What happens next:**
- **Action:** "Ask coach about this change" (button opens message/comments)
- **Action:** "View previous plan" (compare view)
- **Action:** "View override history" (see all coach adjustments)
- **Reassurance:** "Follow the updated plan. Contact coach with questions."

**This is where trust is either built or destroyed.**

---

## Scenario 5: Physio Flags RTP Phase 2

### System Behavior (What Happens)
- Physio updates RTP progress to Phase 2 ("Light Activity")
- `updateRTPProgress()` in `staff-physiotherapist.cjs` updates injury record
- RTP protocol activates for player
- Shared insight created and visible to coach
- Player's training plan may adjust based on RTP phase
- Player sees RTP protocol on dashboard

### UX Evaluation

| Question | Answer | Evidence |
|----------|--------|----------|
| **Does the user know something changed?** | ⚠️ **PARTIAL** | Player sees RTP protocol on dashboard but may not notice phase change. No notification of phase advancement. |
| **Is the reason visible?** | ⚠️ **PARTIAL** | RTP phase shown but doesn't explain why Phase 2 was started (progress metrics, pain levels, function scores). |
| **Is the next action obvious?** | ⚠️ **PARTIAL** | Phase 2 activities shown but unclear if player should start immediately or wait for confirmation. |
| **Is responsibility clear?** | ⚠️ **PARTIAL** | Player knows physio manages RTP but unclear if coach has been notified or if player needs to coordinate with coach. |
| **Is trust preserved?** | ⚠️ **PARTIAL** | Phase advancement is positive but no celebration or explanation of progress. Player may not understand significance. |

### Confusing Moments

1. **Phase Change Not Celebrated**
   - Player advances from Phase 1 → Phase 2 but no:
     - "Congratulations, you've progressed to Phase 2!"
     - Progress summary
     - What this means for recovery
   - **Impact:** Player may not realize this is significant progress or feel motivated

2. **No Progress Context**
   - Phase 2 shown but player doesn't see:
     - Days in Phase 1
     - Progress metrics that led to advancement
     - What needs to happen to reach Phase 3
   - **Impact:** Player can't understand why they advanced or what's next

3. **Training Plan Changes Not Explained**
   - RTP Phase 2 may modify training plan but player doesn't see:
     - "Training plan updated for Phase 2"
     - What changed (new exercises, modified intensity)
     - Why changes were made
   - **Impact:** Player may not realize plan changed or why

4. **Coach Notification Not Visible**
   - Coach receives shared insight but player doesn't see:
     - "Coach has been notified"
     - "Coach will adjust your training plan"
     - Timeline for coach response
   - **Impact:** Player may not know coach is aware of phase change

5. **No Clear Activity Instructions**
   - Phase 2 says "Light Activity" but player doesn't see:
     - Specific exercises to do
     - Duration/frequency
     - Pain limits ("Stop if pain > 3/10")
     - How to progress to Phase 3
   - **Impact:** Player may not know exactly what to do or how to progress

### Required UX Changes (5-Question Contract)

**This should be emotionally positive, not silent.**

**What changed:**
- **Celebration moment:** "You've progressed to RTP Phase 2 🎉"
- Show phase advancement: "Phase 1 → Phase 2"
- Display milestone: "First major recovery milestone reached"

**Why it changed:**
- **Progress context:**
  - "Days in Phase 1: 7 days"
  - "What unlocked Phase 2: Pain < 2/10, Function score > 70%"
  - Show progress metrics: "Pain: 1.5/10 | Function: 75% | Strength: 80%"

**What this means:**
- "You can now perform light activity"
- "Training intensity will gradually increase"
- "You're on track for full recovery"

**Who is responsible now:**
- "Physio controls RTP progression"
- "Your coach has been informed"
- Show notification: "Coach notified: [timestamp]"

**What happens next:**
- **Clear instructions:**
  - Allowed activities: "Walking, light stretching, stationary bike"
  - Duration/frequency: "20-30 minutes, 3x per week"
  - Pain limits: "Stop if pain > 3/10"
  - What unlocks Phase 3: "Complete Phase 2 activities for 7 days with pain < 2/10"
- **Action:** "View Phase 2 Protocol" (detailed guide)
- **Action:** "Contact Physio" (if questions)

---

## Summary: Confusing Moments by Category

### Silent Changes
1. **ACWR recalculation after late training log** - No "ACWR updated" message
2. **Training plan changes from coach override** - No notification to player
3. **Data confidence degradation** - ACWR becomes less reliable but number stays same
4. **RTP phase advancement** - No celebration or notification

### Numbers Changing Without Explanation
1. **ACWR spike (1.2 → 1.55)** - No explanation of what caused increase
2. **Data confidence drop** - Confidence decreases but not communicated
3. **ACWR after late log** - Recalculates but no before/after shown

### Warnings Without Actions
1. **Missing wellness badge** - Shows "Data Incomplete" but no clear follow-up path
2. **Late log warning** - Warns but unclear if action needed
3. **ACWR danger zone alert** - Shows recommendation but no action buttons

### Actions Without Confirmation
1. **Coach override** - Changes plan without player confirmation or explanation
2. **RTP phase change** - Advances phase without player acknowledgment
3. **ACWR recalculation** - Updates automatically without showing impact

### Conflicting Signals
1. **AI Coach conservative mode** - Switches mode but doesn't explain why (due to missing data)
2. **Ownership transitions** - Logged but not visible to players
3. **Coach notification** - Coach notified but player doesn't know

---

## Build Order

**Do this in sequence. Each phase builds trust and enables the next.**

### Phase 2.1 — Trust Repair ✅ COMPLETE

**Priority: CRITICAL — These are trust-breaking issues**

1. **Coach Override Transparency** ✅
   - ✅ Notification system for plan changes (`OverrideLoggingService.createPlayerNotification()`)
   - ✅ Transparency panel (AI vs. Coach) (`CoachOverrideNotificationComponent`)
   - ✅ Override history view (dialog with history)
   - ✅ "Ask coach" action button
   - **Impact:** Prevents silent changes that destroy trust
   - **Files:** 
     - `angular/src/app/core/services/override-logging.service.ts`
     - `angular/src/app/shared/components/coach-override-notification/coach-override-notification.component.ts`
     - `angular/src/app/features/dashboard/player-dashboard.component.ts`

2. **ACWR Before/After Explanations** ✅
   - ✅ Show trend visualization (1.2 → 1.3 → 1.55) (`acwrTrend` computed signal)
   - ✅ Cause attribution (specific sessions) (`acwrCauseAttribution` signal)
   - ✅ Before/after comparison (in alert banner)
   - ✅ Ownership transition visibility (`OwnershipTransitionBadgeComponent`)
   - **Impact:** Prevents "ambush" feeling from spikes
   - **Files:**
     - `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts`
     - `angular/src/app/shared/components/ownership-transition-badge/ownership-transition-badge.component.ts`

3. **Ownership Transition Visibility** ✅
   - ✅ "Coach has been notified" messages (`OwnershipTransitionBadgeComponent`)
   - ✅ Timeline for coach response (expected response times)
   - ✅ Status updates (pending → in progress → completed)
   - **Impact:** Players know who's responsible and what's happening
   - **Files:**
     - `angular/src/app/shared/components/ownership-transition-badge/ownership-transition-badge.component.ts`
     - `angular/src/app/features/dashboard/player-dashboard.component.ts`
     - `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts`

**Why first:** These are the most trust-breaking. Fix these before adding features.

**Status:** ✅ All Phase 2.1 items implemented and integrated.

---

### Phase 2.2 — Data Literacy ✅ COMPLETE

**Priority: HIGH — Enables informed decision-making**

4. **Data Confidence Indicator** ✅
   - ✅ Prominent display next to ACWR (`ConfidenceIndicatorComponent` enhanced)
   - ✅ Visual degradation (90% → 70% → 50%) (color-coded borders and bars)
   - ✅ Explanation of impact (contextual messages based on confidence level)
   - ✅ Actions to improve confidence (wellness check-in, log training buttons)
   - **Impact:** Players understand data quality matters
   - **Files:**
     - `angular/src/app/shared/components/confidence-indicator/confidence-indicator.component.ts`
     - `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts`

5. **Missing Data Explanation** ✅
   - ✅ Why missing wellness matters (contextual explanations)
   - ✅ Days missing and impact (days count with severity levels)
   - ✅ Escalation visibility ("Coach has been notified" after 3+ days)
   - ✅ Clear action paths ("Complete Wellness Check-in" button)
   - **Impact:** Players understand consequences of skipping
   - **Files:**
     - `angular/src/app/shared/components/missing-data-explanation/missing-data-explanation.component.ts`
     - `angular/src/app/features/dashboard/player-dashboard.component.ts`

6. **Late Log Framing + Approval Flow** ✅
   - ✅ Neutral tone (not punishment) ("Logged X hours after session — flagged for accuracy")
   - ✅ ACWR impact display (before/after comparison)
   - ✅ Approval status visibility (pending/approved status badges)
   - ✅ No limbo states (clear status messages)
   - **Impact:** Late logging doesn't feel like judgment
   - **Files:**
     - `angular/src/app/features/training/training-log/training-log.component.ts`
     - `angular/src/app/features/training/training-log/training-log.component.scss`

**Why second:** These help users understand system behavior and make better decisions.

**Status:** ✅ All Phase 2.2 items implemented and integrated.

---

### Phase 2.3 — Motivation & Safety ✅ COMPLETE

**Priority: MEDIUM — Enhances engagement and safety**

7. **RTP Phase Celebration + Guidance** ✅
   - ✅ Celebration moment (`RTPPhaseCelebrationComponent` with emoji and header)
   - ✅ Progress context (days in previous phase, what unlocked this phase)
   - ✅ Clear activity instructions (allowed activities and restrictions lists)
   - ✅ What unlocks next phase (unlock criteria displayed)
   - **Impact:** Recovery feels like progress, not silent advancement
   - **Files:**
     - `angular/src/app/shared/components/rtp-phase-celebration/rtp-phase-celebration.component.ts`
     - `angular/src/app/features/return-to-play/return-to-play.component.ts`

8. **AI Mode Explanation** ✅
   - ✅ When AI switches to conservative mode (`AIModeExplanationComponent`)
   - ✅ Why (missing data, low confidence) (reason explanations)
   - ✅ Confidence level in responses (visual confidence bar with percentage)
   - ✅ Actions to improve data quality (wellness check-in, log training buttons)
   - **Impact:** AI feels supportive, not arbitrary
   - **Files:**
     - `angular/src/app/shared/components/ai-mode-explanation/ai-mode-explanation.component.ts`
     - `angular/src/app/features/ai-coach/ai-coach-chat.component.ts`

**Why third:** These enhance the experience but aren't trust-breaking.

**Status:** ✅ All Phase 2.3 items implemented and integrated.

---

## Conclusion

**Executive Summary:**

Phase 2 confirms Phase 1 logic is correct. The system detects, decides, and acts correctly.

**What was failing:** State narration.

**Root cause:** State transitions occurred without visible narrative.

**Solution:** Mandatory 5-Question Contract for every system-level change:
1. What changed
2. Why it changed
3. What this means
4. Who is responsible now
5. What happens next

**Status:** ✅ **ALL PHASE 2 FIXES IMPLEMENTED**

---

## Implementation Status

### ✅ Phase 2.1 — Trust Repair: COMPLETE
- ✅ Coach Override Transparency (notification system, transparency panel, history view)
- ✅ ACWR Before/After Explanations (trend visualization, cause attribution, ownership transitions)
- ✅ Ownership Transition Visibility (badge component, status updates, response timelines)

### ✅ Phase 2.2 — Data Literacy: COMPLETE
- ✅ Data Confidence Indicator (prominent display, visual degradation, impact explanations, actions)
- ✅ Missing Data Explanation (why it matters, days missing, escalation visibility, action paths)
- ✅ Late Log Framing + Approval Flow (neutral tone, ACWR impact, approval status, no limbo states)

### ✅ Phase 2.3 — Motivation & Safety: COMPLETE
- ✅ RTP Phase Celebration + Guidance (celebration moment, progress context, activity instructions, unlock criteria)
- ✅ AI Mode Explanation (conservative mode detection, reason explanations, confidence display, improvement actions)

---

## Components Created

### Shared Components
1. `CoachOverrideNotificationComponent` - Displays coach override notifications with transparency
2. `OwnershipTransitionBadgeComponent` - Shows ownership transition status and timelines
3. `MissingDataExplanationComponent` - Explains missing wellness data impact
4. `RTPPhaseCelebrationComponent` - Celebrates RTP phase advancement
5. `AIModeExplanationComponent` - Explains AI conservative mode

### Enhanced Components
1. `ConfidenceIndicatorComponent` - Enhanced with explanations and actions
2. `AcwrDashboardComponent` - Enhanced alert banner with 5-Question Contract
3. `PlayerDashboardComponent` - Integrated override notifications, transitions, and missing data explanations
4. `TrainingLogComponent` - Enhanced late log framing with neutral tone and ACWR impact
5. `ReturnToPlayComponent` - Integrated phase celebration
6. `AiCoachChatComponent` - Integrated AI mode explanation

### Services Enhanced
1. `OverrideLoggingService` - Added notification creation and recent override fetching
2. `MissingDataDetectionService` - Used for missing wellness status detection
3. `DataConfidenceService` - Used for confidence calculations
4. `OwnershipTransitionService` - Used for transition status tracking

---

## Impact

**Before Phase 2:**
- Silent changes broke trust
- Late logs felt like judgment
- ACWR spikes felt like ambushes
- RTP progress felt flat
- AI mode changes felt random

**After Phase 2:**
- ✅ All state changes follow 5-Question Contract
- ✅ Transparent coach override notifications
- ✅ Clear ACWR trend and cause explanations
- ✅ Visible ownership transitions
- ✅ Prominent data confidence indicators
- ✅ Missing data explanations with actions
- ✅ Neutral late log framing
- ✅ Celebrated RTP phase progress
- ✅ Transparent AI mode explanations

**This is a safety and trust issue, not a UX nice-to-have.**

**Status:** ✅ **ALL PHASES COMPLETE — SYSTEM NOW PROVIDES FULL STATE NARRATION**

