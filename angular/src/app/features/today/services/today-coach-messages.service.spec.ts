import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { firstValueFrom, of } from "rxjs";

import {
  CoachMessageProtocol,
  TodayCoachMessagesService,
  formatCoachTimestamp,
  getCoachAuthor,
} from "./today-coach-messages.service";
import { ApiService } from "../../../core/services/api.service";
import { ToastService } from "../../../core/services/toast.service";

const mockApiService = {
  post: vi.fn(),
  get: vi.fn(),
};

const mockToastService = {
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("TodayCoachMessagesService", () => {
  let service: TodayCoachMessagesService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [
        TodayCoachMessagesService,
        { provide: ApiService, useValue: mockApiService },
        { provide: ToastService, useValue: mockToastService },
      ],
    });
    service = TestBed.inject(TodayCoachMessagesService);
  });

  describe("showAlert", () => {
    it("is a silent no-op when protocol is null", () => {
      service.showAlert(null);
      expect(mockToastService.info).not.toHaveBeenCalled();
    });

    it("surfaces the coach alert message via info toast with the author in the title", () => {
      const protocol: CoachMessageProtocol = {
        coach_alert_message: "Skip sprints today.",
        modified_by_coach_name: "Coach Doe",
      };
      service.showAlert(protocol);
      expect(mockToastService.info).toHaveBeenCalledWith(
        "Skip sprints today.",
        "Coach Alert from Coach Doe",
        10000,
      );
    });

    it("falls back to a generic message when coach_alert_message is empty", () => {
      service.showAlert({ modified_by_coach_name: "Coach Doe" });
      expect(mockToastService.info).toHaveBeenCalledWith(
        "Coach has updated your plan.",
        "Coach Alert from Coach Doe",
        10000,
      );
    });

    it("queues a coach-note toast 500ms after the alert when a note is attached", () => {
      service.showAlert({
        coach_alert_message: "Heads up.",
        coach_note: { content: "Drink water" },
        modified_by_coach_name: "Coach Doe",
      });
      // Alert fires immediately.
      expect(mockToastService.info).toHaveBeenCalledTimes(1);
      // Advance past the deferred note.
      vi.advanceTimersByTime(500);
      expect(mockToastService.info).toHaveBeenCalledTimes(2);
      expect(mockToastService.info).toHaveBeenLastCalledWith(
        "Drink water",
        "Coach Note from Coach Doe",
        10000,
      );
    });

    it("does not queue a note toast when coach_note.content is blank or whitespace", () => {
      service.showAlert({
        coach_alert_message: "Heads up.",
        coach_note: { content: "   " },
        modified_by_coach_name: "Coach Doe",
      });
      vi.advanceTimersByTime(1000);
      expect(mockToastService.info).toHaveBeenCalledTimes(1);
    });
  });

  describe("showNote", () => {
    it("surfaces the note when present", () => {
      service.showNote({
        coach_note: { content: "Stretch tonight." },
        modified_by_coach_name: "Coach Doe",
      });
      expect(mockToastService.info).toHaveBeenCalledWith(
        "Stretch tonight.",
        "Coach Note from Coach Doe",
        10000,
      );
    });

    it("shows an info toast when no note is attached so the click feels acknowledged", () => {
      service.showNote(null);
      expect(mockToastService.info).toHaveBeenCalledWith(
        "No coach note is attached to today's plan.",
        "Coach Note",
      );
    });
  });

  describe("acknowledge", () => {
    it("returns { ok: true } on a wrapped success response", async () => {
      mockApiService.post.mockReturnValue(of({ success: true, data: {} }));
      const result = await firstValueFrom(
        service.acknowledge("alert-1", "2026-05-11"),
      );
      expect(result.ok).toBe(true);
      expect(mockApiService.post).toHaveBeenCalledWith(
        "/api/coach-alerts/alert-1/acknowledge",
        { sessionDate: "2026-05-11" },
      );
    });

    it("returns { ok: false, message } on a wrapped failure", async () => {
      mockApiService.post.mockReturnValue(
        of({ success: false, error: "Cannot acknowledge once practice starts" }),
      );
      const result = await firstValueFrom(
        service.acknowledge("alert-1", "2026-05-11"),
      );
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Cannot acknowledge once practice starts");
    });

    it("provides a default error message when the failure payload omits one", async () => {
      mockApiService.post.mockReturnValue(of({ success: false }));
      const result = await firstValueFrom(
        service.acknowledge("alert-1", "2026-05-11"),
      );
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Failed to acknowledge alert");
    });
  });

  describe("resolveSessionDate", () => {
    it("returns protocol_date when present", () => {
      expect(
        service.resolveSessionDate({ protocol_date: "2026-05-09" }),
      ).toBe("2026-05-09");
    });

    it("falls back to local today when null", () => {
      const result = service.resolveSessionDate(null);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────
// Pure helpers
// ──────────────────────────────────────────────────────────────────────────

describe("getCoachAuthor", () => {
  it("returns the coach name when present", () => {
    expect(getCoachAuthor({ modified_by_coach_name: "Coach Doe" })).toBe(
      "Coach Doe",
    );
  });

  it("returns 'Your coach' when null", () => {
    expect(getCoachAuthor(null)).toBe("Your coach");
  });

  it("returns 'Your coach' when the name is empty or whitespace", () => {
    expect(getCoachAuthor({ modified_by_coach_name: "   " })).toBe("Your coach");
  });
});

describe("formatCoachTimestamp", () => {
  it("returns 'X minutes ago' for sub-hour deltas", () => {
    const past = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(formatCoachTimestamp(past)).toBe("30 minutes ago");
  });

  it("returns 'X hours ago' for sub-day deltas", () => {
    const past = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    expect(formatCoachTimestamp(past)).toBe("5 hours ago");
  });

  it("returns singular for exactly 1 minute and 1 hour", () => {
    const oneMin = new Date(Date.now() - 60 * 1000).toISOString();
    expect(formatCoachTimestamp(oneMin)).toBe("1 minute ago");
    const oneHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(formatCoachTimestamp(oneHour)).toBe("1 hour ago");
  });

  it("falls back to a short date string beyond 24 hours", () => {
    const past = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const formatted = formatCoachTimestamp(past);
    // Format is "MMM d, h:mm AM/PM" — assert structure rather than literal.
    expect(formatted).toMatch(/\d+/); // contains a day number
    expect(formatted).not.toMatch(/ago/);
  });

  it("returns the input string when the timestamp is unparseable", () => {
    expect(formatCoachTimestamp("not-a-date")).toBe("not-a-date");
  });
});
