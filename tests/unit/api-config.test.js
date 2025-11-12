import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiConfig } from "../../src/api-config.js";

describe("ApiConfig", () => {
  let apiConfig;

  beforeEach(() => {
    apiConfig = new ApiConfig();
  });

  describe("makeRequest", () => {
    it("should make GET request with proper headers", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: "test" }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await apiConfig.makeRequest("/test-endpoint", "GET");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test-endpoint"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
      expect(result).toEqual({ data: "test" });
    });

    it("should include auth token when available", async () => {
      localStorage.getItem = vi.fn().mockReturnValue("test-token");
      const mockResponse = {
        ok: true,
        json: async () => ({ data: "test" }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await apiConfig.makeRequest("/test-endpoint", "GET");

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("should handle POST requests with body", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);
      const testData = { name: "test", value: 123 };

      await apiConfig.makeRequest("/test-endpoint", "POST", testData);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(testData),
        }),
      );
    });

    it("should handle API errors properly", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ error: "Bad request" }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(
        apiConfig.makeRequest("/test-endpoint", "GET"),
      ).rejects.toThrow("Bad request");
    });

    it("should handle network errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network failed"));

      await expect(
        apiConfig.makeRequest("/test-endpoint", "GET"),
      ).rejects.toThrow("Network failed");
    });

    it("should respect rate limiting", async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        json: async () => ({ error: "Too many requests" }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(
        apiConfig.makeRequest("/test-endpoint", "GET"),
      ).rejects.toThrow("Too many requests");
    });
  });

  describe("buildUrl", () => {
    it("should build correct API URLs", () => {
      const url = apiConfig.buildUrl("/users");
      expect(url).toMatch(/\/users$/);
    });

    it("should handle query parameters", () => {
      const url = apiConfig.buildUrl("/users", { page: 1, limit: 10 });
      expect(url).toContain("page=1");
      expect(url).toContain("limit=10");
    });
  });

  describe("retry mechanism", () => {
    it("should retry failed requests", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: "success" }),
      };
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue(mockResponse);

      const result = await apiConfig.makeRequest("/test-endpoint", "GET");

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: "success" });
    });

    it("should fail after max retries", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Persistent error"));

      await expect(
        apiConfig.makeRequest("/test-endpoint", "GET"),
      ).rejects.toThrow("Persistent error");

      expect(fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
