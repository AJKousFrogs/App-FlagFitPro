import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  searchError: null,
  statusError: null,
  upsertError: null,
}));
const fetchMock = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", fetchMock);

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  authenticateRequest: async () => ({ success: true, user: { id: "admin-1" } }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => "admin",
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "usda_foods") {
        const queryState = { mode: null };
        return {
          select(columns, options) {
            if (options?.head) {
              queryState.mode = "count";
            } else {
              queryState.mode = columns === "data_type" ? "status" : "search";
            }
            return this;
          },
          upsert(payload) {
            return {
              select: async () =>
                state.upsertError
                  ? { data: null, error: state.upsertError }
                  : {
                      data: (Array.isArray(payload) ? payload : [payload]).map(
                        (_row, index) => ({ id: `food-${index + 1}` }),
                      ),
                      error: null,
                    },
            };
          },
          eq() {
            return this;
          },
          ilike() {
            return this;
          },
          order() {
            return this;
          },
          range() {
            return this;
          },
          then(resolve) {
            if (queryState.mode === "count") {
              resolve({ data: null, count: 0, error: null });
              return;
            }
            if (queryState.mode === "status") {
              resolve({ data: [], count: 0, error: state.statusError });
              return;
            }
            resolve({ data: [], error: state.searchError, count: 0 });
          },
        };
      }

      if (table === "sync_logs") {
        const queryState = { single: false };
        return {
          select() {
            return this;
          },
          insert: async () => ({ data: { id: "log-1" }, error: null }),
          eq() {
            return this;
          },
          order() {
            return this;
          },
          limit() {
            return this;
          },
          single: async () => {
            queryState.single = true;
            return { data: null, error: null };
          },
          then(resolve) {
            resolve({ data: [], error: null });
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  },
}));

describe("usda-sync validation and sanitization", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.searchError = null;
    state.statusError = null;
    state.upsertError = null;
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [],
      text: async () => "",
    });
    process.env.USDA_API_KEY = "test-key";
    ({ handler } = await import("../../netlify/functions/usda-sync.js"));
  });

  it("returns 422 for invalid search limit", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/usda-sync/search",
        queryStringParameters: { q: "apple", limit: "abc" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns sanitized 500 when search query fails", async () => {
    state.searchError = { message: "sensitive db plan details" };
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/usda-sync/search",
        queryStringParameters: { q: "apple" },
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Failed to search USDA foods");
  });

  it("returns sanitized 500 when status query fails", async () => {
    state.statusError = { message: "sensitive status query detail" };
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/usda-sync/status",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe("Failed to retrieve USDA sync status");
  });

  it("falls back to default sync options for malformed POST JSON", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/usda-sync",
        headers: { authorization: "Bearer test-token" },
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/foods/list?"),
    );
  });

  it("treats null POST JSON body like an empty sync payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/usda-sync",
        headers: { authorization: "Bearer test-token" },
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });
});
