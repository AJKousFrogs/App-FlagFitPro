import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCtx = vi.hoisted(() => ({
  userId: "user-1",
  role: "coach",
  state: {
    existingPendingAbsence: null,
    reviewRequestRow: null,
    reviewUpdateResult: null,
    absenceInsertError: null,
    invalidTeamPlayers: [],
  },
}));

function createFakeSupabase(state) {
  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.mode = "select";
      this.payload = null;
      this.selectColumns = null;
    }

    select(columns) {
      if (this.mode !== "insert" && this.mode !== "update" && this.mode !== "upsert") {
        this.mode = "select";
      }
      this.selectColumns = columns;
      return this;
    }

    update(payload) {
      this.mode = "update";
      this.payload = payload;
      return this;
    }

    insert(_payload) {
      this.mode = "insert";
      return this;
    }

    upsert(_payload, _options) {
      this.mode = "upsert";
      return this;
    }

    eq(field, value) {
      this.filters.push({ field, value });
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
      if (this.table === "team_events" && this.mode === "select") {
        return { data: { id: "event-1", team_id: "team-1" }, error: null };
      }

      if (this.table === "absence_requests" && this.mode === "select") {
        const hasPendingFilter = this.filters.some(
          (f) => f.field === "status" && f.value === "pending",
        );

        if (hasPendingFilter && isMaybeSingle) {
          return { data: state.existingPendingAbsence, error: null };
        }

        return { data: state.reviewRequestRow, error: null };
      }

      if (this.table === "absence_requests" && this.mode === "update") {
        return { data: state.reviewUpdateResult, error: null };
      }

      if (this.table === "absence_requests" && this.mode === "insert") {
        if (state.absenceInsertError) {
          return { data: null, error: state.absenceInsertError };
        }
        return { data: { id: "abs-new" }, error: null };
      }

      if (this.table === "team_members" && this.mode === "select") {
        const userFilter = this.filters.find((f) => f.field === "user_id");
        const playerId = userFilter?.value;
        if (playerId && state.invalidTeamPlayers.includes(playerId)) {
          return { data: null, error: null };
        }
        return { data: { id: "member-1" }, error: null };
      }

      return { data: null, error: null };
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
    from: (...args) => createFakeSupabase(mockCtx.state).from(...args),
  },
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  checkTeamMembership: async () => ({
    authorized: true,
    role: mockCtx.role,
    teamId: "team-1",
  }),
  getUserTeamId: async () => "team-1",
}));

const buildEvent = (path, method, payload = null, queryStringParameters = {}) => ({
  httpMethod: method,
  path,
  headers: { authorization: "Bearer test-token" },
  body: payload ? JSON.stringify(payload) : null,
  queryStringParameters,
});

describe("attendance mutations validation", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    mockCtx.role = "coach";
    mockCtx.state = {
      existingPendingAbsence: null,
      reviewRequestRow: null,
      reviewUpdateResult: null,
      absenceInsertError: null,
      invalidTeamPlayers: [],
    };
    const mod = await import("../../netlify/functions/attendance.js");
    handler = mod.handler;
  });

  it("rejects invalid attendance status with 422", async () => {
    const response = await handler(
      buildEvent("/api/attendance/record", "POST", {
        event_id: "event-1",
        player_id: "user-1",
        status: "unknown_status",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects duplicate pending absence request with 422", async () => {
    mockCtx.state.existingPendingAbsence = { id: "abs-1" };

    const response = await handler(
      buildEvent("/api/attendance/absence-request", "POST", {
        event_id: "event-1",
        reason: "Family event",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects attendance write for a non-active team player with 422", async () => {
    mockCtx.state.invalidTeamPlayers = ["user-2"];

    const response = await handler(
      buildEvent("/api/attendance/record", "POST", {
        event_id: "event-1",
        player_id: "user-2",
        status: "present",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects bulk attendance when any player is not an active team player", async () => {
    mockCtx.state.invalidTeamPlayers = ["user-2"];

    const response = await handler(
      buildEvent("/api/attendance/record/bulk", "POST", {
        event_id: "event-1",
        records: [
          { player_id: "user-1", status: "present" },
          { player_id: "user-2", status: "absent" },
        ],
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("handles DB duplicate race for absence request with 422", async () => {
    mockCtx.state.absenceInsertError = { code: "23505" };

    const response = await handler(
      buildEvent("/api/attendance/absence-request", "POST", {
        event_id: "event-1",
        reason: "Medical appointment",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("rejects reviewing already-reviewed absence requests with 422", async () => {
    mockCtx.state.reviewRequestRow = {
      id: "abs-2",
      event_id: "event-1",
      player_id: "user-1",
      reason: "Sick",
      team_events: { team_id: "team-1" },
    };
    mockCtx.state.reviewUpdateResult = null;

    const response = await handler(
      buildEvent("/api/attendance/absence-request/abs-2", "PUT", {
        status: "approved",
      }),
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
