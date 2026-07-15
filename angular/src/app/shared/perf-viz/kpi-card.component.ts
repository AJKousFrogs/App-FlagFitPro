import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { SparklineComponent } from "./sparkline.component";
import { DeltaChipComponent } from "./delta-chip.component";

/**
 * ff-kpi-card — the compact metric tile: an uppercase mono label, a big
 * display-face figure with unit, an optional delta chip OR status chip, and an
 * optional inline sparkline. Summary-first: the number leads, the trend
 * supports. An optional `attn` severity stripe flags a card that needs action.
 * Null value → an honest "—" with an empty-state hint (never a fabricated 0).
 */
@Component({
  selector: "app-ff-kpi-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SparklineComponent, DeltaChipComponent],
  template: `
    <div class="kpi" [class.attn]="attn()" [style.--stripe]="stripe()">
      <div class="top">
        <span class="lab">{{ label() }}</span>
        @if (chip(); as ch) {
          <span class="chip {{ chipTone() }}">{{ ch }}</span>
        } @else if (hasDelta()) {
          <app-ff-delta-chip
            [value]="delta()"
            [unit]="deltaUnit()"
            [invert]="deltaInvert()"
            [digits]="deltaDigits()"
          />
        }
      </div>
      <div class="fig">
        @if (hasValue()) {
          <span class="n tnum">{{ value() }}</span>
          @if (unit()) {
            <span class="u">{{ unit() }}</span>
          }
        } @else {
          <span class="n dash">—</span>
          <span class="u">{{ emptyHint() }}</span>
        }
      </div>
      @if (series().length > 1) {
        <div class="spark">
          <app-ff-sparkline [series]="series()" [label]="label()" />
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .kpi {
        display: flex;
        flex-direction: column;
        gap: 10px;
        height: 100%;
        min-height: 118px;
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--surface) 100%, var(--text-strong) 2%),
          var(--surface)
        );
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        box-shadow:
          var(--e-1),
          inset 0 1px 0 rgba(255, 255, 255, 0.045);
        padding: var(--s-4);
        position: relative;
        overflow: hidden;
      }
      .kpi.attn::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--stripe, var(--warn));
      }
      .top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }
      .lab {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.13em;
        text-transform: uppercase;
        color: var(--text-faint);
      }
      .fig {
        display: flex;
        align-items: baseline;
        gap: 5px;
      }
      .n {
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 31px;
        line-height: 1;
        color: var(--text-strong);
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
      }
      .n.dash {
        color: var(--text-faint);
      }
      .u {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--text-faint);
      }
      .spark {
        margin-top: auto;
        --spk-h: 40px;
      }
      .chip {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        border-radius: var(--r-pill);
        padding: 3px 8px;
        border: 1px solid transparent;
      }
      .chip.good {
        color: var(--good);
        border-color: color-mix(in srgb, var(--good) 30%, transparent);
        background: color-mix(in srgb, var(--good) 10%, transparent);
      }
      .chip.warn {
        color: var(--warn);
        border-color: color-mix(in srgb, var(--warn) 30%, transparent);
        background: color-mix(in srgb, var(--warn) 10%, transparent);
      }
      .chip.danger {
        color: var(--danger);
        border-color: color-mix(in srgb, var(--danger) 30%, transparent);
        background: color-mix(in srgb, var(--danger) 10%, transparent);
      }
      .chip.neutral {
        color: var(--text-muted);
        border-color: var(--border);
        background: var(--surface-2);
      }
    `,
  ],
})
export class KpiCardComponent {
  readonly label = input("");
  readonly value = input<string | number | null>(null);
  readonly unit = input("");
  readonly emptyHint = input("no data yet");

  /** Delta chip (mutually exclusive with `chip`). */
  readonly delta = input<number | null>(null);
  readonly deltaUnit = input("");
  readonly deltaInvert = input(false);
  readonly deltaDigits = input(1);

  /** Status chip text; when set, replaces the delta chip. */
  readonly chip = input<string | null>(null);
  readonly chipTone = input<"good" | "warn" | "danger" | "neutral">("neutral");

  /** Inline sparkline series (optional). */
  readonly series = input<readonly number[]>([]);

  /** Severity stripe. */
  readonly attn = input(false);
  readonly stripe = input("var(--warn)");

  readonly hasValue = computed(() => {
    const v = this.value();
    return v !== null && v !== undefined && v !== "";
  });
  readonly hasDelta = computed(() => {
    const d = this.delta();
    return typeof d === "number" && Number.isFinite(d);
  });
}
