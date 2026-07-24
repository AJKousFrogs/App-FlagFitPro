import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  applyRateLimit: vi.fn(),
  getRateLimitHeaders: vi.fn(),
  checkEnvVars: vi.fn(),
  getSupabaseClient: vi.fn(),
  runWithAuthContext: vi.fn(),
  getEntitlement: vi.fn(),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  authenticateRequest: mocks.authenticateRequest,
}));

vi.mock("../../netlify/functions/utils/rate-limiter.js", () => ({
  applyRateLimit: mocks.applyRateLimit,
  getRateLimitHeaders: mocks.getRateLimitHeaders,
}));

vi.mock("../../netlify/functions/utils/supabase-client.js", () => ({
  checkEnvVars: mocks.checkEnvVars,
  getSupabaseClient: mocks.getSupabaseClient,
  runWithAuthContext: mocks.runWithAuthContext,
}));

vi.mock("../../netlify/functions/utils/entitlements.js", () => ({
  getEntitlement: mocks.getEntitlement,
}));

import { baseHandler } from "../../netlify/functions/utils/base-handler.js";

describe("baseHandler", () => {
  let originalNetlifyDev;
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    originalNetlifyDev = process.env.NETLIFY_DEV;
    process.env.NETLIFY_DEV = "true";

    mocks.authenticateRequest.mockResolvedValue({
      success: true,
      token: "token-123",
      user: { id: "user-123", email: "player@example.com" },
    });
    mocks.applyRateLimit.mockReturnValue(null);
    mocks.getRateLimitHeaders.mockReturnValue({
      "X-RateLimit-Limit": "200",
      "X-RateLimit-Remaining": "199",
    });
    mocks.getSupabaseClient.mockImplementation((token) => ({ token }));
    mocks.runWithAuthContext.mockImplementation(async (_token, fn) => fn());
    mocks.getEntitlement.mockResolvedValue({ locked: false });

    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalNetlifyDev === undefined) {
      delete process.env.NETLIFY_DEV;
    } else {
      process.env.NETLIFY_DEV = originalNetlifyDev;
    }

    vi.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("uses authenticated user IDs for rate limiting and fills missing headers", async () => {
    const event = {
      httpMethod: "GET",
      path: "/api/dashboard",
      headers: {
        origin: "http://localhost:8888",
        "x-forwarded-for": "203.0.113.10",
      },
    };

    const response = await baseHandler(
      event,
      {},
      {
        functionName: "dashboard",
        handler: async () => ({
          statusCode: 200,
          body: JSON.stringify({ success: true, data: [] }),
        }),
      },
    );

    expect(mocks.applyRateLimit).toHaveBeenCalledWith(
      event,
      "READ",
      "user-123",
    );
    expect(response.statusCode).toBe(200);
    expect(response.headers["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:8888",
    );
    expect(response.headers["X-Function-Name"]).toBe("dashboard");
    expect(response.headers["X-RateLimit-Limit"]).toBe("200");
    expect(response.headers["X-RateLimit-Remaining"]).toBe("199");
    expect(response.headers["X-Request-Id"]).toMatch(/^req_/);
  });

  it("adds request metadata to authentication failures", async () => {
    mocks.authenticateRequest.mockResolvedValueOnce({
      success: false,
      error: {
        statusCode: 401,
        headers: {},
        body: JSON.stringify({
          success: false,
          error: {
            code: "authentication_error",
            message: "Authorization token required",
          },
        }),
      },
    });

    const response = await baseHandler(
      {
        httpMethod: "GET",
        path: "/api/dashboard",
        headers: { origin: "http://localhost:4200" },
      },
      {},
      {
        functionName: "dashboard",
        handler: async () => ({
          statusCode: 200,
          body: JSON.stringify({ success: true }),
        }),
      },
    );

    expect(mocks.applyRateLimit).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(401);
    expect(response.headers["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:4200",
    );
    expect(response.headers["X-Request-Id"]).toMatch(/^req_/);
  });

  describe("entitlement freeze gate", () => {
    const mutatingEvent = (method) => ({
      httpMethod: method,
      path: "/api/training-sessions",
      headers: { origin: "http://localhost:4200" },
    });

    it("blocks a mutating request with 402 when the caller is locked", async () => {
      mocks.getEntitlement.mockResolvedValue({ locked: true });
      const handler = vi.fn(async () => ({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      }));

      const response = await baseHandler(
        mutatingEvent("POST"),
        {},
        { functionName: "training-sessions", allowedMethods: ["POST"], handler },
      );

      expect(handler).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(402);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe("subscription_required");
    });

    it("allows a mutating request through when the caller is not locked", async () => {
      mocks.getEntitlement.mockResolvedValue({ locked: false });
      const handler = vi.fn(async () => ({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      }));

      const response = await baseHandler(
        mutatingEvent("POST"),
        {},
        { functionName: "training-sessions", allowedMethods: ["POST"], handler },
      );

      expect(handler).toHaveBeenCalledOnce();
      expect(response.statusCode).toBe(200);
    });

    it("never checks entitlement for a GET request (locked callers can still read their own data)", async () => {
      mocks.getEntitlement.mockResolvedValue({ locked: true });
      const handler = vi.fn(async () => ({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      }));

      const response = await baseHandler(
        mutatingEvent("GET"),
        {},
        { functionName: "training-sessions", allowedMethods: ["GET"], handler },
      );

      expect(mocks.getEntitlement).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalledOnce();
      expect(response.statusCode).toBe(200);
    });

    it("skips the freeze gate for endpoints that opt out via bypassEntitlementLock", async () => {
      mocks.getEntitlement.mockResolvedValue({ locked: true });
      const handler = vi.fn(async () => ({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      }));

      const response = await baseHandler(
        mutatingEvent("POST"),
        {},
        {
          functionName: "stripe-checkout",
          allowedMethods: ["POST"],
          bypassEntitlementLock: true,
          handler,
        },
      );

      expect(mocks.getEntitlement).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalledOnce();
      expect(response.statusCode).toBe(200);
    });

    it("skips the freeze gate for an unauthenticated (requireAuth: false) endpoint", async () => {
      const handler = vi.fn(async () => ({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      }));

      const response = await baseHandler(
        mutatingEvent("POST"),
        {},
        {
          functionName: "auth-login",
          allowedMethods: ["POST"],
          requireAuth: false,
          handler,
        },
      );

      expect(mocks.getEntitlement).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalledOnce();
      expect(response.statusCode).toBe(200);
    });
  });
});
