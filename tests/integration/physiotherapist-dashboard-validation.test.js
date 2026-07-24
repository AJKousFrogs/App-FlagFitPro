import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  access: { role: "physiotherapist", team_id: "team-1", status: "active" },
  players: [{ user_id: "athlete-1" }, { user_id: "athlete-2" }],
  assignments: [],
  users: [],
}));

function createQuery(table) {
  const call = { table, filters: {}, terminal: null };

  const resolveSingle = () => {
    // verifyPhysioAccess's own access-check query (team_members, .single()).
    if (table === "team_members" && call.filters.user_id === "physio-1") {
      return state.access
        ? { data: state.access, error: null }
        : { data: null, error: { code: "PGRST116" } };
    }
    return { data: null, error: { code: "PGRST116" } };
  };

  const resolveList = () => {
    if (table === "team_members" && call.filters.role === "player") {
      return { data: state.players, error: null };
    }
    if (table === "rtp_athlete_protocol_assignments") {
      return { data: state.assignments, error: null };
    }
    if (table === "users") {
      return { data: state.users, error: null };
    }
    return { data: [], error: null };
  };

  const query = {
    select: () => query,
    eq: (field, value) => {
      call.filters[field] = value;
      return query;
    },
    in: (field, values) => {
      call.filters[field] = values;
      return query;
    },
    order: () => query,
    limit: () => query,
    single: () => {
      call.terminal = "single";
      return Promise.resolve(resolveSingle());
    },
    maybeSingle: () => {
      call.terminal = "single";
      return Promise.resolve(resolveSingle());
    },
    then: (resolve, reject) =>
      Promise.resolve(resolveList()).then(resolve, reject),
  };
  return query;
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "physio-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => createQuery(table),
  },
}));

describe("physiotherapist-dashboard", () => {
  beforeEach(() => {
    vi.resetModules();
    state.access = {
      role: "physiotherapist",
      team_id: "team-1",
      status: "active",
    };
    state.players = [{ user_id: "athlete-1" }, { user_id: "athlete-2" }];
    state.assignments = [];
    state.users = [];
  });

  it("returns 403 when the caller has no physiotherapist access", async () => {
    state.access = null;
    const { handler } =
      await import("../../netlify/functions/physiotherapist-dashboard.js");
    const response = await handler(
      { httpMethod: "GET", headers: { authorization: "Bearer test-token" } },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns empty stats when the team has no active protocol assignments", async () => {
    const { handler } =
      await import("../../netlify/functions/physiotherapist-dashboard.js");
    const response = await handler(
      { httpMethod: "GET", headers: { authorization: "Bearer test-token" } },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.injuries).toEqual([]);
    expect(body.data.stats.total_active).toBe(0);
  });

  it("derives status buckets from current_phase and joins athlete names", async () => {
    state.assignments = [
      {
        id: "assign-1",
        athlete_id: "athlete-1",
        current_phase: 1,
        estimated_return_date: "2026-08-01",
        created_at: "2026-07-01T00:00:00Z",
        rtp_protocol_definitions: {
          injury_type: "ACL Tear",
          rts_rate_percent: 85,
        },
      },
      {
        id: "assign-2",
        athlete_id: "athlete-2",
        current_phase: 4,
        estimated_return_date: "2026-08-15",
        created_at: "2026-07-05T00:00:00Z",
        rtp_protocol_definitions: {
          injury_type: "Hamstring Strain",
          rts_rate_percent: 92,
        },
      },
    ];
    state.users = [
      { id: "athlete-1", full_name: "Alice Athlete" },
      { id: "athlete-2", full_name: "Bob Baller" },
    ];

    const { handler } =
      await import("../../netlify/functions/physiotherapist-dashboard.js");
    const response = await handler(
      { httpMethod: "GET", headers: { authorization: "Bearer test-token" } },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.injuries).toHaveLength(2);

    const acl = body.data.injuries.find((i) => i.athlete_id === "athlete-1");
    expect(acl.status).toBe("acute");
    expect(acl.athlete_name).toBe("Alice Athlete");
    expect(acl.injury_type).toBe("ACL Tear");
    expect(acl.rts_rate_percent).toBe(85);

    const hamstring = body.data.injuries.find(
      (i) => i.athlete_id === "athlete-2",
    );
    expect(hamstring.status).toBe("rehab");

    expect(body.data.stats).toMatchObject({
      total_active: 2,
      in_phase_1: 1,
      in_phase_4: 1,
    });
  });
});
