import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import { NgOptimizedImage } from "@angular/common";
import { TopbarComponent } from "../shared/topbar.component";
import { AcwrBandComponent } from "../shared/perf-viz";

import { AcwrService } from "../core/services/acwr.service";
import { ReadinessService } from "../core/services/readiness.service";
import { ApiService, API_ENDPOINTS } from "../core/services/api.service";

/**
 * Load / ACWR — the deep load-monitoring screen. Ported 1:1 from
 * redesign/ground-zero/02-hifi/acwr.html. Server-canonical: ratio/band/acute/
 * chronic/weekly-progression from AcwrService; the trend sparkline from the
 * server readiness history. Insufficient history → progress, not a fake ratio.
 */
@Component({
  selector: "app-acwr",
  imports: [
    NgOptimizedImage,
    TopbarComponent,
    AcwrBandComponent,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./acwr.component.html",
})
export class AcwrComponent {
  private readonly acwrSvc = inject(AcwrService);
  private readonly readinessSvc = inject(ReadinessService);
  private readonly api = inject(ApiService);

  readonly history = this.readinessSvc.history;
  readonly sufficient = this.acwrSvc.sufficientDataForACWR;
  readonly ratio = this.acwrSvc.acwrRatio;
  readonly acute = this.acwrSvc.acuteLoad;
  readonly chronic = this.acwrSvc.chronicLoad;
  readonly weekly = this.acwrSvc.weeklyProgression;

  readonly monotonyData = signal<{
    monotony: number | null;
    strain: number | null;
    monotonyRisk: string;
  } | null>(null);

  constructor() {
    this.readinessSvc.getHistory("", 28).subscribe();
    this.api
      .get<{
        monotony: number | null;
        strain: number | null;
        monotonyRisk: string;
      }>(API_ENDPOINTS.loadManagement.monotony)
      .subscribe({
        next: (res) => {
          if (res?.success && res.data) this.monotonyData.set(res.data);
        },
      });
  }

  readonly band = computed<{
    label: string;
    cls: string;
    verdict: string;
  } | null>(() => {
    if (!this.sufficient()) return null;
    const r = this.ratio();
    if (r == null) return null;
    if (r > 1.5)
      return {
        label: "Danger zone",
        cls: "danger",
        verdict: "Reduce 20–30%, skip sprints, recover.",
      };
    if (r > 1.3)
      return {
        label: "Elevated",
        cls: "caution",
        verdict: "Approaching danger — cut high-intensity 15–20%.",
      };
    if (r < 0.8)
      return {
        label: "Under-training",
        cls: "caution",
        verdict: "Building base — add 5–10%/week.",
      };
    return {
      label: "Sweet spot",
      cls: "good",
      verdict: "Optimal load — lowest injury risk. Keep it here.",
    };
  });

  /**
   * ACWR ratios over time, oldest→newest — feeds app-ff-acwr-band (replaced the
   * plain app-acwr-trend so the line reads against its risk-zone bands). The
   * band component owns its own y-scale, thresholds, and an equivalent
   * safety-critical aria label (ratio + zone + safe band), so the audit-V1 a11y
   * description that used to live here is preserved by the component itself.
   */
  readonly acwrSeries = computed<number[]>(() =>
    this.history()
      .map((h) => h.acwr)
      .filter((v) => Number.isFinite(v) && v > 0),
  );

  readonly weeklyPct = computed(() => Math.round(this.weekly().changePercent));
}
