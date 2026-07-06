import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from "@angular/core";
import { ReadinessService } from "../core/services/readiness.service";

interface TrendChart {
  points: string;
  area: string;
  last: { x: number; y: number; cls: string };
}

const W = 320;
const H = 120;
const PAD_TOP = 8;
const PAD_BOTTOM = 112;
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * Readiness trend — a small SVG line chart of the athlete's daily readiness
 * score over the last N days. Reads ReadinessService.history (server-canonical;
 * never re-derives the score). Honest empty state until there are ≥2 days. The
 * full-width SVG uses non-scaling strokes so the line stays crisp when stretched.
 */
@Component({
  selector: "app-readiness-trend",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (chart(); as c) {
      <svg
        [attr.viewBox]="viewBox"
        preserveAspectRatio="none"
        class="rt-svg"
        role="img"
        aria-label="Readiness over time"
      >
        <!-- high (75) / low (55) reference lines -->
        <line
          x1="0"
          [attr.y1]="y(75)"
          [attr.x2]="w"
          [attr.y2]="y(75)"
          class="rt-grid"
        />
        <line
          x1="0"
          [attr.y1]="y(55)"
          [attr.x2]="w"
          [attr.y2]="y(55)"
          class="rt-grid"
        />
        <polygon [attr.points]="c.area" class="rt-area" />
        <polyline [attr.points]="c.points" class="rt-line" />
        <circle
          [attr.cx]="c.last.x"
          [attr.cy]="c.last.y"
          r="4"
          class="rt-dot {{ c.last.cls }}"
        />
      </svg>
      <div class="rt-x">
        <small class="muted">{{ firstLabel() }}</small>
        <small class="muted">today</small>
      </div>
    } @else {
      <p class="note" style="margin:0">
        Your readiness trend builds here once you’ve logged a few days of
        check-ins.
      </p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .rt-svg {
        width: 100%;
        height: 120px;
        display: block;
        overflow: visible;
      }
      .rt-grid {
        stroke: var(--border-soft);
        stroke-width: 1;
        stroke-dasharray: 3 5;
        vector-effect: non-scaling-stroke;
      }
      .rt-line {
        fill: none;
        stroke: var(--accent);
        stroke-width: 2.5;
        stroke-linejoin: round;
        stroke-linecap: round;
        vector-effect: non-scaling-stroke;
      }
      .rt-area {
        fill: color-mix(in srgb, var(--accent) 14%, transparent);
        stroke: none;
      }
      .rt-dot {
        stroke: var(--surface);
        stroke-width: 2;
        fill: var(--accent);
        vector-effect: non-scaling-stroke;
      }
      .rt-dot.danger {
        fill: var(--danger);
      }
      .rt-dot.caution {
        fill: var(--warn);
      }
      .rt-dot.good {
        fill: var(--good);
      }
      .rt-x {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
      }
    `,
  ],
})
export class ReadinessTrendComponent implements OnInit {
  private readonly readiness = inject(ReadinessService);

  readonly viewBox = `0 0 ${W} ${H}`;
  readonly w = W;

  /** Chronological scores (oldest → newest). */
  private readonly series = computed(() =>
    [...this.readiness.history()]
      .filter((h) => Number.isFinite(h.score))
      .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()),
  );

  readonly firstLabel = computed(() => {
    const s = this.series();
    if (!s.length) return "";
    return new Date(s[0].day).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  });

  readonly chart = computed<TrendChart | null>(() => {
    const s = this.series();
    const n = s.length;
    if (n < 2) return null;
    const pts = s.map((h, i) => ({
      x: +((i / (n - 1)) * W).toFixed(1),
      y: +clamp(this.y(h.score), PAD_TOP, PAD_BOTTOM).toFixed(1),
    }));
    const points = pts.map((p) => `${p.x},${p.y}`).join(" ");
    const area = `${pts[0].x},${PAD_BOTTOM} ${points} ${pts[n - 1].x},${PAD_BOTTOM}`;
    const lastScore = s[n - 1].score;
    const cls =
      lastScore < 55 ? "danger" : lastScore <= 75 ? "caution" : "good";
    return { points, area, last: { ...pts[n - 1], cls } };
  });

  ngOnInit(): void {
    // server scopes by auth; 14-day window
    this.readiness.getHistory("", 14).subscribe({ error: () => undefined });
  }

  /** Map a 0–100 score to the SVG y (100 → top, 0 → bottom). */
  y(score: number): number {
    return PAD_BOTTOM - (clamp(score, 0, 100) / 100) * (PAD_BOTTOM - PAD_TOP);
  }
}
