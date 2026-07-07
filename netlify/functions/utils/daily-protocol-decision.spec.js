import { describe, expect, test, vi } from "vitest";
import { buildProtocolDecisionContext } from "./daily-protocol-decision.js";

// buildProtocolDecisionContext reads readiness_gates and recovery_blocks (both
// fall back to safe defaults on an empty result) via differently-shaped,
// arbitrarily long .from().select()... Postgrest chains -- a Proxy stub
// handles any method/chain shape and always resolves to an empty result
// rather than throwing on a bare `{}`.
function mockSupabase() {
  const chain = new Proxy(
    { then: (resolve) => resolve({ data: [], error: null }) },
    { get: (target, prop) => (prop === "then" ? target.then : () => chain) },
  );
  return { from: () => chain };
}

describe("buildProtocolDecisionContext", () => {
  test("uses training_sessions for ACWR baseline counting and creates baseline day focus", async () => {
    const supabase = mockSupabase();
    const computeReadinessDaysStale = vi.fn().mockResolvedValue(null);
    const computeTrainingDaysLogged = vi.fn().mockResolvedValue(5);

    const result = await buildProtocolDecisionContext({
      supabase,
      userId: "athlete-1",
      date: "2026-04-25",
      context: {
        dayOfWeek: 6,
        readiness: null,
        sessionResolution: {
          success: true,
          status: "baseline_program",
          reason:
            "No active training program assigned. Using the baseline flag football plan while the athlete builds history.",
          metadata: {
            originalStatus: "no_program",
          },
        },
        sessionTemplate: null,
        playerProgram: null,
        acwrTargetRange: {
          min: 0.8,
          max: 1.3,
        },
      },
      computeReadinessDaysStale,
      computeTrainingDaysLogged,
    });

    expect(computeTrainingDaysLogged).toHaveBeenCalledWith(
      supabase,
      "athlete-1",
      "2026-04-25",
      "training_sessions",
    );
    expect(result.trainingFocus).toBe("skill");
    expect(result.aiRationale).toContain("No wellness data yet");
    expect(result.confidenceMetadata.acwr).toMatchObject({
      hasData: false,
      source: "training_sessions",
      trainingDaysLogged: 5,
      confidence: "building_baseline",
    });
    expect(result.confidenceMetadata.sessionResolution).toMatchObject({
      success: true,
      status: "baseline_program",
      hasProgram: false,
      hasSessionTemplate: false,
      baselineProgram: true,
      originalStatus: "no_program",
    });
  });

  test("keeps baseline athletes in recovery when ACWR exceeds target range", async () => {
    const result = await buildProtocolDecisionContext({
      supabase: mockSupabase(),
      userId: "athlete-1",
      date: "2026-04-23",
      context: {
        dayOfWeek: 4,
        readiness: {
          score: 84,
          acwr: 1.42,
          hasCheckin: true,
        },
        sessionResolution: {
          success: true,
          status: "baseline_program",
          metadata: {
            originalStatus: "no_program",
          },
        },
        sessionTemplate: null,
        playerProgram: null,
        acwrTargetRange: {
          min: 0.8,
          max: 1.3,
        },
      },
      computeReadinessDaysStale: vi.fn().mockResolvedValue(0),
      computeTrainingDaysLogged: vi.fn().mockResolvedValue(12),
    });

    expect(result.trainingFocus).toBe("recovery");
    expect(result.aiRationale).toContain("Readiness is low or ACWR is high");
  });
});
