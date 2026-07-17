import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { REFUEL } from "../../netlify/functions/utils/nutrition-protocols.js";

const here = dirname(fileURLToPath(import.meta.url));

const read = (rel) => readFileSync(resolve(here, rel), "utf8");

/**
 * Refuel protein co-ingestion (~0.3 g/kg) is genuinely the SAME constant in both
 * runtimes: the server uses it in `betweenGamesRefuel`, the client prints it on
 * the tournament timeline. It used to be a bare `0.3` literal in three places
 * (client ×2, server ×1), which §4 calls a bug even while the numbers agree —
 * they drift eventually. It is now one canonical server constant
 * (`REFUEL.PROTEIN_G_PER_KG`) mirrored on the client, guarded here, exactly like
 * PAIN_TRIGGER_THRESHOLD / SORENESS_PAIN_TRIGGER. The two live in separate
 * runtimes and can't share an import.
 *
 * NOTE the carb numbers are deliberately NOT parity-checked: the server's
 * CARB_G_PER_KG_PER_H is a *rate* × window (cumulative), while the client's gap
 * doses are *per-eating-occasion* amounts. Different questions, different units
 * — asserting equality between them would be wrong. See the header of
 * angular/src/app/core/constants/nutrition.constants.ts.
 */
describe("refuel protein co-ingestion: client/server parity", () => {
  it("client nutrition.constants.ts mirrors the server constant exactly", () => {
    const clientSrc = read(
      "../../angular/src/app/core/constants/nutrition.constants.ts",
    );
    const match = clientSrc.match(/PROTEIN_G_PER_KG:\s*([\d.]+)/);
    expect(
      match,
      "PROTEIN_G_PER_KG not found in nutrition.constants.ts",
    ).toBeTruthy();
    expect(Number(match[1])).toBe(REFUEL.PROTEIN_G_PER_KG);
  });

  it("server still owns the canonical value (and it is the evidence figure)", () => {
    expect(REFUEL.PROTEIN_G_PER_KG).toBe(0.3);
  });

  it("client tournament-plan.service.ts uses the constant, never a bare literal", () => {
    const src = read(
      "../../angular/src/app/core/services/tournament-plan.service.ts",
    );
    expect(src).toMatch(/NUTRITION\.PROTEIN_G_PER_KG/);
    // the exact regression this test exists to prevent
    expect(src).not.toMatch(/0\.3 \* bodyweightKg/);
  });

  it("client tournament-plan.service.ts carries no bare per-kg carb literals either", () => {
    const src = read(
      "../../angular/src/app/core/services/tournament-plan.service.ts",
    );
    for (const literal of [
      /\b0\.4 \* bodyweightKg/,
      /\b1 \* bodyweightKg/,
      /\b1\.25 \* bodyweightKg/,
      /\b1\.2 \* bodyweightKg/,
    ]) {
      expect(src, `bare literal ${literal} reintroduced`).not.toMatch(literal);
    }
    expect(src).toMatch(/TOURNAMENT_GAP_FUEL\./);
    expect(src).toMatch(/POST_DAY_RECOVERY\.CARB_G_PER_KG/);
  });
});
