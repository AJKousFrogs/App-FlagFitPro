import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

/**
 * ff-delta-chip — a change indicator. Direction is encoded by an ARROW GLYPH
 * (▲ / ▼ / —) as well as colour, so it is legible for red-green colourblind
 * users (~8% of men). `invert` flips the good/bad colour mapping for metrics
 * where DOWN is better (soreness, stress, ACWR toward the sweet spot from
 * above). No value / non-finite → renders nothing.
 */
@Component({
  selector: "app-ff-delta-chip",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <span class="chip {{ tone() }}" [attr.aria-label]="aria()">
        <span class="arw" aria-hidden="true">{{ arrow() }}</span>
        {{ display() }}
      </span>
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 500;
        border-radius: var(--r-pill);
        padding: 3px 8px;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .arw {
        font-size: 10px;
      }
      .up {
        color: var(--good);
        background: color-mix(in srgb, var(--good) 13%, transparent);
      }
      .down {
        color: var(--danger);
        background: color-mix(in srgb, var(--danger) 13%, transparent);
      }
      .flat {
        color: var(--text-muted);
        background: var(--surface-2);
      }
    `,
  ],
})
export class DeltaChipComponent {
  /** Signed change value. Positive = up-arrow (unless `invert`). */
  readonly value = input<number | null>(null);
  /** Unit suffix, e.g. "h", "%", "kg". */
  readonly unit = input("");
  /** True when DOWN is the healthy direction (soreness, stress). */
  readonly invert = input(false);
  /** Decimal places for the displayed magnitude. */
  readonly digits = input(1);

  readonly show = computed(() => {
    const v = this.value();
    return typeof v === "number" && Number.isFinite(v);
  });

  private readonly sign = computed(() => Math.sign(this.value() ?? 0));

  readonly arrow = computed(() => {
    const s = this.sign();
    return s > 0 ? "▲" : s < 0 ? "▼" : "—";
  });

  readonly tone = computed(() => {
    const s = this.sign();
    if (s === 0) return "flat";
    const good = this.invert() ? s < 0 : s > 0;
    return good ? "up" : "down";
  });

  readonly display = computed(() => {
    const v = this.value() ?? 0;
    const mag = Math.abs(v).toFixed(this.digits());
    return `${mag}${this.unit()}`;
  });

  readonly aria = computed(() => {
    const s = this.sign();
    const dir = s > 0 ? "up" : s < 0 ? "down" : "no change";
    return `${dir} ${this.display()}`;
  });
}
