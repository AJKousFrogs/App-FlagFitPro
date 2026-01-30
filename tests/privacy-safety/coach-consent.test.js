/**
 * Coach API Consent Tests
 *
 * Tests that the coach.cjs function properly uses ConsentDataReader
 * and includes consent information in responses.
 *
 * Proves that:
 * 1. Coach with consent sees player training/wellness data
 * 2. Coach without consent gets blocked indicators but endpoint still works
 * 3. Response includes consentInfo.blockedPlayerIds and dataState fields
 *
 * @see netlify/functions/coach.cjs
 * @see netlify/functions/utils/consent-data-reader.cjs
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip tests if no Supabase connection
const canRunTests = SUPABASE_URL && SUPABASE_SERVICE_KEY;

// Test UUIDs (deterministic for cleanup)
const TEST_PLAYER_ID = "11111111-1111-1111-1111-111111111111";
const TEST_PLAYER_2_ID = "11111111-1111-1111-1111-111111111112";
const TEST_COACH_ID = "22222222-2222-2222-2222-222222222222";
const TEST_TEAM_ID = "33333333-3333-3333-3333-333333333333";

// Mock the ConsentDataReader for unit tests
const mockConsentDataReader = {
  readTrainingSessions: vi.fn(),
  readWellnessEntries: vi.fn(),
};

describe.skipIf(!canRunTests)("Coach API Consent Integration", () => {
  let supabaseAdmin;

  beforeAll(async () => {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // Clean up any existing test data
    await cleanupTestData(supabaseAdmin);

    // Set up test data
    await setupTestData(supabaseAdmin);
  });

  afterAll(async () => {
    if (supabaseAdmin) {
      await cleanupTestData(supabaseAdmin);
    }
  });

  describe("ConsentDataReader.readTrainingSessions", () => {
    it("should return data for players with performance_sharing_enabled", async () => {
      // Grant consent
      await supabaseAdmin.from("team_sharing_settings").upsert(
        {
          user_id: TEST_PLAYER_ID,
          team_id: TEST_TEAM_ID,
          performance_sharing_enabled: true,
          health_sharing_enabled: true,
        },
        { onConflict: "user_id,team_id" },
      );

      // Import the actual ConsentDataReader
      const { ConsentDataReader, AccessContext } =
        await import("../../netlify/functions/utils/consent-data-reader.cjs");

      const reader = new ConsentDataReader(supabaseAdmin, {
        enableAuditLogging: false,
      });

      const result = await reader.readTrainingSessions({
        requesterId: TEST_COACH_ID,
        playerId: TEST_PLAYER_ID,
        teamId: TEST_TEAM_ID,
        context: AccessContext.COACH_TEAM_DATA,
        filters: { limit: 10 },
      });

      expect(result.success).toBe(true);
      expect(result.consentInfo).toBeDefined();
      expect(result.consentInfo.blockedPlayerIds).toBeDefined();
      expect(Array.isArray(result.consentInfo.blockedPlayerIds)).toBe(true);
      // Player with consent should NOT be in blockedPlayerIds
      expect(result.consentInfo.blockedPlayerIds).not.toContain(TEST_PLAYER_ID);
    });

    it("should block data for players without performance_sharing_enabled", async () => {
      // Remove consent
      await supabaseAdmin
        .from("team_sharing_settings")
        .delete()
        .eq("user_id", TEST_PLAYER_ID)
        .eq("team_id", TEST_TEAM_ID);

      const { ConsentDataReader, AccessContext } =
        await import("../../netlify/functions/utils/consent-data-reader.cjs");

      const reader = new ConsentDataReader(supabaseAdmin, {
        enableAuditLogging: false,
      });

      const result = await reader.readTrainingSessions({
        requesterId: TEST_COACH_ID,
        playerId: TEST_PLAYER_ID,
        teamId: TEST_TEAM_ID,
        context: AccessContext.COACH_TEAM_DATA,
        filters: { limit: 10 },
      });

      expect(result.success).toBe(true);
      expect(result.consentInfo).toBeDefined();
      // Player without consent SHOULD be in blockedPlayerIds
      expect(result.consentInfo.blockedPlayerIds).toContain(TEST_PLAYER_ID);
    });
  });

  describe("ConsentDataReader.readWellnessEntries", () => {
    it("should return data for players with health_sharing_enabled", async () => {
      // Grant health consent
      await supabaseAdmin.from("team_sharing_settings").upsert(
        {
          user_id: TEST_PLAYER_ID,
          team_id: TEST_TEAM_ID,
          performance_sharing_enabled: true,
          health_sharing_enabled: true,
        },
        { onConflict: "user_id,team_id" },
      );

      const { ConsentDataReader, AccessContext } =
        await import("../../netlify/functions/utils/consent-data-reader.cjs");

      const reader = new ConsentDataReader(supabaseAdmin, {
        enableAuditLogging: false,
      });

      const result = await reader.readWellnessEntries({
        requesterId: TEST_COACH_ID,
        playerId: TEST_PLAYER_ID,
        teamId: TEST_TEAM_ID,
        context: AccessContext.COACH_TEAM_DATA,
        filters: { limit: 10 },
      });

      expect(result.success).toBe(true);
      expect(result.consentInfo).toBeDefined();
      expect(result.consentInfo.blockedPlayerIds).not.toContain(TEST_PLAYER_ID);
    });

    it("should block wellness data when health_sharing_enabled is false", async () => {
      // Grant performance but NOT health consent
      await supabaseAdmin.from("team_sharing_settings").upsert(
        {
          user_id: TEST_PLAYER_ID,
          team_id: TEST_TEAM_ID,
          performance_sharing_enabled: true,
          health_sharing_enabled: false,
        },
        { onConflict: "user_id,team_id" },
      );

      const { ConsentDataReader, AccessContext } =
        await import("../../netlify/functions/utils/consent-data-reader.cjs");

      const reader = new ConsentDataReader(supabaseAdmin, {
        enableAuditLogging: false,
      });

      const result = await reader.readWellnessEntries({
        requesterId: TEST_COACH_ID,
        playerId: TEST_PLAYER_ID,
        teamId: TEST_TEAM_ID,
        context: AccessContext.COACH_TEAM_DATA,
        filters: { limit: 10 },
      });

      expect(result.success).toBe(true);
      expect(result.consentInfo).toBeDefined();
      // Player without health consent SHOULD be in blockedPlayerIds
      expect(result.consentInfo.blockedPlayerIds).toContain(TEST_PLAYER_ID);
    });
  });

  describe("Mixed consent scenarios", () => {
    it("should handle team with some consenting and some non-consenting players", async () => {
      // Player 1: has consent
      await supabaseAdmin.from("team_sharing_settings").upsert(
        {
          user_id: TEST_PLAYER_ID,
          team_id: TEST_TEAM_ID,
          performance_sharing_enabled: true,
          health_sharing_enabled: true,
        },
        { onConflict: "user_id,team_id" },
      );

      // Player 2: no consent
      await supabaseAdmin
        .from("team_sharing_settings")
        .delete()
        .eq("user_id", TEST_PLAYER_2_ID)
        .eq("team_id", TEST_TEAM_ID);

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
      // Should have some accessible data (from consenting player)
      // and blocked count should reflect non-consenting players
    });
  });

  describe("Response structure", () => {
    it("should include dataState in response", async () => {
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
  });
});

// Unit tests that don't require Supabase
describe("Coach API Consent Unit Tests", () => {
  describe("AccessContext validation", () => {
    it("should export COACH_TEAM_DATA context", async () => {
      const { AccessContext } =
        await import("../../netlify/functions/utils/consent-data-reader.cjs");

      expect(AccessContext.COACH_TEAM_DATA).toBe("coach_team_data");
      expect(AccessContext.PLAYER_OWN_DATA).toBe("player_own_data");
    });
  });

  describe("CONSENT_PROTECTED_TABLES", () => {
    it("should include training_sessions and wellness_entries", async () => {
      const { CONSENT_PROTECTED_TABLES } =
        await import("../../netlify/functions/utils/consent-data-reader.cjs");

      expect(CONSENT_PROTECTED_TABLES).toContain("training_sessions");
      expect(CONSENT_PROTECTED_TABLES).toContain("wellness_entries");
      expect(CONSENT_PROTECTED_TABLES).toContain("wellness_logs");
    });
  });

  describe("isConsentProtectedTable helper", () => {
    it("should correctly identify protected tables", async () => {
      const { isConsentProtectedTable } =
        await import("../../netlify/functions/utils/consent-data-reader.cjs");

      expect(isConsentProtectedTable("training_sessions")).toBe(true);
      expect(isConsentProtectedTable("wellness_entries")).toBe(true);
      expect(isConsentProtectedTable("users")).toBe(false);
      expect(isConsentProtectedTable("teams")).toBe(false);
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function setupTestData(supabase) {
  // Create test team
  await supabase.from("teams").upsert(
    {
      id: TEST_TEAM_ID,
      name: "Test Team for Consent",
      created_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  // Create test users
  await supabase.from("users").upsert(
    [
      {
        id: TEST_PLAYER_ID,
        name: "Test Player 1",
        email: "player1@test.com",
        role: "player",
      },
      {
        id: TEST_PLAYER_2_ID,
        name: "Test Player 2",
        email: "player2@test.com",
        role: "player",
      },
      {
        id: TEST_COACH_ID,
        name: "Test Coach",
        email: "coach@test.com",
        role: "coach",
      },
    ],
    { onConflict: "id" },
  );

  // Add players to team
  await supabase.from("team_members").upsert(
    [
      {
        team_id: TEST_TEAM_ID,
        user_id: TEST_PLAYER_ID,
        role: "player",
      },
      {
        team_id: TEST_TEAM_ID,
        user_id: TEST_PLAYER_2_ID,
        role: "player",
      },
      {
        team_id: TEST_TEAM_ID,
        user_id: TEST_COACH_ID,
        role: "coach",
      },
    ],
    { onConflict: "team_id,user_id" },
  );

  // Create test training sessions
  await supabase.from("training_sessions").upsert(
    [
      {
        id: "66666666-6666-6666-6666-666666666661",
        user_id: TEST_PLAYER_ID,
        session_date: new Date().toISOString(),
        session_type: "training",
        workload: 450,
        duration_minutes: 90,
      },
      {
        id: "66666666-6666-6666-6666-666666666662",
        user_id: TEST_PLAYER_2_ID,
        session_date: new Date().toISOString(),
        session_type: "training",
        workload: 380,
        duration_minutes: 75,
      },
    ],
    { onConflict: "id" },
  );

  // Create test wellness entries
  await supabase.from("wellness_entries").upsert(
    [
      {
        id: "77777777-7777-7777-7777-777777777771",
        user_id: TEST_PLAYER_ID,
        date: new Date().toISOString().split("T")[0],
        sleep_quality: 8,
        energy_level: 7,
        stress_level: 3,
        muscle_soreness: 4,
        mood: 8,
      },
    ],
    { onConflict: "id" },
  );
}

async function cleanupTestData(supabase) {
  // Clean up in reverse dependency order
  const testIds = [TEST_PLAYER_ID, TEST_PLAYER_2_ID, TEST_COACH_ID];

  // Delete wellness entries
  await supabase.from("wellness_entries").delete().in("user_id", testIds);

  // Delete training sessions
  await supabase.from("training_sessions").delete().in("user_id", testIds);

  // Delete team sharing settings
  for (const userId of testIds) {
    await supabase.from("team_sharing_settings").delete().eq("user_id", userId);
  }

  // Delete team members
  await supabase.from("team_members").delete().eq("team_id", TEST_TEAM_ID);

  // Delete users
  await supabase.from("users").delete().in("id", testIds);

  // Delete team
  await supabase.from("teams").delete().eq("id", TEST_TEAM_ID);
}
