import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

import { ReadinessService } from "../core/services/readiness.service";
import { AcwrService } from "../core/services/acwr.service";

interface Spark {
  points: string;
  last: { x: number; y: number };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Stats — ACWR + readiness trends over the last 28 days. Ported 1:1 from
 * redesign/ground-zero/02-hifi/stats.html. Sparklines are drawn from the
 * server's readiness history (score + ACWR per day); the UI plots what the
 * server returns and never re-derives the ratios. Sparse data → the explicit
 * "building up" state, never a fake trend.
 */
@Component({
  selector: "app-stats",
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./stats.component.html",
})
export class StatsComponent {
  private readonly readinessSvc = inject(ReadinessService);
  private readonly acwrSvc = inject(AcwrService);

  readonly history = this.readinessSvc.history;
  readonly daysLogged = signal(0);

  constructor() {
    // Load 28d of readiness/ACWR history (server scopes by auth).
    this.readinessSvc.getHistory("", 28).subscribe({
      next: (h) => this.daysLogged.set(h.length),
    });
  }

  /** ACWR sparkline — shared y-scale y = 110 − acwr·50 (1.5→35, 1.3→45, 0.8→70). */
  readonly acwrChart = computed<Spark | null>(() =>
    this.spark(
      this.history()
        .map((h) => h.acwr)
        .filter((v) => Number.isFinite(v) && v > 0),
      (v) => 110 - v * 50,
    ),
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
    return { points: pts.map((p) => `${p.x},${p.y}`).join(" "), last: pts[n - 1] };
  }
}
