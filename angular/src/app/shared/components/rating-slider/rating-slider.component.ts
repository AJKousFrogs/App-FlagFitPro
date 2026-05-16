import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";

/**
 * Rating Slider Component — replaces the wellness check-in's plain-HTML
 * 1-10 number inputs with a tappable, scannable, accessible scale.
 *
 * Design rationale (from live audit):
 * The deployed wellness check-in renders 8 fields as `<input type="number">`
 * with browser-default up/down spinners. The most-used daily ritual in the app
 * needs something faster than typing a digit per field. A 10-segment tap
 * target with face-icon endpoints turns the form into a 30-second ritual.
 *
 * Inverse semantics handled with the `direction` input:
 *  - "high-good" — high values are positive (energy, mood, motivation, sleep quality)
 *  - "high-bad"  — high values are negative (soreness, stress, fatigue)
 *
 * Color sweep adapts to direction so the "danger zone" is always on the right
 * end of bad scales and the left end of good scales.
 *
 * @example High-good (energy)
 * ```html
 * <app-rating-slider
 *   label="Energy Level"
 *   description="How much energy do you have today?"
 *   [value]="energy()"
 *   direction="high-good"
 *   lowLabel="Drained"
 *   highLabel="Charged"
 *   (valueChange)="energy.set($event)"
 * />
 * ```
 *
 * @example High-bad (soreness)
 * ```html
 * <app-rating-slider
 *   label="Muscle Soreness"
 *   [value]="soreness()"
 *   direction="high-bad"
 *   lowLabel="No soreness"
 *   highLabel="Very sore"
 *   (valueChange)="soreness.set($event)"
 * />
 * ```
 */

export type RatingDirection = "high-good" | "high-bad";

@Component({
  selector: "app-rating-slider",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="rating-slider">
      <!-- Header: label + current value badge -->
      <div class="rating-slider__head">
        <div class="rating-slider__label-group">
          <label [attr.for]="inputId()" class="rating-slider__label">
            {{ label() }}
          </label>
          @if (description()) {
            <p class="rating-slider__description">{{ description() }}</p>
          }
        </div>
        <div [class]="valueBadgeClass()" aria-hidden="true">
          @if (value() !== null) {
            <span class="rating-slider__value-num">{{ value() }}</span>
            <span class="rating-slider__value-max">/{{ max() }}</span>
          } @else {
            <span class="rating-slider__value-placeholder">—</span>
          }
        </div>
      </div>

      <!-- 10 tap targets -->
      <div
        class="rating-slider__track"
        role="radiogroup"
        [attr.aria-label]="label()"
      >
        @for (n of segments(); track n) {
          <button
            type="button"
            [id]="n === min() ? inputId() : null"
            [class]="segmentClass(n)"
            role="radio"
            [attr.aria-checked]="value() === n"
            [attr.aria-label]="n + ' of ' + max()"
            [attr.tabindex]="value() === n || (value() === null && n === min()) ? 0 : -1"
            (click)="selectValue(n)"
            (keydown)="onKeyDown($event, n)"
          >
            <span class="rating-slider__segment-num">{{ n }}</span>
          </button>
        }
      </div>

      <!-- Endpoint labels -->
      @if (lowLabel() || highLabel()) {
        <div class="rating-slider__endpoints">
          <span class="rating-slider__endpoint">{{ lowLabel() }}</span>
          <span class="rating-slider__endpoint">{{ highLabel() }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: "./rating-slider.component.scss",
})
export class RatingSliderComponent {
  /** Required: visible label (also used for aria-label on the group) */
  readonly label = input.required<string>();

  /** Optional supporting text shown beneath the label */
  readonly description = input<string>("");

  /** Current value (null = not yet rated) */
  readonly value = input<number | null>(null);

  /** Minimum value, default 1 */
  readonly min = input<number>(1);

  /** Maximum value, default 10 */
  readonly max = input<number>(10);

  /**
   * Whether high values are good or bad. Drives color sweep direction.
   * - "high-good" — green on the right (energy, mood)
   * - "high-bad"  — red on the right (soreness, stress)
   */
  readonly direction = input<RatingDirection>("high-good");

  /** Label below the leftmost segment (e.g. "Drained", "No soreness") */
  readonly lowLabel = input<string>("");

  /** Label below the rightmost segment (e.g. "Charged", "Very sore") */
  readonly highLabel = input<string>("");

  /** DOM id for the leftmost button — pair with an external <label for=""> */
  readonly inputId = input<string>("");

  /** Emits the new value when a segment is selected */
  readonly valueChange = output<number>();

  readonly segments = computed(() => {
    const out: number[] = [];
    for (let i = this.min(); i <= this.max(); i++) {
      out.push(i);
    }
    return out;
  });

  readonly valueBadgeClass = computed(() => {
    const classes = ["rating-slider__value"];
    const v = this.value();
    if (v === null) {
      return classes.concat("rating-slider__value--empty").join(" ");
    }
    return classes.concat(`rating-slider__value--${this.toneFor(v)}`).join(" ");
  });

  segmentClass(n: number): string {
    const v = this.value();
    const isSelected = v === n;
    const isFilled = v !== null && n <= v;
    const tone = this.toneFor(n);

    const classes = ["rating-slider__segment", `rating-slider__segment--${tone}`];
    if (isSelected) classes.push("rating-slider__segment--selected");
    if (isFilled) classes.push("rating-slider__segment--filled");
    return classes.join(" ");
  }

  /**
   * Maps a value to a tone bucket. The bucket flips based on direction:
   *   high-good → low values are danger, high are success
   *   high-bad  → low values are success, high are danger
   */
  private toneFor(n: number): "success" | "warning" | "danger" {
    const range = this.max() - this.min();
    if (range <= 0) return "success";
    const normalized = (n - this.min()) / range; // 0..1
    const goodness =
      this.direction() === "high-good" ? normalized : 1 - normalized;

    if (goodness >= 0.66) return "success";
    if (goodness >= 0.33) return "warning";
    return "danger";
  }

  selectValue(n: number): void {
    this.valueChange.emit(n);
  }

  onKeyDown(event: KeyboardEvent, currentSegment: number): void {
    const segs = this.segments();
    const idx = segs.indexOf(currentSegment);
    if (idx === -1) return;

    let nextIdx: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      nextIdx = Math.min(segs.length - 1, idx + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      nextIdx = Math.max(0, idx - 1);
    } else if (event.key === "Home") {
      nextIdx = 0;
    } else if (event.key === "End") {
      nextIdx = segs.length - 1;
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      this.selectValue(currentSegment);
      return;
    }

    if (nextIdx !== null) {
      event.preventDefault();
      this.selectValue(segs[nextIdx]);
    }
  }
}
