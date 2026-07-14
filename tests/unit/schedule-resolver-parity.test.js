import { describe, it, expect } from "vitest";
import { resolvePhase as clientResolvePhase } from "../../angular/src/app/core/services/schedule-resolver.ts";
import { __test__ } from "../../netlify/functions/schedule.js";

const { resolvePhase: serverResolvePhase } = __test__;

/**
 * 2026-07-08 reusability-audit finding F3: `resolvePhase` is deliberately mirrored
 * client (schedule.service.ts) and server (schedule.js) — the server's own comment
 * says so explicitly ("Mirrors resolvePhase in schedule.service.ts so client and
 * server agree... even if upstream filters change") — but unlike the periodization
 * engine (29-case golden-parity test) or the ACWR config (CI drift guard), there was
 * NO automated test proving the two actually agree. This is that guard.
 *
 * The two take different shapes (client: camelCase CompetitionEvent[] + Date; server:
 * snake_case raw rows + Date) by design — the adapters below build one canonical
 * scenario into both shapes so a single fixture drives both sides.
 */

function clientEvent({
  startsAt,
  endsAt = null,
  importance = "regular",
  competitionLevel = "national",
}) {
  return {
    id: "e1",
    competitionId: "c1",
    teamId: "t1",
    startsAt,
    endsAt,
    expectedGameCount: 1,
    importance,
    label: null,
    location: null,
    venue: null,
    hotelName: null,
    hotelAddress: null,
    notes: null,
    status: "scheduled",
    competitionLevel,
  };
}

function serverEvent({
  startsAt,
  endsAt = null,
  importance = "regular",
  competitionLevel = "national",
}) {
  return {
    starts_at: startsAt,
    ends_at: endsAt,
    importance,
    competition_level: competitionLevel,
  };
}

function comparePhase({ now, upcoming = [], lastEvent = null }) {
  const client = clientResolvePhase({
    date: now,
    upcoming: upcoming.map(clientEvent),
    lastEvent: lastEvent ? clientEvent(lastEvent) : null,
  });
  const server = serverResolvePhase(
    now,
    upcoming.map(serverEvent),
    lastEvent ? serverEvent(lastEvent) : null,
  );
  return { client, server };
}

describe("resolvePhase: client ⇔ server parity", () => {
  it("no events at all -> transition on both", () => {
    const { client, server } = comparePhase({
      now: new Date("2026-07-15T12:00:00Z"),
    });
    expect(client).toBe("transition");
    expect(server).toBe(client);
  });

  it("weekend game day (Saturday, regular importance) -> competition on both", () => {
    // 2026-07-18 is a Saturday
    const now = new Date("2026-07-18T12:00:00Z");
    const { client, server } = comparePhase({
      now,
      upcoming: [{ startsAt: "2026-07-18T18:00:00Z" }],
    });
    expect(client).toBe("competition");
    expect(server).toBe(client);
  });

  it("weekday event, regular importance -> travel on both (not weekend, not international)", () => {
    // 2026-07-15 is a Wednesday
    const now = new Date("2026-07-15T12:00:00Z");
    const { client, server } = comparePhase({
      now,
      upcoming: [{ startsAt: "2026-07-15T18:00:00Z" }],
    });
    expect(client).toBe("travel");
    expect(server).toBe(client);
  });

  it("peak-importance event 5 days out -> taper on both", () => {
    const now = new Date("2026-07-15T12:00:00Z");
    const { client, server } = comparePhase({
      now,
      upcoming: [{ startsAt: "2026-07-20T12:00:00Z", importance: "peak" }],
    });
    expect(client).toBe("taper");
    expect(server).toBe(client);
  });

  it("just finished a peak event (12h ago) -> recovery on both", () => {
    const now = new Date("2026-07-16T00:00:00Z");
    const { client, server } = comparePhase({
      now,
      lastEvent: { startsAt: "2026-07-15T12:00:00Z", importance: "peak" },
    });
    expect(client).toBe("recovery");
    expect(server).toBe(client);
  });

  it("regular week, no nearby event -> accumulation on both", () => {
    const now = new Date("2026-07-15T12:00:00Z");
    const { client, server } = comparePhase({
      now,
      upcoming: [{ startsAt: "2026-07-25T12:00:00Z" }],
    });
    expect(client).toBe("accumulation");
    expect(server).toBe(client);
  });

  it("world-level event on a weekday -> competition on both (international bypasses the weekend gate)", () => {
    const now = new Date("2026-07-15T12:00:00Z");
    const { client, server } = comparePhase({
      now,
      upcoming: [
        {
          startsAt: "2026-07-15T18:00:00Z",
          importance: "peak",
          competitionLevel: "world",
        },
      ],
    });
    expect(client).toBe("competition");
    expect(server).toBe(client);
  });
});
