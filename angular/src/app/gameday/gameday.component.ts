import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "../shared/avatar.component";
import { SkeletonComponent } from "../shared/skeleton.component";

import { ScheduleService } from "../core/services/schedule.service";
import { PeriodizationService } from "../core/services/periodization.service";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { TOURNAMENT_DAY } from "../core/config/position-volume.config";
import { logHydrationOptimistic } from "../shared/utils/hydration-log.utils";

/**
 * Game day — go-time card + heat guard + fueling timeline + hydration. Ported 1:1
 * from redesign/ground-zero/02-hifi/gameday.html. The card reads the engine's
 * game-day prescription (reasoning + nutrition); the heat card surfaces the
 * weatherAdjustment when present; hydration → POST /api/hydration/log.
 */
@Component({
  selector: "app-gameday",
  standalone: true,
  imports: [AvatarComponent, SkeletonComponent, RouterLink, LucideAngularModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./gameday.component.html",
})
export class GamedayComponent {
  private readonly schedule = inject(ScheduleService);
  private readonly periodization = inject(PeriodizationService);
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly nextEvent = this.schedule.nextEvent;
  /** Fueling timeline gates on the schedule snapshot — skeleton until resolved. */
  readonly loading = this.schedule.loading;
  readonly rx = this.periodization.today;
  readonly weather = computed(() => this.rx()?.weatherAdjustment ?? null);
  /** Re-warm-before-every-game protocol — a multi-game tournament day stacks
   * games (08:00 / 11:30 / 13:00 / 15:00 / 16:00 / 19:00), each needing its own
   * warm-up. Shown when the day carries more than one game. */
  readonly multiGame = computed(() => (this.nextEvent()?.expectedGameCount ?? 0) > 1);
  readonly warmupNote = TOURNAMENT_DAY.note;

  /**
   * Pick the conditions icon + band from the actual adjustment, not a fixed sun —
   * a cold/wet/windy day must not render with a sunny glyph. Derived from the
   * heat-load factor and the engine's reason text (which carries the weather cue).
   */
  readonly conditions = computed(() => {
    const w = this.weather();
    if (!w) return null;
    const r = (w.reason ?? "").toLowerCase();
    if (w.heatLoadFactor > 1 || /too hot|feels-like.*hot|heat/.test(r))
      return { icon: "flame", band: "danger", label: "heat" };
    if (/storm|lightning/.test(r)) return { icon: "cloud-rain", band: "danger", label: "storm" };
    if (/warm/.test(r)) return { icon: "sun", band: "caution", label: "warm" };
    if (/cold/.test(r)) return { icon: "cloud-rain", band: "info", label: "cold" };
    if (/wind/.test(r)) return { icon: "cloud-rain", band: "info", label: "wind" };
    if (/rain|wet/.test(r)) return { icon: "cloud-rain", band: "info", label: "wet" };
    return { icon: "sun", band: null as string | null, label: null as string | null };
  });

  readonly reasoning = computed(
    () =>
      this.rx()?.reasoning ??
      "Activate, play, refuel between games, sleep tonight.",
  );

  /** Tournament fueling splits derived from the engine's daily macro targets. */
  readonly fuel = computed(() => {
    const n = this.rx()?.nutrition;
    if (!n) return null;
    return {
      before: Math.round(n.carbsG * 0.3),
      betweenCarb: Math.round(n.carbsG * 0.12),
      afterCarb: Math.round(n.carbsG * 0.3),
      afterProtein: Math.round(n.proteinG * 0.3),
    };
  });

  readonly hydrationMl = signal(0);
  readonly hydrationL = computed(() => (this.hydrationMl() / 1000).toFixed(1));

  constructor() {
    // Without this the counter silently resets to 0 on every visit/reload even
    // though earlier logs today already persisted server-side (mirrors
    // wellness.component.ts's loadTodayHydration()).
    this.api.get<{ logs?: { amount: number }[] }>("/api/hydration").subscribe({
      next: (res) => {
        const total = (res?.data?.logs ?? []).reduce((sum, l) => sum + (l.amount ?? 0), 0);
        this.hydrationMl.set(total);
      },
      error: (e) => this.logger.error("hydration_today_load_failed", e),
    });
  }

  addHydration(ml: number): void {
    logHydrationOptimistic(this.api, this.logger, this.hydrationMl, ml);
  }
}
