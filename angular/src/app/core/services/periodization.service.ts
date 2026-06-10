import {
  Injectable,
  Signal,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";

import {
  CompetitionEvent,
  CompetitionPhase,
} from "../models/schedule.models";
import {
  DailyPrescription,
  NutritionTargets,
  PeriodizationInputs,
  PrescriptionIntent,
  RecentSession,
  RecoveryEmphasis,
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
import {
  POSITION_VOLUME,
  type PositionKey,
  type RangeDemand,
} from "../config/position-volume.config";

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
  /** Athlete primary position (drives position-specific prehab emphasis). */
  readonly position = signal<string | null>(null);

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

  /** Guards the recent-sessions load against re-running for the same user. */
  private lastRecentSessionsUserId: string | null = null;

  constructor() {
    this.loadSettings();
    void this.injury.load();

    // Recent-sessions load is keyed off userId(). On a cold boot the Supabase
    // client is lazily imported, so userId() is null at construction — a plain
    // fire-and-forget call would return empty and the CNS recovery-spacing data
    // would silently never load. An effect re-runs once the user resolves.
    effect(() => {
      const userId = this.supabase.userId();
      if (!userId) {
        this.lastRecentSessionsUserId = null;
        this.recentSessions.set([]);
        return;
      }
      if (this.lastRecentSessionsUserId === userId) return;
      this.lastRecentSessionsUserId = userId;
      void this.loadRecentSessions(userId);
    });

    // Live weather → the prescription weather guard (metric: °C / mm / km/h).
    // The server resolves location from the team's home_city; when it reports
    // unavailable (no location / fetch failure) the guard simply stays off —
    // real weather or none, never a default location's weather.
    this.api
      .get<{
        available?: boolean;
        temp?: number; apparentC?: number; weatherCode?: number;
        precipMm?: number; windKmh?: number; windSpeed?: number;
        condition?: string; suitability?: string;
      }>("/api/weather")
      .subscribe({
        next: (res) => {
          const d = res?.data;
          if (!d || d.available === false || d.temp == null) return;
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
        primaryPosition?: string;
        primary_position?: string;
      }>("/api/player-settings")
      .subscribe({
        next: (res) => {
          const d = (res?.data ?? {}) as {
            season_calendar?: SeasonWindow[];
            seasonCalendar?: SeasonWindow[];
            teamTrainingDays?: { days?: number[]; time?: string } | number[];
            primaryPosition?: string;
            primary_position?: string;
          };
          const cal = d.season_calendar ?? d.seasonCalendar;
          if (Array.isArray(cal)) this.seasonCalendar.set(cal);
          const ttd = d.teamTrainingDays;
          const days = Array.isArray(ttd) ? ttd : (ttd?.days ?? []);
          this.teamTrainingDays.set(
            days.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
          );
          const pos = d.primaryPosition ?? d.primary_position;
          if (typeof pos === "string" && pos) this.position.set(pos);
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
  private async loadRecentSessions(userId: string): Promise<void> {
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
            peakDayGameCount: snap.density14d.peakDayGameCount,
          }
        : null,
      seasonPhase: macroPhaseFor(now, this.seasonCalendar()),
      weather: this.weather(),
      recentSessions: this.recentSessions(),
      ageYears: this.readAgeYears(),
      position: this.position(),
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
    const ageYears = this.readAgeYears();

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
                peakDayGameCount: snap.density14d.peakDayGameCount,
              }
            : null,
          seasonPhase: macroPhaseFor(date, this.seasonCalendar()),
          // Weather is current-conditions only (no 7-day forecast feed), so it
          // can only guard today; future days resolve unguarded rather than
          // against stale "now" weather.
          weather: i === 0 ? this.weather() : null,
          recentSessions: this.recentSessions(),
          ageYears,
          position: this.position(),
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

  /**
   * Athlete age in whole years from date_of_birth (legacy birth_date also read).
   * Drives the age-scaled CNS recovery window. Returns null when absent/implausible
   * so the engine keeps the 48h base for everyone.
   */
  private readAgeYears(): number | null {
    const user = this.supabase.currentUser?.();
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const dob = meta["date_of_birth"] ?? meta["birth_date"] ?? meta["dateOfBirth"];
    if (typeof dob !== "string" && typeof dob !== "number") {
      return null;
    }
    const born = new Date(dob);
    if (Number.isNaN(born.getTime())) {
      return null;
    }
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    const m = now.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < born.getDate())) {
      age -= 1;
    }
    return age >= 16 && age <= 80 ? age : null;
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
/** Games in a single day that count as a congested (tournament) day. */
const DENSITY_CONGESTED_DAY_GAMES = 3;

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
 * Conservative default treats sprint work as max-velocity (48h). Sub-max speed
 * could justify 24h — kept at the safe 48h default rather than guessing intensity
 * from `session_type`. Scaled UP with age (never down) — see {@link cnsRecoveryHoursForAge}.
 */
const CNS_RECOVERY_HOURS = 48;

/**
 * Age-scaled CNS recovery window. Older athletes recover neuromuscular and
 * connective-tissue fatigue more slowly, so the spacing between max-velocity /
 * plyometric days lengthens with age. MONOTONIC and floored at the 48h base —
 * a younger athlete is never told to rest *less* than before this existed.
 * Bands (conservative calibration; masters S&C consensus): <35 → 48h, 35–39 →
 * 60h, 40+ → 72h. A missing/implausible age falls back to the 48h base.
 */
function cnsRecoveryHoursForAge(ageYears?: number | null): number {
  if (typeof ageYears !== "number" || !Number.isFinite(ageYears) || ageYears < 16) {
    return CNS_RECOVERY_HOURS;
  }
  if (ageYears >= 40) return 72;
  if (ageYears >= 35) return 60;
  return CNS_RECOVERY_HOURS;
}

/** Detect a high-CNS session from its raw `session_type`/`drill_type`. */
function isHighCnsSessionType(type: string): boolean {
  return /sprint|plyo|speed|max.?velocity|accel|agility|bound/i.test(type || "");
}

/**
 * CNS recovery spacing: if the engine chose a high-CNS day but the athlete did
 * sprint/plyo work within the (age-scaled) CNS recovery window, downgrade to
 * mobility + technique so back-to-back high-CNS days can't happen. Records
 * `cnsRecoveryAdjustment` for traceability. Lowest-precedence guard — weather/
 * physio override it.
 */
function applySprintRecoveryGuard(
  p: DailyPrescription,
  recentSessions: PeriodizationInputs["recentSessions"],
  date: Date,
  ageYears?: number | null,
): DailyPrescription {
  if (!HIGH_CNS_INTENTS.has(p.intent)) return p;
  if (!recentSessions || recentSessions.length === 0) return p;

  const windowHours = cnsRecoveryHoursForAge(ageYears);
  const now = date.getTime();
  const windowMs = windowHours * 3_600_000;
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
    reasoning: `Sprinted ${hoursSince}h ago — ${windowHours}h CNS recovery; today is mobility + technique.`,
    cnsRecoveryAdjustment: {
      hoursSinceLastHighCns: hoursSince,
      windowHours,
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
  // The window lengthens with the athlete's age (older = more recovery).
  const spaced = applySprintRecoveryGuard(
    base,
    inputs.recentSessions ?? null,
    inputs.date,
    inputs.ageYears ?? null,
  );
  const guarded = applyWeatherGuard(spaced, inputs.weather ?? null, inputs.coachOverride ?? false);
  // Injury/physio precedence over training (spec law): runs last so the affected
  // region's sprint/high-intensity work is removed regardless of the base plan.
  const physioGuarded = applyInjuryGuard(guarded, inputs.activeRestrictions ?? null);
  // Position-specific accessory/prehab emphasis — additive guidance only, never
  // changes the chosen intent or load. Throwing/upper restrictions override the
  // QB/center emphasis into a protect-the-arm message.
  return withPositionEmphasis(
    physioGuarded,
    inputs.position ?? null,
    inputs.activeRestrictions?.restrictsThrowing ?? false,
  );
}

/**
 * Position bucket from a raw primary_position string. Recognises the five roles
 * (qb / wr / db / center / blitzer) plus the legacy both-ways "wr_db" combined
 * bucket. Order matters: the combined token and specific roles are checked
 * before broad ones.
 */
function positionBucket(position: string | null): PositionKey | null {
  const p = (position ?? "").toLowerCase();
  if (!p) return null;
  if (/\bqb\b|quarterback/.test(p)) return "qb";
  if (/center|long.?snap|snapper/.test(p)) return "center";
  if (/blitz|rush/.test(p)) return "blitzer";
  if (/wr.?db|wr\/db|both.?way|hybrid|two.?way/.test(p)) return "wr_db";
  if (/\bwr\b|receiver|wide.?out|wideout/.test(p)) return "wr";
  if (/\bdb\b|corner|safety|defensive.?back|cornerback/.test(p)) return "db";
  return null;
}

function fmtDemand(v: number | RangeDemand | undefined): string | null {
  if (v == null) return null;
  return typeof v === "number" ? `${v}` : `${v.min}–${v.max}`;
}

/**
 * Worst-case volume targets for a position, read from the tunable position-volume
 * reference (never hard-coded here). Surfaces the training demand (per-session +
 * per-week) and the per-game worst case so the plan states what to be ready for.
 */
function volumeFor(
  bucket: PositionKey,
): { worstCase: string; targets: string[] } {
  const v = POSITION_VOLUME[bucket];
  const targets: string[] = [];
  const wkCatches = fmtDemand(v.perWeek["catches"]);
  if (wkCatches) targets.push(`~${wkCatches} catches/week`);
  const throws = fmtDemand(v.perSession["throws"]);
  if (throws) targets.push(`${throws} throws/session`);
  const snaps = fmtDemand(v.perSession["snaps"]);
  if (snaps) targets.push(`${snaps} snaps/session`);
  const backped = fmtDemand(v.perSession["backpedals"]);
  if (backped) targets.push(`up to ${backped} backpedals/session`);
  const sprints = fmtDemand(v.perGameWorstCase["sprints"]);
  if (sprints) targets.push(`up to ${sprints} sprints/game`);
  const accels = fmtDemand(v.perGameWorstCase["explosiveSprints"]);
  if (accels) targets.push(`~${accels} max sprints/game`);
  if (bucket === "qb") targets.push("~320 throws/tournament");
  return { worstCase: v.worstCase, targets };
}

/**
 * Layer the position-specific accessory/prehab focus onto the prescription.
 * Conservative and additive — it informs WHAT to protect (from the position
 * model's primary injury risk), never the chosen intent or load. On a rest day
 * there is nothing to emphasise.
 */
function withPositionEmphasis(
  p: DailyPrescription,
  position: string | null,
  restrictsThrowing = false,
): DailyPrescription {
  const bucket = positionBucket(position);
  if (!bucket || p.intent === "rest") {
    return { ...p, positionEmphasis: null };
  }
  const volume = volumeFor(bucket);
  const pv = POSITION_VOLUME[bucket];
  // A flagged throwing/upper-body issue overrides the QB/center emphasis into a
  // protect-the-arm message — these are the positions that throw or snap.
  if (restrictsThrowing && (bucket === "qb" || bucket === "center")) {
    const verb = bucket === "qb" ? "throwing" : "snapping";
    return {
      ...p,
      positionEmphasis: {
        position: bucket,
        label: pv.label,
        focus: ["Protect the arm/shoulder", "Gentle pain-free ROM only", `No ${verb} reps today`],
        note: `Your ${verb} arm/shoulder is flagged — skip ${verb} work today and protect it. Lower-body and trunk work is fine if pain-free.`,
        restricted: true,
        volume,
      },
    };
  }
  // Prehab focus per role (presentation); the WHY comes from the model's
  // primaryInjuryRisk so the numbers/risk stay single-sourced in the config.
  const focusByPosition: Record<PositionKey, string[]> = {
    qb: ["Rotator-cuff & scapular control", "Thoracic rotation mobility", "Rotational core power"],
    wr: ["Eccentric hamstring (Nordic)", "Deceleration & landing mechanics", "Ankle & calf resilience"],
    db: ["Eccentric hamstring & adductor", "Backpedal-to-sprint hip-flip control", "Deceleration mechanics"],
    center: ["Wrist & forearm care", "Shoulder & scapular control", "Anti-rotation core brace"],
    blitzer: ["Max-effort accel mechanics", "Eccentric hamstring & calf", "Hard-braking deceleration"],
    wr_db: ["Eccentric hamstring & adductor", "Deceleration & cut mechanics", "Ankle & calf resilience"],
  };
  return {
    ...p,
    positionEmphasis: {
      position: bucket,
      label: pv.label,
      focus: focusByPosition[bucket],
      note: pv.primaryInjuryRisk,
      volume,
    },
  };
}

/**
 * Down-regulate the plan for an active injury / self-reported tightness affecting
 * a region used by sprint/high-intensity work. Severity-scaled; never overrides a
 * game day. Records `injuryAdjustment` so the change is traceable.
 */
/**
 * How an active injury/tightness down-regulates the session, by severity. The
 * caps are tunable data (Class 3) rather than literals in the guard logic.
 * Values are unchanged from the prior inline numbers.
 */
const INJURY_RESPONSE = {
  severe: { rpe: 3, minutes: 30, sets: 0 },
  moderate: { rpe: 3, maxMinutes: 40, maxSets: 3 },
  minor: { maxRpe: 6 },
} as const;

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
    targetRpe = INJURY_RESPONSE.severe.rpe;
    targetMinutes = INJURY_RESPONSE.severe.minutes;
    strengthSets = INJURY_RESPONSE.severe.sets;
    reasoning = `Reported ${regionLabel} issue — recovery only today. Injury precedence over training.`;
  } else if (moderate) {
    intent = "recovery";
    intentLabel = "Active recovery";
    targetRpe = INJURY_RESPONSE.moderate.rpe;
    targetMinutes = Math.min(p.targetMinutes, INJURY_RESPONSE.moderate.maxMinutes);
    strengthSets = Math.min(p.strengthSets, INJURY_RESPONSE.moderate.maxSets);
    reasoning = `Reported ${regionLabel} tightness — sprints pulled, easy session only. Injury precedence over training.`;
  } else {
    // minor: keep the day's shape but remove the sprint/high-intensity work
    intent = p.intent === "sprint" ? "mobility" : p.intent;
    intentLabel = p.intent === "sprint" ? "Mobility & technique" : `${p.intentLabel} (modified)`;
    targetRpe =
      p.targetRpe != null ? Math.min(p.targetRpe, INJURY_RESPONSE.minor.maxRpe) : p.targetRpe;
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
 * How an event/season PHASE modifies a team-practice session. Day-type
 * (practice) is resolved first; the phase is a DATA-DRIVEN modifier looked up
 * here — the RPE/volume values are config, not control flow. The set of keys
 * defines WHICH phases a practice day owns; phases deliberately absent
 * (competition, recovery) are the ones practice yields to. Adding a future
 * phase (deload, multi-game weekend) is a NEW ROW here — never a new branch.
 */
interface PracticePhaseModifier {
  /** Session intent the practice is logged as (e.g. "mixed", or "recovery" on a
   * post-game day). Data-driven so a new phase row sets it without code changes. */
  intent: PrescriptionIntent;
  rpe: number;
  minutes: number;
  recoveryEmphasis: RecoveryEmphasis;
  /** Intent passed to nutritionFor — must be a valid CARB_PER_KG key. */
  nutritionIntent: PrescriptionIntent;
  /** "own" = practice is the day; "sharp" = taper-style; "recovery" = post-game. */
  framing: "own" | "sharp" | "recovery";
}

const PRACTICE_PHASE_MODIFIERS: Record<string, PracticePhaseModifier> = {
  accumulation: { intent: "mixed", rpe: 7, minutes: 90, recoveryEmphasis: "low", nutritionIntent: "mixed", framing: "own" },
  transition: { intent: "mixed", rpe: 7, minutes: 90, recoveryEmphasis: "low", nutritionIntent: "mixed", framing: "own" },
  // Sharp practice a few days out: still a real session → fuel as 'mixed', NOT a
  // glycogen top-up (top-up is only the final day, handled by the taper branch).
  taper: { intent: "mixed", rpe: 6, minutes: 60, recoveryEmphasis: "medium", nutritionIntent: "mixed", framing: "sharp" },
  // Final 48h of a taper → lighter walkthrough/activation + begin glycogen top-up.
  taper_final: { intent: "mixed", rpe: 5, minutes: 45, recoveryEmphasis: "medium", nutritionIntent: "taper-prime", framing: "sharp" },
  // Post-tournament recovery day that is ALSO a declared practice day: honour the
  // practice (the athlete is going) but at recovery intensity — the calendar fact
  // is modified by the recovery context, not discarded (audit finding 1.1). Same
  // RPE3/30min as the recovery default, so intensity is unchanged; only the label
  // and framing now acknowledge the practice.
  recovery: { intent: "recovery", rpe: 3, minutes: 30, recoveryEmphasis: "high", nutritionIntent: "recovery", framing: "recovery" },
};

/**
 * Resolve the practice modifier for a phase (and taper proximity). Returns null
 * when a practice day does NOT own this phase (e.g. competition / recovery),
 * so the caller falls through to the phase-driven defaults.
 */
/**
 * Taper timing windows + the individual (non-practice) taper session targets,
 * centralised so taper timing/shape is tuned in ONE place rather than scattered
 * across the taper-prime gate, the practice modifier, and the standalone taper
 * case. Values are unchanged from the prior inline literals.
 */
const TAPER_CONFIG = {
  /** ≤ this many hours to the game → taper-prime (very short, sharp). */
  taperPrimeHours: 24,
  /** ≤ this many days out = the lighter "final third" of a taper. */
  finalThirdDaysOut: 2,
  /** Default day-of-taper when hours-to-event is unknown. */
  defaultDayOfTaper: 7,
  /** Individual (non-practice) taper session targets. */
  individual: {
    regular: { intent: "sprint" as PrescriptionIntent, rpe: 6, minutes: 45, sprintReps: 6 },
    final: { intent: "mobility" as PrescriptionIntent, rpe: 4, minutes: 30, sprintReps: 4 },
  },
} as const;

function practiceModifierFor(
  phase: CompetitionPhase,
  daysOut: number | null,
): PracticePhaseModifier | null {
  const key =
    phase === "taper" && daysOut !== null && daysOut <= TAPER_CONFIG.finalThirdDaysOut
      ? "taper_final"
      : phase;
  return PRACTICE_PHASE_MODIFIERS[key] ?? null;
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
  // Heavy density = a high 14-day game total OR a single congested day. A
  // tournament of 8 games over 2 days (4/day) never reaches the 10-games/14d
  // total, yet it is the highest-risk congestion there is — so a peak-day game
  // count at or above DENSITY_CONGESTED_DAY_GAMES also trips it.
  const heavyDensity =
    !!density14d &&
    (density14d.totalGames >= DENSITY_HEAVY_GAMES_14D ||
      (density14d.peakDayGameCount ?? 0) >= DENSITY_CONGESTED_DAY_GAMES);
  // Hot day → higher sweat/fluid need. Uses the same heat threshold the weather
  // guard does (apparent ≥ 28°C). Adds fluid to the nutrition target.
  const apparentTemp = inputs.weather?.apparentC ?? inputs.weather?.tempC ?? null;
  const hotDay = typeof apparentTemp === "number" && apparentTemp >= HEAT_CAUTION_C;

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
      nutrition: nutritionFor("competition", bodyweight, heavyDensity, hotDay),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 2. Within 24h of a game → taper-prime (very short, sharp, no fatigue).
  if (hoursUntilNext !== null && hoursUntilNext <= TAPER_CONFIG.taperPrimeHours) {
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
      nutrition: nutritionFor("taper-prime", bodyweight, heavyDensity, hotDay),
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
      nutrition: nutritionFor("rest", bodyweight, heavyDensity, hotDay),
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
      nutrition: nutritionFor("recovery", bodyweight, heavyDensity, hotDay),
      driverEvent,
      hoursUntilNextEvent: hoursUntilNext,
      acwrAtIssue: acwr,
    });
  }

  // 4.6 DAY TYPE = team practice. Resolved from the calendar FIRST (you're going
  // to practice regardless), then the event/season PHASE is applied as a
  // data-driven modifier (PRACTICE_PHASE_MODIFIERS) — the RPE/volume/fuel are
  // config, not control flow. A null modifier means a practice day does NOT own
  // this phase (only competition now — the game is the session) → fall through.
  const practiceDaysOut =
    hoursUntilNext !== null ? Math.max(1, Math.ceil(hoursUntilNext / 24)) : null;
  const practiceMod = inputs.isTeamPractice
    ? practiceModifierFor(phase, practiceDaysOut)
    : null;
  if (practiceMod) {
    const eventName = driverEvent
      ? (driverEvent.competitionShortName ?? driverEvent.competitionName)
      : null;
    const practiceReasoning =
      practiceMod.framing === "recovery"
        ? "Practice today, but you're in post-game recovery — keep it very light: active recovery and mobility only, no hard reps."
        : practiceMod.framing === "sharp"
          ? `Practice today is your session${
              practiceDaysOut !== null
                ? ` — ${practiceDaysOut} day${practiceDaysOut === 1 ? "" : "s"} to ${eventName ?? "your next game"}`
                : ""
            }. Keep it sharp, not heavy: crisp reps, full recovery, no grinding.`
          : "Team practice today — that's your main session. Keep any extra individual work light (mobility / activation).";
    return finalize({
      date,
      phase,
      intent: practiceMod.intent,
      intentLabel: "Flag football practice",
      targetRpe: practiceMod.rpe,
      targetMinutes: practiceMod.minutes,
      sprintReps: 0,
      strengthSets: 0,
      reasoning: practiceReasoning,
      recoveryEmphasis: practiceMod.recoveryEmphasis,
      nutrition: nutritionFor(practiceMod.nutritionIntent, bodyweight, heavyDensity, hotDay),
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
        nutrition: nutritionFor("recovery", bodyweight, heavyDensity, hotDay),
        driverEvent,
        hoursUntilNextEvent: hoursUntilNext,
        acwrAtIssue: acwr,
      });

    case "taper": {
      // Inside taper window: keep CNS sharp, drop volume. Targets are config
      // (TAPER_CONFIG.individual); closer to the event = the lighter "final" row.
      const dayOfTaper =
        hoursUntilNext !== null
          ? Math.max(1, Math.ceil(hoursUntilNext / 24))
          : TAPER_CONFIG.defaultDayOfTaper;
      const t =
        dayOfTaper <= TAPER_CONFIG.finalThirdDaysOut
          ? TAPER_CONFIG.individual.final
          : TAPER_CONFIG.individual.regular;
      return finalize({
        date,
        phase,
        intent: t.intent,
        targetRpe: t.rpe,
        targetMinutes: t.minutes,
        sprintReps: t.sprintReps,
        strengthSets: 0,
        reasoning: taperReasoning(driverEvent, dayOfTaper),
        recoveryEmphasis: "medium",
        nutrition: nutritionFor("taper", bodyweight, heavyDensity, hotDay),
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
        nutrition: nutritionFor("transition", bodyweight, heavyDensity, hotDay),
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
          nutrition: nutritionFor(intent, bodyweight, heavyDensity, hotDay),
          driverEvent,
          hoursUntilNextEvent: hoursUntilNext,
          acwrAtIssue: acwr,
          seasonPhase,
        });
      }

      // Choose intent by day of week to give the week a shape. Targets come from
      // the BUILD table (pre-season can carry more volume on light intents than
      // in-season — finding M1, now explicit config not inline literals).
      const intent = pickAccumulationIntent(date, acwr, heavyDensity);
      const t = buildTargets(intent);
      return finalize({
        date,
        phase,
        intent,
        targetRpe: t.targetRpe,
        targetMinutes: t.targetMinutes,
        sprintReps: t.sprintReps,
        strengthSets: t.strengthSets,
        reasoning: accumulationReasoning(intent, acwr, heavyDensity),
        recoveryEmphasis: heavyDensity ? "medium" : "low",
        nutrition: nutritionFor(intent, bodyweight, heavyDensity, hotDay),
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
    case "peak": // peaking block: sharp, low volume, high quality, fresh
      week = ["rest", "sprint", "technical", "mobility", "technical", "sprint", "recovery"];
      break;
    case "postseason": // active regeneration after the competitive block
    case "transition": // active rest / aerobic base (legacy alias)
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

type SessionTarget = ReturnType<typeof baseTargets>;

/**
 * Session targets for the generic / PRE-SEASON build block. Per the coach's rule,
 * a build block (no games) can carry more volume on the LIGHTER intents than
 * in-season — e.g. mobility RPE 6/75 in pre-season vs RPE 4/45 in-season. So the
 * in-season baseline is {@link baseTargets}; these rows override the light intents
 * heavier for the build week. (Resolves audit finding M1: the divergence between
 * the season path and the old inline accumulation literals was deliberate, not
 * accidental — it is now explicit data. Values are byte-identical to the prior
 * inline targets: rest 6/0, mobility 6/75, technical 6/75; strength/sprint/mixed
 * already matched baseTargets.)
 */
const BUILD_TARGET_OVERRIDES: Partial<Record<PrescriptionIntent, SessionTarget>> = {
  rest: { targetRpe: 6, targetMinutes: 0, sprintReps: 0, strengthSets: 0 },
  mobility: { targetRpe: 6, targetMinutes: 75, sprintReps: 0, strengthSets: 0 },
  technical: { targetRpe: 6, targetMinutes: 75, sprintReps: 0, strengthSets: 0 },
};

function buildTargets(intent: PrescriptionIntent): SessionTarget {
  return BUILD_TARGET_OVERRIDES[intent] ?? baseTargets(intent);
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
// Carbohydrate is periodised to the day's ENERGY EXPENDITURE, not just its
// intensity (IOC 2018 / ACSM-AND-DC consensus; Burke carbohydrate guidelines).
// Flag-football sessions are SHORT (≤60–75 min) and intermittent, so even a
// high-intensity sprint day is low-VOLUME and sits in the light–moderate band
// (3–5 g/kg/day), NOT the 6–10 g/kg endurance/loading band. Elevated carbs are
// reserved for genuine glycogen demand: the pre-game top-up (taper-prime, ≤24h
// out) and game/tournament days (multiple games + between-game refuel).
//   Light/skill     3–5 g/kg/day   ·  Moderate ~1h   5–7   ·  Endurance 6–10
//   Protein:  steady 1.8 g/kg/day (within the 1.6–2.2 consensus range)
//   Fluid:    base 35 ml/kg/day; competition adds ~1.5L; heat/density adds ~0.5L
// Previously sprint/strength were a flat 6 g/kg → 480g for an 80kg athlete on a
// 45-min sprint day, i.e. glycogen-loading carbs for a short session.
// =============================================================================

const CARB_PER_KG: Record<PrescriptionIntent, number> = {
  rest: 3,
  recovery: 3.5,
  mobility: 3.5,
  technical: 4,
  sprint: 4.5, // short, high-intensity, low-volume → light–moderate band
  strength: 4.5,
  mixed: 5, // skill + conditioning, more total work
  "taper-prime": 6, // deliberate glycogen top-up, ≤24h to competition
  competition: 7, // game/tournament day: multiple games + refuel between
};

const PROTEIN_PER_KG = 1.8;
const FLUID_BASE_ML_PER_KG = 35;
const FLUID_COMPETITION_BONUS_L = 1.5;

function nutritionFor(
  intent: PrescriptionIntent | "taper" | "transition",
  bodyweightKg: number,
  heavyDensity: boolean,
  hotDay = false,
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
  // Heat raises sweat losses — add fluid on a hot day (the comment above
  // promised this; it was previously never applied). Independent of density.
  if (hotDay && key !== "rest") {
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
  cnsRecoveryHoursForAge,
};
