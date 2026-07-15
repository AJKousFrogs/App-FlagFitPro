import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { acwrZone, bandY, linePath } from "./perf-viz.geometry";

/**
 * ff-acwr-band — the acute:chronic ratio over time against its risk zones,
 * drawn as horizontal washes (safe 0.8–1.3 green, caution 1.3–1.5 amber,
 * danger >1.5 red). The line reads against the bands; the endpoint keeps its
 * ZONE colour and the value is direct-labelled (number encodes zone, not hue
 * alone). Cohort bands can be passed in (youth/masters tighten to 1.2/1.4).
 */
@Component({
  selector: "app-ff-acwr-band",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (series().length > 1) {
      <svg
        [attr.viewBox]="'0 0 ' + W + ' ' + H"
        class="ab"
        role="img"
        [attr.aria-label]="aria()"
      >
        <defs>
          <linearGradient [attr.id]="lineId" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="var(--accent)" />
            <stop offset="1" stop-color="var(--accent-2)" />
          </linearGradient>
        </defs>
        <rect
          class="b-safe"
          [attr.x]="L"
          [attr.width]="W - L - R"
          [attr.y]="y(sweetHigh())"
          [attr.height]="y(sweetLow()) - y(sweetHigh())"
        />
        <rect
          class="b-caut"
          [attr.x]="L"
          [attr.width]="W - L - R"
          [attr.y]="y(danger())"
          [attr.height]="y(sweetHigh()) - y(danger())"
        />
        <rect
          class="b-dang"
          [attr.x]="L"
          [attr.width]="W - L - R"
          [attr.y]="T"
          [attr.height]="y(danger()) - T"
        />
        @for (l of refLines(); track l.v) {
          <line class="bl" [attr.x1]="L" [attr.x2]="W - R" [attr.y1]="l.y" [attr.y2]="l.y" />
          <text class="blab" [attr.x]="W - R + 2" [attr.y]="l.y + 3">{{ l.v }}</text>
        }
        <path [attr.d]="path()" class="ln" [attr.stroke]="'url(#' + lineId + ')'" />
        <circle class="end {{ zone() }}" [attr.cx]="end().x" [attr.cy]="end().y" r="4" />
        <text
          class="val tnum {{ zone() }}"
          [attr.x]="end().x - 7"
          [attr.y]="end().y - 8"
          text-anchor="end"
        >
          {{ latest() }}
        </text>
      </svg>
    } @else {
      <p class="empty">Not enough sessions logged for an ACWR trend yet.</p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ab {
        display: block;
        width: 100%;
        height: auto;
        overflow: visible;
      }
      .b-safe {
        fill: color-mix(in srgb, var(--good) 9%, transparent);
      }
      .b-caut {
        fill: color-mix(in srgb, var(--caution) 8%, transparent);
      }
      .b-dang {
        fill: color-mix(in srgb, var(--danger) 9%, transparent);
      }
      .bl {
        stroke: var(--border-soft);
        stroke-width: 1;
      }
      .blab {
        font-family: var(--font-mono);
        font-size: 9px;
        fill: var(--text-faint);
      }
      .ln {
        fill: none;
        stroke-width: 2.4;
        stroke-linejoin: round;
        vector-effect: non-scaling-stroke;
      }
      .end {
        color: var(--good);
        fill: currentColor;
        stroke: var(--surface);
        stroke-width: 2;
        filter: drop-shadow(0 0 6px currentColor);
      }
      .end.caution {
        color: var(--warn);
      }
      .end.danger {
        color: var(--danger);
      }
      .end.neutral {
        color: var(--text-faint);
      }
      .val {
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: 12px;
        fill: var(--text-strong);
      }
      .val.caution {
        fill: var(--warn);
      }
      .val.danger {
        fill: var(--danger);
      }
      .empty {
        margin: 0;
        color: var(--text-faint);
        font-size: 12.5px;
      }
    `,
  ],
})
export class AcwrBandComponent {
  readonly series = input<readonly number[]>([]);
  /** Cohort bands (adult defaults; youth/masters tighten to 1.2/1.4). */
  readonly sweetLow = input(0.8);
  readonly sweetHigh = input(1.3);
  readonly danger = input(1.5);

  readonly W = 360;
  readonly H = 190;
  readonly L = 26;
  readonly R = 14;
  readonly T = 10;
  readonly B = 22;
  private readonly lo = 0.6;
  private readonly hi = 1.7;
  private static seq = 0;
  readonly lineId = `ab-l-${++AcwrBandComponent.seq}`;

  private readonly clean = computed(() =>
    this.series().filter((v) => Number.isFinite(v)),
  );

  private readonly plot = { top: this.T, height: this.H - this.T - this.B };
  y(v: number): number {
    return bandY(v, this.lo, this.hi, this.plot);
  }
  private xAt(i: number, n: number): number {
    return this.L + (i / (n - 1)) * (this.W - this.L - this.R);
  }

  readonly path = computed(() => {
    const s = this.clean();
    const n = s.length;
    if (n < 2) return "";
    return linePath(s.map((v, i) => ({ x: +this.xAt(i, n).toFixed(2), y: this.y(v) })));
  });
  readonly end = computed(() => {
    const s = this.clean();
    const n = s.length;
    if (n < 1) return { x: 0, y: 0 };
    return { x: +this.xAt(n - 1, n).toFixed(2), y: this.y(s[n - 1]) };
  });
  readonly latest = computed(() => {
    const s = this.clean();
    return s.length ? s[s.length - 1].toFixed(2) : "—";
  });
  readonly zone = computed(() => {
    const s = this.clean();
    return acwrZone(s.length ? s[s.length - 1] : null);
  });

  readonly refLines = computed(() =>
    [this.sweetLow(), this.sweetHigh(), this.danger()].map((v) => ({
      v: v.toFixed(1),
      y: this.y(v),
    })),
  );

  readonly aria = computed(() => {
    const s = this.clean();
    if (s.length < 2) return "ACWR trend, not enough data.";
    return `Acute chronic ratio over ${s.length} days, latest ${this.latest()}, ${this.zone()} zone. Safe band ${this.sweetLow()} to ${this.sweetHigh()}.`;
  });
}
