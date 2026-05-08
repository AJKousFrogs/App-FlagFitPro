/**
 * Cross-mirror contract: client `resolvePhase` ↔ server `resolvePhase`.
 *
 * The architecture doc (§3, docs/PRESCRIPTION_SPEC.md §8) requires the two
 * implementations to agree on a (now, upcoming, lastEvent) tuple. If they
 * drift, the same athlete sees one phase on Today and the server bakes a
 * different phase into their prescription.
 *
 * This spec runs both functions against a shared corpus of canonical
 * scenarios. A drift makes the suite fail with a precise diff. Each test
 * is named after the canonical phase decision it locks in.
 *
 * Note on import shape:
 *   - Angular side: `resolvePhase(ctx: PhaseContext)` — single-object arg
 *     with camelCase event fields (`startsAt`, `endsAt`).
 *   - Netlify side: `resolvePhase(now, upcoming, lastEvent)` — positional
 *     args with snake_case event fields (`starts_at`, `ends_at`).
 *
 * The helpers below adapt one corpus row into both call shapes.
 */

import { describe, it, expect } from "vitest";
import { resolvePhase as clientResolvePhase } from "./schedule.service";
import { __test__ as netlifyResolver } from "../../../../../netlify/functions/schedule.js";
import {
  CompetitionEvent,
  EventImportance,
} from "../../../app/core/models/schedule.models";

const { resolvePhase: serverResolvePhase } = netlifyResolver;

const ONE_HOUR_MS = 3_600_000;
const ONE_DAY_MS = 86_400_000;

const NOW = new Date("2026-05-08T12:00:00.000Z");

interface CorpusEvent {
  startsAt: Date;
  endsAt?: Date;
  importance?: EventImportance;
}

/** Build a typed CompetitionEvent shaped for the Angular `resolvePhase`. */
function clientEvent(e: CorpusEvent): CompetitionEvent {
  return {
    id: "ev",
    competitionId: "c",
    teamId: "t",
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt ? e.endsAt.toISOString() : null,
    expectedGameCount: 1,
    importance: e.importance ?? "regular",
    label: null,
    location: null,
    venue: null,
    notes: null,
    status: "scheduled",
    competitionName: "Comp",
    competitionShortName: null,
    competitionKind: "league",
    competitionLevel: "national",
    competitionCountry: null,
    competitionSeasonYear: 2026,
    teamName: "Team",
  };
}

/** Build the snake_case shape consumed by the netlify resolver. */
function serverEvent(e: CorpusEvent): Record<string, unknown> {
  return {
    starts_at: e.startsAt.toISOString(),
    ends_at: e.endsAt ? e.endsAt.toISOString() : null,
    importance: e.importance ?? "regular",
    expected_game_count: 1,
    status: "scheduled",
  };
}

interface Scenario {
  name: string;
  expected:
    | "competition"
    | "taper"
    | "recovery"
    | "accumulation"
    | "transition";
  upcoming: CorpusEvent[];
  lastEvent: CorpusEvent | null;
}

const CORPUS: Scenario[] = [
  // Competition window
  {
    name: "now is inside an event window → competition",
    expected: "competition",
    upcoming: [
      {
        startsAt: new Date(NOW.getTime() - 1 * ONE_HOUR_MS),
        endsAt: new Date(NOW.getTime() + 1 * ONE_HOUR_MS),
      },
    ],
    lastEvent: null,
  },

  // Taper windows by importance
  {
    name: "peak event 5 days out (within 7-day taper)",
    expected: "taper",
    upcoming: [
      {
        startsAt: new Date(NOW.getTime() + 5 * ONE_DAY_MS),
        importance: "peak",
      },
    ],
    lastEvent: null,
  },
  {
    name: "high event 3 days out (within 4-day taper)",
    expected: "taper",
    upcoming: [
      {
        startsAt: new Date(NOW.getTime() + 3 * ONE_DAY_MS),
        importance: "high",
      },
    ],
    lastEvent: null,
  },
  {
    name: "regular event 1 day out (within 2-day taper)",
    expected: "taper",
    upcoming: [
      {
        startsAt: new Date(NOW.getTime() + 1 * ONE_DAY_MS),
        importance: "regular",
      },
    ],
    lastEvent: null,
  },
  {
    name: "peak event 8 days out (beyond 7-day peak taper)",
    expected: "accumulation",
    upcoming: [
      {
        startsAt: new Date(NOW.getTime() + 8 * ONE_DAY_MS),
        importance: "peak",
      },
    ],
    lastEvent: null,
  },

  // Recovery windows by importance
  {
    name: "peak event ended 2 days ago (within 4-day recovery)",
    expected: "recovery",
    upcoming: [],
    lastEvent: {
      startsAt: new Date(NOW.getTime() - 3 * ONE_DAY_MS),
      endsAt: new Date(NOW.getTime() - 2 * ONE_DAY_MS),
      importance: "peak",
    },
  },
  {
    name: "high event ended 36h ago (within 48h recovery)",
    expected: "recovery",
    upcoming: [],
    lastEvent: {
      startsAt: new Date(NOW.getTime() - 2 * ONE_DAY_MS),
      endsAt: new Date(NOW.getTime() - 36 * ONE_HOUR_MS),
      importance: "high",
    },
  },

  // Transition vs accumulation
  {
    name: "nothing scheduled → transition",
    expected: "transition",
    upcoming: [],
    lastEvent: null,
  },
  {
    name: "next event >14 days out → transition",
    expected: "transition",
    upcoming: [
      {
        startsAt: new Date(NOW.getTime() + 30 * ONE_DAY_MS),
        importance: "regular",
      },
    ],
    lastEvent: null,
  },
  {
    name: "next event 10 days out (regular, beyond taper) → accumulation",
    expected: "accumulation",
    upcoming: [
      {
        startsAt: new Date(NOW.getTime() + 10 * ONE_DAY_MS),
        importance: "regular",
      },
    ],
    lastEvent: null,
  },

  // Priority: competition beats recovery
  {
    name: "inside event window AND recent peak past → competition wins",
    expected: "competition",
    upcoming: [
      {
        startsAt: new Date(NOW.getTime() - 1 * ONE_HOUR_MS),
        endsAt: new Date(NOW.getTime() + 1 * ONE_HOUR_MS),
      },
    ],
    lastEvent: {
      startsAt: new Date(NOW.getTime() - 2 * ONE_DAY_MS),
      endsAt: new Date(NOW.getTime() - 1 * ONE_DAY_MS),
      importance: "peak",
    },
  },

  // Priority: taper beats recovery
  {
    name: "regular event 1 day out AND recent peak → taper wins over recovery",
    expected: "taper",
    upcoming: [
      {
        startsAt: new Date(NOW.getTime() + 1 * ONE_DAY_MS),
        importance: "regular",
      },
    ],
    lastEvent: {
      startsAt: new Date(NOW.getTime() - 2 * ONE_DAY_MS),
      endsAt: new Date(NOW.getTime() - 1 * ONE_DAY_MS),
      importance: "peak",
    },
  },

  // Defensive: a future "lastEvent" should not flip recovery on (mirror parity)
  {
    name: "future lastEvent is ignored (defensive, no recovery)",
    expected: "transition",
    upcoming: [],
    lastEvent: {
      startsAt: new Date(NOW.getTime() + 1 * ONE_DAY_MS),
      endsAt: new Date(NOW.getTime() + 2 * ONE_DAY_MS),
      importance: "peak",
    },
  },
];

describe("resolvePhase mirror — client and server agree", () => {
  for (const scenario of CORPUS) {
    it(`${scenario.name}`, () => {
      const clientUpcoming = scenario.upcoming.map(clientEvent);
      const clientLast = scenario.lastEvent
        ? clientEvent(scenario.lastEvent)
        : null;
      const serverUpcoming = scenario.upcoming.map(serverEvent);
      const serverLast = scenario.lastEvent
        ? serverEvent(scenario.lastEvent)
        : null;

      const clientPhase = clientResolvePhase({
        date: NOW,
        upcoming: clientUpcoming,
        lastEvent: clientLast,
      });
      const serverPhase = serverResolvePhase(
        NOW,
        serverUpcoming,
        serverLast,
      );

      expect(clientPhase).toBe(scenario.expected);
      expect(serverPhase).toBe(scenario.expected);
      expect(clientPhase).toBe(serverPhase);
    });
  }
});
