import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => {
  const fakeSupabase = {
    from: () => ({
      select() {
        return this;
      },
      eq() {
        return this;
      },
      order() {
        return this;
      },
      limit() {
        return this;
      },
      lte() {
        return this;
      },
      gte() {
        return this;
      },
      then(resolve, reject) {
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      },
    }),
  };
  return {
    baseHandler: async (event, context, options) =>
      options.handler(event, context, { userId: "user-1", supabase: fakeSupabase }),
  };
});

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  requireAuthorization: async () => ({ success: true }),
  getUserRole: async () => "player",
  logViolation: async () => {},
}));

vi.mock("../../netlify/functions/utils/merlin-guard.js", () => ({
  guardMerlinRequest: () => null,
}));

vi.mock("../../netlify/functions/utils/session-state-helper.js", () => ({
  prepareStateTransition: ({ newState, metadata }) => ({
    session_state: newState,
    metadata: metadata || {},
  }),
}));

vi.mock("../../netlify/functions/utils/input-validator.js", () => ({
  validateInput: (payload, schema) => {
    const errors = [];
    for (const [key, rule] of Object.entries(schema)) {
      const val = payload[key];
      if (rule.required && (val === undefined || val === null || val === "")) {
        errors.push(`${key} is required`);
      }
      if (val !== undefined && rule.type === "number" && typeof val !== "number") {
        errors.push(`${key} must be number`);
      }
      if (val !== undefined && rule.type === "date" && Number.isNaN(new Date(val).getTime())) {
        errors.push(`${key} must be date`);
      }
      if (val !== undefined && rule.type === "enum" && !rule.values.includes(val)) {
        errors.push(`${key} must be one of ${rule.values.join(", ")}`);
      }
    }
    return { valid: errors.length === 0, errors, cleaned: payload };
  },
}));

describe("training-sessions update validation hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/training-sessions.js");
    handler = mod.handler;
  });

  it("rejects update payloads with only forbidden fields", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/training-sessions",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          sessionId: "session-1",
          user_id: "other-user",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects non-object PUT payloads with 422", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/training-sessions",
        headers: { authorization: "Bearer test-token" },
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects malformed GET limit query with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/training-sessions",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "10sessions" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
