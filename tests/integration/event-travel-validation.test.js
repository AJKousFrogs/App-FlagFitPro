import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

const state = vi.hoisted(() => ({ rows: [{ id: "leg-1", user_id: "user-1" }] }));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: () => {
      const q = {
        select: () => q,
        eq: () => q,
        gte: () => q,
        lte: () => q,
        order: () => Promise.resolve({ data: state.rows, error: null }),
        insert: (row) => {
          state.rows = [{ id: "leg-new", user_id: "user-1", ...row }];
          return q;
        },
        update: (row) => {
          state.rows = [{ ...state.rows[0], ...row }];
          return q;
        },
        delete: () => q,
        single: () => Promise.resolve({ data: state.rows[0], error: null }),
        maybeSingle: () => Promise.resolve({ data: state.rows[0], error: null }),
      };
      return q;
    },
  },
}));

const req = (method, body, path = "/.netlify/functions/event-travel") => ({
  httpMethod: method,
  path,
  headers: { authorization: "Bearer t" },
  queryStringParameters: {},
  body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
});

describe("event-travel validation", () => {
  let handler;
  beforeEach(async () => {
    vi.resetModules();
    state.rows = [{ id: "leg-1", user_id: "user-1" }];
    ({ handler } = await import("../../netlify/functions/event-travel.js"));
  });

  it("GET lists the caller's travel legs", async () => {
    const res = await handler(req("GET"), {});
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.legs).toHaveLength(1);
  });

  it("returns 422 for malformed JSON on POST", async () => {
    const res = await handler(req("POST", "{"), {});
    expect(res.statusCode).toBe(422);
  });

  it("rejects an invalid mode", async () => {
    const res = await handler(
      req("POST", {
        mode: "rocket",
        departAt: "2026-07-03T08:00:00Z",
        arriveAt: "2026-07-03T12:00:00Z",
      }),
      {},
    );
    expect(res.statusCode).toBe(422);
  });

  it("rejects a missing departAt", async () => {
    const res = await handler(req("POST", { mode: "car", arriveAt: "2026-07-03T12:00:00Z" }), {});
    expect(res.statusCode).toBe(422);
  });

  it("rejects arriveAt before departAt", async () => {
    const res = await handler(
      req("POST", {
        mode: "car",
        departAt: "2026-07-03T12:00:00Z",
        arriveAt: "2026-07-03T08:00:00Z",
      }),
      {},
    );
    expect(res.statusCode).toBe(422);
  });

  it("rejects an out-of-range timezoneDeltaHours", async () => {
    const res = await handler(
      req("POST", {
        mode: "plane",
        departAt: "2026-07-03T08:00:00Z",
        arriveAt: "2026-07-03T12:00:00Z",
        timezoneDeltaHours: 20,
      }),
      {},
    );
    expect(res.statusCode).toBe(422);
  });

  it("creates a valid travel leg", async () => {
    const res = await handler(
      req("POST", {
        mode: "bus",
        departAt: "2026-07-03T08:00:00Z",
        arriveAt: "2026-07-03T12:00:00Z",
      }),
      {},
    );
    expect(res.statusCode).toBe(201);
  });

  it("rejects an out-of-range adaptationDay", async () => {
    const res = await handler(
      req("POST", {
        mode: "plane",
        departAt: "2026-07-03T08:00:00Z",
        arriveAt: "2026-07-03T20:00:00Z",
        adaptationDay: -1,
      }),
      {},
    );
    expect(res.statusCode).toBe(422);
  });

  it("accepts adaptationDay and timezoneDeltaHours together (long-haul international trip)", async () => {
    const res = await handler(
      req("POST", {
        mode: "plane",
        departAt: "2026-07-03T08:00:00Z",
        arriveAt: "2026-07-04T02:00:00Z",
        timezoneDeltaHours: 11,
        adaptationDay: 0,
      }),
      {},
    );
    expect(res.statusCode).toBe(201);
  });

  it("DELETE without an id returns 400", async () => {
    const res = await handler(req("DELETE"), {});
    expect(res.statusCode).toBe(400);
  });

  it("DELETE removes a leg by id", async () => {
    const res = await handler(req("DELETE", undefined, "/.netlify/functions/event-travel/leg-1"), {});
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.deleted).toBe(true);
  });

  it("PATCH updates a leg", async () => {
    const res = await handler(
      req("PATCH", { overnightStay: true }, "/.netlify/functions/event-travel/leg-1"),
      {},
    );
    expect(res.statusCode).toBe(200);
  });
});
