import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "../shared/avatar.component";
import { YtVideoComponent } from "../shared/yt-video.component";
import { SkeletonComponent } from "../shared/skeleton.component";
import { QbArmCareCardComponent } from "../shared/qb-arm-care-card.component";
import { SESSION_VIDEO_ID } from "../core/config/session-video.config";

import { PeriodizationService } from "../core/services/periodization.service";
import { ProtocolService } from "../core/services/protocol.service";
import { ProtocolExercise } from "../core/models/protocol.models";
import { ScheduleService } from "../core/services/schedule.service";
import { ApiService, API_ENDPOINTS } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { TrainingVideoService } from "../core/services/training-video.service";
import { DailyPrescription } from "../core/models/prescription.models";

interface WeekRow {
  day: string;
  label: string;
  isGame: boolean;
  rpe: number | null;
}

/**
 * Training — today's session + week view. Ported 1:1 from
 * redesign/ground-zero/02-hifi/training.html. The session hero is the same
 * server-canonical prescription as Today; "This week" comes from
 * PeriodizationService.weekAhead(); completing the session logs the ACTUAL RPE +
 * duration to POST /api/training/complete (the ACWR feed) — never re-derived.
 */
@Component({
  selector: "app-training",
  standalone: true,
  imports: [
    AvatarComponent,
    YtVideoComponent,
    SkeletonComponent,
    QbArmCareCardComponent,
    RouterLink,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./training.component.html",
  styles: [
    `
      .tt-tabs { display: flex; gap: var(--s-4); border-bottom: 1px solid var(--border-soft); padding-bottom: var(--s-2); }
      .tt-tab { background: none; border: 0; cursor: pointer; padding: 0 0 var(--s-2);
        color: var(--text-faint); font-weight: var(--fw-semi); font-size: var(--fs-sm); font-family: var(--font-body); }
      .tt-tab.on { color: var(--text-strong); border-bottom: 2px solid var(--accent); }
      .tt-tab:focus-visible { outline: none; box-shadow: var(--focus); border-radius: 4px; }

      /* block-card — adapted from the redesign mockup, mapped to app tokens.
         Mobile: single column; >=768px: two-up grid. */
      .bc-list { display: grid; gap: var(--s-3); }
      @media (min-width: 768px) { .bc-list { grid-template-columns: 1fr 1fr; } }
      .bc { border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); padding: var(--s-3); }
      .bc__head { display: flex; align-items: center; gap: var(--s-2); }
      .bc__idx { width: 22px; height: 22px; border-radius: 999px; background: var(--bg); color: var(--text-muted);
        display: grid; place-items: center; font-size: var(--fs-xs); font-weight: var(--fw-bold); flex: 0 0 auto; }
      .bc__idx.done { background: var(--accent-soft); color: var(--accent); }
      .bc__title { font-weight: var(--fw-semi); flex: 1 1 auto; }
      .bc__meta { color: var(--text-faint); font-size: var(--fs-xs); margin-top: var(--s-1); }
      .bc__bar { height: 4px; border-radius: 999px; background: var(--border-soft); margin-top: var(--s-2); overflow: hidden; }
      .bc__bar > i { display: block; height: 100%; background: var(--accent); border-radius: 999px; transition: width var(--motion, .2s); }
      .bc__ex { margin: var(--s-2) 0 0; padding-left: var(--s-4); }
      .bc__ex li { font-size: var(--fs-sm); margin: 2px 0; }
      .bc__ex small { color: var(--text-faint); }
      .bc__ex li b { font-weight: var(--fw-semi); }
      /* The how-to text always renders so the movement is clear even when the
         video fails to load (YouTube 504 / offline) — see yt-video fallback. */
      .ex-how { color: var(--text-muted); font-size: var(--fs-sm); line-height: var(--lh-body); margin: 2px 0 0; }
      .ex-feel { color: var(--accent); font-size: var(--fs-xs); display: flex; align-items: center; gap: 4px; margin: 2px 0 var(--s-2); }
      .ex-feel svg.lucide { width: 13px; height: 13px; }
    `,
  ],
})
export class TrainingComponent {
  private readonly periodization = inject(PeriodizationService);
  /** Exercise-realization layer, composed under today's intent. */
  readonly protocol = inject(ProtocolService);
  private readonly schedule = inject(ScheduleService);
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly videoSvc = inject(TrainingVideoService);

  private prefilledLog = false;

  /** Upcoming events (the spine) for the Schedule tab. */
  readonly upcoming = this.schedule.upcoming;
  daysTo(iso: string): number {
    return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 864e5));
  }

  readonly tabs = ["Today", "Schedule", "Programs", "Library"] as const;
  readonly tab = signal<(typeof this.tabs)[number]>("Today");

  readonly rx = this.periodization.today;
  /** Session hero gates on the schedule snapshot — skeleton until it resolves. */
  readonly loading = this.schedule.loading;

  /** Library + session video. */
  readonly videos = this.videoSvc.videos;
  readonly categories = this.videoSvc.categories;
  /** Session video = a library clip matching today's intent, else the placeholder. */
  readonly sessionVideoId = computed(
    () => this.videoSvc.forIntent(this.rx()?.intent)?.youtubeId ?? SESSION_VIDEO_ID,
  );

  /** Real duration of the matched library clip; "" when none matched (no fake time). */
  readonly sessionVideoDuration = computed(
    () => this.videoSvc.forIntent(this.rx()?.intent)?.duration ?? "",
  );

  constructor() {
    if (!this.videoSvc.loaded()) void this.videoSvc.load();
    // Default the session-log RPE/duration to today's PRESCRIBED values once the
    // prescription resolves, instead of the fabricated 5 / 58. The athlete adjusts
    // to actuals before completing; this feeds ACWR (load = rpe × duration).
    effect(() => {
      if (this.prefilledLog) return;
      const rx = this.rx();
      if (!rx) return;
      this.prefilledLog = true;
      if (rx.targetRpe != null) this.actualRpe.set(rx.targetRpe);
      if (rx.targetMinutes != null) this.duration.set(rx.targetMinutes);
    });
    // COMPOSE: once today's intent resolves, ask daily-protocol to realize the
    // EXERCISES for that intent (position from the prescription, else profile).
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
        position: rx.positionEmphasis?.position ?? this.periodization.position(),
        seasonPhase: rx.seasonPhase,
        weatherSuitability: w?.suitability ?? null,
        weatherTempC: w?.tempC ?? null,
      });
    });
  }

  private protocolTriggered = false;

  /** Status chip for a block, from its completion progress. */
  blockStatus(b: { progressPercent?: number }): { label: string; cls: string } {
    const p = b.progressPercent ?? 0;
    if (p >= 100) return { label: "Done", cls: "good" };
    if (p > 0) return { label: "Active", cls: "caution" };
    return { label: "Up next", cls: "" };
  }

  /** Human dose for a realized exercise (sets×reps / hold / duration). */
  exDose(ex: ProtocolExercise): string {
    if (ex.prescribedSets && ex.prescribedReps) {
      return `${ex.prescribedSets}×${ex.prescribedReps}`;
    }
    if (ex.prescribedHoldSeconds) {
      const sets = ex.prescribedSets ? `${ex.prescribedSets}×` : "";
      return `${sets}${ex.prescribedHoldSeconds}s hold`;
    }
    if (ex.prescribedDurationSeconds) {
      return `${Math.round(ex.prescribedDurationSeconds / 60)} min`;
    }
    return "";
  }

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

  readonly weather = computed(() => this.rx()?.weatherAdjustment ?? null);

  readonly heroBand = computed<{ label: string; cls: string } | null>(() => {
    const rx = this.rx();
    if (!rx) return null;
    if (rx.weatherAdjustment?.applied) return { label: "weather-adjusted", cls: "caution" };
    if (rx.recoveryEmphasis === "critical") return { label: "recover", cls: "danger" };
    if (rx.intent === "competition") return { label: "game day", cls: "info" };
    return { label: "today", cls: "good" };
  });

  /** Session blocks around the prescription — each a playable library demo
   *  (warm-up → warmup category, main → today's intent, cooldown → recovery). */
  readonly blocks = computed(() => {
    const rx = this.rx();
    return [
      { title: "Warm-up — RAMP", meta: "10 min · no max effort", video: this.videoSvc.first("warmup") },
      {
        title: rx?.intentLabel ?? "Main block",
        meta: `RPE ${rx?.targetRpe ?? "—"} · ${rx?.targetMinutes ?? "—"} min`,
        video: this.videoSvc.forIntent(rx?.intent),
      },
      { title: "Cooldown & mobility", meta: "easy", video: this.videoSvc.first("recovery") },
    ];
  });

  // --- actual session log ---
  readonly actualRpe = signal(5);
  readonly duration = signal(58);
  readonly completing = signal(false);
  readonly completed = signal(false);
  readonly completeError = signal<string | null>(null);

  completeSession(): void {
    if (this.completing()) return;
    this.completing.set(true);
    this.completeError.set(null);
    // Log a COMPLETED session in one call: a training-log payload (date+type+
    // duration) routes to createTrainingLogSession → a completed training_sessions
    // row. compute-acwr derives load = rpe × duration when workload is null, so this
    // feeds ACWR. (POST /api/training/complete needs a pre-existing sessionId.)
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

  // --- this week (engine) ---
  readonly week = computed<WeekRow[]>(() =>
    this.periodization.weekAhead().map((p: DailyPrescription) => ({
      day: new Date(`${p.date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short" }),
      label: p.intentLabel,
      isGame: p.intent === "competition",
      rpe: p.targetRpe,
    })),
  );
}
