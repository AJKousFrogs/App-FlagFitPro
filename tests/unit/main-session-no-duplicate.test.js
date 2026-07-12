import { describe, it, expect } from "vitest";
import { generateMainSessionFallback } from "../../netlify/functions/utils/daily-protocol-main-session.js";

/**
 * Bug 2026-07-12: a gym day listed every exercise twice — once in its split block
 * (Isometrics / Plyometrics / …) and again in a consolidated "Main Session". On a
 * gym day the split blocks ARE the session; the generator must NOT emit a
 * duplicate Main Session that copies them.
 */
describe("generateMainSessionFallback: gym day does not duplicate the split blocks", () => {
  const gymDayInputs = (protocolExercises) => ({
    supabase: null, // never touched on the gym-with-blocks path (early return)
    protocolExercises,
    context: {},
    trainingFocus: "gpp",
    hasGymAccess: true,
    hasFieldAccess: true,
    isSprintSession: false,
    isGymTrainingDay: true,
    periodizationPhase: "accumulation",
    acwrForLogic: 1.0,
  });

  it("treats split-block exercises as the session and adds zero main_session copies", async () => {
    const protocolExercises = [
      {
        exercise_id: "a",
        exercise_name: "Iso Split-Squat Hold",
        block_type: "isometrics",
      },
      {
        exercise_id: "b",
        exercise_name: "Copenhagen Plank Hold",
        block_type: "isometrics",
      },
      {
        exercise_id: "c",
        exercise_name: "Depth Jump",
        block_type: "plyometrics",
      },
      {
        exercise_id: "d",
        exercise_name: "Glute Bridge",
        block_type: "strength",
      },
    ];
    const res = await generateMainSessionFallback(
      gymDayInputs(protocolExercises),
    );

    expect(res.mainSessionGenerated).toBe(true);
    expect(res.sessionType).toBe("gym");
    // The bug was copies of the split blocks into a consolidated main_session.
    const mainSession = protocolExercises.filter(
      (e) => e.block_type === "main_session",
    );
    expect(mainSession.length).toBe(0);
    // No exercise appears in more than one block.
    const ids = protocolExercises.map((e) => e.exercise_id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
