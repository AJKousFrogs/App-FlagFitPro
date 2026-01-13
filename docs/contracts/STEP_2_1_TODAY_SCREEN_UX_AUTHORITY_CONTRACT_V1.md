# TODAY Screen UX Authority Contract — v1

**Document Version:** 1.0  
**Date:** January 6, 2026  
**Status:** Normative (Binding)  
**Scope:** TODAY screen only (all platforms: web, iOS, Android)

---

## SECTION 1 — Core Purpose of TODAY

### Single Primary Purpose
The TODAY screen exists to answer one question with absolute clarity:

> **"What do I do right now to execute today's training plan?"**

TODAY is the execution surface.  
Not strategy. Not history. Not exploration. **Execution.**

### 5-Second Comprehension Requirement
An athlete opening TODAY must understand within 5 seconds:

- Is there something I need to do right now?
- What's different about today?
- Can I start training immediately?

**Visual hierarchy must be:**
1. Largest: Current/next training block  
2. Second: Today's context  
3. Third: Completion status  
4. Fourth: Supporting actions  

### Confusion That Must NEVER Occur
- "Is this today or tomorrow?" → TODAY shows **only today**
- "Which workout should I do?" → ONE plan only
- "Who assigned this?" → Coach/program source always visible
- "Why is this different?" → Overrides visible **before** blocks
- "What if I skip check-in?" → Consequence stated plainly
- "Is this a preview?" → TODAY shows the **complete** session

---

## SECTION 2 — Information Priority Order (Hard Ranking)

**Strict Priority Order (1–9):**
1. Coach alerts / constraints  
2. Flag football practice  
3. Wellness / Check-in  
4. Main training session  
5. Mobility (pre-training)  
6. Foam rolling  
7. Recovery (post-training)  
8. Film room  
9. Merlin guidance  

**Why Coach Alerts Are #1:**  
The coach has real-world, real-time context the system cannot infer. TODAY executes coach intent first, always.

---

## SECTION 3 — Wellness Check-in Authority Rules

### State A: Missing (No Check-in Today)
- **Training Allowed:** Yes  
- **Tone:** Informative  
- **Banner:** Blue info  
- **Rules:**  
  - Full session visible  
  - "Start Anyway" always available  
  - No guilt language  
  - No fake readiness  

### State B: Stale (1–2 Days Old)
- **Training Allowed:** Yes, with warning  
- **Tone:** Actionable warning  
- **Banner:** Amber  
- **Rules:**  
  - Show last known readiness with timestamp  
  - Defaults if >48h  
  - No red styling  

### State C: Fresh (Today)
- **Training Allowed:** Yes  
- **Tone:** Affirming  
- **Rules:**  
  - No banner  
  - Readiness visible  
  - Low readiness adjusts volume automatically  

---

## SECTION 4 — ACWR "Building Baseline" Contract

- **Full session always shown**
- **Tone:** Progress-focused
- **Display:** Small widget only
- **Milestones:** 7 / 14 / 21 days

> "You're building your load baseline—keep logging to unlock injury-risk insights."

---

## SECTION 5 — Flag Football Practice & Team Activities

### Practice Day
- Training adjusted around practice
- One plan only
- Banner always visible

### Film Room Day
- Recovery + mental focus
- No high intensity

### Weather Override
- Coach note takes priority
- No auto-generated replacements

### Rehab During Team Activity
- Rehab always wins
- Team practice visible but excluded

---

## SECTION 6 — External Program Handling

**Always Present:**
- Mobility
- Foam rolling
- Check-in
- Recovery
- Team alerts

**Never Auto-Generated:**
- Main training
- Sets/reps
- Session-specific warm-ups

TODAY is intentionally minimal and respectful.

---

## SECTION 7 — Merlin Authority Boundary

> "Merlin explains and escalates. It never overrides."

- Cannot modify coach plans
- Must refuse unsafe or unauthorized requests
- Explains reasoning clearly without apology

---

## SECTION 8 — Trust & Discipline

**Trust Principles:**
- What you see is what you execute
- No hidden logic
- No artificial urgency

**Discipline Means:**
- Structure through consistency
- Safety through constraints
- Awareness without shame

---

## Appendix A — TODAY Screen State Matrix

| Condition | Training | Banner | Constraint |
|---------|--------|--------|-----------|
| Normal | Yes | None | None |
| No check-in | Yes | Info | Defaults |
| Stale check-in | Yes | Warning | Context |
| Practice | Yes | Info | Session replaced |
| Rehab | Yes | Alert | Heavy blocked |
| Taper | Yes | Info | Volume locked |
| No program | No | Error | Contact coach |

---

## Appendix B — Messaging Templates

- **Check-in Missing:**  
  ℹ️ Check-in not logged yet. Plan uses defaults.

- **Practice Day:**  
  🏈 Flag Practice Today — Training adjusted.

- **Rehab Active:**  
  🏥 Return-to-Play Protocol Active

- **ACWR Building:**  
  Load Management — Building baseline

---

**Maintained By:** Product Architecture Team  
**Enforcement:** Mandatory  
**Review Cycle:** Quarterly  

**Version History:**  
v1.0 — Initial release (2026-01-06)

