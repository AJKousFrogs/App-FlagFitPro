import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  coachTeams: [{ team_id: "team-1", role: "coach" }],
  inboxItem: { id: "inbox-1", team_id: "team-2", title: "Alert", summary: "Summary" },
  template: {
    id: "template-1",
    team_id: "team-2",
    template_type: "micro_session",
    content: {},
    name: "Template",
    description: "Desc",
    category: "recovery",
    position_filter: ["ALL"],
  },
  athleteMemberships: [{ user_id: "athlete-1" }],
  listError: null,
  assignmentError: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "coach-1", requestId: "req-test" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => true,
  supabaseAdmin: {
    from: (table) => {
      if (table === "team_members") {
        const filters = {};
        return {
          select() {
            return this;
          },
          eq(field, value) {
            filters[field] = value;
            return this;
          },
          in(field, values) {
            filters[field] = values;
            return this;
          },
          or: async () => {
            if (filters.user_id === "coach-1" && Array.isArray(filters.role)) {
              return { data: state.coachTeams, error: null };
            }
            if (filters.team_id && Array.isArray(filters.user_id)) {
              return { data: state.athleteMemberships, error: null };
            }
            return { data: [], error: null };
          },
        };
      }

      if (table === "coach_inbox_items") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          single: async () => ({ data: state.inboxItem, error: null }),
          update() {
            return this;
          },
        };
      }

      if (table === "team_templates") {
        const queryState = { mode: "list" };
        return {
          select() {
            return this;
          },
          eq(field, value) {
            if (field === "id") {
              queryState.mode = "single";
              queryState.id = value;
            }
            return this;
          },
          in() {
            return this;
          },
          order() {
            return this;
          },
          limit() {
            return this;
          },
          update() {
            return this;
          },
          single: async () => {
            if (queryState.mode === "single") {
              return { data: state.template, error: null };
            }
            return { data: null, error: null };
          },
          then(resolve) {
            resolve({ data: [], error: state.listError });
          },
        };
      }

      if (table === "micro_sessions" || table === "template_assignments" || table === "ai_messages") {
        const queryState = { mode: null };
        return {
          insert() {
            queryState.mode = "insert";
            return this;
          },
          select() {
            return this;
          },
          single: async () => {
            if (table === "template_assignments" && queryState.mode === "insert" && state.assignmentError) {
              return { data: null, error: { message: state.assignmentError } };
            }
            return { data: { id: "row-1" }, error: null };
          },
          eq() {
            return this;
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  },
}));

describe("team-templates authorization and error hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.coachTeams = [{ team_id: "team-1", role: "coach" }];
    state.inboxItem = { id: "inbox-1", team_id: "team-2", title: "Alert", summary: "Summary" };
    state.template = {
      id: "template-1",
      team_id: "team-2",
      template_type: "micro_session",
      content: {},
      name: "Template",
      description: "Desc",
      category: "recovery",
      position_filter: ["ALL"],
    };
    state.athleteMemberships = [{ user_id: "athlete-1" }];
    state.listError = null;
    state.assignmentError = null;
    const mod = await import("../../netlify/functions/team-templates.js");
    handler = mod.handler;
  });

  it("returns 403 when assigning a template from a team the coach does not manage", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/team-templates/template-1/assign",
        body: JSON.stringify({ athlete_ids: ["athlete-1"] }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns 403 when creating from inbox item outside coach teams", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/team-templates/from-inbox",
        body: JSON.stringify({ inbox_item_id: "inbox-1", template_type: "micro_session", content: {} }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns sanitized 500 when listing templates fails", async () => {
    state.listError = { message: "sensitive query plan detail" };
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/team-templates",
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error.message).toBe("Failed to process team template request");
    expect(body.error.details).toBeFalsy();
  });

  it("sanitizes per-athlete assignment errors in partial success payload", async () => {
    state.template.team_id = "team-1";
    state.assignmentError = "duplicate key value violates unique constraint";
    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/team-templates/template-1/assign",
        body: JSON.stringify({ athlete_ids: ["athlete-1"] }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data?.failed?.[0]?.error).toBe("Assignment failed");
    expect(JSON.stringify(body)).not.toContain("duplicate key value violates unique constraint");
  });
});
