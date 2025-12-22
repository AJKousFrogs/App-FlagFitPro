# AI Coaching System Revamp Plan
**Safety-First, Context-Aware Architecture**  
**Last Updated:** 2025-01-22

---

## Executive Summary

The current AI coaching system operates with **partial context** due to missing wellness/supplements endpoints, creating risk of generic advice and unsafe recommendations. This plan introduces:

1. **Risk-Tier Classification System** - Prevents unsafe medical/supplement advice
2. **Context-First Pipeline** - AI reads comprehensive user data before responding
3. **Required API Endpoints** - Wellness check-in, supplements log, user context
4. **Feedback Loop** - Tracks recommendation effectiveness

---

## 1. Current State Analysis

### 1.1 What the API Audit Reveals

**Existing Functions (Not Fully Wired):**
- ✅ `user-context.cjs` - Exists but not in API config
- ✅ `update-chatbot-stats.cjs` - Exists but not in API config
- ✅ `load-management.cjs` - Exists but not in API config
- ✅ `nutrition.cjs` - Exists but not in API config
- ✅ `recovery.cjs` - Exists but not in API config

**Missing Critical Endpoints:**
- ❌ `/api/wellness/checkin` - Cannot log wellness data
- ❌ `/api/supplements/log` - Cannot log supplement usage
- ❌ `/api/user/context` - No unified context endpoint
- ❌ `/api/ai/chat` - No dedicated AI chat endpoint
- ❌ `/api/ai/feedback` - No feedback loop

**Impact:**
- AI cannot access wellness check-ins → generic recovery advice
- AI cannot access supplements logs → cannot provide safe supplement guidance
- AI cannot access injury history → may recommend unsafe activities
- No feedback mechanism → cannot improve recommendations

---

## 2. Safety & Product Risk

### 2.1 Risk Tiers

**Tier 1: Training Technique (Safe)**
- ✅ Can provide direct advice
- Examples: "Focus on proper throwing mechanics", "Increase sprint volume gradually"
- No medical implications

**Tier 2: Injury Prevention & Recovery (Moderate Risk)**
- ⚠️ Requires context (injury history, current load, wellness)
- Examples: "Reduce training volume if soreness > 7/10", "Focus on mobility work"
- Must include disclaimers: "If pain persists, consult healthcare provider"

**Tier 3: Supplements/Medical Dosing (High Risk)**
- 🚨 **NEVER provide dosing advice**
- Examples: "Consider iron supplementation" (NOT "Take 65mg iron daily")
- Must always: Educate → Advise labs/clinician → Log intent for follow-up

### 2.2 Safety Rules

**Rule 1: No Medical Diagnosis**
- AI cannot diagnose injuries or medical conditions
- Must redirect to healthcare provider

**Rule 2: No Supplement Dosing**
- AI cannot recommend specific dosages
- Can only: educate about supplements, suggest consulting clinician, log user intent

**Rule 3: Context Required for Tier 2/3**
- Cannot provide Tier 2/3 advice without:
  - Recent wellness check-ins (last 7 days)
  - Injury history
  - Current training load (ACWR)
  - Body metrics (if available)

**Rule 4: Conservative Defaults**
- If context unavailable → default to conservative recommendations
- Example: "Unable to assess readiness without recent wellness data. Defaulting to light activity."

---

## 3. Context-First Architecture

### 3.1 User Context Endpoint

**Endpoint:** `GET /api/user/context`

**Returns:**
```json
{
  "userId": "uuid",
  "role": "player" | "coach" | "admin",
  "position": "QB" | "WR" | "RB" | etc.,
  "teamRole": "captain" | "member" | null,
  "bodyMetrics": {
    "height": 180,
    "weight": 75,
    "lastUpdated": "2025-01-20T10:00:00Z"
  },
  "injuries": [
    {
      "id": "uuid",
      "type": "ankle_sprain",
      "severity": "moderate",
      "occurredAt": "2025-01-15T10:00:00Z",
      "status": "recovering",
      "restrictions": ["no_sprinting", "limited_jumping"]
    }
  ],
  "loadData": {
    "acute": 450,  // Last 7 days
    "chronic": 420, // Last 28 days
    "acwr": 1.07,
    "last7Days": [
      {"date": "2025-01-15", "load": 60},
      {"date": "2025-01-16", "load": 65},
      // ...
    ]
  },
  "wellness": {
    "lastCheckin": "2025-01-21T08:00:00Z",
    "readiness": 7.5,
    "sleep": 7,
    "energy": 6,
    "mood": 8,
    "soreness": 4
  },
  "activeProgram": {
    "id": "uuid",
    "name": "QB Throwing Volume Program",
    "week": 3,
    "day": 5
  },
  "supplements": {
    "recentLogs": [
      {
        "supplement": "iron",
        "loggedAt": "2025-01-20T08:00:00Z",
        "dose": null  // User logged but AI didn't recommend
      }
    ]
  }
}
```

**Implementation:**
- Create `user-context.cjs` function
- Aggregates data from: users, injuries, training_sessions, wellness_checkins, supplements_logs
- Caches for 5 minutes (user context changes slowly)

### 3.2 Wellness Check-In Endpoint

**Endpoint:** `POST /api/wellness/checkin`

**Request:**
```json
{
  "readiness": 7.5,  // 1-10
  "sleep": 7,       // Hours
  "energy": 6,      // 1-10
  "mood": 8,        // 1-10
  "soreness": 4,    // 1-10
  "notes": "Feeling good, slight tightness in hamstring"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "checkinAt": "2025-01-22T08:00:00Z",
    "readiness": 7.5
  }
}
```

**Implementation:**
- Create `wellness.cjs` function
- Stores in `wellness_checkins` table
- Updates user's last wellness timestamp
- Triggers ACWR recalculation if needed

### 3.3 Supplements Log Endpoint

**Endpoint:** `POST /api/supplements/log`

**Request:**
```json
{
  "supplement": "iron",
  "dose": null,  // User logs dose, but AI never recommends
  "takenAt": "2025-01-22T08:00:00Z",
  "notes": "As recommended by doctor"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "loggedAt": "2025-01-22T08:00:00Z"
  }
}
```

**Implementation:**
- Create `supplements.cjs` function
- Stores in `supplements_logs` table
- **Important:** AI can READ logs but never WRITE dosing recommendations

---

## 4. AI Chat Endpoint

### 4.1 Chat Request

**Endpoint:** `POST /api/ai/chat`

**Request:**
```json
{
  "message": "Should I train today?",
  "context": {
    "includeWellness": true,
    "includeLoad": true,
    "includeInjuries": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on your readiness score of 7.5 and ACWR of 1.07, I recommend a moderate-intensity session today. Focus on technique work rather than high-intensity sprints.",
    "riskTier": 2,
    "contextUsed": {
      "wellness": true,
      "load": true,
      "injuries": false
    },
    "recommendations": [
      {
        "type": "training_modification",
        "action": "reduce_intensity",
        "reason": "ACWR slightly elevated"
      }
    ],
    "warnings": [
      {
        "type": "disclaimer",
        "message": "If soreness increases, reduce activity and consult healthcare provider"
      }
    ],
    "suggestedActions": [
      "Focus on mobility work",
      "Light throwing practice",
      "Avoid high-intensity sprints"
    ]
  }
}
```

### 4.2 Implementation Flow

```
1. Receive chat request
2. Fetch user context (GET /api/user/context)
3. Classify question risk tier:
   - Training technique? → Tier 1
   - Injury/recovery? → Tier 2
   - Supplements/medical? → Tier 3
4. Apply safety rules based on tier
5. Generate contextualized response
6. Return response with metadata
```

### 4.3 Risk Tier Classification

**Tier 1 Keywords:**
- "technique", "form", "mechanics", "drills", "practice"
- "sprint", "agility", "strength", "conditioning"

**Tier 2 Keywords:**
- "sore", "pain", "injury", "recovery", "rest", "readiness"
- "load", "volume", "intensity", "fatigue"

**Tier 3 Keywords:**
- "supplement", "vitamin", "iron", "dose", "mg", "medical"
- "diagnosis", "treatment", "medicine"

**Classification Logic:**
```javascript
function classifyRiskTier(message) {
  const lowerMessage = message.toLowerCase();
  
  if (tier3Keywords.some(kw => lowerMessage.includes(kw))) {
    return 3;
  } else if (tier2Keywords.some(kw => lowerMessage.includes(kw))) {
    return 2;
  } else {
    return 1;
  }
}
```

---

## 5. AI Response Generation

### 5.1 Tier 1 Response (Training Technique)

**No context required** - Can provide direct advice:

```
User: "How can I improve my throwing accuracy?"

AI: "Focus on these key mechanics:
1. Maintain consistent release point
2. Follow through completely
3. Keep your eyes on the target throughout the throw

Practice with stationary targets at 10 yards, then gradually increase distance."
```

### 5.2 Tier 2 Response (Injury Prevention)

**Context required** - Must check wellness, load, injuries:

```
User: "Should I train today?"

AI: [Fetches context]
- Readiness: 7.5/10
- ACWR: 1.07 (slightly elevated)
- Last injury: Ankle sprain (2 weeks ago, recovering)

AI Response: "Based on your readiness score of 7.5 and recent ankle sprain recovery, I recommend:
- Light training today (60% intensity)
- Focus on upper body and mobility work
- Avoid high-impact activities
- Monitor ankle for any discomfort

⚠️ If ankle pain increases, stop immediately and consult your healthcare provider."
```

**If context unavailable:**
```
AI Response: "I need your recent wellness data to provide a safe recommendation. Please complete a wellness check-in first, or default to light activity today."
```

### 5.3 Tier 3 Response (Supplements/Medical)

**Never provide dosing** - Always educate and redirect:

```
User: "Should I take iron supplements?"

AI: [Fetches context]
- No recent iron logs
- No iron-related injuries

AI Response: "Iron supplementation can be beneficial for athletes, especially if you're experiencing fatigue or have been diagnosed with iron deficiency.

⚠️ IMPORTANT: I cannot recommend specific dosages. Here's what you should do:
1. Consult with a healthcare provider or sports nutritionist
2. Get blood work done to check iron levels
3. Work with a professional to determine appropriate dosage

I've logged your interest in iron supplementation. Would you like me to remind you to discuss this with your healthcare provider?"
```

**Response includes:**
- Education about the supplement
- Clear disclaimer about dosing
- Recommendation to consult healthcare provider
- Logging of user intent (for coach follow-up)

---

## 6. Feedback Loop

### 6.1 Feedback Endpoint

**Endpoint:** `POST /api/ai/feedback`

**Request:**
```json
{
  "chatId": "uuid",  // Reference to chat message
  "rating": "positive" | "negative",
  "reason": "Helpful advice" | "Too generic" | "Unsafe recommendation" | etc.,
  "followUp": "I tried the recommendation and it helped"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedbackId": "uuid",
    "loggedAt": "2025-01-22T10:00:00Z"
  }
}
```

### 6.2 Feedback Usage

**For AI Improvement:**
- Track which recommendations are rated positively
- Identify patterns in negative feedback
- Adjust response generation based on feedback

**For Coach Visibility:**
- Coaches can see AI interaction history
- Identify users who need follow-up
- Track supplement questions for medical review

---

## 7. Implementation Plan

### Phase 1: Context Infrastructure (Week 1)

**Tasks:**
1. ✅ Create `user-context.cjs` function
   - Aggregates: users, injuries, training_sessions, wellness_checkins, supplements_logs
   - Returns unified context object
   - Caches for 5 minutes

2. ✅ Create `wellness.cjs` function
   - `POST /api/wellness/checkin` handler
   - Stores in `wellness_checkins` table
   - Updates user's last wellness timestamp

3. ✅ Create `supplements.cjs` function
   - `POST /api/supplements/log` handler
   - Stores in `supplements_logs` table
   - Read-only for AI (no dosing recommendations)

4. ✅ Add redirects to `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/api/user/context"
     to = "/.netlify/functions/user-context"
     status = 200
     force = true
   
   [[redirects]]
     from = "/api/wellness/*"
     to = "/.netlify/functions/wellness"
     status = 200
     force = true
   
   [[redirects]]
     from = "/api/supplements/*"
     to = "/.netlify/functions/supplements"
     status = 200
     force = true
   ```

5. ✅ Update `src/api-config.js`:
   ```javascript
   user: {
     context: normalizeEndpoint("/api/user/context"),
   },
   wellness: {
     checkin: normalizeEndpoint("/api/wellness/checkin"),
   },
   supplements: {
     log: normalizeEndpoint("/api/supplements/log"),
   },
   ```

**Acceptance Criteria:**
- User context endpoint returns complete data
- Wellness check-ins can be logged
- Supplements can be logged (without AI dosing)

### Phase 2: AI Chat Endpoint (Week 2)

**Tasks:**
1. ✅ Create `ai/chat.cjs` function
   - Receives chat message
   - Fetches user context
   - Classifies risk tier
   - Generates contextualized response
   - Applies safety rules

2. ✅ Implement risk tier classification
   - Keyword-based classification
   - Fallback to Tier 2 if uncertain

3. ✅ Implement response generation
   - Tier 1: Direct advice
   - Tier 2: Context-aware with disclaimers
   - Tier 3: Education + redirect to healthcare provider

4. ✅ Add redirect to `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/api/ai/chat"
     to = "/.netlify/functions/ai-chat"
     status = 200
     force = true
   ```

**Acceptance Criteria:**
- AI chat endpoint responds with contextualized answers
- Risk tier classification works correctly
- Safety rules prevent unsafe advice

### Phase 3: Feedback Loop (Week 3)

**Tasks:**
1. ✅ Create `ai/feedback.cjs` function
   - Receives feedback on AI responses
   - Stores in `ai_feedback` table
   - Links to chat message

2. ✅ Create feedback UI component
   - Thumbs up/down buttons
   - Optional reason field
   - Follow-up text area

3. ✅ Add redirect to `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/api/ai/feedback"
     to = "/.netlify/functions/ai-feedback"
     status = 200
     force = true
   ```

**Acceptance Criteria:**
- Users can provide feedback on AI responses
- Feedback is stored and linked to chat messages
- Coaches can view feedback for their team members

---

## 8. Database Schema Updates

### 8.1 Required Tables

**`wellness_checkins`** (if not exists):
```sql
CREATE TABLE wellness_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  readiness DECIMAL(3,1) CHECK (readiness >= 1 AND readiness <= 10),
  sleep DECIMAL(3,1),
  energy DECIMAL(3,1) CHECK (energy >= 1 AND energy <= 10),
  mood DECIMAL(3,1) CHECK (mood >= 1 AND mood <= 10),
  soreness DECIMAL(3,1) CHECK (soreness >= 1 AND soreness <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wellness_checkins_user_id ON wellness_checkins(user_id);
CREATE INDEX idx_wellness_checkins_created_at ON wellness_checkins(created_at DESC);
```

**`supplements_logs`** (if not exists):
```sql
CREATE TABLE supplements_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  supplement VARCHAR(100) NOT NULL,
  dose DECIMAL(10,2),  -- User logs dose, AI never recommends
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supplements_logs_user_id ON supplements_logs(user_id);
CREATE INDEX idx_supplements_logs_taken_at ON supplements_logs(taken_at DESC);
```

**`ai_feedback`** (if not exists):
```sql
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chat_id UUID,  -- Reference to chat message
  rating VARCHAR(20) CHECK (rating IN ('positive', 'negative')),
  reason TEXT,
  follow_up TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_chat_id ON ai_feedback(chat_id);
```

---

## 9. Safety Checklist

### Before Launch:
- [ ] Risk tier classification tested
- [ ] Tier 3 responses never include dosing
- [ ] Context required for Tier 2/3 responses
- [ ] Disclaimers included in Tier 2/3 responses
- [ ] Feedback loop implemented
- [ ] Coach visibility into AI interactions
- [ ] Medical disclaimer displayed in UI

### Ongoing Monitoring:
- [ ] Track feedback ratings
- [ ] Monitor for unsafe recommendations
- [ ] Review supplement questions for medical follow-up
- [ ] Update keyword lists based on user questions

---

## 10. Example AI Interactions

### Example 1: Safe Training Advice (Tier 1)
```
User: "How can I improve my sprint speed?"

AI: "Focus on these key areas:
1. Proper running form - maintain forward lean, drive knees up
2. Strength training - squats, deadlifts, plyometrics
3. Sprint technique drills - A-skips, B-skips, high knees
4. Gradual volume increase - add 10% volume per week

Start with 3x20m sprints, rest 2 minutes between sets."
```

### Example 2: Context-Aware Recovery (Tier 2)
```
User: "Should I train today?"

AI: [Fetches context]
- Readiness: 6/10
- ACWR: 1.15 (elevated)
- Last wellness: 2 days ago
- Recent injury: None

AI Response: "Your readiness is moderate (6/10) and ACWR is elevated (1.15). I recommend:
- Light activity today (50% intensity)
- Focus on mobility and recovery work
- Avoid high-intensity training
- Complete another wellness check-in tomorrow

⚠️ If soreness increases or readiness drops below 5, take a rest day."
```

### Example 3: Supplement Education (Tier 3)
```
User: "Should I take iron supplements?"

AI: [Fetches context]
- No recent iron logs
- No iron-related injuries

AI Response: "Iron supplementation can benefit athletes, especially if experiencing fatigue or diagnosed deficiency.

⚠️ IMPORTANT: I cannot recommend specific dosages. Please:
1. Consult healthcare provider or sports nutritionist
2. Get blood work to check iron levels
3. Work with professional to determine appropriate dosage

I've logged your interest. Would you like me to remind you to discuss this with your healthcare provider?"
```

---

**Document Status:** ✅ Ready for Implementation  
**Priority:** 🔴 Critical (Required for safe AI coaching)

