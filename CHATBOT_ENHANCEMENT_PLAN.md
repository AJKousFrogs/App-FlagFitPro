# Chatbot Enhancement Implementation Plan

## Overview

This document outlines a comprehensive enhancement plan for the FlagFit AI Chatbot to make it role-aware, deeply personalized, and properly governed. The implementation is divided into three main phases:

1. **Role-Aware Chatbot** - Different behavior for athlete/coach/admin and domestic/international teams
2. **Deep Personalization** - Integration with user profile data (body metrics, injury history, training schedule, position)
3. **Knowledge Governance** - Evidence-based categorization and league approval system

---

## Phase 1: Role-Aware Chatbot

### 1.1 Database Schema Updates

#### Add Team Type Field

```sql
-- Migration: Add team type and region fields
ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_type VARCHAR(20) DEFAULT 'domestic'
  CHECK (team_type IN ('domestic', 'international'));
ALTER TABLE teams ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS country_code VARCHAR(3);

CREATE INDEX IF NOT EXISTS idx_teams_type ON teams(team_type);
CREATE INDEX IF NOT EXISTS idx_teams_region ON teams(region);
```

#### Create Chatbot Context Table

```sql
-- Store user context for chatbot personalization
CREATE TABLE IF NOT EXISTS chatbot_user_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role and team context
  user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('player', 'coach', 'admin')),
  primary_team_id UUID REFERENCES teams(id),
  team_type VARCHAR(20), -- 'domestic', 'international'

  -- Personalization preferences
  preferred_topics TEXT[], -- Topics user frequently asks about
  expertise_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'

  -- Usage statistics
  total_queries INTEGER DEFAULT 0,
  last_query_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_chatbot_context_user ON chatbot_user_context(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_context_role ON chatbot_user_context(user_role);
```

### 1.2 Role-Based Response Templates

**File**: `src/js/utils/role-aware-response-generator.js`

```typescript
class RoleAwareResponseGenerator {
  constructor(userContext) {
    this.userContext = userContext; // { role, teamType, position, etc. }
  }

  /**
   * Adjusts response based on user role
   */
  adjustForRole(baseResponse, intent, entities) {
    const { role, teamType } = this.userContext;

    // Coach-specific enhancements
    if (role === "coach") {
      return this.enhanceForCoach(baseResponse, intent, entities);
    }

    // Admin-specific enhancements
    if (role === "admin") {
      return this.enhanceForAdmin(baseResponse, intent, entities);
    }

    // Athlete-specific (default)
    return this.enhanceForAthlete(baseResponse, intent, entities);
  }

  enhanceForCoach(response, intent, entities) {
    // Coaches get content about:
    // - Stat entry and tracking
    // - Schedule design and periodization
    // - Team management
    // - Player development protocols

    if (intent === "protocol" || entities.training?.length > 0) {
      return (
        response +
        "\n\n**💡 Coach Tip:** Consider tracking these metrics in your training logs:\n" +
        "- Volume (sets × reps × load)\n" +
        "- RPE (Rate of Perceived Exertion)\n" +
        "- Recovery markers (sleep, HRV)\n" +
        "- Player feedback scores"
      );
    }

    if (entities.supplements?.length > 0) {
      return (
        response +
        "\n\n**📊 For Your Team:** Monitor supplement compliance and track any side effects. " +
        "Consider creating a team nutrition protocol document."
      );
    }

    return response;
  }

  enhanceForAthlete(response, intent, entities) {
    // Athletes get more self-training protocols
    // Focus on individual performance and recovery

    if (intent === "protocol") {
      return (
        response +
        "\n\n**📱 Track This:** Log your sessions in the FlagFit app to monitor progress over time."
      );
    }

    return response;
  }

  enhanceForAdmin(response, intent, entities) {
    // Admins get system-level information
    // Can include analytics and governance info

    return (
      response +
      "\n\n**🔧 Admin Note:** This response is based on " +
      `${this.getEvidenceLevel(response)} evidence. ` +
      "Review knowledge base entries for quality control."
    );
  }

  /**
   * Adjusts for team type (domestic vs international)
   */
  adjustForTeamType(response, entities) {
    const { teamType } = this.userContext;

    if (teamType === "international") {
      // International teams may have different regulations
      // Different competition schedules
      // Different recovery protocols due to travel

      if (entities.recovery?.length > 0) {
        return (
          response +
          "\n\n**🌍 International Consideration:** " +
          "When traveling across time zones, adjust recovery protocols. " +
          "Consider jet lag management strategies."
        );
      }

      if (entities.training?.length > 0) {
        return (
          response +
          "\n\n**🌍 International Note:** " +
          "Be aware of different competition calendars and adjust periodization accordingly."
        );
      }
    }

    return response;
  }

  getEvidenceLevel(response) {
    // Extract evidence level from response metadata
    // This would be set by the answer generator
    return "moderate"; // Placeholder
  }
}
```

### 1.3 Integration Points

**File**: `src/js/components/chatbot.js` (modifications)

```javascript
// In FlagFitChatbot class, add:
async loadUserContext() {
  try {
    // Fetch user context from API
    const response = await fetch('/.netlify/functions/user-context', {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (response.ok) {
      const context = await response.json();
      this.userContext = context;
      return context;
    }
  } catch (error) {
    logger.warn('Failed to load user context:', error);
  }

  // Fallback: use default context
  this.userContext = {
    role: 'player',
    teamType: 'domestic'
  };
  return this.userContext;
}

// In getResponse method, add role-aware processing:
async getResponse(userMessage) {
  // ... existing code ...

  // Load user context if not already loaded
  if (!this.userContext) {
    await this.loadUserContext();
  }

  // Generate base response
  let answer = answerGenerator.generateAnswer(parsedQuestion, knowledgeEntry, articles);

  // Apply role-aware adjustments
  if (this.roleAwareGenerator) {
    answer = this.roleAwareGenerator.adjustForRole(
      answer,
      parsedQuestion.intent,
      parsedQuestion.entities
    );
    answer = this.roleAwareGenerator.adjustForTeamType(
      answer,
      parsedQuestion.entities
    );
  }

  // ... rest of existing code ...
}
```

---

## Phase 2: Deep Personalization

### 2.1 Database Schema for User Profile Data

The following tables already exist and can be used:

- `users` table: `height_cm`, `weight_kg`, `position`, `birth_date`
- `injuries` table: injury history
- `training_sessions` table: training schedule
- `player_profiles` table: comprehensive profile data

### 2.2 Personalization Service

**File**: `src/js/services/personalization-service.js`

```javascript
class PersonalizationService {
  constructor(userId) {
    this.userId = userId;
    this.profileCache = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getUserProfile() {
    if (
      this.profileCache &&
      Date.now() - this.profileCache.timestamp < this.cacheTimeout
    ) {
      return this.profileCache.data;
    }

    try {
      const response = await fetch(
        `/.netlify/functions/user-profile?userId=${this.userId}`,
      );
      if (response.ok) {
        const profile = await response.json();
        this.profileCache = {
          data: profile,
          timestamp: Date.now(),
        };
        return profile;
      }
    } catch (error) {
      logger.error("Failed to load user profile:", error);
    }

    return null;
  }

  /**
   * Enriches parsed question with user profile data
   */
  async enrichQuestion(parsedQuestion) {
    const profile = await this.getUserProfile();
    if (!profile) return parsedQuestion;

    // Add body metrics if not already in question
    if (!parsedQuestion.entities.bodyStats) {
      parsedQuestion.entities.bodyStats = {};
    }

    if (profile.height_cm && !parsedQuestion.entities.bodyStats.height) {
      parsedQuestion.entities.bodyStats.height = profile.height_cm;
    }

    if (profile.weight_kg && !parsedQuestion.entities.bodyStats.weight) {
      parsedQuestion.entities.bodyStats.weight = profile.weight_kg;
    }

    // Add position context
    if (profile.position) {
      parsedQuestion.entities.position = profile.position;
    }

    // Add injury history context
    if (profile.injuries && profile.injuries.length > 0) {
      parsedQuestion.entities.injuryHistory = profile.injuries.map((i) => ({
        type: i.type,
        status: i.status,
        severity: i.severity,
      }));
    }

    // Add training schedule context
    if (profile.trainingFrequency) {
      parsedQuestion.entities.trainingSchedule = {
        frequency: profile.trainingFrequency,
        typicalDuration: profile.typicalDuration,
      };
    }

    return parsedQuestion;
  }

  /**
   * Generates personalized recommendations based on profile
   */
  generatePersonalizedRecommendations(parsedQuestion, baseAnswer) {
    const { bodyStats, position, injuryHistory, trainingSchedule } =
      parsedQuestion.entities;

    let personalized = baseAnswer;

    // Position-specific recommendations
    if (position) {
      personalized += this.getPositionSpecificAdvice(
        position,
        parsedQuestion.intent,
      );
    }

    // Injury-aware recommendations
    if (injuryHistory && injuryHistory.length > 0) {
      const activeInjuries = injuryHistory.filter((i) =>
        ["active", "recovering", "monitoring"].includes(i.status),
      );

      if (activeInjuries.length > 0) {
        personalized +=
          "\n\n**⚠️ Injury Considerations:** " +
          `Based on your injury history, be cautious with ${this.getInjuryRiskAreas(activeInjuries)}. ` +
          "Consider consulting with a healthcare provider before starting new protocols.";
      }
    }

    // Training schedule-aware recommendations
    if (trainingSchedule) {
      personalized += this.getScheduleAwareAdvice(
        trainingSchedule,
        parsedQuestion.intent,
      );
    }

    return personalized;
  }

  getPositionSpecificAdvice(position, intent) {
    const positionAdvice = {
      QB: {
        protocol:
          "\n\n**🏈 QB-Specific:** Focus on throwing mechanics and lower body power development.",
        recovery:
          "\n\n**🏈 QB-Specific:** Pay special attention to shoulder and core recovery.",
        training:
          "\n\n**🏈 QB-Specific:** Include rotational power and accuracy drills.",
      },
      WR: {
        protocol:
          "\n\n**🏈 WR-Specific:** Emphasize speed, agility, and route-running precision.",
        recovery:
          "\n\n**🏈 WR-Specific:** Focus on hamstring and hip flexor recovery.",
        training:
          "\n\n**🏈 WR-Specific:** Include sprint mechanics and change-of-direction work.",
      },
      // ... other positions
    };

    return positionAdvice[position]?.[intent] || "";
  }

  getInjuryRiskAreas(injuries) {
    const riskAreas = injuries.map((i) => i.type).join(", ");
    return riskAreas || "these areas";
  }

  getScheduleAwareAdvice(schedule, intent) {
    if (intent === "protocol" && schedule.frequency < 3) {
      return (
        "\n\n**📅 Schedule Note:** With your current training frequency, " +
        "focus on quality over quantity. Ensure adequate recovery between sessions."
      );
    }
    return "";
  }
}
```

### 2.3 Backend API Endpoint

**File**: `netlify/functions/user-profile.cjs`

```javascript
exports.handler = async (event, context) => {
  const userId = event.queryStringParameters?.userId;
  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "userId required" }),
    };
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Get user basic info
    const userResult = await pool.query(
      `SELECT id, height_cm, weight_kg, position, birth_date, role
       FROM users WHERE id = $1`,
      [userId],
    );

    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    const user = userResult.rows[0];

    // Get active injuries
    const injuriesResult = await pool.query(
      `SELECT type, severity, status, start_date, recovery_date
       FROM injuries
       WHERE user_id = $1 AND status IN ('active', 'recovering', 'monitoring')
       ORDER BY start_date DESC`,
      [userId],
    );

    // Get training frequency (last 30 days)
    const trainingResult = await pool.query(
      `SELECT 
         COUNT(*) as session_count,
         AVG(duration_minutes) as avg_duration,
         AVG(intensity_level) as avg_intensity
       FROM training_sessions
       WHERE user_id = $1 
         AND session_date >= CURRENT_DATE - INTERVAL '30 days'
         AND status = 'completed'`,
      [userId],
    );

    // Get primary team info
    const teamResult = await pool.query(
      `SELECT t.id, t.name, t.team_type, t.region
       FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1 AND tm.status = 'active'
       ORDER BY tm.joined_at DESC
       LIMIT 1`,
      [userId],
    );

    const profile = {
      ...user,
      injuries: injuriesResult.rows,
      trainingFrequency: trainingResult.rows[0]?.session_count || 0,
      typicalDuration: trainingResult.rows[0]?.avg_duration || null,
      primaryTeam: teamResult.rows[0] || null,
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  } finally {
    await pool.end();
  }
};
```

---

## Phase 3: Knowledge Governance

### 3.1 Database Schema Updates

```sql
-- Add governance fields to knowledge_base_entries
ALTER TABLE knowledge_base_entries ADD COLUMN IF NOT EXISTS
  approval_status VARCHAR(20) DEFAULT 'pending'
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'experimental'));

ALTER TABLE knowledge_base_entries ADD COLUMN IF NOT EXISTS
  approval_level VARCHAR(20) DEFAULT 'league'
  CHECK (approval_level IN ('league', 'coach', 'research', 'experimental'));

ALTER TABLE knowledge_base_entries ADD COLUMN IF NOT EXISTS
  approved_by UUID REFERENCES users(id);
ALTER TABLE knowledge_base_entries ADD COLUMN IF NOT EXISTS
  approved_at TIMESTAMP;
ALTER TABLE knowledge_base_entries ADD COLUMN IF NOT EXISTS
  approval_notes TEXT;

ALTER TABLE knowledge_base_entries ADD COLUMN IF NOT EXISTS
  research_source_ids UUID[]; -- Links to research_articles
ALTER TABLE knowledge_base_entries ADD COLUMN IF NOT EXISTS
  source_quality_score DECIMAL(3,2); -- 0.0 to 1.0

-- Create index for approval status
CREATE INDEX IF NOT EXISTS idx_kb_approval_status ON knowledge_base_entries(approval_status);
CREATE INDEX IF NOT EXISTS idx_kb_approval_level ON knowledge_base_entries(approval_level);

-- Add governance tracking
CREATE TABLE IF NOT EXISTS knowledge_base_governance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES knowledge_base_entries(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'flagged', 'updated'
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gov_log_entry ON knowledge_base_governance_log(entry_id);
CREATE INDEX IF NOT EXISTS idx_gov_log_action ON knowledge_base_governance_log(action);
```

### 3.2 Knowledge Base Service Updates

**File**: `src/js/services/knowledge-base-service.js` (modifications)

```javascript
async searchKnowledgeBase(query, category = null, options = {}) {
  const {
    requireApproval = true, // Only return approved entries by default
    includeExperimental = false, // Include experimental entries
    minQualityScore = 0.5 // Minimum source quality score
  } = options;

  // Build query with governance filters
  let searchQuery = `
    SELECT kbe.*
    FROM knowledge_base_entries kbe
    WHERE (
      kbe.answer ILIKE $1
      OR kbe.question ILIKE $1
      OR kbe.topic ILIKE $1
    )
  `;

  const params = [`%${query}%`];
  let paramIndex = 2;

  // Add category filter
  if (category) {
    searchQuery += ` AND kbe.entry_type = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  // Add approval filter
  if (requireApproval) {
    if (includeExperimental) {
      searchQuery += ` AND kbe.approval_status IN ('approved', 'experimental')`;
    } else {
      searchQuery += ` AND kbe.approval_status = 'approved'`;
    }
  }

  // Add quality filter
  searchQuery += ` AND (kbe.source_quality_score IS NULL OR kbe.source_quality_score >= $${paramIndex})`;
  params.push(minQualityScore);
  paramIndex++;

  // Order by quality and evidence strength
  searchQuery += `
    ORDER BY
      kbe.approval_status = 'approved' DESC,
      kbe.source_quality_score DESC NULLS LAST,
      kbe.evidence_strength DESC,
      kbe.query_count DESC
    LIMIT $${paramIndex}
  `;
  params.push(limit || 5);

  // Execute query...
}
```

### 3.3 Response Enhancement with Evidence Indicators

**File**: `src/js/utils/response-enhancer.js` (additions)

```javascript
addEvidenceIndicators(response, knowledgeEntry) {
  if (!knowledgeEntry) return response;

  const { approval_status, approval_level, evidence_strength, source_quality_score } = knowledgeEntry;

  let indicators = '\n\n---\n**📚 Evidence Information:**\n';

  // Approval status
  if (approval_status === 'approved') {
    indicators += '✅ **League-Approved** - This information has been reviewed and approved.\n';
  } else if (approval_status === 'experimental') {
    indicators += '🔬 **Experimental** - This is emerging research, use with caution.\n';
  } else {
    indicators += '⏳ **Pending Review** - This information is awaiting approval.\n';
  }

  // Evidence strength
  if (evidence_strength) {
    const strengthEmoji = {
      'strong': '🟢',
      'moderate': '🟡',
      'limited': '🟠'
    };
    indicators += `${strengthEmoji[evidence_strength] || '⚪'} **Evidence Level:** ${evidence_strength}\n`;
  }

  // Source quality
  if (source_quality_score !== null) {
    const qualityPercent = Math.round(source_quality_score * 100);
    indicators += `📊 **Source Quality:** ${qualityPercent}%\n`;
  }

  // Approval level
  if (approval_level) {
    const levelLabels = {
      'league': 'Official League Guidelines',
      'coach': 'Coach-Reviewed Protocol',
      'research': 'Research-Based',
      'experimental': 'Experimental Protocol'
    };
    indicators += `📋 **Source:** ${levelLabels[approval_level] || approval_level}\n`;
  }

  indicators += '\n**⚠️ Disclaimer:** Always consult with healthcare professionals before making significant changes to your training or nutrition.';

  return response + indicators;
}
```

---

## Implementation Order & Timeline

### Week 1: Foundation

1. ✅ Create database migrations for role-aware context
2. ✅ Create `chatbot_user_context` table
3. ✅ Add team type fields to teams table
4. ✅ Create user-context API endpoint

### Week 2: Role-Aware Implementation

1. ✅ Build `role-aware-response-generator.js`
2. ✅ Integrate role detection in chatbot
3. ✅ Test role-specific responses
4. ✅ Add team type adjustments

### Week 3: Personalization

1. ✅ Build `personalization-service.js`
2. ✅ Create user-profile API endpoint
3. ✅ Integrate profile data into question parsing
4. ✅ Add position-specific and injury-aware responses

### Week 4: Knowledge Governance

1. ✅ Add governance fields to knowledge_base_entries
2. ✅ Update knowledge base service with approval filters
3. ✅ Add evidence indicators to responses
4. ✅ Create admin interface for knowledge base approval

---

## Testing Checklist

### Role-Aware Testing

- [ ] Coach receives stat entry and schedule design content
- [ ] Athlete receives self-training protocols
- [ ] Admin receives system-level information
- [ ] International teams get travel/jet lag considerations
- [ ] Domestic teams get standard protocols

### Personalization Testing

- [ ] Body metrics (height/weight) used in nutrition calculations
- [ ] Position-specific advice appears for QB, WR, etc.
- [ ] Active injuries trigger warnings
- [ ] Training frequency affects protocol recommendations
- [ ] Missing profile data gracefully handled

### Knowledge Governance Testing

- [ ] Only approved entries shown by default
- [ ] Experimental entries marked appropriately
- [ ] Evidence indicators display correctly
- [ ] Quality scores filter low-quality sources
- [ ] Admin can approve/reject entries

---

## Next Steps

**Choose your implementation priority:**

1. **"Make it role-aware"** → Start with Phase 1 (Role-Aware Chatbot)
2. **"Design DB tables for conversation logs"** → Add conversation logging schema
3. **"Turn this into a microservice behind an API"** → Create chatbot API service

Let me know which direction you'd like to pursue first, and I'll provide the detailed implementation code!
