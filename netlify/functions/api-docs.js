import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: API Documentation
// Provides interactive API documentation for the Flag Football app
// Endpoint: /api/api-docs

import { createSuccessResponse, CORS_HEADERS } from "./utils/error-handler.js";

import { baseHandler } from "./utils/base-handler.js";

// API endpoint definitions
const API_ENDPOINTS = {
  health: {
    path: "/api/health",
    method: "GET",
    description: "Health check endpoint for monitoring system status",
    auth: false,
    rateLimit: "none",
    response: {
      status: "healthy | degraded | unhealthy",
      checks: { database: {}, auth: {} },
      system: {},
    },
  },

  // Authentication
  "auth-login": {
    path: "/api/auth/login",
    method: "POST",
    description: "Authenticate user and return JWT token",
    auth: false,
    rateLimit: "AUTH (5/min)",
    body: { email: "string", password: "string" },
    response: { user: {}, token: "string" },
  },
  "auth-me": {
    path: "/api/auth/me",
    method: "GET",
    description: "Get current authenticated user information",
    auth: true,
    rateLimit: "READ (100/min)",
    response: { user: {} },
  },

  // Dashboard & Analytics
  dashboard: {
    path: "/api/dashboard",
    method: "GET",
    description: "Get dashboard overview data",
    auth: true,
    rateLimit: "READ (100/min)",
    subEndpoints: [
      "/training-calendar - Get training calendar",
      "/team-chemistry - Get team chemistry metrics",
      "/health - Get health overview",
    ],
  },
  analytics: {
    path: "/api/analytics",
    method: "GET",
    description: "Get analytics data",
    auth: true,
    rateLimit: "READ (100/min)",
    queryParams: {
      weeks: "number (default: 7)",
      period: "string (default: 30days)",
    },
    subEndpoints: [
      "/performance-trends - Performance trend analysis",
      "/team-chemistry - Team chemistry analysis",
      "/training-distribution - Training distribution",
      "/position-performance - Position-based performance",
      "/speed-development - Speed development tracking",
      "/summary - Analytics summary",
    ],
  },

  // Training
  "training-sessions": {
    path: "/api/training-sessions",
    methods: ["GET", "POST"],
    description: "Manage training sessions",
    auth: true,
    rateLimit: "READ/CREATE",
    getResponse: { sessions: [] },
    postBody: {
      exercises: "array (required)",
      sessionType: "string",
      duration: "number",
      intensity: "number (1-10)",
    },
  },
  "training-metrics": {
    path: "/api/training-metrics",
    method: "GET",
    description: "Get training metrics for an athlete",
    auth: true,
    rateLimit: "READ (100/min)",
    queryParams: {
      athleteId: "UUID (optional, defaults to current user)",
      startDate: "ISO date string",
    },
  },

  // Load Management
  "load-management": {
    path: "/api/load-management",
    method: "GET",
    description: "Training load management endpoints",
    auth: true,
    rateLimit: "READ (100/min)",
    subEndpoints: [
      "/acwr - Acute:Chronic Workload Ratio",
      "/monotony - Training monotony metrics",
      "/tsb - Training Stress Balance",
      "/injury-risk - Injury risk assessment",
      "/training-loads - Historical training loads",
    ],
  },

  // Readiness
  "calc-readiness": {
    path: "/api/calc-readiness",
    method: "POST",
    description: "Calculate athlete readiness score",
    auth: true,
    rateLimit: "CREATE (50/min)",
    body: {
      athleteId: "UUID (optional)",
      day: "ISO date string (optional)",
    },
    response: {
      score: "number (0-100)",
      level: "string (low/moderate/high/optimal)",
      acwr: "number",
      componentScores: {},
    },
  },
  "readiness-history": {
    path: "/api/readiness-history",
    method: "GET",
    description: "Get historical readiness scores",
    auth: true,
    rateLimit: "READ (100/min)",
    queryParams: {
      athleteId: "UUID (optional)",
      days: "number (default: 7, max: 365)",
    },
  },

  // Games
  games: {
    path: "/api/games",
    methods: ["GET", "POST", "PUT"],
    description: "Manage games and game events",
    auth: true,
    rateLimit: "READ/CREATE/UPDATE",
    subEndpoints: [
      "GET / - List all games",
      "POST / - Create new game",
      "GET /:gameId - Get game details",
      "PUT /:gameId - Update game",
      "GET /:gameId/stats - Get game statistics",
      "POST /:gameId/plays - Save a play",
    ],
  },

  // Player Stats
  "player-stats": {
    path: "/api/player-stats",
    method: "GET",
    description: "Get player statistics",
    auth: true,
    rateLimit: "READ (100/min)",
    queryParams: {
      playerId: "string",
      season: "string (optional)",
      teamId: "string (optional)",
    },
    subEndpoints: [
      "/aggregated - Aggregated stats (default)",
      "/date-range - Stats for date range",
    ],
  },

  // Wellness
  wellness: {
    path: "/api/wellness",
    methods: ["GET", "POST"],
    description: "Wellness check-ins and tracking",
    auth: true,
    rateLimit: "READ/CREATE",
    subEndpoints: [
      "GET /latest - Get latest check-in",
      "GET /checkins - Get check-in history",
      "POST /checkin - Create new check-in",
    ],
    postBody: {
      readiness: "number (1-10)",
      sleep: "number (hours)",
      energy: "number (1-10)",
      mood: "number (1-10)",
      soreness: "number (1-10)",
    },
  },

  // Notifications
  notifications: {
    path: "/api/notifications",
    methods: ["GET", "POST", "PATCH"],
    description: "User notifications",
    auth: true,
    rateLimit: "READ",
    queryParams: {
      limit: "number (default: 20)",
      page: "number (default: 1)",
      onlyUnread: "boolean",
    },
    postBody: {
      notificationId: "string | 'all'",
      ids: "array (for bulk)",
    },
  },

  // User
  "user-profile": {
    path: "/api/user-profile",
    method: "GET",
    description: "Get user profile with metrics and training data",
    auth: true,
    rateLimit: "READ (100/min)",
  },
  "user-context": {
    path: "/api/user-context",
    method: "GET",
    description: "Get user context for AI/chatbot",
    auth: true,
    rateLimit: "READ (100/min)",
  },

  // AI Coach (Groq)
  "ai-chat": {
    path: "/api/ai/chat",
    method: "POST",
    description:
      "Send a message to Merlin, the AI coach. Uses Groq LLM (Llama 3.1) for conversational coaching.",
    auth: true,
    rateLimit: "READ (100/min)",
    body: {
      message: "string (required) - User's question or message",
      session_id: "string (optional) - Session ID for conversation continuity",
    },
    response: {
      answer_markdown: "string - Markdown-formatted response",
      citations: "array - Source references with evidence grades",
      risk_level: "string - low | medium | high",
      disclaimer: "string | null - Safety disclaimer for medical topics",
      suggested_actions: "array - Follow-up actions",
      chat_session_id: "string - Session identifier",
      message_id: "string - Unique message ID",
      metadata: {
        source: "string - custom_knowledge | follow_up_context | groq-ai",
        topic: "string | null - Detected topic",
      },
    },
    notes: [
      "Uses Groq free tier (14,400 requests/day)",
      "High-risk topics (supplements) use Llama 70B for safety",
      "Maintains conversation context per session_id",
      "Built-in knowledge for nutrition topics (magnesium, zinc, iron, etc.)",
    ],
  },
  "ai-chat-session": {
    path: "/api/ai/chat/session/:sessionId",
    method: "GET",
    description: "Get conversation history for a chat session",
    auth: false,
    rateLimit: "READ (100/min)",
    response: {
      messages: "array - Conversation history",
    },
  },
  "ai-telemetry": {
    path: "/api/ai/telemetry",
    method: "GET",
    description:
      "Coach/admin telemetry dashboard for Merlin AI quality and usage metrics.",
    auth: true,
    rateLimit: "READ (100/min)",
    queryParams: {
      days: "number (optional, default: 30, min: 1, max: 90)",
      team_id: "UUID (optional) - Restrict metrics to a team scope",
    },
    response: {
      window_days: "number",
      since: "ISO datetime",
      team_scope: "string",
      sessions: {
        total: "number",
        unique_users: "number",
      },
      messages: {
        total: "number",
        assistant: "number",
        risk: "object - high/medium/low/unknown counts",
        fallback_rate_pct: "number",
        no_citation_rate_pct: "number",
      },
      recommendations: {
        total: "number",
        accepted: "number",
        completed: "number",
        acceptance_rate_pct: "number",
        completion_rate_pct: "number",
      },
      knowledge_base: {
        total_entries: "number",
        by_type: "object",
        pending_entries: "number",
      },
    },
  },
  "knowledge-governance": {
    path: "/api/knowledge-governance",
    methods: ["GET", "POST", "PATCH"],
    description:
      "Knowledge submission and nutritionist approval workflow. Merlin consumes only approved entries.",
    auth: true,
    rateLimit: "CREATE (30/min)",
    routes: {
      submit: "POST /api/knowledge-governance",
      my: "GET /api/knowledge-governance/my",
      pending: "GET /api/knowledge-governance/pending",
      audit: "GET /api/knowledge-governance/audit/:entryId",
      review: "POST|PATCH /api/knowledge-governance/review/:entryId",
    },
    body: {
      topic: "string",
      question: "string",
      answer: "string",
      summary: "string (optional)",
      entry_type:
        "training_method | injury | recovery_method | nutrition | supplement | psychology",
      evidence_strength: "strong | moderate | limited",
      consensus_level: "high | moderate | low",
      action: "approve | reject (for review route)",
      notes: "string (optional, for review route)",
      override_quality_gate:
        "boolean (optional, for approve route; requires detailed notes)",
    },
    notes: [
      "Any authenticated user can submit",
      "Any authenticated user can read their own submissions",
      "Only nutritionists can approve/reject",
      "Unapproved entries are excluded from Merlin knowledge search",
      "Approval uses quality gates for answer depth, summary quality, dosing and safety (nutrition/supplement)",
    ],
  },

  // Fixtures
  fixtures: {
    path: "/api/fixtures",
    method: "GET",
    description: "Get upcoming game fixtures",
    auth: true,
    rateLimit: "READ (100/min)",
    queryParams: {
      athleteId: "UUID (optional)",
      days: "number (default: 14, max: 365)",
    },
  },

  // Recovery
  recovery: {
    path: "/api/recovery",
    methods: ["GET", "POST"],
    description: "Recovery tracking and protocols",
    auth: true,
    rateLimit: "READ/CREATE",
    subEndpoints: [
      "/metrics - Get recovery metrics",
      "/protocols - Get recovery protocols",
      "/session - Start/complete recovery session",
    ],
  },

  // Nutrition
  nutrition: {
    path: "/api/nutrition",
    methods: ["GET", "POST"],
    description: "Nutrition tracking and goals",
    auth: true,
    rateLimit: "READ/CREATE",
    subEndpoints: [
      "/goals - Get nutrition goals",
      "/meals - Get today's meals",
      "/search - Search USDA foods",
      "/suggestions - AI nutrition suggestions",
    ],
  },
};

// Rate limit information
const RATE_LIMITS = {
  READ: {
    requests: 100,
    window: "1 minute",
    description: "Standard read operations",
  },
  CREATE: {
    requests: 50,
    window: "1 minute",
    description: "Create/write operations",
  },
  UPDATE: {
    requests: 30,
    window: "1 minute",
    description: "Update operations",
  },
  DELETE: {
    requests: 10,
    window: "1 minute",
    description: "Delete operations",
  },
  AUTH: {
    requests: 5,
    window: "1 minute",
    description: "Authentication operations",
  },
};

// Authentication information
const AUTH_INFO = {
  type: "Bearer Token (JWT)",
  header: "Authorization: Bearer <token>",
  provider: "Supabase Auth",
  tokenExpiry: "1 hour (configurable)",
  refreshToken: "Available via Supabase client",
};

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "api-docs",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: false, // API docs should be public
    handler: async (event, _context, { requestId }) => {
      const queryParams = event.queryStringParameters || {};
      const format = queryParams.format || "json";

      const documentation = {
        title: "Flag Football Performance App API",
        version: "1.0.0",
        baseUrl: "/.netlify/functions",
        description:
          "API documentation for the Flag Football Performance tracking application",
        authentication: AUTH_INFO,
        rateLimits: RATE_LIMITS,
        endpoints: API_ENDPOINTS,
        timestamp: new Date().toISOString(),
      };

      // Return HTML if requested
      if (format === "html") {
        return {
          statusCode: 200,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "text/html",
          },
          body: generateHtmlDocs(documentation),
        };
      }

      // Default: return JSON
      return createSuccessResponse(documentation, requestId);
    },
  });
};

// Generate simple HTML documentation
function generateHtmlDocs(docs) {
  const endpointHtml = Object.entries(docs.endpoints)
    .map(([name, endpoint]) => {
      const methods = endpoint.methods || [endpoint.method];
      return `
        <div class="endpoint">
          <h3>${name}</h3>
          <p><strong>Path:</strong> <code>${endpoint.path}</code></p>
          <p><strong>Methods:</strong> ${methods.join(", ")}</p>
          <p><strong>Auth Required:</strong> ${endpoint.auth !== false ? "Yes" : "No"}</p>
          <p><strong>Rate Limit:</strong> ${endpoint.rateLimit || "Standard"}</p>
          <p>${endpoint.description}</p>
          ${endpoint.subEndpoints ? `<p><strong>Sub-endpoints:</strong><ul>${endpoint.subEndpoints.map((s) => `<li>${s}</li>`).join("")}</ul></p>` : ""}
        </div>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <title>${docs.title}</title>
  <style>
    body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #0d1117; color: #c9d1d9; }
    h1 { color: #58a6ff; }
    h2 { color: #8b949e; border-bottom: 1px solid #30363d; padding-bottom: 8px; }
    h3 { color: #58a6ff; margin-bottom: 8px; }
    code { background: #161b22; padding: 2px 6px; border-radius: 4px; color: #79c0ff; }
    .endpoint { background: #161b22; padding: 16px; margin: 16px 0; border-radius: 8px; border: 1px solid #30363d; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin: 4px 0; }
    .info-box { background: #1c2128; padding: 16px; border-radius: 8px; margin: 16px 0; }
  </style>
</head>
<body>
  <h1>${docs.title}</h1>
  <p>Version: ${docs.version}</p>
  <p>Base URL: <code>${docs.baseUrl}</code></p>
  
  <h2>Authentication</h2>
  <div class="info-box">
    <p><strong>Type:</strong> ${docs.authentication.type}</p>
    <p><strong>Header:</strong> <code>${docs.authentication.header}</code></p>
    <p><strong>Provider:</strong> ${docs.authentication.provider}</p>
  </div>
  
  <h2>Rate Limits</h2>
  <div class="info-box">
    ${Object.entries(docs.rateLimits)
      .map(
        ([type, info]) =>
          `<p><strong>${type}:</strong> ${info.requests} requests per ${info.window} - ${info.description}</p>`,
      )
      .join("")}
  </div>
  
  <h2>Endpoints</h2>
  ${endpointHtml}
  
  <p style="color: #8b949e; margin-top: 40px;">Generated at: ${docs.timestamp}</p>
</body>
</html>
  `;
}

export const testHandler = handler;
export default createRuntimeV2Handler(handler);
