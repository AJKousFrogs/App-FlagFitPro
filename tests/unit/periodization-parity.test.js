import { describe, it, expect } from "vitest";
import { prescribeFor } from "../../angular/src/app/core/services/periodization-engine.ts";
import { CASES } from "./periodization-cases.js";

/**
 * GOLDEN PARITY HARNESS for the periodization engine.
 *
 * Runs the (now pure, DI-free) client engine over the shared fixture matrix and
 * snapshots each DailyPrescription. This serves two jobs:
 *   1. NOW — a regression guard: any change to the engine's output for a fixed
 *      input shows up as a snapshot diff and must be an intentional behavior change.
 *   2. NEXT (Batch 3) — the golden reference for the backend port: the server's
 *      prescribeFor is fed the SAME CASES and asserted equal to these snapshots,
 *      proving the client and server compute identical prescriptions before the
 *      client is switched to consume the server (no silent divergence for athletes).
 *
 * prescribeFor is pure (inputs -> output, no clock/RNG), so snapshots are stable.
 */
describe("periodization engine — golden parity fixtures", () => {
  it("covers every case exactly once", () => {
    const names = CASES.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    expect(CASES.length).toBeGreaterThanOrEqual(25);
  });

  for (const c of CASES) {
    it(`prescription is stable for case: ${c.name}`, () => {
      const out = prescribeFor(c.input);
      // Core decision fields must always be present and well-typed.
      expect(out.intent).toBeTruthy();
      expect(typeof out.targetMinutes).toBe("number");
      expect(out).toMatchSnapshot();
    });
  }
});
