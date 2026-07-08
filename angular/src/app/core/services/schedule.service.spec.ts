/**
 * schedule.service.ts — resolvePhase / effectiveImportance regression tests.
 *
 * These MUST mirror `tests/unit/schedule-resolver.test.js` (the server-side
 * suite for `netlify/functions/schedule.js`'s resolvePhase) scenario-for-
 * scenario — same inputs, same expected phase, on both implementations. If
 * this suite and the server suite ever diverge, an athlete would see one
 * phase on Today and a different phase baked into their server-side
 * prescription. See the V2.4 competition-tier work in
 * docs/v2/V2.4-global-tiers.md.
 */

import { describe, it, expect } from "vitest";
import { resolvePhase, effectiveImportance } from "./schedule-resolver";
import { CompetitionEvent } from "../models/schedule.models";

const ONE_HOUR_MS = 3_600_000;
const ONE_DAY_MS = 86_400_000;
const now = new Date("2026-05-08T12:00:00.000Z");

function event(overrides: Partial<CompetitionEvent> = {}): CompetitionEvent {
  return {
    id: "ev-1",
    competitionId: "c-1",
    teamId: "t-1",
    startsAt: now.toISOString(),
    endsAt: null,
    expectedGameCount: 1,
    importance: "regular",
    label: null,
    location: null,
    venue: null,
    hotelName: null,
    hotelAddress: null,
    notes: null,
    status: "scheduled",
    competitionName: "Test Cup",
    competitionShortName: null,
    competitionKind: "tournament",
    competitionLevel: "national",
    competitionCountry: null,
    competitionSeasonYear: null,
    teamName: "Test Team",
    source: "team",
    ...overrides,
  };
}

describe("effectiveImportance", () => {
  it("club/national levels don't raise a regular importance", () => {
    expect(effectiveImportance("regular", "club")).toBe("regular");
    expect(effectiveImportance("regular", "national")).toBe("regular");
  });
  it("continental floors a regular event up to 'high'", () => {
    expect(effectiveImportance("regular", "continental")).toBe("high");
  });
  it("never lowers an already-peak event", () => {
    expect(effectiveImportance("peak", "continental")).toBe("peak");
  });
  it("world/olympic floor a regular event all the way up to 'peak'", () => {
    expect(effectiveImportance("regular", "world")).toBe("peak");
    expect(effectiveImportance("regular", "olympic")).toBe("peak");
  });
});

describe("resolvePhase — tier-aware taper window (mirrors netlify schedule.js)", () => {
  it("a continental event at regular importance tapers 3 days out (high floor)", () => {
    const ev = event({
      startsAt: new Date(now.getTime() + 3 * ONE_DAY_MS).toISOString(),
      importance: "regular",
      competitionLevel: "continental",
    });
    expect(resolvePhase({ date: now, upcoming: [ev], lastEvent: null })).toBe(
      "taper",
    );

    const noFloor = event({
      startsAt: new Date(now.getTime() + 3 * ONE_DAY_MS).toISOString(),
      importance: "regular",
      competitionLevel: "national",
    });
    expect(
      resolvePhase({ date: now, upcoming: [noFloor], lastEvent: null }),
    ).toBe("accumulation");
  });

  it("a world championship at regular importance tapers 9 days out (peak floor + 3-day bonus)", () => {
    const ev = event({
      startsAt: new Date(now.getTime() + 9 * ONE_DAY_MS).toISOString(),
      importance: "regular",
      competitionLevel: "world",
    });
    expect(resolvePhase({ date: now, upcoming: [ev], lastEvent: null })).toBe(
      "taper",
    );
  });

  it("an olympic event tapers 12 days out at only 'high' importance (peak floor + 7-day bonus)", () => {
    const ev = event({
      startsAt: new Date(now.getTime() + 12 * ONE_DAY_MS).toISOString(),
      importance: "high",
      competitionLevel: "olympic",
    });
    expect(resolvePhase({ date: now, upcoming: [ev], lastEvent: null })).toBe(
      "taper",
    );
  });
});

describe("resolvePhase — tier-aware recovery window (mirrors netlify schedule.js)", () => {
  it("recovers 4.5 days (108h) after a world event ended", () => {
    const pastEnd = new Date(now.getTime() - 108 * ONE_HOUR_MS).toISOString();
    const past = event({
      startsAt: pastEnd,
      endsAt: pastEnd,
      importance: "regular",
      competitionLevel: "world",
    });
    expect(resolvePhase({ date: now, upcoming: [], lastEvent: past })).toBe(
      "recovery",
    );
  });

  it("recovers 6 days (144h) after an olympic event ended", () => {
    const pastEnd = new Date(now.getTime() - 144 * ONE_HOUR_MS).toISOString();
    const past = event({
      startsAt: pastEnd,
      endsAt: pastEnd,
      importance: "regular",
      competitionLevel: "olympic",
    });
    expect(resolvePhase({ date: now, upcoming: [], lastEvent: past })).toBe(
      "recovery",
    );
  });

  it("the same 108h-ago event at 'national' level has already left recovery", () => {
    const pastEnd = new Date(now.getTime() - 108 * ONE_HOUR_MS).toISOString();
    const past = event({
      startsAt: pastEnd,
      endsAt: pastEnd,
      importance: "regular",
      competitionLevel: "national",
    });
    expect(resolvePhase({ date: now, upcoming: [], lastEvent: past })).not.toBe(
      "recovery",
    );
  });
});
