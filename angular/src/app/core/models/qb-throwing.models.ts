/**
 * QB Throw-Count / Arm-Care Models (V2.2)
 *
 * The backend (`netlify/functions/qb-throwing.js`, `qb_throwing_sessions`) has
 * existed since before V2 with zero frontend callers — the SOURCE_OF_TRUTH
 * ledger flagged it ORPHANED. V2.2 wires a minimal logger card so a QB can
 * actually log throw counts, which is the data the engine's
 * `QB_THROW_ADAPTATION` dosing policy (position-volume.config.ts) has always
 * needed and never had.
 */

export type QbSessionType = "practice" | "game" | "individual" | "bullpen";

export interface QbThrowingSessionInput {
  sessionType: QbSessionType;
  totalThrows: number;
  shortThrows?: number;
  mediumThrows?: number;
  longThrows?: number;
  armFeelingBefore?: number;
  armFeelingAfter?: number;
  preThrowingWarmupDone?: boolean;
  postThrowingArmCareDone?: boolean;
  iceApplied?: boolean;
  notes?: string;
}

export interface QbThrowingSession {
  id: string;
  sessionDate: string;
  totalThrows: number;
  shortThrows: number | null;
  mediumThrows: number | null;
  longThrows: number | null;
  sessionType: string;
  location: string | null;
  armFeelingBefore: number | null;
  armFeelingAfter: number | null;
  preThrowingWarmupDone: boolean;
  postThrowingArmCareDone: boolean;
  iceApplied: boolean;
  notes: string | null;
}

export interface QbThrowingProgression {
  currentWeekAvg: number;
  targetThrows: number;
  progressionPhase: string;
  daysSinceLastSession: number;
  weeklyCompliancePct: number;
  recommendation: string;
}

export interface QbThrowingData {
  progression: QbThrowingProgression;
  weeklyStats: unknown[];
  recentSessions: QbThrowingSession[];
}
