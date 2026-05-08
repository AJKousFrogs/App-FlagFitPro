/**
 * AI Chat Service Unit Tests
 *
 * Tests for the Merlin AI coaching chat functionality with safety tiers.
 *
 * The service streams responses via Server-Sent Events over a raw `fetch()`
 * call (not ApiService.post), so the spec stubs `globalThis.fetch` with a
 * `ReadableStream` that emits SSE `data:` lines. Each test that exercises
 * `sendMessage` mocks fetch with `mockSseResponse(payload)`; error tests
 * either reject the fetch promise or return a non-2xx Response.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { firstValueFrom, of, throwError } from "rxjs";
import {
  AiChatService,
  ChatRequest,
  RiskLevel,
} from "./ai-chat.service";
import { ApiService } from "./api.service";
import { SupabaseService } from "./supabase.service";

// ──────────────────────────────────────────────────────────────────────────
// Canned payloads — same shape the server emits inside the SSE `done` event.
// ──────────────────────────────────────────────────────────────────────────

const mockSuccessPayload = {
  answer_markdown: "Here's my advice on improving your speed...",
  citations: [
    {
      title: "Speed Training for Athletes",
      url: "https://example.com/speed",
      evidence_grade: "A",
    },
  ],
  risk_level: "low" as RiskLevel,
  disclaimer: undefined,
  suggested_actions: [
    {
      type: "training",
      reason: "Based on your goals",
      label: "Start sprint training",
    },
  ],
  chat_session_id: "session-123",
  message_id: "msg-456",
  metadata: {
    source: "groq",
    model: "llama-3.3-70b-versatile",
    usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
  },
};

const mockHighRiskPayload = {
  answer_markdown:
    "I cannot provide specific medical advice. Please consult a healthcare professional.",
  citations: [],
  risk_level: "high" as RiskLevel,
  disclaimer:
    "This response has been filtered for safety. Please consult a professional.",
  suggested_actions: [],
  chat_session_id: "session-123",
  message_id: "msg-789",
};

const mockACWRBlockedPayload = {
  answer_markdown:
    "Based on your current ACWR of 1.7 (danger zone), I cannot recommend high-intensity training. Focus on recovery instead.",
  citations: [],
  risk_level: "high" as RiskLevel,
  disclaimer: "High-intensity training blocked due to elevated ACWR.",
  suggested_actions: [
    {
      type: "recovery",
      reason: "ACWR in danger zone",
      label: "View recovery recommendations",
    },
  ],
  chat_session_id: "session-123",
  message_id: "msg-acwr",
  metadata: {
    acwr_safety: {
      blocked: true,
      acwr: 1.7,
      risk_zone: "danger",
    },
  },
};

// ──────────────────────────────────────────────────────────────────────────
// SSE Response factory.
//
// JSDOM does not expose `ReadableStream`, so we hand-roll an object that
// quacks like a fetch Response: `ok`, `status`, and a `body.getReader()`
// returning `{ read(): {value, done}, releaseLock() }`. The service only
// touches those four fields. Each call returns a fresh object so a single
// "stream" is consumed once-and-only-once.
// ──────────────────────────────────────────────────────────────────────────

function mockSseResponse(payload: unknown, opts?: { status?: number }): Response {
  const status = opts?.status ?? 200;
  const encoder = new TextEncoder();
  const line = `data: ${JSON.stringify({ type: "done", payload })}\n\n`;
  const chunks: Uint8Array[] = [encoder.encode(line)];
  let cursor = 0;

  return {
    ok: status >= 200 && status < 300,
    status,
    body: {
      getReader: () => ({
        read: async (): Promise<{ value?: Uint8Array; done: boolean }> => {
          if (cursor < chunks.length) {
            return { value: chunks[cursor++], done: false };
          }
          return { value: undefined, done: true };
        },
        releaseLock: () => {
          /* no-op */
        },
      }),
    },
  } as unknown as Response;
}

// ──────────────────────────────────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────────────────────────────────

const mockApiService = {
  post: vi.fn(),
  get: vi.fn(),
  buildUrl: vi.fn((endpoint: string) => `/api${endpoint}`),
};

const mockSupabaseService = {
  waitForInit: vi.fn(async () => undefined),
  getToken: vi.fn(async () => "test-jwt-token"),
};

let mockFetch: ReturnType<typeof vi.fn>;
const originalFetch = globalThis.fetch;

describe("AiChatService", () => {
  let service: AiChatService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    // Default: every fetch resolves to a fresh successful SSE response.
    mockFetch.mockImplementation(async () => mockSseResponse(mockSuccessPayload));

    TestBed.configureTestingModule({
      providers: [
        AiChatService,
        { provide: ApiService, useValue: mockApiService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    });

    service = TestBed.inject(AiChatService);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ============================================================================
  // Basic Chat Functionality
  // ============================================================================

  describe("Basic Chat", () => {
    it("should send message and receive response", async () => {
      const request: ChatRequest = { message: "How can I improve my speed?" };

      const response = await firstValueFrom(service.sendMessage(request));

      expect(response).not.toBeNull();
      expect(response.role).toBe("assistant");
      expect(response.content).toContain("speed");
      expect(response.riskLevel).toBe("low");
    });

    it("should add user message immediately", async () => {
      await firstValueFrom(service.sendMessage({ message: "Test message" }));

      const messages = service.messages();
      const userMessage = messages.find((m) => m.role === "user");

      expect(userMessage).toBeDefined();
      expect(userMessage!.content).toBe("Test message");
    });

    it("should set loading state during request", async () => {
      await firstValueFrom(service.sendMessage({ message: "Test" }));

      // Loading should be false after response
      expect(service.loading()).toBe(false);
    });

    it("should clear error on new message", async () => {
      // First, make sendMessage fail
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      await firstValueFrom(service.sendMessage({ message: "Fail" }));

      // Now send successful message — fetch falls back to default SSE success
      await firstValueFrom(service.sendMessage({ message: "Success" }));

      expect(service.error()).toBeNull();
    });
  });

  // ============================================================================
  // Safety Tiers
  // ============================================================================

  describe("Safety Tiers", () => {
    it("should handle low risk responses", async () => {
      const response = await firstValueFrom(
        service.sendMessage({ message: "How do I warm up?" }),
      );

      expect(response.riskLevel).toBe("low");
      expect(response.disclaimer).toBeUndefined();
    });

    it("should handle high risk responses with disclaimer", async () => {
      mockFetch.mockImplementationOnce(async () => mockSseResponse(mockHighRiskPayload));

      const response = await firstValueFrom(
        service.sendMessage({
          message: "My knee hurts badly, what should I do?",
        }),
      );

      expect(response.riskLevel).toBe("high");
      expect(response.disclaimer).toBeDefined();
      expect(response.disclaimer).toContain("professional");
    });

    it("should handle ACWR-blocked responses", async () => {
      mockFetch.mockImplementationOnce(async () => mockSseResponse(mockACWRBlockedPayload));

      const response = await firstValueFrom(
        service.sendMessage({ message: "Can I do sprint training today?" }),
      );

      expect(response.riskLevel).toBe("high");
      expect(response.content).toContain("ACWR");
      expect(response.content).toContain("recovery");
      expect(response.suggestedActions).toBeDefined();
      expect(response.suggestedActions![0].type).toBe("recovery");
    });
  });

  // ============================================================================
  // Citations
  // ============================================================================

  describe("Citations", () => {
    it("should include citations in response", async () => {
      const response = await firstValueFrom(
        service.sendMessage({ message: "Test" }),
      );

      expect(response.citations).toBeDefined();
      expect(response.citations!.length).toBeGreaterThan(0);
      expect(response.citations![0].title).toBe("Speed Training for Athletes");
    });

    it("should handle responses without citations", async () => {
      mockFetch.mockImplementationOnce(async () => mockSseResponse(mockHighRiskPayload));

      const response = await firstValueFrom(
        service.sendMessage({ message: "Test" }),
      );

      expect(response.citations).toBeDefined();
      expect(response.citations!.length).toBe(0);
    });
  });

  // ============================================================================
  // Suggested Actions
  // ============================================================================

  describe("Suggested Actions", () => {
    it("should include suggested actions", async () => {
      const response = await firstValueFrom(
        service.sendMessage({ message: "Test" }),
      );

      expect(response.suggestedActions).toBeDefined();
      expect(response.suggestedActions!.length).toBeGreaterThan(0);
      expect(response.suggestedActions![0].label).toBe("Start sprint training");
    });
  });

  // ============================================================================
  // Session Management
  // ============================================================================

  describe("Session Management", () => {
    it("should start new session", () => {
      service.startNewSession();

      const sessionId = service.sessionId();
      const messages = service.messages();

      // Session ID is empty string after starting new session
      expect(sessionId === "" || sessionId === null).toBe(true);
      expect(messages.length).toBe(0);
    });

    it("should update session ID after first message", async () => {
      service.startNewSession();
      await firstValueFrom(service.sendMessage({ message: "Test" }));

      expect(service.sessionId()).toBe("session-123");
    });

    it("should clear session", async () => {
      await firstValueFrom(service.sendMessage({ message: "Test" }));

      service.clearSession();

      expect(service.sessionId()).toBeNull();
      expect(service.messages().length).toBe(0);
    });

    it("should load existing session", async () => {
      const mockSession = {
        success: true,
        data: {
          messages: [
            {
              id: "msg-1",
              role: "user" as const,
              content: "Previous message",
              timestamp: new Date(),
            },
          ],
        },
      };

      mockApiService.get.mockReturnValue(of(mockSession));

      await firstValueFrom(service.loadSession("existing-session"));

      expect(service.sessionId()).toBe("existing-session");
      expect(service.messages().length).toBe(1);
    });
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const response = await firstValueFrom(
        service.sendMessage({ message: "Test" }),
      );

      // Should return fallback message
      expect(response).not.toBeNull();
      expect(response.role).toBe("assistant");
      expect(response.content).toContain("trouble connecting");
      expect(service.error()).toBe("Network error");
    });

    it("should handle failed response", async () => {
      // Non-2xx response triggers the same throw → fallback path
      mockFetch.mockResolvedValueOnce(mockSseResponse({}, { status: 500 }));

      const response = await firstValueFrom(
        service.sendMessage({ message: "Test" }),
      );

      expect(response.content).toContain("trouble connecting");
    });

    it("should handle load session failure", async () => {
      mockApiService.get.mockReturnValue(
        throwError(() => new Error("Session not found")),
      );

      await firstValueFrom(service.loadSession("invalid-session"));

      // Should start fresh session on failure
      expect(service.messages().length).toBe(0);
    });
  });

  // ============================================================================
  // Quick Suggestions
  // ============================================================================

  describe("Quick Suggestions", () => {
    it("should return quick suggestions", () => {
      const suggestions = service.getQuickSuggestions();

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain("How can I improve my speed?");
    });
  });

  // ============================================================================
  // Metadata
  // ============================================================================

  describe("Metadata", () => {
    it("should include model metadata", async () => {
      const response = await firstValueFrom(
        service.sendMessage({ message: "Test" }),
      );

      expect(response.metadata).toBeDefined();
      expect(response.metadata!.model).toBe("llama-3.3-70b-versatile");
      expect(response.metadata!.source).toBe("groq");
    });

    it("should include token usage", async () => {
      const response = await firstValueFrom(
        service.sendMessage({ message: "Test" }),
      );

      expect(response.metadata!.usage).toBeDefined();
      expect(response.metadata!.usage!.total_tokens).toBe(300);
    });
  });

  // ============================================================================
  // Rate Limiting
  // ============================================================================

  describe("Rate Limiting", () => {
    it("returns rate-limit message when 5 messages sent within 60s", async () => {
      // Send 5 messages to fill the window
      for (let i = 0; i < 5; i++) {
        await firstValueFrom(service.sendMessage({ message: `Message ${i + 1}` }));
      }

      // 6th message should be rate-limited (no fetch call)
      const limitResponse = await firstValueFrom(
        service.sendMessage({ message: "Message 6" }),
      );

      expect(limitResponse.role).toBe("assistant");
      expect(limitResponse.content).toContain("too fast");
      // fetch should only have been called 5 times, not 6
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it("rate-limit message contains retry countdown in seconds", async () => {
      for (let i = 0; i < 5; i++) {
        await firstValueFrom(service.sendMessage({ message: `Msg ${i}` }));
      }

      const limitResponse = await firstValueFrom(
        service.sendMessage({ message: "Over limit" }),
      );

      expect(limitResponse.content).toMatch(/\d+ second/);
    });

    it("resets rate limit window after startNewSession()", async () => {
      for (let i = 0; i < 5; i++) {
        await firstValueFrom(service.sendMessage({ message: `Msg ${i}` }));
      }

      // Verify we're now rate-limited
      const before = await firstValueFrom(service.sendMessage({ message: "Blocked" }));
      expect(before.content).toContain("too fast");

      // Start a new session — should clear the rate limit window
      service.startNewSession();

      const after = await firstValueFrom(service.sendMessage({ message: "After reset" }));
      expect(after.content).not.toContain("too fast");
      expect(after.role).toBe("assistant");
    });
  });

  // ============================================================================
  // Context Window Management (trimSessionContext)
  // ============================================================================

  describe("Context Window Management", () => {
    /**
     * Reach into the private rate-limit window so we can build a long
     * conversation in one session without `startNewSession()` (which would
     * reset `messages()` and prevent the 20-message threshold from being
     * crossed). Trim only fires when a single session accumulates enough
     * messages, so accessing the private timestamp array is the cleanest
     * way to test the threshold deterministically.
     */
    function clearRateLimit(): void {
      (service as unknown as { recentMessageTimestamps: number[] })
        .recentMessageTimestamps.length = 0;
    }

    it("inserts a context-trim marker when session exceeds 20 messages", async () => {
      // Each sendMessage adds 2 messages (user + final assistant). 11 sends
      // → trim is consulted on the 11th call: messages.length = 20 ≥ MAX,
      // so it inserts the marker and keeps half. Bypass the 5-msg/60s
      // client-side rate limit between sends to keep one continuous session.
      service.startNewSession();
      for (let i = 0; i < 11; i++) {
        clearRateLimit();
        await firstValueFrom(service.sendMessage({ message: `Msg-${i}` }));
      }

      const msgs = service.messages();
      const hasMarker = msgs.some(
        (m) => m.role === "assistant" && m.content.includes("omitted"),
      );
      expect(hasMarker).toBe(true);
    });

    it("trim fires repeatedly under sustained sending", async () => {
      // Send well past one trim cycle. Each trim collapses to ~11 messages,
      // then 2 are added per send. After 20 sends we should see the marker
      // present (trim has fired at least once and was not overwritten).
      service.startNewSession();
      for (let i = 0; i < 20; i++) {
        clearRateLimit();
        await firstValueFrom(service.sendMessage({ message: `S${i}` }));
      }

      const markerCount = service.messages().filter(
        (m) => m.role === "assistant" && m.content.includes("omitted"),
      ).length;
      expect(markerCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // Request Options — assertions read the JSON body sent to fetch
  // ============================================================================

  describe("Request Options", () => {
    it("should pass session_id in request", async () => {
      const request: ChatRequest = {
        message: "Test",
        session_id: "existing-session",
      };

      await firstValueFrom(service.sendMessage(request));

      expect(mockFetch).toHaveBeenCalled();
      const init = mockFetch.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(init.body as string);
      expect(body.session_id).toBe("existing-session");
    });

    it("should pass team_id in request", async () => {
      const request: ChatRequest = {
        message: "Test",
        team_id: "team-123",
      };

      await firstValueFrom(service.sendMessage(request));

      const init = mockFetch.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(init.body as string);
      expect(body.team_id).toBe("team-123");
    });

    it("should pass goal and time_horizon", async () => {
      const request: ChatRequest = {
        message: "Test",
        goal: "speed",
        time_horizon: "8-weeks",
      } as unknown as ChatRequest;

      await firstValueFrom(service.sendMessage(request));

      const init = mockFetch.mock.calls[0][1] as RequestInit;
      const body = JSON.parse(init.body as string);
      expect(body.goal).toBe("speed");
      expect(body.time_horizon).toBe("8-weeks");
    });
  });
});
