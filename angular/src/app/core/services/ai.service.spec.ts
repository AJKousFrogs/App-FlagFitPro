/**
 * AIService.sendMessage unit tests
 *
 * Locks the Merlin send path: consent gating (GDPR Art. 22), the
 * RawMerlinReply → MerlinReply mapping, empty-answer rejection, optional
 * session continuity, and error propagation. ApiService + PrivacySettingsService
 * are mocked so this is pure mapping/contract coverage.
 */
import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { firstValueFrom, of, throwError } from "rxjs";
import { AIService } from "./ai.service";
import { ApiService, API_ENDPOINTS } from "./api.service";
import { PrivacySettingsService } from "./privacy-settings.service";
import { LoggerService } from "./logger.service";

const rawReply = {
  chat_session_id: "sess-1",
  message_id: "msg-1",
  answer_markdown: "Skip the sprints today — your ACWR is elevated.",
  risk_level: "medium",
  disclaimer: "Not medical advice.",
  suggested_actions: [{ label: "View load", route: "/acwr" }],
  is_blocked: false,
};

// Untyped vi.fn() so tests can return partial payloads (the service defaults
// missing fields) without fighting the inferred full-reply type.
const mockApi = {
  post: vi.fn(),
};
const mockPrivacy = {
  requireAiConsent: vi.fn(() => Promise.resolve()),
};
const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
};

describe("AIService.sendMessage", () => {
  let service: AIService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.post.mockReturnValue(of({ success: true, data: rawReply }));
    mockPrivacy.requireAiConsent.mockReturnValue(Promise.resolve());
    TestBed.configureTestingModule({
      providers: [
        AIService,
        { provide: ApiService, useValue: mockApi },
        { provide: PrivacySettingsService, useValue: mockPrivacy },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });
    service = TestBed.inject(AIService);
  });

  it("maps the raw reply to a clean MerlinReply", async () => {
    const reply = await firstValueFrom(service.sendMessage("should I sprint?"));
    expect(reply).toEqual({
      chatSessionId: "sess-1",
      messageId: "msg-1",
      answer: "Skip the sprints today — your ACWR is elevated.",
      riskLevel: "medium",
      disclaimer: "Not medical advice.",
      suggestedActions: [{ label: "View load", route: "/acwr" }],
      isBlocked: false,
    });
  });

  it("requires AI consent before posting", async () => {
    await firstValueFrom(service.sendMessage("hi"));
    expect(mockPrivacy.requireAiConsent).toHaveBeenCalledOnce();
    expect(mockApi.post).toHaveBeenCalledWith(API_ENDPOINTS.aiChat.send, {
      message: "hi",
    });
  });

  it("rejects when consent is not granted (and does not post)", async () => {
    mockPrivacy.requireAiConsent.mockReturnValue(
      Promise.reject(new Error("AI processing is disabled")),
    );
    await expect(firstValueFrom(service.sendMessage("hi"))).rejects.toThrow(
      /disabled/i,
    );
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it("includes session_id when continuing a conversation", async () => {
    await firstValueFrom(service.sendMessage("next", "sess-1"));
    expect(mockApi.post).toHaveBeenCalledWith(API_ENDPOINTS.aiChat.send, {
      message: "next",
      session_id: "sess-1",
    });
  });

  it("throws on an empty answer rather than rendering a blank bubble", async () => {
    mockApi.post.mockReturnValue(
      of({ success: true, data: { answer_markdown: "  " } }),
    );
    await expect(firstValueFrom(service.sendMessage("hi"))).rejects.toThrow(
      /empty/i,
    );
  });

  it("defaults suggestedActions to [] and isBlocked to false when absent", async () => {
    mockApi.post.mockReturnValue(
      of({ success: true, data: { answer_markdown: "ok" } }),
    );
    const reply = await firstValueFrom(service.sendMessage("hi"));
    expect(reply.suggestedActions).toEqual([]);
    expect(reply.isBlocked).toBe(false);
    expect(reply.chatSessionId).toBeNull();
  });

  it("propagates and logs a server error", async () => {
    mockApi.post.mockReturnValue(throwError(() => new Error("500")));
    await expect(firstValueFrom(service.sendMessage("hi"))).rejects.toThrow(
      "500",
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      "merlin_send_failed",
      expect.any(Error),
    );
  });
});
