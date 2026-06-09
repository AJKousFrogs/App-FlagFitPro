import {
  Injectable,
  Signal,
  computed,
  inject,
  signal,
} from "@angular/core";

import {
  CompetitionEvent,
} from "../models/schedule.models";
import {
  DailyPrescription,
  NutritionTargets,
  PeriodizationInputs,
  PrescriptionIntent,
  RecentSession,
  SeasonPhase,
  SeasonWindow,
  WeatherAdjustment,
  WeatherInput,
} from "../models/prescription.models";
import { AcwrService } from "./acwr.service";
import { ReadinessService } from "./readiness.service";
import { ScheduleService } from "./schedule.service";
import { SupabaseService } from "./supabase.service";
import { ApiService } from "./api.service";
import { InjuryService } from "./injury.service";

/**
 * PeriodizationService — turns the schedule into prescriptions.
 *
 * The lazy-athlete contract: open the app, see exactly what to do today and
 * why. The algorithm is responsible for making the right call given:
 *   schedule × ACWR × readiness × bodyweight × density.
 *
 * The class is a thin Angular wrapper around pure functions. Logic lives in
 * `prescribeFor` so it can be tested without DI and mirrored server-side
 * later.
 */
@Injectable({ providedIn: "root" })
export class PeriodizationService {
  private readonly schedule = inject(ScheduleService);
  private readonly acwrService = inject(AcwrService);
  private readonly readinessService = inject(ReadinessService);
  private readonly supabase = inject(SupabaseService);
  private readonly api = inject(ApiService);
  private readonly injury = inject(InjuryService);

  /**
   * The athlete's declared season calendar (athlete_training_config.season_calendar),
   * fed to macroPhaseFor to set the macro season phase. Empty until loaded → the
   * engine falls back to the generic build week. NOTHING hardcoded.
   */
  readonly seasonCalendar = signal<SeasonWindow[]>([]);

  /**
   * Recurring flag-football team-practice weekdays (0=Sun…6=Sat) the athlete
   * declared in Settings. On these days practice is the session (see prescribeFor).
   * Empty until loaded.
   */
  readonly teamTrainingDays = signal<number[]>([]);

  /**
   * Live weather at the athlete's location, fed to the weather guard (rain →
   * relocate sprints, heat → scale, storm → stop). Null until loaded → no guard.
   */
  readonly weather = signal<WeatherInput | null>(null);

  /**
   * Recently-completed sessions (last 4 days), fed to the CNS recovery-spacing
   * guard so a sprint can't be prescribed within 48h of the last sprint.
   */
  readonly recentSessions = signal<RecentSession[]>([]);

  constructor() {
    this.loadSettings();
    void this.injury.load();
    void this.loadRecentSessions();

    // Live weather → the prescription weather guard (metric: °C / mm / km/h).
    this.api
      .get<{
        temp?: number; apparentC?: number; weatherCode?: number;
        precipMm?: number; windKmh?: number; windSpeed?: number;
        condition?: string; suitability?: string;
      }>("/api/weather")
      .subscribe({
        next: (res) => {
          const d = res?.data;
          if (!d) return;
          this.weather.set({
            tempC: d.temp ?? null,
            apparentC: d.apparentC ?? d.temp ?? null,
            condition: d.condition ?? null,
            weatherCode: d.weatherCode ?? null,
            precipMm: d.precipMm ?? null,
            windKmh: d.windKmh ?? d.windSpeed ?? null,
            suitability:
              (d.suitability as "excellent" | "good" | "fair" | "poor" | undefined) ?? null,
          });
        },
        error: () => {
          /* no weather → guard stays off (fail-safe) */
        },
      });
  }

  /**
   * Load season calendar + recurring team-practice days from player-settings.
   * Called once on construct; re-callable via {@link refreshSettings} so a save
   * in Settings reflects in the plan without a full reload.
   */
  private loadSettings(): void {
    this.api
      .get<{
        season_calendar?: SeasonWindow[];
        seasonCalendar?: SeasonWindow[];
        teamTrainingDays?: { days?: number[]; time?: string } | number[];
      }>("/api/player-settings")
      .subscribe({
        next: (res) => {
          const d = (res?.data ?? {}) as {
            season_calendar?: SeasonWindow[];
            seasonCalendar?: SeasonWindow[];
            teamTrainingDays?: { days?: number[]; time?: string } | number[];
          };
          const cal = d.season_calendar ?? d.seasonCalendar;
          if (Array.isArray(cal)) this.seasonCalendar.set(cal);
          const ttd = d.teamTrainingDays;
          const days = Array.isArray(ttd) ? ttd : (ttd?.days ?? []);
          this.teamTrainingDays.set(
            days.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
          );
        },
        error: () => {
          /* no config yet → generic build week */
        },
      });
  }

  /** Re-read player settings (call after the athlete edits them). */
  refreshSettings(): void {
    this.loadSettings();
  }

  /**
   * Load the athlete's recently-completed sessions (last 4 days) for high-CNS
   * recovery spacing. Fire-and-forget; empty on failure → no spacing (spacing is
   * a refinement, not a safety stop, so fail-open is acceptable).
   */
  private async loadRecentSessions(): Promise<void> {
    const userId = this.supabase.userId();
    if (!userId) return;
    const since = new Date(Date.now() - 4 * 86_400_000).toISOString();
    try {
      const { data, error } = await this.supabase.client
        .from("training_sessions")
        .select("session_type, drill_type, completed_at")
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .gte("completed_at", since)
        .order("completed_at", { ascending: false });
      if (error || !data) return;
      this.recentSessions.set(
        data.map((r) => ({
          at: r.completed_at as string,
          type: (r.session_type as string) || (r.drill_type as string) || "",
        })),
      );
    } catch {
      /* no sessions → no spacing */
    }
  }

  /**
   * Today's prescription. Reactive — updates whenever the schedule, ACWR,
   * or readiness change.
   */
  readonly today: Signal<DailyPrescription | null> = computed(() => {
    const snap = this.schedule.snapshot();
    if (!snap) {
      return null;
    }
    const now = new Date();
    return prescribeFor({
      date: now,
      phase: snap.currentPhase,
      upcoming: snap.upcoming,
      lastEvent: snap.lastEvent,
      acwr: this.readAcwr(),
      readiness: this.readReadiness(),
      bodyweightKg: this.readBodyweight(),
      density14d: snap.density14d
        ? {
            totalGames: snap.density14d.totalGames,
            hasPeakImportance: snap.density14d.hasPeakImportance,
          }
        : null,
      seasonPhase: macroPhaseFor(now, this.seasonCalendar()),
      weather: this.weather(),
      recentSessions: this.recentSessions(),
      isTeamPractice: this.isTeamPractice(now, snap.trainingDays),
      activeRestrictions: this.injury.restrictions(),
    });
  });

  /**
   * 7-day forward prescription view. Useful for a week-at-a-glance UI;
   * each day resolved independently against the cached schedule snapshot.
   */
  weekAhead(): DailyPrescription[] {
    const snap = this.schedule.snapshot();
    if (!snap) {
      return [];
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const acwr = this.readAcwr();
    const readiness = this.readReadiness();
    const bodyweight = this.readBodyweight();

    const out: DailyPrescription[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const phase = this.schedule.phaseFor(date);
      out.push(
        prescribeFor({
          date,
          phase,
          upcoming: snap.upcoming,
          lastEvent: snap.lastEvent,
          acwr,
          readiness,
          bodyweightKg: bodyweight,
          density14d: snap.density14d
            ? {
                totalGames: snap.density14d.totalGames,
                hasPeakImportance: snap.density14d.hasPeakImportance,
              }
            : null,
          seasonPhase: macroPhaseFor(date, this.seasonCalendar()),
          // Weather is current-conditions only (no 7-day forecast feed), so it
          // can only guard today; future days resolve unguarded rather than
          // against stale "now" weather.
          weather: i === 0 ? this.weather() : null,
          recentSessions: this.recentSessions(),
          isTeamPractice: this.isTeamPractice(date, snap.trainingDays),
          activeRestrictions: this.injury.restrictions(),
        }),
      );
    }
    return out;
  }

  /**
   * Is `date` a flag-football team-practice day? True if its weekday is in the
   * recurring set OR a one-off training event falls on it (snapshot.trainingDays).
   */
  private isTeamPractice(date: Date, trainingDays?: string[]): boolean {
    if (this.teamTrainingDays().includes(date.getDay())) {
      return true;
    }
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return (trainingDays ?? []).includes(iso);
  }

  // ---------------------------------------------------------------------------
  // Service-internal accessors. Defensive against null/undefined.
  // ---------------------------------------------------------------------------
  private readAcwr(): number | null {
    // Prefer the server's ACWR (already embedded in the readiness response);
    // fall back to the local EWMA when no server check-in exists yet.
    const serverAcwr = this.readinessService.current?.()?.acwr;
    if (typeof serverAcwr === "number" && Number.isFinite(serverAcwr) && serverAcwr > 0) {
      return serverAcwr;
    }
    const localAcwr = this.acwrService.acwrRatio?.();
    return typeof localAcwr === "number" && Number.isFinite(localAcwr) && localAcwr > 0
      ? localAcwr
      : null;
  }

  private readReadiness(): number | null {
    const value = this.readinessService.current?.()?.score;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  private readBodyweight(): number | null {
    // Bodyweight lives on the user profile. We try a couple of common shapes
    // gracefully — the periodization function falls back to 80kg if null.
    const user = this.supabase.currentUser?.();
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const candidates = [
      meta["weight_kg"],
      meta["bodyweight_kg"],
      meta["weight"],
    ];
    for (const c of candidates) {
      const n = typeof c === "number" ? c : Number(c);
      if (Number.isFinite(n) && n > 30 && n < 200) {
        return n;
      }
    }
    return null;
  }
}

// =============================================================================
// PURE PERIODIZATION ALGORITHM
//
// Same inputs → same output. Tested without DI. Server-mirror friendly.
// =============================================================================

const FALLBACK_BODYWEIGHT_KG = 80;
const FALLBACK_READINESS = 70;
const ACWR_DANGER = 1.5;
const ACWR_ELEVATED = 1.3;
const ACWR_UNDER = 0.8;
const READINESS_LOW = 55;
const DENSITY_HEAVY_GAMES_14D = 10;

const INTENT_LABELS: Record<PrescriptionIntent, string> = {
  rest: "Rest day",
  recovery: "Active recovery",
  mobility: "Mobility & technique",
  technical: "Skills focus",
  sprint: "Sprint focus",
  strength: "Strength session",
  mixed: "Mixed session",
  "taper-prime": "Pre-game prime",
  competition: "Game day",
};

/** High-CNS intents that need recovery spacing between sessions. */
const HIGH_CNS_INTENTS: ReadonlySet<PrescriptionIntent> = new Set<PrescriptionIntent>([
  "sprint",
  "mixed",
]);

/**
 * Minimum hours between high-CNS (sprint / plyometric / max-velocity) sessions.
 * Team-configurable like the ACWR/weather thresholds; conservative default treats
 * sprint work as max-velocity (48h). Sub-max speed could justify 24h — kept at
 * the safe 48h default rather than guessing intensity from `session_type`.
 */
const CNS_RECOVERY_HOURS = 48;

/** Detect a high-CNS session from its raw `session_type`/`drill_type`. */
function isHighCnsSessionType(type: string): boolean {
  return /sprint|plyo|speed|max.?velocity|accel|agility|bound/i.test(type || "");
}

/**
 * CNS recovery spacing: if the engine chose a high-CNS day but the athlete did
 * sprint/plyo work within `CNS_RECOVERY_HOURS`, downgrade to mobility + technique
 * so back-to-back high-CNS days can't happen. Records `cnsRecoveryAdjustment`
 * for traceability. Lowest-precedence guard — weather/physio override it.
 */
function applySprintRecoveryGuard(
  p: DailyPrescription,
  recentSessions: PeriodizationInputs["recentSessions"],
  date: Date,
): DailyPrescription {
  if (!HIGH_CNS_INTENTS.has(p.intent)) return p;
  if (!recentSessions || recentSessions.length === 0) return p;

  const now = date.getTime();
  const windowMs = CNS_RECOVERY_HOURS * 3_600_000;
  let mostRecent: number | null = null;
  for (const s of recentSessions) {
    if (!isHighCnsSessionType(s.type)) continue;
    const t = new Date(s.at).getTime();
    if (!Number.isFinite(t) || t >= now) continue; // future / invalid ignored
    if (now - t > windowMs) continue; // outside the recovery window
    if (mostRecent === null || t > mostRecent) mostRecent = t;
  }
  if (mostRecent === null) return p; // no recent high-CNS session

  const hoursSince = Math.round((now - mostRecent) / 3_600_000);
  return {
    ...p,
    intent: "technical",
    intentLabel: "Mobility & technique",
    sprintReps: 0,
    targetRpe: p.targetRpe != null ? Math.min(p.targetRpe, 5) : p.targetRpe,
    reasoning: `Sprinted ${hoursSince}h ago — ${CNS_RECOVERY_HOURS}h CNS recovery; today is mobility + technique.`,
    cnsRecoveryAdjustment: {
      hoursSinceLastHighCns: hoursSince,
      windowHours: CNS_RECOVERY_HOURS,
      originalIntent: p.intent,
    },
  };
}

/**
 * Public entry point. Picks the base prescription (game day → taper → safety →
 * phase/season defaults), then layers guards. Precedence (highest wins):
 * physio ▷ **weather** ▷ CNS-spacing ▷ engine. CNS-spacing constrains the
 * engine's chosen high-CNS intent but yields to weather and physio above it.
 */
export function prescribeFor(inputs: PeriodizationInputs): DailyPrescription {
  const base = decideBasePrescription(inputs);
  // CNS recovery spacing (lowest-precedence guard): no back-to-back sprint days.
  const spaced = applySprintRecoveryGuard(base, inputs.recentSessions ?? null, inputs.date);
  const guarded = applyWeatherGuard(spaced, inputs.weather ?? null, inputs.coachOverride ?? false);
  // Injury/physio precedence over training (spec law): runs last so the affected
  // region's sprint/high-intensity work is removed regardless of the base plan.
  return applyInjuryGuard(guarded, inputs.activeRestrictions ?? null);
}

/**
 * Down-regulate the plan for an active injury / self-reported tightness affecting
 * a region used by sprint/high-intensity work. Severity-scaled; never overrides a
 * game day. Records `injuryAdjustment` so the change is traceable.
 */
function applyInjuryGuard(
  p: DailyPrescription,
  restr: PeriodizationInputs["activeRestrictions"],
): DailyPrescription {
  if (!restr || !restr.restrictsSprint) return p;
  if (p.intent === "competition") return p; // a game is a game

  const severe = restr.severity === "severe";
  const moderate = restr.severity === "moderate";
  const hasSprintWork = p.sprintReps > 0 || p.intent === "sprint";
  // Minor tightness on a day with no sprint/high-intensity work: nothing to pull.
  if (!hasSprintWork && !severe && !moderate) return p;

  const regionLabel = restr.regions.length ? restr.regions.join(", ") : "soft tissue";
  let intent = p.intent;
  let intentLabel = p.intentLabel;
  let targetRpe = p.targetRpe;
  let targetMinutes = p.targetMinutes;
  let strengthSets = p.strengthSets;
  let reasoning = p.reasoning;

  if (severe) {
    intent = "recovery";
    intentLabel = "Active recovery";
    targetRpe = 3;
    targetMinutes = 30;
    strengthSets = 0;
    reasoning = `Reported ${regionLabel} issue — recovery only today. Injury precedence over training.`;
  } else if (moderate) {
    intent = "recovery";
    intentLabel = "Active recovery";
    targetRpe = 3;
    targetMinutes = Math.min(p.targetMinutes, 40);
    strengthSets = Math.min(p.strengthSets, 3);
    reasoning = `Reported ${regionLabel} tightness — sprints pulled, easy session only. Injury precedence over training.`;
  } else {
    // minor: keep the day's shape but remove the sprint/high-intensity work
    intent = p.intent === "sprint" ? "mobility" : p.intent;
    intentLabel = p.intent === "sprint" ? "Mobility & technique" : `${p.intentLabel} (modified)`;
    targetRpe = p.targetRpe != null ? Math.min(p.targetRpe, 6) : p.targetRpe;
    reasoning = `${regionLabel} tightness — sprint/high-intensity work pulled for that region; keep it controlled.`;
  }

  return {
    ...p,
    intent,
    intentLabel,
    targetRpe,
    targetMinutes,
    sprintReps: 0,
    strengthSets,
    reasoning,
    injuryAdjustment: {
      regions: restr.regions,
      severity: restr.severity ?? "minor",
      summary: `${p.intentLabel} → ${intentLabel}; sprints ${p.sprintReps}→0`,
    },
  };
}

/**
 * The core decision. Read top-to-bottom: highest-priority overrides first
 * (game day, taper, recovery, ACWR safety), then phase/season defaults.
 */
function decideBasePrescription(inputs: PeriodizationInputs): DailyPrescription {
  const {
    date,
    phase,
    upcoming,
    lastEvent,
    acwr,
    readiness,
    bodyweightKg,
    density14d,
    seasonPhase = null,
  } = inputs;

  const driverEvent = pickDriverEvent(date, upcoming, lastEvent);
  const hoursUntilNext = nextEventHours(date, upcoming);
  const bodyweight = bodyweightKg ?? FALLBACK_BODYWEIGHT_KG;
  const effectiveReadiness = readiness ?? FALLBACK_READINESS;
  const heavyDensity =
    !!density14d && density14d.totalGames >= DENSITY_HEAVY_GAMES_14D;

  // 1. Currently inside a competition window → game day.
  if (phase === "competition") {
    return finalize({
      date,
      phase,
      intent: "competition",
      targetRpe: null,
      targetMinutes: 60,
      sprintReps: 0,
      strengthSets: 0,
      reasoning:
        "Game day. Activate, play, refuel between games, sleep tonight.",
      recoveryEmphasis: "critical",
      nutrition: nutritionFor("competition", bodyweight, heavyDensity),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 2. Within 24h of a game → taper-prime (very short, sharp, no fatigue).
  if (hoursUntilNext !== null && hoursUntilNext <= 24) {
    return finalize({
      date,
      phase,
      intent: "taper-prime",
      targetRpe: 4,
      targetMinutes: 25,
      sprintReps: 4,
      strengthSets: 0,
      reasoning:
        "Game inside 24 hours. Stay loose and primed — no new fatigue.",
      recoveryEmphasis: "high",
      nutrition: nutritionFor("taper-prime", bodyweight, heavyDensity),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 3. ACWR danger zone overrides phase — safety first.
  if (acwr !== null && acwr > ACWR_DANGER) {
    return finalize({
      date,
      phase,
      intent: "rest",
      targetRpe: null,
      targetMinutes: 0,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: `ACWR ${acwr.toFixed(2)} is in the danger zone. Full rest today.`,
      recoveryEmphasis: "critical",
      nutrition: nutritionFor("rest", bodyweight, heavyDensity),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 4. Readiness collapse → switch to recovery regardless of phase.
  if (effectiveReadiness < READINESS_LOW) {
    return finalize({
      date,
      phase,
      intent: "recovery",
      targetRpe: 3,
      targetMinutes: 30,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: `Readiness ${Math.round(effectiveReadiness)}/100 is low. Active recovery only.`,
      recoveryEmphasis: "high",
      nutrition: nutritionFor("recovery", bodyweight, heavyDensity),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 4.6 Team practice day → practice IS the session; prescribe only light
  // complementary work. Applies only when no event micro-phase owns the day
  // (accumulation / transition). Competition / taper / recovery and the safety
  // guards above take precedence (so e.g. the Monday after a tournament stays
  // recovery, not practice).
  if (inputs.isTeamPractice && (phase === "accumulation" || phase === "transition")) {
    return finalize({
      date,
      phase,
      intent: "mixed",
      intentLabel: "Flag football practice",
      targetRpe: 7,
      targetMinutes: 90,
      sprintReps: 0,
      strengthSets: 0,
      reasoning:
        "Team practice today — that's your main session. Keep any extra individual work light (mobility / activation).",
      recoveryEmphasis: "low",
      nutrition: nutritionFor("mixed", bodyweight, heavyDensity),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
      seasonPhase: seasonPhase ?? null,
    });
  }

  // 5. Phase-driven defaults.
  switch (phase) {
    case "recovery":
      return finalize({
        date,
        phase,
        intent: "recovery",
        targetRpe: 3,
        targetMinutes: 30,
        sprintReps: 0,
        strengthSets: 0,
        reasoning: postEventReasoning(lastEvent),
        recoveryEmphasis: "high",
        nutrition: nutritionFor("recovery", bodyweight, heavyDensity),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
      });

    case "taper": {
      // Inside taper window: keep CNS sharp, drop volume.
      const dayOfTaper = hoursUntilNext !== null
        ? Math.max(1, Math.ceil(hoursUntilNext / 24))
        : 7;
      // Closer to the event = lighter.
      const isFinalThird = dayOfTaper <= 2;
      return finalize({
        date,
        phase,
        intent: isFinalThird ? "mobility" : "sprint",
        targetRpe: isFinalThird ? 4 : 6,
        targetMinutes: isFinalThird ? 30 : 45,
        sprintReps: isFinalThird ? 4 : 6,
        strengthSets: 0,
        reasoning: taperReasoning(driverEvent, dayOfTaper),
        recoveryEmphasis: "medium",
        nutrition: nutritionFor("taper", bodyweight, heavyDensity),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
      });
    }

    case "transition":
      return finalize({
        date,
        phase,
        intent: heavyDensity ? "mobility" : "mixed",
        targetRpe: 5,
        targetMinutes: 45,
        sprintReps: 0,
        strengthSets: 3,
        reasoning:
          "Off-season window. Maintain GPP base — easy aerobic + lift.",
        recoveryEmphasis: "low",
        nutrition: nutritionFor("transition", bodyweight, false),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
      });

    case "accumulation":
    default: {
      // No event micro-phase is driving the week. If the athlete's macro season
      // phase is known, let it shape the week (off-season = strength/conditioning,
      // in-season = maintain + skill, transition = base); otherwise fall back to
      // the generic build shape. Pre-season == the generic progressive build.
      if (seasonPhase && seasonPhase !== "preseason") {
        const intent = seasonShapedIntent(date, seasonPhase, acwr, heavyDensity);
        const t = baseTargets(intent);
        return finalize({
          date,
          phase,
          intent,
          targetRpe: t.targetRpe,
          targetMinutes: t.targetMinutes,
          sprintReps: t.sprintReps,
          strengthSets: t.strengthSets,
          reasoning: seasonReasoning(seasonPhase, intent),
          recoveryEmphasis: heavyDensity ? "medium" : "low",
          nutrition: nutritionFor(intent, bodyweight, heavyDensity),
          driverEvent,
          hoursUntilNextEvent: hoursUntilNext,
          acwrAtIssue: acwr,
          seasonPhase,
        });
      }

      // Choose intent by day of week to give the week a shape.
      const intent = pickAccumulationIntent(date, acwr, heavyDensity);
      return finalize({
        date,
        phase,
        intent,
        targetRpe: intent === "strength" ? 7 : intent === "sprint" ? 8 : 6,
        targetMinutes: intent === "rest" ? 0 : intent === "sprint" ? 60 : 75,
        sprintReps: intent === "sprint" ? 10 : intent === "mixed" ? 6 : 0,
        strengthSets: intent === "strength" ? 18 : intent === "mixed" ? 8 : 0,
        reasoning: accumulationReasoning(intent, acwr, heavyDensity),
        recoveryEmphasis: heavyDensity ? "medium" : "low",
        nutrition: nutritionFor(intent, bodyweight, heavyDensity),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
        seasonPhase: seasonPhase ?? null,
      });
    }
  }
}

// =============================================================================
// MACRO SEASON PHASE — annual periodization (athlete-declared, no hardcoded months)
// =============================================================================

/**
 * Resolve the athlete's macro season phase for a date from their declared
 * `season_calendar` windows. Supports specific spans ("YYYY-MM-DD") and recurring
 * annual ones ("MM-DD", may wrap the year end). First matching window wins.
 * Returns null when no window covers the date (caller falls back to a generic
 * build). NOTHING is hardcoded — the windows are 100% the player's data.
 */
export function macroPhaseFor(
  date: Date,
  windows: SeasonWindow[] | null | undefined,
): SeasonPhase | null {
  if (!windows || windows.length === 0) {
    return null;
  }
  const iso = toIsoDate(date); // YYYY-MM-DD
  const md = iso.slice(5); // MM-DD
  for (const w of windows) {
    if (w && w.from && w.to && inSeasonWindow(iso, md, w.from, w.to)) {
      return w.phase;
    }
  }
  return null;
}

function inSeasonWindow(
  iso: string,
  md: string,
  from: string,
  to: string,
): boolean {
  const recurring = from.length === 5 && to.length === 5; // "MM-DD"
  if (recurring) {
    return from <= to ? md >= from && md <= to : md >= from || md <= to;
  }
  const f = from.slice(0, 10);
  const t = to.slice(0, 10);
  return f <= t ? iso >= f && iso <= t : iso >= f || iso <= t;
}

/**
 * Day-of-week week shape biased by macro season phase. Off-season is
 * strength/conditioning-led; in-season maintains strength + sharpens skills;
 * transition is active-rest/base. Pre-season uses the generic build shape.
 * Safety modulation (elevated ACWR / heavy density) mirrors accumulation.
 */
function seasonShapedIntent(
  date: Date,
  season: SeasonPhase,
  acwr: number | null,
  heavyDensity: boolean,
): PrescriptionIntent {
  const dow = date.getDay(); // 0 = Sun
  let week: PrescriptionIntent[];
  switch (season) {
    case "offseason": // GPP — get strong, build base
      week = ["rest", "strength", "mixed", "mobility", "strength", "mixed", "strength"];
      break;
    case "inseason": // maintain + skill
      week = ["rest", "strength", "technical", "mobility", "technical", "strength", "mixed"];
      break;
    case "transition": // active rest / aerobic base
      week = ["rest", "recovery", "mobility", "recovery", "mobility", "mixed", "recovery"];
      break;
    case "preseason":
    default:
      return pickAccumulationIntent(date, acwr, heavyDensity);
  }
  let intent = week[dow];
  if (acwr !== null && acwr > ACWR_ELEVATED) {
    if (intent === "sprint" || intent === "strength") intent = "mobility";
    else if (intent === "mixed") intent = "technical";
  }
  if (heavyDensity && intent !== "rest") {
    if (intent === "strength") intent = "technical";
    if (intent === "mixed") intent = "mobility";
  }
  return intent;
}

function seasonReasoning(season: SeasonPhase, intent: PrescriptionIntent): string {
  switch (season) {
    case "offseason":
      return `Off-season · strength & conditioning block. Today is a ${intent} day.`;
    case "inseason":
      return `In-season · maintain strength and sharpen skills. Today is a ${intent} day.`;
    case "transition":
      return `Transition · active rest and aerobic base. Today is a ${intent} day.`;
    case "preseason":
    default:
      return `Pre-season build — progressing load toward the season. Today is a ${intent} day.`;
  }
}

// =============================================================================
// WEATHER GUARD — constrains the chosen intent for safe outdoor training
// =============================================================================

// Spec defaults (°C apparent, km/h, mm) — team-configurable later, like the
// ACWR/readiness thresholds. See WEATHER_LOGIC.md.
const HEAT_CAUTION_C = 28;
const HEAT_REDUCE_C = 32;
const HEAT_AVOID_C = 35;
const HEAT_STOP_C = 38;
const COLD_CAUTION_C = 4;
const COLD_AVOID_C = -5;
const WIND_UNRELIABLE_KMH = 40;
const RAIN_PRECIP_MM = 0.5;
const RAIN_WEATHER_CODE = 61;
const STORM_CODE_MIN = 95;
const STORM_CODE_MAX = 99;
const HEAT_LOAD_FACTOR_REDUCE = 1.1;
const HEAT_LOAD_FACTOR_AVOID = 1.2;
const HEAT_VOLUME_CUT = 0.8;

// Intense + outdoor intents → subject to the guard. Strength (indoor), mobility,
// technical, recovery, rest, and competition (organiser's call) are agnostic.
const OUTDOOR_INTENSE: ReadonlySet<PrescriptionIntent> = new Set<PrescriptionIntent>([
  "sprint",
  "mixed",
  "taper-prime",
]);

function substituteForWet(intent: PrescriptionIntent): PrescriptionIntent {
  // Wet grass kills sprints/cuts; move to an indoor session.
  return intent === "taper-prime" ? "mobility" : "strength";
}

/**
 * Apply the weather guard to a base prescription. Returns the prescription
 * unchanged (no `weatherAdjustment`) when weather is unknown, the intent is
 * weather-agnostic, or conditions are benign. A coach override keeps the planned
 * session but records the call (a thunderstorm still warns).
 */
export function applyWeatherGuard(
  rx: DailyPrescription,
  weather: WeatherInput | null,
  coachOverride: boolean,
): DailyPrescription {
  if (!weather || !OUTDOOR_INTENSE.has(rx.intent)) {
    return rx;
  }

  const apparent =
    typeof weather.apparentC === "number"
      ? weather.apparentC
      : typeof weather.tempC === "number"
        ? weather.tempC
        : null;
  const code = weather.weatherCode;
  const storm = code !== null && code >= STORM_CODE_MIN && code <= STORM_CODE_MAX;
  const wet =
    (code !== null && code >= RAIN_WEATHER_CODE && code < STORM_CODE_MIN) ||
    (weather.precipMm !== null && weather.precipMm > RAIN_PRECIP_MM);
  const wind = weather.windKmh;

  const original = rx.intent;
  const heatLoadFactor =
    apparent === null
      ? 1
      : apparent >= HEAT_AVOID_C
        ? HEAT_LOAD_FACTOR_AVOID
        : apparent >= HEAT_REDUCE_C
          ? HEAT_LOAD_FACTOR_REDUCE
          : 1;
  const t = (n: number) => Math.round(n);

  let action: WeatherAdjustment["action"] = "none";
  let adjusted = original;
  let reason = "";

  if (storm) {
    action = "stop";
    adjusted = "recovery";
    reason =
      "Thunderstorm — lightning risk. Outdoor training stopped; move indoors or rest.";
  } else if (apparent !== null && apparent >= HEAT_STOP_C) {
    action = "stop";
    adjusted = "recovery";
    reason = `${t(apparent)}°C feels-like — too hot to train outdoors. Indoor recovery or rest today.`;
  } else if (apparent !== null && apparent >= HEAT_AVOID_C) {
    action = "relocate";
    adjusted = "mobility";
    reason = `${t(apparent)}°C feels-like — no intense outdoor work. Moved to indoor mobility & skills; hydrate hard.`;
  } else if (wet) {
    action = "substitute";
    adjusted = substituteForWet(original);
    reason =
      "Wet grass — slip/ACL risk on sprints & cuts. Moved indoors to a tempo + strength session.";
  } else if (apparent !== null && apparent <= COLD_AVOID_C) {
    action = "substitute";
    adjusted = "mobility";
    reason = `${t(apparent)}°C feels-like — no outdoor max-effort in the cold. Indoor low-intensity mobility instead.`;
  } else if (apparent !== null && apparent >= HEAT_REDUCE_C) {
    action = "scale";
    reason = `${t(apparent)}°C feels-like — cut intense volume ~20%, train in the cooler hour, hydrate. Expect RPE to feel ~1 higher; log what you actually felt.`;
  } else if (apparent !== null && apparent >= HEAT_CAUTION_C) {
    reason = `${t(apparent)}°C — warm. Add hydration and breaks; session unchanged.`;
  } else if (apparent !== null && apparent <= COLD_CAUTION_C) {
    reason = `${t(apparent)}°C — cold muscles. Extend your warm-up; ease into max-velocity work.`;
  } else if (wind !== null && wind >= WIND_UNRELIABLE_KMH) {
    reason = `${t(wind)} km/h wind — throwing accuracy and sprint timing are unreliable; deprioritise testing.`;
  } else {
    return rx; // benign weather
  }

  // Coach override: keep the planned session; record the call. Storm still warns.
  if (coachOverride) {
    const note = storm
      ? "Coach override: training as planned — but lightning is present, take shelter if it nears."
      : `Coach override: training as planned despite conditions — ${reason}`;
    return {
      ...rx,
      weatherAdjustment: {
        applied: false,
        action: "none",
        originalIntent: original,
        adjustedIntent: original,
        heatLoadFactor,
        reason: note,
      },
    };
  }

  if (action === "none") {
    return {
      ...rx,
      weatherAdjustment: {
        applied: false,
        action: "none",
        originalIntent: original,
        adjustedIntent: original,
        heatLoadFactor,
        reason,
      },
    };
  }

  if (action === "scale") {
    // Same intent, reduced volume; heat load-scaling reflects true strain at port.
    return {
      ...rx,
      targetMinutes: t(rx.targetMinutes * HEAT_VOLUME_CUT),
      sprintReps: t(rx.sprintReps * HEAT_VOLUME_CUT),
      reasoning: `${reason} ${rx.reasoning}`,
      weatherAdjustment: {
        applied: true,
        action,
        originalIntent: original,
        adjustedIntent: original,
        heatLoadFactor,
        reason,
      },
    };
  }

  // relocate / substitute / stop → swap intent + targets (nutrition stays as the
  // day's plan; a lighter indoor session is safely over-fuelled, not under).
  const nt = baseTargets(adjusted);
  return {
    ...rx,
    intent: adjusted,
    intentLabel: INTENT_LABELS[adjusted],
    targetRpe: nt.targetRpe,
    targetMinutes: nt.targetMinutes,
    sprintReps: nt.sprintReps,
    strengthSets: nt.strengthSets,
    reasoning: `${reason} ${rx.reasoning}`,
    weatherAdjustment: {
      applied: true,
      action,
      originalIntent: original,
      adjustedIntent: adjusted,
      heatLoadFactor,
      reason,
    },
  };
}

/** Canonical target bundle per intent (single source for season + weather paths). */
function baseTargets(intent: PrescriptionIntent): {
  targetRpe: number | null;
  targetMinutes: number;
  sprintReps: number;
  strengthSets: number;
} {
  switch (intent) {
    case "rest":
      return { targetRpe: null, targetMinutes: 0, sprintReps: 0, strengthSets: 0 };
    case "recovery":
      return { targetRpe: 3, targetMinutes: 30, sprintReps: 0, strengthSets: 0 };
    case "mobility":
      return { targetRpe: 4, targetMinutes: 45, sprintReps: 0, strengthSets: 0 };
    case "technical":
      return { targetRpe: 5, targetMinutes: 60, sprintReps: 0, strengthSets: 0 };
    case "sprint":
      return { targetRpe: 8, targetMinutes: 60, sprintReps: 10, strengthSets: 0 };
    case "strength":
      return { targetRpe: 7, targetMinutes: 75, sprintReps: 0, strengthSets: 18 };
    case "mixed":
      return { targetRpe: 6, targetMinutes: 75, sprintReps: 6, strengthSets: 8 };
    case "taper-prime":
      return { targetRpe: 4, targetMinutes: 25, sprintReps: 4, strengthSets: 0 };
    case "competition":
      return { targetRpe: null, targetMinutes: 60, sprintReps: 0, strengthSets: 0 };
  }
}

// =============================================================================
// HELPERS — kept tiny and orthogonal so they're easy to unit-test.
// =============================================================================

function finalize(
  partial: Omit<DailyPrescription, "date" | "intentLabel"> & {
    date: Date;
    intentLabel?: string;
  },
): DailyPrescription {
  return {
    ...partial,
    date: toIsoDate(partial.date),
    intentLabel: partial.intentLabel ?? INTENT_LABELS[partial.intent],
  };
}

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function pickDriverEvent(
  date: Date,
  upcoming: CompetitionEvent[],
  lastEvent: CompetitionEvent | null,
): CompetitionEvent | null {
  // Future events take priority — what we're preparing for.
  const next = upcoming.find(
    (e) => new Date(e.endsAt ?? e.startsAt).getTime() >= date.getTime(),
  );
  if (next) {
    return next;
  }
  return lastEvent;
}

function nextEventHours(
  date: Date,
  upcoming: CompetitionEvent[],
): number | null {
  const next = upcoming.find(
    (e) => new Date(e.endsAt ?? e.startsAt).getTime() >= date.getTime(),
  );
  if (!next) {
    return null;
  }
  const diffMs = new Date(next.startsAt).getTime() - date.getTime();
  if (diffMs <= 0) {
    return 0;
  }
  return Math.round(diffMs / 3_600_000);
}

function postEventReasoning(lastEvent: CompetitionEvent | null): string {
  if (!lastEvent) {
    return "Recovery focus today — light blood flow only.";
  }
  const games = lastEvent.expectedGameCount ?? 1;
  const eventName = lastEvent.competitionShortName ?? lastEvent.competitionName;
  return `Just played ${games} game${games === 1 ? "" : "s"} at ${eventName}. Body is repairing — easy day.`;
}

function taperReasoning(
  event: CompetitionEvent | null,
  daysOut: number,
): string {
  if (!event) {
    return "Taper week. Keep nervous system sharp at low volume.";
  }
  const games = event.expectedGameCount ?? 1;
  const eventName = event.competitionShortName ?? event.competitionName;
  return `${daysOut} day${daysOut === 1 ? "" : "s"} to ${eventName} (${games} games). Sharp, not heavy.`;
}

function accumulationReasoning(
  intent: PrescriptionIntent,
  acwr: number | null,
  heavyDensity: boolean,
): string {
  if (heavyDensity) {
    return "Dense competition window ahead — modulating load now to arrive fresh.";
  }
  if (acwr !== null && acwr > ACWR_ELEVATED) {
    return `ACWR ${acwr.toFixed(2)} is elevated — reduced volume on a ${intent} focus.`;
  }
  if (acwr !== null && acwr < ACWR_UNDER) {
    return `Under-trained (ACWR ${acwr.toFixed(2)}) — building load with a ${intent} session.`;
  }
  return `Build phase. Today is a ${intent} day.`;
}

function pickAccumulationIntent(
  date: Date,
  acwr: number | null,
  heavyDensity: boolean,
): PrescriptionIntent {
  // Standard week shape: Mon strength, Tue sprint, Wed technical/mobility,
  // Thu strength, Fri sprint, Sat mixed, Sun rest. Day-of-week 0 = Sunday.
  const dow = date.getDay();
  const standard: PrescriptionIntent[] = [
    "rest",      // Sun
    "strength",  // Mon
    "sprint",    // Tue
    "mobility",  // Wed
    "strength",  // Thu
    "sprint",    // Fri
    "mixed",     // Sat
  ];
  let intent = standard[dow];

  // Modulate when load is elevated or density is heavy.
  if (acwr !== null && acwr > ACWR_ELEVATED) {
    if (intent === "sprint" || intent === "strength") {
      intent = "mobility";
    } else if (intent === "mixed") {
      intent = "technical";
    }
  }
  if (heavyDensity && intent !== "rest") {
    if (intent === "strength") intent = "technical";
    if (intent === "mixed") intent = "mobility";
  }
  return intent;
}

// =============================================================================
// NUTRITION TARGETS
//
// Per-kg ranges from current sport-nutrition consensus (rough mid-points):
//   Carbs:    rest 3, easy 4, moderate 5, hard/strength 6, comp/heavy 8
//   Protein:  steady 1.8 g/kg/day across phases
//   Fluid:    base 35 ml/kg/day; competition adds ~1.5L; heat adds ~0.5L
// =============================================================================

const CARB_PER_KG: Record<PrescriptionIntent, number> = {
  rest: 3,
  recovery: 4,
  mobility: 4,
  technical: 4.5,
  sprint: 6,
  strength: 6,
  mixed: 5.5,
  "taper-prime": 7,
  competition: 8,
};

const PROTEIN_PER_KG = 1.8;
const FLUID_BASE_ML_PER_KG = 35;
const FLUID_COMPETITION_BONUS_L = 1.5;

function nutritionFor(
  intent: PrescriptionIntent | "taper" | "transition",
  bodyweightKg: number,
  heavyDensity: boolean,
): NutritionTargets {
  // Map non-Intent labels onto a real bucket
  const key: PrescriptionIntent =
    intent === "taper"
      ? "sprint"
      : intent === "transition"
        ? "mixed"
        : (intent as PrescriptionIntent);

  const carbsG = Math.round(CARB_PER_KG[key] * bodyweightKg);
  const proteinG = Math.round(PROTEIN_PER_KG * bodyweightKg);
  let hydrationL = (FLUID_BASE_ML_PER_KG * bodyweightKg) / 1000;
  if (key === "competition") {
    hydrationL += FLUID_COMPETITION_BONUS_L;
  }
  if (heavyDensity && key !== "rest") {
    hydrationL += 0.5;
  }

  return {
    carbsG,
    proteinG,
    hydrationL: Math.round(hydrationL * 10) / 10,
    rationale:
      key === "competition"
        ? "Game-day fueling: carbs every game, hydrate aggressively, protein after final game."
        : key === "rest"
          ? "Lower carb day. Protein steady to support repair."
          : key === "taper-prime"
            ? "Top up glycogen tonight. Hydrate well — game window opens soon."
            : `Daily targets at ${CARB_PER_KG[key]}g/kg carbs, ${PROTEIN_PER_KG}g/kg protein.`,
  };
}

// Convenience exports for testing and for any callers that want the same
// reasoning logic without creating a service.
export const __periodization__ = {
  prescribeFor,
  nutritionFor,
  pickAccumulationIntent,
  macroPhaseFor,
  applyWeatherGuard,
  seasonShapedIntent,
  baseTargets,
  CARB_PER_KG,
};
