import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { REFUEL } from "../../netlify/functions/utils/nutrition-protocols.js";

const here = dirname(fileURLToPath(import.meta.url));

const read = (rel) => readFileSync(resolve(here, rel), "utf8");

/**
 * Refuel constants that are genuinely SHARED across the client/server boundary
 * are mirrored on the client and guarded here — the two live in separate
 * runtimes and can't share an import (same arrangement, and same rationale, as
 * PAIN_TRIGGER_THRESHOLD / SORENESS_PAIN_TRIGGER).
 *
 * Two constants are shared:
 *   - PROTEIN_G_PER_KG (~0.3): identical in both. Used to be a bare `0.3`
 *     literal in three places — a §4 bug even while the numbers agreed.
 *   - The carbohydrate REFUEL RATE (1.0 g/kg/h) + window cap (4 h): after the
 *     2026-07-17 evidence recalculation the client now DERIVES its medium/long
 *     gap carbs from this same rate (ISSN 2017 / Craven 2021 meta-analysis),
 *     instead of the old flat per-meal literals that under-advised carbs 2–3×.
 *     So the rate IS now shared and must not drift.
 *
 * Still NOT parity-checked: the two short-window doses
 * (TURNAROUND_FAST_CARB_G, SHORT_CARB_G_PER_KG) are deliberately GI-limited
 * per-occasion amounts, not the rate — within ~75 min of the next kickoff gut
 * tolerance is the binding constraint, not resynthesis. Asserting them equal to
 * the server rate would be wrong. See the nutrition.constants.ts header.
 */
describe("refuel constants: client/server parity", () => {
  const clientSrc = read(
    "../../angular/src/app/core/constants/nutrition.constants.ts",
  );
  const serviceSrc = read(
    "../../angular/src/app/core/services/tournament-plan.service.ts",
  );
  const clientNum = (re, label) => {
    const m = clientSrc.match(re);
    expect(m, `${label} not found in nutrition.constants.ts`).toBeTruthy();
    return Number(m[1]);
  };

  it("client mirrors the server protein constant exactly", () => {
    expect(clientNum(/PROTEIN_G_PER_KG:\s*([\d.]+)/, "PROTEIN_G_PER_KG")).toBe(
      REFUEL.PROTEIN_G_PER_KG,
    );
  });

  it("client mirrors the server carb rate + window cap exactly", () => {
    expect(
      clientNum(/REFUEL_CARB_G_PER_KG_PER_H:\s*([\d.]+)/, "carb rate"),
    ).toBe(REFUEL.CARB_G_PER_KG_PER_H);
    expect(
      clientNum(/REFUEL_CARB_WINDOW_CAP_H:\s*([\d.]+)/, "window cap"),
    ).toBe(REFUEL.CARB_WINDOW_CAP_H);
  });

  it("server still owns the canonical evidence figures", () => {
    expect(REFUEL.PROTEIN_G_PER_KG).toBe(0.3);
    expect(REFUEL.CARB_G_PER_KG_PER_H).toBe(1.0);
    expect(REFUEL.CARB_WINDOW_CAP_H).toBe(4);
  });

  it("client service derives from the constants, never a bare per-kg literal", () => {
    expect(serviceSrc).toMatch(/NUTRITION\.PROTEIN_G_PER_KG/);
    expect(serviceSrc).toMatch(/NUTRITION\.REFUEL_CARB_G_PER_KG_PER_H/);
    // the exact regressions this test exists to prevent
    for (const literal of [
      /\b0\.3 \* bodyweightKg/,
      /\b0\.4 \* bodyweightKg/,
      /\b1 \* bodyweightKg/,
      /\b1\.25 \* bodyweightKg/,
      /\b1\.2 \* bodyweightKg/,
    ]) {
      expect(serviceSrc, `bare literal ${literal} reintroduced`).not.toMatch(
        literal,
      );
    }
    expect(serviceSrc).toMatch(/TOURNAMENT_GAP_FUEL\./);
    expect(serviceSrc).toMatch(/POST_DAY_RECOVERY\.CARB_G_PER_KG/);
  });
});
