import { describe, it, expect } from "vitest";
import {
  computeSupplementInsights,
  canonicalSupplementName,
} from "../../netlify/functions/supplements.js";

const TODAY = "2026-07-12";

/** Build a taken=true log row n days before TODAY. */
function logDaysAgo(name, n, taken = true) {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return {
    supplement_name: name,
    date: d.toISOString().slice(0, 10),
    taken,
  };
}

describe("canonicalSupplementName: free-text folding", () => {
  it("folds creatine variants into one bucket", () => {
    expect(canonicalSupplementName("Creatine")).toBe("creatine");
    expect(canonicalSupplementName("Creatine Monohydrate 5g")).toBe("creatine");
    expect(canonicalSupplementName("kreatin")).toBe("creatine");
  });

  it("folds beta-alanine variants", () => {
    expect(canonicalSupplementName("Beta-Alanine")).toBe("beta-alanine");
    expect(canonicalSupplementName("beta alanine 3.2g")).toBe("beta-alanine");
  });

  it("keeps unknown names as themselves (lowercased)", () => {
    expect(canonicalSupplementName("Omega-3")).toBe("omega-3");
  });
});

describe("computeSupplementInsights: habit + lapse boundaries", () => {
  it("5 taken days in the prior 30 + none in the last 7 → lapsed", () => {
    const logs = [8, 11, 15, 20, 28].map((n) => logDaysAgo("Creatine", n));
    const [insight] = computeSupplementInsights(logs, TODAY);
    expect(insight.supplement).toBe("creatine");
    expect(insight.priorHabitDays).toBe(5);
    expect(insight.takenDaysLast7).toBe(0);
    expect(insight.habit).toBe(true);
    expect(insight.lapsed).toBe(true);
  });

  it("4 prior taken days is below the habit threshold → not lapsed", () => {
    const logs = [8, 11, 15, 20].map((n) => logDaysAgo("Creatine", n));
    const [insight] = computeSupplementInsights(logs, TODAY);
    expect(insight.habit).toBe(false);
    expect(insight.lapsed).toBe(false);
  });

  it("a log within the last 7 days clears the lapse", () => {
    const logs = [2, 8, 11, 15, 20, 28].map((n) => logDaysAgo("Creatine", n));
    const [insight] = computeSupplementInsights(logs, TODAY);
    expect(insight.habit).toBe(true);
    expect(insight.takenDaysLast7).toBe(1);
    expect(insight.lapsed).toBe(false);
  });

  it("taken=false rows never count toward the habit", () => {
    const logs = [8, 11, 15, 20, 28].map((n) =>
      logDaysAgo("Creatine", n, false),
    );
    expect(computeSupplementInsights(logs, TODAY)).toHaveLength(0);
  });

  it("day-7 boundary: exactly 7 days ago belongs to the habit window, not the lapse gap", () => {
    // Last log exactly LAPSE_GAP_DAYS (7) ago + 4 older habit days → the day-7
    // log counts toward priorHabitDays (making 5) and NOT takenDaysLast7.
    const logs = [7, 10, 14, 21, 28].map((n) => logDaysAgo("Creatine", n));
    const [insight] = computeSupplementInsights(logs, TODAY);
    expect(insight.takenDaysLast7).toBe(0);
    expect(insight.priorHabitDays).toBe(5);
    expect(insight.lapsed).toBe(true);
  });

  it("groups variant names into one supplement's habit", () => {
    const logs = [
      logDaysAgo("Creatine", 8),
      logDaysAgo("Creatine Monohydrate", 12),
      logDaysAgo("kreatin 5g", 16),
      logDaysAgo("Creatine", 22),
      logDaysAgo("Creatine", 29),
    ];
    const insights = computeSupplementInsights(logs, TODAY);
    expect(insights).toHaveLength(1);
    expect(insights[0].priorHabitDays).toBe(5);
    expect(insights[0].lapsed).toBe(true);
  });

  it("multiple supplements are tracked independently", () => {
    const logs = [
      ...[8, 11, 15, 20, 28].map((n) => logDaysAgo("Creatine", n)),
      ...[1, 3].map((n) => logDaysAgo("Beta-Alanine", n)),
    ];
    const insights = computeSupplementInsights(logs, TODAY);
    const creatine = insights.find((i) => i.supplement === "creatine");
    const beta = insights.find((i) => i.supplement === "beta-alanine");
    expect(creatine?.lapsed).toBe(true);
    expect(beta?.lapsed).toBe(false);
    expect(beta?.takenDaysLast7).toBe(2);
  });
});
