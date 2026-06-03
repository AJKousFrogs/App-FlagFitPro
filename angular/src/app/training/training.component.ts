import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "../shared/avatar.component";
import { YtVideoComponent } from "../shared/yt-video.component";
import { SESSION_VIDEO_ID } from "../core/config/session-video.config";

import { PeriodizationService } from "../core/services/periodization.service";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
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
  imports: [AvatarComponent, YtVideoComponent, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./training.component.html",
  styles: [
    `
      .tt-tabs { display: flex; gap: 18px; border-bottom: 1px solid var(--border-soft); padding-bottom: 8px; }
      .tt-tab { background: none; border: 0; cursor: pointer; padding: 0 0 8px;
        color: var(--text-faint); font-weight: 600; font-size: 14px; font-family: var(--font-body); }
      .tt-tab.on { color: var(--text-strong); border-bottom: 2px solid var(--accent); }
      .tt-tab:focus-visible { outline: none; box-shadow: var(--focus); border-radius: 4px; }
    `,
  ],
})
export class TrainingComponent {
  private readonly periodization = inject(PeriodizationService);
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly sessionVideoId = SESSION_VIDEO_ID;
  readonly tabs = ["Today", "Schedule", "Programs", "Library"] as const;
  readonly tab = signal<(typeof this.tabs)[number]>("Today");

  readonly rx = this.periodization.today;

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
    if (rx.weatherAdjustment?.applied) return { label: "weather-adjusted", cls: "caution" };
    if (rx.recoveryEmphasis === "critical") return { label: "recover", cls: "danger" };
    if (rx.intent === "competition") return { label: "game day", cls: "info" };
    return { label: "today", cls: "good" };
  });

  /** Derived session blocks (a structural template around the prescription —
   *  detailed protocol exercises + per-exercise video wire in a later step). */
  readonly blocks = computed(() => {
    const rx = this.rx();
    const main = rx?.intentLabel ?? "Main block";
    return [
      { thumb: "thumb-a", title: "Warm-up — RAMP", meta: "10 min · no max effort", time: "4:10" },
      { thumb: "thumb-b", title: main, meta: `RPE ${rx?.targetRpe ?? "—"} · ${rx?.targetMinutes ?? "—"} min`, time: "6:00" },
      { thumb: "thumb-c", title: "Cooldown & mobility", meta: "easy", time: "8:20" },
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
      .post("/api/training-sessions", {
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
