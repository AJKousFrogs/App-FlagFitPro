import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  userId: "user-1",
}));

const dbState = vi.hoisted(() => ({
  hasTeamMembership: false,
  privacyUpsertError: null,
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: authState.userId }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => {
  const supabaseClient = {
    from: (table) => {
      if (table === "team_members") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () => ({
                  maybeSingle: async () => ({
                    data: dbState.hasTeamMembership ? { team_id: "team-1" } : null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }

      if (table === "privacy_audit_log") {
        return {
          insert: async () => ({ error: null }),
        };
      }

      if (table === "privacy_settings") {
        return {
          upsert: async () => ({ error: dbState.privacyUpsertError }),
        };
      }

      if (table === "team_sharing_settings") {
        return {
          upsert: async () => ({ error: null }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { code: "PGRST116" } }),
          }),
        }),
      };
    },
  };

  return {
    getSupabaseClient: () => supabaseClient,
  };
});

describe("privacy-settings validation and authorization hardening", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    authState.userId = "user-1";
    dbState.hasTeamMembership = false;
    dbState.privacyUpsertError = null;
    ({ handler } = await import("../../netlify/functions/privacy-settings.js"));
  });

  it("returns 422 for non-object JSON body", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/privacy-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify(["bad"]),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 422 for invalid emergencySharingLevel", async () => {
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/privacy-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          settings: {
            emergencySharingLevel: "invalid-level",
          },
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(422);
  });

  it("returns 403 when user is not a member of teamId for team settings update", async () => {
    dbState.hasTeamMembership = false;
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/privacy-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          teamId: "team-1",
          teamSettings: {
            performanceSharingEnabled: true,
          },
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(403);
  });

  it("returns sanitized 500 when privacy settings upsert fails", async () => {
    dbState.privacyUpsertError = { message: "sensitive db details" };
    const response = await handler(
      {
        httpMethod: "PUT",
        path: "/.netlify/functions/privacy-settings",
        headers: { authorization: "Bearer test-token" },
        body: JSON.stringify({
          settings: {
            researchOptIn: true,
          },
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.body);
    expect(payload.error?.code).toBe("database_error");
    expect(payload.error?.message).toBe("Failed to update privacy settings");
    expect(payload.error?.details).toBeFalsy();
  });
});
