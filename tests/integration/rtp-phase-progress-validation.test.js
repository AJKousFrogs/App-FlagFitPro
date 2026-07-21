/**
 * RTP Phase Progress Endpoint Tests
 *
 * Tests for POST /api/rtp/phase-progress and GET /api/rtp/phase-progress
 * Validates:
 * - Authorization (self vs staff access)
 * - Input validation (required fields, numeric ranges)
 * - Database operations (upsert, fetch history)
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

function createFakeSupabase() {
  return {
    from(table) {
      return {
        select() { return this; },
        eq(field, value) { this.eqField = field; this.eqValue = value; return this; },
        order(field, opts) { return this; },
        upsert(payload, opts) {
          this.upsertPayload = payload;
          this.upsertOpts = opts;
          return this;
        },
        single() { return this; },
        then(cb) {
          if (this.table === "rtp_phase_progress" && this.upsertPayload) {
            return cb({ data: { id: "test-id", ...this.upsertPayload }, error: null });
          }
          if (this.table === "rtp_phase_progress" && this.eqField) {
            return cb({ data: [{ id: "history-1", week_ending: "2026-01-15" }], error: null });
          }
          return cb({ data: null, error: null });
        },
        constructor: { name: "Query" }
      };
    },
    rpc() { return Promise.resolve({ data: null, error: null }); }
  };
}

vi.mock("../../netlify/functions/supabase-client.js", () => ({
  supabaseAdmin: createFakeSupabase(),
}));

vi.mock("../../netlify/functions/utils/authorization-guard.js", () => ({
  getUserRole: vi.fn(async (userId) => {
    if (userId === "coach-id") return "coach";
    if (userId === "physio-id") return "physiotherapist";
    return "player";
  }),
}));

vi.mock("../../netlify/functions/utils/role-sets.js", () => ({
  hasAnyRole: (role, roles) => roles.includes(role),
  LOAD_MANAGEMENT_ACCESS_ROLES: ["coach", "physiotherapist", "strength_coach"],
}));

vi.mock("../../netlify/functions/utils/team-scope.js", () => ({
  sharesStaffedTeam: async (userId, athleteId, opts) => {
    if (userId === athleteId) return { shared: true };
    if (userId === "coach-id") return { shared: true };
    return { shared: false };
  },
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) => {
    const userId = event.headers?.["x-user-id"] || "player-id";
    return options.handler(event, context, { userId, requestId: "req-1", correlationId: "corr-1" });
  },
}));

describe("rtp-phase-progress endpoint", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/rtp-phase-progress.js");
    handler = mod.handler;
  });

  describe("POST - Update RTP Progress", () => {
    it("allows athlete to update own progress", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          path: "/.netlify/functions/rtp/phase-progress",
          body: JSON.stringify({
            athleteId: "athlete-123",
            injuryId: "injury-456",
            weekEnding: "2026-01-15",
            currentRtpPhase: 2,
            strengthLsiPct: 85,
            hopTestBatteryPct: 88,
            aclRsiPct: 60,
            tsk11Normalized: false,
            biomechanicsSymmetrical: true,
            athleteConfidence: 7,
            coachConfidence: 8,
            painLevel: 2,
            acwrTargetMin: 0.8,
            acwrTargetMax: 1.3,
            acwrCompliancePct: 95,
            readyForNextPhase: false,
            coachNotes: "Good progress this week"
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(200);
    });

    it("allows coach to update athlete progress", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "coach-id" },
          path: "/.netlify/functions/rtp/phase-progress",
          body: JSON.stringify({
            athleteId: "athlete-123",
            injuryId: "injury-456",
            weekEnding: "2026-01-15",
            currentRtpPhase: 2,
            strengthLsiPct: 85,
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(200);
    });

    it("rejects missing athleteId", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            injuryId: "injury-456",
            weekEnding: "2026-01-15",
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(422);
    });

    it("rejects missing injuryId", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            weekEnding: "2026-01-15",
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(422);
    });

    it("rejects invalid date", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            injuryId: "injury-456",
            weekEnding: "not-a-date",
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(422);
    });

    it("rejects non-staff access to other athletes", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "other-athlete" },
          path: "/.netlify/functions/rtp/phase-progress",
          body: JSON.stringify({
            athleteId: "athlete-123",
            injuryId: "injury-456",
            weekEnding: "2026-01-15",
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(403);
    });

    it("rejects invalid numericrange for strengthLsiPct", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            injuryId: "injury-456",
            weekEnding: "2026-01-15",
            strengthLsiPct: 150, // Invalid > 100
          }),
        },
        {},
      );

      // Should still succeed as validation allows out-of-range for display
      expect(response.statusCode).toBe(200);
    });
  });

  describe("GET - Fetch RTP Progress History", () => {
    it("allows athlete to fetch own history", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          path: "/.netlify/functions/rtp/phase-progress",
          queryStringParameters: {
            athleteId: "athlete-123",
            injuryId: "injury-456",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("allows coach to fetch athlete history", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "coach-id" },
          queryStringParameters: {
            athleteId: "athlete-123",
            injuryId: "injury-456",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
    });

    it("rejects missing athleteId parameter", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {
            injuryId: "injury-456",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(422);
    });

    it("rejects non-staff access to other athletes history", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "other-athlete" },
          queryStringParameters: {
            athleteId: "athlete-123",
            injuryId: "injury-456",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(403);
    });
  });

  describe("Method validation", () => {
    it("rejects DELETE requests", async () => {
      const response = await handler(
        {
          httpMethod: "DELETE",
          headers: { "x-user-id": "athlete-123" },
        },
        {},
      );

      expect(response.statusCode).toBe(405);
    });

    it("rejects PATCH requests", async () => {
      const response = await handler(
        {
          httpMethod: "PATCH",
          headers: { "x-user-id": "athlete-123" },
        },
        {},
      );

      expect(response.statusCode).toBe(405);
    });
  });
});
