import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { DatePipe } from "@angular/common";
import { LucideAngularModule } from "lucide-angular";
import { YtVideoComponent } from "../shared/yt-video.component";
import { QbArmCareCardComponent } from "../shared/qb-arm-care-card.component";

import { PeriodizationService } from "../core/services/periodization.service";
import { ProtocolService } from "../core/services/protocol.service";
import {
  ProtocolBlock,
  ProtocolExercise,
} from "../core/models/protocol.models";
import { ScheduleService } from "../core/services/schedule.service";
import { ApiService, API_ENDPOINTS } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { TrainingVideoService } from "../core/services/training-video.service";
import { DailyPrescription } from "../core/models/prescription.models";

interface WeekRow {
  day: string;
  label: string;
  isGame: boolean;
  isRest: boolean;
  isTravel: boolean;
  rpe: number | null;
  secondSession?: { label: string; rpe: number } | null;
}

/**
 * Training — the session runner (redesign 2026-07-10). SERVER-CANONICAL: the
 * prescription, the realized exercise blocks (daily-protocol), and the week view
 * come from the engine services and are rendered, never re-derived. Ticking an
 * exercise is local runner state (drives the progress + auto-advance); completing
 * logs the ACTUAL RPE × duration to the training log (the ACWR feed).
 */
@Component({
  selector: "app-training",
  imports: [
    RouterLink,
    DatePipe,
    LucideAngularModule,
    YtVideoComponent,
    QbArmCareCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./training.component.html",
  styleUrl: "./training.component.scss",
})
export class TrainingComponent {
  private readonly periodization = inject(PeriodizationService);
  readonly protocol = inject(ProtocolService);
  private readonly schedule = inject(ScheduleService);
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly videoSvc = inject(TrainingVideoService);

  private prefilledLog = false;
  private protocolTriggered = false;

  // ── tabs ──────────────────────────────────────────────────────────────────
  readonly tabs = ["Today", "Schedule", "Programs", "Library"] as const;
  readonly tab = signal<(typeof this.tabs)[number]>("Today");

  // ── prescription / session hero ─────────────────────────────────────────────
  readonly rx = this.periodization.today;
  readonly loading = this.schedule.loading;

  readonly seasonLabel = computed(() => {
    const s = this.rx()?.seasonPhase;
    const map: Record<string, string> = {
      offseason: "Off-season",
      preseason: "Pre-season",
      inseason: "In-season",
      transition: "Transition",
    };
    return s ? map[s] : "Training";
  });

  readonly heroBand = computed<{ label: string; cls: string } | null>(() => {
    const rx = this.rx();
    if (!rx) return null;
    if (rx.weatherAdjustment?.applied)
      return { label: "weather-adjusted", cls: "warn" };
    if (rx.intent === "competition") return { label: "Game day", cls: "warn" };
    if (rx.intent === "travel") return { label: "Travel day", cls: "ghost" };
    if (rx.recoveryEmphasis === "critical" || rx.recoveryEmphasis === "high")
      return { label: "Recovery day", cls: "warn" };
    return { label: "Training day", cls: "ok" };
  });

  readonly dateLabel = computed(() =>
    new Date().toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
  );
  readonly rpeLabel = computed(() => {
    const r = this.rx()?.targetRpe;
    return r == null ? "—" : String(r);
  });
  readonly fluidTarget = computed(
    () => this.rx()?.nutrition?.hydrationL ?? 3.2,
  );

  // ── conditions (weather) ────────────────────────────────────────────────────
  readonly weatherRaw = this.periodization.weather;
  readonly weatherIcon = computed(() => {
    const c = (this.weatherRaw()?.condition ?? "").toLowerCase();
    if (/rain|shower|drizzle|storm|thunder|snow/.test(c)) return "cloud-rain";
    if (/cloud|overcast|fog/.test(c)) return "cloud";
    return "sun";
  });
  readonly condAdvice = computed(() => {
    const w = this.weatherRaw();
    if (!w) return "Conditions load with your location.";
    const adj = this.rx()?.weatherAdjustment;
    if (adj?.applied && adj.reason) return adj.reason;
    if (w.suitability === "poor")
      return "Rough conditions — have the indoor variant ready; mobility & breathing blocks are weather-proof.";
    if (w.suitability === "fair")
      return "Workable conditions — keep effort honest and hydrate to plan.";
    return "Good conditions at session time — standard fluid target applies.";
  });

  // ── session video (hero) ────────────────────────────────────────────────────
  readonly sessionVideoId = computed(
    () => this.videoSvc.forIntent(this.rx()?.intent)?.youtubeId ?? null,
  );

  constructor() {
    if (!this.videoSvc.loaded()) void this.videoSvc.load();
    // Prefill the session-log RPE/duration to today's PRESCRIBED values.
    effect(() => {
      if (this.prefilledLog) return;
      const rx = this.rx();
      if (!rx) return;
      this.prefilledLog = true;
      if (rx.targetRpe != null) this.actualRpe.set(rx.targetRpe);
      if (rx.targetMinutes != null) this.duration.set(rx.targetMinutes);
    });
    // COMPOSE: realize the exercises for today's intent.
    effect(() => {
      if (this.protocolTriggered) return;
      const rx = this.rx();
      if (!rx) return;
      this.protocolTriggered = true;
      const w = this.periodization.weather();
      this.protocol.generateFor({
        date: rx.date,
        intent: rx.intent,
        intentLabel: rx.intentLabel,
        position:
          rx.positionEmphasis?.position ?? this.periodization.position(),
        seasonPhase: rx.seasonPhase,
        weatherSuitability: w?.suitability ?? null,
        weatherTempC: w?.tempC ?? null,
      });
    });
    // Open the first incomplete block whenever the block set (re)loads.
    effect(() => {
      const n = this.blocks().length;
      if (n && this.openBlock() >= n) this.openBlock.set(0);
    });
  }

  // ── session blocks (realized protocol) ──────────────────────────────────────
  readonly blocks = this.protocol.blocks;

  blockMeta(b: ProtocolBlock): string {
    const n = b.exercises?.length ?? 0;
    const min = b.estimatedDurationMinutes;
    return `${n} ex${min ? ` · ~${min} min` : ""}`;
  }
  exDose(ex: ProtocolExercise): string {
    if (ex.prescribedSets && ex.prescribedReps)
      return `${ex.prescribedSets}×${ex.prescribedReps}`;
    if (ex.prescribedHoldSeconds) {
      const sets = ex.prescribedSets ? `${ex.prescribedSets}×` : "";
      return `${sets}${ex.prescribedHoldSeconds}s hold`;
    }
    if (ex.prescribedDurationSeconds)
      return `${Math.round(ex.prescribedDurationSeconds / 60)} min`;
    return "";
  }

  // ── runner state: checks / accordion / expand ───────────────────────────────
  private readonly checked = signal<Set<string>>(new Set());
  private readonly expandedSet = signal<Set<string>>(new Set());
  readonly openBlock = signal(0);

  private key(bi: number, ei: number): string {
    return `${bi}:${ei}`;
  }
  isChecked(bi: number, ei: number): boolean {
    return this.checked().has(this.key(bi, ei));
  }
  isExpanded(bi: number, ei: number): boolean {
    return this.expandedSet().has(this.key(bi, ei));
  }
  isOpen(bi: number): boolean {
    return this.openBlock() === bi;
  }

  toggleBlock(bi: number): void {
    this.openBlock.set(this.openBlock() === bi ? -1 : bi);
  }
  collapseAll(): void {
    this.openBlock.set(-1);
  }
  toggleExpand(bi: number, ei: number): void {
    this.expandedSet.update((s) => {
      const next = new Set(s);
      const k = this.key(bi, ei);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  blockDoneCount(bi: number): number {
    const ex = this.blocks()[bi]?.exercises ?? [];
    return ex.reduce((n, _e, ei) => n + (this.isChecked(bi, ei) ? 1 : 0), 0);
  }
  blockIsDone(bi: number): boolean {
    const total = this.blocks()[bi]?.exercises?.length ?? 0;
    return total > 0 && this.blockDoneCount(bi) === total;
  }
  /** The active block = the first with unchecked exercises. */
  readonly activeBlock = computed(() => {
    const blocks = this.blocks();
    for (let bi = 0; bi < blocks.length; bi++) {
      const total = blocks[bi].exercises?.length ?? 0;
      if (this.blockDoneCount(bi) < total) return bi;
    }
    return -1;
  });

  toggleCheck(bi: number, ei: number): void {
    this.checked.update((s) => {
      const next = new Set(s);
      const k = this.key(bi, ei);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
    // Auto-advance: when a block completes, open the next incomplete one.
    if (this.blockIsDone(bi)) {
      const next = this.activeBlock();
      if (next !== -1) this.openBlock.set(next);
    }
  }

  readonly totalExercises = computed(() =>
    this.blocks().reduce((n, b) => n + (b.exercises?.length ?? 0), 0),
  );
  readonly doneExercises = computed(() => {
    const blocks = this.blocks();
    let n = 0;
    for (let bi = 0; bi < blocks.length; bi++) n += this.blockDoneCount(bi);
    return n;
  });
  readonly sessionPct = computed(() => {
    const t = this.totalExercises();
    return t ? Math.round((this.doneExercises() / t) * 100) : 0;
  });

  // ── video modal ──────────────────────────────────────────────────────────────
  readonly videoModal = signal<{ name: string; videoId: string } | null>(null);
  openVideo(ex: ProtocolExercise): void {
    const id = ex.exercise?.videoId;
    if (!id) return;
    this.videoModal.set({ name: ex.exercise?.name ?? "Exercise", videoId: id });
  }
  closeVideo(): void {
    this.videoModal.set(null);
  }

  // ── completion log (RPE × duration → ACWR) ──────────────────────────────────
  readonly actualRpe = signal(5);
  readonly duration = signal(58);
  readonly completing = signal(false);
  readonly completed = signal(false);
  readonly completeError = signal<string | null>(null);

  private clamp(v: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, v));
  }
  rpeStep(delta: number): void {
    this.actualRpe.set(this.clamp(this.actualRpe() + delta, 0, 10));
  }
  durStep(delta: number): void {
    this.duration.set(this.clamp(this.duration() + delta, 0, 240));
  }

  completeSession(): void {
    if (this.completing() || this.completed()) return;
    this.completing.set(true);
    this.completeError.set(null);
    this.api
      .post(API_ENDPOINTS.training.createSession, {
        date: new Date().toISOString().split("T")[0],
        sessionType: this.rx()?.intent ?? "training",
        durationMinutes: this.duration(),
        rpe: this.actualRpe(),
      })
      .subscribe({
        next: () => {
          this.completing.set(false);
          this.completed.set(true);
        },
        error: (err) => {
          this.completing.set(false);
          this.completeError.set("Could not log session");
          this.logger.error("training_complete_failed", err);
        },
      });
  }

  // ── schedule tab / this week ─────────────────────────────────────────────────
  readonly upcoming = this.schedule.upcoming;
  daysTo(iso: string): number {
    return Math.max(
      0,
      Math.round((new Date(iso).getTime() - Date.now()) / 864e5),
    );
  }

  /** Load band for a week row, from its prescribed RPE. */
  weekLoad(r: WeekRow): string {
    if (r.isRest) return "rest";
    if (r.isGame) return "hard";
    const rpe = r.rpe ?? 0;
    return rpe >= 7 ? "hard" : rpe >= 4 ? "mod" : "easy";
  }
  weekPill(r: WeekRow): string {
    if (r.isRest) return "Rest";
    return r.rpe != null ? `RPE ${r.rpe}` : r.label;
  }

  readonly week = computed<WeekRow[]>(() =>
    this.periodization.weekAhead().map((p: DailyPrescription) => ({
      day: new Date(`${p.date}T00:00:00`).toLocaleDateString("en-GB", {
        weekday: "short",
      }),
      label: p.intentLabel,
      isGame: p.intent === "competition",
      isRest: p.intent === "rest",
      isTravel: p.intent === "travel",
      rpe: p.targetRpe,
      secondSession: p.secondSession
        ? { label: p.secondSession.intentLabel, rpe: p.secondSession.targetRpe }
        : null,
    })),
  );

  /** Today's row is the first in weekAhead. */
  readonly todayIndex = 0;

  // Library tab
  readonly videos = this.videoSvc.videos;
  readonly categories = this.videoSvc.categories;
}
