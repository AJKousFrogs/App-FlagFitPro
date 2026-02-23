/**
 * Auth Service Unit Tests
 *
 * Comprehensive test coverage for authentication service.
 * Tests login, logout, registration, and session management.
 *
 * @version 1.0.0
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import {
  AuthService,
  User,
  LoginCredentials,
  RegisterData,
} from "./auth.service";
import { SupabaseService } from "./supabase.service";

// Mock Supabase service - use 'as unknown as SupabaseService' to avoid strict type checking
const mockSupabaseService = {
  currentUser: vi.fn(() => null),
  session: vi.fn(() => null),
  userId: vi.fn(() => null),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  client: {
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
    },
  },
} as unknown as SupabaseService;

// Mock Router
const mockRouter = {
  navigate: vi.fn(),
};

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {};
vi.stubGlobal("sessionStorage", {
  getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockSessionStorage).forEach(
      (key) => delete mockSessionStorage[key],
    );
  }),
});

// Mock crypto for CSRF token generation
vi.stubGlobal("crypto", {
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
});

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSessionStorage).forEach(
      (key) => delete mockSessionStorage[key],
    );

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  describe("Initial State", () => {
    it("should initialize with null user", () => {
      expect(service.currentUser()).toBeNull();
    });

    it("should initialize with isAuthenticated false", () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it("should initialize with isLoading false", () => {
      expect(service.isLoading()).toBe(false);
    });
  });

  // ============================================================================
  // Login Tests
  // ============================================================================

  describe("Login", () => {
    const validCredentials: LoginCredentials = {
      email: "test@example.com",
      password: "password123",
    };

    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      user_metadata: {
        name: "Test User",
        role: "athlete",
      },
    };

    const mockSession = {
      access_token: "mock-token",
      refresh_token: "mock-refresh",
    };

    it("should login successfully with valid credentials", async () => {
      (mockSupabaseService as any).signIn.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const response = await firstValueFrom(service.login(validCredentials));

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect((mockSupabaseService as any).signIn).toHaveBeenCalledWith(
        validCredentials.email,
        validCredentials.password,
      );
    });

    it("should set loading state during login", async () => {
      (mockSupabaseService as any).signIn.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Start login
      const loginPromise = firstValueFrom(service.login(validCredentials));

      // After completion, loading should be false
      await loginPromise;
      expect(service.isLoading()).toBe(false);
    });

    it("should handle login error", async () => {
      (mockSupabaseService as any).signIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid credentials" },
      });

      await expect(
        firstValueFrom(service.login(validCredentials)),
      ).rejects.toThrow("Invalid credentials");
      expect(service.isLoading()).toBe(false);
    });

    it("should handle network error during login", async () => {
      (mockSupabaseService as any).signIn.mockRejectedValue(
        new Error("Network error"),
      );

      await expect(
        firstValueFrom(service.login(validCredentials)),
      ).rejects.toThrow("Network error");
      expect(service.isLoading()).toBe(false);
    });
  });

  // ============================================================================
  // Registration Tests
  // ============================================================================

  describe("Registration", () => {
    const validRegistration: RegisterData = {
      email: "newuser@example.com",
      password: "securePassword123",
      name: "New User",
    };

    const mockNewUser = {
      id: "new-user-123",
      email: "newuser@example.com",
      user_metadata: {
        name: "New User",
      },
    };

    it("should register successfully with valid data", async () => {
      (mockSupabaseService as any).signUp.mockResolvedValue({
        data: { user: mockNewUser, session: null },
        error: null,
      });

      const response = await firstValueFrom(
        service.register(validRegistration),
      );

      expect(response.success).toBe(true);
      expect(response.message).toContain("verify");
      expect((mockSupabaseService as any).signUp).toHaveBeenCalledWith(
        validRegistration.email,
        validRegistration.password,
        { name: validRegistration.name, full_name: validRegistration.name },
      );
    });

    it("should set loading state during registration", async () => {
      (mockSupabaseService as any).signUp.mockResolvedValue({
        data: { user: mockNewUser, session: null },
        error: null,
      });

      await firstValueFrom(service.register(validRegistration));
      expect(service.isLoading()).toBe(false);
    });

    it("should handle registration error", async () => {
      (mockSupabaseService as any).signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Email already registered" },
      });

      await expect(
        firstValueFrom(service.register(validRegistration)),
      ).rejects.toThrow("Email already registered");
    });

    it("should pass additional metadata during registration", async () => {
      const registrationWithMetadata: RegisterData = {
        ...validRegistration,
        role: "coach",
        teamId: "team-123",
      };

      (mockSupabaseService as any).signUp.mockResolvedValue({
        data: { user: mockNewUser, session: null },
        error: null,
      });

      await firstValueFrom(service.register(registrationWithMetadata));

      expect((mockSupabaseService as any).signUp).toHaveBeenCalledWith(
        registrationWithMetadata.email,
        registrationWithMetadata.password,
        {
          name: "New User",
          full_name: "New User",
          role: "coach",
          teamId: "team-123",
        },
      );
    });
  });

  // ============================================================================
  // Logout Tests
  // ============================================================================

  describe("Logout", () => {
    it("should logout successfully", async () => {
      (mockSupabaseService as any).signOut.mockResolvedValue({ error: null });

      await firstValueFrom(service.logout());

      expect((mockSupabaseService as any).signOut).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/login"]);
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it("should clear auth state even if logout fails", async () => {
      (mockSupabaseService as any).signOut.mockRejectedValue(
        new Error("Network error"),
      );

      await expect(firstValueFrom(service.logout())).rejects.toThrow();

      expect(mockRouter.navigate).toHaveBeenCalledWith(["/login"]);
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it("should clear CSRF token on logout", async () => {
      // Set a CSRF token first
      service.generateCsrfToken();
      expect(service.getCsrfToken()).not.toBeNull();

      (mockSupabaseService as any).signOut.mockResolvedValue({ error: null });
      await firstValueFrom(service.logout());

      expect(sessionStorage.removeItem).toHaveBeenCalledWith("csrfToken");
    });
  });

  // ============================================================================
  // Session Management Tests
  // ============================================================================

  describe("Session Management", () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      user_metadata: {
        name: "Test User",
        role: "athlete",
      },
    };

    it("should get current user from Supabase", async () => {
      (mockSupabaseService as any).currentUser.mockReturnValue(mockUser);

      const response = await firstValueFrom(service.getCurrentUser());

      expect(response.success).toBe(true);
      expect((response.data as User).email).toBe("test@example.com");
    });

    it("should return error when no user found", async () => {
      (mockSupabaseService as any).currentUser.mockReturnValue(null);

      const response = await firstValueFrom(service.getCurrentUser());

      expect(response.success).toBe(false);
      expect(response.error).toBe("No user found");
    });

    it("should check auth status correctly", () => {
      (mockSupabaseService as any).session.mockReturnValue({ user: mockUser });
      // Manually set isAuthenticated since effect() won't run in tests
      service.isAuthenticated.set(true);

      expect(service.checkAuth()).toBe(true);
    });

    it("should return false when no session", () => {
      (mockSupabaseService as any).session.mockReturnValue(null);

      expect(service.checkAuth()).toBe(false);
    });

    it("should get token from Supabase", async () => {
      const mockSession = {
        access_token: "mock-jwt-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      };
      (mockSupabaseService.client.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const token = await service.getToken();

      expect(token).toBe("mock-jwt-token");
    });

    it("should return null token when not authenticated", async () => {
      (mockSupabaseService.client.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const token = await service.getToken();

      expect(token).toBeNull();
    });
  });

  // ============================================================================
  // User State Tests
  // ============================================================================

  describe("User State", () => {
    it("should get user from signal", () => {
      const mockAppUser: User = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "athlete",
      };

      service.currentUser.set(mockAppUser);

      expect(service.getUser()).toEqual(mockAppUser);
    });

    it("should return null when no user", () => {
      expect(service.getUser()).toBeNull();
    });
  });

  // ============================================================================
  // Navigation Tests
  // ============================================================================

  describe("Navigation", () => {
    it("should redirect to dashboard", () => {
      service.redirectToDashboard();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/dashboard"]);
    });

    it("should redirect to login", () => {
      service.redirectToLogin();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/login"]);
    });
  });

  // ============================================================================
  // CSRF Token Tests
  // ============================================================================

  describe("CSRF Token", () => {
    it("should generate CSRF token", () => {
      const token = service.generateCsrfToken();

      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(sessionStorage.setItem).toHaveBeenCalledWith("csrfToken", token);
    });

    it("should get stored CSRF token", () => {
      const generatedToken = service.generateCsrfToken();
      mockSessionStorage["csrfToken"] = generatedToken;

      const retrievedToken = service.getCsrfToken();

      expect(retrievedToken).toBe(generatedToken);
    });

    it("should return null when no CSRF token", () => {
      expect(service.getCsrfToken()).toBeNull();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle empty email in login", async () => {
      (mockSupabaseService as any).signIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Email is required" },
      });

      await expect(
        firstValueFrom(service.login({ email: "", password: "password" })),
      ).rejects.toThrow("Email is required");
    });

    it("should handle empty password in login", async () => {
      (mockSupabaseService as any).signIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Password is required" },
      });

      await expect(
        firstValueFrom(
          service.login({ email: "test@example.com", password: "" }),
        ),
      ).rejects.toThrow("Password is required");
    });

    it("should handle user with missing metadata", async () => {
      const userWithoutMetadata = {
        id: "user-123",
        email: "test@example.com",
        user_metadata: {},
      };

      (mockSupabaseService as any).currentUser.mockReturnValue(
        userWithoutMetadata,
      );

      const response = await firstValueFrom(service.getCurrentUser());

      expect(response.success).toBe(true);
      const user = response.data as User;
      expect(user.name).toBe("test@example.com"); // Falls back to email
      expect(user.role).toBe("user"); // Falls back to default role
    });

    it("should handle user with null email", async () => {
      const userWithNullEmail = {
        id: "user-123",
        email: null,
        user_metadata: { name: "Test" },
      };

      (mockSupabaseService as any).currentUser.mockReturnValue(
        userWithNullEmail,
      );

      const response = await firstValueFrom(service.getCurrentUser());

      expect(response.success).toBe(true);
      const user = response.data as User;
      expect(user.email).toBe("");
    });
  });
});
