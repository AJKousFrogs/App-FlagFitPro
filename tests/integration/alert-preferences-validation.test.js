import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: [],
}));

function createQuery(table) {
  const call = { filters: {} };
  const resolve = () => {
    if (table === "alert_preferences") {
      if (call.method === "upsert") {
        state.rows = call.payload.map((row, i) => ({
          id: state.rows[i]?.id || `pref-${i + 1}`,
          ...row,
        }));
        return { data: state.rows, error: null };
      }
      return { data: state.rows, error: null };
    }
    return { data: null, error: null };
  };

  const query = {
    select: () => query,
    eq: (field, value) => {
      call.filters[field] = value;
      return query;
    },
    upsert: (payload, opts) => {
      call.method = "upsert";
      call.payload = payload;
      call.opts = opts;
      return query;
    },
    then: (resolve_, reject) => Promise.resolve(resolve()).then(resolve_, reject),
  };
  return query;
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "athlete-1" }),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  getSupabaseClient: () => ({
    from: (table) => createQuery(table),
  }),
}));

describe("alert-preferences", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.rows = [];
    const mod = await import("../../netlify/functions/alert-preferences.js");
    handler = mod.handler;
  });

  it("returns defaults for all 4 alert types when the user has no rows yet", async () => {
    const response = await handler(
      { httpMethod: "GET", path: "/api/alert-preferences", headers: {} },
      {},
    );
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toHaveLength(4);
    const critical = body.data.find((p) => p.alert_type === "critical");
    expect(critical.enabled).toBe(true);
    expect(critical.channels).toEqual(["in_app", "push"]);
    const low = body.data.find((p) => p.alert_type === "low");
    expect(low.enabled).toBe(false);
  });

  it("merges existing rows over defaults", async () => {
    state.rows = [
      { id: "p1", user_id: "athlete-1", alert_type: "low", enabled: true, channels: ["in_app"] },
    ];
    const response = await handler(
      { httpMethod: "GET", path: "/api/alert-preferences", headers: {} },
      {},
    );
    const body = JSON.parse(response.body);
    const low = body.data.find((p) => p.alert_type === "low");
    expect(low.enabled).toBe(true);
  });

  it("upserts preferences, forcing user_id from the authenticated caller", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/api/alert-preferences",
        headers: {},
        body: JSON.stringify({
          preferences: [
            { user_id: "someone-else", alert_type: "critical", enabled: false, channels: ["email"] },
          ],
        }),
      },
      {},
    );
    expect(response.statusCode).toBe(200);
    expect(state.rows[0].user_id).toBe("athlete-1");
    expect(state.rows[0].enabled).toBe(false);
    expect(state.rows[0].channels).toEqual(["email"]);
  });

  it("rejects an invalid alert_type", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/api/alert-preferences",
        headers: {},
        body: JSON.stringify({
          preferences: [{ alert_type: "urgent" }],
        }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("rejects an invalid channel", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/api/alert-preferences",
        headers: {},
        body: JSON.stringify({
          preferences: [{ alert_type: "critical", channels: ["carrier_pigeon"] }],
        }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("rejects an empty preferences array", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/api/alert-preferences",
        headers: {},
        body: JSON.stringify({ preferences: [] }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid JSON", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/api/alert-preferences",
        headers: {},
        body: "{not json",
      },
      {},
    );
    expect(response.statusCode).toBe(400);
  });
});
