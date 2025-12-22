# AI Coaching System Revamp

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Implementation Guide

---

## Overview

This document defines a revamped AI coaching system with safety tiers, curated knowledge base, risk classification, and action-oriented recommendations.

---

## Current Design Analysis

### Strengths
- ✅ Good pipeline stages: intent → retrieval → generation → enhancer → caching
- ✅ Personalization hooks (injury, schedule, body metrics, role)
- ✅ Evidence-level indicator and disclaimers planned

### Critical Risks & Gaps
- ❌ Medical/supplement advice is high liability
- ❌ Retrieval sources not governed
- ❌ No safety policy layer
- ❌ Caching can replay unsafe answers
- ❌ No feedback-to-improvement loop

---

## Safety Tier System

### Tier 1: General Training Info (Low Risk)

**Examples:**
- "How do I improve acceleration?"
- "What's the best warm-up routine?"
- "How do I improve my throwing mechanics?"

**Output Rules:**
- ✅ Full guidance allowed
- ✅ No medical disclaimers required
- ✅ Can provide specific techniques and protocols

**Risk Level:** `low`

---

### Tier 2: Injury Prevention & Recovery (Medium Risk)

**Examples:**
- "Prevent hamstring strains"
- "Recovery protocol for sore shoulder"
- "How to avoid overuse injuries"

**Output Rules:**
- ✅ Evidence-based general guidance
- ✅ "Stop/seek care if X" warnings
- ✅ Conservative progressions
- ⚠️ Clear disclaimers: "Not a substitute for medical advice"
- ⚠️ Encourage professional evaluation for persistent issues

**Risk Level:** `medium`

**Response Template:**
```
[Answer with evidence-based guidance]

⚠️ **Important**: If you experience [specific symptoms], 
stop immediately and consult a healthcare professional. 
This guidance is general and may not apply to your specific situation.
```

---

### Tier 3: Supplements / Medical Dosing (High Risk)

**Examples:**
- "How much iron should I take?"
- "What's the dosage for creatine?"
- "Should I take vitamin D supplements?"

**Output Rules:**
- ❌ No direct dosing unless lab values provided
- ✅ Education: what it's for, common ranges cited, risks
- ✅ Clear "talk to clinician / do labs" guidance
- ⚠️ Conservative ranges only
- ⚠️ Strong disclaimers

**Risk Level:** `high`

**Response Template:**
```
[Educational content about the supplement]

⚠️ **Medical Disclaimer**: Supplement dosing should be individualized 
based on lab values, medical history, and professional evaluation. 
The ranges mentioned are general guidelines only.

**Before taking supplements:**
1. Consult with a healthcare provider
2. Get relevant lab tests (if applicable)
3. Consider your medical history and current medications
4. Start with conservative doses

This information is not medical advice and does not replace 
professional medical consultation.
```

---

## Risk Classification Stage

### Intent Classification

**Implementation:**
```typescript
interface IntentClassification {
  intent: 'dosage' | 'timing' | 'safety' | 'how_to' | 'what_is' | 'why' | 'protocol';
  risk_level: 'low' | 'medium' | 'high';
  entities: {
    supplements?: string[];
    injuries?: string[];
    medical_conditions?: string[];
  };
  requires_labs?: boolean;
  requires_professional?: boolean;
}

async function classifyIntent(query: string): Promise<IntentClassification> {
  // Use LLM or rule-based classification
  const classification = await llm.classify({
    query,
    categories: ['dosage', 'timing', 'safety', 'how_to', 'what_is', 'why', 'protocol'],
    risk_keywords: {
      high: ['dosage', 'mg', 'supplement', 'medication', 'iron', 'vitamin'],
      medium: ['injury', 'pain', 'recovery', 'prevent'],
      low: ['technique', 'form', 'warm-up', 'drill']
    }
  });
  
  return classification;
}
```

### Risk Level Determination

**Rules:**
1. **High Risk**: Contains dosage queries, supplement names, medical conditions
2. **Medium Risk**: Contains injury/prevention/recovery keywords
3. **Low Risk**: General training questions

**Implementation:**
```typescript
function determineRiskLevel(classification: IntentClassification): 'low' | 'medium' | 'high' {
  if (classification.intent === 'dosage' || classification.entities.supplements?.length > 0) {
    return 'high';
  }
  if (classification.intent === 'safety' || classification.entities.injuries?.length > 0) {
    return 'medium';
  }
  return 'low';
}
```

---

## Curated Knowledge Base + Source Scoring

### Knowledge Base Structure

**Tiers:**
1. **Curated KB**: Own structured entries, reviewed
2. **Trusted Sources**: Pre-selected journals/position stands
3. **Open Web Fallback**: Optional, flagged as "lower certainty"

**Schema:**
```sql
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('curated', 'trusted', 'web')),
  source_title VARCHAR(500),
  source_url VARCHAR(500),
  source_quality_score DECIMAL(3,2) CHECK (source_quality_score >= 0 AND source_quality_score <= 1),
  publication_date DATE,
  evidence_grade VARCHAR(10) CHECK (evidence_grade IN ('A', 'B', 'C', 'strong', 'moderate', 'limited')),
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_base_topic ON knowledge_base USING GIN(to_tsvector('english', topic));
CREATE INDEX idx_knowledge_base_tags ON knowledge_base USING GIN(tags);
CREATE INDEX idx_knowledge_base_evidence ON knowledge_base(evidence_grade);
CREATE INDEX idx_knowledge_base_risk ON knowledge_base(risk_level);
```

### Source Scoring

**Scoring Criteria:**
- **Curated**: Score = 1.0 (highest confidence)
- **Trusted Sources**: Score = 0.8-0.9 (peer-reviewed journals, position stands)
- **Web Sources**: Score = 0.5-0.7 (depends on domain authority, recency)

**Evidence Grades:**
- **A / Strong**: Meta-analyses, systematic reviews, multiple RCTs
- **B / Moderate**: Single RCTs, well-designed cohort studies
- **C / Limited**: Case studies, expert opinion, anecdotal

**Implementation:**
```typescript
interface KnowledgeSource {
  id: string;
  content: string;
  source_type: 'curated' | 'trusted' | 'web';
  source_title: string;
  source_url?: string;
  source_quality_score: number;
  publication_date?: Date;
  evidence_grade: 'A' | 'B' | 'C' | 'strong' | 'moderate' | 'limited';
}

async function retrieveKnowledge(query: string, riskLevel: string): Promise<KnowledgeSource[]> {
  // 1. Search curated KB first
  const curated = await searchCuratedKB(query, riskLevel);
  
  // 2. Search trusted sources
  const trusted = await searchTrustedSources(query, riskLevel);
  
  // 3. Filter by evidence grade threshold
  const threshold = riskLevel === 'high' ? 'A' : riskLevel === 'medium' ? 'B' : 'C';
  const filtered = [...curated, ...trusted].filter(
    source => compareEvidenceGrade(source.evidence_grade, threshold) >= 0
  );
  
  // 4. Sort by quality score
  return filtered.sort((a, b) => b.source_quality_score - a.source_quality_score);
}
```

---

## Response Generation with Safety Templates

### Template System

**Implementation:**
```typescript
interface ResponseTemplate {
  risk_level: 'low' | 'medium' | 'high';
  structure: {
    answer: string;
    citations: Citation[];
    disclaimers?: string[];
    suggested_actions?: string[];
  };
}

function generateResponse(
  query: string,
  knowledge: KnowledgeSource[],
  riskLevel: 'low' | 'medium' | 'high',
  userContext: UserContext
): ResponseTemplate {
  const template = getTemplateForRiskLevel(riskLevel);
  
  // Generate answer from knowledge sources
  const answer = synthesizeAnswer(query, knowledge, userContext);
  
  // Add citations
  const citations = knowledge.map(source => ({
    title: source.source_title,
    url: source.source_url,
    evidence_grade: source.evidence_grade,
    date: source.publication_date
  }));
  
  // Add disclaimers based on risk level
  const disclaimers = getDisclaimersForRiskLevel(riskLevel);
  
  // Generate suggested actions
  const suggestedActions = generateSuggestedActions(query, answer, userContext);
  
  return {
    risk_level: riskLevel,
    structure: {
      answer,
      citations,
      disclaimers,
      suggested_actions: suggestedActions
    }
  };
}
```

---

## Personalization: Tighten Inputs

### Body Stats Usage

**Current Issue**: "Body stats used for dosage calculations" invites false precision

**Revised Approach:**

1. **Training Recommendations**: Use body stats for volume, recovery, load
   - ✅ "Based on your weight (X kg), consider Y% bodyweight for this exercise"
   - ✅ "Your height suggests focusing on Z movement patterns"

2. **Supplements**: Only broad ranges, only when safe
   - ✅ "Common ranges for your weight class are X-Y mg/day"
   - ❌ Avoid mg/kg dosing unless well-established and low risk
   - ⚠️ Always include "consult healthcare provider" disclaimer

**Implementation:**
```typescript
function personalizeRecommendation(
  recommendation: string,
  bodyStats: BodyStats,
  riskLevel: 'low' | 'medium' | 'high'
): string {
  if (riskLevel === 'high') {
    // Supplements: broad ranges only
    return addBroadRangeGuidance(recommendation, bodyStats);
  } else {
    // Training: specific recommendations
    return addSpecificGuidance(recommendation, bodyStats);
  }
}
```

---

## Action-Oriented AI

### Connect to Platform Features

**Make AI an action engine, not just chat:**

**Examples:**
1. **Load-Based Recommendations**:
   ```
   "Based on your last 7 days, your load is trending up fast. 
   Want me to suggest a lower-load recovery session tomorrow?"
   ```
   → Action: Create recovery session

2. **Volume Tracking**:
   ```
   "Your throwing volume is above your weekly target. 
   I can adjust tomorrow's plan."
   ```
   → Action: Modify training plan

3. **Injury-Aware Recommendations**:
   ```
   "You reported tight hamstrings. I can insert a warm-up 
   protocol in your next two sessions."
   ```
   → Action: Add warm-up exercises

### Recommendation Log

**Schema:**
```sql
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_session_id UUID REFERENCES ai_chat_sessions(id),
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('create_session', 'modify_plan', 'add_exercise', 'read_article', 'ask_coach')),
  reason TEXT NOT NULL,
  recommendation_data JSONB, -- Type-specific data
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  outcome TEXT, -- User feedback on outcome
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
```

**Implementation:**
```typescript
interface Recommendation {
  type: 'create_session' | 'modify_plan' | 'add_exercise' | 'read_article' | 'ask_coach';
  reason: string;
  data: {
    // Type-specific data
    session?: SessionData;
    plan_modification?: PlanModification;
    exercise?: ExerciseData;
    article_url?: string;
  };
}

async function generateRecommendations(
  query: string,
  answer: string,
  userContext: UserContext
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  
  // Analyze answer for actionable insights
  if (detectHighLoad(userContext.loadMetrics)) {
    recommendations.push({
      type: 'create_session',
      reason: 'High ACWR detected, recovery session recommended',
      data: {
        session: generateRecoverySession(userContext)
      }
    });
  }
  
  if (detectInjuryRisk(userContext.injuries)) {
    recommendations.push({
      type: 'add_exercise',
      reason: 'Injury prevention exercises recommended',
      data: {
        exercise: getInjuryPreventionExercise(userContext.injuries[0])
      }
    });
  }
  
  return recommendations;
}
```

---

## Coach Visibility & Accountability

### Team Context Features

**For team contexts, coaches should see:**

1. **Flagged Risk Warnings**:
   - High ACWR warnings for players
   - Injury risk indicators
   - Overtraining alerts

2. **AI Recommendations Made to Players**:
   - What recommendations were made
   - Whether player accepted/rejected
   - Outcomes (if available)

3. **Coach Notes & Overrides**:
   - Coaches can add notes to AI recommendations
   - Coaches can override AI suggestions
   - Coaches can disable AI for specific players

**Schema:**
```sql
CREATE TABLE ai_coach_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES ai_recommendations(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visibility_type VARCHAR(50) NOT NULL CHECK (visibility_type IN ('risk_warning', 'recommendation', 'override')),
  coach_notes TEXT,
  override_reason TEXT,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_coach_visibility_coach ON ai_coach_visibility(coach_id);
CREATE INDEX idx_ai_coach_visibility_player ON ai_coach_visibility(player_id);
CREATE INDEX idx_ai_coach_visibility_type ON ai_coach_visibility(visibility_type);
```

---

## Feedback Loop

### User Feedback Capture

**Schema:**
```sql
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id UUID REFERENCES ai_chat_sessions(id),
  message_id UUID REFERENCES ai_messages(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'helpful', 'not_helpful', 'incorrect', 'unsafe')),
  feedback_reason TEXT,
  outcome TEXT, -- "Did this help?" follow-up
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_type ON ai_feedback(feedback_type);
```

### Improvement Loop

**Process:**
1. Collect feedback on responses
2. Identify patterns (unsafe responses, incorrect information)
3. Update knowledge base based on feedback
4. Retrain classification models
5. Update response templates

**Implementation:**
```typescript
async function processFeedback(feedback: Feedback) {
  // Log feedback
  await saveFeedback(feedback);
  
  // Analyze patterns
  if (feedback.feedback_type === 'unsafe' || feedback.feedback_type === 'incorrect') {
    // Flag for review
    await flagForReview(feedback.message_id, feedback.feedback_reason);
    
    // Update knowledge base if needed
    if (feedback.feedback_reason.includes('incorrect information')) {
      await updateKnowledgeBase(feedback.message_id, feedback.feedback_reason);
    }
  }
  
  // Track outcomes
  if (feedback.outcome) {
    await trackOutcome(feedback.message_id, feedback.outcome);
  }
}
```

---

## API Specification

### POST /api/ai/chat

**Request:**
```typescript
{
  message: string;
  context_snapshot_id?: string; // Optional: use saved context
  team_id?: string; // Optional: team context
  goal?: string; // Optional: specific goal
  time_horizon?: string; // Optional: 'immediate', 'weekly', 'monthly'
}
```

**Response:**
```typescript
{
  answer_markdown: string;
  citations: Array<{
    title: string;
    url?: string;
    evidence_grade: string;
    date?: string;
  }>;
  risk_level: 'low' | 'medium' | 'high';
  suggested_actions: Array<{
    type: 'create_session' | 'modify_plan' | 'add_exercise' | 'read_article' | 'ask_coach';
    reason: string;
    data: any;
  }>;
  chat_session_id: string;
  message_id: string;
}
```

**Pipeline:**
1. Classify intent + risk
2. Build context summary (injury, recent load, role, position)
3. Retrieve sources with scoring
4. Generate with strict template per risk
5. Store message + citations + risk score
6. Return response + suggested next actions

---

## Caching Strategy

### Cache Key Includes Context

**Implementation:**
```typescript
function generateCacheKey(
  query: string,
  userContext: UserContext,
  riskLevel: string
): string {
  // Include user context + time-sensitive flags
  const contextHash = hash({
    userId: userContext.userId,
    injuries: userContext.activeInjuries,
    recentLoad: userContext.recentLoad,
    riskLevel
  });
  
  return `ai:chat:${hash(query)}:${contextHash}`;
}

// Invalidate cache when:
// - Injury status changes
// - New training load indicates risk
// - User updates profile
async function invalidateCache(userId: string, reason: string) {
  const pattern = `ai:chat:*:${hash({ userId })}:*`;
  await cache.deletePattern(pattern);
}
```

---

## Related Documentation

- [WORKFLOW_AND_BUSINESS_LOGIC.md](../WORKFLOW_AND_BUSINESS_LOGIC.md) - Business logic
- [API_OWNERSHIP_MAP.md](./API_OWNERSHIP_MAP.md) - API structure

