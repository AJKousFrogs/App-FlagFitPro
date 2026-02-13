import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  insertError: false,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "minor-1",
      supabase: {
        from: (table) => {
          if (table === "users") {
            return {
              select: () => ({
                eq: () => ({
                  single: async () => ({ data: { date_of_birth: "2012-01-01" }, error: null }),
                }),
              }),
            };
          }
          if (table === "parental_consent") {
            return {
              select: () => ({
                eq: () => ({
                  in: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: async () => ({ data: null, error: null }),
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: null, error: null }),
              }),
            }),
          };
        },
      },
    }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { date_of_birth: "2012-01-01" }, error: null }),
            }),
          }),
        };
      }
      if (table === "parental_consent") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () =>
                state.insertError
                  ? { data: null, error: { message: "sensitive relation detail" } }
                  : { data: { id: "consent-1" }, error: null },
            }),
          }),
        };
      }
      return {
        insert: async () => ({ data: { id: "audit-1" }, error: null }),
      };
    },
  },
}));

const buildEvent = (payload) => ({
  httpMethod: "PUT",
  path: "/api/parental-consent",
  headers: {},
  body: JSON.stringify(payload),
  queryStringParameters: {},
});

describe("parental-consent public verification validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.insertError = false;
    const mod = await import("../../netlify/functions/parental-consent.js");
    handler = mod.handler;
  });

  it("rejects invalid token format with 400", async () => {
    const response = await handler(
      buildEvent({
        token: "short-token",
        action: "approve",
      }),
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("rejects invalid action with 422 validation semantics", async () => {
    const response = await handler(
      buildEvent({
        token: "a".repeat(64),
        action: "archive",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects non-boolean consent flags with 422 validation semantics", async () => {
    const response = await handler(
      buildEvent({
        token: "b".repeat(64),
        action: "approve",
        healthDataConsent: "yes",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects non-object payloads with 422", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/api/parental-consent",
        headers: {},
        body: "[]",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid revoke reason type with 422", async () => {
    const response = await handler(
      buildEvent({
        token: "c".repeat(64),
        action: "revoke",
        reason: 123,
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when consent request insert fails", async () => {
    state.insertError = true;
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/api/parental-consent",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ guardianEmail: "guardian@example.com" }),
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toBe("Failed to create consent request");
    expect(JSON.stringify(payload)).not.toContain("sensitive relation detail");
  });
});
