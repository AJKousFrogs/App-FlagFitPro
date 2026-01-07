# Push/Email Notification Implementation Verdict

**Date:** January 2026  
**Auditor:** Product Truth Refactor Agent  
**Scope:** ACWR Alert Notifications

---

## Executive Summary

**Verdict:** ⚠️ **INFRASTRUCTURE EXISTS BUT NOT CONNECTED**

Push and email notification infrastructure exists in the codebase but is **NOT connected** to the ACWR alerts service. Only database/dashboard notifications are currently implemented.

---

## Detailed Findings

### Push Notifications

**Infrastructure Status:** ✅ EXISTS
- **Service:** `netlify/functions/push.cjs` - Full Web Push API implementation
- **Client Service:** `angular/src/app/core/services/push-notification.service.ts` - Client-side push subscription management
- **Database:** `user_notification_tokens` table exists for storing push subscriptions

**Connection Status:** ❌ NOT CONNECTED
- `acwr-alerts.service.ts:282-297` contains placeholder code with comments:
  - "Note: This requires the backend to have an endpoint that triggers push notifications"
  - "For now, we'll rely on the notification system to handle push via database triggers"
- **No database triggers** exist that automatically send push notifications when notifications are inserted
- **No API calls** are made to `netlify/functions/push.cjs` from ACWR alerts service

**What Actually Happens:**
- Database notification is created (inserted into `notifications` table)
- Dashboard shows notification badge/count
- Browser notification MAY show if permission granted (local Notification API, not push)
- **NO push notifications are sent**

---

### Email Notifications

**Infrastructure Status:** ✅ EXISTS
- **Service:** `netlify/functions/send-email.cjs` - Full email sending implementation (Gmail, SendGrid, SMTP)
- **Edge Function:** `supabase/functions/send-guardian-email/index.ts` - Resend API integration

**Connection Status:** ❌ NOT CONNECTED
- `acwr-alerts.service.ts` does NOT call any email service
- **No email sending code** exists in ACWR alerts service
- **No database triggers** exist that automatically send emails when notifications are inserted

**What Actually Happens:**
- Database notification is created
- Dashboard shows notification
- **NO emails are sent**

---

## Current Implementation

### What Works

1. **Database Notifications:** ✅
   - Notifications are inserted into `notifications` table
   - `NotificationStateService` loads and displays notifications
   - Dashboard badge count updates
   - Real-time sync via Supabase subscriptions

2. **Browser Notifications (Local):** ⚠️ PARTIAL
   - Uses browser's Notification API (not push)
   - Only works if user has granted permission
   - Only works if browser tab is open
   - Not persistent across devices

### What Doesn't Work

1. **Push Notifications:** ❌
   - Infrastructure exists but not called
   - No automatic push when ACWR alert is created

2. **Email Notifications:** ❌
   - Infrastructure exists but not called
   - No automatic email when ACWR alert is created

---

## Code Evidence

### ACWR Alerts Service (Before Fix)

```typescript
// angular/src/app/core/services/acwr-alerts.service.ts:282-297
// For critical ACWR (>1.5), also trigger push notifications
if (alert.severity === "critical" && alert.acwrValue && alert.acwrValue > 1.5) {
  // Trigger push notification via backend API
  // The backend will handle sending push notifications to registered devices
  for (const coach of coaches) {
    try {
      // Call backend API to send push notification
      // Note: This requires the backend to have an endpoint that triggers push notifications
      // For now, we'll rely on the notification system to handle push via database triggers
      // In production, you'd call: await this.apiService.post(API_ENDPOINTS.push.send, { userId: coach.user_id, ... })
      this.logger.info(`[ACWR Alert] Critical alert logged for coach ${coach.user_id} - push notification will be sent via backend`);
    } catch (pushError) {
      this.logger.warn("Failed to trigger push notification:", pushError);
    }
  }
}
```

**Problem:** Placeholder code that logs but doesn't actually send push notifications.

### ACWR Alerts Service (After Fix)

```typescript
// angular/src/app/core/services/acwr-alerts.service.ts:282-285
await this.supabaseService.client
  .from("notifications")
  .insert(coachNotifications);

// Note: Push/email notifications are NOT currently implemented for ACWR alerts.
// Infrastructure exists (netlify/functions/push.cjs, netlify/functions/send-email.cjs)
// but is not connected to this service. Only database notifications are created.
// Coaches will see notifications in their dashboard when they log in.
```

**Fix:** Removed misleading placeholder code, added clear comment explaining current state.

---

## Documentation Updates Made

### 1. Flow-to-Feature Audit (`FLOW_TO_FEATURE_AUDIT.md`)

**Before:**
```
| **ACWR > 1.5 → Critical Alert** | Push + Email + Dashboard | ✅ | ✅ | Dashboard alert + push notification triggers for critical alerts |
```

**After:**
```
| **ACWR > 1.5 → Critical Alert** | Dashboard notification only | ✅ | ✅ | Dashboard alert + database notification created. Push/email infrastructure exists but not connected to ACWR alerts service. |
```

### 2. User Flow Design (`USER_FLOW_DESIGN.md`)

**Before:**
```
| **Critical** | ACWR > 1.5, Injury flag | Push + Email + Dashboard | After 24h → Superadmin |
```

**After:**
```
| **Critical** | ACWR > 1.5, Injury flag | Push + Email + Dashboard (Design) | Dashboard notification only (Current) | After 24h → Superadmin |
```

Added implementation status note clarifying current vs. design state.

### 3. Phase 5 Cross-Axis Validation (`PHASE_5_CROSS_AXIS_VALIDATION.md`)

Already updated to reflect "NOT PROVEN" status with proof artifacts.

---

## Recommendations

### Option 1: Implement Push/Email (If Desired)

To connect push notifications:
1. Call `netlify/functions/push.cjs` endpoint from `acwr-alerts.service.ts`
2. Use `sendNotificationToUser()` function with coach user IDs
3. Handle errors gracefully (don't fail alert creation if push fails)

To connect email notifications:
1. Call `netlify/functions/send-email.cjs` endpoint from `acwr-alerts.service.ts`
2. Create email template for ACWR alerts
3. Handle errors gracefully

### Option 2: Accept Current State (Recommended for Now)

Current implementation (database/dashboard notifications) is sufficient for MVP:
- Coaches see alerts when they log in
- Real-time sync via Supabase subscriptions
- No external dependencies (push/email services)

---

## Conclusion

**Current State:** Database/dashboard notifications only  
**Infrastructure:** Push/email services exist but not connected  
**Documentation:** Updated to reflect truth  
**Code:** Placeholder code removed, clear comments added

The system now truthfully reflects that only database/dashboard notifications are implemented for ACWR alerts. Push/email infrastructure exists but is not connected and should not be claimed as implemented.

