import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { linePath, type Pt } from "./perf-viz.geometry";

export interface WeightPoint {
  /** ISO date. */
  date: string;
  /** Body mass in kg. */
  kg: number;
}

/**
 * ff-weight-trend — body-mass over time with an optional performance-RANGE band
 * (audit §3.2/§6). The band is a GUIDELINE for speed + joint load, framed
 * performance-first: it is a soft wash behind the line, never a red "over/under"
 * verdict. Points inside the range read normal; the endpoint carries the latest
 * value. Fewer than 2 points → an honest empty state (no fabricated trend).
 */
@Component({
  selector: "app-ff-weight-trend",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pts().length > 1) {
      <svg
        [attr.viewBox]="'0 0 ' + w + ' ' + h"
        class="wt"
        role="img"
        [attr.aria-label]="aria()"
      >
        <defs>
          <linearGradient [attr.id]="lineId" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="var(--accent)" />
            <stop offset="1" stop-color="var(--accent-2)" />
          </linearGradient>
        </defs>
        @if (band(); as b) {
          <rect
            class="range"
            x="0"
            [attr.y]="b.top"
            [attr.width]="w"
            [attr.height]="b.height"
          />
          <line
            class="edge"
            x1="0"
            [attr.y1]="b.top"
            [attr.x2]="w"
            [attr.y2]="b.top"
          />
          <line
            class="edge"
            x1="0"
            [attr.y1]="b.top + b.height"
            [attr.x2]="w"
            [attr.y2]="b.top + b.height"
          />
          <text class="rlab" x="4" [attr.y]="b.top - 3">
            performance range {{ low() }}–{{ high() }}kg
          </text>
        }
        <path
          [attr.d]="path()"
          fill="none"
          [attr.stroke]="'url(#' + lineId + ')'"
          stroke-width="2.4"
          stroke-linejoin="round"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />
        <circle class="end" [attr.cx]="end().x" [attr.cy]="end().y" r="4" />
        <text
          class="eval tnum"
          [attr.x]="end().x - 8"
          [attr.y]="end().y - 8"
          text-anchor="end"
        >
          {{ latest() }}kg
        </text>
      </svg>
      <div class="foot">
        <small>{{ firstLabel() }}</small>
        <small>now · {{ latest() }}kg</small>
      </div>
    } @else {
      <p class="empty">
        Log your weight over a few weeks to see the trend against your
        performance range.
      </p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .wt {
        display: block;
        width: 100%;
        height: 150px;
        overflow: visible;
      }
      .range {
        fill: color-mix(in srgb, var(--accent) 8%, transparent);
      }
      .edge {
        stroke: color-mix(in srgb, var(--accent) 26%, transparent);
        stroke-width: 1;
        stroke-dasharray: 3 4;
        vector-effect: non-scaling-stroke;
      }
      .rlab {
        font-family: var(--font-mono);
        font-size: 9px;
        fill: var(--text-faint);
        letter-spacing: 0.02em;
      }
      .end {
        fill: var(--accent);
        stroke: var(--surface);
        stroke-width: 2;
        filter: drop-shadow(
          0 0 5px color-mix(in srgb, var(--accent) 55%, transparent)
        );
        vector-effect: non-scaling-stroke;
      }
      .eval {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 12px;
        fill: var(--text-strong);
      }
      .foot {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
        color: var(--text-faint);
        font-family: var(--font-mono);
        font-size: 10px;
      }
      .empty {
        margin: 0;
        color: var(--text-faint);
        font-size: 12.5px;
      }
    `,
  ],
})
export class WeightTrendComponent {
  readonly points = input<readonly WeightPoint[]>([]);
  /** Performance-range low/high in kg (optional guideline overlay). */
  readonly low = input<number | null>(null);
  readonly high = input<number | null>(null);

  readonly w = 320;
  readonly h = 130;
  readonly pad = 14;
  private static seq = 0;
  readonly lineId = `wt-l-${++WeightTrendComponent.seq}`;

  private readonly kgs = computed(() =>
    this.points()
      .map((p) => p.kg)
      .filter((v) => Number.isFinite(v)),
  );

  /** Domain includes both the data AND the range band so both always fit. */
  private readonly domain = computed(() => {
    const vals = [...this.kgs()];
    const lo = this.low();
    const hi = this.high();
    if (typeof lo === "number") vals.push(lo);
    if (typeof hi === "number") vals.push(hi);
    if (vals.length === 0) return { min: 0, max: 1 };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min || 2) * 0.15;
    return { min: min - pad, max: max + pad };
  });

  private y(kg: number): number {
    const { min, max } = this.domain();
    const span = max - min || 1;
    const innerH = this.h - 2 * this.pad;
    return +(this.h - this.pad - ((kg - min) / span) * innerH).toFixed(2);
  }

  readonly pts = computed<Pt[]>(() => {
    const kgs = this.kgs();
    if (kgs.length < 2) return [];
    return kgs.map((kg, i) => ({
      x: +((i / (kgs.length - 1)) * this.w).toFixed(2),
      y: this.y(kg),
    }));
  });
  readonly path = computed(() => linePath(this.pts()));
  readonly end = computed(() => {
    const p = this.pts();
    return p[p.length - 1] ?? { x: 0, y: 0 };
  });
  readonly latest = computed(() => {
    const k = this.kgs();
    return k.length ? k[k.length - 1].toFixed(1) : "—";
  });
  readonly firstLabel = computed(() => {
    const p = this.points();
    if (!p.length) return "";
    return new Date(p[0].date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  });

  readonly band = computed(() => {
    const lo = this.low();
    const hi = this.high();
    if (typeof lo !== "number" || typeof hi !== "number") return null;
    const top = this.y(hi);
    const bottom = this.y(lo);
    return { top, height: +(bottom - top).toFixed(2) };
  });

  readonly aria = computed(() => {
    const k = this.kgs();
    if (k.length < 2) return "Weight trend, not enough data.";
    const range =
      typeof this.low() === "number"
        ? `, performance range ${this.low()}–${this.high()}kg`
        : "";
    return `Body mass over ${k.length} logs, latest ${this.latest()} kg${range}.`;
  });
}
