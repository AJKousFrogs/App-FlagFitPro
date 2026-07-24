import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  failingTable: null,
  failingMessage: null,
  billingCustomer: null,
  subscriptions: [],
  invoices: [],
}));

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
    insert() {
      this.mode = "insert";
      return this;
    }
    in(field, values) {
      this.filters[field] = values;
      return this;
    }
    single() {
      return Promise.resolve(this.run());
    }
    maybeSingle() {
      const result = this.run();
      if (Array.isArray(result.data)) {
        return Promise.resolve({ data: result.data[0] || null, error: result.error });
      }
      return Promise.resolve(result);
    }
    then(resolve, reject) {
      return Promise.resolve(this.run()).then(resolve, reject);
    }
    catch(reject) {
      return Promise.resolve(this.run()).catch(reject);
    }

    run() {
      if (this.table === "gdpr_data_processing_log" && this.mode === "insert") {
        return { data: { id: "req-1" }, error: null };
      }
      if (
        this.mode === "select" &&
        this.table === state.failingTable &&
        state.failingMessage
      ) {
        return { data: null, error: { message: state.failingMessage } };
      }
      if (this.table === "billing_customers" && this.mode === "select") {
        return { data: state.billingCustomer, error: null };
      }
      if (this.table === "subscriptions" && this.mode === "select") {
        return { data: state.subscriptions, error: null };
      }
      if (this.table === "invoices" && this.mode === "select") {
        return { data: state.invoices, error: null };
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
    options.handler(event, context, { userId: "user-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

describe("data-export validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.failingTable = null;
    state.failingMessage = null;
    state.billingCustomer = null;
    state.subscriptions = [];
    state.invoices = [];
    const mod = await import("../../netlify/functions/data-export.js");
    handler = mod.handler;
  });

  it("returns 202 for async export request creation", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/data-export/request",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ format: "json", deliveryMethod: "download" }),
      },
      {},
    );

    expect(response.statusCode).toBe(202);
  });

  it("returns 422 for non-object request payloads", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/data-export/request",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "null",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for unsupported export format", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/data-export/request",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ format: "csv" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("sanitizes per-section errors in generated export payload", async () => {
    state.failingTable = "training_sessions";
    state.failingMessage = "sensitive execution plan details";
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/data-export/generate",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{}",
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data?.sections?.training_sessions?.status).toBe("error");
    expect(payload.data?.sections?.training_sessions?.error).toBe(
      "Section export failed",
    );
    expect(JSON.stringify(payload)).not.toContain(
      "sensitive execution plan details",
    );
  });

  it("includes the caller's individual billing history in the generated export", async () => {
    state.billingCustomer = {
      id: "bc-1",
      stripe_customer_id: "cus_1",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    state.subscriptions = [
      {
        id: "sub-row-1",
        billing_customer_id: "bc-1",
        tier: "athlete_pro",
        status: "active",
      },
    ];
    state.invoices = [
      { id: "inv-1", subscription_id: "sub-row-1", status: "paid" },
    ];

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/data-export/generate",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{}",
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.sections.billing.status).toBe("success");
    expect(payload.data.sections.billing.data.subscriptions).toHaveLength(1);
    expect(payload.data.sections.billing.data.invoices).toHaveLength(1);
  });

  it("skips the billing section when the caller has no individual billing customer", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/data-export/generate",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{}",
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.sections.billing.status).toBe("skipped");
  });
});
