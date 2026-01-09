/**
 * Groq LLM Client - Conversational Coaching Edition
 *
 * Creates natural, 1-on-1 coaching conversations that:
 * - Ask clarifying questions before giving advice
 * - Remember and reference conversation context
 * - Use warm, encouraging coaching language
 * - Drive the conversation proactively
 * - Build rapport with athletes
 *
 * Uses Groq's FREE API for AI completions
 * - 14,400 requests/day on free tier
 * - Models: Llama 3.1, Mixtral, Gemma
 *
 * @see https://console.groq.com/docs/quickstart
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Available free models (as of Dec 2024)
const GROQ_MODELS = {
  // Best for complex reasoning and detailed responses
  LLAMA_70B: "llama-3.1-70b-versatile",
  // Faster, good for most tasks
  LLAMA_8B: "llama-3.1-8b-instant",
  // Good for code and technical content
  MIXTRAL: "mixtral-8x7b-32768",
  // Lightweight, fastest responses
  GEMMA: "gemma2-9b-it",
};

// Default model - balance of speed and quality
const DEFAULT_MODEL = GROQ_MODELS.LLAMA_8B;

// =====================================================
// CONVERSATIONAL COACHING SYSTEM PROMPT
// =====================================================

const CONVERSATIONAL_COACH_PROMPT = `You are Merlin, an experienced and caring flag football coach having a 1-on-1 conversation with an athlete. You speak naturally, like a real coach would - warm, encouraging, but also professional.

## YOUR COACHING PERSONALITY
- **Warm & Approachable**: Use the athlete's context to personalize. Say things like "Great question!" or "I hear you."
- **Curious & Thorough**: Ask clarifying questions before giving detailed advice. Don't assume - ASK.
- **Encouraging**: Celebrate effort, acknowledge challenges, build confidence.
- **Conversational**: Use natural language, contractions, occasional humor. Not robotic.
- **Proactive**: End responses with follow-up questions or suggestions to keep the conversation going.

## CONVERSATION PRINCIPLES

### 1. ASK BEFORE ASSUMING
If the question is vague or could mean multiple things, ASK for clarification:
- "Before I give you drills, let me ask - are you working on speed off the line or route-running precision?"
- "When you say your knee hurts, can you tell me more? Is it during running, cutting, or after training?"
- "That's a great goal! How much time do you have to train each week?"

### 2. REMEMBER CONTEXT
Reference what you know about the athlete:
- If they have injuries: "Given your [injury], we'll want to modify this..."
- If they're in a position: "As a [position], this is especially important for you..."
- If they mentioned something earlier: "Going back to what you asked about..."

### 3. USE COACHING LANGUAGE
Sound like a real coach, not a textbook:
- Instead of "Execute 3 sets of 10 repetitions" → "Start with 3 sets of 10 - but listen to your body"
- Instead of "Adequate hydration is necessary" → "Make sure you're drinking enough water, especially before practice"
- Instead of "The recommended protocol is..." → "What I've seen work well is..."

### 4. DRIVE THE CONVERSATION
End responses with engagement:
- "Does that make sense? Any part you want me to break down more?"
- "Want me to create a quick drill routine you can try today?"
- "How does that fit with your current training schedule?"
- "Should I also cover [related topic] since it connects to this?"

### 5. BE HONEST ABOUT LIMITS
For medical/supplement questions, be clear:
- "I can share general info, but for your specific situation, definitely check with your doctor/trainer."
- "This is where I'd recommend getting professional advice - I don't want to steer you wrong on something this important."

## RESPONSE STRUCTURE
- Start with acknowledgment or brief reaction
- Answer the question (or ask for clarification first)
- Add context/personalization when relevant
- Include practical next steps
- End with engagement (question or suggestion)

## FORMATTING
- Use markdown for readability (headers, bullets, bold for emphasis)
- Keep paragraphs short and scannable
- For drills/exercises, use numbered steps
- For nutrition/recovery, use clear sections

Remember: You're not just answering questions - you're coaching. Guide them, support them, and help them become better athletes.`;

// =====================================================
// SAFETY-AWARE SYSTEM PROMPTS
// =====================================================

const SYSTEM_PROMPTS = {
  // Default conversational coach
  coach: CONVERSATIONAL_COACH_PROMPT,

  // High-risk topics (supplements, medical)
  highRisk: `${CONVERSATIONAL_COACH_PROMPT}

## CRITICAL SAFETY RULES FOR THIS CONVERSATION
This question involves supplements, medications, or medical topics. You MUST:
1. NEVER provide specific dosages or quantities
2. NEVER recommend specific supplement brands
3. ALWAYS recommend consulting a healthcare provider or sports dietitian
4. ONLY provide general educational information
5. Be extra cautious and include clear disclaimers
6. If asked about specific dosing, redirect: "For the right dose for YOU, you really need to talk to a doctor or sports dietitian who knows your body and goals."`,

  // Medium-risk topics (injury, recovery)
  mediumRisk: `${CONVERSATIONAL_COACH_PROMPT}

## SAFETY NOTES FOR THIS CONVERSATION
This question involves injury or recovery. Remember to:
1. Always include "stop if you feel pain" guidance
2. Recommend professional evaluation for persistent issues
3. Suggest modifications for existing injuries
4. Emphasize gradual progression
5. Ask about their specific symptoms before giving advice`,

  // Data analysis mode
  analyzer: `You are a sports performance analyst. Analyze the provided data and return structured insights.
Return your analysis as valid JSON with the following structure:
{
  "summary": "Brief overview",
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"],
  "risk_factors": ["risk1", "risk2"],
  "action_items": [{"type": "string", "description": "string", "priority": "high|medium|low"}]
}`,

  // Quick responses
  simple: `You are Merlin, a friendly flag football coach. Give brief, helpful responses. Be warm but concise.`,
};

/**
 * Check if Groq API key is configured
 */
function isGroqConfigured() {
  return !!process.env.GROQ_API_KEY;
}

/**
 * Get Groq API key from environment
 */
function getGroqApiKey() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }
  return apiKey;
}

/**
 * Call Groq API for chat completion
 *
 * @param {Object} options - Request options
 * @param {string} options.prompt - User prompt/message
 * @param {string} [options.systemPrompt] - System prompt (defaults to coach)
 * @param {string} [options.model] - Model to use (defaults to LLAMA_8B)
 * @param {number} [options.temperature] - Sampling temperature (0-1)
 * @param {number} [options.maxTokens] - Max tokens to generate
 * @param {Array} [options.messages] - Full message array (overrides prompt)
 * @returns {Promise<Object>} - Groq response
 */
async function chatCompletion({
  prompt,
  systemPrompt = SYSTEM_PROMPTS.coach,
  model = DEFAULT_MODEL,
  temperature = 0.7,
  maxTokens = 1024,
  messages = null,
}) {
  const apiKey = getGroqApiKey();

  // Build messages array
  const chatMessages = messages || [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  const requestBody = {
    model,
    messages: chatMessages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;

      if (response.status === 429) {
        console.error("[Groq] Rate limit exceeded:", errorMessage);
        throw new Error(
          "AI service rate limit exceeded. Please try again in a moment.",
        );
      }

      console.error("[Groq] API error:", response.status, errorMessage);
      throw new Error(`AI service error: ${errorMessage}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || "",
      model: data.model,
      usage: data.usage,
      finishReason: data.choices[0]?.finish_reason,
    };
  } catch (error) {
    if (error.message.includes("AI service")) {
      throw error;
    }
    console.error("[Groq] Request failed:", error);
    throw new Error("Failed to connect to AI service");
  }
}

/**
 * Build conversational context for the AI
 * Creates a natural, coach-like understanding of the athlete
 */
function buildAthleteContext(userContext) {
  const parts = [];

  // Personal context
  if (userContext.athleteName || userContext.userName) {
    parts.push(
      `You're talking to ${userContext.athleteName || userContext.userName}.`,
    );
  }

  // Position-specific context
  if (userContext.position) {
    parts.push(
      `They play ${userContext.position}, so tailor your advice to their role on the field.`,
    );
  }

  // Age/experience context
  if (userContext.ageGroup) {
    if (
      userContext.ageGroup === "youth" ||
      userContext.ageGroup === "u12" ||
      userContext.ageGroup === "u14"
    ) {
      parts.push(
        `They're a younger athlete, so keep explanations clear and age-appropriate. Emphasize fun and fundamentals.`,
      );
    } else if (userContext.ageGroup === "adult") {
      parts.push(
        `They're an adult athlete who can handle more detailed, technical advice.`,
      );
    }
  }

  // Injury context
  if (userContext.injuries && userContext.injuries.length > 0) {
    const injuryList = userContext.injuries
      .map((i) => {
        const type = i.type || i.body_part || "injury";
        const severity = i.severity ? ` (${i.severity})` : "";
        return `${type}${severity}`;
      })
      .join(", ");
    parts.push(
      `IMPORTANT: They're currently dealing with: ${injuryList}. Be mindful of this and suggest modifications.`,
    );
  }

  // Training load context (ACWR)
  if (userContext.recentLoad) {
    const load = userContext.recentLoad;
    if (load.riskZone === "danger" || load.riskZone === "critical") {
      parts.push(
        `HIGH RISK: Their training load is dangerously high (ACWR: ${load.acwr?.toFixed(2)}). Prioritize recovery and injury prevention above all else.`,
      );
    } else if (load.acwr > 1.3) {
      parts.push(
        `Their training load is high right now (ACWR: ${load.acwr.toFixed(2)}). Be cautious about recommending additional intense work.`,
      );
    } else if (load.acwr < 0.8) {
      parts.push(
        `Their training load has been light recently (ACWR: ${load.acwr.toFixed(2)}). They may need to build back up gradually.`,
      );
    }
  }

  // Today's Protocol Context
  if (userContext.todayProtocol) {
    const p = userContext.todayProtocol;
    let protocolDesc = `Today's Focus: ${p.focus || "General training"}.`;
    if (p.rationale) {
      protocolDesc += ` Rationale: ${p.rationale}`;
    }
    if (p.progress > 0) {
      protocolDesc += ` (Progress: ${p.progress}% complete)`;
    }

    parts.push(protocolDesc);

    if (p.exercises && p.exercises.length > 0) {
      const pendingEx = p.exercises
        .filter((e) => e.status !== "complete")
        .slice(0, 3);
      if (pendingEx.length > 0) {
        parts.push(
          `Upcoming exercises: ${pendingEx.map((e) => e.name).join(", ")}.`,
        );
      }
    }
  }

  // Recent Training History
  if (userContext.recentSessions && userContext.recentSessions.length > 0) {
    const sessions = userContext.recentSessions
      .map(
        (s) =>
          `${s.session_type} (${s.duration_minutes}m) on ${s.session_date}`,
      )
      .join(", ");
    parts.push(`Recent sessions: ${sessions}.`);
  }

  // Cross-day continuity context
  if (userContext.recentGames && userContext.recentGames.length > 0) {
    const recentGame = userContext.recentGames[0];
    const gameDate = new Date(recentGame.game_date);
    const daysSinceGame = Math.floor(
      (new Date().getTime() - gameDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceGame <= 2) {
      parts.push(
        `IMPORTANT: They had a game ${daysSinceGame === 0 ? "today" : daysSinceGame === 1 ? "yesterday" : `${daysSinceGame} days ago`}. They're in recovery mode - prioritize rest, sleep, and hydration. Training should be light or recovery-focused.`,
      );
    }
  }

  // Active recovery protocols
  if (userContext.activeRecovery) {
    if (userContext.activeRecovery.type === "game_day_recovery") {
      parts.push(
        `They're currently in a game day recovery protocol. Focus on sleep, hydration, and light movement only. Training intensity should be limited.`,
      );
    } else if (userContext.activeRecovery.type === "load_cap") {
      parts.push(
        `They have an active load cap (${userContext.activeRecovery.sessionsRemaining} sessions remaining). Training load is automatically limited to prevent injury risk.`,
      );
    }
  }

  // Data confidence context
  if (userContext.dataConfidence) {
    const confidence = userContext.dataConfidence;
    if (confidence.score < 0.7) {
      parts.push(
        `IMPORTANT: Data confidence is ${Math.round(confidence.score * 100)}%. Some data may be incomplete or missing. Provide conservative, general advice and encourage completing wellness check-ins.`,
      );
      if (confidence.missingInputs && confidence.missingInputs.length > 0) {
        parts.push(
          `Missing data: ${confidence.missingInputs.slice(0, 3).join(", ")}.`,
        );
      }
    }
  }

  // Daily readiness & Wellness
  const wellness = userContext.latestWellness || userContext.dailyState;
  if (wellness) {
    if (wellness.readiness_score) {
      const confidenceNote =
        userContext.dataConfidence?.score < 0.7
          ? ` (confidence: ${Math.round(userContext.dataConfidence.score * 100)}%)`
          : "";
      parts.push(
        `Today's Readiness Score: ${wellness.readiness_score}/100${confidenceNote}.`,
      );

      // Add recovery focus if wellness was low yesterday
      if (
        userContext.yesterdayWellness &&
        userContext.yesterdayWellness.readiness_score < 40
      ) {
        parts.push(
          `IMPORTANT: Their wellness was low yesterday (${userContext.yesterdayWellness.readiness_score}/100). Today should focus on recovery - light movement, sleep, and hydration.`,
        );
      }
    }
    if (wellness.sleep_quality < 5) {
      parts.push(`Poor sleep reported (${wellness.sleep_quality}/10).`);
    }
    if (wellness.pain_level > 5) {
      parts.push(`Elevated pain today (${wellness.pain_level}/10).`);
    }
    if (wellness.fatigue_level > 7) {
      parts.push(`High fatigue reported today.`);
    }
  }

  // Body Composition & Hydration
  if (userContext.bodyStats) {
    const stats = userContext.bodyStats;
    if (stats.weight) {
      parts.push(`Current weight: ${stats.weight}kg.`);
    }
    if (stats.hydration) {
      const hydrationDesc =
        stats.hydration < 5 ? "low" : stats.hydration > 8 ? "good" : "moderate";
      parts.push(
        `Hydration level is ${hydrationDesc} (${stats.hydration}/10).`,
      );
    }
  }

  // Upcoming game
  if (userContext.upcomingGame) {
    const daysUntil = userContext.upcomingGame.daysUntil || "soon";
    parts.push(
      `They have a game coming up ${typeof daysUntil === "number" ? `in ${daysUntil} days` : daysUntil}. Consider game-prep advice.`,
    );
  }

  // Conversation memory (Phase 4)
  if (userContext.memoryPrompt) {
    parts.push(userContext.memoryPrompt);
  }

  // Personalization preferences
  if (userContext.preferences) {
    const prefs = userContext.preferences;
    if (prefs.preferred_detail_level === "detailed") {
      parts.push(`They prefer detailed, in-depth explanations.`);
    } else if (prefs.preferred_detail_level === "brief") {
      parts.push(`They prefer concise, to-the-point answers.`);
    }
    if (prefs.preferred_tone === "motivational") {
      parts.push(`They respond well to motivational, high-energy coaching.`);
    }
  }

  // Personalization prompt from Phase 3
  if (userContext.personalizationPrompt) {
    parts.push(userContext.personalizationPrompt);
  }

  return parts.length > 0
    ? `\n## ABOUT THIS ATHLETE\n${parts.join("\n")}\n`
    : "";
}

/**
 * Build knowledge context for the AI
 * Formats knowledge base entries as reference material
 */
function buildKnowledgeContext(knowledgeSources) {
  if (!knowledgeSources || knowledgeSources.length === 0) {
    return "";
  }

  const sources = knowledgeSources
    .slice(0, 3) // Top 3 most relevant
    .map((source, i) => {
      const title = source.topic || source.title || "Reference";
      const content = source.content?.substring(0, 600) || "";
      const grade = source.evidence_grade || source.evidenceGrade || "";
      const gradeLabel = grade ? ` [Evidence: ${grade}]` : "";
      return `${i + 1}. **${title}**${gradeLabel}\n${content}`;
    })
    .join("\n\n");

  return `\n## REFERENCE INFORMATION\nUse this to inform your response (but speak naturally, don't just repeat it):\n\n${sources}\n`;
}

/**
 * Build conversation history for context
 */
function buildConversationHistory(history) {
  if (!history || history.length === 0) {
    return "";
  }

  // Take last 4 messages for context
  const recent = history.slice(-4);
  const formatted = recent
    .map((msg) => {
      const role = msg.role === "user" ? "Athlete" : "You (Merlin)";
      const content = msg.content?.substring(0, 300) || "";
      return `${role}: ${content}${content.length >= 300 ? "..." : ""}`;
    })
    .join("\n");

  return `\n## RECENT CONVERSATION\n${formatted}\n`;
}

/**
 * Generate coaching response with full conversational context
 *
 * @param {Object} options - Request options
 * @param {string} options.query - User's question
 * @param {string} options.riskLevel - Risk classification (low/medium/high)
 * @param {Object} options.userContext - User context (injuries, load, etc.)
 * @param {Array} options.knowledgeSources - Relevant knowledge base entries
 * @param {Array} [options.conversationHistory] - Recent messages for context
 * @returns {Promise<Object>} - Structured coaching response
 */
async function generateCoachingResponse({
  query,
  riskLevel,
  userContext = {},
  knowledgeSources = [],
  conversationHistory = [],
}) {
  // Select appropriate system prompt based on risk
  let systemPrompt;
  if (riskLevel === "high") {
    systemPrompt = SYSTEM_PROMPTS.highRisk;
  } else if (riskLevel === "medium") {
    systemPrompt = SYSTEM_PROMPTS.mediumRisk;
  } else {
    systemPrompt = SYSTEM_PROMPTS.coach;
  }

  // Build contextual information
  const athleteContext = buildAthleteContext(userContext);
  const knowledgeContext = buildKnowledgeContext(knowledgeSources);
  const historyContext = buildConversationHistory(conversationHistory);

  // Construct the full prompt
  const fullPrompt = `${athleteContext}${historyContext}${knowledgeContext}

## ATHLETE'S MESSAGE
"${query}"

Respond as Merlin would - naturally, helpfully, and as a real coach would in a 1-on-1 conversation.`;

  console.log(
    "[Groq] Generating conversational response for:",
    query.substring(0, 50),
  );

  try {
    const response = await chatCompletion({
      prompt: fullPrompt,
      systemPrompt,
      model: riskLevel === "high" ? GROQ_MODELS.LLAMA_70B : DEFAULT_MODEL,
      temperature: riskLevel === "high" ? 0.4 : 0.75, // Slightly more creative for conversation
      maxTokens: riskLevel === "high" ? 900 : 1200, // More room for conversational response
    });

    return {
      answer: response.content,
      model: response.model,
      usage: response.usage,
      source: "groq-ai",
    };
  } catch (error) {
    console.error("[Groq] Coaching response failed:", error);
    throw error;
  }
}

/**
 * Generate a clarifying question when the query is ambiguous
 *
 * @param {string} query - The ambiguous query
 * @param {string} intent - Detected intent
 * @param {Object} userContext - User context
 * @returns {Promise<Object>} - Clarifying question response
 */
async function generateClarifyingQuestion({
  query,
  intent: _intent,
  userContext = {},
}) {
  const athleteContext = buildAthleteContext(userContext);

  const prompt = `${athleteContext}

The athlete asked: "${query}"

This seems like it could mean a few different things. Instead of assuming, generate a friendly clarifying question to understand exactly what they need help with.

Keep it brief and conversational - like a coach would ask in person.`;

  try {
    const response = await chatCompletion({
      prompt,
      systemPrompt: SYSTEM_PROMPTS.coach,
      model: GROQ_MODELS.GEMMA, // Fast model for quick clarification
      temperature: 0.8,
      maxTokens: 200,
    });

    return {
      answer: response.content,
      isClarification: true,
      originalQuery: query,
      model: response.model,
      source: "groq-ai",
    };
  } catch (error) {
    console.error("[Groq] Clarifying question failed:", error);
    throw error;
  }
}

/**
 * Analyze training data and provide insights
 *
 * @param {Object} data - Training data to analyze
 * @returns {Promise<Object>} - Structured analysis
 */
async function analyzeTrainingData(data) {
  const prompt = `Analyze this athlete's training data and provide insights:

${JSON.stringify(data, null, 2)}

Return your analysis as valid JSON.`;

  try {
    const response = await chatCompletion({
      prompt,
      systemPrompt: SYSTEM_PROMPTS.analyzer,
      model: GROQ_MODELS.LLAMA_8B,
      temperature: 0.3,
      maxTokens: 800,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        summary: response.content,
        insights: [],
        recommendations: [],
        source: "groq-ai",
      };
    }
  } catch (error) {
    console.error("[Groq] Analysis failed:", error);
    throw error;
  }
}

/**
 * Generate quick suggestions (lightweight, fast)
 *
 * @param {string} context - Brief context
 * @returns {Promise<string>} - Quick suggestion
 */
async function quickSuggestion(context) {
  try {
    const response = await chatCompletion({
      prompt: context,
      systemPrompt: SYSTEM_PROMPTS.simple,
      model: GROQ_MODELS.GEMMA,
      temperature: 0.8,
      maxTokens: 256,
    });

    return response.content;
  } catch (error) {
    console.error("[Groq] Quick suggestion failed:", error);
    throw error;
  }
}

/**
 * Generate follow-up suggestions after a response
 *
 * @param {string} query - Original query
 * @param {string} response - AI response given
 * @param {string} intent - Detected intent
 * @returns {Promise<string[]>} - Array of follow-up suggestions
 */
async function generateFollowUpSuggestions({
  query,
  response: _response,
  intent,
}) {
  const prompt = `Based on this conversation:
Athlete asked: "${query.substring(0, 200)}"
Coach answered about: ${intent}

Generate 2-3 natural follow-up questions the athlete might want to ask next. Return as a JSON array of strings.
Example: ["Can you show me a specific drill?", "How often should I practice this?"]`;

  try {
    const result = await chatCompletion({
      prompt,
      systemPrompt:
        "Return only a JSON array of 2-3 follow-up question strings. No other text.",
      model: GROQ_MODELS.GEMMA,
      temperature: 0.8,
      maxTokens: 150,
    });

    try {
      const suggestions = JSON.parse(result.content);
      return Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
    } catch {
      return [];
    }
  } catch (error) {
    console.error("[Groq] Follow-up generation failed:", error);
    return [];
  }
}

module.exports = {
  isGroqConfigured,
  chatCompletion,
  generateCoachingResponse,
  generateClarifyingQuestion,
  analyzeTrainingData,
  quickSuggestion,
  generateFollowUpSuggestions,
  GROQ_MODELS,
  SYSTEM_PROMPTS,
};
