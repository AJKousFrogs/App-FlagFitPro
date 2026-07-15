import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { NgOptimizedImage } from "@angular/common";
import { TopbarComponent } from "../shared/topbar.component";
import { ReadinessTrendComponent } from "../shared/readiness-trend.component";
import {
  WellnessBarsComponent,
  type WellnessRow,
} from "../shared/perf-viz";

/** Shape of a row from GET /api/supplements/recent. */
interface SuppLog {
  supplement_name?: string;
  taken?: boolean;
  date?: string;
}

import { WellnessService } from "../core/services/wellness.service";
import { ReadinessService } from "../core/services/readiness.service";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { InjuryService, InjurySeverity } from "../core/services/injury.service";
import { EventTravelService } from "../core/services/event-travel.service";
import { WELLNESS } from "../core/constants/wellness.constants";

/**
 * Wellness — the daily check-in. Ported 1:1 from
 * redesign/ground-zero/02-hifi/wellness.html. The sliders submit to the kept
 * WellnessService (RPC upsert_wellness_checkin), the supplement toggles upsert
 * via POST /api/supplements (the daily log we built), hydration via
 * /api/hydration/log. Readiness is read server-canonical — never re-derived.
 */
@Component({
  selector: "app-wellness",
  imports: [
    NgOptimizedImage,
    TopbarComponent,
    ReadinessTrendComponent,
    WellnessBarsComponent,
    RouterLink,
    LucideAngularModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./wellness.component.html",
  styles: [
    `
      .lbl {
        font-size: var(--fs-sm);
        color: var(--text-muted);
        font-weight: var(--fw-semi);
      }
      .chiprow {
        display: flex;
        flex-wrap: wrap;
        gap: var(--s-2);
      }
    `,
  ],
})
export class WellnessComponent {
  private readonly wellnessSvc = inject(WellnessService);
  private readonly readinessSvc = inject(ReadinessService);
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly injurySvc = inject(InjuryService);
  private readonly eventTravel = inject(EventTravelService);

  // --- self-reported tightness (drives injury precedence in the plan) ---
  readonly tightnessRegions = [
    "Achilles",
    "Calf",
    "Hamstring",
    "Quad",
    "Knee",
    "Ankle",
    "Hip",
    "Groin",
    "Lower back",
    "Shoulder",
  ];
  readonly tightRegion = signal<string | null>(null);
  readonly tightSeverity = signal<InjurySeverity>("minor");
  readonly reportingTight = signal(false);
  readonly tightMsg = signal<string | null>(null);
  readonly activeInjuries = this.injurySvc.active;

  /**
   * Wellness items for the perf-viz bars: today's values on a 0–100 scale
   * (the check-in is 1–10 → ×10) against the athlete's own trailing average
   * (a tick). Soreness + stress are higher-is-worse (warm fill, inverted
   * delta). Null items are skipped — never a fabricated bar (Law #7).
   */
  readonly wellnessBarRows = computed<WellnessRow[]>(() => {
    const latest = this.wellnessSvc.latestWellnessEntry();
    const avg = this.wellnessSvc.averages();
    if (!latest) return [];
    const scale = (v: number | null | undefined) =>
      typeof v === "number" && Number.isFinite(v)
        ? Math.min(100, Math.max(0, v * 10))
        : null;
    const rows: WellnessRow[] = [];
    const push = (
      label: string,
      value: number | null | undefined,
      baseline: number | null | undefined,
      invert = false,
    ) => {
      const v = scale(value);
      if (v === null) return;
      rows.push({ label, value: v, baseline: scale(baseline), invert });
    };
    push("Sleep", latest.sleep, avg?.sleep);
    push("Energy", latest.energy, avg?.energy);
    push("Soreness", latest.soreness, avg?.soreness, true);
    push("Stress", latest.stress, avg?.stress, true);
    return rows;
  });

  setTightSeverity(s: InjurySeverity): void {
    this.tightSeverity.set(s);
  }

  /** Select a region and prefill severity from its active report (so an
   *  untouched resubmit can't downgrade a previously-reported moderate/severe). */
  selectTightRegion(region: string): void {
    this.tightRegion.set(region);
    // They're addressing the high-soreness prompt — retire it so the submit
    // button returns to its normal label.
    this.bodyCheckPrompt.set(false);
    const existing = this.injurySvc
      .active()
      .find((i) => (i.region ?? "").toLowerCase() === region.toLowerCase());
    const sev = existing?.severity;
    this.tightSeverity.set(
      sev === "moderate" || sev === "severe" || sev === "minor" ? sev : "minor",
    );
  }

  async reportTightness(): Promise<void> {
    const region = this.tightRegion();
    if (!region || this.reportingTight()) return;
    this.reportingTight.set(true);
    this.tightMsg.set(null);
    try {
      await this.injurySvc.report(region.toLowerCase(), this.tightSeverity());
      // Recalculate readiness too; the plan (Today) reacts to the injury signal.
      this.readinessSvc.calculateToday().subscribe({ error: () => undefined });
      this.tightMsg.set(`Logged ${region} — today's plan now works around it.`);
      this.tightRegion.set(null);
    } catch (err) {
      this.logger.error("tightness_report_failed", err);
      this.tightMsg.set("Couldn't log that — try again.");
    } finally {
      this.reportingTight.set(false);
    }
  }

  private prefilledCheckin = false;

  constructor() {
    // Prefill the sliders from today's existing daily_wellness_checkin row so the
    // form shows what was actually logged instead of fixed defaults. Without this,
    // reopening Wellness shows 7/7.5/4/6/7/3 and re-submitting (an upsert) would
    // overwrite the real entry with those literals — corrupting readiness/ACWR.
    // WellnessService auto-loads on login; prefill once when today's row appears.
    effect(() => {
      if (this.prefilledCheckin) return;
      const todayKey = new Date().toISOString().slice(0, 10);
      const entry = this.wellnessSvc
        .wellnessData()
        .find((e) => e.date === todayKey);
      if (!entry) return;
      this.prefilledCheckin = true;
      if (entry.sleep != null) this.sleepQuality.set(entry.sleep);
      if (entry.sleepHours != null) this.sleepHours.set(entry.sleepHours);
      if (entry.soreness != null) this.soreness.set(entry.soreness);
      if (entry.energy != null) this.energy.set(entry.energy);
      if (entry.mood != null) this.mood.set(entry.mood);
      if (entry.stress != null) this.stress.set(entry.stress);
      if (entry.travelHours != null) this.travelHours.set(entry.travelHours);
      // Form was already submitted today — lock it so the athlete can't accidentally
      // overwrite their real check-in with stale defaults on a return visit.
      this.submitted.set(true);
    });

    // Reflect today's ACTUAL supplement logs rather than fabricated ON/ON/OFF —
    // otherwise re-toggling overwrites the real log with literals.
    this.api.get<{ logs?: SuppLog[] }>("/api/supplements/recent").subscribe({
      next: (res) => {
        const logs = res?.data?.logs ?? [];
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
      error: (e) => this.logger.error("supplements_recent_load_failed", e),
    });

    // Active injuries/tightness so the form can show what's currently flagged.
    void this.injurySvc.load();

    // Fetch today's actual hydration total so the display doesn't reset to 0 on every visit.
    this.loadTodayHydration();

    // V2.1: a declared travel leg (event-travel.service) covering today lets
    // the check-in SUGGEST a travel-hours value instead of waiting for the
    // athlete to notice and pick a chip — but it never silently sets the
    // signal (that would violate the non-destructive-prefill law); the
    // athlete taps "Apply" explicitly. See docs/v2/V2.1-plan-travel.md.
    void this.eventTravel.load();
  }

  /** Suggested travel-hours from a declared leg — only while the chip is still
   *  at its untouched default (0), so it never overrides a real choice. */
  readonly travelSuggestion = computed(() => {
    if (this.travelHours() !== 0) return null;
    return this.eventTravel.todayTravelHours();
  });

  applyTravelSuggestion(): void {
    const hours = this.travelSuggestion();
    if (hours == null) return;
    // Snap to the nearest declared chip bucket rather than an arbitrary number,
    // so the value stays consistent with what calc-readiness expects.
    const nearest = this.travelOptions.reduce((best, opt) =>
      Math.abs(opt.h - hours) < Math.abs(best.h - hours) ? opt : best,
    );
    this.travelHours.set(nearest.h);
  }

  readonly today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  // --- check-in sliders ---
  readonly sleepQuality = signal(7);
  readonly sleepHours = signal(7.5);
  readonly soreness = signal(4);
  readonly energy = signal(6);
  readonly mood = signal(7);
  readonly stress = signal(3);
  /** Hours of seated travel today (drive/journey). Lowers readiness when high. */
  readonly travelHours = signal(0);
  readonly travelOptions: { label: string; h: number }[] = [
    { label: "None", h: 0 },
    { label: "<3h", h: 2 },
    { label: "3–5h", h: 4 },
    { label: "6h+", h: 6 },
  ];

  // --- weekend games (Monday self-report → drives the week's load via ACWR) ---
  /** Highlight the prompt on Mondays; it stays available any day. */
  readonly isMonday = new Date().getDay() === 1;
  readonly playedGames = signal<boolean | null>(null);
  readonly gameCount = signal(1);
  readonly gameFormats: {
    key: string;
    label: string;
    halves: number;
    min: number;
  }[] = [
    { key: "2x12", label: "2 × 12 min", halves: 2, min: 12 },
    { key: "2x15", label: "2 × 15 min", halves: 2, min: 15 },
    { key: "2x20", label: "2 × 20 min", halves: 2, min: 20 },
  ];
  readonly gameFormat = signal("2x20");
  readonly gamesLogging = signal(false);
  readonly gamesLogged = signal(false);
  readonly gamesMsg = signal<string | null>(null);

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly submitError = signal<string | null>(null);

  /** High soreness with no region flagged → we ask "where?" once before saving.
   *  Law 5a: the slider is an INPUT, not a trigger — so a 9/10 with no body-check
   *  must at least PROMPT one, never silently change (or not change) the plan. */
  readonly bodyCheckPrompt = signal(false);

  /** Scroll the niggles/tightness selector into view so the prompt is actionable. */
  scrollToNiggles(): void {
    document
      .getElementById("niggles")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  submitCheckin(): void {
    if (this.submitting()) return;

    // Soft-gate: high soreness but nothing flagged and no active injury → ask the
    // athlete to point at the sore area first (the niggles selector does the real
    // athlete_injuries write that adapts the plan). One nudge, not a hard block —
    // a second tap ("Log check-in anyway") proceeds.
    const needsBodyCheck =
      this.soreness() >= WELLNESS.HIGH_PAIN_THRESHOLD &&
      !this.tightRegion() &&
      this.activeInjuries().length === 0;
    if (needsBodyCheck && !this.bodyCheckPrompt()) {
      this.bodyCheckPrompt.set(true);
      this.scrollToNiggles();
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);
    this.wellnessSvc
      .logWellness({
        sleep: this.sleepQuality(),
        sleepHours: this.sleepHours(),
        soreness: this.soreness(),
        energy: this.energy(),
        mood: this.mood(),
        stress: this.stress(),
        travelHours: this.travelHours(),
        // Pass selected tightness region so coach-inbox alert includes a body area.
        sorenessAreas: this.tightRegion() ? [this.tightRegion()!] : [],
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          if (res.success) {
            this.submitted.set(true);
            // Recompute readiness server-side from the new check-in, THEN land on
            // Today so it reflects the just-logged session. Navigate even if the
            // recalc fails so the user is never stranded on the check-in screen.
            this.readinessSvc.calculateToday().subscribe({
              next: () => this.goToToday(),
              error: (err) => {
                this.logger.error("readiness_recalc_failed", err);
                this.goToToday();
              },
            });
          } else {
            this.submitError.set(res.error ?? "Could not save check-in");
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set("Could not save check-in");
          this.logger.error("wellness_submit_failed", err);
        },
      });
  }

  private goToToday(): void {
    void this.router.navigate(["/today"]);
  }

  // --- daily supplement log (upsert batch) ---
  readonly creatine = signal(true);
  readonly caffeine = signal(true);
  readonly beta = signal(false);

  toggleSupplement(which: "creatine" | "caffeine" | "beta"): void {
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
      .subscribe({
        // Revert the optimistic flip on failure so the switch never misrepresents
        // what's actually logged (ACWR/coach views read this).
        error: (err) => {
          sig.set(prev);
          this.logger.error("supplement_log_failed", err);
        },
      });
  }

  // --- readiness (server-canonical) ---
  readonly readiness = this.readinessSvc.current;
  readonly readinessPct = computed(() => {
    const s = this.readiness()?.score;
    return typeof s === "number" ? Math.round(s) : null;
  });
  readonly readinessBand = computed<{ label: string; cls: string } | null>(
    () => {
      const pct = this.readinessPct();
      if (pct == null) return null;
      // Band colours MUST match the Today screen's readiness mapping — the same
      // score showed amber (caution) on Today but blue (info) here. Canonical:
      // <55 danger, 55–75 caution, >75 good.
      const cls = pct < 55 ? "danger" : pct <= 75 ? "caution" : "good";
      const word =
        pct < 55 ? "Low — deload" : pct <= 75 ? "Moderate" : "High — push";
      return { label: word, cls };
    },
  );

  // --- hydration quick-add ---
  readonly hydrationMl = signal(0);

  private loadTodayHydration(): void {
    this.api.get<{ logs?: { amount: number }[] }>("/api/hydration").subscribe({
      next: (res) => {
        const total = (res?.data?.logs ?? []).reduce(
          (sum, l) => sum + (l.amount ?? 0),
          0,
        );
        this.hydrationMl.set(total);
      },
      error: (e) => this.logger.error("hydration_today_load_failed", e),
    });
  }

  addHydration(ml: number): void {
    this.hydrationMl.update((v) => v + ml);
    this.api.post("/api/hydration/log", { amount: ml }).subscribe({
      // Roll the optimistic total back if the log didn't persist, so the UI
      // never shows water that isn't actually recorded.
      error: (err) => {
        this.hydrationMl.update((v) => v - ml);
        this.logger.error("hydration_log_failed", err);
      },
    });
  }
  readonly hydrationL = computed(() => (this.hydrationMl() / 1000).toFixed(1));
  logWeekendGames(): void {
    if (this.gamesLogging()) return;
    const fmt = this.gameFormats.find((f) => f.key === this.gameFormat());
    if (!fmt) return;
    this.gamesLogging.set(true);
    this.gamesMsg.set(null);
    this.api
      .post("/api/weekend-games", {
        played: true,
        gameCount: this.gameCount(),
        halves: fmt.halves,
        minutesPerHalf: fmt.min,
      })
      .subscribe({
        next: () => {
          this.gamesLogging.set(false);
          this.gamesLogged.set(true);
          this.gamesMsg.set("Logged — your plan will adjust to the game load.");
          // Recalculate readiness so Today/Training react to the added acute load.
          this.readinessSvc
            .calculateToday()
            .subscribe({ error: () => undefined });
        },
        error: () => {
          this.gamesLogging.set(false);
          this.gamesMsg.set("Couldn't log the game — try again.");
        },
      });
  }

  clearWeekendGames(): void {
    this.playedGames.set(false);
    this.gamesLogged.set(false);
    this.api
      .post("/api/weekend-games", { played: false })
      .subscribe({ error: () => undefined });
  }
}
