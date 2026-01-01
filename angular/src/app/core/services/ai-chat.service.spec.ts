/**
 * AI Chat Service Unit Tests
 *
 * Tests for the AI coaching chat functionality with safety tiers.
 * Uses async/await pattern compatible with zoneless Angular.
 *
 * @version 1.0.0
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { of, throwError, firstValueFrom } from "rxjs";
import {
  AiChatService,
  ChatMessage,
  ChatRequest,
  RiskLevel,
} from "./ai-chat.service";
import { ApiService } from "./api.service";

// Mock API responses
const mockSuccessResponse = {
  success: true,
  data: {
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
  },
};

const mockHighRiskResponse = {
  success: true,
  data: {
    answer_markdown:
      "I cannot provide specific medical advice. Please consult a healthcare professional.",
    citations: [],
    risk_level: "high" as RiskLevel,
    disclaimer:
      "This response has been filtered for safety. Please consult a professional.",
    suggested_actions: [],
    chat_session_id: "session-123",
    message_id: "msg-789",
  },
};

const mockACWRBlockedResponse = {
  success: true,
  data: {
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
  },
};

// Mock ApiService
const mockApiService = {
  post: vi.fn(),
  get: vi.fn(),
};

describe("AiChatService", () => {
  let service: AiChatService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        AiChatService,
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(AiChatService);
  });

  // ============================================================================
  // Basic Chat Functionality
  // ============================================================================

  describe("Basic Chat", () => {
    it("should send message and receive response", async () => {
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));

      const request: ChatRequest = {
        message: "How can I improve my speed?",
      };

      const response = await firstValueFrom(service.sendMessage(request));

      expect(response).not.toBeNull();
      expect(response.role).toBe("assistant");
      expect(response.content).toContain("speed");
      expect(response.riskLevel).toBe("low");
    });

    it("should add user message immediately", async () => {
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));

      const request: ChatRequest = {
        message: "Test message",
      };

      await firstValueFrom(service.sendMessage(request));

      const messages = service.messages();
      const userMessage = messages.find((m) => m.role === "user");

      expect(userMessage).toBeDefined();
      expect(userMessage!.content).toBe("Test message");
    });

    it("should set loading state during request", async () => {
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));

      expect(service.loading()).toBe(false);

      await firstValueFrom(service.sendMessage({ message: "Test" }));

      // Loading should be false after response
      expect(service.loading()).toBe(false);
    });

    it("should clear error on new message", async () => {
      // First, set an error
      mockApiService.post.mockReturnValue(
        throwError(() => new Error("Network error")),
      );
      await firstValueFrom(service.sendMessage({ message: "Fail" }));

      // Now send successful message
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));
      await firstValueFrom(service.sendMessage({ message: "Success" }));

      expect(service.error()).toBeNull();
    });
  });

  // ============================================================================
  // Safety Tiers
  // ============================================================================

  describe("Safety Tiers", () => {
    it("should handle low risk responses", async () => {
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));

      const response = await firstValueFrom(
        service.sendMessage({ message: "How do I warm up?" }),
      );

      expect(response.riskLevel).toBe("low");
      expect(response.disclaimer).toBeUndefined();
    });

    it("should handle high risk responses with disclaimer", async () => {
      mockApiService.post.mockReturnValue(of(mockHighRiskResponse));

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
      mockApiService.post.mockReturnValue(of(mockACWRBlockedResponse));

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
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));

      const response = await firstValueFrom(
        service.sendMessage({ message: "Test" }),
      );

      expect(response.citations).toBeDefined();
      expect(response.citations!.length).toBeGreaterThan(0);
      expect(response.citations![0].title).toBe("Speed Training for Athletes");
    });

    it("should handle responses without citations", async () => {
      mockApiService.post.mockReturnValue(of(mockHighRiskResponse));

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
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));

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
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));

      await firstValueFrom(service.sendMessage({ message: "Test" }));

      expect(service.sessionId()).toBe("session-123");
    });

    it("should clear session", async () => {
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));
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
      mockApiService.post.mockReturnValue(
        throwError(() => new Error("Network error")),
      );

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
      mockApiService.post.mockReturnValue(
        of({
          success: false,
          error: "Server error",
        }),
      );

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
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));

      const response = await firstValueFrom(
        service.sendMessage({ message: "Test" }),
      );

      expect(response.metadata).toBeDefined();
      expect(response.metadata!.model).toBe("llama-3.3-70b-versatile");
      expect(response.metadata!.source).toBe("groq");
    });

    it("should include token usage", async () => {
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));

      const response = await firstValueFrom(
        service.sendMessage({ message: "Test" }),
      );

      expect(response.metadata!.usage).toBeDefined();
      expect(response.metadata!.usage!.total_tokens).toBe(300);
    });
  });

  // ============================================================================
  // Request Options
  // ============================================================================

  describe("Request Options", () => {
    it("should pass session_id in request", async () => {
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));

      const request: ChatRequest = {
        message: "Test",
        session_id: "existing-session",
      };

      await firstValueFrom(service.sendMessage(request));

      expect(mockApiService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ session_id: "existing-session" }),
      );
    });

    it("should pass team_id in request", async () => {
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));

      const request: ChatRequest = {
        message: "Test",
        team_id: "team-123",
      };

      await firstValueFrom(service.sendMessage(request));

      expect(mockApiService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ team_id: "team-123" }),
      );
    });

    it("should pass goal and time_horizon", async () => {
      mockApiService.post.mockReturnValue(of(mockSuccessResponse));

      const request: ChatRequest = {
        message: "Test",
        goal: "Improve speed",
        time_horizon: "weekly",
      };

      await firstValueFrom(service.sendMessage(request));

      expect(mockApiService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          goal: "Improve speed",
          time_horizon: "weekly",
        }),
      );
    });
  });
});
