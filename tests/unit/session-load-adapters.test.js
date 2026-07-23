import { describe, it, expect } from "vitest";
import { getAdapter, listProviders } from "../../netlify/functions/utils/session-load-adapters.js";

describe("session-load adapters — manual (coach spreadsheet, no vendor export)", () => {
  it("is registered alongside the vendor adapters", () => {
    expect(listProviders()).toEqual(
      expect.arrayContaining(["catapult", "statsports", "manual"]),
    );
  });

  it("maps a row using FlagFit's canonical column names", () => {
    const adapter = getAdapter("manual");
    const row = {
      athlete_id: "ext-1",
      session_id: "sess-1",
      date: "2026-07-20",
      distance: "4500",
      load: "320",
      sprints: "6",
      max_speed: "28.4",
      max_hr: "188",
      avg_hr: "150",
      notes: "hard session",
    };

    expect(adapter.externalAthleteId(row)).toBe("ext-1");
    expect(adapter.sessionId(row)).toBe("sess-1");
    expect(adapter.recordedAt(row)).toBe("2026-07-20");
    expect(adapter.map(row)).toEqual({
      total_distance_m: 4500,
      player_load: 320,
      sprint_count: 6,
      sprint_distance_m: null,
      max_velocity_kmh: 28.4,
      hr_max: 188,
      hr_avg: 150,
      notes: "hard session",
    });
  });

  it("prefers the canonical column name over its alias when both are present", () => {
    const adapter = getAdapter("manual");
    const row = { total_distance_m: "100", distance: "999" };
    expect(adapter.map(row).total_distance_m).toBe(100);
  });

  it("returns null fields for missing/blank values rather than fabricating zeros", () => {
    const adapter = getAdapter("manual");
    const row = { athlete_id: "ext-1", session_id: "s1", date: "2026-07-20" };
    const mapped = adapter.map(row);
    expect(mapped.total_distance_m).toBeNull();
    expect(mapped.player_load).toBeNull();
    expect(mapped.notes).toBeNull();
  });
});
