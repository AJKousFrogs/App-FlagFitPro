import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { DatePipe, UpperCasePipe } from "@angular/common";
import { LucideAngularModule } from "lucide-angular";

import { PeriodizationService } from "../core/services/periodization.service";
import { ReadinessService } from "../core/services/readiness.service";
import { AcwrService } from "../core/services/acwr.service";
import { ScheduleService } from "../core/services/schedule.service";
import { IdentityService } from "../core/services/identity.service";
import { WellnessService } from "../core/services/wellness.service";
import { InjuryService, InjurySeverity } from "../core/services/injury.service";
import { LoggerService } from "../core/services/logger.service";
import { resolveUnloggedPractice } from "./unlogged-practice";
import { KpiCardComponent, ReadinessRingComponent } from "../shared/perf-viz";
import { WhyPanelComponent } from "../shared/why-panel.component";
import { ConceptTipComponent } from "../shared/concept-tip.component";
import { BodyMeasurementService } from "../core/services/body-measurement.service";

/** Motivational quotes — daily-seeded, refreshable. Presentational. */
const QUOTES: readonly [string, string][] = [
  ["Hard work beats talent when talent doesn't work hard.", "Tim Notke"],
  [
    "It's not whether you get knocked down; it's whether you get up.",
    "Vince Lombardi",
  ],
  ["Champions keep playing until they get it right.", "Billie Jean King"],
  [
    "The more difficult the victory, the greater the happiness in winning.",
    "Pelé",
  ],
  ["You miss 100% of the shots you don't take.", "Wayne Gretzky"],
  [
    "Today I will do what others won't, so tomorrow I can do what others can't.",
    "Jerry Rice",
  ],
  ["It ain't over till it's over.", "Yogi Berra"],
  ["Make each day your masterpiece.", "John Wooden"],
];

interface BcPart {
  label: string;
  group: "Lower body" | "Trunk" | "Upper body";
  /** Canonical region sent to /api/athlete-injuries — must hit the server's
   *  region sets (athlete-injuries.js) so the right restrictions derive. */
  region: string;
}
const BODY_PARTS: BcPart[] = [
  ...(
    [
      ["Hamstring", "hamstring"],
      ["Quadriceps", "quadriceps"],
      ["Groin / adductor", "groin"],
      ["Hip flexor", "hip flexor"],
      ["Glute", "glute"],
      ["Knee", "knee"],
      ["Calf", "calf"],
      ["Soleus", "soleus"],
      ["Achilles", "achilles"],
      ["Ankle", "ankle"],
      ["Shin", "shin"],
      ["Foot / plantar", "plantar"],
    ] as const
  ).map(([label, region]) => ({
    label,
    region,
    group: "Lower body" as const,
  })),
  ...(
    [
      ["Lower back", "lower back"],
      ["Upper back / neck", "neck"],
      ["Core / abs", "core"],
    ] as const
  ).map(([label, region]) => ({ label, region, group: "Trunk" as const })),
  ...(
    [
      ["Shoulder", "shoulder"],
      ["Elbow", "elbow"],
      ["Wrist / hand", "wrist"],
      ["Fingers", "finger"],
      ["Other", "other"],
    ] as const
  ).map(([label, region]) => ({
    label,
    region,
    group: "Upper body" as const,
  })),
];

/** Body-check severity → athlete_injuries severity (drives restriction depth
 *  and the self-report auto-expiry: minor 2d / moderate 4d / severe 7d). */
const BC_SEVERITY: Record<string, InjurySeverity> = {
  mild: "minor",
  moderate: "moderate",
  sharp: "severe",
};

interface Supplement {
  name: string;
  note: string;
  grade: "a" | "b" | "c";
  done: boolean;
}

/**
 * Today — the redesigned home screen (2026-07-10). SERVER-CANONICAL data (the
 * prescription, readiness, ACWR, weather, schedule) comes from the kept engine
 * services and is rendered, never re-derived. The richer presentational sections
 * the redesign adds — the motivational quote, the season-plan timeline structure,
 * the body-check flags, the hydration tally, the supplement stack — are local UI
 * state (wire them to their own endpoints in follow-ups; the reliability of the
 * canonical numbers is unaffected).
 */
@Component({
  selector: "app-today",
  imports: [
    RouterLink,
    LucideAngularModule,
    DatePipe,
    UpperCasePipe,
    KpiCardComponent,
    ReadinessRingComponent,
    WhyPanelComponent,
    ConceptTipComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // <iconify-icon> food glyphs
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./today.component.html",
  styleUrl: "./today.component.scss",
})
export class TodayComponent {
  private readonly periodization = inject(PeriodizationService);
  private readonly readinessSvc = inject(ReadinessService);
  private readonly acwrSvc = inject(AcwrService);
  private readonly schedule = inject(ScheduleService);
  private readonly identity = inject(IdentityService);
  private readonly wellnessSvc = inject(WellnessService);
  private readonly injurySvc = inject(InjuryService);
  private readonly logger = inject(LoggerService);
  private readonly bodySvc = inject(BodyMeasurementService);

  constructor() {
    // Readiness is server-canonical; recompute from the latest check-in each visit.
    this.readinessSvc.calculateToday().subscribe({ error: () => undefined });
    // 28-day history drives the check-in coverage grid + the readiness sparkline.
    this.readinessSvc.getHistory("", 28).subscribe({ error: () => undefined });
    // Latest body mass for the tracking-tile KPI (logged on Stats).
    void this.bodySvc.loadHistory();
  }

  /** Latest logged body mass (kg) for the tracking-tile KPI. */
  readonly bodyMassKg = this.bodySvc.latestWeightKg;
  /** Body-mass sparkline series (recent logs). */
  readonly bodyMassSeries = computed(() =>
    this.bodySvc
      .weightHistory()
      .map((m) => m.weight as number)
      .slice(-14),
  );

  // ── identity / header ──────────────────────────────────────────────────────
  readonly firstName = this.identity.firstName;
  readonly initials = this.identity.initials;
  readonly avatarUrl = this.identity.avatarUrl;
  readonly teamName = computed(() => this.identity.teamName() ?? "Your team");

  readonly dateLabel = computed(() =>
    new Date().toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
  );
  readonly partOfDay = computed(() => {
    const h = new Date().getHours();
    return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  });

  // ── quote ──────────────────────────────────────────────────────────────────
  private readonly quoteIndex = signal(new Date().getDate() % QUOTES.length);
  readonly quote = computed(() => QUOTES[this.quoteIndex()]);
  nextQuote(): void {
    this.quoteIndex.update((i) => (i + 1) % QUOTES.length);
  }

  // ── weather chip + conditions ───────────────────────────────────────────────
  readonly weatherRaw = this.periodization.weather;
  readonly weatherIcon = computed(() => {
    const c = (this.weatherRaw()?.condition ?? "").toLowerCase();
    if (/rain|shower|drizzle|storm|thunder|snow/.test(c)) return "cloud-rain";
    if (/cloud|overcast|fog/.test(c)) return "cloud";
    return "sun";
  });

  // ── season plan + timeline ──────────────────────────────────────────────────
  readonly seasonEvents = this.schedule.upcoming;
  readonly nextEvent = this.schedule.nextEvent;
  readonly daysToNext = this.schedule.daysToNextEvent;

  readonly seasonPhaseLabel = computed(() => {
    const p = this.rx()?.seasonPhase;
    const label: Record<string, string> = {
      offseason: "Off-season",
      preseason: "Pre-season",
      inseason: "In-season",
      transition: "Transition",
    };
    return p ? label[p] : null;
  });

  /** Phased season timeline DERIVED from the real schedule + the engine's own
   *  rules (taper locks ~6 days before each event): a today→last-event track with
   *  colour-coded phase segments (build → taper → in-season), a legend, event
   *  dots, month ticks and a today marker. No fabricated phase dates — every
   *  boundary comes from a real event date. */
  readonly timeline = computed(() => {
    const events = this.seasonEvents();
    if (!events.length) return null;
    const DAY = 86_400_000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = today.getTime();
    const first = new Date(events[0].startsAt).getTime();
    const last = new Date(events[events.length - 1].startsAt).getTime();
    const end = Math.max(last + 3 * DAY, start + 30 * DAY);
    const span = end - start || 1;
    const pos = (t: number) =>
      Math.max(0, Math.min(100, ((t - start) / span) * 100));
    const fmt = (t: number) =>
      new Date(t).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });

    // Taper locks ~6 days before the first event; build fills the run-up.
    const taperStart = Math.max(start, first - 6 * DAY);
    const seg: {
      cls: "build" | "easy" | "season";
      leftPct: number;
      widthPct: number;
      isNow: boolean;
      label: string;
      range: string;
    }[] = [];
    if (taperStart > start) {
      seg.push({
        cls: "build",
        leftPct: pos(start),
        widthPct: pos(taperStart) - pos(start),
        isNow: true,
        label: this.seasonPhaseLabel()
          ? `${this.seasonPhaseLabel()} · build`
          : "Build",
        range: `${fmt(start)} – ${fmt(taperStart)}`,
      });
    }
    seg.push({
      cls: "easy",
      leftPct: pos(taperStart),
      widthPct: pos(first) - pos(taperStart),
      isNow: taperStart <= start,
      label: "Taper",
      range: `${fmt(taperStart)} – ${fmt(first)}`,
    });
    seg.push({
      cls: "season",
      leftPct: pos(first),
      widthPct: pos(end) - pos(first),
      isNow: false,
      label: "In-season · gamedays",
      range: `${fmt(first)} – ${fmt(last)}`,
    });

    const dots = events.map((e) => ({
      left: pos(new Date(e.startsAt).getTime()),
      label: e.competitionShortName || e.competitionName,
    }));
    const months: { left: number; label: string }[] = [];
    const cur = new Date(start);
    cur.setDate(1);
    for (let i = 0; i < 10; i++) {
      const t = cur.getTime();
      if (t >= start && t <= end)
        months.push({
          left: pos(t),
          label: cur.toLocaleDateString("en-GB", { month: "short" }),
        });
      cur.setMonth(cur.getMonth() + 1);
    }
    return { segments: seg, dots, months };
  });

  // ── today's session (prescription) ──────────────────────────────────────────
  readonly rx = this.periodization.today;
  readonly loading = this.schedule.loading;

  readonly rpeLabel = computed(() => {
    const rpe = this.rx()?.targetRpe;
    return rpe == null ? "—" : String(rpe);
  });

  /** One-line conditions summary for the session card, from live weather. */
  readonly conditionsLine = computed(() => {
    const w = this.weatherRaw();
    if (!w) return null;
    const parts = [`${w.tempC}°`];
    if (w.location) parts.push(`at ${w.location}`);
    if (w.condition) parts.push(`· ${w.condition}`);
    const suit = w.suitability;
    const tail =
      suit === "poor"
        ? "Adjust the plan for the conditions."
        : suit === "fair"
          ? "Workable — keep effort honest."
          : "Good conditions for the plan.";
    return { text: parts.join(" "), tail, suit: suit ?? "good" };
  });

  /**
   * A team-practice day (today or yesterday) with NO logged training session —
   * a nudge to log it so ACWR reflects the real practice load. This is the
   * honest way to close the "practices don't count" gap: the athlete enters the
   * ACTUAL session (RPE × minutes), never a fabricated estimate. Null when there
   * is nothing outstanding. Suppressed once a session is logged for that day
   * (recentSessions covers the last 4 days of completed sessions, incl.
   * session_type='flag_football').
   */
  readonly unloggedPractice = computed<{ label: string } | null>(() =>
    resolveUnloggedPractice(
      this.schedule.snapshot()?.trainingDays,
      this.periodization.recentSessions().map((s) => s.at),
      new Date(),
    ),
  );

  // ── check-in coverage (28-day, Monday-first) ────────────────────────────────
  readonly coverage = computed(() => {
    // A scored day is unambiguously a full check-in.
    const scored = new Set(this.readinessSvc.history().map((h) => h.day));
    // The canonical wellness log gives an honest "partial": a check-in row that
    // exists but is missing a core driver (sleep / energy / stress / soreness).
    // This is the row's OWN gap — nothing is fabricated (the card's promise).
    const complete = new Set<string>();
    const partialDays = new Set<string>();
    for (const w of this.wellnessSvc.wellnessData()) {
      const day = w.date;
      if (!day) continue;
      const full =
        w.sleep != null &&
        w.energy != null &&
        w.stress != null &&
        w.soreness != null;
      if (full) complete.add(day);
      else partialDays.add(day);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Start 27 days back, then walk back to the Monday of that week.
    const start = new Date(today);
    start.setDate(start.getDate() - 27);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

    const cells: {
      date: string;
      status: "done" | "partial" | "miss" | "today" | "future";
      isToday: boolean;
    }[] = [];
    let done = 0;
    let partial = 0;
    let missed = 0;
    let elapsed = 0;
    const cur = new Date(start);
    while (cur <= today || cells.length % 7 !== 0) {
      const iso = cur.toISOString().slice(0, 10);
      const isToday = cur.getTime() === today.getTime();
      const isFuture = cur > today;
      const status: "done" | "partial" | "miss" | "today" | "future" = isFuture
        ? "future"
        : scored.has(iso) || complete.has(iso)
          ? "done"
          : partialDays.has(iso)
            ? "partial"
            : "miss";
      cells.push({ date: iso, status, isToday });
      if (!isFuture) {
        elapsed++;
        if (status === "done") done++;
        else if (status === "partial") partial++;
        else missed++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    // streak: consecutive full check-ins ending today (partial/miss breaks it).
    let streak = 0;
    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i].status === "future") continue;
      if (cells[i].status === "done") streak++;
      else break;
    }
    // "Coverage" = days you checked in at all (full or partial); partial + missed
    // are broken out separately below it.
    const pct = elapsed ? Math.round(((done + partial) / elapsed) * 100) : 0;
    return { cells, pct, missed, partial, streak };
  });

  // ── tracking tiles ──────────────────────────────────────────────────────────
  readonly readiness = this.readinessSvc.current;
  readonly readinessScore = computed(() => this.readiness()?.score ?? null);

  readonly sleepHours = computed(() => {
    const e = this.wellnessSvc.latestWellnessEntry();
    return e?.sleepHours ?? e?.sleep ?? null;
  });

  // ── perf-viz inputs (2026-07-15) — map service signals to the premium
  //    dashboard components; every series is real logged data, never fabricated.
  /** Personal readiness baseline mean (audit C6) for the ring tick. */
  readonly readinessBaseline = computed(
    () => this.readiness()?.baseline?.mean ?? null,
  );
  /** Chronological readiness scores (oldest → newest) for the ring sparkline. */
  readonly readinessSeries = computed(() =>
    [...this.readinessSvc.history()]
      .filter((h) => Number.isFinite(h.score))
      .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime())
      .map((h) => h.score)
      .slice(-14),
  );
  /** Latest-vs-previous readiness delta. */
  readonly readinessDelta = computed(() =>
    this.lastDelta(this.readinessSeries()),
  );

  /** ACWR series from the same readiness history rows (they carry acwr). */
  readonly acwrSeries = computed(() =>
    [...this.readinessSvc.history()]
      .filter((h) => Number.isFinite(h.acwr))
      .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime())
      .map((h) => h.acwr)
      .slice(-14),
  );
  readonly acwrDelta = computed(() => this.lastDelta(this.acwrSeries(), 2));

  /** Sleep-hours history (last ~14 check-ins) for the sleep KPI sparkline. */
  readonly sleepSeries = computed(() =>
    this.wellnessSvc
      .wellnessData()
      .map((w) => w.sleepHours ?? w.sleep)
      .filter((v): v is number => Number.isFinite(v))
      .slice(-14),
  );
  readonly sleepDelta = computed(() => this.lastDelta(this.sleepSeries()));

  /** Latest − previous of a series, rounded to `digits`. Null if < 2 points. */
  private lastDelta(series: readonly number[], digits = 1): number | null {
    if (series.length < 2) return null;
    const d = series[series.length - 1] - series[series.length - 2];
    const f = 10 ** digits;
    return Math.round(d * f) / f;
  }

  /** Days of readiness history logged — the ACWR-reliability progress (need ~21). */
  readonly daysLogged = computed(() => this.readinessSvc.history().length);
  readonly acwrReliabilityPct = computed(() =>
    Math.min(100, Math.round((this.daysLogged() / 21) * 100)),
  );
  readonly acwrSufficient = this.acwrSvc.sufficientDataForACWR;
  readonly acwrRatio = this.acwrSvc.acwrRatio;

  // ── body check ──────────────────────────────────────────────────────────────
  readonly bodyGroups = ["Lower body", "Trunk", "Upper body"] as const;
  partsFor(group: string): BcPart[] {
    return BODY_PARTS.filter((p) => p.group === group);
  }
  private readonly selectedParts = signal<Set<string>>(new Set());
  private readonly severity = signal<string | null>(null);
  private readonly noneClear = signal(false);

  isPartOn = (label: string): boolean => this.selectedParts().has(label);
  isSev = (sev: string): boolean => this.severity() === sev;
  isNoneOn = (): boolean => this.noneClear();
  readonly hasFlags = computed(() => this.selectedParts().size > 0);

  togglePart(label: string): void {
    this.selectedParts.update((s) => {
      const next = new Set(s);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
    this.noneClear.set(false);
    this.bodyLogState.set("idle");
    if (this.selectedParts().size === 0) this.severity.set(null);
  }
  setSeverity(sev: string): void {
    this.severity.set(sev);
    this.bodyLogState.set("idle");
  }
  clearBody(): void {
    this.selectedParts.set(new Set());
    this.severity.set(null);
    this.noneClear.set(true);
    this.bodyLogState.set("idle");
  }

  // Body-check submit state. "Logged" is only ever shown after the writes
  // actually landed in athlete_injuries (SOT Law 7 — no fabricated UI claims;
  // this card previously asserted the report was saved and surfaced to staff
  // while persisting nothing at all — the trust bug this state machine closes).
  readonly bodyLogState = signal<"idle" | "saving" | "saved" | "error">("idle");
  private readonly loggedSummary = signal<{ list: string; sev: string }>({
    list: "",
    sev: "mild",
  });

  readonly canLogBody = computed(
    () =>
      this.hasFlags() &&
      this.severity() !== null &&
      this.bodyLogState() !== "saving",
  );

  /** Persist every flagged region as a self-reported tightness (the same
   *  athlete_injuries path as the Wellness reporter), then refresh readiness —
   *  the plan reacts through InjuryService's restrictions signal. */
  async logBody(): Promise<void> {
    const parts = BODY_PARTS.filter((p) => this.selectedParts().has(p.label));
    const sev = this.severity();
    if (parts.length === 0 || !sev || this.bodyLogState() === "saving") return;
    const severity = BC_SEVERITY[sev] ?? "minor";
    this.bodyLogState.set("saving");
    try {
      for (const p of parts) {
        await this.injurySvc.report(p.region, severity);
      }
      this.readinessSvc.calculateToday().subscribe({ error: () => undefined });
      this.loggedSummary.set({
        list: parts.map((p) => p.label).join(", "),
        sev,
      });
      this.selectedParts.set(new Set());
      this.severity.set(null);
      this.bodyLogState.set("saved");
    } catch (err) {
      this.logger.error("body_check_log_failed", err);
      this.bodyLogState.set("error");
    }
  }

  readonly bodyMsg = computed<{ text: string; cls: string } | null>(() => {
    const state = this.bodyLogState();
    if (state === "saving") return { text: "Logging…", cls: "" };
    if (state === "error")
      return { text: "Couldn't log that — try again.", cls: "is-danger" };
    if (state === "saved") {
      const { list, sev } = this.loggedSummary();
      if (sev === "mild")
        return {
          text: `Logged: ${list} · mild — sprint/high-intensity work comes off that area; auto-clears in 2 days.`,
          cls: "",
        };
      if (sev === "moderate")
        return {
          text: `Logged: ${list} · moderate — easy session only while it settles (~4 days); visible to your coaching staff.`,
          cls: "is-warn",
        };
      return {
        text: `Logged: ${list} · sharp — recovery only, don't train through this; visible to your coaching staff. If it persists, see your physio.`,
        cls: "is-danger",
      };
    }
    if (this.noneClear()) {
      return { text: "All clear — nothing flagged today.", cls: "" };
    }
    const on = [...this.selectedParts()];
    if (on.length === 0) return null;
    const list = on.join(", ");
    if (!this.severity())
      return {
        text: `Selected: ${list} — pick severity, then log it.`,
        cls: "",
      };
    return {
      text: `Ready: ${list} — tap “Log it” and today's plan works around it.`,
      cls: "",
    };
  });

  // ── fuel ─────────────────────────────────────────────────────────────────────
  readonly foodSuggestions = computed(() => {
    const intent = this.rx()?.intent;
    if (intent === "competition")
      return [
        "pasta",
        "rice",
        "banana",
        "white bread",
        "electrolytes",
        "chicken",
      ];
    if (intent === "recovery" || intent === "rest")
      return [
        "salmon",
        "eggs",
        "berries",
        "greek yogurt",
        "spinach",
        "almonds",
      ];
    if (intent === "strength")
      return ["chicken", "eggs", "rice", "shake", "oats", "fruit"];
    return ["rice", "oats", "fruit", "chicken", "shake", "eggs"];
  });

  // ── nutri-strip: contextual chips, each mapped to a real prescription signal ──
  readonly nutriStrip = computed<
    { label: string; sub: string; tone: "load" | "recover" | "free" }[]
  >(() => {
    const rx = this.rx();
    if (!rx) return [];
    const chips: {
      label: string;
      sub: string;
      tone: "load" | "recover" | "free";
    }[] = [];
    const hrs = rx.hoursUntilNextEvent;
    const ev = rx.driverEvent;
    const gameSoon = hrs != null && hrs >= 0 && hrs <= 48;
    // Carb-load window — the engine already raises carbs into a game (competition
    // bonus); surface it when a driver event is inside 48h.
    if (ev && gameSoon) {
      const days = Math.max(1, Math.round(hrs! / 24));
      chips.push({
        label: "Carb-load",
        sub: `${ev.competitionShortName || ev.competitionName || "Game"} in ~${days}d — top up glycogen`,
        tone: "load",
      });
    }
    // Recovery plate — driven by the day's recovery emphasis, not fabricated.
    if (rx.recoveryEmphasis === "high" || rx.recoveryEmphasis === "critical") {
      chips.push({
        label: "Recovery plate",
        sub: "Protein + antioxidants first — repair over fuel",
        tone: "recover",
      });
    }
    // Free-meal window — only on genuine low-load days with no game imminent.
    if ((rx.intent === "rest" || rx.intent === "recovery") && !gameSoon) {
      chips.push({
        label: "Free-meal window",
        sub: "Low load today — one relaxed meal won't cost you",
        tone: "free",
      });
    }
    return chips;
  });

  // ── electrolyte / sweat note — from the real heat modifier or gameday sweat ──
  readonly electroNote = computed<{
    text: string;
    tone: "warn" | "info";
  } | null>(() => {
    const rx = this.rx();
    if (!rx) return null;
    const w = rx.weatherAdjustment;
    const heat = w?.applied ? (w.heatLoadFactor ?? 1) : 1;
    if (heat > 1) {
      return {
        tone: "warn",
        text: `Hot day (heat load ×${heat.toFixed(2)}) — sweat + sodium losses climb. Add 300–700 mg sodium per litre; water alone won't cover it.`,
      };
    }
    if (rx.intent === "competition") {
      return {
        tone: "info",
        text: "Gameday sweat rate runs high — pre-load electrolytes and sip a sodium drink between drives, not just water.",
      };
    }
    return null;
  });

  // ── hydration ─────────────────────────────────────────────────────────────────
  // Null when no real bodyweight exists (nutrition is null) — the tile shows
  // "add your weight" instead of a fabricated default (Law #7, audit C7).
  readonly hydroTarget = computed(
    () => this.rx()?.nutrition?.hydrationL ?? null,
  );
  private readonly hydroLogged = signal(0);
  readonly hydroValue = computed(() => this.hydroLogged());
  readonly hydroPct = computed(() => {
    const target = this.hydroTarget();
    if (target == null || target <= 0) return 0;
    return Math.min(100, (this.hydroLogged() / target) * 100);
  });
  addWater(ml: number): void {
    this.hydroLogged.update((v) => Math.round((v + ml / 1000) * 100) / 100);
  }
  resetWater(): void {
    this.hydroLogged.set(0);
  }
  readonly hydroMsg = computed<{ text: string; cls: string } | null>(() => {
    const target = this.hydroTarget();
    // No real bodyweight → no target (Law #7) → no over/under messaging.
    if (target == null || target <= 0) return null;
    const ratio = this.hydroLogged() / target;
    if (ratio > 1.75)
      return {
        cls: "is-danger",
        text: `You're ${(this.hydroLogged() - target).toFixed(1)}L over target — overdrinking dilutes blood sodium (hyponatremia). Switch to electrolytes and drink to thirst.`,
      };
    if (ratio > 1.25)
      return {
        cls: "is-warn",
        text: `Past target — constant sipping adds risk, not performance. Add sodium, ease off the bottle.`,
      };
    if (ratio >= 1)
      return {
        cls: "is-ok",
        text: `Target hit. Anything beyond this should follow thirst, with sodium alongside.`,
      };
    return null;
  });

  // ── supplements ────────────────────────────────────────────────────────────────
  readonly supplements = signal<Supplement[]>([
    {
      name: "Creatine monohydrate · 5g",
      note: "Any time, every day. Strength, recovery, heat tolerance — earns its shelf space.",
      grade: "a",
      done: true,
    },
    {
      name: "Caffeine · pre-session",
      note: "Works — but keep it early. Low dose or skip on a late session: sleep beats the boost.",
      grade: "a",
      done: false,
    },
    {
      name: "Beta-alanine · 3.2g",
      note: "Best for 1–4 min sustained efforts. Marginal for short sprints with long rest — optional.",
      grade: "b",
      done: false,
    },
    {
      name: "Magnesium · 300mg, evening",
      note: "Fixes a deficiency, nothing more. Food-first: nuts, greens, legumes.",
      grade: "c",
      done: false,
    },
    {
      name: "Vitamin D",
      note: "Test first, then dose. Matters most Oct–Apr at Slovenian latitude.",
      grade: "b",
      done: false,
    },
  ]);
  toggleSupp(i: number): void {
    this.supplements.update((list) =>
      list.map((s, idx) => (idx === i ? { ...s, done: !s.done } : s)),
    );
  }
}
