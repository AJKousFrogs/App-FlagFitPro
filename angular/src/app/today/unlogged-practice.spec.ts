import { describe, it, expect } from "vitest";
import { resolveUnloggedPractice } from "./unlogged-practice";

/**
 * The "log your practice" nudge (item A2, honest fix). It fires for a team
 * practice today/yesterday with no logged session — nudging the athlete to log
 * the REAL session so its actual load reaches ACWR (never a fabricated estimate).
 */

const NOW = new Date("2026-07-15T09:00:00"); // a Wednesday, local
const iso = (d: number) => {
  const x = new Date(NOW);
  x.setDate(NOW.getDate() + d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
    x.getDate(),
  ).padStart(2, "0")}`;
};
const TODAY = iso(0); // 2026-07-15
const YESTERDAY = iso(-1); // 2026-07-14

describe("resolveUnloggedPractice", () => {
  it("today's practice, nothing logged → nudge (today's)", () => {
    expect(resolveUnloggedPractice([TODAY], [], NOW)).toEqual({
      label: "today's",
    });
  });

  it("yesterday's practice, nothing logged → nudge (yesterday's)", () => {
    expect(resolveUnloggedPractice([YESTERDAY], [], NOW)).toEqual({
      label: "yesterday's",
    });
  });

  it("prefers TODAY over yesterday when both are unlogged", () => {
    expect(resolveUnloggedPractice([YESTERDAY, TODAY], [], NOW)).toEqual({
      label: "today's",
    });
  });

  it("suppressed once a session is logged for that day", () => {
    const logged = [`${TODAY}T18:30:00`]; // completed_at on the practice day
    expect(resolveUnloggedPractice([TODAY], logged, NOW)).toBeNull();
  });

  it("ignores older practice days (only today/yesterday)", () => {
    expect(resolveUnloggedPractice([iso(-3)], [], NOW)).toBeNull();
  });

  it("ignores future practice days", () => {
    expect(resolveUnloggedPractice([iso(1)], [], NOW)).toBeNull();
  });

  it("no training days → null", () => {
    expect(resolveUnloggedPractice([], [], NOW)).toBeNull();
    expect(resolveUnloggedPractice(null, [], NOW)).toBeNull();
  });
});
