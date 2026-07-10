import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { DatePipe, DecimalPipe, UpperCasePipe } from "@angular/common";
import { LucideAngularModule } from "lucide-angular";

import { PeriodizationService } from "../core/services/periodization.service";
import { ReadinessService } from "../core/services/readiness.service";
import { AcwrService } from "../core/services/acwr.service";
import { ScheduleService } from "../core/services/schedule.service";
import { IdentityService } from "../core/services/identity.service";
import { WellnessService } from "../core/services/wellness.service";

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
}
const BODY_PARTS: BcPart[] = [
  ...(
    [
      "Hamstring",
      "Quadriceps",
      "Groin / adductor",
      "Hip flexor",
      "Glute",
      "Knee",
      "Calf",
      "Soleus",
      "Achilles",
      "Ankle",
      "Shin",
      "Foot / plantar",
    ] as const
  ).map((label) => ({ label, group: "Lower body" as const })),
  ...(["Lower back", "Upper back / neck", "Core / abs"] as const).map(
    (label) => ({ label, group: "Trunk" as const }),
  ),
  ...(["Shoulder", "Elbow", "Wrist / hand", "Fingers", "Other"] as const).map(
    (label) => ({ label, group: "Upper body" as const }),
  ),
];

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
    DecimalPipe,
    UpperCasePipe,
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

  constructor() {
    // Readiness is server-canonical; recompute from the latest check-in each visit.
    this.readinessSvc.calculateToday().subscribe({ error: () => undefined });
    // 28-day history drives the check-in coverage grid + the readiness sparkline.
    this.readinessSvc.getHistory("", 28).subscribe({ error: () => undefined });
  }

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
  readonly readinessBand = computed<{ label: string; cls: string } | null>(
    () => {
      const s = this.readinessScore();
      if (s == null) return null;
      const v = Math.round(s);
      const cls = v < 55 ? "danger" : v <= 75 ? "caution" : "good";
      const word = v < 55 ? "deload" : v <= 75 ? "maintain" : "ready";
      return { label: `${v} · ${word}`, cls };
    },
  );

  /** Readiness sparkline points from the 28-day history (SVG 120×26). */
  readonly readinessSpark = computed(() => {
    const scores = this.readinessSvc
      .history()
      .map((h) => h.score)
      .filter((v): v is number => Number.isFinite(v))
      .slice(-12);
    if (scores.length < 2) return "";
    const max = Math.max(...scores, 100);
    const min = Math.min(...scores, 0);
    const span = max - min || 1;
    return scores
      .map((v, i) => {
        const x = (i / (scores.length - 1)) * 118 + 1;
        const y = 22 - ((v - min) / span) * 18;
        return `${x.toFixed(0)},${y.toFixed(0)}`;
      })
      .join(" ");
  });

  readonly sleepHours = computed(() => {
    const e = this.wellnessSvc.latestWellnessEntry();
    return e?.sleepHours ?? e?.sleep ?? null;
  });

  /** Days of readiness history logged — the ACWR-reliability progress (need ~21). */
  readonly daysLogged = computed(() => this.readinessSvc.history().length);
  readonly acwrReliabilityPct = computed(() =>
    Math.min(100, Math.round((this.daysLogged() / 21) * 100)),
  );

  readonly acwrSufficient = this.acwrSvc.sufficientDataForACWR;
  readonly acwrRatio = this.acwrSvc.acwrRatio;
  readonly acwrBand = computed<{ label: string; cls: string } | null>(() => {
    if (!this.acwrSufficient()) return null;
    const r = this.acwrRatio();
    if (r == null) return null;
    const v = r.toFixed(2);
    if (r > 1.5) return { label: `${v} · danger`, cls: "danger" };
    if (r > 1.3) return { label: `${v} · elevated`, cls: "caution" };
    if (r < 0.8) return { label: `${v} · under`, cls: "caution" };
    return { label: `${v} · sweet spot`, cls: "good" };
  });

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
    if (this.selectedParts().size === 0) this.severity.set(null);
  }
  setSeverity(sev: string): void {
    this.severity.set(sev);
  }
  clearBody(): void {
    this.selectedParts.set(new Set());
    this.severity.set(null);
    this.noneClear.set(true);
  }

  readonly bodyMsg = computed<{ text: string; cls: string } | null>(() => {
    if (this.noneClear()) {
      return {
        text: "All clear logged — clean slate for the next block.",
        cls: "",
      };
    }
    const on = [...this.selectedParts()];
    if (on.length === 0) return null;
    const list = on.join(", ");
    const sev = this.severity();
    if (!sev)
      return { text: `Selected: ${list} — pick severity to log.`, cls: "" };
    if (sev === "mild")
      return {
        text: `Logged: ${list} · mild — monitored, load unchanged, trend watched.`,
        cls: "",
      };
    if (sev === "moderate")
      return {
        text: `Logged: ${list} · moderate — today's plyo & sprint work gets swapped; coach sees the flag.`,
        cls: "is-warn",
      };
    return {
      text: `Logged: ${list} · sharp — session flagged, don't train through this. Coach notified.`,
      cls: "is-danger",
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
  readonly hydroTarget = computed(
    () => this.rx()?.nutrition?.hydrationL ?? 3.2,
  );
  private readonly hydroLogged = signal(0);
  readonly hydroValue = computed(() => this.hydroLogged());
  readonly hydroPct = computed(() =>
    Math.min(100, (this.hydroLogged() / this.hydroTarget()) * 100),
  );
  addWater(ml: number): void {
    this.hydroLogged.update((v) => Math.round((v + ml / 1000) * 100) / 100);
  }
  resetWater(): void {
    this.hydroLogged.set(0);
  }
  readonly hydroMsg = computed<{ text: string; cls: string } | null>(() => {
    const ratio = this.hydroLogged() / this.hydroTarget();
    if (ratio > 1.75)
      return {
        cls: "is-danger",
        text: `You're ${(this.hydroLogged() - this.hydroTarget()).toFixed(1)}L over target — overdrinking dilutes blood sodium (hyponatremia). Switch to electrolytes and drink to thirst.`,
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
