import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "user-1",
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/utils/merlin-guard.js", () => ({
  guardMerlinRequest: () => null,
}));

vi.mock("../../netlify/functions/utils/ai-safety-classifier.js", () => ({
  classifyWithConfidence: () => ({
    riskLevel: "high",
    intent: "supplement_medical",
    confidence: 0.95,
    confidenceLevel: "high",
    isYouthUser: true,
    escalated: true,
    escalationReasons: ["Youth supplement question blocked"],
    youthRestrictions: {
      isBlocked: true,
      blockedReason:
        "For youth athletes, supplement and dosage guidance requires guardian and coach oversight.",
      restrictionsApplied: ["supplement_guardrail"],
      notifyParent: true,
      requiresParentApproval: true,
      notificationReason: "Blocked youth supplement topic",
    },
    entities: {},
    signals: { keyword: { confidence: 0.95 } },
    processingTimeMs: 12,
  }),
  classifyRiskLevel: () => ({ riskLevel: "low", intent: "general" }),
  generateBlockedYouthResponse: (reason) => ({
    answer: `I can't help with that directly. ${reason}`,
    disclaimer:
      "Youth safety policy applied. Please involve a parent/guardian and coach.",
    suggestedActions: [
      {
        type: "ask_coach",
        label: "Talk to Coach",
        reason: "Youth safety guardrail",
      },
    ],
  }),
  filterSourcesByEvidence: (sources) => sources,
  generateSafeResponse: (_risk, answer) => ({
    answer,
    citations: [],
    riskLevel: "high",
    disclaimer: null,
    suggestedActions: [],
  }),
  filterContent: (content) => content,
  classifyIntent: () => "general",
  applyYouthRestrictions: () => ({}),
  RISK_LEVELS: { LOW: "low", MEDIUM: "medium", HIGH: "high" },
  INTENT_TYPES: { DOSAGE: "dosage", PAIN_INJURY: "pain_injury" },
  AGE_GROUPS: { YOUTH: "youth", ADULT: "adult" },
  YOUTH_RESTRICTED_TOPICS: ["supplements"],
}));

vi.mock("../../netlify/functions/utils/groq-client.js", () => ({
  isGroqConfigured: () => false,
  generateCoachingResponse: async () => ({ answer: "fallback" }),
  generateClarifyingQuestion: () => "Can you clarify?",
}));

vi.mock("../../netlify/functions/utils/smart-ai-service.js", () => ({
  processSmartQuery: async () => ({
    routingAction: "answer",
    confidence: 0.9,
    memory: { hasMemory: false },
    pendingCheckins: [],
    shouldAskClarification: false,
  }),
  searchKnowledgeHybrid: async () => [],
  recordFeedbackWithLearning: async () => ({}),
  getLearnedPreferences: async () => ({}),
  getPendingCheckins: async () => [],
  updateCheckinStatus: async () => ({}),
  buildCheckinMessage: () => "",
  summarizeConversation: async () => "",
  ROUTING_ACTIONS: {
    ANSWER_WITH_CONFIRM: "answer_with_confirm",
  },
}));

vi.mock("../../netlify/functions/utils/embedding-service.js", () => ({
  isEmbeddingServiceAvailable: () => false,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => {
  class Query {
    constructor(table) {
      this.table = table;
      this.data = [];
      this.error = null;
    }
    insert(payload) {
      this.payload = payload;
      return this;
    }
    select() {
      return this;
    }
    eq() {
      return this;
    }
    in() {
      return this;
    }
    gte() {
      return this;
    }
    lte() {
      return this;
    }
    order() {
      return this;
    }
    limit() {
      return this;
    }
    or() {
      return this;
    }
    maybeSingle() {
      return Promise.resolve({ data: null, error: null });
    }
    single() {
      if (this.table === "privacy_settings") {
        return Promise.resolve({
          data: { ai_processing_enabled: true },
          error: null,
        });
      }
      if (this.table === "ai_chat_sessions") {
        return Promise.resolve({
          data: { id: "session-blocked-1", user_id: "user-1" },
          error: null,
        });
      }
      if (this.table === "ai_messages") {
        return Promise.resolve({
          data: { id: "msg-blocked-1" },
          error: null,
        });
      }
      return Promise.resolve({
        data: { id: "mock-id" },
        error: null,
      });
    }
    then(resolve) {
      return Promise.resolve({ data: this.data, error: this.error }).then(
        resolve,
      );
    }
  }

  return {
    checkEnvVars: () => {},
    supabaseAdmin: {
      from(table) {
        return new Query(table);
      },
    },
  };
});

describe("ai-chat validation hardening", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 422 for non-object JSON body", async () => {
    const { handler } = await import("../../netlify/functions/ai-chat.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/ai-chat",
        headers: {},
        body: "[]",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 422 for whitespace-only message", async () => {
    const { handler } = await import("../../netlify/functions/ai-chat.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/ai-chat",
        headers: {},
        body: JSON.stringify({ message: "   " }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns 422 for non-object JSON on analyze-context endpoint", async () => {
    const { handler } = await import("../../netlify/functions/ai-chat.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/ai-chat/analyze-context",
        headers: {},
        body: "[]",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("validation_error");
  });

  it("returns blocked-youth response with chat_session_id and message_id contract fields", async () => {
    const { handler } = await import("../../netlify/functions/ai-chat.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/ai-chat",
        headers: {},
        body: JSON.stringify({
          message: "How much creatine should I take daily?",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
    expect(payload.data?.is_blocked).toBe(true);
    expect(payload.data?.chat_session_id).toBe("session-blocked-1");
    expect(payload.data?.message_id).toBe("msg-blocked-1");
    expect(Array.isArray(payload.data?.suggested_actions)).toBe(true);
    expect(payload.data?.risk_level).toBe("high");
  });
});
