import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupTestEnvironment } from "../test-helpers.js";

// Mock dependencies before importing AuthManager
vi.mock("../../src/api-config.js", () => ({
  apiClient: {
    setAuthToken: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
  auth: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock("../../src/loading-manager.js", () => ({
  loadingManager: {
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
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

vi.mock("../../src/secure-storage.js", () => ({
  secureStorage: {
    getAuthToken: vi.fn(),
    setAuthToken: vi.fn(),
    getUserData: vi.fn(),
    setUserData: vi.fn(),
    clearAll: vi.fn(),
    migrateFromLegacyStorage: vi.fn(),
  },
}));

vi.mock("../../src/config/environment.js", () => ({
  config: {
    API_BASE_URL: "http://localhost:8888/.netlify/functions",
    ALLOW_UNAUTHENTICATED_DEV: false,
  },
}));

vi.mock("../../src/js/security/csrf-protection.js", () => ({
  csrfProtection: {
    rotateToken: vi.fn(),
    clearToken: vi.fn(),
    getHeaders: vi.fn().mockReturnValue({}),
    requiresProtection: vi.fn(),
  },
}));

vi.mock("../../src/error-handler.js", () => ({
  ErrorHandler: {
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    showNotification: vi.fn(),
  },
}));

vi.mock("../../src/js/config/app-constants.js", () => ({
  AUTH: {
    PUBLIC_ROUTES: ["/login", "/register", "/reset-password", "/landing"],
    PROTECTED_ROUTES: ["/dashboard", "/training", "/analytics", "/profile"],
    TOKEN_VALIDATION_TIMEOUT: 3000,
    SESSION_TIMEOUT: 1800000,
    SESSION_WARNING_TIME: 300000,
    ENABLE_SESSION_TIMEOUT: false,
    ACTIVITY_RESET_THRESHOLD: 1000,
    ACTIVITY_DEBOUNCE_TIME: 500,
  },
  ERROR_MESSAGES: {
    SESSION_EXPIRED: "Your session has expired. Please log in again.",
  },
}));

vi.mock("../../src/js/utils/shared.js", () => ({
  debounce: vi.fn((fn) => fn),
}));

vi.mock("../../src/js/services/storage-service-unified.js", () => ({
  storageService: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock Supabase client
vi.mock("../../src/js/services/supabase-client.js", () => ({
  getSupabase: vi.fn(() => null),
  safeSupabaseQuery: vi.fn(),
}));

describe("AuthManager - Comprehensive Tests", () => {
  let testEnv;
  let AuthManager;
  let authManager;

  beforeEach(async () => {
    testEnv = setupTestEnvironment();
    vi.clearAllMocks();

    // Reset modules to get fresh instance
    vi.resetModules();

    // Import AuthManager after mocks are set up
    const module = await import("../../src/auth-manager.js");
    AuthManager = module.default;
  });

  afterEach(() => {
    testEnv.cleanup();
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with null user and token", () => {
      authManager = new AuthManager();

      expect(authManager.user).toBeNull();
      expect(authManager.token).toBeNull();
      expect(authManager.isInitializing).toBe(true);
    });

    it("should have login and logout callback arrays", () => {
      authManager = new AuthManager();

      expect(Array.isArray(authManager.loginCallbacks)).toBe(true);
      expect(Array.isArray(authManager.logoutCallbacks)).toBe(true);
    });

    it("should prevent redirect loops with isRedirecting flag", () => {
      authManager = new AuthManager();

      expect(authManager.isRedirecting).toBe(false);
    });
  });

  describe("Authentication State", () => {
    it("should return true when both token and user exist", () => {
      authManager = new AuthManager();
      authManager.token = "test-token-123";
      authManager.user = { id: 1, email: "test@flagfitpro.com" };

      expect(authManager.isAuthenticated()).toBe(true);
    });

    it("should return false when token is missing", () => {
      authManager = new AuthManager();
      authManager.token = null;
      authManager.user = { id: 1, email: "test@flagfitpro.com" };

      expect(authManager.isAuthenticated()).toBe(false);
    });

    it("should return false when user is missing", () => {
      authManager = new AuthManager();
      authManager.token = "test-token-123";
      authManager.user = null;

      expect(authManager.isAuthenticated()).toBe(false);
    });

    it("should return false when both token and user are missing", () => {
      authManager = new AuthManager();
      authManager.token = null;
      authManager.user = null;

      expect(authManager.isAuthenticated()).toBe(false);
    });
  });

  describe("User Data Management", () => {
    it("should return current user data", () => {
      authManager = new AuthManager();
      const userData = {
        id: 1,
        email: "athlete@flagfitpro.com",
        name: "Test Athlete",
        role: "player",
      };
      authManager.user = userData;

      expect(authManager.getCurrentUser()).toEqual(userData);
    });

    it("should return null when no user exists", () => {
      authManager = new AuthManager();
      authManager.user = null;

      expect(authManager.getCurrentUser()).toBeNull();
    });

    it("should return current token", () => {
      authManager = new AuthManager();
      authManager.token = "jwt-token-xyz";

      expect(authManager.getToken()).toBe("jwt-token-xyz");
    });

    it("should return null when no token exists", () => {
      authManager = new AuthManager();
      authManager.token = null;

      expect(authManager.getToken()).toBeNull();
    });
  });

  describe("User Role Management", () => {
    it("should return user role when user exists", () => {
      authManager = new AuthManager();
      authManager.user = { id: 1, email: "coach@flagfitpro.com", role: "coach" };

      expect(authManager.getUserRole()).toBe("coach");
    });

    it("should return 'player' as default role when user has no role", () => {
      authManager = new AuthManager();
      authManager.user = { id: 1, email: "user@flagfitpro.com" };

      expect(authManager.getUserRole()).toBe("player");
    });

    it("should return 'player' as default when no user exists", () => {
      authManager = new AuthManager();
      authManager.user = null;

      expect(authManager.getUserRole()).toBe("player");
    });

    it("should correctly check if user has specific role", () => {
      authManager = new AuthManager();
      authManager.user = { id: 1, email: "coach@flagfitpro.com", role: "coach" };

      expect(authManager.hasRole("coach")).toBe(true);
      expect(authManager.hasRole("player")).toBe(false);
      expect(authManager.hasRole("admin")).toBe(false);
    });
  });

  describe("Protected Page Detection", () => {
    it("should identify protected routes", () => {
      authManager = new AuthManager();

      // Mock window.location
      Object.defineProperty(window, "location", {
        value: { pathname: "/dashboard" },
        writable: true,
      });

      expect(authManager.isProtectedPage()).toBe(true);
    });

    it("should identify public routes", () => {
      authManager = new AuthManager();

      Object.defineProperty(window, "location", {
        value: { pathname: "/login" },
        writable: true,
      });

      expect(authManager.isProtectedPage()).toBe(false);
    });

    it("should identify training as protected", () => {
      authManager = new AuthManager();

      Object.defineProperty(window, "location", {
        value: { pathname: "/training" },
        writable: true,
      });

      expect(authManager.isProtectedPage()).toBe(true);
    });
  });

  describe("Logout Functionality", () => {
    it("should clear auth data on logout", async () => {
      const { secureStorage } = await import("../../src/secure-storage.js");
      const { apiClient } = await import("../../src/api-config.js");
      const { csrfProtection } = await import(
        "../../src/js/security/csrf-protection.js"
      );

      authManager = new AuthManager();
      authManager.token = "test-token";
      authManager.user = { id: 1, email: "test@flagfitpro.com" };

      authManager.clearAuth();

      expect(authManager.token).toBeNull();
      expect(authManager.user).toBeNull();
      expect(secureStorage.clearAll).toHaveBeenCalled();
      expect(apiClient.setAuthToken).toHaveBeenCalledWith(null);
      expect(csrfProtection.clearToken).toHaveBeenCalled();
    });
  });

  describe("Callback Management", () => {
    it("should register login callbacks", () => {
      authManager = new AuthManager();
      const callback = vi.fn();

      authManager.onLogin(callback);

      expect(authManager.loginCallbacks).toContain(callback);
    });

    it("should register logout callbacks", () => {
      authManager = new AuthManager();
      const callback = vi.fn();

      authManager.onLogout(callback);

      expect(authManager.logoutCallbacks).toContain(callback);
    });

    it("should notify login callbacks with user data", async () => {
      const { csrfProtection } = await import(
        "../../src/js/security/csrf-protection.js"
      );

      authManager = new AuthManager();
      const callback = vi.fn();
      const userData = { id: 1, email: "test@flagfitpro.com" };

      authManager.user = userData;
      authManager.onLogin(callback);
      authManager.notifyLoginCallbacks();

      expect(callback).toHaveBeenCalledWith(userData);
      expect(csrfProtection.rotateToken).toHaveBeenCalled();
    });

    it("should notify logout callbacks", () => {
      authManager = new AuthManager();
      const callback = vi.fn();

      authManager.onLogout(callback);
      authManager.notifyLogoutCallbacks();

      expect(callback).toHaveBeenCalled();
    });

    it("should handle callback errors gracefully", async () => {
      const { logger } = await import("../../src/logger.js");

      authManager = new AuthManager();
      const errorCallback = vi.fn(() => {
        throw new Error("Callback error");
      });
      const normalCallback = vi.fn();

      authManager.onLogin(errorCallback);
      authManager.onLogin(normalCallback);
      authManager.user = { id: 1 };

      // Should not throw and should continue to next callback
      authManager.notifyLoginCallbacks();

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("Dashboard URL Generation", () => {
    it("should generate correct dashboard URL for localhost", () => {
      authManager = new AuthManager();

      Object.defineProperty(window, "location", {
        value: {
          protocol: "http:",
          host: "localhost:8888",
          hostname: "localhost",
        },
        writable: true,
      });

      const url = authManager.getDashboardUrl();
      expect(url).toBe("http://localhost:8888/dashboard.html");
    });

    it("should generate correct onboarding URL", () => {
      authManager = new AuthManager();

      Object.defineProperty(window, "location", {
        value: {
          protocol: "http:",
          host: "localhost:8888",
        },
        writable: true,
      });

      const url = authManager.getOnboardingUrl();
      expect(url).toBe("http://localhost:8888/onboarding.html");
    });
  });

  describe("Wait for Initialization", () => {
    it("should resolve immediately if already initialized", async () => {
      authManager = new AuthManager();
      authManager.isInitialized = true;

      const result = await authManager.waitForInit();
      expect(result).toBeUndefined();
    });

    it("should wait for init promise if initializing", async () => {
      authManager = new AuthManager();
      authManager.isInitialized = false;
      authManager.initPromise = Promise.resolve();

      const result = await authManager.waitForInit(1000);
      expect(result).toBeUndefined();
    });
  });

  describe("Token Validation", () => {
    it("should return false when no token exists", async () => {
      authManager = new AuthManager();
      authManager.token = null;

      const result = await authManager.validateStoredToken();
      expect(result).toBe(false);
    });
  });

  describe("Cleanup", () => {
    it("should cleanup activity handlers", () => {
      authManager = new AuthManager();
      const mockHandler = { event: "mousedown", handler: vi.fn() };
      authManager.activityHandlers = [mockHandler];

      const removeEventListenerSpy = vi.spyOn(
        document,
        "removeEventListener"
      );

      authManager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        mockHandler.handler
      );
      expect(authManager.activityHandlers).toEqual([]);
    });

    it("should handle cleanup when no handlers exist", () => {
      authManager = new AuthManager();
      authManager.activityHandlers = [];

      // Should not throw
      expect(() => authManager.cleanup()).not.toThrow();
    });
  });
});
