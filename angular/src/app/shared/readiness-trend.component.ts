import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
} from "@angular/core";
import { ReadinessService } from "../core/services/readiness.service";

interface TrendChart {
  points: string;
  area: string;
  last: { x: number; y: number; cls: string; score: number };
}

const W = 320;
const H = 120;
const PAD_TOP = 8;
const PAD_BOTTOM = 112;
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * Readiness trend — a small SVG line chart of the athlete's daily readiness
 * score. Reads ReadinessService.history (server-canonical; never re-derives the
 * score). Honest empty state until there are ≥2 days.
 *
 * Canonical shared chart (2026-07-09 data-viz audit V2): stats.component used to
 * carry its own near-identical inline readiness SVG. This component is now the
 * single implementation — configurable via `days` (fetch window) and `autoLoad`
 * (set false when the parent already populates ReadinessService.history, e.g.
 * stats' 28-day fetch) so both callers share one rendering.
 *
 * Accessibility: the reference lines are labeled (55 / 75), the aria-label is
 * dynamic (latest value + zone + trend, V1), and the current score is shown as
 * an end-of-line data label so zone is conveyed by the NUMBER, not by dot hue
 * alone — readable for red-green colorblind users (~8% of men, V3).
 */
@Component({
  selector: "app-readiness-trend",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (chart(); as c) {
      <svg
        [attr.viewBox]="viewBox"
        preserveAspectRatio="none"
        class="rt-svg"
        role="img"
        [attr.aria-label]="ariaLabel()"
      >
        <!-- signature chart gradients — visual only, zones stay in state
             colors + the numeric label (see tokens: --chart-*) -->
        <defs>
          <linearGradient id="rtLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style="stop-color: var(--chart-stroke-a)" />
            <stop offset="1" style="stop-color: var(--chart-stroke-b)" />
          </linearGradient>
          <linearGradient id="rtArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style="stop-color: var(--chart-area-a)" />
            <stop offset="1" style="stop-color: var(--chart-area-b)" />
          </linearGradient>
        </defs>
        <!-- high (75) / low (55) reference lines, labeled -->
        <line
          x1="0"
          [attr.y1]="y(75)"
          [attr.x2]="w"
          [attr.y2]="y(75)"
          class="rt-grid"
        />
        <text x="3" [attr.y]="y(75) - 3" class="rt-axis">75</text>
        <line
          x1="0"
          [attr.y1]="y(55)"
          [attr.x2]="w"
          [attr.y2]="y(55)"
          class="rt-grid"
        />
        <text x="3" [attr.y]="y(55) - 3" class="rt-axis">55</text>
        <polygon [attr.points]="c.area" class="rt-area" />
        <polyline [attr.points]="c.points" class="rt-line" />
        <circle
          [attr.cx]="c.last.x"
          [attr.cy]="c.last.y"
          r="4"
          class="rt-dot {{ c.last.cls }}"
        />
        <!-- V3: the score value itself (non-color encoder of the zone) -->
        <text
          [attr.x]="c.last.x - 7"
          [attr.y]="c.last.y - 7"
          text-anchor="end"
          class="rt-value {{ c.last.cls }}"
        >
          {{ c.last.score }}
        </text>
      </svg>
      <div class="rt-x">
        <small class="muted">{{ firstLabel() }}</small>
        <small class="muted">today</small>
      </div>
      <!-- V4: name the y-axis + its scale/direction (the 55/75 reference lines
           alone don't say "of what"). -->
      <small class="rt-cap muted"
        >Readiness score · 0–100, higher is better</small
      >
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
      .rt-axis {
        font-size: 10px;
        fill: var(--text-faint);
        font-variant-numeric: tabular-nums;
      }
      .rt-line {
        fill: none;
        stroke: url(#rtLine);
        stroke-width: 2.5;
        stroke-linejoin: round;
        stroke-linecap: round;
        vector-effect: non-scaling-stroke;
      }
      .rt-area {
        fill: url(#rtArea);
        stroke: none;
      }
      /* endpoint keeps its ZONE color (meaning) and glows in that same hue —
         the gradient never encodes state. */
      .rt-dot {
        stroke: var(--surface);
        stroke-width: 2;
        color: var(--accent);
        fill: currentColor;
        vector-effect: non-scaling-stroke;
        filter: drop-shadow(0 0 4px currentColor);
      }
      .rt-dot.danger {
        color: var(--danger);
      }
      .rt-dot.caution {
        color: var(--warn);
      }
      .rt-dot.good {
        color: var(--good);
      }
      .rt-value {
        font-size: 12px;
        font-weight: 700;
        fill: var(--text-strong);
      }
      .rt-value.danger {
        fill: var(--danger);
      }
      .rt-value.caution {
        fill: var(--warn);
      }
      .rt-value.good {
        fill: var(--good);
      }
      .rt-x {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
      }
      .rt-cap {
        display: block;
        margin-top: 2px;
        font-size: 0.7rem;
      }
    `,
  ],
})
export class ReadinessTrendComponent implements OnInit {
  private readonly readiness = inject(ReadinessService);

  /** Fetch/plot window in days (default 14). */
  readonly days = input(14);
  /** When false, the parent already populated ReadinessService.history — the
   * component only renders (no self-fetch). */
  readonly autoLoad = input(true);

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

  /** Dynamic screen-reader description (V1): latest value + zone + direction. */
  readonly ariaLabel = computed(() => {
    const s = this.series();
    if (s.length < 2) return "Readiness trend, not enough data yet.";
    const last = Math.round(s[s.length - 1].score);
    const prev = s[s.length - 2].score;
    const dir = last > prev ? "up" : last < prev ? "down" : "steady";
    const zone = last < 55 ? "low" : last <= 75 ? "moderate" : "good";
    return `Readiness over the last ${s.length} check-ins. Latest ${last} of 100, ${zone}, trending ${dir}. Reference lines at 55 and 75.`;
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
    return {
      points,
      area,
      last: { ...pts[n - 1], cls, score: Math.round(lastScore) },
    };
  });

  ngOnInit(): void {
    // server scopes by auth; parent may own the fetch (autoLoad=false)
    if (this.autoLoad()) {
      this.readiness
        .getHistory("", this.days())
        .subscribe({ error: () => undefined });
    }
  }

  /** Map a 0–100 score to the SVG y (100 → top, 0 → bottom). */
  y(score: number): number {
    return PAD_BOTTOM - (clamp(score, 0, 100) / 100) * (PAD_BOTTOM - PAD_TOP);
  }
}
