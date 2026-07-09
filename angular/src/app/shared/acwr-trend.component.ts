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
  template: `
    <svg
      width="100%"
      height="120"
      viewBox="0 0 360 120"
      preserveAspectRatio="none"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
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
        stroke="var(--accent)"
        stroke-width="2.5"
        [attr.points]="points()"
      />
      <circle
        [attr.cx]="lastX()"
        [attr.cy]="lastY()"
        r="4"
        fill="var(--accent)"
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
