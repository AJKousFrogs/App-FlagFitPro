import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  usersRow: null,
  updatedRow: null,
  calls: [],
}));

function createQuery(table) {
  const call = { table, filters: {}, method: null, payload: null };
  state.calls.push(call);

  const resolveResult = () => {
    if (table !== "users") {
      return { data: null, error: null };
    }
    if (call.method === "update") {
      return { data: state.updatedRow, error: null };
    }
    return { data: state.usersRow, error: null };
  };

  const query = {
    select: () => query,
    eq: (field, value) => {
      call.filters[field] = value;
      return query;
    },
    update: (payload) => {
      call.method = "update";
      call.payload = payload;
      return query;
    },
    maybeSingle: () => Promise.resolve(resolveResult()),
    single: () => Promise.resolve(resolveResult()),
    then: (resolve, reject) =>
      Promise.resolve(resolveResult()).then(resolve, reject),
  };
  return query;
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "user-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => createQuery(table),
  },
}));

describe("athlete-profile", () => {
  beforeEach(() => {
    vi.resetModules();
    state.usersRow = null;
    state.updatedRow = null;
    state.calls = [];
  });

  it("GET returns null when the profile has no bio fields set", async () => {
    const { handler } =
      await import("../../netlify/functions/athlete-profile.js");
    const response = await handler(
      { httpMethod: "GET", headers: { authorization: "Bearer test-token" } },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toBeNull();
  });

  it("GET maps stored columns to the athlete-facing shape", async () => {
    state.usersRow = {
      full_name: "Alice Athlete",
      date_of_birth: "2000-01-01",
      position: "QB",
      height_cm: 180,
      weight_kg: 78,
      sport: "football",
      years_experience: 5,
      medical_history: "Prior ACL 2023",
      emergency_contact_name: "John Athlete",
      emergency_contact_phone: "+1234567890",
    };

    const { handler } =
      await import("../../netlify/functions/athlete-profile.js");
    const response = await handler(
      { httpMethod: "GET", headers: { authorization: "Bearer test-token" } },
      {},
    );

    const body = JSON.parse(response.body);
    expect(body.data).toMatchObject({
      athlete_name: "Alice Athlete",
      height: 180,
      weight: 78,
      sport: "football",
    });
  });

  it("returns 422 when no recognized fields are in the POST body", async () => {
    const { handler } =
      await import("../../netlify/functions/athlete-profile.js");
    const response = await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ notARealField: "x" }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("POST maps camelCase body fields to snake_case columns", async () => {
    state.updatedRow = {
      full_name: "Alice Athlete",
      date_of_birth: "2000-01-01",
      position: "QB",
      height_cm: 180,
      weight_kg: 78,
      sport: "football",
      years_experience: 5,
      medical_history: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
    };

    const { handler } =
      await import("../../netlify/functions/athlete-profile.js");
    const response = await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          athleteName: "Alice Athlete",
          position: "QB",
          height: 180,
          weight: 78,
          sport: "football",
          yearsExperience: 5,
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const updateCall = state.calls.find(
      (c) => c.table === "users" && c.method === "update",
    );
    expect(updateCall.payload).toMatchObject({
      full_name: "Alice Athlete",
      position: "QB",
      height_cm: 180,
      weight_kg: 78,
      sport: "football",
      years_experience: 5,
    });
  });

  it("returns 422 for invalid JSON body", async () => {
    const { handler } =
      await import("../../netlify/functions/athlete-profile.js");
    const response = await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});
