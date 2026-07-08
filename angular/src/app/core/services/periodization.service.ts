/**
 * Periodization — the INTENT engine (D10: two-engine boundary).
 *
 * This client service owns WHAT a given day should achieve: the season phase,
 * taper windows, RPE/minutes targets, recovery and nutrition emphasis, and
 * position emphasis — i.e. the training INTENT. It does NOT pick exercises.
 *
 * The concrete REALIZATION of that intent (actual exercises, sets/reps/holds,
 * loads) is owned by the backend daily-protocol engine
 * (netlify/functions/daily-protocol.js), which consumes this intent via the
 * `intent` payload (the COMPOSE step). Keep exercise selection out of here and
 * keep periodization targets out of the backend — that split is what stops the
 * two engines from contradicting each other (e.g. a taper day that still
 * prescribes a full session).
 */
import {
  Injectable,
  Signal,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";

import { CompetitionPhase } from "../models/schedule.models";
import {
  DailyPrescription,
  RecentSession,
  SeasonWindow,
  WeatherInput,
} from "../models/prescription.models";
import { AcwrService } from "./acwr.service";
import { ReadinessService } from "./readiness.service";
import { ScheduleService } from "./schedule.service";
import { SupabaseService } from "./supabase.service";
import { ApiService } from "./api.service";
import { InjuryService } from "./injury.service";
import { EventTravelService } from "./event-travel.service";
import { RemoteTelemetryService } from "./remote-telemetry.service";
import { firstValueFrom } from "rxjs";
import {
  prescribeFor,
  macroPhaseFor,
  planWeekIntents,
  enforceWeeklyRestMinimum,
  addSecondSessions,
} from "./periodization-engine";

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
  private readonly eventTravel = inject(EventTravelService);
  private readonly remoteTelemetry = inject(RemoteTelemetryService);
  /** Shadow-mode dedup: only compare once per rendered day, not on every recompute. */
  private lastShadowComparedDate: string | null = null;

  /**
   * The athlete's declared season calendar (athlete_training_config.season_calendar),
   * fed to macroPhaseFor to set the macro season phase. Empty until loaded → the
   * engine falls back to the generic build week. NOTHING hardcoded.
   */
  readonly seasonCalendar = signal<SeasonWindow[]>([]);
  /** Athlete primary position (drives position-specific prehab emphasis). */
  readonly position = signal<string | null>(null);
  /** Bodyweight from the DB (users.weight_kg), populated by loadSettings(). */
  private readonly bodyweightKgFromDb = signal<number | null>(null);

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

  /** Guards the per-user bootstrap loads below against re-running for the same user. */
  private lastRecentSessionsUserId: string | null = null;

  constructor() {
    // Recent-sessions, injuries, player-settings (season calendar / team
    // training days / position), AND travel/acclimatization state all
    // previously loaded exactly once at construction, keyed to whichever user
    // happened to be signed in when this root-singleton service was first
    // instantiated. Because sign-out here is an in-SPA navigation (no full page
    // reload — confirmed no window.location.reload() anywhere in the sign-out
    // path), a second user signing in on the same device/tab within the app's
    // lifetime got the FIRST user's stale injuries/settings/travel:
    // sprint/high-intensity work could be silently prescribed unguarded for an
    // athlete with a real active injury (if the first user had none), or guarded
    // against a phantom injury that isn't theirs (if the first user had one).
    // Reload all of them whenever the resolved userId changes (cold boot: the
    // Supabase client is lazily imported, so userId() is null at construction —
    // the effect re-runs once the user resolves, and again on every change).
    effect(() => {
      const userId = this.supabase.userId();
      if (!userId) {
        this.lastRecentSessionsUserId = null;
        this.recentSessions.set([]);
        this.injury.active.set([]);
        return;
      }
      if (this.lastRecentSessionsUserId === userId) return;
      this.lastRecentSessionsUserId = userId;
      void this.loadRecentSessions(userId);
      void this.injury.load();
      this.loadSettings();
      // V2.4 acclimatization guard — travel state is per-user too, so it must
      // reload on user change alongside injuries/settings (same leak class).
      void this.eventTravel.load();
    });

    // Live weather → the prescription weather guard (metric: °C / mm / km/h).
    // The server resolves location from the team's home_city; when it reports
    // unavailable (no location / fetch failure) the guard simply stays off —
    // real weather or none, never a default location's weather.
    this.api
      .get<{
        available?: boolean;
        temp?: number;
        apparentC?: number;
        weatherCode?: number;
        precipMm?: number;
        windKmh?: number;
        windSpeed?: number;
        condition?: string;
        suitability?: string;
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
              (d.suitability as
                | "excellent"
                | "good"
                | "fair"
                | "poor"
                | undefined) ?? null,
            location: (d as { location?: string }).location ?? null,
          });
        },
        error: () => {
          /* no weather → guard stays off (fail-safe) */
        },
      });

    // Server prescription fetch + comparison (backend-authoritative migration,
    // steps 2+3 — see docs/SOURCE_OF_TRUTH.md §5a). Watches `localPrescription`,
    // NOT `today` — `today` itself depends on `serverPrescription`, which this
    // effect sets, so reading `today()` here would be a self-triggering cycle.
    // Logs match/mismatch to `frontend_logs` for ongoing verification (best-effort,
    // read-only, never blocks) AND — this is the actual switch — sets
    // `serverPrescription` on a successful response so `today` prefers it. Any
    // failure/timeout leaves `serverPrescription` unset, so `today` keeps
    // rendering `localPrescription`: the exact pre-migration behavior, not a new
    // failure mode.
    effect(() => {
      const local = this.localPrescription();
      if (!local || this.lastShadowComparedDate === local.date) {
        return;
      }
      this.lastShadowComparedDate = local.date;
      void this.fetchServerPrescription(local);
    });
  }

  /**
   * Fire-and-forget: fetch the server's prescription for the same date, log
   * whether the CORE decision fields (intent/targets/volume) agree against the
   * local computation, and — on success — make it the one `today` renders (by
   * setting `serverPrescription`; see `today`'s date-match guard). On any
   * failure/timeout this simply returns without setting anything — `today` keeps
   * rendering `localPrescription`, identical to pre-migration behavior. Never
   * throws, never blocks, never alters `localComputed` or anything rendered
   * from it directly.
   */
  private async fetchServerPrescription(
    localComputed: DailyPrescription,
  ): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.api.get<{ prescription: DailyPrescription }>(
          "/api/periodization-prescription",
          { date: localComputed.date },
        ),
      );
      const server = res?.data?.prescription;
      if (!server) {
        return;
      }

      const summarize = (p: DailyPrescription) => ({
        intent: p.intent,
        targetRpe: p.targetRpe,
        targetMinutes: p.targetMinutes,
        sprintReps: p.sprintReps,
        strengthSets: p.strengthSets,
        hasWeatherAdjustment: Boolean(p.weatherAdjustment),
        hasInjuryAdjustment: Boolean(p.injuryAdjustment),
        hasCnsAdjustment: Boolean(p.cnsRecoveryAdjustment),
      });
      const clientSummary = summarize(localComputed);
      const serverSummary = summarize(server);
      const coreMismatch =
        clientSummary.intent !== serverSummary.intent ||
        clientSummary.targetRpe !== serverSummary.targetRpe ||
        clientSummary.targetMinutes !== serverSummary.targetMinutes ||
        clientSummary.sprintReps !== serverSummary.sprintReps ||
        clientSummary.strengthSets !== serverSummary.strengthSets;

      const context = {
        date: localComputed.date,
        client: clientSummary,
        server: serverSummary,
      };
      if (coreMismatch) {
        // Day-one-of-rollout policy: the ENGINE is proven byte-identical
        // (tests/unit/periodization-port-parity.test.js), so a mismatch here
        // means the server's live INPUT ASSEMBLY differs from the client's for
        // this athlete/date — an unverified case, not yet a trusted one. Log
        // loudly and keep rendering `localPrescription` (today's exact
        // behavior) rather than adopt an unreviewed divergent value. Once
        // mismatch logs have been reviewed and are clean/understood, this
        // guard can be removed so the server is trusted unconditionally.
        this.remoteTelemetry.warn("periodization_server_mismatch", context);
        return;
      }
      this.remoteTelemetry.info("periodization_server_match", context);
      // Only reached on a verified-matching response: switching the SOURCE the
      // value renders from, not the value itself (they're identical) — zero
      // behavior risk for this athlete/date.
      this.serverPrescription.set(server);
    } catch {
      // Fetch failed → serverPrescription stays unset; `today` renders
      // `localPrescription`. Fail-safe, not a new failure mode.
    }
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
        weightKg?: number | null;
      }>("/api/player-settings")
      .subscribe({
        next: (res) => {
          const d = (res?.data ?? {}) as {
            season_calendar?: SeasonWindow[];
            seasonCalendar?: SeasonWindow[];
            teamTrainingDays?: { days?: number[]; time?: string } | number[];
            primaryPosition?: string;
            primary_position?: string;
            weightKg?: number | null;
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
          const wt = typeof d.weightKg === "number" ? d.weightKg : null;
          if (wt !== null && wt > 30 && wt < 200)
            this.bodyweightKgFromDb.set(wt);
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
        .select("session_type, drill_type, completed_at, rpe")
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .gte("completed_at", since)
        .order("completed_at", { ascending: false });
      if (error || !data) return;
      this.recentSessions.set(
        data.map((r) => ({
          at: r.completed_at as string,
          type: (r.session_type as string) || (r.drill_type as string) || "",
          rpe: typeof r.rpe === "number" ? r.rpe : null,
        })),
      );
    } catch {
      /* no sessions → no spacing */
    }
  }

  /**
   * Server-computed prescription for today, once the periodization-prescription
   * endpoint has answered (step 3 of the backend-authoritative migration — see
   * docs/SOURCE_OF_TRUTH.md §5a). Null until it arrives, and on any fetch failure
   * — `today` below falls back to `localPrescription` whenever this is null OR
   * stale (a different date, e.g. after a midnight rollover before the next
   * fetch completes).
   */
  private readonly serverPrescription = signal<DailyPrescription | null>(null);

  /**
   * Today's prescription, PREFERRING the server's answer when available and
   * fresh (Law #6: server-canonical) — else the identical local computation
   * (Law #4: an instant answer, never a spinner; and the offline/fail-safe path).
   * Reactive — updates whenever the schedule, ACWR, readiness, or the server
   * fetch resolve.
   */
  readonly today: Signal<DailyPrescription | null> = computed(() => {
    const local = this.localPrescription();
    const server = this.serverPrescription();
    if (server && local && server.date === local.date) {
      return server;
    }
    return local;
  });

  /**
   * The client-computed prescription — unchanged from before the migration.
   * Always the instant, synchronous answer; the fallback `today` renders from
   * whenever the server hasn't answered yet or the call failed.
   */
  private readonly localPrescription: Signal<DailyPrescription | null> =
    computed(() => {
      const snap = this.schedule.snapshot();
      if (!snap) {
        return null;
      }
      const now = new Date();

      // Mirror weekAhead()'s two-pass approach so the live "today" signal is
      // schedule-aware (sessions placed relative to actual practices and games,
      // not DOW arrays). Compute the same 7-day window to derive today's hint.
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const teamPracticeFlags7: boolean[] = [];
      const phases7: CompetitionPhase[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(todayStart);
        d.setDate(todayStart.getDate() + i);
        teamPracticeFlags7.push(this.isTeamPractice(d, snap.trainingDays));
        // Day 0 must agree with the `today` signal (server-computed
        // `snap.currentPhase`) rather than re-resolving locally — the client and
        // server phase resolvers key off different day-of-week sources (local vs
        // UTC) and can disagree for a few hours around UTC midnight.
        phases7.push(i === 0 ? snap.currentPhase : this.schedule.phaseFor(d));
      }
      const intentHints = planWeekIntents(teamPracticeFlags7, phases7);

      // Weekly progression cap: if this week's cumulative load already exceeds
      // the safe increase limit, pull back high-intensity sessions.
      const prog = this.acwrService.weeklyProgression();

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
        acclimatizationDay: this.eventTravel.daysSinceArrival(),
        arrivalDayTravelHours: this.eventTravel.arrivalDayTravelHours(),
        weeklyIntentHint: intentHints[0],
        weeklyProgressionUnsafe: prog ? !prog.isSafe : false,
      });
    });

  /**
   * 7-day forward prescription view. Useful for a week-at-a-glance UI.
   *
   * Uses a two-pass approach:
   *  Pass 1 — planWeekIntents(): surveys all 7 days (practices, games, taper,
   *    recovery) and assigns session types to free days based on PROXIMITY to
   *    high-load anchors, not by day-of-week. The intent hint is passed into
   *    each prescribeFor() call so higher-priority guards (ACWR, injury, weather)
   *    still apply on top of it.
   *  Pass 2 — addSecondSessions(): attaches a PM session to strength days
   *    eligible for two-a-day training (preseason/offseason, readiness ≥ 75,
   *    ACWR ≤ 1.2, different energy system, not a team-practice day).
   *
   * enforceWeeklyRestMinimum() acts as a safety net for edge cases where the
   * schedule topology produces fewer than 2 rest days despite the planner.
   *
   * SCOPE (backend-authoritative migration): still fully CLIENT-computed —
   * unlike `today`, this is not switched to the server-side
   * periodization-prescription endpoint. That endpoint answers for one date;
   * calling it 7x sequentially for a week-at-a-glance view would trade an
   * instant local computation for meaningful latency on a secondary/planning
   * screen. A batched multi-day endpoint variant is the right fix, not a
   * blocker to switching `today` (the primary, most-read, safety-relevant
   * surface — Law #4) first. See docs/SOURCE_OF_TRUTH.md §5a.
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
    // Unlike weather/ACWR/readiness (current-moment, not forecastable), days
    // since arrival is simple arithmetic — day i is `acclimBase + i` if the
    // athlete is mid-acclimatization, so the week view correctly shows the
    // guard easing across the week instead of freezing at today's value.
    const acclimBase = this.eventTravel.daysSinceArrival();

    // Pre-compute per-day data for the full 7-day window before calling
    // prescribeFor, so planWeekIntents can see the whole schedule at once.
    const dates7: Date[] = [];
    const teamPracticeFlags: boolean[] = [];
    const phases7: CompetitionPhase[] = [];
    const seasonPhases7: ReturnType<typeof macroPhaseFor>[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates7.push(d);
      teamPracticeFlags.push(this.isTeamPractice(d, snap.trainingDays));
      // Day 0 must agree with the `today` signal (server-computed
      // `snap.currentPhase`) rather than re-resolving locally — the client and
      // server phase resolvers key off different day-of-week sources (local vs
      // UTC) and can disagree for a few hours around UTC midnight.
      phases7.push(i === 0 ? snap.currentPhase : this.schedule.phaseFor(d));
      seasonPhases7.push(macroPhaseFor(d, this.seasonCalendar()));
    }

    // Schedule-aware intent plan: places sessions relative to practices and
    // games rather than by hardcoded day-of-week.
    const intentHints = planWeekIntents(teamPracticeFlags, phases7);

    // Weekly progression cap drives a hard guard for the entire week view.
    const prog = this.acwrService.weeklyProgression();
    const weeklyUnsafe = prog ? !prog.isSafe : false;

    const out: DailyPrescription[] = [];
    for (let i = 0; i < 7; i++) {
      const date = dates7[i];
      const phase = phases7[i];
      out.push(
        prescribeFor({
          date,
          phase,
          upcoming: snap.upcoming,
          lastEvent: snap.lastEvent,
          // ACWR and readiness are TODAY's acute signals; like weather (below) they
          // may only guard the current day. Passing them to all 7 days made a low
          // readiness / high ACWR today collapse the whole week to recovery/rest
          // (the readiness-collapse and ACWR-danger guards return before the phase
          // switch), overriding each future day's real phase. Future days resolve to
          // their phase-driven plan instead.
          acwr: i === 0 ? acwr : null,
          readiness: i === 0 ? readiness : null,
          bodyweightKg: bodyweight,
          density14d: snap.density14d
            ? {
                totalGames: snap.density14d.totalGames,
                hasPeakImportance: snap.density14d.hasPeakImportance,
                peakDayGameCount: snap.density14d.peakDayGameCount,
              }
            : null,
          seasonPhase: seasonPhases7[i],
          // Weather is current-conditions only (no 7-day forecast feed), so it
          // can only guard today; future days resolve unguarded rather than
          // against stale "now" weather.
          weather: i === 0 ? this.weather() : null,
          // Arrival day is a one-off fact about TODAY specifically, not a
          // forecastable offset like acclimatizationDay above.
          arrivalDayTravelHours:
            i === 0 ? this.eventTravel.arrivalDayTravelHours() : null,
          recentSessions: this.recentSessions(),
          ageYears,
          position: this.position(),
          isTeamPractice: teamPracticeFlags[i],
          activeRestrictions: this.injury.restrictions(),
          acclimatizationDay: acclimBase === null ? null : acclimBase + i,
          weeklyIntentHint: intentHints[i],
          weeklyProgressionUnsafe: weeklyUnsafe,
        }),
      );
    }

    // Safety net: ensure ≥ 2 rest days even if schedule topology is unusual,
    // then add PM double sessions where the phase and readiness allow it.
    const capped = enforceWeeklyRestMinimum(out, teamPracticeFlags);
    return addSecondSessions(
      capped,
      teamPracticeFlags,
      phases7,
      readiness,
      acwr,
    );
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
    if (
      typeof serverAcwr === "number" &&
      Number.isFinite(serverAcwr) &&
      serverAcwr > 0
    ) {
      return serverAcwr;
    }
    const localAcwr = this.acwrService.acwrRatio?.();
    return typeof localAcwr === "number" &&
      Number.isFinite(localAcwr) &&
      localAcwr > 0
      ? localAcwr
      : null;
  }

  private readReadiness(): number | null {
    const value = this.readinessService.current?.()?.score;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  private readBodyweight(): number | null {
    // Priority 1: DB-sourced weight (users.weight_kg), loaded via player-settings.
    const dbWeight = this.bodyweightKgFromDb();
    if (dbWeight !== null) return dbWeight;
    // Priority 2: Auth user_metadata fallback (set during onboarding on some paths).
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
    const dob =
      meta["date_of_birth"] ?? meta["birth_date"] ?? meta["dateOfBirth"];
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
