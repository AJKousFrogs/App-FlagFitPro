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
      .subscribe({ error: (e) => this.logger.error("hydration_log_failed", e) });
  }
}
