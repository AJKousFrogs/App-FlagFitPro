import { describe, it, expect } from "vitest";
import {
  planWeek,
  mesocycleWeekFor,
} from "../../angular/src/app/core/services/periodization-engine.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Audit batch 2 (§3.1 mesocycle 3:1 wave · §3.2 sprint-exposure floor).
// Both are ADDITIVE: null mesocycleWeek / null daysSinceHighSpeed → planWeek is
// byte-identical to before (locked by the untouched golden/parity suites).
// ─────────────────────────────────────────────────────────────────────────────

const mon = new Date("2026-07-13T08:00:00Z");
const DAY = 864e5;

const offseasonWeek = (extra = {}) =>
  Array.from({ length: 7 }, (_, i) => ({
    date: new Date(mon.getTime() + i * DAY),
    phase: "transition",
    upcoming: [],
    lastEvent: null,
    acwr: 1.0,
    readiness: 80,
    bodyweightKg: 84,
    density14d: null,
    seasonPhase: "offseason",
    ...extra,
  }));

const noPractice = new Array(7).fill(false);
const transition7 = new Array(7).fill("transition");

describe("mesocycleWeekFor — derived from declared season windows", () => {
  it("cycles 1→4 weekly from the build window's start (recurring MM-DD)", () => {
    const w = [{ phase: "offseason", from: "06-15", to: "09-30" }];
    expect(mesocycleWeekFor(w, new Date("2026-06-16T08:00:00Z"))).toBe(1);
    expect(mesocycleWeekFor(w, new Date("2026-06-23T08:00:00Z"))).toBe(2);
    expect(mesocycleWeekFor(w, new Date("2026-06-30T08:00:00Z"))).toBe(3);
    expect(mesocycleWeekFor(w, new Date("2026-07-07T08:00:00Z"))).toBe(4);
    expect(mesocycleWeekFor(w, new Date("2026-07-14T08:00:00Z"))).toBe(1); // cycle 2
  });

  it("specific YYYY-MM-DD windows work; in-season windows do NOT wave", () => {
    const specific = [
      { phase: "preseason", from: "2026-07-01", to: "2026-08-31" },
    ];
    expect(mesocycleWeekFor(specific, new Date("2026-07-09T08:00:00Z"))).toBe(
      2,
    );
    const inseason = [{ phase: "inseason", from: "06-01", to: "09-30" }];
    expect(
      mesocycleWeekFor(inseason, new Date("2026-07-14T08:00:00Z")),
    ).toBeNull();
    expect(mesocycleWeekFor([], new Date())).toBeNull();
    expect(mesocycleWeekFor(null, new Date())).toBeNull();
  });
});

describe("mesocycle 3:1 wave — volume waves, intensity holds", () => {
  it("week 4 deloads quality days ~35% (minutes/reps/sets), RPE held, PM doubles stripped", () => {
    const base = planWeek(offseasonWeek(), noPractice, transition7, 80, 1.0);
    const deload = planWeek(
      offseasonWeek({ mesocycleWeek: 4 }),
      noPractice,
      transition7,
      80,
      1.0,
    );
    for (let i = 0; i < 7; i++) {
      expect(deload[i].intent).toBe(base[i].intent); // wave never changes the day type
      expect(deload[i].targetRpe).toBe(base[i].targetRpe); // intensity HELD
      if (base[i].intent === "rest") {
        expect(deload[i].targetMinutes).toBe(base[i].targetMinutes); // rest untouched
      } else {
        expect(deload[i].targetMinutes).toBeLessThan(base[i].targetMinutes);
        expect(deload[i].reasoning).toContain("Deload week");
      }
      expect(deload[i].secondSession ?? null).toBeNull(); // no doubles on deload
    }
    expect(base.some((d) => d.secondSession)).toBe(true); // baseline HAS doubles
  });

  it("week 2 builds volume ~5%; week 1 is the unchanged baseline", () => {
    const base = planWeek(offseasonWeek(), noPractice, transition7, 80, 1.0);
    const w1 = planWeek(
      offseasonWeek({ mesocycleWeek: 1 }),
      noPractice,
      transition7,
      80,
      1.0,
    );
    const w2 = planWeek(
      offseasonWeek({ mesocycleWeek: 2 }),
      noPractice,
      transition7,
      80,
      1.0,
    );
    const iStrength = base.findIndex((d) => d.intent === "strength");
    expect(w1[iStrength].targetMinutes).toBe(base[iStrength].targetMinutes);
    expect(w2[iStrength].targetMinutes).toBe(
      Math.round(base[iStrength].targetMinutes * 1.05),
    );
  });

  it("practice days are never waved", () => {
    const flags = [false, true, false, true, false, false, false];
    const deload = planWeek(
      offseasonWeek({ mesocycleWeek: 4 }),
      flags,
      transition7,
      80,
      1.0,
    );
    const base = planWeek(offseasonWeek(), flags, transition7, 80, 1.0);
    expect(deload[1].targetMinutes).toBe(base[1].targetMinutes);
    expect(deload[3].targetMinutes).toBe(base[3].targetMinutes);
  });
});

describe("sprint-exposure floor — no silent weeks without high-speed running", () => {
  // In-season shape (quality = strength + technical) plans no sprint by itself.
  const inseasonWeek = (extra = {}) =>
    Array.from({ length: 7 }, (_, i) => ({
      date: new Date(mon.getTime() + i * DAY),
      phase: "accumulation",
      upcoming: [
        {
          startsAt: new Date(mon.getTime() + 20 * DAY).toISOString(),
          endsAt: new Date(mon.getTime() + 20 * DAY).toISOString(),
          importance: "regular",
          competitionLevel: "national",
        },
      ],
      lastEvent: null,
      acwr: 1.0,
      readiness: 80,
      bodyweightKg: 84,
      density14d: null,
      seasonPhase: "inseason",
      ...extra,
    }));
  const accum7 = new Array(7).fill("accumulation");

  it("9 days without exposure + no sprint planned → one MAINTENANCE sprint day", () => {
    const week = planWeek(
      inseasonWeek({ daysSinceHighSpeed: 9 }),
      noPractice,
      accum7,
      80,
      1.0,
    );
    const floorDays = week.filter((d) =>
      d.reasoning.includes("Speed maintenance"),
    );
    expect(floorDays).toHaveLength(1);
    expect(floorDays[0].intent).toBe("sprint");
    expect(floorDays[0].sprintReps).toBeLessThanOrEqual(5); // maintenance dose
    expect(floorDays[0].targetMinutes).toBeLessThanOrEqual(60);
  });

  it("a practice in the week IS exposure → no floor", () => {
    const flags = [false, true, false, false, false, false, false];
    const week = planWeek(
      inseasonWeek({ daysSinceHighSpeed: 9 }),
      flags,
      accum7,
      80,
      1.0,
    );
    expect(week.some((d) => d.reasoning.includes("Speed maintenance"))).toBe(
      false,
    );
  });

  it("null daysSinceHighSpeed (no logged sessions) → no floor, no fabrication", () => {
    const week = planWeek(inseasonWeek(), noPractice, accum7, 80, 1.0);
    expect(week.some((d) => d.reasoning.includes("Speed maintenance"))).toBe(
      false,
    );
  });

  it("guard demotion (sprint restriction) → honest 'exposure postponed' advice, not silence", () => {
    const week = planWeek(
      inseasonWeek({
        daysSinceHighSpeed: 9,
        activeRestrictions: {
          restrictsSprint: true,
          severity: "moderate",
          regions: ["hamstring"],
        },
      }),
      noPractice,
      accum7,
      80,
      1.0,
    );
    expect(week.some((d) => d.intent === "sprint")).toBe(false); // injury wins
    expect(week.some((d) => d.reasoning.includes("postponed"))).toBe(true);
  });
});
