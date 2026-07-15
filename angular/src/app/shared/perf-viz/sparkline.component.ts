import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import {
  areaPolygon,
  polyline,
  seriesPoints,
  type PerfZone,
} from "./perf-viz.geometry";

let uid = 0;

/**
 * ff-sparkline — a compact, axis-less trend line. Signature mint→violet
 * gradient stroke, soft area fade, and an emphasized endpoint whose colour
 * encodes direction (up = good, down = danger) so the trend reads without the
 * axis. Single series ⇒ no legend (the host names it). Empty/1-point series →
 * nothing drawn (never a fabricated line).
 */
@Component({
  selector: "app-ff-sparkline",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pts().length > 1) {
      <svg
        [attr.viewBox]="'0 0 ' + w + ' ' + h"
        preserveAspectRatio="none"
        class="spk"
        role="img"
        [attr.aria-label]="ariaLabel()"
      >
        <defs>
          <linearGradient [attr.id]="lineId" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="var(--accent)" />
            <stop offset="1" stop-color="var(--accent-2)" />
          </linearGradient>
          <linearGradient [attr.id]="areaId" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0"
              stop-color="color-mix(in srgb, var(--accent) 22%, transparent)"
            />
            <stop offset="1" stop-color="transparent" />
          </linearGradient>
        </defs>
        <polygon [attr.points]="area()" [attr.fill]="'url(#' + areaId + ')'" />
        <polyline
          [attr.points]="line()"
          fill="none"
          [attr.stroke]="'url(#' + lineId + ')'"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
        <circle
          [attr.cx]="end().x"
          [attr.cy]="end().y"
          r="3"
          class="end {{ dirZone() }}"
        />
      </svg>
    } @else {
      <span class="empty" aria-hidden="true">—</span>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .spk {
        display: block;
        width: 100%;
        height: var(--spk-h, 40px);
        overflow: visible;
      }
      .end {
        stroke: var(--surface);
        stroke-width: 1.5;
        color: var(--good);
        fill: currentColor;
        filter: drop-shadow(0 0 4px currentColor);
        vector-effect: non-scaling-stroke;
      }
      .end.danger {
        color: var(--danger);
      }
      .end.caution {
        color: var(--warn);
      }
      .end.neutral {
        color: var(--text-faint);
      }
      .empty {
        display: block;
        color: var(--text-faint);
        font-family: var(--font-mono);
        font-size: 12px;
      }
    `,
  ],
})
export class SparklineComponent {
  /** The series to plot, oldest → newest. */
  readonly series = input<readonly number[]>([]);
  /** Human label for the aria description (e.g. "sleep hours"). */
  readonly label = input("trend");

  readonly w = 100;
  readonly h = 40;
  private readonly n = ++uid;
  readonly lineId = `spk-l-${this.n}`;
  readonly areaId = `spk-a-${this.n}`;

  readonly pts = computed(() => seriesPoints(this.series(), this.w, this.h));
  readonly line = computed(() => polyline(this.pts()));
  readonly area = computed(() => areaPolygon(this.pts(), this.h));
  readonly end = computed(() => {
    const p = this.pts();
    return p[p.length - 1] ?? { x: 0, y: 0 };
  });

  readonly dirZone = computed<PerfZone>(() => {
    const s = this.series().filter((v) => Number.isFinite(v));
    if (s.length < 2) return "neutral";
    const last = s[s.length - 1];
    const first = s[0];
    if (last > first) return "good";
    if (last < first) return "danger";
    return "neutral";
  });

  readonly ariaLabel = computed(() => {
    const s = this.series().filter((v) => Number.isFinite(v));
    if (s.length < 2) return `${this.label()} — not enough data yet.`;
    const dir =
      this.dirZone() === "good"
        ? "trending up"
        : this.dirZone() === "danger"
          ? "trending down"
          : "steady";
    return `${this.label()} over ${s.length} points, latest ${s[s.length - 1]}, ${dir}.`;
  });
}
