/**
 * computeOverride contract tests (PROMPT 2.19 lineage).
 *
 * Replaces the legacy self-running netlify/functions/utils/compute-override.spec.js,
 * which was excluded from vitest and tested a DUPLICATED copy of the function —
 * these tests import the real export from utils/daily-protocol-context.js, so
 * they can't silently diverge from production.
 *
 * Contract:
 * 1. participation === "excluded" MUST NOT yield "flag_practice" or "film_room".
 * 2. Priority: rehab_protocol > coach_alert > weather_override >
 *    teamActivity (if not excluded) > taper > null.
 */

import { describe, it, expect } from "vitest";
import { computeOverride } from "../../netlify/functions/utils/daily-protocol-context.js";

const base = {
  rehabActive: false,
  injuries: [],
  coachAlertActive: false,
  weatherOverride: false,
  teamActivity: null,
  taperActive: false,
  taperContext: null,
};

describe("computeOverride — excluded-athlete contract", () => {
  it("excluded participation never yields flag_practice", () => {
    const result = computeOverride({
      ...base,
      teamActivity: { type: "practice", participation: "excluded" },
    });
    expect(result?.type).not.toBe("flag_practice");
    expect(result).toBeNull(); // nothing else active → no override at all
  });

  it("excluded participation never yields film_room", () => {
    const result = computeOverride({
      ...base,
      teamActivity: { type: "film_room", participation: "excluded" },
    });
    expect(result?.type).not.toBe("film_room");
    expect(result).toBeNull();
  });

  it("included participation yields flag_practice with scheduled time", () => {
    const result = computeOverride({
      ...base,
      teamActivity: { type: "practice", participation: "included", startTimeLocal: "19:30" },
    });
    expect(result?.type).toBe("flag_practice");
    expect(result?.reason).toContain("19:30");
    expect(result?.replaceSession).toBe(true);
  });

  it("replacesSession: false is honoured on team activities", () => {
    const result = computeOverride({
      ...base,
      teamActivity: { type: "film_room", participation: "included", replacesSession: false },
    });
    expect(result?.type).toBe("film_room");
    expect(result?.replaceSession).toBe(false);
  });
});

describe("computeOverride — priority order", () => {
  const everything = {
    rehabActive: true,
    injuries: ["hamstring"],
    coachAlertActive: true,
    weatherOverride: true,
    teamActivity: { type: "practice", participation: "included" },
    taperActive: true,
    taperContext: { tournament: { name: "SVN Cup" }, daysUntil: 3 },
  };

  it("rehab_protocol beats everything (safety first) and names the injury", () => {
    const result = computeOverride(everything);
    expect(result?.type).toBe("rehab_protocol");
    expect(result?.reason).toContain("hamstring");
    expect(result?.replaceSession).toBe(true);
  });

  it("coach_alert is next once rehab clears", () => {
    const result = computeOverride({ ...everything, rehabActive: false });
    expect(result?.type).toBe("coach_alert");
    expect(result?.replaceSession).toBe(false);
  });

  it("weather_override is next once coach alert clears", () => {
    const result = computeOverride({
      ...everything,
      rehabActive: false,
      coachAlertActive: false,
    });
    expect(result?.type).toBe("weather_override");
  });

  it("team activity is next; taper only fires when nothing above is active", () => {
    const teamFirst = computeOverride({
      ...everything,
      rehabActive: false,
      coachAlertActive: false,
      weatherOverride: false,
    });
    expect(teamFirst?.type).toBe("flag_practice");

    const taper = computeOverride({
      ...everything,
      rehabActive: false,
      coachAlertActive: false,
      weatherOverride: false,
      teamActivity: null,
    });
    expect(taper?.type).toBe("taper");
    expect(taper?.reason).toContain("SVN Cup");
    expect(taper?.replaceSession).toBe(false);
  });

  it("taper on an EXCLUDED practice day still fires (excluded team activity is ignored)", () => {
    const result = computeOverride({
      ...base,
      teamActivity: { type: "practice", participation: "excluded" },
      taperActive: true,
      taperContext: { tournament: { name: "SVN Cup" }, daysUntil: 2 },
    });
    expect(result?.type).toBe("taper");
  });

  it("nothing active → null (no override)", () => {
    expect(computeOverride(base)).toBeNull();
  });
});
