import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOAuthState } from "../../netlify/functions/utils/wearable-oauth-state.js";

const state = vi.hoisted(() => ({
  providers: [],
  devicePairings: [],
  upserts: [],
  updates: [],
  inserts: [],
  tokenExchangeResult: null,
  tokenExchangeShouldThrow: false,
  externalAthleteIdResult: null,
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
        is(field, value) {
          call.filters[field] = value; // value is null in practice
          return query;
        },
        upsert(payload) {
          state.upserts.push(payload);
          return Promise.resolve({ data: null, error: null });
        },
        update(payload) {
          call.updatePayload = payload;
          return query;
        },
        insert(payload) {
          state.inserts.push(payload);
          return Promise.resolve({ data: null, error: null });
        },
        maybeSingle: () => {
          if (table === "monitoring_providers") {
            const match = state.providers.find(
              (p) => p.key === call.filters.key,
            );
            return Promise.resolve({ data: match || null, error: null });
          }
          if (table === "device_pairings") {
            const match = state.devicePairings.find(
              (p) =>
                p.user_id === call.filters.user_id &&
                p.provider_id === call.filters.provider_id &&
                p.external_athlete_id === null,
            );
            return Promise.resolve({ data: match || null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        then(resolve, reject) {
          // .update(...).eq(...) chain resolution
          if (call.updatePayload) {
            state.updates.push({ filters: { ...call.filters }, payload: call.updatePayload });
            return Promise.resolve({ data: null, error: null }).then(resolve, reject);
          }
          return Promise.resolve({ data: null, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) => options.handler(event, context, {}),
}));

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  get supabaseAdmin() {
    return createFakeSupabase();
  },
}));

vi.mock("../../netlify/functions/utils/wearable-oauth-client.js", () => ({
  exchangeCodeForTokens: async () => {
    if (state.tokenExchangeShouldThrow) {
      throw new Error("token exchange blew up");
    }
    return state.tokenExchangeResult;
  },
  fetchExternalAthleteId: async () => state.externalAthleteIdResult,
}));

function makeEvent(provider, query) {
  return {
    httpMethod: "GET",
    path: `/api/wearables/callback/${provider}`,
    queryStringParameters: query,
  };
}

describe("wearables-callback", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    process.env.URL = "https://app.example.com";
    process.env.WEARABLE_OAUTH_STATE_SECRET = "test-secret";
    process.env.WEARABLE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 3).toString(
      "base64",
    );
    process.env.GARMIN_OAUTH_AUTHORIZE_URL = "https://connect.garmin.example/authorize";
    process.env.GARMIN_OAUTH_TOKEN_URL = "https://connect.garmin.example/token";
    process.env.GARMIN_CLIENT_ID = "client-abc";
    process.env.GARMIN_CLIENT_SECRET = "secret-xyz";

    state.providers = [{ key: "garmin", id: "prov-garmin" }];
    state.devicePairings = [];
    state.upserts = [];
    state.updates = [];
    state.inserts = [];
    state.tokenExchangeShouldThrow = false;
    state.tokenExchangeResult = {
      accessToken: "access-123",
      refreshToken: "refresh-456",
      expiresInSeconds: 3600,
      scope: "activity",
      externalUserId: "ext-athlete-1",
    };
    state.externalAthleteIdResult = null;

    const mod = await import("../../netlify/functions/wearables-callback.js");
    handler = mod.handler;
  });

  it("requires code and state", async () => {
    const response = await handler(makeEvent("garmin", {}), {});
    expect(response.statusCode).toBe(422);
  });

  it("surfaces a vendor-denied error param", async () => {
    const response = await handler(
      makeEvent("garmin", { error: "access_denied" }),
      {},
    );
    expect(response.statusCode).toBe(400);
    expect(response.body).toContain("access_denied");
  });

  it("rejects an invalid/tampered state", async () => {
    const response = await handler(
      makeEvent("garmin", { code: "abc", state: "not-a-real-state" }),
      {},
    );
    expect(response.statusCode).toBe(400);
  });

  it("rejects a state issued for a different provider", async () => {
    const wrongProviderState = createOAuthState("user-1", "oura");
    const response = await handler(
      makeEvent("garmin", { code: "abc", state: wrongProviderState }),
      {},
    );
    expect(response.statusCode).toBe(400);
  });

  it("exchanges the code, encrypts tokens, and upserts the pairing", async () => {
    const goodState = createOAuthState("user-1", "garmin");
    const response = await handler(
      makeEvent("garmin", { code: "auth-code-1", state: goodState }),
      {},
    );

    expect(response.statusCode).toBe(302);
    expect(response.headers.Location).toContain("/device-data?connected=garmin");
    expect(state.upserts).toHaveLength(1);
    const row = state.upserts[0];
    expect(row.user_id).toBe("user-1");
    expect(row.external_athlete_id).toBe("ext-athlete-1");
    expect(row.access_token_encrypted).not.toBe("access-123");
    expect(row.access_token_encrypted).toBeTruthy();
    expect(row.refresh_token_encrypted).toBeTruthy();
    expect(row.is_active).toBe(true);
  });

  it("returns 502 without saving anything when token exchange fails", async () => {
    state.tokenExchangeShouldThrow = true;
    const goodState = createOAuthState("user-1", "garmin");
    const response = await handler(
      makeEvent("garmin", { code: "auth-code-1", state: goodState }),
      {},
    );
    expect(response.statusCode).toBe(502);
    expect(state.upserts).toHaveLength(0);
  });

  it("falls back to updating an existing NULL-external-id pairing when the vendor gives no id", async () => {
    state.tokenExchangeResult = {
      accessToken: "access-999",
      refreshToken: null,
      expiresInSeconds: null,
      scope: null,
      externalUserId: null,
    };
    state.devicePairings = [
      { user_id: "user-1", provider_id: "prov-garmin", external_athlete_id: null, id: "pairing-1" },
    ];

    const goodState = createOAuthState("user-1", "garmin");
    const response = await handler(
      makeEvent("garmin", { code: "auth-code-1", state: goodState }),
      {},
    );

    expect(response.statusCode).toBe(302);
    expect(state.upserts).toHaveLength(0);
    expect(state.updates).toHaveLength(1);
  });
});
