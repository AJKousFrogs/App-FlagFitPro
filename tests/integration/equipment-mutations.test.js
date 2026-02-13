import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  equipmentItem: {
    id: "eq-1",
    team_id: "team-1",
    quantity_available: 10,
    condition: "good",
  },
  assignment: {
    id: "as-1",
    equipment_id: "eq-1",
    quantity_assigned: 1,
    returned_at: "2026-02-13T00:00:00.000Z",
    notes: null,
    equipment_items: {
      id: "eq-1",
      team_id: "team-1",
      quantity_available: 9,
      condition: "good",
    },
  },
}));

function createFakeSupabase(state) {
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.mode = "select";
    }

    select(_columns) {
      return this;
    }

    update(_payload) {
      this.mode = "update";
      return this;
    }

    insert(_payload) {
      this.mode = "insert";
      return this;
    }

    eq(field, value) {
      this.filters.push({ field, value });
      return this;
    }

    maybeSingle() {
      return Promise.resolve({ data: null, error: null });
    }

    single() {
      if (this.table === "equipment_items") {
        return Promise.resolve({ data: state.equipmentItem, error: null });
      }
      if (this.table === "equipment_assignments") {
        return Promise.resolve({ data: state.assignment, error: null });
      }
      return Promise.resolve({ data: null, error: { code: "PGRST116" } });
    }
  }

  return {
    from(table) {
      return new Query(table);
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) => options.handler(event, context, {}),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  checkEnvVars: () => {},
  supabaseAdmin: {
    from: (...args) => createFakeSupabase(mockState).from(...args),
  },
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  checkTeamMembership: async () => ({
    authorized: true,
    role: "coach",
    teamId: "team-1",
  }),
}));

const buildEvent = (path, payload) => ({
  httpMethod: "POST",
  path,
  headers: { authorization: "Bearer test-token" },
  body: JSON.stringify(payload),
  queryStringParameters: {},
});

describe("equipment mutations validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/equipment.js");
    handler = mod.handler;
  });

  it("rejects non-positive checkout quantity with 422", async () => {
    const response = await handler(
      buildEvent("/api/equipment/checkout", {
        player_id: "player-1",
        equipment_id: "eq-1",
        quantity: 0,
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects non-positive bulk checkout quantity with 422", async () => {
    const response = await handler(
      buildEvent("/api/equipment/checkout/bulk", {
        equipment_id: "eq-1",
        player_ids: ["p1", "p2"],
        quantity: -3,
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns conflict when equipment is already returned", async () => {
    const response = await handler(
      buildEvent("/api/equipment/return", {
        assignment_id: "as-1",
        condition_at_return: "good",
      }),
      {},
    );

    expect(response.statusCode).toBe(409);
  });
});
