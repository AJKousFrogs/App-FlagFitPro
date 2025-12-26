/**
 * Groq LLM Client
 *
 * Uses Groq's FREE API for AI completions
 * - 14,400 requests/day on free tier
 * - Models: Llama 3.1, Mixtral, Gemma
 * - OpenAI-compatible API
 *
 * Rate Limits (Free Tier):
 * - 30 requests/minute
 * - 14,400 requests/day
 * - 6,000 tokens/minute
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

// System prompts for different contexts
const SYSTEM_PROMPTS = {
  coach: `You are an expert flag football coach and sports scientist with deep knowledge of:
- Athletic training and periodization
- Injury prevention and recovery
- Sports nutrition and supplementation
- Performance optimization
- Flag football techniques and strategies

IMPORTANT SAFETY RULES:
1. For HIGH-RISK topics (supplements, medications, dosages):
   - NEVER provide specific dosage recommendations
   - Always recommend consulting a healthcare provider
   - Only provide general educational information
   - Include clear disclaimers

2. For MEDIUM-RISK topics (injury prevention, recovery):
   - Provide evidence-based guidance
   - Include "stop if pain occurs" warnings
   - Recommend professional evaluation for persistent issues

3. For LOW-RISK topics (training techniques, drills):
   - Provide detailed, actionable guidance
   - Include form cues and progressions
   - Personalize based on athlete context

Always be encouraging but prioritize athlete safety. Format responses in clear, readable markdown.`,

  analyzer: `You are a sports performance analyst. Analyze the provided data and return structured insights.
Return your analysis as valid JSON with the following structure:
{
  "summary": "Brief overview",
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"],
  "risk_factors": ["risk1", "risk2"],
  "action_items": [{"type": "string", "description": "string", "priority": "high|medium|low"}]
}`,

  simple: `You are a helpful assistant for flag football athletes. Keep responses concise and actionable.`,
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
    // Groq-specific optimizations
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

      // Handle rate limiting
      if (response.status === 429) {
        console.error("[Groq] Rate limit exceeded:", errorMessage);
        throw new Error("AI service rate limit exceeded. Please try again in a moment.");
      }

      // Handle other errors
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
 * Generate coaching response with safety context
 *
 * @param {Object} options - Request options
 * @param {string} options.query - User's question
 * @param {string} options.riskLevel - Risk classification (low/medium/high)
 * @param {Object} options.userContext - User context (injuries, load, etc.)
 * @param {Array} options.knowledgeSources - Relevant knowledge base entries
 * @returns {Promise<Object>} - Structured coaching response
 */
async function generateCoachingResponse({
  query,
  riskLevel,
  userContext = {},
  knowledgeSources = [],
}) {
  // Build context-aware prompt
  let contextSection = "";

  // Add user context
  if (userContext.position) {
    contextSection += `\nAthlete Position: ${userContext.position}`;
  }
  if (userContext.injuries && userContext.injuries.length > 0) {
    const injuryList = userContext.injuries
      .map((i) => `${i.type || i.body_part} (${i.severity || "unknown"} severity)`)
      .join(", ");
    contextSection += `\nActive Injuries/Conditions: ${injuryList}`;
  }
  if (userContext.recentLoad) {
    contextSection += `\nRecent Training Load: ${userContext.recentLoad.weeklyLoad} (${userContext.recentLoad.sessionCount} sessions, avg RPE: ${userContext.recentLoad.avgRPE?.toFixed(1)})`;
  }

  // Add knowledge base context
  let knowledgeSection = "";
  if (knowledgeSources.length > 0) {
    knowledgeSection = "\n\nRelevant Information from Knowledge Base:\n";
    knowledgeSources.forEach((source, i) => {
      knowledgeSection += `\n${i + 1}. ${source.topic || "Source"}: ${source.content?.substring(0, 500)}...`;
    });
  }

  // Add risk-level instructions
  let riskInstructions = "";
  if (riskLevel === "high") {
    riskInstructions = `
CRITICAL: This is a HIGH-RISK query about supplements/medical topics.
- DO NOT provide specific dosages
- DO NOT recommend specific products
- Focus on general education only
- Strongly recommend consulting healthcare provider
- Include clear medical disclaimer`;
  } else if (riskLevel === "medium") {
    riskInstructions = `
NOTE: This is a MEDIUM-RISK query about injury/recovery.
- Provide evidence-based guidance
- Include appropriate warnings
- Recommend professional evaluation if symptoms persist`;
  }

  const fullPrompt = `${riskInstructions}
${contextSection}
${knowledgeSection}

Athlete's Question: ${query}

Provide a helpful, safe, and personalized response. Use markdown formatting for readability.`;

  try {
    const response = await chatCompletion({
      prompt: fullPrompt,
      systemPrompt: SYSTEM_PROMPTS.coach,
      model: riskLevel === "high" ? GROQ_MODELS.LLAMA_70B : DEFAULT_MODEL,
      temperature: riskLevel === "high" ? 0.3 : 0.7, // More conservative for high-risk
      maxTokens: riskLevel === "high" ? 800 : 1024,
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

    // Try to parse JSON response
    try {
      return JSON.parse(response.content);
    } catch {
      // If not valid JSON, return as structured object
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
      model: GROQ_MODELS.GEMMA, // Fastest model
      temperature: 0.8,
      maxTokens: 256,
    });

    return response.content;
  } catch (error) {
    console.error("[Groq] Quick suggestion failed:", error);
    throw error;
  }
}

module.exports = {
  isGroqConfigured,
  chatCompletion,
  generateCoachingResponse,
  analyzeTrainingData,
  quickSuggestion,
  GROQ_MODELS,
  SYSTEM_PROMPTS,
};

