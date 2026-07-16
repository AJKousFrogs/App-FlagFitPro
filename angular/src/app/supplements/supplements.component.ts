import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  effect,
  inject,
  signal,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LucideAngularModule } from "lucide-angular";
import { TopbarComponent } from "../shared/topbar.component";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { ScheduleService } from "../core/services/schedule.service";
import { SupabaseService } from "../core/services/supabase.service";
import { EventGamesService } from "../core/services/event-games.service";

interface SuppLog {
  supplement_name?: string;
  taken?: boolean;
  date?: string;
}

/** Per-supplement usage summary from GET /api/supplements/insights. */
interface SuppInsight {
  supplement: string; // canonical bucket ("creatine", "beta-alanine", …)
  label: string; // display name as the athlete logged it
  firstDate?: string;
  lastDate?: string;
  daysSinceLast: number;
  takenDaysLast7: number;
  priorHabitDays: number;
  totalDaysInWindow: number;
  habit: boolean;
  lapsed: boolean;
}

interface SuppNudge {
  supplement: string;
  label: string;
  daysSinceLast: number;
  message: string;
}

interface EducationCard {
  key: string;
  title: string;
  status: string; // short badge text ("saturated", "building up", …)
  statusCls: "good" | "info" | "warn" | "neutral";
  lines: string[];
}

/** Days of daily creatine before we stop calling it the build-up window. */
const CREATINE_BUILDUP_DAYS = 10;

/**
 * Creatine coaching, driven by the athlete's REAL logging history + the
 * schedule phase. Evidence framing (ISSN/IOC): loading is optional, timing is
 * flexible, cycling off is never physiologically required — the "when to
 * stop/keep" advice below is tournament practicality, not washout dogma.
 */
function creatineEducation(
  usage: SuppInsight | undefined,
  phase: string,
): EducationCard {
  const nearComp = phase === "taper" || phase === "competition";
  if (!usage || usage.totalDaysInWindow === 0) {
    return {
      key: "creatine",
      title: "Creatine — when it's worth it",
      status: "not started",
      statusCls: "neutral",
      lines: [
        "3–5 g daily (a level teaspoon) is the evidence dose — the best-supported supplement for repeated sprints and strength.",
        "No loading phase needed: daily use saturates muscle stores in ~3–4 weeks. A loading week (20 g/day split ×5–7 days) only gets you there faster.",
        nearComp
          ? "Competition is close — start AFTER the tournament: new supplements on game week is a gut-risk for zero benefit."
          : "Take it any time of day, every day — consistency beats timing.",
      ],
    };
  }
  if (usage.totalDaysInWindow <= CREATINE_BUILDUP_DAYS && !usage.habit) {
    return {
      key: "creatine",
      title: "Creatine — build-up phase",
      status: "building up",
      statusCls: "info",
      lines: [
        "You're in the saturation window: keep 3–5 g every day (~3–4 weeks to full stores), or a loading week (20 g/day in 4 small doses ×5–7 days) to get there sooner.",
        "Expect +1–2 kg of water weight — that's muscle water, not fat.",
        nearComp
          ? "Tournament close: stay at 3–5 g and skip the loading approach this week — split high doses can upset your gut on game day."
          : "Missing one day doesn't reset progress — just don't make it a habit.",
      ],
    };
  }
  if (usage.lapsed || usage.takenDaysLast7 <= 2) {
    return {
      key: "creatine",
      title: "Creatine — you've drifted off",
      status: "inconsistent",
      statusCls: "warn",
      lines: [
        `Stores fall slowly (weeks, not days) — resume 3–5 g daily and you keep most of the benefit. No need to re-load after ${usage.daysSinceLast} day${usage.daysSinceLast === 1 ? "" : "s"} off.`,
        "If you stopped on purpose: there's no physiological need to cycle creatine — stopping just washes stores out over ~4–6 weeks.",
        "Restart 3–4 weeks before your next hard block or tournament so you're saturated when it counts.",
      ],
    };
  }
  const phaseLine =
    phase === "taper"
      ? "Taper week: keep the daily dose — do NOT stop before a tournament; creatine supports repeated-sprint output exactly when you need it."
      : phase === "competition"
        ? "Game day: keep the normal dose and drink to thirst — creatine shifts water into muscle, so hydration matters a bit more."
        : phase === "recovery" || phase === "transition"
          ? "Off-block: no need to cycle off. If you do pause, stores wash out over ~4–6 weeks — restart 3–4 weeks before the next hard block."
          : "Training block: the maintenance dose quietly supports strength and sprint work — nothing to change.";
  return {
    key: "creatine",
    title: "Creatine — maintenance",
    status: "saturated",
    statusCls: "good",
    lines: [
      "You're consistent — stores are saturated. 3–5 g/day holds them; timing is flexible.",
      phaseLine,
    ],
  };
}

/** Beta-alanine coaching — chronic supplement, phase-aware framing. */
function betaAlanineEducation(
  usage: SuppInsight | undefined,
  phase: string,
): EducationCard {
  const nearComp = phase === "taper" || phase === "competition";
  if (!usage || usage.totalDaysInWindow === 0) {
    return {
      key: "beta-alanine",
      title: "Beta-alanine — need it or not?",
      status: "optional",
      statusCls: "neutral",
      lines: [
        "It buffers repeated 1–4 min high-intensity efforts. Flag football lives on shorter bursts — creatine, sleep and fueling move the needle more; treat beta-alanine as a later add-on.",
        "If you do start: 3.2–4.8 g/day split into 2–3 smaller doses, every day for 4+ weeks — it's a chronic builder, not a game-day boost.",
      ],
    };
  }
  if (usage.lapsed) {
    return {
      key: "beta-alanine",
      title: "Beta-alanine — lapsed",
      status: "lapsed",
      statusCls: "warn",
      lines: [
        "Muscle carnosine fades slowly (~2–3 months) — resume daily dosing to hold the benefit, no re-loading needed.",
      ],
    };
  }
  return {
    key: "beta-alanine",
    title: "Beta-alanine — keep it daily",
    status: "on plan",
    statusCls: "good",
    lines: [
      "3.2–4.8 g/day split into 2–3 smaller doses (the tingle is harmless paresthesia; smaller doses avoid it). It needs 4+ weeks of daily use to build muscle carnosine.",
      nearComp
        ? "Tournament week: keep the daily dose — consistency is simpler than stopping, and carnosine only washes out over ~9 weeks anyway."
        : "Take it with meals if the tingle bothers you.",
    ],
  };
}

// The caffeine⇄sleep DECISION (per-kg dose + whether a dose lands too close to bed)
// is owned by ONE place: the server guardrail utils/nutrition-protocols.js
// caffeineSleepGuardrail (GET /api/supplements/caffeine-timing). The client used to
// carry its own divergent heuristic (fixed 3 mg/kg, 8 h cutoff) — retired in favour
// of calling the endpoint so the numbers can never drift from Merlin + the engine.
const CAFFEINE_LEAD_MINUTES = "45–60"; // display only; server uses ~1 h pre-game
const ASSUMED_BEDTIME_HOUR = 23; // no per-athlete bedtime setting exists yet
const FALLBACK_BODYWEIGHT_KG = 80;

/** Server caffeine⇄sleep guardrail response (GET /api/supplements/caffeine-timing). */
interface CaffeineGuard {
  recommend: boolean;
  doseMgLow: number;
  doseMgHigh: number;
  takeAtHour: number;
  hoursBeforeBed: number;
  protectsSleep: boolean;
  guidance: string;
  warning: string | null;
}

/** Server batch-testing / contamination-risk response (GET /api/supplements/safety). */
interface SupplementSafety {
  imperative: string;
  stack: {
    name: string;
    risk: "high" | "moderate" | "low";
    batchTestedRequired: boolean;
    note: string;
  }[];
}

/**
 * Supplements — the dedicated stack/log screen. Ported 1:1 from
 * redesign/ground-zero/02-hifi/supplements.html. Today's toggles upsert via
 * POST /api/supplements (the daily log); adherence is computed from the real
 * last-7-days logs (GET /api/supplements/recent). Supplements are engine CONTEXT,
 * not an ACWR term — the caffeine note states the honesty rule.
 */
@Component({
  selector: "app-supplements",
  imports: [TopbarComponent, LucideAngularModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./supplements.component.html",
})
export class SupplementsComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly schedule = inject(ScheduleService);
  private readonly supabase = inject(SupabaseService);
  private readonly eventGames = inject(EventGamesService);
  private readonly destroyRef = inject(DestroyRef);

  // --- V2.1 caffeine timing (game-day only) ---
  readonly nextEvent = this.schedule.nextEvent;
  readonly isGameDay = computed(
    () => this.schedule.currentPhase() === "competition",
  );

  private readBodyweight(): number {
    // Mirrors PeriodizationService's private readBodyweight (see also
    // tournament-plan.service.ts) — no dedicated profile signal exists yet.
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

  readonly leadMinutes = CAFFEINE_LEAD_MINUTES;

  // Server-owned caffeine⇄sleep guardrails: one keyed on the FIRST game (the
  // pre-game dose) and one on the LAST game (the binding sleep constraint — the
  // latest caffeine opportunity vs bedtime). Populated by the effect below.
  private readonly caffeineGuard = signal<CaffeineGuard | null>(null);
  private readonly caffeineTopUp = signal<CaffeineGuard | null>(null);
  private lastCaffeineKey = "";

  /** Pre-game dose + timing + the last-game top-up sleep guard, all from the server. */
  readonly caffeineTiming = computed(() => {
    if (!this.isGameDay()) return null;
    const guard = this.caffeineGuard();
    if (!guard) return null; // still loading / no schedule
    const games = this.eventGames.sortedGames();
    const firstKickoff =
      games.length > 0 ? games[0].kickoffTime.slice(0, 5) : null;
    const topUp = this.caffeineTopUp() ?? guard;
    return {
      recommend: guard.recommend,
      doseLow: guard.doseMgLow,
      doseHigh: guard.doseMgHigh,
      guidance: guard.guidance,
      leadMinutes: CAFFEINE_LEAD_MINUTES,
      firstKickoff,
      topUpWarning: topUp && !topUp.recommend ? topUp.warning : null,
      multiGame: games.length > 1,
    };
  });

  private fetchCaffeineGuard(
    weightKg: number,
    gameStartHour: number,
    target: typeof this.caffeineGuard,
  ): void {
    const url =
      `/api/supplements/caffeine-timing?weightKg=${weightKg}` +
      `&gameStartHour=${gameStartHour}&bedtimeHour=${ASSUMED_BEDTIME_HOUR}`;
    this.api
      .get<CaffeineGuard>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => target.set(res?.data ?? null),
        error: (e) => this.logger.error("caffeine_timing_failed", e),
      });
  }

  readonly creatine = signal(true);
  readonly caffeine = signal(true);
  readonly beta = signal(false);

  /** creatine-taken days in the last 7 (real adherence); null until loaded. */
  readonly creatineDays = signal<number | null>(null);

  // --- behaviour insights (lapse nudges + usage-driven coaching) ---
  readonly insights = signal<SuppInsight[]>([]);
  readonly nudges = signal<SuppNudge[]>([]);

  // --- batch-testing / contamination-risk safety (GET /api/supplements/safety) ---
  readonly safety = signal<SupplementSafety | null>(null);

  /** Usage- and phase-aware coaching cards (creatine + beta-alanine). */
  readonly education = computed<EducationCard[]>(() => {
    const phase = this.schedule.currentPhase();
    const byName = new Map(this.insights().map((i) => [i.supplement, i]));
    return [
      creatineEducation(byName.get("creatine"), phase),
      betaAlanineEducation(byName.get("beta-alanine"), phase),
    ];
  });

  // add-to-stack inline form
  readonly adding = signal(false);
  readonly newName = signal("");
  readonly newDose = signal("");
  readonly added = signal<string[]>([]);

  saveSupplement(): void {
    const name = this.newName().trim();
    if (!name) return;
    const dosage = this.newDose().trim();
    this.api
      .post("/api/supplements/stack", {
        name,
        dosage: dosage || null,
        active: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.added.update((a) => [...a, name]);
          this.newName.set("");
          this.newDose.set("");
          this.adding.set(false);
        },
        error: (e) => this.logger.error("supplement_stack_failed", e),
      });
  }

  constructor() {
    // Load the next event's per-game kickoff times (if the coach entered
    // Tournament Mode data) so the caffeine top-up guard can see the last
    // game's finish time instead of only the day-level event.
    effect(() => {
      const ev = this.nextEvent();
      if (ev?.id) this.eventGames.load(ev.id);
    });

    // Single-source caffeine⇄sleep: on a game day, once the per-game kickoffs are
    // known, ask the SERVER guardrail for the dose (first game) and the top-up
    // sleep decision (last game). Idempotent — only re-fetches when the inputs move.
    effect(() => {
      if (!this.isGameDay()) {
        this.caffeineGuard.set(null);
        this.caffeineTopUp.set(null);
        return;
      }
      const games = this.eventGames.sortedGames();
      if (games.length === 0) return;
      const hourOf = (t: string): number => {
        const [h, m] = t.split(":").map(Number);
        return h + (m || 0) / 60;
      };
      const weightKg = this.readBodyweight();
      const firstHour = hourOf(games[0].kickoffTime);
      const lastHour = hourOf(games[games.length - 1].kickoffTime);
      const key = `${weightKg}|${firstHour}|${lastHour}`;
      if (key === this.lastCaffeineKey) return;
      this.lastCaffeineKey = key;
      this.fetchCaffeineGuard(weightKg, firstHour, this.caffeineGuard);
      if (lastHour !== firstHour) {
        this.fetchCaffeineGuard(weightKg, lastHour, this.caffeineTopUp);
      } else {
        this.caffeineTopUp.set(null);
      }
    });

    // Batch-testing / contamination-risk for the athlete's stack (anti-doping).
    this.api
      .get<SupplementSafety>("/api/supplements/safety")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.safety.set(res?.data ?? null),
        error: (e) => this.logger.error("supplement_safety_failed", e),
      });

    this.api
      .get<{ logs?: SuppLog[] }>("/api/supplements/recent")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const logs = res?.data?.logs ?? [];
          const days = new Set(
            logs
              .filter((l) => l.taken && /creatine/i.test(l.supplement_name ?? ""))
              .map((l) => l.date),
          );
          this.creatineDays.set(days.size);

          // Reflect today's ACTUAL logged state instead of fabricated ON/ON/OFF —
          // re-toggling otherwise overwrites the real daily log with literals.
          const todayKey = new Date().toISOString().slice(0, 10);
          const takenToday = (re: RegExp): boolean =>
            logs.some(
              (l) =>
                l.date === todayKey &&
                !!l.taken &&
                re.test(l.supplement_name ?? ""),
            );
          this.creatine.set(takenToday(/creatine/i));
          this.caffeine.set(takenToday(/caffeine/i));
          this.beta.set(takenToday(/beta/i));
        },
        error: (e) => this.logger.error("supplements_recent_failed", e),
      });

    // Behaviour insights: lapse detection ("stock ran empty?") + the usage
    // stats the coaching cards render from. The server also drops the deduped
    // in-app notification when a lapse is detected.
    this.api
      .get<{
        insights?: SuppInsight[];
        nudges?: SuppNudge[];
      }>("/api/supplements/insights")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.insights.set(res?.data?.insights ?? []);
          this.nudges.set(res?.data?.nudges ?? []);
        },
        error: (e) => this.logger.error("supplement_insights_failed", e),
      });
  }

  toggle(which: "creatine" | "caffeine" | "beta"): void {
    const sig = {
      creatine: this.creatine,
      caffeine: this.caffeine,
      beta: this.beta,
    }[which];
    const prev = sig();
    sig.set(!prev);
    this.api
      .post("/api/supplements", {
        supplements: [
          { name: "Creatine", taken: this.creatine(), dosage: "5 g" },
          {
            name: "Caffeine",
            taken: this.caffeine(),
            dosage: "200 mg",
            timeOfDay: "pre-session",
          },
          { name: "Beta-alanine", taken: this.beta(), dosage: "4 g" },
        ],
      })
      // Revert the optimistic flip on failure (don't misrepresent the logged state).
      .subscribe({
        error: (e) => {
          sig.set(prev);
          this.logger.error("supplement_log_failed", e);
        },
      });
  }
}
