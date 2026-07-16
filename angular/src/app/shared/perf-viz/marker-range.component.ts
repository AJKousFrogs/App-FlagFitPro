import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

export type MarkerFlagTone = "good" | "caution" | "danger" | "neutral";

/**
 * ff-marker-range — a single bloodwork marker's value against its reference
 * range. The [low, high] normal band is a calm wash; the value sits as a dot
 * whose colour + a text flag (never colour alone) carry in/out-of-range. The
 * domain pads the range so an out-of-range value still shows on-scale.
 *
 * GDPR: this renders RAW marker values, so it MUST only be used inside the
 * monitoring report's `bloodwork.mode === 'raw'` block — the clinical-lens +
 * consent gate the server already enforces. When reference bounds are absent
 * it renders nothing (the caller shows the plain flag chip instead) — never a
 * fabricated range.
 */
@Component({
  selector: "app-ff-marker-range",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (geom(); as g) {
      <div
        class="mr"
        role="img"
        [attr.aria-label]="aria()"
        [style.--band-l.%]="g.bandLeft"
        [style.--band-r.%]="g.bandRight"
        [style.--dot.%]="g.dotLeft"
      >
        <div class="track">
          <div class="band tone-{{ tone() }}"></div>
          <div class="tick lo" [style.left.%]="g.bandLeft"></div>
          <div class="tick hi" [style.left.%]="g.bandRight"></div>
          <div class="dot tone-{{ tone() }}"></div>
        </div>
        <div class="labels">
          <small class="mono">{{ low() }}</small>
          <small class="mono">{{ high() }}</small>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 120px;
      }
      .track {
        position: relative;
        height: 8px;
        border-radius: var(--r-pill);
        background: var(--surface-2);
        overflow: visible;
      }
      .band {
        position: absolute;
        top: 0;
        bottom: 0;
        left: var(--band-l);
        right: calc(100% - var(--band-r));
        border-radius: var(--r-pill);
        background: color-mix(in srgb, var(--good) 24%, transparent);
      }
      .band.tone-caution {
        background: color-mix(in srgb, var(--warn) 22%, transparent);
      }
      .band.tone-danger {
        background: color-mix(in srgb, var(--danger) 20%, transparent);
      }
      .tick {
        position: absolute;
        top: -2px;
        bottom: -2px;
        width: 1px;
        background: var(--text-faint);
      }
      .dot {
        position: absolute;
        top: 50%;
        left: var(--dot);
        width: 11px;
        height: 11px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        background: var(--good);
        border: 2px solid var(--surface);
        box-shadow: 0 0 6px color-mix(in srgb, currentColor 55%, transparent);
        color: var(--good);
      }
      .dot.tone-caution {
        background: var(--warn);
        color: var(--warn);
      }
      .dot.tone-danger {
        background: var(--danger);
        color: var(--danger);
      }
      .dot.tone-neutral {
        background: var(--text-faint);
        color: var(--text-faint);
      }
      .labels {
        display: flex;
        justify-content: space-between;
        margin-top: 3px;
        color: var(--text-faint);
      }
      .labels small {
        font-size: 9.5px;
        font-variant-numeric: tabular-nums;
      }
    `,
  ],
})
export class MarkerRangeComponent {
  readonly value = input<number | null>(null);
  readonly low = input<number | null>(null);
  readonly high = input<number | null>(null);
  readonly flag = input<string | null>(null);

  readonly tone = computed<MarkerFlagTone>(() => {
    const f = (this.flag() ?? "").toLowerCase();
    if (/(crit|severe|very)/.test(f)) return "danger";
    if (/(high|low|elevated|borderline|watch|out)/.test(f)) return "caution";
    if (/(normal|optimal|good|ok|in.?range)/.test(f)) return "good";
    return "neutral";
  });

  /** Positions (%) for the band + dot, or null when bounds are unusable. */
  readonly geom = computed(() => {
    const v = this.value();
    const lo = this.low();
    const hi = this.high();
    if (
      typeof lo !== "number" ||
      typeof hi !== "number" ||
      !Number.isFinite(lo) ||
      !Number.isFinite(hi) ||
      hi <= lo
    ) {
      return null;
    }
    const span = hi - lo;
    // Domain pads the range by 25% each side, and always includes the value.
    let dMin = lo - span * 0.25;
    let dMax = hi + span * 0.25;
    if (typeof v === "number" && Number.isFinite(v)) {
      dMin = Math.min(dMin, v - span * 0.1);
      dMax = Math.max(dMax, v + span * 0.1);
    }
    const dSpan = dMax - dMin || 1;
    const pct = (x: number) =>
      +Math.min(100, Math.max(0, ((x - dMin) / dSpan) * 100)).toFixed(2);
    return {
      bandLeft: pct(lo),
      bandRight: pct(hi),
      dotLeft: typeof v === "number" && Number.isFinite(v) ? pct(v) : 50,
    };
  });

  readonly aria = computed(() => {
    const v = this.value();
    return `Value ${v ?? "unknown"}, reference range ${this.low()} to ${this.high()}, flag ${this.flag() ?? "none"}.`;
  });
}
