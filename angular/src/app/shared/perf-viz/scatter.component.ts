import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { readinessZone, scaleLinear, type PerfZone } from "./perf-viz.geometry";

export interface ScatterPoint {
  /** Athlete display name (for the dot label + hover). */
  label: string;
  /** X value — session load (sRPE AU). */
  x: number;
  /** Y value — readiness 0–100. */
  y: number;
}

interface PlottedDot {
  cx: number;
  cy: number;
  label: string;
  x: number;
  y: number;
  zone: PerfZone;
  /** In the "high load + low readiness" attention quadrant. */
  attn: boolean;
}

/**
 * ff-scatter — load × readiness, the coach's "who needs a conversation today"
 * view. X = session load (sRPE AU), Y = readiness (0–100). Readiness zones are
 * horizontal washes (< 55 danger, 55–75 caution, > 75 good); the HIGH-load +
 * LOW-readiness quadrant is outlined as the attention zone. Dots in that
 * quadrant are labelled directly (selective labels — not every point). One
 * plot, two real measures on their own axes — not a dual-axis line.
 */
@Component({
  selector: "app-ff-scatter",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dots().length) {
      <svg
        [attr.viewBox]="'0 0 ' + W + ' ' + H"
        class="sc"
        role="img"
        [attr.aria-label]="aria()"
      >
        <!-- readiness zone washes -->
        <rect
          class="z-good"
          [attr.x]="L"
          [attr.width]="iw"
          [attr.y]="yFor(100)"
          [attr.height]="yFor(75) - yFor(100)"
        />
        <rect
          class="z-caut"
          [attr.x]="L"
          [attr.width]="iw"
          [attr.y]="yFor(75)"
          [attr.height]="yFor(55) - yFor(75)"
        />
        <rect
          class="z-dang"
          [attr.x]="L"
          [attr.width]="iw"
          [attr.y]="yFor(55)"
          [attr.height]="yFor(0) - yFor(55)"
        />
        <!-- attention quadrant: high load (right of median) + low readiness -->
        <rect
          class="attn"
          [attr.x]="attnBox().x"
          [attr.y]="attnBox().y"
          [attr.width]="attnBox().w"
          [attr.height]="attnBox().h"
        />
        <text
          class="attn-lab"
          [attr.x]="W - R - 4"
          [attr.y]="yFor(0) - 6"
          text-anchor="end"
        >
          high load · low readiness
        </text>
        <!-- axes -->
        <line
          class="ax-l"
          [attr.x1]="L"
          [attr.y1]="T"
          [attr.x2]="L"
          [attr.y2]="yFor(0)"
        />
        <line
          class="ax-l"
          [attr.x1]="L"
          [attr.y1]="yFor(0)"
          [attr.x2]="W - R"
          [attr.y2]="yFor(0)"
        />
        @for (t of yTicks; track t) {
          <text
            class="ax"
            [attr.x]="L - 6"
            [attr.y]="yFor(t) + 3"
            text-anchor="end"
          >
            {{ t }}
          </text>
        }
        <text
          class="ax-t"
          [attr.x]="L - 22"
          [attr.y]="(T + yFor(0)) / 2"
          [attr.transform]="
            'rotate(-90 ' + (L - 22) + ' ' + (T + yFor(0)) / 2 + ')'
          "
          text-anchor="middle"
        >
          readiness
        </text>
        <text
          class="ax-t"
          [attr.x]="(L + W - R) / 2"
          [attr.y]="H - 4"
          text-anchor="middle"
        >
          session load (AU)
        </text>
        <!-- dots -->
        @for (d of dots(); track d.label) {
          <circle
            class="dot {{ d.zone }}"
            [class.attn]="d.attn"
            [attr.cx]="d.cx"
            [attr.cy]="d.cy"
            r="5"
            [attr.aria-label]="d.label + ': readiness ' + d.y + ', load ' + d.x"
          >
            <title>
              {{ d.label }} — readiness {{ d.y }}, load {{ d.x }} AU
            </title>
          </circle>
          @if (d.attn) {
            <text class="dot-lab" [attr.x]="d.cx + 8" [attr.y]="d.cy + 3">
              {{ d.label }}
            </text>
          }
        }
      </svg>
    } @else {
      <p class="empty">
        No athletes with both a check-in and a logged session today.
      </p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .sc {
        display: block;
        width: 100%;
        height: auto;
        overflow: visible;
      }
      .z-good {
        fill: color-mix(in srgb, var(--good) 7%, transparent);
      }
      .z-caut {
        fill: color-mix(in srgb, var(--warn) 6%, transparent);
      }
      .z-dang {
        fill: color-mix(in srgb, var(--danger) 7%, transparent);
      }
      .attn {
        fill: color-mix(in srgb, var(--danger) 6%, transparent);
        stroke: color-mix(in srgb, var(--danger) 40%, transparent);
        stroke-width: 1;
        stroke-dasharray: 3 4;
      }
      .attn-lab {
        font-family: var(--font-mono);
        font-size: 9px;
        fill: color-mix(in srgb, var(--danger) 80%, var(--text-faint));
        letter-spacing: 0.02em;
      }
      .ax-l {
        stroke: var(--border-soft);
        stroke-width: 1;
      }
      .ax {
        font-family: var(--font-mono);
        font-size: 9.5px;
        fill: var(--text-faint);
      }
      .ax-t {
        font-family: var(--font-mono);
        font-size: 9.5px;
        fill: var(--text-faint);
        letter-spacing: 0.04em;
      }
      .dot {
        color: var(--good);
        fill: currentColor;
        stroke: var(--surface);
        stroke-width: 1.5;
        transition: r 0.12s var(--ease-out, ease);
      }
      .dot.caution {
        color: var(--warn);
      }
      .dot.danger {
        color: var(--danger);
      }
      .dot.neutral {
        color: var(--text-faint);
      }
      .dot.attn {
        stroke: var(--danger);
        stroke-width: 2;
        filter: drop-shadow(
          0 0 5px color-mix(in srgb, var(--danger) 60%, transparent)
        );
      }
      .dot:hover {
        r: 7;
      }
      .dot-lab {
        font-family: var(--font-mono);
        font-size: 10px;
        fill: var(--text);
        font-weight: 500;
      }
      .empty {
        margin: 0;
        color: var(--text-faint);
        font-size: 12.5px;
      }
    `,
  ],
})
export class ScatterComponent {
  /** Athlete points; only those with finite x AND y are plotted. */
  readonly points = input<readonly ScatterPoint[]>([]);

  readonly W = 460;
  readonly H = 300;
  readonly L = 40;
  readonly R = 14;
  readonly T = 14;
  readonly B = 34;
  readonly iw = this.W - this.L - this.R;
  readonly yTicks = [0, 25, 55, 75, 100];

  private readonly clean = computed(() =>
    this.points().filter(
      (p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0,
    ),
  );

  private readonly maxX = computed(
    () => Math.max(100, ...this.clean().map((p) => p.x)) * 1.1,
  );
  /** The load median splits the "high load" half for the attention quadrant. */
  private readonly medianX = computed(() => {
    const xs = this.clean()
      .map((p) => p.x)
      .sort((a, b) => a - b);
    if (!xs.length) return 0;
    const m = Math.floor(xs.length / 2);
    return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2;
  });

  yFor(readiness: number): number {
    return scaleLinear(readiness, 0, 100, this.H - this.B, this.T);
  }
  private xFor(load: number): number {
    return scaleLinear(load, 0, this.maxX(), this.L, this.W - this.R);
  }

  readonly dots = computed<PlottedDot[]>(() => {
    const med = this.medianX();
    return this.clean().map((p) => ({
      cx: this.xFor(p.x),
      cy: this.yFor(p.y),
      label: p.label,
      x: Math.round(p.x),
      y: Math.round(p.y),
      zone: readinessZone(p.y),
      attn: p.y < 55 && p.x >= med,
    }));
  });

  readonly attnBox = computed(() => {
    const x = this.xFor(this.medianX());
    const yTop = this.yFor(55);
    return {
      x,
      y: yTop,
      w: this.W - this.R - x,
      h: this.yFor(0) - yTop,
    };
  });

  readonly aria = computed(() => {
    const d = this.dots();
    const flagged = d.filter((x) => x.attn).length;
    return `Load versus readiness for ${d.length} athletes. ${flagged} in the high-load, low-readiness zone.`;
  });
}
