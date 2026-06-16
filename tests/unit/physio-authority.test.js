/**
 * Physio-authority regression lock (Phase 2 / SOT Law 5a).
 *
 * Locks the behavior that daily-protocol's RTP trigger routes through
 * athlete_injuries (severity-tiered, expiry-aware) rather than the raw
 * soreness_areas slider on daily_wellness_checkin.
 *
 * Before the fix, hasActiveInjuries = wellnessCheckin?.soreness_areas.length > 0,
 * which (a) locked athletes in rehab off one stale soreness tag and (b) let a
 * real active injury be bypassed by a single clean check-in.
 */

import { describe, it, expect } from "vitest";
import { createSupabaseMock } from "../helpers/supabase-mock.js";
import {
  getActiveInjuries,
  injuriesPainLevel,
} from "../../netlify/functions/utils/active-injuries.js";

// ─── injuriesPainLevel (pure, no DB) ─────────────────────────────────────────

describe("injuriesPainLevel — maps injury_grade to RTP pain level", () => {
  it("Grade 3 → level 4 (severe, Phase 1 only — physio consult)", () => {
    expect(injuriesPainLevel([{ injury_grade: "Grade 3" }])).toBe(4);
  });

  it("Grade 2 → level 3 (moderate, Phase 1 only — light activity)", () => {
    expect(injuriesPainLevel([{ injury_grade: "Grade 2" }])).toBe(3);
  });

  it("Grade 1 → level 2 (mild, Phase 2 eligible — light loading)", () => {
    expect(injuriesPainLevel([{ injury_grade: "Grade 1" }])).toBe(2);
  });

  it("unknown grade → level 2 (conservative fallback)", () => {
    expect(injuriesPainLevel([{ injury_grade: "unknown" }])).toBe(2);
  });

  it("worst injury wins when multiple are active", () => {
    const injuries = [
      { injury_grade: "Grade 1" },
      { injury_grade: "Grade 3" },
      { injury_grade: "Grade 2" },
    ];
    expect(injuriesPainLevel(injuries)).toBe(4);
  });

  it("empty list → level 2 (base minimum, never < 2)", () => {
    expect(injuriesPainLevel([])).toBe(2);
    expect(injuriesPainLevel(null)).toBe(2);
  });
});

// ─── getActiveInjuries — authority gate ──────────────────────────────────────

describe("getActiveInjuries — uses athlete_injuries, not soreness_areas", () => {
  const TODAY = "2026-06-16";
  const FUTURE = "2030-01-01";

  const clinicalInjury = {
    user_id: "u1",
    injury_location: "hamstring",
    injury_grade: "Grade 2",
    recovery_status: "active",
    injury_mechanism: "contact",       // not self_report → never expires
    activity_restrictions: ["sprint"],
    expected_return_date: null,
  };

  const selfReport = {
    user_id: "u1",
    injury_location: "knee",
    injury_grade: "Grade 1",
    recovery_status: "recovering",
    injury_mechanism: "self_report",
    activity_restrictions: ["sprint"],
    expected_return_date: TODAY,        // expiry = today → still active
  };

  const expiredSelfReport = {
    user_id: "u1",
    injury_location: "ankle",
    injury_grade: "Grade 1",
    recovery_status: "recovering",
    injury_mechanism: "self_report",
    activity_restrictions: ["sprint"],
    expected_return_date: "2026-06-10", // past → should be filtered out
  };

  it("returns clinical injuries regardless of expected_return_date", async () => {
    const client = createSupabaseMock({ athlete_injuries: [clinicalInjury] });
    const result = await getActiveInjuries("u1", TODAY, { client });
    expect(result).toHaveLength(1);
    expect(result[0].injury_location).toBe("hamstring");
  });

  it("returns a self-report whose expected_return_date is today or future", async () => {
    const client = createSupabaseMock({ athlete_injuries: [selfReport] });
    const result = await getActiveInjuries("u1", TODAY, { client });
    expect(result).toHaveLength(1);
    expect(result[0].injury_location).toBe("knee");
  });

  it("filters out an EXPIRED self-report (expected_return_date in the past)", async () => {
    const client = createSupabaseMock({ athlete_injuries: [expiredSelfReport] });
    const result = await getActiveInjuries("u1", TODAY, { client });
    // The expired self-report must not trigger RTP — this was the "stale tag locks
    // athlete in rehab forever" bug the authority was written to prevent.
    expect(result).toHaveLength(0);
  });

  it("a clinical injury survives even when a clean check-in would have cleared it", async () => {
    // Before the fix: if the athlete submits a clean check-in (no soreness_areas),
    // hasActiveInjuries = false → RTP was skipped even with a real active injury.
    // The authority reads athlete_injuries, so a clean check-in is irrelevant here.
    const client = createSupabaseMock({ athlete_injuries: [clinicalInjury] });
    const result = await getActiveInjuries("u1", TODAY, { client });
    expect(result).toHaveLength(1); // still active — check-in cannot clear a clinical injury
  });

  it("returns [] when no injuries active — training proceeds normally", async () => {
    const client = createSupabaseMock({ athlete_injuries: [] });
    const result = await getActiveInjuries("u1", TODAY, { client });
    expect(result).toHaveLength(0);
  });

  it("returns [] for unknown userId — never errors", async () => {
    const client = createSupabaseMock({ athlete_injuries: [clinicalInjury] });
    const result = await getActiveInjuries(null, TODAY, { client });
    expect(result).toHaveLength(0);
  });

  it("returns [] on DB error — safe fallback, training is not blocked", async () => {
    const client = createSupabaseMock(
      { athlete_injuries: [clinicalInjury] },
      { errors: { athlete_injuries: { message: "connection error" } } },
    );
    const result = await getActiveInjuries("u1", TODAY, { client });
    expect(result).toHaveLength(0);
  });

  it("a future expected_return_date self-report counts as active", async () => {
    const future = { ...selfReport, expected_return_date: FUTURE };
    const client = createSupabaseMock({ athlete_injuries: [future] });
    const result = await getActiveInjuries("u1", TODAY, { client });
    expect(result).toHaveLength(1);
  });
});

// ─── authority + pain-level compose ──────────────────────────────────────────

describe("authority + injuriesPainLevel compose — replaces the soreness_areas path", () => {
  const TODAY = "2026-06-16";

  it("Grade 3 active injury → pain level 4 (most restrictive RTP phase)", async () => {
    const client = createSupabaseMock({
      athlete_injuries: [{
        user_id: "u1",
        injury_location: "hamstring",
        injury_grade: "Grade 3",
        recovery_status: "active",
        injury_mechanism: "contact",
        activity_restrictions: ["sprint"],
        expected_return_date: null,
      }],
    });
    const injuries = await getActiveInjuries("u1", TODAY, { client });
    expect(injuries.length).toBeGreaterThan(0);
    expect(injuriesPainLevel(injuries)).toBe(4);
  });

  it("no active injuries → pain level 2 minimum, RTP not triggered", async () => {
    const client = createSupabaseMock({ athlete_injuries: [] });
    const injuries = await getActiveInjuries("u1", TODAY, { client });
    expect(injuries).toHaveLength(0);
    // generateProtocol should NOT call generateReturnToPlayProtocol
    // (hasActiveInjuries = false when authority returns empty array).
  });
});
