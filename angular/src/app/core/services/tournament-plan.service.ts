import { Injectable, computed, inject } from "@angular/core";

import { EventGamesService } from "./event-games.service";
import { PeriodizationService } from "./periodization.service";
import { SupabaseService } from "./supabase.service";
import { TOURNAMENT_DAY } from "../config/position-volume.config";
import { FALLBACK_BODYWEIGHT_KG } from "../config/athlete-defaults";
import {
  EventGame,
  GameGap,
  GapClass,
  TournamentDayPlan,
  TournamentPlanBlock,
} from "../models/tournament-plan.models";

/**
 * Tournament Mode gap-classification engine (V2.0).
 *
 * Pure functions (`classifyGap`, `buildTournamentDayPlan`) — same inputs
 * always yield the same plan, spec-tested in `tournament-plan.service.spec.ts`
 * the same way `periodization.service.ts` is. This is presentation/timing
 * logic layered ON TOP of the server-canonical prescription (nutrition
 * macros, readiness, ACWR) — it never recomputes those, only sequences a
 * multi-game day around them. See docs/v2/V2.0-tournament-mode.md.
 */

// Effective gap = next kickoff − (previous kickoff + expected duration).
// Thresholds match the V2 proposal's worked Capital Bowl example (games at
// 11:00/12:30/15:30/17:00 → ~50min/~2h20/~50min gaps land in short/long/short).
const GAP_TURNAROUND_MAX_MIN = 30;
const GAP_SHORT_MAX_MIN = 75;
const GAP_MEDIUM_MAX_MIN = 150;

// Mirrors periodization.service.ts's private HEAT_CAUTION_C (28°C apparent) —
// if one changes, change both (same pattern as schedule.service.ts's phase
// constants, which mirror the server for the same reason).
const HEAT_CAUTION_C = 28;

const PRE_GAME_ARRIVAL_BUFFER_MIN = 100; // arrive ~1h40 before first kickoff
const PRE_GAME_BREAKFAST_LEAD_MIN = 150; // finish breakfast ≥2.5h before kickoff
const FULL_WARMUP_LEAD_MIN = 40; // full RAMP warm-up starts T-40, runs ~25min

export function classifyGap(gapMinutes: number): GapClass {
  if (gapMinutes < GAP_TURNAROUND_MAX_MIN) return "turnaround";
  if (gapMinutes < GAP_SHORT_MAX_MIN) return "short";
  if (gapMinutes < GAP_MEDIUM_MAX_MIN) return "medium";
  return "long";
}

// `kickoff_time` is deliberately venue-local wall-clock with no timezone (see
// the event_games migration comment) — the gap engine only needs local
// wall-clock deltas, never a real instant in time. Bug fixed in V2.3: the
// original implementation round-tripped through `new Date(...)` (which
// parses a date+time-without-zone string as the HOST's local time) then read
// it back with `getUTCHours()` — those two are only the same clock when the
// host happens to run in UTC (true in this sandbox, false in a browser in
// Ljubljana at UTC+1/+2), so every generated time would have silently
// drifted by the viewer's UTC offset. Fixed to pure integer day/minute
// arithmetic with zero Date-object involvement.
function dayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Date.UTC with explicit numeric Y/M/D components is timezone-safe — unlike
  // parsing a string, it never consults the host's local offset.
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function toMinutes(date: string, time: string): number {
  return dayIndex(date) * 1_440 + timeToMinutes(time);
}

/** Render absolute day-minutes back to "HH:MM" wall-clock (wraps within its day). */
function fromMinutes(minutes: number): string {
  const m = ((Math.round(minutes) % 1_440) + 1_440) % 1_440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Compute the gaps between consecutive scheduled games, oldest-first. */
export function computeGaps(games: EventGame[]): GameGap[] {
  const sorted = [...games]
    .filter((g) => g.status !== "cancelled")
    .sort(
      (a, b) =>
        toMinutes(a.gameDate, a.kickoffTime) -
        toMinutes(b.gameDate, b.kickoffTime),
    );
  const gaps: GameGap[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    const prevEnd =
      toMinutes(prev.gameDate, prev.kickoffTime) + prev.expectedDurationMinutes;
    const nextStart = toMinutes(next.gameDate, next.kickoffTime);
    const gapMinutes = Math.max(0, Math.round(nextStart - prevEnd));
    gaps.push({
      beforeGame: next,
      previousGame: prev,
      gapMinutes,
      gapClass: classifyGap(gapMinutes),
    });
  }
  return gaps;
}

interface GapPlan {
  fuelLabel: string;
  fuelDetail: string;
  warmupLabel: string;
  warmupDetail: string;
  warmupLeadMin: number;
  warmupDurationMin: number;
}

function gapPlanFor(
  gapClass: GapClass,
  bodyweightKg: number,
  hotDay: boolean,
): GapPlan {
  const fluidNote = hotDay
    ? " Hot day — add 250–500ml extra fluid and top up sodium."
    : "";
  switch (gapClass) {
    case "turnaround":
      return {
        fuelLabel: "Fluids + optional half gel",
        fuelDetail: `Sip fluids, ~12g fast carbs if needed (half a gel). Stay warm — no full cooldown.${fluidNote}`,
        warmupLabel: "Stay warm",
        warmupDetail:
          "3–4 accelerations to stay primed — no re-warm-up needed for this gap.",
        warmupLeadMin: 5,
        warmupDurationMin: 3,
      };
    case "short":
      return {
        fuelLabel: "Fast carbs + fluids",
        fuelDetail: `${Math.round(0.4 * bodyweightKg)}g fast carbs (gel, sports drink, or a ripe banana) + 400–600ml fluid. Off your feet where you can.${fluidNote}`,
        warmupLabel: "Re-prime warm-up",
        warmupDetail: "8–10 min: short activation + 2–3 accelerations.",
        warmupLeadMin: 15,
        warmupDurationMin: 9,
      };
    case "medium":
      return {
        fuelLabel: "Light solid carbs + fluids",
        fuelDetail: `~${Math.round(1 * bodyweightKg)}g carbs (light solid food) + fluids, finished at least 60 min before the next kickoff.${fluidNote}`,
        warmupLabel: "Re-warm-up",
        warmupDetail: "10–12 min: activation + mobility + 2–3 accelerations.",
        warmupLeadMin: 20,
        warmupDurationMin: 11,
      };
    case "long":
    default:
      return {
        fuelLabel: "Real meal",
        fuelDetail: `${Math.round(1.25 * bodyweightKg)}g carbs + ${Math.round(0.3 * bodyweightKg)}g protein, low fat/fiber, finished ≥75 min before the next kickoff. Optional carb top-up ~45 min out if needed.${fluidNote}`,
        warmupLabel: "Near-full warm-up",
        warmupDetail:
          "12–15 min RAMP warm-up — the body has fully cooled after this long a gap.",
        warmupLeadMin: 25,
        warmupDurationMin: 14,
      };
  }
}

/**
 * Build the full tournament-day timeline: pre-game prep, a warm-up + fuel
 * block for every gap, a game block per kickoff, and a post-day recovery
 * block. Pure — deterministic given games + bodyweight + apparent temp.
 */
export function buildTournamentDayPlan(
  games: EventGame[],
  bodyweightKg: number,
  apparentTempC: number | null,
): TournamentDayPlan {
  const sorted = [...games]
    .filter((g) => g.status !== "cancelled")
    .sort(
      (a, b) =>
        toMinutes(a.gameDate, a.kickoffTime) -
        toMinutes(b.gameDate, b.kickoffTime),
    );
  const hotDay =
    typeof apparentTempC === "number" && apparentTempC >= HEAT_CAUTION_C;
  const gaps = computeGaps(sorted);
  const blocks: TournamentPlanBlock[] = [];

  if (sorted.length === 0) {
    return { games: sorted, gaps, blocks, heatAdjusted: hotDay };
  }

  const day = sorted[0].gameDate;
  const firstKickoff = toMinutes(day, sorted[0].kickoffTime);

  // Pre-day: wake, breakfast, arrival, full warm-up before game 1.
  const wakeMin = firstKickoff - PRE_GAME_BREAKFAST_LEAD_MIN - 30;
  blocks.push({
    kind: "wake",
    time: fromMinutes(wakeMin),
    label: "Wake / hydrate",
    detail: "500ml water + electrolytes on waking.",
  });
  blocks.push({
    kind: "meal",
    time: fromMinutes(firstKickoff - PRE_GAME_BREAKFAST_LEAD_MIN),
    label: "Breakfast",
    detail: `~${Math.round(2 * bodyweightKg)}g carbs, low fat/fiber — finish at least 2.5h before kickoff.`,
  });
  blocks.push({
    kind: "arrival",
    time: fromMinutes(firstKickoff - PRE_GAME_ARRIVAL_BUFFER_MIN),
    label: "Arrive, kit check",
    detail: "Get settled before the pre-game warm-up starts.",
  });
  blocks.push({
    kind: "warmup",
    time: fromMinutes(firstKickoff - FULL_WARMUP_LEAD_MIN),
    label: "Full warm-up",
    detail:
      "20–25 min RAMP (Raise, Activate, Mobilize, Potentiate) before game 1.",
    gameNumber: sorted[0].gameNumber,
    minutesDuration: 25,
  });

  sorted.forEach((game, i) => {
    const kickoff = toMinutes(game.gameDate, game.kickoffTime);
    const isLast = i === sorted.length - 1;
    blocks.push({
      kind: "game",
      time: fromMinutes(kickoff),
      label: `Game ${game.gameNumber}${game.opponent ? ` vs ${game.opponent}` : ""}`,
      detail: game.isProvisional
        ? "Provisional kickoff — bracket-dependent, confirm on the day."
        : game.field
          ? `Field: ${game.field}`
          : "",
      gameNumber: game.gameNumber,
      warning: isLast ? TOURNAMENT_DAY.lateGameWarning : undefined,
    });

    if (!isLast) {
      const gap = gaps[i];
      const gapEnd = kickoff + game.expectedDurationMinutes;
      const plan = gapPlanFor(gap.gapClass, bodyweightKg, hotDay);
      blocks.push({
        kind: "fuel",
        time: fromMinutes(gapEnd + 5),
        label: plan.fuelLabel,
        detail: plan.fuelDetail,
        gameNumber: game.gameNumber,
      });
      const nextKickoff = toMinutes(
        sorted[i + 1].gameDate,
        sorted[i + 1].kickoffTime,
      );
      blocks.push({
        kind: "warmup",
        time: fromMinutes(nextKickoff - plan.warmupLeadMin),
        label: plan.warmupLabel,
        detail: plan.warmupDetail,
        gameNumber: sorted[i + 1].gameNumber,
        minutesDuration: plan.warmupDurationMin,
        warning:
          i + 1 === sorted.length - 1
            ? TOURNAMENT_DAY.lateGameWarning
            : undefined,
      });
    }
  });

  const lastGame = sorted[sorted.length - 1];
  const lastEnd =
    toMinutes(lastGame.gameDate, lastGame.kickoffTime) +
    lastGame.expectedDurationMinutes;
  blocks.push({
    kind: "recovery",
    time: fromMinutes(lastEnd + 15),
    label: "Recovery block",
    detail: `${Math.round(1.2 * bodyweightKg)}g carbs + ${Math.round(0.3 * bodyweightKg)}g protein within 60 min, rehydrate, 10 min cooldown + mobility.`,
  });

  return { games: sorted, gaps, blocks, heatAdjusted: hotDay };
}

@Injectable({ providedIn: "root" })
export class TournamentPlanService {
  private readonly eventGames = inject(EventGamesService);
  private readonly periodization = inject(PeriodizationService);
  private readonly supabase = inject(SupabaseService);

  readonly games = this.eventGames.games;
  readonly loading = this.eventGames.loading;
  /** True when the current/next event has 2+ scheduled games — Tournament Mode should render. */
  readonly isTournamentDay = computed(() => this.eventGames.games().length > 1);

  readonly plan = computed<TournamentDayPlan | null>(() => {
    const games = this.eventGames.games();
    if (games.length === 0) return null;
    const apparentTemp = this.periodization.weather()?.apparentC ?? null;
    return buildTournamentDayPlan(games, this.readBodyweight(), apparentTemp);
  });

  // Mirrors PeriodizationService's private readBodyweight — bodyweight lives
  // on Supabase user_metadata, no dedicated profile signal exists yet.
  private readBodyweight(): number {
    const user = this.supabase.currentUser?.();
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const candidates = [
      meta["weight_kg"],
      meta["bodyweight_kg"],
      meta["weight"],
    ];
    for (const c of candidates) {
      const n = typeof c === "number" ? c : Number(c);
      if (Number.isFinite(n) && n > 30 && n < 200) return n;
    }
    return FALLBACK_BODYWEIGHT_KG;
  }

  /** Load the game list for a given competition_event id. */
  async loadFor(competitionEventId: string): Promise<void> {
    await this.eventGames.load(competitionEventId);
  }
}
