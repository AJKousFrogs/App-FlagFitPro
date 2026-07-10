import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * ACWR trend sparkline — the shaded sweet-spot (0.8–1.3) band + danger (1.5)
 * reference line + the athlete's acute:chronic ratio line. Presentational: the
 * caller computes the polyline (`points`) and end-dot (`lastX`/`lastY`) and
 * supplies the screen-reader `ariaLabel`.
 *
 * Canonical shared chart (2026-07-09): acwr.component and stats.component carried
 * byte-identical copies of this SVG (backlog "shared app-trend-chart" item) — the
 * ACWR counterpart to the readiness-trend unification. One implementation now.
 */
@Component({
  selector: "app-acwr-trend",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .acwr-dot {
        fill: var(--accent);
        stroke: var(--surface);
        stroke-width: 2;
        filter: drop-shadow(0 0 4px var(--chart-glow));
      }
    `,
  ],
  template: `
    <svg
      width="100%"
      height="120"
      viewBox="0 0 360 120"
      preserveAspectRatio="none"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      <!-- signature chart gradient — visual only; the sweet band + danger
           threshold below carry the meaning and are untouched -->
      <defs>
        <linearGradient id="acwrLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style="stop-color: var(--chart-stroke-a)" />
          <stop offset="1" style="stop-color: var(--chart-stroke-b)" />
        </linearGradient>
      </defs>
      <rect x="0" y="45" width="360" height="25" fill="var(--good-soft)" />
      <text x="6" y="59" font-size="10" fill="var(--text-faint)">
        sweet 0.8–1.3
      </text>
      <line
        x1="0"
        y1="35"
        x2="360"
        y2="35"
        stroke="var(--danger)"
        stroke-dasharray="5 3"
        opacity=".7"
      />
      <text x="6" y="31" font-size="10" fill="var(--text-faint)">
        danger 1.5
      </text>
      <polyline
        fill="none"
        stroke="url(#acwrLine)"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-linecap="round"
        [attr.points]="points()"
      />
      <circle
        class="acwr-dot"
        [attr.cx]="lastX()"
        [attr.cy]="lastY()"
        r="4"
      />
    </svg>
    <!-- Name the y-axis (the "sweet"/"danger" band labels don't say what the
         ratio is). -->
    <small class="muted" style="display: block; margin-top: var(--s-2)">
      Acute:chronic workload ratio · 7-day load vs 28-day average
    </small>
  `,
})
export class AcwrTrendComponent {
  readonly points = input.required<string>();
  readonly lastX = input.required<number>();
  readonly lastY = input.required<number>();
  readonly ariaLabel = input<string>(
    "Acute-to-chronic workload ratio trend chart",
  );
}
