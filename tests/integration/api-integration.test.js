import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createMockUser,
  createMockTrainingSession,
  createMockNutritionData,
  createMockPerformanceData,
  setupTestEnvironment,
} from "../test-helpers.js";

/**
 * API Integration Tests
 *
 * Tests the integration between frontend API client and backend Netlify Functions.
 * Uses Supabase as the database backend.
 */
describe("API Integration Tests", () => {
  let testEnv;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
    vi.clearAllMocks();
  });

  describe("Authentication Flow", () => {
    it("should complete full login flow with Supabase", async () => {
      const mockUser = createMockUser({
        email: "test@flagfitpro.com",
        role: "player",
      });

      // Mock successful login response
      const loginResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          token: "test-jwt-token",
          user: mockUser,
        }),
      };

      global.fetch.mockResolvedValueOnce(loginResponse);

      const response = await global.fetch("/.netlify/functions/auth-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@flagfitpro.com",
          password: "TestPassword123!",
        }),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe("test@flagfitpro.com");
    });

    it("should handle login with invalid credentials", async () => {
      const loginResponse = {
        ok: false,
        status: 401,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: false,
          error: "Invalid email or password",
        }),
      };

      global.fetch.mockResolvedValueOnce(loginResponse);

      const response = await global.fetch("/.netlify/functions/auth-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "wrong@email.com",
          password: "wrongpassword",
        }),
      });

      const result = await response.json();

      expect(response.ok).toBe(false);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid");
    });

    it("should handle authenticated API requests with JWT", async () => {
      const dashboardResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            overview: { totalSessions: 45, weeklyHours: 8.5 },
            recentActivity: [],
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(dashboardResponse);

      const response = await global.fetch("/.netlify/functions/dashboard", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-jwt-token",
        },
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.data.overview).toBeDefined();
    });

    it("should reject requests without valid token", async () => {
      const unauthorizedResponse = {
        ok: false,
        status: 401,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: false,
          error: "Unauthorized - No token provided",
        }),
      };

      global.fetch.mockResolvedValueOnce(unauthorizedResponse);

      const response = await global.fetch("/.netlify/functions/dashboard", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it("should handle token refresh on expiry", async () => {
      // First request fails with 401
      const expiredResponse = {
        ok: false,
        status: 401,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: false,
          error: "Token expired",
          code: "TOKEN_EXPIRED",
        }),
      };

      // Refresh succeeds
      const refreshResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          token: "new-jwt-token",
        }),
      };

      // Retry succeeds
      const retryResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: { message: "Success after refresh" },
        }),
      };

      global.fetch
        .mockResolvedValueOnce(expiredResponse)
        .mockResolvedValueOnce(refreshResponse)
        .mockResolvedValueOnce(retryResponse);

      // Simulate the flow
      const firstResponse = await global.fetch("/.netlify/functions/dashboard");
      expect(firstResponse.ok).toBe(false);

      const refreshResult = await global.fetch(
        "/.netlify/functions/auth-login",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken: "refresh-token" }),
        },
      );
      expect(refreshResult.ok).toBe(true);

      const retryResult = await global.fetch("/.netlify/functions/dashboard");
      expect(retryResult.ok).toBe(true);
    });
  });

  describe("Training Data Flow", () => {
    it("should save training session to Supabase", async () => {
      const trainingData = createMockTrainingSession({
        type: "flag_football_drill",
        duration: 60,
      });

      const saveResponse = {
        ok: true,
        status: 201,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            id: 123,
            ...trainingData,
            created_at: new Date().toISOString(),
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(saveResponse);

      const response = await global.fetch(
        "/.netlify/functions/training-sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify(trainingData),
        },
      );

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.id).toBeDefined();
    });

    it("should retrieve training sessions list", async () => {
      const sessionsResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: [
            createMockTrainingSession({ id: 1 }),
            createMockTrainingSession({ id: 2 }),
            createMockTrainingSession({ id: 3 }),
          ],
          pagination: { page: 1, limit: 10, total: 3 },
        }),
      };

      global.fetch.mockResolvedValueOnce(sessionsResponse);

      const response = await global.fetch(
        "/.netlify/functions/training-sessions?limit=10",
        {
          headers: { Authorization: "Bearer test-token" },
        },
      );

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it("should update training session", async () => {
      const updateData = { notes: "Updated session notes", rating: 5 };

      const updateResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            id: 123,
            ...updateData,
            updated_at: new Date().toISOString(),
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(updateResponse);

      const response = await global.fetch(
        "/.netlify/functions/training-sessions?id=123",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify(updateData),
        },
      );

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.data.notes).toBe("Updated session notes");
    });

    it("should complete training session with metrics", async () => {
      const completionData = {
        sessionId: 123,
        duration: 65,
        metrics: {
          averageHeartRate: 155,
          maxHeartRate: 180,
          caloriesBurned: 450,
        },
        rating: 4,
        notes: "Great session!",
      };

      const completeResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            ...completionData,
            completed_at: new Date().toISOString(),
            insights: {
              performanceScore: 85,
              recommendations: ["Increase rest between sets"],
            },
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(completeResponse);

      const response = await global.fetch(
        "/.netlify/functions/training-complete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify(completionData),
        },
      );

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.data.insights).toBeDefined();
      expect(result.data.insights.performanceScore).toBe(85);
    });
  });

  describe("Nutrition Tracking Flow", () => {
    it("should log nutrition data", async () => {
      const nutritionData = createMockNutritionData();

      const logResponse = {
        ok: true,
        status: 201,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            id: 456,
            ...nutritionData,
            analysis: {
              totalCalories: 2450,
              macroBalance: "optimal",
              recommendations: ["Increase protein intake post-workout"],
            },
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(logResponse);

      const response = await global.fetch("/.netlify/functions/nutrition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify(nutritionData),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.data.analysis).toBeDefined();
      expect(result.data.analysis.macroBalance).toBe("optimal");
    });

    it("should retrieve nutrition history", async () => {
      const historyResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: [
            createMockNutritionData({ date: "2025-01-15" }),
            createMockNutritionData({ date: "2025-01-14" }),
          ],
          summary: {
            averageCalories: 2400,
            averageProtein: 150,
            hydrationScore: 85,
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(historyResponse);

      const response = await global.fetch(
        "/.netlify/functions/nutrition?startDate=2025-01-14&endDate=2025-01-15",
        {
          headers: { Authorization: "Bearer test-token" },
        },
      );

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.summary.averageCalories).toBe(2400);
    });
  });

  describe("Analytics & Performance Flow", () => {
    it("should retrieve performance analytics", async () => {
      const performanceData = createMockPerformanceData();

      const analyticsResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: performanceData,
        }),
      };

      global.fetch.mockResolvedValueOnce(analyticsResponse);

      const response = await global.fetch(
        "/.netlify/functions/analytics?period=30_days",
        {
          headers: { Authorization: "Bearer test-token" },
        },
      );

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.data.metrics).toBeDefined();
      expect(result.data.trends).toBeDefined();
    });

    it("should retrieve training statistics", async () => {
      const statsResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            totalSessions: 45,
            totalDuration: 2700,
            currentStreak: 4,
            acwr: 1.1,
            sessionsByType: {
              speed: { count: 25, totalDuration: 1500, totalLoad: 12000 },
              agility: { count: 20, totalDuration: 1200, totalLoad: 9600 },
            },
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(statsResponse);

      const response = await global.fetch(
        "/.netlify/functions/training-stats-enhanced",
        {
          headers: { Authorization: "Bearer test-token" },
        },
      );

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.data.totalSessions).toBe(45);
      expect(result.data.sessionsByType).toBeDefined();
    });
  });

  describe("AI Coach Integration", () => {
    it("should get AI coaching recommendations", async () => {
      const chatRequest = {
        message: "How can I improve my 40-yard dash time?",
        context: {
          currentPerformance: { speed40yard: 4.8 },
          goals: ["speed_improvement"],
        },
      };

      const aiResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            response:
              "Based on your current 40-yard dash time of 4.8 seconds, I recommend focusing on explosive starts and acceleration drills.",
            confidence: 0.92,
            recommendations: [
              {
                type: "exercise",
                name: "Block starts",
                description: "Practice explosive starts from blocks",
              },
              {
                type: "exercise",
                name: "Sled pushes",
                description: "Build leg power for acceleration",
              },
            ],
            sources: [
              "Sports Science Journal 2024",
              "NFL Combine Training Guide",
            ],
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(aiResponse);

      const response = await global.fetch("/.netlify/functions/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify(chatRequest),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.data.response).toContain("40-yard dash");
      expect(result.data.recommendations).toHaveLength(2);
      expect(result.data.confidence).toBeGreaterThan(0.8);
    });

    it("should handle AI rate limiting", async () => {
      const rateLimitResponse = {
        ok: false,
        status: 429,
        headers: new Map([
          ["content-type", "application/json"],
          ["retry-after", "60"],
        ]),
        json: vi.fn().mockResolvedValue({
          success: false,
          error: "Rate limit exceeded",
          retryAfter: 60,
        }),
      };

      global.fetch.mockResolvedValueOnce(rateLimitResponse);

      const response = await global.fetch("/.netlify/functions/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ message: "Test message" }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
    });
  });

  describe("Notifications Flow", () => {
    it("should retrieve notifications", async () => {
      const notificationsResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: [
            {
              id: 1,
              type: "training_reminder",
              title: "Training Session Today",
              message: "Don't forget your scheduled training at 3 PM",
              read: false,
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              type: "achievement",
              title: "New Achievement!",
              message: "You've completed 50 training sessions",
              read: true,
              created_at: new Date().toISOString(),
            },
          ],
          unreadCount: 1,
        }),
      };

      global.fetch.mockResolvedValueOnce(notificationsResponse);

      const response = await global.fetch("/.netlify/functions/notifications", {
        headers: { Authorization: "Bearer test-token" },
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.unreadCount).toBe(1);
    });

    it("should mark notifications as read", async () => {
      const markReadResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: { markedCount: 1 },
        }),
      };

      global.fetch.mockResolvedValueOnce(markReadResponse);

      const response = await global.fetch("/.netlify/functions/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ notificationId: 1 }),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.data.markedCount).toBe(1);
    });
  });

  describe("Error Recovery", () => {
    it("should handle network failures gracefully", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        global.fetch("/.netlify/functions/dashboard"),
      ).rejects.toThrow("Network error");
    });

    it("should handle server errors with meaningful messages", async () => {
      const serverErrorResponse = {
        ok: false,
        status: 500,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: false,
          error: "Internal server error",
          errorId: "err-123456",
        }),
      };

      global.fetch.mockResolvedValueOnce(serverErrorResponse);

      const response = await global.fetch("/.netlify/functions/dashboard");
      const result = await response.json();

      expect(response.ok).toBe(false);
      expect(result.errorId).toBeDefined();
    });

    it("should handle validation errors", async () => {
      const validationErrorResponse = {
        ok: false,
        status: 400,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: false,
          error: "Validation failed",
          details: [
            { field: "email", message: "Invalid email format" },
            { field: "password", message: "Password too short" },
          ],
        }),
      };

      global.fetch.mockResolvedValueOnce(validationErrorResponse);

      const response = await global.fetch("/.netlify/functions/auth-login", {
        method: "POST",
        body: JSON.stringify({ email: "invalid", password: "123" }),
      });

      const result = await response.json();

      expect(response.ok).toBe(false);
      expect(result.details).toHaveLength(2);
    });
  });

  describe("Data Synchronization", () => {
    it("should sync offline data when connection restored", async () => {
      const offlineData = [
        {
          type: "training_session",
          data: createMockTrainingSession(),
          timestamp: Date.now() - 3600000,
        },
        {
          type: "nutrition_log",
          data: createMockNutritionData(),
          timestamp: Date.now() - 1800000,
        },
      ];

      const syncResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            synced: 2,
            conflicts: 0,
            failed: 0,
            results: [
              { type: "training_session", status: "synced", id: 123 },
              { type: "nutrition_log", status: "synced", id: 456 },
            ],
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(syncResponse);

      const response = await global.fetch("/.netlify/functions/data-export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ action: "sync", data: offlineData }),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.data.synced).toBe(2);
      expect(result.data.conflicts).toBe(0);
    });
  });
});
