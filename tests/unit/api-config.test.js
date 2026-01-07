import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createMockApiResponse,
  setupTestEnvironment,
} from "../test-helpers.js";

// Mock dependencies
vi.mock("../../src/config/environment.js", () => ({
  config: {
    API_BASE_URL: "http://localhost:8888/.netlify/functions",
  },
}));

vi.mock("../../src/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../../src/js/security/csrf-protection.js", () => ({
  csrfProtection: {
    getHeaders: vi.fn().mockReturnValue({ "X-CSRF-Token": "test-csrf-token" }),
    requiresProtection: vi.fn((method) =>
      ["POST", "PUT", "DELETE", "PATCH"].includes(method)
    ),
  },
}));

vi.mock("../../src/js/services/cache-service.js", () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    invalidatePattern: vi.fn(),
  },
}));

vi.mock("../../src/js/config/app-constants.js", () => ({
  NETWORK: {
    CACHE_DURATION_SHORT: 60000,
    CACHE_DURATION_MEDIUM: 300000,
    CACHE_DURATION_LONG: 3600000,
  },
}));

vi.mock("../../src/js/services/storage-service-unified.js", () => ({
  storageService: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe("API Configuration - Comprehensive Tests", () => {
  let testEnv;
  let ApiClient;
  let apiClient;

  beforeEach(async () => {
    testEnv = setupTestEnvironment();
    vi.clearAllMocks();
    global.fetch = vi.fn();

    // Reset modules and import fresh
    vi.resetModules();
    const module = await import("../../src/api-config.js");
    ApiClient = module.ApiClient;
    apiClient = new ApiClient();
  });

  afterEach(() => {
    testEnv.cleanup();
    vi.clearAllMocks();
  });

  describe("Configuration Initialization", () => {
    it("should initialize with correct base URL", () => {
      expect(apiClient.baseUrl).toBeDefined();
    });

    it("should have default headers set", () => {
      expect(apiClient.defaultHeaders["Content-Type"]).toBe("application/json");
      expect(apiClient.defaultHeaders["Accept"]).toBe("application/json");
    });
  });

  describe("Authentication Token Management", () => {
    it("should set authentication token in headers", () => {
      const token = "test-jwt-token-123";

      apiClient.setAuthToken(token);

      expect(apiClient.defaultHeaders["Authorization"]).toBe(
        `Bearer ${token}`
      );
    });

    it("should clear authentication token when null is passed", () => {
      apiClient.defaultHeaders["Authorization"] = "Bearer old-token";

      apiClient.setAuthToken(null);

      expect(apiClient.defaultHeaders["Authorization"]).toBeUndefined();
    });

    it("should get auth token from storage", async () => {
      const { storageService } = await import(
        "../../src/js/services/storage-service-unified.js"
      );
      storageService.get.mockReturnValue("stored-token");

      const token = await apiClient.getAuthToken();

      expect(token).toBe("stored-token");
    });
  });

  describe("HTTP Request Methods", () => {
    describe("GET Requests", () => {
      it("should make GET request correctly", async () => {
        const mockData = { data: "test-data" };
        const mockResponse = await createMockApiResponse(mockData);
        global.fetch.mockResolvedValue(mockResponse);

        const result = await apiClient.get("/test-endpoint");

        expect(global.fetch).toHaveBeenCalled();
        expect(result).toEqual(mockData);
      });

      it("should include query parameters in GET request", async () => {
        const mockData = { data: "filtered-data" };
        const mockResponse = await createMockApiResponse(mockData);
        global.fetch.mockResolvedValue(mockResponse);

        await apiClient.get("/test-endpoint", { userId: 1, limit: 10 });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("userId=1"),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("limit=10"),
          expect.any(Object)
        );
      });

      it("should use cache for GET requests when enabled", async () => {
        const { cacheService } = await import(
          "../../src/js/services/cache-service.js"
        );
        const cachedData = { data: "cached-data" };
        cacheService.get.mockReturnValue(cachedData);

        const result = await apiClient.get("/cached-endpoint", {}, { useCache: true });

        expect(result).toEqual(cachedData);
        expect(global.fetch).not.toHaveBeenCalled();
      });

      it("should bypass cache when forceRefresh is true", async () => {
        const { cacheService } = await import(
          "../../src/js/services/cache-service.js"
        );
        cacheService.get.mockReturnValue({ data: "old-cached-data" });

        const mockData = { data: "fresh-data" };
        const mockResponse = await createMockApiResponse(mockData);
        global.fetch.mockResolvedValue(mockResponse);

        const result = await apiClient.get(
          "/test-endpoint",
          {},
          { useCache: true, forceRefresh: true }
        );

        expect(global.fetch).toHaveBeenCalled();
        expect(result).toEqual(mockData);
      });
    });

    describe("POST Requests", () => {
      it("should make POST request with data", async () => {
        const postData = { name: "test", value: 123 };
        const mockResponse = await createMockApiResponse({ id: 1, ...postData });
        global.fetch.mockResolvedValue(mockResponse);

        const result = await apiClient.post("/test-endpoint", postData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify(postData),
          })
        );
        expect(result.id).toBe(1);
      });

      it("should include CSRF token in POST requests", async () => {
        const { csrfProtection } = await import(
          "../../src/js/security/csrf-protection.js"
        );
        const mockResponse = await createMockApiResponse({ success: true });
        global.fetch.mockResolvedValue(mockResponse);

        await apiClient.post("/test-endpoint", { data: "test" });

        expect(csrfProtection.requiresProtection).toHaveBeenCalledWith("POST");
        expect(csrfProtection.getHeaders).toHaveBeenCalled();
      });

      it("should invalidate cache after POST request", async () => {
        const { cacheService } = await import(
          "../../src/js/services/cache-service.js"
        );
        const mockResponse = await createMockApiResponse({ success: true });
        global.fetch.mockResolvedValue(mockResponse);

        await apiClient.post("/test-endpoint", { data: "test" });

        expect(cacheService.invalidatePattern).toHaveBeenCalled();
      });
    });

    describe("PUT Requests", () => {
      it("should make PUT request with data", async () => {
        const updateData = { id: 1, name: "updated-test" };
        const mockResponse = await createMockApiResponse(updateData);
        global.fetch.mockResolvedValue(mockResponse);

        const result = await apiClient.put("/test-endpoint/1", updateData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: "PUT",
            body: JSON.stringify(updateData),
          })
        );
        expect(result).toEqual(updateData);
      });
    });

    describe("PATCH Requests", () => {
      it("should make PATCH request with partial data", async () => {
        const patchData = { name: "patched-name" };
        const mockResponse = await createMockApiResponse({
          id: 1,
          ...patchData,
        });
        global.fetch.mockResolvedValue(mockResponse);

        const result = await apiClient.patch("/test-endpoint/1", patchData);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify(patchData),
          })
        );
        expect(result.name).toBe("patched-name");
      });
    });

    describe("DELETE Requests", () => {
      it("should make DELETE request", async () => {
        const mockResponse = await createMockApiResponse({
          success: true,
          deleted: true,
        });
        global.fetch.mockResolvedValue(mockResponse);

        const result = await apiClient.delete("/test-endpoint/1");

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: "DELETE",
          })
        );
        expect(result.deleted).toBe(true);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle 401 unauthorized errors", async () => {
      const unauthorizedResponse = {
        ok: false,
        status: 401,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({ error: "Unauthorized" }),
      };
      global.fetch.mockResolvedValue(unauthorizedResponse);

      await expect(apiClient.get("/protected-endpoint")).rejects.toThrow();
    });

    it("should handle 403 forbidden errors", async () => {
      const forbiddenResponse = {
        ok: false,
        status: 403,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({ error: "Forbidden" }),
      };
      global.fetch.mockResolvedValue(forbiddenResponse);

      await expect(apiClient.get("/admin-endpoint")).rejects.toThrow();
    });

    it("should handle 404 not found errors", async () => {
      const notFoundResponse = {
        ok: false,
        status: 404,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({ error: "Not Found" }),
      };
      global.fetch.mockResolvedValue(notFoundResponse);

      await expect(apiClient.get("/nonexistent-endpoint")).rejects.toThrow();
    });

    it("should handle 500 server errors", async () => {
      const serverErrorResponse = {
        ok: false,
        status: 500,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({ error: "Internal Server Error" }),
      };
      global.fetch.mockResolvedValue(serverErrorResponse);

      await expect(apiClient.get("/test-endpoint")).rejects.toThrow();
    });

    it("should handle network errors", async () => {
      global.fetch.mockRejectedValue(new Error("Failed to fetch"));

      await expect(apiClient.get("/test-endpoint")).rejects.toThrow();
    });

    it("should handle HTML responses as errors", async () => {
      const htmlResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "text/html"]]),
        text: vi.fn().mockResolvedValue("<html>Not Found</html>"),
      };
      global.fetch.mockResolvedValue(htmlResponse);

      await expect(apiClient.get("/test-endpoint")).rejects.toThrow();
    });
  });

  describe("Request Cancellation", () => {
    it("should cancel a specific request", () => {
      const mockController = { abort: vi.fn() };
      apiClient.activeRequests = new Map();
      apiClient.activeRequests.set("test-request", mockController);

      apiClient.cancelRequest("test-request");

      expect(mockController.abort).toHaveBeenCalled();
      expect(apiClient.activeRequests.has("test-request")).toBe(false);
    });

    it("should cancel all active requests", () => {
      const mockController1 = { abort: vi.fn() };
      const mockController2 = { abort: vi.fn() };
      apiClient.activeRequests = new Map();
      apiClient.activeRequests.set("request-1", mockController1);
      apiClient.activeRequests.set("request-2", mockController2);

      apiClient.cancelAllRequests();

      expect(mockController1.abort).toHaveBeenCalled();
      expect(mockController2.abort).toHaveBeenCalled();
      expect(apiClient.activeRequests.size).toBe(0);
    });

    it("should cancel requests by pattern", () => {
      const mockController1 = { abort: vi.fn() };
      const mockController2 = { abort: vi.fn() };
      const mockController3 = { abort: vi.fn() };
      apiClient.activeRequests = new Map();
      apiClient.activeRequests.set("/training/sessions_123", mockController1);
      apiClient.activeRequests.set("/training/stats_456", mockController2);
      apiClient.activeRequests.set("/analytics/data_789", mockController3);

      apiClient.cancelRequestsByPattern("/training");

      expect(mockController1.abort).toHaveBeenCalled();
      expect(mockController2.abort).toHaveBeenCalled();
      expect(mockController3.abort).not.toHaveBeenCalled();
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate cache for endpoint pattern", async () => {
      const { cacheService } = await import(
        "../../src/js/services/cache-service.js"
      );

      apiClient.invalidateCache("/training/sessions/123");

      expect(cacheService.invalidatePattern).toHaveBeenCalledWith(
        expect.stringContaining("api:/training/sessions")
      );
    });

    it("should strip query params when invalidating cache", async () => {
      const { cacheService } = await import(
        "../../src/js/services/cache-service.js"
      );

      apiClient.invalidateCache("/training/sessions?userId=1&limit=10");

      expect(cacheService.invalidatePattern).toHaveBeenCalledWith(
        "api:/training/sessions"
      );
    });
  });

  describe("Content Type Handling", () => {
    it("should handle JSON content correctly", async () => {
      const jsonData = { message: "json test" };
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue(jsonData),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await apiClient.get("/json-endpoint");

      expect(result).toEqual(jsonData);
    });

    it("should attempt to parse non-JSON as JSON when possible", async () => {
      const jsonData = { message: "parsed json" };
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([["content-type", "text/plain"]]),
        text: vi.fn().mockResolvedValue(JSON.stringify(jsonData)),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await apiClient.get("/text-endpoint");

      expect(result).toEqual(jsonData);
    });
  });

  describe("API Endpoints Configuration", () => {
    it("should have auth endpoints configured", async () => {
      const { API_ENDPOINTS } = await import("../../src/api-config.js");

      expect(API_ENDPOINTS.auth.login).toBeDefined();
      expect(API_ENDPOINTS.auth.register).toBeDefined();
      expect(API_ENDPOINTS.auth.logout).toBeDefined();
      expect(API_ENDPOINTS.auth.me).toBeDefined();
    });

    it("should have dashboard endpoints configured", async () => {
      const { API_ENDPOINTS } = await import("../../src/api-config.js");

      expect(API_ENDPOINTS.dashboard.overview).toBeDefined();
      expect(API_ENDPOINTS.dashboard.notifications).toBeDefined();
      expect(API_ENDPOINTS.dashboard.health).toBeDefined();
    });

    it("should have training endpoints configured", async () => {
      const { API_ENDPOINTS } = await import("../../src/api-config.js");

      expect(API_ENDPOINTS.training.stats).toBeDefined();
      expect(API_ENDPOINTS.training.sessions).toBeDefined();
      expect(API_ENDPOINTS.training.complete).toBeDefined();
    });

    it("should have analytics endpoints configured", async () => {
      const { API_ENDPOINTS } = await import("../../src/api-config.js");

      expect(API_ENDPOINTS.analytics.performanceTrends).toBeDefined();
      expect(API_ENDPOINTS.analytics.summary).toBeDefined();
    });

    it("should have community endpoints configured", async () => {
      const { API_ENDPOINTS } = await import("../../src/api-config.js");

      expect(API_ENDPOINTS.community.feed).toBeDefined();
      expect(API_ENDPOINTS.community.leaderboard).toBeDefined();
    });
  });

  describe("Helper Functions", () => {
    it("should have auth helper functions", async () => {
      const { auth } = await import("../../src/api-config.js");

      expect(typeof auth.login).toBe("function");
      expect(typeof auth.register).toBe("function");
      expect(typeof auth.logout).toBe("function");
      expect(typeof auth.getCurrentUser).toBe("function");
    });

    it("should have dashboard helper functions", async () => {
      const { dashboard } = await import("../../src/api-config.js");

      expect(typeof dashboard.getOverview).toBe("function");
      expect(typeof dashboard.getNotifications).toBe("function");
      expect(typeof dashboard.getNotificationCount).toBe("function");
    });

    it("should have analytics helper functions", async () => {
      const { analytics } = await import("../../src/api-config.js");

      expect(typeof analytics.getPerformanceTrends).toBe("function");
      expect(typeof analytics.getSummary).toBe("function");
    });

    it("should have community helper functions", async () => {
      const { community } = await import("../../src/api-config.js");

      expect(typeof community.getFeed).toBe("function");
      expect(typeof community.createPost).toBe("function");
      expect(typeof community.getLeaderboard).toBe("function");
    });

    it("should have knowledge helper functions", async () => {
      const { knowledge } = await import("../../src/api-config.js");

      expect(typeof knowledge.search).toBe("function");
      expect(typeof knowledge.getEntry).toBe("function");
    });
  });
});
