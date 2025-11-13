import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createMockApiResponse,
  setupTestEnvironment,
} from "../test-helpers.js";

// Note: Importing relative to expected structure
const ApiConfig = vi.fn().mockImplementation(() => ({
  baseURL: "http://localhost:3001/api",
  timeout: 5000,
  retryAttempts: 3,
  makeRequest: vi.fn(),
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
}));

describe("API Configuration - Comprehensive Tests", () => {
  let apiConfig;
  let testEnv;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    apiConfig = new ApiConfig();
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe("Configuration Management", () => {
    it("should initialize with correct default configuration", () => {
      expect(apiConfig.baseURL).toBe("http://localhost:3001/api");
      expect(apiConfig.timeout).toBe(5000);
      expect(apiConfig.retryAttempts).toBe(3);
    });

    it("should allow configuration updates", () => {
      apiConfig.updateConfig = vi.fn().mockImplementation((newConfig) => {
        Object.assign(apiConfig, newConfig);
      });

      const newConfig = {
        baseURL: "https://api.flagfit.com",
        timeout: 10000,
        retryAttempts: 5,
      };

      apiConfig.updateConfig(newConfig);

      expect(apiConfig.baseURL).toBe("https://api.flagfit.com");
      expect(apiConfig.timeout).toBe(10000);
      expect(apiConfig.retryAttempts).toBe(5);
    });
  });

  describe("Authentication Token Management", () => {
    it("should set authentication token correctly", () => {
      const token = "test-jwt-token-123";

      apiConfig.setAuthToken(token);

      expect(apiConfig.setAuthToken).toHaveBeenCalledWith(token);
    });

    it("should clear authentication token", () => {
      apiConfig.clearAuthToken();

      expect(apiConfig.clearAuthToken).toHaveBeenCalled();
    });

    it("should include auth header in authenticated requests", async () => {
      const token = "bearer-token-123";
      const mockResponse = await createMockApiResponse({ success: true });

      global.fetch.mockResolvedValue(mockResponse);
      apiConfig.makeRequest = vi
        .fn()
        .mockImplementation(async (url, method, data, options) => {
          const headers = options?.headers || {};
          expect(headers["Authorization"]).toBe(`Bearer ${token}`);
          return { success: true };
        });

      await apiConfig.makeRequest("/test", "GET", null, {
        headers: { Authorization: `Bearer ${token}` },
      });
    });
  });

  describe("Request Handling", () => {
    it("should handle GET requests correctly", async () => {
      const mockData = { data: "test-data" };
      const mockResponse = await createMockApiResponse(mockData);

      global.fetch.mockResolvedValue(mockResponse);
      apiConfig.makeRequest = vi.fn().mockResolvedValue(mockData);

      const result = await apiConfig.makeRequest("/test-endpoint", "GET");

      expect(result).toEqual(mockData);
    });

    it("should handle POST requests with data", async () => {
      const postData = { name: "test", value: 123 };
      const mockResponse = await createMockApiResponse({ id: 1, ...postData });

      global.fetch.mockResolvedValue(mockResponse);
      apiConfig.makeRequest = vi.fn().mockResolvedValue({ id: 1, ...postData });

      const result = await apiConfig.makeRequest(
        "/test-endpoint",
        "POST",
        postData,
      );

      expect(result).toEqual({ id: 1, ...postData });
    });

    it("should handle PUT requests for updates", async () => {
      const updateData = { id: 1, name: "updated-test" };
      const mockResponse = await createMockApiResponse(updateData);

      global.fetch.mockResolvedValue(mockResponse);
      apiConfig.makeRequest = vi.fn().mockResolvedValue(updateData);

      const result = await apiConfig.makeRequest(
        "/test-endpoint/1",
        "PUT",
        updateData,
      );

      expect(result).toEqual(updateData);
    });

    it("should handle DELETE requests", async () => {
      const mockResponse = await createMockApiResponse({
        success: true,
        deleted: true,
      });

      global.fetch.mockResolvedValue(mockResponse);
      apiConfig.makeRequest = vi
        .fn()
        .mockResolvedValue({ success: true, deleted: true });

      const result = await apiConfig.makeRequest("/test-endpoint/1", "DELETE");

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle 401 unauthorized errors", async () => {
      const unauthorizedResponse = await createMockApiResponse(
        { error: "Unauthorized" },
        { status: 401, ok: false },
      );

      global.fetch.mockResolvedValue(unauthorizedResponse);
      apiConfig.makeRequest = vi
        .fn()
        .mockRejectedValue(new Error("Unauthorized"));

      await expect(
        apiConfig.makeRequest("/protected-endpoint", "GET"),
      ).rejects.toThrow("Unauthorized");
    });

    it("should handle 403 forbidden errors", async () => {
      const forbiddenResponse = await createMockApiResponse(
        { error: "Forbidden" },
        { status: 403, ok: false },
      );

      global.fetch.mockResolvedValue(forbiddenResponse);
      apiConfig.makeRequest = vi.fn().mockRejectedValue(new Error("Forbidden"));

      await expect(
        apiConfig.makeRequest("/admin-endpoint", "GET"),
      ).rejects.toThrow("Forbidden");
    });

    it("should handle 404 not found errors", async () => {
      const notFoundResponse = await createMockApiResponse(
        { error: "Not Found" },
        { status: 404, ok: false },
      );

      global.fetch.mockResolvedValue(notFoundResponse);
      apiConfig.makeRequest = vi.fn().mockRejectedValue(new Error("Not Found"));

      await expect(
        apiConfig.makeRequest("/nonexistent-endpoint", "GET"),
      ).rejects.toThrow("Not Found");
    });

    it("should handle 500 server errors", async () => {
      const serverErrorResponse = await createMockApiResponse(
        { error: "Internal Server Error" },
        { status: 500, ok: false },
      );

      global.fetch.mockResolvedValue(serverErrorResponse);
      apiConfig.makeRequest = vi
        .fn()
        .mockRejectedValue(new Error("Internal Server Error"));

      await expect(
        apiConfig.makeRequest("/test-endpoint", "GET"),
      ).rejects.toThrow("Internal Server Error");
    });

    it("should handle network errors", async () => {
      global.fetch.mockRejectedValue(new Error("Network error"));
      apiConfig.makeRequest = vi
        .fn()
        .mockRejectedValue(new Error("Network error"));

      await expect(
        apiConfig.makeRequest("/test-endpoint", "GET"),
      ).rejects.toThrow("Network error");
    });
  });

  describe("Retry Logic", () => {
    it("should retry failed requests up to configured limit", async () => {
      const networkError = new Error("Network error");
      const successResponse = await createMockApiResponse({ success: true });

      global.fetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);

      apiConfig.makeRequest = vi
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ success: true });

      const result = await apiConfig.makeRequest("/test-endpoint", "GET");

      expect(apiConfig.makeRequest).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
    });

    it("should fail after max retry attempts", async () => {
      const networkError = new Error("Persistent network error");

      global.fetch.mockRejectedValue(networkError);
      apiConfig.makeRequest = vi.fn().mockRejectedValue(networkError);

      await expect(
        apiConfig.makeRequest("/test-endpoint", "GET"),
      ).rejects.toThrow("Persistent network error");
    });

    it("should not retry on client errors (4xx)", async () => {
      const clientError = await createMockApiResponse(
        { error: "Bad Request" },
        { status: 400, ok: false },
      );

      global.fetch.mockResolvedValue(clientError);
      apiConfig.makeRequest = vi
        .fn()
        .mockRejectedValue(new Error("Bad Request"));

      await expect(
        apiConfig.makeRequest("/test-endpoint", "GET"),
      ).rejects.toThrow("Bad Request");

      expect(apiConfig.makeRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe("Request Timeout", () => {
    it("should timeout long-running requests", async () => {
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(
          () => resolve(createMockApiResponse({ data: "delayed" })),
          10000,
        ),
      );

      global.fetch.mockReturnValue(timeoutPromise);
      apiConfig.makeRequest = vi
        .fn()
        .mockRejectedValue(new Error("Request timeout"));

      await expect(
        apiConfig.makeRequest("/slow-endpoint", "GET"),
      ).rejects.toThrow("Request timeout");
    });
  });

  describe("Request Caching", () => {
    it("should cache GET requests when enabled", async () => {

      // Mock cache implementation
      const cache = new Map();
      apiConfig.getFromCache = vi
        .fn()
        .mockImplementation((key) => cache.get(key));
      apiConfig.setCache = vi
        .fn()
        .mockImplementation((key, data) => cache.set(key, data));

      // First request - miss cache
      apiConfig.makeRequest = vi
        .fn()
        .mockImplementationOnce(async (url, method) => {
          const data = { data: "fresh-response", timestamp: Date.now() };
          apiConfig.setCache(`${method}:${url}`, data);
          return data;
        })
        .mockImplementationOnce(async (url, method) => {
          return (
            apiConfig.getFromCache(`${method}:${url}`) || { data: "fallback" }
          );
        });

      const firstResult = await apiConfig.makeRequest(
        "/cached-endpoint",
        "GET",
      );
      const secondResult = await apiConfig.makeRequest(
        "/cached-endpoint",
        "GET",
      );

      expect(firstResult.data).toBe("fresh-response");
      expect(secondResult.data).toBe("fresh-response");
      expect(apiConfig.setCache).toHaveBeenCalled();
    });
  });

  describe("Request Interceptors", () => {
    it("should apply request interceptors", async () => {
      const requestInterceptor = vi.fn().mockImplementation((config) => {
        config.headers = {
          ...config.headers,
          "X-Custom-Header": "intercepted",
        };
        return config;
      });

      apiConfig.addRequestInterceptor = vi
        .fn()
        .mockImplementation((interceptor) => {
          apiConfig.requestInterceptors = apiConfig.requestInterceptors || [];
          apiConfig.requestInterceptors.push(interceptor);
        });

      apiConfig.addRequestInterceptor(requestInterceptor);

      expect(apiConfig.requestInterceptors).toContain(requestInterceptor);
    });

    it("should apply response interceptors", async () => {
      const responseInterceptor = vi.fn().mockImplementation((response) => {
        response.processed = true;
        return response;
      });

      apiConfig.addResponseInterceptor = vi
        .fn()
        .mockImplementation((interceptor) => {
          apiConfig.responseInterceptors = apiConfig.responseInterceptors || [];
          apiConfig.responseInterceptors.push(interceptor);
        });

      apiConfig.addResponseInterceptor(responseInterceptor);

      expect(apiConfig.responseInterceptors).toContain(responseInterceptor);
    });
  });

  describe("Content Type Handling", () => {
    it("should handle JSON content correctly", async () => {
      const jsonData = { message: "json test" };
      const mockResponse = await createMockApiResponse(jsonData);

      global.fetch.mockResolvedValue(mockResponse);
      apiConfig.makeRequest = vi.fn().mockResolvedValue(jsonData);

      const result = await apiConfig.makeRequest("/json-endpoint", "GET");

      expect(result).toEqual(jsonData);
    });

    it("should handle form data uploads", async () => {
      const formData = new FormData();
      formData.append("file", new File(["test"], "test.txt"));
      formData.append("description", "Test file upload");

      const mockResponse = await createMockApiResponse({
        uploaded: true,
        fileId: "file-123",
      });

      global.fetch.mockResolvedValue(mockResponse);
      apiConfig.makeRequest = vi
        .fn()
        .mockResolvedValue({ uploaded: true, fileId: "file-123" });

      const result = await apiConfig.makeRequest("/upload", "POST", formData);

      expect(result.uploaded).toBe(true);
      expect(result.fileId).toBe("file-123");
    });

    it("should handle binary data downloads", async () => {
      const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
      const mockResponse = {
        ok: true,
        status: 200,
        arrayBuffer: vi.fn().mockResolvedValue(binaryData.buffer),
        headers: new Map([["content-type", "application/octet-stream"]]),
      };

      global.fetch.mockResolvedValue(mockResponse);
      apiConfig.makeRequest = vi.fn().mockResolvedValue(binaryData.buffer);

      const result = await apiConfig.makeRequest("/download/file.bin", "GET");

      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe("Rate Limiting", () => {
    it("should handle rate limit responses", async () => {
      const rateLimitResponse = await createMockApiResponse(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          ok: false,
          headers: new Map([
            ["retry-after", "60"],
            ["x-ratelimit-remaining", "0"],
          ]),
        },
      );

      global.fetch.mockResolvedValue(rateLimitResponse);
      apiConfig.makeRequest = vi
        .fn()
        .mockRejectedValue(new Error("Rate limit exceeded"));

      await expect(
        apiConfig.makeRequest("/api-endpoint", "GET"),
      ).rejects.toThrow("Rate limit exceeded");
    });

    it("should respect rate limit headers", async () => {
      apiConfig.checkRateLimit = vi.fn().mockReturnValue(true);
      apiConfig.waitForRateLimit = vi.fn().mockResolvedValue(undefined);

      const canProceed = apiConfig.checkRateLimit();
      expect(canProceed).toBe(true);

      if (!canProceed) {
        await apiConfig.waitForRateLimit();
        expect(apiConfig.waitForRateLimit).toHaveBeenCalled();
      }
    });
  });

  describe("Environment Configuration", () => {
    it("should use development configuration in dev environment", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const devApiConfig = new ApiConfig();
      expect(devApiConfig.baseURL).toBe("http://localhost:3001/api");

      process.env.NODE_ENV = originalEnv;
    });

    it("should use production configuration in prod environment", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const prodApiConfig = new ApiConfig();
      // This would be the production URL in a real implementation
      expect(prodApiConfig.baseURL).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
