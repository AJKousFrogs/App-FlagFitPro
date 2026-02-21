import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  dbRole: "player",
  metaRole: "player",
  pendingEntries: [
    {
      id: "kb-1",
      topic: "pending_topic",
      question: "q",
      answer:
        "Use 3-5g daily dose with hydration. Safety warning: avoid if contraindicated with kidney conditions.",
      summary:
        "Practical supplement guidance with dosing and safety considerations.",
      merlin_approval_status: "pending",
      is_merlin_approved: false,
      merlin_submitted_by: "user-1",
      entry_type: "supplement",
    },
  ],
  insertedPayload: null,
  updatedPayload: null,
  auditPayload: null,
};

class Query {
  constructor(table) {
    this.table = table;
    this.filters = {};
    this.mode = "select";
  }
  select() {
    if (this.mode !== "insert" && this.mode !== "update") {
      this.mode = "select";
    }
    return this;
  }
  eq(column, value) {
    this.filters[column] = value;
    return this;
  }
  order() {
    return this;
  }
  limit() {
    return this;
  }
  insert(payload) {
    this.mode = "insert";
    state.insertedPayload = payload;
    if (this.table === "knowledge_review_audit") {
      state.auditPayload = payload;
    }
    return this;
  }
  update(payload) {
    this.mode = "update";
    state.updatedPayload = payload;
    return this;
  }
  single() {
    if (this.mode === "insert") {
      return Promise.resolve({
        data: {
          id: "kb-new",
          topic: state.insertedPayload.topic,
          merlin_approval_status: "pending",
          is_merlin_approved: false,
        },
        error: null,
      });
    }
    if (this.mode === "update") {
      return Promise.resolve({
        data: {
          id: "kb-1",
          topic: "pending_topic",
          merlin_approval_status: state.updatedPayload.merlin_approval_status,
          is_merlin_approved: state.updatedPayload.is_merlin_approved,
          merlin_approved_by_role: state.updatedPayload.merlin_approved_by_role,
        },
        error: null,
      });
    }
    if (this.table === "knowledge_base_entries" && this.mode === "select") {
      const filtered = state.pendingEntries.filter((e) => {
        for (const [k, v] of Object.entries(this.filters)) {
          if (e[k] !== v) {
            return false;
          }
        }
        return true;
      });
      return Promise.resolve({ data: filtered[0] || null, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  }
  then(resolve) {
    if (this.table === "knowledge_base_entries" && this.mode === "select") {
      const filtered = state.pendingEntries.filter((e) => {
        for (const [k, v] of Object.entries(this.filters)) {
          if (e[k] !== v) {
            return false;
          }
        }
        return true;
      });
      resolve({ data: filtered, error: null });
      return;
    }
    resolve({ data: [], error: null });
  }
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, {
      userId: "user-1",
      requestId: "req-test",
      authUser: {
        user_metadata: {
          role: state.metaRole,
          staff_role: state.metaRole,
        },
      },
    }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => state.dbRole,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from(table) {
      return new Query(table);
    },
  },
}));

describe("knowledge-governance validation", () => {
  beforeEach(() => {
    state.dbRole = "player";
    state.metaRole = "player";
    state.insertedPayload = null;
    state.updatedPayload = null;
    state.pendingEntries = [
      {
        id: "kb-1",
        topic: "pending_topic",
        question: "q",
        answer:
          "Use 3-5g daily dose with hydration. Safety warning: avoid if contraindicated with kidney conditions.",
        summary:
          "Practical supplement guidance with dosing and safety considerations.",
        merlin_approval_status: "pending",
        is_merlin_approved: false,
        merlin_submitted_by: "user-1",
        entry_type: "supplement",
      },
    ];
    state.auditPayload = null;
  });

  it("rejects pending queue access for non-nutritionist", async () => {
    const { handler } = await import("../../netlify/functions/knowledge-governance.js");
    const response = await handler(
      { httpMethod: "GET", path: "/.netlify/functions/knowledge-governance/pending", queryStringParameters: {} },
      {},
    );
    expect(response.statusCode).toBe(403);
  });

  it("allows nutritionist to fetch pending queue", async () => {
    state.metaRole = "nutritionist";
    const { handler } = await import("../../netlify/functions/knowledge-governance.js");
    const response = await handler(
      { httpMethod: "GET", path: "/.netlify/functions/knowledge-governance/pending", queryStringParameters: {} },
      {},
    );
    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
    expect(payload.data.total).toBe(1);
  });

  it("allows users to fetch their own submissions", async () => {
    const { handler } = await import("../../netlify/functions/knowledge-governance.js");
    const response = await handler(
      { httpMethod: "GET", path: "/.netlify/functions/knowledge-governance/my", queryStringParameters: {} },
      {},
    );
    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
    expect(payload.data.total).toBe(1);
  });

  it("blocks audit timeline for non-owner non-nutritionist", async () => {
    state.pendingEntries[0].merlin_submitted_by = "someone-else";
    const { handler } = await import("../../netlify/functions/knowledge-governance.js");
    const response = await handler(
      { httpMethod: "GET", path: "/.netlify/functions/knowledge-governance/audit/kb-1", queryStringParameters: {} },
      {},
    );
    expect(response.statusCode).toBe(403);
  });

  it("allows audit timeline for submission owner", async () => {
    state.pendingEntries[0].merlin_submitted_by = "user-1";
    const { handler } = await import("../../netlify/functions/knowledge-governance.js");
    const response = await handler(
      { httpMethod: "GET", path: "/.netlify/functions/knowledge-governance/audit/kb-1", queryStringParameters: {} },
      {},
    );
    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
    expect(payload.data.entry_id).toBe("kb-1");
  });

  it("submits new knowledge as pending and unapproved", async () => {
    const { handler } = await import("../../netlify/functions/knowledge-governance.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/knowledge-governance",
        body: JSON.stringify({
          topic: "new_food_rule",
          question: "q",
          answer:
            "Use 3-5g daily dose with hydration. Safety warning: avoid if contraindicated with kidney conditions.",
          entry_type: "nutrition",
        }),
      },
      {},
    );
    expect(response.statusCode).toBe(200);
    expect(state.insertedPayload?.merlin_approval_status).toBe("pending");
    expect(state.insertedPayload?.is_merlin_approved).toBe(false);
  });

  it("allows nutritionist approval action", async () => {
    state.metaRole = "nutritionist";
    const { handler } = await import("../../netlify/functions/knowledge-governance.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/knowledge-governance/review/kb-1",
        body: JSON.stringify({ action: "approve", notes: "approved by nutritionist" }),
      },
      {},
    );
    expect(response.statusCode).toBe(200);
    expect(state.updatedPayload?.merlin_approval_status).toBe("approved");
    expect(state.updatedPayload?.is_merlin_approved).toBe(true);
    expect(state.auditPayload?.entry_id).toBe("kb-1");
  });

  it("blocks approval when quality gate fails", async () => {
    state.metaRole = "nutritionist";
    state.pendingEntries[0].answer = "Too short answer";
    state.pendingEntries[0].summary = "Too short";
    const { handler } = await import("../../netlify/functions/knowledge-governance.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/knowledge-governance/review/kb-1",
        body: JSON.stringify({ action: "approve" }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("allows override with review notes when quality gate fails", async () => {
    state.metaRole = "nutritionist";
    state.pendingEntries[0].answer = "Too short answer";
    state.pendingEntries[0].summary = "Too short";
    const { handler } = await import("../../netlify/functions/knowledge-governance.js");
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/knowledge-governance/review/kb-1",
        body: JSON.stringify({
          action: "approve",
          override_quality_gate: true,
          notes: "Approved for pilot usage despite limited details",
        }),
      },
      {},
    );
    expect(response.statusCode).toBe(200);
  });
});
