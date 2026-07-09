import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { NgOptimizedImage } from "@angular/common";
import { AvatarComponent } from "../shared/avatar.component";

import { AcwrService } from "../core/services/acwr.service";
import { ReadinessService } from "../core/services/readiness.service";
import { ApiService, API_ENDPOINTS } from "../core/services/api.service";

interface Spark {
  points: string;
  last: { x: number; y: number };
}
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * Load / ACWR — the deep load-monitoring screen. Ported 1:1 from
 * redesign/ground-zero/02-hifi/acwr.html. Server-canonical: ratio/band/acute/
 * chronic/weekly-progression from AcwrService; the trend sparkline from the
 * server readiness history. Insufficient history → progress, not a fake ratio.
 */
@Component({
  selector: "app-acwr",
  imports: [NgOptimizedImage, AvatarComponent, RouterLink, LucideAngularModule],
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

  readonly chart = computed<Spark | null>(() => {
    const vals = this.history()
      .map((h) => h.acwr)
      .filter((v) => Number.isFinite(v) && v > 0);
    if (vals.length < 2) return null;
    const n = vals.length;
    const pts = vals.map((v, i) => ({
      x: +((i / (n - 1)) * 359).toFixed(1),
      y: +clamp(110 - v * 50, 8, 116).toFixed(1),
    }));
    return {
      points: pts.map((p) => `${p.x},${p.y}`).join(" "),
      last: pts[n - 1],
    };
  });

  /**
   * Screen-reader description of the ACWR trend chart (audit V1). The svg
   * previously had no role/aria-label at all, so the app's most safety-critical
   * visualization was invisible to assistive tech. Announces the current value +
   * zone + the reference thresholds so the chart conveys the same information
   * non-visually.
   */
  readonly chartAria = computed(() => {
    const r = this.ratio();
    const b = this.band();
    if (r == null || !b) {
      return "Acute-to-chronic workload ratio trend chart. Not enough history yet.";
    }
    return `Acute-to-chronic workload ratio trend. Current ratio ${r.toFixed(2)}, ${b.label}. Sweet spot is 0.8 to 1.3; danger above 1.5.`;
  });

  readonly weeklyPct = computed(() => Math.round(this.weekly().changePercent));
}
