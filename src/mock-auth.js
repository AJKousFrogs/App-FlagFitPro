// Mock Authentication for Development/Demo Environments Only
// WARNING: This is for development/demo purposes only and should never be used in production

import { logger } from "./logger.js";
import { config } from "./config/environment.js";
import { storageService } from "./js/services/storage-service-unified.js";

export class MockAuth {
  constructor() {
    this.isLoggedIn = false;
    this.currentUser = null;
    this.loginAttempts = new Map(); // Track login attempts by email

    // Security warning for production
    if (!config.ENABLE_MOCK_AUTH) {
      logger.error(
        "MockAuth should not be instantiated when ENABLE_MOCK_AUTH is false",
      );
      throw new Error("Mock authentication is disabled in this environment");
    }

    // Only log once per session to avoid console spam
    if (!window._mockAuthWarningShown) {
      logger.debug("🚨 MOCK AUTHENTICATION ACTIVE - FOR DEVELOPMENT ONLY");
      window._mockAuthWarningShown = true;
    }
  }

  async login(credentials) {
    // Simulate realistic API delay
    await new Promise((resolve) =>
      setTimeout(resolve, 800 + Math.random() * 400),
    );

    // Basic validation
    if (!credentials?.email || !credentials?.password) {
      return {
        success: false,
        error: "Email and password are required",
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      return {
        success: false,
        error: "Invalid email format",
      };
    }

    // Check password requirements (minimum 6 characters for demo)
    if (credentials.password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long",
      };
    }

    // Track login attempts (basic rate limiting simulation)
    const attempts = this.loginAttempts.get(credentials.email) || 0;
    if (attempts >= 5) {
      return {
        success: false,
        error: "Too many login attempts. Please try again later.",
      };
    }

    // Check if user is registered (for better demo experience)
    const existingUsers = JSON.parse(localStorage.getItem('demo_registered_users') || '[]');
    const isRegistered = existingUsers.includes(credentials.email.toLowerCase());

    // For demo purposes, accept any valid email/password combination
    // In production, this would validate against a real database
    try {
      this.isLoggedIn = true;
      this.currentUser = {
        id: `demo-${Date.now()}`,
        email: credentials.email,
        name: this.extractNameFromEmail(credentials.email),
        role: "player",
        email_verified: isRegistered, // Verified if they registered through the app
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      // Generate a more realistic demo token
      const token = this.generateDemoToken();

      // Reset login attempts on successful login
      this.loginAttempts.delete(credentials.email);

      // Store in localStorage (securely in production this would be httpOnly cookies)
      storageService.set("authToken", token, { usePrefix: false });
      storageService.set("userData", this.currentUser, { usePrefix: false });

      logger.debug("Demo login successful for:", credentials.email);

      return {
        success: true,
        data: {
          token: token,
          user: this.currentUser,
          expiresIn: 3600, // 1 hour for demo
        },
      };
    } catch (error) {
      logger.error("Mock login error:", error);

      // Increment login attempts
      this.loginAttempts.set(credentials.email, attempts + 1);

      return {
        success: false,
        error: "Authentication failed. Please try again.",
      };
    }
  }

  extractNameFromEmail(email) {
    const localPart = email.split("@")[0];
    // Convert common patterns like "john.doe" or "john_doe" to "John Doe"
    return localPart
      .replace(/[._-]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  generateDemoToken() {
    // Generate a more realistic-looking JWT-style token for demo
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: this.currentUser?.id || "demo-user",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        iss: "flagfit-demo",
      }),
    );
    const signature = btoa("demo-signature-" + Date.now());

    return `${header}.${payload}.${signature}`;
  }

  async register(userData) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Basic validation
    if (!userData?.email || !userData?.password) {
      return {
        success: false,
        error: "Email and password are required",
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return {
        success: false,
        error: "Invalid email format",
      };
    }

    // Check if user already exists (simple localStorage check for demo)
    const existingUsers = JSON.parse(localStorage.getItem('demo_registered_users') || '[]');
    if (existingUsers.includes(userData.email.toLowerCase())) {
      return {
        success: false,
        error: "User with this email already exists",
      };
    }

    try {
      this.isLoggedIn = true;
      this.currentUser = {
        id: `demo-${Date.now()}`,
        email: userData.email,
        name: userData.name || this.extractNameFromEmail(userData.email),
        role: "player",
        email_verified: false,
        createdAt: new Date().toISOString(),
      };

      // Generate demo token
      const token = this.generateDemoToken();

      // Store token and user data
      storageService.set("authToken", token, { usePrefix: false });
      storageService.set("userData", this.currentUser, { usePrefix: false });

      // Add to registered users list
      existingUsers.push(userData.email.toLowerCase());
      localStorage.setItem('demo_registered_users', JSON.stringify(existingUsers));

      logger.debug("Demo registration successful for:", userData.email);

      return {
        success: true,
        data: {
          token: token,
          user: this.currentUser,
        },
        message: "Account created successfully. Please check your email to verify your account.",
        requiresVerification: true
      };
    } catch (error) {
      logger.error("Mock registration error:", error);
      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    }
  }

  async logout() {
    this.isLoggedIn = false;
    this.currentUser = null;
    storageService.remove("authToken", { usePrefix: false });
    storageService.remove("userData", { usePrefix: false });

    return { success: true };
  }

  async getCurrentUser() {
    const token = storageService.get("authToken", null, { usePrefix: false });
    const userData = storageService.get("userData", null, { usePrefix: false });

    if (token && userData) {
      this.currentUser = userData;
      this.isLoggedIn = true;

      return {
        success: true,
        user: this.currentUser,
      };
    }

    return {
      success: false,
      error: "Not authenticated",
    };
  }

  isAuthenticated() {
    const token = storageService.get("authToken", null, { usePrefix: false });
    return !!token;
  }
}
