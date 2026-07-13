import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { PAIN_TRIGGER_THRESHOLD } from "../../netlify/functions/utils/safety-override.js";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Phase 1 (P3): the soreness pain-trigger threshold used to be a bare literal in
 * two runtimes — server `> 3`, client `>= 6` — so a 4–5 soreness silently never
 * reached the safety-override path. It is now one canonical server constant
 * (PAIN_TRIGGER_THRESHOLD) mirrored on the client. This test fails if the two
 * ever diverge again, since they live in separate runtimes and can't share an
 * import.
 */
describe("soreness pain-trigger threshold: client/server parity", () => {
  it("client wellness.constants.ts mirrors the server constant exactly", () => {
    const clientSrc = readFileSync(
      resolve(
        here,
        "../../angular/src/app/core/constants/wellness.constants.ts",
      ),
      "utf8",
    );
    const match = clientSrc.match(/SORENESS_PAIN_TRIGGER:\s*(\d+)/);
    expect(
      match,
      "SORENESS_PAIN_TRIGGER not found in wellness.constants.ts",
    ).toBeTruthy();
    expect(Number(match[1])).toBe(PAIN_TRIGGER_THRESHOLD);
  });

  it("server wellness-checkin.js gates detectPainTrigger on the shared constant, not a literal", () => {
    const src = readFileSync(
      resolve(here, "../../netlify/functions/wellness-checkin.js"),
      "utf8",
    );
    expect(src).toMatch(/muscleSoreness > PAIN_TRIGGER_THRESHOLD/);
  });

  it("client wellness.service.ts gates the follow-up call on the shared constant", () => {
    const src = readFileSync(
      resolve(here, "../../angular/src/app/core/services/wellness.service.ts"),
      "utf8",
    );
    expect(src).toMatch(/WELLNESS\.SORENESS_PAIN_TRIGGER/);
  });
});
