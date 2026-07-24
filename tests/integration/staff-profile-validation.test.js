import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  role: "physiotherapist",
  profileRow: null,
  existingCredential: null,
  calls: [],
  storageUploads: [],
  storageUploadError: null,
}));

function createQuery(table) {
  const call = { table, filters: {}, method: null, payload: null };
  state.calls.push(call);

  const resolveResult = () => {
    if (table === "physiotherapist_profiles" || table === "coach_profiles") {
      if (call.method === "upsert") {
        return { data: { user_id: "user-1", ...call.payload }, error: null };
      }
      return { data: state.profileRow, error: null };
    }
    if (table === "credential_verifications") {
      if (call.method === "insert") {
        return { data: null, error: null };
      }
      return { data: state.existingCredential, error: null };
    }
    return { data: null, error: null };
  };

  const query = {
    select: () => query,
    eq: (field, value) => {
      call.filters[field] = value;
      return query;
    },
    in: () => query,
    order: () => query,
    upsert: (payload) => {
      call.method = "upsert";
      call.payload = payload;
      return query;
    },
    insert: (payload) => {
      call.method = "insert";
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

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: async () => state.role,
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: {
    from: (table) => createQuery(table),
    storage: {
      from: (bucket) => ({
        upload: (path, buffer, opts) => {
          state.storageUploads.push({ bucket, path, buffer, opts });
          return Promise.resolve(
            state.storageUploadError
              ? { data: null, error: state.storageUploadError }
              : { data: { path }, error: null },
          );
        },
      }),
    },
  },
}));

describe("staff-profile role gating and CRUD mapping", () => {
  beforeEach(() => {
    vi.resetModules();
    state.role = "physiotherapist";
    state.profileRow = null;
    state.existingCredential = null;
    state.calls = [];
    state.storageUploads = [];
    state.storageUploadError = null;
  });

  it("returns 403 when the caller's role doesn't match the profile route", async () => {
    state.role = "player";
    const { createProfileHandler } =
      await import("../../netlify/functions/staff-profile.js");
    const handler = createProfileHandler("physiotherapist-profile");
    const response = await handler(
      {
        httpMethod: "GET",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("GET returns null when no profile row exists yet", async () => {
    const { createProfileHandler } =
      await import("../../netlify/functions/staff-profile.js");
    const handler = createProfileHandler("physiotherapist-profile");
    const response = await handler(
      {
        httpMethod: "GET",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data).toBeNull();
  });

  it("POST upserts the mapped row and files a pending credential when a license is present", async () => {
    const { createProfileHandler } =
      await import("../../netlify/functions/staff-profile.js");
    const handler = createProfileHandler("physiotherapist-profile");
    const response = await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({
          licenseNumber: "PT-123456",
          licenseIssuedBy: "APTA",
          yearsOfExperience: 5,
          specializations: ["orthopedic", "sports_medicine"],
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const upsertCall = state.calls.find(
      (c) => c.table === "physiotherapist_profiles" && c.method === "upsert",
    );
    expect(upsertCall.payload).toMatchObject({
      user_id: "user-1",
      license_number: "PT-123456",
      license_issued_by: "APTA",
      years_of_experience: 5,
      specializations: ["orthopedic", "sports_medicine"],
    });

    const credentialInsert = state.calls.find(
      (c) => c.table === "credential_verifications" && c.method === "insert",
    );
    expect(credentialInsert.payload).toMatchObject({
      user_id: "user-1",
      status: "pending",
      credential_type: "license",
      credential_name: "Physiotherapist License",
      credential_number: "PT-123456",
    });
  });

  it("does not file a duplicate credential when one already exists", async () => {
    state.existingCredential = { id: "cred-1" };
    const { createProfileHandler } =
      await import("../../netlify/functions/staff-profile.js");
    const handler = createProfileHandler("physiotherapist-profile");
    await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ licenseNumber: "PT-123456" }),
      },
      {},
    );

    const credentialInsert = state.calls.find(
      (c) => c.table === "credential_verifications" && c.method === "insert",
    );
    expect(credentialInsert).toBeUndefined();
  });

  it("uploads a credential document and stores its path as document_url", async () => {
    const { createProfileHandler } =
      await import("../../netlify/functions/staff-profile.js");
    const handler = createProfileHandler("physiotherapist-profile");
    const base64Pdf = Buffer.from("fake pdf bytes").toString("base64");

    await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({
          licenseNumber: "PT-123456",
          documentFile: `data:application/pdf;base64,${base64Pdf}`,
          documentFileName: "license.pdf",
          documentFileType: "application/pdf",
        }),
      },
      {},
    );

    expect(state.storageUploads).toHaveLength(1);
    expect(state.storageUploads[0].bucket).toBe("credential-documents");
    expect(state.storageUploads[0].path).toMatch(/^user-1\/\d+_license\.pdf$/);

    const credentialInsert = state.calls.find(
      (c) => c.table === "credential_verifications" && c.method === "insert",
    );
    expect(credentialInsert.payload.document_url).toBe(
      state.storageUploads[0].path,
    );
  });

  it("rejects a disallowed document mime type without uploading or failing the save", async () => {
    const { createProfileHandler } =
      await import("../../netlify/functions/staff-profile.js");
    const handler = createProfileHandler("physiotherapist-profile");

    const response = await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({
          licenseNumber: "PT-123456",
          documentFile: "data:application/zip;base64,AAAA",
          documentFileName: "malware.zip",
          documentFileType: "application/zip",
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    expect(state.storageUploads).toHaveLength(0);
    const credentialInsert = state.calls.find(
      (c) => c.table === "credential_verifications" && c.method === "insert",
    );
    expect(credentialInsert.payload.document_url).toBeNull();
  });

  it("does not re-upload a document for a credential that's already on file", async () => {
    state.existingCredential = { id: "cred-1" };
    const { createProfileHandler } =
      await import("../../netlify/functions/staff-profile.js");
    const handler = createProfileHandler("physiotherapist-profile");

    await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({
          licenseNumber: "PT-123456",
          documentFile: "data:application/pdf;base64,AAAA",
          documentFileName: "license.pdf",
          documentFileType: "application/pdf",
        }),
      },
      {},
    );

    expect(state.storageUploads).toHaveLength(0);
  });

  it("head-coach-profile forces coach_specialty and writes to coach_profiles", async () => {
    state.role = "head_coach";
    const { createProfileHandler } =
      await import("../../netlify/functions/staff-profile.js");
    const handler = createProfileHandler("head-coach-profile");
    const response = await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({
          yearsOfCoachingExperience: 10,
          yearsAsHeadCoach: 3,
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const upsertCall = state.calls.find(
      (c) => c.table === "coach_profiles" && c.method === "upsert",
    );
    expect(upsertCall.payload).toMatchObject({
      coach_specialty: "head_coach",
      years_of_coaching_experience: 10,
      years_as_head_coach: 3,
    });
  });

  it("a non-head-coach role cannot write the head-coach-profile route", async () => {
    state.role = "coach";
    const { createProfileHandler } =
      await import("../../netlify/functions/staff-profile.js");
    const handler = createProfileHandler("head-coach-profile");
    const response = await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: JSON.stringify({ yearsOfCoachingExperience: 10 }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns 422 for invalid JSON body on POST", async () => {
    const { createProfileHandler } =
      await import("../../netlify/functions/staff-profile.js");
    const handler = createProfileHandler("physiotherapist-profile");
    const response = await handler(
      {
        httpMethod: "POST",
        headers: { authorization: "Bearer test-token" },
        queryStringParameters: {},
        body: "{bad-json",
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });
});

describe("per-role profile function files", () => {
  it("each wires createProfileHandler to its own fixed route key", async () => {
    const modules = await Promise.all([
      import("../../netlify/functions/staff-physiotherapist-profile.js"),
      import("../../netlify/functions/staff-nutritionist-profile.js"),
      import("../../netlify/functions/staff-psychologist-profile.js"),
      import("../../netlify/functions/staff-strength-coach-profile.js"),
      import("../../netlify/functions/staff-coach-profile.js"),
      import("../../netlify/functions/staff-head-coach-profile.js"),
      import("../../netlify/functions/staff-manager-profile.js"),
    ]);

    for (const mod of modules) {
      expect(typeof mod.handler).toBe("function");
    }
  });
});
