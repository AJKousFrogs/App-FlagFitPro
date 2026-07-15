import {
  ChangeDetectionStrategy,
  Component,
  input,
} from "@angular/core";

export interface WellnessRow {
  label: string;
  /** Current value, 0–100. */
  value: number;
  /** The athlete's own trailing baseline for this item, 0–100. */
  baseline?: number | null;
  /** True when a HIGHER value is worse (soreness, stress). */
  invert?: boolean;
}

/**
 * ff-wellness-bars — horizontal bars for wellness items against the athlete's
 * OWN baseline (a tick marks the norm), so change reads at a glance rather than
 * an absolute the reader has to interpret. Higher-is-worse items (soreness,
 * stress) get a warm fill; the delta text is coloured by whether the change is
 * an improvement, respecting each item's direction.
 */
@Component({
  selector: "app-ff-wellness-bars",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wl">
      @for (r of rows(); track r.label) {
        <div class="row">
          <span class="lbl">{{ r.label }}</span>
          <div
            class="track"
            role="img"
            [attr.aria-label]="aria(r)"
          >
            <div
              class="fill"
              [class.warn]="r.invert"
              [style.width.%]="clamp(r.value)"
            ></div>
            @if (hasBase(r)) {
              <div class="base" [style.left.%]="clamp(r.baseline)"></div>
            }
          </div>
          <span class="val tnum">
            {{ round(r.value) }}
            @if (delta(r) !== null) {
              <span class="d {{ deltaTone(r) }}">{{ deltaLabel(r) }}</span>
            }
          </span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .wl {
        display: flex;
        flex-direction: column;
        gap: 13px;
      }
      .row {
        display: grid;
        grid-template-columns: 74px 1fr auto;
        align-items: center;
        gap: 12px;
      }
      .lbl {
        font-size: 12px;
        color: var(--text-muted);
      }
      .track {
        height: 8px;
        border-radius: var(--r-pill);
        background: var(--surface-2);
        position: relative;
        overflow: visible;
      }
      .fill {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        border-radius: var(--r-pill);
        background: linear-gradient(90deg, var(--accent-press, var(--good)), var(--good));
        transition: width 0.9s var(--ease-out, ease);
        max-width: 100%;
      }
      .fill.warn {
        background: linear-gradient(90deg, var(--caution), var(--warn));
      }
      .base {
        position: absolute;
        top: -3px;
        bottom: -3px;
        width: 2px;
        background: var(--text-faint);
        border-radius: 2px;
      }
      .val {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--text);
        min-width: 62px;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .d {
        font-size: 10px;
      }
      .d.up {
        color: var(--good);
      }
      .d.down {
        color: var(--danger);
      }
      .d.flat {
        color: var(--text-faint);
      }
    `,
  ],
})
export class WellnessBarsComponent {
  readonly rows = input<readonly WellnessRow[]>([]);

  clamp(v: number | null | undefined): number {
    if (typeof v !== "number" || !Number.isFinite(v)) return 0;
    return Math.min(100, Math.max(0, v));
  }
  round(v: number): number {
    return Math.round(v);
  }
  hasBase(r: WellnessRow): boolean {
    return typeof r.baseline === "number" && Number.isFinite(r.baseline);
  }
  delta(r: WellnessRow): number | null {
    if (!this.hasBase(r)) return null;
    return Math.round(r.value - (r.baseline as number));
  }
  deltaLabel(r: WellnessRow): string {
    const d = this.delta(r) ?? 0;
    return ` (${d >= 0 ? "+" : ""}${d})`;
  }
  deltaTone(r: WellnessRow): string {
    const d = this.delta(r) ?? 0;
    if (d === 0) return "flat";
    const good = r.invert ? d < 0 : d > 0;
    return good ? "up" : "down";
  }
  aria(r: WellnessRow): string {
    const base = this.hasBase(r)
      ? `, baseline ${this.round(r.baseline as number)}`
      : "";
    return `${r.label} ${this.round(r.value)} of 100${base}.`;
  }

}
