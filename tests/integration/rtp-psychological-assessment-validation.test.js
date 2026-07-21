/**
 * RTP Psychological Assessment Endpoint Tests
 *
 * Tests for POST /api/rtp/psychological-assessment and GET /api/rtp/psychological-assessment
 * Validates:
 * - Authorization (athletes + psychologist/coach staff)
 * - Input validation (ACL-RSI 0-100, TSK-11 11-55, confidence 1-10)
 * - Readiness gates (ACL-RSI ≥56, TSK-11 <37)
 * - Database operations (upsert, fetch history)
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
        order(field, opts) { this.orderField = field; this.orderOpts = opts; return this; },
        limit(n) { this.limitNum = n; return this; },
        upsert(payload, opts) {
          this.upsertPayload = payload;
          this.upsertOpts = opts;
          return this;
        },
        single() { return this; },
        then(cb) {
          if (this.table === "psychological_assessments" && this.upsertPayload) {
            return cb({ data: { id: "test-id", ...this.upsertPayload }, error: null });
          }
          if (this.table === "psychological_assessments" && this.eqField) {
            return cb({
              data: [
                { id: "hist-1", assessment_date: "2026-01-15", acl_rsi_score: 60, tsk11_score: 35 },
                { id: "hist-2", assessment_date: "2026-01-08", acl_rsi_score: 55, tsk11_score: 38 },
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
    if (userId === "psych-id") return "sport_psychologist";
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
    if (userId === "psych-id") return { shared: true };
    return { shared: false };
  },
}));

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) => {
    const userId = event.headers?.["x-user-id"] || "player-id";
    return options.handler(event, context, { userId, requestId: "req-1", correlationId: "corr-1" });
  },
}));

describe("rtp-psychological-assessment endpoint", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/rtp-psychological-assessment.js");
    handler = mod.handler;
  });

  describe("POST - Log Psychological Assessment", () => {
    it("allows athlete to log own assessment", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            assessmentDate: "2026-01-15",
            injuryId: "injury-456",
            aclRsiScore: 60,
            tsk11Score: 35,
            confidence: 8,
            copingStrategies: "Positive self-talk, breathing exercises",
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.readinessStatus.aclRsiReady).toBe(true); // 60 >= 56
      expect(body.readinessStatus.tsk11Ready).toBe(true); // 35 < 37
      expect(body.readinessStatus.overallReady).toBe(true);
    });

    it("flags ACL-RSI readiness correctly", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            assessmentDate: "2026-01-15",
            aclRsiScore: 55, // Just below threshold
            tsk11Score: 35,
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.readinessStatus.aclRsiReady).toBe(false); // 55 < 56
    });

    it("flags TSK-11 readiness correctly", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            assessmentDate: "2026-01-15",
            aclRsiScore: 60,
            tsk11Score: 37, // At boundary
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.readinessStatus.tsk11Ready).toBe(false); // 37 >= 37 (needs < 37)
    });

    it("allows coach to log assessment for athlete", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "coach-id" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            assessmentDate: "2026-01-15",
            aclRsiScore: 60,
            tsk11Score: 35,
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(200);
    });

    it("allows psychologist to log assessment", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "psych-id" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            assessmentDate: "2026-01-15",
            aclRsiScore: 60,
            tsk11Score: 35,
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
            assessmentDate: "2026-01-15",
            aclRsiScore: 60,
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(422); // Validation error
    });

    it("rejects missing assessmentDate", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            aclRsiScore: 60,
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(422);
    });

    it("rejects invalid assessmentDate", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            assessmentDate: "not-a-date",
            aclRsiScore: 60,
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(422);
    });

    it("rejects ACL-RSI score out of range (< 0)", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            assessmentDate: "2026-01-15",
            aclRsiScore: -1,
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(422);
    });

    it("rejects ACL-RSI score out of range (> 100)", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            assessmentDate: "2026-01-15",
            aclRsiScore: 101,
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(422);
    });

    it("rejects TSK-11 score out of range (< 11)", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            assessmentDate: "2026-01-15",
            tsk11Score: 10,
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(422);
    });

    it("rejects TSK-11 score out of range (> 55)", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            assessmentDate: "2026-01-15",
            tsk11Score: 56,
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(422);
    });

    it("rejects confidence out of range", async () => {
      const response = await handler(
        {
          httpMethod: "POST",
          headers: { "x-user-id": "athlete-123" },
          body: JSON.stringify({
            athleteId: "athlete-123",
            assessmentDate: "2026-01-15",
            confidence: 11,
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
          body: JSON.stringify({
            athleteId: "athlete-123",
            assessmentDate: "2026-01-15",
            aclRsiScore: 60,
          }),
        },
        {},
      );

      expect(response.statusCode).toBe(403);
    });
  });

  describe("GET - Fetch Assessment History", () => {
    it("allows athlete to fetch own history", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {
            athleteId: "athlete-123",
            limit: "10",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.latestStatus).toBeDefined();
    });

    it("computes latest readiness status from history", async () => {
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
      expect(body.latestStatus.aclRsiReady).toBe(true); // 60 >= 56
      expect(body.latestStatus.tsk11Ready).toBe(true); // 35 < 37
    });

    it("allows coach to fetch athlete history", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "coach-id" },
          queryStringParameters: {
            athleteId: "athlete-123",
          },
        },
        {},
      );

      expect(response.statusCode).toBe(200);
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

    it("rejects invalid limit parameter", async () => {
      const response = await handler(
        {
          httpMethod: "GET",
          headers: { "x-user-id": "athlete-123" },
          queryStringParameters: {
            athleteId: "athlete-123",
            limit: "999", // Out of range
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
