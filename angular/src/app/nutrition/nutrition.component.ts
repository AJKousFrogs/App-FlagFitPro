import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { PeriodizationService } from "../core/services/periodization.service";
import { ScheduleService } from "../core/services/schedule.service";
import { ConceptTipComponent } from "../shared/concept-tip.component";
import { fuelBucket, fuelBucketLabel, fuelIdeas } from "./nutrition.util";
import type { FuelBucket } from "./nutrition.util";

interface FuelDay {
  key: string;
  weekday: string;
  bucket: FuelBucket;
  bucketLabel: string;
  intentLabel: string;
  carbsG: number | null;
  proteinG: number | null;
  fluidL: number | null;
  rationale: string;
  carbsPct: number;
  isToday: boolean;
}

/**
 * Athlete-facing fuel screen. Consumes the periodization engine's per-day
 * `NutritionTargets` (carbs g / protein g / hydration L + rationale) — the SINGLE
 * source (CLAUDE.md §4). It NEVER recomputes a macro: the numbers are the
 * engine's, this screen adds the WEEK dimension Today's single-day block lacks
 * (how fuelling scales across the training week) plus food-first framing (Law #3).
 * No weight ⇒ engine nutrition is null ⇒ explicit "add your weight" state, never
 * a fabricated plan (Law #7).
 */
@Component({
  selector: "app-nutrition",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule, DecimalPipe, ConceptTipComponent],
  templateUrl: "./nutrition.component.html",
  styleUrl: "./nutrition.component.scss",
})
export class NutritionComponent {
  private readonly periodization = inject(PeriodizationService);
  private readonly schedule = inject(ScheduleService);

  readonly loading = this.schedule.loading;
  readonly rx = this.periodization.today;
  readonly nutrition = computed(() => this.rx()?.nutrition ?? null);

  private readonly week = computed(() => this.periodization.weekAhead());

  readonly weekFuel = computed<FuelDay[]>(() => {
    const days = this.week();
    const carbs = days
      .map((d) => d.nutrition?.carbsG)
      .filter((c): c is number => typeof c === "number");
    const maxCarbs = carbs.length ? Math.max(...carbs) : 0;
    const todayIso = this.rx()?.date;
    return days.map((d) => {
      const n = d.nutrition;
      const bucket = fuelBucket(d.intent);
      return {
        key: d.date,
        weekday: new Date(`${d.date}T12:00:00`).toLocaleDateString("en-GB", {
          weekday: "short",
        }),
        bucket,
        bucketLabel: fuelBucketLabel(bucket),
        intentLabel: d.intentLabel,
        carbsG: n?.carbsG ?? null,
        proteinG: n?.proteinG ?? null,
        fluidL: n?.hydrationL ?? null,
        rationale: n?.rationale ?? d.reasoning,
        carbsPct:
          n && maxCarbs > 0 ? Math.round((n.carbsG / maxCarbs) * 100) : 0,
        isToday: d.date === todayIso,
      };
    });
  });

  readonly weekHasFuel = computed(() =>
    this.weekFuel().some((d) => d.carbsG !== null),
  );

  readonly todayBucketLabel = computed(() => {
    const r = this.rx();
    return r ? fuelBucketLabel(fuelBucket(r.intent)) : "";
  });

  readonly ideas = computed(() => {
    const r = this.rx();
    const n = this.nutrition();
    return r && n ? fuelIdeas(r.intent, n) : [];
  });
}
