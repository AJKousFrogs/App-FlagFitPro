import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  providers: [],
  pairings: [],
  readings: [],
}));

function createFakeSupabase() {
  return {
    from(table) {
      const call = { table, filters: {}, inFilters: {} };
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
        order() {
          return query;
        },
        limit() {
          return query;
        },
        then(resolve, reject) {
          let rows = [];
          if (table === "monitoring_providers") {
            rows = state.providers.filter(
              (p) =>
                call.inFilters.kind.includes(p.kind) &&
                p.is_active === call.filters.is_active,
            );
          } else if (table === "device_pairings") {
            rows = state.pairings.filter(
              (p) => p.user_id === call.filters.user_id,
            );
          } else if (table === "wearable_health") {
            rows = state.readings
              .filter((r) => r.user_id === call.filters.user_id)
              .sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1));
          }
          return Promise.resolve({ data: rows, error: null }).then(
            resolve,
            reject,
          );
        },
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

function makeEvent() {
  return { httpMethod: "GET", path: "/api/wearables/status" };
}

describe("wearables status", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    state.providers = [
      { id: "prov-garmin", key: "garmin", display_name: "Garmin", kind: "wearable", is_active: true },
      { id: "prov-oura", key: "oura", display_name: "Oura", kind: "wearable", is_active: true },
      { id: "prov-whoop", key: "whoop", display_name: "WHOOP", kind: "wearable", is_active: true },
      { id: "prov-polar", key: "polar", display_name: "Polar", kind: "both", is_active: true },
      { id: "prov-catapult", key: "catapult", display_name: "Catapult", kind: "external_load", is_active: true },
    ];
    state.pairings = [];
    state.readings = [];
    const mod = await import("../../netlify/functions/wearables.js");
    handler = mod.handler;
  });

  it("excludes GPS-vest-only providers (external_load kind, e.g. catapult) from the wearables catalogue", async () => {
    const response = await handler(makeEvent(), {});
    const body = JSON.parse(response.body);
    const ids = body.data.devices.map((d) => d.id);
    expect(ids).not.toContain("catapult");
    expect(ids).toEqual(expect.arrayContaining(["garmin", "oura", "whoop", "polar"]));
  });

  it("reports every device as disconnected when nothing is paired", async () => {
    const response = await handler(makeEvent(), {});
    const body = JSON.parse(response.body);
    for (const device of body.data.devices) {
      expect(device.connected).toBe(false);
      expect(device.lastSync).toBeNull();
    }
  });

  it("marks a device connected with its most recent reading as lastSync", async () => {
    state.pairings = [
      { user_id: "athlete-1", provider_id: "prov-garmin", is_active: true, paired_at: "2026-07-01T00:00:00Z" },
    ];
    state.readings = [
      { user_id: "athlete-1", source: "garmin", recorded_at: "2026-07-20T00:00:00Z" },
      { user_id: "athlete-1", source: "garmin", recorded_at: "2026-07-22T00:00:00Z" },
    ];

    const response = await handler(makeEvent(), {});
    const body = JSON.parse(response.body);
    const garmin = body.data.devices.find((d) => d.id === "garmin");
    expect(garmin.connected).toBe(true);
    expect(garmin.pairedAt).toBe("2026-07-01T00:00:00Z");
    expect(garmin.lastSync).toBe("2026-07-22T00:00:00Z");
  });

  it("shows disconnected when the only pairing is inactive (e.g. revoked)", async () => {
    state.pairings = [
      { user_id: "athlete-1", provider_id: "prov-oura", is_active: false, paired_at: "2026-07-01T00:00:00Z" },
    ];

    const response = await handler(makeEvent(), {});
    const body = JSON.parse(response.body);
    const oura = body.data.devices.find((d) => d.id === "oura");
    expect(oura.connected).toBe(false);
  });
});
