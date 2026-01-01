/**
 * Supabase Service Unit Tests
 *
 * Comprehensive test coverage for Supabase authentication and database service.
 * Tests auth operations, session management, and signal state.
 *
 * @version 1.0.0
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

// Mock Supabase client
const mockSupabaseAuth = {
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  onAuthStateChange: vi.fn(),
};

const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: vi.fn(),
  functions: {
    invoke: vi.fn(),
  },
};

// Mock createClient
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock environment
vi.mock("../../../environments/environment", () => ({
  environment: {
    supabase: {
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    },
  },
}));

// Mock LoggerService
const mockLoggerService = {
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  success: vi.fn(),
};

describe("SupabaseService", () => {
  let service: SupabaseService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for getSession
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Default mock for onAuthStateChange
    mockSupabaseAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    TestBed.configureTestingModule({
      providers: [
        SupabaseService,
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(SupabaseService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe("Initialization", () => {
    it("should create service", () => {
      expect(service).toBeDefined();
    });

    it("should provide client instance", () => {
      expect(service.client).toBeDefined();
    });

    it("should initialize with null user", () => {
      expect(service.currentUser()).toBeNull();
    });

    it("should initialize with null session", () => {
      expect(service.session()).toBeNull();
    });

    it("should initialize isAuthenticated as false", () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it("should initialize userId as null", () => {
      expect(service.userId()).toBeNull();
    });
  });

  // ============================================================================
  // Signal State Tests
  // ============================================================================

  describe("Signal State", () => {
    it("should have readonly currentUser signal", () => {
      expect(typeof service.currentUser).toBe("function");
    });

    it("should have readonly session signal", () => {
      expect(typeof service.session).toBe("function");
    });

    it("should compute isAuthenticated from user", () => {
      // Initially false
      expect(service.isAuthenticated()).toBe(false);
    });

    it("should compute userId from user", () => {
      // Initially null
      expect(service.userId()).toBeNull();
    });
  });

  // ============================================================================
  // Sign In Tests
  // ============================================================================

  describe("Sign In", () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      user_metadata: { name: "Test User" },
    };

    const mockSession = {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      user: mockUser,
    };

    it("should sign in with email and password", async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await service.signIn("test@example.com", "password123");

      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.data.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it("should handle sign in error", async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid credentials" },
      });

      const result = await service.signIn("test@example.com", "wrongpassword");

      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe("Invalid credentials");
    });

    it("should handle sign in with empty credentials", async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Email is required" },
      });

      const result = await service.signIn("", "");

      expect(result.error).toBeDefined();
    });
  });

  // ============================================================================
  // Sign Up Tests
  // ============================================================================

  describe("Sign Up", () => {
    const mockNewUser = {
      id: "new-user-123",
      email: "newuser@example.com",
      user_metadata: { name: "New User" },
    };

    it("should sign up with email and password", async () => {
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: mockNewUser, session: null },
        error: null,
      });

      const result = await service.signUp("newuser@example.com", "password123");

      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "password123",
        options: { data: undefined },
      });
      expect(result.data.user).toEqual(mockNewUser);
    });

    it("should sign up with metadata", async () => {
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: mockNewUser, session: null },
        error: null,
      });

      const metadata = {
        firstName: "John",
        lastName: "Doe",
        position: "Quarterback",
      };

      await service.signUp("newuser@example.com", "password123", metadata);

      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "password123",
        options: { data: metadata },
      });
    });

    it("should handle sign up error", async () => {
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Email already registered" },
      });

      const result = await service.signUp(
        "existing@example.com",
        "password123",
      );

      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe("Email already registered");
    });
  });

  // ============================================================================
  // Sign Out Tests
  // ============================================================================

  describe("Sign Out", () => {
    it("should sign out successfully", async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      const result = await service.signOut();

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });

    it("should handle sign out error", async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({
        error: { message: "Sign out failed" },
      });

      const result = await service.signOut();

      expect(result.error).toBeDefined();
    });
  });

  // ============================================================================
  // Password Reset Tests
  // ============================================================================

  describe("Password Reset", () => {
    it("should send password reset email", async () => {
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await service.resetPassword("test@example.com");

      expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(result.error).toBeNull();
    });

    it("should handle reset password error", async () => {
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: "Email not found" },
      });

      const result = await service.resetPassword("unknown@example.com");

      expect(result.error).toBeDefined();
    });
  });

  // ============================================================================
  // Update User Tests
  // ============================================================================

  describe("Update User", () => {
    it("should update user attributes", async () => {
      mockSupabaseAuth.updateUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const result = await service.updateUser({
        data: { name: "Updated Name" },
      });

      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        data: { name: "Updated Name" },
      });
      expect(result.error).toBeNull();
    });

    it("should update user email", async () => {
      mockSupabaseAuth.updateUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "new@example.com" } },
        error: null,
      });

      const result = await service.updateUser({ email: "new@example.com" });

      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        email: "new@example.com",
      });
      expect(result.error).toBeNull();
    });

    it("should handle update user error", async () => {
      mockSupabaseAuth.updateUser.mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });

      const result = await service.updateUser({ data: { invalid: true } });

      expect(result.error).toBeDefined();
    });
  });

  // ============================================================================
  // Token Tests
  // ============================================================================

  describe("Token Management", () => {
    it("should get access token from session", async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: "test-access-token",
            user: { id: "user-123" },
          },
        },
        error: null,
      });

      const token = await service.getToken();

      expect(token).toBe("test-access-token");
    });

    it("should return null when no session", async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const token = await service.getToken();

      expect(token).toBeNull();
    });
  });

  // ============================================================================
  // Synchronous Access Tests
  // ============================================================================

  describe("Synchronous Access", () => {
    it("should get current user synchronously", () => {
      const user = service.getCurrentUser();
      expect(user).toBeNull();
    });

    it("should get session synchronously", () => {
      const session = service.getSession();
      expect(session).toBeNull();
    });
  });

  // ============================================================================
  // Auth State Change Tests
  // ============================================================================

  describe("Auth State Changes", () => {
    it("should set up auth state listener on init", () => {
      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();
    });

    it("should handle SIGNED_IN event", async () => {
      // Get the callback that was passed to onAuthStateChange
      const authCallback =
        mockSupabaseAuth.onAuthStateChange.mock.calls[0]?.[0];

      if (authCallback) {
        const mockSession = {
          user: { id: "user-123", email: "test@example.com" },
          access_token: "token",
        };

        // Simulate auth state change
        authCallback("SIGNED_IN", mockSession);

        // Verify logger was called
        expect(mockLoggerService.debug).toHaveBeenCalledWith(
          "Auth state changed:",
          "SIGNED_IN",
        );
      }
    });

    it("should handle SIGNED_OUT event", async () => {
      const authCallback =
        mockSupabaseAuth.onAuthStateChange.mock.calls[0]?.[0];

      if (authCallback) {
        authCallback("SIGNED_OUT", null);

        expect(mockLoggerService.debug).toHaveBeenCalledWith(
          "Auth state changed:",
          "SIGNED_OUT",
        );
      }
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle concurrent sign in attempts", async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "user-1" }, session: {} },
        error: null,
      });

      const [result1, result2] = await Promise.all([
        service.signIn("test1@example.com", "pass1"),
        service.signIn("test2@example.com", "pass2"),
      ]);

      expect(result1.data.user).toBeDefined();
      expect(result2.data.user).toBeDefined();
    });

    it("should handle session with missing user", async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: { access_token: "token" } }, // No user
        error: null,
      });

      const token = await service.getToken();
      expect(token).toBe("token");
    });
  });
});
