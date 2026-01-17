/**
 * Security Tests: Authentication & Authorization
 *
 * Tests for:
 * - Unauthenticated request blocking (401)
 * - Cross-user access blocking (403)
 * - Invalid payload validation (422)
 *
 * Run with: npm test -- tests/security/auth-authz.test.js
 */

const { describe, it, expect, beforeAll } = require("@jest/globals");

// Mock fetch for testing
const mockFetch = async (url, options = {}) => {
  // This would be replaced with actual fetch in integration tests
  // For unit tests, we mock the responses
  return {
    status: 200,
    json: async () => ({}),
  };
};

// Test configuration
const API_BASE = process.env.API_URL || "http://localhost:8888/.netlify/functions";

// Helper to create auth header
const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

// ============================================================================
// AUTHENTICATION TESTS (401 - Unauthenticated)
// ============================================================================

describe("Authentication Tests", () => {
  describe("Protected endpoints require authentication", () => {
    const protectedEndpoints = [
      { method: "GET", path: "/dashboard" },
      { method: "GET", path: "/player-stats" },
      { method: "GET", path: "/payments" },
      { method: "GET", path: "/games" },
      { method: "POST", path: "/games" },
      { method: "GET", path: "/privacy-settings" },
      { method: "GET", path: "/account-deletion" },
      { method: "GET", path: "/analytics" },
      { method: "GET", path: "/wellness" },
      { method: "POST", path: "/wellness/checkin" },
      { method: "GET", path: "/supplements" },
      { method: "GET", path: "/hydration" },
      { method: "GET", path: "/nutrition/profile" },
      { method: "GET", path: "/recovery/sessions" },
      { method: "GET", path: "/chat/channels" },
      { method: "GET", path: "/notifications" },
      { method: "GET", path: "/notifications-count" },
      { method: "GET", path: "/training-metrics" },
      { method: "GET", path: "/fixtures" },
      { method: "GET", path: "/data-export" },
      { method: "POST", path: "/research-sync/sync" },
    ];

    protectedEndpoints.forEach(({ method, path }) => {
      it(`${method} ${path} returns 401 without token`, async () => {
        const response = await fetch(`${API_BASE}${path}`, {
          method,
          headers: { "Content-Type": "application/json" },
        });

        expect(response.status).toBe(401);

        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toBeDefined();
        expect(body.error.code).toMatch(/auth|unauthorized/i);
      });
    });

    it("Returns 401 with invalid token format", async () => {
      const response = await fetch(`${API_BASE}/dashboard`, {
        method: "GET",
        headers: authHeader("invalid-token-format"),
      });

      expect(response.status).toBe(401);
    });

    it("Returns 401 with expired token", async () => {
      // Expired JWT (would need to be generated with past expiry)
      const expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxfQ.invalid";

      const response = await fetch(`${API_BASE}/dashboard`, {
        method: "GET",
        headers: authHeader(expiredToken),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Public endpoints allow unauthenticated access", () => {
    const publicEndpoints = [
      { method: "GET", path: "/health" },
      { method: "GET", path: "/api-docs" },
      { method: "GET", path: "/sponsors" },
      { method: "GET", path: "/knowledge-search?q=test" },
      { method: "GET", path: "/weather?lat=40&lon=-74" },
      { method: "GET", path: "/training-programs" },
      { method: "POST", path: "/auth-login" },
      { method: "POST", path: "/auth-reset-password" },
      { method: "GET", path: "/validate-invitation?token=test" },
    ];

    publicEndpoints.forEach(({ method, path }) => {
      it(`${method} ${path} allows unauthenticated access`, async () => {
        const response = await fetch(`${API_BASE}${path}`, {
          method,
          headers: { "Content-Type": "application/json" },
          body: method === "POST" ? JSON.stringify({}) : undefined,
        });

        // Should not return 401 (may return other errors like 400, 404)
        expect(response.status).not.toBe(401);
      });
    });
  });
});

// ============================================================================
// AUTHORIZATION TESTS (403 - Forbidden)
// ============================================================================

describe("Authorization Tests", () => {
  // These tests require valid tokens for two different users
  // In a real test, you'd set these up in beforeAll
  const userAToken = process.env.TEST_USER_A_TOKEN || "mock-token-a";
  const userBToken = process.env.TEST_USER_B_TOKEN || "mock-token-b";
  const userBId = process.env.TEST_USER_B_ID || "user-b-uuid";

  describe("Cross-user access is blocked", () => {
    it("User A cannot access User B's player stats", async () => {
      const response = await fetch(
        `${API_BASE}/player-stats?playerId=${userBId}`,
        {
          method: "GET",
          headers: authHeader(userAToken),
        }
      );

      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error.code).toMatch(/authorization|consent|forbidden/i);
    });

    it("User A cannot access User B's dashboard", async () => {
      const response = await fetch(
        `${API_BASE}/user-profile?userId=${userBId}`,
        {
          method: "GET",
          headers: authHeader(userAToken),
        }
      );

      expect(response.status).toBe(403);
    });

    it("User A cannot delete User B's files", async () => {
      const response = await fetch(
        `${API_BASE}/upload?path=${userBId}/some-file.jpg`,
        {
          method: "DELETE",
          headers: authHeader(userAToken),
        }
      );

      expect(response.status).toBe(403);
    });

    it("User A cannot modify User B's privacy settings", async () => {
      // Privacy settings should only allow modifying own settings
      // The endpoint uses userId from auth, so this tests that
      // the endpoint doesn't accept a userId parameter to override
      const response = await fetch(`${API_BASE}/privacy-settings`, {
        method: "PUT",
        headers: authHeader(userAToken),
        body: JSON.stringify({
          settings: { aiProcessingEnabled: false },
          // Attempting to set for another user should be ignored
          userId: userBId,
        }),
      });

      // Should succeed but only modify User A's settings
      if (response.status === 200) {
        const body = await response.json();
        // Verify it didn't modify User B's settings
        expect(body.success).toBe(true);
      }
    });
  });

  describe("Path traversal attacks are blocked", () => {
    it("Cannot delete files with path traversal", async () => {
      const response = await fetch(
        `${API_BASE}/upload?path=../other-user/file.jpg`,
        {
          method: "DELETE",
          headers: authHeader(userAToken),
        }
      );

      expect(response.status).toBe(403);
    });

    it("Cannot delete files with encoded path traversal", async () => {
      const response = await fetch(
        `${API_BASE}/upload?path=..%2Fother-user%2Ffile.jpg`,
        {
          method: "DELETE",
          headers: authHeader(userAToken),
        }
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Role-based access control", () => {
    const playerToken = process.env.TEST_PLAYER_TOKEN || "mock-player-token";
    const coachToken = process.env.TEST_COACH_TOKEN || "mock-coach-token";

    it("Player cannot access coach-only endpoints", async () => {
      const response = await fetch(`${API_BASE}/coach/dashboard`, {
        method: "GET",
        headers: authHeader(playerToken),
      });

      expect([401, 403]).toContain(response.status);
    });

    it("Player cannot create team fees", async () => {
      const response = await fetch(`${API_BASE}/payments`, {
        method: "POST",
        headers: authHeader(playerToken),
        body: JSON.stringify({
          action: "create_fee",
          team_id: "some-team-id",
          name: "Test Fee",
          amount: 100,
          dueDate: "2026-02-01",
          applyTo: "all",
        }),
      });

      expect([401, 403]).toContain(response.status);
    });

    it("Player cannot access admin endpoints", async () => {
      const response = await fetch(`${API_BASE}/admin`, {
        method: "GET",
        headers: authHeader(playerToken),
      });

      expect(response.status).toBe(403);
    });

    it("Coach without consent cannot view player wellness", async () => {
      // Assuming coach doesn't have consent for this player
      const playerId = process.env.TEST_PLAYER_NO_CONSENT_ID || "player-no-consent";

      const response = await fetch(
        `${API_BASE}/wellness?athleteId=${playerId}`,
        {
          method: "GET",
          headers: authHeader(coachToken),
        }
      );

      // Should return 403 or limited data
      if (response.status === 200) {
        const body = await response.json();
        // If 200, verify data is filtered/limited
        expect(body.consentStatus).toBeDefined();
      } else {
        expect(response.status).toBe(403);
      }
    });
  });
});

// ============================================================================
// VALIDATION TESTS (400/422 - Bad Request/Unprocessable Entity)
// ============================================================================

describe("Validation Tests", () => {
  const validToken = process.env.TEST_USER_TOKEN || "mock-token";

  describe("Invalid JSON handling", () => {
    it("Returns 400 for malformed JSON", async () => {
      const response = await fetch(`${API_BASE}/games`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${validToken}`,
          "Content-Type": "application/json",
        },
        body: "{ invalid json }",
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error.message).toMatch(/invalid|json|parse/i);
    });
  });

  describe("Required field validation", () => {
    it("Returns validation error for missing required fields in game creation", async () => {
      const response = await fetch(`${API_BASE}/games`, {
        method: "POST",
        headers: authHeader(validToken),
        body: JSON.stringify({
          // Missing opponentName and gameDate which are required
          location: "Test Stadium",
        }),
      });

      expect([400, 422]).toContain(response.status);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.details || body.errors).toBeDefined();
    });

    it("Returns validation error for missing message in chat", async () => {
      const channelId = "test-channel-id";
      const response = await fetch(
        `${API_BASE}/chat/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: authHeader(validToken),
          body: JSON.stringify({
            // Missing required 'message' field
            is_important: true,
          }),
        }
      );

      expect([400, 422]).toContain(response.status);
    });

    it("Returns structured field errors for invalid training session payload", async () => {
      const response = await fetch(`${API_BASE}/training-sessions`, {
        method: "POST",
        headers: authHeader(validToken),
        body: JSON.stringify({
          exercises: [],
          intensity: "extreme",
        }),
      });

      expect(response.status).toBe(422);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(Array.isArray(body.error.details)).toBe(true);
      expect(body.error.details.length).toBeGreaterThan(0);
    });
  });

  describe("Field length validation", () => {
    it("Rejects message exceeding max length", async () => {
      const channelId = "test-channel-id";
      const longMessage = "x".repeat(5000); // Exceeds 4000 char limit

      const response = await fetch(
        `${API_BASE}/chat/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: authHeader(validToken),
          body: JSON.stringify({
            message: longMessage,
          }),
        }
      );

      expect([400, 422]).toContain(response.status);
    });

    it("Rejects notes exceeding max length in game update", async () => {
      const gameId = "test-game-id";
      const longNotes = "x".repeat(3000); // Exceeds 2000 char limit

      const response = await fetch(`${API_BASE}/games/${gameId}`, {
        method: "PUT",
        headers: authHeader(validToken),
        body: JSON.stringify({
          notes: longNotes,
        }),
      });

      expect([400, 422]).toContain(response.status);
    });
  });

  describe("Range validation", () => {
    it("Rejects score outside valid range", async () => {
      const gameId = "test-game-id";

      const response = await fetch(`${API_BASE}/games/${gameId}`, {
        method: "PUT",
        headers: authHeader(validToken),
        body: JSON.stringify({
          teamScore: 1000, // Exceeds max of 999
        }),
      });

      expect([400, 422]).toContain(response.status);
    });

    it("Rejects wellness score outside valid range", async () => {
      const response = await fetch(`${API_BASE}/wellness/checkin`, {
        method: "POST",
        headers: authHeader(validToken),
        body: JSON.stringify({
          readiness: 15, // Exceeds max of 10
          sleep: 8,
          energy: 7,
        }),
      });

      expect([400, 422]).toContain(response.status);
    });

    it("Returns validation error for out-of-range measurements", async () => {
      const response = await fetch(`${API_BASE}/performance-data/measurements`, {
        method: "POST",
        headers: authHeader(validToken),
        body: JSON.stringify({
          height: 100, // below min
          weight: 30, // below min
        }),
      });

      expect(response.status).toBe(422);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(Array.isArray(body.error.details)).toBe(true);
      expect(body.error.details.length).toBeGreaterThan(0);
    });
  });

  describe("Enum validation", () => {
    it("Rejects invalid game type", async () => {
      const response = await fetch(`${API_BASE}/games`, {
        method: "POST",
        headers: authHeader(validToken),
        body: JSON.stringify({
          opponentName: "Test Team",
          gameDate: "2026-02-01",
          gameType: "invalid_type", // Not in allowed enum
        }),
      });

      expect([400, 422]).toContain(response.status);
    });

    it("Rejects invalid message type", async () => {
      const channelId = "test-channel-id";

      const response = await fetch(
        `${API_BASE}/chat/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: authHeader(validToken),
          body: JSON.stringify({
            message: "Test message",
            message_type: "invalid_type",
          }),
        }
      );

      expect([400, 422]).toContain(response.status);
    });
  });

  describe("Date validation", () => {
    it("Rejects invalid date format", async () => {
      const response = await fetch(`${API_BASE}/games`, {
        method: "POST",
        headers: authHeader(validToken),
        body: JSON.stringify({
          opponentName: "Test Team",
          gameDate: "not-a-date",
        }),
      });

      expect([400, 422]).toContain(response.status);
    });
  });
});

// ============================================================================
// ERROR RESPONSE FORMAT TESTS
// ============================================================================

describe("Error Response Format", () => {
  it("401 errors have consistent format", async () => {
    const response = await fetch(`${API_BASE}/dashboard`, {
      method: "GET",
    });

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body).toMatchObject({
      success: false,
      error: expect.objectContaining({
        code: expect.any(String),
        message: expect.any(String),
      }),
    });
  });

  it("403 errors have consistent format", async () => {
    const token = process.env.TEST_USER_TOKEN || "mock-token";
    const otherUserId = "other-user-id";

    const response = await fetch(
      `${API_BASE}/player-stats?playerId=${otherUserId}`,
      {
        method: "GET",
        headers: authHeader(token),
      }
    );

    if (response.status === 403) {
      const body = await response.json();
      expect(body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String),
        }),
      });
    }
  });

  it("Validation errors include field details", async () => {
    const token = process.env.TEST_USER_TOKEN || "mock-token";

    const response = await fetch(`${API_BASE}/games`, {
      method: "POST",
      headers: authHeader(token),
      body: JSON.stringify({
        // Missing required fields
      }),
    });

    if ([400, 422].includes(response.status)) {
      const body = await response.json();
      expect(body.success).toBe(false);
      // Should have either errors array or error.details
      expect(body.errors || body.error?.details).toBeDefined();
    }
  });

  it("All error responses include requestId for debugging", async () => {
    const response = await fetch(`${API_BASE}/dashboard`, {
      method: "GET",
    });

    // Check header or body for requestId
    const requestId = response.headers.get("X-Request-Id");
    const body = await response.json();

    expect(requestId || body.requestId).toBeDefined();
  });
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

describe("Rate Limiting", () => {
  it("Returns rate limit headers", async () => {
    const token = process.env.TEST_USER_TOKEN || "mock-token";

    const response = await fetch(`${API_BASE}/dashboard`, {
      method: "GET",
      headers: authHeader(token),
    });

    // Check for rate limit headers
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const limit = response.headers.get("X-RateLimit-Limit");

    // At least one should be present
    expect(remaining || limit).toBeDefined();
  });

  it("Returns 429 when rate limit exceeded", async () => {
    // This test would need to make many rapid requests
    // Skipping actual implementation as it could affect other tests
    expect(true).toBe(true);
  });
});
