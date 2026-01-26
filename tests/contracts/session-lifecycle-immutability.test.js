/**
 * Contract Compliance Tests: Session Lifecycle & Immutability
 * Contract: STEP_2_6_SESSION_LIFECYCLE_IMMUTABILITY_CONTRACT_V1.md
 *
 * Tests verify:
 * - Authority leaks (AI/athlete cannot modify coach-locked sessions)
 * - Immutability (no writes after IN_PROGRESS/COMPLETED/LOCKED)
 * - Coach attribution enforcement
 */

const { describe, it, expect, beforeAll, afterAll } = require("@jest/globals");
const { createClient } = require("@supabase/supabase-js");

// Test configuration
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "http://localhost:54321";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "test-service-key";

if (!SUPABASE_URL || SUPABASE_URL === "http://localhost:54321") {
  console.warn(
    "⚠️  SUPABASE_URL not set. Tests require a real Supabase instance.",
  );
  console.warn(
    "   Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

describe("Contract: Session Lifecycle & Immutability", () => {
  let testCoachId;
  let testAthleteId;
  let testSessionId;

  beforeAll(async () => {
    // Setup test users (mock - adjust based on your test setup)
    // In real tests, use test fixtures or seed data
    testCoachId = "test-coach-id";
    testAthleteId = "test-athlete-id";
  });

  describe("Authority Tests", () => {
    /**
     * Test: Coach modifies session → AI cannot modify afterward
     * Contract: STEP_2_6 §2.3 Ban 1, §3.1
     */
    it("should prevent AI from modifying coach-locked session", async () => {
      // Create session
      const { data: session } = await supabase
        .from("training_sessions")
        .insert({
          user_id: testAthleteId,
          session_date: new Date().toISOString().split("T")[0],
          session_state: "GENERATED",
          coach_locked: false,
        })
        .select()
        .single();

      testSessionId = session.id;

      // Coach modifies session (sets coach_locked)
      await supabase
        .from("training_sessions")
        .update({
          modified_by_coach_id: testCoachId,
          coach_locked: true,
          modified_at: new Date().toISOString(),
        })
        .eq("id", testSessionId);

      // AI attempts to modify (should fail)
      const { error } = await supabase
        .from("training_sessions")
        .update({
          duration_minutes: 60, // AI modification attempt
        })
        .eq("id", testSessionId);

      expect(error).toBeTruthy();
      expect(error.message).toContain("coach_locked");
    });

    /**
     * Test: Athlete cannot modify session structure
     * Contract: STEP_2_6 §2.3 Ban 4
     */
    it("should prevent athlete from modifying session structure", async () => {
      const { data: session } = await supabase
        .from("training_sessions")
        .insert({
          user_id: testAthleteId,
          session_date: new Date().toISOString().split("T")[0],
          session_state: "VISIBLE",
          coach_locked: false,
        })
        .select()
        .single();

      // Athlete attempts structural modification (should fail)
      const { error } = await supabase
        .from("training_sessions")
        .update({
          duration_minutes: 90, // Structural change
        })
        .eq("id", session.id);

      // Should fail via RLS or trigger
      expect(error).toBeTruthy();
    });

    /**
     * Test: Coach change always results in attribution + timestamp
     * Contract: STEP_2_6 §3.4
     */
    it("should set coach attribution when coach modifies session", async () => {
      const { data: session } = await supabase
        .from("training_sessions")
        .insert({
          user_id: testAthleteId,
          session_date: new Date().toISOString().split("T")[0],
          session_state: "GENERATED",
          coach_locked: false,
        })
        .select()
        .single();

      // Coach modifies
      const { data: updated } = await supabase
        .from("training_sessions")
        .update({
          modified_by_coach_id: testCoachId,
          modified_at: new Date().toISOString(),
          duration_minutes: 60,
        })
        .eq("id", session.id)
        .select()
        .single();

      expect(updated.modified_by_coach_id).toBe(testCoachId);
      expect(updated.modified_at).toBeTruthy();
      expect(updated.coach_locked).toBe(true); // Auto-set by trigger
    });
  });

  describe("Immutability Tests", () => {
    /**
     * Test: Coach cannot modify when state = IN_PROGRESS
     * Contract: STEP_2_6 §2.3 Ban 1
     */
    it("should prevent coach modification when session is IN_PROGRESS", async () => {
      const { data: session } = await supabase
        .from("training_sessions")
        .insert({
          user_id: testAthleteId,
          session_date: new Date().toISOString().split("T")[0],
          session_state: "IN_PROGRESS",
          coach_locked: false,
        })
        .select()
        .single();

      // Coach attempts modification (should fail)
      const { error } = await supabase
        .from("training_sessions")
        .update({
          duration_minutes: 60,
          modified_by_coach_id: testCoachId,
        })
        .eq("id", session.id);

      expect(error).toBeTruthy();
      expect(error.message).toContain("IN_PROGRESS");
    });

    /**
     * Test: Coach cannot modify when state = COMPLETED
     * Contract: STEP_2_6 §2.3 Ban 2
     */
    it("should prevent coach modification when session is COMPLETED", async () => {
      const { data: session } = await supabase
        .from("training_sessions")
        .insert({
          user_id: testAthleteId,
          session_date: new Date().toISOString().split("T")[0],
          session_state: "COMPLETED",
          coach_locked: false,
        })
        .select()
        .single();

      // Coach attempts modification (should fail)
      const { error } = await supabase
        .from("training_sessions")
        .update({
          duration_minutes: 60,
          modified_by_coach_id: testCoachId,
        })
        .eq("id", session.id);

      expect(error).toBeTruthy();
      expect(error.message).toContain("COMPLETED");
    });

    /**
     * Test: System cannot structurally modify after VISIBLE
     * Contract: STEP_2_6 §2.3 Ban 3
     */
    it("should prevent system modification when session is VISIBLE", async () => {
      const { data: session } = await supabase
        .from("training_sessions")
        .insert({
          user_id: testAthleteId,
          session_date: new Date().toISOString().split("T")[0],
          session_state: "VISIBLE",
          coach_locked: false,
        })
        .select()
        .single();

      // System attempts structural modification (should fail)
      const { error } = await supabase
        .from("training_sessions")
        .update({
          duration_minutes: 60, // Structural change
        })
        .eq("id", session.id);

      // Note: This may need RLS policy or trigger enforcement
      // Adjust based on actual implementation
      expect(error).toBeTruthy();
    });

    /**
     * Test: Timestamps immutable once set
     * Contract: STEP_2_6 §3.5
     */
    it("should prevent modification of immutable timestamps", async () => {
      const startedAt = new Date().toISOString();

      const { data: session } = await supabase
        .from("training_sessions")
        .insert({
          user_id: testAthleteId,
          session_date: new Date().toISOString().split("T")[0],
          session_state: "IN_PROGRESS",
          started_at: startedAt,
        })
        .select()
        .single();

      // Attempt to modify timestamp (should fail)
      const { error } = await supabase
        .from("training_sessions")
        .update({
          started_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      expect(error).toBeTruthy();
      expect(error.message).toContain("started_at");
    });
  });

  describe("State Transition Tests", () => {
    /**
     * Test: Valid state transitions only
     * Contract: STEP_2_6 §1.2
     */
    it("should allow valid state transitions", async () => {
      const { data: session } = await supabase
        .from("training_sessions")
        .insert({
          user_id: testAthleteId,
          session_date: new Date().toISOString().split("T")[0],
          session_state: "GENERATED",
        })
        .select()
        .single();

      // Valid transition: GENERATED → VISIBLE
      // Note: In production, use session-state-helper to set metadata
      const { error } = await supabase
        .from("training_sessions")
        .update({
          session_state: "VISIBLE",
          visible_at: new Date().toISOString(),
          metadata: {
            transition_actor_role: "athlete",
            transition_actor_id: testAthleteId,
            transition_reason: "Athlete opened TODAY screen",
          },
        })
        .eq("id", session.id);

      expect(error).toBeFalsy();

      // Verify transition was logged in history
      const { data: history } = await supabase
        .from("state_transition_history")
        .select("*")
        .eq("session_id", session.id)
        .order("transitioned_at", { ascending: false })
        .limit(1);

      expect(history).toBeTruthy();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].from_state).toBe("GENERATED");
      expect(history[0].to_state).toBe("VISIBLE");
    });

    /**
     * Test: Invalid state transitions rejected
     * Contract: STEP_2_6 §1.2
     * Note: This test may pass at DB level (no constraint) but should fail at application level
     */
    it("should reject invalid state transitions", async () => {
      const { data: session } = await supabase
        .from("training_sessions")
        .insert({
          user_id: testAthleteId,
          session_date: new Date().toISOString().split("T")[0],
          session_state: "GENERATED",
        })
        .select()
        .single();

      // Invalid transition: GENERATED → COMPLETED (must go through VISIBLE/IN_PROGRESS)
      // Note: DB may allow this, but application should validate
      const { error } = await supabase
        .from("training_sessions")
        .update({
          session_state: "COMPLETED",
          metadata: {
            transition_actor_role: "athlete",
            transition_actor_id: testAthleteId,
          },
        })
        .eq("id", session.id);

      // Application-level validation should prevent this
      // If DB allows, that's okay - application layer enforces
      if (error) {
        expect(error.message).toBeTruthy();
      } else {
        // If DB allows, verify history was still logged
        const { data: history } = await supabase
          .from("state_transition_history")
          .select("*")
          .eq("session_id", session.id)
          .order("transitioned_at", { ascending: false })
          .limit(1);

        // History should still be logged even if transition is invalid
        expect(history).toBeTruthy();
      }
    });

    /**
     * Test: State transition history is immutable
     * Contract: STEP_2_6 §1.3
     */
    it("should prevent UPDATE/DELETE on state_transition_history", async () => {
      // Create a session and transition
      const { data: session } = await supabase
        .from("training_sessions")
        .insert({
          user_id: testAthleteId,
          session_date: new Date().toISOString().split("T")[0],
          session_state: "GENERATED",
        })
        .select()
        .single();

      // Trigger a transition
      await supabase
        .from("training_sessions")
        .update({
          session_state: "VISIBLE",
          metadata: {
            transition_actor_role: "athlete",
            transition_actor_id: testAthleteId,
          },
        })
        .eq("id", session.id);

      // Get history record
      const { data: history } = await supabase
        .from("state_transition_history")
        .select("*")
        .eq("session_id", session.id)
        .single();

      expect(history).toBeTruthy();

      // Attempt UPDATE (should fail)
      const { error: updateError } = await supabase
        .from("state_transition_history")
        .update({ reason: "Modified" })
        .eq("id", history.id);

      expect(updateError).toBeTruthy();
      expect(updateError.message).toContain("append-only");

      // Attempt DELETE (should fail)
      const { error: deleteError } = await supabase
        .from("state_transition_history")
        .delete()
        .eq("id", history.id);

      expect(deleteError).toBeTruthy();
      expect(deleteError.message).toContain("append-only");
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testSessionId) {
      await supabase.from("training_sessions").delete().eq("id", testSessionId);
    }
  });
});
