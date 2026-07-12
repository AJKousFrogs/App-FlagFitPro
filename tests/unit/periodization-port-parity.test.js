import { describe, it, expect } from "vitest";
import {
  prescribeFor as clientPrescribe,
  planWeek as clientPlanWeek,
} from "../../angular/src/app/core/services/periodization-engine.ts";
import {
  prescribeFor as portPrescribe,
  planWeek as portPlanWeek,
} from "../../netlify/functions/utils/periodization-engine.js";
import { CASES } from "./periodization-cases.js";

/**
 * BACKEND PORT PARITY — the server engine (netlify/functions/utils/periodization-
 * engine.js, generated from the TS source via `npm run build:periodization-engine`)
 * must produce byte-for-byte identical prescriptions to the client engine for every
 * fixture. This is the guarantee that lets the client be switched to consume the
 * server without an athlete ever seeing a different prescription.
 *
 * It is ALSO a staleness guard: if the TS engine changes and the port is not
 * regenerated, the outputs diverge and this test fails — enforcing single-source.
 */
describe("periodization backend port ⇔ client parity", () => {
  for (const c of CASES) {
    it(`port matches client for case: ${c.name}`, () => {
      const clientOut = clientPrescribe(structuredClone(c.input));
      const portOut = portPrescribe(structuredClone(c.input));
      expect(portOut.intent).toBeTruthy();
      expect(portOut).toEqual(clientOut);
    });
  }
});

/**
 * planWeek is the SINGLE week-planning orchestration shared by the client
 * (periodization.service `weekAhead`/`today`) and the server
 * (periodization-prescription). These lock (a) source⇔port byte parity and (b)
 * the property whose absence caused the Today-vs-This-Week drift: the weekly
 * rest-minimum is a WEEK-level pass applied to the whole week — INCLUDING day 0 —
 * which a single-day computation structurally cannot do.
 */
describe("planWeek: port ⇔ client parity + weekly passes on day 0", () => {
  // An off-season accumulation week with no games and no team practices: every
  // day resolves to training, so enforceWeeklyRestMinimum MUST convert days to
  // rest (>= 2). Day 0 is a candidate — the exact scenario that drifted.
  function weekFixture() {
    const dayInputs = [];
    const teamPracticeFlags = [];
    const phases7 = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date("2026-03-02T12:00:00Z");
      date.setUTCDate(date.getUTCDate() + i);
      dayInputs.push({
        date,
        phase: "accumulation",
        upcoming: [],
        lastEvent: null,
        acwr: i === 0 ? 1.0 : null,
        readiness: i === 0 ? 70 : null,
        bodyweightKg: 80,
        density14d: null,
        seasonPhase: "offseason",
        weather: null,
        recentSessions: [],
        ageYears: 25,
        position: null,
        isTeamPractice: false,
        activeRestrictions: [],
        acclimatizationDay: null,
        arrivalDayTravelHours: null,
      });
      teamPracticeFlags.push(false);
      phases7.push("accumulation");
    }
    return { dayInputs, teamPracticeFlags, phases7 };
  }

  it("port matches client across the full week", () => {
    const f = weekFixture();
    const g = weekFixture();
    const clientOut = clientPlanWeek(
      f.dayInputs,
      f.teamPracticeFlags,
      f.phases7,
      70,
      1.0,
    );
    const portOut = portPlanWeek(
      g.dayInputs,
      g.teamPracticeFlags,
      g.phases7,
      70,
      1.0,
    );
    expect(portOut).toEqual(clientOut);
  });

  it("applies the >= 2 rest-day minimum a single-day computation cannot", () => {
    const f = weekFixture();
    const week = clientPlanWeek(
      f.dayInputs,
      f.teamPracticeFlags,
      f.phases7,
      70,
      1.0,
    );
    const restDays = week.filter((p) => p.intent === "rest").length;
    expect(restDays).toBeGreaterThanOrEqual(2);
  });
});
