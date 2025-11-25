// Enhanced Authentication Manager for FlagFit Pro
// Handles login, registration, session management, and user state

import { apiClient, auth } from "./api-config.js";
import { loadingManager } from "./loading-manager.js";
import { logger } from "./logger.js";
import { secureStorage } from "./secure-storage.js";
import { config } from "./config/environment.js";
import { csrfProtection } from "./js/security/csrf-protection.js";
import { ErrorHandler } from "./error-handler.js";
import { AUTH, ERROR_MESSAGES, SUCCESS_MESSAGES } from "./js/config/app-constants.js";

// Import mock authentication for development/demo environments
let mockAuth = null;
const initMockAuth = async () => {
  // Only use mock auth when explicitly enabled in environment config
  if (config.ENABLE_MOCK_AUTH) {
    logger.debug("Mock authentication enabled in environment config");
    try {
      const { MockAuth } = await import("./mock-auth.js");
      mockAuth = new MockAuth();
      logger.success("Mock authentication initialized");
    } catch (error) {
      logger.error("Failed to initialize mock auth:", error);
    }
  } else {
    logger.debug("Mock authentication disabled - using production auth");
  }
};

// Reserved for future API availability check
// const checkRealApiAvailable = async () => {
//   try {
//     await fetch("http://localhost:3001/api/health");
//     return true;
//   } catch {
//     return false;
//   }
// };

class AuthManager {
  constructor() {
    this.user = null;
    this.token = null;
    this.loginCallbacks = [];
    this.logoutCallbacks = [];
    this.isRedirecting = false;
    this.isInitializing = false;
    this.isInitialized = false;
    this.initPromise = null; // Store initialization promise for reuse
    this.init();
  }

  // Initialize auth manager
  async init() {
    // Prevent multiple concurrent initializations
    if (this.isInitializing || this.isInitialized) {
      logger.debug("[Auth] Init already in progress or completed, returning existing promise");
      return this.initPromise;
    }

    // Create and store initialization promise
    this.initPromise = this._performInit();
    return this.initPromise;
  }

  // Actual initialization logic (private)
  async _performInit() {
    logger.debug("Initializing authentication manager...");

    this.isInitializing = true;

    // Add session timeout management
    this.setupSessionTimeout();

    await initMockAuth();
    this.loadStoredAuth();
    this.setupTokenRefresh();
    await this.validateStoredToken();
    this.checkAuthStateOnLoad();

    this.isInitializing = false;
    this.isInitialized = true;

    logger.success("Authentication manager initialized");
  }

  // Wait for authentication to be fully initialized
  async waitForInit(maxWait = 5000) {
    // If already initialized, return immediately
    if (this.isInitialized) {
      return Promise.resolve();
    }

    // If initialization is in progress, wait for the promise
    if (this.initPromise) {
      try {
        // Use Promise.race to add timeout
        await Promise.race([
          this.initPromise,
          new Promise((resolve) => setTimeout(() => {
            logger.warn("[Auth] Initialization timeout - proceeding anyway");
            resolve();
          }, maxWait))
        ]);
      } catch (error) {
        logger.error("[Auth] Initialization error:", error);
      }
      return;
    }

    // If not initialized and no promise, initialization hasn't started
    logger.warn("[Auth] waitForInit called but init hasn't started");
  }

  // Check authentication state on page load
  checkAuthStateOnLoad() {
    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isDevelopment)
      logger.debug("Checking authentication state on page load...");

    // Prevent redirect loops by checking if we're already redirecting
    if (this.isRedirecting) {
      if (isDevelopment)
        logger.debug("Already redirecting, skipping auth check");
      return;
    }

    // Skip check if still initializing - let individual pages handle it
    if (this.isInitializing) {
      if (isDevelopment)
        logger.debug(
          "⏳ Still initializing, deferring auth check to page logic",
        );
      return;
    }

    if (this.isAuthenticated()) {
      if (isDevelopment) {
        logger.debug("User is already authenticated");
        logger.debug("Current user:", this.user?.email || "Unknown");
        logger.debug("Current token:", this.token ? "Present" : "Missing");
      }

      // For demo tokens or local development, skip server validation to prevent loops
      if (this.token && this.token.startsWith("demo-token-")) {
        if (isDevelopment)
          logger.debug("Demo token detected, skipping server validation");
        this.notifyLoginCallbacks();
        return;
      }

      // Verify token is still valid by making a test request
      this.validateStoredToken()
        .then((isValid) => {
          if (isValid) {
            logger.debug("Token validation successful");
            this.notifyLoginCallbacks();
          } else {
            if (isDevelopment)
              logger.warn("Token validation failed, redirecting to login");
            this.redirectToLogin();
          }
        })
        .catch((error) => {
          if (isDevelopment) {
            logger.error("Token validation error:", error);
            logger.debug(
              "🎭 Falling back to demo mode to prevent redirect loop",
            );
          }
          this.notifyLoginCallbacks();
        });
    } else {
      if (isDevelopment)
        logger.debug("No valid authentication found on page load");
      // Check if we're on a protected page
      if (this.isProtectedPage()) {
        if (isDevelopment)
          logger.debug("Protected page detected, redirecting to login");
        this.redirectToLogin();
      }
    }
  }

  // Check if current page requires authentication
  isProtectedPage() {
    const protectedPages = [
      "/dashboard.html",
      "/profile.html",
      "/settings.html",
    ];
    const currentPath = window.location.pathname;
    return protectedPages.some((page) => currentPath.includes(page));
  }

  // Load authentication data from secure storage
  loadStoredAuth() {
    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    logger.debug("Loading stored authentication data...");

    try {
      // Try to migrate from legacy storage first
      secureStorage.migrateFromLegacyStorage();

      // Load from secure storage
      this.token = secureStorage.getAuthToken();
      this.user = secureStorage.getUserData();

      if (isDevelopment) {
        logger.debug("Stored token:", this.token ? "Present" : "Missing");
        logger.debug("Stored user data:", this.user ? "Present" : "Missing");
      }

      if (this.user) {
        logger.debug("Loaded user:", this.user);
      }

      if (this.token) {
        apiClient.setAuthToken(this.token);
        logger.debug("Token set in API client");
      }

      if (isDevelopment) {
        if (this.token && this.user) {
          logger.success("Stored auth data loaded successfully");
        } else {
          logger.debug("No complete stored auth data found");
        }
      }
    } catch (error) {
      logger.error("Error loading stored auth:", error);
      this.clearAuth();
    }
  }

  // Validate stored token with backend
  async validateStoredToken() {
    if (!this.token) return false;

    // Skip validation for demo tokens to prevent loops
    if (this.token.startsWith("demo-token-")) {
      logger.debug("Demo token, skipping server validation");
      return true;
    }

    try {
      const response = await auth.getCurrentUser();
      if (response.success) {
        this.user = response.user;
        this.saveUserData();
        this.notifyLoginCallbacks();
        return true;
      } else {
        logger.warn("Token validation failed on server");
        // Don't clear auth immediately, let the page handle it
        return false;
      }
    } catch (error) {
      logger.error("Token validation network error:", error);
      // On network error, assume token is still valid to prevent redirect loops
      logger.debug("Network error during validation, assuming token valid");
      return true;
    }
  }

  // Login with email and password
  async login(email, password) {
    try {
      logger.debug("Starting authentication process...");
      logger.debug("Email:", email);
      logger.debug("Password length:", password ? password.length : 0);

      this.showLoading("Signing in...");

      // For Netlify deployments, use real Supabase functions
      const isUsingNetlifyFunctions =
        window.location.hostname.includes("netlify.app") ||
        window.location.hostname.includes("netlify.com") ||
        (window.location.hostname === "localhost" &&
          window.location.port === "8888");

      logger.debug("Using Netlify Functions:", isUsingNetlifyFunctions);
      logger.debug(
        "Mock auth status:",
        mockAuth ? "Available" : "Not available",
      );
      logger.debug("Demo mode enabled for Netlify deployment");

      // Fallback to mock auth if real auth failed or not using Netlify
      if (mockAuth) {
        logger.debug("Using mock authentication...");
        const response = await mockAuth.login({ email, password });

        logger.debug("Authentication response:", response);

        if (response.success) {
          logger.success("Authentication successful!");
          logger.debug("Token received:", response.data.token ? "Yes" : "No");
          logger.debug("User data:", response.data.user);

          this.token = response.data.token;
          this.user = response.data.user;

          // Store authentication data securely
          secureStorage.setAuthToken(this.token);
          secureStorage.setUserData(this.user);
          logger.debug("Auth data stored securely");
          logger.debug("Stored token: encrypted");
          logger.debug("Stored user data: encrypted");

          this.saveUserData();

          // Set token in API client
          apiClient.setAuthToken(this.token);
          logger.debug("Token set in API client");

          // Verify auth state
          const isValid = this.isAuthenticated();
          logger.debug("Auth state valid:", isValid);

          // Notify callbacks
          this.notifyLoginCallbacks();

          this.hideLoading();
          this.showSuccess("Welcome back!");

          // Redirect to dashboard after successful login
          setTimeout(() => {
            logger.debug("Starting dashboard redirect...");
            logger.debug("Final auth check before redirect:", {
              tokenExists: !!this.token,
              userExists: !!this.user,
              isAuthenticated: this.isAuthenticated(),
            });

            // Double-check auth state with a brief delay
            if (this.isAuthenticated()) {
              logger.debug(
                "Authentication confirmed, proceeding with redirect",
              );
              this.redirectToDashboard();
            } else {
              logger.warn("Auth state invalid at redirect time");
              logger.debug("Attempting to restore auth from localStorage...");
              this.loadStoredAuth();

              // Try again after loading
              if (this.isAuthenticated()) {
                logger.success(
                  "Auth restored from storage, proceeding with redirect",
                );
                this.redirectToDashboard();
              } else {
                logger.error("Unable to restore authentication");
                this.showError(
                  "Authentication state lost. Please try logging in again.",
                );
              }
            }
          }, 1500); // Increased delay to ensure everything is saved

          return { success: true, user: this.user };
        } else {
          logger.error("Authentication failed:", response.error);
          this.hideLoading();
          this.showError(response.error || "Login failed");
          return { success: false, error: response.error };
        }
      }

      // If no mock auth or backend auth available, reject login
      if (!mockAuth) {
        logger.error("❌ No authentication backend available");
        this.hideLoading();
        this.showError(
          "Authentication service unavailable. Please check your backend configuration.",
        );
        return {
          success: false,
          error: "Authentication backend not configured",
        };
      }

      // Try real API
      logger.debug("🌐 Trying real API authentication...");
      const response = await auth.login({ email, password });

      if (response.success) {
        this.token = response.data.token;
        this.user = response.data.user;

        // Store authentication data securely
        secureStorage.setAuthToken(this.token);
        this.saveUserData();

        // Set token in API client
        apiClient.setAuthToken(this.token);

        // Notify callbacks
        this.notifyLoginCallbacks();

        this.hideLoading();
        this.showSuccess(SUCCESS_MESSAGES.LOGIN_SUCCESS);

        // Redirect to dashboard after successful login
        setTimeout(() => {
          this.redirectToDashboard();
        }, 1000);

        return { success: true, user: this.user };
      } else {
        this.hideLoading();
        this.showError(response.error || "Login failed");
        return { success: false, error: response.error };
      }
    } catch (error) {
      this.hideLoading();
      this.showError("Network error. Please try again.");
      logger.error("Login error:", error);
      return { success: false, error: error.message };
    }
  }

  // Register new user
  async register(userData) {
    try {
      this.showLoading("Creating your account...");

      const response = await auth.register(userData);

      if (response.success) {
        this.token = response.token;
        this.user = response.user;

        // Store authentication data securely
        secureStorage.setAuthToken(this.token);
        this.saveUserData();

        // Set token in API client
        apiClient.setAuthToken(this.token);

        // Notify callbacks
        this.notifyLoginCallbacks();

        this.hideLoading();
        this.showSuccess("Account created successfully!");

        return { success: true, user: this.user };
      } else {
        this.hideLoading();
        this.showError(response.error || "Registration failed");
        return { success: false, error: response.error };
      }
    } catch (error) {
      this.hideLoading();
      this.showError("Network error. Please try again.");
      logger.error("Registration error:", error);
      return { success: false, error: error.message };
    }
  }

  // Logout user
  async logout() {
    try {
      // Call backend logout if possible
      if (this.token) {
        await auth.logout().catch(() => {}); // Don't fail if backend is offline
      }
    } catch (error) {
      logger.warn("Logout API call failed:", error);
    }

    this.clearAuth();
    this.notifyLogoutCallbacks();
    this.showSuccess(SUCCESS_MESSAGES.LOGOUT_SUCCESS);
  }

  // Clear all authentication data
  clearAuth() {
    this.user = null;
    this.token = null;
    secureStorage.clearAll();
    apiClient.setAuthToken(null);

    // Clear CSRF token on logout for security
    csrfProtection.clearToken();
    logger.debug("[Auth] CSRF token cleared on logout");
  }

  // Save user data securely
  saveUserData() {
    if (this.user) {
      secureStorage.setUserData(this.user);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // Throttle debug logging to avoid spam (log at most once per second)
    const now = Date.now();
    if (!this._lastAuthLogTime) {
      this._lastAuthLogTime = 0;
    }
    const shouldLog = isDevelopment && now - this._lastAuthLogTime > 1000;

    if (shouldLog) {
      logger.debug("🔍 Checking authentication state...");
      logger.debug("🎫 Token exists:", !!this.token);
      logger.debug("👤 User exists:", !!this.user);
      this._lastAuthLogTime = now;
    }

    if (this.token && this.user) {
      // Check if it's a demo token (starts with "demo-token-")
      if (this.token.startsWith("demo-token-")) {
        // Demo tokens ONLY allowed in development with mock auth enabled
        if (isDevelopment && config.ENABLE_MOCK_AUTH) {
          if (shouldLog) {
            logger.debug(
              "🎭 Demo token detected in development, skipping JWT validation",
            );
            logger.debug("✅ User is authenticated (demo mode)");
          }
          return true;
        } else {
          // Demo tokens strictly forbidden in non-development environments
          logger.error(
            "❌ SECURITY VIOLATION: Demo token detected in " + (isDevelopment ? "development with mock auth disabled" : "production environment"),
          );
          this.clearAuth();
          this.showError("Security violation detected. Please contact support.");
          return false;
        }
      }

      // For real JWT tokens, validate expiration
      try {
        // Verify token is not expired
        const payload = JSON.parse(atob(this.token.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);

        // Only log token details in development
        if (isDevelopment) {
          logger.debug("⏰ Token expires at:", new Date(payload.exp * 1000));
          logger.debug("⏰ Current time:", new Date(now * 1000));
          logger.debug("⏰ Token valid:", payload.exp > now);
        }

        if (payload.exp && payload.exp > now) {
          if (isDevelopment && shouldLog) {
            logger.debug("✅ User is authenticated (JWT valid)");
          }
          return true;
        } else {
          if (isDevelopment) {
            logger.debug("❌ Token expired, clearing auth");
          }
          this.clearAuth();
          return false;
        }
      } catch (error) {
        if (isDevelopment) {
          logger.error("❌ JWT token validation failed:", error);
          logger.debug("🔄 Treating as demo token fallback");
        }

        // If JWT parsing fails but we have token and user, only allow in development
        if (this.token && this.user && isDevelopment) {
          if (shouldLog) {
            logger.debug("✅ User is authenticated (fallback mode)");
          }
          return true;
        }

        // In production, JWT parsing failure means invalid token
        this.clearAuth();
        return false;
      }
    }

    // Only log when throttling allows (avoid spam)
    if (isDevelopment && shouldLog) {
      logger.debug("❌ No valid authentication found");
    }
    return false;
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get current token
  getToken() {
    return this.token;
  }

  // Get user role
  getUserRole() {
    return this.user?.role || "player";
  }

  // Check if user has specific role
  hasRole(role) {
    return this.getUserRole() === role;
  }

  // Setup automatic token refresh
  setupTokenRefresh() {
    // Refresh token every 23 hours (tokens expire in 24 hours)
    setInterval(
      () => {
        if (this.isAuthenticated()) {
          this.validateStoredToken();
        }
      },
      23 * 60 * 60 * 1000,
    );
  }

  // Setup session timeout management
  setupSessionTimeout() {
    // Use centralized constants instead of hardcoded values
    const SESSION_TIMEOUT = AUTH.SESSION_TIMEOUT;
    const WARNING_TIME = AUTH.SESSION_WARNING_TIME;

    let sessionTimer;
    let warningTimer;
    let lastActivity = Date.now();

    const resetSessionTimer = () => {
      lastActivity = Date.now();

      // Clear existing timers
      if (sessionTimer) clearTimeout(sessionTimer);
      if (warningTimer) clearTimeout(warningTimer);

      // Set warning timer
      warningTimer = setTimeout(() => {
        if (this.isAuthenticated()) {
          this.showWarning(
            `Your session will expire in ${AUTH.SESSION_WARNING_TIME / 60000} minutes due to inactivity.`,
          );
        }
      }, SESSION_TIMEOUT - WARNING_TIME);

      // Set logout timer
      sessionTimer = setTimeout(() => {
        if (this.isAuthenticated()) {
          this.showError(ERROR_MESSAGES.SESSION_EXPIRED);
          this.logout();
        }
      }, SESSION_TIMEOUT);
    };

    // Track user activity - store handlers for cleanup
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Clean up existing handlers first to prevent memory leaks
    if (this.activityHandlers && this.activityHandlers.length > 0) {
      this.activityHandlers.forEach(({ event, handler }) => {
        document.removeEventListener(event, handler, true);
      });
      this.activityHandlers = [];
    }

    // Create bound handler that can be removed
    const activityHandler = () => {
      if (this.isAuthenticated() && Date.now() - lastActivity > 60000) {
        // Reset every minute
        resetSessionTimer();
      }
    };

    // Store handlers for cleanup
    this.activityHandlers = [];
    activityEvents.forEach((event) => {
      document.addEventListener(event, activityHandler, true);
      this.activityHandlers.push({ event, handler: activityHandler });
    });

    // Initialize session timer
    if (this.isAuthenticated()) {
      resetSessionTimer();
    }

    // Reset timer on login
    this.onLogin(() => {
      resetSessionTimer();
    });

    // Clear timers and remove event listeners on logout
    this.onLogout(() => {
      if (sessionTimer) clearTimeout(sessionTimer);
      if (warningTimer) clearTimeout(warningTimer);
      // Remove activity event listeners
      if (this.activityHandlers) {
        this.activityHandlers.forEach(({ event, handler }) => {
          document.removeEventListener(event, handler, true);
        });
        this.activityHandlers = [];
      }
    });
  }

  // Add login callback
  onLogin(callback) {
    this.loginCallbacks.push(callback);
  }

  // Add logout callback
  onLogout(callback) {
    this.logoutCallbacks.push(callback);
  }

  // Notify login callbacks
  notifyLoginCallbacks() {
    // Rotate CSRF token on login for enhanced security
    csrfProtection.rotateToken();
    logger.debug("[Auth] CSRF token rotated on login");

    this.loginCallbacks.forEach((callback) => {
      try {
        callback(this.user);
      } catch (error) {
        logger.error("Login callback error:", error);
      }
    });
  }

  // Notify logout callbacks
  notifyLogoutCallbacks() {
    this.logoutCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        logger.error("Logout callback error:", error);
      }
    });
  }

  // Redirect to login if not authenticated
  async requireAuth() {
    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    logger.debug("🔒 Checking authentication requirement...");

    // Wait for auth manager to finish initializing
    await this.waitForInit();

    // Check if we have stored auth data first (might not be loaded yet)
    const hasStoredAuth =
      localStorage.getItem("authToken") ||
      localStorage.getItem("__auth_token_enc") ||
      sessionStorage.getItem("authToken");

    logger.debug("🔍 Auth check after initialization:");
    logger.debug("   - Is authenticated:", this.isAuthenticated());
    logger.debug("   - Token exists:", !!this.token);
    logger.debug("   - User exists:", !!this.user);
    logger.debug("   - Has stored auth:", !!hasStoredAuth);

    // In development mode, allow access even if auth check fails (for testing)
    if (isDevelopment && hasStoredAuth && !this.isAuthenticated()) {
      logger.debug(
        "⚠️ Development mode: Stored auth found but not loaded, allowing access",
      );
      // Try to reload auth from storage
      this.loadStoredAuth();
      return true;
    }

    // In development mode, allow access without auth for testing
    if (isDevelopment && !hasStoredAuth) {
      logger.debug(
        "⚠️ Development mode: No auth found, allowing access for testing",
      );
      return true;
    }

    if (!this.isAuthenticated()) {
      logger.debug(
        "❌ Authentication required but user not authenticated, redirecting to login",
      );
      this.redirectToLogin();
      return false;
    }

    logger.debug("✅ Authentication verified");
    return true;
  }

  // Redirect to login page
  redirectToLogin() {
    if (this.isRedirecting) {
      logger.debug("🔄 Already redirecting, skipping");
      return;
    }
    this.isRedirecting = true;
    logger.debug("🚀 Redirecting to login...");
    window.location.href = "/login.html";
  }

  // Redirect to dashboard
  redirectToDashboard() {
    if (this.isRedirecting) {
      logger.debug("🔄 Already redirecting, skipping");
      return;
    }
    this.isRedirecting = true;
    logger.debug("🚀 Redirecting to dashboard...");
    logger.debug("📍 Current location:", window.location.href);

    // Handle different environments
    const dashboardUrl = this.getDashboardUrl();
    logger.debug("🎯 Dashboard URL:", dashboardUrl);

    try {
      window.location.href = dashboardUrl;
    } catch (error) {
      logger.error("❌ Redirect failed:", error);
      // Fallback: try window.location.assign
      window.location.assign(dashboardUrl);
    }
  }

  // Get the correct dashboard URL for current environment
  getDashboardUrl() {
    const currentUrl = window.location;
    const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;

    // For local development (localhost:8888, localhost:3000, etc.)
    if (
      currentUrl.hostname === "localhost" ||
      currentUrl.hostname === "127.0.0.1"
    ) {
      return `${baseUrl}/dashboard.html`;
    }

    // For Netlify production
    return `${baseUrl}/dashboard.html`;
  }

  // Show loading indicator - uses centralized LoadingManager
  showLoading(message = "Loading...") {
    return loadingManager.showLoading(message, "auth-loading");
  }

  // Hide loading indicator - uses centralized LoadingManager
  hideLoading() {
    loadingManager.hideLoading("auth-loading");
  }

  // Show success message - use centralized ErrorHandler
  showSuccess(message) {
    ErrorHandler.showSuccess(message);
  }

  // Show error message - use centralized ErrorHandler
  showError(message) {
    ErrorHandler.showError(message);
  }

  // Show warning message - use centralized ErrorHandler
  showWarning(message) {
    ErrorHandler.showWarning(message);
  }

  // Show info message - use centralized ErrorHandler
  showInfo(message) {
    ErrorHandler.showInfo(message);
  }

  // Show notification - use centralized ErrorHandler
  showNotification(message, type = "info") {
    ErrorHandler.showNotification(message, type);
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      this.showLoading("Updating profile...");

      // Call API to update profile
      const response = await apiClient.put("/api/auth/profile", profileData);

      if (response.success) {
        this.user = { ...this.user, ...response.user };
        this.saveUserData();
        this.hideLoading();
        this.showSuccess("Profile updated successfully!");
        return { success: true, user: this.user };
      } else {
        this.hideLoading();
        this.showError(response.error || "Profile update failed");
        return { success: false, error: response.error };
      }
    } catch (error) {
      this.hideLoading();
      this.showError("Network error. Please try again.");
      logger.error("Profile update error:", error);
      return { success: false, error: error.message };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      this.showLoading("Changing password...");

      const response = await apiClient.put("/api/auth/password", {
        currentPassword,
        newPassword,
      });

      if (response.success) {
        this.hideLoading();
        this.showSuccess("Password changed successfully!");
        return { success: true };
      } else {
        this.hideLoading();
        this.showError(response.error || "Password change failed");
        return { success: false, error: response.error };
      }
    } catch (error) {
      this.hideLoading();
      this.showError("Network error. Please try again.");
      logger.error("Password change error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup method to remove event listeners and prevent memory leaks
   * Should be called on page unload or when destroying auth manager
   */
  cleanup() {
    logger.debug("[AuthManager] Cleaning up event listeners...");

    // Remove activity handlers
    if (this.activityHandlers && this.activityHandlers.length > 0) {
      this.activityHandlers.forEach(({ event, handler }) => {
        document.removeEventListener(event, handler, true);
      });
      this.activityHandlers = [];
      logger.debug("[AuthManager] Activity handlers cleaned up");
    }

    // Note: Timers are already cleaned up in the onLogout callback
  }
}

// Create and export singleton instance
export const authManager = new AuthManager();

// Register cleanup on page unload to prevent memory leaks
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    authManager.cleanup();
  });

  // Also cleanup on visibility change (e.g., switching tabs)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Don't fully cleanup, just log for debugging
      logger.debug("[AuthManager] Page hidden, event listeners remain active");
    }
  });
}

// Export class for potential additional instances
export default AuthManager;
