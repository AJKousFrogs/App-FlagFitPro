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

import { ScheduleService } from "../core/services/schedule.service";
import { PeriodizationService } from "../core/services/periodization.service";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";

/**
 * Game day — go-time card + heat guard + fueling timeline + hydration. Ported 1:1
 * from redesign/ground-zero/02-hifi/gameday.html. The card reads the engine's
 * game-day prescription (reasoning + nutrition); the heat card surfaces the
 * weatherAdjustment when present; hydration → POST /api/hydration/log.
 */
@Component({
  selector: "app-gameday",
  standalone: true,
  imports: [AvatarComponent, RouterLink, LucideAngularModule],
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
  readonly rx = this.periodization.today;
  readonly weather = computed(() => this.rx()?.weatherAdjustment ?? null);

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
  addHydration(ml: number): void {
    this.hydrationMl.update((v) => v + ml);
    this.api
      .post("/api/hydration/log", { amount: ml })
      .subscribe({
        // Roll back the optimistic total if the log didn't persist.
        error: (e) => {
          this.hydrationMl.update((v) => v - ml);
          this.logger.error("hydration_log_failed", e);
        },
      });
  }
}
