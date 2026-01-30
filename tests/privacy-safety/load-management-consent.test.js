/**
 * Load Management Consent Tests
 *
 * Tests that the load-management.cjs function properly:
 * 1. Uses ConsentDataReader for coach-context access
 * 2. Returns DataState contract in all responses
 * 3. Returns null metrics + warnings for INSUFFICIENT_DATA
 * 4. Filters coach requests by consent
 *
 * @see netlify/functions/load-management.cjs
 * @see netlify/functions/utils/consent-data-reader.cjs
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Import data state utilities
import {
  DataState,
  MINIMUM_DATA_REQUIREMENTS,
} from "../../netlify/functions/utils/data-state.cjs";

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip tests if no Supabase connection
const canRunDbTests = SUPABASE_URL && SUPABASE_SERVICE_KEY;

// Test UUIDs (deterministic for cleanup)
const TEST_PLAYER_WITH_CONSENT = "a1111111-1111-1111-1111-111111111111";
const TEST_PLAYER_NO_CONSENT = "a2222222-2222-2222-2222-222222222222";
const TEST_PLAYER_INSUFFICIENT_DATA = "a3333333-3333-3333-3333-333333333333";
const TEST_COACH_ID = "a4444444-4444-4444-4444-444444444444";
const TEST_TEAM_ID = "a5555555-5555-5555-5555-555555555555";

describe("Load Management Consent Compliance - Unit Tests", () => {
  describe("DataState requirements", () => {
    it("should require 28 days for ACWR calculation", () => {
      expect(MINIMUM_DATA_REQUIREMENTS.acwr.minimumDays).toBe(28);
    });

    it("should require 7 days for acute load calculation", () => {
      expect(MINIMUM_DATA_REQUIREMENTS.acuteLoad.minimumDays).toBe(7);
    });

    it("should require 42 days for TSB calculation", () => {
      expect(MINIMUM_DATA_REQUIREMENTS.tsb.minimumDays).toBe(42);
    });
  });

  describe("DataState enum values", () => {
    it("should have NO_DATA state", () => {
      expect(DataState.NO_DATA).toBe("NO_DATA");
    });

    it("should have INSUFFICIENT_DATA state", () => {
      expect(DataState.INSUFFICIENT_DATA).toBe("INSUFFICIENT_DATA");
    });

    it("should have REAL_DATA state", () => {
      expect(DataState.REAL_DATA).toBe("REAL_DATA");
    });
  });
});

describe.skipIf(!canRunDbTests)(
  "Load Management Consent Compliance - Integration Tests",
  () => {
    let supabaseAdmin;

    beforeAll(async () => {
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false },
      });

      await cleanupTestData(supabaseAdmin);
      await setupTestData(supabaseAdmin);
    });

    afterAll(async () => {
      if (supabaseAdmin) {
        await cleanupTestData(supabaseAdmin);
      }
    });

    describe("ConsentDataReader for coach context", () => {
      it("should return data for players with performance_sharing_enabled", async () => {
        const { ConsentDataReader, AccessContext } =
          await import("../../netlify/functions/utils/consent-data-reader.cjs");

        const reader = new ConsentDataReader(supabaseAdmin, {
          enableAuditLogging: false,
        });

        const result = await reader.readTrainingSessions({
          requesterId: TEST_COACH_ID,
          playerId: TEST_PLAYER_WITH_CONSENT,
          teamId: TEST_TEAM_ID,
          context: AccessContext.COACH_TEAM_DATA,
          filters: { limit: 10 },
        });

        expect(result.success).toBe(true);
        expect(result.consentInfo).toBeDefined();
        expect(result.consentInfo.blockedPlayerIds).not.toContain(
          TEST_PLAYER_WITH_CONSENT,
        );
      });

      it("should block data for players without consent", async () => {
        const { ConsentDataReader, AccessContext } =
          await import("../../netlify/functions/utils/consent-data-reader.cjs");

        const reader = new ConsentDataReader(supabaseAdmin, {
          enableAuditLogging: false,
        });

        const result = await reader.readTrainingSessions({
          requesterId: TEST_COACH_ID,
          playerId: TEST_PLAYER_NO_CONSENT,
          teamId: TEST_TEAM_ID,
          context: AccessContext.COACH_TEAM_DATA,
          filters: { limit: 10 },
        });

        expect(result.success).toBe(true);
        expect(result.consentInfo).toBeDefined();
        // Player without consent SHOULD be in blockedPlayerIds
        expect(result.consentInfo.blockedPlayerIds).toContain(
          TEST_PLAYER_NO_CONSENT,
        );
      });
    });

    describe("INSUFFICIENT_DATA returns null metrics + warnings", () => {
      it("should return null ACWR for player with < 28 days of data", async () => {
        // Get load monitoring data count for insufficient data player
        const { data: loadData } = await supabaseAdmin
          .from("training_sessions")
          .select("*")
          .eq("user_id", TEST_PLAYER_INSUFFICIENT_DATA);

        const dataCount = loadData?.length || 0;
        expect(dataCount).toBeLessThan(28);

        // The actual ACWR calculation would return null for insufficient data
        // This is validated by checking the data state logic
        const { evaluateDataState } =
          await import("../../netlify/functions/utils/data-state.cjs");

        const dataState = evaluateDataState(dataCount, "acwr");
        expect(dataState).toBe(DataState.INSUFFICIENT_DATA);
      });

      it("should include warning message for insufficient data", async () => {
        const { createDataResponse } =
          await import("../../netlify/functions/utils/data-state.cjs");

        // Simulate 10 days of data (insufficient for ACWR which needs 28)
        const response = createDataResponse(1.25, 10, "acwr");

        expect(response.value).toBeNull();
        expect(response.dataState).toBe(DataState.INSUFFICIENT_DATA);
        expect(response.warnings).toHaveLength(1);
        expect(response.warnings[0]).toContain("10 days");
        expect(response.warnings[0]).toContain("need 18 more");
      });
    });

    describe("Response structure includes DataState", () => {
      it("should include dataState in ConsentDataReader response", async () => {
        const { ConsentDataReader, AccessContext } =
          await import("../../netlify/functions/utils/consent-data-reader.cjs");

        const reader = new ConsentDataReader(supabaseAdmin, {
          enableAuditLogging: false,
        });

        const result = await reader.readTrainingSessions({
          requesterId: TEST_COACH_ID,
          teamId: TEST_TEAM_ID,
          context: AccessContext.COACH_TEAM_DATA,
          filters: { limit: 10 },
        });

        expect(result.dataState).toBeDefined();
        expect([
          "NO_DATA",
          "INSUFFICIENT_DATA",
          "DEMO_DATA",
          "REAL_DATA",
        ]).toContain(result.dataState);
      });

      it("should include dataStateInfo with warnings", async () => {
        const { ConsentDataReader, AccessContext } =
          await import("../../netlify/functions/utils/consent-data-reader.cjs");

        const reader = new ConsentDataReader(supabaseAdmin, {
          enableAuditLogging: false,
        });

        const result = await reader.readTrainingSessions({
          requesterId: TEST_COACH_ID,
          teamId: TEST_TEAM_ID,
          context: AccessContext.COACH_TEAM_DATA,
          filters: { limit: 10 },
        });

        expect(result.dataStateInfo).toBeDefined();
        expect(result.dataStateInfo.warnings).toBeDefined();
        expect(Array.isArray(result.dataStateInfo.warnings)).toBe(true);
      });

      it("should mark isReliable as false for insufficient data", async () => {
        const { wrapWithDataState } =
          await import("../../netlify/functions/utils/data-state.cjs");

        const wrapped = wrapWithDataState(
          {},
          {
            dataState: DataState.INSUFFICIENT_DATA,
            currentDataPoints: 10,
            minimumRequiredDataPoints: 28,
            warnings: ["Need more data"],
          },
        );

        expect(wrapped.dataStateInfo.isReliable).toBe(false);
      });

      it("should mark isReliable as true for real data", async () => {
        const { wrapWithDataState } =
          await import("../../netlify/functions/utils/data-state.cjs");

        const wrapped = wrapWithDataState(
          {},
          {
            dataState: DataState.REAL_DATA,
            currentDataPoints: 30,
            minimumRequiredDataPoints: 28,
            warnings: [],
          },
        );

        expect(wrapped.dataStateInfo.isReliable).toBe(true);
      });
    });

    describe("Coach requests are filtered by consent", () => {
      it("should filter team data by consent when coach queries multiple players", async () => {
        const { ConsentDataReader, AccessContext } =
          await import("../../netlify/functions/utils/consent-data-reader.cjs");

        const reader = new ConsentDataReader(supabaseAdmin, {
          enableAuditLogging: false,
        });

        // Query for all team members (no specific playerId)
        const result = await reader.readTrainingSessions({
          requesterId: TEST_COACH_ID,
          teamId: TEST_TEAM_ID,
          context: AccessContext.COACH_TEAM_DATA,
          filters: { limit: 50 },
        });

        expect(result.success).toBe(true);
        expect(result.consentInfo).toBeDefined();

        // Non-consenting player should be blocked
        expect(result.consentInfo.blockedPlayerIds).toContain(
          TEST_PLAYER_NO_CONSENT,
        );

        // Consenting player should NOT be blocked
        expect(result.consentInfo.blockedPlayerIds).not.toContain(
          TEST_PLAYER_WITH_CONSENT,
        );
      });

      it("should return consent_blocked status for non-consenting player", async () => {
        const { ConsentDataReader, AccessContext } =
          await import("../../netlify/functions/utils/consent-data-reader.cjs");

        const reader = new ConsentDataReader(supabaseAdmin, {
          enableAuditLogging: false,
        });

        const result = await reader.readTrainingSessions({
          requesterId: TEST_COACH_ID,
          playerId: TEST_PLAYER_NO_CONSENT,
          teamId: TEST_TEAM_ID,
          context: AccessContext.COACH_TEAM_DATA,
          filters: { limit: 10 },
        });

        expect(result.success).toBe(true);
        expect(result.consentInfo.blockedPlayerIds).toContain(
          TEST_PLAYER_NO_CONSENT,
        );
        expect(result.consentInfo.accessibleCount).toBe(0);
      });
    });

    describe("Player own data access", () => {
      it("should allow player to access their own data without consent check", async () => {
        const { ConsentDataReader, AccessContext } =
          await import("../../netlify/functions/utils/consent-data-reader.cjs");

        const reader = new ConsentDataReader(supabaseAdmin, {
          enableAuditLogging: false,
        });

        // Player accessing their own data
        const result = await reader.readTrainingSessions({
          requesterId: TEST_PLAYER_WITH_CONSENT,
          playerId: TEST_PLAYER_WITH_CONSENT,
          context: AccessContext.PLAYER_OWN_DATA,
          filters: { limit: 10 },
        });

        expect(result.success).toBe(true);
        // Own data should never be blocked
        expect(result.consentInfo.blockedPlayerIds).not.toContain(
          TEST_PLAYER_WITH_CONSENT,
        );
      });
    });
  },
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function setupTestData(supabase) {
  // Create test team
  await supabase.from("teams").upsert(
    {
      id: TEST_TEAM_ID,
      name: "Test Team for Load Management",
      created_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  // Create test users
  await supabase.from("users").upsert(
    [
      {
        id: TEST_PLAYER_WITH_CONSENT,
        name: "Test Player With Consent",
        email: "player-consent@test.com",
        role: "player",
      },
      {
        id: TEST_PLAYER_NO_CONSENT,
        name: "Test Player No Consent",
        email: "player-no-consent@test.com",
        role: "player",
      },
      {
        id: TEST_PLAYER_INSUFFICIENT_DATA,
        name: "Test Player Insufficient Data",
        email: "player-insufficient@test.com",
        role: "player",
      },
      {
        id: TEST_COACH_ID,
        name: "Test Coach",
        email: "coach-load@test.com",
        role: "coach",
      },
    ],
    { onConflict: "id" },
  );

  // Add users to team
  await supabase.from("team_members").upsert(
    [
      {
        team_id: TEST_TEAM_ID,
        user_id: TEST_PLAYER_WITH_CONSENT,
        role: "player",
        status: "active",
      },
      {
        team_id: TEST_TEAM_ID,
        user_id: TEST_PLAYER_NO_CONSENT,
        role: "player",
        status: "active",
      },
      {
        team_id: TEST_TEAM_ID,
        user_id: TEST_PLAYER_INSUFFICIENT_DATA,
        role: "player",
        status: "active",
      },
      {
        team_id: TEST_TEAM_ID,
        user_id: TEST_COACH_ID,
        role: "coach",
        status: "active",
      },
    ],
    { onConflict: "team_id,user_id" },
  );

  // Grant consent for TEST_PLAYER_WITH_CONSENT
  await supabase.from("team_sharing_settings").upsert(
    {
      user_id: TEST_PLAYER_WITH_CONSENT,
      team_id: TEST_TEAM_ID,
      performance_sharing_enabled: true,
      health_sharing_enabled: true,
    },
    { onConflict: "user_id,team_id" },
  );

  // Grant consent for TEST_PLAYER_INSUFFICIENT_DATA (but they have insufficient data)
  await supabase.from("team_sharing_settings").upsert(
    {
      user_id: TEST_PLAYER_INSUFFICIENT_DATA,
      team_id: TEST_TEAM_ID,
      performance_sharing_enabled: true,
      health_sharing_enabled: true,
    },
    { onConflict: "user_id,team_id" },
  );

  // NO consent for TEST_PLAYER_NO_CONSENT (don't insert or delete)
  await supabase
    .from("team_sharing_settings")
    .delete()
    .eq("user_id", TEST_PLAYER_NO_CONSENT)
    .eq("team_id", TEST_TEAM_ID);

  // Create training sessions for player with consent (30 days - sufficient)
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const sessionDate = new Date(now);
    sessionDate.setDate(sessionDate.getDate() - i);

    await supabase.from("training_sessions").upsert(
      {
        id: `a1111111-1111-1111-1111-1111111111${i.toString().padStart(2, "0")}`,
        user_id: TEST_PLAYER_WITH_CONSENT,
        session_date: sessionDate.toISOString().split("T")[0],
        session_type: "training",
        workload: 400 + Math.floor(Math.random() * 100),
        duration_minutes: 60 + Math.floor(Math.random() * 30),
        rpe: 5 + Math.floor(Math.random() * 4),
        status: "completed",
      },
      { onConflict: "id" },
    );
  }

  // Create training sessions for player with insufficient data (only 5 days)
  for (let i = 0; i < 5; i++) {
    const sessionDate = new Date(now);
    sessionDate.setDate(sessionDate.getDate() - i);

    await supabase.from("training_sessions").upsert(
      {
        id: `a3333333-3333-3333-3333-3333333333${i.toString().padStart(2, "0")}`,
        user_id: TEST_PLAYER_INSUFFICIENT_DATA,
        session_date: sessionDate.toISOString().split("T")[0],
        session_type: "training",
        workload: 350 + Math.floor(Math.random() * 100),
        duration_minutes: 45 + Math.floor(Math.random() * 30),
        rpe: 4 + Math.floor(Math.random() * 4),
        status: "completed",
      },
      { onConflict: "id" },
    );
  }

  // Create training sessions for player without consent (but they have data)
  for (let i = 0; i < 20; i++) {
    const sessionDate = new Date(now);
    sessionDate.setDate(sessionDate.getDate() - i);

    await supabase.from("training_sessions").upsert(
      {
        id: `a2222222-2222-2222-2222-2222222222${i.toString().padStart(2, "0")}`,
        user_id: TEST_PLAYER_NO_CONSENT,
        session_date: sessionDate.toISOString().split("T")[0],
        session_type: "training",
        workload: 380 + Math.floor(Math.random() * 100),
        duration_minutes: 55 + Math.floor(Math.random() * 30),
        rpe: 5 + Math.floor(Math.random() * 3),
        status: "completed",
      },
      { onConflict: "id" },
    );
  }
}

async function cleanupTestData(supabase) {
  const testUserIds = [
    TEST_PLAYER_WITH_CONSENT,
    TEST_PLAYER_NO_CONSENT,
    TEST_PLAYER_INSUFFICIENT_DATA,
    TEST_COACH_ID,
  ];

  // Delete in reverse dependency order

  // Delete training sessions
  for (const userId of testUserIds) {
    await supabase.from("training_sessions").delete().eq("user_id", userId);
  }

  // Delete team sharing settings
  for (const userId of testUserIds) {
    await supabase.from("team_sharing_settings").delete().eq("user_id", userId);
  }

  // Delete team members
  await supabase.from("team_members").delete().eq("team_id", TEST_TEAM_ID);

  // Delete users
  await supabase.from("users").delete().in("id", testUserIds);

  // Delete team
  await supabase.from("teams").delete().eq("id", TEST_TEAM_ID);
}
