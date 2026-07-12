import { describe, it, expect } from "vitest";
import { __compose__ } from "../../netlify/functions/daily-protocol.js";
import { isLowLoadFocus } from "../../netlify/functions/utils/daily-protocol-compose.js";

const { positionFlagsFor, mapIntentToSession } = __compose__;

// Safety-critical: these decide which EXERCISES a player gets. A Center must not
// get QB work; a sprint intent must build a sprint session, not a gym block.
describe("positionFlagsFor — fixes the raw 'qb' !== 'quarterback' bug", () => {
  it("recognises the canonical 'qb' bucket as QB", () => {
    expect(positionFlagsFor("qb").isQB).toBe(true);
    expect(positionFlagsFor("quarterback").isQB).toBe(true);
  });
  it("a center is a center, NOT a QB", () => {
    const f = positionFlagsFor("center");
    expect(f.isCenter).toBe(true);
    expect(f.isQB).toBe(false);
  });
  it("wr/db/wr_db are neither QB nor center", () => {
    for (const p of ["wr", "db", "wr_db"]) {
      const f = positionFlagsFor(p);
      expect(f.isQB).toBe(false);
      expect(f.isCenter).toBe(false);
    }
  });
  it("blitzer/rusher flagged", () => {
    expect(positionFlagsFor("blitzer").isBlitzer).toBe(true);
    expect(positionFlagsFor("rusher").isBlitzer).toBe(true);
  });
});

describe("mapIntentToSession — periodization intent → exercise session", () => {
  it("sprint / taper-prime build a sprint session, not a gym day", () => {
    for (const i of ["sprint", "taper-prime"]) {
      const m = mapIntentToSession(i, "Sprint focus");
      expect(m.isSprintSession).toBe(true);
      expect(m.isGymTrainingDay).toBe(false);
    }
  });
  it("strength / mixed / technical are gym days, not sprint", () => {
    for (const i of ["strength", "mixed", "technical"]) {
      const m = mapIntentToSession(i, "");
      expect(m.isGymTrainingDay).toBe(true);
      expect(m.isSprintSession).toBe(false);
    }
  });
  it("each low-load intent maps to its OWN distinct focus (not collapsed to recovery)", () => {
    const intents = ["rest", "recovery", "mobility", "travel", "competition"];
    // Distinct focus per intent — the whole point of the fix: rest ≠ recovery ≠
    // mobility ≠ travel ≠ competition, so the generator can realize each day type
    // differently instead of rendering them all as "recovery".
    const focuses = intents.map((i) => mapIntentToSession(i, "").trainingFocus);
    expect(new Set(focuses)).toEqual(new Set(intents));
    for (const i of intents) {
      const m = mapIntentToSession(i, "");
      expect(m.trainingFocus).toBe(i);
      // All are low-load: no gym, no sprint, not a practice — and classified as
      // low-load so the gym / main-session gating skips them.
      expect(isLowLoadFocus(m.trainingFocus)).toBe(true);
      expect(m.isGymTrainingDay).toBe(false);
      expect(m.isSprintSession).toBe(false);
      expect(m.isPracticeDay).toBe(false);
    }
  });
  it("a 'Flag football practice' label is a practice day regardless of intent", () => {
    const m = mapIntentToSession("mixed", "Flag football practice");
    expect(m.isPracticeDay).toBe(true);
    expect(m.isGymTrainingDay).toBe(false);
    expect(m.isSprintSession).toBe(false);
  });
});
