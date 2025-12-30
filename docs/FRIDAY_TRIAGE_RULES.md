# Friday Triage Rules

> **Purpose:** Standardized bug triage process for Friday testing  
> **Last Updated:** December 30, 2025  
> **App:** FlagFit Pro - Olympic Flag Football Training Platform

---

## Table of Contents
1. [Severity Definitions](#severity-definitions)
2. [App-Specific Examples](#app-specific-examples)
3. [Fix Now vs After Friday](#fix-now-vs-after-friday)
4. [30-Minute Triage Meeting Agenda](#30-minute-triage-meeting-agenda)

---

## Severity Definitions

### 🚨 Blocker (P0)

**Definition:** Issue that prevents core functionality, violates user privacy/safety, or could cause legal/compliance issues. **Must be fixed before Friday testing can proceed.**

**Characteristics:**
- Data privacy or consent violations
- Security vulnerabilities exposing user data
- Safety-critical calculations showing incorrect/misleading values
- Complete feature failure (white screen, crash)
- Data loss or corruption
- Authentication/authorization bypass

**Response Time:** Immediate (same day)

**Who Can Downgrade:** Only Tech Lead or Product Owner with documented justification

---

### ⚠️ Major (P1)

**Definition:** Issue that significantly impacts user experience or blocks a key workflow, but has a workaround or doesn't violate privacy/safety. **Should be fixed before Friday if time permits.**

**Characteristics:**
- Workflow dead-ends (user stuck, no way forward)
- Incorrect but non-safety-critical data display
- Broken navigation or routes
- Features that partially work but fail under certain conditions
- Performance issues causing >3s delays
- Accessibility barriers (can't complete task with assistive tech)

**Response Time:** Within 24 hours

**Who Can Downgrade:** Tech Lead with documented workaround

---

### 📝 Minor (P2)

**Definition:** Issue that causes inconvenience but doesn't block functionality. **Fix after Friday unless trivial (<5 min fix).**

**Characteristics:**
- Copy/text mismatches or typos
- Small UI inconsistencies (spacing, alignment)
- Non-critical styling issues
- Edge case bugs affecting <5% of users
- Enhancement requests disguised as bugs
- Documentation gaps

**Response Time:** Next sprint

**Who Can Downgrade:** Any team member

---

## App-Specific Examples

### 🚨 Blocker Examples (FlagFit Pro)

| Issue | Why Blocker | Privacy/Safety Impact |
|-------|-------------|----------------------|
| **Coach sees player data without consent** | Violates GDPR/CCPA consent requirements | Player's health data exposed without permission |
| **AI recommendations run when user opted out** | Ignores explicit user preference | Unauthorized data processing |
| **Account deletion doesn't revoke data access** | Incomplete deletion violates privacy law | Deleted user's data still accessible |
| **ACWR shows values when insufficient data (<21 days)** | Misleading injury risk assessment | Athlete could overtrain based on invalid metric |
| **Readiness score displays without minimum wellness check-ins** | False confidence in recovery status | Could lead to training while fatigued |
| **Player health data visible to unauthorized team members** | Role-based access control failure | HIPAA-adjacent violation |
| **Training load recommendations ignore injury status** | Safety-critical oversight | Could worsen existing injury |
| **White screen crash on dashboard load** | Complete app failure | User cannot access any features |

### ⚠️ Major Examples (FlagFit Pro)

| Issue | Why Major | Workaround |
|-------|-----------|------------|
| **Workflow dead-end: can't submit wellness check-in** | Blocks daily tracking routine | Manual entry via admin |
| **Incorrect risk label (shows "Optimal" when "Danger Zone")** | Misleading but visible to user | User can check raw ACWR value |
| **Broken route: /training/schedule returns 404** | Can't access training calendar | Use dashboard quick actions |
| **Session status shows "scheduled" for completed sessions** | Confusing but data is saved | Check training log instead |
| **Charts don't load on analytics page** | Reduced functionality | Data visible in tables |
| **Team invitation email not sent** | Blocks team onboarding | Share invite link manually |
| **Search returns no results for valid queries** | Impacts discoverability | Browse categories instead |
| **Export report downloads empty file** | Feature fails completely | Screenshot as workaround |

### 📝 Minor Examples (FlagFit Pro)

| Issue | Why Minor | Impact |
|-------|-----------|--------|
| **Copy mismatch: "Log Training" vs "Add Session"** | Inconsistent terminology | Slight confusion |
| **Button alignment off by 4px on mobile** | Visual imperfection | No functional impact |
| **Date format inconsistent (MM/DD vs DD/MM)** | Localization issue | Readable either way |
| **Loading spinner appears briefly on cached data** | Unnecessary visual | Milliseconds of delay |
| **Tooltip text truncated on small screens** | Information loss | Core info still visible |
| **Empty state illustration missing** | Visual gap | Text message still shows |
| **Dark mode color slightly off-brand** | Aesthetic issue | Fully functional |
| **Placeholder text not italicized** | Style inconsistency | Clearly placeholder |

---

## Fix Now vs After Friday

### Decision Matrix

```
                    ┌─────────────────────────────────────────┐
                    │           PRIVACY/SAFETY IMPACT         │
                    │     None        Low         High        │
    ┌───────────────┼─────────────────────────────────────────┤
    │               │                                         │
    │  High         │   MAJOR       BLOCKER     BLOCKER      │
    │  (blocks      │   Fix if      Fix now     Fix now      │
    │   workflow)   │   time                                  │
    │               │                                         │
U   ├───────────────┼─────────────────────────────────────────┤
S   │               │                                         │
E   │  Medium       │   MINOR       MAJOR       BLOCKER      │
R   │  (degrades    │   After       Fix if      Fix now      │
    │   experience) │   Friday      time                      │
I   │               │                                         │
M   ├───────────────┼─────────────────────────────────────────┤
P   │               │                                         │
A   │  Low          │   MINOR       MINOR       MAJOR        │
C   │  (annoyance)  │   After       After       Fix if       │
T   │               │   Friday      Friday      time         │
    │               │                                         │
    └───────────────┴─────────────────────────────────────────┘
```

### Quick Decision Checklist

**Fix NOW if ANY of these are true:**
- [ ] User data exposed to unauthorized party
- [ ] Consent preference ignored
- [ ] Safety metric shows misleading value
- [ ] User cannot complete critical path (login, core feature)
- [ ] Data could be lost or corrupted
- [ ] Legal/compliance risk

**Fix BEFORE Friday if time permits:**
- [ ] User can complete task but with friction
- [ ] Workaround exists and is documented
- [ ] Affects >20% of expected test scenarios
- [ ] Fix is <30 minutes and low risk

**Fix AFTER Friday:**
- [ ] Cosmetic/visual only
- [ ] Affects edge cases (<5% of users)
- [ ] Enhancement request, not bug
- [ ] Fix requires >2 hours or is high risk

### Time Budget Rule

| Severity | Max Time to Fix | If Exceeds Budget |
|----------|-----------------|-------------------|
| Blocker | No limit | Keep fixing |
| Major | 2 hours | Document workaround, defer |
| Minor | 30 minutes | Defer to backlog |

---

## 30-Minute Triage Meeting Agenda

### Pre-Meeting (5 min before)
- [ ] Collect all reported issues in shared document
- [ ] Remove duplicates
- [ ] Add reproduction steps where missing

### Meeting Structure

#### 1. Roll Call & Context (2 min)
- Attendees: Tech Lead, QA Lead, Product Owner
- State: "We have X issues to triage. Goal: classify all, identify blockers."

#### 2. Blocker Review (10 min)
- Review each potential blocker
- For each issue:
  - Read title + reproduction steps (30 sec)
  - Quick severity vote (thumbs up/down)
  - If disagreement, 1-minute discussion max
  - Assign owner if Blocker confirmed
- **Output:** List of confirmed blockers with owners

#### 3. Major Review (10 min)
- Same process for Major candidates
- Focus question: "Is there a workaround?"
- If workaround exists, document it
- **Output:** List of Majors, with workarounds noted

#### 4. Minor Batch (3 min)
- Quick scan of remaining issues
- Confirm all are truly Minor
- Move to backlog
- **Output:** Backlog updated

#### 5. Action Items & Close (5 min)
- Recap blockers and owners
- Set next check-in time (if blockers exist)
- Confirm communication plan for testers
- **Output:** Clear next steps

### Meeting Template

```markdown
## Friday Triage - [DATE]

### Attendees
- [ ] Tech Lead: ___
- [ ] QA Lead: ___
- [ ] Product Owner: ___

### Issues Reviewed: X total

### Blockers (Fix Now)
| ID | Title | Owner | ETA |
|----|-------|-------|-----|
|    |       |       |     |

### Majors (Fix If Time)
| ID | Title | Workaround | Owner |
|----|-------|------------|-------|
|    |       |            |       |

### Minors (After Friday)
- Moved X issues to backlog

### Next Check-in
- Time: ___
- Condition: When blockers resolved OR 2 hours

### Notes
- 
```

---

## Quick Reference Card

### Severity at a Glance

| | Blocker 🚨 | Major ⚠️ | Minor 📝 |
|---|---|---|---|
| **Privacy/Safety** | Violated | Not affected | Not affected |
| **User Impact** | Can't proceed | Friction/workaround | Annoyance |
| **Fix Timeline** | Now | Before Friday | After Friday |
| **Escalation** | Immediate | Same day | Sprint |

### FlagFit Pro Critical Paths (Must Work)

1. **Login/Auth Flow** - User can sign in and see dashboard
2. **Wellness Check-in** - User can log daily wellness
3. **Training Log** - User can record training session
4. **ACWR Display** - Shows accurate or "insufficient data" state
5. **Consent Controls** - User can view/modify data sharing preferences
6. **Coach Dashboard** - Coach sees only consented player data

### Emergency Contacts

| Role | Contact | When to Reach |
|------|---------|---------------|
| Tech Lead | [Name] | Blocker found |
| QA Lead | [Name] | Triage needed |
| Product Owner | [Name] | Scope decision |

---

## Appendix: Issue Template

```markdown
## Bug Report

**Severity:** [Blocker/Major/Minor]

**Title:** [Brief description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Screenshots/Video:**


**Environment:**
- Browser: 
- Device: 
- User Role: [Athlete/Coach/Admin]

**Privacy/Safety Impact:** [Yes/No - explain if Yes]

**Workaround:** [If known]
```

---

*Document maintained by FlagFit Pro Team. For questions, contact Tech Lead.*

