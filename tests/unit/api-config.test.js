import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient, API_BASE_URL } from "../../src/api-config.js";
import {
  createMockApiResponse,
  setupTestEnvironment,
} from "../test-helpers.js";

describe("API Configuration - Comprehensive Tests", () => {
  let apiClient;
  let testEnv;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    apiClient = new ApiClient();
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe("Configuration Management", () => {
    it("should initialize with correct default configuration", () => {
      expect(apiClient.baseUrl).toBe(API_BASE_URL);
      expect(apiClient.defaultHeaders).toEqual({
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });
  });

  describe("Authentication Token Management", () => {
    it("should set authentication token correctly", () => {
      const token = "test-jwt-token-123";
      apiClient.setAuthToken(token);
      expect(apiClient.defaultHeaders["Authorization"]).toBe(`Bearer ${token}`);
    });

    it("should clear authentication token", () => {
      apiClient.setAuthToken("some-token");
      apiClient.setAuthToken(null);
      expect(apiClient.defaultHeaders["Authorization"]).toBeUndefined();
    });
  });

  describe("Request Handling", () => {
    it("should handle GET requests correctly", async () => {
      const mockData = { data: "test-data" };
      const mockResponse = await createMockApiResponse(mockData);
      global.fetch.mockResolvedValue(mockResponse);

      const result = await apiClient.get("/test-endpoint", {}, { useCache: false });
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test-endpoint"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should handle POST requests with data", async () => {
      const postData = { name: "test", value: 123 };
      const mockData = { id: 1, ...postData };
      const mockResponse = await createMockApiResponse(mockData);
      global.fetch.mockResolvedValue(mockResponse);

      const result = await apiClient.post("/test-endpoint", postData);
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test-endpoint"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(postData)
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 not found errors", async () => {
      const notFoundResponse = await createMockApiResponse(
        { error: "Not Found" },
        { status: 404, ok: false }
      );
      global.fetch.mockResolvedValue(notFoundResponse);

      await expect(
        apiClient.get("/nonexistent-endpoint", {}, { useCache: false }),
      ).rejects.toThrow("Not Found");
    });

    it("should handle network errors", async () => {
      global.fetch.mockRejectedValue(new Error("Failed to fetch"));

      await expect(
        apiClient.get("/test-endpoint", {}, { useCache: false }),
      ).rejects.toThrow("Failed to fetch");
    });
  });
});
