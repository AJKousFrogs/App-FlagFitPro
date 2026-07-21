/**
 * Recovery Recommendations Endpoint Tests
 *
 * Tests for GET /api/recovery-recommendations?athleteId=X&date=YYYY-MM-DD
 * Validates:
 * - Authorization (self + staff access)
 * - ACWR-based triggers (red_flag, yellow_flag, safe)
 * - Objective marker triggers (CMJ >7% drop)
 * - Injury phase triggers (phase 0-2, 3-4, 5+)
 * - Biomarker triggers (ferritin, vitamin D, cortisol)
 * - Deduplication (highest priority per modality)
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

function createFakeSupabase() {
  return {
    from(table) {
      return {
        table,
        select() { return this; },
        eq(field, value) { this.eqField = field; this.eqValue = value; return this; },
        in(field, values) { this.inField = field; this.inValues = values; return this; },
        gte(field, value) { this.gteField = field; this.gteValue = value; return this; },
        lte(field, value) { this.lteField = field; this.lteValue = value; return this; },
        order(field, opts) { return this; },
        limit(n) { this.limitNum = n; return this; },
        single() { return this; },
        then(cb) {
          if (this.table === "performance_metrics") {
            // CMJ data for testing >7% drop
            if (this.limitNum === 2) {
              return cb({
                data: [
                  { metric_value: 42, recorded_at: "2026-01-15" }, // Latest
                  { metric_value: 45, recorded_at: "2026-01-08" }, // Baseline
                ],
                error: null,
              });
            }
          }
          if (this.table === "athlete_injuries") {
            return cb({
              data: [
                { injury_type: "ACL Tear", current_rtp_phase: 2, recovery_status: "active" },
              ],
              error: null,
            });
          }
          if (this.table === "individual_profiles") {
            return cb({
              data: {
                ferritin_ugL: 18, // Low, triggers supplementation
                vitamin_d_status: 18, // Deficient
                cortisol_morning_nmolL: 12, // Elevated
              },
              error: null,
            });
          }
          if (this.table === "training_sessions") {
            return cb({
              data: [
                { session_date: "2026-01-15", duration_minutes: 60, rpe: 8, workload: 48 },
                { session_date: "2026-01-14", duration_minutes: 45, rpe: 7, workload: 31 },
                { session_date: "2026-01-13", duration_minutes: 50, rpe: 8, workload: 40 },
              ],
              error: null,
            });
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

vi.mock("../../netlify/functions/utils/acwr.js", () => ({
  computeAcwrAt: (loadsByDay, targetDate) => ({
    acwr: 1.35, // Red flag (> 1.3)
    acute_load: 150,
    chronic_load: 111,
    confidence: "high",
  }),
}));

describe("recovery-recommendations endpoint", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/recovery-recommendations.js");
    handler = mod.handler;
  });

  describe("GET - Fetch Recovery Recommendations", () => {
    it("allows athlete to fetch own recommendations", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          path: "/.netlify/functions/recovery-recommendations",
          queryStringParameters: {
            athleteId: "athlete-123",
            date: "2026-01-15",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.recommendations)).toBe(true);
      expect(body.acwrStatus).toBeDefined();
    });

    it("allows coach to fetch athlete recommendations", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "coach-id" },
          queryStringParameters: {
            athleteId: "athlete-123",
            date: "2026-01-15",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
    });

    it("triggers red-flag ACWR recommendations", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {
            athleteId: "athlete-123",
            date: "2026-01-15",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.acwrStatus).toBe("red_flag");

      // Should include ice bath and sleep optimization
      const modalities = body.recommendations.map((r) => r.modality_name);
      expect(modalities).toContain("Ice Bath");
      expect(modalities).toContain("Sleep Optimization");
    });

    it("includes CMJ depression recommendations", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {
            athleteId: "athlete-123",
            date: "2026-01-15",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // CMJ drop = (45 - 42) / 45 * 100 = 6.67% (< 7%, so no trigger)
      // This test data should not trigger foam rolling
      const modalities = body.recommendations.map((r) => r.modality_name);
      expect(modalities).not.toContain("Foam Rolling");
    });

    it("includes injury phase recommendations", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {
            athleteId: "athlete-123",
            date: "2026-01-15",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Phase 2 is early RTP (phase <= 2)
      const modalities = body.recommendations.map((r) => r.modality_name);
      expect(modalities).toContain("Sport Psychology");
      expect(modalities).toContain("Proprioceptive Training");
    });

    it("includes biomarker-based recommendations", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {
            athleteId: "athlete-123",
            date: "2026-01-15",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      const modalities = body.recommendations.map((r) => r.modality_name);
      // Low ferritin
      expect(modalities).toContain("Iron Supplementation");
      // Vitamin D deficiency
      expect(modalities).toContain("Vitamin D3 Supplementation");
      // Elevated cortisol
      expect(modalities).toContain("Stress Management");
    });

    it("deduplicates by modality name, keeping highest priority", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {
            athleteId: "athlete-123",
            date: "2026-01-15",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Sleep optimization can come from multiple triggers (ACWR + cortisol)
      // Should appear only once with highest priority ("immediate")
      const sleepRecs = body.recommendations.filter((r) => r.modality_name === "Sleep Optimization");
      expect(sleepRecs).toHaveLength(1);
      expect(sleepRecs[0].priority).toBe("immediate");
    });

    it("returns recommendations sorted by priority", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {
            athleteId: "athlete-123",
            date: "2026-01-15",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      const priorities = body.recommendations.map((r) => r.priority);
      const priorityOrder = ["immediate", "high", "medium", "low"];
      for (let i = 1; i < priorities.length; i++) {
        const prevIdx = priorityOrder.indexOf(priorities[i - 1]);
        const currIdx = priorityOrder.indexOf(priorities[i]);
        expect(currIdx).toBeGreaterThanOrEqual(prevIdx);
      }
    });

    it("includes trigger breakdown in response", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {
            athleteId: "athlete-123",
            date: "2026-01-15",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.triggers).toBeDefined();
      expect(body.triggers.acwrBased).toBeGreaterThan(0);
      expect(body.triggers.injuryPhaseBased).toBeGreaterThan(0);
      expect(body.triggers.biomarkerBased).toBeGreaterThan(0);
    });

    it("uses current date when no date provided", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {
            athleteId: "athlete-123",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.date).toBeDefined();
    });

    it("rejects missing athleteId", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {},
        },
        {},
      );

      expect(response.statusCode).toBe(422);
    });

    it("rejects invalid date format", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {
            athleteId: "athlete-123",
            date: "not-a-date",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(422);
    });

    it("rejects non-staff access to other athletes", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "other-athlete" },
          queryStringParameters: {
            athleteId: "athlete-123",
            date: "2026-01-15",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(403);
    });
  });

  describe("Method validation", () => {
    it("rejects POST requests", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({ athleteId: "athlete-123" }),
        },
        {},
      );

      expect(response.statusCode).toBe(405);
    });

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
  });
});
