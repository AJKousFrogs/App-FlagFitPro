import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";

/**
 * Rating Slider — 10-segment tap-target replacement for 1-10 number inputs.
 *
 * - Inverse-semantics aware via `direction`:
 *   - "high-good" — high values are positive (energy, mood, sleep quality)
 *   - "high-bad"  — high values are negative (soreness, stress)
 * Color sweep adapts: green-on-right for high-good, red-on-right for high-bad.
 */

export type RatingDirection = "high-good" | "high-bad";

@Component({
  selector: "app-rating-slider",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="rating-slider">
      <div class="rating-slider__head">
        <div class="rating-slider__label-group">
          <label [attr.for]="inputId()" class="rating-slider__label">{{ label() }}</label>
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

      <div class="rating-slider__track" role="radiogroup" [attr.aria-label]="label()">
        @for (n of segments(); track n) {
          <button
            type="button"
            [id]="n === min() ? inputId() : null"
            [class]="segmentClass(n)"
            role="radio"
            [attr.aria-checked]="value() === n"
            [attr.aria-label]="n + ' of ' + max()"
            (click)="selectValue(n)"
            (keydown)="onKeyDown($event, n)"
          ><span class="rating-slider__segment-num">{{ n }}</span></button>
        }
      </div>

      @if (lowLabel() || highLabel()) {
        <div class="rating-slider__endpoints">
          <span>{{ lowLabel() }}</span>
          <span>{{ highLabel() }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: "./rating-slider.component.scss",
})
export class RatingSliderComponent {
  readonly label = input.required<string>();
  readonly description = input<string>("");
  readonly value = input<number | null>(null);
  readonly min = input<number>(1);
  readonly max = input<number>(10);
  readonly direction = input<RatingDirection>("high-good");
  readonly lowLabel = input<string>("");
  readonly highLabel = input<string>("");
  readonly inputId = input<string>("");
  readonly valueChange = output<number>();

  readonly segments = computed(() => {
    const out: number[] = [];
    for (let i = this.min(); i <= this.max(); i++) out.push(i);
    return out;
  });

  readonly valueBadgeClass = computed(() => {
    const classes = ["rating-slider__value"];
    const v = this.value();
    if (v === null) return classes.concat("rating-slider__value--empty").join(" ");
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

  private toneFor(n: number): "success" | "warning" | "danger" {
    const range = this.max() - this.min();
    if (range <= 0) return "success";
    const normalized = (n - this.min()) / range;
    const goodness = this.direction() === "high-good" ? normalized : 1 - normalized;
    if (goodness >= 0.66) return "success";
    if (goodness >= 0.33) return "warning";
    return "danger";
  }

  selectValue(n: number): void { this.valueChange.emit(n); }

  onKeyDown(event: KeyboardEvent, current: number): void {
    const segs = this.segments();
    const idx = segs.indexOf(current);
    if (idx === -1) return;
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(segs.length - 1, idx + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(0, idx - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = segs.length - 1;
    else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      this.selectValue(current);
      return;
    }
    if (next !== null) {
      event.preventDefault();
      this.selectValue(segs[next]);
    }
  }
}
