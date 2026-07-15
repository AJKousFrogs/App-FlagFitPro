import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { readinessZone, ringDash, type PerfZone } from "./perf-viz.geometry";

/**
 * ff-readiness-ring — a radial gauge for a 0–max score. The ZONE is carried by
 * the centre number's colour AND surfaced as a text label ("Ready" / "Monitor"
 * / "Deload"), never colour alone. An optional personal `baseline` renders as a
 * tick on the track (audit C6 — the athlete's own normal). Null score → an
 * honest empty ring with a "log a check-in" affordance, never a fabricated 0.
 */
@Component({
  selector: "app-ff-readiness-ring",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ring" [style.--sz.px]="size()">
      <svg
        [attr.viewBox]="'0 0 ' + box + ' ' + box"
        [attr.width]="size()"
        [attr.height]="size()"
        role="img"
        [attr.aria-label]="aria()"
      >
        <circle
          class="track"
          [attr.cx]="c"
          [attr.cy]="c"
          [attr.r]="r"
          fill="none"
          [attr.stroke-width]="stroke"
        />
        @if (hasScore()) {
          <circle
            class="prog {{ zone() }}"
            [attr.cx]="c"
            [attr.cy]="c"
            [attr.r]="r"
            fill="none"
            [attr.stroke-width]="stroke"
            stroke-linecap="round"
            [attr.stroke-dasharray]="dash().circumference"
            [attr.stroke-dashoffset]="dash().offset"
            [attr.transform]="'rotate(-90 ' + c + ' ' + c + ')'"
          />
          @if (baselineTick(); as t) {
            <line
              class="tick"
              [attr.x1]="t.x1"
              [attr.y1]="t.y1"
              [attr.x2]="t.x2"
              [attr.y2]="t.y2"
            />
          }
        }
      </svg>
      <div class="mid">
        @if (hasScore()) {
          <div class="val tnum {{ zone() }}">{{ rounded() }}</div>
          <div class="of">/ {{ max() }}</div>
        } @else {
          <div class="dash">—</div>
          <div class="of">log check-in</div>
        }
      </div>
    </div>
    @if (showLabel()) {
      <div class="state {{ zone() }}">{{ zoneLabel() }}</div>
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .ring {
        position: relative;
        width: var(--sz);
        height: var(--sz);
      }
      svg {
        display: block;
        overflow: visible;
      }
      .track {
        stroke: var(--surface-raised, var(--surface-2));
      }
      .prog {
        color: var(--good);
        stroke: currentColor;
        filter: drop-shadow(0 0 7px color-mix(in srgb, currentColor 55%, transparent));
        transition: stroke-dashoffset 1s var(--ease-out, ease);
      }
      .prog.caution {
        color: var(--warn);
      }
      .prog.danger {
        color: var(--danger);
      }
      .prog.neutral {
        color: var(--text-faint);
      }
      .tick {
        stroke: var(--text-faint);
        stroke-width: 2;
      }
      .mid {
        position: absolute;
        inset: 0;
        display: grid;
        place-content: center;
        text-align: center;
      }
      .val {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: calc(var(--sz) * 0.3);
        line-height: 1;
        letter-spacing: -0.02em;
        color: var(--text-strong);
      }
      .val.caution {
        color: var(--warn);
      }
      .val.danger {
        color: var(--danger);
      }
      .val.good {
        color: var(--good);
      }
      .dash {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: calc(var(--sz) * 0.28);
        color: var(--text-faint);
      }
      .of {
        font-family: var(--font-mono);
        font-size: 10px;
        color: var(--text-faint);
        margin-top: 3px;
        letter-spacing: 0.04em;
      }
      .state {
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--good);
      }
      .state.caution {
        color: var(--warn);
      }
      .state.danger {
        color: var(--danger);
      }
      .state.neutral {
        color: var(--text-faint);
      }
    `,
  ],
})
export class ReadinessRingComponent {
  readonly score = input<number | null>(null);
  readonly max = input(100);
  readonly size = input(150);
  readonly baseline = input<number | null>(null);
  readonly showLabel = input(true);

  readonly box = 150;
  readonly c = 75;
  readonly stroke = 13;
  readonly r = 63;

  readonly hasScore = computed(() => {
    const s = this.score();
    return typeof s === "number" && Number.isFinite(s);
  });
  readonly rounded = computed(() => Math.round(this.score() ?? 0));
  readonly zone = computed<PerfZone>(() => readinessZone(this.score()));

  readonly zoneLabel = computed(() => {
    switch (this.zone()) {
      case "good":
        return "Ready · push";
      case "caution":
        return "Monitor";
      case "danger":
        return "Deload";
      default:
        return "No data";
    }
  });

  readonly dash = computed(() =>
    ringDash(this.r, (this.score() ?? 0) / (this.max() || 100)),
  );

  /** Baseline tick: a short radial mark at the athlete's own normal. */
  readonly baselineTick = computed(() => {
    const b = this.baseline();
    if (typeof b !== "number" || !Number.isFinite(b)) return null;
    const frac = Math.min(1, Math.max(0, b / (this.max() || 100)));
    const angle = -Math.PI / 2 + frac * 2 * Math.PI;
    const inner = this.r - this.stroke / 2 - 1;
    const outer = this.r + this.stroke / 2 + 1;
    return {
      x1: +(this.c + inner * Math.cos(angle)).toFixed(2),
      y1: +(this.c + inner * Math.sin(angle)).toFixed(2),
      x2: +(this.c + outer * Math.cos(angle)).toFixed(2),
      y2: +(this.c + outer * Math.sin(angle)).toFixed(2),
    };
  });

  readonly aria = computed(() => {
    if (!this.hasScore()) return "Readiness not logged yet.";
    return `Readiness ${this.rounded()} of ${this.max()}, ${this.zoneLabel()}.`;
  });
}
