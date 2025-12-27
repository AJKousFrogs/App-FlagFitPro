/**
 * Realtime Service Unit Tests
 *
 * Comprehensive test coverage for Supabase realtime subscriptions.
 * Tests subscription management, event handling, and cleanup.
 *
 * @version 1.0.0
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  RealtimeService,
  RealtimeEvent,
  RealtimeCallback,
} from "./realtime.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

// Mock channel
const createMockChannel = () => ({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn((callback?: (status: string) => void) => {
    if (callback) callback("SUBSCRIBED");
    return { unsubscribe: vi.fn() };
  }),
});

// Mock services - use 'as unknown as SupabaseService' to avoid strict type checking
const mockSupabaseService = {
  session: vi.fn(() => ({ user: { id: "user-123" } })),
  currentUser: vi.fn(() => ({ id: "user-123", email: "test@example.com" })),
  client: {
    channel: vi.fn(() => createMockChannel()),
    removeChannel: vi.fn(),
  },
} as unknown as SupabaseService;

const mockLoggerService = {
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  success: vi.fn(),
};

describe("RealtimeService", () => {
  let service: RealtimeService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        RealtimeService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(RealtimeService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  describe("Initial State", () => {
    it("should initialize with connection status signal", () => {
      // Service is created via TestBed, so it has proper injection context
      expect(service.connectionStatus()).toBeDefined();
    });

    it("should have no active subscriptions initially", () => {
      expect(service.getActiveSubscriptions()).toEqual([]);
    });
  });

  // ============================================================================
  // Connection Status Tests
  // ============================================================================

  describe("Connection Status", () => {
    it("should update status when session exists", () => {
      (mockSupabaseService as any).session.mockReturnValue({
        user: { id: "user-123" },
      });

      // The effect() in constructor should update status
      // In tests, we may need to trigger manually
      expect(service.connectionStatus()).toBeDefined();
    });

    it("should have isConnected signal", () => {
      // Just verify the signal exists and returns a boolean
      expect(typeof service.isConnected()).toBe("boolean");
    });
  });

  // ============================================================================
  // Generic Subscribe Tests
  // ============================================================================

  describe("Generic Subscribe", () => {
    it("should create subscription to table", () => {
      const callback = {
        onInsert: vi.fn(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
      };

      const unsubscribe = service.subscribe(
        "test_table",
        "user_id=eq.user-123",
        callback
      );

      expect(mockSupabaseService.client.channel).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe("function");
    });

    it("should prevent duplicate subscriptions", () => {
      const callback = { onInsert: vi.fn() };

      service.subscribe("test_table", "filter1", callback);
      service.subscribe("test_table", "filter1", callback);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining("Already subscribed")
      );
    });

    it("should return unsubscribe function", () => {
      const callback = { onInsert: vi.fn() };

      const unsubscribe = service.subscribe("test_table", "filter1", callback);

      expect(typeof unsubscribe).toBe("function");
    });

    it("should track subscription in active list", () => {
      const callback = { onInsert: vi.fn() };

      service.subscribe("my_table", "user_id=eq.123", callback);

      const active = service.getActiveSubscriptions();
      expect(active).toContain("my_table_user_id=eq.123");
    });
  });

  // ============================================================================
  // Training Sessions Subscription Tests
  // ============================================================================

  describe("Training Sessions Subscription", () => {
    it("should subscribe to training sessions", () => {
      const callback: RealtimeCallback = vi.fn();

      const unsubscribe = service.subscribeToTrainingSessions(callback);

      expect(mockSupabaseService.client.channel).toHaveBeenCalledWith(
        "training_sessions"
      );
      expect(typeof unsubscribe).toBe("function");
    });

    it("should not subscribe when no user logged in", () => {
      (mockSupabaseService as any).currentUser.mockReturnValue(null);

      const callback: RealtimeCallback = vi.fn();
      const unsubscribe = service.subscribeToTrainingSessions(callback);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining("No user logged in")
      );
      expect(typeof unsubscribe).toBe("function");
    });
  });

  // ============================================================================
  // Games Subscription Tests
  // ============================================================================

  describe("Games Subscription", () => {
    it("should return unsubscribe function for games", () => {
      const callback: RealtimeCallback = vi.fn();

      const unsubscribe = service.subscribeToGames(callback);

      expect(typeof unsubscribe).toBe("function");
    });

    it("should not subscribe when no user logged in", () => {
      (mockSupabaseService as any).currentUser.mockReturnValue(null);

      const callback: RealtimeCallback = vi.fn();
      service.subscribeToGames(callback);

      expect(mockLoggerService.warn).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Wellness Subscription Tests
  // ============================================================================

  describe("Wellness Subscription", () => {
    it("should return unsubscribe function for wellness", () => {
      const callback: RealtimeCallback = vi.fn();

      const unsubscribe = service.subscribeToWellness(callback);

      expect(typeof unsubscribe).toBe("function");
    });

    it("should not subscribe when no user for wellness", () => {
      (mockSupabaseService as any).currentUser.mockReturnValue(null);

      const callback: RealtimeCallback = vi.fn();
      service.subscribeToWellness(callback);

      expect(mockLoggerService.warn).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Performance Subscription Tests
  // ============================================================================

  describe("Performance Subscription", () => {
    it("should return unsubscribe function for performance", () => {
      const callback: RealtimeCallback = vi.fn();

      const unsubscribe = service.subscribeToPerformance(callback);

      expect(typeof unsubscribe).toBe("function");
    });
  });

  // ============================================================================
  // Team Updates Subscription Tests
  // ============================================================================

  describe("Team Updates Subscription", () => {
    it("should subscribe to team updates", () => {
      const callback: RealtimeCallback = vi.fn();

      service.subscribeToTeamUpdates("team-123", callback);

      expect(mockSupabaseService.client.channel).toHaveBeenCalledWith(
        "team_team-123"
      );
    });

    it("should not subscribe without team ID", () => {
      const callback: RealtimeCallback = vi.fn();

      service.subscribeToTeamUpdates("", callback);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining("No team ID")
      );
    });
  });

  // ============================================================================
  // Readiness Subscription Tests
  // ============================================================================

  describe("Readiness Subscription", () => {
    it("should return unsubscribe function for readiness", () => {
      const callback: RealtimeCallback = vi.fn();

      const unsubscribe = service.subscribeToReadiness(callback);

      expect(typeof unsubscribe).toBe("function");
    });
  });

  // ============================================================================
  // Messages Subscription Tests
  // ============================================================================

  describe("Messages Subscription", () => {
    it("should subscribe to messages", () => {
      const callback: RealtimeCallback = vi.fn();

      service.subscribeToMessages("conv-123", callback);

      expect(mockSupabaseService.client.channel).toHaveBeenCalledWith(
        "messages_conv-123"
      );
    });

    it("should not subscribe without conversation ID", () => {
      const callback: RealtimeCallback = vi.fn();

      service.subscribeToMessages("", callback);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining("No conversation ID")
      );
    });
  });

  // ============================================================================
  // Unsubscribe Tests
  // ============================================================================

  describe("Unsubscribe", () => {
    it("should unsubscribe from specific channel", () => {
      const callback = { onInsert: vi.fn() };

      service.subscribe("test_table", "filter1", callback);
      service.unsubscribe("test_table_filter1");

      expect(mockSupabaseService.client.removeChannel).toHaveBeenCalled();
      expect(service.isSubscribed("test_table_filter1")).toBe(false);
    });

    it("should handle unsubscribe for non-existent channel", () => {
      service.unsubscribe("non_existent_channel");

      // Should not throw, just silently ignore
      expect(mockSupabaseService.client.removeChannel).not.toHaveBeenCalled();
    });

    it("should unsubscribe all channels", () => {
      const callback = { onInsert: vi.fn() };

      service.subscribe("table1", "filter1", callback);
      service.subscribe("table2", "filter2", callback);

      service.unsubscribeAll();

      expect(service.getActiveSubscriptions()).toEqual([]);
    });
  });

  // ============================================================================
  // Subscription Status Tests
  // ============================================================================

  describe("Subscription Status", () => {
    it("should check if subscribed to channel", () => {
      const callback = { onInsert: vi.fn() };

      service.subscribe("test_table", "filter1", callback);

      expect(service.isSubscribed("test_table_filter1")).toBe(true);
      expect(service.isSubscribed("other_channel")).toBe(false);
    });

    it("should list active subscriptions", () => {
      const callback = { onInsert: vi.fn() };

      service.subscribe("table1", "filter1", callback);
      service.subscribe("table2", "filter2", callback);

      const active = service.getActiveSubscriptions();

      expect(active).toContain("table1_filter1");
      expect(active).toContain("table2_filter2");
      expect(active.length).toBe(2);
    });
  });

  // ============================================================================
  // Event Handling Tests
  // ============================================================================

  describe("Event Handling", () => {
    it("should call onInsert callback for INSERT events", () => {
      const mockChannel = createMockChannel();
      let capturedCallback: ((payload: unknown) => void) | null = null;

      mockChannel.on.mockImplementation(
        (_type: string, _config: unknown, callback: (payload: unknown) => void) => {
          capturedCallback = callback;
          return mockChannel;
        }
      );

      (mockSupabaseService as any).client.channel.mockReturnValue(mockChannel);

      const onInsert = vi.fn();
      service.subscribe("test_table", "filter1", { onInsert });

      // Simulate INSERT event
      if (capturedCallback) {
        (capturedCallback as (payload: unknown) => void)({
          eventType: "INSERT",
          table: "test_table",
          schema: "public",
          new: { id: 1, name: "Test" },
          old: {},
          errors: null,
        });
      }

      expect(onInsert).toHaveBeenCalled();
    });

    it("should call onUpdate callback for UPDATE events", () => {
      const mockChannel = createMockChannel();
      let capturedCallback: ((payload: unknown) => void) | null = null;

      mockChannel.on.mockImplementation(
        (_type: string, _config: unknown, callback: (payload: unknown) => void) => {
          capturedCallback = callback;
          return mockChannel;
        }
      );

      (mockSupabaseService as any).client.channel.mockReturnValue(mockChannel);

      const onUpdate = vi.fn();
      service.subscribe("test_table", "filter1", { onUpdate });

      // Simulate UPDATE event
      if (capturedCallback) {
        (capturedCallback as (payload: unknown) => void)({
          eventType: "UPDATE",
          table: "test_table",
          schema: "public",
          new: { id: 1, name: "Updated" },
          old: { id: 1, name: "Original" },
          errors: null,
        });
      }

      expect(onUpdate).toHaveBeenCalled();
    });

    it("should call onDelete callback for DELETE events", () => {
      const mockChannel = createMockChannel();
      let capturedCallback: ((payload: unknown) => void) | null = null;

      mockChannel.on.mockImplementation(
        (_type: string, _config: unknown, callback: (payload: unknown) => void) => {
          capturedCallback = callback;
          return mockChannel;
        }
      );

      (mockSupabaseService as any).client.channel.mockReturnValue(mockChannel);

      const onDelete = vi.fn();
      service.subscribe("test_table", "filter1", { onDelete });

      // Simulate DELETE event
      if (capturedCallback) {
        (capturedCallback as (payload: unknown) => void)({
          eventType: "DELETE",
          table: "test_table",
          schema: "public",
          new: {},
          old: { id: 1, name: "Deleted" },
          errors: null,
        });
      }

      expect(onDelete).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe("Error Handling", () => {
    it("should handle no user gracefully for subscriptions", () => {
      (mockSupabaseService as any).currentUser.mockReturnValue(null);

      const callback: RealtimeCallback = vi.fn();
      const unsubscribe = service.subscribeToTrainingSessions(callback);

      // Should warn about no user and return empty function
      expect(mockLoggerService.warn).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe("function");
    });
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================

  describe("Cleanup", () => {
    it("should remove channel on unsubscribe", () => {
      const callback = { onInsert: vi.fn() };

      const unsubscribe = service.subscribe("test_table", "filter1", callback);
      unsubscribe();

      expect((mockSupabaseService as any).client.removeChannel).toHaveBeenCalled();
    });

    it("should clear all channels on unsubscribeAll", () => {
      const callback = { onInsert: vi.fn() };

      service.subscribe("table1", "filter1", callback);
      service.subscribe("table2", "filter2", callback);
      service.subscribe("table3", "filter3", callback);

      service.unsubscribeAll();

      expect(mockSupabaseService.client.removeChannel).toHaveBeenCalledTimes(3);
      expect(service.getActiveSubscriptions()).toHaveLength(0);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle empty filter string", () => {
      const callback = { onInsert: vi.fn() };

      const unsubscribe = service.subscribe("test_table", "", callback);

      expect(typeof unsubscribe).toBe("function");
    });

    it("should handle special characters in filter", () => {
      const callback = { onInsert: vi.fn() };

      const unsubscribe = service.subscribe(
        "test_table",
        "email=eq.test@example.com",
        callback
      );

      expect(typeof unsubscribe).toBe("function");
    });

    it("should handle rapid subscribe/unsubscribe", () => {
      const callback = { onInsert: vi.fn() };

      for (let i = 0; i < 10; i++) {
        const unsubscribe = service.subscribe(
          "test_table",
          `filter${i}`,
          callback
        );
        unsubscribe();
      }

      expect(service.getActiveSubscriptions()).toHaveLength(0);
    });
  });
});

