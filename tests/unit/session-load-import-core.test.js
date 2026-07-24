import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  providers: [],
  devicePairings: [],
  teamMembers: [],
  upserted: [],
  upsertError: null,
}));

function createFakeSupabase() {
  return {
    from(table) {
      const call = { filters: {}, inFilters: {} };
      const query = {
        select() {
          return query;
        },
        eq(field, value) {
          call.filters[field] = value;
          return query;
        },
        in(field, values) {
          call.inFilters[field] = values;
          return query;
        },
        upsert(payload) {
          call.method = "upsert";
          call.payload = payload;
          return query;
        },
        maybeSingle: () => {
          if (table === "monitoring_providers") {
            const match = state.providers.find(
              (p) => p.key === call.filters.key,
            );
            return Promise.resolve({ data: match || null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        then: (resolve, reject) => {
          if (table === "device_pairings") {
            const rows = state.devicePairings.filter(
              (p) => p.provider_id === call.filters.provider_id,
            );
            return Promise.resolve({ data: rows, error: null }).then(
              resolve,
              reject,
            );
          }
          if (table === "team_members") {
            let rows = state.teamMembers;
            if (call.filters.user_id) {
              rows = rows.filter((r) => r.user_id === call.filters.user_id);
            }
            if (call.inFilters.user_id) {
              rows = rows.filter((r) =>
                call.inFilters.user_id.includes(r.user_id),
              );
            }
            if (call.filters.status) {
              rows = rows.filter((r) => r.status === call.filters.status);
            }
            if (call.filters.role) {
              rows = rows.filter((r) => r.role === call.filters.role);
            }
            if (call.inFilters.role) {
              rows = rows.filter((r) => call.inFilters.role.includes(r.role));
            }
            return Promise.resolve({ data: rows, error: null }).then(
              resolve,
              reject,
            );
          }
          if (table === "session_load" && call.method === "upsert") {
            if (state.upsertError) {
              return Promise.resolve({
                data: null,
                error: state.upsertError,
              }).then(resolve, reject);
            }
            state.upserted.push(...call.payload);
            return Promise.resolve({
              data: call.payload.map((_, i) => ({ id: `row-${i}` })),
              error: null,
            }).then(resolve, reject);
          }
          return Promise.resolve({ data: null, error: null }).then(
            resolve,
            reject,
          );
        },
      };
      return query;
    },
  };
}

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  get supabaseAdmin() {
    return createFakeSupabase();
  },
}));

describe("runSessionLoadImport", () => {
  let runSessionLoadImport;

  beforeEach(async () => {
    vi.resetModules();
    state.providers = [];
    state.devicePairings = [];
    state.teamMembers = [];
    state.upserted = [];
    state.upsertError = null;
    ({ runSessionLoadImport } = await import(
      "../../netlify/functions/utils/session-load-import-core.js"
    ));
  });

  it("rejects an unsupported provider before touching the DB", async () => {
    const result = await runSessionLoadImport("athlete-1", "nonsense", []);
    expect(result.ok).toBe(false);
    expect(result.code).toBe("unsupported_provider");
  });

  it("imports a paired athlete's row", async () => {
    state.providers = [{ key: "catapult", id: "prov-cat" }];
    state.devicePairings = [
      {
        provider_id: "prov-cat",
        external_athlete_id: "ext-1",
        user_id: "athlete-1",
      },
    ];

    const result = await runSessionLoadImport("athlete-1", "catapult", [
      {
        athlete_id: "ext-1",
        activity_id: "act-1",
        start_time: "2026-07-20T00:00:00Z",
      },
    ]);

    expect(result.ok).toBe(true);
    expect(result.data.imported).toBe(1);
    expect(state.upserted[0].user_id).toBe("athlete-1");
  });

  it("surfaces an unpaired row without failing the whole import", async () => {
    state.providers = [{ key: "catapult", id: "prov-cat" }];
    state.devicePairings = [];

    const result = await runSessionLoadImport("athlete-1", "catapult", [
      {
        athlete_id: "unknown",
        activity_id: "act-1",
        start_time: "2026-07-20T00:00:00Z",
      },
    ]);

    expect(result.ok).toBe(true);
    expect(result.data.imported).toBe(0);
    expect(result.data.failed[0].reason).toBe("no device<->athlete pairing");
  });

  it("blocks importing for an athlete the caller doesn't staff", async () => {
    state.providers = [{ key: "catapult", id: "prov-cat" }];
    state.devicePairings = [
      {
        provider_id: "prov-cat",
        external_athlete_id: "ext-2",
        user_id: "athlete-2",
      },
    ];
    state.teamMembers = [];

    const result = await runSessionLoadImport("athlete-1", "catapult", [
      {
        athlete_id: "ext-2",
        activity_id: "act-1",
        start_time: "2026-07-20T00:00:00Z",
      },
    ]);

    expect(result.data.imported).toBe(0);
    expect(result.data.failed[0].reason).toBe(
      "not permitted to import for this athlete",
    );
  });

  // Regression for the 2026-07-25 fix (docs/SOURCE_OF_TRUTH.md §6): this gate
  // used to query team_member_roles, a table nothing ever wrote to, so this
  // "allow" path was never actually exercised as passing before — every
  // non-self import was silently denied regardless of real team_members role.
  it("allows an S&C coach to import for an athlete on their active team", async () => {
    state.providers = [{ key: "catapult", id: "prov-cat" }];
    state.devicePairings = [
      {
        provider_id: "prov-cat",
        external_athlete_id: "ext-2",
        user_id: "athlete-2",
      },
    ];
    state.teamMembers = [
      {
        user_id: "coach-1",
        team_id: "team-1",
        role: "strength_conditioning_coach",
        status: "active",
      },
      {
        user_id: "athlete-2",
        team_id: "team-1",
        role: "player",
        status: "active",
      },
    ];

    const result = await runSessionLoadImport("coach-1", "catapult", [
      {
        athlete_id: "ext-2",
        activity_id: "act-1",
        start_time: "2026-07-20T00:00:00Z",
      },
    ]);

    expect(result.data.imported).toBe(1);
    expect(result.data.failedCount).toBe(0);
    expect(state.upserted[0].user_id).toBe("athlete-2");
  });

  it("still blocks a physio importing for an athlete on a DIFFERENT team", async () => {
    state.providers = [{ key: "catapult", id: "prov-cat" }];
    state.devicePairings = [
      {
        provider_id: "prov-cat",
        external_athlete_id: "ext-2",
        user_id: "athlete-2",
      },
    ];
    state.teamMembers = [
      {
        user_id: "physio-1",
        team_id: "team-1",
        role: "physiotherapist",
        status: "active",
      },
      {
        user_id: "athlete-2",
        team_id: "team-2",
        role: "player",
        status: "active",
      },
    ];

    const result = await runSessionLoadImport("physio-1", "catapult", [
      {
        athlete_id: "ext-2",
        activity_id: "act-1",
        start_time: "2026-07-20T00:00:00Z",
      },
    ]);

    expect(result.data.imported).toBe(0);
    expect(result.data.failed[0].reason).toBe(
      "not permitted to import for this athlete",
    );
  });

  it("does not let a plain player import for a teammate", async () => {
    state.providers = [{ key: "catapult", id: "prov-cat" }];
    state.devicePairings = [
      {
        provider_id: "prov-cat",
        external_athlete_id: "ext-2",
        user_id: "athlete-2",
      },
    ];
    state.teamMembers = [
      {
        user_id: "athlete-1",
        team_id: "team-1",
        role: "player",
        status: "active",
      },
      {
        user_id: "athlete-2",
        team_id: "team-1",
        role: "player",
        status: "active",
      },
    ];

    const result = await runSessionLoadImport("athlete-1", "catapult", [
      {
        athlete_id: "ext-2",
        activity_id: "act-1",
        start_time: "2026-07-20T00:00:00Z",
      },
    ]);

    expect(result.data.imported).toBe(0);
    expect(result.data.failed[0].reason).toBe(
      "not permitted to import for this athlete",
    );
  });

  it("surfaces a DB error rather than reporting a partial success as done", async () => {
    state.providers = [{ key: "catapult", id: "prov-cat" }];
    state.devicePairings = [
      {
        provider_id: "prov-cat",
        external_athlete_id: "ext-1",
        user_id: "athlete-1",
      },
    ];
    state.upsertError = { message: "db exploded" };

    const result = await runSessionLoadImport("athlete-1", "catapult", [
      {
        athlete_id: "ext-1",
        activity_id: "act-1",
        start_time: "2026-07-20T00:00:00Z",
      },
    ]);

    expect(result.ok).toBe(false);
    expect(result.code).toBe("import_failed");
  });
});
