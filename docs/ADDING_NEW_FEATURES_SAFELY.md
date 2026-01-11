# Adding New Features Safely

**FlagFit Pro — Safe Extension Playbook**

_Version 1.0 | 29. December 2025_

This document ensures that new features maintain FlagFit Pro's privacy and safety guarantees. Every new metric, dashboard, AI feature, or data source must pass through this checklist.

---

## Table of Contents

1. [Why This Matters](#why-this-matters)
2. [Quick Decision Tree](#quick-decision-tree)
3. [Mandatory Checklist](#mandatory-checklist)
4. [Feature Categories](#feature-categories)
5. [Implementation Patterns](#implementation-patterns)
6. [Code Review Requirements](#code-review-requirements)
7. [Testing Requirements](#testing-requirements)
8. [Documentation Requirements](#documentation-requirements)
9. [Examples](#examples)

---

## Why This Matters

FlagFit Pro has robust privacy controls. But they only work if **every new feature** respects them.

### What Can Go Wrong

| Scenario                                 | Consequence                                 |
| ---------------------------------------- | ------------------------------------------- |
| New metric added without consent check   | Coach sees data player didn't share         |
| AI feature without opt-out check         | Processing without consent (GDPR violation) |
| Dashboard shows raw table data           | Bypasses consent views                      |
| New data not in deletion cascade         | Data retained after account deletion        |
| Minor-specific feature without age check | COPPA violation                             |

### The Golden Rule

> **If it reads player data in a coach context, it MUST go through consent views.**

---

## Quick Decision Tree

Use this flowchart for every new feature:

```
                    ┌─────────────────────────┐
                    │  Does this feature      │
                    │  read player data?      │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                   YES                      NO
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐    ┌─────────────────────┐
        │ Who is viewing?   │    │ Standard feature    │
        └─────────┬─────────┘    │ development process │
                  │              └─────────────────────┘
        ┌─────────┴─────────┐
        │                   │
      COACH              PLAYER (own data)
        │                   │
        ▼                   ▼
┌───────────────────┐  ┌───────────────────┐
│ USE CONSENT VIEWS │  │ Can use raw tables│
│ or ConsentDataReader│ │ but consider using│
│ MANDATORY         │  │ views for         │
└─────────┬─────────┘  │ consistency       │
          │            └───────────────────┘
          ▼
┌───────────────────────────────────────────┐
│ Does it use AI/ML processing?             │
└─────────────────────┬─────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
         YES                      NO
          │                       │
          ▼                       ▼
┌───────────────────┐    ┌───────────────────┐
│ CHECK AI CONSENT  │    │ Continue to       │
│ require_ai_consent│    │ DataState check   │
│ MANDATORY         │    │                   │
└─────────┬─────────┘    └─────────┬─────────┘
          │                        │
          └────────────┬───────────┘
                       ▼
        ┌───────────────────────────────────┐
        │ Does it involve health data?      │
        │ (injury risk, wellness, medical)  │
        └─────────────────┬─────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
             YES                      NO
              │                       │
              ▼                       ▼
    ┌───────────────────┐    ┌───────────────────┐
    │ CHECK HEALTH      │    │ Continue to       │
    │ SHARING CONSENT   │    │ retention check   │
    │ (separate from    │    │                   │
    │ performance)      │    │                   │
    └─────────┬─────────┘    └─────────┬─────────┘
              │                        │
              └────────────┬───────────┘
                           ▼
            ┌───────────────────────────────┐
            │ Is new data being stored?     │
            └─────────────────┬─────────────┘
                              │
                  ┌───────────┴───────────┐
                  │                       │
                 YES                      NO
                  │                       │
                  ▼                       ▼
        ┌───────────────────┐    ┌───────────────────┐
        │ ADD TO DELETION   │    │ Ready for         │
        │ CASCADE           │    │ implementation    │
        │ Update retention  │    │                   │
        │ policies          │    │                   │
        └───────────────────┘    └───────────────────┘
```

---

## Mandatory Checklist

**Copy this checklist into your PR description for any feature involving user data.**

### Privacy & Consent

- [ ] **Consent Check**: If coach-facing, does it use consent views (`v_*_consent`) or `ConsentDataReader`?
- [ ] **AI Consent**: If using AI/ML, does it call `require_ai_consent()` or check `ai_processing_enabled`?
- [ ] **Health Consent**: If showing health data, does it check `health_sharing_enabled` separately?
- [ ] **Age Check**: If feature is sensitive, does it verify parental consent for minors?
- [ ] **Consent Blocked UI**: Does the UI show appropriate message when data is blocked?

### DataState Contract

- [ ] **DataState Returned**: Does the API response include `dataState` field?
- [ ] **Minimum Data Points**: Is the minimum data requirement documented and enforced?
- [ ] **Warnings Included**: Does response include `warnings` array for insufficient data?
- [ ] **UI Handles States**: Does UI display appropriate message for each DataState?

### Data Lifecycle

- [ ] **Deletion Cascade**: Is new data included in account deletion cascade?
- [ ] **Retention Policy**: Is retention period documented?
- [ ] **Anonymization**: If research data, is anonymization implemented?
- [ ] **Audit Logging**: Is access to sensitive data logged?

### Security

- [ ] **RLS Policy**: Does new table have RLS enabled?
- [ ] **Input Validation**: Are inputs validated and sanitized?
- [ ] **No Direct Table Access**: In coach context, no direct queries to protected tables?

### Documentation

- [ ] **Privacy Impact**: Is privacy impact documented?
- [ ] **User-Facing Copy**: Are privacy messages added to `privacy-ux-copy.ts`?
- [ ] **API Docs**: Is new endpoint documented with consent requirements?

---

## Feature Categories

### Category A: Player-Only Features

**Examples:** Personal dashboard, own training log, own metrics

**Requirements:**

- ✅ Can use raw tables (but views recommended)
- ✅ Must return DataState
- ✅ Must be in deletion cascade

**Checklist subset:**

- [ ] DataState returned
- [ ] Deletion cascade updated
- [ ] Input validation

---

### Category B: Coach-Facing Features

**Examples:** Team dashboard, player comparison, squad analytics

**Requirements:**

- ⚠️ MUST use consent views
- ⚠️ MUST return consent_blocked flags
- ⚠️ MUST show privacy messages for blocked players

**Checklist subset:**

- [ ] Uses `v_*_consent` views or `ConsentDataReader`
- [ ] Returns `consent_blocked` per player
- [ ] UI shows "Data Not Shared" message
- [ ] DataState returned
- [ ] CI consent check passes

---

### Category C: AI-Powered Features

**Examples:** Training recommendations, injury predictions, chat assistant

**Requirements:**

- ⚠️ MUST check AI consent before processing
- ⚠️ MUST fail fast if opted out
- ⚠️ MUST NOT store AI results for opted-out users

**Checklist subset:**

- [ ] Calls `require_ai_consent()` or checks `ai_processing_enabled`
- [ ] Returns `AI_CONSENT_REQUIRED` error if opted out
- [ ] UI shows "AI Features Disabled" message
- [ ] No AI processing occurs without consent

---

### Category D: Health/Sensitive Data Features

**Examples:** Injury risk dashboard, wellness tracking, medical records

**Requirements:**

- ⚠️ MUST check health_sharing_enabled (separate from performance)
- ⚠️ Higher audit logging requirements
- ⚠️ May have longer retention (medical records: 7 years)

**Checklist subset:**

- [ ] Checks `health_sharing_enabled` separately
- [ ] Enhanced audit logging
- [ ] Retention policy documented
- [ ] Emergency access procedures (if medical)

---

### Category E: Minor-Specific Features

**Examples:** Youth programs, under-16 features

**Requirements:**

- ⚠️ MUST verify parental consent
- ⚠️ MUST restrict features until verified
- ⚠️ COPPA compliance required

**Checklist subset:**

- [ ] Age check at feature entry
- [ ] Parental consent verification
- [ ] Age-appropriate content only
- [ ] No third-party data sharing

---

## Implementation Patterns

### Pattern 1: Adding a New Metric to Coach Dashboard

```typescript
// ❌ WRONG - Direct table access
async function getNewMetric(coachId: string, teamId: string) {
  const { data } = await supabase
    .from("new_metric_table") // ❌ Direct access!
    .select("*")
    .in("player_id", teamMemberIds);

  return { metrics: data }; // ❌ No dataState!
}

// ✅ CORRECT - Using ConsentDataReader
async function getNewMetric(coachId: string, teamId: string) {
  const reader = new ConsentDataReader();

  const result = await reader.readNewMetric({
    requesterId: coachId,
    teamId: teamId,
    context: AccessContext.COACH_TEAM_DATA,
  });

  return {
    metrics: result.data,
    dataState: result.dataState,
    dataStateInfo: result.dataStateInfo,
    consentInfo: result.consentInfo,
  };
}
```

---

### Pattern 2: Adding an AI Feature

```typescript
// ❌ WRONG - No consent check
async function generateRecommendations(userId: string) {
  const userData = await getUserTrainingData(userId);
  const recommendations = await aiModel.predict(userData); // ❌ No consent!
  return recommendations;
}

// ✅ CORRECT - Fail-fast consent check
async function generateRecommendations(userId: string) {
  // Check AI consent FIRST
  const { error } = await supabase.rpc("require_ai_consent", {
    p_user_id: userId,
  });

  if (error?.message.includes("AI_CONSENT_REQUIRED")) {
    return {
      error: "AI processing disabled",
      code: "AI_CONSENT_REQUIRED",
      message: "Enable AI processing in Privacy Settings to use this feature.",
    };
  }

  // Only process if consent given
  const userData = await getUserTrainingData(userId);
  const recommendations = await aiModel.predict(userData);

  return {
    recommendations,
    dataState: "REAL_DATA",
    aiProcessed: true,
  };
}
```

---

### Pattern 3: Adding Health Data Display

```typescript
// ❌ WRONG - Using performance consent for health data
async function getInjuryRisk(coachId: string, playerId: string) {
  const { data } = await supabase
    .from("v_load_monitoring_consent")
    .select("injury_risk_level") // ❌ Health data needs separate consent!
    .eq("player_id", playerId);

  return data;
}

// ✅ CORRECT - Checking health consent separately
async function getInjuryRisk(
  coachId: string,
  playerId: string,
  teamId: string,
) {
  // Check health sharing consent (separate from performance)
  const { data: consent } = await supabase
    .from("team_consent_settings")
    .select("health_sharing_enabled")
    .eq("player_id", playerId)
    .eq("team_id", teamId)
    .single();

  if (!consent?.health_sharing_enabled) {
    return {
      injuryRisk: null,
      consentBlocked: true,
      blockReason: "health_not_shared",
      message: "Health data requires separate consent from performance data.",
    };
  }

  const { data } = await supabase
    .from("v_load_monitoring_consent")
    .select("injury_risk_level")
    .eq("player_id", playerId);

  return {
    injuryRisk: data?.injury_risk_level,
    consentBlocked: false,
  };
}
```

---

### Pattern 4: Adding New Stored Data

```sql
-- ❌ WRONG - Table without RLS or deletion cascade
CREATE TABLE new_feature_data (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES users(id),  -- No CASCADE!
  data JSONB
);
-- No RLS enabled!

-- ✅ CORRECT - With RLS and deletion cascade
CREATE TABLE new_feature_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE new_feature_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "users_own_data" ON new_feature_data
  FOR ALL USING (player_id = auth.uid());

-- Policy: Coaches see consented data only
CREATE POLICY "coach_consented_data" ON new_feature_data
  FOR SELECT USING (
    player_id = auth.uid()
    OR check_performance_sharing(player_id, get_user_team_id())
  );

-- Add to consent view if coach-facing
-- (See migration 071 for examples)
```

---

### Pattern 5: UI Consent Blocked State

```typescript
// ❌ WRONG - No blocked state handling
@Component({
  template: `
    <div *ngFor="let player of players">
      <span>{{ player.name }}</span>
      <span>{{ player.acwr }}</span>
      <!-- Could be NULL! -->
    </div>
  `,
})
export class TeamDashboard {}

// ✅ CORRECT - Handle consent blocked state
import { getConsentBlockedMessage } from "@shared/utils/privacy-ux-copy";

@Component({
  template: `
    <div *ngFor="let player of players">
      <span>{{ player.name }}</span>

      <ng-container *ngIf="!player.consentBlocked; else blocked">
        <span>{{ player.acwr }}</span>
      </ng-container>

      <ng-template #blocked>
        <app-privacy-message [message]="consentBlockedMessage">
        </app-privacy-message>
      </ng-template>
    </div>
  `,
})
export class TeamDashboard {
  consentBlockedMessage = getConsentBlockedMessage("coach", "single_player");
}
```

---

## Code Review Requirements

### Required Reviewers

| Feature Type          | Required Reviewer                |
| --------------------- | -------------------------------- |
| Any coach-facing data | Privacy Champion                 |
| AI features           | AI Lead + Privacy Champion       |
| Health data           | Privacy Champion + Security Lead |
| Minor data            | Privacy Champion + Legal         |
| New database tables   | DBA + Privacy Champion           |

### Review Checklist for Reviewers

**Privacy Champion must verify:**

- [ ] Consent patterns followed correctly
- [ ] DataState contract implemented
- [ ] Privacy messages use centralized copy
- [ ] No hardcoded privacy strings
- [ ] CI consent check passes

**Security Lead must verify:**

- [ ] RLS policies correct
- [ ] Input validation present
- [ ] No SQL injection vectors
- [ ] Audit logging implemented

---

## Testing Requirements

### Required Tests for Privacy-Sensitive Features

```typescript
// tests/privacy-safety/new-feature.test.js

describe("New Feature Privacy", () => {
  describe("Consent Enforcement", () => {
    it("should return NULL for non-consented player data", async () => {
      // Setup: Player has NOT consented
      const result = await getNewMetric(coachId, nonConsentedPlayerId);

      expect(result.data.sensitiveField).toBeNull();
      expect(result.consentInfo.blockedPlayerIds).toContain(
        nonConsentedPlayerId,
      );
    });

    it("should return data for consented player", async () => {
      // Setup: Player HAS consented
      const result = await getNewMetric(coachId, consentedPlayerId);

      expect(result.data.sensitiveField).not.toBeNull();
      expect(result.consentInfo.blockedPlayerIds).not.toContain(
        consentedPlayerId,
      );
    });

    it("should include consent_blocked flag in response", async () => {
      const result = await getNewMetric(coachId, teamId);

      result.data.forEach((player) => {
        expect(player).toHaveProperty("consent_blocked");
      });
    });
  });

  describe("DataState Contract", () => {
    it("should return dataState in response", async () => {
      const result = await getNewMetric(coachId, teamId);

      expect(result).toHaveProperty("dataState");
      expect([
        "REAL_DATA",
        "NO_DATA",
        "INSUFFICIENT_DATA",
        "DEMO_DATA",
      ]).toContain(result.dataState);
    });

    it("should return INSUFFICIENT_DATA when below threshold", async () => {
      // Setup: Only 5 days of data (need 28)
      const result = await getNewMetric(coachId, teamId);

      expect(result.dataState).toBe("INSUFFICIENT_DATA");
      expect(result.dataStateInfo.warnings).toContain(
        expect.stringContaining("28 days"),
      );
    });
  });

  describe("AI Consent (if applicable)", () => {
    it("should fail fast when AI consent not given", async () => {
      // Setup: User has ai_processing_enabled = false
      const result = await generateRecommendations(optedOutUserId);

      expect(result.error).toBe("AI processing disabled");
      expect(result.code).toBe("AI_CONSENT_REQUIRED");
    });
  });

  describe("Deletion Cascade", () => {
    it("should delete new feature data when user deleted", async () => {
      // Setup: Create data for user
      await createNewFeatureData(userId);

      // Delete user
      await deleteUser(userId);

      // Verify cascade
      const remaining = await getNewFeatureData(userId);
      expect(remaining).toHaveLength(0);
    });
  });
});
```

### CI Integration

Add to your PR:

```yaml
# .github/workflows/pr-checks.yml
privacy-check:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - name: Consent violation check
      run: npm run check:consent -- --strict --ci
    - name: Privacy tests
      run: npm run test:privacy
```

---

## Documentation Requirements

### For Every Privacy-Sensitive Feature

1. **Update API.md**
   - Document consent requirements
   - Document DataState response shape
   - Note which consent views are used

2. **Update privacy-ux-copy.ts** (if new UI states)

   ```typescript
   // Add to privacy-ux-copy.ts
   export const newFeatureMessages = {
     consentBlocked: {
       title: "Feature Data Not Shared",
       reason: "This player has not enabled sharing for this feature.",
       action: "The player can enable sharing in Privacy Settings.",
       icon: "pi-lock",
       severity: "info",
     },
   };
   ```

3. **Update RLS_POLICY_SPECIFICATION.md** (if new protected table)
   - Add table to protected tables list
   - Document consent view mapping

4. **Update THREAT_MODEL.md** (if new attack surface)
   - Add to threat matrix
   - Document mitigations

---

## Examples

### Example A: Adding "Weekly Training Summary" for Coaches

**Feature:** Coaches see weekly summary of team training.

**Checklist:**

| Check              | Status | Notes                              |
| ------------------ | ------ | ---------------------------------- |
| Uses consent views | ✅     | Uses `v_workout_logs_consent`      |
| Returns DataState  | ✅     | `REAL_DATA` or `INSUFFICIENT_DATA` |
| Consent blocked UI | ✅     | Shows count of blocked players     |
| AI consent         | N/A    | No AI processing                   |
| Health consent     | N/A    | Performance data only              |
| Deletion cascade   | N/A    | No new stored data                 |
| RLS policy         | N/A    | Uses existing views                |
| Privacy tests      | ✅     | Added to `weekly-summary.test.js`  |

---

### Example B: Adding "AI Injury Prediction"

**Feature:** AI predicts injury risk based on load patterns.

**Checklist:**

| Check              | Status | Notes                                       |
| ------------------ | ------ | ------------------------------------------- |
| Uses consent views | ✅     | Uses `v_load_monitoring_consent`            |
| Returns DataState  | ✅     | Requires 28 days minimum                    |
| AI consent         | ✅     | Calls `require_ai_consent()`                |
| Health consent     | ✅     | Separate check for `health_sharing_enabled` |
| Consent blocked UI | ✅     | Shows "AI Disabled" or "Health Not Shared"  |
| Deletion cascade   | ✅     | AI predictions deleted with user            |
| Audit logging      | ✅     | Logs AI processing events                   |
| Privacy tests      | ✅     | Full test suite added                       |

---

### Example C: Adding "Youth Training Program"

**Feature:** Specialized programs for under-16 athletes.

**Checklist:**

| Check               | Status | Notes                                       |
| ------------------- | ------ | ------------------------------------------- |
| Age check           | ✅     | Verifies user.birth_date                    |
| Parental consent    | ✅     | Requires `parental_consent.verified = true` |
| Uses consent views  | ✅     | Same as adult features                      |
| Content appropriate | ✅     | No advanced analytics for minors            |
| Third-party sharing | ✅     | Disabled for minors                         |
| Privacy tests       | ✅     | Parental consent flow tested                |

---

## Quick Reference Card

Print this and keep it visible:

```
┌─────────────────────────────────────────────────────────────┐
│           ADDING NEW FEATURES SAFELY                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔒 COACH-FACING DATA?                                       │
│     → Use v_*_consent views or ConsentDataReader             │
│     → Return consent_blocked flags                           │
│     → Show "Data Not Shared" UI                              │
│                                                              │
│  🤖 AI PROCESSING?                                           │
│     → Call require_ai_consent() FIRST                        │
│     → Fail fast if opted out                                 │
│     → Show "AI Disabled" UI                                  │
│                                                              │
│  ❤️ HEALTH DATA?                                             │
│     → Check health_sharing_enabled SEPARATELY                │
│     → Higher audit logging                                   │
│                                                              │
│  👶 MINOR DATA?                                              │
│     → Verify parental consent                                │
│     → Age-appropriate features only                          │
│                                                              │
│  💾 NEW STORED DATA?                                         │
│     → Enable RLS                                             │
│     → Add ON DELETE CASCADE                                  │
│     → Document retention                                     │
│                                                              │
│  📊 ALL FEATURES:                                            │
│     → Return dataState in response                           │
│     → Use centralized privacy-ux-copy.ts                     │
│     → Add privacy tests                                      │
│     → Run npm run check:consent                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

| Document                                                           | Purpose                      |
| ------------------------------------------------------------------ | ---------------------------- |
| [RLS Policy Specification](./RLS_POLICY_SPECIFICATION.md)          | Consent enforcement patterns |
| [Security Guide](./SECURITY.md)                                    | Security architecture        |
| [Threat Model](./THREAT_MODEL.md)                                  | Security threat analysis     |
| [Database Setup](./DATABASE_SETUP.md)                              | Database patterns            |
| [Privacy Incident Runbook](./RUNBOOKS/PRIVACY_INCIDENT.md)         | If something goes wrong      |

---

## Document History

| Version | Date              | Changes         | Author        |
| ------- | ----------------- | --------------- | ------------- |
| 1.0     | 29. December 2025 | Initial release | Security Team |

---

_Športno društvo Žabe - Athletes helping athletes since 2020_
