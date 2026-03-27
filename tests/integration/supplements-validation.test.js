import { beforeEach, describe, expect, it, vi } from "vitest";

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.payload = null;
      this.filters = [];
      this.limitValue = null;
    }

    select() {
      return this;
    }

    insert(payload) {
      this.mode = "insert";
      this.payload = payload;
      return this;
    }

    eq(field, value) {
      this.filters.push({ type: "eq", field, value });
      return this;
    }

    gte() {
      return this;
    }

    order() {
      return this;
    }

    limit(value) {
      this.limitValue = value;
      return this;
    }

    single() {
      return Promise.resolve(this.runSingle());
    }

    then(resolve, reject) {
      return Promise.resolve(this.runList()).then(resolve, reject);
    }

    runSingle() {
      if (this.table === "supplement_logs" && this.mode === "insert") {
        return {
          data: {
            id: "log-1",
            supplement_name: this.payload.supplement_name,
            dosage: this.payload.dosage,
            date: this.payload.date,
            notes: this.payload.notes,
            created_at: "2026-02-13T00:00:00.000Z",
          },
          error: null,
        };
      }

      return { data: null, error: null };
    }

    runList() {
      if (this.table === "supplement_logs") {
        return {
          data: [
            {
              id: "log-2",
              supplement_name: "Creatine",
              dosage: "5",
              date: "2026-02-13",
              notes: null,
            },
          ],
          error: null,
        };
      }

      if (this.table === "user_supplements") {
        return { data: [], error: null };
      }

      return { data: [], error: null };
    }
  }

  return {
    from(table) {
      return new Query(table);
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "athlete-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: createFakeSupabase(),
}));

describe("supplements validation and mapping", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    ({ handler } = await import("../../netlify/functions/supplements.js"));
  });

  it("returns 422 for invalid logs limit", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/supplements/logs",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "bad" },
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toContain("limit must be an integer between 1 and 200");
  });

  it("returns normalized fields for supplement log create", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/supplements/log",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          supplement: "Creatine",
          dose: 5,
          takenAt: "2026-02-13T08:00:00.000Z",
          notes: "post-workout",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(201);
    const payload = JSON.parse(response.body);
    expect(payload.data.supplement).toBe("Creatine");
    expect(payload.data.dose).toBe("5");
    expect(payload.data.takenAt).toBe("2026-02-13");
  });
});
