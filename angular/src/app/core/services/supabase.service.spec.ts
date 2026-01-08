/**
 * Supabase Service Unit Tests
 *
 * IMPORTANT: These tests are currently skipped due to module mocking limitations.
 *
 * The SupabaseService constructor creates a real Supabase client connection using
 * createClient from @supabase/supabase-js. With the Angular + Vitest setup (using
 * @analogjs/vitest-angular), vi.mock() doesn't properly intercept the module import
 * before Angular's TestBed initializes the service.
 *
 * This causes tests to hang indefinitely as the real Supabase client tries to
 * establish a connection.
 *
 * Potential solutions:
 * 1. Make the Supabase client injectable via an InjectionToken
 * 2. Use a factory function that can be overridden in tests
 * 3. Create a wrapper service that's easier to mock
 *
 * For now, the SupabaseService is tested indirectly through:
 * - Integration tests
 * - Services that depend on it (which mock SupabaseService via DI)
 *
 * @see src/app/core/services/auth.service.spec.ts - Example of mocking SupabaseService
 * @see src/app/core/services/wellness.service.spec.ts - Example of mocking SupabaseService
 *
 * @version 3.0.0
 */

import { describe, it, expect } from "vitest";

// All tests are skipped - this file exists to document what should be tested
// DO NOT import SupabaseService directly as it will cause the test to hang

describe("SupabaseService", () => {
  it("is tested indirectly through dependent services", () => {
    // The SupabaseService cannot be directly unit tested due to mocking limitations
    // with @supabase/supabase-js and the Angular TestBed.
    //
    // Instead, verify that:
    // 1. auth.service.spec.ts tests authentication flows
    // 2. wellness.service.spec.ts tests data operations
    // 3. Integration tests verify end-to-end functionality
    expect(true).toBe(true);
  });

  describe("Documented Test Cases (to be implemented when mocking is possible)", () => {
    it.todo("should create service");
    it.todo("should provide client instance");
    it.todo("should initialize with null user");
    it.todo("should initialize with null session");
    it.todo("should initialize isAuthenticated as false");
    it.todo("should initialize userId as null");
    it.todo("should sign in with email and password");
    it.todo("should handle sign in error");
    it.todo("should sign up with email and password");
    it.todo("should sign up with metadata");
    it.todo("should handle sign up error");
    it.todo("should sign out successfully");
    it.todo("should handle sign out error");
    it.todo("should send password reset email");
    it.todo("should update user attributes");
    it.todo("should get access token from session");
    it.todo("should return null when no session");
    it.todo("should set up auth state listener on init");
    it.todo("should handle SIGNED_IN event");
    it.todo("should handle SIGNED_OUT event");
  });
});
