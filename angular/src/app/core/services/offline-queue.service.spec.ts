/**
 * OfflineQueueService Unit Tests
 *
 * Covers enhancements added in the April 2026 revamp:
 *  - localStorage persistence (save on enqueue, restore on init)
 *  - Background Sync registration (graceful no-op when unsupported)
 *  - retry exhaustion toast + removal
 *  - shouldQueue() network error detection
 *  - syncQueue() race-condition lock
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { HttpClient } from "@angular/common/http";
import { OfflineQueueService } from "./offline-queue.service";
import { LoggerService } from "./logger.service";
import { ToastService } from "./toast.service";
import { SupabaseService } from "./supabase.service";

// ── Minimal mocks ─────────────────────────────────────────────────────────────

const mockHttp = { request: vi.fn() };
const mockLogger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() };
const mockToast = { info: vi.fn(), warn: vi.fn(), success: vi.fn(), error: vi.fn() };
const mockSupabase = { getSession: vi.fn(() => null) };

// ── localStorage stub ─────────────────────────────────────────────────────────

function setupLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
    _store: store,
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe("OfflineQueueService", () => {
  let service: OfflineQueueService;
  let localStorageMock: ReturnType<typeof setupLocalStorageMock>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Replace localStorage on the global object
    localStorageMock = setupLocalStorageMock();
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // Ensure navigator.onLine is true by default
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });

    // Suppress Background Sync API (no serviceWorker in test env)
    Object.defineProperty(navigator, "serviceWorker", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        OfflineQueueService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: LoggerService, useValue: mockLogger },
        { provide: ToastService, useValue: mockToast },
        { provide: SupabaseService, useValue: mockSupabase },
      ],
    });

    service = TestBed.inject(OfflineQueueService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // queueAction + localStorage persistence
  // ──────────────────────────────────────────────────────────────────────────

  describe("queueAction and localStorage persistence", () => {
    it("adds action to queue signal", () => {
      service.queueAction("wellness_checkin", { score: 8 });
      expect(service.queueSize()).toBe(1);
    });

    it("saves queue to localStorage on enqueue", () => {
      service.queueAction("training_log", { duration: 60 });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "flagfit_offline_queue",
        expect.any(String),
      );
    });

    it("serialized payload includes action type and timestamp as ISO string", () => {
      service.queueAction("game_action", { gameId: "g1" });
      const raw = localStorageMock._store["flagfit_offline_queue"];
      const parsed = JSON.parse(raw) as Record<string, unknown>[];
      expect(parsed[0].type).toBe("game_action");
      expect(typeof parsed[0].timestamp).toBe("string");
      // Should be a valid ISO date string
      expect(() => new Date(parsed[0].timestamp as string)).not.toThrow();
    });

    it("removeAction removes the action and updates localStorage", () => {
      const id = service.queueAction("wellness_checkin", {});
      expect(service.queueSize()).toBe(1);

      service.removeAction(id);
      expect(service.queueSize()).toBe(0);

      const raw = localStorageMock._store["flagfit_offline_queue"];
      const parsed = JSON.parse(raw) as unknown[];
      expect(parsed.length).toBe(0);
    });

    it("clearQueue empties the signal and removes localStorage key", () => {
      service.queueAction("wellness_checkin", {});
      service.clearQueue();

      expect(service.queueSize()).toBe(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("flagfit_offline_queue");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // loadQueueFromStorage (called in constructor)
  // ──────────────────────────────────────────────────────────────────────────

  describe("loadQueueFromStorage", () => {
    it("restores queued actions from localStorage on construction", () => {
      // Pre-populate storage before service construction
      const stored = JSON.stringify([
        {
          id: "action_stored_1",
          type: "training_log",
          payload: {},
          timestamp: new Date().toISOString(),
          retryCount: 0,
          priority: "medium",
        },
      ]);
      localStorageMock._store["flagfit_offline_queue"] = stored;

      // Rebuild service so constructor runs again
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          OfflineQueueService,
          { provide: HttpClient, useValue: mockHttp },
          { provide: LoggerService, useValue: mockLogger },
          { provide: ToastService, useValue: mockToast },
          { provide: SupabaseService, useValue: mockSupabase },
        ],
      });
      const fresh = TestBed.inject(OfflineQueueService);

      expect(fresh.queueSize()).toBe(1);
    });

    it("drops actions with retryCount >= 3 during restore", () => {
      const stored = JSON.stringify([
        {
          id: "exhausted_action",
          type: "wellness_checkin",
          payload: {},
          timestamp: new Date().toISOString(),
          retryCount: 3, // Already exhausted
          priority: "high",
        },
        {
          id: "valid_action",
          type: "wellness_checkin",
          payload: {},
          timestamp: new Date().toISOString(),
          retryCount: 1,
          priority: "low",
        },
      ]);
      localStorageMock._store["flagfit_offline_queue"] = stored;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          OfflineQueueService,
          { provide: HttpClient, useValue: mockHttp },
          { provide: LoggerService, useValue: mockLogger },
          { provide: ToastService, useValue: mockToast },
          { provide: SupabaseService, useValue: mockSupabase },
        ],
      });
      const fresh = TestBed.inject(OfflineQueueService);

      expect(fresh.queueSize()).toBe(1);
    });

    it("handles corrupt localStorage gracefully (no throw)", () => {
      localStorageMock._store["flagfit_offline_queue"] = "NOT_VALID_JSON{{{";

      expect(() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            OfflineQueueService,
            { provide: HttpClient, useValue: mockHttp },
            { provide: LoggerService, useValue: mockLogger },
            { provide: ToastService, useValue: mockToast },
            { provide: SupabaseService, useValue: mockSupabase },
          ],
        });
        TestBed.inject(OfflineQueueService);
      }).not.toThrow();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Background Sync registration
  // ──────────────────────────────────────────────────────────────────────────

  describe("registerBackgroundSync", () => {
    it("does not throw when serviceWorker is unavailable", () => {
      // serviceWorker already set to undefined in beforeEach
      expect(() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            OfflineQueueService,
            { provide: HttpClient, useValue: mockHttp },
            { provide: LoggerService, useValue: mockLogger },
            { provide: ToastService, useValue: mockToast },
            { provide: SupabaseService, useValue: mockSupabase },
          ],
        });
        TestBed.inject(OfflineQueueService);
      }).not.toThrow();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // shouldQueue
  // ──────────────────────────────────────────────────────────────────────────

  describe("shouldQueue", () => {
    it("returns true when offline", () => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      // Rebuild service after going offline
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          OfflineQueueService,
          { provide: HttpClient, useValue: mockHttp },
          { provide: LoggerService, useValue: mockLogger },
          { provide: ToastService, useValue: mockToast },
          { provide: SupabaseService, useValue: mockSupabase },
        ],
      });
      const offlineService = TestBed.inject(OfflineQueueService);
      expect(offlineService.shouldQueue(new Error("some error"))).toBe(true);
    });

    it('returns true for "Failed to fetch" network error', () => {
      expect(service.shouldQueue(new Error("Failed to fetch"))).toBe(true);
    });

    it('returns true for "NetworkError" errors', () => {
      expect(service.shouldQueue(new Error("NetworkError when attempting to fetch"))).toBe(true);
    });

    it("returns false for a non-network error", () => {
      expect(service.shouldQueue(new Error("400 Bad Request"))).toBe(false);
    });

    it("returns false for non-Error values", () => {
      expect(service.shouldQueue("just a string")).toBe(false);
      expect(service.shouldQueue(null)).toBe(false);
      expect(service.shouldQueue({ status: 500 })).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // syncQueue — retry exhaustion
  // ──────────────────────────────────────────────────────────────────────────

  describe("syncQueue retry exhaustion", () => {
    it("shows error toast and removes action after 3 failed syncs", async () => {
      const { of: rxOf } = await import("rxjs");
      const { throwError } = await import("rxjs");

      // Action that will always fail
      mockHttp.request.mockReturnValue(throwError(() => new Error("timeout")));

      service.queueAction("wellness_checkin", { score: 5 }, "high");
      expect(service.queueSize()).toBe(1);

      // Run sync 3 times to exhaust retries
      await service.syncQueue();
      await service.syncQueue();
      await service.syncQueue();

      expect(mockToast.error).toHaveBeenCalled();
      expect(service.queueSize()).toBe(0);

      void rxOf; // suppress unused import warning
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // queueGenericRequest
  // ──────────────────────────────────────────────────────────────────────────

  describe("queueGenericRequest", () => {
    it("queues a generic POST with correct type and endpoint", () => {
      service.queueGenericRequest("/api/notifications", "POST", { foo: "bar" });
      const action = service.queue()[0];
      expect(action.type).toBe("generic_post");
      expect(action.endpoint).toBe("/api/notifications");
      expect(action.method).toBe("POST");
    });

    it("queues a generic PATCH with correct type", () => {
      service.queueGenericRequest("/api/notifications/preferences", "PATCH", {
        val: 1,
      });
      expect(service.queue()[0].type).toBe("generic_patch");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // computed signals
  // ──────────────────────────────────────────────────────────────────────────

  describe("computed signals", () => {
    it("hasPendingActions is false when queue is empty", () => {
      expect(service.hasPendingActions()).toBe(false);
    });

    it("hasPendingActions is true after enqueue", () => {
      service.queueAction("training_log", {});
      expect(service.hasPendingActions()).toBe(true);
    });

    it("highPriorityPending counts only high-priority actions", () => {
      service.queueAction("training_log", {}, "high");
      service.queueAction("wellness_checkin", {}, "medium");
      service.queueAction("game_action", {}, "high");
      expect(service.highPriorityPending()).toBe(2);
    });
  });
});
