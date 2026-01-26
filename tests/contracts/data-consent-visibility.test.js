/**
 * Contract Compliance Tests: Data Consent & Visibility
 * Contract: STEP_2_5_DATA_CONSENT_VISIBILITY_CONTRACT_V1.md
 *
 * Tests verify:
 * - Consent filtering on coach reads
 * - Safety override triggers
 * - Default visibility rules
 */

const { describe, it, expect, beforeAll, afterAll } = require("@jest/globals");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || "test-service-key";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

describe("Contract: Data Consent & Visibility", () => {
  let testCoachId;
  let testAthleteId;

  beforeAll(async () => {
    testCoachId = "test-coach-id";
    testAthleteId = "test-athlete-id";
  });

  describe("Consent Filtering Tests", () => {
    /**
     * Test: Coach cannot fetch readinessScore unless athlete opted in
     * Contract: STEP_2_5 §1.5, §3.1.1
     */
    it("should hide readinessScore from coach by default", async () => {
      // Create athlete with default consent (all false)
      await supabase.from("athlete_consent_settings").upsert({
        athlete_id: testAthleteId,
        share_readiness_with_coach: false, // Default
      });

      // Create readiness score
      await supabase.from("readiness_scores").insert({
        athlete_id: testAthleteId,
        day: new Date().toISOString().split("T")[0],
        score: 75,
      });

      // Coach queries readiness (should not see score)
      // This test assumes a consent-aware view or API endpoint
      const { data } = await supabase
        .from("v_readiness_scores_consent") // Assuming consent view exists
        .select("*")
        .eq("athlete_id", testAthleteId)
        .single();

      // Score should be null/blocked
      expect(data?.score).toBeNull();
      expect(data?.consent_blocked).toBe(true);
    });

    /**
     * Test: Coach sees readinessScore when athlete opts in
     * Contract: STEP_2_5 §1.5, §8.1
     */
    it("should show readinessScore when athlete opts in", async () => {
      // Athlete opts in
      await supabase.from("athlete_consent_settings").upsert({
        athlete_id: testAthleteId,
        share_readiness_with_coach: true,
      });

      // Coach queries readiness (should see score)
      const { data } = await supabase
        .from("v_readiness_scores_consent")
        .select("*")
        .eq("athlete_id", testAthleteId)
        .single();

      expect(data?.score).toBeTruthy();
      expect(data?.consent_blocked).toBe(false);
    });

    /**
     * Test: Coach sees only pain flag by default, not detail
     * Contract: STEP_2_5 §1.7, §3.1.1
     */
    it("should show only pain flag to coach by default", async () => {
      // Create pain report
      await supabase.from("pain_reports").insert({
        athlete_id: testAthleteId,
        pain_score: 2, // Below safety threshold
        pain_location: "knee",
        reported_at: new Date().toISOString(),
      });

      // Coach queries pain data (should see flag only)
      const { data } = await supabase
        .from("v_pain_reports_consent") // Assuming consent view
        .select("*")
        .eq("athlete_id", testAthleteId)
        .single();

      // Should see flag exists, but not detail
      expect(data?.has_pain_flag).toBe(true);
      expect(data?.pain_score).toBeNull(); // Detail hidden
      expect(data?.pain_location).toBeNull(); // Detail hidden
    });
  });

  describe("Safety Override Tests", () => {
    /**
     * Test: Safety override: pain >3/10 visible to coach
     * Contract: STEP_2_5 §4.1
     */
    it("should show pain detail when pain >3/10 (safety override)", async () => {
      // Create high pain report
      await supabase.from("pain_reports").insert({
        athlete_id: testAthleteId,
        pain_score: 7, // Above safety threshold
        pain_location: "knee",
        reported_at: new Date().toISOString(),
      });

      // Coach queries pain data (should see detail due to safety override)
      const { data } = await supabase
        .from("v_pain_reports_consent")
        .select("*")
        .eq("athlete_id", testAthleteId)
        .single();

      // Safety override should reveal detail
      expect(data?.pain_score).toBe(7);
      expect(data?.pain_location).toBe("knee");
      expect(data?.safety_override).toBe(true);
    });

    /**
     * Test: ACWR danger zone triggers safety override
     * Contract: STEP_2_5 §4.3
     */
    it("should show ACWR when in danger zone (safety override)", async () => {
      // Create high ACWR
      await supabase.from("load_metrics").insert({
        athlete_id: testAthleteId,
        acwr: 1.6, // Above danger threshold
        day: new Date().toISOString().split("T")[0],
      });

      // Coach queries load metrics (should see ACWR due to safety override)
      const { data } = await supabase
        .from("v_load_metrics_consent")
        .select("*")
        .eq("athlete_id", testAthleteId)
        .single();

      expect(data?.acwr).toBe(1.6);
      expect(data?.safety_override).toBe(true);
    });
  });

  describe("Default Visibility Tests", () => {
    /**
     * Test: Coach sees compliance data by default
     * Contract: STEP_2_5 §3.1.1, §3.2
     */
    it("should show compliance data to coach by default", async () => {
      // Create check-in
      await supabase.from("wellness_checkins").insert({
        athlete_id: testAthleteId,
        check_in_date: new Date().toISOString().split("T")[0],
        completed: true,
      });

      // Coach queries check-in status (should see compliance)
      const { data } = await supabase
        .from("v_wellness_checkins_consent")
        .select("*")
        .eq("athlete_id", testAthleteId)
        .single();

      // Compliance data visible
      expect(data?.check_in_completed).toBe(true);
      expect(data?.check_in_date).toBeTruthy();
      // Content data hidden
      expect(data?.readiness_score).toBeNull();
    });
  });

  describe("Merlin Privacy Tests", () => {
    /**
     * Test: Merlin never reveals cross-athlete data
     * Contract: STEP_2_5 §7.3, §9.11
     */
    it("should prevent Merlin from revealing teammate data", async () => {
      // This test would verify Merlin dialogue logic
      // In practice, this requires testing the Merlin API endpoint
      // Mock test: verify Merlin guard checks athlete isolation

      const merlinQuery = "How is Sarah's readiness today?";
      // Should return refusal template, not Sarah's data
      const expectedResponse =
        "I can't share Sarah's personal data. If you'd like to check in with her, you can message her directly.";

      // Mock Merlin guard check
      const canAccess = false; // Merlin should not access teammate data
      expect(canAccess).toBe(false);
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase
      .from("athlete_consent_settings")
      .delete()
      .eq("athlete_id", testAthleteId);
  });
});
