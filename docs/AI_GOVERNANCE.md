# AI Governance Specification

## Document Purpose

This specification defines the governance framework for AI/ML features in FlagFit Pro, ensuring compliance with GDPR Article 22 (automated decision-making) and the privacy promises made in `angular/src/assets/legal/privacy-policy.md`.

**Source Document:** `angular/src/assets/legal/privacy-policy.md` v1.0 (29. December 2025)
**Spec Version:** 1.0
**Last Updated:** 29. December 2025

---

## 1. AI Features Overview

_Source: privacy-policy.md Section 3.3 "AI Processing"_

### 1.1 Current AI Capabilities

| Feature                      | Description                          | Service            | Decision Type |
| ---------------------------- | ------------------------------------ | ------------------ | ------------- |
| **Training Suggestions**     | Recommends workouts based on history | `AIService`        | Assisted      |
| **Injury Risk Assessment**   | Estimates injury probability         | `ACWRService`      | Assisted      |
| **Performance Predictions**  | Forecasts performance trends         | `AIService`        | Assisted      |
| **AI Coach Chat**            | Conversational training guidance     | `AiChatService`    | Assisted      |
| **Nutrition Analysis**       | Analyzes meal patterns               | `NutritionService` | Assisted      |
| **Recovery Recommendations** | Suggests recovery protocols          | `RecoveryService`  | Assisted      |
| **Context Analysis**         | Real-time training insights          | `AIService`        | Assisted      |

### 1.2 Decision Classification

| Type          | Definition                                     | User Impact            | Human Oversight        |
| ------------- | ---------------------------------------------- | ---------------------- | ---------------------- |
| **Automated** | System makes decision without human input      | Binding effect on user | Required before action |
| **Assisted**  | System provides recommendation, user decides   | Advisory only          | User is the oversight  |
| **Hybrid**    | System recommends, human reviews before action | Conditional            | Built into workflow    |

**Current Status:** All FlagFit Pro AI features are **Assisted** - they provide recommendations only. The user always makes the final decision.

---

## 2. Automated vs Assisted Decisions

_Source: privacy-policy.md Section 7.7 "Rights Related to Automated Decision-Making"_

### 2.1 Decision Matrix

| Feature                | Input Data                                    | Output                    | Binding?           | Category     |
| ---------------------- | --------------------------------------------- | ------------------------- | ------------------ | ------------ |
| Training Suggestions   | Training history, performance, upcoming games | Suggested workout         | No - user chooses  | **Assisted** |
| Injury Risk Score      | Wellness data, training load, ACWR            | Risk level (low/med/high) | No - informational | **Assisted** |
| Performance Prediction | Historical performance metrics                | Predicted trend           | No - informational | **Assisted** |
| AI Coach Response      | User question, context                        | Text response             | No - advisory      | **Assisted** |
| Nutrition Suggestion   | Food logs, goals                              | Meal recommendation       | No - user chooses  | **Assisted** |
| Recovery Protocol      | Fatigue indicators, sleep                     | Recovery suggestion       | No - user chooses  | **Assisted** |

### 2.2 What We Do NOT Do (Automated Decisions)

The following would constitute automated decisions with legal/significant effects and are **NOT implemented**:

- ❌ Automatically restricting access based on AI assessment
- ❌ Automatically modifying training plans without user action
- ❌ Automatically sharing data based on AI recommendations
- ❌ Automatically enrolling users in programs based on predictions
- ❌ Making health diagnoses or medical recommendations

### 2.3 Safeguards Against Automated Decisions

```typescript
// All AI outputs are wrapped in recommendation format
interface AIRecommendation<T> {
  suggestion: T;
  confidence: number;
  reasoning: string;
  disclaimer: string;
  requiresUserAction: true; // Always true - user must act
  isBinding: false; // Always false - never binding
}
```

---

## 3. Human Oversight Framework

_Source: privacy-policy.md Section 3.3 "Request human review of any AI-generated recommendation"_

### 3.1 Oversight Levels

| Level                      | Description                        | Trigger              | Implementation                     |
| -------------------------- | ---------------------------------- | -------------------- | ---------------------------------- |
| **L0: User Self-Review**   | User evaluates AI suggestion       | Always (default)     | UI presents suggestion, user acts  |
| **L1: Flag for Attention** | AI flags high-risk recommendations | Risk level = high    | Visual warning, additional context |
| **L2: Coach Review**       | Coach reviews before athlete sees  | Team setting enabled | Coach approval workflow            |
| **L3: DPO Review**         | Manual review by DPO               | User request         | Support ticket + manual review     |

### 3.2 When Human Review Occurs

#### Automatic Triggers (L1)

| Condition              | Trigger                           | Action                             |
| ---------------------- | --------------------------------- | ---------------------------------- |
| High injury risk       | ACWR > 1.5 or risk_level = 'high' | Show warning banner + suggest rest |
| Unusual recommendation | Confidence < 0.5                  | Add disclaimer + show reasoning    |
| Health-related advice  | Category = 'health'               | Add medical disclaimer             |
| Contradictory data     | Conflicting inputs detected       | Request data verification          |

#### User-Requested Review (L3)

```
User clicks "Request Human Review"
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Create Support Ticket                                       │
│  - Capture AI recommendation                                 │
│  - Capture user context                                      │
│  - Capture user's concern                                    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  DPO/Support Review                                          │
│  - Review AI logic                                           │
│  - Verify data inputs                                        │
│  - Provide human assessment                                  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Response to User                                            │
│  - Explain AI reasoning                                      │
│  - Provide human perspective                                 │
│  - Suggest alternatives if needed                            │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 UI Integration Points

| Screen             | AI Feature                | Oversight UI                                  |
| ------------------ | ------------------------- | --------------------------------------------- |
| Dashboard          | Training suggestion cards | "Why this suggestion?" + "Not for me" buttons |
| Training Form      | AI-filled suggestions     | "Use suggestion" / "Customize" toggle         |
| Injury Risk Widget | Risk score display        | "Learn more" + "Request review" links         |
| AI Coach Chat      | Chat responses            | "Was this helpful?" + "Request human review"  |
| Wellness Check     | Recovery recommendations  | "Apply" / "Skip" buttons                      |

---

## 4. Audit Trail Requirements

_Source: privacy-policy.md Section 3.3, GDPR Article 22_

### 4.1 What We Log

| Event                 | Data Captured                          | Retention | Purpose               |
| --------------------- | -------------------------------------- | --------- | --------------------- |
| AI Request            | User ID, input data hash, timestamp    | 1 year    | Debugging, compliance |
| AI Response           | Recommendation, confidence, risk level | 1 year    | Audit trail           |
| User Action           | Accepted/rejected/modified, timestamp  | 1 year    | Feedback loop         |
| Human Review Request  | User ID, recommendation ID, concern    | 2 years   | Compliance            |
| Human Review Response | Reviewer ID, outcome, notes            | 2 years   | Compliance            |

### 4.2 Audit Log Schema

```sql
CREATE TABLE public.ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- For grouping related events
  event_type TEXT NOT NULL, -- 'request', 'response', 'user_action', 'review_request', 'review_response'
  feature TEXT NOT NULL, -- 'training_suggestion', 'injury_risk', 'ai_chat', etc.

  -- Request details
  input_data_hash TEXT, -- SHA256 of input (not raw data)
  input_summary JSONB, -- Non-PII summary of inputs

  -- Response details
  recommendation_id TEXT,
  recommendation_type TEXT,
  confidence DECIMAL(3,2),
  risk_level TEXT,

  -- User action
  user_action TEXT, -- 'accepted', 'rejected', 'modified', 'ignored'
  modification_summary TEXT,

  -- Review details
  review_requested BOOLEAN DEFAULT false,
  reviewer_id UUID,
  review_outcome TEXT,
  review_notes TEXT,

  -- Metadata
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user queries
CREATE INDEX idx_ai_audit_user ON ai_audit_log(user_id, created_at DESC);

-- Index for compliance queries
CREATE INDEX idx_ai_audit_reviews ON ai_audit_log(review_requested, created_at DESC)
  WHERE review_requested = true;
```

### 4.3 Audit Service Implementation

```typescript
// core/services/ai-audit.service.ts
@Injectable({ providedIn: "root" })
export class AIAuditService {
  async logRequest(params: {
    userId: string;
    feature: string;
    inputSummary: Record<string, unknown>;
  }): Promise<string> {
    const sessionId = crypto.randomUUID();
    await this.supabase.from("ai_audit_log").insert({
      user_id: params.userId,
      session_id: sessionId,
      event_type: "request",
      feature: params.feature,
      input_data_hash: await this.hashData(params.inputSummary),
      input_summary: this.sanitizeForLog(params.inputSummary),
    });
    return sessionId;
  }

  async logResponse(params: {
    sessionId: string;
    userId: string;
    feature: string;
    recommendationId: string;
    confidence: number;
    riskLevel: string;
    modelVersion: string;
  }): Promise<void> {
    await this.supabase.from("ai_audit_log").insert({
      user_id: params.userId,
      session_id: params.sessionId,
      event_type: "response",
      feature: params.feature,
      recommendation_id: params.recommendationId,
      confidence: params.confidence,
      risk_level: params.riskLevel,
      model_version: params.modelVersion,
    });
  }

  async logUserAction(params: {
    sessionId: string;
    userId: string;
    feature: string;
    recommendationId: string;
    action: "accepted" | "rejected" | "modified" | "ignored";
    modification?: string;
  }): Promise<void> {
    await this.supabase.from("ai_audit_log").insert({
      user_id: params.userId,
      session_id: params.sessionId,
      event_type: "user_action",
      feature: params.feature,
      recommendation_id: params.recommendationId,
      user_action: params.action,
      modification_summary: params.modification,
    });
  }

  private async hashData(data: unknown): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private sanitizeForLog(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    // Remove PII, keep only structural info
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "number") {
        sanitized[key] = value;
      } else if (typeof value === "boolean") {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = `[array:${value.length}]`;
      } else {
        sanitized[key] = "[redacted]";
      }
    }
    return sanitized;
  }
}
```

---

## 5. Opt-Out Mechanisms

_Source: privacy-policy.md Section 3.3 "Turn off AI processing entirely"_

### 5.1 Opt-Out Levels

| Level                 | Scope                  | Effect                     | UI Location                        |
| --------------------- | ---------------------- | -------------------------- | ---------------------------------- |
| **Global AI Opt-Out** | All AI features        | Manual mode for everything | Settings > Privacy > AI Processing |
| **Feature-Specific**  | Individual AI features | Disable specific AI        | Settings > Privacy > AI Features   |
| **Session-Level**     | Current session only   | Temporary disable          | Quick toggle in feature UI         |

### 5.2 Opt-Out Implementation

```typescript
// core/services/ai-preferences.service.ts
export interface AIPreferences {
  globalEnabled: boolean;
  features: {
    trainingSuggestions: boolean;
    injuryRisk: boolean;
    performancePredictions: boolean;
    aiCoach: boolean;
    nutritionAnalysis: boolean;
    recoveryRecommendations: boolean;
  };
  sessionOverride: boolean | null; // null = use saved, true/false = override
}

@Injectable({ providedIn: "root" })
export class AIPreferencesService {
  private preferences = signal<AIPreferences>(this.loadPreferences());

  readonly isAIEnabled = computed(() => {
    const prefs = this.preferences();
    if (prefs.sessionOverride !== null) return prefs.sessionOverride;
    return prefs.globalEnabled;
  });

  readonly isFeatureEnabled = (feature: keyof AIPreferences["features"]) => {
    return computed(() => {
      if (!this.isAIEnabled()) return false;
      return this.preferences().features[feature];
    });
  };

  async setGlobalEnabled(enabled: boolean): Promise<void> {
    const prefs = { ...this.preferences(), globalEnabled: enabled };
    await this.savePreferences(prefs);
    this.preferences.set(prefs);

    // Log consent change
    await this.consentService.updateConsent("ai_processing", enabled);
  }

  async setFeatureEnabled(
    feature: keyof AIPreferences["features"],
    enabled: boolean,
  ): Promise<void> {
    const prefs = {
      ...this.preferences(),
      features: { ...this.preferences().features, [feature]: enabled },
    };
    await this.savePreferences(prefs);
    this.preferences.set(prefs);
  }

  setSessionOverride(enabled: boolean | null): void {
    this.preferences.update((p) => ({ ...p, sessionOverride: enabled }));
  }
}
```

### 5.3 Graceful Degradation

When AI is disabled, features degrade gracefully:

| Feature                 | With AI                      | Without AI               |
| ----------------------- | ---------------------------- | ------------------------ |
| Training Suggestions    | Personalized recommendations | Generic templates        |
| Injury Risk             | Calculated risk score        | Manual ACWR display only |
| Performance Predictions | Trend forecasts              | Historical charts only   |
| AI Coach                | Conversational guidance      | FAQ/knowledge base       |
| Nutrition Analysis      | Pattern analysis             | Manual logging only      |
| Recovery                | Personalized protocols       | Generic guidelines       |

---

## 6. Model Training Data Boundaries

_Source: privacy-policy.md Section 3.2 "We Do NOT Use Your Data To... Make money in any way"_

### 6.1 Data Usage Rules

| Data Type             | Used for Inference?   | Used for Training?          | Shared Externally? |
| --------------------- | --------------------- | --------------------------- | ------------------ |
| User training data    | ✅ Yes (with consent) | ❌ No                       | ❌ No              |
| User wellness data    | ✅ Yes (with consent) | ❌ No                       | ❌ No              |
| User health data      | ✅ Yes (with consent) | ❌ No                       | ❌ No              |
| Anonymized aggregates | ✅ Yes                | ⚠️ Only if fully anonymized | ❌ No              |
| Public sports science | N/A                   | ✅ Yes (pre-training)       | N/A                |

### 6.2 User Data Exclusion

**Principle:** User data is NEVER used to train or fine-tune models.

**Implementation:**

```typescript
// All AI calls use inference-only endpoints
const AI_CONFIG = {
  // We use pre-trained models only
  modelSource: "pretrained", // NOT 'fine-tuned-on-user-data'

  // User data is input only, never stored for training
  dataUsage: "inference-only",

  // No data leaves our infrastructure
  externalSharing: false,

  // Models we use
  models: {
    chat: "groq/llama-3.1-70b", // Pre-trained, no fine-tuning
    embeddings: "local", // Local embeddings, no external API
    predictions: "internal-rules", // Rule-based, not ML
  },
};
```

### 6.3 What Powers Our AI

| Component                | Source                                            | User Data Involved?                                  |
| ------------------------ | ------------------------------------------------- | ---------------------------------------------------- |
| Training recommendations | Rule-based algorithms + sports science literature | User's own data for personalization (inference only) |
| Injury risk (ACWR)       | Published ACWR research formulas                  | User's own data for calculation                      |
| AI Coach                 | Groq LLM (pre-trained) + sports knowledge base    | User's question (not stored for training)            |
| Performance predictions  | Statistical models on user's own history          | User's own data (not shared)                         |

### 6.4 Third-Party AI Services

| Service     | Purpose            | Data Sent                          | Data Retention by Third Party |
| ----------- | ------------------ | ---------------------------------- | ----------------------------- |
| Groq API    | AI Coach responses | User question + anonymized context | Not retained (stateless API)  |
| None others | -                  | -                                  | -                             |

**Groq API Usage:**

- Questions are sent without user identifiers
- No conversation history stored on Groq
- No fine-tuning on our data
- Stateless API calls only

---

## 7. Required Code Modules

### 7.1 Services to Create/Update

| Module                 | Status    | Priority | Description                           |
| ---------------------- | --------- | -------- | ------------------------------------- |
| `AIAuditService`       | 🔴 Create | P0       | Audit logging for all AI interactions |
| `AIPreferencesService` | 🔴 Create | P0       | AI opt-out management                 |
| `HumanReviewService`   | 🔴 Create | P1       | Human review request handling         |
| `AIService`            | 🟢 Exists | Update   | Add audit logging calls               |
| `AiChatService`        | 🟢 Exists | Update   | Add audit logging, review requests    |
| `ACWRService`          | 🟢 Exists | Update   | Add audit logging                     |

### 7.2 Database Migrations Required

| Migration                      | Priority | Tables Affected         |
| ------------------------------ | -------- | ----------------------- |
| `create_ai_audit_log`          | P0       | `ai_audit_log`          |
| `create_ai_preferences`        | P0       | `ai_preferences`        |
| `create_human_review_requests` | P1       | `human_review_requests` |
| `add_ai_consent_type`          | P0       | `user_consents`         |

### 7.3 UI Components Required

| Component                      | Location                            | Priority |
| ------------------------------ | ----------------------------------- | -------- |
| `AIPreferencesComponent`       | `features/settings/privacy/ai/`     | P0       |
| `AIDisclaimerComponent`        | `shared/components/ai-disclaimer/`  | P0       |
| `RequestReviewButtonComponent` | `shared/components/request-review/` | P1       |
| `AIExplanationModalComponent`  | `shared/components/ai-explanation/` | P1       |
| `AIToggleComponent`            | `shared/components/ai-toggle/`      | P0       |

### 7.4 API Endpoints Required

| Endpoint                            | Method  | Purpose                            |
| ----------------------------------- | ------- | ---------------------------------- |
| `/api/ai/preferences`               | GET/PUT | Get/update AI preferences          |
| `/api/ai/audit`                     | GET     | Get user's AI audit log            |
| `/api/ai/review-request`            | POST    | Request human review               |
| `/api/ai/explain/:recommendationId` | GET     | Get explanation for recommendation |

---

## 8. Compliance Checklist

| Requirement              | Policy Section | Implementation Status | Notes                              |
| ------------------------ | -------------- | --------------------- | ---------------------------------- |
| AI is advisory only      | 3.3, 7.7       | 🟢 Implemented        | All AI outputs are recommendations |
| User can opt out         | 3.3            | 🔴 Not implemented    | Need AIPreferencesService          |
| Explanations available   | 3.3            | 🟡 Partial            | Some features have reasoning       |
| Human review available   | 3.3            | 🔴 Not implemented    | Need review workflow               |
| Audit trail              | GDPR Art. 22   | 🔴 Not implemented    | Need AIAuditService                |
| No training on user data | 3.2            | 🟢 Implemented        | Using pre-trained models only      |
| Risk level indicators    | 3.3            | 🟡 Partial            | AiChatService has risk levels      |
| Disclaimers shown        | 3.3            | 🟡 Partial            | Some features have disclaimers     |

---

## 9. Governance Review Process

### 9.1 Quarterly Review

| Review Item           | Reviewer  | Frequency |
| --------------------- | --------- | --------- |
| Audit log analysis    | DPO       | Quarterly |
| User opt-out rates    | DPO       | Quarterly |
| Human review requests | DPO       | Monthly   |
| AI accuracy metrics   | Tech Lead | Quarterly |
| Policy compliance     | DPO       | Quarterly |

### 9.2 Incident Response

If an AI feature causes harm or user complaint:

1. **Immediate:** Disable feature for affected user
2. **24 hours:** Review audit logs, document incident
3. **48 hours:** DPO assessment, notify user of findings
4. **7 days:** Implement fix or permanently disable feature
5. **30 days:** Post-incident review, update governance

### 9.3 Change Management

Before deploying new AI features:

1. ✅ Privacy impact assessment
2. ✅ Update this governance document
3. ✅ Update privacy-policy.md if needed
4. ✅ Implement audit logging
5. ✅ Implement opt-out mechanism
6. ✅ Add appropriate disclaimers
7. ✅ Test graceful degradation
8. ✅ DPO sign-off

---

**Document Version:** 1.0
**Created:** 29. December 2025
**Owner:** DPO (Aljoša Kous)
**Review Cycle:** Quarterly
