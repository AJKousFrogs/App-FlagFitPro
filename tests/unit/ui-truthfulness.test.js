import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, "../..", p), "utf8");

/**
 * Phase 1 (Law 7 — no fabricated UI data). The Today "Body check" used to render
 * "Logged: … coach notified" from HARDCODED strings while persisting nothing —
 * the worst trust bug in the system. These guards pin the fix: the "Logged"
 * claim must be derived from a saved state that is only reached AFTER a real
 * athlete_injuries write, and the old fabricated copy must stay gone.
 */
describe("Today body check: action-claims derive from real state, not hardcode", () => {
  const src = read("angular/src/app/today/today.component.ts");

  it("no longer contains the fabricated 'Coach notified' / 'coach sees the flag' copy", () => {
    expect(src).not.toMatch(/coach notified/i);
    expect(src).not.toMatch(/coach sees the flag/i);
  });

  it("persists via the real InjuryService.report path before claiming success", () => {
    expect(src).toMatch(/await this\.injurySvc\.report\(/);
    const reportIdx = src.indexOf("await this.injurySvc.report(");
    const savedIdx = src.indexOf('bodyLogState.set("saved")');
    expect(reportIdx).toBeGreaterThan(-1);
    expect(savedIdx).toBeGreaterThan(-1);
    // "saved" state is only set AFTER the write is awaited.
    expect(savedIdx).toBeGreaterThan(reportIdx);
  });

  it("shows the 'Logged' success copy only in the saved branch, and an error state on failure", () => {
    // The success strings live behind `state === "saved"`.
    expect(src).toMatch(/state === "saved"/);
    const savedBranchIdx = src.indexOf('state === "saved"');
    const loggedCopyIdx = src.indexOf("Logged: ${list}");
    expect(loggedCopyIdx).toBeGreaterThan(savedBranchIdx);
    // Failure sets an explicit error state, never a success claim.
    expect(src).toMatch(/bodyLogState\.set\("error"\)/);
    expect(src).toMatch(/Couldn't log that/);
  });

  it("a save failure does not fall through to a 'Logged' message", () => {
    // The catch block sets error state; the saved branch is unreachable without
    // a resolved report() — enforced by the ordering assertion above.
    const catchIdx = src.indexOf("catch (err)");
    const errorSetIdx = src.indexOf('bodyLogState.set("error")');
    expect(errorSetIdx).toBeGreaterThan(catchIdx);
  });
});

/**
 * Phase 1 (P3): high soreness with nothing flagged must PROMPT a body check
 * (Law 5a — the slider is an input, not a trigger; silence at 9/10 is wrong).
 */
describe("Wellness: high soreness prompts a body check honestly", () => {
  const ts = read("angular/src/app/wellness/wellness.component.ts");
  const html = read("angular/src/app/wellness/wellness.component.html");

  it("gates the prompt on the shared HIGH_PAIN_THRESHOLD, not a literal", () => {
    expect(ts).toMatch(/WELLNESS\.HIGH_PAIN_THRESHOLD/);
    expect(ts).toMatch(/bodyCheckPrompt/);
  });

  it("prompt copy is honest that the slider alone does not change the session", () => {
    expect(html).toMatch(/doesn't change your session/i);
  });

  it("does not hard-block: a second submit ('anyway') proceeds", () => {
    expect(html).toMatch(/Log check-in anyway/);
  });
});
