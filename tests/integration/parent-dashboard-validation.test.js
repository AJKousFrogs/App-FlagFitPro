import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCtx = vi.hoisted(() => ({
  approvalStatus: "pending",
}));

function createFakeSupabase() {
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = "select";
      this.filters = [];
      this.payload = null;
    }

    select() {
      if (this.mode !== "update" && this.mode !== "insert") {
        this.mode = "select";
      }
      return this;
    }

    update(payload) {
      this.mode = "update";
      this.payload = payload;
      return this;
    }

    insert(payload) {
      this.mode = "insert";
      this.payload = payload;
      return this;
    }

    eq(field, value) {
      this.filters.push({ field, value });
      return this;
    }

    order() {
      return this;
    }

    range() {
      return this;
    }

    maybeSingle() {
      return Promise.resolve(this.run(true));
    }

    single() {
      return Promise.resolve(this.run(false));
    }

    then(resolve, reject) {
      return Promise.resolve(this.run(false)).then(resolve, reject);
    }

    run(isMaybeSingle) {
      if (this.table === "approval_requests" && this.mode === "select" && isMaybeSingle) {
        return {
          data: { id: "approval-1", status: mockCtx.approvalStatus },
          error: null,
        };
      }

      if (this.table === "approval_requests" && this.mode === "update" && isMaybeSingle) {
        if (mockCtx.approvalStatus !== "pending") {
          return { data: null, error: null };
        }
        return { data: { id: "approval-1", status: this.payload.status }, error: null };
      }

      if (this.table === "parent_notifications" && this.mode === "update" && isMaybeSingle) {
        return { data: { id: "notif-1", status: this.payload.status }, error: null };
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
    options.handler(event, context, { userId: "parent-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: createFakeSupabase(),
}));

describe("parent-dashboard validation and transitions", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockCtx.approvalStatus = "pending";
    const mod = await import("../../netlify/functions/parent-dashboard.js");
    handler = mod.handler;
  });

  it("rejects invalid notification status with 422", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/.netlify/functions/parent-dashboard/notifications/notif-1",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ status: "bogus" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects re-processing an already decided approval request with 409", async () => {
    mockCtx.approvalStatus = "approved";
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/.netlify/functions/parent-dashboard/approvals/approval-1",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ decision: "approved" }),
      },
      {},
    );

    expect(response.statusCode).toBe(409);
  });

  it("rejects creating a parent link to the caller's own account", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/parent-dashboard/link",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ youth_id: "parent-1" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects non-object payload for notification patch with 422", async () => {
    const response = await handler(
      {
        httpMethod: "PATCH",
        path: "/.netlify/functions/parent-dashboard/notifications/notif-1",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "[]",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid notifications pagination with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/parent-dashboard/notifications",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { limit: "abc", offset: "-1" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid youth_email format on link requests", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/parent-dashboard/link",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ youth_email: "bad-email" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid notifications status filter with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/parent-dashboard/notifications",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { status: "bogus" },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects invalid child activity date_from/date_to range with 422", async () => {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/parent-dashboard/children/child-1/activity",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {
          date_from: "2026-03-10T00:00:00.000Z",
          date_to: "2026-03-01T00:00:00.000Z",
        },
        body: null,
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects non-string youth_id on link requests with 422", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/parent-dashboard/link",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ youth_id: { bad: true } }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
