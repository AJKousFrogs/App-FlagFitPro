import { beforeEach, describe, expect, it, vi } from "vitest";

let capturedInsertPayload = null;

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = {};
    }
    select() {
      return this;
    }
    eq(field, value) {
      this.filters[field] = value;
      return this;
    }
    update() {
      this.mode = "update";
      return this;
    }
    insert(payload) {
      this.mode = "insert";
      this.payload = payload;
      return this;
    }
    order() {
      return this;
    }
    limit() {
      return this;
    }
    single() {
      return Promise.resolve(this.run());
    }
    then(resolve, reject) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }
    run() {
      if (this.table === "nutrition_plans" && this.mode === "update") {
        return { data: [], error: null };
      }
      if (this.table === "nutrition_plans" && this.mode === "insert") {
        capturedInsertPayload = this.payload;
        return { data: { id: "plan-1", ...this.payload }, error: null };
      }
      if (this.table === "usda_foods") {
        return { data: [], error: null };
      }
      return { data: null, error: { code: "PGRST116" } };
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
    options.handler(event, context, { userId: "user-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

describe("nutrition validation and hardening", () => {
  let handler;

  beforeEach(async () => {
    capturedInsertPayload = null;
    vi.resetModules();
    const mod = await import("../../netlify/functions/nutrition.js");
    handler = mod.handler;
  });

  it("ignores user_id override when creating nutrition plans", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/nutrition/plan",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({
          user_id: "attacker-id",
          name: "Plan A",
          target_calories: 2600,
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(201);
    expect(capturedInsertPayload.user_id).toBe("user-1");
  });

  it("returns 422 for invalid food search query characters", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/nutrition/foods/search",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { q: "apple),or(id.gt.0" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for malformed food search limit query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/nutrition/foods/search",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { q: "apple", limit: "20items" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for malformed meals maxCalories query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/nutrition/meals",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { maxCalories: "2500kcal" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid sex in calculate payload", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/nutrition/calculate",
        headers: {},
        queryStringParameters: {},
        body: JSON.stringify({
          weightKg: 78,
          heightCm: 182,
          age: 22,
          sex: "unknown",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for malformed hydration weight query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/nutrition/hydration",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { weightKg: "70kg" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid hydration trainingDay query", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/nutrition/hydration",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { weightKg: "72", trainingDay: "yes" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
