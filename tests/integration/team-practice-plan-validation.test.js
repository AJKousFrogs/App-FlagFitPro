import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ isStaff: true, rows: [] }));

// Bypass auth: inject a userId, run the inner handler directly.
vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "coach-1" }),
}));

// Configurable team-staff gate.
vi.mock("../../netlify/functions/utils/team-scope.js", () => ({
  isStaffOfTeam: async () => state.isStaff,
}));

// Fake supabase: every block query resolves to state.rows.
vi.mock("../../netlify/functions/supabase-client.js", () => {
  // Fully chainable thenable so any order of .in/.eq/.limit/.overlaps then await works.
  const makeQuery = () => ({
    select() {
      return this;
    },
    in() {
      return this;
    },
    eq() {
      return this;
    },
    overlaps() {
      return this;
    },
    limit() {
      return this;
    },
    then(resolve) {
      resolve({ data: state.rows, error: null });
    },
  });
  return { supabaseAdmin: { from: () => makeQuery() } };
});

const invoke = async (body) => {
  const { testHandler } =
    await import("../../netlify/functions/team-practice-plan.js");
  const res = await testHandler(
    {
      httpMethod: "POST",
      path: "/api/team-practice-plan",
      body: JSON.stringify(body),
    },
    {},
  );
  return { status: res.statusCode, json: JSON.parse(res.body) };
};

describe("team-practice-plan endpoint", () => {
  beforeEach(() => {
    state.isStaff = true;
    state.rows = [
      { id: "ex-1", name: "Drill A", subcategory: "wr_block", active: true },
      { id: "ex-2", name: "Drill B", subcategory: "wr_block", active: true },
    ];
    vi.resetModules();
  });

  it("rejects an invalid framing", async () => {
    const { status } = await invoke({ teamId: "t1", framing: "bogus" });
    expect(status).toBe(422);
  });

  it("requires a teamId", async () => {
    const { status } = await invoke({ framing: "own" });
    expect(status).toBe(422);
  });

  it("403s when the requester is not team staff", async () => {
    state.isStaff = false;
    const { status } = await invoke({ teamId: "t1", framing: "own" });
    expect(status).toBe(403);
  });

  it("returns a filled block plan for a staff member", async () => {
    const { status, json } = await invoke({
      teamId: "t1",
      framing: "own",
      minutes: 90,
    });
    expect(status).toBe(200);
    const plan = json.data ?? json;
    expect(plan.planKey).toBe("own");
    expect(Array.isArray(plan.blocks)).toBe(true);
    expect(plan.blocks.length).toBeGreaterThan(0);
    // scrimmage is the smallest slice in the build phase (safety property)
    expect(plan.drillMinutes).toBeGreaterThan(plan.scrimmageMinutes);
    // blocks were filled with drills from the (mocked) library
    const wr = plan.blocks.find((b) => b.key === "wr_block");
    expect(wr.drills.length).toBeGreaterThan(0);
  });

  it("realizes a taper-final walkthrough with zero high-CNS minutes", async () => {
    const { json } = await invoke({
      teamId: "t1",
      framing: "sharp",
      phase: "taper",
      daysOut: 1,
      minutes: 45,
    });
    const plan = json.data ?? json;
    expect(plan.planKey).toBe("walkthrough");
    expect(plan.highCnsMinutes).toBe(0);
  });
});
