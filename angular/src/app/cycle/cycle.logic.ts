/**
 * Menstrual-cycle estimation — a PURE, client-only function (V3-DESIGN §4.2).
 *
 * SAFETY / PRIVACY CONTRACT (tested):
 *  1. The server NEVER computes or stores a phase — this runs on the client, on
 *     read, and is never persisted. Cycle data NEVER enters the training engine
 *     (no PeriodizationInputs field); it only powers this athlete-facing advisory.
 *  2. Hormonal contraception ⇒ phase = null. Estimating a natural phase for a
 *     suppressed cycle would be fabricated physiology (Law #7).
 *  3. Fewer than 2 logged cycles ⇒ confidence "low" and every estimated phase is
 *     tentative — no textbook-28 certainty the data doesn't support.
 *  4. The advisory is INFORM-only: it sets expectations and nudges recovery. It
 *     NEVER prescribes or restricts training ("don't sprint today" is forbidden).
 */

export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";
export type CycleConfidence = "low" | "medium" | "high";
/** "adjust" (auto-modify training by phase) is deliberately NOT in v3.0. */
export type AdaptationLevel = "off" | "inform";
export type FlowLevel = "spotting" | "light" | "medium" | "heavy";

export interface CycleProfile {
  enabled: boolean;
  hormonalContraception: boolean;
  adaptationLevel: AdaptationLevel;
  /** Athlete-reported fallback cycle length (days). Used only until ≥2 cycles logged. */
  typicalCycleLength: number | null;
  typicalPeriodLength: number | null;
}

export interface CycleLog {
  date: string; // ISO yyyy-mm-dd (local)
  flow: FlowLevel | null;
  symptoms: string[];
}

export interface CycleEstimate {
  phase: CyclePhase | null;
  confidence: CycleConfidence;
  cycleDay: number | null;
  cycleLength: number | null;
  nextPeriodDate: string | null;
  /** True when the phase is estimated, not a logged fact (render as a wash, not solid). */
  tentative: boolean;
  /** Inform-only expectation-setting. Never a training instruction. */
  message: string;
}

const DAY = 86_400_000;
const DEFAULT_CYCLE = 28;
const DEFAULT_PERIOD = 5;

function toDate(iso: string): number {
  return new Date(`${iso}T12:00:00`).getTime();
}
function isoOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
function isBleed(flow: FlowLevel | null): boolean {
  return flow != null && flow !== "spotting";
}

/**
 * Period start days = each bleed day with no bleed day in the preceding ≤2 days
 * (so consecutive bleeding collapses to one start, and a single missed log in the
 * middle of a period doesn't split it).
 */
function periodStarts(logs: CycleLog[]): number[] {
  const bleeds = logs
    .filter((l) => isBleed(l.flow))
    .map((l) => toDate(l.date))
    .sort((a, b) => a - b);
  return bleeds.filter((t) => !bleeds.some((b) => b < t && t - b <= 2 * DAY));
}

/** Observed cycle lengths from gaps between successive period starts (trailing 6). */
function observedLengths(starts: number[]): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const g = Math.round((starts[i] - starts[i - 1]) / DAY);
    if (g >= 21 && g <= 45) gaps.push(g); // physiological sanity window
  }
  return gaps.slice(-6);
}

const PHASE_MESSAGES: Record<CyclePhase, string> = {
  menstrual:
    "Period logged. Iron-rich food, sleep and a thorough warm-up help; train to how you feel and log an honest check-in.",
  follicular:
    "Follicular phase — many athletes feel fresh and adapt well to harder work here. Still warm up fully and listen to your body.",
  ovulatory:
    "Around ovulation — strength often feels good. Joints can be a touch more lax, so keep your warm-up and landing mechanics sharp.",
  luteal:
    "Late-luteal — some athletes feel heavier legs and run warmer. An extended warm-up, good fuelling and an honest check-in matter more this week.",
};

/**
 * Estimate the cycle phase for `dateIso` from the athlete's own logs + profile.
 * Pure. Returns a null phase (not a guess) whenever the data or physiology
 * doesn't support one.
 */
export function estimateCycle(
  logs: readonly CycleLog[],
  profile: CycleProfile,
  dateIso: string,
): CycleEstimate {
  const empty = (message: string): CycleEstimate => ({
    phase: null,
    confidence: "low",
    cycleDay: null,
    cycleLength: null,
    nextPeriodDate: null,
    tentative: true,
    message,
  });

  if (!profile.enabled) return empty("");
  if (profile.hormonalContraception) {
    return empty(
      "You're on hormonal contraception, so a natural cycle phase isn't estimated — log symptoms and keep checking in as usual.",
    );
  }

  const today = toDate(dateIso);
  const starts = periodStarts([...logs]).filter((s) => s <= today + DAY);
  if (!starts.length) {
    return empty(
      "Log a few periods and this will start estimating your phase — nothing is shared, it's just for you.",
    );
  }

  const observed = observedLengths(starts);
  const loggedCycles = observed.length; // gaps = cycles observed
  const cycleLength =
    loggedCycles >= 2
      ? Math.round(observed.reduce((a, b) => a + b, 0) / observed.length)
      : (profile.typicalCycleLength ?? DEFAULT_CYCLE);
  const periodLen = profile.typicalPeriodLength ?? DEFAULT_PERIOD;

  const lastStart = starts[starts.length - 1];
  const cycleDay = Math.floor((today - lastStart) / DAY) + 1;
  const nextPeriod = isoOf(lastStart + cycleLength * DAY);

  // Confidence: high with ≥3 observed cycles, medium with 1–2, low with 0.
  const baseConfidence: CycleConfidence =
    loggedCycles >= 3 ? "high" : loggedCycles >= 2 ? "medium" : "low";

  // Is today itself a logged bleed day? Then menstrual is a FACT, not an estimate.
  const todayLog = logs.find((l) => l.date === dateIso);
  const bleedingToday = todayLog ? isBleed(todayLog.flow) : false;

  // Ovulation anchored to a ~14-day luteal length (standard); window ±1 day.
  const ovDay = Math.max(10, cycleLength - 14);

  let phase: CyclePhase;
  let tentative = true;
  let confidence = baseConfidence;

  if (bleedingToday || cycleDay <= periodLen) {
    phase = "menstrual";
    tentative = !bleedingToday; // logged bleed = fact
    if (bleedingToday)
      confidence = confidence === "low" ? "medium" : confidence;
  } else if (Math.abs(cycleDay - ovDay) <= 1) {
    phase = "ovulatory";
    confidence = confidence === "high" ? "medium" : confidence; // never > medium (no measurement)
  } else if (cycleDay < ovDay) {
    phase = "follicular";
  } else {
    phase = "luteal";
  }

  // < 2 logged cycles ⇒ low confidence + tentative regardless (no textbook certainty).
  if (loggedCycles < 2) {
    confidence = "low";
    tentative = phase !== "menstrual" || !bleedingToday;
  }

  return {
    phase,
    confidence,
    cycleDay,
    cycleLength,
    nextPeriodDate: nextPeriod,
    tentative,
    message: PHASE_MESSAGES[phase],
  };
}

/** Anti-harm guard for the test suite: the advisory must NEVER prescribe training. */
export const FORBIDDEN_CYCLE_ADVICE =
  /\b(don'?t|do not|shouldn'?t|should not|can'?t|must not|avoid) (sprint|train|lift|run|play)\b|\bskip (your|the|today'?s) (session|training|sprint)\b|\bno (sprinting|training|lifting) today\b/i;
