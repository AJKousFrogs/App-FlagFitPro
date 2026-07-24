import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "admin",
  credentials: [],
  users: [],
  members: [],
  memberForCredentialUser: null,
  updatePayloads: [],
  profileUpdatePayloads: [],
  signedUrlError: null,
}));

function createQuery(table) {
  const call = { table, filters: {}, method: null, payload: null };

  const resolveResult = () => {
    if (table === "credential_verifications") {
      if (call.method === "update") {
        state.updatePayloads.push({ id: call.filters.id, payload: call.payload });
        return { data: null, error: null };
      }
      if (call.filters.id) {
        const found = state.credentials.find((c) => c.id === call.filters.id);
        return { data: found || null, error: null };
      }
      let rows = state.credentials;
      if (call.filters.status) {
        rows = rows.filter((c) => c.status === call.filters.status);
      }
      return { data: rows, error: null };
    }
    if (table === "users") {
      return { data: state.users, error: null };
    }
    if (table === "team_members") {
      if (call.method === "single-lookup") {
        return { data: state.memberForCredentialUser, error: null };
      }
      return { data: state.members, error: null };
    }
    if (table.endsWith("_profiles")) {
      if (call.method === "update") {
        state.profileUpdatePayloads.push({ table, payload: call.payload });
      }
      return { data: null, error: null };
    }
    return { data: null, error: null };
  };

  const query = {
    select: () => query,
    eq: (field, value) => {
      call.filters[field] = value;
      if (table === "team_members" && field === "user_id") {
        call.method = "single-lookup";
      }
      return query;
    },
    in: () => query,
    order: () => query,
    limit: () => query,
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
    options.handler(event, context, { userId: "admin-1" }),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => state.role,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => createQuery(table),
    storage: {
      from: () => ({
        createSignedUrl: () =>
          Promise.resolve(
            state.signedUrlError
              ? { data: null, error: state.signedUrlError }
              : { data: { signedUrl: "https://signed.example/doc.pdf" }, error: null },
          ),
      }),
    },
  },
}));

describe("admin-credentials", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.role = "admin";
    state.credentials = [];
    state.users = [];
    state.members = [];
    state.memberForCredentialUser = null;
    state.updatePayloads = [];
    state.profileUpdatePayloads = [];
    state.signedUrlError = null;
    const mod = await import("../../netlify/functions/admin-credentials.js");
    handler = mod.handler;
  });

  it("returns 403 for a non-admin caller", async () => {
    state.role = "physiotherapist";
    const response = await handler(
      { httpMethod: "GET", headers: { authorization: "Bearer test-token" }, queryStringParameters: {} },
      {},
    );
    expect(response.statusCode).toBe(403);
  });

  it("lists credentials joined with user name and role", async () => {
    state.credentials = [
      {
        id: "cred-1",
        user_id: "user-1",
        status: "pending",
        credential_type: "license",
        credential_name: "Physiotherapist License",
      },
    ];
    state.users = [{ id: "user-1", full_name: "Alice Athlete" }];
    state.members = [{ user_id: "user-1", role: "physiotherapist" }];

    const response = await handler(
      {
        httpMethod: "GET",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { status: "pending" },
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.credentials).toHaveLength(1);
    expect(body.data.credentials[0]).toMatchObject({
      user_name: "Alice Athlete",
      user_role: "physiotherapist",
    });
  });

  it("returns a signed document URL", async () => {
    state.credentials = [
      { id: "cred-1", user_id: "user-1", document_url: "user-1/123_license.pdf" },
    ];

    const response = await handler(
      {
        httpMethod: "GET",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: { documentUrlFor: "cred-1" },
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.signedUrl).toBe("https://signed.example/doc.pdf");
  });

  it("verify flips status and updates the matching profile table", async () => {
    state.credentials = [{ id: "cred-1", user_id: "user-1" }];
    state.memberForCredentialUser = { role: "physiotherapist" };

    const response = await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ id: "cred-1", action: "verify" }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(state.updatePayloads[0].payload).toMatchObject({
      status: "verified",
      verified_by: "admin-1",
    });
    expect(state.profileUpdatePayloads[0]).toMatchObject({
      table: "physiotherapist_profiles",
      payload: { credentials_verified: true },
    });
  });

  it("reject stores the reason and does not touch any profile table", async () => {
    state.credentials = [{ id: "cred-1", user_id: "user-1" }];

    const response = await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          id: "cred-1",
          action: "reject",
          reason: "Expired license",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(state.updatePayloads[0].payload).toMatchObject({
      status: "rejected",
      rejected_reason: "Expired license",
    });
    expect(state.profileUpdatePayloads).toHaveLength(0);
  });

  it("returns 404 for an unknown credential id", async () => {
    const response = await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ id: "nope", action: "verify" }),
      },
      {},
    );
    expect(response.statusCode).toBe(404);
  });

  it("returns 422 for an unknown action", async () => {
    state.credentials = [{ id: "cred-1", user_id: "user-1" }];
    const response = await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({ id: "cred-1", action: "delete" }),
      },
      {},
    );
    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid JSON body", async () => {
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
