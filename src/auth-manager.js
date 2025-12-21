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
import { debounce } from "./js/utils/html-escape.js";
import { storageService } from "./js/services/storage-service-unified.js";

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

    try {
      // Add session timeout management
      this.setupSessionTimeout();

      // Setup Supabase Auth listener (don't await - let it run in background)
      this.setupSupabaseAuthListener().catch(err => {
        logger.warn("[Auth] Supabase auth listener setup failed:", err);
      });

      // Load stored auth data
      await this.loadStoredAuth(); // Now async with AES-GCM encryption
      
      // Setup token refresh
      this.setupTokenRefresh();
      
      // Validate token with timeout (3 seconds max) - this ensures initialization completes quickly
      await this.validateStoredToken(3000);
      
      // Check authentication and restore session if needed
      await this.checkAuthentication();
      
      // Check auth state on load
      this.checkAuthStateOnLoad();
    } catch (error) {
      logger.error("[Auth] Error during initialization:", error);
      // Continue initialization even if some steps fail
    } finally {
      this.isInitializing = false;
      this.isInitialized = true;
      logger.success("Authentication manager initialized");
    }
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
          new Promise((resolve) => {
            setTimeout(() => {
              logger.warn("[Auth] Initialization timeout - proceeding anyway");
              resolve();
            }, maxWait || 5000);
          })
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
    if (isDevelopment) {logger.debug("Checking authentication state on page load...");}

    // Prevent redirect loops by checking if we're already redirecting
    if (this.isRedirecting) {
      if (isDevelopment) {logger.debug("Already redirecting, skipping auth check");}
      return;
    }

    // Skip check if still initializing - let individual pages handle it
    if (this.isInitializing) {
      if (isDevelopment) {
logger.debug(
          "⏳ Still initializing, deferring auth check to page logic",
        );
}
      return;
    }

    // Check if we have stored auth data (token or user)
    const hasStoredAuth = this.token || this.user;
    
    if (this.isAuthenticated() || hasStoredAuth) {
      if (isDevelopment) {
        logger.debug("User appears to be authenticated");
        logger.debug("Current user:", this.user?.email || "Unknown");
        logger.debug("Current token:", this.token ? "Present" : "Missing");
      }

      // Verify token is still valid by making a test request (non-blocking)
      // Don't redirect on validation failure - let the page handle it
      // This prevents redirect loops when network is slow or validation endpoint is unavailable
      this.validateStoredToken()
        .then((isValid) => {
          if (isValid) {
            logger.debug("Token validation successful");
            this.notifyLoginCallbacks();
          } else {
            // Validation failed, but we have stored auth data
            // Don't redirect immediately - the user might still be authenticated
            // Individual pages can check auth and redirect if needed
            if (isDevelopment) {
              logger.warn("Token validation failed, but stored auth exists - allowing navigation");
            }
            // Still notify callbacks so pages can check auth state
            this.notifyLoginCallbacks();
          }
        })
        .catch((error) => {
          if (isDevelopment) {
            logger.error("Token validation error:", error);
            logger.debug("Allowing navigation despite validation error - stored auth exists");
          }
          // Don't redirect on validation errors - assume user is still authenticated
          // Individual pages will handle auth checks
          this.notifyLoginCallbacks();
        });
    } else {
      // No stored auth data at all - check if we're on a protected page
      if (isDevelopment) {logger.debug("No stored authentication found on page load");}
      if (this.isProtectedPage()) {
        if (isDevelopment) {logger.debug("Protected page detected, redirecting to login");}
        this.redirectToLogin();
      }
    }
  }

  // Check if current page requires authentication
  isProtectedPage() {
    const currentPath = window.location.pathname;

    // If it's a public page, return false
    if (AUTH.PUBLIC_ROUTES.some((page) => currentPath.includes(page))) {
      return false;
    }

    return AUTH.PROTECTED_ROUTES.some((page) => currentPath.includes(page));
  }

  // Load authentication data from secure storage and Supabase session
  async loadStoredAuth() {
    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    logger.debug("Loading stored authentication data...");

    try {
      // First, try to restore Supabase session (this handles persistent sessions)
      const { getSupabase } = await import('./js/services/supabase-client.js');
      const supabase = getSupabase();

      if (supabase) {
        // Get current session from Supabase (this restores persisted sessions)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.warn("[Auth] Error getting Supabase session:", sessionError);
        }

        if (session) {
          logger.debug("[Auth] Found Supabase session, restoring...");
          
          // Restore session from Supabase
          this.token = session.access_token;
          this.user = {
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role || 'player',
            name: session.user.user_metadata?.name ||
                  session.user.user_metadata?.full_name ||
                  session.user.email,
            email_verified: session.user.email_confirmed_at !== null,
            provider: session.user.app_metadata?.provider,
          };

          // Store in secure storage for consistency
          await secureStorage.setAuthToken(this.token);
          await secureStorage.setUserData(this.user);
          
          // Set token in API client
          apiClient.setAuthToken(this.token);
          
          logger.success("[Auth] Supabase session restored successfully");
          
          if (isDevelopment) {
            logger.debug("Restored user:", this.user.email);
            logger.debug("Token expires at:", new Date(session.expires_at * 1000));
          }
          
          return; // Successfully restored from Supabase, exit early
        } else {
          logger.debug("[Auth] No Supabase session found");
        }
      }

      // Fallback: Try to migrate from legacy storage
      await secureStorage.migrateFromLegacyStorage();

      // Load from secure storage (now async with AES-GCM)
      this.token = await secureStorage.getAuthToken();
      this.user = await secureStorage.getUserData();

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
      // Don't clear auth on error - might be a temporary network issue
      // Let Supabase handle session restoration
    }
  }

  // Validate stored token with backend
  async validateStoredToken(timeoutMs = AUTH.TOKEN_VALIDATION_TIMEOUT) {
    if (!this.token) {return false;}

    try {
      // Add timeout to prevent hanging on slow/unresponsive API calls
      const validationPromise = auth.getCurrentUser();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Token validation timeout")), timeoutMs);
      });

      const response = await Promise.race([validationPromise, timeoutPromise]);
      
      if (response.success) {
        this.user = response.user;
        await this.saveUserData();
        this.notifyLoginCallbacks();
        return true;
      } else {
        logger.warn("Token validation failed on server");
        // Don't clear auth immediately, let the page handle it
        return false;
      }
    } catch (error) {
      // Handle timeout errors
      if (error.message === "Token validation timeout") {
        logger.warn("Token validation timed out - endpoint may be slow or unavailable");
        // Assume token is valid to prevent redirect loops
        logger.debug("Timeout during validation, assuming token valid");
        return true;
      }

      // Check if this is an HTML response (endpoint doesn't exist)
      if (error.isHTMLResponse) {
        logger.warn("Token validation endpoint returned HTML - endpoint may not be configured:", error.message);
        // Assume token is valid to prevent redirect loops, but log the issue
        logger.debug("HTML response during validation, assuming token valid (endpoint may be misconfigured)");
        return true;
      }
      
      // Check if this is a 401 error (unauthorized)
      if (error.status === 401) {
        logger.warn("Token validation failed: Unauthorized");
        return false;
      }
      
      // For other errors (network errors, etc.), assume token is still valid to prevent redirect loops
      logger.error("Token validation network error:", error);
      logger.debug("Network error during validation, assuming token valid");
      return true;
    }
  }

  // Login with email and password
  async login(email, password) {
    try {
      this.showLoading("Signing in...");

      // Import Supabase client
      const { getSupabase } = await import('./js/services/supabase-client.js');
      const supabase = getSupabase();

      if (!supabase) {
        throw new Error("Unable to connect to authentication service");
      }

      // Use Supabase Auth sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.hideLoading();

        // Handle email not verified
        if (error.message.includes('Email not confirmed') ||
            error.message.includes('not verified')) {
          this.showError(
            "Please verify your email before logging in. Check your inbox for the verification link."
          );
          return {
            success: false,
            error: 'Email not verified',
            requiresVerification: true
          };
        }

        this.showError(error.message || "Login failed");
        return { success: false, error: error.message };
      }

      // Successful login
      this.token = data.session.access_token;
      this.user = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'player',
        name: data.user.user_metadata?.name || data.user.email,
        email_verified: data.user.email_confirmed_at !== null,
      };

      // Store session
      await secureStorage.setAuthToken(this.token);
      await secureStorage.setUserData(this.user);

      // Set token in API client
      apiClient.setAuthToken(this.token);

      // Notify callbacks
      this.notifyLoginCallbacks();

      this.hideLoading();
      this.showSuccess("Welcome back!");

      // Redirect to dashboard
      setTimeout(() => {
        this.redirectToDashboard();
      }, 1000);

      return { success: true, user: this.user };
    } catch (error) {
      this.hideLoading();
      this.showError("Login failed. Please try again.");
      logger.error("Login error:", error);
      return { success: false, error: error.message };
    }
  }

  // Register new user
  async register(userData) {
    try {
      this.showLoading("Creating your account...");

      const { name, email, password, role } = userData;
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      // Import Supabase client
      const { getSupabase } = await import('./js/services/supabase-client.js');
      const supabase = getSupabase();

      if (!supabase) {
        throw new Error("Unable to connect to authentication service");
      }

      // Use Supabase Auth signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email.html`,
          data: {
            name,
            role: role || 'player',
            first_name: firstName,
            last_name: lastName || '',
          }
        }
      });

      if (error) {
        this.hideLoading();
        this.showError(error.message || "Registration failed");
        return { success: false, error: error.message };
      }

      this.hideLoading();
      this.showSuccess(
        "Account created! Please check your email to verify your account before signing in."
      );

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name,
          role: role || 'player',
        },
        requiresVerification: true
      };
    } catch (error) {
      this.hideLoading();
      this.showError(error.message || "Registration failed");
      logger.error("Registration error:", error);
      return { success: false, error: error.message };
    }
  }

  // Logout user
  async logout() {
    try {
      const { getSupabase } = await import('./js/services/supabase-client.js');
      const supabase = getSupabase();

      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          logger.warn("Logout error:", error);
        }
      }
    } catch (error) {
      logger.warn("Logout API call failed:", error);
    }

    // Clear local state
    this.clearAuth();
    this.notifyLogoutCallbacks();
    this.showSuccess("You have been logged out successfully.");

    // Redirect to login
    setTimeout(() => {
      this.redirectToLogin();
    }, 1000);
  }

  // Sign in with OAuth provider (Google, Facebook, Apple)
  async signInWithOAuth(provider, role) {
    try {
      this.showLoading(`Signing in with ${provider}...`);

      const { getSupabase } = await import('./js/services/supabase-client.js');
      const supabase = getSupabase();

      if (!supabase) {
        throw new Error("Unable to connect to authentication service");
      }

      // Store role in localStorage temporarily (will be added to user metadata on callback)
      localStorage.setItem('pending_oauth_role', role);

      // Redirect to OAuth provider
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: provider === 'google' ? 'email profile' : undefined,
        }
      });

      if (error) {
        this.hideLoading();
        this.showError(error.message || `${provider} sign-in failed`);
        localStorage.removeItem('pending_oauth_role');
        return { success: false, error: error.message };
      }

      // User will be redirected to OAuth provider
      // Callback will be handled in /auth/callback page

    } catch (error) {
      this.hideLoading();
      this.showError(`Failed to sign in with ${provider}`);
      logger.error(`${provider} OAuth error:`, error);
      localStorage.removeItem('pending_oauth_role');
      return { success: false, error: error.message };
    }
  }

  // Setup Supabase Auth state change listener
  async setupSupabaseAuthListener() {
    try {
      const { getSupabase } = await import('./js/services/supabase-client.js');
      const supabase = getSupabase();

      if (!supabase) {
        logger.warn('[Auth] Supabase client not available for auth listener');
        return;
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        logger.debug('[Auth] State changed:', event);

        if (event === 'SIGNED_IN' && session) {
          // Check if this is an OAuth sign-in
          const pendingRole = localStorage.getItem('pending_oauth_role');

          // Get provider from session
          const provider = session.user.app_metadata?.provider;
          const isOAuth = provider !== 'email';

          this.token = session.access_token;
          this.user = {
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role || pendingRole || 'player',
            name: session.user.user_metadata?.name ||
                  session.user.user_metadata?.full_name ||
                  session.user.email,
            email_verified: session.user.email_confirmed_at !== null || isOAuth, // OAuth users auto-verified
            provider: provider,
          };

          // If OAuth and role was pending, update user metadata
          if (isOAuth && pendingRole && !session.user.user_metadata?.role) {
            await supabase.auth.updateUser({
              data: {
                role: pendingRole,
                name: this.user.name,
              }
            });
            localStorage.removeItem('pending_oauth_role');
          }

          // Store session persistently
          await secureStorage.setAuthToken(this.token);
          await secureStorage.setUserData(this.user);
          
          // Set token in API client
          apiClient.setAuthToken(this.token);
          
          // Notify callbacks
          this.notifyLoginCallbacks();
          
          logger.debug('[Auth] Session restored/updated from Supabase');
        } else if (event === 'SIGNED_OUT') {
          this.clearAuth();
          this.notifyLogoutCallbacks();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Token was automatically refreshed by Supabase
          this.token = session.access_token;
          await secureStorage.setAuthToken(this.token);
          apiClient.setAuthToken(this.token);
          logger.debug('[Auth] Token refreshed automatically');
        } else if (event === 'USER_UPDATED' && session) {
          // User metadata was updated
          if (session.user) {
            this.user = {
              ...this.user,
              id: session.user.id,
              email: session.user.email,
              role: session.user.user_metadata?.role || this.user?.role || 'player',
              name: session.user.user_metadata?.name ||
                    session.user.user_metadata?.full_name ||
                    this.user?.name ||
                    session.user.email,
              email_verified: session.user.email_confirmed_at !== null,
            };
            await secureStorage.setUserData(this.user);
            logger.debug('[Auth] User data updated');
          }
        }
      });

      logger.debug('[Auth] Supabase auth listener set up successfully');
    } catch (error) {
      logger.error('[Auth] Failed to setup auth listener:', error);
    }
  }

  // Resend verification email
  async resendVerificationEmail(email) {
    try {
      this.showLoading("Sending verification email...");

      const { getSupabase } = await import('./js/services/supabase-client.js');
      const supabase = getSupabase();

      if (!supabase) {
        throw new Error("Unable to connect to authentication service");
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email.html`,
        }
      });

      if (error) {
        this.hideLoading();
        this.showError(error.message || "Failed to resend verification email");
        return;
      }

      this.hideLoading();
      this.showSuccess("Verification email sent! Please check your inbox.");
    } catch (error) {
      this.hideLoading();
      this.showError("Failed to resend verification email");
      logger.error("Resend verification error:", error);
    }
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

  // Save user data securely (now async with AES-GCM)
  async saveUserData() {
    if (this.user) {
      await secureStorage.setUserData(this.user);
    }
  }

  // Check if user is authenticated (synchronous - for quick checks)
  isAuthenticated() {
    // Quick synchronous check - returns true if we have token and user
    // For full validation including session restoration, use checkAuthentication()
    return !!(this.token && this.user);
  }

  // Check authentication with session restoration (async)
  async checkAuthentication() {
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

    // First check: If we have token and user, validate token
    if (this.token && this.user) {
      // For JWT tokens, validate expiration
      try {
        // Verify token is not expired
        const payload = JSON.parse(atob(this.token.split(".")[1]));
        const tokenExpiry = payload.exp ? Math.floor(Date.now() / 1000) : null;

        // Only log token details in development
        if (isDevelopment && shouldLog) {
          logger.debug("⏰ Token expires at:", payload.exp ? new Date(payload.exp * 1000) : "No expiry");
          logger.debug("⏰ Current time:", new Date());
        }

        // If token has expiry and is expired, try to refresh via Supabase
        if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) {
          if (isDevelopment) {
            logger.debug("⏰ Token expired, attempting refresh via Supabase...");
          }
          
          // Try to refresh session via Supabase
          try {
            const { getSupabase } = await import('./js/services/supabase-client.js');
            const supabase = getSupabase();
            
            if (supabase) {
              const { data: { session }, error: refreshError } = await supabase.auth.getSession();
              
              if (session && session.access_token) {
                // Session refreshed successfully
                this.token = session.access_token;
                await secureStorage.setAuthToken(this.token);
                apiClient.setAuthToken(this.token);
                
                if (isDevelopment) {
                  logger.debug("✅ Token refreshed successfully");
                }
                return true;
              } else if (refreshError) {
                if (isDevelopment) {
                  logger.debug("❌ Token refresh failed:", refreshError);
                }
                // Token refresh failed, clear auth
                this.clearAuth();
                return false;
              }
            }
          } catch (refreshError) {
            if (isDevelopment) {
              logger.debug("❌ Token refresh error:", refreshError);
            }
          }
          
          // If refresh failed, clear auth
          if (isDevelopment) {
            logger.debug("❌ Token expired and refresh failed, clearing auth");
          }
          this.clearAuth();
          return false;
        } else {
          // Token is valid
          if (isDevelopment && shouldLog) {
            logger.debug("✅ User is authenticated (JWT valid)");
          }
          return true;
        }
      } catch (error) {
        if (isDevelopment) {
          logger.error("❌ JWT token validation failed:", error);
        }

        // JWT parsing failure - might be a Supabase token (not JWT)
        // Check if we have a valid Supabase session instead
        try {
          const { getSupabase } = await import('./js/services/supabase-client.js');
          const supabase = getSupabase();
          
          if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.access_token) {
              // Valid Supabase session exists
              this.token = session.access_token;
              await secureStorage.setAuthToken(this.token);
              apiClient.setAuthToken(this.token);
              
              if (isDevelopment && shouldLog) {
                logger.debug("✅ Valid Supabase session found");
              }
              return true;
            }
          }
        } catch (sessionError) {
          // Ignore session check errors
        }

        // No valid session found, clear auth
        this.clearAuth();
        return false;
      }
    }

    // Second check: Try to restore from Supabase session if we don't have local auth
    if (!this.token || !this.user) {
      try {
        const { getSupabase } = await import('./js/services/supabase-client.js');
        const supabase = getSupabase();
        
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.access_token) {
            // Restore session from Supabase
            this.token = session.access_token;
            this.user = {
              id: session.user.id,
              email: session.user.email,
              role: session.user.user_metadata?.role || 'player',
              name: session.user.user_metadata?.name ||
                    session.user.user_metadata?.full_name ||
                    session.user.email,
              email_verified: session.user.email_confirmed_at !== null,
            };
            
            await secureStorage.setAuthToken(this.token);
            await secureStorage.setUserData(this.user);
            apiClient.setAuthToken(this.token);
            
            if (isDevelopment && shouldLog) {
              logger.debug("✅ Session restored from Supabase");
            }
            return true;
          }
        }
      } catch (error) {
        // Ignore errors during session restoration check
        if (isDevelopment) {
          logger.debug("Session restoration check error:", error);
        }
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
    // Supabase handles token refresh automatically via autoRefreshToken: true
    // This is just a backup validation check
      // Check token validity every hour (Supabase refreshes automatically before expiry)
      setInterval(
      async () => {
        if (this.token && this.user) {
          // Try to refresh Supabase session if needed
          try {
            const { getSupabase } = await import('./js/services/supabase-client.js');
            const supabase = getSupabase();
            
            if (supabase) {
              // Get current session (this will trigger refresh if needed)
              const { data: { session } } = await supabase.auth.getSession();
              
              if (session && session.access_token !== this.token) {
                // Token was refreshed
                this.token = session.access_token;
                await secureStorage.setAuthToken(this.token);
                apiClient.setAuthToken(this.token);
                logger.debug('[Auth] Token refreshed via periodic check');
              }
            }
          } catch (error) {
            logger.debug('[Auth] Token refresh check error:', error);
            // Fallback to validation
            this.validateStoredToken();
          }
        }
      },
      60 * 60 * 1000, // Check every hour
    );
  }

  // Setup session timeout management
  // NOTE: Disabled by default for persistent sessions. Set AUTH.ENABLE_SESSION_TIMEOUT=true to enable
  setupSessionTimeout() {
    // Check if session timeout is enabled (default: false for persistent sessions)
    const ENABLE_TIMEOUT = AUTH.ENABLE_SESSION_TIMEOUT !== undefined 
      ? AUTH.ENABLE_SESSION_TIMEOUT 
      : false; // Default to false for persistent sessions

    if (!ENABLE_TIMEOUT) {
      logger.debug('[Auth] Session timeout disabled - using persistent sessions');
      return; // Exit early if timeout is disabled
    }

    // Use centralized constants instead of hardcoded values
    const SESSION_TIMEOUT = AUTH.SESSION_TIMEOUT;
    const WARNING_TIME = AUTH.SESSION_WARNING_TIME;

    let sessionTimer;
    let warningTimer;
    let lastActivity = Date.now();

    const resetSessionTimer = () => {
      lastActivity = Date.now();

      // Clear existing timers
      if (sessionTimer) {clearTimeout(sessionTimer);}
      if (warningTimer) {clearTimeout(warningTimer);}

      // Set warning timer
      warningTimer = setTimeout(() => {
        if (this.token && this.user) {
          this.showWarning(
            `Your session will expire in ${AUTH.SESSION_WARNING_TIME / 60000} minutes due to inactivity.`,
          );
        }
      }, SESSION_TIMEOUT - WARNING_TIME);

      // Set logout timer
      sessionTimer = setTimeout(() => {
        if (this.token && this.user) {
          this.showError(ERROR_MESSAGES.SESSION_EXPIRED);
          this.logout();
        }
      }, SESSION_TIMEOUT);
    };

    // Track user activity - store handlers for cleanup
    // Reduced to 3 strategic events to minimize performance impact
    const activityEvents = ["mousedown", "keypress", "touchstart"];

    // Clean up existing handlers first to prevent memory leaks
    if (this.activityHandlers && this.activityHandlers.length > 0) {
      this.activityHandlers.forEach(({ event, handler }) => {
        document.removeEventListener(event, handler);
      });
      this.activityHandlers = [];
    }

    // Create debounced handler to prevent excessive calls
    const activityHandler = debounce(() => {
      if (this.token && this.user && Date.now() - lastActivity > AUTH.ACTIVITY_RESET_THRESHOLD) {
        resetSessionTimer();
      }
    }, AUTH.ACTIVITY_DEBOUNCE_TIME);

    // Store handlers for cleanup
    this.activityHandlers = [];
    activityEvents.forEach((event) => {
      // Use passive: true for better performance, no capture phase needed
      document.addEventListener(event, activityHandler, { passive: true });
      this.activityHandlers.push({ event, handler: activityHandler });
    });

      // Initialize session timer
      if (this.token && this.user) {
        resetSessionTimer();
      }

      // Reset timer on login
      this.onLogin(() => {
        resetSessionTimer();
      });

    // Clear timers and remove event listeners on logout
    this.onLogout(() => {
      if (sessionTimer) {clearTimeout(sessionTimer);}
      if (warningTimer) {clearTimeout(warningTimer);}
      // Remove activity event listeners
      if (this.activityHandlers) {
        this.activityHandlers.forEach(({ event, handler }) => {
          document.removeEventListener(event, handler);
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
    logger.debug("🔒 Checking authentication requirement...");

    // Wait for auth manager to finish initializing
    await this.waitForInit();

    logger.debug("🔍 Auth check after initialization:");
    logger.debug("   - Is authenticated:", !!(this.token && this.user));
    logger.debug("   - Token exists:", !!this.token);
    logger.debug("   - User exists:", !!this.user);

    // SECURITY: Explicit environment-based bypass for development ONLY
    // This will ONLY work if:
    // 1. Running in development environment (localhost)
    // 2. ALLOW_UNAUTHENTICATED_DEV is explicitly set to "true"
    if (config.ALLOW_UNAUTHENTICATED_DEV && !(this.token && this.user)) {
      logger.warn("⚠️ ==========================================");
      logger.warn("⚠️ DEV MODE ONLY: Bypassing authentication");
      logger.warn("⚠️ This is DISABLED in production");
      logger.warn("⚠️ Set ALLOW_UNAUTHENTICATED_DEV=false to test auth flow");
      logger.warn("⚠️ ==========================================");
      return true;
    }

    if (!(this.token && this.user)) {
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

    // Check if user has completed onboarding
    const user = this.getCurrentUser();
    const onboardingCompleted = user?.user_metadata?.onboarding_completed || 
                                (typeof storageService !== 'undefined' && storageService.get("onboardingCompleted", null, { usePrefix: false }));

    // If onboarding not completed, redirect to onboarding page
    if (!onboardingCompleted) {
      logger.debug("📋 Onboarding not completed, redirecting to onboarding page");
      const onboardingUrl = this.getOnboardingUrl();
      try {
        window.location.href = onboardingUrl;
        return;
      } catch (error) {
        logger.error("❌ Redirect to onboarding failed:", error);
      }
    }

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

  // Get the onboarding URL for current environment
  getOnboardingUrl() {
    const currentUrl = window.location;
    const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
    return `${baseUrl}/onboarding.html`;
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
        await this.saveUserData();
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
        document.removeEventListener(event, handler);
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
