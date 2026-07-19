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
import { TopbarComponent } from "../shared/topbar.component";
import { SkeletonComponent } from "../shared/skeleton.component";
import { ReadinessTrendComponent } from "../shared/readiness-trend.component";
import { LoadCalendarComponent } from "../shared/load-calendar.component";
import { LoadDay } from "../shared/utils/load-calendar.util";
import {
  AcwrBandComponent,
  LoadTimelineComponent,
  WeightTrendComponent,
  type WeightPoint,
} from "../shared/perf-viz";
import { BodyMeasurementService } from "../core/services/body-measurement.service";

import { ReadinessService } from "../core/services/readiness.service";
import { AcwrService } from "../core/services/acwr.service";
import { ApiService } from "../core/services/api.service";

interface Spark {
  points: string;
  last: { x: number; y: number };
}

interface DailyLoadResp {
  series: LoadDay[];
  maxLoad: number;
  endDate: string;
  days: number;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * Stats — ACWR + readiness trends over the last 28 days. Ported 1:1 from
 * redesign/ground-zero/02-hifi/stats.html. Sparklines are drawn from the
 * server's readiness history (score + ACWR per day); the UI plots what the
 * server returns and never re-derives the ratios. Sparse data → the explicit
 * "building up" state, never a fake trend.
 */
@Component({
  selector: "app-stats",
  imports: [
    NgOptimizedImage,
    TopbarComponent,
    SkeletonComponent,
    ReadinessTrendComponent,
    AcwrBandComponent,
    LoadCalendarComponent,
    LoadTimelineComponent,
    WeightTrendComponent,
    RouterLink,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./stats.component.html",
})
export class StatsComponent {
  private readonly readinessSvc = inject(ReadinessService);
  private readonly acwrSvc = inject(AcwrService);
  private readonly api = inject(ApiService);
  private readonly bodySvc = inject(BodyMeasurementService);

  readonly history = this.readinessSvc.history;

  // Daily-load calendar — the athlete's own session-RPE AU by day (self only).
  readonly loadSeries = signal<LoadDay[]>([]);
  readonly loadMax = signal(0);
  readonly loadEnd = signal(new Date().toISOString().slice(0, 10));
  readonly loadDays = signal(35);
  readonly loadLoading = signal(true);
  readonly hasLoad = computed(() => this.loadSeries().length > 0);
  /**
   * Load timeline (bars + acute/chronic EWMA) from the last 21 days of the
   * daily-load series — the acute:chronic STORY the calendar heatmap can't
   * show. EWMA parameters mirror the engine (acute λ=0.25 / chronic λ≈0.09);
   * this is a display derivation of the same canonical daily AU, not a second
   * ACWR authority.
   */
  readonly loadTimeline = computed(() => {
    const days = [...this.loadSeries()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-21);
    const daily = days.map((d) => d.load);
    const acute: number[] = [];
    const chronic: number[] = [];
    let a = 0;
    let c = 0;
    daily.forEach((v, i) => {
      a = i === 0 ? v : 0.25 * v + 0.75 * a;
      c = i === 0 ? v : (2 / 22) * v + (20 / 22) * c;
      acute.push(Math.round(a));
      chronic.push(Math.round(c));
    });
    return { daily, acute, chronic, enough: daily.length > 1 };
  });

  // ── body mass (weight fluctuation) ────────────────────────────────────────
  readonly weightLoading = this.bodySvc.loading;
  readonly weightSaving = this.bodySvc.saving;
  readonly weightError = this.bodySvc.error;
  readonly latestWeightKg = this.bodySvc.latestWeightKg;
  readonly weightInput = signal<number | null>(null);
  readonly weightPoints = computed<WeightPoint[]>(() =>
    this.bodySvc
      .weightHistory()
      .map((m) => ({ date: m.timestamp.slice(0, 10), kg: m.weight as number })),
  );
  onWeightInput(v: number): void {
    this.weightInput.set(Number.isFinite(v) ? v : null);
  }
  async logWeight(): Promise<void> {
    const v = this.weightInput();
    if (v == null || !Number.isFinite(v)) return;
    const ok = await this.bodySvc.logWeight(v);
    if (ok) this.weightInput.set(null);
  }
  readonly daysLogged = signal(0);
  /** True until the 28-day history fetch settles — drives the readiness chart
   * skeleton. Without it the chart falls to its "building up" empty state on
   * mount even when data exists but hasn't arrived (a false empty). */
  readonly loading = signal(true);
  /** The ACWR chart's band also needs AcwrService's independent session load,
   * so its skeleton must stay up until BOTH the history fetch and AcwrService
   * settle — otherwise the band half flashes "building up" mid-load. */
  readonly acwrLoading = computed(
    () => this.loading() || this.acwrSvc.loading(),
  );

  constructor() {
    // Load 28d of readiness/ACWR history (server scopes by auth).
    this.readinessSvc.getHistory("", 28).subscribe({
      next: (h) => {
        this.daysLogged.set(h.length);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Own daily-load series for the calendar heatmap (canonical AU, server-side).
    this.api.get<DailyLoadResp>("/api/daily-load").subscribe({
      next: (res) => {
        const d = res?.data;
        if (d) {
          this.loadSeries.set(d.series ?? []);
          this.loadMax.set(d.maxLoad ?? 0);
          this.loadEnd.set(d.endDate || this.loadEnd());
          this.loadDays.set(d.days ?? 35);
        }
        this.loadLoading.set(false);
      },
      error: () => this.loadLoading.set(false),
    });

    // Own body-mass history for the weight-fluctuation card.
    void this.bodySvc.loadHistory();
  }

  /**
   * ACWR ratios over time, oldest→newest. Feeds app-ff-acwr-band, which draws
   * the line against its risk-zone bands (the plain app-acwr-trend it replaced
   * couldn't show the zone context — the whole point of ACWR). The band
   * component owns its own y-scale and thresholds (adult 0.8/1.3/1.5 defaults).
   */
  readonly acwrSeries = computed<number[]>(() =>
    this.history()
      .map((h) => h.acwr)
      .filter((v) => Number.isFinite(v) && v > 0),
  );

  /** Readiness sparkline — y = 132 − 1.2·score (75→42, 55→66 gridlines). */
  readonly readyChart = computed<Spark | null>(() =>
    this.spark(
      this.history()
        .map((h) => h.score)
        .filter((v) => Number.isFinite(v)),
      (v) => 132 - 1.2 * v,
    ),
  );

  readonly acwrSufficient = this.acwrSvc.sufficientDataForACWR;
  readonly acwrBand = computed<{ label: string; cls: string } | null>(() => {
    if (!this.acwrSufficient()) return null;
    const r = this.acwrSvc.acwrRatio();
    if (r == null) return null;
    const v = r.toFixed(2);
    if (r > 1.5) return { label: `${v} · Danger`, cls: "danger" };
    if (r > 1.3) return { label: `${v} · Elevated`, cls: "caution" };
    if (r < 0.8) return { label: `${v} · Under-training`, cls: "caution" };
    return { label: `${v} · Sweet spot`, cls: "good" };
  });

  private spark(values: number[], toY: (v: number) => number): Spark | null {
    const n = values.length;
    if (n < 2) return null;
    const pts = values.map((v, i) => ({
      x: +((i / (n - 1)) * 359).toFixed(1),
      y: +clamp(toY(v), 8, 116).toFixed(1),
    }));
    return {
      points: pts.map((p) => `${p.x},${p.y}`).join(" "),
      last: pts[n - 1],
    };
  }
}
