import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  providers: [],
}));

function createFakeSupabase() {
  return {
    from(table) {
      const call = { table, filters: {} };
      const query = {
        select() {
          return query;
        },
        eq(field, value) {
          call.filters[field] = value;
          return query;
        },
        maybeSingle: () =>
          Promise.resolve(
            table === "monitoring_providers"
              ? {
                  data:
                    state.providers.find((p) => p.key === call.filters.key) ||
                    null,
                  error: null,
                }
              : { data: null, error: null },
          ),
      };
      return query;
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "athlete-1" }),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  get supabaseAdmin() {
    return createFakeSupabase();
  },
}));

function makeEvent(provider) {
  return {
    httpMethod: "GET",
    path: `/api/wearables/connect/${provider}`,
  };
}

describe("wearables-connect", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    process.env.URL = "https://app.example.com";
    process.env.WEARABLE_OAUTH_STATE_SECRET = "test-secret";
    delete process.env.GARMIN_OAUTH_AUTHORIZE_URL;
    delete process.env.GARMIN_OAUTH_TOKEN_URL;
    delete process.env.GARMIN_CLIENT_ID;
    delete process.env.GARMIN_CLIENT_SECRET;
    state.providers = [
      { key: "garmin", kind: "wearable", is_active: true },
    ];
    const mod = await import("../../netlify/functions/wearables-connect.js");
    handler = mod.handler;
  });

  it("rejects an unknown provider", async () => {
    const response = await handler(makeEvent("nonsense"), {});
    expect(response.statusCode).toBe(422);
  });

  it("rejects an inactive provider", async () => {
    state.providers = [{ key: "garmin", kind: "wearable", is_active: false }];
    const response = await handler(makeEvent("garmin"), {});
    expect(response.statusCode).toBe(422);
  });

  it("returns 503 when the provider isn't configured yet", async () => {
    const response = await handler(makeEvent("garmin"), {});
    expect(response.statusCode).toBe(503);
    expect(response.body).toContain("not yet configured");
  });

  it("redirects to the vendor's authorize URL with a signed state once configured", async () => {
    process.env.GARMIN_OAUTH_AUTHORIZE_URL = "https://connect.garmin.example/authorize";
    process.env.GARMIN_OAUTH_TOKEN_URL = "https://connect.garmin.example/token";
    process.env.GARMIN_CLIENT_ID = "client-abc";
    process.env.GARMIN_CLIENT_SECRET = "secret-xyz";

    const response = await handler(makeEvent("garmin"), {});
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    const location = new URL(body.data.authorizeUrl);
    expect(location.origin).toBe("https://connect.garmin.example");
    expect(location.searchParams.get("client_id")).toBe("client-abc");
    expect(location.searchParams.get("redirect_uri")).toBe(
      "https://app.example.com/api/wearables/callback/garmin",
    );
    expect(location.searchParams.get("response_type")).toBe("code");
    expect(location.searchParams.get("state")).toBeTruthy();
  });
});
