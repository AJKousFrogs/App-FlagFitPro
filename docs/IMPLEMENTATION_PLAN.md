# Implementation Plan for Remaining Gaps

**Date:** January 2026  
**Status:** In Progress

---

## Priority 1: High-Impact User-Facing Features

### 1.1 ACWR Action Required Badge ✅ (Partially Done)
- **Status:** Risk alerts exist, need explicit "Action Required" badge
- **Location:** `coach-dashboard.component.ts`
- **Action:** Add badge/tag to risk alerts when ACWR >1.3

### 1.2 ACWR >1.5 Push/Email Notifications
- **Status:** Dashboard alerts exist, push/email missing
- **Location:** `acwr-alerts.service.ts`, `netlify/functions/push.cjs`
- **Action:** Integrate push notification service for critical ACWR alerts

### 1.3 ACWR Confidence Range Display
- **Status:** Not implemented
- **Location:** `acwr-dashboard.component.ts`
- **Action:** Calculate and display confidence range (e.g., "1.3 (est. 1.2-1.4)")

### 1.4 Player Dashboard Privacy Status Badge
- **Status:** Not implemented
- **Location:** `player-dashboard.component.ts`
- **Action:** Show "Sharing: 4/6 metrics" badge

### 1.5 Coach View Data Sharing Status
- **Status:** Not implemented
- **Location:** `coach-dashboard.component.ts`, `roster` components
- **Action:** Show ✅ ⚠️ ⛔ badges on player cards

---

## Priority 2: Governance & Accountability

### 2.1 Ownership Transition Logging Enhancement
- **Status:** Basic logging exists, needs enhancement
- **Location:** `ownership-transition.service.ts`
- **Action:** Ensure all transitions are logged with proper context

### 2.2 Accountability Tracking System
- **Status:** Not implemented
- **Location:** New service needed
- **Action:** Create accountability tracking with Pending/In Progress/Completed status

---

## Priority 3: Multi-Role Collaboration

### 3.1 Shared Insight Feed
- **Status:** Not implemented
- **Location:** New component/service needed
- **Action:** Create role-filtered feed of professional insights

---

## Priority 4: Offline-First Support

### 4.1 Offline-First for Critical Features
- **Status:** Not implemented
- **Location:** Service worker, offline queue
- **Action:** Implement offline support for game tracker, training log, wellness

---

## Implementation Order

1. ✅ ACWR Action Required Badge (Quick win)
2. ACWR >1.5 Push/Email Notifications (High impact)
3. ACWR Confidence Range (User clarity)
4. Privacy Status Badges (User transparency)
5. Ownership Transition Enhancement (Governance)
6. Accountability Tracking (Governance)
7. Shared Insight Feed (Collaboration)
8. Offline-First Support (UX enhancement)

---

## Estimated Time

- Priority 1: 4-6 hours
- Priority 2: 3-4 hours
- Priority 3: 6-8 hours
- Priority 4: 8-10 hours
- **Total:** 21-28 hours

