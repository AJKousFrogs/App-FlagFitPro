# UX Privacy & Safety Copy Standards

This document defines the standard copy and UI patterns for privacy and safety states in FlagFit Pro. All components displaying privacy-related information MUST use these standardized messages.

---

## Table of Contents

1. [Overview](#overview)
2. [Message Structure](#message-structure)
3. [Consent Blocked States](#consent-blocked-states)
4. [AI Processing States](#ai-processing-states)
5. [Deletion States](#deletion-states)
6. [Data States](#data-states)
7. [Parental Consent States](#parental-consent-states)
8. [Implementation Guide](#implementation-guide)
9. [Component Examples](#component-examples)
10. [Manual Review Checklist](#manual-review-checklist)

---

## Overview

### Goals

1. **Clarity**: Users understand what's happening and why
2. **Actionability**: Users know what they can do
3. **Consistency**: Same states look the same everywhere
4. **Trust**: Transparent about data handling

### Single Source of Truth

All privacy/safety copy lives in:
```
angular/src/app/shared/utils/privacy-ux-copy.ts
```

**Never hardcode privacy messages in components.** Always import from this module.

---

## Message Structure

Every privacy message follows this structure:

```typescript
interface PrivacyMessage {
  title: string;       // Short headline (2-5 words)
  reason: string;      // Why this state exists (1-2 sentences)
  action: string;      // What user can do (1-2 sentences)
  actionLabel?: string; // Button/link text
  helpLink?: string;   // URL for more information
  icon?: string;       // PrimeNG icon class
  severity?: 'info' | 'warning' | 'error' | 'success';
}
```

### Example

```typescript
{
  title: 'Data Not Shared',
  reason: 'This player has not enabled performance data sharing with your team.',
  action: 'The player can enable sharing in their Privacy Settings.',
  actionLabel: 'Learn More',
  helpLink: '/help/privacy-sharing',
  icon: 'pi-lock',
  severity: 'info'
}
```

---

## Consent Blocked States

### Coach Viewing Player (Single)

**When**: Coach tries to view a specific player who hasn't enabled sharing.

| Field | Value |
|-------|-------|
| Title | Data Not Shared |
| Reason | This player has not enabled performance data sharing with your team. |
| Action | The player can enable sharing in their Privacy Settings. |
| Icon | 🔒 (pi-lock) |
| Severity | info |

### Coach Viewing Team (Partial Block)

**When**: Coach dashboard shows some players without sharing enabled.

| Field | Value |
|-------|-------|
| Title | Some Players Have Not Shared Data |
| Reason | Not all team members have enabled performance data sharing. |
| Action | Players can choose to share their data in Privacy Settings. |
| Icon | 👥 (pi-users) |
| Severity | info |

### Player Own Data Not Shared

**When**: Player sees indicator that their data isn't visible to coach.

| Field | Value |
|-------|-------|
| Title | Your Data is Private |
| Reason | Your performance data is not currently shared with your team coaches. |
| Action | Enable sharing in Privacy Settings to let coaches see your progress. |
| Icon | 🛡️ (pi-shield) |
| Severity | info |

### Health Data Blocked

**When**: Health-specific metrics (injury risk) are blocked.

| Field | Value |
|-------|-------|
| Title | Health Data Not Shared |
| Reason | Health-related metrics require separate consent from performance data. |
| Action | Enable health data sharing in your Privacy Settings if you want coaches to see injury risk indicators. |
| Icon | ❤️ (pi-heart) |
| Severity | info |

---

## AI Processing States

### AI Disabled

**When**: User has opted out of AI features.

| Field | Value |
|-------|-------|
| Title | AI Features Disabled |
| Reason | You have opted out of AI-powered analysis and recommendations. |
| Action | Enable AI processing in Privacy Settings to receive personalized insights. |
| Icon | 🤖 (pi-microchip-ai) |
| Severity | info |

### AI Not Consented

**When**: AI available but user hasn't made a choice yet.

| Field | Value |
|-------|-------|
| Title | AI Features Available |
| Reason | AI-powered training recommendations are available but require your consent. |
| Action | Review and enable AI processing to get personalized training insights. |
| Icon | 🤖 (pi-microchip-ai) |
| Severity | info |

### AI Consent Required

**When**: User tries to use AI feature without consent.

| Field | Value |
|-------|-------|
| Title | AI Consent Required |
| Reason | This feature uses AI analysis which requires your explicit consent. |
| Action | Enable AI processing in your Privacy Settings to use this feature. |
| Icon | ⚠️ (pi-exclamation-triangle) |
| Severity | warning |

### AI Enabled

**When**: Confirmation that AI is active.

| Field | Value |
|-------|-------|
| Title | AI Features Active |
| Reason | You have enabled AI-powered analysis for personalized training insights. |
| Action | You can disable AI processing anytime in Privacy Settings. |
| Icon | ✅ (pi-check-circle) |
| Severity | success |

---

## Deletion States

### Deletion Requested

**When**: User has just requested account deletion.

| Field | Value |
|-------|-------|
| Title | Account Deletion Requested |
| Reason | Your account deletion request has been received and is being processed. |
| Action | Your data will be permanently deleted after the 30-day grace period. You can cancel this request anytime before then. |
| Icon | ⏱️ (pi-clock) |
| Severity | warning |

### Deletion Pending

**When**: Deletion is in grace period.

| Field | Value |
|-------|-------|
| Title | Deletion Pending |
| Reason | Your account is scheduled for deletion in {X} days. |
| Action | Cancel the deletion request to keep your account and all your data. |
| Icon | ⏳ (pi-hourglass) |
| Severity | warning |

### Deletion Canceled

**When**: User canceled their deletion request.

| Field | Value |
|-------|-------|
| Title | Deletion Canceled |
| Reason | Your account deletion request has been canceled. |
| Action | Your account and data are safe. No further action needed. |
| Icon | ✅ (pi-check-circle) |
| Severity | success |

---

## Data States

### NO_DATA

**When**: No training data exists for the user.

| Field | Value |
|-------|-------|
| Title | No Data Yet |
| Reason | We don't have any training data for you yet. |
| Action | Start logging your training sessions to see metrics and insights. |
| Icon | 💾 (pi-database) |
| Severity | info |

### INSUFFICIENT_DATA

**When**: Some data exists but not enough for reliable metrics.

| Field | Value |
|-------|-------|
| Title | Building Your Profile |
| Reason | We need more training data to provide reliable metrics. |
| Action | Continue logging sessions. Most metrics need 2-4 weeks of data. |
| Icon | 📈 (pi-chart-line) |
| Severity | info |

#### Metric-Specific Variants

| Metric | Days Required | Custom Message |
|--------|---------------|----------------|
| ACWR | 28 | "ACWR requires 28 days of training data" |
| Acute Load | 7 | "Acute load requires 7 days of data" |
| Chronic Load | 28 | "Chronic load requires 28 days to establish baseline" |
| TSB | 42 | "Training Stress Balance requires 42 days of history" |
| Monotony | 7 | "Monotony requires 7 days of data in a week" |
| Injury Risk | 28 | "Injury risk prediction requires 28+ days of load data" |

### DEMO_DATA

**When**: Showing sample/demonstration data.

| Field | Value |
|-------|-------|
| Title | Demo Data |
| Reason | This is sample data to show you what the app can do. |
| Action | Start logging your own training to see your real metrics. |
| Icon | 👁️ (pi-eye) |
| Severity | warning |

### REAL_DATA

**When**: Showing actual user data.

| Field | Value |
|-------|-------|
| Title | Your Data |
| Reason | These metrics are calculated from your actual training data. |
| Action | Keep logging to maintain accurate and up-to-date insights. |
| Icon | ✅ (pi-check-circle) |
| Severity | success |

---

## Parental Consent States

### Required

| Field | Value |
|-------|-------|
| Title | Parental Consent Required |
| Reason | As you are under 18, some features require parental consent. |
| Action | Ask your parent or guardian to verify consent via email. |
| Severity | warning |

### Pending

| Field | Value |
|-------|-------|
| Title | Awaiting Parental Consent |
| Reason | We've sent a verification email to your parent/guardian. |
| Action | Ask them to check their email and approve the consent request. |
| Severity | info |

### Verified

| Field | Value |
|-------|-------|
| Title | Parental Consent Verified |
| Reason | Your parent/guardian has approved your account. |
| Action | You now have access to all age-appropriate features. |
| Severity | success |

---

## Implementation Guide

### Step 1: Import the Module

```typescript
import { 
  PrivacyUxCopy,
  getConsentBlockedMessage,
  getDataStateMessage,
  DataStateType 
} from '@shared/utils/privacy-ux-copy';
```

### Step 2: Use Helper Functions

```typescript
// Get consent blocked message for coach
const message = getConsentBlockedMessage('coach', 'single_player');

// Get data state message with metric info
const dataMessage = getDataStateMessage('INSUFFICIENT_DATA', {
  currentDataPoints: 14,
  requiredDataPoints: 28,
  metricType: 'acwr'
});
```

### Step 3: Display in Template

```html
<p-message 
  [severity]="message.severity" 
  [icon]="message.icon">
  <ng-template pTemplate="content">
    <div class="privacy-message">
      <h4>{{ message.title }}</h4>
      <p>{{ message.reason }}</p>
      <p>{{ message.action }}</p>
      <a *ngIf="message.helpLink" [routerLink]="message.helpLink">
        {{ message.actionLabel }}
      </a>
    </div>
  </ng-template>
</p-message>
```

### Step 4: Create Reusable Component

```typescript
// privacy-message.component.ts
@Component({
  selector: 'app-privacy-message',
  template: `
    <p-card [styleClass]="'privacy-message-card ' + message.severity">
      <ng-template pTemplate="header">
        <i [class]="'pi ' + message.icon"></i>
        <span>{{ message.title }}</span>
      </ng-template>
      <p class="reason">{{ message.reason }}</p>
      <p class="action">{{ message.action }}</p>
      <ng-template pTemplate="footer">
        <p-button 
          *ngIf="message.actionLabel"
          [label]="message.actionLabel"
          [routerLink]="message.helpLink"
          styleClass="p-button-text">
        </p-button>
      </ng-template>
    </p-card>
  `
})
export class PrivacyMessageComponent {
  @Input() message!: PrivacyMessage;
}
```

---

## Component Examples

### Consent Blocked Card

```html
<app-privacy-message 
  *ngIf="player.consentBlocked"
  [message]="getConsentBlockedMessage('coach')">
</app-privacy-message>
```

### Data State Banner

```html
<div class="data-state-banner" *ngIf="dataState !== 'REAL_DATA'">
  <app-privacy-message [message]="getDataStateMessage(dataState)">
  </app-privacy-message>
</div>
```

### AI Feature Gate

```html
<ng-container *ngIf="aiEnabled; else aiDisabled">
  <!-- AI feature content -->
</ng-container>

<ng-template #aiDisabled>
  <app-privacy-message 
    [message]="PrivacyUxCopy.aiProcessing.consentRequired">
  </app-privacy-message>
</ng-template>
```

---

## Manual Review Checklist

The following components may still need manual review to ensure they use the centralized copy:

### High Priority (Coach-Facing)

- [ ] `coach.component.ts` - Team dashboard
- [ ] `coach-dashboard.component.ts` - Squad overview
- [ ] `player-detail.component.ts` - Individual player view
- [ ] `team-analytics.component.ts` - Team metrics

### Medium Priority (Player-Facing)

- [ ] `privacy-settings.component.ts` - Settings page
- [ ] `profile.component.ts` - User profile
- [ ] `training-safety.component.ts` - Safety indicators
- [ ] `enhanced-analytics.component.ts` - Analytics dashboard

### Low Priority (Shared)

- [ ] `consent-blocked.component.ts` - Already uses patterns
- [ ] `data-state-indicator.component.ts` - May need alignment
- [ ] Toast/notification messages throughout app

### How to Review

1. Search for hardcoded strings like "consent", "blocked", "disabled", "data"
2. Check if component imports from `privacy-ux-copy.ts`
3. Verify message structure matches the standard
4. Ensure help links are correct

---

## Related Documentation

- [Safety Access Layer](./SAFETY_ACCESS_LAYER.md) - Backend consent enforcement
- [Privacy Policy](./PRIVACY_POLICY.md) - Legal privacy policy
- [Player Data Safety Guide](./PLAYER_DATA_SAFETY_GUIDE.md) - Data handling rules

---

*Last updated: 29. December 2025*
*Športno društvo Žabe - Athletes helping athletes since 2020*

