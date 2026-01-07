# Notification & Escalation Authority Contract — v1

**Contract Version:** 1.0  
**Date:** 2026-01-06  
**Status:** Normative (Binding)  
**Scope:** System notification behavior, escalation triggers, and interruption authority — all platforms  
**Maintained By:** Product Architecture + Engineering  
**Supersedes:** None

**Dependencies (MUST Be Compatible With):**
- Data Consent & Visibility Contract v1 (STEP_2_5)
- Coach Authority & Visibility Contract v1 (CONTRACT_2.4)
- Authorization & Guardrails Contract v1
- TODAY Screen UX Authority Contract v1

---

## SECTION 1 — Scope + Definitions

### 1.1 Scope

This contract defines **when and how the system is permitted to notify, escalate, or interrupt** athletes, coaches, and medical staff. This contract governs:
- Notification authority sources
- Blocking vs non-blocking notifications
- Safety escalation triggers
- Coach vs medical escalation rules
- Merlin escalation limits
- Notification suppression rules
- Forbidden urgency patterns

This contract does NOT govern:
- UI display of notifications (see TODAY Screen UX Authority Contract v1)
- Data visibility (see Data Consent & Visibility Contract v1)
- Coach authority (see Coach Authority & Visibility Contract v1)

### 1.2 Definitions

#### Notification
A system-generated message delivered to athlete, coach, or medical staff. Notifications can be in-app, push, email, or SMS.

#### Escalation
A notification that requires immediate attention and may interrupt normal workflow. Escalations are triggered by safety events or critical system states.

#### Blocking Notification
A notification that prevents user from proceeding until acknowledged. Blocking notifications are used for safety-critical events only.

#### Non-Blocking Notification
A notification that appears but does not prevent user from continuing. Non-blocking notifications are informational or advisory.

#### Notification Authority Source
The entity that authorizes a notification. Sources include: system safety triggers, coach actions, medical staff actions, athlete requests, system failures.

#### Suppression Rule
A condition that prevents notification from being sent (e.g., user has disabled notifications, notification was already sent recently).

---

## SECTION 2 — Notification Authority Sources

### 2.1 System Safety Triggers

The system MAY send notifications when safety triggers fire:

| Trigger | Notification Recipient | Type | Blocking |
|---------|----------------------|------|----------|
| Pain >3/10 | Coach, Physio | Escalation | NO (coach), YES (athlete) |
| New/Worsening Pain | Coach, Physio | Escalation | NO (coach), YES (athlete) |
| ACWR Danger Zone (>1.5) | Coach, S&C Staff | Escalation | NO |
| High RPE Streak (≥9 for 3+ sessions) | Coach | Escalation | NO |
| Rehab Restriction Violation | Coach, Physio | Escalation | YES (athlete) |
| Sustained High Stress (5/5 for 3+ days) | Physio, Medical Staff | Escalation | NO |
| Merlin Safety Keywords | Medical Staff | Escalation | YES (athlete) |

### 2.2 Coach Actions

Coaches MAY trigger notifications when:
- Modifying session (athlete notification required if acknowledgment needed)
- Assigning practice (athlete notification required)
- Sending coach alert (athlete notification required, blocking)
- Overriding ACWR safety boundary (athlete notification required, blocking)

### 2.3 Medical Staff Actions

Medical staff MAY trigger notifications when:
- Assigning rehab protocol (athlete notification required)
- Clearing athlete from rehab (athlete and coach notification required)
- Updating rehab restrictions (athlete notification required)

### 2.4 Athlete Requests

Athletes MAY trigger notifications when:
- Requesting coach contact (coach notification)
- Reporting injury (coach and physio notification, escalation)
- Requesting program modification (coach notification)

### 2.5 System Failures

The system MUST notify when:
- Session resolution failure (athlete notification, error state)
- API failure (athlete notification if affects training access)
- Data corruption (admin notification, escalation)

---

## SECTION 3 — Blocking vs Non-Blocking Notifications

### 3.1 Blocking Notification Criteria

Notifications MUST be blocking when:
- Safety-critical event requires immediate acknowledgment (pain >3, rehab violation)
- Coach alert requires acknowledgment before training
- System failure prevents training access
- Medical staff requires immediate response

**Blocking Behavior:**
- Notification appears as full-screen overlay
- User cannot dismiss via swipe, back navigation, or timeout
- User MUST explicitly acknowledge (button press)
- Training/content blocked until acknowledgment

### 3.2 Non-Blocking Notification Criteria

Notifications MUST be non-blocking when:
- Informational (check-in reminder, session available)
- Advisory (ACWR approaching threshold, stale readiness)
- Compliance (coach views data, session completed)
- System status (maintenance, feature updates)

**Non-Blocking Behavior:**
- Notification appears as banner or in-app message
- User can dismiss via swipe or continue without action
- Notification persists until dismissed or expires (24 hours)

---

## SECTION 4 — Safety Escalation Triggers

### 4.1 Immediate Escalation (Within 1 Hour)

The system MUST escalate immediately when:

| Trigger | Escalation Recipient | Notification Type | Response Required |
|---------|---------------------|-------------------|-------------------|
| Pain >3/10 reported | Coach, Physio | Escalation | Coach: 24h, Physio: 4h |
| New pain area reported | Physio, Medical Staff | Escalation | Physio: 4h |
| Worsening pain trend | Physio, Medical Staff | Escalation | Physio: 4h |
| Rehab restriction violation | Coach, Physio | Escalation | Coach: 24h, Physio: 4h |
| Merlin safety keywords | Medical Staff | Escalation | Medical: 4h (urgent) |

### 4.2 Urgent Escalation (Within 24 Hours)

The system MUST escalate urgently when:

| Trigger | Escalation Recipient | Notification Type | Response Required |
|---------|---------------------|-------------------|-------------------|
| ACWR Danger Zone (>1.5) | Coach, S&C Staff | Escalation | Coach: 48h |
| High RPE Streak (≥9 for 3+) | Coach | Escalation | Coach: 48h |
| Sustained High Stress (5/5 for 3+) | Physio, Medical Staff | Escalation | Medical: 72h |

### 4.3 Escalation Notification Format

Escalation notifications MUST include:
- **Subject:** Clear safety concern (e.g., "Athlete [Name] reported pain >3/10")
- **Priority:** URGENT / HIGH / MEDIUM
- **Recipient:** Who needs to respond
- **Response Deadline:** When response is required
- **Action Required:** What recipient must do
- **Athlete Context:** Minimum necessary data (readiness, ACWR, recent activity)

---

## SECTION 5 — Coach vs Medical Escalation Rules

### 5.1 Coach Escalation Authority

Coaches receive escalations for:
- Compliance issues (missed check-ins, skipped sessions)
- Program effectiveness (high RPE, ACWR danger)
- Safety flags (pain >3, but not medical detail)
- Session modifications requiring acknowledgment

**Coach Escalation Limits:**
- Coaches MUST NOT receive medical detail (pain location, diagnosis) unless athlete opts in
- Coaches MUST NOT receive wellness detail (sleep, stress) unless athlete opts in
- Coaches MUST receive safety flags (existence, not detail)

### 5.2 Medical Escalation Authority

Medical staff receive escalations for:
- Pain reports (full detail: score, location, trend)
- Injury reports (full detail)
- Rehab protocol violations (full detail)
- Sustained high stress (wellness detail)
- Merlin safety keywords (conversation snippet)

**Medical Escalation Authority:**
- Medical staff have role authority to view medical data (non-negotiable)
- Medical staff escalations override athlete consent (safety exception)
- Medical staff MUST respond within 4 hours for urgent escalations

### 5.3 Escalation Routing Rules

**Pain >3/10:**
- Coach: "Athlete has reported pain >3/10" (flag only)
- Physio: Full pain detail (score, location, trend, comments)

**ACWR Danger Zone:**
- Coach: "Athlete's ACWR is [value] (danger zone)" (full detail)
- S&C Staff: Full load metrics (acute, chronic, ACWR, trend)

**Rehab Violation:**
- Coach: "Athlete attempted restricted exercise: [exercise]" (flag only)
- Physio: Full violation detail (exercise, protocol phase, athlete context)

---

## SECTION 6 — Merlin Escalation Limits

### 6.1 Merlin Escalation Authority

Merlin MAY escalate when:
- Safety keywords detected (self-harm, severe distress, emergency)
- Athlete requests immediate help
- Athlete reports injury during conversation
- Athlete expresses suicidal ideation

**Merlin Escalation Limits:**
- Merlin MUST NOT escalate for non-safety concerns (program questions, form cues)
- Merlin MUST NOT escalate for routine wellness issues (low readiness, stale check-in)
- Merlin MUST NOT escalate without explicit safety trigger

### 6.2 Merlin Escalation Process

When Merlin detects safety trigger:
1. Merlin MUST immediately notify medical staff (escalation)
2. Merlin MUST notify athlete: "Your message suggests you might need support. A member of our care team will reach out shortly."
3. Merlin MUST log escalation in audit trail
4. Merlin MUST NOT continue conversation until medical staff responds

**Merlin Escalation Format:**
- **To Medical Staff:** "Merlin has detected potential safety concern in athlete conversation. Immediate review recommended."
- **To Medical Staff:** Conversation snippet (relevant messages only, not full history)
- **To Athlete:** Factual, non-alarming message with support resources

---

## SECTION 7 — Notification Suppression Rules

### 7.1 User-Controlled Suppression

Athletes MAY suppress notifications for:
- Check-in reminders (if they prefer manual check-ins)
- Session availability (if they check app regularly)
- Compliance reminders (if they prefer not to be nagged)

**Suppression Rules:**
- Safety escalations CANNOT be suppressed (non-negotiable)
- Coach alerts CANNOT be suppressed (coach authority)
- Rehab violations CANNOT be suppressed (medical safety)

### 7.2 Rate Limiting Suppression

The system MUST suppress notifications when:
- Same notification sent within last 24 hours (unless escalation)
- More than 3 notifications sent in 1 hour (unless escalation)
- User has disabled notification category

**Rate Limiting Exceptions:**
- Safety escalations bypass rate limiting
- Coach alerts bypass rate limiting
- Medical escalations bypass rate limiting

### 7.3 Duplicate Suppression

The system MUST NOT send duplicate notifications for:
- Same trigger within 24 hours (unless new data)
- Same coach action (unless modification changes)
- Same system event (unless state changes)

---

## SECTION 8 — Forbidden Patterns (Hard Bans)

### 8.1 Hard Bans (10 Required)

#### Ban 1: Manufacturing Urgency
**Forbidden:** System sending notifications with false urgency ("Last chance!", "Expires in 5 minutes!").

**Enforcement:** Notifications MUST use factual language only. No countdown timers or false deadlines.

**Rationale:** Trust violation. False urgency manipulates behavior.

---

#### Ban 2: Nagging Repetition
**Forbidden:** System sending same notification more than once per 24 hours (unless escalation).

**Enforcement:** Backend MUST check notification history before sending. Suppress duplicates.

**Rationale:** User experience. Repetitive notifications are annoying and ineffective.

---

#### Ban 3: Suppressing Safety Escalations
**Forbidden:** System allowing users to suppress safety-critical notifications.

**Enforcement:** Safety escalations MUST bypass suppression rules. Cannot be disabled.

**Rationale:** Safety protection. Critical notifications must always be delivered.

---

#### Ban 4: Escalating Non-Safety Concerns
**Forbidden:** System escalating routine issues (low readiness, stale check-in) as urgent.

**Enforcement:** Escalations MUST be limited to safety triggers only. Routine issues use non-blocking notifications.

**Rationale:** Escalation fatigue. Over-escalation reduces effectiveness.

---

#### Ban 5: Coach Receiving Medical Detail Without Consent
**Forbidden:** System sending medical detail (pain location, diagnosis) to coaches without athlete opt-in.

**Enforcement:** Backend MUST check consent before sending medical detail. Send flag only if consent not granted.

**Rationale:** Privacy protection. Medical data requires explicit consent.

---

#### Ban 6: Merlin Escalating Routine Questions
**Forbidden:** Merlin escalating non-safety conversations to medical staff.

**Enforcement:** Merlin escalation logic MUST detect safety keywords only. Routine questions do not trigger escalation.

**Rationale:** Escalation abuse. Over-escalation wastes medical staff time.

---

#### Ban 7: Blocking Non-Critical Notifications
**Forbidden:** System blocking user workflow for non-critical notifications (check-in reminders, session availability).

**Enforcement:** Blocking notifications MUST be limited to safety-critical events only.

**Rationale:** User experience. Non-critical notifications should not interrupt workflow.

---

#### Ban 8: Sending Notifications to Wrong Recipients
**Forbidden:** System sending athlete data to unauthorized recipients (teammates, unassigned coaches).

**Enforcement:** Backend MUST validate recipient authorization before sending. Return 403 Forbidden if unauthorized.

**Rationale:** Privacy protection. Notifications must respect authorization boundaries.

---

#### Ban 9: Delaying Safety Escalations
**Forbidden:** System delaying safety escalations beyond 1 hour.

**Enforcement:** Safety escalations MUST be sent immediately (within 1 hour of trigger).

**Rationale:** Safety protection. Delayed escalations compromise athlete welfare.

---

#### Ban 10: Modifying Escalation Content
**Forbidden:** System modifying escalation content to hide or minimize safety concerns.

**Enforcement:** Escalations MUST include complete safety detail (minimum necessary for recipient role).

**Rationale:** Safety protection. Escalations must be accurate and complete.

---

## SECTION 9 — Conflict Resolution Rules

### 9.1 When Multiple Escalations Apply

If multiple escalation triggers fire simultaneously:

**Resolution Process:**
1. Identify highest priority trigger (medical > safety > compliance)
2. Send escalation for highest priority trigger
3. Include context from lower priority triggers in escalation message
4. Do NOT send separate escalations (consolidate)

### 9.2 When Suppression Conflicts with Escalation

If user has suppressed notification category but escalation trigger fires:

**Resolution:**
1. Escalation MUST bypass suppression (safety exception)
2. Send escalation notification
3. Log suppression override in audit trail
4. Notify user: "Safety notification sent despite suppression settings"

---

## SECTION 10 — Acceptance Criteria + QA Checklist

### 10.1 Deterministic Output Criteria

Given identical input state, notification system MUST produce:
- [ ] Identical notification recipients (same people notified)
- [ ] Identical notification type (blocking vs non-blocking)
- [ ] Identical escalation priority (same urgency level)

### 10.2 Functional QA Checklist

| Test Case | Expected Result | Pass/Fail |
|-----------|-----------------|-----------|
| Pain >3/10 reported | Coach and physio notified within 1 hour | |
| ACWR danger zone | Coach notified, non-blocking | |
| Coach alert sent | Athlete receives blocking notification | |
| Check-in reminder | Non-blocking, can be dismissed | |
| Rehab violation | Athlete receives blocking notification | |
| Merlin safety keywords | Medical staff notified within 4 hours | |
| Duplicate notification | Suppressed if sent within 24 hours | |
| Safety escalation suppressed | Escalation bypasses suppression | |
| Coach receives medical detail | Only if athlete opts in | |
| Escalation delayed | Sent within required timeframe | |

---

## Appendix A — Document Metadata

**Maintained By:** Product Architecture + Engineering  
**Enforcement:** All notification implementations MUST comply exactly  
**Testing:** QA must verify all escalation triggers and suppression rules  
**Review Cycle:** Quarterly or on contract breach  
**Audit:** Non-compliance is system failure requiring immediate remediation

**Related Documents:**
- Data Consent & Visibility Contract v1 (STEP_2_5)
- Coach Authority & Visibility Contract v1 (CONTRACT_2.4)
- Authorization & Guardrails Contract v1
- TODAY Screen UX Authority Contract v1

**Version History:**
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-06 | Initial notification & escalation contract | Product Architecture |

---

## End of Document

**This contract is law. Notification implementations that deviate are system failures.**

