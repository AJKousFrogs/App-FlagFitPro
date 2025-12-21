import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthManager from "../../src/auth-manager.js";

// Mock the API dependencies
vi.mock("../../src/api-config.js", () => ({
  apiClient: {
    setAuthToken: vi.fn(),
  },
  auth: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}));

describe("AuthManager", () => {
  let authManager;

  beforeEach(() => {
    authManager = new AuthManager();
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should create demo authentication for any email/password", async () => {
      const result = await authManager.login("test@example.com", "password");

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("test@example.com");
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "authToken",
        expect.stringContaining("demo-token-"),
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "userData",
        expect.any(String),
      );
    });

    it("should handle empty credentials", async () => {
      const result = await authManager.login("", "");

      expect(result.success).toBe(false);
    });
  });

  describe("logout", () => {
    it("should clear stored data on logout", async () => {
      authManager.token = "test-token";
      authManager.user = { id: 1, email: "test@example.com" };

      await authManager.logout();

      expect(authManager.token).toBeNull();
      expect(authManager.user).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith("authToken");
      expect(localStorage.removeItem).toHaveBeenCalledWith("userData");
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when token and user exist", () => {
      authManager.token = "demo-token-123";
      authManager.user = { id: 1, email: "test@example.com" };

      expect(authManager.isAuthenticated()).toBe(true);
    });

    it("should return false when no token exists", () => {
      authManager.token = null;
      authManager.user = null;

      expect(authManager.isAuthenticated()).toBe(false);
    });
  });

  describe("getCurrentUser", () => {
    it("should return user data when available", () => {
      const userData = { id: 1, email: "test@example.com" };
      authManager.user = userData;

      const result = authManager.getCurrentUser();

      expect(result).toEqual(userData);
    });

    it("should return null when no user data exists", () => {
      authManager.user = null;

      const result = authManager.getCurrentUser();

      expect(result).toBe(null);
    });
  });

  describe("getToken", () => {
    it("should return stored token", () => {
      authManager.token = "test-token";

      const result = authManager.getToken();

      expect(result).toBe("test-token");
    });

    it("should return null when no token exists", () => {
      authManager.token = null;

      const result = authManager.getToken();

      expect(result).toBe(null);
    });
  });
});
