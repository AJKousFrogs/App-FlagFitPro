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

    upsert(payload) {
      this.mode = "upsert";
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

      if (this.table === "user_supplements" && this.mode === "upsert") {
        return { data: { id: "stack-1", ...this.payload }, error: null };
      }

      return { data: null, error: null };
    }

    runList() {
      if (this.table === "supplement_logs" && this.mode === "upsert") {
        const rows = Array.isArray(this.payload)
          ? this.payload
          : [this.payload];
        return {
          data: rows.map((r, i) => ({ id: `log-${i + 1}`, ...r })),
          error: null,
        };
      }

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
    options.handler(event, context, {
      userId: "athlete-1",
      requestId: "req-test",
    }),
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
    expect(payload.error?.message).toContain(
      "limit must be an integer between 1 and 200",
    );
  });

  it("returns normalized fields for legacy single supplement log (now idempotent upsert)", async () => {
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
    expect(payload.data.dosage).toBe("5");
    expect(payload.data.taken).toBe(true);
    expect(payload.data.date).toBe("2026-02-13");
  });

  it("upserts a batch daily log (POST /api/supplements) and echoes taken/timing", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/supplements",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          date: "2026-02-13",
          supplements: [
            { name: "Creatine", taken: true, dosage: "5 g" },
            {
              name: "Caffeine",
              taken: false,
              dosage: "200 mg",
              timeOfDay: "pre-session",
            },
          ],
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.logged).toBe(2);
    expect(payload.data.date).toBe("2026-02-13");
    expect(payload.data.supplements[0]).toMatchObject({
      supplement: "Creatine",
      taken: true,
    });
    expect(payload.data.supplements[1]).toMatchObject({
      supplement: "Caffeine",
      taken: false,
      timeOfDay: "pre-session",
    });
  });

  it("adds a supplement to the athlete's stack (POST /api/supplements/stack)", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/supplements/stack",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          name: "Vitamin D",
          dosage: "2000 IU",
          timing: "morning",
          category: "micronutrient",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(201);
    const payload = JSON.parse(response.body);
    expect(payload.data).toMatchObject({
      name: "Vitamin D",
      dosage: "2000 IU",
      timing: "morning",
      category: "micronutrient",
      active: true,
    });
  });

  it("rejects a daily log with a missing supplement name (422)", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/supplements",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ supplements: [{ taken: true, dosage: "5 g" }] }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.body);
    expect(payload.error?.message).toContain("supplement name is required");
  });
});
