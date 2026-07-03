/**
 * Tournament Mode Models (V2.0)
 *
 * A multi-game tournament day was V1's biggest blind spot: the engine knew a
 * day only as a COUNT (`expectedGameCount`), not WHEN the games were — so it
 * could not tell the ~50-minute turnaround after game 1 apart from the
 * ~2h20 gap after game 2, even though those two gaps need completely
 * different warm-up and fueling answers. `EventGame` (backed by
 * `event_games`, see `EventGamesService`) carries real kickoff times;
 * `TournamentPlanService` turns them into a gap-classified, minute-by-minute
 * day plan. See docs/v2/V2.0-tournament-mode.md.
 */

export type EventGameStatus = "scheduled" | "in_progress" | "final" | "cancelled";

export type BracketStage =
  | "group"
  | "pool"
  | "quarterfinal"
  | "semifinal"
  | "final"
  | "placement"
  | "friendly";

/** One scheduled game within a competition_event (tournament day). */
export interface EventGame {
  id: string;
  competitionEventId: string;
  teamId: string;
  gameNumber: number;
  /** "YYYY-MM-DD" */
  gameDate: string;
  /** "HH:MM:SS", venue-local wall-clock — no timezone needed for gap math. */
  kickoffTime: string;
  expectedDurationMinutes: number;
  opponent: string | null;
  field: string | null;
  bracketStage: BracketStage | null;
  /** Bracket-dependent games ("if we win, ~15:30") — timeline still generates. */
  isProvisional: boolean;
  status: EventGameStatus;
  result: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export type EventGameInput = Partial<
  Pick<
    EventGame,
    | "gameNumber"
    | "gameDate"
    | "kickoffTime"
    | "expectedDurationMinutes"
    | "opponent"
    | "field"
    | "bracketStage"
    | "isProvisional"
    | "status"
    | "result"
  >
>;

/**
 * The gap between the end of one game and the kickoff of the next, classified
 * so the fueling/warm-up rules can branch on it. Thresholds are the effective
 * gap = next kickoff − (previous kickoff + expected duration):
 *   turnaround < 30 min · short 30–75 min · medium 75–150 min · long > 150 min
 */
export type GapClass = "turnaround" | "short" | "medium" | "long";

export interface GameGap {
  /** The game this gap leads INTO. */
  beforeGame: EventGame;
  previousGame: EventGame;
  gapMinutes: number;
  gapClass: GapClass;
}

export type PlanBlockKind =
  | "wake"
  | "meal"
  | "arrival"
  | "warmup"
  | "caffeine"
  | "game"
  | "fuel"
  | "rest"
  | "recovery";

/** One row in the generated tournament-day timeline. */
export interface TournamentPlanBlock {
  kind: PlanBlockKind;
  /** "HH:MM", venue-local — when this block starts. */
  time: string;
  label: string;
  detail: string;
  /** The game this block is anchored to, if any. */
  gameNumber?: number;
  minutesDuration?: number;
  /** Surfaces the late-game hamstring/hydration cue on the relevant block. */
  warning?: string;
}

export interface TournamentDayPlan {
  games: EventGame[];
  gaps: GameGap[];
  blocks: TournamentPlanBlock[];
  /** True when a hot-day fluid/electrolyte modifier was applied. */
  heatAdjusted: boolean;
}
