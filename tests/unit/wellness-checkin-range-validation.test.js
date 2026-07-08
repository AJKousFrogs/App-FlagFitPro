import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 2026-07-08 reusability audit F7: wellness-checkin.js's range checks were migrated
 * from a hand-written loop to the shared validateInput/COMMON_SCHEMAS-style DSL
 * (utils/input-validator.js) with strictType:true (see the WELLNESS_RANGE_SCHEMA
 * comment in wellness-checkin.js for the full rationale). These tests prove the
 * accept/reject DECISION is byte-identical to the old manual loop — the only
 * intentional change is the error message TEXT (still 422/validation_error).
 *
 * strictType:true is the load-bearing detail: the DSL's default number validator
 * coerces a numeric STRING via parseFloat ("7" would pass); the old manual check
 * never did that (typeof value !== "number" rejected "7" outright). Without
 * strictType this migration would have WIDENED what the endpoint accepts — a real
 * behavior change, not a pure move. The dedicated case below locks that in.
 */

// Generic chainable mock: every non-terminal method (eq/select/insert/upsert/...)
// returns the same chainable object; terminal methods resolve a query result.
// Needed because different code paths off the same handler (checkin save,
// ensurePublicUserProfile, ...) chain different method sequences.
function createChainable(result = { data: { id: "checkin-1" }, error: null }) {
  const chainable = {
    from: () => chainable,
    select: () => chainable,
    insert: () => chainable,
    upsert: () => chainable,
    update: () => chainable,
    eq: () => chainable,
    order: () => chainable,
    limit: () => chainable,
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then: (resolve) => resolve(result), // awaiting the chainable itself also resolves
  };
  return chainable;
}

function createFakeSupabase() {
  return {
    from: () => createChainable(),
    rpc: () =>
      Promise.resolve({ data: { checkin_id: "checkin-1" }, error: null }),
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

vi.mock("../../netlify/functions/utils/consent-guard.js", () => ({
  canCoachViewWellness: vi.fn().mockResolvedValue({ allowed: false }),
  filterWellnessDataForCoach: vi.fn((item) => item),
}));

vi.mock("../../netlify/functions/utils/safety-override.js", () => ({
  detectPainTrigger: vi.fn(),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: vi.fn().mockResolvedValue("player"),
}));

describe("wellness-checkin range validation (audit F7 migration)", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    ({ handler } = await import("../../netlify/functions/wellness.js"));
  });

  async function post(body) {
    return handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/wellness/checkin",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify(body),
      },
      {},
    );
  }

  it("accepts every field at its exact boundary values", async () => {
    const res = await post({
      sleepQuality: 1,
      energyLevel: 10,
      muscleSoreness: 1,
      stressLevel: 10,
      motivationLevel: 1,
      mood: 10,
      readinessScore: 0,
      travelHours: 24,
    });
    expect(res.statusCode).toBe(200);
  });

  it("rejects one field 1 below its minimum -> 422 validation_error", async () => {
    const res = await post({ sleepQuality: 0 });
    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe("validation_error");
  });

  it("rejects one field 1 above its maximum -> 422 validation_error", async () => {
    const res = await post({ energyLevel: 11 });
    expect(res.statusCode).toBe(422);
    expect(JSON.parse(res.body).error.code).toBe("validation_error");
  });

  it("rejects readinessScore above 100 (different bounds than the 1-10 fields)", async () => {
    const res = await post({ readinessScore: 101 });
    expect(res.statusCode).toBe(422);
  });

  it("rejects travelHours above 24", async () => {
    const res = await post({ travelHours: 25 });
    expect(res.statusCode).toBe(422);
  });

  it("REGRESSION GUARD: a numeric STRING is still rejected, not silently coerced (strictType)", async () => {
    // Before this migration, `sleepQuality: "7"` failed `typeof value !== "number"`
    // and was rejected. The DSL's default number validator would parseFloat("7")
    // and ACCEPT it — strictType:true is what preserves the old, stricter contract.
    const res = await post({ sleepQuality: "7" });
    expect(res.statusCode).toBe(422);
  });

  it("rejects a non-numeric string (would parseFloat to NaN)", async () => {
    // Note: literal NaN can't survive JSON.stringify (it serializes to `null`,
    // treated as absent) — a non-numeric string is the real-world equivalent.
    const res = await post({ sleepQuality: "abc" });
    expect(res.statusCode).toBe(422);
  });

  it("undefined/absent optional fields are not validated (all fields optional)", async () => {
    const res = await post({ sleepQuality: 5 });
    expect(res.statusCode).toBe(200);
  });

  it("null fields are treated as absent, not invalid", async () => {
    const res = await post({ sleepQuality: 5, mood: null });
    expect(res.statusCode).toBe(200);
  });
});
