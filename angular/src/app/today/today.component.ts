import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "../shared/avatar.component";
import { YtVideoComponent } from "../shared/yt-video.component";
import { SkeletonComponent } from "../shared/skeleton.component";
import { SESSION_VIDEO_ID } from "../core/config/session-video.config";

import { PeriodizationService } from "../core/services/periodization.service";
import { ReadinessService } from "../core/services/readiness.service";
import { AcwrService } from "../core/services/acwr.service";
import { ScheduleService } from "../core/services/schedule.service";
import { IdentityService } from "../core/services/identity.service";
import { TrainingVideoService } from "../core/services/training-video.service";
import { RecoveryService } from "../core/services/recovery.service";

/**
 * Today — the answer-first home screen. Ported 1:1 from the approved hi-fi
 * (redesign/ground-zero/02-hifi/today.html), assembled only from the locked
 * component vocabulary. Data is SERVER-CANONICAL: the prescription, readiness
 * and ACWR come from the kept engine services; the UI renders them and never
 * re-derives. Missing data → explicit empty state, never a fake number.
 */
@Component({
  selector: "app-today",
  standalone: true,
  imports: [
    AvatarComponent,
    YtVideoComponent,
    SkeletonComponent,
    RouterLink,
    LucideAngularModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // <iconify-icon> web component (MDI food glyphs)
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./today.component.html",
})
export class TodayComponent {
  private readonly videoSvc = inject(TrainingVideoService);

  /** Session video = a library clip matching today's intent, else the placeholder. */
  readonly sessionVideoId = computed(
    () =>
      this.videoSvc.forIntent(this.rx()?.intent)?.youtubeId ?? SESSION_VIDEO_ID,
  );

  /** Real duration of the matched library clip; "" when none matched (no fake time). */
  readonly sessionVideoDuration = computed(
    () => this.videoSvc.forIntent(this.rx()?.intent)?.duration ?? "",
  );

  constructor() {
    if (!this.videoSvc.loaded()) void this.videoSvc.load();
    // Readiness is server-canonical and was otherwise only set transiently right
    // after a check-in submit — so a fresh load / reload of Today always showed
    // "not logged today". Recompute from the latest check-in on each visit
    // (calc-readiness upserts idempotently on user_id+day).
    this.readinessSvc.calculateToday().subscribe({
      error: () => {
        /* error surfaced via readinessSvc.error signal */
      },
    });
  }
  private readonly periodization = inject(PeriodizationService);
  private readonly readinessSvc = inject(ReadinessService);
  private readonly acwrSvc = inject(AcwrService);
  private readonly schedule = inject(ScheduleService);
  private readonly identity = inject(IdentityService);
  private readonly recoverySvc = inject(RecoveryService);

  /** Recovery modalities recommended for today, gated by owned equipment. */
  readonly recovery = this.recoverySvc.recommendations;
  readonly hasEquipment = computed(
    () => this.recoverySvc.ownedEquipment().length > 0,
  );

  /** Today's prescription (engine). Null until the schedule snapshot resolves. */
  readonly rx = this.periodization.today;
  /** Hero gates on the schedule snapshot — show a skeleton until it resolves. */
  readonly loading = this.schedule.loading;

  /** "Good morning, Joao" — time-of-day greeting + the signed-in user's first name. */
  readonly greeting = computed(() => {
    const h = new Date().getHours();
    const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
    return `Good ${part}, ${this.identity.firstName()}`;
  });

  /** "Mon 1 Jun" + macro season label when known. */
  readonly eyebrow = computed(() => {
    const d = new Date().toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const season = this.rx()?.seasonPhase;
    const label: Record<string, string> = {
      offseason: "Off-season",
      preseason: "Pre-season",
      inseason: "In-season",
      transition: "Transition",
    };
    return season ? `${d} · ${label[season]}` : d;
  });

  /** Context strip: countdown to the next event, when one exists. */
  readonly nextEvent = this.schedule.nextEvent;
  readonly daysToNext = this.schedule.daysToNextEvent;

  /** Weather adjustment surfaced by the engine (adjustment warnings), if any. */
  readonly weather = computed(() => this.rx()?.weatherAdjustment ?? null);

  /** Raw current conditions (temp, condition text) for the standalone weather strip. */
  readonly weatherRaw = this.periodization.weather;

  /** Hero band — reflects the day's nature without fabricating a "physio block". */
  readonly heroBand = computed<{ label: string; cls: string } | null>(() => {
    const rx = this.rx();
    if (!rx) return null;
    if (this.weather()?.applied)
      return { label: "weather-adjusted", cls: "caution" };
    if (rx.recoveryEmphasis === "critical")
      return { label: "recover", cls: "danger" };
    if (rx.recoveryEmphasis === "high")
      return { label: "recover", cls: "caution" };
    if (rx.intent === "competition") return { label: "game day", cls: "info" };
    return { label: "today", cls: "good" };
  });

  /** Readiness band from the server score. */
  readonly readiness = this.readinessSvc.current;
  readonly readinessBand = computed<{ label: string; cls: string } | null>(
    () => {
      const r = this.readiness();
      if (!r || typeof r.score !== "number") return null;
      const score = Math.round(r.score);
      const cls = score < 55 ? "danger" : score <= 75 ? "caution" : "good";
      const word = score < 55 ? "deload" : score <= 75 ? "maintain" : "ready";
      return { label: `${score} · ${word}`, cls };
    },
  );

  /** ACWR band from the server ratio, or null when there's insufficient history. */
  readonly acwrSufficient = this.acwrSvc.sufficientDataForACWR;
  readonly acwrBand = computed<{ label: string; cls: string } | null>(() => {
    if (!this.acwrSufficient()) return null;
    const r = this.acwrSvc.acwrRatio();
    if (r == null) return null;
    const v = r.toFixed(2);
    if (r > 1.5) return { label: `${v} · danger`, cls: "danger" };
    if (r > 1.3) return { label: `${v} · elevated`, cls: "caution" };
    if (r < 0.8) return { label: `${v} · under-training`, cls: "caution" };
    return { label: `${v} · sweet spot`, cls: "good" };
  });

  /** RPE tile copy (rest days have no RPE target). */
  readonly rpeLabel = computed(() => {
    const rpe = this.rx()?.targetRpe;
    return rpe == null ? "—" : String(rpe);
  });

  /** Context-aware food suggestions that change by today's intent.
   *  Competition day → fast carbs + pre-game timing.
   *  Recovery day → protein + anti-inflammatory foods.
   *  Strength/gym day → protein-forward + complex carbs.
   *  Default (practice / conditioning) → balanced carb + protein split. */
  readonly foodSuggestions = computed(() => {
    const intent = this.rx()?.intent;
    if (intent === "competition") {
      return [
        { icon: "mdi:pasta", label: "pasta" },
        { icon: "mdi:rice", label: "rice" },
        { icon: "mdi:food-apple", label: "banana" },
        { icon: "mdi:bread-slice", label: "white bread" },
        { icon: "mdi:bottle-tonic", label: "electrolytes" },
        { icon: "mdi:food-drumstick", label: "chicken" },
      ];
    }
    if (intent === "recovery" || intent === "rest") {
      return [
        { icon: "mdi:fish", label: "salmon" },
        { icon: "mdi:egg", label: "eggs" },
        { icon: "mdi:food-apple", label: "berries" },
        { icon: "mdi:cup", label: "greek yogurt" },
        { icon: "mdi:leaf", label: "spinach" },
        { icon: "mdi:peanut", label: "almonds" },
      ];
    }
    if (intent === "strength") {
      return [
        { icon: "mdi:food-drumstick", label: "chicken" },
        { icon: "mdi:egg", label: "eggs" },
        { icon: "mdi:rice", label: "rice" },
        { icon: "mdi:cup", label: "shake" },
        { icon: "mdi:barley", label: "oats" },
        { icon: "mdi:food-apple", label: "fruit" },
      ];
    }
    return [
      { icon: "mdi:rice", label: "rice" },
      { icon: "mdi:barley", label: "oats" },
      { icon: "mdi:food-apple", label: "fruit" },
      { icon: "mdi:food-drumstick", label: "chicken" },
      { icon: "mdi:cup", label: "shake" },
      { icon: "mdi:egg", label: "eggs" },
    ];
  });
}
