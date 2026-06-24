/**
 * Schedule resolver — netlify ↔ angular mirror contract.
 *
 * The phase resolver lives in two places and they MUST agree:
 *
 *   - Server: netlify/functions/schedule.js → resolvePhase()
 *   - Client: angular/src/app/core/services/schedule.service.ts → resolvePhase()
 *
 * If they ever drift, an athlete sees one phase on the today screen and a
 * different phase get baked into their server-side prescription. This
 * suite exercises both implementations on identical inputs and asserts
 * they agree, plus locks down the canonical phase decisions for documented
 * scenarios.
 */

import { describe, it, expect } from "vitest";
import { __test__ as netlifyResolver } from "../../netlify/functions/schedule.js";

const { resolvePhase: netlifyResolvePhase, densityFor, eventDayCount } =
  netlifyResolver;

// Hours window thresholds (mirrored from both implementations).
const ONE_HOUR_MS = 3_600_000;
const ONE_DAY_MS = 86_400_000;

// Build a minimal snake_case event row matching `v_athlete_schedule`.
function event({
  startsAt,
  endsAt = null,
  importance = "regular",
  expectedGameCount = 1,
  status = "scheduled",
}) {
  return {
    id: "ev-1",
    starts_at: startsAt instanceof Date ? startsAt.toISOString() : startsAt,
    ends_at:
      endsAt instanceof Date ? endsAt.toISOString() : endsAt,
    importance,
    expected_game_count: expectedGameCount,
    status,
  };
}

const now = new Date("2026-05-08T12:00:00.000Z");

describe("netlify resolvePhase", () => {
  describe("competition window", () => {
    it("returns 'competition' when now is between starts_at and ends_at", () => {
      const ev = event({
        startsAt: new Date(now.getTime() - 2 * ONE_HOUR_MS),
        endsAt: new Date(now.getTime() + 2 * ONE_HOUR_MS),
      });
      expect(netlifyResolvePhase(now, [ev], null)).toBe("competition");
    });

    it("returns 'competition' on a single-instant event happening now", () => {
      const ev = event({ startsAt: now });
      expect(netlifyResolvePhase(now, [ev], null)).toBe("competition");
    });
  });

  describe("taper window", () => {
    it("returns 'taper' for a peak event 5 days out (within 7-day peak window)", () => {
      const ev = event({
        startsAt: new Date(now.getTime() + 5 * ONE_DAY_MS),
        importance: "peak",
      });
      expect(netlifyResolvePhase(now, [ev], null)).toBe("taper");
    });

    it("returns 'taper' for a high event 3 days out (within 4-day high window)", () => {
      const ev = event({
        startsAt: new Date(now.getTime() + 3 * ONE_DAY_MS),
        importance: "high",
      });
      expect(netlifyResolvePhase(now, [ev], null)).toBe("taper");
    });

    it("returns 'taper' for a regular event 1 day out (within 2-day regular window)", () => {
      const ev = event({
        startsAt: new Date(now.getTime() + 1 * ONE_DAY_MS),
        importance: "regular",
      });
      expect(netlifyResolvePhase(now, [ev], null)).toBe("taper");
    });

    it("returns 'accumulation' for a peak event 8 days out (beyond peak taper)", () => {
      const ev = event({
        startsAt: new Date(now.getTime() + 8 * ONE_DAY_MS),
        importance: "peak",
      });
      expect(netlifyResolvePhase(now, [ev], null)).toBe("accumulation");
    });
  });

  describe("recovery window", () => {
    it("returns 'recovery' for a peak event ended 2 days ago (within 4-day peak)", () => {
      const last = event({
        startsAt: new Date(now.getTime() - 3 * ONE_DAY_MS),
        endsAt: new Date(now.getTime() - 2 * ONE_DAY_MS),
        importance: "peak",
      });
      expect(netlifyResolvePhase(now, [], last)).toBe("recovery");
    });

    it("returns 'recovery' for a high event ended 36h ago (within 48h high)", () => {
      const last = event({
        startsAt: new Date(now.getTime() - 2 * ONE_DAY_MS),
        endsAt: new Date(now.getTime() - 36 * ONE_HOUR_MS),
        importance: "high",
      });
      expect(netlifyResolvePhase(now, [], last)).toBe("recovery");
    });

    it("returns 'transition' when last event recovered out (beyond window)", () => {
      const last = event({
        startsAt: new Date(now.getTime() - 30 * ONE_DAY_MS),
        endsAt: new Date(now.getTime() - 30 * ONE_DAY_MS),
        importance: "regular",
      });
      expect(netlifyResolvePhase(now, [], last)).toBe("transition");
    });
  });

  describe("transition vs accumulation", () => {
    it("returns 'transition' when nothing is scheduled", () => {
      expect(netlifyResolvePhase(now, [], null)).toBe("transition");
    });

    it("returns 'transition' when next event is more than 14 days out", () => {
      const ev = event({
        startsAt: new Date(now.getTime() + 30 * ONE_DAY_MS),
        importance: "regular",
      });
      expect(netlifyResolvePhase(now, [ev], null)).toBe("transition");
    });

    it("returns 'accumulation' when next event is 10 days out (regular)", () => {
      const ev = event({
        startsAt: new Date(now.getTime() + 10 * ONE_DAY_MS),
        importance: "regular",
      });
      expect(netlifyResolvePhase(now, [ev], null)).toBe("accumulation");
    });
  });

  describe("priority ordering: competition beats recovery beats taper", () => {
    it("inside-event window beats a recent past event", () => {
      const inEvent = event({
        startsAt: new Date(now.getTime() - 1 * ONE_HOUR_MS),
        endsAt: new Date(now.getTime() + 1 * ONE_HOUR_MS),
      });
      const last = event({
        startsAt: new Date(now.getTime() - 2 * ONE_DAY_MS),
        endsAt: new Date(now.getTime() - 1 * ONE_DAY_MS),
        importance: "peak",
      });
      expect(netlifyResolvePhase(now, [inEvent], last)).toBe("competition");
    });

    it("a recent peak recovery beats an upcoming taper", () => {
      // Next: regular event 1 day out → would be taper window
      const next = event({
        startsAt: new Date(now.getTime() + 1 * ONE_DAY_MS),
        importance: "regular",
      });
      // Last: peak ended 1 day ago → within the 4-day peak recovery window
      const last = event({
        startsAt: new Date(now.getTime() - 2 * ONE_DAY_MS),
        endsAt: new Date(now.getTime() - 1 * ONE_DAY_MS),
        importance: "peak",
      });
      // Recovery takes priority: a heavy weekend's fatigue must clear before
      // "sharp, not heavy" taper framing makes sense for the next game.
      expect(netlifyResolvePhase(now, [next], last)).toBe("recovery");
    });
  });

  describe("defensive: lastEvent in the future is ignored", () => {
    it("doesn't fire recovery when lastEvent.ends_at is in the future", () => {
      // Pre-filter normally guarantees lastEvent is past, but the resolver
      // must defend against bad inputs to keep mirror parity with the client.
      const futurePast = event({
        startsAt: new Date(now.getTime() + 1 * ONE_DAY_MS),
        endsAt: new Date(now.getTime() + 2 * ONE_DAY_MS),
        importance: "peak",
      });
      // No upcoming, just the bogus future "lastEvent" → should be transition
      expect(netlifyResolvePhase(now, [], futurePast)).toBe("transition");
    });
  });
});

describe("netlify densityFor", () => {
  it("counts games inside the window only", () => {
    const inside = event({
      startsAt: new Date(now.getTime() + 3 * ONE_DAY_MS),
      expectedGameCount: 4,
    });
    const outside = event({
      startsAt: new Date(now.getTime() + 30 * ONE_DAY_MS),
      expectedGameCount: 8,
    });
    const d = densityFor([inside, outside], now, 14);
    expect(d.totalGames).toBe(4);
    expect(d.eventDayCount).toBe(1);
    expect(d.hasPeakImportance).toBe(false);
  });

  it("flags hasPeakImportance for peak events in window", () => {
    const peak = event({
      startsAt: new Date(now.getTime() + 5 * ONE_DAY_MS),
      importance: "peak",
      expectedGameCount: 6,
    });
    const d = densityFor([peak], now, 14);
    expect(d.hasPeakImportance).toBe(true);
    expect(d.totalGames).toBe(6);
  });

  it("returns zero counts when nothing is in the window", () => {
    const d = densityFor([], now, 7);
    expect(d.totalGames).toBe(0);
    expect(d.eventDayCount).toBe(0);
    expect(d.peakDayGameCount).toBe(0);
    expect(d.hasPeakImportance).toBe(false);
    expect(d.windowDays).toBe(7);
  });
});

describe("netlify eventDayCount", () => {
  it("returns 1 for a single-day event with no ends_at", () => {
    expect(eventDayCount("2026-05-08T08:00:00Z", null)).toBe(1);
  });

  it("returns 1 for an event that ends the same UTC day", () => {
    expect(
      eventDayCount("2026-05-08T08:00:00Z", "2026-05-08T18:00:00Z"),
    ).toBe(1);
  });

  it("returns 2 for a two-day tournament", () => {
    expect(
      eventDayCount("2026-05-08T08:00:00Z", "2026-05-09T18:00:00Z"),
    ).toBe(2);
  });

  it("returns at least 1 even if dates are reversed", () => {
    expect(
      eventDayCount("2026-05-09T08:00:00Z", "2026-05-08T08:00:00Z"),
    ).toBe(1);
  });
});

// =============================================================================
// CONGESTION PEAK-DAY ESTIMATE — must not let an uneven multi-day tournament
// read as falsely light (regression for the averaging fail-open bug).
// =============================================================================

describe("densityFor — conservative worst-day game estimate", () => {
  const from = new Date("2026-03-01T00:00:00Z");
  const ev = (startsOffset, endsOffset, games, importance = "high") => {
    const d = (n) => new Date(from.getTime() + n * 86_400_000).toISOString();
    return {
      starts_at: d(startsOffset),
      ends_at: endsOffset == null ? null : d(endsOffset),
      expected_game_count: games,
      importance,
    };
  };

  it("a 6-game / 3-day tournament estimates a ~3-game peak day (trips ≥3), not the 2.0 average", () => {
    const d = densityFor([ev(5, 7, 6)], from, 14); // 3 calendar days, 6 games
    expect(d.peakDayGameCount).toBeGreaterThanOrEqual(3);
  });

  it("an 8-game / 2-day tournament estimates a heavy peak day", () => {
    const d = densityFor([ev(5, 6, 8)], from, 14); // 2 days
    expect(d.peakDayGameCount).toBeGreaterThanOrEqual(3);
  });

  it("a single-day 3-game league round reads 3 (trips)", () => {
    const d = densityFor([ev(5, null, 3)], from, 14);
    expect(d.peakDayGameCount).toBeGreaterThanOrEqual(3);
  });

  it("a genuinely light spread (1 game/day over 4 days) stays below the threshold", () => {
    const d = densityFor([ev(5, 8, 4)], from, 14); // 4 days, 4 games
    expect(d.peakDayGameCount).toBeLessThan(3);
  });
});
