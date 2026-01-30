/**
 * Data State Contract Tests
 *
 * Proves that:
 * 1. < minimum days -> metricValue null + INSUFFICIENT_DATA
 * 2. >= minimum days -> REAL_DATA and valid values
 * 3. No data -> NO_DATA state
 *
 * Based on: utils/data-state.cjs and load-management.cjs
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Import data state utilities
import {
  DataState,
  MINIMUM_DATA_REQUIREMENTS,
  evaluateDataState,
  createDataResponse,
  wrapWithDataState,
  isDataSafe,
  canCalculate,
  getDataStateFromRiskZone,
} from "../../netlify/functions/utils/data-state.cjs";

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip DB tests if no Supabase connection
const canRunDbTests = SUPABASE_URL && SUPABASE_SERVICE_KEY;

// Test UUIDs
const TEST_USER_NO_DATA = "f1111111-1111-1111-1111-111111111111";
const TEST_USER_INSUFFICIENT = "f2222222-2222-2222-2222-222222222222";
const TEST_USER_SUFFICIENT = "f3333333-3333-3333-3333-333333333333";

describe("Data State Contract", () => {
  describe("DataState enum", () => {
    it("should have correct state values", () => {
      expect(DataState.NO_DATA).toBe("NO_DATA");
      expect(DataState.INSUFFICIENT_DATA).toBe("INSUFFICIENT_DATA");
      expect(DataState.DEMO_DATA).toBe("DEMO_DATA");
      expect(DataState.REAL_DATA).toBe("REAL_DATA");
    });
  });

  describe("MINIMUM_DATA_REQUIREMENTS", () => {
    it("should define ACWR requirements correctly", () => {
      expect(MINIMUM_DATA_REQUIREMENTS.acwr.minimumDays).toBe(28);
      expect(MINIMUM_DATA_REQUIREMENTS.acwr.description).toContain("28 days");
    });

    it("should define acute load requirements correctly", () => {
      expect(MINIMUM_DATA_REQUIREMENTS.acuteLoad.minimumDays).toBe(7);
    });

    it("should define chronic load requirements correctly", () => {
      expect(MINIMUM_DATA_REQUIREMENTS.chronicLoad.minimumDays).toBe(28);
    });

    it("should define TSB requirements correctly", () => {
      expect(MINIMUM_DATA_REQUIREMENTS.tsb.minimumDays).toBe(42);
    });
  });

  describe("evaluateDataState", () => {
    it("should return NO_DATA when currentDataPoints is 0", () => {
      const state = evaluateDataState(0, "acwr");
      expect(state).toBe(DataState.NO_DATA);
    });

    it("should return INSUFFICIENT_DATA when below minimum", () => {
      const state = evaluateDataState(14, "acwr"); // Need 28, have 14
      expect(state).toBe(DataState.INSUFFICIENT_DATA);
    });

    it("should return REAL_DATA when at or above minimum", () => {
      const state = evaluateDataState(28, "acwr");
      expect(state).toBe(DataState.REAL_DATA);
    });

    it("should return DEMO_DATA when isDemo flag is true", () => {
      const state = evaluateDataState(100, "acwr", true);
      expect(state).toBe(DataState.DEMO_DATA);
    });

    it("should handle unknown metric types with 7-day default", () => {
      const stateInsufficient = evaluateDataState(5, "unknown_metric");
      expect(stateInsufficient).toBe(DataState.INSUFFICIENT_DATA);

      const stateSufficient = evaluateDataState(7, "unknown_metric");
      expect(stateSufficient).toBe(DataState.REAL_DATA);
    });
  });

  describe("createDataResponse", () => {
    it("should return null value for NO_DATA state", () => {
      const response = createDataResponse(1.25, 0, "acwr");

      expect(response.value).toBeNull();
      expect(response.dataState).toBe(DataState.NO_DATA);
      expect(response.warnings).toHaveLength(1);
      expect(response.warnings[0]).toContain("No data available");
    });

    it("should return null value for INSUFFICIENT_DATA state", () => {
      const response = createDataResponse(1.25, 14, "acwr");

      expect(response.value).toBeNull();
      expect(response.dataState).toBe(DataState.INSUFFICIENT_DATA);
      expect(response.warnings).toHaveLength(1);
      expect(response.warnings[0]).toContain("14 days");
      expect(response.warnings[0]).toContain("need 14 more");
    });

    it("should return actual value for REAL_DATA state", () => {
      const response = createDataResponse(1.25, 30, "acwr");

      expect(response.value).toBe(1.25);
      expect(response.dataState).toBe(DataState.REAL_DATA);
      expect(response.warnings).toHaveLength(0);
    });

    it("should include metadata", () => {
      const response = createDataResponse(1.25, 30, "acwr", {
        lastUpdated: "2025-01-01T00:00:00Z",
        metadata: { custom: "value" },
      });

      expect(response.lastUpdated).toBe("2025-01-01T00:00:00Z");
      expect(response.metadata.custom).toBe("value");
      expect(response.metadata.source).toBeTruthy();
    });
  });

  describe("wrapWithDataState", () => {
    it("should add data state info to existing response", () => {
      const originalResponse = {
        acwr: 1.25,
        riskZone: "safe",
        recommendation: "Keep training",
      };

      const wrapped = wrapWithDataState(originalResponse, {
        dataState: DataState.REAL_DATA,
        currentDataPoints: 30,
        minimumRequiredDataPoints: 28,
        warnings: [],
      });

      expect(wrapped.acwr).toBe(1.25);
      expect(wrapped.dataState).toBe(DataState.REAL_DATA);
      expect(wrapped.dataStateInfo.isReliable).toBe(true);
      expect(wrapped.dataStateInfo.currentDataPoints).toBe(30);
    });

    it("should mark as unreliable when data is insufficient", () => {
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
  });

  describe("isDataSafe", () => {
    it("should return true only for REAL_DATA", () => {
      expect(isDataSafe(DataState.REAL_DATA)).toBe(true);
      expect(isDataSafe(DataState.NO_DATA)).toBe(false);
      expect(isDataSafe(DataState.INSUFFICIENT_DATA)).toBe(false);
      expect(isDataSafe(DataState.DEMO_DATA)).toBe(false);
    });
  });

  describe("canCalculate", () => {
    it("should return false when below minimum", () => {
      expect(canCalculate(14, "acwr")).toBe(false);
      expect(canCalculate(5, "acuteLoad")).toBe(false);
    });

    it("should return true when at or above minimum", () => {
      expect(canCalculate(28, "acwr")).toBe(true);
      expect(canCalculate(7, "acuteLoad")).toBe(true);
      expect(canCalculate(42, "tsb")).toBe(true);
    });
  });

  describe("getDataStateFromRiskZone", () => {
    it("should map insufficient_data to INSUFFICIENT_DATA", () => {
      expect(getDataStateFromRiskZone("insufficient_data")).toBe(
        DataState.INSUFFICIENT_DATA,
      );
    });

    it("should map unknown and no_data to NO_DATA", () => {
      expect(getDataStateFromRiskZone("unknown")).toBe(DataState.NO_DATA);
      expect(getDataStateFromRiskZone("no_data")).toBe(DataState.NO_DATA);
    });

    it("should map valid risk zones to REAL_DATA", () => {
      expect(getDataStateFromRiskZone("safe")).toBe(DataState.REAL_DATA);
      expect(getDataStateFromRiskZone("danger")).toBe(DataState.REAL_DATA);
      expect(getDataStateFromRiskZone("optimal")).toBe(DataState.REAL_DATA);
    });
  });
});

describe.skipIf(!canRunDbTests)("Data State - Database Integration", () => {
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

  describe("ACWR calculation with data state", () => {
    it("should return insufficient_data for user with < 28 days", async () => {
      // User with only 10 days of data
      const { data: loadData } = await supabaseAdmin
        .from("load_monitoring")
        .select("*")
        .eq("player_id", TEST_USER_INSUFFICIENT);

      const dataPoints = loadData?.length || 0;
      const dataState = evaluateDataState(dataPoints, "acwr");

      expect(dataState).toBe(DataState.INSUFFICIENT_DATA);
    });

    it("should return REAL_DATA for user with >= 28 days", async () => {
      const { data: loadData } = await supabaseAdmin
        .from("load_monitoring")
        .select("*")
        .eq("player_id", TEST_USER_SUFFICIENT);

      const dataPoints = loadData?.length || 0;

      // We seeded 30 days of data
      expect(dataPoints).toBeGreaterThanOrEqual(28);

      const dataState = evaluateDataState(dataPoints, "acwr");
      expect(dataState).toBe(DataState.REAL_DATA);
    });

    it("should return NO_DATA for user with no training history", async () => {
      const { data: loadData } = await supabaseAdmin
        .from("load_monitoring")
        .select("*")
        .eq("player_id", TEST_USER_NO_DATA);

      const dataPoints = loadData?.length || 0;
      expect(dataPoints).toBe(0);

      const dataState = evaluateDataState(dataPoints, "acwr");
      expect(dataState).toBe(DataState.NO_DATA);
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function setupTestData(supabase) {
  // Create user with insufficient data (10 days)
  const insufficientDays = 10;
  for (let i = 0; i < insufficientDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    await supabase.from("load_monitoring").upsert(
      {
        id: `f2222222-2222-2222-2222-22222222${i.toString().padStart(4, "0")}`,
        player_id: TEST_USER_INSUFFICIENT,
        daily_load: 400 + Math.random() * 100,
        acute_load: 2800,
        chronic_load: 2500,
        acwr: 1.12,
        calculated_at: date.toISOString(),
      },
      { onConflict: "id" },
    );
  }

  // Create user with sufficient data (30 days)
  const sufficientDays = 30;
  for (let i = 0; i < sufficientDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    await supabase.from("load_monitoring").upsert(
      {
        id: `f3333333-3333-3333-3333-33333333${i.toString().padStart(4, "0")}`,
        player_id: TEST_USER_SUFFICIENT,
        daily_load: 450 + Math.random() * 100,
        acute_load: 3000,
        chronic_load: 2700,
        acwr: 1.11,
        calculated_at: date.toISOString(),
      },
      { onConflict: "id" },
    );
  }
}

async function cleanupTestData(supabase) {
  const testIds = [
    TEST_USER_NO_DATA,
    TEST_USER_INSUFFICIENT,
    TEST_USER_SUFFICIENT,
  ];

  for (const userId of testIds) {
    await supabase.from("load_monitoring").delete().eq("player_id", userId);
  }
}
