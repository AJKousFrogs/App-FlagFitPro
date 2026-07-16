import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { bars, linePath, type Bar } from "./perf-viz.geometry";

/**
 * ff-load-timeline — daily training load (bars) with acute (7-day EWMA) and
 * chronic (21-day) load lines. ONE AU axis — no dual-scale (the #1 chart
 * mistake). Rest days draw no bar. Today's bar is highlighted. Acute/chronic
 * lines share the bars' AU scale, so their crossing IS the load story.
 */
@Component({
  selector: "app-ff-load-timeline",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (daily().length > 1) {
      <svg
        [attr.viewBox]="'0 0 ' + W + ' ' + H"
        class="lt"
        role="img"
        [attr.aria-label]="aria()"
      >
        <defs>
          <linearGradient [attr.id]="barId" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stop-color="var(--accent-soft, #0b4a30)" />
            <stop offset="1" stop-color="var(--accent)" />
          </linearGradient>
        </defs>
        @for (g of gridLines(); track g.v) {
          <line
            class="gl"
            [attr.x1]="L"
            [attr.x2]="W - R"
            [attr.y1]="g.y"
            [attr.y2]="g.y"
          />
          <text
            class="ax"
            [attr.x]="L - 6"
            [attr.y]="g.y + 3"
            text-anchor="end"
          >
            {{ g.v }}
          </text>
        }
        @for (b of loadBars(); track b.index) {
          <rect
            class="bar"
            [class.today]="b.index === daily().length - 1"
            [attr.x]="b.x"
            [attr.y]="b.y"
            [attr.width]="b.width"
            [attr.height]="b.height"
            rx="2.2"
            [attr.fill]="'url(#' + barId + ')'"
            [attr.aria-label]="b.value + ' AU'"
          ></rect>
        }
        <path [attr.d]="chronicPath()" class="chronic" />
        <path [attr.d]="acutePath()" class="acute" />
        @for (t of xTicks(); track t.i) {
          <text class="ax" [attr.x]="t.x" [attr.y]="H - 7" text-anchor="middle">
            {{ t.label }}
          </text>
        }
      </svg>
      <div class="leg">
        <span class="li"><i class="sw bar"></i>Daily load</span>
        <span class="li"><i class="sw acute"></i>Acute (7d)</span>
        <span class="li"><i class="sw chronic"></i>Chronic (21d)</span>
      </div>
    } @else {
      <p class="empty">Log a few sessions to see your load timeline.</p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .lt {
        display: block;
        width: 100%;
        height: auto;
        overflow: visible;
      }
      .gl {
        stroke: var(--border-soft);
        stroke-width: 1;
        stroke-dasharray: 2 5;
      }
      .ax {
        font-family: var(--font-mono);
        font-size: 9.5px;
        fill: var(--text-faint);
      }
      .bar.today {
        fill: var(--accent) !important;
      }
      .acute {
        fill: none;
        stroke: var(--accent-2);
        stroke-width: 1.8;
        vector-effect: non-scaling-stroke;
        stroke-linejoin: round;
      }
      .chronic {
        fill: none;
        stroke: var(--text-faint);
        stroke-width: 1.6;
        stroke-dasharray: 2 4;
        vector-effect: non-scaling-stroke;
      }
      .leg {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 10px;
      }
      .li {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--text-muted);
      }
      .sw {
        width: 12px;
        height: 3px;
        border-radius: 2px;
        display: inline-block;
      }
      .sw.bar {
        background: linear-gradient(
          90deg,
          var(--accent-soft, #0b4a30),
          var(--accent)
        );
      }
      .sw.acute {
        background: var(--accent-2);
      }
      .sw.chronic {
        background: var(--text-faint);
      }
      .empty {
        margin: 0;
        color: var(--text-faint);
        font-size: 12.5px;
      }
    `,
  ],
})
export class LoadTimelineComponent {
  readonly daily = input<readonly number[]>([]);
  readonly acute = input<readonly number[]>([]);
  readonly chronic = input<readonly number[]>([]);

  readonly W = 560;
  readonly H = 190;
  readonly L = 30;
  readonly R = 8;
  readonly T = 10;
  readonly B = 26;
  private static seq = 0;
  readonly barId = `lt-b-${++LoadTimelineComponent.seq}`;

  private readonly plot = computed(() => ({
    left: this.L,
    top: this.T,
    width: this.W - this.L - this.R,
    height: this.H - this.T - this.B,
  }));

  private readonly maxV = computed(() => {
    const all = [...this.daily(), ...this.acute(), ...this.chronic()].filter(
      (v) => Number.isFinite(v),
    );
    return (all.length ? Math.max(...all) : 1) * 1.08;
  });

  readonly loadBars = computed<Bar[]>(() =>
    bars([...this.daily()], this.maxV(), this.plot(), 0.6),
  );

  private y(v: number): number {
    const p = this.plot();
    return +(p.top + p.height - (v / this.maxV()) * p.height).toFixed(2);
  }
  private xAt(i: number, n: number): number {
    return this.L + (i / (n - 1)) * this.plot().width;
  }
  private path(series: readonly number[]): string {
    const n = series.length;
    if (n < 2) return "";
    return linePath(
      series.map((v, i) => ({ x: +this.xAt(i, n).toFixed(2), y: this.y(v) })),
    );
  }
  readonly acutePath = computed(() => this.path(this.acute()));
  readonly chronicPath = computed(() => this.path(this.chronic()));

  readonly gridLines = computed(() => {
    const max = this.maxV();
    return [0.25, 0.5, 0.75, 1].map((g) => ({
      v: Math.round(max * g),
      y: this.y(max * g),
    }));
  });

  readonly xTicks = computed(() => {
    const n = this.daily().length;
    if (n < 2) return [];
    const idxs = [
      0,
      Math.floor((n - 1) / 3),
      Math.floor((2 * (n - 1)) / 3),
      n - 1,
    ];
    return idxs.map((i) => ({
      i,
      x: +this.xAt(i, n).toFixed(2),
      label: i === n - 1 ? "today" : `-${n - 1 - i}d`,
    }));
  });

  readonly aria = computed(
    () =>
      `Training load over ${this.daily().length} days with acute and chronic load lines.`,
  );
}
