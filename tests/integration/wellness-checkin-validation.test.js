import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getError: null,
  upsertError: null,
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
    eq() {
      return this;
    }
    order() {
      return this;
    }
    limit() {
      return this;
    }
    maybeSingle() {
      return Promise.resolve({ data: null, error: null });
    }
    single() {
      if (this.table === "daily_wellness_checkin" && this.mode === "select") {
        return Promise.resolve({ data: null, error: state.getError });
      }
      if (this.table === "daily_wellness_checkin" && this.mode === "upsert-select") {
        return Promise.resolve({ data: null, error: state.upsertError });
      }
      return Promise.resolve({ data: null, error: null });
    }
    upsert() {
      this.mode = "upsert";
      return this;
    }
    insert() {
      return Promise.resolve({ data: null, error: null });
    }
    rpc() {
      return Promise.resolve({ data: null, error: null });
    }
    then(resolve) {
      resolve({ data: [], error: null });
    }
  }

  return {
    from(table) {
      const q = new Query(table);
      if (table === "daily_wellness_checkin") {
        const originalSelect = q.select.bind(q);
        q.select = () => {
          if (q.mode === "upsert") {
            q.mode = "upsert-select";
          } else {
            q.mode = "select";
          }
          return originalSelect();
        };
      }
      return q;
    },
    rpc() {
      return Promise.resolve({ data: null, error: null });
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: vi.fn().mockResolvedValue("player"),
}));

vi.mock("../../netlify/functions/utils/consent-guard.js", () => ({
  canCoachViewWellness: vi.fn().mockResolvedValue({ allowed: false }),
  filterWellnessDataForCoach: vi.fn((x) => x),
}));

vi.mock("../../netlify/functions/utils/safety-override.js", () => ({
  detectPainTrigger: vi.fn(),
}));

describe("wellness-checkin error sanitization", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.getError = null;
    state.upsertError = null;
    ({ handler } = await import("../../netlify/functions/wellness-checkin.js"));
  });

  it("returns sanitized 500 when check-in query fails", async () => {
    state.getError = { code: "XX001", message: "sensitive db detail" };
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/wellness-checkin",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to retrieve wellness check-in");
    expect(body.error.details).toBeFalsy();
  });

  it("returns sanitized 500 when saving check-in fails", async () => {
    state.upsertError = { message: "sensitive write detail" };
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/wellness-checkin",
        body: JSON.stringify({
          sleepQuality: 8,
          energyLevel: 7,
          muscleSoreness: 2,
          stressLevel: 3,
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to save wellness check-in");
    expect(body.error.details).toBeFalsy();
  });
});
