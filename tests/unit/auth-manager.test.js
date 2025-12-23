import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthManager from "../../src/auth-manager.js";

// Mock all dependencies
vi.mock("../../src/api-config.js", () => ({
  apiClient: {
    setAuthToken: vi.fn(),
    put: vi.fn(),
  },
  auth: {
    getCurrentUser: vi.fn(),
  },
}));

vi.mock("../../src/js/services/supabase-client.js", () => ({
  getSupabase: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  })),
}));

vi.mock("../../src/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../src/secure-storage.js", () => ({
  secureStorage: {
    getAuthToken: vi.fn(),
    getUserData: vi.fn(),
    setAuthToken: vi.fn(),
    setUserData: vi.fn(),
    clearAll: vi.fn(),
    migrateFromLegacyStorage: vi.fn(),
  },
}));

vi.mock("../../src/loading-manager.js", () => ({
  loadingManager: {
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
  },
}));

vi.mock("../../src/error-handler.js", () => ({
  ErrorHandler: {
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  },
}));

vi.mock("../../src/config/environment.js", () => ({
  config: {
    ALLOW_UNAUTHENTICATED_DEV: false,
  },
}));

vi.mock("../../src/js/services/storage-service-unified.js", () => ({
  storageService: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("../../src/js/security/csrf-protection.js", () => ({
  csrfProtection: {
    rotateToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

describe("AuthManager", () => {
  let authManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a new instance for each test to avoid side effects
    authManager = new AuthManager();
  });

  describe("login", () => {
    it("should handle successful login", async () => {
      const mockSession = {
        access_token: "test-token",
        user: {
          id: "user-123",
          email: "test@example.com",
          user_metadata: { role: "player", name: "Test User" },
          email_confirmed_at: "2024-01-01T00:00:00Z",
        },
      };

      const { getSupabase } = await import("../../src/js/services/supabase-client.js");
      getSupabase().auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      const result = await authManager.login("test@example.com", "password");

      expect(result.success).toBe(true);
      expect(authManager.token).toBe("test-token");
      expect(authManager.user.email).toBe("test@example.com");
    });

    it("should handle login failure", async () => {
      const { getSupabase } = await import("../../src/js/services/supabase-client.js");
      getSupabase().auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: "Invalid credentials" },
      });

      const result = await authManager.login("test@example.com", "wrong-password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when token and user exist", () => {
      authManager.token = "test-token";
      authManager.user = { id: "user-123" };
      expect(authManager.isAuthenticated()).toBe(true);
    });

    it("should return false when token or user is missing", () => {
      authManager.token = null;
      authManager.user = { id: "user-123" };
      expect(authManager.isAuthenticated()).toBe(false);
      
      authManager.token = "test-token";
      authManager.user = null;
      expect(authManager.isAuthenticated()).toBe(false);
    });
  });

  describe("logout", () => {
    it("should clear auth data on logout", async () => {
      authManager.token = "test-token";
      authManager.user = { id: "user-123" };

      const { getSupabase } = await import("../../src/js/services/supabase-client.js");
      getSupabase().auth.signOut.mockResolvedValue({ error: null });

      await authManager.logout();

      expect(authManager.token).toBeNull();
      expect(authManager.user).toBeNull();
    });
  });
});
