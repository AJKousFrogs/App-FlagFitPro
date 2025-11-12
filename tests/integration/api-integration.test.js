import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthManager } from "../../src/auth-manager.js";
import { ApiConfig } from "../../src/api-config.js";

describe("API Integration Tests", () => {
  let authManager;
  let apiConfig;

  beforeEach(() => {
    authManager = new AuthManager();
    apiConfig = new ApiConfig();

    // Mock server responses
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication Flow", () => {
    it("should complete full login flow", async () => {
      // Mock successful login response
      const loginResponse = {
        ok: true,
        json: async () => ({
          token: "test-jwt-token",
          user: {
            id: 1,
            email: "test@example.com",
            name: "Test User",
            role: "athlete",
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(loginResponse);

      const result = await authManager.login("test@example.com", "password123");

      expect(result.success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "auth_token",
        "test-jwt-token",
      );
      expect(authManager.isAuthenticated()).toBe(true);
      expect(authManager.getCurrentUser().email).toBe("test@example.com");
    });

    it("should handle authenticated API requests", async () => {
      // Set up authenticated user
      localStorage.getItem = vi.fn().mockReturnValue("test-jwt-token");

      const apiResponse = {
        ok: true,
        json: async () => ({ data: "protected-data" }),
      };

      global.fetch.mockResolvedValueOnce(apiResponse);

      const result = await apiConfig.makeRequest("/api/dashboard", "GET");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/dashboard"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-jwt-token",
          }),
        }),
      );
      expect(result.data).toBe("protected-data");
    });

    it("should handle token refresh on 401 errors", async () => {
      localStorage.getItem = vi.fn().mockReturnValue("expired-token");

      // First request fails with 401
      const unauthorizedResponse = {
        ok: false,
        status: 401,
        json: async () => ({ error: "Token expired" }),
      };

      // Refresh token request succeeds
      const refreshResponse = {
        ok: true,
        json: async () => ({ token: "new-token" }),
      };

      // Retry original request succeeds
      const retryResponse = {
        ok: true,
        json: async () => ({ data: "success" }),
      };

      global.fetch
        .mockResolvedValueOnce(unauthorizedResponse)
        .mockResolvedValueOnce(refreshResponse)
        .mockResolvedValueOnce(retryResponse);

      const result = await apiConfig.makeRequest("/api/data", "GET");

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "auth_token",
        "new-token",
      );
      expect(result.data).toBe("success");
    });
  });

  describe("Training Data Flow", () => {
    it("should save and retrieve training session", async () => {
      localStorage.getItem = vi.fn().mockReturnValue("valid-token");

      const trainingData = {
        type: "flag_football_drill",
        duration: 60,
        exercises: [
          { name: "Sprint intervals", sets: 5, reps: 100 },
          { name: "Flag pulling", sets: 10, reps: 20 },
        ],
        notes: "Good session, focused on speed",
      };

      // Mock save response
      const saveResponse = {
        ok: true,
        json: async () => ({ id: 123, ...trainingData }),
      };

      global.fetch.mockResolvedValueOnce(saveResponse);

      const saveResult = await apiConfig.makeRequest(
        "/api/training",
        "POST",
        trainingData,
      );

      expect(saveResult.id).toBe(123);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/training"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(trainingData),
        }),
      );

      // Mock retrieve response
      const getResponse = {
        ok: true,
        json: async () => ({ id: 123, ...trainingData }),
      };

      global.fetch.mockResolvedValueOnce(getResponse);

      const getResult = await apiConfig.makeRequest("/api/training/123", "GET");

      expect(getResult.type).toBe("flag_football_drill");
      expect(getResult.exercises).toHaveLength(2);
    });
  });

  describe("Nutrition Tracking Flow", () => {
    it("should log and analyze nutrition data", async () => {
      localStorage.getItem = vi.fn().mockReturnValue("valid-token");

      const nutritionData = {
        date: "2025-01-15",
        meals: [
          {
            type: "breakfast",
            foods: [
              { name: "Oatmeal", calories: 150, protein: 5, carbs: 30, fat: 3 },
              {
                name: "Banana",
                calories: 100,
                protein: 1,
                carbs: 25,
                fat: 0.5,
              },
            ],
          },
        ],
      };

      // Mock nutrition log response
      const logResponse = {
        ok: true,
        json: async () => ({
          id: 456,
          ...nutritionData,
          analysis: {
            totalCalories: 250,
            macroRatio: { protein: 10, carbs: 80, fat: 10 },
            recommendation: "Increase protein intake",
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(logResponse);

      const result = await apiConfig.makeRequest(
        "/api/nutrition",
        "POST",
        nutritionData,
      );

      expect(result.analysis.totalCalories).toBe(250);
      expect(result.analysis.recommendation).toContain("protein");
    });
  });

  describe("Real-time Performance Updates", () => {
    it("should handle live performance data", async () => {
      localStorage.getItem = vi.fn().mockReturnValue("valid-token");

      const performanceData = {
        heartRate: 150,
        speed: 12.5,
        distance: 100,
        timestamp: Date.now(),
      };

      // Mock WebSocket-like real-time update
      const updateResponse = {
        ok: true,
        json: async () => ({
          received: true,
          processed: true,
          insights: {
            zone: "aerobic",
            efficiency: "good",
            recommendation: "maintain pace",
          },
        }),
      };

      global.fetch.mockResolvedValueOnce(updateResponse);

      const result = await apiConfig.makeRequest(
        "/api/performance/live",
        "POST",
        performanceData,
      );

      expect(result.processed).toBe(true);
      expect(result.insights.zone).toBe("aerobic");
    });
  });

  describe("Error Recovery", () => {
    it("should handle network failures gracefully", async () => {
      localStorage.getItem = vi.fn().mockReturnValue("valid-token");

      // Simulate network failure followed by recovery
      global.fetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: "recovered" }),
        });

      const result = await apiConfig.makeRequest("/api/data", "GET");

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result.data).toBe("recovered");
    });

    it("should handle server errors with fallback", async () => {
      localStorage.getItem = vi.fn().mockReturnValue("valid-token");

      const serverErrorResponse = {
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      };

      global.fetch.mockResolvedValueOnce(serverErrorResponse);

      await expect(
        apiConfig.makeRequest("/api/critical-data", "GET"),
      ).rejects.toThrow("Internal server error");
    });
  });

  describe("Data Synchronization", () => {
    it("should sync offline data when connection restored", async () => {
      localStorage.getItem = vi.fn().mockReturnValue("valid-token");

      // Simulate offline data stored locally
      const offlineData = [
        { type: "training", data: { exercise: "running", duration: 30 } },
        { type: "nutrition", data: { meal: "lunch", calories: 500 } },
      ];

      // Mock sync response
      const syncResponse = {
        ok: true,
        json: async () => ({
          synced: 2,
          conflicts: 0,
          success: true,
        }),
      };

      global.fetch.mockResolvedValueOnce(syncResponse);

      const result = await apiConfig.makeRequest("/api/sync", "POST", {
        data: offlineData,
      });

      expect(result.synced).toBe(2);
      expect(result.success).toBe(true);
    });
  });
});
