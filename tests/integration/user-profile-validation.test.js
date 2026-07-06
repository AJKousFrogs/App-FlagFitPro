import { beforeEach, describe, expect, it, vi } from "vitest";

// user-profile-core reads via the shared supabaseAdmin client (the old direct
// `pg` Pool was removed — DATABASE_URL isn't set in this deployment), so the
// mock is a chainable Supabase query builder, not a pg Pool.

const state = vi.hoisted(() => ({
  role: "player",
  usersRow: null,
  usersError: null,
  calls: [],
}));

function createQuery(table) {
  const call = { table, filters: [] };
  state.calls.push(call);

  const result = () => {
    if (table === "users") {
      if (state.usersError) {
        return { data: null, error: state.usersError };
      }
      return { data: state.usersRow, error: null };
    }
    return { data: [], error: null };
  };

  const query = {
    select: () => query,
    eq: (field, value) => {
      call.filters.push({ field, value });
      return query;
    },
    in: () => query,
    gte: () => query,
    order: () => query,
    limit: () => query,
    maybeSingle: () => Promise.resolve(result()),
    single: () => Promise.resolve(result()),
    then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
  };
  return query;
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "user-1",
      requestId: "req-test",
    }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => state.role,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: {
    from: (table) => createQuery(table),
  },
}));

describe("user-profile authorization and error hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.role = "player";
    state.usersRow = null;
    state.usersError = null;
    state.calls = [];
    const mod = await import("../../netlify/functions/user-profile.js");
    handler = mod.handler;
  });

  it("returns 403 for cross-user access when caller is not admin", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/user-profile",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { userId: "user-2" },
      },
      {},
    );

    expect(response.statusCode).toBe(403);
    expect(state.calls.length).toBe(0);
  });

  it("allows admin to access another user's profile", async () => {
    state.role = "admin";
    state.usersRow = {
      id: "user-2",
      height_cm: 180,
      weight_kg: 80,
      position: "QB",
      birth_date: "2000-01-01",
      date_of_birth: null,
      experience_level: "advanced",
    };

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/user-profile",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { userId: "user-2" },
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const usersCall = state.calls.find((c) => c.table === "users");
    expect(usersCall.filters).toContainEqual({ field: "id", value: "user-2" });
    const body = JSON.parse(response.body);
    expect(body.data.userId).toBe("user-2");
  });

  it("returns sanitized 500 when database query fails", async () => {
    state.usersError = new Error("sensitive connection details");

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/user-profile",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to retrieve user profile");
    expect(body.error.details).toBeFalsy();
    expect(JSON.stringify(body)).not.toContain("sensitive connection details");
  });
});
