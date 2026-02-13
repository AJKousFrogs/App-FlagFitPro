import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCtx = vi.hoisted(() => ({
  hasStaffAccess: true,
  throwFromError: false,
}));

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
    }

    select() {
      return this;
    }

    insert() {
      this.mode = "insert";
      return this;
    }

    eq() {
      return this;
    }

    in() {
      return this;
    }

    limit() {
      return this;
    }

    order() {
      return this;
    }

    range() {
      return this;
    }

    single() {
      return Promise.resolve(this.runSingle());
    }

    then(resolve, reject) {
      return Promise.resolve(this.runList()).then(resolve, reject);
    }

    runSingle() {
      if (this.table === "team_members") {
        if (!mockCtx.hasStaffAccess) {
          return { data: null, error: null };
        }
        return {
          data: {
            role: "coach",
            team_id: "team-1",
            users: { full_name: "Coach One" },
          },
          error: null,
        };
      }

      if (this.table === "decision_ledger" && this.mode === "insert") {
        return { data: { id: "decision-1" }, error: null };
      }

      return { data: null, error: null };
    }

    runList() {
      if (this.table === "decision_ledger") {
        return { data: [], error: null };
      }
      return { data: [], error: null };
    }
  }

  return {
    from(table) {
      if (mockCtx.throwFromError) {
        throw new Error("sensitive connection fingerprint");
      }
      return new Query(table);
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

vi.mock("../../netlify/functions/utils/merlin-guard.js", () => ({
  guardMerlinRequest: () => null,
}));

describe("decisions validation and authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockCtx.hasStaffAccess = true;
    mockCtx.throwFromError = false;
    const mod = await import("../../netlify/functions/decisions.js");
    handler = mod.handler;
  });

  it("returns 403 when requester is not staff", async () => {
    mockCtx.hasStaffAccess = false;
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/decisions",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns 422 for malformed decisions list limit query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/decisions",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "20rows" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 400 for invalid JSON body", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/decisions",
        headers: { authorization: "Bearer test-token" },
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 422 for non-object JSON body", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/decisions",
        headers: { authorization: "Bearer test-token" },
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 for unexpected internal failures", async () => {
    mockCtx.throwFromError = true;
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/decisions",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toBe("Internal server error");
    expect(JSON.stringify(payload)).not.toContain("sensitive connection fingerprint");
  });
});
