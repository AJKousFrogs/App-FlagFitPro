/**
 * Competition Schedule Models
 *
 * Canonical types for the schedule spine. Backed by the `competitions` and
 * `competition_events` tables and the `v_athlete_schedule` view.
 *
 * The schedule is the *spine* of the v11 product: periodization, readiness,
 * nutrition timing, hydration targets, and recovery prescriptions all read
 * from these types. Add new fields here, never re-derive ad-hoc in components.
 */

export type CompetitionKind = "league" | "cup" | "tournament" | "friendly";

export type CompetitionLevel =
  | "club"
  | "regional"
  | "national"
  | "international"
  | "continental"
  | "world"
  | "olympic";

export type EventImportance = "regular" | "high" | "peak";

export type EventStatus =
  | "scheduled"
  | "live"
  | "completed"
  | "cancelled"
  | "postponed";

/**
 * Periodization phase for a given date, derived from the schedule.
 *
 * - `competition`: the day of an event itself (a game day)
 * - `travel`: inside a club/national event window, but not a game day itself
 *   (logistics/rest day around a weekday tournament leg)
 * - `taper`: 1–7 days before a peak/high event (volume down, intensity primed)
 * - `recovery`: 1–4 days after a high-load event (active recovery, deload)
 * - `accumulation`: ordinary training window — load can build
 * - `transition`: long off-stretch with no upcoming events (reset window)
 */
export type CompetitionPhase =
  | "competition"
  | "travel"
  | "taper"
  | "recovery"
  | "accumulation"
  | "transition";

/**
 * Competition (shared registry row).
 */
export interface Competition {
  id: string;
  name: string;
  shortName: string | null;
  kind: CompetitionKind;
  level: CompetitionLevel;
  country: string | null;
  governingBody: string | null;
  format: string | null;
  seasonYear: number | null;
  startsOn: string | null; // ISO date
  endsOn: string | null;
  externalId: string | null;
  source: "manual" | "federation_import" | "sync";
}

/**
 * One event row from `v_athlete_schedule` — flattened with competition + team.
 */
export interface CompetitionEvent {
  id: string;
  competitionId: string;
  teamId: string;
  startsAt: string; // ISO timestamp (UTC)
  endsAt: string | null;
  expectedGameCount: number;
  importance: EventImportance;
  label: string | null;
  location: string | null;
  venue: string | null;
  hotelName: string | null;
  hotelAddress: string | null;
  notes: string | null;
  status: EventStatus;

  // Joined from competitions
  competitionName: string;
  competitionShortName: string | null;
  competitionKind: CompetitionKind;
  competitionLevel: CompetitionLevel;
  competitionCountry: string | null;
  competitionSeasonYear: number | null;

  // Joined from teams
  teamName: string;

  /**
   * Where the event came from: `team` = the shared competition spine
   * (`competition_events`), `athlete` = entered by the athlete themselves
   * (`athlete_events`). Athlete-entered events are editable from the Schedule
   * screen; team events are read-only there.
   */
  source: "team" | "athlete";
}

/**
 * Density of upcoming load: total games and number of distinct event-days
 * inside a sliding window. Drives load-management decisions.
 */
export interface EventDensity {
  windowDays: number;
  totalGames: number;
  eventDayCount: number;
  peakDayGameCount: number; // worst-case day inside the window
  hasPeakImportance: boolean;
}

/**
 * The athlete's schedule snapshot — what every consumer should ask for.
 * Computed server-side from `v_athlete_schedule`; consumers do not re-derive.
 */
export interface ScheduleSnapshot {
  athleteId: string;
  generatedAt: string;
  /** Inclusive list of upcoming events, soonest first. */
  upcoming: CompetitionEvent[];
  /** Most-recent past event, useful for "we just played" recovery state. */
  lastEvent: CompetitionEvent | null;
  /** Next event the athlete should plan against. Null if nothing scheduled. */
  nextEvent: CompetitionEvent | null;
  density7d: EventDensity;
  density14d: EventDensity;
  density28d: EventDensity;
  /** Phase for *today*. Other days resolved via {@link phaseFor}. */
  currentPhase: CompetitionPhase;
  /**
   * ISO dates (YYYY-MM-DD) of athlete-entered one-off flag-football team
   * practices (athlete_events kind=`training`). These are load days, not
   * taper/recovery triggers — the periodization engine treats them as practice.
   */
  trainingDays?: string[];
}

/**
 * Phase resolution input — what {@link phaseFor} needs to make a decision
 * without hitting the DB twice.
 */
export interface PhaseContext {
  date: Date;
  upcoming: CompetitionEvent[];
  lastEvent: CompetitionEvent | null;
}
