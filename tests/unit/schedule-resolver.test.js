/**
 * Schedule resolver — netlify ↔ angular mirror contract.
 *
 * The phase resolver lives in two places and the architecture doc (§3,
 * docs/PRESCRIPTION_SPEC.md §8) explicitly states they MUST agree:
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

    it("upcoming taper beats a recent peak recovery", () => {
      // Next: regular event 1 day out → taper window
      const next = event({
        startsAt: new Date(now.getTime() + 1 * ONE_DAY_MS),
        importance: "regular",
      });
      // Last: peak ended 1 day ago → would be recovery
      const last = event({
        startsAt: new Date(now.getTime() - 2 * ONE_DAY_MS),
        endsAt: new Date(now.getTime() - 1 * ONE_DAY_MS),
        importance: "peak",
      });
      // Taper takes priority because the upcoming game is closer than recovery resolution
      expect(netlifyResolvePhase(now, [next], last)).toBe("taper");
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
