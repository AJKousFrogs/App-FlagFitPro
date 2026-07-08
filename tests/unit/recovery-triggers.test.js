import { describe, it, expect } from "vitest";
import { generateRecoveryRecommendations } from "../../netlify/functions/recovery-core.js";

/**
 * 2026-07-08 reusability audit F6: the priority/next-day-recovery trigger
 * thresholds used to be bare numbers in `if` conditions (intensity >= 8, etc.) —
 * extracted to named RECOVERY_TRIGGERS constants. These tests lock in the exact
 * boundary values so a future edit can't silently shift a threshold.
 */
describe("generateRecoveryRecommendations: priority thresholds (RECOVERY_TRIGGERS)", () => {
  it("intensity 8 -> high priority (HIGH_INTENSITY boundary)", () => {
    const r = generateRecoveryRecommendations({ intensity: 8, soreness: 3 });
    expect(r.priority).toBe("high");
  });

  it("intensity 6 within 1 day of next session -> high priority", () => {
    const r = generateRecoveryRecommendations({
      intensity: 6,
      soreness: 3,
      daysUntilNextSession: 1,
    });
    expect(r.priority).toBe("high");
  });

  it("intensity 6 with 2+ days until next session -> not elevated by that rule", () => {
    const r = generateRecoveryRecommendations({
      intensity: 6,
      soreness: 3,
      daysUntilNextSession: 2,
    });
    expect(r.priority).not.toBe("high");
  });

  // NOTE (pre-existing, unchanged by this extraction — not a regression, and
  // deliberately NOT fixed under F6, which is a config-extraction pass, not a
  // behavior change): the priority chain is `if/else if`, and
  // HIGH_INTENSITY (8) < CRITICAL_INTENSITY (9), so any intensity >= 9 already
  // satisfies the FIRST (high) branch and never reaches the critical check —
  // "critical" via intensity alone is unreachable; only soreness >= 7 (with
  // intensity < 8) can produce it. Flagged as its own follow-up, not silently
  // changed here.
  it("intensity 9 alone -> 'high' (not 'critical' — the high branch is checked first)", () => {
    const r = generateRecoveryRecommendations({ intensity: 9, soreness: 3 });
    expect(r.priority).toBe("high");
  });

  it("soreness 7 -> critical priority (CRITICAL_SORENESS boundary)", () => {
    const r = generateRecoveryRecommendations({ intensity: 3, soreness: 7 });
    expect(r.priority).toBe("critical");
  });

  it("intensity 4 -> low priority (LOW_INTENSITY boundary)", () => {
    const r = generateRecoveryRecommendations({ intensity: 4, soreness: 1 });
    expect(r.priority).toBe("low");
  });

  it("soreness 5 -> next-day active recovery recommended (NEXT_DAY_SORENESS boundary)", () => {
    const r = generateRecoveryRecommendations({ intensity: 3, soreness: 5 });
    expect(
      r.nextDay.some((rec) => rec.protocol === "active_recovery"),
    ).toBe(true);
  });

  it("intensity 7 -> next-day active recovery recommended (NEXT_DAY_INTENSITY boundary)", () => {
    const r = generateRecoveryRecommendations({ intensity: 7, soreness: 1 });
    expect(
      r.nextDay.some((rec) => rec.protocol === "active_recovery"),
    ).toBe(true);
  });

  it("low intensity+soreness -> no next-day active recovery push", () => {
    const r = generateRecoveryRecommendations({ intensity: 3, soreness: 2 });
    expect(
      r.nextDay.some((rec) => rec.protocol === "active_recovery"),
    ).toBe(false);
  });
});
